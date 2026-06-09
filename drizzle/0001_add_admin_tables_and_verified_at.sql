-- Migration 0001: Admin session/audit tables + email verification + performance indexes
-- Generated from drizzle/schema.ts changes

ALTER TABLE "localUsers" ADD COLUMN IF NOT EXISTS "verifiedAt" timestamp;

CREATE TABLE IF NOT EXISTS "yallaAdminSessions" (
    "id"            varchar(64)   NOT NULL PRIMARY KEY,
    "adminUsername" varchar(120)  NOT NULL,
    "ipAddress"     varchar(64)   NOT NULL,
    "userAgent"     varchar(512),
    "createdAt"     timestamp     NOT NULL DEFAULT now(),
    "expiresAt"     timestamp     NOT NULL,
    "lastSeenAt"    timestamp     NOT NULL DEFAULT now(),
    "isRevoked"     integer       NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS "yallaAdminSessions_adminUsername_idx" ON "yallaAdminSessions" ("adminUsername");
CREATE INDEX IF NOT EXISTS "yallaAdminSessions_expiresAt_idx" ON "yallaAdminSessions" ("expiresAt");

CREATE TABLE IF NOT EXISTS "yallaAdminAuditLogs" (
    "id"            serial        PRIMARY KEY,
    "sessionId"     varchar(64),
    "adminUsername" varchar(120)  NOT NULL,
    "action"        varchar(120)  NOT NULL,
    "target"        varchar(255),
    "ipAddress"     varchar(64)   NOT NULL,
    "payload"       text,
    "createdAt"     timestamp     NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "yallaAdminAudit_adminUsername_idx" ON "yallaAdminAuditLogs" ("adminUsername");
CREATE INDEX IF NOT EXISTS "yallaAdminAudit_action_idx" ON "yallaAdminAuditLogs" ("action");
CREATE INDEX IF NOT EXISTS "yallaAdminAudit_createdAt_idx" ON "yallaAdminAuditLogs" ("createdAt");

-- Performance indexes for multi-tenant queries (safe to run with IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS "organizations_plan_idx" ON "organizations" ("plan");
CREATE INDEX IF NOT EXISTS "organizations_stripeCustomerId_idx" ON "organizations" ("stripeCustomerId");
CREATE INDEX IF NOT EXISTS "organizationMembers_organizationId_idx" ON "organizationMembers" ("organizationId");
CREATE INDEX IF NOT EXISTS "organizationMembers_userId_idx" ON "organizationMembers" ("userId");
CREATE INDEX IF NOT EXISTS "vendors_organizationId_idx" ON "vendors" ("organizationId");
CREATE INDEX IF NOT EXISTS "auditLogs_organizationId_idx" ON "auditLogs" ("organizationId");
CREATE INDEX IF NOT EXISTS "auditLogs_createdAt_idx" ON "auditLogs" ("createdAt");
CREATE INDEX IF NOT EXISTS "subscriptions_organizationId_idx" ON "subscriptions" ("organizationId");
CREATE INDEX IF NOT EXISTS "billingEvents_organizationId_idx" ON "billingEvents" ("organizationId");
CREATE INDEX IF NOT EXISTS "complianceDeadlines_organizationId_idx" ON "complianceDeadlines" ("organizationId");
CREATE INDEX IF NOT EXISTS "riskRegister_organizationId_idx" ON "riskRegister" ("organizationId");
CREATE INDEX IF NOT EXISTS "remediationTasks_organizationId_idx" ON "remediationTasks" ("organizationId");
CREATE INDEX IF NOT EXISTS "userInteractionLogs_organizationId_idx" ON "userInteractionLogs" ("organizationId");
CREATE INDEX IF NOT EXISTS "userInteractionLogs_createdAt_idx" ON "userInteractionLogs" ("createdAt");
CREATE INDEX IF NOT EXISTS "activityEvents_createdAt_idx" ON "activityEvents" ("createdAt");
