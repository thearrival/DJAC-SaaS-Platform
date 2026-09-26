import { z } from "zod";
import { eq, desc, and } from "drizzle-orm";
import { notifications } from "../drizzle/schema";
import { getDb } from "./db";
import { protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { checkRateLimit } from "./_core/rateLimiter";

const NOTIF_LIMIT = 30;
const NOTIF_WINDOW_MS = 60_000;

const unreadCountSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
});

const markAllReadSchema = z.object({});

export const notificationsRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(100).default(20),
        offset: z.number().int().min(0).default(0),
        unreadOnly: z.boolean().default(false),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });

      const conditions = [eq(notifications.userId, ctx.user.id)];
      if (input.unreadOnly) {
        conditions.push(eq(notifications.isRead, false));
      }

      const query = db
        .select()
        .from(notifications)
        .where(and(...conditions))
        .orderBy(desc(notifications.createdAt))
        .limit(input.limit);

      if (input.offset > 0) {
        query.offset(input.offset);
      }

      return await query;
    }),

  unreadCount: protectedProcedure
    .input(unreadCountSchema)
    .query(async ({ ctx, input: _input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });

      const rows = await db
        .select()
        .from(notifications)
        .where(
          and(
            eq(notifications.userId, ctx.user.id),
            eq(notifications.isRead, false)
          )
        );

      return rows.length;
    }),

  markRead: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const rl = await checkRateLimit(
        `notif:read:${ctx.user.id}`,
        NOTIF_LIMIT,
        NOTIF_WINDOW_MS
      );
      if (!rl.allowed) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Rate limit exceeded. Please try again shortly.",
        });
      }
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });

      await db
        .update(notifications)
        .set({ isRead: true, readAt: new Date() })
        .where(
          and(
            eq(notifications.id, input.id),
            eq(notifications.userId, ctx.user.id)
          )
        );

      return { ok: true };
    }),

  markAllRead: protectedProcedure
    .input(markAllReadSchema)
    .mutation(async ({ ctx, input: _input }) => {
      const rl = await checkRateLimit(
        `notif:allread:${ctx.user.id}`,
        NOTIF_LIMIT,
        NOTIF_WINDOW_MS
      );
      if (!rl.allowed) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Rate limit exceeded. Please try again shortly.",
        });
      }
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });

      await db
        .update(notifications)
        .set({ isRead: true, readAt: new Date() })
        .where(
          and(
            eq(notifications.userId, ctx.user.id),
            eq(notifications.isRead, false)
          )
        );

      return { ok: true };
    }),
});

export async function createNotification(
  userId: number,
  type: string,
  title: string,
  body?: string,
  actionUrl?: string
) {
  const db = await getDb();
  if (!db) return;

  await db.insert(notifications).values({
    userId,
    type,
    title,
    body: body ?? null,
    actionUrl: actionUrl ?? null,
  });
}
