import type { Organization, Subscription } from "../../drizzle/schema";

export const TRIAL_DAYS = 7;

export function trialEndsAt(startedAt: Date): Date {
  const endAt = new Date(startedAt);
  endAt.setDate(endAt.getDate() + TRIAL_DAYS);
  return endAt;
}

export function daysRemainingInTrial(
  org: Pick<Organization, "trialEndsAt">
): number {
  if (!org.trialEndsAt) return 0;
  const diff = org.trialEndsAt.getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86_400_000));
}

export function isTrialExpired(
  org: Pick<Organization, "plan" | "trialEndsAt">
): boolean {
  if (org.plan !== "free_trial") return false;
  if (!org.trialEndsAt) return true;
  return org.trialEndsAt.getTime() < Date.now();
}

export function isAccessAllowed(
  org: Pick<Organization, "plan" | "trialEndsAt">,
  sub?: Pick<Subscription, "status"> | null
): boolean {
  if (org.plan === "free_trial" && !isTrialExpired(org)) return true;
  if (!sub) return false;
  return sub.status === "active" || sub.status === "trialing";
}

// ─── Tier feature matrix ──────────────────────────────────────────────────────

export type PlanTier = "starter" | "professional" | "enterprise";

export interface TierLimits {
  maxVendors: number;
  maxFrameworks: number;
  maxSeats: number;
  maxAiReportsPerDay: number;
  supportsApiAccess: boolean;
  supportsCustomReports: boolean;
  supportsPrioritySupport: boolean;
  supportsWhiteLabel: boolean;
}

export const TIER_MATRIX: Record<PlanTier, TierLimits> = {
  starter: {
    maxVendors: 10,
    maxFrameworks: 5,
    maxSeats: 3,
    maxAiReportsPerDay: 3,
    supportsApiAccess: false,
    supportsCustomReports: false,
    supportsPrioritySupport: false,
    supportsWhiteLabel: false,
  },
  professional: {
    maxVendors: 50,
    maxFrameworks: 20,
    maxSeats: 15,
    maxAiReportsPerDay: 20,
    supportsApiAccess: true,
    supportsCustomReports: true,
    supportsPrioritySupport: false,
    supportsWhiteLabel: false,
  },
  enterprise: {
    maxVendors: 999,
    maxFrameworks: 999,
    maxSeats: 999,
    maxAiReportsPerDay: 200,
    supportsApiAccess: true,
    supportsCustomReports: true,
    supportsPrioritySupport: true,
    supportsWhiteLabel: true,
  },
};

export function getTierLimits(plan: string): TierLimits {
  const tier = TIER_MATRIX[plan as PlanTier];
  return tier ?? TIER_MATRIX.starter;
}

/** Unified subscription-state classification for every account */
export type AccountState =
  | "trialing"
  | "active:starter"
  | "active:professional"
  | "active:enterprise"
  | "past_due"
  | "canceled"
  | "expired_trial"
  | "incomplete";

export function classifyAccountState(
  org: Pick<Organization, "plan" | "trialEndsAt">,
  sub?: Pick<Subscription, "status" | "plan"> | null
): AccountState {
  if (org.plan === "free_trial") {
    if (isTrialExpired(org)) return "expired_trial";
    return "trialing";
  }
  if (!sub) return "expired_trial";
  if (sub.status === "active") return `active:${sub.plan}` as AccountState;
  if (sub.status === "trialing") return "active:starter";
  return sub.status as AccountState;
}
