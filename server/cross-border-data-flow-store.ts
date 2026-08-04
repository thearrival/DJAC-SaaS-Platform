export type FlowRoute = {
  sourceJurisdiction: string;
  targetJurisdiction: string;
  dataCategories: string[];
  transferMechanism: string;
  riskLevel: "low" | "medium" | "high" | "critical";
  restrictions: string[];
  requirements: string[];
  estimatedComplianceCost: string;
};

const JURISDICTION_REQUIREMENTS: Record<
  string,
  {
    adequacyDecisions: string[];
    sccAllowed: boolean;
    bcrAllowed: boolean;
    consentRequired: boolean;
    localRepresentative: boolean;
    dataLocalization: boolean;
    transferImpactAssessment: boolean;
  }
> = {
  EU: {
    adequacyDecisions: ["UK", "Argentina", "Japan", "South Korea", "Canada"],
    sccAllowed: true,
    bcrAllowed: true,
    consentRequired: false,
    localRepresentative: true,
    dataLocalization: false,
    transferImpactAssessment: true,
  },
  China: {
    adequacyDecisions: [],
    sccAllowed: true,
    bcrAllowed: false,
    consentRequired: true,
    localRepresentative: false,
    dataLocalization: true,
    transferImpactAssessment: true,
  },
  "Saudi Arabia": {
    adequacyDecisions: [],
    sccAllowed: true,
    bcrAllowed: false,
    consentRequired: true,
    localRepresentative: true,
    dataLocalization: true,
    transferImpactAssessment: true,
  },
  US: {
    adequacyDecisions: [],
    sccAllowed: false,
    bcrAllowed: false,
    consentRequired: true,
    localRepresentative: false,
    dataLocalization: false,
    transferImpactAssessment: false,
  },
  "United Arab Emirates": {
    adequacyDecisions: [],
    sccAllowed: true,
    bcrAllowed: false,
    consentRequired: true,
    localRepresentative: true,
    dataLocalization: false,
    transferImpactAssessment: true,
  },
  Singapore: {
    adequacyDecisions: [],
    sccAllowed: true,
    bcrAllowed: false,
    consentRequired: false,
    localRepresentative: false,
    dataLocalization: false,
    transferImpactAssessment: false,
  },
  Brazil: {
    adequacyDecisions: ["EU", "Argentina"],
    sccAllowed: true,
    bcrAllowed: true,
    consentRequired: false,
    localRepresentative: true,
    dataLocalization: false,
    transferImpactAssessment: true,
  },
  India: {
    adequacyDecisions: [],
    sccAllowed: true,
    bcrAllowed: false,
    consentRequired: true,
    localRepresentative: true,
    dataLocalization: true,
    transferImpactAssessment: true,
  },
  "United Kingdom": {
    adequacyDecisions: [
      "EU",
      "EEA",
      "Argentina",
      "Japan",
      "South Korea",
      "Canada",
      "Australia",
      "Singapore",
    ],
    sccAllowed: true,
    bcrAllowed: true,
    consentRequired: false,
    localRepresentative: true,
    dataLocalization: false,
    transferImpactAssessment: true,
  },
  Canada: {
    adequacyDecisions: ["EU", "UK"],
    sccAllowed: true,
    bcrAllowed: false,
    consentRequired: true,
    localRepresentative: false,
    dataLocalization: false,
    transferImpactAssessment: false,
  },
  Australia: {
    adequacyDecisions: ["EU", "UK"],
    sccAllowed: true,
    bcrAllowed: false,
    consentRequired: true,
    localRepresentative: false,
    dataLocalization: false,
    transferImpactAssessment: true,
  },
  Japan: {
    adequacyDecisions: ["EU", "UK"],
    sccAllowed: true,
    bcrAllowed: false,
    consentRequired: true,
    localRepresentative: false,
    dataLocalization: false,
    transferImpactAssessment: true,
  },
  "South Korea": {
    adequacyDecisions: ["EU", "UK"],
    sccAllowed: true,
    bcrAllowed: false,
    consentRequired: true,
    localRepresentative: false,
    dataLocalization: false,
    transferImpactAssessment: true,
  },
  "South Africa": {
    adequacyDecisions: ["EU"],
    sccAllowed: true,
    bcrAllowed: false,
    consentRequired: true,
    localRepresentative: false,
    dataLocalization: false,
    transferImpactAssessment: true,
  },
  Mexico: {
    adequacyDecisions: ["EU"],
    sccAllowed: true,
    bcrAllowed: false,
    consentRequired: true,
    localRepresentative: false,
    dataLocalization: false,
    transferImpactAssessment: false,
  },
  Qatar: {
    adequacyDecisions: [],
    sccAllowed: true,
    bcrAllowed: false,
    consentRequired: true,
    localRepresentative: true,
    dataLocalization: false,
    transferImpactAssessment: true,
  },
  Kuwait: {
    adequacyDecisions: [],
    sccAllowed: false,
    bcrAllowed: false,
    consentRequired: true,
    localRepresentative: false,
    dataLocalization: true,
    transferImpactAssessment: false,
  },
  Bahrain: {
    adequacyDecisions: [],
    sccAllowed: true,
    bcrAllowed: false,
    consentRequired: true,
    localRepresentative: true,
    dataLocalization: false,
    transferImpactAssessment: true,
  },
  Thailand: {
    adequacyDecisions: [],
    sccAllowed: true,
    bcrAllowed: false,
    consentRequired: true,
    localRepresentative: true,
    dataLocalization: false,
    transferImpactAssessment: true,
  },
  Indonesia: {
    adequacyDecisions: [],
    sccAllowed: true,
    bcrAllowed: false,
    consentRequired: true,
    localRepresentative: true,
    dataLocalization: false,
    transferImpactAssessment: true,
  },
  Malaysia: {
    adequacyDecisions: [],
    sccAllowed: true,
    bcrAllowed: false,
    consentRequired: true,
    localRepresentative: false,
    dataLocalization: false,
    transferImpactAssessment: true,
  },
  Philippines: {
    adequacyDecisions: [],
    sccAllowed: true,
    bcrAllowed: false,
    consentRequired: true,
    localRepresentative: true,
    dataLocalization: false,
    transferImpactAssessment: true,
  },
  Vietnam: {
    adequacyDecisions: [],
    sccAllowed: false,
    bcrAllowed: false,
    consentRequired: true,
    localRepresentative: true,
    dataLocalization: true,
    transferImpactAssessment: true,
  },
  Nigeria: {
    adequacyDecisions: [],
    sccAllowed: true,
    bcrAllowed: false,
    consentRequired: true,
    localRepresentative: true,
    dataLocalization: false,
    transferImpactAssessment: true,
  },
  Kenya: {
    adequacyDecisions: [],
    sccAllowed: true,
    bcrAllowed: false,
    consentRequired: true,
    localRepresentative: true,
    dataLocalization: false,
    transferImpactAssessment: false,
  },
  Oman: {
    adequacyDecisions: [],
    sccAllowed: true,
    bcrAllowed: false,
    consentRequired: true,
    localRepresentative: true,
    dataLocalization: false,
    transferImpactAssessment: true,
  },
  Jordan: {
    adequacyDecisions: [],
    sccAllowed: false,
    bcrAllowed: false,
    consentRequired: true,
    localRepresentative: false,
    dataLocalization: false,
    transferImpactAssessment: false,
  },
  Egypt: {
    adequacyDecisions: [],
    sccAllowed: true,
    bcrAllowed: false,
    consentRequired: true,
    localRepresentative: true,
    dataLocalization: false,
    transferImpactAssessment: true,
  },
};

const ALL_JURISDICTIONS = Object.keys(JURISDICTION_REQUIREMENTS);

export function getDataFlowRoutes(
  source: string,
  target: string,
  dataCategories: string[]
): FlowRoute {
  const sourceReq = JURISDICTION_REQUIREMENTS[source];
  const targetReq = JURISDICTION_REQUIREMENTS[target];

  if (!sourceReq || !targetReq) {
    return {
      sourceJurisdiction: source,
      targetJurisdiction: target,
      dataCategories,
      transferMechanism: "Unknown",
      riskLevel: "high",
      restrictions: ["Jurisdiction requirements not found in knowledge base"],
      requirements: ["Consult local legal counsel"],
      estimatedComplianceCost: "TBD",
    };
  }

  const restrictions: string[] = [];
  const requirements: string[] = [];
  let riskLevel: "low" | "medium" | "high" | "critical" = "low";

  if (sourceReq.dataLocalization || targetReq.dataLocalization) {
    restrictions.push("Data localization requirements may block transfer");
    riskLevel = "critical";
  }

  const adequacyExists = sourceReq.adequacyDecisions.some(
    a => target.includes(a) || a.includes(target)
  );

  if (adequacyExists) {
    requirements.push("Adequacy decision available - streamlined transfer");
    riskLevel = riskLevel === "critical" ? "critical" : "low";
  }

  if (sourceReq.sccAllowed) {
    requirements.push("Standard Contractual Clauses (SCCs) permitted");
  } else {
    restrictions.push("SCCs not recognized by the source jurisdiction");
  }

  if (sourceReq.consentRequired) {
    requirements.push("Explicit consent from data subjects required");
  }

  if (sourceReq.transferImpactAssessment) {
    requirements.push("Transfer Impact Assessment (TIA) required");
  }

  if (sourceReq.localRepresentative || targetReq.localRepresentative) {
    requirements.push("Local representative or agent required");
  }

  if (riskLevel === "low" && restrictions.length > 0) {
    riskLevel = "medium";
  }

  const transferMechanism = adequacyExists
    ? "Adequacy Decision"
    : sourceReq.sccAllowed
      ? "Standard Contractual Clauses"
      : "Case-by-case assessment";

  const costMap: Record<string, string> = {
    critical: "$100K - $250K",
    high: "$50K - $100K",
    medium: "$20K - $50K",
    low: "$5K - $20K",
  };

  return {
    sourceJurisdiction: source,
    targetJurisdiction: target,
    dataCategories,
    transferMechanism,
    riskLevel,
    restrictions: [...new Set(restrictions)],
    requirements: [...new Set(requirements)],
    estimatedComplianceCost: costMap[riskLevel] || "$5K - $20K",
  };
}

export function getAllJurisdictions(): string[] {
  return ALL_JURISDICTIONS;
}

export function getJurisdictionRequirements(jurisdiction: string) {
  return JURISDICTION_REQUIREMENTS[jurisdiction] ?? null;
}

export function getCrossBorderMatrix(): {
  source: string;
  target: string;
  riskLevel: string;
  transferMechanism: string;
}[] {
  const matrix: {
    source: string;
    target: string;
    riskLevel: string;
    transferMechanism: string;
  }[] = [];
  for (const source of ALL_JURISDICTIONS) {
    for (const target of ALL_JURISDICTIONS) {
      if (source === target) continue;
      const route = getDataFlowRoutes(source, target, ["personal_data"]);
      matrix.push({
        source,
        target,
        riskLevel: route.riskLevel,
        transferMechanism: route.transferMechanism,
      });
    }
  }
  return matrix;
}
