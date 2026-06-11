import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  TRIAL_DAYS,
  trialEndsAt,
  daysRemainingInTrial,
  isTrialExpired,
  isAccessAllowed,
} from "../../services/billing-entitlements";

describe("Billing - Trial Constants", () => {
  it("should have a 7-day trial period", () => {
    expect(TRIAL_DAYS).toBe(7);
  });
});

describe("Billing - trialEndsAt", () => {
  it("should calculate end date exactly TRIAL_DAYS after start", () => {
    const start = new Date("2026-01-01T00:00:00Z");
    const end = trialEndsAt(start);
    expect(end.getTime() - start.getTime()).toBe(TRIAL_DAYS * 86_400_000);
  });

  it("should handle month boundaries correctly", () => {
    const start = new Date("2026-01-28T00:00:00Z");
    const end = trialEndsAt(start);
    expect(end.getDate()).toBe(4);
    expect(end.getMonth()).toBe(1);
  });
});

describe("Billing - daysRemainingInTrial", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should return 0 when trialEndsAt is null", () => {
    expect(daysRemainingInTrial({ trialEndsAt: null })).toBe(0);
  });

  it("should return remaining days when trial is active", () => {
    const future = new Date(Date.now() + 3 * 86_400_000);
    const days = daysRemainingInTrial({ trialEndsAt: future });
    expect(days).toBe(3);
  });

  it("should return 0 when trial has expired", () => {
    const past = new Date(Date.now() - 1 * 86_400_000);
    expect(daysRemainingInTrial({ trialEndsAt: past })).toBe(0);
  });

  it("should return 0 when trial ends right now", () => {
    const now = new Date();
    expect(daysRemainingInTrial({ trialEndsAt: now })).toBe(0);
  });
});

describe("Billing - isTrialExpired", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should return false for non-trial plans", () => {
    expect(isTrialExpired({ plan: "starter", trialEndsAt: null })).toBe(false);
    expect(isTrialExpired({ plan: "professional", trialEndsAt: new Date(Date.now() - 100_000) })).toBe(false);
  });

  it("should return false when trial is still active", () => {
    const future = new Date(Date.now() + 86_400_000);
    expect(isTrialExpired({ plan: "free_trial", trialEndsAt: future })).toBe(false);
  });

  it("should return true when trial has ended", () => {
    const past = new Date(Date.now() - 86_400_000);
    expect(isTrialExpired({ plan: "free_trial", trialEndsAt: past })).toBe(true);
  });

  it("should return true when trialEndsAt is null on free_trial", () => {
    expect(isTrialExpired({ plan: "free_trial", trialEndsAt: null })).toBe(true);
  });
});

describe("Billing - isAccessAllowed", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should allow access during active trial", () => {
    const future = new Date(Date.now() + 86_400_000);
    expect(isAccessAllowed({ plan: "free_trial", trialEndsAt: future })).toBe(true);
  });

  it("should deny access when trial expired and no subscription", () => {
    const past = new Date(Date.now() - 86_400_000);
    expect(isAccessAllowed({ plan: "free_trial", trialEndsAt: past })).toBe(false);
    expect(isAccessAllowed({ plan: "free_trial", trialEndsAt: past }, null)).toBe(false);
  });

  it("should allow access with active subscription", () => {
    expect(isAccessAllowed({ plan: "starter", trialEndsAt: null }, { status: "active" })).toBe(true);
    expect(isAccessAllowed({ plan: "professional", trialEndsAt: null }, { status: "trialing" })).toBe(true);
  });

  it("should deny access with non-active subscription statuses", () => {
    expect(isAccessAllowed({ plan: "starter", trialEndsAt: null }, { status: "past_due" })).toBe(false);
    expect(isAccessAllowed({ plan: "starter", trialEndsAt: null }, { status: "canceled" })).toBe(false);
    expect(isAccessAllowed({ plan: "starter", trialEndsAt: null }, { status: "incomplete" })).toBe(false);
    expect(isAccessAllowed({ plan: "starter", trialEndsAt: null }, { status: "paused" })).toBe(false);
  });

  it("should deny access with no subscription on non-trial plan", () => {
    expect(isAccessAllowed({ plan: "starter", trialEndsAt: null })).toBe(false);
    expect(isAccessAllowed({ plan: "professional", trialEndsAt: null }, null)).toBe(false);
  });

  it("should prefer subscription status over trial status", () => {
    const past = new Date(Date.now() - 86_400_000);
    expect(isAccessAllowed({ plan: "free_trial", trialEndsAt: past }, { status: "active" })).toBe(true);
  });
});
