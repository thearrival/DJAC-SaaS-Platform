import { parsedEnv } from "../services/config-schema";

// ── Utility: dev-role parser ───────────────────────────────────────────────
const parseDevRole = (
  value: string | undefined,
): | "user" | "admin" | "basic_user" | "professional_user"
  | "company_admin" | "platform_admin" | "yalla_hack_employee" | "super_admin" => {
  const valid = [
    "user", "admin", "basic_user", "professional_user",
    "company_admin", "platform_admin", "yalla_hack_employee", "super_admin",
  ] as const;
  return (valid as readonly string[]).includes(value ?? "")
    ? (value as typeof valid[number])
    : "user";
};

// ── Utility: AI queue-mode resolver ───────────────────────────────────────
function parseQueueMode(value: string | undefined): "in_memory" | "redis" | undefined {
  if (value === "redis" || value === "in_memory") return value;
  return undefined;
}

export function resolveAiQueueMode(
  value: string | undefined,
  options: { isProduction: boolean; redisUrl?: string },
): "in_memory" | "redis" {
  const explicitMode = parseQueueMode(value);
  const hasRedis = Boolean((options.redisUrl ?? "").trim());
  if (options.isProduction && hasRedis) return "redis";
  if (explicitMode) return explicitMode;
  return "in_memory";
}

// ── Utility: Stripe billing config evaluator ──────────────────────────────
export const STRIPE_PRICE_ENV_KEYS = [
  "STRIPE_PRICE_STARTER_MONTHLY",
  "STRIPE_PRICE_STARTER_QUARTERLY",
  "STRIPE_PRICE_STARTER_BIANNUAL",
  "STRIPE_PRICE_STARTER_ANNUAL",
  "STRIPE_PRICE_PRO_MONTHLY",
  "STRIPE_PRICE_PRO_QUARTERLY",
  "STRIPE_PRICE_PRO_BIANNUAL",
  "STRIPE_PRICE_PRO_ANNUAL",
  "STRIPE_PRICE_ENTERPRISE_MONTHLY",
  "STRIPE_PRICE_ENTERPRISE_ANNUAL",
] as const;

type StripeEnvLike = {
  STRIPE_SECRET_KEY?: string | undefined;
  STRIPE_WEBHOOK_SECRET?: string | undefined;
} & Partial<Record<typeof STRIPE_PRICE_ENV_KEYS[number], string | undefined>>;

export function evaluateStripeBillingConfig(env: StripeEnvLike) {
  const configuredPriceKeys = STRIPE_PRICE_ENV_KEYS.filter((key) => Boolean(env[key]?.trim()));
  const hasSecretKey = Boolean(env.STRIPE_SECRET_KEY?.trim());
  const hasWebhookSecret = Boolean(env.STRIPE_WEBHOOK_SECRET?.trim());
  const anyStripeConfigured = hasSecretKey || hasWebhookSecret || configuredPriceKeys.length > 0;
  const missing: string[] = [];

  if (!anyStripeConfigured) {
    return { enabled: false, ready: true, partiallyConfigured: false, missing, configuredPriceCount: 0 };
  }

  if (!hasSecretKey) missing.push("STRIPE_SECRET_KEY");
  if (!hasWebhookSecret) missing.push("STRIPE_WEBHOOK_SECRET");
  for (const key of STRIPE_PRICE_ENV_KEYS) {
    if (!env[key]?.trim()) missing.push(key);
  }

  return {
    enabled: true,
    ready: missing.length === 0,
    partiallyConfigured: missing.length > 0,
    missing,
    configuredPriceCount: configuredPriceKeys.length,
  };
}

// ── ENV ────────────────────────────────────────────────────────────────────
export const ENV = {
  appId: parsedEnv.VITE_APP_ID,
  cookieSecret: parsedEnv.JWT_SECRET,
  databaseUrl: parsedEnv.DATABASE_URL,
  oAuthServerUrl: parsedEnv.OAUTH_SERVER_URL,
  ownerOpenId: parsedEnv.OWNER_OPEN_ID,
  isProduction: parsedEnv.NODE_ENV === "production",
  isDevelopment: parsedEnv.NODE_ENV === "development",
  forgeApiUrl: parsedEnv.BUILT_IN_FORGE_API_URL,
  forgeApiKey: parsedEnv.BUILT_IN_FORGE_API_KEY,
  devAuthBypass: parsedEnv.DEV_AUTH_BYPASS,
  devAuthOpenId: parsedEnv.DEV_AUTH_OPEN_ID,
  devAuthName: parsedEnv.DEV_AUTH_NAME,
  devAuthEmail: parsedEnv.DEV_AUTH_EMAIL,
  devAuthRole: parseDevRole(parsedEnv.DEV_AUTH_ROLE),
  aiOrchestratorEnabled: parsedEnv.AI_ORCHESTRATOR_ENABLED,
  aiQueueMode: resolveAiQueueMode(parsedEnv.AI_QUEUE_MODE, {
    isProduction: parsedEnv.NODE_ENV === "production",
    redisUrl: parsedEnv.REDIS_URL,
  }),
  aiAssessmentEngineDefault: "native" as const,
  aiJobHistoryFile: parsedEnv.AI_JOB_HISTORY_FILE,
  redisUrl: parsedEnv.REDIS_URL,
  agentSwarmBaseUrl: parsedEnv.AGENT_SWARM_BASE_URL,
  aiWebsocketPath: parsedEnv.AI_WEBSOCKET_PATH,
  aiValidatorMaxRetries: parsedEnv.AI_VALIDATOR_MAX_RETRIES,
  aiJobTimeoutMs: parsedEnv.AI_JOB_TIMEOUT_MS,
  aiRagTopK: parsedEnv.AI_RAG_TOP_K,
  stripeSecretKey: parsedEnv.STRIPE_SECRET_KEY,
  stripeWebhookSecret: parsedEnv.STRIPE_WEBHOOK_SECRET,
  appUrl: parsedEnv.APP_URL,
  smtpHost: parsedEnv.SMTP_HOST,
  smtpPort: parsedEnv.SMTP_PORT,
  smtpSecure: parsedEnv.SMTP_SECURE,
  smtpUser: parsedEnv.SMTP_USER,
  smtpPass: parsedEnv.SMTP_PASS,
  smtpFrom: parsedEnv.SMTP_FROM,
  reportTemplateName: parsedEnv.REPORT_TEMPLATE_NAME,
  interactionRetentionAutoRun: parsedEnv.INTERACTION_RETENTION_AUTORUN,
  interactionRetentionDays: parsedEnv.INTERACTION_RETENTION_DAYS,
  interactionRetentionIntervalHours: parsedEnv.INTERACTION_RETENTION_INTERVAL_HOURS,
  allowInMemoryPersistenceFallback: parsedEnv.ALLOW_IN_MEMORY_PERSISTENCE,
  databasePoolSize: parsedEnv.DATABASE_POOL_SIZE,
  complianceCacheTtlMs: parsedEnv.COMPLIANCE_CACHE_TTL_MS,
  httpKeepAliveTimeoutMs: parsedEnv.HTTP_KEEP_ALIVE_TIMEOUT_MS,
  httpHeadersTimeoutMs: parsedEnv.HTTP_HEADERS_TIMEOUT_MS,
  httpRequestTimeoutMs: parsedEnv.HTTP_REQUEST_TIMEOUT_MS,
  sentryDsn: parsedEnv.SENTRY_DSN,
  yallaAdminSecret: parsedEnv.YALLA_ADMIN_SECRET,
  yallaAdminUsername: parsedEnv.YALLA_ADMIN_USERNAME,
  yallaAdminPasswordHash: parsedEnv.YALLA_ADMIN_PASSWORD,
  yallaAdminIpAllowlist: parsedEnv.YALLA_ADMIN_IP_ALLOWLIST,
  yallaAdminJwtSecret: parsedEnv.YALLA_ADMIN_JWT_SECRET,
  yallaAdminSessionTtlHours: parsedEnv.YALLA_ADMIN_SESSION_TTL_HOURS,

  // ── Supabase ──────────────────────────────────────────────────────────────
  supabaseUrl: parsedEnv.SUPABASE_URL,
  supabaseAnonKey: parsedEnv.SUPABASE_ANON_KEY,
  supabaseServiceRoleKey: parsedEnv.SUPABASE_SERVICE_ROLE_KEY,
};

// ── Production startup guards ──────────────────────────────────────────────
// NOTE: This is exported as a function so it runs inside createApp(), not at
// module-import time. Module-level process.exit(1) would kill the Vercel
// serverless runtime before any route handler is registered.
export function checkProductionEnv(): void {
  if (parsedEnv.NODE_ENV !== "production") return;

  const missingSecrets: string[] = [];
  const stripeBillingConfig = evaluateStripeBillingConfig({
    STRIPE_SECRET_KEY: parsedEnv.STRIPE_SECRET_KEY || undefined,
    STRIPE_WEBHOOK_SECRET: parsedEnv.STRIPE_WEBHOOK_SECRET || undefined,
    STRIPE_PRICE_STARTER_MONTHLY: parsedEnv.STRIPE_PRICE_STARTER_MONTHLY || undefined,
    STRIPE_PRICE_STARTER_QUARTERLY: parsedEnv.STRIPE_PRICE_STARTER_QUARTERLY || undefined,
    STRIPE_PRICE_STARTER_BIANNUAL: parsedEnv.STRIPE_PRICE_STARTER_BIANNUAL || undefined,
    STRIPE_PRICE_STARTER_ANNUAL: parsedEnv.STRIPE_PRICE_STARTER_ANNUAL || undefined,
    STRIPE_PRICE_PRO_MONTHLY: parsedEnv.STRIPE_PRICE_PRO_MONTHLY || undefined,
    STRIPE_PRICE_PRO_QUARTERLY: parsedEnv.STRIPE_PRICE_PRO_QUARTERLY || undefined,
    STRIPE_PRICE_PRO_BIANNUAL: parsedEnv.STRIPE_PRICE_PRO_BIANNUAL || undefined,
    STRIPE_PRICE_PRO_ANNUAL: parsedEnv.STRIPE_PRICE_PRO_ANNUAL || undefined,
    STRIPE_PRICE_ENTERPRISE_MONTHLY: parsedEnv.STRIPE_PRICE_ENTERPRISE_MONTHLY || undefined,
    STRIPE_PRICE_ENTERPRISE_ANNUAL: parsedEnv.STRIPE_PRICE_ENTERPRISE_ANNUAL || undefined,
  });

  if (!parsedEnv.JWT_SECRET) missingSecrets.push("JWT_SECRET");
  if (!parsedEnv.DATABASE_URL) missingSecrets.push("DATABASE_URL");
  if (!parsedEnv.APP_URL || parsedEnv.APP_URL === "http://localhost:3000") {
    missingSecrets.push("APP_URL (must be set to the production URL)");
  }

  if (missingSecrets.length > 0) {
    console.error(
      `[FATAL] Required environment variable(s) not set: ${missingSecrets.join(", ")}. Refusing to start.`,
    );
    process.exit(1);
  }

  if (parsedEnv.JWT_SECRET.length < 32) {
    console.error(
      "[FATAL] JWT_SECRET must be at least 32 characters for production use. " +
      "Generate one with: node -e \"console.log(require('crypto').randomBytes(48).toString('hex'))\"",
    );
    process.exit(1);
  }

  if (stripeBillingConfig.partiallyConfigured) {
    console.warn(
      `[WARN] Stripe billing is partially configured. Missing: ${stripeBillingConfig.missing.join(", ")}. ` +
      "Billing and checkout flows may not work until all STRIPE_* variables are set.",
    );
  }

  if (!parsedEnv.STRIPE_SECRET_KEY) {
    console.warn(
      "[WARN] STRIPE_SECRET_KEY is not set. Billing and checkout flows are disabled until Stripe is configured.",
    );
  }
}
