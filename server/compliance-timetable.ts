export type ComplianceFrequency =
  | "immediate"
  | "within_2h"
  | "within_24h"
  | "within_30d"
  | "within_45d"
  | "within_48h"
  | "within_72h"
  | "monthly"
  | "quarterly"
  | "semi_annual"
  | "annual"
  | "ongoing";

export type ComplianceRiskLevel = "critical" | "high" | "medium" | "low";

export type ComplianceObligation = {
  id: string;
  country: string;
  framework: string;
  requirement: string;
  frequency: ComplianceFrequency;
  riskLevel: ComplianceRiskLevel;
  deadline?: string; // specific date or month (e.g., "Jan 31", "Sept 14")
  authority: string;
  description: string;
  references: string[];
};

export type ComplianceComparisonRow = {
  topic: string;
  saudiArabia: string;
  china: string;
  eu?: string;
  us?: string;
  brazil?: string;
  notes: string;
};

const COMPLIANCE_OBLIGATIONS: ComplianceObligation[] = [
  // ── Saudi Arabia ───────────────────────────────────────────────
  {
    id: "sa-pdpl-enforcement",
    country: "Saudi Arabia",
    framework: "PDPL",
    requirement: "Full PDPL Compliance Active",
    frequency: "ongoing",
    riskLevel: "critical",
    deadline: "Sept 14, 2024",
    authority: "SDAIA",
    description:
      "Full enforcement of the Personal Data Protection Law began September 14, 2024. All controllers and processors must have compliant data-processing practices, DPO appointments where required, and PIAs in place.",
    references: [
      "Saudi Personal Data Protection Law (2021, enforced 2024)",
      "SDAIA Implementing Regulations",
    ],
  },
  {
    id: "sa-ecc-self-assessment",
    country: "Saudi Arabia",
    framework: "ECC",
    requirement: "ECC Self-Assessment Submission",
    frequency: "annual",
    authority: "NCA",
    riskLevel: "high",
    description:
      "Annual submission of Essential Cybersecurity Controls compliance status via NCA's Haseen tool. Entities must assess all 114 controls across 5 domains and document evidence of compliance.",
    references: [
      "NCA Essential Cybersecurity Controls (ECC-1:2018)",
      "NCA Haseen Tool",
    ],
  },
  {
    id: "sa-internal-audit",
    country: "Saudi Arabia",
    framework: "ECC",
    requirement: "Annual Internal Cybersecurity Audit",
    frequency: "annual",
    authority: "NCA",
    riskLevel: "high",
    description:
      "Mandatory annual independent internal review of cybersecurity control effectiveness across all ECC domains. Audit findings and remediation plans must be documented.",
    references: ["NCA Essential Cybersecurity Controls (ECC-1:2018)"],
  },
  {
    id: "sa-vulnerability-scan",
    country: "Saudi Arabia",
    framework: "ECC",
    requirement: "Vulnerability Assessment",
    frequency: "quarterly",
    authority: "NCA",
    riskLevel: "medium",
    description:
      "Quarterly vulnerability scanning of critical systems and applications is recommended. Results must be tracked with severity-based remediation deadlines.",
    references: ["NCA ECC-1:2018 Domain 2 — Defense Controls"],
  },
  {
    id: "sa-incident-report",
    country: "Saudi Arabia",
    framework: "NCA / PDPL",
    requirement: "Cybersecurity Incident Reporting",
    frequency: "immediate",
    authority: "NCA / SDAIA",
    riskLevel: "critical",
    description:
      "Significant cybersecurity incidents must be reported immediately to the NCA. Personal data breaches must be notified to SDAIA within 72 hours and to affected data subjects if harm is likely.",
    references: ["NCA Legal Powers (Royal Decree M/117, 2024)", "Saudi PDPL"],
  },
  {
    id: "sa-pdpl-breach-notify",
    country: "Saudi Arabia",
    framework: "PDPL",
    requirement: "Personal Data Breach Notification to SDAIA",
    frequency: "within_72h",
    authority: "SDAIA",
    riskLevel: "critical",
    description:
      "Controllers must notify SDAIA of personal data breaches within 72 hours of discovery. Notification must include nature of breach, estimated number of affected individuals, and interim containment measures.",
    references: [
      "Saudi PDPL Article on breach notification",
      "SDAIA Implementing Regulations",
    ],
  },
  {
    id: "sa-penetration-test",
    country: "Saudi Arabia",
    framework: "ECC",
    requirement: "Penetration Testing",
    frequency: "annual",
    authority: "NCA",
    riskLevel: "high",
    description:
      "Annual penetration testing of critical systems and internet-facing applications is required. Testing must be conducted by qualified teams and remediation tracked.",
    references: [
      "NCA ECC-1:2018",
      "NCA Critical Systems Cybersecurity Controls (CSCC-1:2019)",
    ],
  },
  {
    id: "sa-bcp-drill",
    country: "Saudi Arabia",
    framework: "ECC",
    requirement: "Business Continuity / DR Drill",
    frequency: "annual",
    authority: "NCA",
    riskLevel: "medium",
    description:
      "Annual testing of business continuity and disaster recovery plans through tabletop exercises or full drills. Results and remediation actions must be documented.",
    references: ["NCA ECC-1:2018 Domain 3 — Resilience Controls"],
  },

  // ── China ──────────────────────────────────────────────────────
  {
    id: "cn-csl-2026",
    country: "China",
    framework: "CSL",
    requirement: "CSL 2026 Amendment Compliance",
    frequency: "ongoing",
    riskLevel: "critical",
    deadline: "Jan 1, 2026",
    authority: "CAC",
    description:
      "New CSL amendments effective January 1, 2026. Organizations must update penalty exposure models, executive accountability frameworks, and vulnerability management timelines to comply with significantly increased penalties.",
    references: ["Cybersecurity Law of the PRC — 2026 Amendments"],
  },
  {
    id: "cn-mlps-level3-assessment",
    country: "China",
    framework: "MLPS 2.0",
    requirement: "MLPS Level 3 Annual Assessment",
    frequency: "annual",
    authority: "MPS",
    riskLevel: "critical",
    description:
      "Systems classified at MLPS Level 3 must undergo annual third-party security assessment by a licensed evaluation agency. Results must be submitted to the local MPS bureau.",
    references: ["GB/T 22239-2019 MLPS 2.0", "CSL Article 21"],
  },
  {
    id: "cn-mlps-level4-assessment",
    country: "China",
    framework: "MLPS 2.0",
    requirement: "MLPS Level 4 Semi-Annual Assessment",
    frequency: "semi_annual",
    authority: "MPS",
    riskLevel: "critical",
    description:
      "Systems classified at MLPS Level 4 must undergo semi-annual (every 6 months) third-party assessment by a licensed evaluation agency. Higher scrutiny and more frequent MPS reporting apply.",
    references: ["GB/T 22239-2019 MLPS 2.0"],
  },
  {
    id: "cn-minors-data-audit",
    country: "China",
    framework: "PIPL",
    requirement: "Minors' Data Annual Compliance Report",
    frequency: "annual",
    riskLevel: "high",
    deadline: "Jan 31",
    authority: "CAC",
    description:
      "Entities processing personal information of children under 14 must submit an annual compliance report to the CAC by January 31 each year. The report must cover processing purpose, volume, and safeguard measures.",
    references: [
      "PIPL Chapter on Minors",
      "CAC Regulations on Minors' Online Protection",
    ],
  },
  {
    id: "cn-important-data-report",
    country: "China",
    framework: "DSL",
    requirement: "Important Data Annual Security Report",
    frequency: "annual",
    authority: "Sectoral Regulator / CAC",
    riskLevel: "high",
    description:
      "Entities designated as handlers of 'Important Data' must submit an annual data security assessment report to their sectoral regulator. The report covers data processing activities, risk landscape, and protective measures.",
    references: [
      "Data Security Law (DSL) Chapter IV",
      "CAC Network Data Security Management Regulations (2025)",
    ],
  },
  {
    id: "cn-incident-initial",
    country: "China",
    framework: "CSL / MLPS",
    requirement: "Cybersecurity Incident Initial Report",
    frequency: "within_2h",
    authority: "CAC / MPS",
    riskLevel: "critical",
    description:
      "Major cybersecurity incidents must be reported to CAC and relevant authorities within 2 hours of discovery. Initial report must include incident type, affected systems scope, and immediate containment actions.",
    references: [
      "CSL Article 25",
      "GB/T 22239-2019 MLPS 2.0 Operations Controls",
    ],
  },
  {
    id: "cn-incident-detailed",
    country: "China",
    framework: "CSL / MLPS",
    requirement: "Cybersecurity Incident Detailed Report",
    frequency: "within_24h",
    authority: "CAC / MPS",
    riskLevel: "critical",
    description:
      "A full technical incident report must be submitted within 24 hours of initial discovery. Must include root cause, full impact scope, remediation actions taken, and recovery timeline.",
    references: ["CSL Article 25", "MLPS 2.0 Operations Security Controls"],
  },
  {
    id: "cn-vulnerability-report",
    country: "China",
    framework: "CSL",
    requirement: "Vulnerability Disclosure to Authorities",
    frequency: "within_48h",
    authority: "MIIT / CAC / MPS",
    riskLevel: "high",
    description:
      "Discovered cybersecurity vulnerabilities must be reported to the MIIT/CAC/MPS joint disclosure portal within 48 hours. Penalties for delayed or withheld disclosures significantly increased under the 2026 CSL amendments.",
    references: [
      "CSL Chapter IV — Network Operations Security",
      "MIIT Vulnerability Management Regulations (2021)",
      "CSL 2026 Amendments",
    ],
  },
  {
    id: "cn-piia-before-processing",
    country: "China",
    framework: "PIPL",
    requirement: "Personal Information Impact Assessment (PIIA)",
    frequency: "ongoing",
    authority: "CAC",
    riskLevel: "high",
    description:
      "A PIIA must be completed before initiating high-risk PI processing, including sensitive PI processing, automated profiling, and overseas transfers. PIIA records must be retained for at least three years.",
    references: [
      "PIPL Article 55",
      "CAC Standard Contract for Cross-Border PI Transfer (2022)",
    ],
  },
  {
    id: "cn-cross-border-assessment",
    country: "China",
    framework: "PIPL / CSL",
    requirement: "CAC Cross-Border Data Transfer Assessment",
    frequency: "ongoing",
    authority: "CAC",
    riskLevel: "critical",
    description:
      "CIIOs, large-scale PI processors (>1 million individuals), or exporters of 'important data' must complete a CAC security assessment before each overseas transfer. Assessment validity is typically 2 years.",
    references: [
      "PIPL Article 38-40",
      "CSL Article 37",
      "CAC Measures for Data Export Security Assessment (2022, updated 2024)",
    ],
  },
  {
    id: "sa-privacy-notice",
    country: "Saudi Arabia",
    framework: "PDPL",
    requirement: "Privacy Notice Publication",
    frequency: "annual",
    authority: "SDAIA",
    riskLevel: "low",
    description:
      "Organisations processing personal data must publish a clear privacy notice describing the types of data collected, purposes of processing, and data subject rights. Annual review is recommended as a best practice to ensure accuracy.",
    references: [
      "PDPL Article 11",
      "SDAIA Implementing Regulations (2023) Article 6",
    ],
  },

  // ── EU / GDPR ─────────────────────────────────────────────────
  {
    id: "eu-gdpr-right-to-erasure",
    country: "EU",
    framework: "GDPR",
    requirement: "Right to Erasure (Right to be Forgotten)",
    frequency: "within_30d",
    authority: "EDPB / National DPA",
    riskLevel: "high",
    description:
      "Under GDPR Art. 17, data subjects have the right to obtain erasure of personal data without undue delay. Controllers must respond within 30 days (extendable to 60 for complex requests).",
    references: ["GDPR Art. 17", "EDPB Guidelines on Right to Erasure"],
  },
  {
    id: "eu-gdpr-dpo-appointment",
    country: "EU",
    framework: "GDPR",
    requirement: "Data Protection Officer (DPO) Appointment",
    frequency: "ongoing",
    authority: "EDPB / National DPA",
    riskLevel: "high",
    description:
      "Under GDPR Art. 37, public authorities, organizations engaged in large-scale systematic monitoring, or large-scale processing of special categories must appoint a DPO. The DPO must be independent and report to highest management.",
    references: ["GDPR Art. 37-39", "EDPB DPO Guidelines"],
  },
  {
    id: "eu-gdpr-breach-notification",
    country: "EU",
    framework: "GDPR",
    requirement: "Personal Data Breach Notification",
    frequency: "within_72h",
    authority: "EDPB / National DPA",
    riskLevel: "critical",
    description:
      "Under GDPR Art. 33, controllers must notify the supervisory authority of a personal data breach within 72 hours of becoming aware. Data subjects must be notified under Art. 34 if high risk to rights and freedoms.",
    references: ["GDPR Art. 33-34", "EDPB Guidelines on Breach Notification"],
  },
  {
    id: "eu-gdpr-dpa-requirement",
    country: "EU",
    framework: "GDPR",
    requirement: "Data Processing Agreement (DPA) in Place",
    frequency: "ongoing",
    authority: "EDPB / National DPA",
    riskLevel: "high",
    description:
      "Under GDPR Art. 28, controllers must enter into a written DPA with each processor. The DPA must specify subject-matter, duration, nature and purpose of processing, data types, and processor obligations.",
    references: ["GDPR Art. 28", "EDPB Guidelines on Processor Relationships"],
  },
  {
    id: "eu-gdpr-cross-border-transfer",
    country: "EU",
    framework: "GDPR",
    requirement: "Cross-Border Transfer Compliance (SCCs / Adequacy)",
    frequency: "ongoing",
    authority: "EDPB / National DPA",
    riskLevel: "critical",
    description:
      "Transfers to third countries require an adequacy decision (Art. 45), SCCs (Art. 46), BCRs, or derogations (Art. 49). Transfer Impact Assessments required for SCC-based transfers. Schrems II ruling requires case-by-case assessment.",
    references: [
      "GDPR Art. 44-49",
      "Schrems II Decision",
      "EDPB Recommendations on Supplementary Measures",
    ],
  },

  // ── US / CCPA + HIPAA ──────────────────────────────────────────
  {
    id: "us-ccpa-right-to-know",
    country: "US",
    framework: "CCPA",
    requirement: "Consumer Right to Know",
    frequency: "within_45d",
    authority: "California AG / FTC",
    riskLevel: "high",
    description:
      "Under CCPA, consumers have the right to request disclosure of categories and specific pieces of personal information collected. Businesses must respond within 45 days (extendable to 90 with notice).",
    references: ["CCPA Civil Code §1798.110", "CCPA Regulations"],
  },
  {
    id: "us-ccpa-right-to-delete",
    country: "US",
    framework: "CCPA",
    requirement: "Consumer Right to Delete Personal Information",
    frequency: "within_45d",
    authority: "California AG / FTC",
    riskLevel: "high",
    description:
      "Under CCPA, consumers may request deletion of personal information collected. Businesses must delete and direct service providers to delete unless statutory exceptions apply.",
    references: ["CCPA Civil Code §1798.105", "CPRA Amendments"],
  },
  {
    id: "us-ccpa-opt-out",
    country: "US",
    framework: "CCPA",
    requirement: "Right to Opt-Out of Sale or Sharing",
    frequency: "ongoing",
    authority: "California AG / FTC",
    riskLevel: "medium",
    description:
      "Businesses must provide a clear 'Do Not Sell or Share My Personal Information' link. Opt-out requests must be honored for at least 12 months. Must not discriminate against consumers who exercise rights.",
    references: ["CCPA Civil Code §1798.120", "CCPA Regulations §999.315"],
  },
  {
    id: "us-ccpa-non-discrimination",
    country: "US",
    framework: "CCPA",
    requirement: "Non-Discrimination for Exercising Rights",
    frequency: "ongoing",
    authority: "California AG / FTC",
    riskLevel: "medium",
    description:
      "Businesses may not discriminate against consumers for exercising CCPA rights including denying goods, charging different prices, or providing different quality. Financial incentives permitted with notice and consent.",
    references: ["CCPA Civil Code §1798.125"],
  },

  // ── Brazil / LGPD ──────────────────────────────────────────────
  {
    id: "br-lgpd-consent",
    country: "Brazil",
    framework: "LGPD",
    requirement: "Consent Requirements for Processing",
    frequency: "ongoing",
    authority: "ANPD",
    riskLevel: "high",
    description:
      "Under LGPD Art. 8, consent must be freely given, specific, informed, and unambiguous. Consent for sensitive data (Art. 11) requires specific and prominent consent. Processing must cease upon withdrawal.",
    references: ["LGPD Art. 7-8", "LGPD Art. 11", "ANPD Guidelines"],
  },
  {
    id: "br-lgpd-dpo",
    country: "Brazil",
    framework: "LGPD",
    requirement: "Data Protection Officer (DPO) Appointment",
    frequency: "ongoing",
    authority: "ANPD",
    riskLevel: "high",
    description:
      "Under LGPD Art. 41, the controller must appoint a DPO. The DPO handles complaints, receives communications from ANPD, trains staff, and executes compliance activities. Identity and contact must be publicly published.",
    references: ["LGPD Art. 41", "ANPD DPO Guidelines"],
  },
  {
    id: "br-lgpd-breach-notification",
    country: "Brazil",
    framework: "LGPD",
    requirement: "Security Incident Notification to ANPD",
    frequency: "within_72h",
    authority: "ANPD",
    riskLevel: "critical",
    description:
      "Under LGPD Art. 48, controllers must notify ANPD of any security incident that may create risk or relevant damage within a reasonable time. Affected data subjects must also be notified if significant risk.",
    references: ["LGPD Art. 48", "ANPD Incident Reporting Regulations"],
  },
  {
    id: "br-lgpd-international-transfer",
    country: "Brazil",
    framework: "LGPD",
    requirement: "International Transfer Compliance",
    frequency: "ongoing",
    authority: "ANPD",
    riskLevel: "high",
    description:
      "International transfers under LGPD Art. 33 require adequacy decision by ANPD, SCCs, BCRs, or consent. Organizations must assess and document recipient country data protection levels.",
    references: ["LGPD Art. 33-36", "ANPD International Transfer Guidelines"],
  },
  {
    id: "br-lgpd-data-subject-rights",
    country: "Brazil",
    framework: "LGPD",
    requirement: "Data Subject Rights Implementation",
    frequency: "ongoing",
    authority: "ANPD",
    riskLevel: "medium",
    description:
      "Under LGPD Art. 18, data subjects have rights to confirmation of processing, access, correction, anonymization, portability, deletion, and information about shared entities. Controllers must respond within 15 days.",
    references: ["LGPD Art. 18-22", "ANPD Enforcement Guidelines"],
  },
  {
    id: "uk-gdpr-ico-notification",
    country: "United Kingdom",
    framework: "UK-GDPR",
    requirement: "ICO Breach Notification (72 hours)",
    frequency: "within_72h",
    authority: "ICO",
    riskLevel: "critical",
    description:
      "Under UK GDPR Article 33, controllers must notify the ICO of personal data breaches within 72 hours unless the breach is unlikely to result in risk to individuals. Data subjects must be notified where high risk.",
    references: ["UK GDPR Art. 33-34", "ICO Breach Reporting Guidance"],
  },
  {
    id: "uk-gdpr-idta-transfers",
    country: "United Kingdom",
    framework: "UK-GDPR",
    requirement: "UK IDTA for International Transfers",
    frequency: "ongoing",
    authority: "ICO",
    riskLevel: "high",
    description:
      "Transfers to third countries require UK adequacy regulations, the UK International Data Transfer Agreement (IDTA), or recognised safeguards under Article 46.",
    references: [
      "UK GDPR Art. 44-49",
      "UK IDTA",
      "ICO Transfer Risk Assessment",
    ],
  },
  {
    id: "uk-gdpr-dpo-representative",
    country: "United Kingdom",
    framework: "UK-GDPR",
    requirement: "UK Representative for Non-UK Controllers",
    frequency: "ongoing",
    authority: "ICO",
    riskLevel: "medium",
    description:
      "Non-UK controllers offering goods or services in the UK must appoint a UK representative per UK GDPR Article 27.",
    references: ["UK GDPR Art. 27", "ICO Representative Guidance"],
  },
  {
    id: "ca-pipeda-breach",
    country: "Canada",
    framework: "PIPEDA",
    requirement: "Material Breach Reporting to OPC",
    frequency: "ongoing",
    authority: "OPC",
    riskLevel: "high",
    description:
      "Report material breaches to the OPC and notify affected individuals where real risk of significant harm exists; maintain breach records.",
    references: ["PIPEDA Part 1.1", "OPC Breach Guidance"],
  },
  {
    id: "au-app-ndb",
    country: "Australia",
    framework: "PRIVACY-ACT-AU",
    requirement: "Notifiable Data Breach Reporting",
    frequency: "ongoing",
    authority: "OAIC",
    riskLevel: "high",
    description:
      "Notify the OAIC and affected individuals when a data breach is likely to result in serious harm; assess eligibility without unreasonable delay.",
    references: ["Privacy Act 1988 Part IIIC", "OAIC NDB Guidance"],
  },
  {
    id: "au-app-cross-border",
    country: "Australia",
    framework: "PRIVACY-ACT-AU",
    requirement: "APP 8 Cross-Border Disclosure",
    frequency: "ongoing",
    authority: "OAIC",
    riskLevel: "high",
    description:
      "Before disclosing personal information overseas, ensure the recipient is covered by the APPs or an enforceable mechanism, or obtain consent.",
    references: ["APP 8", "OAIC Cross-Border Disclosure Guidance"],
  },
  {
    id: "jp-appi-breach",
    country: "Japan",
    framework: "APPI",
    requirement: "PPC Breach Reporting",
    frequency: "ongoing",
    authority: "PPC",
    riskLevel: "high",
    description:
      "Report qualifying breaches (risk to rights and interests) to the Personal Information Protection Commission and notify affected data subjects.",
    references: ["APPI Art. 32-33", "PPC Guidelines"],
  },
  {
    id: "jp-appi-cross-border",
    country: "Japan",
    framework: "APPI",
    requirement: "APPI Cross-Border Provision Rules",
    frequency: "ongoing",
    authority: "PPC",
    riskLevel: "high",
    description:
      "Disclose the destination country and obtain consent, or rely on safeguards, before providing personal data to third parties in foreign countries.",
    references: ["APPI Art. 28", "PPC Transfer Guidelines"],
  },
  {
    id: "kr-pipa-breach",
    country: "South Korea",
    framework: "PIPA-KR",
    requirement: "PIPC Breach Notification",
    frequency: "ongoing",
    authority: "PIPC",
    riskLevel: "high",
    description:
      "Notify the PIPC and affected data subjects of personal information breaches without delay, and submit follow-up reports where required.",
    references: ["PIPA Art. 34", "PIPC Enforcement Guidelines"],
  },
  {
    id: "sg-pdpa-breach",
    country: "Singapore",
    framework: "PDPA-SG",
    requirement: "Notifiable Data Breach Reporting",
    frequency: "ongoing",
    authority: "PDPC",
    riskLevel: "high",
    description:
      "Assess whether a breach is notifiable and inform the PDPC and affected individuals of breaches that result in significant harm.",
    references: ["PDPA Part VIA", "PDPC Breach Guidelines"],
  },
  {
    id: "sg-pdpa-dpo",
    country: "Singapore",
    framework: "PDPA-SG",
    requirement: "Data Protection Officer Appointment",
    frequency: "ongoing",
    authority: "PDPC",
    riskLevel: "medium",
    description:
      "Organisations must designate at least one Data Protection Officer and make their business contact publicly available.",
    references: ["PDPA Schedule 1", "PDPC DPO Guidance"],
  },
  {
    id: "in-dpdp-breach",
    country: "India",
    framework: "DPDP-IN",
    requirement: "DPDP Act Breach Notification",
    frequency: "ongoing",
    authority: "Data Protection Board",
    riskLevel: "high",
    description:
      "Notify the Data Protection Board of India and affected data principals of personal data breaches per the DPDP Act rules.",
    references: ["DPDP Act 2023 S.8", "MeitY Rules"],
  },
  {
    id: "za-popia-breach",
    country: "South Africa",
    framework: "POPIA",
    requirement: "POPIA Security Compromise Notification",
    frequency: "ongoing",
    authority: "Information Regulator",
    riskLevel: "high",
    description:
      "Notify the Information Regulator and affected data subjects of security compromises per POPIA Section 22, including the identity of all affected parties.",
    references: ["POPIA S.22", "Information Regulator Guidance"],
  },
  {
    id: "za-popia-info-officer",
    country: "South Africa",
    framework: "POPIA",
    requirement: "Information Officer Registration",
    frequency: "annual",
    authority: "Information Regulator",
    riskLevel: "medium",
    description:
      "Responsible parties must register an Information Officer and maintain a POPIA compliance framework.",
    references: ["POPIA S.55", "Information Regulator Registration"],
  },
  {
    id: "mx-lfpdp-breach",
    country: "Mexico",
    framework: "MEXICO-DPA",
    requirement: "INAI Breach Notification",
    frequency: "ongoing",
    authority: "INAI",
    riskLevel: "high",
    description:
      "Notify INAI and affected data owners of significant security breaches without delay, including scope and corrective actions.",
    references: ["LFPDPPP Art. 20", "INAI Guidance"],
  },
  {
    id: "ae-pdpl-breach",
    country: "United Arab Emirates",
    framework: "ISO-27701",
    requirement: "UAE PDPL Breach Notification",
    frequency: "ongoing",
    authority: "UAE Federal Authority",
    riskLevel: "high",
    description:
      "Under UAE Federal Decree-Law No. 45 of 2021, controllers must notify authorities and data subjects of personal data breaches and security incidents.",
    references: ["UAE PDPL Law", "DIFC/ADGM local rules"],
  },
];

const COMPARISON_TABLE: ComplianceComparisonRow[] = [
  {
    topic: "Primary Cybersecurity Law",
    saudiArabia:
      "NCA Statute (2017, amended 2021) + Legal Powers (Royal Decree M/117, 2024)",
    china: "Cybersecurity Law (CSL) — amended 2026",
    notes:
      "Both countries have dedicated national cybersecurity laws with binding enforcement.",
  },
  {
    topic: "Core Control Framework",
    saudiArabia:
      "Essential Cybersecurity Controls (ECC-1:2018) — 5 domains, 114 controls",
    china:
      "Multi-Level Protection Scheme (MLPS 2.0 / GB/T 22239-2019) — 5 protection levels",
    notes:
      "ECC is mandatory for all Saudi entities; MLPS 2.0 grades systems by risk level.",
  },
  {
    topic: "Personal Data Privacy Law",
    saudiArabia:
      "Personal Data Protection Law (PDPL) — SDAIA, enforced Sept 2024",
    china:
      "Personal Information Protection Law (PIPL) — CAC, effective Nov 2021",
    notes:
      "Both align closely with GDPR principles: lawful basis, consent, rights, DPO/PIPO.",
  },
  {
    topic: "Data Classification",
    saudiArabia:
      "PDPL classifies: General / Sensitive categories (health, biometric, financial)",
    china: "DSL classifies: General / Important / Core data tiers",
    notes:
      "China's 3-tier DSL model is broader; Saudi focuses on personal data sensitivity levels.",
  },
  {
    topic: "Data Localization",
    saudiArabia:
      "Government and sensitive data must remain in Saudi Arabia (PDPL + CCC)",
    china:
      "CIIO / important data must remain in mainland China (CSL Art. 37, DSL)",
    notes:
      "Both have strong localization requirements for sensitive and government-related data.",
  },
  {
    topic: "Cross-Border Data Transfer",
    saudiArabia:
      "Requires SDAIA approval; adequacy assessment or standard contractual clauses",
    china:
      "Requires CAC security assessment (CIIO/large-scale), standard contract, or certification",
    notes:
      "China's requirements are more complex with multiple pathways based on data type and volume.",
  },
  {
    topic: "Regulator",
    saudiArabia: "NCA (cybersecurity) + SDAIA (data protection)",
    china: "CAC (lead regulator) + MPS (MLPS) + MIIT (vulnerability/telecom)",
    notes:
      "China has a multi-agency model; Saudi Arabia splits between NCA and SDAIA.",
  },
  {
    topic: "Maximum Penalty",
    saudiArabia:
      "Up to SAR 5 million (PDPL); NCA can impose additional enforcement actions",
    china:
      "Up to 10% of annual turnover (CSL 2026); up to RMB 50M or 5% turnover (PIPL)",
    notes:
      "China's 2026 CSL amendments introduced turnover-based fines, significantly increasing exposure.",
  },
  {
    topic: "Incident Reporting Timeline",
    saudiArabia: "Immediately + 72h for personal data breaches",
    china: "2 hours (initial) + 24 hours (detailed report)",
    notes:
      "China's 2-hour initial report requirement is the strictest globally; Saudi PDPL follows 72h.",
  },
  {
    topic: "Assessment Frequency",
    saudiArabia: "Annual ECC self-assessment + annual internal audit",
    china:
      "Annual (Level 3) or semi-annual (Level 4) by licensed third-party evaluator",
    notes:
      "Saudi assessments are largely self-reported; China requires licensed third-party evaluation.",
  },
  {
    topic: "Executive Liability",
    saudiArabia:
      "Royal Decree M/117 allows individual liability for serious violations",
    china:
      "PIPL + CSL 2026: personal fines + up to 10-year industry ban for executives",
    notes:
      "Both impose personal liability; China's 2026 reforms made executive exposure significantly higher.",
  },
  {
    topic: "Vulnerability Disclosure",
    saudiArabia: "Monthly/quarterly vulnerability assessments recommended",
    china: "Must report to MIIT/CAC portal within 48 hours of discovery",
    notes:
      "China has a legally mandated 48-hour disclosure timeline; Saudi disclosure is best-practice-based.",
  },
  {
    topic: "Minors' Data",
    saudiArabia: "PDPL covers minors under general sensitive data category",
    china:
      "PIPL separate consent for under-14; annual report due by January 31",
    notes:
      "China has dedicated minors-specific obligations and an annual reporting deadline.",
  },
  {
    topic: "Cloud Security",
    saudiArabia:
      "NCA Cloud Cybersecurity Controls (CCC-2:2024) — mandatory for CSPs in KSA",
    china: "CAC/TC260 cloud security standards; MLPS 2.0 cloud extension",
    notes:
      "Both countries mandate cloud-specific security frameworks for service providers.",
  },
  {
    topic: "Breach Notification Timeline",
    saudiArabia: "72 hours to SDAIA",
    china: "2 hours initial + 24 hours detailed",
    eu: "72 hours to DPA (Art. 33)",
    us: "Varies by state (CA: no fixed timeline; HIPAA: 60 days)",
    brazil: "Reasonable time per ANPD determination (Art. 48)",
    notes:
      "EU GDPR and Saudi PDPL both use 72-hour benchmark; China strictest at 2h.",
  },
  {
    topic: "Data Protection Officer Requirement",
    saudiArabia: "Required for large-scale/sensitive data processing",
    china: "PIPO required above regulatory thresholds",
    eu: "Required for public bodies, large-scale monitoring, special categories (Art. 37)",
    us: "Not mandated by CCPA; required under HIPAA for covered entities",
    brazil: "Required for controllers (Art. 41)",
    notes:
      "DPO/PIPO requirement is common across all regimes except US federal law.",
  },
  {
    topic: "Cross-Border Transfer Mechanism",
    saudiArabia: "SDAIA approval, SCCs, or adequacy",
    china: "CAC security assessment, standard contract, or certification",
    eu: "Adequacy decision, SCCs, BCRs, or derogations (Art. 44-49)",
    us: "No federal restriction; state laws vary (CCPA does not restrict transfers)",
    brazil: "ANPD adequacy, SCCs, BCRs, or specific consent (Art. 33)",
    notes:
      "EU and Brazil share similar transfer frameworks; China most restrictive.",
  },
  {
    topic: "Right to Erasure / Deletion",
    saudiArabia: "Right to deletion under PDPL",
    china: "Right to deletion under PIPL Art. 47",
    eu: "Right to erasure under GDPR Art. 17",
    us: "Right to delete under CCPA (exceptions apply)",
    brazil: "Right to deletion under LGPD Art. 18",
    notes:
      "All five jurisdictions provide right to erasure/deletion with varying exceptions.",
  },
  {
    topic: "Sensitive Data Definition",
    saudiArabia: "Health, biometric, financial (PDPL)",
    china: "Biometric, health, financial, location, minors under 14 (PIPL)",
    eu: "Health, biometric, genetic, political, religious, sexual orientation (Art. 9)",
    us: "Health (HIPAA), biometric (state laws), financial (GLBA)",
    brazil:
      "Health, biometric, genetic, political, religious, sexual orientation (Art. 11)",
    notes:
      "EU and Brazil definitions nearly identical; China includes location and minors data.",
  },
  {
    topic: "International Standards Baseline",
    saudiArabia: "ISO 27001 encouraged; NCA-ECC self-assessments",
    china: "GB/T 22239 (MLPS 2.0) aligned with ISO 27001 for cloud",
    eu: "ISO 27001 + NIS2 risk measures for essential entities",
    us: "SOC 2 + NIST CSF 2.0 for SaaS and cloud providers",
    brazil: "ISO 27001 widely adopted for ANPD compliance evidence",
    notes:
      "ISO 27001, SOC 2, and NIST CSF serve as the common control baseline across all major markets.",
  },
  {
    topic: "Breach Notification — Global Benchmarks",
    saudiArabia: "72 hours to SDAIA",
    china: "2 hours initial + 24 hours detailed to CAC",
    eu: "72 hours to DPA (GDPR Art. 33); NIS2 24h/72h for CSIRT",
    us: "HIPAA 60 days; state laws vary",
    brazil: "Reasonable time per ANPD (Art. 48)",
    notes:
      "UK (ICO 72h), Canada (OPC material breach), Australia (OAIC serious harm), Singapore (PDPC significant harm), India (DPDP Board), Japan (PPC), South Korea (PIPC), and South Africa (Regulator) all mandate breach notification with local timelines.",
  },
  {
    topic: "International Transfer Safeguards",
    saudiArabia: "SDAIA approval, SCCs, or adequacy",
    china: "CAC security assessment, standard contract, or certification",
    eu: "Adequacy decision, SCCs, BCRs, or derogations (Art. 44-49)",
    us: "No federal restriction; state laws vary",
    brazil: "ANPD adequacy, SCCs, BCRs, or specific consent (Art. 33)",
    notes:
      "UK uses the IDTA; Japan and South Korea rely on adequacy decisions; Australia, Canada, Mexico, and South Africa require consent or adequacy for cross-border flows.",
  },
  {
    topic: "Executive Accountability",
    saudiArabia: "Royal Decree M/117 individual liability",
    china: "PIPL + CSL 2026: personal fines + up to 10-year industry ban",
    eu: "GDPR: managers liable via Member State law; NIS2: management approval + training",
    us: "SOX: personal liability for certification; HIPAA: individual criminal penalties",
    brazil: "LGPD: personal liability for controllers and operators",
    notes:
      "NIS2 makes management directly accountable for cybersecurity measures; executive accountability is now global across all major regimes.",
  },
];

export function listComplianceObligations(): ComplianceObligation[] {
  return COMPLIANCE_OBLIGATIONS;
}

export function getObligationsByCountry(
  country: string
): ComplianceObligation[] {
  return COMPLIANCE_OBLIGATIONS.filter(o => o.country === country);
}

export function getObligationsByFramework(
  framework: string
): ComplianceObligation[] {
  const norm = framework.toLowerCase();
  return COMPLIANCE_OBLIGATIONS.filter(o =>
    o.framework.toLowerCase().includes(norm)
  );
}

export function getComparisonTable(): ComplianceComparisonRow[] {
  return COMPARISON_TABLE;
}
