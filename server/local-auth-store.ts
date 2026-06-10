/**
 * local-auth-store.ts — DB layer for local (email + password) authentication.
 */

import { eq } from "drizzle-orm";
import { localUsers } from "../drizzle/schema";
import { getDb } from "./db";
import { localMemoryUsers, isLocalMemoryFallbackEnabled } from "./services/local-jwt";

export type LocalUser = typeof localUsers.$inferSelect;
export type InsertLocalUser = typeof localUsers.$inferInsert;

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

export async function findLocalUserByPhone(phone: string): Promise<LocalUser | null> {
    const db = await getDb();
    if (!db) {
        if (!isLocalMemoryFallbackEnabled()) return null;
        return localMemoryUsers.find(u => u.phoneNumber === phone) ?? null;
    }
    const [row] = await db.select().from(localUsers).where(eq(localUsers.phoneNumber, phone)).limit(1);
    return row ?? null;
}

export async function checkEmailExists(email: string): Promise<boolean> {
    const db = await getDb();
    if (!db) return isLocalMemoryFallbackEnabled() && localMemoryUsers.some(u => u.email === email);
    const rows = await db.select({ id: localUsers.id }).from(localUsers).where(eq(localUsers.email, email)).limit(1);
    return rows.length > 0;
}

export async function checkPhoneExists(phone: string): Promise<boolean> {
    const db = await getDb();
    if (!db) return isLocalMemoryFallbackEnabled() && localMemoryUsers.some(u => u.phoneNumber === phone);
    const rows = await db.select({ id: localUsers.id }).from(localUsers).where(eq(localUsers.phoneNumber, phone)).limit(1);
    return rows.length > 0;
}

export async function listLocalUsersForAdmin(): Promise<Pick<LocalUser, "id" | "name" | "email" | "phoneNumber" | "userType" | "companyName" | "jobTitle" | "industry" | "status" | "preferredLocale" | "lastSignedIn" | "createdAt">[]> {
    const db = await getDb();
    if (!db) return isLocalMemoryFallbackEnabled() ? localMemoryUsers.map(u => ({ id: u.id, name: u.name, email: u.email, phoneNumber: u.phoneNumber, userType: u.userType, companyName: u.companyName, jobTitle: u.jobTitle, industry: u.industry, status: u.status, preferredLocale: u.preferredLocale, lastSignedIn: u.lastSignedIn, createdAt: u.createdAt })) : [];
    return db.select({ id: localUsers.id, name: localUsers.name, email: localUsers.email, phoneNumber: localUsers.phoneNumber, userType: localUsers.userType, companyName: localUsers.companyName, jobTitle: localUsers.jobTitle, industry: localUsers.industry, status: localUsers.status, preferredLocale: localUsers.preferredLocale, lastSignedIn: localUsers.lastSignedIn, createdAt: localUsers.createdAt }).from(localUsers).orderBy(localUsers.createdAt);
}

export async function insertLocalUser(data: InsertLocalUser): Promise<LocalUser> {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const [row] = await db.insert(localUsers).values(data).returning();
    return row;
}

export async function updateLocalUserLastSignedIn(id: number): Promise<void> {
    const db = await getDb();
    if (!db) { const mem = localMemoryUsers.find(u => u.id === id); if (mem) { mem.lastSignedIn = new Date(); mem.updatedAt = new Date(); } return; }
    await db.update(localUsers).set({ lastSignedIn: new Date() }).where(eq(localUsers.id, id));
}

export async function updateLocalUserStatus(id: number, status: "active" | "pending" | "suspended"): Promise<void> {
    const db = await getDb();
    if (!db) { const mem = localMemoryUsers.find(u => u.id === id); if (mem) { mem.status = status; mem.updatedAt = new Date(); } return; }
    await db.update(localUsers).set({ status }).where(eq(localUsers.id, id));
}

export async function updateLocalUserPassword(id: number, passwordHash: string): Promise<void> {
    const db = await getDb();
    if (!db) { const mem = localMemoryUsers.find(u => u.id === id); if (mem) { mem.passwordHash = passwordHash; mem.updatedAt = new Date(); } return; }
    await db.update(localUsers).set({ passwordHash, updatedAt: new Date() }).where(eq(localUsers.id, id));
}

export async function updateLocalUserProfile(id: number, fields: Partial<Pick<InsertLocalUser, "name" | "jobTitle" | "companyName" | "industry" | "complianceResponsibility" | "preferredLocale">>): Promise<void> {
    const db = await getDb();
    if (!db) { const mem = localMemoryUsers.find(u => u.id === id); if (mem) { Object.assign(mem, fields); mem.updatedAt = new Date(); } return; }
    await db.update(localUsers).set({ ...fields, updatedAt: new Date() }).where(eq(localUsers.id, id));
}

export async function updateLocalUserTotpSecret(id: number, secret: string): Promise<void> {
    const db = await getDb();
    if (!db) { const mem = localMemoryUsers.find(u => u.id === id); if (mem) mem.totpSecret = secret; return; }
    await db.update(localUsers).set({ totpSecret: secret }).where(eq(localUsers.id, id));
}

export async function enableLocalUserMfa(id: number, hashedBackupCodes: string[]): Promise<void> {
    const db = await getDb();
    if (!db) { const mem = localMemoryUsers.find(u => u.id === id); if (mem) { mem.mfaEnabled = 1; mem.mfaBackupCodes = JSON.stringify(hashedBackupCodes); mem.updatedAt = new Date(); } return; }
    await db.update(localUsers).set({ mfaEnabled: 1, mfaBackupCodes: JSON.stringify(hashedBackupCodes), updatedAt: new Date() }).where(eq(localUsers.id, id));
}

export async function disableLocalUserMfa(id: number): Promise<void> {
    const db = await getDb();
    if (!db) { const mem = localMemoryUsers.find(u => u.id === id); if (mem) { mem.mfaEnabled = 0; mem.totpSecret = null; mem.mfaBackupCodes = null; mem.updatedAt = new Date(); } return; }
    await db.update(localUsers).set({ mfaEnabled: 0, totpSecret: null, mfaBackupCodes: null, updatedAt: new Date() }).where(eq(localUsers.id, id));
}

export async function consumeLocalUserBackupCode(id: number, remainingCodes: string[]): Promise<void> {
    const db = await getDb();
    if (!db) { const mem = localMemoryUsers.find(u => u.id === id); if (mem) { mem.mfaBackupCodes = JSON.stringify(remainingCodes); mem.lastSignedIn = new Date(); } return; }
    await db.update(localUsers).set({ mfaBackupCodes: JSON.stringify(remainingCodes), lastSignedIn: new Date() }).where(eq(localUsers.id, id));
}

export async function verifyLocalUserEmail(id: number): Promise<void> {
    const db = await getDb();
    if (!db) { const mem = localMemoryUsers.find(u => u.id === id); if (mem) { mem.verifiedAt = new Date(); mem.updatedAt = new Date(); } return; }
    await db.update(localUsers).set({ verifiedAt: new Date(), updatedAt: new Date() }).where(eq(localUsers.id, id));
}
