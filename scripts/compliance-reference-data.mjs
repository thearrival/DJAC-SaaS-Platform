export const complianceFrameworks = [
  {
    code: "PIPL",
    name: "Personal Information Protection Law",
    country: "China",
    description:
      "Personal information privacy law governing lawful processing, rights, and cross-border data transfer requirements.",
    scope: "All organizations processing personal information.",
    enforcementAuthority: "Cyberspace Administration of China (CAC)",
    maxPenalty: "Up to RMB 50M or 5% of annual turnover",
  },
  {
    code: "CSL",
    name: "Cybersecurity Law",
    country: "China",
    description:
      "Foundational cybersecurity law for network operators and critical information infrastructure protection.",
    scope:
      "Network operators and critical information infrastructure operators.",
    enforcementAuthority: "Cyberspace Administration of China (CAC)",
    maxPenalty: "Amended framework effective Jan 1, 2026 with higher penalties",
  },
  {
    code: "DSL",
    name: "Data Security Law",
    country: "China",
    description:
      "National framework for data classification, important data protection, and risk-based security controls.",
    scope: "All data processors in applicable jurisdiction.",
    enforcementAuthority: "Cyberspace Administration of China (CAC)",
    maxPenalty: "Major fines and business restrictions for severe violations",
  },
  {
    code: "MLPS2",
    name: "Multi-Level Protection Scheme 2.0",
    country: "China",
    description:
      "Technical and administrative baseline for classifying and protecting information systems by risk level.",
    scope:
      "All networked information systems operating in applicable jurisdiction.",
    enforcementAuthority: "MPS / CAC",
    maxPenalty:
      "Regulatory sanctions and mandatory remediation for non-compliance",
  },
  {
    code: "NDSM",
    name: "Regulations on Network Data Security Management",
    country: "China",
    description:
      "Implementing regulation for CSL, DSL, and PIPL obligations on network data governance and reporting.",
    scope: "Network data processors and important data handlers.",
    enforcementAuthority: "State Council / CAC",
    maxPenalty: "Administrative enforcement and operational constraints",
  },
  {
    code: "CIIP",
    name: "Critical Information Infrastructure Protection Regulations",
    country: "China",
    description:
      "Protection duties for operators of critical information infrastructure in national critical sectors.",
    scope: "Critical information infrastructure operators (CIIOs).",
    enforcementAuthority: "State Council / CAC / Sector Regulators",
    maxPenalty: "Severe penalties, supervision, and service restrictions",
  },
  {
    code: "VULN",
    name: "Management of Cybersecurity Vulnerabilities",
    country: "China",
    description:
      "Rules for vulnerability discovery, coordinated disclosure, and mandatory reporting timelines.",
    scope:
      "Organizations discovering or handling cybersecurity vulnerabilities.",
    enforcementAuthority: "MIIT / CAC / MPS",
    maxPenalty: "Penalties for delayed, withheld, or improper disclosure",
  },
  {
    code: "CBDT",
    name: "Cross-border Data Transfer Measures",
    country: "China",
    description:
      "Rules for overseas data transfer pathways, including CAC assessment, contracts, and certification routes.",
    scope: "Entities transferring personal or important data cross-border.",
    enforcementAuthority: "CAC",
    maxPenalty: "Transfer suspension and administrative sanctions",
  },
  {
    code: "PDPL",
    name: "Personal Data Protection Law",
    country: "Saudi Arabia",
    description:
      "Saudi national privacy law for personal data processing, rights management, and breach notifications.",
    scope:
      "All controllers and processors handling personal data in applicable jurisdiction.",
    enforcementAuthority: "Saudi Data and AI Authority (SDAIA)",
    maxPenalty: "Up to SAR 5M and possible additional sanctions",
  },
  {
    code: "UAE-PDPL",
    name: "UAE Federal Personal Data Protection Law",
    country: "United Arab Emirates",
    description:
      "UAE's comprehensive federal data protection law governing personal data processing, cross-border transfers, and data subject rights across all Emirates.",
    scope:
      "All controllers and processors handling personal data in the UAE, including free zones.",
    enforcementAuthority: "UAE Data Office / TDRA",
    maxPenalty: "Up to AED 5M and potential business suspension",
  },
  {
    code: "NCA",
    name: "National Cybersecurity Authority Framework Baseline",
    country: "Saudi Arabia",
    description:
      "National umbrella for mandatory cybersecurity governance and control obligations across sectors.",
    scope:
      "Government entities, critical sectors, and regulated private organizations.",
    enforcementAuthority: "National Cybersecurity Authority (NCA)",
    maxPenalty: "Operational and legal enforcement based on violation severity",
  },
  {
    code: "NCA-M117",
    name: "NCA Legal Powers (Royal Decree M/117)",
    country: "Saudi Arabia",
    description:
      "Legal enforcement powers, violations framework, and penalty authority for cybersecurity obligations.",
    scope: "Entities under NCA cybersecurity mandate.",
    enforcementAuthority: "National Cybersecurity Authority (NCA)",
    maxPenalty: "Formal legal penalties and enforcement actions",
  },
  {
    code: "ECC",
    name: "Essential Cybersecurity Controls (ECC-1:2018)",
    country: "Saudi Arabia",
    description:
      "Mandatory baseline controls organized across governance, defense, resilience, third-party, and ICS domains.",
    scope: "Government and critical entities in applicable jurisdiction.",
    enforcementAuthority: "National Cybersecurity Authority (NCA)",
    maxPenalty:
      "Corrective actions and compliance enforcement for mandated entities",
  },
  {
    code: "CCC",
    name: "Cloud Cybersecurity Controls (CCC-2:2024)",
    country: "Saudi Arabia",
    description:
      "Cloud-specific extension of NCA controls covering CSP/CST responsibilities and cloud assurance.",
    scope:
      "Cloud service providers and cloud service tenants operating in applicable jurisdiction.",
    enforcementAuthority: "National Cybersecurity Authority (NCA)",
    maxPenalty: "Regulatory enforcement and cloud service restrictions",
  },
  {
    code: "CSCC",
    name: "Critical Systems Cybersecurity Controls (CSCC-1:2019)",
    country: "Saudi Arabia",
    description:
      "Enhanced controls for systems designated as critical, with stricter security operations and assurance.",
    scope: "Critical systems identified by the NCA framework.",
    enforcementAuthority: "National Cybersecurity Authority (NCA)",
    maxPenalty:
      "Escalated remediation and regulatory action for critical system gaps",
  },
  {
    code: "OTCC",
    name: "Operational Technology Cybersecurity Controls (OTCC-1:2022)",
    country: "Saudi Arabia",
    description:
      "Industrial and OT cybersecurity requirements for control systems, segmentation, and safety alignment.",
    scope: "Organizations operating ICS and OT environments.",
    enforcementAuthority: "National Cybersecurity Authority (NCA)",
    maxPenalty: "High-impact enforcement for OT/ICS non-compliance",
  },
  {
    code: "DCC",
    name: "Data Cybersecurity Controls (DCC-1:2022)",
    country: "Saudi Arabia",
    description:
      "Control set focused on classification, protection, and secure handling of data assets.",
    scope: "Organizations processing sensitive or regulated data assets.",
    enforcementAuthority: "National Cybersecurity Authority (NCA)",
    maxPenalty: "Remediation directives and supervisory penalties",
  },
  {
    code: "TCC",
    name: "Telework Cybersecurity Controls (TCC-1:2020)",
    country: "Saudi Arabia",
    description:
      "Remote work security baseline for access, endpoint hardening, and secure collaboration.",
    scope: "Organizations enabling telework and remote access.",
    enforcementAuthority: "National Cybersecurity Authority (NCA)",
    maxPenalty: "Compliance directives and risk escalation actions",
  },
  {
    code: "GDPR",
    name: "General Data Protection Regulation",
    country: "EU",
    description:
      "EU data protection regulation governing personal data processing, rights, and cross-border transfer requirements.",
    scope: "Controllers and processors in the EU or targeting EU residents.",
    enforcementAuthority: "European Commission / DPAs",
    maxPenalty: "Up to EUR 20M or 4% of annual global turnover",
  },
  {
    code: "CCPA",
    name: "California Consumer Privacy Act",
    country: "US",
    description:
      "California privacy law for consumer rights, data collection transparency, and opt-out mechanisms.",
    scope: "Organizations collecting personal data of California residents.",
    enforcementAuthority: "California Privacy Protection Agency (CPPA)",
    maxPenalty: "Up to USD 7,500 per intentional violation",
  },
  {
    code: "LGPD",
    name: "Lei Geral de Proteção de Dados",
    country: "Brazil",
    description:
      "Brazilian data protection law governing personal data processing and rights.",
    scope: "Controllers and processors handling Brazilian personal data.",
    enforcementAuthority: "Autoridade Nacional de Proteção de Dados (ANPD)",
    maxPenalty: "Up to 2% of revenue in Brazil (capped at BRL 50M)",
  },
  {
    code: "ISO-27001",
    name: "ISO/IEC 27001",
    country: "Global",
    description:
      "International information security management system (ISMS) standard for establishing, implementing, and continuously improving security controls.",
    scope: "Organizations of all sizes across sectors with an ISMS program.",
    enforcementAuthority: "ISO/IEC / accredited certification bodies",
    maxPenalty:
      "Certification non-conformities require corrective action; no statutory fine",
  },
  {
    code: "ISO-27701",
    name: "ISO/IEC 27701",
    country: "Global",
    description:
      "Privacy information management extension to ISO 27001/27002 covering PII controllers and processors.",
    scope: "Organizations operating privacy governance programs.",
    enforcementAuthority: "ISO/IEC / accredited certification bodies",
    maxPenalty:
      "Certification non-conformities require corrective action; no statutory fine",
  },
  {
    code: "SOC2",
    name: "SOC 2",
    country: "US",
    description:
      "AICPA attestation framework for service organization controls over security, availability, processing integrity, confidentiality, and privacy.",
    scope: "Service organizations and their technology infrastructure.",
    enforcementAuthority: "AICPA / CPA firms",
    maxPenalty: "No statutory fine; attestation report qualification for gaps",
  },
  {
    code: "NIST-CSF-2",
    name: "NIST Cybersecurity Framework 2.0",
    country: "US",
    description:
      "Voluntary framework for improving cybersecurity posture through Govern, Identify, Protect, Detect, Respond, and Recover functions.",
    scope: "Organizations of all sizes across sectors.",
    enforcementAuthority: "NIST",
    maxPenalty: "No statutory fine; referenced by US regulatory regimes",
  },
  {
    code: "HIPAA",
    name: "Health Insurance Portability and Accountability Act",
    country: "US",
    description:
      "US federal law establishing privacy and security standards for protected health information.",
    scope: "Covered entities and business associates handling PHI.",
    enforcementAuthority: "HHS Office for Civil Rights (OCR)",
    maxPenalty: "Up to USD 1.9M per calendar year per violation category",
  },
  {
    code: "PCI-DSS",
    name: "Payment Card Industry Data Security Standard",
    country: "Global",
    description:
      "Contractual security standard for organizations that store, process, or transmit cardholder data.",
    scope:
      "Merchants, processors, acquirers, and issuers in the card payment ecosystem.",
    enforcementAuthority: "PCI Security Standards Council",
    maxPenalty:
      "Fines, card brand penalties, and termination of processing rights",
  },
  {
    code: "NIS2",
    name: "NIS2 Directive",
    country: "EU",
    description:
      "EU directive strengthening cybersecurity obligations for essential and important entities, including incident reporting and supply-chain security.",
    scope: "Essential and important entities across the EU.",
    enforcementAuthority: "ENISA / national competent authorities",
    maxPenalty: "Up to EUR 10M or 2% of global turnover",
  },
  {
    code: "DORA",
    name: "Digital Operational Resilience Act",
    country: "EU",
    description:
      "EU regulation for ICT risk management, incident reporting, digital operational resilience testing, and third-party risk in the financial sector.",
    scope:
      "EU financial entities and their critical ICT third-party providers.",
    enforcementAuthority: "European Supervisory Authorities",
    maxPenalty: "Up to 2% of annual global turnover",
  },
  {
    code: "EU-AI-ACT",
    name: "EU AI Act",
    country: "EU",
    description:
      "Risk-based regulation of artificial intelligence systems, imposing transparency, governance, and conformity obligations by AI risk class.",
    scope: "AI providers, deployers, importers, and distributors in the EU.",
    enforcementAuthority: "European Commission / national authorities",
    maxPenalty: "Up to EUR 35M or 7% of global turnover",
  },
  {
    code: "UK-GDPR",
    name: "UK GDPR",
    country: "United Kingdom",
    description:
      "UK-retained data protection framework aligned with GDPR, enforced by the Information Commissioner's Office.",
    scope: "UK data controllers and processors.",
    enforcementAuthority: "ICO (Information Commissioner's Office)",
    maxPenalty: "Up to GBP 17.5M or 4% of global turnover",
  },
  {
    code: "PIPEDA",
    name: "Personal Information Protection and Electronic Documents Act",
    country: "Canada",
    description:
      "Canadian private-sector privacy law governing collection, use, and disclosure of personal information.",
    scope: "Private-sector organizations in Canada.",
    enforcementAuthority: "Office of the Privacy Commissioner of Canada",
    maxPenalty: "Up to CAD 100K per violation plus court-ordered damages",
  },
  {
    code: "PRIVACY-ACT-AU",
    name: "Australian Privacy Act",
    country: "Australia",
    description:
      "Australian privacy framework establishing Australian Privacy Principles (APPs) for handling personal information.",
    scope: "Australian organizations and entities with APP obligations.",
    enforcementAuthority:
      "Office of the Australian Information Commissioner (OAIC)",
    maxPenalty: "Up to AUD 50M or 30% of turnover",
  },
  {
    code: "APPI",
    name: "Act on the Protection of Personal Information",
    country: "Japan",
    description:
      "Japanese personal data protection law covering acquisition, use, and cross-border transfer of personal information.",
    scope: "Business operators handling personal information in Japan.",
    enforcementAuthority: "Personal Information Protection Commission (PPC)",
    maxPenalty:
      "Up to JPY 100M for violations; orders and administrative measures",
  },
  {
    code: "PIPA-KR",
    name: "Personal Information Protection Act",
    country: "South Korea",
    description:
      "South Korean comprehensive privacy law covering personal information processing, rights, and cross-border transfers.",
    scope: "Personal information controllers and processors in Korea.",
    enforcementAuthority: "PIPC (Personal Information Protection Commission)",
    maxPenalty: "Up to 3% of revenue or KRW 1B per violation",
  },
  {
    code: "PDPA-SG",
    name: "Singapore Personal Data Protection Act",
    country: "Singapore",
    description:
      "Singapore privacy law governing collection, use, and disclosure of personal data, including breach notification and cross-border transfer rules.",
    scope: "Organizations processing personal data in Singapore.",
    enforcementAuthority: "PDPC (Personal Data Protection Commission)",
    maxPenalty: "Up to 10% of annual turnover or SGD 1M",
  },
  {
    code: "DPDP-IN",
    name: "Digital Personal Data Protection Act",
    country: "India",
    description:
      "India's digital personal data protection framework establishing notice, consent, purpose limitation, and data subject rights obligations.",
    scope: "Data fiduciaries and processors in India.",
    enforcementAuthority: "Data Protection Board of India",
    maxPenalty: "Up to INR 250 Cr per breach",
  },
  {
    code: "POPIA",
    name: "Protection of Personal Information Act",
    country: "South Africa",
    description:
      "South African privacy law governing lawful processing, conditions, and rights relating to personal information.",
    scope: "Responsible parties and operators in South Africa.",
    enforcementAuthority: "Information Regulator (South Africa)",
    maxPenalty: "Up to ZAR 10M or imprisonment for serious violations",
  },
  {
    code: "MEXICO-DPA",
    name: "Mexico Federal Data Protection Law",
    country: "Mexico",
    description:
      "Mexican federal privacy law (LFPDPPP) governing processing of personal data by private parties.",
    scope: "Private-sector entities in Mexico.",
    enforcementAuthority: "INAI",
    maxPenalty: "Up to MXN 16M per violation",
  },
  {
    code: "TH-PDPA",
    name: "Thailand Personal Data Protection Act",
    country: "Thailand",
    description:
      "Thai data protection law covering lawful basis, rights, cross-border transfers, and breach notification.",
    scope: "Organizations handling personal data in Thailand.",
    enforcementAuthority: "PDPC Thailand",
    maxPenalty: "Up to THB 5M plus administrative fines",
  },
  {
    code: "ID-PDP",
    name: "Indonesia Personal Data Protection Law",
    country: "Indonesia",
    description:
      "Indonesian personal data protection framework (UU PDP) governing processing, rights, and transfers.",
    scope: "Controllers and processors in Indonesia.",
    enforcementAuthority: "Ministry of Communication and Digital Affairs",
    maxPenalty: "Up to 2% of annual revenue or IDR 50B",
  },
  {
    code: "MY-PDPA",
    name: "Malaysia Personal Data Protection Act",
    country: "Malaysia",
    description:
      "Malaysian personal data protection principles covering consent, purpose, security, and retention.",
    scope: "Commercial organizations processing personal data in Malaysia.",
    enforcementAuthority: "Department of Personal Data Protection (JPDP)",
    maxPenalty: "Up to MYR 1M or imprisonment",
  },
  {
    code: "PH-DPA",
    name: "Philippines Data Privacy Act",
    country: "Philippines",
    description:
      "Philippine privacy law (RA 10173) governing processing of personal information and breach notification.",
    scope:
      "Personal information controllers and processors in the Philippines.",
    enforcementAuthority: "National Privacy Commission (NPC)",
    maxPenalty: "Up to PHP 5M or imprisonment",
  },
  {
    code: "VN-PDPD",
    name: "Vietnam Personal Data Protection Decree",
    country: "Vietnam",
    description:
      "Vietnamese decree governing personal data processing, rights, and cross-border data transfers.",
    scope: "Organizations processing personal data in Vietnam.",
    enforcementAuthority: "MPS / MIC",
    maxPenalty: "Up to 5% of revenue for violations",
  },
  {
    code: "NDPA-NG",
    name: "Nigeria Data Protection Act",
    country: "Nigeria",
    description:
      "Nigerian data protection law establishing obligations for data controllers and processors.",
    scope: "Data controllers and processors in Nigeria.",
    enforcementAuthority: "NDPC (Nigeria Data Protection Commission)",
    maxPenalty: "Up to 2% of annual gross revenue or NGN 10M",
  },
  {
    code: "KENYA-DPA",
    name: "Kenya Data Protection Act",
    country: "Kenya",
    description:
      "Kenyan data protection law governing processing, rights, and transfer of personal data.",
    scope: "Data controllers and processors in Kenya.",
    enforcementAuthority: "ODPC (Office of the Data Protection Commissioner)",
    maxPenalty: "Up to KES 5M or 1% of turnover",
  },
];

export const complianceControls = [
  // China - CSL
  {
    frameworkCode: "CSL",
    controlCode: "CSL-1",
    controlName: "MLPS Baseline Security",
    category: "Network Security",
    description:
      "Implement multi-level cybersecurity protection baseline controls for network infrastructure.",
    requirement:
      "Adopt MLPS baseline controls with monitoring, logging, and hardening safeguards.",
    applicability: "Network operators and CIIOs in applicable jurisdiction.",
  },
  {
    frameworkCode: "CSL",
    controlCode: "CSL-2",
    controlName: "Incident Reporting Timeline",
    category: "Incident Response",
    description:
      "Major incidents require initial and detailed reporting to authorities in strict timelines.",
    requirement:
      "Submit initial report within 2 hours and detailed report within 24 hours.",
    applicability: "Network operators and CIIOs in applicable jurisdiction.",
  },
  {
    frameworkCode: "CSL",
    controlCode: "CSL-3",
    controlName: "Critical Data Localization",
    category: "Data Transfer",
    description:
      "CIIOs must retain critical and personal data in jurisdiction unless approved transfer applies.",
    requirement:
      "Store regulated data locally and complete security assessment before export.",
    applicability: "Critical information infrastructure operators.",
  },
  {
    frameworkCode: "CSL",
    controlCode: "CSL-4",
    controlName: "Network Log Retention",
    category: "Monitoring",
    description:
      "Maintain network operation logs and evidence for supervision and investigation.",
    requirement: "Retain relevant network logs for at least six months.",
    applicability: "Network operators in applicable jurisdiction.",
  },

  // China - DSL
  {
    frameworkCode: "DSL",
    controlCode: "DSL-1",
    controlName: "Data Classification and Tiering",
    category: "Data Governance",
    description:
      "Classify data into general, important, and core categories with risk-based protections.",
    requirement:
      "Define data categories and apply controls proportional to classification level.",
    applicability: "All data processors in applicable jurisdiction.",
  },
  {
    frameworkCode: "DSL",
    controlCode: "DSL-2",
    controlName: "Important Data Annual Report",
    category: "Regulatory Reporting",
    description:
      "Handlers of important data must submit annual security reports.",
    requirement: "Provide annual assessment report to competent regulator.",
    applicability: "Important data handlers in applicable jurisdiction.",
  },
  {
    frameworkCode: "DSL",
    controlCode: "DSL-3",
    controlName: "Data Security Risk Assessment",
    category: "Risk Management",
    description:
      "Conduct ongoing data security risk assessments and rectify identified gaps.",
    requirement: "Document assessment outcomes and implement mitigation plans.",
    applicability: "All data processors in applicable jurisdiction.",
  },

  // China - PIPL
  {
    frameworkCode: "PIPL",
    controlCode: "PIPL-1",
    controlName: "Lawful Basis and Explicit Consent",
    category: "Privacy Governance",
    description:
      "Establish lawful basis and explicit consent mechanisms for PI processing.",
    requirement: "Obtain informed consent unless another legal basis applies.",
    applicability: "All PI processors in applicable jurisdiction.",
  },
  {
    frameworkCode: "PIPL",
    controlCode: "PIPL-2",
    controlName: "Data Subject Rights Handling",
    category: "Data Subject Rights",
    description:
      "Enable access, correction, deletion, portability, and objection workflows.",
    requirement:
      "Provide operational channels and response timelines for rights requests.",
    applicability: "All PI processors in applicable jurisdiction.",
  },
  {
    frameworkCode: "PIPL",
    controlCode: "PIPL-3",
    controlName: "PIIA Before High-risk Processing",
    category: "Risk Management",
    description:
      "Perform Personal Information Impact Assessments for high-risk processing.",
    requirement:
      "Complete and retain PIIA records prior to high-risk activities.",
    applicability:
      "Organizations processing sensitive PI or conducting high-risk operations.",
  },
  {
    frameworkCode: "PIPL",
    controlCode: "PIPL-4",
    controlName: "Minors Data Safeguards",
    category: "Special Categories",
    description:
      "Apply dedicated safeguards for children under 14, including separate guardian consent.",
    requirement:
      "Collect guardian consent and maintain annual compliance reporting where applicable.",
    applicability:
      "Organizations processing minors personal information in applicable jurisdiction.",
  },

  // China - MLPS 2.0
  {
    frameworkCode: "MLPS2",
    controlCode: "MLPS2-1",
    controlName: "System Protection Level Determination",
    category: "Governance",
    description:
      "Classify systems from Level 1 to Level 5 based on national security impact.",
    requirement: "Document and register MLPS level for covered systems.",
    applicability:
      "All covered information systems in applicable jurisdiction.",
  },
  {
    frameworkCode: "MLPS2",
    controlCode: "MLPS2-2",
    controlName: "Technical Security Control Stack",
    category: "Technical Controls",
    description:
      "Implement physical, network, host, application, and data controls per MLPS requirements.",
    requirement:
      "Deploy mandatory controls appropriate to assigned MLPS level.",
    applicability: "All covered systems; stricter duties for higher levels.",
  },
  {
    frameworkCode: "MLPS2",
    controlCode: "MLPS2-3",
    controlName: "Administrative Security Controls",
    category: "Administrative Controls",
    description:
      "Establish institutional, organizational, personnel, construction, and operations controls.",
    requirement:
      "Maintain formal governance, personnel controls, and operational procedures.",
    applicability: "All covered systems in applicable jurisdiction.",
  },
  {
    frameworkCode: "MLPS2",
    controlCode: "MLPS2-4",
    controlName: "Level 3 Annual Assessment",
    category: "Audit",
    description:
      "Level 3 systems require annual assessment by licensed evaluators.",
    requirement:
      "Complete annual third-party MLPS evaluation and regulator submission.",
    applicability: "MLPS Level 3 systems.",
  },

  // China - NDSM
  {
    frameworkCode: "NDSM",
    controlCode: "NDSM-1",
    controlName: "Network Data Governance Program",
    category: "Data Governance",
    description: "Formalize network data governance model and accountability.",
    requirement: "Define ownership, lifecycle controls, and risk thresholds.",
    applicability: "Network data processors in applicable jurisdiction.",
  },
  {
    frameworkCode: "NDSM",
    controlCode: "NDSM-2",
    controlName: "Important Data Security Reporting",
    category: "Regulatory Reporting",
    description:
      "Submit security reports for designated important data activities.",
    requirement:
      "Provide periodic compliance and risk reports to competent authorities.",
    applicability: "Important data handlers in applicable jurisdiction.",
  },

  // China - CIIP
  {
    frameworkCode: "CIIP",
    controlCode: "CIIP-1",
    controlName: "Critical Infrastructure Security Program",
    category: "Critical Infrastructure",
    description:
      "Implement specialized cybersecurity governance for CIIO operations.",
    requirement:
      "Establish dedicated CII security management and defense controls.",
    applicability: "Identified CIIO entities.",
  },
  {
    frameworkCode: "CIIP",
    controlCode: "CIIP-2",
    controlName: "Security Review for Procurement",
    category: "Third-party Risk",
    description:
      "Conduct security review before adopting network products and services.",
    requirement:
      "Assess supply-chain and product risk before critical deployments.",
    applicability: "CIIO operators.",
  },

  // China - VULN
  {
    frameworkCode: "VULN",
    controlCode: "VULN-1",
    controlName: "Vulnerability Reporting Window",
    category: "Vulnerability Management",
    description:
      "Disclosed vulnerabilities must be reported to authorities quickly.",
    requirement:
      "Report vulnerabilities to MIIT/CAC/MPS portal within 48 hours.",
    applicability:
      "Entities discovering cybersecurity vulnerabilities in applicable jurisdiction.",
  },
  {
    frameworkCode: "VULN",
    controlCode: "VULN-2",
    controlName: "Coordinated Disclosure and Patching",
    category: "Vulnerability Management",
    description:
      "Coordinate remediation and avoid harmful premature disclosure.",
    requirement:
      "Provide remediation guidance and avoid exploit amplification.",
    applicability: "Vulnerability handlers and product providers.",
  },

  // China - Cross-border Transfer
  {
    frameworkCode: "CBDT",
    controlCode: "CBDT-1",
    controlName: "Transfer Pathway Determination",
    category: "Cross-border Transfer",
    description:
      "Select valid transfer pathway based on data category, volume, and processor profile.",
    requirement:
      "Use CAC assessment, standard contract, or certification as required.",
    applicability: "Entities transferring data cross-border.",
  },
  {
    frameworkCode: "CBDT",
    controlCode: "CBDT-2",
    controlName: "Transfer Security Assessment",
    category: "Cross-border Transfer",
    description:
      "Run security impact assessments before cross-border transfer activities.",
    requirement:
      "Assess data sensitivity, recipient controls, and residual legal risk.",
    applicability: "Entities exporting personal or important data.",
  },

  // Saudi Arabia - NCA umbrella
  {
    frameworkCode: "NCA",
    controlCode: "NCA-1",
    controlName: "National Cybersecurity Governance",
    category: "Governance",
    description:
      "Align organization-wide cybersecurity strategy with NCA obligations.",
    requirement:
      "Define governance model, accountability, and policy baseline.",
    applicability: "Regulated entities under NCA scope.",
  },
  {
    frameworkCode: "NCA",
    controlCode: "NCA-2",
    controlName: "Haseen and Compliance Reporting",
    category: "Regulatory Reporting",
    description:
      "Maintain evidence and periodic reporting of compliance maturity.",
    requirement:
      "Submit periodic compliance status via designated NCA channels.",
    applicability: "Regulated entities under NCA scope.",
  },
  {
    frameworkCode: "NCA",
    controlCode: "NCA-3",
    controlName: "Significant Incident Reporting",
    category: "Incident Response",
    description: "Report significant cybersecurity incidents without delay.",
    requirement:
      "Trigger immediate escalation and regulator notification workflows.",
    applicability: "Regulated entities under NCA scope.",
  },

  // Saudi Arabia - NCA legal powers
  {
    frameworkCode: "NCA-M117",
    controlCode: "NCA-M117-1",
    controlName: "Violation Classification and Penalties",
    category: "Enforcement",
    description:
      "Map violations and maintain evidence required for enforcement review.",
    requirement:
      "Maintain auditable records of control implementation and incidents.",
    applicability: "Entities subject to NCA legal powers.",
  },
  {
    frameworkCode: "NCA-M117",
    controlCode: "NCA-M117-2",
    controlName: "Executive Accountability",
    category: "Governance",
    description:
      "Define personal accountability and escalation responsibilities.",
    requirement: "Document role-based obligations and response ownership.",
    applicability: "Executive and risk owners in regulated entities.",
  },

  // Saudi Arabia - ECC
  {
    frameworkCode: "ECC",
    controlCode: "ECC-1",
    controlName: "Governance Domain Controls",
    category: "Governance",
    description:
      "Implement cybersecurity strategy, management, policy, and risk controls.",
    requirement:
      "Operate governance controls across strategy, HR, and risk functions.",
    applicability: "Entities required to implement ECC.",
  },
  {
    frameworkCode: "ECC",
    controlCode: "ECC-2",
    controlName: "Defense Domain Controls",
    category: "Defense",
    description:
      "Implement asset management, IAM, and network protection controls.",
    requirement: "Maintain technical controls for prevention and detection.",
    applicability: "Entities required to implement ECC.",
  },
  {
    frameworkCode: "ECC",
    controlCode: "ECC-3",
    controlName: "Resilience Domain Controls",
    category: "Resilience",
    description:
      "Implement continuity and disaster recovery readiness controls.",
    requirement: "Test and maintain BCP and DR capabilities.",
    applicability: "Entities required to implement ECC.",
  },
  {
    frameworkCode: "ECC",
    controlCode: "ECC-4",
    controlName: "Third-party and Cloud Domain Controls",
    category: "Third-party",
    description:
      "Manage supplier and cloud cybersecurity risk across lifecycle.",
    requirement: "Assess, contract, and monitor third-party risk controls.",
    applicability: "Entities required to implement ECC.",
  },
  {
    frameworkCode: "ECC",
    controlCode: "ECC-5",
    controlName: "ICS/OT Domain Controls",
    category: "ICS/OT",
    description:
      "Apply specialized controls for industrial and operational technology environments.",
    requirement: "Implement segmentation and OT-specific protection practices.",
    applicability: "Entities with ICS/OT environments under ECC scope.",
  },

  // Saudi Arabia - CCC
  {
    frameworkCode: "CCC",
    controlCode: "CCC-1",
    controlName: "Cloud Shared Responsibility Model",
    category: "Cloud Security",
    description:
      "Define CSP and tenant responsibilities for cloud security operations.",
    requirement: "Map control ownership and enforce shared accountability.",
    applicability: "CSPs and cloud service tenants in applicable jurisdiction.",
  },
  {
    frameworkCode: "CCC",
    controlCode: "CCC-2",
    controlName: "Cloud Data Sovereignty",
    category: "Cloud Security",
    description:
      "Protect regulated data location and handling in line with regulatory requirements.",
    requirement:
      "Apply cloud architecture and controls that enforce data sovereignty obligations.",
    applicability: "Cloud workloads processing regulated data.",
  },

  // Saudi Arabia - CSCC
  {
    frameworkCode: "CSCC",
    controlCode: "CSCC-1",
    controlName: "Critical System Classification",
    category: "Critical Systems",
    description:
      "Identify and classify critical systems requiring enhanced controls.",
    requirement:
      "Apply stricter protection profile to designated critical systems.",
    applicability: "Critical system operators.",
  },
  {
    frameworkCode: "CSCC",
    controlCode: "CSCC-2",
    controlName: "Critical Monitoring and Assurance",
    category: "Critical Systems",
    description:
      "Operate continuous monitoring and assurance for critical systems.",
    requirement:
      "Deploy SOC visibility, hardening checks, and remediation tracking.",
    applicability: "Critical system operators.",
  },

  // Saudi Arabia - OTCC
  {
    frameworkCode: "OTCC",
    controlCode: "OTCC-1",
    controlName: "OT Asset Inventory and Zoning",
    category: "OT Security",
    description:
      "Maintain OT inventory and enforce zone/conduit segmentation patterns.",
    requirement: "Document OT assets and isolate high-risk process networks.",
    applicability: "ICS/OT operators.",
  },
  {
    frameworkCode: "OTCC",
    controlCode: "OTCC-2",
    controlName: "Secure OT Remote Access",
    category: "OT Security",
    description:
      "Control and monitor remote access into operational technology environments.",
    requirement:
      "Use approved jump hosts, MFA, and monitored privileged sessions.",
    applicability: "ICS/OT operators.",
  },

  // Saudi Arabia - DCC
  {
    frameworkCode: "DCC",
    controlCode: "DCC-1",
    controlName: "Data Classification and Handling",
    category: "Data Security",
    description:
      "Classify data and apply handling requirements by sensitivity and business impact.",
    requirement: "Define protection controls for each classification tier.",
    applicability: "Organizations handling sensitive or regulated data.",
  },
  {
    frameworkCode: "DCC",
    controlCode: "DCC-2",
    controlName: "Data Encryption and Key Management",
    category: "Data Security",
    description:
      "Protect data at rest and in transit with managed cryptographic controls.",
    requirement: "Implement approved encryption and key lifecycle management.",
    applicability: "Organizations handling regulated data.",
  },

  // Saudi Arabia - TCC
  {
    frameworkCode: "TCC",
    controlCode: "TCC-1",
    controlName: "Telework Access Controls",
    category: "Remote Security",
    description:
      "Secure remote connectivity with identity validation and least privilege.",
    requirement: "Apply MFA, conditional access, and hardened remote channels.",
    applicability: "Organizations enabling telework.",
  },
  {
    frameworkCode: "TCC",
    controlCode: "TCC-2",
    controlName: "Telework Endpoint Protection",
    category: "Remote Security",
    description:
      "Harden and monitor endpoints used for remote work activities.",
    requirement:
      "Enforce endpoint security baseline and continuous monitoring.",
    applicability: "Telework endpoints and managed remote devices.",
  },

  // Saudi Arabia - PDPL
  {
    frameworkCode: "PDPL",
    controlCode: "PDPL-1",
    controlName: "Lawful Processing and Consent",
    category: "Privacy Governance",
    description:
      "Ensure legal basis and explicit consent for personal data processing.",
    requirement: "Collect and document consent where required by PDPL.",
    applicability:
      "All personal data controllers/processors in applicable jurisdiction.",
  },
  {
    frameworkCode: "PDPL",
    controlCode: "PDPL-2",
    controlName: "Data Subject Rights Management",
    category: "Data Subject Rights",
    description:
      "Enable rights access, correction, and deletion request handling.",
    requirement: "Provide rights workflow and response tracking.",
    applicability:
      "All personal data controllers/processors in applicable jurisdiction.",
  },
  {
    frameworkCode: "PDPL",
    controlCode: "PDPL-3",
    controlName: "Breach Notification to SDAIA",
    category: "Incident Response",
    description:
      "Notify SDAIA and affected data subjects for qualifying breaches.",
    requirement:
      "Report personal data breach to SDAIA within 72 hours where required.",
    applicability: "All personal data controllers in applicable jurisdiction.",
  },
  {
    frameworkCode: "PDPL",
    controlCode: "PDPL-4",
    controlName: "Cross-border Transfer Controls",
    category: "Cross-border Transfer",
    description:
      "Apply transfer restrictions and approval pathways for cross-border data movement.",
    requirement:
      "Complete adequacy, contractual, or regulator-approved transfer mechanisms.",
    applicability: "Entities transferring personal data cross-border.",
  },

  // ISO 27001
  {
    frameworkCode: "ISO-27001",
    controlCode: "ISO-27001-1",
    controlName: "ISMS Governance and Scope",
    category: "Governance",
    description:
      "Establish an information security management system with defined scope, policy, and leadership commitment.",
    requirement:
      "Define ISMS scope, security policy, roles, and continuous improvement processes.",
    applicability:
      "Organizations seeking or maintaining ISO 27001 certification.",
  },
  {
    frameworkCode: "ISO-27001",
    controlCode: "ISO-27001-2",
    controlName: "Risk Assessment and Treatment",
    category: "Risk Management",
    description:
      "Conduct systematic information security risk assessments and select treatment options.",
    requirement:
      "Document risk assessment methodology, results, and risk treatment plans (SoA).",
    applicability: "All ISMS scoped organizations.",
  },
  {
    frameworkCode: "ISO-27001",
    controlCode: "ISO-27001-3",
    controlName: "Annex A Control Implementation",
    category: "Technical Controls",
    description:
      "Implement applicable Annex A controls across organizational, human, physical, and technical domains.",
    requirement:
      "Maintain a Statement of Applicability mapping Annex A controls to implementation evidence.",
    applicability: "All ISMS scoped organizations.",
  },
  {
    frameworkCode: "ISO-27001",
    controlCode: "ISO-27001-4",
    controlName: "Internal Audit and Management Review",
    category: "Audit",
    description:
      "Perform planned internal audits and management reviews of the ISMS.",
    requirement:
      "Conduct audits at planned intervals and review ISMS performance with management.",
    applicability: "All ISMS scoped organizations.",
  },

  // SOC 2
  {
    frameworkCode: "SOC2",
    controlCode: "SOC2-1",
    controlName: "Trust Services Criteria Coverage",
    category: "Assurance",
    description:
      "Design controls covering security, availability, processing integrity, confidentiality, and privacy criteria.",
    requirement:
      "Map implemented controls to applicable Trust Services Criteria (TSC).",
    applicability: "Service organizations undergoing SOC 2 attestation.",
  },
  {
    frameworkCode: "SOC2",
    controlCode: "SOC2-2",
    controlName: "Control Environment and Monitoring",
    category: "Governance",
    description:
      "Maintain an effective control environment with risk assessment, information, communication, and monitoring activities.",
    requirement:
      "Document control environment, communication processes, and ongoing monitoring evidence.",
    applicability: "Service organizations undergoing SOC 2 attestation.",
  },
  {
    frameworkCode: "SOC2",
    controlCode: "SOC2-3",
    controlName: "Evidence Collection for Attestation",
    category: "Audit",
    description:
      "Collect and retain evidence supporting controls for the audit period.",
    requirement:
      "Retain audit-ready evidence for the full examination period and support exception responses.",
    applicability: "Service organizations undergoing SOC 2 attestation.",
  },

  // NIST CSF 2.0
  {
    frameworkCode: "NIST-CSF-2",
    controlCode: "NIST-CSF-2-1",
    controlName: "Govern Function Controls",
    category: "Governance",
    description:
      "Establish organizational cybersecurity governance, risk management strategy, and supply-chain risk management.",
    requirement:
      "Define governance structures, roles, and risk appetite aligned to the CSF Govern function.",
    applicability: "Organizations adopting NIST CSF 2.0.",
  },
  {
    frameworkCode: "NIST-CSF-2",
    controlCode: "NIST-CSF-2-2",
    controlName: "Identify and Protect Functions",
    category: "Security Controls",
    description:
      "Develop organizational understanding of assets, vulnerabilities, and risk while deploying protective safeguards.",
    requirement:
      "Maintain asset inventory, risk register, identity management, and protective technology controls.",
    applicability: "Organizations adopting NIST CSF 2.0.",
  },
  {
    frameworkCode: "NIST-CSF-2",
    controlCode: "NIST-CSF-2-3",
    controlName: "Detect, Respond, and Recover",
    category: "Incident Response",
    description:
      "Operate detection capabilities, incident response plans, and recovery processes.",
    requirement:
      "Deploy continuous monitoring, tested incident playbooks, and documented recovery procedures.",
    applicability: "Organizations adopting NIST CSF 2.0.",
  },

  // HIPAA
  {
    frameworkCode: "HIPAA",
    controlCode: "HIPAA-1",
    controlName: "Privacy Rule Safeguards",
    category: "Privacy",
    description:
      "Implement privacy policies and safeguards protecting individually identifiable health information (PHI).",
    requirement:
      "Maintain notice, authorization, minimum necessary, and patient rights procedures.",
    applicability: "Covered entities and business associates.",
  },
  {
    frameworkCode: "HIPAA",
    controlCode: "HIPAA-2",
    controlName: "Security Rule Administrative and Technical Safeguards",
    category: "Security",
    description:
      "Implement administrative, physical, and technical safeguards for electronic PHI.",
    requirement:
      "Deploy access controls, audit controls, integrity controls, and workforce training.",
    applicability: "Covered entities and business associates.",
  },
  {
    frameworkCode: "HIPAA",
    controlCode: "HIPAA-3",
    controlName: "Breach Notification",
    category: "Incident Response",
    description:
      "Notify HHS OCR and affected individuals of breaches of unsecured PHI.",
    requirement:
      "Report breaches without unreasonable delay, within 60 days for large breaches.",
    applicability: "Covered entities and business associates.",
  },

  // PCI DSS
  {
    frameworkCode: "PCI-DSS",
    controlCode: "PCI-DSS-1",
    controlName: "Secure Network and Systems",
    category: "Network Security",
    description:
      "Install and maintain network security controls and secure configuration of systems.",
    requirement:
      "Configure firewalls, hardening baselines, and change management for system components.",
    applicability:
      "Organizations storing, processing, or transmitting cardholder data.",
  },
  {
    frameworkCode: "PCI-DSS",
    controlCode: "PCI-DSS-2",
    controlName: "Cardholder Data Protection",
    category: "Data Security",
    description:
      "Protect stored cardholder data and encrypt cardholder data over open networks.",
    requirement:
      "Minimize stored data, protect with strong cryptography, and mask PAN where displayed.",
    applicability: "Card data environment components.",
  },
  {
    frameworkCode: "PCI-DSS",
    controlCode: "PCI-DSS-3",
    controlName: "Access Control and Monitoring",
    category: "Access Control",
    description:
      "Restrict access to cardholder data and track and monitor all access to system components.",
    requirement:
      "Apply least privilege, unique IDs, MFA, and log monitoring for card data environments.",
    applicability: "Organizations in the card payment ecosystem.",
  },

  // NIS2
  {
    frameworkCode: "NIS2",
    controlCode: "NIS2-1",
    controlName: "Cybersecurity Risk Management Measures",
    category: "Governance",
    description:
      "Adopt technical, operational, and organizational measures for managing cybersecurity risk.",
    requirement:
      "Implement measures covering risk analysis, incident handling, business continuity, and supply-chain security.",
    applicability: "Essential and important entities under NIS2.",
  },
  {
    frameworkCode: "NIS2",
    controlCode: "NIS2-2",
    controlName: "Incident Reporting Obligations",
    category: "Incident Response",
    description:
      "Report significant incidents to national CSIRT/competent authority.",
    requirement:
      "Submit early warning within 24 hours, notification within 72 hours, and final report within 1 month.",
    applicability: "Essential and important entities under NIS2.",
  },
  {
    frameworkCode: "NIS2",
    controlCode: "NIS2-3",
    controlName: "Management Accountability",
    category: "Governance",
    description:
      "Hold management accountable for cybersecurity risk management and compliance.",
    requirement:
      "Board approval of risk measures and training obligations for management.",
    applicability: "Essential and important entities under NIS2.",
  },

  // DORA
  {
    frameworkCode: "DORA",
    controlCode: "DORA-1",
    controlName: "ICT Risk Management Framework",
    category: "Risk Management",
    description:
      "Establish a sound, comprehensive, and well-documented ICT risk management framework.",
    requirement:
      "Define ICT risk governance, protection, detection, response, and recovery processes.",
    applicability: "EU financial entities.",
  },
  {
    frameworkCode: "DORA",
    controlCode: "DORA-2",
    controlName: "ICT Third-Party Risk Management",
    category: "Third-party",
    description:
      "Manage ICT third-party risk including the register of information, risk assessments, and contractual protections.",
    requirement:
      "Maintain an ICT third-party register and enforce contract clauses on subcontracting and exit.",
    applicability: "EU financial entities and critical ICT providers.",
  },
  {
    frameworkCode: "DORA",
    controlCode: "DORA-3",
    controlName: "Digital Operational Resilience Testing",
    category: "Resilience",
    description:
      "Perform regular testing of ICT systems and resilience capabilities.",
    requirement:
      "Conduct vulnerability, penetration, and scenario-based testing at defined frequencies.",
    applicability: "EU financial entities.",
  },

  // EU AI Act
  {
    frameworkCode: "EU-AI-ACT",
    controlCode: "EU-AI-ACT-1",
    controlName: "AI System Risk Classification",
    category: "AI Governance",
    description:
      "Determine the risk class (prohibited, high-risk, limited, minimal) of AI systems.",
    requirement:
      "Document classification rationale and applicable obligations per risk class.",
    applicability: "AI providers and deployers in the EU.",
  },
  {
    frameworkCode: "EU-AI-ACT",
    controlCode: "EU-AI-ACT-2",
    controlName: "High-Risk AI Conformity Assessment",
    category: "AI Governance",
    description:
      "Perform conformity assessment, technical documentation, and registration for high-risk AI systems.",
    requirement:
      "Maintain EU declaration of conformity, logging, and post-market monitoring.",
    applicability: "High-risk AI system providers.",
  },
  {
    frameworkCode: "EU-AI-ACT",
    controlCode: "EU-AI-ACT-3",
    controlName: "Transparency and Human Oversight",
    category: "AI Governance",
    description:
      "Ensure transparency obligations and human oversight for AI systems.",
    requirement:
      "Disclose AI-generated content and design human oversight mechanisms.",
    applicability: "AI providers and deployers in the EU.",
  },

  // UK GDPR
  {
    frameworkCode: "UK-GDPR",
    controlCode: "UK-GDPR-1",
    controlName: "UK Lawful Basis and Rights",
    category: "Privacy Governance",
    description:
      "Establish lawful basis for processing and uphold data subject rights under UK GDPR.",
    requirement:
      "Maintain records of processing, consent mechanisms, and rights request workflows.",
    applicability: "UK data controllers and processors.",
  },
  {
    frameworkCode: "UK-GDPR",
    controlCode: "UK-GDPR-2",
    controlName: "UK Breach Notification to ICO",
    category: "Incident Response",
    description: "Notify the ICO of personal data breaches within 72 hours.",
    requirement:
      "Operate breach detection and notification procedures aligned to ICO requirements.",
    applicability: "UK data controllers.",
  },
  {
    frameworkCode: "UK-GDPR",
    controlCode: "UK-GDPR-3",
    controlName: "International Data Transfers",
    category: "Cross-border Transfer",
    description:
      "Manage international data transfers under UK adequacy, IDTA, or other safeguards.",
    requirement:
      "Use UK International Data Transfer Agreement or adequacy decisions for transfers.",
    applicability: "UK controllers transferring personal data overseas.",
  },

  // APPI (Japan)
  {
    frameworkCode: "APPI",
    controlCode: "APPI-1",
    controlName: "Utilization Purpose and Consent",
    category: "Privacy Governance",
    description:
      "Specify the purpose of use and obtain consent where required for personal information.",
    requirement:
      "Notify or publish utilization purposes and obtain consent for changes.",
    applicability: "Business operators handling personal information in Japan.",
  },
  {
    frameworkCode: "APPI",
    controlCode: "APPI-2",
    controlName: "Secure Management and Breach Handling",
    category: "Data Security",
    description:
      "Implement necessary and appropriate security measures and breach notification procedures.",
    requirement:
      "Report qualifying breaches to the PPC and affected data subjects.",
    applicability: "Business operators handling personal information in Japan.",
  },
  {
    frameworkCode: "APPI",
    controlCode: "APPI-3",
    controlName: "Cross-border Provision Rules",
    category: "Cross-border Transfer",
    description:
      "Provide personal data to third parties in foreign countries in compliance with APPI rules.",
    requirement:
      "Disclose destination country and obtain consent or rely on adequate safeguards.",
    applicability: "Business operators transferring personal data abroad.",
  },

  // PIPA-KR (South Korea)
  {
    frameworkCode: "PIPA-KR",
    controlCode: "PIPA-KR-1",
    controlName: "Consent and Purpose Limitation",
    category: "Privacy Governance",
    description:
      "Obtain consent and limit processing to notified purposes for personal information.",
    requirement:
      "Operate granular consent collection and purpose-restricted processing.",
    applicability: "Personal information controllers in Korea.",
  },
  {
    frameworkCode: "PIPA-KR",
    controlCode: "PIPA-KR-2",
    controlName: "Data Subject Rights",
    category: "Data Subject Rights",
    description:
      "Support access, correction, deletion, and suspension rights of data subjects.",
    requirement:
      "Operate rights request workflows with defined response timelines.",
    applicability: "Personal information controllers in Korea.",
  },
  {
    frameworkCode: "PIPA-KR",
    controlCode: "PIPA-KR-3",
    controlName: "Cross-border Transfer and Pseudonymization",
    category: "Cross-border Transfer",
    description:
      "Apply cross-border transfer requirements and pseudonymization duties.",
    requirement:
      "Notify transfer details, obtain consent, and apply pseudonymization where required.",
    applicability: "Controllers transferring data overseas.",
  },

  // PDPA-SG (Singapore)
  {
    frameworkCode: "PDPA-SG",
    controlCode: "PDPA-SG-1",
    controlName: "Consent and Purpose Limitation",
    category: "Privacy Governance",
    description:
      "Obtain consent for collection, use, and disclosure of personal data.",
    requirement:
      "Operate consent mechanisms, purpose notification, and withdrawal processes.",
    applicability: "Organizations processing personal data in Singapore.",
  },
  {
    frameworkCode: "PDPA-SG",
    controlCode: "PDPA-SG-2",
    controlName: "Breach Notification",
    category: "Incident Response",
    description:
      "Notify the PDPC of notifiable data breaches and affected individuals.",
    requirement:
      "Assess and notify qualifying breaches within prescribed timelines.",
    applicability: "Organizations in Singapore.",
  },
  {
    frameworkCode: "PDPA-SG",
    controlCode: "PDPA-SG-3",
    controlName: "Transfer Limitation",
    category: "Cross-border Transfer",
    description:
      "Ensure comparable protection for transfers of personal data overseas.",
    requirement:
      "Apply transfer impact assessment and contractual safeguards for cross-border transfers.",
    applicability: "Organizations transferring data outside Singapore.",
  },

  // DPDP-IN (India)
  {
    frameworkCode: "DPDP-IN",
    controlCode: "DPDP-IN-1",
    controlName: "Notice and Consent",
    category: "Privacy Governance",
    description:
      "Provide notice of personal data processing and obtain verifiable consent.",
    requirement:
      "Deliver notice in specified languages and maintain consent records.",
    applicability: "Data fiduciaries in India.",
  },
  {
    frameworkCode: "DPDP-IN",
    controlCode: "DPDP-IN-2",
    controlName: "Data Subject Rights and Grievances",
    category: "Data Subject Rights",
    description:
      "Support rights of access, correction, erasure, portability, and grievance redressal.",
    requirement:
      "Operate rights fulfillment and grievance redressal mechanisms with timelines.",
    applicability: "Data fiduciaries in India.",
  },
  {
    frameworkCode: "DPDP-IN",
    controlCode: "DPDP-IN-3",
    controlName: "Breach Notification",
    category: "Incident Response",
    description:
      "Notify the Data Protection Board and affected data principals of data breaches.",
    requirement: "Operate breach detection and notification procedures.",
    applicability: "Data fiduciaries in India.",
  },

  // POPIA (South Africa)
  {
    frameworkCode: "POPIA",
    controlCode: "POPIA-1",
    controlName: "Processing Conditions and Accountability",
    category: "Privacy Governance",
    description:
      "Comply with the eight POPIA processing conditions and accountability duties.",
    requirement:
      "Document lawful grounds, purpose specification, security safeguards, and information officer appointment.",
    applicability: "Responsible parties in South Africa.",
  },
  {
    frameworkCode: "POPIA",
    controlCode: "POPIA-2",
    controlName: "Cross-border Transfer Conditions",
    category: "Cross-border Transfer",
    description:
      "Transfer personal information cross-border only where recipient ensures adequate protection.",
    requirement:
      "Apply contracts, adequacy assessments, or consent before transfers.",
    applicability:
      "Responsible parties transferring data outside South Africa.",
  },
  {
    frameworkCode: "POPIA",
    controlCode: "POPIA-3",
    controlName: "Security Breach Notification",
    category: "Incident Response",
    description:
      "Notify the Information Regulator and data subjects of security compromises.",
    requirement:
      "Operate breach detection and notification procedures with documented timelines.",
    applicability: "Responsible parties in South Africa.",
  },

  // PIPEDA (Canada)
  {
    frameworkCode: "PIPEDA",
    controlCode: "PIPEDA-1",
    controlName: "Consent and Openness",
    category: "Privacy Governance",
    description:
      "Obtain meaningful consent and provide transparent privacy policies.",
    requirement:
      "Operate consent mechanisms and published privacy policies under PIPEDA.",
    applicability: "Private-sector organizations in Canada.",
  },
  {
    frameworkCode: "PIPEDA",
    controlCode: "PIPEDA-2",
    controlName: "Safeguards and Breach Reporting",
    category: "Data Security",
    description:
      "Protect personal information with safeguards and report material breaches.",
    requirement:
      "Operate security safeguards, breach records, and notification to OPC and affected individuals.",
    applicability: "Private-sector organizations in Canada.",
  },

  // Privacy Act AU
  {
    frameworkCode: "PRIVACY-ACT-AU",
    controlCode: "PRIVACY-ACT-AU-1",
    controlName: "Australian Privacy Principles Compliance",
    category: "Privacy Governance",
    description: "Comply with the 13 Australian Privacy Principles (APPs).",
    requirement:
      "Operate APP-compliant collection, use, disclosure, access, and correction practices.",
    applicability: "Australian organizations with APP obligations.",
  },
  {
    frameworkCode: "PRIVACY-ACT-AU",
    controlCode: "PRIVACY-ACT-AU-2",
    controlName: "Notifiable Data Breaches",
    category: "Incident Response",
    description:
      "Notify affected individuals and the OAIC of eligible data breaches.",
    requirement:
      "Operate breach assessment and notification procedures within statutory timelines.",
    applicability: "Entities with APP obligations.",
  },

  // MEXICO-DPA
  {
    frameworkCode: "MEXICO-DPA",
    controlCode: "MEXICO-DPA-1",
    controlName: "Privacy Notice and Consent",
    category: "Privacy Governance",
    description:
      "Provide privacy notices and obtain consent for personal data processing.",
    requirement:
      "Operate privacy notices with legal basis and consent management.",
    applicability: "Private-sector entities in Mexico.",
  },
  {
    frameworkCode: "MEXICO-DPA",
    controlCode: "MEXICO-DPA-2",
    controlName: "ARCO Rights",
    category: "Data Subject Rights",
    description:
      "Support access, rectification, cancellation, and opposition (ARCO) rights.",
    requirement:
      "Operate ARCO rights request workflows with statutory response timelines.",
    applicability: "Private-sector entities in Mexico.",
  },
  {
    frameworkCode: "MEXICO-DPA",
    controlCode: "MEXICO-DPA-3",
    controlName: "Breach Notification",
    category: "Incident Response",
    description: "Notify INAI of breaches involving personal data.",
    requirement: "Operate breach detection and INAI notification procedures.",
    applicability: "Private-sector entities in Mexico.",
  },
];

export const complianceRelationships = [
  {
    sourceFrameworkCode: "PIPL",
    targetFrameworkCode: "CSL",
    relationshipType: "overlap",
    description:
      "Both require cybersecurity safeguards and incident governance; PIPL extends privacy protections on top of CSL.",
    severity: "high",
    riskLevel: "high",
    mitigation:
      "Operate a unified control baseline with privacy-specific overlays for personal information.",
  },
  {
    sourceFrameworkCode: "PIPL",
    targetFrameworkCode: "DSL",
    relationshipType: "overlap",
    description:
      "Both require data governance and risk controls, with DSL emphasizing data tiering and PIPL emphasizing PI rights.",
    severity: "high",
    riskLevel: "high",
    mitigation:
      "Create a harmonized data inventory linking PI classifications to DSL tiers.",
  },
  {
    sourceFrameworkCode: "PIPL",
    targetFrameworkCode: "MLPS2",
    relationshipType: "coordination",
    description:
      "PIPL organizational controls can be coordinated with MLPS technical and administrative requirements.",
    severity: "medium",
    riskLevel: "medium",
    mitigation:
      "Map PIPL obligations into MLPS technical and organizational control owners.",
  },
  {
    sourceFrameworkCode: "PIPL",
    targetFrameworkCode: "CBDT",
    relationshipType: "dependency",
    description:
      "Cross-border personal information transfers under PIPL rely on CBDT transfer pathway requirements.",
    severity: "high",
    riskLevel: "high",
    mitigation:
      "Automate transfer eligibility checks and trigger the required pathway before export.",
  },
  {
    sourceFrameworkCode: "PIPL",
    targetFrameworkCode: "PDPL",
    relationshipType: "overlap",
    description:
      "Both require lawful basis, transparency, rights handling, and breach governance for personal data.",
    severity: "critical",
    riskLevel: "critical",
    mitigation:
      "Use jurisdiction-aware privacy workflows with country-specific legal notices and response SLAs.",
  },
  {
    sourceFrameworkCode: "PIPL",
    targetFrameworkCode: "NCA",
    relationshipType: "conflict",
    description:
      "PIPL export pathways and sovereignty obligations can conflict for shared cross-border processing architectures.",
    severity: "critical",
    riskLevel: "critical",
    mitigation:
      "Segment data residency architecture by jurisdiction and isolate regulated workloads.",
  },
  {
    sourceFrameworkCode: "CSL",
    targetFrameworkCode: "DSL",
    relationshipType: "dependency",
    description:
      "CSL establishes network security baseline while DSL adds data-centric duties and classification controls.",
    severity: "high",
    riskLevel: "high",
    mitigation:
      "Sequence implementation: establish CSL baseline then layer DSL data governance controls.",
  },
  {
    sourceFrameworkCode: "CSL",
    targetFrameworkCode: "MLPS2",
    relationshipType: "overlap",
    description:
      "CSL obligations are operationalized in practice through MLPS technical and administrative controls.",
    severity: "high",
    riskLevel: "high",
    mitigation:
      "Maintain a bidirectional control map from CSL obligations to MLPS evidence artifacts.",
  },
  {
    sourceFrameworkCode: "CSL",
    targetFrameworkCode: "CIIP",
    relationshipType: "overlap",
    description:
      "CIIP duties are a specialized extension of CSL for critical infrastructure operators.",
    severity: "high",
    riskLevel: "high",
    mitigation:
      "Apply a CIIO-specific enhancement profile on top of CSL baseline controls.",
  },
  {
    sourceFrameworkCode: "CSL",
    targetFrameworkCode: "VULN",
    relationshipType: "coordination",
    description:
      "Vulnerability reporting rules and CSL incident obligations require synchronized escalation.",
    severity: "high",
    riskLevel: "high",
    mitigation:
      "Integrate vulnerability and incident response playbooks into a single regulatory escalation workflow.",
  },
  {
    sourceFrameworkCode: "DSL",
    targetFrameworkCode: "NDSM",
    relationshipType: "overlap",
    description:
      "NDSM operationalizes DSL obligations for network data governance, reporting, and controls.",
    severity: "high",
    riskLevel: "high",
    mitigation:
      "Use DSL categories as the master taxonomy for NDSM reporting and controls.",
  },
  {
    sourceFrameworkCode: "DSL",
    targetFrameworkCode: "CBDT",
    relationshipType: "dependency",
    description:
      "Important data classification under DSL influences cross-border transfer obligations under CBDT.",
    severity: "medium",
    riskLevel: "medium",
    mitigation:
      "Classify transfer datasets first, then route to the correct transfer assessment process.",
  },
  {
    sourceFrameworkCode: "DSL",
    targetFrameworkCode: "PDPL",
    relationshipType: "overlap",
    description:
      "Both require strong governance of sensitive data, though legal scope and terminology differ.",
    severity: "high",
    riskLevel: "high",
    mitigation:
      "Adopt a common data governance model with dual-jurisdiction policy mapping.",
  },
  {
    sourceFrameworkCode: "DSL",
    targetFrameworkCode: "NCA",
    relationshipType: "conflict",
    description:
      "Data localization and transfer restrictions can conflict between regulatory boundaries.",
    severity: "critical",
    riskLevel: "critical",
    mitigation:
      "Deploy physically and logically separate data processing environments per jurisdiction.",
  },
  {
    sourceFrameworkCode: "PDPL",
    targetFrameworkCode: "NCA",
    relationshipType: "overlap",
    description:
      "PDPL privacy obligations and NCA cybersecurity controls overlap heavily on data protection and incident handling.",
    severity: "high",
    riskLevel: "high",
    mitigation:
      "Run integrated privacy and cybersecurity governance with shared control owners.",
  },
  {
    sourceFrameworkCode: "PDPL",
    targetFrameworkCode: "ECC",
    relationshipType: "dependency",
    description:
      "PDPL compliance depends on technical and governance controls that are largely implemented through ECC domains.",
    severity: "high",
    riskLevel: "high",
    mitigation:
      "Map PDPL obligations directly to ECC controls and validate evidence coverage.",
  },
  {
    sourceFrameworkCode: "PDPL",
    targetFrameworkCode: "CCC",
    relationshipType: "coordination",
    description:
      "Cloud personal data obligations under PDPL require coordinated implementation with CCC cloud controls.",
    severity: "medium",
    riskLevel: "medium",
    mitigation:
      "Establish cloud control matrices that link PDPL obligations to CCC technical safeguards.",
  },
  {
    sourceFrameworkCode: "ECC",
    targetFrameworkCode: "MLPS2",
    relationshipType: "coordination",
    description:
      "ECC and MLPS2 share mature cybersecurity control themes but differ in taxonomy and assurance approach.",
    severity: "medium",
    riskLevel: "medium",
    mitigation:
      "Build a crosswalk between ECC domains and MLPS control families for multinational programs.",
  },
  {
    sourceFrameworkCode: "ECC",
    targetFrameworkCode: "CSL",
    relationshipType: "coordination",
    description:
      "ECC defense and resilience controls can be aligned with CSL baseline network security obligations.",
    severity: "medium",
    riskLevel: "medium",
    mitigation:
      "Create one technical baseline with jurisdiction-specific legal overlays.",
  },
  {
    sourceFrameworkCode: "CCC",
    targetFrameworkCode: "CIIP",
    relationshipType: "overlap",
    description:
      "Both frameworks impose enhanced cloud and infrastructure security obligations for critical services.",
    severity: "medium",
    riskLevel: "medium",
    mitigation:
      "Use shared cloud architecture guardrails and evidence collection for both frameworks.",
  },
  {
    sourceFrameworkCode: "CSCC",
    targetFrameworkCode: "CIIP",
    relationshipType: "coordination",
    description:
      "Critical system controls align with CIIP protection principles for critical infrastructure.",
    severity: "high",
    riskLevel: "high",
    mitigation:
      "Adopt critical-asset focused segmentation, monitoring, and assurance across both jurisdictions.",
  },
  {
    sourceFrameworkCode: "OTCC",
    targetFrameworkCode: "MLPS2",
    relationshipType: "gap",
    description:
      "OT safety-integrated controls in OTCC may not be explicitly addressed in general IT-focused MLPS implementations.",
    severity: "medium",
    riskLevel: "medium",
    mitigation:
      "Add OT-specific safeguards and safety requirements as an extension to MLPS implementation.",
  },
  {
    sourceFrameworkCode: "DCC",
    targetFrameworkCode: "DSL",
    relationshipType: "overlap",
    description:
      "Both require strong data classification and security controls, with different national policy framing.",
    severity: "high",
    riskLevel: "high",
    mitigation:
      "Consolidate data classification and handling standards with country-specific overlays.",
  },
  {
    sourceFrameworkCode: "TCC",
    targetFrameworkCode: "MLPS2",
    relationshipType: "coordination",
    description:
      "Remote access and endpoint controls in telework policy can align with MLPS operational controls.",
    severity: "low",
    riskLevel: "low",
    mitigation:
      "Use consistent remote-access hardening standards and localized policy language.",
  },
  {
    sourceFrameworkCode: "NCA-M117",
    targetFrameworkCode: "CSL",
    relationshipType: "gap",
    description:
      "Both create legal enforcement exposure but differ in penalty mechanics, reporting chains, and authority models.",
    severity: "high",
    riskLevel: "high",
    mitigation:
      "Maintain jurisdiction-specific legal escalation matrices and executive accountability playbooks.",
  },
  {
    sourceFrameworkCode: "VULN",
    targetFrameworkCode: "NCA",
    relationshipType: "coordination",
    description:
      "Vulnerability management and cybersecurity governance can be coordinated for unified triage operations.",
    severity: "medium",
    riskLevel: "medium",
    mitigation:
      "Unify vulnerability lifecycle tooling while preserving local reporting timelines and authority channels.",
  },
  {
    sourceFrameworkCode: "ISO-27001",
    targetFrameworkCode: "NIST-CSF-2",
    relationshipType: "overlap",
    description:
      "ISO 27001 ISMS controls and NIST CSF 2.0 functions share a common technical and organizational control baseline.",
    severity: "high",
    riskLevel: "high",
    mitigation:
      "Maintain one unified control catalog mapped to both ISO 27001 Annex A and NIST CSF functions.",
  },
  {
    sourceFrameworkCode: "ISO-27701",
    targetFrameworkCode: "ISO-27001",
    relationshipType: "dependency",
    description:
      "ISO 27701 privacy information management extends the ISO 27001 ISMS with PIMS requirements.",
    severity: "high",
    riskLevel: "high",
    mitigation:
      "Build the PIMS as an extension of an existing certified ISMS to minimize duplicate effort.",
  },
  {
    sourceFrameworkCode: "ISO-27701",
    targetFrameworkCode: "GDPR",
    relationshipType: "overlap",
    description:
      "ISO 27701 PIMS controls map closely to GDPR accountability and data subject rights obligations.",
    severity: "high",
    riskLevel: "high",
    mitigation:
      "Use ISO 27701 mappings as evidence of GDPR accountability for international operators.",
  },
  {
    sourceFrameworkCode: "ISO-27701",
    targetFrameworkCode: "PIPL",
    relationshipType: "overlap",
    description:
      "PIMS privacy controls overlap with PIPL requirements for transparency, rights, and security.",
    severity: "medium",
    riskLevel: "medium",
    mitigation:
      "Apply PIMS control evidence with PIPL-specific local overlays for notices and export approvals.",
  },
  {
    sourceFrameworkCode: "ISO-27701",
    targetFrameworkCode: "PDPL",
    relationshipType: "overlap",
    description:
      "PIMS privacy controls align with PDPL accountability and data subject rights duties.",
    severity: "medium",
    riskLevel: "medium",
    mitigation:
      "Reuse PIMS evidence with PDPL-specific local requirements for cross-border processing.",
  },
  {
    sourceFrameworkCode: "SOC2",
    targetFrameworkCode: "ISO-27001",
    relationshipType: "overlap",
    description:
      "SOC 2 Trust Services Criteria and ISO 27001 Annex A share substantial security control coverage.",
    severity: "high",
    riskLevel: "high",
    mitigation:
      "Maintain a shared control matrix to satisfy both SOC 2 examination and ISO certification audits.",
  },
  {
    sourceFrameworkCode: "SOC2",
    targetFrameworkCode: "NIST-CSF-2",
    relationshipType: "overlap",
    description:
      "SOC 2 controls can be mapped to NIST CSF 2.0 functions for consolidated security posture reporting.",
    severity: "medium",
    riskLevel: "medium",
    mitigation:
      "Align TSC control narratives with NIST CSF function and category identifiers.",
  },
  {
    sourceFrameworkCode: "HIPAA",
    targetFrameworkCode: "NIST-CSF-2",
    relationshipType: "coordination",
    description:
      "HIPAA safeguards are commonly operationalized through NIST CSF 2.0 technical controls.",
    severity: "medium",
    riskLevel: "medium",
    mitigation:
      "Use NIST CSF controls as the technical baseline for HIPAA administrative, physical, and technical safeguards.",
  },
  {
    sourceFrameworkCode: "PCI-DSS",
    targetFrameworkCode: "ISO-27001",
    relationshipType: "overlap",
    description:
      "PCI DSS requirements and ISO 27001 Annex A controls overlap for network and access security.",
    severity: "high",
    riskLevel: "high",
    mitigation:
      "Satisfy PCI DSS requirements using ISO 27001 control evidence where coverage is equivalent.",
  },
  {
    sourceFrameworkCode: "NIS2",
    targetFrameworkCode: "GDPR",
    relationshipType: "coordination",
    description:
      "NIS2 security measures and GDPR security-of-processing duties require coordinated incident governance.",
    severity: "high",
    riskLevel: "high",
    mitigation:
      "Run a unified incident response function feeding both NIS2 CSIRT and GDPR supervisory notifications.",
  },
  {
    sourceFrameworkCode: "DORA",
    targetFrameworkCode: "NIS2",
    relationshipType: "overlap",
    description:
      "DORA ICT risk requirements for financial entities overlap NIS2 security measures for essential entities.",
    severity: "medium",
    riskLevel: "medium",
    mitigation:
      "For financial entities, prefer DORA-specific controls and align NIS2 reporting where applicable.",
  },
  {
    sourceFrameworkCode: "EU-AI-ACT",
    targetFrameworkCode: "GDPR",
    relationshipType: "coordination",
    description:
      "AI Act obligations interplay with GDPR for AI systems processing personal data.",
    severity: "high",
    riskLevel: "high",
    mitigation:
      "Maintain a coordinated AI governance layer addressing both data protection and AI risk obligations.",
  },
  {
    sourceFrameworkCode: "UK-GDPR",
    targetFrameworkCode: "GDPR",
    relationshipType: "overlap",
    description:
      "UK GDPR mirrors EU GDPR with distinct enforcement, adequacy, and transfer mechanics.",
    severity: "high",
    riskLevel: "high",
    mitigation:
      "Run one privacy program with UK- and EU-specific transfer tooling and regulator reporting.",
  },
  {
    sourceFrameworkCode: "APPI",
    targetFrameworkCode: "GDPR",
    relationshipType: "coordination",
    description:
      "Japan APPI and GDPR share accountability and rights principles with different consent and transfer mechanics.",
    severity: "medium",
    riskLevel: "medium",
    mitigation:
      "Harmonize global privacy policies while keeping jurisdiction-specific consent and transfer flows.",
  },
  {
    sourceFrameworkCode: "PIPA-KR",
    targetFrameworkCode: "GDPR",
    relationshipType: "coordination",
    description:
      "Korea PIPA and GDPR both require strong consent and rights frameworks with distinct local enforcement.",
    severity: "medium",
    riskLevel: "medium",
    mitigation:
      "Use a global privacy baseline with Korean-specific consent granularity and notification duties.",
  },
  {
    sourceFrameworkCode: "PDPA-SG",
    targetFrameworkCode: "GDPR",
    relationshipType: "coordination",
    description:
      "Singapore PDPA and GDPR align on consent and rights principles with different breach timelines.",
    severity: "medium",
    riskLevel: "medium",
    mitigation:
      "Share the privacy program baseline while honoring PDPC-specific timelines and exemptions.",
  },
  {
    sourceFrameworkCode: "DPDP-IN",
    targetFrameworkCode: "GDPR",
    relationshipType: "coordination",
    description:
      "India DPDP Act and GDPR share accountability principles with different consent and notice mechanics.",
    severity: "medium",
    riskLevel: "medium",
    mitigation:
      "Maintain a global privacy baseline with DPDP-specific notice languages and verifiable consent flows.",
  },
  {
    sourceFrameworkCode: "POPIA",
    targetFrameworkCode: "GDPR",
    relationshipType: "overlap",
    description:
      "South Africa POPIA conditions closely track GDPR principles with local enforcement nuances.",
    severity: "medium",
    riskLevel: "medium",
    mitigation:
      "Extend the GDPR baseline to POPIA conditions with local information officer and breach duties.",
  },
  {
    sourceFrameworkCode: "PIPEDA",
    targetFrameworkCode: "GDPR",
    relationshipType: "coordination",
    description:
      "Canada PIPEDA and GDPR align on consent, access, and safeguards with distinct exemption regimes.",
    severity: "low",
    riskLevel: "low",
    mitigation:
      "Use one privacy program with PIPEDA-specific consent and material breach notification handling.",
  },
  {
    sourceFrameworkCode: "PRIVACY-ACT-AU",
    targetFrameworkCode: "GDPR",
    relationshipType: "coordination",
    description:
      "Australian Privacy Principles and GDPR share rights and transparency duties with different scope.",
    severity: "low",
    riskLevel: "low",
    mitigation:
      "Operate APP-aligned practices as the local baseline while satisfying GDPR where it applies.",
  },
  {
    sourceFrameworkCode: "MEXICO-DPA",
    targetFrameworkCode: "GDPR",
    relationshipType: "coordination",
    description:
      "Mexican Federal Law and GDPR both require transparency, consent, and rights with local nuances.",
    severity: "low",
    riskLevel: "low",
    mitigation:
      "Layer Mexican privacy notice and ARCO workflows onto the global privacy baseline.",
  },
  {
    sourceFrameworkCode: "ISO-27001",
    targetFrameworkCode: "CSL",
    relationshipType: "coordination",
    description:
      "ISO 27001 ISMS controls can underpin CSL network security baseline obligations for international operators.",
    severity: "medium",
    riskLevel: "medium",
    mitigation:
      "Use the certified ISMS as evidence for CSL baseline controls with local incident reporting overlays.",
  },
  {
    sourceFrameworkCode: "TH-PDPA",
    targetFrameworkCode: "GDPR",
    relationshipType: "coordination",
    description:
      "Thailand PDPA aligns with GDPR principles for lawful basis, rights, and breach notification.",
    severity: "low",
    riskLevel: "low",
    mitigation:
      "Reuse the global privacy baseline with PDPC Thai-specific consent and DPO requirements.",
  },
  {
    sourceFrameworkCode: "NDPA-NG",
    targetFrameworkCode: "GDPR",
    relationshipType: "coordination",
    description:
      "Nigeria NDPA and its Data Protection Act share GDPR-style accountability and rights duties.",
    severity: "low",
    riskLevel: "low",
    mitigation:
      "Extend the global privacy baseline with NDPA registration, officer, and breach duties.",
  },
  {
    sourceFrameworkCode: "KENYA-DPA",
    targetFrameworkCode: "GDPR",
    relationshipType: "coordination",
    description:
      "Kenya Data Protection Act mirrors GDPR principles with local licensing and transfer rules.",
    severity: "low",
    riskLevel: "low",
    mitigation:
      "Layer Kenya DPO registration and local transfer safeguards onto the global baseline.",
  },
];
