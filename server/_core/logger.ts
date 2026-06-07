/**
 * DJAC Structured Logger — Pino-based
 *
 * Provides a single logger instance used across all server modules.
 * In production: structured JSON (machine-readable, ship to Loki/Datadog).
 * In development: pretty-printed coloured output.
 *
 * Usage:
 *   import { logger, childLogger } from "./_core/logger";
 *   logger.info({ userId: 1, action: "login" }, "User signed in");
 *   const reqLog = childLogger({ requestId: "abc" });
 */

import pino from "pino";
import { ENV } from "./env";

const isDev = ENV.isDevelopment;

// ── Transport config ──────────────────────────────────────────────────────────

const transport = isDev
    ? {
        target: "pino-pretty",
        options: {
            colorize: true,
            translateTime: "SYS:HH:MM:ss.l",
            ignore: "pid,hostname",
            messageFormat: "{msg}",
            singleLine: false,
        },
    }
    : undefined; // JSON to stdout in production — ship to log aggregator

// ── Root logger ───────────────────────────────────────────────────────────────

export const logger = pino(
    {
        level: isDev ? "debug" : "info",
        base: {
            service: "djac-tool",
            env: ENV.isProduction ? "production" : (ENV.isDevelopment ? "development" : "test"),
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
                "req.headers.cookie",
            ],
            censor: "[REDACTED]",
        },
        timestamp: pino.stdTimeFunctions.isoTime,
        serializers: {
            err: pino.stdSerializers.err,
            error: pino.stdSerializers.err,
            req: pino.stdSerializers.req,
            res: pino.stdSerializers.res,
        },
    },
    transport ? pino.transport(transport) : undefined,
);

// ── Helper: request-scoped child logger ──────────────────────────────────────

export function childLogger(bindings: Record<string, unknown>) {
    return logger.child(bindings);
}

// ── Typed log levels for structured events ────────────────────────────────────

export type LogCategory =
    | "auth"
    | "rbac"
    | "audit"
    | "billing"
    | "ai"
    | "report"
    | "vendor"
    | "compliance"
    | "system"
    | "http"
    | "db";

export function logEvent(
    category: LogCategory,
    action: string,
    data?: Record<string, unknown>,
    level: "info" | "warn" | "error" | "debug" = "info",
) {
    logger[level]({ category, action, ...data }, action);
}

export default logger;
