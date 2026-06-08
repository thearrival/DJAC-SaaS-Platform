/**
 * Security Maturity Store — DB operations for security-maturity-router.ts
 */

import { desc, eq } from "drizzle-orm";
import { securityMaturityAssessments } from "../drizzle/schema";
import { getDb } from "./db";

// ─── Types ────────────────────────────────────────────────────────────────────

export type MaturityLevel = "initial" | "developing" | "defined" | "managed" | "optimized";

export type AssessmentRow = {
    id: number;
    organizationId: number;
    title: string;
    frameworkRef: string | null;
    scoreGovernance: number;
    scoreAssetManagement: number;
    scoreAccessControl: number;
    scoreDataProtection: number;
    scoreNetworkSecurity: number;
    scoreVulnerabilityMgmt: number;
    scoreIncidentResponse: number;
    scoreBackupRecovery: number;
    scoreThirdPartyRisk: number;
    scoreSecurityAwareness: number;
    overallScore: number;
    maturityLevel: MaturityLevel;
    recommendations: string | null;
    assessedByUserId: number | null;
    createdAt: Date;
    updatedAt: Date;
};

// ─── In-memory fallback ───────────────────────────────────────────────────────

const MEM_ASSESSMENTS: AssessmentRow[] = [];
let memSeq = 1;

// ─── Score helpers ────────────────────────────────────────────────────────────

export function toMaturityLevel(overallScore: number): MaturityLevel {
    if (overallScore >= 90) return "optimized";
    if (overallScore >= 70) return "managed";
    if (overallScore >= 50) return "defined";
    if (overallScore >= 30) return "developing";
    return "initial";
}

export function computeOverallScore(domains: Record<string, number>): number {
    const values = Object.values(domains);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    return Math.round(((avg - 1) / 4) * 100);
}

// ─── Input type ───────────────────────────────────────────────────────────────

export type CreateAssessmentInput = {
    title: string;
    frameworkRef?: string;
    scoreGovernance: number;
    scoreAssetManagement: number;
    scoreAccessControl: number;
    scoreDataProtection: number;
    scoreNetworkSecurity: number;
    scoreVulnerabilityMgmt: number;
    scoreIncidentResponse: number;
    scoreBackupRecovery: number;
    scoreThirdPartyRisk: number;
    scoreSecurityAwareness: number;
    recommendations?: string;
};

// ─── Store functions ──────────────────────────────────────────────────────────

export async function listAssessments(orgId: number): Promise<AssessmentRow[]> {
    const db = await getDb();
    if (!db || orgId < 0) {
        return [...MEM_ASSESSMENTS.filter(a => a.organizationId === orgId)]
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    return db
        .select()
        .from(securityMaturityAssessments)
        .where(eq(securityMaturityAssessments.organizationId, orgId))
        .orderBy(desc(securityMaturityAssessments.createdAt)) as unknown as Promise<AssessmentRow[]>;
}

export async function getLatestAssessment(orgId: number): Promise<AssessmentRow | null> {
    const db = await getDb();
    if (!db || orgId < 0) {
        const all = [...MEM_ASSESSMENTS.filter(a => a.organizationId === orgId)]
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        return all[0] ?? null;
    }
    const [row] = await db
        .select()
        .from(securityMaturityAssessments)
        .where(eq(securityMaturityAssessments.organizationId, orgId))
        .orderBy(desc(securityMaturityAssessments.createdAt))
        .limit(1);
    return (row as AssessmentRow) ?? null;
}

export async function getAssessment(orgId: number, id: number): Promise<AssessmentRow | null> {
    const db = await getDb();
    if (!db || orgId < 0) {
        return MEM_ASSESSMENTS.find(a => a.id === id && a.organizationId === orgId) ?? null;
    }
    const [row] = await db
        .select()
        .from(securityMaturityAssessments)
        .where(eq(securityMaturityAssessments.id, id))
        .limit(1);
    if (!row || (row as AssessmentRow).organizationId !== orgId) return null;
    return row as AssessmentRow;
}

export async function createAssessmentRow(
    orgId: number,
    input: CreateAssessmentInput,
    localUserId: number | null,
): Promise<AssessmentRow> {
    const db = await getDb();
    const now = new Date();
    const domainMap = {
        scoreGovernance: input.scoreGovernance,
        scoreAssetManagement: input.scoreAssetManagement,
        scoreAccessControl: input.scoreAccessControl,
        scoreDataProtection: input.scoreDataProtection,
        scoreNetworkSecurity: input.scoreNetworkSecurity,
        scoreVulnerabilityMgmt: input.scoreVulnerabilityMgmt,
        scoreIncidentResponse: input.scoreIncidentResponse,
        scoreBackupRecovery: input.scoreBackupRecovery,
        scoreThirdPartyRisk: input.scoreThirdPartyRisk,
        scoreSecurityAwareness: input.scoreSecurityAwareness,
    };
    const overallScore = computeOverallScore(domainMap);
    const maturityLevel = toMaturityLevel(overallScore);

    if (!db || orgId < 0) {
        const assessment: AssessmentRow = {
            id: memSeq++,
            organizationId: orgId,
            title: input.title,
            frameworkRef: input.frameworkRef ?? null,
            ...domainMap,
            overallScore,
            maturityLevel,
            recommendations: input.recommendations ?? null,
            assessedByUserId: localUserId,
            createdAt: now,
            updatedAt: now,
        };
        MEM_ASSESSMENTS.push(assessment);
        return assessment;
    }

    const [inserted] = await db.insert(securityMaturityAssessments).values({
        organizationId: orgId,
        title: input.title,
        frameworkRef: input.frameworkRef ?? null,
        ...domainMap,
        overallScore,
        maturityLevel,
        recommendations: input.recommendations ?? null,
        assessedByUserId: localUserId,
    }).returning({ id: securityMaturityAssessments.id });
    const insertId = inserted.id;
    const [created] = await db
        .select()
        .from(securityMaturityAssessments)
        .where(eq(securityMaturityAssessments.id, insertId))
        .limit(1);
    return created as AssessmentRow;
}

export async function deleteAssessmentRow(orgId: number, id: number): Promise<boolean> {
    const db = await getDb();
    if (!db || orgId < 0) {
        const idx = MEM_ASSESSMENTS.findIndex(a => a.id === id && a.organizationId === orgId);
        if (idx === -1) return false;
        MEM_ASSESSMENTS.splice(idx, 1);
        return true;
    }
    const [existing] = await db
        .select({ id: securityMaturityAssessments.id })
        .from(securityMaturityAssessments)
        .where(eq(securityMaturityAssessments.id, id))
        .limit(1);
    if (!existing) return false;
    await db.delete(securityMaturityAssessments).where(eq(securityMaturityAssessments.id, id));
    return true;
}
