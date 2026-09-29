/**
 * Google OAuth callback (Express).
 *
 * Supabase redirects the *browser* back with `?code=…`, so this must be a real
 * HTTP route that sets the session cookie and 302-redirects into the app.
 * The previous tRPC-query callback returned JSON to the browser, so users would
 * have landed on a raw JSON blob after signing in with Google.
 *
 * The redirect target is user-supplied, so it is restricted to same-origin
 * absolute paths to prevent an open redirect.
 */
import type { Express, Request, Response } from "express";
import { COOKIE_NAME } from "../../shared/const";
import * as db from "../db";
import { getSupabaseClient } from "../services/supabase";
import { signJwt } from "../services/local-jwt";
import { broadcastSSE } from "../services/sse-bus";
import { recordSystemAuditEvent } from "../audit-logger";
import { checkRateLimit } from "./rateLimiter";
import { getSessionCookieOptions } from "./cookies";
import { logger } from "./logger";

// The callback is public and writes an audit row on every call, so without a
// limit it is both an abuse surface and an audit-log write amplifier.
const CALLBACK_RATE_LIMIT_MAX = 20;
const CALLBACK_RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;

function clientKey(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  const ip = raw?.split(",")[0]?.trim() || req.ip || "unknown";
  return `google-cb:${ip}`;
}

/** Only allow same-origin absolute paths (blocks `//evil.com` and `https://…`). */
export function safeRedirectTo(
  value: unknown,
  fallback = "/dashboard"
): string {
  if (typeof value !== "string" || value.length === 0) return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}

export function registerGoogleOAuthRoutes(app: Express) {
  app.get("/api/auth/google/callback", async (req: Request, res: Response) => {
    const code =
      typeof req.query.code === "string" ? req.query.code : undefined;
    const redirectTo = safeRedirectTo(req.query.redirectTo);

    const fail = (reason: string) => {
      logger.error({ reason }, "Google OAuth callback failed");
      // Audit failures too, so a broken provider/redirect is visible in the
      // audit trail rather than only in transient function logs.
      void recordSystemAuditEvent({
        category: "auth",
        action: "user.login",
        entityType: "users",
        outcome: "failure",
        payload: { method: "google", reason },
      });
      res.redirect(302, `/login?error=${encodeURIComponent(reason)}`);
    };

    if (!code) {
      fail("google_no_code");
      return;
    }

    // Throttle before touching the provider or the audit log.
    const rl = await checkRateLimit(
      clientKey(req),
      CALLBACK_RATE_LIMIT_MAX,
      CALLBACK_RATE_LIMIT_WINDOW_MS
    ).catch(() => ({ allowed: true }));
    if (!rl.allowed) {
      logger.warn({ ip: clientKey(req) }, "Google OAuth callback rate limited");
      res.redirect(302, "/login?error=google_rate_limited");
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      fail("google_not_configured");
      return;
    }

    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (error || !data?.user) {
        logger.error(
          { supaError: error?.message, status: error?.status },
          "Google code exchange failed"
        );
        fail("google_exchange_failed");
        return;
      }

      const supabaseUser = data.user;
      const openId = `google:${supabaseUser.id}`;
      const email = supabaseUser.email ?? "";
      const name =
        supabaseUser.user_metadata?.full_name ?? supabaseUser.email ?? "User";

      await db.upsertUser({
        openId,
        name,
        email,
        loginMethod: "google",
        role: "basic_user",
        status: "active",
        preferredLocale: "en",
      });

      const user = await db.getUserByOpenId(openId);
      if (!user) {
        fail("google_user_missing");
        return;
      }

      const token = await signJwt({
        sub: user.id,
        type: "oauth",
        userType: user.role ?? "basic_user",
        openId,
      });

      res.cookie(COOKIE_NAME, token, {
        ...getSessionCookieOptions(req),
        maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
      });

      try {
        broadcastSSE("user_login", {
          userId: user.id,
          email,
          method: "google",
          ts: new Date().toISOString(),
        });
      } catch {
        /* realtime notification is best-effort */
      }

      void recordSystemAuditEvent({
        category: "auth",
        action: "user.login",
        entityType: "users",
        entityId: user.id,
        outcome: "success",
        actorRole: user.role ?? "basic_user",
        payload: { method: "google", email },
      });

      res.redirect(302, redirectTo);
    } catch (err) {
      logger.error({ err }, "Google OAuth callback error");
      fail("google_error");
    }
  });
}
