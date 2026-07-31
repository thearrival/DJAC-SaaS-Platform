import { and, desc, eq, inArray } from "drizzle-orm";
import { complianceSimulations } from "../drizzle/schema";
import { getDb } from "./db";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SimulationScenario = {
  id: string;
  name: string;
  description: string;
  type:
    | "expansion"
    | "merger"
    | "new_regulation"
    | "cloud_migration"
    | "vendor_onboarding"
    | "custom";
  targetJurisdictions: string[];
  applicableFrameworks: string[];
  complianceBurden: "low" | "medium" | "high" | "very_high";
};

export type SimulationResult = {
  scenarioId: string;
  summary: string;
  overallReadiness: number;
  byJurisdiction: {
    jurisdiction: string;
    readiness: number;
    gaps: number;
    keyObligations: string[];
    estimatedEffort: string;
  }[];
  totalGaps: number;
  criticalGaps: number;
  recommendedTimeline: string;
  estimatedCost: string;
  aiRecommendation: string;
};

export type SimulationType =
  | "readiness"
  | "gap_analysis"
  | "cost_estimate"
  | "cross_border"
  | "full";

export type SimulationRisk = "low" | "medium" | "high" | "critical";

export type SimulationStatus = "draft" | "completed" | "archived";

export type SimulationEngineParams = {
  name: string;
  description?: string;
  simulationType: SimulationType;
  jurisdiction: string;
  frameworks: string[];
  industry?: string;
  organizationSize?: "startup" | "sme" | "enterprise";
};

export type SimulationEngineResult = {
  id: number;
  organizationId: number;
  name: string;
  description: string | null;
  simulationType: SimulationType;
  jurisdiction: string;
  frameworks: string[];
  maturityScores: Record<string, number>;
  gapCounts: Record<string, number>;
  totalGaps: number;
  costEstimateLow: number | null;
  costEstimateHigh: number | null;
  costEstimateCurrency: string;
  riskLevel: SimulationRisk;
  status: SimulationStatus;
  summary: string | null;
  crossBorderIssues: CrossBorderIssue[];
  createdAt: Date;
  updatedAt: Date;
};

export type CrossBorderIssue = {
  frameworks: [string, string];
  conflictScore: number;
  description: string;
  mitigation: string;
};

export type SimulationComparison = {
  simulation1: SimulationEngineResult;
  simulation2: SimulationEngineResult;
  scoreDeltas: {
    framework: string;
    score1: number;
    score2: number;
    delta: number;
  }[];
  gapDeltas: {
    framework: string;
    gaps1: number;
    gaps2: number;
    delta: number;
  }[];
  costDelta: { low: number; high: number };
  riskDelta: string;
  recommendation: string;
};

// ─── Preset Scenarios ─────────────────────────────────────────────────────────

const SCENARIOS: SimulationScenario[] = [
  {
    id: "scenario-expand-saudi",
    name: "Market Entry: EMEA",
    description:
      "Expand operations into EMEA with full PDPL-KSA, UAE-PDPL, and GDPR compliance.",
    type: "expansion",
    targetJurisdictions: ["Saudi Arabia", "UAE", "Qatar"],
    applicableFrameworks: ["PDPL-KSA", "NCA-ECC", "GDPR"],
    complianceBurden: "high",
  },
  {
    id: "scenario-expand-eu",
    name: "Market Entry: European Union",
    description:
      "Launch operations in the EU with GDPR, NIS2, and EU AI Act compliance.",
    type: "expansion",
    targetJurisdictions: ["European Union"],
    applicableFrameworks: ["GDPR", "NIS2", "DORA", "EU-AI-ACT"],
    complianceBurden: "very_high",
  },
  {
    id: "scenario-expand-us",
    name: "Market Entry: United States",
    description:
      "Enter US market with NIST CSF, HIPAA, SOX, and state privacy law compliance.",
    type: "expansion",
    targetJurisdictions: ["United States"],
    applicableFrameworks: ["NIST-CSF-2", "HIPAA", "SOX", "PCI-DSS"],
    complianceBurden: "high",
  },
  {
    id: "scenario-cloud-migration",
    name: "Cloud Migration: Multi-Region",
    description:
      "Move workloads to cloud with cross-border data sovereignty requirements.",
    type: "cloud_migration",
    targetJurisdictions: [
      "Saudi Arabia",
      "European Union",
      "United States",
      "China",
    ],
    applicableFrameworks: ["NCA-CCC", "GDPR", "FedRAMP", "CSA-CCM", "MLPS-2"],
    complianceBurden: "very_high",
  },
  {
    id: "scenario-ai-deployment",
    name: "AI System Deployment",
    description:
      "Deploy AI system across EU, China, and US markets with emerging AI regulations.",
    type: "new_regulation",
    targetJurisdictions: ["European Union", "China", "United States"],
    applicableFrameworks: ["EU-AI-ACT", "NIST-AI-RMF", "CHINA-AI"],
    complianceBurden: "high",
  },
  {
    id: "scenario-merger-across",
    name: "Cross-Border Merger",
    description:
      "Merger between entities in Saudi Arabia, UAE, and Singapore requiring combined compliance.",
    type: "merger",
    targetJurisdictions: ["Saudi Arabia", "United Arab Emirates", "Singapore"],
    applicableFrameworks: ["PDPL-KSA", "NCA-ECC", "UAE-PDPL", "PDPA-SG"],
    complianceBurden: "very_high",
  },
];

// ─── Deterministic Engine Constants ───────────────────────────────────────────

const BASE_SCORES: Record<string, number> = {
  "NIST-CSF-2": 68,
  "NIST-SP-800-53": 70,
  "NIST-AI-RMF": 50,
  GDPR: 72,
  "UK-GDPR": 70,
  CCPA: 55,
  PIPL: 45,
  "PDPL-KSA": 40,
  LGPD: 50,
  "ISO-27001": 78,
  "ISO-27701": 72,
  "ISO-42001": 45,
  "ISO-22301": 65,
  "ISO-31000": 60,
  SOC2: 65,
  HIPAA: 60,
  SOX: 55,
  "PCI-DSS": 58,
  "NCA-ECC": 42,
  "NCA-CCC": 40,
  "EU-AI-ACT": 35,
  NIS2: 48,
  DORA: 52,
  "PDPA-SG": 52,
  "UAE-PDPL": 38,
  MLPS2: 30,
  "CHINA-AI": 28,
  FedRAMP: 55,
  "CSA-CCM": 58,
};

const INDUSTRY_MODIFIERS: Record<string, number> = {
  "Financial Services": 5,
  Healthcare: 3,
  Technology: -2,
  Government: 0,
  Retail: 0,
  Manufacturing: -1,
  Education: -2,
  Energy: 1,
  Telecommunications: -1,
  "Critical Infrastructure": 2,
  Defense: 3,
};

const SIZE_MODIFIERS: Record<string, number> = {
  enterprise: 5,
  sme: -3,
  startup: -5,
};

const GAP_PROBABILITIES: Record<string, Record<string, number>> = {
  GDPR: {
    "United States": 0.7,
    China: 0.75,
    "Saudi Arabia": 0.6,
    "United Arab Emirates": 0.55,
    India: 0.6,
    Brazil: 0.4,
    "European Union": 0.2,
  },
  CCPA: {
    "European Union": 0.65,
    China: 0.7,
    "Saudi Arabia": 0.5,
    "United States": 0.3,
    Brazil: 0.45,
  },
  "NIST-CSF-2": {
    "European Union": 0.3,
    China: 0.5,
    "Saudi Arabia": 0.4,
    Brazil: 0.35,
    "United States": 0.25,
  },
  "PDPL-KSA": {
    "European Union": 0.55,
    China: 0.7,
    "United States": 0.5,
    "United Arab Emirates": 0.3,
    "Saudi Arabia": 0.2,
    Brazil: 0.5,
  },
  PIPL: {
    "European Union": 0.75,
    "United States": 0.7,
    "Saudi Arabia": 0.65,
    India: 0.4,
    China: 0.25,
    Brazil: 0.6,
  },
  LGPD: {
    "European Union": 0.35,
    "United States": 0.45,
    China: 0.5,
    Brazil: 0.2,
  },
  "ISO-27001": {
    China: 0.4,
    "Saudi Arabia": 0.25,
    "European Union": 0.15,
    "United States": 0.2,
    Brazil: 0.2,
  },
};

const CROSS_BORDER_CONFLICTS: Array<{
  fw1: string;
  fw2: string;
  conflictScore: number;
  description: string;
  mitigation: string;
}> = [
  {
    fw1: "GDPR",
    fw2: "PIPL",
    conflictScore: 85,
    description:
      "GDPR Art. 44-49 cross-border transfer rules conflict with China PIPL data localization and cross-border security assessment requirements.",
    mitigation:
      "Establish separate data silos for EU and China data; implement Binding Corporate Rules for intra-group transfers; conduct PIPL security assessments for cross-border data flows.",
  },
  {
    fw1: "GDPR",
    fw2: "CCPA",
    conflictScore: 60,
    description:
      "GDPR requires explicit consent (Art. 7) while CCPA uses opt-out model; different definitions of 'sale' of personal information.",
    mitigation:
      "Adopt GDPR consent standard globally as higher bar; implement separate CCPA opt-out mechanism for California consumers; map data processing activities per jurisdiction.",
  },
  {
    fw1: "PDPL-KSA",
    fw2: "GDPR",
    conflictScore: 55,
    description:
      "PDPL data localization requirements conflict with GDPR free flow of data; different consent withdrawal mechanisms.",
    mitigation:
      "Deploy in-region data hosting for KSA data; maintain GDPR-compliant cross-border transfer agreements for EU data; document lawful bases per jurisdiction.",
  },
  {
    fw1: "PDPL-KSA",
    fw2: "PIPL",
    conflictScore: 70,
    description:
      "Both frameworks mandate strict data localization; conflicting requirements for cross-border data transfer assessments.",
    mitigation:
      "Maintain fully separate data infrastructure for KSA and China; engage local counsel for each jurisdiction's transfer mechanism; implement data classification by nationality.",
  },
  {
    fw1: "GDPR",
    fw2: "LGPD",
    conflictScore: 25,
    description:
      "Generally aligned consent and rights frameworks; minor differences in DPO appointment and breach notification timelines.",
    mitigation:
      "Align LGPD program with existing GDPR compliance; adjust breach notification timeline to 72 hours (GDPR) as common standard; appoint single DPO covering both.",
  },
  {
    fw1: "NIST-CSF-2",
    fw2: "ISO-27001",
    conflictScore: 10,
    description:
      "Highly complementary frameworks; NIST CSF provides risk-based guidance while ISO 27001 provides certifiable ISMS standard.",
    mitigation:
      "Map NIST CSF categories to ISO 27001 Annex A controls; use ISO 27001 certification as evidence for NIST CSF Tier 3+ maturity.",
  },
  {
    fw1: "CCPA",
    fw2: "LGPD",
    conflictScore: 35,
    description:
      "CCPA opt-out model vs LGPD consent requirement; different definitions of sensitive data and processing grounds.",
    mitigation:
      "Align to GDPR as intermediary standard; implement opt-out mechanisms for US consumers while maintaining LGPD consent basis for Brazilian data subjects.",
  },
  {
    fw1: "CCPA",
    fw2: "PDPL-KSA",
    conflictScore: 50,
    description:
      "CCPA sectoral approach vs PDPL-KSA comprehensive law; different data subject rights frameworks and transfer restriction models.",
    mitigation:
      "Implement comprehensive privacy program covering both US state-level and KSA requirements; maintain separate processing records per jurisdiction.",
  },
  {
    fw1: "LGPD",
    fw2: "PDPL-KSA",
    conflictScore: 40,
    description:
      "Both require DPO appointment and data transfer impact assessments but with differing scope and enforcement regimes.",
    mitigation:
      "Unified DPO role covering both jurisdictions; implement TIA framework that satisfies both LGPD and PDPL-KSA requirements.",
  },
  {
    fw1: "GDPR",
    fw2: "NIS2",
    conflictScore: 20,
    description:
      "GDPR covers personal data while NIS2 covers security of network and information systems; complementary obligations for incident reporting.",
    mitigation:
      "Integrate incident response plans for both regulations; unify breach notification workflows with 24h (NIS2) and 72h (GDPR) timelines.",
  },
  {
    fw1: "PIPL",
    fw2: "MLPS-2",
    conflictScore: 15,
    description:
      "Both Chinese regulations; PIPL governs personal data while MLPS 2.0 governs information system security classification.",
    mitigation:
      "Implement unified data security program covering both; map personal data flows to MLPS 2.0 security protection levels.",
  },
];

// ─── Seeded Variance (deterministic substitute for Math.random) ───────────────

function seededMod(hashInput: string, min: number, max: number): number {
  let hash = 0;
  for (let i = 0; i < hashInput.length; i++) {
    hash = ((hash << 5) - hash + hashInput.charCodeAt(i)) | 0;
  }
  const normalized = Math.abs(hash) / 0x7fffffff;
  return min + Math.floor(normalized * (max - min + 1));
}

// ─── Engine Core ──────────────────────────────────────────────────────────────

function calcMaturityScores(
  frameworks: string[],
  industry: string | undefined,
  organizationSize: string | undefined
): Record<string, number> {
  const scores: Record<string, number> = {};
  const industryMod = INDUSTRY_MODIFIERS[industry ?? ""] ?? 0;
  const sizeMod = SIZE_MODIFIERS[organizationSize ?? ""] ?? 0;

  for (const fw of frameworks) {
    const base = BASE_SCORES[fw] ?? 45;
    const complexityPenalty = Math.max(0, (frameworks.length - 1) * 3);
    const variance = seededMod(
      fw + (industry ?? "") + (organizationSize ?? ""),
      -5,
      5
    );
    const raw = base + industryMod + sizeMod - complexityPenalty + variance;
    scores[fw] = Math.max(10, Math.min(100, Math.round(raw)));
  }

  return scores;
}

function calcGapCounts(
  frameworks: string[],
  jurisdiction: string,
  industry: string | undefined
): Record<string, number> {
  const counts: Record<string, number> = {};
  const industryGapMod = INDUSTRY_MODIFIERS[industry ?? ""] ?? 0;

  for (const fw of frameworks) {
    const baseGaps = 5;
    const base = BASE_SCORES[fw] ?? 45;
    const regionProb =
      GAP_PROBABILITIES[fw]?.[jurisdiction] ??
      GAP_PROBABILITIES[fw]?.[
        Object.keys(GAP_PROBABILITIES[fw] ?? {}).find(
          k =>
            jurisdiction.toLowerCase().includes(k.toLowerCase()) ||
            k.toLowerCase().includes(jurisdiction.toLowerCase())
        ) ?? ""
      ] ??
      0.3;
    const industryEffect = Math.max(
      -2,
      Math.min(2, Math.round(industryGapMod / 2))
    );
    const frameworkComplexity = Math.max(1, Math.round((100 - base) / 10));
    const variance = seededMod(fw + jurisdiction + (industry ?? ""), -2, 2);
    const raw =
      Math.round(baseGaps * regionProb * frameworkComplexity) +
      industryEffect +
      variance;
    counts[fw] = Math.max(0, raw);
  }

  return counts;
}

function calcTotalGaps(gapCounts: Record<string, number>): number {
  return Object.values(gapCounts).reduce((sum, c) => sum + c, 0);
}

function calcRiskLevel(
  maturityScores: Record<string, number>,
  totalGaps: number,
  frameworksCount: number
): SimulationRisk {
  const avgScore =
    Object.values(maturityScores).reduce((s, v) => s + v, 0) /
    Math.max(1, Object.keys(maturityScores).length);
  const gapsPerFramework = totalGaps / Math.max(1, frameworksCount);

  if (avgScore < 30 || gapsPerFramework > 12) return "critical";
  if (avgScore < 50 || gapsPerFramework > 8) return "high";
  if (avgScore < 70 || gapsPerFramework > 4) return "medium";
  return "low";
}

function estimateCost(
  frameworks: string[],
  organizationSize: string | undefined,
  totalGaps: number
): { low: number; high: number; currency: string } {
  let low = 0;
  let high = 0;

  for (const fw of frameworks) {
    const base = BASE_SCORES[fw] ?? 45;
    if (base >= 70) {
      low += 50;
      high += 100;
    } else if (base >= 50) {
      low += 100;
      high += 250;
    } else {
      low += 250;
      high += 500;
    }
  }

  const sizeMultiplier =
    organizationSize === "enterprise"
      ? 1.5
      : organizationSize === "sme"
        ? 0.8
        : 0.5;
  const gapMultiplier = 1 + totalGaps * 0.02;

  low = Math.round(low * sizeMultiplier * gapMultiplier);
  high = Math.round(high * sizeMultiplier * gapMultiplier);

  return { low, high, currency: "USD" };
}

function detectCrossBorderIssues(frameworks: string[]): CrossBorderIssue[] {
  const issues: CrossBorderIssue[] = [];
  const fwSet = new Set(frameworks.map(f => f.toUpperCase()));

  for (const conflict of CROSS_BORDER_CONFLICTS) {
    if (
      fwSet.has(conflict.fw1.toUpperCase()) &&
      fwSet.has(conflict.fw2.toUpperCase())
    ) {
      issues.push({
        frameworks: [conflict.fw1, conflict.fw2],
        conflictScore: conflict.conflictScore,
        description: conflict.description,
        mitigation: conflict.mitigation,
      });
    }
  }

  return issues;
}

function generateSummary(
  simulationType: SimulationType,
  frameworks: string[],
  maturityScores: Record<string, number>,
  totalGaps: number,
  riskLevel: SimulationRisk,
  crossBorderIssues: CrossBorderIssue[]
): string {
  const avgMaturity = Math.round(
    Object.values(maturityScores).reduce((s, v) => s + v, 0) /
      Math.max(1, Object.keys(maturityScores).length)
  );
  const parts: string[] = [];

  if (simulationType === "readiness" || simulationType === "full") {
    parts.push(
      `Overall compliance readiness across ${frameworks.length} framework(s): ${avgMaturity}/100.`
    );
  }
  if (simulationType === "gap_analysis" || simulationType === "full") {
    parts.push(`Identified ${totalGaps} potential compliance gap(s).`);
  }
  if (simulationType === "cost_estimate" || simulationType === "full") {
    parts.push(`Risk level assessed as "${riskLevel}".`);
  }
  if (simulationType === "cross_border" || simulationType === "full") {
    if (crossBorderIssues.length > 0) {
      parts.push(
        `Detected ${crossBorderIssues.length} cross-border conflict(s) requiring remediation.`
      );
    } else {
      parts.push("No significant cross-border conflicts detected.");
    }
  }

  return (
    parts.join(" ") ||
    `Compliance simulation completed for ${frameworks.length} framework(s).`
  );
}

// ─── In-memory fallback ───────────────────────────────────────────────────────

interface MemRecord {
  id: number;
  organizationId: number;
  name: string;
  description: string | null;
  simulationType: SimulationType;
  jurisdiction: string;
  frameworks: string[];
  maturityScores: Record<string, number>;
  gapCounts: Record<string, number>;
  totalGaps: number;
  costEstimateLow: number | null;
  costEstimateHigh: number | null;
  costEstimateCurrency: string;
  riskLevel: SimulationRisk;
  status: SimulationStatus;
  summary: string | null;
  crossBorderIssues: CrossBorderIssue[];
  createdByUserId: number | null;
  createdAt: Date;
  updatedAt: Date;
}

const MEM_SIMULATIONS: MemRecord[] = [];
let memSimSeq = 1;

// ─── Public Store Functions ───────────────────────────────────────────────────

export function listSimulationScenarios(): SimulationScenario[] {
  return SCENARIOS;
}

export function getSimulationScenarioById(
  id: string
): SimulationScenario | null {
  return SCENARIOS.find(s => s.id === id) ?? null;
}

export function runSimulation(scenarioId: string): SimulationResult | null {
  const scenario = getSimulationScenarioById(scenarioId);
  if (!scenario) return null;
  return generateSimulationResult(scenario);
}

export function runCustomSimulation(input: {
  name: string;
  jurisdictions: string[];
  frameworks: string[];
}): SimulationResult {
  const scenario: SimulationScenario = {
    id: "custom",
    name: input.name,
    description: "Custom compliance simulation",
    type: "custom",
    targetJurisdictions: input.jurisdictions,
    applicableFrameworks: input.frameworks,
    complianceBurden:
      input.jurisdictions.length > 3
        ? "very_high"
        : input.jurisdictions.length > 1
          ? "high"
          : "medium",
  };
  return generateSimulationResult(scenario);
}

function generateSimulationResult(
  scenario: SimulationScenario
): SimulationResult {
  const jurisdictions = scenario.targetJurisdictions;
  const frameworks = scenario.applicableFrameworks;

  const byJurisdiction = jurisdictions.map(j => {
    const scores = calcMaturityScores(frameworks, undefined, undefined);
    const gaps = calcGapCounts(frameworks, j, undefined);
    const avgReadiness = Math.round(
      Object.values(scores).reduce((s, v) => s + v, 0) /
        Math.max(1, Object.keys(scores).length)
    );
    const totalGaps = Object.values(gaps).reduce((s, v) => s + v, 0);
    const effortMonths = seededMod(j + scenario.id, 2, 6);

    return {
      jurisdiction: j,
      readiness: avgReadiness,
      gaps: totalGaps,
      keyObligations: frameworks.slice(0, 3),
      estimatedEffort: `${effortMonths}-${effortMonths + seededMod(j, 2, 4)} months`,
    };
  });

  const totalGaps = byJurisdiction.reduce((s, j) => s + j.gaps, 0);
  const overallReadiness = Math.round(
    byJurisdiction.reduce((s, j) => s + j.readiness, 0) /
      Math.max(1, byJurisdiction.length)
  );
  const criticalGaps = Math.max(1, Math.round(totalGaps * 0.25));

  const costLow = seededMod(scenario.id, 200, 500);
  const costHigh = costLow + seededMod(scenario.id + "h", 300, 800);

  return {
    scenarioId: scenario.id,
    summary: `Compliance simulation for "${scenario.name}" across ${jurisdictions.length} jurisdiction(s). ${totalGaps} potential gaps identified.`,
    overallReadiness,
    byJurisdiction,
    totalGaps,
    criticalGaps,
    recommendedTimeline: `${jurisdictions.length * 3}-${jurisdictions.length * 6} months`,
    estimatedCost: `$${costLow}K - $${costHigh}K`,
    aiRecommendation: `Based on analysis, prioritise ${jurisdictions[0] ?? "primary jurisdiction"} compliance first. The ${frameworks[0] ?? "primary framework"} presents the highest obligation density.${jurisdictions.length > 1 ? " Consider engaging local counsel for cross-border data transfer mechanisms." : ""}`,
  };
}

// ─── Engine API (new) ─────────────────────────────────────────────────────────

export async function runSimulationEngine(
  orgId: number,
  params: SimulationEngineParams,
  userId: number | null
): Promise<SimulationEngineResult> {
  const maturityScores = calcMaturityScores(
    params.frameworks,
    params.industry,
    params.organizationSize
  );
  const gapCounts = calcGapCounts(
    params.frameworks,
    params.jurisdiction,
    params.industry
  );
  const totalGaps = calcTotalGaps(gapCounts);
  const costEstimate = estimateCost(
    params.frameworks,
    params.organizationSize,
    totalGaps
  );
  const riskLevel = calcRiskLevel(
    maturityScores,
    totalGaps,
    params.frameworks.length
  );
  const crossBorderIssues = detectCrossBorderIssues(params.frameworks);
  const summary = generateSummary(
    params.simulationType,
    params.frameworks,
    maturityScores,
    totalGaps,
    riskLevel,
    crossBorderIssues
  );
  const now = new Date();

  const db = await getDb();
  if (db && orgId > 0) {
    const [inserted] = await db
      .insert(complianceSimulations)
      .values({
        organizationId: orgId,
        name: params.name,
        description: params.description ?? null,
        simulationType: params.simulationType,
        jurisdiction: params.jurisdiction,
        frameworks: JSON.stringify(params.frameworks),
        maturityScores: JSON.stringify(maturityScores),
        gapCounts: JSON.stringify(gapCounts),
        totalGaps,
        costEstimateLow: costEstimate.low,
        costEstimateHigh: costEstimate.high,
        costEstimateCurrency: costEstimate.currency,
        riskLevel,
        status: "completed",
        summary,
        createdByUserId: userId,
      })
      .returning({ id: complianceSimulations.id });

    const [row] = await db
      .select()
      .from(complianceSimulations)
      .where(eq(complianceSimulations.id, inserted.id))
      .limit(1);

    return {
      id: row.id,
      organizationId: row.organizationId,
      name: row.name,
      description: row.description,
      simulationType: row.simulationType as SimulationType,
      jurisdiction: row.jurisdiction,
      frameworks: JSON.parse(row.frameworks),
      maturityScores: JSON.parse(row.maturityScores),
      gapCounts: JSON.parse(row.gapCounts),
      totalGaps: row.totalGaps,
      costEstimateLow: row.costEstimateLow,
      costEstimateHigh: row.costEstimateHigh,
      costEstimateCurrency: row.costEstimateCurrency,
      riskLevel: row.riskLevel as SimulationRisk,
      status: row.status as SimulationStatus,
      summary: row.summary,
      crossBorderIssues,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  const memRecord: MemRecord = {
    id: memSimSeq++,
    organizationId: orgId,
    name: params.name,
    description: params.description ?? null,
    simulationType: params.simulationType,
    jurisdiction: params.jurisdiction,
    frameworks: params.frameworks,
    maturityScores,
    gapCounts,
    totalGaps,
    costEstimateLow: costEstimate.low,
    costEstimateHigh: costEstimate.high,
    costEstimateCurrency: costEstimate.currency,
    riskLevel,
    status: "completed",
    summary,
    crossBorderIssues,
    createdByUserId: userId,
    createdAt: now,
    updatedAt: now,
  };
  MEM_SIMULATIONS.push(memRecord);

  return {
    ...memRecord,
    crossBorderIssues,
  };
}

export async function getSimulationHistory(
  orgId: number
): Promise<SimulationEngineResult[]> {
  const db = await getDb();
  if (db && orgId > 0) {
    const rows = await db
      .select()
      .from(complianceSimulations)
      .where(
        and(
          eq(complianceSimulations.organizationId, orgId),
          inArray(complianceSimulations.status, ["completed", "draft"])
        )
      )
      .orderBy(desc(complianceSimulations.createdAt));

    return rows.map(r => {
      const frameworks: string[] = JSON.parse(r.frameworks);
      return {
        id: r.id,
        organizationId: r.organizationId,
        name: r.name,
        description: r.description,
        simulationType: r.simulationType as SimulationType,
        jurisdiction: r.jurisdiction,
        frameworks,
        maturityScores: JSON.parse(r.maturityScores),
        gapCounts: JSON.parse(r.gapCounts),
        totalGaps: r.totalGaps,
        costEstimateLow: r.costEstimateLow,
        costEstimateHigh: r.costEstimateHigh,
        costEstimateCurrency: r.costEstimateCurrency,
        riskLevel: r.riskLevel as SimulationRisk,
        status: r.status as SimulationStatus,
        summary: r.summary,
        crossBorderIssues: detectCrossBorderIssues(frameworks),
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      };
    });
  }

  return MEM_SIMULATIONS.filter(
    r =>
      r.organizationId === orgId &&
      (r.status === "completed" || r.status === "draft")
  )
    .map(r => ({
      ...r,
      crossBorderIssues: detectCrossBorderIssues(r.frameworks),
    }))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function getSimulationById(
  orgId: number,
  id: number
): Promise<SimulationEngineResult | null> {
  const db = await getDb();
  if (db && orgId > 0) {
    const [row] = await db
      .select()
      .from(complianceSimulations)
      .where(
        and(
          eq(complianceSimulations.id, id),
          eq(complianceSimulations.organizationId, orgId)
        )
      )
      .limit(1);
    if (!row) return null;
    const frameworks: string[] = JSON.parse(row.frameworks);
    return {
      id: row.id,
      organizationId: row.organizationId,
      name: row.name,
      description: row.description,
      simulationType: row.simulationType as SimulationType,
      jurisdiction: row.jurisdiction,
      frameworks,
      maturityScores: JSON.parse(row.maturityScores),
      gapCounts: JSON.parse(row.gapCounts),
      totalGaps: row.totalGaps,
      costEstimateLow: row.costEstimateLow,
      costEstimateHigh: row.costEstimateHigh,
      costEstimateCurrency: row.costEstimateCurrency,
      riskLevel: row.riskLevel as SimulationRisk,
      status: row.status as SimulationStatus,
      summary: row.summary,
      crossBorderIssues: detectCrossBorderIssues(frameworks),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  const mem = MEM_SIMULATIONS.find(
    r => r.id === id && r.organizationId === orgId
  );
  if (!mem) return null;
  return { ...mem, crossBorderIssues: detectCrossBorderIssues(mem.frameworks) };
}

export async function archiveSimulation(
  orgId: number,
  id: number
): Promise<boolean> {
  const db = await getDb();
  if (db && orgId > 0) {
    const [existing] = await db
      .select({ id: complianceSimulations.id })
      .from(complianceSimulations)
      .where(
        and(
          eq(complianceSimulations.id, id),
          eq(complianceSimulations.organizationId, orgId)
        )
      )
      .limit(1);
    if (!existing) return false;
    await db
      .update(complianceSimulations)
      .set({ status: "archived", updatedAt: new Date() })
      .where(eq(complianceSimulations.id, id));
    return true;
  }

  const mem = MEM_SIMULATIONS.find(
    r => r.id === id && r.organizationId === orgId
  );
  if (!mem) return false;
  mem.status = "archived";
  mem.updatedAt = new Date();
  return true;
}

export async function compareSimulations(
  orgId: number,
  id1: number,
  id2: number
): Promise<SimulationComparison | null> {
  const [sim1, sim2] = await Promise.all([
    getSimulationById(orgId, id1),
    getSimulationById(orgId, id2),
  ]);

  if (!sim1 || !sim2) return null;

  const allFrameworks = [
    ...new Set([
      ...Object.keys(sim1.maturityScores),
      ...Object.keys(sim2.maturityScores),
    ]),
  ];

  const scoreDeltas = allFrameworks.map(fw => ({
    framework: fw,
    score1: sim1.maturityScores[fw] ?? 0,
    score2: sim2.maturityScores[fw] ?? 0,
    delta: (sim2.maturityScores[fw] ?? 0) - (sim1.maturityScores[fw] ?? 0),
  }));

  const gapDeltas = allFrameworks.map(fw => ({
    framework: fw,
    gaps1: sim1.gapCounts[fw] ?? 0,
    gaps2: sim2.gapCounts[fw] ?? 0,
    delta: (sim2.gapCounts[fw] ?? 0) - (sim1.gapCounts[fw] ?? 0),
  }));

  const costDelta = {
    low: (sim2.costEstimateLow ?? 0) - (sim1.costEstimateLow ?? 0),
    high: (sim2.costEstimateHigh ?? 0) - (sim1.costEstimateHigh ?? 0),
  };

  const riskRank: Record<SimulationRisk, number> = {
    low: 0,
    medium: 1,
    high: 2,
    critical: 3,
  };
  const riskDeltaVal = riskRank[sim2.riskLevel] - riskRank[sim1.riskLevel];
  let riskDelta: string;
  if (riskDeltaVal > 0) riskDelta = "worsened";
  else if (riskDeltaVal < 0) riskDelta = "improved";
  else riskDelta = "unchanged";

  const avgScore1 =
    Object.values(sim1.maturityScores).reduce((s, v) => s + v, 0) /
    Math.max(1, Object.keys(sim1.maturityScores).length);
  const avgScore2 =
    Object.values(sim2.maturityScores).reduce((s, v) => s + v, 0) /
    Math.max(1, Object.keys(sim2.maturityScores).length);

  let recommendation: string;
  if (avgScore2 > avgScore1 && sim2.totalGaps < sim1.totalGaps) {
    recommendation = `${sim2.name} shows improvement over ${sim1.name}. The configuration in ${sim2.name} yields better compliance posture.`;
  } else if (avgScore2 < avgScore1 && sim2.totalGaps > sim1.totalGaps) {
    recommendation = `${sim1.name} has a stronger compliance posture than ${sim2.name}. Review the parameters in ${sim2.name} for potential risk factors.`;
  } else {
    recommendation = `Both simulations show comparable compliance postures. Key differences are in specific framework scores and cost estimates.`;
  }

  return {
    simulation1: sim1,
    simulation2: sim2,
    scoreDeltas,
    gapDeltas,
    costDelta,
    riskDelta,
    recommendation,
  };
}
