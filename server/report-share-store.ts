/**
 * report-share-store.ts
 *
 * CRUD for reportShares — time-limited share tokens for compliance reports.
 * Falls back to a simple in-memory map when DB is unavailable (dev mode).
 */
import crypto from "node:crypto";
import { and, eq, gt, lt } from "drizzle-orm";
import { getDb } from "./db";
import { reportShares, type ReportShare } from "../drizzle/schema";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type ReportShareParams = {
    jurisdiction: string;
    locale: "en" | "ar" | "zh";
    reportType: string;
    createdByUserId?: number | null;
    /** TTL in seconds — defaults to 7 days */
    ttlSeconds?: number;
};

// ---------------------------------------------------------------------------
// In-memory fallback (dev / no DB)
// ---------------------------------------------------------------------------
const memShares = new Map<
    string,
    { share: ReportShare; expiresAt: Date }
>();

function generateToken(): string {
    return crypto.randomBytes(24).toString("hex"); // 48-char hex
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------
export async function createReportShare(params: ReportShareParams): Promise<ReportShare> {
    const token = generateToken();
    const ttl = params.ttlSeconds ?? 7 * 24 * 3600;
    const expiresAt = new Date(Date.now() + ttl * 1000);
    const now = new Date();

    const db = await getDb();

    if (!db) {
        const record: ReportShare = {
            id: Date.now(),
            token,
            jurisdiction: params.jurisdiction,
            locale: params.locale,
            reportType: params.reportType,
            createdByUserId: params.createdByUserId ?? null,
            viewCount: 0,
            expiresAt,
            createdAt: now,
        };
        memShares.set(token, { share: record, expiresAt });
        return record;
    }

    await db.insert(reportShares).values({
        token,
        jurisdiction: params.jurisdiction,
        locale: params.locale,
        reportType: params.reportType,
        createdByUserId: params.createdByUserId ?? null,
        viewCount: 0,
        expiresAt,
    });

    const [row] = await db
        .select()
        .from(reportShares)
        .where(eq(reportShares.token, token))
        .limit(1);
    return row!;
}

// ---------------------------------------------------------------------------
// Fetch by token (validates expiry, increments viewCount)
// ---------------------------------------------------------------------------
export async function getReportShareByToken(token: string): Promise<ReportShare | null> {
    // sanitise — token is hex so only [0-9a-f] chars
    if (!/^[0-9a-f]{48}$/.test(token)) return null;

    const now = new Date();
    const db = await getDb();

    if (!db) {
        const entry = memShares.get(token);
        if (!entry || entry.expiresAt <= now) return null;
        entry.share = { ...entry.share, viewCount: entry.share.viewCount + 1 };
        return entry.share;
    }

    const [row] = await db
        .select()
        .from(reportShares)
        .where(
            and(
                eq(reportShares.token, token),
                gt(reportShares.expiresAt, now),
            ),
        )
        .limit(1);

    if (!row) return null;

    // Increment view count (fire-and-forget, non-blocking)
    void db
        .update(reportShares)
        .set({ viewCount: row.viewCount + 1 })
        .where(eq(reportShares.id, row.id))
        .catch(() => { /* silently ignore view-count increment failures */ });

    return row;
}

// ---------------------------------------------------------------------------
// Purge expired (call from a periodic scheduler or on-demand)
// ---------------------------------------------------------------------------
export async function purgeExpiredReportShares(): Promise<number> {
    const now = new Date();
    const db = await getDb();

    if (!db) {
        let removed = 0;
        for (const [k, v] of memShares.entries()) {
            if (v.expiresAt <= now) { memShares.delete(k); removed++; }
        }
        return removed;
    }

    const result = await db
        .delete(reportShares)
        .where(lt(reportShares.expiresAt, now));
    return result.rowCount ?? 0;
}
