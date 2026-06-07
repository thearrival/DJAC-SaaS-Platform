/**
 * Vendor Compliance Store — DB operations for vendor-compliance-router.ts
 */

import { and, eq, inArray } from "drizzle-orm";
import {
    vendors,
    vendorAssessments,
    assessmentGaps,
    riskRegister,
    remediationTasks,
    complianceIncidents,
} from "../drizzle/schema";
import { getDb } from "./db";

// ─── Score helpers ────────────────────────────────────────────────────────────

export type RiskLevel = "critical" | "high" | "medium" | "low";

export function calcRiskLevel(score: number): RiskLevel {
    if (score < 40) return "critical";
    if (score < 60) return "high";
    if (score < 80) return "medium";
    return "low";
}

export function calcCompositeScore(params: {
    avgAssessmentScore: number | null;
    criticalGaps: number;
    openGaps: number;
    criticalRisks: number;
    openRisks: number;
    criticalIncidents: number;
    openIncidents: number;
    openRemediations: number;
}): number {
    const base = params.avgAssessmentScore !== null ? 40 * (params.avgAssessmentScore / 100) : 60;
    const deductions =
        params.criticalGaps * 8 + params.openGaps * 2 +
        params.criticalRisks * 6 + params.openRisks * 1.5 +
        params.criticalIncidents * 5 + params.openIncidents * 1 +
        params.openRemediations * 1;
    return Math.max(0, Math.min(100, Math.round(base + 60 - deductions)));
}

// ─── Store functions ──────────────────────────────────────────────────────────

export async function getVendorComplianceList(orgId: number) {
    const db = await getDb();
    if (!db || orgId < 0) return [];

    const vendorRows = await db
        .select({ id: vendors.id, vendorName: vendors.vendorName, industry: vendors.industry, headquartersLocation: vendors.headquartersLocation, riskTier: vendors.riskTier })
        .from(vendors)
        .where(eq(vendors.organizationId, orgId));
    if (!vendorRows.length) return [];

    const vendorIds = vendorRows.map(v => v.id);
    const assessRows = await db
        .select({ id: vendorAssessments.id, vendorId: vendorAssessments.vendorId, complianceScore: vendorAssessments.complianceScore })
        .from(vendorAssessments)
        .where(inArray(vendorAssessments.vendorId, vendorIds));

    const assessIds = assessRows.map(a => a.id);
    const gapRows = assessIds.length
        ? await db.select({ assessmentId: assessmentGaps.assessmentId, severity: assessmentGaps.severity }).from(assessmentGaps).where(inArray(assessmentGaps.assessmentId, assessIds))
        : [];

    const [riskRows, remRows, incRows] = await Promise.all([
        db.select({ vendorId: riskRegister.vendorId, status: riskRegister.status, likelihood: riskRegister.likelihood, impact: riskRegister.impact }).from(riskRegister).where(eq(riskRegister.organizationId, orgId)),
        db.select({ vendorId: remediationTasks.vendorId, status: remediationTasks.status }).from(remediationTasks).where(eq(remediationTasks.organizationId, orgId)),
        db.select({ affectedVendorId: complianceIncidents.affectedVendorId, severity: complianceIncidents.severity, status: complianceIncidents.status }).from(complianceIncidents).where(eq(complianceIncidents.organizationId, orgId)),
    ]);

    return vendorRows.map(v => {
        const vAssess = assessRows.filter(a => a.vendorId === v.id);
        const vGapIds = new Set(vAssess.map(a => a.id));
        const vGaps = gapRows.filter(g => g.assessmentId != null && vGapIds.has(g.assessmentId!));
        const openGaps = vGaps.length;
        const criticalGaps = vGaps.filter(g => g.severity === "critical").length;

        const vRisks = riskRows.filter(r => r.vendorId === v.id && r.status !== "closed" && r.status !== "accepted");
        const criticalRisks = vRisks.filter(r => (r.likelihood ?? 1) * (r.impact ?? 1) >= 15).length;

        const vRem = remRows.filter(r => r.vendorId === v.id && r.status !== "resolved" && r.status !== "accepted_risk");
        const openRemediations = vRem.length;

        const vInc = incRows.filter(i => i.affectedVendorId === v.id && i.status !== "closed" && i.status !== "resolved");
        const criticalIncidents = vInc.filter(i => i.severity === "critical").length;
        const openIncidents = vInc.length;

        const scores = vAssess.map(a => a.complianceScore).filter((s): s is number => s !== null && s !== undefined);
        const avgAssessmentScore = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;

        const compositeScore = calcCompositeScore({ avgAssessmentScore, criticalGaps, openGaps, criticalRisks, openRisks: vRisks.length, criticalIncidents, openIncidents, openRemediations });

        return { id: v.id, vendorName: v.vendorName, industry: v.industry ?? null, headquartersLocation: v.headquartersLocation ?? null, riskTier: v.riskTier ?? null, assessmentCount: vAssess.length, avgAssessmentScore, openGaps, criticalGaps, openRisks: vRisks.length, criticalRisks, openRemediations, openIncidents, criticalIncidents, compositeScore, riskLevel: calcRiskLevel(compositeScore) };
    }).sort((a, b) => a.compositeScore - b.compositeScore);
}

export async function getVendorComplianceProfile(orgId: number, vendorId: number) {
    const db = await getDb();
    if (!db || orgId < 0) return null;

    const [vendor] = await db
        .select()
        .from(vendors)
        .where(and(eq(vendors.id, vendorId), eq(vendors.organizationId, orgId)));
    if (!vendor) return null;

    const [assessRows, riskRows, remRows, incRows] = await Promise.all([
        db.select().from(vendorAssessments).where(eq(vendorAssessments.vendorId, vendorId)),
        db.select().from(riskRegister).where(and(eq(riskRegister.organizationId, orgId), eq(riskRegister.vendorId, vendorId))),
        db.select().from(remediationTasks).where(and(eq(remediationTasks.organizationId, orgId), eq(remediationTasks.vendorId, vendorId))),
        db.select().from(complianceIncidents).where(and(eq(complianceIncidents.organizationId, orgId), eq(complianceIncidents.affectedVendorId, vendorId))),
    ]);

    const assessIds = assessRows.map(a => a.id);
    const gapRows = assessIds.length
        ? await db.select().from(assessmentGaps).where(inArray(assessmentGaps.assessmentId, assessIds))
        : [];

    return {
        vendor: { id: vendor.id, vendorName: vendor.vendorName, industry: vendor.industry ?? null, headquartersLocation: vendor.headquartersLocation ?? null, riskTier: vendor.riskTier ?? null },
        assessments: assessRows,
        gaps: gapRows,
        risks: riskRows,
        remediationTasks: remRows,
        incidents: incRows,
    };
}
