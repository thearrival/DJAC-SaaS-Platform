# DJAC SaaS - API Documentation

## Overview

The API uses **tRPC** for type-safe RPC calls. All requests go through `POST /api/trpc` with batch support. The Express server also exposes REST endpoints for webhooks and health checks.

## Base URL

- Production: `https://your-app.com`
- Local: `http://localhost:3000`

## Authentication

The API uses JWT-based authentication stored in HTTP-only cookies.

### Login
```
POST /api/trpc/localAuth.login
```
```json
{
  "email": "user@example.com",
  "password": "securePassword123!"
}
```

### Session
The authenticated session is automatically sent via cookie on subsequent requests.

## API Endpoints

### Health & Readiness

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check (always returns 200) |
| `/api/readyz` | GET | Readiness check (returns 503 if degraded) |

### Authentication (tRPC procedures)

| Procedure | Auth | Description |
|-----------|------|-------------|
| `auth.me` | Public | Get current user (null if unauthenticated) |
| `auth.logout` | Public | Clear session cookie |
| `auth.updateProfile` | Protected | Update user profile |
| `localAuth.register` | Public | Register new user |
| `localAuth.login` | Public | Login with email/password |
| `localAuth.forgotPassword` | Public | Request password reset |
| `localAuth.resetPassword` | Public | Reset password with token |

### Organization (tRPC procedures)

| Procedure | Auth | Description |
|-----------|------|-------------|
| `org.create` | Protected | Create new organization |
| `org.get` | Org Member | Get organization details |
| `org.update` | Org Admin | Update organization |
| `org.members.list` | Org Member | List organization members |
| `org.members.invite` | Org Admin | Invite new member |

### Compliance (tRPC procedures)

| Procedure | Auth | Description |
|-----------|------|-------------|
| `compliance.frameworks.list` | Public | List all frameworks |
| `compliance.frameworks.get` | Public | Get framework details |
| `compliance.controls.list` | Public | List controls for framework |
| `compliance.reports.list` | Org Member | List compliance reports |
| `compliance.reports.generate` | Org Admin | Generate new report |

### Vendors (tRPC procedures)

| Procedure | Auth | Description |
|-----------|------|-------------|
| `vendor.list` | Org Member | List vendors |
| `vendor.get` | Org Member | Get vendor details |
| `vendor.create` | Org Member | Create vendor |
| `vendor.update` | Org Admin | Update vendor |
| `vendor.delete` | Org Admin | Delete vendor |
| `vendor.assess` | Compliance Officer | Run vendor assessment |

### Risk & Remediation (tRPC procedures)

| Procedure | Auth | Description |
|-----------|------|-------------|
| `risk.list` | Org Member | List risk register |
| `risk.create` | Compliance Officer | Add risk entry |
| `risk.update` | Compliance Officer | Update risk |
| `remediation.list` | Org Member | List remediation tasks |
| `remediation.update` | Compliance Officer | Update task status |

### Incident Management (tRPC procedures)

| Procedure | Auth | Description |
|-----------|------|-------------|
| `incident.list` | Org Member | List incidents |
| `incident.create` | Org Member | Report incident |
| `incident.update` | Compliance Officer | Update incident |

## WebSocket

AI job status updates are available via WebSocket at `/ws/ai-jobs`.

## Rate Limiting

- General API: 120 requests per minute per IP
- Auth endpoints: 10 requests per minute per IP
- Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## Supabase Edge Functions

| Function | Endpoint | Description |
|----------|----------|-------------|
| `send-notification` | `/functions/v1/send-notification` | Create notifications |
| `compliance-webhook` | `/functions/v1/compliance-webhook` | Handle webhook events |
| `report-export` | `/functions/v1/report-export` | Export reports in JSON/CSV |
| `auth-hooks` | `/functions/v1/auth-hooks` | Sync auth users to DB |
