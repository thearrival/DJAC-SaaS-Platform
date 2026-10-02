import { describe, it, expect } from "vitest";
import { evaluateScalingReadiness } from "../../_core/readiness";

describe("evaluateScalingReadiness", () => {
  const base = {
    isProduction: true,
    hasRedis: true,
    allowInMemoryPersistenceFallback: false,
    aiQueueMode: "redis" as const,
    serverless: false,
  };

  it("is ready for a long-lived server with the recommended pool", () => {
    const result = evaluateScalingReadiness({
      ...base,
      databasePoolSize: 20,
    });
    expect(result.readyForHighScale).toBe(true);
    expect(result.warnings).toHaveLength(0);
  });

  it("warns when Redis is missing", () => {
    const result = evaluateScalingReadiness({
      ...base,
      hasRedis: false,
      databasePoolSize: 20,
      aiQueueMode: "in_memory",
    });
    expect(result.readyForHighScale).toBe(false);
    expect(result.warnings[0]).toContain("Redis");
  });

  it("warns when a long-lived server pool is below 20", () => {
    const result = evaluateScalingReadiness({
      ...base,
      databasePoolSize: 5,
    });
    expect(result.readyForHighScale).toBe(false);
    expect(result.warnings.some(w => w.includes("DATABASE_POOL_SIZE=5"))).toBe(
      true
    );
  });

  it("does NOT warn about a small pool on serverless", () => {
    // Serverless needs a small per-instance pool; the long-lived baseline of 20
    // would re-break the shared connection pooler.
    const result = evaluateScalingReadiness({
      ...base,
      serverless: true,
      databasePoolSize: 2,
    });
    expect(result.warnings.some(w => w.includes("DATABASE_POOL_SIZE"))).toBe(
      false
    );
    expect(result.recommended.maxDatabasePoolSize).toBe(5);
  });

  it("warns when a serverless pool is too large", () => {
    const result = evaluateScalingReadiness({
      ...base,
      serverless: true,
      databasePoolSize: 25,
    });
    expect(result.warnings.some(w => w.includes("serverless"))).toBe(true);
    expect(result.readyForHighScale).toBe(false);
  });

  it("warns when in-memory fallback is enabled in production", () => {
    const result = evaluateScalingReadiness({
      ...base,
      databasePoolSize: 20,
      allowInMemoryPersistenceFallback: true,
    });
    expect(result.readyForHighScale).toBe(false);
    expect(result.warnings.some(w => w.includes("In-memory"))).toBe(true);
  });

  it("warns when AI queue mode is redis but Redis is not configured", () => {
    const result = evaluateScalingReadiness({
      ...base,
      hasRedis: false,
      databasePoolSize: 20,
      aiQueueMode: "redis",
    });
    expect(
      result.warnings.some(w => w.includes("REDIS_URL is not configured"))
    ).toBe(true);
  });

  it("never reports readiness outside production", () => {
    const result = evaluateScalingReadiness({
      ...base,
      isProduction: false,
      databasePoolSize: 20,
    });
    expect(result.readyForHighScale).toBe(false);
  });

  it("provides serverless-aware recommendations", () => {
    const result = evaluateScalingReadiness({
      ...base,
      serverless: true,
      databasePoolSize: 2,
    });
    expect(result.recommended.serverless).toBe(true);
    expect(result.recommended.minDatabasePoolSize).toBe(1);
    expect(result.recommended.maxDatabasePoolSize).toBe(5);
    expect(result.recommended.redisRequired).toBe(false);
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
      STRIPE_WEBHOOK_SECRET: "whsec_test_xxx",
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
      STRIPE_WEBHOOK_SECRET: "whsec_test_xxx",
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
      STRIPE_WEBHOOK_SECRET: "whsec_test_xxx",
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
      STRIPE_WEBHOOK_SECRET: "whsec_test_xxx",
      STRIPE_PRICE_STARTER_MONTHLY: "price_starter_monthly",
      STRIPE_PRICE_PRO_MONTHLY: "price_pro_monthly",
    };
    const result = evaluateStripeBillingConfig(env);
    expect(result.configuredPriceCount).toBe(2);
  });
});
