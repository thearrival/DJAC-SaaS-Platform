/**
 * deadline-store.ts — CRUD for complianceDeadlines.
 * Falls back to in-memory seeded global deadlines when DB is unavailable.
 */
import { and, eq, isNull, desc, or } from "drizzle-orm";
import { getDb } from "./db";
import { DEADLINE_JURISDICTIONS } from "./_core/jurisdictions";
import {
  complianceDeadlines,
  organizationMembers,
  users,
  type ComplianceDeadline,
  type InsertComplianceDeadline,
} from "../drizzle/schema";

// ---------------------------------------------------------------------------
// Seeded global regulatory deadlines (no DB required)
// ---------------------------------------------------------------------------
const NOW = new Date("2026-03-23T00:00:00Z");
const d = (offsetDays: number) =>
  new Date(NOW.getTime() + offsetDays * 86_400_000);

const GLOBAL_DEADLINES: ComplianceDeadline[] = [
  {
    id: 1,
    organizationId: null,
    frameworkCode: "PIPL",
    title: "PIPL Annual Personal Information Protection Impact Assessment",
    description:
      "Submit annual PIIA report to the Cyberspace Administration of China (CAC). Required for large-scale personal data processors.",
    deadlineDate: d(20),
    jurisdiction: "China",
    priority: "critical",
    status: "upcoming",
    notificationsSent: null,
    assignedToUserId: null,
    completedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 2,
    organizationId: null,
    frameworkCode: "CSL",
    title: "MLPS Level 2/3 Annual Security Assessment Submission",
    description:
      "Multi-Level Protection Scheme annual review must be submitted to provincial security bureaus. MLPS 2.0 requirements apply.",
    deadlineDate: d(45),
    jurisdiction: "China",
    priority: "high",
    status: "upcoming",
    notificationsSent: null,
    assignedToUserId: null,
    completedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 3,
    organizationId: null,
    frameworkCode: "DSL",
    title: "DSL Data Classification Annual Report",
    description:
      "Submit annual data classification and grading report as required under China Data Security Law Article 21.",
    deadlineDate: d(60),
    jurisdiction: "China",
    priority: "high",
    status: "upcoming",
    notificationsSent: null,
    assignedToUserId: null,
    completedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 4,
    organizationId: null,
    frameworkCode: "PIPL",
    title: "PIPL Cross-Border Data Transfer Standard Contract Filing",
    description:
      "Standard contract for cross-border personal data transfers must be filed with CAC within 10 days of contract execution.",
    deadlineDate: d(7),
    jurisdiction: "China",
    priority: "critical",
    status: "upcoming",
    notificationsSent: null,
    assignedToUserId: null,
    completedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 5,
    organizationId: null,
    frameworkCode: "PDPL",
    title: "PDPL Personal Data Processing Activity Registration",
    description:
      "Register all personal data processing activities with SDAIA's National Data Management Office as required by PDPL Article 7.",
    deadlineDate: d(15),
    jurisdiction: "Saudi Arabia",
    priority: "critical",
    status: "upcoming",
    notificationsSent: null,
    assignedToUserId: null,
    completedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 6,
    organizationId: null,
    frameworkCode: "NCA",
    title: "NCA Essential Cybersecurity Controls (ECC) Annual Self-Assessment",
    description:
      "Submit annual ECC compliance self-assessment to the National Cybersecurity Authority. Mandatory for all government entities and critical infrastructure operators.",
    deadlineDate: d(30),
    jurisdiction: "Saudi Arabia",
    priority: "critical",
    status: "upcoming",
    notificationsSent: null,
    assignedToUserId: null,
    completedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 7,
    organizationId: null,
    frameworkCode: "NCA",
    title: "NCA Cloud Cybersecurity Controls (CCC) Compliance Report",
    description:
      "Annual compliance report against NCA Cloud Cybersecurity Controls for organizations using cloud services in Saudi Arabia.",
    deadlineDate: d(75),
    jurisdiction: "Saudi Arabia",
    priority: "high",
    status: "upcoming",
    notificationsSent: null,
    assignedToUserId: null,
    completedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 8,
    organizationId: null,
    frameworkCode: "PDPL",
    title: "PDPL Data Breach Notification — 72-Hour Window",
    description:
      "Any personal data breach must be reported to SDAIA within 72 hours of discovery. Ensure incident response plan is tested quarterly.",
    deadlineDate: d(-5),
    jurisdiction: "Saudi Arabia",
    priority: "critical",
    status: "overdue",
    notificationsSent: null,
    assignedToUserId: null,
    completedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 9,
    organizationId: null,
    frameworkCode: "CSL",
    title: "CSL Network Security Emergency Response Plan Annual Drill",
    description:
      "Network operators must conduct an annual emergency response drill and submit the drill report to competent authorities.",
    deadlineDate: d(-10),
    jurisdiction: "China",
    priority: "medium",
    status: "overdue",
    notificationsSent: null,
    assignedToUserId: null,
    completedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 10,
    organizationId: null,
    frameworkCode: "NCA",
    title:
      "NCA Operational Technology Cybersecurity Controls (OTCC) Assessment",
    description:
      "Annual cybersecurity assessment for OT systems per NCA OTCC-1 framework. Required for energy, utilities and critical national infrastructure.",
    deadlineDate: d(90),
    jurisdiction: "Saudi Arabia",
    priority: "high",
    status: "upcoming",
    notificationsSent: null,
    assignedToUserId: null,
    completedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 11,
    organizationId: null,
    frameworkCode: "GDPR",
    title: "GDPR Data Protection Officer Appointment",
    description:
      "Designate a Data Protection Officer (DPO) as required under GDPR Articles 37-39. Mandatory for public authorities and organizations engaged in large-scale systematic monitoring.",
    deadlineDate: d(25),
    jurisdiction: "EU",
    priority: "critical",
    status: "upcoming",
    notificationsSent: null,
    assignedToUserId: null,
    completedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 12,
    organizationId: null,
    frameworkCode: "GDPR",
    title: "GDPR Data Breach Notification — 72-Hour Deadline",
    description:
      "Notify supervisory authority of a personal data breach within 72 hours of becoming aware per GDPR Article 33.",
    deadlineDate: d(-3),
    jurisdiction: "EU",
    priority: "critical",
    status: "overdue",
    notificationsSent: null,
    assignedToUserId: null,
    completedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 13,
    organizationId: null,
    frameworkCode: "GDPR",
    title: "GDPR Data Protection Impact Assessment (DPIA) Annual Review",
    description:
      "Review and update DPIAs for high-risk processing activities as required by GDPR Article 35.",
    deadlineDate: d(60),
    jurisdiction: "EU",
    priority: "high",
    status: "upcoming",
    notificationsSent: null,
    assignedToUserId: null,
    completedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 14,
    organizationId: null,
    frameworkCode: "CCPA",
    title: "CCPA Annual Consumer Privacy Notice Update",
    description:
      "Update and distribute the annual privacy notice detailing consumer rights and data collection practices as required by CCPA Section 1798.100.",
    deadlineDate: d(30),
    jurisdiction: "US",
    priority: "high",
    status: "upcoming",
    notificationsSent: null,
    assignedToUserId: null,
    completedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 15,
    organizationId: null,
    frameworkCode: "CCPA",
    title: "CCPA Consumer Request Response — 45-Day Window",
    description:
      "Respond to verified consumer rights requests (access, deletion, opt-out) within 45 calendar days per CCPA Section 1798.130.",
    deadlineDate: d(-8),
    jurisdiction: "US",
    priority: "critical",
    status: "overdue",
    notificationsSent: null,
    assignedToUserId: null,
    completedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 16,
    organizationId: null,
    frameworkCode: "CCPA",
    title: "CCPA Data Mapping and Inventory Update",
    description:
      "Maintain an up-to-date data mapping inventory of all personal information collected, used, and shared for CCPA compliance.",
    deadlineDate: d(90),
    jurisdiction: "US",
    priority: "medium",
    status: "upcoming",
    notificationsSent: null,
    assignedToUserId: null,
    completedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 17,
    organizationId: null,
    frameworkCode: "LGPD",
    title: "LGPD Data Processing Agent Appointment",
    description:
      "Appoint a Data Processing Officer (DPO/Encarregado) and communicate appointment to ANPD per LGPD Article 41.",
    deadlineDate: d(15),
    jurisdiction: "Brazil",
    priority: "critical",
    status: "upcoming",
    notificationsSent: null,
    assignedToUserId: null,
    completedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 18,
    organizationId: null,
    frameworkCode: "LGPD",
    title: "LGPD Data Subject Request Response — 15-Day Window",
    description:
      "Respond to data subject rights requests within 15 days as required under LGPD Article 19.",
    deadlineDate: d(-2),
    jurisdiction: "Brazil",
    priority: "critical",
    status: "overdue",
    notificationsSent: null,
    assignedToUserId: null,
    completedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 19,
    organizationId: null,
    frameworkCode: "LGPD",
    title: "LGPD Security Incident Notification",
    description:
      "Notify ANPD and affected data subjects of security incidents that may cause significant risk within a reasonable timeframe per LGPD Article 48.",
    deadlineDate: d(45),
    jurisdiction: "Brazil",
    priority: "high",
    status: "upcoming",
    notificationsSent: null,
    assignedToUserId: null,
    completedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 20,
    organizationId: null,
    frameworkCode: "UK-GDPR",
    title: "UK GDPR ICO Breach Notification (72 hours)",
    description:
      "Notify the ICO within 72 hours of becoming aware of a personal data breach posing risk to individuals, per UK GDPR Article 33.",
    deadlineDate: d(5),
    jurisdiction: "United Kingdom",
    priority: "critical",
    status: "upcoming",
    notificationsSent: null,
    assignedToUserId: null,
    completedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 21,
    organizationId: null,
    frameworkCode: "UK-GDPR",
    title: "UK IDTA Transfer Review",
    description:
      "Complete UK International Data Transfer Agreement documentation for transfers to third countries without UK adequacy.",
    deadlineDate: d(40),
    jurisdiction: "United Kingdom",
    priority: "high",
    status: "upcoming",
    notificationsSent: null,
    assignedToUserId: null,
    completedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 22,
    organizationId: null,
    frameworkCode: "NIS2",
    title: "NIS2 Incident Early Warning (24 hours)",
    description:
      "Essential and important entities must submit an early warning to the national CSIRT within 24 hours of a significant incident.",
    deadlineDate: d(10),
    jurisdiction: "EU",
    priority: "critical",
    status: "upcoming",
    notificationsSent: null,
    assignedToUserId: null,
    completedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 23,
    organizationId: null,
    frameworkCode: "DORA",
    title: "DORA ICT Third-Party Register Update",
    description:
      "EU financial entities must maintain and update the register of ICT third-party arrangements for supervisory reporting.",
    deadlineDate: d(30),
    jurisdiction: "EU",
    priority: "high",
    status: "upcoming",
    notificationsSent: null,
    assignedToUserId: null,
    completedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 24,
    organizationId: null,
    frameworkCode: "PIPEDA",
    title: "PIPEDA Material Breach Reporting to OPC",
    description:
      "Report material data breaches to the Office of the Privacy Commissioner of Canada and notify affected individuals where risk of significant harm exists.",
    deadlineDate: d(25),
    jurisdiction: "Canada",
    priority: "high",
    status: "upcoming",
    notificationsSent: null,
    assignedToUserId: null,
    completedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 25,
    organizationId: null,
    frameworkCode: "PRIVACY-ACT-AU",
    title: "Australia Notifiable Data Breach Reporting",
    description:
      "Notify the OAIC and affected individuals when a data breach is likely to result in serious harm under the Notifiable Data Breaches scheme.",
    deadlineDate: d(35),
    jurisdiction: "Australia",
    priority: "high",
    status: "upcoming",
    notificationsSent: null,
    assignedToUserId: null,
    completedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 26,
    organizationId: null,
    frameworkCode: "APPI",
    title: "APPI PPC Breach Notification",
    description:
      "Report qualifying personal data breaches to Japan's Personal Information Protection Commission and notify affected data subjects.",
    deadlineDate: d(15),
    jurisdiction: "Japan",
    priority: "high",
    status: "upcoming",
    notificationsSent: null,
    assignedToUserId: null,
    completedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 27,
    organizationId: null,
    frameworkCode: "PIPA-KR",
    title: "PIPA PIPC Breach Notification",
    description:
      "Notify Korea's Personal Information Protection Commission and affected data subjects of personal information breaches without delay.",
    deadlineDate: d(20),
    jurisdiction: "South Korea",
    priority: "high",
    status: "upcoming",
    notificationsSent: null,
    assignedToUserId: null,
    completedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 28,
    organizationId: null,
    frameworkCode: "PDPA-SG",
    title: "Singapore PDPA Notifiable Breach Assessment",
    description:
      "Assess whether a data breach is notifiable and inform the PDPC and affected individuals within prescribed timelines.",
    deadlineDate: d(12),
    jurisdiction: "Singapore",
    priority: "high",
    status: "upcoming",
    notificationsSent: null,
    assignedToUserId: null,
    completedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 29,
    organizationId: null,
    frameworkCode: "DPDP-IN",
    title: "DPDP Act Breach Notification to Data Protection Board",
    description:
      "Notify the Data Protection Board of India and affected data principals of personal data breaches per DPDP Act obligations.",
    deadlineDate: d(18),
    jurisdiction: "India",
    priority: "high",
    status: "upcoming",
    notificationsSent: null,
    assignedToUserId: null,
    completedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 30,
    organizationId: null,
    frameworkCode: "POPIA",
    title: "POPIA Security Compromise Notification",
    description:
      "Notify the South African Information Regulator and affected data subjects of security compromises per POPIA Section 22.",
    deadlineDate: d(22),
    jurisdiction: "South Africa",
    priority: "high",
    status: "upcoming",
    notificationsSent: null,
    assignedToUserId: null,
    completedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 31,
    organizationId: null,
    frameworkCode: "PCI-DSS",
    title: "PCI DSS Annual SAQ and Attestation of Compliance",
    description:
      "Complete the annual Self-Assessment Questionnaire and Attestation of Compliance for cardholder data environments.",
    deadlineDate: d(55),
    jurisdiction: "Global",
    priority: "medium",
    status: "upcoming",
    notificationsSent: null,
    assignedToUserId: null,
    completedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 32,
    organizationId: null,
    frameworkCode: "ISO-27001",
    title: "ISO 27001 Surveillance Audit Preparation",
    description:
      "Prepare evidence for the annual ISO 27001 surveillance audit, including management review and internal audit records.",
    deadlineDate: d(50),
    jurisdiction: "Global",
    priority: "medium",
    status: "upcoming",
    notificationsSent: null,
    assignedToUserId: null,
    completedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 33,
    organizationId: null,
    frameworkCode: "MEXICO-DPA",
    title: "Mexico ARCO Rights Response Obligation",
    description:
      "Respond to ARCO rights requests within statutory timelines and maintain the privacy notice registry under LFPDPPP.",
    deadlineDate: d(28),
    jurisdiction: "Mexico",
    priority: "medium",
    status: "upcoming",
    notificationsSent: null,
    assignedToUserId: null,
    completedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 34,
    organizationId: null,
    frameworkCode: "UAE-PDPL",
    title: "UAE PDPL Annual Compliance Review",
    description:
      "Conduct annual data protection compliance self-assessment and update processing records as required by UAE PDPL.",
    deadlineDate: d(45),
    jurisdiction: "United Arab Emirates",
    priority: "high",
    status: "upcoming",
    notificationsSent: null,
    assignedToUserId: null,
    completedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 35,
    organizationId: null,
    frameworkCode: "QATAR-DPL",
    title: "Qatar Data Privacy Consent Registry Update",
    description:
      "Review and update consent records and data processing registrations to align with Qatar's Law No. 13 privacy obligations.",
    deadlineDate: d(30),
    jurisdiction: "Qatar",
    priority: "medium",
    status: "upcoming",
    notificationsSent: null,
    assignedToUserId: null,
    completedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 36,
    organizationId: null,
    frameworkCode: "KUWAIT-PDPL",
    title: "Kuwait CITRA Resolution 42 Security Audit",
    description:
      "Perform security safeguard audit and update processing notifications as required by CITRA for licensed service providers.",
    deadlineDate: d(25),
    jurisdiction: "Kuwait",
    priority: "medium",
    status: "upcoming",
    notificationsSent: null,
    assignedToUserId: null,
    completedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 37,
    organizationId: null,
    frameworkCode: "BAHRAIN-PDPL",
    title: "Bahrain PDPL Data Protection Registration",
    description:
      "Register or renew data processing with the Bahrain Personal Data Protection Authority and update Data Protection Officer details.",
    deadlineDate: d(20),
    jurisdiction: "Bahrain",
    priority: "high",
    status: "upcoming",
    notificationsSent: null,
    assignedToUserId: null,
    completedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 38,
    organizationId: null,
    frameworkCode: "THAILAND-PDPA",
    title: "Thailand PDPA Cross-Border Transfer Assessment",
    description:
      "Conduct transfer impact assessment for personal data sent abroad and document adequacy safeguards under Thailand's PDPA.",
    deadlineDate: d(35),
    jurisdiction: "Thailand",
    priority: "high",
    status: "upcoming",
    notificationsSent: null,
    assignedToUserId: null,
    completedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 39,
    organizationId: null,
    frameworkCode: "INDONESIA-PDP",
    title: "Indonesia UU PDP DPO Appointment",
    description:
      "Appoint or confirm Data Protection Officer registration with Kominfo and document internal data protection policies.",
    deadlineDate: d(40),
    jurisdiction: "Indonesia",
    priority: "high",
    status: "upcoming",
    notificationsSent: null,
    assignedToUserId: null,
    completedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 40,
    organizationId: null,
    frameworkCode: "MALAYSIA-PDPA",
    title: "Malaysia PDPA Data User Registration",
    description:
      "Renew or submit data user registration certificate with the PDP Commissioner for classified processing activities.",
    deadlineDate: d(15),
    jurisdiction: "Malaysia",
    priority: "medium",
    status: "upcoming",
    notificationsSent: null,
    assignedToUserId: null,
    completedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 41,
    organizationId: null,
    frameworkCode: "PHILIPPINES-DPA",
    title: "Philippines DPA Breach Notification Exercise",
    description:
      "Complete NPC breach notification drill and verify 72-hour notification readiness for unauthorized data access incidents.",
    deadlineDate: d(28),
    jurisdiction: "Philippines",
    priority: "high",
    status: "upcoming",
    notificationsSent: null,
    assignedToUserId: null,
    completedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 42,
    organizationId: null,
    frameworkCode: "VIETNAM-PDPD",
    title: "Vietnam PDPD Data Localization Compliance",
    description:
      "Verify that Vietnamese user personal data is stored in accordance with Decree 13 localization requirements and document processing purposes.",
    deadlineDate: d(50),
    jurisdiction: "Vietnam",
    priority: "critical",
    status: "upcoming",
    notificationsSent: null,
    assignedToUserId: null,
    completedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 43,
    organizationId: null,
    frameworkCode: "NIGERIA-NDPA",
    title: "Nigeria NDPA DPIA Submission",
    description:
      "Submit high-risk processing Data Protection Impact Assessment to NDPC and appoint/confirm Data Protection Officer registration.",
    deadlineDate: d(30),
    jurisdiction: "Nigeria",
    priority: "high",
    status: "upcoming",
    notificationsSent: null,
    assignedToUserId: null,
    completedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 44,
    organizationId: null,
    frameworkCode: "KENYA-DPA",
    title: "Kenya DPA Controller Registration",
    description:
      "Register or renew data controller/processor registration with the ODPC and file annual data protection compliance self-assessment.",
    deadlineDate: d(20),
    jurisdiction: "Kenya",
    priority: "high",
    status: "upcoming",
    notificationsSent: null,
    assignedToUserId: null,
    completedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 45,
    organizationId: null,
    frameworkCode: "OMAN-PDPL",
    title: "Oman PDPL Data Protection Policy Review",
    description:
      "Review and update personal data processing policy and consent mechanisms in compliance with Royal Decree 6/2022.",
    deadlineDate: d(35),
    jurisdiction: "Oman",
    priority: "medium",
    status: "upcoming",
    notificationsSent: null,
    assignedToUserId: null,
    completedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 46,
    organizationId: null,
    frameworkCode: "JORDAN-PDP",
    title: "Jordan PDP Controller Registration",
    description:
      "File data controller registration with the Ministry of Digital Economy and Entrepreneurship for processing operations in Jordan.",
    deadlineDate: d(40),
    jurisdiction: "Jordan",
    priority: "medium",
    status: "upcoming",
    notificationsSent: null,
    assignedToUserId: null,
    completedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 47,
    organizationId: null,
    frameworkCode: "EGYPT-DPL",
    title: "Egypt DPL Cross-Border Data Transfer License",
    description:
      "Apply for or renew cross-border data transfer license with the Personal Data Protection Centre for international data flows.",
    deadlineDate: d(55),
    jurisdiction: "Egypt",
    priority: "high",
    status: "upcoming",
    notificationsSent: null,
    assignedToUserId: null,
    completedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
];

const memoryDeadlines: ComplianceDeadline[] = [...GLOBAL_DEADLINES];
let nextId = GLOBAL_DEADLINES.length + 1;

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------
export type DeadlineFilters = {
  organizationId?: number | null;
  jurisdiction?: (typeof DEADLINE_JURISDICTIONS)[number];
  status?: "upcoming" | "overdue" | "completed" | "waived";
  frameworkCode?: string;
  limit?: number;
  includeGlobal?: boolean;
};

export async function listDeadlines(
  filters: DeadlineFilters = {}
): Promise<ComplianceDeadline[]> {
  const db = await getDb();
  const limit = filters.limit ?? 200;

  if (!db) {
    let rows = [...memoryDeadlines];
    if (filters.status) rows = rows.filter(r => r.status === filters.status);
    if (filters.jurisdiction)
      rows = rows.filter(
        r =>
          r.jurisdiction === filters.jurisdiction || r.jurisdiction === "Both"
      );
    if (filters.frameworkCode)
      rows = rows.filter(r => r.frameworkCode === filters.frameworkCode);
    // Filter by org: include org-specific + global (null)
    if (filters.organizationId != null) {
      rows = rows.filter(
        r =>
          r.organizationId === filters.organizationId ||
          r.organizationId === null
      );
    }
    return rows.slice(0, limit);
  }

  const conditions = [];
  if (filters.status)
    conditions.push(eq(complianceDeadlines.status, filters.status));
  if (filters.jurisdiction)
    conditions.push(eq(complianceDeadlines.jurisdiction, filters.jurisdiction));
  if (filters.frameworkCode)
    conditions.push(
      eq(complianceDeadlines.frameworkCode, filters.frameworkCode)
    );
  // Org isolation: show only this org's deadlines + global (null) deadlines
  if (filters.organizationId != null) {
    conditions.push(
      or(
        eq(complianceDeadlines.organizationId, filters.organizationId),
        isNull(complianceDeadlines.organizationId)
      )!
    );
  }

  const rows = await db
    .select()
    .from(complianceDeadlines)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(complianceDeadlines.deadlineDate))
    .limit(limit);

  return rows;
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------
export type CreateDeadlineInput = {
  organizationId?: number | null;
  frameworkCode: string;
  title: string;
  description?: string;
  deadlineDate: Date;
  jurisdiction: (typeof DEADLINE_JURISDICTIONS)[number];
  priority?: "low" | "medium" | "high" | "critical";
  assignedToUserId?: number | null;
};

export async function createDeadline(
  input: CreateDeadlineInput
): Promise<ComplianceDeadline> {
  const db = await getDb();
  const now = new Date();
  const isOverdue = input.deadlineDate < now;

  if (!db) {
    const record: ComplianceDeadline = {
      id: nextId++,
      organizationId: input.organizationId ?? null,
      frameworkCode: input.frameworkCode,
      title: input.title.trim(),
      description: input.description?.trim() ?? null,
      deadlineDate: input.deadlineDate,
      jurisdiction: input.jurisdiction,
      priority: input.priority ?? "medium",
      status: isOverdue ? "overdue" : "upcoming",
      notificationsSent: null,
      assignedToUserId: input.assignedToUserId ?? null,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    memoryDeadlines.push(record);
    return record;
  }

  const values: InsertComplianceDeadline = {
    organizationId: input.organizationId ?? null,
    frameworkCode: input.frameworkCode,
    title: input.title.trim(),
    description: input.description?.trim() ?? null,
    deadlineDate: input.deadlineDate,
    jurisdiction: input.jurisdiction,
    priority: input.priority ?? "medium",
    status: isOverdue ? "overdue" : "upcoming",
    assignedToUserId: input.assignedToUserId ?? null,
  };

  const [inserted] = await db
    .insert(complianceDeadlines)
    .values(values)
    .returning({ id: complianceDeadlines.id });
  const id = inserted?.id ?? 0;
  const [row] = await db
    .select()
    .from(complianceDeadlines)
    .where(eq(complianceDeadlines.id, id))
    .limit(1);
  return row!;
}

// ---------------------------------------------------------------------------
// Complete
// ---------------------------------------------------------------------------
export async function completeDeadline(
  id: number,
  organizationId: number | null
): Promise<ComplianceDeadline | null> {
  const db = await getDb();
  const now = new Date();

  if (!db) {
    const idx = memoryDeadlines.findIndex(
      d =>
        d.id === id &&
        (d.organizationId === organizationId || d.organizationId === null)
    );
    if (idx < 0) return null;
    memoryDeadlines[idx] = {
      ...memoryDeadlines[idx]!,
      status: "completed",
      completedAt: now,
      updatedAt: now,
    };
    return memoryDeadlines[idx]!;
  }

  const whereClause =
    organizationId != null
      ? and(
          eq(complianceDeadlines.id, id),
          eq(complianceDeadlines.organizationId, organizationId)
        )
      : eq(complianceDeadlines.id, id);

  await db
    .update(complianceDeadlines)
    .set({ status: "completed", completedAt: now })
    .where(whereClause);

  const [row] = await db
    .select()
    .from(complianceDeadlines)
    .where(eq(complianceDeadlines.id, id))
    .limit(1);
  return row ?? null;
}

// ---------------------------------------------------------------------------
// Stats summary
// ---------------------------------------------------------------------------
export type DeadlineSummary = {
  total: number;
  upcoming: number;
  overdue: number;
  completed: number;
  critical: number;
};

export async function getDeadlineSummary(
  organizationId?: number | null
): Promise<DeadlineSummary> {
  const all = await listDeadlines({ organizationId, limit: 1000 });
  return {
    total: all.length,
    upcoming: all.filter(d => d.status === "upcoming").length,
    overdue: all.filter(d => d.status === "overdue").length,
    completed: all.filter(d => d.status === "completed").length,
    critical: all.filter(
      d => d.priority === "critical" && d.status !== "completed"
    ).length,
  };
}

// ---------------------------------------------------------------------------
// Org members for deadline assignment
// ---------------------------------------------------------------------------
export type OrgMemberForAssignment = {
  id: number;
  name: string;
  email: string;
  role: string;
};

/**
 * Returns active OAuth members of the given org, suitable for deadline assignment dropdowns.
 * Skips local-auth-only members since assignedToUserId references the OAuth users table.
 */
export async function listOrgMembersForDeadlines(
  organizationId: number | null | undefined
): Promise<OrgMemberForAssignment[]> {
  if (!organizationId || organizationId < 0) return [];
  const db = await getDb();
  if (!db) return [];

  const rows = await db
    .select({
      userId: organizationMembers.userId,
      role: organizationMembers.role,
      userName: users.name,
      userEmail: users.email,
    })
    .from(organizationMembers)
    .leftJoin(users, eq(organizationMembers.userId, users.id))
    .where(
      and(
        eq(organizationMembers.organizationId, organizationId),
        eq(organizationMembers.status, "active")
      )
    );

  return rows
    .filter(r => r.userId !== null)
    .map(r => ({
      id: r.userId!,
      name: r.userName ?? r.userEmail ?? `User ${r.userId}`,
      email: r.userEmail ?? "",
      role: r.role,
    }));
}
