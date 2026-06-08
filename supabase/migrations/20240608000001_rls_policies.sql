-- ═══════════════════════════════════════════════════════════════════════════════
-- DJAC SaaS - Row Level Security Policies
-- ═══════════════════════════════════════════════════════════════════════════════

-- Enable RLS on remaining tables
ALTER TABLE IF EXISTS "compliancePolicies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "complianceIncidents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "remediationTasks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "riskRegister" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "vendors" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "vendorAssessments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "apiKeys" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "complianceDeadlines" ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════════════════
-- ORGANIZATION-LEVEL POLICIES
-- All tables with organizationId use the same pattern:
--   SELECT: org member can read
--   INSERT/UPDATE/DELETE: org admin or above
-- ═══════════════════════════════════════════════════════════════════════════════

-- Helper: get user's organization IDs
CREATE OR REPLACE FUNCTION auth.user_org_ids()
RETURNS INTEGER[]
LANGUAGE SQL STABLE
AS $$
  SELECT COALESCE(ARRAY_AGG("organizationId"), ARRAY[]::INTEGER[])
  FROM "organizationMembers"
  WHERE "userId" IN (
    SELECT id FROM "users" WHERE "openId" = auth.uid()::text
  );
$$;

-- Helper: check if user is org admin
CREATE OR REPLACE FUNCTION auth.user_is_org_admin(org_id INTEGER)
RETURNS BOOLEAN
LANGUAGE SQL STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM "organizationMembers"
    WHERE "organizationId" = org_id
      AND "role" IN ('owner', 'admin')
      AND "userId" IN (
        SELECT id FROM "users" WHERE "openId" = auth.uid()::text
      )
  );
$$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- VENDORS
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE POLICY "vendors_org_select" ON "vendors"
  FOR SELECT USING (
    "organizationId" = ANY(auth.user_org_ids())
  );

CREATE POLICY "vendors_org_insert" ON "vendors"
  FOR INSERT WITH CHECK (
    "organizationId" = ANY(auth.user_org_ids())
  );

CREATE POLICY "vendors_org_update" ON "vendors"
  FOR UPDATE USING (
    auth.user_is_org_admin("organizationId")
  );

CREATE POLICY "vendors_org_delete" ON "vendors"
  FOR DELETE USING (
    auth.user_is_org_admin("organizationId")
  );

-- ═══════════════════════════════════════════════════════════════════════════════
-- COMPLIANCE POLICIES
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE POLICY "policies_org_select" ON "compliancePolicies"
  FOR SELECT USING (
    "organizationId" = ANY(auth.user_org_ids())
  );

CREATE POLICY "policies_org_insert" ON "compliancePolicies"
  FOR INSERT WITH CHECK (
    "organizationId" = ANY(auth.user_org_ids())
  );

CREATE POLICY "policies_org_update" ON "compliancePolicies"
  FOR UPDATE USING (
    auth.user_is_org_admin("organizationId")
  );

-- ═══════════════════════════════════════════════════════════════════════════════
-- INCIDENTS
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE POLICY "incidents_org_select" ON "complianceIncidents"
  FOR SELECT USING (
    "organizationId" = ANY(auth.user_org_ids())
  );

CREATE POLICY "incidents_org_insert" ON "complianceIncidents"
  FOR INSERT WITH CHECK (
    "organizationId" = ANY(auth.user_org_ids())
  );

CREATE POLICY "incidents_org_update" ON "complianceIncidents"
  FOR UPDATE USING (
    "organizationId" = ANY(auth.user_org_ids())
  );

-- ═══════════════════════════════════════════════════════════════════════════════
-- REMEDIATION TASKS
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE POLICY "remediation_org_select" ON "remediationTasks"
  FOR SELECT USING (
    "organizationId" = ANY(auth.user_org_ids())
  );

CREATE POLICY "remediation_org_insert" ON "remediationTasks"
  FOR INSERT WITH CHECK (
    "organizationId" = ANY(auth.user_org_ids())
  );

CREATE POLICY "remediation_org_update" ON "remediationTasks"
  FOR UPDATE USING (
    "organizationId" = ANY(auth.user_org_ids())
  );

-- ═══════════════════════════════════════════════════════════════════════════════
-- RISK REGISTER
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE POLICY "risk_org_select" ON "riskRegister"
  FOR SELECT USING (
    "organizationId" = ANY(auth.user_org_ids())
  );

CREATE POLICY "risk_org_insert" ON "riskRegister"
  FOR INSERT WITH CHECK (
    "organizationId" = ANY(auth.user_org_ids())
  );

CREATE POLICY "risk_org_update" ON "riskRegister"
  FOR UPDATE USING (
    "organizationId" = ANY(auth.user_org_ids())
  );

-- ═══════════════════════════════════════════════════════════════════════════════
-- SERVICE ROLE ACCESS
-- ═══════════════════════════════════════════════════════════════════════════════
-- Grant full access to service_role for backend operations
CREATE POLICY "service_role_policies" ON "compliancePolicies"
  FOR ALL USING (current_role = 'service_role');

CREATE POLICY "service_role_incidents" ON "complianceIncidents"
  FOR ALL USING (current_role = 'service_role');

CREATE POLICY "service_role_remediation" ON "remediationTasks"
  FOR ALL USING (current_role = 'service_role');

CREATE POLICY "service_role_risk" ON "riskRegister"
  FOR ALL USING (current_role = 'service_role');

CREATE POLICY "service_role_vendors" ON "vendors"
  FOR ALL USING (current_role = 'service_role');

CREATE POLICY "service_role_deadlines" ON "complianceDeadlines"
  FOR ALL USING (current_role = 'service_role');
