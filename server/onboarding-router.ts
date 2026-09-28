import { z } from "zod";
import { eq } from "drizzle-orm";
import {
  onboardingProgress,
  organizationProfilesCustom,
} from "../drizzle/schema";
import { getDb } from "./db";
import { protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { checkRateLimit } from "./_core/rateLimiter";
import { recordUserInteraction } from "./interaction-logger";
import type { TrpcContext } from "./_core/context";
import {
  getOnboardingState,
  submitAnswer as persistAnswer,
  completeOnboarding,
  dismissRecommendation,
  recordModuleSignal,
  type OnboardingActor,
} from "./onboarding-service";
import { getQuestionnaire } from "./services/personalization/engine";

function actorFromCtx(ctx: TrpcContext, sessionId?: string): OnboardingActor {
  const userId = ctx.user?.id ?? 0;
  return {
    userId,
    organizationId: ctx.organizationId ?? null,
    sessionId: sessionId ?? `sess-${userId}`,
    actorType: "user",
    actorId: userId ? String(userId) : null,
  };
}

const ONBOARD_LIMIT = 20;
const ONBOARD_WINDOW_MS = 60_000;

const onboardingResponsesSchema = z.object({
  frameworks: z.array(z.string().min(1)).max(20).optional(),
  objectives: z.array(z.string().min(1)).max(12).optional(),
  organization: z
    .object({
      name: z.string().min(1).max(255).optional(),
      industry: z.string().max(120).optional(),
      employeeRange: z.string().max(30).optional(),
      country: z.string().max(120).optional(),
    })
    .optional(),
  profile: z
    .object({
      name: z.string().max(255).optional(),
      jobTitle: z.string().max(255).optional(),
      complianceExperience: z
        .enum(["beginner", "intermediate", "expert"])
        .optional(),
    })
    .optional(),
});

export const onboardingRouter = router({
  getProgress: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db)
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database unavailable",
      });

    const rows = await db
      .select()
      .from(onboardingProgress)
      .where(eq(onboardingProgress.userId, ctx.user.id));
    return rows[0] ?? null;
  }),

  updateProgress: protectedProcedure
    .input(
      z.object({
        step: z.number().int().min(0).max(6),
        responses: onboardingResponsesSchema.optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });

      const existing = await db
        .select()
        .from(onboardingProgress)
        .where(eq(onboardingProgress.userId, ctx.user.id));

      const row = existing[0];

      if (row) {
        const completed = new Set((row.completedSteps as string[]) ?? []);
        completed.add(String(input.step));
        await db
          .update(onboardingProgress)
          .set({
            currentStep: input.step,
            completedSteps: Array.from(completed),
            responses: input.responses ?? undefined,
            updatedAt: new Date(),
          })
          .where(eq(onboardingProgress.userId, ctx.user.id));
      } else {
        await db.insert(onboardingProgress).values({
          userId: ctx.user.id,
          currentStep: input.step,
          completedSteps: [String(input.step)],
          responses: input.responses ?? {},
        });
      }

      if (input.responses?.organization && ctx.organizationId) {
        await db
          .insert(organizationProfilesCustom)
          .values({
            organizationId: ctx.organizationId,
            industry: input.responses.organization.industry,
            employeeRange: input.responses.organization.employeeRange,
          })
          .onConflictDoUpdate({
            target: organizationProfilesCustom.organizationId,
            set: {
              industry: input.responses.organization.industry,
              employeeRange: input.responses.organization.employeeRange,
              updatedAt: new Date(),
            },
          });
      }

      return { ok: true };
    }),

  skip: protectedProcedure
    .input(z.object({}))
    .mutation(async ({ ctx, input: _input }) => {
      const rl = await checkRateLimit(
        `onboard:skip:${ctx.user.id}`,
        ONBOARD_LIMIT,
        ONBOARD_WINDOW_MS
      );
      if (!rl.allowed) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Rate limit exceeded.",
        });
      }
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });

      const existing = await db
        .select()
        .from(onboardingProgress)
        .where(eq(onboardingProgress.userId, ctx.user.id));

      if (existing[0]) {
        if (existing[0].skipped) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Onboarding already skipped.",
          });
        }
        await db
          .update(onboardingProgress)
          .set({ skipped: true, updatedAt: new Date() })
          .where(eq(onboardingProgress.userId, ctx.user.id));
      } else {
        await db.insert(onboardingProgress).values({
          userId: ctx.user.id,
          skipped: true,
        });
      }

      return { ok: true };
    }),

  // ── Intelligent onboarding (answer-level, versioned, auditable) ─────────────

  /** Versioned questionnaire definition (stable ids; client localizes labels). */
  getQuestionnaire: protectedProcedure.query(async () => getQuestionnaire()),

  /** Server-side state for resume + personalization. */
  getState: protectedProcedure.query(async ({ ctx }) =>
    getOnboardingState(ctx.user.id, ctx.organizationId ?? null)
  ),

  /** Persist a single answer idempotently (no duplicate rows on retry). */
  submitAnswer: protectedProcedure
    .input(
      z.object({
        questionId: z.string().min(1).max(80),
        value: z.union([
          z.string().max(500),
          z.array(z.string().max(500)).max(20),
        ]),
        stepNumber: z.number().int().min(0).max(20),
        sessionId: z.string().min(1).max(64).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const rl = await checkRateLimit(
        `onboard:answer:${ctx.user.id}`,
        120,
        ONBOARD_WINDOW_MS
      );
      if (!rl.allowed) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Rate limit exceeded.",
        });
      }
      const actor = actorFromCtx(ctx, input.sessionId);
      const result = await persistAnswer(actor, {
        questionId: input.questionId,
        value: input.value,
        stepNumber: input.stepNumber,
      });
      if (!result.ok) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: result.error ?? "Could not save that answer.",
        });
      }
      void recordUserInteraction(ctx, {
        context: "onboarding",
        action: "question_answered",
        entityType: "onboarding",
        outputRef: { questionId: input.questionId, changed: result.changed },
      });
      return result;
    }),

  /** Persisted, explainable recommendations (derived server-side). */
  getRecommendations: protectedProcedure.query(async ({ ctx }) => {
    const state = await getOnboardingState(
      ctx.user.id,
      ctx.organizationId ?? null
    );
    return {
      recommendations: state.recommendations,
      firstAction: state.firstAction,
      profile: state.profile,
      completedAt: state.completedAt,
    };
  }),

  /** Finalise: persist recommendations + completion atomically (idempotent). */
  complete: protectedProcedure
    .input(
      z.object({ sessionId: z.string().min(1).max(64).optional() }).optional()
    )
    .mutation(async ({ ctx, input }) => {
      const actor = actorFromCtx(ctx, input?.sessionId);
      const result = await completeOnboarding(actor);
      if (!result.ok) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not complete onboarding.",
        });
      }
      void recordUserInteraction(ctx, {
        context: "onboarding",
        action: "onboarding_completed",
        entityType: "onboarding",
        outputRef: { recommendations: result.recommendations.length },
      });
      return { ok: true, recommendations: result.recommendations };
    }),

  /** Dismiss a recommendation (behaviour → personalization only). */
  dismissRecommendation: protectedProcedure
    .input(z.object({ moduleId: z.string().min(1).max(80) }))
    .mutation(async ({ ctx, input }) =>
      dismissRecommendation(actorFromCtx(ctx), input.moduleId)
    ),

  /** Record a behavioural signal; adjusts personalization, never authorization. */
  recordModuleSignal: protectedProcedure
    .input(
      z.object({
        moduleId: z.string().min(1).max(80),
        signal: z.enum([
          "module_opened",
          "first_action_started",
          "first_action_completed",
        ]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const rl = await checkRateLimit(
        `onboard:signal:${ctx.user.id}`,
        120,
        ONBOARD_WINDOW_MS
      );
      if (!rl.allowed) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Rate limit exceeded.",
        });
      }
      void recordUserInteraction(ctx, {
        context: "onboarding",
        action: input.signal,
        entityType: "module",
        outputRef: { moduleId: input.moduleId },
      });
      return recordModuleSignal(
        actorFromCtx(ctx),
        input.moduleId,
        input.signal
      );
    }),
});
