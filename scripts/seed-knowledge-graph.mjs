#!/usr/bin/env node

import pg from "pg";

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("[seed-knowledge-graph] DATABASE_URL is not set.");
  process.exit(1);
}

const fixedUrl = dbUrl.includes("sslmode=")
  ? dbUrl
  : dbUrl.includes("?")
    ? `${dbUrl}&sslmode=no-verify`
    : `${dbUrl}?sslmode=no-verify`;

const client = new pg.Client({
  connectionString: fixedUrl,
  ssl: { rejectUnauthorized: false },
});

const GLOBAL_REGIONS = [
  "North America",
  "Europe",
  "Middle East",
  "Asia-Pacific",
  "Africa",
  "Latin America",
  "Global Standards",
];

const GLOBAL_FRAMEWORK_PACKS = [
  {
    code: "NIST-CSF-2",
    name: "NIST Cybersecurity Framework 2.0",
    region: "North America",
    jurisdiction: "United States",
  },
  {
    code: "NIST-SP-800-53",
    name: "NIST SP 800-53",
    region: "North America",
    jurisdiction: "United States",
  },
  {
    code: "NIST-SP-800-171",
    name: "NIST SP 800-171",
    region: "North America",
    jurisdiction: "United States",
  },
  {
    code: "NIST-SP-800-61",
    name: "NIST SP 800-61",
    region: "North America",
    jurisdiction: "United States",
  },
  {
    code: "NIST-SP-800-207",
    name: "NIST SP 800-207 Zero Trust",
    region: "North America",
    jurisdiction: "United States",
  },
  {
    code: "NIST-AI-RMF",
    name: "NIST AI Risk Management Framework",
    region: "North America",
    jurisdiction: "United States",
  },
  {
    code: "HIPAA",
    name: "Health Insurance Portability and Accountability Act",
    region: "North America",
    jurisdiction: "United States",
  },
  {
    code: "HITECH",
    name: "Health Information Technology for Economic and Clinical Health Act",
    region: "North America",
    jurisdiction: "United States",
  },
  {
    code: "GLBA",
    name: "Gramm-Leach-Bliley Act",
    region: "North America",
    jurisdiction: "United States",
  },
  {
    code: "SOX",
    name: "Sarbanes-Oxley Act",
    region: "North America",
    jurisdiction: "United States",
  },
  {
    code: "SEC-CYBER",
    name: "SEC Cybersecurity Disclosure Rules",
    region: "North America",
    jurisdiction: "United States",
  },
  {
    code: "FTC-SAFEGUARDS",
    name: "FTC Safeguards Rule",
    region: "North America",
    jurisdiction: "United States",
  },
  {
    code: "CCPA",
    name: "California Consumer Privacy Act",
    region: "North America",
    jurisdiction: "United States",
  },
  {
    code: "CMMC",
    name: "Cybersecurity Maturity Model Certification",
    region: "North America",
    jurisdiction: "United States",
  },
  {
    code: "FEDRAMP",
    name: "FedRAMP",
    region: "North America",
    jurisdiction: "United States",
  },
  {
    code: "CJIS",
    name: "CJIS Security Policy",
    region: "North America",
    jurisdiction: "United States",
  },
  {
    code: "IRS-1075",
    name: "IRS Publication 1075",
    region: "North America",
    jurisdiction: "United States",
  },
  {
    code: "PCI-DSS",
    name: "PCI DSS",
    region: "North America",
    jurisdiction: "United States",
  },
  {
    code: "SOC1",
    name: "SOC 1",
    region: "North America",
    jurisdiction: "United States",
  },
  {
    code: "SOC2",
    name: "SOC 2",
    region: "North America",
    jurisdiction: "United States",
  },
  {
    code: "SOC3",
    name: "SOC 3",
    region: "North America",
    jurisdiction: "United States",
  },
  {
    code: "CIS-V8",
    name: "CIS Controls v8",
    region: "North America",
    jurisdiction: "United States",
  },
  {
    code: "COBIT-2019",
    name: "COBIT 2019",
    region: "North America",
    jurisdiction: "Global",
  },
  {
    code: "PIPEDA",
    name: "Personal Information Protection and Electronic Documents Act",
    region: "North America",
    jurisdiction: "Canada",
  },
  {
    code: "CCCS-GUIDANCE",
    name: "Canadian Centre for Cyber Security Guidance",
    region: "North America",
    jurisdiction: "Canada",
  },
  {
    code: "GDPR",
    name: "General Data Protection Regulation",
    region: "Europe",
    jurisdiction: "European Union",
  },
  {
    code: "UK-GDPR",
    name: "UK GDPR",
    region: "Europe",
    jurisdiction: "United Kingdom",
  },
  {
    code: "NIS2",
    name: "NIS2 Directive",
    region: "Europe",
    jurisdiction: "European Union",
  },
  {
    code: "DORA",
    name: "Digital Operational Resilience Act",
    region: "Europe",
    jurisdiction: "European Union",
  },
  {
    code: "CRA",
    name: "Cyber Resilience Act",
    region: "Europe",
    jurisdiction: "European Union",
  },
  {
    code: "EU-AI-ACT",
    name: "EU AI Act",
    region: "Europe",
    jurisdiction: "European Union",
  },
  {
    code: "EPD",
    name: "ePrivacy Directive",
    region: "Europe",
    jurisdiction: "European Union",
  },
  {
    code: "PSD2",
    name: "Payment Services Directive 2",
    region: "Europe",
    jurisdiction: "European Union",
  },
  {
    code: "DSA",
    name: "Digital Services Act",
    region: "Europe",
    jurisdiction: "European Union",
  },
  {
    code: "DMA",
    name: "Digital Markets Act",
    region: "Europe",
    jurisdiction: "European Union",
  },
  {
    code: "ENISA-GUIDANCE",
    name: "ENISA Guidance",
    region: "Europe",
    jurisdiction: "European Union",
  },
  {
    code: "ISO-27001",
    name: "ISO/IEC 27001",
    region: "Global Standards",
    jurisdiction: "Global",
  },
  {
    code: "ISO-27017",
    name: "ISO/IEC 27017",
    region: "Global Standards",
    jurisdiction: "Global",
  },
  {
    code: "ISO-27018",
    name: "ISO/IEC 27018",
    region: "Global Standards",
    jurisdiction: "Global",
  },
  {
    code: "ISO-27701",
    name: "ISO/IEC 27701",
    region: "Global Standards",
    jurisdiction: "Global",
  },
  {
    code: "ISO-22301",
    name: "ISO/IEC 22301",
    region: "Global Standards",
    jurisdiction: "Global",
  },
  {
    code: "ISO-42001",
    name: "ISO/IEC 42001",
    region: "Global Standards",
    jurisdiction: "Global",
  },
  {
    code: "ISO-31000",
    name: "ISO 31000",
    region: "Global Standards",
    jurisdiction: "Global",
  },
  {
    code: "PDPL-KSA",
    name: "Saudi Personal Data Protection Law",
    region: "Middle East",
    jurisdiction: "Saudi Arabia",
  },
  {
    code: "NCA-ECC",
    name: "NCA Essential Cybersecurity Controls",
    region: "Middle East",
    jurisdiction: "Saudi Arabia",
  },
  {
    code: "NCA-CCC",
    name: "NCA Cloud Cybersecurity Controls",
    region: "Middle East",
    jurisdiction: "Saudi Arabia",
  },
  {
    code: "ECC-1",
    name: "ECC-1",
    region: "Middle East",
    jurisdiction: "Saudi Arabia",
  },
  {
    code: "KSA-ECC",
    name: "Essential Cybersecurity Controls",
    region: "Middle East",
    jurisdiction: "Saudi Arabia",
  },
  {
    code: "CST-CLOUD",
    name: "CST Cloud Regulations",
    region: "Middle East",
    jurisdiction: "Saudi Arabia",
  },
  {
    code: "UAE-PDPL",
    name: "UAE Personal Data Protection Law",
    region: "Middle East",
    jurisdiction: "United Arab Emirates",
  },
  {
    code: "DESC-ISR",
    name: "DESC Information Security Regulation",
    region: "Middle East",
    jurisdiction: "United Arab Emirates",
  },
  {
    code: "UAE-IA",
    name: "UAE Information Assurance Standards",
    region: "Middle East",
    jurisdiction: "United Arab Emirates",
  },
  {
    code: "QCB-FRAMEWORK",
    name: "Qatar Central Bank Framework",
    region: "Middle East",
    jurisdiction: "Qatar",
  },
  {
    code: "QATAR-NIA",
    name: "Qatar National Information Assurance",
    region: "Middle East",
    jurisdiction: "Qatar",
  },
  {
    code: "BHR-PDPL",
    name: "Bahrain Personal Data Protection Law",
    region: "Middle East",
    jurisdiction: "Bahrain",
  },
  {
    code: "OMAN-CYBER",
    name: "Oman National Cybersecurity Requirements",
    region: "Middle East",
    jurisdiction: "Oman",
  },
  {
    code: "KUWAIT-CYBER",
    name: "Kuwait National Cybersecurity Regulations",
    region: "Middle East",
    jurisdiction: "Kuwait",
  },
  {
    code: "MLPS-2",
    name: "MLPS 2.0",
    region: "Asia-Pacific",
    jurisdiction: "China",
  },
  {
    code: "CHINA-CRYPT",
    name: "Cryptography Law",
    region: "Asia-Pacific",
    jurisdiction: "China",
  },
  {
    code: "CHINA-AI",
    name: "AI Regulations",
    region: "Asia-Pacific",
    jurisdiction: "China",
  },
  {
    code: "PDPA-SG",
    name: "Singapore Personal Data Protection Act",
    region: "Asia-Pacific",
    jurisdiction: "Singapore",
  },
  {
    code: "MAS-TRM",
    name: "MAS Technology Risk Management",
    region: "Asia-Pacific",
    jurisdiction: "Singapore",
  },
  {
    code: "MAS-NOTICES",
    name: "MAS Notices",
    region: "Asia-Pacific",
    jurisdiction: "Singapore",
  },
  {
    code: "APPI",
    name: "Act on the Protection of Personal Information",
    region: "Asia-Pacific",
    jurisdiction: "Japan",
  },
  {
    code: "PIPA-KR",
    name: "Personal Information Protection Act",
    region: "Asia-Pacific",
    jurisdiction: "South Korea",
  },
  {
    code: "ESSENTIAL-EIGHT",
    name: "Essential Eight",
    region: "Asia-Pacific",
    jurisdiction: "Australia",
  },
  {
    code: "ISM-AU",
    name: "Australian Information Security Manual",
    region: "Asia-Pacific",
    jurisdiction: "Australia",
  },
  {
    code: "PRIVACY-ACT-AU",
    name: "Australian Privacy Act",
    region: "Asia-Pacific",
    jurisdiction: "Australia",
  },
  {
    code: "NZ-PRIVACY",
    name: "New Zealand Privacy Act",
    region: "Asia-Pacific",
    jurisdiction: "New Zealand",
  },
  {
    code: "DPDP-IN",
    name: "Digital Personal Data Protection Act",
    region: "Asia-Pacific",
    jurisdiction: "India",
  },
  {
    code: "CERT-IN",
    name: "CERT-In Directions",
    region: "Asia-Pacific",
    jurisdiction: "India",
  },
  {
    code: "MY-PDPA",
    name: "Malaysia Personal Data Protection Act",
    region: "Asia-Pacific",
    jurisdiction: "Malaysia",
  },
  {
    code: "ID-PDP",
    name: "Indonesia Personal Data Protection Law",
    region: "Asia-Pacific",
    jurisdiction: "Indonesia",
  },
  {
    code: "TH-PDPA",
    name: "Thailand Personal Data Protection Act",
    region: "Asia-Pacific",
    jurisdiction: "Thailand",
  },
  {
    code: "VN-PDPD",
    name: "Vietnam Personal Data Protection Decree",
    region: "Asia-Pacific",
    jurisdiction: "Vietnam",
  },
  {
    code: "PH-DPA",
    name: "Philippines Data Privacy Act",
    region: "Asia-Pacific",
    jurisdiction: "Philippines",
  },
  {
    code: "POPIA",
    name: "Protection of Personal Information Act",
    region: "Africa",
    jurisdiction: "South Africa",
  },
  {
    code: "NDPA-NG",
    name: "Nigeria Data Protection Act",
    region: "Africa",
    jurisdiction: "Nigeria",
  },
  {
    code: "KENYA-DPA",
    name: "Kenya Data Protection Act",
    region: "Africa",
    jurisdiction: "Kenya",
  },
  {
    code: "EGYPT-PDPL",
    name: "Egypt Personal Data Protection Law",
    region: "Africa",
    jurisdiction: "Egypt",
  },
  {
    code: "AU-CYBER-PRIVACY",
    name: "African Union Cyber Security and Personal Data Protection Convention",
    region: "Africa",
    jurisdiction: "African Union",
  },
  {
    code: "LGPD",
    name: "Lei Geral de Proteção de Dados",
    region: "Latin America",
    jurisdiction: "Brazil",
  },
  {
    code: "MEXICO-DPA",
    name: "Mexico Federal Data Protection Law",
    region: "Latin America",
    jurisdiction: "Mexico",
  },
  {
    code: "ARG-PDPL",
    name: "Argentina Personal Data Protection Law",
    region: "Latin America",
    jurisdiction: "Argentina",
  },
  {
    code: "CHILE-DPF",
    name: "Chile Data Protection Framework",
    region: "Latin America",
    jurisdiction: "Chile",
  },
  {
    code: "COLOMBIA-HABEAS",
    name: "Colombia Habeas Data",
    region: "Latin America",
    jurisdiction: "Colombia",
  },
  {
    code: "MITRE-ATTACK",
    name: "MITRE ATT&CK",
    region: "Global Standards",
    jurisdiction: "Global",
  },
  {
    code: "MITRE-D3FEND",
    name: "MITRE D3FEND",
    region: "Global Standards",
    jurisdiction: "Global",
  },
  {
    code: "OWASP-TOP10",
    name: "OWASP Top 10",
    region: "Global Standards",
    jurisdiction: "Global",
  },
  {
    code: "OWASP-ASVS",
    name: "OWASP ASVS",
    region: "Global Standards",
    jurisdiction: "Global",
  },
  {
    code: "OWASP-SAMM",
    name: "OWASP SAMM",
    region: "Global Standards",
    jurisdiction: "Global",
  },
  {
    code: "CSA-CCM",
    name: "Cloud Controls Matrix",
    region: "Global Standards",
    jurisdiction: "Global",
  },
  {
    code: "CSA-STAR",
    name: "CSA STAR",
    region: "Global Standards",
    jurisdiction: "Global",
  },
  {
    code: "CIS-BENCHMARKS",
    name: "CIS Benchmarks",
    region: "Global Standards",
    jurisdiction: "Global",
  },
  {
    code: "IEC-62443",
    name: "IEC 62443",
    region: "Global Standards",
    jurisdiction: "Global",
  },
  {
    code: "FIPS-140-3",
    name: "FIPS 140-3",
    region: "Global Standards",
    jurisdiction: "Global",
  },
  {
    code: "ISO-SAE-21434",
    name: "ISO/SAE 21434",
    region: "Global Standards",
    jurisdiction: "Global",
  },
  {
    code: "TISAX",
    name: "TISAX",
    region: "Global Standards",
    jurisdiction: "Global",
  },
  {
    code: "IEC-61508",
    name: "IEC 61508",
    region: "Global Standards",
    jurisdiction: "Global",
  },
  {
    code: "NERC-CIP",
    name: "NERC CIP",
    region: "Global Standards",
    jurisdiction: "North America",
  },
  {
    code: "SWIFT-CSCF",
    name: "SWIFT Customer Security Controls Framework",
    region: "Global Standards",
    jurisdiction: "Global",
  },
  {
    code: "HITRUST",
    name: "HITRUST CSF",
    region: "Global Standards",
    jurisdiction: "Global",
  },
  {
    code: "FAIR",
    name: "FAIR Risk Framework",
    region: "Global Standards",
    jurisdiction: "Global",
  },
  {
    code: "OPENCRE",
    name: "OpenCRE",
    region: "Global Standards",
    jurisdiction: "Global",
  },
  {
    code: "OPENSSF",
    name: "OpenSSF",
    region: "Global Standards",
    jurisdiction: "Global",
  },
  {
    code: "SLSA",
    name: "SLSA Framework",
    region: "Global Standards",
    jurisdiction: "Global",
  },
  {
    code: "SPDX",
    name: "SPDX",
    region: "Global Standards",
    jurisdiction: "Global",
  },
  {
    code: "CYCLONE-DX",
    name: "CycloneDX",
    region: "Global Standards",
    jurisdiction: "Global",
  },
  {
    code: "PIPL",
    name: "Personal Information Protection Law",
    region: "Asia-Pacific",
    jurisdiction: "China",
  },
  {
    code: "CSL",
    name: "Cybersecurity Law",
    region: "Asia-Pacific",
    jurisdiction: "China",
  },
  {
    code: "DSL",
    name: "Data Security Law",
    region: "Asia-Pacific",
    jurisdiction: "China",
  },
  {
    code: "MLPS2",
    name: "Multi-Level Protection Scheme 2.0",
    region: "Asia-Pacific",
    jurisdiction: "China",
  },
  {
    code: "NDSM",
    name: "Regulations on Network Data Security Management",
    region: "Asia-Pacific",
    jurisdiction: "China",
  },
  {
    code: "CIIP",
    name: "Critical Information Infrastructure Protection Regulations",
    region: "Asia-Pacific",
    jurisdiction: "China",
  },
  {
    code: "VULN",
    name: "Management of Cybersecurity Vulnerabilities",
    region: "Asia-Pacific",
    jurisdiction: "China",
  },
  {
    code: "CBDT",
    name: "Cross-border Data Transfer Measures",
    region: "Asia-Pacific",
    jurisdiction: "China",
  },
  {
    code: "PDPL",
    name: "Personal Data Protection Law",
    region: "Middle East",
    jurisdiction: "Saudi Arabia",
  },
  {
    code: "UAE-PDPL",
    name: "UAE Federal Personal Data Protection Law",
    region: "Middle East",
    jurisdiction: "United Arab Emirates",
  },
  {
    code: "NCA",
    name: "National Cybersecurity Authority Framework Baseline",
    region: "Middle East",
    jurisdiction: "Saudi Arabia",
  },
  {
    code: "NCA-M117",
    name: "NCA Legal Powers (Royal Decree M/117)",
    region: "Middle East",
    jurisdiction: "Saudi Arabia",
  },
  {
    code: "ECC",
    name: "Essential Cybersecurity Controls (ECC-1:2018)",
    region: "Middle East",
    jurisdiction: "Saudi Arabia",
  },
  {
    code: "CCC",
    name: "Cloud Cybersecurity Controls (CCC-2:2024)",
    region: "Middle East",
    jurisdiction: "Saudi Arabia",
  },
  {
    code: "CSCC",
    name: "Critical Systems Cybersecurity Controls (CSCC-1:2019)",
    region: "Middle East",
    jurisdiction: "Saudi Arabia",
  },
  {
    code: "OTCC",
    name: "Operational Technology Cybersecurity Controls (OTCC-1:2022)",
    region: "Middle East",
    jurisdiction: "Saudi Arabia",
  },
  {
    code: "DCC",
    name: "Data Cybersecurity Controls (DCC-1:2022)",
    region: "Middle East",
    jurisdiction: "Saudi Arabia",
  },
  {
    code: "TCC",
    name: "Telework Cybersecurity Controls (TCC-1:2020)",
    region: "Middle East",
    jurisdiction: "Saudi Arabia",
  },
];

const GLOBAL_AI_AGENTS = [
  {
    code: "global-reg-intel",
    name: "Global Regulation Intelligence Agent",
    focus: "Detect and normalize regulatory updates across jurisdictions.",
    regions: [
      "North America",
      "Europe",
      "Middle East",
      "Asia-Pacific",
      "Africa",
      "Latin America",
    ],
  },
  {
    code: "compliance-translation",
    name: "Compliance Translation Agent",
    focus: "Translate obligations into implementation guidance.",
    regions: ["Global Standards", "Europe", "Asia-Pacific", "Middle East"],
  },
  {
    code: "ai-governance",
    name: "AI Governance Agent",
    focus: "Map model risks, controls, and AI governance obligations.",
    regions: ["North America", "Europe", "Asia-Pacific", "Global Standards"],
  },
  {
    code: "security-architecture",
    name: "Security Architecture Agent",
    focus: "Design control baselines and reference architectures.",
    regions: ["Global Standards", "North America", "Europe", "Asia-Pacific"],
  },
  {
    code: "vendor-risk",
    name: "Vendor Risk Agent",
    focus: "Score third-party, fourth-party, and cloud provider risk.",
    regions: [
      "Global Standards",
      "North America",
      "Middle East",
      "Asia-Pacific",
    ],
  },
  {
    code: "audit-readiness",
    name: "Audit Readiness Agent",
    focus: "Prepare evidence packs and audit narratives.",
    regions: ["North America", "Europe", "Middle East", "Asia-Pacific"],
  },
  {
    code: "policy-generation",
    name: "Policy Generation Agent",
    focus: "Draft policies and control statements from obligations.",
    regions: ["Global Standards"],
  },
  {
    code: "evidence-collection",
    name: "Evidence Collection Agent",
    focus: "Collect and link proof artifacts to controls.",
    regions: ["Global Standards"],
  },
  {
    code: "executive-reporting",
    name: "Executive Reporting Agent",
    focus: "Produce board-level summaries and posture briefings.",
    regions: ["Global Standards"],
  },
  {
    code: "continuous-monitoring",
    name: "Continuous Monitoring Agent",
    focus: "Track control drift, signals, and compliance posture.",
    regions: ["North America", "Europe", "Middle East", "Asia-Pacific"],
  },
  {
    code: "reg-change-detection",
    name: "Regulatory Change Detection Agent",
    focus: "Monitor legal and regulatory change feeds.",
    regions: [
      "North America",
      "Europe",
      "Middle East",
      "Asia-Pacific",
      "Africa",
      "Latin America",
    ],
  },
  {
    code: "threat-intel",
    name: "Threat Intelligence Agent",
    focus: "Align threat intelligence to control mappings and attack paths.",
    regions: ["Global Standards"],
  },
  {
    code: "third-party-risk",
    name: "Third-Party Risk Agent",
    focus: "Assess vendor resilience, concentration, and transfer risk.",
    regions: ["Global Standards"],
  },
  {
    code: "dpo-agent",
    name: "Data Protection Officer Agent",
    focus: "Guide privacy assessments and rights handling.",
    regions: [
      "Europe",
      "Middle East",
      "Asia-Pacific",
      "Africa",
      "Latin America",
    ],
  },
  {
    code: "cloud-security",
    name: "Cloud Security Agent",
    focus: "Map cloud responsibility models to regulatory obligations.",
    regions: ["Global Standards", "Europe", "Middle East", "Asia-Pacific"],
  },
  {
    code: "incident-response",
    name: "Incident Response Advisor",
    focus: "Coordinate incident response timelines and notifications.",
    regions: ["North America", "Europe", "Middle East", "Asia-Pacific"],
  },
  {
    code: "board-advisory",
    name: "Board Advisory Agent",
    focus: "Translate technical risk into executive and board language.",
    regions: ["Global Standards"],
  },
  {
    code: "compliance-copilot",
    name: "Compliance Copilot",
    focus:
      "Assist users across search, comparison, drafting, and evidence workflows.",
    regions: [
      "North America",
      "Europe",
      "Middle East",
      "Asia-Pacific",
      "Africa",
      "Latin America",
    ],
  },
];

const GLOBAL_INDUSTRY_EDITIONS = [
  {
    code: "djac-finance",
    name: "DJAC Finance",
    sector: "Finance",
    description:
      "Financial services overlay for privacy, resilience, payments, and third-party risk.",
    defaultFrameworkCodes: [
      "GLBA",
      "SOX",
      "PSD2",
      "DORA",
      "SWIFT-CSCF",
      "SOC2",
    ],
    defaultAgentCodes: [
      "vendor-risk",
      "audit-readiness",
      "executive-reporting",
    ],
  },
  {
    code: "djac-healthcare",
    name: "DJAC Healthcare",
    sector: "Healthcare",
    description:
      "Healthcare overlay for privacy, security, and audit readiness.",
    defaultFrameworkCodes: ["HIPAA", "HITECH", "HITRUST", "SOC2"],
    defaultAgentCodes: ["dpo-agent", "audit-readiness", "executive-reporting"],
  },
  {
    code: "djac-government",
    name: "DJAC Government",
    sector: "Government",
    description:
      "Government overlay for sovereign controls, records, and incident readiness.",
    defaultFrameworkCodes: [
      "NIST-SP-800-53",
      "NIST-SP-800-61",
      "CJIS",
      "FEDRAMP",
      "NCA-ECC",
    ],
    defaultAgentCodes: [
      "security-architecture",
      "audit-readiness",
      "continuous-monitoring",
    ],
  },
  {
    code: "djac-ai",
    name: "DJAC AI",
    sector: "Artificial Intelligence",
    description:
      "AI governance overlay for model risk, lifecycle controls, and regulatory readiness.",
    defaultFrameworkCodes: ["NIST-AI-RMF", "EU-AI-ACT", "ISO-42001"],
    defaultAgentCodes: ["ai-governance", "global-reg-intel", "board-advisory"],
  },
  {
    code: "djac-cloud",
    name: "DJAC Cloud",
    sector: "Cloud",
    description: "Cloud governance overlay for service providers and tenants.",
    defaultFrameworkCodes: [
      "FEDRAMP",
      "CSA-CCM",
      "CSA-STAR",
      "ISO-27017",
      "NCA-CCC",
    ],
    defaultAgentCodes: [
      "cloud-security",
      "vendor-risk",
      "security-architecture",
    ],
  },
  {
    code: "djac-telecom",
    name: "DJAC Telecom",
    sector: "Telecommunications",
    description:
      "Telecom overlay for network security, data transfer, and resilience.",
    defaultFrameworkCodes: ["NIS2", "ISO-27001", "CCCS-GUIDANCE", "PDPA-SG"],
    defaultAgentCodes: [
      "continuous-monitoring",
      "incident-response",
      "reg-change-detection",
    ],
  },
  {
    code: "djac-energy",
    name: "DJAC Energy",
    sector: "Energy",
    description:
      "Energy and critical infrastructure overlay for OT and resilience.",
    defaultFrameworkCodes: ["NERC-CIP", "IEC-62443", "IEC-61508", "NCA-ECC"],
    defaultAgentCodes: [
      "security-architecture",
      "threat-intel",
      "incident-response",
    ],
  },
  {
    code: "djac-manufacturing",
    name: "DJAC Manufacturing",
    sector: "Manufacturing",
    description:
      "Manufacturing overlay for supply chain, OT, and product security.",
    defaultFrameworkCodes: ["IEC-62443", "TISAX", "SLSA", "CIS-BENCHMARKS"],
    defaultAgentCodes: ["vendor-risk", "security-architecture", "threat-intel"],
  },
  {
    code: "djac-retail",
    name: "DJAC Retail",
    sector: "Retail",
    description:
      "Retail overlay for privacy, payment security, and customer data.",
    defaultFrameworkCodes: ["PCI-DSS", "GDPR", "LGPD", "PIPEDA"],
    defaultAgentCodes: ["dpo-agent", "vendor-risk", "executive-reporting"],
  },
  {
    code: "djac-education",
    name: "DJAC Education",
    sector: "Education",
    description:
      "Education overlay for student data, privacy, and service resilience.",
    defaultFrameworkCodes: ["GDPR", "PIPEDA", "PRIVACY-ACT-AU", "ISO-27701"],
    defaultAgentCodes: ["dpo-agent", "audit-readiness", "compliance-copilot"],
  },
  {
    code: "djac-critical-infrastructure",
    name: "DJAC Critical Infrastructure",
    sector: "Critical Infrastructure",
    description:
      "Critical infrastructure overlay for availability, resilience, and incident readiness.",
    defaultFrameworkCodes: ["NIS2", "NERC-CIP", "NCA-ECC", "MLPS-2"],
    defaultAgentCodes: [
      "continuous-monitoring",
      "incident-response",
      "threat-intel",
    ],
  },
  {
    code: "djac-defense",
    name: "DJAC Defense",
    sector: "Defense",
    description:
      "Defense overlay for classified data, supplier assurance, and export controls.",
    defaultFrameworkCodes: ["CMMC", "NIST-SP-800-171", "CJIS", "FedRAMP"],
    defaultAgentCodes: [
      "vendor-risk",
      "audit-readiness",
      "security-architecture",
    ],
  },
  {
    code: "djac-smart-cities",
    name: "DJAC Smart Cities",
    sector: "Smart Cities",
    description:
      "Smart city overlay for public infrastructure, IoT, privacy, and resilience.",
    defaultFrameworkCodes: ["ISO-27001", "ISO-22301", "NIST-CSF-2", "NCA-ECC"],
    defaultAgentCodes: [
      "security-architecture",
      "continuous-monitoring",
      "compliance-copilot",
    ],
  },
];

async function seed() {
  console.log("[seed-knowledge-graph] Connecting to database...");
  await client.connect();

  try {
    const esc = s => (s ? `'${s.replace(/'/g, "''")}'` : "NULL");

    const regionNodes = GLOBAL_REGIONS.map(r => ({
      nodeId: `region:${r}`,
      label: r,
      kind: "region",
      description: `${r} compliance region`,
      region: r,
      jurisdiction: null,
    }));

    const frameworkNodes = GLOBAL_FRAMEWORK_PACKS.map(f => ({
      nodeId: `framework:${f.code}`,
      label: f.name,
      kind: f.region === "Global Standards" ? "standard" : "framework",
      description: `${f.name} (${f.jurisdiction})`,
      region: f.region,
      jurisdiction: f.jurisdiction,
    }));

    const editionNodes = GLOBAL_INDUSTRY_EDITIONS.map(e => ({
      nodeId: `edition:${e.code}`,
      label: e.name,
      kind: "edition",
      description: e.description,
      region: null,
      jurisdiction: null,
    }));

    const agentNodes = GLOBAL_AI_AGENTS.map(a => ({
      nodeId: `agent:${a.code}`,
      label: a.name,
      kind: "agent",
      description: a.focus,
      region: null,
      jurisdiction: null,
    }));

    const allNodes = [
      ...regionNodes,
      ...frameworkNodes,
      ...editionNodes,
      ...agentNodes,
    ];

    for (const node of allNodes) {
      await client.query(
        `INSERT INTO "knowledgeGraphNodes" ("nodeId", "label", "kind", "description", "region", "jurisdiction")
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT ("nodeId") DO UPDATE SET
           "label" = EXCLUDED."label",
           "kind" = EXCLUDED."kind",
           "description" = EXCLUDED."description",
           "region" = EXCLUDED."region",
           "jurisdiction" = EXCLUDED."jurisdiction",
           "updatedAt" = NOW()`,
        [
          node.nodeId,
          node.label,
          node.kind,
          node.description,
          node.region,
          node.jurisdiction,
        ]
      );
    }
    console.log(
      `[seed-knowledge-graph] Seeded ${allNodes.length} graph nodes.`
    );

    const edges = [];

    for (const pack of GLOBAL_FRAMEWORK_PACKS) {
      edges.push({
        source: `region:${pack.region}`,
        target: `framework:${pack.code}`,
        relation: "contains",
      });
    }

    for (const edition of GLOBAL_INDUSTRY_EDITIONS) {
      for (const code of edition.defaultFrameworkCodes) {
        edges.push({
          source: `edition:${edition.code}`,
          target: `framework:${code}`,
          relation: "activates",
        });
      }
      for (const code of edition.defaultAgentCodes) {
        edges.push({
          source: `edition:${edition.code}`,
          target: `agent:${code}`,
          relation: "supports",
        });
      }
    }

    for (const agent of GLOBAL_AI_AGENTS) {
      for (const region of agent.regions) {
        edges.push({
          source: `agent:${agent.code}`,
          target: `region:${region}`,
          relation: "maps_to",
        });
      }
    }

    const edgeValues = [];
    const seen = new Set();
    for (const edge of edges) {
      const key = `${edge.source}|${edge.target}|${edge.relation}`;
      if (seen.has(key)) continue;
      seen.add(key);
      edgeValues.push(
        `(${esc(edge.source)}, ${esc(edge.target)}, ${esc(edge.relation)})`
      );
    }

    const E_CHUNK_SIZE = 250;
    for (let i = 0; i < edgeValues.length; i += E_CHUNK_SIZE) {
      const chunk = edgeValues.slice(i, i + E_CHUNK_SIZE);
      await client.query(
        `INSERT INTO "knowledgeGraphEdges" ("sourceNodeId", "targetNodeId", "relation")
         VALUES ${chunk.join(", ")}
         ON CONFLICT ("sourceNodeId", "targetNodeId") DO NOTHING`
      );
    }
    console.log(
      `[seed-knowledge-graph] Seeded ${edgeValues.length} graph edges.`
    );

    console.log("[seed-knowledge-graph] Complete.");
  } catch (err) {
    console.error("[seed-knowledge-graph] Failed:", err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seed();
