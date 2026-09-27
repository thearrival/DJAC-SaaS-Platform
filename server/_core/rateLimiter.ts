/**
 * Rate limiter — Redis-backed (fixed window) with Postgres and in-memory
 * fallbacks.
 *
 * When REDIS_URL is configured the counters are stored in Redis so all
 * horizontal replicas share the same budget per client key. In production
 * without Redis, a shared Postgres counter table (`rateLimitWindows`) is used
 * so limits still span replicas. If both are unavailable the module falls back
 * to an in-process Map without throwing, keeping the server available.
 */

import Redis from "ioredis";
import { sql } from "drizzle-orm";
import { ENV } from "./env";
import { getDb } from "../db";

// ─────────────────────────────────────────────────────────────────────────────
// Redis singleton
// ─────────────────────────────────────────────────────────────────────────────

let _redis: Redis | null = null;
let _redisInitialised = false;

function getRedis(): Redis | null {
  if (_redisInitialised) return _redis;
  _redisInitialised = true;

  const url = ENV.redisUrl.trim();
  if (!url) return null;

  try {
    _redis = new Redis(url, {
      lazyConnect: false,
      // Don't let offline-queue pile up; fail immediately on transient errors.
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
      commandTimeout: 500,
    });
    _redis.on("error", (err: Error) => {
      // Suppress noisy ECONNREFUSED logs in dev; emit a single warning.
      if ((err as NodeJS.ErrnoException).code !== "ECONNREFUSED") {
        console.warn("[RateLimiter] Redis error:", err.message);
      }
    });
    return _redis;
  } catch {
    console.warn("[RateLimiter] Failed to create Redis connection");
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// In-memory fallback
// ─────────────────────────────────────────────────────────────────────────────

type MemEntry = { count: number; resetAt: number };
const _memStore = new Map<string, MemEntry>();

let _pruneInterval: ReturnType<typeof setInterval> | null = null;

// Prune expired entries every 5 minutes to prevent unbounded growth.
_pruneInterval = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of _memStore) {
    if (now > entry.resetAt) _memStore.delete(key);
  }
}, 5 * 60_000);
_pruneInterval.unref();

// ─────────────────────────────────────────────────────────────────────────────
// Postgres fallback (shared across horizontal replicas when Redis is absent)
//
// Serverless instances do not share process memory, so the in-memory fallback
// only rate-limits within a single instance. When running in production without
// Redis we use a fixed-window counter table that all instances share. The table
// is created by auto-migrate (`rateLimitWindows`).
// ─────────────────────────────────────────────────────────────────────────────

async function tryPostgresIncrement(
  key: string,
  windowIndex: number
): Promise<number | null> {
  if (!ENV.isProduction) return null;
  try {
    const db = await getDb();
    if (!db) return null;
    const result = await db.execute(sql`
      INSERT INTO "rateLimitWindows" ("key", "windowIndex", "count")
      VALUES (${key}, ${windowIndex}, 1)
      ON CONFLICT ("key", "windowIndex")
      DO UPDATE SET "count" = "rateLimitWindows"."count" + 1
      RETURNING "count"
    `);
    const row = (result.rows?.[0] ?? null) as {
      count?: number | string;
    } | null;
    if (!row) return null;
    const count = Number(row.count);
    if (!Number.isFinite(count)) return null;
    // Probabilistic (1%) cleanup of windows older than a day.
    if (Math.random() < 0.01) {
      void db
        .execute(
          sql`DELETE FROM "rateLimitWindows" WHERE "createdAt" < now() - interval '1 day'`
        )
        .catch(() => {});
    }
    return count;
  } catch {
    return null;
  }
}

async function tryPostgresCount(
  key: string,
  windowIndex: number
): Promise<number | null> {
  if (!ENV.isProduction) return null;
  try {
    const db = await getDb();
    if (!db) return null;
    const result = await db.execute(sql`
      SELECT "count" FROM "rateLimitWindows"
      WHERE "key" = ${key} AND "windowIndex" = ${windowIndex}
      LIMIT 1
    `);
    const row = (result.rows?.[0] ?? null) as {
      count?: number | string;
    } | null;
    if (!row) return 0;
    const count = Number(row.count);
    return Number.isFinite(count) ? count : 0;
  } catch {
    return null;
  }
}

async function tryPostgresReset(
  key: string,
  windowIndex: number
): Promise<void> {
  if (!ENV.isProduction) return;
  try {
    const db = await getDb();
    if (!db) return;
    await db.execute(
      sql`DELETE FROM "rateLimitWindows" WHERE "key" = ${key} AND "windowIndex" = ${windowIndex}`
    );
  } catch {
    // best-effort
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

export interface RateLimitResult {
  /** Whether this request is within the allowed budget. */
  allowed: boolean;
  remaining: number;
  /** Unix epoch seconds when the window resets. */
  resetAt: number;
  limit: number;
}

/**
 * Increment the request counter for `key` and return budget information.
 *
 * @param key      Per-client identifier (IP, user-id, …)
 * @param limit    Maximum requests allowed in `windowMs`
 * @param windowMs Window duration in milliseconds
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const windowIndex = Math.floor(Date.now() / windowMs);
  const windowResetMs = (windowIndex + 1) * windowMs;
  const resetAt = Math.ceil(windowResetMs / 1000); // Unix seconds

  const redis = getRedis();

  if (redis) {
    try {
      const redisKey = `rl:${windowIndex}:${key}`;
      // INCR is atomic; set TTL only on first request in this window.
      const count = await redis.incr(redisKey);
      if (count === 1) {
        const ttlMs = windowResetMs - Date.now();
        await redis.pexpire(redisKey, Math.max(ttlMs, 1));
      }
      return {
        allowed: count <= limit,
        remaining: Math.max(0, limit - count),
        resetAt,
        limit,
      };
    } catch (cause) {
      console.warn(
        "[RateLimiter] Redis unavailable, falling back to in-memory:",
        (cause as Error).message
      );
    }
  }

  // ── Postgres fallback (shared across serverless instances) ─────────────────
  const pgCount = await tryPostgresIncrement(key, windowIndex);
  if (pgCount != null) {
    return {
      allowed: pgCount <= limit,
      remaining: Math.max(0, limit - pgCount),
      resetAt,
      limit,
    };
  }

  // ── In-memory fallback ─────────────────────────────────────────────────────
  const now = Date.now();
  const existing = _memStore.get(key);

  if (!existing || now > existing.resetAt) {
    _memStore.set(key, { count: 1, resetAt: windowResetMs });
    return { allowed: true, remaining: limit - 1, resetAt, limit };
  }

  existing.count += 1;
  return {
    allowed: existing.count <= limit,
    remaining: Math.max(0, limit - existing.count),
    resetAt: Math.ceil(existing.resetAt / 1000),
    limit,
  };
}

/**
 * Read-only peek at the current window count for `key` (does NOT increment).
 * Used for lockout pre-checks where only failures should consume budget.
 */
export async function getRateLimitCount(
  key: string,
  windowMs: number
): Promise<number> {
  const windowIndex = Math.floor(Date.now() / windowMs);
  const redis = getRedis();

  if (redis) {
    try {
      const val = await redis.get(`rl:${windowIndex}:${key}`);
      return val ? parseInt(val, 10) || 0 : 0;
    } catch (cause) {
      console.warn(
        "[RateLimiter] Redis unavailable for peek, falling back to in-memory:",
        (cause as Error).message
      );
    }
  }

  // ── Postgres fallback ──────────────────────────────────────────────────────
  const pgCount = await tryPostgresCount(key, windowIndex);
  if (pgCount != null) return pgCount;

  const existing = _memStore.get(key);
  if (!existing || Date.now() > existing.resetAt) return 0;
  return existing.count;
}

/**
 * Clear the counter for `key` in the current window
 * (e.g. after a successful login so the lockout budget resets).
 */
export async function resetRateLimit(
  key: string,
  windowMs: number
): Promise<void> {
  const windowIndex = Math.floor(Date.now() / windowMs);
  const redis = getRedis();

  if (redis) {
    try {
      await redis.del(`rl:${windowIndex}:${key}`);
    } catch {
      // Best-effort — fallbacks below still clear local state.
    }
  }
  await tryPostgresReset(key, windowIndex);
  _memStore.delete(key);
}

export interface RateLimiterStats {
  mode: "redis" | "memory";
  redisConnected: boolean;
  inMemoryEntries: number;
}

/** Return current rate-limiter status (for health checks). */
export function getRateLimiterStats(): RateLimiterStats {
  return {
    mode: _redis ? "redis" : "memory",
    redisConnected: _redis !== null,
    inMemoryEntries: _memStore.size,
  };
}

/** Gracefully close the Redis connection used by the rate limiter. */
export async function closeRateLimiter(): Promise<void> {
  if (_pruneInterval) {
    clearInterval(_pruneInterval);
    _pruneInterval = null;
  }
  if (_redis) {
    await _redis.quit();
    _redis = null;
  }
}
