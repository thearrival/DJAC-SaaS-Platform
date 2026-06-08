import { createApp } from "../server/_core/index";

let cachedApp: any = null;
let initError: string | null = null;

export default async function handler(req: any, res: any) {
  const url = req.url || req.originalUrl || "";
  const path = (url as string).split("?")[0];

  if (path.startsWith("/api/health") || path.startsWith("/health")) {
    res.status(200).json({
      ok: true,
      status: "healthy",
      timestamp: new Date().toISOString(),
      service: "djac-tool",
      node: process.version,
    });
    return;
  }

  if (path.startsWith("/api/_debug")) {
    res.status(200).json({
      ok: true,
      url: req.url,
      path,
      method: req.method,
      headers: req.headers,
      node: process.version,
      pid: process.pid,
      memory: process.memoryUsage(),
    });
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
      } catch (e) {
        initError = e instanceof Error ? e.message : String(e);
        steps.error = initError;
        steps.stack = e instanceof Error ? e.stack : undefined;
      }
    }
    res.status(200).json({ ok: true, steps, initError, hasApp: !!cachedApp, node: process.version });
    return;
  }

  try {
    if (!cachedApp && !initError) {
      cachedApp = await createApp();
    }
    if (!cachedApp) {
      res.status(500).json({
        error: "Express app failed to initialize",
        message: initError,
      });
      return;
    }
    cachedApp(req, res);
  } catch (err) {
    console.error("[Handler] Fatal error:", err);
    res.status(500).json({
      error: "Internal server error",
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });
  }
}
