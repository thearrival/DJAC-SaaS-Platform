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

const SCENARIOS: SimulationScenario[] = [
  {
    id: "scenario-expand-saudi",
    name: "Market Entry: Saudi Arabia",
    description:
      "Expand operations into Saudi Arabia with full PDPL and NCA ECC compliance.",
    type: "expansion",
    targetJurisdictions: ["Saudi Arabia"],
    applicableFrameworks: ["PDPL-KSA", "NCA-ECC"],
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

function generateSimulationResult(
  scenario: SimulationScenario
): SimulationResult {
  const gapsPerJurisdiction = scenario.targetJurisdictions.map(j => ({
    jurisdiction: j,
    readiness: Math.floor(Math.random() * 40) + 30,
    gaps: Math.floor(Math.random() * 12) + 3,
    keyObligations: scenario.applicableFrameworks.slice(0, 3),
    estimatedEffort: `${Math.floor(Math.random() * 8) + 2}-${Math.floor(Math.random() * 6) + 8} months`,
  }));

  const totalGaps = gapsPerJurisdiction.reduce((s, j) => s + j.gaps, 0);
  const criticalGaps = Math.floor(totalGaps * 0.3);

  return {
    scenarioId: scenario.id,
    summary: `Compliance simulation for "${scenario.name}" across ${scenario.targetJurisdictions.length} jurisdictions. ${totalGaps} potential gaps identified.`,
    overallReadiness: Math.floor(
      gapsPerJurisdiction.reduce((s, j) => s + j.readiness, 0) /
        gapsPerJurisdiction.length
    ),
    byJurisdiction: gapsPerJurisdiction,
    totalGaps,
    criticalGaps,
    recommendedTimeline: `${Math.floor(scenario.targetJurisdictions.length * 3)}-${Math.floor(scenario.targetJurisdictions.length * 6)} months`,
    estimatedCost: `$${Math.floor(Math.random() * 500) + 200}K - $${Math.floor(Math.random() * 800) + 500}K`,
    aiRecommendation: `Based on analysis, prioritise ${scenario.targetJurisdictions[0] ?? "primary jurisdiction"} compliance first. The ${scenario.applicableFrameworks[0] ?? "primary framework"} presents the highest obligation density. Consider engaging local counsel for ${scenario.targetJurisdictions.length > 1 ? "cross-border data transfer mechanisms" : "data protection officer registration"}.`,
  };
}

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
