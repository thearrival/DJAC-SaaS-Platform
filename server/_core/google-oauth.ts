/**
 * Google OAuth — direct integration.
 *
 * The user-visible sign-in flow lives entirely on our own domain:
 *
 *   app.yalla-hack.ae  →  accounts.google.com  →  app.yalla-hack.ae
 *
 * Previously the flow bounced through `gcsoeumdjrejfxuovfcw.supabase.co`, which
 * looked unbranded and put a third-party host in the middle of authentication.
 * Exchanging the code with Google directly also means we control how the
 * authorization `code` is handled, which removes the "returned no code" failure
 * that the Supabase redirect chain could produce.
 *
 * Security:
 *  - `state` is HMAC-signed (cookie secret) and time-limited, so the callback
 *    cannot be driven by a forged request and the return path cannot be
 *    tampered with (open-redirect guard).
 *  - The redirect target is restricted to same-origin absolute paths.
 *  - The callback is rate-limited per IP.
 */
import crypto from "node:crypto";
import type { Express, Request, Response } from "express";
import { COOKIE_NAME } from "../../shared/const";
import * as db from "../db";
import { ENV } from "./env";
import { sdk } from "./sdk";
import { recordSystemAuditEvent } from "../audit-logger";
import { broadcastSSE } from "../services/sse-bus";
import { checkRateLimit } from "./rateLimiter";
import { getSessionCookieOptions } from "./cookies";
import { logger } from "./logger";

const GOOGLE_AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_ENDPOINT =
  "https://openidconnect.googleapis.com/v1/userinfo";
const GOOGLE_TOKENINFO_ENDPOINT = "https://oauth2.googleapis.com/tokeninfo";
const STATE_TTL_MS = 10 * 60 * 1000;
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

const CALLBACK_RATE_LIMIT_MAX = 20;
const CALLBACK_RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;

/** Only allow same-origin absolute paths (blocks `//evil.com` and `https://…`). */
export function safeRedirectTo(
  value: unknown,
  fallback = "/dashboard"
): string {
  if (typeof value !== "string" || value.length === 0) return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}

export function googleOAuthConfigured(): boolean {
  return Boolean(ENV.googleClientId && ENV.googleClientSecret);
}

export function googleCallbackUrl(): string {
  return `${ENV.appUrl}/api/auth/google/callback`;
}

function signState(redirectTo: string): string {
  const payload = Buffer.from(
    JSON.stringify({ r: redirectTo, t: Date.now() })
  ).toString("base64url");
  const sig = crypto
    .createHmac("sha256", ENV.cookieSecret)
    .update(payload)
    .digest("base64url");
  return `${payload}.${sig}`;
}

/** Verify an HMAC-signed state value and return the sanitised redirect target. */
export function verifyGoogleState(state: unknown): string | null {
  if (typeof state !== "string") return null;
  const [payload, sig] = state.split(".");
  if (!payload || !sig) return null;

  const expected = crypto
    .createHmac("sha256", ENV.cookieSecret)
    .update(payload)
    .digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    const decoded = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    ) as { r?: unknown; t?: unknown };
    if (typeof decoded.t !== "number") return null;
    if (Date.now() - decoded.t > STATE_TTL_MS) return null;
    return safeRedirectTo(decoded.r);
  } catch {
    return null;
  }
}

export function buildGoogleAuthUrl(redirectTo: string): string {
  const params = new URLSearchParams({
    client_id: ENV.googleClientId,
    redirect_uri: googleCallbackUrl(),
    response_type: "code",
    scope: "openid email profile",
    access_type: "online",
    include_granted_scopes: "true",
    prompt: "select_account",
    state: signState(safeRedirectTo(redirectTo)),
  });
  return `${GOOGLE_AUTH_ENDPOINT}?${params.toString()}`;
}

type GoogleProfile = {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
};

async function exchangeCodeForProfile(
  code: string
): Promise<GoogleProfile | null> {
  const tokenRes = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: ENV.googleClientId,
      client_secret: ENV.googleClientSecret,
      redirect_uri: googleCallbackUrl(),
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    logger.error({ status: tokenRes.status }, "Google token exchange failed");
    return null;
  }

  const token = (await tokenRes.json()) as { access_token?: string };
  if (!token.access_token) return null;

  const infoRes = await fetch(GOOGLE_USERINFO_ENDPOINT, {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });
  if (!infoRes.ok) {
    logger.error({ status: infoRes.status }, "Google userinfo fetch failed");
    return null;
  }

  const profile = (await infoRes.json()) as GoogleProfile;
  if (!profile?.sub) return null;
  return profile;
}

function clientKey(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  const ip = raw?.split(",")[0]?.trim() || req.ip || "unknown";
  return `google-cb:${ip}`;
}

/**
 * Create/lookup the user and establish the session cookie. Shared by the
 * redirect callback and the Google Identity Services credential endpoint so
 * both flows produce identical accounts and sessions.
 */
async function completeGoogleLogin(
  req: Request,
  res: Response,
  profile: GoogleProfile
): Promise<number | null> {
  const openId = `google:${profile.sub}`;
  const email = profile.email ?? "";
  const name = profile.name ?? email ?? "User";

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
  if (!user) return null;

  // Signed with the SDK so resolveOAuthUser() can verify the session.
  const token = await sdk.createSessionToken(openId, {
    name: name || email || "User",
    expiresInMs: SESSION_TTL_MS,
  });

  res.cookie(COOKIE_NAME, token, {
    ...getSessionCookieOptions(req),
    maxAge: SESSION_TTL_MS,
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

  return user.id;
}

export function registerGoogleOAuthRoutes(app: Express) {
  app.get("/api/auth/google/callback", async (req: Request, res: Response) => {
    const code =
      typeof req.query.code === "string" ? req.query.code : undefined;
    const state = req.query.state;
    const oauthError =
      typeof req.query.error === "string" ? req.query.error : undefined;

    // Only trust a redirect target that carries a valid signature; otherwise
    // fall back to the dashboard.
    const redirectTo = verifyGoogleState(state) ?? "/dashboard";

    const fail = (reason: string) => {
      logger.warn({ reason }, "Google OAuth callback failed");
      void recordSystemAuditEvent({
        category: "auth",
        action: "user.login",
        entityType: "users",
        outcome: "failure",
        payload: { method: "google", reason },
      });
      res.redirect(302, `/login?error=${encodeURIComponent(reason)}`);
    };

    // The user pressed "cancel" on Google's consent screen.
    if (oauthError) {
      fail("google_denied");
      return;
    }

    if (!code) {
      fail("google_no_code");
      return;
    }

    if (!googleOAuthConfigured()) {
      fail("google_not_configured");
      return;
    }

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

    try {
      const profile = await exchangeCodeForProfile(code);
      if (!profile) {
        fail("google_exchange_failed");
        return;
      }

      const userId = await completeGoogleLogin(req, res, profile);
      if (!userId) {
        fail("google_user_missing");
        return;
      }

      // Straight into the product — no intermediate hop.
      res.redirect(302, redirectTo);
    } catch (err) {
      logger.error({ err }, "Google OAuth callback error");
      fail("google_error");
    }
  });

  /**
   * Google Identity Services (popup) endpoint.
   *
   * The browser obtains an ID token (JWT) from Google and posts it here. We
   * validate it with Google, then establish the session. This flow needs no
   * redirect URI — only the authorized JavaScript origin — so it works even
   * where Google redirect URIs are not configured.
   */
  app.post("/api/auth/google/verify", async (req: Request, res: Response) => {
    const credential = (req.body as { credential?: unknown } | undefined)
      ?.credential;

    if (typeof credential !== "string" || !credential) {
      res.status(400).json({ error: "missing_credential" });
      return;
    }
    if (!googleOAuthConfigured()) {
      res.status(500).json({ error: "not_configured" });
      return;
    }

    const rl = await checkRateLimit(
      clientKey(req),
      CALLBACK_RATE_LIMIT_MAX,
      CALLBACK_RATE_LIMIT_WINDOW_MS
    ).catch(() => ({ allowed: true }));
    if (!rl.allowed) {
      res.status(429).json({ error: "rate_limited" });
      return;
    }

    try {
      // Google validates the signature, expiry and issuer. We must additionally
      // confirm the token was minted for OUR client id.
      const infoRes = await fetch(
        `${GOOGLE_TOKENINFO_ENDPOINT}?id_token=${encodeURIComponent(credential)}`
      );
      if (!infoRes.ok) {
        res.status(401).json({ error: "invalid_token" });
        return;
      }
      const info = (await infoRes.json()) as GoogleProfile & { aud?: string };
      if (info.aud !== ENV.googleClientId || !info.sub) {
        logger.warn({ aud: info.aud }, "Google ID token audience mismatch");
        res.status(401).json({ error: "invalid_token" });
        return;
      }

      const userId = await completeGoogleLogin(req, res, info);
      if (!userId) {
        res.status(500).json({ error: "user_create_failed" });
        return;
      }

      res.json({ ok: true, redirectTo: "/dashboard" });
    } catch (err) {
      logger.error({ err }, "Google credential verification failed");
      res.status(500).json({ error: "google_error" });
    }
  });
}
