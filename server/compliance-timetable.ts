export type ComplianceFrequency =
    | "immediate"
    | "within_2h"
    | "within_24h"
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
    country: "Saudi Arabia" | "China";
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
        description: "Full enforcement of the Personal Data Protection Law began September 14, 2024. All controllers and processors must have compliant data-processing practices, DPO appointments where required, and PIAs in place.",
        references: ["Saudi Personal Data Protection Law (2021, enforced 2024)", "SDAIA Implementing Regulations"],
    },
    {
        id: "sa-ecc-self-assessment",
        country: "Saudi Arabia",
        framework: "ECC",
        requirement: "ECC Self-Assessment Submission",
        frequency: "annual",
        authority: "NCA",
        riskLevel: "high",
        description: "Annual submission of Essential Cybersecurity Controls compliance status via NCA's Haseen tool. Entities must assess all 114 controls across 5 domains and document evidence of compliance.",
        references: ["NCA Essential Cybersecurity Controls (ECC-1:2018)", "NCA Haseen Tool"],
    },
    {
        id: "sa-internal-audit",
        country: "Saudi Arabia",
        framework: "ECC",
        requirement: "Annual Internal Cybersecurity Audit",
        frequency: "annual",
        authority: "NCA",
        riskLevel: "high",
        description: "Mandatory annual independent internal review of cybersecurity control effectiveness across all ECC domains. Audit findings and remediation plans must be documented.",
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
        description: "Quarterly vulnerability scanning of critical systems and applications is recommended. Results must be tracked with severity-based remediation deadlines.",
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
        description: "Significant cybersecurity incidents must be reported immediately to the NCA. Personal data breaches must be notified to SDAIA within 72 hours and to affected data subjects if harm is likely.",
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
        description: "Controllers must notify SDAIA of personal data breaches within 72 hours of discovery. Notification must include nature of breach, estimated number of affected individuals, and interim containment measures.",
        references: ["Saudi PDPL Article on breach notification", "SDAIA Implementing Regulations"],
    },
    {
        id: "sa-penetration-test",
        country: "Saudi Arabia",
        framework: "ECC",
        requirement: "Penetration Testing",
        frequency: "annual",
        authority: "NCA",
        riskLevel: "high",
        description: "Annual penetration testing of critical systems and internet-facing applications is required. Testing must be conducted by qualified teams and remediation tracked.",
        references: ["NCA ECC-1:2018", "NCA Critical Systems Cybersecurity Controls (CSCC-1:2019)"],
    },
    {
        id: "sa-bcp-drill",
        country: "Saudi Arabia",
        framework: "ECC",
        requirement: "Business Continuity / DR Drill",
        frequency: "annual",
        authority: "NCA",
        riskLevel: "medium",
        description: "Annual testing of business continuity and disaster recovery plans through tabletop exercises or full drills. Results and remediation actions must be documented.",
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
        description: "New CSL amendments effective January 1, 2026. Organizations must update penalty exposure models, executive accountability frameworks, and vulnerability management timelines to comply with significantly increased penalties.",
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
        description: "Systems classified at MLPS Level 3 must undergo annual third-party security assessment by a licensed evaluation agency. Results must be submitted to the local MPS bureau.",
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
        description: "Systems classified at MLPS Level 4 must undergo semi-annual (every 6 months) third-party assessment by a licensed evaluation agency. Higher scrutiny and more frequent MPS reporting apply.",
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
        description: "Entities processing personal information of children under 14 must submit an annual compliance report to the CAC by January 31 each year. The report must cover processing purpose, volume, and safeguard measures.",
        references: ["PIPL Chapter on Minors", "CAC Regulations on Minors' Online Protection"],
    },
    {
        id: "cn-important-data-report",
        country: "China",
        framework: "DSL",
        requirement: "Important Data Annual Security Report",
        frequency: "annual",
        authority: "Sectoral Regulator / CAC",
        riskLevel: "high",
        description: "Entities designated as handlers of 'Important Data' must submit an annual data security assessment report to their sectoral regulator. The report covers data processing activities, risk landscape, and protective measures.",
        references: ["Data Security Law (DSL) Chapter IV", "CAC Network Data Security Management Regulations (2025)"],
    },
    {
        id: "cn-incident-initial",
        country: "China",
        framework: "CSL / MLPS",
        requirement: "Cybersecurity Incident Initial Report",
        frequency: "within_2h",
        authority: "CAC / MPS",
        riskLevel: "critical",
        description: "Major cybersecurity incidents must be reported to CAC and relevant authorities within 2 hours of discovery. Initial report must include incident type, affected systems scope, and immediate containment actions.",
        references: ["CSL Article 25", "GB/T 22239-2019 MLPS 2.0 Operations Controls"],
    },
    {
        id: "cn-incident-detailed",
        country: "China",
        framework: "CSL / MLPS",
        requirement: "Cybersecurity Incident Detailed Report",
        frequency: "within_24h",
        authority: "CAC / MPS",
        riskLevel: "critical",
        description: "A full technical incident report must be submitted within 24 hours of initial discovery. Must include root cause, full impact scope, remediation actions taken, and recovery timeline.",
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
        description: "Discovered cybersecurity vulnerabilities must be reported to the MIIT/CAC/MPS joint disclosure portal within 48 hours. Penalties for delayed or withheld disclosures significantly increased under the 2026 CSL amendments.",
        references: ["CSL Chapter IV — Network Operations Security", "MIIT Vulnerability Management Regulations (2021)", "CSL 2026 Amendments"],
    },
    {
        id: "cn-piia-before-processing",
        country: "China",
        framework: "PIPL",
        requirement: "Personal Information Impact Assessment (PIIA)",
        frequency: "ongoing",
        authority: "CAC",
        riskLevel: "high",
        description: "A PIIA must be completed before initiating high-risk PI processing, including sensitive PI processing, automated profiling, and overseas transfers. PIIA records must be retained for at least three years.",
        references: ["PIPL Article 55", "CAC Standard Contract for Cross-Border PI Transfer (2022)"],
    },
    {
        id: "cn-cross-border-assessment",
        country: "China",
        framework: "PIPL / CSL",
        requirement: "CAC Cross-Border Data Transfer Assessment",
        frequency: "ongoing",
        authority: "CAC",
        riskLevel: "critical",
        description: "CIIOs, large-scale PI processors (>1 million individuals), or exporters of 'important data' must complete a CAC security assessment before each overseas transfer. Assessment validity is typically 2 years.",
        references: ["PIPL Article 38-40", "CSL Article 37", "CAC Measures for Data Export Security Assessment (2022, updated 2024)"],
    },
    {
        id: "sa-privacy-notice",
        country: "Saudi Arabia",
        framework: "PDPL",
        requirement: "Privacy Notice Publication",
        frequency: "annual",
        authority: "SDAIA",
        riskLevel: "low",
        description: "Organisations processing personal data must publish a clear privacy notice describing the types of data collected, purposes of processing, and data subject rights. Annual review is recommended as a best practice to ensure accuracy.",
        references: ["PDPL Article 11", "SDAIA Implementing Regulations (2023) Article 6"],
    },
];

const COMPARISON_TABLE: ComplianceComparisonRow[] = [
    {
        topic: "Primary Cybersecurity Law",
        saudiArabia: "NCA Statute (2017, amended 2021) + Legal Powers (Royal Decree M/117, 2024)",
        china: "Cybersecurity Law (CSL) — amended 2026",
        notes: "Both countries have dedicated national cybersecurity laws with binding enforcement.",
    },
    {
        topic: "Core Control Framework",
        saudiArabia: "Essential Cybersecurity Controls (ECC-1:2018) — 5 domains, 114 controls",
        china: "Multi-Level Protection Scheme (MLPS 2.0 / GB/T 22239-2019) — 5 protection levels",
        notes: "ECC is mandatory for all Saudi entities; MLPS 2.0 grades systems by risk level.",
    },
    {
        topic: "Personal Data Privacy Law",
        saudiArabia: "Personal Data Protection Law (PDPL) — SDAIA, enforced Sept 2024",
        china: "Personal Information Protection Law (PIPL) — CAC, effective Nov 2021",
        notes: "Both align closely with GDPR principles: lawful basis, consent, rights, DPO/PIPO.",
    },
    {
        topic: "Data Classification",
        saudiArabia: "PDPL classifies: General / Sensitive categories (health, biometric, financial)",
        china: "DSL classifies: General / Important / Core data tiers",
        notes: "China's 3-tier DSL model is broader; Saudi focuses on personal data sensitivity levels.",
    },
    {
        topic: "Data Localization",
        saudiArabia: "Government and sensitive data must remain in Saudi Arabia (PDPL + CCC)",
        china: "CIIO / important data must remain in mainland China (CSL Art. 37, DSL)",
        notes: "Both have strong localization requirements for sensitive and government-related data.",
    },
    {
        topic: "Cross-Border Data Transfer",
        saudiArabia: "Requires SDAIA approval; adequacy assessment or standard contractual clauses",
        china: "Requires CAC security assessment (CIIO/large-scale), standard contract, or certification",
        notes: "China's requirements are more complex with multiple pathways based on data type and volume.",
    },
    {
        topic: "Regulator",
        saudiArabia: "NCA (cybersecurity) + SDAIA (data protection)",
        china: "CAC (lead regulator) + MPS (MLPS) + MIIT (vulnerability/telecom)",
        notes: "China has a multi-agency model; Saudi Arabia splits between NCA and SDAIA.",
    },
    {
        topic: "Maximum Penalty",
        saudiArabia: "Up to SAR 5 million (PDPL); NCA can impose additional enforcement actions",
        china: "Up to 10% of annual turnover (CSL 2026); up to RMB 50M or 5% turnover (PIPL)",
        notes: "China's 2026 CSL amendments introduced turnover-based fines, significantly increasing exposure.",
    },
    {
        topic: "Incident Reporting Timeline",
        saudiArabia: "Immediately + 72h for personal data breaches",
        china: "2 hours (initial) + 24 hours (detailed report)",
        notes: "China's 2-hour initial report requirement is the strictest globally; Saudi PDPL follows 72h.",
    },
    {
        topic: "Assessment Frequency",
        saudiArabia: "Annual ECC self-assessment + annual internal audit",
        china: "Annual (Level 3) or semi-annual (Level 4) by licensed third-party evaluator",
        notes: "Saudi assessments are largely self-reported; China requires licensed third-party evaluation.",
    },
    {
        topic: "Executive Liability",
        saudiArabia: "Royal Decree M/117 allows individual liability for serious violations",
        china: "PIPL + CSL 2026: personal fines + up to 10-year industry ban for executives",
        notes: "Both impose personal liability; China's 2026 reforms made executive exposure significantly higher.",
    },
    {
        topic: "Vulnerability Disclosure",
        saudiArabia: "Monthly/quarterly vulnerability assessments recommended",
        china: "Must report to MIIT/CAC portal within 48 hours of discovery",
        notes: "China has a legally mandated 48-hour disclosure timeline; Saudi disclosure is best-practice-based.",
    },
    {
        topic: "Minors' Data",
        saudiArabia: "PDPL covers minors under general sensitive data category",
        china: "PIPL separate consent for under-14; annual report due by January 31",
        notes: "China has dedicated minors-specific obligations and an annual reporting deadline.",
    },
    {
        topic: "Cloud Security",
        saudiArabia: "NCA Cloud Cybersecurity Controls (CCC-2:2024) — mandatory for CSPs in KSA",
        china: "CAC/TC260 cloud security standards; MLPS 2.0 cloud extension",
        notes: "Both countries mandate cloud-specific security frameworks for service providers.",
    },
];

export function listComplianceObligations(): ComplianceObligation[] {
    return COMPLIANCE_OBLIGATIONS;
}

export function getObligationsByCountry(country: "Saudi Arabia" | "China"): ComplianceObligation[] {
    return COMPLIANCE_OBLIGATIONS.filter((o) => o.country === country);
}

export function getObligationsByFramework(framework: string): ComplianceObligation[] {
    const norm = framework.toLowerCase();
    return COMPLIANCE_OBLIGATIONS.filter((o) => o.framework.toLowerCase().includes(norm));
}

export function getComparisonTable(): ComplianceComparisonRow[] {
    return COMPARISON_TABLE;
}
