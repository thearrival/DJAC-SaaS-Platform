import { z } from "zod";
import { eq } from "drizzle-orm";
import {
  onboardingProgress,
  organizationProfilesCustom,
} from "../drizzle/schema";
import { getDb } from "./db";
import { protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";

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

  skip: protectedProcedure.mutation(async ({ ctx }) => {
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

  complete: protectedProcedure.mutation(async ({ ctx }) => {
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
      await db
        .update(onboardingProgress)
        .set({ completedAt: new Date(), updatedAt: new Date() })
        .where(eq(onboardingProgress.userId, ctx.user.id));
    } else {
      await db.insert(onboardingProgress).values({
        userId: ctx.user.id,
        completedAt: new Date(),
      });
    }

    return { ok: true };
  }),
});
