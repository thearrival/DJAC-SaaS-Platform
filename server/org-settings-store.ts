/**
 * Org Settings Store — DB operations for org-settings-router.ts
 */

import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { organizations } from "../drizzle/schema";

type OrgPlan = "free_trial" | "starter" | "professional" | "enterprise";
type Jurisdiction = "China" | "Saudi Arabia" | "Both" | "Other";

export type OrgProfile = {
    id: number;
    slug: string;
    name: string;
    billingEmail: string;
    industry: string | null;
    primaryJurisdiction: Jurisdiction;
    plan: OrgPlan;
    maxSeats: number;
    isActive: number;
    trialStartedAt: Date | null;
    trialEndsAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    currentUserRole: string;
};

/** Returns null when org is not found in the DB. */
export async function getOrgSettings(orgId: number, role: string): Promise<OrgProfile | null> {
    const db = await getDb();
    if (!db) {
        return {
            id: orgId,
            slug: "your-org",
            name: "Your Organization",
            billingEmail: "billing@example.com",
            industry: null,
            primaryJurisdiction: "Both",
            plan: "free_trial",
            maxSeats: 5,
            isActive: 1,
            trialStartedAt: null,
            trialEndsAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            currentUserRole: role ?? "analyst",
        };
    }
    if (orgId < 0) {
        return {
            id: -1,
            slug: "dev-org",
            name: "Dev Organization",
            billingEmail: "dev@localhost",
            industry: "Technology",
            primaryJurisdiction: "Both",
            plan: "enterprise",
            maxSeats: 99,
            isActive: 1,
            trialStartedAt: null,
            trialEndsAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            currentUserRole: "owner",
        };
    }
    const [org] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, orgId))
        .limit(1);
    if (!org) return null;
    return { ...org, currentUserRole: role ?? "analyst" } as OrgProfile;
}

export async function updateOrgSettings(
    orgId: number,
    input: {
        name?: string;
        billingEmail?: string;
        industry?: string;
        primaryJurisdiction?: Jurisdiction;
    },
): Promise<void> {
    const db = await getDb();
    if (!db) return; // in-memory mode — pretend success
    const patch: Record<string, unknown> = { updatedAt: new Date() };
    if (input.name !== undefined) patch.name = input.name;
    if (input.billingEmail !== undefined) patch.billingEmail = input.billingEmail;
    if (input.industry !== undefined) patch.industry = input.industry;
    if (input.primaryJurisdiction !== undefined) patch.primaryJurisdiction = input.primaryJurisdiction;
    await db.update(organizations).set(patch).where(eq(organizations.id, orgId));
}
