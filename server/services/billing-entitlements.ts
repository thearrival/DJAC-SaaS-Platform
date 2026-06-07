import type { Organization, Subscription } from "../../drizzle/schema";

export const TRIAL_DAYS = 7;

export function trialEndsAt(startedAt: Date): Date {
    const endAt = new Date(startedAt);
    endAt.setDate(endAt.getDate() + TRIAL_DAYS);
    return endAt;
}

export function daysRemainingInTrial(org: Pick<Organization, "trialEndsAt">): number {
    if (!org.trialEndsAt) return 0;
    const diff = org.trialEndsAt.getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / 86_400_000));
}

export function isTrialExpired(org: Pick<Organization, "plan" | "trialEndsAt">): boolean {
    if (org.plan !== "free_trial") return false;
    if (!org.trialEndsAt) return true;
    return org.trialEndsAt.getTime() < Date.now();
}

export function isAccessAllowed(
    org: Pick<Organization, "plan" | "trialEndsAt">,
    sub?: Pick<Subscription, "status"> | null,
): boolean {
    if (org.plan === "free_trial" && !isTrialExpired(org)) return true;
    if (!sub) return false;
    return sub.status === "active" || sub.status === "trialing";
}
