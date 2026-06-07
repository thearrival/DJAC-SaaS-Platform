/**
 * Compliance Report Store — DB operations for compliance-report-router.ts
 */

import { eq, inArray } from "drizzle-orm";
import {
    vendors,
    vendorAssessments,
    assessmentGaps,
    remediationTasks,
    riskRegister,
    compliancePolicies,
    complianceIncidents,
    auditSchedules,
} from "../drizzle/schema";
import { getDb } from "./db";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toIso(d: Date | string | null | undefined): string | null {
    if (!d) return null;
    return d instanceof Date ? d.toISOString() : String(d);
}

export const EMPTY_SUMMARY = {
    generatedAt: new Date().toISOString(),
    vendors: { total: 0 },
    gaps: { total: 0, critical: 0, high: 0 },
    risks: { total: 0, open: 0, critical: 0 },
    remediation: { total: 0, open: 0, resolved: 0 },
    policies: { total: 0, active: 0, draft: 0 },
    incidents: { total: 0, open: 0, critical: 0 },
    auditSchedule: { total: 0, upcoming: 0, overdue: 0, completed: 0 },
};

export type ComplianceModule = "gaps" | "risks" | "remediation" | "policies" | "incidents" | "audit_schedule";

// ─── Store functions ──────────────────────────────────────────────────────────

export async function getComplianceSummary(orgId: number) {
    const db = await getDb();
    if (!db || orgId < 0) return { ...EMPTY_SUMMARY, generatedAt: new Date().toISOString() };

    const now = new Date();

    const vRows = await db
        .select({ id: vendors.id })
        .from(vendors)
        .where(eq(vendors.organizationId, orgId));

    const vendorIds = vRows.map(v => v.id);
    let gapRows: { severity: "low" | "medium" | "high" | "critical" | null }[] = [];
    if (vendorIds.length) {
        const assessRows = await db
            .select({ id: vendorAssessments.id })
            .from(vendorAssessments)
            .where(inArray(vendorAssessments.vendorId, vendorIds));
        const assessIds = assessRows.map(a => a.id);
        if (assessIds.length) {
            gapRows = await db
                .select({ severity: assessmentGaps.severity })
                .from(assessmentGaps)
                .where(inArray(assessmentGaps.assessmentId, assessIds));
        }
    }

    const [rRows, remRows, pRows, iRows, asRows] = await Promise.all([
        db.select({ status: riskRegister.status, likelihood: riskRegister.likelihood, impact: riskRegister.impact })
            .from(riskRegister).where(eq(riskRegister.organizationId, orgId)),
        db.select({ status: remediationTasks.status })
            .from(remediationTasks).where(eq(remediationTasks.organizationId, orgId)),
        db.select({ status: compliancePolicies.status })
            .from(compliancePolicies).where(eq(compliancePolicies.organizationId, orgId)),
        db.select({ status: complianceIncidents.status, severity: complianceIncidents.severity })
            .from(complianceIncidents).where(eq(complianceIncidents.organizationId, orgId)),
        db.select({ status: auditSchedules.status, scheduledDate: auditSchedules.scheduledDate })
            .from(auditSchedules).where(eq(auditSchedules.organizationId, orgId)),
    ]);

    return {
        generatedAt: now.toISOString(),
        vendors: { total: vRows.length },
        gaps: {
            total: gapRows.length,
            critical: gapRows.filter(g => g.severity === "critical").length,
            high: gapRows.filter(g => g.severity === "high").length,
        },
        risks: {
            total: rRows.length,
            open: rRows.filter(r => r.status === "open" || r.status === "in_treatment").length,
            critical: rRows.filter(r => (r.likelihood ?? 1) * (r.impact ?? 1) >= 15).length,
        },
        remediation: {
            total: remRows.length,
            open: remRows.filter(r => r.status === "open" || r.status === "in_progress").length,
            resolved: remRows.filter(r => r.status === "resolved").length,
        },
        policies: {
            total: pRows.length,
            active: pRows.filter(p => p.status === "active").length,
            draft: pRows.filter(p => p.status === "draft").length,
        },
        incidents: {
            total: iRows.length,
            open: iRows.filter(i => i.status !== "closed" && i.status !== "resolved").length,
            critical: iRows.filter(i => i.severity === "critical").length,
        },
        auditSchedule: {
            total: asRows.length,
            upcoming: asRows.filter(a => a.status === "planned" && a.scheduledDate != null && new Date(a.scheduledDate) >= now).length,
            overdue: asRows.filter(a => a.status === "planned" && a.scheduledDate != null && new Date(a.scheduledDate) < now).length,
            completed: asRows.filter(a => a.status === "completed").length,
        },
    };
}

export async function getComplianceModuleData(orgId: number, module: ComplianceModule) {
    const db = await getDb();
    if (!db || orgId < 0) return [];

    switch (module) {
        case "gaps": {
            const vRows = await db
                .select({ id: vendors.id, vendorName: vendors.vendorName })
                .from(vendors)
                .where(eq(vendors.organizationId, orgId));
            if (!vRows.length) return [];
            const vendorIds = vRows.map(v => v.id);
            const aRows = await db
                .select({ id: vendorAssessments.id, vendorId: vendorAssessments.vendorId })
                .from(vendorAssessments)
                .where(inArray(vendorAssessments.vendorId, vendorIds));
            if (!aRows.length) return [];
            const assessIds = aRows.map(a => a.id);
            const aMap = new Map(aRows.map(a => [a.id, a.vendorId]));
            const vMap = new Map(vRows.map(v => [v.id, v.vendorName]));
            const gRows = await db
                .select({
                    id: assessmentGaps.id,
                    assessmentId: assessmentGaps.assessmentId,
                    controlId: assessmentGaps.controlId,
                    gapDescription: assessmentGaps.gapDescription,
                    severity: assessmentGaps.severity,
                    remediation: assessmentGaps.remediation,
                    createdAt: assessmentGaps.createdAt,
                })
                .from(assessmentGaps)
                .where(inArray(assessmentGaps.assessmentId, assessIds));
            return gRows.map(r => ({
                ...r,
                vendorId: aMap.get(r.assessmentId ?? 0) ?? null,
                vendorName: vMap.get(aMap.get(r.assessmentId ?? 0) ?? 0) ?? null,
                createdAt: toIso(r.createdAt),
            }));
        }
        case "risks": {
            const rows = await db.select().from(riskRegister).where(eq(riskRegister.organizationId, orgId));
            return rows.map(r => ({
                ...r,
                score: (r.likelihood ?? 1) * (r.impact ?? 1),
                reviewDate: toIso(r.reviewDate),
                createdAt: toIso(r.createdAt),
                updatedAt: toIso(r.updatedAt),
            }));
        }
        case "remediation": {
            const rows = await db.select().from(remediationTasks).where(eq(remediationTasks.organizationId, orgId));
            return rows.map(r => ({
                ...r,
                dueDate: toIso(r.dueDate),
                createdAt: toIso(r.createdAt),
                updatedAt: toIso(r.updatedAt),
            }));
        }
        case "policies": {
            const rows = await db.select().from(compliancePolicies).where(eq(compliancePolicies.organizationId, orgId));
            return rows.map(r => ({
                ...r,
                lastApprovedAt: toIso(r.lastApprovedAt),
                nextReviewAt: toIso(r.nextReviewAt),
                createdAt: toIso(r.createdAt),
                updatedAt: toIso(r.updatedAt),
            }));
        }
        case "incidents": {
            const rows = await db.select().from(complianceIncidents).where(eq(complianceIncidents.organizationId, orgId));
            return rows.map(r => ({
                ...r,
                occurredAt: toIso(r.occurredAt),
                detectedAt: toIso(r.detectedAt),
                containedAt: toIso(r.containedAt),
                resolvedAt: toIso(r.resolvedAt),
                createdAt: toIso(r.createdAt),
                updatedAt: toIso(r.updatedAt),
            }));
        }
        case "audit_schedule": {
            const rows = await db.select().from(auditSchedules).where(eq(auditSchedules.organizationId, orgId));
            return rows.map(r => ({
                ...r,
                scheduledDate: toIso(r.scheduledDate),
                completedDate: toIso(r.completedDate),
                nextOccurrence: toIso(r.nextOccurrence),
                createdAt: toIso(r.createdAt),
                updatedAt: toIso(r.updatedAt),
            }));
        }
        default:
            return [];
    }
}
