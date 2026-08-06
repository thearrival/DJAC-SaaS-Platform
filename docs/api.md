# DJAC SaaS - API Reference

## Overview

DJAC exposes a **tRPC** API for type-safe RPC operations, with REST endpoints for webhooks, health checks, and OAuth callbacks. All tRPC requests go through `POST /api/trpc` with batch support.

## Base URL

- Production: `https://app.yalla-hack.ae`
- Local: `http://localhost:3000`

## Authentication

JWT-based authentication via HTTP-only cookies. Include the session cookie on all requests. Public endpoints are documented below.

### Auth Headers

| Header                  | Value              | Required            |
| ----------------------- | ------------------ | ------------------- |
| `Cookie`                | `app_session_id=…` | Protected endpoints |
| `x-djac-api-key`        | `djac_<hex>`       | API key access      |
| `X-RateLimit-Limit`     | (response)         | Rate limit info     |
| `X-RateLimit-Remaining` | (response)         | Remaining requests  |
| `X-RateLimit-Reset`     | (response)         | Reset timestamp     |

## REST Endpoints

### Health & Readiness

| Endpoint         | Method | Auth | Description                                  |
| ---------------- | ------ | ---- | -------------------------------------------- |
| `/api/health`    | GET    | None | Health check (status, uptime, scale profile) |
| `/api/healthz`   | GET    | None | Liveness probe (always 200)                  |
| `/api/readiness` | GET    | None | Readiness check (DB, Redis, Stripe, AI)      |
| `/api/readyz`    | GET    | None | Alias for readiness                          |
| `/health`        | GET    | None | Alias for health                             |
| `/readiness`     | GET    | None | Alias for readiness                          |

### Webhooks

| Endpoint               | Method | Auth             | Description           |
| ---------------------- | ------ | ---------------- | --------------------- |
| `/api/webhooks/stripe` | POST   | Stripe signature | Stripe billing events |
| `/api/csp-report`      | POST   | None             | CSP violation reports |

### OAuth

| Endpoint              | Method | Auth | Description            |
| --------------------- | ------ | ---- | ---------------------- |
| `/api/oauth/callback` | GET    | None | OAuth redirect handler |

### Supabase Edge Functions

| Function             | Endpoint                           | Auth         | Description           |
| -------------------- | ---------------------------------- | ------------ | --------------------- |
| `send-notification`  | `/functions/v1/send-notification`  | Service role | Create notifications  |
| `compliance-webhook` | `/functions/v1/compliance-webhook` | Service role | Compliance events     |
| `report-export`      | `/functions/v1/report-export`      | Service role | Export reports        |
| `auth-hooks`         | `/functions/v1/auth-hooks`         | Service role | Sync auth users to DB |

## tRPC Router Reference

The tRPC API is composed of 42 routers with 200+ procedures. All mutations use Zod validation. Procedures are organized by domain.

### Authentication (`localAuth`, `auth`, `googleAuth`)

| Procedure                       | Auth      | Description                        |
| ------------------------------- | --------- | ---------------------------------- |
| `localAuth.register`            | Public    | Register with email/password       |
| `localAuth.login`               | Public    | Login with email/password          |
| `localAuth.forgotPassword`      | Public    | Request password reset OTP         |
| `localAuth.resetPassword`       | Public    | Reset password with OTP token      |
| `localAuth.setupMfa`            | Protected | Generate TOTP secret and QR code   |
| `localAuth.verifyMfa`           | Protected | Verify TOTP code and enable MFA    |
| `localAuth.disableMfa`          | Protected | Disable MFA                        |
| `localAuth.generateBackupCodes` | Protected | Generate MFA backup codes          |
| `localAuth.refreshSession`      | Protected | Rotate session token               |
| `auth.me`                       | Public    | Get current user (null if anon)    |
| `auth.logout`                   | Public    | Clear session cookie               |
| `auth.updateProfile`            | Protected | Update name, locale, preferences   |
| `googleAuth.authUrl`            | Public    | Get Google OAuth authorization URL |
| `googleAuth.callback`           | Public    | Handle Google OAuth callback       |
| `githubAuth.authUrl`            | Public    | Get GitHub OAuth authorization URL |

### Organization (`orgSettings`, `orgMembers`, `portal`)

| Procedure                     | Auth       | Description                         |
| ----------------------------- | ---------- | ----------------------------------- |
| `orgSettings.create`          | Protected  | Create new organization             |
| `orgSettings.get`             | Org Member | Get organization details            |
| `orgSettings.update`          | Org Admin  | Update organization profile         |
| `orgSettings.getJurisdiction` | Org Member | Get org jurisdiction settings       |
| `orgMembers.list`             | Org Member | List members with roles             |
| `orgMembers.invite`           | Org Admin  | Invite user by email                |
| `orgMembers.updateRole`       | Org Admin  | Change member role                  |
| `orgMembers.remove`           | Org Admin  | Remove member from org              |
| `portal.getUserOrgs`          | Protected  | List organizations for current user |
| `portal.switchOrg`            | Protected  | Switch active organization          |

### Role & Permissions (`role`, `rbac`)

| Procedure                   | Auth        | Description                        |
| --------------------------- | ----------- | ---------------------------------- |
| `role.list`                 | Org Admin   | List available platform roles      |
| `role.assign`               | Super Admin | Assign platform role to user       |
| `rbac.getPermissions`       | Org Member  | Get current user's permissions     |
| `rbac.getModulePermissions` | Org Admin   | Get permissions for a module       |
| `rbac.setModulePermissions` | Org Admin   | Set custom module permissions      |
| `rbac.listRolePermissions`  | Org Admin   | List all role permission overrides |

### Compliance Frameworks (`compliance`, `regulatoryChanges`)

| Procedure                       | Auth       | Description                           |
| ------------------------------- | ---------- | ------------------------------------- |
| `compliance.frameworks.list`    | Public     | List all regulatory frameworks        |
| `compliance.frameworks.get`     | Public     | Get framework with controls           |
| `compliance.controls.list`      | Public     | List controls for a framework         |
| `compliance.controls.get`       | Public     | Get control detail                    |
| `compliance.mappings.list`      | Public     | List cross-framework control mappings |
| `compliance.jurisdictions.list` | Public     | List supported jurisdictions          |
| `regulatoryChanges.list`        | Org Member | List regulatory change events         |
| `regulatoryChanges.subscribe`   | Org Member | Subscribe to jurisdiction updates     |
| `regulatoryChanges.getImpacts`  | Org Member | Get impact analysis for changes       |

### Vendor Management (`vendor`, `vendorCompliance`)

| Procedure                  | Auth               | Description                      |
| -------------------------- | ------------------ | -------------------------------- |
| `vendor.list`              | Org Member         | List vendors with filters        |
| `vendor.get`               | Org Member         | Get vendor details               |
| `vendor.create`            | Org Member         | Register new vendor              |
| `vendor.update`            | Org Admin          | Update vendor profile            |
| `vendor.delete`            | Org Admin          | Remove vendor                    |
| `vendor.getTechStack`      | Org Member         | Get vendor technology stack      |
| `vendorCompliance.list`    | Org Member         | List vendor compliance profiles  |
| `vendorCompliance.get`     | Org Member         | Get vendor compliance profile    |
| `vendorCompliance.create`  | Compliance Officer | Create vendor compliance profile |
| `vendorCompliance.assess`  | Compliance Officer | Run AI vendor assessment         |
| `vendorCompliance.getGaps` | Org Member         | Get assessment gaps              |
| `vendorCompliance.share`   | Org Admin          | Share vendor profile             |

### Risk & Remediation (`riskRegister`, `remediation`)

| Procedure                 | Auth               | Description                |
| ------------------------- | ------------------ | -------------------------- |
| `riskRegister.list`       | Org Member         | List risk register entries |
| `riskRegister.get`        | Org Member         | Get risk entry detail      |
| `riskRegister.create`     | Compliance Officer | Create risk entry          |
| `riskRegister.update`     | Compliance Officer | Update risk entry          |
| `riskRegister.delete`     | Compliance Officer | Delete risk entry          |
| `remediation.list`        | Org Member         | List remediation tasks     |
| `remediation.get`         | Org Member         | Get task detail            |
| `remediation.create`      | Compliance Officer | Create remediation task    |
| `remediation.update`      | Compliance Officer | Update task status/details |
| `remediation.delete`      | Compliance Officer | Delete task                |
| `remediation.getEvidence` | Org Member         | Get task evidence items    |

### Policy & Incident Management (`policyManager`, `incidentRegister`)

| Procedure                          | Auth               | Description                     |
| ---------------------------------- | ------------------ | ------------------------------- |
| `policyManager.list`               | Org Member         | List policies with versions     |
| `policyManager.get`                | Org Member         | Get policy detail               |
| `policyManager.create`             | Compliance Officer | Create new policy               |
| `policyManager.update`             | Compliance Officer | Update policy                   |
| `policyManager.publish`            | Compliance Officer | Publish new policy version      |
| `policyManager.getAcknowledgments` | Org Admin          | Get staff acknowledgment status |
| `incidentRegister.list`            | Org Member         | List incidents                  |
| `incidentRegister.get`             | Org Member         | Get incident detail             |
| `incidentRegister.create`          | Org Member         | Report new incident             |
| `incidentRegister.update`          | Compliance Officer | Update incident status          |
| `incidentRegister.getTimeline`     | Org Member         | Get incident timeline           |

### Audit & Evidence (`auditSchedule`, `evidence`)

| Procedure                  | Auth               | Description               |
| -------------------------- | ------------------ | ------------------------- |
| `auditSchedule.list`       | Org Member         | List scheduled audits     |
| `auditSchedule.get`        | Org Member         | Get audit detail          |
| `auditSchedule.create`     | Compliance Officer | Schedule new audit        |
| `auditSchedule.update`     | Compliance Officer | Update audit              |
| `auditSchedule.addFinding` | Compliance Officer | Add audit finding         |
| `evidence.list`            | Org Member         | List evidence containers  |
| `evidence.get`             | Org Member         | Get container contents    |
| `evidence.create`          | Compliance Officer | Create evidence container |
| `evidence.upload`          | Compliance Officer | Upload evidence file      |
| `evidence.download`        | Org Member         | Download evidence file    |
| `evidence.delete`          | Compliance Officer | Delete evidence item      |

### CTEM & Asset Inventory (`ctem`, `assetInventory`)

| Procedure                 | Auth               | Description            |
| ------------------------- | ------------------ | ---------------------- |
| `ctem.list`               | Org Member         | List CTEM assessments  |
| `ctem.get`                | Org Member         | Get assessment detail  |
| `ctem.create`             | Compliance Officer | Create CTEM assessment |
| `ctem.getAssets`          | Org Member         | List tracked assets    |
| `ctem.getVulnerabilities` | Org Member         | List vulnerabilities   |
| `ctem.getRiskScores`      | Org Member         | Get risk scores        |
| `assetInventory.list`     | Org Member         | List IT assets         |
| `assetInventory.get`      | Org Member         | Get asset detail       |
| `assetInventory.create`   | Org Member         | Register asset         |
| `assetInventory.update`   | Org Admin          | Update asset           |
| `assetInventory.delete`   | Org Admin          | Remove asset           |

### DSR & Service Requests (`dsr`, `serviceRequests`)

| Procedure                | Auth               | Description                |
| ------------------------ | ------------------ | -------------------------- |
| `dsr.list`               | Org Member         | List data subject requests |
| `dsr.get`                | Org Member         | Get DSR detail             |
| `dsr.create`             | Org Member         | Create DSR                 |
| `dsr.update`             | Compliance Officer | Update DSR status          |
| `dsr.fulfill`            | Compliance Officer | Mark DSR as fulfilled      |
| `serviceRequests.list`   | Org Member         | List service requests      |
| `serviceRequests.get`    | Org Member         | Get request detail         |
| `serviceRequests.create` | Org Member         | Create service request     |
| `serviceRequests.update` | Org Admin          | Update request             |

### Security Maturity & Threat Intel (`securityMaturity`, `threatIntel`)

| Procedure                 | Auth               | Description                    |
| ------------------------- | ------------------ | ------------------------------ |
| `securityMaturity.list`   | Org Member         | List maturity assessments      |
| `securityMaturity.get`    | Org Member         | Get assessment detail          |
| `securityMaturity.create` | Compliance Officer | Start maturity assessment      |
| `securityMaturity.update` | Compliance Officer | Update scores                  |
| `threatIntel.list`        | Org Member         | List threat intelligence items |
| `threatIntel.get`         | Org Member         | Get threat detail              |
| `threatIntel.create`      | Compliance Officer | Add threat intel item          |

### AI (`ai`)

| Procedure            | Auth               | Description                      |
| -------------------- | ------------------ | -------------------------------- |
| `ai.startAssessment` | Compliance Officer | Start AI vendor assessment job   |
| `ai.getJob`          | Org Member         | Get AI job status                |
| `ai.listJobs`        | Org Member         | List recent AI jobs              |
| `ai.cancelJob`       | Compliance Officer | Cancel running AI job            |
| `ai.getResult`       | Org Member         | Get completed assessment results |

### Compliance Reports (`complianceReport`)

| Procedure                   | Auth       | Description               |
| --------------------------- | ---------- | ------------------------- |
| `complianceReport.list`     | Org Member | List generated reports    |
| `complianceReport.get`      | Org Member | Get report detail         |
| `complianceReport.generate` | Org Admin  | Generate new report       |
| `complianceReport.download` | Org Member | Download report file      |
| `complianceReport.share`    | Org Admin  | Share report via email    |
| `complianceReport.schedule` | Org Admin  | Schedule recurring report |
| `complianceReport.delete`   | Org Admin  | Delete report             |

### Compliance Chat & Simulation (`complianceChat`, `complianceSimulation`)

| Procedure                   | Auth       | Description                   |
| --------------------------- | ---------- | ----------------------------- |
| `complianceChat.send`       | Org Member | Send message to compliance AI |
| `complianceChat.getHistory` | Org Member | Get chat history              |
| `complianceSimulation.run`  | Org Admin  | Run what-if simulation        |
| `complianceSimulation.list` | Org Member | List past simulations         |
| `complianceSimulation.get`  | Org Member | Get simulation results        |

### Knowledge Graph & Cross-Border Flow (`knowledgeGraph`, `crossBorderFlow`)

| Procedure                          | Auth       | Description                        |
| ---------------------------------- | ---------- | ---------------------------------- |
| `knowledgeGraph.getNode`           | Org Member | Get knowledge graph node           |
| `knowledgeGraph.getEdges`          | Org Member | Get relationships for node         |
| `knowledgeGraph.search`            | Org Member | Search knowledge graph             |
| `crossBorderFlow.analyze`          | Org Member | Analyze cross-border data transfer |
| `crossBorderFlow.getJurisdictions` | Org Member | Get supported jurisdictions        |

### Billing (`billing`)

| Procedure                       | Auth      | Description                  |
| ------------------------------- | --------- | ---------------------------- |
| `billing.getPlans`              | Public    | List subscription plans      |
| `billing.getSubscription`       | Org Admin | Get current subscription     |
| `billing.createCheckoutSession` | Org Admin | Start Stripe checkout        |
| `billing.createPortalSession`   | Org Admin | Start Stripe customer portal |
| `billing.getBillingHistory`     | Org Admin | Get billing events           |

### Deadlines & Scorecard (`deadlines`, `scorecard`)

| Procedure            | Auth               | Description               |
| -------------------- | ------------------ | ------------------------- |
| `deadlines.list`     | Org Member         | List compliance deadlines |
| `deadlines.get`      | Org Member         | Get deadline detail       |
| `deadlines.create`   | Compliance Officer | Add deadline              |
| `deadlines.update`   | Compliance Officer | Update deadline           |
| `scorecard.list`     | Org Member         | List scorecard snapshots  |
| `scorecard.get`      | Org Member         | Get scorecard detail      |
| `scorecard.generate` | Org Admin          | Generate new scorecard    |

### Notifications (`notifications`)

| Procedure                         | Auth      | Description                  |
| --------------------------------- | --------- | ---------------------------- |
| `notifications.list`              | Protected | List user notifications      |
| `notifications.markRead`          | Protected | Mark notification as read    |
| `notifications.markAllRead`       | Protected | Mark all as read             |
| `notifications.getPreferences`    | Protected | Get notification preferences |
| `notifications.updatePreferences` | Protected | Update preferences           |

### API Keys (`apiKeys`)

| Procedure          | Auth      | Description               |
| ------------------ | --------- | ------------------------- |
| `apiKeys.list`     | Org Admin | List API keys for org     |
| `apiKeys.create`   | Org Admin | Create new API key        |
| `apiKeys.revoke`   | Org Admin | Revoke API key            |
| `apiKeys.getUsage` | Org Admin | Get API key usage metrics |

### Onboarding (`onboarding`)

| Procedure                    | Auth      | Description                 |
| ---------------------------- | --------- | --------------------------- |
| `onboarding.getProgress`     | Protected | Get onboarding stage        |
| `onboarding.setAccountType`  | Protected | Set account intent          |
| `onboarding.setJurisdiction` | Protected | Set preferred jurisdiction  |
| `onboarding.complete`        | Protected | Mark onboarding as complete |

### Analytics & Personalization (`analytics`, `personalization`)

| Procedure                        | Auth      | Description                  |
| -------------------------------- | --------- | ---------------------------- |
| `analytics.getDashboard`         | Org Admin | Get org analytics dashboard  |
| `analytics.getEvents`            | Org Admin | Get analytics events         |
| `personalization.getPreferences` | Protected | Get user preferences         |
| `personalization.update`         | Protected | Update theme, locale, layout |

### Customer 360 (`customer360`)

| Procedure                    | Auth           | Description                  |
| ---------------------------- | -------------- | ---------------------------- |
| `customer360.listWorkspaces` | Yalla Employee | List all customer workspaces |
| `customer360.getWorkspace`   | Yalla Employee | Get workspace detail         |
| `customer360.getActivity`    | Yalla Employee | Get workspace activity       |

### Admin & System (`admin`, `system`)

| Procedure                | Auth           | Description             |
| ------------------------ | -------------- | ----------------------- |
| `admin.getStats`         | Yalla Employee | Get platform statistics |
| `admin.getAuditLogs`     | Yalla Employee | List system audit logs  |
| `admin.getOrganizations` | Yalla Employee | List all organizations  |
| `admin.suspendUser`      | Yalla Employee | Suspend user account    |
| `admin.unsuspendUser`    | Yalla Employee | Unsuspend user account  |
| `system.health`          | Public         | System health status    |
| `system.version`         | Public         | API version info        |

## WebSocket

AI job status updates are available at `/ws/ai-jobs`. The WebSocket emits:

| Event          | Direction     | Description               |
| -------------- | ------------- | ------------------------- |
| `job:progress` | Server→Client | Stage update with message |
| `job:complete` | Server→Client | Assessment result         |
| `job:error`    | Server→Client | Error details             |
| `subscribe`    | Client→Server | Subscribe to job by ID    |
| `unsubscribe`  | Client→Server | Unsubscribe from job      |

## Rate Limiting

| Scope          | Limit               | Response Headers                                                  |
| -------------- | ------------------- | ----------------------------------------------------------------- |
| General API    | 120 req/min per IP  | `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` |
| Auth endpoints | 10 req/min per IP   | Same as above                                                     |
| Health checks  | Unlimited           | N/A                                                               |
| Admin panel    | 300 req/5min per IP | Custom headers                                                    |

## Error Response Format

All errors follow a consistent format:

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required (10001)",
    "details": {}
  }
}
```

### Error Codes

| Code                  | Description                      |
| --------------------- | -------------------------------- |
| `UNAUTHORIZED`        | Authentication required          |
| `FORBIDDEN`           | Insufficient permissions         |
| `NOT_FOUND`           | Resource not found               |
| `VALIDATION_ERROR`    | Input validation failed          |
| `RATE_LIMITED`        | Too many requests                |
| `ORG_REQUIRED`        | Organization membership required |
| `INTERNAL_ERROR`      | Unexpected server error          |
| `SERVICE_UNAVAILABLE` | Service degraded or unavailable  |

## API Key Access

API keys use the `djac_` prefix and can be used as an alternative to session cookies:

```http
POST /api/trpc/vendor.list
Content-Type: application/json
x-djac-api-key: djac_a1b2c3d4e5f6g7h8i9j0

{
  "orgId": "org_abc123"
}
```

API keys inherit the permissions of the user who created them and are scoped to a single organization.
