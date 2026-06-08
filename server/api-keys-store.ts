/**
 * API Keys Store — DB operations for api-keys-router.ts
 *
 * Key format:  djac_<32 random hex chars>
 * Stored as:   SHA-256(raw) in keyHash column; first 12 chars as keyPrefix
 */

import crypto from "crypto";
import { and, eq, isNull } from "drizzle-orm";
import { apiKeys } from "../drizzle/schema";
import { getDb } from "./db";

// ─── In-memory fallback for dev-without-DB ────────────────────────────────────

const MEM_KEYS: {
    id: number;
    organizationId: number;
    name: string;
    keyHash: string;
    keyPrefix: string;
    scopes: string | null;
    lastUsedAt: Date | null;
    expiresAt: Date | null;
    revokedAt: Date | null;
    createdAt: Date;
}[] = [];
let memIdSeq = 1;

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function genApiKey(): { raw: string; hash: string; prefix: string } {
    const raw = "djac_" + crypto.randomBytes(16).toString("hex");
    const hash = crypto.createHash("sha256").update(raw).digest("hex");
    const prefix = raw.slice(0, 12); // "djac_" + 7 chars
    return { raw, hash, prefix };
}

// ─── Store functions ──────────────────────────────────────────────────────────

export async function listApiKeys(orgId: number) {
    const db = await getDb();
    if (!db || orgId < 0) {
        return MEM_KEYS
            .filter(k => k.organizationId === orgId && k.revokedAt === null)
            .map(({ keyHash: _h, ...rest }) => rest);
    }
    return db
        .select({
            id: apiKeys.id,
            name: apiKeys.name,
            keyPrefix: apiKeys.keyPrefix,
            scopes: apiKeys.scopes,
            lastUsedAt: apiKeys.lastUsedAt,
            expiresAt: apiKeys.expiresAt,
            createdAt: apiKeys.createdAt,
        })
        .from(apiKeys)
        .where(and(eq(apiKeys.organizationId, orgId), isNull(apiKeys.revokedAt)));
}

export async function createApiKey(
    orgId: number,
    createdByUserId: number | null,
    name: string,
    scopesJson: string,
    expiresAt: Date | null,
): Promise<{ id: number; name: string; keyPrefix: string; rawKey: string }> {
    const db = await getDb();
    const { raw, hash, prefix } = genApiKey();
    if (!db || orgId < 0) {
        const row = {
            id: memIdSeq++,
            organizationId: orgId,
            name,
            keyHash: hash,
            keyPrefix: prefix,
            scopes: scopesJson,
            lastUsedAt: null,
            expiresAt,
            revokedAt: null,
            createdAt: new Date(),
        };
        MEM_KEYS.push(row);
        return { id: row.id, name, keyPrefix: prefix, rawKey: raw };
    }
    const [inserted] = await db.insert(apiKeys).values({
        organizationId: orgId,
        createdByUserId,
        name,
        keyHash: hash,
        keyPrefix: prefix,
        scopes: scopesJson,
        expiresAt,
    }).returning({ id: apiKeys.id });
    const newId = inserted.id;
    return { id: newId, name, keyPrefix: prefix, rawKey: raw };
}

/** Returns false if the key was not found for this org. */
export async function revokeApiKey(orgId: number, keyId: number): Promise<boolean> {
    const db = await getDb();
    if (!db || orgId < 0) {
        const idx = MEM_KEYS.findIndex(k => k.id === keyId && k.organizationId === orgId);
        if (idx === -1) return false;
        MEM_KEYS[idx].revokedAt = new Date();
        return true;
    }
    const [existing] = await db
        .select({ id: apiKeys.id })
        .from(apiKeys)
        .where(and(eq(apiKeys.id, keyId), eq(apiKeys.organizationId, orgId)));
    if (!existing) return false;
    await db.update(apiKeys).set({ revokedAt: new Date() }).where(eq(apiKeys.id, keyId));
    return true;
}
