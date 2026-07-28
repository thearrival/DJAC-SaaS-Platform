import { describe, it, expect } from "vitest";

describe("evaluateScalingReadiness", () => {
  const evaluateScalingReadiness = (input: {
    isProduction: boolean;
    hasRedis: boolean;
    databasePoolSize: number;
    allowInMemoryPersistenceFallback: boolean;
    aiQueueMode: "in_memory" | "redis";
  }) => {
    const warnings: string[] = [];
    if (!input.hasRedis) {
      warnings.push(
        "Redis-backed shared infrastructure is required for multi-instance scale-out."
      );
    }
    if (input.databasePoolSize < 20) {
      warnings.push(
        `DATABASE_POOL_SIZE=${input.databasePoolSize} is below the recommended high-scale baseline of 20.`
      );
    }
    if (input.allowInMemoryPersistenceFallback) {
      warnings.push(
        "In-memory persistence fallback should be disabled for large-scale production traffic."
      );
    }
    if (input.aiQueueMode !== "redis") {
      warnings.push(
        "AI queue mode should use Redis to avoid single-instance bottlenecks."
      );
    }
    return {
      readyForHighScale: input.isProduction && warnings.length === 0,
      warnings,
      recommended: {
        redisRequired: true,
        minDatabasePoolSize: 20,
        preferredAiQueueMode: "redis" as const,
      },
    };
  };

  it("should return ready for optimal production config", () => {
    const result = evaluateScalingReadiness({
      isProduction: true,
      hasRedis: true,
      databasePoolSize: 20,
      allowInMemoryPersistenceFallback: false,
      aiQueueMode: "redis",
    });
    expect(result.readyForHighScale).toBe(true);
    expect(result.warnings).toHaveLength(0);
  });

  it("should warn when Redis is missing", () => {
    const result = evaluateScalingReadiness({
      isProduction: true,
      hasRedis: false,
      databasePoolSize: 20,
      allowInMemoryPersistenceFallback: false,
      aiQueueMode: "redis",
    });
    expect(result.readyForHighScale).toBe(false);
    expect(result.warnings.length).toBeGreaterThanOrEqual(1);
    expect(result.warnings[0]).toContain("Redis");
  });

  it("should warn when pool size is below 20", () => {
    const result = evaluateScalingReadiness({
      isProduction: true,
      hasRedis: true,
      databasePoolSize: 5,
      allowInMemoryPersistenceFallback: false,
      aiQueueMode: "redis",
    });
    expect(result.readyForHighScale).toBe(false);
    expect(result.warnings.some(w => w.includes("DATABASE_POOL_SIZE=5"))).toBe(
      true
    );
  });

  it("should warn when in-memory fallback is enabled in production", () => {
    const result = evaluateScalingReadiness({
      isProduction: true,
      hasRedis: true,
      databasePoolSize: 20,
      allowInMemoryPersistenceFallback: true,
      aiQueueMode: "redis",
    });
    expect(result.readyForHighScale).toBe(false);
    expect(result.warnings.some(w => w.includes("In-memory"))).toBe(true);
  });

  it("should warn when AI queue mode is not redis", () => {
    const result = evaluateScalingReadiness({
      isProduction: true,
      hasRedis: true,
      databasePoolSize: 20,
      allowInMemoryPersistenceFallback: false,
      aiQueueMode: "in_memory",
    });
    expect(result.readyForHighScale).toBe(false);
    expect(result.warnings.some(w => w.includes("AI queue"))).toBe(true);
  });

  it("should never be ready for high scale outside production", () => {
    const result = evaluateScalingReadiness({
      isProduction: false,
      hasRedis: true,
      databasePoolSize: 20,
      allowInMemoryPersistenceFallback: false,
      aiQueueMode: "redis",
    });
    expect(result.readyForHighScale).toBe(false);
  });

  it("should accumulate multiple warnings", () => {
    const result = evaluateScalingReadiness({
      isProduction: true,
      hasRedis: false,
      databasePoolSize: 2,
      allowInMemoryPersistenceFallback: true,
      aiQueueMode: "in_memory",
    });
    expect(result.warnings.length).toBe(4);
  });

  it("should provide recommended values", () => {
    const result = evaluateScalingReadiness({
      isProduction: false,
      hasRedis: false,
      databasePoolSize: 1,
      allowInMemoryPersistenceFallback: true,
      aiQueueMode: "in_memory",
    });
    expect(result.recommended.redisRequired).toBe(true);
    expect(result.recommended.minDatabasePoolSize).toBe(20);
    expect(result.recommended.preferredAiQueueMode).toBe("redis");
  });
});

describe("evaluateStripeBillingConfig", () => {
  const STRIPE_PRICE_ENV_KEYS = [
    "STRIPE_PRICE_STARTER_MONTHLY",
    "STRIPE_PRICE_STARTER_QUARTERLY",
    "STRIPE_PRICE_STARTER_BIANNUAL",
    "STRIPE_PRICE_STARTER_ANNUAL",
    "STRIPE_PRICE_PRO_MONTHLY",
    "STRIPE_PRICE_PRO_QUARTERLY",
    "STRIPE_PRICE_PRO_BIANNUAL",
    "STRIPE_PRICE_PRO_ANNUAL",
    "STRIPE_PRICE_ENTERPRISE_MONTHLY",
    "STRIPE_PRICE_ENTERPRISE_ANNUAL",
  ] as const;

  type StripeEnvLike = {
    STRIPE_SECRET_KEY?: string;
    STRIPE_WEBHOOK_SECRET?: string;
  } & Partial<Record<(typeof STRIPE_PRICE_ENV_KEYS)[number], string>>;

  const evaluateStripeBillingConfig = (env: StripeEnvLike) => {
    const configuredPriceKeys = STRIPE_PRICE_ENV_KEYS.filter(key =>
      Boolean(env[key]?.trim())
    );
    const hasSecretKey = Boolean(env.STRIPE_SECRET_KEY?.trim());
    const hasWebhookSecret = Boolean(env.STRIPE_WEBHOOK_SECRET?.trim());
    const anyStripeConfigured =
      hasSecretKey || hasWebhookSecret || configuredPriceKeys.length > 0;
    const missing: string[] = [];
    if (!anyStripeConfigured) {
      return {
        enabled: false,
        ready: true,
        partiallyConfigured: false,
        missing,
        configuredPriceCount: 0,
      };
    }
    if (!hasSecretKey) missing.push("STRIPE_SECRET_KEY");
    if (!hasWebhookSecret) missing.push("STRIPE_WEBHOOK_SECRET");
    for (const key of STRIPE_PRICE_ENV_KEYS) {
      if (!env[key]?.trim()) missing.push(key);
    }
    return {
      enabled: true,
      ready: missing.length === 0,
      partiallyConfigured: missing.length > 0,
      missing,
      configuredPriceCount: configuredPriceKeys.length,
    };
  };

  it("should return disabled when no Stripe config is present", () => {
    const result = evaluateStripeBillingConfig({});
    expect(result.enabled).toBe(false);
    expect(result.ready).toBe(true);
    expect(result.configuredPriceCount).toBe(0);
  });

  it("should detect partial configuration with missing keys", () => {
    const result = evaluateStripeBillingConfig({
      STRIPE_SECRET_KEY: "sk_test_xxx",
      STRIPE_WEBHOOK_SECRET: "whsec_xxx",
    });
    expect(result.enabled).toBe(true);
    expect(result.ready).toBe(false);
    expect(result.partiallyConfigured).toBe(true);
    expect(result.missing.length).toBeGreaterThan(0);
    expect(
      result.missing.every((k: string) => k.startsWith("STRIPE_PRICE_"))
    ).toBe(true);
  });

  it("should be ready when all Stripe config is present", () => {
    const env: StripeEnvLike = {
      STRIPE_SECRET_KEY: "sk_test_xxx",
      STRIPE_WEBHOOK_SECRET: "whsec_xxx",
    };
    for (const key of STRIPE_PRICE_ENV_KEYS) {
      env[key] = `price_${key.toLowerCase()}`;
    }
    const result = evaluateStripeBillingConfig(env);
    expect(result.enabled).toBe(true);
    expect(result.ready).toBe(true);
    expect(result.partiallyConfigured).toBe(false);
    expect(result.missing).toHaveLength(0);
    expect(result.configuredPriceCount).toBe(10);
  });

  it("should report partially configured when only secret key is missing", () => {
    const env: StripeEnvLike = {
      STRIPE_WEBHOOK_SECRET: "whsec_xxx",
    };
    for (const key of STRIPE_PRICE_ENV_KEYS) {
      env[key] = `price_${key.toLowerCase()}`;
    }
    const result = evaluateStripeBillingConfig(env);
    expect(result.enabled).toBe(true);
    expect(result.ready).toBe(false);
    expect(result.missing).toContain("STRIPE_SECRET_KEY");
  });

  it("should handle empty string values as unconfigured", () => {
    const result = evaluateStripeBillingConfig({
      STRIPE_SECRET_KEY: "",
      STRIPE_WEBHOOK_SECRET: "  ",
    });
    expect(result.enabled).toBe(false);
    expect(result.ready).toBe(true);
  });

  it("should count only non-empty price keys", () => {
    const env: StripeEnvLike = {
      STRIPE_SECRET_KEY: "sk_test_xxx",
      STRIPE_WEBHOOK_SECRET: "whsec_xxx",
      STRIPE_PRICE_STARTER_MONTHLY: "price_starter_monthly",
      STRIPE_PRICE_PRO_MONTHLY: "price_pro_monthly",
    };
    const result = evaluateStripeBillingConfig(env);
    expect(result.configuredPriceCount).toBe(2);
  });
});
