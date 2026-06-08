-- ═══════════════════════════════════════════════════════════════════════════════
-- DJAC SaaS - Row Level Security Policies (Extended)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Helper: get user's organization IDs
CREATE OR REPLACE FUNCTION public.user_org_ids()
RETURNS INTEGER[]
LANGUAGE SQL STABLE
AS $$
  SELECT COALESCE(ARRAY_AGG("organizationId"), ARRAY[]::INTEGER[])
  FROM "organizationMembers"
  WHERE "userId" IN (
    SELECT "id" FROM "users" WHERE "openId" = auth.uid()::text
  );
$$;

-- Helper: check if user is org admin
CREATE OR REPLACE FUNCTION public.user_is_org_admin(org_id INTEGER)
RETURNS BOOLEAN
LANGUAGE SQL STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM "organizationMembers"
    WHERE "organizationId" = org_id
      AND "role" IN ('owner', 'admin')
      AND "userId" IN (
        SELECT "id" FROM "users" WHERE "openId" = auth.uid()::text
      )
  );
$$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- Dynamic policy creation with existence checks
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'vendors' AND relkind = 'r') THEN
    EXECUTE 'ALTER TABLE "vendors" ENABLE ROW LEVEL SECURITY';

    EXECUTE 'CREATE POLICY "vendors_org_select" ON "vendors"
      FOR SELECT USING ("organizationId" = ANY(public.user_org_ids()))';

    EXECUTE 'CREATE POLICY "vendors_org_insert" ON "vendors"
      FOR INSERT WITH CHECK ("organizationId" = ANY(public.user_org_ids()))';

    EXECUTE 'CREATE POLICY "vendors_org_update" ON "vendors"
      FOR UPDATE USING (public.user_is_org_admin("organizationId"))';

    EXECUTE 'CREATE POLICY "vendors_org_delete" ON "vendors"
      FOR DELETE USING (public.user_is_org_admin("organizationId"))';
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'compliancepolicies' AND relkind = 'r') THEN
    EXECUTE 'ALTER TABLE "compliancePolicies" ENABLE ROW LEVEL SECURITY';
    EXECUTE 'CREATE POLICY "policies_org_select" ON "compliancePolicies" FOR SELECT USING ("organizationId" = ANY(public.user_org_ids()))';
    EXECUTE 'CREATE POLICY "policies_org_insert" ON "compliancePolicies" FOR INSERT WITH CHECK ("organizationId" = ANY(public.user_org_ids()))';
    EXECUTE 'CREATE POLICY "policies_org_update" ON "compliancePolicies" FOR UPDATE USING (public.user_is_org_admin("organizationId"))';
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'complianceincidents' AND relkind = 'r') THEN
    EXECUTE 'ALTER TABLE "complianceIncidents" ENABLE ROW LEVEL SECURITY';
    EXECUTE 'CREATE POLICY "incidents_org_select" ON "complianceIncidents" FOR SELECT USING ("organizationId" = ANY(public.user_org_ids()))';
    EXECUTE 'CREATE POLICY "incidents_org_insert" ON "complianceIncidents" FOR INSERT WITH CHECK ("organizationId" = ANY(public.user_org_ids()))';
    EXECUTE 'CREATE POLICY "incidents_org_update" ON "complianceIncidents" FOR UPDATE USING ("organizationId" = ANY(public.user_org_ids()))';
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'remediationtasks' AND relkind = 'r') THEN
    EXECUTE 'ALTER TABLE "remediationTasks" ENABLE ROW LEVEL SECURITY';
    EXECUTE 'CREATE POLICY "remediation_org_select" ON "remediationTasks" FOR SELECT USING ("organizationId" = ANY(public.user_org_ids()))';
    EXECUTE 'CREATE POLICY "remediation_org_insert" ON "remediationTasks" FOR INSERT WITH CHECK ("organizationId" = ANY(public.user_org_ids()))';
    EXECUTE 'CREATE POLICY "remediation_org_update" ON "remediationTasks" FOR UPDATE USING ("organizationId" = ANY(public.user_org_ids()))';
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'riskregister' AND relkind = 'r') THEN
    EXECUTE 'ALTER TABLE "riskRegister" ENABLE ROW LEVEL SECURITY';
    EXECUTE 'CREATE POLICY "risk_org_select" ON "riskRegister" FOR SELECT USING ("organizationId" = ANY(public.user_org_ids()))';
    EXECUTE 'CREATE POLICY "risk_org_insert" ON "riskRegister" FOR INSERT WITH CHECK ("organizationId" = ANY(public.user_org_ids()))';
    EXECUTE 'CREATE POLICY "risk_org_update" ON "riskRegister" FOR UPDATE USING ("organizationId" = ANY(public.user_org_ids()))';
  END IF;
END $$;

-- Service role policies (applied for all tables when they exist)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'compliancepolicies' AND relkind = 'r') THEN
    EXECUTE 'CREATE POLICY "service_role_policies" ON "compliancePolicies" FOR ALL USING (current_role = ''service_role'')';
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'complianceincidents' AND relkind = 'r') THEN
    EXECUTE 'CREATE POLICY "service_role_incidents" ON "complianceIncidents" FOR ALL USING (current_role = ''service_role'')';
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'remediationtasks' AND relkind = 'r') THEN
    EXECUTE 'CREATE POLICY "service_role_remediation" ON "remediationTasks" FOR ALL USING (current_role = ''service_role'')';
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'riskregister' AND relkind = 'r') THEN
    EXECUTE 'CREATE POLICY "service_role_risk" ON "riskRegister" FOR ALL USING (current_role = ''service_role'')';
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'vendors' AND relkind = 'r') THEN
    EXECUTE 'CREATE POLICY "service_role_vendors" ON "vendors" FOR ALL USING (current_role = ''service_role'')';
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'compliancedeadlines' AND relkind = 'r') THEN
    EXECUTE 'ALTER TABLE "complianceDeadlines" ENABLE ROW LEVEL SECURITY';
    EXECUTE 'CREATE POLICY "service_role_deadlines" ON "complianceDeadlines" FOR ALL USING (current_role = ''service_role'')';
  END IF;
END $$;
