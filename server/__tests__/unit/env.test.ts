import { describe, it, expect } from "vitest";

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
  STRIPE_SECRET_KEY?: string | undefined;
  STRIPE_WEBHOOK_SECRET?: string | undefined;
} & Partial<Record<(typeof STRIPE_PRICE_ENV_KEYS)[number], string | undefined>>;

function evaluateStripeBillingConfig(env: StripeEnvLike) {
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
}

function parseQueueMode(
  value: string | undefined
): "in_memory" | "redis" | undefined {
  if (value === "redis" || value === "in_memory") return value;
  return undefined;
}

function resolveAiQueueMode(
  value: string | undefined,
  options: { isProduction: boolean; redisUrl?: string }
): "in_memory" | "redis" {
  const explicitMode = parseQueueMode(value);
  const hasRedis = Boolean((options.redisUrl ?? "").trim());
  if (options.isProduction && hasRedis) return "redis";
  if (explicitMode) return explicitMode;
  return "in_memory";
}

const parseDevRole = (
  value: string | undefined
):
  | "user"
  | "admin"
  | "basic_user"
  | "professional_user"
  | "company_admin"
  | "platform_admin"
  | "yalla_hack_employee"
  | "super_admin" => {
  const valid = [
    "user",
    "admin",
    "basic_user",
    "professional_user",
    "company_admin",
    "platform_admin",
    "yalla_hack_employee",
    "super_admin",
  ] as const;
  return (valid as readonly string[]).includes(value ?? "")
    ? (value as (typeof valid)[number])
    : "user";
};

function intEnv(
  raw: string | undefined,
  fallback: number,
  min: number,
  max: number
): number {
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function checkProductionEnv(
  envOverrides?: Partial<{
    NODE_ENV: string;
    JWT_SECRET: string;
    DATABASE_URL: string;
    APP_URL: string;
    STRIPE_SECRET_KEY: string;
    STRIPE_WEBHOOK_SECRET: string;
  }> &
    Partial<Record<(typeof STRIPE_PRICE_ENV_KEYS)[number], string>>
): string[] | never {
  const env = {
    NODE_ENV: "production",
    JWT_SECRET: "this-is-a-long-enough-jwt-secret-for-testing-32chars",
    DATABASE_URL: "postgres://localhost:5432/test",
    APP_URL: "https://example.com",
    STRIPE_SECRET_KEY: "",
    STRIPE_WEBHOOK_SECRET: "",
    ...envOverrides,
  };

  if (env.NODE_ENV !== "production") return [];

  const warnings: string[] = [];
  const errors: string[] = [];

  if (!env.JWT_SECRET) errors.push("JWT_SECRET");
  if (!env.DATABASE_URL) errors.push("DATABASE_URL");
  if (!env.APP_URL || env.APP_URL === "http://localhost:3000") {
    errors.push("APP_URL (must be set to the production URL)");
  }

  if (errors.length > 0) {
    throw new Error(
      `[FATAL] Required environment variable(s) not set: ${errors.join(", ")}. Refusing to start.`
    );
  }

  if (env.JWT_SECRET.length < 32) {
    throw new Error(
      "[FATAL] JWT_SECRET must be at least 32 characters for production use."
    );
  }

  const stripeConfig = evaluateStripeBillingConfig({
    STRIPE_SECRET_KEY: env.STRIPE_SECRET_KEY || undefined,
    STRIPE_WEBHOOK_SECRET: env.STRIPE_WEBHOOK_SECRET || undefined,
  });

  if (stripeConfig.partiallyConfigured) {
    warnings.push(
      `Stripe billing is partially configured. Missing: ${stripeConfig.missing.join(", ")}.`
    );
  }

  if (!env.STRIPE_SECRET_KEY) {
    warnings.push(
      "STRIPE_SECRET_KEY is not set. Billing and checkout flows are disabled."
    );
  }

  return warnings;
}

// ── STRIPE_PRICE_ENV_KEYS ─────────────────────────────────────────────────

describe("STRIPE_PRICE_ENV_KEYS", () => {
  it("should have 10 price keys", () => {
    expect(STRIPE_PRICE_ENV_KEYS).toHaveLength(10);
  });

  it("should include all plan tiers", () => {
    expect(STRIPE_PRICE_ENV_KEYS).toContain("STRIPE_PRICE_STARTER_MONTHLY");
    expect(STRIPE_PRICE_ENV_KEYS).toContain("STRIPE_PRICE_PRO_MONTHLY");
    expect(STRIPE_PRICE_ENV_KEYS).toContain("STRIPE_PRICE_ENTERPRISE_MONTHLY");
    expect(STRIPE_PRICE_ENV_KEYS).toContain("STRIPE_PRICE_ENTERPRISE_ANNUAL");
  });

  it("should be defined as const", () => {
    expect(STRIPE_PRICE_ENV_KEYS).toBeDefined();
  });
});

// ── parseQueueMode ────────────────────────────────────────────────────────

describe("parseQueueMode", () => {
  it("should return 'redis' for 'redis'", () => {
    expect(parseQueueMode("redis")).toBe("redis");
  });

  it("should return 'in_memory' for 'in_memory'", () => {
    expect(parseQueueMode("in_memory")).toBe("in_memory");
  });

  it("should return undefined for undefined", () => {
    expect(parseQueueMode(undefined)).toBeUndefined();
  });

  it("should return undefined for empty string", () => {
    expect(parseQueueMode("")).toBeUndefined();
  });

  it("should return undefined for unknown value", () => {
    expect(parseQueueMode("invalid")).toBeUndefined();
  });

  it("should be case-sensitive", () => {
    expect(parseQueueMode("REDIS")).toBeUndefined();
    expect(parseQueueMode("IN_MEMORY")).toBeUndefined();
  });
});

// ── resolveAiQueueMode ────────────────────────────────────────────────────

describe("resolveAiQueueMode", () => {
  it("should return 'redis' in production with redis URL", () => {
    expect(
      resolveAiQueueMode(undefined, {
        isProduction: true,
        redisUrl: "redis://localhost:6379",
      })
    ).toBe("redis");
  });

  it("should return 'in_memory' in production without redis URL", () => {
    expect(
      resolveAiQueueMode(undefined, { isProduction: true, redisUrl: "" })
    ).toBe("in_memory");
  });

  it("should return 'in_memory' in production with only whitespace redis URL", () => {
    expect(
      resolveAiQueueMode(undefined, { isProduction: true, redisUrl: "   " })
    ).toBe("in_memory");
  });

  it("should respect explicit 'redis' mode in development with redis URL", () => {
    expect(
      resolveAiQueueMode("redis", {
        isProduction: false,
        redisUrl: "redis://localhost:6379",
      })
    ).toBe("redis");
  });

  it("should respect explicit 'in_memory' mode in development without redis", () => {
    expect(
      resolveAiQueueMode("in_memory", {
        isProduction: false,
        redisUrl: "",
      })
    ).toBe("in_memory");
  });

  it("should default to 'in_memory' in development with no explicit mode", () => {
    expect(
      resolveAiQueueMode(undefined, { isProduction: false, redisUrl: "" })
    ).toBe("in_memory");
  });

  it("should fall back to 'in_memory' for invalid explicit mode", () => {
    expect(
      resolveAiQueueMode("invalid", {
        isProduction: false,
        redisUrl: "",
      })
    ).toBe("in_memory");
  });

  it("should ignore explicit mode when production has redis", () => {
    expect(
      resolveAiQueueMode("in_memory", {
        isProduction: true,
        redisUrl: "redis://localhost:6379",
      })
    ).toBe("redis");
  });
});

// ── parseDevRole ──────────────────────────────────────────────────────────

describe("parseDevRole", () => {
  it("should return 'user' as default for undefined", () => {
    expect(parseDevRole(undefined)).toBe("user");
  });

  it("should return 'user' as default for empty string", () => {
    expect(parseDevRole("")).toBe("user");
  });

  it("should return 'admin' for 'admin'", () => {
    expect(parseDevRole("admin")).toBe("admin");
  });

  it("should return 'super_admin' for 'super_admin'", () => {
    expect(parseDevRole("super_admin")).toBe("super_admin");
  });

  it("should return 'yalla_hack_employee' for 'yalla_hack_employee'", () => {
    expect(parseDevRole("yalla_hack_employee")).toBe("yalla_hack_employee");
  });

  it("should return 'user' for unknown role", () => {
    expect(parseDevRole("unknown_role")).toBe("user");
  });

  it("should handle all valid roles", () => {
    const validRoles = [
      "user",
      "admin",
      "basic_user",
      "professional_user",
      "company_admin",
      "platform_admin",
      "yalla_hack_employee",
      "super_admin",
    ] as const;
    for (const role of validRoles) {
      expect(parseDevRole(role)).toBe(role);
    }
  });
});

// ── evaluateStripeBillingConfig ───────────────────────────────────────────

describe("evaluateStripeBillingConfig", () => {
  it("should return disabled when nothing is configured", () => {
    const result = evaluateStripeBillingConfig({});
    expect(result.enabled).toBe(false);
    expect(result.ready).toBe(true);
    expect(result.partiallyConfigured).toBe(false);
    expect(result.configuredPriceCount).toBe(0);
    expect(result.missing).toEqual([]);
  });

  it("should return enabled and ready when all fields are set", () => {
    const result = evaluateStripeBillingConfig({
      STRIPE_SECRET_KEY: "sk_live_xxx",
      STRIPE_WEBHOOK_SECRET: "whsec_xxx",
      STRIPE_PRICE_STARTER_MONTHLY: "price_starter_monthly",
      STRIPE_PRICE_STARTER_QUARTERLY: "price_starter_quarterly",
      STRIPE_PRICE_STARTER_BIANNUAL: "price_starter_biannual",
      STRIPE_PRICE_STARTER_ANNUAL: "price_starter_annual",
      STRIPE_PRICE_PRO_MONTHLY: "price_pro_monthly",
      STRIPE_PRICE_PRO_QUARTERLY: "price_pro_quarterly",
      STRIPE_PRICE_PRO_BIANNUAL: "price_pro_biannual",
      STRIPE_PRICE_PRO_ANNUAL: "price_pro_annual",
      STRIPE_PRICE_ENTERPRISE_MONTHLY: "price_enterprise_monthly",
      STRIPE_PRICE_ENTERPRISE_ANNUAL: "price_enterprise_annual",
    });
    expect(result.enabled).toBe(true);
    expect(result.ready).toBe(true);
    expect(result.partiallyConfigured).toBe(false);
    expect(result.missing).toEqual([]);
    expect(result.configuredPriceCount).toBe(10);
  });

  it("should report partially configured when secret key is missing", () => {
    const result = evaluateStripeBillingConfig({
      STRIPE_WEBHOOK_SECRET: "whsec_xxx",
      STRIPE_PRICE_STARTER_MONTHLY: "price_starter_monthly",
    });
    expect(result.enabled).toBe(true);
    expect(result.ready).toBe(false);
    expect(result.partiallyConfigured).toBe(true);
    expect(result.missing).toContain("STRIPE_SECRET_KEY");
  });

  it("should report partially configured when webhook secret is missing", () => {
    const result = evaluateStripeBillingConfig({
      STRIPE_SECRET_KEY: "sk_live_xxx",
      STRIPE_PRICE_STARTER_MONTHLY: "price_starter_monthly",
    });
    expect(result.enabled).toBe(true);
    expect(result.ready).toBe(false);
    expect(result.partiallyConfigured).toBe(true);
    expect(result.missing).toContain("STRIPE_WEBHOOK_SECRET");
  });

  it("should report missing price IDs when not configured", () => {
    const result = evaluateStripeBillingConfig({
      STRIPE_SECRET_KEY: "sk_live_xxx",
      STRIPE_WEBHOOK_SECRET: "whsec_xxx",
    });
    expect(result.enabled).toBe(true);
    expect(result.ready).toBe(false);
    expect(result.partiallyConfigured).toBe(true);
    expect(result.missing.length).toBe(10);
    STRIPE_PRICE_ENV_KEYS.forEach(key => {
      expect(result.missing).toContain(key);
    });
  });

  it("should handle whitespace-only values as unconfigured", () => {
    const result = evaluateStripeBillingConfig({
      STRIPE_SECRET_KEY: "   ",
      STRIPE_PRICE_STARTER_MONTHLY: "   ",
    });
    expect(result.enabled).toBe(false);
    expect(result.ready).toBe(true);
  });

  it("should be enabled when only a price key is set", () => {
    const result = evaluateStripeBillingConfig({
      STRIPE_PRICE_PRO_MONTHLY: "price_pro_monthly",
    });
    expect(result.enabled).toBe(true);
    expect(result.ready).toBe(false);
    expect(result.configuredPriceCount).toBe(1);
  });
});

// ── checkProductionEnv ────────────────────────────────────────────────────

describe("checkProductionEnv", () => {
  it("should not throw when all required vars are present and JWT is long enough", () => {
    expect(() => checkProductionEnv()).not.toThrow();
  });

  it("should throw when JWT_SECRET is missing", () => {
    expect(() => checkProductionEnv({ JWT_SECRET: "" })).toThrow("JWT_SECRET");
  });

  it("should throw when DATABASE_URL is missing", () => {
    expect(() => checkProductionEnv({ DATABASE_URL: "" })).toThrow(
      "DATABASE_URL"
    );
  });

  it("should throw when APP_URL is localhost in production", () => {
    expect(() =>
      checkProductionEnv({ APP_URL: "http://localhost:3000" })
    ).toThrow("APP_URL (must be set to the production URL)");
  });

  it("should throw when APP_URL is missing", () => {
    expect(() => checkProductionEnv({ APP_URL: "" })).toThrow("APP_URL");
  });

  it("should throw when JWT_SECRET is shorter than 32 characters", () => {
    expect(() => checkProductionEnv({ JWT_SECRET: "short-secret" })).toThrow(
      "at least 32 characters"
    );
  });

  it("should throw for multiple missing vars in one message", () => {
    expect(() =>
      checkProductionEnv({ JWT_SECRET: "", DATABASE_URL: "" })
    ).toThrow("JWT_SECRET");
  });

  it("should return warnings when Stripe is partially configured", () => {
    const warnings = checkProductionEnv({
      STRIPE_SECRET_KEY: "",
    });
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings.some(w => w.includes("STRIPE_SECRET_KEY"))).toBe(true);
  });
});

// ── intEnv helper ─────────────────────────────────────────────────────────

describe("intEnv", () => {
  it("should return fallback when raw is undefined", () => {
    expect(intEnv(undefined, 10, 1, 100)).toBe(10);
  });

  it("should return fallback when raw is empty string", () => {
    expect(intEnv("", 10, 1, 100)).toBe(10);
  });

  it("should return fallback when raw is not a number", () => {
    expect(intEnv("abc", 10, 1, 100)).toBe(10);
  });

  it("should parse valid integer", () => {
    expect(intEnv("50", 10, 1, 100)).toBe(50);
  });

  it("should clamp to min", () => {
    expect(intEnv("-5", 10, 1, 100)).toBe(1);
  });

  it("should clamp to max", () => {
    expect(intEnv("200", 10, 1, 100)).toBe(100);
  });
});
