/**
 * org-context.ts — Internal organization resolution service
 *
 * Resolves the organization membership for an authenticated user.
 * If no org exists yet, auto-creates a default free-trial org for the user.
 *
 * CONTRACT: No tRPC, Express, or router imports live here. Only db, schema,
 * billing-entitlements are allowed.
 */

import type { User, OrganizationMember } from "../../drizzle/schema";
import { organizations, organizationMembers } from "../../drizzle/schema";
import { and, eq } from "drizzle-orm";
import { getDb } from "../db";
import { trialEndsAt } from "./billing-entitlements";

export type OrgResolution = {
  organizationId: number | null;
  organizationRole: OrganizationMember["role"] | null;
};

async function createDefaultOrganizationForUser(
  user: User,
  localUserId?: number
): Promise<{
  organizationId: number;
  organizationRole: OrganizationMember["role"];
} | null> {
  // Dev-bypass / API-key pseudo users are not persisted in DB — skip auto-seed.
  if (user.id <= 0 && !localUserId) return null;

  const db = await getDb();
  if (!db) return null;

  const now = new Date();
  const defaultTrialEndsAt = trialEndsAt(now);

  const orgName =
    user.organizationName && user.organizationName.trim()
      ? user.organizationName.trim()
      : `${(user.name || "New User").trim()} Organization`;

  const ownerKey = localUserId ?? user.id;
  const safeSlug = `org-${ownerKey}-${
    orgName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || "default"
  }`;

  const [inserted] = await db
    .insert(organizations)
    .values({
      slug: safeSlug,
      name: orgName,
      billingEmail: user.email || `user-${ownerKey}@example.local`,
      primaryJurisdiction: "Both",
      plan: "free_trial",
      trialStartedAt: now,
      trialEndsAt: defaultTrialEndsAt,
      isActive: 1,
      maxSeats: 5,
    })
    .returning({ id: organizations.id });

  const organizationId = inserted.id;

  await db.insert(organizationMembers).values({
    organizationId,
    ...(localUserId != null ? { localUserId } : { userId: user.id }),
    role: "owner",
    status: "active",
  });

  return { organizationId, organizationRole: "owner" };
}

/** Parse the real localUsers.id from a virtual local-auth user's openId ("local:<id>") */
export function getLocalUserIdFromOpenId(openId: string | null): number | null {
  if (!openId) return null;
  const m = /^local:(\d+)$/.exec(openId);
  return m ? Number(m[1]) : null;
}

export async function resolveOrganizationForUser(
  user: User
): Promise<OrgResolution> {
  const db = await getDb();
  if (!db) return { organizationId: null, organizationRole: null };

  const [membership] = await db
    .select({
      organizationId: organizationMembers.organizationId,
      role: organizationMembers.role,
    })
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.userId, user.id),
        eq(organizationMembers.status, "active")
      )
    )
    .limit(1);

  if (!membership) {
    const seeded = await createDefaultOrganizationForUser(user);
    if (seeded) {
      return {
        organizationId: seeded.organizationId,
        organizationRole: seeded.organizationRole,
      };
    }
  }

  return {
    organizationId: membership?.organizationId ?? null,
    organizationRole: membership?.role ?? null,
  };
}

/**
 * Org resolution for local-auth users (email+password). Local users live in
 * the localUsers table, so memberships are matched on localUserId and any
 * auto-created org records the owner with the localUserId FK.
 */
export async function resolveOrganizationForLocalUser(
  user: User
): Promise<OrgResolution> {
  const localUserId = getLocalUserIdFromOpenId(user.openId);
  if (!localUserId) return { organizationId: null, organizationRole: null };

  const db = await getDb();
  if (!db) return { organizationId: null, organizationRole: null };

  const [membership] = await db
    .select({
      organizationId: organizationMembers.organizationId,
      role: organizationMembers.role,
    })
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.localUserId, localUserId),
        eq(organizationMembers.status, "active")
      )
    )
    .limit(1);

  if (!membership) {
    const seeded = await createDefaultOrganizationForUser(user, localUserId);
    if (seeded) {
      return {
        organizationId: seeded.organizationId,
        organizationRole: seeded.organizationRole,
      };
    }
  }

  return {
    organizationId: membership?.organizationId ?? null,
    organizationRole: membership?.role ?? null,
  };
}
