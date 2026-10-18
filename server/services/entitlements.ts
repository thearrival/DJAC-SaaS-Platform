/**
 * entitlements.ts — Subscription tier enforcement
 *
 * Single source of truth for "what does this organization's plan allow?".
 * Combines the org's plan with the tier matrix in billing-entitlements and
 * throws TRPCError(FORBIDDEN) when a limit would be exceeded.
 */

import { TRPCError } from "@trpc/server";
import { and, count, desc, eq, gte } from "drizzle-orm";
import {
  organizationMembers,
  organizations,
  subscriptions,
  vendorAssessments,
  vendors,
} from "../../drizzle/schema";
import { getDb } from "../db";
import {
  getTierLimits,
  type PlanTier,
  type TierLimits,
} from "./billing-entitlements";

export type EffectivePlan = "free_trial" | PlanTier;

export type OrgEntitlements = {
  organizationId: number;
  plan: EffectivePlan;
  limits: TierLimits;
  isPaid: boolean;
  subscriptionStatus: string | null;
};

function trialEntitlements(organizationId: number): OrgEntitlements {
  return {
    organizationId,
    plan: "free_trial",
    limits: getTierLimits("starter"),
    isPaid: false,
    subscriptionStatus: null,
  };
}

export async function getOrgEntitlements(
  organizationId: number
): Promise<OrgEntitlements> {
  const db = await getDb();
  if (!db) return trialEntitlements(organizationId);

  const [org] = await db
    .select({
      plan: organizations.plan,
      parentOrganizationId: organizations.parentOrganizationId,
    })
    .from(organizations)
    .where(eq(organizations.id, organizationId))
    .limit(1);
  if (!org) return trialEntitlements(organizationId);

  // Child entities inherit the parent organization's plan and subscription.
  let sourceOrgId = organizationId;
  let sourcePlan = org.plan;
  if (org.parentOrganizationId) {
    const [parent] = await db
      .select({ plan: organizations.plan })
      .from(organizations)
      .where(eq(organizations.id, org.parentOrganizationId))
      .limit(1);
    if (parent) {
      sourceOrgId = org.parentOrganizationId;
      sourcePlan = parent.plan;
    }
  }

  const [sub] = await db
    .select({ status: subscriptions.status })
    .from(subscriptions)
    .where(eq(subscriptions.organizationId, sourceOrgId))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);

  const plan: EffectivePlan =
    sourcePlan === "free_trial" ? "free_trial" : (sourcePlan as PlanTier);

  return {
    organizationId,
    plan,
    limits: getTierLimits(plan),
    isPaid: sub?.status === "active" || sub?.status === "trialing",
    subscriptionStatus: sub?.status ?? null,
  };
}

function planLabel(plan: EffectivePlan): string {
  return plan === "free_trial" ? "trial" : plan;
}

export async function assertApiAccess(organizationId: number): Promise<void> {
  const ent = await getOrgEntitlements(organizationId);
  if (!ent.limits.supportsApiAccess) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message:
        "API access is available on Professional and Enterprise plans. Upgrade to create API keys.",
    });
  }
}

export async function assertVendorCapacity(
  organizationId: number,
  currentCount: number
): Promise<void> {
  const ent = await getOrgEntitlements(organizationId);
  if (currentCount >= ent.limits.maxVendors) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `Your ${planLabel(ent.plan)} plan supports up to ${ent.limits.maxVendors} vendors. Upgrade to add more.`,
    });
  }
}

export async function assertSeatCapacity(
  organizationId: number,
  activeCount: number
): Promise<void> {
  const ent = await getOrgEntitlements(organizationId);
  if (activeCount >= ent.limits.maxSeats) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `Your ${planLabel(ent.plan)} plan includes ${ent.limits.maxSeats} seats. Upgrade to invite more members.`,
    });
  }
}

/** Count AI assessments created by the org's vendors since midnight UTC. */
export async function countAiReportsToday(
  organizationId: number
): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const [row] = await db
    .select({ value: count() })
    .from(vendorAssessments)
    .innerJoin(vendors, eq(vendorAssessments.vendorId, vendors.id))
    .where(
      and(
        eq(vendors.organizationId, organizationId),
        gte(vendorAssessments.createdAt, start)
      )
    );
  return Number(row?.value ?? 0);
}

export async function assertAiReportCapacity(
  organizationId: number
): Promise<void> {
  const ent = await getOrgEntitlements(organizationId);
  const used = await countAiReportsToday(organizationId);
  if (used >= ent.limits.maxAiReportsPerDay) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `Your ${planLabel(ent.plan)} plan allows ${ent.limits.maxAiReportsPerDay} AI assessments per day. Upgrade for more.`,
    });
  }
}

export async function assertFrameworkCapacity(
  organizationId: number,
  selectedCount: number
): Promise<void> {
  const ent = await getOrgEntitlements(organizationId);
  if (selectedCount > ent.limits.maxFrameworks) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `Your ${planLabel(ent.plan)} plan supports up to ${ent.limits.maxFrameworks} frameworks. Upgrade to select more.`,
    });
  }
}

export type OrgUsage = {
  vendors: number;
  seats: number;
  aiReportsToday: number;
};

/** Current consumption against the plan's caps, for usage meters. */
export async function getOrgUsage(organizationId: number): Promise<OrgUsage> {
  const db = await getDb();
  if (!db) return { vendors: 0, seats: 0, aiReportsToday: 0 };

  const [v] = await db
    .select({ value: count() })
    .from(vendors)
    .where(eq(vendors.organizationId, organizationId));
  const [s] = await db
    .select({ value: count() })
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.organizationId, organizationId),
        eq(organizationMembers.status, "active")
      )
    );
  const aiReportsToday = await countAiReportsToday(organizationId);

  return {
    vendors: Number(v?.value ?? 0),
    seats: Number(s?.value ?? 0),
    aiReportsToday,
  };
}
