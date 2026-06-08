import { createApp } from "../server/_core/index";
import type { Express } from "express";

let cachedApp: Express | null = null;

export default async function handler(req: any, res: any) {
  // Inline health endpoint: responds before Express initializes,
  // so Vercel can verify the function is alive even during cold starts.
  if (req.url?.startsWith("/api/health") || req.url?.startsWith("/health")) {
    res.status(200).json({
      ok: true,
      status: "healthy",
      timestamp: new Date().toISOString(),
      service: "djac-tool",
    });
    return;
  }

  try {
    if (!cachedApp) {
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
