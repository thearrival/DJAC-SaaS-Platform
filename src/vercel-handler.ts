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
    res.status(500).json({ error: "Internal server error", message: err instanceof Error ? err.message : String(err) });
  }
}
