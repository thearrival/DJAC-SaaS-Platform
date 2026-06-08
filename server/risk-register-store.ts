/**
 * Risk Register Store — DB operations for risk-register-router.ts
 */

import { and, desc, eq } from "drizzle-orm";
import { riskRegister } from "../drizzle/schema";
import { getDb } from "./db";

// ─── Types ────────────────────────────────────────────────────────────────────

type RiskCategory = "operational" | "legal" | "technical" | "financial" | "reputational";
type RiskTreatment = "accept" | "mitigate" | "transfer" | "avoid";
type RiskStatus = "open" | "in_treatment" | "closed" | "accepted";

export type RiskRow = {
    id: number;
    organizationId: number;
    title: string;
    description: string | null;
    category: RiskCategory;
    likelihood: number;
    impact: number;
    treatment: RiskTreatment;
    status: RiskStatus;
    ownerId: number | null;
    vendorId: number | null;
    gapCode: string | null;
    controlReference: string | null;
    reviewDate: Date | null;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
};

// ─── In-memory fallback ───────────────────────────────────────────────────────

const MEM_RISKS: RiskRow[] = [];
let memSeq = 1;

// ─── Input types ──────────────────────────────────────────────────────────────

export type CreateRiskInput = {
    title: string;
    description?: string;
    category: RiskCategory;
    likelihood: number;
    impact: number;
    treatment: RiskTreatment;
    status: RiskStatus;
    ownerId?: number;
    vendorId?: number;
    gapCode?: string;
    controlReference?: string;
    reviewDate?: string;
    notes?: string;
};

export type PatchRiskFields = Partial<Omit<CreateRiskInput, "reviewDate" | "vendorId" | "ownerId">> & { vendorId?: number | null; ownerId?: number | null };

// ─── Store functions ──────────────────────────────────────────────────────────

export async function listRisks(orgId: number): Promise<RiskRow[]> {
    const db = await getDb();
    if (!db || orgId < 0) {
        return MEM_RISKS
            .filter(r => r.organizationId === orgId)
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    return db
        .select()
        .from(riskRegister)
        .where(eq(riskRegister.organizationId, orgId))
        .orderBy(desc(riskRegister.createdAt)) as unknown as Promise<RiskRow[]>;
}

export async function createRisk(orgId: number, input: CreateRiskInput): Promise<RiskRow> {
    const db = await getDb();
    const now = new Date();
    const reviewDate = input.reviewDate ? new Date(input.reviewDate) : null;
    if (!db || orgId < 0) {
        const risk: RiskRow = {
            id: memSeq++,
            organizationId: orgId,
            title: input.title,
            description: input.description ?? null,
            category: input.category,
            likelihood: input.likelihood,
            impact: input.impact,
            treatment: input.treatment,
            status: input.status,
            ownerId: input.ownerId ?? null,
            vendorId: input.vendorId ?? null,
            gapCode: input.gapCode ?? null,
            controlReference: input.controlReference ?? null,
            reviewDate,
            notes: input.notes ?? null,
            createdAt: now,
            updatedAt: now,
        };
        MEM_RISKS.push(risk);
        return risk;
    }
    const [insertedRisk] = await db.insert(riskRegister).values({
        organizationId: orgId,
        title: input.title,
        description: input.description ?? null,
        category: input.category,
        likelihood: input.likelihood,
        impact: input.impact,
        treatment: input.treatment,
        status: input.status,
        ownerId: input.ownerId ?? null,
        vendorId: input.vendorId ?? null,
        gapCode: input.gapCode ?? null,
        controlReference: input.controlReference ?? null,
        reviewDate,
        notes: input.notes ?? null,
    }).returning({ id: riskRegister.id });
    const newId = insertedRisk.id;
    return {
        id: newId,
        organizationId: orgId,
        reviewDate,
        createdAt: now,
        updatedAt: now,
        description: input.description ?? null,
        ownerId: input.ownerId ?? null,
        vendorId: input.vendorId ?? null,
        gapCode: input.gapCode ?? null,
        controlReference: input.controlReference ?? null,
        notes: input.notes ?? null,
        title: input.title,
        category: input.category,
        likelihood: input.likelihood,
        impact: input.impact,
        treatment: input.treatment,
        status: input.status,
    };
}

/**
 * Returns the updated risk (in-memory) or { id } (DB), or null if not found.
 */
export async function patchRisk(
    orgId: number,
    id: number,
    fields: PatchRiskFields,
    reviewDate: Date | null | undefined,
): Promise<RiskRow | { id: number } | null> {
    const db = await getDb();
    if (!db || orgId < 0) {
        const risk = MEM_RISKS.find(r => r.id === id && r.organizationId === orgId);
        if (!risk) return null;
        Object.assign(risk, fields);
        if (reviewDate !== undefined) risk.reviewDate = reviewDate;
        risk.updatedAt = new Date();
        return risk;
    }
    const updates: Record<string, unknown> = { ...fields, updatedAt: new Date() };
    if (reviewDate !== undefined) updates.reviewDate = reviewDate;
    await db
        .update(riskRegister)
        .set(updates)
        .where(and(eq(riskRegister.id, id), eq(riskRegister.organizationId, orgId)));
    return { id };
}

/** Returns false if the risk was not found for this org. */
export async function removeRisk(orgId: number, id: number): Promise<boolean> {
    const db = await getDb();
    if (!db || orgId < 0) {
        const idx = MEM_RISKS.findIndex(r => r.id === id && r.organizationId === orgId);
        if (idx === -1) return false;
        MEM_RISKS.splice(idx, 1);
        return true;
    }
    const rows = await db
        .select({ id: riskRegister.id })
        .from(riskRegister)
        .where(and(eq(riskRegister.id, id), eq(riskRegister.organizationId, orgId)));
    if (!rows.length) return false;
    await db
        .delete(riskRegister)
        .where(and(eq(riskRegister.id, id), eq(riskRegister.organizationId, orgId)));
    return true;
}
