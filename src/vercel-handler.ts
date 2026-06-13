import { createApp } from "../server/_core/index";
import { ensureMigrated } from "../server/_core/auto-migrate";

let cachedApp: any = null;
let initError: string | null = null;
let migrationRun = false;

function getPath(req: any): string {
  const url: string = req.url || "";
  const [base] = url.split("?");

  // When Vercel routes rewrite /api/(.*) → /api/index?api_path=$1,
  // the original API sub-path is in the api_path query parameter.
  if (base === "/api/index" || base === "/api/index/") {
    const qs = url.includes("?") ? url.slice(url.indexOf("?") + 1) : "";
    const params = new URLSearchParams(qs);
    const apiPath = params.get("api_path");
    if (apiPath) return "/api/" + apiPath;
  }

  return base;
}

export default async function handler(req: any, res: any) {
  const path = getPath(req);

  if (path.startsWith("/api/status")) {
    try {
      if (!cachedApp && !initError) cachedApp = await createApp();
      const dbModule = await import("../server/db");
      const db = await dbModule.getDb();
      const { ENV } = await import("../server/_core/env");
      res.status(200).json({
        ok: true,
        status: "healthy",
        timestamp: new Date().toISOString(),
        service: "djac-tool",
        node: process.version,
        uptime: process.uptime(),
        dbConnected: !!db,
        env: ENV.isProduction ? "production" : "development",
      });
    } catch (e) {
      res.status(500).json({ ok: false, error: e instanceof Error ? e.message : String(e) });
    }
    return;
  }

  if (path.startsWith("/api/health") || path.startsWith("/health")) {
    res.status(200).json({ ok: true, status: "healthy", timestamp: new Date().toISOString(), service: "djac-tool", node: process.version });
    return;
  }

  if (path.startsWith("/api/_debug")) {
    res.status(200).json({ ok: true, url: req.url, path, method: req.method, headers: req.headers, node: process.version, pid: process.pid, memory: process.memoryUsage() });
    return;
  }

  if (path.startsWith("/api/_init")) {
    const steps: Record<string, any> = {};
    if (!cachedApp && !initError) {
      try {
        steps.createStart = Date.now();
        cachedApp = await createApp();
        steps.createOk = true;
        steps.createMs = Date.now() - steps.createStart;
        if (!migrationRun) {
          migrationRun = true;
          void ensureMigrated();
        }
      } catch (e) {
        initError = e instanceof Error ? e.message : String(e);
        steps.error = initError;
      }
    }
    res.status(200).json({ ok: true, steps, initError, hasApp: !!cachedApp, node: process.version });
    return;
  }

  if (path.startsWith("/api/_stats")) {
    try {
      if (!cachedApp && !initError) cachedApp = await createApp();
      const db = await import("../server/db");
      const dbClient = await db.getDb();
      const stats: Record<string, unknown> = {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        node: process.version,
        dbConnected: !!dbClient,
      };
      if (dbClient) {
        try {
          const { sql } = await import("drizzle-orm");
          const userCount = await dbClient.execute(sql`SELECT COUNT(*)::int as count FROM "localUsers"`);
          const orgCount = await dbClient.execute(sql`SELECT COUNT(*)::int as count FROM "organizations"`);
          const fwCount = await dbClient.execute(sql`SELECT COUNT(*)::int as count FROM "frameworks"`);
          const vendorCount = await dbClient.execute(sql`SELECT COUNT(*)::int as count FROM "vendors"`);
          stats.users = (userCount.rows[0] as Record<string, unknown>).count;
          stats.organizations = (orgCount.rows[0] as Record<string, unknown>).count;
          stats.frameworks = (fwCount.rows[0] as Record<string, unknown>).count;
          stats.vendors = (vendorCount.rows[0] as Record<string, unknown>).count;
        } catch {
          stats.dbError = "Could not query database tables";
        }
      }
      res.status(200).json({ ok: true, ...stats });
    } catch (e) {
      res.status(500).json({ ok: false, error: e instanceof Error ? e.message : String(e) });
    }
    return;
  }

  if (path.startsWith("/api/_db-tables")) {
    try {
      if (!cachedApp && !initError) cachedApp = await createApp();
      const dbModule = await import("../server/db");
      const db = await dbModule.getDb();
      if (!db) { res.status(200).json({ ok: false, error: "Database not connected" }); return; }
      const { sql } = await import("drizzle-orm");
      const tables = await db.execute(sql`
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name
      `);
      const names = tables.rows.map((r: Record<string, unknown>) => r.table_name);
      res.status(200).json({ ok: true, count: names.length, tables: names, node: process.version });
    } catch (e) {
      res.status(500).json({ ok: false, error: e instanceof Error ? e.message : String(e) });
    }
    return;
  }

  if (path.startsWith("/api/_seed-controls")) {
    try {
      if (!cachedApp && !initError) cachedApp = await createApp();
      const dbModule = await import("../server/db");
      const db = await dbModule.getDb();
      if (!db) { res.status(200).json({ ok: false, error: "Database not connected" }); return; }

      const mod = await import("../scripts/compliance-reference-data.mjs");
      const controls = mod.complianceControls;
      const { sql } = await import("drizzle-orm");

      // Get framework code→id map
      const fwRows = await db.execute(sql`SELECT "id", "code" FROM "frameworks"`);
      const codeToId = new Map();
      for (const row of fwRows.rows) codeToId.set(row.code, row.id);

      // Ensure unique index
      await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS "complianceControls_frameworkId_controlCode_idx" ON "complianceControls" ("frameworkId", "controlCode")`);

      // Process in batches of 50 to stay under timeout
      const batchSize = 50;
      const offset = parseInt(req.query?.offset || "0", 10);
      const batch = controls.slice(offset, offset + batchSize);
      let seeded = 0;

      for (const ctrl of batch) {
        const fid = codeToId.get(ctrl.frameworkCode);
        if (!fid) continue;
        await db.execute(sql`
          INSERT INTO "complianceControls" ("frameworkId", "controlCode", "controlName", "category", "description", "requirement", "applicability")
          VALUES (${fid}, ${ctrl.controlCode}, ${ctrl.controlName}, ${ctrl.category ?? null}, ${ctrl.description ?? null}, ${ctrl.requirement ?? null}, ${ctrl.applicability ?? null})
          ON CONFLICT ("frameworkId", "controlCode") DO NOTHING
        `);
        seeded++;
      }

      const hasMore = offset + batchSize < controls.length;
      res.status(200).json({
        ok: true,
        seeded,
        offset,
        total: controls.length,
        hasMore,
        nextOffset: hasMore ? offset + batchSize : null,
      });
    } catch (e) {
      res.status(500).json({ ok: false, error: e instanceof Error ? e.message : String(e) });
    }
    return;
  }

  if (path.startsWith("/api/_preflight")) {
    try {
      const { ENV } = await import("../server/_core/env");
      const db = await import("../server/db");
      const dbClient = await db.getDb();
      const checks: Record<string, boolean> = {
        NODE_ENV_production: ENV.isProduction,
        JWT_SECRET_set: ENV.cookieSecret.length >= 32,
        DATABASE_URL_set: ENV.databaseUrl.length > 0,
        APP_URL_set: ENV.appUrl.length > 0,
        DB_connected: !!dbClient,
        billing_configured: ENV.stripeSecretKey.length > 0,
        redis_configured: ENV.redisUrl.length > 0,
        sentry_configured: ENV.sentryDsn.length > 0,
        smtp_configured: ENV.smtpHost.length > 0,
      };
      const allOk = Object.values(checks).every(Boolean);
      res.status(200).json({ ok: allOk, checks, node: process.version });
    } catch (e) {
      res.status(500).json({ ok: false, error: e instanceof Error ? e.message : String(e) });
    }
    return;
  }

  if (path.startsWith("/api/_migrate")) {
    try {
      if (!cachedApp && !initError) cachedApp = await createApp();
      await ensureMigrated();
      res.status(200).json({ ok: true, message: "Migration completed", node: process.version });
    } catch (e) {
      res.status(500).json({ ok: false, error: e instanceof Error ? e.message : String(e) });
    }
    return;
  }

  if (path.startsWith("/api/_dbcheck")) {
    try {
      if (!cachedApp && !initError) cachedApp = await createApp();
      const dbModule = await import("../server/db");
      const { ENV } = await import("../server/_core/env");
      const db = await dbModule.getDb();
      const dbUrl = ENV.databaseUrl;
      res.status(200).json({
        ok: !!db,
        hasApp: !!cachedApp,
        hasDbUrl: !!dbUrl,
        dbUrlPrefix: typeof dbUrl === "string" ? dbUrl.substring(0, 20) + "..." : "none",
        node: process.version,
      });
    } catch (e) {
      res.status(200).json({ ok: false, error: e instanceof Error ? e.message : String(e), node: process.version });
    }
    return;
  }

  try {
    if (!cachedApp && !initError) {
      cachedApp = await createApp();
      // Run migration synchronously before accepting any traffic
      if (!migrationRun) {
        migrationRun = true;
        await ensureMigrated();
      }
    }
    if (!cachedApp) { res.status(500).json({ error: "Express app failed to initialize", message: initError }); return; }
    cachedApp(req, res);
  } catch (err) {
    res.status(500).json({
      error: "Internal server error",
      message: err instanceof Error ? err.message : String(err),
      ref: `ERR-${Date.now().toString(36).toUpperCase()}`
    });
  }
}
