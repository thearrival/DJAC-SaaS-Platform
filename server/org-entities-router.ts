/**
 * org-entities-router.ts — multi-entity (parent/child) organizations.
 *
 * Child entities inherit the parent's plan/limits (see services/entitlements).
 * Nested hierarchies are intentionally not supported (one level).
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, count, eq } from "drizzle-orm";
import {
  orgAdminProcedure,
  orgProcedure,
  requireMfa,
  router,
} from "./_core/trpc";
import { getDb } from "./db";
import { organizations, organizationMembers, vendors } from "../drizzle/schema";
import { getLocalUserIdFromOpenId } from "./services/org-context";

async function statsForOrg(orgId: number): Promise<{
  vendors: number;
  members: number;
}> {
  const db = await getDb();
  if (!db) return { vendors: 0, members: 0 };
  const [v] = await db
    .select({ value: count() })
    .from(vendors)
    .where(eq(vendors.organizationId, orgId));
  const [m] = await db
    .select({ value: count() })
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.organizationId, orgId),
        eq(organizationMembers.status, "active")
      )
    );
  return {
    vendors: Number(v?.value ?? 0),
    members: Number(m?.value ?? 0),
  };
}

export const orgEntitiesRouter = router({
  /** Current org, its parent (if any), its direct children, and totals. */
  list: orgProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      return {
        current: null,
        parent: null,
        entities: [],
        totals: { vendors: 0, members: 0 },
      };
    }
    const orgId = ctx.organizationId as number;

    const [current] = await db
      .select({
        id: organizations.id,
        name: organizations.name,
        plan: organizations.plan,
        parentOrganizationId: organizations.parentOrganizationId,
        primaryJurisdiction: organizations.primaryJurisdiction,
      })
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1);

    let parent: { id: number; name: string; plan: string } | null = null;
    if (current?.parentOrganizationId) {
      const [p] = await db
        .select({
          id: organizations.id,
          name: organizations.name,
          plan: organizations.plan,
        })
        .from(organizations)
        .where(eq(organizations.id, current.parentOrganizationId))
        .limit(1);
      parent = p ?? null;
    }

    const children = await db
      .select({
        id: organizations.id,
        name: organizations.name,
        slug: organizations.slug,
        plan: organizations.plan,
        createdAt: organizations.createdAt,
      })
      .from(organizations)
      .where(eq(organizations.parentOrganizationId, orgId));

    const entities: Array<{
      id: number;
      name: string;
      slug: string;
      plan: string;
      createdAt: Date;
      vendors: number;
      members: number;
    }> = [];
    for (const c of children) {
      const s = await statsForOrg(c.id);
      entities.push({ ...c, ...s });
    }

    const selfStats = await statsForOrg(orgId);
    const totals = entities.reduce(
      (acc, e) => ({
        vendors: acc.vendors + e.vendors,
        members: acc.members + e.members,
      }),
      { ...selfStats }
    );

    return { current: current ?? null, parent, entities, totals };
  }),

  /** Create a direct child entity; the caller becomes its owner. */
  createChild: orgAdminProcedure
    .use(requireMfa)
    .input(z.object({ name: z.string().trim().min(2).max(255) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });
      }
      const orgId = ctx.organizationId as number;
      if (orgId < 0) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cannot manage entities in dev-bypass mode.",
        });
      }
      const [parent] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, orgId))
        .limit(1);
      if (!parent) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Organization not found",
        });
      }
      if (parent.parentOrganizationId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Nested entities are not supported.",
        });
      }

      const slug = `entity-${orgId}-${Date.now().toString(36)}`;
      const localUserId = getLocalUserIdFromOpenId(ctx.user.openId);

      const [child] = await db
        .insert(organizations)
        .values({
          slug,
          name: input.name,
          billingEmail: parent.billingEmail,
          industry: parent.industry,
          primaryJurisdiction: parent.primaryJurisdiction,
          plan: parent.plan,
          parentOrganizationId: orgId,
          trialStartedAt: parent.trialStartedAt,
          trialEndsAt: parent.trialEndsAt,
          isActive: 1,
          maxSeats: parent.maxSeats,
        })
        .returning({
          id: organizations.id,
          name: organizations.name,
          slug: organizations.slug,
        });

      await db.insert(organizationMembers).values({
        organizationId: child.id,
        ...(localUserId != null ? { localUserId } : { userId: ctx.user.id }),
        role: "owner",
        status: "active",
      });

      return child;
    }),
});
