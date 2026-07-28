import { describe, it, expect, vi, afterEach } from "vitest";

const TRIAL_DAYS = 7;

function trialEndsAt(startedAt: Date): Date {
  const endAt = new Date(startedAt);
  endAt.setDate(endAt.getDate() + TRIAL_DAYS);
  return endAt;
}

function daysRemainingInTrial(org: { trialEndsAt: Date | null }): number {
  if (!org.trialEndsAt) return 0;
  const diff = org.trialEndsAt.getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86_400_000));
}

function isTrialExpired(org: {
  plan: string;
  trialEndsAt: Date | null;
}): boolean {
  if (org.plan !== "free_trial") return false;
  if (!org.trialEndsAt) return true;
  return org.trialEndsAt.getTime() < Date.now();
}

function isAccessAllowed(
  org: { plan: string; trialEndsAt: Date | null },
  sub?: { status: string } | null
): boolean {
  if (org.plan === "free_trial" && !isTrialExpired(org)) return true;
  if (!sub) return false;
  return sub.status === "active" || sub.status === "trialing";
}

// ── trialEndsAt ──────────────────────────────────────────────────────────

describe("trialEndsAt", () => {
  it("should return a date 7 days in the future", () => {
    const start = new Date("2025-01-01T00:00:00Z");
    const end = trialEndsAt(start);
    expect(end.toISOString()).toBe("2025-01-08T00:00:00.000Z");
  });

  it("should not mutate the input date", () => {
    const start = new Date("2025-06-15T12:00:00Z");
    const original = start.toISOString();
    trialEndsAt(start);
    expect(start.toISOString()).toBe(original);
  });

  it("should handle month boundary crossing", () => {
    const start = new Date("2025-01-28T00:00:00Z");
    const end = trialEndsAt(start);
    expect(end.getDate()).toBe(4);
    expect(end.getMonth()).toBe(1);
  });

  it("should handle year boundary crossing", () => {
    const start = new Date("2025-12-30T00:00:00Z");
    const end = trialEndsAt(start);
    expect(end.getFullYear()).toBe(2026);
    expect(end.getDate()).toBe(6);
  });

  it("should handle leap year February", () => {
    const start = new Date("2024-02-28T00:00:00Z");
    const end = trialEndsAt(start);
    expect(end.getDate()).toBe(6);
    expect(end.getMonth()).toBe(2);
  });
});

// ── daysRemainingInTrial ─────────────────────────────────────────────────

describe("daysRemainingInTrial", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("should return 0 when trialEndsAt is null", () => {
    expect(daysRemainingInTrial({ trialEndsAt: null })).toBe(0);
  });

  it("should return 0 when trial is already expired", () => {
    const past = new Date("2020-01-01T00:00:00Z");
    expect(daysRemainingInTrial({ trialEndsAt: past })).toBe(0);
  });

  it("should return positive days when trial is active", () => {
    const future = new Date(Date.now() + 3 * 86_400_000);
    const remaining = daysRemainingInTrial({ trialEndsAt: future });
    expect(remaining).toBe(3);
  });

  it("should round up partial days", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-06-01T00:00:00Z"));
    const future = new Date("2025-06-03T12:00:00Z");
    const remaining = daysRemainingInTrial({ trialEndsAt: future });
    expect(remaining).toBe(3);
  });

  it("should return 0 for a trial ending right now", () => {
    vi.useFakeTimers();
    const now = new Date("2025-06-15T12:00:00Z");
    vi.setSystemTime(now);
    expect(daysRemainingInTrial({ trialEndsAt: now })).toBe(0);
  });
});

// ── isTrialExpired ───────────────────────────────────────────────────────

describe("isTrialExpired", () => {
  it("should return false when plan is not free_trial", () => {
    expect(
      isTrialExpired({ plan: "pro", trialEndsAt: new Date("2020-01-01") })
    ).toBe(false);
  });

  it("should return true when plan is free_trial and trialEndsAt is null", () => {
    expect(isTrialExpired({ plan: "free_trial", trialEndsAt: null })).toBe(
      true
    );
  });

  it("should return true when past the trial end date", () => {
    expect(
      isTrialExpired({
        plan: "free_trial",
        trialEndsAt: new Date("2020-01-01"),
      })
    ).toBe(true);
  });

  it("should return false when still within trial period", () => {
    const future = new Date(Date.now() + 86_400_000);
    expect(isTrialExpired({ plan: "free_trial", trialEndsAt: future })).toBe(
      false
    );
  });
});

// ── isAccessAllowed ──────────────────────────────────────────────────────

describe("isAccessAllowed", () => {
  it("should allow access for active free trial", () => {
    const future = new Date(Date.now() + 86_400_000);
    expect(isAccessAllowed({ plan: "free_trial", trialEndsAt: future })).toBe(
      true
    );
  });

  it("should block access for expired free trial without subscription", () => {
    expect(
      isAccessAllowed({
        plan: "free_trial",
        trialEndsAt: new Date("2020-01-01"),
      })
    ).toBe(false);
  });

  it("should block access for non-trial plans without subscription", () => {
    expect(isAccessAllowed({ plan: "pro", trialEndsAt: null })).toBe(false);
  });

  it("should allow access for active subscription", () => {
    expect(
      isAccessAllowed({ plan: "pro", trialEndsAt: null }, { status: "active" })
    ).toBe(true);
  });

  it("should allow access for trialing subscription", () => {
    expect(
      isAccessAllowed(
        { plan: "pro", trialEndsAt: null },
        { status: "trialing" }
      )
    ).toBe(true);
  });

  it("should block access for past_due subscription", () => {
    expect(
      isAccessAllowed(
        { plan: "pro", trialEndsAt: null },
        { status: "past_due" }
      )
    ).toBe(false);
  });

  it("should block access for canceled subscription", () => {
    expect(
      isAccessAllowed(
        { plan: "pro", trialEndsAt: null },
        { status: "canceled" }
      )
    ).toBe(false);
  });

  it("should block access for unpaid subscription", () => {
    expect(
      isAccessAllowed({ plan: "pro", trialEndsAt: null }, { status: "unpaid" })
    ).toBe(false);
  });

  it("should allow free trial even without subscription", () => {
    const future = new Date(Date.now() + 86_400_000);
    expect(
      isAccessAllowed({ plan: "free_trial", trialEndsAt: future }, null)
    ).toBe(true);
  });

  it("should allow access for expired trial with active subscription", () => {
    expect(
      isAccessAllowed(
        { plan: "free_trial", trialEndsAt: new Date("2020-01-01") },
        { status: "active" }
      )
    ).toBe(true);
  });

  it("should block enterprise plan without subscription", () => {
    expect(isAccessAllowed({ plan: "enterprise", trialEndsAt: null })).toBe(
      false
    );
  });

  it("should allow enterprise plan with active subscription", () => {
    expect(
      isAccessAllowed(
        { plan: "enterprise", trialEndsAt: null },
        { status: "active" }
      )
    ).toBe(true);
  });
});
