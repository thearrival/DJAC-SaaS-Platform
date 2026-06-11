/**
 * Org Members Store — DB operations for org-members-router.ts
 */

import { eq, and } from "drizzle-orm";
import { organizations, organizationMembers, localUsers, users } from "../drizzle/schema";
import { getDb } from "./db";

type OrgRole = "owner" | "admin" | "compliance_officer" | "analyst";

// ─── Store functions ──────────────────────────────────────────────────────────

export async function getMyOrg(orgId: number, role: string | null | undefined) {
    const db = await getDb();
    if (!db) {
        return {
            id: orgId,
            name: "Your Organization",
            slug: "your-org",
            plan: "free_trial" as const,
            maxSeats: 5,
            billingEmail: "",
            primaryJurisdiction: "Both" as const,
            industry: null as string | null,
            trialEndsAt: null as Date | null,
            createdAt: new Date(),
            currentUserRole: role,
        };
    }
    if (orgId < 0) {
        return {
            id: -1,
            name: "Dev Organization",
            slug: "dev-org",
            plan: "enterprise" as const,
            maxSeats: 99,
            billingEmail: "dev@localhost",
            primaryJurisdiction: "Both" as const,
            industry: "Technology" as string | null,
            trialEndsAt: null as Date | null,
            createdAt: new Date(),
            currentUserRole: role,
        };
    }
    const [org] = await db
        .select({
            id: organizations.id,
            name: organizations.name,
            slug: organizations.slug,
            plan: organizations.plan,
            maxSeats: organizations.maxSeats,
            billingEmail: organizations.billingEmail,
            primaryJurisdiction: organizations.primaryJurisdiction,
            industry: organizations.industry,
            trialEndsAt: organizations.trialEndsAt,
            createdAt: organizations.createdAt,
        })
        .from(organizations)
        .where(eq(organizations.id, orgId))
        .limit(1);
    if (!org) return null;
    return { ...org, currentUserRole: role };
}

export async function listOrgMembers(orgId: number, currentUserId: number) {
    const db = await getDb();
    if (!db || orgId < 0) return [];
    const rows = await db
        .select({
            id: organizationMembers.id,
            organizationId: organizationMembers.organizationId,
            userId: organizationMembers.userId,
            localUserId: organizationMembers.localUserId,
            role: organizationMembers.role,
            status: organizationMembers.status,
            inviteEmail: organizationMembers.inviteEmail,
            createdAt: organizationMembers.createdAt,
            localName: localUsers.name,
            localEmail: localUsers.email,
            localJobTitle: localUsers.jobTitle,
            oauthName: users.name,
            oauthEmail: users.email,
            oauthJobTitle: users.jobTitle,
        })
        .from(organizationMembers)
        .leftJoin(localUsers, eq(organizationMembers.localUserId, localUsers.id))
        .leftJoin(users, eq(organizationMembers.userId, users.id))
        .where(eq(organizationMembers.organizationId, orgId))
        .orderBy(organizationMembers.createdAt);
    return rows.map(r => ({
        id: r.id,
        role: r.role,
        status: r.status,
        inviteEmail: r.inviteEmail ?? null,
        joinedAt: r.createdAt,
        name: r.localName ?? r.oauthName ?? r.inviteEmail ?? "Unknown Member",
        email: r.localEmail ?? r.oauthEmail ?? r.inviteEmail ?? "",
        jobTitle: r.localJobTitle ?? r.oauthJobTitle ?? null,
        isCurrentUser: r.userId === currentUserId,
    }));
}

/** Returns { id, role } or null if not found. */
export async function getOrgMember(
    orgId: number,
    memberId: number,
): Promise<{ id: number; role: string } | null> {
    const db = await getDb();
    if (!db) return null;
    const [row] = await db
        .select({ id: organizationMembers.id, role: organizationMembers.role })
        .from(organizationMembers)
        .where(and(eq(organizationMembers.id, memberId), eq(organizationMembers.organizationId, orgId)))
        .limit(1);
    return row ?? null;
}

export async function updateMemberRole(memberId: number, newRole: OrgRole): Promise<void> {
    const db = await getDb();
    if (!db) return;
    await db
        .update(organizationMembers)
        .set({ role: newRole, updatedAt: new Date() })
        .where(eq(organizationMembers.id, memberId));
}

export async function deleteMember(memberId: number): Promise<void> {
    const db = await getDb();
    if (!db) return;
    await db.delete(organizationMembers).where(eq(organizationMembers.id, memberId));
}

/** Returns { maxSeats, name } or null if org not found. */
export async function getOrgForInvite(orgId: number): Promise<{ maxSeats: number; name: string } | null> {
    const db = await getDb();
    if (!db) return null;
    const [org] = await db
        .select({ maxSeats: organizations.maxSeats, name: organizations.name })
        .from(organizations)
        .where(eq(organizations.id, orgId))
        .limit(1);
    return org ?? null;
}

export async function countActiveMembers(orgId: number): Promise<number> {
    const db = await getDb();
    if (!db) return 0;
    const rows = await db
        .select({ id: organizationMembers.id })
        .from(organizationMembers)
        .where(and(eq(organizationMembers.organizationId, orgId), eq(organizationMembers.status, "active")));
    return rows.length;
}

/** Returns true if a pending invite/membership already exists for this email. */
export async function checkDuplicateInvite(orgId: number, email: string): Promise<boolean> {
    const db = await getDb();
    if (!db) return false;
    const normalizedEmail = email.trim().toLowerCase();
    const rows = await db
        .select({
            inviteEmail: organizationMembers.inviteEmail,
            oauthEmail: users.email,
            localEmail: localUsers.email,
        })
        .from(organizationMembers)
        .leftJoin(users, eq(organizationMembers.userId, users.id))
        .leftJoin(localUsers, eq(organizationMembers.localUserId, localUsers.id))
        .where(eq(organizationMembers.organizationId, orgId));

    return rows.some(row => {
        const candidates = [row.inviteEmail, row.oauthEmail, row.localEmail];
        return candidates.some(value => (value ?? "").trim().toLowerCase() === normalizedEmail);
    });
}

export async function insertInvite(
    orgId: number,
    role: OrgRole,
    email: string,
    token: string,
    invitedByUserId: number,
): Promise<void> {
    const db = await getDb();
    if (!db) return;
    const normalizedEmail = email.trim().toLowerCase();
    await db.insert(organizationMembers).values({
        organizationId: orgId,
        role,
        status: "invited",
        inviteEmail: normalizedEmail,
        inviteToken: token,
        invitedByUserId,
    });
}

export async function lookupInviteToken(token: string) {
    const db = await getDb();
    if (!db) return null;
    const [row] = await db
        .select({
            id: organizationMembers.id,
            role: organizationMembers.role,
            inviteEmail: organizationMembers.inviteEmail,
            status: organizationMembers.status,
            createdAt: organizationMembers.createdAt,
            orgName: organizations.name,
            orgSlug: organizations.slug,
        })
        .from(organizationMembers)
        .innerJoin(organizations, eq(organizationMembers.organizationId, organizations.id))
        .where(eq(organizationMembers.inviteToken, token))
        .limit(1);
    return row ?? null;
}

export async function getInviteByToken(token: string) {
    const db = await getDb();
    if (!db) return null;
    const [row] = await db
        .select({
            id: organizationMembers.id,
            status: organizationMembers.status,
            createdAt: organizationMembers.createdAt,
            organizationId: organizationMembers.organizationId,
            inviteEmail: organizationMembers.inviteEmail,
        })
        .from(organizationMembers)
        .where(eq(organizationMembers.inviteToken, token))
        .limit(1);
    return row ?? null;
}

export async function activateInvite(memberId: number, userId: number): Promise<void> {
    const db = await getDb();
    if (!db) return;
    await db
        .update(organizationMembers)
        .set({
            userId,
            status: "active",
            inviteAcceptedAt: new Date(),
            inviteToken: null,
            updatedAt: new Date(),
        })
        .where(eq(organizationMembers.id, memberId));
}
