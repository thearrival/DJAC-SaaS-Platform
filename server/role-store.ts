/**
 * Role Store — DB operations for role-router.ts
 */

import { and, desc, eq } from "drizzle-orm";
import { users, localUsers, auditLogs } from "../drizzle/schema";
import { getDb } from "./db";

type PlatformRole =
    | "user" | "admin" | "basic_user" | "professional_user"
    | "company_admin" | "platform_admin" | "yalla_hack_employee" | "super_admin";

type LocalUserType =
    | "visitor" | "professional" | "admin" | "basic_user" | "professional_user"
    | "company_admin" | "platform_admin" | "yalla_hack_employee" | "super_admin";

export async function listUsersWithRoles(limit: number, offset: number) {
    const db = await getDb();
    if (!db) return [];
    return db
        .select({
            id: users.id,
            name: users.name,
            email: users.email,
            role: users.role,
            status: users.status,
            createdAt: users.createdAt,
            lastSignedIn: users.lastSignedIn,
        })
        .from(users)
        .limit(limit)
        .offset(offset);
}

/** Returns null if DB unavailable or user not found. */
export async function assignUserRole(
    targetUserId: number,
    newRole: PlatformRole,
): Promise<{ id: number; name: string | null; email: string | null; role: string } | null> {
    const db = await getDb();
    if (!db) return null;
    const [target] = await db
        .select({ id: users.id, name: users.name, email: users.email, role: users.role })
        .from(users)
        .where(eq(users.id, targetUserId))
        .limit(1);
    if (!target) return null;
    await db.update(users).set({ role: newRole, updatedAt: new Date() }).where(eq(users.id, targetUserId));
    return target;
}

/** Returns null if DB unavailable or user not found. */
export async function assignLocalUserRole(
    targetLocalUserId: number,
    newUserType: LocalUserType,
): Promise<{ id: number; name: string; email: string | null; userType: string } | null> {
    const db = await getDb();
    if (!db) return null;
    const [target] = await db
        .select({ id: localUsers.id, name: localUsers.name, email: localUsers.email, userType: localUsers.userType })
        .from(localUsers)
        .where(eq(localUsers.id, targetLocalUserId))
        .limit(1);
    if (!target) return null;
    await db.update(localUsers).set({ userType: newUserType, updatedAt: new Date() }).where(eq(localUsers.id, targetLocalUserId));
    return target;
}

export async function listAuditLogs(
    limit: number,
    offset: number,
    category?: string,
    outcome?: string,
) {
    const db = await getDb();
    if (!db) return [];
    const conditions = [];
    if (category) conditions.push(eq(auditLogs.category, category as any));
    if (outcome) conditions.push(eq(auditLogs.outcome, outcome as any));
    return db
        .select()
        .from(auditLogs)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(auditLogs.createdAt))
        .limit(limit)
        .offset(offset);
}
