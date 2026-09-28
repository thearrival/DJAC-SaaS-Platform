/**
 * Onboarding service — persistence + orchestration.
 *
 * Extends the existing onboarding architecture (onboarding_progress /
 * organization_profiles_custom) with answer-level, versioned, auditable rows:
 *   • onboarding_responses        — one idempotent row per (user, version, question)
 *   • onboarding_events           — append-only timeline
 *   • onboarding_profile_history  — field-level change history
 *   • personalization_recommendations — persisted, explainable recommendations
 *
 * Every function is defensive: if the database is unavailable it degrades to an
 * empty/fallback result and NEVER throws into authentication or authorization.
 */

import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "./db";
import {
  onboardingResponses,
  onboardingEvents,
  onboardingProfileHistory,
  personalizationRecommendations,
  onboardingProgress,
  organizationProfilesCustom,
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

export type OnboardingActor = {
  userId: number;
  organizationId: number | null;
  sessionId: string;
  actorType?: "user" | "admin" | "system";
  actorId?: string | null;
  requestId?: string | null;
};

export type OnboardingState = {
  questionnaireVersion: number;
  organizationId: number | null;
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
  userId: number,
  organizationId: number | null
): Promise<OnboardingState> {
  const db = await getReadyDb();
  if (!db) return { ...EMPTY_STATE };

  try {
    const rows = await db
      .select()
      .from(onboardingResponses)
      .where(
        and(
          eq(onboardingResponses.userId, userId),
          eq(onboardingResponses.onboardingVersion, QUESTIONNAIRE_VERSION)
        )
      );

    const answers: Record<string, unknown> = {};
    for (const row of rows) answers[row.questionId] = row.answerValue;
    const profile = deriveProfile(answers);

    const [progress] = await db
      .select()
      .from(onboardingProgress)
      .where(eq(onboardingProgress.userId, userId))
      .limit(1);

    const recs = await db
      .select()
      .from(personalizationRecommendations)
      .where(
        and(
          eq(personalizationRecommendations.userId, userId),
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
      .where(eq(onboardingEvents.userId, userId))
      .orderBy(desc(onboardingEvents.createdAt))
      .limit(50);

    const recommendations: Recommendation[] = recs.map(r => ({
      moduleId: r.moduleId,
      priority: r.priority,
      reason: r.reason,
      ruleId: r.ruleId,
    }));

    return {
      questionnaireVersion: QUESTIONNAIRE_VERSION,
      organizationId: organizationId ?? null,
      answers,
      profile,
      recommendations:
        recommendations.length > 0
          ? recommendations
          : generatePersonalization(profile),
      firstAction: profile.objectives.length
        ? chooseFirstAction(profile)
        : null,
      completedAt: progress?.completedAt
        ? new Date(progress.completedAt).toISOString()
        : null,
      skipped: progress?.skipped ?? false,
      currentStep: progress?.currentStep ?? 0,
      timeline: events.map(e => ({
        eventType: e.eventType,
        stepNumber: e.stepNumber ?? null,
        createdAt: new Date(e.createdAt).toISOString(),
      })),
    };
  } catch {
    return { ...EMPTY_STATE };
  }
}

export async function getOnboardingTimeline(userId: number, limit = 200) {
  const db = await getReadyDb();
  if (!db) return [];
  try {
    return await db
      .select()
      .from(onboardingEvents)
      .where(eq(onboardingEvents.userId, userId))
      .orderBy(desc(onboardingEvents.createdAt))
      .limit(Math.min(Math.max(limit, 1), 500));
  } catch {
    return [];
  }
}

export async function getOnboardingResponsesForUser(userId: number) {
  const db = await getReadyDb();
  if (!db) return { responses: [], history: [] };
  try {
    const responses = await db
      .select()
      .from(onboardingResponses)
      .where(eq(onboardingResponses.userId, userId))
      .orderBy(onboardingResponses.stepNumber);
    const history = await db
      .select()
      .from(onboardingProfileHistory)
      .where(eq(onboardingProfileHistory.userId, userId))
      .orderBy(desc(onboardingProfileHistory.createdAt))
      .limit(200);
    return { responses, history };
  } catch {
    return { responses: [], history: [] };
  }
}

// ── Writes ────────────────────────────────────────────────────────────────────

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
      userId: actor.userId,
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

/**
 * Persist a single answer idempotently. Re-submitting the same question updates
 * the existing row (no duplicates) and records a history entry only when the
 * value actually changed.
 */
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
    const result = await db.transaction(async tx => {
      const [existing] = await tx
        .select({ answerValue: onboardingResponses.answerValue })
        .from(onboardingResponses)
        .where(
          and(
            eq(onboardingResponses.userId, actor.userId),
            eq(onboardingResponses.onboardingVersion, QUESTIONNAIRE_VERSION),
            eq(onboardingResponses.questionId, input.questionId)
          )
        )
        .limit(1);

      const previous = existing?.answerValue ?? null;
      const changed = JSON.stringify(previous) !== JSON.stringify(input.value);

      await tx
        .insert(onboardingResponses)
        .values({
          userId: actor.userId,
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
          target: [
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
          userId: actor.userId,
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

    // Keep the legacy progress table + org profile in sync (best-effort).
    await syncDerivedState(actor, { [input.questionId]: input.value });
    await recordEvent(
      actor,
      "question_answered",
      { questionId: input.questionId, changed: result },
      input.stepNumber
    );
    return { ok: true, changed: result };
  } catch {
    // Retryable — surface a clear error so the UI can offer recovery.
    return { ok: false, changed: false, error: "Could not save that answer" };
  }
}

/** Merge the current answers into the legacy tables the rest of the app reads. */
async function syncDerivedState(
  actor: OnboardingActor,
  answers: Record<string, unknown>
) {
  const db = await getReadyDb();
  if (!db) return;
  try {
    const profile = deriveProfile(answers);
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

/**
 * Finalise onboarding: persist recommendations + completion atomically and
 * record the completion event. Safe to call multiple times (idempotent).
 */
export async function completeOnboarding(
  actor: OnboardingActor
): Promise<{ ok: boolean; recommendations: Recommendation[] }> {
  const db = await getReadyDb();
  if (!db) return { ok: true, recommendations: [] };

  try {
    const state = await getOnboardingState(actor.userId, actor.organizationId);
    const recommendations = generatePersonalization(state.profile);

    await db.transaction(async tx => {
      for (const rec of recommendations) {
        await tx
          .insert(personalizationRecommendations)
          .values({
            userId: actor.userId,
            organizationId: actor.organizationId,
            moduleId: rec.moduleId,
            priority: rec.priority,
            reason: rec.reason,
            ruleId: rec.ruleId,
            status: "active",
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: [
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
  if (db) {
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

/** Dismiss a recommendation so it no longer surfaces (behavior → personalization). */
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
          eq(personalizationRecommendations.userId, actor.userId),
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

/**
 * Record a behavioural signal. Behaviour adjusts PERSONALIZATION only — it never
 * affects authorization. Opening a module nudges its priority up; completing a
 * first action records a success event for analytics.
 */
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
            eq(personalizationRecommendations.userId, actor.userId),
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
            eq(personalizationRecommendations.userId, actor.userId),
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
    return { totals: {}, byIndustry: [], byObjective: [], funnel: [] };
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
      FROM "users"
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
