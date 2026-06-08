var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/services/config-schema.ts
function intEnv(raw, fallback, min, max) {
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}
function boolEnv(raw, fallback) {
  if (raw === void 0 || raw === "") return fallback;
  return raw === "true";
}
function strEnv(raw, fallback = "") {
  return (raw ?? fallback).trim() || fallback;
}
var _isProduction, _isDevelopment, parsedEnv;
var init_config_schema = __esm({
  "server/services/config-schema.ts"() {
    "use strict";
    _isProduction = process.env.NODE_ENV === "production";
    _isDevelopment = process.env.NODE_ENV === "development";
    parsedEnv = {
      NODE_ENV: process.env.NODE_ENV ?? "development",
      // ── App ───────────────────────────────────────────────────────────────────
      VITE_APP_ID: process.env.VITE_APP_ID ?? "",
      JWT_SECRET: process.env.JWT_SECRET ?? (!_isProduction ? "djac-dev-local-only-not-for-production-use-set-jwt-secret" : ""),
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
      AI_JOB_HISTORY_FILE: (process.env.AI_JOB_HISTORY_FILE ?? (_isDevelopment ? ".runtime/ai-job-history.json" : "")).trim(),
      REDIS_URL: process.env.REDIS_URL ?? "",
      AGENT_SWARM_BASE_URL: process.env.AGENT_SWARM_BASE_URL ?? "",
      AI_WEBSOCKET_PATH: process.env.AI_WEBSOCKET_PATH ?? "/ws/ai-jobs",
      AI_VALIDATOR_MAX_RETRIES: intEnv(process.env.AI_VALIDATOR_MAX_RETRIES, 1, 0, 5),
      AI_JOB_TIMEOUT_MS: intEnv(process.env.AI_JOB_TIMEOUT_MS, 45e3, 1e3, 3e5),
      AI_RAG_TOP_K: intEnv(process.env.AI_RAG_TOP_K, 12, 1, 100),
      // ── Stripe / Billing ──────────────────────────────────────────────────────
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ?? "",
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET ?? "",
      // ── SMTP ──────────────────────────────────────────────────────────────────
      SMTP_HOST: strEnv(process.env.SMTP_HOST),
      SMTP_PORT: intEnv(process.env.SMTP_PORT, 587, 1, 65535),
      SMTP_SECURE: boolEnv(process.env.SMTP_SECURE, false),
      SMTP_USER: process.env.SMTP_USER ?? "",
      SMTP_PASS: process.env.SMTP_PASS ?? "",
      SMTP_FROM: strEnv(process.env.SMTP_FROM),
      // ── Reporting ─────────────────────────────────────────────────────────────
      REPORT_TEMPLATE_NAME: strEnv(process.env.REPORT_TEMPLATE_NAME, "Yalla Hack Official Report Template") || "Yalla Hack Official Report Template",
      // ── Interaction retention ─────────────────────────────────────────────────
      INTERACTION_RETENTION_AUTORUN: boolEnv(
        process.env.INTERACTION_RETENTION_AUTORUN,
        _isProduction
      ),
      INTERACTION_RETENTION_DAYS: intEnv(process.env.INTERACTION_RETENTION_DAYS, 90, 7, 365),
      INTERACTION_RETENTION_INTERVAL_HOURS: intEnv(
        process.env.INTERACTION_RETENTION_INTERVAL_HOURS,
        24,
        1,
        168
      ),
      // ── Database ──────────────────────────────────────────────────────────────
      ALLOW_IN_MEMORY_PERSISTENCE: boolEnv(process.env.ALLOW_IN_MEMORY_PERSISTENCE, _isDevelopment),
      DATABASE_POOL_SIZE: intEnv(
        process.env.DATABASE_POOL_SIZE,
        _isProduction ? 25 : 5,
        1,
        100
      ),
      // ── HTTP / Timeouts ───────────────────────────────────────────────────────
      COMPLIANCE_CACHE_TTL_MS: intEnv(
        process.env.COMPLIANCE_CACHE_TTL_MS,
        _isProduction ? 6e4 : 1e4,
        1e3,
        36e5
      ),
      HTTP_KEEP_ALIVE_TIMEOUT_MS: intEnv(process.env.HTTP_KEEP_ALIVE_TIMEOUT_MS, 65e3, 1e3, 3e5),
      HTTP_HEADERS_TIMEOUT_MS: intEnv(process.env.HTTP_HEADERS_TIMEOUT_MS, 66e3, 2e3, 3e5),
      HTTP_REQUEST_TIMEOUT_MS: intEnv(process.env.HTTP_REQUEST_TIMEOUT_MS, 12e4, 1e3, 6e5),
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
      PORT: intEnv(process.env.PORT, 3e3, 1, 65535),
      // ── Sentry ────────────────────────────────────────────────────────────────
      SENTRY_DSN: strEnv(process.env.SENTRY_DSN),
      // ── Yalla-Admin Internal Portal ───────────────────────────────────────────
      YALLA_ADMIN_SECRET: strEnv(process.env.YALLA_ADMIN_SECRET),
      YALLA_ADMIN_USERNAME: strEnv(process.env.YALLA_ADMIN_USERNAME, "yalla_admin"),
      YALLA_ADMIN_PASSWORD: strEnv(process.env.YALLA_ADMIN_PASSWORD),
      YALLA_ADMIN_IP_ALLOWLIST: strEnv(process.env.YALLA_ADMIN_IP_ALLOWLIST),
      YALLA_ADMIN_JWT_SECRET: strEnv(process.env.YALLA_ADMIN_JWT_SECRET),
      YALLA_ADMIN_SESSION_TTL_HOURS: intEnv(process.env.YALLA_ADMIN_SESSION_TTL_HOURS, 8, 1, 72)
    };
  }
});

// server/_core/env.ts
function parseQueueMode(value) {
  if (value === "redis" || value === "in_memory") return value;
  return void 0;
}
function resolveAiQueueMode(value, options) {
  const explicitMode = parseQueueMode(value);
  const hasRedis = Boolean((options.redisUrl ?? "").trim());
  if (options.isProduction && hasRedis) return "redis";
  if (explicitMode) return explicitMode;
  return "in_memory";
}
function evaluateStripeBillingConfig(env) {
  const configuredPriceKeys = STRIPE_PRICE_ENV_KEYS.filter((key) => Boolean(env[key]?.trim()));
  const hasSecretKey = Boolean(env.STRIPE_SECRET_KEY?.trim());
  const hasWebhookSecret = Boolean(env.STRIPE_WEBHOOK_SECRET?.trim());
  const anyStripeConfigured = hasSecretKey || hasWebhookSecret || configuredPriceKeys.length > 0;
  const missing = [];
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
    configuredPriceCount: configuredPriceKeys.length
  };
}
function checkProductionEnv() {
  if (parsedEnv.NODE_ENV !== "production") return;
  const missingSecrets = [];
  const stripeBillingConfig = evaluateStripeBillingConfig({
    STRIPE_SECRET_KEY: parsedEnv.STRIPE_SECRET_KEY || void 0,
    STRIPE_WEBHOOK_SECRET: parsedEnv.STRIPE_WEBHOOK_SECRET || void 0,
    STRIPE_PRICE_STARTER_MONTHLY: parsedEnv.STRIPE_PRICE_STARTER_MONTHLY || void 0,
    STRIPE_PRICE_STARTER_QUARTERLY: parsedEnv.STRIPE_PRICE_STARTER_QUARTERLY || void 0,
    STRIPE_PRICE_STARTER_BIANNUAL: parsedEnv.STRIPE_PRICE_STARTER_BIANNUAL || void 0,
    STRIPE_PRICE_STARTER_ANNUAL: parsedEnv.STRIPE_PRICE_STARTER_ANNUAL || void 0,
    STRIPE_PRICE_PRO_MONTHLY: parsedEnv.STRIPE_PRICE_PRO_MONTHLY || void 0,
    STRIPE_PRICE_PRO_QUARTERLY: parsedEnv.STRIPE_PRICE_PRO_QUARTERLY || void 0,
    STRIPE_PRICE_PRO_BIANNUAL: parsedEnv.STRIPE_PRICE_PRO_BIANNUAL || void 0,
    STRIPE_PRICE_PRO_ANNUAL: parsedEnv.STRIPE_PRICE_PRO_ANNUAL || void 0,
    STRIPE_PRICE_ENTERPRISE_MONTHLY: parsedEnv.STRIPE_PRICE_ENTERPRISE_MONTHLY || void 0,
    STRIPE_PRICE_ENTERPRISE_ANNUAL: parsedEnv.STRIPE_PRICE_ENTERPRISE_ANNUAL || void 0
  });
  if (!parsedEnv.JWT_SECRET) missingSecrets.push("JWT_SECRET");
  if (!parsedEnv.DATABASE_URL) missingSecrets.push("DATABASE_URL");
  if (!parsedEnv.APP_URL || parsedEnv.APP_URL === "http://localhost:3000") {
    missingSecrets.push("APP_URL (must be set to the production URL)");
  }
  if (missingSecrets.length > 0) {
    const msg = `[FATAL] Required environment variable(s) not set: ${missingSecrets.join(", ")}. Refusing to start.`;
    console.error(msg);
    throw new Error(msg);
  }
  if (parsedEnv.JWT_SECRET.length < 32) {
    const msg = `[FATAL] JWT_SECRET must be at least 32 characters for production use. Generate one with: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`;
    console.error(msg);
    throw new Error(msg);
  }
  if (stripeBillingConfig.partiallyConfigured) {
    console.warn(
      `[WARN] Stripe billing is partially configured. Missing: ${stripeBillingConfig.missing.join(", ")}. Billing and checkout flows may not work until all STRIPE_* variables are set.`
    );
  }
  if (!parsedEnv.STRIPE_SECRET_KEY) {
    console.warn(
      "[WARN] STRIPE_SECRET_KEY is not set. Billing and checkout flows are disabled until Stripe is configured."
    );
  }
}
var parseDevRole, STRIPE_PRICE_ENV_KEYS, ENV;
var init_env = __esm({
  "server/_core/env.ts"() {
    "use strict";
    init_config_schema();
    parseDevRole = (value) => {
      const valid = [
        "user",
        "admin",
        "basic_user",
        "professional_user",
        "company_admin",
        "platform_admin",
        "yalla_hack_employee",
        "super_admin"
      ];
      return valid.includes(value ?? "") ? value : "user";
    };
    STRIPE_PRICE_ENV_KEYS = [
      "STRIPE_PRICE_STARTER_MONTHLY",
      "STRIPE_PRICE_STARTER_QUARTERLY",
      "STRIPE_PRICE_STARTER_BIANNUAL",
      "STRIPE_PRICE_STARTER_ANNUAL",
      "STRIPE_PRICE_PRO_MONTHLY",
      "STRIPE_PRICE_PRO_QUARTERLY",
      "STRIPE_PRICE_PRO_BIANNUAL",
      "STRIPE_PRICE_PRO_ANNUAL",
      "STRIPE_PRICE_ENTERPRISE_MONTHLY",
      "STRIPE_PRICE_ENTERPRISE_ANNUAL"
    ];
    ENV = {
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
        redisUrl: parsedEnv.REDIS_URL
      }),
      aiAssessmentEngineDefault: "native",
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
      supabaseServiceRoleKey: parsedEnv.SUPABASE_SERVICE_ROLE_KEY
    };
  }
});

// drizzle/schema.ts
import { pgEnum, pgTable, serial, integer, varchar, text, timestamp } from "drizzle-orm/pg-core";
var userTypeEnum, localeEnum, userStatusEnum, roleEnum, userOAuthStatusEnum, accessRequestStatusEnum, consultationStatusEnum, priorityEnum, severityEnum, criticalityEnum, actorTypeEnum, notificationCategoryEnum, relationshipTypeEnum, mappingTypeEnum, assessmentStatusEnum, jurisdictionEnum, planEnum, paidPlanEnum, orgMemberRoleEnum, orgMemberStatusEnum, billingIntervalEnum, subscriptionStatusEnum, billingEventStatusEnum, reportTypeEnum, reportStatusEnum, auditLogCategoryEnum, auditLogOutcomeEnum, taskSeverityEnum, taskStatusEnum, riskCategoryEnum, treatmentEnum, riskStatusEnum, policyTypeEnum, policyStatusEnum, incidentTypeEnum, incidentStatusEnum, auditTypeEnum, auditStatusEnum, recurrenceEnum, ctemAssetTypeEnum, regionEnum, assetStatusEnum, vulnSeverityEnum, simulationTypeEnum, priorityTierEnum, runStatusEnum, triggeredByEnum, severityImpactEnum, onboardingStageEnum, accountIntentEnum, evidenceSourceTypeEnum, dsrRequestTypeEnum, dsrJurisdictionEnum, dsrStatusEnum, dsrPriorityEnum, serviceTypeEnum, servicePriorityEnum, serviceStatusEnum, inventoryAssetTypeEnum, exposureEnum, inventoryStatusEnum, maturityLevelEnum, threatCategoryEnum, threatSeverityEnum, tlpEnum, deadlineJurisdictionEnum, deadlinePriorityEnum, deadlineStatusEnum, localUsers, users, accessRequests, consultationRequests, activityEvents, adminNotifications, frameworks, complianceControls, frameworkRelationships, controlMappings, vendors, techStackComponents, vendorAssessments, assessmentGaps, organizations, organizationMembers, subscriptions, billingEvents, complianceReports, apiKeys, userInteractionLogs, yallaAdminAccessLinkNonces, complianceDeadlines, auditLogs, reportShares, remediationTasks, riskRegister, compliancePolicies, complianceIncidents, auditSchedules, ctemAssets, ctemVulnerabilities, ctemAttackSimulations, ctemRiskScores, continuousComplianceRuns, complianceExposureMappings, userOnboarding, rolePermissions, vendorShares, regulatorOversightTargets, complianceEvidence, dsrRequests, serviceRequests, assetInventory, securityMaturityAssessments, threatIntelItems;
var init_schema = __esm({
  "drizzle/schema.ts"() {
    "use strict";
    userTypeEnum = pgEnum("userType", [
      "visitor",
      "professional",
      "admin",
      "basic_user",
      "professional_user",
      "company_admin",
      "platform_admin",
      "yalla_hack_employee",
      "super_admin"
    ]);
    localeEnum = pgEnum("locale", ["en", "ar", "zh"]);
    userStatusEnum = pgEnum("userStatus", ["active", "pending", "suspended"]);
    roleEnum = pgEnum("role", [
      "user",
      "admin",
      "basic_user",
      "professional_user",
      "company_admin",
      "platform_admin",
      "yalla_hack_employee",
      "super_admin"
    ]);
    userOAuthStatusEnum = pgEnum("userOAuthStatus", ["active", "invited", "suspended"]);
    accessRequestStatusEnum = pgEnum("accessRequestStatus", ["new", "reviewing", "approved", "archived"]);
    consultationStatusEnum = pgEnum("consultationStatus", ["new", "in_review", "responded", "closed"]);
    priorityEnum = pgEnum("priority", ["low", "medium", "high"]);
    severityEnum = pgEnum("severity", ["low", "medium", "high", "critical"]);
    criticalityEnum = pgEnum("criticality", ["low", "medium", "high", "critical"]);
    actorTypeEnum = pgEnum("actorType", ["visitor", "client", "admin", "system"]);
    notificationCategoryEnum = pgEnum("notificationCategory", [
      "registration",
      "consultation",
      "assessment",
      "support",
      "system"
    ]);
    relationshipTypeEnum = pgEnum("relationshipType", [
      "overlap",
      "conflict",
      "harmonization",
      "coordination",
      "gap",
      "dependency"
    ]);
    mappingTypeEnum = pgEnum("mappingType", ["equivalent", "related", "conflicting", "complementary"]);
    assessmentStatusEnum = pgEnum("assessmentStatus", ["compliant", "partial", "non_compliant", "unknown"]);
    jurisdictionEnum = pgEnum("jurisdiction", ["China", "Saudi Arabia", "Both", "Other"]);
    planEnum = pgEnum("plan", ["free_trial", "starter", "professional", "enterprise"]);
    paidPlanEnum = pgEnum("paidPlan", ["starter", "professional", "enterprise"]);
    orgMemberRoleEnum = pgEnum("orgMemberRole", ["owner", "admin", "compliance_officer", "analyst"]);
    orgMemberStatusEnum = pgEnum("orgMemberStatus", ["active", "invited", "suspended"]);
    billingIntervalEnum = pgEnum("billingInterval", ["monthly", "quarterly", "biannual", "annual"]);
    subscriptionStatusEnum = pgEnum("subscriptionStatus", [
      "trialing",
      "active",
      "past_due",
      "canceled",
      "incomplete",
      "paused"
    ]);
    billingEventStatusEnum = pgEnum("billingEventStatus", ["success", "failed", "pending", "refunded"]);
    reportTypeEnum = pgEnum("reportType", [
      "full_compliance",
      "gap_analysis",
      "vendor_assessment",
      "risk_assessment",
      "executive_summary",
      "regulatory_deadline"
    ]);
    reportStatusEnum = pgEnum("reportStatus", ["generating", "ready", "failed", "archived"]);
    auditLogCategoryEnum = pgEnum("auditLogCategory", [
      "auth",
      "data_write",
      "data_read",
      "role_change",
      "system",
      "billing"
    ]);
    auditLogOutcomeEnum = pgEnum("auditLogOutcome", ["success", "failure", "blocked"]);
    taskSeverityEnum = pgEnum("taskSeverity", ["critical", "high", "medium", "low"]);
    taskStatusEnum = pgEnum("taskStatus", ["open", "in_progress", "resolved", "accepted_risk"]);
    riskCategoryEnum = pgEnum("riskCategory", ["operational", "legal", "technical", "financial", "reputational"]);
    treatmentEnum = pgEnum("treatment", ["accept", "mitigate", "transfer", "avoid"]);
    riskStatusEnum = pgEnum("riskStatus", ["open", "in_treatment", "closed", "accepted"]);
    policyTypeEnum = pgEnum("policyType", ["policy", "standard", "procedure", "guideline"]);
    policyStatusEnum = pgEnum("policyStatus", ["draft", "under_review", "approved", "active", "retired"]);
    incidentTypeEnum = pgEnum("incidentType", [
      "data_breach",
      "unauthorized_access",
      "policy_violation",
      "system_outage",
      "third_party_breach",
      "other"
    ]);
    incidentStatusEnum = pgEnum("incidentStatus", [
      "open",
      "under_investigation",
      "contained",
      "resolved",
      "closed"
    ]);
    auditTypeEnum = pgEnum("auditType", ["internal", "external", "regulatory", "certification"]);
    auditStatusEnum = pgEnum("auditStatus", ["planned", "in_progress", "completed", "cancelled"]);
    recurrenceEnum = pgEnum("recurrence", ["none", "monthly", "quarterly", "biannual", "annual"]);
    ctemAssetTypeEnum = pgEnum("ctemAssetType", [
      "web_application",
      "api_endpoint",
      "database",
      "cloud_service",
      "network_device",
      "iot_device",
      "data_pipeline",
      "identity_provider",
      "storage_bucket",
      "other"
    ]);
    regionEnum = pgEnum("region", ["China", "Saudi Arabia", "Cross-border", "Other"]);
    assetStatusEnum = pgEnum("assetStatus", ["active", "inactive", "decommissioned"]);
    vulnSeverityEnum = pgEnum("vulnSeverity", ["critical", "high", "medium", "low", "informational"]);
    simulationTypeEnum = pgEnum("simulationType", [
      "lateral_movement",
      "privilege_escalation",
      "data_exfiltration",
      "ransomware",
      "phishing",
      "api_abuse",
      "supply_chain",
      "ddos",
      "insider_threat",
      "other"
    ]);
    priorityTierEnum = pgEnum("priorityTier", ["critical", "high", "medium", "low"]);
    runStatusEnum = pgEnum("runStatus", ["queued", "running", "completed", "failed"]);
    triggeredByEnum = pgEnum("triggeredBy", ["manual", "scheduled", "webhook"]);
    severityImpactEnum = pgEnum("severityImpact", ["critical", "high", "medium", "low"]);
    onboardingStageEnum = pgEnum("onboardingStage", [
      "not_started",
      "account_type_selected",
      "org_created",
      "org_joined",
      "jurisdiction_set",
      "completed"
    ]);
    accountIntentEnum = pgEnum("accountIntent", [
      "compliance_professional",
      "legal_advisor",
      "enterprise_admin",
      "consultant",
      "vendor",
      "government",
      "researcher"
    ]);
    evidenceSourceTypeEnum = pgEnum("evidenceSourceType", [
      "audit_schedule",
      "policy",
      "risk",
      "gap",
      "remediation",
      "ctem_asset",
      "incident",
      "general"
    ]);
    dsrRequestTypeEnum = pgEnum("dsrRequestType", [
      "access",
      "rectification",
      "erasure",
      "portability",
      "restriction",
      "objection",
      "explanation"
    ]);
    dsrJurisdictionEnum = pgEnum("dsrJurisdiction", ["China", "Saudi Arabia", "Other"]);
    dsrStatusEnum = pgEnum("dsrStatus", [
      "received",
      "in_review",
      "pending_info",
      "completed",
      "rejected",
      "withdrawn"
    ]);
    dsrPriorityEnum = pgEnum("dsrPriority", ["normal", "high", "urgent"]);
    serviceTypeEnum = pgEnum("serviceType", [
      "penetration_test",
      "red_team",
      "security_audit",
      "soc_support",
      "incident_response",
      "consulting",
      "phishing_simulation",
      "cloud_security_review",
      "vulnerability_assessment",
      "compliance_gap_assessment"
    ]);
    servicePriorityEnum = pgEnum("servicePriority", ["low", "medium", "high", "critical"]);
    serviceStatusEnum = pgEnum("serviceStatus", [
      "draft",
      "submitted",
      "under_review",
      "scoping",
      "approved",
      "in_progress",
      "completed",
      "cancelled",
      "on_hold"
    ]);
    inventoryAssetTypeEnum = pgEnum("inventoryAssetType", [
      "server",
      "workstation",
      "network_device",
      "cloud_service",
      "saas_application",
      "database",
      "api_endpoint",
      "iot_device",
      "mobile_device",
      "industrial_ot",
      "web_application",
      "source_code_repo",
      "third_party_service"
    ]);
    exposureEnum = pgEnum("exposure", ["internal", "vpn_only", "partner_only", "internet_facing"]);
    inventoryStatusEnum = pgEnum("inventoryStatus", ["active", "decommissioned", "under_review", "unknown"]);
    maturityLevelEnum = pgEnum("maturityLevel", ["initial", "developing", "defined", "managed", "optimized"]);
    threatCategoryEnum = pgEnum("threatCategory", [
      "malware",
      "ransomware",
      "phishing",
      "apt",
      "zero_day",
      "ddos",
      "supply_chain",
      "data_breach",
      "vulnerability",
      "social_engineering",
      "insider_threat",
      "other"
    ]);
    threatSeverityEnum = pgEnum("threatSeverity", ["info", "low", "medium", "high", "critical"]);
    tlpEnum = pgEnum("tlp", ["white", "green", "amber", "red"]);
    deadlineJurisdictionEnum = pgEnum("deadlineJurisdiction", ["China", "Saudi Arabia", "Both"]);
    deadlinePriorityEnum = pgEnum("deadlinePriority", ["low", "medium", "high", "critical"]);
    deadlineStatusEnum = pgEnum("deadlineStatus", ["upcoming", "overdue", "completed", "waived"]);
    localUsers = pgTable("localUsers", {
      id: serial("id").primaryKey(),
      name: varchar("name", { length: 255 }).notNull(),
      email: varchar("email", { length: 320 }).notNull().unique(),
      passwordHash: varchar("passwordHash", { length: 72 }).notNull(),
      userType: userTypeEnum("userType").default("visitor").notNull(),
      companyName: varchar("companyName", { length: 255 }),
      jobTitle: varchar("jobTitle", { length: 120 }),
      industry: varchar("industry", { length: 120 }),
      complianceResponsibility: text("complianceResponsibility"),
      preferredLocale: localeEnum("preferredLocale").default("en").notNull(),
      status: userStatusEnum("status").default("pending").notNull(),
      lastSignedIn: timestamp("lastSignedIn"),
      totpSecret: varchar("totpSecret", { length: 64 }),
      mfaEnabled: integer("mfaEnabled").default(0).notNull(),
      mfaBackupCodes: text("mfaBackupCodes"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    users = pgTable("users", {
      id: serial("id").primaryKey(),
      openId: varchar("openId", { length: 64 }).notNull().unique(),
      name: text("name"),
      email: varchar("email", { length: 320 }),
      loginMethod: varchar("loginMethod", { length: 64 }),
      organizationName: varchar("organizationName", { length: 255 }),
      organizationType: varchar("organizationType", { length: 120 }),
      jobTitle: varchar("jobTitle", { length: 120 }),
      preferredLocale: localeEnum("preferredLocale").default("en").notNull(),
      role: roleEnum("role").default("user").notNull(),
      status: userOAuthStatusEnum("status").default("active").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull(),
      lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
      lastActivityAt: timestamp("lastActivityAt").defaultNow().notNull()
    });
    accessRequests = pgTable("accessRequests", {
      id: serial("id").primaryKey(),
      fullName: varchar("fullName", { length: 255 }).notNull(),
      email: varchar("email", { length: 320 }).notNull(),
      organizationName: varchar("organizationName", { length: 255 }).notNull(),
      organizationType: varchar("organizationType", { length: 120 }),
      useCase: text("useCase"),
      preferredLocale: localeEnum("preferredLocale").default("en").notNull(),
      status: accessRequestStatusEnum("status").default("new").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    consultationRequests = pgTable("consultationRequests", {
      id: serial("id").primaryKey(),
      userId: integer("userId").references(() => users.id),
      contactName: varchar("contactName", { length: 255 }).notNull(),
      contactEmail: varchar("contactEmail", { length: 320 }).notNull(),
      organizationName: varchar("organizationName", { length: 255 }).notNull(),
      topic: varchar("topic", { length: 255 }).notNull(),
      jurisdictions: text("jurisdictions"),
      summary: text("summary").notNull(),
      vendorName: varchar("vendorName", { length: 255 }),
      techStackSummary: text("techStackSummary"),
      status: consultationStatusEnum("status").default("new").notNull(),
      priority: priorityEnum("priority").default("medium").notNull(),
      assignedAdminUserId: integer("assignedAdminUserId").references(() => users.id),
      adminResponse: text("adminResponse"),
      respondedAt: timestamp("respondedAt"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    activityEvents = pgTable("activityEvents", {
      id: serial("id").primaryKey(),
      userId: integer("userId").references(() => users.id),
      localUserId: integer("localUserId").references(() => localUsers.id),
      actorType: actorTypeEnum("actorType").notNull(),
      actorRole: varchar("actorRole", { length: 64 }),
      action: varchar("action", { length: 120 }).notNull(),
      entityType: varchar("entityType", { length: 120 }).notNull(),
      entityId: integer("entityId"),
      targetEntity: varchar("targetEntity", { length: 255 }),
      payload: text("payload"),
      ipHash: varchar("ipHash", { length: 64 }),
      metadata: text("metadata"),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    adminNotifications = pgTable("adminNotifications", {
      id: serial("id").primaryKey(),
      category: notificationCategoryEnum("category").notNull(),
      title: varchar("title", { length: 255 }).notNull(),
      content: text("content"),
      entityType: varchar("entityType", { length: 120 }),
      entityId: integer("entityId"),
      isRead: integer("isRead").default(0).notNull(),
      readAt: timestamp("readAt"),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    frameworks = pgTable("frameworks", {
      id: serial("id").primaryKey(),
      code: varchar("code", { length: 50 }).notNull().unique(),
      name: text("name").notNull(),
      country: varchar("country", { length: 50 }).notNull(),
      description: text("description"),
      scope: text("scope"),
      enforcementAuthority: varchar("enforcementAuthority", { length: 255 }),
      maxPenalty: varchar("maxPenalty", { length: 255 }),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    complianceControls = pgTable("complianceControls", {
      id: serial("id").primaryKey(),
      frameworkId: integer("frameworkId").notNull().references(() => frameworks.id),
      controlCode: varchar("controlCode", { length: 100 }).notNull(),
      controlName: text("controlName").notNull(),
      category: varchar("category", { length: 100 }),
      description: text("description"),
      requirement: text("requirement"),
      applicability: varchar("applicability", { length: 255 }),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    frameworkRelationships = pgTable("frameworkRelationships", {
      id: serial("id").primaryKey(),
      sourceFrameworkId: integer("sourceFrameworkId").notNull().references(() => frameworks.id),
      targetFrameworkId: integer("targetFrameworkId").notNull().references(() => frameworks.id),
      relationshipType: relationshipTypeEnum("relationshipType").notNull(),
      description: text("description"),
      severity: severityEnum("severity"),
      riskLevel: varchar("riskLevel", { length: 50 }),
      mitigation: text("mitigation"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    controlMappings = pgTable("controlMappings", {
      id: serial("id").primaryKey(),
      sourceControlId: integer("sourceControlId").notNull().references(() => complianceControls.id),
      targetControlId: integer("targetControlId").notNull().references(() => complianceControls.id),
      mappingType: mappingTypeEnum("mappingType").notNull(),
      alignmentScore: integer("alignmentScore"),
      notes: text("notes"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    vendors = pgTable("vendors", {
      id: serial("id").primaryKey(),
      userId: integer("userId").notNull().references(() => users.id),
      organizationId: integer("organizationId").references(() => organizations.id),
      vendorName: varchar("vendorName", { length: 255 }).notNull(),
      vendorDescription: text("vendorDescription"),
      industry: varchar("industry", { length: 100 }),
      businessRegistrationNumber: varchar("businessRegistrationNumber", { length: 120 }),
      headquartersLocation: varchar("headquartersLocation", { length: 120 }),
      primaryContactName: varchar("primaryContactName", { length: 255 }),
      primaryContactEmail: varchar("primaryContactEmail", { length: 320 }),
      primaryContactRole: varchar("primaryContactRole", { length: 120 }),
      primaryContactPhone: varchar("primaryContactPhone", { length: 64 }),
      serviceType: varchar("serviceType", { length: 120 }),
      serviceScope: text("serviceScope"),
      hostingEnvironment: varchar("hostingEnvironment", { length: 120 }),
      operatingCountries: text("operatingCountries"),
      cloudProvider: varchar("cloudProvider", { length: 255 }),
      dataLocations: text("dataLocations"),
      regulatoryJurisdictions: text("regulatoryJurisdictions"),
      certifications: text("certifications"),
      dataProcessingActivities: text("dataProcessingActivities"),
      criticalityLevel: varchar("criticalityLevel", { length: 64 }),
      riskTier: varchar("riskTier", { length: 64 }),
      thirdPartyDependencies: varchar("thirdPartyDependencies", { length: 64 }),
      fourthPartyDependencies: varchar("fourthPartyDependencies", { length: 64 }),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    techStackComponents = pgTable("techStackComponents", {
      id: serial("id").primaryKey(),
      vendorId: integer("vendorId").notNull().references(() => vendors.id),
      componentName: varchar("componentName", { length: 255 }).notNull(),
      componentType: varchar("componentType", { length: 100 }),
      technology: varchar("technology", { length: 255 }),
      description: text("description"),
      dataHandling: text("dataHandling"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    vendorAssessments = pgTable("vendorAssessments", {
      id: serial("id").primaryKey(),
      vendorId: integer("vendorId").notNull().references(() => vendors.id),
      frameworkId: integer("frameworkId").notNull().references(() => frameworks.id),
      assessmentDate: timestamp("assessmentDate").defaultNow().notNull(),
      complianceScore: integer("complianceScore"),
      riskLevel: severityEnum("riskLevel"),
      status: assessmentStatusEnum("status"),
      findings: text("findings"),
      recommendations: text("recommendations"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    assessmentGaps = pgTable("assessmentGaps", {
      id: serial("id").primaryKey(),
      assessmentId: integer("assessmentId").notNull().references(() => vendorAssessments.id),
      controlId: integer("controlId").notNull().references(() => complianceControls.id),
      gapDescription: text("gapDescription"),
      severity: severityEnum("severity"),
      remediation: text("remediation"),
      estimatedRemediationCost: varchar("estimatedRemediationCost", { length: 100 }),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    organizations = pgTable("organizations", {
      id: serial("id").primaryKey(),
      slug: varchar("slug", { length: 100 }).notNull().unique(),
      name: varchar("name", { length: 255 }).notNull(),
      billingEmail: varchar("billingEmail", { length: 320 }).notNull(),
      industry: varchar("industry", { length: 120 }),
      primaryJurisdiction: jurisdictionEnum("primaryJurisdiction").default("Both"),
      stripeCustomerId: varchar("stripeCustomerId", { length: 64 }),
      plan: planEnum("plan").default("free_trial").notNull(),
      trialStartedAt: timestamp("trialStartedAt"),
      trialEndsAt: timestamp("trialEndsAt"),
      trialReminderDay3Sent: integer("trialReminderDay3Sent").default(0).notNull(),
      trialReminderDay6Sent: integer("trialReminderDay6Sent").default(0).notNull(),
      trialExpiredNoticeSent: integer("trialExpiredNoticeSent").default(0).notNull(),
      isActive: integer("isActive").default(1).notNull(),
      maxSeats: integer("maxSeats").default(5).notNull(),
      metadata: text("metadata"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    organizationMembers = pgTable("organizationMembers", {
      id: serial("id").primaryKey(),
      organizationId: integer("organizationId").notNull().references(() => organizations.id),
      userId: integer("userId").references(() => users.id),
      localUserId: integer("localUserId").references(() => localUsers.id),
      role: orgMemberRoleEnum("role").default("analyst").notNull(),
      invitedByUserId: integer("invitedByUserId"),
      inviteEmail: varchar("inviteEmail", { length: 320 }),
      inviteToken: varchar("inviteToken", { length: 64 }),
      inviteAcceptedAt: timestamp("inviteAcceptedAt"),
      status: orgMemberStatusEnum("status").default("active").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    subscriptions = pgTable("subscriptions", {
      id: serial("id").primaryKey(),
      organizationId: integer("organizationId").notNull().references(() => organizations.id),
      stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 64 }).unique(),
      stripePriceId: varchar("stripePriceId", { length: 64 }),
      plan: paidPlanEnum("plan").notNull(),
      billingInterval: billingIntervalEnum("billingInterval").notNull(),
      amountCents: integer("amountCents").notNull(),
      currency: varchar("currency", { length: 3 }).default("USD").notNull(),
      status: subscriptionStatusEnum("status").default("trialing").notNull(),
      currentPeriodStart: timestamp("currentPeriodStart"),
      currentPeriodEnd: timestamp("currentPeriodEnd"),
      cancelAtPeriodEnd: integer("cancelAtPeriodEnd").default(0).notNull(),
      canceledAt: timestamp("canceledAt"),
      lastInvoiceId: varchar("lastInvoiceId", { length: 64 }),
      stripeMetadata: text("stripeMetadata"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    billingEvents = pgTable("billingEvents", {
      id: serial("id").primaryKey(),
      organizationId: integer("organizationId").notNull().references(() => organizations.id),
      subscriptionId: integer("subscriptionId").references(() => subscriptions.id),
      stripeEventId: varchar("stripeEventId", { length: 64 }).unique(),
      eventType: varchar("eventType", { length: 120 }).notNull(),
      status: billingEventStatusEnum("status").default("pending").notNull(),
      amountCents: integer("amountCents"),
      currency: varchar("currency", { length: 3 }).default("USD"),
      description: text("description"),
      rawPayload: text("rawPayload"),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    complianceReports = pgTable("complianceReports", {
      id: serial("id").primaryKey(),
      organizationId: integer("organizationId").notNull().references(() => organizations.id),
      generatedByUserId: integer("generatedByUserId").references(() => users.id),
      generatedByLocalUserId: integer("generatedByLocalUserId").references(() => localUsers.id),
      title: varchar("title", { length: 255 }).notNull(),
      reportType: reportTypeEnum("reportType").notNull(),
      frameworks: text("frameworks").notNull(),
      aiJobId: varchar("aiJobId", { length: 64 }),
      version: integer("version").default(1).notNull(),
      overallScore: integer("overallScore"),
      riskLevel: severityEnum("riskLevel"),
      reportBody: text("reportBody").notNull(),
      exportedAt: timestamp("exportedAt"),
      exportedPdfUrl: varchar("exportedPdfUrl", { length: 512 }),
      status: reportStatusEnum("status").default("generating").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    apiKeys = pgTable("apiKeys", {
      id: serial("id").primaryKey(),
      organizationId: integer("organizationId").notNull().references(() => organizations.id, { onDelete: "cascade" }),
      createdByUserId: integer("createdByUserId").references(() => users.id),
      name: varchar("name", { length: 120 }).notNull(),
      keyHash: varchar("keyHash", { length: 64 }).notNull().unique(),
      keyPrefix: varchar("keyPrefix", { length: 16 }).notNull(),
      scopes: text("scopes"),
      lastUsedAt: timestamp("lastUsedAt"),
      expiresAt: timestamp("expiresAt"),
      revokedAt: timestamp("revokedAt"),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    userInteractionLogs = pgTable("userInteractionLogs", {
      id: serial("id").primaryKey(),
      organizationId: integer("organizationId").references(() => organizations.id),
      userId: integer("userId").references(() => users.id),
      localUserId: integer("localUserId").references(() => localUsers.id),
      sessionId: varchar("sessionId", { length: 64 }),
      context: varchar("context", { length: 120 }).notNull(),
      action: varchar("action", { length: 120 }).notNull(),
      entityType: varchar("entityType", { length: 120 }),
      entityId: integer("entityId"),
      inputSnapshot: text("inputSnapshot"),
      outputRef: text("outputRef"),
      durationMs: integer("durationMs"),
      ipHash: varchar("ipHash", { length: 64 }),
      userAgent: varchar("userAgent", { length: 512 }),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    yallaAdminAccessLinkNonces = pgTable("yallaAdminAccessLinkNonces", {
      id: serial("id").primaryKey(),
      nonceHash: varchar("nonceHash", { length: 64 }).notNull().unique(),
      redirectTarget: varchar("redirectTarget", { length: 255 }).notNull(),
      expiresAt: timestamp("expiresAt").notNull(),
      consumedAt: timestamp("consumedAt").defaultNow().notNull(),
      consumedByIp: varchar("consumedByIp", { length: 64 }).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    complianceDeadlines = pgTable("complianceDeadlines", {
      id: serial("id").primaryKey(),
      organizationId: integer("organizationId").references(() => organizations.id),
      frameworkCode: varchar("frameworkCode", { length: 50 }).notNull(),
      title: varchar("title", { length: 255 }).notNull(),
      description: text("description"),
      deadlineDate: timestamp("deadlineDate").notNull(),
      jurisdiction: deadlineJurisdictionEnum("jurisdiction").notNull(),
      priority: deadlinePriorityEnum("priority").default("medium").notNull(),
      status: deadlineStatusEnum("status").default("upcoming").notNull(),
      notificationsSent: text("notificationsSent"),
      assignedToUserId: integer("assignedToUserId").references(() => users.id),
      completedAt: timestamp("completedAt"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    auditLogs = pgTable("auditLogs", {
      id: serial("id").primaryKey(),
      userId: integer("userId").references(() => users.id),
      localUserId: integer("localUserId").references(() => localUsers.id),
      organizationId: integer("organizationId").references(() => organizations.id),
      actorRole: varchar("actorRole", { length: 64 }),
      category: auditLogCategoryEnum("category").notNull(),
      action: varchar("action", { length: 120 }).notNull(),
      entityType: varchar("entityType", { length: 120 }),
      entityId: integer("entityId"),
      targetEntity: varchar("targetEntity", { length: 255 }),
      outcome: auditLogOutcomeEnum("outcome").default("success").notNull(),
      payload: text("payload"),
      ipHash: varchar("ipHash", { length: 64 }),
      userAgent: varchar("userAgent", { length: 512 }),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    reportShares = pgTable("reportShares", {
      id: serial("id").primaryKey(),
      token: varchar("token", { length: 64 }).notNull().unique(),
      jurisdiction: varchar("jurisdiction", { length: 64 }).notNull(),
      locale: localeEnum("locale").default("en").notNull(),
      reportType: varchar("reportType", { length: 64 }).notNull(),
      createdByUserId: integer("createdByUserId").references(() => users.id),
      viewCount: integer("viewCount").default(0).notNull(),
      expiresAt: timestamp("expiresAt").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    remediationTasks = pgTable("remediationTasks", {
      id: serial("id").primaryKey(),
      organizationId: integer("organizationId").notNull().references(() => organizations.id, { onDelete: "cascade" }),
      vendorId: integer("vendorId"),
      gapCode: varchar("gapCode", { length: 64 }),
      title: varchar("title", { length: 255 }).notNull(),
      description: text("description"),
      severity: taskSeverityEnum("severity").notNull().default("medium"),
      status: taskStatusEnum("status").notNull().default("open"),
      assignedToUserId: integer("assignedToUserId"),
      dueDate: timestamp("dueDate"),
      notes: text("notes"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    riskRegister = pgTable("riskRegister", {
      id: serial("id").primaryKey(),
      organizationId: integer("organizationId").notNull().references(() => organizations.id, { onDelete: "cascade" }),
      title: varchar("title", { length: 255 }).notNull(),
      description: text("description"),
      category: riskCategoryEnum("category").notNull().default("operational"),
      likelihood: integer("likelihood").notNull().default(3),
      impact: integer("impact").notNull().default(3),
      treatment: treatmentEnum("treatment").notNull().default("mitigate"),
      status: riskStatusEnum("status").notNull().default("open"),
      ownerId: integer("ownerId"),
      vendorId: integer("vendorId"),
      gapCode: varchar("gapCode", { length: 64 }),
      controlReference: varchar("controlReference", { length: 128 }),
      reviewDate: timestamp("reviewDate"),
      notes: text("notes"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    compliancePolicies = pgTable("compliancePolicies", {
      id: serial("id").primaryKey(),
      organizationId: integer("organizationId").notNull().references(() => organizations.id, { onDelete: "cascade" }),
      policyCode: varchar("policyCode", { length: 64 }),
      title: varchar("title", { length: 255 }).notNull(),
      description: text("description"),
      policyType: policyTypeEnum("policyType").notNull().default("policy"),
      frameworks: text("frameworks"),
      controlReferences: text("controlReferences"),
      status: policyStatusEnum("status").notNull().default("draft"),
      ownerId: integer("ownerId"),
      reviewCycleMonths: integer("reviewCycleMonths").default(12),
      lastApprovedAt: timestamp("lastApprovedAt"),
      nextReviewAt: timestamp("nextReviewAt"),
      version: varchar("version", { length: 20 }).default("1.0"),
      documentUrl: varchar("documentUrl", { length: 512 }),
      notes: text("notes"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    complianceIncidents = pgTable("complianceIncidents", {
      id: serial("id").primaryKey(),
      organizationId: integer("organizationId").notNull().references(() => organizations.id, { onDelete: "cascade" }),
      incidentCode: varchar("incidentCode", { length: 64 }),
      title: varchar("title", { length: 255 }).notNull(),
      description: text("description"),
      incidentType: incidentTypeEnum("incidentType").default("other").notNull(),
      severity: taskSeverityEnum("severity").default("medium").notNull(),
      status: incidentStatusEnum("status").default("open").notNull(),
      affectedFrameworks: text("affectedFrameworks"),
      affectedVendorId: integer("affectedVendorId"),
      affectedDataTypes: text("affectedDataTypes"),
      affectedDataSubjects: integer("affectedDataSubjects"),
      reportedById: integer("reportedById"),
      occurredAt: timestamp("occurredAt"),
      detectedAt: timestamp("detectedAt"),
      containedAt: timestamp("containedAt"),
      resolvedAt: timestamp("resolvedAt"),
      regulatoryNotificationRequired: integer("regulatoryNotificationRequired").default(0).notNull(),
      regulatoryNotificationSentAt: timestamp("regulatoryNotificationSentAt"),
      notificationDeadlineHours: integer("notificationDeadlineHours").default(72),
      rootCause: text("rootCause"),
      lessonsLearned: text("lessonsLearned"),
      notes: text("notes"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    auditSchedules = pgTable("auditSchedules", {
      id: serial("id").primaryKey(),
      organizationId: integer("organizationId").notNull().references(() => organizations.id, { onDelete: "cascade" }),
      title: varchar("title", { length: 255 }).notNull(),
      description: text("description"),
      auditType: auditTypeEnum("auditType").default("internal").notNull(),
      scope: text("scope"),
      status: auditStatusEnum("status").default("planned").notNull(),
      scheduledDate: timestamp("scheduledDate").notNull(),
      completedDate: timestamp("completedDate"),
      assignedToId: integer("assignedToId"),
      vendorId: integer("vendorId"),
      findings: text("findings"),
      recurrence: recurrenceEnum("recurrence").default("none").notNull(),
      nextOccurrence: timestamp("nextOccurrence"),
      notes: text("notes"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    ctemAssets = pgTable("ctemAssets", {
      id: serial("id").primaryKey(),
      organizationId: integer("organizationId").notNull().references(() => organizations.id, { onDelete: "cascade" }),
      vendorId: integer("vendorId").references(() => vendors.id, { onDelete: "set null" }),
      assetName: varchar("assetName", { length: 255 }).notNull(),
      assetType: ctemAssetTypeEnum("assetType").notNull().default("other"),
      ipDomain: varchar("ipDomain", { length: 255 }),
      region: regionEnum("region").notNull().default("Other"),
      isInternetFacing: integer("isInternetFacing").default(0).notNull(),
      handlesPersonalData: integer("handlesPersonalData").default(0).notNull(),
      handlesCriticalData: integer("handlesCriticalData").default(0).notNull(),
      criticalityScore: integer("criticalityScore").default(5).notNull(),
      status: assetStatusEnum("status").default("active").notNull(),
      notes: text("notes"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    ctemVulnerabilities = pgTable("ctemVulnerabilities", {
      id: serial("id").primaryKey(),
      assetId: integer("assetId").notNull().references(() => ctemAssets.id, { onDelete: "cascade" }),
      cveId: varchar("cveId", { length: 64 }),
      title: varchar("title", { length: 255 }).notNull(),
      description: text("description"),
      severity: vulnSeverityEnum("severity").notNull().default("medium"),
      cvssScore: integer("cvssScore").default(0).notNull(),
      exploitAvailable: integer("exploitAvailable").default(0).notNull(),
      isConfirmed: integer("isConfirmed").default(0).notNull(),
      isPatched: integer("isPatched").default(0).notNull(),
      discoveredAt: timestamp("discoveredAt").defaultNow().notNull(),
      patchedAt: timestamp("patchedAt"),
      notes: text("notes"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    ctemAttackSimulations = pgTable("ctemAttackSimulations", {
      id: serial("id").primaryKey(),
      assetId: integer("assetId").notNull().references(() => ctemAssets.id, { onDelete: "cascade" }),
      simulationType: simulationTypeEnum("simulationType").notNull().default("other"),
      successProbability: integer("successProbability").default(0).notNull(),
      executedAt: timestamp("executedAt").defaultNow().notNull(),
      outputSummary: text("outputSummary"),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    ctemRiskScores = pgTable("ctemRiskScores", {
      id: serial("id").primaryKey(),
      assetId: integer("assetId").notNull().references(() => ctemAssets.id, { onDelete: "cascade" }),
      exposureScore: integer("exposureScore").default(0).notNull(),
      exploitabilityScore: integer("exploitabilityScore").default(0).notNull(),
      businessImpactScore: integer("businessImpactScore").default(0).notNull(),
      finalPriorityScore: integer("finalPriorityScore").default(0).notNull(),
      priorityTier: priorityTierEnum("priorityTier").notNull().default("low"),
      previousFinalScore: integer("previousFinalScore"),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    continuousComplianceRuns = pgTable("continuousComplianceRuns", {
      id: serial("id").primaryKey(),
      organizationId: integer("organizationId").notNull().references(() => organizations.id, { onDelete: "cascade" }),
      vendorId: integer("vendorId").references(() => vendors.id, { onDelete: "set null" }),
      runStatus: runStatusEnum("runStatus").notNull().default("queued"),
      triggeredBy: triggeredByEnum("triggeredBy").notNull().default("manual"),
      aiJobId: varchar("aiJobId", { length: 64 }),
      assetsScanned: integer("assetsScanned").default(0).notNull(),
      vulnsFound: integer("vulnsFound").default(0).notNull(),
      exploitableVulns: integer("exploitableVulns").default(0).notNull(),
      avgPriorityScore: integer("avgPriorityScore").default(0).notNull(),
      scoreDelta: integer("scoreDelta"),
      alertRaised: integer("alertRaised").default(0).notNull(),
      summary: text("summary"),
      startedAt: timestamp("startedAt").defaultNow().notNull(),
      completedAt: timestamp("completedAt"),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    complianceExposureMappings = pgTable("complianceExposureMappings", {
      id: serial("id").primaryKey(),
      vulnerabilityId: integer("vulnerabilityId").notNull().references(() => ctemVulnerabilities.id, { onDelete: "cascade" }),
      frameworkId: integer("frameworkId").references(() => frameworks.id, { onDelete: "set null" }),
      frameworkCode: varchar("frameworkCode", { length: 50 }),
      controlId: integer("controlId").references(() => complianceControls.id, { onDelete: "set null" }),
      controlCode: varchar("controlCode", { length: 100 }),
      mappingReason: text("mappingReason").notNull(),
      severityImpact: severityImpactEnum("severityImpact").notNull().default("medium"),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    userOnboarding = pgTable("userOnboarding", {
      id: serial("id").primaryKey(),
      userId: integer("userId").references(() => users.id, { onDelete: "cascade" }),
      localUserId: integer("localUserId").references(() => localUsers.id, { onDelete: "cascade" }),
      stage: onboardingStageEnum("stage").default("not_started").notNull(),
      accountIntent: accountIntentEnum("accountIntent"),
      selectedLocale: localeEnum("selectedLocale").default("en").notNull(),
      completedAt: timestamp("completedAt"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    rolePermissions = pgTable("rolePermissions", {
      id: serial("id").primaryKey(),
      organizationId: integer("organizationId").notNull().references(() => organizations.id, { onDelete: "cascade" }),
      userId: integer("userId").references(() => users.id, { onDelete: "cascade" }),
      localUserId: integer("localUserId").references(() => localUsers.id, { onDelete: "cascade" }),
      module: varchar("module", { length: 120 }).notNull(),
      canView: integer("canView").default(0).notNull(),
      canCreate: integer("canCreate").default(0).notNull(),
      canEdit: integer("canEdit").default(0).notNull(),
      canDelete: integer("canDelete").default(0).notNull(),
      canExport: integer("canExport").default(0).notNull(),
      canInvite: integer("canInvite").default(0).notNull(),
      grantedByUserId: integer("grantedByUserId").references(() => users.id),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    vendorShares = pgTable("vendorShares", {
      id: serial("id").primaryKey(),
      vendorId: integer("vendorId").notNull().references(() => vendors.id, { onDelete: "cascade" }),
      shareToken: varchar("shareToken", { length: 64 }).notNull().unique(),
      allowedOrgId: integer("allowedOrgId").references(() => organizations.id, { onDelete: "set null" }),
      expiresAt: timestamp("expiresAt"),
      viewCount: integer("viewCount").default(0).notNull(),
      createdByUserId: integer("createdByUserId").references(() => users.id),
      isRevoked: integer("isRevoked").default(0).notNull(),
      revokedAt: timestamp("revokedAt"),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    regulatorOversightTargets = pgTable("regulatorOversightTargets", {
      id: serial("id").primaryKey(),
      regulatorOrgId: integer("regulatorOrgId").notNull().references(() => organizations.id, { onDelete: "cascade" }),
      targetOrgId: integer("targetOrgId").notNull().references(() => organizations.id, { onDelete: "cascade" }),
      grantedByAdminId: integer("grantedByAdminId").references(() => users.id),
      expiresAt: timestamp("expiresAt"),
      isActive: integer("isActive").default(1).notNull(),
      justification: text("justification"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    complianceEvidence = pgTable("complianceEvidence", {
      id: serial("id").primaryKey(),
      organizationId: integer("organizationId").notNull().references(() => organizations.id, { onDelete: "cascade" }),
      sourceType: evidenceSourceTypeEnum("sourceType").notNull().default("general"),
      sourceId: integer("sourceId"),
      title: varchar("title", { length: 255 }).notNull(),
      url: varchar("url", { length: 1024 }).notNull(),
      description: text("description"),
      addedByUserId: integer("addedByUserId").references(() => localUsers.id, { onDelete: "set null" }),
      tags: varchar("tags", { length: 512 }),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    dsrRequests = pgTable("dsrRequests", {
      id: serial("id").primaryKey(),
      organizationId: integer("organizationId").notNull().references(() => organizations.id, { onDelete: "cascade" }),
      requestType: dsrRequestTypeEnum("requestType").notNull(),
      jurisdiction: dsrJurisdictionEnum("jurisdiction").notNull().default("Other"),
      requesterName: varchar("requesterName", { length: 255 }).notNull(),
      requesterEmail: varchar("requesterEmail", { length: 320 }).notNull(),
      description: text("description"),
      status: dsrStatusEnum("status").notNull().default("received"),
      priority: dsrPriorityEnum("priority").notNull().default("normal"),
      dueDate: timestamp("dueDate").notNull(),
      completedAt: timestamp("completedAt"),
      assignedToUserId: integer("assignedToUserId").references(() => localUsers.id, { onDelete: "set null" }),
      notes: text("notes"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    serviceRequests = pgTable("serviceRequests", {
      id: serial("id").primaryKey(),
      organizationId: integer("organizationId").notNull().references(() => organizations.id, { onDelete: "cascade" }),
      requestedByUserId: integer("requestedByUserId").references(() => localUsers.id, { onDelete: "set null" }),
      serviceType: serviceTypeEnum("serviceType").notNull(),
      title: varchar("title", { length: 255 }).notNull(),
      description: text("description").notNull(),
      scopeDetails: text("scopeDetails"),
      preferredStartDate: timestamp("preferredStartDate"),
      budgetRange: varchar("budgetRange", { length: 120 }),
      priority: servicePriorityEnum("priority").default("medium").notNull(),
      status: serviceStatusEnum("status").default("submitted").notNull(),
      assignedToUserId: integer("assignedToUserId").references(() => localUsers.id, { onDelete: "set null" }),
      internalNotes: text("internalNotes"),
      clientResponse: text("clientResponse"),
      respondedAt: timestamp("respondedAt"),
      completedAt: timestamp("completedAt"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    assetInventory = pgTable("assetInventory", {
      id: serial("id").primaryKey(),
      organizationId: integer("organizationId").notNull().references(() => organizations.id, { onDelete: "cascade" }),
      name: varchar("name", { length: 255 }).notNull(),
      assetType: inventoryAssetTypeEnum("assetType").notNull(),
      identifier: varchar("identifier", { length: 512 }),
      owner: varchar("owner", { length: 255 }),
      location: varchar("location", { length: 255 }),
      criticality: criticalityEnum("criticality").default("medium").notNull(),
      exposure: exposureEnum("exposure").default("internal").notNull(),
      status: inventoryStatusEnum("status").default("active").notNull(),
      riskScore: integer("riskScore").default(0).notNull(),
      platform: varchar("platform", { length: 120 }),
      version: varchar("version", { length: 120 }),
      lastScannedAt: timestamp("lastScannedAt"),
      openVulnCount: integer("openVulnCount").default(0).notNull(),
      tags: varchar("tags", { length: 512 }),
      notes: text("notes"),
      addedByUserId: integer("addedByUserId").references(() => localUsers.id, { onDelete: "set null" }),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    securityMaturityAssessments = pgTable("securityMaturityAssessments", {
      id: serial("id").primaryKey(),
      organizationId: integer("organizationId").notNull().references(() => organizations.id, { onDelete: "cascade" }),
      title: varchar("title", { length: 255 }).notNull(),
      frameworkRef: varchar("frameworkRef", { length: 64 }),
      scoreGovernance: integer("scoreGovernance").default(1).notNull(),
      scoreAssetManagement: integer("scoreAssetManagement").default(1).notNull(),
      scoreAccessControl: integer("scoreAccessControl").default(1).notNull(),
      scoreDataProtection: integer("scoreDataProtection").default(1).notNull(),
      scoreNetworkSecurity: integer("scoreNetworkSecurity").default(1).notNull(),
      scoreVulnerabilityMgmt: integer("scoreVulnerabilityMgmt").default(1).notNull(),
      scoreIncidentResponse: integer("scoreIncidentResponse").default(1).notNull(),
      scoreBackupRecovery: integer("scoreBackupRecovery").default(1).notNull(),
      scoreThirdPartyRisk: integer("scoreThirdPartyRisk").default(1).notNull(),
      scoreSecurityAwareness: integer("scoreSecurityAwareness").default(1).notNull(),
      overallScore: integer("overallScore").default(0).notNull(),
      maturityLevel: maturityLevelEnum("maturityLevel").default("initial").notNull(),
      recommendations: text("recommendations"),
      assessedByUserId: integer("assessedByUserId").references(() => localUsers.id, { onDelete: "set null" }),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    threatIntelItems = pgTable("threatIntelItems", {
      id: serial("id").primaryKey(),
      organizationId: integer("organizationId").references(() => organizations.id, { onDelete: "cascade" }),
      title: varchar("title", { length: 255 }).notNull(),
      summary: text("summary").notNull(),
      threatActor: varchar("threatActor", { length: 180 }),
      category: threatCategoryEnum("category").notNull(),
      severity: threatSeverityEnum("severity").default("medium").notNull(),
      tlp: tlpEnum("tlp").default("white").notNull(),
      affectedSectors: varchar("affectedSectors", { length: 512 }),
      indicators: text("indicators"),
      referenceUrl: varchar("referenceUrl", { length: 1024 }),
      cveId: varchar("cveId", { length: 32 }),
      cvssScore: varchar("cvssScore", { length: 8 }),
      isActive: integer("isActive").default(1).notNull(),
      createdByUserId: integer("createdByUserId").references(() => localUsers.id, { onDelete: "set null" }),
      publishedAt: timestamp("publishedAt").defaultNow().notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
  }
});

// server/db.ts
import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
function buildDevBypassUser() {
  if (!ENV.devAuthBypass) {
    return null;
  }
  const now = /* @__PURE__ */ new Date();
  return {
    id: -1,
    openId: ENV.devAuthOpenId,
    name: ENV.devAuthName,
    email: ENV.devAuthEmail || null,
    loginMethod: "dev-bypass",
    organizationName: null,
    organizationType: null,
    jobTitle: null,
    preferredLocale: "en",
    role: ENV.devAuthRole,
    status: "active",
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
    lastActivityAt: now,
    ...devUserOverride
  };
}
function getDatabaseUnavailableMessage() {
  if (!ENV.databaseUrl) {
    return "Database unavailable. Configure DATABASE_URL and run migrations (pnpm db:migrate).";
  }
  return "Database unavailable. Verify DATABASE_URL connectivity and ensure the database server is running.";
}
async function getDb() {
  if (_db) return _db;
  const databaseUrl = ENV.databaseUrl;
  if (!databaseUrl) return null;
  const now = Date.now();
  if (now - _lastDbCheckFailedAt < DB_RETRY_BACKOFF_MS) {
    return null;
  }
  try {
    if (ENV.isProduction) {
      const connectionLimit = ENV.databasePoolSize;
      _pool = new pg.Pool({
        connectionString: databaseUrl,
        max: connectionLimit,
        ssl: { rejectUnauthorized: false }
      });
      const client = await _pool.connect();
      await client.query("SELECT 1");
      client.release();
      _db = drizzle(_pool);
      console.info(`[Database] Pool created \u2014 max=${connectionLimit}`);
    } else {
      const client = new pg.Client(databaseUrl);
      await client.connect();
      await client.end();
      _db = drizzle(databaseUrl);
    }
    return _db;
  } catch (error) {
    _lastDbCheckFailedAt = now;
    console.warn("[Database] Connection unavailable:", String(error));
    _pool = null;
    _db = null;
    return null;
  }
}
async function closeDbPool() {
  if (_pool) {
    await _pool.end();
    _pool = null;
    _db = null;
  }
}
async function upsertUser(user) {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const db = await getDb();
  if (!db) {
    const devUser = buildDevBypassUser();
    if (devUser && devUser.openId === user.openId) {
      devUserOverride = {
        ...devUserOverride,
        ...user,
        lastActivityAt: user.lastActivityAt ?? user.lastSignedIn ?? /* @__PURE__ */ new Date()
      };
      return;
    }
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values = {
      openId: user.openId
    };
    const updateSet = {};
    const textFields = [
      "name",
      "email",
      "loginMethod",
      "organizationName",
      "organizationType",
      "jobTitle"
    ];
    const assignNullable = (field) => {
      const value = user[field];
      if (value === void 0) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.preferredLocale !== void 0) {
      values.preferredLocale = user.preferredLocale;
      updateSet.preferredLocale = user.preferredLocale;
    }
    if (user.status !== void 0) {
      values.status = user.status;
      updateSet.status = user.status;
    }
    if (user.lastSignedIn !== void 0) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    const activityTimestamp = user.lastActivityAt ?? user.lastSignedIn;
    if (activityTimestamp !== void 0) {
      values.lastActivityAt = activityTimestamp;
      updateSet.lastActivityAt = activityTimestamp;
    }
    if (user.role !== void 0) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (!values.lastSignedIn) {
      values.lastSignedIn = /* @__PURE__ */ new Date();
    }
    if (!values.lastActivityAt) {
      values.lastActivityAt = values.lastSignedIn;
    }
    if (Object.keys(updateSet).length === 0) {
      const now = /* @__PURE__ */ new Date();
      updateSet.lastSignedIn = now;
      updateSet.lastActivityAt = now;
    }
    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}
async function getUserByOpenId(openId) {
  const db = await getDb();
  if (!db) {
    const devUser = buildDevBypassUser();
    if (devUser?.openId === openId) {
      return devUser;
    }
    console.warn("[Database] Cannot get user: database not available");
    return void 0;
  }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getUserById(userId) {
  const db = await getDb();
  if (!db) {
    const devUser = buildDevBypassUser();
    if (devUser?.id === userId) {
      return devUser;
    }
    return void 0;
  }
  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function listUsersForAdmin(limit = 200) {
  const db = await getDb();
  if (!db) {
    const devUser = buildDevBypassUser();
    return devUser ? [devUser] : [];
  }
  return db.select().from(users).orderBy(desc(users.lastActivityAt), desc(users.lastSignedIn)).limit(limit);
}
async function updateUserProfile(userId, updates) {
  const db = await getDb();
  if (!db) {
    const devUser = buildDevBypassUser();
    if (!devUser || devUser.id !== userId) {
      return void 0;
    }
    devUserOverride = {
      ...devUserOverride,
      ...updates,
      updatedAt: /* @__PURE__ */ new Date(),
      lastActivityAt: /* @__PURE__ */ new Date()
    };
    return buildDevBypassUser() ?? void 0;
  }
  const updateSet = {
    lastActivityAt: /* @__PURE__ */ new Date()
  };
  const entries = Object.entries(updates);
  for (const [key, value] of entries) {
    if (value === void 0) continue;
    updateSet[key] = value;
  }
  await db.update(users).set(updateSet).where(eq(users.id, userId));
  return getUserById(userId);
}
async function touchUserActivity(userId) {
  const db = await getDb();
  if (!db) {
    const devUser = buildDevBypassUser();
    if (devUser?.id === userId) {
      devUserOverride = {
        ...devUserOverride,
        lastActivityAt: /* @__PURE__ */ new Date()
      };
    }
    return;
  }
  await db.update(users).set({ lastActivityAt: /* @__PURE__ */ new Date() }).where(eq(users.id, userId));
}
var _db, _pool, _lastDbCheckFailedAt, DB_RETRY_BACKOFF_MS, devUserOverride;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_schema();
    init_env();
    _db = null;
    _pool = null;
    _lastDbCheckFailedAt = 0;
    DB_RETRY_BACKOFF_MS = 1e4;
    devUserOverride = {};
  }
});

// server/supplier-assessment.ts
var supplier_assessment_exports = {};
__export(supplier_assessment_exports, {
  buildAssessmentCsv: () => buildAssessmentCsv,
  runDualJurisdictionAssessment: () => runDualJurisdictionAssessment
});
function parseList(value) {
  if (!value) return [];
  return value.split(/[,;|\n]/g).map((token) => token.trim().toLowerCase().replace(/[_-]/g, " ")).filter(Boolean);
}
function normalizeValue(value) {
  return (value || "").trim().toLowerCase().replace(/[_-]/g, " ");
}
function hasAny(haystack, needles) {
  return needles.some((needle) => haystack.some((item) => item.includes(needle)));
}
function clampScore(score) {
  return Math.max(0, Math.min(100, Math.round(score)));
}
function scoreToStatus(score) {
  if (score >= 85) return "compliant";
  if (score >= 65) return "partial";
  return "non_compliant";
}
function inferRiskLevel(score, gaps) {
  const criticalCount = gaps.filter((gap) => gap.severity === "critical").length;
  const highCount = gaps.filter((gap) => gap.severity === "high").length;
  if (criticalCount > 0) return "critical";
  if (score < 60 || highCount >= 2) return "high";
  if (score < 80 || highCount > 0) return "medium";
  return "low";
}
function makePenaltyContext(frameworks2) {
  return frameworks2.map((code) => PENALTY_CONTEXT[code]).filter(Boolean).join(" ");
}
function dedupe(values) {
  return Array.from(new Set(values));
}
function runDualJurisdictionAssessment(vendor) {
  const locations = parseList(vendor.dataLocations || vendor.operatingCountries);
  const operatingCountries = parseList(vendor.operatingCountries);
  const jurisdictions = parseList(vendor.regulatoryJurisdictions || vendor.operatingCountries);
  const certifications = parseList(vendor.certifications);
  const processingActivities = parseList(vendor.dataProcessingActivities);
  const cloudProviders = parseList(vendor.cloudProvider);
  const cloudProvider = normalizeValue(vendor.cloudProvider);
  const hostingEnvironment = normalizeValue(vendor.hostingEnvironment);
  const criticalityLevel = normalizeValue(vendor.criticalityLevel);
  const riskTier = normalizeValue(vendor.riskTier);
  const thirdPartyDependencies = normalizeValue(vendor.thirdPartyDependencies);
  const fourthPartyDependencies = normalizeValue(vendor.fourthPartyDependencies);
  let chinaScore = 100;
  let saudiScore = 100;
  const gaps = [];
  const requiresChinaControls = hasAny(jurisdictions, ["china"]) || hasAny(operatingCountries, ["china"]) || hasAny(locations, ["china"]);
  const requiresSaudiControls = hasAny(jurisdictions, ["saudi", "ksa"]) || hasAny(operatingCountries, ["saudi", "ksa"]) || hasAny(locations, ["saudi", "ksa"]);
  const hasChinaLocation = hasAny(locations, ["china", "cn", "beijing", "shanghai", "hong kong", "hong kong (sar)"]);
  const hasSaudiLocation = hasAny(locations, ["saudi", "ksa", "riyadh", "jeddah", "dammam"]);
  const hasCrossBorderTransfer = hasAny(processingActivities, ["cross border", "transfer"]);
  const handlesSensitiveData = hasAny(processingActivities, [
    "customer personal",
    "financial",
    "health",
    "biometric",
    "identity access"
  ]);
  const isHighCriticality = hasAny([criticalityLevel, riskTier], [
    "high",
    "mission critical",
    "tier 1",
    "tier 2"
  ]);
  const hasHighDependencyChain = hasAny(
    [thirdPartyDependencies, fourthPartyDependencies],
    ["material", "extensive"]
  );
  if (requiresChinaControls && !hasChinaLocation) {
    chinaScore -= 35;
    gaps.push({
      code: "LOC-CHINA-001",
      jurisdiction: "china",
      frameworks: ["PIPL", "CSL", "DSL"],
      severity: "critical",
      title: "Missing China data localization",
      description: "No China data location was declared for personal and critical data processing.",
      mitigation: "Implement China-hosted data pipelines and keep regulated datasets in-country.",
      penaltyContext: makePenaltyContext(["PIPL", "CSL", "DSL"])
    });
  }
  if (requiresSaudiControls && !hasSaudiLocation) {
    saudiScore -= 35;
    gaps.push({
      code: "LOC-SAUDI-001",
      jurisdiction: "saudi",
      frameworks: ["PDPL", "NCA"],
      severity: "critical",
      title: "Missing Saudi data localization",
      description: "No Saudi region was declared for in-kingdom data processing obligations.",
      mitigation: "Provision in-kingdom data storage and processing paths for Saudi data subjects.",
      penaltyContext: makePenaltyContext(["PDPL", "NCA"])
    });
  }
  if (requiresChinaControls && requiresSaudiControls && hasCrossBorderTransfer && !(hasChinaLocation && hasSaudiLocation)) {
    chinaScore -= 12;
    saudiScore -= 12;
    gaps.push({
      code: "XFER-CROSS-BORDER-001",
      jurisdiction: "cross_border",
      frameworks: ["PIPL", "CSL", "PDPL"],
      severity: "high",
      title: "Cross-border transfer controls need stronger localization evidence",
      description: "The supplier handles cross-border transfers but did not evidence resilient data locations for both China and Saudi obligations.",
      mitigation: "Document transfer pathways, local hosting controls, and jurisdiction-specific export or transfer assessment evidence.",
      penaltyContext: makePenaltyContext(["PIPL", "CSL", "PDPL"])
    });
  }
  if (processingActivities.length === 0) {
    chinaScore -= 8;
    saudiScore -= 8;
    gaps.push({
      code: "DATA-MAP-001",
      jurisdiction: "cross_border",
      frameworks: ["PIPL", "PDPL", "NCA"],
      severity: "medium",
      title: "Data processing profile is incomplete",
      description: "The supplier profile does not specify which data categories or processing activities are in scope.",
      mitigation: "Capture data processing activities, regulated datasets, and transfer patterns before onboarding approval.",
      penaltyContext: makePenaltyContext(["PIPL", "PDPL", "NCA"])
    });
  }
  const hasIso27001 = hasAny(certifications, ["iso27001", "iso 27001"]);
  if (!hasIso27001) {
    const deduction = isHighCriticality ? 18 : 12;
    chinaScore -= deduction;
    saudiScore -= deduction;
    gaps.push({
      code: "CERT-ISO27001-001",
      jurisdiction: "cross_border",
      frameworks: ["CSL", "DSL", "NCA"],
      severity: isHighCriticality ? "critical" : "high",
      title: "Missing ISO 27001 baseline",
      description: "The vendor did not provide an ISO 27001 certification indicator.",
      mitigation: "Obtain ISO 27001 or provide equivalent evidence of information security controls.",
      penaltyContext: makePenaltyContext(["CSL", "DSL", "NCA"])
    });
  }
  const hasSoc2 = hasAny(certifications, ["soc2", "soc 2", "soc ii", "soc2 type ii"]);
  if (!hasSoc2) {
    const deduction = hasHighDependencyChain ? 12 : 8;
    chinaScore -= deduction;
    saudiScore -= deduction;
    gaps.push({
      code: "CERT-SOC2-001",
      jurisdiction: "cross_border",
      frameworks: ["PIPL", "PDPL"],
      severity: hasHighDependencyChain ? "high" : "medium",
      title: "Missing independent control assurance",
      description: "SOC 2 Type II or equivalent third-party control attestations were not declared.",
      mitigation: "Provide independent control assurance reports for security and privacy controls.",
      penaltyContext: makePenaltyContext(["PIPL", "PDPL"])
    });
  }
  const hasIso27701 = hasAny(certifications, ["iso27701", "iso 27701", "privacy impact assessment"]);
  if (handlesSensitiveData && !hasIso27701) {
    chinaScore -= 10;
    saudiScore -= 10;
    gaps.push({
      code: "PRIVACY-PROGRAM-001",
      jurisdiction: "cross_border",
      frameworks: ["PIPL", "PDPL"],
      severity: "high",
      title: "Sensitive data processing lacks privacy assurance evidence",
      description: "The supplier processes sensitive or regulated data but did not declare ISO 27701 or equivalent privacy governance evidence.",
      mitigation: "Provide privacy impact assessment evidence, privacy governance controls, or ISO 27701-aligned assurance artifacts.",
      penaltyContext: makePenaltyContext(["PIPL", "PDPL"])
    });
  }
  const hasNcaControls = hasAny(certifications, ["nca ecc", "nca ccc2", "ecc", "ccc2"]);
  if (requiresSaudiControls && !hasNcaControls) {
    saudiScore -= 18;
    gaps.push({
      code: "CERT-NCA-001",
      jurisdiction: "saudi",
      frameworks: ["NCA"],
      severity: "high",
      title: "Missing NCA-aligned control evidence",
      description: "NCA ECC/CCC2 control alignment evidence was not provided.",
      mitigation: "Map and document controls against NCA ECC and CCC2 requirements.",
      penaltyContext: makePenaltyContext(["NCA"])
    });
  }
  const hasMlpsEvidence = hasAny(certifications, ["mlps", "mlps 2.0"]);
  if (requiresChinaControls && !hasMlpsEvidence && hasAny([vendor.serviceType || ""], ["saas", "iaas", "paas", "colocation"])) {
    chinaScore -= 12;
    gaps.push({
      code: "CERT-MLPS-001",
      jurisdiction: "china",
      frameworks: ["CSL", "MLPS 2.0"],
      severity: "high",
      title: "China control mapping evidence is incomplete",
      description: "The supplier operates cloud or hosted services relevant to China but did not declare MLPS-aligned control evidence.",
      mitigation: "Map relevant systems and controls to MLPS 2.0 expectations and retain third-party assessment evidence where applicable.",
      penaltyContext: makePenaltyContext(["CSL"])
    });
  }
  if (!cloudProvider && !hasAny([hostingEnvironment], ["on premises", "private cloud"])) {
    chinaScore -= 5;
    saudiScore -= 5;
    gaps.push({
      code: "CLOUD-INFO-001",
      jurisdiction: "cross_border",
      frameworks: ["CSL", "PDPL"],
      severity: "low",
      title: "Cloud provider not declared",
      description: "Cloud provider data was not supplied, reducing architecture traceability.",
      mitigation: "Declare cloud provider and region-level architecture for auditability.",
      penaltyContext: makePenaltyContext(["CSL", "PDPL"])
    });
  }
  if (hasAny([hostingEnvironment], ["multi cloud", "hybrid"]) && cloudProviders.length < 2) {
    chinaScore -= 6;
    saudiScore -= 6;
    gaps.push({
      code: "ARCH-MULTICLOUD-001",
      jurisdiction: "cross_border",
      frameworks: ["CSL", "PDPL", "NCA"],
      severity: "medium",
      title: "Hosting complexity is not fully documented",
      description: "The supplier declared a hybrid or multi-cloud model without enough provider-level detail for architecture traceability.",
      mitigation: "Document all in-scope providers, regions, and trust boundaries for hybrid or multi-cloud services.",
      penaltyContext: makePenaltyContext(["CSL", "PDPL", "NCA"])
    });
  }
  if (hasHighDependencyChain && !hasSoc2) {
    saudiScore -= 6;
    chinaScore -= 6;
    gaps.push({
      code: "SUPPLY-CHAIN-001",
      jurisdiction: "cross_border",
      frameworks: ["NCA", "PDPL", "CSL"],
      severity: "high",
      title: "Dependency chain needs stronger assurance",
      description: "Material third-party or fourth-party dependencies were declared without strong independent assurance evidence.",
      mitigation: "Obtain subprocessor assurance packs, contract flow-downs, and recurring control attestations for critical dependency chains.",
      penaltyContext: makePenaltyContext(["NCA", "PDPL", "CSL"])
    });
  }
  if (cloudProvider.includes("alibaba") || cloudProvider.includes("huawei")) {
    chinaScore += 5;
  }
  if (cloudProvider.includes("stc") || cloudProvider.includes("oracle") || cloudProvider.includes("aramco")) {
    saudiScore += 5;
  }
  chinaScore = clampScore(chinaScore);
  saudiScore = clampScore(saudiScore);
  const overallScore = clampScore((chinaScore + saudiScore) / 2);
  const riskLevel = inferRiskLevel(overallScore, gaps);
  const status = scoreToStatus(overallScore);
  const recommendations = dedupe(
    gaps.map((gap) => gap.mitigation).concat([
      "Run legal validation for all critical and high findings before onboarding.",
      "Keep a jurisdiction-specific evidence pack for CAC, SDAIA, and NCA audits."
    ])
  );
  return {
    vendorId: vendor.id,
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    overallScore,
    jurisdictionScores: {
      china: chinaScore,
      saudiArabia: saudiScore
    },
    status,
    riskLevel,
    gaps,
    recommendations
  };
}
function csvEscape(value) {
  const normalized = value.replace(/"/g, '""');
  return `"${normalized}"`;
}
function buildAssessmentCsv(vendor, result) {
  const lines = [];
  const appendProfileLine = (label, value) => {
    if (value && value.trim().length > 0) {
      lines.push(`${label},${csvEscape(value)}`);
    }
  };
  lines.push("DJAC Supplier Assessment Report");
  lines.push(`Vendor,${csvEscape(vendor.vendorName)}`);
  appendProfileLine("Business Registration Number", vendor.businessRegistrationNumber);
  appendProfileLine("Headquarters Location", vendor.headquartersLocation);
  appendProfileLine("Industry", vendor.industry);
  appendProfileLine("Service Type", vendor.serviceType);
  appendProfileLine("Service Scope", vendor.serviceScope);
  appendProfileLine("Hosting Environment", vendor.hostingEnvironment);
  appendProfileLine("Cloud Providers", vendor.cloudProvider);
  appendProfileLine("Operating Countries", vendor.operatingCountries);
  appendProfileLine("Data Locations", vendor.dataLocations);
  appendProfileLine("Regulatory Jurisdictions", vendor.regulatoryJurisdictions);
  appendProfileLine("Security Certifications & Standards", vendor.certifications);
  appendProfileLine("Data Processing Activities", vendor.dataProcessingActivities);
  appendProfileLine("Criticality Level", vendor.criticalityLevel);
  appendProfileLine("Inherent Risk Tier", vendor.riskTier);
  appendProfileLine("Third-Party Dependencies", vendor.thirdPartyDependencies);
  appendProfileLine("Fourth-Party Dependencies", vendor.fourthPartyDependencies);
  appendProfileLine("Primary Contact Name", vendor.primaryContactName);
  appendProfileLine("Primary Contact Email", vendor.primaryContactEmail);
  appendProfileLine("Primary Contact Role", vendor.primaryContactRole);
  appendProfileLine("Primary Contact Phone", vendor.primaryContactPhone);
  lines.push(`Generated At,${csvEscape(result.generatedAt)}`);
  lines.push(`Overall Score,${result.overallScore}`);
  lines.push(`China Score,${result.jurisdictionScores.china}`);
  lines.push(`Saudi Score,${result.jurisdictionScores.saudiArabia}`);
  lines.push(`Risk Level,${result.riskLevel}`);
  lines.push(`Status,${result.status}`);
  lines.push("");
  lines.push("Gap Code,Jurisdiction,Frameworks,Severity,Title,Description,Mitigation,Penalty Context");
  for (const gap of result.gaps) {
    lines.push(
      [
        gap.code,
        gap.jurisdiction,
        gap.frameworks.join("|"),
        gap.severity,
        gap.title,
        gap.description,
        gap.mitigation,
        gap.penaltyContext
      ].map((value) => csvEscape(value)).join(",")
    );
  }
  lines.push("");
  lines.push("Recommendations");
  for (const recommendation of result.recommendations) {
    lines.push(csvEscape(recommendation));
  }
  return lines.join("\n");
}
var PENALTY_CONTEXT;
var init_supplier_assessment = __esm({
  "server/supplier-assessment.ts"() {
    "use strict";
    PENALTY_CONTEXT = {
      PIPL: "PIPL penalties can reach up to 5% annual turnover.",
      CSL: "CSL enforcement can include operational restrictions and fines.",
      DSL: "DSL violations can trigger major fines and business sanctions.",
      PDPL: "PDPL penalties can reach up to SAR 5M.",
      NCA: "NCA non-compliance can impact licensing and critical contracts."
    };
  }
});

// server/compliance-db.ts
var compliance_db_exports = {};
__export(compliance_db_exports, {
  getAllFrameworks: () => getAllFrameworks,
  getAssessmentById: () => getAssessmentById,
  getAssessmentsByFramework: () => getAssessmentsByFramework,
  getAssessmentsByVendor: () => getAssessmentsByVendor,
  getComplianceComparison: () => getComplianceComparison,
  getComplianceMatrix: () => getComplianceMatrix,
  getConflictingFrameworks: () => getConflictingFrameworks,
  getControlByCode: () => getControlByCode,
  getControlMappings: () => getControlMappings,
  getControlsByCategory: () => getControlsByCategory,
  getControlsByFramework: () => getControlsByFramework,
  getCriticalGaps: () => getCriticalGaps,
  getEquivalentControls: () => getEquivalentControls,
  getFrameworkByCode: () => getFrameworkByCode,
  getFrameworkRelationships: () => getFrameworkRelationships,
  getFrameworksByCountry: () => getFrameworksByCountry,
  getGapsByAssessment: () => getGapsByAssessment,
  getOverlappingFrameworks: () => getOverlappingFrameworks,
  getRelationshipsByType: () => getRelationshipsByType,
  getTechStackByVendor: () => getTechStackByVendor,
  getVendorById: () => getVendorById,
  getVendorsByUser: () => getVendorsByUser
});
import { and as and7, eq as eq11, or as or3 } from "drizzle-orm";
function normalizeRelationshipType(rawType) {
  switch (rawType) {
    case "harmonization":
    case "coordination":
      return "coordination";
    case "overlap":
    case "conflict":
    case "dependency":
    case "gap":
      return rawType;
    default:
      return "overlap";
  }
}
function normalizeSeverity(rawSeverity, relationshipType) {
  if (rawSeverity === "critical" || rawSeverity === "high" || rawSeverity === "medium" || rawSeverity === "low") {
    return rawSeverity;
  }
  return DEFAULT_SEVERITY_BY_TYPE[relationshipType];
}
function enrichRelationship(row) {
  const relationshipType = normalizeRelationshipType(row.relationshipType);
  const severity = normalizeSeverity(row.severity, relationshipType);
  return {
    ...row,
    rawRelationshipType: row.relationshipType,
    relationshipType,
    severity,
    actionRecommendation: RELATIONSHIP_ACTIONS[relationshipType]
  };
}
function getCachedReference(key) {
  const entry = referenceCache.get(key);
  if (!entry) return void 0;
  if (Date.now() >= entry.expiresAt) {
    referenceCache.delete(key);
    return void 0;
  }
  return entry.value;
}
function setCachedReference(key, value, ttlMs = ENV.complianceCacheTtlMs) {
  referenceCache.set(key, {
    value,
    expiresAt: Date.now() + ttlMs
  });
  if (referenceCache.size > MAX_REFERENCE_CACHE_ENTRIES) {
    const now = Date.now();
    for (const [cacheKey, entry] of referenceCache) {
      if (now >= entry.expiresAt) {
        referenceCache.delete(cacheKey);
      }
    }
    while (referenceCache.size > MAX_REFERENCE_CACHE_ENTRIES) {
      const oldestKey = referenceCache.keys().next().value;
      if (!oldestKey) break;
      referenceCache.delete(oldestKey);
    }
  }
  return value;
}
async function withReferenceCache(key, loader, ttlMs = ENV.complianceCacheTtlMs) {
  const cached = getCachedReference(key);
  if (cached !== void 0) {
    return cached;
  }
  const inFlight = inFlightCacheLoads.get(key);
  if (inFlight) {
    return inFlight;
  }
  const promise = loader().then((value) => setCachedReference(key, value, ttlMs)).finally(() => {
    inFlightCacheLoads.delete(key);
  });
  inFlightCacheLoads.set(key, promise);
  return promise;
}
async function loadFallbackData() {
  if (fallbackDataCache) {
    return fallbackDataCache;
  }
  const modulePath = "../scripts/compliance-reference-data.mjs";
  const referenceModule = await import(modulePath);
  const now = /* @__PURE__ */ new Date();
  const fallbackFrameworks = referenceModule.complianceFrameworks.map(
    (framework, index) => ({
      id: index + 1,
      code: framework.code,
      name: framework.name,
      country: framework.country,
      description: framework.description,
      scope: framework.scope,
      enforcementAuthority: framework.enforcementAuthority,
      maxPenalty: framework.maxPenalty,
      createdAt: now,
      updatedAt: now
    })
  );
  const frameworkIdByCode = new Map(
    fallbackFrameworks.map((framework) => [framework.code, framework.id])
  );
  const fallbackControls = [];
  referenceModule.complianceControls.forEach((control, index) => {
    const frameworkId = frameworkIdByCode.get(control.frameworkCode);
    if (!frameworkId) {
      return;
    }
    fallbackControls.push({
      id: index + 1,
      frameworkId,
      controlCode: control.controlCode,
      controlName: control.controlName,
      category: control.category ?? null,
      description: control.description ?? null,
      requirement: control.requirement ?? null,
      applicability: control.applicability ?? null,
      createdAt: now,
      updatedAt: now
    });
  });
  const fallbackRelationships = [];
  referenceModule.complianceRelationships.forEach((relationship, index) => {
    const sourceFrameworkId = frameworkIdByCode.get(relationship.sourceFrameworkCode);
    const targetFrameworkId = frameworkIdByCode.get(relationship.targetFrameworkCode);
    if (!sourceFrameworkId || !targetFrameworkId) {
      return;
    }
    fallbackRelationships.push({
      id: index + 1,
      sourceFrameworkId,
      targetFrameworkId,
      relationshipType: relationship.relationshipType,
      description: relationship.description ?? null,
      severity: relationship.severity,
      riskLevel: relationship.riskLevel ?? null,
      mitigation: relationship.mitigation ?? null,
      createdAt: now,
      updatedAt: now
    });
  });
  fallbackDataCache = {
    frameworks: fallbackFrameworks,
    controls: fallbackControls,
    relationships: fallbackRelationships
  };
  return fallbackDataCache;
}
async function getAllFrameworks() {
  return withReferenceCache("frameworks:all", async () => {
    const db = await getDb();
    if (!db) {
      return (await loadFallbackData()).frameworks;
    }
    const rows = await db.select().from(frameworks);
    const relationshipRows = await db.select({ id: frameworkRelationships.id }).from(frameworkRelationships).limit(1);
    if (rows.length === 0 || relationshipRows.length === 0) {
      return (await loadFallbackData()).frameworks;
    }
    return rows;
  });
}
async function getFrameworkByCode(code) {
  const db = await getDb();
  if (!db) {
    const fallback2 = await loadFallbackData();
    return fallback2.frameworks.find((framework) => framework.code === code) ?? null;
  }
  const result = await db.select().from(frameworks).where(eq11(frameworks.code, code)).limit(1);
  if (result.length > 0) {
    return result[0];
  }
  const fallback = await loadFallbackData();
  return fallback.frameworks.find((framework) => framework.code === code) ?? null;
}
async function getFrameworksByCountry(country) {
  return withReferenceCache(`frameworks:country:${country.toLowerCase()}`, async () => {
    const db = await getDb();
    if (!db) {
      const fallback2 = await loadFallbackData();
      return fallback2.frameworks.filter((framework) => framework.country === country);
    }
    const rows = await db.select().from(frameworks).where(eq11(frameworks.country, country));
    if (rows.length > 0) {
      return rows;
    }
    const fallback = await loadFallbackData();
    return fallback.frameworks.filter((framework) => framework.country === country);
  });
}
async function getControlsByFramework(frameworkId) {
  return withReferenceCache(`controls:framework:${frameworkId}`, async () => {
    const db = await getDb();
    if (!db) {
      const fallback2 = await loadFallbackData();
      return fallback2.controls.filter((control) => control.frameworkId === frameworkId);
    }
    const rows = await db.select().from(complianceControls).where(eq11(complianceControls.frameworkId, frameworkId));
    if (rows.length > 0) {
      return rows;
    }
    const fallback = await loadFallbackData();
    return fallback.controls.filter((control) => control.frameworkId === frameworkId);
  });
}
async function getControlsByCategory(category) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(complianceControls).where(eq11(complianceControls.category, category));
}
async function getControlByCode(controlCode) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(complianceControls).where(eq11(complianceControls.controlCode, controlCode)).limit(1);
  return result.length > 0 ? result[0] : null;
}
async function getFrameworkRelationships(sourceFrameworkId) {
  return withReferenceCache(`relationships:framework:${sourceFrameworkId}`, async () => {
    const db = await getDb();
    if (!db) {
      const fallback2 = await loadFallbackData();
      return fallback2.relationships.filter((row) => row.sourceFrameworkId === sourceFrameworkId).map(enrichRelationship);
    }
    const rows = await db.select().from(frameworkRelationships).where(eq11(frameworkRelationships.sourceFrameworkId, sourceFrameworkId));
    if (rows.length > 0) {
      return rows.map(enrichRelationship);
    }
    const fallback = await loadFallbackData();
    return fallback.relationships.filter((row) => row.sourceFrameworkId === sourceFrameworkId).map(enrichRelationship);
  });
}
async function getRelationshipsByType(relationshipType) {
  const db = await getDb();
  if (!db) return [];
  const rows = relationshipType === "coordination" || relationshipType === "harmonization" ? await db.select().from(frameworkRelationships).where(
    or3(
      eq11(frameworkRelationships.relationshipType, "harmonization"),
      eq11(frameworkRelationships.relationshipType, "coordination")
    )
  ) : await db.select().from(frameworkRelationships).where(eq11(frameworkRelationships.relationshipType, relationshipType));
  return rows.map(enrichRelationship);
}
async function getConflictingFrameworks(frameworkId) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(frameworkRelationships).where(
    and7(
      eq11(frameworkRelationships.sourceFrameworkId, frameworkId),
      eq11(frameworkRelationships.relationshipType, "conflict")
    )
  );
  return rows.map(enrichRelationship);
}
async function getOverlappingFrameworks(frameworkId) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(frameworkRelationships).where(
    and7(
      eq11(frameworkRelationships.sourceFrameworkId, frameworkId),
      eq11(frameworkRelationships.relationshipType, "overlap")
    )
  );
  return rows.map(enrichRelationship);
}
async function getControlMappings(sourceControlId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(controlMappings).where(eq11(controlMappings.sourceControlId, sourceControlId));
}
async function getEquivalentControls(sourceControlId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(controlMappings).where(
    and7(
      eq11(controlMappings.sourceControlId, sourceControlId),
      eq11(controlMappings.mappingType, "equivalent")
    )
  );
}
async function getVendorsByUser(userId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(vendors).where(eq11(vendors.userId, userId));
}
async function getVendorById(vendorId) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(vendors).where(eq11(vendors.id, vendorId)).limit(1);
  return result.length > 0 ? result[0] : null;
}
async function getTechStackByVendor(vendorId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(techStackComponents).where(eq11(techStackComponents.vendorId, vendorId));
}
async function getAssessmentsByVendor(vendorId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(vendorAssessments).where(eq11(vendorAssessments.vendorId, vendorId));
}
async function getAssessmentsByFramework(frameworkId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(vendorAssessments).where(eq11(vendorAssessments.frameworkId, frameworkId));
}
async function getAssessmentById(assessmentId) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(vendorAssessments).where(eq11(vendorAssessments.id, assessmentId)).limit(1);
  return result.length > 0 ? result[0] : null;
}
async function getGapsByAssessment(assessmentId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(assessmentGaps).where(eq11(assessmentGaps.assessmentId, assessmentId));
}
async function getCriticalGaps(assessmentId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(assessmentGaps).where(
    and7(
      eq11(assessmentGaps.assessmentId, assessmentId),
      eq11(assessmentGaps.severity, "critical")
    )
  );
}
async function getComplianceComparison(framework1Id, framework2Id) {
  const cacheKey = `comparison:${Math.min(framework1Id, framework2Id)}:${Math.max(framework1Id, framework2Id)}`;
  return withReferenceCache(cacheKey, async () => {
    const db = await getDb();
    let allFrameworkRows = [];
    let allControlRows = [];
    let allRelationshipRows = [];
    if (db) {
      allFrameworkRows = await db.select().from(frameworks);
      allControlRows = await db.select().from(complianceControls);
      allRelationshipRows = await db.select().from(frameworkRelationships);
    }
    if (!db || allFrameworkRows.length === 0 || allRelationshipRows.length === 0) {
      const fallback = await loadFallbackData();
      allFrameworkRows = fallback.frameworks;
      allControlRows = fallback.controls;
      allRelationshipRows = fallback.relationships;
    }
    const framework1 = allFrameworkRows.find((framework) => framework.id === framework1Id);
    const framework2 = allFrameworkRows.find((framework) => framework.id === framework2Id);
    if (!framework1 || !framework2) return null;
    const controls1 = allControlRows.filter((control) => control.frameworkId === framework1Id);
    const controls2 = allControlRows.filter((control) => control.frameworkId === framework2Id);
    const rawRelationships = allRelationshipRows.filter(
      (row) => row.sourceFrameworkId === framework1Id && row.targetFrameworkId === framework2Id || row.sourceFrameworkId === framework2Id && row.targetFrameworkId === framework1Id
    );
    const relationships = rawRelationships.map((row) => {
      const enriched = enrichRelationship(row);
      const isReverseDirection = row.sourceFrameworkId === framework2Id && row.targetFrameworkId === framework1Id;
      return {
        ...enriched,
        sourceDirection: isReverseDirection ? framework2.code : framework1.code,
        targetDirection: isReverseDirection ? framework1.code : framework2.code
      };
    }).sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity]);
    return {
      framework1,
      framework2,
      controls1,
      controls2,
      relationships,
      relationshipActions: relationships.map((item) => ({
        type: item.relationshipType,
        severity: item.severity,
        actionRecommendation: item.actionRecommendation,
        mitigation: item.mitigation ?? "No mitigation strategy documented."
      })),
      penaltyRiskSummary: [
        {
          frameworkCode: framework1.code,
          maxPenalty: framework1.maxPenalty
        },
        {
          frameworkCode: framework2.code,
          maxPenalty: framework2.maxPenalty
        }
      ]
    };
  });
}
async function getComplianceMatrix() {
  return withReferenceCache("matrix:all", async () => {
    const db = await getDb();
    let allFrameworks = [];
    let allRelationships = [];
    if (db) {
      allFrameworks = await db.select().from(frameworks);
      allRelationships = await db.select().from(frameworkRelationships);
    }
    if (!db || allFrameworks.length === 0 || allRelationships.length === 0) {
      const fallback = await loadFallbackData();
      allFrameworks = fallback.frameworks;
      allRelationships = fallback.relationships;
    }
    const codeById = new Map(
      allFrameworks.map((framework) => [framework.id, framework.code])
    );
    const matrixMap = /* @__PURE__ */ new Map();
    for (const row of allRelationships) {
      const source = codeById.get(row.sourceFrameworkId);
      const target = codeById.get(row.targetFrameworkId);
      if (!source || !target || source === target) continue;
      const normalized = enrichRelationship(row);
      const key = `${source}->${target}`;
      if (!matrixMap.has(key)) {
        matrixMap.set(key, {
          source,
          target,
          relationships: /* @__PURE__ */ new Set(),
          actions: /* @__PURE__ */ new Set(),
          maxSeverity: normalized.severity
        });
      }
      const entry = matrixMap.get(key);
      entry.relationships.add(normalized.relationshipType);
      entry.actions.add(normalized.actionRecommendation);
      if (SEVERITY_RANK[normalized.severity] > SEVERITY_RANK[entry.maxSeverity]) {
        entry.maxSeverity = normalized.severity;
      }
    }
    return Array.from(matrixMap.values()).map((entry) => ({
      source: entry.source,
      target: entry.target,
      relationships: Array.from(entry.relationships),
      actions: Array.from(entry.actions),
      maxSeverity: entry.maxSeverity
    }));
  });
}
var RELATIONSHIP_ACTIONS, DEFAULT_SEVERITY_BY_TYPE, SEVERITY_RANK, fallbackDataCache, referenceCache, inFlightCacheLoads, MAX_REFERENCE_CACHE_ENTRIES;
var init_compliance_db = __esm({
  "server/compliance-db.ts"() {
    "use strict";
    init_schema();
    init_env();
    init_db();
    RELATIONSHIP_ACTIONS = {
      overlap: "Recommend unified control implementation.",
      conflict: "Flag for separate infrastructure and data pipelines.",
      coordination: "Recommend single implementation aligned to both frameworks.",
      dependency: "Guide implementation order with prerequisite controls first.",
      gap: "Highlight regulatory blind spots and legal validation points."
    };
    DEFAULT_SEVERITY_BY_TYPE = {
      overlap: "medium",
      conflict: "critical",
      coordination: "low",
      dependency: "high",
      gap: "high"
    };
    SEVERITY_RANK = {
      low: 1,
      medium: 2,
      high: 3,
      critical: 4
    };
    fallbackDataCache = null;
    referenceCache = /* @__PURE__ */ new Map();
    inFlightCacheLoads = /* @__PURE__ */ new Map();
    MAX_REFERENCE_CACHE_ENTRIES = 500;
  }
});

// server/_core/index.ts
import "dotenv/config";

// server/_core/sentry.ts
init_env();
init_config_schema();
import * as Sentry from "@sentry/node";
function initialiseSentry() {
  if (!ENV.sentryDsn) return;
  Sentry.init({
    dsn: ENV.sentryDsn,
    environment: parsedEnv.NODE_ENV ?? "production",
    // Trace 10 % of requests in production; 100 % in dev/staging for visibility.
    tracesSampleRate: ENV.isProduction ? 0.1 : 1,
    // Attach request data (URL, method, headers) to error events.
    includeLocalVariables: !ENV.isProduction
  });
  console.info("[Sentry] Error monitoring initialised.");
}
function sentryErrorHandler() {
  return Sentry.expressErrorHandler();
}

// server/_core/index.ts
import compression from "compression";
import express3 from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var AXIOS_TIMEOUT_MS = 3e4;
var UNAUTHED_ERR_MSG = "Authentication required (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have the required permission (10002)";
var NOT_PLATFORM_ADMIN_ERR_MSG = "Platform administrator access required (10003)";
var NOT_SUPER_ADMIN_ERR_MSG = "Super administrator access required (10004)";
var NOT_COMPANY_ADMIN_ERR_MSG = "Company administrator access required (10005)";
var ROLE_LEVEL = {
  basic_user: 10,
  user: 10,
  professional_user: 20,
  company_admin: 30,
  platform_admin: 40,
  yalla_hack_employee: 45,
  admin: 40,
  super_admin: 100
};
function hasMinRole(actorRole, required) {
  const actorLevel = ROLE_LEVEL[actorRole] ?? 0;
  return actorLevel >= ROLE_LEVEL[required];
}
var MODULE_SLUGS = [
  "asset_inventory",
  "vendor_assessment",
  "gap_tracker",
  "remediation_planner",
  "risk_register",
  "policy_manager",
  "incident_register",
  "audit_schedule",
  "dsr_management",
  "evidence_repository",
  "security_maturity",
  "compliance_tracker",
  "compliance_reports",
  "report_center",
  "compliance_heatmap",
  "compliance_calendar",
  "vendor_compliance_profiles",
  "assessment_history",
  "service_requests",
  "api_keys",
  "team_members",
  "org_settings",
  "audit_log",
  "pro_intelligence",
  "transfer_checker",
  "law_library",
  "framework_analysis",
  "billing",
  "admin_control_center",
  "saas_metrics"
];
var VIEW_ONLY = { canView: true, canCreate: false, canEdit: false, canDelete: false, canExport: false, canInvite: false };
var STANDARD = { canView: true, canCreate: true, canEdit: true, canDelete: false, canExport: true, canInvite: false };
var FULL = { canView: true, canCreate: true, canEdit: true, canDelete: true, canExport: true, canInvite: true };
var DEFAULT_ORG_ROLE_PERMISSIONS = {
  analyst: {
    asset_inventory: VIEW_ONLY,
    vendor_assessment: VIEW_ONLY,
    gap_tracker: VIEW_ONLY,
    remediation_planner: VIEW_ONLY,
    risk_register: VIEW_ONLY,
    policy_manager: VIEW_ONLY,
    incident_register: VIEW_ONLY,
    audit_schedule: VIEW_ONLY,
    dsr_management: VIEW_ONLY,
    evidence_repository: VIEW_ONLY,
    security_maturity: VIEW_ONLY,
    compliance_tracker: VIEW_ONLY,
    compliance_reports: VIEW_ONLY,
    report_center: VIEW_ONLY,
    compliance_heatmap: VIEW_ONLY,
    compliance_calendar: VIEW_ONLY,
    vendor_compliance_profiles: VIEW_ONLY,
    assessment_history: VIEW_ONLY,
    service_requests: STANDARD,
    pro_intelligence: VIEW_ONLY,
    transfer_checker: VIEW_ONLY,
    law_library: VIEW_ONLY,
    framework_analysis: VIEW_ONLY
  },
  compliance_officer: {
    asset_inventory: STANDARD,
    vendor_assessment: STANDARD,
    gap_tracker: STANDARD,
    remediation_planner: STANDARD,
    risk_register: STANDARD,
    policy_manager: STANDARD,
    incident_register: STANDARD,
    audit_schedule: STANDARD,
    dsr_management: STANDARD,
    evidence_repository: STANDARD,
    security_maturity: STANDARD,
    compliance_tracker: STANDARD,
    compliance_reports: STANDARD,
    report_center: STANDARD,
    compliance_heatmap: STANDARD,
    compliance_calendar: STANDARD,
    vendor_compliance_profiles: STANDARD,
    assessment_history: STANDARD,
    service_requests: STANDARD,
    pro_intelligence: STANDARD,
    transfer_checker: STANDARD,
    law_library: VIEW_ONLY,
    framework_analysis: VIEW_ONLY
  },
  admin: {
    asset_inventory: FULL,
    vendor_assessment: FULL,
    gap_tracker: FULL,
    remediation_planner: FULL,
    risk_register: FULL,
    policy_manager: FULL,
    incident_register: FULL,
    audit_schedule: FULL,
    dsr_management: FULL,
    evidence_repository: FULL,
    security_maturity: FULL,
    compliance_tracker: FULL,
    compliance_reports: FULL,
    report_center: FULL,
    compliance_heatmap: FULL,
    compliance_calendar: FULL,
    vendor_compliance_profiles: FULL,
    assessment_history: FULL,
    service_requests: FULL,
    api_keys: STANDARD,
    team_members: STANDARD,
    org_settings: STANDARD,
    audit_log: VIEW_ONLY,
    pro_intelligence: FULL,
    transfer_checker: FULL,
    law_library: VIEW_ONLY,
    framework_analysis: VIEW_ONLY,
    billing: VIEW_ONLY
  },
  owner: {
    asset_inventory: FULL,
    vendor_assessment: FULL,
    gap_tracker: FULL,
    remediation_planner: FULL,
    risk_register: FULL,
    policy_manager: FULL,
    incident_register: FULL,
    audit_schedule: FULL,
    dsr_management: FULL,
    evidence_repository: FULL,
    security_maturity: FULL,
    compliance_tracker: FULL,
    compliance_reports: FULL,
    report_center: FULL,
    compliance_heatmap: FULL,
    compliance_calendar: FULL,
    vendor_compliance_profiles: FULL,
    assessment_history: FULL,
    service_requests: FULL,
    api_keys: FULL,
    team_members: FULL,
    org_settings: FULL,
    audit_log: FULL,
    pro_intelligence: FULL,
    transfer_checker: FULL,
    law_library: FULL,
    framework_analysis: FULL,
    billing: FULL
  }
};

// server/_core/oauth.ts
init_db();

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  const secure = isSecureRequest(req);
  const sameSite = secure ? "none" : "lax";
  return {
    httpOnly: true,
    path: "/",
    sameSite,
    secure
  };
}

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
init_db();
init_env();
import axios from "axios";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
var isNonEmptyString = (value) => typeof value === "string" && value.length > 0;
var EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
var GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
var GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;
var OAuthService = class {
  constructor(client) {
    this.client = client;
    console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
    if (!ENV.oAuthServerUrl) {
      console.error(
        "[OAuth] ERROR: OAUTH_SERVER_URL is not configured! Set OAUTH_SERVER_URL environment variable."
      );
    }
  }
  decodeState(state) {
    const redirectUri = atob(state);
    return redirectUri;
  }
  async getTokenByCode(code, state) {
    const payload = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state)
    };
    const { data } = await this.client.post(
      EXCHANGE_TOKEN_PATH,
      payload
    );
    return data;
  }
  async getUserInfoByToken(token) {
    const { data } = await this.client.post(
      GET_USER_INFO_PATH,
      {
        accessToken: token.accessToken
      }
    );
    return data;
  }
};
var createOAuthHttpClient = () => axios.create({
  baseURL: ENV.oAuthServerUrl,
  timeout: AXIOS_TIMEOUT_MS
});
var SDKServer = class {
  constructor(client = createOAuthHttpClient()) {
    this.client = client;
    this.oauthService = new OAuthService(this.client);
  }
  deriveLoginMethod(platforms, fallback) {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set(
      platforms.filter((p) => typeof p === "string")
    );
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (set.has("REGISTERED_PLATFORM_MICROSOFT") || set.has("REGISTERED_PLATFORM_AZURE"))
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }
  /**
   * Exchange OAuth authorization code for access token
   * @example
   * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(code, state) {
    return this.oauthService.getTokenByCode(code, state);
  }
  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
   */
  async getUserInfo(accessToken) {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken
    });
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }
  /**
   * Create a session token for a Manus user openId
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.openId);
   */
  async createSessionToken(openId, options = {}) {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || ""
      },
      options
    );
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
      const { openId, appId, name } = payload;
      if (!isNonEmptyString(openId) || !isNonEmptyString(appId) || !isNonEmptyString(name)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
      return {
        openId,
        appId,
        name
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }
  async getUserInfoWithJwt(jwtToken) {
    const payload = {
      jwtToken,
      projectId: ENV.appId
    };
    const { data } = await this.client.post(
      GET_USER_INFO_WITH_JWT_PATH,
      payload
    );
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  async authenticateRequest(req) {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    const sessionUserId = session.openId;
    const signedInAt = /* @__PURE__ */ new Date();
    let user = await getUserByOpenId(sessionUserId);
    if (!user) {
      try {
        const userInfo = await this.getUserInfoWithJwt(sessionCookie ?? "");
        await upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: signedInAt,
          lastActivityAt: signedInAt
        });
        user = await getUserByOpenId(userInfo.openId);
      } catch (error) {
        console.error("[Auth] Failed to sync user from OAuth:", error);
        throw ForbiddenError("Failed to sync user info");
      }
    }
    if (!user) {
      throw ForbiddenError("User not found");
    }
    await upsertUser({
      openId: user.openId,
      lastSignedIn: signedInAt,
      lastActivityAt: signedInAt
    });
    return user;
  }
};
var sdk = new SDKServer();

// server/_core/oauth.ts
function getQueryParam(req, key) {
  const value = req.query[key];
  return typeof value === "string" ? value : void 0;
}
function registerOAuthRoutes(app) {
  app.get("/api/oauth/callback", async (req, res) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }
    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }
      const signedInAt = /* @__PURE__ */ new Date();
      await upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: signedInAt,
        lastActivityAt: signedInAt
      });
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions3 = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions3, maxAge: ONE_YEAR_MS });
      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}

// server/admin-router.ts
import { z } from "zod";

// shared/vendorProfile.ts
var vendorIndustryValues = [
  "software-saas",
  "cloud-digital-infrastructure",
  "financial-services",
  "healthcare-life-sciences",
  "government-public-sector",
  "telecommunications",
  "energy-utilities",
  "manufacturing-operational-technology",
  "retail-ecommerce",
  "logistics-supply-chain",
  "professional-services",
  "other"
];
var vendorServiceTypeValues = [
  "saas",
  "paas",
  "iaas",
  "managed-service-provider",
  "managed-security-service-provider",
  "payment-processor",
  "telecom-network",
  "colocation-data-center",
  "business-process-outsourcing",
  "professional-services",
  "other"
];
var vendorCloudProviderValues = [
  "aws",
  "azure",
  "gcp",
  "oracle-cloud",
  "alibaba-cloud",
  "huawei-cloud",
  "tencent-cloud",
  "stc-cloud",
  "private-cloud",
  "other"
];
var vendorHostingEnvironmentValues = [
  "on-premises",
  "private-cloud",
  "single-public-cloud",
  "multi-cloud",
  "hybrid"
];
var vendorCountryValues = [
  "saudi-arabia",
  "china",
  "united-arab-emirates",
  "bahrain",
  "singapore",
  "india",
  "germany",
  "netherlands",
  "united-kingdom",
  "united-states",
  "other"
];
var vendorJurisdictionValues = [
  "saudi-arabia",
  "china",
  "gcc",
  "eu-eea",
  "united-kingdom",
  "united-states",
  "apac"
];
var vendorComplianceStandardValues = [
  "iso-27001",
  "iso-27701",
  "soc-2-type-ii",
  "pci-dss",
  "csa-star",
  "nist-csf-aligned",
  "nca-ecc",
  "nca-ccc",
  "mlps-2.0",
  "privacy-impact-assessment-program"
];
var vendorDataProcessingActivityValues = [
  "customer-personal-data",
  "employee-data",
  "financial-payment-data",
  "health-biometric-data",
  "security-telemetry-logs",
  "source-code-intellectual-property",
  "operational-technology-data",
  "identity-access-data",
  "backup-disaster-recovery-data",
  "cross-border-data-transfer"
];
var vendorCriticalityLevelValues = ["low", "moderate", "high", "mission-critical"];
var vendorRiskTierValues = [
  "tier-1-critical",
  "tier-2-high",
  "tier-3-moderate",
  "tier-4-low"
];
var vendorDependencyLevelValues = ["none", "limited", "material", "extensive"];
function parseVendorMultiValue(value) {
  if (!value) {
    return [];
  }
  return Array.from(
    new Set(
      value.split(/[;,|\n]/g).map((item) => item.trim()).filter(Boolean)
    )
  );
}
function serializeVendorMultiValue(values) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))).join(";");
}

// server/control-center-store.ts
init_schema();
init_db();
init_env();
import { and as and2, desc as desc2, eq as eq3, inArray as inArray2, lt, sql } from "drizzle-orm";

// server/vendor-store.ts
import { and, eq as eq2, inArray } from "drizzle-orm";
init_schema();
init_db();
var inMemoryVendors = /* @__PURE__ */ new Map();
var inMemoryTechStackByVendor = /* @__PURE__ */ new Map();
var inMemoryVendorId = 1;
var inMemoryTechStackId = 1;
function normalizeText(value) {
  if (!value) return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}
function normalizeEmail(value) {
  const normalized = normalizeText(value);
  return normalized ? normalized.toLowerCase() : null;
}
function toTechStackInsertValues(vendorId, components) {
  return components.map((component) => ({
    vendorId,
    componentName: component.componentName.trim(),
    componentType: normalizeText(component.componentType) ?? "Unspecified",
    technology: normalizeText(component.technology),
    description: normalizeText(component.description),
    dataHandling: normalizeText(component.dataHandling)
  })).filter((component) => component.componentName.length > 0);
}
function setInMemoryTechStack(vendorId, components) {
  const now = /* @__PURE__ */ new Date();
  const rows = toTechStackInsertValues(vendorId, components).map((component) => ({
    id: inMemoryTechStackId++,
    vendorId,
    componentName: component.componentName,
    componentType: component.componentType,
    technology: component.technology,
    description: component.description,
    dataHandling: component.dataHandling,
    createdAt: now,
    updatedAt: now
  }));
  inMemoryTechStackByVendor.set(vendorId, rows);
  return rows;
}
function toInsertValues(userId, input, organizationId) {
  return {
    userId,
    organizationId: organizationId != null && organizationId > 0 ? organizationId : null,
    vendorName: input.vendorName.trim(),
    vendorDescription: normalizeText(input.vendorDescription),
    industry: normalizeText(input.industry),
    businessRegistrationNumber: normalizeText(input.businessRegistrationNumber),
    headquartersLocation: normalizeText(input.headquartersLocation),
    primaryContactName: normalizeText(input.primaryContactName),
    primaryContactEmail: normalizeEmail(input.primaryContactEmail),
    primaryContactRole: normalizeText(input.primaryContactRole),
    primaryContactPhone: normalizeText(input.primaryContactPhone),
    serviceType: normalizeText(input.serviceType),
    serviceScope: normalizeText(input.serviceScope),
    hostingEnvironment: normalizeText(input.hostingEnvironment),
    operatingCountries: normalizeText(serializeVendorMultiValue(input.operatingCountries)),
    cloudProvider: normalizeText(serializeVendorMultiValue(input.cloudProviders)),
    dataLocations: normalizeText(serializeVendorMultiValue(input.dataLocations)),
    regulatoryJurisdictions: normalizeText(
      serializeVendorMultiValue(input.regulatoryJurisdictions)
    ),
    certifications: normalizeText(serializeVendorMultiValue(input.certifications)),
    dataProcessingActivities: normalizeText(
      serializeVendorMultiValue(input.dataProcessingActivities)
    ),
    criticalityLevel: normalizeText(input.criticalityLevel),
    riskTier: normalizeText(input.riskTier),
    thirdPartyDependencies: normalizeText(input.thirdPartyDependencies),
    fourthPartyDependencies: normalizeText(input.fourthPartyDependencies)
  };
}
function createInMemoryVendor(userId, input, components, organizationId) {
  const now = /* @__PURE__ */ new Date();
  const id = inMemoryVendorId++;
  const vendor = {
    id,
    ...toInsertValues(userId, input, organizationId),
    createdAt: now,
    updatedAt: now
  };
  inMemoryVendors.set(id, vendor);
  if (components.length > 0) {
    setInMemoryTechStack(id, components);
  }
  return vendor;
}
async function listVendorProfiles(userId, organizationId) {
  const useOrg = organizationId != null && organizationId > 0;
  const db = await getDb();
  if (!db) {
    return Array.from(inMemoryVendors.values()).filter(
      (vendor) => useOrg ? vendor.organizationId === organizationId : vendor.userId === userId
    );
  }
  if (useOrg) {
    return db.select().from(vendors).where(eq2(vendors.organizationId, organizationId));
  }
  return db.select().from(vendors).where(eq2(vendors.userId, userId));
}
async function listAllVendorProfiles(limit = 200) {
  const db = await getDb();
  if (!db) {
    return Array.from(inMemoryVendors.values()).sort((a, b) => a.createdAt < b.createdAt ? 1 : -1).slice(0, limit);
  }
  return db.select().from(vendors).limit(limit);
}
async function getVendorProfileById(vendorId, userId, organizationId) {
  const useOrg = organizationId != null && organizationId > 0;
  const db = await getDb();
  if (!db) {
    const vendor = inMemoryVendors.get(vendorId);
    if (!vendor) return null;
    if (useOrg ? vendor.organizationId !== organizationId : vendor.userId !== userId) return null;
    return vendor;
  }
  const rows = await db.select().from(vendors).where(
    useOrg ? and(eq2(vendors.id, vendorId), eq2(vendors.organizationId, organizationId)) : and(eq2(vendors.id, vendorId), eq2(vendors.userId, userId))
  ).limit(1);
  return rows.length > 0 ? rows[0] : null;
}
async function createVendorProfile(userId, input, organizationId) {
  const db = await getDb();
  const components = input.techStackComponents ?? [];
  if (!db) {
    return createInMemoryVendor(userId, input, components, organizationId);
  }
  const insertValues = toInsertValues(userId, input, organizationId);
  const [insertedVendor] = await db.insert(vendors).values(insertValues).returning({ id: vendors.id });
  const vendorId = insertedVendor.id;
  if (!vendorId) {
    throw new Error("Failed to create vendor record");
  }
  const techStackValues = toTechStackInsertValues(vendorId, components);
  if (techStackValues.length > 0) {
    await db.insert(techStackComponents).values(techStackValues);
  }
  const created = await getVendorProfileById(vendorId, userId, organizationId);
  if (!created) {
    throw new Error("Vendor was created but could not be loaded");
  }
  return created;
}
async function deleteVendorProfile(vendorId, userId, organizationId) {
  const db = await getDb();
  if (!db) {
    const existing = inMemoryVendors.get(vendorId);
    if (!existing) throw new Error("Vendor not found");
    const useOrg2 = organizationId != null && organizationId > 0;
    if (useOrg2 ? existing.organizationId !== organizationId : existing.userId !== userId) {
      throw new Error("Vendor not found");
    }
    inMemoryVendors.delete(vendorId);
    inMemoryTechStackByVendor.delete(vendorId);
    return;
  }
  const useOrg = organizationId != null && organizationId > 0;
  const whereClause = useOrg ? and(eq2(vendors.id, vendorId), eq2(vendors.organizationId, organizationId)) : and(eq2(vendors.id, vendorId), eq2(vendors.userId, userId));
  await db.delete(techStackComponents).where(eq2(techStackComponents.vendorId, vendorId));
  await db.delete(vendors).where(whereClause);
}
async function patchVendorBasicFields(vendorId, userId, patch, organizationId) {
  const db = await getDb();
  const useOrg = organizationId != null && organizationId > 0;
  if (!db) {
    const existing = inMemoryVendors.get(vendorId);
    if (!existing) throw new Error("Vendor not found");
    if (useOrg ? existing.organizationId !== organizationId : existing.userId !== userId) {
      throw new Error("Vendor not found");
    }
    const updated2 = {
      ...existing,
      vendorName: patch.vendorName,
      vendorDescription: patch.vendorDescription,
      criticalityLevel: patch.criticalityLevel,
      riskTier: patch.riskTier,
      primaryContactName: patch.primaryContactName,
      primaryContactEmail: patch.primaryContactEmail,
      primaryContactRole: patch.primaryContactRole,
      primaryContactPhone: patch.primaryContactPhone ?? null,
      updatedAt: /* @__PURE__ */ new Date()
    };
    inMemoryVendors.set(vendorId, updated2);
    return updated2;
  }
  const whereClause = useOrg ? and(eq2(vendors.id, vendorId), eq2(vendors.organizationId, organizationId)) : and(eq2(vendors.id, vendorId), eq2(vendors.userId, userId));
  await db.update(vendors).set({
    vendorName: patch.vendorName,
    vendorDescription: patch.vendorDescription,
    criticalityLevel: patch.criticalityLevel,
    riskTier: patch.riskTier,
    primaryContactName: patch.primaryContactName,
    primaryContactEmail: patch.primaryContactEmail,
    primaryContactRole: patch.primaryContactRole,
    primaryContactPhone: patch.primaryContactPhone ?? null,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(whereClause);
  const updated = await getVendorProfileById(vendorId, userId, organizationId);
  if (!updated) throw new Error("Vendor was patched but could not be reloaded");
  return updated;
}
async function listTechStackComponentsByVendorId(vendorId) {
  const db = await getDb();
  if (!db) {
    return inMemoryTechStackByVendor.get(vendorId) ?? [];
  }
  return db.select().from(techStackComponents).where(eq2(techStackComponents.vendorId, vendorId));
}
async function listTechStackComponentsByVendorIds(vendorIds) {
  if (vendorIds.length === 0) {
    return [];
  }
  const db = await getDb();
  if (!db) {
    return vendorIds.flatMap((vendorId) => inMemoryTechStackByVendor.get(vendorId) ?? []);
  }
  return db.select().from(techStackComponents).where(inArray(techStackComponents.vendorId, vendorIds));
}

// server/control-center-store.ts
var accessRequestId = 1;
var consultationRequestId = 1;
var activityEventId = 1;
var notificationId = 1;
var memoryAccessRequests = [];
var memoryConsultationRequests = [];
var memoryActivityEvents = [];
var memoryAdminNotifications = [];
function canUseInMemoryFallback() {
  return ENV.allowInMemoryPersistenceFallback;
}
function trimToNull(value) {
  if (value == null) {
    return null;
  }
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}
function normalizeEmail2(value) {
  return value.trim().toLowerCase();
}
function toJsonText(value) {
  if (!value) {
    return null;
  }
  return JSON.stringify(value);
}
function fromJsonText(value) {
  if (!value) {
    return null;
  }
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}
async function loadAccessRequestById(id) {
  const db = await getDb();
  if (!db) {
    return memoryAccessRequests.find((request) => request.id === id) ?? null;
  }
  const rows = await db.select().from(accessRequests).where(eq3(accessRequests.id, id)).limit(1);
  return rows[0] ?? null;
}
async function loadConsultationRequestById(id) {
  const db = await getDb();
  if (!db) {
    return memoryConsultationRequests.find((request) => request.id === id) ?? null;
  }
  const rows = await db.select().from(consultationRequests).where(eq3(consultationRequests.id, id)).limit(1);
  return rows[0] ?? null;
}
async function createAdminNotification(input) {
  const db = await getDb();
  const title = input.title.trim();
  const content = trimToNull(input.content) ?? null;
  const entityType = trimToNull(input.entityType);
  const entityId = input.entityId ?? null;
  const now = /* @__PURE__ */ new Date();
  if (!db) {
    const record = {
      id: notificationId++,
      category: input.category,
      title,
      content,
      entityType,
      entityId,
      isRead: 0,
      readAt: null,
      createdAt: now
    };
    memoryAdminNotifications.unshift(record);
    return record;
  }
  const [inserted] = await db.insert(adminNotifications).values({
    category: input.category,
    title,
    content,
    entityType,
    entityId
  }).returning({ id: adminNotifications.id });
  const id = inserted?.id ?? 0;
  const rows = await db.select().from(adminNotifications).where(eq3(adminNotifications.id, id)).limit(1);
  return rows[0] ?? null;
}
async function recordActivity(input) {
  const db = await getDb();
  const now = /* @__PURE__ */ new Date();
  const metadata = toJsonText(input.metadata);
  if (input.userId) {
    await touchUserActivity(input.userId);
  }
  if (!db) {
    const record = {
      id: activityEventId++,
      userId: input.userId ?? null,
      localUserId: null,
      actorType: input.actorType,
      actorRole: null,
      action: input.action.trim(),
      entityType: input.entityType.trim(),
      entityId: input.entityId ?? null,
      targetEntity: null,
      payload: null,
      ipHash: null,
      metadata,
      createdAt: now
    };
    memoryActivityEvents.unshift(record);
    return record;
  }
  const [inserted] = await db.insert(activityEvents).values({
    userId: input.userId ?? null,
    actorType: input.actorType,
    action: input.action.trim(),
    entityType: input.entityType.trim(),
    entityId: input.entityId ?? null,
    metadata
  }).returning({ id: activityEvents.id });
  const id = inserted?.id ?? 0;
  const rows = await db.select().from(activityEvents).where(eq3(activityEvents.id, id)).limit(1);
  return rows[0] ?? null;
}
async function createAccessRequest(input) {
  const db = await getDb();
  if (!db && !canUseInMemoryFallback()) {
    throw new Error(getDatabaseUnavailableMessage());
  }
  const now = /* @__PURE__ */ new Date();
  const values = {
    fullName: input.fullName.trim(),
    email: normalizeEmail2(input.email),
    organizationName: input.organizationName.trim(),
    organizationType: trimToNull(input.organizationType),
    useCase: trimToNull(input.useCase),
    preferredLocale: input.preferredLocale ?? "en",
    status: "new"
  };
  let record = null;
  if (!db) {
    record = {
      id: accessRequestId++,
      ...values,
      createdAt: now,
      updatedAt: now
    };
    memoryAccessRequests.unshift(record);
  } else {
    const [inserted] = await db.insert(accessRequests).values(values).returning({ id: accessRequests.id });
    record = await loadAccessRequestById(inserted?.id ?? 0);
  }
  if (!record) {
    throw new Error("Access request could not be created.");
  }
  await recordActivity({
    actorType: "visitor",
    action: "access_request_created",
    entityType: "access_request",
    entityId: record.id,
    metadata: {
      organizationName: record.organizationName,
      email: record.email
    }
  });
  await createAdminNotification({
    category: "registration",
    title: `New access request from ${record.organizationName}`,
    content: `${record.fullName} requested onboarding access for ${record.organizationName}.`,
    entityType: "access_request",
    entityId: record.id
  });
  return record;
}
async function createConsultationRequest(input) {
  const db = await getDb();
  if (!db && !canUseInMemoryFallback()) {
    throw new Error(getDatabaseUnavailableMessage());
  }
  const now = /* @__PURE__ */ new Date();
  const values = {
    userId: input.userId ?? null,
    contactName: input.contactName.trim(),
    contactEmail: normalizeEmail2(input.contactEmail),
    organizationName: input.organizationName.trim(),
    topic: input.topic.trim(),
    jurisdictions: JSON.stringify(input.jurisdictions),
    summary: input.summary.trim(),
    vendorName: trimToNull(input.vendorName),
    techStackSummary: trimToNull(input.techStackSummary),
    status: "new",
    priority: "medium",
    adminResponse: null,
    respondedAt: null,
    assignedAdminUserId: null
  };
  let record = null;
  if (!db) {
    record = {
      id: consultationRequestId++,
      ...values,
      createdAt: now,
      updatedAt: now
    };
    memoryConsultationRequests.unshift(record);
  } else {
    const [inserted] = await db.insert(consultationRequests).values(values).returning({ id: consultationRequests.id });
    record = await loadConsultationRequestById(inserted?.id ?? 0);
  }
  if (!record) {
    throw new Error("Consultation request could not be created.");
  }
  await recordActivity({
    userId: record.userId,
    actorType: record.userId ? "client" : "visitor",
    action: "consultation_request_created",
    entityType: "consultation_request",
    entityId: record.id,
    metadata: {
      topic: record.topic,
      organizationName: record.organizationName,
      vendorName: record.vendorName
    }
  });
  await createAdminNotification({
    category: "consultation",
    title: `New consultation request: ${record.topic}`,
    content: `${record.organizationName} submitted a consultation request.`,
    entityType: "consultation_request",
    entityId: record.id
  });
  return record;
}
async function listAccessRequests(limit = 50) {
  const db = await getDb();
  if (!db) {
    return memoryAccessRequests.slice(0, limit);
  }
  return db.select().from(accessRequests).orderBy(desc2(accessRequests.createdAt)).limit(limit);
}
async function updateAccessRequestStatus(input) {
  const db = await getDb();
  const now = /* @__PURE__ */ new Date();
  if (!db) {
    const target = memoryAccessRequests.find((item) => item.id === input.accessRequestId);
    if (!target) {
      return null;
    }
    target.status = input.status;
    target.updatedAt = now;
    await recordActivity({
      userId: input.adminUserId,
      actorType: "admin",
      action: "access_request_updated",
      entityType: "access_request",
      entityId: target.id,
      metadata: {
        status: target.status,
        organizationName: target.organizationName
      }
    });
    await createAdminNotification({
      category: "registration",
      title: `Access request ${target.id} updated`,
      content: `Status set to ${target.status} for ${target.organizationName}.`,
      entityType: "access_request",
      entityId: target.id
    });
    return target;
  }
  await db.update(accessRequests).set({
    status: input.status,
    updatedAt: now
  }).where(eq3(accessRequests.id, input.accessRequestId));
  const record = await loadAccessRequestById(input.accessRequestId);
  if (!record) {
    return null;
  }
  await recordActivity({
    userId: input.adminUserId,
    actorType: "admin",
    action: "access_request_updated",
    entityType: "access_request",
    entityId: record.id,
    metadata: {
      status: record.status,
      organizationName: record.organizationName
    }
  });
  await createAdminNotification({
    category: "registration",
    title: `Access request ${record.id} updated`,
    content: `Status set to ${record.status} for ${record.organizationName}.`,
    entityType: "access_request",
    entityId: record.id
  });
  return record;
}
async function listConsultationRequests(limit = 50) {
  const db = await getDb();
  if (!db) {
    return memoryConsultationRequests.slice(0, limit);
  }
  return db.select().from(consultationRequests).orderBy(desc2(consultationRequests.createdAt)).limit(limit);
}
async function listAdminNotifications(limit = 50) {
  const db = await getDb();
  if (!db) {
    return memoryAdminNotifications.slice(0, limit);
  }
  return db.select().from(adminNotifications).orderBy(desc2(adminNotifications.createdAt)).limit(limit);
}
async function markAdminNotificationRead(notificationIdValue) {
  const db = await getDb();
  const now = /* @__PURE__ */ new Date();
  if (!db) {
    const target = memoryAdminNotifications.find((item) => item.id === notificationIdValue);
    if (!target) {
      return null;
    }
    target.isRead = 1;
    target.readAt = now;
    return target;
  }
  await db.update(adminNotifications).set({
    isRead: 1,
    readAt: now
  }).where(eq3(adminNotifications.id, notificationIdValue));
  const rows = await db.select().from(adminNotifications).where(eq3(adminNotifications.id, notificationIdValue)).limit(1);
  return rows[0] ?? null;
}
async function respondToConsultationRequest(input) {
  const db = await getDb();
  const now = /* @__PURE__ */ new Date();
  if (!db) {
    const target = memoryConsultationRequests.find((item) => item.id === input.consultationId);
    if (!target) {
      return null;
    }
    target.status = input.status;
    target.priority = input.priority ?? target.priority;
    target.adminResponse = input.adminResponse.trim();
    target.assignedAdminUserId = input.adminUserId;
    target.respondedAt = now;
    target.updatedAt = now;
    await recordActivity({
      userId: input.adminUserId,
      actorType: "admin",
      action: "consultation_request_updated",
      entityType: "consultation_request",
      entityId: target.id,
      metadata: {
        status: target.status,
        priority: target.priority
      }
    });
    await createAdminNotification({
      category: "support",
      title: `Consultation ${target.id} updated`,
      content: `Admin response added for ${target.organizationName}.`,
      entityType: "consultation_request",
      entityId: target.id
    });
    return target;
  }
  await db.update(consultationRequests).set({
    status: input.status,
    priority: input.priority ?? "medium",
    adminResponse: input.adminResponse.trim(),
    assignedAdminUserId: input.adminUserId,
    respondedAt: now,
    updatedAt: now
  }).where(eq3(consultationRequests.id, input.consultationId));
  const record = await loadConsultationRequestById(input.consultationId);
  if (!record) {
    return null;
  }
  await recordActivity({
    userId: input.adminUserId,
    actorType: "admin",
    action: "consultation_request_updated",
    entityType: "consultation_request",
    entityId: record.id,
    metadata: {
      status: record.status,
      priority: record.priority
    }
  });
  await createAdminNotification({
    category: "support",
    title: `Consultation ${record.id} updated`,
    content: `Admin response added for ${record.organizationName}.`,
    entityType: "consultation_request",
    entityId: record.id
  });
  return record;
}
async function saveUserProfile(userId, input) {
  const profile = await updateUserProfile(userId, input);
  if (!profile) {
    return null;
  }
  await recordActivity({
    userId,
    actorType: hasMinRole(profile.role, "admin") ? "admin" : "client",
    action: "profile_updated",
    entityType: "user",
    entityId: profile.id,
    metadata: {
      organizationName: profile.organizationName,
      preferredLocale: profile.preferredLocale
    }
  });
  return profile;
}
async function updateUserAccess(input) {
  const db = await getDb();
  const now = /* @__PURE__ */ new Date();
  if (!db) {
    const target = await getUserById(input.userId);
    if (!target) {
      return null;
    }
    return {
      ...target,
      role: input.role ?? target.role,
      status: input.status ?? target.status,
      updatedAt: now,
      lastActivityAt: now
    };
  }
  const updateSet = {
    lastActivityAt: now
  };
  if (input.role) {
    updateSet.role = input.role;
  }
  if (input.status) {
    updateSet.status = input.status;
  }
  await db.update(users).set(updateSet).where(eq3(users.id, input.userId));
  return getUserById(input.userId);
}
async function listRecentFrameworks() {
  const db = await getDb();
  if (!db) {
    return [];
  }
  return db.select().from(frameworks);
}
async function listAssessmentSummaries(limit = 50) {
  const db = await getDb();
  if (!db) {
    return [];
  }
  const rows = await db.select().from(vendorAssessments).orderBy(desc2(vendorAssessments.assessmentDate), desc2(vendorAssessments.id)).limit(limit);
  const vendors2 = await listAllVendorProfiles(Math.max(limit * 4, 100));
  const vendorMap = new Map(vendors2.map((vendor) => [vendor.id, vendor]));
  const frameworkRows = await listRecentFrameworks();
  const frameworkMap = new Map(frameworkRows.map((row) => [row.id, row]));
  const assessmentIds = rows.map((row) => row.id);
  const gapRows = assessmentIds.length === 0 ? [] : await db.select().from(assessmentGaps).where(inArray2(assessmentGaps.assessmentId, assessmentIds));
  return rows.map((row) => {
    const vendor = vendorMap.get(row.vendorId);
    const framework = frameworkMap.get(row.frameworkId);
    const relatedGaps = gapRows.filter((gap) => gap.assessmentId === row.id);
    const criticalGapCount = relatedGaps.filter((gap) => gap.severity === "critical").length;
    return {
      id: row.id,
      vendorId: row.vendorId,
      vendorName: vendor?.vendorName ?? `Vendor ${row.vendorId}`,
      frameworkCode: framework?.code ?? `FW-${row.frameworkId}`,
      frameworkName: framework?.name ?? `Framework ${row.frameworkId}`,
      complianceScore: row.complianceScore ?? null,
      riskLevel: row.riskLevel ?? null,
      status: row.status ?? null,
      assessmentDate: row.assessmentDate,
      gapCount: relatedGaps.length,
      criticalGapCount
    };
  });
}
async function listAdminVendorSummaries(limit = 100) {
  const vendors2 = await listAllVendorProfiles(limit);
  const techRows = await listTechStackComponentsByVendorIds(vendors2.map((vendor) => vendor.id));
  const userRows = await listUsersForAdmin(limit * 2);
  const userMap = new Map(userRows.map((user) => [user.id, user]));
  return vendors2.map((vendor) => {
    const owner = userMap.get(vendor.userId);
    const components = techRows.filter((component) => component.vendorId === vendor.id);
    return {
      id: vendor.id,
      vendorName: vendor.vendorName,
      ownerName: owner?.name ?? "Unknown user",
      ownerOrganization: owner?.organizationName ?? owner?.email ?? "-",
      riskTier: vendor.riskTier ?? "-",
      criticalityLevel: vendor.criticalityLevel ?? "-",
      operatingCountries: parseVendorMultiValue(vendor.operatingCountries),
      dataLocations: parseVendorMultiValue(vendor.dataLocations),
      techStackCount: components.length,
      createdAt: vendor.createdAt
    };
  });
}
async function listActivityFeed(limit = 50) {
  const db = await getDb();
  const rows = !db ? memoryActivityEvents.slice(0, limit) : await db.select().from(activityEvents).orderBy(desc2(activityEvents.createdAt)).limit(limit);
  const userRows = await listUsersForAdmin(limit * 2);
  const userMap = new Map(userRows.map((user) => [user.id, user]));
  return rows.map((row) => {
    const actor = row.userId != null ? userMap.get(row.userId) : null;
    const metadata = fromJsonText(row.metadata);
    return {
      id: row.id,
      actorType: row.actorType,
      actorName: actor?.name ?? (row.actorType === "visitor" ? "Visitor" : row.actorType === "system" ? "System" : "Unknown user"),
      actorOrganization: actor?.organizationName ?? actor?.email ?? null,
      action: row.action,
      entityType: row.entityType,
      entityId: row.entityId ?? null,
      metadata,
      createdAt: row.createdAt
    };
  });
}
async function listUserInteractionRows(limit = 2e3) {
  const db = await getDb();
  if (!db) {
    return [];
  }
  const rows = await db.select({
    context: userInteractionLogs.context,
    action: userInteractionLogs.action,
    createdAt: userInteractionLogs.createdAt
  }).from(userInteractionLogs).orderBy(desc2(userInteractionLogs.createdAt)).limit(limit);
  return rows;
}
function getRetentionCutoff(retentionDays) {
  const cutoff = /* @__PURE__ */ new Date();
  cutoff.setDate(cutoff.getDate() - retentionDays);
  return cutoff;
}
async function getInteractionPrivacyStats(retentionDays = 90) {
  const db = await getDb();
  const cutoff = getRetentionCutoff(retentionDays);
  if (!db) {
    return {
      retentionDays,
      cutoffIso: cutoff.toISOString(),
      totalLogs: 0,
      logsOlderThanRetention: 0
    };
  }
  const [totals] = await db.select({ count: sql`count(*)` }).from(userInteractionLogs);
  const [expired] = await db.select({ count: sql`count(*)` }).from(userInteractionLogs).where(lt(userInteractionLogs.createdAt, cutoff));
  return {
    retentionDays,
    cutoffIso: cutoff.toISOString(),
    totalLogs: Number(totals?.count ?? 0),
    logsOlderThanRetention: Number(expired?.count ?? 0)
  };
}
async function enforceInteractionRetention(retentionDays = 90, dryRun = true, actorUserId) {
  const stats = await getInteractionPrivacyStats(retentionDays);
  const db = await getDb();
  if (!db || dryRun || stats.logsOlderThanRetention === 0) {
    return {
      ...stats,
      dryRun,
      deletedLogs: 0
    };
  }
  const cutoff = getRetentionCutoff(retentionDays);
  await db.delete(userInteractionLogs).where(lt(userInteractionLogs.createdAt, cutoff));
  void recordActivity({
    userId: actorUserId ?? null,
    actorType: actorUserId ? "admin" : "system",
    action: "interaction_retention_enforced",
    entityType: "userInteractionLogs",
    entityId: null,
    metadata: {
      purgedCount: stats.logsOlderThanRetention,
      retentionDays,
      executedAt: (/* @__PURE__ */ new Date()).toISOString()
    }
  }).catch(() => void 0);
  return {
    ...stats,
    dryRun: false,
    deletedLogs: stats.logsOlderThanRetention
  };
}
async function deleteInteractionLogsBySubject(input) {
  const db = await getDb();
  const userId = input.userId ?? null;
  const organizationId = input.organizationId ?? null;
  if (!userId && !organizationId) {
    return {
      deletedLogs: 0,
      userId,
      organizationId
    };
  }
  if (!db) {
    return {
      deletedLogs: 0,
      userId,
      organizationId
    };
  }
  const whereClause = userId && organizationId ? and2(eq3(userInteractionLogs.userId, userId), eq3(userInteractionLogs.organizationId, organizationId)) : userId ? eq3(userInteractionLogs.userId, userId) : eq3(userInteractionLogs.organizationId, organizationId);
  const [countRow] = await db.select({ count: sql`count(*)` }).from(userInteractionLogs).where(whereClause);
  const deletedLogs = Number(countRow?.count ?? 0);
  if (deletedLogs > 0) {
    await db.delete(userInteractionLogs).where(whereClause);
  }
  void recordActivity({
    userId: input.actorUserId ?? null,
    actorType: input.actorUserId ? "admin" : "system",
    action: "interaction_data_deleted",
    entityType: "userInteractionLogs",
    entityId: null,
    metadata: {
      targetUserId: userId,
      targetOrgId: organizationId,
      deletedCount: deletedLogs
    }
  }).catch(() => void 0);
  return {
    deletedLogs,
    userId,
    organizationId
  };
}
function normalizeHeatmapLabel(value, maxLength = 26) {
  const normalized = value.trim().replace(/[_.-]+/g, " ").replace(/\s+/g, " ");
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1)}\u2026`;
}
function buildInteractionHeatmap(rows, windowDays = 14) {
  const now = Date.now();
  const cutoff = now - windowDays * 864e5;
  const inWindow = rows.filter((row) => row.createdAt.getTime() >= cutoff);
  if (inWindow.length === 0) {
    return {
      contexts: [],
      actions: [],
      cells: [],
      maxCellValue: 0,
      totalEvents: 0,
      windowDays
    };
  }
  const pairCounts = /* @__PURE__ */ new Map();
  const contextCounts = /* @__PURE__ */ new Map();
  const actionCounts = /* @__PURE__ */ new Map();
  for (const row of inWindow) {
    const context = normalizeHeatmapLabel(row.context);
    const action = normalizeHeatmapLabel(row.action);
    const pairKey = `${context}::${action}`;
    pairCounts.set(pairKey, (pairCounts.get(pairKey) ?? 0) + 1);
    contextCounts.set(context, (contextCounts.get(context) ?? 0) + 1);
    actionCounts.set(action, (actionCounts.get(action) ?? 0) + 1);
  }
  const contexts = Array.from(contextCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([context]) => context);
  const actions = Array.from(actionCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([action]) => action);
  const contextSet = new Set(contexts);
  const actionSet = new Set(actions);
  const cells = [];
  let maxCellValue = 0;
  pairCounts.forEach((value, key) => {
    const [context, action] = key.split("::");
    if (!contextSet.has(context) || !actionSet.has(action)) {
      return;
    }
    cells.push({ context, action, value });
    if (value > maxCellValue) {
      maxCellValue = value;
    }
  });
  return {
    contexts,
    actions,
    cells,
    maxCellValue,
    totalEvents: inWindow.length,
    windowDays
  };
}
async function getAdminInteractionHeatmap(windowDays = 14, limit = 2e3) {
  const rows = await listUserInteractionRows(limit);
  return buildInteractionHeatmap(rows, windowDays);
}
async function listConsultationSummaries(limit = 50) {
  const rows = await listConsultationRequests(limit);
  const userRows = await listUsersForAdmin(limit * 2);
  const userMap = new Map(userRows.map((user) => [user.id, user]));
  return rows.map((row) => ({
    id: row.id,
    contactName: row.contactName,
    contactEmail: row.contactEmail,
    organizationName: row.organizationName,
    topic: row.topic,
    jurisdictions: fromJsonText(row.jurisdictions) ?? [],
    summary: row.summary,
    vendorName: row.vendorName,
    techStackSummary: row.techStackSummary,
    status: row.status,
    priority: row.priority,
    assignedAdminName: row.assignedAdminUserId != null ? userMap.get(row.assignedAdminUserId)?.name ?? null : null,
    adminResponse: row.adminResponse,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  }));
}
function buildActivitySeries(activityRows) {
  const labels = Array.from({ length: 7 }, (_, index) => {
    const date = /* @__PURE__ */ new Date();
    date.setDate(date.getDate() - (6 - index));
    return date.toISOString().slice(0, 10);
  });
  const counts = new Map(labels.map((label) => [label, 0]));
  for (const row of activityRows) {
    const key = row.createdAt.toISOString().slice(0, 10);
    if (counts.has(key)) {
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return labels.map((label) => ({
    day: label.slice(5),
    value: counts.get(label) ?? 0
  }));
}
function buildRegionCoverage(vendorRows, assessmentRows) {
  const trackedRegions = ["China", "Saudi Arabia"];
  const coverage = trackedRegions.map((region) => ({
    region,
    vendors: 0,
    assessments: 0,
    criticalGaps: 0
  }));
  for (const vendor of vendorRows) {
    for (const region of trackedRegions) {
      const touchesRegion = vendor.operatingCountries.includes(region) || vendor.dataLocations.includes(region);
      if (!touchesRegion) {
        continue;
      }
      const target = coverage.find((item) => item.region === region);
      if (target) {
        target.vendors += 1;
      }
    }
  }
  for (const assessment of assessmentRows) {
    const vendor = vendorRows.find((item) => item.id === assessment.vendorId);
    if (!vendor) {
      continue;
    }
    for (const region of trackedRegions) {
      const touchesRegion = vendor.operatingCountries.includes(region) || vendor.dataLocations.includes(region);
      if (!touchesRegion) {
        continue;
      }
      const target = coverage.find((item) => item.region === region);
      if (target) {
        target.assessments += 1;
        target.criticalGaps += assessment.criticalGapCount;
      }
    }
  }
  return coverage;
}
function buildCorridorFlows(vendorRows) {
  const flowWeight = vendorRows.filter((vendor) => {
    const regions = /* @__PURE__ */ new Set([...vendor.operatingCountries, ...vendor.dataLocations]);
    return regions.has("China") && regions.has("Saudi Arabia");
  }).length;
  return flowWeight > 0 ? [
    { source: "China", target: "Saudi Arabia", weight: flowWeight },
    { source: "Saudi Arabia", target: "China", weight: flowWeight }
  ] : [];
}
async function getAdminOverview() {
  const [
    userRows,
    accessRows,
    consultationRows,
    notificationRows,
    vendorRows,
    assessmentRows,
    activityRows,
    interactionRows
  ] = await Promise.all([
    listUsersForAdmin(250),
    listAccessRequests(100),
    listConsultationSummaries(100),
    listAdminNotifications(20),
    listAdminVendorSummaries(200),
    listAssessmentSummaries(200),
    listActivityFeed(40),
    listUserInteractionRows(2e3)
  ]);
  const riskLevels = ["critical", "high", "medium", "low"];
  const riskDistribution = riskLevels.map((level) => ({
    label: level,
    value: assessmentRows.filter((row) => row.riskLevel === level).length
  }));
  return {
    totals: {
      registeredClients: userRows.filter((user) => user.role === "user").length,
      adminUsers: userRows.filter((user) => hasMinRole(user.role, "admin")).length,
      openAccessRequests: accessRows.filter((row) => row.status !== "approved" && row.status !== "archived").length,
      openConsultations: consultationRows.filter((row) => row.status !== "closed").length,
      vendors: vendorRows.length,
      assessments: assessmentRows.length,
      criticalGaps: assessmentRows.reduce((total, row) => total + row.criticalGapCount, 0),
      unreadNotifications: notificationRows.filter((row) => !row.isRead && !row.readAt).length
    },
    activitySeries: buildActivitySeries(activityRows),
    riskDistribution,
    regionCoverage: buildRegionCoverage(vendorRows, assessmentRows),
    corridorFlows: buildCorridorFlows(vendorRows),
    usageHeatmap: buildInteractionHeatmap(interactionRows, 14),
    recentActivity: activityRows.slice(0, 12),
    recentAssessments: assessmentRows.slice(0, 8),
    recentConsultations: consultationRows.slice(0, 8),
    notificationHighlights: notificationRows.slice(0, 8)
  };
}

// server/admin-router.ts
init_db();

// server/_core/trpc.ts
init_schema();
init_db();
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { eq as eq4, or } from "drizzle-orm";

// server/services/billing-entitlements.ts
var TRIAL_DAYS = 7;
function trialEndsAt(startedAt) {
  const endAt = new Date(startedAt);
  endAt.setDate(endAt.getDate() + TRIAL_DAYS);
  return endAt;
}
function daysRemainingInTrial(org) {
  if (!org.trialEndsAt) return 0;
  const diff = org.trialEndsAt.getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 864e5));
}
function isTrialExpired(org) {
  if (org.plan !== "free_trial") return false;
  if (!org.trialEndsAt) return true;
  return org.trialEndsAt.getTime() < Date.now();
}
function isAccessAllowed(org, sub) {
  if (org.plan === "free_trial" && !isTrialExpired(org)) return true;
  if (!sub) return false;
  return sub.status === "active" || sub.status === "trialing";
}

// server/_core/trpc.ts
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var requireOrganization = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (ctx.organizationId == null) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "No organization is associated with this account yet."
    });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
      organizationId: ctx.organizationId,
      organizationRole: ctx.organizationRole
    }
  });
});
var orgProcedure = protectedProcedure.use(requireOrganization);
var requireOrgAdmin = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (ctx.organizationId == null) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "No organization is associated with this account yet."
    });
  }
  if (!ctx.organizationRole || !["owner", "admin"].includes(ctx.organizationRole)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Organization admin access required."
    });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
      organizationId: ctx.organizationId,
      organizationRole: ctx.organizationRole
    }
  });
});
var orgAdminProcedure = protectedProcedure.use(requireOrgAdmin);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || !hasMinRole(ctx.user.role, "admin")) {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);
var requireActiveAccess = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (ctx.user?.role && hasMinRole(ctx.user.role, "platform_admin")) {
    return next({ ctx: { ...ctx, user: ctx.user } });
  }
  if (ctx.organizationId != null) {
    const db = await getDb();
    if (db) {
      const [org] = await db.select({ plan: organizations.plan, trialEndsAt: organizations.trialEndsAt, isActive: organizations.isActive }).from(organizations).where(eq4(organizations.id, ctx.organizationId));
      if (org && isTrialExpired(org)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "trial_expired"
        });
      }
    }
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});
var activeOrgProcedure = orgProcedure.use(requireActiveAccess);
var companyAdminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
    }
    if (!hasMinRole(ctx.user.role, "company_admin")) {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_COMPANY_ADMIN_ERR_MSG });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
  })
);
var platformAdminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
    }
    if (!hasMinRole(ctx.user.role, "platform_admin")) {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_PLATFORM_ADMIN_ERR_MSG });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
  })
);
var yallaHackProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
    }
    if (!hasMinRole(ctx.user.role, "yalla_hack_employee")) {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_PLATFORM_ADMIN_ERR_MSG });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
  })
);
var superAdminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
    }
    if (!hasMinRole(ctx.user.role, "super_admin")) {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_SUPER_ADMIN_ERR_MSG });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
  })
);
var requireComplianceOfficer = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  const allowed = ["owner", "admin", "compliance_officer"];
  if (!ctx.organizationRole || !allowed.includes(ctx.organizationRole)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Compliance officer access required (10006)."
    });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
      organizationId: ctx.organizationId,
      organizationRole: ctx.organizationRole
    }
  });
});
var complianceOfficerProcedure = orgProcedure.use(requireComplianceOfficer);
var requireOnboardingComplete = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  if (hasMinRole(ctx.user.role, "platform_admin")) {
    return next({ ctx: { ...ctx, user: ctx.user } });
  }
  const db = await getDb();
  if (db) {
    const localUserId = ctx.user.localUserId ?? null;
    const conditions = [eq4(userOnboarding.userId, ctx.user.id)];
    if (localUserId) conditions.push(eq4(userOnboarding.localUserId, localUserId));
    const [row] = await db.select({ stage: userOnboarding.stage }).from(userOnboarding).where(or(...conditions)).limit(1);
    if (row && row.stage !== "completed") {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "onboarding_incomplete"
      });
    }
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});
var onboardedProcedure = protectedProcedure.use(requireOnboardingComplete);

// server/admin-store.ts
init_db();
init_schema();
async function getConversionStats() {
  const db = await getDb();
  if (!db) {
    return {
      trialOrgs: 0,
      paidOrgs: 0,
      expiredOrgs: 0,
      total: 0,
      conversionRate: 0,
      planBreakdown: []
    };
  }
  const orgs = await db.select({ plan: organizations.plan, trialEndsAt: organizations.trialEndsAt }).from(organizations);
  const trialOrgs = orgs.filter((o) => o.plan === "free_trial" && !isTrialExpired(o)).length;
  const expiredOrgs = orgs.filter((o) => isTrialExpired(o)).length;
  const paidOrgs = orgs.filter((o) => o.plan !== "free_trial").length;
  const total = orgs.length;
  const conversionRate = total > 0 ? Math.round(paidOrgs / total * 100) : 0;
  const planCounts = {};
  orgs.forEach((o) => {
    planCounts[o.plan] = (planCounts[o.plan] ?? 0) + 1;
  });
  const planBreakdown = Object.entries(planCounts).map(([plan, count]) => ({ plan, count }));
  return { trialOrgs, paidOrgs, expiredOrgs, total, conversionRate, planBreakdown };
}

// server/admin-router.ts
import fs from "fs";
import path from "path";
var limitSchema = z.object({
  limit: z.number().int().min(1).max(200).optional()
});
var adminRouter = router({
  overview: adminProcedure.query(() => {
    return getAdminOverview();
  }),
  interactionHeatmap: adminProcedure.input(
    z.object({
      windowDays: z.number().int().min(1).max(90).optional(),
      limit: z.number().int().min(100).max(5e3).optional()
    }).optional()
  ).query(({ input }) => {
    return getAdminInteractionHeatmap(input?.windowDays ?? 14, input?.limit ?? 2e3);
  }),
  interactionPrivacyStats: adminProcedure.input(
    z.object({
      retentionDays: z.number().int().min(7).max(365).optional()
    }).optional()
  ).query(({ input }) => {
    return getInteractionPrivacyStats(input?.retentionDays ?? 90);
  }),
  enforceInteractionRetention: adminProcedure.input(
    z.object({
      retentionDays: z.number().int().min(7).max(365).default(90),
      dryRun: z.boolean().default(true)
    })
  ).mutation(({ ctx, input }) => {
    return enforceInteractionRetention(input.retentionDays, input.dryRun, ctx.user.id);
  }),
  deleteInteractionData: adminProcedure.input(
    z.object({
      userId: z.number().int().positive().optional(),
      organizationId: z.number().int().positive().optional()
    }).refine((value) => Boolean(value.userId || value.organizationId), {
      message: "Provide userId or organizationId for deletion."
    })
  ).mutation(({ ctx, input }) => {
    return deleteInteractionLogsBySubject({
      userId: input.userId,
      organizationId: input.organizationId,
      actorUserId: ctx.user.id
    });
  }),
  users: adminProcedure.input(limitSchema.optional()).query(({ input }) => {
    return listUsersForAdmin(input?.limit ?? 100);
  }),
  accessRequests: adminProcedure.input(limitSchema.optional()).query(({ input }) => {
    return listAccessRequests(input?.limit ?? 100);
  }),
  consultations: adminProcedure.input(limitSchema.optional()).query(({ input }) => {
    return listConsultationSummaries(input?.limit ?? 100);
  }),
  notifications: adminProcedure.input(limitSchema.optional()).query(({ input }) => {
    return listAdminNotifications(input?.limit ?? 50);
  }),
  vendors: adminProcedure.input(limitSchema.optional()).query(({ input }) => {
    return listAdminVendorSummaries(input?.limit ?? 100);
  }),
  assessments: adminProcedure.input(limitSchema.optional()).query(({ input }) => {
    return listAssessmentSummaries(input?.limit ?? 100);
  }),
  activity: adminProcedure.input(limitSchema.optional()).query(({ input }) => {
    return listActivityFeed(input?.limit ?? 100);
  }),
  markNotificationRead: adminProcedure.input(z.object({ notificationId: z.number().int().positive() })).mutation(({ input }) => {
    return markAdminNotificationRead(input.notificationId);
  }),
  updateAccessRequestStatus: adminProcedure.input(
    z.object({
      accessRequestId: z.number().int().positive(),
      status: z.enum(["new", "reviewing", "approved", "archived"])
    })
  ).mutation(({ ctx, input }) => {
    return updateAccessRequestStatus({
      accessRequestId: input.accessRequestId,
      status: input.status,
      adminUserId: ctx.user.id
    });
  }),
  respondConsultation: adminProcedure.input(
    z.object({
      consultationId: z.number().int().positive(),
      status: z.enum(["in_review", "responded", "closed"]),
      priority: z.enum(["low", "medium", "high"]).optional(),
      adminResponse: z.string().trim().min(10).max(5e3)
    })
  ).mutation(({ ctx, input }) => {
    return respondToConsultationRequest({
      consultationId: input.consultationId,
      status: input.status,
      priority: input.priority,
      adminResponse: input.adminResponse,
      adminUserId: ctx.user.id
    });
  }),
  updateUserAccess: adminProcedure.input(
    z.object({
      userId: z.number().int().positive(),
      role: z.enum(["user", "admin"]).optional(),
      status: z.enum(["active", "invited", "suspended"]).optional()
    })
  ).mutation(async ({ ctx, input }) => {
    const updated = await updateUserAccess(input);
    if (updated) {
      await recordActivity({
        userId: ctx.user.id,
        actorType: "admin",
        action: "user_access_updated",
        entityType: "user",
        entityId: updated.id,
        metadata: {
          role: updated.role,
          status: updated.status
        }
      });
    }
    return updated;
  }),
  /**
   * Read the audit event log file (admin-only).
   * Returns the latest `limit` NDJSON entries parsed into objects,
   * newest-first. Gracefully returns [] if the file doesn't exist yet.
   */
  auditLog: adminProcedure.input(
    z.object({
      limit: z.number().int().min(1).max(500).default(100),
      action: z.string().optional(),
      userId: z.number().int().positive().optional()
    }).optional()
  ).query(async ({ input }) => {
    const limit = input?.limit ?? 100;
    const filterAction = input?.action;
    const filterUserId = input?.userId;
    const auditFile = path.resolve(
      import.meta.dirname,
      "../..",
      "audit",
      "assessment-events.log"
    );
    try {
      const raw = await fs.promises.readFile(auditFile, "utf8");
      const lines = raw.split("\n").filter((l) => l.trim().length > 0);
      const events = [];
      for (const line of lines) {
        try {
          events.push(JSON.parse(line));
        } catch {
        }
      }
      let filtered = events;
      if (filterAction) {
        filtered = filtered.filter((e) => e.action === filterAction);
      }
      if (filterUserId) {
        filtered = filtered.filter((e) => e.userId === filterUserId);
      }
      return filtered.reverse().slice(0, limit);
    } catch (err) {
      if (err.code === "ENOENT") {
        return [];
      }
      console.error("[admin.auditLog] Unreadable audit file");
      return [];
    }
  }),
  conversionStats: adminProcedure.query(() => getConversionStats())
});

// server/ai/router.ts
init_env();
import { TRPCError as TRPCError3 } from "@trpc/server";
import { z as z3 } from "zod";

// server/_core/permission-guard.ts
import { TRPCError as TRPCError2 } from "@trpc/server";

// server/rbac.ts
init_schema();
init_db();
import { eq as eq5, and as and3, or as or2 } from "drizzle-orm";
var FULL_DENY = {
  canView: false,
  canCreate: false,
  canEdit: false,
  canDelete: false,
  canExport: false,
  canInvite: false,
  isOverride: false
};
async function getEffectivePermissions(userId, localUserId, orgId, orgRole, module) {
  const db = await getDb();
  if (db && (userId || localUserId)) {
    const userConditions = [];
    if (userId) userConditions.push(eq5(rolePermissions.userId, userId));
    if (localUserId) userConditions.push(eq5(rolePermissions.localUserId, localUserId));
    const [override] = await db.select().from(rolePermissions).where(
      and3(
        eq5(rolePermissions.organizationId, orgId),
        eq5(rolePermissions.module, module),
        or2(...userConditions)
      )
    ).limit(1);
    if (override) {
      return {
        canView: override.canView === 1,
        canCreate: override.canCreate === 1,
        canEdit: override.canEdit === 1,
        canDelete: override.canDelete === 1,
        canExport: override.canExport === 1,
        canInvite: override.canInvite === 1,
        isOverride: true
      };
    }
  }
  if (orgRole && orgRole in DEFAULT_ORG_ROLE_PERMISSIONS) {
    const defaults = DEFAULT_ORG_ROLE_PERMISSIONS[orgRole];
    const moduleDefaults = defaults[module];
    if (moduleDefaults) {
      return { ...moduleDefaults, isOverride: false };
    }
  }
  return FULL_DENY;
}
async function getEffectivePermissionsFromCtx(ctx, module) {
  const userId = ctx.user?.id ?? null;
  const localUserId = ctx.user?.localUserId ?? null;
  const orgId = ctx.organizationId;
  const orgRole = ctx.organizationRole;
  if (!orgId) return FULL_DENY;
  return getEffectivePermissions(userId, localUserId, orgId, orgRole, module);
}

// server/audit-logger.ts
init_schema();
init_db();
init_env();
import { createHash } from "node:crypto";

// server/services/sse-bus.ts
var sseClients = /* @__PURE__ */ new Set();
function addSSEClient(res) {
  sseClients.add(res);
}
function removeSSEClient(res) {
  sseClients.delete(res);
}
function getSSEClientCount() {
  return sseClients.size;
}
function broadcastSSE(event, data) {
  const msg = `event: ${event}
data: ${JSON.stringify(data)}

`;
  for (const client of sseClients) {
    try {
      client.write(msg);
    } catch {
      sseClients.delete(client);
    }
  }
}

// server/audit-logger.ts
function sanitizePayload(value) {
  if (value == null) return null;
  try {
    return JSON.stringify(value, (key, val) => {
      if (/(password|secret|token|auth|cookie|api[_-]?key)/i.test(key)) return "[redacted]";
      if (typeof val === "string" && val.length > 500) return val.slice(0, 500) + "\u2026";
      return val;
    });
  } catch {
    return null;
  }
}
function getClientIp(ctx) {
  const forwarded = ctx.req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return ctx.req.socket?.remoteAddress || "unknown";
}
function hashIp(ip) {
  const salt = ENV.cookieSecret || "djac-audit-salt";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}
function getHashedIpFromHeaders(headers) {
  const forwarded = headers["x-forwarded-for"];
  const first = typeof forwarded === "string" ? forwarded.split(",")[0]?.trim() : Array.isArray(forwarded) ? forwarded[0]?.trim() : null;
  if (!first) return null;
  return hashIp(first);
}
async function recordAuditEvent(ctx, input) {
  const db = await getDb();
  if (!db) return;
  try {
    const userAgent = ctx.req.headers["user-agent"]?.toString().slice(0, 512) ?? null;
    const ipHash = hashIp(getClientIp(ctx));
    await db.insert(auditLogs).values({
      userId: ctx.user?.id ?? null,
      localUserId: input.localUserId ?? null,
      organizationId: ctx.organizationId ?? null,
      actorRole: ctx.user?.role ?? null,
      category: input.category,
      action: input.action.slice(0, 120),
      entityType: input.entityType?.slice(0, 120) ?? null,
      entityId: input.entityId ?? null,
      targetEntity: input.targetEntity?.slice(0, 255) ?? null,
      outcome: input.outcome ?? "success",
      payload: sanitizePayload(input.payload),
      ipHash,
      userAgent
    });
    const BROADCAST_CATEGORIES = ["auth", "billing", "system", "data_write", "data_read", "role_change"];
    if (BROADCAST_CATEGORIES.includes(input.category)) {
      broadcastSSE("platform_event", {
        category: input.category,
        action: input.action,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
        outcome: input.outcome ?? "success",
        actorRole: ctx.user?.role ?? "anonymous",
        organizationId: ctx.organizationId ?? null,
        ts: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
  } catch (err) {
    console.warn("[AuditLog] Failed to persist audit event:", err);
  }
}
async function recordTrpcFailureEvent(input) {
  const db = await getDb();
  if (!db) return;
  try {
    const localUserId = input.ctx?.user?.localUserId ?? null;
    const userId = input.ctx?.user && input.ctx.user.id > 0 ? input.ctx.user.id : null;
    const outcome = ["BAD_REQUEST", "PARSE_ERROR", "UNAUTHORIZED", "FORBIDDEN", "PRECONDITION_FAILED"].includes(input.code) ? "blocked" : "failure";
    await db.insert(auditLogs).values({
      userId,
      localUserId,
      organizationId: input.ctx?.organizationId ?? null,
      actorRole: input.ctx?.user?.role ?? "anonymous",
      category: "system",
      action: input.code === "BAD_REQUEST" || input.code === "PARSE_ERROR" ? "trpc.validation_failed" : "trpc.request_failed",
      entityType: "trpc",
      entityId: null,
      targetEntity: (input.path ?? input.type ?? "unknown").slice(0, 255),
      outcome,
      payload: sanitizePayload({
        code: input.code,
        message: input.message,
        input: input.procedureInput,
        issues: input.issues
      }),
      ipHash: input.ctx ? hashIp(getClientIp(input.ctx)) : getHashedIpFromHeaders(input.headers ?? {}),
      userAgent: input.ctx?.req.headers["user-agent"]?.toString().slice(0, 512) ?? input.headers?.["user-agent"]?.toString().slice(0, 512) ?? null
    });
    broadcastSSE("validation_event", {
      code: input.code,
      action: input.code === "BAD_REQUEST" || input.code === "PARSE_ERROR" ? "trpc.validation_failed" : "trpc.request_failed",
      target: (input.path ?? input.type ?? "unknown").slice(0, 255),
      outcome,
      actorRole: input.ctx?.user?.role ?? "anonymous",
      ts: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (err) {
    console.warn("[AuditLog] Failed to persist tRPC failure event:", err);
  }
}

// server/_core/permission-guard.ts
async function requireModulePermission(ctx, module, action) {
  const perms = await getEffectivePermissionsFromCtx(ctx, module);
  if (perms[action]) {
    return;
  }
  void recordAuditEvent(ctx, {
    category: "role_change",
    action: "permission_denied",
    entityType: "rbac",
    targetEntity: `${module}:${action}`,
    outcome: "blocked",
    payload: {
      module,
      action,
      orgRole: ctx.organizationRole ?? null,
      isOverride: perms.isOverride
    }
  });
  throw new TRPCError2({
    code: "FORBIDDEN",
    message: `Insufficient permissions for ${module} (${action}).`
  });
}
async function requireModulePermissionIfOrgContext(ctx, module, action) {
  if (ctx.organizationId == null) {
    return;
  }
  await requireModulePermission(ctx, module, action);
}

// server/interaction-logger.ts
init_schema();
init_db();
init_env();
import { createHash as createHash2 } from "node:crypto";
var SENSITIVE_KEY_REGEX = /(password|secret|token|authorization|cookie|api[_-]?key|access[_-]?key|private[_-]?key)/i;
function sanitizeForStorage(value, depth = 0) {
  if (depth > 5) return "[truncated-depth]";
  if (value == null) return null;
  if (typeof value === "string") return value.length > 2e3 ? `${value.slice(0, 2e3)}...[truncated]` : value;
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) {
    return value.slice(0, 50).map((item) => sanitizeForStorage(item, depth + 1));
  }
  if (typeof value === "object") {
    const entries = Object.entries(value).slice(0, 80);
    const next = {};
    for (const [k, v] of entries) {
      if (SENSITIVE_KEY_REGEX.test(k)) {
        next[k] = "[redacted]";
      } else {
        next[k] = sanitizeForStorage(v, depth + 1);
      }
    }
    return next;
  }
  return String(value);
}
function toJsonText2(value) {
  if (value == null) return null;
  try {
    return JSON.stringify(sanitizeForStorage(value));
  } catch {
    return null;
  }
}
function getClientIp2(ctx) {
  const forwarded = ctx.req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  const raw = ctx.req.socket?.remoteAddress;
  return raw || "unknown";
}
function hashIp2(ip) {
  const salt = ENV.cookieSecret || "djac-ip-hash-salt";
  return createHash2("sha256").update(`${salt}:${ip}`).digest("hex");
}
async function recordUserInteraction(ctx, input) {
  const db = await getDb();
  if (!db) return;
  const localUserId = ctx.user?.localUserId ?? null;
  const userId = ctx.user && ctx.user.id > 0 ? ctx.user.id : null;
  const organizationId = ctx.organizationId && ctx.organizationId > 0 ? ctx.organizationId : null;
  try {
    await db.insert(userInteractionLogs).values({
      organizationId,
      userId,
      localUserId,
      sessionId: null,
      context: input.context.slice(0, 120),
      action: input.action.slice(0, 120),
      entityType: input.entityType?.slice(0, 120) ?? null,
      entityId: input.entityId ?? null,
      inputSnapshot: toJsonText2(input.inputSnapshot),
      outputRef: toJsonText2(input.outputRef),
      durationMs: input.durationMs ?? null,
      ipHash: hashIp2(getClientIp2(ctx)),
      userAgent: ctx.req.headers["user-agent"]?.toString().slice(0, 512) ?? null
    });
    broadcastSSE("interaction_logged", {
      context: input.context.slice(0, 120),
      action: input.action.slice(0, 120),
      entityType: input.entityType?.slice(0, 120) ?? null,
      entityId: input.entityId ?? null,
      organizationId,
      actorType: ctx.user ? "authenticated" : "anonymous",
      ts: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (error) {
    console.warn("[InteractionLog] Failed to persist interaction", error);
  }
}

// server/ai/orchestrator.ts
init_env();

// server/ai/pipeline.ts
init_schema();
init_db();
init_supplier_assessment();
init_env();

// server/ai/schemas.ts
import { z as z2 } from "zod";
var aiJobStatusSchema = z2.enum([
  "queued",
  "running",
  "completed",
  "failed"
]);
var aiJobStageSchema = z2.enum([
  "queued",
  "gatekeeper",
  "intake",
  "extractor",
  "rag_context",
  "judge",
  "synthesizer",
  "validator",
  "reporter",
  "persistence",
  "completed",
  "failed"
]);
var assessmentSeveritySchema = z2.enum([
  "critical",
  "high",
  "medium",
  "low"
]);
var supplierGapSchema = z2.object({
  code: z2.string().trim().min(1).max(120),
  jurisdiction: z2.enum(["china", "saudi", "cross_border"]),
  frameworks: z2.array(z2.string().trim().min(1).max(32)).min(1).max(8),
  severity: assessmentSeveritySchema,
  title: z2.string().trim().min(1).max(240),
  description: z2.string().trim().min(1).max(3e3),
  mitigation: z2.string().trim().min(1).max(3e3),
  penaltyContext: z2.string().trim().max(2e3)
});
var supplierAssessmentSchema = z2.object({
  vendorId: z2.number().int(),
  generatedAt: z2.string().datetime({ offset: true }),
  overallScore: z2.number().int().min(0).max(100),
  jurisdictionScores: z2.object({
    china: z2.number().int().min(0).max(100),
    saudiArabia: z2.number().int().min(0).max(100)
  }),
  status: z2.enum(["compliant", "partial", "non_compliant"]),
  riskLevel: z2.enum(["low", "medium", "high", "critical"]),
  gaps: z2.array(supplierGapSchema),
  recommendations: z2.array(z2.string().trim().min(1).max(3e3)).max(120)
});
var extractedFactSchema = z2.object({
  key: z2.string().trim().min(1).max(120),
  value: z2.string().trim().min(1).max(4e3),
  evidence: z2.string().trim().max(4e3).optional().default(""),
  mappedControlBuckets: z2.array(z2.string().trim().min(1).max(120)).max(12).default([])
});
var ragControlSchema = z2.object({
  controlId: z2.number().int().positive(),
  frameworkCode: z2.string().trim().min(1).max(32),
  controlCode: z2.string().trim().min(1).max(120),
  category: z2.string().trim().max(120).optional().nullable(),
  controlName: z2.string().trim().max(512).optional().nullable(),
  requirement: z2.string().trim().max(4e3).optional().nullable(),
  relevanceScore: z2.number().min(0).max(1)
});
var dbAssessmentPayloadSchema = z2.object({
  frameworkCode: z2.string().trim().min(1).max(32),
  complianceScore: z2.number().int().min(0).max(100),
  riskLevel: z2.enum(["low", "medium", "high", "critical"]),
  status: z2.enum(["compliant", "partial", "non_compliant"]),
  findings: z2.array(z2.string().trim().min(1).max(1200)).max(120),
  recommendations: z2.array(z2.string().trim().min(1).max(3e3)).max(120)
});
var dbGapPayloadSchema = z2.object({
  frameworkCode: z2.string().trim().min(1).max(32),
  controlCode: z2.string().trim().max(120).optional().default(""),
  gapCode: z2.string().trim().min(1).max(120),
  gapDescription: z2.string().trim().min(1).max(3e3),
  severity: assessmentSeveritySchema,
  remediation: z2.string().trim().min(1).max(3e3)
});
var aiAssessmentReportSchema = z2.object({
  version: z2.literal("1.0"),
  generatedAt: z2.string().datetime({ offset: true }),
  inputSummary: z2.object({
    vendorId: z2.number().int(),
    source: z2.enum(["vendor_profile", "document_upload"]),
    documentType: z2.string().trim().max(120),
    tags: z2.array(z2.string().trim().min(1).max(60)).max(20)
  }),
  extractedFacts: z2.array(extractedFactSchema).max(200),
  ragControls: z2.array(ragControlSchema).max(200),
  assessment: supplierAssessmentSchema,
  remediationPlan: z2.array(z2.string().trim().min(1).max(3e3)).max(120),
  validator: z2.object({
    passed: z2.boolean(),
    attempts: z2.number().int().min(1).max(10),
    notes: z2.array(z2.string().trim().min(1).max(1200)).max(60)
  }),
  dbPayload: z2.object({
    vendorAssessments: z2.array(dbAssessmentPayloadSchema).max(20),
    assessmentGaps: z2.array(dbGapPayloadSchema).max(400)
  })
});
var aiJobEventSchema = z2.object({
  stage: aiJobStageSchema,
  message: z2.string().trim().min(1).max(500),
  timestamp: z2.string().datetime({ offset: true })
});
var aiJobSnapshotSchema = z2.object({
  id: z2.string().trim().min(1),
  userId: z2.number().int(),
  status: aiJobStatusSchema,
  stage: aiJobStageSchema,
  createdAt: z2.string().datetime({ offset: true }),
  updatedAt: z2.string().datetime({ offset: true }),
  events: z2.array(aiJobEventSchema).max(500),
  error: z2.string().trim().max(3e3).optional(),
  result: aiAssessmentReportSchema.optional(),
  persistence: z2.object({
    savedAssessments: z2.number().int().min(0),
    savedGaps: z2.number().int().min(0),
    skipped: z2.boolean()
  }).optional()
});

// server/ai/pipeline.ts
var WEAK_ENCRYPTION_CODE = "CRYPTO-WEAK-001";
var DEFAULT_KNOWN_FRAMEWORKS = ["PIPL", "CSL", "DSL", "MLPS 2.0", "PDPL", "NCA"];
var CHINA_FRAMEWORKS = ["PIPL", "CSL", "DSL", "MLPS 2.0"];
var SAUDI_FRAMEWORKS = ["PDPL", "NCA"];
var INJECTION_PATTERNS = [
  /ignore\s+all\s+previous\s+instructions/i,
  /system\s+prompt/i,
  /jailbreak/i,
  /<script[\s>]/i,
  /rm\s+-rf\s+\//i,
  /drop\s+table/i,
  /shutdown\s+-h/i
];
var CONTROL_BUCKET_KEYWORDS = {
  "Data Processing & Encryption": ["encrypt", "encryption", "aes", "rsa", "key"],
  "Data Localization": ["china", "saudi", "riyadh", "beijing", "shanghai", "localization"],
  "Access Control": ["access", "identity", "iam", "mfa", "privilege"],
  "Incident Response": ["incident", "breach", "response", "monitor"],
  "Transfer & Consent": ["consent", "transfer", "cross-border", "cross border", "subject"],
  Governance: ["audit", "policy", "governance", "compliance", "legal"]
};
function clampScore2(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}
function scoreToStatus2(score) {
  if (score >= 85) return "compliant";
  if (score >= 65) return "partial";
  return "non_compliant";
}
function inferRiskLevel2(assessment) {
  const criticalCount = assessment.gaps.filter((g) => g.severity === "critical").length;
  const highCount = assessment.gaps.filter((g) => g.severity === "high").length;
  if (criticalCount > 0) return "critical";
  if (assessment.overallScore < 60 || highCount >= 2) return "high";
  if (assessment.overallScore < 80 || highCount > 0) return "medium";
  return "low";
}
function toTokens(value) {
  return value.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").split(/\s+/).map((token) => token.trim()).filter((token) => token.length >= 3);
}
function mapControlBuckets(text2) {
  const normalized = text2.toLowerCase();
  const buckets = [];
  for (const [bucket, keywords] of Object.entries(CONTROL_BUCKET_KEYWORDS)) {
    if (keywords.some((keyword) => normalized.includes(keyword))) {
      buckets.push(bucket);
    }
  }
  return Array.from(new Set(buckets));
}
function addFact(facts, key, value, evidence = "") {
  const normalized = value.trim();
  if (!normalized) return;
  facts.push({
    key,
    value: normalized,
    evidence: evidence.trim(),
    mappedControlBuckets: mapControlBuckets(`${key} ${normalized} ${evidence}`)
  });
}
async function callAgentSwarm(stagePath, payload) {
  const baseUrl = ENV.agentSwarmBaseUrl;
  if (!baseUrl) return null;
  const endpoint = `${baseUrl.replace(/\/$/, "")}/${stagePath.replace(/^\//, "")}`;
  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), 15e3);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify(payload),
      signal: abortController.signal
    });
    if (!response.ok) {
      return null;
    }
    return await response.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
function runSecurityGatekeeper(payload) {
  const threats = INJECTION_PATTERNS.filter((pattern) => pattern.test(payload));
  if (threats.length > 0) {
    throw new Error(
      "Security Gatekeeper blocked potentially malicious assessment payload."
    );
  }
}
function runIntake(vendor, rawDocumentText) {
  const combinedText = [
    vendor.vendorName,
    vendor.vendorDescription || "",
    vendor.industry || "",
    vendor.businessRegistrationNumber || "",
    vendor.headquartersLocation || "",
    vendor.primaryContactName || "",
    vendor.primaryContactEmail || "",
    vendor.primaryContactRole || "",
    vendor.primaryContactPhone || "",
    vendor.serviceType || "",
    vendor.serviceScope || "",
    vendor.hostingEnvironment || "",
    vendor.operatingCountries || "",
    vendor.cloudProvider || "",
    vendor.dataLocations || "",
    vendor.regulatoryJurisdictions || "",
    vendor.certifications || "",
    vendor.dataProcessingActivities || "",
    vendor.criticalityLevel || "",
    vendor.riskTier || "",
    vendor.thirdPartyDependencies || "",
    vendor.fourthPartyDependencies || "",
    rawDocumentText || ""
  ].filter(Boolean).join("\n").trim();
  const lower = combinedText.toLowerCase();
  const documentType = lower.includes("policy") || lower.includes("procedure") ? "policy_document" : lower.includes("questionnaire") ? "questionnaire" : rawDocumentText.trim().length > 0 ? "uploaded_text" : "vendor_profile";
  const tags = Array.from(
    new Set(
      [
        vendor.industry,
        vendor.businessRegistrationNumber,
        vendor.serviceType,
        vendor.hostingEnvironment,
        vendor.cloudProvider,
        vendor.operatingCountries,
        vendor.dataLocations,
        vendor.regulatoryJurisdictions,
        vendor.dataProcessingActivities,
        vendor.criticalityLevel,
        vendor.riskTier,
        documentType
      ].filter(Boolean).flatMap(
        (value) => String(value).split(/[;,|]/).map((v) => v.trim().toLowerCase()).filter(Boolean)
      )
    )
  ).slice(0, 20);
  return {
    documentType,
    tags,
    normalizedText: combinedText
  };
}
function runExtractor(vendor, intake) {
  const facts = [];
  addFact(facts, "vendor_name", vendor.vendorName);
  addFact(facts, "industry", vendor.industry || "");
  addFact(facts, "business_registration_number", vendor.businessRegistrationNumber || "");
  addFact(facts, "headquarters_location", vendor.headquartersLocation || "");
  addFact(facts, "primary_contact_name", vendor.primaryContactName || "");
  addFact(facts, "primary_contact_email", vendor.primaryContactEmail || "");
  addFact(facts, "primary_contact_role", vendor.primaryContactRole || "");
  addFact(facts, "primary_contact_phone", vendor.primaryContactPhone || "");
  addFact(facts, "service_type", vendor.serviceType || "");
  addFact(facts, "service_scope", vendor.serviceScope || "");
  addFact(facts, "hosting_environment", vendor.hostingEnvironment || "");
  addFact(facts, "cloud_provider", vendor.cloudProvider || "");
  addFact(facts, "operating_countries", vendor.operatingCountries || "");
  addFact(facts, "data_locations", vendor.dataLocations || "");
  addFact(facts, "regulatory_jurisdictions", vendor.regulatoryJurisdictions || "");
  addFact(facts, "certifications", vendor.certifications || "");
  addFact(facts, "data_processing_activities", vendor.dataProcessingActivities || "");
  addFact(facts, "criticality_level", vendor.criticalityLevel || "");
  addFact(facts, "risk_tier", vendor.riskTier || "");
  addFact(facts, "third_party_dependencies", vendor.thirdPartyDependencies || "");
  addFact(facts, "fourth_party_dependencies", vendor.fourthPartyDependencies || "");
  const encryptionRegex = /(rsa|aes)[\s-]?(\d{3,4})/gi;
  let match;
  while (match = encryptionRegex.exec(intake.normalizedText)) {
    addFact(
      facts,
      "encryption_claim",
      `${match[1].toUpperCase()} ${match[2]}`,
      `Found in submission text: ${match[0]}`
    );
  }
  addFact(
    facts,
    "intake_document_type",
    intake.documentType,
    "Classified by Intake & Tagging Clerk"
  );
  return facts.slice(0, 200);
}
async function buildRagContext(facts) {
  const db = await getDb();
  if (!db) return [];
  const frameworkRows = await db.select().from(frameworks);
  const controls = await db.select().from(complianceControls);
  const frameworkCodeById = new Map(
    frameworkRows.map((row) => [row.id, row.code])
  );
  const tokenSet = new Set(
    facts.flatMap((fact) => toTokens(`${fact.key} ${fact.value} ${fact.evidence}`))
  );
  const scored = controls.map((control) => {
    const haystack = `${control.controlCode} ${control.controlName || ""} ${control.category || ""} ${control.requirement || ""} ${control.description || ""}`.toLowerCase();
    if (tokenSet.size === 0) {
      return {
        row: control,
        score: 0
      };
    }
    let hits = 0;
    tokenSet.forEach((token) => {
      if (haystack.includes(token)) hits += 1;
    });
    return {
      row: control,
      score: hits / tokenSet.size
    };
  }).filter((item) => item.score > 0).sort((a, b) => b.score - a.score).slice(0, ENV.aiRagTopK);
  return scored.map((item) => ({
    controlId: item.row.id,
    frameworkCode: frameworkCodeById.get(item.row.frameworkId) || "UNKNOWN",
    controlCode: item.row.controlCode,
    category: item.row.category,
    controlName: item.row.controlName,
    requirement: item.row.requirement,
    relevanceScore: Number(item.score.toFixed(4))
  }));
}
function findWeakEncryptionFact(facts) {
  for (const fact of facts) {
    if (fact.key !== "encryption_claim") continue;
    const match = fact.value.match(/(RSA|AES)\s*(\d{3,4})/i);
    if (!match) continue;
    const algorithm = match[1].toUpperCase();
    const bits = Number(match[2]);
    if (algorithm === "RSA" && bits < 2048 || algorithm === "AES" && bits < 128) {
      return fact;
    }
  }
  return null;
}
function ensureWeakEncryptionGap(assessment, weakFact) {
  if (assessment.gaps.some((gap) => gap.code === WEAK_ENCRYPTION_CODE)) {
    return;
  }
  const newGap = {
    code: WEAK_ENCRYPTION_CODE,
    jurisdiction: "cross_border",
    frameworks: ["PIPL", "PDPL", "NCA"],
    severity: "critical",
    title: "Weak encryption claim detected",
    description: `Extracted evidence indicates weak encryption posture (${weakFact.value}).`,
    mitigation: "Upgrade cryptographic controls to modern baseline (RSA 2048+ or AES-128+), rotate keys, and re-validate data protection controls.",
    penaltyContext: "Weak encryption can materially increase enforcement risk under PIPL, PDPL, and NCA security control expectations."
  };
  assessment.gaps = [newGap, ...assessment.gaps];
  assessment.jurisdictionScores.china = clampScore2(
    assessment.jurisdictionScores.china - 10
  );
  assessment.jurisdictionScores.saudiArabia = clampScore2(
    assessment.jurisdictionScores.saudiArabia - 10
  );
  assessment.overallScore = clampScore2(
    (assessment.jurisdictionScores.china + assessment.jurisdictionScores.saudiArabia) / 2
  );
  assessment.status = scoreToStatus2(assessment.overallScore);
  assessment.riskLevel = inferRiskLevel2(assessment);
}
function runJudge(vendor, facts) {
  const assessment = runDualJurisdictionAssessment(vendor);
  const weakFact = findWeakEncryptionFact(facts);
  if (weakFact) {
    ensureWeakEncryptionGap(assessment, weakFact);
  }
  const recommendationSet = new Set(assessment.recommendations);
  if (weakFact) {
    recommendationSet.add(
      "Execute emergency cryptography remediation and document validated key-management controls before production onboarding."
    );
  }
  assessment.recommendations = Array.from(recommendationSet);
  return assessment;
}
function severityRank(severity) {
  if (severity === "critical") return 4;
  if (severity === "high") return 3;
  if (severity === "medium") return 2;
  return 1;
}
function runSynthesizer(assessment) {
  const plan = [...assessment.gaps].sort((a, b) => severityRank(b.severity) - severityRank(a.severity)).slice(0, 10).map(
    (gap) => `[${gap.severity.toUpperCase()}] ${gap.title}: ${gap.mitigation} (Frameworks: ${gap.frameworks.join(", ")})`
  );
  plan.push(
    "Build a jurisdiction-specific evidence register for CAC, SDAIA, and NCA review cycles.",
    "Introduce quarterly control re-validation against framework updates and supplier architecture changes.",
    "Require legal sign-off for all critical and high findings prior to vendor onboarding approval."
  );
  return Array.from(new Set(plan));
}
function runValidator(assessment, remediationPlan, ragControls) {
  const knownFrameworks = new Set(
    [...DEFAULT_KNOWN_FRAMEWORKS, ...ragControls.map((control) => control.frameworkCode)].map(
      (code) => code.toUpperCase()
    )
  );
  const notes = [];
  for (const gap of assessment.gaps) {
    for (const code of gap.frameworks) {
      if (!knownFrameworks.has(code.toUpperCase())) {
        notes.push(
          `Unknown framework code in gap ${gap.code}: ${code}.`
        );
      }
    }
  }
  if (remediationPlan.length === 0) {
    notes.push("Remediation plan is empty.");
  }
  if (assessment.gaps.length > 0 && remediationPlan.length < 2) {
    notes.push("Remediation plan is too short for identified gap volume.");
  }
  return {
    passed: notes.length === 0,
    notes
  };
}
function buildDbPayload(assessment, remediationPlan, ragControls) {
  const frameworkAssessmentRows = [
    ...CHINA_FRAMEWORKS.map((code) => ({
      frameworkCode: code,
      complianceScore: assessment.jurisdictionScores.china,
      riskLevel: assessment.riskLevel,
      status: assessment.status,
      findings: assessment.gaps.filter((gap) => gap.frameworks.includes(code)).map((gap) => `${gap.code}: ${gap.title}`),
      recommendations: remediationPlan
    })),
    ...SAUDI_FRAMEWORKS.map((code) => ({
      frameworkCode: code,
      complianceScore: assessment.jurisdictionScores.saudiArabia,
      riskLevel: assessment.riskLevel,
      status: assessment.status,
      findings: assessment.gaps.filter((gap) => gap.frameworks.includes(code)).map((gap) => `${gap.code}: ${gap.title}`),
      recommendations: remediationPlan
    }))
  ];
  const firstControlByFramework = /* @__PURE__ */ new Map();
  for (const control of ragControls) {
    if (!firstControlByFramework.has(control.frameworkCode)) {
      firstControlByFramework.set(control.frameworkCode, control.controlCode);
    }
  }
  const gapRows = assessment.gaps.flatMap(
    (gap) => gap.frameworks.map((frameworkCode) => ({
      frameworkCode,
      controlCode: firstControlByFramework.get(frameworkCode) || "",
      gapCode: gap.code,
      gapDescription: gap.description,
      severity: gap.severity,
      remediation: gap.mitigation
    }))
  );
  return {
    vendorAssessments: frameworkAssessmentRows,
    assessmentGaps: gapRows
  };
}
async function executeAssessmentPipeline(input, reportStage) {
  const rawDocumentText = input.rawDocumentText?.trim() || "";
  const requestedEngine = input.engine ?? ENV.aiAssessmentEngineDefault;
  reportStage("gatekeeper", "Security Gatekeeper scanning payload.");
  runSecurityGatekeeper(rawDocumentText);
  reportStage("intake", "Intake Clerk classifying submission.");
  const intake = runIntake(input.vendor, rawDocumentText);
  reportStage("extractor", "Extraction agent mapping facts to controls.");
  const externalFacts = await callAgentSwarm(
    "frontline/extractor",
    {
      vendor: input.vendor,
      intake,
      rawDocumentText
    }
  );
  let extractedFacts = externalFacts && externalFacts.length > 0 ? externalFacts.slice(0, 200) : runExtractor(input.vendor, intake);
  reportStage("rag_context", "RAG context assembler retrieving controls.");
  const ragControls = await buildRagContext(extractedFacts);
  reportStage("judge", "Compliance reviewer evaluating mapped facts.");
  const externalAssessment = await callAgentSwarm(
    "backend/judge",
    {
      vendor: input.vendor,
      extractedFacts,
      ragControls
    }
  );
  let assessment = externalAssessment || runJudge(input.vendor, extractedFacts);
  reportStage("synthesizer", "Strategic synthesizer drafting remediation plan.");
  let remediationPlan = await callAgentSwarm("backend/synthesizer", {
    assessment,
    ragControls
  }) || runSynthesizer(assessment);
  let validatorNotes = [];
  let validatorPassed = false;
  let attempts = 0;
  const maxAttempts = Math.max(1, ENV.aiValidatorMaxRetries + 1);
  while (!validatorPassed && attempts < maxAttempts) {
    attempts += 1;
    reportStage("validator", `Validator pass ${attempts} running.`);
    const externalValidation = await callAgentSwarm(
      "backend/validator",
      {
        assessment,
        remediationPlan,
        ragControls
      }
    );
    const validation = externalValidation || runValidator(assessment, remediationPlan, ragControls);
    validatorPassed = validation.passed;
    validatorNotes = validation.notes;
    if (!validatorPassed && attempts < maxAttempts) {
      remediationPlan = runSynthesizer(assessment);
    }
  }
  if (!validatorPassed) {
    throw new Error(
      `Validator rejected report payload after ${attempts} attempt(s): ${validatorNotes.join(
        " "
      )}`
    );
  }
  reportStage("reporter", "Reporter formatting strict JSON output.");
  const reportPayload = {
    version: "1.0",
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    inputSummary: {
      vendorId: input.vendor.id,
      source: input.source,
      documentType: intake.documentType,
      tags: intake.tags
    },
    extractedFacts,
    ragControls,
    assessment,
    remediationPlan,
    validator: {
      passed: validatorPassed,
      attempts,
      notes: validatorNotes
    },
    dbPayload: buildDbPayload(assessment, remediationPlan, ragControls)
  };
  return aiAssessmentReportSchema.parse(reportPayload);
}

// server/ai/persistence.ts
init_schema();
init_db();
import { and as and4, desc as desc3, eq as eq6 } from "drizzle-orm";
async function persistAssessmentReport(report, shouldPersist) {
  if (!shouldPersist) {
    return {
      savedAssessments: 0,
      savedGaps: 0,
      skipped: true
    };
  }
  if (report.assessment.vendorId <= 0) {
    return {
      savedAssessments: 0,
      savedGaps: 0,
      skipped: true
    };
  }
  const db = await getDb();
  if (!db) {
    return {
      savedAssessments: 0,
      savedGaps: 0,
      skipped: true
    };
  }
  const frameworkRows = await db.select().from(frameworks);
  const frameworkIdByCode = new Map(
    frameworkRows.map((row) => [row.code.toUpperCase(), row.id])
  );
  const assessmentIdByFramework = /* @__PURE__ */ new Map();
  const insertedFrameworks = /* @__PURE__ */ new Set();
  let savedAssessments = 0;
  for (const row of report.dbPayload.vendorAssessments) {
    const frameworkCode = row.frameworkCode.toUpperCase();
    const frameworkId = frameworkIdByCode.get(frameworkCode);
    if (!frameworkId) continue;
    const findingsJson = JSON.stringify(row.findings);
    const recommendationsJson = JSON.stringify(row.recommendations);
    const latestExisting = await db.select().from(vendorAssessments).where(
      and4(
        eq6(vendorAssessments.vendorId, report.assessment.vendorId),
        eq6(vendorAssessments.frameworkId, frameworkId)
      )
    ).orderBy(
      desc3(vendorAssessments.assessmentDate),
      desc3(vendorAssessments.id)
    ).limit(1);
    const existing = latestExisting[0];
    if (existing && existing.complianceScore === row.complianceScore && existing.riskLevel === row.riskLevel && existing.status === row.status && (existing.findings ?? "") === findingsJson && (existing.recommendations ?? "") === recommendationsJson) {
      assessmentIdByFramework.set(frameworkCode, existing.id);
      continue;
    }
    const [inserted] = await db.insert(vendorAssessments).values({
      vendorId: report.assessment.vendorId,
      frameworkId,
      complianceScore: row.complianceScore,
      riskLevel: row.riskLevel,
      status: row.status,
      findings: findingsJson,
      recommendations: recommendationsJson
    }).returning({ id: vendorAssessments.id });
    const assessmentId = inserted?.id ?? 0;
    if (assessmentId > 0) {
      assessmentIdByFramework.set(frameworkCode, assessmentId);
      insertedFrameworks.add(frameworkCode);
    }
    savedAssessments += 1;
  }
  const controlCache = /* @__PURE__ */ new Map();
  let savedGaps = 0;
  for (const gap of report.dbPayload.assessmentGaps) {
    const frameworkCode = gap.frameworkCode.toUpperCase();
    const frameworkId = frameworkIdByCode.get(frameworkCode);
    const assessmentId = assessmentIdByFramework.get(frameworkCode);
    if (!frameworkId || !assessmentId || !insertedFrameworks.has(frameworkCode)) {
      continue;
    }
    let controls = controlCache.get(frameworkId);
    if (!controls) {
      const rows = await db.select({ id: complianceControls.id, controlCode: complianceControls.controlCode }).from(complianceControls).where(eq6(complianceControls.frameworkId, frameworkId));
      controls = rows;
      controlCache.set(frameworkId, controls);
    }
    if (!controls || controls.length === 0) {
      continue;
    }
    const matchedControl = controls.find(
      (control) => control.controlCode.toLowerCase() === gap.controlCode.toLowerCase() && gap.controlCode.trim().length > 0
    ) || controls[0];
    await db.insert(assessmentGaps).values({
      assessmentId,
      controlId: matchedControl.id,
      gapDescription: `${gap.gapCode}: ${gap.gapDescription}`,
      severity: gap.severity,
      remediation: gap.remediation,
      estimatedRemediationCost: null
    });
    savedGaps += 1;
  }
  return {
    savedAssessments,
    savedGaps,
    skipped: false
  };
}

// server/ai/queueFactory.ts
init_env();

// server/ai/queue.ts
import { randomUUID } from "crypto";
import { mkdir, readFile, rm, writeFile } from "fs/promises";
import path2 from "path";
var QUEUE_IDLE_DELAY_MS = 20;
var JOB_WAIT_POLL_MS = 120;
var EVENT_RETENTION = 300;
var HISTORY_RETENTION = 500;
function nowIso() {
  return (/* @__PURE__ */ new Date()).toISOString();
}
function sortByCreatedDesc(a, b) {
  return a.createdAt < b.createdAt ? 1 : -1;
}
function toSnapshot(job) {
  return {
    id: job.id,
    userId: job.userId,
    status: job.status,
    stage: job.stage,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    events: job.events,
    ...job.error ? { error: job.error } : {},
    ...job.result ? { result: job.result } : {},
    ...job.persistence ? { persistence: job.persistence } : {}
  };
}
var InMemoryAssessmentQueue = class {
  constructor(options = {}) {
    this.jobs = /* @__PURE__ */ new Map();
    this.persistedSnapshots = /* @__PURE__ */ new Map();
    this.queue = [];
    this.listeners = /* @__PURE__ */ new Set();
    this.worker = null;
    this.running = false;
    this.historyWriteTask = Promise.resolve();
    this.historyFilePath = options.historyFilePath?.trim() ?? "";
    this.historyReady = this.loadHistory();
  }
  setWorker(worker) {
    this.worker = worker;
  }
  async enqueue(input) {
    await this.historyReady;
    const createdAt = nowIso();
    const id = randomUUID();
    const record = {
      id,
      userId: input.userId,
      status: "queued",
      stage: "queued",
      input,
      createdAt,
      updatedAt: createdAt,
      events: [
        {
          stage: "queued",
          message: "Job queued for orchestration.",
          timestamp: createdAt
        }
      ]
    };
    this.jobs.set(id, record);
    this.queue.push(id);
    this.schedule();
    this.emitSnapshot(record);
    return toSnapshot(record);
  }
  async get(jobId) {
    await this.historyReady;
    const job = this.jobs.get(jobId);
    if (job) {
      return toSnapshot(job);
    }
    return this.persistedSnapshots.get(jobId) || null;
  }
  async listByUser(userId, limit = 20) {
    await this.historyReady;
    const latestById = /* @__PURE__ */ new Map();
    Array.from(this.jobs.values()).filter((job) => job.userId === userId).map(toSnapshot).forEach((snapshot) => {
      latestById.set(snapshot.id, snapshot);
    });
    Array.from(this.persistedSnapshots.values()).filter((snapshot) => snapshot.userId === userId).forEach((snapshot) => {
      if (!latestById.has(snapshot.id)) {
        latestById.set(snapshot.id, snapshot);
      }
    });
    return Array.from(latestById.values()).sort(sortByCreatedDesc).slice(0, limit);
  }
  async waitForCompletion(jobId, timeoutMs) {
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
      const snapshot2 = await this.get(jobId);
      if (!snapshot2) return null;
      if (snapshot2.status === "completed" || snapshot2.status === "failed") {
        await this.historyWriteTask;
        return snapshot2;
      }
      await new Promise((resolve) => setTimeout(resolve, JOB_WAIT_POLL_MS));
    }
    const snapshot = await this.get(jobId);
    if (snapshot?.status === "completed" || snapshot?.status === "failed") {
      await this.historyWriteTask;
    }
    return snapshot;
  }
  async getHistoryDiagnostics(userId) {
    await this.historyReady;
    const historyPath = this.resolveHistoryPath();
    const persistedSnapshots = Array.from(this.persistedSnapshots.values()).filter(
      (snapshot) => snapshot.userId === userId
    );
    const queuedJobCount = Array.from(this.jobs.values()).filter(
      (job) => job.userId === userId && job.status === "queued"
    ).length;
    const activeJobCount = Array.from(this.jobs.values()).filter(
      (job) => job.userId === userId && (job.status === "queued" || job.status === "running")
    ).length;
    return {
      queueMode: "in_memory",
      storageType: historyPath ? "file" : "memory_only",
      storageEnabled: Boolean(historyPath),
      supportsClear: Boolean(historyPath),
      historyEntryCount: persistedSnapshots.length,
      activeJobCount,
      queuedJobCount,
      historyRetentionLimit: HISTORY_RETENTION,
      ...historyPath ? { storagePath: historyPath } : {},
      ...this.historyLastSavedAt ? { lastUpdatedAt: this.historyLastSavedAt } : {},
      details: historyPath ? "File-backed history is enabled for in-memory queue mode." : "In-memory queue history is ephemeral because AI_JOB_HISTORY_FILE is not configured."
    };
  }
  async clearHistory(userId) {
    await this.historyReady;
    const historyPath = this.resolveHistoryPath();
    if (!historyPath) {
      const currentUserEntries2 = Array.from(this.persistedSnapshots.values()).filter(
        (snapshot) => snapshot.userId === userId
      );
      return {
        queueMode: "in_memory",
        storageType: "memory_only",
        supportsClear: false,
        clearedCount: 0,
        remainingCount: currentUserEntries2.length,
        details: "Clear history is unavailable because AI_JOB_HISTORY_FILE is not configured."
      };
    }
    await this.historyWriteTask;
    const currentUserEntries = Array.from(this.persistedSnapshots.values()).filter(
      (snapshot) => snapshot.userId === userId
    );
    let clearedCount = 0;
    for (const snapshot of currentUserEntries) {
      if (this.persistedSnapshots.delete(snapshot.id)) {
        clearedCount += 1;
      }
    }
    await this.persistHistory(historyPath);
    const remainingCount = Array.from(this.persistedSnapshots.values()).filter(
      (snapshot) => snapshot.userId === userId
    ).length;
    return {
      queueMode: "in_memory",
      storageType: "file",
      supportsClear: true,
      clearedCount,
      remainingCount,
      storagePath: historyPath,
      details: clearedCount > 0 ? "Persisted history cleared for the current user. Active jobs were not interrupted." : "No persisted history entries were found for the current user."
    };
  }
  subscribe(listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
  schedule() {
    if (this.running) return;
    this.running = true;
    setTimeout(() => {
      void this.runLoop().finally(() => {
        this.running = false;
        if (this.queue.length > 0) {
          this.schedule();
        }
      });
    }, QUEUE_IDLE_DELAY_MS);
  }
  pushEvent(job, stage, message) {
    const timestamp2 = nowIso();
    job.stage = stage;
    job.updatedAt = timestamp2;
    job.events.push({ stage, message, timestamp: timestamp2 });
    if (job.events.length > EVENT_RETENTION) {
      job.events.splice(0, job.events.length - EVENT_RETENTION);
    }
    this.emitSnapshot(job);
  }
  emitSnapshot(job) {
    const snapshot = toSnapshot(job);
    this.upsertPersistedSnapshot(snapshot);
    this.queueHistoryWrite();
    for (const listener of Array.from(this.listeners)) {
      try {
        listener(snapshot);
      } catch {
      }
    }
  }
  resolveHistoryPath() {
    if (!this.historyFilePath) {
      return "";
    }
    return path2.isAbsolute(this.historyFilePath) ? this.historyFilePath : path2.resolve(process.cwd(), this.historyFilePath);
  }
  async loadHistory() {
    const historyPath = this.resolveHistoryPath();
    if (!historyPath) {
      return;
    }
    try {
      const raw = await readFile(historyPath, "utf-8");
      const parsed = JSON.parse(raw);
      const snapshots = Array.isArray(parsed) ? parsed : parsed && typeof parsed === "object" && Array.isArray(parsed.snapshots) ? parsed.snapshots : [];
      for (const candidate of snapshots) {
        const validated = aiJobSnapshotSchema.safeParse(candidate);
        if (!validated.success) {
          continue;
        }
        this.upsertPersistedSnapshot(validated.data);
      }
      const latestSnapshot = Array.from(this.persistedSnapshots.values()).sort(
        (a, b) => a.updatedAt < b.updatedAt ? 1 : -1
      )[0];
      this.historyLastSavedAt = latestSnapshot?.updatedAt;
    } catch (error) {
      const maybeCode = typeof error === "object" && error && "code" in error ? String(error.code) : "";
      if (maybeCode !== "ENOENT") {
        console.warn(
          "[AI Orchestrator] Failed to load in-memory queue history:",
          error
        );
      }
    }
  }
  upsertPersistedSnapshot(snapshot) {
    const current = this.persistedSnapshots.get(snapshot.id);
    if (!current || current.updatedAt <= snapshot.updatedAt) {
      this.persistedSnapshots.set(snapshot.id, snapshot);
    }
    this.trimPersistedSnapshots();
  }
  trimPersistedSnapshots() {
    if (this.persistedSnapshots.size <= HISTORY_RETENTION) {
      return;
    }
    const ordered = Array.from(this.persistedSnapshots.values()).sort(
      (a, b) => a.updatedAt < b.updatedAt ? -1 : 1
    );
    const overflow = ordered.length - HISTORY_RETENTION;
    for (let index = 0; index < overflow; index += 1) {
      this.persistedSnapshots.delete(ordered[index].id);
    }
  }
  queueHistoryWrite() {
    const historyPath = this.resolveHistoryPath();
    if (!historyPath) {
      return;
    }
    this.historyWriteTask = this.historyWriteTask.then(() => this.persistHistory(historyPath)).catch((error) => {
      console.warn(
        "[AI Orchestrator] Failed to persist in-memory queue history:",
        error
      );
    });
  }
  async persistHistory(historyPath) {
    const snapshots = Array.from(this.persistedSnapshots.values()).sort(sortByCreatedDesc).slice(0, HISTORY_RETENTION);
    if (snapshots.length === 0) {
      await rm(historyPath, { force: true });
      this.historyLastSavedAt = void 0;
      return;
    }
    const payload = {
      version: 1,
      snapshots
    };
    await mkdir(path2.dirname(historyPath), { recursive: true });
    await writeFile(historyPath, JSON.stringify(payload, null, 2), "utf-8");
    this.historyLastSavedAt = nowIso();
  }
  async runLoop() {
    if (!this.worker) return;
    while (this.queue.length > 0) {
      const jobId = this.queue.shift();
      if (!jobId) continue;
      const job = this.jobs.get(jobId);
      if (!job) continue;
      job.status = "running";
      this.pushEvent(job, "gatekeeper", "Worker started processing job.");
      try {
        const workerResult = await this.worker(job.input, (progress) => {
          this.pushEvent(job, progress.stage, progress.message);
        });
        job.status = "completed";
        job.result = workerResult.report;
        job.persistence = workerResult.persistence;
        this.pushEvent(job, "completed", "Assessment orchestration completed.");
      } catch (error) {
        job.status = "failed";
        job.error = error instanceof Error ? error.message : String(error);
        this.pushEvent(
          job,
          "failed",
          "Assessment orchestration failed."
        );
      }
    }
  }
};

// server/ai/redisQueue.ts
import { Queue, Worker } from "bullmq";
var QUEUE_NAME = "djac-ai-assessment";
var JOB_NAME = "assessment";
var EVENT_RETENTION2 = 300;
var JOB_WAIT_POLL_MS2 = 120;
function nowIso2() {
  return (/* @__PURE__ */ new Date()).toISOString();
}
function toSnapshot2(job) {
  return {
    id: job.id,
    userId: job.userId,
    status: job.status,
    stage: job.stage,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    events: job.events,
    ...job.error ? { error: job.error } : {},
    ...job.result ? { result: job.result } : {},
    ...job.persistence ? { persistence: job.persistence } : {}
  };
}
function stateToStatus(state) {
  if (state === "completed") return "completed";
  if (state === "failed") return "failed";
  if (state === "active") return "running";
  return "queued";
}
function parseBullProgress(value) {
  if (!value || typeof value !== "object") {
    return {};
  }
  const progress = value;
  const stage = typeof progress.stage === "string" ? progress.stage : void 0;
  const message = typeof progress.message === "string" ? progress.message : void 0;
  const timestamp2 = typeof progress.timestamp === "string" ? progress.timestamp : void 0;
  return {
    stage,
    message,
    timestamp: timestamp2
  };
}
var RedisAssessmentQueue = class {
  constructor(redisUrl) {
    this.records = /* @__PURE__ */ new Map();
    this.listeners = /* @__PURE__ */ new Set();
    this.workerFn = null;
    this.worker = null;
    this.queue = new Queue(QUEUE_NAME, {
      connection: {
        url: redisUrl
      },
      defaultJobOptions: {
        removeOnComplete: false,
        removeOnFail: false
      }
    });
  }
  setWorker(worker) {
    this.workerFn = worker;
    if (this.worker) return;
    this.worker = new Worker(
      QUEUE_NAME,
      async (job) => {
        if (!this.workerFn) {
          throw new Error("No worker callback registered for Redis queue.");
        }
        const id = String(job.id ?? "");
        if (!id) {
          throw new Error("Redis queue job is missing id.");
        }
        const jobData = job.data;
        const record = this.records.get(id) || this.createRecordFromData(id, jobData, "queued", "queued");
        record.status = "running";
        this.pushEvent(record, "gatekeeper", "Worker started processing job.");
        const result = await this.workerFn(jobData, (progress) => {
          this.pushEvent(record, progress.stage, progress.message);
          void job.updateProgress({
            stage: progress.stage,
            message: progress.message,
            timestamp: nowIso2()
          });
        });
        record.status = "completed";
        record.result = result.report;
        record.persistence = result.persistence;
        this.pushEvent(record, "completed", "Assessment orchestration completed.");
        return result;
      },
      {
        connection: {
          url: this.queue.opts.connection && typeof this.queue.opts.connection === "object" && "url" in this.queue.opts.connection ? this.queue.opts.connection.url : void 0
        },
        concurrency: 1
      }
    );
    this.worker.on("failed", (job, error) => {
      if (!job) return;
      const id = String(job.id ?? "");
      if (!id) return;
      const record = this.records.get(id) || this.createRecordFromData(id, job.data, "failed", "failed");
      record.status = "failed";
      record.error = error?.message || job.failedReason || "Unknown queue failure.";
      this.pushEvent(record, "failed", "Assessment orchestration failed.");
    });
  }
  async enqueue(input) {
    const job = await this.queue.add(JOB_NAME, input);
    const id = String(job.id ?? "");
    if (!id) {
      throw new Error("Redis queue did not return a job id.");
    }
    const record = this.createRecordFromData(id, input, "queued", "queued");
    this.pushEvent(record, "queued", "Job queued for orchestration.");
    return toSnapshot2(record);
  }
  async get(jobId) {
    const existing = this.records.get(jobId);
    if (existing) {
      return toSnapshot2(existing);
    }
    const job = await this.queue.getJob(jobId);
    if (!job) return null;
    const state = await job.getState();
    const status = stateToStatus(state);
    const progress = parseBullProgress(job.progress);
    const stage = progress.stage || (status === "completed" ? "completed" : status === "failed" ? "failed" : "queued");
    const record = this.createRecordFromData(
      jobId,
      job.data,
      status,
      stage
    );
    if (progress.message) {
      record.events.push({
        stage,
        message: progress.message,
        timestamp: progress.timestamp || nowIso2()
      });
    }
    if (status === "failed") {
      record.error = job.failedReason || "Assessment orchestration failed.";
    }
    if (status === "completed" && job.returnvalue) {
      const result = job.returnvalue;
      if (result.report) {
        record.result = result.report;
      }
      if (result.persistence) {
        record.persistence = result.persistence;
      }
    }
    this.records.set(jobId, record);
    return toSnapshot2(record);
  }
  async listByUser(userId, limit = 20) {
    const inMemory = Array.from(this.records.values()).filter((record) => record.userId === userId).sort((a, b) => a.createdAt < b.createdAt ? 1 : -1).slice(0, limit).map(toSnapshot2);
    if (inMemory.length > 0) {
      return inMemory;
    }
    const jobs = await this.queue.getJobs(
      ["wait", "active", "completed", "failed", "delayed"],
      0,
      Math.max(limit * 5, 50)
    );
    const snapshots = [];
    for (const job of jobs) {
      const id = String(job.id ?? "");
      if (!id) continue;
      const data = job.data;
      if (data.userId !== userId) continue;
      const snapshot = await this.get(id);
      if (snapshot) snapshots.push(snapshot);
      if (snapshots.length >= limit) break;
    }
    return snapshots.sort((a, b) => a.createdAt < b.createdAt ? 1 : -1).slice(0, limit);
  }
  async waitForCompletion(jobId, timeoutMs) {
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
      const snapshot = await this.get(jobId);
      if (!snapshot) return null;
      if (snapshot.status === "completed" || snapshot.status === "failed") {
        return snapshot;
      }
      await new Promise((resolve) => setTimeout(resolve, JOB_WAIT_POLL_MS2));
    }
    return this.get(jobId);
  }
  async getHistoryDiagnostics(userId) {
    const snapshots = await this.listByUser(userId, 100);
    const queuedJobCount = snapshots.filter(
      (snapshot) => snapshot.status === "queued"
    ).length;
    const activeJobCount = snapshots.filter(
      (snapshot) => snapshot.status === "queued" || snapshot.status === "running"
    ).length;
    return {
      queueMode: "redis",
      storageType: "redis",
      storageEnabled: true,
      supportsClear: false,
      historyEntryCount: snapshots.length,
      activeJobCount,
      queuedJobCount,
      ...snapshots[0]?.updatedAt ? { lastUpdatedAt: snapshots[0].updatedAt } : {},
      details: "Redis-backed queue history is available from BullMQ storage. Diagnostics are sampled from recent jobs and clear history is disabled to avoid deleting shared queue records."
    };
  }
  async clearHistory(userId) {
    const snapshots = await this.listByUser(userId, 100);
    return {
      queueMode: "redis",
      storageType: "redis",
      supportsClear: false,
      clearedCount: 0,
      remainingCount: snapshots.length,
      details: "Clear history is not supported in Redis queue mode because queue records may be shared with active workers."
    };
  }
  subscribe(listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
  createRecordFromData(id, input, status, stage) {
    const createdAt = nowIso2();
    const record = {
      id,
      userId: input.userId,
      status,
      stage,
      input,
      createdAt,
      updatedAt: createdAt,
      events: []
    };
    this.records.set(id, record);
    return record;
  }
  pushEvent(record, stage, message) {
    const timestamp2 = nowIso2();
    record.stage = stage;
    record.updatedAt = timestamp2;
    record.events.push({ stage, message, timestamp: timestamp2 });
    if (record.events.length > EVENT_RETENTION2) {
      record.events.splice(0, record.events.length - EVENT_RETENTION2);
    }
    this.emitSnapshot(record);
  }
  emitSnapshot(record) {
    const snapshot = toSnapshot2(record);
    for (const listener of Array.from(this.listeners)) {
      try {
        listener(snapshot);
      } catch {
      }
    }
  }
};

// server/ai/queueFactory.ts
var queueSingleton = null;
function getAssessmentQueue() {
  if (queueSingleton) {
    return queueSingleton;
  }
  if (ENV.aiQueueMode === "redis") {
    const redisUrl = ENV.redisUrl.trim();
    if (!redisUrl) {
      console.warn(
        "[AI Orchestrator] AI_QUEUE_MODE=redis but REDIS_URL is empty. Falling back to in-memory queue."
      );
    } else {
      try {
        queueSingleton = new RedisAssessmentQueue(redisUrl);
        console.log("[AI Orchestrator] Redis queue mode enabled.");
        return queueSingleton;
      } catch (error) {
        console.warn(
          "[AI Orchestrator] Failed to initialize Redis queue. Falling back to in-memory queue:",
          error
        );
      }
    }
  }
  queueSingleton = new InMemoryAssessmentQueue({
    historyFilePath: ENV.aiJobHistoryFile
  });
  console.log("[AI Orchestrator] In-memory queue mode enabled.");
  return queueSingleton;
}

// server/ai/orchestrator.ts
var queue = getAssessmentQueue();
queue.setWorker(async (job, onProgress) => {
  const report = await executeAssessmentPipeline(
    {
      source: job.source,
      engine: job.engine,
      vendor: job.vendor,
      rawDocumentText: job.rawDocumentText
    },
    (stage, message) => {
      onProgress({ stage, message });
    }
  );
  onProgress({
    stage: "persistence",
    message: "Persisting report payload to compliance tables."
  });
  const persistence = await persistAssessmentReport(
    report,
    Boolean(job.persistResult)
  );
  return {
    report,
    persistence
  };
});
function enqueueAssessmentJob(input) {
  return queue.enqueue(input);
}
function getAssessmentJob(jobId) {
  return queue.get(jobId);
}
function listAssessmentJobsForUser(userId, limit = 20) {
  return queue.listByUser(userId, limit);
}
function getAssessmentHistoryDiagnostics(userId) {
  return queue.getHistoryDiagnostics(userId);
}
function clearAssessmentHistory(userId) {
  return queue.clearHistory(userId);
}
async function waitForAssessmentJob(jobId, timeoutMs) {
  return queue.waitForCompletion(jobId, timeoutMs ?? ENV.aiJobTimeoutMs);
}
function subscribeAssessmentJobSnapshots(listener) {
  return queue.subscribe(listener);
}
async function runAssessmentSync(input) {
  const queued = await enqueueAssessmentJob(input);
  const finished = await waitForAssessmentJob(queued.id, ENV.aiJobTimeoutMs);
  if (!finished) {
    throw new Error("Assessment job could not be retrieved after enqueue.");
  }
  if (finished.status === "failed") {
    throw new Error(
      finished.error || "Assessment orchestration failed without details."
    );
  }
  if (finished.status !== "completed" || !finished.result) {
    throw new Error("Assessment orchestration timed out before completion.");
  }
  return {
    job: finished,
    report: finished.result
  };
}

// server/ai/router.ts
var submitAssessmentSchema = z3.object({
  vendorId: z3.number().int().positive(),
  rawDocumentText: z3.string().max(1e5).optional().default(""),
  engine: z3.enum(["native"]).optional(),
  waitForCompletion: z3.boolean().optional().default(false),
  timeoutMs: z3.number().int().min(1e3).max(3e5).optional(),
  persistResult: z3.boolean().optional().default(true)
});
var aiRouter = router({
  streamConfig: protectedProcedure.query(() => {
    return {
      websocketPath: ENV.aiWebsocketPath,
      queueMode: ENV.aiQueueMode,
      assessmentEngineDefault: ENV.aiAssessmentEngineDefault
    };
  }),
  submitAssessment: activeOrgProcedure.input(submitAssessmentSchema).mutation(async ({ ctx, input }) => {
    await requireModulePermission(ctx, "vendor_assessment", "canCreate");
    const startedAt = Date.now();
    if (!ENV.aiOrchestratorEnabled) {
      throw new TRPCError3({
        code: "PRECONDITION_FAILED",
        message: "AI orchestrator is disabled by configuration."
      });
    }
    const vendor = await getVendorProfileById(input.vendorId, ctx.user.id, ctx.organizationId);
    if (!vendor) {
      throw new TRPCError3({
        code: "NOT_FOUND",
        message: "Vendor not found."
      });
    }
    const queued = await enqueueAssessmentJob({
      userId: ctx.user.id,
      source: input.rawDocumentText.trim().length > 0 ? "document_upload" : "vendor_profile",
      engine: input.engine ?? ENV.aiAssessmentEngineDefault,
      vendor,
      rawDocumentText: input.rawDocumentText,
      persistResult: input.persistResult
    });
    void recordUserInteraction(ctx, {
      context: "ai.assessment",
      action: "assessment_submitted",
      entityType: "vendor",
      entityId: vendor.id,
      inputSnapshot: {
        vendorId: vendor.id,
        engine: input.engine ?? ENV.aiAssessmentEngineDefault,
        waitForCompletion: input.waitForCompletion,
        persistResult: input.persistResult,
        source: input.rawDocumentText.trim().length > 0 ? "document_upload" : "vendor_profile"
      },
      outputRef: { jobId: queued.id, status: queued.status },
      durationMs: Date.now() - startedAt
    });
    if (!input.waitForCompletion) {
      return {
        jobId: queued.id,
        status: queued.status,
        stage: queued.stage,
        queuedAt: queued.createdAt
      };
    }
    const timeoutMs = input.timeoutMs ?? ENV.aiJobTimeoutMs;
    const completed = await waitForAssessmentJob(queued.id, timeoutMs);
    if (!completed) {
      throw new TRPCError3({
        code: "INTERNAL_SERVER_ERROR",
        message: "Queued job could not be loaded."
      });
    }
    void recordUserInteraction(ctx, {
      context: "ai.assessment",
      action: completed.status === "completed" ? "assessment_completed" : "assessment_finished",
      entityType: "vendor",
      entityId: vendor.id,
      inputSnapshot: { vendorId: vendor.id, jobId: completed.id },
      outputRef: {
        status: completed.status,
        stage: completed.stage,
        gapCount: completed.result?.assessment?.gaps?.length ?? null
      },
      durationMs: Date.now() - startedAt
    });
    return {
      jobId: completed.id,
      status: completed.status,
      stage: completed.stage,
      report: completed.result,
      error: completed.error,
      events: completed.events,
      persistence: completed.persistence
    };
  }),
  getAssessmentJob: protectedProcedure.input(z3.object({ jobId: z3.string().trim().min(1) })).query(async ({ ctx, input }) => {
    await requireModulePermissionIfOrgContext(ctx, "vendor_assessment", "canView");
    const snapshot = await getAssessmentJob(input.jobId);
    if (!snapshot || snapshot.userId !== ctx.user.id) {
      throw new TRPCError3({
        code: "NOT_FOUND",
        message: "Assessment job not found."
      });
    }
    return snapshot;
  }),
  listAssessmentJobs: protectedProcedure.input(
    z3.object({
      limit: z3.number().int().min(1).max(100).optional()
    }).optional()
  ).query(async ({ ctx, input }) => {
    await requireModulePermissionIfOrgContext(ctx, "vendor_assessment", "canView");
    const limit = input?.limit ?? 20;
    return listAssessmentJobsForUser(ctx.user.id, limit);
  }),
  historyDiagnostics: protectedProcedure.query(async ({ ctx }) => {
    await requireModulePermissionIfOrgContext(ctx, "vendor_assessment", "canView");
    return getAssessmentHistoryDiagnostics(ctx.user.id);
  }),
  clearHistory: protectedProcedure.mutation(async ({ ctx }) => {
    await requireModulePermissionIfOrgContext(ctx, "vendor_assessment", "canDelete");
    return clearAssessmentHistory(ctx.user.id);
  }),
  latestCompletedAssessment: protectedProcedure.input(z3.object({ vendorId: z3.number().int().positive() })).query(async ({ ctx, input }) => {
    await requireModulePermissionIfOrgContext(ctx, "vendor_assessment", "canView");
    const jobs = await listAssessmentJobsForUser(ctx.user.id, 100);
    const hit = jobs.find(
      (job) => job.status === "completed" && job.result?.inputSummary.vendorId === input.vendorId
    );
    if (!hit) {
      throw new TRPCError3({
        code: "NOT_FOUND",
        message: "No completed assessment report found for this vendor."
      });
    }
    return {
      jobId: hit.id,
      report: hit.result,
      persisted: hit.persistence
    };
  })
});

// server/billing.ts
import { z as z4 } from "zod";
import { TRPCError as TRPCError4 } from "@trpc/server";
init_env();
init_config_schema();
init_db();
init_schema();
import { eq as eq7 } from "drizzle-orm";
var PRICE_CATALOG = [
  // ── Starter ──────────────────────────────────────────────────────────────
  {
    plan: "starter",
    interval: "monthly",
    amountCents: 2900,
    label: "$29 / mo",
    stripePriceId: parsedEnv.STRIPE_PRICE_STARTER_MONTHLY
  },
  {
    plan: "starter",
    interval: "quarterly",
    amountCents: 7900,
    label: "$79 / qtr",
    savingsLabel: "Save 9%",
    stripePriceId: parsedEnv.STRIPE_PRICE_STARTER_QUARTERLY
  },
  {
    plan: "starter",
    interval: "biannual",
    amountCents: 14900,
    label: "$149 / 6mo",
    savingsLabel: "Save 14%",
    stripePriceId: parsedEnv.STRIPE_PRICE_STARTER_BIANNUAL
  },
  {
    plan: "starter",
    interval: "annual",
    amountCents: 24900,
    label: "$249 / yr",
    savingsLabel: "Save 29%",
    stripePriceId: parsedEnv.STRIPE_PRICE_STARTER_ANNUAL
  },
  // ── Professional ─────────────────────────────────────────────────────────
  {
    plan: "professional",
    interval: "monthly",
    amountCents: 7900,
    label: "$79 / mo",
    stripePriceId: parsedEnv.STRIPE_PRICE_PRO_MONTHLY
  },
  {
    plan: "professional",
    interval: "quarterly",
    amountCents: 19900,
    label: "$199 / qtr",
    savingsLabel: "Save 16%",
    stripePriceId: parsedEnv.STRIPE_PRICE_PRO_QUARTERLY
  },
  {
    plan: "professional",
    interval: "biannual",
    amountCents: 37900,
    label: "$379 / 6mo",
    savingsLabel: "Save 20%",
    stripePriceId: parsedEnv.STRIPE_PRICE_PRO_BIANNUAL
  },
  {
    plan: "professional",
    interval: "annual",
    amountCents: 69900,
    label: "$699 / yr",
    savingsLabel: "Save 26%",
    stripePriceId: parsedEnv.STRIPE_PRICE_PRO_ANNUAL
  },
  // ── Enterprise ───────────────────────────────────────────────────────────
  {
    plan: "enterprise",
    interval: "monthly",
    amountCents: 19900,
    label: "From $199 / mo",
    stripePriceId: parsedEnv.STRIPE_PRICE_ENTERPRISE_MONTHLY
  },
  {
    plan: "enterprise",
    interval: "annual",
    amountCents: 2e5,
    label: "From $2,000 / yr",
    savingsLabel: "Save 16%",
    stripePriceId: parsedEnv.STRIPE_PRICE_ENTERPRISE_ANNUAL
  }
];
function getPriceTier(plan, interval) {
  return PRICE_CATALOG.find((p) => p.plan === plan && p.interval === interval);
}
var _stripe = null;
async function getStripe() {
  if (_stripe) return _stripe;
  if (!ENV.stripeSecretKey) {
    throw new TRPCError4({
      code: "INTERNAL_SERVER_ERROR",
      message: "Stripe is not configured. Set STRIPE_SECRET_KEY in your environment."
    });
  }
  const Stripe = (await import("stripe")).default;
  _stripe = new Stripe(ENV.stripeSecretKey, { apiVersion: "2026-02-25.clover" });
  return _stripe;
}
async function createOrganizationForUser(params) {
  const db = await getDb();
  if (!db) throw new TRPCError4({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
  const now = /* @__PURE__ */ new Date();
  const trialEnd = trialEndsAt(now);
  const [inserted] = await db.insert(organizations).values({
    slug: params.slug,
    name: params.name,
    billingEmail: params.billingEmail,
    industry: params.industry,
    primaryJurisdiction: params.primaryJurisdiction ?? "Both",
    plan: "free_trial",
    trialStartedAt: now,
    trialEndsAt: trialEnd,
    isActive: 1,
    maxSeats: 5
  }).returning({ id: organizations.id });
  const orgId = inserted.id;
  await db.insert(organizationMembers).values({
    organizationId: orgId,
    userId: params.ownerUserId,
    localUserId: params.ownerLocalUserId,
    role: "owner",
    status: "active"
  });
  const [org] = await db.select().from(organizations).where(eq7(organizations.id, orgId));
  return org;
}
var planSchema = z4.enum(["starter", "professional", "enterprise"]);
var intervalSchema = z4.enum(["monthly", "quarterly", "biannual", "annual"]);
var billingRouter = router({
  /** Return the public price catalog — no auth required */
  getPriceCatalog: publicProcedure.query(() => {
    return PRICE_CATALOG.map(({ plan, interval, amountCents, label, savingsLabel }) => ({
      plan,
      interval,
      amountCents,
      label,
      savingsLabel: savingsLabel ?? null
    }));
  }),
  /** Return the current org's subscription status */
  getSubscriptionStatus: orgProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { plan: "free_trial", trialDaysRemaining: 0, isActive: false };
    const orgId = ctx.organizationId;
    const [org] = await db.select().from(organizations).where(eq7(organizations.id, orgId));
    if (!org) return { plan: "free_trial", trialDaysRemaining: 0, isActive: false };
    const [sub] = await db.select().from(subscriptions).where(eq7(subscriptions.organizationId, org.id)).limit(1);
    return {
      plan: org.plan,
      trialDaysRemaining: daysRemainingInTrial(org),
      trialEndsAt: org.trialEndsAt?.toISOString() ?? null,
      isActive: isAccessAllowed(org, sub ?? null),
      subscriptionStatus: sub?.status ?? null,
      billingInterval: sub?.billingInterval ?? null,
      currentPeriodEnd: sub?.currentPeriodEnd?.toISOString() ?? null,
      organizationId: org.id,
      organizationName: org.name
    };
  }),
  /** Create a Stripe Checkout Session — redirects browser to hosted checkout */
  createCheckoutSession: orgAdminProcedure.input(z4.object({
    plan: planSchema,
    interval: intervalSchema,
    organizationId: z4.number().int().positive()
  })).mutation(async ({ ctx, input }) => {
    if (input.organizationId !== ctx.organizationId) {
      throw new TRPCError4({ code: "FORBIDDEN", message: "Cannot manage billing for a different organization." });
    }
    const stripe = await getStripe();
    const tier = getPriceTier(input.plan, input.interval);
    if (!tier) throw new TRPCError4({ code: "BAD_REQUEST", message: "Invalid plan/interval combination" });
    if (!tier.stripePriceId) {
      throw new TRPCError4({
        code: "INTERNAL_SERVER_ERROR",
        message: `Stripe Price ID not configured for ${input.plan}/${input.interval}. Set the STRIPE_PRICE_* env variables.`
      });
    }
    const db = await getDb();
    if (!db) throw new TRPCError4({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const [org] = await db.select().from(organizations).where(eq7(organizations.id, input.organizationId));
    if (!org) throw new TRPCError4({ code: "NOT_FOUND", message: "Organization not found" });
    const userEmail = ctx.user.email;
    const appUrl = ENV.appUrl || "http://localhost:3000";
    let customerId = org.stripeCustomerId ?? void 0;
    if (!customerId && userEmail) {
      const customer = await stripe.customers.create({
        email: userEmail,
        name: org.name,
        metadata: { organizationId: String(org.id), organizationSlug: org.slug }
      });
      customerId = customer.id;
      await db.update(organizations).set({ stripeCustomerId: customerId }).where(eq7(organizations.id, org.id));
    }
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: tier.stripePriceId, quantity: 1 }],
      metadata: {
        organizationId: String(org.id),
        plan: input.plan,
        interval: input.interval,
        stripePriceId: tier.stripePriceId
      },
      subscription_data: {
        metadata: {
          organizationId: String(org.id),
          plan: input.plan,
          interval: input.interval,
          stripePriceId: tier.stripePriceId
        }
      },
      success_url: `${appUrl}/billing?session_id={CHECKOUT_SESSION_ID}&success=1`,
      cancel_url: `${appUrl}/pricing?cancelled=1`,
      allow_promotion_codes: true,
      billing_address_collection: "auto"
    });
    return { checkoutUrl: session.url };
  }),
  /** Open Stripe Customer Portal (manage / cancel subscription) */
  createPortalSession: orgAdminProcedure.input(z4.object({ organizationId: z4.number().int().positive() })).mutation(async ({ ctx, input }) => {
    if (input.organizationId !== ctx.organizationId) {
      throw new TRPCError4({ code: "FORBIDDEN", message: "Cannot manage billing for a different organization." });
    }
    const stripe = await getStripe();
    const db = await getDb();
    if (!db) throw new TRPCError4({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const [org] = await db.select().from(organizations).where(eq7(organizations.id, input.organizationId));
    if (!org?.stripeCustomerId) {
      throw new TRPCError4({ code: "BAD_REQUEST", message: "No billing account found. Please subscribe first." });
    }
    const appUrl = ENV.appUrl || "http://localhost:3000";
    const portal = await stripe.billingPortal.sessions.create({
      customer: org.stripeCustomerId,
      return_url: `${appUrl}/billing`
    });
    return { portalUrl: portal.url };
  }),
  /** Get billing history for an organization */
  getBillingHistory: orgProcedure.input(z4.object({ organizationId: z4.number().int().positive() })).query(async ({ ctx, input }) => {
    if (input.organizationId !== ctx.organizationId) {
      throw new TRPCError4({ code: "FORBIDDEN", message: "Cannot read billing for a different organization." });
    }
    const db = await getDb();
    if (!db) return [];
    const events = await db.select().from(billingEvents).where(eq7(billingEvents.organizationId, input.organizationId)).limit(50);
    return events.map((e) => ({
      id: e.id,
      eventType: e.eventType,
      status: e.status,
      amountCents: e.amountCents,
      currency: e.currency,
      description: e.description,
      createdAt: e.createdAt.toISOString()
    }));
  }),
  /** Create a new organization (called on first sign-up / onboarding) */
  createOrganization: protectedProcedure.input(z4.object({
    name: z4.string().min(2, "Organization name must be at least 2 characters").max(255),
    billingEmail: z4.string().email(),
    industry: z4.string().max(120).optional(),
    primaryJurisdiction: z4.enum(["China", "Saudi Arabia", "Both", "Other"]).optional()
  })).mutation(async ({ ctx, input }) => {
    const startedAt = Date.now();
    if (ctx.organizationId) {
      throw new TRPCError4({
        code: "CONFLICT",
        message: "This account already belongs to an organization."
      });
    }
    const userId = ctx.user.id;
    const slug = input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
    const org = await createOrganizationForUser({
      slug: `${slug}-${userId}`,
      name: input.name,
      billingEmail: input.billingEmail,
      industry: input.industry,
      primaryJurisdiction: input.primaryJurisdiction,
      ownerUserId: userId
    });
    void recordUserInteraction(ctx, {
      context: "billing.organization",
      action: "billing_organization_created",
      entityType: "organization",
      inputSnapshot: {
        name: input.name,
        billingEmail: input.billingEmail,
        industry: input.industry ?? null,
        primaryJurisdiction: input.primaryJurisdiction ?? null
      },
      outputRef: {
        organizationId: org.id,
        organizationSlug: org.slug,
        ownerUserId: userId
      },
      durationMs: Date.now() - startedAt
    });
    return {
      id: org.id,
      slug: org.slug,
      name: org.name,
      plan: org.plan,
      trialEndsAt: org.trialEndsAt?.toISOString()
    };
  })
});

// server/_core/systemRouter.ts
import { z as z5 } from "zod";

// server/_core/notification.ts
init_env();
import { TRPCError as TRPCError5 } from "@trpc/server";
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString2 = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString2(input.title)) {
    throw new TRPCError5({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString2(input.content)) {
    throw new TRPCError5({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError5({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError5({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError5({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError5({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/_core/readiness.ts
init_env();
init_config_schema();
import IORedis from "ioredis";
import pg2 from "pg";
function evaluateScalingReadiness(input) {
  const warnings = [];
  if (!input.hasRedis) {
    warnings.push("Redis-backed shared infrastructure is required for multi-instance scale-out.");
  }
  if (input.databasePoolSize < 20) {
    warnings.push(`DATABASE_POOL_SIZE=${input.databasePoolSize} is below the recommended high-scale baseline of 20.`);
  }
  if (input.allowInMemoryPersistenceFallback) {
    warnings.push("In-memory persistence fallback should be disabled for large-scale production traffic.");
  }
  if (input.aiQueueMode !== "redis") {
    warnings.push("AI queue mode should use Redis to avoid single-instance bottlenecks.");
  }
  return {
    readyForHighScale: input.isProduction && warnings.length === 0,
    warnings,
    recommended: {
      redisRequired: true,
      minDatabasePoolSize: 20,
      preferredAiQueueMode: "redis"
    }
  };
}
async function checkDatabaseReadiness() {
  if (!ENV.databaseUrl) {
    const fallbackEnabled = ENV.allowInMemoryPersistenceFallback;
    return {
      enabled: false,
      ready: fallbackEnabled,
      details: fallbackEnabled ? "DATABASE_URL is not configured. In-memory fallback mode is active." : "DATABASE_URL is not configured."
    };
  }
  let client = null;
  try {
    client = new pg2.Client(ENV.databaseUrl);
    await client.connect();
    await client.query("SELECT 1");
    return {
      enabled: true,
      ready: true,
      details: "Database connection successful (PostgreSQL)."
    };
  } catch (error) {
    if (ENV.allowInMemoryPersistenceFallback) {
      return {
        enabled: true,
        ready: true,
        details: `Database unavailable. In-memory fallback mode is active: ${String(
          error
        )}`
      };
    }
    return {
      enabled: true,
      ready: false,
      details: `Database connection failed: ${String(error)}`
    };
  } finally {
    if (client) {
      await client.end().catch(() => void 0);
    }
  }
}
async function checkRedisReadiness() {
  if (ENV.aiQueueMode !== "redis") {
    return {
      enabled: false,
      ready: true,
      details: "Redis is not required for the current queue mode."
    };
  }
  if (!ENV.redisUrl) {
    return {
      enabled: true,
      ready: false,
      details: "REDIS_URL is not configured."
    };
  }
  const client = new IORedis(ENV.redisUrl, {
    lazyConnect: true,
    maxRetriesPerRequest: 1
  });
  try {
    await client.connect();
    const pong = await client.ping();
    return {
      enabled: true,
      ready: pong === "PONG",
      details: pong === "PONG" ? "Redis connection successful." : `Unexpected Redis ping response: ${pong}`
    };
  } catch (error) {
    return {
      enabled: true,
      ready: false,
      details: `Redis connection failed: ${String(error)}`
    };
  } finally {
    client.disconnect();
  }
}
function checkBillingReadiness() {
  const billing = evaluateStripeBillingConfig({
    STRIPE_SECRET_KEY: parsedEnv.STRIPE_SECRET_KEY || void 0,
    STRIPE_WEBHOOK_SECRET: parsedEnv.STRIPE_WEBHOOK_SECRET || void 0,
    STRIPE_PRICE_STARTER_MONTHLY: parsedEnv.STRIPE_PRICE_STARTER_MONTHLY || void 0,
    STRIPE_PRICE_STARTER_QUARTERLY: parsedEnv.STRIPE_PRICE_STARTER_QUARTERLY || void 0,
    STRIPE_PRICE_STARTER_BIANNUAL: parsedEnv.STRIPE_PRICE_STARTER_BIANNUAL || void 0,
    STRIPE_PRICE_STARTER_ANNUAL: parsedEnv.STRIPE_PRICE_STARTER_ANNUAL || void 0,
    STRIPE_PRICE_PRO_MONTHLY: parsedEnv.STRIPE_PRICE_PRO_MONTHLY || void 0,
    STRIPE_PRICE_PRO_QUARTERLY: parsedEnv.STRIPE_PRICE_PRO_QUARTERLY || void 0,
    STRIPE_PRICE_PRO_BIANNUAL: parsedEnv.STRIPE_PRICE_PRO_BIANNUAL || void 0,
    STRIPE_PRICE_PRO_ANNUAL: parsedEnv.STRIPE_PRICE_PRO_ANNUAL || void 0,
    STRIPE_PRICE_ENTERPRISE_MONTHLY: parsedEnv.STRIPE_PRICE_ENTERPRISE_MONTHLY || void 0,
    STRIPE_PRICE_ENTERPRISE_ANNUAL: parsedEnv.STRIPE_PRICE_ENTERPRISE_ANNUAL || void 0
  });
  if (!billing.enabled) {
    return {
      enabled: false,
      ready: true,
      details: "Stripe billing is disabled. No Stripe production configuration is present."
    };
  }
  if (!billing.ready) {
    return {
      enabled: true,
      ready: false,
      details: `Stripe billing is partially configured. Missing: ${billing.missing.join(", ")}`
    };
  }
  return {
    enabled: true,
    ready: true,
    details: `Stripe billing is fully configured with ${billing.configuredPriceCount} price ids.`
  };
}
async function getSystemReadiness() {
  const database = await checkDatabaseReadiness();
  const redis = await checkRedisReadiness();
  const billing = checkBillingReadiness();
  const aiOrchestrator = {
    enabled: ENV.aiOrchestratorEnabled,
    ready: ENV.aiOrchestratorEnabled && (ENV.aiQueueMode !== "redis" || redis.ready),
    details: ENV.aiOrchestratorEnabled ? `Orchestrator enabled in ${ENV.aiQueueMode} mode.` : "AI orchestrator is disabled by configuration.",
    queueMode: ENV.aiQueueMode,
    websocketPath: ENV.aiWebsocketPath,
    agentSwarmConfigured: ENV.agentSwarmBaseUrl.trim().length > 0
  };
  const scaling = evaluateScalingReadiness({
    isProduction: ENV.isProduction,
    hasRedis: ENV.redisUrl.trim().length > 0,
    databasePoolSize: ENV.databasePoolSize,
    allowInMemoryPersistenceFallback: ENV.allowInMemoryPersistenceFallback,
    aiQueueMode: ENV.aiQueueMode
  });
  const ok = database.ready && aiOrchestrator.ready && redis.ready && billing.ready;
  return {
    ok,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    scaling,
    services: {
      database,
      redis,
      billing,
      aiOrchestrator
    }
  };
}

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z5.object({
      timestamp: z5.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  readiness: publicProcedure.query(async () => {
    return getSystemReadiness();
  }),
  notifyOwner: adminProcedure.input(
    z5.object({
      title: z5.string().min(1, "title is required"),
      content: z5.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/portal-router.ts
import { z as z6 } from "zod";
var accessRequestSchema = z6.object({
  fullName: z6.string().trim().min(2, "Full name must be at least 2 characters").max(255),
  email: z6.string().trim().email().max(320),
  organizationName: z6.string().trim().min(2, "Organization name must be at least 2 characters").max(255),
  organizationType: z6.string().trim().max(120).optional(),
  useCase: z6.string().trim().max(2e3).optional(),
  preferredLocale: z6.enum(["en", "ar", "zh"]).optional()
});
var consultationRequestSchema = z6.object({
  contactName: z6.string().trim().min(2, "Contact name must be at least 2 characters").max(255),
  contactEmail: z6.string().trim().email().max(320),
  organizationName: z6.string().trim().min(2, "Organization name must be at least 2 characters").max(255),
  topic: z6.string().trim().min(3).max(255),
  jurisdictions: z6.array(z6.string().trim().min(1).max(120)).min(1).max(6),
  summary: z6.string().trim().min(20).max(4e3),
  vendorName: z6.string().trim().max(255).optional(),
  techStackSummary: z6.string().trim().max(4e3).optional()
});
var portalRouter = router({
  submitAccessRequest: publicProcedure.input(accessRequestSchema).mutation(async ({ ctx, input }) => {
    const startedAt = Date.now();
    const request = await createAccessRequest(input);
    void recordUserInteraction(ctx, {
      context: "portal.access",
      action: "portal_access_request_submitted",
      entityType: "access_request",
      inputSnapshot: {
        email: input.email,
        organizationName: input.organizationName,
        preferredLocale: input.preferredLocale ?? null
      },
      outputRef: {
        requestId: request.id,
        status: request.status
      },
      durationMs: Date.now() - startedAt
    });
    broadcastSSE("intake_created", {
      kind: "access_request",
      id: request.id,
      status: request.status,
      organizationName: input.organizationName,
      ts: (/* @__PURE__ */ new Date()).toISOString()
    });
    return request;
  }),
  submitConsultationRequest: publicProcedure.input(consultationRequestSchema).mutation(async ({ ctx, input }) => {
    const startedAt = Date.now();
    const request = await createConsultationRequest(input);
    void recordUserInteraction(ctx, {
      context: "portal.consultation",
      action: "portal_consultation_request_submitted",
      entityType: "consultation_request",
      inputSnapshot: {
        contactEmail: input.contactEmail,
        organizationName: input.organizationName,
        jurisdictions: input.jurisdictions
      },
      outputRef: {
        requestId: request.id,
        status: request.status
      },
      durationMs: Date.now() - startedAt
    });
    broadcastSSE("intake_created", {
      kind: "consultation_request",
      id: request.id,
      status: request.status,
      organizationName: input.organizationName,
      topic: input.topic,
      ts: (/* @__PURE__ */ new Date()).toISOString()
    });
    return request;
  }),
  submitAuthenticatedConsultation: protectedProcedure.input(consultationRequestSchema).mutation(async ({ ctx, input }) => {
    await requireModulePermissionIfOrgContext(ctx, "service_requests", "canCreate");
    const startedAt = Date.now();
    const request = await createConsultationRequest({
      ...input,
      userId: ctx.user.id
    });
    void recordUserInteraction(ctx, {
      context: "portal.consultation",
      action: "portal_consultation_request_submitted_authenticated",
      entityType: "consultation_request",
      inputSnapshot: {
        contactEmail: input.contactEmail,
        organizationName: input.organizationName,
        jurisdictions: input.jurisdictions,
        userId: ctx.user.id
      },
      outputRef: {
        requestId: request.id,
        status: request.status
      },
      durationMs: Date.now() - startedAt
    });
    broadcastSSE("intake_created", {
      kind: "consultation_request",
      id: request.id,
      status: request.status,
      organizationName: input.organizationName,
      topic: input.topic,
      ts: (/* @__PURE__ */ new Date()).toISOString()
    });
    return request;
  })
});

// server/local-auth-router.ts
init_db();
init_env();
import bcrypt from "bcryptjs";
import { createHash as createHash3 } from "node:crypto";
import { TRPCError as TRPCError6 } from "@trpc/server";
import { z as z7 } from "zod";
import { generateSecret as otpGenerateSecret, generateURI, verifySync as otpVerifySync } from "otplib";
import qrcode from "qrcode";

// server/email.ts
init_env();
import nodemailer from "nodemailer";
async function sendEmail(payload) {
  const { smtpHost, smtpPort, smtpUser, smtpPass, smtpFrom, isDevelopment } = ENV;
  const from = smtpFrom || "DJAC Platform <noreply@yalla-hack.net>";
  if (!smtpHost || !smtpUser || !smtpPass) {
    if (isDevelopment) {
      console.log(
        `
[EMAIL \u2014 no SMTP configured]
To: ${payload.to}
Subject: ${payload.subject}

${payload.text ?? payload.html}
`
      );
    }
    return;
  }
  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: ENV.smtpSecure,
    auth: { user: smtpUser, pass: smtpPass }
  });
  await transporter.sendMail({
    from,
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
    text: payload.text
  });
}

// server/services/local-jwt.ts
init_schema();
init_db();
init_env();
import * as jose from "jose";
import { parse as parseCookieHeader2 } from "cookie";
import { eq as eq8 } from "drizzle-orm";
var LOCAL_AUTH_COOKIE = "djac_local_session";
var COOKIE_MAX_AGE_S = 60 * 60 * 24 * 7;
function cookieOptions() {
  const isSecure = !ENV.isDevelopment;
  return {
    httpOnly: true,
    sameSite: "strict",
    secure: isSecure,
    maxAge: COOKIE_MAX_AGE_S * 1e3,
    path: "/"
  };
}
async function signJwt(payload, ttl) {
  const secret = new TextEncoder().encode(ENV.cookieSecret);
  return new jose.SignJWT(payload).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime(ttl ?? `${COOKIE_MAX_AGE_S}s`).sign(secret);
}
async function verifyJwt(token) {
  try {
    const secret = new TextEncoder().encode(ENV.cookieSecret);
    const { payload } = await jose.jwtVerify(token, secret);
    return payload;
  } catch {
    return null;
  }
}
function parseJwtUserId(sub) {
  if (typeof sub === "number" && Number.isFinite(sub)) return sub;
  if (typeof sub === "string" && sub.trim().length > 0) {
    const parsed = Number.parseInt(sub, 10);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}
function getSessionTokenFromRequest(req) {
  const fromParsedCookie = req.cookies?.[LOCAL_AUTH_COOKIE];
  if (fromParsedCookie) return fromParsedCookie;
  const rawCookieHeader = req.headers?.cookie;
  if (typeof rawCookieHeader !== "string" || rawCookieHeader.length === 0) return null;
  const parsed = parseCookieHeader2(rawCookieHeader);
  return parsed[LOCAL_AUTH_COOKIE] ?? null;
}
var _localMemoryUserId = 1;
var localMemoryUsers = [];
function isLocalMemoryFallbackEnabled() {
  return ENV.isDevelopment && ENV.allowInMemoryPersistenceFallback;
}
function createLocalMemoryUser(input) {
  const now = /* @__PURE__ */ new Date();
  const row = {
    id: _localMemoryUserId++,
    name: input.name,
    email: input.email,
    passwordHash: input.passwordHash,
    userType: input.userType,
    companyName: input.companyName ?? null,
    jobTitle: input.jobTitle ?? null,
    industry: input.industry ?? null,
    complianceResponsibility: input.complianceResponsibility ?? null,
    preferredLocale: input.preferredLocale,
    status: "active",
    lastSignedIn: now,
    totpSecret: null,
    mfaEnabled: 0,
    mfaBackupCodes: null,
    createdAt: now,
    updatedAt: now
  };
  localMemoryUsers.unshift(row);
  return row;
}
async function resolveLocalSession(req) {
  const token = getSessionTokenFromRequest(req);
  if (!token) return null;
  const payload = await verifyJwt(token);
  if (!payload) return null;
  const userId = parseJwtUserId(payload.sub);
  if (!userId) return null;
  const db = await getDb();
  if (db) {
    const [row] = await db.select().from(localUsers).where(eq8(localUsers.id, userId)).limit(1);
    return row ?? null;
  }
  if (isLocalMemoryFallbackEnabled()) {
    return localMemoryUsers.find((u) => u.id === userId) ?? null;
  }
  return null;
}

// server/local-auth-store.ts
init_schema();
init_db();
import { eq as eq9 } from "drizzle-orm";
async function findLocalUserByEmail(email) {
  const db = await getDb();
  if (!db) {
    if (!isLocalMemoryFallbackEnabled()) return null;
    return localMemoryUsers.find((u) => u.email === email) ?? null;
  }
  const [row] = await db.select().from(localUsers).where(eq9(localUsers.email, email)).limit(1);
  return row ?? null;
}
async function findLocalUserById(id) {
  const db = await getDb();
  if (!db) {
    if (!isLocalMemoryFallbackEnabled()) return null;
    return localMemoryUsers.find((u) => u.id === id) ?? null;
  }
  const [row] = await db.select().from(localUsers).where(eq9(localUsers.id, id)).limit(1);
  return row ?? null;
}
async function checkEmailExists(email) {
  const db = await getDb();
  if (!db) {
    if (!isLocalMemoryFallbackEnabled()) return false;
    return localMemoryUsers.some((u) => u.email === email);
  }
  const rows = await db.select({ id: localUsers.id }).from(localUsers).where(eq9(localUsers.email, email)).limit(1);
  return rows.length > 0;
}
async function listLocalUsersForAdmin() {
  const db = await getDb();
  if (!db) {
    if (!isLocalMemoryFallbackEnabled()) return [];
    return localMemoryUsers.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      userType: u.userType,
      companyName: u.companyName,
      jobTitle: u.jobTitle,
      industry: u.industry,
      status: u.status,
      preferredLocale: u.preferredLocale,
      lastSignedIn: u.lastSignedIn,
      createdAt: u.createdAt
    }));
  }
  return db.select({
    id: localUsers.id,
    name: localUsers.name,
    email: localUsers.email,
    userType: localUsers.userType,
    companyName: localUsers.companyName,
    jobTitle: localUsers.jobTitle,
    industry: localUsers.industry,
    status: localUsers.status,
    preferredLocale: localUsers.preferredLocale,
    lastSignedIn: localUsers.lastSignedIn,
    createdAt: localUsers.createdAt
  }).from(localUsers).orderBy(localUsers.createdAt);
}
async function insertLocalUser(data) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [inserted] = await db.insert(localUsers).values(data).returning({ id: localUsers.id });
  const newId = inserted.id;
  const [row] = await db.select().from(localUsers).where(eq9(localUsers.id, newId)).limit(1);
  return row;
}
async function updateLocalUserLastSignedIn(id) {
  const db = await getDb();
  if (!db) {
    const mem = localMemoryUsers.find((u) => u.id === id);
    if (mem) {
      mem.lastSignedIn = /* @__PURE__ */ new Date();
      mem.updatedAt = /* @__PURE__ */ new Date();
    }
    return;
  }
  await db.update(localUsers).set({ lastSignedIn: /* @__PURE__ */ new Date() }).where(eq9(localUsers.id, id));
}
async function updateLocalUserStatus(id, status) {
  const db = await getDb();
  if (!db) {
    const mem = localMemoryUsers.find((u) => u.id === id);
    if (mem) {
      mem.status = status;
      mem.updatedAt = /* @__PURE__ */ new Date();
    }
    return;
  }
  await db.update(localUsers).set({ status }).where(eq9(localUsers.id, id));
}
async function updateLocalUserPassword(id, passwordHash) {
  const db = await getDb();
  if (!db) {
    const mem = localMemoryUsers.find((u) => u.id === id);
    if (mem) {
      mem.passwordHash = passwordHash;
      mem.updatedAt = /* @__PURE__ */ new Date();
    }
    return;
  }
  await db.update(localUsers).set({ passwordHash, updatedAt: /* @__PURE__ */ new Date() }).where(eq9(localUsers.id, id));
}
async function updateLocalUserProfile(id, fields) {
  const db = await getDb();
  if (!db) {
    const mem = localMemoryUsers.find((u) => u.id === id);
    if (mem) {
      if (fields.name) mem.name = fields.name;
      if (fields.jobTitle !== void 0) mem.jobTitle = fields.jobTitle;
      if (fields.companyName !== void 0) mem.companyName = fields.companyName;
      if (fields.industry !== void 0) mem.industry = fields.industry;
      if (fields.complianceResponsibility !== void 0) mem.complianceResponsibility = fields.complianceResponsibility;
      if (fields.preferredLocale) mem.preferredLocale = fields.preferredLocale;
      mem.updatedAt = /* @__PURE__ */ new Date();
    }
    return;
  }
  await db.update(localUsers).set({ ...fields, updatedAt: /* @__PURE__ */ new Date() }).where(eq9(localUsers.id, id));
}
async function updateLocalUserTotpSecret(id, secret) {
  const db = await getDb();
  if (!db) {
    const mem = localMemoryUsers.find((u) => u.id === id);
    if (mem) mem.totpSecret = secret;
    return;
  }
  await db.update(localUsers).set({ totpSecret: secret }).where(eq9(localUsers.id, id));
}
async function enableLocalUserMfa(id, hashedBackupCodes) {
  const db = await getDb();
  if (!db) {
    const mem = localMemoryUsers.find((u) => u.id === id);
    if (mem) {
      mem.mfaEnabled = 1;
      mem.mfaBackupCodes = JSON.stringify(hashedBackupCodes);
      mem.updatedAt = /* @__PURE__ */ new Date();
    }
    return;
  }
  await db.update(localUsers).set({ mfaEnabled: 1, mfaBackupCodes: JSON.stringify(hashedBackupCodes), updatedAt: /* @__PURE__ */ new Date() }).where(eq9(localUsers.id, id));
}
async function disableLocalUserMfa(id) {
  const db = await getDb();
  if (!db) {
    const mem = localMemoryUsers.find((u) => u.id === id);
    if (mem) {
      mem.mfaEnabled = 0;
      mem.totpSecret = null;
      mem.mfaBackupCodes = null;
      mem.updatedAt = /* @__PURE__ */ new Date();
    }
    return;
  }
  await db.update(localUsers).set({ mfaEnabled: 0, totpSecret: null, mfaBackupCodes: null, updatedAt: /* @__PURE__ */ new Date() }).where(eq9(localUsers.id, id));
}
async function consumeLocalUserBackupCode(id, remainingCodes) {
  const db = await getDb();
  if (!db) {
    const mem = localMemoryUsers.find((u) => u.id === id);
    if (mem) {
      mem.mfaBackupCodes = JSON.stringify(remainingCodes);
      mem.lastSignedIn = /* @__PURE__ */ new Date();
    }
    return;
  }
  await db.update(localUsers).set({ mfaBackupCodes: JSON.stringify(remainingCodes), lastSignedIn: /* @__PURE__ */ new Date() }).where(eq9(localUsers.id, id));
}

// server/local-auth-router.ts
var authenticator = {
  generateSecret: () => otpGenerateSecret(),
  keyuri: (account, service, secret) => generateURI({ issuer: service, label: account, secret }),
  verify: (opts) => {
    try {
      const result = otpVerifySync({ token: opts.token, secret: opts.secret });
      return result.valid;
    } catch {
      return false;
    }
  }
};
var BCRYPT_ROUNDS = 12;
function safeUser(u) {
  const { passwordHash: _omit, ...safe } = u;
  return safe;
}
function isElevatedLocalUserType(userType) {
  if (typeof userType !== "string") return false;
  return ["admin", "platform_admin", "yalla_hack_employee", "super_admin"].includes(userType);
}
var emailSchema = z7.string().trim().email().max(320).transform((s) => s.toLowerCase());
var passwordSchema = z7.string().min(8, "Password must be at least 8 characters").max(128, "Password must be at most 128 characters").regex(/[A-Z]/, "Must contain at least one uppercase letter").regex(/[0-9]/, "Must contain at least one number");
var registerSchema = z7.discriminatedUnion("userType", [
  z7.object({
    userType: z7.literal("visitor"),
    name: z7.string().trim().min(2, "Full name must be at least 2 characters").max(255),
    email: emailSchema,
    password: passwordSchema,
    preferredLocale: z7.enum(["en", "ar", "zh"]).default("en")
  }),
  z7.object({
    userType: z7.literal("professional"),
    name: z7.string().trim().min(2, "Full name must be at least 2 characters").max(255),
    email: emailSchema,
    password: passwordSchema,
    companyName: z7.string().trim().min(2, "Company name must be at least 2 characters").max(255),
    jobTitle: z7.string().trim().min(2, "Job title must be at least 2 characters").max(120),
    industry: z7.string().trim().max(120).optional(),
    complianceResponsibility: z7.string().trim().max(1e3).optional(),
    preferredLocale: z7.enum(["en", "ar", "zh"]).default("en")
  })
]);
var localAuthRouter = router({
  /** Register a new local user account */
  register: publicProcedure.input(registerSchema).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db && !isLocalMemoryFallbackEnabled()) {
      throw new TRPCError6({
        code: "INTERNAL_SERVER_ERROR",
        message: getDatabaseUnavailableMessage()
      });
    }
    if (!db) {
      if (await checkEmailExists(input.email)) {
        throw new TRPCError6({ code: "CONFLICT", message: "An account with this email already exists." });
      }
      const passwordHash2 = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
      const newUser2 = createLocalMemoryUser({
        name: input.name,
        email: input.email,
        passwordHash: passwordHash2,
        userType: input.userType,
        preferredLocale: input.preferredLocale,
        ...input.userType === "professional" ? {
          companyName: input.companyName,
          jobTitle: input.jobTitle,
          industry: input.industry ?? null,
          complianceResponsibility: input.complianceResponsibility ?? null
        } : {}
      });
      const token2 = await signJwt({ sub: newUser2.id, type: "local", userType: newUser2.userType });
      ctx.res.cookie(LOCAL_AUTH_COOKIE, token2, cookieOptions());
      void recordAuditEvent(ctx, { category: "auth", action: "user.register", entityType: "localUsers", entityId: newUser2.id, localUserId: newUser2.id, payload: { userType: newUser2.userType, email: newUser2.email } });
      return { user: safeUser(newUser2) };
    }
    if (await checkEmailExists(input.email)) {
      throw new TRPCError6({ code: "CONFLICT", message: "An account with this email already exists." });
    }
    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
    const newUser = await insertLocalUser({
      name: input.name,
      email: input.email,
      passwordHash,
      userType: input.userType,
      preferredLocale: input.preferredLocale,
      status: "active",
      ...input.userType === "professional" ? {
        companyName: input.companyName,
        jobTitle: input.jobTitle,
        industry: input.industry ?? null,
        complianceResponsibility: input.complianceResponsibility ?? null
      } : {}
    });
    const token = await signJwt({ sub: newUser.id, type: "local", userType: newUser.userType });
    ctx.res.cookie(LOCAL_AUTH_COOKIE, token, cookieOptions());
    void recordAuditEvent(ctx, { category: "auth", action: "user.register", entityType: "localUsers", entityId: newUser.id, localUserId: newUser.id, payload: { userType: newUser.userType, email: newUser.email } });
    broadcastSSE("user_registered", { userId: newUser.id, email: newUser.email, userType: newUser.userType, ts: (/* @__PURE__ */ new Date()).toISOString() });
    return { user: safeUser(newUser) };
  }),
  /** Login with email + password */
  login: publicProcedure.input(
    z7.object({
      email: emailSchema,
      password: z7.string().min(1).max(128)
    })
  ).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db && !isLocalMemoryFallbackEnabled()) {
      throw new TRPCError6({
        code: "INTERNAL_SERVER_ERROR",
        message: getDatabaseUnavailableMessage()
      });
    }
    const user = await findLocalUserByEmail(input.email);
    const dummyHash = "$2a$12$notarealhashjustpadding000000000000000000000000000000000";
    const hashToCheck = user?.passwordHash ?? dummyHash;
    const valid = await bcrypt.compare(input.password, hashToCheck);
    if (!user || !valid) {
      throw new TRPCError6({ code: "UNAUTHORIZED", message: "Invalid email or password." });
    }
    if (user.status === "suspended") {
      throw new TRPCError6({ code: "FORBIDDEN", message: "This account has been suspended. Contact support." });
    }
    await updateLocalUserLastSignedIn(user.id);
    if (user.mfaEnabled) {
      const pendingToken = await signJwt(
        { sub: user.id, purpose: "totp-challenge", type: "local", userType: user.userType },
        "5m"
      );
      return { requireTotp: true, pendingToken };
    }
    const token = await signJwt({ sub: user.id, type: "local", userType: user.userType });
    ctx.res.cookie(LOCAL_AUTH_COOKIE, token, cookieOptions());
    void recordAuditEvent(ctx, { category: "auth", action: "user.login", entityType: "localUsers", entityId: user.id, localUserId: user.id, payload: { method: "local", userType: user.userType } });
    broadcastSSE("user_login", { userId: user.id, email: user.email, userType: user.userType, ts: (/* @__PURE__ */ new Date()).toISOString() });
    return { user: safeUser(user) };
  }),
  /** Return current local-auth session user (null if not logged in) */
  me: publicProcedure.query(async ({ ctx }) => {
    const token = getSessionTokenFromRequest(ctx.req);
    if (!token) return null;
    const payload = await verifyJwt(token);
    const localUserId = parseJwtUserId(payload?.sub);
    if (!payload || localUserId == null) return null;
    const user = await findLocalUserById(localUserId);
    if (!user || user.status === "suspended") return null;
    return safeUser(user);
  }),
  /** Logout â€” clear session cookie */
  logout: publicProcedure.mutation(({ ctx }) => {
    const token = getSessionTokenFromRequest(ctx.req);
    if (token) {
      void verifyJwt(token).then((payload) => {
        const uid = parseJwtUserId(payload?.sub);
        if (uid != null) {
          void recordAuditEvent(ctx, { category: "auth", action: "user.logout", entityType: "localUsers", entityId: uid, localUserId: uid, payload: { method: "local" } });
        }
      });
    }
    ctx.res.clearCookie(LOCAL_AUTH_COOKIE, { path: "/" });
    return { success: true };
  }),
  /** Admin: list all local registrations */
  adminList: publicProcedure.query(async ({ ctx }) => {
    const token = getSessionTokenFromRequest(ctx.req);
    let isAdmin = !!ctx.user?.role && hasMinRole(ctx.user.role, "admin");
    if (!isAdmin && token) {
      const payload = await verifyJwt(token);
      if (isElevatedLocalUserType(payload?.userType)) isAdmin = true;
    }
    if (!isAdmin) throw new TRPCError6({ code: "FORBIDDEN", message: "Admin access required." });
    const db = await getDb();
    if (!db && !isLocalMemoryFallbackEnabled()) {
      throw new TRPCError6({ code: "INTERNAL_SERVER_ERROR", message: getDatabaseUnavailableMessage() });
    }
    return listLocalUsersForAdmin();
  }),
  /** Admin: update user status (activate / suspend) */
  adminSetStatus: publicProcedure.input(
    z7.object({
      userId: z7.number().int().positive(),
      status: z7.enum(["active", "pending", "suspended"])
    })
  ).mutation(async ({ input, ctx }) => {
    const token = getSessionTokenFromRequest(ctx.req);
    let isAdmin = !!ctx.user?.role && hasMinRole(ctx.user.role, "admin");
    if (!isAdmin && token) {
      const payload = await verifyJwt(token);
      if (isElevatedLocalUserType(payload?.userType)) isAdmin = true;
    }
    if (!isAdmin) throw new TRPCError6({ code: "FORBIDDEN", message: "Admin access required." });
    const db = await getDb();
    if (!db && !isLocalMemoryFallbackEnabled()) {
      throw new TRPCError6({ code: "INTERNAL_SERVER_ERROR", message: getDatabaseUnavailableMessage() });
    }
    const user = await findLocalUserById(input.userId);
    if (!user) throw new TRPCError6({ code: "NOT_FOUND", message: "User not found." });
    await updateLocalUserStatus(input.userId, input.status);
    return { success: true };
  }),
  /**
   * Request a password reset email.
   * Always returns success to prevent user enumeration.
   * Sends a 1-hour JWT reset link; the link is invalidated once the password changes.
   */
  requestPasswordReset: publicProcedure.input(z7.object({ email: emailSchema })).mutation(async ({ input, ctx }) => {
    const user = await findLocalUserByEmail(input.email);
    const activeUser = user?.status === "active" ? user : null;
    if (activeUser) {
      const resetToken = await signJwt(
        {
          sub: String(activeUser.id),
          purpose: "password-reset",
          pwHint: activeUser.passwordHash.slice(0, 8)
        },
        "1h"
      );
      const resetUrl = `${ENV.appUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;
      await sendEmail({
        to: input.email,
        subject: "DJAC: Reset your password",
        html: `<p>Hello ${activeUser.name},</p><p>Click the link below to reset your DJAC password. This link expires in 1 hour.</p><p><a href="${resetUrl}">Reset Password</a></p><p>If you did not request a password reset, you can safely ignore this email.</p><p>\xE2\u20AC\u201D Yalla Hack DJAC Team</p>`,
        text: `Hello ${activeUser.name},

Reset your DJAC password:
${resetUrl}

Expires in 1 hour.

If you did not request this, ignore this email.`
      });
      void recordAuditEvent(ctx, { category: "auth", action: "password.reset.request", entityType: "localUsers", entityId: activeUser.id, localUserId: activeUser.id, payload: {} });
    }
    return { success: true };
  }),
  /** Complete a password reset using the one-time JWT from the reset email. */
  resetPassword: publicProcedure.input(z7.object({
    token: z7.string().min(1),
    newPassword: passwordSchema
  })).mutation(async ({ input, ctx }) => {
    let payload;
    try {
      payload = await verifyJwt(input.token) ?? (() => {
        throw new Error();
      })();
    } catch {
      throw new TRPCError6({ code: "BAD_REQUEST", message: "The reset link is invalid or has expired." });
    }
    if (payload["purpose"] !== "password-reset" || typeof payload["sub"] !== "string") {
      throw new TRPCError6({ code: "BAD_REQUEST", message: "Invalid reset token." });
    }
    const userId = parseInt(payload["sub"], 10);
    if (!Number.isFinite(userId)) {
      throw new TRPCError6({ code: "BAD_REQUEST", message: "Invalid reset token." });
    }
    const user = await findLocalUserById(userId);
    if (!user || user.status !== "active") {
      throw new TRPCError6({ code: "NOT_FOUND", message: "Account not found." });
    }
    if (user.passwordHash.slice(0, 8) !== payload["pwHint"]) {
      throw new TRPCError6({ code: "BAD_REQUEST", message: "This reset link has already been used." });
    }
    const newHash = await bcrypt.hash(input.newPassword, BCRYPT_ROUNDS);
    await updateLocalUserPassword(userId, newHash);
    void recordAuditEvent(ctx, { category: "auth", action: "password.reset.complete", entityType: "localUsers", entityId: userId, localUserId: userId, payload: {} });
    return { success: true };
  }),
  // â”€â”€â”€ Profile & password management â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  /** Update the logged-in user's profile fields */
  updateProfile: publicProcedure.input(
    z7.object({
      name: z7.string().trim().min(2, "Name must be at least 2 characters").max(255).optional(),
      jobTitle: z7.string().trim().max(120).optional(),
      companyName: z7.string().trim().max(255).optional(),
      industry: z7.string().trim().max(120).optional(),
      complianceResponsibility: z7.string().trim().max(1e3).optional(),
      preferredLocale: z7.enum(["en", "ar", "zh"]).optional()
    })
  ).mutation(async ({ input, ctx }) => {
    const token = getSessionTokenFromRequest(ctx.req);
    if (!token) throw new TRPCError6({ code: "UNAUTHORIZED", message: "Not logged in." });
    const payload = await verifyJwt(token);
    const userId = parseJwtUserId(payload?.sub);
    if (!userId) throw new TRPCError6({ code: "UNAUTHORIZED", message: "Invalid session." });
    const db = await getDb();
    if (!db && !isLocalMemoryFallbackEnabled()) {
      throw new TRPCError6({ code: "INTERNAL_SERVER_ERROR", message: getDatabaseUnavailableMessage() });
    }
    await updateLocalUserProfile(userId, input);
    broadcastSSE("user_profile_updated", { userId, fields: Object.keys(input).filter((k) => input[k] !== void 0), ts: (/* @__PURE__ */ new Date()).toISOString() });
    return { success: true };
  }),
  /** Change password â€” requires current password for verification */
  changePassword: publicProcedure.input(
    z7.object({
      currentPassword: z7.string().min(1).max(128),
      newPassword: passwordSchema
    })
  ).mutation(async ({ input, ctx }) => {
    const token = getSessionTokenFromRequest(ctx.req);
    if (!token) throw new TRPCError6({ code: "UNAUTHORIZED", message: "Not logged in." });
    const payload = await verifyJwt(token);
    const userId = parseJwtUserId(payload?.sub);
    if (!userId) throw new TRPCError6({ code: "UNAUTHORIZED", message: "Invalid session." });
    const db = await getDb();
    if (!db && !isLocalMemoryFallbackEnabled()) {
      throw new TRPCError6({ code: "INTERNAL_SERVER_ERROR", message: getDatabaseUnavailableMessage() });
    }
    const user = await findLocalUserById(userId);
    if (!user) throw new TRPCError6({ code: "NOT_FOUND", message: "Account not found." });
    const valid = await bcrypt.compare(input.currentPassword, user.passwordHash);
    if (!valid) throw new TRPCError6({ code: "UNAUTHORIZED", message: "Current password is incorrect." });
    const newHash = await bcrypt.hash(input.newPassword, BCRYPT_ROUNDS);
    await updateLocalUserPassword(userId, newHash);
    void recordAuditEvent(ctx, { category: "auth", action: "password.change", entityType: "localUsers", entityId: userId, localUserId: userId, payload: {} });
    broadcastSSE("user_password_changed", { userId, ts: (/* @__PURE__ */ new Date()).toISOString() });
    return { success: true };
  }),
  // â”€â”€â”€ Two-Factor Authentication (TOTP) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  /** Step 1: Generate TOTP secret + QR code URI â€” does NOT yet enable 2FA */
  setup2fa: publicProcedure.mutation(async ({ ctx }) => {
    const token = getSessionTokenFromRequest(ctx.req);
    if (!token) throw new TRPCError6({ code: "UNAUTHORIZED", message: "Not logged in." });
    const payload = await verifyJwt(token);
    const userId = parseJwtUserId(payload?.sub);
    if (!userId) throw new TRPCError6({ code: "UNAUTHORIZED", message: "Invalid session." });
    const secret = authenticator.generateSecret();
    const user = await findLocalUserById(userId);
    const userEmail = user?.email ?? `user-${userId}`;
    const otpauthUri = authenticator.keyuri(userEmail, "DJAC", secret);
    const qrDataUrl = await qrcode.toDataURL(otpauthUri);
    await updateLocalUserTotpSecret(userId, secret);
    return { secret, qrDataUrl };
  }),
  /** Step 2: Verify 6-digit code from authenticator app â€” enables 2FA + returns one-time backup codes */
  confirm2fa: publicProcedure.input(z7.object({ code: z7.string().length(6).regex(/^\d{6}$/) })).mutation(async ({ input, ctx }) => {
    const token = getSessionTokenFromRequest(ctx.req);
    if (!token) throw new TRPCError6({ code: "UNAUTHORIZED", message: "Not logged in." });
    const payload = await verifyJwt(token);
    const userId = parseJwtUserId(payload?.sub);
    if (!userId) throw new TRPCError6({ code: "UNAUTHORIZED", message: "Invalid session." });
    const user = await findLocalUserById(userId);
    const storedSecret = user?.totpSecret ?? null;
    if (!storedSecret) throw new TRPCError6({ code: "BAD_REQUEST", message: "No pending 2FA setup. Call setup2fa first." });
    const isValid = authenticator.verify({ token: input.code, secret: storedSecret });
    if (!isValid) throw new TRPCError6({ code: "BAD_REQUEST", message: "Invalid authenticator code." });
    const plainCodes = Array.from(
      { length: 8 },
      () => createHash3("sha256").update(`${userId}-${Date.now()}-${Math.random()}`).digest("hex").slice(0, 10).toUpperCase()
    );
    const hashedCodes = plainCodes.map((c) => createHash3("sha256").update(c).digest("hex"));
    await enableLocalUserMfa(userId, hashedCodes);
    void recordAuditEvent(ctx, { category: "auth", action: "2fa.enable", entityType: "localUsers", entityId: userId, localUserId: userId, payload: {} });
    return { backupCodes: plainCodes };
  }),
  /** Disable 2FA â€” requires current password */
  disable2fa: publicProcedure.input(z7.object({ password: z7.string().min(1).max(128) })).mutation(async ({ input, ctx }) => {
    const token = getSessionTokenFromRequest(ctx.req);
    if (!token) throw new TRPCError6({ code: "UNAUTHORIZED", message: "Not logged in." });
    const payload = await verifyJwt(token);
    const userId = parseJwtUserId(payload?.sub);
    if (!userId) throw new TRPCError6({ code: "UNAUTHORIZED", message: "Invalid session." });
    const db = await getDb();
    if (!db && !isLocalMemoryFallbackEnabled()) {
      throw new TRPCError6({ code: "INTERNAL_SERVER_ERROR", message: getDatabaseUnavailableMessage() });
    }
    const user = await findLocalUserById(userId);
    if (!user) throw new TRPCError6({ code: "NOT_FOUND", message: "Account not found." });
    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) throw new TRPCError6({ code: "UNAUTHORIZED", message: "Incorrect password." });
    await disableLocalUserMfa(userId);
    void recordAuditEvent(ctx, { category: "auth", action: "2fa.disable", entityType: "localUsers", entityId: userId, localUserId: userId, payload: {} });
    return { success: true };
  }),
  verifyTotp: publicProcedure.input(
    z7.object({
      pendingToken: z7.string().min(1),
      code: z7.string().min(6).max(10).regex(/^[0-9A-Z]+$/i)
    })
  ).mutation(async ({ input, ctx }) => {
    const payload = await verifyJwt(input.pendingToken);
    if (!payload || payload["purpose"] !== "totp-challenge") {
      throw new TRPCError6({ code: "UNAUTHORIZED", message: "Invalid or expired challenge token." });
    }
    const userId = parseJwtUserId(payload?.sub);
    if (!userId) throw new TRPCError6({ code: "UNAUTHORIZED", message: "Invalid challenge token." });
    const db = await getDb();
    if (!db && !isLocalMemoryFallbackEnabled()) {
      throw new TRPCError6({ code: "INTERNAL_SERVER_ERROR", message: getDatabaseUnavailableMessage() });
    }
    const user = await findLocalUserById(userId);
    if (!user) throw new TRPCError6({ code: "NOT_FOUND", message: "Account not found." });
    const code = input.code.toUpperCase();
    if (!user.mfaEnabled) throw new TRPCError6({ code: "BAD_REQUEST", message: "2FA is not enabled for this account." });
    if (!user.totpSecret) throw new TRPCError6({ code: "INTERNAL_SERVER_ERROR", message: "2FA misconfigured." });
    const isTotpValid = code.length === 6 && /^\d{6}$/.test(code) ? authenticator.verify({ token: code, secret: user.totpSecret }) : false;
    if (!isTotpValid) {
      const hashed = createHash3("sha256").update(code).digest("hex");
      const backupCodes = user.mfaBackupCodes ? JSON.parse(user.mfaBackupCodes) : [];
      const backupIdx = backupCodes.indexOf(hashed);
      if (backupIdx === -1) throw new TRPCError6({ code: "UNAUTHORIZED", message: "Invalid authentication code." });
      backupCodes.splice(backupIdx, 1);
      await consumeLocalUserBackupCode(userId, backupCodes);
    } else {
      await updateLocalUserLastSignedIn(userId);
    }
    const sessionToken = await signJwt({ sub: user.id, type: "local", userType: user.userType });
    ctx.res.cookie(LOCAL_AUTH_COOKIE, sessionToken, cookieOptions());
    void recordAuditEvent(ctx, { category: "auth", action: "user.login", entityType: "localUsers", entityId: userId, localUserId: userId, payload: { method: "local_2fa" } });
    return { user: safeUser(user) };
  })
});

// server/compliance-framework-router.ts
import { z as z8 } from "zod";

// server/compliance-timetable.ts
var COMPLIANCE_OBLIGATIONS = [
  // ── Saudi Arabia ───────────────────────────────────────────────
  {
    id: "sa-pdpl-enforcement",
    country: "Saudi Arabia",
    framework: "PDPL",
    requirement: "Full PDPL Compliance Active",
    frequency: "ongoing",
    riskLevel: "critical",
    deadline: "Sept 14, 2024",
    authority: "SDAIA",
    description: "Full enforcement of the Personal Data Protection Law began September 14, 2024. All controllers and processors must have compliant data-processing practices, DPO appointments where required, and PIAs in place.",
    references: ["Saudi Personal Data Protection Law (2021, enforced 2024)", "SDAIA Implementing Regulations"]
  },
  {
    id: "sa-ecc-self-assessment",
    country: "Saudi Arabia",
    framework: "ECC",
    requirement: "ECC Self-Assessment Submission",
    frequency: "annual",
    authority: "NCA",
    riskLevel: "high",
    description: "Annual submission of Essential Cybersecurity Controls compliance status via NCA's Haseen tool. Entities must assess all 114 controls across 5 domains and document evidence of compliance.",
    references: ["NCA Essential Cybersecurity Controls (ECC-1:2018)", "NCA Haseen Tool"]
  },
  {
    id: "sa-internal-audit",
    country: "Saudi Arabia",
    framework: "ECC",
    requirement: "Annual Internal Cybersecurity Audit",
    frequency: "annual",
    authority: "NCA",
    riskLevel: "high",
    description: "Mandatory annual independent internal review of cybersecurity control effectiveness across all ECC domains. Audit findings and remediation plans must be documented.",
    references: ["NCA Essential Cybersecurity Controls (ECC-1:2018)"]
  },
  {
    id: "sa-vulnerability-scan",
    country: "Saudi Arabia",
    framework: "ECC",
    requirement: "Vulnerability Assessment",
    frequency: "quarterly",
    authority: "NCA",
    riskLevel: "medium",
    description: "Quarterly vulnerability scanning of critical systems and applications is recommended. Results must be tracked with severity-based remediation deadlines.",
    references: ["NCA ECC-1:2018 Domain 2 \u2014 Defense Controls"]
  },
  {
    id: "sa-incident-report",
    country: "Saudi Arabia",
    framework: "NCA / PDPL",
    requirement: "Cybersecurity Incident Reporting",
    frequency: "immediate",
    authority: "NCA / SDAIA",
    riskLevel: "critical",
    description: "Significant cybersecurity incidents must be reported immediately to the NCA. Personal data breaches must be notified to SDAIA within 72 hours and to affected data subjects if harm is likely.",
    references: ["NCA Legal Powers (Royal Decree M/117, 2024)", "Saudi PDPL"]
  },
  {
    id: "sa-pdpl-breach-notify",
    country: "Saudi Arabia",
    framework: "PDPL",
    requirement: "Personal Data Breach Notification to SDAIA",
    frequency: "within_72h",
    authority: "SDAIA",
    riskLevel: "critical",
    description: "Controllers must notify SDAIA of personal data breaches within 72 hours of discovery. Notification must include nature of breach, estimated number of affected individuals, and interim containment measures.",
    references: ["Saudi PDPL Article on breach notification", "SDAIA Implementing Regulations"]
  },
  {
    id: "sa-penetration-test",
    country: "Saudi Arabia",
    framework: "ECC",
    requirement: "Penetration Testing",
    frequency: "annual",
    authority: "NCA",
    riskLevel: "high",
    description: "Annual penetration testing of critical systems and internet-facing applications is required. Testing must be conducted by qualified teams and remediation tracked.",
    references: ["NCA ECC-1:2018", "NCA Critical Systems Cybersecurity Controls (CSCC-1:2019)"]
  },
  {
    id: "sa-bcp-drill",
    country: "Saudi Arabia",
    framework: "ECC",
    requirement: "Business Continuity / DR Drill",
    frequency: "annual",
    authority: "NCA",
    riskLevel: "medium",
    description: "Annual testing of business continuity and disaster recovery plans through tabletop exercises or full drills. Results and remediation actions must be documented.",
    references: ["NCA ECC-1:2018 Domain 3 \u2014 Resilience Controls"]
  },
  // ── China ──────────────────────────────────────────────────────
  {
    id: "cn-csl-2026",
    country: "China",
    framework: "CSL",
    requirement: "CSL 2026 Amendment Compliance",
    frequency: "ongoing",
    riskLevel: "critical",
    deadline: "Jan 1, 2026",
    authority: "CAC",
    description: "New CSL amendments effective January 1, 2026. Organizations must update penalty exposure models, executive accountability frameworks, and vulnerability management timelines to comply with significantly increased penalties.",
    references: ["Cybersecurity Law of the PRC \u2014 2026 Amendments"]
  },
  {
    id: "cn-mlps-level3-assessment",
    country: "China",
    framework: "MLPS 2.0",
    requirement: "MLPS Level 3 Annual Assessment",
    frequency: "annual",
    authority: "MPS",
    riskLevel: "critical",
    description: "Systems classified at MLPS Level 3 must undergo annual third-party security assessment by a licensed evaluation agency. Results must be submitted to the local MPS bureau.",
    references: ["GB/T 22239-2019 MLPS 2.0", "CSL Article 21"]
  },
  {
    id: "cn-mlps-level4-assessment",
    country: "China",
    framework: "MLPS 2.0",
    requirement: "MLPS Level 4 Semi-Annual Assessment",
    frequency: "semi_annual",
    authority: "MPS",
    riskLevel: "critical",
    description: "Systems classified at MLPS Level 4 must undergo semi-annual (every 6 months) third-party assessment by a licensed evaluation agency. Higher scrutiny and more frequent MPS reporting apply.",
    references: ["GB/T 22239-2019 MLPS 2.0"]
  },
  {
    id: "cn-minors-data-audit",
    country: "China",
    framework: "PIPL",
    requirement: "Minors' Data Annual Compliance Report",
    frequency: "annual",
    riskLevel: "high",
    deadline: "Jan 31",
    authority: "CAC",
    description: "Entities processing personal information of children under 14 must submit an annual compliance report to the CAC by January 31 each year. The report must cover processing purpose, volume, and safeguard measures.",
    references: ["PIPL Chapter on Minors", "CAC Regulations on Minors' Online Protection"]
  },
  {
    id: "cn-important-data-report",
    country: "China",
    framework: "DSL",
    requirement: "Important Data Annual Security Report",
    frequency: "annual",
    authority: "Sectoral Regulator / CAC",
    riskLevel: "high",
    description: "Entities designated as handlers of 'Important Data' must submit an annual data security assessment report to their sectoral regulator. The report covers data processing activities, risk landscape, and protective measures.",
    references: ["Data Security Law (DSL) Chapter IV", "CAC Network Data Security Management Regulations (2025)"]
  },
  {
    id: "cn-incident-initial",
    country: "China",
    framework: "CSL / MLPS",
    requirement: "Cybersecurity Incident Initial Report",
    frequency: "within_2h",
    authority: "CAC / MPS",
    riskLevel: "critical",
    description: "Major cybersecurity incidents must be reported to CAC and relevant authorities within 2 hours of discovery. Initial report must include incident type, affected systems scope, and immediate containment actions.",
    references: ["CSL Article 25", "GB/T 22239-2019 MLPS 2.0 Operations Controls"]
  },
  {
    id: "cn-incident-detailed",
    country: "China",
    framework: "CSL / MLPS",
    requirement: "Cybersecurity Incident Detailed Report",
    frequency: "within_24h",
    authority: "CAC / MPS",
    riskLevel: "critical",
    description: "A full technical incident report must be submitted within 24 hours of initial discovery. Must include root cause, full impact scope, remediation actions taken, and recovery timeline.",
    references: ["CSL Article 25", "MLPS 2.0 Operations Security Controls"]
  },
  {
    id: "cn-vulnerability-report",
    country: "China",
    framework: "CSL",
    requirement: "Vulnerability Disclosure to Authorities",
    frequency: "within_48h",
    authority: "MIIT / CAC / MPS",
    riskLevel: "high",
    description: "Discovered cybersecurity vulnerabilities must be reported to the MIIT/CAC/MPS joint disclosure portal within 48 hours. Penalties for delayed or withheld disclosures significantly increased under the 2026 CSL amendments.",
    references: ["CSL Chapter IV \u2014 Network Operations Security", "MIIT Vulnerability Management Regulations (2021)", "CSL 2026 Amendments"]
  },
  {
    id: "cn-piia-before-processing",
    country: "China",
    framework: "PIPL",
    requirement: "Personal Information Impact Assessment (PIIA)",
    frequency: "ongoing",
    authority: "CAC",
    riskLevel: "high",
    description: "A PIIA must be completed before initiating high-risk PI processing, including sensitive PI processing, automated profiling, and overseas transfers. PIIA records must be retained for at least three years.",
    references: ["PIPL Article 55", "CAC Standard Contract for Cross-Border PI Transfer (2022)"]
  },
  {
    id: "cn-cross-border-assessment",
    country: "China",
    framework: "PIPL / CSL",
    requirement: "CAC Cross-Border Data Transfer Assessment",
    frequency: "ongoing",
    authority: "CAC",
    riskLevel: "critical",
    description: "CIIOs, large-scale PI processors (>1 million individuals), or exporters of 'important data' must complete a CAC security assessment before each overseas transfer. Assessment validity is typically 2 years.",
    references: ["PIPL Article 38-40", "CSL Article 37", "CAC Measures for Data Export Security Assessment (2022, updated 2024)"]
  },
  {
    id: "sa-privacy-notice",
    country: "Saudi Arabia",
    framework: "PDPL",
    requirement: "Privacy Notice Publication",
    frequency: "annual",
    authority: "SDAIA",
    riskLevel: "low",
    description: "Organisations processing personal data must publish a clear privacy notice describing the types of data collected, purposes of processing, and data subject rights. Annual review is recommended as a best practice to ensure accuracy.",
    references: ["PDPL Article 11", "SDAIA Implementing Regulations (2023) Article 6"]
  }
];
var COMPARISON_TABLE = [
  {
    topic: "Primary Cybersecurity Law",
    saudiArabia: "NCA Statute (2017, amended 2021) + Legal Powers (Royal Decree M/117, 2024)",
    china: "Cybersecurity Law (CSL) \u2014 amended 2026",
    notes: "Both countries have dedicated national cybersecurity laws with binding enforcement."
  },
  {
    topic: "Core Control Framework",
    saudiArabia: "Essential Cybersecurity Controls (ECC-1:2018) \u2014 5 domains, 114 controls",
    china: "Multi-Level Protection Scheme (MLPS 2.0 / GB/T 22239-2019) \u2014 5 protection levels",
    notes: "ECC is mandatory for all Saudi entities; MLPS 2.0 grades systems by risk level."
  },
  {
    topic: "Personal Data Privacy Law",
    saudiArabia: "Personal Data Protection Law (PDPL) \u2014 SDAIA, enforced Sept 2024",
    china: "Personal Information Protection Law (PIPL) \u2014 CAC, effective Nov 2021",
    notes: "Both align closely with GDPR principles: lawful basis, consent, rights, DPO/PIPO."
  },
  {
    topic: "Data Classification",
    saudiArabia: "PDPL classifies: General / Sensitive categories (health, biometric, financial)",
    china: "DSL classifies: General / Important / Core data tiers",
    notes: "China's 3-tier DSL model is broader; Saudi focuses on personal data sensitivity levels."
  },
  {
    topic: "Data Localization",
    saudiArabia: "Government and sensitive data must remain in Saudi Arabia (PDPL + CCC)",
    china: "CIIO / important data must remain in mainland China (CSL Art. 37, DSL)",
    notes: "Both have strong localization requirements for sensitive and government-related data."
  },
  {
    topic: "Cross-Border Data Transfer",
    saudiArabia: "Requires SDAIA approval; adequacy assessment or standard contractual clauses",
    china: "Requires CAC security assessment (CIIO/large-scale), standard contract, or certification",
    notes: "China's requirements are more complex with multiple pathways based on data type and volume."
  },
  {
    topic: "Regulator",
    saudiArabia: "NCA (cybersecurity) + SDAIA (data protection)",
    china: "CAC (lead regulator) + MPS (MLPS) + MIIT (vulnerability/telecom)",
    notes: "China has a multi-agency model; Saudi Arabia splits between NCA and SDAIA."
  },
  {
    topic: "Maximum Penalty",
    saudiArabia: "Up to SAR 5 million (PDPL); NCA can impose additional enforcement actions",
    china: "Up to 10% of annual turnover (CSL 2026); up to RMB 50M or 5% turnover (PIPL)",
    notes: "China's 2026 CSL amendments introduced turnover-based fines, significantly increasing exposure."
  },
  {
    topic: "Incident Reporting Timeline",
    saudiArabia: "Immediately + 72h for personal data breaches",
    china: "2 hours (initial) + 24 hours (detailed report)",
    notes: "China's 2-hour initial report requirement is the strictest globally; Saudi PDPL follows 72h."
  },
  {
    topic: "Assessment Frequency",
    saudiArabia: "Annual ECC self-assessment + annual internal audit",
    china: "Annual (Level 3) or semi-annual (Level 4) by licensed third-party evaluator",
    notes: "Saudi assessments are largely self-reported; China requires licensed third-party evaluation."
  },
  {
    topic: "Executive Liability",
    saudiArabia: "Royal Decree M/117 allows individual liability for serious violations",
    china: "PIPL + CSL 2026: personal fines + up to 10-year industry ban for executives",
    notes: "Both impose personal liability; China's 2026 reforms made executive exposure significantly higher."
  },
  {
    topic: "Vulnerability Disclosure",
    saudiArabia: "Monthly/quarterly vulnerability assessments recommended",
    china: "Must report to MIIT/CAC portal within 48 hours of discovery",
    notes: "China has a legally mandated 48-hour disclosure timeline; Saudi disclosure is best-practice-based."
  },
  {
    topic: "Minors' Data",
    saudiArabia: "PDPL covers minors under general sensitive data category",
    china: "PIPL separate consent for under-14; annual report due by January 31",
    notes: "China has dedicated minors-specific obligations and an annual reporting deadline."
  },
  {
    topic: "Cloud Security",
    saudiArabia: "NCA Cloud Cybersecurity Controls (CCC-2:2024) \u2014 mandatory for CSPs in KSA",
    china: "CAC/TC260 cloud security standards; MLPS 2.0 cloud extension",
    notes: "Both countries mandate cloud-specific security frameworks for service providers."
  }
];
function listComplianceObligations() {
  return COMPLIANCE_OBLIGATIONS;
}
function getObligationsByCountry(country) {
  return COMPLIANCE_OBLIGATIONS.filter((o) => o.country === country);
}
function getComparisonTable() {
  return COMPARISON_TABLE;
}

// server/legal-knowledge.ts
var LAW_KNOWLEDGE_BASE = [
  {
    slug: "saudi-cybersecurity-regime",
    title: "Saudi Cybersecurity Regulatory Framework",
    jurisdiction: "Saudi Arabia",
    frameworkCodes: ["NCA", "PDPL"],
    summary: "Saudi cybersecurity obligations combine NCA Essential Cybersecurity Controls, data-protection duties under PDPL, and criminal enforcement under anti-cybercrime laws.",
    keyTopics: [
      "NCA Essential Cybersecurity Controls",
      "PDPL security safeguards",
      "incident reporting",
      "critical infrastructure",
      "anti-cybercrime enforcement"
    ],
    sections: [
      {
        title: "Governance and control baseline",
        excerpt: "Organizations should implement governance, asset management, access control, and incident-management controls aligned with NCA Essential Cybersecurity Controls.",
        keywords: ["nca", "ecc", "governance", "access control", "incident management"]
      },
      {
        title: "Data protection and privacy overlap",
        excerpt: "Security controls should support PDPL requirements for confidentiality, integrity, breach mitigation, and accountable personal-data handling.",
        keywords: ["pdpl", "personal data", "confidentiality", "integrity", "privacy"]
      },
      {
        title: "Cybercrime and legal exposure",
        excerpt: "Failing to secure systems can increase legal exposure where cyber offenses, unauthorized access, or data misuse trigger enforcement actions.",
        keywords: ["cybercrime", "enforcement", "unauthorized access", "penalties"]
      },
      {
        title: "Reference document",
        excerpt: "Imported legal reference: Cybersecurity law in Saudi Arabia (attached project source document).",
        keywords: ["cybersecurity law in saudi arabia", "reference document", "saudi law"]
      }
    ],
    sources: [
      "Cybersecurity law in saudi arabia.pdf",
      "NCA Essential Cybersecurity Controls",
      "Saudi PDPL"
    ],
    updatedAt: "2026-03-16"
  },
  {
    slug: "saudi-cybersecurity-framework-detailed",
    title: "Saudi Cyber Security Framework - Detailed Legal and Control Index",
    jurisdiction: "Saudi Arabia",
    frameworkCodes: ["NCA", "PDPL"],
    summary: "Detailed searchable index of Saudi cybersecurity framework obligations, mapping governance, technical safeguards, incident handling, third-party risk, and personal-data duties for implementation and audit readiness.",
    keyTopics: [
      "NCA Essential Cybersecurity Controls domains",
      "cyber governance and risk management",
      "asset management and data classification",
      "identity and access management",
      "security operations and monitoring",
      "incident response and reporting",
      "business continuity and disaster recovery",
      "PDPL-aligned personal-data safeguards",
      "third-party and cloud security assurance"
    ],
    sections: [
      {
        title: "Governance and accountability structure",
        excerpt: "Organizations should establish cybersecurity governance with clear executive ownership, defined responsibilities, policy hierarchy, and periodic board-level oversight of cyber risk posture.",
        keywords: [
          "governance",
          "ownership",
          "policy",
          "board oversight",
          "saudi cybersecurity framework"
        ]
      },
      {
        title: "Risk management and control planning",
        excerpt: "A risk-based methodology should identify critical services, threat scenarios, and control priorities, with documented treatment plans and periodic reassessment cycles.",
        keywords: [
          "risk management",
          "threat scenarios",
          "risk treatment",
          "control planning"
        ]
      },
      {
        title: "Asset inventory and data classification",
        excerpt: "Maintain a complete inventory of information assets, classify data by sensitivity, and assign handling/protection requirements for storage, transmission, and retention.",
        keywords: [
          "asset inventory",
          "data classification",
          "sensitive data",
          "retention",
          "handling requirements"
        ]
      },
      {
        title: "Identity, access, and privileged controls",
        excerpt: "Implement least-privilege access, strong authentication, segregation of duties, periodic access recertification, and stricter controls for privileged and remote access paths.",
        keywords: [
          "identity",
          "access control",
          "least privilege",
          "mfa",
          "privileged access"
        ]
      },
      {
        title: "System hardening, patching, and vulnerability management",
        excerpt: "Use secure baseline configurations, timely patch deployment, vulnerability scanning, and remediation tracking with severity-based deadlines and exception handling.",
        keywords: [
          "hardening",
          "patch management",
          "vulnerability scanning",
          "remediation",
          "severity"
        ]
      },
      {
        title: "Data protection and cryptographic safeguards",
        excerpt: "Apply encryption, key-management governance, data loss prevention measures, and secure backup controls to preserve confidentiality, integrity, and availability of critical information.",
        keywords: [
          "encryption",
          "key management",
          "data protection",
          "backup",
          "confidentiality integrity availability"
        ]
      },
      {
        title: "Security operations and monitoring",
        excerpt: "Operate continuous log collection, anomaly detection, and alert triage workflows, supported by incident prioritization and evidence preservation for investigations and audits.",
        keywords: [
          "soc",
          "monitoring",
          "logs",
          "alert triage",
          "evidence preservation"
        ]
      },
      {
        title: "Incident response, forensics, and reporting",
        excerpt: "Maintain tested incident-response playbooks, escalation paths, forensic procedures, and post-incident lessons-learned to strengthen resilience and regulatory readiness.",
        keywords: [
          "incident response",
          "forensics",
          "escalation",
          "reporting",
          "lessons learned"
        ]
      },
      {
        title: "Business continuity and disaster recovery",
        excerpt: "Document continuity requirements for critical services, validate recovery strategies through drills, and maintain recovery objectives aligned with business and legal risk.",
        keywords: [
          "business continuity",
          "disaster recovery",
          "drills",
          "recovery objectives",
          "critical services"
        ]
      },
      {
        title: "Third-party and cloud risk management",
        excerpt: "Vendor and cloud engagements should include cybersecurity due diligence, contractual security obligations, ongoing assurance checks, and risk-based remediation tracking.",
        keywords: [
          "third party",
          "vendor risk",
          "cloud security",
          "contractual obligations",
          "assurance"
        ]
      },
      {
        title: "PDPL and personal-data protection overlap",
        excerpt: "Technical and organizational cybersecurity controls should support personal-data obligations such as lawful processing, data minimization, protection of data-subject rights, and breach-readiness capabilities.",
        keywords: [
          "pdpl",
          "personal data",
          "data minimization",
          "data subject rights",
          "breach readiness"
        ]
      },
      {
        title: "Compliance evidence and audit package",
        excerpt: "Maintain structured evidence including policies, risk registers, architecture diagrams, access reviews, vulnerability closure records, incident reports, and control-test outputs for audits.",
        keywords: [
          "audit evidence",
          "risk register",
          "access review",
          "control testing",
          "compliance package"
        ]
      },
      {
        title: "Source integrity note",
        excerpt: "This detailed entry is indexed from the project-supplied source file titled Cyber Security saudi arabia  Framework.pdf and is intended for compliance search assistance.",
        keywords: [
          "cyber security saudi arabia framework",
          "saudi framework pdf",
          "project source document",
          "reference index"
        ]
      }
    ],
    sources: [
      "Cyber Security saudi arabia  Framework.pdf",
      "NCA Essential Cybersecurity Controls",
      "Saudi Personal Data Protection Law (PDPL)"
    ],
    updatedAt: "2026-03-16"
  },
  {
    slug: "china-data-protection-stack",
    title: "China Data Protection and Cybersecurity Stack (CSL / DSL / PIPL)",
    jurisdiction: "China",
    frameworkCodes: ["CSL", "DSL", "PIPL"],
    summary: "China compliance typically requires simultaneous alignment with CSL (network security), DSL (data classification/security), and PIPL (personal information protection).",
    keyTopics: [
      "critical information infrastructure",
      "data localization",
      "cross-border transfer",
      "personal information protection",
      "security assessment"
    ],
    sections: [
      {
        title: "Cybersecurity Law (CSL)",
        excerpt: "CSL focuses on network operators, baseline cyber controls, and special duties for critical information infrastructure operators.",
        keywords: ["csl", "network operators", "critical infrastructure"]
      },
      {
        title: "Data Security Law (DSL)",
        excerpt: "DSL introduces graded data classification and risk-based data-security obligations for processing activities.",
        keywords: ["dsl", "data classification", "data security"]
      },
      {
        title: "Personal Information Protection Law (PIPL)",
        excerpt: "PIPL governs lawful personal-data processing, purpose limitation, consent/legal basis, and transfer constraints.",
        keywords: ["pipl", "personal information", "consent", "transfer"]
      }
    ],
    sources: ["CSL", "DSL", "PIPL"],
    updatedAt: "2026-03-16"
  },
  {
    slug: "china-cybersecurity-law-2017-detailed",
    title: "Cybersecurity Law of the PRC (CSL) - Detailed Article Index",
    jurisdiction: "China",
    frameworkCodes: ["CSL"],
    summary: "Detailed searchable digest of the Cybersecurity Law of the People's Republic of China (effective 2017-06-01), indexed by key articles, obligations, CIIO controls, personal-information rules, and penalties.",
    keyTopics: [
      "Article 21 multi-level cybersecurity protection system",
      "Article 37 data localization and outbound transfer assessment",
      "critical information infrastructure (CIIO)",
      "personal information protection Articles 40-44",
      "incident response and early warning",
      "network operator obligations and penalties"
    ],
    sections: [
      {
        title: "Articles 1-4: Legislative purpose, scope, and national strategy",
        excerpt: "The CSL protects cybersecurity, cyberspace sovereignty, national security, and lawful rights. It applies to network construction/operation/use and cybersecurity administration in China, and requires continuous strategy improvement with security-by-design principles.",
        keywords: [
          "article 1",
          "article 2",
          "article 3",
          "article 4",
          "scope",
          "national strategy",
          "cyberspace sovereignty"
        ]
      },
      {
        title: "Articles 5-8: State protection model and competent authorities",
        excerpt: "The State must monitor, prevent, and handle domestic/foreign cybersecurity threats, protect critical information infrastructure, and assign coordination to national cyberspace authorities with telecom/public-security departments sharing supervisory duties.",
        keywords: [
          "article 5",
          "article 8",
          "cyberspace authorities",
          "public security",
          "critical information infrastructure"
        ]
      },
      {
        title: "Articles 9-12: Network operator and user conduct obligations",
        excerpt: "Network operators must operate lawfully and in good faith, adopt technical/organizational measures for CIA of data, and users must not use networks for activities endangering national security or public order.",
        keywords: [
          "article 9",
          "article 10",
          "article 12",
          "confidentiality",
          "integrity",
          "availability",
          "operator duties"
        ]
      },
      {
        title: "Articles 13-14: Minors' protection and reporting rights",
        excerpt: "The law supports a safe online environment for minors and gives individuals/organizations the right to report cybersecurity-endangering conduct to competent authorities, which must process reports promptly and confidentially.",
        keywords: [
          "article 13",
          "article 14",
          "report",
          "informant confidentiality",
          "minor protection"
        ]
      },
      {
        title: "Articles 15-20: Standards, investment, ecosystem, and talent",
        excerpt: "China establishes cybersecurity standards, funds core technologies, supports certification/testing/risk-assessment services, promotes secure data use innovation, and mandates ongoing cybersecurity education and workforce development.",
        keywords: [
          "article 15",
          "article 16",
          "article 17",
          "article 18",
          "article 19",
          "article 20",
          "standards",
          "training"
        ]
      },
      {
        title: "Article 21: Multi-level protection baseline (MLPS)",
        excerpt: "Network operators must implement internal governance, anti-malware/anti-intrusion controls, operation and incident monitoring, and retain relevant network logs for at least six months, plus backup/classification/encryption measures.",
        keywords: [
          "article 21",
          "mlps",
          "six months logs",
          "network logs",
          "data classification",
          "backup",
          "encryption"
        ]
      },
      {
        title: "Articles 22-23: Product security, vulnerabilities, and certification",
        excerpt: "Network products/services must meet mandatory standards, avoid malware, patch vulnerabilities promptly, notify users, report incidents, and provide maintenance. Critical equipment/specialized cybersecurity products require qualified certification or security inspection.",
        keywords: [
          "article 22",
          "article 23",
          "vulnerability disclosure",
          "security maintenance",
          "critical network equipment",
          "certification"
        ]
      },
      {
        title: "Article 24: Real-identity requirements",
        excerpt: "Operators offering access, domain registration, publishing, or instant messaging services must collect identity details; services cannot be provided when identity details are not supplied.",
        keywords: [
          "article 24",
          "real name registration",
          "identity verification",
          "network access"
        ]
      },
      {
        title: "Articles 25-30: Incident response, cooperation, and data-use limits",
        excerpt: "Operators must maintain incident-response plans, remediate vulnerabilities quickly, and report incidents. The law forbids offensive tooling/support activities and requires cooperation with public/national security. Data collected by authorities during supervision is restricted to cybersecurity purposes.",
        keywords: [
          "article 25",
          "article 26",
          "article 27",
          "article 28",
          "article 29",
          "article 30",
          "incident response",
          "technical support"
        ]
      },
      {
        title: "Articles 31-33: CIIO scope and protection planning",
        excerpt: "Critical information infrastructure includes sectors such as communications, energy, transport, finance, public services, and e-government where failures could seriously harm national/public interests. Relevant departments must implement sector-specific security plans.",
        keywords: [
          "article 31",
          "article 32",
          "article 33",
          "ciio",
          "critical infrastructure sectors"
        ]
      },
      {
        title: "Article 34: Enhanced CIIO operator obligations",
        excerpt: "CIIO operators must establish dedicated security management, vet key personnel, run periodic training/assessments, maintain disaster recovery for important systems/databases, and conduct regular incident drills.",
        keywords: [
          "article 34",
          "ciio obligations",
          "background checks",
          "disaster recovery",
          "security drills"
        ]
      },
      {
        title: "Articles 35-37: Security review and data localization",
        excerpt: "CIIO operators must undergo security review for purchases affecting national security, sign security/confidentiality agreements, and store personal information and important data generated in mainland operations within China. Outbound transfers require security assessment unless another law provides otherwise.",
        keywords: [
          "article 35",
          "article 36",
          "article 37",
          "security review",
          "localization",
          "cross-border transfer",
          "mainland china"
        ]
      },
      {
        title: "Articles 38-39: Annual CIIO risk assessment and state support",
        excerpt: "CIIO operators must perform at least annual cybersecurity risk assessments and submit findings plus remediation actions. National cyberspace authorities can conduct random risk testing, organize emergency drills, and coordinate threat intelligence sharing.",
        keywords: [
          "article 38",
          "article 39",
          "annual assessment",
          "remediation",
          "intelligence sharing"
        ]
      },
      {
        title: "Articles 40-44: Personal information governance framework",
        excerpt: "Operators must keep user information confidential, process personal information lawfully/properly/necessarily, disclose processing rules and purpose, obtain consent, and support deletion/correction requests. Unauthorized sale, theft, or illegal provision of personal information is prohibited.",
        keywords: [
          "article 40",
          "article 41",
          "article 42",
          "article 43",
          "article 44",
          "consent",
          "delete and correct",
          "personal information"
        ]
      },
      {
        title: "Articles 45-50: Content and platform information-security controls",
        excerpt: "Supervisory personnel must protect confidentiality of personal/private/trade-secret information. Operators and distribution platforms must block prohibited content, keep records, cooperate with investigations, and handle complaints/reporting channels.",
        keywords: [
          "article 45",
          "article 46",
          "article 47",
          "article 48",
          "article 49",
          "article 50",
          "content moderation",
          "complaint reporting"
        ]
      },
      {
        title: "Articles 51-58: Monitoring, early warning, and emergency powers",
        excerpt: "China establishes cybersecurity monitoring, warning, and reporting systems. Authorities and sectors must maintain response plans and drills. In major emergencies, temporary network communication restrictions may be imposed in specified regions with proper approval.",
        keywords: [
          "article 51",
          "article 52",
          "article 53",
          "article 54",
          "article 55",
          "article 56",
          "article 58",
          "early warning",
          "temporary network restrictions"
        ]
      },
      {
        title: "Articles 59-71: Administrative penalties and enforcement",
        excerpt: "The CSL provides escalating penalties for non-compliance, including warnings, corrective orders, confiscation of unlawful gains, fines, suspension of operations, website shutdown, and permit/license revocation. Serious personal-information, CIIO, and prohibited-content violations carry higher penalties.",
        keywords: [
          "article 59",
          "article 60",
          "article 61",
          "article 64",
          "article 65",
          "article 66",
          "article 68",
          "penalties",
          "license revocation"
        ]
      },
      {
        title: "Articles 72-79: Liability, definitions, and implementation date",
        excerpt: "The law imposes accountability on state entities and supervisors, allows civil/public-order/criminal liability where applicable, defines key terms (network, cybersecurity, network operator, network data, personal information), and took effect on June 1, 2017.",
        keywords: [
          "article 72",
          "article 73",
          "article 74",
          "article 75",
          "article 76",
          "article 79",
          "effective date",
          "definitions"
        ]
      },
      {
        title: "Source integrity note",
        excerpt: "This indexed entry is based on the user-provided unofficial translation text (reference only) attributed to China Securities Regulatory Commission website material.",
        keywords: [
          "unofficial translation",
          "reference only",
          "china securities regulatory commission",
          "csrc"
        ]
      }
    ],
    sources: [
      "Cybersecurity Law of the PRC - unofficial translation provided by project stakeholder",
      "China Securities Regulatory Commission (translation source reference)"
    ],
    updatedAt: "2026-03-16"
  },
  {
    slug: "saudi-ecc-1-2018-detailed",
    title: "Saudi Essential Cybersecurity Controls (ECC-1:2018) \u2014 Full Domain Index",
    jurisdiction: "Saudi Arabia",
    frameworkCodes: ["NCA", "ECC"],
    summary: "The ECC-1:2018 is the mandatory baseline cybersecurity framework issued by the NCA, covering 5 domains, 29 sub-domains, and 114 controls applicable to all Saudi government entities and critical infrastructure operators.",
    keyTopics: [
      "Domain 1: Cybersecurity Governance (strategy, management, policy, risk, HR)",
      "Domain 2: Cybersecurity Defense (asset management, IAM, network, mobile)",
      "Domain 3: Cybersecurity Resilience (BCP, disaster recovery, backup)",
      "Domain 4: Third-Party and Cloud Security (vendor risk, cloud adoption)",
      "Domain 5: ICS/OT Cybersecurity (industrial control systems, SCADA)",
      "NCA Haseen self-assessment tool",
      "annual internal audit obligations",
      "mandatory incident reporting to NCA"
    ],
    sections: [
      {
        title: "1-1 Cybersecurity Strategy",
        excerpt: "Organizations must align cybersecurity strategy with business objectives and the national cybersecurity strategy. The strategy should be reviewed and updated periodically to address changes in the threat landscape.",
        keywords: ["strategy", "national strategy", "business alignment", "periodic review"]
      },
      {
        title: "1-2 Cybersecurity Management",
        excerpt: "Clear roles, responsibilities, and organizational structures for cybersecurity must be established. A designated cybersecurity function or officer must be accountable for cybersecurity outcomes and board reporting.",
        keywords: ["management", "roles", "responsibilities", "ciso", "organizational structure"]
      },
      {
        title: "1-3 Cybersecurity Policies and Procedures",
        excerpt: "Formal cybersecurity policies must be documented, approved by senior management, communicated to all relevant staff, and reviewed annually or after significant changes.",
        keywords: ["policy", "procedures", "documentation", "approval", "annual review"]
      },
      {
        title: "1-4 Cybersecurity Risk Management",
        excerpt: "Organizations must conduct regular cybersecurity risk assessments, document risk treatment plans, and track remediation of identified security risks in alignment with organizational risk tolerance.",
        keywords: ["risk assessment", "risk treatment", "risk tolerance", "remediation tracking"]
      },
      {
        title: "1-5 Cybersecurity in Human Resources",
        excerpt: "Background checks for key personnel, security awareness training for all staff, role-specific training for security teams, and clear offboarding procedures are required.",
        keywords: ["background checks", "awareness training", "security culture", "offboarding"]
      },
      {
        title: "2-1 Asset Management",
        excerpt: "A complete and maintained inventory of hardware, software, data, and network assets is required. Assets must be classified by criticality and ownership assigned. Unauthorized assets must be detected and managed.",
        keywords: ["asset inventory", "hardware", "software", "data assets", "asset classification", "ownership"]
      },
      {
        title: "2-2 Identity and Access Management (IAM)",
        excerpt: "Controls include MFA for privileged and remote access, least-privilege principles, periodic access recertification, user lifecycle management (provisioning/de-provisioning), and separation of duties.",
        keywords: ["iam", "mfa", "least privilege", "access review", "provisioning", "separation of duties"]
      },
      {
        title: "2-3 Information Systems and Assets Protection",
        excerpt: "Encryption for data at rest and in transit, secure configuration baselines, patch management with SLA-based deadlines, and anti-malware controls are required for all systems.",
        keywords: ["encryption", "secure configuration", "patch management", "anti-malware", "hardening"]
      },
      {
        title: "2-4 Network Security Management",
        excerpt: "Network segmentation, perimeter defenses (firewalls, IDS/IPS), secure remote access (VPN), and traffic monitoring are mandatory. DMZ architectures are required for externally exposed services.",
        keywords: ["network segmentation", "firewall", "ids ips", "vpn", "dmz", "perimeter security"]
      },
      {
        title: "2-5 Mobile Devices and Portable Media Security",
        excerpt: "Mobile Device Management (MDM) must control corporate devices. Portable media must be encrypted and usage restricted by policy. BYOD policies must define security requirements for personal devices accessing corporate data.",
        keywords: ["mdm", "mobile security", "portable media", "byod", "encryption"]
      },
      {
        title: "3-1 Business Continuity and Disaster Recovery",
        excerpt: "Organizations must document BCP/DR plans, define RTO/RPO for critical systems, maintain tested backups, and conduct regular drills to validate recovery capabilities. Plans must be reviewed annually.",
        keywords: ["bcp", "disaster recovery", "rto", "rpo", "backup", "drills", "resilience"]
      },
      {
        title: "4-1 Third-Party Cybersecurity",
        excerpt: "Vendor risk assessments are required before onboarding. Contracts must include security clauses, audit rights, and breach notification obligations. Ongoing assurance reviews must be conducted for high-risk suppliers.",
        keywords: ["vendor risk", "third party", "contract security clauses", "audit rights", "supplier assurance"]
      },
      {
        title: "4-2 Cloud Computing Cybersecurity",
        excerpt: "Cloud adoption must follow NCA Cloud Cybersecurity Controls (CCC-2:2024). Data classification determines permissible cloud deployment models. Government and sensitive data must reside within Saudi Arabia.",
        keywords: ["cloud security", "ccc", "data localization", "cloud deployment", "saas paas iaas"]
      },
      {
        title: "5-1 ICS/OT Cybersecurity",
        excerpt: "Industrial control systems and OT environments require specialized controls from the OTCC-1:2022 framework, including network isolation from corporate IT, firmware validation, and OT-specific incident response plans.",
        keywords: ["ics", "ot", "scada", "otcc", "industrial cybersecurity", "network isolation", "firmware"]
      },
      {
        title: "ECC Compliance and Audit Requirements",
        excerpt: "Entities must submit annual ECC self-assessments via the NCA's Haseen tool. Internal audits are mandatory. The NCA may conduct external audits of critical entities. Non-compliance can result in enforcement actions under the NCA's legal powers (Royal Decree M/117, 2024).",
        keywords: ["haseen", "self-assessment", "annual audit", "nca enforcement", "m/117", "compliance submission"]
      }
    ],
    sources: [
      "NCA Essential Cybersecurity Controls (ECC-1:2018)",
      "NCA Cloud Cybersecurity Controls (CCC-2:2024)",
      "NCA Operational Technology Cybersecurity Controls (OTCC-1:2022)",
      "Legal Powers of the NCA (Royal Decree M/117, 2024)",
      "Saudi Arabia Cybersecurity Compliance Database (DJAC project reference)"
    ],
    updatedAt: "2026-03-16"
  },
  {
    slug: "saudi-pdpl-2024-detailed",
    title: "Saudi Personal Data Protection Law (PDPL) \u2014 Enforcement Guide",
    jurisdiction: "Saudi Arabia",
    frameworkCodes: ["PDPL", "SDAIA"],
    summary: "The PDPL (issued 2021, fully enforced September 14, 2024) is Saudi Arabia's comprehensive personal data privacy law administered by SDAIA. It governs data collection, processing, retention, and cross-border transfer of personal information.",
    keyTopics: [
      "lawful basis for data processing and consent",
      "data subject rights (access, correction, deletion, objection)",
      "cross-border personal data transfer restrictions",
      "data localization requirements",
      "data breach notification obligations",
      "Data Protection Officer (DPO) appointment",
      "privacy impact assessments (PIA)",
      "enforcement by SDAIA with fines up to SAR 5 million"
    ],
    sections: [
      {
        title: "Scope and Applicability",
        excerpt: "The PDPL applies to all controllers and processors operating in Saudi Arabia or processing personal data of Saudi residents, regardless of the data processor's location. It covers both digital and paper-based personal records.",
        keywords: ["pdpl scope", "applicability", "controller", "processor", "saudi residents", "extraterritorial"]
      },
      {
        title: "Lawful Basis for Processing",
        excerpt: "Personal data processing requires a lawful basis: consent, contractual necessity, legal obligation, vital interests, public task, or legitimate interests. Consent must be explicit, informed, and freely given. Special categories (health, biometric, financial) require explicit consent.",
        keywords: ["consent", "lawful basis", "explicit consent", "special categories", "health data", "biometric"]
      },
      {
        title: "Data Subject Rights",
        excerpt: "Data subjects have rights to: access their personal data, request correction of inaccurate data, request deletion ('right to be forgotten'), object to processing, and request restriction of processing. Controllers must respond within defined timelines.",
        keywords: ["data subject rights", "right to access", "right to deletion", "right to correction", "objection", "restriction"]
      },
      {
        title: "Data Minimization and Purpose Limitation",
        excerpt: "Data collection must be limited to what is necessary for the stated purpose. Personal data must not be used for purposes incompatible with the original collection purpose without a new lawful basis.",
        keywords: ["data minimization", "purpose limitation", "collection purpose", "proportionality"]
      },
      {
        title: "Cross-Border Data Transfers",
        excerpt: "Transfer of personal data outside Saudi Arabia requires SDAIA approval and adequate protection in the receiving country. Transfer is permitted based on adequacy decisions, binding corporate rules, standard contractual clauses, or SDAIA approval.",
        keywords: ["cross-border transfer", "data transfer", "sdaia approval", "standard contractual clauses", "bcr", "adequacy"]
      },
      {
        title: "Data Localization",
        excerpt: "Certain categories of personal data linked to government and sensitive sectors must be stored within Saudi Arabia. Cloud providers processing such data must use Saudi-based data centers.",
        keywords: ["data localization", "saudi data centers", "cloud storage", "government data", "in-kingdom"]
      },
      {
        title: "Security Safeguards",
        excerpt: "Controllers must implement appropriate technical and organizational measures to protect personal data against unauthorized access, alteration, disclosure, or destruction. Security measures must be proportionate to the risk.",
        keywords: ["security safeguards", "technical measures", "organizational measures", "data protection", "breach prevention"]
      },
      {
        title: "Data Breach Notification",
        excerpt: "Controllers must notify SDAIA of data breaches that affect personal data within 72 hours of becoming aware. Data subjects must be notified if the breach is likely to result in harm to their rights and freedoms.",
        keywords: ["breach notification", "72 hours", "sdaia notification", "data subjects notification", "incident reporting"]
      },
      {
        title: "Data Protection Officer (DPO)",
        excerpt: "Controllers engaged in large-scale processing, processing of special categories, or systematic monitoring of data subjects must appoint a qualified DPO. The DPO advises on compliance, monitors PDPL adherence, and acts as contact for SDAIA.",
        keywords: ["dpo", "data protection officer", "large scale processing", "sdaia contact", "compliance advisory"]
      },
      {
        title: "Privacy Impact Assessment (PIA)",
        excerpt: "A PIA is required before initiating high-risk processing activities, including new technologies, large-scale profiling, or systematic processing of sensitive data. The PIA must document risks and mitigation measures.",
        keywords: ["pia", "privacy impact assessment", "high risk processing", "profiling", "new technology"]
      },
      {
        title: "Enforcement and Penalties",
        excerpt: "SDAIA enforces the PDPL with fines up to SAR 5 million for violations of personal data protection standards, and up to SAR 3 million for technical violations. The NCA's Royal Decree M/117 (2024) establishes additional penalties for cybersecurity-related personal data failures.",
        keywords: ["pdpl penalties", "sar 5 million", "sdaia enforcement", "fines", "royal decree m/117", "violations"]
      }
    ],
    sources: [
      "Saudi Personal Data Protection Law (PDPL) \u2014 SDAIA 2021, enforced 2024",
      "SDAIA Implementing Regulations",
      "NCA Legal Powers (Royal Decree M/117, 2024)",
      "Saudi Arabia Cybersecurity Compliance Database (DJAC project reference)"
    ],
    updatedAt: "2026-03-16"
  },
  {
    slug: "china-mlps-2-detailed",
    title: "China Multi-Level Protection Scheme 2.0 (MLPS 2.0 / GB/T 22239-2019)",
    jurisdiction: "China",
    frameworkCodes: ["MLPS", "CSL"],
    summary: "MLPS 2.0 is China's foundational cybersecurity standard (effective December 2019), mandatory for all network operators. It classifies systems into five protection levels and prescribes technical and administrative controls for each level.",
    keyTopics: [
      "MLPS Level 1-5 classification and grading process",
      "Technical controls: physical, network, host, application, data",
      "Administrative controls: institutional, organizational, personnel, construction, operations",
      "Level 3 annual external assessment by licensed agency",
      "Level 4 semi-annual external assessment",
      "six-month log retention requirement",
      "supervised by MPS (Ministry of Public Security)",
      "registration with local MPS bureau"
    ],
    sections: [
      {
        title: "MLPS Grading (Levels 1-5)",
        excerpt: "Systems are classified into five levels based on potential harm to national security, social order, and public interests. Level 1 (lowest) applies to small systems; Level 5 (highest) covers national core systems. Most commercial organizations operate at Level 2 or Level 3.",
        keywords: ["mlps grading", "level 1", "level 2", "level 3", "level 4", "level 5", "classification", "grading criteria"]
      },
      {
        title: "Registration with MPS",
        excerpt: "Organizations must register their systems with the local MPS bureau after self-grading. Third-party expert assessment confirms the grade for Level 2+ systems. Registration certificates must be maintained and updated when systems change significantly.",
        keywords: ["mps registration", "local mps bureau", "expert assessment", "registration certificate", "system change"]
      },
      {
        title: "Physical and Environmental Security",
        excerpt: "Data centers and equipment rooms must implement physical access controls, environmental monitoring (temperature, humidity, power), fire protection, and anti-flooding measures. Physical access logs must be maintained.",
        keywords: ["physical security", "data center", "access control", "environmental monitoring", "power protection"]
      },
      {
        title: "Network and Communications Security",
        excerpt: "Boundary protection (firewalls, IDS/IPS), network segmentation, encrypted transmission for sensitive data, and traffic auditing are required. Unauthorized connections and rogue devices must be detected and blocked.",
        keywords: ["network security", "boundary protection", "segmentation", "encrypted transmission", "traffic auditing", "ids ips"]
      },
      {
        title: "Host and Device Security",
        excerpt: "Host-based controls include multi-factor authentication, role-based access control, intrusion detection, anti-malware, security logging, and secure configuration management. Remote access to hosts must use encrypted channels.",
        keywords: ["host security", "mfa", "rbac", "intrusion detection", "anti-malware", "security logging", "configurations"]
      },
      {
        title: "Application and Data Security",
        excerpt: "Applications must implement input validation, session management, secure coding practices, and permission management. Data at rest must be encrypted for sensitive/important data. Regular backups with tested restoration are mandatory.",
        keywords: ["application security", "input validation", "session management", "data encryption", "backup restore"]
      },
      {
        title: "Security Management \u2014 Institutional",
        excerpt: "Organizations must establish a cybersecurity management system including responsibilities, policies, management processes, and review mechanisms. Internal audit of cybersecurity management is required periodically.",
        keywords: ["security policy", "management system", "responsibilities", "internal audit", "management review"]
      },
      {
        title: "Security Management \u2014 Personnel",
        excerpt: "Background checks for staff with access to sensitive systems, mandatory cybersecurity training, confidentiality agreements, and controlled access revocation upon departure are all required.",
        keywords: ["personnel security", "background checks", "training", "confidentiality agreement", "access revocation"]
      },
      {
        title: "Security Management \u2014 Operations",
        excerpt: "Continuous monitoring, vulnerability management, patch deployment within defined SLAs, incident response procedures, and change management processes are required for daily operations. Security event logs must be retained for six months minimum.",
        keywords: ["security operations", "monitoring", "vulnerability management", "patch sla", "incident response", "change management", "six months logs"]
      },
      {
        title: "Level 3 Annual Assessment",
        excerpt: "Systems graded at Level 3 must undergo annual third-party security assessment by a qualified MLPS evaluation agency. Assessment results must be submitted to MPS. Non-conformities must be remediated within defined timelines.",
        keywords: ["level 3 assessment", "annual assessment", "third party evaluation", "mps submission", "non-conformity", "qualified agency"]
      },
      {
        title: "MLPS 2.0 vs. MLPS 1.0 Key Changes",
        excerpt: "MLPS 2.0 expanded scope to cover cloud computing, mobile internet, IoT, big data, and industrial control systems. It strengthened the role of MPS in enforcement and introduced clearer penalties aligned with the CSL.",
        keywords: ["mlps 2.0 changes", "cloud computing", "iot", "big data", "industrial control", "csl alignment"]
      }
    ],
    sources: [
      "GB/T 22239-2019 Multi-Level Protection Scheme (MLPS 2.0)",
      "China Cybersecurity Law (CSL) \u2014 Articles 21, 31",
      "MPS MLPS Administration Guidelines",
      "China Cybersecurity Compliance Database (DJAC project reference)"
    ],
    updatedAt: "2026-03-16"
  },
  {
    slug: "china-dsl-detailed",
    title: "China Data Security Law (DSL) \u2014 Compliance Guide",
    jurisdiction: "China",
    frameworkCodes: ["DSL", "CAC"],
    summary: "The DSL (effective September 1, 2021) establishes China's national data security management framework. It introduces data classification, important data identification, security obligations for data processors, and cross-border rules.",
    keyTopics: [
      "data classification into General / Important / Core tiers",
      "important data catalog and handler obligations",
      "annual important data security report",
      "cross-border transfer of important data requires CAC security assessment",
      "data security incident response",
      "data trading and transaction security platform",
      "national data security review mechanism"
    ],
    sections: [
      {
        title: "Data Classification Framework",
        excerpt: "The DSL establishes a three-tier data classification: General Data, Important Data, and Core Data. Each tier carries increasingly stringent protection requirements. Sectoral authorities define classification catalogs for their industries.",
        keywords: ["data classification", "general data", "important data", "core data", "classification tiers", "sectoral catalog"]
      },
      {
        title: "Important Data Obligations",
        excerpt: "Entities that handle 'important data' must designate a data security officer, maintain a data processing activity record, conduct regular security assessments, and submit annual security reports to their sectoral regulator.",
        keywords: ["important data", "data security officer", "processing records", "annual report", "risk assessment"]
      },
      {
        title: "Core Data Protection",
        excerpt: "Core data (relating to national security, economic security, or critical people's livelihoods) receives the highest protection level. Processing requires stricter oversight, and any export is generally prohibited without State approval.",
        keywords: ["core data", "national security", "economic security", "export prohibition", "state approval"]
      },
      {
        title: "Cross-Border Data Transfers",
        excerpt: "Important data cannot be transferred outside China without completing a CAC data security assessment. The assessment evaluates necessity, legality, impact on national security, and safeguards in the recipient country.",
        keywords: ["cross-border transfer", "important data export", "cac assessment", "data security assessment", "national security review"]
      },
      {
        title: "Data Security Management System",
        excerpt: "Organizations must establish an internal data security management system covering data classification, access controls, monitoring, incident response, and regular staff training on data security responsibilities.",
        keywords: ["data security management", "classification controls", "access controls", "staff training", "incident response"]
      },
      {
        title: "National Data Security Review",
        excerpt: "China's data security review mechanism allows authorities to review data activities that may affect national security. Activities subject to review cannot proceed until clearance is obtained.",
        keywords: ["national security review", "data activity review", "clearance", "cam review mechanism"]
      },
      {
        title: "Penalties for Non-Compliance",
        excerpt: "Violations can result in rectification orders, warnings, fines of up to RMB 10 million, suspension of services, revocation of business licenses, and criminal liability for responsible persons in severe cases.",
        keywords: ["dsl penalties", "rmb 10 million", "rectification", "license revocation", "criminal liability", "data security violations"]
      }
    ],
    sources: [
      "Data Security Law of the PRC (DSL) \u2014 effective September 1, 2021",
      "CAC Data Security Assessment Rules",
      "China Cybersecurity Compliance Database (DJAC project reference)"
    ],
    updatedAt: "2026-03-16"
  },
  {
    slug: "china-pipl-detailed",
    title: "China Personal Information Protection Law (PIPL) \u2014 Compliance Guide",
    jurisdiction: "China",
    frameworkCodes: ["PIPL", "CAC"],
    summary: "The PIPL (effective November 1, 2021) is China's comprehensive personal information privacy law, analogous to GDPR. It governs PI collection, processing, use, and cross-border transfer with strong consent and rights provisions.",
    keyTopics: [
      "lawful basis for PI processing (consent, contract, legal duty, public interest)",
      "separate consent for sensitive PI (health, biometric, finance, minors)",
      "data subject rights: access, copy, correct, delete, portability",
      "automated decision-making rules and opt-out rights",
      "cross-border PI transfer: CAC assessment / BCR / standard contracts",
      "personal information protection officer (PIPO) appointment",
      "personal information impact assessment (PIIA)",
      "liability: up to RMB 50 million or 5% of annual turnover"
    ],
    sections: [
      {
        title: "Scope and Extraterritorial Application",
        excerpt: "The PIPL applies to processing of personal information of individuals in China, even if the processor is outside China. Overseas processors serving the Chinese market must establish a local representative or dedicated agency.",
        keywords: ["pipl scope", "extraterritorial", "overseas processor", "local representative", "chinese market"]
      },
      {
        title: "Lawful Bases for PI Processing",
        excerpt: "The PIPL requires a lawful basis: individual consent (most common), necessity for contract performance, legal obligation, vital interests, public interest, or other bases specified by law. Consent must be specific, informed, voluntary, and unambiguous.",
        keywords: ["lawful basis", "consent", "contract necessity", "legal obligation", "voluntary consent", "informed consent"]
      },
      {
        title: "Sensitive Personal Information",
        excerpt: "Sensitive PI includes biometric data, religious beliefs, medical/health information, financial accounts, location tracking, and personal information of minors under 14. Processing requires explicit separate consent and is limited to 'specific purposes.'",
        keywords: ["sensitive pi", "biometric", "health information", "financial data", "minors under 14", "separate consent", "specific purpose"]
      },
      {
        title: "Individual Rights",
        excerpt: "Individuals have rights to: know and decide how their PI is processed; access and copy their PI; correct inaccurate data; delete data where basis no longer exists; portability of PI to other platforms; withdraw consent; restrict automated decisions.",
        keywords: ["individual rights", "right to access", "right to portability", "right to delete", "right to correct", "withdraw consent", "automated decisions"]
      },
      {
        title: "Automated Decision-Making",
        excerpt: "Entities using automated decision-making must ensure transparency, offer explanatory mechanisms, and allow individuals to opt out of automated decisions that significantly affect their interests. Personalized push of commercial information requires consent.",
        keywords: ["automated decisions", "transparency", "opt out", "explainability", "profiling", "personalized content"]
      },
      {
        title: "Cross-Border Personal Information Transfer",
        excerpt: "PI transfer outside China requires one of: CAC security assessment (mandatory for Critical Information Infrastructure Operators or large-scale transfers), CAC-approved standard contract, or CAC certification. Data subjects must be informed and give separate consent.",
        keywords: ["cross-border pi transfer", "cac security assessment", "standard contract", "cac certification", "separate consent", "ciio transfer"]
      },
      {
        title: "Personal Information Protection Impact Assessment (PIIA)",
        excerpt: "A PIIA is required before processing sensitive PI, automated decision-making affecting significant interests, providing PI to third parties, and overseas transfers. PIIA records must be kept for at least three years.",
        keywords: ["piia", "impact assessment", "sensitive pi assessment", "third party disclosure", "three year record"]
      },
      {
        title: "Personal Information Protection Officer (PIPO)",
        excerpt: "Processors handling PI above regulatory thresholds or processing sensitive PI must appoint a qualified PIPO. The PIPO oversees internal compliance, staff training, and acts as the principal contact for CAC enforcement queries.",
        keywords: ["pipo", "protection officer", "regulatory threshold", "internal compliance", "cac contact"]
      },
      {
        title: "Minors' Data Protection",
        excerpt: "Processing PI of minors under 14 requires explicit consent from their parents or guardians. Entities must establish dedicated protection rules and present minors-specific policies. Annual minors' data compliance reports are due by January 31 each year.",
        keywords: ["minors data", "under 14", "parental consent", "guardian consent", "annual report", "january 31"]
      },
      {
        title: "Penalties and Enforcement",
        excerpt: "Violations can result in fines up to RMB 50 million or 5% of annual turnover (whichever is higher), suspension of PI processing activities, revocation of operating licenses, and personal liability for executives including bans from industry positions.",
        keywords: ["pipl penalties", "rmb 50 million", "5 percent turnover", "license revocation", "executive liability", "industry ban"]
      }
    ],
    sources: [
      "Personal Information Protection Law of the PRC (PIPL) \u2014 effective November 1, 2021",
      "CAC Standard Contract for Cross-Border PI Transfer (2022)",
      "CAC Regulations on Network Data Security Management (2024/2025)",
      "China Cybersecurity Compliance Database (DJAC project reference)"
    ],
    updatedAt: "2026-03-16"
  },
  {
    slug: "china-csl-2026-amendments",
    title: "China CSL 2026 Amendments \u2014 Key Changes Effective January 1, 2026",
    jurisdiction: "China",
    frameworkCodes: ["CSL", "CAC"],
    summary: "The amended Cybersecurity Law takes effect January 1, 2026, introducing significantly higher penalties (up to 10% of annual revenue), expanded personal liability for executives, and stronger enforcement powers for the CAC.",
    keyTopics: [
      "penalty increase: up to 10% of annual turnover for serious violations",
      "personal executive liability: industry bans for responsible persons",
      "expanded CAC enforcement and investigative powers",
      "stricter obligations for critical information infrastructure operators",
      "enhanced minors' online protection requirements",
      "tighter vulnerability disclosure reporting timeline",
      "effective date: January 1, 2026"
    ],
    sections: [
      {
        title: "Major Penalty Increase",
        excerpt: "The 2026 amendments dramatically increased penalties for serious CSL violations. Organizations face fines up to 10% of annual turnover (up from fixed maximum amounts). This aligns CSL penalties with the PIPL framework.",
        keywords: ["penalty increase", "10 percent turnover", "serious violations", "csl 2026", "fine increase"]
      },
      {
        title: "Personal Liability for Executives",
        excerpt: "Responsible persons (executives, compliance officers) face personal fines and may be banned from serving in senior roles in the industry for periods up to 10 years following serious cybersecurity violations.",
        keywords: ["personal liability", "executive liability", "industry ban", "10 year ban", "responsible persons"]
      },
      {
        title: "Expanded CAC Powers",
        excerpt: "The CAC gains enhanced investigative authority including on-site inspections, data and system access orders, and the ability to impose business suspension on non-compliant organizations during investigations.",
        keywords: ["cac powers", "on-site inspection", "business suspension", "investigative authority", "system access order"]
      },
      {
        title: "CIIO Obligations Strengthened",
        excerpt: "Critical information infrastructure operators face stricter security review requirements for procurement, enhanced data localization enforcement, and mandatory security assessments before operational system changes.",
        keywords: ["ciio", "security review", "procurement review", "data localization enforcement", "pre-change assessment"]
      },
      {
        title: "Vulnerability Disclosure Tightened",
        excerpt: "Organizations must report discovered vulnerabilities to MIIT/CAC within 48 hours of discovery. Delayed or undisclosed vulnerabilities now attract significantly higher fines under the 2026 penalty schedule.",
        keywords: ["vulnerability disclosure", "48 hours", "miit reporting", "cac reporting", "vulnerability fines"]
      },
      {
        title: "Compliance Action Items for January 2026",
        excerpt: "Organizations must review existing penalty exposure calculations, update incident response escalation paths to meet tighter timelines, reassess executive accountability frameworks, and ensure vulnerability management processes meet the 48-hour reporting window.",
        keywords: ["csl 2026 compliance", "action items", "penalty exposure", "escalation update", "executive accountability", "vulnerability timeline"]
      }
    ],
    sources: [
      "Cybersecurity Law of the PRC (CSL) \u2014 2026 Amendments (effective January 1, 2026)",
      "CAC Announcement on CSL Amendment",
      "DJAC Cybersecurity Compliance Database Report (2026)"
    ],
    updatedAt: "2026-03-16"
  },
  {
    slug: "cross-border-china-saudi-checklist",
    title: "China\u2013Saudi Cross-Border Compliance Alignment Checklist",
    jurisdiction: "Cross-border",
    frameworkCodes: ["CSL", "DSL", "PIPL", "PDPL", "NCA"],
    summary: "A practical alignment view for organizations operating between China and Saudi Arabia, focusing on localization, transfer controls, security operations, and auditability.",
    keyTopics: [
      "cross-border transfer",
      "localization evidence",
      "vendor risk",
      "incident response",
      "audit trail"
    ],
    sections: [
      {
        title: "Localization and residency",
        excerpt: "Maintain explicit mapping of data residency commitments by jurisdiction and legal basis for any cross-border flows.",
        keywords: ["localization", "residency", "cross-border flows"]
      },
      {
        title: "Vendor due diligence",
        excerpt: "Evaluate suppliers against both legal stacks and maintain remediation evidence for gaps by severity.",
        keywords: ["vendor", "due diligence", "remediation"]
      },
      {
        title: "Operational assurance",
        excerpt: "Implement periodic control testing, logging, and readiness drills to show ongoing compliance posture.",
        keywords: ["logging", "readiness", "control testing"]
      }
    ],
    sources: ["DJAC comparative framework analysis"],
    updatedAt: "2026-03-16"
  }
];
function normalize(value) {
  return value.toLowerCase().trim();
}
function tokenize(value) {
  return normalize(value).split(/[^a-z0-9\u0600-\u06FF\u4E00-\u9FFF]+/).map((token) => token.trim()).filter((token) => token.length >= 2);
}
function scoreEntry(queryTokens, entry) {
  if (queryTokens.length === 0) {
    return {
      score: 1,
      matchedTopics: [],
      highlights: entry.sections.slice(0, 2).map((section) => ({
        title: section.title,
        excerpt: section.excerpt
      }))
    };
  }
  let score = 0;
  const matchedTopics = /* @__PURE__ */ new Set();
  const highlights = [];
  const title = normalize(entry.title);
  const summary = normalize(entry.summary);
  for (const token of queryTokens) {
    if (title.includes(token)) score += 8;
    if (summary.includes(token)) score += 5;
    if (entry.frameworkCodes.some((code) => normalize(code).includes(token))) score += 4;
    for (const topic of entry.keyTopics) {
      if (normalize(topic).includes(token)) {
        score += 3;
        matchedTopics.add(topic);
      }
    }
    for (const section of entry.sections) {
      const sectionText = normalize(
        `${section.title} ${section.excerpt} ${section.keywords.join(" ")}`
      );
      if (sectionText.includes(token)) {
        score += 2;
        if (highlights.length < 3) {
          highlights.push({
            title: section.title,
            excerpt: section.excerpt
          });
        }
      }
    }
  }
  return {
    score,
    matchedTopics: Array.from(matchedTopics),
    highlights
  };
}
function listLawKnowledge() {
  return LAW_KNOWLEDGE_BASE;
}
function getLawKnowledgeBySlug(slug) {
  const normalized = normalize(slug);
  return LAW_KNOWLEDGE_BASE.find((item) => normalize(item.slug) === normalized) ?? null;
}
function searchLawKnowledge(query, limit = 20) {
  const tokens = tokenize(query);
  const normalizedLimit = Math.max(1, Math.min(50, limit));
  return LAW_KNOWLEDGE_BASE.map((entry) => {
    const scored = scoreEntry(tokens, entry);
    return {
      slug: entry.slug,
      title: entry.title,
      jurisdiction: entry.jurisdiction,
      frameworkCodes: entry.frameworkCodes,
      summary: entry.summary,
      keyTopics: entry.keyTopics,
      matchedTopics: scored.matchedTopics,
      highlights: scored.highlights,
      score: scored.score
    };
  }).filter((item) => item.score > 0).sort((a, b) => b.score - a.score).slice(0, normalizedLimit);
}

// server/report-generator.ts
var LABELS = {
  en: {
    title: "DJAC Compliance Assessment Report",
    subtitle: "Multi-Jurisdictional Regulatory Compliance | Government-Ready",
    jurisdiction: "Jurisdiction",
    generated: "Generated",
    classification: "Classification",
    classificationValue: "CONFIDENTIAL \u2014 Audit Ready",
    preparedBy: "Prepared By",
    preparedByValue: "DJAC Automated Compliance Engine v1.0",
    execSummary: "Executive Summary",
    execSummaryIntro: "This report provides a comprehensive compliance assessment across the selected regulatory jurisdictions. It aggregates framework coverage, obligation timelines, cross-jurisdiction relationship analysis, and prioritised remediation guidance suitable for direct submission to government regulatory bodies.",
    keyStats: "Key Statistics",
    frameworksLabel: "Frameworks Covered",
    obligationsLabel: "Total Obligations",
    criticalObligationsLabel: "Critical Obligations",
    authoritiesLabel: "Governing Authorities",
    frameworkCoverage: "1. Regulatory Framework Coverage",
    saudiFrameworks: "1.1 Saudi Arabia",
    chinaFrameworks: "1.2 People's Republic of China",
    crossJurisdiction: "1.3 Cross-Jurisdiction Relationship Analysis",
    complianceStatus: "2. Compliance Status Matrix",
    compMatrix: "2.1 Framework Comparison Matrix",
    securitySection: "3. Security Metrics & Risk Assessment",
    penaltiesSection: "3.1 Maximum Penalty Exposure",
    cwTopics: "4. Cross-Jurisdiction Topic Analysis",
    oblSection: "5. Compliance Obligations & Deadlines",
    criticalHeader: "5.1 Critical & High-Priority Obligations",
    ongoingHeader: "5.2 Ongoing Standing Obligations",
    recommendations: "6. Recommendations & Remediation Guidance",
    appendixSection: "7. Appendix",
    appendixAuthorities: "A. Governing Authorities",
    appendixReferences: "B. Regulatory References",
    appendixMeta: "C. Report Metadata",
    reportId: "Report ID",
    generatedAt: "Generated At",
    engineVersion: "Engine Version",
    engineValue: "DJAC v1.0 \u2014 Multi-Jurisdictional Compliance Automation Engine",
    critical: "CRITICAL",
    high: "HIGH",
    medium: "MEDIUM",
    low: "LOW",
    framework: "Framework",
    country: "Country",
    requirement: "Requirement",
    frequency: "Frequency",
    risk: "Risk",
    authority: "Authority",
    topic: "Topic",
    saudi: "Saudi Arabia",
    china: "China",
    notes: "Notes",
    confidentialNotice: "\u26A0 CONFIDENTIAL \u2014 This document is intended solely for authorised audit and compliance review activities. Unauthorised distribution is prohibited.",
    pdfNote: "This report is formatted for direct submission to government regulatory bodies. The accompanying Markdown version is suitable for version-controlled documentation repositories."
  },
  ar: {
    title: "\u062A\u0642\u0631\u064A\u0631 \u062A\u0642\u064A\u064A\u0645 \u0627\u0644\u0627\u0645\u062A\u062B\u0627\u0644 \u2014 DJAC",
    subtitle: "\u0627\u0644\u0627\u0645\u062A\u062B\u0627\u0644 \u0627\u0644\u062A\u0646\u0638\u064A\u0645\u064A \u0645\u062A\u0639\u062F\u062F \u0627\u0644\u0648\u0644\u0627\u064A\u0627\u062A \u0627\u0644\u0642\u0636\u0627\u0626\u064A\u0629 | \u062C\u0627\u0647\u0632 \u0644\u0644\u062C\u0647\u0627\u062A \u0627\u0644\u062D\u0643\u0648\u0645\u064A\u0629",
    jurisdiction: "\u0627\u0644\u0648\u0644\u0627\u064A\u0629 \u0627\u0644\u0642\u0636\u0627\u0626\u064A\u0629",
    generated: "\u062A\u0627\u0631\u064A\u062E \u0627\u0644\u0625\u0635\u062F\u0627\u0631",
    classification: "\u0627\u0644\u062A\u0635\u0646\u064A\u0641",
    classificationValue: "\u0633\u0631\u064A \u0648\u062E\u0627\u0636\u0639 \u0644\u0644\u062A\u062F\u0642\u064A\u0642",
    preparedBy: "\u0623\u0639\u062F\u0651\u0647",
    preparedByValue: "\u0645\u062D\u0631\u0643 \u0627\u0644\u0627\u0645\u062A\u062B\u0627\u0644 \u0627\u0644\u0622\u0644\u064A DJAC \u2014 \u0627\u0644\u0625\u0635\u062F\u0627\u0631 1.0",
    execSummary: "\u0627\u0644\u0645\u0644\u062E\u0635 \u0627\u0644\u062A\u0646\u0641\u064A\u0630\u064A",
    execSummaryIntro: "\u064A\u064F\u0642\u062F\u0651\u0645 \u0647\u0630\u0627 \u0627\u0644\u062A\u0642\u0631\u064A\u0631 \u062A\u0642\u064A\u064A\u0645\u0627\u064B \u0634\u0627\u0645\u0644\u0627\u064B \u0644\u0644\u0627\u0645\u062A\u062B\u0627\u0644 \u0639\u0628\u0631 \u0627\u0644\u0627\u062E\u062A\u0635\u0627\u0635\u0627\u062A \u0627\u0644\u0642\u0636\u0627\u0626\u064A\u0629 \u0627\u0644\u062A\u0646\u0638\u064A\u0645\u064A\u0629 \u0627\u0644\u0645\u062D\u062F\u062F\u0629\u060C \u0648\u064A\u062C\u0645\u0639 \u0628\u064A\u0646 \u062A\u063A\u0637\u064A\u0629 \u0627\u0644\u0623\u0637\u0631 \u0627\u0644\u062A\u0646\u0638\u064A\u0645\u064A\u0629 \u0648\u0627\u0644\u062C\u062F\u0627\u0648\u0644 \u0627\u0644\u0632\u0645\u0646\u064A\u0629 \u0644\u0644\u0627\u0644\u062A\u0632\u0627\u0645\u0627\u062A \u0648\u062A\u062D\u0644\u064A\u0644 \u0627\u0644\u0639\u0644\u0627\u0642\u0627\u062A \u0639\u0628\u0631 \u0627\u0644\u0627\u062E\u062A\u0635\u0627\u0635\u0627\u062A \u0627\u0644\u0642\u0636\u0627\u0626\u064A\u0629 \u0648\u0627\u0644\u062A\u0648\u062C\u064A\u0647\u0627\u062A \u0627\u0644\u0639\u0644\u0627\u062C\u064A\u0629 \u0630\u0627\u062A \u0627\u0644\u0623\u0648\u0644\u0648\u064A\u0629 \u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0629 \u0644\u0644\u062A\u0642\u062F\u064A\u0645 \u0627\u0644\u0645\u0628\u0627\u0634\u0631 \u0625\u0644\u0649 \u0627\u0644\u062C\u0647\u0627\u062A \u0627\u0644\u062D\u0643\u0648\u0645\u064A\u0629.",
    keyStats: "\u0627\u0644\u0625\u062D\u0635\u0627\u0626\u064A\u0627\u062A \u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629",
    frameworksLabel: "\u0627\u0644\u0623\u0637\u0631 \u0627\u0644\u0645\u0634\u0645\u0648\u0644\u0629",
    obligationsLabel: "\u0625\u062C\u0645\u0627\u0644\u064A \u0627\u0644\u0627\u0644\u062A\u0632\u0627\u0645\u0627\u062A",
    criticalObligationsLabel: "\u0627\u0644\u0627\u0644\u062A\u0632\u0627\u0645\u0627\u062A \u0627\u0644\u062D\u0631\u062C\u0629",
    authoritiesLabel: "\u0627\u0644\u0647\u064A\u0626\u0627\u062A \u0627\u0644\u062A\u0646\u0638\u064A\u0645\u064A\u0629",
    frameworkCoverage: "1. \u062A\u063A\u0637\u064A\u0629 \u0627\u0644\u0625\u0637\u0627\u0631 \u0627\u0644\u062A\u0646\u0638\u064A\u0645\u064A",
    saudiFrameworks: "1.1 \u0627\u0644\u0645\u0645\u0644\u0643\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629 \u0627\u0644\u0633\u0639\u0648\u062F\u064A\u0629",
    chinaFrameworks: "1.2 \u062C\u0645\u0647\u0648\u0631\u064A\u0629 \u0627\u0644\u0635\u064A\u0646 \u0627\u0644\u0634\u0639\u0628\u064A\u0629",
    crossJurisdiction: "1.3 \u062A\u062D\u0644\u064A\u0644 \u0627\u0644\u0639\u0644\u0627\u0642\u0627\u062A \u0639\u0628\u0631 \u0627\u0644\u0627\u062E\u062A\u0635\u0627\u0635\u0627\u062A \u0627\u0644\u0642\u0636\u0627\u0626\u064A\u0629",
    complianceStatus: "2. \u0645\u0635\u0641\u0648\u0641\u0629 \u062D\u0627\u0644\u0629 \u0627\u0644\u0627\u0645\u062A\u062B\u0627\u0644",
    compMatrix: "2.1 \u0645\u0635\u0641\u0648\u0641\u0629 \u0645\u0642\u0627\u0631\u0646\u0629 \u0627\u0644\u0623\u0637\u0631",
    securitySection: "3. \u0645\u0642\u0627\u064A\u064A\u0633 \u0627\u0644\u0623\u0645\u0646 \u0648\u062A\u0642\u064A\u064A\u0645 \u0627\u0644\u0645\u062E\u0627\u0637\u0631",
    penaltiesSection: "3.1 \u0627\u0644\u062D\u062F \u0627\u0644\u0623\u0642\u0635\u0649 \u0644\u0645\u062E\u0627\u0637\u0631 \u0627\u0644\u0639\u0642\u0648\u0628\u0627\u062A",
    cwTopics: "4. \u062A\u062D\u0644\u064A\u0644 \u0627\u0644\u0645\u0648\u0627\u0636\u064A\u0639 \u0639\u0628\u0631 \u0627\u0644\u0627\u062E\u062A\u0635\u0627\u0635\u0627\u062A \u0627\u0644\u0642\u0636\u0627\u0626\u064A\u0629",
    oblSection: "5. \u0627\u0644\u0627\u0644\u062A\u0632\u0627\u0645\u0627\u062A \u0627\u0644\u062A\u0646\u0638\u064A\u0645\u064A\u0629 \u0648\u0627\u0644\u0645\u0648\u0627\u0639\u064A\u062F \u0627\u0644\u0646\u0647\u0627\u0626\u064A\u0629",
    criticalHeader: "5.1 \u0627\u0644\u0627\u0644\u062A\u0632\u0627\u0645\u0627\u062A \u0627\u0644\u062D\u0631\u062C\u0629 \u0648\u0639\u0627\u0644\u064A\u0629 \u0627\u0644\u0623\u0648\u0644\u0648\u064A\u0629",
    ongoingHeader: "5.2 \u0627\u0644\u0627\u0644\u062A\u0632\u0627\u0645\u0627\u062A \u0627\u0644\u062F\u0627\u0626\u0645\u0629 \u0648\u0627\u0644\u0645\u0633\u062A\u0645\u0631\u0629",
    recommendations: "6. \u0627\u0644\u062A\u0648\u0635\u064A\u0627\u062A \u0648\u062A\u0648\u062C\u064A\u0647\u0627\u062A \u0627\u0644\u0625\u0635\u0644\u0627\u062D",
    appendixSection: "7. \u0627\u0644\u0645\u0644\u062D\u0642",
    appendixAuthorities: "\u0623. \u0627\u0644\u0647\u064A\u0626\u0627\u062A \u0627\u0644\u062A\u0646\u0638\u064A\u0645\u064A\u0629",
    appendixReferences: "\u0628. \u0627\u0644\u0645\u0631\u0627\u062C\u0639 \u0627\u0644\u062A\u0646\u0638\u064A\u0645\u064A\u0629",
    appendixMeta: "\u062C. \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u062A\u0642\u0631\u064A\u0631",
    reportId: "\u0645\u0639\u0631\u0651\u0641 \u0627\u0644\u062A\u0642\u0631\u064A\u0631",
    generatedAt: "\u0648\u0642\u062A \u0627\u0644\u0625\u0646\u0634\u0627\u0621",
    engineVersion: "\u0625\u0635\u062F\u0627\u0631 \u0627\u0644\u0645\u062D\u0631\u0643",
    engineValue: "DJAC \u0627\u0644\u0625\u0635\u062F\u0627\u0631 1.0 \u2014 \u0645\u062D\u0631\u0643 \u0623\u062A\u0645\u062A\u0629 \u0627\u0644\u0627\u0645\u062A\u062B\u0627\u0644 \u0645\u062A\u0639\u062F\u062F \u0627\u0644\u0627\u062E\u062A\u0635\u0627\u0635\u0627\u062A",
    critical: "\u062D\u0631\u062C",
    high: "\u0645\u0631\u062A\u0641\u0639",
    medium: "\u0645\u062A\u0648\u0633\u0637",
    low: "\u0645\u0646\u062E\u0641\u0636",
    framework: "\u0627\u0644\u0625\u0637\u0627\u0631",
    country: "\u0627\u0644\u062F\u0648\u0644\u0629",
    requirement: "\u0627\u0644\u0645\u062A\u0637\u0644\u0628",
    frequency: "\u0627\u0644\u062A\u0643\u0631\u0627\u0631",
    risk: "\u0627\u0644\u0645\u062E\u0627\u0637\u0631",
    authority: "\u0627\u0644\u062C\u0647\u0629 \u0627\u0644\u0645\u062E\u062A\u0635\u0629",
    topic: "\u0627\u0644\u0645\u0648\u0636\u0648\u0639",
    saudi: "\u0627\u0644\u0645\u0645\u0644\u0643\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629 \u0627\u0644\u0633\u0639\u0648\u062F\u064A\u0629",
    china: "\u0627\u0644\u0635\u064A\u0646",
    notes: "\u0645\u0644\u0627\u062D\u0638\u0627\u062A",
    confidentialNotice: "\u26A0 \u0633\u0631\u064A \u2014 \u0647\u0630\u0647 \u0627\u0644\u0648\u062B\u064A\u0642\u0629 \u0645\u062E\u0635\u0635\u0629 \u062D\u0635\u0631\u064A\u0627\u064B \u0644\u0623\u0646\u0634\u0637\u0629 \u0627\u0644\u062A\u062F\u0642\u064A\u0642 \u0648\u0645\u0631\u0627\u062C\u0639\u0629 \u0627\u0644\u0627\u0645\u062A\u062B\u0627\u0644 \u0627\u0644\u0645\u0639\u062A\u0645\u062F\u0629. \u064A\u064F\u062D\u0638\u0631 \u062A\u0648\u0632\u064A\u0639\u0647\u0627 \u062F\u0648\u0646 \u0625\u0630\u0646.",
    pdfNote: "\u0647\u0630\u0627 \u0627\u0644\u062A\u0642\u0631\u064A\u0631 \u0645\u0646\u0633\u0651\u0642 \u0644\u0644\u062A\u0642\u062F\u064A\u0645 \u0627\u0644\u0645\u0628\u0627\u0634\u0631 \u0625\u0644\u0649 \u0627\u0644\u062C\u0647\u0627\u062A \u0627\u0644\u062A\u0646\u0638\u064A\u0645\u064A\u0629 \u0627\u0644\u062D\u0643\u0648\u0645\u064A\u0629. \u0646\u0633\u062E\u0629 Markdown \u0627\u0644\u0645\u0631\u0641\u0642\u0629 \u0645\u0646\u0627\u0633\u0628\u0629 \u0644\u0645\u0633\u062A\u0648\u062F\u0639\u0627\u062A \u0627\u0644\u062A\u0648\u062B\u064A\u0642 \u0627\u0644\u062E\u0627\u0636\u0639\u0629 \u0644\u0644\u062A\u062D\u0643\u0645 \u0628\u0627\u0644\u0625\u0635\u062F\u0627\u0631\u0627\u062A."
  },
  zh: {
    title: "DJAC \u5408\u89C4\u8BC4\u4F30\u62A5\u544A",
    subtitle: "\u591A\u53F8\u6CD5\u7BA1\u8F96\u533A\u76D1\u7BA1\u5408\u89C4 | \u653F\u5E9C\u62A5\u9001\u5C31\u7EEA",
    jurisdiction: "\u53F8\u6CD5\u7BA1\u8F96\u533A",
    generated: "\u751F\u6210\u65E5\u671F",
    classification: "\u4FDD\u5BC6\u7EA7\u522B",
    classificationValue: "\u4FDD\u5BC6 \u2014 \u5DF2\u5907\u5BA1",
    preparedBy: "\u7F16\u5236\u5355\u4F4D",
    preparedByValue: "DJAC \u81EA\u52A8\u5316\u5408\u89C4\u5F15\u64CE v1.0",
    execSummary: "\u6267\u884C\u6458\u8981",
    execSummaryIntro: "\u672C\u62A5\u544A\u5BF9\u6240\u9009\u76D1\u7BA1\u53F8\u6CD5\u7BA1\u8F96\u533A\u8FDB\u884C\u5168\u9762\u5408\u89C4\u8BC4\u4F30\uFF0C\u6C47\u603B\u76D1\u7BA1\u6846\u67B6\u8986\u76D6\u8303\u56F4\u3001\u5408\u89C4\u4E49\u52A1\u65F6\u95F4\u8868\u3001\u8DE8\u53F8\u6CD5\u7BA1\u8F96\u533A\u5173\u7CFB\u5206\u6790\u53CA\u4F18\u5148\u6574\u6539\u6307\u5BFC\u610F\u89C1\uFF0C\u9002\u5408\u76F4\u63A5\u63D0\u4EA4\u653F\u5E9C\u76D1\u7BA1\u673A\u6784\u3002",
    keyStats: "\u5173\u952E\u7EDF\u8BA1\u6570\u636E",
    frameworksLabel: "\u8986\u76D6\u6846\u67B6\u6570",
    obligationsLabel: "\u5408\u89C4\u4E49\u52A1\u603B\u6570",
    criticalObligationsLabel: "\u5173\u952E\u4E49\u52A1\u6570",
    authoritiesLabel: "\u4E3B\u7BA1\u673A\u6784",
    frameworkCoverage: "\u4E00\u3001\u76D1\u7BA1\u6846\u67B6\u8986\u76D6\u8303\u56F4",
    saudiFrameworks: "1.1 \u6C99\u7279\u963F\u62C9\u4F2F",
    chinaFrameworks: "1.2 \u4E2D\u534E\u4EBA\u6C11\u5171\u548C\u56FD",
    crossJurisdiction: "1.3 \u8DE8\u53F8\u6CD5\u7BA1\u8F96\u533A\u5173\u7CFB\u5206\u6790",
    complianceStatus: "\u4E8C\u3001\u5408\u89C4\u72B6\u6001\u77E9\u9635",
    compMatrix: "2.1 \u6846\u67B6\u5BF9\u6BD4\u77E9\u9635",
    securitySection: "\u4E09\u3001\u5B89\u5168\u6307\u6807\u4E0E\u98CE\u9669\u8BC4\u4F30",
    penaltiesSection: "3.1 \u6700\u9AD8\u5904\u7F5A\u98CE\u9669\u655E\u53E3",
    cwTopics: "\u56DB\u3001\u8DE8\u53F8\u6CD5\u7BA1\u8F96\u533A\u4E13\u9898\u5206\u6790",
    oblSection: "\u4E94\u3001\u5408\u89C4\u4E49\u52A1\u4E0E\u622A\u6B62\u65E5\u671F",
    criticalHeader: "5.1 \u5173\u952E\u53CA\u9AD8\u4F18\u5148\u7EA7\u4E49\u52A1",
    ongoingHeader: "5.2 \u6301\u7EED\u6027\u5E38\u6001\u4E49\u52A1",
    recommendations: "\u516D\u3001\u5EFA\u8BAE\u4E0E\u6574\u6539\u6307\u5357",
    appendixSection: "\u4E03\u3001\u9644\u5F55",
    appendixAuthorities: "\u9644\u5F55A\uFF1A\u4E3B\u7BA1\u673A\u6784",
    appendixReferences: "\u9644\u5F55B\uFF1A\u6CD5\u89C4\u53C2\u8003",
    appendixMeta: "\u9644\u5F55C\uFF1A\u62A5\u544A\u5143\u6570\u636E",
    reportId: "\u62A5\u544A\u7F16\u53F7",
    generatedAt: "\u751F\u6210\u65F6\u95F4",
    engineVersion: "\u5F15\u64CE\u7248\u672C",
    engineValue: "DJAC v1.0 \u2014 \u591A\u53F8\u6CD5\u7BA1\u8F96\u533A\u5408\u89C4\u81EA\u52A8\u5316\u5F15\u64CE",
    critical: "\u7D27\u6025",
    high: "\u9AD8",
    medium: "\u4E2D",
    low: "\u4F4E",
    framework: "\u6846\u67B6",
    country: "\u56FD\u5BB6/\u5730\u533A",
    requirement: "\u5408\u89C4\u8981\u6C42",
    frequency: "\u9891\u7387",
    risk: "\u98CE\u9669",
    authority: "\u4E3B\u7BA1\u673A\u6784",
    topic: "\u4E3B\u9898",
    saudi: "\u6C99\u7279\u963F\u62C9\u4F2F",
    china: "\u4E2D\u56FD",
    notes: "\u5907\u6CE8",
    confidentialNotice: "\u26A0 \u4FDD\u5BC6 \u2014 \u672C\u6587\u4EF6\u4EC5\u4F9B\u6388\u6743\u5BA1\u8BA1\u53CA\u5408\u89C4\u5BA1\u67E5\u6D3B\u52A8\u4F7F\u7528\u3002\u672A\u7ECF\u6388\u6743\u4E0D\u5F97\u5206\u53D1\u3002",
    pdfNote: "\u672C\u62A5\u544A\u5DF2\u683C\u5F0F\u5316\uFF0C\u53EF\u76F4\u63A5\u63D0\u4EA4\u653F\u5E9C\u76D1\u7BA1\u673A\u6784\u3002\u968F\u9644\u7684 Markdown \u7248\u672C\u9002\u7528\u4E8E\u7248\u672C\u63A7\u5236\u6587\u6863\u7BA1\u7406\u7CFB\u7EDF\u3002"
  }
};
function lbl(locale, key) {
  return LABELS[locale]?.[key] ?? LABELS.en[key] ?? key;
}
function hr() {
  return "\n\n---\n\n";
}
function badge(locale, sev) {
  const m = {
    critical: lbl(locale, "critical"),
    high: lbl(locale, "high"),
    medium: lbl(locale, "medium"),
    low: lbl(locale, "low")
  };
  return m[sev.toLowerCase()] ?? sev;
}
function saudiFrameworkBlock(locale) {
  return `| ${lbl(locale, "framework")} | ${lbl(locale, "authority")} | Max Penalty | Effective |
|---|---|---|---|
| **PDPL** \u2014 Personal Data Protection Law | SDAIA | SAR 5,000,000 | Sep 2023 |
| **NCA-ECC** \u2014 Essential Cybersecurity Controls | NCA | License revocation | 2018 (rev. 2021) |
| **NCA-CCC** \u2014 Cloud Cybersecurity Controls | NCA | Service suspension | 2020 |
`;
}
function chinaFrameworkBlock(locale) {
  return `| ${lbl(locale, "framework")} | ${lbl(locale, "authority")} | Max Penalty | Effective |
|---|---|---|---|
| **PIPL** \u2014 Personal Information Protection Law | CAC (NISA) | RMB 50M or 5% global revenue | Nov 2021 |
| **CSL** \u2014 Cybersecurity Law | CAC / MIIT | RMB 1,000,000 | Jun 2017 |
| **DSL** \u2014 Data Security Law | NPC / MIIT | RMB 10,000,000 | Sep 2021 |
| **MLPS 2.0** \u2014 Multi-Level Protection Scheme | MPS / MIIT | RMB 500,000 + criminal | Dec 2019 |
`;
}
function buildRecommendations(locale) {
  const recs = {
    en: [
      "**Immediate** \u2014 Appoint a Data Protection Officer (DPO) covering PDPL (Saudi) and PIPL (China) requirements; both regimes mandate this role explicitly.",
      "**30 days** \u2014 Complete cross-border data transfer impact assessments for all regulated data categories (personal, sensitive, critical).",
      "**60 days** \u2014 Achieve ISO 27001 baseline certification or equivalent evidence to satisfy NCA-ECC, CSL, and MLPS 2.0 prerequisites.",
      "**90 days** \u2014 Submit NCA ECC self-assessment to the National Cybersecurity Authority. Retain MLPS 2.0 third-party assessment evidence for CAC review.",
      "**Ongoing** \u2014 Maintain incident response procedures meeting 72-hour PDPL notification requirements and 24-hour PIPL critical-incident timelines.",
      "**Ongoing** \u2014 Maintain jurisdiction-specific evidence packs ready for SDAIA, NCA, and CAC regulatory examinations.",
      "**Annual** \u2014 Conduct formal internal cybersecurity audits aligned to NCA-ECC controls and CSL graded-protection requirements."
    ],
    ar: [
      "**\u0641\u0648\u0631\u064A** \u2014 \u062A\u0639\u064A\u064A\u0646 \u0645\u0633\u0624\u0648\u0644 \u062D\u0645\u0627\u064A\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A (DPO) \u0644\u064A\u063A\u0637\u064A \u0627\u0644\u062A\u0632\u0627\u0645\u0627\u062A \u0646\u0638\u0627\u0645 PDPL \u0627\u0644\u0633\u0639\u0648\u062F\u064A \u0648PIPL \u0627\u0644\u0635\u064A\u0646\u064A \u2014 \u0645\u0637\u0644\u0648\u0628 \u0635\u0631\u0627\u062D\u0629\u064B \u0645\u0646 \u0643\u0644\u0627 \u0627\u0644\u0646\u0638\u0627\u0645\u064A\u0646.",
      "**\u062E\u0644\u0627\u0644 30 \u064A\u0648\u0645\u0627\u064B** \u2014 \u0625\u062A\u0645\u0627\u0645 \u062A\u0642\u064A\u064A\u0645\u0627\u062A \u0623\u062B\u0631 \u0646\u0642\u0644 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0639\u0628\u0631 \u0627\u0644\u062D\u062F\u0648\u062F \u0644\u062C\u0645\u064A\u0639 \u0627\u0644\u0641\u0626\u0627\u062A \u0627\u0644\u0645\u0646\u0638\u0645\u0629 (\u0627\u0644\u0634\u062E\u0635\u064A\u0629 \u0648\u0627\u0644\u062D\u0633\u0627\u0633\u0629 \u0648\u0627\u0644\u062D\u064A\u0648\u064A\u0629).",
      "**\u062E\u0644\u0627\u0644 60 \u064A\u0648\u0645\u0627\u064B** \u2014 \u0627\u0644\u062D\u0635\u0648\u0644 \u0639\u0644\u0649 \u0634\u0647\u0627\u062F\u0629 ISO 27001 \u0627\u0644\u0623\u0633\u0627\u0633\u064A\u0629 \u0623\u0648 \u0645\u0627 \u064A\u0639\u0627\u062F\u0644\u0647\u0627 \u0644\u0627\u0633\u062A\u064A\u0641\u0627\u0621 \u0645\u062A\u0637\u0644\u0628\u0627\u062A NCA-ECC \u0648CSL \u0648MLPS 2.0.",
      "**\u062E\u0644\u0627\u0644 90 \u064A\u0648\u0645\u0627\u064B** \u2014 \u062A\u0642\u062F\u064A\u0645 \u0627\u0644\u062A\u0642\u064A\u064A\u0645 \u0627\u0644\u0630\u0627\u062A\u064A \u0644\u0640 NCA ECC \u0625\u0644\u0649 \u0627\u0644\u0647\u064A\u0626\u0629 \u0627\u0644\u0648\u0637\u0646\u064A\u0629 \u0644\u0644\u0623\u0645\u0646 \u0627\u0644\u0633\u064A\u0628\u0631\u0627\u0646\u064A\u060C \u0648\u0627\u0644\u0627\u062D\u062A\u0641\u0627\u0638 \u0628\u0623\u062F\u0644\u0629 \u0627\u0644\u062A\u0642\u064A\u064A\u0645 \u0627\u0644\u0645\u0633\u062A\u0642\u0644 \u0644\u0640 MLPS 2.0 \u0644\u0645\u0631\u0627\u062C\u0639\u0629 CAC.",
      "**\u0645\u0633\u062A\u0645\u0631** \u2014 \u0627\u0644\u062D\u0641\u0627\u0638 \u0639\u0644\u0649 \u0625\u062C\u0631\u0627\u0621\u0627\u062A \u0627\u0644\u0627\u0633\u062A\u062C\u0627\u0628\u0629 \u0644\u0644\u062D\u0648\u0627\u062F\u062B \u0627\u0644\u062A\u064A \u062A\u0633\u062A\u0648\u0641\u064A \u0645\u062A\u0637\u0644\u0628\u0627\u062A \u0627\u0644\u0625\u062E\u0637\u0627\u0631 \u0641\u064A \u063A\u0636\u0648\u0646 72 \u0633\u0627\u0639\u0629 \u0648\u0641\u0642 PDPL \u0648\u062E\u0644\u0627\u0644 24 \u0633\u0627\u0639\u0629 \u0644\u0644\u062D\u0648\u0627\u062F\u062B \u0627\u0644\u062D\u0631\u062C\u0629 \u0648\u0641\u0642 PIPL.",
      "**\u0645\u0633\u062A\u0645\u0631** \u2014 \u0627\u0644\u0627\u062D\u062A\u0641\u0627\u0638 \u0628\u062D\u0632\u0645 \u0623\u062F\u0644\u0629 \u062E\u0627\u0635\u0629 \u0628\u0643\u0644 \u0627\u062E\u062A\u0635\u0627\u0635 \u0642\u0636\u0627\u0626\u064A \u062C\u0627\u0647\u0632\u0629 \u0644\u0641\u062D\u0648\u0635\u0627\u062A \u062C\u0647\u0627\u062A SDAIA \u0648NCA \u0648CAC.",
      "**\u0633\u0646\u0648\u064A** \u2014 \u0625\u062C\u0631\u0627\u0621 \u0639\u0645\u0644\u064A\u0627\u062A \u062A\u062F\u0642\u064A\u0642 \u062F\u0627\u062E\u0644\u064A\u0629 \u0631\u0633\u0645\u064A\u0629 \u0644\u0623\u0645\u0646 \u0627\u0644\u0645\u0639\u0644\u0648\u0645\u0627\u062A \u0637\u0628\u0642\u0627\u064B \u0644\u0636\u0648\u0627\u0628\u0637 NCA-ECC \u0648\u0645\u062A\u0637\u0644\u0628\u0627\u062A \u0627\u0644\u062D\u0645\u0627\u064A\u0629 \u0627\u0644\u0645\u062A\u062F\u0631\u062C\u0629 \u0628\u0645\u0648\u062C\u0628 CSL."
    ],
    zh: [
      "**\u7ACB\u5373** \u2014 \u4EFB\u547D\u6570\u636E\u4FDD\u62A4\u5B98\uFF08DPO\uFF09\uFF0C\u540C\u65F6\u8986\u76D6\u6C99\u7279PDPL\u548C\u4E2D\u56FDPIPL\u5408\u89C4\u4E49\u52A1\u2014\u2014\u4E24\u9879\u76D1\u7BA1\u4F53\u7CFB\u5747\u660E\u786E\u8981\u6C42\u8BBE\u7ACB\u8BE5\u89D2\u8272\u3002",
      "**30\u5929\u5185** \u2014 \u5B8C\u6210\u6240\u6709\u53D7\u76D1\u7BA1\u6570\u636E\u7C7B\u522B\uFF08\u4E2A\u4EBA\u3001\u654F\u611F\u53CA\u5173\u952E\u6570\u636E\uFF09\u7684\u8DE8\u5883\u6570\u636E\u4F20\u8F93\u5F71\u54CD\u8BC4\u4F30\u3002",
      "**60\u5929\u5185** \u2014 \u53D6\u5F97ISO 27001\u57FA\u7840\u8BA4\u8BC1\u6216\u7B49\u6548\u8BC1\u636E\uFF0C\u6EE1\u8DB3NCA-ECC\u3001CSL\u548CMLPS 2.0\u7684\u524D\u63D0\u6761\u4EF6\u3002",
      "**90\u5929\u5185** \u2014 \u5411\u6C99\u7279NCA\u63D0\u4EA4ECC\u81EA\u8BC4\u4F30\u62A5\u544A\uFF1B\u4E3ACAC\u5408\u89C4\u5BA1\u67E5\u4FDD\u7559MLPS 2.0\u7B2C\u4E09\u65B9\u8BC4\u4F30\u8BC1\u636E\u3002",
      "**\u6301\u7EED** \u2014 \u5EFA\u7ACB\u5E76\u7EF4\u62A4\u7B26\u5408PDPL 72\u5C0F\u65F6\u901A\u62A5\u8981\u6C42\u548CPIPL\u5173\u952E\u4E8B\u4EF624\u5C0F\u65F6\u901A\u62A5\u65F6\u9650\u7684\u4E8B\u4EF6\u54CD\u5E94\u7A0B\u5E8F\u3002",
      "**\u6301\u7EED** \u2014 \u9488\u5BF9SDAIA\u3001NCA\u548CCAC\u76D1\u7BA1\u68C0\u67E5\uFF0C\u4FDD\u5B58\u5404\u53F8\u6CD5\u7BA1\u8F96\u533A\u4E13\u9879\u8BC1\u636E\u5305\u5E76\u4FDD\u6301\u968F\u65F6\u53EF\u7528\u72B6\u6001\u3002",
      "**\u6BCF\u5E74** \u2014 \u6309NCA-ECC\u63A7\u5236\u8981\u6C42\u53CACSL\u5206\u7EA7\u4FDD\u62A4\u89C4\u5B9A\uFF0C\u5F00\u5C55\u6B63\u5F0F\u5185\u90E8\u4FE1\u606F\u5B89\u5168\u5BA1\u8BA1\u3002"
    ]
  };
  return recs[locale].map((r, i) => `${i + 1}. ${r}`).join("\n\n");
}
function generateComplianceReport(opts) {
  const { locale, jurisdiction, reportType = "full_compliance" } = opts;
  const now = /* @__PURE__ */ new Date();
  const reportId = `DJAC-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const allObligations = listComplianceObligations();
  const compTable = getComparisonTable();
  const laws = listLawKnowledge();
  const includeSaudi = jurisdiction !== "China";
  const includeChina = jurisdiction !== "Saudi Arabia";
  const includeBoth = jurisdiction === "both";
  const filtered = jurisdiction === "Saudi Arabia" ? allObligations.filter((o) => o.country === "Saudi Arabia") : jurisdiction === "China" ? allObligations.filter((o) => o.country === "China") : allObligations;
  const criticalCount = filtered.filter((o) => o.riskLevel === "critical").length;
  const highCount = filtered.filter((o) => o.riskLevel === "high").length;
  const gapCount = criticalCount + highCount;
  const frameworksCovered = includeBoth ? 7 : includeSaudi ? 3 : 4;
  const scoreFormula = (obligations) => {
    const crit = obligations.filter((o) => o.riskLevel === "critical").length;
    const high = obligations.filter((o) => o.riskLevel === "high").length;
    return Math.max(45, Math.min(95, Math.round(100 - crit * 5 - high * 2)));
  };
  const overallScore = scoreFormula(filtered);
  const saudiObls = allObligations.filter((o) => o.country === "Saudi Arabia");
  const chinaObls = allObligations.filter((o) => o.country === "China");
  const saudiScore = includeSaudi ? scoreFormula(saudiObls) : null;
  const chinaScore = includeChina ? scoreFormula(chinaObls) : null;
  const reportVersion = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, "0")}.0`;
  const scorecardSummary = {
    overallScore,
    saudiScore,
    chinaScore,
    gapCount,
    criticalFindings: criticalCount,
    frameworksCovered,
    obligationsCovered: filtered.length,
    reportVersion
  };
  const REPORT_TYPE_TEMPLATES = {
    full_compliance: { titleSuffix: { en: "Full Compliance Assessment", ar: "\u062A\u0642\u064A\u064A\u0645 \u0627\u0644\u0627\u0645\u062A\u062B\u0627\u0644 \u0627\u0644\u0643\u0627\u0645\u0644", zh: "\u5168\u9762\u5408\u89C4\u8BC4\u4F30" }, templateName: "Full Compliance Template" },
    gap_analysis: { titleSuffix: { en: "Gap Analysis Report", ar: "\u062A\u0642\u0631\u064A\u0631 \u062A\u062D\u0644\u064A\u0644 \u0627\u0644\u0641\u062C\u0648\u0627\u062A", zh: "\u5DEE\u8DDD\u5206\u6790\u62A5\u544A" }, templateName: "Gap Analysis Template" },
    vendor_assessment: { titleSuffix: { en: "Vendor Assessment Report", ar: "\u062A\u0642\u0631\u064A\u0631 \u062A\u0642\u064A\u064A\u0645 \u0627\u0644\u0645\u0648\u0631\u062F\u064A\u0646", zh: "\u4F9B\u5E94\u5546\u8BC4\u4F30\u62A5\u544A" }, templateName: "Vendor Assessment Template" },
    risk_assessment: { titleSuffix: { en: "Risk Assessment Report", ar: "\u062A\u0642\u0631\u064A\u0631 \u062A\u0642\u064A\u064A\u0645 \u0627\u0644\u0645\u062E\u0627\u0637\u0631", zh: "\u98CE\u9669\u8BC4\u4F30\u62A5\u544A" }, templateName: "Risk Assessment Template" },
    executive_summary: { titleSuffix: { en: "Executive Summary", ar: "\u0627\u0644\u0645\u0644\u062E\u0635 \u0627\u0644\u062A\u0646\u0641\u064A\u0630\u064A", zh: "\u6267\u884C\u6458\u8981" }, templateName: "Executive Summary Template" },
    regulatory_deadline: { titleSuffix: { en: "Regulatory Deadline Tracker", ar: "\u0645\u062A\u062A\u0628\u0639 \u0627\u0644\u0645\u0648\u0627\u0639\u064A\u062F \u0627\u0644\u062A\u0646\u0638\u064A\u0645\u064A\u0629", zh: "\u76D1\u7BA1\u622A\u6B62\u65E5\u671F\u8FFD\u8E2A" }, templateName: "Deadline Tracker Template" }
  };
  const typeMeta = REPORT_TYPE_TEMPLATES[reportType];
  const reportTitle = `${lbl(locale, "title")} \u2014 ${typeMeta.titleSuffix[locale]}`;
  const templateName = typeMeta.templateName;
  const includeSection = (section) => {
    if (reportType === "full_compliance") return true;
    if (reportType === "executive_summary") return ["header", "exec", "recommendations", "appendix"].includes(section);
    if (reportType === "regulatory_deadline") return ["header", "exec", "obligations", "appendix"].includes(section);
    if (reportType === "risk_assessment") return ["header", "exec", "security", "obligations_critical", "recommendations", "appendix"].includes(section);
    if (reportType === "gap_analysis") return ["header", "exec", "gaps", "recommendations", "appendix"].includes(section);
    if (reportType === "vendor_assessment") return ["header", "exec", "frameworks", "vendor_checklist", "recommendations", "appendix"].includes(section);
    return true;
  };
  const jurisdictionLabel = includeBoth ? `${lbl(locale, "saudi")} & ${lbl(locale, "china")}` : jurisdiction;
  const authoritiesValue = includeBoth ? "SDAIA, NCA, CAC, MIIT, MPS" : includeSaudi ? "SDAIA, NCA, CITC" : "CAC, MIIT, MPS, NPC";
  const frameworksValue = includeBoth ? "7 (PDPL, NCA-ECC, NCA-CCC, PIPL, CSL, DSL, MLPS 2.0)" : includeSaudi ? "3 (PDPL, NCA-ECC, NCA-CCC)" : "4 (PIPL, CSL, DSL, MLPS 2.0)";
  const L = (key) => lbl(locale, key);
  const parts = [];
  parts.push(
    `# ${reportTitle}

*${L("subtitle")}*

| | |
|---|---|
| **${L("jurisdiction")}** | ${jurisdictionLabel} |
| **${L("generated")}** | ${now.toUTCString()} |
| **${L("classification")}** | ${L("classificationValue")} |
| **${L("preparedBy")}** | ${L("preparedByValue")} |
| **Report Type** | ${typeMeta.titleSuffix[locale]} |
| **Report Version** | ${reportVersion} |

> ${L("confidentialNotice")}
`
  );
  parts.push(hr());
  parts.push(`## ${L("execSummary")}

${L("execSummaryIntro")}
`);
  parts.push(`
**Key Insights:**
`);
  parts.push(`- Critical obligations are concentrated in cross-border data transfer and incident response.
`);
  parts.push(`- Most high-risk gaps relate to incomplete documentation or missing DPO assignment.
`);
  parts.push(`- Penalty exposure is highest for unreported breaches and non-compliance with NCA-ECC.
`);
  parts.push(`- Ongoing obligations require regular evidence pack updates for both SDAIA and CAC.
`);
  parts.push(
    `
| ${L("keyStats")} | |
|---|---|
| **${L("frameworksLabel")}** | ${frameworksValue} |
| **${L("obligationsLabel")}** | ${filtered.length} |
| **${L("criticalObligationsLabel")}** | ${criticalCount} |
| **${L("authoritiesLabel")}** | ${authoritiesValue} |
| **Overall Score** | ${overallScore}/100 |
`
  );
  parts.push(hr());
  if (includeSection("frameworks")) {
    parts.push(`## ${L("frameworkCoverage")}

`);
    if (includeSaudi) {
      parts.push(`### ${L("saudiFrameworks")}

${saudiFrameworkBlock(locale)}
`);
    }
    if (includeChina) {
      parts.push(`### ${L("chinaFrameworks")}

${chinaFrameworkBlock(locale)}
`);
    }
    if (includeBoth && compTable.length > 0) {
      const top = compTable.slice(0, 6);
      parts.push(
        `### ${L("crossJurisdiction")}

| ${L("topic")} | ${L("saudi")} | ${L("china")} | ${L("notes")} |
|---|---|---|---|
` + top.map((r) => `| ${r.topic} | ${r.saudiArabia} | ${r.china} | ${r.notes ?? ""} |`).join("\n") + "\n"
      );
    }
    parts.push(hr());
  }
  if (includeSection("vendor_checklist")) {
    parts.push(`## Vendor Compliance Checklist

`);
    parts.push(
      `| Requirement | Framework | Status | Action Required |
|---|---|---|---|
| Data Processing Agreement (DPA) in place | PDPL / PIPL | \u26A0 Pending | Execute DPA with all data processors |
| Vendor security audit completed | NCA-ECC / MLPS 2.0 | \u26A0 In Progress | Complete within 30 days |
| Sub-processor registry maintained | PDPL Art. 15 / PIPL Art. 21 | \u2717 Not Started | Build registry with approval flow |
| Breach notification SLA agreed (72h/24h) | PDPL / PIPL | \u26A0 Partial | Confirm contractual SLA thresholds |
| Cross-border transfer mechanism documented | PDPL / PIPL | \u2717 Not Started | Complete DPIA and Standard Clauses |
| Annual compliance attestation | NCA-CCC / CSL | \u2717 Not Started | Schedule annual vendor review cycle |
`
    );
    parts.push(hr());
  }
  if (includeSection("all")) {
    parts.push(`## ${L("complianceStatus")}

### ${L("compMatrix")}

`);
    if (includeSaudi) {
      parts.push(
        `**${L("saudi")}**

| ${L("framework")} | Controls | ${L("authority")} | Status |
|---|---|---|---|
| PDPL | Art. 1\u201345 | SDAIA | Active |
| NCA-ECC | 114 controls | NCA | Active |
| NCA-CCC | 58 controls | NCA | Active |

`
      );
    }
    if (includeChina) {
      parts.push(
        `**${L("china")}**

| ${L("framework")} | Controls | ${L("authority")} | Status |
|---|---|---|---|
| PIPL | Art. 1\u201374 | CAC (NISA) | Active |
| CSL | Art. 1\u201379 | CAC / MIIT | Active |
| DSL | Art. 1\u201355 | NPC / MIIT | Active |
| MLPS 2.0 | 300+ controls | MPS | Active |

`
      );
    }
    parts.push(hr());
  }
  if (includeSection("security")) {
    parts.push(`## ${L("securitySection")}

### ${L("penaltiesSection")}

`);
    parts.push(`
**Key Risk Insights:**
`);
    parts.push(`- Penalty exposure is highest for unreported breaches and cross-border data transfer violations.
`);
    parts.push(`- Saudi PDPL and China PIPL both impose multi-million penalties and criminal liability for severe violations.
`);
    parts.push(`- NCA-ECC and MLPS 2.0 require ongoing technical and organizational controls to avoid service suspension.
`);
    if (includeSaudi) {
      parts.push(
        `
**${L("saudi")} \u2014 PDPL / NCA:**

- Maximum administrative fine: **SAR 5,000,000** per violation
- Criminal liability: up to **2 years imprisonment** for intentional breach
- NCA non-compliance: mandatory corrective order + potential service suspension

`
      );
    }
    if (includeChina) {
      parts.push(
        `
**${L("china")} \u2014 PIPL / CSL / DSL:**

- PIPL: up to **RMB 50,000,000** or **5% of prior-year global annual turnover** (whichever is higher)
- CSL: up to **RMB 1,000,000** per incident + mandatory business suspension
- DSL: up to **RMB 10,000,000** + criminal prosecution for data offences endangering national security

`
      );
    }
    parts.push(hr());
  }
  if (includeSection("all") && includeBoth && compTable.length > 0) {
    parts.push(
      `## ${L("cwTopics")}

| ${L("topic")} | ${L("saudi")} | ${L("china")} | ${L("notes")} |
|---|---|---|---|
` + compTable.map((r) => `| ${r.topic} | ${r.saudiArabia} | ${r.china} | ${r.notes ?? ""} |`).join("\n") + "\n"
    );
    parts.push(hr());
  }
  if (includeSection("gaps")) {
    const gapObls = filtered.filter(
      (o) => o.riskLevel === "critical" || o.riskLevel === "high"
    );
    parts.push(`## Gap Analysis \u2014 High-Priority Remediation Items

`);
    parts.push(
      `> **${gapObls.length} compliance gap(s) identified** across ${frameworksCovered} frameworks. Overall compliance score: **${overallScore}/100**.

`
    );
    parts.push(
      `| Gap # | Requirement | Framework | Jurisdiction | Risk Level | Priority Action |
|---|---|---|---|---|---|
` + gapObls.map(
        (o, i) => `| ${i + 1} | ${o.requirement} | ${o.framework} | ${o.country} | **${badge(locale, o.riskLevel)}** | Immediate remediation required |`
      ).join("\n") + "\n\n"
    );
    parts.push(hr());
  }
  if (includeSection("obligations") || includeSection("obligations_critical")) {
    parts.push(`## ${L("oblSection")}

`);
    parts.push(`
**Actionable Insights:**
`);
    parts.push(`- Immediate focus: appoint DPO and complete cross-border data transfer assessments.
`);
    parts.push(`- Ongoing: maintain evidence packs and incident response readiness.
`);
    parts.push(`- Annual: schedule internal cybersecurity audits and regulatory self-assessments.
`);
    const critAndHigh = filtered.filter(
      (o) => o.riskLevel === "critical" || o.riskLevel === "high"
    );
    const ongoing = filtered.filter((o) => o.frequency === "ongoing");
    parts.push(
      `### ${L("criticalHeader")}

| ${L("requirement")} | ${L("framework")} | ${L("country")} | ${L("risk")} | ${L("frequency")} | ${L("authority")} |
|---|---|---|---|---|---|
` + (critAndHigh.length > 0 ? critAndHigh.map(
        (o) => `| ${o.requirement} | ${o.framework} | ${o.country} | ${badge(locale, o.riskLevel)} | ${o.frequency.replace(/_/g, " ")} | ${o.authority} |`
      ).join("\n") + "\n\n" : "_No critical or high obligations identified for this jurisdiction selection._\n\n")
    );
    if (includeSection("obligations") && ongoing.length > 0) {
      parts.push(
        `### ${L("ongoingHeader")}

| ${L("requirement")} | ${L("framework")} | ${L("country")} | ${L("authority")} |
|---|---|---|---|
` + ongoing.map((o) => `| ${o.requirement} | ${o.framework} | ${o.country} | ${o.authority} |`).join("\n") + "\n\n"
      );
    }
    parts.push(hr());
  }
  parts.push(`## ${L("recommendations")}

`);
  parts.push("![Remediation Checklist](remediation-checklist.svg)\n");
  parts.push(`
**Remediation Priorities:**
`);
  parts.push(`- Appoint DPO and assign clear responsibility for compliance.
`);
  parts.push(`- Complete cross-border data transfer impact assessments.
`);
  parts.push(`- Achieve baseline ISO 27001 or equivalent certification.
`);
  parts.push(`- Maintain incident response and evidence packs for all frameworks.
`);
  parts.push(`- Schedule annual internal audits and regulatory self-assessments.
`);
  parts.push(`
${buildRecommendations(locale)}
`);
  parts.push(hr());
  parts.push(`## ${L("appendixSection")}

`);
  parts.push(`### ${L("appendixAuthorities")}

`);
  if (includeSaudi) {
    parts.push(
      `- **SDAIA** \u2014 Saudi Data & Artificial Intelligence Authority *(PDPL enforcement)*
- **NCA** \u2014 National Cybersecurity Authority *(ECC & CCC enforcement)*
- **CITC** \u2014 Communications, Space & Technology Commission
`
    );
  }
  if (includeChina) {
    parts.push(
      `- **CAC** \u2014 Cyberspace Administration of China *(PIPL, CSL, DSL enforcement)*
- **MIIT** \u2014 Ministry of Industry and Information Technology
- **MPS** \u2014 Ministry of Public Security *(MLPS enforcement)*
- **NPC** \u2014 National People's Congress *(DSL legislation)*
`
    );
  }
  const relevantLaws = laws.filter(
    (l) => includeBoth ? true : l.jurisdiction === jurisdiction || l.jurisdiction === "Cross-border"
  ).slice(0, 10);
  if (relevantLaws.length > 0) {
    parts.push(
      `
### ${L("appendixReferences")}

` + relevantLaws.map((l) => `- **${l.title}** *(${l.jurisdiction})* \u2014 ${l.summary.slice(0, 140)}...`).join("\n") + "\n"
    );
  }
  parts.push(
    `
### ${L("appendixMeta")}

| Property | Value |
|---|---|
| **${L("reportId")}** | \`${reportId}\` |
| **${L("generatedAt")}** | ${now.toISOString()} |
| **${L("engineVersion")}** | ${L("engineValue")} |
| **${L("jurisdiction")}** | ${jurisdictionLabel} |
| **Language** | ${locale.toUpperCase()} |

`
  );
  parts.push(`> ${L("pdfNote")}
`);
  return {
    markdown: parts.join(""),
    reportId,
    generatedAt: now.toISOString(),
    title: reportTitle,
    templateName,
    reportType,
    reportVersion,
    scorecardSummary
  };
}

// server/report-delivery.ts
init_env();
init_config_schema();
import fs2 from "node:fs/promises";
import os from "node:os";
import path3 from "node:path";
import { execFile } from "node:child_process";
import { randomUUID as randomUUID2 } from "node:crypto";
import { promisify } from "node:util";
import fontkit from "@pdf-lib/fontkit";
import nodemailer2 from "nodemailer";
import PizZip from "pizzip";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
var FONT_CANDIDATES = {
  en: {
    regular: [
      "C:/Windows/Fonts/arial.ttf",
      "C:/Windows/Fonts/helvetica.ttf",
      "C:/Windows/Fonts/segoeui.ttf",
      "/System/Library/Fonts/HelveticaNeue.ttc",
      "/System/Library/Fonts/Arial Unicode.ttf",
      "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
    ],
    bold: [
      "C:/Windows/Fonts/arialbd.ttf",
      "C:/Windows/Fonts/helveticabold.ttf",
      "C:/Windows/Fonts/segoeuib.ttf",
      "/System/Library/Fonts/HelveticaNeue.ttc",
      "/System/Library/Fonts/Arial Unicode.ttf",
      "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
    ]
  },
  ar: {
    regular: [
      "C:/Windows/Fonts/segoeui.ttf",
      "C:/Windows/Fonts/arial.ttf",
      "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
      "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
      "/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf"
    ],
    bold: [
      "C:/Windows/Fonts/segoeuib.ttf",
      "C:/Windows/Fonts/arialbd.ttf",
      "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
      "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
      "/usr/share/fonts/truetype/noto/NotoSans-Bold.ttf"
    ]
  },
  zh: {
    regular: [
      "C:/Windows/Fonts/msyh.ttc",
      "C:/Windows/Fonts/msyh.ttf",
      "C:/Windows/Fonts/simsun.ttc",
      "/System/Library/Fonts/PingFang.ttc",
      "/System/Library/Fonts/STHeiti Light.ttc",
      "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
      "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.otf"
    ],
    bold: [
      "C:/Windows/Fonts/msyhbd.ttc",
      "C:/Windows/Fonts/msyhbd.ttf",
      "C:/Windows/Fonts/simhei.ttf",
      "/System/Library/Fonts/PingFang.ttc",
      "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc",
      "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.otf"
    ]
  }
};
var DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
var SIDEBAR_PLACEHOLDER = "\u201CGot something very important to point out to your readers? Use a pull quote to make it stand out.\u201D";
var execFileAsync = promisify(execFile);
var ENABLE_NATIVE_PDF_CONVERSION = parsedEnv.REPORT_NATIVE_PDF_CONVERSION && parsedEnv.NODE_ENV !== "test";
function fileNameFromReportId(reportId, extension) {
  return `${reportId}.${extension}`;
}
function sanitizeFallbackText(value) {
  return value.replace(/\u26A0/g, "[!]").replace(/[\u2022]/g, "-").replace(/[\u2013\u2014]/g, "-").replace(/[\u201C\u201D]/g, '"').replace(/[\u2018\u2019]/g, "'").replace(/[\u{1F534}\u{1F7E0}\u{1F7E1}\u{1F7E2}]/gu, "*").replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF]/g, "").trim();
}
function extractSubtitle(markdown) {
  for (const rawLine of markdown.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line.startsWith("*") && line.endsWith("*")) {
      return cleanInlineMarkdown(line);
    }
  }
  return "";
}
function extractSidebarQuote(markdown) {
  const lines = markdown.split(/\r?\n/).map((line) => line.trim());
  let foundSection = false;
  for (const line of lines) {
    if (line.startsWith("## ")) {
      foundSection = true;
      continue;
    }
    if (!foundSection || !line || line.startsWith("#") || line.startsWith("|") || /^[-*]\s+/.test(line)) {
      continue;
    }
    const cleaned = cleanInlineMarkdown(line);
    if (cleaned.length >= 60) {
      return cleaned;
    }
  }
  return "This report consolidates key compliance obligations, framework alignments, and remediation priorities for decision-ready review.";
}
function stripCoverContent(markdown) {
  const lines = markdown.split(/\r?\n/);
  const firstSectionIndex = lines.findIndex((line) => line.trim().startsWith("## "));
  if (firstSectionIndex === -1) {
    return markdown;
  }
  return lines.slice(firstSectionIndex).join("\n");
}
function cleanInlineMarkdown(value) {
  return value.replace(/\[(.*?)\]\((.*?)\)/g, "$1").replace(/`([^`]+)`/g, "$1").replace(/\*\*([^*]+)\*\*/g, "$1").replace(/__([^_]+)__/g, "$1").replace(/\*([^*]+)\*/g, "$1").replace(/_([^_]+)_/g, "$1").replace(/\s+/g, " ").trim();
}
function escapeXml(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
function wrapCoverTitle(text2, locale) {
  const maxChars = locale === "en" ? 22 : 14;
  const words = text2.split(/\s+/).filter(Boolean);
  if (words.length <= 1) {
    return [text2];
  }
  const lines = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) {
    lines.push(current);
  }
  return lines;
}
function paragraphXml(text2, options) {
  const paragraphProps = [];
  const runProps = [];
  if (options?.styleId) {
    paragraphProps.push(`<w:pStyle w:val="${options.styleId}"/>`);
  }
  if (typeof options?.before === "number" || typeof options?.after === "number") {
    paragraphProps.push(`<w:spacing${typeof options.before === "number" ? ` w:before="${options.before}"` : ""}${typeof options.after === "number" ? ` w:after="${options.after}"` : ""}/>`);
  }
  if (options?.pageBreakBefore) {
    paragraphProps.push("<w:pageBreakBefore/>");
  }
  if (options?.bold) {
    runProps.push("<w:b/>");
    runProps.push("<w:bCs/>");
  }
  if (options?.caps) {
    runProps.push("<w:caps/>");
  }
  if (options?.color) {
    runProps.push(`<w:color w:val="${options.color}"/>`);
  }
  if (options?.size) {
    runProps.push(`<w:sz w:val="${options.size}"/><w:szCs w:val="${options.size}"/>`);
  }
  return `<w:p>${paragraphProps.length > 0 ? `<w:pPr>${paragraphProps.join("")}</w:pPr>` : ""}<w:r>${runProps.length > 0 ? `<w:rPr>${runProps.join("")}</w:rPr>` : ""}<w:t xml:space="preserve">${escapeXml(text2)}</w:t></w:r></w:p>`;
}
function separatorXml() {
  return `<w:p><w:pPr><w:spacing w:after="220"/><w:pBdr><w:bottom w:val="single" w:sz="8" w:space="1" w:color="D1282E"/></w:pBdr></w:pPr></w:p>`;
}
function pageBreakXml() {
  return '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
}
function parseMarkdownBlocks(markdown) {
  const lines = markdown.split(/\r?\n/);
  const blocks = [];
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]?.trim() ?? "";
    if (!line || /^---+$/.test(line)) {
      continue;
    }
    if (line.startsWith("## ")) {
      blocks.push({ kind: "heading", level: 2, text: cleanInlineMarkdown(line.slice(3)) });
      continue;
    }
    if (line.startsWith("### ")) {
      blocks.push({ kind: "heading", level: 3, text: cleanInlineMarkdown(line.slice(4)) });
      continue;
    }
    if (line.startsWith("|") && /^\|[-\s|]+\|?$/.test(lines[index + 1]?.trim() ?? "")) {
      const rows = [];
      rows.push(line.split("|").map((cell) => cleanInlineMarkdown(cell)).filter(Boolean));
      index += 2;
      while (index < lines.length && (lines[index]?.trim() ?? "").startsWith("|")) {
        rows.push(lines[index].split("|").map((cell) => cleanInlineMarkdown(cell)).filter(Boolean));
        index += 1;
      }
      index -= 1;
      if (rows.length > 0) {
        blocks.push({ kind: "table", rows });
      }
      continue;
    }
    if (/^[-*]\s+/.test(line)) {
      blocks.push({ kind: "paragraph", styleId: "ListParagraph", text: `\u2022 ${cleanInlineMarkdown(line.replace(/^[-*]\s+/, ""))}` });
      continue;
    }
    if (line.startsWith("> ")) {
      blocks.push({ kind: "paragraph", styleId: "Quote", text: cleanInlineMarkdown(line.slice(2)) });
      continue;
    }
    if (line.startsWith("![")) {
      continue;
    }
    const isEntirelyBold = /^\*\*[^*]+\*\*$/.test(line);
    blocks.push({ kind: "paragraph", text: cleanInlineMarkdown(line), bold: isEntirelyBold });
  }
  return blocks;
}
function tableCellXml(text2, header = false) {
  const runProps = header ? "<w:rPr><w:b/><w:bCs/></w:rPr>" : "";
  return `<w:tc><w:tcPr><w:tcW w:w="0" w:type="auto"/></w:tcPr><w:p><w:pPr><w:spacing w:after="0"/></w:pPr><w:r>${runProps}<w:t xml:space="preserve">${escapeXml(text2)}</w:t></w:r></w:p></w:tc>`;
}
function tableXml(rows) {
  const columnCount = Math.max(...rows.map((row) => row.length), 1);
  const gridCols = Array.from({ length: columnCount }, () => '<w:gridCol w:w="2160"/>').join("");
  const bodyRows = rows.map((row, rowIndex) => `<w:tr>${Array.from({ length: columnCount }, (_, colIndex) => tableCellXml(row[colIndex] ?? "", rowIndex === 0)).join("")}</w:tr>`).join("");
  return `<w:tbl><w:tblPr><w:tblStyle w:val="Style6"/><w:tblW w:w="5000" w:type="pct"/><w:tblLook w:val="06A0" w:firstRow="1" w:lastRow="0" w:firstColumn="1" w:lastColumn="0" w:noHBand="1" w:noVBand="1"/></w:tblPr><w:tblGrid>${gridCols}</w:tblGrid>${bodyRows}</w:tbl>`;
}
function coverMetadataXml(report, options) {
  const generatedValue = new Date(report.generatedAt).toLocaleString("en-US");
  return [
    paragraphXml(`Generated: ${generatedValue}`, { color: "7A7A7A", size: 20, after: 40 }),
    paragraphXml(`Report ID: ${report.reportId}`, { color: "7A7A7A", size: 20, after: 40 }),
    paragraphXml(`Jurisdiction: ${options.jurisdiction}`, { color: "7A7A7A", size: 20, after: 0 })
  ].join("");
}
function buildDocxBodyXml(report, options, originalDocumentXml) {
  const sectPrMatch = originalDocumentXml.match(/<w:sectPr[\s\S]*?<\/w:sectPr>/);
  const sidebarParagraphMatch = originalDocumentXml.match(/<w:p>[\s\S]*?(?:descr="Sidebar"|Text Box 5)[\s\S]*?<\/w:p>/);
  const sidebarParagraphXml = sidebarParagraphMatch ? sidebarParagraphMatch[0].replace(SIDEBAR_PLACEHOLDER, escapeXml(`\u201C${extractSidebarQuote(report.markdown)}\u201D`)) : "";
  const titleLines = wrapCoverTitle(options.locale === "en" ? report.title.toUpperCase() : report.title, options.locale).map((line) => paragraphXml(line, { styleId: "Title", after: 0 }));
  const subtitle = extractSubtitle(report.markdown);
  const bodyBlocks = parseMarkdownBlocks(stripCoverContent(report.markdown));
  const bodyXml = bodyBlocks.map((block) => {
    if (block.kind === "heading") {
      return paragraphXml(block.text, { styleId: block.level === 2 ? "Heading2" : "Heading3", after: 80 });
    }
    if (block.kind === "table") {
      return tableXml(block.rows);
    }
    return paragraphXml(block.text, { styleId: block.styleId ?? "Normal", after: 70 });
  }).join("");
  const coverXml = [
    separatorXml(),
    "<w:p/><w:p/><w:p/>",
    titleLines.join(""),
    subtitle ? paragraphXml(options.locale === "en" ? subtitle.toUpperCase() : subtitle, { styleId: "Subtitle", after: 240 }) : "",
    coverMetadataXml(report, options),
    "<w:p/><w:p/>",
    sidebarParagraphXml,
    "<w:p/><w:p/><w:p/><w:p/>",
    paragraphXml("YALLA HACK", { styleId: "Heading3", after: 40 })
    // Removed template name from cover
  ].join("");
  const sectionIntroXml = [
    separatorXml(),
    paragraphXml(`Report ID: ${report.reportId}`, { styleId: "Header", color: "7A7A7A", size: 16, after: 120 })
  ].join("");
  return `${coverXml}${pageBreakXml()}${sectionIntroXml}${bodyXml}${sectPrMatch?.[0] ?? ""}`;
}
async function tryReadFile(filePath) {
  try {
    return await fs2.readFile(filePath);
  } catch {
    return null;
  }
}
async function loadFontBytes(candidates) {
  for (const candidate of candidates) {
    const fontBytes = await tryReadFile(candidate);
    if (fontBytes) {
      return fontBytes;
    }
  }
  return null;
}
async function resolvePdfFonts(pdf, locale) {
  pdf.registerFontkit(fontkit);
  const candidates = FONT_CANDIDATES[locale];
  if (candidates.regular.length > 0) {
    const regularBytes = await loadFontBytes(candidates.regular);
    const boldBytes = await loadFontBytes(candidates.bold);
    if (regularBytes) {
      const embedSafe = async (bytes) => {
        try {
          return await pdf.embedFont(bytes, { subset: true });
        } catch {
          return await pdf.embedFont(bytes);
        }
      };
      const regular = await embedSafe(regularBytes);
      const bold = boldBytes ? await embedSafe(boldBytes) : regular;
      return {
        regular,
        bold,
        supportsUnicode: true
      };
    }
  }
  return {
    regular: await pdf.embedFont(StandardFonts.Helvetica),
    bold: await pdf.embedFont(StandardFonts.HelveticaBold),
    supportsUnicode: false
  };
}
function wrapText(text2, font, fontSize, maxWidth) {
  const words = text2.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [""];
  const lines = [];
  let current = words[0];
  for (let i = 1; i < words.length; i += 1) {
    const candidate = `${current} ${words[i]}`;
    if (font.widthOfTextAtSize(candidate, fontSize) <= maxWidth) {
      current = candidate;
    } else {
      lines.push(current);
      current = words[i];
    }
  }
  lines.push(current);
  return lines;
}
async function loadLogoBytes() {
  const logoPath = path3.resolve(process.cwd(), "client", "public", "yalla-hack-logo.png");
  try {
    return await fs2.readFile(logoPath);
  } catch {
    return null;
  }
}
async function buildDocxBuffer(options, report) {
  const templatePath = path3.resolve(process.cwd(), "audit", "templates", "official-report-template.docx");
  const templateBytes = await fs2.readFile(templatePath);
  try {
    const zip = new PizZip(templateBytes);
    const docEntry = zip.file("word/document.xml");
    if (!docEntry) {
      throw new Error("Template DOCX is missing word/document.xml");
    }
    const originalXml = docEntry.asText();
    const newBodyXml = buildDocxBodyXml(report, options, originalXml);
    const newDocumentXml = originalXml.replace(
      /<w:body>[\s\S]*?<\/w:body>/,
      `<w:body>${newBodyXml}</w:body>`
    );
    zip.file("word/document.xml", newDocumentXml);
    const generated = zip.generate({ type: "nodebuffer", compression: "DEFLATE" });
    return generated;
  } catch (err) {
    console.error("[DJAC DOCX] Template content injection failed, generating minimal DOCX:", err);
    return buildMinimalDocxBuffer(report);
  }
}
function buildMinimalDocxBuffer(report) {
  const NS_W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
  const NS_RELS = "http://schemas.openxmlformats.org/package/2006/relationships";
  const NS_CT = "http://schemas.openxmlformats.org/package/2006/content-types";
  const REL_HDR = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/header";
  const REL_FTR = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer";
  const REL_R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
  const year = (/* @__PURE__ */ new Date()).getFullYear();
  const safeTitle = escapeXml(report.title);
  const safeId = escapeXml(report.reportId);
  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="${NS_CT}">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/>
  <Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>
</Types>`;
  const dotRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="${NS_RELS}">
  <Relationship Id="rId1" Type="${REL_R}/officeDocument" Target="word/document.xml"/>
</Relationships>`;
  const wordRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="${NS_RELS}">
  <Relationship Id="rId1" Type="${REL_HDR}" Target="header1.xml"/>
  <Relationship Id="rId2" Type="${REL_FTR}" Target="footer1.xml"/>
</Relationships>`;
  const headerXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:hdr xmlns:w="${NS_W}">
  <w:p>
    <w:pPr><w:jc w:val="center"/><w:shd w:val="clear" w:color="auto" w:fill="0A0A18"/><w:spacing w:before="80" w:after="40"/></w:pPr>
    <w:r><w:rPr><w:b/><w:sz w:val="28"/><w:color w:val="22D3EE"/></w:rPr><w:t>YALLA HACK</w:t></w:r>
  </w:p>
  <w:p>
    <w:pPr><w:jc w:val="center"/><w:spacing w:before="0" w:after="80"/></w:pPr>
    <w:r><w:rPr><w:sz w:val="18"/><w:color w:val="AAAAAA"/></w:rPr><w:t>${safeTitle}</w:t></w:r>
  </w:p>
  <w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="6" w:space="1" w:color="003366"/></w:pBdr><w:spacing w:after="0"/></w:pPr></w:p>
</w:hdr>`;
  const footerXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:ftr xmlns:w="${NS_W}">
  <w:p><w:pPr><w:pBdr><w:top w:val="single" w:sz="6" w:space="1" w:color="003366"/></w:pBdr><w:spacing w:before="0" w:after="0"/></w:pPr></w:p>
  <w:p>
    <w:pPr><w:jc w:val="center"/><w:spacing w:before="40" w:after="0" w:line="240" w:lineRule="auto"/></w:pPr>
    <w:r><w:rPr><w:sz w:val="14"/><w:color w:val="888888"/></w:rPr><w:t>\xA9 ${year} Yalla Hack  All rights reserved</w:t></w:r>
  </w:p>
  <w:p>
    <w:pPr><w:jc w:val="center"/><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/></w:pPr>
    <w:r><w:rPr><w:sz w:val="14"/><w:color w:val="888888"/></w:rPr><w:t>License Number: 1562528  |  Email: support@yalla-hack.net</w:t></w:r>
  </w:p>
  <w:p>
    <w:pPr><w:jc w:val="center"/><w:spacing w:before="0" w:after="40" w:line="240" w:lineRule="auto"/></w:pPr>
    <w:r><w:rPr><w:sz w:val="13"/><w:color w:val="999999"/></w:rPr><w:t>Phone: +8618326095404 / +971 56 480 3488  |  Dubai Industrial City, Dubai, UAE</w:t></w:r>
  </w:p>
</w:ftr>`;
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="${NS_W}" xmlns:r="${REL_R}">
  <w:body>
    <w:p><w:r><w:t>DJAC Compliance Report</w:t></w:r></w:p>
    <w:p><w:r><w:t>${safeTitle}</w:t></w:r></w:p>
    <w:p><w:r><w:t>Report ID: ${safeId}</w:t></w:r></w:p>
    <w:sectPr>
      <w:headerReference w:type="default" r:id="rId1"/>
      <w:footerReference w:type="default" r:id="rId2"/>
    </w:sectPr>
  </w:body>
</w:document>`;
  const zip = new PizZip();
  zip.file("[Content_Types].xml", contentTypes);
  zip.file("_rels/.rels", dotRels);
  zip.file("word/_rels/document.xml.rels", wordRels);
  zip.file("word/document.xml", documentXml);
  zip.file("word/header1.xml", headerXml);
  zip.file("word/footer1.xml", footerXml);
  return zip.generate({ type: "nodebuffer", compression: "DEFLATE" });
}
async function tryReadPdfFrom(pathToPdf) {
  try {
    return await fs2.readFile(pathToPdf);
  } catch {
    return null;
  }
}
async function tryConvertDocxToPdfViaSoffice(docxBuffer) {
  const tempDir = path3.join(os.tmpdir(), `djac-report-${randomUUID2()}`);
  await fs2.mkdir(tempDir, { recursive: true });
  const inputPath = path3.join(tempDir, "report.docx");
  const outputPath = path3.join(tempDir, "report.pdf");
  await fs2.writeFile(inputPath, docxBuffer);
  const candidates = process.platform === "win32" ? ["soffice.exe", "soffice", "libreoffice"] : ["soffice", "libreoffice"];
  try {
    for (const command of candidates) {
      try {
        await execFileAsync(
          command,
          ["--headless", "--convert-to", "pdf", "--outdir", tempDir, inputPath],
          { windowsHide: true, timeout: 6e4 }
        );
        const converted = await tryReadPdfFrom(outputPath);
        if (converted) {
          return converted;
        }
      } catch {
      }
    }
    return null;
  } finally {
    await fs2.rm(tempDir, { recursive: true, force: true }).catch(() => void 0);
  }
}
async function tryConvertDocxToPdfViaWordCom(docxBuffer) {
  if (process.platform !== "win32") {
    return null;
  }
  const tempDir = path3.join(os.tmpdir(), `djac-report-${randomUUID2()}`);
  await fs2.mkdir(tempDir, { recursive: true });
  const inputPath = path3.join(tempDir, "report.docx");
  const outputPath = path3.join(tempDir, "report.pdf");
  await fs2.writeFile(inputPath, docxBuffer);
  const inEscaped = inputPath.replace(/'/g, "''");
  const outEscaped = outputPath.replace(/'/g, "''");
  const script = [
    "$ErrorActionPreference = 'Stop'",
    "$word = New-Object -ComObject Word.Application",
    "$word.Visible = $false",
    "try {",
    `  $doc = $word.Documents.Open('${inEscaped}')`,
    `  $doc.SaveAs([ref]'${outEscaped}', [ref]17)`,
    "  $doc.Close()",
    "} finally {",
    "  $word.Quit()",
    "}"
  ].join("; ");
  try {
    await execFileAsync(
      "powershell",
      ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", script],
      { windowsHide: true, timeout: 9e4 }
    );
    return await tryReadPdfFrom(outputPath);
  } catch {
    return null;
  } finally {
    await fs2.rm(tempDir, { recursive: true, force: true }).catch(() => void 0);
  }
}
async function tryConvertDocxToNativePdf(docxBuffer) {
  if (!ENABLE_NATIVE_PDF_CONVERSION) {
    return null;
  }
  const wordComPdf = await tryConvertDocxToPdfViaWordCom(docxBuffer);
  if (wordComPdf) {
    return wordComPdf;
  }
  return await tryConvertDocxToPdfViaSoffice(docxBuffer);
}
async function buildPdfBuffer(options, report) {
  const pdf = await PDFDocument.create();
  const watermarkPath = path3.resolve(process.cwd(), "audit", "templates", "report-watermark.pdf");
  let watermarkPdfDoc = null;
  let watermarkPage = null;
  let wm = null;
  try {
    const watermarkBytes = await fs2.readFile(watermarkPath);
    watermarkPdfDoc = await PDFDocument.load(watermarkBytes);
    if (watermarkPdfDoc.getPageCount() === 0) throw new Error("Watermark PDF has no pages");
    watermarkPage = watermarkPdfDoc.getPage(0);
    wm = await pdf.embedPage(watermarkPage);
    if (!wm) throw new Error("Failed to embed watermark page");
  } catch (err) {
    console.warn("[DJAC PDF] Watermark skipped:", err.message);
    watermarkPdfDoc = null;
    watermarkPage = null;
    wm = null;
  }
  const fonts = await resolvePdfFonts(pdf, options.locale);
  const fontRegular = fonts.regular;
  const fontBold = fonts.bold;
  const logoBytes = await loadLogoBytes();
  const logoImage = logoBytes ? await pdf.embedPng(logoBytes) : null;
  pdf.setTitle(report.title);
  pdf.setAuthor("DJAC / Yalla Hack");
  pdf.setSubject(`DJAC Compliance Report PDF`);
  pdf.setProducer("DJAC Compliance Reporting Service");
  pdf.setCreator("DJAC Compliance Reporting Service");
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const marginX = 56.7;
  const marginY = 71;
  const safeWidth = pageWidth - 2 * marginX;
  const safeHeight = pageHeight - 2 * marginY;
  const HEADER_H = 80;
  const FOOTER_H = 52;
  const sectionSpacing = 20;
  const lineHeight = 15;
  const normalizeText2 = (value) => fonts.supportsUnicode ? value : sanitizeFallbackText(value);
  const subtitle = normalizeText2(extractSubtitle(report.markdown));
  const sidebarQuote = normalizeText2(extractSidebarQuote(report.markdown));
  const bodyMarkdown = stripCoverContent(report.markdown);
  const blocks = parseMarkdownBlocks(bodyMarkdown);
  const normalizedTitle = options.locale === "en" ? normalizeText2(report.title).toUpperCase() : normalizeText2(report.title);
  const reportIdLabel = normalizeText2(`Report ID: ${report.reportId}`);
  const pages = [];
  function renderHeaderFooter(page) {
    page.drawRectangle({ x: 0, y: pageHeight - HEADER_H, width: pageWidth, height: HEADER_H, color: rgb(0.04, 0.04, 0.1) });
    if (logoImage) {
      try {
        const maxLogoH = HEADER_H - 16;
        const maxLogoW = 200;
        let dims = logoImage.scale(1);
        let scale = 1;
        if (dims.width > maxLogoW) scale = Math.min(scale, maxLogoW / dims.width);
        if (dims.height > maxLogoH) scale = Math.min(scale, maxLogoH / dims.height);
        dims = logoImage.scale(scale);
        page.drawImage(logoImage, {
          x: (pageWidth - dims.width) / 2,
          y: pageHeight - HEADER_H + (HEADER_H - dims.height) / 2,
          width: dims.width,
          height: dims.height
        });
      } catch {
      }
    } else {
      const yhText = "YALLA HACK";
      const yhSize = 18;
      page.drawText(yhText, {
        x: (pageWidth - fontBold.widthOfTextAtSize(yhText, yhSize)) / 2,
        y: pageHeight - HEADER_H / 2 - yhSize / 2,
        size: yhSize,
        font: fontBold,
        color: rgb(0.13, 0.83, 0.93)
      });
    }
    page.drawRectangle({ x: 0, y: 0, width: pageWidth, height: FOOTER_H, color: rgb(0.04, 0.04, 0.1) });
    const footerYear = (/* @__PURE__ */ new Date()).getFullYear();
    const footerLines = [
      `\xA9 ${footerYear} Yalla Hack  All rights reserved`,
      "License Number: 1562528  |  Email: support@yalla-hack.net",
      "Phone: +8618326095404 / +971 56 480 3488  |  Dubai Industrial City, Dubai, UAE"
    ];
    const fSize = 6.5;
    const fLineH = 9;
    let fY = FOOTER_H - 9;
    for (const fLine of footerLines) {
      const fW = fontRegular.widthOfTextAtSize(fLine, fSize);
      page.drawText(fLine, {
        x: Math.max(marginX, (pageWidth - fW) / 2),
        y: fY,
        size: fSize,
        font: fontRegular,
        color: rgb(0.65, 0.65, 0.7)
      });
      fY -= fLineH;
    }
  }
  function createPage() {
    const page = pdf.addPage([pageWidth, pageHeight]);
    if (wm) page.drawPage(wm, { x: 0, y: 0, width: pageWidth, height: pageHeight, opacity: 0.13 });
    renderHeaderFooter(page);
    pages.push({ page, cursorY: pageHeight - marginY - HEADER_H });
    return pages[pages.length - 1];
  }
  function draw_section_heading(page, y2, text2, level = 2) {
    const fontSize = level === 2 ? 16 : 13;
    const font = fontBold;
    const color = level === 2 ? rgb(0.04, 0.2, 0.42) : rgb(0.12, 0.12, 0.18);
    if (level === 2) y2 -= 8;
    const lines = wrapText(text2, font, fontSize, safeWidth);
    for (const line of lines) {
      page.drawText(line, { x: marginX, y: y2, size: fontSize, font, color });
      y2 -= fontSize * 1.4;
    }
    if (level === 2) {
      page.drawLine({
        start: { x: marginX, y: y2 + 6 },
        end: { x: marginX + safeWidth, y: y2 + 6 },
        thickness: 1.5,
        color: rgb(0.82, 0.16, 0.18)
      });
      y2 -= 8;
    }
    return y2 - 6;
  }
  function draw_section_paragraph(page, y2, text2, bold = false) {
    const fontSize = 10;
    const font = bold ? fontBold : fontRegular;
    const lines = wrapText(text2, font, fontSize, safeWidth);
    for (const line of lines) {
      page.drawText(line, { x: marginX, y: y2, size: fontSize, font, color: rgb(0.15, 0.15, 0.2) });
      y2 -= fontSize * 1.4;
    }
    return y2 - 6;
  }
  function draw_section_table(page, y2, tableRows) {
    const colCount = Math.max(...tableRows.map((row) => row.length), 1);
    const colWidths = (() => {
      if (colCount === 2) return [safeWidth * 0.35, safeWidth * 0.65];
      if (colCount === 4) return [safeWidth * 0.18, safeWidth * 0.27, safeWidth * 0.27, safeWidth * 0.28];
      if (colCount === 6) return [safeWidth * 0.3, safeWidth * 0.12, safeWidth * 0.12, safeWidth * 0.1, safeWidth * 0.13, safeWidth * 0.23];
      const w = safeWidth / colCount;
      return Array.from({ length: colCount }, () => w);
    })();
    const fontSize = colCount >= 6 ? 8.5 : colCount >= 4 ? 9 : 10;
    const tableWidth = colWidths.reduce((s, w) => s + w, 0);
    const rowHeights = tableRows.map((row) => {
      let maxLines = 1;
      for (let c = 0; c < colCount; c++) {
        const cell = row[c] ?? "";
        const lines = wrapText(cell, fontRegular, fontSize, colWidths[c] - 8).length;
        if (lines > maxLines) maxLines = lines;
      }
      return maxLines * (fontSize * 1.4) + 8;
    });
    const headerHeight = rowHeights[0] ?? 22;
    function drawHeaderRow(pg3, startY) {
      const headerRow = tableRows[0];
      let xOff = marginX;
      for (let c = 0; c < colCount; c++) {
        const cell = headerRow[c] ?? "";
        const cw = colWidths[c];
        pg3.drawRectangle({ x: xOff, y: startY - headerHeight + 2, width: cw, height: headerHeight, color: rgb(0.86, 0.91, 0.96) });
        const cellLines = wrapText(cell, fontBold, fontSize, cw - 8);
        let cellY = startY - 6;
        for (const hLine of cellLines) {
          pg3.drawText(hLine, { x: xOff + 4, y: cellY, size: fontSize, font: fontBold, color: rgb(0.06, 0.18, 0.36) });
          cellY -= fontSize * 1.4;
        }
        pg3.drawLine({ start: { x: xOff, y: startY - headerHeight + 2 }, end: { x: xOff, y: startY + 2 }, thickness: 0.7, color: rgb(0.62, 0.68, 0.76) });
        xOff += cw;
      }
      pg3.drawLine({ start: { x: marginX, y: startY - headerHeight + 2 }, end: { x: marginX + tableWidth, y: startY - headerHeight + 2 }, thickness: 0.7, color: rgb(0.62, 0.68, 0.76) });
      pg3.drawLine({ start: { x: marginX + tableWidth, y: startY - headerHeight + 2 }, end: { x: marginX + tableWidth, y: startY + 2 }, thickness: 0.7, color: rgb(0.62, 0.68, 0.76) });
      return startY - headerHeight - 4;
    }
    for (let r = 0; r < tableRows.length; r++) {
      if (y2 - rowHeights[r] < marginY + FOOTER_H + 20) {
        current = createPage();
        page = current.page;
        y2 = pageHeight - marginY - HEADER_H;
        if (r > 0) {
          y2 = drawHeaderRow(page, y2);
        }
      }
      if (r === 0) {
        y2 = drawHeaderRow(page, y2);
        continue;
      }
      const row = tableRows[r];
      const rowHeight = rowHeights[r];
      const rowY = y2;
      const isEvenDataRow = r % 2 === 0;
      let xOffset = marginX;
      for (let c = 0; c < colCount; c++) {
        const cell = row[c] ?? "";
        const cw = colWidths[c];
        if (isEvenDataRow) {
          page.drawRectangle({ x: xOffset, y: rowY - rowHeight + 2, width: cw, height: rowHeight, color: rgb(0.97, 0.98, 1) });
        }
        const cellLines = wrapText(cell, fontRegular, fontSize, cw - 8);
        let cellY = rowY - 6;
        for (const cellLine of cellLines) {
          page.drawText(cellLine, { x: xOffset + 4, y: cellY, size: fontSize, font: fontRegular, color: rgb(0.15, 0.15, 0.2) });
          cellY -= fontSize * 1.4;
        }
        page.drawLine({ start: { x: xOffset, y: rowY - rowHeight + 2 }, end: { x: xOffset, y: rowY + 2 }, thickness: 0.5, color: rgb(0.8, 0.8, 0.82) });
        xOffset += cw;
      }
      page.drawLine({ start: { x: marginX, y: rowY - rowHeight + 2 }, end: { x: marginX + tableWidth, y: rowY - rowHeight + 2 }, thickness: 0.5, color: rgb(0.8, 0.8, 0.82) });
      page.drawLine({ start: { x: marginX + tableWidth, y: rowY - rowHeight + 2 }, end: { x: marginX + tableWidth, y: rowY + 2 }, thickness: 0.5, color: rgb(0.8, 0.8, 0.82) });
      y2 = rowY - rowHeight - 4;
    }
    page.drawLine({ start: { x: marginX, y: y2 + 4 }, end: { x: marginX + tableWidth, y: y2 + 4 }, thickness: 0.7, color: rgb(0.62, 0.68, 0.76) });
    return y2 - 8;
  }
  let current = createPage();
  let y = pageHeight - marginY - HEADER_H;
  for (const block of blocks) {
    if (block.kind === "heading") {
      const minSpace = block.level === 2 ? 80 : 50;
      if (y < marginY + FOOTER_H + minSpace) {
        current = createPage();
        y = pageHeight - marginY - HEADER_H;
      }
      y = draw_section_heading(current.page, y, normalizeText2(block.text), block.level);
      continue;
    }
    if (y < marginY + FOOTER_H + 30) {
      current = createPage();
      y = pageHeight - marginY - HEADER_H;
    }
    if (block.kind === "paragraph") {
      y = draw_section_paragraph(current.page, y, normalizeText2(block.text), block.bold);
      continue;
    }
    if (block.kind === "table") {
      y = draw_section_table(
        current.page,
        y,
        block.rows.map((row) => row.map((cell) => normalizeText2(cell)))
      );
      continue;
    }
  }
  pages.forEach((entry, index) => {
    const pageNumberText = `${index + 1} / ${pages.length}`;
    entry.page.drawText(pageNumberText, {
      x: pageWidth - marginX - fontRegular.widthOfTextAtSize(pageNumberText, 6.5),
      y: FOOTER_H - 9,
      size: 6.5,
      font: fontRegular,
      color: rgb(0.75, 0.75, 0.78)
    });
  });
  return {
    report,
    buffer: Buffer.from(await pdf.save())
  };
}
async function generateComplianceReportPdf(options) {
  const report = generateComplianceReport(options);
  const docxBuffer = await buildDocxBuffer(options, report);
  let pdfBuffer = null;
  let renderMode = "template-native";
  try {
    pdfBuffer = await tryConvertDocxToNativePdf(docxBuffer);
  } catch (err) {
    pdfBuffer = null;
  }
  if (!pdfBuffer) {
    const { buffer } = await buildPdfBuffer(options, report);
    pdfBuffer = buffer;
    renderMode = "rendered";
  }
  return {
    reportId: report.reportId,
    generatedAt: report.generatedAt,
    title: report.title,
    templateName: ENV.reportTemplateName,
    fileName: fileNameFromReportId(report.reportId, "pdf"),
    mimeType: "application/pdf",
    renderMode,
    base64: pdfBuffer.toString("base64")
  };
}
async function generateComplianceReportDocx(options) {
  const report = generateComplianceReport(options);
  const buffer = await buildDocxBuffer(options, report);
  return {
    reportId: report.reportId,
    generatedAt: report.generatedAt,
    title: report.title,
    templateName: ENV.reportTemplateName,
    fileName: fileNameFromReportId(report.reportId, "docx"),
    mimeType: DOCX_MIME,
    base64: buffer.toString("base64")
  };
}
async function emailComplianceReport(input) {
  if (!ENV.smtpHost || !ENV.smtpFrom) {
    throw new Error("SMTP is not configured. Set SMTP_HOST and SMTP_FROM to enable report email delivery.");
  }
  const report = generateComplianceReport(input);
  const docxBuffer = await buildDocxBuffer(input, report);
  const nativePdfBuffer = await tryConvertDocxToNativePdf(docxBuffer);
  const pdfBuffer = nativePdfBuffer ?? (await buildPdfBuffer(input, report)).buffer;
  const pdfMode = nativePdfBuffer ? "template-native" : "rendered";
  const transporter = nodemailer2.createTransport({
    host: ENV.smtpHost,
    port: ENV.smtpPort,
    secure: ENV.smtpSecure,
    auth: ENV.smtpUser ? {
      user: ENV.smtpUser,
      pass: ENV.smtpPass
    } : void 0
  });
  const info = await transporter.sendMail({
    from: ENV.smtpFrom,
    to: input.recipientEmail,
    subject: `${report.title} (${report.reportId})`,
    text: `Please find attached the generated compliance report ${report.reportId}.

The authoritative attachment is the official Word-template document. A rendered PDF copy is also included for quick sharing.

PDF mode: ${pdfMode}
Template: ${ENV.reportTemplateName}
Generated at: ${report.generatedAt}
`,
    attachments: [
      {
        filename: fileNameFromReportId(report.reportId, "docx"),
        content: docxBuffer,
        contentType: DOCX_MIME
      },
      {
        filename: fileNameFromReportId(report.reportId, "pdf"),
        content: pdfBuffer,
        contentType: "application/pdf"
      }
    ]
  });
  return {
    success: true,
    reportId: report.reportId,
    generatedAt: report.generatedAt,
    templateName: ENV.reportTemplateName,
    pdfMode,
    messageId: info.messageId
  };
}

// server/report-share-store.ts
init_db();
init_schema();
import crypto from "node:crypto";
import { and as and6, eq as eq10, gt, lt as lt2 } from "drizzle-orm";
var memShares = /* @__PURE__ */ new Map();
function generateToken() {
  return crypto.randomBytes(24).toString("hex");
}
async function createReportShare(params) {
  const token = generateToken();
  const ttl = params.ttlSeconds ?? 7 * 24 * 3600;
  const expiresAt = new Date(Date.now() + ttl * 1e3);
  const now = /* @__PURE__ */ new Date();
  const db = await getDb();
  if (!db) {
    const record = {
      id: Date.now(),
      token,
      jurisdiction: params.jurisdiction,
      locale: params.locale,
      reportType: params.reportType,
      createdByUserId: params.createdByUserId ?? null,
      viewCount: 0,
      expiresAt,
      createdAt: now
    };
    memShares.set(token, { share: record, expiresAt });
    return record;
  }
  await db.insert(reportShares).values({
    token,
    jurisdiction: params.jurisdiction,
    locale: params.locale,
    reportType: params.reportType,
    createdByUserId: params.createdByUserId ?? null,
    viewCount: 0,
    expiresAt
  });
  const [row] = await db.select().from(reportShares).where(eq10(reportShares.token, token)).limit(1);
  return row;
}
async function getReportShareByToken(token) {
  if (!/^[0-9a-f]{48}$/.test(token)) return null;
  const now = /* @__PURE__ */ new Date();
  const db = await getDb();
  if (!db) {
    const entry = memShares.get(token);
    if (!entry || entry.expiresAt <= now) return null;
    entry.share = { ...entry.share, viewCount: entry.share.viewCount + 1 };
    return entry.share;
  }
  const [row] = await db.select().from(reportShares).where(
    and6(
      eq10(reportShares.token, token),
      gt(reportShares.expiresAt, now)
    )
  ).limit(1);
  if (!row) return null;
  void db.update(reportShares).set({ viewCount: row.viewCount + 1 }).where(eq10(reportShares.id, row.id)).catch(() => {
  });
  return row;
}

// server/compliance-framework-router.ts
var idSchema = z8.number().int().positive();
var complianceFrameworkRouter = router({
  frameworks: publicProcedure.query(async ({ ctx }) => {
    const { getAllFrameworks: getAllFrameworks2 } = await Promise.resolve().then(() => (init_compliance_db(), compliance_db_exports));
    const data = await getAllFrameworks2();
    void recordUserInteraction(ctx, {
      context: "compliance.frameworks",
      action: "frameworks_viewed",
      entityType: "framework",
      outputRef: { count: data.length }
    });
    return data;
  }),
  frameworksByCountry: publicProcedure.input(z8.string().trim().min(1)).query(async ({ ctx, input }) => {
    const { getFrameworksByCountry: getFrameworksByCountry2 } = await Promise.resolve().then(() => (init_compliance_db(), compliance_db_exports));
    const data = await getFrameworksByCountry2(input);
    void recordUserInteraction(ctx, {
      context: "compliance.frameworks",
      action: "frameworks_by_country_viewed",
      entityType: "framework",
      inputSnapshot: { country: input },
      outputRef: { count: data.length }
    });
    return data;
  }),
  controls: publicProcedure.input(idSchema).query(async ({ ctx, input }) => {
    const { getControlsByFramework: getControlsByFramework2 } = await Promise.resolve().then(() => (init_compliance_db(), compliance_db_exports));
    const data = await getControlsByFramework2(input);
    void recordUserInteraction(ctx, {
      context: "compliance.controls",
      action: "framework_controls_viewed",
      entityType: "framework",
      entityId: input,
      outputRef: { count: data.length }
    });
    return data;
  }),
  comparison: publicProcedure.input(
    z8.object({
      framework1Id: idSchema,
      framework2Id: idSchema
    })
  ).query(async ({ ctx, input }) => {
    const { getComplianceComparison: getComplianceComparison2 } = await Promise.resolve().then(() => (init_compliance_db(), compliance_db_exports));
    const data = await getComplianceComparison2(input.framework1Id, input.framework2Id);
    void recordUserInteraction(ctx, {
      context: "compliance.comparison",
      action: "framework_comparison_viewed",
      entityType: "framework",
      inputSnapshot: {
        framework1Id: input.framework1Id,
        framework2Id: input.framework2Id
      },
      outputRef: {
        relationships: data?.relationships?.length ?? null
      }
    });
    return data;
  }),
  matrix: publicProcedure.query(async ({ ctx }) => {
    const { getComplianceMatrix: getComplianceMatrix2 } = await Promise.resolve().then(() => (init_compliance_db(), compliance_db_exports));
    const data = await getComplianceMatrix2();
    void recordUserInteraction(ctx, {
      context: "compliance.matrix",
      action: "compliance_matrix_viewed",
      entityType: "framework",
      outputRef: { count: data.length }
    });
    return data;
  }),
  relationships: publicProcedure.input(idSchema).query(async ({ ctx, input }) => {
    const { getFrameworkRelationships: getFrameworkRelationships2 } = await Promise.resolve().then(() => (init_compliance_db(), compliance_db_exports));
    const data = await getFrameworkRelationships2(input);
    void recordUserInteraction(ctx, {
      context: "compliance.relationships",
      action: "framework_relationships_viewed",
      entityType: "framework",
      entityId: input,
      outputRef: { count: data.length }
    });
    return data;
  }),
  laws: publicProcedure.query(() => {
    return listLawKnowledge();
  }),
  lawBySlug: publicProcedure.input(z8.object({ slug: z8.string().trim().min(1).max(120) })).query(({ input }) => {
    return getLawKnowledgeBySlug(input.slug);
  }),
  lawsSearch: publicProcedure.input(
    z8.object({
      query: z8.string().trim().max(200).default(""),
      limit: z8.number().int().min(1).max(50).optional()
    })
  ).query(({ input }) => {
    return searchLawKnowledge(input.query, input.limit ?? 20);
  }),
  timetable: publicProcedure.query(() => {
    return listComplianceObligations();
  }),
  timetableByCountry: publicProcedure.input(z8.enum(["Saudi Arabia", "China"])).query(({ input }) => {
    return getObligationsByCountry(input);
  }),
  comparisonTable: publicProcedure.query(() => {
    return getComparisonTable();
  }),
  // report — requires authentication; anonymous access goes via reportByToken (share links)
  report: protectedProcedure.input(
    z8.object({
      jurisdiction: z8.enum(["Saudi Arabia", "China", "both"]),
      locale: z8.enum(["en", "ar", "zh"]).default("en"),
      reportType: z8.enum(["full_compliance", "gap_analysis", "vendor_assessment", "risk_assessment", "executive_summary", "regulatory_deadline"]).default("full_compliance").optional()
    })
  ).mutation(async ({ ctx, input }) => {
    await requireModulePermissionIfOrgContext(ctx, "report_center", "canView");
    const startedAt = Date.now();
    const report = generateComplianceReport({
      jurisdiction: input.jurisdiction,
      locale: input.locale,
      reportType: input.reportType
    });
    void recordUserInteraction(ctx, {
      context: "compliance.report",
      action: "compliance_report_generated",
      entityType: "compliance_report",
      inputSnapshot: {
        jurisdiction: input.jurisdiction,
        locale: input.locale
      },
      outputRef: {
        markdownLength: report.markdown.length
      },
      durationMs: Date.now() - startedAt
    });
    return report;
  }),
  reportPdf: protectedProcedure.input(
    z8.object({
      jurisdiction: z8.enum(["Saudi Arabia", "China", "both"]),
      locale: z8.enum(["en", "ar", "zh"]).default("en"),
      reportType: z8.enum(["full_compliance", "gap_analysis", "vendor_assessment", "risk_assessment", "executive_summary", "regulatory_deadline"]).default("full_compliance").optional()
    })
  ).mutation(async ({ ctx, input }) => {
    await requireModulePermissionIfOrgContext(ctx, "report_center", "canExport");
    const startedAt = Date.now();
    const pdf = await generateComplianceReportPdf({
      jurisdiction: input.jurisdiction,
      locale: input.locale,
      reportType: input.reportType
    });
    void recordUserInteraction(ctx, {
      context: "compliance.report",
      action: "compliance_report_pdf_generated",
      entityType: "compliance_report",
      inputSnapshot: {
        jurisdiction: input.jurisdiction,
        locale: input.locale
      },
      outputRef: {
        reportId: pdf.reportId,
        fileName: pdf.fileName
      },
      durationMs: Date.now() - startedAt
    });
    return pdf;
  }),
  reportDocx: protectedProcedure.input(
    z8.object({
      jurisdiction: z8.enum(["Saudi Arabia", "China", "both"]),
      locale: z8.enum(["en", "ar", "zh"]).default("en"),
      reportType: z8.enum(["full_compliance", "gap_analysis", "vendor_assessment", "risk_assessment", "executive_summary", "regulatory_deadline"]).default("full_compliance").optional()
    })
  ).mutation(async ({ ctx, input }) => {
    await requireModulePermissionIfOrgContext(ctx, "report_center", "canExport");
    const startedAt = Date.now();
    const docx = await generateComplianceReportDocx({
      jurisdiction: input.jurisdiction,
      locale: input.locale,
      reportType: input.reportType
    });
    void recordUserInteraction(ctx, {
      context: "compliance.report",
      action: "compliance_report_docx_generated",
      entityType: "compliance_report",
      inputSnapshot: {
        jurisdiction: input.jurisdiction,
        locale: input.locale
      },
      outputRef: {
        reportId: docx.reportId,
        fileName: docx.fileName
      },
      durationMs: Date.now() - startedAt
    });
    return docx;
  }),
  emailReport: protectedProcedure.input(
    z8.object({
      jurisdiction: z8.enum(["Saudi Arabia", "China", "both"]),
      locale: z8.enum(["en", "ar", "zh"]).default("en"),
      reportType: z8.enum(["full_compliance", "gap_analysis", "vendor_assessment", "risk_assessment", "executive_summary", "regulatory_deadline"]).default("full_compliance").optional(),
      recipientEmail: z8.string().trim().email().max(320)
    })
  ).mutation(async ({ ctx, input }) => {
    await requireModulePermissionIfOrgContext(ctx, "report_center", "canExport");
    const startedAt = Date.now();
    const delivery = await emailComplianceReport({
      jurisdiction: input.jurisdiction,
      locale: input.locale,
      reportType: input.reportType,
      recipientEmail: input.recipientEmail
    });
    void recordUserInteraction(ctx, {
      context: "compliance.report",
      action: "compliance_report_emailed",
      entityType: "compliance_report",
      inputSnapshot: {
        jurisdiction: input.jurisdiction,
        locale: input.locale,
        recipientEmail: input.recipientEmail
      },
      outputRef: {
        reportId: delivery.reportId,
        messageId: delivery.messageId
      },
      durationMs: Date.now() - startedAt
    });
    return delivery;
  }),
  createShareLink: protectedProcedure.input(
    z8.object({
      jurisdiction: z8.enum(["Saudi Arabia", "China", "both"]),
      locale: z8.enum(["en", "ar", "zh"]).default("en"),
      reportType: z8.enum(["full_compliance", "gap_analysis", "vendor_assessment", "risk_assessment", "executive_summary", "regulatory_deadline"]).default("full_compliance"),
      ttlDays: z8.number().int().min(1).max(30).default(7)
    })
  ).mutation(async ({ ctx, input }) => {
    await requireModulePermissionIfOrgContext(ctx, "report_center", "canExport");
    const share = await createReportShare({
      jurisdiction: input.jurisdiction,
      locale: input.locale,
      reportType: input.reportType,
      createdByUserId: ctx.user?.id ?? null,
      ttlSeconds: input.ttlDays * 86400
    });
    return { token: share.token, expiresAt: share.expiresAt };
  }),
  reportByToken: publicProcedure.input(z8.object({ token: z8.string().regex(/^[0-9a-f]{48}$/) })).query(async ({ input }) => {
    const share = await getReportShareByToken(input.token);
    if (!share) {
      throw new Error("SHARE_NOT_FOUND");
    }
    const report = generateComplianceReport({
      jurisdiction: share.jurisdiction,
      locale: share.locale,
      reportType: share.reportType
    });
    return {
      ...report,
      shareToken: share.token,
      shareExpiresAt: share.expiresAt,
      shareViewCount: share.viewCount,
      jurisdiction: share.jurisdiction,
      locale: share.locale
    };
  })
});

// server/vendor-router.ts
import { TRPCError as TRPCError7 } from "@trpc/server";
import { z as z9 } from "zod";
init_supplier_assessment();
var idSchema2 = z9.number().int().positive();
var vendorTechStackComponentSchema = z9.object({
  componentName: z9.string().trim().min(2, "Component name must be at least 2 characters").max(255),
  componentType: z9.string().trim().min(2, "Component type must be at least 2 characters").max(120),
  technology: z9.string().trim().min(1).max(255),
  description: z9.string().trim().max(1e3).optional().default(""),
  dataHandling: z9.string().trim().max(1e3).optional().default("")
});
var vendorInputSchema = z9.object({
  vendorName: z9.string().trim().min(2, "Vendor name must be at least 2 characters").max(255),
  vendorDescription: z9.string().trim().min(20).max(2e3),
  industry: z9.enum(vendorIndustryValues),
  businessRegistrationNumber: z9.string().trim().min(3).max(120),
  headquartersLocation: z9.enum(vendorCountryValues),
  primaryContactName: z9.string().trim().min(2, "Contact name must be at least 2 characters").max(255),
  primaryContactEmail: z9.string().trim().email().max(320),
  primaryContactRole: z9.string().trim().min(2, "Contact role must be at least 2 characters").max(120),
  primaryContactPhone: z9.string().trim().max(64).optional().default(""),
  serviceType: z9.enum(vendorServiceTypeValues),
  serviceScope: z9.string().trim().min(10).max(2e3),
  hostingEnvironment: z9.enum(vendorHostingEnvironmentValues),
  cloudProviders: z9.array(z9.enum(vendorCloudProviderValues)).max(6).default([]),
  operatingCountries: z9.array(z9.enum(vendorCountryValues)).min(1).max(10),
  dataLocations: z9.array(z9.enum(vendorCountryValues)).min(1).max(10),
  regulatoryJurisdictions: z9.array(z9.enum(vendorJurisdictionValues)).min(1).max(6),
  certifications: z9.array(z9.enum(vendorComplianceStandardValues)).max(10).default([]),
  dataProcessingActivities: z9.array(z9.enum(vendorDataProcessingActivityValues)).min(1).max(10),
  criticalityLevel: z9.enum(vendorCriticalityLevelValues),
  riskTier: z9.enum(vendorRiskTierValues),
  thirdPartyDependencies: z9.enum(vendorDependencyLevelValues),
  fourthPartyDependencies: z9.enum(vendorDependencyLevelValues),
  techStackComponents: z9.array(vendorTechStackComponentSchema).max(20).default([])
}).superRefine((input, ctx) => {
  if (["single-public-cloud", "multi-cloud", "hybrid"].includes(input.hostingEnvironment) && input.cloudProviders.length === 0) {
    ctx.addIssue({
      code: z9.ZodIssueCode.custom,
      message: "At least one cloud provider is required for public-cloud or hybrid hosting.",
      path: ["cloudProviders"]
    });
  }
});
var vendorRouter = router({
  list: orgProcedure.query(async ({ ctx }) => {
    await requireModulePermission(ctx, "vendor_assessment", "canView");
    return listVendorProfiles(ctx.user.id, ctx.organizationId);
  }),
  create: orgProcedure.input(vendorInputSchema).mutation(async ({ ctx, input }) => {
    await requireModulePermission(ctx, "vendor_assessment", "canCreate");
    const startedAt = Date.now();
    const vendor = await createVendorProfile(ctx.user.id, input, ctx.organizationId);
    void recordAuditEvent(ctx, {
      category: "data_write",
      action: "vendor.create",
      entityType: "vendors",
      entityId: vendor.id,
      payload: {
        vendorName: vendor.vendorName,
        serviceType: vendor.serviceType,
        criticalityLevel: vendor.criticalityLevel,
        riskTier: vendor.riskTier,
        cloudProviders: vendor.cloudProvider,
        dataLocations: vendor.dataLocations,
        certifications: vendor.certifications
      }
    });
    void recordActivity({
      userId: ctx.user.id,
      actorType: hasMinRole(ctx.user.role, "admin") ? "admin" : "client",
      action: "vendor_profile_created",
      entityType: "vendor",
      entityId: vendor.id,
      metadata: {
        vendorName: vendor.vendorName,
        riskTier: vendor.riskTier,
        techStackCount: input.techStackComponents.length
      }
    }).catch((error) => {
      console.warn("[Activity] Failed to record vendor_profile_created", error);
    });
    void recordUserInteraction(ctx, {
      context: "vendor.profile",
      action: "vendor_created",
      entityType: "vendor",
      entityId: vendor.id,
      inputSnapshot: {
        vendorName: vendor.vendorName,
        serviceType: vendor.serviceType,
        riskTier: vendor.riskTier
      },
      outputRef: { success: true },
      durationMs: Date.now() - startedAt
    });
    return { success: true, vendor };
  }),
  patch: orgProcedure.input(
    z9.object({
      vendorId: idSchema2,
      vendorName: z9.string().trim().min(2, "Vendor name must be at least 2 characters").max(255),
      vendorDescription: z9.string().trim().min(20).max(2e3),
      criticalityLevel: z9.enum(vendorCriticalityLevelValues),
      riskTier: z9.enum(vendorRiskTierValues),
      primaryContactName: z9.string().trim().min(2, "Contact name must be at least 2 characters").max(255),
      primaryContactEmail: z9.string().trim().email().max(320),
      primaryContactRole: z9.string().trim().min(2, "Contact role must be at least 2 characters").max(120),
      primaryContactPhone: z9.string().trim().max(64).optional().default("")
    })
  ).mutation(async ({ ctx, input }) => {
    await requireModulePermission(ctx, "vendor_assessment", "canEdit");
    const { vendorId, ...patch } = input;
    const existing = await getVendorProfileById(vendorId, ctx.user.id, ctx.organizationId);
    if (!existing) {
      throw new TRPCError7({ code: "NOT_FOUND", message: "Vendor not found." });
    }
    const vendor = await patchVendorBasicFields(vendorId, ctx.user.id, patch, ctx.organizationId);
    void recordAuditEvent(ctx, {
      category: "data_write",
      action: "vendor_updated",
      entityType: "vendors",
      entityId: vendor.id,
      payload: { vendorName: vendor.vendorName, riskTier: vendor.riskTier }
    });
    return { success: true, vendor };
  }),
  delete: orgProcedure.input(z9.object({ vendorId: idSchema2 })).mutation(async ({ ctx, input }) => {
    await requireModulePermission(ctx, "vendor_assessment", "canDelete");
    const existing = await getVendorProfileById(input.vendorId, ctx.user.id, ctx.organizationId);
    if (!existing) {
      throw new TRPCError7({ code: "NOT_FOUND", message: "Vendor not found." });
    }
    await deleteVendorProfile(input.vendorId, ctx.user.id, ctx.organizationId);
    void recordAuditEvent(ctx, {
      category: "data_write",
      action: "vendor_deleted",
      entityType: "vendors",
      entityId: input.vendorId,
      payload: { vendorName: existing.vendorName }
    });
    return { success: true };
  }),
  assess: activeOrgProcedure.input(
    z9.object({
      vendorId: idSchema2
    })
  ).mutation(async ({ ctx, input }) => {
    await requireModulePermission(ctx, "vendor_assessment", "canCreate");
    const startedAt = Date.now();
    const vendor = await getVendorProfileById(input.vendorId, ctx.user.id, ctx.organizationId);
    if (!vendor) {
      throw new Error("Vendor not found");
    }
    const orchestration = await runAssessmentSync({
      userId: ctx.user.id,
      source: "vendor_profile",
      vendor,
      persistResult: true
    });
    const assessment = orchestration.report.assessment;
    void recordAuditEvent(ctx, {
      category: "data_write",
      action: "vendor.assess",
      entityType: "vendors",
      entityId: vendor.id,
      payload: {
        jobId: orchestration.job.id,
        overallScore: assessment.overallScore,
        riskLevel: assessment.riskLevel,
        gapCount: assessment.gaps.length
      }
    });
    void recordActivity({
      userId: ctx.user.id,
      actorType: hasMinRole(ctx.user.role, "admin") ? "admin" : "client",
      action: "assessment_completed",
      entityType: "vendor_assessment",
      entityId: vendor.id,
      metadata: {
        vendorName: vendor.vendorName,
        overallScore: assessment.overallScore,
        riskLevel: assessment.riskLevel,
        gapCount: assessment.gaps.length
      }
    }).catch((error) => {
      console.warn("[Activity] Failed to record assessment_completed", error);
    });
    void createAdminNotification({
      category: "assessment",
      title: `Assessment completed for ${vendor.vendorName}`,
      content: `Risk level ${assessment.riskLevel} with ${assessment.gaps.length} mapped gaps.`,
      entityType: "vendor_assessment",
      entityId: vendor.id
    }).catch((error) => {
      console.warn("[Notification] Failed to create assessment notification", error);
    });
    void recordUserInteraction(ctx, {
      context: "vendor.assessment",
      action: "vendor_assessment_completed",
      entityType: "vendor",
      entityId: vendor.id,
      inputSnapshot: { vendorId: vendor.id },
      outputRef: {
        overallScore: assessment.overallScore,
        riskLevel: assessment.riskLevel,
        gapCount: assessment.gaps.length
      },
      durationMs: Date.now() - startedAt
    });
    return assessment;
  }),
  assessDraft: activeOrgProcedure.input(vendorInputSchema).mutation(async ({ ctx, input }) => {
    await requireModulePermission(ctx, "vendor_assessment", "canCreate");
    const draftVendor = {
      id: 0,
      userId: ctx.user.id,
      organizationId: null,
      vendorName: input.vendorName,
      vendorDescription: input.vendorDescription,
      industry: input.industry,
      businessRegistrationNumber: input.businessRegistrationNumber,
      headquartersLocation: input.headquartersLocation,
      primaryContactName: input.primaryContactName,
      primaryContactEmail: input.primaryContactEmail,
      primaryContactRole: input.primaryContactRole,
      primaryContactPhone: input.primaryContactPhone || null,
      serviceType: input.serviceType,
      serviceScope: input.serviceScope,
      hostingEnvironment: input.hostingEnvironment,
      operatingCountries: serializeVendorMultiValue(input.operatingCountries),
      cloudProvider: serializeVendorMultiValue(input.cloudProviders),
      dataLocations: serializeVendorMultiValue(input.dataLocations),
      regulatoryJurisdictions: serializeVendorMultiValue(input.regulatoryJurisdictions),
      certifications: serializeVendorMultiValue(input.certifications),
      dataProcessingActivities: serializeVendorMultiValue(input.dataProcessingActivities),
      criticalityLevel: input.criticalityLevel,
      riskTier: input.riskTier,
      thirdPartyDependencies: input.thirdPartyDependencies,
      fourthPartyDependencies: input.fourthPartyDependencies,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    const orchestration = await runAssessmentSync({
      userId: ctx.user.id,
      source: "vendor_profile",
      vendor: draftVendor,
      persistResult: false
    });
    return orchestration.report.assessment;
  }),
  report: activeOrgProcedure.input(
    z9.object({
      vendorId: idSchema2,
      format: z9.enum(["csv", "json"]).default("csv")
    })
  ).mutation(async ({ ctx, input }) => {
    await requireModulePermission(ctx, "vendor_assessment", "canExport");
    const startedAt = Date.now();
    const vendor = await getVendorProfileById(input.vendorId, ctx.user.id, ctx.organizationId);
    if (!vendor) {
      throw new Error("Vendor not found");
    }
    const orchestration = await runAssessmentSync({
      userId: ctx.user.id,
      source: "vendor_profile",
      vendor,
      persistResult: true
    });
    const assessment = orchestration.report.assessment;
    const baseName = `vendor_${vendor.id}_assessment_${Date.now()}`;
    const content = input.format === "json" ? JSON.stringify(
      {
        vendor,
        assessment,
        report: orchestration.report,
        jobId: orchestration.job.id
      },
      null,
      2
    ) : buildAssessmentCsv(vendor, assessment);
    const fileName = `${baseName}.${input.format}`;
    void recordAuditEvent(ctx, {
      category: "data_read",
      action: "report.export.assessment",
      entityType: "vendors",
      entityId: vendor.id,
      payload: {
        jobId: orchestration.job.id,
        format: input.format,
        overallScore: assessment.overallScore
      }
    });
    void recordActivity({
      userId: ctx.user.id,
      actorType: hasMinRole(ctx.user.role, "admin") ? "admin" : "client",
      action: "assessment_report_exported",
      entityType: "vendor_assessment",
      entityId: vendor.id,
      metadata: {
        vendorName: vendor.vendorName,
        format: input.format,
        overallScore: assessment.overallScore
      }
    }).catch((error) => {
      console.warn("[Activity] Failed to record assessment_report_exported", error);
    });
    void recordUserInteraction(ctx, {
      context: "vendor.report",
      action: "assessment_report_exported",
      entityType: "vendor",
      entityId: vendor.id,
      inputSnapshot: { vendorId: vendor.id, format: input.format },
      outputRef: { fileName, overallScore: assessment.overallScore },
      durationMs: Date.now() - startedAt
    });
    return {
      fileName,
      format: input.format,
      content,
      assessment
    };
  }),
  gapSummary: orgProcedure.query(async ({ ctx }) => {
    await requireModulePermission(ctx, "vendor_assessment", "canView");
    const { runDualJurisdictionAssessment: runDualJurisdictionAssessment2 } = await Promise.resolve().then(() => (init_supplier_assessment(), supplier_assessment_exports));
    const vendors2 = await listVendorProfiles(ctx.user.id, ctx.organizationId);
    return vendors2.map((v) => ({
      vendor: {
        id: v.id,
        vendorName: v.vendorName,
        riskTier: v.riskTier,
        criticalityLevel: v.criticalityLevel,
        headquartersLocation: v.headquartersLocation
      },
      assessment: runDualJurisdictionAssessment2(v)
    }));
  }),
  bulkAssess: activeOrgProcedure.input(
    z9.object({
      vendorIds: z9.array(idSchema2).min(1).max(50)
    })
  ).mutation(async ({ ctx, input }) => {
    await requireModulePermission(ctx, "vendor_assessment", "canCreate");
    const queued = [];
    const errors = [];
    for (const vendorId of input.vendorIds) {
      try {
        const vendor = await getVendorProfileById(vendorId, ctx.user.id, ctx.organizationId);
        if (!vendor) {
          errors.push({ vendorId, error: "Vendor not found" });
          continue;
        }
        const job = await enqueueAssessmentJob({
          userId: ctx.user.id,
          source: "vendor_profile",
          vendor,
          rawDocumentText: "",
          persistResult: true
        });
        queued.push({ vendorId, jobId: job.id });
      } catch (err) {
        errors.push({
          vendorId,
          error: err instanceof Error ? err.message : "Unknown error"
        });
      }
    }
    void recordAuditEvent(ctx, {
      category: "data_write",
      action: "vendor.bulkAssess",
      entityType: "vendor_assessment",
      payload: {
        vendorIds: input.vendorIds,
        queuedCount: queued.length,
        errorCount: errors.length
      }
    });
    return { queued, errors };
  }),
  getDetail: orgProcedure.input(z9.number().int().positive()).query(async ({ ctx, input }) => {
    await requireModulePermission(ctx, "vendor_assessment", "canView");
    const { runDualJurisdictionAssessment: runDualJurisdictionAssessment2 } = await Promise.resolve().then(() => (init_supplier_assessment(), supplier_assessment_exports));
    const vendor = await getVendorProfileById(input, ctx.user.id, ctx.organizationId);
    if (!vendor) {
      throw new TRPCError7({ code: "NOT_FOUND", message: "Vendor not found." });
    }
    const techStack = await listTechStackComponentsByVendorId(vendor.id);
    const assessment = runDualJurisdictionAssessment2(vendor);
    return { vendor, techStack, assessment };
  })
});

// server/deadline-router.ts
import { z as z10 } from "zod";

// server/deadline-store.ts
init_db();
init_schema();
import { and as and8, eq as eq12, isNull as isNull2, desc as desc4, or as or4 } from "drizzle-orm";
var NOW = /* @__PURE__ */ new Date("2026-03-23T00:00:00Z");
var d = (offsetDays) => new Date(NOW.getTime() + offsetDays * 864e5);
var GLOBAL_DEADLINES = [
  {
    id: 1,
    organizationId: null,
    frameworkCode: "PIPL",
    title: "PIPL Annual Personal Information Protection Impact Assessment",
    description: "Submit annual PIIA report to the Cyberspace Administration of China (CAC). Required for large-scale personal data processors.",
    deadlineDate: d(20),
    jurisdiction: "China",
    priority: "critical",
    status: "upcoming",
    notificationsSent: null,
    assignedToUserId: null,
    completedAt: null,
    createdAt: NOW,
    updatedAt: NOW
  },
  {
    id: 2,
    organizationId: null,
    frameworkCode: "CSL",
    title: "MLPS Level 2/3 Annual Security Assessment Submission",
    description: "Multi-Level Protection Scheme annual review must be submitted to provincial security bureaus. MLPS 2.0 requirements apply.",
    deadlineDate: d(45),
    jurisdiction: "China",
    priority: "high",
    status: "upcoming",
    notificationsSent: null,
    assignedToUserId: null,
    completedAt: null,
    createdAt: NOW,
    updatedAt: NOW
  },
  {
    id: 3,
    organizationId: null,
    frameworkCode: "DSL",
    title: "DSL Data Classification Annual Report",
    description: "Submit annual data classification and grading report as required under China Data Security Law Article 21.",
    deadlineDate: d(60),
    jurisdiction: "China",
    priority: "high",
    status: "upcoming",
    notificationsSent: null,
    assignedToUserId: null,
    completedAt: null,
    createdAt: NOW,
    updatedAt: NOW
  },
  {
    id: 4,
    organizationId: null,
    frameworkCode: "PIPL",
    title: "PIPL Cross-Border Data Transfer Standard Contract Filing",
    description: "Standard contract for cross-border personal data transfers must be filed with CAC within 10 days of contract execution.",
    deadlineDate: d(7),
    jurisdiction: "China",
    priority: "critical",
    status: "upcoming",
    notificationsSent: null,
    assignedToUserId: null,
    completedAt: null,
    createdAt: NOW,
    updatedAt: NOW
  },
  {
    id: 5,
    organizationId: null,
    frameworkCode: "PDPL",
    title: "PDPL Personal Data Processing Activity Registration",
    description: "Register all personal data processing activities with SDAIA's National Data Management Office as required by PDPL Article 7.",
    deadlineDate: d(15),
    jurisdiction: "Saudi Arabia",
    priority: "critical",
    status: "upcoming",
    notificationsSent: null,
    assignedToUserId: null,
    completedAt: null,
    createdAt: NOW,
    updatedAt: NOW
  },
  {
    id: 6,
    organizationId: null,
    frameworkCode: "NCA",
    title: "NCA Essential Cybersecurity Controls (ECC) Annual Self-Assessment",
    description: "Submit annual ECC compliance self-assessment to the National Cybersecurity Authority. Mandatory for all government entities and critical infrastructure operators.",
    deadlineDate: d(30),
    jurisdiction: "Saudi Arabia",
    priority: "critical",
    status: "upcoming",
    notificationsSent: null,
    assignedToUserId: null,
    completedAt: null,
    createdAt: NOW,
    updatedAt: NOW
  },
  {
    id: 7,
    organizationId: null,
    frameworkCode: "NCA",
    title: "NCA Cloud Cybersecurity Controls (CCC) Compliance Report",
    description: "Annual compliance report against NCA Cloud Cybersecurity Controls for organizations using cloud services in Saudi Arabia.",
    deadlineDate: d(75),
    jurisdiction: "Saudi Arabia",
    priority: "high",
    status: "upcoming",
    notificationsSent: null,
    assignedToUserId: null,
    completedAt: null,
    createdAt: NOW,
    updatedAt: NOW
  },
  {
    id: 8,
    organizationId: null,
    frameworkCode: "PDPL",
    title: "PDPL Data Breach Notification \u2014 72-Hour Window",
    description: "Any personal data breach must be reported to SDAIA within 72 hours of discovery. Ensure incident response plan is tested quarterly.",
    deadlineDate: d(-5),
    jurisdiction: "Saudi Arabia",
    priority: "critical",
    status: "overdue",
    notificationsSent: null,
    assignedToUserId: null,
    completedAt: null,
    createdAt: NOW,
    updatedAt: NOW
  },
  {
    id: 9,
    organizationId: null,
    frameworkCode: "CSL",
    title: "CSL Network Security Emergency Response Plan Annual Drill",
    description: "Network operators must conduct an annual emergency response drill and submit the drill report to competent authorities.",
    deadlineDate: d(-10),
    jurisdiction: "China",
    priority: "medium",
    status: "overdue",
    notificationsSent: null,
    assignedToUserId: null,
    completedAt: null,
    createdAt: NOW,
    updatedAt: NOW
  },
  {
    id: 10,
    organizationId: null,
    frameworkCode: "NCA",
    title: "NCA Operational Technology Cybersecurity Controls (OTCC) Assessment",
    description: "Annual cybersecurity assessment for OT systems per NCA OTCC-1 framework. Required for energy, utilities and critical national infrastructure.",
    deadlineDate: d(90),
    jurisdiction: "Saudi Arabia",
    priority: "high",
    status: "upcoming",
    notificationsSent: null,
    assignedToUserId: null,
    completedAt: null,
    createdAt: NOW,
    updatedAt: NOW
  }
];
var memoryDeadlines = [...GLOBAL_DEADLINES];
var nextId = GLOBAL_DEADLINES.length + 1;
async function listDeadlines(filters = {}) {
  const db = await getDb();
  const limit = filters.limit ?? 200;
  if (!db) {
    let rows2 = [...memoryDeadlines];
    if (filters.status) rows2 = rows2.filter((r) => r.status === filters.status);
    if (filters.jurisdiction) rows2 = rows2.filter((r) => r.jurisdiction === filters.jurisdiction || r.jurisdiction === "Both");
    if (filters.frameworkCode) rows2 = rows2.filter((r) => r.frameworkCode === filters.frameworkCode);
    if (filters.organizationId != null) {
      rows2 = rows2.filter((r) => r.organizationId === filters.organizationId || r.organizationId === null);
    }
    return rows2.slice(0, limit);
  }
  const conditions = [];
  if (filters.status) conditions.push(eq12(complianceDeadlines.status, filters.status));
  if (filters.jurisdiction) conditions.push(eq12(complianceDeadlines.jurisdiction, filters.jurisdiction));
  if (filters.frameworkCode) conditions.push(eq12(complianceDeadlines.frameworkCode, filters.frameworkCode));
  if (filters.organizationId != null) {
    conditions.push(
      or4(
        eq12(complianceDeadlines.organizationId, filters.organizationId),
        isNull2(complianceDeadlines.organizationId)
      )
    );
  }
  const rows = await db.select().from(complianceDeadlines).where(conditions.length > 0 ? and8(...conditions) : void 0).orderBy(desc4(complianceDeadlines.deadlineDate)).limit(limit);
  return rows;
}
async function createDeadline(input) {
  const db = await getDb();
  const now = /* @__PURE__ */ new Date();
  const isOverdue = input.deadlineDate < now;
  if (!db) {
    const record = {
      id: nextId++,
      organizationId: input.organizationId ?? null,
      frameworkCode: input.frameworkCode,
      title: input.title.trim(),
      description: input.description?.trim() ?? null,
      deadlineDate: input.deadlineDate,
      jurisdiction: input.jurisdiction,
      priority: input.priority ?? "medium",
      status: isOverdue ? "overdue" : "upcoming",
      notificationsSent: null,
      assignedToUserId: input.assignedToUserId ?? null,
      completedAt: null,
      createdAt: now,
      updatedAt: now
    };
    memoryDeadlines.push(record);
    return record;
  }
  const values = {
    organizationId: input.organizationId ?? null,
    frameworkCode: input.frameworkCode,
    title: input.title.trim(),
    description: input.description?.trim() ?? null,
    deadlineDate: input.deadlineDate,
    jurisdiction: input.jurisdiction,
    priority: input.priority ?? "medium",
    status: isOverdue ? "overdue" : "upcoming",
    assignedToUserId: input.assignedToUserId ?? null
  };
  const [inserted] = await db.insert(complianceDeadlines).values(values).returning({ id: complianceDeadlines.id });
  const id = inserted?.id ?? 0;
  const [row] = await db.select().from(complianceDeadlines).where(eq12(complianceDeadlines.id, id)).limit(1);
  return row;
}
async function completeDeadline(id, organizationId) {
  const db = await getDb();
  const now = /* @__PURE__ */ new Date();
  if (!db) {
    const idx = memoryDeadlines.findIndex((d2) => d2.id === id && (d2.organizationId === organizationId || d2.organizationId === null));
    if (idx < 0) return null;
    memoryDeadlines[idx] = { ...memoryDeadlines[idx], status: "completed", completedAt: now, updatedAt: now };
    return memoryDeadlines[idx];
  }
  const whereClause = organizationId != null ? and8(eq12(complianceDeadlines.id, id), eq12(complianceDeadlines.organizationId, organizationId)) : eq12(complianceDeadlines.id, id);
  await db.update(complianceDeadlines).set({ status: "completed", completedAt: now }).where(whereClause);
  const [row] = await db.select().from(complianceDeadlines).where(eq12(complianceDeadlines.id, id)).limit(1);
  return row ?? null;
}
async function getDeadlineSummary(organizationId) {
  const all = await listDeadlines({ organizationId, limit: 1e3 });
  return {
    total: all.length,
    upcoming: all.filter((d2) => d2.status === "upcoming").length,
    overdue: all.filter((d2) => d2.status === "overdue").length,
    completed: all.filter((d2) => d2.status === "completed").length,
    critical: all.filter((d2) => d2.priority === "critical" && d2.status !== "completed").length
  };
}
async function listOrgMembersForDeadlines(organizationId) {
  if (!organizationId || organizationId < 0) return [];
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({
    userId: organizationMembers.userId,
    role: organizationMembers.role,
    userName: users.name,
    userEmail: users.email
  }).from(organizationMembers).leftJoin(users, eq12(organizationMembers.userId, users.id)).where(
    and8(
      eq12(organizationMembers.organizationId, organizationId),
      eq12(organizationMembers.status, "active")
    )
  );
  return rows.filter((r) => r.userId !== null).map((r) => ({
    id: r.userId,
    name: r.userName ?? r.userEmail ?? `User ${r.userId}`,
    email: r.userEmail ?? "",
    role: r.role
  }));
}

// server/deadline-router.ts
var deadlineRouter = router({
  list: protectedProcedure.input(
    z10.object({
      jurisdiction: z10.enum(["China", "Saudi Arabia", "Both"]).optional(),
      status: z10.enum(["upcoming", "overdue", "completed", "waived"]).optional(),
      frameworkCode: z10.string().optional(),
      limit: z10.number().int().min(1).max(500).optional()
    }).optional()
  ).query(async ({ ctx, input }) => {
    await requireModulePermissionIfOrgContext(ctx, "compliance_calendar", "canView");
    return listDeadlines({
      organizationId: ctx.organizationId ?? void 0,
      includeGlobal: true,
      ...input
    });
  }),
  summary: protectedProcedure.query(async ({ ctx }) => {
    await requireModulePermissionIfOrgContext(ctx, "compliance_calendar", "canView");
    return getDeadlineSummary(ctx.organizationId ?? void 0);
  }),
  create: protectedProcedure.input(
    z10.object({
      frameworkCode: z10.string().trim().min(1).max(50),
      title: z10.string().trim().min(3).max(255),
      description: z10.string().trim().max(2e3).optional(),
      deadlineDate: z10.string().datetime(),
      jurisdiction: z10.enum(["China", "Saudi Arabia", "Both"]),
      priority: z10.enum(["low", "medium", "high", "critical"]).optional(),
      assignedToUserId: z10.number().int().positive().optional()
    })
  ).mutation(async ({ ctx, input }) => {
    await requireModulePermissionIfOrgContext(ctx, "compliance_calendar", "canCreate");
    return createDeadline({
      organizationId: ctx.organizationId ?? null,
      frameworkCode: input.frameworkCode,
      title: input.title,
      description: input.description,
      deadlineDate: new Date(input.deadlineDate),
      jurisdiction: input.jurisdiction,
      priority: input.priority,
      assignedToUserId: input.assignedToUserId ?? ctx.user?.id ?? null
    });
  }),
  complete: protectedProcedure.input(z10.number().int().positive()).mutation(async ({ input, ctx }) => {
    await requireModulePermissionIfOrgContext(ctx, "compliance_calendar", "canEdit");
    return completeDeadline(input, ctx.organizationId);
  }),
  orgMembers: protectedProcedure.query(async ({ ctx }) => {
    await requireModulePermissionIfOrgContext(ctx, "compliance_calendar", "canView");
    return listOrgMembersForDeadlines(ctx.organizationId);
  })
});

// server/auth-router.ts
import { z as z11 } from "zod";
var authRouter = router({
  me: publicProcedure.query((opts) => opts.ctx.user),
  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions3 = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions3, maxAge: -1 });
    return { success: true };
  }),
  updateProfile: protectedProcedure.input(
    z11.object({
      name: z11.string().trim().min(2, "Name must be at least 2 characters").max(255).optional(),
      email: z11.string().trim().email().max(320).optional(),
      organizationName: z11.string().trim().max(255).optional(),
      organizationType: z11.string().trim().max(120).optional(),
      jobTitle: z11.string().trim().max(120).optional(),
      preferredLocale: z11.enum(["en", "ar", "zh"]).optional()
    })
  ).mutation(async ({ ctx, input }) => {
    const touchesOrgProfile = input.organizationName !== void 0 || input.organizationType !== void 0;
    if (touchesOrgProfile) {
      await requireModulePermissionIfOrgContext(ctx, "org_settings", "canEdit");
    }
    return saveUserProfile(ctx.user.id, input);
  })
});

// server/role-router.ts
import { z as z12 } from "zod";
import { TRPCError as TRPCError8 } from "@trpc/server";

// server/role-store.ts
init_schema();
init_db();
import { and as and9, desc as desc5, eq as eq13 } from "drizzle-orm";
async function listUsersWithRoles(limit, offset) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: users.id,
    name: users.name,
    email: users.email,
    role: users.role,
    status: users.status,
    createdAt: users.createdAt,
    lastSignedIn: users.lastSignedIn
  }).from(users).limit(limit).offset(offset);
}
async function assignUserRole(targetUserId, newRole) {
  const db = await getDb();
  if (!db) return null;
  const [target] = await db.select({ id: users.id, name: users.name, email: users.email, role: users.role }).from(users).where(eq13(users.id, targetUserId)).limit(1);
  if (!target) return null;
  await db.update(users).set({ role: newRole, updatedAt: /* @__PURE__ */ new Date() }).where(eq13(users.id, targetUserId));
  return target;
}
async function assignLocalUserRole(targetLocalUserId, newUserType) {
  const db = await getDb();
  if (!db) return null;
  const [target] = await db.select({ id: localUsers.id, name: localUsers.name, email: localUsers.email, userType: localUsers.userType }).from(localUsers).where(eq13(localUsers.id, targetLocalUserId)).limit(1);
  if (!target) return null;
  await db.update(localUsers).set({ userType: newUserType, updatedAt: /* @__PURE__ */ new Date() }).where(eq13(localUsers.id, targetLocalUserId));
  return target;
}
async function listAuditLogs(limit, offset, category, outcome) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (category) conditions.push(eq13(auditLogs.category, category));
  if (outcome) conditions.push(eq13(auditLogs.outcome, outcome));
  return db.select().from(auditLogs).where(conditions.length > 0 ? and9(...conditions) : void 0).orderBy(desc5(auditLogs.createdAt)).limit(limit).offset(offset);
}

// server/role-router.ts
var platformRoleSchema = z12.enum([
  "user",
  "admin",
  "basic_user",
  "professional_user",
  "company_admin",
  "platform_admin",
  "yalla_hack_employee",
  "super_admin"
]);
var roleRouter = router({
  /**
   * Get the platform role of the currently-authenticated user.
   * Available to all authenticated users.
   */
  myRole: protectedProcedure.query(({ ctx }) => {
    return {
      role: ctx.user.role,
      organizationRole: ctx.organizationRole ?? null
    };
  }),
  /**
   * List all users with their roles.
   * Restricted to Platform Admin and above.
   */
  listUsersWithRoles: platformAdminProcedure.input(z12.object({ limit: z12.number().int().min(1).max(500).default(100), offset: z12.number().int().min(0).default(0) })).query(async ({ input }) => {
    return listUsersWithRoles(input.limit, input.offset);
  }),
  /**
   * Assign a new platform role to a user (OAuth user).
   * - Platform Admin can assign up to and including company_admin.
   * - Super Admin can assign any role.
   * Cannot self-demote from super_admin.
   */
  assignUserRole: platformAdminProcedure.input(
    z12.object({
      targetUserId: z12.number().int().positive(),
      newRole: platformRoleSchema
    })
  ).mutation(async ({ ctx, input }) => {
    const actorRole = ctx.user.role;
    if (!hasMinRole(actorRole, "super_admin") && (input.newRole === "super_admin" || input.newRole === "yalla_hack_employee")) {
      throw new TRPCError8({
        code: "FORBIDDEN",
        message: NOT_PLATFORM_ADMIN_ERR_MSG
      });
    }
    if (input.targetUserId === ctx.user.id && !hasMinRole(input.newRole, actorRole)) {
      throw new TRPCError8({
        code: "FORBIDDEN",
        message: "You cannot demote your own role."
      });
    }
    const target = await assignUserRole(input.targetUserId, input.newRole);
    if (!target) throw new TRPCError8({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable or user not found" });
    await recordAuditEvent(ctx, {
      category: "role_change",
      action: "user.role.assign",
      entityType: "users",
      entityId: target.id,
      targetEntity: target.email ?? target.name ?? String(target.id),
      outcome: "success",
      payload: { previousRole: target.role, newRole: input.newRole }
    });
    return { success: true, previousRole: target.role, newRole: input.newRole };
  }),
  /**
   * Assign a platform-level role to a localUser (password auth user).
   * Restricted to Platform Admin and above.
   */
  assignLocalUserRole: platformAdminProcedure.input(
    z12.object({
      targetLocalUserId: z12.number().int().positive(),
      newUserType: z12.enum([
        "visitor",
        "professional",
        "admin",
        "basic_user",
        "professional_user",
        "company_admin",
        "platform_admin",
        "yalla_hack_employee",
        "super_admin"
      ])
    })
  ).mutation(async ({ ctx, input }) => {
    const actorRole = ctx.user.role;
    if (!hasMinRole(actorRole, "super_admin") && (input.newUserType === "super_admin" || input.newUserType === "yalla_hack_employee")) {
      throw new TRPCError8({ code: "FORBIDDEN", message: NOT_PLATFORM_ADMIN_ERR_MSG });
    }
    const target = await assignLocalUserRole(input.targetLocalUserId, input.newUserType);
    if (!target) throw new TRPCError8({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable or user not found" });
    await recordAuditEvent(ctx, {
      category: "role_change",
      action: "localUser.role.assign",
      entityType: "localUsers",
      entityId: target.id,
      localUserId: target.id,
      targetEntity: target.email ?? target.name,
      outcome: "success",
      payload: { previousUserType: target.userType, newUserType: input.newUserType }
    });
    return { success: true, previousUserType: target.userType, newUserType: input.newUserType };
  }),
  /**
   * Fetch audit logs — Super Admin only.
   */
  auditLogs: superAdminProcedure.input(
    z12.object({
      limit: z12.number().int().min(1).max(500).default(100),
      offset: z12.number().int().min(0).default(0),
      category: z12.enum(["auth", "data_write", "data_read", "role_change", "system", "billing"]).optional(),
      outcome: z12.enum(["success", "failure", "blocked"]).optional()
    })
  ).query(async ({ input }) => {
    return listAuditLogs(input.limit, input.offset, input.category, input.outcome);
  })
});

// server/rbac-router.ts
import { z as z13 } from "zod";
var moduleSlugsSchema = z13.enum([...MODULE_SLUGS]);
function getLocalUserId(user) {
  if (!user) return null;
  const id = user["localUserId"];
  return typeof id === "number" ? id : null;
}
var rbacRouter = router({
  /**
   * Get effective permissions for the current user in a specific module.
   * Returns the canView/canCreate/canEdit/canDelete/canExport/canInvite flags.
   */
  getModulePermissions: orgProcedure.input(z13.object({ module: moduleSlugsSchema })).query(async ({ ctx, input }) => {
    const userId = typeof ctx.user.id === "number" ? ctx.user.id : null;
    const localUserId = getLocalUserId(ctx.user);
    const perms = await getEffectivePermissions(
      userId,
      localUserId,
      ctx.organizationId,
      ctx.organizationRole ?? null,
      input.module
    );
    return {
      module: input.module,
      canView: perms.canView,
      canCreate: perms.canCreate,
      canEdit: perms.canEdit,
      canDelete: perms.canDelete,
      canExport: perms.canExport,
      canInvite: perms.canInvite,
      isOverride: perms.isOverride
    };
  }),
  /**
   * Get effective permissions for all modules at once.
   * Useful for building permission maps on initial load.
   */
  getAllModulePermissions: orgProcedure.query(async ({ ctx }) => {
    const userId = typeof ctx.user.id === "number" ? ctx.user.id : null;
    const localUserId = getLocalUserId(ctx.user);
    const results = await Promise.all(
      MODULE_SLUGS.map(async (module) => {
        const perms = await getEffectivePermissions(
          userId,
          localUserId,
          ctx.organizationId,
          ctx.organizationRole ?? null,
          module
        );
        return [module, perms];
      })
    );
    return Object.fromEntries(results);
  }),
  /**
   * Get the current user's platform role and org role.
   * Lightweight alternative to role.myRole when you only need role info.
   */
  myRoles: protectedProcedure.query(({ ctx }) => {
    return {
      platformRole: ctx.user.role ?? "basic_user",
      orgRole: ctx.organizationRole ?? null,
      organizationId: ctx.organizationId ?? null
    };
  })
});

// server/org-members-router.ts
import { z as z14 } from "zod";
import { TRPCError as TRPCError9 } from "@trpc/server";
init_env();
import { randomBytes } from "crypto";

// server/org-members-store.ts
init_schema();
init_db();
import { eq as eq14, and as and10 } from "drizzle-orm";
async function getMyOrg(orgId, role) {
  const db = await getDb();
  if (!db) {
    return {
      id: orgId,
      name: "Your Organization",
      slug: "your-org",
      plan: "free_trial",
      maxSeats: 5,
      billingEmail: "",
      primaryJurisdiction: "Both",
      industry: null,
      trialEndsAt: null,
      createdAt: /* @__PURE__ */ new Date(),
      currentUserRole: role
    };
  }
  if (orgId < 0) {
    return {
      id: -1,
      name: "Dev Organization",
      slug: "dev-org",
      plan: "enterprise",
      maxSeats: 99,
      billingEmail: "dev@localhost",
      primaryJurisdiction: "Both",
      industry: "Technology",
      trialEndsAt: null,
      createdAt: /* @__PURE__ */ new Date(),
      currentUserRole: role
    };
  }
  const [org] = await db.select({
    id: organizations.id,
    name: organizations.name,
    slug: organizations.slug,
    plan: organizations.plan,
    maxSeats: organizations.maxSeats,
    billingEmail: organizations.billingEmail,
    primaryJurisdiction: organizations.primaryJurisdiction,
    industry: organizations.industry,
    trialEndsAt: organizations.trialEndsAt,
    createdAt: organizations.createdAt
  }).from(organizations).where(eq14(organizations.id, orgId)).limit(1);
  if (!org) return null;
  return { ...org, currentUserRole: role };
}
async function listOrgMembers(orgId, currentUserId) {
  const db = await getDb();
  if (!db || orgId < 0) return [];
  const rows = await db.select({
    id: organizationMembers.id,
    organizationId: organizationMembers.organizationId,
    userId: organizationMembers.userId,
    localUserId: organizationMembers.localUserId,
    role: organizationMembers.role,
    status: organizationMembers.status,
    inviteEmail: organizationMembers.inviteEmail,
    createdAt: organizationMembers.createdAt,
    localName: localUsers.name,
    localEmail: localUsers.email,
    localJobTitle: localUsers.jobTitle,
    oauthName: users.name,
    oauthEmail: users.email,
    oauthJobTitle: users.jobTitle
  }).from(organizationMembers).leftJoin(localUsers, eq14(organizationMembers.localUserId, localUsers.id)).leftJoin(users, eq14(organizationMembers.userId, users.id)).where(eq14(organizationMembers.organizationId, orgId)).orderBy(organizationMembers.createdAt);
  return rows.map((r) => ({
    id: r.id,
    role: r.role,
    status: r.status,
    inviteEmail: r.inviteEmail ?? null,
    joinedAt: r.createdAt,
    name: r.localName ?? r.oauthName ?? r.inviteEmail ?? "Unknown Member",
    email: r.localEmail ?? r.oauthEmail ?? r.inviteEmail ?? "",
    jobTitle: r.localJobTitle ?? r.oauthJobTitle ?? null,
    isCurrentUser: r.userId === currentUserId
  }));
}
async function getOrgMember(orgId, memberId) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select({ id: organizationMembers.id, role: organizationMembers.role }).from(organizationMembers).where(and10(eq14(organizationMembers.id, memberId), eq14(organizationMembers.organizationId, orgId))).limit(1);
  return row ?? null;
}
async function updateMemberRole(memberId, newRole) {
  const db = await getDb();
  if (!db) return;
  await db.update(organizationMembers).set({ role: newRole, updatedAt: /* @__PURE__ */ new Date() }).where(eq14(organizationMembers.id, memberId));
}
async function deleteMember(memberId) {
  const db = await getDb();
  if (!db) return;
  await db.delete(organizationMembers).where(eq14(organizationMembers.id, memberId));
}
async function getOrgForInvite(orgId) {
  const db = await getDb();
  if (!db) return null;
  const [org] = await db.select({ maxSeats: organizations.maxSeats, name: organizations.name }).from(organizations).where(eq14(organizations.id, orgId)).limit(1);
  return org ?? null;
}
async function countActiveMembers(orgId) {
  const db = await getDb();
  if (!db) return 0;
  const rows = await db.select({ id: organizationMembers.id }).from(organizationMembers).where(and10(eq14(organizationMembers.organizationId, orgId), eq14(organizationMembers.status, "active")));
  return rows.length;
}
async function checkDuplicateInvite(orgId, email) {
  const db = await getDb();
  if (!db) return false;
  const normalizedEmail = email.trim().toLowerCase();
  const rows = await db.select({
    inviteEmail: organizationMembers.inviteEmail,
    oauthEmail: users.email,
    localEmail: localUsers.email
  }).from(organizationMembers).leftJoin(users, eq14(organizationMembers.userId, users.id)).leftJoin(localUsers, eq14(organizationMembers.localUserId, localUsers.id)).where(eq14(organizationMembers.organizationId, orgId));
  return rows.some((row) => {
    const candidates = [row.inviteEmail, row.oauthEmail, row.localEmail];
    return candidates.some((value) => (value ?? "").trim().toLowerCase() === normalizedEmail);
  });
}
async function insertInvite(orgId, role, email, token, invitedByUserId) {
  const db = await getDb();
  if (!db) return;
  const normalizedEmail = email.trim().toLowerCase();
  await db.insert(organizationMembers).values({
    organizationId: orgId,
    role,
    status: "invited",
    inviteEmail: normalizedEmail,
    inviteToken: token,
    invitedByUserId
  });
}
async function lookupInviteToken(token) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select({
    id: organizationMembers.id,
    role: organizationMembers.role,
    inviteEmail: organizationMembers.inviteEmail,
    status: organizationMembers.status,
    createdAt: organizationMembers.createdAt,
    orgName: organizations.name,
    orgSlug: organizations.slug
  }).from(organizationMembers).innerJoin(organizations, eq14(organizationMembers.organizationId, organizations.id)).where(eq14(organizationMembers.inviteToken, token)).limit(1);
  return row ?? null;
}
async function getInviteByToken(token) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select({
    id: organizationMembers.id,
    status: organizationMembers.status,
    createdAt: organizationMembers.createdAt,
    organizationId: organizationMembers.organizationId,
    inviteEmail: organizationMembers.inviteEmail
  }).from(organizationMembers).where(eq14(organizationMembers.inviteToken, token)).limit(1);
  return row ?? null;
}
async function activateInvite(memberId, userId) {
  const db = await getDb();
  if (!db) return;
  await db.update(organizationMembers).set({
    userId,
    status: "active",
    inviteAcceptedAt: /* @__PURE__ */ new Date(),
    inviteToken: null,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq14(organizationMembers.id, memberId));
}

// server/org-members-router.ts
var EDITABLE_ROLES = ["admin", "compliance_officer", "analyst"];
var orgMembersRouter = router({
  myOrg: orgProcedure.query(async ({ ctx }) => {
    await requireModulePermission(ctx, "team_members", "canView");
    return getMyOrg(ctx.organizationId, ctx.organizationRole);
  }),
  list: orgProcedure.query(async ({ ctx }) => {
    await requireModulePermission(ctx, "team_members", "canView");
    return listOrgMembers(ctx.organizationId, ctx.user?.id ?? -999);
  }),
  updateRole: orgAdminProcedure.input(
    z14.object({
      memberId: z14.number().int().positive(),
      newRole: z14.enum(EDITABLE_ROLES)
    })
  ).mutation(async ({ ctx, input }) => {
    await requireModulePermission(ctx, "team_members", "canEdit");
    const member = await getOrgMember(ctx.organizationId, input.memberId);
    if (!member) {
      throw new TRPCError9({ code: "NOT_FOUND", message: "Member not found in this organization." });
    }
    if (member.role === "owner") {
      throw new TRPCError9({
        code: "FORBIDDEN",
        message: "The organization owner's role cannot be changed here."
      });
    }
    await updateMemberRole(input.memberId, input.newRole);
    void recordAuditEvent(ctx, {
      category: "role_change",
      action: "user.role.change",
      entityType: "organizationMembers",
      entityId: input.memberId,
      payload: { newRole: input.newRole, organizationId: ctx.organizationId }
    });
    return { success: true };
  }),
  remove: orgAdminProcedure.input(z14.number().int().positive()).mutation(async ({ ctx, input }) => {
    await requireModulePermission(ctx, "team_members", "canDelete");
    const member = await getOrgMember(ctx.organizationId, input);
    if (!member) {
      throw new TRPCError9({ code: "NOT_FOUND", message: "Member not found in this organization." });
    }
    if (member.role === "owner") {
      throw new TRPCError9({
        code: "FORBIDDEN",
        message: "The organization owner cannot be removed. Transfer ownership first."
      });
    }
    await deleteMember(input);
    void recordAuditEvent(ctx, {
      category: "role_change",
      action: "user.remove",
      entityType: "organizationMembers",
      entityId: input,
      payload: { organizationId: ctx.organizationId }
    });
    return { success: true };
  }),
  invite: orgAdminProcedure.input(
    z14.object({
      email: z14.string().email().max(320),
      role: z14.enum(EDITABLE_ROLES)
    })
  ).mutation(async ({ ctx, input }) => {
    await requireModulePermission(ctx, "team_members", "canInvite");
    const inviteEmailRaw = input.email.trim();
    const inviteEmail = inviteEmailRaw.toLowerCase();
    if (ctx.organizationId < 0) {
      throw new TRPCError9({ code: "FORBIDDEN", message: "Cannot invite members in dev-bypass mode." });
    }
    const org = await getOrgForInvite(ctx.organizationId);
    if (!org) {
      throw new TRPCError9({ code: "NOT_FOUND", message: "Organization not found." });
    }
    const activeCount = await countActiveMembers(ctx.organizationId);
    if (activeCount >= org.maxSeats) {
      throw new TRPCError9({
        code: "FORBIDDEN",
        message: "Seat limit reached. Upgrade your plan to invite more members."
      });
    }
    const isDuplicate = await checkDuplicateInvite(ctx.organizationId, inviteEmail);
    if (isDuplicate) {
      throw new TRPCError9({
        code: "CONFLICT",
        message: "This email already has a membership or pending invite in your organization."
      });
    }
    const inviteToken = randomBytes(32).toString("hex");
    const inviteLink = `${ENV.appUrl}/invite-accept?token=${inviteToken}`;
    const inviterName = ctx.user.name ?? "A team admin";
    const rolePretty = input.role.replace(/_/g, " ");
    await insertInvite(ctx.organizationId, input.role, inviteEmail, inviteToken, ctx.user.id);
    void recordAuditEvent(ctx, {
      category: "data_write",
      action: "user.invite",
      entityType: "organizationMembers",
      entityId: ctx.organizationId,
      payload: { inviteEmail, role: input.role }
    });
    await sendEmail({
      to: inviteEmailRaw,
      subject: `You've been invited to join ${org.name} on DJAC`,
      html: `
<div style="font-family:sans-serif;max-width:560px;margin:auto">
  <h2 style="color:#6d28d9">You've been invited!</h2>
  <p><strong>${inviterName}</strong> has invited you to join <strong>${org.name}</strong> on <strong>DJAC Compliance Platform</strong> as <strong>${rolePretty}</strong>.</p>
  <p style="margin:24px 0">
    <a href="${inviteLink}" style="background:#6d28d9;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block">
      Accept Invitation
    </a>
  </p>
  <p style="color:#6b7280;font-size:13px">This link expires in 7 days. If you didn't expect this invitation, you can safely ignore this email.</p>
</div>`,
      text: `You've been invited to join ${org.name} on DJAC as ${rolePretty}. Accept your invitation: ${inviteLink}`
    });
    return { success: true };
  }),
  lookupInvite: publicProcedure.input(z14.string().min(1).max(64)).query(async ({ input }) => {
    const row = await lookupInviteToken(input);
    if (!row) {
      return { valid: false, expired: false, orgName: null, orgSlug: null, role: null, inviteEmail: null };
    }
    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1e3;
    const expired = Date.now() - new Date(row.createdAt).getTime() > SEVEN_DAYS;
    if (row.status !== "invited" || expired) {
      return { valid: false, expired, orgName: null, orgSlug: null, role: null, inviteEmail: null };
    }
    return { valid: true, expired: false, orgName: row.orgName, orgSlug: row.orgSlug, role: row.role, inviteEmail: row.inviteEmail };
  }),
  acceptInvite: protectedProcedure.input(z14.string().min(1).max(64)).mutation(async ({ ctx, input }) => {
    const member = await getInviteByToken(input);
    if (!member) throw new TRPCError9({ code: "NOT_FOUND", message: "Invitation not found." });
    if (member.status !== "invited") {
      throw new TRPCError9({ code: "BAD_REQUEST", message: "This invitation has already been used or was cancelled." });
    }
    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1e3;
    if (Date.now() - new Date(member.createdAt).getTime() > SEVEN_DAYS) {
      throw new TRPCError9({ code: "BAD_REQUEST", message: "This invitation has expired." });
    }
    const userEmail = ctx.user.email?.trim().toLowerCase() ?? "";
    const inviteEmail = member.inviteEmail?.trim().toLowerCase() ?? "";
    if (!userEmail || !inviteEmail || userEmail !== inviteEmail) {
      throw new TRPCError9({
        code: "FORBIDDEN",
        message: "This invitation is issued for a different account email."
      });
    }
    await activateInvite(member.id, ctx.user.id);
    void recordAuditEvent(ctx, {
      category: "role_change",
      action: "user.invite.accept",
      entityType: "organizationMembers",
      entityId: member.id,
      payload: { organizationId: member.organizationId, inviteEmail }
    });
    return { success: true, organizationId: member.organizationId };
  })
});

// server/org-settings-router.ts
import { z as z15 } from "zod";
import { TRPCError as TRPCError10 } from "@trpc/server";

// server/org-settings-store.ts
init_db();
init_schema();
import { eq as eq15 } from "drizzle-orm";
async function getOrgSettings(orgId, role) {
  const db = await getDb();
  if (!db) {
    return {
      id: orgId,
      slug: "your-org",
      name: "Your Organization",
      billingEmail: "billing@example.com",
      industry: null,
      primaryJurisdiction: "Both",
      plan: "free_trial",
      maxSeats: 5,
      isActive: 1,
      trialStartedAt: null,
      trialEndsAt: null,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date(),
      currentUserRole: role ?? "analyst"
    };
  }
  if (orgId < 0) {
    return {
      id: -1,
      slug: "dev-org",
      name: "Dev Organization",
      billingEmail: "dev@localhost",
      industry: "Technology",
      primaryJurisdiction: "Both",
      plan: "enterprise",
      maxSeats: 99,
      isActive: 1,
      trialStartedAt: null,
      trialEndsAt: null,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date(),
      currentUserRole: "owner"
    };
  }
  const [org] = await db.select().from(organizations).where(eq15(organizations.id, orgId)).limit(1);
  if (!org) return null;
  return { ...org, currentUserRole: role ?? "analyst" };
}
async function updateOrgSettings(orgId, input) {
  const db = await getDb();
  if (!db) return;
  const patch = { updatedAt: /* @__PURE__ */ new Date() };
  if (input.name !== void 0) patch.name = input.name;
  if (input.billingEmail !== void 0) patch.billingEmail = input.billingEmail;
  if (input.industry !== void 0) patch.industry = input.industry;
  if (input.primaryJurisdiction !== void 0) patch.primaryJurisdiction = input.primaryJurisdiction;
  await db.update(organizations).set(patch).where(eq15(organizations.id, orgId));
}

// server/org-settings-router.ts
var JURISDICTION_VALUES = ["China", "Saudi Arabia", "Both", "Other"];
var updateOrgSchema = z15.object({
  name: z15.string().trim().min(2, "Organization name must be at least 2 characters").max(255).optional(),
  billingEmail: z15.string().trim().email().max(320).optional(),
  industry: z15.string().trim().max(120).optional(),
  primaryJurisdiction: z15.enum(JURISDICTION_VALUES).optional()
});
var orgSettingsRouter = router({
  /**
   * Returns the current organization's full profile.
   * Available to all org members (read-only for analyst / compliance_officer).
   */
  get: orgProcedure.query(async ({ ctx }) => {
    await requireModulePermission(ctx, "org_settings", "canView");
    const org = await getOrgSettings(ctx.organizationId, ctx.organizationRole ?? "analyst");
    if (!org) throw new TRPCError10({ code: "NOT_FOUND", message: "Organization not found" });
    return org;
  }),
  /**
   * Update editable fields.  Owner and admin only.
   * Slug and plan are intentionally excluded — those are system-managed.
   */
  update: orgAdminProcedure.input(updateOrgSchema).mutation(async ({ ctx, input }) => {
    await requireModulePermission(ctx, "org_settings", "canEdit");
    if (Object.keys(input).length === 0) {
      throw new TRPCError10({ code: "BAD_REQUEST", message: "No fields to update" });
    }
    if (ctx.organizationId < 0) {
      throw new TRPCError10({ code: "FORBIDDEN", message: "Cannot update dev virtual organization" });
    }
    await updateOrgSettings(ctx.organizationId, input);
    return { success: true };
  })
});

// server/scorecard-store.ts
init_schema();
init_db();
import { and as and11, desc as desc6, eq as eq16 } from "drizzle-orm";
function makeEmptyScorecard(totalVendors) {
  return {
    totalVendors,
    assessedVendors: 0,
    overallScore: null,
    riskDistribution: { low: 0, medium: 0, high: 0, critical: 0 },
    statusDistribution: { compliant: 0, partial: 0, non_compliant: 0 },
    frameworks: [],
    recentAssessments: [],
    gapsBySeverity: { low: 0, medium: 0, high: 0, critical: 0 },
    recentReports: []
  };
}
function toIso(d2) {
  if (!d2) return (/* @__PURE__ */ new Date()).toISOString();
  return d2 instanceof Date ? d2.toISOString() : String(d2);
}
async function getOrgScorecard(orgId, userId) {
  const db = await getDb();
  if (!db) {
    const inMemVendors = await listVendorProfiles(userId, orgId > 0 ? orgId : void 0);
    return makeEmptyScorecard(inMemVendors.length);
  }
  if (orgId < 0) return makeEmptyScorecard(0);
  const vendorRows = await db.select({ id: vendors.id, vendorName: vendors.vendorName }).from(vendors).where(eq16(vendors.organizationId, orgId));
  const totalVendors = vendorRows.length;
  if (totalVendors === 0) return makeEmptyScorecard(0);
  const assessmentRows = await db.select({
    id: vendorAssessments.id,
    vendorId: vendorAssessments.vendorId,
    vendorName: vendors.vendorName,
    frameworkId: vendorAssessments.frameworkId,
    frameworkCode: frameworks.code,
    frameworkName: frameworks.name,
    complianceScore: vendorAssessments.complianceScore,
    riskLevel: vendorAssessments.riskLevel,
    status: vendorAssessments.status,
    assessmentDate: vendorAssessments.assessmentDate
  }).from(vendorAssessments).innerJoin(vendors, eq16(vendorAssessments.vendorId, vendors.id)).innerJoin(frameworks, eq16(vendorAssessments.frameworkId, frameworks.id)).where(eq16(vendors.organizationId, orgId)).orderBy(desc6(vendorAssessments.assessmentDate));
  const latestMap = /* @__PURE__ */ new Map();
  for (const row of assessmentRows) {
    const key = `${row.vendorId}:${row.frameworkId}`;
    if (!latestMap.has(key)) latestMap.set(key, row);
  }
  const latest = Array.from(latestMap.values());
  const assessedVendors = new Set(latest.map((r) => r.vendorId)).size;
  const scores = latest.map((r) => r.complianceScore).filter((s) => s != null);
  const overallScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
  const riskDistribution = { low: 0, medium: 0, high: 0, critical: 0 };
  for (const r of latest) {
    if (r.riskLevel && r.riskLevel in riskDistribution) {
      riskDistribution[r.riskLevel]++;
    }
  }
  const statusDistribution = { compliant: 0, partial: 0, non_compliant: 0 };
  for (const r of latest) {
    if (r.status && r.status in statusDistribution) {
      statusDistribution[r.status]++;
    }
  }
  const fwMap = /* @__PURE__ */ new Map();
  for (const r of latest) {
    if (!fwMap.has(r.frameworkCode)) {
      fwMap.set(r.frameworkCode, { code: r.frameworkCode, name: r.frameworkName, scores: [], count: 0 });
    }
    const entry = fwMap.get(r.frameworkCode);
    entry.count++;
    if (r.complianceScore != null) entry.scores.push(r.complianceScore);
  }
  const frameworkList = Array.from(fwMap.values()).map((fw) => ({
    code: fw.code,
    name: fw.name,
    avgScore: fw.scores.length > 0 ? Math.round(fw.scores.reduce((a, b) => a + b, 0) / fw.scores.length) : 0,
    count: fw.count
  }));
  const recentAssessments = assessmentRows.slice(0, 5).map((r) => ({
    id: r.id,
    vendorName: r.vendorName,
    frameworkCode: r.frameworkCode,
    score: r.complianceScore,
    riskLevel: r.riskLevel,
    assessmentDate: toIso(r.assessmentDate)
  }));
  const gapsBySeverity = { low: 0, medium: 0, high: 0, critical: 0 };
  const gapRows = await db.select({ severity: assessmentGaps.severity }).from(assessmentGaps).innerJoin(vendorAssessments, eq16(assessmentGaps.assessmentId, vendorAssessments.id)).innerJoin(vendors, eq16(vendorAssessments.vendorId, vendors.id)).where(eq16(vendors.organizationId, orgId));
  for (const g of gapRows) {
    if (g.severity && g.severity in gapsBySeverity) {
      gapsBySeverity[g.severity]++;
    }
  }
  const reportRows = await db.select({
    id: complianceReports.id,
    title: complianceReports.title,
    reportType: complianceReports.reportType,
    overallScore: complianceReports.overallScore,
    status: complianceReports.status,
    createdAt: complianceReports.createdAt
  }).from(complianceReports).where(and11(eq16(complianceReports.organizationId, orgId), eq16(complianceReports.status, "ready"))).orderBy(desc6(complianceReports.createdAt)).limit(5);
  return {
    totalVendors,
    assessedVendors,
    overallScore,
    riskDistribution,
    statusDistribution,
    frameworks: frameworkList,
    recentAssessments,
    gapsBySeverity,
    recentReports: reportRows.map((r) => ({
      id: r.id,
      title: r.title,
      reportType: r.reportType,
      overallScore: r.overallScore,
      status: r.status,
      createdAt: toIso(r.createdAt)
    }))
  };
}

// server/scorecard-router.ts
var scorecardRouter = router({
  orgScorecard: activeOrgProcedure.query(async ({ ctx }) => {
    await requireModulePermission(ctx, "compliance_tracker", "canView");
    return getOrgScorecard(ctx.organizationId ?? -1, ctx.user.id);
  })
});

// server/api-keys-router.ts
import { z as z16 } from "zod";
import { TRPCError as TRPCError11 } from "@trpc/server";

// server/api-keys-store.ts
init_schema();
init_db();
import crypto2 from "crypto";
import { and as and12, eq as eq17, isNull as isNull3 } from "drizzle-orm";
var MEM_KEYS = [];
var memIdSeq = 1;
function genApiKey() {
  const raw = "djac_" + crypto2.randomBytes(16).toString("hex");
  const hash = crypto2.createHash("sha256").update(raw).digest("hex");
  const prefix = raw.slice(0, 12);
  return { raw, hash, prefix };
}
async function listApiKeys(orgId) {
  const db = await getDb();
  if (!db || orgId < 0) {
    return MEM_KEYS.filter((k) => k.organizationId === orgId && k.revokedAt === null).map(({ keyHash: _h, ...rest }) => rest);
  }
  return db.select({
    id: apiKeys.id,
    name: apiKeys.name,
    keyPrefix: apiKeys.keyPrefix,
    scopes: apiKeys.scopes,
    lastUsedAt: apiKeys.lastUsedAt,
    expiresAt: apiKeys.expiresAt,
    createdAt: apiKeys.createdAt
  }).from(apiKeys).where(and12(eq17(apiKeys.organizationId, orgId), isNull3(apiKeys.revokedAt)));
}
async function createApiKey(orgId, createdByUserId, name, scopesJson, expiresAt) {
  const db = await getDb();
  const { raw, hash, prefix } = genApiKey();
  if (!db || orgId < 0) {
    const row = {
      id: memIdSeq++,
      organizationId: orgId,
      name,
      keyHash: hash,
      keyPrefix: prefix,
      scopes: scopesJson,
      lastUsedAt: null,
      expiresAt,
      revokedAt: null,
      createdAt: /* @__PURE__ */ new Date()
    };
    MEM_KEYS.push(row);
    return { id: row.id, name, keyPrefix: prefix, rawKey: raw };
  }
  const [inserted] = await db.insert(apiKeys).values({
    organizationId: orgId,
    createdByUserId,
    name,
    keyHash: hash,
    keyPrefix: prefix,
    scopes: scopesJson,
    expiresAt
  }).returning({ id: apiKeys.id });
  const newId = inserted.id;
  return { id: newId, name, keyPrefix: prefix, rawKey: raw };
}
async function revokeApiKey(orgId, keyId) {
  const db = await getDb();
  if (!db || orgId < 0) {
    const idx = MEM_KEYS.findIndex((k) => k.id === keyId && k.organizationId === orgId);
    if (idx === -1) return false;
    MEM_KEYS[idx].revokedAt = /* @__PURE__ */ new Date();
    return true;
  }
  const [existing] = await db.select({ id: apiKeys.id }).from(apiKeys).where(and12(eq17(apiKeys.id, keyId), eq17(apiKeys.organizationId, orgId)));
  if (!existing) return false;
  await db.update(apiKeys).set({ revokedAt: /* @__PURE__ */ new Date() }).where(eq17(apiKeys.id, keyId));
  return true;
}

// server/api-keys-router.ts
var apiKeysRouter = router({
  /**
   * List all active (non-revoked) API keys for the org.
   * Raw key is never returned — only id, name, prefix, scopes, dates.
   */
  list: activeOrgProcedure.query(async ({ ctx }) => {
    await requireModulePermission(ctx, "api_keys", "canView");
    return listApiKeys(ctx.organizationId);
  }),
  /**
   * Create a new API key. Returns the raw key ONCE — not stored.
   * Only org admins can create keys.
   */
  create: orgAdminProcedure.input(
    z16.object({
      name: z16.string().trim().min(2, "API key name must be at least 2 characters").max(120),
      scopes: z16.array(
        z16.enum([
          "vendor:read",
          "vendor:write",
          "report:read",
          "report:write",
          "assessment:read",
          "assessment:write",
          "compliance:read",
          "admin:read"
        ])
      ).min(1).max(8),
      expiresInDays: z16.number().int().min(1).max(365).optional()
    })
  ).mutation(async ({ ctx, input }) => {
    await requireModulePermission(ctx, "api_keys", "canCreate");
    const orgId = ctx.organizationId;
    const expiresAt = input.expiresInDays ? new Date(Date.now() + input.expiresInDays * 864e5) : null;
    const scopesJson = JSON.stringify(input.scopes);
    const result = await createApiKey(orgId, ctx.user?.id ?? null, input.name, scopesJson, expiresAt);
    void recordAuditEvent(ctx, {
      category: "auth",
      action: "api_key.create",
      entityType: "apiKeys",
      entityId: result.id,
      payload: { name: input.name, scopes: input.scopes }
    });
    return result;
  }),
  /**
   * Revoke an API key by id. Only org admins can revoke.
   */
  revoke: orgAdminProcedure.input(z16.number().int().positive()).mutation(async ({ ctx, input }) => {
    await requireModulePermission(ctx, "api_keys", "canDelete");
    const orgId = ctx.organizationId;
    const found = await revokeApiKey(orgId, input);
    if (!found) throw new TRPCError11({ code: "NOT_FOUND" });
    void recordAuditEvent(ctx, {
      category: "auth",
      action: "api_key.revoke",
      entityType: "apiKeys",
      entityId: input,
      payload: {}
    });
    return { success: true };
  })
});

// server/remediation-router.ts
import { z as z17 } from "zod";
import { TRPCError as TRPCError12 } from "@trpc/server";

// server/remediation-store.ts
init_schema();
init_db();
import { and as and13, desc as desc7, eq as eq18 } from "drizzle-orm";
var MEM_TASKS = [];
var memSeq = 1;
async function listTasks(orgId) {
  const db = await getDb();
  if (!db || orgId < 0) {
    return MEM_TASKS.filter((t2) => t2.organizationId === orgId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  return db.select().from(remediationTasks).where(eq18(remediationTasks.organizationId, orgId)).orderBy(desc7(remediationTasks.createdAt));
}
async function createTask(orgId, input) {
  const db = await getDb();
  const now = /* @__PURE__ */ new Date();
  const dueDate = input.dueDate ? new Date(input.dueDate) : null;
  if (!db || orgId < 0) {
    const task = {
      id: memSeq++,
      organizationId: orgId,
      vendorId: input.vendorId ?? null,
      gapCode: input.gapCode ?? null,
      title: input.title,
      description: input.description ?? null,
      severity: input.severity,
      status: input.status,
      assignedToUserId: input.assignedToUserId ?? null,
      dueDate,
      notes: input.notes ?? null,
      createdAt: now,
      updatedAt: now
    };
    MEM_TASKS.push(task);
    return task;
  }
  const [insertedRemediation] = await db.insert(remediationTasks).values({
    organizationId: orgId,
    vendorId: input.vendorId ?? null,
    gapCode: input.gapCode ?? null,
    title: input.title,
    description: input.description ?? null,
    severity: input.severity,
    status: input.status,
    assignedToUserId: input.assignedToUserId ?? null,
    dueDate,
    notes: input.notes ?? null
  }).returning({ id: remediationTasks.id });
  const newId = insertedRemediation.id;
  return {
    id: newId,
    organizationId: orgId,
    vendorId: input.vendorId ?? null,
    gapCode: input.gapCode ?? null,
    title: input.title,
    description: input.description ?? null,
    severity: input.severity,
    status: input.status,
    assignedToUserId: input.assignedToUserId ?? null,
    dueDate,
    notes: input.notes ?? null,
    createdAt: now,
    updatedAt: now
  };
}
async function updateTaskStatus(orgId, id, status) {
  const db = await getDb();
  if (!db || orgId < 0) {
    const task = MEM_TASKS.find((t2) => t2.id === id && t2.organizationId === orgId);
    if (!task) return null;
    task.status = status;
    task.updatedAt = /* @__PURE__ */ new Date();
    return { id: task.id, status: task.status };
  }
  await db.update(remediationTasks).set({ status, updatedAt: /* @__PURE__ */ new Date() }).where(and13(eq18(remediationTasks.id, id), eq18(remediationTasks.organizationId, orgId)));
  return { id, status };
}
async function patchTask(orgId, id, fields, dueDate) {
  const db = await getDb();
  if (!db || orgId < 0) {
    const task = MEM_TASKS.find((t2) => t2.id === id && t2.organizationId === orgId);
    if (!task) return null;
    Object.assign(task, fields);
    if (dueDate !== void 0) task.dueDate = dueDate;
    task.updatedAt = /* @__PURE__ */ new Date();
    return task;
  }
  const updates = { ...fields, updatedAt: /* @__PURE__ */ new Date() };
  if (dueDate !== void 0) updates.dueDate = dueDate;
  await db.update(remediationTasks).set(updates).where(and13(eq18(remediationTasks.id, id), eq18(remediationTasks.organizationId, orgId)));
  return { id };
}
async function removeTask(orgId, id) {
  const db = await getDb();
  if (!db || orgId < 0) {
    const idx = MEM_TASKS.findIndex((t2) => t2.id === id && t2.organizationId === orgId);
    if (idx === -1) return false;
    MEM_TASKS.splice(idx, 1);
    return true;
  }
  await db.delete(remediationTasks).where(and13(eq18(remediationTasks.id, id), eq18(remediationTasks.organizationId, orgId)));
  return true;
}

// server/remediation-router.ts
var statusEnum = z17.enum(["open", "in_progress", "resolved", "accepted_risk"]);
var severityEnum2 = z17.enum(["critical", "high", "medium", "low"]);
var createSchema = z17.object({
  title: z17.string().trim().min(2, "Title must be at least 2 characters").max(255),
  description: z17.string().trim().max(2e3).optional(),
  severity: severityEnum2.default("medium"),
  status: statusEnum.default("open"),
  gapCode: z17.string().trim().max(64).optional(),
  vendorId: z17.number().int().positive().optional(),
  assignedToUserId: z17.number().int().positive().optional(),
  dueDate: z17.string().optional(),
  // ISO-8601 date string
  notes: z17.string().trim().max(2e3).optional()
});
var patchSchema = z17.object({
  id: z17.number().int().positive(),
  title: z17.string().trim().min(2, "Title must be at least 2 characters").max(255).optional(),
  description: z17.string().trim().max(2e3).optional(),
  severity: severityEnum2.optional(),
  status: statusEnum.optional(),
  assignedToUserId: z17.number().int().positive().nullable().optional(),
  dueDate: z17.string().nullable().optional(),
  notes: z17.string().trim().max(2e3).optional()
});
var remediationRouter = router({
  /**
   * List all remediation tasks for the current organisation, newest first.
   */
  list: activeOrgProcedure.query(async ({ ctx }) => {
    await requireModulePermission(ctx, "remediation_planner", "canView");
    return listTasks(ctx.organizationId);
  }),
  /**
   * Create a new remediation task (optionally pre-filled from a gap finding).
   */
  create: activeOrgProcedure.input(createSchema).mutation(async ({ ctx, input }) => {
    await requireModulePermission(ctx, "remediation_planner", "canCreate");
    const task = await createTask(ctx.organizationId, input);
    void recordAuditEvent(ctx, {
      category: "data_write",
      action: "remediation_task_created",
      entityType: "remediationTasks",
      entityId: task.id,
      payload: { title: input.title, severity: input.severity, gapCode: input.gapCode }
    });
    return task;
  }),
  /**
   * Move a task to a different Kanban column (status transition).
   */
  updateStatus: activeOrgProcedure.input(z17.object({ id: z17.number().int().positive(), status: statusEnum })).mutation(async ({ ctx, input }) => {
    await requireModulePermission(ctx, "remediation_planner", "canEdit");
    const result = await updateTaskStatus(ctx.organizationId, input.id, input.status);
    if (!result) throw new TRPCError12({ code: "NOT_FOUND", message: "Task not found" });
    return result;
  }),
  /**
   * Update editable fields of a task.
   */
  patch: activeOrgProcedure.input(patchSchema).mutation(async ({ ctx, input }) => {
    await requireModulePermission(ctx, "remediation_planner", "canEdit");
    const { id, dueDate: dueDateStr, ...rest } = input;
    const dueDate = dueDateStr === null ? null : dueDateStr ? new Date(dueDateStr) : void 0;
    const result = await patchTask(ctx.organizationId, id, rest, dueDate);
    if (!result) throw new TRPCError12({ code: "NOT_FOUND", message: "Task not found" });
    void recordAuditEvent(ctx, {
      category: "data_write",
      action: "remediation_task_updated",
      entityType: "remediationTasks",
      entityId: id,
      payload: { fields: Object.keys(rest) }
    });
    return result;
  }),
  /**
   * Delete a remediation task by id.
   */
  remove: activeOrgProcedure.input(z17.number().int().positive()).mutation(async ({ ctx, input: id }) => {
    await requireModulePermission(ctx, "remediation_planner", "canDelete");
    const deleted = await removeTask(ctx.organizationId, id);
    if (!deleted) throw new TRPCError12({ code: "NOT_FOUND", message: "Task not found" });
    void recordAuditEvent(ctx, {
      category: "data_write",
      action: "remediation_task_deleted",
      entityType: "remediationTasks",
      entityId: id,
      payload: {}
    });
    return { id };
  })
});

// server/risk-register-router.ts
import { z as z18 } from "zod";
import { TRPCError as TRPCError13 } from "@trpc/server";

// server/risk-register-store.ts
init_schema();
init_db();
import { and as and14, desc as desc8, eq as eq19 } from "drizzle-orm";
var MEM_RISKS = [];
var memSeq2 = 1;
async function listRisks(orgId) {
  const db = await getDb();
  if (!db || orgId < 0) {
    return MEM_RISKS.filter((r) => r.organizationId === orgId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  return db.select().from(riskRegister).where(eq19(riskRegister.organizationId, orgId)).orderBy(desc8(riskRegister.createdAt));
}
async function createRisk(orgId, input) {
  const db = await getDb();
  const now = /* @__PURE__ */ new Date();
  const reviewDate = input.reviewDate ? new Date(input.reviewDate) : null;
  if (!db || orgId < 0) {
    const risk = {
      id: memSeq2++,
      organizationId: orgId,
      title: input.title,
      description: input.description ?? null,
      category: input.category,
      likelihood: input.likelihood,
      impact: input.impact,
      treatment: input.treatment,
      status: input.status,
      ownerId: input.ownerId ?? null,
      vendorId: input.vendorId ?? null,
      gapCode: input.gapCode ?? null,
      controlReference: input.controlReference ?? null,
      reviewDate,
      notes: input.notes ?? null,
      createdAt: now,
      updatedAt: now
    };
    MEM_RISKS.push(risk);
    return risk;
  }
  const [insertedRisk] = await db.insert(riskRegister).values({
    organizationId: orgId,
    title: input.title,
    description: input.description ?? null,
    category: input.category,
    likelihood: input.likelihood,
    impact: input.impact,
    treatment: input.treatment,
    status: input.status,
    ownerId: input.ownerId ?? null,
    vendorId: input.vendorId ?? null,
    gapCode: input.gapCode ?? null,
    controlReference: input.controlReference ?? null,
    reviewDate,
    notes: input.notes ?? null
  }).returning({ id: riskRegister.id });
  const newId = insertedRisk.id;
  return {
    id: newId,
    organizationId: orgId,
    reviewDate,
    createdAt: now,
    updatedAt: now,
    description: input.description ?? null,
    ownerId: input.ownerId ?? null,
    vendorId: input.vendorId ?? null,
    gapCode: input.gapCode ?? null,
    controlReference: input.controlReference ?? null,
    notes: input.notes ?? null,
    title: input.title,
    category: input.category,
    likelihood: input.likelihood,
    impact: input.impact,
    treatment: input.treatment,
    status: input.status
  };
}
async function patchRisk(orgId, id, fields, reviewDate) {
  const db = await getDb();
  if (!db || orgId < 0) {
    const risk = MEM_RISKS.find((r) => r.id === id && r.organizationId === orgId);
    if (!risk) return null;
    Object.assign(risk, fields);
    if (reviewDate !== void 0) risk.reviewDate = reviewDate;
    risk.updatedAt = /* @__PURE__ */ new Date();
    return risk;
  }
  const updates = { ...fields, updatedAt: /* @__PURE__ */ new Date() };
  if (reviewDate !== void 0) updates.reviewDate = reviewDate;
  await db.update(riskRegister).set(updates).where(and14(eq19(riskRegister.id, id), eq19(riskRegister.organizationId, orgId)));
  return { id };
}
async function removeRisk(orgId, id) {
  const db = await getDb();
  if (!db || orgId < 0) {
    const idx = MEM_RISKS.findIndex((r) => r.id === id && r.organizationId === orgId);
    if (idx === -1) return false;
    MEM_RISKS.splice(idx, 1);
    return true;
  }
  const rows = await db.select({ id: riskRegister.id }).from(riskRegister).where(and14(eq19(riskRegister.id, id), eq19(riskRegister.organizationId, orgId)));
  if (!rows.length) return false;
  await db.delete(riskRegister).where(and14(eq19(riskRegister.id, id), eq19(riskRegister.organizationId, orgId)));
  return true;
}

// server/risk-register-router.ts
var categoryEnum = z18.enum(["operational", "legal", "technical", "financial", "reputational"]);
var treatmentEnum2 = z18.enum(["accept", "mitigate", "transfer", "avoid"]);
var statusEnum2 = z18.enum(["open", "in_treatment", "closed", "accepted"]);
var createSchema2 = z18.object({
  title: z18.string().trim().min(2, "Title must be at least 2 characters").max(255),
  description: z18.string().trim().max(2e3).optional(),
  category: categoryEnum.default("operational"),
  likelihood: z18.number().int().min(1).max(5).default(3),
  impact: z18.number().int().min(1).max(5).default(3),
  treatment: treatmentEnum2.default("mitigate"),
  status: statusEnum2.default("open"),
  ownerId: z18.number().int().positive().optional(),
  vendorId: z18.number().int().positive().optional(),
  gapCode: z18.string().trim().max(64).optional(),
  controlReference: z18.string().trim().max(128).optional(),
  reviewDate: z18.string().optional(),
  // ISO-8601
  notes: z18.string().trim().max(2e3).optional()
});
var patchSchema2 = createSchema2.partial().extend({
  id: z18.number().int().positive(),
  reviewDate: z18.string().nullable().optional(),
  ownerId: z18.number().int().positive().nullable().optional(),
  vendorId: z18.number().int().positive().nullable().optional()
});
var riskRegisterRouter = router({
  /**
   * List all risk entries for the current organisation, newest first.
   */
  list: activeOrgProcedure.query(async ({ ctx }) => {
    await requireModulePermission(ctx, "risk_register", "canView");
    return listRisks(ctx.organizationId);
  }),
  /**
   * Create a new risk entry.
   */
  create: activeOrgProcedure.input(createSchema2).mutation(async ({ ctx, input }) => {
    await requireModulePermission(ctx, "risk_register", "canCreate");
    const orgId = ctx.organizationId;
    const risk = await createRisk(orgId, input);
    void recordAuditEvent(ctx, {
      category: "data_write",
      action: "risk_entry_created",
      entityType: "riskRegister",
      entityId: risk.id,
      payload: { title: input.title, category: input.category, likelihood: input.likelihood, impact: input.impact }
    });
    return risk;
  }),
  /**
   * Partial update of any editable fields.
   */
  patch: activeOrgProcedure.input(patchSchema2).mutation(async ({ ctx, input }) => {
    await requireModulePermission(ctx, "risk_register", "canEdit");
    const orgId = ctx.organizationId;
    const { id, reviewDate: reviewDateStr, ...rest } = input;
    const reviewDate = reviewDateStr === null ? null : reviewDateStr ? new Date(reviewDateStr) : void 0;
    const result = await patchRisk(orgId, id, rest, reviewDate);
    if (!result) throw new TRPCError13({ code: "NOT_FOUND", message: "Risk not found" });
    void recordAuditEvent(ctx, {
      category: "data_write",
      action: "risk_entry_updated",
      entityType: "riskRegister",
      entityId: id,
      payload: { fields: Object.keys(rest) }
    });
    return result;
  }),
  /**
   * Delete a risk entry (org-scoped ownership check).
   */
  remove: activeOrgProcedure.input(z18.number().int().positive()).mutation(async ({ ctx, input: id }) => {
    await requireModulePermission(ctx, "risk_register", "canDelete");
    const orgId = ctx.organizationId;
    const deleted = await removeRisk(orgId, id);
    if (!deleted) throw new TRPCError13({ code: "NOT_FOUND", message: "Risk not found" });
    void recordAuditEvent(ctx, {
      category: "data_write",
      action: "risk_entry_deleted",
      entityType: "riskRegister",
      entityId: id,
      payload: {}
    });
    return { deleted: id };
  })
});

// server/policy-router.ts
import { z as z19 } from "zod";
import { TRPCError as TRPCError14 } from "@trpc/server";

// server/policy-store.ts
init_schema();
init_db();
import { and as and15, desc as desc9, eq as eq20 } from "drizzle-orm";
var MEM_POLICIES = [];
var memSeq3 = 1;
async function listPolicies(orgId) {
  const db = await getDb();
  if (!db || orgId < 0) {
    return [...MEM_POLICIES.filter((p) => p.organizationId === orgId)].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  return db.select().from(compliancePolicies).where(eq20(compliancePolicies.organizationId, orgId)).orderBy(desc9(compliancePolicies.createdAt));
}
async function createPolicy(orgId, input) {
  const db = await getDb();
  const now = /* @__PURE__ */ new Date();
  const nextReviewAt = input.nextReviewAt ? new Date(input.nextReviewAt) : null;
  const frameworksJson = JSON.stringify(input.frameworks);
  const controlReferencesJson = JSON.stringify(input.controlReferences);
  if (!db || orgId < 0) {
    const policy = {
      id: memSeq3++,
      organizationId: orgId,
      policyCode: input.policyCode ?? null,
      title: input.title,
      description: input.description ?? null,
      policyType: input.policyType,
      frameworks: frameworksJson,
      controlReferences: controlReferencesJson,
      status: input.status,
      ownerId: input.ownerId ?? null,
      reviewCycleMonths: input.reviewCycleMonths,
      lastApprovedAt: null,
      nextReviewAt,
      version: input.version,
      documentUrl: input.documentUrl ?? null,
      notes: input.notes ?? null,
      createdAt: now,
      updatedAt: now
    };
    MEM_POLICIES.push(policy);
    return policy;
  }
  const [insertedPolicy] = await db.insert(compliancePolicies).values({
    organizationId: orgId,
    policyCode: input.policyCode ?? null,
    title: input.title,
    description: input.description ?? null,
    policyType: input.policyType,
    frameworks: frameworksJson,
    controlReferences: controlReferencesJson,
    status: input.status,
    ownerId: input.ownerId ?? null,
    reviewCycleMonths: input.reviewCycleMonths,
    nextReviewAt,
    version: input.version,
    documentUrl: input.documentUrl ?? null,
    notes: input.notes ?? null
  }).returning({ id: compliancePolicies.id });
  const newId = insertedPolicy.id;
  return {
    id: newId,
    organizationId: orgId,
    policyCode: input.policyCode ?? null,
    title: input.title,
    description: input.description ?? null,
    policyType: input.policyType,
    frameworks: frameworksJson,
    controlReferences: controlReferencesJson,
    status: input.status,
    ownerId: input.ownerId ?? null,
    reviewCycleMonths: input.reviewCycleMonths,
    lastApprovedAt: null,
    nextReviewAt,
    version: input.version,
    documentUrl: input.documentUrl ?? null,
    notes: input.notes ?? null,
    createdAt: now,
    updatedAt: now
  };
}
async function patchPolicy(orgId, id, updates) {
  const db = await getDb();
  if (!db || orgId < 0) {
    const policy = MEM_POLICIES.find((p) => p.id === id && p.organizationId === orgId);
    if (!policy) return null;
    Object.assign(policy, updates);
    return policy;
  }
  const existing = await db.select({ id: compliancePolicies.id }).from(compliancePolicies).where(and15(eq20(compliancePolicies.id, id), eq20(compliancePolicies.organizationId, orgId)));
  if (!existing.length) return null;
  await db.update(compliancePolicies).set(updates).where(and15(eq20(compliancePolicies.id, id), eq20(compliancePolicies.organizationId, orgId)));
  return { id };
}
async function getPolicyStatus(orgId, id) {
  const db = await getDb();
  if (!db || orgId < 0) {
    return MEM_POLICIES.find((p) => p.id === id && p.organizationId === orgId)?.status ?? null;
  }
  const rows = await db.select({ status: compliancePolicies.status }).from(compliancePolicies).where(and15(eq20(compliancePolicies.id, id), eq20(compliancePolicies.organizationId, orgId)));
  return rows[0]?.status ?? null;
}
async function applyPolicyStatusTransition(orgId, id, newStatus) {
  const db = await getDb();
  const now = /* @__PURE__ */ new Date();
  if (!db || orgId < 0) {
    const policy = MEM_POLICIES.find((p) => p.id === id && p.organizationId === orgId);
    if (!policy) return null;
    policy.status = newStatus;
    policy.updatedAt = now;
    if (newStatus === "approved" || newStatus === "active") policy.lastApprovedAt = now;
    return { id: policy.id, status: policy.status };
  }
  const setPatch = { status: newStatus, updatedAt: now };
  if (newStatus === "approved" || newStatus === "active") setPatch.lastApprovedAt = now;
  await db.update(compliancePolicies).set(setPatch).where(and15(eq20(compliancePolicies.id, id), eq20(compliancePolicies.organizationId, orgId)));
  return { id, status: newStatus };
}
async function deletePolicy(orgId, id) {
  const db = await getDb();
  if (!db || orgId < 0) {
    const idx = MEM_POLICIES.findIndex((p) => p.id === id && p.organizationId === orgId);
    if (idx === -1) return false;
    MEM_POLICIES.splice(idx, 1);
    return true;
  }
  const rows = await db.select({ id: compliancePolicies.id }).from(compliancePolicies).where(and15(eq20(compliancePolicies.id, id), eq20(compliancePolicies.organizationId, orgId)));
  if (!rows.length) return false;
  await db.delete(compliancePolicies).where(and15(eq20(compliancePolicies.id, id), eq20(compliancePolicies.organizationId, orgId)));
  return true;
}

// server/policy-router.ts
var STATUS_TRANSITIONS = {
  draft: ["under_review", "retired"],
  under_review: ["approved", "draft", "retired"],
  approved: ["active", "under_review", "retired"],
  active: ["under_review", "retired"],
  retired: []
};
var policyTypeEnum2 = z19.enum(["policy", "standard", "procedure", "guideline"]);
var statusEnum3 = z19.enum(["draft", "under_review", "approved", "active", "retired"]);
var createSchema3 = z19.object({
  policyCode: z19.string().trim().max(50).optional(),
  title: z19.string().trim().min(1).max(255),
  description: z19.string().trim().max(5e3).optional(),
  policyType: policyTypeEnum2,
  frameworks: z19.array(z19.string()),
  controlReferences: z19.array(z19.string()),
  status: statusEnum3,
  ownerId: z19.number().int().positive().optional(),
  reviewCycleMonths: z19.number().int().min(1).max(120),
  nextReviewAt: z19.string().optional(),
  version: z19.string().trim().max(20),
  documentUrl: z19.string().url().optional().or(z19.literal("")),
  notes: z19.string().trim().max(5e3).optional()
});
var policyRouter = router({
  list: activeOrgProcedure.query(async ({ ctx }) => {
    await requireModulePermission(ctx, "policy_manager", "canView");
    return listPolicies(ctx.organizationId);
  }),
  create: activeOrgProcedure.input(createSchema3).mutation(async ({ ctx, input }) => {
    await requireModulePermission(ctx, "policy_manager", "canCreate");
    const orgId = ctx.organizationId;
    const result = await createPolicy(orgId, input);
    void recordAuditEvent(ctx, {
      category: "data_write",
      action: "policy.create",
      entityType: "compliancePolicies",
      entityId: result.id,
      targetEntity: input.title,
      outcome: "success"
    });
    return result;
  }),
  patch: activeOrgProcedure.input(z19.object({ id: z19.number().int().positive() }).merge(createSchema3.partial())).mutation(async ({ ctx, input }) => {
    await requireModulePermission(ctx, "policy_manager", "canEdit");
    const { id, ...data } = input;
    const orgId = ctx.organizationId;
    const result = await patchPolicy(orgId, id, data);
    if (!result) throw new TRPCError14({ code: "NOT_FOUND" });
    void recordAuditEvent(ctx, {
      category: "data_write",
      action: "policy.patch",
      entityType: "compliancePolicies",
      entityId: id,
      outcome: "success"
    });
    return result;
  }),
  updateStatus: activeOrgProcedure.input(z19.object({ id: z19.number().int().positive(), status: statusEnum3 })).mutation(async ({ ctx, input }) => {
    await requireModulePermission(ctx, "policy_manager", "canEdit");
    const orgId = ctx.organizationId;
    const currentStatus = await getPolicyStatus(orgId, input.id);
    if (currentStatus === null) throw new TRPCError14({ code: "NOT_FOUND" });
    const allowed = STATUS_TRANSITIONS[currentStatus] ?? [];
    if (!allowed.includes(input.status)) {
      throw new TRPCError14({ code: "BAD_REQUEST", message: `Cannot transition from '${currentStatus}' to '${input.status}'` });
    }
    const result = await applyPolicyStatusTransition(orgId, input.id, input.status);
    if (!result) throw new TRPCError14({ code: "NOT_FOUND" });
    void recordAuditEvent(ctx, {
      category: "data_write",
      action: "policy.updateStatus",
      entityType: "compliancePolicies",
      entityId: input.id,
      outcome: "success",
      payload: { from: currentStatus, to: input.status }
    });
    return result;
  }),
  remove: activeOrgProcedure.input(z19.number().int().positive()).mutation(async ({ ctx, input: id }) => {
    await requireModulePermission(ctx, "policy_manager", "canDelete");
    const orgId = ctx.organizationId;
    const found = await deletePolicy(orgId, id);
    if (!found) throw new TRPCError14({ code: "NOT_FOUND" });
    void recordAuditEvent(ctx, {
      category: "data_write",
      action: "policy.remove",
      entityType: "compliancePolicies",
      entityId: id,
      outcome: "success"
    });
    return { success: true };
  })
});

// server/incident-router.ts
import { z as z20 } from "zod";
import { TRPCError as TRPCError15 } from "@trpc/server";

// server/incident-store.ts
init_schema();
init_db();
import { and as and16, desc as desc10, eq as eq21 } from "drizzle-orm";
var MEM_INCIDENTS = [];
var memSeq4 = 1;
async function listIncidents(orgId) {
  const db = await getDb();
  if (!db || orgId < 0) {
    return [...MEM_INCIDENTS.filter((i) => i.organizationId === orgId)].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  return db.select().from(complianceIncidents).where(eq21(complianceIncidents.organizationId, orgId)).orderBy(desc10(complianceIncidents.createdAt));
}
async function createIncident(orgId, input) {
  const db = await getDb();
  const now = /* @__PURE__ */ new Date();
  const occurredAt = input.occurredAt ? new Date(input.occurredAt) : null;
  const detectedAt = input.detectedAt ? new Date(input.detectedAt) : null;
  const fwJson = JSON.stringify(input.affectedFrameworks);
  const dataTypesJson = JSON.stringify(input.affectedDataTypes);
  const baseRow = {
    organizationId: orgId,
    incidentCode: input.incidentCode ?? null,
    title: input.title,
    description: input.description ?? null,
    incidentType: input.incidentType,
    severity: input.severity,
    status: input.status,
    affectedFrameworks: fwJson,
    affectedVendorId: input.affectedVendorId ?? null,
    affectedDataTypes: dataTypesJson,
    affectedDataSubjects: input.affectedDataSubjects ?? null,
    reportedById: input.reportedById ?? null,
    occurredAt,
    detectedAt,
    containedAt: null,
    resolvedAt: null,
    regulatoryNotificationRequired: input.regulatoryNotificationRequired,
    regulatoryNotificationSentAt: null,
    notificationDeadlineHours: input.notificationDeadlineHours,
    rootCause: input.rootCause ?? null,
    lessonsLearned: input.lessonsLearned ?? null,
    notes: input.notes ?? null,
    createdAt: now,
    updatedAt: now
  };
  if (!db || orgId < 0) {
    const incident = { id: memSeq4++, ...baseRow };
    MEM_INCIDENTS.push(incident);
    return incident;
  }
  const [insertedIncident] = await db.insert(complianceIncidents).values({
    organizationId: orgId,
    incidentCode: input.incidentCode ?? null,
    title: input.title,
    description: input.description ?? null,
    incidentType: input.incidentType,
    severity: input.severity,
    status: input.status,
    affectedFrameworks: fwJson,
    affectedVendorId: input.affectedVendorId ?? null,
    affectedDataTypes: dataTypesJson,
    affectedDataSubjects: input.affectedDataSubjects ?? null,
    reportedById: input.reportedById ?? null,
    occurredAt,
    detectedAt,
    regulatoryNotificationRequired: input.regulatoryNotificationRequired ? 1 : 0,
    notificationDeadlineHours: input.notificationDeadlineHours,
    rootCause: input.rootCause ?? null,
    lessonsLearned: input.lessonsLearned ?? null,
    notes: input.notes ?? null
  }).returning({ id: complianceIncidents.id });
  const newId = insertedIncident.id;
  return { id: newId, ...baseRow };
}
async function patchIncident(orgId, id, updates) {
  const db = await getDb();
  if (!db || orgId < 0) {
    const incident = MEM_INCIDENTS.find((i) => i.id === id && i.organizationId === orgId);
    if (!incident) return null;
    Object.assign(incident, updates);
    return incident;
  }
  const existing = await db.select({ id: complianceIncidents.id }).from(complianceIncidents).where(and16(eq21(complianceIncidents.id, id), eq21(complianceIncidents.organizationId, orgId)));
  if (!existing.length) return null;
  await db.update(complianceIncidents).set(updates).where(and16(eq21(complianceIncidents.id, id), eq21(complianceIncidents.organizationId, orgId)));
  return { id };
}
async function getIncidentStatus(orgId, id) {
  const db = await getDb();
  if (!db || orgId < 0) {
    return MEM_INCIDENTS.find((i) => i.id === id && i.organizationId === orgId)?.status ?? null;
  }
  const rows = await db.select({ status: complianceIncidents.status }).from(complianceIncidents).where(and16(eq21(complianceIncidents.id, id), eq21(complianceIncidents.organizationId, orgId)));
  return rows[0]?.status ?? null;
}
async function applyIncidentStatusTransition(orgId, id, newStatus) {
  const db = await getDb();
  const now = /* @__PURE__ */ new Date();
  if (!db || orgId < 0) {
    const incident = MEM_INCIDENTS.find((i) => i.id === id && i.organizationId === orgId);
    if (!incident) return null;
    incident.status = newStatus;
    incident.updatedAt = now;
    if (newStatus === "contained") incident.containedAt = now;
    if (newStatus === "resolved" || newStatus === "closed") incident.resolvedAt = now;
    return { id: incident.id, status: incident.status };
  }
  const setPatch = { status: newStatus, updatedAt: now };
  if (newStatus === "contained") setPatch.containedAt = now;
  if (newStatus === "resolved" || newStatus === "closed") setPatch.resolvedAt = now;
  await db.update(complianceIncidents).set(setPatch).where(and16(eq21(complianceIncidents.id, id), eq21(complianceIncidents.organizationId, orgId)));
  return { id, status: newStatus };
}
async function markIncidentNotified(orgId, id) {
  const db = await getDb();
  const now = /* @__PURE__ */ new Date();
  if (!db || orgId < 0) {
    const incident = MEM_INCIDENTS.find((i) => i.id === id && i.organizationId === orgId);
    if (!incident) return null;
    incident.regulatoryNotificationSentAt = now;
    incident.updatedAt = now;
    return { id, notifiedAt: now };
  }
  const rows = await db.select({ id: complianceIncidents.id }).from(complianceIncidents).where(and16(eq21(complianceIncidents.id, id), eq21(complianceIncidents.organizationId, orgId)));
  if (!rows.length) return null;
  await db.update(complianceIncidents).set({ regulatoryNotificationSentAt: now, updatedAt: now }).where(and16(eq21(complianceIncidents.id, id), eq21(complianceIncidents.organizationId, orgId)));
  return { id, notifiedAt: now };
}
async function deleteIncident(orgId, id) {
  const db = await getDb();
  if (!db || orgId < 0) {
    const idx = MEM_INCIDENTS.findIndex((i) => i.id === id && i.organizationId === orgId);
    if (idx === -1) return false;
    MEM_INCIDENTS.splice(idx, 1);
    return true;
  }
  const rows = await db.select({ id: complianceIncidents.id }).from(complianceIncidents).where(and16(eq21(complianceIncidents.id, id), eq21(complianceIncidents.organizationId, orgId)));
  if (!rows.length) return false;
  await db.delete(complianceIncidents).where(and16(eq21(complianceIncidents.id, id), eq21(complianceIncidents.organizationId, orgId)));
  return true;
}

// server/incident-router.ts
var STATUS_TRANSITIONS2 = {
  open: ["under_investigation", "contained", "closed"],
  under_investigation: ["contained", "resolved", "closed"],
  contained: ["resolved", "under_investigation", "closed"],
  resolved: ["closed", "under_investigation"],
  closed: []
};
var incidentTypeEnum2 = z20.enum(["data_breach", "unauthorized_access", "policy_violation", "system_outage", "third_party_breach", "other"]);
var severityEnum3 = z20.enum(["critical", "high", "medium", "low"]);
var statusEnum4 = z20.enum(["open", "under_investigation", "contained", "resolved", "closed"]);
var createSchema4 = z20.object({
  incidentCode: z20.string().trim().max(50).optional(),
  title: z20.string().trim().min(1).max(255),
  description: z20.string().trim().max(5e3).optional(),
  incidentType: incidentTypeEnum2,
  severity: severityEnum3,
  status: statusEnum4,
  affectedFrameworks: z20.array(z20.string()),
  affectedVendorId: z20.number().int().positive().optional(),
  affectedDataTypes: z20.array(z20.string()),
  affectedDataSubjects: z20.number().int().min(0).optional(),
  occurredAt: z20.string().optional(),
  detectedAt: z20.string().optional(),
  regulatoryNotificationRequired: z20.boolean(),
  notificationDeadlineHours: z20.number().int().min(1).max(720),
  rootCause: z20.string().trim().max(5e3).optional(),
  lessonsLearned: z20.string().trim().max(5e3).optional(),
  notes: z20.string().trim().max(5e3).optional()
});
var incidentRouter = router({
  list: activeOrgProcedure.query(async ({ ctx }) => {
    await requireModulePermission(ctx, "incident_register", "canView");
    return listIncidents(ctx.organizationId);
  }),
  create: activeOrgProcedure.input(createSchema4).mutation(async ({ ctx, input }) => {
    await requireModulePermission(ctx, "incident_register", "canCreate");
    const orgId = ctx.organizationId;
    const result = await createIncident(orgId, input);
    void recordAuditEvent(ctx, {
      category: "data_write",
      action: "incident.create",
      entityType: "complianceIncidents",
      entityId: result.id,
      targetEntity: input.title,
      outcome: "success"
    });
    return result;
  }),
  patch: activeOrgProcedure.input(z20.object({ id: z20.number().int().positive() }).merge(createSchema4.partial())).mutation(async ({ ctx, input }) => {
    await requireModulePermission(ctx, "incident_register", "canEdit");
    const { id, ...data } = input;
    const orgId = ctx.organizationId;
    const result = await patchIncident(orgId, id, data);
    if (!result) throw new TRPCError15({ code: "NOT_FOUND" });
    void recordAuditEvent(ctx, {
      category: "data_write",
      action: "incident.patch",
      entityType: "complianceIncidents",
      entityId: id,
      outcome: "success"
    });
    return result;
  }),
  updateStatus: activeOrgProcedure.input(z20.object({ id: z20.number().int().positive(), status: statusEnum4 })).mutation(async ({ ctx, input }) => {
    await requireModulePermission(ctx, "incident_register", "canEdit");
    const orgId = ctx.organizationId;
    const currentStatus = await getIncidentStatus(orgId, input.id);
    if (currentStatus === null) throw new TRPCError15({ code: "NOT_FOUND" });
    const allowed = STATUS_TRANSITIONS2[currentStatus] ?? [];
    if (!allowed.includes(input.status)) {
      throw new TRPCError15({ code: "BAD_REQUEST", message: `Cannot transition from '${currentStatus}' to '${input.status}'` });
    }
    const result = await applyIncidentStatusTransition(orgId, input.id, input.status);
    if (!result) throw new TRPCError15({ code: "NOT_FOUND" });
    void recordAuditEvent(ctx, {
      category: "data_write",
      action: "incident.updateStatus",
      entityType: "complianceIncidents",
      entityId: input.id,
      outcome: "success",
      payload: { from: currentStatus, to: input.status }
    });
    return result;
  }),
  markNotified: activeOrgProcedure.input(z20.number().int().positive()).mutation(async ({ ctx, input: id }) => {
    await requireModulePermission(ctx, "incident_register", "canEdit");
    const orgId = ctx.organizationId;
    const result = await markIncidentNotified(orgId, id);
    if (!result) throw new TRPCError15({ code: "NOT_FOUND" });
    void recordAuditEvent(ctx, {
      category: "data_write",
      action: "incident.markNotified",
      entityType: "complianceIncidents",
      entityId: id,
      outcome: "success"
    });
    return result;
  }),
  remove: activeOrgProcedure.input(z20.number().int().positive()).mutation(async ({ ctx, input: id }) => {
    await requireModulePermission(ctx, "incident_register", "canDelete");
    const orgId = ctx.organizationId;
    const found = await deleteIncident(orgId, id);
    if (!found) throw new TRPCError15({ code: "NOT_FOUND" });
    void recordAuditEvent(ctx, {
      category: "data_write",
      action: "incident.remove",
      entityType: "complianceIncidents",
      entityId: id,
      outcome: "success"
    });
    return { success: true };
  })
});

// server/audit-schedule-router.ts
import { z as z21 } from "zod";
import { TRPCError as TRPCError16 } from "@trpc/server";

// server/audit-schedule-store.ts
init_schema();
init_db();
import { and as and17, asc, eq as eq22 } from "drizzle-orm";
var MEM_AUDITS = [];
var memSeq5 = 1;
function addMonths(d2, n) {
  const r = new Date(d2);
  r.setMonth(r.getMonth() + n);
  return r;
}
function calcNextOccurrence(completed, rec) {
  switch (rec) {
    case "monthly":
      return addMonths(completed, 1);
    case "quarterly":
      return addMonths(completed, 3);
    case "biannual":
      return addMonths(completed, 6);
    case "annual":
      return addMonths(completed, 12);
    default:
      return null;
  }
}
async function listAudits(orgId) {
  const db = await getDb();
  if (!db || orgId < 0) {
    return MEM_AUDITS.filter((a) => a.organizationId === orgId).sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime());
  }
  return db.select().from(auditSchedules).where(eq22(auditSchedules.organizationId, orgId)).orderBy(asc(auditSchedules.scheduledDate));
}
async function createAudit(orgId, input) {
  const db = await getDb();
  const now = /* @__PURE__ */ new Date();
  const scopeJson = input.scope ? JSON.stringify(input.scope) : null;
  const scheduledDate = new Date(input.scheduledDate);
  if (!db || orgId < 0) {
    const entry = {
      id: memSeq5++,
      organizationId: orgId,
      title: input.title,
      description: input.description ?? null,
      auditType: input.auditType,
      scope: scopeJson,
      status: input.status,
      scheduledDate,
      completedDate: null,
      assignedToId: input.assignedToId ?? null,
      vendorId: input.vendorId ?? null,
      findings: input.findings ?? null,
      recurrence: input.recurrence,
      nextOccurrence: null,
      notes: input.notes ?? null,
      createdAt: now,
      updatedAt: now
    };
    MEM_AUDITS.push(entry);
    return { id: entry.id };
  }
  const [insertedAudit] = await db.insert(auditSchedules).values({
    organizationId: orgId,
    title: input.title,
    description: input.description ?? null,
    auditType: input.auditType,
    scope: scopeJson,
    status: input.status,
    scheduledDate,
    assignedToId: input.assignedToId ?? null,
    vendorId: input.vendorId ?? null,
    findings: input.findings ?? null,
    recurrence: input.recurrence,
    notes: input.notes ?? null
  }).returning({ id: auditSchedules.id });
  return { id: insertedAudit.id };
}
async function patchAudit(orgId, id, updates) {
  const db = await getDb();
  if (!db || orgId < 0) {
    const idx = MEM_AUDITS.findIndex((a) => a.id === id && a.organizationId === orgId);
    if (idx >= 0) Object.assign(MEM_AUDITS[idx], updates, { updatedAt: /* @__PURE__ */ new Date() });
    return;
  }
  await db.update(auditSchedules).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(and17(eq22(auditSchedules.id, id), eq22(auditSchedules.organizationId, orgId)));
}
async function completeAudit(orgId, id, findings) {
  const db = await getDb();
  const completedDate = /* @__PURE__ */ new Date();
  if (!db || orgId < 0) {
    const idx = MEM_AUDITS.findIndex((a) => a.id === id && a.organizationId === orgId);
    if (idx >= 0) {
      const rec2 = MEM_AUDITS[idx].recurrence;
      const nextOcc2 = calcNextOccurrence(completedDate, rec2);
      Object.assign(MEM_AUDITS[idx], { status: "completed", completedDate, nextOccurrence: nextOcc2, updatedAt: /* @__PURE__ */ new Date() });
      return { nextOccurrence: nextOcc2?.toISOString() ?? null, found: true };
    }
    return { nextOccurrence: null, found: false };
  }
  const rows = await db.select().from(auditSchedules).where(and17(eq22(auditSchedules.id, id), eq22(auditSchedules.organizationId, orgId)));
  if (!rows.length) return { nextOccurrence: null, found: false };
  const audit = rows[0];
  const rec = audit.recurrence ?? "none";
  const nextOcc = calcNextOccurrence(completedDate, rec);
  await db.update(auditSchedules).set({
    status: "completed",
    completedDate,
    findings: findings ?? audit.findings ?? null,
    nextOccurrence: nextOcc ?? null,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq22(auditSchedules.id, id));
  return { nextOccurrence: nextOcc?.toISOString() ?? null, found: true };
}
async function removeAudit(orgId, id) {
  const db = await getDb();
  if (!db || orgId < 0) {
    const idx = MEM_AUDITS.findIndex((a) => a.id === id && a.organizationId === orgId);
    if (idx >= 0) MEM_AUDITS.splice(idx, 1);
    return;
  }
  await db.delete(auditSchedules).where(and17(eq22(auditSchedules.id, id), eq22(auditSchedules.organizationId, orgId)));
}

// server/audit-schedule-router.ts
var auditTypeEnum2 = z21.enum(["internal", "external", "regulatory", "certification"]);
var statusEnum5 = z21.enum(["planned", "in_progress", "completed", "cancelled"]);
var recurrenceEnum2 = z21.enum(["none", "monthly", "quarterly", "biannual", "annual"]);
var createSchema5 = z21.object({
  title: z21.string().trim().min(2, "Title must be at least 2 characters").max(255),
  description: z21.string().trim().max(2e3).optional(),
  auditType: auditTypeEnum2.default("internal"),
  scope: z21.array(z21.string().trim().max(64)).max(20).optional(),
  status: statusEnum5.default("planned"),
  scheduledDate: z21.string().min(1),
  assignedToId: z21.number().int().positive().optional(),
  vendorId: z21.number().int().positive().optional(),
  findings: z21.string().trim().max(4e3).optional(),
  recurrence: recurrenceEnum2.default("none"),
  notes: z21.string().trim().max(2e3).optional()
});
var patchSchema3 = createSchema5.partial().extend({
  id: z21.number().int().positive()
});
var auditScheduleRouter = router({
  list: activeOrgProcedure.query(async ({ ctx }) => {
    await requireModulePermission(ctx, "audit_schedule", "canView");
    return listAudits(ctx.organizationId);
  }),
  create: activeOrgProcedure.input(createSchema5).mutation(async ({ ctx, input }) => {
    await requireModulePermission(ctx, "audit_schedule", "canCreate");
    const orgId = ctx.organizationId;
    const result = await createAudit(orgId, input);
    void recordAuditEvent(ctx, {
      category: "data_write",
      action: "audit_schedule_created",
      entityType: "auditSchedules",
      entityId: result.id,
      payload: { title: input.title, orgId }
    });
    return result;
  }),
  patch: activeOrgProcedure.input(patchSchema3).mutation(async ({ ctx, input }) => {
    await requireModulePermission(ctx, "audit_schedule", "canEdit");
    const { id, scope: scopeArr, scheduledDate: sdStr, ...rest } = input;
    const orgId = ctx.organizationId;
    const updates = { ...rest };
    if (scopeArr !== void 0) updates.scope = JSON.stringify(scopeArr);
    if (sdStr !== void 0) updates.scheduledDate = new Date(sdStr);
    await patchAudit(orgId, id, updates);
    void recordAuditEvent(ctx, {
      category: "data_write",
      action: "audit_schedule_updated",
      entityType: "auditSchedules",
      entityId: id,
      payload: { fields: Object.keys(updates) }
    });
    return { success: true };
  }),
  complete: activeOrgProcedure.input(z21.object({
    id: z21.number().int().positive(),
    findings: z21.string().trim().max(4e3).optional()
  })).mutation(async ({ ctx, input }) => {
    await requireModulePermission(ctx, "audit_schedule", "canEdit");
    const orgId = ctx.organizationId;
    const result = await completeAudit(orgId, input.id, input.findings);
    if (!result.found) {
      throw new TRPCError16({ code: "NOT_FOUND", message: "Audit not found" });
    }
    void recordAuditEvent(ctx, {
      category: "data_write",
      action: "audit_schedule_completed",
      entityType: "auditSchedules",
      entityId: input.id,
      payload: { nextOccurrence: result.nextOccurrence }
    });
    return { nextOccurrence: result.nextOccurrence };
  }),
  remove: activeOrgProcedure.input(z21.object({ id: z21.number().int().positive() })).mutation(async ({ ctx, input }) => {
    await requireModulePermission(ctx, "audit_schedule", "canDelete");
    const orgId = ctx.organizationId;
    await removeAudit(orgId, input.id);
    void recordAuditEvent(ctx, {
      category: "data_write",
      action: "audit_schedule_deleted",
      entityType: "auditSchedules",
      entityId: input.id,
      payload: { orgId }
    });
    return { success: true };
  })
});

// server/vendor-compliance-router.ts
import { z as z22 } from "zod";
import { TRPCError as TRPCError17 } from "@trpc/server";

// server/vendor-compliance-store.ts
init_schema();
init_db();
import { and as and18, eq as eq23, inArray as inArray3 } from "drizzle-orm";
function calcRiskLevel(score) {
  if (score < 40) return "critical";
  if (score < 60) return "high";
  if (score < 80) return "medium";
  return "low";
}
function calcCompositeScore(params) {
  const base = params.avgAssessmentScore !== null ? 40 * (params.avgAssessmentScore / 100) : 60;
  const deductions = params.criticalGaps * 8 + params.openGaps * 2 + params.criticalRisks * 6 + params.openRisks * 1.5 + params.criticalIncidents * 5 + params.openIncidents * 1 + params.openRemediations * 1;
  return Math.max(0, Math.min(100, Math.round(base + 60 - deductions)));
}
async function getVendorComplianceList(orgId) {
  const db = await getDb();
  if (!db || orgId < 0) return [];
  const vendorRows = await db.select({ id: vendors.id, vendorName: vendors.vendorName, industry: vendors.industry, headquartersLocation: vendors.headquartersLocation, riskTier: vendors.riskTier }).from(vendors).where(eq23(vendors.organizationId, orgId));
  if (!vendorRows.length) return [];
  const vendorIds = vendorRows.map((v) => v.id);
  const assessRows = await db.select({ id: vendorAssessments.id, vendorId: vendorAssessments.vendorId, complianceScore: vendorAssessments.complianceScore }).from(vendorAssessments).where(inArray3(vendorAssessments.vendorId, vendorIds));
  const assessIds = assessRows.map((a) => a.id);
  const gapRows = assessIds.length ? await db.select({ assessmentId: assessmentGaps.assessmentId, severity: assessmentGaps.severity }).from(assessmentGaps).where(inArray3(assessmentGaps.assessmentId, assessIds)) : [];
  const [riskRows, remRows, incRows] = await Promise.all([
    db.select({ vendorId: riskRegister.vendorId, status: riskRegister.status, likelihood: riskRegister.likelihood, impact: riskRegister.impact }).from(riskRegister).where(eq23(riskRegister.organizationId, orgId)),
    db.select({ vendorId: remediationTasks.vendorId, status: remediationTasks.status }).from(remediationTasks).where(eq23(remediationTasks.organizationId, orgId)),
    db.select({ affectedVendorId: complianceIncidents.affectedVendorId, severity: complianceIncidents.severity, status: complianceIncidents.status }).from(complianceIncidents).where(eq23(complianceIncidents.organizationId, orgId))
  ]);
  return vendorRows.map((v) => {
    const vAssess = assessRows.filter((a) => a.vendorId === v.id);
    const vGapIds = new Set(vAssess.map((a) => a.id));
    const vGaps = gapRows.filter((g) => g.assessmentId != null && vGapIds.has(g.assessmentId));
    const openGaps = vGaps.length;
    const criticalGaps = vGaps.filter((g) => g.severity === "critical").length;
    const vRisks = riskRows.filter((r) => r.vendorId === v.id && r.status !== "closed" && r.status !== "accepted");
    const criticalRisks = vRisks.filter((r) => (r.likelihood ?? 1) * (r.impact ?? 1) >= 15).length;
    const vRem = remRows.filter((r) => r.vendorId === v.id && r.status !== "resolved" && r.status !== "accepted_risk");
    const openRemediations = vRem.length;
    const vInc = incRows.filter((i) => i.affectedVendorId === v.id && i.status !== "closed" && i.status !== "resolved");
    const criticalIncidents = vInc.filter((i) => i.severity === "critical").length;
    const openIncidents = vInc.length;
    const scores = vAssess.map((a) => a.complianceScore).filter((s) => s !== null && s !== void 0);
    const avgAssessmentScore = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
    const compositeScore = calcCompositeScore({ avgAssessmentScore, criticalGaps, openGaps, criticalRisks, openRisks: vRisks.length, criticalIncidents, openIncidents, openRemediations });
    return { id: v.id, vendorName: v.vendorName, industry: v.industry ?? null, headquartersLocation: v.headquartersLocation ?? null, riskTier: v.riskTier ?? null, assessmentCount: vAssess.length, avgAssessmentScore, openGaps, criticalGaps, openRisks: vRisks.length, criticalRisks, openRemediations, openIncidents, criticalIncidents, compositeScore, riskLevel: calcRiskLevel(compositeScore) };
  }).sort((a, b) => a.compositeScore - b.compositeScore);
}
async function getVendorComplianceProfile(orgId, vendorId) {
  const db = await getDb();
  if (!db || orgId < 0) return null;
  const [vendor] = await db.select().from(vendors).where(and18(eq23(vendors.id, vendorId), eq23(vendors.organizationId, orgId)));
  if (!vendor) return null;
  const [assessRows, riskRows, remRows, incRows] = await Promise.all([
    db.select().from(vendorAssessments).where(eq23(vendorAssessments.vendorId, vendorId)),
    db.select().from(riskRegister).where(and18(eq23(riskRegister.organizationId, orgId), eq23(riskRegister.vendorId, vendorId))),
    db.select().from(remediationTasks).where(and18(eq23(remediationTasks.organizationId, orgId), eq23(remediationTasks.vendorId, vendorId))),
    db.select().from(complianceIncidents).where(and18(eq23(complianceIncidents.organizationId, orgId), eq23(complianceIncidents.affectedVendorId, vendorId)))
  ]);
  const assessIds = assessRows.map((a) => a.id);
  const gapRows = assessIds.length ? await db.select().from(assessmentGaps).where(inArray3(assessmentGaps.assessmentId, assessIds)) : [];
  return {
    vendor: { id: vendor.id, vendorName: vendor.vendorName, industry: vendor.industry ?? null, headquartersLocation: vendor.headquartersLocation ?? null, riskTier: vendor.riskTier ?? null },
    assessments: assessRows,
    gaps: gapRows,
    risks: riskRows,
    remediationTasks: remRows,
    incidents: incRows
  };
}

// server/vendor-compliance-router.ts
var vendorComplianceRouter = router({
  list: activeOrgProcedure.query(async ({ ctx }) => {
    await requireModulePermission(ctx, "vendor_compliance_profiles", "canView");
    return getVendorComplianceList(ctx.organizationId);
  }),
  profile: activeOrgProcedure.input(z22.object({ vendorId: z22.number().int().positive() })).query(async ({ ctx, input }) => {
    await requireModulePermission(ctx, "vendor_compliance_profiles", "canView");
    const profile = await getVendorComplianceProfile(ctx.organizationId, input.vendorId);
    if (!profile) throw new TRPCError17({ code: "NOT_FOUND", message: "Vendor not found" });
    return profile;
  })
});

// server/compliance-report-router.ts
import { z as z23 } from "zod";

// server/compliance-report-store.ts
init_schema();
init_db();
import { eq as eq24, inArray as inArray4 } from "drizzle-orm";
function toIso2(d2) {
  if (!d2) return null;
  return d2 instanceof Date ? d2.toISOString() : String(d2);
}
var EMPTY_SUMMARY = {
  generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
  vendors: { total: 0 },
  gaps: { total: 0, critical: 0, high: 0 },
  risks: { total: 0, open: 0, critical: 0 },
  remediation: { total: 0, open: 0, resolved: 0 },
  policies: { total: 0, active: 0, draft: 0 },
  incidents: { total: 0, open: 0, critical: 0 },
  auditSchedule: { total: 0, upcoming: 0, overdue: 0, completed: 0 }
};
async function getComplianceSummary(orgId) {
  const db = await getDb();
  if (!db || orgId < 0) return { ...EMPTY_SUMMARY, generatedAt: (/* @__PURE__ */ new Date()).toISOString() };
  const now = /* @__PURE__ */ new Date();
  const vRows = await db.select({ id: vendors.id }).from(vendors).where(eq24(vendors.organizationId, orgId));
  const vendorIds = vRows.map((v) => v.id);
  let gapRows = [];
  if (vendorIds.length) {
    const assessRows = await db.select({ id: vendorAssessments.id }).from(vendorAssessments).where(inArray4(vendorAssessments.vendorId, vendorIds));
    const assessIds = assessRows.map((a) => a.id);
    if (assessIds.length) {
      gapRows = await db.select({ severity: assessmentGaps.severity }).from(assessmentGaps).where(inArray4(assessmentGaps.assessmentId, assessIds));
    }
  }
  const [rRows, remRows, pRows, iRows, asRows] = await Promise.all([
    db.select({ status: riskRegister.status, likelihood: riskRegister.likelihood, impact: riskRegister.impact }).from(riskRegister).where(eq24(riskRegister.organizationId, orgId)),
    db.select({ status: remediationTasks.status }).from(remediationTasks).where(eq24(remediationTasks.organizationId, orgId)),
    db.select({ status: compliancePolicies.status }).from(compliancePolicies).where(eq24(compliancePolicies.organizationId, orgId)),
    db.select({ status: complianceIncidents.status, severity: complianceIncidents.severity }).from(complianceIncidents).where(eq24(complianceIncidents.organizationId, orgId)),
    db.select({ status: auditSchedules.status, scheduledDate: auditSchedules.scheduledDate }).from(auditSchedules).where(eq24(auditSchedules.organizationId, orgId))
  ]);
  return {
    generatedAt: now.toISOString(),
    vendors: { total: vRows.length },
    gaps: {
      total: gapRows.length,
      critical: gapRows.filter((g) => g.severity === "critical").length,
      high: gapRows.filter((g) => g.severity === "high").length
    },
    risks: {
      total: rRows.length,
      open: rRows.filter((r) => r.status === "open" || r.status === "in_treatment").length,
      critical: rRows.filter((r) => (r.likelihood ?? 1) * (r.impact ?? 1) >= 15).length
    },
    remediation: {
      total: remRows.length,
      open: remRows.filter((r) => r.status === "open" || r.status === "in_progress").length,
      resolved: remRows.filter((r) => r.status === "resolved").length
    },
    policies: {
      total: pRows.length,
      active: pRows.filter((p) => p.status === "active").length,
      draft: pRows.filter((p) => p.status === "draft").length
    },
    incidents: {
      total: iRows.length,
      open: iRows.filter((i) => i.status !== "closed" && i.status !== "resolved").length,
      critical: iRows.filter((i) => i.severity === "critical").length
    },
    auditSchedule: {
      total: asRows.length,
      upcoming: asRows.filter((a) => a.status === "planned" && a.scheduledDate != null && new Date(a.scheduledDate) >= now).length,
      overdue: asRows.filter((a) => a.status === "planned" && a.scheduledDate != null && new Date(a.scheduledDate) < now).length,
      completed: asRows.filter((a) => a.status === "completed").length
    }
  };
}
async function getComplianceModuleData(orgId, module) {
  const db = await getDb();
  if (!db || orgId < 0) return [];
  switch (module) {
    case "gaps": {
      const vRows = await db.select({ id: vendors.id, vendorName: vendors.vendorName }).from(vendors).where(eq24(vendors.organizationId, orgId));
      if (!vRows.length) return [];
      const vendorIds = vRows.map((v) => v.id);
      const aRows = await db.select({ id: vendorAssessments.id, vendorId: vendorAssessments.vendorId }).from(vendorAssessments).where(inArray4(vendorAssessments.vendorId, vendorIds));
      if (!aRows.length) return [];
      const assessIds = aRows.map((a) => a.id);
      const aMap = new Map(aRows.map((a) => [a.id, a.vendorId]));
      const vMap = new Map(vRows.map((v) => [v.id, v.vendorName]));
      const gRows = await db.select({
        id: assessmentGaps.id,
        assessmentId: assessmentGaps.assessmentId,
        controlId: assessmentGaps.controlId,
        gapDescription: assessmentGaps.gapDescription,
        severity: assessmentGaps.severity,
        remediation: assessmentGaps.remediation,
        createdAt: assessmentGaps.createdAt
      }).from(assessmentGaps).where(inArray4(assessmentGaps.assessmentId, assessIds));
      return gRows.map((r) => ({
        ...r,
        vendorId: aMap.get(r.assessmentId ?? 0) ?? null,
        vendorName: vMap.get(aMap.get(r.assessmentId ?? 0) ?? 0) ?? null,
        createdAt: toIso2(r.createdAt)
      }));
    }
    case "risks": {
      const rows = await db.select().from(riskRegister).where(eq24(riskRegister.organizationId, orgId));
      return rows.map((r) => ({
        ...r,
        score: (r.likelihood ?? 1) * (r.impact ?? 1),
        reviewDate: toIso2(r.reviewDate),
        createdAt: toIso2(r.createdAt),
        updatedAt: toIso2(r.updatedAt)
      }));
    }
    case "remediation": {
      const rows = await db.select().from(remediationTasks).where(eq24(remediationTasks.organizationId, orgId));
      return rows.map((r) => ({
        ...r,
        dueDate: toIso2(r.dueDate),
        createdAt: toIso2(r.createdAt),
        updatedAt: toIso2(r.updatedAt)
      }));
    }
    case "policies": {
      const rows = await db.select().from(compliancePolicies).where(eq24(compliancePolicies.organizationId, orgId));
      return rows.map((r) => ({
        ...r,
        lastApprovedAt: toIso2(r.lastApprovedAt),
        nextReviewAt: toIso2(r.nextReviewAt),
        createdAt: toIso2(r.createdAt),
        updatedAt: toIso2(r.updatedAt)
      }));
    }
    case "incidents": {
      const rows = await db.select().from(complianceIncidents).where(eq24(complianceIncidents.organizationId, orgId));
      return rows.map((r) => ({
        ...r,
        occurredAt: toIso2(r.occurredAt),
        detectedAt: toIso2(r.detectedAt),
        containedAt: toIso2(r.containedAt),
        resolvedAt: toIso2(r.resolvedAt),
        createdAt: toIso2(r.createdAt),
        updatedAt: toIso2(r.updatedAt)
      }));
    }
    case "audit_schedule": {
      const rows = await db.select().from(auditSchedules).where(eq24(auditSchedules.organizationId, orgId));
      return rows.map((r) => ({
        ...r,
        scheduledDate: toIso2(r.scheduledDate),
        completedDate: toIso2(r.completedDate),
        nextOccurrence: toIso2(r.nextOccurrence),
        createdAt: toIso2(r.createdAt),
        updatedAt: toIso2(r.updatedAt)
      }));
    }
    default:
      return [];
  }
}

// server/compliance-report-router.ts
var moduleEnum = z23.enum(["gaps", "risks", "remediation", "policies", "incidents", "audit_schedule"]);
var complianceReportRouter = router({
  summary: activeOrgProcedure.query(async ({ ctx }) => {
    await requireModulePermission(ctx, "compliance_reports", "canView");
    return getComplianceSummary(ctx.organizationId);
  }),
  moduleData: activeOrgProcedure.input(z23.object({ module: moduleEnum })).query(async ({ ctx, input }) => {
    await requireModulePermission(ctx, "compliance_reports", "canView");
    return getComplianceModuleData(ctx.organizationId, input.module);
  })
});

// server/ctem-router.ts
import { z as z24 } from "zod";
import { TRPCError as TRPCError18 } from "@trpc/server";

// server/ctem-scoring.ts
init_schema();
init_db();
import { and as and19, desc as desc11, eq as eq25, inArray as inArray5 } from "drizzle-orm";
var SEVERITY_WEIGHT = {
  critical: 100,
  high: 75,
  medium: 50,
  low: 25,
  informational: 5
};
function clamp(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}
function computeExposureScore(asset, vulns) {
  const facingBonus = asset.isInternetFacing ? 40 : 10;
  const critBonus = clamp(asset.criticalityScore / 10 * 20);
  const unpatched = vulns.filter((v) => !v.isPatched);
  const highestSev = unpatched.reduce(
    (max, v) => Math.max(max, SEVERITY_WEIGHT[v.severity] ?? 0),
    0
  );
  const vulnBonus = clamp(highestSev * 0.4);
  return clamp(facingBonus + critBonus + vulnBonus);
}
function computeExploitabilityScore(vulns, simulations) {
  const unpatched = vulns.filter((v) => !v.isPatched);
  const exploitableRatio = unpatched.length > 0 ? unpatched.filter((v) => v.exploitAvailable).length / unpatched.length : 0;
  const exploitBonus = clamp(exploitableRatio * 50);
  const avgSim = simulations.length > 0 ? simulations.reduce((s, r) => s + r.successProbability, 0) / simulations.length : 0;
  const simBonus = clamp(avgSim * 0.5);
  return clamp(exploitBonus + simBonus);
}
function computeBusinessImpactScore(asset) {
  const piBonus = asset.handlesPersonalData ? 30 : 0;
  const cdBonus = asset.handlesCriticalData ? 30 : 0;
  const critBonus = clamp(asset.criticalityScore / 10 * 40);
  return clamp(piBonus + cdBonus + critBonus);
}
function tierFromScore(score) {
  if (score >= 80) return "critical";
  if (score >= 60) return "high";
  if (score >= 40) return "medium";
  return "low";
}
function computeRiskScore(asset, vulns, simulations) {
  const exp = computeExposureScore(asset, vulns);
  const expl = computeExploitabilityScore(vulns, simulations);
  const biz = computeBusinessImpactScore(asset);
  const final = clamp(exp * 0.35 + expl * 0.4 + biz * 0.25);
  return {
    exposureScore: exp,
    exploitabilityScore: expl,
    businessImpactScore: biz,
    finalPriorityScore: final,
    priorityTier: tierFromScore(final)
  };
}
function deriveExposureMappings(input) {
  const results = [];
  const sev = input.severity === "critical" || input.severity === "high" ? "high" : "medium";
  const titleLower = input.title.toLowerCase();
  const isChinaRegion = input.assetRegion === "China" || input.assetRegion === "Cross-border";
  const isSaudiRegion = input.assetRegion === "Saudi Arabia" || input.assetRegion === "Cross-border";
  if (/access|auth|privilege|credential|password|account/i.test(titleLower)) {
    if (isSaudiRegion) {
      results.push({
        vulnerabilityId: input.vulnerabilityId,
        frameworkCode: "NCA",
        frameworkId: null,
        controlId: null,
        controlCode: "ECC-2-1-1",
        mappingReason: `Vulnerability "${input.title}" affects access control mechanisms \u2014 directly linked to NCA ECC Access Management controls.`,
        severityImpact: sev
      });
    }
    if (isChinaRegion) {
      results.push({
        vulnerabilityId: input.vulnerabilityId,
        frameworkCode: "CSL",
        frameworkId: null,
        controlId: null,
        controlCode: "CSL-Art.21",
        mappingReason: `Vulnerability "${input.title}" affects authentication/access controls \u2014 relevant to CSL Art.21 network security obligations.`,
        severityImpact: sev
      });
    }
  }
  if (input.assetHandlesPersonalData && /data|leak|exfil|exposure|sensitive|personal|PII|privacy/i.test(titleLower)) {
    if (isSaudiRegion) {
      results.push({
        vulnerabilityId: input.vulnerabilityId,
        frameworkCode: "PDPL",
        frameworkId: null,
        controlId: null,
        controlCode: "PDPL-Art.19",
        mappingReason: `Asset handles personal data and vulnerability "${input.title}" creates a data leakage risk \u2014 maps to PDPL Art.19 personal data security obligations.`,
        severityImpact: input.severity === "critical" ? "critical" : sev
      });
    }
    if (isChinaRegion) {
      results.push({
        vulnerabilityId: input.vulnerabilityId,
        frameworkCode: "PIPL",
        frameworkId: null,
        controlId: null,
        controlCode: "PIPL-Art.51",
        mappingReason: `Asset processes personal information and vulnerability "${input.title}" exposes data subjects \u2014 maps to PIPL Art.51 security measures requirements.`,
        severityImpact: input.severity === "critical" ? "critical" : sev
      });
    }
  }
  if (input.assetHandlesCriticalData && isChinaRegion) {
    results.push({
      vulnerabilityId: input.vulnerabilityId,
      frameworkCode: "DSL",
      frameworkId: null,
      controlId: null,
      controlCode: "DSL-Art.27",
      mappingReason: `Asset handles important/critical data under DSL and vulnerability "${input.title}" may lead to unauthorized data access \u2014 requires DSL Art.27 security management measures.`,
      severityImpact: input.severity === "critical" ? "critical" : "high"
    });
  }
  if (/encrypt|crypto|tls|ssl|cert|cipher|hash/i.test(titleLower)) {
    if (isChinaRegion) {
      results.push({
        vulnerabilityId: input.vulnerabilityId,
        frameworkCode: "PIPL",
        frameworkId: null,
        controlId: null,
        controlCode: "PIPL-Art.51",
        mappingReason: `Cryptographic weakness "${input.title}" undermines PIPL Art.51 requirement for encryption of personal information.`,
        severityImpact: sev
      });
    }
    if (isSaudiRegion) {
      results.push({
        vulnerabilityId: input.vulnerabilityId,
        frameworkCode: "NCA",
        frameworkId: null,
        controlId: null,
        controlCode: "ECC-2-3-1",
        mappingReason: `Cryptographic weakness "${input.title}" violates NCA ECC-2-3 cryptography controls.`,
        severityImpact: sev
      });
    }
  }
  if (input.assetRegion === "Cross-border") {
    results.push({
      vulnerabilityId: input.vulnerabilityId,
      frameworkCode: "CSL",
      frameworkId: null,
      controlId: null,
      controlCode: "CSL-Art.37",
      mappingReason: `Cross-border asset with vulnerability "${input.title}" \u2014 CSL Art.37 requires security assessment before any critical data cross-border transfer.`,
      severityImpact: sev
    });
  }
  return results;
}
async function executeContinuousComplianceRun(params) {
  const db = await getDb();
  if (!db) {
    return simulateInMemoryRun(params);
  }
  const { organizationId, vendorId, triggeredBy = "manual" } = params;
  let runId = params.runId;
  if (!runId) {
    const [insertedRun] = await db.insert(continuousComplianceRuns).values({
      organizationId,
      vendorId: vendorId ?? null,
      runStatus: "running",
      triggeredBy,
      startedAt: /* @__PURE__ */ new Date()
    }).returning({ id: continuousComplianceRuns.id });
    runId = insertedRun.id;
  } else {
    await db.update(continuousComplianceRuns).set({ runStatus: "running" }).where(eq25(continuousComplianceRuns.id, runId));
  }
  try {
    const assetQuery = db.select().from(ctemAssets).where(
      and19(
        eq25(ctemAssets.organizationId, organizationId),
        eq25(ctemAssets.status, "active"),
        ...vendorId ? [eq25(ctemAssets.vendorId, vendorId)] : []
      )
    );
    const assets = await assetQuery;
    if (assets.length === 0) {
      await db.update(continuousComplianceRuns).set({ runStatus: "completed", completedAt: /* @__PURE__ */ new Date(), summary: "No active assets found." }).where(eq25(continuousComplianceRuns.id, runId));
      return { runId, assetsScanned: 0, vulnsFound: 0, exploitableVulns: 0, avgPriorityScore: 0, scoreDelta: null, alertRaised: false, assetResults: [] };
    }
    const assetIds = assets.map((a) => a.id);
    const allVulns = await db.select().from(ctemVulnerabilities).where(inArray5(ctemVulnerabilities.assetId, assetIds));
    const allSims = await db.select().from(ctemAttackSimulations).where(inArray5(ctemAttackSimulations.assetId, assetIds));
    const prevScores = await db.select({ assetId: ctemRiskScores.assetId, finalPriorityScore: ctemRiskScores.finalPriorityScore }).from(ctemRiskScores).where(inArray5(ctemRiskScores.assetId, assetIds));
    const prevScoreMap = new Map(prevScores.map((s) => [s.assetId, s.finalPriorityScore]));
    let totalScore = 0;
    let totalVulns = 0;
    let exploitable = 0;
    let alertRaised = false;
    const assetResults = [];
    for (const asset of assets) {
      const vulns = allVulns.filter((v) => v.assetId === asset.id);
      const sims = allSims.filter((s) => s.assetId === asset.id);
      totalVulns += vulns.length;
      exploitable += vulns.filter((v) => v.exploitAvailable && !v.isPatched).length;
      const scored = computeRiskScore(asset, vulns, sims);
      const prev = prevScoreMap.get(asset.id) ?? null;
      const delta = prev !== null ? (scored.finalPriorityScore ?? 0) - prev : null;
      if (delta !== null && delta > 20 || vulns.some((v) => v.severity === "critical" && v.exploitAvailable && !v.isPatched)) {
        alertRaised = true;
      }
      const existing = prevScores.find((s) => s.assetId === asset.id);
      if (existing) {
        await db.update(ctemRiskScores).set({
          ...scored,
          previousFinalScore: prev,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq25(ctemRiskScores.assetId, asset.id));
      } else {
        await db.insert(ctemRiskScores).values({
          assetId: asset.id,
          ...scored,
          previousFinalScore: null
        });
      }
      const unpatchedVulns = vulns.filter((v) => !v.isPatched);
      for (const vuln of unpatchedVulns) {
        const maps = deriveExposureMappings({
          vulnerabilityId: vuln.id,
          severity: vuln.severity,
          title: vuln.title,
          cveId: vuln.cveId,
          assetHandlesPersonalData: Boolean(asset.handlesPersonalData),
          assetHandlesCriticalData: Boolean(asset.handlesCriticalData),
          assetRegion: asset.region
        });
        for (const m of maps) {
          const already = await db.select({ id: complianceExposureMappings.id }).from(complianceExposureMappings).where(
            and19(
              eq25(complianceExposureMappings.vulnerabilityId, vuln.id),
              ...m.frameworkCode ? [eq25(complianceExposureMappings.frameworkCode, m.frameworkCode)] : []
            )
          ).limit(1);
          if (already.length === 0) {
            await db.insert(complianceExposureMappings).values(m);
          }
        }
      }
      totalScore += scored.finalPriorityScore ?? 0;
      assetResults.push({
        assetId: asset.id,
        assetName: asset.assetName,
        finalScore: scored.finalPriorityScore ?? 0,
        tier: scored.priorityTier ?? "low",
        delta
      });
    }
    const avgScore = assets.length > 0 ? Math.round(totalScore / assets.length) : 0;
    const [prevRun] = await db.select({ avgPriorityScore: continuousComplianceRuns.avgPriorityScore }).from(continuousComplianceRuns).where(
      and19(
        eq25(continuousComplianceRuns.organizationId, organizationId),
        eq25(continuousComplianceRuns.runStatus, "completed")
      )
    ).orderBy(desc11(continuousComplianceRuns.startedAt)).limit(1);
    const runDelta = prevRun ? avgScore - prevRun.avgPriorityScore : null;
    await db.update(continuousComplianceRuns).set({
      runStatus: "completed",
      assetsScanned: assets.length,
      vulnsFound: totalVulns,
      exploitableVulns: exploitable,
      avgPriorityScore: avgScore,
      scoreDelta: runDelta,
      alertRaised: alertRaised ? 1 : 0,
      completedAt: /* @__PURE__ */ new Date(),
      summary: `Scanned ${assets.length} asset(s). Found ${totalVulns} vulnerability/ies, ${exploitable} exploitable. Average risk score: ${avgScore}/100.`
    }).where(eq25(continuousComplianceRuns.id, runId));
    if (alertRaised) {
      await db.insert(adminNotifications).values({
        category: "system",
        title: "\u{1F6A8} CTEM Alert: New Critical Exposure Detected",
        content: `A continuous compliance run detected a critical exploitable vulnerability or a risk score increase >20 points. Run ID: ${runId}. Avg score: ${avgScore}/100. Review the Continuous Compliance dashboard immediately.`,
        entityType: "continuousComplianceRuns",
        entityId: runId,
        isRead: 0
      });
    }
    return {
      runId,
      assetsScanned: assets.length,
      vulnsFound: totalVulns,
      exploitableVulns: exploitable,
      avgPriorityScore: avgScore,
      scoreDelta: runDelta,
      alertRaised,
      assetResults
    };
  } catch (err) {
    await db.update(continuousComplianceRuns).set({ runStatus: "failed", completedAt: /* @__PURE__ */ new Date(), summary: String(err) }).where(eq25(continuousComplianceRuns.id, runId));
    throw err;
  }
}
function simulateInMemoryRun(params) {
  const seed = params.organizationId % 10;
  const numAssets = 3 + seed;
  const assetResults = Array.from({ length: numAssets }, (_, i) => {
    const base = 30 + (seed * 7 + i * 11) % 55;
    return {
      assetId: -(i + 1),
      assetName: [`API Gateway`, `Customer DB`, `Auth Service`, `Data Pipeline`, `Cloud Storage`, `Admin Portal`, `CDN Edge`, `Analytics Engine`, `Partner API`, `Backup Service`][i % 10],
      finalScore: base,
      tier: tierFromScore(base),
      delta: i % 3 === 0 ? null : i % 2 === 0 ? 5 : -3
    };
  });
  const avgScore = Math.round(assetResults.reduce((s, r) => s + r.finalScore, 0) / numAssets);
  return {
    runId: -params.organizationId,
    assetsScanned: numAssets,
    vulnsFound: numAssets * 2 + seed,
    exploitableVulns: Math.ceil(numAssets * 0.4),
    avgPriorityScore: avgScore,
    scoreDelta: seed % 4 === 0 ? null : seed > 5 ? 8 : -5,
    alertRaised: avgScore >= 70,
    assetResults
  };
}

// server/ctem-store.ts
init_schema();
init_db();
import { and as and20, desc as desc12, eq as eq26, inArray as inArray6 } from "drizzle-orm";
function inMemoryDemoData(orgId) {
  const seed = Math.abs(orgId) % 8;
  const demoAssets = [
    { id: 1, assetName: "Customer API Gateway", assetType: "api_endpoint", region: "China", isInternetFacing: 1, criticalityScore: 9, handlesPersonalData: 1, handlesCriticalData: 1 },
    { id: 2, assetName: "PDPL Consent Database", assetType: "database", region: "Saudi Arabia", isInternetFacing: 0, criticalityScore: 8, handlesPersonalData: 1, handlesCriticalData: 0 },
    { id: 3, assetName: "Admin Portal", assetType: "web_application", region: "Cross-border", isInternetFacing: 1, criticalityScore: 7, handlesPersonalData: 0, handlesCriticalData: 1 },
    { id: 4, assetName: "Cloud Storage - CN", assetType: "storage_bucket", region: "China", isInternetFacing: 0, criticalityScore: 8, handlesPersonalData: 1, handlesCriticalData: 1 },
    { id: 5, assetName: "Auth / IdP Service", assetType: "identity_provider", region: "Cross-border", isInternetFacing: 1, criticalityScore: 10, handlesPersonalData: 1, handlesCriticalData: 0 }
  ].slice(0, 3 + seed % 3);
  const demoVulns = [
    { id: 1, assetId: 1, cveId: "CVE-2024-21762", title: "Authentication Bypass via JWT None Algorithm", severity: "critical", cvssScore: 92, exploitAvailable: 1, isPatched: 0, discoveredAt: /* @__PURE__ */ new Date("2025-11-01") },
    { id: 2, assetId: 1, cveId: "CVE-2024-38856", title: "SQL Injection in Search Parameter", severity: "high", cvssScore: 78, exploitAvailable: 1, isPatched: 0, discoveredAt: /* @__PURE__ */ new Date("2025-11-15") },
    { id: 3, assetId: 2, cveId: null, title: "Unencrypted PII at Rest", severity: "high", cvssScore: 70, exploitAvailable: 0, isPatched: 0, discoveredAt: /* @__PURE__ */ new Date("2025-12-01") },
    { id: 4, assetId: 3, cveId: "CVE-2025-0282", title: "TLS 1.0/1.1 Cipher Suite Weakness", severity: "medium", cvssScore: 55, exploitAvailable: 0, isPatched: 1, discoveredAt: /* @__PURE__ */ new Date("2026-01-10") },
    { id: 5, assetId: 4, cveId: "CVE-2024-34102", title: "Privilege Escalation in Storage SDK", severity: "critical", cvssScore: 95, exploitAvailable: 1, isPatched: 0, discoveredAt: /* @__PURE__ */ new Date("2026-02-01") },
    { id: 6, assetId: 5, cveId: "CVE-2025-1234", title: "Credential Exposure via Debug Endpoint", severity: "high", cvssScore: 80, exploitAvailable: 1, isPatched: 0, discoveredAt: /* @__PURE__ */ new Date("2026-03-05") }
  ];
  const demoScores = demoAssets.map((a) => {
    const vulns = demoVulns.filter((v) => v.assetId === a.id);
    const exploitable = vulns.filter((v) => v.exploitAvailable && !v.isPatched);
    const highestCvss = vulns.reduce((m, v) => Math.max(m, v.cvssScore), 0);
    const expScore = Math.min(100, (a.isInternetFacing ? 40 : 10) + Math.round(a.criticalityScore / 10 * 20) + Math.round(highestCvss * 0.4));
    const explScore = Math.min(100, Math.round(exploitable.length / Math.max(vulns.length, 1) * 50) + (exploitable.length > 0 ? 30 : 0));
    const bizScore = Math.min(100, (a.handlesPersonalData ? 30 : 0) + (a.handlesCriticalData ? 30 : 0) + Math.round(a.criticalityScore / 10 * 40));
    const final = Math.round(expScore * 0.35 + explScore * 0.4 + bizScore * 0.25);
    const tier = final >= 80 ? "critical" : final >= 60 ? "high" : final >= 40 ? "medium" : "low";
    return { assetId: a.id, exposureScore: expScore, exploitabilityScore: explScore, businessImpactScore: bizScore, finalPriorityScore: final, priorityTier: tier, previousFinalScore: final - Math.ceil(Math.random() * 8) };
  });
  return { assets: demoAssets, vulns: demoVulns, scores: demoScores };
}
async function listCtemAssets(orgId, filters) {
  const db = await getDb();
  if (!db) return inMemoryDemoData(orgId).assets;
  const where = [eq26(ctemAssets.organizationId, orgId)];
  if (filters?.region) where.push(eq26(ctemAssets.region, filters.region));
  if (filters?.vendorId) where.push(eq26(ctemAssets.vendorId, filters.vendorId));
  if (filters?.status) where.push(eq26(ctemAssets.status, filters.status));
  return db.select().from(ctemAssets).where(and20(...where)).orderBy(desc12(ctemAssets.createdAt));
}
async function createCtemAsset(orgId, input) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [inserted] = await db.insert(ctemAssets).values({
    organizationId: orgId,
    vendorId: input.vendorId ?? void 0,
    assetName: input.assetName,
    assetType: input.assetType,
    ipDomain: input.ipDomain ?? void 0,
    region: input.region,
    isInternetFacing: input.isInternetFacing ? 1 : 0,
    handlesPersonalData: input.handlesPersonalData ? 1 : 0,
    handlesCriticalData: input.handlesCriticalData ? 1 : 0,
    criticalityScore: input.criticalityScore,
    status: input.status,
    notes: input.notes ?? void 0
  }).returning({ id: ctemAssets.id });
  const id = inserted.id;
  const [row] = await db.select().from(ctemAssets).where(eq26(ctemAssets.id, id));
  return row;
}
async function updateCtemAsset(id, patch) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(ctemAssets).set({
    ...patch.assetName !== void 0 && { assetName: patch.assetName },
    ...patch.assetType !== void 0 && { assetType: patch.assetType },
    ...patch.ipDomain !== void 0 && { ipDomain: patch.ipDomain },
    ...patch.region !== void 0 && { region: patch.region },
    ...patch.isInternetFacing !== void 0 && { isInternetFacing: patch.isInternetFacing ? 1 : 0 },
    ...patch.handlesPersonalData !== void 0 && { handlesPersonalData: patch.handlesPersonalData ? 1 : 0 },
    ...patch.handlesCriticalData !== void 0 && { handlesCriticalData: patch.handlesCriticalData ? 1 : 0 },
    ...patch.criticalityScore !== void 0 && { criticalityScore: patch.criticalityScore },
    ...patch.status !== void 0 && { status: patch.status },
    ...patch.notes !== void 0 && { notes: patch.notes }
  }).where(eq26(ctemAssets.id, id));
  const [row] = await db.select().from(ctemAssets).where(eq26(ctemAssets.id, id));
  return row;
}
async function deleteCtemAsset(id) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.delete(ctemAssets).where(eq26(ctemAssets.id, id));
}
async function listCtemVulnerabilities(orgId, filters) {
  const db = await getDb();
  if (!db) {
    const { vulns } = inMemoryDemoData(orgId);
    let result = vulns;
    if (filters?.exploitableOnly) result = result.filter((v) => v.exploitAvailable);
    if (filters?.severity) result = result.filter((v) => v.severity === filters.severity);
    return result;
  }
  const orgAssets = await db.select({ id: ctemAssets.id }).from(ctemAssets).where(eq26(ctemAssets.organizationId, orgId));
  const orgAssetIds = orgAssets.map((a) => a.id);
  if (orgAssetIds.length === 0) return [];
  const vulnFilters = [];
  if (filters?.assetId) {
    vulnFilters.push(eq26(ctemVulnerabilities.assetId, filters.assetId));
  } else {
    vulnFilters.push(inArray6(ctemVulnerabilities.assetId, orgAssetIds));
  }
  if (filters?.severity) vulnFilters.push(eq26(ctemVulnerabilities.severity, filters.severity));
  if (filters?.exploitableOnly) vulnFilters.push(eq26(ctemVulnerabilities.exploitAvailable, 1));
  const rows = await db.select().from(ctemVulnerabilities).where(and20(...vulnFilters)).orderBy(desc12(ctemVulnerabilities.cvssScore));
  if (!filters?.includeMappings) return rows;
  const vulnIds = rows.map((r) => r.id);
  const mappings = vulnIds.length > 0 ? await db.select().from(complianceExposureMappings).where(inArray6(complianceExposureMappings.vulnerabilityId, vulnIds)) : [];
  return rows.map((row) => ({
    ...row,
    complianceMappings: mappings.filter((m) => m.vulnerabilityId === row.id)
  }));
}
async function getCtemVulnAssetOwner(vulnId) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select({ assetId: ctemVulnerabilities.assetId }).from(ctemVulnerabilities).where(eq26(ctemVulnerabilities.id, vulnId));
  return row ?? null;
}
async function createCtemVulnerability(input) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [inserted] = await db.insert(ctemVulnerabilities).values({
    assetId: input.assetId,
    cveId: input.cveId ?? null,
    title: input.title,
    description: input.description ?? null,
    severity: input.severity,
    cvssScore: input.cvssScore,
    exploitAvailable: input.exploitAvailable ? 1 : 0,
    isConfirmed: input.isConfirmed ? 1 : 0,
    notes: input.notes ?? null,
    discoveredAt: /* @__PURE__ */ new Date()
  }).returning({ id: ctemVulnerabilities.id });
  const id = inserted.id;
  const [row] = await db.select().from(ctemVulnerabilities).where(eq26(ctemVulnerabilities.id, id));
  return row;
}
async function patchCtemVulnerability(id, patch) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const update = {};
  if (patch.isPatched !== void 0) {
    update.isPatched = patch.isPatched ? 1 : 0;
    if (patch.isPatched) update.patchedAt = /* @__PURE__ */ new Date();
  }
  if (patch.isConfirmed !== void 0) update.isConfirmed = patch.isConfirmed ? 1 : 0;
  if (patch.exploitAvailable !== void 0) update.exploitAvailable = patch.exploitAvailable ? 1 : 0;
  if (patch.severity !== void 0) update.severity = patch.severity;
  if (patch.notes !== void 0) update.notes = patch.notes;
  if (Object.keys(update).length > 0)
    await db.update(ctemVulnerabilities).set(update).where(eq26(ctemVulnerabilities.id, id));
  const [row] = await db.select().from(ctemVulnerabilities).where(eq26(ctemVulnerabilities.id, id));
  return row;
}
async function listCtemRiskScores(orgId, filters) {
  const db = await getDb();
  if (!db) {
    const { assets, scores: scores2 } = inMemoryDemoData(orgId);
    return scores2.map((s) => {
      const a = assets.find((x) => x.id === s.assetId);
      return { ...s, asset: a ?? null };
    });
  }
  const assetFilters = [eq26(ctemAssets.organizationId, orgId)];
  if (filters?.region) assetFilters.push(eq26(ctemAssets.region, filters.region));
  if (filters?.vendorId) assetFilters.push(eq26(ctemAssets.vendorId, filters.vendorId));
  const orgAssets = await db.select().from(ctemAssets).where(and20(...assetFilters));
  if (orgAssets.length === 0) return [];
  const assetIds = orgAssets.map((a) => a.id);
  const scoreFilters = [inArray6(ctemRiskScores.assetId, assetIds)];
  if (filters?.tier) scoreFilters.push(eq26(ctemRiskScores.priorityTier, filters.tier));
  const scores = await db.select().from(ctemRiskScores).where(and20(...scoreFilters)).orderBy(desc12(ctemRiskScores.finalPriorityScore));
  return scores.map((s) => ({
    ...s,
    asset: orgAssets.find((a) => a.id === s.assetId) ?? null
  }));
}
async function getCtemRiskSummary(orgId) {
  const db = await getDb();
  if (!db) {
    const { assets, vulns, scores: scores2 } = inMemoryDemoData(orgId);
    const byTier = (t2) => scores2.filter((s) => s.priorityTier === t2).length;
    const lastRun2 = { runStatus: "completed", startedAt: new Date(Date.now() - 36e5), avgPriorityScore: scores2.reduce((s, r) => s + r.finalPriorityScore, 0) / Math.max(scores2.length, 1), alertRaised: 0 };
    return {
      totalAssets: assets.length,
      totalVulns: vulns.length,
      exploitableVulns: vulns.filter((v) => v.exploitAvailable && !v.isPatched).length,
      criticalAssets: byTier("critical"),
      highAssets: byTier("high"),
      mediumAssets: byTier("medium"),
      lowAssets: byTier("low"),
      avgPriorityScore: Math.round(scores2.reduce((s, r) => s + r.finalPriorityScore, 0) / Math.max(scores2.length, 1)),
      lastRun: lastRun2,
      frameworkExposure: [
        { frameworkCode: "PIPL", impactedVulns: 2, maxSeverity: "critical" },
        { frameworkCode: "PDPL", impactedVulns: 2, maxSeverity: "high" },
        { frameworkCode: "CSL", impactedVulns: 1, maxSeverity: "high" },
        { frameworkCode: "NCA", impactedVulns: 1, maxSeverity: "medium" },
        { frameworkCode: "DSL", impactedVulns: 1, maxSeverity: "high" }
      ]
    };
  }
  const orgAssets = await db.select().from(ctemAssets).where(eq26(ctemAssets.organizationId, orgId));
  const assetIds = orgAssets.map((a) => a.id);
  const vulnCounts = assetIds.length > 0 ? await db.select().from(ctemVulnerabilities).where(inArray6(ctemVulnerabilities.assetId, assetIds)) : [];
  const scores = assetIds.length > 0 ? await db.select().from(ctemRiskScores).where(inArray6(ctemRiskScores.assetId, assetIds)) : [];
  const [lastRun] = await db.select().from(continuousComplianceRuns).where(eq26(continuousComplianceRuns.organizationId, orgId)).orderBy(desc12(continuousComplianceRuns.startedAt)).limit(1);
  const vulnIds = vulnCounts.map((v) => v.id);
  const mappings = vulnIds.length > 0 ? await db.select().from(complianceExposureMappings).where(inArray6(complianceExposureMappings.vulnerabilityId, vulnIds)) : [];
  const fwMap = /* @__PURE__ */ new Map();
  const sevOrder = ["critical", "high", "medium", "low"];
  for (const m of mappings) {
    if (!m.frameworkCode) continue;
    const cur = fwMap.get(m.frameworkCode) ?? { count: 0, maxSev: "low" };
    const newWorst = sevOrder.indexOf(m.severityImpact) < sevOrder.indexOf(cur.maxSev) ? m.severityImpact : cur.maxSev;
    fwMap.set(m.frameworkCode, { count: cur.count + 1, maxSev: newWorst });
  }
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((s, r) => s + r.finalPriorityScore, 0) / scores.length) : 0;
  return {
    totalAssets: orgAssets.length,
    totalVulns: vulnCounts.length,
    exploitableVulns: vulnCounts.filter((v) => v.exploitAvailable && !v.isPatched).length,
    criticalAssets: scores.filter((s) => s.priorityTier === "critical").length,
    highAssets: scores.filter((s) => s.priorityTier === "high").length,
    mediumAssets: scores.filter((s) => s.priorityTier === "medium").length,
    lowAssets: scores.filter((s) => s.priorityTier === "low").length,
    avgPriorityScore: avgScore,
    lastRun: lastRun ?? null,
    frameworkExposure: Array.from(fwMap.entries()).map(([frameworkCode, v]) => ({
      frameworkCode,
      impactedVulns: v.count,
      maxSeverity: v.maxSev
    }))
  };
}
async function listCtemRuns(orgId, limit = 20) {
  const db = await getDb();
  if (!db) {
    return [
      { id: 1, runStatus: "completed", triggeredBy: "manual", startedAt: new Date(Date.now() - 72e5), completedAt: new Date(Date.now() - 719e4), assetsScanned: 5, vulnsFound: 6, exploitableVulns: 3, avgPriorityScore: 67, scoreDelta: 8, alertRaised: 1 },
      { id: 2, runStatus: "completed", triggeredBy: "scheduled", startedAt: new Date(Date.now() - 864e5), completedAt: new Date(Date.now() - 8639e4), assetsScanned: 5, vulnsFound: 6, exploitableVulns: 2, avgPriorityScore: 59, scoreDelta: -4, alertRaised: 0 }
    ];
  }
  return db.select().from(continuousComplianceRuns).where(eq26(continuousComplianceRuns.organizationId, orgId)).orderBy(desc12(continuousComplianceRuns.startedAt)).limit(limit);
}
async function getCtemFrameworkExposure(orgId) {
  const db = await getDb();
  if (!db) {
    return [
      { frameworkCode: "PIPL", total: 3, critical: 1, high: 1, medium: 1, low: 0 },
      { frameworkCode: "PDPL", total: 2, critical: 0, high: 1, medium: 1, low: 0 },
      { frameworkCode: "CSL", total: 2, critical: 0, high: 1, medium: 1, low: 0 },
      { frameworkCode: "NCA", total: 1, critical: 0, high: 0, medium: 1, low: 0 },
      { frameworkCode: "DSL", total: 1, critical: 0, high: 1, medium: 0, low: 0 }
    ];
  }
  const orgAssets = await db.select({ id: ctemAssets.id }).from(ctemAssets).where(eq26(ctemAssets.organizationId, orgId));
  if (orgAssets.length === 0) return [];
  const assetIds = orgAssets.map((a) => a.id);
  const vulnIds = assetIds.length > 0 ? (await db.select({ id: ctemVulnerabilities.id }).from(ctemVulnerabilities).where(inArray6(ctemVulnerabilities.assetId, assetIds))).map((v) => v.id) : [];
  if (vulnIds.length === 0) return [];
  const mappings = await db.select().from(complianceExposureMappings).where(inArray6(complianceExposureMappings.vulnerabilityId, vulnIds));
  const fwMap = /* @__PURE__ */ new Map();
  for (const m of mappings) {
    if (!m.frameworkCode) continue;
    if (!fwMap.has(m.frameworkCode)) fwMap.set(m.frameworkCode, { total: 0, critical: 0, high: 0, medium: 0, low: 0 });
    const fw = fwMap.get(m.frameworkCode);
    fw.total++;
    fw[m.severityImpact] = (fw[m.severityImpact] ?? 0) + 1;
  }
  return Array.from(fwMap.entries()).map(([frameworkCode, counts]) => ({ frameworkCode, ...counts }));
}
async function listVendorsForCtemAssets(orgId) {
  const db = await getDb();
  if (!db) return [{ id: 1, vendorName: "Demo Vendor" }];
  return db.select({ id: vendors.id, vendorName: vendors.vendorName }).from(vendors).where(eq26(vendors.organizationId, orgId));
}
async function getCtemAssetOrgId(assetId) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select({ orgId: ctemAssets.organizationId }).from(ctemAssets).where(eq26(ctemAssets.id, assetId));
  return row?.orgId ?? null;
}

// server/ctem-router.ts
var assetTypeEnum = z24.enum([
  "web_application",
  "api_endpoint",
  "database",
  "cloud_service",
  "network_device",
  "iot_device",
  "data_pipeline",
  "identity_provider",
  "storage_bucket",
  "other"
]);
var regionEnum2 = z24.enum(["China", "Saudi Arabia", "Cross-border", "Other"]);
var severityEnum4 = z24.enum(["critical", "high", "medium", "low", "informational"]);
var assetInputSchema = z24.object({
  vendorId: z24.number().int().positive().optional().nullable(),
  assetName: z24.string().trim().min(1).max(255),
  assetType: assetTypeEnum.default("other"),
  ipDomain: z24.string().trim().max(255).optional().nullable(),
  region: regionEnum2.default("Other"),
  isInternetFacing: z24.boolean().default(false),
  handlesPersonalData: z24.boolean().default(false),
  handlesCriticalData: z24.boolean().default(false),
  criticalityScore: z24.number().int().min(1).max(10).default(5),
  status: z24.enum(["active", "inactive", "decommissioned"]).default("active"),
  notes: z24.string().trim().max(2e3).optional().nullable()
});
var vulnInputSchema = z24.object({
  assetId: z24.number().int().positive(),
  cveId: z24.string().trim().max(64).optional().nullable(),
  title: z24.string().trim().min(1).max(255),
  description: z24.string().trim().max(3e3).optional().nullable(),
  severity: severityEnum4.default("medium"),
  cvssScore: z24.number().int().min(0).max(100).default(0),
  exploitAvailable: z24.boolean().default(false),
  isConfirmed: z24.boolean().default(false),
  notes: z24.string().trim().max(2e3).optional().nullable()
});
var ctemRouter = router({
  listAssets: activeOrgProcedure.input(z24.object({
    region: regionEnum2.optional(),
    vendorId: z24.number().int().positive().optional(),
    status: z24.enum(["active", "inactive", "decommissioned"]).optional()
  }).optional()).query(async ({ ctx, input }) => {
    await requireModulePermission(ctx, "compliance_tracker", "canView");
    return listCtemAssets(ctx.organizationId ?? -1, input);
  }),
  createAsset: activeOrgProcedure.input(assetInputSchema).mutation(async ({ ctx, input }) => {
    await requireModulePermission(ctx, "compliance_tracker", "canCreate");
    try {
      return await createCtemAsset(ctx.organizationId ?? -1, input);
    } catch {
      throw new TRPCError18({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    }
  }),
  updateAsset: activeOrgProcedure.input(assetInputSchema.partial().extend({ id: z24.number().int().positive() })).mutation(async ({ ctx, input }) => {
    await requireModulePermission(ctx, "compliance_tracker", "canEdit");
    const orgId = ctx.organizationId ?? -1;
    const { id, ...patch } = input;
    const ownerOrgId = await getCtemAssetOrgId(id);
    if (ownerOrgId === null || ownerOrgId !== orgId)
      throw new TRPCError18({ code: "NOT_FOUND", message: "Asset not found" });
    try {
      return await updateCtemAsset(id, patch);
    } catch {
      throw new TRPCError18({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    }
  }),
  deleteAsset: activeOrgProcedure.input(z24.object({ id: z24.number().int().positive() })).mutation(async ({ ctx, input }) => {
    await requireModulePermission(ctx, "compliance_tracker", "canDelete");
    const orgId = ctx.organizationId ?? -1;
    const ownerOrgId = await getCtemAssetOrgId(input.id);
    if (ownerOrgId === null || ownerOrgId !== orgId)
      throw new TRPCError18({ code: "NOT_FOUND", message: "Asset not found" });
    await deleteCtemAsset(input.id);
    return { ok: true };
  }),
  listVulnerabilities: activeOrgProcedure.input(z24.object({
    assetId: z24.number().int().positive().optional(),
    exploitableOnly: z24.boolean().optional(),
    severity: severityEnum4.optional(),
    includeMappings: z24.boolean().optional()
  }).optional()).query(async ({ ctx, input }) => {
    await requireModulePermission(ctx, "compliance_tracker", "canView");
    const orgId = ctx.organizationId ?? -1;
    if (input?.assetId) {
      const ownerOrgId = await getCtemAssetOrgId(input.assetId);
      if (ownerOrgId === null || ownerOrgId !== orgId)
        throw new TRPCError18({ code: "NOT_FOUND", message: "Asset not found" });
    }
    return listCtemVulnerabilities(orgId, input);
  }),
  createVulnerability: activeOrgProcedure.input(vulnInputSchema).mutation(async ({ ctx, input }) => {
    await requireModulePermission(ctx, "compliance_tracker", "canCreate");
    const orgId = ctx.organizationId ?? -1;
    const assetOrgId = await getCtemAssetOrgId(input.assetId);
    if (assetOrgId === null || assetOrgId !== orgId)
      throw new TRPCError18({ code: "NOT_FOUND", message: "Asset not found" });
    try {
      return await createCtemVulnerability(input);
    } catch {
      throw new TRPCError18({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    }
  }),
  patchVulnerability: activeOrgProcedure.input(z24.object({
    id: z24.number().int().positive(),
    isPatched: z24.boolean().optional(),
    isConfirmed: z24.boolean().optional(),
    exploitAvailable: z24.boolean().optional(),
    severity: severityEnum4.optional(),
    notes: z24.string().trim().max(2e3).optional().nullable()
  })).mutation(async ({ ctx, input }) => {
    await requireModulePermission(ctx, "compliance_tracker", "canEdit");
    const orgId = ctx.organizationId ?? -1;
    const { id, ...patch } = input;
    const vuln = await getCtemVulnAssetOwner(id);
    if (!vuln) throw new TRPCError18({ code: "NOT_FOUND", message: "Vulnerability not found" });
    const assetOrgId = await getCtemAssetOrgId(vuln.assetId);
    if (assetOrgId === null || assetOrgId !== orgId)
      throw new TRPCError18({ code: "FORBIDDEN", message: "Access denied" });
    try {
      return await patchCtemVulnerability(id, patch);
    } catch {
      throw new TRPCError18({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    }
  }),
  listRiskScores: activeOrgProcedure.input(z24.object({
    tier: z24.enum(["critical", "high", "medium", "low"]).optional(),
    region: regionEnum2.optional(),
    vendorId: z24.number().int().positive().optional()
  }).optional()).query(async ({ ctx, input }) => {
    await requireModulePermission(ctx, "compliance_tracker", "canView");
    return listCtemRiskScores(ctx.organizationId ?? -1, input);
  }),
  getRiskSummary: activeOrgProcedure.query(async ({ ctx }) => {
    await requireModulePermission(ctx, "compliance_tracker", "canView");
    return getCtemRiskSummary(ctx.organizationId ?? -1);
  }),
  listRuns: activeOrgProcedure.input(z24.object({ limit: z24.number().int().min(1).max(100).default(20) }).optional()).query(async ({ ctx, input }) => {
    await requireModulePermission(ctx, "compliance_tracker", "canView");
    return listCtemRuns(ctx.organizationId ?? -1, input?.limit);
  }),
  triggerRun: activeOrgProcedure.input(z24.object({ vendorId: z24.number().int().positive().optional() }).optional()).mutation(async ({ ctx, input }) => {
    await requireModulePermission(ctx, "compliance_tracker", "canEdit");
    return executeContinuousComplianceRun({
      organizationId: ctx.organizationId ?? -1,
      vendorId: input?.vendorId,
      triggeredBy: "manual"
    });
  }),
  getFrameworkExposure: activeOrgProcedure.query(async ({ ctx }) => {
    await requireModulePermission(ctx, "compliance_tracker", "canView");
    return getCtemFrameworkExposure(ctx.organizationId ?? -1);
  }),
  listVendorsForAssets: activeOrgProcedure.query(async ({ ctx }) => {
    await requireModulePermission(ctx, "compliance_tracker", "canView");
    return listVendorsForCtemAssets(ctx.organizationId ?? -1);
  })
});

// server/evidence-router.ts
import { z as z25 } from "zod";
import { TRPCError as TRPCError19 } from "@trpc/server";

// server/evidence-store.ts
init_schema();
init_db();
import { and as and21, desc as desc13, eq as eq27 } from "drizzle-orm";
var SOURCE_TYPES = [
  "audit_schedule",
  "policy",
  "risk",
  "gap",
  "remediation",
  "ctem_asset",
  "incident",
  "general"
];
var MEM_EVIDENCE = [
  {
    id: 1,
    organizationId: 1,
    sourceType: "policy",
    sourceId: null,
    title: "PIPL Compliance Policy v2 \u2014 Internal Approval Record",
    url: "https://example.com/documents/pipl-compliance-policy-v2-approval.pdf",
    description: "Board approval record for the PIPL data processing policy update.",
    addedByUserId: null,
    tags: "pipl,china,policy",
    createdAt: /* @__PURE__ */ new Date("2025-01-15T09:00:00Z"),
    updatedAt: /* @__PURE__ */ new Date("2025-01-15T09:00:00Z")
  },
  {
    id: 2,
    organizationId: 1,
    sourceType: "audit_schedule",
    sourceId: null,
    title: "Q1 Internal Audit \u2014 SOC 2 Readiness Report",
    url: "https://example.com/audits/q1-2025-soc2-readiness.pdf",
    description: "External auditor readiness report for Q1 SOC 2 review.",
    addedByUserId: null,
    tags: "soc2,audit",
    createdAt: /* @__PURE__ */ new Date("2025-02-20T14:00:00Z"),
    updatedAt: /* @__PURE__ */ new Date("2025-02-20T14:00:00Z")
  },
  {
    id: 3,
    organizationId: 1,
    sourceType: "risk",
    sourceId: null,
    title: "Cross-Border Data Transfer Risk \u2014 PDPL Impact Assessment",
    url: "https://example.com/risk/cross-border-pdpl-impact-assessment.pdf",
    description: "Formal impact assessment for Saudi Arabia data transfer risks under PDPL.",
    addedByUserId: null,
    tags: "pdpl,saudi,risk",
    createdAt: /* @__PURE__ */ new Date("2025-03-10T11:30:00Z"),
    updatedAt: /* @__PURE__ */ new Date("2025-03-10T11:30:00Z")
  },
  {
    id: 4,
    organizationId: 1,
    sourceType: "general",
    sourceId: null,
    title: "ISO/IEC 27701:2019 Standard Reference Copy",
    url: "https://www.iso.org/standard/71670.html",
    description: "Reference link to the privacy information management certification standard.",
    addedByUserId: null,
    tags: "iso27701,reference",
    createdAt: /* @__PURE__ */ new Date("2025-04-01T08:00:00Z"),
    updatedAt: /* @__PURE__ */ new Date("2025-04-01T08:00:00Z")
  }
];
var memSeq6 = 5;
async function listEvidence(orgId, sourceType, sourceId) {
  const db = await getDb();
  if (!db || orgId < 0) {
    let items = MEM_EVIDENCE.filter((e) => e.organizationId === orgId);
    if (sourceType) items = items.filter((e) => e.sourceType === sourceType);
    if (sourceId) items = items.filter((e) => e.sourceId === sourceId);
    return items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  const conditions = [eq27(complianceEvidence.organizationId, orgId)];
  if (sourceType) conditions.push(eq27(complianceEvidence.sourceType, sourceType));
  if (sourceId) conditions.push(eq27(complianceEvidence.sourceId, sourceId));
  return db.select().from(complianceEvidence).where(and21(...conditions)).orderBy(desc13(complianceEvidence.createdAt));
}
async function addEvidence(orgId, input, addedByUserId) {
  const db = await getDb();
  const now = /* @__PURE__ */ new Date();
  if (!db || orgId < 0) {
    const item = {
      id: memSeq6++,
      organizationId: orgId,
      sourceType: input.sourceType,
      sourceId: input.sourceId ?? null,
      title: input.title,
      url: input.url,
      description: input.description ?? null,
      addedByUserId,
      tags: input.tags ?? null,
      createdAt: now,
      updatedAt: now
    };
    MEM_EVIDENCE.push(item);
    return { success: true, id: item.id };
  }
  const [inserted] = await db.insert(complianceEvidence).values({
    organizationId: orgId,
    sourceType: input.sourceType,
    sourceId: input.sourceId ?? null,
    title: input.title,
    url: input.url,
    description: input.description ?? null,
    addedByUserId,
    tags: input.tags ?? null,
    createdAt: now,
    updatedAt: now
  }).returning({ id: complianceEvidence.id });
  const insertId = inserted.id;
  return { success: true, id: insertId };
}
async function getEvidenceForRemoval(orgId, evidenceId) {
  const db = await getDb();
  if (!db || orgId < 0) {
    const item = MEM_EVIDENCE.find((e) => e.id === evidenceId && e.organizationId === orgId);
    return item ? { id: item.id, organizationId: item.organizationId } : null;
  }
  const [row] = await db.select({ id: complianceEvidence.id, organizationId: complianceEvidence.organizationId }).from(complianceEvidence).where(eq27(complianceEvidence.id, evidenceId));
  return row ?? null;
}
async function removeEvidence(orgId, evidenceId) {
  const db = await getDb();
  if (!db || orgId < 0) {
    const idx = MEM_EVIDENCE.findIndex((e) => e.id === evidenceId && e.organizationId === orgId);
    if (idx !== -1) MEM_EVIDENCE.splice(idx, 1);
    return;
  }
  await db.delete(complianceEvidence).where(and21(eq27(complianceEvidence.id, evidenceId), eq27(complianceEvidence.organizationId, orgId)));
}

// server/evidence-router.ts
var SOURCE_TYPE_LABELS = {
  audit_schedule: "Audit Schedule",
  policy: "Policy",
  risk: "Risk Register",
  gap: "Assessment Gap",
  remediation: "Remediation Task",
  ctem_asset: "CTEM Asset",
  incident: "Compliance Incident",
  general: "General"
};
var evidenceRouter = router({
  list: activeOrgProcedure.input(z25.object({
    sourceType: z25.string().optional(),
    sourceId: z25.number().int().positive().optional()
  }).optional()).query(async ({ ctx, input }) => {
    await requireModulePermission(ctx, "evidence_repository", "canView");
    return listEvidence(
      ctx.organizationId,
      input?.sourceType,
      input?.sourceId
    );
  }),
  add: activeOrgProcedure.input(z25.object({
    title: z25.string().trim().min(1).max(255),
    url: z25.string().url().max(2e3),
    sourceType: z25.enum(SOURCE_TYPES),
    sourceId: z25.number().int().positive().optional(),
    description: z25.string().trim().max(2e3).optional(),
    tags: z25.string().trim().max(500).optional()
  })).mutation(async ({ ctx, input }) => {
    await requireModulePermission(ctx, "evidence_repository", "canCreate");
    const orgId = ctx.organizationId;
    const localUserId = ctx.user?.localUserId ?? null;
    const result = await addEvidence(orgId, input, localUserId);
    void recordAuditEvent(ctx, {
      category: "data_write",
      action: "evidence.add",
      entityType: "complianceEvidence",
      entityId: result.id,
      targetEntity: input.title,
      outcome: "success",
      payload: { sourceType: input.sourceType, sourceId: input.sourceId }
    });
    return result;
  }),
  remove: activeOrgProcedure.input(z25.number().int().positive()).mutation(async ({ ctx, input: evidenceId }) => {
    await requireModulePermission(ctx, "evidence_repository", "canDelete");
    const orgId = ctx.organizationId;
    const ev = await getEvidenceForRemoval(orgId, evidenceId);
    if (!ev) throw new TRPCError19({ code: "NOT_FOUND" });
    await removeEvidence(orgId, evidenceId);
    void recordAuditEvent(ctx, {
      category: "data_write",
      action: "evidence.remove",
      entityType: "complianceEvidence",
      entityId: evidenceId,
      outcome: "success"
    });
    return { success: true };
  }),
  listSourceTypes: activeOrgProcedure.query(async ({ ctx }) => {
    await requireModulePermission(ctx, "evidence_repository", "canView");
    return SOURCE_TYPES.map((t2) => ({ value: t2, label: SOURCE_TYPE_LABELS[t2] ?? t2 }));
  })
});

// server/dsr-router.ts
import { z as z26 } from "zod";
import { TRPCError as TRPCError20 } from "@trpc/server";

// server/dsr-store.ts
init_schema();
init_db();
import { and as and22, asc as asc2, eq as eq28 } from "drizzle-orm";
var REQUEST_TYPES = ["access", "rectification", "erasure", "portability", "restriction", "objection", "explanation"];
var JURISDICTIONS = ["China", "Saudi Arabia", "Other"];
var STATUSES = ["received", "in_review", "pending_info", "completed", "rejected", "withdrawn"];
var PRIORITIES = ["normal", "high", "urgent"];
function computeDueDate(jurisdiction, from = /* @__PURE__ */ new Date()) {
  const d2 = new Date(from);
  d2.setDate(d2.getDate() + (jurisdiction === "China" ? 21 : 30));
  return d2;
}
var _now = /* @__PURE__ */ new Date();
var MEM_DSRS = [
  { id: 1, organizationId: 1, requestType: "access", jurisdiction: "China", requesterName: "Li Wei", requesterEmail: "li.wei@example.cn", description: "Requesting a copy of all personal data held about me under PIPL Article 45.", status: "in_review", priority: "normal", dueDate: computeDueDate("China", new Date(_now.getTime() - 5 * 864e5)), completedAt: null, assignedToUserId: null, notes: "Verification of identity completed.", createdAt: new Date(_now.getTime() - 5 * 864e5), updatedAt: new Date(_now.getTime() - 3 * 864e5) },
  { id: 2, organizationId: 1, requestType: "erasure", jurisdiction: "Saudi Arabia", requesterName: "Khalid Al-Mansour", requesterEmail: "k.almansour@example.sa", description: "Requesting deletion of all personal data per PDPL Article 6.", status: "received", priority: "high", dueDate: computeDueDate("Saudi Arabia", new Date(_now.getTime() - 2 * 864e5)), completedAt: null, assignedToUserId: null, notes: null, createdAt: new Date(_now.getTime() - 2 * 864e5), updatedAt: new Date(_now.getTime() - 2 * 864e5) },
  { id: 3, organizationId: 1, requestType: "portability", jurisdiction: "China", requesterName: "Zhang Min", requesterEmail: "zhang.min@example.cn", description: "Requesting data portability to transfer records to another provider.", status: "completed", priority: "normal", dueDate: computeDueDate("China", new Date(_now.getTime() - 25 * 864e5)), completedAt: new Date(_now.getTime() - 3 * 864e5), assignedToUserId: null, notes: "Data exported and sent via secure channel.", createdAt: new Date(_now.getTime() - 25 * 864e5), updatedAt: new Date(_now.getTime() - 3 * 864e5) },
  { id: 4, organizationId: 1, requestType: "rectification", jurisdiction: "Saudi Arabia", requesterName: "Fatimah Al-Hassan", requesterEmail: "f.alhassan@example.sa", description: "Incorrect date of birth in our records \u2014 requesting correction.", status: "pending_info", priority: "urgent", dueDate: new Date(_now.getTime() + 3 * 864e5), completedAt: null, assignedToUserId: null, notes: "Waiting for ID document from requester.", createdAt: new Date(_now.getTime() - 10 * 864e5), updatedAt: new Date(_now.getTime() - 1 * 864e5) }
];
var memSeq7 = 5;
function buildDsrSummary(rows) {
  const counts = { received: 0, in_review: 0, pending_info: 0, completed: 0, rejected: 0, withdrawn: 0 };
  let overdue = 0;
  const now = /* @__PURE__ */ new Date();
  for (const row of rows) {
    counts[row.status] = (counts[row.status] ?? 0) + 1;
    const due = typeof row.dueDate === "string" ? new Date(row.dueDate) : row.dueDate;
    if (due < now && row.status !== "completed" && row.status !== "rejected" && row.status !== "withdrawn") overdue++;
  }
  const open = counts.received + counts.in_review + counts.pending_info;
  return { counts, open, overdue, total: rows.length };
}
async function listDsrs(orgId, filters) {
  const db = await getDb();
  if (!db || orgId < 0) {
    let items = MEM_DSRS.filter((d2) => d2.organizationId === orgId);
    if (filters?.status) items = items.filter((d2) => d2.status === filters.status);
    if (filters?.requestType) items = items.filter((d2) => d2.requestType === filters.requestType);
    if (filters?.jurisdiction) items = items.filter((d2) => d2.jurisdiction === filters.jurisdiction);
    return [...items].sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  }
  const conditions = [eq28(dsrRequests.organizationId, orgId)];
  if (filters?.status) conditions.push(eq28(dsrRequests.status, filters.status));
  if (filters?.requestType) conditions.push(eq28(dsrRequests.requestType, filters.requestType));
  if (filters?.jurisdiction) conditions.push(eq28(dsrRequests.jurisdiction, filters.jurisdiction));
  return db.select().from(dsrRequests).where(and22(...conditions)).orderBy(asc2(dsrRequests.dueDate));
}
async function createDsr(orgId, input, assignedToUserId) {
  const db = await getDb();
  const now = /* @__PURE__ */ new Date();
  const dueDate = computeDueDate(input.jurisdiction, now);
  if (!db || orgId < 0) {
    const item = {
      id: memSeq7++,
      organizationId: orgId,
      requestType: input.requestType,
      jurisdiction: input.jurisdiction,
      requesterName: input.requesterName,
      requesterEmail: input.requesterEmail,
      description: input.description ?? null,
      status: "received",
      priority: input.priority,
      dueDate,
      completedAt: null,
      assignedToUserId,
      notes: input.notes ?? null,
      createdAt: now,
      updatedAt: now
    };
    MEM_DSRS.push(item);
    return { success: true, id: item.id, dueDate };
  }
  const [inserted] = await db.insert(dsrRequests).values({
    organizationId: orgId,
    requestType: input.requestType,
    jurisdiction: input.jurisdiction,
    requesterName: input.requesterName,
    requesterEmail: input.requesterEmail,
    description: input.description ?? null,
    status: "received",
    priority: input.priority,
    dueDate,
    completedAt: null,
    assignedToUserId,
    notes: input.notes ?? null,
    createdAt: now,
    updatedAt: now
  }).returning({ id: dsrRequests.id });
  const insertId = inserted.id;
  return { success: true, id: insertId, dueDate };
}
async function patchDsr(orgId, id, update) {
  const db = await getDb();
  if (!db || orgId < 0) {
    const idx = MEM_DSRS.findIndex((d2) => d2.id === id && d2.organizationId === orgId);
    if (idx === -1) return false;
    Object.assign(MEM_DSRS[idx], update);
    return true;
  }
  const [existing] = await db.select({ id: dsrRequests.id, organizationId: dsrRequests.organizationId }).from(dsrRequests).where(eq28(dsrRequests.id, id));
  if (!existing || existing.organizationId !== orgId) return false;
  await db.update(dsrRequests).set(update).where(and22(eq28(dsrRequests.id, id), eq28(dsrRequests.organizationId, orgId)));
  return true;
}
async function removeDsr(orgId, id) {
  const db = await getDb();
  if (!db || orgId < 0) {
    const idx = MEM_DSRS.findIndex((d2) => d2.id === id && d2.organizationId === orgId);
    if (idx === -1) return false;
    MEM_DSRS.splice(idx, 1);
    return true;
  }
  const [existing] = await db.select({ id: dsrRequests.id, organizationId: dsrRequests.organizationId }).from(dsrRequests).where(eq28(dsrRequests.id, id));
  if (!existing || existing.organizationId !== orgId) return false;
  await db.delete(dsrRequests).where(and22(eq28(dsrRequests.id, id), eq28(dsrRequests.organizationId, orgId)));
  return true;
}
async function getDsrSummary(orgId) {
  const db = await getDb();
  if (!db || orgId < 0) {
    return buildDsrSummary(
      MEM_DSRS.filter((d2) => d2.organizationId === orgId).map((d2) => ({ status: d2.status, dueDate: d2.dueDate }))
    );
  }
  const rows = await db.select({ status: dsrRequests.status, dueDate: dsrRequests.dueDate }).from(dsrRequests).where(eq28(dsrRequests.organizationId, orgId));
  return buildDsrSummary(rows);
}

// server/dsr-router.ts
var requestTypeEnum = z26.enum(REQUEST_TYPES);
var jurisdictionEnum2 = z26.enum(JURISDICTIONS);
var statusEnum6 = z26.enum(STATUSES);
var priorityEnum2 = z26.enum(PRIORITIES);
var createSchema6 = z26.object({
  requestType: requestTypeEnum,
  jurisdiction: jurisdictionEnum2,
  requesterName: z26.string().trim().min(1).max(255),
  requesterEmail: z26.string().email().max(255),
  description: z26.string().trim().max(5e3).optional(),
  priority: priorityEnum2,
  assignedToUserId: z26.number().int().positive().optional(),
  notes: z26.string().trim().max(5e3).optional()
});
var patchSchema4 = z26.object({
  status: statusEnum6.optional(),
  priority: priorityEnum2.optional(),
  assignedToUserId: z26.number().int().positive().nullable().optional(),
  notes: z26.string().trim().max(5e3).optional(),
  completedAt: z26.string().nullable().optional()
});
var dsrRouter = router({
  list: activeOrgProcedure.input(z26.object({
    status: statusEnum6.optional(),
    requestType: requestTypeEnum.optional(),
    jurisdiction: jurisdictionEnum2.optional()
  }).optional()).query(async ({ ctx, input }) => {
    await requireModulePermission(ctx, "dsr_management", "canView");
    return listDsrs(ctx.organizationId, input ?? {});
  }),
  create: activeOrgProcedure.input(createSchema6).mutation(async ({ ctx, input }) => {
    await requireModulePermission(ctx, "dsr_management", "canCreate");
    const orgId = ctx.organizationId;
    const result = await createDsr(orgId, input, input.assignedToUserId ?? null);
    void recordAuditEvent(ctx, {
      category: "data_write",
      action: "dsr.create",
      entityType: "dsrRequests",
      entityId: result.id,
      targetEntity: input.requesterEmail,
      outcome: "success",
      payload: { requestType: input.requestType, jurisdiction: input.jurisdiction }
    });
    return result;
  }),
  patch: activeOrgProcedure.input(z26.object({ id: z26.number().int().positive() }).merge(patchSchema4)).mutation(async ({ ctx, input }) => {
    await requireModulePermission(ctx, "dsr_management", "canEdit");
    const { id, ...data } = input;
    const orgId = ctx.organizationId;
    const updateValues = { ...data, updatedAt: /* @__PURE__ */ new Date() };
    if (data.completedAt !== void 0) {
      updateValues.completedAt = data.completedAt ? new Date(data.completedAt) : null;
    }
    const success = await patchDsr(orgId, id, updateValues);
    if (!success) throw new TRPCError20({ code: "NOT_FOUND" });
    void recordAuditEvent(ctx, {
      category: "data_write",
      action: "dsr.patch",
      entityType: "dsrRequests",
      entityId: id,
      outcome: "success"
    });
    return { success: true };
  }),
  remove: activeOrgProcedure.input(z26.number().int().positive()).mutation(async ({ ctx, input: id }) => {
    await requireModulePermission(ctx, "dsr_management", "canDelete");
    const orgId = ctx.organizationId;
    const success = await removeDsr(orgId, id);
    if (!success) throw new TRPCError20({ code: "NOT_FOUND" });
    void recordAuditEvent(ctx, {
      category: "data_write",
      action: "dsr.remove",
      entityType: "dsrRequests",
      entityId: id,
      outcome: "success"
    });
    return { success: true };
  }),
  summary: activeOrgProcedure.query(async ({ ctx }) => {
    await requireModulePermission(ctx, "dsr_management", "canView");
    return getDsrSummary(ctx.organizationId);
  })
});

// server/compliance-chat-router.ts
import { TRPCError as TRPCError21 } from "@trpc/server";
import { z as z27 } from "zod";

// server/_core/llm.ts
init_env();
var ensureArray = (value) => Array.isArray(value) ? value : [value];
var normalizeContentPart = (part) => {
  if (typeof part === "string") {
    return { type: "text", text: part };
  }
  if (part.type === "text") {
    return part;
  }
  if (part.type === "image_url") {
    return part;
  }
  if (part.type === "file_url") {
    return part;
  }
  throw new Error("Unsupported message content part");
};
var normalizeMessage = (message) => {
  const { role, name, tool_call_id } = message;
  if (role === "tool" || role === "function") {
    const content = ensureArray(message.content).map((part) => typeof part === "string" ? part : JSON.stringify(part)).join("\n");
    return {
      role,
      name,
      tool_call_id,
      content
    };
  }
  const contentParts = ensureArray(message.content).map(normalizeContentPart);
  if (contentParts.length === 1 && contentParts[0].type === "text") {
    return {
      role,
      name,
      content: contentParts[0].text
    };
  }
  return {
    role,
    name,
    content: contentParts
  };
};
var normalizeToolChoice = (toolChoice, tools) => {
  if (!toolChoice) return void 0;
  if (toolChoice === "none" || toolChoice === "auto") {
    return toolChoice;
  }
  if (toolChoice === "required") {
    if (!tools || tools.length === 0) {
      throw new Error(
        "tool_choice 'required' was provided but no tools were configured"
      );
    }
    if (tools.length > 1) {
      throw new Error(
        "tool_choice 'required' needs a single tool or specify the tool name explicitly"
      );
    }
    return {
      type: "function",
      function: { name: tools[0].function.name }
    };
  }
  if ("name" in toolChoice) {
    return {
      type: "function",
      function: { name: toolChoice.name }
    };
  }
  return toolChoice;
};
var resolveApiUrl = () => ENV.forgeApiUrl && ENV.forgeApiUrl.trim().length > 0 ? `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions` : "https://forge.manus.im/v1/chat/completions";
var assertApiKey = () => {
  if (!ENV.forgeApiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
};
var normalizeResponseFormat = ({
  responseFormat,
  response_format,
  outputSchema,
  output_schema
}) => {
  const explicitFormat = responseFormat || response_format;
  if (explicitFormat) {
    if (explicitFormat.type === "json_schema" && !explicitFormat.json_schema?.schema) {
      throw new Error(
        "responseFormat json_schema requires a defined schema object"
      );
    }
    return explicitFormat;
  }
  const schema = outputSchema || output_schema;
  if (!schema) return void 0;
  if (!schema.name || !schema.schema) {
    throw new Error("outputSchema requires both name and schema");
  }
  return {
    type: "json_schema",
    json_schema: {
      name: schema.name,
      schema: schema.schema,
      ...typeof schema.strict === "boolean" ? { strict: schema.strict } : {}
    }
  };
};
async function invokeLLM(params) {
  assertApiKey();
  const {
    messages,
    tools,
    toolChoice,
    tool_choice,
    outputSchema,
    output_schema,
    responseFormat,
    response_format
  } = params;
  const payload = {
    model: "gemini-2.5-flash",
    messages: messages.map(normalizeMessage)
  };
  if (tools && tools.length > 0) {
    payload.tools = tools;
  }
  const normalizedToolChoice = normalizeToolChoice(
    toolChoice || tool_choice,
    tools
  );
  if (normalizedToolChoice) {
    payload.tool_choice = normalizedToolChoice;
  }
  payload.max_tokens = 32768;
  payload.thinking = {
    "budget_tokens": 128
  };
  const normalizedResponseFormat = normalizeResponseFormat({
    responseFormat,
    response_format,
    outputSchema,
    output_schema
  });
  if (normalizedResponseFormat) {
    payload.response_format = normalizedResponseFormat;
  }
  const response = await fetch(resolveApiUrl(), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${ENV.forgeApiKey}`
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `LLM invoke failed: ${response.status} ${response.statusText} \u2013 ${errorText}`
    );
  }
  return await response.json();
}

// server/compliance-chat-router.ts
init_env();
init_config_schema();
var chatMessageSchema = z27.object({
  role: z27.enum(["user", "assistant"]),
  content: z27.string().max(2e3)
});
var chatInputSchema = z27.object({
  /** Full conversation history including the latest user message at the end */
  messages: z27.array(chatMessageSchema).min(1).max(30),
  /**
   * Optional jurisdiction to bias the knowledge-base search.
   * Omit or pass "all" to search across all jurisdictions.
   */
  jurisdiction: z27.enum(["all", "China", "Saudi Arabia"]).optional().default("all")
});
var SYSTEM_PROMPT_PREFIX = `You are the DJAC Compliance Assistant \u2014 an expert on cross-border data-protection and cybersecurity regulations between China and Saudi Arabia.

Your knowledge covers:
\u2022 China: PIPL (Personal Information Protection Law), CSL (Cybersecurity Law), DSL (Data Security Law)
\u2022 Saudi Arabia: PDPL (Personal Data Protection Law), NCA Essential Cybersecurity Controls (ECC)
\u2022 Cross-border data transfer frameworks, adequacy assessments, and dual-compliance strategies

Guidelines:
1. Answer concisely and accurately, citing the relevant framework/article where possible.
2. If a question is outside your knowledge (e.g. unrelated to DJAC, compliance, or cybersecurity), politely redirect.
3. Distinguish between legal requirements (MUST) and best-practice recommendations (SHOULD).
4. Do not speculate about facts \u2014 if uncertain, say so and recommend consulting a qualified legal professional.
5. For cross-border questions, address both jurisdictions and highlight conflicts or gaps.
6. Respond in the same language the user wrote in (English, Arabic, or Chinese).
`;
function buildSystemPrompt(query, jurisdiction) {
  const results = searchLawKnowledge(query, 4);
  if (results.length === 0) {
    return SYSTEM_PROMPT_PREFIX + "\n\nNo specific regulatory references matched this query \u2014 answer from general knowledge.";
  }
  const contextBlocks = results.map((r) => {
    const highlights = r.highlights.slice(0, 2).map((h) => `  [${h.title}]: ${h.excerpt}`).join("\n");
    return `## ${r.title} (${r.jurisdiction}, ${r.frameworkCodes.join(", ")})
${r.summary}
${highlights}`;
  });
  const jurisdictionNote = jurisdiction === "all" ? "" : `

Focus your answer on regulations applicable in ${jurisdiction}.`;
  return SYSTEM_PROMPT_PREFIX + "\n\n--- Relevant regulatory context ---\n\n" + contextBlocks.join("\n\n") + jurisdictionNote;
}
var complianceChatRouter = router({
  /**
   * chat — Send a message and receive an AI compliance response.
   *
   * The client should maintain the full message history and pass it on each
   * request so the LLM has conversational context.
   */
  chat: activeOrgProcedure.input(chatInputSchema).mutation(async ({ ctx, input }) => {
    await requireModulePermission(ctx, "pro_intelligence", "canView");
    const { messages, jurisdiction } = input;
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== "user") {
      throw new TRPCError21({
        code: "BAD_REQUEST",
        message: "The last message must be from the user."
      });
    }
    const systemPrompt = buildSystemPrompt(lastMessage.content, jurisdiction);
    if (!ENV.forgeApiKey && !parsedEnv.OPENAI_API_KEY) {
      void recordUserInteraction(ctx, {
        context: "complianceChat.chat",
        action: "compliance_chat_fallback",
        entityType: "ai_response",
        outputRef: { reason: "llm_not_configured" }
      });
      return {
        role: "assistant",
        content: "The AI compliance assistant is not yet configured on this deployment. Please contact your administrator to set up the OpenAI API key (OPENAI_API_KEY environment variable).",
        citations: [],
        fallback: true
      };
    }
    try {
      const result = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.map((m) => ({ role: m.role, content: m.content }))
        ],
        maxTokens: 1024
      });
      const reply = result.choices[0]?.message?.content;
      const replyText = typeof reply === "string" ? reply : Array.isArray(reply) ? reply.map((p) => p.type === "text" ? p.text : "").join("") : "Sorry, I could not generate a response. Please try again.";
      void recordUserInteraction(ctx, {
        context: "complianceChat.chat",
        action: "compliance_chat_response",
        entityType: "ai_response",
        outputRef: {
          jurisdiction,
          tokens: result.usage?.total_tokens ?? 0
        }
      });
      return {
        role: "assistant",
        content: replyText,
        citations: [],
        fallback: false
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown LLM error";
      throw new TRPCError21({
        code: "INTERNAL_SERVER_ERROR",
        message: `AI service error: ${message}`
      });
    }
  })
});

// server/service-request-router.ts
import { z as z28 } from "zod";
import { TRPCError as TRPCError22 } from "@trpc/server";

// server/_core/logger.ts
init_env();
import pino from "pino";
var isDev = ENV.isDevelopment;
var transport = isDev ? {
  target: "pino-pretty",
  options: {
    colorize: true,
    translateTime: "SYS:HH:MM:ss.l",
    ignore: "pid,hostname",
    messageFormat: "{msg}",
    singleLine: false
  }
} : void 0;
var logger = pino(
  {
    level: isDev ? "debug" : "info",
    base: {
      service: "djac-tool",
      env: ENV.isProduction ? "production" : ENV.isDevelopment ? "development" : "test"
    },
    // Redact secrets from any log line regardless of caller
    redact: {
      paths: [
        "*.password",
        "*.passwordHash",
        "*.token",
        "*.secret",
        "*.apiKey",
        "*.api_key",
        "*.jwt",
        "*.authorization",
        "req.headers.authorization",
        "req.headers.cookie"
      ],
      censor: "[REDACTED]"
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    serializers: {
      err: pino.stdSerializers.err,
      error: pino.stdSerializers.err,
      req: pino.stdSerializers.req,
      res: pino.stdSerializers.res
    }
  },
  transport ? pino.transport(transport) : void 0
);
function logEvent(category, action, data, level = "info") {
  logger[level]({ category, action, ...data }, action);
}

// server/service-request-router.ts
init_env();

// server/service-request-store.ts
init_schema();
init_db();
import { and as and23, desc as desc14, eq as eq29 } from "drizzle-orm";
var SERVICE_TYPES = [
  "penetration_test",
  "red_team",
  "security_audit",
  "soc_support",
  "incident_response",
  "consulting",
  "phishing_simulation",
  "cloud_security_review",
  "vulnerability_assessment",
  "compliance_gap_assessment"
];
var REQUEST_STATUSES = [
  "draft",
  "submitted",
  "under_review",
  "scoping",
  "approved",
  "in_progress",
  "completed",
  "cancelled",
  "on_hold"
];
var PRIORITY_LEVELS = ["low", "medium", "high", "critical"];
var MEM_REQUESTS = [];
var memSeq8 = 1;
async function listRequests(orgId) {
  const db = await getDb();
  if (!db || orgId < 0) {
    return [...MEM_REQUESTS.filter((r) => r.organizationId === orgId)].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  return db.select().from(serviceRequests).where(eq29(serviceRequests.organizationId, orgId)).orderBy(desc14(serviceRequests.createdAt));
}
async function getRequest(orgId, id) {
  const db = await getDb();
  if (!db || orgId < 0) {
    return MEM_REQUESTS.find((r) => r.id === id && r.organizationId === orgId) ?? null;
  }
  const [row] = await db.select().from(serviceRequests).where(and23(eq29(serviceRequests.id, id), eq29(serviceRequests.organizationId, orgId))).limit(1);
  return row ?? null;
}
async function createRequest(orgId, input, localUserId) {
  const db = await getDb();
  const now = /* @__PURE__ */ new Date();
  const preferredStartDate = input.preferredStartDate ? new Date(input.preferredStartDate) : null;
  if (!db || orgId < 0) {
    const newReq = {
      id: memSeq8++,
      organizationId: orgId,
      requestedByUserId: localUserId,
      serviceType: input.serviceType,
      title: input.title,
      description: input.description,
      scopeDetails: input.scopeDetails ?? null,
      preferredStartDate,
      budgetRange: input.budgetRange ?? null,
      priority: input.priority,
      status: "submitted",
      assignedToUserId: null,
      internalNotes: null,
      clientResponse: null,
      respondedAt: null,
      completedAt: null,
      createdAt: now,
      updatedAt: now
    };
    MEM_REQUESTS.push(newReq);
    return { row: newReq, insertId: newReq.id };
  }
  const [inserted] = await db.insert(serviceRequests).values({
    organizationId: orgId,
    requestedByUserId: localUserId,
    serviceType: input.serviceType,
    title: input.title,
    description: input.description,
    scopeDetails: input.scopeDetails ?? null,
    preferredStartDate,
    budgetRange: input.budgetRange ?? null,
    priority: input.priority,
    status: "submitted"
  }).returning({ id: serviceRequests.id });
  const insertId = inserted.id;
  const [created] = await db.select().from(serviceRequests).where(eq29(serviceRequests.id, insertId)).limit(1);
  return { row: created, insertId };
}
async function cancelRequest(orgId, id) {
  const db = await getDb();
  if (!db || orgId < 0) {
    const req = MEM_REQUESTS.find((r) => r.id === id && r.organizationId === orgId);
    if (!req) return "not_found";
    if (!["draft", "submitted"].includes(req.status)) return "not_cancellable";
    req.status = "cancelled";
    req.updatedAt = /* @__PURE__ */ new Date();
    return req;
  }
  const [existing] = await db.select().from(serviceRequests).where(and23(eq29(serviceRequests.id, id), eq29(serviceRequests.organizationId, orgId))).limit(1);
  if (!existing) return "not_found";
  if (!["draft", "submitted"].includes(existing.status)) return "not_cancellable";
  await db.update(serviceRequests).set({ status: "cancelled", updatedAt: /* @__PURE__ */ new Date() }).where(eq29(serviceRequests.id, id));
  return { id, status: "cancelled" };
}
async function adminListRequests() {
  const db = await getDb();
  if (!db) {
    return [...MEM_REQUESTS].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  return db.select().from(serviceRequests).orderBy(desc14(serviceRequests.createdAt));
}
async function adminUpdateRequest(id, updateValues) {
  const db = await getDb();
  if (!db) {
    const req = MEM_REQUESTS.find((r) => r.id === id);
    if (!req) return null;
    Object.assign(req, updateValues);
    return req;
  }
  await db.update(serviceRequests).set(updateValues).where(eq29(serviceRequests.id, id));
  const [updated] = await db.select().from(serviceRequests).where(eq29(serviceRequests.id, id)).limit(1);
  return updated ?? null;
}

// server/service-request-router.ts
var serviceTypeEnum2 = z28.enum(SERVICE_TYPES);
var statusEnum7 = z28.enum(REQUEST_STATUSES);
var priorityEnum3 = z28.enum(PRIORITY_LEVELS);
var createSchema7 = z28.object({
  serviceType: serviceTypeEnum2,
  title: z28.string().trim().min(3).max(255),
  description: z28.string().trim().min(10).max(5e3),
  scopeDetails: z28.string().trim().max(3e3).optional(),
  preferredStartDate: z28.string().optional(),
  budgetRange: z28.string().trim().max(100).optional(),
  priority: priorityEnum3
});
var adminUpdateSchema = z28.object({
  status: statusEnum7.optional(),
  assignedToUserId: z28.number().int().positive().nullable().optional(),
  internalNotes: z28.string().trim().max(5e3).nullable().optional(),
  clientResponse: z28.string().trim().max(5e3).nullable().optional(),
  priority: priorityEnum3.optional()
});
var serviceRequestRouter = router({
  list: activeOrgProcedure.query(async ({ ctx }) => {
    await requireModulePermission(ctx, "service_requests", "canView");
    return listRequests(ctx.organizationId);
  }),
  get: activeOrgProcedure.input(z28.object({ id: z28.number().int().positive() })).query(async ({ ctx, input }) => {
    await requireModulePermission(ctx, "service_requests", "canView");
    const req = await getRequest(ctx.organizationId, input.id);
    if (!req) throw new TRPCError22({ code: "NOT_FOUND" });
    return req;
  }),
  create: activeOrgProcedure.input(createSchema7).mutation(async ({ ctx, input }) => {
    await requireModulePermission(ctx, "service_requests", "canCreate");
    const orgId = ctx.organizationId;
    const localUserId = ctx.user?.localUserId ?? null;
    const { row, insertId } = await createRequest(orgId, input, localUserId);
    void recordAuditEvent(ctx, {
      category: "data_write",
      action: "serviceRequest.create",
      entityType: "serviceRequests",
      entityId: insertId,
      targetEntity: input.title,
      outcome: "success",
      payload: { serviceType: input.serviceType, priority: input.priority }
    });
    if (ENV.smtpHost) {
      const body = `A new service request has been submitted by organization ${orgId}.

Service Type: ${input.serviceType}
Priority: ${input.priority}

Description:
${input.description}`;
      sendEmail({
        to: ENV.smtpFrom ?? "admin@yalla-hack.net",
        subject: `[DJAC] New Service Request: ${input.title}`,
        html: `<pre>${body}</pre>`,
        text: body
      }).catch((err) => logEvent("system", "service-request-create-notify-fail", { err }, "warn"));
    }
    broadcastSSE("service_request_created", { id: insertId, orgId, serviceType: input.serviceType, priority: input.priority });
    void recordUserInteraction(ctx, { context: "service_request", action: "service_request_submitted", entityId: insertId, inputSnapshot: { serviceType: input.serviceType } });
    return row;
  }),
  cancel: activeOrgProcedure.input(z28.object({ id: z28.number().int().positive() })).mutation(async ({ ctx, input }) => {
    await requireModulePermission(ctx, "service_requests", "canEdit");
    const orgId = ctx.organizationId;
    const result = await cancelRequest(orgId, input.id);
    if (result === "not_found") throw new TRPCError22({ code: "NOT_FOUND" });
    if (result === "not_cancellable") throw new TRPCError22({ code: "BAD_REQUEST", message: "Request cannot be cancelled in its current state" });
    void recordAuditEvent(ctx, {
      category: "data_write",
      action: "serviceRequest.cancel",
      entityType: "serviceRequests",
      entityId: input.id,
      outcome: "success"
    });
    return { success: true };
  }),
  adminList: protectedProcedure.query(async ({ ctx }) => {
    if (!hasMinRole(ctx.user?.role, "admin")) throw new TRPCError22({ code: "FORBIDDEN" });
    await requireModulePermissionIfOrgContext(ctx, "service_requests", "canView");
    return adminListRequests();
  }),
  adminUpdate: protectedProcedure.input(z28.object({ id: z28.number().int().positive() }).merge(adminUpdateSchema)).mutation(async ({ ctx, input }) => {
    if (!hasMinRole(ctx.user?.role, "admin")) throw new TRPCError22({ code: "FORBIDDEN" });
    await requireModulePermissionIfOrgContext(ctx, "service_requests", "canEdit");
    const { id, ...data } = input;
    const updateValues = { ...data, updatedAt: /* @__PURE__ */ new Date() };
    if (data.status === "completed") updateValues.completedAt = /* @__PURE__ */ new Date();
    if (data.clientResponse !== void 0) updateValues.respondedAt = /* @__PURE__ */ new Date();
    const updated = await adminUpdateRequest(id, updateValues);
    if (!updated) throw new TRPCError22({ code: "NOT_FOUND" });
    if (data.clientResponse && updated.organizationId != null) {
      broadcastSSE("service_request_updated", { id, status: updated.status, orgId: updated.organizationId });
    }
    void recordAuditEvent(ctx, {
      category: "data_write",
      action: "serviceRequest.adminUpdate",
      entityType: "serviceRequests",
      entityId: id,
      outcome: "success",
      payload: data
    });
    return updated;
  })
});

// server/asset-inventory-router.ts
import { z as z29 } from "zod";
import { TRPCError as TRPCError23 } from "@trpc/server";

// server/asset-inventory-store.ts
init_schema();
init_db();
import { and as and24, desc as desc15, eq as eq30 } from "drizzle-orm";
var ASSET_TYPES = [
  "server",
  "workstation",
  "network_device",
  "cloud_service",
  "saas_application",
  "database",
  "api_endpoint",
  "iot_device",
  "mobile_device",
  "industrial_ot",
  "web_application",
  "source_code_repo",
  "third_party_service"
];
var CRITICALITY_LEVELS = ["low", "medium", "high", "critical"];
var EXPOSURE_LEVELS = ["internal", "vpn_only", "partner_only", "internet_facing"];
var ASSET_STATUSES = ["active", "decommissioned", "under_review", "unknown"];
var MEM_ASSETS = [];
var memSeq9 = 1;
var CRITICALITY_WEIGHT = { low: 1, medium: 2, high: 3, critical: 5 };
var EXPOSURE_WEIGHT = { internal: 1, vpn_only: 2, partner_only: 3, internet_facing: 5 };
function calcRiskScore(criticality, exposure, openVulnCount) {
  const c = CRITICALITY_WEIGHT[criticality] ?? 1;
  const e = EXPOSURE_WEIGHT[exposure] ?? 1;
  const raw = c * e * (1 + Math.min(openVulnCount, 10) * 0.15);
  return Math.min(100, Math.round(raw / 25 * 100));
}
async function listAssets(orgId) {
  const db = await getDb();
  if (!db || orgId < 0) {
    return [...MEM_ASSETS.filter((a) => a.organizationId === orgId)].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  return db.select().from(assetInventory).where(eq30(assetInventory.organizationId, orgId)).orderBy(desc15(assetInventory.createdAt));
}
async function getAsset(orgId, id) {
  const db = await getDb();
  if (!db || orgId < 0) {
    return MEM_ASSETS.find((a) => a.id === id && a.organizationId === orgId) ?? null;
  }
  const [row] = await db.select().from(assetInventory).where(and24(eq30(assetInventory.id, id), eq30(assetInventory.organizationId, orgId))).limit(1);
  return row ?? null;
}
async function createAsset(orgId, input, localUserId) {
  const db = await getDb();
  const now = /* @__PURE__ */ new Date();
  const riskScore = calcRiskScore(input.criticality, input.exposure, 0);
  if (!db || orgId < 0) {
    const asset = {
      id: memSeq9++,
      organizationId: orgId,
      name: input.name,
      assetType: input.assetType,
      identifier: input.identifier ?? null,
      owner: input.owner ?? null,
      location: input.location ?? null,
      criticality: input.criticality,
      exposure: input.exposure,
      status: input.status,
      riskScore,
      platform: input.platform ?? null,
      version: input.version ?? null,
      lastScannedAt: null,
      openVulnCount: 0,
      tags: input.tags ?? null,
      notes: input.notes ?? null,
      addedByUserId: localUserId,
      createdAt: now,
      updatedAt: now
    };
    MEM_ASSETS.push(asset);
    return asset;
  }
  const [inserted] = await db.insert(assetInventory).values({
    organizationId: orgId,
    name: input.name,
    assetType: input.assetType,
    identifier: input.identifier ?? null,
    owner: input.owner ?? null,
    location: input.location ?? null,
    criticality: input.criticality,
    exposure: input.exposure,
    status: input.status,
    riskScore,
    platform: input.platform ?? null,
    version: input.version ?? null,
    tags: input.tags ?? null,
    notes: input.notes ?? null,
    addedByUserId: localUserId
  }).returning({ id: assetInventory.id });
  const insertId = inserted.id;
  const [created] = await db.select().from(assetInventory).where(eq30(assetInventory.id, insertId)).limit(1);
  return created;
}
async function getAssetForPatch(orgId, id) {
  const db = await getDb();
  if (!db || orgId < 0) {
    return MEM_ASSETS.find((a) => a.id === id && a.organizationId === orgId) ?? null;
  }
  const [row] = await db.select().from(assetInventory).where(and24(eq30(assetInventory.id, id), eq30(assetInventory.organizationId, orgId))).limit(1);
  return row ?? null;
}
async function patchAssetRow(orgId, id, updateValues) {
  const db = await getDb();
  if (!db || orgId < 0) {
    const asset = MEM_ASSETS.find((a) => a.id === id && a.organizationId === orgId);
    if (!asset) return null;
    Object.assign(asset, updateValues);
    return asset;
  }
  await db.update(assetInventory).set(updateValues).where(eq30(assetInventory.id, id));
  const [updated] = await db.select().from(assetInventory).where(eq30(assetInventory.id, id)).limit(1);
  return updated ?? null;
}
async function deleteAsset(orgId, id) {
  const db = await getDb();
  if (!db || orgId < 0) {
    const idx = MEM_ASSETS.findIndex((a) => a.id === id && a.organizationId === orgId);
    if (idx === -1) return { found: false };
    MEM_ASSETS.splice(idx, 1);
    return { found: true };
  }
  const [existing] = await db.select({ id: assetInventory.id, name: assetInventory.name }).from(assetInventory).where(and24(eq30(assetInventory.id, id), eq30(assetInventory.organizationId, orgId))).limit(1);
  if (!existing) return { found: false };
  await db.delete(assetInventory).where(eq30(assetInventory.id, id));
  return { found: true, name: existing.name };
}
async function getAllOrgAssets(orgId) {
  const db = await getDb();
  if (!db || orgId < 0) {
    return MEM_ASSETS.filter((a) => a.organizationId === orgId);
  }
  return db.select().from(assetInventory).where(eq30(assetInventory.organizationId, orgId));
}

// server/asset-inventory-router.ts
var assetTypeEnum2 = z29.enum(ASSET_TYPES);
var criticalityEnum2 = z29.enum(CRITICALITY_LEVELS);
var exposureEnum2 = z29.enum(EXPOSURE_LEVELS);
var statusEnum8 = z29.enum(ASSET_STATUSES);
var createSchema8 = z29.object({
  name: z29.string().trim().min(1).max(255),
  assetType: assetTypeEnum2,
  criticality: criticalityEnum2,
  exposure: exposureEnum2,
  status: statusEnum8,
  identifier: z29.string().trim().max(255).optional(),
  owner: z29.string().trim().max(255).optional(),
  location: z29.string().trim().max(255).optional(),
  platform: z29.string().trim().max(255).optional(),
  version: z29.string().trim().max(100).optional(),
  tags: z29.string().trim().max(500).optional(),
  notes: z29.string().trim().max(2e3).optional()
});
var patchSchema5 = createSchema8.partial().extend({
  openVulnCount: z29.number().int().min(0).optional()
});
var assetInventoryRouter = router({
  list: activeOrgProcedure.query(async ({ ctx }) => {
    await requireModulePermission(ctx, "asset_inventory", "canView");
    return listAssets(ctx.organizationId);
  }),
  get: activeOrgProcedure.input(z29.object({ id: z29.number().int().positive() })).query(async ({ ctx, input }) => {
    await requireModulePermission(ctx, "asset_inventory", "canView");
    const asset = await getAsset(ctx.organizationId, input.id);
    if (!asset) throw new TRPCError23({ code: "NOT_FOUND" });
    return asset;
  }),
  create: activeOrgProcedure.input(createSchema8).mutation(async ({ ctx, input }) => {
    await requireModulePermission(ctx, "asset_inventory", "canCreate");
    const orgId = ctx.organizationId;
    const localUserId = ctx.user?.localUserId ?? null;
    const result = await createAsset(orgId, input, localUserId);
    void recordAuditEvent(ctx, {
      category: "data_write",
      action: "asset.create",
      entityType: "assetInventory",
      entityId: result.id,
      targetEntity: input.name,
      outcome: "success"
    });
    return result;
  }),
  patch: activeOrgProcedure.input(z29.object({ id: z29.number().int().positive() }).merge(patchSchema5)).mutation(async ({ ctx, input }) => {
    await requireModulePermission(ctx, "asset_inventory", "canEdit");
    const { id, ...data } = input;
    const orgId = ctx.organizationId;
    const existing = await getAssetForPatch(orgId, id);
    if (!existing) throw new TRPCError23({ code: "NOT_FOUND" });
    const updateValues = { ...data, updatedAt: /* @__PURE__ */ new Date() };
    if ("criticality" in data || "exposure" in data || "openVulnCount" in data) {
      const crit = data.criticality ?? existing.criticality;
      const exp = data.exposure ?? existing.exposure;
      const vulns = data.openVulnCount !== void 0 ? data.openVulnCount : existing.openVulnCount ?? 0;
      updateValues.riskScore = calcRiskScore(crit, exp, vulns);
    }
    const updated = await patchAssetRow(orgId, id, updateValues);
    void recordAuditEvent(ctx, {
      category: "data_write",
      action: "asset.patch",
      entityType: "assetInventory",
      entityId: id,
      outcome: "success"
    });
    return updated;
  }),
  remove: activeOrgProcedure.input(z29.object({ id: z29.number().int().positive() })).mutation(async ({ ctx, input }) => {
    await requireModulePermission(ctx, "asset_inventory", "canDelete");
    const orgId = ctx.organizationId;
    const result = await deleteAsset(orgId, input.id);
    if (!result.found) throw new TRPCError23({ code: "NOT_FOUND" });
    void recordAuditEvent(ctx, {
      category: "data_write",
      action: "asset.remove",
      entityType: "assetInventory",
      entityId: input.id,
      targetEntity: result.name ?? void 0,
      outcome: "success"
    });
    return { success: true };
  }),
  summary: activeOrgProcedure.query(async ({ ctx }) => {
    await requireModulePermission(ctx, "asset_inventory", "canView");
    const assets = await getAllOrgAssets(ctx.organizationId);
    let totalVulns = 0;
    let criticalAssets = 0;
    let internetFacingCount = 0;
    let totalRisk = 0;
    for (const a of assets) {
      totalVulns += a.openVulnCount ?? 0;
      totalRisk += a.riskScore ?? 0;
      if (a.criticality === "critical") criticalAssets++;
      if (a.exposure === "internet_facing") internetFacingCount++;
    }
    const avgRisk = assets.length > 0 ? Math.round(totalRisk / assets.length) : 0;
    return {
      total: assets.length,
      criticalCount: criticalAssets,
      criticalAssets,
      internetFacingCount,
      avgRisk,
      totalOpenVulnerabilities: totalVulns
    };
  })
});

// server/threat-intel-router.ts
import { z as z30 } from "zod";
import { TRPCError as TRPCError24 } from "@trpc/server";

// server/threat-intel-store.ts
init_schema();
init_db();
import { and as and25, desc as desc16, eq as eq31, isNull as isNull4, or as or5 } from "drizzle-orm";
var CATEGORIES = [
  "malware",
  "ransomware",
  "phishing",
  "apt",
  "zero_day",
  "ddos",
  "supply_chain",
  "data_breach",
  "vulnerability",
  "social_engineering",
  "insider_threat",
  "other"
];
var SEVERITIES = ["info", "low", "medium", "high", "critical"];
var TLP_LEVELS = ["white", "green", "amber", "red"];
var MEM_ITEMS = [
  {
    id: 1,
    organizationId: null,
    title: "Active Exploitation of Ivanti Connect Secure VPN (CVE-2025-0282)",
    summary: "State-sponsored threat actors are actively exploiting a stack-based buffer overflow in Ivanti Connect Secure VPN appliances. The vulnerability allows unauthenticated remote code execution and has been used to deploy custom malware implants. Immediate patching and factory reset of affected appliances is recommended.",
    threatActor: "UNC5337 (China-nexus)",
    category: "zero_day",
    severity: "critical",
    tlp: "white",
    affectedSectors: "government,finance,healthcare,energy",
    indicators: "23.95.82.4,185.220.101.47,hxxps://update-ivanti[.]com,/api/v1/license/key-status/..",
    referenceUrl: "https://nvd.nist.gov/vuln/detail/CVE-2025-0282",
    cveId: "CVE-2025-0282",
    cvssScore: "9.0",
    isActive: 1,
    createdByUserId: null,
    publishedAt: /* @__PURE__ */ new Date("2026-01-14"),
    createdAt: /* @__PURE__ */ new Date("2026-01-14"),
    updatedAt: /* @__PURE__ */ new Date("2026-01-14")
  },
  {
    id: 2,
    organizationId: null,
    title: "Black Basta Ransomware Targeting Gulf Region Financial Institutions",
    summary: "Black Basta affiliates have been observed conducting targeted ransomware campaigns against banking and financial services organizations in the Gulf Cooperation Council.",
    threatActor: "Black Basta",
    category: "ransomware",
    severity: "high",
    tlp: "amber",
    affectedSectors: "finance,banking",
    indicators: "cobalt-strike-beacon,ISO file attachments,QakBot dropper",
    referenceUrl: null,
    cveId: null,
    cvssScore: null,
    isActive: 1,
    createdByUserId: null,
    publishedAt: /* @__PURE__ */ new Date("2026-02-03"),
    createdAt: /* @__PURE__ */ new Date("2026-02-03"),
    updatedAt: /* @__PURE__ */ new Date("2026-02-03")
  },
  {
    id: 3,
    organizationId: null,
    title: "Critical RCE in Palo Alto PAN-OS GlobalProtect (CVE-2024-3400)",
    summary: "A command injection vulnerability in the GlobalProtect feature of Palo Alto Networks PAN-OS software allows an unauthenticated attacker to execute arbitrary code on the firewall with root privileges.",
    threatActor: "UTA0218",
    category: "vulnerability",
    severity: "critical",
    tlp: "white",
    affectedSectors: "all",
    indicators: "PAN-OS < 10.2.9-h1,/var/log/pan/sslvpn_ngx_error.log anomalies",
    referenceUrl: "https://security.paloaltonetworks.com/CVE-2024-3400",
    cveId: "CVE-2024-3400",
    cvssScore: "10.0",
    isActive: 1,
    createdByUserId: null,
    publishedAt: /* @__PURE__ */ new Date("2026-03-11"),
    createdAt: /* @__PURE__ */ new Date("2026-03-11"),
    updatedAt: /* @__PURE__ */ new Date("2026-03-11")
  }
];
var memSeq10 = MEM_ITEMS.length + 1;
async function getThreatFeed(orgId, filters) {
  const db = await getDb();
  let items;
  if (!db || orgId < 0) {
    items = MEM_ITEMS.filter((i) => i.isActive === 1);
  } else {
    items = await db.select().from(threatIntelItems).where(
      and25(
        eq31(threatIntelItems.isActive, 1),
        or5(isNull4(threatIntelItems.organizationId), eq31(threatIntelItems.organizationId, orgId))
      )
    ).orderBy(desc16(threatIntelItems.publishedAt)).limit(filters.limit);
  }
  if (filters.severity) items = items.filter((i) => i.severity === filters.severity);
  if (filters.category) items = items.filter((i) => i.category === filters.category);
  return items.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}
async function getThreatItem(orgId, id) {
  const db = await getDb();
  if (!db || orgId < 0) {
    return MEM_ITEMS.find((i) => i.id === id) ?? null;
  }
  const [row] = await db.select().from(threatIntelItems).where(
    and25(
      eq31(threatIntelItems.id, id),
      or5(isNull4(threatIntelItems.organizationId), eq31(threatIntelItems.organizationId, orgId))
    )
  ).limit(1);
  return row ?? null;
}
async function adminCreateThreatItem(input, localUserId) {
  const db = await getDb();
  const now = /* @__PURE__ */ new Date();
  const publishedAt = input.publishedAt ? new Date(input.publishedAt) : now;
  if (!db) {
    const item = {
      id: memSeq10++,
      organizationId: input.organizationId ?? null,
      title: input.title,
      summary: input.summary,
      threatActor: input.threatActor ?? null,
      category: input.category,
      severity: input.severity,
      tlp: input.tlp,
      affectedSectors: input.affectedSectors ?? null,
      indicators: input.indicators ?? null,
      referenceUrl: input.referenceUrl || null,
      cveId: input.cveId ?? null,
      cvssScore: input.cvssScore ?? null,
      isActive: 1,
      createdByUserId: localUserId,
      publishedAt,
      createdAt: now,
      updatedAt: now
    };
    MEM_ITEMS.push(item);
    return item;
  }
  const [inserted] = await db.insert(threatIntelItems).values({
    organizationId: input.organizationId ?? null,
    title: input.title,
    summary: input.summary,
    threatActor: input.threatActor ?? null,
    category: input.category,
    severity: input.severity,
    tlp: input.tlp,
    affectedSectors: input.affectedSectors ?? null,
    indicators: input.indicators ?? null,
    referenceUrl: input.referenceUrl || null,
    cveId: input.cveId ?? null,
    cvssScore: input.cvssScore ?? null,
    createdByUserId: localUserId,
    publishedAt
  }).returning({ id: threatIntelItems.id });
  const insertId = inserted.id;
  const [created] = await db.select().from(threatIntelItems).where(eq31(threatIntelItems.id, insertId)).limit(1);
  return created;
}
async function adminUpdateThreatItem(id, updateValues) {
  const db = await getDb();
  if (!db) {
    const item = MEM_ITEMS.find((i) => i.id === id);
    if (!item) return null;
    Object.assign(item, updateValues);
    return item;
  }
  await db.update(threatIntelItems).set(updateValues).where(eq31(threatIntelItems.id, id));
  const [updated] = await db.select().from(threatIntelItems).where(eq31(threatIntelItems.id, id)).limit(1);
  return updated ?? null;
}
async function adminRemoveThreatItem(id) {
  const db = await getDb();
  if (!db) {
    const item = MEM_ITEMS.find((i) => i.id === id);
    if (!item) return false;
    item.isActive = 0;
    item.updatedAt = /* @__PURE__ */ new Date();
    return true;
  }
  await db.update(threatIntelItems).set({ isActive: 0, updatedAt: /* @__PURE__ */ new Date() }).where(eq31(threatIntelItems.id, id));
  return true;
}

// server/threat-intel-router.ts
var categoryEnum2 = z30.enum(CATEGORIES);
var severityEnum5 = z30.enum(SEVERITIES);
var tlpEnum2 = z30.enum(TLP_LEVELS);
var createSchema9 = z30.object({
  title: z30.string().trim().min(3).max(255),
  summary: z30.string().trim().min(10).max(1e4),
  category: categoryEnum2,
  severity: severityEnum5,
  tlp: tlpEnum2,
  organizationId: z30.number().int().positive().nullable().optional(),
  threatActor: z30.string().trim().max(255).optional(),
  affectedSectors: z30.string().trim().max(1e3).optional(),
  indicators: z30.string().trim().max(5e3).optional(),
  referenceUrl: z30.string().url().optional().or(z30.literal("")),
  cveId: z30.string().trim().max(50).optional(),
  cvssScore: z30.string().trim().max(10).optional(),
  publishedAt: z30.string().optional()
});
var updateSchema = createSchema9.partial().extend({
  isActive: z30.number().int().min(0).max(1).optional()
});
var threatIntelRouter = router({
  feed: activeOrgProcedure.input(z30.object({
    severity: severityEnum5.optional(),
    category: categoryEnum2.optional(),
    limit: z30.number().int().min(1).max(100).default(50)
  })).query(async ({ ctx, input }) => {
    await requireModulePermission(ctx, "pro_intelligence", "canView");
    return getThreatFeed(ctx.organizationId, {
      severity: input.severity,
      category: input.category,
      limit: input.limit
    });
  }),
  get: activeOrgProcedure.input(z30.object({ id: z30.number().int().positive() })).query(async ({ ctx, input }) => {
    await requireModulePermission(ctx, "pro_intelligence", "canView");
    const item = await getThreatItem(ctx.organizationId, input.id);
    if (!item) throw new TRPCError24({ code: "NOT_FOUND" });
    return item;
  }),
  adminCreate: protectedProcedure.input(createSchema9).mutation(async ({ ctx, input }) => {
    if (!hasMinRole(ctx.user?.role, "admin")) throw new TRPCError24({ code: "FORBIDDEN" });
    await requireModulePermissionIfOrgContext(ctx, "pro_intelligence", "canCreate");
    const localUserId = ctx.user?.localUserId ?? null;
    const item = await adminCreateThreatItem(input, localUserId);
    void recordAuditEvent(ctx, {
      category: "data_write",
      action: "threatIntel.adminCreate",
      entityType: "threatIntelItems",
      entityId: item.id,
      targetEntity: input.title,
      outcome: "success"
    });
    return item;
  }),
  adminUpdate: protectedProcedure.input(z30.object({ id: z30.number().int().positive() }).merge(updateSchema)).mutation(async ({ ctx, input }) => {
    if (!hasMinRole(ctx.user?.role, "admin")) throw new TRPCError24({ code: "FORBIDDEN" });
    await requireModulePermissionIfOrgContext(ctx, "pro_intelligence", "canEdit");
    const { id, ...data } = input;
    const updateValues = { ...data, updatedAt: /* @__PURE__ */ new Date() };
    const updated = await adminUpdateThreatItem(id, updateValues);
    if (!updated) throw new TRPCError24({ code: "NOT_FOUND" });
    void recordAuditEvent(ctx, {
      category: "data_write",
      action: "threatIntel.adminUpdate",
      entityType: "threatIntelItems",
      entityId: id,
      outcome: "success",
      payload: data
    });
    return updated;
  }),
  adminRemove: protectedProcedure.input(z30.object({ id: z30.number().int().positive() })).mutation(async ({ ctx, input }) => {
    if (!hasMinRole(ctx.user?.role, "admin")) throw new TRPCError24({ code: "FORBIDDEN" });
    await requireModulePermissionIfOrgContext(ctx, "pro_intelligence", "canDelete");
    const found = await adminRemoveThreatItem(input.id);
    if (!found) throw new TRPCError24({ code: "NOT_FOUND" });
    void recordAuditEvent(ctx, {
      category: "data_write",
      action: "threatIntel.adminRemove",
      entityType: "threatIntelItems",
      entityId: input.id,
      outcome: "success"
    });
    return { success: true };
  })
});

// server/security-maturity-router.ts
import { z as z31 } from "zod";
import { TRPCError as TRPCError25 } from "@trpc/server";

// server/security-maturity-store.ts
init_schema();
init_db();
import { desc as desc17, eq as eq32 } from "drizzle-orm";
var MEM_ASSESSMENTS = [];
var memSeq11 = 1;
function toMaturityLevel(overallScore) {
  if (overallScore >= 90) return "optimized";
  if (overallScore >= 70) return "managed";
  if (overallScore >= 50) return "defined";
  if (overallScore >= 30) return "developing";
  return "initial";
}
function computeOverallScore(domains) {
  const values = Object.values(domains);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  return Math.round((avg - 1) / 4 * 100);
}
async function listAssessments(orgId) {
  const db = await getDb();
  if (!db || orgId < 0) {
    return [...MEM_ASSESSMENTS.filter((a) => a.organizationId === orgId)].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  return db.select().from(securityMaturityAssessments).where(eq32(securityMaturityAssessments.organizationId, orgId)).orderBy(desc17(securityMaturityAssessments.createdAt));
}
async function getLatestAssessment(orgId) {
  const db = await getDb();
  if (!db || orgId < 0) {
    const all = [...MEM_ASSESSMENTS.filter((a) => a.organizationId === orgId)].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return all[0] ?? null;
  }
  const [row] = await db.select().from(securityMaturityAssessments).where(eq32(securityMaturityAssessments.organizationId, orgId)).orderBy(desc17(securityMaturityAssessments.createdAt)).limit(1);
  return row ?? null;
}
async function getAssessment(orgId, id) {
  const db = await getDb();
  if (!db || orgId < 0) {
    return MEM_ASSESSMENTS.find((a) => a.id === id && a.organizationId === orgId) ?? null;
  }
  const [row] = await db.select().from(securityMaturityAssessments).where(eq32(securityMaturityAssessments.id, id)).limit(1);
  if (!row || row.organizationId !== orgId) return null;
  return row;
}
async function createAssessmentRow(orgId, input, localUserId) {
  const db = await getDb();
  const now = /* @__PURE__ */ new Date();
  const domainMap = {
    scoreGovernance: input.scoreGovernance,
    scoreAssetManagement: input.scoreAssetManagement,
    scoreAccessControl: input.scoreAccessControl,
    scoreDataProtection: input.scoreDataProtection,
    scoreNetworkSecurity: input.scoreNetworkSecurity,
    scoreVulnerabilityMgmt: input.scoreVulnerabilityMgmt,
    scoreIncidentResponse: input.scoreIncidentResponse,
    scoreBackupRecovery: input.scoreBackupRecovery,
    scoreThirdPartyRisk: input.scoreThirdPartyRisk,
    scoreSecurityAwareness: input.scoreSecurityAwareness
  };
  const overallScore = computeOverallScore(domainMap);
  const maturityLevel = toMaturityLevel(overallScore);
  if (!db || orgId < 0) {
    const assessment = {
      id: memSeq11++,
      organizationId: orgId,
      title: input.title,
      frameworkRef: input.frameworkRef ?? null,
      ...domainMap,
      overallScore,
      maturityLevel,
      recommendations: input.recommendations ?? null,
      assessedByUserId: localUserId,
      createdAt: now,
      updatedAt: now
    };
    MEM_ASSESSMENTS.push(assessment);
    return assessment;
  }
  const [inserted] = await db.insert(securityMaturityAssessments).values({
    organizationId: orgId,
    title: input.title,
    frameworkRef: input.frameworkRef ?? null,
    ...domainMap,
    overallScore,
    maturityLevel,
    recommendations: input.recommendations ?? null,
    assessedByUserId: localUserId
  }).returning({ id: securityMaturityAssessments.id });
  const insertId = inserted.id;
  const [created] = await db.select().from(securityMaturityAssessments).where(eq32(securityMaturityAssessments.id, insertId)).limit(1);
  return created;
}
async function deleteAssessmentRow(orgId, id) {
  const db = await getDb();
  if (!db || orgId < 0) {
    const idx = MEM_ASSESSMENTS.findIndex((a) => a.id === id && a.organizationId === orgId);
    if (idx === -1) return false;
    MEM_ASSESSMENTS.splice(idx, 1);
    return true;
  }
  const [existing] = await db.select({ id: securityMaturityAssessments.id }).from(securityMaturityAssessments).where(eq32(securityMaturityAssessments.id, id)).limit(1);
  if (!existing) return false;
  await db.delete(securityMaturityAssessments).where(eq32(securityMaturityAssessments.id, id));
  return true;
}

// server/security-maturity-router.ts
var domainScore = z31.number().int().min(1).max(5);
var createSchema10 = z31.object({
  title: z31.string().trim().min(3).max(255),
  frameworkRef: z31.enum(["ISO 27001", "NIST CSF", "CIS Controls", "SOC 2", "SAMA CSF", "NCA ECC", "NESA", "custom"]).optional(),
  scoreGovernance: domainScore,
  scoreAssetManagement: domainScore,
  scoreAccessControl: domainScore,
  scoreDataProtection: domainScore,
  scoreNetworkSecurity: domainScore,
  scoreVulnerabilityMgmt: domainScore,
  scoreIncidentResponse: domainScore,
  scoreBackupRecovery: domainScore,
  scoreThirdPartyRisk: domainScore,
  scoreSecurityAwareness: domainScore,
  recommendations: z31.string().trim().max(5e3).optional()
});
var securityMaturityRouter = router({
  list: activeOrgProcedure.query(async ({ ctx }) => {
    await requireModulePermission(ctx, "security_maturity", "canView");
    return listAssessments(ctx.organizationId);
  }),
  latest: activeOrgProcedure.query(async ({ ctx }) => {
    await requireModulePermission(ctx, "security_maturity", "canView");
    return getLatestAssessment(ctx.organizationId);
  }),
  get: activeOrgProcedure.input(z31.object({ id: z31.number().int().positive() })).query(async ({ ctx, input }) => {
    await requireModulePermission(ctx, "security_maturity", "canView");
    const a = await getAssessment(ctx.organizationId, input.id);
    if (!a) throw new TRPCError25({ code: "NOT_FOUND" });
    return a;
  }),
  create: activeOrgProcedure.input(createSchema10).mutation(async ({ ctx, input }) => {
    await requireModulePermission(ctx, "security_maturity", "canCreate");
    const orgId = ctx.organizationId;
    const localUserId = ctx.user?.localUserId ?? null;
    const result = await createAssessmentRow(orgId, input, localUserId);
    await recordAuditEvent(ctx, {
      category: "data_write",
      action: "security_maturity.create",
      entityType: "securityMaturityAssessments",
      entityId: result.id,
      targetEntity: input.title,
      outcome: "success",
      payload: { overallScore: result.overallScore, maturityLevel: result.maturityLevel }
    });
    return result;
  }),
  delete: activeOrgProcedure.input(z31.object({ id: z31.number().int().positive() })).mutation(async ({ ctx, input }) => {
    await requireModulePermission(ctx, "security_maturity", "canDelete");
    const found = await deleteAssessmentRow(ctx.organizationId, input.id);
    if (!found) throw new TRPCError25({ code: "NOT_FOUND" });
    await recordAuditEvent(ctx, {
      category: "data_write",
      action: "security_maturity.delete",
      entityType: "securityMaturityAssessments",
      entityId: input.id,
      outcome: "success"
    });
    return { success: true };
  })
});

// server/routers.ts
var appRouter = router({
  system: systemRouter,
  ai: aiRouter,
  portal: portalRouter,
  localAuth: localAuthRouter,
  admin: adminRouter,
  billing: billingRouter,
  role: roleRouter,
  rbac: rbacRouter,
  orgMembers: orgMembersRouter,
  orgSettings: orgSettingsRouter,
  scorecard: scorecardRouter,
  apiKeys: apiKeysRouter,
  remediation: remediationRouter,
  riskRegister: riskRegisterRouter,
  policyManager: policyRouter,
  incidentRegister: incidentRouter,
  auditSchedule: auditScheduleRouter,
  vendorCompliance: vendorComplianceRouter,
  complianceReport: complianceReportRouter,
  ctem: ctemRouter,
  evidence: evidenceRouter,
  dsr: dsrRouter,
  complianceChat: complianceChatRouter,
  serviceRequests: serviceRequestRouter,
  assetInventory: assetInventoryRouter,
  threatIntel: threatIntelRouter,
  securityMaturity: securityMaturityRouter,
  deadlines: deadlineRouter,
  auth: authRouter,
  compliance: complianceFrameworkRouter,
  vendor: vendorRouter
});

// server/_core/context.ts
init_env();

// server/services/auth-session.ts
init_schema();
init_db();
init_env();
import crypto3 from "crypto";
import { and as and26, eq as eq33, isNull as isNull5 } from "drizzle-orm";
async function resolveDevBypassUser() {
  const now = /* @__PURE__ */ new Date();
  return {
    id: -1,
    openId: ENV.devAuthOpenId,
    name: ENV.devAuthName,
    email: ENV.devAuthEmail || null,
    loginMethod: "dev-bypass",
    organizationName: null,
    organizationType: null,
    jobTitle: null,
    preferredLocale: "en",
    role: ENV.devAuthRole,
    status: "active",
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
    lastActivityAt: now
  };
}
async function resolveApiKeyAuth(req) {
  const authHeader = req.headers["authorization"];
  if (typeof authHeader !== "string" || !authHeader.startsWith("Bearer djac_"))
    return null;
  const rawKey = authHeader.slice(7);
  if (!rawKey.startsWith("djac_")) return null;
  const keyHash = crypto3.createHash("sha256").update(rawKey).digest("hex");
  const db = await getDb();
  if (!db) return null;
  const now = /* @__PURE__ */ new Date();
  const [keyRow] = await db.select({
    id: apiKeys.id,
    organizationId: apiKeys.organizationId,
    revokedAt: apiKeys.revokedAt,
    expiresAt: apiKeys.expiresAt
  }).from(apiKeys).where(and26(eq33(apiKeys.keyHash, keyHash), isNull5(apiKeys.revokedAt))).limit(1);
  if (!keyRow || keyRow.expiresAt && keyRow.expiresAt <= now) return null;
  db.update(apiKeys).set({ lastUsedAt: now }).where(eq33(apiKeys.id, keyRow.id)).catch(() => {
  });
  const user = {
    id: -(1e4 + keyRow.id),
    openId: `api-key:${keyRow.id}`,
    name: "API Key",
    email: null,
    loginMethod: "api-key",
    organizationName: null,
    organizationType: null,
    jobTitle: null,
    preferredLocale: "en",
    role: "user",
    status: "active",
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
    lastActivityAt: now
  };
  return { user, organizationId: keyRow.organizationId, organizationRole: "admin" };
}
var roleMap = {
  visitor: "user",
  professional: "professional_user",
  basic_user: "basic_user",
  professional_user: "professional_user",
  company_admin: "company_admin",
  platform_admin: "platform_admin",
  yalla_hack_employee: "yalla_hack_employee",
  super_admin: "super_admin",
  admin: "platform_admin"
};
async function resolveLocalAuthUser(req) {
  const localUser = await resolveLocalSession(req);
  if (!localUser) return null;
  const now = /* @__PURE__ */ new Date();
  return {
    id: -(5e4 + localUser.id),
    openId: `local:${localUser.id}`,
    name: localUser.name,
    email: localUser.email,
    loginMethod: "local-auth",
    organizationName: localUser.companyName ?? null,
    organizationType: null,
    jobTitle: localUser.jobTitle ?? null,
    preferredLocale: localUser.preferredLocale,
    role: roleMap[localUser.userType] ?? "user",
    status: "active",
    createdAt: localUser.createdAt,
    updatedAt: localUser.updatedAt,
    lastSignedIn: localUser.lastSignedIn ?? now,
    lastActivityAt: now
  };
}
async function resolveOAuthUser(req) {
  try {
    return await sdk.authenticateRequest(req);
  } catch {
    return null;
  }
}

// server/services/org-context.ts
init_schema();
init_db();
import { and as and27, eq as eq34 } from "drizzle-orm";
async function createDefaultOrganizationForUser(user) {
  if (user.id <= 0) return null;
  const db = await getDb();
  if (!db) return null;
  const now = /* @__PURE__ */ new Date();
  const defaultTrialEndsAt = trialEndsAt(now);
  const orgName = user.organizationName && user.organizationName.trim() ? user.organizationName.trim() : `${(user.name || "New User").trim()} Organization`;
  const safeSlug = `org-${user.id}-${orgName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "default"}`;
  const [inserted] = await db.insert(organizations).values({
    slug: safeSlug,
    name: orgName,
    billingEmail: user.email || `user-${user.id}@example.local`,
    primaryJurisdiction: "Both",
    plan: "free_trial",
    trialStartedAt: now,
    trialEndsAt: defaultTrialEndsAt,
    isActive: 1,
    maxSeats: 5
  }).returning({ id: organizations.id });
  const organizationId = inserted.id;
  await db.insert(organizationMembers).values({
    organizationId,
    userId: user.id,
    role: "owner",
    status: "active"
  });
  return { organizationId, organizationRole: "owner" };
}
async function resolveOrganizationForUser(user) {
  const db = await getDb();
  if (!db) return { organizationId: null, organizationRole: null };
  const [membership] = await db.select({
    organizationId: organizationMembers.organizationId,
    role: organizationMembers.role
  }).from(organizationMembers).where(
    and27(
      eq34(organizationMembers.userId, user.id),
      eq34(organizationMembers.status, "active")
    )
  ).limit(1);
  if (!membership) {
    const seeded = await createDefaultOrganizationForUser(user);
    if (seeded) {
      return {
        organizationId: seeded.organizationId,
        organizationRole: seeded.organizationRole
      };
    }
  }
  return {
    organizationId: membership?.organizationId ?? null,
    organizationRole: membership?.role ?? null
  };
}

// server/_core/context.ts
async function createContext(opts) {
  let user = null;
  let organizationId = null;
  let organizationRole = null;
  if (ENV.devAuthBypass) {
    user = await resolveDevBypassUser();
    organizationId = -1;
    organizationRole = "owner";
  } else {
    user = await resolveOAuthUser(opts.req);
    if (user) {
      const org = await resolveOrganizationForUser(user);
      organizationId = org.organizationId;
      organizationRole = org.organizationRole;
    } else {
      const apiKeyResult = await resolveApiKeyAuth(opts.req);
      if (apiKeyResult) {
        user = apiKeyResult.user;
        organizationId = apiKeyResult.organizationId;
        organizationRole = apiKeyResult.organizationRole;
      }
    }
    if (!user) {
      user = await resolveLocalAuthUser(opts.req);
      if (user) {
        organizationId = -1;
        organizationRole = "owner";
      }
    }
  }
  return {
    req: opts.req,
    res: opts.res,
    user,
    organizationId,
    organizationRole
  };
}

// server/_core/vite.ts
init_env();
import express from "express";
import fs3 from "fs";
import path4 from "path";
var projectRoot = path4.resolve(import.meta.dirname, "../..");
var clientRoot = path4.resolve(projectRoot, "client");
function safeRealpathSync(p) {
  try {
    return fs3.realpathSync.native(p);
  } catch {
    return p;
  }
}
var realProjectRoot = safeRealpathSync(projectRoot);
var realClientRoot = safeRealpathSync(clientRoot);
var moduleRequestPattern = /\.(?:[cm]?[jt]sx?)(?:$|\?)/i;
function getRequestPathname(url) {
  return url.split("?")[0] || url;
}
function isModuleRequest(url) {
  return moduleRequestPattern.test(getRequestPathname(url));
}
function isHtmlNavigationRequest(req) {
  const acceptHeader = req.headers.accept;
  return typeof acceptHeader === "string" && acceptHeader.includes("text/html");
}
function normalizeModuleUrl(url) {
  const [pathname, query] = url.split("?");
  const suffix = query ? `?${query}` : "";
  if (!pathname.startsWith("/@fs/")) {
    return `${pathname}${suffix}`;
  }
  const decodedPath = decodeURIComponent(pathname.slice(5));
  const resolvedPath = path4.resolve(decodedPath);
  let realResolvedPath = resolvedPath;
  try {
    realResolvedPath = fs3.realpathSync.native(resolvedPath);
  } catch {
  }
  const relativeToClient = path4.relative(realClientRoot, realResolvedPath);
  if (!relativeToClient.startsWith("..") && !path4.isAbsolute(relativeToClient)) {
    return `/${relativeToClient.replace(/\\/g, "/")}${suffix}`;
  }
  return `/@fs/${realResolvedPath.replace(/\\/g, "/")}${suffix}`;
}
async function setupVite(app, server) {
  const { createServer: createViteServer } = await import("vite");
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true,
    fs: {
      allow: [projectRoot, realProjectRoot]
    }
  };
  const vite = await createViteServer({
    configFile: path4.resolve(projectRoot, "vite.config.ts"),
    server: serverOptions,
    appType: "custom"
  });
  app.use(async (req, res, next) => {
    const url = req.originalUrl;
    if (!isModuleRequest(url)) {
      next();
      return;
    }
    try {
      const transformed = await vite.transformRequest(normalizeModuleUrl(url));
      if (!transformed) {
        next();
        return;
      }
      if (transformed.etag) {
        res.setHeader("Etag", transformed.etag);
      }
      res.status(200).set({
        "Content-Type": "text/javascript",
        "Cache-Control": "no-cache"
      }).end(transformed.code);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    if (!isHtmlNavigationRequest(req)) {
      next();
      return;
    }
    try {
      const clientTemplate = path4.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );
      const template = await fs3.promises.readFile(clientTemplate, "utf-8");
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app) {
  const distPath = ENV.isDevelopment ? path4.resolve(import.meta.dirname, "../..", "dist", "public") : path4.resolve(import.meta.dirname, "public");
  if (!fs3.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app.use(
    express.static(distPath, {
      setHeaders(res, filePath) {
        const base = path4.basename(filePath);
        const isHashedAsset = /\.[0-9a-f]{8,}\.[^.]+$/i.test(base);
        if (isHashedAsset) {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        } else {
          res.setHeader("Cache-Control", "public, no-cache");
        }
      }
    })
  );
  app.use("*", (_req, res) => {
    res.setHeader("Cache-Control", "public, no-cache");
    res.sendFile(path4.resolve(distPath, "index.html"));
  });
}

// server/ai/ws.ts
init_db();
init_env();
import { parse as parseCookieHeader3 } from "cookie";
import { WebSocketServer } from "ws";
var WS_PATH_DEFAULT = "/ws/ai-jobs";
function sendJson(ws, payload) {
  if (ws.readyState !== 1) return;
  ws.send(JSON.stringify(payload));
}
function parseMessage(raw) {
  try {
    const value = JSON.parse(String(raw));
    if (!value || typeof value !== "object") return null;
    const candidate = value;
    const type = candidate.type;
    if (type === "ping") {
      return { type: "ping" };
    }
    if ((type === "subscribe" || type === "unsubscribe") && typeof candidate.jobId === "string") {
      return {
        type,
        jobId: candidate.jobId.trim()
      };
    }
    return null;
  } catch {
    return null;
  }
}
async function resolveSocketUser(req) {
  if (ENV.devAuthBypass) {
    const now = /* @__PURE__ */ new Date();
    return {
      id: -1,
      openId: ENV.devAuthOpenId,
      name: ENV.devAuthName,
      email: ENV.devAuthEmail || null,
      loginMethod: "dev-bypass",
      organizationName: null,
      organizationType: null,
      jobTitle: null,
      preferredLocale: "en",
      role: ENV.devAuthRole,
      status: "active",
      createdAt: now,
      updatedAt: now,
      lastSignedIn: now,
      lastActivityAt: now
    };
  }
  const cookies = parseCookieHeader3(req.headers.cookie || "");
  const sessionCookie = cookies[COOKIE_NAME];
  const session = await sdk.verifySession(sessionCookie);
  if (!session) {
    return null;
  }
  return await getUserByOpenId(session.openId) ?? null;
}
function shouldPushSnapshot(snapshot, subscription) {
  if (!subscription.isAdmin && snapshot.userId !== subscription.userId) return false;
  if (subscription.jobIds.size === 0) return true;
  return subscription.jobIds.has(snapshot.id);
}
function registerAssessmentWebSocketServer(server) {
  const wsPath = ENV.aiWebsocketPath || WS_PATH_DEFAULT;
  const wsServer = new WebSocketServer({ noServer: true });
  const sockets = /* @__PURE__ */ new Map();
  const unsubscribe = subscribeAssessmentJobSnapshots((snapshot) => {
    for (const [ws, subscription] of Array.from(sockets.entries())) {
      if (!shouldPushSnapshot(snapshot, subscription)) continue;
      sendJson(ws, {
        type: "job_snapshot",
        snapshot
      });
    }
  });
  server.on("upgrade", async (request, socket, head) => {
    const url = new URL(request.url || wsPath, "http://localhost");
    if (url.pathname !== wsPath) {
      return;
    }
    const user = await resolveSocketUser(request);
    if (!user) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }
    wsServer.handleUpgrade(request, socket, head, (ws) => {
      const initialJobId = url.searchParams.get("jobId")?.trim();
      const subscription = {
        userId: user.id,
        isAdmin: hasMinRole(user.role, "admin"),
        jobIds: new Set(initialJobId ? [initialJobId] : [])
      };
      sockets.set(ws, subscription);
      sendJson(ws, {
        type: "connected",
        path: wsPath,
        userId: user.id,
        role: user.role,
        subscribedJobIds: Array.from(subscription.jobIds),
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
      if (initialJobId) {
        void getAssessmentJob(initialJobId).then((snapshot) => {
          if (!snapshot || !subscription.isAdmin && snapshot.userId !== user.id) return;
          sendJson(ws, {
            type: "job_snapshot",
            snapshot
          });
        });
      }
      ws.on("message", (raw) => {
        const msg = parseMessage(raw.toString());
        if (!msg) {
          sendJson(ws, {
            type: "error",
            message: "Invalid websocket message payload."
          });
          return;
        }
        if (msg.type === "ping") {
          sendJson(ws, {
            type: "pong",
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          });
          return;
        }
        if (msg.type === "subscribe") {
          if (!msg.jobId) return;
          subscription.jobIds.add(msg.jobId);
          void getAssessmentJob(msg.jobId).then((snapshot) => {
            if (!snapshot || !subscription.isAdmin && snapshot.userId !== user.id) return;
            sendJson(ws, {
              type: "job_snapshot",
              snapshot
            });
          });
          sendJson(ws, {
            type: "subscribed",
            jobId: msg.jobId,
            subscribedJobIds: Array.from(subscription.jobIds)
          });
          return;
        }
        if (msg.type === "unsubscribe") {
          if (!msg.jobId) return;
          subscription.jobIds.delete(msg.jobId);
          sendJson(ws, {
            type: "unsubscribed",
            jobId: msg.jobId,
            subscribedJobIds: Array.from(subscription.jobIds)
          });
        }
      });
      ws.on("close", () => {
        sockets.delete(ws);
      });
      ws.on("error", () => {
        sockets.delete(ws);
      });
    });
  });
  console.log(`[AI Orchestrator] WebSocket streaming enabled at ${wsPath}`);
  return () => {
    unsubscribe();
    wsServer.close();
  };
}

// server/stripe-webhook.ts
init_env();
init_db();
init_schema();
import { eq as eq35 } from "drizzle-orm";
function mapStripeStatus(s) {
  const valid = ["trialing", "active", "past_due", "canceled", "incomplete", "paused"];
  return valid.includes(s) ? s : "incomplete";
}
function resolvePlanFromPriceId(priceId) {
  const tier = PRICE_CATALOG.find((p) => p.stripePriceId === priceId);
  if (!tier) return null;
  return { plan: tier.plan, interval: tier.interval };
}
function resolveTier(plan, interval) {
  return PRICE_CATALOG.find((tier) => tier.plan === plan && tier.interval === interval) ?? null;
}
async function upsertSubscriptionRecord(db, params) {
  const existing = await db.select({ id: subscriptions.id }).from(subscriptions).where(eq35(subscriptions.stripeSubscriptionId, params.stripeSubscriptionId)).limit(1);
  const payload = {
    organizationId: params.organizationId,
    stripeSubscriptionId: params.stripeSubscriptionId,
    stripePriceId: params.stripePriceId ?? null,
    plan: params.plan,
    billingInterval: params.interval,
    amountCents: params.amountCents,
    currency: (params.currency ?? "USD").toUpperCase(),
    status: params.status,
    currentPeriodStart: params.currentPeriodStart ?? null,
    currentPeriodEnd: params.currentPeriodEnd ?? null,
    cancelAtPeriodEnd: params.cancelAtPeriodEnd ?? 0,
    canceledAt: params.canceledAt ?? null,
    lastInvoiceId: params.lastInvoiceId ?? null,
    stripeMetadata: params.stripeMetadata ?? null
  };
  if (existing.length > 0) {
    await db.update(subscriptions).set(payload).where(eq35(subscriptions.stripeSubscriptionId, params.stripeSubscriptionId));
    return;
  }
  await db.insert(subscriptions).values(payload);
}
async function stripeWebhookHandler(req, res) {
  if (!ENV.stripeWebhookSecret) {
    res.status(400).json({ error: "Webhook secret not configured" });
    return;
  }
  const stripe = await getStripe();
  const sig = req.headers["stripe-signature"];
  if (!sig) {
    res.status(400).json({ error: "Missing Stripe signature" });
    return;
  }
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, ENV.stripeWebhookSecret);
  } catch (err) {
    console.error("[Stripe Webhook] Signature verification failed:", err);
    res.status(400).json({ error: "Invalid signature" });
    return;
  }
  const db = await getDb();
  if (!db) {
    res.json({ received: true });
    return;
  }
  try {
    await processStripeEvent(event, db);
  } catch (err) {
    console.error("[Stripe Webhook] Processing error:", event.type, err);
    res.status(500).json({ error: "Webhook processing failed" });
    return;
  }
  res.json({ received: true });
}
async function processStripeEvent(event, db) {
  const idempotencyGuard = async () => {
    const existing = await db.select({ id: billingEvents.id }).from(billingEvents).where(eq35(billingEvents.stripeEventId, event.id)).limit(1);
    return existing.length > 0;
  };
  if (await idempotencyGuard()) {
    console.log("[Stripe Webhook] Duplicate event ignored:", event.id);
    return;
  }
  switch (event.type) {
    // ── Checkout complete → activate subscription ────────────────────────────
    case "checkout.session.completed": {
      const session = event.data.object;
      const orgId = Number(session.metadata?.organizationId);
      if (!orgId || !session.subscription) break;
      const plan = session.metadata?.plan ?? "starter";
      const interval = session.metadata?.interval ?? "monthly";
      const tier = resolveTier(plan, interval);
      await db.update(organizations).set({ plan, stripeCustomerId: String(session.customer ?? "") }).where(eq35(organizations.id, orgId));
      await upsertSubscriptionRecord(db, {
        organizationId: orgId,
        stripeSubscriptionId: String(session.subscription),
        stripePriceId: session.metadata?.stripePriceId ?? null,
        plan,
        interval,
        amountCents: tier?.amountCents ?? 0,
        currency: session.currency ?? "usd",
        status: "trialing",
        cancelAtPeriodEnd: 0,
        stripeMetadata: JSON.stringify(session.metadata ?? {})
      });
      await db.insert(billingEvents).values({
        organizationId: orgId,
        stripeEventId: event.id,
        eventType: event.type,
        status: "success",
        description: `Checkout completed \u2014 plan: ${plan}/${interval}`,
        rawPayload: JSON.stringify(event.data.object)
      });
      break;
    }
    // ── Invoice paid → subscription active ───────────────────────────────────
    case "invoice.payment_succeeded": {
      const invoice = event.data.object;
      const orgResult = await db.select({ id: organizations.id }).from(organizations).where(eq35(organizations.stripeCustomerId, String(invoice.customer ?? ""))).limit(1);
      const orgId = orgResult[0]?.id;
      if (!orgId) break;
      const subId = invoice.subscription ?? invoice.parent?.subscription_details?.subscription ?? "";
      const priceId = invoice.lines?.data?.[0]?.price?.id ?? "";
      const planInfo = resolvePlanFromPriceId(priceId);
      if (subId && planInfo) {
        const tier = resolveTier(planInfo.plan, planInfo.interval);
        await upsertSubscriptionRecord(db, {
          organizationId: orgId,
          stripeSubscriptionId: subId,
          stripePriceId: priceId,
          plan: planInfo.plan,
          interval: planInfo.interval,
          amountCents: tier?.amountCents ?? invoice.amount_paid ?? 0,
          currency: invoice.currency ?? "usd",
          status: "active",
          currentPeriodStart: invoice.lines?.data?.[0]?.period?.start ? new Date(invoice.lines.data[0].period.start * 1e3) : null,
          currentPeriodEnd: invoice.lines?.data?.[0]?.period?.end ? new Date(invoice.lines.data[0].period.end * 1e3) : null,
          cancelAtPeriodEnd: 0,
          lastInvoiceId: invoice.id,
          stripeMetadata: JSON.stringify(invoice.lines?.data?.[0] ?? {})
        });
      } else if (subId) {
        await db.update(subscriptions).set({ status: "active", lastInvoiceId: invoice.id }).where(eq35(subscriptions.stripeSubscriptionId, subId));
      }
      await db.insert(billingEvents).values({
        organizationId: orgId,
        stripeEventId: event.id,
        eventType: event.type,
        status: "success",
        amountCents: invoice.amount_paid,
        currency: (invoice.currency ?? "usd").toUpperCase(),
        description: "Invoice payment succeeded",
        rawPayload: JSON.stringify(event.data.object)
      });
      break;
    }
    // ── Invoice failed → past_due ─────────────────────────────────────────────
    case "invoice.payment_failed": {
      const invoice = event.data.object;
      const orgResult = await db.select({ id: organizations.id }).from(organizations).where(eq35(organizations.stripeCustomerId, String(invoice.customer ?? ""))).limit(1);
      const orgId = orgResult[0]?.id;
      if (!orgId) break;
      const subIdFailed = invoice.subscription ?? invoice.parent?.subscription_details?.subscription ?? "";
      await db.update(subscriptions).set({ status: "past_due" }).where(eq35(subscriptions.stripeSubscriptionId, subIdFailed));
      await db.insert(billingEvents).values({
        organizationId: orgId,
        stripeEventId: event.id,
        eventType: event.type,
        status: "failed",
        description: "Invoice payment failed",
        rawPayload: JSON.stringify(event.data.object)
      });
      break;
    }
    // ── Subscription updated ──────────────────────────────────────────────────
    case "customer.subscription.updated": {
      const sub = event.data.object;
      const orgResult = await db.select({ id: organizations.id }).from(organizations).where(eq35(organizations.stripeCustomerId, String(sub.customer ?? ""))).limit(1);
      const orgId = orgResult[0]?.id;
      if (!orgId) break;
      const priceId = sub.items?.data?.[0]?.price?.id ?? "";
      const planInfo = resolvePlanFromPriceId(priceId);
      if (planInfo) {
        const tier = resolveTier(planInfo.plan, planInfo.interval);
        await upsertSubscriptionRecord(db, {
          organizationId: orgId,
          stripeSubscriptionId: sub.id,
          stripePriceId: priceId,
          plan: planInfo.plan,
          interval: planInfo.interval,
          amountCents: tier?.amountCents ?? 0,
          currency: sub.currency ?? "usd",
          status: mapStripeStatus(sub.status),
          currentPeriodStart: sub.current_period_start ? new Date(sub.current_period_start * 1e3) : null,
          currentPeriodEnd: sub.current_period_end ? new Date(sub.current_period_end * 1e3) : null,
          cancelAtPeriodEnd: sub.cancel_at_period_end ? 1 : 0,
          stripeMetadata: JSON.stringify(sub.metadata ?? {})
        });
        await db.update(organizations).set({ plan: planInfo.plan }).where(eq35(organizations.id, orgId));
      } else {
        await db.update(subscriptions).set({
          stripePriceId: priceId || null,
          status: mapStripeStatus(sub.status),
          currentPeriodStart: sub.current_period_start ? new Date(sub.current_period_start * 1e3) : null,
          currentPeriodEnd: sub.current_period_end ? new Date(sub.current_period_end * 1e3) : null,
          cancelAtPeriodEnd: sub.cancel_at_period_end ? 1 : 0,
          stripeMetadata: JSON.stringify(sub.metadata ?? {})
        }).where(eq35(subscriptions.stripeSubscriptionId, sub.id));
      }
      await db.insert(billingEvents).values({
        organizationId: orgId,
        stripeEventId: event.id,
        eventType: event.type,
        status: "success",
        description: `Subscription updated to status: ${sub.status}`,
        rawPayload: JSON.stringify(event.data.object)
      });
      break;
    }
    // ── Subscription cancelled ────────────────────────────────────────────────
    case "customer.subscription.deleted": {
      const sub = event.data.object;
      const orgResult = await db.select({ id: organizations.id }).from(organizations).where(eq35(organizations.stripeCustomerId, String(sub.customer ?? ""))).limit(1);
      const orgId = orgResult[0]?.id;
      if (!orgId) break;
      await db.update(subscriptions).set({
        status: "canceled",
        cancelAtPeriodEnd: 0,
        canceledAt: sub.canceled_at ? new Date(sub.canceled_at * 1e3) : /* @__PURE__ */ new Date()
      }).where(eq35(subscriptions.stripeSubscriptionId, sub.id));
      await db.insert(billingEvents).values({
        organizationId: orgId,
        stripeEventId: event.id,
        eventType: event.type,
        status: "success",
        description: "Subscription cancelled",
        rawPayload: JSON.stringify(event.data.object)
      });
      break;
    }
    default:
      break;
  }
}

// server/interaction-retention.ts
init_env();
var HOUR_MS = 60 * 60 * 1e3;
function startInteractionRetentionScheduler() {
  if (!ENV.interactionRetentionAutoRun) {
    console.log("[InteractionRetention] Auto-run disabled.");
    return () => void 0;
  }
  const intervalMs = ENV.interactionRetentionIntervalHours * HOUR_MS;
  let running = false;
  const run = async () => {
    if (running) {
      console.warn("[InteractionRetention] Previous run still active; skipping this cycle.");
      return;
    }
    running = true;
    try {
      const result = await enforceInteractionRetention(ENV.interactionRetentionDays, false);
      console.log(
        `[InteractionRetention] Completed. Deleted ${result.deletedLogs} logs older than ${result.retentionDays} days.`
      );
    } catch (error) {
      console.warn("[InteractionRetention] Scheduler run failed:", error);
    } finally {
      running = false;
    }
  };
  void run();
  const timer = setInterval(() => {
    void run();
  }, intervalMs);
  console.log(
    `[InteractionRetention] Scheduler started. Every ${ENV.interactionRetentionIntervalHours}h, retention=${ENV.interactionRetentionDays}d.`
  );
  return () => {
    clearInterval(timer);
  };
}

// server/trial-reminder-scheduler.ts
init_schema();
init_db();
import { eq as eq36 } from "drizzle-orm";
init_env();
var INTERVAL_MS = 6 * 60 * 60 * 1e3;
var DAY_MS = 24 * 60 * 60 * 1e3;
var sentSet = /* @__PURE__ */ new Set();
function daysUntilExpiry(trialEndsAt2) {
  return (trialEndsAt2.getTime() - Date.now()) / DAY_MS;
}
function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c);
}
function buildEmailHtml(orgName, milestone, pricingUrl) {
  const safeOrg = escapeHtml(orgName);
  if (milestone === "expired") {
    return `
<p>Dear ${safeOrg} team,</p>
<p>Your <strong>7-day free trial of DJAC</strong> has now expired.</p>
<p>To continue using DJAC's dual-jurisdiction compliance intelligence platform, please choose a plan:</p>
<p><a href="${pricingUrl}" style="background:#0284c7;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:bold;">View Plans & Upgrade</a></p>
<p>Your data is safely retained for 30 days while your account is inactive.</p>
<p>\u2014 The DJAC / Yalla Hack Team</p>`;
  }
  const dayLabel = milestone === "3d" ? "3 days" : "1 day";
  const urgencyNote = milestone === "1d" ? "<p><strong>This is your final reminder before your trial expires tomorrow.</strong></p>" : "";
  return `
<p>Dear ${safeOrg} team,</p>
<p>Your <strong>7-day free trial of DJAC</strong> expires in <strong>${dayLabel}</strong>.</p>
${urgencyNote}
<p>Upgrade now to keep uninterrupted access to:</p>
<ul>
  <li>AI-powered compliance assessments (PIPL, CSL, DSL, PDPL, NCA)</li>
  <li>Vendor risk analysis and dual-jurisdiction reporting</li>
  <li>Regulatory deadline calendar and audit trail</li>
</ul>
<p><a href="${pricingUrl}" style="background:#0284c7;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:bold;">Upgrade My Plan</a></p>
<p>\u2014 The DJAC / Yalla Hack Team</p>`;
}
function buildEmailText(orgName, milestone, pricingUrl) {
  if (milestone === "expired") {
    return `Dear ${orgName} team,

Your 7-day free trial of DJAC has expired.

Upgrade at: ${pricingUrl}

Your data is retained for 30 days.

\u2014 The DJAC / Yalla Hack Team`;
  }
  const dayLabel = milestone === "3d" ? "3 days" : "1 day";
  return `Dear ${orgName} team,

Your DJAC trial expires in ${dayLabel}.

Upgrade at: ${pricingUrl}

\u2014 The DJAC / Yalla Hack Team`;
}
function buildSubject(milestone) {
  if (milestone === "expired") return "Your DJAC free trial has expired";
  if (milestone === "1d") return "DJAC: Your free trial expires tomorrow";
  return "DJAC: 3 days left in your free trial";
}
async function runReminderCheck() {
  const db = await getDb();
  if (!db) return;
  const trialOrgs = await db.select({
    id: organizations.id,
    name: organizations.name,
    billingEmail: organizations.billingEmail,
    trialEndsAt: organizations.trialEndsAt
  }).from(organizations).where(eq36(organizations.plan, "free_trial"));
  if (trialOrgs.length === 0) return;
  const pricingUrl = `${ENV.appUrl}/pricing`;
  let sent = 0;
  for (const org of trialOrgs) {
    if (!org.trialEndsAt || !org.billingEmail) continue;
    const daysLeft = daysUntilExpiry(org.trialEndsAt);
    let milestone = null;
    if (daysLeft <= 0) {
      milestone = "expired";
    } else if (daysLeft <= 1.5) {
      milestone = "1d";
    } else if (daysLeft <= 3.5) {
      milestone = "3d";
    }
    if (!milestone) continue;
    const dedupKey = `${org.id}:${milestone}`;
    if (sentSet.has(dedupKey)) continue;
    await sendEmail({
      to: org.billingEmail,
      subject: buildSubject(milestone),
      html: buildEmailHtml(org.name, milestone, pricingUrl),
      text: buildEmailText(org.name, milestone, pricingUrl)
    });
    sentSet.add(dedupKey);
    sent++;
  }
  if (sent > 0) {
    console.log(`[TrialReminder] Sent ${sent} reminder email(s).`);
  }
}
function startTrialReminderScheduler() {
  let running = false;
  const run = async () => {
    if (running) return;
    running = true;
    try {
      await runReminderCheck();
    } catch (err) {
      console.warn("[TrialReminder] Scheduler run failed:", err);
    } finally {
      running = false;
    }
  };
  void run();
  const timer = setInterval(() => void run(), INTERVAL_MS);
  console.log("[TrialReminder] Scheduler started. Interval: 6h.");
  return () => clearInterval(timer);
}

// server/deadline-alert-scheduler.ts
init_schema();
init_db();
import { and as and28, eq as eq37, lte, gte as gte2, inArray as inArray7 } from "drizzle-orm";
init_env();
var INTERVAL_MS2 = 2 * 60 * 60 * 1e3;
var DAY_MS2 = 24 * 60 * 60 * 1e3;
var sentSet2 = /* @__PURE__ */ new Set();
function daysUntil(deadlineDate) {
  return (deadlineDate.getTime() - Date.now()) / DAY_MS2;
}
function getMilestone(daysLeft) {
  if (daysLeft < 0) return null;
  if (daysLeft <= 1.5) return "1d";
  if (daysLeft <= 7.5) return "7d";
  if (daysLeft <= 30.5) return "30d";
  return null;
}
function buildSubject2(milestone, deadlineTitle) {
  if (milestone === "1d") return `DJAC: URGENT \u2014 "${deadlineTitle}" deadline is tomorrow`;
  if (milestone === "7d") return `DJAC: "${deadlineTitle}" deadline in 7 days`;
  return `DJAC: "${deadlineTitle}" deadline in 30 days`;
}
function buildEmailHtml2(recipientName, milestone, deadline, calendarUrl) {
  const dayLabel = milestone === "1d" ? "tomorrow" : milestone === "7d" ? "7 days" : "30 days";
  const urgencyStyle = milestone === "1d" ? "background:#7f1d1d;border-left:4px solid #ef4444;" : milestone === "7d" ? "background:#78350f;border-left:4px solid #f59e0b;" : "background:#1e3a5f;border-left:4px solid #3b82f6;";
  return `
<p>Dear ${recipientName},</p>
<div style="${urgencyStyle}padding:12px 16px;border-radius:6px;margin:16px 0;">
  <strong style="font-size:15px;">${deadline.title}</strong><br/>
  <span style="font-size:12px;opacity:0.8;">${deadline.frameworkCode} \xB7 ${deadline.jurisdiction}</span>
</div>
<p>This compliance deadline is due in <strong>${dayLabel}</strong>.</p>
${deadline.description ? `<p style="font-size:13px;opacity:0.8;">${deadline.description}</p>` : ""}
<p>Open the DJAC compliance calendar to view details and mark it as complete:</p>
<p><a href="${calendarUrl}" style="background:#0284c7;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:bold;">View Compliance Calendar</a></p>
<p>\u2014 The DJAC / Yalla Hack Team</p>`;
}
function buildEmailText2(recipientName, milestone, deadline, calendarUrl) {
  const dayLabel = milestone === "1d" ? "tomorrow" : milestone === "7d" ? "7 days" : "30 days";
  return `Dear ${recipientName},

Compliance deadline due in ${dayLabel}:
${deadline.title} (${deadline.frameworkCode} \xB7 ${deadline.jurisdiction})

View calendar: ${calendarUrl}

\u2014 The DJAC / Yalla Hack Team`;
}
async function runAlertCheck() {
  const db = await getDb();
  if (!db) return;
  const now = /* @__PURE__ */ new Date();
  const horizon = new Date(now.getTime() + 31 * DAY_MS2);
  const upcoming = await db.select().from(complianceDeadlines).where(
    and28(
      eq37(complianceDeadlines.status, "upcoming"),
      gte2(complianceDeadlines.deadlineDate, now),
      lte(complianceDeadlines.deadlineDate, horizon)
    )
  );
  if (upcoming.length === 0) return;
  const calendarUrl = `${ENV.appUrl}/compliance-calendar`;
  let sent = 0;
  const globalDeadlines = upcoming.filter((d2) => d2.organizationId == null);
  const orgDeadlines = upcoming.filter((d2) => d2.organizationId != null);
  if (globalDeadlines.length > 0) {
    const activeOrgs = await db.select({ id: organizations.id, name: organizations.name, billingEmail: organizations.billingEmail }).from(organizations).where(inArray7(organizations.plan, ["free_trial", "professional", "enterprise", "starter"]));
    for (const deadline of globalDeadlines) {
      const daysLeft = daysUntil(deadline.deadlineDate);
      const milestone = getMilestone(daysLeft);
      if (!milestone) continue;
      for (const org of activeOrgs) {
        if (!org.billingEmail) continue;
        const dedupKey = `${deadline.id}:${org.id}:${milestone}`;
        if (sentSet2.has(dedupKey)) continue;
        await sendEmail({
          to: org.billingEmail,
          subject: buildSubject2(milestone, deadline.title),
          html: buildEmailHtml2(org.name, milestone, deadline, calendarUrl),
          text: buildEmailText2(org.name, milestone, deadline, calendarUrl)
        });
        sentSet2.add(dedupKey);
        sent++;
      }
    }
  }
  for (const deadline of orgDeadlines) {
    const daysLeft = daysUntil(deadline.deadlineDate);
    const milestone = getMilestone(daysLeft);
    if (!milestone) continue;
    const dedupKey = `${deadline.id}:${milestone}`;
    if (sentSet2.has(dedupKey)) continue;
    const members = await db.select({ email: users.email, name: users.name }).from(organizationMembers).innerJoin(users, eq37(organizationMembers.userId, users.id)).where(
      and28(
        eq37(organizationMembers.organizationId, deadline.organizationId),
        eq37(organizationMembers.status, "active"),
        inArray7(organizationMembers.role, ["owner", "admin", "compliance_officer"])
      )
    );
    const invitedEmails = await db.select({ inviteEmail: organizationMembers.inviteEmail }).from(organizationMembers).where(
      and28(
        eq37(organizationMembers.organizationId, deadline.organizationId),
        eq37(organizationMembers.status, "invited"),
        inArray7(organizationMembers.role, ["owner", "admin", "compliance_officer"])
      )
    );
    const allEmails = [
      ...members.filter((m) => m.email).map((m) => ({ email: m.email, name: m.name ?? "Team" })),
      ...invitedEmails.filter((m) => m.inviteEmail).map((m) => ({ email: m.inviteEmail, name: "Team" }))
    ];
    for (const recipient of allEmails) {
      await sendEmail({
        to: recipient.email,
        subject: buildSubject2(milestone, deadline.title),
        html: buildEmailHtml2(recipient.name, milestone, deadline, calendarUrl),
        text: buildEmailText2(recipient.name, milestone, deadline, calendarUrl)
      });
      sent++;
    }
    sentSet2.add(dedupKey);
  }
  if (sent > 0) {
    console.log(`[DeadlineAlert] Sent ${sent} alert email(s).`);
  }
}
function startDeadlineAlertScheduler() {
  let running = false;
  const run = async () => {
    if (running) return;
    running = true;
    try {
      await runAlertCheck();
    } catch (err) {
      console.warn("[DeadlineAlert] Scheduler run failed:", err);
    } finally {
      running = false;
    }
  };
  void run();
  const timer = setInterval(() => void run(), INTERVAL_MS2);
  console.log("[DeadlineAlert] Scheduler started. Interval: 2h.");
  return () => clearInterval(timer);
}

// server/report-scheduler.ts
init_schema();
init_db();
import { eq as eq38 } from "drizzle-orm";
init_env();
var INTERVAL_MS3 = 6 * 60 * 60 * 1e3;
var sentSet3 = /* @__PURE__ */ new Set();
function isoWeekKey(d2) {
  const jan4 = new Date(d2.getFullYear(), 0, 4);
  const weekNum = Math.ceil(((d2.getTime() - jan4.getTime()) / 864e5 + jan4.getDay() + 1) / 7);
  return `${d2.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}
function monthKey(d2) {
  return `${d2.getFullYear()}-${String(d2.getMonth() + 1).padStart(2, "0")}`;
}
function mapJurisdiction(raw) {
  if (!raw) return "both";
  const lower = raw.toLowerCase();
  if (lower.includes("saudi") || lower.includes("ksa")) return "Saudi Arabia";
  if (lower.includes("china") || lower.includes("cn")) return "China";
  return "both";
}
async function runScheduledReports() {
  const now = /* @__PURE__ */ new Date();
  const dayOfWeek = now.getUTCDay();
  const dayOfMonth = now.getUTCDate();
  const hourUtc = now.getUTCHours();
  const isWeeklyTrigger = dayOfWeek === 1 && hourUtc >= 7;
  const isMonthlyTrigger = dayOfMonth === 1 && hourUtc >= 7;
  if (!isWeeklyTrigger && !isMonthlyTrigger) return;
  const db = await getDb();
  if (!db) return;
  const activeOrgs = await db.select({
    id: organizations.id,
    name: organizations.name,
    billingEmail: organizations.billingEmail,
    primaryJurisdiction: organizations.primaryJurisdiction
  }).from(organizations).where(eq38(organizations.isActive, 1));
  for (const org of activeOrgs) {
    if (!org.billingEmail) continue;
    const jurisdiction = mapJurisdiction(org.primaryJurisdiction);
    const locale = "en";
    if (isWeeklyTrigger) {
      const key = `weekly:${org.id}:${isoWeekKey(now)}`;
      if (!sentSet3.has(key)) {
        sentSet3.add(key);
        void sendOrgReport(org.id, org.name, org.billingEmail, jurisdiction, locale, "weekly");
      }
    }
    if (isMonthlyTrigger) {
      const key = `monthly:${org.id}:${monthKey(now)}`;
      if (!sentSet3.has(key)) {
        sentSet3.add(key);
        void sendOrgReport(org.id, org.name, org.billingEmail, jurisdiction, locale, "monthly");
      }
    }
  }
}
async function sendOrgReport(orgId, orgName, email, jurisdiction, locale, cadence) {
  try {
    const label = cadence === "weekly" ? "Weekly" : "Monthly";
    await emailComplianceReport({
      jurisdiction,
      locale,
      reportType: "full_compliance",
      recipientEmail: email
    });
    if (ENV.isDevelopment) {
      console.log(`[report-scheduler] ${label} report sent to ${email} for org ${orgId} (${orgName})`);
    }
  } catch (err) {
    console.error(`[report-scheduler] failed to send ${cadence} report for org ${orgId}:`, err);
  }
}
var timerId = null;
function startReportScheduler() {
  if (timerId) return () => {
  };
  void runScheduledReports();
  timerId = setInterval(() => void runScheduledReports(), INTERVAL_MS3);
  return () => {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
  };
}

// server/_core/index.ts
init_env();
init_config_schema();
init_db();
import { nanoid as nanoid2 } from "nanoid";

// server/_core/rateLimiter.ts
init_env();
import Redis from "ioredis";
var _redis = null;
var _redisInitialised = false;
function getRedis() {
  if (_redisInitialised) return _redis;
  _redisInitialised = true;
  const url = ENV.redisUrl.trim();
  if (!url) return null;
  try {
    _redis = new Redis(url, {
      lazyConnect: false,
      // Don't let offline-queue pile up; fail immediately on transient errors.
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
      commandTimeout: 500
    });
    _redis.on("error", (err) => {
      if (err.code !== "ECONNREFUSED") {
        console.warn("[RateLimiter] Redis error:", err.message);
      }
    });
    return _redis;
  } catch {
    return null;
  }
}
var _memStore = /* @__PURE__ */ new Map();
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of _memStore) {
    if (now > entry.resetAt) _memStore.delete(key);
  }
}, 5 * 6e4).unref();
async function checkRateLimit(key, limit, windowMs) {
  const windowIndex = Math.floor(Date.now() / windowMs);
  const windowResetMs = (windowIndex + 1) * windowMs;
  const resetAt = Math.ceil(windowResetMs / 1e3);
  const redis = getRedis();
  if (redis) {
    try {
      const redisKey = `rl:${windowIndex}:${key}`;
      const count = await redis.incr(redisKey);
      if (count === 1) {
        const ttlMs = windowResetMs - Date.now();
        await redis.pexpire(redisKey, Math.max(ttlMs, 1));
      }
      return {
        allowed: count <= limit,
        remaining: Math.max(0, limit - count),
        resetAt,
        limit
      };
    } catch {
    }
  }
  const now = Date.now();
  const existing = _memStore.get(key);
  if (!existing || now > existing.resetAt) {
    _memStore.set(key, { count: 1, resetAt: windowResetMs });
    return { allowed: true, remaining: limit - 1, resetAt, limit };
  }
  existing.count += 1;
  return {
    allowed: existing.count <= limit,
    remaining: Math.max(0, limit - existing.count),
    resetAt: Math.ceil(existing.resetAt / 1e3),
    limit
  };
}
async function closeRateLimiter() {
  if (_redis) {
    await _redis.quit();
    _redis = null;
  }
}

// server/_core/security.ts
var NO_INDEX_PATH_PREFIXES = [
  "/api/",
  "/dashboard",
  "/vendor-assessment",
  "/vendor-risk",
  "/market-entry",
  "/client-workspace",
  "/admin-control-center",
  "/operations",
  "/laws",
  "/compliance-tracker",
  "/report-center",
  "/billing",
  "/compliance-calendar",
  "/onboarding-wizard",
  "/saas-metrics",
  "/heatmap",
  "/notifications",
  "/company/dashboard",
  "/superadmin/dashboard",
  "/pro-intelligence",
  "/account-settings",
  "/team-members",
  "/org-settings",
  "/invite-accept",
  "/audit-log",
  "/compliance-scorecard",
  "/api-keys",
  "/gap-tracker",
  "/assessment-history",
  "/vendor/",
  "/remediation-planner",
  "/risk-register",
  "/policy-manager",
  "/incident-register",
  "/audit-schedule",
  "/vendor-compliance",
  "/compliance-reports",
  "/continuous-compliance",
  "/evidence-locker",
  "/dsr-tracker",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password"
];
function normalizePath(pathname) {
  const [withoutQuery] = pathname.split(/[?#]/, 1);
  const normalized = withoutQuery.trim().toLowerCase();
  return normalized || "/";
}
function shouldBypassApiRateLimit(pathname) {
  const normalized = normalizePath(pathname);
  return normalized === "/api/health" || normalized === "/api/healthz" || normalized === "/api/readiness" || normalized === "/api/readyz" || normalized === "/health" || normalized === "/healthz" || normalized === "/readiness" || normalized === "/readyz";
}
function shouldNoIndex(pathname) {
  const normalized = normalizePath(pathname);
  return NO_INDEX_PATH_PREFIXES.some((prefix) => normalized === prefix || normalized.startsWith(prefix));
}
function shouldDisableCaching(pathname) {
  const normalized = normalizePath(pathname);
  return normalized.startsWith("/api/") || shouldNoIndex(normalized);
}
function getSecurityHeadersForRequest({ pathname, isHttps }) {
  const normalized = normalizePath(pathname);
  const cspParts = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    // 'unsafe-inline' is retained for Vite HMR/inline styles in dev;
    // production builds should move toward nonce-based CSP in a future pass.
    "script-src 'self' 'unsafe-inline' https://js.stripe.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' wss: https://api.stripe.com https://js.stripe.com https://sentry.io https://*.sentry.io",
    "frame-src https://js.stripe.com https://hooks.stripe.com",
    "form-action 'self'",
    "frame-ancestors 'none'",
    // Report CSP violations to our own endpoint for observability.
    "report-uri /api/csp-report"
  ];
  if (isHttps) {
    cspParts.push("upgrade-insecure-requests");
  }
  const headers = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), browsing-topics=()",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-origin",
    "Origin-Agent-Cluster": "?1",
    // Omitting Timing-Allow-Origin is the correct way to block cross-origin
    // pages from reading Resource Timing data (header absent = no access).
    // Do NOT set it to "'none'" — that is a malformed value that browsers
    // may handle inconsistently.
    "Content-Security-Policy": cspParts.join("; ")
  };
  if (shouldNoIndex(normalized)) {
    headers["X-Robots-Tag"] = "noindex, nofollow, noarchive, nosnippet";
  }
  if (shouldDisableCaching(normalized)) {
    headers["Cache-Control"] = "no-store, no-cache, must-revalidate, private";
    headers.Pragma = "no-cache";
    headers.Expires = "0";
  }
  if (isHttps) {
    headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload";
  }
  return headers;
}
function getClientIp3(req) {
  const cfConnectingIp = req.headers["cf-connecting-ip"];
  if (typeof cfConnectingIp === "string" && cfConnectingIp.trim()) {
    return cfConnectingIp.trim();
  }
  const realIp = req.headers["x-real-ip"];
  if (typeof realIp === "string" && realIp.trim()) {
    return realIp.trim();
  }
  const forwardedFor = req.headers["x-forwarded-for"];
  const forwardedValue = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
  if (forwardedValue && typeof forwardedValue === "string") {
    return forwardedValue.split(",")[0].trim();
  }
  return req.ip || req.socket.remoteAddress || "unknown";
}

// server/_core/yalla-admin-router.ts
init_db();
import express2 from "express";
import { createHash as createHash4, createHmac, timingSafeEqual } from "node:crypto";
import bcrypt2 from "bcryptjs";
import { SignJWT as SignJWT3, jwtVerify as jwtVerify3 } from "jose";
import { nanoid } from "nanoid";
import { parse as parseCookieHeader4 } from "cookie";
init_env();
import { sql as sql2 } from "drizzle-orm";
var ADMIN_SECRET = ENV.yallaAdminSecret;
var ADMIN_USERNAME = ENV.yallaAdminUsername;
var ADMIN_PASSWORD_HASH = ENV.yallaAdminPasswordHash;
var IP_ALLOWLIST_RAW = ENV.yallaAdminIpAllowlist;
var SESSION_TTL_H = ENV.yallaAdminSessionTtlHours;
var COOKIE_NAME2 = "yalla_admin_session";
var GATE_COOKIE_NAME = "yalla_admin_gate";
var ADMIN_API_PATH = "/api/yalla-admin";
var ADMIN_JWT_SECRET = new TextEncoder().encode(
  ENV.yallaAdminJwtSecret || ENV.cookieSecret || "yalla-admin-dev-secret-not-for-prod-change-me"
);
var IP_ALLOWLIST = IP_ALLOWLIST_RAW ? IP_ALLOWLIST_RAW.split(",").map((s) => s.trim()).filter(Boolean) : [];
var GATE_COOKIE_VALUE = ADMIN_SECRET ? createHash4("sha256").update(`yalla-admin-gate:${ADMIN_SECRET}`).digest("hex") : "";
var loginAttempts = /* @__PURE__ */ new Map();
var MAX_ATTEMPTS = 5;
var LOCKOUT_MS = 15 * 60 * 1e3;
var usedOwnerLinkNonces = /* @__PURE__ */ new Map();
var endpointRateMap = /* @__PURE__ */ new Map();
var ENDPOINT_WINDOW_MS = 5 * 60 * 1e3;
var ENDPOINT_RATE_MAX = 300;
function getClientIp4(req) {
  const hdr = req.headers["x-forwarded-for"];
  if (typeof hdr === "string") {
    const parts = hdr.split(",");
    return parts[parts.length - 1].trim();
  }
  if (Array.isArray(hdr)) return hdr[hdr.length - 1].trim();
  return req.socket.remoteAddress ?? "unknown";
}
function hashOwnerLinkNonce(nonce) {
  return createHash4("sha256").update(`yalla-admin-link:${nonce}`).digest("hex");
}
async function signSession(sessionId, username) {
  return new SignJWT3({ sub: username, sid: sessionId }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime(`${SESSION_TTL_H}h`).sign(ADMIN_JWT_SECRET);
}
async function verifySession(token) {
  try {
    const { payload } = await jwtVerify3(token, ADMIN_JWT_SECRET);
    return { username: payload.sub, sessionId: payload.sid };
  } catch {
    return null;
  }
}
function cookieOptions2(req) {
  const isHttps = req.secure || req.headers["x-forwarded-proto"]?.split(",")[0]?.trim() === "https";
  return {
    httpOnly: true,
    secure: isHttps,
    sameSite: "strict",
    maxAge: SESSION_TTL_H * 3600 * 1e3,
    path: ADMIN_API_PATH
  };
}
async function auditLog(sessionId, adminUsername, action, ip, target, payload) {
  try {
    const db = await getDb();
    if (!db) return;
    const payloadStr = payload ? JSON.stringify(payload) : null;
    await db.execute(sql2`
            INSERT INTO yallaAdminAuditLogs (sessionId, adminUsername, action, target, ipAddress, payload)
            VALUES (${sessionId}, ${adminUsername}, ${action}, ${target ?? null}, ${ip}, ${payloadStr ? sql2`CAST(${payloadStr} AS JSON)` : null})
        `);
  } catch {
  }
}
function getAdminCookie(req) {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return void 0;
  const parsed = parseCookieHeader4(cookieHeader);
  return parsed[COOKIE_NAME2];
}
function getGateCookie(req) {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return void 0;
  const parsed = parseCookieHeader4(cookieHeader);
  return parsed[GATE_COOKIE_NAME];
}
function getAccessToken(req) {
  const fromQuery = typeof req.query.access_token === "string" ? req.query.access_token.trim() : "";
  const fromBody = typeof req.body?.accessToken === "string" ? req.body.accessToken.trim() : "";
  const fromHeader = typeof req.headers["x-yalla-admin-access-token"] === "string" ? req.headers["x-yalla-admin-access-token"].trim() : "";
  return fromQuery || fromBody || fromHeader;
}
function getSignedAccessExpiry(req) {
  const raw = typeof req.query.expires === "string" ? req.query.expires.trim() : typeof req.body?.expires === "string" ? req.body.expires.trim() : typeof req.body?.expires === "number" ? String(req.body.expires) : "";
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.floor(parsed);
}
function getSignedAccessSignature(req) {
  const fromQuery = typeof req.query.sig === "string" ? req.query.sig.trim() : "";
  const fromBody = typeof req.body?.sig === "string" ? req.body.sig.trim() : "";
  return fromQuery || fromBody;
}
function getSignedAccessNonce(req) {
  const fromQuery = typeof req.query.nonce === "string" ? req.query.nonce.trim() : "";
  const fromBody = typeof req.body?.nonce === "string" ? req.body.nonce.trim() : "";
  return (fromQuery || fromBody).slice(0, 128);
}
function resolveRedirectTarget(req) {
  const raw = typeof req.query.redirect === "string" ? req.query.redirect.trim() : typeof req.body?.redirect === "string" ? req.body.redirect.trim() : "";
  if (!raw) return "/yalla-hack-owners-console/login";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/yalla-hack-owners-console/login";
  return raw;
}
function createSignedAccessSignature(redirectTarget, expiresAt, nonce = "") {
  return createHmac("sha256", ADMIN_SECRET).update(`${redirectTarget}:${expiresAt}:${nonce}`).digest("hex");
}
function cleanupUsedOwnerLinkNonces(nowSeconds = Math.floor(Date.now() / 1e3)) {
  for (const [nonce, expiresAt] of usedOwnerLinkNonces) {
    if (expiresAt < nowSeconds) {
      usedOwnerLinkNonces.delete(nonce);
    }
  }
}
function hasUsedOwnerLinkNonceInMemory(nonce) {
  cleanupUsedOwnerLinkNonces();
  if (!nonce) return false;
  return usedOwnerLinkNonces.has(nonce);
}
function consumeOwnerLinkNonceInMemory(nonce, expiresAt) {
  if (!nonce) return;
  cleanupUsedOwnerLinkNonces();
  usedOwnerLinkNonces.set(nonce, expiresAt);
}
async function hasUsedOwnerLinkNonce(nonce) {
  if (!nonce) return false;
  const db = await getDb();
  if (!db) {
    return hasUsedOwnerLinkNonceInMemory(nonce);
  }
  try {
    const nonceHash = hashOwnerLinkNonce(nonce);
    const linkResult = await db.execute(sql2`
            SELECT id FROM yallaAdminAccessLinkNonces
            WHERE nonceHash = ${nonceHash}
            LIMIT 1
        `);
    const rows = linkResult.rows;
    return Array.isArray(rows) && rows.length > 0;
  } catch {
    return hasUsedOwnerLinkNonceInMemory(nonce);
  }
}
async function consumeOwnerLinkNonce(req, nonce, expiresAt, redirectTarget) {
  if (!nonce) return;
  const db = await getDb();
  if (!db) {
    consumeOwnerLinkNonceInMemory(nonce, expiresAt);
    return;
  }
  try {
    const nonceHash = hashOwnerLinkNonce(nonce);
    await db.execute(sql2`
            INSERT INTO yallaAdminAccessLinkNonces (nonceHash, redirectTarget, expiresAt, consumedByIp)
            VALUES (${nonceHash}, ${redirectTarget}, FROM_UNIXTIME(${expiresAt}), ${getClientIp4(req)})
        `);
  } catch {
    consumeOwnerLinkNonceInMemory(nonce, expiresAt);
  }
}
async function isValidSignedOwnerLink(req) {
  if (!ADMIN_SECRET) return false;
  const expiresAt = getSignedAccessExpiry(req);
  const providedSignature = getSignedAccessSignature(req);
  const nonce = getSignedAccessNonce(req);
  if (!expiresAt || !providedSignature) return false;
  if (expiresAt < Math.floor(Date.now() / 1e3)) return false;
  if (nonce && await hasUsedOwnerLinkNonce(nonce)) return false;
  const redirectTarget = resolveRedirectTarget(req);
  const expectedSignature = createSignedAccessSignature(redirectTarget, expiresAt, nonce);
  const providedBuffer = Buffer.from(providedSignature, "hex");
  const expectedBuffer = Buffer.from(expectedSignature, "hex");
  if (providedBuffer.length === 0 || providedBuffer.length !== expectedBuffer.length) return false;
  try {
    return timingSafeEqual(providedBuffer, expectedBuffer);
  } catch {
    return false;
  }
}
function setGateCookie(req, res) {
  if (!ADMIN_SECRET || !GATE_COOKIE_VALUE) return;
  res.cookie(GATE_COOKIE_NAME, GATE_COOKIE_VALUE, cookieOptions2(req));
}
function hasLinkGate(req) {
  if (!ADMIN_SECRET) return true;
  if (getGateCookie(req) === GATE_COOKIE_VALUE) return true;
  return getAccessToken(req) === ADMIN_SECRET;
}
function tokenGate(req, res, next) {
  if (req.path === "/bootstrap" || req.path === "/login" || req.path === "/me") {
    next();
    return;
  }
  const cookie = getAdminCookie(req);
  if (cookie) {
    next();
    return;
  }
  if (hasLinkGate(req)) {
    next();
    return;
  }
  if (ADMIN_SECRET && req.query.access_token === ADMIN_SECRET) {
    next();
    return;
  }
  res.status(401).json({ error: "Unauthorized" });
}
function ipAllowlist(req, res, next) {
  if (IP_ALLOWLIST.length === 0) {
    next();
    return;
  }
  const ip = getClientIp4(req);
  const allowed = IP_ALLOWLIST.some((entry) => ip === entry || ip.startsWith(entry.split("/")[0]));
  if (!allowed) {
    res.status(403).json({ error: "Access denied from this IP address." });
    return;
  }
  next();
}
function ownerPortalHeaders(_req, res, next) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive, nosnippet");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "0");
  res.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()");
  next();
}
function adminEndpointRateLimit(req, res, next) {
  const ip = getClientIp4(req);
  const now = Date.now();
  const entry = endpointRateMap.get(ip);
  if (!entry || now - entry.windowStart > ENDPOINT_WINDOW_MS) {
    endpointRateMap.set(ip, { count: 1, windowStart: now });
    next();
    return;
  }
  entry.count++;
  if (entry.count > ENDPOINT_RATE_MAX) {
    const retryAfterSec = Math.ceil((ENDPOINT_WINDOW_MS - (Date.now() - entry.windowStart)) / 1e3);
    res.setHeader("Retry-After", String(retryAfterSec));
    res.status(429).json({ error: "Too many requests. Slow down.", retryAfterSec });
    return;
  }
  next();
}
function requireJsonContentType(req, res, next) {
  if (req.method === "POST" || req.method === "PUT" || req.method === "PATCH") {
    const ct = req.headers["content-type"] ?? "";
    if (!ct.includes("application/json")) {
      res.status(415).json({ error: "Content-Type must be application/json" });
      return;
    }
  }
  next();
}
async function requireSession(req, res, next) {
  if (req.path === "/bootstrap" || req.path === "/login" || req.path === "/me") {
    next();
    return;
  }
  const token = getAdminCookie(req);
  if (!token) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const parsed = await verifySession(token);
  if (!parsed) {
    res.status(401).json({ error: "Session expired or invalid" });
    return;
  }
  try {
    const db = await getDb();
    if (db) {
      const sessionResult = await db.execute(sql2`
                SELECT isRevoked FROM yallaAdminSessions
                WHERE id = ${parsed.sessionId} AND expiresAt > NOW()
                LIMIT 1
            `);
      const rows = sessionResult.rows;
      if (!rows || rows.length === 0 || rows[0]?.isRevoked) {
        res.status(401).json({ error: "Session revoked or expired" });
        return;
      }
    }
  } catch {
  }
  req.adminSession = parsed;
  next();
}
async function handleBootstrap(req, res) {
  const ip = getClientIp4(req);
  const token = getAccessToken(req);
  const redirectTarget = resolveRedirectTarget(req);
  const mode = typeof req.query.mode === "string" ? req.query.mode.trim().toLowerCase() : "redirect";
  const hasSignedLink = await isValidSignedOwnerLink(req);
  const nonce = getSignedAccessNonce(req);
  const expiresAt = getSignedAccessExpiry(req);
  if (!ADMIN_SECRET) {
    if (mode === "json") {
      res.json({ ok: true, redirectTo: redirectTarget, gateEnabled: false });
      return;
    }
    res.redirect(302, redirectTarget);
    return;
  }
  if (token !== ADMIN_SECRET && !hasSignedLink) {
    await auditLog(null, "unknown", "access_link.rejected", ip, redirectTarget);
    if (mode === "json") {
      res.status(403).json({ error: "Invalid owner access link." });
      return;
    }
    res.status(403).send("Invalid owner access link.");
    return;
  }
  setGateCookie(req, res);
  if (hasSignedLink && nonce && expiresAt) {
    await consumeOwnerLinkNonce(req, nonce, expiresAt, redirectTarget);
  }
  await auditLog(null, "owner_gate", "access_link.accepted", ip, redirectTarget, {
    mode: hasSignedLink ? "signed" : "raw_secret",
    expires: expiresAt,
    isOneTime: Boolean(nonce)
  });
  broadcastSSE("owner_gate_accepted", {
    ip,
    redirectTo: redirectTarget,
    mode: hasSignedLink ? "signed" : "raw_secret",
    isOneTime: Boolean(nonce),
    ts: (/* @__PURE__ */ new Date()).toISOString()
  });
  if (mode === "json") {
    res.json({ ok: true, redirectTo: redirectTarget, gateEnabled: true });
    return;
  }
  res.redirect(302, redirectTarget);
}
async function handleLogin(req, res) {
  const { username, password } = req.body ?? {};
  const ip = getClientIp4(req);
  if (!hasLinkGate(req)) {
    await auditLog(null, typeof username === "string" ? username : "unknown", "login.link_denied", ip);
    res.status(403).json({ error: "Use the private owner access link before attempting to sign in." });
    return;
  }
  if (typeof username !== "string" || typeof password !== "string") {
    res.status(400).json({ error: "Username and password are required." });
    return;
  }
  if (username.length > 128 || password.length > 256) {
    res.status(400).json({ error: "Invalid credentials format." });
    return;
  }
  const lockState = loginAttempts.get(ip);
  if (lockState && lockState.lockedUntil > Date.now()) {
    const remainingMs = lockState.lockedUntil - Date.now();
    const retryAfterSec = Math.ceil(remainingMs / 1e3);
    res.setHeader("Retry-After", String(retryAfterSec));
    res.status(429).json({
      error: `Too many failed attempts. Locked for ${Math.ceil(remainingMs / 6e4)} more minute(s).`,
      retryAfterSec
    });
    return;
  }
  const usernameOk = username === ADMIN_USERNAME;
  let passwordOk = false;
  if (ADMIN_PASSWORD_HASH) {
    passwordOk = await bcrypt2.compare(password, ADMIN_PASSWORD_HASH);
  } else if (!ENV.isProduction) {
    passwordOk = password === "yalla-admin-dev";
  }
  if (!usernameOk || !passwordOk) {
    const current = loginAttempts.get(ip) ?? { count: 0, lockedUntil: 0 };
    const newCount = current.count + 1;
    const lockedUntil = newCount >= MAX_ATTEMPTS ? Date.now() + LOCKOUT_MS : 0;
    loginAttempts.set(ip, { count: newCount, lockedUntil });
    await auditLog(null, username, "login.failed", ip);
    res.status(401).json({ error: "Invalid credentials." });
    return;
  }
  loginAttempts.delete(ip);
  const sessionId = nanoid(32);
  const expiresAt = new Date(Date.now() + SESSION_TTL_H * 3600 * 1e3);
  const token = await signSession(sessionId, ADMIN_USERNAME);
  try {
    const db = await getDb();
    if (db) {
      await db.execute(sql2`
                INSERT INTO yallaAdminSessions (id, adminUsername, ipAddress, userAgent, expiresAt)
                VALUES (${sessionId}, ${ADMIN_USERNAME}, ${ip}, ${req.headers["user-agent"] ?? null}, ${expiresAt})
            `);
    }
  } catch {
  }
  await auditLog(sessionId, ADMIN_USERNAME, "login.success", ip);
  broadcastSSE("admin_login", { ip, ts: (/* @__PURE__ */ new Date()).toISOString() });
  res.cookie(COOKIE_NAME2, token, cookieOptions2(req));
  setGateCookie(req, res);
  res.json({ ok: true, username: ADMIN_USERNAME, expiresAt });
}
async function handleLogout(req, res) {
  const session = req.adminSession;
  const ip = getClientIp4(req);
  if (session) {
    try {
      const db = await getDb();
      if (db) {
        await db.execute(sql2`
                    UPDATE yallaAdminSessions SET isRevoked = 1 WHERE id = ${session.sessionId}
                `);
      }
    } catch {
    }
    await auditLog(session.sessionId, session.username, "logout", ip);
  }
  res.clearCookie(COOKIE_NAME2, { path: ADMIN_API_PATH });
  res.clearCookie(GATE_COOKIE_NAME, { path: ADMIN_API_PATH });
  res.json({ ok: true });
}
async function handleMe(req, res) {
  const token = getAdminCookie(req);
  if (!token) {
    res.json({ authenticated: false });
    return;
  }
  const session = await verifySession(token);
  if (!session) {
    res.json({ authenticated: false });
    return;
  }
  try {
    const db = await getDb();
    if (db) {
      const sessionResult = await db.execute(sql2`
                SELECT isRevoked FROM yallaAdminSessions
                WHERE id = ${session.sessionId} AND expiresAt > NOW()
                LIMIT 1
            `);
      const rows = sessionResult.rows;
      if (!rows || rows.length === 0 || rows[0]?.isRevoked) {
        res.clearCookie(COOKIE_NAME2, { path: ADMIN_API_PATH });
        res.json({ authenticated: false });
        return;
      }
    }
  } catch {
  }
  res.json({ authenticated: true, username: session.username });
}
async function handleOverview(_req, res) {
  try {
    const db = await getDb();
    if (!db) {
      res.json({});
      return;
    }
    const usersResult = await db.execute(sql2`SELECT COUNT(*) as total FROM localUsers`);
    const usersRow = usersResult.rows;
    const orgsResult = await db.execute(sql2`SELECT COUNT(*) as total FROM organizations`);
    const orgsRow = orgsResult.rows;
    const activeSessionsResult = await db.execute(sql2`
            SELECT COUNT(*) as total FROM localUserSessions WHERE expiresAt > NOW()
        `);
    const activeSessionsRow = activeSessionsResult.rows;
    const todayLoginsResult = await db.execute(sql2`
            SELECT COUNT(*) as total FROM auditLogs
            WHERE action = 'auth.login' AND createdAt >= CURDATE()
        `);
    const todayLoginsRow = todayLoginsResult.rows;
    const serviceRequestsResult = await db.execute(sql2`
            SELECT COUNT(*) as total FROM serviceRequests WHERE status NOT IN ('completed', 'cancelled')
        `);
    const serviceRequestsRow = serviceRequestsResult.rows;
    const assetsResult = await db.execute(sql2`SELECT COUNT(*) as total FROM assetInventory`);
    const assetsRow = assetsResult.rows;
    const todaySignupsResult = await db.execute(sql2`
            SELECT COUNT(*) as total FROM localUsers WHERE DATE(createdAt) = CURDATE()
        `);
    const todaySignupsRow = todaySignupsResult.rows;
    const newOrgsResult = await db.execute(sql2`
            SELECT COUNT(*) as total FROM organizations WHERE DATE(createdAt) = CURDATE()
        `);
    const newOrgsRow = newOrgsResult.rows;
    const revenueResult = await db.execute(sql2`
            SELECT COUNT(*) as total FROM organizations WHERE plan IN ('professional','enterprise') AND isActive = 1
        `);
    const revenueRow = revenueResult.rows;
    res.json({
      totalUsers: usersRow?.[0]?.total ?? 0,
      totalOrgs: orgsRow?.[0]?.total ?? 0,
      activeSessions: activeSessionsRow?.[0]?.total ?? 0,
      todayLogins: todayLoginsRow?.[0]?.total ?? 0,
      openServiceRequests: serviceRequestsRow?.[0]?.total ?? 0,
      totalAssets: assetsRow?.[0]?.total ?? 0,
      todaySignups: todaySignupsRow?.[0]?.total ?? 0,
      newOrgsToday: newOrgsRow?.[0]?.total ?? 0,
      paidOrgs: revenueRow?.[0]?.total ?? 0
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch overview stats" });
  }
}
async function handleUsers(req, res) {
  try {
    const db = await getDb();
    if (!db) {
      res.json([]);
      return;
    }
    const limit = Math.min(parseInt(req.query.limit ?? "50", 10) || 50, 200);
    const offset = parseInt(req.query.offset ?? "0", 10) || 0;
    const usersDbResult = await db.execute(sql2`
            SELECT
                u.id,
                u.username,
                u.email,
                u.role,
                u.status,
                u.isEmailVerified,
                u.isMfaEnabled,
                u.createdAt,
                u.lastLoginAt,
                COUNT(DISTINCT s.id) as activeSessions
            FROM localUsers u
            LEFT JOIN localUserSessions s ON s.userId = u.id AND s.expiresAt > NOW()
            GROUP BY u.id
            ORDER BY u.createdAt DESC
            LIMIT ${limit} OFFSET ${offset}
        `);
    const users2 = usersDbResult.rows;
    res.json(users2 ?? []);
  } catch {
    res.status(500).json({ error: "Failed to fetch users" });
  }
}
async function handleSystem(_req, res) {
  try {
    const db = await getDb();
    const uptime = process.uptime();
    const mem = process.memoryUsage();
    let dbStatus = "unavailable";
    let dbVersion = "";
    let tableCount = 0;
    if (db) {
      try {
        const versionResult = await db.execute(sql2`SELECT VERSION() as v`);
        const vRow = versionResult.rows;
        dbVersion = vRow?.[0]?.v ?? "";
        const tableResult = await db.execute(sql2`
                    SELECT COUNT(*) as c FROM information_schema.TABLES
                    WHERE TABLE_SCHEMA = DATABASE()
                `);
        const tRow = tableResult.rows;
        tableCount = tRow?.[0]?.c ?? 0;
        dbStatus = "healthy";
      } catch {
        dbStatus = "error";
      }
    }
    res.json({
      uptime: Math.round(uptime),
      uptimeFormatted: `${Math.floor(uptime / 3600)}h ${Math.floor(uptime % 3600 / 60)}m`,
      memory: {
        rss: Math.round(mem.rss / 1024 / 1024),
        heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
        heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
        external: Math.round(mem.external / 1024 / 1024)
      },
      db: { status: dbStatus, version: dbVersion, tableCount },
      env: {
        nodeEnv: ENV.isProduction ? "production" : ENV.isDevelopment ? "development" : "test",
        aiQueueMode: ENV.aiQueueMode,
        redisConfigured: ENV.redisUrl.trim().length > 0,
        databasePoolSize: ENV.databasePoolSize
      },
      sseClients: getSSEClientCount()
    });
  } catch {
    res.status(500).json({ error: "Failed to fetch system info" });
  }
}
async function handleAudit(req, res) {
  try {
    const db = await getDb();
    if (!db) {
      res.json([]);
      return;
    }
    const limit = Math.min(parseInt(req.query.limit ?? "100", 10) || 100, 500);
    const action = req.query.action;
    const auditResult = await db.execute(
      action ? sql2`SELECT * FROM yallaAdminAuditLogs WHERE action = ${action} ORDER BY createdAt DESC LIMIT ${limit}` : sql2`SELECT * FROM yallaAdminAuditLogs ORDER BY createdAt DESC LIMIT ${limit}`
    );
    const rows = auditResult.rows;
    res.json(rows ?? []);
  } catch {
    res.status(500).json({ error: "Failed to fetch audit logs" });
  }
}
async function handlePlatformAudit(req, res) {
  try {
    const db = await getDb();
    if (!db) {
      res.json([]);
      return;
    }
    const limit = Math.min(parseInt(req.query.limit ?? "100", 10) || 100, 500);
    const category = req.query.category;
    const platformAuditResult = await db.execute(
      category ? sql2`SELECT * FROM auditLogs WHERE category = ${category} ORDER BY createdAt DESC LIMIT ${limit}` : sql2`SELECT * FROM auditLogs ORDER BY createdAt DESC LIMIT ${limit}`
    );
    const rows = platformAuditResult.rows;
    res.json(rows ?? []);
  } catch {
    res.status(500).json({ error: "Failed to fetch platform audit logs" });
  }
}
async function handleInteractions(req, res) {
  try {
    const db = await getDb();
    if (!db) {
      res.json([]);
      return;
    }
    const limit = Math.min(parseInt(req.query.limit ?? "100", 10) || 100, 500);
    const context = req.query.context?.trim();
    const action = req.query.action?.trim();
    const interactionResult = await db.execute(
      context && action ? sql2`
                    SELECT
                        l.id,
                        l.context,
                        l.action,
                        l.entityType,
                        l.entityId,
                        l.inputSnapshot,
                        l.outputRef,
                        l.durationMs,
                        l.createdAt,
                        l.organizationId,
                        COALESCE(lu.username, u.name, 'anonymous visitor') as actorName,
                        COALESCE(lu.email, u.email, '') as actorEmail,
                        o.name as organizationName
                    FROM userInteractionLogs l
                    LEFT JOIN localUsers lu ON lu.id = l.localUserId
                    LEFT JOIN users u ON u.id = l.userId
                    LEFT JOIN organizations o ON o.id = l.organizationId
                    WHERE l.context = ${context} AND l.action = ${action}
                    ORDER BY l.createdAt DESC
                    LIMIT ${limit}
                ` : context ? sql2`
                        SELECT
                            l.id,
                            l.context,
                            l.action,
                            l.entityType,
                            l.entityId,
                            l.inputSnapshot,
                            l.outputRef,
                            l.durationMs,
                            l.createdAt,
                            l.organizationId,
                            COALESCE(lu.username, u.name, 'anonymous visitor') as actorName,
                            COALESCE(lu.email, u.email, '') as actorEmail,
                            o.name as organizationName
                        FROM userInteractionLogs l
                        LEFT JOIN localUsers lu ON lu.id = l.localUserId
                        LEFT JOIN users u ON u.id = l.userId
                        LEFT JOIN organizations o ON o.id = l.organizationId
                        WHERE l.context = ${context}
                        ORDER BY l.createdAt DESC
                        LIMIT ${limit}
                    ` : action ? sql2`
                            SELECT
                                l.id,
                                l.context,
                                l.action,
                                l.entityType,
                                l.entityId,
                                l.inputSnapshot,
                                l.outputRef,
                                l.durationMs,
                                l.createdAt,
                                l.organizationId,
                                COALESCE(lu.username, u.name, 'anonymous visitor') as actorName,
                                COALESCE(lu.email, u.email, '') as actorEmail,
                                o.name as organizationName
                            FROM userInteractionLogs l
                            LEFT JOIN localUsers lu ON lu.id = l.localUserId
                            LEFT JOIN users u ON u.id = l.userId
                            LEFT JOIN organizations o ON o.id = l.organizationId
                            WHERE l.action = ${action}
                            ORDER BY l.createdAt DESC
                            LIMIT ${limit}
                        ` : sql2`
                            SELECT
                                l.id,
                                l.context,
                                l.action,
                                l.entityType,
                                l.entityId,
                                l.inputSnapshot,
                                l.outputRef,
                                l.durationMs,
                                l.createdAt,
                                l.organizationId,
                                COALESCE(lu.username, u.name, 'anonymous visitor') as actorName,
                                COALESCE(lu.email, u.email, '') as actorEmail,
                                o.name as organizationName
                            FROM userInteractionLogs l
                            LEFT JOIN localUsers lu ON lu.id = l.localUserId
                            LEFT JOIN users u ON u.id = l.userId
                            LEFT JOIN organizations o ON o.id = l.organizationId
                            ORDER BY l.createdAt DESC
                            LIMIT ${limit}
                        `
    );
    const rows = interactionResult.rows;
    res.json(rows ?? []);
  } catch {
    res.status(500).json({ error: "Failed to fetch interaction logs" });
  }
}
async function handleIntake(req, res) {
  try {
    const db = await getDb();
    const limit = Math.min(parseInt(req.query.limit ?? "20", 10) || 20, 100);
    const [accessRequests2, consultationRequests2] = await Promise.all([
      listAccessRequests(limit),
      listConsultationRequests(limit)
    ]);
    let serviceRequests2 = [];
    if (db) {
      const srResult = await db.execute(sql2`
                SELECT
                    sr.id,
                    sr.serviceType,
                    sr.title,
                    sr.priority,
                    sr.status,
                    sr.requestedByUserId,
                    sr.createdAt,
                    sr.updatedAt,
                    lu.username as requestedByUsername,
                    lu.email as requestedByEmail,
                    o.name as organizationName
                FROM serviceRequests sr
                LEFT JOIN localUsers lu ON lu.id = sr.requestedByUserId
                LEFT JOIN organizations o ON o.id = sr.organizationId
                ORDER BY sr.createdAt DESC
                LIMIT ${limit}
            `);
      const srRows = srResult.rows;
      serviceRequests2 = srRows ?? [];
    }
    res.json({
      counts: {
        accessRequests: accessRequests2.length,
        consultationRequests: consultationRequests2.length,
        serviceRequests: Array.isArray(serviceRequests2) ? serviceRequests2.length : 0
      },
      accessRequests: accessRequests2,
      consultationRequests: consultationRequests2,
      serviceRequests: serviceRequests2
    });
  } catch {
    res.status(500).json({ error: "Failed to fetch intake data" });
  }
}
async function handleOnboarding(req, res) {
  try {
    const db = await getDb();
    if (!db) {
      res.json({ counts: [], recent: [] });
      return;
    }
    const limit = Math.min(parseInt(req.query.limit ?? "50", 10) || 50, 200);
    const [countsResult, recentResult] = await Promise.all([
      db.execute(sql2`
                SELECT stage, COUNT(*) as total
                FROM userOnboarding
                GROUP BY stage
                ORDER BY total DESC
            `),
      db.execute(sql2`
                SELECT
                    o.id,
                    o.stage,
                    o.accountIntent,
                    o.selectedLocale,
                    o.completedAt,
                    o.createdAt,
                    o.updatedAt,
                    COALESCE(lu.username, u.name, 'unknown') as userLabel,
                    COALESCE(lu.email, u.email, '') as userEmail
                FROM userOnboarding o
                LEFT JOIN localUsers lu ON lu.id = o.localUserId
                LEFT JOIN users u ON u.id = o.userId
                ORDER BY o.updatedAt DESC
                LIMIT ${limit}
            `)
    ]);
    const counts = countsResult.rows;
    const recent = recentResult.rows;
    res.json({ counts: counts ?? [], recent: recent ?? [] });
  } catch {
    res.status(500).json({ error: "Failed to fetch onboarding telemetry" });
  }
}
async function handleValidationFailures(req, res) {
  try {
    const db = await getDb();
    if (!db) {
      res.json([]);
      return;
    }
    const limit = Math.min(parseInt(req.query.limit ?? "100", 10) || 100, 500);
    const validationResult = await db.execute(sql2`
            SELECT
                id,
                category,
                action,
                entityType,
                entityId,
                targetEntity,
                actorRole,
                outcome,
                payload,
                createdAt
            FROM auditLogs
            WHERE action = 'trpc.validation_failed' OR outcome IN ('failure', 'blocked')
            ORDER BY createdAt DESC
            LIMIT ${limit}
        `);
    const rows = validationResult.rows;
    res.json(rows ?? []);
  } catch {
    res.status(500).json({ error: "Failed to fetch validation events" });
  }
}
async function handleSubscriptions(req, res) {
  try {
    const db = await getDb();
    if (!db) {
      res.json({ subscriptions: [], billingEvents: [], summary: [] });
      return;
    }
    const limit = Math.min(parseInt(req.query.limit ?? "100", 10) || 100, 500);
    const [subsResult, eventsResult, summaryResult] = await Promise.all([
      db.execute(sql2`
                SELECT
                    s.id,
                    s.plan,
                    s.status,
                    s.billingInterval,
                    s.amountCents,
                    s.currency,
                    s.currentPeriodStart,
                    s.currentPeriodEnd,
                    s.cancelAtPeriodEnd,
                    s.canceledAt,
                    s.stripeSubscriptionId,
                    s.createdAt,
                    s.updatedAt,
                    o.name          AS organizationName,
                    o.slug          AS organizationSlug,
                    o.billingEmail  AS billingEmail
                FROM subscriptions s
                JOIN organizations o ON o.id = s.organizationId
                ORDER BY s.updatedAt DESC
                LIMIT ${limit}
            `),
      db.execute(sql2`
                SELECT
                    be.id,
                    be.eventType,
                    be.status,
                    be.amountCents,
                    be.currency,
                    be.stripeEventId,
                    be.createdAt,
                    o.name AS organizationName
                FROM billingEvents be
                JOIN organizations o ON o.id = be.organizationId
                ORDER BY be.createdAt DESC
                LIMIT ${limit}
            `),
      db.execute(sql2`
                SELECT
                    plan,
                    status,
                    currency,
                    COUNT(*)           AS count,
                    SUM(amountCents)   AS totalAmountCents
                FROM subscriptions
                GROUP BY plan, status, currency
                ORDER BY plan, status
            `)
    ]);
    const subs = subsResult.rows;
    const events = eventsResult.rows;
    const summary = summaryResult.rows;
    res.json({
      subscriptions: subs ?? [],
      billingEvents: events ?? [],
      summary: summary ?? []
    });
  } catch {
    res.status(500).json({ error: "Failed to fetch subscription data" });
  }
}
async function handleSignups(req, res) {
  try {
    const db = await getDb();
    if (!db) {
      res.json([]);
      return;
    }
    const limit = Math.min(parseInt(req.query.limit ?? "50", 10) || 50, 200);
    const signupsResult = await db.execute(sql2`
            SELECT
                u.id,
                u.username,
                u.email,
                u.role,
                u.isEmailVerified,
                u.isMfaEnabled,
                u.createdAt,
                u.lastLoginAt,
                o.name  AS organizationName,
                o.plan  AS organizationPlan
            FROM localUsers u
            LEFT JOIN organizationMembers om ON om.localUserId = u.id
            LEFT JOIN organizations o ON o.id = om.organizationId
            ORDER BY u.createdAt DESC
            LIMIT ${limit}
        `);
    const rows = signupsResult.rows;
    res.json(rows ?? []);
  } catch {
    res.status(500).json({ error: "Failed to fetch signups" });
  }
}
async function handleOrgs(req, res) {
  try {
    const db = await getDb();
    if (!db) {
      res.json([]);
      return;
    }
    const limit = Math.min(parseInt(req.query.limit ?? "100", 10) || 100, 500);
    const orgsResult = await db.execute(sql2`
            SELECT
                o.id,
                o.name,
                o.plan,
                o.isActive,
                o.trialEndsAt,
                o.createdAt,
                o.updatedAt,
                COUNT(DISTINCT om.id)   AS memberCount,
                COUNT(DISTINCT CASE WHEN s.expiresAt > NOW() THEN s.id END) AS activeSessions
            FROM organizations o
            LEFT JOIN organizationMembers om ON om.organizationId = o.id
            LEFT JOIN localUserSessions  s  ON s.userId = om.localUserId
            GROUP BY o.id
            ORDER BY o.createdAt DESC
            LIMIT ${limit}
        `);
    const rows = orgsResult.rows;
    res.json(rows ?? []);
  } catch {
    res.status(500).json({ error: "Failed to fetch organizations" });
  }
}
async function handleRealtime(_req, res) {
  try {
    const db = await getDb();
    if (!db) {
      res.json({ activeSessions: 0, recentActions: 0, newUsersLastHour: 0, sseClients: getSSEClientCount(), dbStatus: "unavailable" });
      return;
    }
    const [sessResult, actResult, newUsersResult] = await Promise.all([
      db.execute(sql2`SELECT COUNT(*) as total FROM localUserSessions WHERE expiresAt > NOW()`),
      db.execute(sql2`SELECT COUNT(*) as total FROM auditLogs WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)`),
      db.execute(sql2`SELECT COUNT(*) as total FROM localUsers WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 60 MINUTE)`)
    ]);
    const sessRow = sessResult.rows;
    const actRow = actResult.rows;
    const newUsersRow = newUsersResult.rows;
    res.json({
      activeSessions: sessRow?.[0]?.total ?? 0,
      recentActions: actRow?.[0]?.total ?? 0,
      newUsersLastHour: newUsersRow?.[0]?.total ?? 0,
      sseClients: getSSEClientCount(),
      dbStatus: "healthy",
      ts: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch {
    res.status(500).json({ error: "Failed to fetch realtime stats" });
  }
}
async function handleUserDetail(req, res) {
  try {
    const db = await getDb();
    if (!db) {
      res.status(503).json({ error: "Database unavailable" });
      return;
    }
    const userId = parseInt(req.params.id ?? "", 10);
    if (!userId) {
      res.status(400).json({ error: "Invalid user id" });
      return;
    }
    const [userResult, sessionResult, auditResult, interactionResult] = await Promise.all([
      db.execute(sql2`
                SELECT u.id, u.username, u.email, u.role, u.status, u.isEmailVerified, u.isMfaEnabled,
                       u.createdAt, u.lastLoginAt, o.name AS organizationName, o.plan AS organizationPlan
                FROM localUsers u
                LEFT JOIN organizationMembers om ON om.localUserId = u.id
                LEFT JOIN organizations o ON o.id = om.organizationId
                WHERE u.id = ${userId} LIMIT 1
            `),
      db.execute(sql2`
                SELECT id, ipAddress, userAgent, createdAt, expiresAt
                FROM localUserSessions WHERE userId = ${userId}
                ORDER BY createdAt DESC LIMIT 20
            `),
      db.execute(sql2`
                SELECT category, action, outcome, createdAt
                FROM auditLogs WHERE localUserId = ${userId}
                ORDER BY createdAt DESC LIMIT 30
            `),
      db.execute(sql2`
                SELECT context, action, entityType, createdAt, durationMs
                FROM userInteractionLogs WHERE localUserId = ${userId}
                ORDER BY createdAt DESC LIMIT 30
            `)
    ]);
    const user = userResult.rows[0];
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json({
      user,
      sessions: sessionResult.rows,
      auditTrail: auditResult.rows,
      interactions: interactionResult.rows
    });
  } catch {
    res.status(500).json({ error: "Failed to fetch user detail" });
  }
}
async function handleOrgDetail(req, res) {
  try {
    const db = await getDb();
    if (!db) {
      res.status(503).json({ error: "Database unavailable" });
      return;
    }
    const orgId = parseInt(req.params.id ?? "", 10);
    if (!orgId) {
      res.status(400).json({ error: "Invalid org id" });
      return;
    }
    const [orgResult, membersResult, subscriptionResult, auditResult] = await Promise.all([
      db.execute(sql2`
                SELECT id, name, plan, status, isActive, trialEndsAt, createdAt, updatedAt,
                       contactEmail, billingEmail
                FROM organizations WHERE id = ${orgId} LIMIT 1
            `),
      db.execute(sql2`
                SELECT om.role, u.id AS userId, u.username, u.email, u.status AS userStatus,
                       u.lastLoginAt, om.joinedAt
                FROM organizationMembers om
                JOIN localUsers u ON u.id = om.localUserId
                WHERE om.organizationId = ${orgId}
                ORDER BY om.joinedAt ASC
                LIMIT 50
            `),
      db.execute(sql2`
                SELECT id, plan, status, currentPeriodStart, currentPeriodEnd, cancelAtPeriodEnd,
                       createdAt, updatedAt
                FROM subscriptions WHERE organizationId = ${orgId}
                ORDER BY createdAt DESC LIMIT 1
            `),
      db.execute(sql2`
                SELECT category, action, outcome, createdAt
                FROM auditLogs WHERE organizationId = ${orgId}
                ORDER BY createdAt DESC LIMIT 30
            `)
    ]);
    const org = orgResult.rows[0];
    if (!org) {
      res.status(404).json({ error: "Organization not found" });
      return;
    }
    res.json({
      org,
      members: membersResult.rows,
      subscription: subscriptionResult.rows[0] ?? null,
      auditTrail: auditResult.rows
    });
  } catch {
    res.status(500).json({ error: "Failed to fetch org detail" });
  }
}
async function handleSuspendUser(req, res) {
  const session = req.adminSession;
  const ip = getClientIp4(req);
  const userId = parseInt(req.params.id ?? "", 10);
  if (!userId) {
    res.status(400).json({ error: "Invalid user id" });
    return;
  }
  const { suspend } = req.body;
  if (typeof suspend !== "boolean") {
    res.status(400).json({ error: "Body must include suspend: true | false" });
    return;
  }
  try {
    const db = await getDb();
    if (!db) {
      res.status(503).json({ error: "Database unavailable" });
      return;
    }
    const userResult = await db.execute(sql2`SELECT id, email, status FROM localUsers WHERE id = ${userId} LIMIT 1`);
    const rows = userResult.rows;
    const user = rows[0];
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const newStatus = suspend ? "suspended" : "active";
    await db.execute(sql2`UPDATE localUsers SET status = ${newStatus}, updatedAt = NOW() WHERE id = ${userId}`);
    await auditLog(session?.sessionId ?? null, session?.username ?? "unknown", suspend ? "user.suspend" : "user.unsuspend", ip, String(userId));
    broadcastSSE("user_status_changed", { userId, email: user.email, status: newStatus, by: session?.username, ts: (/* @__PURE__ */ new Date()).toISOString() });
    res.json({ success: true, userId, status: newStatus });
  } catch {
    res.status(500).json({ error: "Failed to update user status" });
  }
}
async function handleRevokeUserSessions(req, res) {
  const session = req.adminSession;
  const ip = getClientIp4(req);
  const userId = parseInt(req.params.id ?? "", 10);
  if (!userId) {
    res.status(400).json({ error: "Invalid user id" });
    return;
  }
  try {
    const db = await getDb();
    if (!db) {
      res.status(503).json({ error: "Database unavailable" });
      return;
    }
    await db.execute(sql2`DELETE FROM localUserSessions WHERE userId = ${userId}`);
    await auditLog(session?.sessionId ?? null, session?.username ?? "unknown", "user.revoke_sessions", ip, String(userId));
    broadcastSSE("user_sessions_revoked", { userId, by: session?.username, ts: (/* @__PURE__ */ new Date()).toISOString() });
    res.json({ success: true, userId });
  } catch {
    res.status(500).json({ error: "Failed to revoke user sessions" });
  }
}
async function handleSuspendOrg(req, res) {
  const session = req.adminSession;
  const ip = getClientIp4(req);
  const orgId = parseInt(req.params.id ?? "", 10);
  if (!orgId) {
    res.status(400).json({ error: "Invalid org id" });
    return;
  }
  const { suspend } = req.body;
  if (typeof suspend !== "boolean") {
    res.status(400).json({ error: "Body must include suspend: true | false" });
    return;
  }
  try {
    const db = await getDb();
    if (!db) {
      res.status(503).json({ error: "Database unavailable" });
      return;
    }
    const orgCheckResult = await db.execute(sql2`SELECT id, name, status FROM organizations WHERE id = ${orgId} LIMIT 1`);
    const rows = orgCheckResult.rows;
    const org = rows[0];
    if (!org) {
      res.status(404).json({ error: "Organization not found" });
      return;
    }
    const newStatus = suspend ? "suspended" : "active";
    await db.execute(sql2`UPDATE organizations SET status = ${newStatus}, updatedAt = NOW() WHERE id = ${orgId}`);
    await auditLog(session?.sessionId ?? null, session?.username ?? "unknown", suspend ? "org.suspend" : "org.unsuspend", ip, String(orgId));
    broadcastSSE("org_status_changed", { orgId, name: org.name, status: newStatus, by: session?.username, ts: (/* @__PURE__ */ new Date()).toISOString() });
    res.json({ success: true, orgId, status: newStatus });
  } catch {
    res.status(500).json({ error: "Failed to update organization status" });
  }
}
async function handleGenerateAccessLink(req, res) {
  const session = req.adminSession;
  const ip = getClientIp4(req);
  if (!ADMIN_SECRET) {
    res.status(400).json({ error: "YALLA_ADMIN_SECRET is not configured." });
    return;
  }
  const rawExpires = req.body?.expiresInMinutes;
  const parsedExpires = Number(rawExpires ?? 30);
  if (!Number.isFinite(parsedExpires) || parsedExpires < 1) {
    res.status(400).json({ error: "expiresInMinutes must be a number >= 1" });
    return;
  }
  const expiresInMinutes = Math.min(Math.floor(parsedExpires), 24 * 60);
  const oneTime = typeof req.body?.oneTime === "boolean" ? req.body.oneTime : true;
  const redirectTarget = resolveRedirectTarget(req);
  const expiresAt = Math.floor(Date.now() / 1e3) + expiresInMinutes * 60;
  const nonce = oneTime ? nanoid(24) : "";
  const sig = createSignedAccessSignature(redirectTarget, expiresAt, nonce);
  const params = new URLSearchParams({
    redirect: redirectTarget,
    expires: String(expiresAt),
    sig
  });
  if (nonce) params.set("nonce", nonce);
  const relativeUrl = `/yalla-hack-owners-console/enter?${params.toString()}`;
  let url = relativeUrl;
  const origin = typeof req.headers.origin === "string" ? req.headers.origin.trim() : "";
  if (origin.startsWith("http://") || origin.startsWith("https://")) {
    try {
      url = new URL(relativeUrl, origin).toString();
    } catch {
      url = relativeUrl;
    }
  }
  await auditLog(session?.sessionId ?? null, session?.username ?? "unknown", "access_link.generated", ip, redirectTarget, {
    expiresAt,
    expiresInMinutes,
    oneTime
  });
  broadcastSSE("owner_link_generated", {
    by: session?.username ?? "unknown",
    redirectTo: redirectTarget,
    expiresAt,
    oneTime,
    ts: (/* @__PURE__ */ new Date()).toISOString()
  });
  res.json({
    ok: true,
    url,
    relativeUrl,
    redirectTo: redirectTarget,
    expiresAt,
    expiresAtIso: new Date(expiresAt * 1e3).toISOString(),
    oneTime
  });
}
async function handleExportCsv(req, res) {
  const session = req.adminSession;
  const ip = getClientIp4(req);
  const type = req.query.type ?? "users";
  await auditLog(session?.sessionId ?? null, session?.username ?? "unknown", "export.csv", ip, type);
  try {
    const db = await getDb();
    if (!db) {
      res.status(503).json({ error: "Database unavailable" });
      return;
    }
    let rows;
    let headers;
    let filename;
    if (type === "users") {
      const userExportResult = await db.execute(sql2`
                SELECT id, username, email, role, isEmailVerified, isMfaEnabled, createdAt, lastLoginAt
                FROM localUsers ORDER BY createdAt DESC LIMIT 10000
            `);
      const userRows = userExportResult.rows;
      rows = userRows ?? [];
      headers = "id,username,email,role,isEmailVerified,isMfaEnabled,createdAt,lastLoginAt";
      filename = "users-export.csv";
    } else if (type === "orgs") {
      const orgExportResult = await db.execute(sql2`
                SELECT id, name, plan, isActive, trialEndsAt, createdAt
                FROM organizations ORDER BY createdAt DESC LIMIT 10000
            `);
      const orgRows = orgExportResult.rows;
      rows = orgRows ?? [];
      headers = "id,name,plan,isActive,trialEndsAt,createdAt";
      filename = "orgs-export.csv";
    } else if (type === "subscriptions") {
      const subExportResult = await db.execute(sql2`
                SELECT s.id, s.plan, s.status, s.currentPeriodStart, s.currentPeriodEnd,
                       s.cancelAtPeriodEnd, o.name AS orgName, s.createdAt
                FROM subscriptions s
                JOIN organizations o ON o.id = s.organizationId
                ORDER BY s.createdAt DESC LIMIT 10000
            `);
      const subRows = subExportResult.rows;
      rows = subRows ?? [];
      headers = "id,plan,status,currentPeriodStart,currentPeriodEnd,cancelAtPeriodEnd,orgName,createdAt";
      filename = "subscriptions-export.csv";
    } else if (type === "audit") {
      const auditExportResult = await db.execute(sql2`
                SELECT id, category, action, outcome, ipAddress, createdAt
                FROM auditLogs ORDER BY createdAt DESC LIMIT 10000
            `);
      const auditRows = auditExportResult.rows;
      rows = auditRows ?? [];
      headers = "id,category,action,outcome,ipAddress,createdAt";
      filename = "audit-export.csv";
    } else {
      res.status(400).json({ error: "Invalid export type" });
      return;
    }
    const csvRows = Array.isArray(rows) ? rows : [];
    const csvBody = csvRows.map(
      (r) => headers.split(",").map((h) => JSON.stringify(r[h] ?? "")).join(",")
    ).join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(`${headers}
${csvBody}`);
  } catch {
    res.status(500).json({ error: "Export failed" });
  }
}
function handleSSE(req, res) {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();
  addSSEClient(res);
  const heartbeat = setInterval(() => {
    try {
      res.write(":heartbeat\n\n");
    } catch {
      clearInterval(heartbeat);
    }
  }, 3e4);
  res.write(`event: connected
data: ${JSON.stringify({ ts: (/* @__PURE__ */ new Date()).toISOString(), clients: getSSEClientCount() })}

`);
  req.on("close", () => {
    clearInterval(heartbeat);
    removeSSEClient(res);
  });
}
function scheduleSessionCleanup() {
  const cleanup = async () => {
    try {
      const db = await getDb();
      if (!db) return;
      await db.execute(sql2`
                DELETE FROM yallaAdminSessions
                WHERE expiresAt < NOW()
                   OR (isRevoked = 1 AND lastSeenAt < DATE_SUB(NOW(), INTERVAL 7 DAY))
            `);
    } catch {
    }
  };
  void cleanup();
  setInterval(() => void cleanup(), 60 * 60 * 1e3);
}
function createYallaAdminRouter() {
  const router2 = express2.Router();
  router2.use(ownerPortalHeaders);
  router2.use(ipAllowlist);
  router2.use(adminEndpointRateLimit);
  router2.use(requireJsonContentType);
  router2.get("/bootstrap", (req, res) => void handleBootstrap(req, res));
  router2.post("/login", (req, res) => void handleLogin(req, res));
  router2.use(tokenGate);
  router2.use((req, res, next) => void requireSession(req, res, next));
  router2.post("/logout", (req, res) => void handleLogout(req, res));
  router2.get("/me", (req, res) => void handleMe(req, res));
  router2.get("/stats/overview", (req, res) => void handleOverview(req, res));
  router2.get("/stats/users", (req, res) => void handleUsers(req, res));
  router2.get("/stats/signups", (req, res) => void handleSignups(req, res));
  router2.get("/stats/orgs", (req, res) => void handleOrgs(req, res));
  router2.get("/stats/realtime", (req, res) => void handleRealtime(req, res));
  router2.get("/stats/system", (req, res) => void handleSystem(req, res));
  router2.get("/stats/audit", (req, res) => void handleAudit(req, res));
  router2.get("/stats/platform-audit", (req, res) => void handlePlatformAudit(req, res));
  router2.get("/stats/interactions", (req, res) => void handleInteractions(req, res));
  router2.get("/stats/intake", (req, res) => void handleIntake(req, res));
  router2.get("/stats/onboarding", (req, res) => void handleOnboarding(req, res));
  router2.get("/stats/subscriptions", (req, res) => void handleSubscriptions(req, res));
  router2.get("/stats/validations", (req, res) => void handleValidationFailures(req, res));
  router2.get("/stats/users/:id", (req, res) => void handleUserDetail(req, res));
  router2.get("/stats/orgs/:id", (req, res) => void handleOrgDetail(req, res));
  router2.post("/users/:id/suspend", requireJsonContentType, (req, res) => void handleSuspendUser(req, res));
  router2.post("/users/:id/revoke-sessions", (req, res) => void handleRevokeUserSessions(req, res));
  router2.post("/orgs/:id/suspend", requireJsonContentType, (req, res) => void handleSuspendOrg(req, res));
  router2.post("/access-links/generate", requireJsonContentType, (req, res) => void handleGenerateAccessLink(req, res));
  router2.get("/export/csv", (req, res) => void handleExportCsv(req, res));
  router2.get("/stream", handleSSE);
  scheduleSessionCleanup();
  return router2;
}

// server/_core/index.ts
init_env();
import path5 from "path";
import { fileURLToPath } from "url";
initialiseSentry();
var RATE_LIMIT_WINDOW_MS = 6e4;
var RATE_LIMIT_MAX_REQUESTS = 120;
var AUTH_RATE_LIMIT_MAX = 10;
var AUTH_RATE_LIMIT_WINDOW_MS = 6e4;
var AUTH_PROCEDURES = /* @__PURE__ */ new Set([
  "localAuth.login",
  "localAuth.register",
  "localAuth.forgotPassword",
  "localAuth.resetPassword",
  "localAuth.enableMfa"
]);
function getClientKey(req) {
  return getClientIp3(req);
}
function apiRateLimit(req, res, next) {
  if (!req.path.startsWith("/api/") || shouldBypassApiRateLimit(req.path)) {
    next();
    return;
  }
  const key = getClientKey(req);
  checkRateLimit(key, RATE_LIMIT_MAX_REQUESTS, RATE_LIMIT_WINDOW_MS).then((result) => {
    res.setHeader("X-RateLimit-Limit", String(result.limit));
    res.setHeader("X-RateLimit-Remaining", String(result.remaining));
    res.setHeader("X-RateLimit-Reset", String(result.resetAt));
    if (!result.allowed) {
      const retryAfter = Math.max(1, result.resetAt - Math.floor(Date.now() / 1e3));
      res.setHeader("Retry-After", String(retryAfter));
      res.status(429).json({ error: "Too many requests. Please retry shortly." });
      return;
    }
    next();
  }).catch(next);
}
function authRateLimit(req, res, next) {
  if (req.method !== "POST" || !req.path.startsWith("/api/trpc/")) {
    next();
    return;
  }
  const procedure = req.path.replace("/api/trpc/", "").split("?")[0];
  if (!AUTH_PROCEDURES.has(procedure)) {
    next();
    return;
  }
  const key = `auth:${getClientKey(req)}`;
  checkRateLimit(key, AUTH_RATE_LIMIT_MAX, AUTH_RATE_LIMIT_WINDOW_MS).then((result) => {
    if (!result.allowed) {
      const retryAfter = Math.max(1, result.resetAt - Math.floor(Date.now() / 1e3));
      res.setHeader("Retry-After", String(retryAfter));
      res.status(429).json({ error: "Too many authentication attempts. Please wait before trying again." });
      return;
    }
    next();
  }).catch(next);
}
var CORS_ALLOWED_ORIGINS = new Set([
  ENV.appUrl,
  ...!ENV.isProduction ? ["http://localhost:3000", "http://localhost:3001"] : []
].filter(Boolean));
function corsMiddleware(req, res, next) {
  const origin = req.headers["origin"];
  if (origin && CORS_ALLOWED_ORIGINS.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Vary", "Origin");
  }
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
    res.setHeader("Access-Control-Max-Age", "86400");
    res.status(204).end();
    return;
  }
  next();
}
function securityHeaders(req, res, next) {
  const forwardedProto = req.headers["x-forwarded-proto"];
  const isHttps = req.protocol === "https" || req.secure || typeof forwardedProto === "string" && forwardedProto.split(",").some((value) => value.trim() === "https");
  const headers = getSecurityHeadersForRequest({
    pathname: req.path || req.originalUrl || "/",
    isHttps
  });
  for (const [header, value] of Object.entries(headers)) {
    res.setHeader(header, value);
  }
  next();
}
async function createApp() {
  checkProductionEnv();
  const app = express3();
  app.set("trust proxy", true);
  app.disable("x-powered-by");
  app.use(
    compression({
      threshold: 1024,
      level: 6,
      filter(req, res) {
        if (req.headers.upgrade) return false;
        return compression.filter(req, res);
      }
    })
  );
  app.use((_req, res, next) => {
    res.setHeader("X-Request-ID", nanoid2(21));
    next();
  });
  app.use(corsMiddleware);
  app.use(securityHeaders);
  app.use(authRateLimit);
  app.use(apiRateLimit);
  app.post(
    "/api/webhooks/stripe",
    express3.raw({ type: "application/json" }),
    (req, res) => void stripeWebhookHandler(req, res)
  );
  app.use(express3.json({ limit: "2mb" }));
  app.use(express3.urlencoded({ limit: "2mb", extended: true }));
  const sendHealth = (_req, res) => {
    res.json({
      ok: true,
      status: "healthy",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      service: "djac-tool",
      env: ENV.isProduction ? "production" : ENV.isDevelopment ? "development" : "test",
      scaleProfile: {
        databasePoolSize: ENV.databasePoolSize,
        redisConfigured: ENV.redisUrl.trim().length > 0,
        aiQueueMode: ENV.aiQueueMode
      }
    });
  };
  const sendReadiness = async (_req, res) => {
    const readiness = await getSystemReadiness();
    res.status(readiness.ok ? 200 : 503).json({
      status: readiness.ok ? "ready" : "degraded",
      ...readiness
    });
  };
  app.get("/health", sendHealth);
  app.get("/healthz", sendHealth);
  app.get("/api/health", sendHealth);
  app.get("/api/healthz", sendHealth);
  app.get("/readiness", sendReadiness);
  app.get("/readyz", sendReadiness);
  app.get("/api/readiness", sendReadiness);
  app.get("/api/readyz", sendReadiness);
  registerOAuthRoutes(app);
  app.post("/api/csp-report", (_req, _res) => {
    _res.status(204).end();
  });
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
      onError({ error, path: path6, type, input, ctx, req }) {
        void recordTrpcFailureEvent({
          ctx,
          path: path6,
          type,
          code: error.code,
          message: error.message,
          procedureInput: input,
          issues: error.cause,
          headers: req.headers
        });
      }
    })
  );
  app.use("/api/yalla-admin", createYallaAdminRouter());
  app.use(sentryErrorHandler());
  return app;
}
async function startServer() {
  const app = await createApp();
  const server = createServer(app);
  server.keepAliveTimeout = ENV.httpKeepAliveTimeoutMs;
  server.headersTimeout = Math.max(ENV.httpHeadersTimeoutMs, ENV.httpKeepAliveTimeoutMs + 1e3);
  server.requestTimeout = ENV.httpRequestTimeoutMs;
  server.maxRequestsPerSocket = 1e3;
  const cleanupAssessmentWs = registerAssessmentWebSocketServer(server);
  const stopInteractionRetention = startInteractionRetentionScheduler();
  const stopTrialReminder = startTrialReminderScheduler();
  const stopDeadlineAlerts = startDeadlineAlertScheduler();
  const stopReportScheduler = startReportScheduler();
  server.on("close", () => {
    cleanupAssessmentWs();
    stopInteractionRetention();
    stopTrialReminder();
    stopDeadlineAlerts();
    stopReportScheduler();
  });
  if (ENV.isDevelopment) {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parsedEnv.PORT;
  server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      console.error(
        `Port ${port} is already in use. Stop previous DJAC dev servers and retry.`
      );
      process.exit(1);
      return;
    }
    throw error;
  });
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    void getSystemReadiness().then((readiness) => {
      if (readiness.scaling.readyForHighScale) {
        console.info("[Scale] High-scale production profile is active.");
        return;
      }
      if (readiness.scaling.warnings.length > 0) {
        console.warn("[Scale] Readiness warnings:", readiness.scaling.warnings.join(" | "));
      }
    }).catch((error) => {
      console.warn("[Scale] Unable to evaluate readiness at startup:", error);
    });
  });
}
var isMainModule = process.argv[1] !== void 0 && path5.resolve(process.argv[1]) === path5.resolve(import.meta.filename ?? fileURLToPath(import.meta.url));
if (isMainModule) {
  startServer().catch(console.error);
}
function shutdown(signal) {
  console.info(`[Server] ${signal} received \u2014 shutting down gracefully`);
  Promise.all([closeDbPool(), closeRateLimiter()]).then(() => {
    console.info("[Server] Resources released \u2014 exiting.");
    process.exit(0);
  }).catch((err) => {
    console.error("[Server] Shutdown error:", err);
    process.exit(1);
  });
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// src/vercel-handler.ts
var cachedApp = null;
var initError = null;
function getPath(req) {
  const url = req.url || "";
  const [base] = url.split("?");
  if (base === "/api/index" || base === "/api/index/") {
    const qs = url.includes("?") ? url.slice(url.indexOf("?") + 1) : "";
    const params = new URLSearchParams(qs);
    const apiPath = params.get("api_path");
    if (apiPath) return "/api/" + apiPath;
  }
  return base;
}
async function handler(req, res) {
  const path6 = getPath(req);
  if (path6.startsWith("/api/health") || path6.startsWith("/health")) {
    res.status(200).json({ ok: true, status: "healthy", timestamp: (/* @__PURE__ */ new Date()).toISOString(), service: "djac-tool", node: process.version });
    return;
  }
  if (path6.startsWith("/api/_debug")) {
    res.status(200).json({ ok: true, url: req.url, path: path6, method: req.method, headers: req.headers, node: process.version, pid: process.pid, memory: process.memoryUsage() });
    return;
  }
  if (path6.startsWith("/api/_init")) {
    const steps = {};
    if (!cachedApp && !initError) {
      try {
        steps.createStart = Date.now();
        cachedApp = await createApp();
        steps.createOk = true;
        steps.createMs = Date.now() - steps.createStart;
      } catch (e) {
        initError = e instanceof Error ? e.message : String(e);
        steps.error = initError;
      }
    }
    res.status(200).json({ ok: true, steps, initError, hasApp: !!cachedApp, node: process.version });
    return;
  }
  try {
    if (!cachedApp && !initError) cachedApp = await createApp();
    if (!cachedApp) {
      res.status(500).json({ error: "Express app failed to initialize", message: initError });
      return;
    }
    cachedApp(req, res);
  } catch (err) {
    res.status(500).json({ error: "Internal server error", message: err instanceof Error ? err.message : String(err) });
  }
}
export {
  handler as default
};
