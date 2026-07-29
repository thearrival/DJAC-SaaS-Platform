#!/usr/bin/env node

import pg from "pg";

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("[seed-global-data] DATABASE_URL is not set.");
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

const GLOBAL_FRAMEWORK_PACKS = [
  {
    code: "NIST-CSF-2",
    name: "NIST Cybersecurity Framework 2.0",
    region: "North America",
    jurisdiction: "United States",
    category: "cybersecurity",
    description:
      "Framework for enterprise cybersecurity governance, risk management, and continuous improvement.",
    scope: "Organizations of all sizes across sectors.",
    authority: "NIST",
  },
  {
    code: "NIST-SP-800-53",
    name: "NIST SP 800-53",
    region: "North America",
    jurisdiction: "United States",
    category: "security controls",
    description:
      "Security and privacy control catalog for federal information systems and organizations.",
    scope: "Federal systems and regulated suppliers.",
    authority: "NIST",
  },
  {
    code: "NIST-SP-800-171",
    name: "NIST SP 800-171",
    region: "North America",
    jurisdiction: "United States",
    category: "cybersecurity",
    description:
      "Protecting controlled unclassified information in nonfederal systems.",
    scope: "Defense industrial base and suppliers.",
    authority: "NIST",
  },
  {
    code: "NIST-SP-800-61",
    name: "NIST SP 800-61",
    region: "North America",
    jurisdiction: "United States",
    category: "incident response",
    description:
      "Incident handling lifecycle guidance for detection, response, and recovery.",
    scope: "Enterprise incident response programs.",
    authority: "NIST",
  },
  {
    code: "NIST-SP-800-207",
    name: "NIST SP 800-207 Zero Trust",
    region: "North America",
    jurisdiction: "United States",
    category: "zero trust",
    description:
      "Zero trust architecture principles for identity-centric security.",
    scope: "Cloud and enterprise identity architectures.",
    authority: "NIST",
  },
  {
    code: "NIST-AI-RMF",
    name: "NIST AI Risk Management Framework",
    region: "North America",
    jurisdiction: "United States",
    category: "ai governance",
    description:
      "Risk management guidance for AI systems across design, deployment, and monitoring.",
    scope: "AI developers, deployers, and operators.",
    authority: "NIST",
  },
  {
    code: "HIPAA",
    name: "Health Insurance Portability and Accountability Act",
    region: "North America",
    jurisdiction: "United States",
    category: "privacy",
    description:
      "Protected health information privacy and security requirements.",
    scope: "Covered entities and business associates.",
    authority: "HHS OCR",
  },
  {
    code: "HITECH",
    name: "Health Information Technology for Economic and Clinical Health Act",
    region: "North America",
    jurisdiction: "United States",
    category: "privacy",
    description:
      "Strengthens HIPAA enforcement and breach notification duties.",
    scope: "Health data ecosystem participants.",
    authority: "HHS OCR",
  },
  {
    code: "GLBA",
    name: "Gramm-Leach-Bliley Act",
    region: "North America",
    jurisdiction: "United States",
    category: "financial privacy",
    description:
      "Customer information safeguards and privacy obligations for financial institutions.",
    scope: "Financial institutions and service providers.",
    authority: "FTC / Federal Regulators",
  },
  {
    code: "SOX",
    name: "Sarbanes-Oxley Act",
    region: "North America",
    jurisdiction: "United States",
    category: "financial controls",
    description:
      "Public company internal controls, certification, and audit requirements.",
    scope: "Public issuers and auditors.",
    authority: "SEC / PCAOB",
  },
  {
    code: "SEC-CYBER",
    name: "SEC Cybersecurity Disclosure Rules",
    region: "North America",
    jurisdiction: "United States",
    category: "disclosure",
    description:
      "Public company cyber incident disclosure and risk governance expectations.",
    scope: "SEC registrants.",
    authority: "SEC",
  },
  {
    code: "FTC-SAFEGUARDS",
    name: "FTC Safeguards Rule",
    region: "North America",
    jurisdiction: "United States",
    category: "privacy",
    description:
      "Administrative, technical, and physical safeguards for customer information.",
    scope: "Financial institutions under FTC jurisdiction.",
    authority: "FTC",
  },
  {
    code: "CMMC",
    name: "Cybersecurity Maturity Model Certification",
    region: "North America",
    jurisdiction: "United States",
    category: "supply chain",
    description: "Defense supplier cybersecurity maturity requirements.",
    scope: "Defense contractors and subcontractors.",
    authority: "DoD",
  },
  {
    code: "FEDRAMP",
    name: "FedRAMP",
    region: "North America",
    jurisdiction: "United States",
    category: "cloud security",
    description:
      "Federal cloud authorization and continuous monitoring program.",
    scope: "Cloud service providers serving U.S. federal agencies.",
    authority: "FedRAMP PMO",
  },
  {
    code: "CJIS",
    name: "CJIS Security Policy",
    region: "North America",
    jurisdiction: "United States",
    category: "public safety",
    description:
      "Security requirements for criminal justice information handling.",
    scope: "Law enforcement and justice ecosystem.",
    authority: "FBI",
  },
  {
    code: "IRS-1075",
    name: "IRS Publication 1075",
    region: "North America",
    jurisdiction: "United States",
    category: "tax data",
    description: "Safeguards for federal tax information.",
    scope: "Entities handling federal tax data.",
    authority: "IRS",
  },
  {
    code: "PCI-DSS",
    name: "PCI DSS",
    region: "North America",
    jurisdiction: "United States",
    category: "payment security",
    description: "Cardholder data security standard.",
    scope: "Payment card ecosystem participants.",
    authority: "PCI SSC",
  },
  {
    code: "SOC1",
    name: "SOC 1",
    region: "North America",
    jurisdiction: "United States",
    category: "assurance",
    description: "Assurance on controls relevant to financial reporting.",
    scope: "Service organizations.",
    authority: "AICPA",
  },
  {
    code: "SOC2",
    name: "SOC 2",
    region: "North America",
    jurisdiction: "United States",
    category: "assurance",
    description:
      "Assurance on security, availability, processing integrity, confidentiality, and privacy.",
    scope: "Service organizations.",
    authority: "AICPA",
  },
  {
    code: "SOC3",
    name: "SOC 3",
    region: "North America",
    jurisdiction: "United States",
    category: "assurance",
    description: "Public-facing assurance report for general trust principles.",
    scope: "Public trust reporting.",
    authority: "AICPA",
  },
  {
    code: "CIS-V8",
    name: "CIS Controls v8",
    region: "North America",
    jurisdiction: "United States",
    category: "security controls",
    description:
      "Prioritized cybersecurity safeguards across core control families.",
    scope: "Enterprise and small-to-large organizations.",
    authority: "CIS",
  },
  {
    code: "COBIT-2019",
    name: "COBIT 2019",
    region: "North America",
    jurisdiction: "Global",
    category: "governance",
    description:
      "Enterprise governance and management objectives for information and technology.",
    scope: "Governance and assurance programs.",
    authority: "ISACA",
  },
  {
    code: "PIPEDA",
    name: "Personal Information Protection and Electronic Documents Act",
    region: "North America",
    jurisdiction: "Canada",
    category: "privacy",
    description:
      "Canadian private-sector privacy law for personal information processing.",
    scope: "Private-sector organizations in Canada.",
    authority: "Office of the Privacy Commissioner of Canada",
  },
  {
    code: "CCCS-GUIDANCE",
    name: "Canadian Centre for Cyber Security Guidance",
    region: "North America",
    jurisdiction: "Canada",
    category: "cybersecurity",
    description: "National cybersecurity guidance, baselines, and advisories.",
    scope: "Canadian organizations and critical sectors.",
    authority: "Canadian Centre for Cyber Security",
  },
  {
    code: "GDPR",
    name: "General Data Protection Regulation",
    region: "Europe",
    jurisdiction: "European Union",
    category: "privacy",
    description:
      "EU data protection regulation for personal data processing and rights.",
    scope: "Controllers and processors in the EU or targeting EU residents.",
    authority: "European Commission",
  },
  {
    code: "UK-GDPR",
    name: "UK GDPR",
    region: "Europe",
    jurisdiction: "United Kingdom",
    category: "privacy",
    description: "UK retained data protection framework aligned to GDPR.",
    scope: "UK data controllers and processors.",
    authority: "ICO",
  },
  {
    code: "NIS2",
    name: "NIS2 Directive",
    region: "Europe",
    jurisdiction: "European Union",
    category: "cybersecurity",
    description:
      "Security and incident management obligations for essential and important entities.",
    scope: "Critical and important entities across the EU.",
    authority: "ENISA / Member States",
  },
  {
    code: "DORA",
    name: "Digital Operational Resilience Act",
    region: "Europe",
    jurisdiction: "European Union",
    category: "financial resilience",
    description: "ICT risk management and resilience for financial entities.",
    scope: "EU financial sector.",
    authority: "European Supervisory Authorities",
  },
  {
    code: "CRA",
    name: "Cyber Resilience Act",
    region: "Europe",
    jurisdiction: "European Union",
    category: "product security",
    description:
      "Cybersecurity requirements for products with digital elements.",
    scope: "Manufacturers, importers, and distributors.",
    authority: "European Commission",
  },
  {
    code: "EU-AI-ACT",
    name: "EU AI Act",
    region: "Europe",
    jurisdiction: "European Union",
    category: "ai governance",
    description: "Risk-based regulation for artificial intelligence systems.",
    scope: "AI providers, deployers, importers, and distributors.",
    authority: "European Union",
  },
  {
    code: "EPD",
    name: "ePrivacy Directive",
    region: "Europe",
    jurisdiction: "European Union",
    category: "privacy",
    description: "Privacy and electronic communications rules.",
    scope: "Electronic communications and tracking technologies.",
    authority: "European Union",
  },
  {
    code: "PSD2",
    name: "Payment Services Directive 2",
    region: "Europe",
    jurisdiction: "European Union",
    category: "financial services",
    description:
      "Payment security, authentication, and open banking obligations.",
    scope: "Payment service providers.",
    authority: "European Union",
  },
  {
    code: "DSA",
    name: "Digital Services Act",
    region: "Europe",
    jurisdiction: "European Union",
    category: "platform governance",
    description:
      "Rules for online intermediary services and systemic risk management.",
    scope: "Digital service providers.",
    authority: "European Union",
  },
  {
    code: "DMA",
    name: "Digital Markets Act",
    region: "Europe",
    jurisdiction: "European Union",
    category: "platform governance",
    description: "Gatekeeper obligations for core platform services.",
    scope: "Large online platforms.",
    authority: "European Union",
  },
  {
    code: "ENISA-GUIDANCE",
    name: "ENISA Guidance",
    region: "Europe",
    jurisdiction: "European Union",
    category: "cybersecurity",
    description:
      "European Union agency guidance on cybersecurity and resilience.",
    scope: "EU cybersecurity programs.",
    authority: "ENISA",
  },
  {
    code: "ISO-27001",
    name: "ISO/IEC 27001",
    region: "Global Standards",
    jurisdiction: "Global",
    category: "information security",
    description: "Information security management system standard.",
    scope: "Organizational ISMS programs.",
    authority: "ISO/IEC",
  },
  {
    code: "ISO-27017",
    name: "ISO/IEC 27017",
    region: "Global Standards",
    jurisdiction: "Global",
    category: "cloud security",
    description: "Cloud security controls guidance.",
    scope: "Cloud providers and customers.",
    authority: "ISO/IEC",
  },
  {
    code: "ISO-27018",
    name: "ISO/IEC 27018",
    region: "Global Standards",
    jurisdiction: "Global",
    category: "privacy",
    description:
      "Protection of personally identifiable information in public clouds.",
    scope: "Public cloud PII processors.",
    authority: "ISO/IEC",
  },
  {
    code: "ISO-27701",
    name: "ISO/IEC 27701",
    region: "Global Standards",
    jurisdiction: "Global",
    category: "privacy",
    description: "Privacy information management extension to ISO 27001/27002.",
    scope: "Privacy governance programs.",
    authority: "ISO/IEC",
  },
  {
    code: "ISO-22301",
    name: "ISO/IEC 22301",
    region: "Global Standards",
    jurisdiction: "Global",
    category: "resilience",
    description: "Business continuity management system standard.",
    scope: "Continuity and resilience programs.",
    authority: "ISO/IEC",
  },
  {
    code: "ISO-42001",
    name: "ISO/IEC 42001",
    region: "Global Standards",
    jurisdiction: "Global",
    category: "ai governance",
    description: "AI management system standard.",
    scope: "AI governance programs.",
    authority: "ISO/IEC",
  },
  {
    code: "ISO-31000",
    name: "ISO 31000",
    region: "Global Standards",
    jurisdiction: "Global",
    category: "risk management",
    description: "Risk management principles and guidelines.",
    scope: "Enterprise risk management.",
    authority: "ISO",
  },
  {
    code: "PDPL-KSA",
    name: "Saudi Personal Data Protection Law",
    region: "Middle East",
    jurisdiction: "Saudi Arabia",
    category: "privacy",
    description:
      "Saudi national privacy law for personal data processing and rights.",
    scope: "Controllers and processors handling personal data in Saudi Arabia.",
    authority: "SDAIA",
  },
  {
    code: "NCA-ECC",
    name: "NCA Essential Cybersecurity Controls",
    region: "Middle East",
    jurisdiction: "Saudi Arabia",
    category: "cybersecurity",
    description:
      "Mandatory baseline cybersecurity controls for Saudi entities.",
    scope: "Government, critical sectors, and regulated organizations.",
    authority: "NCA",
  },
  {
    code: "NCA-CCC",
    name: "NCA Cloud Cybersecurity Controls",
    region: "Middle East",
    jurisdiction: "Saudi Arabia",
    category: "cloud security",
    description:
      "Cloud-specific cybersecurity controls and assurance requirements.",
    scope: "Cloud service providers and tenants in KSA.",
    authority: "NCA",
  },
  {
    code: "ECC-1",
    name: "ECC-1",
    region: "Middle East",
    jurisdiction: "Saudi Arabia",
    category: "cybersecurity",
    description:
      "Saudi cybersecurity control baseline identifier used by regulated entities.",
    scope: "Entities under the Saudi control baseline.",
    authority: "NCA",
  },
  {
    code: "KSA-ECC",
    name: "Essential Cybersecurity Controls",
    region: "Middle East",
    jurisdiction: "Saudi Arabia",
    category: "cybersecurity",
    description:
      "Alias for the Saudi cybersecurity control baseline used in organizational mapping.",
    scope: "Regulated Saudi organizations.",
    authority: "NCA",
  },
  {
    code: "CST-CLOUD",
    name: "CST Cloud Regulations",
    region: "Middle East",
    jurisdiction: "Saudi Arabia",
    category: "cloud regulation",
    description: "Saudi cloud regulations and cloud service requirements.",
    scope: "Cloud providers and cloud tenants.",
    authority: "CST",
  },
  {
    code: "UAE-PDPL",
    name: "UAE Personal Data Protection Law",
    region: "Middle East",
    jurisdiction: "United Arab Emirates",
    category: "privacy",
    description:
      "UAE federal privacy law for personal data processing and transfers.",
    scope: "Controllers and processors across the UAE.",
    authority: "UAE Data Office",
  },
  {
    code: "DESC-ISR",
    name: "DESC Information Security Regulation",
    region: "Middle East",
    jurisdiction: "United Arab Emirates",
    category: "cybersecurity",
    description:
      "Dubai electronic security and information protection requirements.",
    scope: "Dubai government and related entities.",
    authority: "DESC",
  },
  {
    code: "UAE-IA",
    name: "UAE Information Assurance Standards",
    region: "Middle East",
    jurisdiction: "United Arab Emirates",
    category: "cybersecurity",
    description: "National information assurance standards for UAE entities.",
    scope: "Public and regulated sectors.",
    authority: "UAE National Cybersecurity Council",
  },
  {
    code: "QCB-FRAMEWORK",
    name: "Qatar Central Bank Framework",
    region: "Middle East",
    jurisdiction: "Qatar",
    category: "financial services",
    description:
      "Cybersecurity and risk framework for Qatari financial institutions.",
    scope: "Banks and payment ecosystem participants.",
    authority: "QCB",
  },
  {
    code: "QATAR-NIA",
    name: "Qatar National Information Assurance",
    region: "Middle East",
    jurisdiction: "Qatar",
    category: "cybersecurity",
    description: "National assurance requirements for information systems.",
    scope: "Government and critical sectors.",
    authority: "Qatar National Cyber Security Agency",
  },
  {
    code: "BHR-PDPL",
    name: "Bahrain Personal Data Protection Law",
    region: "Middle East",
    jurisdiction: "Bahrain",
    category: "privacy",
    description: "Bahraini data protection law for personal data processing.",
    scope: "Controllers and processors in Bahrain.",
    authority: "Bahrain Personal Data Protection Authority",
  },
  {
    code: "OMAN-CYBER",
    name: "Oman National Cybersecurity Requirements",
    region: "Middle East",
    jurisdiction: "Oman",
    category: "cybersecurity",
    description: "Omani cybersecurity control and governance requirements.",
    scope: "Government and regulated sectors.",
    authority: "National Cybersecurity Centre",
  },
  {
    code: "KUWAIT-CYBER",
    name: "Kuwait National Cybersecurity Regulations",
    region: "Middle East",
    jurisdiction: "Kuwait",
    category: "cybersecurity",
    description: "Kuwaiti cybersecurity obligations for regulated entities.",
    scope: "Public and regulated organizations.",
    authority: "Kuwait National Cyber Security Center",
  },
  {
    code: "MLPS-2",
    name: "MLPS 2.0",
    region: "Asia-Pacific",
    jurisdiction: "China",
    category: "cybersecurity",
    description:
      "China's multi-level protection scheme for information systems.",
    scope: "Networked information systems in China.",
    authority: "MPS / CAC",
  },
  {
    code: "CHINA-CRYPT",
    name: "Cryptography Law",
    region: "Asia-Pacific",
    jurisdiction: "China",
    category: "cryptography",
    description: "Chinese cryptography governance and product requirements.",
    scope: "Cryptography products and regulated users.",
    authority: "CAC / State Cryptography Administration",
  },
  {
    code: "CHINA-AI",
    name: "AI Regulations",
    region: "Asia-Pacific",
    jurisdiction: "China",
    category: "ai governance",
    description:
      "Chinese requirements for generative AI, algorithmic recommendation, and AI governance.",
    scope: "AI providers and deployers in China.",
    authority: "CAC",
  },
  {
    code: "PDPA-SG",
    name: "Singapore Personal Data Protection Act",
    region: "Asia-Pacific",
    jurisdiction: "Singapore",
    category: "privacy",
    description: "Singapore privacy and data protection obligations.",
    scope: "Organizations processing personal data in Singapore.",
    authority: "PDPC",
  },
  {
    code: "MAS-TRM",
    name: "MAS Technology Risk Management",
    region: "Asia-Pacific",
    jurisdiction: "Singapore",
    category: "financial services",
    description:
      "Technology risk management for Singapore financial institutions.",
    scope: "MAS-regulated financial entities.",
    authority: "Monetary Authority of Singapore",
  },
  {
    code: "MAS-NOTICES",
    name: "MAS Notices",
    region: "Asia-Pacific",
    jurisdiction: "Singapore",
    category: "financial services",
    description:
      "Regulatory notices governing banking, payment, and resilience obligations.",
    scope: "MAS-regulated institutions.",
    authority: "Monetary Authority of Singapore",
  },
  {
    code: "APPI",
    name: "Act on the Protection of Personal Information",
    region: "Asia-Pacific",
    jurisdiction: "Japan",
    category: "privacy",
    description: "Japan's personal data protection law.",
    scope: "Controllers and processors handling Japanese personal information.",
    authority: "PPC",
  },
  {
    code: "PIPA-KR",
    name: "Personal Information Protection Act",
    region: "Asia-Pacific",
    jurisdiction: "South Korea",
    category: "privacy",
    description: "South Korean privacy and personal data processing law.",
    scope: "Personal information controllers and processors.",
    authority: "PIPC",
  },
  {
    code: "ESSENTIAL-EIGHT",
    name: "Essential Eight",
    region: "Asia-Pacific",
    jurisdiction: "Australia",
    category: "cybersecurity",
    description:
      "Australian cyber mitigation strategies for common attack paths.",
    scope: "Australian government and regulated organizations.",
    authority: "ACSC",
  },
  {
    code: "ISM-AU",
    name: "Australian Information Security Manual",
    region: "Asia-Pacific",
    jurisdiction: "Australia",
    category: "cybersecurity",
    description:
      "Australian cyber security guidance and controls for government and industry.",
    scope: "Australian entities handling sensitive systems.",
    authority: "ACSC",
  },
  {
    code: "PRIVACY-ACT-AU",
    name: "Australian Privacy Act",
    region: "Asia-Pacific",
    jurisdiction: "Australia",
    category: "privacy",
    description: "Australian privacy and personal information obligations.",
    scope: "Australian organizations and APP entities.",
    authority: "OAIC",
  },
  {
    code: "NZ-PRIVACY",
    name: "New Zealand Privacy Act",
    region: "Asia-Pacific",
    jurisdiction: "New Zealand",
    category: "privacy",
    description: "New Zealand privacy law and information privacy principles.",
    scope: "Organizations handling personal information in New Zealand.",
    authority: "Office of the Privacy Commissioner",
  },
  {
    code: "DPDP-IN",
    name: "Digital Personal Data Protection Act",
    region: "Asia-Pacific",
    jurisdiction: "India",
    category: "privacy",
    description: "India's personal data protection law.",
    scope: "Data fiduciaries and processors in India.",
    authority: "Data Protection Board of India",
  },
  {
    code: "CERT-IN",
    name: "CERT-In Directions",
    region: "Asia-Pacific",
    jurisdiction: "India",
    category: "incident response",
    description:
      "Indian cyber incident reporting and log retention directions.",
    scope: "Critical sectors and regulated organizations.",
    authority: "CERT-In",
  },
  {
    code: "MY-PDPA",
    name: "Malaysia Personal Data Protection Act",
    region: "Asia-Pacific",
    jurisdiction: "Malaysia",
    category: "privacy",
    description: "Malaysia's personal data protection requirements.",
    scope: "Commercial organizations in Malaysia.",
    authority: "JPDP",
  },
  {
    code: "ID-PDP",
    name: "Indonesia Personal Data Protection Law",
    region: "Asia-Pacific",
    jurisdiction: "Indonesia",
    category: "privacy",
    description: "Indonesia's personal data protection framework.",
    scope: "Controllers and processors in Indonesia.",
    authority: "Ministry of Communication and Digital Affairs",
  },
  {
    code: "TH-PDPA",
    name: "Thailand Personal Data Protection Act",
    region: "Asia-Pacific",
    jurisdiction: "Thailand",
    category: "privacy",
    description: "Thailand's personal data protection law.",
    scope: "Organizations handling Thai personal data.",
    authority: "PDPC Thailand",
  },
  {
    code: "VN-PDPD",
    name: "Vietnam Personal Data Protection Decree",
    region: "Asia-Pacific",
    jurisdiction: "Vietnam",
    category: "privacy",
    description:
      "Vietnam's decree governing personal data protection and transfers.",
    scope: "Organizations processing Vietnamese personal data.",
    authority: "MPS / MIC",
  },
  {
    code: "PH-DPA",
    name: "Philippines Data Privacy Act",
    region: "Asia-Pacific",
    jurisdiction: "Philippines",
    category: "privacy",
    description: "Philippine personal data protection law.",
    scope: "Personal information controllers and processors.",
    authority: "NPC",
  },
  {
    code: "POPIA",
    name: "Protection of Personal Information Act",
    region: "Africa",
    jurisdiction: "South Africa",
    category: "privacy",
    description: "South African privacy and personal information obligations.",
    scope: "Responsible parties and operators.",
    authority: "Information Regulator",
  },
  {
    code: "NDPA-NG",
    name: "Nigeria Data Protection Act",
    region: "Africa",
    jurisdiction: "Nigeria",
    category: "privacy",
    description: "Nigeria's data protection law and obligations.",
    scope: "Data controllers and processors in Nigeria.",
    authority: "NDPC",
  },
  {
    code: "KENYA-DPA",
    name: "Kenya Data Protection Act",
    region: "Africa",
    jurisdiction: "Kenya",
    category: "privacy",
    description: "Kenyan data protection and processing requirements.",
    scope: "Data controllers and processors in Kenya.",
    authority: "ODPC",
  },
  {
    code: "EGYPT-PDPL",
    name: "Egypt Personal Data Protection Law",
    region: "Africa",
    jurisdiction: "Egypt",
    category: "privacy",
    description: "Egyptian personal data protection law.",
    scope: "Data controllers and processors in Egypt.",
    authority: "Egyptian Data Protection Center",
  },
  {
    code: "AU-CYBER-PRIVACY",
    name: "African Union Cyber Security and Personal Data Protection Convention",
    region: "Africa",
    jurisdiction: "African Union",
    category: "cybersecurity and privacy",
    description:
      "Continental convention for cyber security and personal data protection.",
    scope: "AU member states adopting the convention.",
    authority: "African Union",
  },
  {
    code: "LGPD",
    name: "Lei Geral de Proteção de Dados",
    region: "Latin America",
    jurisdiction: "Brazil",
    category: "privacy",
    description: "Brazilian data protection law.",
    scope: "Controllers and processors handling Brazilian personal data.",
    authority: "ANPD",
  },
  {
    code: "MEXICO-DPA",
    name: "Mexico Federal Data Protection Law",
    region: "Latin America",
    jurisdiction: "Mexico",
    category: "privacy",
    description: "Mexico's federal privacy law for personal data.",
    scope: "Private-sector entities in Mexico.",
    authority: "INAI",
  },
  {
    code: "ARG-PDPL",
    name: "Argentina Personal Data Protection Law",
    region: "Latin America",
    jurisdiction: "Argentina",
    category: "privacy",
    description: "Argentina's personal data protection framework.",
    scope: "Controllers and processors in Argentina.",
    authority: "AAIP",
  },
  {
    code: "CHILE-DPF",
    name: "Chile Data Protection Framework",
    region: "Latin America",
    jurisdiction: "Chile",
    category: "privacy",
    description: "Chile's evolving personal data protection regime.",
    scope: "Organizations handling Chilean personal data.",
    authority: "Chilean data protection authorities",
  },
  {
    code: "COLOMBIA-HABEAS",
    name: "Colombia Habeas Data",
    region: "Latin America",
    jurisdiction: "Colombia",
    category: "privacy",
    description: "Colombian personal data and rights obligations.",
    scope: "Controllers and processors in Colombia.",
    authority: "SIC",
  },
  {
    code: "MITRE-ATTACK",
    name: "MITRE ATT&CK",
    region: "Global Standards",
    jurisdiction: "Global",
    category: "threat intelligence",
    description:
      "Adversary tactics, techniques, and procedures knowledge base.",
    scope: "Threat modeling and detection engineering.",
    authority: "MITRE",
  },
  {
    code: "MITRE-D3FEND",
    name: "MITRE D3FEND",
    region: "Global Standards",
    jurisdiction: "Global",
    category: "defense",
    description: "Defensive countermeasure knowledge base.",
    scope: "Security architecture and control mapping.",
    authority: "MITRE",
  },
  {
    code: "OWASP-TOP10",
    name: "OWASP Top 10",
    region: "Global Standards",
    jurisdiction: "Global",
    category: "application security",
    description: "Common web application risk taxonomy.",
    scope: "Application security programs.",
    authority: "OWASP",
  },
  {
    code: "OWASP-ASVS",
    name: "OWASP ASVS",
    region: "Global Standards",
    jurisdiction: "Global",
    category: "application security",
    description: "Application security verification standard.",
    scope: "Secure development and assurance.",
    authority: "OWASP",
  },
  {
    code: "OWASP-SAMM",
    name: "OWASP SAMM",
    region: "Global Standards",
    jurisdiction: "Global",
    category: "application security",
    description: "Software assurance maturity model.",
    scope: "Application security maturity programs.",
    authority: "OWASP",
  },
  {
    code: "CSA-CCM",
    name: "Cloud Controls Matrix",
    region: "Global Standards",
    jurisdiction: "Global",
    category: "cloud security",
    description: "Cloud control framework for provider and consumer assurance.",
    scope: "Cloud governance and audits.",
    authority: "Cloud Security Alliance",
  },
  {
    code: "CSA-STAR",
    name: "CSA STAR",
    region: "Global Standards",
    jurisdiction: "Global",
    category: "cloud assurance",
    description: "Cloud security assurance registry and certification program.",
    scope: "Cloud providers.",
    authority: "Cloud Security Alliance",
  },
  {
    code: "CIS-BENCHMARKS",
    name: "CIS Benchmarks",
    region: "Global Standards",
    jurisdiction: "Global",
    category: "hardening",
    description: "Secure configuration benchmarks across technologies.",
    scope: "Infrastructure and platform hardening.",
    authority: "Center for Internet Security",
  },
  {
    code: "IEC-62443",
    name: "IEC 62443",
    region: "Global Standards",
    jurisdiction: "Global",
    category: "industrial security",
    description: "Industrial automation and control systems security.",
    scope: "OT and ICS environments.",
    authority: "IEC",
  },
  {
    code: "FIPS-140-3",
    name: "FIPS 140-3",
    region: "Global Standards",
    jurisdiction: "Global",
    category: "cryptography",
    description: "Cryptographic module security validation standard.",
    scope: "Approved cryptographic modules.",
    authority: "NIST",
  },
  {
    code: "ISO-SAE-21434",
    name: "ISO/SAE 21434",
    region: "Global Standards",
    jurisdiction: "Global",
    category: "automotive",
    description: "Cybersecurity engineering for road vehicles.",
    scope: "Automotive systems and suppliers.",
    authority: "ISO / SAE",
  },
  {
    code: "TISAX",
    name: "TISAX",
    region: "Global Standards",
    jurisdiction: "Global",
    category: "automotive supply chain",
    description: "Automotive information security assessment exchange.",
    scope: "Automotive supply chain participants.",
    authority: "ENX Association",
  },
  {
    code: "IEC-61508",
    name: "IEC 61508",
    region: "Global Standards",
    jurisdiction: "Global",
    category: "functional safety",
    description: "Functional safety lifecycle standard.",
    scope: "Safety-related systems and controls.",
    authority: "IEC",
  },
  {
    code: "NERC-CIP",
    name: "NERC CIP",
    region: "Global Standards",
    jurisdiction: "North America",
    category: "critical infrastructure",
    description: "North American electric reliability cybersecurity standards.",
    scope: "Bulk electric system entities.",
    authority: "NERC",
  },
  {
    code: "SWIFT-CSCF",
    name: "SWIFT Customer Security Controls Framework",
    region: "Global Standards",
    jurisdiction: "Global",
    category: "financial services",
    description: "Security baseline for SWIFT-connected institutions.",
    scope: "Financial institutions using SWIFT.",
    authority: "SWIFT",
  },
  {
    code: "HITRUST",
    name: "HITRUST CSF",
    region: "Global Standards",
    jurisdiction: "Global",
    category: "assurance",
    description: "Healthcare-oriented security and privacy control framework.",
    scope: "Healthcare and regulated enterprises.",
    authority: "HITRUST",
  },
  {
    code: "FAIR",
    name: "FAIR Risk Framework",
    region: "Global Standards",
    jurisdiction: "Global",
    category: "risk quantification",
    description:
      "Factor analysis of information risk for quantitative cyber risk analysis.",
    scope: "Risk quantification and scenario modeling.",
    authority: "The FAIR Institute",
  },
  {
    code: "OPENCRE",
    name: "OpenCRE",
    region: "Global Standards",
    jurisdiction: "Global",
    category: "control mapping",
    description:
      "Open control reference exchange for security and privacy mappings.",
    scope: "Framework crosswalk and mapping programs.",
    authority: "OpenCRE community",
  },
  {
    code: "OPENSSF",
    name: "OpenSSF",
    region: "Global Standards",
    jurisdiction: "Global",
    category: "software supply chain",
    description: "Open source software security initiatives and projects.",
    scope: "Software supply chain programs.",
    authority: "OpenSSF",
  },
  {
    code: "SLSA",
    name: "SLSA Framework",
    region: "Global Standards",
    jurisdiction: "Global",
    category: "software supply chain",
    description: "Supply-chain Levels for Software Artifacts.",
    scope: "Build and release integrity.",
    authority: "OpenSSF",
  },
  {
    code: "SPDX",
    name: "SPDX",
    region: "Global Standards",
    jurisdiction: "Global",
    category: "sbom",
    description: "Software Package Data Exchange specification.",
    scope: "SBOM and license reporting.",
    authority: "Linux Foundation",
  },
  {
    code: "CYCLONE-DX",
    name: "CycloneDX",
    region: "Global Standards",
    jurisdiction: "Global",
    category: "sbom",
    description:
      "Software bill of materials specification for components and dependencies.",
    scope: "SBOM generation and exchange.",
    authority: "OWASP",
  },
];

const GLOBAL_REGIONS_DATA = [
  { id: "region:North America", label: "North America", kind: "region" },
  { id: "region:Europe", label: "Europe", kind: "region" },
  { id: "region:Middle East", label: "Middle East", kind: "region" },
  { id: "region:Asia-Pacific", label: "Asia-Pacific", kind: "region" },
  { id: "region:Africa", label: "Africa", kind: "region" },
  { id: "region:Latin America", label: "Latin America", kind: "region" },
  { id: "region:Global Standards", label: "Global Standards", kind: "region" },
];

async function seed() {
  console.log("[seed-global-data] Connecting to database...");
  await client.connect();

  try {
    const {
      complianceFrameworks,
      complianceControls,
      complianceRelationships,
    } = await import("./compliance-reference-data.mjs");

    const allFrameworks = [...complianceFrameworks];

    for (const gf of GLOBAL_FRAMEWORK_PACKS) {
      const exists = allFrameworks.some(f => f.code === gf.code);
      if (!exists) {
        allFrameworks.push({
          code: gf.code,
          name: gf.name,
          country: gf.jurisdiction,
          description: gf.description,
          scope: gf.scope,
          enforcementAuthority: gf.authority,
          maxPenalty: null,
        });
      }
    }

    console.log(
      `[seed-global-data] Loaded ${allFrameworks.length} frameworks total (${complianceFrameworks.length} local + ${GLOBAL_FRAMEWORK_PACKS.length} global).`
    );

    let fwCount = 0;
    for (const fw of allFrameworks) {
      await client.query(
        `INSERT INTO "frameworks" ("code", "name", "country", "description", "scope", "enforcementAuthority", "maxPenalty")
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT ("code") DO UPDATE SET
           "name" = EXCLUDED."name",
           "country" = EXCLUDED."country",
           "description" = EXCLUDED."description",
           "scope" = EXCLUDED."scope",
           "enforcementAuthority" = EXCLUDED."enforcementAuthority",
           "maxPenalty" = EXCLUDED."maxPenalty",
           "updatedAt" = NOW()`,
        [
          fw.code,
          fw.name,
          fw.country,
          fw.description ?? null,
          fw.scope ?? null,
          fw.enforcementAuthority ?? null,
          fw.maxPenalty ?? null,
        ]
      );
      fwCount++;
    }
    console.log(`[seed-global-data] Seeded ${fwCount} frameworks.`);

    const fwRes = await client.query(`SELECT "id", "code" FROM "frameworks"`);
    const codeToId = new Map();
    for (const row of fwRes.rows) {
      codeToId.set(row.code, row.id);
    }

    await client.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "complianceControls_frameworkId_controlCode_idx"
       ON "complianceControls" ("frameworkId", "controlCode")`
    );

    const genericControls = [
      {
        code: "GEN-1",
        name: "Governance and Risk Management",
        category: "Governance",
        description:
          "Establish governance framework and risk management processes.",
        requirement:
          "Define and maintain governance structure with defined roles and responsibilities.",
        applicability: "All organizations.",
      },
      {
        code: "GEN-2",
        name: "Access Control and Identity Management",
        category: "Access Control",
        description: "Implement identity and access management controls.",
        requirement:
          "Enforce least privilege, MFA, and regular access reviews.",
        applicability: "All systems and users.",
      },
      {
        code: "GEN-3",
        name: "Incident Response and Reporting",
        category: "Incident Response",
        description:
          "Establish incident response capability and reporting procedures.",
        requirement:
          "Define incident response plan with regulatory notification timelines.",
        applicability: "All organizations.",
      },
      {
        code: "GEN-4",
        name: "Data Protection and Privacy",
        category: "Data Protection",
        description:
          "Implement data protection controls for personal and sensitive data.",
        requirement:
          "Classify data and apply appropriate technical and organizational safeguards.",
        applicability: "All data processing activities.",
      },
      {
        code: "GEN-5",
        name: "Third-Party Risk Management",
        category: "Third-Party",
        description: "Manage vendor and third-party risk across the lifecycle.",
        requirement:
          "Assess, monitor, and contractually obligate third parties to security standards.",
        applicability: "Vendors and service providers.",
      },
      {
        code: "GEN-6",
        name: "Business Continuity and Disaster Recovery",
        category: "Resilience",
        description: "Ensure business continuity and recovery capabilities.",
        requirement:
          "Develop, test, and maintain BCP/DR plans aligned to regulatory expectations.",
        applicability: "Critical business functions.",
      },
      {
        code: "GEN-7",
        name: "Audit Logging and Monitoring",
        category: "Monitoring",
        description: "Maintain audit logs and continuous monitoring.",
        requirement:
          "Log security events, retain logs per regulatory requirements, and monitor for anomalies.",
        applicability: "All systems.",
      },
      {
        code: "GEN-8",
        name: "Security Awareness and Training",
        category: "Governance",
        description: "Provide security awareness and role-based training.",
        requirement: "Conduct regular training and assess staff competency.",
        applicability: "All employees and contractors.",
      },
      {
        code: "GEN-9",
        name: "Vulnerability Management",
        category: "Vulnerability Management",
        description: "Identify and remediate security vulnerabilities.",
        requirement:
          "Perform regular scans, prioritize by risk, and remediate within SLAs.",
        applicability: "All systems and applications.",
      },
      {
        code: "GEN-10",
        name: "Compliance Reporting and Documentation",
        category: "Governance",
        description: "Maintain compliance evidence and reporting.",
        requirement:
          "Document control implementations and produce compliance reports as required.",
        applicability: "All regulated activities.",
      },
    ];

    const esc = s => (s ? `'${s.replace(/'/g, "''")}'` : "NULL");
    let controlCount = 0;
    const controlValues = [];

    for (const ctrl of complianceControls) {
      const frameworkId = codeToId.get(ctrl.frameworkCode);
      if (!frameworkId) continue;
      controlValues.push(
        `(${frameworkId}, ${esc(ctrl.controlCode)}, ${esc(ctrl.controlName)}, ${esc(ctrl.category)}, ${esc(ctrl.description)}, ${esc(ctrl.requirement)}, ${esc(ctrl.applicability)})`
      );
      controlCount++;
    }

    for (const gf of GLOBAL_FRAMEWORK_PACKS) {
      const frameworkId = codeToId.get(gf.code);
      if (!frameworkId) continue;
      for (const gc of genericControls) {
        const ctrlCode = `${gf.code}-${gc.code}`;
        controlValues.push(
          `(${frameworkId}, ${esc(ctrlCode)}, ${esc(`${gf.name}: ${gc.name}`)}, ${esc(gc.category)}, ${esc(gc.description)}, ${esc(gc.requirement)}, ${esc(gc.applicability)})`
        );
        controlCount++;
      }
    }

    const CHUNK_SIZE = 500;
    for (let i = 0; i < controlValues.length; i += CHUNK_SIZE) {
      const chunk = controlValues.slice(i, i + CHUNK_SIZE);
      await client.query(
        `INSERT INTO "complianceControls" ("frameworkId", "controlCode", "controlName", "category", "description", "requirement", "applicability")
         VALUES ${chunk.join(", ")}
         ON CONFLICT ("frameworkId", "controlCode") DO NOTHING`
      );
    }
    console.log(
      `[seed-global-data] Seeded ${controlCount} compliance controls.`
    );

    const relValues = [];
    for (const rel of complianceRelationships) {
      const srcId = codeToId.get(rel.sourceFrameworkCode);
      const tgtId = codeToId.get(rel.targetFrameworkCode);
      if (!srcId || !tgtId) continue;
      relValues.push(
        `(${srcId}, ${tgtId}, ${esc(rel.relationshipType)}, ${esc(rel.description)}, ${esc(rel.severity)}, ${esc(rel.riskLevel)}, ${esc(rel.mitigation)})`
      );
    }

    const knownRelationships = [
      {
        source: "GDPR",
        target: "UK-GDPR",
        type: "overlap",
        description: "UK GDPR is substantially similar to EU GDPR post-Brexit.",
        severity: "high",
        riskLevel: "high",
        mitigation:
          "Maintain aligned data protection programs with jurisdiction-specific DPA notifications.",
      },
      {
        source: "GDPR",
        target: "LGPD",
        type: "overlap",
        description:
          "Both follow similar data subject rights model with consent and DPO requirements.",
        severity: "high",
        riskLevel: "high",
        mitigation:
          "Use GDPR as baseline and layer LGPD-specific DPO registration and ANPD notifications.",
      },
      {
        source: "GDPR",
        target: "PIPEDA",
        type: "coordination",
        description:
          "Both require consent and individual access rights but differ in breach notification timing.",
        severity: "medium",
        riskLevel: "medium",
        mitigation:
          "Harmonize consent management with region-specific timelines and authorities.",
      },
      {
        source: "GDPR",
        target: "POPIA",
        type: "overlap",
        description: "POPIA based on GDPR principles with local adaptations.",
        severity: "medium",
        riskLevel: "medium",
        mitigation:
          "Apply GDPR baseline with South Africa-specific condition and operator requirements.",
      },
      {
        source: "GDPR",
        target: "PDPL-KSA",
        type: "coordination",
        description:
          "Both regulate personal data rights but PDPL-KSA has stricter cross-border rules.",
        severity: "high",
        riskLevel: "high",
        mitigation:
          "Implement dual jurisdiction data mapping with separate processing registers.",
      },
      {
        source: "NIST-CSF-2",
        target: "ISO-27001",
        type: "coordination",
        description:
          "NIST CSF functions align to ISO 27001 Annex A control objectives.",
        severity: "high",
        riskLevel: "medium",
        mitigation:
          "Use NIST CSF as risk framework and ISO 27001 for certifiable ISMS.",
      },
      {
        source: "NIST-CSF-2",
        target: "NIST-SP-800-53",
        type: "dependency",
        description:
          "NIST CSF implementation relies on SP 800-53 control catalog.",
        severity: "high",
        riskLevel: "medium",
        mitigation:
          "Map CSF functions and categories to SP 800-53 control families.",
      },
      {
        source: "NIST-SP-800-171",
        target: "CMMC",
        type: "dependency",
        description:
          "CMMC builds upon NIST SP 800-171 control requirements for DIB.",
        severity: "high",
        riskLevel: "high",
        mitigation:
          "Achieve SP 800-171 compliance first, then layer CMMC maturity processes.",
      },
      {
        source: "PCI-DSS",
        target: "CIS-V8",
        type: "coordination",
        description:
          "CIS controls provide technical safeguards that satisfy many PCI DSS requirements.",
        severity: "medium",
        riskLevel: "medium",
        mitigation:
          "Leverage CIS Controls implementation for PCI DSS evidence collection.",
      },
      {
        source: "NIS2",
        target: "DORA",
        type: "overlap",
        description:
          "Both require ICT risk management, incident reporting, and resilience testing.",
        severity: "critical",
        riskLevel: "critical",
        mitigation:
          "Build unified ICT risk and resilience program satisfying both NIS2 and DORA.",
      },
      {
        source: "NIS2",
        target: "GDPR",
        type: "coordination",
        description:
          "NIS2 security obligations support GDPR Article 32 security requirements.",
        severity: "high",
        riskLevel: "high",
        mitigation:
          "Coordinate security incident reporting paths between NIS2 CSIRT and GDPR DPA.",
      },
      {
        source: "DORA",
        target: "PSD2",
        type: "overlap",
        description:
          "DORA extends PSD2 ICT requirements to broader financial sector.",
        severity: "high",
        riskLevel: "high",
        mitigation:
          "Extend PSD2 ICT oversight to cover all DORA-regulated financial entities.",
      },
      {
        source: "EU-AI-ACT",
        target: "NIST-AI-RMF",
        type: "coordination",
        description:
          "NIST AI RMF risk management aligns with EU AI Act risk categories.",
        severity: "high",
        riskLevel: "high",
        mitigation:
          "Use NIST AI RMF to operationalize EU AI Act risk classification and controls.",
      },
      {
        source: "EU-AI-ACT",
        target: "ISO-42001",
        type: "coordination",
        description:
          "ISO 42001 provides certifiable AI management system supporting EU AI Act compliance.",
        severity: "medium",
        riskLevel: "medium",
        mitigation:
          "Implement ISO 42001 AI management system for EU AI Act conformity.",
      },
      {
        source: "HIPAA",
        target: "HITECH",
        type: "dependency",
        description:
          "HITECH strengthens HIPAA with enhanced breach notification and enforcement.",
        severity: "high",
        riskLevel: "high",
        mitigation:
          "Operate unified health data governance program spanning both acts.",
      },
      {
        source: "HIPAA",
        target: "NIST-SP-800-53",
        type: "coordination",
        description:
          "NIST SP 800-53 controls are commonly used to implement HIPAA Security Rule.",
        severity: "medium",
        riskLevel: "medium",
        mitigation:
          "Map HIPAA Security Rule to NIST SP 800-53 moderate baseline.",
      },
      {
        source: "SOX",
        target: "COBIT-2019",
        type: "coordination",
        description:
          "COBIT 2019 provides IT governance framework supporting SOX internal controls.",
        severity: "medium",
        riskLevel: "medium",
        mitigation:
          "Use COBIT 2019 governance objectives for SOX IT control framework.",
      },
      {
        source: "SOC2",
        target: "ISO-27001",
        type: "overlap",
        description:
          "SOC 2 trust principles overlap with ISO 27001 Annex A controls.",
        severity: "high",
        riskLevel: "medium",
        mitigation:
          "Build unified control set satisfying both SOC 2 and ISO 27001 certification.",
      },
      {
        source: "PIPL",
        target: "CSL",
        type: "overlap",
        description:
          "Both require cybersecurity safeguards; PIPL extends privacy protections on top of CSL.",
        severity: "high",
        riskLevel: "high",
        mitigation:
          "Operate unified control baseline with privacy-specific overlays.",
      },
      {
        source: "PIPL",
        target: "PDPL-KSA",
        type: "overlap",
        description:
          "Both require lawful basis, rights handling, and breach governance for personal data.",
        severity: "critical",
        riskLevel: "critical",
        mitigation:
          "Use jurisdiction-aware privacy workflows with country-specific legal notices.",
      },
      {
        source: "CSL",
        target: "MLPS-2",
        type: "overlap",
        description:
          "CSL obligations operationalized through MLPS technical controls.",
        severity: "high",
        riskLevel: "high",
        mitigation:
          "Maintain bidirectional control map from CSL to MLPS evidence.",
      },
      {
        source: "NCA-ECC",
        target: "NIST-CSF-2",
        type: "coordination",
        description:
          "NCA ECC governance domains align with NIST CSF functions.",
        severity: "medium",
        riskLevel: "medium",
        mitigation:
          "Align ECC domain controls to NIST CSF for multinational programs.",
      },
      {
        source: "PDPL-KSA",
        target: "NCA-ECC",
        type: "dependency",
        description:
          "PDPL compliance depends on ECC technical and governance controls.",
        severity: "high",
        riskLevel: "high",
        mitigation:
          "Map PDPL obligations to ECC controls and validate evidence coverage.",
      },
      {
        source: "FEDRAMP",
        target: "CSA-CCM",
        type: "coordination",
        description:
          "CSA CCM provides cloud control framework supporting FedRAMP authorization.",
        severity: "medium",
        riskLevel: "medium",
        mitigation:
          "Use CSA CCM as pre-mapping for FedRAMP control implementation.",
      },
      {
        source: "LGPD",
        target: "ARG-PDPL",
        type: "overlap",
        description:
          "Both Latin American privacy laws follow GDPR-inspired principles.",
        severity: "medium",
        riskLevel: "medium",
        mitigation:
          "Apply regional privacy baseline with country-specific authority registration.",
      },
      {
        source: "PDPA-SG",
        target: "MAS-TRM",
        type: "coordination",
        description:
          "MAS TRM provides technology risk framework complementing PDPA obligations.",
        severity: "high",
        riskLevel: "high",
        mitigation:
          "Coordinate PDPA data protection with MAS TRM technology risk controls.",
      },
      {
        source: "APPI",
        target: "PIPA-KR",
        type: "coordination",
        description:
          "Both East Asian privacy frameworks with consent and cross-border transfer rules.",
        severity: "medium",
        riskLevel: "medium",
        mitigation:
          "Implement shared privacy operations with country-specific PPC/PIPC filings.",
      },
      {
        source: "NCA-ECC",
        target: "NCA-CCC",
        type: "dependency",
        description:
          "CCC cloud controls extend and specialize ECC for cloud environments.",
        severity: "high",
        riskLevel: "medium",
        mitigation:
          "Apply ECC baseline then overlay CCC cloud-specific controls.",
      },
      {
        source: "GDPR",
        target: "NIS2",
        type: "coordination",
        description:
          "Information security obligations under Art 32 GDPR and NIS2 security measures.",
        severity: "high",
        riskLevel: "high",
        mitigation:
          "Implement unified technical and organizational measures program.",
      },
    ];

    for (const rel of knownRelationships) {
      const srcId = codeToId.get(rel.source);
      const tgtId = codeToId.get(rel.target);
      if (!srcId || !tgtId) continue;
      relValues.push(
        `(${srcId}, ${tgtId}, ${esc(rel.type)}, ${esc(rel.description)}, ${esc(rel.severity)}, ${esc(rel.riskLevel)}, ${esc(null)})`
      );
    }

    if (relValues.length > 0) {
      const REL_CHUNK_SIZE = 250;
      for (let i = 0; i < relValues.length; i += REL_CHUNK_SIZE) {
        const chunk = relValues.slice(i, i + REL_CHUNK_SIZE);
        await client.query(
          `INSERT INTO "frameworkRelationships" ("sourceFrameworkId", "targetFrameworkId", "relationshipType", "description", "severity", "riskLevel", "mitigation")
           VALUES ${chunk.join(", ")}
           ON CONFLICT ("sourceFrameworkId", "targetFrameworkId") DO NOTHING`
        );
      }
      console.log(
        `[seed-global-data] Seeded ${relValues.length} framework relationships.`
      );
    }

    console.log("[seed-global-data] Complete.");
  } catch (err) {
    console.error("[seed-global-data] Failed:", err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seed();
