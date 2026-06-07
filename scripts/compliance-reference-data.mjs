export const complianceFrameworks = [
  {
    code: "PIPL",
    name: "Personal Information Protection Law",
    country: "China",
    description:
      "China's personal information privacy law governing lawful processing, rights, and cross-border data transfer requirements.",
    scope: "All organizations processing personal information in China.",
    enforcementAuthority: "Cyberspace Administration of China (CAC)",
    maxPenalty: "Up to RMB 50M or 5% of annual turnover",
  },
  {
    code: "CSL",
    name: "Cybersecurity Law",
    country: "China",
    description:
      "China's foundational cybersecurity law for network operators and critical information infrastructure protection.",
    scope: "Network operators and critical information infrastructure operators.",
    enforcementAuthority: "Cyberspace Administration of China (CAC)",
    maxPenalty: "Amended framework effective Jan 1, 2026 with higher penalties",
  },
  {
    code: "DSL",
    name: "Data Security Law",
    country: "China",
    description:
      "National framework for data classification, important data protection, and risk-based security controls.",
    scope: "All data processors within China.",
    enforcementAuthority: "Cyberspace Administration of China (CAC)",
    maxPenalty: "Major fines and business restrictions for severe violations",
  },
  {
    code: "MLPS2",
    name: "Multi-Level Protection Scheme 2.0",
    country: "China",
    description:
      "Technical and administrative baseline for classifying and protecting information systems by risk level.",
    scope: "All networked information systems operating in China.",
    enforcementAuthority: "MPS / CAC",
    maxPenalty: "Regulatory sanctions and mandatory remediation for non-compliance",
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
    scope: "Organizations discovering or handling cybersecurity vulnerabilities.",
    enforcementAuthority: "MIIT / CAC / MPS",
    maxPenalty: "Penalties for delayed, withheld, or improper disclosure",
  },
  {
    code: "CBDT",
    name: "Cross-border Data Transfer Measures",
    country: "China",
    description:
      "Rules for overseas data transfer pathways, including CAC assessment, contracts, and certification routes.",
    scope: "Entities transferring personal or important data outside China.",
    enforcementAuthority: "CAC",
    maxPenalty: "Transfer suspension and administrative sanctions",
  },
  {
    code: "PDPL",
    name: "Personal Data Protection Law",
    country: "Saudi Arabia",
    description:
      "Saudi national privacy law for personal data processing, rights management, and breach notifications.",
    scope: "All controllers and processors handling personal data in Saudi Arabia.",
    enforcementAuthority: "Saudi Data and AI Authority (SDAIA)",
    maxPenalty: "Up to SAR 5M and possible additional sanctions",
  },
  {
    code: "NCA",
    name: "National Cybersecurity Authority Framework Baseline",
    country: "Saudi Arabia",
    description:
      "National umbrella for mandatory cybersecurity governance and control obligations across sectors.",
    scope: "Government entities, critical sectors, and regulated private organizations.",
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
    scope: "Government and critical entities in Saudi Arabia.",
    enforcementAuthority: "National Cybersecurity Authority (NCA)",
    maxPenalty: "Corrective actions and compliance enforcement for mandated entities",
  },
  {
    code: "CCC",
    name: "Cloud Cybersecurity Controls (CCC-2:2024)",
    country: "Saudi Arabia",
    description:
      "Cloud-specific extension of NCA controls covering CSP/CST responsibilities and cloud assurance.",
    scope: "Cloud service providers and cloud service tenants operating in KSA.",
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
    maxPenalty: "Escalated remediation and regulatory action for critical system gaps",
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
    requirement: "Adopt MLPS baseline controls with monitoring, logging, and hardening safeguards.",
    applicability: "Network operators and CIIOs in China.",
  },
  {
    frameworkCode: "CSL",
    controlCode: "CSL-2",
    controlName: "Incident Reporting Timeline",
    category: "Incident Response",
    description:
      "Major incidents require initial and detailed reporting to authorities in strict timelines.",
    requirement: "Submit initial report within 2 hours and detailed report within 24 hours.",
    applicability: "Network operators and CIIOs in China.",
  },
  {
    frameworkCode: "CSL",
    controlCode: "CSL-3",
    controlName: "Critical Data Localization",
    category: "Data Transfer",
    description:
      "CIIOs must retain critical and personal data in mainland China unless approved transfer applies.",
    requirement: "Store regulated data locally and complete security assessment before export.",
    applicability: "Critical information infrastructure operators.",
  },
  {
    frameworkCode: "CSL",
    controlCode: "CSL-4",
    controlName: "Network Log Retention",
    category: "Monitoring",
    description: "Maintain network operation logs and evidence for supervision and investigation.",
    requirement: "Retain relevant network logs for at least six months.",
    applicability: "Network operators in China.",
  },

  // China - DSL
  {
    frameworkCode: "DSL",
    controlCode: "DSL-1",
    controlName: "Data Classification and Tiering",
    category: "Data Governance",
    description:
      "Classify data into general, important, and core categories with risk-based protections.",
    requirement: "Define data categories and apply controls proportional to classification level.",
    applicability: "All data processors in China.",
  },
  {
    frameworkCode: "DSL",
    controlCode: "DSL-2",
    controlName: "Important Data Annual Report",
    category: "Regulatory Reporting",
    description: "Handlers of important data must submit annual security reports.",
    requirement: "Provide annual assessment report to competent regulator.",
    applicability: "Important data handlers in China.",
  },
  {
    frameworkCode: "DSL",
    controlCode: "DSL-3",
    controlName: "Data Security Risk Assessment",
    category: "Risk Management",
    description: "Conduct ongoing data security risk assessments and rectify identified gaps.",
    requirement: "Document assessment outcomes and implement mitigation plans.",
    applicability: "All data processors in China.",
  },

  // China - PIPL
  {
    frameworkCode: "PIPL",
    controlCode: "PIPL-1",
    controlName: "Lawful Basis and Explicit Consent",
    category: "Privacy Governance",
    description: "Establish lawful basis and explicit consent mechanisms for PI processing.",
    requirement: "Obtain informed consent unless another legal basis applies.",
    applicability: "All PI processors in China.",
  },
  {
    frameworkCode: "PIPL",
    controlCode: "PIPL-2",
    controlName: "Data Subject Rights Handling",
    category: "Data Subject Rights",
    description: "Enable access, correction, deletion, portability, and objection workflows.",
    requirement: "Provide operational channels and response timelines for rights requests.",
    applicability: "All PI processors in China.",
  },
  {
    frameworkCode: "PIPL",
    controlCode: "PIPL-3",
    controlName: "PIIA Before High-risk Processing",
    category: "Risk Management",
    description: "Perform Personal Information Impact Assessments for high-risk processing.",
    requirement: "Complete and retain PIIA records prior to high-risk activities.",
    applicability: "Organizations processing sensitive PI or conducting high-risk operations.",
  },
  {
    frameworkCode: "PIPL",
    controlCode: "PIPL-4",
    controlName: "Minors Data Safeguards",
    category: "Special Categories",
    description:
      "Apply dedicated safeguards for children under 14, including separate guardian consent.",
    requirement: "Collect guardian consent and maintain annual compliance reporting where applicable.",
    applicability: "Organizations processing minors personal information in China.",
  },

  // China - MLPS 2.0
  {
    frameworkCode: "MLPS2",
    controlCode: "MLPS2-1",
    controlName: "System Protection Level Determination",
    category: "Governance",
    description: "Classify systems from Level 1 to Level 5 based on national security impact.",
    requirement: "Document and register MLPS level for covered systems.",
    applicability: "All covered information systems in China.",
  },
  {
    frameworkCode: "MLPS2",
    controlCode: "MLPS2-2",
    controlName: "Technical Security Control Stack",
    category: "Technical Controls",
    description:
      "Implement physical, network, host, application, and data controls per MLPS requirements.",
    requirement: "Deploy mandatory controls appropriate to assigned MLPS level.",
    applicability: "All covered systems; stricter duties for higher levels.",
  },
  {
    frameworkCode: "MLPS2",
    controlCode: "MLPS2-3",
    controlName: "Administrative Security Controls",
    category: "Administrative Controls",
    description:
      "Establish institutional, organizational, personnel, construction, and operations controls.",
    requirement: "Maintain formal governance, personnel controls, and operational procedures.",
    applicability: "All covered systems in China.",
  },
  {
    frameworkCode: "MLPS2",
    controlCode: "MLPS2-4",
    controlName: "Level 3 Annual Assessment",
    category: "Audit",
    description: "Level 3 systems require annual assessment by licensed evaluators.",
    requirement: "Complete annual third-party MLPS evaluation and regulator submission.",
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
    applicability: "Network data processors in China.",
  },
  {
    frameworkCode: "NDSM",
    controlCode: "NDSM-2",
    controlName: "Important Data Security Reporting",
    category: "Regulatory Reporting",
    description: "Submit security reports for designated important data activities.",
    requirement: "Provide periodic compliance and risk reports to competent authorities.",
    applicability: "Important data handlers in China.",
  },

  // China - CIIP
  {
    frameworkCode: "CIIP",
    controlCode: "CIIP-1",
    controlName: "Critical Infrastructure Security Program",
    category: "Critical Infrastructure",
    description: "Implement specialized cybersecurity governance for CIIO operations.",
    requirement: "Establish dedicated CII security management and defense controls.",
    applicability: "Identified CIIO entities.",
  },
  {
    frameworkCode: "CIIP",
    controlCode: "CIIP-2",
    controlName: "Security Review for Procurement",
    category: "Third-party Risk",
    description: "Conduct security review before adopting network products and services.",
    requirement: "Assess supply-chain and product risk before critical deployments.",
    applicability: "CIIO operators.",
  },

  // China - VULN
  {
    frameworkCode: "VULN",
    controlCode: "VULN-1",
    controlName: "Vulnerability Reporting Window",
    category: "Vulnerability Management",
    description: "Disclosed vulnerabilities must be reported to authorities quickly.",
    requirement: "Report vulnerabilities to MIIT/CAC/MPS portal within 48 hours.",
    applicability: "Entities discovering cybersecurity vulnerabilities in China.",
  },
  {
    frameworkCode: "VULN",
    controlCode: "VULN-2",
    controlName: "Coordinated Disclosure and Patching",
    category: "Vulnerability Management",
    description: "Coordinate remediation and avoid harmful premature disclosure.",
    requirement: "Provide remediation guidance and avoid exploit amplification.",
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
    requirement: "Use CAC assessment, standard contract, or certification as required.",
    applicability: "Entities transferring data overseas from China.",
  },
  {
    frameworkCode: "CBDT",
    controlCode: "CBDT-2",
    controlName: "Transfer Security Assessment",
    category: "Cross-border Transfer",
    description: "Run security impact assessments before cross-border transfer activities.",
    requirement: "Assess data sensitivity, recipient controls, and residual legal risk.",
    applicability: "Entities exporting personal or important data.",
  },

  // Saudi Arabia - NCA umbrella
  {
    frameworkCode: "NCA",
    controlCode: "NCA-1",
    controlName: "National Cybersecurity Governance",
    category: "Governance",
    description: "Align organization-wide cybersecurity strategy with NCA obligations.",
    requirement: "Define governance model, accountability, and policy baseline.",
    applicability: "Regulated entities under NCA scope.",
  },
  {
    frameworkCode: "NCA",
    controlCode: "NCA-2",
    controlName: "Haseen and Compliance Reporting",
    category: "Regulatory Reporting",
    description: "Maintain evidence and periodic reporting of compliance maturity.",
    requirement: "Submit periodic compliance status via designated NCA channels.",
    applicability: "Regulated entities under NCA scope.",
  },
  {
    frameworkCode: "NCA",
    controlCode: "NCA-3",
    controlName: "Significant Incident Reporting",
    category: "Incident Response",
    description: "Report significant cybersecurity incidents without delay.",
    requirement: "Trigger immediate escalation and regulator notification workflows.",
    applicability: "Regulated entities under NCA scope.",
  },

  // Saudi Arabia - NCA legal powers
  {
    frameworkCode: "NCA-M117",
    controlCode: "NCA-M117-1",
    controlName: "Violation Classification and Penalties",
    category: "Enforcement",
    description: "Map violations and maintain evidence required for enforcement review.",
    requirement: "Maintain auditable records of control implementation and incidents.",
    applicability: "Entities subject to NCA legal powers.",
  },
  {
    frameworkCode: "NCA-M117",
    controlCode: "NCA-M117-2",
    controlName: "Executive Accountability",
    category: "Governance",
    description: "Define personal accountability and escalation responsibilities.",
    requirement: "Document role-based obligations and response ownership.",
    applicability: "Executive and risk owners in regulated entities.",
  },

  // Saudi Arabia - ECC
  {
    frameworkCode: "ECC",
    controlCode: "ECC-1",
    controlName: "Governance Domain Controls",
    category: "Governance",
    description: "Implement cybersecurity strategy, management, policy, and risk controls.",
    requirement: "Operate governance controls across strategy, HR, and risk functions.",
    applicability: "Entities required to implement ECC.",
  },
  {
    frameworkCode: "ECC",
    controlCode: "ECC-2",
    controlName: "Defense Domain Controls",
    category: "Defense",
    description: "Implement asset management, IAM, and network protection controls.",
    requirement: "Maintain technical controls for prevention and detection.",
    applicability: "Entities required to implement ECC.",
  },
  {
    frameworkCode: "ECC",
    controlCode: "ECC-3",
    controlName: "Resilience Domain Controls",
    category: "Resilience",
    description: "Implement continuity and disaster recovery readiness controls.",
    requirement: "Test and maintain BCP and DR capabilities.",
    applicability: "Entities required to implement ECC.",
  },
  {
    frameworkCode: "ECC",
    controlCode: "ECC-4",
    controlName: "Third-party and Cloud Domain Controls",
    category: "Third-party",
    description: "Manage supplier and cloud cybersecurity risk across lifecycle.",
    requirement: "Assess, contract, and monitor third-party risk controls.",
    applicability: "Entities required to implement ECC.",
  },
  {
    frameworkCode: "ECC",
    controlCode: "ECC-5",
    controlName: "ICS/OT Domain Controls",
    category: "ICS/OT",
    description: "Apply specialized controls for industrial and operational technology environments.",
    requirement: "Implement segmentation and OT-specific protection practices.",
    applicability: "Entities with ICS/OT environments under ECC scope.",
  },

  // Saudi Arabia - CCC
  {
    frameworkCode: "CCC",
    controlCode: "CCC-1",
    controlName: "Cloud Shared Responsibility Model",
    category: "Cloud Security",
    description: "Define CSP and tenant responsibilities for cloud security operations.",
    requirement: "Map control ownership and enforce shared accountability.",
    applicability: "CSPs and cloud service tenants in KSA.",
  },
  {
    frameworkCode: "CCC",
    controlCode: "CCC-2",
    controlName: "Cloud Data Sovereignty",
    category: "Cloud Security",
    description: "Protect regulated data location and handling in line with KSA requirements.",
    requirement: "Apply cloud architecture and controls that enforce data sovereignty obligations.",
    applicability: "Cloud workloads processing regulated Saudi data.",
  },

  // Saudi Arabia - CSCC
  {
    frameworkCode: "CSCC",
    controlCode: "CSCC-1",
    controlName: "Critical System Classification",
    category: "Critical Systems",
    description: "Identify and classify critical systems requiring enhanced controls.",
    requirement: "Apply stricter protection profile to designated critical systems.",
    applicability: "Critical system operators.",
  },
  {
    frameworkCode: "CSCC",
    controlCode: "CSCC-2",
    controlName: "Critical Monitoring and Assurance",
    category: "Critical Systems",
    description: "Operate continuous monitoring and assurance for critical systems.",
    requirement: "Deploy SOC visibility, hardening checks, and remediation tracking.",
    applicability: "Critical system operators.",
  },

  // Saudi Arabia - OTCC
  {
    frameworkCode: "OTCC",
    controlCode: "OTCC-1",
    controlName: "OT Asset Inventory and Zoning",
    category: "OT Security",
    description: "Maintain OT inventory and enforce zone/conduit segmentation patterns.",
    requirement: "Document OT assets and isolate high-risk process networks.",
    applicability: "ICS/OT operators.",
  },
  {
    frameworkCode: "OTCC",
    controlCode: "OTCC-2",
    controlName: "Secure OT Remote Access",
    category: "OT Security",
    description: "Control and monitor remote access into operational technology environments.",
    requirement: "Use approved jump hosts, MFA, and monitored privileged sessions.",
    applicability: "ICS/OT operators.",
  },

  // Saudi Arabia - DCC
  {
    frameworkCode: "DCC",
    controlCode: "DCC-1",
    controlName: "Data Classification and Handling",
    category: "Data Security",
    description: "Classify data and apply handling requirements by sensitivity and business impact.",
    requirement: "Define protection controls for each classification tier.",
    applicability: "Organizations handling sensitive or regulated data.",
  },
  {
    frameworkCode: "DCC",
    controlCode: "DCC-2",
    controlName: "Data Encryption and Key Management",
    category: "Data Security",
    description: "Protect data at rest and in transit with managed cryptographic controls.",
    requirement: "Implement approved encryption and key lifecycle management.",
    applicability: "Organizations handling regulated data.",
  },

  // Saudi Arabia - TCC
  {
    frameworkCode: "TCC",
    controlCode: "TCC-1",
    controlName: "Telework Access Controls",
    category: "Remote Security",
    description: "Secure remote connectivity with identity validation and least privilege.",
    requirement: "Apply MFA, conditional access, and hardened remote channels.",
    applicability: "Organizations enabling telework.",
  },
  {
    frameworkCode: "TCC",
    controlCode: "TCC-2",
    controlName: "Telework Endpoint Protection",
    category: "Remote Security",
    description: "Harden and monitor endpoints used for remote work activities.",
    requirement: "Enforce endpoint security baseline and continuous monitoring.",
    applicability: "Telework endpoints and managed remote devices.",
  },

  // Saudi Arabia - PDPL
  {
    frameworkCode: "PDPL",
    controlCode: "PDPL-1",
    controlName: "Lawful Processing and Consent",
    category: "Privacy Governance",
    description: "Ensure legal basis and explicit consent for personal data processing.",
    requirement: "Collect and document consent where required by PDPL.",
    applicability: "All personal data controllers/processors in Saudi Arabia.",
  },
  {
    frameworkCode: "PDPL",
    controlCode: "PDPL-2",
    controlName: "Data Subject Rights Management",
    category: "Data Subject Rights",
    description: "Enable rights access, correction, and deletion request handling.",
    requirement: "Provide rights workflow and response tracking.",
    applicability: "All personal data controllers/processors in Saudi Arabia.",
  },
  {
    frameworkCode: "PDPL",
    controlCode: "PDPL-3",
    controlName: "Breach Notification to SDAIA",
    category: "Incident Response",
    description: "Notify SDAIA and affected data subjects for qualifying breaches.",
    requirement: "Report personal data breach to SDAIA within 72 hours where required.",
    applicability: "All personal data controllers in Saudi Arabia.",
  },
  {
    frameworkCode: "PDPL",
    controlCode: "PDPL-4",
    controlName: "Cross-border Transfer Controls",
    category: "Cross-border Transfer",
    description: "Apply transfer restrictions and approval pathways for cross-border data movement.",
    requirement: "Complete adequacy, contractual, or regulator-approved transfer mechanisms.",
    applicability: "Entities transferring personal data outside Saudi Arabia.",
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
    mitigation: "Operate a unified control baseline with privacy-specific overlays for personal information.",
  },
  {
    sourceFrameworkCode: "PIPL",
    targetFrameworkCode: "DSL",
    relationshipType: "overlap",
    description:
      "Both require data governance and risk controls, with DSL emphasizing data tiering and PIPL emphasizing PI rights.",
    severity: "high",
    riskLevel: "high",
    mitigation: "Create a harmonized data inventory linking PI classifications to DSL tiers.",
  },
  {
    sourceFrameworkCode: "PIPL",
    targetFrameworkCode: "MLPS2",
    relationshipType: "coordination",
    description:
      "PIPL organizational controls can be coordinated with MLPS technical and administrative requirements.",
    severity: "medium",
    riskLevel: "medium",
    mitigation: "Map PIPL obligations into MLPS technical and organizational control owners.",
  },
  {
    sourceFrameworkCode: "PIPL",
    targetFrameworkCode: "CBDT",
    relationshipType: "dependency",
    description:
      "Cross-border personal information transfers under PIPL rely on CBDT transfer pathway requirements.",
    severity: "high",
    riskLevel: "high",
    mitigation: "Automate transfer eligibility checks and trigger the required pathway before export.",
  },
  {
    sourceFrameworkCode: "PIPL",
    targetFrameworkCode: "PDPL",
    relationshipType: "overlap",
    description:
      "Both require lawful basis, transparency, rights handling, and breach governance for personal data.",
    severity: "critical",
    riskLevel: "critical",
    mitigation: "Use jurisdiction-aware privacy workflows with country-specific legal notices and response SLAs.",
  },
  {
    sourceFrameworkCode: "PIPL",
    targetFrameworkCode: "NCA",
    relationshipType: "conflict",
    description:
      "PIPL export pathways and Saudi sovereignty obligations can conflict for shared cross-border processing architectures.",
    severity: "critical",
    riskLevel: "critical",
    mitigation: "Segment data residency architecture by jurisdiction and isolate regulated workloads.",
  },
  {
    sourceFrameworkCode: "CSL",
    targetFrameworkCode: "DSL",
    relationshipType: "dependency",
    description:
      "CSL establishes network security baseline while DSL adds data-centric duties and classification controls.",
    severity: "high",
    riskLevel: "high",
    mitigation: "Sequence implementation: establish CSL baseline then layer DSL data governance controls.",
  },
  {
    sourceFrameworkCode: "CSL",
    targetFrameworkCode: "MLPS2",
    relationshipType: "overlap",
    description:
      "CSL obligations are operationalized in practice through MLPS technical and administrative controls.",
    severity: "high",
    riskLevel: "high",
    mitigation: "Maintain a bidirectional control map from CSL obligations to MLPS evidence artifacts.",
  },
  {
    sourceFrameworkCode: "CSL",
    targetFrameworkCode: "CIIP",
    relationshipType: "overlap",
    description:
      "CIIP duties are a specialized extension of CSL for critical infrastructure operators.",
    severity: "high",
    riskLevel: "high",
    mitigation: "Apply a CIIO-specific enhancement profile on top of CSL baseline controls.",
  },
  {
    sourceFrameworkCode: "CSL",
    targetFrameworkCode: "VULN",
    relationshipType: "coordination",
    description:
      "Vulnerability reporting rules and CSL incident obligations require synchronized escalation.",
    severity: "high",
    riskLevel: "high",
    mitigation: "Integrate vulnerability and incident response playbooks into a single regulatory escalation workflow.",
  },
  {
    sourceFrameworkCode: "DSL",
    targetFrameworkCode: "NDSM",
    relationshipType: "overlap",
    description:
      "NDSM operationalizes DSL obligations for network data governance, reporting, and controls.",
    severity: "high",
    riskLevel: "high",
    mitigation: "Use DSL categories as the master taxonomy for NDSM reporting and controls.",
  },
  {
    sourceFrameworkCode: "DSL",
    targetFrameworkCode: "CBDT",
    relationshipType: "dependency",
    description:
      "Important data classification under DSL influences cross-border transfer obligations under CBDT.",
    severity: "medium",
    riskLevel: "medium",
    mitigation: "Classify transfer datasets first, then route to the correct transfer assessment process.",
  },
  {
    sourceFrameworkCode: "DSL",
    targetFrameworkCode: "PDPL",
    relationshipType: "overlap",
    description:
      "Both require strong governance of sensitive data, though legal scope and terminology differ.",
    severity: "high",
    riskLevel: "high",
    mitigation: "Adopt a common data governance model with dual-jurisdiction policy mapping.",
  },
  {
    sourceFrameworkCode: "DSL",
    targetFrameworkCode: "NCA",
    relationshipType: "conflict",
    description:
      "Data localization and transfer restrictions can conflict between Chinese and Saudi regulatory boundaries.",
    severity: "critical",
    riskLevel: "critical",
    mitigation: "Deploy physically and logically separate data processing environments per jurisdiction.",
  },
  {
    sourceFrameworkCode: "PDPL",
    targetFrameworkCode: "NCA",
    relationshipType: "overlap",
    description:
      "PDPL privacy obligations and NCA cybersecurity controls overlap heavily on data protection and incident handling.",
    severity: "high",
    riskLevel: "high",
    mitigation: "Run integrated privacy and cybersecurity governance with shared control owners.",
  },
  {
    sourceFrameworkCode: "PDPL",
    targetFrameworkCode: "ECC",
    relationshipType: "dependency",
    description:
      "PDPL compliance depends on technical and governance controls that are largely implemented through ECC domains.",
    severity: "high",
    riskLevel: "high",
    mitigation: "Map PDPL obligations directly to ECC controls and validate evidence coverage.",
  },
  {
    sourceFrameworkCode: "PDPL",
    targetFrameworkCode: "CCC",
    relationshipType: "coordination",
    description:
      "Cloud personal data obligations under PDPL require coordinated implementation with CCC cloud controls.",
    severity: "medium",
    riskLevel: "medium",
    mitigation: "Establish cloud control matrices that link PDPL obligations to CCC technical safeguards.",
  },
  {
    sourceFrameworkCode: "ECC",
    targetFrameworkCode: "MLPS2",
    relationshipType: "coordination",
    description:
      "ECC and MLPS2 share mature cybersecurity control themes but differ in taxonomy and assurance approach.",
    severity: "medium",
    riskLevel: "medium",
    mitigation: "Build a crosswalk between ECC domains and MLPS control families for multinational programs.",
  },
  {
    sourceFrameworkCode: "ECC",
    targetFrameworkCode: "CSL",
    relationshipType: "coordination",
    description:
      "ECC defense and resilience controls can be aligned with CSL baseline network security obligations.",
    severity: "medium",
    riskLevel: "medium",
    mitigation: "Create one technical baseline with jurisdiction-specific legal overlays.",
  },
  {
    sourceFrameworkCode: "CCC",
    targetFrameworkCode: "CIIP",
    relationshipType: "overlap",
    description:
      "Both frameworks impose enhanced cloud and infrastructure security obligations for critical services.",
    severity: "medium",
    riskLevel: "medium",
    mitigation: "Use shared cloud architecture guardrails and evidence collection for both frameworks.",
  },
  {
    sourceFrameworkCode: "CSCC",
    targetFrameworkCode: "CIIP",
    relationshipType: "coordination",
    description:
      "Critical system controls in Saudi context align with CIIP protection principles for critical infrastructure.",
    severity: "high",
    riskLevel: "high",
    mitigation: "Adopt critical-asset focused segmentation, monitoring, and assurance across both jurisdictions.",
  },
  {
    sourceFrameworkCode: "OTCC",
    targetFrameworkCode: "MLPS2",
    relationshipType: "gap",
    description:
      "OT safety-integrated controls in OTCC may not be explicitly addressed in general IT-focused MLPS implementations.",
    severity: "medium",
    riskLevel: "medium",
    mitigation: "Add OT-specific safeguards and safety requirements as an extension to MLPS implementation.",
  },
  {
    sourceFrameworkCode: "DCC",
    targetFrameworkCode: "DSL",
    relationshipType: "overlap",
    description:
      "Both require strong data classification and security controls, with different national policy framing.",
    severity: "high",
    riskLevel: "high",
    mitigation: "Consolidate data classification and handling standards with country-specific overlays.",
  },
  {
    sourceFrameworkCode: "TCC",
    targetFrameworkCode: "MLPS2",
    relationshipType: "coordination",
    description:
      "Remote access and endpoint controls in telework policy can align with MLPS operational controls.",
    severity: "low",
    riskLevel: "low",
    mitigation: "Use consistent remote-access hardening standards and localized policy language.",
  },
  {
    sourceFrameworkCode: "NCA-M117",
    targetFrameworkCode: "CSL",
    relationshipType: "gap",
    description:
      "Both create legal enforcement exposure but differ in penalty mechanics, reporting chains, and authority models.",
    severity: "high",
    riskLevel: "high",
    mitigation: "Maintain jurisdiction-specific legal escalation matrices and executive accountability playbooks.",
  },
  {
    sourceFrameworkCode: "VULN",
    targetFrameworkCode: "NCA",
    relationshipType: "coordination",
    description:
      "Vulnerability management in China and Saudi cybersecurity governance can be coordinated for unified triage operations.",
    severity: "medium",
    riskLevel: "medium",
    mitigation: "Unify vulnerability lifecycle tooling while preserving local reporting timelines and authority channels.",
  },
];
