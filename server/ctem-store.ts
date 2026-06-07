/**
 * ctem-store.ts — DB layer for the CTEM (Continuous Threat Exposure Management) module.
 *
 * All direct DB access for CTEM lives here. The router imports these functions
 * and handles input validation, TRPCError throws for auth failures, and org-scoping.
 */

import { and, desc, eq, inArray } from "drizzle-orm";
import {
    ctemAssets,
    ctemVulnerabilities,
    ctemRiskScores,
    continuousComplianceRuns,
    complianceExposureMappings,
    vendors,
    type CtemAsset,
    type CtemVulnerability,
    type CtemRiskScore,
    type ContinuousComplianceRun,
} from "../drizzle/schema";
import { getDb } from "./db";

// ─── In-memory fallback data ──────────────────────────────────────────────────

export function inMemoryDemoData(orgId: number) {
    const seed = Math.abs(orgId) % 8;
    const demoAssets = [
        { id: 1, assetName: "Customer API Gateway", assetType: "api_endpoint", region: "China", isInternetFacing: 1, criticalityScore: 9, handlesPersonalData: 1, handlesCriticalData: 1 },
        { id: 2, assetName: "PDPL Consent Database", assetType: "database", region: "Saudi Arabia", isInternetFacing: 0, criticalityScore: 8, handlesPersonalData: 1, handlesCriticalData: 0 },
        { id: 3, assetName: "Admin Portal", assetType: "web_application", region: "Cross-border", isInternetFacing: 1, criticalityScore: 7, handlesPersonalData: 0, handlesCriticalData: 1 },
        { id: 4, assetName: "Cloud Storage - CN", assetType: "storage_bucket", region: "China", isInternetFacing: 0, criticalityScore: 8, handlesPersonalData: 1, handlesCriticalData: 1 },
        { id: 5, assetName: "Auth / IdP Service", assetType: "identity_provider", region: "Cross-border", isInternetFacing: 1, criticalityScore: 10, handlesPersonalData: 1, handlesCriticalData: 0 },
    ].slice(0, 3 + seed % 3);

    const demoVulns = [
        { id: 1, assetId: 1, cveId: "CVE-2024-21762", title: "Authentication Bypass via JWT None Algorithm", severity: "critical", cvssScore: 92, exploitAvailable: 1, isPatched: 0, discoveredAt: new Date("2025-11-01") },
        { id: 2, assetId: 1, cveId: "CVE-2024-38856", title: "SQL Injection in Search Parameter", severity: "high", cvssScore: 78, exploitAvailable: 1, isPatched: 0, discoveredAt: new Date("2025-11-15") },
        { id: 3, assetId: 2, cveId: null, title: "Unencrypted PII at Rest", severity: "high", cvssScore: 70, exploitAvailable: 0, isPatched: 0, discoveredAt: new Date("2025-12-01") },
        { id: 4, assetId: 3, cveId: "CVE-2025-0282", title: "TLS 1.0/1.1 Cipher Suite Weakness", severity: "medium", cvssScore: 55, exploitAvailable: 0, isPatched: 1, discoveredAt: new Date("2026-01-10") },
        { id: 5, assetId: 4, cveId: "CVE-2024-34102", title: "Privilege Escalation in Storage SDK", severity: "critical", cvssScore: 95, exploitAvailable: 1, isPatched: 0, discoveredAt: new Date("2026-02-01") },
        { id: 6, assetId: 5, cveId: "CVE-2025-1234", title: "Credential Exposure via Debug Endpoint", severity: "high", cvssScore: 80, exploitAvailable: 1, isPatched: 0, discoveredAt: new Date("2026-03-05") },
    ];

    const demoScores = demoAssets.map((a) => {
        const vulns = demoVulns.filter((v) => v.assetId === a.id);
        const exploitable = vulns.filter((v) => v.exploitAvailable && !v.isPatched);
        const highestCvss = vulns.reduce((m, v) => Math.max(m, v.cvssScore), 0);
        const expScore = Math.min(100, (a.isInternetFacing ? 40 : 10) + Math.round((a.criticalityScore / 10) * 20) + Math.round(highestCvss * 0.4));
        const explScore = Math.min(100, Math.round((exploitable.length / Math.max(vulns.length, 1)) * 50) + (exploitable.length > 0 ? 30 : 0));
        const bizScore = Math.min(100, (a.handlesPersonalData ? 30 : 0) + (a.handlesCriticalData ? 30 : 0) + Math.round((a.criticalityScore / 10) * 40));
        const final = Math.round(expScore * 0.35 + explScore * 0.40 + bizScore * 0.25);
        const tier = final >= 80 ? "critical" : final >= 60 ? "high" : final >= 40 ? "medium" : "low";
        return { assetId: a.id, exposureScore: expScore, exploitabilityScore: explScore, businessImpactScore: bizScore, finalPriorityScore: final, priorityTier: tier, previousFinalScore: final - Math.ceil(Math.random() * 8) };
    });

    return { assets: demoAssets, vulns: demoVulns, scores: demoScores };
}

// ─── Assets ───────────────────────────────────────────────────────────────────

export async function listCtemAssets(
    orgId: number,
    filters?: { region?: string; vendorId?: number; status?: string }
): Promise<CtemAsset[]> {
    const db = await getDb();
    if (!db) return inMemoryDemoData(orgId).assets as any[];
    const where = [eq(ctemAssets.organizationId, orgId)];
    if (filters?.region) where.push(eq(ctemAssets.region, filters.region as any));
    if (filters?.vendorId) where.push(eq(ctemAssets.vendorId, filters.vendorId));
    if (filters?.status) where.push(eq(ctemAssets.status, filters.status as any));
    return db.select().from(ctemAssets).where(and(...where)).orderBy(desc(ctemAssets.createdAt));
}

export async function createCtemAsset(
    orgId: number,
    input: {
        vendorId?: number | null;
        assetName: string;
        assetType: string;
        ipDomain?: string | null;
        region: string;
        isInternetFacing: boolean;
        handlesPersonalData: boolean;
        handlesCriticalData: boolean;
        criticalityScore: number;
        status: string;
        notes?: string | null;
    }
): Promise<CtemAsset> {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const [res] = await db.insert(ctemAssets).values({
        organizationId: orgId,
        vendorId: input.vendorId ?? undefined,
        assetName: input.assetName,
        assetType: input.assetType,
        ipDomain: input.ipDomain ?? undefined,
        region: input.region,
        isInternetFacing: input.isInternetFacing ? 1 : 0,
        handlesPersonalData: input.handlesPersonalData ? 1 : 0,
        handlesCriticalData: input.handlesCriticalData ? 1 : 0,
        criticalityScore: input.criticalityScore,
        status: input.status as any,
        notes: input.notes ?? undefined,
    } as any);
    const id = (res as { insertId: number }).insertId;
    const [row] = await db.select().from(ctemAssets).where(eq(ctemAssets.id, id));
    return row;
}

/** Returns null if asset not found or doesn't belong to org. */
export async function getCtemAssetOwner(assetId: number): Promise<{ orgId: number } | null> {
    const db = await getDb();
    if (!db) return null;
    const [row] = await db.select({ orgId: ctemAssets.organizationId }).from(ctemAssets).where(eq(ctemAssets.id, assetId));
    return row ?? null;
}

export async function updateCtemAsset(
    id: number,
    patch: Partial<{
        assetName: string;
        assetType: string;
        ipDomain: string | null;
        region: string;
        isInternetFacing: boolean;
        handlesPersonalData: boolean;
        handlesCriticalData: boolean;
        criticalityScore: number;
        status: string;
        notes: string | null;
    }>
): Promise<CtemAsset> {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    await db.update(ctemAssets).set({
        ...(patch.assetName !== undefined && { assetName: patch.assetName }),
        ...(patch.assetType !== undefined && { assetType: patch.assetType }),
        ...(patch.ipDomain !== undefined && { ipDomain: patch.ipDomain }),
        ...(patch.region !== undefined && { region: patch.region }),
        ...(patch.isInternetFacing !== undefined && { isInternetFacing: patch.isInternetFacing ? 1 : 0 }),
        ...(patch.handlesPersonalData !== undefined && { handlesPersonalData: patch.handlesPersonalData ? 1 : 0 }),
        ...(patch.handlesCriticalData !== undefined && { handlesCriticalData: patch.handlesCriticalData ? 1 : 0 }),
        ...(patch.criticalityScore !== undefined && { criticalityScore: patch.criticalityScore }),
        ...(patch.status !== undefined && { status: patch.status }),
        ...(patch.notes !== undefined && { notes: patch.notes }),
    } as any).where(eq(ctemAssets.id, id));
    const [row] = await db.select().from(ctemAssets).where(eq(ctemAssets.id, id));
    return row;
}

export async function deleteCtemAsset(id: number): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    await db.delete(ctemAssets).where(eq(ctemAssets.id, id));
}

// ─── Vulnerabilities ──────────────────────────────────────────────────────────

export async function listCtemVulnerabilities(
    orgId: number,
    filters?: {
        assetId?: number;
        exploitableOnly?: boolean;
        severity?: string;
        includeMappings?: boolean;
    }
): Promise<(CtemVulnerability & { complianceMappings?: unknown[] })[]> {
    const db = await getDb();
    if (!db) {
        const { vulns } = inMemoryDemoData(orgId);
        let result = vulns as any[];
        if (filters?.exploitableOnly) result = result.filter((v) => v.exploitAvailable);
        if (filters?.severity) result = result.filter((v) => v.severity === filters.severity);
        return result;
    }

    const orgAssets = await db.select({ id: ctemAssets.id }).from(ctemAssets).where(eq(ctemAssets.organizationId, orgId));
    const orgAssetIds = orgAssets.map((a) => a.id);
    if (orgAssetIds.length === 0) return [];

    const vulnFilters: ReturnType<typeof eq>[] = [];
    if (filters?.assetId) {
        vulnFilters.push(eq(ctemVulnerabilities.assetId, filters.assetId));
    } else {
        vulnFilters.push(inArray(ctemVulnerabilities.assetId, orgAssetIds));
    }
    if (filters?.severity) vulnFilters.push(eq(ctemVulnerabilities.severity, filters.severity as any));
    if (filters?.exploitableOnly) vulnFilters.push(eq(ctemVulnerabilities.exploitAvailable, 1));

    const rows = await db
        .select()
        .from(ctemVulnerabilities)
        .where(and(...vulnFilters))
        .orderBy(desc(ctemVulnerabilities.cvssScore));

    if (!filters?.includeMappings) return rows;

    const vulnIds = rows.map((r) => r.id);
    const mappings = vulnIds.length > 0
        ? await db.select().from(complianceExposureMappings).where(inArray(complianceExposureMappings.vulnerabilityId, vulnIds))
        : [];
    return rows.map((row) => ({
        ...row,
        complianceMappings: mappings.filter((m) => m.vulnerabilityId === row.id),
    }));
}

export async function getCtemVulnAssetOwner(vulnId: number): Promise<{ assetId: number } | null> {
    const db = await getDb();
    if (!db) return null;
    const [row] = await db.select({ assetId: ctemVulnerabilities.assetId }).from(ctemVulnerabilities).where(eq(ctemVulnerabilities.id, vulnId));
    return row ?? null;
}

export async function createCtemVulnerability(
    input: {
        assetId: number;
        cveId?: string | null;
        title: string;
        description?: string | null;
        severity: string;
        cvssScore: number;
        exploitAvailable: boolean;
        isConfirmed: boolean;
        notes?: string | null;
    }
): Promise<CtemVulnerability> {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const [res] = await db.insert(ctemVulnerabilities).values({
        assetId: input.assetId,
        cveId: input.cveId ?? null,
        title: input.title,
        description: input.description ?? null,
        severity: input.severity as any,
        cvssScore: input.cvssScore,
        exploitAvailable: input.exploitAvailable ? 1 : 0,
        isConfirmed: input.isConfirmed ? 1 : 0,
        notes: input.notes ?? null,
        discoveredAt: new Date(),
    });
    const id = (res as { insertId: number }).insertId;
    const [row] = await db.select().from(ctemVulnerabilities).where(eq(ctemVulnerabilities.id, id));
    return row;
}

export async function patchCtemVulnerability(
    id: number,
    patch: {
        isPatched?: boolean;
        isConfirmed?: boolean;
        exploitAvailable?: boolean;
        severity?: string;
        notes?: string | null;
    }
): Promise<CtemVulnerability> {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const update: Record<string, unknown> = {};
    if (patch.isPatched !== undefined) { update.isPatched = patch.isPatched ? 1 : 0; if (patch.isPatched) update.patchedAt = new Date(); }
    if (patch.isConfirmed !== undefined) update.isConfirmed = patch.isConfirmed ? 1 : 0;
    if (patch.exploitAvailable !== undefined) update.exploitAvailable = patch.exploitAvailable ? 1 : 0;
    if (patch.severity !== undefined) update.severity = patch.severity;
    if (patch.notes !== undefined) update.notes = patch.notes;
    if (Object.keys(update).length > 0)
        await db.update(ctemVulnerabilities).set(update).where(eq(ctemVulnerabilities.id, id));
    const [row] = await db.select().from(ctemVulnerabilities).where(eq(ctemVulnerabilities.id, id));
    return row;
}

// ─── Risk Scores ──────────────────────────────────────────────────────────────

export async function listCtemRiskScores(
    orgId: number,
    filters?: { tier?: string; region?: string; vendorId?: number }
): Promise<(CtemRiskScore & { asset: CtemAsset | null })[]> {
    const db = await getDb();
    if (!db) {
        const { assets, scores } = inMemoryDemoData(orgId);
        return scores.map((s) => {
            const a = assets.find((x: any) => x.id === s.assetId) as any;
            return { ...s, asset: a ?? null };
        }) as any[];
    }
    const assetFilters = [eq(ctemAssets.organizationId, orgId)];
    if (filters?.region) assetFilters.push(eq(ctemAssets.region, filters.region as any));
    if (filters?.vendorId) assetFilters.push(eq(ctemAssets.vendorId, filters.vendorId));

    const orgAssets = await db.select().from(ctemAssets).where(and(...assetFilters));
    if (orgAssets.length === 0) return [];
    const assetIds = orgAssets.map((a) => a.id);

    const scoreFilters: ReturnType<typeof eq>[] = [inArray(ctemRiskScores.assetId, assetIds)];
    if (filters?.tier) scoreFilters.push(eq(ctemRiskScores.priorityTier, filters.tier as any));

    const scores = await db
        .select()
        .from(ctemRiskScores)
        .where(and(...scoreFilters))
        .orderBy(desc(ctemRiskScores.finalPriorityScore));

    return scores.map((s) => ({
        ...s,
        asset: orgAssets.find((a) => a.id === s.assetId) ?? null,
    }));
}

// ─── Risk Summary ─────────────────────────────────────────────────────────────

export async function getCtemRiskSummary(orgId: number) {
    const db = await getDb();
    if (!db) {
        const { assets, vulns, scores } = inMemoryDemoData(orgId);
        const byTier = (t: string) => scores.filter((s: any) => s.priorityTier === t).length;
        const lastRun = { runStatus: "completed", startedAt: new Date(Date.now() - 3600000), avgPriorityScore: scores.reduce((s: number, r: any) => s + r.finalPriorityScore, 0) / Math.max(scores.length, 1), alertRaised: 0 };
        return {
            totalAssets: assets.length,
            totalVulns: vulns.length,
            exploitableVulns: vulns.filter((v: any) => v.exploitAvailable && !v.isPatched).length,
            criticalAssets: byTier("critical"),
            highAssets: byTier("high"),
            mediumAssets: byTier("medium"),
            lowAssets: byTier("low"),
            avgPriorityScore: Math.round(scores.reduce((s: number, r: any) => s + r.finalPriorityScore, 0) / Math.max(scores.length, 1)),
            lastRun,
            frameworkExposure: [
                { frameworkCode: "PIPL", impactedVulns: 2, maxSeverity: "critical" },
                { frameworkCode: "PDPL", impactedVulns: 2, maxSeverity: "high" },
                { frameworkCode: "CSL", impactedVulns: 1, maxSeverity: "high" },
                { frameworkCode: "NCA", impactedVulns: 1, maxSeverity: "medium" },
                { frameworkCode: "DSL", impactedVulns: 1, maxSeverity: "high" },
            ],
        };
    }

    const orgAssets = await db.select().from(ctemAssets).where(eq(ctemAssets.organizationId, orgId));
    const assetIds = orgAssets.map((a) => a.id);

    const vulnCounts = assetIds.length > 0
        ? await db.select().from(ctemVulnerabilities).where(inArray(ctemVulnerabilities.assetId, assetIds))
        : [];
    const scores = assetIds.length > 0
        ? await db.select().from(ctemRiskScores).where(inArray(ctemRiskScores.assetId, assetIds))
        : [];

    const [lastRun] = await db
        .select()
        .from(continuousComplianceRuns)
        .where(eq(continuousComplianceRuns.organizationId, orgId))
        .orderBy(desc(continuousComplianceRuns.startedAt))
        .limit(1);

    const vulnIds = vulnCounts.map((v) => v.id);
    const mappings = vulnIds.length > 0
        ? await db.select().from(complianceExposureMappings).where(inArray(complianceExposureMappings.vulnerabilityId, vulnIds))
        : [];

    const fwMap = new Map<string, { count: number; maxSev: string }>();
    const sevOrder = ["critical", "high", "medium", "low"] as const;
    for (const m of mappings) {
        if (!m.frameworkCode) continue;
        const cur = fwMap.get(m.frameworkCode) ?? { count: 0, maxSev: "low" };
        const newWorst = sevOrder.indexOf(m.severityImpact as typeof sevOrder[number]) < sevOrder.indexOf(cur.maxSev as typeof sevOrder[number])
            ? m.severityImpact
            : cur.maxSev;
        fwMap.set(m.frameworkCode, { count: cur.count + 1, maxSev: newWorst });
    }

    const avgScore = scores.length > 0
        ? Math.round(scores.reduce((s, r) => s + r.finalPriorityScore, 0) / scores.length)
        : 0;

    return {
        totalAssets: orgAssets.length,
        totalVulns: vulnCounts.length,
        exploitableVulns: vulnCounts.filter((v) => v.exploitAvailable && !v.isPatched).length,
        criticalAssets: scores.filter((s) => s.priorityTier === "critical").length,
        highAssets: scores.filter((s) => s.priorityTier === "high").length,
        mediumAssets: scores.filter((s) => s.priorityTier === "medium").length,
        lowAssets: scores.filter((s) => s.priorityTier === "low").length,
        avgPriorityScore: avgScore,
        lastRun: lastRun ?? null,
        frameworkExposure: Array.from(fwMap.entries()).map(([frameworkCode, v]) => ({
            frameworkCode,
            impactedVulns: v.count,
            maxSeverity: v.maxSev,
        })),
    };
}

// ─── Run History ──────────────────────────────────────────────────────────────

export async function listCtemRuns(orgId: number, limit = 20): Promise<ContinuousComplianceRun[]> {
    const db = await getDb();
    if (!db) {
        return [
            { id: 1, runStatus: "completed", triggeredBy: "manual", startedAt: new Date(Date.now() - 7200000), completedAt: new Date(Date.now() - 7190000), assetsScanned: 5, vulnsFound: 6, exploitableVulns: 3, avgPriorityScore: 67, scoreDelta: 8, alertRaised: 1 },
            { id: 2, runStatus: "completed", triggeredBy: "scheduled", startedAt: new Date(Date.now() - 86400000), completedAt: new Date(Date.now() - 86390000), assetsScanned: 5, vulnsFound: 6, exploitableVulns: 2, avgPriorityScore: 59, scoreDelta: -4, alertRaised: 0 },
        ] as any[];
    }
    return db
        .select()
        .from(continuousComplianceRuns)
        .where(eq(continuousComplianceRuns.organizationId, orgId))
        .orderBy(desc(continuousComplianceRuns.startedAt))
        .limit(limit);
}

// ─── Framework Exposure ───────────────────────────────────────────────────────

export async function getCtemFrameworkExposure(orgId: number) {
    const db = await getDb();
    if (!db) {
        return [
            { frameworkCode: "PIPL", total: 3, critical: 1, high: 1, medium: 1, low: 0 },
            { frameworkCode: "PDPL", total: 2, critical: 0, high: 1, medium: 1, low: 0 },
            { frameworkCode: "CSL", total: 2, critical: 0, high: 1, medium: 1, low: 0 },
            { frameworkCode: "NCA", total: 1, critical: 0, high: 0, medium: 1, low: 0 },
            { frameworkCode: "DSL", total: 1, critical: 0, high: 1, medium: 0, low: 0 },
        ];
    }
    const orgAssets = await db.select({ id: ctemAssets.id }).from(ctemAssets).where(eq(ctemAssets.organizationId, orgId));
    if (orgAssets.length === 0) return [];
    const assetIds = orgAssets.map((a) => a.id);
    const vulnIds = assetIds.length > 0
        ? (await db.select({ id: ctemVulnerabilities.id }).from(ctemVulnerabilities).where(inArray(ctemVulnerabilities.assetId, assetIds))).map((v) => v.id)
        : [];
    if (vulnIds.length === 0) return [];
    const mappings = await db.select().from(complianceExposureMappings).where(inArray(complianceExposureMappings.vulnerabilityId, vulnIds));

    const fwMap = new Map<string, Record<string, number>>();
    for (const m of mappings) {
        if (!m.frameworkCode) continue;
        if (!fwMap.has(m.frameworkCode)) fwMap.set(m.frameworkCode, { total: 0, critical: 0, high: 0, medium: 0, low: 0 });
        const fw = fwMap.get(m.frameworkCode)!;
        fw.total++;
        fw[m.severityImpact] = (fw[m.severityImpact] ?? 0) + 1;
    }
    return Array.from(fwMap.entries()).map(([frameworkCode, counts]) => ({ frameworkCode, ...counts }));
}

// ─── Vendor list (for asset creation form) ────────────────────────────────────

export async function listVendorsForCtemAssets(orgId: number) {
    const db = await getDb();
    if (!db) return [{ id: 1, vendorName: "Demo Vendor" }];
    return db
        .select({ id: vendors.id, vendorName: vendors.vendorName })
        .from(vendors)
        .where(eq(vendors.organizationId, orgId));
}

// ─── Asset org-membership check helper ───────────────────────────────────────

/** Returns the organizationId of the asset, or null if not found. */
export async function getCtemAssetOrgId(assetId: number): Promise<number | null> {
    const db = await getDb();
    if (!db) return null;
    const [row] = await db.select({ orgId: ctemAssets.organizationId }).from(ctemAssets).where(eq(ctemAssets.id, assetId));
    return row?.orgId ?? null;
}
