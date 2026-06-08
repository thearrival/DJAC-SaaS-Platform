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
    user: User
): Promise<{ organizationId: number; organizationRole: OrganizationMember["role"] } | null> {
    // Dev-bypass / API-key pseudo users are not persisted in DB — skip auto-seed.
    if (user.id <= 0) return null;

    const db = await getDb();
    if (!db) return null;

    const now = new Date();
    const defaultTrialEndsAt = trialEndsAt(now);

    const orgName =
        user.organizationName && user.organizationName.trim()
            ? user.organizationName.trim()
            : `${(user.name || "New User").trim()} Organization`;

    const safeSlug = `org-${user.id}-${orgName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 60) || "default"}`;

    const [inserted] = await db.insert(organizations).values({
        slug: safeSlug,
        name: orgName,
        billingEmail: user.email || `user-${user.id}@example.local`,
        primaryJurisdiction: "Both",
        plan: "free_trial",
        trialStartedAt: now,
        trialEndsAt: defaultTrialEndsAt,
        isActive: 1,
        maxSeats: 5,
    }).returning({ id: organizations.id });

    const organizationId = inserted.id;

    await db.insert(organizationMembers).values({
        organizationId,
        userId: user.id,
        role: "owner",
        status: "active",
    });

    return { organizationId, organizationRole: "owner" };
}

export async function resolveOrganizationForUser(user: User): Promise<OrgResolution> {
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
                eq(organizationMembers.status, "active"),
            ),
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
