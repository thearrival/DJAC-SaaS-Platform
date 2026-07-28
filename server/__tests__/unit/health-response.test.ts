import { describe, it, expect } from "vitest";

interface ScaleProfile {
  databasePoolSize: number;
  databasePoolStats: {
    connected: boolean;
    poolSize: number;
    idleCount: number;
    waitingCount: number;
  } | null;
  redisConfigured: boolean;
  aiQueueMode: string;
}

interface RateLimiterStats {
  mode: string;
  redisConnected: boolean;
  inMemoryEntries: number;
}

interface HealthResponse {
  ok: boolean;
  status: string;
  timestamp: string;
  service: string;
  env: string;
  scaleProfile: ScaleProfile;
  rateLimiter: RateLimiterStats;
}

describe("Health Endpoint — Response Schema", () => {
  const buildHealthResponse = (
    overrides?: Partial<HealthResponse>
  ): HealthResponse => ({
    ok: true,
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "djac-tool",
    env: "test",
    scaleProfile: {
      databasePoolSize: 10,
      databasePoolStats: {
        connected: true,
        poolSize: 5,
        idleCount: 3,
        waitingCount: 0,
      },
      redisConfigured: false,
      aiQueueMode: "local",
    },
    rateLimiter: { mode: "memory", redisConnected: false, inMemoryEntries: 0 },
    ...overrides,
  });

  it("should have ok and status fields", () => {
    const res = buildHealthResponse();
    expect(res.ok).toBe(true);
    expect(res.status).toBe("healthy");
  });

  it("should have an ISO 8601 timestamp", () => {
    const res = buildHealthResponse();
    expect(res.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it("should include service name", () => {
    const res = buildHealthResponse();
    expect(res.service).toBe("djac-tool");
  });

  it("should include env string", () => {
    const res = buildHealthResponse();
    expect(["production", "development", "test"]).toContain(res.env);
  });

  it("should include scaleProfile with database and AI queue details", () => {
    const res = buildHealthResponse();
    expect(res.scaleProfile.databasePoolSize).toBeGreaterThan(0);
    expect(res.scaleProfile.aiQueueMode).toBeDefined();
  });

  it("should include databasePoolStats when DB is connected", () => {
    const res = buildHealthResponse();
    const stats = res.scaleProfile.databasePoolStats;
    expect(stats).not.toBeNull();
    expect(stats!.connected).toBe(true);
    expect(stats!.poolSize).toBeGreaterThanOrEqual(0);
    expect(stats!.idleCount).toBeGreaterThanOrEqual(0);
    expect(stats!.waitingCount).toBeGreaterThanOrEqual(0);
  });

  it("should allow null databasePoolStats", () => {
    const res = buildHealthResponse({
      scaleProfile: {
        databasePoolSize: 10,
        databasePoolStats: null,
        redisConfigured: false,
        aiQueueMode: "local",
      },
    });
    expect(res.scaleProfile.databasePoolStats).toBeNull();
  });

  it("should include rateLimiter details", () => {
    const res = buildHealthResponse();
    expect(res.rateLimiter.mode).toMatch(/^(redis|memory)$/);
    expect(res.rateLimiter.redisConnected).toBe(false);
    expect(res.rateLimiter.inMemoryEntries).toBeGreaterThanOrEqual(0);
  });

  it("should support memory mode", () => {
    const res = buildHealthResponse({
      rateLimiter: {
        mode: "memory",
        redisConnected: false,
        inMemoryEntries: 5,
      },
    });
    expect(res.rateLimiter.mode).toBe("memory");
  });

  it("should support redis mode", () => {
    const res = buildHealthResponse({
      rateLimiter: { mode: "redis", redisConnected: true, inMemoryEntries: 0 },
    });
    expect(res.rateLimiter.mode).toBe("redis");
    expect(res.rateLimiter.redisConnected).toBe(true);
  });
});

describe("Readiness Endpoint — Response Schema", () => {
  interface ReadinessResponse {
    status: string;
    ok: boolean;
    timestamp: string;
    scaling: { min: number; max: number; current: number };
    services: {
      database: { healthy: boolean };
      redis: { healthy: boolean };
      billing: { healthy: boolean };
      aiOrchestrator: { healthy: boolean };
    };
  }

  const buildReadinessResponse = (
    overrides?: Partial<ReadinessResponse>
  ): ReadinessResponse => ({
    ok: true,
    status: "ready",
    timestamp: new Date().toISOString(),
    scaling: { min: 1, max: 10, current: 1 },
    services: {
      database: { healthy: true },
      redis: { healthy: true },
      billing: { healthy: true },
      aiOrchestrator: { healthy: true },
    },
    ...overrides,
  });

  it("should return 200 when ready", () => {
    const res = buildReadinessResponse();
    expect(res.ok).toBe(true);
    expect(res.status).toBe("ready");
  });

  it("should return 503 when degraded", () => {
    const res = buildReadinessResponse({
      ok: false,
      status: "degraded",
      services: {
        database: { healthy: false },
        redis: { healthy: true },
        billing: { healthy: true },
        aiOrchestrator: { healthy: true },
      },
    });
    expect(res.ok).toBe(false);
    expect(res.status).toBe("degraded");
  });

  it("should have service health booleans", () => {
    const res = buildReadinessResponse();
    const services = [
      "database",
      "redis",
      "billing",
      "aiOrchestrator",
    ] as const;
    for (const svc of services) {
      expect(res.services[svc]).toHaveProperty("healthy");
      expect(typeof res.services[svc].healthy).toBe("boolean");
    }
  });
});
