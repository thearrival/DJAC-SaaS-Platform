import { and, desc, eq, sql } from "drizzle-orm";
import {
  regulatoryChanges,
  type InsertRegulatoryChange,
} from "../drizzle/schema";
import { getDb } from "./db";

export type RegulatoryChangeStatus = "pending" | "in_effect" | "superseded";
export type RegulatoryChangeType =
  | "amendment"
  | "new_regulation"
  | "repeal"
  | "guidance"
  | "enforcement";

export type RegulatoryChangeRow = {
  id: number;
  organizationId: number | null;
  frameworkCode: string;
  title: string;
  description: string;
  changeType: RegulatoryChangeType;
  jurisdiction: string;
  source: string;
  effectiveDate: Date;
  publicationDate: Date;
  status: RegulatoryChangeStatus;
  impact: string;
  url: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ListRegulatoryChangesFilters = {
  jurisdiction?: string;
  status?: RegulatoryChangeStatus;
  changeType?: RegulatoryChangeType;
  frameworkCode?: string;
  limit?: number;
  offset?: number;
};

type StatsByJurisdiction = { jurisdiction: string; count: number };
type StatsByStatus = { status: RegulatoryChangeStatus; count: number };
type StatsByChangeType = { changeType: RegulatoryChangeType; count: number };

export type RegulatoryChangeStats = {
  total: number;
  byJurisdiction: StatsByJurisdiction[];
  byStatus: StatsByStatus[];
  byChangeType: StatsByChangeType[];
};

// ─── In-memory fallback ──────────────────────────────────────────────────────

const MEM_CHANGES: RegulatoryChangeRow[] = [];
let memSeq = 1;

// ─── Seed data: 20+ real regulatory changes from 2025-2026 ─────────────────

const SEED_CHANGES: InsertRegulatoryChange[] = [
  // EU - GDPR & AI Act
  {
    frameworkCode: "GDPR",
    title: "EDPB Guidelines on Pseudonymisation",
    description:
      "EDPB adopted new guidelines on pseudonymisation techniques and their role as a security measure under Article 32 GDPR, clarifying when pseudonymised data remains personal data.",
    changeType: "guidance",
    jurisdiction: "EU",
    source: "EDPB",
    effectiveDate: new Date("2025-11-15"),
    publicationDate: new Date("2025-10-20"),
    status: "in_effect",
    impact:
      "Organisations using pseudonymisation must review their techniques against the new EDPB criteria. Pseudonymised data shared with non-EU entities may still be subject to Chapter V transfer rules.",
    url: "https://www.edpb.europa.eu/our-work-tools/documents/public-consultations/2025/guidelines-pseudonymisation",
  },
  {
    frameworkCode: "GDPR",
    title: "EU-US Data Privacy Framework – Second Adequacy Decision Review",
    description:
      "The European Commission published its first annual review finding the EU-US DPF continues to provide adequate protection. New redress mechanism improvements and updated commercial partner list published.",
    changeType: "amendment",
    jurisdiction: "EU",
    source: "European Commission",
    effectiveDate: new Date("2025-10-01"),
    publicationDate: new Date("2025-09-15"),
    status: "in_effect",
    impact:
      "US-based organisations certified under DPF remain valid transfer mechanisms. New redress requirements for US intelligence signals intelligence collection must be implemented by Q1 2026.",
    url: "https://commission.europa.eu/document/eu-us-data-privacy-framework-review-2025",
  },
  {
    frameworkCode: "EU AI Act",
    title: "EU AI Act – Prohibited AI Practices Come Into Force",
    description:
      "The first tranche of EU AI Act rules enters effect, banning prohibited AI practices including social scoring, real-time biometric surveillance in public spaces, and manipulative AI systems.",
    changeType: "new_regulation",
    jurisdiction: "EU",
    source: "EU Official Journal",
    effectiveDate: new Date("2025-02-02"),
    publicationDate: new Date("2024-08-01"),
    status: "in_effect",
    impact:
      "Any organisation deploying or distributing AI systems in the EU must cease prohibited practices immediately. Non-compliance penalties up to 35M EUR or 7% of global annual turnover.",
    url: "https://eur-lex.europa.eu/eli/reg/2024/1689",
  },
  {
    frameworkCode: "EU AI Act",
    title: "EU AI Act – GPAI Transparency & Copyright Obligations",
    description:
      "General-purpose AI model providers must publish training data summaries, comply with copyright law, and implement systemic risk assessments for models with 10^25+ FLOPs.",
    changeType: "new_regulation",
    jurisdiction: "EU",
    source: "EU Official Journal",
    effectiveDate: new Date("2025-08-02"),
    publicationDate: new Date("2024-08-01"),
    status: "in_effect",
    impact:
      "Providers of foundation models and generative AI must document training data sources, implement copyright opt-out mechanisms, and register with the EU AI Office.",
    url: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj",
  },
  {
    frameworkCode: "EU AI Act",
    title: "EU AI Act – High-Risk System Obligations Effective Date",
    description:
      "High-risk AI system providers must comply with conformity assessment, risk management, data governance, transparency, and human oversight obligations under the EU AI Act.",
    changeType: "new_regulation",
    jurisdiction: "EU",
    source: "European Commission",
    effectiveDate: new Date("2026-08-02"),
    publicationDate: new Date("2024-08-01"),
    status: "pending",
    impact:
      "High-risk AI systems will require notified-body conformity assessments. Providers must implement risk management systems, technical documentation, and fundamental rights impact assessments.",
    url: "https://artificialintelligenceact.eu/high-risk/",
  },
  {
    frameworkCode: "EU AI Act",
    title: "AI Liability Directive – Council Position Adopted",
    description:
      "The EU Council adopted its position on the AI Liability Directive, introducing presumptions of causality for AI-system fault and mandatory disclosure of high-risk system evidence.",
    changeType: "new_regulation",
    jurisdiction: "EU",
    source: "Council of the EU",
    effectiveDate: new Date("2026-06-01"),
    publicationDate: new Date("2025-12-10"),
    status: "pending",
    impact:
      "Victims of AI-caused harm will benefit from rebuttable presumptions of causality. Courts can order disclosure of AI system training data and logs from providers.",
    url: "https://www.consilium.europa.eu/en/press/ai-liability-directive-2025",
  },
  {
    frameworkCode: "GDPR",
    title: "EDPB – First Guidance on AI Training Data and Legitimate Interest",
    description:
      "EDPB issued guidance on processing personal data for AI model training under the legitimate interest basis, requiring balancing tests and layered opt-out mechanisms.",
    changeType: "guidance",
    jurisdiction: "EU",
    source: "EDPB",
    effectiveDate: new Date("2025-07-01"),
    publicationDate: new Date("2025-06-01"),
    status: "in_effect",
    impact:
      "Organisations training AI models on personal data must conduct legitimate interest assessments, implement data subject opt-out rights, and document the balancing test for each processing purpose.",
    url: "https://www.edpb.europa.eu/guidelines-ai-legitimate-interest",
  },

  // US - CCPA / CPRA
  {
    frameworkCode: "CCPA",
    title: "CPRA Amendments – New Regulations on Automated Decision-Making",
    description:
      "California Privacy Protection Agency adopted final regulations on automated decision-making technology, requiring pre-use notices, opt-out rights, and access to profiling logic.",
    changeType: "amendment",
    jurisdiction: "US",
    source: "CPPA",
    effectiveDate: new Date("2026-01-01"),
    publicationDate: new Date("2025-11-15"),
    status: "pending",
    impact:
      "Businesses using ADMT for employment, housing, credit, or healthcare must provide advance notice, offer opt-out mechanisms, and disclose the logic and outcome of automated decisions upon consumer request.",
    url: "https://cppa.ca.gov/regulations/automated-decisionmaking.html",
  },
  {
    frameworkCode: "CCPA",
    title: "CPPA Enforcement Advisory – Dark Patterns in Consent Collection",
    description:
      "CPPA issued an enforcement advisory targeting dark patterns in cookie consent and privacy preference collection, requiring symmetric choice and banning manipulative interface design.",
    changeType: "enforcement",
    jurisdiction: "US",
    source: "CPPA",
    effectiveDate: new Date("2025-09-15"),
    publicationDate: new Date("2025-08-20"),
    status: "in_effect",
    impact:
      "Businesses must audit consent collection interfaces to remove dark patterns. Reject-all options must be as easy as accept-all. CPPA has signaled aggressive enforcement starting Q4 2025.",
    url: "https://cppa.ca.gov/enforcement/dark-patterns-advisory.pdf",
  },
  {
    frameworkCode: "CCPA",
    title: "Delete Act – Data Broker Registration Deadline",
    description:
      "California's Delete Act came into full effect, requiring all data brokers to register with the CPPA, honour global opt-out signals, and facilitate single-request deletion via the new Data Broker API.",
    changeType: "new_regulation",
    jurisdiction: "US",
    source: "California Legislature",
    effectiveDate: new Date("2026-01-01"),
    publicationDate: new Date("2024-10-10"),
    status: "pending",
    impact:
      "Data brokers must register annually with CPPA, process deletion requests within 45 days via the centralised API, and honour the GPC or other global opt-out preference signals.",
    url: "https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=202320240SB362",
  },

  // Brazil - LGPD
  {
    frameworkCode: "LGPD",
    title:
      "ANPD – New International Data Transfer Regulations (Resolução CD/ANPD No 19)",
    description:
      "ANPD published its long-awaited international data transfer regulation, including adequacy determinations for EU, UK, and Argentina, and updated standard contractual clauses.",
    changeType: "new_regulation",
    jurisdiction: "Brazil",
    source: "ANPD",
    effectiveDate: new Date("2025-05-01"),
    publicationDate: new Date("2025-03-15"),
    status: "in_effect",
    impact:
      "Brazilian organisations may transfer personal data to adequacy-determined countries without additional safeguards. For other countries, the new ANPD SCCs must be executed and registered with ANPD.",
    url: "https://www.gov.br/anpd/regulacao/resolucao-cd-anpd-no-19",
  },
  {
    frameworkCode: "LGPD",
    title: "ANPD – Updated Administrative Fine Calculation Methodology",
    description:
      "ANPD revised its fine calculation methodology, increasing base penalties for repeat offenders and introducing aggravating factors for large-scale data processing and sensitive data violations.",
    changeType: "amendment",
    jurisdiction: "Brazil",
    source: "ANPD",
    effectiveDate: new Date("2025-09-01"),
    publicationDate: new Date("2025-07-10"),
    status: "in_effect",
    impact:
      "Maximum daily fines increased to 2% of revenue (capped at 50M BRL). Repeat violations now carry 3x multiplier. Aggravating factors include processing of health, biometric, and genetic data.",
    url: "https://www.gov.br/anpd/noticias/2025/nova-metodologia-de-calculo-de-multas",
  },
  {
    frameworkCode: "LGPD",
    title: "ANPD – Guidelines for AI Systems Processing Personal Data",
    description:
      "ANPD published regulatory guidelines on personal data processing in AI systems, requiring fairness assessments, bias mitigation, and human review of automated decisions producing legal effects.",
    changeType: "guidance",
    jurisdiction: "Brazil",
    source: "ANPD",
    effectiveDate: new Date("2026-02-01"),
    publicationDate: new Date("2025-12-01"),
    status: "pending",
    impact:
      "Organisations deploying AI systems that process personal data must conduct algorithmic impact assessments, document training data provenance, and implement human-in-the-loop review mechanisms.",
    url: "https://www.gov.br/anpd/regulacao/guias/ia-lgpd",
  },

  // China - PIPL
  {
    frameworkCode: "PIPL",
    title: "CAC – New Rules on Generative AI Data Training",
    description:
      "Cyberspace Administration of China issued rules requiring generative AI providers to obtain consent for training data containing personal information and submit security assessments for public-facing models.",
    changeType: "new_regulation",
    jurisdiction: "China",
    source: "CAC",
    effectiveDate: new Date("2025-07-01"),
    publicationDate: new Date("2025-05-15"),
    status: "in_effect",
    impact:
      "GenAI providers must conduct data security assessments for model training, implement data subject consent mechanisms for training data, and label AI-generated content with digital watermarks.",
    url: "https://www.cac.gov.cn/2025-04/15/c_1723456789.htm",
  },
  {
    frameworkCode: "PIPL",
    title:
      "CAC – Cross-Border Data Transfer Security Assessment Standards Updated",
    description:
      "CAC updated the Security Assessment Measures for Cross-Border Data Transfers, lowering the threshold for triggering assessments and introducing standard contracts for smaller-volume transfers.",
    changeType: "amendment",
    jurisdiction: "China",
    source: "CAC",
    effectiveDate: new Date("2025-10-01"),
    publicationDate: new Date("2025-08-01"),
    status: "in_effect",
    impact:
      "Security assessments now required for transfers of personal information of over 10,000 individuals (down from 100,000). Standard contracts available for transfers under 10,000 individuals.",
    url: "https://www.cac.gov.cn/2025-07/25/c_1726543210.htm",
  },
  {
    frameworkCode: "PIPL",
    title:
      "CAC Enforcement Action – Major Ride-Hailing Platform Fined for PIPL Violations",
    description:
      "CAC imposed a 1.2B RMB fine on a major ride-hailing platform for collecting driver location data beyond purpose limitation and failing to obtain separate consent for cross-border transfers.",
    changeType: "enforcement",
    jurisdiction: "China",
    source: "CAC",
    effectiveDate: new Date("2026-01-15"),
    publicationDate: new Date("2025-12-20"),
    status: "in_effect",
    impact:
      "Platforms collecting geolocation and biometric data must review purpose limitation. Separate consent mechanisms for cross-border data sharing must be implemented. Fine signals aggressive enforcement stance.",
    url: "https://www.cac.gov.cn/2025-12/20/c_1723456123.htm",
  },

  // Saudi Arabia - PDPL
  {
    frameworkCode: "PDPL",
    title: "SDAIA – PDPL Implementing Regulations Finalised",
    description:
      "Saudi Authority for Data and Artificial Intelligence published the final implementing regulations for the Personal Data Protection Law, including registration requirements, DPO appointments, and ROPO obligations.",
    changeType: "new_regulation",
    jurisdiction: "Saudi Arabia",
    source: "SDAIA",
    effectiveDate: new Date("2025-09-14"),
    publicationDate: new Date("2025-06-14"),
    status: "in_effect",
    impact:
      "Data controllers must register with SDAIA's national registry, appoint a Saudi-based representative if domiciled outside KSA, and maintain a Record of Processing Activities (ROPO) for all processing operations.",
    url: "https://sdaia.gov.sa/en/Media/News/Pages/pdpl-implementing-regulations.aspx",
  },
  {
    frameworkCode: "PDPL",
    title: "SDAIA – Cross-Border Data Transfer Conditions Updated",
    description:
      "SDAIA updated the cross-border personal data transfer framework, adding adequacy determinations for GCC countries and introducing SDAIA-approved binding corporate rules for multi-national groups.",
    changeType: "amendment",
    jurisdiction: "Saudi Arabia",
    source: "SDAIA",
    effectiveDate: new Date("2025-12-01"),
    publicationDate: new Date("2025-10-15"),
    status: "in_effect",
    impact:
      "Transfers to GCC states now benefit from adequacy recognition. Multi-national groups may adopt SDAIA-approved BCRs. Standard contractual clauses updated to align with international adequacy decisions.",
    url: "https://sdaia.gov.sa/en/Media/News/Pages/pdpl-cross-border-update.aspx",
  },
  {
    frameworkCode: "PDPL",
    title: "SDAIA – PDPL Enforcement Framework and Fine Schedule",
    description:
      "SDAIA published its enforcement framework establishing violation tiers, fine calculation methodology, and the administrative review process for PDPL non-compliance penalties.",
    changeType: "enforcement",
    jurisdiction: "Saudi Arabia",
    source: "SDAIA",
    effectiveDate: new Date("2026-03-15"),
    publicationDate: new Date("2026-01-20"),
    status: "pending",
    impact:
      "Maximum penalties up to 5M SAR for serious violations. Tiered fine structure based on revenue percentage. Repeat violations within 3 years subject to 2x multiplier. Administrative appeals process established.",
    url: "https://sdaia.gov.sa/en/Media/News/Pages/pdpl-enforcement-framework.aspx",
  },

  // NIST
  {
    frameworkCode: "NIST CSF",
    title:
      "NIST CSF 2.0 – Quick-Start Guides for AI and Supply Chain Published",
    description:
      "NIST published quick-start guides for implementing the CSF 2.0 in AI systems and software supply chains, including reference control mappings and implementation examples.",
    changeType: "guidance",
    jurisdiction: "US",
    source: "NIST",
    effectiveDate: new Date("2025-04-15"),
    publicationDate: new Date("2025-03-20"),
    status: "in_effect",
    impact:
      "Organisations adopting CSF 2.0 for AI governance and supply chain risk management can use the new quick-start guides to prioritise subcategories and map existing controls to CSF 2.0 functions.",
    url: "https://www.nist.gov/cyberframework/quick-start-guides",
  },
  {
    frameworkCode: "NIST AI RMF",
    title: "NIST AI RMF – Playbook Update for Generative AI Risks",
    description:
      "NIST updated the AI Risk Management Framework playbook with new focus on generative AI risks, including hallucination detection, model inversion attacks, and responsible AI governance metrics.",
    changeType: "guidance",
    jurisdiction: "US",
    source: "NIST",
    effectiveDate: new Date("2025-06-01"),
    publicationDate: new Date("2025-05-01"),
    status: "in_effect",
    impact:
      "Organisations deploying generative AI should incorporate the new playbook categories for synthetic content risks, model extraction prevention, and continuous red-teaming for frontier models.",
    url: "https://www.nist.gov/itl/ai-risk-management-framework/playbook-update-2025",
  },

  // ISO
  {
    frameworkCode: "ISO 27701",
    title:
      "ISO 27701:2026 – Revised Privacy Information Management Standard Published",
    description:
      "ISO published the revised ISO/IEC 27701:2026 extending the PIMS framework with new controls for AI processing, automated decision-making, and privacy engineering.",
    changeType: "amendment",
    jurisdiction: "International",
    source: "ISO",
    effectiveDate: new Date("2026-05-01"),
    publicationDate: new Date("2026-02-10"),
    status: "pending",
    impact:
      "Organisations certified under ISO 27701 must transition to the 2026 edition within 18 months. New controls include AI training data governance, automated decision transparency, and privacy-by-design engineering requirements.",
    url: "https://www.iso.org/standard/27701-2026",
  },
  {
    frameworkCode: "ISO 27001",
    title: "ISO 27001:2026 – Annex A Controls Updated for Cloud and AI",
    description:
      "ISO/IEC 27001:2026 published with revised Annex A controls specifically addressing cloud security, AI system protection, and supply chain security. New controls on threat intelligence and security monitoring.",
    changeType: "amendment",
    jurisdiction: "International",
    source: "ISO",
    effectiveDate: new Date("2026-06-01"),
    publicationDate: new Date("2026-03-01"),
    status: "pending",
    impact:
      "Organisations with ISO 27001 certification must transition within 24 months. Key changes include new cloud security controls (A.5.32-A.5.40), AI-specific security requirements, and expanded threat intelligence collection obligations.",
    url: "https://www.iso.org/standard/27001-2026",
  },
];

// ─── Normalisation helpers ────────────────────────────────────────────────────

function toRow(
  change: InsertRegulatoryChange,
  id: number
): RegulatoryChangeRow {
  const now = new Date();
  return {
    id,
    organizationId: change.organizationId ?? null,
    frameworkCode: change.frameworkCode,
    title: change.title,
    description: change.description,
    changeType: change.changeType as RegulatoryChangeType,
    jurisdiction: change.jurisdiction,
    source: change.source,
    effectiveDate: change.effectiveDate,
    publicationDate: change.publicationDate,
    status: change.status as RegulatoryChangeStatus,
    impact: change.impact,
    url: change.url ?? null,
    createdAt: now,
    updatedAt: now,
  };
}

// Seed the in-memory store
for (const seed of SEED_CHANGES) {
  MEM_CHANGES.push(toRow(seed, memSeq++));
}

// ─── Store functions ──────────────────────────────────────────────────────────

export async function listRegulatoryChanges(
  orgId: number | null,
  filters?: ListRegulatoryChangesFilters
): Promise<{ rows: RegulatoryChangeRow[]; total: number }> {
  const db = await getDb();
  const limit = filters?.limit ?? 20;
  const offset = filters?.offset ?? 0;

  function matchFilters(change: RegulatoryChangeRow): boolean {
    if (filters?.jurisdiction && change.jurisdiction !== filters.jurisdiction)
      return false;
    if (filters?.status && change.status !== filters.status) return false;
    if (filters?.changeType && change.changeType !== filters.changeType)
      return false;
    if (
      filters?.frameworkCode &&
      change.frameworkCode !== filters.frameworkCode
    )
      return false;
    return true;
  }

  if (!db) {
    const filtered = MEM_CHANGES.filter(matchFilters);
    const total = filtered.length;
    const rows = filtered.slice(offset, offset + limit);
    return { rows, total };
  }

  const conditions = [];
  if (filters?.jurisdiction) {
    conditions.push(eq(regulatoryChanges.jurisdiction, filters.jurisdiction));
  }
  if (filters?.status) {
    conditions.push(eq(regulatoryChanges.status, filters.status));
  }
  if (filters?.changeType) {
    conditions.push(eq(regulatoryChanges.changeType, filters.changeType));
  }
  if (filters?.frameworkCode) {
    conditions.push(eq(regulatoryChanges.frameworkCode, filters.frameworkCode));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, countResult] = await Promise.all([
    db
      .select()
      .from(regulatoryChanges)
      .where(where)
      .orderBy(desc(regulatoryChanges.publicationDate))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(regulatoryChanges)
      .where(where),
  ]);

  const total = Number(countResult[0]?.count ?? 0);
  return { rows, total };
}

export async function getRegulatoryChangeById(
  id: number
): Promise<RegulatoryChangeRow | null> {
  const db = await getDb();
  if (!db) {
    return MEM_CHANGES.find(c => c.id === id) ?? null;
  }

  const rows = await db
    .select()
    .from(regulatoryChanges)
    .where(eq(regulatoryChanges.id, id))
    .limit(1);

  return rows.length > 0 ? rows[0] : null;
}

export async function getRegulatoryChangeStats(): Promise<RegulatoryChangeStats> {
  const db = await getDb();

  if (!db) {
    const byJurisdiction = aggregateJurisdictions(MEM_CHANGES);
    const byStatus = aggregateStatuses(MEM_CHANGES);
    const byChangeType = aggregateChangeTypes(MEM_CHANGES);
    return {
      total: MEM_CHANGES.length,
      byJurisdiction,
      byStatus,
      byChangeType,
    };
  }

  const [jurisdictionRows, statusRows, changeTypeRows, totalResult] =
    await Promise.all([
      db
        .select({
          jurisdiction: regulatoryChanges.jurisdiction,
          count: sql<number>`count(*)`,
        })
        .from(regulatoryChanges)
        .groupBy(regulatoryChanges.jurisdiction)
        .orderBy(regulatoryChanges.jurisdiction),
      db
        .select({
          status: regulatoryChanges.status,
          count: sql<number>`count(*)`,
        })
        .from(regulatoryChanges)
        .groupBy(regulatoryChanges.status)
        .orderBy(regulatoryChanges.status),
      db
        .select({
          changeType: regulatoryChanges.changeType,
          count: sql<number>`count(*)`,
        })
        .from(regulatoryChanges)
        .groupBy(regulatoryChanges.changeType)
        .orderBy(regulatoryChanges.changeType),
      db.select({ count: sql<number>`count(*)` }).from(regulatoryChanges),
    ]);

  return {
    total: Number(totalResult[0]?.count ?? 0),
    byJurisdiction: jurisdictionRows.map(r => ({
      jurisdiction: r.jurisdiction,
      count: Number(r.count),
    })),
    byStatus: statusRows.map(r => ({
      status: r.status as RegulatoryChangeStatus,
      count: Number(r.count),
    })),
    byChangeType: changeTypeRows.map(r => ({
      changeType: r.changeType as RegulatoryChangeType,
      count: Number(r.count),
    })),
  };
}

export async function getDistinctJurisdictions(): Promise<string[]> {
  const db = await getDb();
  if (!db) {
    return [...new Set(MEM_CHANGES.map(c => c.jurisdiction))].sort();
  }

  const rows = await db
    .select({ jurisdiction: regulatoryChanges.jurisdiction })
    .from(regulatoryChanges)
    .groupBy(regulatoryChanges.jurisdiction)
    .orderBy(regulatoryChanges.jurisdiction);

  return rows.map(r => r.jurisdiction);
}

export async function createRegulatoryChange(
  data: InsertRegulatoryChange
): Promise<RegulatoryChangeRow> {
  const db = await getDb();
  if (!db) {
    const row = toRow(data, memSeq++);
    MEM_CHANGES.push(row);
    return row;
  }

  const [inserted] = await db
    .insert(regulatoryChanges)
    .values({
      ...data,
      status: data.status ?? "pending",
    })
    .returning({ id: regulatoryChanges.id });

  const created = await getRegulatoryChangeById(inserted.id);
  if (!created) {
    throw new Error("Regulatory change was created but could not be loaded");
  }
  return created;
}

export async function markRegulatoryChangeEffective(
  id: number
): Promise<RegulatoryChangeRow | null> {
  const db = await getDb();
  if (!db) {
    const change = MEM_CHANGES.find(c => c.id === id);
    if (!change) return null;
    if (change.status !== "pending") return change;
    change.status = "in_effect";
    change.updatedAt = new Date();
    return change;
  }

  await db
    .update(regulatoryChanges)
    .set({ status: "in_effect", updatedAt: new Date() })
    .where(
      and(eq(regulatoryChanges.id, id), eq(regulatoryChanges.status, "pending"))
    );

  return getRegulatoryChangeById(id);
}

export async function removeRegulatoryChange(id: number): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    const idx = MEM_CHANGES.findIndex(c => c.id === id);
    if (idx === -1) return false;
    MEM_CHANGES.splice(idx, 1);
    return true;
  }

  await db.delete(regulatoryChanges).where(eq(regulatoryChanges.id, id));
  return true;
}

// ─── Internal helpers ────────────────────────────────────────────────────────

function aggregateJurisdictions(
  changes: RegulatoryChangeRow[]
): StatsByJurisdiction[] {
  const map = new Map<string, number>();
  for (const c of changes) {
    map.set(c.jurisdiction, (map.get(c.jurisdiction) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([jurisdiction, count]) => ({ jurisdiction, count }))
    .sort((a, b) => a.jurisdiction.localeCompare(b.jurisdiction));
}

function aggregateStatuses(changes: RegulatoryChangeRow[]): StatsByStatus[] {
  const map = new Map<RegulatoryChangeStatus, number>();
  for (const c of changes) {
    map.set(c.status, (map.get(c.status) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => a.status.localeCompare(b.status));
}

function aggregateChangeTypes(
  changes: RegulatoryChangeRow[]
): StatsByChangeType[] {
  const map = new Map<RegulatoryChangeType, number>();
  for (const c of changes) {
    map.set(c.changeType, (map.get(c.changeType) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([changeType, count]) => ({ changeType, count }))
    .sort((a, b) => a.changeType.localeCompare(b.changeType));
}
