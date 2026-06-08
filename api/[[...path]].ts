let cachedApp: any = null;
let initError: string | null = null;

export default async function handler(req: any, res: any) {
  const url = req.url || req.originalUrl || "";
  const path = (url as string).split("?")[0];

  // Inline health endpoint: responds before Express initializes,
  // so Vercel can verify the function is alive even during cold starts.
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

  // Inline debug endpoint: shows request info for diagnostics.
  if (path.startsWith("/api/_debug")) {
    res.status(200).json({
      ok: true,
      url,
      path,
      method: req.method,
      headers: req.headers,
      node: process.version,
      pid: process.pid,
      memory: process.memoryUsage(),
    });
    return;
  }

  // Inline init-test endpoint: tests Express initialization step-by-step.
  if (path.startsWith("/api/_init")) {
    const steps: Record<string, any> = {};
    try {
      steps.importStart = Date.now();
      const mod = await import("../server/_core/index");
      steps.importOk = true;
      steps.importMs = Date.now() - steps.importStart;

      steps.createAppStart = Date.now();
      cachedApp = await mod.createApp();
      steps.createAppOk = true;
      steps.createAppMs = Date.now() - steps.createAppStart;
    } catch (e) {
      initError = e instanceof Error ? e.message : String(e);
      steps.error = initError;
      steps.stack = e instanceof Error ? e.stack : undefined;
    }
    res.status(200).json({ ok: true, steps, initError, hasApp: !!cachedApp, node: process.version });
    return;
  }

  try {
    if (!cachedApp) {
      const mod = await import("../server/_core/index");
      cachedApp = await mod.createApp();
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
