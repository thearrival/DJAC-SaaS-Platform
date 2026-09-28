/**
 * Onboarding service — persistence + orchestration.
 *
 * Extends the existing onboarding architecture with answer-level, versioned,
 * auditable rows. IMPORTANT: the platform has TWO identity kinds —
 *   • OAuth users      → users.id            (positive)
 *   • Local (email/pw) → localUsers.id       (ctx.user.id is a synthetic negative)
 * so every row carries BOTH `userId` and `localUserId`, exactly like the rest of
 * the schema (userOnboarding, organizationMembers, …). This is essential: the
 * primary auth path is local, and its synthetic id is NOT a users.id.
 *
 * Every function is defensive: if the database is unavailable it degrades to an
 * empty/fallback result and NEVER throws into authentication or authorization.
 */

import { and, desc, eq, or, sql } from "drizzle-orm";
import { getDb } from "./db";
import {
  onboardingResponses,
  onboardingEvents,
  onboardingProfileHistory,
  personalizationRecommendations,
  onboardingProgress,
  organizationProfilesCustom,
  users,
  localUsers,
} from "../drizzle/schema";
import {
  QUESTIONNAIRE_VERSION,
  QUESTIONS,
  deriveProfile,
  generatePersonalization,
  chooseFirstAction,
  type Recommendation,
} from "./services/personalization/engine";
import { ensureOnboardingSchema } from "./_core/onboarding-schema";

export type OnboardingIdentity = {
  userId: number | null;
  localUserId: number | null;
};

export type OnboardingActor = OnboardingIdentity & {
  organizationId: number | null;
  sessionId: string;
  actorType?: "user" | "admin" | "system";
  actorId?: string | null;
  requestId?: string | null;
};

export type OnboardingState = {
  questionnaireVersion: number;
  organizationId: number | null;
  shouldOnboard: boolean;
  answers: Record<string, unknown>;
  profile: ReturnType<typeof deriveProfile>;
  recommendations: Recommendation[];
  firstAction: { moduleId: string; ruleId: string } | null;
  completedAt: string | null;
  skipped: boolean;
  currentStep: number;
  timeline: Array<{
    eventType: string;
    stepNumber: number | null;
    createdAt: string;
  }>;
};

const EMPTY_STATE: OnboardingState = {
  questionnaireVersion: QUESTIONNAIRE_VERSION,
  organizationId: null,
  shouldOnboard: false,
  answers: {},
  profile: {
    objectives: [],
    industry: null,
    role: null,
    experience: null,
    immediateGoal: null,
  },
  recommendations: [],
  firstAction: null,
  completedAt: null,
  skipped: false,
  currentStep: 0,
  timeline: [],
};

/** getDb + idempotent schema bootstrap (once per process). */
async function getReadyDb() {
  const raw = await getDb();
  if (!raw) return null;
  await ensureOnboardingSchema(raw);
  return raw;
}

function isValidQuestion(questionId: string): boolean {
  return QUESTIONS.some(q => q.id === questionId);
}

// ── Reads ─────────────────────────────────────────────────────────────────────

export async function getOnboardingState(
  identity: OnboardingIdentity,
  organizationId: number | null
): Promise<OnboardingState> {
  const db = await getReadyDb();
  if (!db || (identity.userId == null && identity.localUserId == null)) {
    return { ...EMPTY_STATE, organizationId: organizationId ?? null };
  }

  const isLocal = identity.localUserId != null;

  try {
    const rows = await db
      .select()
      .from(onboardingResponses)
      .where(
        and(
          isLocal
            ? eq(onboardingResponses.localUserId, identity.localUserId!)
            : eq(onboardingResponses.userId, identity.userId!),
          eq(onboardingResponses.onboardingVersion, QUESTIONNAIRE_VERSION)
        )
      );

    const answers: Record<string, unknown> = {};
    for (const row of rows) answers[row.questionId] = row.answerValue;
    const profile = deriveProfile(answers);

    const [progress] = await db
      .select()
      .from(onboardingProgress)
      .where(
        isLocal
          ? eq(onboardingProgress.userId, -(50_000 + identity.localUserId!))
          : eq(onboardingProgress.userId, identity.userId!)
      )
      .limit(1);

    const recs = await db
      .select()
      .from(personalizationRecommendations)
      .where(
        and(
          isLocal
            ? eq(
                personalizationRecommendations.localUserId,
                identity.localUserId!
              )
            : eq(personalizationRecommendations.userId, identity.userId!),
          eq(personalizationRecommendations.status, "active")
        )
      )
      .orderBy(desc(personalizationRecommendations.priority));

    const events = await db
      .select({
        eventType: onboardingEvents.eventType,
        stepNumber: onboardingEvents.stepNumber,
        createdAt: onboardingEvents.createdAt,
      })
      .from(onboardingEvents)
      .where(
        isLocal
          ? eq(onboardingEvents.localUserId, identity.localUserId!)
          : eq(onboardingEvents.userId, identity.userId!)
      )
      .orderBy(desc(onboardingEvents.createdAt))
      .limit(50);

    // Local users are not stored in the legacy onboarding_progress table, so
    // completion/skip are derived from the event timeline (which exists for all
    // identity kinds).
    const completedEvent = events.find(
      e => e.eventType === "onboarding_completed"
    );
    const skippedEvent = events.some(e => e.eventType === "onboarding_skipped");
    const resolvedCompletedAt = progress?.completedAt
      ? new Date(progress.completedAt).toISOString()
      : completedEvent
        ? new Date(completedEvent.createdAt).toISOString()
        : null;
    const resolvedSkipped = progress?.skipped ?? skippedEvent;

    // Account age for the "new user" onboarding gate.
    let shouldOnboard = false;
    try {
      const account = isLocal
        ? (
            await db
              .select({ createdAt: localUsers.createdAt })
              .from(localUsers)
              .where(eq(localUsers.id, identity.localUserId!))
              .limit(1)
          )[0]
        : (
            await db
              .select({ createdAt: users.createdAt })
              .from(users)
              .where(eq(users.id, identity.userId!))
              .limit(1)
          )[0];
      const ageMs = account?.createdAt
        ? Date.now() - new Date(account.createdAt).getTime()
        : Number.POSITIVE_INFINITY;
      const isNewAccount = ageMs <= 14 * 24 * 60 * 60 * 1000;
      shouldOnboard =
        !resolvedCompletedAt &&
        !resolvedSkipped &&
        Object.keys(answers).length === 0 &&
        isNewAccount;
    } catch {
      shouldOnboard = false;
    }

    const recommendations: Recommendation[] = recs.map(r => ({
      moduleId: r.moduleId,
      priority: r.priority,
      reason: r.reason,
      ruleId: r.ruleId,
    }));

    return {
      questionnaireVersion: QUESTIONNAIRE_VERSION,
      organizationId: organizationId ?? null,
      shouldOnboard,
      answers,
      profile,
      recommendations:
        recommendations.length > 0
          ? recommendations
          : generatePersonalization(profile),
      firstAction: profile.objectives.length
        ? chooseFirstAction(profile)
        : null,
      completedAt: resolvedCompletedAt,
      skipped: resolvedSkipped,
      currentStep: progress?.currentStep ?? 0,
      timeline: events.map(e => ({
        eventType: e.eventType,
        stepNumber: e.stepNumber ?? null,
        createdAt: new Date(e.createdAt).toISOString(),
      })),
    };
  } catch {
    return { ...EMPTY_STATE, organizationId: organizationId ?? null };
  }
}

/** Owner-console helper: resolve by users.id first, then localUsers.id. */
export async function getOnboardingStateForAnyId(id: number) {
  const byUser = await getOnboardingState(
    { userId: id, localUserId: null },
    null
  );
  if (Object.keys(byUser.answers).length > 0 || byUser.completedAt)
    return byUser;
  return getOnboardingState({ userId: null, localUserId: id }, null);
}

export async function getOnboardingTimelineForAnyId(id: number, limit = 200) {
  const db = await getReadyDb();
  if (!db) return [];
  try {
    return await db
      .select()
      .from(onboardingEvents)
      .where(
        or(
          eq(onboardingEvents.userId, id),
          eq(onboardingEvents.localUserId, id)
        )
      )
      .orderBy(desc(onboardingEvents.createdAt))
      .limit(Math.min(Math.max(limit, 1), 500));
  } catch {
    return [];
  }
}

export async function getOnboardingResponsesForAnyId(id: number) {
  const db = await getReadyDb();
  if (!db) return { responses: [], history: [] };
  try {
    const responses = await db
      .select()
      .from(onboardingResponses)
      .where(
        or(
          eq(onboardingResponses.userId, id),
          eq(onboardingResponses.localUserId, id)
        )
      )
      .orderBy(onboardingResponses.stepNumber);
    const history = await db
      .select()
      .from(onboardingProfileHistory)
      .where(
        or(
          eq(onboardingProfileHistory.userId, id),
          eq(onboardingProfileHistory.localUserId, id)
        )
      )
      .orderBy(desc(onboardingProfileHistory.createdAt))
      .limit(200);
    return { responses, history };
  } catch {
    return { responses: [], history: [] };
  }
}

// ── Writes ────────────────────────────────────────────────────────────────────

function identityColumns(actor: OnboardingIdentity) {
  return {
    userId: actor.userId ?? null,
    localUserId: actor.localUserId ?? null,
  };
}

function identityWhere<T extends { userId: unknown; localUserId: unknown }>(
  table: T,
  actor: OnboardingIdentity
) {
  const t = table as unknown as {
    userId: never;
    localUserId: never;
  };
  return actor.localUserId != null
    ? eq(t.localUserId, actor.localUserId as never)
    : eq(t.userId, actor.userId as never);
}

async function recordEvent(
  actor: OnboardingActor,
  eventType: string,
  payload: Record<string, unknown> = {},
  stepNumber?: number
) {
  const db = await getReadyDb();
  if (!db) return;
  try {
    await db.insert(onboardingEvents).values({
      ...identityColumns(actor),
      organizationId: actor.organizationId,
      sessionId: actor.sessionId,
      eventType,
      stepNumber: stepNumber ?? null,
      actorType: actor.actorType ?? "user",
      actorId: actor.actorId ?? null,
      requestId: actor.requestId ?? null,
      onboardingVersion: QUESTIONNAIRE_VERSION,
      payload,
    });
  } catch {
    // best-effort
  }
}

export async function submitAnswer(
  actor: OnboardingActor,
  input: {
    questionId: string;
    value: unknown;
    stepNumber: number;
    source?: string;
  }
): Promise<{ ok: boolean; changed: boolean; error?: string }> {
  if (!isValidQuestion(input.questionId)) {
    return { ok: false, changed: false, error: "Unknown question" };
  }
  const db = await getReadyDb();
  if (!db) return { ok: true, changed: false };

  try {
    const where = and(
      identityWhere(onboardingResponses, actor),
      eq(onboardingResponses.onboardingVersion, QUESTIONNAIRE_VERSION),
      eq(onboardingResponses.questionId, input.questionId)
    );

    const result = await db.transaction(async tx => {
      const [existing] = await tx
        .select({ answerValue: onboardingResponses.answerValue })
        .from(onboardingResponses)
        .where(where)
        .limit(1);

      const previous = existing?.answerValue ?? null;
      const changed = JSON.stringify(previous) !== JSON.stringify(input.value);

      await tx
        .insert(onboardingResponses)
        .values({
          ...identityColumns(actor),
          organizationId: actor.organizationId,
          sessionId: actor.sessionId,
          onboardingVersion: QUESTIONNAIRE_VERSION,
          questionId: input.questionId,
          questionVersion:
            QUESTIONS.find(q => q.id === input.questionId)?.version ?? 1,
          stepNumber: input.stepNumber,
          answerValue: input.value as never,
          source: input.source ?? "onboarding",
          submittedAt: new Date(),
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target:
            actor.localUserId != null
              ? [
                  onboardingResponses.localUserId,
                  onboardingResponses.onboardingVersion,
                  onboardingResponses.questionId,
                ]
              : [
                  onboardingResponses.userId,
                  onboardingResponses.onboardingVersion,
                  onboardingResponses.questionId,
                ],
          set: {
            answerValue: input.value as never,
            stepNumber: input.stepNumber,
            sessionId: actor.sessionId,
            source: input.source ?? "onboarding",
            submittedAt: new Date(),
            updatedAt: new Date(),
          },
        });

      if (changed) {
        await tx.insert(onboardingProfileHistory).values({
          ...identityColumns(actor),
          organizationId: actor.organizationId,
          field: input.questionId,
          previousValue: previous as never,
          newValue: input.value as never,
          actorType: actor.actorType ?? "user",
          actorId: actor.actorId ?? null,
          source: input.source ?? "onboarding",
          onboardingVersion: QUESTIONNAIRE_VERSION,
        });
      }
      return changed;
    });

    await syncDerivedState(actor, { [input.questionId]: input.value });
    await recordEvent(
      actor,
      "question_answered",
      { questionId: input.questionId, changed: result },
      input.stepNumber
    );
    return { ok: true, changed: result };
  } catch {
    return { ok: false, changed: false, error: "Could not save that answer" };
  }
}

/** Merge into the legacy tables the rest of the app reads (best-effort). */
async function syncDerivedState(
  actor: OnboardingActor,
  answers: Record<string, unknown>
) {
  const db = await getReadyDb();
  if (!db) return;
  try {
    const profile = deriveProfile(answers);
    // onboarding_progress is keyed on users.id only — safe for OAuth users.
    if (actor.userId != null) {
      const completedSteps = Object.keys(answers);
      await db
        .insert(onboardingProgress)
        .values({
          userId: actor.userId,
          currentStep: Math.max(0, completedSteps.length),
          completedSteps,
          responses: answers as Record<string, unknown>,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: onboardingProgress.userId,
          set: {
            completedSteps,
            responses: answers as Record<string, unknown>,
            updatedAt: new Date(),
          },
        });
    }

    if (actor.organizationId != null) {
      await db
        .insert(organizationProfilesCustom)
        .values({
          organizationId: actor.organizationId,
          industry: profile.industry,
          complianceMaturity: profile.experience,
          businessObjectives: profile.objectives,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: organizationProfilesCustom.organizationId,
          set: {
            industry: profile.industry,
            complianceMaturity: profile.experience,
            businessObjectives: profile.objectives,
            updatedAt: new Date(),
          },
        });
    }
  } catch {
    // best-effort consolidation only
  }
}

export async function completeOnboarding(
  actor: OnboardingActor
): Promise<{ ok: boolean; recommendations: Recommendation[] }> {
  const db = await getReadyDb();
  if (!db) return { ok: true, recommendations: [] };

  try {
    const state = await getOnboardingState(actor, actor.organizationId);
    const recommendations = generatePersonalization(state.profile);

    await db.transaction(async tx => {
      for (const rec of recommendations) {
        await tx
          .insert(personalizationRecommendations)
          .values({
            ...identityColumns(actor),
            organizationId: actor.organizationId,
            moduleId: rec.moduleId,
            priority: rec.priority,
            reason: rec.reason,
            ruleId: rec.ruleId,
            status: "active",
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target:
              actor.localUserId != null
                ? [
                    personalizationRecommendations.localUserId,
                    personalizationRecommendations.moduleId,
                  ]
                : [
                    personalizationRecommendations.userId,
                    personalizationRecommendations.moduleId,
                  ],
            set: {
              priority: rec.priority,
              reason: rec.reason,
              ruleId: rec.ruleId,
              status: "active",
              updatedAt: new Date(),
            },
          });
      }

      const now = new Date();
      if (actor.userId != null) {
        await tx
          .insert(onboardingProgress)
          .values({
            userId: actor.userId,
            completedAt: now,
            responses: state.answers as Record<string, unknown>,
            updatedAt: now,
          })
          .onConflictDoUpdate({
            target: onboardingProgress.userId,
            set: { completedAt: now, updatedAt: now },
          });
      }

      if (actor.organizationId != null) {
        await tx
          .insert(organizationProfilesCustom)
          .values({
            organizationId: actor.organizationId,
            onboardingCompletedAt: now,
          })
          .onConflictDoUpdate({
            target: organizationProfilesCustom.organizationId,
            set: { onboardingCompletedAt: now, updatedAt: now },
          });
      }
    });

    await recordEvent(actor, "onboarding_completed", {
      recommendationCount: recommendations.length,
    });
    return { ok: true, recommendations };
  } catch {
    return { ok: false, recommendations: [] };
  }
}

export async function recordOnboardingSkipped(actor: OnboardingActor) {
  const db = await getReadyDb();
  if (db && actor.userId != null) {
    try {
      await db
        .insert(onboardingProgress)
        .values({ userId: actor.userId, skipped: true, updatedAt: new Date() })
        .onConflictDoUpdate({
          target: onboardingProgress.userId,
          set: { skipped: true, updatedAt: new Date() },
        });
    } catch {
      /* best-effort */
    }
  }
  await recordEvent(actor, "onboarding_skipped");
}

export async function dismissRecommendation(
  actor: OnboardingActor,
  moduleId: string
): Promise<{ ok: boolean }> {
  const db = await getReadyDb();
  if (!db) return { ok: true };
  try {
    await db
      .update(personalizationRecommendations)
      .set({ status: "dismissed", updatedAt: new Date() })
      .where(
        and(
          identityWhere(personalizationRecommendations, actor),
          eq(personalizationRecommendations.moduleId, moduleId)
        )
      );
    await recordEvent(actor, "recommendation_dismissed", { moduleId });
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export type ModuleSignal =
  | "module_opened"
  | "first_action_started"
  | "first_action_completed";

export async function recordModuleSignal(
  actor: OnboardingActor,
  moduleId: string,
  signal: ModuleSignal
): Promise<{ ok: boolean }> {
  const db = await getReadyDb();
  if (!db) return { ok: true };
  try {
    if (signal === "module_opened") {
      await db
        .update(personalizationRecommendations)
        .set({
          priority: sql`LEAST(100, ${personalizationRecommendations.priority} + 5)`,
          updatedAt: new Date(),
        })
        .where(
          and(
            identityWhere(personalizationRecommendations, actor),
            eq(personalizationRecommendations.moduleId, moduleId),
            eq(personalizationRecommendations.status, "active")
          )
        );
    }
    if (signal === "first_action_completed") {
      await db
        .update(personalizationRecommendations)
        .set({ status: "completed", updatedAt: new Date() })
        .where(
          and(
            identityWhere(personalizationRecommendations, actor),
            eq(personalizationRecommendations.moduleId, moduleId)
          )
        );
    }
    await recordEvent(actor, signal, { moduleId });
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

// ── Owner-console intelligence (aggregate, tenant-safe) ───────────────────────

export async function getOnboardingIntelligence(windowDays = 30) {
  const db = await getReadyDb();
  if (!db) {
    return { totals: {}, byIndustry: [], byObjective: [], byModule: [] };
  }
  const days = Math.min(Math.max(windowDays, 1), 365);
  try {
    const totals = await db.execute(sql`
      SELECT
        COUNT(*)::int AS "started",
        COUNT(*) FILTER (WHERE "completed_at" IS NOT NULL)::int AS "completed",
        COUNT(*) FILTER (WHERE "skipped" = true)::int AS "skipped",
        COUNT(*) FILTER (WHERE "completed_at" IS NULL AND "skipped" IS NOT TRUE)::int AS "in_progress"
      FROM "onboarding_progress"
    `);

    const byIndustry = await db.execute(sql`
      SELECT "industry", COUNT(*)::int AS "count"
      FROM "organization_profiles_custom"
      WHERE "industry" IS NOT NULL
      GROUP BY "industry"
      ORDER BY "count" DESC
      LIMIT 20
    `);

    const byObjective = await db.execute(sql`
      SELECT value AS "objective", COUNT(*)::int AS "count"
      FROM "onboarding_responses",
        LATERAL jsonb_array_elements_text("answer_value") AS value
      WHERE "question_id" = 'primary_objective'
      GROUP BY value
      ORDER BY "count" DESC
      LIMIT 20
    `);

    const byModule = await db.execute(sql`
      SELECT "module_id", COUNT(*)::int AS "count"
      FROM "personalization_recommendations"
      WHERE "status" <> 'dismissed'
      GROUP BY "module_id"
      ORDER BY "count" DESC
      LIMIT 20
    `);

    const newUsers = await db.execute(sql`
      SELECT date_trunc('day', "created_at")::date AS "day", COUNT(*)::int AS "count"
      FROM "localUsers"
      WHERE "created_at" >= now() - (${days} * interval '1 day')
      GROUP BY 1
      ORDER BY 1 DESC
      LIMIT 60
    `);

    const engagement = await db.execute(sql`
      SELECT "event_type", COUNT(*)::int AS "count"
      FROM "onboarding_events"
      WHERE "created_at" >= now() - (${days} * interval '1 day')
      GROUP BY 1
      ORDER BY 2 DESC
      LIMIT 30
    `);

    const funnel = await db.execute(sql`
      SELECT date_trunc('day', "created_at")::date AS "day", COUNT(*)::int AS "events"
      FROM "onboarding_events"
      WHERE "created_at" >= now() - (${days} * interval '1 day')
      GROUP BY 1
      ORDER BY 1 DESC
      LIMIT 60
    `);

    return {
      windowDays: days,
      totals: totals.rows?.[0] ?? {},
      byIndustry: byIndustry.rows ?? [],
      byObjective: byObjective.rows ?? [],
      byModule: byModule.rows ?? [],
      newUsers: newUsers.rows ?? [],
      engagement: engagement.rows ?? [],
      funnel: funnel.rows ?? [],
    };
  } catch {
    return {
      totals: {},
      byIndustry: [],
      byObjective: [],
      byModule: [],
      newUsers: [],
      engagement: [],
      funnel: [],
    };
  }
}
