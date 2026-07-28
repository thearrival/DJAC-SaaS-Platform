import { describe, it, expect, beforeEach } from "vitest";

interface MemEntry {
  count: number;
  resetAt: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  limit: number;
}

// ── In-memory rate limiter (no Redis) ─────────────────────────────────────

class InMemoryRateLimiter {
  private store = new Map<string, MemEntry>();

  clear() {
    this.store.clear();
  }

  get size() {
    return this.store.size;
  }

  async checkRateLimit(
    key: string,
    limit: number,
    windowMs: number
  ): Promise<RateLimitResult> {
    const now = Date.now();
    const windowIndex = Math.floor(now / windowMs);
    const windowResetMs = (windowIndex + 1) * windowMs;
    const resetAt = Math.ceil(windowResetMs / 1000);

    const existing = this.store.get(key);

    if (!existing || now > existing.resetAt) {
      this.store.set(key, { count: 1, resetAt: windowResetMs });
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

  getStats(): {
    mode: string;
    redisConnected: boolean;
    inMemoryEntries: number;
  } {
    return {
      mode: "memory",
      redisConnected: false,
      inMemoryEntries: this.store.size,
    };
  }
}

// ── Tests ─────────────────────────────────────────────────────────────────

describe("InMemoryRateLimiter — checkRateLimit", () => {
  let limiter: InMemoryRateLimiter;

  beforeEach(() => {
    limiter = new InMemoryRateLimiter();
  });

  it("should allow the first request", async () => {
    const result = await limiter.checkRateLimit("client-1", 10, 60_000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(9);
    expect(result.limit).toBe(10);
    expect(result.resetAt).toBeGreaterThan(0);
  });

  it("should decrement remaining on each request", async () => {
    await limiter.checkRateLimit("client-1", 10, 60_000);
    const r2 = await limiter.checkRateLimit("client-1", 10, 60_000);
    expect(r2.allowed).toBe(true);
    expect(r2.remaining).toBe(8);

    const r3 = await limiter.checkRateLimit("client-1", 10, 60_000);
    expect(r3.remaining).toBe(7);
  });

  it("should block requests exceeding the limit", async () => {
    for (let i = 0; i < 5; i++) {
      await limiter.checkRateLimit("client-1", 5, 60_000);
    }
    const result = await limiter.checkRateLimit("client-1", 5, 60_000);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("should track different keys independently", async () => {
    for (let i = 0; i < 10; i++) {
      await limiter.checkRateLimit("client-1", 10, 60_000);
    }
    const blocked = await limiter.checkRateLimit("client-1", 10, 60_000);
    expect(blocked.allowed).toBe(false);

    const allowed = await limiter.checkRateLimit("client-2", 10, 60_000);
    expect(allowed.allowed).toBe(true);
  });

  it("should reset after window expires", async () => {
    const shortWindow = 50;
    await limiter.checkRateLimit("client-1", 1, shortWindow);
    let result = await limiter.checkRateLimit("client-1", 1, shortWindow);
    expect(result.allowed).toBe(false);

    await new Promise(resolve => setTimeout(resolve, shortWindow + 10));

    result = await limiter.checkRateLimit("client-1", 1, shortWindow);
    expect(result.allowed).toBe(true);
  });

  it("should handle limit of 1 correctly", async () => {
    const r1 = await limiter.checkRateLimit("client-1", 1, 60_000);
    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(0);

    const r2 = await limiter.checkRateLimit("client-1", 1, 60_000);
    expect(r2.allowed).toBe(false);
  });

  it("should handle high limits", async () => {
    for (let i = 0; i < 1000; i++) {
      await limiter.checkRateLimit("client-1", 1000, 60_000);
    }
    const result = await limiter.checkRateLimit("client-1", 1000, 60_000);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("should return consistent resetAt within same window", async () => {
    const r1 = await limiter.checkRateLimit("client-1", 5, 60_000);
    const r2 = await limiter.checkRateLimit("client-1", 5, 60_000);
    expect(r1.resetAt).toBe(r2.resetAt);
  });

  it("should track entries in store", async () => {
    expect(limiter.size).toBe(0);
    await limiter.checkRateLimit("client-1", 5, 60_000);
    expect(limiter.size).toBe(1);
    await limiter.checkRateLimit("client-2", 5, 60_000);
    expect(limiter.size).toBe(2);
  });
});

describe("InMemoryRateLimiter — getStats", () => {
  it("should return memory mode", () => {
    const limiter = new InMemoryRateLimiter();
    const stats = limiter.getStats();
    expect(stats.mode).toBe("memory");
    expect(stats.redisConnected).toBe(false);
    expect(stats.inMemoryEntries).toBe(0);
  });

  it("should reflect in-memory entry count", async () => {
    const limiter = new InMemoryRateLimiter();
    await limiter.checkRateLimit("key-1", 5, 60_000);
    await limiter.checkRateLimit("key-2", 5, 60_000);
    expect(limiter.getStats().inMemoryEntries).toBe(2);
  });
});
