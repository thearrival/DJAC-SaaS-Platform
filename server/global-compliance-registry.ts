export type GlobalRegion =
  | "North America"
  | "Europe"
  | "Middle East"
  | "Asia-Pacific"
  | "Africa"
  | "Latin America"
  | "Global Standards";

export type GlobalFrameworkPack = {
  code: string;
  name: string;
  region: GlobalRegion;
  jurisdiction: string;
  category: string;
  description: string;
  scope: string;
  authority: string;
};

export type IndustryEdition = {
  code: string;
  name: string;
  sector: string;
  description: string;
  defaultFrameworkCodes: string[];
  defaultAgentCodes: string[];
};

export type AIAgentCatalogEntry = {
  code: string;
  name: string;
  focus: string;
  regions: GlobalRegion[];
};

export type GraphNodeKind =
  | "region"
  | "framework"
  | "edition"
  | "agent"
  | "standard";

export type GraphNode = {
  id: string;
  label: string;
  kind: GraphNodeKind;
  region?: GlobalRegion;
};

export type GraphEdge = {
  source: string;
  target: string;
  relation: "contains" | "activates" | "supports" | "maps_to";
};

export type GlobalRegistrySummary = {
  regions: number;
  frameworks: number;
  editions: number;
  agents: number;
  graphNodes: number;
  graphEdges: number;
};

export const GLOBAL_REGIONS: GlobalRegion[] = [
  "North America",
  "Europe",
  "Middle East",
  "Asia-Pacific",
  "Africa",
  "Latin America",
  "Global Standards",
];

export const GLOBAL_FRAMEWORK_PACKS: GlobalFrameworkPack[] = [
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
    region: "Europe",
    jurisdiction: "Global",
    category: "information security",
    description: "Information security management system standard.",
    scope: "Organizational ISMS programs.",
    authority: "ISO/IEC",
  },
  {
    code: "ISO-27017",
    name: "ISO/IEC 27017",
    region: "Europe",
    jurisdiction: "Global",
    category: "cloud security",
    description: "Cloud security controls guidance.",
    scope: "Cloud providers and customers.",
    authority: "ISO/IEC",
  },
  {
    code: "ISO-27018",
    name: "ISO/IEC 27018",
    region: "Europe",
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
    region: "Europe",
    jurisdiction: "Global",
    category: "privacy",
    description: "Privacy information management extension to ISO 27001/27002.",
    scope: "Privacy governance programs.",
    authority: "ISO/IEC",
  },
  {
    code: "ISO-22301",
    name: "ISO/IEC 22301",
    region: "Europe",
    jurisdiction: "Global",
    category: "resilience",
    description: "Business continuity management system standard.",
    scope: "Continuity and resilience programs.",
    authority: "ISO/IEC",
  },
  {
    code: "ISO-42001",
    name: "ISO/IEC 42001",
    region: "Europe",
    jurisdiction: "Global",
    category: "ai governance",
    description: "AI management system standard.",
    scope: "AI governance programs.",
    authority: "ISO/IEC",
  },
  {
    code: "ISO-31000",
    name: "ISO 31000",
    region: "Europe",
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

export const GLOBAL_AI_AGENTS: AIAgentCatalogEntry[] = [
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

export const GLOBAL_INDUSTRY_EDITIONS: IndustryEdition[] = [
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

export function listGlobalFrameworkPacks(): GlobalFrameworkPack[] {
  return [...GLOBAL_FRAMEWORK_PACKS];
}

export function listGlobalFrameworkPacksByRegion(
  region: GlobalRegion
): GlobalFrameworkPack[] {
  return GLOBAL_FRAMEWORK_PACKS.filter(pack => pack.region === region);
}

export function getGlobalFrameworkPackByCode(
  code: string
): GlobalFrameworkPack | null {
  const normalized = code.trim().toLowerCase();
  return (
    GLOBAL_FRAMEWORK_PACKS.find(
      pack => pack.code.toLowerCase() === normalized
    ) ?? null
  );
}

export function listGlobalIndustryEditions(): IndustryEdition[] {
  return [...GLOBAL_INDUSTRY_EDITIONS];
}

export function listGlobalAIAgents(): AIAgentCatalogEntry[] {
  return [...GLOBAL_AI_AGENTS];
}

export function buildGlobalGraphSeed(): {
  nodes: GraphNode[];
  edges: GraphEdge[];
} {
  const nodes: GraphNode[] = [
    ...GLOBAL_REGIONS.map(region => ({
      id: `region:${region}`,
      label: region,
      kind: "region" as const,
    })),
    ...GLOBAL_FRAMEWORK_PACKS.map(pack => ({
      id: `framework:${pack.code}`,
      label: pack.name,
      kind:
        pack.region === "Global Standards"
          ? ("standard" as const)
          : ("framework" as const),
      region: pack.region,
    })),
    ...GLOBAL_INDUSTRY_EDITIONS.map(edition => ({
      id: `edition:${edition.code}`,
      label: edition.name,
      kind: "edition" as const,
    })),
    ...GLOBAL_AI_AGENTS.map(agent => ({
      id: `agent:${agent.code}`,
      label: agent.name,
      kind: "agent" as const,
    })),
  ];

  const edges: GraphEdge[] = [];

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

  return { nodes, edges };
}

export function getGlobalRegistrySummary(): GlobalRegistrySummary {
  const graph = buildGlobalGraphSeed();
  return {
    regions: GLOBAL_REGIONS.length,
    frameworks: GLOBAL_FRAMEWORK_PACKS.length,
    editions: GLOBAL_INDUSTRY_EDITIONS.length,
    agents: GLOBAL_AI_AGENTS.length,
    graphNodes: graph.nodes.length,
    graphEdges: graph.edges.length,
  };
}

export function searchGlobalRegistry(query: string, limit = 20) {
  const normalized = query.trim().toLowerCase();
  const matchesFrameworks = GLOBAL_FRAMEWORK_PACKS.filter(pack => {
    if (!normalized) return true;
    return [
      pack.code,
      pack.name,
      pack.region,
      pack.jurisdiction,
      pack.category,
      pack.description,
      pack.scope,
      pack.authority,
    ]
      .join(" ")
      .toLowerCase()
      .includes(normalized);
  });

  const matchesEditions = GLOBAL_INDUSTRY_EDITIONS.filter(edition => {
    if (!normalized) return true;
    return [
      edition.code,
      edition.name,
      edition.sector,
      edition.description,
      edition.defaultFrameworkCodes.join(" "),
      edition.defaultAgentCodes.join(" "),
    ]
      .join(" ")
      .toLowerCase()
      .includes(normalized);
  });

  const matchesAgents = GLOBAL_AI_AGENTS.filter(agent => {
    if (!normalized) return true;
    return [agent.code, agent.name, agent.focus, agent.regions.join(" ")]
      .join(" ")
      .toLowerCase()
      .includes(normalized);
  });

  return {
    query: query.trim(),
    frameworks: matchesFrameworks.slice(0, limit),
    editions: matchesEditions.slice(0, limit),
    agents: matchesAgents.slice(0, limit),
  };
}
