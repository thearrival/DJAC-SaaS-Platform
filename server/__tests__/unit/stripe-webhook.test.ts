import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("stripe", () => ({
  default: vi.fn().mockImplementation(() => ({
    webhooks: {
      constructEvent: vi.fn(),
    },
    checkout: {
      sessions: {
        create: vi.fn(),
      },
    },
    billingPortal: {
      sessions: {
        create: vi.fn(),
      },
    },
    customers: {
      create: vi.fn(),
    },
  })),
}));

vi.mock("../db", () => ({
  getDb: vi.fn().mockResolvedValue(null),
}));

vi.mock("../billing", async () => {
  const actual =
    await vi.importActual<typeof import("../billing")>("../billing");
  return {
    ...actual,
    getStripe: vi.fn().mockResolvedValue({
      webhooks: {
        constructEvent: vi.fn(),
      },
    }),
  };
});

import { PRICE_CATALOG, getPriceTier } from "../../billing";
import {
  TRIAL_DAYS,
  trialEndsAt,
  daysRemainingInTrial,
  isTrialExpired,
  isAccessAllowed,
  getTierLimits,
  classifyAccountState,
  TIER_MATRIX,
} from "../../services/billing-entitlements";

// ─── Price Catalog Integrity ──────────────────────────────────────────

describe("Stripe Price Catalog", () => {
  it("should contain all 12 price tiers (3 plans x 4 intervals)", () => {
    expect(PRICE_CATALOG).toHaveLength(12);
  });

  it("each tier should have a unique (plan, interval) combination", () => {
    const combos = new Set(PRICE_CATALOG.map(t => `${t.plan}:${t.interval}`));
    expect(combos.size).toBe(12);
  });

  it("each tier should have a valid amount > 0", () => {
    for (const tier of PRICE_CATALOG) {
      expect(tier.amountCents).toBeGreaterThan(0);
    }
  });

  it("each tier should have a non-empty label", () => {
    for (const tier of PRICE_CATALOG) {
      expect(tier.label.length).toBeGreaterThan(0);
    }
  });

  it("annual pricing should offer savings vs monthly", () => {
    for (const plan of ["starter", "professional", "enterprise"] as const) {
      const monthly = getPriceTier(plan, "monthly");
      const annual = getPriceTier(plan, "annual");
      if (monthly && annual) {
        const monthlyAnnualized = monthly.amountCents * 12;
        expect(annual.amountCents).toBeLessThanOrEqual(monthlyAnnualized);
      }
    }
  });

  it("quarterly pricing should offer savings vs 3x monthly", () => {
    for (const plan of ["starter", "professional", "enterprise"] as const) {
      const monthly = getPriceTier(plan, "monthly");
      const quarterly = getPriceTier(plan, "quarterly");
      if (monthly && quarterly) {
        const monthliesQuarterly = monthly.amountCents * 3;
        expect(quarterly.amountCents).toBeLessThanOrEqual(monthliesQuarterly);
      }
    }
  });

  it("biannual pricing should offer savings vs 6x monthly", () => {
    for (const plan of ["starter", "professional", "enterprise"] as const) {
      const monthly = getPriceTier(plan, "monthly");
      const biannual = getPriceTier(plan, "biannual");
      if (monthly && biannual) {
        const monthliesBiannual = monthly.amountCents * 6;
        expect(biannual.amountCents).toBeLessThanOrEqual(monthliesBiannual);
      }
    }
  });

  it("professional should cost more than starter", () => {
    for (const interval of [
      "monthly",
      "quarterly",
      "biannual",
      "annual",
    ] as const) {
      const starter = getPriceTier("starter", interval);
      const pro = getPriceTier("professional", interval);
      if (starter && pro) {
        expect(pro.amountCents).toBeGreaterThan(starter.amountCents);
      }
    }
  });

  it("enterprise should cost more than professional", () => {
    for (const interval of [
      "monthly",
      "quarterly",
      "biannual",
      "annual",
    ] as const) {
      const pro = getPriceTier("professional", interval);
      const enterprise = getPriceTier("enterprise", interval);
      if (pro && enterprise) {
        expect(enterprise.amountCents).toBeGreaterThan(pro.amountCents);
      }
    }
  });

  it("getPriceTier should return undefined for invalid combos", () => {
    expect(getPriceTier("starter" as any, "weekly" as any)).toBeUndefined();
    expect(getPriceTier("free" as any, "monthly" as any)).toBeUndefined();
  });

  it("savingsLabel should exist for all non-monthly tiers", () => {
    const nonMonthly = PRICE_CATALOG.filter(t => t.interval !== "monthly");
    for (const tier of nonMonthly) {
      expect(tier.savingsLabel).toBeDefined();
      expect(tier.savingsLabel!.length).toBeGreaterThan(0);
    }
  });

  it("monthly tiers should not have savingsLabel", () => {
    const monthlyTiers = PRICE_CATALOG.filter(t => t.interval === "monthly");
    for (const tier of monthlyTiers) {
      expect(tier.savingsLabel).toBeUndefined();
    }
  });

  it("all tiers should have a stripePriceId field (even if empty in test env)", () => {
    for (const tier of PRICE_CATALOG) {
      expect(tier).toHaveProperty("stripePriceId");
    }
  });
});

// ─── Trial Logic (Comprehensive) ─────────────────────────────────────

describe("Trial System - Comprehensive", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("TRIAL_DAYS should be 7", () => {
    expect(TRIAL_DAYS).toBe(7);
  });

  it("trialEndsAt should return correct UTC date", () => {
    const start = new Date("2026-06-15T00:00:00Z");
    const end = trialEndsAt(start);
    expect(end.toISOString()).toBe("2026-06-22T00:00:00.000Z");
  });

  it("daysRemainingInTrial should return ceil of remaining days", () => {
    const future = new Date(Date.now() + 2.5 * 86_400_000);
    expect(daysRemainingInTrial({ trialEndsAt: future })).toBe(3);
  });

  it("isTrialExpired should return false for active trial", () => {
    const future = new Date(Date.now() + 86_400_000);
    expect(isTrialExpired({ plan: "free_trial", trialEndsAt: future })).toBe(
      false
    );
  });

  it("isTrialExpired should return true for expired trial", () => {
    const past = new Date(Date.now() - 1);
    expect(isTrialExpired({ plan: "free_trial", trialEndsAt: past })).toBe(
      true
    );
  });

  it("isAccessAllowed should handle all subscription states", () => {
    const future = new Date(Date.now() + 86_400_000);
    const past = new Date(Date.now() - 86_400_000);

    // Active trial
    expect(isAccessAllowed({ plan: "free_trial", trialEndsAt: future })).toBe(
      true
    );
    // Expired trial, no sub
    expect(isAccessAllowed({ plan: "free_trial", trialEndsAt: past })).toBe(
      false
    );
    // Active subscription
    expect(
      isAccessAllowed(
        { plan: "starter", trialEndsAt: null },
        { status: "active" }
      )
    ).toBe(true);
    // Past due subscription
    expect(
      isAccessAllowed(
        { plan: "starter", trialEndsAt: null },
        { status: "past_due" }
      )
    ).toBe(false);
    // Canceled subscription
    expect(
      isAccessAllowed(
        { plan: "starter", trialEndsAt: null },
        { status: "canceled" }
      )
    ).toBe(false);
    // Trialing subscription
    expect(
      isAccessAllowed(
        { plan: "professional", trialEndsAt: null },
        { status: "trialing" }
      )
    ).toBe(true);
    // Expired trial but active subscription
    expect(
      isAccessAllowed(
        { plan: "free_trial", trialEndsAt: past },
        { status: "active" }
      )
    ).toBe(true);
  });
});

// ─── Tier Feature Matrix ──────────────────────────────────────────────

describe("Tier Feature Matrix", () => {
  it("should have all 3 plan tiers in TIER_MATRIX", () => {
    expect(Object.keys(TIER_MATRIX)).toEqual([
      "starter",
      "professional",
      "enterprise",
    ]);
  });

  it("professional should have more limits than starter", () => {
    expect(TIER_MATRIX.professional.maxVendors).toBeGreaterThan(
      TIER_MATRIX.starter.maxVendors
    );
    expect(TIER_MATRIX.professional.maxFrameworks).toBeGreaterThan(
      TIER_MATRIX.starter.maxFrameworks
    );
    expect(TIER_MATRIX.professional.maxSeats).toBeGreaterThan(
      TIER_MATRIX.starter.maxSeats
    );
    expect(TIER_MATRIX.professional.maxAiReportsPerDay).toBeGreaterThan(
      TIER_MATRIX.starter.maxAiReportsPerDay
    );
  });

  it("enterprise should have the highest limits", () => {
    expect(TIER_MATRIX.enterprise.maxVendors).toBeGreaterThan(
      TIER_MATRIX.professional.maxVendors
    );
    expect(TIER_MATRIX.enterprise.maxFrameworks).toBeGreaterThan(
      TIER_MATRIX.professional.maxFrameworks
    );
    expect(TIER_MATRIX.enterprise.maxSeats).toBeGreaterThan(
      TIER_MATRIX.professional.maxSeats
    );
    expect(TIER_MATRIX.enterprise.maxAiReportsPerDay).toBeGreaterThan(
      TIER_MATRIX.professional.maxAiReportsPerDay
    );
  });

  it("enterprise should have all premium features", () => {
    expect(TIER_MATRIX.enterprise.supportsApiAccess).toBe(true);
    expect(TIER_MATRIX.enterprise.supportsCustomReports).toBe(true);
    expect(TIER_MATRIX.enterprise.supportsPrioritySupport).toBe(true);
    expect(TIER_MATRIX.enterprise.supportsWhiteLabel).toBe(true);
  });

  it("starter should not have premium features", () => {
    expect(TIER_MATRIX.starter.supportsApiAccess).toBe(false);
    expect(TIER_MATRIX.starter.supportsCustomReports).toBe(false);
    expect(TIER_MATRIX.starter.supportsPrioritySupport).toBe(false);
    expect(TIER_MATRIX.starter.supportsWhiteLabel).toBe(false);
  });

  it("getTierLimits should return starter for unknown plans", () => {
    const limits = getTierLimits("unknown_plan");
    expect(limits.maxVendors).toBe(TIER_MATRIX.starter.maxVendors);
  });

  it("getTierLimits should return correct limits for each tier", () => {
    expect(getTierLimits("starter").maxSeats).toBe(3);
    expect(getTierLimits("professional").maxSeats).toBe(15);
    expect(getTierLimits("enterprise").maxSeats).toBe(999);
  });
});

// ─── Account State Classification ─────────────────────────────────────

describe("Account State Classification", () => {
  it("should classify active trial as 'trialing'", () => {
    const future = new Date(Date.now() + 86_400_000);
    expect(
      classifyAccountState({ plan: "free_trial", trialEndsAt: future })
    ).toBe("trialing");
  });

  it("should classify expired trial as 'expired_trial'", () => {
    const past = new Date(Date.now() - 86_400_000);
    expect(
      classifyAccountState({ plan: "free_trial", trialEndsAt: past })
    ).toBe("expired_trial");
  });

  it("should classify active starter subscription", () => {
    expect(
      classifyAccountState(
        { plan: "starter", trialEndsAt: null },
        { status: "active", plan: "starter" }
      )
    ).toBe("active:starter");
  });

  it("should classify active professional subscription", () => {
    expect(
      classifyAccountState(
        { plan: "professional", trialEndsAt: null },
        { status: "active", plan: "professional" }
      )
    ).toBe("active:professional");
  });

  it("should classify active enterprise subscription", () => {
    expect(
      classifyAccountState(
        { plan: "enterprise", trialEndsAt: null },
        { status: "active", plan: "enterprise" }
      )
    ).toBe("active:enterprise");
  });

  it("should classify past_due subscription", () => {
    expect(
      classifyAccountState(
        { plan: "starter", trialEndsAt: null },
        { status: "past_due", plan: "starter" }
      )
    ).toBe("past_due");
  });

  it("should classify canceled subscription", () => {
    expect(
      classifyAccountState(
        { plan: "starter", trialEndsAt: null },
        { status: "canceled", plan: "starter" }
      )
    ).toBe("canceled");
  });
});

// ─── Pricing Summary Report ───────────────────────────────────────────

describe("Pricing Summary for Invoice/Report", () => {
  it("should generate all plan x interval combinations for testing", () => {
    const summary = PRICE_CATALOG.map(t => ({
      plan: t.plan,
      interval: t.interval,
      price: `$${(t.amountCents / 100).toFixed(2)}`,
      savings: t.savingsLabel ?? "—",
      label: t.label,
    }));

    expect(summary).toHaveLength(12);

    for (const entry of summary) {
      expect(entry.price).toBeDefined();
      expect(entry.plan).toBeDefined();
      expect(entry.interval).toBeDefined();
    }
  });
});
