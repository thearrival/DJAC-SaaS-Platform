/**
 * Admin Store — DB operations for admin-router.ts
 */

import { getDb } from "./db";
import { organizations } from "../drizzle/schema";
import { isTrialExpired } from "./services/billing-entitlements";

export async function getConversionStats() {
    const db = await getDb();
    if (!db) {
        return {
            trialOrgs: 0,
            paidOrgs: 0,
            expiredOrgs: 0,
            total: 0,
            conversionRate: 0,
            planBreakdown: [] as { plan: string; count: number }[],
        };
    }
    const orgs = await db
        .select({ plan: organizations.plan, trialEndsAt: organizations.trialEndsAt })
        .from(organizations);
    const trialOrgs = orgs.filter(o => o.plan === "free_trial" && !isTrialExpired(o)).length;
    const expiredOrgs = orgs.filter(o => isTrialExpired(o)).length;
    const paidOrgs = orgs.filter(o => o.plan !== "free_trial").length;
    const total = orgs.length;
    const conversionRate = total > 0 ? Math.round((paidOrgs / total) * 100) : 0;
    const planCounts: Record<string, number> = {};
    orgs.forEach(o => { planCounts[o.plan] = (planCounts[o.plan] ?? 0) + 1; });
    const planBreakdown = Object.entries(planCounts).map(([plan, count]) => ({ plan, count }));
    return { trialOrgs, paidOrgs, expiredOrgs, total, conversionRate, planBreakdown };
}
