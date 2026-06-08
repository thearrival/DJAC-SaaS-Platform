import IORedis from "ioredis";
import pg from "pg";
import { ENV, evaluateStripeBillingConfig } from "./env";
import { parsedEnv } from "../services/config-schema";
import { fixSslMode } from "./ssl-helper";

type ServiceReadiness = {
    enabled: boolean;
    ready: boolean;
    details: string;
};

type ScalingReadinessInput = {
    isProduction: boolean;
    hasRedis: boolean;
    databasePoolSize: number;
    allowInMemoryPersistenceFallback: boolean;
    aiQueueMode: "in_memory" | "redis";
};

export function evaluateScalingReadiness(input: ScalingReadinessInput) {
    const warnings: string[] = [];

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
            preferredAiQueueMode: "redis" as const,
        },
    };
}

async function checkDatabaseReadiness(): Promise<ServiceReadiness> {
    if (!ENV.databaseUrl) {
        const fallbackEnabled = ENV.allowInMemoryPersistenceFallback;
        return {
            enabled: false,
            ready: fallbackEnabled,
            details: fallbackEnabled
                ? "DATABASE_URL is not configured. In-memory fallback mode is active."
                : "DATABASE_URL is not configured.",
        };
    }

    let client: pg.Client | null = null;
    try {
        client = new pg.Client(fixSslMode(ENV.databaseUrl));
        await client.connect();
        await client.query("SELECT 1");

        return {
            enabled: true,
            ready: true,
            details: "Database connection successful (PostgreSQL).",
        };
    } catch (error) {
        if (ENV.allowInMemoryPersistenceFallback) {
            return {
                enabled: true,
                ready: true,
                details: `Database unavailable. In-memory fallback mode is active: ${String(
                    error
                )}`,
            };
        }

        return {
            enabled: true,
            ready: false,
            details: `Database connection failed: ${String(error)}`,
        };
    } finally {
        if (client) {
            await client.end().catch(() => undefined);
        }
    }
}

async function checkRedisReadiness(): Promise<ServiceReadiness> {
    if (ENV.aiQueueMode !== "redis") {
        return {
            enabled: false,
            ready: true,
            details: "Redis is not required for the current queue mode.",
        };
    }

    if (!ENV.redisUrl) {
        return {
            enabled: true,
            ready: false,
            details: "REDIS_URL is not configured.",
        };
    }

    const client = new IORedis(ENV.redisUrl, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
    });

    try {
        await client.connect();
        const pong = await client.ping();

        return {
            enabled: true,
            ready: pong === "PONG",
            details:
                pong === "PONG"
                    ? "Redis connection successful."
                    : `Unexpected Redis ping response: ${pong}`,
        };
    } catch (error) {
        return {
            enabled: true,
            ready: false,
            details: `Redis connection failed: ${String(error)}`,
        };
    } finally {
        client.disconnect();
    }
}

function checkBillingReadiness(): ServiceReadiness {
    const billing = evaluateStripeBillingConfig({
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

    if (!billing.enabled) {
        return {
            enabled: false,
            ready: true,
            details: "Stripe billing is disabled. No Stripe production configuration is present.",
        };
    }

    if (!billing.ready) {
        return {
            enabled: true,
            ready: false,
            details: `Stripe billing is partially configured. Missing: ${billing.missing.join(", ")}`,
        };
    }

    return {
        enabled: true,
        ready: true,
        details: `Stripe billing is fully configured with ${billing.configuredPriceCount} price ids.`,
    };
}

export async function getSystemReadiness() {
    const database = await checkDatabaseReadiness();
    const redis = await checkRedisReadiness();
    const billing = checkBillingReadiness();

    const aiOrchestrator = {
        enabled: ENV.aiOrchestratorEnabled,
        ready:
            ENV.aiOrchestratorEnabled &&
            (ENV.aiQueueMode !== "redis" || redis.ready),
        details: ENV.aiOrchestratorEnabled
            ? `Orchestrator enabled in ${ENV.aiQueueMode} mode.`
            : "AI orchestrator is disabled by configuration.",
        queueMode: ENV.aiQueueMode,
        websocketPath: ENV.aiWebsocketPath,
        agentSwarmConfigured: ENV.agentSwarmBaseUrl.trim().length > 0,
    };

    const scaling = evaluateScalingReadiness({
        isProduction: ENV.isProduction,
        hasRedis: ENV.redisUrl.trim().length > 0,
        databasePoolSize: ENV.databasePoolSize,
        allowInMemoryPersistenceFallback: ENV.allowInMemoryPersistenceFallback,
        aiQueueMode: ENV.aiQueueMode,
    });

    const ok = database.ready && aiOrchestrator.ready && redis.ready && billing.ready;

    return {
        ok,
        timestamp: new Date().toISOString(),
        scaling,
        services: {
            database,
            redis,
            billing,
            aiOrchestrator,
        },
    };
}
