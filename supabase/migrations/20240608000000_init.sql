-- ═══════════════════════════════════════════════════════════════════════════════
-- DJAC SaaS - Initial Schema
-- ═══════════════════════════════════════════════════════════════════════════════

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- ═══════════════════════════════════════════════════════════════════════════════
-- ENUMS
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$ BEGIN
  CREATE TYPE "userType" AS ENUM ('visitor', 'professional', 'admin', 'basic_user', 'professional_user', 'company_admin', 'platform_admin', 'yalla_hack_employee', 'super_admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "locale" AS ENUM ('en', 'ar', 'zh');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "userStatus" AS ENUM ('active', 'pending', 'suspended');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "role" AS ENUM ('user', 'admin', 'basic_user', 'professional_user', 'company_admin', 'platform_admin', 'yalla_hack_employee', 'super_admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "userOAuthStatus" AS ENUM ('active', 'invited', 'suspended');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "organizationRole" AS ENUM ('owner', 'admin', 'compliance_officer', 'analyst');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "membershipStatus" AS ENUM ('active', 'invited', 'suspended');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "plan" AS ENUM ('free_trial', 'starter', 'professional', 'enterprise');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "paidPlan" AS ENUM ('starter', 'professional', 'enterprise');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "billingInterval" AS ENUM ('monthly', 'quarterly', 'biannual', 'annual');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "subscriptionStatus" AS ENUM ('trialing', 'active', 'past_due', 'canceled', 'incomplete', 'paused');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "reportStatus" AS ENUM ('generating', 'ready', 'failed', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "reportType" AS ENUM ('full_compliance', 'gap_analysis', 'vendor_assessment', 'risk_assessment', 'executive_summary', 'regulatory_deadline');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "auditLogCategory" AS ENUM ('auth', 'data_write', 'data_read', 'role_change', 'system', 'billing');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "auditLogOutcome" AS ENUM ('success', 'failure', 'blocked');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "priority" AS ENUM ('low', 'medium', 'high');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "severity" AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "maturityLevel" AS ENUM ('initial', 'developing', 'defined', 'managed', 'optimized');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- TABLES (all identifiers quoted to match Drizzle ORM schema)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS "users" (
  "id" SERIAL PRIMARY KEY,
  "openId" VARCHAR(64) NOT NULL UNIQUE,
  "name" TEXT,
  "email" VARCHAR(320),
  "loginMethod" VARCHAR(64),
  "organizationName" VARCHAR(255),
  "organizationType" VARCHAR(120),
  "jobTitle" VARCHAR(120),
  "preferredLocale" "locale" DEFAULT 'en' NOT NULL,
  "role" "role" DEFAULT 'user' NOT NULL,
  "status" "userOAuthStatus" DEFAULT 'active' NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "lastSignedIn" TIMESTAMP DEFAULT NOW() NOT NULL,
  "lastActivityAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS "organizations" (
  "id" SERIAL PRIMARY KEY,
  "slug" VARCHAR(100) NOT NULL UNIQUE,
  "name" VARCHAR(255) NOT NULL,
  "billingEmail" VARCHAR(320) NOT NULL,
  "industry" VARCHAR(120),
  "primaryJurisdiction" VARCHAR(20) DEFAULT 'Both',
  "stripeCustomerId" VARCHAR(64),
  "plan" "plan" DEFAULT 'free_trial' NOT NULL,
  "trialStartedAt" TIMESTAMP,
  "trialEndsAt" TIMESTAMP,
  "isActive" INTEGER DEFAULT 1 NOT NULL,
  "maxSeats" INTEGER DEFAULT 5 NOT NULL,
  "metadata" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS "organizationMembers" (
  "id" SERIAL PRIMARY KEY,
  "organizationId" INTEGER NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "userId" INTEGER REFERENCES "users"("id"),
  "role" "organizationRole" DEFAULT 'analyst' NOT NULL,
  "inviteEmail" VARCHAR(320),
  "inviteToken" VARCHAR(64),
  "status" "membershipStatus" DEFAULT 'active' NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS "subscriptions" (
  "id" SERIAL PRIMARY KEY,
  "organizationId" INTEGER NOT NULL REFERENCES "organizations"("id"),
  "stripeSubscriptionId" VARCHAR(64) UNIQUE,
  "stripePriceId" VARCHAR(64),
  "plan" "paidPlan" NOT NULL,
  "billingInterval" "billingInterval" NOT NULL,
  "amountCents" INTEGER NOT NULL,
  "currency" VARCHAR(3) DEFAULT 'USD' NOT NULL,
  "status" "subscriptionStatus" DEFAULT 'trialing' NOT NULL,
  "currentPeriodStart" TIMESTAMP,
  "currentPeriodEnd" TIMESTAMP,
  "cancelAtPeriodEnd" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS "frameworks" (
  "id" SERIAL PRIMARY KEY,
  "code" VARCHAR(50) NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "country" VARCHAR(50) NOT NULL,
  "description" TEXT,
  "scope" TEXT,
  "enforcementAuthority" VARCHAR(255),
  "maxPenalty" VARCHAR(255),
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS "complianceControls" (
  "id" SERIAL PRIMARY KEY,
  "frameworkId" INTEGER NOT NULL REFERENCES "frameworks"("id"),
  "controlCode" VARCHAR(100) NOT NULL,
  "controlName" TEXT NOT NULL,
  "category" VARCHAR(100),
  "description" TEXT,
  "requirement" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS "auditLogs" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER REFERENCES "users"("id"),
  "organizationId" INTEGER REFERENCES "organizations"("id"),
  "actorRole" VARCHAR(64),
  "category" "auditLogCategory" NOT NULL,
  "action" VARCHAR(120) NOT NULL,
  "entityType" VARCHAR(120),
  "entityId" INTEGER,
  "targetEntity" VARCHAR(255),
  "outcome" "auditLogOutcome" DEFAULT 'success' NOT NULL,
  "payload" TEXT,
  "ipHash" VARCHAR(64),
  "userAgent" VARCHAR(512),
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS "complianceReports" (
  "id" SERIAL PRIMARY KEY,
  "organizationId" INTEGER NOT NULL REFERENCES "organizations"("id"),
  "generatedByUserId" INTEGER REFERENCES "users"("id"),
  "title" VARCHAR(255) NOT NULL,
  "reportType" "reportType" NOT NULL,
  "frameworks" TEXT NOT NULL,
  "overallScore" INTEGER,
  "riskLevel" "severity",
  "reportBody" TEXT NOT NULL,
  "reportUrl" VARCHAR(512),
  "status" "reportStatus" DEFAULT 'generating' NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS "adminNotifications" (
  "id" SERIAL PRIMARY KEY,
  "category" VARCHAR(50) NOT NULL,
  "title" VARCHAR(255) NOT NULL,
  "content" TEXT,
  "entityType" VARCHAR(120),
  "entityId" INTEGER,
  "isRead" INTEGER DEFAULT 0 NOT NULL,
  "readAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_users_openid ON "users"("openId");
CREATE INDEX IF NOT EXISTS idx_users_email ON "users"("email");
CREATE INDEX IF NOT EXISTS idx_orgmembers_orgid ON "organizationMembers"("organizationId");
CREATE INDEX IF NOT EXISTS idx_orgmembers_userid ON "organizationMembers"("userId");
CREATE INDEX IF NOT EXISTS idx_subscriptions_orgid ON "subscriptions"("organizationId");
CREATE INDEX IF NOT EXISTS idx_auditlogs_orgid ON "auditLogs"("organizationId");
CREATE INDEX IF NOT EXISTS idx_auditlogs_createdat ON "auditLogs"("createdAt");
CREATE INDEX IF NOT EXISTS idx_frameworks_code ON "frameworks"("code");
CREATE INDEX IF NOT EXISTS idx_reports_orgid ON "complianceReports"("organizationId");
CREATE INDEX IF NOT EXISTS idx_notifications_category ON "adminNotifications"("category");

-- ═══════════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "organizations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "organizationMembers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "subscriptions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "frameworks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "complianceControls" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "auditLogs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "complianceReports" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "adminNotifications" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_view_own" ON "users"
  FOR SELECT USING ("openId" = current_user OR auth.uid()::text = "openId");

CREATE POLICY "org_members_view" ON "organizations"
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM "organizationMembers" WHERE "organizationId" = "organizations"."id" AND "userId" IN (SELECT "id" FROM "users" WHERE "openId" = auth.uid()::text))
  );

CREATE POLICY "org_admins_insert" ON "organizations"
  FOR INSERT WITH CHECK (true);

CREATE POLICY "audit_logs_org_view" ON "auditLogs"
  FOR SELECT USING (
    "organizationId" IS NULL OR
    EXISTS (SELECT 1 FROM "organizationMembers" WHERE "organizationId" = "auditLogs"."organizationId" AND "userId" IN (SELECT "id" FROM "users" WHERE "openId" = auth.uid()::text))
  );

CREATE POLICY "reports_org_view" ON "complianceReports"
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM "organizationMembers" WHERE "organizationId" = "complianceReports"."organizationId" AND "userId" IN (SELECT "id" FROM "users" WHERE "openId" = auth.uid()::text))
  );

CREATE POLICY "service_role_all" ON "users"
  FOR ALL USING (current_role = 'service_role');

CREATE POLICY "service_role_all_orgs" ON "organizations"
  FOR ALL USING (current_role = 'service_role');

CREATE POLICY "service_role_all_members" ON "organizationMembers"
  FOR ALL USING (current_role = 'service_role');
