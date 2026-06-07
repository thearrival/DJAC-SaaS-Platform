/**
 * local-auth-store.ts — DB layer for local (email + password) authentication.
 *
 * All direct DB access for localUsers lives here. The router handles
 * input validation, bcrypt, JWT, cookies, audit events, and SSE.
 */

import { eq } from "drizzle-orm";
import { localUsers } from "../drizzle/schema";
import { getDb } from "./db";
import {
    localMemoryUsers,
    isLocalMemoryFallbackEnabled,
} from "./services/local-jwt";

export type LocalUser = typeof localUsers.$inferSelect;
export type InsertLocalUser = typeof localUsers.$inferInsert;

// ─── Reads ────────────────────────────────────────────────────────────────────

export async function findLocalUserByEmail(email: string): Promise<LocalUser | null> {
    const db = await getDb();
    if (!db) {
        if (!isLocalMemoryFallbackEnabled()) return null;
        return localMemoryUsers.find(u => u.email === email) ?? null;
    }
    const [row] = await db.select().from(localUsers).where(eq(localUsers.email, email)).limit(1);
    return row ?? null;
}

export async function findLocalUserById(id: number): Promise<LocalUser | null> {
    const db = await getDb();
    if (!db) {
        if (!isLocalMemoryFallbackEnabled()) return null;
        return localMemoryUsers.find(u => u.id === id) ?? null;
    }
    const [row] = await db.select().from(localUsers).where(eq(localUsers.id, id)).limit(1);
    return row ?? null;
}

export async function checkEmailExists(email: string): Promise<boolean> {
    const db = await getDb();
    if (!db) {
        if (!isLocalMemoryFallbackEnabled()) return false;
        return localMemoryUsers.some(u => u.email === email);
    }
    const rows = await db.select({ id: localUsers.id }).from(localUsers).where(eq(localUsers.email, email)).limit(1);
    return rows.length > 0;
}

export async function listLocalUsersForAdmin(): Promise<Pick<LocalUser,
    "id" | "name" | "email" | "userType" | "companyName" | "jobTitle" | "industry" |
    "status" | "preferredLocale" | "lastSignedIn" | "createdAt">[]> {
    const db = await getDb();
    if (!db) {
        if (!isLocalMemoryFallbackEnabled()) return [];
        return localMemoryUsers.map(u => ({
            id: u.id, name: u.name, email: u.email, userType: u.userType,
            companyName: u.companyName, jobTitle: u.jobTitle, industry: u.industry,
            status: u.status, preferredLocale: u.preferredLocale,
            lastSignedIn: u.lastSignedIn, createdAt: u.createdAt,
        }));
    }
    return db.select({
        id: localUsers.id, name: localUsers.name, email: localUsers.email,
        userType: localUsers.userType, companyName: localUsers.companyName,
        jobTitle: localUsers.jobTitle, industry: localUsers.industry,
        status: localUsers.status, preferredLocale: localUsers.preferredLocale,
        lastSignedIn: localUsers.lastSignedIn, createdAt: localUsers.createdAt,
    }).from(localUsers).orderBy(localUsers.createdAt);
}

// ─── Writes ───────────────────────────────────────────────────────────────────

export async function insertLocalUser(data: InsertLocalUser): Promise<LocalUser> {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const [result] = await db.insert(localUsers).values(data);
    const newId = (result as { insertId: number }).insertId;
    const [row] = await db.select().from(localUsers).where(eq(localUsers.id, newId)).limit(1);
    return row;
}

export async function updateLocalUserLastSignedIn(id: number): Promise<void> {
    const db = await getDb();
    if (!db) {
        const mem = localMemoryUsers.find(u => u.id === id);
        if (mem) { mem.lastSignedIn = new Date(); mem.updatedAt = new Date(); }
        return;
    }
    await db.update(localUsers).set({ lastSignedIn: new Date() }).where(eq(localUsers.id, id));
}

export async function updateLocalUserStatus(id: number, status: "active" | "pending" | "suspended"): Promise<void> {
    const db = await getDb();
    if (!db) {
        const mem = localMemoryUsers.find(u => u.id === id);
        if (mem) { mem.status = status; mem.updatedAt = new Date(); }
        return;
    }
    await db.update(localUsers).set({ status }).where(eq(localUsers.id, id));
}

export async function updateLocalUserPassword(id: number, passwordHash: string): Promise<void> {
    const db = await getDb();
    if (!db) {
        const mem = localMemoryUsers.find(u => u.id === id);
        if (mem) { mem.passwordHash = passwordHash; mem.updatedAt = new Date(); }
        return;
    }
    await db.update(localUsers).set({ passwordHash, updatedAt: new Date() }).where(eq(localUsers.id, id));
}

export async function updateLocalUserProfile(
    id: number,
    fields: Partial<Pick<InsertLocalUser, "name" | "jobTitle" | "companyName" | "industry" | "complianceResponsibility" | "preferredLocale">>
): Promise<void> {
    const db = await getDb();
    if (!db) {
        const mem = localMemoryUsers.find(u => u.id === id);
        if (mem) {
            if (fields.name) mem.name = fields.name;
            if (fields.jobTitle !== undefined) mem.jobTitle = fields.jobTitle;
            if (fields.companyName !== undefined) mem.companyName = fields.companyName;
            if (fields.industry !== undefined) mem.industry = fields.industry;
            if (fields.complianceResponsibility !== undefined) mem.complianceResponsibility = fields.complianceResponsibility;
            if (fields.preferredLocale) mem.preferredLocale = fields.preferredLocale;
            mem.updatedAt = new Date();
        }
        return;
    }
    await db.update(localUsers).set({ ...fields, updatedAt: new Date() }).where(eq(localUsers.id, id));
}

export async function updateLocalUserTotpSecret(id: number, secret: string): Promise<void> {
    const db = await getDb();
    if (!db) {
        const mem = localMemoryUsers.find(u => u.id === id);
        if (mem) mem.totpSecret = secret;
        return;
    }
    await db.update(localUsers).set({ totpSecret: secret }).where(eq(localUsers.id, id));
}

export async function enableLocalUserMfa(id: number, hashedBackupCodes: string[]): Promise<void> {
    const db = await getDb();
    if (!db) {
        const mem = localMemoryUsers.find(u => u.id === id);
        if (mem) { mem.mfaEnabled = 1; mem.mfaBackupCodes = JSON.stringify(hashedBackupCodes); mem.updatedAt = new Date(); }
        return;
    }
    await db.update(localUsers).set({ mfaEnabled: 1, mfaBackupCodes: JSON.stringify(hashedBackupCodes), updatedAt: new Date() }).where(eq(localUsers.id, id));
}

export async function disableLocalUserMfa(id: number): Promise<void> {
    const db = await getDb();
    if (!db) {
        const mem = localMemoryUsers.find(u => u.id === id);
        if (mem) { mem.mfaEnabled = 0; mem.totpSecret = null; mem.mfaBackupCodes = null; mem.updatedAt = new Date(); }
        return;
    }
    await db.update(localUsers).set({ mfaEnabled: 0, totpSecret: null, mfaBackupCodes: null, updatedAt: new Date() }).where(eq(localUsers.id, id));
}

export async function consumeLocalUserBackupCode(id: number, remainingCodes: string[]): Promise<void> {
    const db = await getDb();
    if (!db) {
        const mem = localMemoryUsers.find(u => u.id === id);
        if (mem) { mem.mfaBackupCodes = JSON.stringify(remainingCodes); mem.lastSignedIn = new Date(); }
        return;
    }
    await db.update(localUsers).set({ mfaBackupCodes: JSON.stringify(remainingCodes), lastSignedIn: new Date() }).where(eq(localUsers.id, id));
}
