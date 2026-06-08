-- ═══════════════════════════════════════════════════════════════════════════════
-- DJAC SaaS - Remaining Enums & Tables (Drizzle ORM schema)
-- ═══════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════════
-- MISSING ENUMS
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$ BEGIN CREATE TYPE "accessRequestStatus" AS ENUM('new','reviewing','approved','archived'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "consultationStatus" AS ENUM('new','in_review','responded','closed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "criticality" AS ENUM('low','medium','high','critical'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "actorType" AS ENUM('visitor','client','admin','system'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "notificationCategory" AS ENUM('registration','consultation','assessment','support','system'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "relationshipType" AS ENUM('overlap','conflict','harmonization','coordination','gap','dependency'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "mappingType" AS ENUM('equivalent','related','conflicting','complementary'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "assessmentStatus" AS ENUM('compliant','partial','non_compliant','unknown'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "jurisdiction" AS ENUM('China','Saudi Arabia','Both','Other'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "orgMemberRole" AS ENUM('owner','admin','compliance_officer','analyst'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "orgMemberStatus" AS ENUM('active','invited','suspended'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "billingEventStatus" AS ENUM('success','failed','pending','refunded'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "taskSeverity" AS ENUM('critical','high','medium','low'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "taskStatus" AS ENUM('open','in_progress','resolved','accepted_risk'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "riskCategory" AS ENUM('operational','legal','technical','financial','reputational'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "treatment" AS ENUM('accept','mitigate','transfer','avoid'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "riskStatus" AS ENUM('open','in_treatment','closed','accepted'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "policyType" AS ENUM('policy','standard','procedure','guideline'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "policyStatus" AS ENUM('draft','under_review','approved','active','retired'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "incidentType" AS ENUM('data_breach','unauthorized_access','policy_violation','system_outage','third_party_breach','other'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "incidentStatus" AS ENUM('open','under_investigation','contained','resolved','closed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "auditType" AS ENUM('internal','external','regulatory','certification'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "auditStatus" AS ENUM('planned','in_progress','completed','cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "recurrence" AS ENUM('none','monthly','quarterly','biannual','annual'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "ctemAssetType" AS ENUM('web_application','api_endpoint','database','cloud_service','network_device','iot_device','data_pipeline','identity_provider','storage_bucket','other'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "region" AS ENUM('China','Saudi Arabia','Cross-border','Other'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "assetStatus" AS ENUM('active','inactive','decommissioned'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "vulnSeverity" AS ENUM('critical','high','medium','low','informational'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "simulationType" AS ENUM('lateral_movement','privilege_escalation','data_exfiltration','ransomware','phishing','api_abuse','supply_chain','ddos','insider_threat','other'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "priorityTier" AS ENUM('critical','high','medium','low'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "runStatus" AS ENUM('queued','running','completed','failed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "triggeredBy" AS ENUM('manual','scheduled','webhook'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "severityImpact" AS ENUM('critical','high','medium','low'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "onboardingStage" AS ENUM('not_started','account_type_selected','org_created','org_joined','jurisdiction_set','completed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "accountIntent" AS ENUM('compliance_professional','legal_advisor','enterprise_admin','consultant','vendor','government','researcher'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "evidenceSourceType" AS ENUM('audit_schedule','policy','risk','gap','remediation','ctem_asset','incident','general'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "dsrRequestType" AS ENUM('access','rectification','erasure','portability','restriction','objection','explanation'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "dsrJurisdiction" AS ENUM('China','Saudi Arabia','Other'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "dsrStatus" AS ENUM('received','in_review','pending_info','completed','rejected','withdrawn'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "dsrPriority" AS ENUM('normal','high','urgent'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "serviceType" AS ENUM('penetration_test','red_team','security_audit','soc_support','incident_response','consulting','phishing_simulation','cloud_security_review','vulnerability_assessment','compliance_gap_assessment'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "servicePriority" AS ENUM('low','medium','high','critical'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "serviceStatus" AS ENUM('draft','submitted','under_review','scoping','approved','in_progress','completed','cancelled','on_hold'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "inventoryAssetType" AS ENUM('server','workstation','network_device','cloud_service','saas_application','database','api_endpoint','iot_device','mobile_device','industrial_ot','web_application','source_code_repo','third_party_service'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "exposure" AS ENUM('internal','vpn_only','partner_only','internet_facing'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "inventoryStatus" AS ENUM('active','decommissioned','under_review','unknown'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "threatCategory" AS ENUM('malware','ransomware','phishing','apt','zero_day','ddos','supply_chain','data_breach','vulnerability','social_engineering','insider_threat','other'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "threatSeverity" AS ENUM('info','low','medium','high','critical'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "tlp" AS ENUM('white','green','amber','red'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "deadlineJurisdiction" AS ENUM('China','Saudi Arabia','Both'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "deadlinePriority" AS ENUM('low','medium','high','critical'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "deadlineStatus" AS ENUM('upcoming','overdue','completed','waived'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- MISSING TABLES
-- ═══════════════════════════════════════════════════════════════════════════════

-- Local Auth Users
CREATE TABLE IF NOT EXISTS "localUsers" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "email" VARCHAR(320) NOT NULL UNIQUE,
  "passwordHash" VARCHAR(72) NOT NULL,
  "userType" "userType" DEFAULT 'visitor' NOT NULL,
  "companyName" VARCHAR(255),
  "jobTitle" VARCHAR(120),
  "industry" VARCHAR(120),
  "complianceResponsibility" TEXT,
  "preferredLocale" "locale" DEFAULT 'en' NOT NULL,
  "status" "userStatus" DEFAULT 'pending' NOT NULL,
  "lastSignedIn" TIMESTAMP,
  "totpSecret" VARCHAR(64),
  "mfaEnabled" INTEGER DEFAULT 0 NOT NULL,
  "mfaBackupCodes" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Access Requests
CREATE TABLE IF NOT EXISTS "accessRequests" (
  "id" SERIAL PRIMARY KEY,
  "fullName" VARCHAR(255) NOT NULL,
  "email" VARCHAR(320) NOT NULL,
  "organizationName" VARCHAR(255) NOT NULL,
  "organizationType" VARCHAR(120),
  "useCase" TEXT,
  "preferredLocale" "locale" DEFAULT 'en' NOT NULL,
  "status" "accessRequestStatus" DEFAULT 'new' NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Consultation Requests
CREATE TABLE IF NOT EXISTS "consultationRequests" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER REFERENCES "users"("id"),
  "contactName" VARCHAR(255) NOT NULL,
  "contactEmail" VARCHAR(320) NOT NULL,
  "organizationName" VARCHAR(255) NOT NULL,
  "topic" VARCHAR(255) NOT NULL,
  "jurisdictions" TEXT,
  "summary" TEXT NOT NULL,
  "vendorName" VARCHAR(255),
  "techStackSummary" TEXT,
  "status" "consultationStatus" DEFAULT 'new' NOT NULL,
  "priority" "priority" DEFAULT 'medium' NOT NULL,
  "assignedAdminUserId" INTEGER REFERENCES "users"("id"),
  "adminResponse" TEXT,
  "respondedAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Activity Events
CREATE TABLE IF NOT EXISTS "activityEvents" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER REFERENCES "users"("id"),
  "localUserId" INTEGER REFERENCES "localUsers"("id"),
  "actorType" "actorType" NOT NULL,
  "actorRole" VARCHAR(64),
  "action" VARCHAR(120) NOT NULL,
  "entityType" VARCHAR(120) NOT NULL,
  "entityId" INTEGER,
  "targetEntity" VARCHAR(255),
  "payload" TEXT,
  "ipHash" VARCHAR(64),
  "metadata" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Framework Relationships
CREATE TABLE IF NOT EXISTS "frameworkRelationships" (
  "id" SERIAL PRIMARY KEY,
  "sourceFrameworkId" INTEGER NOT NULL REFERENCES "frameworks"("id"),
  "targetFrameworkId" INTEGER NOT NULL REFERENCES "frameworks"("id"),
  "relationshipType" "relationshipType" NOT NULL,
  "description" TEXT,
  "severity" "severity",
  "riskLevel" VARCHAR(50),
  "mitigation" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Control Mappings
CREATE TABLE IF NOT EXISTS "controlMappings" (
  "id" SERIAL PRIMARY KEY,
  "sourceControlId" INTEGER NOT NULL REFERENCES "complianceControls"("id"),
  "targetControlId" INTEGER NOT NULL REFERENCES "complianceControls"("id"),
  "mappingType" "mappingType" NOT NULL,
  "alignmentScore" INTEGER,
  "notes" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Vendors
CREATE TABLE IF NOT EXISTS "vendors" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES "users"("id"),
  "organizationId" INTEGER REFERENCES "organizations"("id"),
  "vendorName" VARCHAR(255) NOT NULL,
  "vendorDescription" TEXT,
  "industry" VARCHAR(100),
  "businessRegistrationNumber" VARCHAR(120),
  "headquartersLocation" VARCHAR(120),
  "primaryContactName" VARCHAR(255),
  "primaryContactEmail" VARCHAR(320),
  "primaryContactRole" VARCHAR(120),
  "primaryContactPhone" VARCHAR(64),
  "serviceType" VARCHAR(120),
  "serviceScope" TEXT,
  "hostingEnvironment" VARCHAR(120),
  "operatingCountries" TEXT,
  "cloudProvider" VARCHAR(255),
  "dataLocations" TEXT,
  "regulatoryJurisdictions" TEXT,
  "certifications" TEXT,
  "dataProcessingActivities" TEXT,
  "criticalityLevel" VARCHAR(64),
  "riskTier" VARCHAR(64),
  "thirdPartyDependencies" VARCHAR(64),
  "fourthPartyDependencies" VARCHAR(64),
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Tech Stack Components
CREATE TABLE IF NOT EXISTS "techStackComponents" (
  "id" SERIAL PRIMARY KEY,
  "vendorId" INTEGER NOT NULL REFERENCES "vendors"("id"),
  "componentName" VARCHAR(255) NOT NULL,
  "componentType" VARCHAR(100),
  "technology" VARCHAR(255),
  "description" TEXT,
  "dataHandling" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Vendor Assessments
CREATE TABLE IF NOT EXISTS "vendorAssessments" (
  "id" SERIAL PRIMARY KEY,
  "vendorId" INTEGER NOT NULL REFERENCES "vendors"("id"),
  "frameworkId" INTEGER NOT NULL REFERENCES "frameworks"("id"),
  "assessmentDate" TIMESTAMP DEFAULT NOW() NOT NULL,
  "complianceScore" INTEGER,
  "riskLevel" "severity",
  "status" "assessmentStatus",
  "findings" TEXT,
  "recommendations" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Assessment Gaps
CREATE TABLE IF NOT EXISTS "assessmentGaps" (
  "id" SERIAL PRIMARY KEY,
  "assessmentId" INTEGER NOT NULL REFERENCES "vendorAssessments"("id"),
  "controlId" INTEGER NOT NULL REFERENCES "complianceControls"("id"),
  "gapDescription" TEXT,
  "severity" "severity",
  "remediation" TEXT,
  "estimatedRemediationCost" VARCHAR(100),
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Billing Events
CREATE TABLE IF NOT EXISTS "billingEvents" (
  "id" SERIAL PRIMARY KEY,
  "organizationId" INTEGER NOT NULL REFERENCES "organizations"("id"),
  "subscriptionId" INTEGER REFERENCES "subscriptions"("id"),
  "stripeEventId" VARCHAR(64) UNIQUE,
  "eventType" VARCHAR(120) NOT NULL,
  "status" "billingEventStatus" DEFAULT 'pending' NOT NULL,
  "amountCents" INTEGER,
  "currency" VARCHAR(3) DEFAULT 'USD',
  "description" TEXT,
  "rawPayload" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- API Keys
CREATE TABLE IF NOT EXISTS "apiKeys" (
  "id" SERIAL PRIMARY KEY,
  "organizationId" INTEGER NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "createdByUserId" INTEGER REFERENCES "users"("id"),
  "name" VARCHAR(120) NOT NULL,
  "keyHash" VARCHAR(64) NOT NULL UNIQUE,
  "keyPrefix" VARCHAR(16) NOT NULL,
  "scopes" TEXT,
  "lastUsedAt" TIMESTAMP,
  "expiresAt" TIMESTAMP,
  "revokedAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- User Interaction Logs
CREATE TABLE IF NOT EXISTS "userInteractionLogs" (
  "id" SERIAL PRIMARY KEY,
  "organizationId" INTEGER REFERENCES "organizations"("id"),
  "userId" INTEGER REFERENCES "users"("id"),
  "localUserId" INTEGER REFERENCES "localUsers"("id"),
  "sessionId" VARCHAR(64),
  "context" VARCHAR(120) NOT NULL,
  "action" VARCHAR(120) NOT NULL,
  "entityType" VARCHAR(120),
  "entityId" INTEGER,
  "inputSnapshot" TEXT,
  "outputRef" TEXT,
  "durationMs" INTEGER,
  "ipHash" VARCHAR(64),
  "userAgent" VARCHAR(512),
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Yalla Admin Access Link Nonces
CREATE TABLE IF NOT EXISTS "yallaAdminAccessLinkNonces" (
  "id" SERIAL PRIMARY KEY,
  "nonceHash" VARCHAR(64) NOT NULL UNIQUE,
  "redirectTarget" VARCHAR(255) NOT NULL,
  "expiresAt" TIMESTAMP NOT NULL,
  "consumedAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "consumedByIp" VARCHAR(64) NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Compliance Deadlines
CREATE TABLE IF NOT EXISTS "complianceDeadlines" (
  "id" SERIAL PRIMARY KEY,
  "organizationId" INTEGER REFERENCES "organizations"("id"),
  "frameworkCode" VARCHAR(50) NOT NULL,
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "deadlineDate" TIMESTAMP NOT NULL,
  "jurisdiction" "deadlineJurisdiction" NOT NULL,
  "priority" "deadlinePriority" DEFAULT 'medium' NOT NULL,
  "status" "deadlineStatus" DEFAULT 'upcoming' NOT NULL,
  "notificationsSent" TEXT,
  "assignedToUserId" INTEGER REFERENCES "users"("id"),
  "completedAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Report Shares
CREATE TABLE IF NOT EXISTS "reportShares" (
  "id" SERIAL PRIMARY KEY,
  "token" VARCHAR(64) NOT NULL UNIQUE,
  "jurisdiction" VARCHAR(64) NOT NULL,
  "locale" "locale" DEFAULT 'en' NOT NULL,
  "reportType" VARCHAR(64) NOT NULL,
  "createdByUserId" INTEGER REFERENCES "users"("id"),
  "viewCount" INTEGER DEFAULT 0 NOT NULL,
  "expiresAt" TIMESTAMP NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Remediation Tasks
CREATE TABLE IF NOT EXISTS "remediationTasks" (
  "id" SERIAL PRIMARY KEY,
  "organizationId" INTEGER NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "vendorId" INTEGER,
  "gapCode" VARCHAR(64),
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "severity" "taskSeverity" NOT NULL DEFAULT 'medium',
  "status" "taskStatus" NOT NULL DEFAULT 'open',
  "assignedToUserId" INTEGER,
  "dueDate" TIMESTAMP,
  "notes" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Risk Register
CREATE TABLE IF NOT EXISTS "riskRegister" (
  "id" SERIAL PRIMARY KEY,
  "organizationId" INTEGER NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "category" "riskCategory" NOT NULL DEFAULT 'operational',
  "likelihood" INTEGER NOT NULL DEFAULT 3,
  "impact" INTEGER NOT NULL DEFAULT 3,
  "treatment" "treatment" NOT NULL DEFAULT 'mitigate',
  "status" "riskStatus" NOT NULL DEFAULT 'open',
  "ownerId" INTEGER,
  "vendorId" INTEGER,
  "gapCode" VARCHAR(64),
  "controlReference" VARCHAR(128),
  "reviewDate" TIMESTAMP,
  "notes" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Compliance Policies
CREATE TABLE IF NOT EXISTS "compliancePolicies" (
  "id" SERIAL PRIMARY KEY,
  "organizationId" INTEGER NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "policyCode" VARCHAR(64),
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "policyType" "policyType" NOT NULL DEFAULT 'policy',
  "frameworks" TEXT,
  "controlReferences" TEXT,
  "status" "policyStatus" NOT NULL DEFAULT 'draft',
  "ownerId" INTEGER,
  "reviewCycleMonths" INTEGER DEFAULT 12,
  "lastApprovedAt" TIMESTAMP,
  "nextReviewAt" TIMESTAMP,
  "version" VARCHAR(20) DEFAULT '1.0',
  "documentUrl" VARCHAR(512),
  "notes" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Compliance Incidents
CREATE TABLE IF NOT EXISTS "complianceIncidents" (
  "id" SERIAL PRIMARY KEY,
  "organizationId" INTEGER NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "incidentCode" VARCHAR(64),
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "incidentType" "incidentType" DEFAULT 'other' NOT NULL,
  "severity" "taskSeverity" DEFAULT 'medium' NOT NULL,
  "status" "incidentStatus" DEFAULT 'open' NOT NULL,
  "affectedFrameworks" TEXT,
  "affectedVendorId" INTEGER,
  "affectedDataTypes" TEXT,
  "affectedDataSubjects" INTEGER,
  "reportedById" INTEGER,
  "occurredAt" TIMESTAMP,
  "detectedAt" TIMESTAMP,
  "containedAt" TIMESTAMP,
  "resolvedAt" TIMESTAMP,
  "regulatoryNotificationRequired" INTEGER DEFAULT 0 NOT NULL,
  "regulatoryNotificationSentAt" TIMESTAMP,
  "notificationDeadlineHours" INTEGER DEFAULT 72,
  "rootCause" TEXT,
  "lessonsLearned" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Audit Schedules
CREATE TABLE IF NOT EXISTS "auditSchedules" (
  "id" SERIAL PRIMARY KEY,
  "organizationId" INTEGER NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "auditType" "auditType" DEFAULT 'internal' NOT NULL,
  "scope" TEXT,
  "status" "auditStatus" DEFAULT 'planned' NOT NULL,
  "scheduledDate" TIMESTAMP NOT NULL,
  "completedDate" TIMESTAMP,
  "assignedToId" INTEGER,
  "vendorId" INTEGER,
  "findings" TEXT,
  "recurrence" "recurrence" DEFAULT 'none' NOT NULL,
  "nextOccurrence" TIMESTAMP,
  "notes" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- CTEM Assets
CREATE TABLE IF NOT EXISTS "ctemAssets" (
  "id" SERIAL PRIMARY KEY,
  "organizationId" INTEGER NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "vendorId" INTEGER REFERENCES "vendors"("id") ON DELETE SET NULL,
  "assetName" VARCHAR(255) NOT NULL,
  "assetType" "ctemAssetType" NOT NULL DEFAULT 'other',
  "ipDomain" VARCHAR(255),
  "region" "region" NOT NULL DEFAULT 'Other',
  "isInternetFacing" INTEGER DEFAULT 0 NOT NULL,
  "handlesPersonalData" INTEGER DEFAULT 0 NOT NULL,
  "handlesCriticalData" INTEGER DEFAULT 0 NOT NULL,
  "criticalityScore" INTEGER DEFAULT 5 NOT NULL,
  "status" "assetStatus" DEFAULT 'active' NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- CTEM Vulnerabilities
CREATE TABLE IF NOT EXISTS "ctemVulnerabilities" (
  "id" SERIAL PRIMARY KEY,
  "assetId" INTEGER NOT NULL REFERENCES "ctemAssets"("id") ON DELETE CASCADE,
  "cveId" VARCHAR(64),
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "severity" "vulnSeverity" NOT NULL DEFAULT 'medium',
  "cvssScore" INTEGER DEFAULT 0 NOT NULL,
  "exploitAvailable" INTEGER DEFAULT 0 NOT NULL,
  "isConfirmed" INTEGER DEFAULT 0 NOT NULL,
  "isPatched" INTEGER DEFAULT 0 NOT NULL,
  "discoveredAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "patchedAt" TIMESTAMP,
  "notes" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- CTEM Attack Simulations
CREATE TABLE IF NOT EXISTS "ctemAttackSimulations" (
  "id" SERIAL PRIMARY KEY,
  "assetId" INTEGER NOT NULL REFERENCES "ctemAssets"("id") ON DELETE CASCADE,
  "simulationType" "simulationType" NOT NULL DEFAULT 'other',
  "successProbability" INTEGER DEFAULT 0 NOT NULL,
  "executedAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "outputSummary" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- CTEM Risk Scores
CREATE TABLE IF NOT EXISTS "ctemRiskScores" (
  "id" SERIAL PRIMARY KEY,
  "assetId" INTEGER NOT NULL REFERENCES "ctemAssets"("id") ON DELETE CASCADE,
  "exposureScore" INTEGER DEFAULT 0 NOT NULL,
  "exploitabilityScore" INTEGER DEFAULT 0 NOT NULL,
  "businessImpactScore" INTEGER DEFAULT 0 NOT NULL,
  "finalPriorityScore" INTEGER DEFAULT 0 NOT NULL,
  "priorityTier" "priorityTier" NOT NULL DEFAULT 'low',
  "previousFinalScore" INTEGER,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Continuous Compliance Runs
CREATE TABLE IF NOT EXISTS "continuousComplianceRuns" (
  "id" SERIAL PRIMARY KEY,
  "organizationId" INTEGER NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "vendorId" INTEGER REFERENCES "vendors"("id") ON DELETE SET NULL,
  "runStatus" "runStatus" NOT NULL DEFAULT 'queued',
  "triggeredBy" "triggeredBy" NOT NULL DEFAULT 'manual',
  "aiJobId" VARCHAR(64),
  "assetsScanned" INTEGER DEFAULT 0 NOT NULL,
  "vulnsFound" INTEGER DEFAULT 0 NOT NULL,
  "exploitableVulns" INTEGER DEFAULT 0 NOT NULL,
  "avgPriorityScore" INTEGER DEFAULT 0 NOT NULL,
  "scoreDelta" INTEGER,
  "alertRaised" INTEGER DEFAULT 0 NOT NULL,
  "summary" TEXT,
  "startedAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "completedAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Compliance Exposure Mappings
CREATE TABLE IF NOT EXISTS "complianceExposureMappings" (
  "id" SERIAL PRIMARY KEY,
  "vulnerabilityId" INTEGER NOT NULL REFERENCES "ctemVulnerabilities"("id") ON DELETE CASCADE,
  "frameworkId" INTEGER REFERENCES "frameworks"("id") ON DELETE SET NULL,
  "frameworkCode" VARCHAR(50),
  "controlId" INTEGER REFERENCES "complianceControls"("id") ON DELETE SET NULL,
  "controlCode" VARCHAR(100),
  "mappingReason" TEXT NOT NULL,
  "severityImpact" "severityImpact" NOT NULL DEFAULT 'medium',
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- User Onboarding
CREATE TABLE IF NOT EXISTS "userOnboarding" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER REFERENCES "users"("id") ON DELETE CASCADE,
  "localUserId" INTEGER REFERENCES "localUsers"("id") ON DELETE CASCADE,
  "stage" "onboardingStage" DEFAULT 'not_started' NOT NULL,
  "accountIntent" "accountIntent",
  "selectedLocale" "locale" DEFAULT 'en' NOT NULL,
  "completedAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Role Permissions
CREATE TABLE IF NOT EXISTS "rolePermissions" (
  "id" SERIAL PRIMARY KEY,
  "organizationId" INTEGER NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "userId" INTEGER REFERENCES "users"("id") ON DELETE CASCADE,
  "localUserId" INTEGER REFERENCES "localUsers"("id") ON DELETE CASCADE,
  "module" VARCHAR(120) NOT NULL,
  "canView" INTEGER DEFAULT 0 NOT NULL,
  "canCreate" INTEGER DEFAULT 0 NOT NULL,
  "canEdit" INTEGER DEFAULT 0 NOT NULL,
  "canDelete" INTEGER DEFAULT 0 NOT NULL,
  "canExport" INTEGER DEFAULT 0 NOT NULL,
  "canInvite" INTEGER DEFAULT 0 NOT NULL,
  "grantedByUserId" INTEGER REFERENCES "users"("id"),
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Vendor Shares
CREATE TABLE IF NOT EXISTS "vendorShares" (
  "id" SERIAL PRIMARY KEY,
  "vendorId" INTEGER NOT NULL REFERENCES "vendors"("id") ON DELETE CASCADE,
  "shareToken" VARCHAR(64) NOT NULL UNIQUE,
  "allowedOrgId" INTEGER REFERENCES "organizations"("id") ON DELETE SET NULL,
  "expiresAt" TIMESTAMP,
  "viewCount" INTEGER DEFAULT 0 NOT NULL,
  "createdByUserId" INTEGER REFERENCES "users"("id"),
  "isRevoked" INTEGER DEFAULT 0 NOT NULL,
  "revokedAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Regulator Oversight Targets
CREATE TABLE IF NOT EXISTS "regulatorOversightTargets" (
  "id" SERIAL PRIMARY KEY,
  "regulatorOrgId" INTEGER NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "targetOrgId" INTEGER NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "grantedByAdminId" INTEGER REFERENCES "users"("id"),
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- DSR Requests
CREATE TABLE IF NOT EXISTS "dsrRequests" (
  "id" SERIAL PRIMARY KEY,
  "organizationId" INTEGER NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "requestType" "dsrRequestType" NOT NULL,
  "requesterName" VARCHAR(255) NOT NULL,
  "requesterEmail" VARCHAR(320) NOT NULL,
  "jurisdiction" "dsrJurisdiction" NOT NULL DEFAULT 'Other',
  "status" "dsrStatus" NOT NULL DEFAULT 'received',
  "priority" "dsrPriority" NOT NULL DEFAULT 'normal',
  "description" TEXT,
  "internalNotes" TEXT,
  "respondedAt" TIMESTAMP,
  "resolvedAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Compliance Evidence
CREATE TABLE IF NOT EXISTS "complianceEvidence" (
  "id" SERIAL PRIMARY KEY,
  "organizationId" INTEGER NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "sourceType" "evidenceSourceType" NOT NULL DEFAULT 'general',
  "sourceId" INTEGER,
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "fileUrl" VARCHAR(512),
  "fileType" VARCHAR(64),
  "fileSizeBytes" INTEGER,
  "collectedAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "expiresAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Service Requests
CREATE TABLE IF NOT EXISTS "serviceRequests" (
  "id" SERIAL PRIMARY KEY,
  "organizationId" INTEGER NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "serviceType" "serviceType" NOT NULL,
  "priority" "servicePriority" NOT NULL DEFAULT 'medium',
  "status" "serviceStatus" NOT NULL DEFAULT 'draft',
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "scope" TEXT,
  "frameworks" TEXT,
  "assignedToId" INTEGER,
  "requestedById" INTEGER,
  "vendorId" INTEGER,
  "scheduledDate" TIMESTAMP,
  "completedDate" TIMESTAMP,
  "findings" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Asset Inventory
CREATE TABLE IF NOT EXISTS "assetInventory" (
  "id" SERIAL PRIMARY KEY,
  "organizationId" INTEGER NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "assetType" "inventoryAssetType" NOT NULL,
  "assetName" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "ownerId" INTEGER,
  "location" VARCHAR(255),
  "ipAddress" VARCHAR(64),
  "exposure" "exposure" DEFAULT 'internal' NOT NULL,
  "status" "inventoryStatus" DEFAULT 'active' NOT NULL,
  "criticality" "criticality" DEFAULT 'medium' NOT NULL,
  "complianceFrameworks" TEXT,
  "department" VARCHAR(120),
  "vendorId" INTEGER,
  "purchaseDate" TIMESTAMP,
  "eolDate" TIMESTAMP,
  "notes" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Security Maturity Assessments
CREATE TABLE IF NOT EXISTS "securityMaturityAssessments" (
  "id" SERIAL PRIMARY KEY,
  "organizationId" INTEGER NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "domain" VARCHAR(120) NOT NULL,
  "maturityLevel" "maturityLevel" NOT NULL DEFAULT 'initial',
  "score" INTEGER DEFAULT 0 NOT NULL,
  "findings" TEXT,
  "recommendations" TEXT,
  "notes" TEXT,
  "assessedAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Threat Intel Items
CREATE TABLE IF NOT EXISTS "threatIntelItems" (
  "id" SERIAL PRIMARY KEY,
  "organizationId" INTEGER NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "category" "threatCategory" NOT NULL DEFAULT 'other',
  "severity" "threatSeverity" NOT NULL DEFAULT 'medium',
  "tlp" "tlp" NOT NULL DEFAULT 'amber',
  "source" VARCHAR(255),
  "indicators" TEXT,
  "mitreAttackId" VARCHAR(64),
  "affectedAssets" TEXT,
  "recommendedActions" TEXT,
  "isActionable" INTEGER DEFAULT 0 NOT NULL,
  "publishedAt" TIMESTAMP,
  "expiresAt" TIMESTAMP,
  "notes" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- EXTRA INDEXES
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_vendors_org ON "vendors"("organizationId");
CREATE INDEX IF NOT EXISTS idx_vendors_user ON "vendors"("userId");
CREATE INDEX IF NOT EXISTS idx_incidents_org ON "complianceIncidents"("organizationId");
CREATE INDEX IF NOT EXISTS idx_policies_org ON "compliancePolicies"("organizationId");
CREATE INDEX IF NOT EXISTS idx_remediation_org ON "remediationTasks"("organizationId");
CREATE INDEX IF NOT EXISTS idx_risk_org ON "riskRegister"("organizationId");
CREATE INDEX IF NOT EXISTS idx_ctem_assets_org ON "ctemAssets"("organizationId");
CREATE INDEX IF NOT EXISTS idx_ctem_vulns_asset ON "ctemVulnerabilities"("assetId");
CREATE INDEX IF NOT EXISTS idx_dsr_org ON "dsrRequests"("organizationId");
CREATE INDEX IF NOT EXISTS idx_evidence_org ON "complianceEvidence"("organizationId");
CREATE INDEX IF NOT EXISTS idx_service_requests_org ON "serviceRequests"("organizationId");
CREATE INDEX IF NOT EXISTS idx_asset_inventory_org ON "assetInventory"("organizationId");
CREATE INDEX IF NOT EXISTS idx_threat_intel_org ON "threatIntelItems"("organizationId");
CREATE INDEX IF NOT EXISTS idx_deadlines_org ON "complianceDeadlines"("organizationId");
CREATE INDEX IF NOT EXISTS idx_api_keys_org ON "apiKeys"("organizationId");

-- ═══════════════════════════════════════════════════════════════════════════════
-- RLS ON NEW TABLES
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE "vendors" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "vendorAssessments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "compliancePolicies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "complianceIncidents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "remediationTasks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "riskRegister" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "auditSchedules" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "dsrRequests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "complianceEvidence" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ctemAssets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ctemVulnerabilities" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "apiKeys" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "complianceDeadlines" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "serviceRequests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "assetInventory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "securityMaturityAssessments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "threatIntelItems" ENABLE ROW LEVEL SECURITY;
