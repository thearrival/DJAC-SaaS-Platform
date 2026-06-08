-- Seed data for DJAC SaaS Platform
-- Inserts compliance frameworks and reference data

INSERT INTO frameworks (code, name, country, description, scope, enforcementAuthority, maxPenalty)
VALUES
  ('PDPA', 'Personal Data Protection Act', 'Saudi Arabia', 'Saudi Arabias comprehensive data protection law governing processing of personal data', 'All sectors processing personal data in KSA', 'Saudi Data & AI Authority (SDAIA)', 'SAR 5 million'),
  ('PDPL', 'Personal Information Protection Law', 'China', 'Chinas comprehensive personal information protection law', 'All organizations processing personal data in China', 'Cyberspace Administration of China (CAC)', 'CNY 50 million or 5% annual revenue'),
  ('NCA-ECC', 'NCA Essential Cybersecurity Controls', 'Saudi Arabia', 'National Cybersecurity Authority Essential Cybersecurity Controls', 'Government entities and critical infrastructure in KSA', 'National Cybersecurity Authority (NCA)', 'Varies'),
  ('CSL', 'Cybersecurity Law', 'China', 'Chinas primary cybersecurity legislation', 'Network operators and critical information infrastructure', 'Cyberspace Administration of China (CAC)', 'CNY 1 million'),
  ('DSL', 'Data Security Law', 'China', 'Chinas data security framework for data processing activities', 'All data processing activities in China', 'Cyberspace Administration of China (CAC)', 'CNY 10 million')
ON CONFLICT (code) DO UPDATE SET
  updatedAt = NOW();

-- Compliance controls for PDPA
INSERT INTO complianceControls (frameworkId, controlCode, controlName, category, description, requirement)
SELECT f.id, c.code, c.name, c.category, c.description, c.requirement
FROM frameworks f
CROSS JOIN (
  VALUES
    ('PDPA-C1', 'Data Processing Lawfulness', 'Legal Basis', 'Ensure all personal data processing is based on consent, contract, legal obligation, vital interest, public interest, or legitimate interest', 'Data controllers must establish and document a valid legal basis for all processing activities'),
    ('PDPA-C2', 'Data Subject Rights', 'Individual Rights', 'Enable data subjects to exercise rights including access, rectification, erasure, portability, restriction, and objection', 'Implement mechanisms for data subjects to submit requests and receive responses within mandated timelines'),
    ('PDPA-C3', 'Data Protection Officer', 'Governance', 'Appoint a Data Protection Officer responsible for compliance oversight', 'Designate a DPO and publish their contact information with the regulatory authority'),
    ('PDPA-C4', 'Cross-Border Transfer', 'Data Transfer', 'Ensure adequate protection for personal data transferred outside Saudi Arabia', 'Implement Standard Contractual Clauses or Binding Corporate Rules for international transfers'),
    ('PDPA-C5', 'Data Breach Notification', 'Security', 'Notify SDAIA and affected data subjects of personal data breaches', 'Establish incident response procedures with mandatory notification within 72 hours')
) AS c(code, name, category, description, requirement)
WHERE f.code = 'PDPA'
ON CONFLICT DO NOTHING;

-- Compliance controls for PDPL
INSERT INTO complianceControls (frameworkId, controlCode, controlName, category, description, requirement)
SELECT f.id, c.code, c.name, c.category, c.description, c.requirement
FROM frameworks f
CROSS JOIN (
  VALUES
    ('PDPL-C1', 'Consent Management', 'Legal Basis', 'Obtain explicit, informed, and freely given consent for personal data processing', 'Implement granular consent mechanisms with withdrawal capability and record-keeping'),
    ('PDPL-C2', 'Data Localization', 'Data Storage', 'Store personal data of Chinese citizens within mainland China', 'Maintain primary data storage infrastructure within Chinas borders'),
    ('PDPL-C3', 'Security Assessment', 'Data Security', 'Conduct security assessments for data processing activities affecting large volumes of personal data', 'Perform and document annual Data Protection Impact Assessments'),
    ('PDPL-C4', 'Cross-Border Transfer', 'Data Transfer', 'Pass security review by CAC for data exports', 'Complete CAC security assessment and obtain approval for cross-border data transfers'),
    ('PDPL-C5', 'Automated Decision-Making', 'Individual Rights', 'Allow individuals to reject automated decision-making that significantly affects their interests', 'Provide opt-out mechanisms for AI/automated decisions and human review on request')
) AS c(code, name, category, description, requirement)
WHERE f.code = 'PDPL'
ON CONFLICT DO NOTHING;

-- Org member roles reference
INSERT INTO organizationMembers (organizationId, userId, role, status)
SELECT o.id, u.id, 'owner', 'active'
FROM organizations o, users u
WHERE o.slug = 'demo-org'
  AND u.email = 'admin@djac.ai'
ON CONFLICT DO NOTHING;
