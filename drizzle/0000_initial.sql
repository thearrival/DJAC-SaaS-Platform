CREATE TYPE "public"."accessRequestStatus" AS ENUM('new', 'reviewing', 'approved', 'archived');--> statement-breakpoint
CREATE TYPE "public"."accountIntent" AS ENUM('compliance_professional', 'legal_advisor', 'enterprise_admin', 'consultant', 'vendor', 'government', 'researcher');--> statement-breakpoint
CREATE TYPE "public"."actorType" AS ENUM('visitor', 'client', 'admin', 'system');--> statement-breakpoint
CREATE TYPE "public"."assessmentStatus" AS ENUM('compliant', 'partial', 'non_compliant', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."assetStatus" AS ENUM('active', 'inactive', 'decommissioned');--> statement-breakpoint
CREATE TYPE "public"."auditLogCategory" AS ENUM('auth', 'data_write', 'data_read', 'role_change', 'system', 'billing');--> statement-breakpoint
CREATE TYPE "public"."auditLogOutcome" AS ENUM('success', 'failure', 'blocked');--> statement-breakpoint
CREATE TYPE "public"."auditStatus" AS ENUM('planned', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."auditType" AS ENUM('internal', 'external', 'regulatory', 'certification');--> statement-breakpoint
CREATE TYPE "public"."billingEventStatus" AS ENUM('success', 'failed', 'pending', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."billingInterval" AS ENUM('monthly', 'quarterly', 'biannual', 'annual');--> statement-breakpoint
CREATE TYPE "public"."consultationStatus" AS ENUM('new', 'in_review', 'responded', 'closed');--> statement-breakpoint
CREATE TYPE "public"."criticality" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."ctemAssetType" AS ENUM('web_application', 'api_endpoint', 'database', 'cloud_service', 'network_device', 'iot_device', 'data_pipeline', 'identity_provider', 'storage_bucket', 'other');--> statement-breakpoint
CREATE TYPE "public"."deadlineJurisdiction" AS ENUM('China', 'Saudi Arabia', 'Both');--> statement-breakpoint
CREATE TYPE "public"."deadlinePriority" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."deadlineStatus" AS ENUM('upcoming', 'overdue', 'completed', 'waived');--> statement-breakpoint
CREATE TYPE "public"."dsrJurisdiction" AS ENUM('China', 'Saudi Arabia', 'Other');--> statement-breakpoint
CREATE TYPE "public"."dsrPriority" AS ENUM('normal', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."dsrRequestType" AS ENUM('access', 'rectification', 'erasure', 'portability', 'restriction', 'objection', 'explanation');--> statement-breakpoint
CREATE TYPE "public"."dsrStatus" AS ENUM('received', 'in_review', 'pending_info', 'completed', 'rejected', 'withdrawn');--> statement-breakpoint
CREATE TYPE "public"."evidenceSourceType" AS ENUM('audit_schedule', 'policy', 'risk', 'gap', 'remediation', 'ctem_asset', 'incident', 'general');--> statement-breakpoint
CREATE TYPE "public"."exposure" AS ENUM('internal', 'vpn_only', 'partner_only', 'internet_facing');--> statement-breakpoint
CREATE TYPE "public"."incidentStatus" AS ENUM('open', 'under_investigation', 'contained', 'resolved', 'closed');--> statement-breakpoint
CREATE TYPE "public"."incidentType" AS ENUM('data_breach', 'unauthorized_access', 'policy_violation', 'system_outage', 'third_party_breach', 'other');--> statement-breakpoint
CREATE TYPE "public"."inventoryAssetType" AS ENUM('server', 'workstation', 'network_device', 'cloud_service', 'saas_application', 'database', 'api_endpoint', 'iot_device', 'mobile_device', 'industrial_ot', 'web_application', 'source_code_repo', 'third_party_service');--> statement-breakpoint
CREATE TYPE "public"."inventoryStatus" AS ENUM('active', 'decommissioned', 'under_review', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."jurisdiction" AS ENUM('China', 'Saudi Arabia', 'Both', 'Other');--> statement-breakpoint
CREATE TYPE "public"."locale" AS ENUM('en', 'ar', 'zh');--> statement-breakpoint
CREATE TYPE "public"."mappingType" AS ENUM('equivalent', 'related', 'conflicting', 'complementary');--> statement-breakpoint
CREATE TYPE "public"."maturityLevel" AS ENUM('initial', 'developing', 'defined', 'managed', 'optimized');--> statement-breakpoint
CREATE TYPE "public"."notificationCategory" AS ENUM('registration', 'consultation', 'assessment', 'support', 'system');--> statement-breakpoint
CREATE TYPE "public"."onboardingStage" AS ENUM('not_started', 'account_type_selected', 'org_created', 'org_joined', 'jurisdiction_set', 'completed');--> statement-breakpoint
CREATE TYPE "public"."orgMemberRole" AS ENUM('owner', 'admin', 'compliance_officer', 'analyst');--> statement-breakpoint
CREATE TYPE "public"."orgMemberStatus" AS ENUM('active', 'invited', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."paidPlan" AS ENUM('starter', 'professional', 'enterprise');--> statement-breakpoint
CREATE TYPE "public"."plan" AS ENUM('free_trial', 'starter', 'professional', 'enterprise');--> statement-breakpoint
CREATE TYPE "public"."policyStatus" AS ENUM('draft', 'under_review', 'approved', 'active', 'retired');--> statement-breakpoint
CREATE TYPE "public"."policyType" AS ENUM('policy', 'standard', 'procedure', 'guideline');--> statement-breakpoint
CREATE TYPE "public"."priority" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."priorityTier" AS ENUM('critical', 'high', 'medium', 'low');--> statement-breakpoint
CREATE TYPE "public"."recurrence" AS ENUM('none', 'monthly', 'quarterly', 'biannual', 'annual');--> statement-breakpoint
CREATE TYPE "public"."region" AS ENUM('China', 'Saudi Arabia', 'Cross-border', 'Other');--> statement-breakpoint
CREATE TYPE "public"."relationshipType" AS ENUM('overlap', 'conflict', 'harmonization', 'coordination', 'gap', 'dependency');--> statement-breakpoint
CREATE TYPE "public"."reportStatus" AS ENUM('generating', 'ready', 'failed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."reportType" AS ENUM('full_compliance', 'gap_analysis', 'vendor_assessment', 'risk_assessment', 'executive_summary', 'regulatory_deadline');--> statement-breakpoint
CREATE TYPE "public"."riskCategory" AS ENUM('operational', 'legal', 'technical', 'financial', 'reputational');--> statement-breakpoint
CREATE TYPE "public"."riskStatus" AS ENUM('open', 'in_treatment', 'closed', 'accepted');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'admin', 'basic_user', 'professional_user', 'company_admin', 'platform_admin', 'yalla_hack_employee', 'super_admin');--> statement-breakpoint
CREATE TYPE "public"."runStatus" AS ENUM('queued', 'running', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."servicePriority" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."serviceStatus" AS ENUM('draft', 'submitted', 'under_review', 'scoping', 'approved', 'in_progress', 'completed', 'cancelled', 'on_hold');--> statement-breakpoint
CREATE TYPE "public"."serviceType" AS ENUM('penetration_test', 'red_team', 'security_audit', 'soc_support', 'incident_response', 'consulting', 'phishing_simulation', 'cloud_security_review', 'vulnerability_assessment', 'compliance_gap_assessment');--> statement-breakpoint
CREATE TYPE "public"."severity" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."severityImpact" AS ENUM('critical', 'high', 'medium', 'low');--> statement-breakpoint
CREATE TYPE "public"."simulationType" AS ENUM('lateral_movement', 'privilege_escalation', 'data_exfiltration', 'ransomware', 'phishing', 'api_abuse', 'supply_chain', 'ddos', 'insider_threat', 'other');--> statement-breakpoint
CREATE TYPE "public"."subscriptionStatus" AS ENUM('trialing', 'active', 'past_due', 'canceled', 'incomplete', 'paused');--> statement-breakpoint
CREATE TYPE "public"."taskSeverity" AS ENUM('critical', 'high', 'medium', 'low');--> statement-breakpoint
CREATE TYPE "public"."taskStatus" AS ENUM('open', 'in_progress', 'resolved', 'accepted_risk');--> statement-breakpoint
CREATE TYPE "public"."threatCategory" AS ENUM('malware', 'ransomware', 'phishing', 'apt', 'zero_day', 'ddos', 'supply_chain', 'data_breach', 'vulnerability', 'social_engineering', 'insider_threat', 'other');--> statement-breakpoint
CREATE TYPE "public"."threatSeverity" AS ENUM('info', 'low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."tlp" AS ENUM('white', 'green', 'amber', 'red');--> statement-breakpoint
CREATE TYPE "public"."treatment" AS ENUM('accept', 'mitigate', 'transfer', 'avoid');--> statement-breakpoint
CREATE TYPE "public"."triggeredBy" AS ENUM('manual', 'scheduled', 'webhook');--> statement-breakpoint
CREATE TYPE "public"."userOAuthStatus" AS ENUM('active', 'invited', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."userStatus" AS ENUM('active', 'pending', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."userType" AS ENUM('visitor', 'professional', 'admin', 'basic_user', 'professional_user', 'company_admin', 'platform_admin', 'yalla_hack_employee', 'super_admin');--> statement-breakpoint
CREATE TYPE "public"."vulnSeverity" AS ENUM('critical', 'high', 'medium', 'low', 'informational');--> statement-breakpoint
CREATE TABLE "accessRequests" (
	"id" serial PRIMARY KEY NOT NULL,
	"fullName" varchar(255) NOT NULL,
	"email" varchar(320) NOT NULL,
	"organizationName" varchar(255) NOT NULL,
	"organizationType" varchar(120),
	"useCase" text,
	"preferredLocale" "locale" DEFAULT 'en' NOT NULL,
	"status" "accessRequestStatus" DEFAULT 'new' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activityEvents" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer,
	"localUserId" integer,
	"actorType" "actorType" NOT NULL,
	"actorRole" varchar(64),
	"action" varchar(120) NOT NULL,
	"entityType" varchar(120) NOT NULL,
	"entityId" integer,
	"targetEntity" varchar(255),
	"payload" text,
	"ipHash" varchar(64),
	"metadata" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "adminNotifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"category" "notificationCategory" NOT NULL,
	"title" varchar(255) NOT NULL,
	"content" text,
	"entityType" varchar(120),
	"entityId" integer,
	"isRead" integer DEFAULT 0 NOT NULL,
	"readAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "apiKeys" (
	"id" serial PRIMARY KEY NOT NULL,
	"organizationId" integer NOT NULL,
	"createdByUserId" integer,
	"name" varchar(120) NOT NULL,
	"keyHash" varchar(64) NOT NULL,
	"keyPrefix" varchar(16) NOT NULL,
	"scopes" text,
	"lastUsedAt" timestamp,
	"expiresAt" timestamp,
	"revokedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "apiKeys_keyHash_unique" UNIQUE("keyHash")
);
--> statement-breakpoint
CREATE TABLE "assessmentGaps" (
	"id" serial PRIMARY KEY NOT NULL,
	"assessmentId" integer NOT NULL,
	"controlId" integer NOT NULL,
	"gapDescription" text,
	"severity" "severity",
	"remediation" text,
	"estimatedRemediationCost" varchar(100),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assetInventory" (
	"id" serial PRIMARY KEY NOT NULL,
	"organizationId" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"assetType" "inventoryAssetType" NOT NULL,
	"identifier" varchar(512),
	"owner" varchar(255),
	"location" varchar(255),
	"criticality" "criticality" DEFAULT 'medium' NOT NULL,
	"exposure" "exposure" DEFAULT 'internal' NOT NULL,
	"status" "inventoryStatus" DEFAULT 'active' NOT NULL,
	"riskScore" integer DEFAULT 0 NOT NULL,
	"platform" varchar(120),
	"version" varchar(120),
	"lastScannedAt" timestamp,
	"openVulnCount" integer DEFAULT 0 NOT NULL,
	"tags" varchar(512),
	"notes" text,
	"addedByUserId" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auditLogs" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer,
	"localUserId" integer,
	"organizationId" integer,
	"actorRole" varchar(64),
	"category" "auditLogCategory" NOT NULL,
	"action" varchar(120) NOT NULL,
	"entityType" varchar(120),
	"entityId" integer,
	"targetEntity" varchar(255),
	"outcome" "auditLogOutcome" DEFAULT 'success' NOT NULL,
	"payload" text,
	"ipHash" varchar(64),
	"userAgent" varchar(512),
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auditSchedules" (
	"id" serial PRIMARY KEY NOT NULL,
	"organizationId" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"auditType" "auditType" DEFAULT 'internal' NOT NULL,
	"scope" text,
	"status" "auditStatus" DEFAULT 'planned' NOT NULL,
	"scheduledDate" timestamp NOT NULL,
	"completedDate" timestamp,
	"assignedToId" integer,
	"vendorId" integer,
	"findings" text,
	"recurrence" "recurrence" DEFAULT 'none' NOT NULL,
	"nextOccurrence" timestamp,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "billingEvents" (
	"id" serial PRIMARY KEY NOT NULL,
	"organizationId" integer NOT NULL,
	"subscriptionId" integer,
	"stripeEventId" varchar(64),
	"eventType" varchar(120) NOT NULL,
	"status" "billingEventStatus" DEFAULT 'pending' NOT NULL,
	"amountCents" integer,
	"currency" varchar(3) DEFAULT 'USD',
	"description" text,
	"rawPayload" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "billingEvents_stripeEventId_unique" UNIQUE("stripeEventId")
);
--> statement-breakpoint
CREATE TABLE "complianceControls" (
	"id" serial PRIMARY KEY NOT NULL,
	"frameworkId" integer NOT NULL,
	"controlCode" varchar(100) NOT NULL,
	"controlName" text NOT NULL,
	"category" varchar(100),
	"description" text,
	"requirement" text,
	"applicability" varchar(255),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "complianceDeadlines" (
	"id" serial PRIMARY KEY NOT NULL,
	"organizationId" integer,
	"frameworkCode" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"deadlineDate" timestamp NOT NULL,
	"jurisdiction" "deadlineJurisdiction" NOT NULL,
	"priority" "deadlinePriority" DEFAULT 'medium' NOT NULL,
	"status" "deadlineStatus" DEFAULT 'upcoming' NOT NULL,
	"notificationsSent" text,
	"assignedToUserId" integer,
	"completedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "complianceEvidence" (
	"id" serial PRIMARY KEY NOT NULL,
	"organizationId" integer NOT NULL,
	"sourceType" "evidenceSourceType" DEFAULT 'general' NOT NULL,
	"sourceId" integer,
	"title" varchar(255) NOT NULL,
	"url" varchar(1024) NOT NULL,
	"description" text,
	"addedByUserId" integer,
	"tags" varchar(512),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "complianceExposureMappings" (
	"id" serial PRIMARY KEY NOT NULL,
	"vulnerabilityId" integer NOT NULL,
	"frameworkId" integer,
	"frameworkCode" varchar(50),
	"controlId" integer,
	"controlCode" varchar(100),
	"mappingReason" text NOT NULL,
	"severityImpact" "severityImpact" DEFAULT 'medium' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "complianceIncidents" (
	"id" serial PRIMARY KEY NOT NULL,
	"organizationId" integer NOT NULL,
	"incidentCode" varchar(64),
	"title" varchar(255) NOT NULL,
	"description" text,
	"incidentType" "incidentType" DEFAULT 'other' NOT NULL,
	"severity" "taskSeverity" DEFAULT 'medium' NOT NULL,
	"status" "incidentStatus" DEFAULT 'open' NOT NULL,
	"affectedFrameworks" text,
	"affectedVendorId" integer,
	"affectedDataTypes" text,
	"affectedDataSubjects" integer,
	"reportedById" integer,
	"occurredAt" timestamp,
	"detectedAt" timestamp,
	"containedAt" timestamp,
	"resolvedAt" timestamp,
	"regulatoryNotificationRequired" integer DEFAULT 0 NOT NULL,
	"regulatoryNotificationSentAt" timestamp,
	"notificationDeadlineHours" integer DEFAULT 72,
	"rootCause" text,
	"lessonsLearned" text,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "compliancePolicies" (
	"id" serial PRIMARY KEY NOT NULL,
	"organizationId" integer NOT NULL,
	"policyCode" varchar(64),
	"title" varchar(255) NOT NULL,
	"description" text,
	"policyType" "policyType" DEFAULT 'policy' NOT NULL,
	"frameworks" text,
	"controlReferences" text,
	"status" "policyStatus" DEFAULT 'draft' NOT NULL,
	"ownerId" integer,
	"reviewCycleMonths" integer DEFAULT 12,
	"lastApprovedAt" timestamp,
	"nextReviewAt" timestamp,
	"version" varchar(20) DEFAULT '1.0',
	"documentUrl" varchar(512),
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "complianceReports" (
	"id" serial PRIMARY KEY NOT NULL,
	"organizationId" integer NOT NULL,
	"generatedByUserId" integer,
	"generatedByLocalUserId" integer,
	"title" varchar(255) NOT NULL,
	"reportType" "reportType" NOT NULL,
	"frameworks" text NOT NULL,
	"aiJobId" varchar(64),
	"version" integer DEFAULT 1 NOT NULL,
	"overallScore" integer,
	"riskLevel" "severity",
	"reportBody" text NOT NULL,
	"exportedAt" timestamp,
	"exportedPdfUrl" varchar(512),
	"status" "reportStatus" DEFAULT 'generating' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consultationRequests" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer,
	"contactName" varchar(255) NOT NULL,
	"contactEmail" varchar(320) NOT NULL,
	"organizationName" varchar(255) NOT NULL,
	"topic" varchar(255) NOT NULL,
	"jurisdictions" text,
	"summary" text NOT NULL,
	"vendorName" varchar(255),
	"techStackSummary" text,
	"status" "consultationStatus" DEFAULT 'new' NOT NULL,
	"priority" "priority" DEFAULT 'medium' NOT NULL,
	"assignedAdminUserId" integer,
	"adminResponse" text,
	"respondedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "continuousComplianceRuns" (
	"id" serial PRIMARY KEY NOT NULL,
	"organizationId" integer NOT NULL,
	"vendorId" integer,
	"runStatus" "runStatus" DEFAULT 'queued' NOT NULL,
	"triggeredBy" "triggeredBy" DEFAULT 'manual' NOT NULL,
	"aiJobId" varchar(64),
	"assetsScanned" integer DEFAULT 0 NOT NULL,
	"vulnsFound" integer DEFAULT 0 NOT NULL,
	"exploitableVulns" integer DEFAULT 0 NOT NULL,
	"avgPriorityScore" integer DEFAULT 0 NOT NULL,
	"scoreDelta" integer,
	"alertRaised" integer DEFAULT 0 NOT NULL,
	"summary" text,
	"startedAt" timestamp DEFAULT now() NOT NULL,
	"completedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "controlMappings" (
	"id" serial PRIMARY KEY NOT NULL,
	"sourceControlId" integer NOT NULL,
	"targetControlId" integer NOT NULL,
	"mappingType" "mappingType" NOT NULL,
	"alignmentScore" integer,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ctemAssets" (
	"id" serial PRIMARY KEY NOT NULL,
	"organizationId" integer NOT NULL,
	"vendorId" integer,
	"assetName" varchar(255) NOT NULL,
	"assetType" "ctemAssetType" DEFAULT 'other' NOT NULL,
	"ipDomain" varchar(255),
	"region" "region" DEFAULT 'Other' NOT NULL,
	"isInternetFacing" integer DEFAULT 0 NOT NULL,
	"handlesPersonalData" integer DEFAULT 0 NOT NULL,
	"handlesCriticalData" integer DEFAULT 0 NOT NULL,
	"criticalityScore" integer DEFAULT 5 NOT NULL,
	"status" "assetStatus" DEFAULT 'active' NOT NULL,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ctemAttackSimulations" (
	"id" serial PRIMARY KEY NOT NULL,
	"assetId" integer NOT NULL,
	"simulationType" "simulationType" DEFAULT 'other' NOT NULL,
	"successProbability" integer DEFAULT 0 NOT NULL,
	"executedAt" timestamp DEFAULT now() NOT NULL,
	"outputSummary" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ctemRiskScores" (
	"id" serial PRIMARY KEY NOT NULL,
	"assetId" integer NOT NULL,
	"exposureScore" integer DEFAULT 0 NOT NULL,
	"exploitabilityScore" integer DEFAULT 0 NOT NULL,
	"businessImpactScore" integer DEFAULT 0 NOT NULL,
	"finalPriorityScore" integer DEFAULT 0 NOT NULL,
	"priorityTier" "priorityTier" DEFAULT 'low' NOT NULL,
	"previousFinalScore" integer,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ctemVulnerabilities" (
	"id" serial PRIMARY KEY NOT NULL,
	"assetId" integer NOT NULL,
	"cveId" varchar(64),
	"title" varchar(255) NOT NULL,
	"description" text,
	"severity" "vulnSeverity" DEFAULT 'medium' NOT NULL,
	"cvssScore" integer DEFAULT 0 NOT NULL,
	"exploitAvailable" integer DEFAULT 0 NOT NULL,
	"isConfirmed" integer DEFAULT 0 NOT NULL,
	"isPatched" integer DEFAULT 0 NOT NULL,
	"discoveredAt" timestamp DEFAULT now() NOT NULL,
	"patchedAt" timestamp,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dsrRequests" (
	"id" serial PRIMARY KEY NOT NULL,
	"organizationId" integer NOT NULL,
	"requestType" "dsrRequestType" NOT NULL,
	"jurisdiction" "dsrJurisdiction" DEFAULT 'Other' NOT NULL,
	"requesterName" varchar(255) NOT NULL,
	"requesterEmail" varchar(320) NOT NULL,
	"description" text,
	"status" "dsrStatus" DEFAULT 'received' NOT NULL,
	"priority" "dsrPriority" DEFAULT 'normal' NOT NULL,
	"dueDate" timestamp NOT NULL,
	"completedAt" timestamp,
	"assignedToUserId" integer,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "frameworkRelationships" (
	"id" serial PRIMARY KEY NOT NULL,
	"sourceFrameworkId" integer NOT NULL,
	"targetFrameworkId" integer NOT NULL,
	"relationshipType" "relationshipType" NOT NULL,
	"description" text,
	"severity" "severity",
	"riskLevel" varchar(50),
	"mitigation" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "frameworks" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" text NOT NULL,
	"country" varchar(50) NOT NULL,
	"description" text,
	"scope" text,
	"enforcementAuthority" varchar(255),
	"maxPenalty" varchar(255),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "frameworks_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "localUsers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(320) NOT NULL,
	"passwordHash" varchar(72) NOT NULL,
	"userType" "userType" DEFAULT 'visitor' NOT NULL,
	"companyName" varchar(255),
	"jobTitle" varchar(120),
	"industry" varchar(120),
	"complianceResponsibility" text,
	"preferredLocale" "locale" DEFAULT 'en' NOT NULL,
	"status" "userStatus" DEFAULT 'pending' NOT NULL,
	"lastSignedIn" timestamp,
	"totpSecret" varchar(64),
	"mfaEnabled" integer DEFAULT 0 NOT NULL,
	"mfaBackupCodes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "localUsers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "organizationMembers" (
	"id" serial PRIMARY KEY NOT NULL,
	"organizationId" integer NOT NULL,
	"userId" integer,
	"localUserId" integer,
	"role" "orgMemberRole" DEFAULT 'analyst' NOT NULL,
	"invitedByUserId" integer,
	"inviteEmail" varchar(320),
	"inviteToken" varchar(64),
	"inviteAcceptedAt" timestamp,
	"status" "orgMemberStatus" DEFAULT 'active' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"billingEmail" varchar(320) NOT NULL,
	"industry" varchar(120),
	"primaryJurisdiction" "jurisdiction" DEFAULT 'Both',
	"stripeCustomerId" varchar(64),
	"plan" "plan" DEFAULT 'free_trial' NOT NULL,
	"trialStartedAt" timestamp,
	"trialEndsAt" timestamp,
	"trialReminderDay3Sent" integer DEFAULT 0 NOT NULL,
	"trialReminderDay6Sent" integer DEFAULT 0 NOT NULL,
	"trialExpiredNoticeSent" integer DEFAULT 0 NOT NULL,
	"isActive" integer DEFAULT 1 NOT NULL,
	"maxSeats" integer DEFAULT 5 NOT NULL,
	"metadata" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "regulatorOversightTargets" (
	"id" serial PRIMARY KEY NOT NULL,
	"regulatorOrgId" integer NOT NULL,
	"targetOrgId" integer NOT NULL,
	"grantedByAdminId" integer,
	"expiresAt" timestamp,
	"isActive" integer DEFAULT 1 NOT NULL,
	"justification" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "remediationTasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"organizationId" integer NOT NULL,
	"vendorId" integer,
	"gapCode" varchar(64),
	"title" varchar(255) NOT NULL,
	"description" text,
	"severity" "taskSeverity" DEFAULT 'medium' NOT NULL,
	"status" "taskStatus" DEFAULT 'open' NOT NULL,
	"assignedToUserId" integer,
	"dueDate" timestamp,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reportShares" (
	"id" serial PRIMARY KEY NOT NULL,
	"token" varchar(64) NOT NULL,
	"jurisdiction" varchar(64) NOT NULL,
	"locale" "locale" DEFAULT 'en' NOT NULL,
	"reportType" varchar(64) NOT NULL,
	"createdByUserId" integer,
	"viewCount" integer DEFAULT 0 NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "reportShares_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "riskRegister" (
	"id" serial PRIMARY KEY NOT NULL,
	"organizationId" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"category" "riskCategory" DEFAULT 'operational' NOT NULL,
	"likelihood" integer DEFAULT 3 NOT NULL,
	"impact" integer DEFAULT 3 NOT NULL,
	"treatment" "treatment" DEFAULT 'mitigate' NOT NULL,
	"status" "riskStatus" DEFAULT 'open' NOT NULL,
	"ownerId" integer,
	"vendorId" integer,
	"gapCode" varchar(64),
	"controlReference" varchar(128),
	"reviewDate" timestamp,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rolePermissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"organizationId" integer NOT NULL,
	"userId" integer,
	"localUserId" integer,
	"module" varchar(120) NOT NULL,
	"canView" integer DEFAULT 0 NOT NULL,
	"canCreate" integer DEFAULT 0 NOT NULL,
	"canEdit" integer DEFAULT 0 NOT NULL,
	"canDelete" integer DEFAULT 0 NOT NULL,
	"canExport" integer DEFAULT 0 NOT NULL,
	"canInvite" integer DEFAULT 0 NOT NULL,
	"grantedByUserId" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "securityMaturityAssessments" (
	"id" serial PRIMARY KEY NOT NULL,
	"organizationId" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"frameworkRef" varchar(64),
	"scoreGovernance" integer DEFAULT 1 NOT NULL,
	"scoreAssetManagement" integer DEFAULT 1 NOT NULL,
	"scoreAccessControl" integer DEFAULT 1 NOT NULL,
	"scoreDataProtection" integer DEFAULT 1 NOT NULL,
	"scoreNetworkSecurity" integer DEFAULT 1 NOT NULL,
	"scoreVulnerabilityMgmt" integer DEFAULT 1 NOT NULL,
	"scoreIncidentResponse" integer DEFAULT 1 NOT NULL,
	"scoreBackupRecovery" integer DEFAULT 1 NOT NULL,
	"scoreThirdPartyRisk" integer DEFAULT 1 NOT NULL,
	"scoreSecurityAwareness" integer DEFAULT 1 NOT NULL,
	"overallScore" integer DEFAULT 0 NOT NULL,
	"maturityLevel" "maturityLevel" DEFAULT 'initial' NOT NULL,
	"recommendations" text,
	"assessedByUserId" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "serviceRequests" (
	"id" serial PRIMARY KEY NOT NULL,
	"organizationId" integer NOT NULL,
	"requestedByUserId" integer,
	"serviceType" "serviceType" NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"scopeDetails" text,
	"preferredStartDate" timestamp,
	"budgetRange" varchar(120),
	"priority" "servicePriority" DEFAULT 'medium' NOT NULL,
	"status" "serviceStatus" DEFAULT 'submitted' NOT NULL,
	"assignedToUserId" integer,
	"internalNotes" text,
	"clientResponse" text,
	"respondedAt" timestamp,
	"completedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"organizationId" integer NOT NULL,
	"stripeSubscriptionId" varchar(64),
	"stripePriceId" varchar(64),
	"plan" "paidPlan" NOT NULL,
	"billingInterval" "billingInterval" NOT NULL,
	"amountCents" integer NOT NULL,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"status" "subscriptionStatus" DEFAULT 'trialing' NOT NULL,
	"currentPeriodStart" timestamp,
	"currentPeriodEnd" timestamp,
	"cancelAtPeriodEnd" integer DEFAULT 0 NOT NULL,
	"canceledAt" timestamp,
	"lastInvoiceId" varchar(64),
	"stripeMetadata" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_stripeSubscriptionId_unique" UNIQUE("stripeSubscriptionId")
);
--> statement-breakpoint
CREATE TABLE "techStackComponents" (
	"id" serial PRIMARY KEY NOT NULL,
	"vendorId" integer NOT NULL,
	"componentName" varchar(255) NOT NULL,
	"componentType" varchar(100),
	"technology" varchar(255),
	"description" text,
	"dataHandling" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "threatIntelItems" (
	"id" serial PRIMARY KEY NOT NULL,
	"organizationId" integer,
	"title" varchar(255) NOT NULL,
	"summary" text NOT NULL,
	"threatActor" varchar(180),
	"category" "threatCategory" NOT NULL,
	"severity" "threatSeverity" DEFAULT 'medium' NOT NULL,
	"tlp" "tlp" DEFAULT 'white' NOT NULL,
	"affectedSectors" varchar(512),
	"indicators" text,
	"referenceUrl" varchar(1024),
	"cveId" varchar(32),
	"cvssScore" varchar(8),
	"isActive" integer DEFAULT 1 NOT NULL,
	"createdByUserId" integer,
	"publishedAt" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "userInteractionLogs" (
	"id" serial PRIMARY KEY NOT NULL,
	"organizationId" integer,
	"userId" integer,
	"localUserId" integer,
	"sessionId" varchar(64),
	"context" varchar(120) NOT NULL,
	"action" varchar(120) NOT NULL,
	"entityType" varchar(120),
	"entityId" integer,
	"inputSnapshot" text,
	"outputRef" text,
	"durationMs" integer,
	"ipHash" varchar(64),
	"userAgent" varchar(512),
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "userOnboarding" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer,
	"localUserId" integer,
	"stage" "onboardingStage" DEFAULT 'not_started' NOT NULL,
	"accountIntent" "accountIntent",
	"selectedLocale" "locale" DEFAULT 'en' NOT NULL,
	"completedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"organizationName" varchar(255),
	"organizationType" varchar(120),
	"jobTitle" varchar(120),
	"preferredLocale" "locale" DEFAULT 'en' NOT NULL,
	"role" "role" DEFAULT 'user' NOT NULL,
	"status" "userOAuthStatus" DEFAULT 'active' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	"lastActivityAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
--> statement-breakpoint
CREATE TABLE "vendorAssessments" (
	"id" serial PRIMARY KEY NOT NULL,
	"vendorId" integer NOT NULL,
	"frameworkId" integer NOT NULL,
	"assessmentDate" timestamp DEFAULT now() NOT NULL,
	"complianceScore" integer,
	"riskLevel" "severity",
	"status" "assessmentStatus",
	"findings" text,
	"recommendations" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vendorShares" (
	"id" serial PRIMARY KEY NOT NULL,
	"vendorId" integer NOT NULL,
	"shareToken" varchar(64) NOT NULL,
	"allowedOrgId" integer,
	"expiresAt" timestamp,
	"viewCount" integer DEFAULT 0 NOT NULL,
	"createdByUserId" integer,
	"isRevoked" integer DEFAULT 0 NOT NULL,
	"revokedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "vendorShares_shareToken_unique" UNIQUE("shareToken")
);
--> statement-breakpoint
CREATE TABLE "vendors" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"organizationId" integer,
	"vendorName" varchar(255) NOT NULL,
	"vendorDescription" text,
	"industry" varchar(100),
	"businessRegistrationNumber" varchar(120),
	"headquartersLocation" varchar(120),
	"primaryContactName" varchar(255),
	"primaryContactEmail" varchar(320),
	"primaryContactRole" varchar(120),
	"primaryContactPhone" varchar(64),
	"serviceType" varchar(120),
	"serviceScope" text,
	"hostingEnvironment" varchar(120),
	"operatingCountries" text,
	"cloudProvider" varchar(255),
	"dataLocations" text,
	"regulatoryJurisdictions" text,
	"certifications" text,
	"dataProcessingActivities" text,
	"criticalityLevel" varchar(64),
	"riskTier" varchar(64),
	"thirdPartyDependencies" varchar(64),
	"fourthPartyDependencies" varchar(64),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "yallaAdminAccessLinkNonces" (
	"id" serial PRIMARY KEY NOT NULL,
	"nonceHash" varchar(64) NOT NULL,
	"redirectTarget" varchar(255) NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"consumedAt" timestamp DEFAULT now() NOT NULL,
	"consumedByIp" varchar(64) NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "yallaAdminAccessLinkNonces_nonceHash_unique" UNIQUE("nonceHash")
);
--> statement-breakpoint
ALTER TABLE "activityEvents" ADD CONSTRAINT "activityEvents_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activityEvents" ADD CONSTRAINT "activityEvents_localUserId_localUsers_id_fk" FOREIGN KEY ("localUserId") REFERENCES "public"."localUsers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "apiKeys" ADD CONSTRAINT "apiKeys_organizationId_organizations_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "apiKeys" ADD CONSTRAINT "apiKeys_createdByUserId_users_id_fk" FOREIGN KEY ("createdByUserId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessmentGaps" ADD CONSTRAINT "assessmentGaps_assessmentId_vendorAssessments_id_fk" FOREIGN KEY ("assessmentId") REFERENCES "public"."vendorAssessments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessmentGaps" ADD CONSTRAINT "assessmentGaps_controlId_complianceControls_id_fk" FOREIGN KEY ("controlId") REFERENCES "public"."complianceControls"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assetInventory" ADD CONSTRAINT "assetInventory_organizationId_organizations_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assetInventory" ADD CONSTRAINT "assetInventory_addedByUserId_localUsers_id_fk" FOREIGN KEY ("addedByUserId") REFERENCES "public"."localUsers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auditLogs" ADD CONSTRAINT "auditLogs_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auditLogs" ADD CONSTRAINT "auditLogs_localUserId_localUsers_id_fk" FOREIGN KEY ("localUserId") REFERENCES "public"."localUsers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auditLogs" ADD CONSTRAINT "auditLogs_organizationId_organizations_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auditSchedules" ADD CONSTRAINT "auditSchedules_organizationId_organizations_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billingEvents" ADD CONSTRAINT "billingEvents_organizationId_organizations_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billingEvents" ADD CONSTRAINT "billingEvents_subscriptionId_subscriptions_id_fk" FOREIGN KEY ("subscriptionId") REFERENCES "public"."subscriptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "complianceControls" ADD CONSTRAINT "complianceControls_frameworkId_frameworks_id_fk" FOREIGN KEY ("frameworkId") REFERENCES "public"."frameworks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "complianceDeadlines" ADD CONSTRAINT "complianceDeadlines_organizationId_organizations_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "complianceDeadlines" ADD CONSTRAINT "complianceDeadlines_assignedToUserId_users_id_fk" FOREIGN KEY ("assignedToUserId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "complianceEvidence" ADD CONSTRAINT "complianceEvidence_organizationId_organizations_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "complianceEvidence" ADD CONSTRAINT "complianceEvidence_addedByUserId_localUsers_id_fk" FOREIGN KEY ("addedByUserId") REFERENCES "public"."localUsers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "complianceExposureMappings" ADD CONSTRAINT "complianceExposureMappings_vulnerabilityId_ctemVulnerabilities_id_fk" FOREIGN KEY ("vulnerabilityId") REFERENCES "public"."ctemVulnerabilities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "complianceExposureMappings" ADD CONSTRAINT "complianceExposureMappings_frameworkId_frameworks_id_fk" FOREIGN KEY ("frameworkId") REFERENCES "public"."frameworks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "complianceExposureMappings" ADD CONSTRAINT "complianceExposureMappings_controlId_complianceControls_id_fk" FOREIGN KEY ("controlId") REFERENCES "public"."complianceControls"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "complianceIncidents" ADD CONSTRAINT "complianceIncidents_organizationId_organizations_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliancePolicies" ADD CONSTRAINT "compliancePolicies_organizationId_organizations_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "complianceReports" ADD CONSTRAINT "complianceReports_organizationId_organizations_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "complianceReports" ADD CONSTRAINT "complianceReports_generatedByUserId_users_id_fk" FOREIGN KEY ("generatedByUserId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "complianceReports" ADD CONSTRAINT "complianceReports_generatedByLocalUserId_localUsers_id_fk" FOREIGN KEY ("generatedByLocalUserId") REFERENCES "public"."localUsers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultationRequests" ADD CONSTRAINT "consultationRequests_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultationRequests" ADD CONSTRAINT "consultationRequests_assignedAdminUserId_users_id_fk" FOREIGN KEY ("assignedAdminUserId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "continuousComplianceRuns" ADD CONSTRAINT "continuousComplianceRuns_organizationId_organizations_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "continuousComplianceRuns" ADD CONSTRAINT "continuousComplianceRuns_vendorId_vendors_id_fk" FOREIGN KEY ("vendorId") REFERENCES "public"."vendors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "controlMappings" ADD CONSTRAINT "controlMappings_sourceControlId_complianceControls_id_fk" FOREIGN KEY ("sourceControlId") REFERENCES "public"."complianceControls"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "controlMappings" ADD CONSTRAINT "controlMappings_targetControlId_complianceControls_id_fk" FOREIGN KEY ("targetControlId") REFERENCES "public"."complianceControls"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ctemAssets" ADD CONSTRAINT "ctemAssets_organizationId_organizations_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ctemAssets" ADD CONSTRAINT "ctemAssets_vendorId_vendors_id_fk" FOREIGN KEY ("vendorId") REFERENCES "public"."vendors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ctemAttackSimulations" ADD CONSTRAINT "ctemAttackSimulations_assetId_ctemAssets_id_fk" FOREIGN KEY ("assetId") REFERENCES "public"."ctemAssets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ctemRiskScores" ADD CONSTRAINT "ctemRiskScores_assetId_ctemAssets_id_fk" FOREIGN KEY ("assetId") REFERENCES "public"."ctemAssets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ctemVulnerabilities" ADD CONSTRAINT "ctemVulnerabilities_assetId_ctemAssets_id_fk" FOREIGN KEY ("assetId") REFERENCES "public"."ctemAssets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dsrRequests" ADD CONSTRAINT "dsrRequests_organizationId_organizations_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dsrRequests" ADD CONSTRAINT "dsrRequests_assignedToUserId_localUsers_id_fk" FOREIGN KEY ("assignedToUserId") REFERENCES "public"."localUsers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "frameworkRelationships" ADD CONSTRAINT "frameworkRelationships_sourceFrameworkId_frameworks_id_fk" FOREIGN KEY ("sourceFrameworkId") REFERENCES "public"."frameworks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "frameworkRelationships" ADD CONSTRAINT "frameworkRelationships_targetFrameworkId_frameworks_id_fk" FOREIGN KEY ("targetFrameworkId") REFERENCES "public"."frameworks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizationMembers" ADD CONSTRAINT "organizationMembers_organizationId_organizations_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizationMembers" ADD CONSTRAINT "organizationMembers_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizationMembers" ADD CONSTRAINT "organizationMembers_localUserId_localUsers_id_fk" FOREIGN KEY ("localUserId") REFERENCES "public"."localUsers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regulatorOversightTargets" ADD CONSTRAINT "regulatorOversightTargets_regulatorOrgId_organizations_id_fk" FOREIGN KEY ("regulatorOrgId") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regulatorOversightTargets" ADD CONSTRAINT "regulatorOversightTargets_targetOrgId_organizations_id_fk" FOREIGN KEY ("targetOrgId") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regulatorOversightTargets" ADD CONSTRAINT "regulatorOversightTargets_grantedByAdminId_users_id_fk" FOREIGN KEY ("grantedByAdminId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "remediationTasks" ADD CONSTRAINT "remediationTasks_organizationId_organizations_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reportShares" ADD CONSTRAINT "reportShares_createdByUserId_users_id_fk" FOREIGN KEY ("createdByUserId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "riskRegister" ADD CONSTRAINT "riskRegister_organizationId_organizations_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rolePermissions" ADD CONSTRAINT "rolePermissions_organizationId_organizations_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rolePermissions" ADD CONSTRAINT "rolePermissions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rolePermissions" ADD CONSTRAINT "rolePermissions_localUserId_localUsers_id_fk" FOREIGN KEY ("localUserId") REFERENCES "public"."localUsers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rolePermissions" ADD CONSTRAINT "rolePermissions_grantedByUserId_users_id_fk" FOREIGN KEY ("grantedByUserId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "securityMaturityAssessments" ADD CONSTRAINT "securityMaturityAssessments_organizationId_organizations_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "securityMaturityAssessments" ADD CONSTRAINT "securityMaturityAssessments_assessedByUserId_localUsers_id_fk" FOREIGN KEY ("assessedByUserId") REFERENCES "public"."localUsers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "serviceRequests" ADD CONSTRAINT "serviceRequests_organizationId_organizations_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "serviceRequests" ADD CONSTRAINT "serviceRequests_requestedByUserId_localUsers_id_fk" FOREIGN KEY ("requestedByUserId") REFERENCES "public"."localUsers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "serviceRequests" ADD CONSTRAINT "serviceRequests_assignedToUserId_localUsers_id_fk" FOREIGN KEY ("assignedToUserId") REFERENCES "public"."localUsers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_organizationId_organizations_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "techStackComponents" ADD CONSTRAINT "techStackComponents_vendorId_vendors_id_fk" FOREIGN KEY ("vendorId") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threatIntelItems" ADD CONSTRAINT "threatIntelItems_organizationId_organizations_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threatIntelItems" ADD CONSTRAINT "threatIntelItems_createdByUserId_localUsers_id_fk" FOREIGN KEY ("createdByUserId") REFERENCES "public"."localUsers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "userInteractionLogs" ADD CONSTRAINT "userInteractionLogs_organizationId_organizations_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "userInteractionLogs" ADD CONSTRAINT "userInteractionLogs_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "userInteractionLogs" ADD CONSTRAINT "userInteractionLogs_localUserId_localUsers_id_fk" FOREIGN KEY ("localUserId") REFERENCES "public"."localUsers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "userOnboarding" ADD CONSTRAINT "userOnboarding_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "userOnboarding" ADD CONSTRAINT "userOnboarding_localUserId_localUsers_id_fk" FOREIGN KEY ("localUserId") REFERENCES "public"."localUsers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendorAssessments" ADD CONSTRAINT "vendorAssessments_vendorId_vendors_id_fk" FOREIGN KEY ("vendorId") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendorAssessments" ADD CONSTRAINT "vendorAssessments_frameworkId_frameworks_id_fk" FOREIGN KEY ("frameworkId") REFERENCES "public"."frameworks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendorShares" ADD CONSTRAINT "vendorShares_vendorId_vendors_id_fk" FOREIGN KEY ("vendorId") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendorShares" ADD CONSTRAINT "vendorShares_allowedOrgId_organizations_id_fk" FOREIGN KEY ("allowedOrgId") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendorShares" ADD CONSTRAINT "vendorShares_createdByUserId_users_id_fk" FOREIGN KEY ("createdByUserId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_organizationId_organizations_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;