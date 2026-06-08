/**
 * Evidence Store — DB operations for evidence-router.ts
 */

import { and, desc, eq } from "drizzle-orm";
import { complianceEvidence } from "../drizzle/schema";
import { getDb } from "./db";

// ─── Types ────────────────────────────────────────────────────────────────────

export const SOURCE_TYPES = [
    "audit_schedule", "policy", "risk", "gap", "remediation",
    "ctem_asset", "incident", "general",
] as const;

export type SourceType = (typeof SOURCE_TYPES)[number];

export type EvidenceRow = {
    id: number;
    organizationId: number;
    sourceType: SourceType;
    sourceId: number | null;
    title: string;
    url: string;
    description: string | null;
    addedByUserId: number | null;
    tags: string | null;
    createdAt: Date;
    updatedAt: Date;
};

// ─── In-memory fallback (seeded) ─────────────────────────────────────────────

const MEM_EVIDENCE: EvidenceRow[] = [
    {
        id: 1, organizationId: 1, sourceType: "policy", sourceId: null,
        title: "PIPL Compliance Policy v2 — Internal Approval Record",
        url: "https://example.com/documents/pipl-compliance-policy-v2-approval.pdf",
        description: "Board approval record for the PIPL data processing policy update.",
        addedByUserId: null, tags: "pipl,china,policy",
        createdAt: new Date("2025-01-15T09:00:00Z"), updatedAt: new Date("2025-01-15T09:00:00Z"),
    },
    {
        id: 2, organizationId: 1, sourceType: "audit_schedule", sourceId: null,
        title: "Q1 Internal Audit — SOC 2 Readiness Report",
        url: "https://example.com/audits/q1-2025-soc2-readiness.pdf",
        description: "External auditor readiness report for Q1 SOC 2 review.",
        addedByUserId: null, tags: "soc2,audit",
        createdAt: new Date("2025-02-20T14:00:00Z"), updatedAt: new Date("2025-02-20T14:00:00Z"),
    },
    {
        id: 3, organizationId: 1, sourceType: "risk", sourceId: null,
        title: "Cross-Border Data Transfer Risk — PDPL Impact Assessment",
        url: "https://example.com/risk/cross-border-pdpl-impact-assessment.pdf",
        description: "Formal impact assessment for Saudi Arabia data transfer risks under PDPL.",
        addedByUserId: null, tags: "pdpl,saudi,risk",
        createdAt: new Date("2025-03-10T11:30:00Z"), updatedAt: new Date("2025-03-10T11:30:00Z"),
    },
    {
        id: 4, organizationId: 1, sourceType: "general", sourceId: null,
        title: "ISO/IEC 27701:2019 Standard Reference Copy",
        url: "https://www.iso.org/standard/71670.html",
        description: "Reference link to the privacy information management certification standard.",
        addedByUserId: null, tags: "iso27701,reference",
        createdAt: new Date("2025-04-01T08:00:00Z"), updatedAt: new Date("2025-04-01T08:00:00Z"),
    },
];

let memSeq = 5;

// ─── Input type ───────────────────────────────────────────────────────────────

export type AddEvidenceInput = {
    title: string;
    url: string;
    sourceType: SourceType;
    sourceId?: number;
    description?: string;
    tags?: string;
};

// ─── Store functions ──────────────────────────────────────────────────────────

export async function listEvidence(
    orgId: number,
    sourceType?: SourceType,
    sourceId?: number,
): Promise<EvidenceRow[]> {
    const db = await getDb();
    if (!db || orgId < 0) {
        let items = MEM_EVIDENCE.filter(e => e.organizationId === orgId);
        if (sourceType) items = items.filter(e => e.sourceType === sourceType);
        if (sourceId) items = items.filter(e => e.sourceId === sourceId);
        return items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    const conditions = [eq(complianceEvidence.organizationId, orgId)];
    if (sourceType) conditions.push(eq(complianceEvidence.sourceType, sourceType));
    if (sourceId) conditions.push(eq(complianceEvidence.sourceId, sourceId));
    return db
        .select()
        .from(complianceEvidence)
        .where(and(...conditions))
        .orderBy(desc(complianceEvidence.createdAt)) as unknown as Promise<EvidenceRow[]>;
}

export async function addEvidence(
    orgId: number,
    input: AddEvidenceInput,
    addedByUserId: number | null,
): Promise<{ success: boolean; id: number }> {
    const db = await getDb();
    const now = new Date();
    if (!db || orgId < 0) {
        const item: EvidenceRow = {
            id: memSeq++,
            organizationId: orgId,
            sourceType: input.sourceType,
            sourceId: input.sourceId ?? null,
            title: input.title,
            url: input.url,
            description: input.description ?? null,
            addedByUserId,
            tags: input.tags ?? null,
            createdAt: now,
            updatedAt: now,
        };
        MEM_EVIDENCE.push(item);
        return { success: true, id: item.id };
    }
    const [inserted] = await db.insert(complianceEvidence).values({
        organizationId: orgId,
        sourceType: input.sourceType,
        sourceId: input.sourceId ?? null,
        title: input.title,
        url: input.url,
        description: input.description ?? null,
        addedByUserId,
        tags: input.tags ?? null,
        createdAt: now,
        updatedAt: now,
    }).returning({ id: complianceEvidence.id });
    const insertId = inserted.id;
    return { success: true, id: insertId };
}

export async function getEvidenceForRemoval(
    orgId: number,
    evidenceId: number,
): Promise<{ id: number; organizationId: number } | null> {
    const db = await getDb();
    if (!db || orgId < 0) {
        const item = MEM_EVIDENCE.find(e => e.id === evidenceId && e.organizationId === orgId);
        return item ? { id: item.id, organizationId: item.organizationId } : null;
    }
    const [row] = await db
        .select({ id: complianceEvidence.id, organizationId: complianceEvidence.organizationId })
        .from(complianceEvidence)
        .where(eq(complianceEvidence.id, evidenceId));
    return row ?? null;
}

export async function removeEvidence(orgId: number, evidenceId: number): Promise<void> {
    const db = await getDb();
    if (!db || orgId < 0) {
        const idx = MEM_EVIDENCE.findIndex(e => e.id === evidenceId && e.organizationId === orgId);
        if (idx !== -1) MEM_EVIDENCE.splice(idx, 1);
        return;
    }
    await db
        .delete(complianceEvidence)
        .where(and(eq(complianceEvidence.id, evidenceId), eq(complianceEvidence.organizationId, orgId)));
}
