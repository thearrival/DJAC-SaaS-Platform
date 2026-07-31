import type { Vendor } from "../drizzle/schema";

export type AssessmentSeverity = "critical" | "high" | "medium" | "low";

export type SupplierGap = {
  code: string;
  jurisdiction:
    | "china"
    | "saudi"
    | "eu"
    | "us"
    | "brazil"
    | "cross_border"
    | "global";
  frameworks: string[];
  severity: AssessmentSeverity;
  title: string;
  description: string;
  mitigation: string;
  penaltyContext: string;
};

export type SupplierAssessmentResult = {
  vendorId: number;
  generatedAt: string;
  overallScore: number;
  jurisdictionScores: {
    china: number;
    saudiArabia: number;
    eu: number;
    us: number;
    brazil: number;
    global: number;
  };
  status: "compliant" | "partial" | "non_compliant";
  riskLevel: "low" | "medium" | "high" | "critical";
  gaps: SupplierGap[];
  recommendations: string[];
};

const PENALTY_CONTEXT: Record<string, string> = {
  PIPL: "PIPL penalties can reach up to 5% annual turnover.",
  CSL: "CSL enforcement can include operational restrictions and fines.",
  DSL: "DSL violations can trigger major fines and business sanctions.",
  PDPL: "PDPL penalties can reach up to SAR 5M.",
  NCA: "NCA non-compliance can impact licensing and critical contracts.",
  GDPR: "GDPR fines can reach up to €20M or 4% of annual global turnover.",
  CCPA: "CCPA violations can incur fines of up to $7,500 per intentional violation.",
  HIPAA:
    "HIPAA penalties can reach up to $1.5M per violation category per year.",
  SOX: "SOX non-compliance can result in fines up to $5M and executives face criminal penalties.",
  LGPD: "LGPD penalties can reach up to 2% of revenue in Brazil (capped at R$50M per violation).",
  "ISO 27001":
    "ISO 27001 certification demonstrates internationally recognized ISMS controls.",
  "ISO 27701":
    "ISO 27701 provides a privacy extension to ISO 27001 for PII management.",
  "SOC 2":
    "SOC 2 reports provide independent assurance of security, availability, and confidentiality controls.",
  "NIST CSF":
    "NIST CSF provides a comprehensive cybersecurity risk management framework.",
};

function parseList(value: string | null | undefined): string[] {
  if (!value) return [];

  return value
    .split(/[,;|\n]/g)
    .map(token => token.trim().toLowerCase().replace(/[_-]/g, " "))
    .filter(Boolean);
}

function normalizeValue(value: string | null | undefined): string {
  return (value || "").trim().toLowerCase().replace(/[_-]/g, " ");
}

function hasAny(haystack: string[], needles: string[]): boolean {
  return needles.some(needle => haystack.some(item => item.includes(needle)));
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function scoreToStatus(
  score: number
): "compliant" | "partial" | "non_compliant" {
  if (score >= 85) return "compliant";
  if (score >= 65) return "partial";
  return "non_compliant";
}

function inferRiskLevel(
  score: number,
  gaps: SupplierGap[]
): "low" | "medium" | "high" | "critical" {
  const criticalCount = gaps.filter(gap => gap.severity === "critical").length;
  const highCount = gaps.filter(gap => gap.severity === "high").length;

  if (criticalCount > 0) return "critical";
  if (score < 60 || highCount >= 2) return "high";
  if (score < 80 || highCount > 0) return "medium";
  return "low";
}

function makePenaltyContext(frameworks: string[]): string {
  return frameworks
    .map(code => PENALTY_CONTEXT[code])
    .filter(Boolean)
    .join(" ");
}

function dedupe(values: string[]): string[] {
  return Array.from(new Set(values));
}

export function runDualJurisdictionAssessment(
  vendor: Vendor
): SupplierAssessmentResult {
  const locations = parseList(
    vendor.dataLocations || vendor.operatingCountries
  );
  const operatingCountries = parseList(vendor.operatingCountries);
  const jurisdictions = parseList(
    vendor.regulatoryJurisdictions || vendor.operatingCountries
  );
  const certifications = parseList(vendor.certifications);
  const processingActivities = parseList(vendor.dataProcessingActivities);
  const cloudProviders = parseList(vendor.cloudProvider);
  const cloudProvider = normalizeValue(vendor.cloudProvider);
  const hostingEnvironment = normalizeValue(vendor.hostingEnvironment);
  const criticalityLevel = normalizeValue(vendor.criticalityLevel);
  const riskTier = normalizeValue(vendor.riskTier);
  const thirdPartyDependencies = normalizeValue(vendor.thirdPartyDependencies);
  const fourthPartyDependencies = normalizeValue(
    vendor.fourthPartyDependencies
  );

  let chinaScore = 100;
  let saudiScore = 100;
  let euScore = 100;
  let usScore = 100;
  let brazilScore = 100;
  let globalScore = 100;
  const gaps: SupplierGap[] = [];

  const requiresChinaControls =
    hasAny(jurisdictions, ["china"]) ||
    hasAny(operatingCountries, ["china"]) ||
    hasAny(locations, ["china"]);
  const requiresSaudiControls =
    hasAny(jurisdictions, ["saudi", "ksa"]) ||
    hasAny(operatingCountries, ["saudi", "ksa"]) ||
    hasAny(locations, ["saudi", "ksa"]);
  const requiresEUControls =
    hasAny(jurisdictions, ["eu", "europe", "european union", "gdpr"]) ||
    hasAny(operatingCountries, ["eu", "europe", "european union", "gdpr"]) ||
    hasAny(locations, ["eu", "europe", "european union", "gdpr"]);
  const requiresUSControls =
    hasAny(jurisdictions, ["us", "usa", "united states", "america", "ccpa"]) ||
    hasAny(operatingCountries, [
      "us",
      "usa",
      "united states",
      "america",
      "ccpa",
    ]) ||
    hasAny(locations, ["us", "usa", "united states", "america", "ccpa"]);
  const requiresBrazilControls =
    hasAny(jurisdictions, ["brazil", "brasil", "lgpd"]) ||
    hasAny(operatingCountries, ["brazil", "brasil", "lgpd"]) ||
    hasAny(locations, ["brazil", "brasil", "lgpd"]);
  const hasChinaLocation = hasAny(locations, [
    "china",
    "cn",
    "beijing",
    "shanghai",
    "hong kong",
    "hong kong (sar)",
  ]);
  const hasSaudiLocation = hasAny(locations, [
    "saudi",
    "ksa",
    "riyadh",
    "jeddah",
    "dammam",
  ]);
  const hasEULocation = hasAny(locations, [
    "eu",
    "europe",
    "european union",
    "gdpr",
    "berlin",
    "paris",
    "london",
    "frankfurt",
    "dublin",
  ]);
  const hasUSLocation = hasAny(locations, [
    "us",
    "usa",
    "united states",
    "america",
    "ccpa",
    "new york",
    "california",
    "virginia",
  ]);
  const hasBrazilLocation = hasAny(locations, [
    "brazil",
    "brasil",
    "lgpd",
    "sao paulo",
    "rio de janeiro",
    "brasilia",
  ]);
  const hasCrossBorderTransfer = hasAny(processingActivities, [
    "cross border",
    "transfer",
  ]);
  const handlesSensitiveData = hasAny(processingActivities, [
    "customer personal",
    "financial",
    "health",
    "biometric",
    "identity access",
  ]);
  const isHighCriticality = hasAny(
    [criticalityLevel, riskTier],
    ["high", "mission critical", "tier 1", "tier 2"]
  );
  const hasHighDependencyChain = hasAny(
    [thirdPartyDependencies, fourthPartyDependencies],
    ["material", "extensive"]
  );

  if (requiresChinaControls && !hasChinaLocation) {
    chinaScore -= 35;
    gaps.push({
      code: "LOC-CHINA-001",
      jurisdiction: "china",
      frameworks: ["PIPL", "CSL", "DSL"],
      severity: "critical",
      title: "Missing China data localization",
      description:
        "No China data location was declared for personal and critical data processing.",
      mitigation:
        "Implement China-hosted data pipelines and keep regulated datasets in-country.",
      penaltyContext: makePenaltyContext(["PIPL", "CSL", "DSL"]),
    });
  }

  if (requiresSaudiControls && !hasSaudiLocation) {
    saudiScore -= 35;
    gaps.push({
      code: "LOC-SAUDI-001",
      jurisdiction: "saudi",
      frameworks: ["PDPL", "NCA"],
      severity: "critical",
      title: "Missing Saudi data localization",
      description:
        "No Saudi region was declared for in-kingdom data processing obligations.",
      mitigation:
        "Provision in-kingdom data storage and processing paths for Saudi data subjects.",
      penaltyContext: makePenaltyContext(["PDPL", "NCA"]),
    });
  }

  if (requiresEUControls && !hasEULocation) {
    euScore -= 30;
    gaps.push({
      code: "LOC-EU-001",
      jurisdiction: "eu",
      frameworks: ["GDPR"],
      severity: "high",
      title: "Missing EU data residency evidence",
      description:
        "No EU data location was declared for GDPR compliance requirements.",
      mitigation:
        "Provision EU-hosted data storage and processing paths for EU data subjects.",
      penaltyContext: makePenaltyContext(["GDPR"]),
    });
  }

  if (requiresUSControls && !hasUSLocation) {
    usScore -= 25;
    gaps.push({
      code: "LOC-US-001",
      jurisdiction: "us",
      frameworks: ["CCPA"],
      severity: "high",
      title: "Missing US data presence evidence",
      description:
        "No US data location was declared for CCPA/state privacy law compliance.",
      mitigation:
        "Document US-based data processing infrastructure and data subject access mechanisms.",
      penaltyContext: makePenaltyContext(["CCPA"]),
    });
  }

  if (requiresBrazilControls && !hasBrazilLocation) {
    brazilScore -= 25;
    gaps.push({
      code: "LOC-BRAZIL-001",
      jurisdiction: "brazil",
      frameworks: ["LGPD"],
      severity: "high",
      title: "Missing Brazil data presence evidence",
      description:
        "No Brazil data location was declared for LGPD compliance requirements.",
      mitigation:
        "Provision Brazil-based data handling infrastructure and ANPD compliance framework.",
      penaltyContext: makePenaltyContext(["LGPD"]),
    });
  }

  if (
    requiresChinaControls &&
    requiresSaudiControls &&
    hasCrossBorderTransfer &&
    !(hasChinaLocation && hasSaudiLocation)
  ) {
    chinaScore -= 12;
    saudiScore -= 12;
    gaps.push({
      code: "XFER-CROSS-BORDER-001",
      jurisdiction: "cross_border",
      frameworks: ["PIPL", "CSL", "PDPL"],
      severity: "high",
      title:
        "Cross-border transfer controls need stronger localization evidence",
      description:
        "The supplier handles cross-border transfers but did not evidence resilient data locations for both China and Saudi obligations.",
      mitigation:
        "Document transfer pathways, local hosting controls, and jurisdiction-specific export or transfer assessment evidence.",
      penaltyContext: makePenaltyContext(["PIPL", "CSL", "PDPL"]),
    });
  }

  if (processingActivities.length === 0) {
    chinaScore -= 8;
    saudiScore -= 8;
    euScore -= 8;
    usScore -= 8;
    brazilScore -= 8;
    globalScore -= 8;
    gaps.push({
      code: "DATA-MAP-001",
      jurisdiction: "cross_border",
      frameworks: ["PIPL", "PDPL", "NCA"],
      severity: "medium",
      title: "Data processing profile is incomplete",
      description:
        "The supplier profile does not specify which data categories or processing activities are in scope.",
      mitigation:
        "Capture data processing activities, regulated datasets, and transfer patterns before onboarding approval.",
      penaltyContext: makePenaltyContext(["PIPL", "PDPL", "NCA"]),
    });
  }

  const hasIso27001 = hasAny(certifications, ["iso27001", "iso 27001"]);
  if (!hasIso27001) {
    const deduction = isHighCriticality ? 18 : 12;
    chinaScore -= deduction;
    saudiScore -= deduction;
    euScore -= deduction;
    usScore -= deduction;
    brazilScore -= deduction;
    globalScore -= deduction;
    gaps.push({
      code: "CERT-ISO27001-001",
      jurisdiction: "cross_border",
      frameworks: ["CSL", "DSL", "NCA"],
      severity: isHighCriticality ? "critical" : "high",
      title: "Missing ISO 27001 baseline",
      description:
        "The vendor did not provide an ISO 27001 certification indicator.",
      mitigation:
        "Obtain ISO 27001 or provide equivalent evidence of information security controls.",
      penaltyContext: makePenaltyContext(["CSL", "DSL", "NCA"]),
    });
  }

  const hasSoc2 = hasAny(certifications, [
    "soc2",
    "soc 2",
    "soc ii",
    "soc2 type ii",
  ]);
  if (!hasSoc2) {
    const deduction = hasHighDependencyChain ? 12 : 8;
    chinaScore -= deduction;
    saudiScore -= deduction;
    euScore -= deduction;
    usScore -= deduction;
    brazilScore -= deduction;
    globalScore -= deduction;
    gaps.push({
      code: "CERT-SOC2-001",
      jurisdiction: "cross_border",
      frameworks: ["PIPL", "PDPL"],
      severity: hasHighDependencyChain ? "high" : "medium",
      title: "Missing independent control assurance",
      description:
        "SOC 2 Type II or equivalent third-party control attestations were not declared.",
      mitigation:
        "Provide independent control assurance reports for security and privacy controls.",
      penaltyContext: makePenaltyContext(["PIPL", "PDPL"]),
    });
  }

  const hasIso27701 = hasAny(certifications, [
    "iso27701",
    "iso 27701",
    "privacy impact assessment",
  ]);
  if (handlesSensitiveData && !hasIso27701) {
    chinaScore -= 10;
    saudiScore -= 10;
    euScore -= 10;
    usScore -= 10;
    brazilScore -= 10;
    globalScore -= 10;
    gaps.push({
      code: "PRIVACY-PROGRAM-001",
      jurisdiction: "cross_border",
      frameworks: ["PIPL", "PDPL"],
      severity: "high",
      title: "Sensitive data processing lacks privacy assurance evidence",
      description:
        "The supplier processes sensitive or regulated data but did not declare ISO 27701 or equivalent privacy governance evidence.",
      mitigation:
        "Provide privacy impact assessment evidence, privacy governance controls, or ISO 27701-aligned assurance artifacts.",
      penaltyContext: makePenaltyContext(["PIPL", "PDPL"]),
    });
  }

  const hasNcaControls = hasAny(certifications, [
    "nca ecc",
    "nca ccc2",
    "ecc",
    "ccc2",
  ]);
  if (requiresSaudiControls && !hasNcaControls) {
    saudiScore -= 18;
    gaps.push({
      code: "CERT-NCA-001",
      jurisdiction: "saudi",
      frameworks: ["NCA"],
      severity: "high",
      title: "Missing NCA-aligned control evidence",
      description: "NCA ECC/CCC2 control alignment evidence was not provided.",
      mitigation:
        "Map and document controls against NCA ECC and CCC2 requirements.",
      penaltyContext: makePenaltyContext(["NCA"]),
    });
  }

  const hasMlpsEvidence = hasAny(certifications, ["mlps", "mlps 2.0"]);
  if (
    requiresChinaControls &&
    !hasMlpsEvidence &&
    hasAny([vendor.serviceType || ""], ["saas", "iaas", "paas", "colocation"])
  ) {
    chinaScore -= 12;
    gaps.push({
      code: "CERT-MLPS-001",
      jurisdiction: "china",
      frameworks: ["CSL", "MLPS 2.0"],
      severity: "high",
      title: "China control mapping evidence is incomplete",
      description:
        "The supplier operates cloud or hosted services relevant to China but did not declare MLPS-aligned control evidence.",
      mitigation:
        "Map relevant systems and controls to MLPS 2.0 expectations and retain third-party assessment evidence where applicable.",
      penaltyContext: makePenaltyContext(["CSL"]),
    });
  }

  if (
    !cloudProvider &&
    !hasAny([hostingEnvironment], ["on premises", "private cloud"])
  ) {
    chinaScore -= 5;
    saudiScore -= 5;
    euScore -= 5;
    usScore -= 5;
    brazilScore -= 5;
    globalScore -= 5;
    gaps.push({
      code: "CLOUD-INFO-001",
      jurisdiction: "cross_border",
      frameworks: ["CSL", "PDPL"],
      severity: "low",
      title: "Cloud provider not declared",
      description:
        "Cloud provider data was not supplied, reducing architecture traceability.",
      mitigation:
        "Declare cloud provider and region-level architecture for auditability.",
      penaltyContext: makePenaltyContext(["CSL", "PDPL"]),
    });
  }

  if (
    hasAny([hostingEnvironment], ["multi cloud", "hybrid"]) &&
    cloudProviders.length < 2
  ) {
    chinaScore -= 6;
    saudiScore -= 6;
    euScore -= 6;
    usScore -= 6;
    brazilScore -= 6;
    globalScore -= 6;
    gaps.push({
      code: "ARCH-MULTICLOUD-001",
      jurisdiction: "cross_border",
      frameworks: ["CSL", "PDPL", "NCA"],
      severity: "medium",
      title: "Hosting complexity is not fully documented",
      description:
        "The supplier declared a hybrid or multi-cloud model without enough provider-level detail for architecture traceability.",
      mitigation:
        "Document all in-scope providers, regions, and trust boundaries for hybrid or multi-cloud services.",
      penaltyContext: makePenaltyContext(["CSL", "PDPL", "NCA"]),
    });
  }

  if (hasHighDependencyChain && !hasSoc2) {
    saudiScore -= 6;
    chinaScore -= 6;
    euScore -= 6;
    usScore -= 6;
    brazilScore -= 6;
    globalScore -= 6;
    gaps.push({
      code: "SUPPLY-CHAIN-001",
      jurisdiction: "cross_border",
      frameworks: ["NCA", "PDPL", "CSL"],
      severity: "high",
      title: "Dependency chain needs stronger assurance",
      description:
        "Material third-party or fourth-party dependencies were declared without strong independent assurance evidence.",
      mitigation:
        "Obtain subprocessor assurance packs, contract flow-downs, and recurring control attestations for critical dependency chains.",
      penaltyContext: makePenaltyContext(["NCA", "PDPL", "CSL"]),
    });
  }

  if (cloudProvider.includes("alibaba") || cloudProvider.includes("huawei")) {
    chinaScore += 5;
  }

  if (
    cloudProvider.includes("stc") ||
    cloudProvider.includes("oracle") ||
    cloudProvider.includes("aramco")
  ) {
    saudiScore += 5;
  }

  chinaScore = clampScore(chinaScore);
  saudiScore = clampScore(saudiScore);
  euScore = clampScore(euScore);
  usScore = clampScore(usScore);
  brazilScore = clampScore(brazilScore);
  globalScore = clampScore(globalScore);

  const overallScore = clampScore(
    (chinaScore + saudiScore + euScore + usScore + brazilScore + globalScore) /
      6
  );
  const riskLevel = inferRiskLevel(overallScore, gaps);
  const status = scoreToStatus(overallScore);

  const recommendations = dedupe(
    gaps
      .map(gap => gap.mitigation)
      .concat([
        "Run legal validation for all critical and high findings before onboarding.",
        "Keep a jurisdiction-specific evidence pack for applicable regulators (e.g., CAC, SDAIA, EDPB, ANPD).",
      ])
  );

  return {
    vendorId: vendor.id,
    generatedAt: new Date().toISOString(),
    overallScore,
    jurisdictionScores: {
      china: chinaScore,
      saudiArabia: saudiScore,
      eu: euScore,
      us: usScore,
      brazil: brazilScore,
      global: globalScore,
    },
    status,
    riskLevel,
    gaps,
    recommendations,
  };
}

function csvEscape(value: string): string {
  const normalized = value.replace(/"/g, '""');
  return `"${normalized}"`;
}

export function buildAssessmentCsv(
  vendor: Vendor,
  result: SupplierAssessmentResult
): string {
  const lines: string[] = [];

  const appendProfileLine = (
    label: string,
    value: string | null | undefined
  ) => {
    if (value && value.trim().length > 0) {
      lines.push(`${label},${csvEscape(value)}`);
    }
  };

  lines.push("DJAC Supplier Assessment Report");
  lines.push(`Vendor,${csvEscape(vendor.vendorName)}`);
  appendProfileLine(
    "Business Registration Number",
    vendor.businessRegistrationNumber
  );
  appendProfileLine("Headquarters Location", vendor.headquartersLocation);
  appendProfileLine("Industry", vendor.industry);
  appendProfileLine("Service Type", vendor.serviceType);
  appendProfileLine("Service Scope", vendor.serviceScope);
  appendProfileLine("Hosting Environment", vendor.hostingEnvironment);
  appendProfileLine("Cloud Providers", vendor.cloudProvider);
  appendProfileLine("Operating Countries", vendor.operatingCountries);
  appendProfileLine("Data Locations", vendor.dataLocations);
  appendProfileLine("Regulatory Jurisdictions", vendor.regulatoryJurisdictions);
  appendProfileLine(
    "Security Certifications & Standards",
    vendor.certifications
  );
  appendProfileLine(
    "Data Processing Activities",
    vendor.dataProcessingActivities
  );
  appendProfileLine("Criticality Level", vendor.criticalityLevel);
  appendProfileLine("Inherent Risk Tier", vendor.riskTier);
  appendProfileLine("Third-Party Dependencies", vendor.thirdPartyDependencies);
  appendProfileLine(
    "Fourth-Party Dependencies",
    vendor.fourthPartyDependencies
  );
  appendProfileLine("Primary Contact Name", vendor.primaryContactName);
  appendProfileLine("Primary Contact Email", vendor.primaryContactEmail);
  appendProfileLine("Primary Contact Role", vendor.primaryContactRole);
  appendProfileLine("Primary Contact Phone", vendor.primaryContactPhone);
  lines.push(`Generated At,${csvEscape(result.generatedAt)}`);
  lines.push(`Overall Score,${result.overallScore}`);
  lines.push(`China Score,${result.jurisdictionScores.china}`);
  lines.push(`Saudi Arabia Score,${result.jurisdictionScores.saudiArabia}`);
  lines.push(`EU Score,${result.jurisdictionScores.eu}`);
  lines.push(`US Score,${result.jurisdictionScores.us}`);
  lines.push(`Brazil Score,${result.jurisdictionScores.brazil}`);
  lines.push(`Global Score,${result.jurisdictionScores.global}`);
  lines.push(`Risk Level,${result.riskLevel}`);
  lines.push(`Status,${result.status}`);
  lines.push("");

  lines.push(
    "Gap Code,Jurisdiction,Frameworks,Severity,Title,Description,Mitigation,Penalty Context"
  );
  for (const gap of result.gaps) {
    lines.push(
      [
        gap.code,
        gap.jurisdiction,
        gap.frameworks.join("|"),
        gap.severity,
        gap.title,
        gap.description,
        gap.mitigation,
        gap.penaltyContext,
      ]
        .map(value => csvEscape(value))
        .join(",")
    );
  }

  lines.push("");
  lines.push("Recommendations");
  for (const recommendation of result.recommendations) {
    lines.push(csvEscape(recommendation));
  }

  return lines.join("\n");
}
