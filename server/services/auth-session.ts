/**
 * auth-session.ts — Internal auth resolution service
 *
 * Resolves a User from one of three inbound auth paths:
 *   1. OAuth session (via Clerk SDK)
 *   2. API key  (Authorization: Bearer djac_<hex>)
 *   3. Local auth JWT (djac_local_session cookie)
 *
 * Returns the resolved User or null. Callers must not depend on the path
 * that resolved the user — all paths produce the same TrpcContext shape.
 *
 * CONTRACT: No tRPC, Express, or router imports live here. This file may
 * only import from db, schema, env, sdk, and local-auth-router.
 */

import crypto from "crypto";
import type { IncomingMessage } from "http";
import type { User } from "../../drizzle/schema";
import { apiKeys } from "../../drizzle/schema";
import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "../db";
import { ENV } from "../_core/env";
import { sdk } from "../_core/sdk";
import { resolveLocalSession } from "./local-jwt";

// ── Re-export so callers can do: import { resolveDevBypassUser } from "..." ──
export { resolveDevBypassUser };

// ─── Dev bypass ───────────────────────────────────────────────────────────────

async function resolveDevBypassUser(): Promise<User> {
    const now = new Date();
    return {
        id: -1,
        openId: ENV.devAuthOpenId,
        name: ENV.devAuthName,
        email: ENV.devAuthEmail || null,
        loginMethod: "dev-bypass",
        organizationName: null,
        organizationType: null,
        jobTitle: null,
        preferredLocale: "en",
        role: ENV.devAuthRole,
        status: "active",
        createdAt: now,
        updatedAt: now,
        lastSignedIn: now,
        lastActivityAt: now,
    };
}

// ─── Path 2: API key ──────────────────────────────────────────────────────────

export type ApiKeyResolution = {
    user: User;
    organizationId: number;
    organizationRole: "admin";
} | null;

export async function resolveApiKeyAuth(
    req: Pick<IncomingMessage, "headers">
): Promise<ApiKeyResolution> {
    const authHeader = req.headers["authorization"];
    if (typeof authHeader !== "string" || !authHeader.startsWith("Bearer djac_"))
        return null;

    const rawKey = authHeader.slice(7); // strip "Bearer "
    if (!rawKey.startsWith("djac_")) return null;

    const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");

    const db = await getDb();
    if (!db) return null;

    const now = new Date();
    const [keyRow] = await db
        .select({
            id: apiKeys.id,
            organizationId: apiKeys.organizationId,
            revokedAt: apiKeys.revokedAt,
            expiresAt: apiKeys.expiresAt,
        })
        .from(apiKeys)
        .where(and(eq(apiKeys.keyHash, keyHash), isNull(apiKeys.revokedAt)))
        .limit(1);

    if (!keyRow || (keyRow.expiresAt && keyRow.expiresAt <= now)) return null;

    // Fire-and-forget — update lastUsedAt without blocking the request.
    db.update(apiKeys)
        .set({ lastUsedAt: now })
        .where(eq(apiKeys.id, keyRow.id))
        .catch(() => {
            /* noop */
        });

    const user: User = {
        id: -(10_000 + keyRow.id),
        openId: `api-key:${keyRow.id}`,
        name: "API Key",
        email: null,
        loginMethod: "api-key",
        organizationName: null,
        organizationType: null,
        jobTitle: null,
        preferredLocale: "en",
        role: "user",
        status: "active",
        createdAt: now,
        updatedAt: now,
        lastSignedIn: now,
        lastActivityAt: now,
    };

    return { user, organizationId: keyRow.organizationId, organizationRole: "admin" };
}

// ─── Path 3: Local auth ───────────────────────────────────────────────────────

const roleMap: Record<string, User["role"]> = {
    visitor: "user",
    professional: "professional_user",
    basic_user: "basic_user",
    professional_user: "professional_user",
    company_admin: "company_admin",
    platform_admin: "platform_admin",
    yalla_hack_employee: "yalla_hack_employee",
    super_admin: "super_admin",
    admin: "platform_admin",
};

export async function resolveLocalAuthUser(
    req: Parameters<typeof resolveLocalSession>[0]
): Promise<User | null> {
    const localUser = await resolveLocalSession(req);
    if (!localUser) return null;

    const now = new Date();
    return {
        id: -(50_000 + localUser.id),
        openId: `local:${localUser.id}`,
        name: localUser.name,
        email: localUser.email,
        loginMethod: "local-auth",
        organizationName: localUser.companyName ?? null,
        organizationType: null,
        jobTitle: localUser.jobTitle ?? null,
        preferredLocale: localUser.preferredLocale,
        role: roleMap[localUser.userType] ?? "user",
        status: "active" as User["status"],
        createdAt: localUser.createdAt,
        updatedAt: localUser.updatedAt,
        lastSignedIn: localUser.lastSignedIn ?? now,
        lastActivityAt: now,
    };
}

// ─── Path 1: OAuth session ────────────────────────────────────────────────────

export async function resolveOAuthUser(req: any): Promise<User | null> {
    try {
        return await sdk.authenticateRequest(req);
    } catch {
        return null;
    }
}
