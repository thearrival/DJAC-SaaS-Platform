/**
 * ctem-scoring.ts — CTEM Risk Scoring Engine
 *
 * Implements the FinalPriorityScore formula:
 *   FinalPriorityScore = (ExposureScore × 0.35) + (ExploitabilityScore × 0.40) + (BusinessImpactScore × 0.25)
 *
 * All intermediate scores are 0–100 integers.
 */

import { and, desc, eq, inArray } from "drizzle-orm";
import {
    ctemAssets,
    ctemAttackSimulations,
    ctemRiskScores,
    ctemVulnerabilities,
    complianceExposureMappings,
    continuousComplianceRuns,
    adminNotifications,
    type CtemAsset,
    type CtemVulnerability,
    type CtemAttackSimulation,
    type CtemRiskScore,
    type InsertCtemRiskScore,
    type InsertContinuousComplianceRun,
    type InsertComplianceExposureMapping,
} from "../drizzle/schema";
import { getDb } from "./db";

// ─── Severity weight map ──────────────────────────────────────────────────────

const SEVERITY_WEIGHT: Record<string, number> = {
    critical: 100,
    high: 75,
    medium: 50,
    low: 25,
    informational: 5,
};

// ─── Scoring helpers ──────────────────────────────────────────────────────────

/** Clamp a number to [0, 100] integer */
function clamp(value: number): number {
    return Math.max(0, Math.min(100, Math.round(value)));
}

/**
 * ExposureScore — reflects how "reachable" or "visible" an asset is.
 *
 * Factors:
 *  - internet-facing  (+40)
 *  - criticalityScore / 10 × 20   (max +20)
 *  - highest unpatched vuln severity × 0.40  (max +40)
 */
export function computeExposureScore(
    asset: Pick<CtemAsset, "isInternetFacing" | "criticalityScore">,
    vulns: Pick<CtemVulnerability, "severity" | "isPatched">[],
): number {
    const facingBonus = asset.isInternetFacing ? 40 : 10;
    const critBonus = clamp((asset.criticalityScore / 10) * 20);
    const unpatched = vulns.filter((v) => !v.isPatched);
    const highestSev = unpatched.reduce(
        (max, v) => Math.max(max, SEVERITY_WEIGHT[v.severity] ?? 0),
        0,
    );
    const vulnBonus = clamp(highestSev * 0.4);
    return clamp(facingBonus + critBonus + vulnBonus);
}

/**
 * ExploitabilityScore — how likely an attacker can actually exploit the asset.
 *
 * Factors:
 *  - % of unpatched vulns WITH exploit available × 50  (max +50)
 *  - avg BAS successProbability × 0.50                 (max +50)
 */
export function computeExploitabilityScore(
    vulns: Pick<CtemVulnerability, "exploitAvailable" | "isPatched">[],
    simulations: Pick<CtemAttackSimulation, "successProbability">[],
): number {
    const unpatched = vulns.filter((v) => !v.isPatched);
    const exploitableRatio =
        unpatched.length > 0
            ? unpatched.filter((v) => v.exploitAvailable).length / unpatched.length
            : 0;
    const exploitBonus = clamp(exploitableRatio * 50);

    const avgSim =
        simulations.length > 0
            ? simulations.reduce((s, r) => s + r.successProbability, 0) / simulations.length
            : 0;
    const simBonus = clamp(avgSim * 0.5);

    return clamp(exploitBonus + simBonus);
}

/**
 * BusinessImpactScore — reflects data sensitivity + criticality.
 *
 * Factors:
 *  - handlesPersonalData  (+30)
 *  - handlesCriticalData  (+30)
 *  - criticalityScore / 10 × 40  (max +40)
 */
export function computeBusinessImpactScore(
    asset: Pick<CtemAsset, "handlesPersonalData" | "handlesCriticalData" | "criticalityScore">,
): number {
    const piBonus = asset.handlesPersonalData ? 30 : 0;
    const cdBonus = asset.handlesCriticalData ? 30 : 0;
    const critBonus = clamp((asset.criticalityScore / 10) * 40);
    return clamp(piBonus + cdBonus + critBonus);
}

/** Derive priority tier from composite score */
export function tierFromScore(score: number): CtemRiskScore["priorityTier"] {
    if (score >= 80) return "critical";
    if (score >= 60) return "high";
    if (score >= 40) return "medium";
    return "low";
}

/** Full composite scoring for one asset */
export function computeRiskScore(
    asset: Pick<CtemAsset, "isInternetFacing" | "criticalityScore" | "handlesPersonalData" | "handlesCriticalData">,
    vulns: Pick<CtemVulnerability, "severity" | "isPatched" | "exploitAvailable">[],
    simulations: Pick<CtemAttackSimulation, "successProbability">[],
): Omit<InsertCtemRiskScore, "assetId" | "previousFinalScore"> {
    const exp = computeExposureScore(asset, vulns);
    const expl = computeExploitabilityScore(vulns, simulations);
    const biz = computeBusinessImpactScore(asset);
    const final = clamp(exp * 0.35 + expl * 0.40 + biz * 0.25);
    return {
        exposureScore: exp,
        exploitabilityScore: expl,
        businessImpactScore: biz,
        finalPriorityScore: final,
        priorityTier: tierFromScore(final),
    };
}

// ─── Compliance Exposure Mapping Logic ───────────────────────────────────────

interface ExposureMappingInput {
    vulnerabilityId: number;
    severity: string;
    title: string;
    cveId?: string | null;
    assetHandlesPersonalData: boolean;
    assetHandlesCriticalData: boolean;
    assetRegion: string;
}

/**
 * Auto-generates compliance exposure mappings for a vulnerability based on
 * heuristic rules aligned to the 5 DJAC frameworks.
 */
export function deriveExposureMappings(
    input: ExposureMappingInput,
): Omit<InsertComplianceExposureMapping, "id" | "createdAt">[] {
    const results: Omit<InsertComplianceExposureMapping, "id" | "createdAt">[] = [];
    const sev = (input.severity === "critical" || input.severity === "high") ? "high" : "medium";
    const titleLower = input.title.toLowerCase();

    const isChinaRegion = input.assetRegion === "China" || input.assetRegion === "Cross-border";
    const isSaudiRegion = input.assetRegion === "Saudi Arabia" || input.assetRegion === "Cross-border";

    // ── Access control → NCA ECC ──────────────────────────────────────────────
    if (/access|auth|privilege|credential|password|account/i.test(titleLower)) {
        if (isSaudiRegion) {
            results.push({
                vulnerabilityId: input.vulnerabilityId,
                frameworkCode: "NCA",
                frameworkId: null,
                controlId: null,
                controlCode: "ECC-2-1-1",
                mappingReason: `Vulnerability "${input.title}" affects access control mechanisms — directly linked to NCA ECC Access Management controls.`,
                severityImpact: sev as any,
            });
        }
        if (isChinaRegion) {
            results.push({
                vulnerabilityId: input.vulnerabilityId,
                frameworkCode: "CSL",
                frameworkId: null,
                controlId: null,
                controlCode: "CSL-Art.21",
                mappingReason: `Vulnerability "${input.title}" affects authentication/access controls — relevant to CSL Art.21 network security obligations.`,
                severityImpact: sev as any,
            });
        }
    }

    // ── Personal data leakage → PDPL + PIPL ───────────────────────────────────
    if (input.assetHandlesPersonalData && /data|leak|exfil|exposure|sensitive|personal|PII|privacy/i.test(titleLower)) {
        if (isSaudiRegion) {
            results.push({
                vulnerabilityId: input.vulnerabilityId,
                frameworkCode: "PDPL",
                frameworkId: null,
                controlId: null,
                controlCode: "PDPL-Art.19",
                mappingReason: `Asset handles personal data and vulnerability "${input.title}" creates a data leakage risk — maps to PDPL Art.19 personal data security obligations.`,
                severityImpact: (input.severity === "critical" ? "critical" : sev) as any,
            });
        }
        if (isChinaRegion) {
            results.push({
                vulnerabilityId: input.vulnerabilityId,
                frameworkCode: "PIPL",
                frameworkId: null,
                controlId: null,
                controlCode: "PIPL-Art.51",
                mappingReason: `Asset processes personal information and vulnerability "${input.title}" exposes data subjects — maps to PIPL Art.51 security measures requirements.`,
                severityImpact: (input.severity === "critical" ? "critical" : sev) as any,
            });
        }
    }

    // ── Critical data / cross-border transfer → DSL + PIPL ───────────────────
    if (input.assetHandlesCriticalData && (isChinaRegion)) {
        results.push({
            vulnerabilityId: input.vulnerabilityId,
            frameworkCode: "DSL",
            frameworkId: null,
            controlId: null,
            controlCode: "DSL-Art.27",
            mappingReason: `Asset handles important/critical data under DSL and vulnerability "${input.title}" may lead to unauthorized data access — requires DSL Art.27 security management measures.`,
            severityImpact: (input.severity === "critical" ? "critical" : "high") as any,
        });
    }

    // ── Encryption / cryptographic weakness → PIPL + PDPL ────────────────────
    if (/encrypt|crypto|tls|ssl|cert|cipher|hash/i.test(titleLower)) {
        if (isChinaRegion) {
            results.push({
                vulnerabilityId: input.vulnerabilityId,
                frameworkCode: "PIPL",
                frameworkId: null,
                controlId: null,
                controlCode: "PIPL-Art.51",
                mappingReason: `Cryptographic weakness "${input.title}" undermines PIPL Art.51 requirement for encryption of personal information.`,
                severityImpact: sev as any,
            });
        }
        if (isSaudiRegion) {
            results.push({
                vulnerabilityId: input.vulnerabilityId,
                frameworkCode: "NCA",
                frameworkId: null,
                controlId: null,
                controlCode: "ECC-2-3-1",
                mappingReason: `Cryptographic weakness "${input.title}" violates NCA ECC-2-3 cryptography controls.`,
                severityImpact: sev as any,
            });
        }
    }

    // ── Cross-border transfer exposure → CSL + PDPL ──────────────────────────
    if (input.assetRegion === "Cross-border") {
        results.push({
            vulnerabilityId: input.vulnerabilityId,
            frameworkCode: "CSL",
            frameworkId: null,
            controlId: null,
            controlCode: "CSL-Art.37",
            mappingReason: `Cross-border asset with vulnerability "${input.title}" — CSL Art.37 requires security assessment before any critical data cross-border transfer.`,
            severityImpact: sev as any,
        });
    }

    return results;
}

// ─── Run Execution ─────────────────────────────────────────────────────────────

export interface RunResult {
    runId: number;
    assetsScanned: number;
    vulnsFound: number;
    exploitableVulns: number;
    avgPriorityScore: number;
    scoreDelta: number | null;
    alertRaised: boolean;
    assetResults: {
        assetId: number;
        assetName: string;
        finalScore: number;
        tier: string;
        delta: number | null;
    }[];
}

/**
 * Execute a full continuous compliance run for an organization (or a single vendor).
 * Works in-memory when DB is unavailable (returns a simulated result).
 */
export async function executeContinuousComplianceRun(params: {
    organizationId: number;
    vendorId?: number;
    triggeredBy?: "manual" | "scheduled" | "webhook";
    runId?: number;
}): Promise<RunResult> {
    const db = await getDb();

    if (!db) {
        // In-memory mode — return simulated result
        return simulateInMemoryRun(params);
    }

    const { organizationId, vendorId, triggeredBy = "manual" } = params;

    // Create a run record (or reuse provided id)
    let runId = params.runId;
    if (!runId) {
        const [ins] = await db.insert(continuousComplianceRuns).values({
            organizationId,
            vendorId: vendorId ?? null,
            runStatus: "running",
            triggeredBy,
            startedAt: new Date(),
        } satisfies Partial<InsertContinuousComplianceRun> as any);
        runId = (ins as { insertId: number }).insertId;
    } else {
        await db
            .update(continuousComplianceRuns)
            .set({ runStatus: "running" })
            .where(eq(continuousComplianceRuns.id, runId));
    }

    try {
        // Fetch all active assets for this org (+ optional vendor filter)
        const assetQuery = db
            .select()
            .from(ctemAssets)
            .where(
                and(
                    eq(ctemAssets.organizationId, organizationId),
                    eq(ctemAssets.status, "active"),
                    ...(vendorId ? [eq(ctemAssets.vendorId, vendorId)] : []),
                ),
            );

        const assets = await assetQuery;
        if (assets.length === 0) {
            await db
                .update(continuousComplianceRuns)
                .set({ runStatus: "completed", completedAt: new Date(), summary: "No active assets found." })
                .where(eq(continuousComplianceRuns.id, runId!));
            return { runId: runId!, assetsScanned: 0, vulnsFound: 0, exploitableVulns: 0, avgPriorityScore: 0, scoreDelta: null, alertRaised: false, assetResults: [] };
        }

        const assetIds = assets.map((a) => a.id);

        // Bulk-fetch vulns + simulations for all assets
        const allVulns = await db
            .select()
            .from(ctemVulnerabilities)
            .where(inArray(ctemVulnerabilities.assetId, assetIds));

        const allSims = await db
            .select()
            .from(ctemAttackSimulations)
            .where(inArray(ctemAttackSimulations.assetId, assetIds));

        // Fetch previous scores for drift calculation
        const prevScores = await db
            .select({ assetId: ctemRiskScores.assetId, finalPriorityScore: ctemRiskScores.finalPriorityScore })
            .from(ctemRiskScores)
            .where(inArray(ctemRiskScores.assetId, assetIds));
        const prevScoreMap = new Map(prevScores.map((s) => [s.assetId, s.finalPriorityScore]));

        let totalScore = 0;
        let totalVulns = 0;
        let exploitable = 0;
        let alertRaised = false;
        const assetResults: RunResult["assetResults"] = [];

        for (const asset of assets) {
            const vulns = allVulns.filter((v) => v.assetId === asset.id);
            const sims = allSims.filter((s) => s.assetId === asset.id);

            totalVulns += vulns.length;
            exploitable += vulns.filter((v) => v.exploitAvailable && !v.isPatched).length;

            const scored = computeRiskScore(asset, vulns, sims);
            const prev = prevScoreMap.get(asset.id) ?? null;
            const delta = prev !== null ? (scored.finalPriorityScore ?? 0) - prev : null;

            // Drift alert: >20 point increase OR new critical exploitable vuln
            if (
                (delta !== null && delta > 20) ||
                vulns.some((v) => v.severity === "critical" && v.exploitAvailable && !v.isPatched)
            ) {
                alertRaised = true;
            }

            // Upsert risk score
            const existing = prevScores.find((s) => s.assetId === asset.id);
            if (existing) {
                await db
                    .update(ctemRiskScores)
                    .set({
                        ...scored,
                        previousFinalScore: prev,
                        updatedAt: new Date(),
                    })
                    .where(eq(ctemRiskScores.assetId, asset.id));
            } else {
                await db.insert(ctemRiskScores).values({
                    assetId: asset.id,
                    ...scored,
                    previousFinalScore: null,
                });
            }

            // Auto-generate compliance exposure mappings for unpatched vulns
            const unpatchedVulns = vulns.filter((v) => !v.isPatched);
            for (const vuln of unpatchedVulns) {
                const maps = deriveExposureMappings({
                    vulnerabilityId: vuln.id,
                    severity: vuln.severity,
                    title: vuln.title,
                    cveId: vuln.cveId,
                    assetHandlesPersonalData: Boolean(asset.handlesPersonalData),
                    assetHandlesCriticalData: Boolean(asset.handlesCriticalData),
                    assetRegion: asset.region,
                });
                // Insert only new mappings (idempotent: skip if vulnId+frameworkCode already exists)
                for (const m of maps) {
                    const already = await db
                        .select({ id: complianceExposureMappings.id })
                        .from(complianceExposureMappings)
                        .where(
                            and(
                                eq(complianceExposureMappings.vulnerabilityId, vuln.id),
                                ...(m.frameworkCode
                                    ? [eq(complianceExposureMappings.frameworkCode, m.frameworkCode)]
                                    : []),
                            ),
                        )
                        .limit(1);
                    if (already.length === 0) {
                        await db.insert(complianceExposureMappings).values(m as any);
                    }
                }
            }

            totalScore += scored.finalPriorityScore ?? 0;
            assetResults.push({
                assetId: asset.id,
                assetName: asset.assetName,
                finalScore: scored.finalPriorityScore ?? 0,
                tier: scored.priorityTier ?? "low",
                delta,
            });
        }

        const avgScore = assets.length > 0 ? Math.round(totalScore / assets.length) : 0;

        // Fetch previous run's avgScore for run-level delta
        const [prevRun] = await db
            .select({ avgPriorityScore: continuousComplianceRuns.avgPriorityScore })
            .from(continuousComplianceRuns)
            .where(
                and(
                    eq(continuousComplianceRuns.organizationId, organizationId),
                    eq(continuousComplianceRuns.runStatus, "completed"),
                ),
            )
            .orderBy(desc(continuousComplianceRuns.startedAt))
            .limit(1);

        const runDelta = prevRun ? avgScore - prevRun.avgPriorityScore : null;

        // Update run record
        await db
            .update(continuousComplianceRuns)
            .set({
                runStatus: "completed",
                assetsScanned: assets.length,
                vulnsFound: totalVulns,
                exploitableVulns: exploitable,
                avgPriorityScore: avgScore,
                scoreDelta: runDelta,
                alertRaised: alertRaised ? 1 : 0,
                completedAt: new Date(),
                summary: `Scanned ${assets.length} asset(s). Found ${totalVulns} vulnerability/ies, ${exploitable} exploitable. Average risk score: ${avgScore}/100.`,
            })
            .where(eq(continuousComplianceRuns.id, runId!));

        // Raise admin notification if alert triggered
        if (alertRaised) {
            await db.insert(adminNotifications).values({
                category: "system",
                title: "🚨 CTEM Alert: New Critical Exposure Detected",
                content: `A continuous compliance run detected a critical exploitable vulnerability or a risk score increase >20 points. Run ID: ${runId}. Avg score: ${avgScore}/100. Review the Continuous Compliance dashboard immediately.`,
                entityType: "continuousComplianceRuns",
                entityId: runId,
                isRead: 0,
            });
        }

        return {
            runId: runId!,
            assetsScanned: assets.length,
            vulnsFound: totalVulns,
            exploitableVulns: exploitable,
            avgPriorityScore: avgScore,
            scoreDelta: runDelta,
            alertRaised,
            assetResults,
        };
    } catch (err) {
        await db
            .update(continuousComplianceRuns)
            .set({ runStatus: "failed", completedAt: new Date(), summary: String(err) })
            .where(eq(continuousComplianceRuns.id, runId!));
        throw err;
    }
}

// ─── In-memory simulation (no DB) ────────────────────────────────────────────

function simulateInMemoryRun(params: {
    organizationId: number;
    vendorId?: number;
    triggeredBy?: string;
}): RunResult {
    // Generate deterministic-ish demo data based on orgId
    const seed = params.organizationId % 10;
    const numAssets = 3 + seed;

    const assetResults: RunResult["assetResults"] = Array.from({ length: numAssets }, (_, i) => {
        const base = 30 + ((seed * 7 + i * 11) % 55);
        return {
            assetId: -(i + 1),
            assetName: [`API Gateway`, `Customer DB`, `Auth Service`, `Data Pipeline`, `Cloud Storage`, `Admin Portal`, `CDN Edge`, `Analytics Engine`, `Partner API`, `Backup Service`][i % 10],
            finalScore: base,
            tier: tierFromScore(base),
            delta: i % 3 === 0 ? null : (i % 2 === 0 ? 5 : -3),
        };
    });

    const avgScore = Math.round(assetResults.reduce((s, r) => s + r.finalScore, 0) / numAssets);

    return {
        runId: -(params.organizationId),
        assetsScanned: numAssets,
        vulnsFound: numAssets * 2 + seed,
        exploitableVulns: Math.ceil(numAssets * 0.4),
        avgPriorityScore: avgScore,
        scoreDelta: seed % 4 === 0 ? null : (seed > 5 ? 8 : -5),
        alertRaised: avgScore >= 70,
        assetResults,
    };
}
