/**
 * local-jwt.ts — JWT helpers and session resolution for local (email+password) auth.
 *
 * Extracted from local-auth-router.ts so that:
 *   - auth-session.ts (service) can import resolveLocalSession without depending on a router
 *   - local-auth-router.ts (router) can share these utilities without re-implementing them
 *
 * This file has NO tRPC, Express, or router imports.
 */

import * as jose from "jose";
import { parse as parseCookieHeader } from "cookie";
import { eq } from "drizzle-orm";
import { localUsers } from "../../drizzle/schema";
import { getDb } from "../db";
import { ENV } from "../_core/env";

// ── Constants ─────────────────────────────────────────────────────────────────
export const LOCAL_AUTH_COOKIE = "djac_local_session";
export const COOKIE_MAX_AGE_S = 60 * 60 * 24 * 7; // 7 days

// ── Cookie options ────────────────────────────────────────────────────────────
export function cookieOptions() {
    const isSecure = !ENV.isDevelopment;
    return {
        httpOnly: true,
        sameSite: "strict" as const,
        secure: isSecure,
        maxAge: COOKIE_MAX_AGE_S * 1000,
        path: "/",
    };
}

// ── JWT helpers ───────────────────────────────────────────────────────────────
export async function signJwt(payload: Record<string, unknown>, ttl?: string): Promise<string> {
    const secret = new TextEncoder().encode(ENV.cookieSecret);
    return new jose.SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime(ttl ?? `${COOKIE_MAX_AGE_S}s`)
        .sign(secret);
}

export async function verifyJwt(token: string): Promise<Record<string, unknown> | null> {
    try {
        const secret = new TextEncoder().encode(ENV.cookieSecret);
        const { payload } = await jose.jwtVerify(token, secret);
        return payload as Record<string, unknown>;
    } catch {
        return null;
    }
}

// ── Request helpers ───────────────────────────────────────────────────────────
export function parseJwtUserId(sub: unknown): number | null {
    if (typeof sub === "number" && Number.isFinite(sub)) return sub;
    if (typeof sub === "string" && sub.trim().length > 0) {
        const parsed = Number.parseInt(sub, 10);
        if (Number.isFinite(parsed)) return parsed;
    }
    return null;
}

export function getSessionTokenFromRequest(
    req: { cookies?: Record<string, string>; headers?: Record<string, unknown> },
): string | null {
    const fromParsedCookie = req.cookies?.[LOCAL_AUTH_COOKIE];
    if (fromParsedCookie) return fromParsedCookie;

    const rawCookieHeader = req.headers?.cookie;
    if (typeof rawCookieHeader !== "string" || rawCookieHeader.length === 0) return null;

    const parsed = parseCookieHeader(rawCookieHeader);
    return parsed[LOCAL_AUTH_COOKIE] ?? null;
}

// ── In-memory fallback store ──────────────────────────────────────────────────
// Shared state for dev/test environments without a real database.
let _localMemoryUserId = 1;
export const localMemoryUsers: Array<typeof localUsers.$inferSelect> = [];

export function isLocalMemoryFallbackEnabled(): boolean {
    return ENV.isDevelopment && ENV.allowInMemoryPersistenceFallback;
}

export function createLocalMemoryUser(input: {
    name: string;
    email: string;
    passwordHash: string;
    userType: "visitor" | "professional" | "admin";
    preferredLocale: "en" | "ar" | "zh";
    companyName?: string | null;
    jobTitle?: string | null;
    industry?: string | null;
    complianceResponsibility?: string | null;
}): typeof localUsers.$inferSelect {
    const now = new Date();
    const row: typeof localUsers.$inferSelect = {
        id: _localMemoryUserId++,
        name: input.name,
        email: input.email,
        passwordHash: input.passwordHash,
        userType: input.userType,
        companyName: input.companyName ?? null,
        jobTitle: input.jobTitle ?? null,
        industry: input.industry ?? null,
        complianceResponsibility: input.complianceResponsibility ?? null,
        preferredLocale: input.preferredLocale,
        status: "active",
        lastSignedIn: now,
        totpSecret: null,
        mfaEnabled: 0,
        mfaBackupCodes: null,
        createdAt: now,
        updatedAt: now,
    };
    localMemoryUsers.unshift(row);
    return row;
}

// ── Session resolution ────────────────────────────────────────────────────────
/**
 * Resolves a local-auth session from the request cookie.
 * Used by both the tRPC context factory and auth-session service.
 */
export async function resolveLocalSession(
    req: { cookies?: Record<string, string>; headers?: Record<string, unknown> },
): Promise<typeof localUsers.$inferSelect | null> {
    const token = getSessionTokenFromRequest(req);
    if (!token) return null;

    const payload = await verifyJwt(token);
    if (!payload) return null;

    const userId = parseJwtUserId(payload.sub);
    if (!userId) return null;

    const db = await getDb();
    if (db) {
        const [row] = await db
            .select()
            .from(localUsers)
            .where(eq(localUsers.id, userId))
            .limit(1);
        return row ?? null;
    }

    if (isLocalMemoryFallbackEnabled()) {
        return localMemoryUsers.find((u) => u.id === userId) ?? null;
    }

    return null;
}
