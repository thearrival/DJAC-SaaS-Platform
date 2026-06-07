/**
 * Scorecard Store — DB operations for scorecard-router.ts
 */

import { and, desc, eq } from "drizzle-orm";
import {
    assessmentGaps,
    complianceReports,
    frameworks,
    vendorAssessments,
    vendors,
} from "../drizzle/schema";
import { getDb } from "./db";
import { listVendorProfiles } from "./vendor-store";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeEmptyScorecard(totalVendors: number) {
    return {
        totalVendors,
        assessedVendors: 0,
        overallScore: null as number | null,
        riskDistribution: { low: 0, medium: 0, high: 0, critical: 0 },
        statusDistribution: { compliant: 0, partial: 0, non_compliant: 0 },
        frameworks: [] as { code: string; name: string; avgScore: number; count: number }[],
        recentAssessments: [] as {
            id: number;
            vendorName: string;
            frameworkCode: string;
            score: number | null;
            riskLevel: string | null;
            assessmentDate: string;
        }[],
        gapsBySeverity: { low: 0, medium: 0, high: 0, critical: 0 },
        recentReports: [] as {
            id: number;
            title: string;
            reportType: string;
            overallScore: number | null;
            status: string;
            createdAt: string;
        }[],
    };
}

function toIso(d: Date | string | null | undefined): string {
    if (!d) return new Date().toISOString();
    return d instanceof Date ? d.toISOString() : String(d);
}

// ─── Store function ───────────────────────────────────────────────────────────

export async function getOrgScorecard(orgId: number, userId: number) {
    const db = await getDb();

    if (!db) {
        const inMemVendors = await listVendorProfiles(userId, orgId > 0 ? orgId : undefined);
        return makeEmptyScorecard(inMemVendors.length);
    }

    if (orgId < 0) return makeEmptyScorecard(0);

    const vendorRows = await db
        .select({ id: vendors.id, vendorName: vendors.vendorName })
        .from(vendors)
        .where(eq(vendors.organizationId, orgId));

    const totalVendors = vendorRows.length;
    if (totalVendors === 0) return makeEmptyScorecard(0);

    const assessmentRows = await db
        .select({
            id: vendorAssessments.id,
            vendorId: vendorAssessments.vendorId,
            vendorName: vendors.vendorName,
            frameworkId: vendorAssessments.frameworkId,
            frameworkCode: frameworks.code,
            frameworkName: frameworks.name,
            complianceScore: vendorAssessments.complianceScore,
            riskLevel: vendorAssessments.riskLevel,
            status: vendorAssessments.status,
            assessmentDate: vendorAssessments.assessmentDate,
        })
        .from(vendorAssessments)
        .innerJoin(vendors, eq(vendorAssessments.vendorId, vendors.id))
        .innerJoin(frameworks, eq(vendorAssessments.frameworkId, frameworks.id))
        .where(eq(vendors.organizationId, orgId))
        .orderBy(desc(vendorAssessments.assessmentDate));

    const latestMap = new Map<string, (typeof assessmentRows)[number]>();
    for (const row of assessmentRows) {
        const key = `${row.vendorId}:${row.frameworkId}`;
        if (!latestMap.has(key)) latestMap.set(key, row);
    }
    const latest = Array.from(latestMap.values());

    const assessedVendors = new Set(latest.map(r => r.vendorId)).size;

    const scores = latest.map(r => r.complianceScore).filter((s): s is number => s != null);
    const overallScore = scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : null;

    const riskDistribution = { low: 0, medium: 0, high: 0, critical: 0 };
    for (const r of latest) {
        if (r.riskLevel && r.riskLevel in riskDistribution) {
            riskDistribution[r.riskLevel as keyof typeof riskDistribution]++;
        }
    }

    const statusDistribution = { compliant: 0, partial: 0, non_compliant: 0 };
    for (const r of latest) {
        if (r.status && r.status in statusDistribution) {
            statusDistribution[r.status as keyof typeof statusDistribution]++;
        }
    }

    const fwMap = new Map<string, { code: string; name: string; scores: number[]; count: number }>();
    for (const r of latest) {
        if (!fwMap.has(r.frameworkCode)) {
            fwMap.set(r.frameworkCode, { code: r.frameworkCode, name: r.frameworkName, scores: [], count: 0 });
        }
        const entry = fwMap.get(r.frameworkCode)!;
        entry.count++;
        if (r.complianceScore != null) entry.scores.push(r.complianceScore);
    }
    const frameworkList = Array.from(fwMap.values()).map(fw => ({
        code: fw.code,
        name: fw.name,
        avgScore: fw.scores.length > 0 ? Math.round(fw.scores.reduce((a, b) => a + b, 0) / fw.scores.length) : 0,
        count: fw.count,
    }));

    const recentAssessments = assessmentRows.slice(0, 5).map(r => ({
        id: r.id,
        vendorName: r.vendorName,
        frameworkCode: r.frameworkCode,
        score: r.complianceScore,
        riskLevel: r.riskLevel,
        assessmentDate: toIso(r.assessmentDate),
    }));

    const gapsBySeverity = { low: 0, medium: 0, high: 0, critical: 0 };
    const gapRows = await db
        .select({ severity: assessmentGaps.severity })
        .from(assessmentGaps)
        .innerJoin(vendorAssessments, eq(assessmentGaps.assessmentId, vendorAssessments.id))
        .innerJoin(vendors, eq(vendorAssessments.vendorId, vendors.id))
        .where(eq(vendors.organizationId, orgId));
    for (const g of gapRows) {
        if (g.severity && g.severity in gapsBySeverity) {
            gapsBySeverity[g.severity as keyof typeof gapsBySeverity]++;
        }
    }

    const reportRows = await db
        .select({
            id: complianceReports.id,
            title: complianceReports.title,
            reportType: complianceReports.reportType,
            overallScore: complianceReports.overallScore,
            status: complianceReports.status,
            createdAt: complianceReports.createdAt,
        })
        .from(complianceReports)
        .where(and(eq(complianceReports.organizationId, orgId), eq(complianceReports.status, "ready")))
        .orderBy(desc(complianceReports.createdAt))
        .limit(5);

    return {
        totalVendors,
        assessedVendors,
        overallScore,
        riskDistribution,
        statusDistribution,
        frameworks: frameworkList,
        recentAssessments,
        gapsBySeverity,
        recentReports: reportRows.map(r => ({
            id: r.id,
            title: r.title,
            reportType: r.reportType,
            overallScore: r.overallScore,
            status: r.status,
            createdAt: toIso(r.createdAt),
        })),
    };
}
