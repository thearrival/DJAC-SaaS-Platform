/**
 * Policy Store — DB operations for policy-router.ts
 */

import { and, desc, eq } from "drizzle-orm";
import { compliancePolicies } from "../drizzle/schema";
import { getDb } from "./db";

// ─── Types ────────────────────────────────────────────────────────────────────

type PolicyType = "policy" | "standard" | "procedure" | "guideline";
type PolicyStatus = "draft" | "under_review" | "approved" | "active" | "retired";

export type PolicyRow = {
    id: number;
    organizationId: number;
    policyCode: string | null;
    title: string;
    description: string | null;
    policyType: PolicyType;
    frameworks: string | null;
    controlReferences: string | null;
    status: PolicyStatus;
    ownerId: number | null;
    reviewCycleMonths: number;
    lastApprovedAt: Date | null;
    nextReviewAt: Date | null;
    version: string;
    documentUrl: string | null;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
};

// ─── In-memory fallback ───────────────────────────────────────────────────────

const MEM_POLICIES: PolicyRow[] = [];
let memSeq = 1;

// ─── Input type ───────────────────────────────────────────────────────────────

export type CreatePolicyInput = {
    policyCode?: string;
    title: string;
    description?: string;
    policyType: PolicyType;
    frameworks: string[];
    controlReferences: string[];
    status: PolicyStatus;
    ownerId?: number;
    reviewCycleMonths: number;
    nextReviewAt?: string;
    version: string;
    documentUrl?: string;
    notes?: string;
};

// ─── Store functions ──────────────────────────────────────────────────────────

export async function listPolicies(orgId: number): Promise<PolicyRow[]> {
    const db = await getDb();
    if (!db || orgId < 0) {
        return [...MEM_POLICIES.filter(p => p.organizationId === orgId)]
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    return db
        .select()
        .from(compliancePolicies)
        .where(eq(compliancePolicies.organizationId, orgId))
        .orderBy(desc(compliancePolicies.createdAt)) as unknown as Promise<PolicyRow[]>;
}

export async function createPolicy(orgId: number, input: CreatePolicyInput): Promise<PolicyRow> {
    const db = await getDb();
    const now = new Date();
    const nextReviewAt = input.nextReviewAt ? new Date(input.nextReviewAt) : null;
    const frameworksJson = JSON.stringify(input.frameworks);
    const controlReferencesJson = JSON.stringify(input.controlReferences);

    if (!db || orgId < 0) {
        const policy: PolicyRow = {
            id: memSeq++,
            organizationId: orgId,
            policyCode: input.policyCode ?? null,
            title: input.title,
            description: input.description ?? null,
            policyType: input.policyType,
            frameworks: frameworksJson,
            controlReferences: controlReferencesJson,
            status: input.status,
            ownerId: input.ownerId ?? null,
            reviewCycleMonths: input.reviewCycleMonths,
            lastApprovedAt: null,
            nextReviewAt,
            version: input.version,
            documentUrl: input.documentUrl ?? null,
            notes: input.notes ?? null,
            createdAt: now,
            updatedAt: now,
        };
        MEM_POLICIES.push(policy);
        return policy;
    }

    const result = await db.insert(compliancePolicies).values({
        organizationId: orgId,
        policyCode: input.policyCode ?? null,
        title: input.title,
        description: input.description ?? null,
        policyType: input.policyType,
        frameworks: frameworksJson,
        controlReferences: controlReferencesJson,
        status: input.status,
        ownerId: input.ownerId ?? null,
        reviewCycleMonths: input.reviewCycleMonths,
        nextReviewAt,
        version: input.version,
        documentUrl: input.documentUrl ?? null,
        notes: input.notes ?? null,
    });
    const newId = (result as unknown as { insertId: number }).insertId;
    return {
        id: newId,
        organizationId: orgId,
        policyCode: input.policyCode ?? null,
        title: input.title,
        description: input.description ?? null,
        policyType: input.policyType,
        frameworks: frameworksJson,
        controlReferences: controlReferencesJson,
        status: input.status,
        ownerId: input.ownerId ?? null,
        reviewCycleMonths: input.reviewCycleMonths,
        lastApprovedAt: null,
        nextReviewAt,
        version: input.version,
        documentUrl: input.documentUrl ?? null,
        notes: input.notes ?? null,
        createdAt: now,
        updatedAt: now,
    };
}

/** Returns the updated row (in-memory) or { id } (DB), or null if not found. */
export async function patchPolicy(
    orgId: number,
    id: number,
    updates: Record<string, unknown>,
): Promise<PolicyRow | { id: number } | null> {
    const db = await getDb();
    if (!db || orgId < 0) {
        const policy = MEM_POLICIES.find(p => p.id === id && p.organizationId === orgId);
        if (!policy) return null;
        Object.assign(policy, updates);
        return policy;
    }
    const existing = await db
        .select({ id: compliancePolicies.id })
        .from(compliancePolicies)
        .where(and(eq(compliancePolicies.id, id), eq(compliancePolicies.organizationId, orgId)));
    if (!existing.length) return null;
    await db
        .update(compliancePolicies)
        .set(updates)
        .where(and(eq(compliancePolicies.id, id), eq(compliancePolicies.organizationId, orgId)));
    return { id };
}

/** Returns current status string or null if not found. */
export async function getPolicyStatus(orgId: number, id: number): Promise<string | null> {
    const db = await getDb();
    if (!db || orgId < 0) {
        return MEM_POLICIES.find(p => p.id === id && p.organizationId === orgId)?.status ?? null;
    }
    const rows = await db
        .select({ status: compliancePolicies.status })
        .from(compliancePolicies)
        .where(and(eq(compliancePolicies.id, id), eq(compliancePolicies.organizationId, orgId)));
    return rows[0]?.status ?? null;
}

export async function applyPolicyStatusTransition(
    orgId: number,
    id: number,
    newStatus: PolicyStatus,
): Promise<{ id: number; status: PolicyStatus } | null> {
    const db = await getDb();
    const now = new Date();
    if (!db || orgId < 0) {
        const policy = MEM_POLICIES.find(p => p.id === id && p.organizationId === orgId);
        if (!policy) return null;
        policy.status = newStatus;
        policy.updatedAt = now;
        if (newStatus === "approved" || newStatus === "active") policy.lastApprovedAt = now;
        return { id: policy.id, status: policy.status };
    }
    const setPatch: Record<string, unknown> = { status: newStatus, updatedAt: now };
    if (newStatus === "approved" || newStatus === "active") setPatch.lastApprovedAt = now;
    await db
        .update(compliancePolicies)
        .set(setPatch)
        .where(and(eq(compliancePolicies.id, id), eq(compliancePolicies.organizationId, orgId)));
    return { id, status: newStatus };
}

/** Returns true if found and deleted, false if not found. */
export async function deletePolicy(orgId: number, id: number): Promise<boolean> {
    const db = await getDb();
    if (!db || orgId < 0) {
        const idx = MEM_POLICIES.findIndex(p => p.id === id && p.organizationId === orgId);
        if (idx === -1) return false;
        MEM_POLICIES.splice(idx, 1);
        return true;
    }
    const rows = await db
        .select({ id: compliancePolicies.id })
        .from(compliancePolicies)
        .where(and(eq(compliancePolicies.id, id), eq(compliancePolicies.organizationId, orgId)));
    if (!rows.length) return false;
    await db
        .delete(compliancePolicies)
        .where(and(eq(compliancePolicies.id, id), eq(compliancePolicies.organizationId, orgId)));
    return true;
}
