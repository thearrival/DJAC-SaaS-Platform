# DJAC SaaS - Database Schema Reference

## Overview

DJAC uses PostgreSQL 17 managed by Supabase, with Drizzle ORM for schema definition and migrations. The schema has **62 tables** and **30+ enum types**, organized across these domains:

- **Identity & Auth** — Users, OAuth profiles, sessions, OTP codes
- **Organization** — Multi-tenant orgs, memberships, RBAC permissions
- **Billing** — Subscriptions, billing events, Stripe integration
- **Compliance** — Frameworks, controls, mappings, reports
- **Vendor** — Vendor profiles, assessments, gaps, tech stack
- **Risk & Remediation** — Risk register, remediation tasks, policies
- **Incident & Audit** — Incidents, audit schedules, evidence
- **CTEM** — Continuous threat exposure assets, vulnerabilities, simulations
- **Knowledge** — Knowledge graph nodes and edges
- **AI** — Agent runs and assessment history
- **Admin & Analytics** — Admin sessions, analytics events, notifications

## Core Entity Relationships

```
users ────────────┬── organizationMembers ──── organizations ──── subscriptions
  │               │        │                         │
  ├── localUsers  │        ├── rolePermissions       ├── complianceReports
  ├── otpCodes    │        │                         ├── apiKeys
  ├── apiKeys     │        │                         ├── vendors
  └── notifications        │                         ├── riskRegister
                           │                         ├── complianceIncidents
                           │                         ├── auditSchedules
                           │                         ├── remediationTasks
                           │                         ├── compliancePolicies
                           │                         ├── evidence
                           │                         ├── dsrRequests
                           │                         ├── ctemAssets
                           │                         ├── assetInventory
                           │                         ├── securityMaturityAssessments
                           │                         └── serviceRequests

frameworks ─────── complianceControls ──── controlMappings
  │                                               │
  └── frameworkRelationships ─────────────────────┘
```

## Table Reference

### Identity & Authentication

| Table                | Description                                | Key Columns                                                                                                           |
| -------------------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| `users`              | OAuth/Supabase-authenticated user profiles | `id`, `openId`, `email`, `name`, `role`, `locale`, `avatarUrl`, `verifiedAt`                                          |
| `localUsers`         | Email/password authenticated users         | `id`, `email`, `passwordHash`, `mfaEnabled`, `mfaSecret`, `backupCodes`, `passwordResetToken`, `passwordResetExpires` |
| `otpCodes`           | Time-limited OTP codes for password reset  | `id`, `userId`, `codeHash`, `expiresAt`, `used`                                                                       |
| `accessRequests`     | Platform access request tracking           | `id`, `email`, `name`, `status`, `reviewedBy`                                                                         |
| `userOnboarding`     | Per-user onboarding state and preferences  | `id`, `userId`, `accountIntent`, `onboardingStage`, `jurisdiction`, `industry`, `companySize`                         |
| `onboardingProgress` | Multi-stage onboarding progress tracking   | `id`, `userId`, `stage`, `completed`, `data`                                                                          |

### Organization & RBAC

| Table                        | Description                        | Key Columns                                                                                                   |
| ---------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `organizations`              | Multi-tenant organizations         | `id`, `name`, `slug`, `plan`, `jurisdiction`, `industry`, `settings`                                          |
| `organizationMembers`        | Organization membership with role  | `id`, `orgId`, `userId`, `role`, `status`                                                                     |
| `rolePermissions`            | Custom per-role module permissions | `id`, `orgId`, `role`, `moduleSlug`, `canView`, `canCreate`, `canEdit`, `canDelete`, `canExport`, `canInvite` |
| `organizationProfilesCustom` | Extended organization profile data | `id`, `orgId`, `profileData`                                                                                  |

### Billing & Subscriptions

| Table           | Description                 | Key Columns                                                                                                                        |
| --------------- | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `subscriptions` | Stripe subscription records | `id`, `orgId`, `stripeSubscriptionId`, `plan`, `status`, `currentPeriodStart`, `currentPeriodEnd`, `trialEnd`, `cancelAtPeriodEnd` |
| `billingEvents` | Billing event history       | `id`, `orgId`, `subscriptionId`, `stripeEventId`, `type`, `status`, `amount`, `currency`                                           |

### Compliance Frameworks

| Table                    | Description                           | Key Columns                                                                 |
| ------------------------ | ------------------------------------- | --------------------------------------------------------------------------- |
| `frameworks`             | Regulatory frameworks library         | `id`, `name`, `slug`, `jurisdiction`, `version`, `description`, `isActive`  |
| `complianceControls`     | Individual controls within frameworks | `id`, `frameworkId`, `code`, `title`, `description`, `category`, `guidance` |
| `controlMappings`        | Cross-framework control equivalencies | `id`, `sourceControlId`, `targetControlId`, `mappingType`, `confidence`     |
| `frameworkRelationships` | Relationships between frameworks      | `id`, `sourceFrameworkId`, `targetFrameworkId`, `relationshipType`          |

### Vendor Management

| Table                 | Description                                | Key Columns                                                                       |
| --------------------- | ------------------------------------------ | --------------------------------------------------------------------------------- |
| `vendors`             | Registered vendors/providers               | `id`, `orgId`, `name`, `jurisdiction`, `criticality`, `status`, `profile`         |
| `vendorAssessments`   | Vendor compliance assessment results       | `id`, `vendorId`, `frameworkId`, `overallScore`, `status`, `assessedAt`, `report` |
| `assessmentGaps`      | Individual gap findings from assessments   | `id`, `assessmentId`, `controlId`, `status`, `severity`, `recommendation`         |
| `techStackComponents` | Vendor technology stack entries            | `id`, `vendorId`, `name`, `category`, `version`                                   |
| `vendorShares`        | Shared vendor access between organizations | `id`, `vendorId`, `sourceOrgId`, `targetOrgId`                                    |

### Risk & Remediation

| Table                | Description                   | Key Columns                                                                                                   |
| -------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `riskRegister`       | Risk register entries         | `id`, `orgId`, `title`, `description`, `category`, `likelihood`, `impact`, `riskLevel`, `status`, `treatment` |
| `remediationTasks`   | Remediation action items      | `id`, `orgId`, `riskId`, `title`, `description`, `assignee`, `severity`, `status`, `dueDate`                  |
| `compliancePolicies` | Versioned compliance policies | `id`, `orgId`, `title`, `version`, `content`, `status`, `publishedAt`, `acknowledgeRequired`                  |

### Incidents & Audits

| Table                 | Description                   | Key Columns                                                                                                               |
| --------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `complianceIncidents` | Incident tracking             | `id`, `orgId`, `title`, `description`, `severity`, `status`, `reportedAt`, `regulatoryNotifiable`, `notificationDeadline` |
| `auditSchedules`      | Recurring audit scheduling    | `id`, `orgId`, `title`, `frameworkId`, `frequency`, `nextAuditDate`, `status`                                             |
| `complianceEvidence`  | Evidence containers and files | `id`, `orgId`, `name`, `description`, `containerType`, `files`                                                            |

### CTEM (Continuous Threat Exposure Management)

| Table                        | Description                             | Key Columns                                                      |
| ---------------------------- | --------------------------------------- | ---------------------------------------------------------------- |
| `ctemAssets`                 | Asset inventory for threat exposure     | `id`, `orgId`, `name`, `type`, `criticality`, `exposureLevel`    |
| `ctemVulnerabilities`        | Identified vulnerabilities              | `id`, `orgId`, `assetId`, `title`, `severity`, `status`, `cveId` |
| `ctemAttackSimulations`      | Attack simulation scenarios             | `id`, `orgId`, `scenario`, `status`, `results`                   |
| `ctemRiskScores`             | Computed risk scores over time          | `id`, `orgId`, `assetId`, `score`, `scoredAt`                    |
| `continuousComplianceRuns`   | Continuous compliance check runs        | `id`, `orgId`, `frameworkId`, `status`, `checkedAt`              |
| `complianceExposureMappings` | Mappings between controls and exposures | `id`, `exposureId`, `controlId`, `status`                        |

### Data Subject Requests & Service Requests

| Table             | Description                       | Key Columns                                                                         |
| ----------------- | --------------------------------- | ----------------------------------------------------------------------------------- |
| `dsrRequests`     | Data Subject Request tracking     | `id`, `orgId`, `requestType`, `requesterEmail`, `status`, `deadline`, `fulfilledAt` |
| `serviceRequests` | Internal service request tracking | `id`, `orgId`, `title`, `description`, `priority`, `status`, `assignee`             |

### Asset, Threat & Maturity

| Table                         | Description                    | Key Columns                                                                 |
| ----------------------------- | ------------------------------ | --------------------------------------------------------------------------- |
| `assetInventory`              | IT asset register              | `id`, `orgId`, `name`, `type`, `classification`, `owner`, `location`        |
| `threatIntelItems`            | Threat intelligence indicators | `id`, `orgId`, `title`, `source`, `severity`, `indicatorType`, `observedAt` |
| `securityMaturityAssessments` | Security maturity scores       | `id`, `orgId`, `category`, `score`, `maxScore`, `assessedAt`                |

### AI & Reports

| Table               | Description                        | Key Columns                                                                            |
| ------------------- | ---------------------------------- | -------------------------------------------------------------------------------------- |
| `aiAgentRuns`       | AI assessment run history          | `id`, `orgId`, `jobType`, `status`, `stages`, `result`, `startedAt`, `completedAt`     |
| `complianceReports` | Generated compliance reports       | `id`, `orgId`, `title`, `type`, `status`, `locale`, `format`, `fileUrl`, `generatedAt` |
| `reportShares`      | Report sharing and access tracking | `id`, `reportId`, `sharedWith`, `accessToken`, `expiresAt`                             |

### Knowledge Graph

| Table                 | Description                    | Key Columns                                        |
| --------------------- | ------------------------------ | -------------------------------------------------- |
| `knowledgeGraphNodes` | Knowledge graph entities       | `id`, `label`, `type`, `properties`                |
| `knowledgeGraphEdges` | Relationships between entities | `id`, `sourceId`, `targetId`, `type`, `properties` |

### Regulatory & Simulation

| Table                       | Description                          | Key Columns                                                                                 |
| --------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------- |
| `regulatoryChanges`         | Regulatory change tracking           | `id`, `jurisdiction`, `frameworkId`, `title`, `description`, `effectiveDate`, `impactLevel` |
| `complianceSimulations`     | What-if scenario runs                | `id`, `orgId`, `scenario`, `parameters`, `results`, `runAt`                                 |
| `regulatorOversightTargets` | Regulatory oversight entity tracking | `id`, `orgId`, `regulatorName`, `jurisdiction`, `contactInfo`                               |

### Admin, Analytics & Notifications

| Table                        | Description                         | Key Columns                                                              |
| ---------------------------- | ----------------------------------- | ------------------------------------------------------------------------ |
| `auditLogs`                  | System audit trail                  | `id`, `actorId`, `category`, `action`, `outcome`, `details`, `ipAddress` |
| `yallaAdminSessions`         | Yalla admin panel sessions          | `id`, `userId`, `token`, `ipAddress`, `expiresAt`                        |
| `yallaAdminAuditLogs`        | Admin panel activity log            | `id`, `adminId`, `action`, `details`, `ipAddress`                        |
| `yallaAdminAccessLinkNonces` | One-time admin access tokens        | `id`, `nonce`, `expiresAt`, `used`                                       |
| `userInteractionLogs`        | User interaction event log          | `id`, `userId`, `orgId`, `event`, `data`, `timestamp`                    |
| `analyticsEvents`            | Product analytics events            | `id`, `orgId`, `userId`, `event`, `properties`                           |
| `userActivitySummary`        | Aggregated user activity metrics    | `id`, `userId`, `date`, `metrics`                                        |
| `notifications`              | User notifications                  | `id`, `userId`, `title`, `message`, `category`, `read`, `data`           |
| `adminNotifications`         | Admin-facing system notifications   | `id`, `title`, `message`, `category`, `read`                             |
| `featureFlags`               | Feature flag configuration          | `id`, `key`, `enabled`, `rules`                                          |
| `consultationRequests`       | Legal consultation requests         | `id`, `userId`, `question`, `status`, `response`                         |
| `activityEvents`             | Aggregated platform activity events | `id`, `userId`, `type`, `data`                                           |
| `userPreferences`            | User UI/UX preferences              | `id`, `userId`, `theme`, `locale`, `layout`, `preferences`               |
| `emailLog`                   | Outbound email delivery log         | `id`, `to`, `subject`, `status`, `sentAt`, `error`                       |
| `complianceDeadlines`        | Regulatory compliance deadlines     | `id`, `orgId`, `title`, `description`, `dueDate`, `framework`, `status`  |

## Enum Reference

### User & Auth

| Enum                | Values                                                                                                                                         |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `userType` / `role` | `visitor`, `professional`, `admin`, `basic_user`, `professional_user`, `company_admin`, `platform_admin`, `yalla_hack_employee`, `super_admin` |
| `userStatus`        | `active`, `pending`, `suspended`                                                                                                               |
| `userOAuthStatus`   | `active`, `invited`, `suspended`                                                                                                               |
| `orgMemberRole`     | `owner`, `admin`, `compliance_officer`, `analyst`                                                                                              |
| `orgMemberStatus`   | `active`, `invited`, `suspended`                                                                                                               |

### Billing

| Enum                 | Values                                                               |
| -------------------- | -------------------------------------------------------------------- |
| `plan` / `paidPlan`  | `free_trial`, `starter`, `professional`, `enterprise`                |
| `billingInterval`    | `monthly`, `quarterly`, `biannual`, `annual`                         |
| `subscriptionStatus` | `trialing`, `active`, `past_due`, `canceled`, `incomplete`, `paused` |
| `billingEventStatus` | `success`, `failed`, `pending`, `refunded`                           |

### Compliance

| Enum               | Values                                                                                                                |
| ------------------ | --------------------------------------------------------------------------------------------------------------------- |
| `assessmentStatus` | `compliant`, `partial`, `non_compliant`, `unknown`                                                                    |
| `mappingType`      | `equivalent`, `related`, `conflicting`, `complementary`                                                               |
| `relationshipType` | `overlap`, `conflict`, `harmonization`, `coordination`, `gap`, `dependency`                                           |
| `reportType`       | `full_compliance`, `gap_analysis`, `vendor_assessment`, `risk_assessment`, `executive_summary`, `regulatory_deadline` |
| `reportStatus`     | `generating`, `ready`, `failed`, `archived`                                                                           |

### Risk & Incident

| Enum           | Values                                             |
| -------------- | -------------------------------------------------- |
| `priority`     | `low`, `medium`, `high`                            |
| `severity`     | `low`, `medium`, `high`, `critical`                |
| `criticality`  | `low`, `medium`, `high`, `critical`                |
| `riskCategory` | (vendor risk categories)                           |
| `taskSeverity` | `critical`, `high`, `medium`, `low`                |
| `taskStatus`   | `open`, `in_progress`, `resolved`, `accepted_risk` |

### Audit & Notifications

| Enum                   | Values                                                                |
| ---------------------- | --------------------------------------------------------------------- |
| `auditLogCategory`     | `auth`, `data_write`, `data_read`, `role_change`, `system`, `billing` |
| `auditLogOutcome`      | `success`, `failure`, `blocked`                                       |
| `notificationCategory` | `registration`, `consultation`, `assessment`, `support`, `system`     |
| `actorType`            | `visitor`, `client`, `admin`, `system`                                |

### Locale

| Enum     | Values           |
| -------- | ---------------- |
| `locale` | `en`, `ar`, `zh` |

## Migration Strategy

The schema evolves through three complementary mechanisms (all idempotent):

1. **Drizzle migrations** (`drizzle/*.sql`) — base schema (46 tables) applied by `drizzle-kit migrate`, `scripts/migrate-production.mjs` (Docker/VPS), or `supabase db push` (linked project).
2. **Runtime auto-migrate** (`server/_core/auto-migrate.ts`) — on server boot, creates the remaining tables (`otpCodes`, `yallaAdminSessions`, `knowledgeGraphNodes`, `notifications`, etc.) and repairs column drift with `ADD COLUMN IF NOT EXISTS`. This keeps fresh deployments schema-complete without manual steps.
3. **Seed data** — `pnpm seed:all` loads compliance frameworks, knowledge graph, and demo data; framework reference data is also re-upserted at boot.

The Drizzle journal/snapshot is intentionally not the source of truth for post-0000 tables; always verify a live database with `pnpm db:doctor` (compares all 62 expected tables against the connected database). If `drizzle-kit generate` produces a large diff after schema changes, that is expected drift from the journal — review the generated SQL before applying.

## Key Design Decisions

1. **Surrogate keys** — All tables use `serial` primary keys for join performance
2. **Organization isolation** — Every tenant-scoped table has `orgId` foreign key
3. **Row-Level Security** — RLS policies enforce `orgId` scoping at database level
4. **JSONB for flexibility** — Vendor profiles, simulation results, and user preferences use `jsonb` columns
5. **Audit trail** — All mutations logged via `auditLogs` table
6. **Soft deletes** — Resources are archived rather than physically deleted where appropriate
7. **Enum-heavy** — Enums enforce data integrity at the database level for status/type fields
