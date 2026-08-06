# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in DJAC, please do **not** open a public issue. Instead, report it privately to the maintainers.

**Response time**: We aim to acknowledge reports within 48 hours and provide a fix timeline within 5 business days.

**Scope**: Vulnerabilities in the DJAC platform, its dependencies, or its infrastructure configuration.

**Out of scope**: Social engineering, physical security, and denial-of-service attacks against the deployed application.

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Security Architecture

DJAC implements defense-in-depth across multiple layers:

### Authentication

- Passwords hashed with bcrypt (12 rounds)
- JWT tokens signed with HS256 (minimum 64-character secret in production)
- HTTP-only, Secure, SameSite cookies for session tokens
- TOTP-based MFA with backup codes
- OTP-based password reset with SHA-256 hashing and 5-minute expiry
- Rate limiting: 10 auth attempts/minute/IP
- Triple auth path: Clerk OAuth, Supabase Auth, Local JWT

### Authorization

- Role-Based Access Control with 7 platform roles and 4 organization roles
- 32 permission-gated modules, each with 6 granular permission flags
- Row-Level Security (RLS) on all PostgreSQL tables
- Organization-scoped data isolation via `organizationId` on every query

### Data Protection

- All data encrypted in transit (HTTPS/TLS, enforced by Vercel)
- PostgreSQL encrypted at rest (Supabase managed)
- Secrets stored in Vercel environment variables and GitHub Actions secrets
- No secrets in code, configuration files, or version control

### API Security

- Zod input validation on all tRPC procedures (no raw input)
- Drizzle ORM parameterized queries (no SQL injection)
- Rate limiting at Express middleware level (120 req/min general, 10 req/min auth)
- CSP headers with restricted policies per route
- CORS restricted to production domain
- Stripe webhook signature verification

### Infrastructure

- Vercel edge network with built-in DDoS protection and WAF
- Supabase managed PostgreSQL with daily automated backups
- Sentry real-time error monitoring
- Dependabot automated dependency vulnerability alerts
- pnpm overrides for patching known CVEs in transitive dependencies
- CodeQL security analysis in CI pipeline

## Security Headers

| Header                    | Value                               |
| ------------------------- | ----------------------------------- |
| Strict-Transport-Security | max-age=63072000; includeSubDomains |
| X-Content-Type-Options    | nosniff                             |
| X-Frame-Options           | DENY                                |
| Content-Security-Policy   | Restricted per route                |
| Referrer-Policy           | strict-origin-when-cross-origin     |
| Permissions-Policy        | Minimal set                         |

## Best Practices for Deployments

- Set `JWT_SECRET` to at least 64 random characters in production
- Enable `ALLOW_IN_MEMORY_PERSISTENCE=false` in production
- Set `DEV_AUTH_BYPASS=false` in production
- Configure Yalla Admin with IP allowlist and strong password
- Rotate API keys and service account credentials regularly
- Keep `COOKIE_DOMAIN` scoped to your production domain
- Monitor Sentry for authentication anomalies
- Review audit logs regularly via the Yalla Admin panel
