import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import dotenv from "dotenv";

const STRIPE_PRICE_KEYS = [
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
];

const argv = process.argv.slice(2);

function readArgValue(flag) {
    const index = argv.indexOf(flag);
    if (index === -1 || index === argv.length - 1) {
        return undefined;
    }
    return argv[index + 1];
}

const showHelp = argv.includes("--help") || argv.includes("-h");
const jsonOutput = argv.includes("--json");
const failOnWarn = argv.includes("--fail-on-warn");
const requireBilling = argv.includes("--require-billing");
const argEnvFile = readArgValue("--env-file");

if (showHelp) {
    console.log("DJAC production preflight checker");
    console.log("");
    console.log("Usage:");
    console.log("  node scripts/production-preflight.mjs [options]");
    console.log("");
    console.log("Options:");
    console.log("  --env-file <path>   Load environment values from this file (default: .env.production)");
    console.log("  --json              Output machine-readable JSON summary");
    console.log("  --fail-on-warn      Treat warnings as blocking failures (strict mode)");
    console.log("  --require-billing   Require complete Stripe billing configuration");
    console.log("  --help, -h          Show this help output");
    process.exit(0);
}

const envFile = argEnvFile || process.env.ENV_FILE || ".env.production";
const resolvedEnvFile = path.resolve(process.cwd(), envFile);

if (fs.existsSync(resolvedEnvFile)) {
    dotenv.config({ path: resolvedEnvFile });
}

const checks = [];

function get(key) {
    return (process.env[key] || "").trim();
}

function has(key) {
    return get(key).length > 0;
}

function addCheck(severity, key, ok, message) {
    checks.push({ severity, key, ok, message });
}

function addRequired(key, condition, message) {
    addCheck("required", key, Boolean(condition), message);
}

function addRecommended(key, condition, message) {
    addCheck("recommended", key, Boolean(condition), message);
}

function startsWithBcryptHash(value) {
    return /^\$2[aby]\$\d{2}\$/.test(value);
}

function isValidUrl(value, allowedProtocols) {
    try {
        const parsed = new URL(value);
        return allowedProtocols.includes(parsed.protocol);
    } catch {
        return false;
    }
}

addRequired(
    "NODE_ENV",
    get("NODE_ENV") === "production",
    "NODE_ENV must be production for release deployments.",
);

addRequired(
    "JWT_SECRET",
    has("JWT_SECRET"),
    "JWT_SECRET is required.",
);

addRequired(
    "JWT_SECRET_LENGTH",
    get("JWT_SECRET").length >= 32,
    "JWT_SECRET should be at least 32 characters.",
);

addRequired(
    "DATABASE_URL",
    has("DATABASE_URL"),
    "DATABASE_URL is required.",
);

addRequired(
    "DATABASE_URL_FORMAT",
    isValidUrl(get("DATABASE_URL"), ["postgresql:", "postgres:", "mysql:", "mariadb:"]),
    "DATABASE_URL must be a valid postgresql://, postgres://, mysql://, or mariadb:// URL.",
);

const appUrl = get("APP_URL");
addRequired(
    "APP_URL",
    has("APP_URL"),
    "APP_URL is required.",
);

addRequired(
    "APP_URL_HTTPS",
    /^https:\/\//.test(appUrl) && !/localhost/i.test(appUrl),
    "APP_URL must be HTTPS and not localhost.",
);

addRequired(
    "YALLA_ADMIN_SECRET",
    has("YALLA_ADMIN_SECRET") && get("YALLA_ADMIN_SECRET") !== "change-me-in-production-long-random-string",
    "YALLA_ADMIN_SECRET must be set to a real secret.",
);

addRequired(
    "YALLA_ADMIN_USERNAME",
    has("YALLA_ADMIN_USERNAME"),
    "YALLA_ADMIN_USERNAME is required.",
);

const yallaAdminPassword = get("YALLA_ADMIN_PASSWORD");
addRequired(
    "YALLA_ADMIN_PASSWORD",
    has("YALLA_ADMIN_PASSWORD"),
    "YALLA_ADMIN_PASSWORD (bcrypt hash) is required.",
);

addRequired(
    "YALLA_ADMIN_PASSWORD_FORMAT",
    startsWithBcryptHash(yallaAdminPassword),
    "YALLA_ADMIN_PASSWORD should be a bcrypt hash (starts with $2a$, $2b$, or $2y$).",
);

const queueMode = get("AI_QUEUE_MODE") || "in_memory";
addRequired(
    "ALLOW_IN_MEMORY_PERSISTENCE",
    get("ALLOW_IN_MEMORY_PERSISTENCE").toLowerCase() === "false",
    "ALLOW_IN_MEMORY_PERSISTENCE should be false in production.",
);

if (queueMode === "redis") {
    addRequired(
        "REDIS_URL",
        has("REDIS_URL"),
        "REDIS_URL is required when AI_QUEUE_MODE=redis.",
    );

    addRequired(
        "REDIS_URL_FORMAT",
        isValidUrl(get("REDIS_URL"), ["redis:", "rediss:"]),
        "REDIS_URL must be a valid redis:// or rediss:// URL when AI_QUEUE_MODE=redis.",
    );
} else {
    addRecommended(
        "AI_QUEUE_MODE",
        queueMode === "redis",
        "AI_QUEUE_MODE=redis is recommended for production scale.",
    );
}

const stripeSecretKey = has("STRIPE_SECRET_KEY");
const stripeWebhookSecret = has("STRIPE_WEBHOOK_SECRET");
const configuredStripePrices = STRIPE_PRICE_KEYS.filter(has);
const stripeAnyConfigured = stripeSecretKey || stripeWebhookSecret || configuredStripePrices.length > 0;

if (stripeAnyConfigured) {
    addRequired(
        "STRIPE_SECRET_KEY",
        stripeSecretKey,
        "STRIPE_SECRET_KEY is required when Stripe is enabled.",
    );
    addRequired(
        "STRIPE_WEBHOOK_SECRET",
        stripeWebhookSecret,
        "STRIPE_WEBHOOK_SECRET is required when Stripe is enabled.",
    );

    for (const key of STRIPE_PRICE_KEYS) {
        addRequired(
            key,
            has(key),
            `${key} is required when Stripe is enabled.`,
        );
    }
} else {
    if (requireBilling) {
        addRequired(
            "STRIPE_BILLING",
            false,
            "Stripe billing is required in this run. Set STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, and all STRIPE_PRICE_* values.",
        );
    } else {
        addRecommended(
            "STRIPE_BILLING",
            false,
            "Stripe billing is disabled. Set STRIPE_* vars to enable monetization.",
        );
    }
}

const databasePoolSize = Number.parseInt(get("DATABASE_POOL_SIZE") || "0", 10);
addRecommended(
    "DATABASE_POOL_SIZE",
    Number.isFinite(databasePoolSize) && databasePoolSize >= 20,
    "DATABASE_POOL_SIZE >= 20 is recommended for production scale.",
);

addRecommended(
    "SENTRY_DSN",
    has("SENTRY_DSN"),
    "SENTRY_DSN is recommended for error monitoring.",
);

addRecommended(
    "SMTP_HOST",
    has("SMTP_HOST"),
    "SMTP_HOST is recommended for trial reminders and report delivery.",
);

addRecommended(
    "SMTP_USER",
    has("SMTP_USER"),
    "SMTP_USER is recommended with SMTP_HOST.",
);

addRecommended(
    "SMTP_PASS",
    has("SMTP_PASS"),
    "SMTP_PASS is recommended with SMTP_HOST.",
);

if (has("SMTP_HOST")) {
    addRequired(
        "SMTP_USER_WITH_HOST",
        has("SMTP_USER"),
        "SMTP_USER is required when SMTP_HOST is configured.",
    );

    addRequired(
        "SMTP_PASS_WITH_HOST",
        has("SMTP_PASS"),
        "SMTP_PASS is required when SMTP_HOST is configured.",
    );
}

function statusLabel(check) {
    if (check.ok) {
        return check.severity === "required" ? "PASS" : "OK";
    }
    return check.severity === "required" ? "FAIL" : "WARN";
}

const requiredFailures = checks.filter((c) => c.severity === "required" && !c.ok);
const recommendedWarnings = checks.filter((c) => c.severity === "recommended" && !c.ok);
const passed = checks.filter((c) => c.ok).length;

const blocked = requiredFailures.length > 0 || (failOnWarn && recommendedWarnings.length > 0);

if (jsonOutput) {
    console.log(JSON.stringify({
        tool: "djac-production-preflight",
        envFile: resolvedEnvFile,
        envFileLoaded: fs.existsSync(resolvedEnvFile),
        options: {
            failOnWarn,
            requireBilling,
        },
        summary: {
            checksTotal: checks.length,
            checksPassed: passed,
            requiredFailures: requiredFailures.length,
            recommendedWarnings: recommendedWarnings.length,
            blocked,
            readiness: blocked ? "BLOCKED" : "READY",
        },
        checks,
    }, null, 2));
    process.exitCode = blocked ? 1 : 0;
    process.exit();
}

console.log("=== DJAC Production Preflight ===");
console.log(`Working directory: ${process.cwd()}`);
console.log(`Env file: ${resolvedEnvFile} ${fs.existsSync(resolvedEnvFile) ? "(loaded)" : "(not found, using process env)"}`);
console.log(`Options: failOnWarn=${failOnWarn} requireBilling=${requireBilling}`);
console.log("");

for (const check of checks) {
    console.log(`[${statusLabel(check)}] ${check.key} - ${check.message}`);
}

console.log("");
console.log(`Checks passed: ${passed}/${checks.length}`);
console.log(`Required failures: ${requiredFailures.length}`);
console.log(`Recommended warnings: ${recommendedWarnings.length}`);

if (blocked) {
    console.log("");
    console.log("Deployment readiness: BLOCKED");
    process.exitCode = 1;
} else {
    console.log("");
    console.log("Deployment readiness: READY");
    process.exitCode = 0;
}
