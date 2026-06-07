/**
 * Rate limiter — Redis-backed (fixed window) with automatic in-memory fallback.
 *
 * When REDIS_URL is configured the counters are stored in Redis so all
 * horizontal replicas share the same budget per client key.
 * If Redis is unreachable the module transparently falls back to an in-process
 * Map without throwing, keeping the server available.
 */

import Redis from "ioredis";
import { ENV } from "./env";

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
        return null;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// In-memory fallback
// ─────────────────────────────────────────────────────────────────────────────

type MemEntry = { count: number; resetAt: number };
const _memStore = new Map<string, MemEntry>();

// Prune expired entries every 5 minutes to prevent unbounded growth.
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of _memStore) {
        if (now > entry.resetAt) _memStore.delete(key);
    }
}, 5 * 60_000).unref();

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
    windowMs: number,
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
        } catch {
            // Redis blipped — fall through to in-memory path silently.
        }
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

/** Gracefully close the Redis connection used by the rate limiter. */
export async function closeRateLimiter(): Promise<void> {
    if (_redis) {
        await _redis.quit();
        _redis = null;
    }
}
