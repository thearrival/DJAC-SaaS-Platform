import "dotenv/config";
import { initialiseSentry, sentryErrorHandler } from "./sentry";
// Sentry must be initialised before any other imports so auto-instrumentation
// can wrap imported modules.
initialiseSentry();
import compression from "compression";
import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
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
import { startOtpCleanupScheduler } from "../services/otp-cleanup";
import { closeAssessmentQueue } from "../ai/queueFactory";
import { ensureMigrated } from "./auto-migrate";
import { ENV } from "./env";
import { parsedEnv } from "../services/config-schema";
import { closeDbPool, getDbPoolStats } from "../db";
import { nanoid } from "nanoid";
import {
  checkRateLimit,
  closeRateLimiter,
  getRateLimiterStats,
} from "./rateLimiter";
import {
  getSecurityHeadersForRequest,
  getClientIp,
  parseCspReport,
} from "./security";
import { createYallaAdminRouter } from "./yalla-admin-router";
import { createAdminDashboardRouter } from "./admin-dashboard-router";
import { checkProductionEnv } from "./env";
import { logger } from "./logger";
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
  "localAuth.requestPasswordReset",
  "localAuth.resetPassword",
  "localAuth.sendOtp",
  "localAuth.verifyOtp",
  "localAuth.verifyTotp",
  "localAuth.confirm2fa",
  "localAuth.changePassword",
]);

function getClientKey(req: Request): string {
  return getClientIp(req);
}

// Paths that bypass the global API rate limiter (health, webhooks).
const RATE_LIMIT_BYPASS_PATHS = new Set([
  "/api/health",
  "/api/healthz",
  "/api/readiness",
  "/api/readyz",
  "/health",
  "/healthz",
  "/readiness",
  "/readyz",
  "/api/webhooks/stripe",
]);

function shouldBypassRateLimit(req: Request): boolean {
  if (!req.path.startsWith("/api/")) return true;
  const normalized = req.path.toLowerCase().split("?")[0];
  return RATE_LIMIT_BYPASS_PATHS.has(normalized);
}

// Redis-backed rate limiter (falls back to in-memory when Redis is unavailable).
function apiRateLimit(req: Request, res: Response, next: NextFunction) {
  if (shouldBypassRateLimit(req)) {
    next();
    return;
  }

  const key = getClientKey(req);
  checkRateLimit(key, RATE_LIMIT_MAX_REQUESTS, RATE_LIMIT_WINDOW_MS)
    .then(result => {
      res.setHeader("X-RateLimit-Limit", String(result.limit));
      res.setHeader("X-RateLimit-Remaining", String(result.remaining));
      res.setHeader("X-RateLimit-Reset", String(result.resetAt));
      if (!result.allowed) {
        const retryAfter = Math.max(
          1,
          result.resetAt - Math.floor(Date.now() / 1000)
        );
        res.setHeader("Retry-After", String(retryAfter));
        res
          .status(429)
          .json({ error: "Too many requests. Please retry shortly." });
        return;
      }
      next();
    })
    .catch(() => {
      // Allow request through if rate limiter itself fails
      next();
    });
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
    .then(result => {
      if (!result.allowed) {
        const retryAfter = Math.max(
          1,
          result.resetAt - Math.floor(Date.now() / 1000)
        );
        res.setHeader("Retry-After", String(retryAfter));
        res.status(429).json({
          error:
            "Too many authentication attempts. Please wait before trying again.",
        });
        return;
      }
      next();
    })
    .catch(next);
}

// Allowed CORS origins: production APP_URL + localhost ports in dev.
const CORS_ALLOWED_ORIGINS = new Set<string>(
  [
    ENV.appUrl,
    ...(!ENV.isProduction
      ? ["http://localhost:3000", "http://localhost:3001"]
      : []),
  ].filter(Boolean)
);

function corsMiddleware(req: Request, res: Response, next: NextFunction) {
  const origin = req.headers["origin"];
  if (origin && CORS_ALLOWED_ORIGINS.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Vary", "Origin");
  }
  if (req.method === "OPTIONS") {
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, PATCH, OPTIONS"
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Requested-With"
    );
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

  app.use((req: Request, res: Response, next: NextFunction) => {
    const requestId = nanoid(21);
    res.setHeader("X-Request-ID", requestId);
    const start = Date.now();
    res.on("finish", () => {
      const duration = Date.now() - start;
      logger.info(
        {
          requestId,
          method: req.method,
          path: req.path,
          status: res.statusCode,
          durationMs: duration,
          query: Object.keys(req.query).length ? req.query : undefined,
        },
        `${req.method} ${req.path} ${res.statusCode} ${duration}ms`
      );
    });
    next();
  });

  // ─── Docs subdomain routing ────────────────────────────────────────────────
  // When requests arrive on docs.app.yalla-hack.ae, rewrite paths so the SPA
  // serves the documentation portal without requiring the /docs prefix.
  //   docs.app.yalla-hack.ae                 → /docs (landing)
  //   docs.app.yalla-hack.ae/getting-started → /docs/getting-started
  //   app.yalla-hack.ae/docs                 → works natively
  app.use((req: Request, _res: Response, next: NextFunction) => {
    const host = req.hostname || req.headers.host || "";
    if (host.startsWith("docs.")) {
      const raw = req.path || "/";
      const rewritten = raw.startsWith("/docs") ? raw : `/docs${raw}`;
      // biome-ignore lint/suspicious/noExplicitAny: Express req.url property mutation
      (req as any).url = rewritten;
    }
    next();
  });

  app.use(corsMiddleware);
  app.use(securityHeaders);
  app.use(authRateLimit);
  app.use(apiRateLimit);

  // ─── Stripe webhook ─────────────────────────────────────────────────────────
  app.post(
    "/api/webhooks/stripe",
    express.raw({ type: "application/json", limit: "5mb" }),
    (req, res) => void stripeWebhookHandler(req, res)
  );

  // ─── CSP report collector (browsers send application/csp-report, not JSON) ──
  // On Vercel the serverless bridge may pre-parse JSON bodies (object), leave
  // them as raw Buffers/strings, or have consumed the stream entirely — so the
  // body is handled defensively here instead of relying on express.raw().
  app.post("/api/csp-report", (req: Request, res: Response) => {
    let raw: unknown;
    try {
      raw = req.body;
    } catch {
      res.status(204).end();
      return;
    }
    if (raw === undefined || raw === null || raw === "") {
      res.status(204).end();
      return;
    }

    let payload: unknown;
    try {
      if (Buffer.isBuffer(raw)) {
        payload = JSON.parse(raw.toString("utf-8"));
      } else if (typeof raw === "string") {
        payload = JSON.parse(raw);
      } else if (typeof raw === "object") {
        payload = raw;
      } else {
        res.status(204).end();
        return;
      }
    } catch {
      res.status(204).end();
      return;
    }

    const report = parseCspReport(payload);
    const isReportOnly = req.query.ro === "1";
    if (report && Object.keys(report).length > 0) {
      const blockedUri = report["blocked-uri"]
        ? String(report["blocked-uri"])
        : "unknown";
      const violatedDirective = report["violated-directive"]
        ? String(report["violated-directive"])
        : "unknown";
      const sourceFile = report["source-file"]
        ? String(report["source-file"])
        : "";
      logger.warn(
        {
          category: "security",
          cspReport: report,
          reportOnly: isReportOnly,
        },
        `CSP violation: ${violatedDirective} blocked ${blockedUri}${sourceFile ? ` in ${sourceFile}` : ""}`
      );
    }
    res.status(204).end();
  });

  // ─── Body parsing ─────────────────────────────────────────────────────────
  // Vercel's serverless runtime pre-parses application/json and consumes the
  // request stream before the handler runs. Calling express.json() on such a
  // request throws "InternalServerError: stream is not readable", which 500s
  // EVERY JSON POST (login, signup, tRPC mutations, billing, admin). Guard the
  // parsers so pre-parsed bodies pass straight through.
  const jsonParser = express.json({ limit: "2mb" });
  const urlencodedParser = express.urlencoded({ limit: "2mb", extended: true });
  app.use((req, res, next) => {
    if (typeof req.body === "object" && req.body !== null) {
      return next();
    }
    const ct = req.headers["content-type"] ?? "";
    if (ct.includes("application/json")) return jsonParser(req, res, next);
    if (ct.includes("application/x-www-form-urlencoded")) {
      return urlencodedParser(req, res, next);
    }
    return next();
  });
  // If the serverless runtime already consumed the stream (without setting
  // req.body), the parser throws "stream is not readable" — swallow it and
  // continue with an empty body rather than 500ing every request.
  app.use(
    (err: unknown, _req: Request, _res: Response, next: NextFunction): void => {
      if (err instanceof Error && err.message === "stream is not readable") {
        return next();
      }
      next(err);
    }
  );

  // ─── Health / Readiness ─────────────────────────────────────────────────────
  const sendHealth = (_req: Request, res: Response) => {
    res.json({
      ok: true,
      status: "healthy",
      timestamp: new Date().toISOString(),
      service: "djac-tool",
      env: ENV.isProduction
        ? "production"
        : ENV.isDevelopment
          ? "development"
          : "test",
      scaleProfile: {
        databasePoolSize: ENV.databasePoolSize,
        databasePoolStats: getDbPoolStats(),
        redisConfigured:
          typeof ENV.redisUrl === "string" && ENV.redisUrl.trim().length > 0,
        aiQueueMode: ENV.aiQueueMode,
      },
      rateLimiter: getRateLimiterStats(),
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
  app.use("/api/admin-dashboard", createAdminDashboardRouter());

  app.use(sentryErrorHandler());

  // Fallback error handler (4-arg) when Sentry is not configured or for errors
  // that escape the Sentry handler. Never leak stack traces to the client.
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    logger.error({ err }, "Unhandled Express error");
    res.status(500).json({
      error: ENV.isProduction
        ? "Internal server error"
        : err instanceof Error
          ? err.message
          : "Unknown error",
    });
  });

  return app;
}

// Scheduler stop functions are captured here so shutdown() can access them.
let _stopInteractionRetention: (() => void) | null = null;
let _stopTrialReminder: (() => void) | null = null;
let _stopDeadlineAlerts: (() => void) | null = null;
let _stopReportScheduler: (() => void) | null = null;
let _stopOtpCleanup: (() => void) | null = null;
let _cleanupAssessmentWs: (() => void) | null = null;
let _httpServer: ReturnType<typeof createServer> | null = null;

async function startServer() {
  const app = await createApp();
  const server = createServer(app);
  _httpServer = server;

  // Await DB migration before accepting traffic to avoid schema-inconsistent queries
  try {
    await ensureMigrated();
  } catch (err) {
    console.warn(
      "[Migrate] Migration failed, continuing with startup:",
      (err as Error).message
    );
  }

  server.keepAliveTimeout = ENV.httpKeepAliveTimeoutMs;
  server.headersTimeout = Math.max(
    ENV.httpHeadersTimeoutMs,
    ENV.httpKeepAliveTimeoutMs + 1_000
  );
  server.requestTimeout = ENV.httpRequestTimeoutMs;
  server.maxRequestsPerSocket = 1_000;

  _cleanupAssessmentWs = registerAssessmentWebSocketServer(server);
  _stopInteractionRetention = startInteractionRetentionScheduler();
  _stopTrialReminder = startTrialReminderScheduler();
  _stopDeadlineAlerts = startDeadlineAlertScheduler();
  _stopReportScheduler = startReportScheduler();
  _stopOtpCleanup = startOtpCleanupScheduler();

  server.on("close", () => {
    _cleanupAssessmentWs?.();
    _stopInteractionRetention?.();
    _stopTrialReminder?.();
    _stopDeadlineAlerts?.();
    _stopReportScheduler?.();
    _stopOtpCleanup?.();
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
    console.error("[Server] Fatal server error:", error);
    shutdown("SERVER_ERROR");
  });

  server.listen(port, () => {
    console.info(`Server running on http://localhost:${port}/`);
    void getSystemReadiness()
      .then(readiness => {
        if (readiness.scaling.readyForHighScale) {
          console.info("[Scale] High-scale production profile is active.");
          return;
        }
        if (readiness.scaling.warnings.length > 0) {
          console.warn(
            "[Scale] Readiness warnings:",
            readiness.scaling.warnings.join(" | ")
          );
        }
      })
      .catch(error => {
        console.warn("[Scale] Unable to evaluate readiness at startup:", error);
      });
  });
}

// Only start the HTTP server when run directly (not when imported by Vercel serverless handler).
const isMainModule =
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) ===
    path.resolve(import.meta.filename ?? fileURLToPath(import.meta.url));
if (isMainModule) {
  startServer().catch(console.error);
}

let _shuttingDown = false;

function shutdown(signal: string) {
  if (_shuttingDown) {
    console.warn(
      "[Server] Shutdown already in progress — ignoring duplicate signal"
    );
    return;
  }
  _shuttingDown = true;

  console.info(`[Server] ${signal} received — shutting down gracefully`);

  let forcedExit: ReturnType<typeof setTimeout> | null = setTimeout(() => {
    console.warn("[Server] Forced shutdown after 10s timeout");
    process.exit(1);
  }, 10_000);
  forcedExit.unref();

  // Close the HTTP server so it stops accepting new connections
  if (_httpServer) {
    _httpServer.close(() => {
      console.info("[Server] HTTP server closed.");
    });
  }

  // Stop background schedulers and WebSocket connections
  _stopInteractionRetention?.();
  _stopTrialReminder?.();
  _stopDeadlineAlerts?.();
  _stopReportScheduler?.();
  _stopOtpCleanup?.();
  _cleanupAssessmentWs?.();

  // Release resources (DB pool, Redis, AI queue)
  Promise.all([closeDbPool(), closeRateLimiter(), closeAssessmentQueue()])
    .then(() => {
      console.info("[Server] Resources released — exiting.");
      if (forcedExit) {
        clearTimeout(forcedExit);
        forcedExit = null;
      }
      process.exit(0);
    })
    .catch(err => {
      console.error("[Server] Shutdown error:", err);
      process.exit(1);
    });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("unhandledRejection", reason => {
  console.error("[Server] Unhandled rejection:", reason);
  shutdown("UNHANDLED_REJECTION");
});
process.on("uncaughtException", err => {
  console.error("[Server] Uncaught exception:", err);
  shutdown("UNCAUGHT_EXCEPTION");
});
