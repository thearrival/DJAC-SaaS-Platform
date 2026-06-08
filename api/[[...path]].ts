let cachedApp: any = null;

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

  try {
    if (!cachedApp) {
      const { createApp } = await import("../server/_core/index");
      cachedApp = await createApp();
    }
    cachedApp(req, res);
  } catch (err) {
    console.error("[Handler] Fatal error:", err);
    res.status(500).json({
      error: "Internal server error",
      message: err instanceof Error ? err.message : String(err),
    });
  }
}
