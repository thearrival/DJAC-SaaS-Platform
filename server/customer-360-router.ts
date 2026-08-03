import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { users, analyticsEvents, userActivitySummary } from "../drizzle/schema";
import { getDb } from "./db";
import { adminProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";

export const customer360Router = router({
  list: adminProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(100).default(20),
        offset: z.number().int().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "DB unavailable",
        });

      const userRows = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          status: users.status,
          createdAt: users.createdAt,
        })
        .from(users)
        .orderBy(desc(users.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return userRows;
    }),

  getProfile: adminProcedure
    .input(z.object({ userId: z.number().int() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "DB unavailable",
        });

      const userRows = await db
        .select()
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1);

      const user = userRows[0];
      if (!user) return null;

      let activity: typeof userActivitySummary.$inferSelect | null = null;
      try {
        const rows = await db
          .select()
          .from(userActivitySummary)
          .where(eq(userActivitySummary.userId, input.userId));
        activity = rows[0] ?? null;
      } catch {
        // table may not exist yet
      }

      const recentEvents = await db
        .select()
        .from(analyticsEvents)
        .where(eq(analyticsEvents.userId, input.userId))
        .orderBy(desc(analyticsEvents.createdAt))
        .limit(20);

      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          joinedAt: user.createdAt,
        },
        activity: activity
          ? {
              totalEvents: activity.totalEvents ?? 0,
              totalSessions: activity.totalSessions ?? 0,
              lastActiveAt: activity.lastActiveAt,
              healthScore: activity.healthScore ?? 0,
            }
          : null,
        recentEvents: recentEvents.map(e => ({
          event: e.event,
          category: e.category,
          createdAt: e.createdAt,
        })),
        healthScore: computeHealthScore(activity),
      };
    }),
});

function computeHealthScore(
  activity: typeof userActivitySummary.$inferSelect | null
): number {
  let score = 50;
  if (!activity) return score;

  const te = activity.totalEvents ?? 0;
  if (te > 50) score += 20;
  else if (te > 10) score += 10;

  if (activity.lastActiveAt) {
    const daysSince =
      (Date.now() - new Date(activity.lastActiveAt).getTime()) / 86400000;
    if (daysSince < 1) score += 20;
    else if (daysSince < 7) score += 10;
    else if (daysSince > 14) score -= 30;
  }

  return Math.max(0, Math.min(100, score));
}
