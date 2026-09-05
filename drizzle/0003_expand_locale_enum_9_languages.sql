CREATE TYPE "public"."aiAgentRunStatus" AS ENUM('queued', 'running', 'completed', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."complianceSimulationRisk" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."complianceSimulationStatus" AS ENUM('draft', 'completed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."complianceSimulationType" AS ENUM('readiness', 'gap_analysis', 'cost_estimate', 'cross_border', 'full');--> statement-breakpoint
CREATE TYPE "public"."knowledgeGraphEdgeRelation" AS ENUM('contains', 'activates', 'supports', 'maps_to', 'requires', 'conflicts', 'depends_on', 'governs', 'references', 'impacts', 'mitigates', 'translates_to', 'equivalent_to', 'cross_border_to');--> statement-breakpoint
CREATE TYPE "public"."knowledgeGraphNodeKind" AS ENUM('region', 'framework', 'standard', 'edition', 'agent', 'regulator', 'country', 'control', 'threat', 'vendor', 'certification', 'policy', 'technology', 'data_type', 'industry', 'risk_scenario');--> statement-breakpoint
CREATE TYPE "public"."regulatoryChangeStatus" AS ENUM('pending', 'in_effect', 'superseded');--> statement-breakpoint
CREATE TYPE "public"."regulatoryChangeType" AS ENUM('amendment', 'new_regulation', 'repeal', 'guidance', 'enforcement');--> statement-breakpoint
ALTER TYPE "public"."deadlineJurisdiction" ADD VALUE 'EU' BEFORE 'Both';--> statement-breakpoint
ALTER TYPE "public"."deadlineJurisdiction" ADD VALUE 'US' BEFORE 'Both';--> statement-breakpoint
ALTER TYPE "public"."deadlineJurisdiction" ADD VALUE 'Brazil' BEFORE 'Both';--> statement-breakpoint
ALTER TYPE "public"."deadlineJurisdiction" ADD VALUE 'Global' BEFORE 'Both';--> statement-breakpoint
ALTER TYPE "public"."deadlineJurisdiction" ADD VALUE 'United Kingdom';--> statement-breakpoint
ALTER TYPE "public"."deadlineJurisdiction" ADD VALUE 'Canada';--> statement-breakpoint
ALTER TYPE "public"."deadlineJurisdiction" ADD VALUE 'Australia';--> statement-breakpoint
ALTER TYPE "public"."deadlineJurisdiction" ADD VALUE 'Japan';--> statement-breakpoint
ALTER TYPE "public"."deadlineJurisdiction" ADD VALUE 'South Korea';--> statement-breakpoint
ALTER TYPE "public"."deadlineJurisdiction" ADD VALUE 'Singapore';--> statement-breakpoint
ALTER TYPE "public"."deadlineJurisdiction" ADD VALUE 'India';--> statement-breakpoint
ALTER TYPE "public"."deadlineJurisdiction" ADD VALUE 'South Africa';--> statement-breakpoint
ALTER TYPE "public"."deadlineJurisdiction" ADD VALUE 'Mexico';--> statement-breakpoint
ALTER TYPE "public"."deadlineJurisdiction" ADD VALUE 'Thailand';--> statement-breakpoint
ALTER TYPE "public"."deadlineJurisdiction" ADD VALUE 'Indonesia';--> statement-breakpoint
ALTER TYPE "public"."deadlineJurisdiction" ADD VALUE 'Malaysia';--> statement-breakpoint
ALTER TYPE "public"."deadlineJurisdiction" ADD VALUE 'Philippines';--> statement-breakpoint
ALTER TYPE "public"."deadlineJurisdiction" ADD VALUE 'Vietnam';--> statement-breakpoint
ALTER TYPE "public"."deadlineJurisdiction" ADD VALUE 'Nigeria';--> statement-breakpoint
ALTER TYPE "public"."deadlineJurisdiction" ADD VALUE 'Kenya';--> statement-breakpoint
ALTER TYPE "public"."deadlineJurisdiction" ADD VALUE 'United Arab Emirates';--> statement-breakpoint
ALTER TYPE "public"."deadlineJurisdiction" ADD VALUE 'Qatar';--> statement-breakpoint
ALTER TYPE "public"."deadlineJurisdiction" ADD VALUE 'Kuwait';--> statement-breakpoint
ALTER TYPE "public"."deadlineJurisdiction" ADD VALUE 'Bahrain';--> statement-breakpoint
ALTER TYPE "public"."deadlineJurisdiction" ADD VALUE 'Oman';--> statement-breakpoint
ALTER TYPE "public"."deadlineJurisdiction" ADD VALUE 'Jordan';--> statement-breakpoint
ALTER TYPE "public"."deadlineJurisdiction" ADD VALUE 'Egypt';--> statement-breakpoint
ALTER TYPE "public"."dsrJurisdiction" ADD VALUE 'EU' BEFORE 'Other';--> statement-breakpoint
ALTER TYPE "public"."dsrJurisdiction" ADD VALUE 'US' BEFORE 'Other';--> statement-breakpoint
ALTER TYPE "public"."dsrJurisdiction" ADD VALUE 'Brazil' BEFORE 'Other';--> statement-breakpoint
ALTER TYPE "public"."dsrJurisdiction" ADD VALUE 'United Kingdom';--> statement-breakpoint
ALTER TYPE "public"."dsrJurisdiction" ADD VALUE 'Canada';--> statement-breakpoint
ALTER TYPE "public"."dsrJurisdiction" ADD VALUE 'Australia';--> statement-breakpoint
ALTER TYPE "public"."dsrJurisdiction" ADD VALUE 'Japan';--> statement-breakpoint
ALTER TYPE "public"."dsrJurisdiction" ADD VALUE 'South Korea';--> statement-breakpoint
ALTER TYPE "public"."dsrJurisdiction" ADD VALUE 'Singapore';--> statement-breakpoint
ALTER TYPE "public"."dsrJurisdiction" ADD VALUE 'India';--> statement-breakpoint
ALTER TYPE "public"."dsrJurisdiction" ADD VALUE 'South Africa';--> statement-breakpoint
ALTER TYPE "public"."dsrJurisdiction" ADD VALUE 'Mexico';--> statement-breakpoint
ALTER TYPE "public"."dsrJurisdiction" ADD VALUE 'Thailand';--> statement-breakpoint
ALTER TYPE "public"."dsrJurisdiction" ADD VALUE 'Indonesia';--> statement-breakpoint
ALTER TYPE "public"."dsrJurisdiction" ADD VALUE 'Malaysia';--> statement-breakpoint
ALTER TYPE "public"."dsrJurisdiction" ADD VALUE 'Philippines';--> statement-breakpoint
ALTER TYPE "public"."dsrJurisdiction" ADD VALUE 'Vietnam';--> statement-breakpoint
ALTER TYPE "public"."dsrJurisdiction" ADD VALUE 'Nigeria';--> statement-breakpoint
ALTER TYPE "public"."dsrJurisdiction" ADD VALUE 'Kenya';--> statement-breakpoint
ALTER TYPE "public"."dsrJurisdiction" ADD VALUE 'United Arab Emirates';--> statement-breakpoint
ALTER TYPE "public"."dsrJurisdiction" ADD VALUE 'Qatar';--> statement-breakpoint
ALTER TYPE "public"."dsrJurisdiction" ADD VALUE 'Kuwait';--> statement-breakpoint
ALTER TYPE "public"."dsrJurisdiction" ADD VALUE 'Bahrain';--> statement-breakpoint
ALTER TYPE "public"."dsrJurisdiction" ADD VALUE 'Oman';--> statement-breakpoint
ALTER TYPE "public"."dsrJurisdiction" ADD VALUE 'Jordan';--> statement-breakpoint
ALTER TYPE "public"."dsrJurisdiction" ADD VALUE 'Egypt';--> statement-breakpoint
ALTER TYPE "public"."jurisdiction" ADD VALUE 'EU' BEFORE 'Both';--> statement-breakpoint
ALTER TYPE "public"."jurisdiction" ADD VALUE 'US' BEFORE 'Both';--> statement-breakpoint
ALTER TYPE "public"."jurisdiction" ADD VALUE 'Brazil' BEFORE 'Both';--> statement-breakpoint
ALTER TYPE "public"."jurisdiction" ADD VALUE 'Global' BEFORE 'Both';--> statement-breakpoint
ALTER TYPE "public"."jurisdiction" ADD VALUE 'United Kingdom';--> statement-breakpoint
ALTER TYPE "public"."jurisdiction" ADD VALUE 'Canada';--> statement-breakpoint
ALTER TYPE "public"."jurisdiction" ADD VALUE 'Australia';--> statement-breakpoint
ALTER TYPE "public"."jurisdiction" ADD VALUE 'Japan';--> statement-breakpoint
ALTER TYPE "public"."jurisdiction" ADD VALUE 'South Korea';--> statement-breakpoint
ALTER TYPE "public"."jurisdiction" ADD VALUE 'Singapore';--> statement-breakpoint
ALTER TYPE "public"."jurisdiction" ADD VALUE 'India';--> statement-breakpoint
ALTER TYPE "public"."jurisdiction" ADD VALUE 'South Africa';--> statement-breakpoint
ALTER TYPE "public"."jurisdiction" ADD VALUE 'Mexico';--> statement-breakpoint
ALTER TYPE "public"."jurisdiction" ADD VALUE 'Thailand';--> statement-breakpoint
ALTER TYPE "public"."jurisdiction" ADD VALUE 'Indonesia';--> statement-breakpoint
ALTER TYPE "public"."jurisdiction" ADD VALUE 'Malaysia';--> statement-breakpoint
ALTER TYPE "public"."jurisdiction" ADD VALUE 'Philippines';--> statement-breakpoint
ALTER TYPE "public"."jurisdiction" ADD VALUE 'Vietnam';--> statement-breakpoint
ALTER TYPE "public"."jurisdiction" ADD VALUE 'Nigeria';--> statement-breakpoint
ALTER TYPE "public"."jurisdiction" ADD VALUE 'Kenya';--> statement-breakpoint
ALTER TYPE "public"."jurisdiction" ADD VALUE 'United Arab Emirates';--> statement-breakpoint
ALTER TYPE "public"."jurisdiction" ADD VALUE 'Qatar';--> statement-breakpoint
ALTER TYPE "public"."jurisdiction" ADD VALUE 'Kuwait';--> statement-breakpoint
ALTER TYPE "public"."jurisdiction" ADD VALUE 'Bahrain';--> statement-breakpoint
ALTER TYPE "public"."jurisdiction" ADD VALUE 'Oman';--> statement-breakpoint
ALTER TYPE "public"."jurisdiction" ADD VALUE 'Jordan';--> statement-breakpoint
ALTER TYPE "public"."jurisdiction" ADD VALUE 'Egypt';--> statement-breakpoint
ALTER TYPE "public"."locale" ADD VALUE 'fr';--> statement-breakpoint
ALTER TYPE "public"."locale" ADD VALUE 'es';--> statement-breakpoint
ALTER TYPE "public"."locale" ADD VALUE 'de';--> statement-breakpoint
ALTER TYPE "public"."locale" ADD VALUE 'ja';--> statement-breakpoint
ALTER TYPE "public"."locale" ADD VALUE 'ko';--> statement-breakpoint
ALTER TYPE "public"."locale" ADD VALUE 'pt';--> statement-breakpoint
CREATE TABLE "aiAgentRuns" (
	"id" serial PRIMARY KEY NOT NULL,
	"organizationId" integer NOT NULL,
	"agentCode" varchar(120) NOT NULL,
	"agentName" varchar(255) NOT NULL,
	"triggerType" varchar(64) DEFAULT 'manual' NOT NULL,
	"inputPayload" text,
	"outputPayload" text,
	"status" "aiAgentRunStatus" DEFAULT 'queued' NOT NULL,
	"startedAt" timestamp,
	"completedAt" timestamp,
	"errorMessage" text,
	"durationMs" integer,
	"createdByUserId" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analytics_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"organization_id" integer NOT NULL,
	"event" varchar(100) NOT NULL,
	"category" varchar(50) NOT NULL,
	"properties" jsonb DEFAULT '{}'::jsonb,
	"session_id" varchar(64),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "complianceSimulations" (
	"id" serial PRIMARY KEY NOT NULL,
	"organizationId" integer NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"simulationType" "complianceSimulationType" NOT NULL,
	"jurisdiction" text NOT NULL,
	"frameworks" text NOT NULL,
	"maturityScores" text NOT NULL,
	"gapCounts" text NOT NULL,
	"totalGaps" integer DEFAULT 0 NOT NULL,
	"costEstimateLow" integer,
	"costEstimateHigh" integer,
	"costEstimateCurrency" text DEFAULT 'USD' NOT NULL,
	"riskLevel" "complianceSimulationRisk" DEFAULT 'medium' NOT NULL,
	"status" "complianceSimulationStatus" DEFAULT 'completed' NOT NULL,
	"summary" text,
	"createdByUserId" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"organization_id" integer,
	"template" varchar(100) NOT NULL,
	"recipient" varchar(320) NOT NULL,
	"subject" varchar(500),
	"status" varchar(20) DEFAULT 'queued' NOT NULL,
	"sent_at" timestamp,
	"opened_at" timestamp,
	"clicked_at" timestamp,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feature_flags" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"enabled" boolean DEFAULT false,
	"rollout_percentage" integer DEFAULT 0,
	"target_org_ids" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "feature_flags_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "knowledgeGraphEdges" (
	"id" serial PRIMARY KEY NOT NULL,
	"sourceNodeId" varchar(120) NOT NULL,
	"targetNodeId" varchar(120) NOT NULL,
	"relation" "knowledgeGraphEdgeRelation" NOT NULL,
	"weight" integer DEFAULT 1 NOT NULL,
	"metadata" text,
	"organizationId" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledgeGraphNodes" (
	"id" serial PRIMARY KEY NOT NULL,
	"nodeId" varchar(120) NOT NULL,
	"label" varchar(255) NOT NULL,
	"kind" "knowledgeGraphNodeKind" NOT NULL,
	"description" text,
	"region" varchar(120),
	"jurisdiction" varchar(120),
	"metadata" text,
	"organizationId" integer,
	"isCustom" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "knowledgeGraphNodes_nodeId_unique" UNIQUE("nodeId")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"body" text,
	"action_url" varchar(500),
	"is_read" boolean DEFAULT false,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "onboarding_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"current_step" integer DEFAULT 0,
	"completed_steps" jsonb DEFAULT '[]'::jsonb,
	"skipped" boolean DEFAULT false,
	"completed_at" timestamp,
	"responses" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "onboarding_progress_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "organization_profiles_custom" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer NOT NULL,
	"industry" varchar(120),
	"employee_range" varchar(30),
	"compliance_maturity" varchar(30),
	"selected_frameworks" jsonb DEFAULT '[]'::jsonb,
	"business_objectives" jsonb DEFAULT '[]'::jsonb,
	"onboarding_completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "organization_profiles_custom_organization_id_unique" UNIQUE("organization_id")
);
--> statement-breakpoint
CREATE TABLE "otpCodes" (
	"id" serial PRIMARY KEY NOT NULL,
	"identifier" varchar(320) NOT NULL,
	"codeHash" varchar(64) NOT NULL,
	"purpose" varchar(32) DEFAULT 'login' NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "regulatoryChanges" (
	"id" serial PRIMARY KEY NOT NULL,
	"organizationId" integer,
	"frameworkCode" varchar(50) NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"changeType" "regulatoryChangeType" NOT NULL,
	"jurisdiction" text NOT NULL,
	"source" text NOT NULL,
	"effectiveDate" timestamp NOT NULL,
	"publicationDate" timestamp NOT NULL,
	"status" "regulatoryChangeStatus" DEFAULT 'pending' NOT NULL,
	"impact" text NOT NULL,
	"url" varchar(1024),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_activity_summary" (
	"user_id" integer PRIMARY KEY NOT NULL,
	"total_sessions" integer DEFAULT 0,
	"total_events" integer DEFAULT 0,
	"last_active_at" timestamp,
	"feature_adoption" jsonb DEFAULT '{}'::jsonb,
	"activation_score" integer DEFAULT 0,
	"health_score" integer DEFAULT 0,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"dashboard_layout" jsonb DEFAULT '{}'::jsonb,
	"default_jurisdictions" jsonb DEFAULT '[]'::jsonb,
	"notification_prefs" jsonb DEFAULT '{}'::jsonb,
	"theme" varchar(20) DEFAULT 'system',
	"locale" "locale" DEFAULT 'en',
	"tour_completed" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "yallaAdminAuditLogs" (
	"id" serial PRIMARY KEY NOT NULL,
	"sessionId" varchar(64),
	"adminUsername" varchar(120) NOT NULL,
	"action" varchar(120) NOT NULL,
	"target" varchar(255),
	"ipAddress" varchar(64) NOT NULL,
	"payload" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "yallaAdminSessions" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"adminUsername" varchar(120) NOT NULL,
	"ipAddress" varchar(64) NOT NULL,
	"userAgent" varchar(512),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"lastSeenAt" timestamp DEFAULT now() NOT NULL,
	"isRevoked" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ctemAssets" ALTER COLUMN "region" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "ctemAssets" ALTER COLUMN "region" SET DEFAULT 'Global'::text;--> statement-breakpoint
DROP TYPE "public"."region";--> statement-breakpoint
CREATE TYPE "public"."region" AS ENUM('North America', 'Europe', 'APAC', 'EMEA', 'Latin America', 'Africa', 'Global');--> statement-breakpoint
ALTER TABLE "ctemAssets" ALTER COLUMN "region" SET DEFAULT 'Global'::"public"."region";--> statement-breakpoint
ALTER TABLE "ctemAssets" ALTER COLUMN "region" SET DATA TYPE "public"."region" USING "region"::"public"."region";--> statement-breakpoint
ALTER TABLE "localUsers" ALTER COLUMN "email" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "localUsers" ALTER COLUMN "passwordHash" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "yallaAdminAccessLinkNonces" ALTER COLUMN "consumedAt" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "yallaAdminAccessLinkNonces" ALTER COLUMN "consumedAt" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "yallaAdminAccessLinkNonces" ALTER COLUMN "consumedByIp" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "localUsers" ADD COLUMN "phoneNumber" varchar(20);--> statement-breakpoint
ALTER TABLE "localUsers" ADD COLUMN "verifiedAt" timestamp;--> statement-breakpoint
ALTER TABLE "localUsers" ADD COLUMN "lastMfaVerifiedAt" timestamp;--> statement-breakpoint
ALTER TABLE "localUsers" ADD COLUMN "firstLoginEmailSent" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "aiAgentRuns" ADD CONSTRAINT "aiAgentRuns_organizationId_organizations_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aiAgentRuns" ADD CONSTRAINT "aiAgentRuns_createdByUserId_localUsers_id_fk" FOREIGN KEY ("createdByUserId") REFERENCES "public"."localUsers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "complianceSimulations" ADD CONSTRAINT "complianceSimulations_organizationId_organizations_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "complianceSimulations" ADD CONSTRAINT "complianceSimulations_createdByUserId_localUsers_id_fk" FOREIGN KEY ("createdByUserId") REFERENCES "public"."localUsers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_log" ADD CONSTRAINT "email_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_log" ADD CONSTRAINT "email_log_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledgeGraphEdges" ADD CONSTRAINT "knowledgeGraphEdges_organizationId_organizations_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledgeGraphNodes" ADD CONSTRAINT "knowledgeGraphNodes_organizationId_organizations_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_progress" ADD CONSTRAINT "onboarding_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_profiles_custom" ADD CONSTRAINT "organization_profiles_custom_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regulatoryChanges" ADD CONSTRAINT "regulatoryChanges_organizationId_organizations_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_activity_summary" ADD CONSTRAINT "user_activity_summary_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "localUsers" ADD CONSTRAINT "localUsers_phoneNumber_unique" UNIQUE("phoneNumber");