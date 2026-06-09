import "dotenv/config";
import { initialiseSentry, sentryErrorHandler } from "./sentry";
// Sentry must be initialised before any other imports so auto-instrumentation
// can wrap imported modules.
initialiseSentry();
import compression from "compression";
import express, { type NextFunction, type Request, type Response } from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { recordTrpcFailureEvent } from "../audit-logger";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { registerAssessmentWebSocketServer } from "../ai/ws";
import { getSystemReadiness } from "./readiness";
import { stripeWebhookHandler } from "../stripe-webhook";
import { startInteractionRetentionScheduler } from "../interaction-retention";
import { startTrialReminderScheduler } from "../trial-reminder-scheduler";
import { startDeadlineAlertScheduler } from "../deadline-alert-scheduler";
import { startReportScheduler } from "../report-scheduler";
import { closeAssessmentQueue } from "../ai/queueFactory";
import { ENV } from "./env";
import { parsedEnv } from "../services/config-schema";
import { closeDbPool } from "../db";
import { nanoid } from "nanoid";
import { checkRateLimit, closeRateLimiter } from "./rateLimiter";
import { getSecurityHeadersForRequest, shouldBypassApiRateLimit, getClientIp } from "./security";
import { createYallaAdminRouter } from "./yalla-admin-router";
import { checkProductionEnv } from "./env";
import path from "path";
import { fileURLToPath } from "url";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 120;

// Auth endpoints get a much stricter limit to mitigate brute-force attacks.
const AUTH_RATE_LIMIT_MAX = 10;
const AUTH_RATE_LIMIT_WINDOW_MS = 60_000;

// tRPC procedure names that constitute sensitive auth actions.
const AUTH_PROCEDURES = new Set([
  "localAuth.login",
  "localAuth.register",
  "localAuth.forgotPassword",
  "localAuth.resetPassword",
  "localAuth.enableMfa",
]);

function getClientKey(req: Request): string {
  return getClientIp(req);
}

// Redis-backed rate limiter (falls back to in-memory when Redis is unavailable).
function apiRateLimit(req: Request, res: Response, next: NextFunction) {
  if (!req.path.startsWith("/api/") || shouldBypassApiRateLimit(req.path)) {
    next();
    return;
  }

  const key = getClientKey(req);
  checkRateLimit(key, RATE_LIMIT_MAX_REQUESTS, RATE_LIMIT_WINDOW_MS)
    .then((result) => {
      res.setHeader("X-RateLimit-Limit", String(result.limit));
      res.setHeader("X-RateLimit-Remaining", String(result.remaining));
      res.setHeader("X-RateLimit-Reset", String(result.resetAt));
      if (!result.allowed) {
        const retryAfter = Math.max(1, result.resetAt - Math.floor(Date.now() / 1000));
        res.setHeader("Retry-After", String(retryAfter));
        res.status(429).json({ error: "Too many requests. Please retry shortly." });
        return;
      }
      next();
    })
    .catch(next);
}

// Strict rate limiter for authentication endpoints (brute-force protection).
function authRateLimit(req: Request, res: Response, next: NextFunction) {
  // Only applies to tRPC POST requests for auth procedures
  if (req.method !== "POST" || !req.path.startsWith("/api/trpc/")) {
    next();
    return;
  }
  // Extract procedure name from path: /api/trpc/localAuth.login?batch=...
  const procedure = req.path.replace("/api/trpc/", "").split("?")[0];
  if (!AUTH_PROCEDURES.has(procedure)) {
    next();
    return;
  }

  const key = `auth:${getClientKey(req)}`;
  checkRateLimit(key, AUTH_RATE_LIMIT_MAX, AUTH_RATE_LIMIT_WINDOW_MS)
    .then((result) => {
      if (!result.allowed) {
        const retryAfter = Math.max(1, result.resetAt - Math.floor(Date.now() / 1000));
        res.setHeader("Retry-After", String(retryAfter));
        res.status(429).json({ error: "Too many authentication attempts. Please wait before trying again." });
        return;
      }
      next();
    })
    .catch(next);
}

// Allowed CORS origins: production APP_URL + localhost ports in dev.
const CORS_ALLOWED_ORIGINS = new Set<string>([
  ENV.appUrl,
  ...(!ENV.isProduction
    ? ["http://localhost:3000", "http://localhost:3001"]
    : []),
].filter(Boolean));

function corsMiddleware(req: Request, res: Response, next: NextFunction) {
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

function securityHeaders(req: Request, res: Response, next: NextFunction) {
  const forwardedProto = req.headers["x-forwarded-proto"];
  const isHttps =
    req.protocol === "https" ||
    req.secure ||
    (typeof forwardedProto === "string" &&
      forwardedProto.split(",").some(value => value.trim() === "https"));

  const headers = getSecurityHeadersForRequest({
    pathname: req.path || req.originalUrl || "/",
    isHttps,
  });

  for (const [header, value] of Object.entries(headers)) {
    res.setHeader(header, value);
  }

  next();
}

export async function createApp() {
  checkProductionEnv();

  const app = express();
  app.set("trust proxy", true);

  // ─── Core middleware ────────────────────────────────────────────────────────
  app.disable("x-powered-by");

  app.use(
    compression({
      threshold: 1024,
      level: 6,
      filter(req, res) {
        if (req.headers.upgrade) return false;
        return compression.filter(req, res);
      },
    })
  );

  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader("X-Request-ID", nanoid(21));
    next();
  });

  app.use(corsMiddleware);
  app.use(securityHeaders);
  app.use(authRateLimit);
  app.use(apiRateLimit);

  // ─── Stripe webhook ─────────────────────────────────────────────────────────
  app.post(
    "/api/webhooks/stripe",
    express.raw({ type: "application/json" }),
    (req, res) => void stripeWebhookHandler(req, res),
  );

  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ limit: "2mb", extended: true }));

  // ─── Health / Readiness ─────────────────────────────────────────────────────
  const sendHealth = (_req: Request, res: Response) => {
    res.json({
      ok: true,
      status: "healthy",
      timestamp: new Date().toISOString(),
      service: "djac-tool",
      env: ENV.isProduction ? "production" : (ENV.isDevelopment ? "development" : "test"),
      scaleProfile: {
        databasePoolSize: ENV.databasePoolSize,
        redisConfigured: ENV.redisUrl.trim().length > 0,
        aiQueueMode: ENV.aiQueueMode,
      },
    });
  };

  const sendReadiness = async (_req: Request, res: Response) => {
    const readiness = await getSystemReadiness();
    res.status(readiness.ok ? 200 : 503).json({
      status: readiness.ok ? "ready" : "degraded",
      ...readiness,
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

  app.post("/api/csp-report", (_req: Request, _res: Response) => {
    _res.status(204).end();
  });

  // ─── tRPC ───────────────────────────────────────────────────────────────────
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
      onError({ error, path, type, input, ctx, req }) {
        void recordTrpcFailureEvent({
          ctx,
          path,
          type,
          code: error.code,
          message: error.message,
          procedureInput: input,
          issues: error.cause,
          headers: req.headers,
        });
      },
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
  server.headersTimeout = Math.max(ENV.httpHeadersTimeoutMs, ENV.httpKeepAliveTimeoutMs + 1_000);
  server.requestTimeout = ENV.httpRequestTimeoutMs;
  server.maxRequestsPerSocket = 1_000;

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

  server.on("error", (error: NodeJS.ErrnoException) => {
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
    void getSystemReadiness()
      .then((readiness) => {
        if (readiness.scaling.readyForHighScale) {
          console.info("[Scale] High-scale production profile is active.");
          return;
        }
        if (readiness.scaling.warnings.length > 0) {
          console.warn("[Scale] Readiness warnings:", readiness.scaling.warnings.join(" | "));
        }
      })
      .catch((error) => {
        console.warn("[Scale] Unable to evaluate readiness at startup:", error);
      });
  });
}

// Only start the HTTP server when run directly (not when imported by Vercel serverless handler).
const isMainModule = process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === path.resolve(import.meta.filename ?? fileURLToPath(import.meta.url));
if (isMainModule) {
  startServer().catch(console.error);
}

function shutdown(signal: string) {
  console.info(`[Server] ${signal} received — shutting down gracefully`);
  const forcedExit = setTimeout(() => {
      console.warn("[Server] Forced shutdown after 10s timeout");
      process.exit(1);
  }, 10_000);
  forcedExit.unref();
  Promise.all([closeDbPool(), closeRateLimiter(), closeAssessmentQueue()])
    .then(() => {
      console.info("[Server] Resources released — exiting.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("[Server] Shutdown error:", err);
      process.exit(1);
    });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
