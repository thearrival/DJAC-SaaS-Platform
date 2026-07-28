export type RegulatoryChange = {
  id: string;
  jurisdiction: string;
  region: string;
  framework: string;
  title: string;
  description: string;
  changeType: "new" | "amendment" | "repeal" | "guidance" | "enforcement";
  impact: "critical" | "high" | "medium" | "low";
  status: "draft" | "effective" | "pending" | "proposed";
  effectiveDate: string;
  sourceUrl?: string;
  authority: string;
  detectedAt: string;
  summary: string;
  affectedArticles?: string[];
};

const MOCK_CHANGES: RegulatoryChange[] = [
  {
    id: "change-001",
    jurisdiction: "European Union",
    region: "Europe",
    framework: "EU AI Act",
    title: "EU AI Act High-Risk Obligations Come Into Effect",
    description:
      "High-risk AI system providers must comply with conformity assessment, risk management, and transparency obligations.",
    changeType: "new",
    impact: "critical",
    status: "effective",
    effectiveDate: "2026-01-01",
    authority: "European Commission",
    detectedAt: "2025-12-15",
    summary:
      "High-risk AI systems now require conformity assessment bodies, fundamental rights impact assessments, and human oversight mechanisms.",
    affectedArticles: ["Article 6", "Article 9", "Article 15"],
  },
  {
    id: "change-002",
    jurisdiction: "United States",
    region: "North America",
    framework: "SEC Cybersecurity Rules",
    title: "SEC Updates Material Incident Disclosure Timeline",
    description:
      "SEC amended the disclosure timeline for material cybersecurity incidents from 4 business days to 72 hours.",
    changeType: "amendment",
    impact: "high",
    status: "proposed",
    effectiveDate: "2026-06-01",
    authority: "SEC",
    detectedAt: "2026-03-10",
    summary:
      "Public companies must now disclose material cybersecurity incidents within 72 hours of determination.",
  },
  {
    id: "change-003",
    jurisdiction: "China",
    region: "Asia-Pacific",
    framework: "MLPS 2.0",
    title: "MLPS 2.0 Enforcement Guidelines Updated",
    description:
      "China's Multi-Level Protection Scheme 2.0 enforcement guidelines now require enhanced supply chain security assessments.",
    changeType: "guidance",
    impact: "high",
    status: "effective",
    effectiveDate: "2026-02-01",
    authority: "MPS / CAC",
    detectedAt: "2026-01-20",
    summary:
      "Supply chain security assessments are now mandatory for Level 3 and above MLPS systems.",
  },
  {
    id: "change-004",
    jurisdiction: "Saudi Arabia",
    region: "Middle East",
    framework: "NCA ECC",
    title: "NCA ECC-1 Critical Controls Expansion",
    description:
      "Saudi NCA expanded the Essential Cybersecurity Controls with 12 new sub-controls for AI and cloud security.",
    changeType: "amendment",
    impact: "critical",
    status: "pending",
    effectiveDate: "2026-04-01",
    authority: "NCA",
    detectedAt: "2026-02-28",
    summary:
      "New sub-controls cover AI system security, cloud workload protection, and data sovereignty verification.",
    affectedArticles: ["ECC-1", "ECC-2"],
  },
  {
    id: "change-005",
    jurisdiction: "India",
    region: "Asia-Pacific",
    framework: "DPDP Act",
    title: "India DPDP Act Rules Finalized",
    description:
      "India published final DPDP rules including data fiduciary obligations, consent manager requirements, and cross-border transfer mechanisms.",
    changeType: "new",
    impact: "high",
    status: "effective",
    effectiveDate: "2026-03-01",
    authority: "MeitY",
    detectedAt: "2026-02-15",
    summary:
      "Data fiduciaries must implement consent managers, conduct data protection impact assessments, and maintain transfer records.",
  },
  {
    id: "change-006",
    jurisdiction: "Brazil",
    region: "Latin America",
    framework: "LGPD",
    title: "ANPD Issues New International Transfer Regulations",
    description:
      "Brazil's ANPD published adequacy decisions for international data transfers to countries with equivalent protection levels.",
    changeType: "guidance",
    impact: "medium",
    status: "effective",
    effectiveDate: "2026-01-15",
    authority: "ANPD",
    detectedAt: "2026-01-10",
    summary:
      "New adequacy decisions cover transfers to EU, UK, and Argentina. Standard contractual clauses also updated.",
  },
  {
    id: "change-007",
    jurisdiction: "Singapore",
    region: "Asia-Pacific",
    framework: "PDPA",
    title: "PDPC Issues Advisory on AI Data Use",
    description:
      "Singapore PDPC published advisory guidelines on personal data use in AI model training and deployment.",
    changeType: "guidance",
    impact: "medium",
    status: "effective",
    effectiveDate: "2026-02-28",
    authority: "PDPC",
    detectedAt: "2026-02-20",
    summary:
      "Organizations must ensure consent, notification, and purpose limitation when using personal data for AI training.",
  },
  {
    id: "change-008",
    jurisdiction: "United Arab Emirates",
    region: "Middle East",
    framework: "UAE PDPL",
    title: "UDA Issued Implementing Regulations",
    description:
      "The UAE Data Office published implementing regulations for the Federal PDPL covering registration, DPO appointments, and fines.",
    changeType: "new",
    impact: "high",
    status: "pending",
    effectiveDate: "2026-05-01",
    authority: "UAE Data Office",
    detectedAt: "2026-03-05",
    summary:
      "Data controllers must register with the UAE Data Office and appoint local representatives before May 2026.",
  },
];

export function listRegulatoryChanges(filters?: {
  region?: string;
  jurisdiction?: string;
  impact?: string;
  status?: string;
  framework?: string;
  limit?: number;
}): RegulatoryChange[] {
  let filtered = [...MOCK_CHANGES];
  if (filters?.region)
    filtered = filtered.filter(c => c.region === filters.region);
  if (filters?.jurisdiction)
    filtered = filtered.filter(c => c.jurisdiction === filters.jurisdiction);
  if (filters?.impact)
    filtered = filtered.filter(c => c.impact === filters.impact);
  if (filters?.status)
    filtered = filtered.filter(c => c.status === filters.status);
  if (filters?.framework)
    filtered = filtered.filter(c => c.framework === filters.framework);
  if (filters?.limit) filtered = filtered.slice(0, filters.limit);
  return filtered;
}

export function getRegulatoryChangeById(id: string): RegulatoryChange | null {
  return MOCK_CHANGES.find(c => c.id === id) ?? null;
}

export function getRegulatoryChangeStats() {
  return {
    total: MOCK_CHANGES.length,
    critical: MOCK_CHANGES.filter(c => c.impact === "critical").length,
    high: MOCK_CHANGES.filter(c => c.impact === "high").length,
    medium: MOCK_CHANGES.filter(c => c.impact === "medium").length,
    low: MOCK_CHANGES.filter(c => c.impact === "low").length,
    effective: MOCK_CHANGES.filter(c => c.status === "effective").length,
    pending: MOCK_CHANGES.filter(c => c.status === "pending").length,
    proposed: MOCK_CHANGES.filter(c => c.status === "proposed").length,
    regions: [...new Set(MOCK_CHANGES.map(c => c.region))].length,
    jurisdictions: [...new Set(MOCK_CHANGES.map(c => c.jurisdiction))].length,
  };
}

export function getRegulatoryChangeRegions(): string[] {
  return [...new Set(MOCK_CHANGES.map(c => c.region))].sort();
}

export function getRegulatoryChangeJurisdictions(): string[] {
  return [...new Set(MOCK_CHANGES.map(c => c.jurisdiction))].sort();
}
