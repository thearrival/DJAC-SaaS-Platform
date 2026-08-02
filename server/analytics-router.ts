import { z } from "zod";
import { eq, desc, sql } from "drizzle-orm";
import { analyticsEvents, userActivitySummary } from "../drizzle/schema";
import { getDb } from "./db";
import { protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";

export const analyticsRouter = router({
  track: protectedProcedure
    .input(
      z.object({
        event: z.string().min(1).max(100),
        category: z.string().min(1).max(50),
        properties: z.record(z.string(), z.unknown()).optional(),
        sessionId: z.string().max(64).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });

      await db.insert(analyticsEvents).values({
        userId: ctx.user.id,
        organizationId: ctx.organizationId ?? 0,
        event: input.event,
        category: input.category,
        properties: input.properties ?? {},
        sessionId: input.sessionId,
      });

      await db
        .insert(userActivitySummary)
        .values({
          userId: ctx.user.id,
          totalSessions: input.sessionId ? 1 : 0,
          totalEvents: 1,
          lastActiveAt: new Date(),
        })
        .onConflictDoUpdate({
          target: userActivitySummary.userId,
          set: {
            totalEvents: sql`${userActivitySummary.totalEvents} + 1`,
            lastActiveAt: new Date(),
          },
        });

      return { ok: true };
    }),

  getUserMetrics: protectedProcedure
    .input(
      z.object({
        days: z.number().int().min(1).max(365).optional(),
      })
    )
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });

      const rows = await db
        .select()
        .from(userActivitySummary)
        .where(eq(userActivitySummary.userId, ctx.user.id));

      const summary = rows[0];
      return {
        totalEvents: summary?.totalEvents ?? 0,
        totalSessions: summary?.totalSessions ?? 0,
        lastActiveAt: summary?.lastActiveAt?.toISOString() ?? null,
        activationScore: summary?.activationScore ?? 0,
        healthScore: summary?.healthScore ?? 0,
      };
    }),

  getRecentEvents: protectedProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(500).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });

      const rows = await db
        .select()
        .from(analyticsEvents)
        .where(eq(analyticsEvents.userId, ctx.user.id))
        .orderBy(desc(analyticsEvents.createdAt))
        .limit(input.limit);

      return rows;
    }),
});
