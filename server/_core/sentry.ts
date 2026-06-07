/**
 * Sentry error monitoring — server-side initialisation.
 *
 * Initialises Sentry when SENTRY_DSN is provided; otherwise this is a no-op
 * so the server starts cleanly in dev / when Sentry is not configured.
 *
 * Import ORDER matters: this file must be imported BEFORE any other application
 * module so that Sentry can instrument them (auto-instrumentation, breadcrumbs).
 * In server/_core/index.ts add:
 *   import "./sentry";
 * as the very first local import.
 */

import * as Sentry from "@sentry/node";
import { ENV } from "./env";
import { parsedEnv } from "../services/config-schema";

export function initialiseSentry(): void {
    if (!ENV.sentryDsn) return;

    Sentry.init({
        dsn: ENV.sentryDsn,
        environment: parsedEnv.NODE_ENV ?? "production",
        // Trace 10 % of requests in production; 100 % in dev/staging for visibility.
        tracesSampleRate: ENV.isProduction ? 0.1 : 1.0,
        // Attach request data (URL, method, headers) to error events.
        includeLocalVariables: !ENV.isProduction,
    });

    console.info("[Sentry] Error monitoring initialised.");
}

/**
 * Express error handler that forwards unhandled errors to Sentry.
 * Mount AFTER all routes:
 *   app.use(sentryErrorHandler());
 */
export function sentryErrorHandler() {
    return Sentry.expressErrorHandler();
}
