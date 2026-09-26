/**
 * Auto-migration runner — applies missing schema changes on server startup.
 * Safe for serverless (Vercel): runs fast, checks existence first, idempotent.
 */
import { sql, SQL } from "drizzle-orm";
import { getDb } from "../db";
import { ENV } from "../_core/env";

let migrationApplied = false;

async function seedComplianceFrameworks(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>
): Promise<void> {
  try {
    const { complianceFrameworks } = await import(
      "../../scripts/compliance-reference-data.mjs"
    );

    let seeded = 0;
    for (const fw of complianceFrameworks) {
      await db.execute(sql`
                INSERT INTO "frameworks" ("code", "name", "country", "description", "scope", "enforcementAuthority", "maxPenalty")
                VALUES (${fw.code}, ${fw.name}, ${fw.country}, ${fw.description ?? null}, ${fw.scope ?? null}, ${fw.enforcementAuthority ?? null}, ${fw.maxPenalty ?? null})
                ON CONFLICT ("code") DO UPDATE SET
                    "name" = EXCLUDED."name",
                    "country" = EXCLUDED."country",
                    "description" = EXCLUDED."description",
                    "scope" = EXCLUDED."scope",
                    "enforcementAuthority" = EXCLUDED."enforcementAuthority",
                    "maxPenalty" = EXCLUDED."maxPenalty",
                    "updatedAt" = NOW()
            `);
      seeded++;
    }

    if (!ENV.isProduction) {
      console.info(`[Migrate] Seeded ${seeded} compliance frameworks.`);
    }
  } catch (err) {
    console.warn(
      "[Migrate] Compliance seed data could not be loaded (fallback will be used):",
      (err as Error).message
    );
  }
}

export async function ensureMigrated(): Promise<void> {
  if (migrationApplied) return;

  const db = await getDb();
  if (!db) return; // No DB connection — skip (in-memory mode)

  try {
    // Migration 0001: admin tables + performance indexes + verifiedAt
    await db.execute(sql`
            ALTER TABLE "localUsers" ADD COLUMN IF NOT EXISTS "verifiedAt" timestamp
        `);
    await db.execute(sql`
            ALTER TABLE "localUsers" ADD COLUMN IF NOT EXISTS "lastMfaVerifiedAt" timestamp
        `);
    await db.execute(sql`
            ALTER TABLE "localUsers" ADD COLUMN IF NOT EXISTS "firstLoginEmailSent" integer DEFAULT 0 NOT NULL
        `);

    await db.execute(sql`
            CREATE TABLE IF NOT EXISTS "yallaAdminSessions" (
                "id"            varchar(64)   NOT NULL PRIMARY KEY,
                "adminUsername" varchar(120)  NOT NULL,
                "ipAddress"     varchar(64)   NOT NULL,
                "userAgent"     varchar(512),
                "createdAt"     timestamp     NOT NULL DEFAULT now(),
                "expiresAt"     timestamp     NOT NULL,
                "lastSeenAt"    timestamp     NOT NULL DEFAULT now(),
                "isRevoked"     integer       NOT NULL DEFAULT 0
            )
        `);

    await db.execute(sql`
            CREATE TABLE IF NOT EXISTS "yallaAdminAuditLogs" (
                "id"            serial        PRIMARY KEY,
                "sessionId"     varchar(64),
                "adminUsername" varchar(120)  NOT NULL,
                "action"        varchar(120)  NOT NULL,
                "target"        varchar(255),
                "ipAddress"     varchar(64)   NOT NULL,
                "payload"       text,
                "createdAt"     timestamp     NOT NULL DEFAULT now()
            )
        `);

    // Migration 0002: phoneNumber + otpCodes
    await db.execute(sql`
            ALTER TABLE "localUsers" ADD COLUMN IF NOT EXISTS "phoneNumber" varchar(20)
        `);
    await db.execute(sql`
            ALTER TABLE "complianceControls" ADD COLUMN IF NOT EXISTS "applicability" varchar(255)
        `);
    await db.execute(sql`
            CREATE UNIQUE INDEX IF NOT EXISTS "localUsers_phoneNumber_idx"
            ON "localUsers" ("phoneNumber") WHERE "phoneNumber" IS NOT NULL
        `);

    await db.execute(sql`
            CREATE TABLE IF NOT EXISTS "otpCodes" (
                "id"         serial        PRIMARY KEY,
                "identifier" varchar(320)  NOT NULL,
                "codeHash"   varchar(64)   NOT NULL,
                "purpose"    varchar(32)   NOT NULL DEFAULT 'login',
                "expiresAt"  timestamp     NOT NULL,
                "attempts"   integer       NOT NULL DEFAULT 0,
                "createdAt"  timestamp     NOT NULL DEFAULT now()
            )
        `);

    // Ensure core audit table exists (may be missing if only auto-migrate ran)
    await db.execute(sql`
            CREATE TABLE IF NOT EXISTS "auditLogs" (
                "id"             serial        PRIMARY KEY,
                "userId"         integer,
                "localUserId"    integer,
                "organizationId" integer,
                "actorRole"      varchar(64),
                "category"       varchar(64)   NOT NULL,
                "action"         varchar(120)  NOT NULL,
                "entityType"     varchar(120),
                "entityId"       integer,
                "targetEntity"   varchar(255),
                "outcome"        varchar(32)   NOT NULL DEFAULT 'success',
                "payload"        text,
                "ipHash"         varchar(64),
                "userAgent"      varchar(512),
                "createdAt"      timestamp     NOT NULL DEFAULT now()
            )
        `);

    // Performance indexes (safe with IF NOT EXISTS)
    const indexes = [
      sql`CREATE INDEX IF NOT EXISTS "organizations_plan_idx" ON "organizations" ("plan")`,
      sql`CREATE INDEX IF NOT EXISTS "organizations_stripeCustomerId_idx" ON "organizations" ("stripeCustomerId")`,
      sql`CREATE INDEX IF NOT EXISTS "organizationMembers_organizationId_idx" ON "organizationMembers" ("organizationId")`,
      sql`CREATE INDEX IF NOT EXISTS "vendors_organizationId_idx" ON "vendors" ("organizationId")`,
      sql`CREATE INDEX IF NOT EXISTS "auditLogs_organizationId_idx" ON "auditLogs" ("organizationId")`,
      sql`CREATE INDEX IF NOT EXISTS "auditLogs_createdAt_idx" ON "auditLogs" ("createdAt")`,
      sql`CREATE INDEX IF NOT EXISTS "subscriptions_organizationId_idx" ON "subscriptions" ("organizationId")`,
      sql`CREATE INDEX IF NOT EXISTS "billingEvents_organizationId_idx" ON "billingEvents" ("organizationId")`,
      sql`CREATE INDEX IF NOT EXISTS "riskRegister_organizationId_idx" ON "riskRegister" ("organizationId")`,
      sql`CREATE INDEX IF NOT EXISTS "userInteractionLogs_organizationId_idx" ON "userInteractionLogs" ("organizationId")`,
      sql`CREATE INDEX IF NOT EXISTS "activityEvents_createdAt_idx" ON "activityEvents" ("createdAt")`,
    ];

    for (const idx of indexes) {
      await db.execute(idx);
    }

    // Ensure unique constraint for compliance controls seeding
    await db.execute(sql`
            CREATE UNIQUE INDEX IF NOT EXISTS "complianceControls_frameworkId_controlCode_idx"
            ON "complianceControls" ("frameworkId", "controlCode")
        `);
    await db.execute(sql`
            CREATE UNIQUE INDEX IF NOT EXISTS "frameworkRelationships_src_tgt_idx"
            ON "frameworkRelationships" ("sourceFrameworkId", "targetFrameworkId")
        `);

    // Migration 0003: expand enums for global jurisdiction coverage (idempotent)
    const globalJurisdictions = [
      "United Kingdom",
      "Canada",
      "Australia",
      "Japan",
      "South Korea",
      "Singapore",
      "India",
      "South Africa",
      "Mexico",
      "Thailand",
      "Indonesia",
      "Malaysia",
      "Philippines",
      "Vietnam",
      "Nigeria",
      "Kenya",
      "United Arab Emirates",
      "Qatar",
      "Kuwait",
      "Bahrain",
      "Oman",
      "Jordan",
      "Egypt",
    ];
    for (const j of globalJurisdictions) {
      await db.execute(
        sql`ALTER TYPE "jurisdiction" ADD VALUE IF NOT EXISTS ${j}`
      );
      await db.execute(
        sql`ALTER TYPE "dsrJurisdiction" ADD VALUE IF NOT EXISTS ${j}`
      );
      await db.execute(
        sql`ALTER TYPE "deadlineJurisdiction" ADD VALUE IF NOT EXISTS ${j}`
      );
    }

    // Migration 0004: fix region enum values (initial migration had China/Saudi Arabia/Cross-border/Other,
    // but schema now uses geographic regions). Add new values idempotently.
    const newRegions = [
      "North America",
      "Europe",
      "APAC",
      "EMEA",
      "Latin America",
      "Africa",
      "Global",
    ];
    for (const r of newRegions) {
      await db.execute(sql`ALTER TYPE "region" ADD VALUE IF NOT EXISTS ${r}`);
    }

    await db.execute(sql`
            ALTER TABLE "yallaAdminAccessLinkNonces"
            ALTER COLUMN "consumedAt" DROP DEFAULT
        `);
    await db.execute(sql`
            ALTER TABLE "yallaAdminAccessLinkNonces"
            ALTER COLUMN "consumedAt" DROP NOT NULL
        `);
    await db.execute(sql`
            ALTER TABLE "yallaAdminAccessLinkNonces"
            ALTER COLUMN "consumedByIp" DROP NOT NULL
        `);

    // Migration 0005: onboarding + customer journey tables
    await db.execute(sql`
            CREATE TABLE IF NOT EXISTS "onboarding_progress" (
                "id"              serial        PRIMARY KEY,
                "user_id"         integer       NOT NULL UNIQUE REFERENCES "users" ("id") ON DELETE CASCADE,
                "current_step"    integer       DEFAULT 0,
                "completed_steps" jsonb         DEFAULT '[]'::jsonb,
                "skipped"         boolean       DEFAULT false,
                "completed_at"    timestamp,
                "responses"       jsonb         DEFAULT '{}'::jsonb,
                "created_at"      timestamp     NOT NULL DEFAULT now(),
                "updated_at"      timestamp     NOT NULL DEFAULT now()
            )
        `);
    await db.execute(sql`
            CREATE TABLE IF NOT EXISTS "organization_profiles_custom" (
                "id"                       serial        PRIMARY KEY,
                "organization_id"          integer       NOT NULL UNIQUE REFERENCES "organizations" ("id") ON DELETE CASCADE,
                "industry"                 varchar(120),
                "employee_range"           varchar(30),
                "compliance_maturity"      varchar(30),
                "selected_frameworks"      jsonb         DEFAULT '[]'::jsonb,
                "business_objectives"      jsonb         DEFAULT '[]'::jsonb,
                "onboarding_completed_at"  timestamp,
                "created_at"               timestamp     NOT NULL DEFAULT now(),
                "updated_at"               timestamp     NOT NULL DEFAULT now()
            )
        `);
    await db.execute(sql`
            CREATE TABLE IF NOT EXISTS "user_preferences" (
                "id"                    serial        PRIMARY KEY,
                "user_id"               integer       NOT NULL UNIQUE REFERENCES "users" ("id") ON DELETE CASCADE,
                "dashboard_layout"      jsonb         DEFAULT '{}'::jsonb,
                "default_jurisdictions" jsonb         DEFAULT '[]'::jsonb,
                "notification_prefs"    jsonb         DEFAULT '{}'::jsonb,
                "theme"                 varchar(20)   DEFAULT 'system',
                "locale"                varchar(10)   DEFAULT 'en',
                "tour_completed"        boolean       DEFAULT false,
                "created_at"            timestamp     NOT NULL DEFAULT now(),
                "updated_at"            timestamp     NOT NULL DEFAULT now()
            )
        `);

    // Migration 0006: analytics + feature flags tables
    await db.execute(sql`
            CREATE TABLE IF NOT EXISTS "feature_flags" (
                "id"                   serial        PRIMARY KEY,
                "name"                 varchar(100)  NOT NULL UNIQUE,
                "description"          text,
                "enabled"              boolean       DEFAULT false,
                "rollout_percentage"   integer       DEFAULT 0,
                "target_org_ids"       jsonb         DEFAULT '[]'::jsonb,
                "created_at"           timestamp     NOT NULL DEFAULT now(),
                "updated_at"           timestamp     NOT NULL DEFAULT now()
            )
        `);
    await db.execute(sql`
            CREATE TABLE IF NOT EXISTS "analytics_events" (
                "id"               serial        PRIMARY KEY,
                "user_id"          integer       NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
                "organization_id"  integer       NOT NULL REFERENCES "organizations" ("id") ON DELETE CASCADE,
                "event"            varchar(100)  NOT NULL,
                "category"         varchar(50)   NOT NULL,
                "properties"       jsonb         DEFAULT '{}'::jsonb,
                "session_id"       varchar(64),
                "created_at"       timestamp     NOT NULL DEFAULT now()
            )
        `);
    await db.execute(sql`
            CREATE TABLE IF NOT EXISTS "user_activity_summary" (
                "user_id"           integer       PRIMARY KEY REFERENCES "users" ("id") ON DELETE CASCADE,
                "total_sessions"    integer       DEFAULT 0,
                "total_events"      integer       DEFAULT 0,
                "last_active_at"    timestamp,
                "feature_adoption"  jsonb         DEFAULT '{}'::jsonb,
                "activation_score"  integer       DEFAULT 0,
                "health_score"      integer       DEFAULT 0,
                "updated_at"        timestamp     NOT NULL DEFAULT now()
            )
        `);

    // Migration 0007: communication tables
    await db.execute(sql`
            CREATE TABLE IF NOT EXISTS "email_log" (
                "id"               serial        PRIMARY KEY,
                "user_id"          integer       REFERENCES "users" ("id") ON DELETE SET NULL,
                "organization_id"  integer       REFERENCES "organizations" ("id") ON DELETE SET NULL,
                "template"         varchar(100)  NOT NULL,
                "recipient"        varchar(320)  NOT NULL,
                "subject"          varchar(500),
                "status"           varchar(20)   DEFAULT 'queued' NOT NULL,
                "sent_at"          timestamp,
                "opened_at"        timestamp,
                "clicked_at"       timestamp,
                "error_message"    text,
                "created_at"       timestamp     NOT NULL DEFAULT now()
            )
        `);
    await db.execute(sql`
            CREATE TABLE IF NOT EXISTS "notifications" (
                "id"          serial        PRIMARY KEY,
                "user_id"     integer       NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
                "type"        varchar(50)   NOT NULL,
                "title"       varchar(255)  NOT NULL,
                "body"        text,
                "action_url"  varchar(500),
                "is_read"     boolean       DEFAULT false,
                "read_at"     timestamp,
                "created_at"  timestamp     NOT NULL DEFAULT now()
            )
        `);

    // Migration 0008: knowledge graph tables
    // Create enum types first so the column references work
    await db.execute(sql`
            DO $$ BEGIN
                CREATE TYPE "knowledgeGraphNodeKind" AS ENUM (
                    'region','framework','standard','edition','agent','regulator',
                    'country','control','threat','vendor','certification','policy',
                    'technology','data_type','industry','risk_scenario'
                );
            EXCEPTION WHEN duplicate_object THEN NULL;
            END $$;
        `);
    await db.execute(sql`
            DO $$ BEGIN
                CREATE TYPE "knowledgeGraphEdgeRelation" AS ENUM (
                    'contains','activates','supports','maps_to','requires','conflicts',
                    'depends_on','governs','references','impacts','mitigates',
                    'translates_to','equivalent_to','cross_border_to'
                );
            EXCEPTION WHEN duplicate_object THEN NULL;
            END $$;
        `);
    await db.execute(sql`
            CREATE TABLE IF NOT EXISTS "knowledgeGraphNodes" (
                "id"               serial        PRIMARY KEY,
                "nodeId"           varchar(120)  NOT NULL UNIQUE,
                "label"            varchar(255)  NOT NULL,
                "kind"             varchar(50)   NOT NULL,
                "description"      text,
                "region"           varchar(120),
                "jurisdiction"     varchar(120),
                "metadata"         text,
                "organizationId"   integer       REFERENCES "organizations" ("id") ON DELETE CASCADE,
                "isCustom"         integer       DEFAULT 0 NOT NULL,
                "createdAt"        timestamp     NOT NULL DEFAULT now(),
                "updatedAt"        timestamp     NOT NULL DEFAULT now()
            )
        `);
    await db.execute(sql`
            CREATE TABLE IF NOT EXISTS "knowledgeGraphEdges" (
                "id"               serial        PRIMARY KEY,
                "sourceNodeId"     varchar(120)  NOT NULL,
                "targetNodeId"     varchar(120)  NOT NULL,
                "relation"         varchar(60)   NOT NULL,
                "weight"           integer       DEFAULT 1 NOT NULL,
                "metadata"         text,
                "organizationId"   integer       REFERENCES "organizations" ("id") ON DELETE CASCADE,
                "createdAt"        timestamp     NOT NULL DEFAULT now()
            )
        `);

    // Migration 0009: regulatory changes + compliance simulations + AI agent runs
    await db.execute(sql`
            CREATE TABLE IF NOT EXISTS "regulatoryChanges" (
                "id"               serial        PRIMARY KEY,
                "organizationId"   integer       REFERENCES "organizations" ("id") ON DELETE SET NULL,
                "frameworkCode"    varchar(50)   NOT NULL,
                "title"            text          NOT NULL,
                "description"      text          NOT NULL,
                "changeType"       varchar(50)   NOT NULL,
                "jurisdiction"     text          NOT NULL,
                "source"           text          NOT NULL,
                "effectiveDate"    timestamp     NOT NULL,
                "publicationDate"  timestamp     NOT NULL,
                "status"           varchar(50)   NOT NULL DEFAULT 'pending',
                "impact"           text          NOT NULL,
                "url"              varchar(1024),
                "createdAt"        timestamp     NOT NULL DEFAULT now(),
                "updatedAt"        timestamp     NOT NULL DEFAULT now()
            )
        `);
    await db.execute(sql`
            CREATE TABLE IF NOT EXISTS "complianceSimulations" (
                "id"                   serial        PRIMARY KEY,
                "organizationId"       integer       NOT NULL REFERENCES "organizations" ("id") ON DELETE CASCADE,
                "name"                 text          NOT NULL,
                "description"          text,
                "simulationType"       varchar(50)   NOT NULL,
                "jurisdiction"         text          NOT NULL,
                "frameworks"           text          NOT NULL,
                "maturityScores"       text          NOT NULL,
                "gapCounts"            text          NOT NULL,
                "totalGaps"            integer       DEFAULT 0 NOT NULL,
                "costEstimateLow"      integer,
                "costEstimateHigh"     integer,
                "costEstimateCurrency" text          DEFAULT 'USD' NOT NULL,
                "riskLevel"            varchar(20)   DEFAULT 'medium' NOT NULL,
                "status"               varchar(20)   DEFAULT 'completed' NOT NULL,
                "summary"              text,
                "createdByUserId"      integer       REFERENCES "localUsers" ("id") ON DELETE SET NULL,
                "createdAt"            timestamp     NOT NULL DEFAULT now(),
                "updatedAt"            timestamp     NOT NULL DEFAULT now()
            )
        `);
    await db.execute(sql`
            CREATE TABLE IF NOT EXISTS "aiAgentRuns" (
                "id"               serial        PRIMARY KEY,
                "organizationId"   integer       NOT NULL REFERENCES "organizations" ("id") ON DELETE CASCADE,
                "agentCode"        varchar(120)  NOT NULL,
                "agentName"        varchar(255)  NOT NULL,
                "triggerType"      varchar(64)   DEFAULT 'manual' NOT NULL,
                "inputPayload"     text,
                "outputPayload"    text,
                "status"           varchar(20)   DEFAULT 'queued' NOT NULL,
                "startedAt"        timestamp,
                "completedAt"      timestamp,
                "errorMessage"     text,
                "durationMs"       integer,
                "createdByUserId"  integer       REFERENCES "localUsers" ("id") ON DELETE SET NULL,
                "createdAt"        timestamp     NOT NULL DEFAULT now(),
                "updatedAt"        timestamp     NOT NULL DEFAULT now()
            )
        `);

    // Migration 0010: schema drift repair ───────────────────────────────────────
    // Databases created from older SQL snapshots are missing columns that later
    // versions of the schema rely on. CREATE TABLE IF NOT EXISTS never heals an
    // existing table, so repair idempotently with ALTER ... ADD COLUMN.
    const driftExec = async (label: string, stmt: SQL) => {
      try {
        await db.execute(stmt);
        if (!ENV.isProduction) console.info(`[Migrate] Drift ok: ${label}`);
      } catch (err) {
        console.warn(
          `[Migrate] Drift repair skipped (${label}):`,
          (err as Error).message
        );
      }
    };

    // Audit-log tamper-evidence column (hash chain) — additive, nullable.
    await driftExec(
      "auditLogs.chainHash",
      sql`ALTER TABLE "auditLogs" ADD COLUMN IF NOT EXISTS "chainHash" text`
    );

    // Migration 0011: tenant-query indexes ─────────────────────────────────────
    // Every tenant-scoped table is filtered by organizationId. Ensure each has a
    // supporting index so tenant queries remain index scans as data grows.
    // Idempotent (IF NOT EXISTS); safe to run on every boot.
    const tenantIndexTables = [
      "complianceReports",
      "apiKeys",
      "compliancePolicies",
      "complianceIncidents",
      "auditSchedules",
      "ctemAssets",
      "continuousComplianceRuns",
      "rolePermissions",
      "complianceEvidence",
      "dsrRequests",
      "serviceRequests",
      "assetInventory",
      "securityMaturityAssessments",
      "threatIntelItems",
      "knowledgeGraphNodes",
      "knowledgeGraphEdges",
      "regulatoryChanges",
      "complianceSimulations",
      "aiAgentRuns",
      "organization_profiles_custom",
      "analytics_events",
      "email_log",
    ];
    for (const table of tenantIndexTables) {
      await driftExec(
        `index ${table}.organizationId`,
        sql`CREATE INDEX IF NOT EXISTS ${sql.identifier(`${table}_organizationId_idx`)} ON ${sql.identifier(table)} ("organizationId")`
      );
    }

    const driftEnums: Record<string, string[]> = {
      plan: ["free_trial", "starter", "professional", "enterprise"],
      paidPlan: ["starter", "professional", "enterprise"],
      billingInterval: ["monthly", "quarterly", "biannual", "annual"],
      subscriptionStatus: [
        "trialing",
        "active",
        "past_due",
        "canceled",
        "incomplete",
        "paused",
      ],
      billingEventStatus: ["success", "failed", "pending", "refunded"],
      orgMemberRole: ["owner", "admin", "compliance_officer", "analyst"],
      orgMemberStatus: ["active", "invited", "suspended"],
    };
    for (const [typeName, values] of Object.entries(driftEnums)) {
      await driftExec(
        `create enum ${typeName}`,
        sql`DO $$ BEGIN
           CREATE TYPE ${sql.identifier(typeName)} AS ENUM (${values.map(v => sql`${v}`).join(",")})
         EXCEPTION WHEN duplicate_object THEN NULL;
         END $$;`
      );
      for (const v of values) {
        await driftExec(
          `enum ${typeName}.${v}`,
          sql`ALTER TYPE ${sql.identifier(typeName)} ADD VALUE IF NOT EXISTS ${v}`
        );
      }
    }

    const driftColumns: Array<[string, SQL]> = [
      [
        "organizations",
        sql`ADD COLUMN IF NOT EXISTS "billingEmail" varchar(320) NOT NULL DEFAULT ''`,
      ],
      ["organizations", sql`ADD COLUMN IF NOT EXISTS "industry" varchar(120)`],
      [
        "organizations",
        sql`ADD COLUMN IF NOT EXISTS "primaryJurisdiction" "jurisdiction" DEFAULT 'Both'`,
      ],
      [
        "organizations",
        sql`ADD COLUMN IF NOT EXISTS "stripeCustomerId" varchar(64)`,
      ],
      [
        "organizations",
        sql`ADD COLUMN IF NOT EXISTS "plan" "plan" DEFAULT 'free_trial' NOT NULL`,
      ],
      [
        "organizations",
        sql`ADD COLUMN IF NOT EXISTS "trialStartedAt" timestamp`,
      ],
      ["organizations", sql`ADD COLUMN IF NOT EXISTS "trialEndsAt" timestamp`],
      [
        "organizations",
        sql`ADD COLUMN IF NOT EXISTS "trialReminderDay3Sent" integer DEFAULT 0 NOT NULL`,
      ],
      [
        "organizations",
        sql`ADD COLUMN IF NOT EXISTS "trialReminderDay6Sent" integer DEFAULT 0 NOT NULL`,
      ],
      [
        "organizations",
        sql`ADD COLUMN IF NOT EXISTS "trialExpiredNoticeSent" integer DEFAULT 0 NOT NULL`,
      ],
      [
        "organizations",
        sql`ADD COLUMN IF NOT EXISTS "isActive" integer DEFAULT 1 NOT NULL`,
      ],
      [
        "organizations",
        sql`ADD COLUMN IF NOT EXISTS "maxSeats" integer DEFAULT 5 NOT NULL`,
      ],
      ["organizations", sql`ADD COLUMN IF NOT EXISTS "metadata" text`],
      ["auditLogs", sql`ADD COLUMN IF NOT EXISTS "userId" integer`],
      ["auditLogs", sql`ADD COLUMN IF NOT EXISTS "localUserId" integer`],
      ["auditLogs", sql`ADD COLUMN IF NOT EXISTS "organizationId" integer`],
      ["auditLogs", sql`ADD COLUMN IF NOT EXISTS "actorRole" varchar(64)`],
      [
        "auditLogs",
        sql`ADD COLUMN IF NOT EXISTS "category" "auditLogCategory" DEFAULT 'system' NOT NULL`,
      ],
      [
        "auditLogs",
        sql`ADD COLUMN IF NOT EXISTS "action" varchar(120) DEFAULT '' NOT NULL`,
      ],
      ["auditLogs", sql`ADD COLUMN IF NOT EXISTS "entityType" varchar(120)`],
      ["auditLogs", sql`ADD COLUMN IF NOT EXISTS "entityId" integer`],
      ["auditLogs", sql`ADD COLUMN IF NOT EXISTS "targetEntity" varchar(255)`],
      [
        "auditLogs",
        sql`ADD COLUMN IF NOT EXISTS "outcome" "auditLogOutcome" DEFAULT 'success' NOT NULL`,
      ],
      ["auditLogs", sql`ADD COLUMN IF NOT EXISTS "payload" text`],
      ["auditLogs", sql`ADD COLUMN IF NOT EXISTS "ipHash" varchar(64)`],
      ["auditLogs", sql`ADD COLUMN IF NOT EXISTS "userAgent" varchar(512)`],
      [
        "subscriptions",
        sql`ADD COLUMN IF NOT EXISTS "stripeSubscriptionId" varchar(64)`,
      ],
      [
        "subscriptions",
        sql`ADD COLUMN IF NOT EXISTS "stripePriceId" varchar(64)`,
      ],
      [
        "subscriptions",
        sql`ADD COLUMN IF NOT EXISTS "plan" "paidPlan" DEFAULT 'starter' NOT NULL`,
      ],
      [
        "subscriptions",
        sql`ADD COLUMN IF NOT EXISTS "billingInterval" "billingInterval" DEFAULT 'monthly' NOT NULL`,
      ],
      [
        "subscriptions",
        sql`ADD COLUMN IF NOT EXISTS "amountCents" integer DEFAULT 0 NOT NULL`,
      ],
      [
        "subscriptions",
        sql`ADD COLUMN IF NOT EXISTS "currency" varchar(3) DEFAULT 'USD' NOT NULL`,
      ],
      [
        "subscriptions",
        sql`ADD COLUMN IF NOT EXISTS "status" "subscriptionStatus" DEFAULT 'trialing' NOT NULL`,
      ],
      [
        "subscriptions",
        sql`ADD COLUMN IF NOT EXISTS "currentPeriodStart" timestamp`,
      ],
      [
        "subscriptions",
        sql`ADD COLUMN IF NOT EXISTS "currentPeriodEnd" timestamp`,
      ],
      [
        "subscriptions",
        sql`ADD COLUMN IF NOT EXISTS "cancelAtPeriodEnd" integer DEFAULT 0 NOT NULL`,
      ],
      ["subscriptions", sql`ADD COLUMN IF NOT EXISTS "canceledAt" timestamp`],
      [
        "subscriptions",
        sql`ADD COLUMN IF NOT EXISTS "lastInvoiceId" varchar(64)`,
      ],
      ["subscriptions", sql`ADD COLUMN IF NOT EXISTS "stripeMetadata" text`],
      ["billingEvents", sql`ADD COLUMN IF NOT EXISTS "subscriptionId" integer`],
      [
        "billingEvents",
        sql`ADD COLUMN IF NOT EXISTS "stripeEventId" varchar(64)`,
      ],
      [
        "billingEvents",
        sql`ADD COLUMN IF NOT EXISTS "eventType" varchar(120) DEFAULT '' NOT NULL`,
      ],
      [
        "billingEvents",
        sql`ADD COLUMN IF NOT EXISTS "status" "billingEventStatus" DEFAULT 'pending' NOT NULL`,
      ],
      ["billingEvents", sql`ADD COLUMN IF NOT EXISTS "amountCents" integer`],
      [
        "billingEvents",
        sql`ADD COLUMN IF NOT EXISTS "currency" varchar(3) DEFAULT 'USD'`,
      ],
      ["billingEvents", sql`ADD COLUMN IF NOT EXISTS "description" text`],
      ["billingEvents", sql`ADD COLUMN IF NOT EXISTS "rawPayload" text`],
      [
        "organizationMembers",
        sql`ADD COLUMN IF NOT EXISTS "localUserId" integer`,
      ],
      ["organizationMembers", sql`ADD COLUMN IF NOT EXISTS "userId" integer`],
      [
        "organizationMembers",
        sql`ADD COLUMN IF NOT EXISTS "role" "orgMemberRole" DEFAULT 'analyst' NOT NULL`,
      ],
      [
        "organizationMembers",
        sql`ADD COLUMN IF NOT EXISTS "status" "orgMemberStatus" DEFAULT 'active' NOT NULL`,
      ],
      [
        "organizationMembers",
        sql`ADD COLUMN IF NOT EXISTS "invitedByUserId" integer`,
      ],
      [
        "organizationMembers",
        sql`ADD COLUMN IF NOT EXISTS "inviteEmail" varchar(320)`,
      ],
      [
        "organizationMembers",
        sql`ADD COLUMN IF NOT EXISTS "inviteToken" varchar(64)`,
      ],
      [
        "organizationMembers",
        sql`ADD COLUMN IF NOT EXISTS "inviteAcceptedAt" timestamp`,
      ],
    ];
    for (const [table, clause] of driftColumns) {
      await driftExec(
        table,
        sql`ALTER TABLE ${sql.identifier(table)} ${clause}`
      );
    }

    await driftExec(
      "subscriptions unique stripeSubscriptionId",
      sql`CREATE UNIQUE INDEX IF NOT EXISTS "subscriptions_stripeSubscriptionId_unique" ON "subscriptions" ("stripeSubscriptionId")`
    );
    await driftExec(
      "billingEvents unique stripeEventId",
      sql`CREATE UNIQUE INDEX IF NOT EXISTS "billingEvents_stripeEventId_unique" ON "billingEvents" ("stripeEventId")`
    );

    // Seed compliance reference data into DB (idempotent upserts)
    await seedComplianceFrameworks(db);

    // Migration 0012: founders-portal settings (rotated password hash, TOTP 2FA)
    await db.execute(sql`
            CREATE TABLE IF NOT EXISTS "yallaAdminSettings" (
                "key"       varchar(64) NOT NULL PRIMARY KEY,
                "value"     text        NOT NULL,
                "updatedAt" timestamp   NOT NULL DEFAULT now()
            )
        `);

    migrationApplied = true;
    if (!ENV.isProduction) {
      console.info("[Migrate] Schema auto-migration complete.");
    }
  } catch (err) {
    // Don't crash the server if migration fails — log and continue
    console.warn(
      "[Migrate] Auto-migration failed (may already be applied):",
      (err as Error).message
    );
  }
}
