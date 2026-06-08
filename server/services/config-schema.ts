// ── config-schema.ts ───────────────────────────────────────────────────────
// Centralised environment-variable parsing.  All values are optional with
// sensible defaults so the server can start in development without a fully-
// populated .env file.  Production startup guards live in env.ts.
// ──────────────────────────────────────────────────────────────────────────

const _isProduction = process.env.NODE_ENV === "production";
const _isDevelopment = process.env.NODE_ENV === "development";

// ── Helpers ────────────────────────────────────────────────────────────────
function intEnv(raw: string | undefined, fallback: number, min: number, max: number): number {
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function boolEnv(raw: string | undefined, fallback: boolean): boolean {
  if (raw === undefined || raw === "") return fallback;
  return raw === "true";
}

function strEnv(raw: string | undefined, fallback = ""): string {
  return (raw ?? fallback).trim() || fallback;
}

// ── Parsed env ─────────────────────────────────────────────────────────────
export const parsedEnv = {
  NODE_ENV: process.env.NODE_ENV ?? "development",

  // ── App ───────────────────────────────────────────────────────────────────
  VITE_APP_ID: process.env.VITE_APP_ID ?? "",
  JWT_SECRET:
    process.env.JWT_SECRET ??
    (!_isProduction ? "djac-dev-local-only-not-for-production-use-set-jwt-secret" : ""),
  DATABASE_URL: process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_PRISMA_URL || "",
  OAUTH_SERVER_URL: process.env.OAUTH_SERVER_URL ?? "",
  OWNER_OPEN_ID: process.env.OWNER_OPEN_ID ?? "",
  APP_URL: (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, ""),

  // ── Forge ─────────────────────────────────────────────────────────────────
  BUILT_IN_FORGE_API_URL: process.env.BUILT_IN_FORGE_API_URL ?? "",
  BUILT_IN_FORGE_API_KEY: process.env.BUILT_IN_FORGE_API_KEY ?? "",

  // ── Dev auth bypass ───────────────────────────────────────────────────────
  DEV_AUTH_BYPASS: _isDevelopment && process.env.DEV_AUTH_BYPASS === "true",
  DEV_AUTH_OPEN_ID: process.env.DEV_AUTH_OPEN_ID ?? "local-dev-user",
  DEV_AUTH_NAME: process.env.DEV_AUTH_NAME ?? "Local Developer",
  DEV_AUTH_EMAIL: process.env.DEV_AUTH_EMAIL ?? "",
  DEV_AUTH_ROLE: process.env.DEV_AUTH_ROLE,

  // ── AI ────────────────────────────────────────────────────────────────────
  AI_ORCHESTRATOR_ENABLED: process.env.AI_ORCHESTRATOR_ENABLED !== "false",
  AI_QUEUE_MODE: process.env.AI_QUEUE_MODE,
  AI_JOB_HISTORY_FILE: (
    process.env.AI_JOB_HISTORY_FILE ??
    (_isDevelopment ? ".runtime/ai-job-history.json" : "")
  ).trim(),
  REDIS_URL: process.env.REDIS_URL ?? "",
  AGENT_SWARM_BASE_URL: process.env.AGENT_SWARM_BASE_URL ?? "",
  AI_WEBSOCKET_PATH: process.env.AI_WEBSOCKET_PATH ?? "/ws/ai-jobs",
  AI_VALIDATOR_MAX_RETRIES: intEnv(process.env.AI_VALIDATOR_MAX_RETRIES, 1, 0, 5),
  AI_JOB_TIMEOUT_MS: intEnv(process.env.AI_JOB_TIMEOUT_MS, 45_000, 1_000, 300_000),
  AI_RAG_TOP_K: intEnv(process.env.AI_RAG_TOP_K, 12, 1, 100),

  // ── Stripe / Billing ──────────────────────────────────────────────────────
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ?? "",
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET ?? "",

  // ── SMTP ──────────────────────────────────────────────────────────────────
  SMTP_HOST: strEnv(process.env.SMTP_HOST),
  SMTP_PORT: intEnv(process.env.SMTP_PORT, 587, 1, 65_535),
  SMTP_SECURE: boolEnv(process.env.SMTP_SECURE, false),
  SMTP_USER: process.env.SMTP_USER ?? "",
  SMTP_PASS: process.env.SMTP_PASS ?? "",
  SMTP_FROM: strEnv(process.env.SMTP_FROM),

  // ── Reporting ─────────────────────────────────────────────────────────────
  REPORT_TEMPLATE_NAME:
    strEnv(process.env.REPORT_TEMPLATE_NAME, "Yalla Hack Official Report Template") ||
    "Yalla Hack Official Report Template",

  // ── Interaction retention ─────────────────────────────────────────────────
  INTERACTION_RETENTION_AUTORUN: boolEnv(
    process.env.INTERACTION_RETENTION_AUTORUN,
    _isProduction,
  ),
  INTERACTION_RETENTION_DAYS: intEnv(process.env.INTERACTION_RETENTION_DAYS, 90, 7, 365),
  INTERACTION_RETENTION_INTERVAL_HOURS: intEnv(
    process.env.INTERACTION_RETENTION_INTERVAL_HOURS,
    24,
    1,
    168,
  ),

  // ── Database ──────────────────────────────────────────────────────────────
  ALLOW_IN_MEMORY_PERSISTENCE: boolEnv(process.env.ALLOW_IN_MEMORY_PERSISTENCE, _isDevelopment),
  DATABASE_POOL_SIZE: intEnv(
    process.env.DATABASE_POOL_SIZE,
    _isProduction ? 25 : 5,
    1,
    100,
  ),

  // ── HTTP / Timeouts ───────────────────────────────────────────────────────
  COMPLIANCE_CACHE_TTL_MS: intEnv(
    process.env.COMPLIANCE_CACHE_TTL_MS,
    _isProduction ? 60_000 : 10_000,
    1_000,
    3_600_000,
  ),
  HTTP_KEEP_ALIVE_TIMEOUT_MS: intEnv(process.env.HTTP_KEEP_ALIVE_TIMEOUT_MS, 65_000, 1_000, 300_000),
  HTTP_HEADERS_TIMEOUT_MS: intEnv(process.env.HTTP_HEADERS_TIMEOUT_MS, 66_000, 2_000, 300_000),
  HTTP_REQUEST_TIMEOUT_MS: intEnv(process.env.HTTP_REQUEST_TIMEOUT_MS, 120_000, 1_000, 600_000),

  // ── Stripe price IDs ──────────────────────────────────────────────────────
  STRIPE_PRICE_STARTER_MONTHLY: process.env.STRIPE_PRICE_STARTER_MONTHLY ?? "",
  STRIPE_PRICE_STARTER_QUARTERLY: process.env.STRIPE_PRICE_STARTER_QUARTERLY ?? "",
  STRIPE_PRICE_STARTER_BIANNUAL: process.env.STRIPE_PRICE_STARTER_BIANNUAL ?? "",
  STRIPE_PRICE_STARTER_ANNUAL: process.env.STRIPE_PRICE_STARTER_ANNUAL ?? "",
  STRIPE_PRICE_PRO_MONTHLY: process.env.STRIPE_PRICE_PRO_MONTHLY ?? "",
  STRIPE_PRICE_PRO_QUARTERLY: process.env.STRIPE_PRICE_PRO_QUARTERLY ?? "",
  STRIPE_PRICE_PRO_BIANNUAL: process.env.STRIPE_PRICE_PRO_BIANNUAL ?? "",
  STRIPE_PRICE_PRO_ANNUAL: process.env.STRIPE_PRICE_PRO_ANNUAL ?? "",
  STRIPE_PRICE_ENTERPRISE_MONTHLY: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY ?? "",
  STRIPE_PRICE_ENTERPRISE_ANNUAL: process.env.STRIPE_PRICE_ENTERPRISE_ANNUAL ?? "",

  // ── Supabase ────────────────────────────────────────────────────────────
  SUPABASE_URL: process.env.SUPABASE_URL ?? "",
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ?? "",
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",

  // ── AI / integrations ─────────────────────────────────────────────────────
  OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? "",

  // ── Report generation ─────────────────────────────────────────────────────
  REPORT_NATIVE_PDF_CONVERSION: process.env.REPORT_NATIVE_PDF_CONVERSION !== "false",

  // ── Server ────────────────────────────────────────────────────────────────
  PORT: intEnv(process.env.PORT, 3000, 1, 65_535),

  // ── Sentry ────────────────────────────────────────────────────────────────
  SENTRY_DSN: strEnv(process.env.SENTRY_DSN),

  // ── Yalla-Admin Internal Portal ───────────────────────────────────────────
  YALLA_ADMIN_SECRET: strEnv(process.env.YALLA_ADMIN_SECRET),
  YALLA_ADMIN_USERNAME: strEnv(process.env.YALLA_ADMIN_USERNAME, "yalla_admin"),
  YALLA_ADMIN_PASSWORD: strEnv(process.env.YALLA_ADMIN_PASSWORD),
  YALLA_ADMIN_IP_ALLOWLIST: strEnv(process.env.YALLA_ADMIN_IP_ALLOWLIST),
  YALLA_ADMIN_JWT_SECRET: strEnv(process.env.YALLA_ADMIN_JWT_SECRET),
  YALLA_ADMIN_SESSION_TTL_HOURS: intEnv(process.env.YALLA_ADMIN_SESSION_TTL_HOURS, 8, 1, 72),
} as const;

export type ParsedEnv = typeof parsedEnv;
