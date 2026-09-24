/**
 * Yalla-Admin Internal Control Panel — Express Router
 *
 * Mounted at: /api/yalla-admin
 *
 * Security layers (outermost → innermost):
 *   1. URL secret token gate  — ?access_token=YALLA_ADMIN_SECRET (first visit only)
 *   2. IP allowlist           — YALLA_ADMIN_IP_ALLOWLIST env (optional CSV of CIDRs/IPs)
 *   3. Dedicated session JWT  — yalla_admin_session cookie (httpOnly, secure, sameSite=strict)
 *   4. Login rate limiting    — 5 attempts / 15 min lockout per IP
 *   5. Tamper-resistant audit — every action written to yallaAdminAuditLogs
 *
 * Endpoints:
 *   GET  /api/yalla-admin/bootstrap      — validate owner access token and set gate cookie
 *   POST /api/yalla-admin/login          — authenticate with username + password
 *   POST /api/yalla-admin/logout         — revoke session
 *   POST /api/yalla-admin/password/change — rotate founders password (DB override)
 *   GET  /api/yalla-admin/2fa/status     — is TOTP 2FA enabled?
 *   POST /api/yalla-admin/2fa/setup|confirm|disable|verify — TOTP 2FA lifecycle
 *   GET  /api/yalla-admin/stats/sessions — list active founder sessions
 *   POST /api/yalla-admin/sessions/:id/revoke — revoke a session
 *   POST /api/yalla-admin/access-links/generate — generate one-time signed owner access links
 *   GET  /api/yalla-admin/me             — current session info
 *   GET  /api/yalla-admin/stats/overview — platform-wide KPIs
 *   GET  /api/yalla-admin/stats/users    — user list with activity
 *   GET  /api/yalla-admin/stats/system   — API health & DB metrics
 *   GET  /api/yalla-admin/stats/audit    — audit log stream
 *   GET  /api/yalla-admin/stream         — SSE live event feed
 *   GET  /api/yalla-admin/export/csv     — data export
 *
 * Environment variables:
 *   YALLA_ADMIN_SECRET      — URL access token (required in prod)
 *   YALLA_ADMIN_USERNAME    — admin username (default: yalla_admin)
 *   YALLA_ADMIN_PASSWORD    — bcrypt hash of admin password (required in prod)
 *   YALLA_ADMIN_IP_ALLOWLIST — optional CSV of allowed IPs/CIDRs (e.g. "1.2.3.4,5.6.7.0/24")
 *   YALLA_ADMIN_JWT_SECRET  — signing secret for admin sessions (falls back to JWT_SECRET)
 *   YALLA_ADMIN_SESSION_TTL_HOURS — session TTL in hours (default: 8)
 */

import express, {
  type Request,
  type Response,
  type NextFunction,
  type Router,
} from "express";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { nanoid } from "nanoid";
import { parse as parseCookieHeader } from "cookie";
import {
  generateSecret as otpGenerateSecret,
  generateURI,
  verifySync as otpVerifySync,
} from "otplib";
import qrcode from "qrcode";
import { getDb } from "../db";
import {
  listAccessRequests,
  listConsultationRequests,
} from "../control-center-store";
import { ENV } from "./env";
import { logger } from "./logger";
import { sql } from "drizzle-orm";
import {
  checkRateLimit,
  getRateLimitCount,
  resetRateLimit,
} from "./rateLimiter";
import {
  broadcastSSE,
  addSSEClient,
  removeSSEClient,
  getSSEClientCount,
} from "../services/sse-bus";

// ─── Config ───────────────────────────────────────────────────────────────────

const ADMIN_SECRET = ENV.yallaAdminSecret;
const ADMIN_USERNAME = ENV.yallaAdminUsername;
const ADMIN_PASSWORD_HASH = ENV.yallaAdminPasswordHash;
const IP_ALLOWLIST_RAW = ENV.yallaAdminIpAllowlist;
const SESSION_TTL_H = ENV.yallaAdminSessionTtlHours;
const COOKIE_NAME = "yalla_admin_session";
const GATE_COOKIE_NAME = "yalla_admin_gate";
// Session cookie is shared by the /api/yalla-admin and /api/admin-dashboard
// routers, so it must be scoped to the shared /api prefix, not one router.
const ADMIN_COOKIE_PATH = "/api";

const jwtSecretStr =
  ENV.yallaAdminJwtSecret ||
  ENV.cookieSecret ||
  (ENV.isProduction ? "" : "yalla-admin-dev-secret-not-for-prod-change-me");
if (ENV.isProduction && !jwtSecretStr) {
  throw new Error(
    "[FATAL] YALLA_ADMIN_JWT_SECRET or JWT_SECRET must be set in production."
  );
}
const ADMIN_JWT_SECRET = new TextEncoder().encode(jwtSecretStr);

const IP_ALLOWLIST: string[] = IP_ALLOWLIST_RAW
  ? IP_ALLOWLIST_RAW.split(",")
      .map(s => s.trim())
      .filter(Boolean)
  : [];

const GATE_COOKIE_VALUE = ADMIN_SECRET
  ? createHash("sha256")
      .update(`yalla-admin-gate:${ADMIN_SECRET}`)
      .digest("hex")
  : "";

// Login lockout — Redis-backed via rateLimiter (shared across replicas,
// survives restarts) with a transparent in-memory fallback.
const MAX_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const loginFailKey = (ip: string): string => `admin-login-fail:${ip}`;
const usedOwnerLinkNonces = new Map<string, number>();

// In-memory session revocation set (sessionId -> revokedAt). Works even when
// the database is unavailable so logged-out sessions are rejected everywhere.
const revokedSessions = new Map<string, number>();

/** Prune revoked-session entries that have outlived the session TTL */
function pruneRevokedSessions(): void {
  const cutoff = Date.now() - SESSION_TTL_H * 3600 * 1000;
  for (const [id, revokedAt] of revokedSessions) {
    if (revokedAt < cutoff) revokedSessions.delete(id);
  }
  for (const [id, touched] of sessionLastTouch) {
    if (touched < cutoff) sessionLastTouch.delete(id);
  }
}

/** Mark a session revoked in memory (used alongside the DB revocation) */
export function revokeAdminSession(sessionId: string): void {
  revokedSessions.set(sessionId, Date.now());
}

/** True when the session id is revoked in memory */
export function isAdminSessionRevoked(sessionId: string): boolean {
  return revokedSessions.has(sessionId);
}

// Session activity tracking (throttled lastSeenAt updates, max 1 write/min)
const sessionLastTouch = new Map<string, number>();

/** Refresh `lastSeenAt` for a session — at most once per 60s per session. */
export function touchAdminSession(sessionId: string): void {
  const now = Date.now();
  const last = sessionLastTouch.get(sessionId) ?? 0;
  if (now - last < 60_000) return;
  sessionLastTouch.set(sessionId, now);
  void (async () => {
    try {
      const db = await getDb();
      if (!db) return;
      await db.execute(
        sql`UPDATE "yallaAdminSessions" SET "lastSeenAt" = NOW() WHERE id = ${sessionId}`
      );
    } catch {
      // Activity tracking must never break requests
    }
  })();
}

// General endpoint rate limiter (DoS protection for all admin routes)
const endpointRateMap = new Map<
  string,
  { count: number; windowStart: number }
>();
const ENDPOINT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const ENDPOINT_RATE_MAX = 300; // 300 requests per window per IP

// SSE clients are managed by the sse-bus service (server/services/sse-bus.ts)

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getClientIp(req: Request): string {
  // Behind Traefik, the proxy APPENDS the real client IP to X-Forwarded-For.
  // Always use the LAST entry (set by the trusted proxy), never the first
  // (which can be freely injected by the client to bypass rate limiting / IP allowlist).
  const hdr = req.headers["x-forwarded-for"];
  if (typeof hdr === "string") {
    const parts = hdr.split(",");
    return parts[parts.length - 1].trim();
  }
  if (Array.isArray(hdr)) return hdr[hdr.length - 1].trim();
  return req.socket.remoteAddress ?? "unknown";
}

// ─── Login lockout helpers (Redis-backed via rateLimiter) ────────────────────

/** Returns true (and sends 429) when the IP has exhausted its failure budget. */
async function isLoginLocked(ip: string, res: Response): Promise<boolean> {
  const count = await getRateLimitCount(loginFailKey(ip), LOCKOUT_WINDOW_MS);
  if (count >= MAX_ATTEMPTS) {
    const windowIndex = Math.floor(Date.now() / LOCKOUT_WINDOW_MS);
    const retryAfterSec = Math.max(
      1,
      Math.ceil(((windowIndex + 1) * LOCKOUT_WINDOW_MS - Date.now()) / 1000)
    );
    res.setHeader("Retry-After", String(retryAfterSec));
    res.status(429).json({
      error: `Too many failed attempts. Locked for ${Math.ceil(retryAfterSec / 60)} more minute(s).`,
      retryAfterSec,
    });
    return true;
  }
  return false;
}

/** Count one failed attempt against the IP's budget. */
async function recordLoginFailure(ip: string): Promise<void> {
  await checkRateLimit(loginFailKey(ip), MAX_ATTEMPTS, LOCKOUT_WINDOW_MS);
}

/** Clear the failure budget after a successful authentication. */
async function clearLoginFailures(ip: string): Promise<void> {
  await resetRateLimit(loginFailKey(ip), LOCKOUT_WINDOW_MS);
}

// ─── Founders-portal settings store (yallaAdminSettings table) ───────────────

async function getAdminSetting(key: string): Promise<string | null> {
  try {
    const db = await getDb();
    if (!db) return null;
    const result = await db.execute(
      sql`SELECT "value" FROM "yallaAdminSettings" WHERE "key" = ${key}`
    );
    const rows = result.rows as { value: string }[] | undefined;
    return rows?.[0]?.value ?? null;
  } catch {
    return null;
  }
}

async function setAdminSetting(key: string, value: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.execute(sql`
            INSERT INTO "yallaAdminSettings" ("key", "value", "updatedAt")
            VALUES (${key}, ${value}, NOW())
            ON CONFLICT ("key") DO UPDATE SET "value" = EXCLUDED."value", "updatedAt" = NOW()
        `);
}

async function deleteAdminSetting(key: string): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;
    await db.execute(
      sql`DELETE FROM "yallaAdminSettings" WHERE "key" = ${key}`
    );
  } catch {
    // best-effort
  }
}

/** Verify a password against the DB-rotated hash first, then the env hash. */
async function verifyAdminPassword(password: string): Promise<boolean> {
  const overrideHash = await getAdminSetting("passwordHash");
  if (overrideHash) return bcrypt.compare(password, overrideHash);
  if (ADMIN_PASSWORD_HASH) return bcrypt.compare(password, ADMIN_PASSWORD_HASH);
  if (ENV.isDevelopment) {
    const devPassword = process.env["YALLA_ADMIN_DEV_PASSWORD"] || "";
    return devPassword.length > 0 && password === devPassword;
  }
  return false;
}

async function isFounderMfaEnabled(): Promise<boolean> {
  return (await getAdminSetting("mfaEnabled")) === "1";
}

// ─── Session creation (shared by password login, MFA verify) ─────────────────

async function createAdminSession(
  req: Request,
  res: Response,
  ip: string,
  opts: { setGateCookie?: boolean; mfaVia?: "totp" | "backup" } = {}
): Promise<void> {
  const sessionId = nanoid(32);
  const expiresAt = new Date(Date.now() + SESSION_TTL_H * 3600 * 1000);
  const token = await signSession(sessionId, ADMIN_USERNAME);

  try {
    const db = await getDb();
    if (db) {
      await db.execute(sql`
                INSERT INTO "yallaAdminSessions" (id, "adminUsername", "ipAddress", "userAgent", "expiresAt")
                VALUES (${sessionId}, ${ADMIN_USERNAME}, ${ip}, ${req.headers["user-agent"] ?? null}, ${expiresAt})
            `);
    }
  } catch {
    logger.warn(
      "[YallaAdmin] Failed to persist session — login proceeds without DB"
    );
  }

  await auditLog(
    sessionId,
    ADMIN_USERNAME,
    "login.success",
    ip,
    undefined,
    opts.mfaVia ? { mfa: opts.mfaVia } : undefined
  );
  broadcastSSE("admin_login", {
    ip,
    mfa: opts.mfaVia ?? false,
    ts: new Date().toISOString(),
  });

  res.cookie(COOKIE_NAME, token, cookieOptions(req));
  if (opts.setGateCookie) setGateCookie(req, res);
  res.json({ ok: true, username: ADMIN_USERNAME, expiresAt });
}

function hashOwnerLinkNonce(nonce: string): string {
  return createHash("sha256").update(`yalla-admin-link:${nonce}`).digest("hex");
}

async function signSession(
  sessionId: string,
  username: string
): Promise<string> {
  return new SignJWT({ sub: username, sid: sessionId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_H}h`)
    .sign(ADMIN_JWT_SECRET);
}

export async function verifySession(
  token: string
): Promise<{ username: string; sessionId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, ADMIN_JWT_SECRET);
    return {
      username: payload.sub as string,
      sessionId: payload.sid as string,
    };
  } catch {
    return null;
  }
}

function cookieOptions(req: Request): object {
  const isHttps =
    req.secure ||
    (req.headers["x-forwarded-proto"] as string)?.split(",")[0]?.trim() ===
      "https";
  return {
    httpOnly: true,
    secure: isHttps,
    sameSite: "strict" as const,
    maxAge: SESSION_TTL_H * 3600 * 1000,
    path: ADMIN_COOKIE_PATH,
  };
}

async function auditLog(
  sessionId: string | null,
  adminUsername: string,
  action: string,
  ip: string,
  target?: string,
  payload?: unknown
): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;
    const payloadStr = payload ? JSON.stringify(payload) : null;
    await db.execute(sql`
            INSERT INTO "yallaAdminAuditLogs" ("sessionId", "adminUsername", "action", "target", "ipAddress", "payload")
            VALUES (${sessionId}, ${adminUsername}, ${action}, ${target ?? null}, ${ip}, ${payloadStr ? sql`CAST(${payloadStr} AS JSON)` : null})
        `);
  } catch {
    // Audit failures must never crash the server
  }
}

/** Public wrapper so other routers (e.g. admin-dashboard) can write admin audit entries. */
export async function auditAdminAction(
  sessionId: string | null,
  adminUsername: string,
  action: string,
  ip: string,
  target?: string,
  payload?: unknown
): Promise<void> {
  await auditLog(sessionId, adminUsername, action, ip, target, payload);
}

// broadcastSSE is imported from ../services/sse-bus

// ─── Middleware ───────────────────────────────────────────────────────────────

export function getAdminCookie(req: Request): string | undefined {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return undefined;
  const parsed = parseCookieHeader(cookieHeader);
  return parsed[COOKIE_NAME];
}

function getGateCookie(req: Request): string | undefined {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return undefined;
  const parsed = parseCookieHeader(cookieHeader);
  return parsed[GATE_COOKIE_NAME];
}

function getAccessToken(req: Request): string {
  const fromQuery =
    typeof req.query.access_token === "string"
      ? req.query.access_token.trim()
      : "";
  const fromBody =
    typeof req.body?.accessToken === "string"
      ? req.body.accessToken.trim()
      : "";
  const fromHeader =
    typeof req.headers["x-yalla-admin-access-token"] === "string"
      ? req.headers["x-yalla-admin-access-token"].trim()
      : "";
  return fromQuery || fromBody || fromHeader;
}

function getSignedAccessExpiry(req: Request): number | null {
  const raw =
    typeof req.query.expires === "string"
      ? req.query.expires.trim()
      : typeof req.body?.expires === "string"
        ? req.body.expires.trim()
        : typeof req.body?.expires === "number"
          ? String(req.body.expires)
          : "";
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.floor(parsed);
}

function getSignedAccessSignature(req: Request): string {
  const fromQuery =
    typeof req.query.sig === "string" ? req.query.sig.trim() : "";
  const fromBody = typeof req.body?.sig === "string" ? req.body.sig.trim() : "";
  return fromQuery || fromBody;
}

function getSignedAccessNonce(req: Request): string {
  const fromQuery =
    typeof req.query.nonce === "string" ? req.query.nonce.trim() : "";
  const fromBody =
    typeof req.body?.nonce === "string" ? req.body.nonce.trim() : "";
  return (fromQuery || fromBody).slice(0, 128);
}

function resolveRedirectTarget(req: Request): string {
  const raw =
    typeof req.query.redirect === "string"
      ? req.query.redirect.trim()
      : typeof req.body?.redirect === "string"
        ? req.body.redirect.trim()
        : "";
  if (!raw) return "/yalla-hack-owners-console/login";
  if (!raw.startsWith("/") || raw.startsWith("//"))
    return "/yalla-hack-owners-console/login";
  return raw;
}

function createSignedAccessSignature(
  redirectTarget: string,
  expiresAt: number,
  nonce = ""
): string {
  return createHmac("sha256", ADMIN_SECRET)
    .update(`${redirectTarget}:${expiresAt}:${nonce}`)
    .digest("hex");
}

function cleanupUsedOwnerLinkNonces(
  nowSeconds = Math.floor(Date.now() / 1000)
): void {
  for (const [nonce, expiresAt] of usedOwnerLinkNonces) {
    if (expiresAt < nowSeconds) {
      usedOwnerLinkNonces.delete(nonce);
    }
  }
}

function hasUsedOwnerLinkNonceInMemory(nonce: string): boolean {
  cleanupUsedOwnerLinkNonces();
  if (!nonce) return false;
  return usedOwnerLinkNonces.has(nonce);
}

function consumeOwnerLinkNonceInMemory(nonce: string, expiresAt: number): void {
  if (!nonce) return;
  cleanupUsedOwnerLinkNonces();
  usedOwnerLinkNonces.set(nonce, expiresAt);
}

async function hasUsedOwnerLinkNonce(nonce: string): Promise<boolean> {
  if (!nonce) return false;

  const db = await getDb();
  if (!db) {
    return hasUsedOwnerLinkNonceInMemory(nonce);
  }

  try {
    const nonceHash = hashOwnerLinkNonce(nonce);
    const linkResult = await db.execute(sql`
            SELECT id FROM "yallaAdminAccessLinkNonces"
            WHERE "nonceHash" = ${nonceHash}
            LIMIT 1
        `);
    const rows = linkResult.rows as { id: number }[];
    return Array.isArray(rows) && rows.length > 0;
  } catch {
    return hasUsedOwnerLinkNonceInMemory(nonce);
  }
}

async function consumeOwnerLinkNonce(
  req: Request,
  nonce: string,
  expiresAt: number,
  redirectTarget: string
): Promise<void> {
  if (!nonce) return;

  const db = await getDb();
  if (!db) {
    consumeOwnerLinkNonceInMemory(nonce, expiresAt);
    return;
  }

  try {
    const nonceHash = hashOwnerLinkNonce(nonce);
    await db.execute(sql`
            INSERT INTO "yallaAdminAccessLinkNonces" ("nonceHash", "redirectTarget", "expiresAt", "consumedByIp")
            VALUES (${nonceHash}, ${redirectTarget}, to_timestamp(${expiresAt}), ${getClientIp(req)})
        `);
  } catch {
    consumeOwnerLinkNonceInMemory(nonce, expiresAt);
  }
}

async function isValidSignedOwnerLink(req: Request): Promise<boolean> {
  if (!ADMIN_SECRET) return false;

  const expiresAt = getSignedAccessExpiry(req);
  const providedSignature = getSignedAccessSignature(req);
  const nonce = getSignedAccessNonce(req);
  if (!expiresAt || !providedSignature) return false;
  if (expiresAt < Math.floor(Date.now() / 1000)) return false;
  if (nonce && (await hasUsedOwnerLinkNonce(nonce))) return false;

  const redirectTarget = resolveRedirectTarget(req);
  const expectedSignature = createSignedAccessSignature(
    redirectTarget,
    expiresAt,
    nonce
  );
  const providedBuffer = Buffer.from(providedSignature, "hex");
  const expectedBuffer = Buffer.from(expectedSignature, "hex");
  if (
    providedBuffer.length === 0 ||
    providedBuffer.length !== expectedBuffer.length
  )
    return false;

  try {
    return timingSafeEqual(providedBuffer, expectedBuffer);
  } catch {
    return false;
  }
}

function setGateCookie(req: Request, res: Response): void {
  if (!ADMIN_SECRET || !GATE_COOKIE_VALUE) return;
  res.cookie(GATE_COOKIE_NAME, GATE_COOKIE_VALUE, cookieOptions(req));
}

function hasLinkGate(req: Request): boolean {
  if (!ADMIN_SECRET) return true;
  if (getGateCookie(req) === GATE_COOKIE_VALUE) return true;
  return getAccessToken(req) === ADMIN_SECRET;
}

/** Check URL secret token OR an active session cookie */
function tokenGate(req: Request, res: Response, next: NextFunction): void {
  // Public endpoints handle their own auth
  if (
    req.path === "/bootstrap" ||
    req.path === "/login" ||
    req.path === "/react-login" ||
    req.path === "/me" ||
    req.path === "/2fa/verify"
  ) {
    next();
    return;
  }

  // Check cookie session
  const cookie = getAdminCookie(req);
  if (cookie) {
    next();
    return;
  }

  if (hasLinkGate(req)) {
    next();
    return;
  }

  // Check URL access_token (allows initial visit without session)
  if (ADMIN_SECRET && req.query.access_token === ADMIN_SECRET) {
    next();
    return;
  }

  // Fallback: 401
  res.status(401).json({ error: "Unauthorized" });
}

/** Optional IP allowlist — exact match or proper IPv4 CIDR (no prefix bugs). */
function ipv4ToInt(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  let n = 0;
  for (const p of parts) {
    if (!/^\d{1,3}$/.test(p)) return null;
    const v = parseInt(p, 10);
    if (v < 0 || v > 255) return null;
    n = ((n << 8) | v) >>> 0;
  }
  return n >>> 0;
}

function ipMatchesEntry(ip: string, entry: string): boolean {
  // Normalise IPv4-mapped IPv6 (::ffff:1.2.3.4) to plain IPv4
  const normalisedIp = ip.startsWith("::ffff:") ? ip.slice(7) : ip;
  if (normalisedIp === entry) return true;
  if (!entry.includes("/")) return false;

  const [rangeRaw, bitsRaw] = entry.split("/");
  const bits = parseInt(bitsRaw, 10);
  if (Number.isNaN(bits) || bits < 0 || bits > 32) return false;
  const range = rangeRaw.startsWith("::ffff:") ? rangeRaw.slice(7) : rangeRaw;
  const ipNum = ipv4ToInt(normalisedIp);
  const rangeNum = ipv4ToInt(range);
  if (ipNum === null || rangeNum === null) return false;
  if (bits === 0) return true;
  const mask = ~((1 << (32 - bits)) - 1) >>> 0;
  return (ipNum & mask) === (rangeNum & mask);
}

/** True when the IP passes the configured allowlist (empty list = allow all). */
export function isIpAllowed(ip: string): boolean {
  if (IP_ALLOWLIST.length === 0) return true;
  return IP_ALLOWLIST.some(entry => ipMatchesEntry(ip, entry));
}

function ipAllowlist(req: Request, res: Response, next: NextFunction): void {
  if (IP_ALLOWLIST.length === 0) {
    next();
    return;
  }
  if (!isIpAllowed(getClientIp(req))) {
    res.status(403).json({ error: "Access denied from this IP address." });
    return;
  }
  next();
}

function ownerPortalHeaders(
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, private"
  );
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive, nosnippet");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "0");
  // Prevents the browser from loading any sub-resources from these JSON API responses
  // and blocks embedding in any frame (defense-in-depth alongside X-Frame-Options: DENY).
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'none'; frame-ancestors 'none'"
  );
  // Disable all browser features — not needed for an API endpoint.
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()"
  );
  next();
}

function adminEndpointRateLimit(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const ip = getClientIp(req);
  const now = Date.now();
  const entry = endpointRateMap.get(ip);
  if (!entry || now - entry.windowStart > ENDPOINT_WINDOW_MS) {
    endpointRateMap.set(ip, { count: 1, windowStart: now });
    next();
    return;
  }
  entry.count++;
  if (entry.count > ENDPOINT_RATE_MAX) {
    const retryAfterSec = Math.ceil(
      (ENDPOINT_WINDOW_MS - (Date.now() - entry.windowStart)) / 1000
    );
    res.setHeader("Retry-After", String(retryAfterSec));
    res
      .status(429)
      .json({ error: "Too many requests. Slow down.", retryAfterSec });
    return;
  }
  next();
}

/** Reject mutating requests that are not application/json (CSRF defense-in-depth) */
function requireJsonContentType(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (req.method === "POST" || req.method === "PUT" || req.method === "PATCH") {
    const ct = req.headers["content-type"] ?? "";
    if (!ct.includes("application/json")) {
      res.status(415).json({ error: "Content-Type must be application/json" });
      return;
    }
  }
  next();
}

/** Require authenticated session for all endpoints except public ones */
async function requireSession(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (
    req.path === "/bootstrap" ||
    req.path === "/login" ||
    req.path === "/react-login" ||
    req.path === "/me" ||
    req.path === "/2fa/verify"
  ) {
    next();
    return;
  }

  const token = getAdminCookie(req);
  if (!token) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const parsed = await verifySession(token);
  if (!parsed) {
    res.status(401).json({ error: "Session expired or invalid" });
    return;
  }

  pruneRevokedSessions();
  if (isAdminSessionRevoked(parsed.sessionId)) {
    res.status(401).json({ error: "Session revoked or expired" });
    return;
  }

  // Check session is not revoked
  try {
    const db = await getDb();
    if (db) {
      const sessionResult = await db.execute(sql`
                SELECT "isRevoked" FROM "yallaAdminSessions"
                WHERE id = ${parsed.sessionId} AND "expiresAt" > NOW()
                LIMIT 1
            `);
      const rows = sessionResult.rows as { isRevoked: number }[] | undefined;
      if (!rows || rows.length === 0 || rows[0]?.isRevoked) {
        res.status(401).json({ error: "Session revoked or expired" });
        return;
      }
    }
  } catch {
    logger.warn("[YallaAdmin] Session DB check failed — allowing through");
  }

  (req as Request & { adminSession?: typeof parsed }).adminSession = parsed;
  touchAdminSession(parsed.sessionId);
  next();
}

// ─── Route handlers ───────────────────────────────────────────────────────────

async function handleBootstrap(req: Request, res: Response): Promise<void> {
  const ip = getClientIp(req);
  const token = getAccessToken(req);
  const redirectTarget = resolveRedirectTarget(req);
  const mode =
    typeof req.query.mode === "string"
      ? req.query.mode.trim().toLowerCase()
      : "redirect";
  const hasSignedLink = await isValidSignedOwnerLink(req);
  const nonce = getSignedAccessNonce(req);
  const expiresAt = getSignedAccessExpiry(req);

  if (!ADMIN_SECRET) {
    if (mode === "json") {
      res.json({ ok: true, redirectTo: redirectTarget, gateEnabled: false });
      return;
    }
    res.redirect(302, redirectTarget);
    return;
  }

  if (token !== ADMIN_SECRET && !hasSignedLink) {
    await auditLog(null, "unknown", "access_link.rejected", ip, redirectTarget);
    if (mode === "json") {
      res.status(403).json({ error: "Invalid owner access link." });
      return;
    }
    res.status(403).send("Invalid owner access link.");
    return;
  }

  setGateCookie(req, res);
  if (hasSignedLink && nonce && expiresAt) {
    await consumeOwnerLinkNonce(req, nonce, expiresAt, redirectTarget);
  }
  await auditLog(
    null,
    "owner_gate",
    "access_link.accepted",
    ip,
    redirectTarget,
    {
      mode: hasSignedLink ? "signed" : "raw_secret",
      expires: expiresAt,
      isOneTime: Boolean(nonce),
    }
  );
  broadcastSSE("owner_gate_accepted", {
    ip,
    redirectTo: redirectTarget,
    mode: hasSignedLink ? "signed" : "raw_secret",
    isOneTime: Boolean(nonce),
    ts: new Date().toISOString(),
  });

  if (mode === "json") {
    res.json({ ok: true, redirectTo: redirectTarget, gateEnabled: true });
    return;
  }

  res.redirect(302, redirectTarget);
}

async function handleLogin(req: Request, res: Response): Promise<void> {
  const { username, password } = req.body ?? {};
  const ip = getClientIp(req);

  if (!hasLinkGate(req)) {
    await auditLog(
      null,
      typeof username === "string" ? username : "unknown",
      "login.link_denied",
      ip
    );
    res.status(403).json({
      error: "Use the private owner access link before attempting to sign in.",
    });
    return;
  }

  if (typeof username !== "string" || typeof password !== "string") {
    res.status(400).json({ error: "Username and password are required." });
    return;
  }

  // Guard against bcrypt DoS via extremely long inputs (bcrypt is O(n) on long strings)
  if (username.length > 128 || password.length > 256) {
    res.status(400).json({ error: "Invalid credentials format." });
    return;
  }

  if (await isLoginLocked(ip, res)) return;

  const usernameOk = username === ADMIN_USERNAME;
  const passwordOk = usernameOk && (await verifyAdminPassword(password));

  if (!usernameOk || !passwordOk) {
    await recordLoginFailure(ip);
    await auditLog(null, username, "login.failed", ip);
    res.status(401).json({ error: "Invalid credentials." });
    return;
  }

  await clearLoginFailures(ip);

  if (await isFounderMfaEnabled()) {
    const pendingToken = await new SignJWT({
      sub: ADMIN_USERNAME,
      purpose: "yalla-totp-challenge",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("5m")
      .sign(ADMIN_JWT_SECRET);
    await auditLog(null, ADMIN_USERNAME, "login.mfa_challenge", ip);
    res.json({ ok: false, mfaRequired: true, pendingToken });
    return;
  }

  await createAdminSession(req, res, ip, { setGateCookie: true });
}

/**
 * React UI login — bypasses the URL token gate but enforces:
 * - IP allowlist (via middleware)
 * - Rate limiting (via middleware)
 * - Login lockout after failed attempts
 * - Username + password validation
 * - Session creation + audit logging
 */
async function handleReactLogin(req: Request, res: Response): Promise<void> {
  const { username, password } = req.body ?? {};
  const ip = getClientIp(req);

  if (typeof username !== "string" || typeof password !== "string") {
    res.status(400).json({ error: "Username and password are required." });
    return;
  }

  if (username.length > 128 || password.length > 256) {
    res.status(400).json({ error: "Invalid credentials format." });
    return;
  }

  if (await isLoginLocked(ip, res)) return;

  const usernameOk = username === ADMIN_USERNAME;
  const passwordOk = usernameOk && (await verifyAdminPassword(password));

  if (!usernameOk || !passwordOk) {
    await recordLoginFailure(ip);
    await auditLog(null, username, "login.failed", ip);
    res.status(401).json({ error: "Invalid credentials." });
    return;
  }

  await clearLoginFailures(ip);

  if (await isFounderMfaEnabled()) {
    const pendingToken = await new SignJWT({
      sub: ADMIN_USERNAME,
      purpose: "yalla-totp-challenge",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("5m")
      .sign(ADMIN_JWT_SECRET);
    await auditLog(null, ADMIN_USERNAME, "login.mfa_challenge", ip);
    res.json({ ok: false, mfaRequired: true, pendingToken });
    return;
  }

  await createAdminSession(req, res, ip);
}

async function handleLogout(req: Request, res: Response): Promise<void> {
  const session = (
    req as Request & { adminSession?: { username: string; sessionId: string } }
  ).adminSession;
  const ip = getClientIp(req);

  if (session) {
    revokeAdminSession(session.sessionId);
    try {
      const db = await getDb();
      if (db) {
        await db.execute(sql`
                    UPDATE "yallaAdminSessions" SET "isRevoked" = 1 WHERE id = ${session.sessionId}
                `);
      }
    } catch {
      logger.warn("[YallaAdmin] Logout DB session cleanup failed");
    }
    await auditLog(session.sessionId, session.username, "logout", ip);
  }

  res.clearCookie(COOKIE_NAME, { path: ADMIN_COOKIE_PATH });
  res.clearCookie(GATE_COOKIE_NAME, { path: ADMIN_COOKIE_PATH });
  res.json({ ok: true });
}

async function handleMe(req: Request, res: Response): Promise<void> {
  const token = getAdminCookie(req);
  if (!token) {
    res.json({ authenticated: false });
    return;
  }
  const session = await verifySession(token);
  if (!session) {
    res.json({ authenticated: false });
    return;
  }
  if (isAdminSessionRevoked(session.sessionId)) {
    res.clearCookie(COOKIE_NAME, { path: ADMIN_COOKIE_PATH });
    res.json({ authenticated: false });
    return;
  }
  // Defense-in-depth: verify session is not revoked in DB (catches stolen-cookie scenarios)
  try {
    const db = await getDb();
    if (db) {
      const sessionResult = await db.execute(sql`
                SELECT "isRevoked" FROM "yallaAdminSessions"
                WHERE id = ${session.sessionId} AND "expiresAt" > NOW()
                LIMIT 1
            `);
      const rows = sessionResult.rows as { isRevoked: number }[] | undefined;
      if (!rows || rows.length === 0 || rows[0]?.isRevoked) {
        res.clearCookie(COOKIE_NAME, { path: ADMIN_COOKIE_PATH });
        res.json({ authenticated: false });
        return;
      }
    }
  } catch {
    logger.warn(
      "[YallaAdmin] Session check DB unavailable — returning cached session"
    );
  }
  res.json({ authenticated: true, username: session.username });
}

async function handleOverview(_req: Request, res: Response): Promise<void> {
  try {
    const db = await getDb();
    if (!db) {
      res.json({});
      return;
    }

    const usersResult = await db.execute(
      sql`SELECT COUNT(*) as total FROM "localUsers"`
    );
    const usersRow = usersResult.rows as { total: number }[];
    const orgsResult = await db.execute(
      sql`SELECT COUNT(*) as total FROM "organizations"`
    );
    const orgsRow = orgsResult.rows as { total: number }[];
    const todayLoginsResult = await db.execute(sql`
            SELECT COUNT(*) as total FROM "auditLogs"
            WHERE action = 'auth.login' AND "createdAt" >= CURRENT_DATE
        `);
    const todayLoginsRow = todayLoginsResult.rows as { total: number }[];
    const serviceRequestsResult = await db.execute(sql`
            SELECT COUNT(*) as total FROM "serviceRequests" WHERE status NOT IN ('completed', 'cancelled')
        `);
    const serviceRequestsRow = serviceRequestsResult.rows as {
      total: number;
    }[];
    const assetsResult = await db.execute(
      sql`SELECT COUNT(*) as total FROM "assetInventory"`
    );
    const assetsRow = assetsResult.rows as { total: number }[];

    const todaySignupsResult = await db.execute(sql`
            SELECT COUNT(*) as total FROM "localUsers" WHERE "createdAt"::date = CURRENT_DATE
        `);
    const todaySignupsRow = todaySignupsResult.rows as { total: number }[];
    const newOrgsResult = await db.execute(sql`
            SELECT COUNT(*) as total FROM "organizations" WHERE "createdAt"::date = CURRENT_DATE
        `);
    const newOrgsRow = newOrgsResult.rows as { total: number }[];
    const revenueResult = await db.execute(sql`
            SELECT COUNT(*) as total FROM "organizations" WHERE plan IN ('professional','enterprise') AND "isActive" = 1
        `);
    const revenueRow = revenueResult.rows as { total: number }[];
    const activeSessionsResult = await db.execute(sql`
            SELECT COUNT(*) as total FROM "yallaAdminSessions"
            WHERE "isRevoked" = 0 AND "expiresAt" > NOW()
        `);
    const activeSessionsRow = activeSessionsResult.rows as { total: number }[];

    res.json({
      totalUsers: usersRow?.[0]?.total ?? 0,
      totalOrgs: orgsRow?.[0]?.total ?? 0,
      activeSessions: activeSessionsRow?.[0]?.total ?? 0,
      todayLogins: todayLoginsRow?.[0]?.total ?? 0,
      openServiceRequests: serviceRequestsRow?.[0]?.total ?? 0,
      totalAssets: assetsRow?.[0]?.total ?? 0,
      todaySignups: todaySignupsRow?.[0]?.total ?? 0,
      newOrgsToday: newOrgsRow?.[0]?.total ?? 0,
      paidOrgs: revenueRow?.[0]?.total ?? 0,
    });
  } catch {
    res.status(500).json({ error: "Failed to fetch overview stats" });
  }
}

async function handleUsers(req: Request, res: Response): Promise<void> {
  try {
    const db = await getDb();
    if (!db) {
      res.json([]);
      return;
    }
    const limit = Math.min(
      parseInt((req.query.limit as string) ?? "50", 10) || 50,
      200
    );
    const offset = parseInt((req.query.offset as string) ?? "0", 10) || 0;

    const usersDbResult = await db.execute(sql`
            SELECT
                u.id,
                u.name AS username,
                u.email,
                u."userType" AS role,
                u.status,
                u."mfaEnabled" AS "isMfaEnabled",
                u."createdAt",
                u."lastSignedIn" AS "lastLoginAt",
                0 AS "activeSessions"
            FROM "localUsers" u
            ORDER BY u."createdAt" DESC
            LIMIT ${limit} OFFSET ${offset}
        `);
    const users = usersDbResult.rows as unknown[];

    res.json(users ?? []);
  } catch {
    res.status(500).json({ error: "Failed to fetch users" });
  }
}

async function handleSystem(_req: Request, res: Response): Promise<void> {
  try {
    const db = await getDb();
    const uptime = process.uptime();
    const mem = process.memoryUsage();

    let dbStatus = "unavailable";
    let dbVersion = "";
    let tableCount = 0;

    if (db) {
      try {
        const versionResult = await db.execute(sql`SELECT version() as v`);
        const vRow = versionResult.rows as { v: string }[];
        dbVersion = vRow?.[0]?.v ?? "";
        const tableResult = await db.execute(sql`
                    SELECT COUNT(*) as c FROM information_schema.tables
                    WHERE table_schema = 'public'
                `);
        const tRow = tableResult.rows as { c: number }[];
        tableCount = tRow?.[0]?.c ?? 0;
        dbStatus = "healthy";
      } catch {
        dbStatus = "error";
      }
    }

    res.json({
      uptime: Math.round(uptime),
      uptimeFormatted: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
      memory: {
        rss: Math.round(mem.rss / 1024 / 1024),
        heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
        heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
        external: Math.round(mem.external / 1024 / 1024),
      },
      db: { status: dbStatus, version: dbVersion, tableCount },
      env: {
        nodeEnv: ENV.isProduction
          ? "production"
          : ENV.isDevelopment
            ? "development"
            : "test",
        aiQueueMode: ENV.aiQueueMode,
        redisConfigured: ENV.redisUrl.trim().length > 0,
        databasePoolSize: ENV.databasePoolSize,
      },
      sseClients: getSSEClientCount(),
    });
  } catch {
    res.status(500).json({ error: "Failed to fetch system info" });
  }
}

async function handleAudit(req: Request, res: Response): Promise<void> {
  try {
    const db = await getDb();
    if (!db) {
      res.json([]);
      return;
    }
    const limit = Math.min(
      parseInt((req.query.limit as string) ?? "100", 10) || 100,
      500
    );
    const action = req.query.action as string | undefined;

    const auditResult = await db.execute(
      action
        ? sql`SELECT * FROM "yallaAdminAuditLogs" WHERE action = ${action} ORDER BY "createdAt" DESC LIMIT ${limit}`
        : sql`SELECT * FROM "yallaAdminAuditLogs" ORDER BY "createdAt" DESC LIMIT ${limit}`
    );
    const rows = auditResult.rows as unknown[];

    res.json(rows ?? []);
  } catch {
    res.status(500).json({ error: "Failed to fetch audit logs" });
  }
}

async function handlePlatformAudit(req: Request, res: Response): Promise<void> {
  try {
    const db = await getDb();
    if (!db) {
      res.json([]);
      return;
    }
    const limit = Math.min(
      parseInt((req.query.limit as string) ?? "100", 10) || 100,
      500
    );
    const category = req.query.category as string | undefined;

    const platformAuditResult = await db.execute(
      category
        ? sql`SELECT * FROM "auditLogs" WHERE category = ${category} ORDER BY "createdAt" DESC LIMIT ${limit}`
        : sql`SELECT * FROM "auditLogs" ORDER BY "createdAt" DESC LIMIT ${limit}`
    );
    const rows = platformAuditResult.rows as unknown[];

    res.json(rows ?? []);
  } catch {
    res.status(500).json({ error: "Failed to fetch platform audit logs" });
  }
}

async function handleInteractions(req: Request, res: Response): Promise<void> {
  try {
    const db = await getDb();
    if (!db) {
      res.json([]);
      return;
    }

    const limit = Math.min(
      parseInt((req.query.limit as string) ?? "100", 10) || 100,
      500
    );
    const context = (req.query.context as string | undefined)?.trim();
    const action = (req.query.action as string | undefined)?.trim();

    const interactionResult = await db.execute(
      context && action
        ? sql`
                    SELECT
                        l.id,
                        l.context,
                        l.action,
                        l."entityType",
                        l."entityId",
                        l."inputSnapshot",
                        l."outputRef",
                        l."durationMs",
                        l."createdAt",
                        l."organizationId",
                        COALESCE(lu.name, u.name, 'anonymous visitor') as actorName,
                        COALESCE(lu.email, u.email, '') as actorEmail,
                        o.name as organizationName
                    FROM "userInteractionLogs" l
                    LEFT JOIN "localUsers" lu ON lu.id = l."localUserId"
                    LEFT JOIN users u ON u.id = l."userId"
                    LEFT JOIN "organizations" o ON o.id = l."organizationId"
                    WHERE l.context = ${context} AND l.action = ${action}
                    ORDER BY l."createdAt" DESC
                    LIMIT ${limit}
                `
        : context
          ? sql`
                        SELECT
                            l.id,
                            l.context,
                            l.action,
                            l."entityType",
                            l."entityId",
                            l."inputSnapshot",
                            l."outputRef",
                            l."durationMs",
                            l."createdAt",
                            l."organizationId",
                            COALESCE(lu.name, u.name, 'anonymous visitor') as actorName,
                            COALESCE(lu.email, u.email, '') as actorEmail,
                            o.name as organizationName
                        FROM "userInteractionLogs" l
                        LEFT JOIN "localUsers" lu ON lu.id = l."localUserId"
                        LEFT JOIN users u ON u.id = l."userId"
                        LEFT JOIN "organizations" o ON o.id = l."organizationId"
                        WHERE l.context = ${context}
                        ORDER BY l."createdAt" DESC
                        LIMIT ${limit}
                    `
          : action
            ? sql`
                            SELECT
                                l.id,
                                l.context,
                                l.action,
                                l."entityType",
                                l."entityId",
                                l."inputSnapshot",
                                l."outputRef",
                                l."durationMs",
                                l."createdAt",
                                l."organizationId",
                                COALESCE(lu.name, u.name, 'anonymous visitor') as actorName,
                                COALESCE(lu.email, u.email, '') as actorEmail,
                                o.name as organizationName
                            FROM "userInteractionLogs" l
                            LEFT JOIN "localUsers" lu ON lu.id = l."localUserId"
                            LEFT JOIN users u ON u.id = l."userId"
                            LEFT JOIN "organizations" o ON o.id = l."organizationId"
                            WHERE l.action = ${action}
                            ORDER BY l."createdAt" DESC
                            LIMIT ${limit}
                        `
            : sql`
                            SELECT
                                l.id,
                                l.context,
                                l.action,
                                l."entityType",
                                l."entityId",
                                l."inputSnapshot",
                                l."outputRef",
                                l."durationMs",
                                l."createdAt",
                                l."organizationId",
                                COALESCE(lu.name, u.name, 'anonymous visitor') as actorName,
                                COALESCE(lu.email, u.email, '') as actorEmail,
                                o.name as organizationName
                            FROM "userInteractionLogs" l
                            LEFT JOIN "localUsers" lu ON lu.id = l."localUserId"
                            LEFT JOIN users u ON u.id = l."userId"
                            LEFT JOIN "organizations" o ON o.id = l."organizationId"
                            ORDER BY l."createdAt" DESC
                            LIMIT ${limit}
                        `
    );
    const rows = interactionResult.rows as unknown[];

    res.json(rows ?? []);
  } catch {
    res.status(500).json({ error: "Failed to fetch interaction logs" });
  }
}

async function handleIntake(req: Request, res: Response): Promise<void> {
  try {
    const db = await getDb();
    const limit = Math.min(
      parseInt((req.query.limit as string) ?? "20", 10) || 20,
      100
    );

    const [accessRequests, consultationRequests] = await Promise.all([
      listAccessRequests(limit),
      listConsultationRequests(limit),
    ]);

    let serviceRequests: unknown[] = [];
    if (db) {
      const srResult = await db.execute(sql`
                SELECT
                    sr.id,
                    sr."serviceType",
                    sr.title,
                    sr.priority,
                    sr.status,
                    sr."requestedByUserId",
                    sr."createdAt",
                    sr."updatedAt",
                    lu.name as "requestedByUsername",
                    lu.email as "requestedByEmail",
                    o.name as "organizationName"
                FROM "serviceRequests" sr
                LEFT JOIN "localUsers" lu ON lu.id = sr."requestedByUserId"
                LEFT JOIN "organizations" o ON o.id = sr."organizationId"
                ORDER BY sr."createdAt" DESC
                LIMIT ${limit}
            `);
      const srRows = srResult.rows as unknown[];
      serviceRequests = srRows ?? [];
    }

    res.json({
      counts: {
        accessRequests: accessRequests.length,
        consultationRequests: consultationRequests.length,
        serviceRequests: Array.isArray(serviceRequests)
          ? serviceRequests.length
          : 0,
      },
      accessRequests,
      consultationRequests,
      serviceRequests,
    });
  } catch {
    res.status(500).json({ error: "Failed to fetch intake data" });
  }
}

async function handleOnboarding(req: Request, res: Response): Promise<void> {
  try {
    const db = await getDb();
    if (!db) {
      res.json({ counts: [], recent: [] });
      return;
    }

    const limit = Math.min(
      parseInt((req.query.limit as string) ?? "50", 10) || 50,
      200
    );

    const [countsResult, recentResult] = await Promise.all([
      db.execute(sql`
                SELECT stage, COUNT(*) as total
                FROM "userOnboarding"
                GROUP BY stage
                ORDER BY total DESC
            `),
      db.execute(sql`
                SELECT
                    o.id,
                    o.stage,
                    o."accountIntent",
                    o."selectedLocale",
                    o."completedAt",
                    o."createdAt",
                    o."updatedAt",
                    COALESCE(lu.name, u.name, 'unknown') as "userLabel",
                    COALESCE(lu.email, u.email, '') as "userEmail"
                FROM "userOnboarding" o
                LEFT JOIN "localUsers" lu ON lu.id = o."localUserId"
                LEFT JOIN users u ON u.id = o."userId"
                ORDER BY o."updatedAt" DESC
                LIMIT ${limit}
            `),
    ]);
    const counts = countsResult.rows as unknown[];
    const recent = recentResult.rows as unknown[];

    res.json({ counts: counts ?? [], recent: recent ?? [] });
  } catch {
    res.status(500).json({ error: "Failed to fetch onboarding telemetry" });
  }
}

async function handleValidationFailures(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const db = await getDb();
    if (!db) {
      res.json([]);
      return;
    }

    const limit = Math.min(
      parseInt((req.query.limit as string) ?? "100", 10) || 100,
      500
    );
    const validationResult = await db.execute(sql`
            SELECT
                id,
                category,
                action,
                "entityType",
                "entityId",
                "targetEntity",
                "actorRole",
                outcome,
                payload,
                "createdAt"
            FROM "auditLogs"
            WHERE action = 'trpc.validation_failed' OR outcome IN ('failure', 'blocked')
            ORDER BY "createdAt" DESC
            LIMIT ${limit}
        `);
    const rows = validationResult.rows as unknown[];

    res.json(rows ?? []);
  } catch {
    res.status(500).json({ error: "Failed to fetch validation events" });
  }
}

async function handleSubscriptions(req: Request, res: Response): Promise<void> {
  try {
    const db = await getDb();
    if (!db) {
      res.json({ subscriptions: [], billingEvents: [], summary: [] });
      return;
    }

    const limit = Math.min(
      parseInt((req.query.limit as string) ?? "100", 10) || 100,
      500
    );

    const [subsResult, eventsResult, summaryResult] = await Promise.all([
      db.execute(sql`
                SELECT
                    s.id,
                    s.plan,
                    s.status,
                    s."billingInterval",
                    s."amountCents",
                    s.currency,
                    s."currentPeriodStart",
                    s."currentPeriodEnd",
                    s."cancelAtPeriodEnd",
                    s."canceledAt",
                    s."stripeSubscriptionId",
                    s."createdAt",
                    s."updatedAt",
                    o.name          AS "organizationName",
                    o.slug          AS "organizationSlug",
                    o."billingEmail"  AS "billingEmail"
                FROM "subscriptions" s
                JOIN "organizations" o ON o.id = s."organizationId"
                ORDER BY s."updatedAt" DESC
                LIMIT ${limit}
            `),
      db.execute(sql`
                SELECT
                    be.id,
                    be."eventType",
                    be.status,
                    be."amountCents",
                    be.currency,
                    be."stripeEventId",
                    be."createdAt",
                    o.name AS "organizationName"
                FROM "billingEvents" be
                JOIN "organizations" o ON o.id = be."organizationId"
                ORDER BY be."createdAt" DESC
                LIMIT ${limit}
            `),
      db.execute(sql`
                SELECT
                    plan,
                    status,
                    currency,
                    COUNT(*)           AS count,
                    SUM("amountCents")  AS "totalAmountCents"
                FROM "subscriptions"
                GROUP BY plan, status, currency
                ORDER BY plan, status
            `),
    ]);
    const subs = subsResult.rows as unknown[];
    const events = eventsResult.rows as unknown[];
    const summary = summaryResult.rows as unknown[];

    res.json({
      subscriptions: subs ?? [],
      billingEvents: events ?? [],
      summary: summary ?? [],
    });
  } catch {
    res.status(500).json({ error: "Failed to fetch subscription data" });
  }
}

async function handleSignups(req: Request, res: Response): Promise<void> {
  try {
    const db = await getDb();
    if (!db) {
      res.json([]);
      return;
    }
    const limit = Math.min(
      parseInt((req.query.limit as string) ?? "50", 10) || 50,
      200
    );
    const signupsResult = await db.execute(sql`
            SELECT
                u.id,
                u.name AS username,
                u.email,
                u."userType" AS role,
                u."mfaEnabled" AS "isMfaEnabled",
                u."createdAt",
                u."lastSignedIn" AS "lastLoginAt",
                o.name  AS "organizationName",
                o.plan  AS "organizationPlan"
            FROM "localUsers" u
            LEFT JOIN "organizationMembers" om ON om."localUserId" = u.id
            LEFT JOIN "organizations" o ON o.id = om."organizationId"
            ORDER BY u."createdAt" DESC
            LIMIT ${limit}
        `);
    const rows = signupsResult.rows as unknown[];
    res.json(rows ?? []);
  } catch {
    res.status(500).json({ error: "Failed to fetch signups" });
  }
}

async function handleOrgs(req: Request, res: Response): Promise<void> {
  try {
    const db = await getDb();
    if (!db) {
      res.json([]);
      return;
    }
    const limit = Math.min(
      parseInt((req.query.limit as string) ?? "100", 10) || 100,
      500
    );
    const orgsResult = await db.execute(sql`
            SELECT
                o.id,
                o.name,
                o.plan,
                o."isActive",
                o."trialEndsAt",
                o."createdAt",
                o."updatedAt",
                COUNT(DISTINCT om.id)   AS "memberCount",
                0 AS "activeSessions"
            FROM "organizations" o
            LEFT JOIN "organizationMembers" om ON om."organizationId" = o.id
            GROUP BY o.id
            ORDER BY o."createdAt" DESC
            LIMIT ${limit}
        `);
    const rows = orgsResult.rows as unknown[];
    res.json(rows ?? []);
  } catch {
    res.status(500).json({ error: "Failed to fetch organizations" });
  }
}

async function handleRealtime(_req: Request, res: Response): Promise<void> {
  try {
    const db = await getDb();
    if (!db) {
      res.json({
        activeSessions: 0,
        recentActions: 0,
        newUsersLastHour: 0,
        sseClients: getSSEClientCount(),
        dbStatus: "unavailable",
      });
      return;
    }
    const [sessResult, actResult, newUsersResult] = await Promise.all([
      db.execute(sql`SELECT 0 as total`),
      db.execute(
        sql`SELECT COUNT(*) as total FROM "auditLogs" WHERE "createdAt" >= NOW() - INTERVAL '5 minutes'`
      ),
      db.execute(
        sql`SELECT COUNT(*) as total FROM "localUsers" WHERE "createdAt" >= NOW() - INTERVAL '60 minutes'`
      ),
    ]);
    const sessRow = sessResult.rows as { total: number }[];
    const actRow = actResult.rows as { total: number }[];
    const newUsersRow = newUsersResult.rows as { total: number }[];
    res.json({
      activeSessions: sessRow?.[0]?.total ?? 0,
      recentActions: actRow?.[0]?.total ?? 0,
      newUsersLastHour: newUsersRow?.[0]?.total ?? 0,
      sseClients: getSSEClientCount(),
      dbStatus: "healthy",
      ts: new Date().toISOString(),
    });
  } catch {
    res.status(500).json({ error: "Failed to fetch realtime stats" });
  }
}

async function handleUserDetail(req: Request, res: Response): Promise<void> {
  try {
    const db = await getDb();
    if (!db) {
      res.status(503).json({ error: "Database unavailable" });
      return;
    }
    const userId = parseInt(req.params.id ?? "", 10);
    if (!userId) {
      res.status(400).json({ error: "Invalid user id" });
      return;
    }

    const [userResult, sessionResult, auditResult, interactionResult] =
      await Promise.all([
        db.execute(sql`
                SELECT u.id, u.name AS username, u.email, u."userType" AS role, u.status, u."mfaEnabled" AS "isMfaEnabled",
                       u."createdAt", u."lastSignedIn" AS "lastLoginAt", o.name AS "organizationName", o.plan AS "organizationPlan"
                FROM "localUsers" u
                LEFT JOIN "organizationMembers" om ON om."localUserId" = u.id
                LEFT JOIN "organizations" o ON o.id = om."organizationId"
                WHERE u.id = ${userId} LIMIT 1
            `),
        db.execute(sql`SELECT 0 AS id LIMIT 0`),
        db.execute(sql`
                SELECT category, action, outcome, "createdAt"
                FROM "auditLogs" WHERE "localUserId" = ${userId}
                ORDER BY "createdAt" DESC LIMIT 30
            `),
        db.execute(sql`
                SELECT context, action, "entityType", "createdAt", "durationMs"
                FROM "userInteractionLogs" WHERE "localUserId" = ${userId}
                ORDER BY "createdAt" DESC LIMIT 30
            `),
      ]);

    const user = userResult.rows[0];
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({
      user,
      sessions: sessionResult.rows,
      auditTrail: auditResult.rows,
      interactions: interactionResult.rows,
    });
  } catch {
    res.status(500).json({ error: "Failed to fetch user detail" });
  }
}

async function handleOrgDetail(req: Request, res: Response): Promise<void> {
  try {
    const db = await getDb();
    if (!db) {
      res.status(503).json({ error: "Database unavailable" });
      return;
    }
    const orgId = parseInt(req.params.id ?? "", 10);
    if (!orgId) {
      res.status(400).json({ error: "Invalid org id" });
      return;
    }

    const [orgResult, membersResult, subscriptionResult, auditResult] =
      await Promise.all([
        db.execute(sql`
                SELECT id, name, slug, plan, "isActive", "trialEndsAt", "createdAt", "updatedAt",
                       industry, "billingEmail"
                FROM "organizations" WHERE id = ${orgId} LIMIT 1
            `),
        db.execute(sql`
                SELECT om.role, u.id AS "userId", u.name AS username, u.email, u.status AS "userStatus",
                       u."lastSignedIn" AS "lastLoginAt", om."createdAt" AS "joinedAt"
                FROM "organizationMembers" om
                JOIN "localUsers" u ON u.id = om."localUserId"
                WHERE om."organizationId" = ${orgId}
                ORDER BY om."createdAt" ASC
                LIMIT 50
            `),
        db.execute(sql`
                SELECT id, plan, status, "currentPeriodStart", "currentPeriodEnd", "cancelAtPeriodEnd",
                       "createdAt", "updatedAt"
                FROM "subscriptions" WHERE "organizationId" = ${orgId}
                ORDER BY "createdAt" DESC LIMIT 1
            `),
        db.execute(sql`
                SELECT category, action, outcome, "createdAt"
                FROM "auditLogs" WHERE "organizationId" = ${orgId}
                ORDER BY "createdAt" DESC LIMIT 30
            `),
      ]);

    const org = orgResult.rows[0];
    if (!org) {
      res.status(404).json({ error: "Organization not found" });
      return;
    }

    res.json({
      org,
      members: membersResult.rows,
      subscription: subscriptionResult.rows[0] ?? null,
      auditTrail: auditResult.rows,
    });
  } catch {
    res.status(500).json({ error: "Failed to fetch org detail" });
  }
}

async function handleSuspendUser(req: Request, res: Response): Promise<void> {
  const session = (
    req as Request & { adminSession?: { username: string; sessionId: string } }
  ).adminSession;
  const ip = getClientIp(req);
  const userId = parseInt(req.params.id ?? "", 10);
  if (!userId) {
    res.status(400).json({ error: "Invalid user id" });
    return;
  }
  const { suspend } = req.body as { suspend?: boolean };
  if (typeof suspend !== "boolean") {
    res.status(400).json({ error: "Body must include suspend: true | false" });
    return;
  }

  try {
    const db = await getDb();
    if (!db) {
      res.status(503).json({ error: "Database unavailable" });
      return;
    }

    const userResult = await db.execute(
      sql`SELECT id, email, status FROM "localUsers" WHERE id = ${userId} LIMIT 1`
    );
    const rows = userResult.rows as {
      id: number;
      email: string;
      status: string;
    }[];
    const user = rows[0];
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const newStatus = suspend ? "suspended" : "active";
    await db.execute(
      sql`UPDATE "localUsers" SET status = ${newStatus}, "updatedAt" = NOW() WHERE id = ${userId}`
    );
    await auditLog(
      session?.sessionId ?? null,
      session?.username ?? "unknown",
      suspend ? "user.suspend" : "user.unsuspend",
      ip,
      String(userId)
    );
    broadcastSSE("user_status_changed", {
      userId,
      email: user.email,
      status: newStatus,
      by: session?.username,
      ts: new Date().toISOString(),
    });

    res.json({ success: true, userId, status: newStatus });
  } catch {
    res.status(500).json({ error: "Failed to update user status" });
  }
}

async function handleRevokeUserSessions(
  req: Request,
  res: Response
): Promise<void> {
  // Local-auth sessions are stateless JWTs; there is no session table to
  // revoke. Suspension (status=suspended) is enforced on every authenticated
  // request, so recommend suspending instead. Return success for compatibility.
  const session = (
    req as Request & { adminSession?: { username: string; sessionId: string } }
  ).adminSession;
  const ip = getClientIp(req);
  const userId = parseInt(req.params.id ?? "", 10);
  if (!userId) {
    res.status(400).json({ error: "Invalid user id" });
    return;
  }
  await auditLog(
    session?.sessionId ?? null,
    session?.username ?? "unknown",
    "user.revoke_sessions",
    ip,
    String(userId)
  );
  res.json({
    success: true,
    userId,
    note: "Sessions are stateless; suspend the user to block access.",
  });
}

async function handleSuspendOrg(req: Request, res: Response): Promise<void> {
  const session = (
    req as Request & { adminSession?: { username: string; sessionId: string } }
  ).adminSession;
  const ip = getClientIp(req);
  const orgId = parseInt(req.params.id ?? "", 10);
  if (!orgId) {
    res.status(400).json({ error: "Invalid org id" });
    return;
  }
  const { suspend } = req.body as { suspend?: boolean };
  if (typeof suspend !== "boolean") {
    res.status(400).json({ error: "Body must include suspend: true | false" });
    return;
  }

  try {
    const db = await getDb();
    if (!db) {
      res.status(503).json({ error: "Database unavailable" });
      return;
    }

    const orgCheckResult = await db.execute(
      sql`SELECT id, name, "isActive" FROM "organizations" WHERE id = ${orgId} LIMIT 1`
    );
    const rows = orgCheckResult.rows as {
      id: number;
      name: string;
      isActive: number;
    }[];
    const org = rows[0];
    if (!org) {
      res.status(404).json({ error: "Organization not found" });
      return;
    }

    const newStatus = suspend ? "suspended" : "active";
    const newIsActive = suspend ? 0 : 1;
    await db.execute(
      sql`UPDATE "organizations" SET "isActive" = ${newIsActive}, "updatedAt" = NOW() WHERE id = ${orgId}`
    );
    await auditLog(
      session?.sessionId ?? null,
      session?.username ?? "unknown",
      suspend ? "org.suspend" : "org.unsuspend",
      ip,
      String(orgId)
    );
    broadcastSSE("org_status_changed", {
      orgId,
      name: org.name,
      status: newStatus,
      by: session?.username,
      ts: new Date().toISOString(),
    });

    res.json({ success: true, orgId, status: newStatus });
  } catch {
    res.status(500).json({ error: "Failed to update organization status" });
  }
}

async function handleGenerateAccessLink(
  req: Request,
  res: Response
): Promise<void> {
  const session = (
    req as Request & { adminSession?: { username: string; sessionId: string } }
  ).adminSession;
  const ip = getClientIp(req);

  if (!ADMIN_SECRET) {
    res.status(400).json({ error: "YALLA_ADMIN_SECRET is not configured." });
    return;
  }

  const rawExpires = req.body?.expiresInMinutes;
  const parsedExpires = Number(rawExpires ?? 30);
  if (!Number.isFinite(parsedExpires) || parsedExpires < 1) {
    res.status(400).json({ error: "expiresInMinutes must be a number >= 1" });
    return;
  }

  const expiresInMinutes = Math.min(Math.floor(parsedExpires), 24 * 60);
  const oneTime =
    typeof req.body?.oneTime === "boolean" ? req.body.oneTime : true;
  const redirectTarget = resolveRedirectTarget(req);
  const expiresAt = Math.floor(Date.now() / 1000) + expiresInMinutes * 60;
  const nonce = oneTime ? nanoid(24) : "";
  const sig = createSignedAccessSignature(redirectTarget, expiresAt, nonce);

  const params = new URLSearchParams({
    redirect: redirectTarget,
    expires: String(expiresAt),
    sig,
  });
  if (nonce) params.set("nonce", nonce);

  const relativeUrl = `/yalla-hack-owners-console/enter?${params.toString()}`;
  let url = relativeUrl;
  const origin =
    typeof req.headers.origin === "string" ? req.headers.origin.trim() : "";
  if (origin.startsWith("http://") || origin.startsWith("https://")) {
    try {
      url = new URL(relativeUrl, origin).toString();
    } catch {
      url = relativeUrl;
    }
  }

  await auditLog(
    session?.sessionId ?? null,
    session?.username ?? "unknown",
    "access_link.generated",
    ip,
    redirectTarget,
    {
      expiresAt,
      expiresInMinutes,
      oneTime,
    }
  );
  broadcastSSE("owner_link_generated", {
    by: session?.username ?? "unknown",
    redirectTo: redirectTarget,
    expiresAt,
    oneTime,
    ts: new Date().toISOString(),
  });

  res.json({
    ok: true,
    url,
    relativeUrl,
    redirectTo: redirectTarget,
    expiresAt,
    expiresAtIso: new Date(expiresAt * 1000).toISOString(),
    oneTime,
  });
}

// ─── Session management ──────────────────────────────────────────────────────

async function handleSessions(req: Request, res: Response): Promise<void> {
  try {
    const current = (req as Request & { adminSession?: { sessionId: string } })
      .adminSession?.sessionId;
    const db = await getDb();
    if (!db) {
      res.json([]);
      return;
    }
    const result = await db.execute(sql`
            SELECT id, "adminUsername", "ipAddress", "userAgent", "createdAt", "expiresAt", "lastSeenAt"
            FROM "yallaAdminSessions"
            WHERE "isRevoked" = 0 AND "expiresAt" > NOW()
            ORDER BY "lastSeenAt" DESC
            LIMIT 50
        `);
    type SessionRow = {
      id: string;
      adminUsername: string;
      ipAddress: string;
      userAgent: string | null;
      createdAt: Date | string;
      expiresAt: Date | string;
      lastSeenAt: Date | string | null;
    };
    const rows = (result.rows ?? []) as SessionRow[];
    res.json(
      rows.map(r => ({
        id: r.id,
        adminUsername: r.adminUsername,
        ipAddress: r.ipAddress,
        userAgent: r.userAgent,
        createdAt:
          r.createdAt instanceof Date
            ? r.createdAt.toISOString()
            : String(r.createdAt ?? ""),
        expiresAt:
          r.expiresAt instanceof Date
            ? r.expiresAt.toISOString()
            : String(r.expiresAt ?? ""),
        lastSeenAt:
          r.lastSeenAt instanceof Date
            ? r.lastSeenAt.toISOString()
            : r.lastSeenAt
              ? String(r.lastSeenAt)
              : null,
        isCurrent: r.id === current,
      }))
    );
  } catch {
    res.status(500).json({ error: "Failed to list sessions" });
  }
}

async function handleRevokeAdminSession(
  req: Request,
  res: Response
): Promise<void> {
  const session = (
    req as Request & { adminSession?: { username: string; sessionId: string } }
  ).adminSession;
  const targetId = String(req.params.id ?? "");
  const ip = getClientIp(req);

  if (!/^[A-Za-z0-9_-]{10,64}$/.test(targetId)) {
    res.status(400).json({ error: "Invalid session id" });
    return;
  }

  try {
    const db = await getDb();
    if (!db) {
      res.status(503).json({ error: "Database unavailable" });
      return;
    }
    const result = await db.execute(sql`
            UPDATE "yallaAdminSessions" SET "isRevoked" = 1
            WHERE id = ${targetId} AND "isRevoked" = 0
            RETURNING id
        `);
    const rows = result.rows as { id: string }[] | undefined;
    if (!rows || rows.length === 0) {
      // Session may already be revoked — treat as success (idempotent)
      res.json({ ok: true, alreadyRevoked: true });
      return;
    }
    revokeAdminSession(targetId);
    const isCurrent = session?.sessionId === targetId;
    await auditLog(
      session?.sessionId ?? null,
      session?.username ?? "unknown",
      "session.revoke",
      ip,
      targetId.slice(0, 12)
    );
    if (isCurrent) {
      res.clearCookie(COOKIE_NAME, { path: ADMIN_COOKIE_PATH });
    }
    res.json({ ok: true, isCurrent });
  } catch {
    res.status(500).json({ error: "Failed to revoke session" });
  }
}

// ─── Password change ─────────────────────────────────────────────────────────

async function handlePasswordChange(
  req: Request,
  res: Response
): Promise<void> {
  const session = (
    req as Request & { adminSession?: { username: string; sessionId: string } }
  ).adminSession;
  const ip = getClientIp(req);
  const { currentPassword, newPassword } = req.body ?? {};

  if (typeof currentPassword !== "string" || typeof newPassword !== "string") {
    res.status(400).json({ error: "Current and new password are required." });
    return;
  }
  if (currentPassword.length > 256 || newPassword.length > 256) {
    res.status(400).json({ error: "Invalid credentials format." });
    return;
  }
  if (newPassword.length < 12) {
    res
      .status(400)
      .json({ error: "New password must be at least 12 characters." });
    return;
  }
  if (!/[A-Za-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
    res.status(400).json({
      error: "New password must contain at least one letter and one number.",
    });
    return;
  }
  if (newPassword === currentPassword) {
    res
      .status(400)
      .json({ error: "New password must differ from the current password." });
    return;
  }
  if (await isLoginLocked(ip, res)) return;

  const currentOk = await verifyAdminPassword(currentPassword);
  if (!currentOk) {
    await recordLoginFailure(ip);
    await auditLog(
      session?.sessionId ?? null,
      session?.username ?? "unknown",
      "password.change_failed",
      ip
    );
    res.status(401).json({ error: "Current password is incorrect." });
    return;
  }
  await clearLoginFailures(ip);

  try {
    const newHash = await bcrypt.hash(newPassword, 12);
    await setAdminSetting("passwordHash", newHash);
  } catch {
    res.status(503).json({ error: "Could not persist new password." });
    return;
  }

  // Revoke every OTHER session (password change invalidates other devices)
  try {
    const db = await getDb();
    if (db && session) {
      const others = await db.execute(sql`
                SELECT id FROM "yallaAdminSessions"
                WHERE "isRevoked" = 0 AND id != ${session.sessionId}
            `);
      const otherIds = (others.rows as { id: string }[] | undefined) ?? [];
      for (const row of otherIds) revokeAdminSession(row.id);
      await db.execute(sql`
                UPDATE "yallaAdminSessions" SET "isRevoked" = 1
                WHERE "isRevoked" = 0 AND id != ${session.sessionId}
            `);
    }
  } catch {
    logger.warn(
      "[YallaAdmin] Could not revoke other sessions on password change"
    );
  }

  await auditLog(
    session?.sessionId ?? null,
    session?.username ?? "unknown",
    "password.change",
    ip
  );
  res.json({ ok: true, otherSessionsRevoked: true });
}

// ─── Two-factor authentication (TOTP) ────────────────────────────────────────

async function handle2faStatus(_req: Request, res: Response): Promise<void> {
  res.json({ enabled: await isFounderMfaEnabled() });
}

async function handle2faSetup(req: Request, res: Response): Promise<void> {
  const session = (
    req as Request & { adminSession?: { username: string; sessionId: string } }
  ).adminSession;
  const ip = getClientIp(req);
  try {
    const secret = otpGenerateSecret();
    await setAdminSetting("totpSecretPending", secret);
    const uri = generateURI({
      issuer: "Yalla Hack Founders",
      label: session?.username ?? ADMIN_USERNAME,
      secret,
    });
    const qrDataUrl = await qrcode.toDataURL(uri);
    await auditLog(
      session?.sessionId ?? null,
      session?.username ?? "unknown",
      "2fa.setup_started",
      ip
    );
    res.json({ secret, qrDataUrl });
  } catch {
    res.status(500).json({ error: "Failed to start 2FA setup" });
  }
}

async function handle2faConfirm(req: Request, res: Response): Promise<void> {
  const session = (
    req as Request & { adminSession?: { username: string; sessionId: string } }
  ).adminSession;
  const ip = getClientIp(req);
  const { code } = req.body ?? {};

  if (typeof code !== "string" || !/^\d{6}$/.test(code)) {
    res.status(400).json({ error: "Enter the 6-digit code from your app." });
    return;
  }

  const pendingSecret = await getAdminSetting("totpSecretPending");
  if (!pendingSecret) {
    res.status(400).json({ error: "No pending 2FA setup. Start setup again." });
    return;
  }

  let valid: boolean;
  try {
    valid = otpVerifySync({ token: code, secret: pendingSecret }).valid;
  } catch {
    valid = false;
  }
  if (!valid) {
    await auditLog(
      session?.sessionId ?? null,
      session?.username ?? "unknown",
      "2fa.confirm_failed",
      ip
    );
    res.status(400).json({ error: "Invalid authenticator code." });
    return;
  }

  const backupCodes = Array.from({ length: 8 }, () =>
    createHash("sha256")
      .update(`${ADMIN_USERNAME}-${Date.now()}-${Math.random()}`)
      .digest("hex")
      .slice(0, 10)
      .toUpperCase()
  );
  const hashedCodes = backupCodes.map(c =>
    createHash("sha256").update(c).digest("hex")
  );

  try {
    await setAdminSetting("totpSecret", pendingSecret);
    await setAdminSetting("mfaEnabled", "1");
    await setAdminSetting("mfaBackupCodes", JSON.stringify(hashedCodes));
    await deleteAdminSetting("totpSecretPending");
  } catch {
    res.status(503).json({ error: "Could not enable 2FA." });
    return;
  }

  await auditLog(
    session?.sessionId ?? null,
    session?.username ?? "unknown",
    "2fa.enable",
    ip
  );
  broadcastSSE("platform_event", {
    action: "admin_2fa_enabled",
    ts: new Date().toISOString(),
  });
  res.json({ backupCodes });
}

async function handle2faDisable(req: Request, res: Response): Promise<void> {
  const session = (
    req as Request & { adminSession?: { username: string; sessionId: string } }
  ).adminSession;
  const ip = getClientIp(req);
  const { password } = req.body ?? {};

  if (typeof password !== "string" || password.length === 0) {
    res.status(400).json({ error: "Password is required to disable 2FA." });
    return;
  }
  if (await isLoginLocked(ip, res)) return;
  if (!(await verifyAdminPassword(password))) {
    await recordLoginFailure(ip);
    res.status(401).json({ error: "Incorrect password." });
    return;
  }
  await clearLoginFailures(ip);

  await deleteAdminSetting("mfaEnabled");
  await deleteAdminSetting("totpSecret");
  await deleteAdminSetting("totpSecretPending");
  await deleteAdminSetting("mfaBackupCodes");

  await auditLog(
    session?.sessionId ?? null,
    session?.username ?? "unknown",
    "2fa.disable",
    ip
  );
  res.json({ ok: true });
}

async function handle2faVerify(req: Request, res: Response): Promise<void> {
  const { pendingToken, code } = req.body ?? {};
  const ip = getClientIp(req);

  if (typeof pendingToken !== "string" || typeof code !== "string") {
    res.status(400).json({ error: "Challenge token and code are required." });
    return;
  }
  if (await isLoginLocked(ip, res)) return;

  let payload: { sub?: unknown; purpose?: unknown } | null;
  try {
    const verified = await jwtVerify(pendingToken, ADMIN_JWT_SECRET);
    payload = verified.payload as { sub?: unknown; purpose?: unknown };
  } catch {
    payload = null;
  }
  if (!payload || payload.purpose !== "yalla-totp-challenge") {
    res.status(401).json({ error: "Invalid or expired challenge." });
    return;
  }

  if (!(await isFounderMfaEnabled())) {
    res.status(400).json({ error: "2FA is not enabled." });
    return;
  }
  const totpSecret = await getAdminSetting("totpSecret");
  if (!totpSecret) {
    res.status(500).json({ error: "2FA misconfigured." });
    return;
  }

  const normalised = code.trim().toUpperCase();
  let via: "totp" | "backup" | null = null;

  if (/^\d{6}$/.test(normalised)) {
    try {
      if (otpVerifySync({ token: normalised, secret: totpSecret }).valid) {
        via = "totp";
      }
    } catch {
      via = null;
    }
  }

  if (!via && normalised.length >= 8) {
    const hashed = createHash("sha256").update(normalised).digest("hex");
    const stored = await getAdminSetting("mfaBackupCodes");
    if (stored) {
      try {
        const codes = JSON.parse(stored) as string[];
        const idx = codes.indexOf(hashed);
        if (idx !== -1) {
          codes.splice(idx, 1);
          await setAdminSetting("mfaBackupCodes", JSON.stringify(codes));
          via = "backup";
        }
      } catch {
        // corrupted list — treat as invalid
      }
    }
  }

  if (!via) {
    await recordLoginFailure(ip);
    await auditLog(
      null,
      String(payload.sub ?? ADMIN_USERNAME),
      "login.mfa_failed",
      ip
    );
    res.status(401).json({ error: "Invalid authentication code." });
    return;
  }

  await clearLoginFailures(ip);
  await createAdminSession(req, res, ip, { mfaVia: via });
}

async function handleExportCsv(req: Request, res: Response): Promise<void> {
  const session = (
    req as Request & { adminSession?: { username: string; sessionId: string } }
  ).adminSession;
  const ip = getClientIp(req);
  const type = (req.query.type as string) ?? "users";

  await auditLog(
    session?.sessionId ?? null,
    session?.username ?? "unknown",
    "export.csv",
    ip,
    type
  );

  try {
    const db = await getDb();
    if (!db) {
      res.status(503).json({ error: "Database unavailable" });
      return;
    }

    let rows: unknown[];
    let headers: string;
    let filename: string;

    if (type === "users") {
      const userExportResult = await db.execute(sql`
                SELECT id, name, email, "phoneNumber", "userType" AS role, status,
                       "companyName", "jobTitle", industry, "preferredLocale",
                       "mfaEnabled" AS "isMfaEnabled", "createdAt", "lastSignedIn" AS "lastLoginAt"
                FROM "localUsers" ORDER BY "createdAt" DESC LIMIT 10000
            `);
      const userRows = userExportResult.rows as unknown[];
      rows = userRows ?? [];
      headers =
        "id,name,email,phoneNumber,role,status,companyName,jobTitle,industry,preferredLocale,isMfaEnabled,createdAt,lastLoginAt";
      filename = "users-export.csv";
    } else if (type === "orgs") {
      const orgExportResult = await db.execute(sql`
                SELECT id, name, plan, "isActive", "trialEndsAt", "createdAt"
                FROM "organizations" ORDER BY "createdAt" DESC LIMIT 10000
            `);
      const orgRows = orgExportResult.rows as unknown[];
      rows = orgRows ?? [];
      headers = "id,name,plan,isActive,trialEndsAt,createdAt";
      filename = "orgs-export.csv";
    } else if (type === "subscriptions") {
      const subExportResult = await db.execute(sql`
                SELECT s.id, s.plan, s.status, s."currentPeriodStart", s."currentPeriodEnd",
                       s."cancelAtPeriodEnd", o.name AS "orgName", s."createdAt"
                FROM "subscriptions" s
                JOIN "organizations" o ON o.id = s."organizationId"
                ORDER BY s."createdAt" DESC LIMIT 10000
            `);
      const subRows = subExportResult.rows as unknown[];
      rows = subRows ?? [];
      headers =
        "id,plan,status,currentPeriodStart,currentPeriodEnd,cancelAtPeriodEnd,orgName,createdAt";
      filename = "subscriptions-export.csv";
    } else if (type === "audit") {
      const auditExportResult = await db.execute(sql`
                SELECT id, category, action, outcome, "ipHash" AS "ipAddress", "createdAt"
                FROM "auditLogs" ORDER BY "createdAt" DESC LIMIT 10000
            `);
      const auditRows = auditExportResult.rows as unknown[];
      rows = auditRows ?? [];
      headers = "id,category,action,outcome,ipAddress,createdAt";
      filename = "audit-export.csv";
    } else {
      res.status(400).json({ error: "Invalid export type" });
      return;
    }

    const csvRows = Array.isArray(rows)
      ? (rows as Record<string, unknown>[])
      : [];
    const csvBody = csvRows
      .map(r =>
        headers
          .split(",")
          .map(h => JSON.stringify(r[h] ?? ""))
          .join(",")
      )
      .join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(`${headers}\n${csvBody}`);
  } catch {
    res.status(500).json({ error: "Export failed" });
  }
}

function handleSSE(req: Request, res: Response): void {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  addSSEClient(res);

  // Send heartbeat every 30s
  const heartbeat = setInterval(() => {
    try {
      res.write(":heartbeat\n\n");
    } catch {
      clearInterval(heartbeat);
    }
  }, 30_000);

  // Send initial connected event
  res.write(
    `event: connected\ndata: ${JSON.stringify({ ts: new Date().toISOString(), clients: getSSEClientCount() })}\n\n`
  );

  req.on("close", () => {
    clearInterval(heartbeat);
    removeSSEClient(res);
  });
}

/** Periodic cleanup of expired and old-revoked sessions to keep the table lean */
function scheduleSessionCleanup(): void {
  const cleanup = async () => {
    try {
      const db = await getDb();
      if (!db) return;
      await db.execute(sql`
                DELETE FROM "yallaAdminSessions"
                WHERE "expiresAt" < NOW()
                   OR ("isRevoked" = 1 AND "lastSeenAt" < NOW() - INTERVAL '7 days')
            `);
    } catch {
      logger.warn(
        "[YallaAdmin] Session cleanup scheduler failed — will retry next cycle"
      );
    }
  };
  void cleanup();
  setInterval(() => void cleanup(), 60 * 60 * 1000); // every hour
}

// ─── Router assembly ──────────────────────────────────────────────────────────

export function createYallaAdminRouter(): Router {
  const router = express.Router();

  // Security: IP allowlist check
  router.use(ownerPortalHeaders);
  router.use(ipAllowlist);
  router.use(adminEndpointRateLimit);
  router.use(requireJsonContentType);

  // Public endpoint — does not require session
  router.get("/bootstrap", (req, res) => void handleBootstrap(req, res));
  router.post("/login", (req, res) => void handleLogin(req, res));
  // React UI login — bypasses token gate but enforces IP allowlist + rate limiting + credentials
  router.post("/react-login", (req, res) => void handleReactLogin(req, res));

  // Token gate for remaining routes
  router.use(tokenGate);

  // Session authentication for all authenticated routes
  router.use((req, res, next) => void requireSession(req, res, next));

  router.post("/logout", (req, res) => void handleLogout(req, res));
  router.get("/me", (req, res) => void handleMe(req, res));

  // Two-factor authentication
  router.get("/2fa/status", (req, res) => void handle2faStatus(req, res));
  router.post("/2fa/setup", (req, res) => void handle2faSetup(req, res));
  router.post("/2fa/confirm", (req, res) => void handle2faConfirm(req, res));
  router.post("/2fa/disable", (req, res) => void handle2faDisable(req, res));
  // Public (pre-session): exchanges the short-lived MFA challenge for a session
  router.post("/2fa/verify", (req, res) => void handle2faVerify(req, res));

  // Password rotation (DB-stored hash overrides the env hash)
  router.post(
    "/password/change",
    (req, res) => void handlePasswordChange(req, res)
  );

  // Session management
  router.get("/stats/sessions", (req, res) => void handleSessions(req, res));
  router.post(
    "/sessions/:id/revoke",
    (req, res) => void handleRevokeAdminSession(req, res)
  );

  router.get("/stats/overview", (req, res) => void handleOverview(req, res));
  router.get("/stats/users", (req, res) => void handleUsers(req, res));
  router.get("/stats/signups", (req, res) => void handleSignups(req, res));
  router.get("/stats/orgs", (req, res) => void handleOrgs(req, res));
  router.get("/stats/realtime", (req, res) => void handleRealtime(req, res));
  router.get("/stats/system", (req, res) => void handleSystem(req, res));
  router.get("/stats/audit", (req, res) => void handleAudit(req, res));
  router.get(
    "/stats/platform-audit",
    (req, res) => void handlePlatformAudit(req, res)
  );
  router.get(
    "/stats/interactions",
    (req, res) => void handleInteractions(req, res)
  );
  router.get("/stats/intake", (req, res) => void handleIntake(req, res));
  router.get(
    "/stats/onboarding",
    (req, res) => void handleOnboarding(req, res)
  );
  router.get(
    "/stats/subscriptions",
    (req, res) => void handleSubscriptions(req, res)
  );
  router.get(
    "/stats/validations",
    (req, res) => void handleValidationFailures(req, res)
  );
  router.get("/stats/users/:id", (req, res) => void handleUserDetail(req, res));
  router.get("/stats/orgs/:id", (req, res) => void handleOrgDetail(req, res));
  router.post(
    "/users/:id/suspend",
    requireJsonContentType,
    (req, res) => void handleSuspendUser(req, res)
  );
  router.post(
    "/users/:id/revoke-sessions",
    (req, res) => void handleRevokeUserSessions(req, res)
  );
  router.post(
    "/orgs/:id/suspend",
    requireJsonContentType,
    (req, res) => void handleSuspendOrg(req, res)
  );
  router.post(
    "/access-links/generate",
    requireJsonContentType,
    (req, res) => void handleGenerateAccessLink(req, res)
  );
  router.get("/export/csv", (req, res) => void handleExportCsv(req, res));
  router.get("/stream", handleSSE);

  // Start background session cleanup
  scheduleSessionCleanup();

  return router;
}

// broadcastSSE is now exported from server/services/sse-bus.ts
// Re-export for any legacy callers that haven't been updated yet
export { broadcastSSE } from "../services/sse-bus";
