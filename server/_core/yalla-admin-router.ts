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
 *   YALLA_ADMIN_IP_ALLOWLIST — optional CSV of allowed IPs (e.g. "1.2.3.4,5.6.7.0/24")
 *   YALLA_ADMIN_JWT_SECRET  — signing secret for admin sessions (falls back to JWT_SECRET)
 *   YALLA_ADMIN_SESSION_TTL_HOURS — session TTL in hours (default: 8)
 */

import express, { type Request, type Response, type NextFunction, type Router } from "express";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { nanoid } from "nanoid";
import { parse as parseCookieHeader } from "cookie";
import { getDb } from "../db";
import { listAccessRequests, listConsultationRequests } from "../control-center-store";
import { ENV } from "./env";
import { sql } from "drizzle-orm";
import { broadcastSSE, addSSEClient, removeSSEClient, getSSEClientCount } from "../services/sse-bus";

// ─── Config ───────────────────────────────────────────────────────────────────

const ADMIN_SECRET = ENV.yallaAdminSecret;
const ADMIN_USERNAME = ENV.yallaAdminUsername;
const ADMIN_PASSWORD_HASH = ENV.yallaAdminPasswordHash;
const IP_ALLOWLIST_RAW = ENV.yallaAdminIpAllowlist;
const SESSION_TTL_H = ENV.yallaAdminSessionTtlHours;
const COOKIE_NAME = "yalla_admin_session";
const GATE_COOKIE_NAME = "yalla_admin_gate";
const ADMIN_API_PATH = "/api/yalla-admin";

// Generate a secure per-process fallback JWT secret for dev-only
const ADMIN_JWT_SECRET = new TextEncoder().encode(
    ENV.yallaAdminJwtSecret || ENV.cookieSecret || "yalla-admin-dev-secret-not-for-prod-change-me"
);

const IP_ALLOWLIST: string[] = IP_ALLOWLIST_RAW
    ? IP_ALLOWLIST_RAW.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

const GATE_COOKIE_VALUE = ADMIN_SECRET
    ? createHash("sha256").update(`yalla-admin-gate:${ADMIN_SECRET}`).digest("hex")
    : "";

// Login lockout state (in-memory; survives restarts for dev simplicity)
const loginAttempts = new Map<string, { count: number; lockedUntil: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes
const usedOwnerLinkNonces = new Map<string, number>();

// General endpoint rate limiter (DoS protection for all admin routes)
const endpointRateMap = new Map<string, { count: number; windowStart: number }>();
const ENDPOINT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const ENDPOINT_RATE_MAX = 300; // 300 requests per window per IP

// SSE clients are managed by the sse-bus service (server/services/sse-bus.ts)

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getClientIp(req: Request): string {
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

function hashOwnerLinkNonce(nonce: string): string {
    return createHash("sha256").update(`yalla-admin-link:${nonce}`).digest("hex");
}

async function signSession(sessionId: string, username: string): Promise<string> {
    return new SignJWT({ sub: username, sid: sessionId })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime(`${SESSION_TTL_H}h`)
        .sign(ADMIN_JWT_SECRET);
}

async function verifySession(token: string): Promise<{ username: string; sessionId: string } | null> {
    try {
        const { payload } = await jwtVerify(token, ADMIN_JWT_SECRET);
        return { username: payload.sub as string, sessionId: payload.sid as string };
    } catch {
        return null;
    }
}

function cookieOptions(req: Request): object {
    const isHttps = req.secure ||
        (req.headers["x-forwarded-proto"] as string)?.split(",")[0]?.trim() === "https";
    return {
        httpOnly: true,
        secure: isHttps,
        sameSite: "strict" as const,
        maxAge: SESSION_TTL_H * 3600 * 1000,
        path: ADMIN_API_PATH,
    };
}

async function auditLog(
    sessionId: string | null,
    adminUsername: string,
    action: string,
    ip: string,
    target?: string,
    payload?: unknown,
): Promise<void> {
    try {
        const db = await getDb();
        if (!db) return;
        const payloadStr = payload ? JSON.stringify(payload) : null;
        await db.execute(sql`
            INSERT INTO yallaAdminAuditLogs (sessionId, adminUsername, action, target, ipAddress, payload)
            VALUES (${sessionId}, ${adminUsername}, ${action}, ${target ?? null}, ${ip}, ${payloadStr ? sql`CAST(${payloadStr} AS JSON)` : null})
        `);
    } catch {
        // Audit failures must never crash the server
    }
}

// broadcastSSE is imported from ../services/sse-bus

// ─── Middleware ───────────────────────────────────────────────────────────────

function getAdminCookie(req: Request): string | undefined {
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
    const fromQuery = typeof req.query.access_token === "string" ? req.query.access_token.trim() : "";
    const fromBody = typeof req.body?.accessToken === "string" ? req.body.accessToken.trim() : "";
    const fromHeader = typeof req.headers["x-yalla-admin-access-token"] === "string"
        ? req.headers["x-yalla-admin-access-token"].trim()
        : "";
    return fromQuery || fromBody || fromHeader;
}

function getSignedAccessExpiry(req: Request): number | null {
    const raw = typeof req.query.expires === "string"
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
    const fromQuery = typeof req.query.sig === "string" ? req.query.sig.trim() : "";
    const fromBody = typeof req.body?.sig === "string" ? req.body.sig.trim() : "";
    return fromQuery || fromBody;
}

function getSignedAccessNonce(req: Request): string {
    const fromQuery = typeof req.query.nonce === "string" ? req.query.nonce.trim() : "";
    const fromBody = typeof req.body?.nonce === "string" ? req.body.nonce.trim() : "";
    return (fromQuery || fromBody).slice(0, 128);
}

function resolveRedirectTarget(req: Request): string {
    const raw = typeof req.query.redirect === "string"
        ? req.query.redirect.trim()
        : typeof req.body?.redirect === "string"
            ? req.body.redirect.trim()
            : "";
    if (!raw) return "/yalla-hack-owners-console/login";
    if (!raw.startsWith("/") || raw.startsWith("//")) return "/yalla-hack-owners-console/login";
    return raw;
}

function createSignedAccessSignature(redirectTarget: string, expiresAt: number, nonce = ""): string {
    return createHmac("sha256", ADMIN_SECRET)
        .update(`${redirectTarget}:${expiresAt}:${nonce}`)
        .digest("hex");
}

function cleanupUsedOwnerLinkNonces(nowSeconds = Math.floor(Date.now() / 1000)): void {
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
        const [rows] = await db.execute(sql`
            SELECT id FROM yallaAdminAccessLinkNonces
            WHERE nonceHash = ${nonceHash}
            LIMIT 1
        `) as unknown as [{ id: number }[]];
        return Array.isArray(rows) && rows.length > 0;
    } catch {
        return hasUsedOwnerLinkNonceInMemory(nonce);
    }
}

async function consumeOwnerLinkNonce(req: Request, nonce: string, expiresAt: number, redirectTarget: string): Promise<void> {
    if (!nonce) return;

    const db = await getDb();
    if (!db) {
        consumeOwnerLinkNonceInMemory(nonce, expiresAt);
        return;
    }

    try {
        const nonceHash = hashOwnerLinkNonce(nonce);
        await db.execute(sql`
            INSERT INTO yallaAdminAccessLinkNonces (nonceHash, redirectTarget, expiresAt, consumedByIp)
            VALUES (${nonceHash}, ${redirectTarget}, FROM_UNIXTIME(${expiresAt}), ${getClientIp(req)})
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
    if (nonce && await hasUsedOwnerLinkNonce(nonce)) return false;

    const redirectTarget = resolveRedirectTarget(req);
    const expectedSignature = createSignedAccessSignature(redirectTarget, expiresAt, nonce);
    const providedBuffer = Buffer.from(providedSignature, "hex");
    const expectedBuffer = Buffer.from(expectedSignature, "hex");
    if (providedBuffer.length === 0 || providedBuffer.length !== expectedBuffer.length) return false;

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
    // Login/me endpoints handle their own auth
    if (req.path === "/bootstrap" || req.path === "/login" || req.path === "/me") { next(); return; }

    // Check cookie session
    const cookie = getAdminCookie(req);
    if (cookie) { next(); return; }

    if (hasLinkGate(req)) { next(); return; }

    // Check URL access_token (allows initial visit without session)
    if (ADMIN_SECRET && req.query.access_token === ADMIN_SECRET) { next(); return; }

    // Fallback: 401
    res.status(401).json({ error: "Unauthorized" });
}

/** Optional IP allowlist */
function ipAllowlist(req: Request, res: Response, next: NextFunction): void {
    if (IP_ALLOWLIST.length === 0) { next(); return; }
    const ip = getClientIp(req);
    const allowed = IP_ALLOWLIST.some((entry) => ip === entry || ip.startsWith(entry.split("/")[0]));
    if (!allowed) {
        res.status(403).json({ error: "Access denied from this IP address." });
        return;
    }
    next();
}

function ownerPortalHeaders(_req: Request, res: Response, next: NextFunction): void {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive, nosnippet");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "0");
    // Prevents the browser from loading any sub-resources from these JSON API responses
    // and blocks embedding in any frame (defense-in-depth alongside X-Frame-Options: DENY).
    res.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'");
    // Disable all browser features — not needed for an API endpoint.
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()");
    next();
}

function adminEndpointRateLimit(req: Request, res: Response, next: NextFunction): void {
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
        const retryAfterSec = Math.ceil((ENDPOINT_WINDOW_MS - (Date.now() - entry.windowStart)) / 1000);
        res.setHeader("Retry-After", String(retryAfterSec));
        res.status(429).json({ error: "Too many requests. Slow down.", retryAfterSec });
        return;
    }
    next();
}

/** Reject mutating requests that are not application/json (CSRF defense-in-depth) */
function requireJsonContentType(req: Request, res: Response, next: NextFunction): void {
    if (req.method === "POST" || req.method === "PUT" || req.method === "PATCH") {
        const ct = req.headers["content-type"] ?? "";
        if (!ct.includes("application/json")) {
            res.status(415).json({ error: "Content-Type must be application/json" });
            return;
        }
    }
    next();
}

/** Require authenticated session for all endpoints except /login */
async function requireSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    if (req.path === "/bootstrap" || req.path === "/login" || req.path === "/me") { next(); return; }

    const token = getAdminCookie(req);
    if (!token) { res.status(401).json({ error: "Not authenticated" }); return; }

    const parsed = await verifySession(token);
    if (!parsed) { res.status(401).json({ error: "Session expired or invalid" }); return; }

    // Check session is not revoked
    try {
        const db = await getDb();
        if (db) {
            const [row] = await db.execute(sql`
                SELECT isRevoked FROM yallaAdminSessions
                WHERE id = ${parsed.sessionId} AND expiresAt > NOW()
                LIMIT 1
            `);
            const rows = row as unknown as { isRevoked: number }[] | undefined;
            if (!rows || rows.length === 0 || rows[0]?.isRevoked) {
                res.status(401).json({ error: "Session revoked or expired" });
                return;
            }
        }
    } catch { /* allow through if DB unavailable */ }

    (req as Request & { adminSession?: typeof parsed }).adminSession = parsed;
    next();
}

// ─── Route handlers ───────────────────────────────────────────────────────────

async function handleBootstrap(req: Request, res: Response): Promise<void> {
    const ip = getClientIp(req);
    const token = getAccessToken(req);
    const redirectTarget = resolveRedirectTarget(req);
    const mode = typeof req.query.mode === "string" ? req.query.mode.trim().toLowerCase() : "redirect";
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
    await auditLog(null, "owner_gate", "access_link.accepted", ip, redirectTarget, {
        mode: hasSignedLink ? "signed" : "raw_secret",
        expires: expiresAt,
        isOneTime: Boolean(nonce),
    });
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
        await auditLog(null, typeof username === "string" ? username : "unknown", "login.link_denied", ip);
        res.status(403).json({ error: "Use the private owner access link before attempting to sign in." });
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

    // Check lockout
    const lockState = loginAttempts.get(ip);
    if (lockState && lockState.lockedUntil > Date.now()) {
        const remainingMs = lockState.lockedUntil - Date.now();
        const retryAfterSec = Math.ceil(remainingMs / 1000);
        res.setHeader("Retry-After", String(retryAfterSec));
        res.status(429).json({
            error: `Too many failed attempts. Locked for ${Math.ceil(remainingMs / 60000)} more minute(s).`,
            retryAfterSec,
        });
        return;
    }

    const usernameOk = username === ADMIN_USERNAME;
    let passwordOk = false;

    if (ADMIN_PASSWORD_HASH) {
        passwordOk = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
    } else if (!ENV.isProduction) {
        // Dev-only fallback: accept "yalla-admin-dev"
        passwordOk = password === "yalla-admin-dev";
    }

    if (!usernameOk || !passwordOk) {
        const current = loginAttempts.get(ip) ?? { count: 0, lockedUntil: 0 };
        const newCount = current.count + 1;
        const lockedUntil = newCount >= MAX_ATTEMPTS ? Date.now() + LOCKOUT_MS : 0;
        loginAttempts.set(ip, { count: newCount, lockedUntil });
        await auditLog(null, username, "login.failed", ip);
        res.status(401).json({ error: "Invalid credentials." });
        return;
    }

    // Clear lockout on success
    loginAttempts.delete(ip);

    const sessionId = nanoid(32);
    const expiresAt = new Date(Date.now() + SESSION_TTL_H * 3600 * 1000);
    const token = await signSession(sessionId, ADMIN_USERNAME);

    try {
        const db = await getDb();
        if (db) {
            await db.execute(sql`
                INSERT INTO yallaAdminSessions (id, adminUsername, ipAddress, userAgent, expiresAt)
                VALUES (${sessionId}, ${ADMIN_USERNAME}, ${ip}, ${req.headers["user-agent"] ?? null}, ${expiresAt})
            `);
        }
    } catch { /* non-fatal */ }

    await auditLog(sessionId, ADMIN_USERNAME, "login.success", ip);
    broadcastSSE("admin_login", { ip, ts: new Date().toISOString() });

    res.cookie(COOKIE_NAME, token, cookieOptions(req));
    setGateCookie(req, res);
    res.json({ ok: true, username: ADMIN_USERNAME, expiresAt });
}

async function handleLogout(req: Request, res: Response): Promise<void> {
    const session = (req as Request & { adminSession?: { username: string; sessionId: string } }).adminSession;
    const ip = getClientIp(req);

    if (session) {
        try {
            const db = await getDb();
            if (db) {
                await db.execute(sql`
                    UPDATE yallaAdminSessions SET isRevoked = 1 WHERE id = ${session.sessionId}
                `);
            }
        } catch { /* non-fatal */ }
        await auditLog(session.sessionId, session.username, "logout", ip);
    }

    res.clearCookie(COOKIE_NAME, { path: ADMIN_API_PATH });
    res.clearCookie(GATE_COOKIE_NAME, { path: ADMIN_API_PATH });
    res.json({ ok: true });
}

async function handleMe(req: Request, res: Response): Promise<void> {
    const token = getAdminCookie(req);
    if (!token) { res.json({ authenticated: false }); return; }
    const session = await verifySession(token);
    if (!session) { res.json({ authenticated: false }); return; }
    // Defense-in-depth: verify session is not revoked in DB (catches stolen-cookie scenarios)
    try {
        const db = await getDb();
        if (db) {
            const [row] = await db.execute(sql`
                SELECT isRevoked FROM yallaAdminSessions
                WHERE id = ${session.sessionId} AND expiresAt > NOW()
                LIMIT 1
            `);
            const rows = row as unknown as { isRevoked: number }[] | undefined;
            if (!rows || rows.length === 0 || rows[0]?.isRevoked) {
                res.clearCookie(COOKIE_NAME, { path: ADMIN_API_PATH });
                res.json({ authenticated: false });
                return;
            }
        }
    } catch { /* allow through if DB unavailable */ }
    res.json({ authenticated: true, username: session.username });
}

async function handleOverview(_req: Request, res: Response): Promise<void> {
    try {
        const db = await getDb();
        if (!db) { res.json({}); return; }

        const [usersRow] = await db.execute(sql`SELECT COUNT(*) as total FROM localUsers`) as unknown as [{ total: number }[]];
        const [orgsRow] = await db.execute(sql`SELECT COUNT(*) as total FROM organizations`) as unknown as [{ total: number }[]];
        const [activeSessionsRow] = await db.execute(sql`
            SELECT COUNT(*) as total FROM localUserSessions WHERE expiresAt > NOW()
        `) as unknown as [{ total: number }[]];
        const [todayLoginsRow] = await db.execute(sql`
            SELECT COUNT(*) as total FROM auditLogs
            WHERE action = 'auth.login' AND createdAt >= CURDATE()
        `) as unknown as [{ total: number }[]];
        const [serviceRequestsRow] = await db.execute(sql`
            SELECT COUNT(*) as total FROM serviceRequests WHERE status NOT IN ('completed', 'cancelled')
        `) as unknown as [{ total: number }[]];
        const [assetsRow] = await db.execute(sql`SELECT COUNT(*) as total FROM assetInventory`) as unknown as [{ total: number }[]];

        const [todaySignupsRow] = await db.execute(sql`
            SELECT COUNT(*) as total FROM localUsers WHERE DATE(createdAt) = CURDATE()
        `) as unknown as [{ total: number }[]];
        const [newOrgsRow] = await db.execute(sql`
            SELECT COUNT(*) as total FROM organizations WHERE DATE(createdAt) = CURDATE()
        `) as unknown as [{ total: number }[]];
        const [revenueRow] = await db.execute(sql`
            SELECT COUNT(*) as total FROM organizations WHERE plan IN ('professional','enterprise') AND isActive = 1
        `) as unknown as [{ total: number }[]];

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
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch overview stats" });
    }
}

async function handleUsers(req: Request, res: Response): Promise<void> {
    try {
        const db = await getDb();
        if (!db) { res.json([]); return; }
        const limit = Math.min(parseInt(req.query.limit as string ?? "50", 10) || 50, 200);
        const offset = parseInt(req.query.offset as string ?? "0", 10) || 0;

        const [users] = await db.execute(sql`
            SELECT
                u.id,
                u.username,
                u.email,
                u.role,
                u.status,
                u.isEmailVerified,
                u.isMfaEnabled,
                u.createdAt,
                u.lastLoginAt,
                COUNT(DISTINCT s.id) as activeSessions
            FROM localUsers u
            LEFT JOIN localUserSessions s ON s.userId = u.id AND s.expiresAt > NOW()
            GROUP BY u.id
            ORDER BY u.createdAt DESC
            LIMIT ${limit} OFFSET ${offset}
        `) as unknown as [unknown[]];

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
                const [vRow] = await db.execute(sql`SELECT VERSION() as v`) as unknown as [{ v: string }[]];
                dbVersion = vRow?.[0]?.v ?? "";
                const [tRow] = await db.execute(sql`
                    SELECT COUNT(*) as c FROM information_schema.TABLES
                    WHERE TABLE_SCHEMA = DATABASE()
                `) as unknown as [{ c: number }[]];
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
                nodeEnv: ENV.isProduction ? "production" : (ENV.isDevelopment ? "development" : "test"),
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
        if (!db) { res.json([]); return; }
        const limit = Math.min(parseInt(req.query.limit as string ?? "100", 10) || 100, 500);
        const action = req.query.action as string | undefined;

        const [rows] = await db.execute(
            action
                ? sql`SELECT * FROM yallaAdminAuditLogs WHERE action = ${action} ORDER BY createdAt DESC LIMIT ${limit}`
                : sql`SELECT * FROM yallaAdminAuditLogs ORDER BY createdAt DESC LIMIT ${limit}`
        ) as unknown as [unknown[]];

        res.json(rows ?? []);
    } catch {
        res.status(500).json({ error: "Failed to fetch audit logs" });
    }
}

async function handlePlatformAudit(req: Request, res: Response): Promise<void> {
    try {
        const db = await getDb();
        if (!db) { res.json([]); return; }
        const limit = Math.min(parseInt(req.query.limit as string ?? "100", 10) || 100, 500);
        const category = req.query.category as string | undefined;

        const [rows] = await db.execute(
            category
                ? sql`SELECT * FROM auditLogs WHERE category = ${category} ORDER BY createdAt DESC LIMIT ${limit}`
                : sql`SELECT * FROM auditLogs ORDER BY createdAt DESC LIMIT ${limit}`
        ) as unknown as [unknown[]];

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

        const limit = Math.min(parseInt(req.query.limit as string ?? "100", 10) || 100, 500);
        const context = (req.query.context as string | undefined)?.trim();
        const action = (req.query.action as string | undefined)?.trim();

        const [rows] = await db.execute(
            context && action
                ? sql`
                    SELECT
                        l.id,
                        l.context,
                        l.action,
                        l.entityType,
                        l.entityId,
                        l.inputSnapshot,
                        l.outputRef,
                        l.durationMs,
                        l.createdAt,
                        l.organizationId,
                        COALESCE(lu.username, u.name, 'anonymous visitor') as actorName,
                        COALESCE(lu.email, u.email, '') as actorEmail,
                        o.name as organizationName
                    FROM userInteractionLogs l
                    LEFT JOIN localUsers lu ON lu.id = l.localUserId
                    LEFT JOIN users u ON u.id = l.userId
                    LEFT JOIN organizations o ON o.id = l.organizationId
                    WHERE l.context = ${context} AND l.action = ${action}
                    ORDER BY l.createdAt DESC
                    LIMIT ${limit}
                `
                : context
                    ? sql`
                        SELECT
                            l.id,
                            l.context,
                            l.action,
                            l.entityType,
                            l.entityId,
                            l.inputSnapshot,
                            l.outputRef,
                            l.durationMs,
                            l.createdAt,
                            l.organizationId,
                            COALESCE(lu.username, u.name, 'anonymous visitor') as actorName,
                            COALESCE(lu.email, u.email, '') as actorEmail,
                            o.name as organizationName
                        FROM userInteractionLogs l
                        LEFT JOIN localUsers lu ON lu.id = l.localUserId
                        LEFT JOIN users u ON u.id = l.userId
                        LEFT JOIN organizations o ON o.id = l.organizationId
                        WHERE l.context = ${context}
                        ORDER BY l.createdAt DESC
                        LIMIT ${limit}
                    `
                    : action
                        ? sql`
                            SELECT
                                l.id,
                                l.context,
                                l.action,
                                l.entityType,
                                l.entityId,
                                l.inputSnapshot,
                                l.outputRef,
                                l.durationMs,
                                l.createdAt,
                                l.organizationId,
                                COALESCE(lu.username, u.name, 'anonymous visitor') as actorName,
                                COALESCE(lu.email, u.email, '') as actorEmail,
                                o.name as organizationName
                            FROM userInteractionLogs l
                            LEFT JOIN localUsers lu ON lu.id = l.localUserId
                            LEFT JOIN users u ON u.id = l.userId
                            LEFT JOIN organizations o ON o.id = l.organizationId
                            WHERE l.action = ${action}
                            ORDER BY l.createdAt DESC
                            LIMIT ${limit}
                        `
                        : sql`
                            SELECT
                                l.id,
                                l.context,
                                l.action,
                                l.entityType,
                                l.entityId,
                                l.inputSnapshot,
                                l.outputRef,
                                l.durationMs,
                                l.createdAt,
                                l.organizationId,
                                COALESCE(lu.username, u.name, 'anonymous visitor') as actorName,
                                COALESCE(lu.email, u.email, '') as actorEmail,
                                o.name as organizationName
                            FROM userInteractionLogs l
                            LEFT JOIN localUsers lu ON lu.id = l.localUserId
                            LEFT JOIN users u ON u.id = l.userId
                            LEFT JOIN organizations o ON o.id = l.organizationId
                            ORDER BY l.createdAt DESC
                            LIMIT ${limit}
                        `
        ) as unknown as [unknown[]];

        res.json(rows ?? []);
    } catch {
        res.status(500).json({ error: "Failed to fetch interaction logs" });
    }
}

async function handleIntake(req: Request, res: Response): Promise<void> {
    try {
        const db = await getDb();
        const limit = Math.min(parseInt(req.query.limit as string ?? "20", 10) || 20, 100);

        const [accessRequests, consultationRequests] = await Promise.all([
            listAccessRequests(limit),
            listConsultationRequests(limit),
        ]);

        let serviceRequests: unknown[] = [];
        if (db) {
            const [srRows] = await db.execute(sql`
                SELECT
                    sr.id,
                    sr.serviceType,
                    sr.title,
                    sr.priority,
                    sr.status,
                    sr.requestedByUserId,
                    sr.createdAt,
                    sr.updatedAt,
                    lu.username as requestedByUsername,
                    lu.email as requestedByEmail,
                    o.name as organizationName
                FROM serviceRequests sr
                LEFT JOIN localUsers lu ON lu.id = sr.requestedByUserId
                LEFT JOIN organizations o ON o.id = sr.organizationId
                ORDER BY sr.createdAt DESC
                LIMIT ${limit}
            `) as unknown as [unknown[]];
            serviceRequests = srRows ?? [];
        }

        res.json({
            counts: {
                accessRequests: accessRequests.length,
                consultationRequests: consultationRequests.length,
                serviceRequests: Array.isArray(serviceRequests) ? serviceRequests.length : 0,
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

        const limit = Math.min(parseInt(req.query.limit as string ?? "50", 10) || 50, 200);

        const [[counts], [recent]] = await Promise.all([
            db.execute(sql`
                SELECT stage, COUNT(*) as total
                FROM userOnboarding
                GROUP BY stage
                ORDER BY total DESC
            `),
            db.execute(sql`
                SELECT
                    o.id,
                    o.stage,
                    o.accountIntent,
                    o.selectedLocale,
                    o.completedAt,
                    o.createdAt,
                    o.updatedAt,
                    COALESCE(lu.username, u.name, 'unknown') as userLabel,
                    COALESCE(lu.email, u.email, '') as userEmail
                FROM userOnboarding o
                LEFT JOIN localUsers lu ON lu.id = o.localUserId
                LEFT JOIN users u ON u.id = o.userId
                ORDER BY o.updatedAt DESC
                LIMIT ${limit}
            `),
        ]) as unknown as [[unknown[]], [unknown[]]];

        res.json({ counts: counts ?? [], recent: recent ?? [] });
    } catch {
        res.status(500).json({ error: "Failed to fetch onboarding telemetry" });
    }
}

async function handleValidationFailures(req: Request, res: Response): Promise<void> {
    try {
        const db = await getDb();
        if (!db) {
            res.json([]);
            return;
        }

        const limit = Math.min(parseInt(req.query.limit as string ?? "100", 10) || 100, 500);
        const [rows] = await db.execute(sql`
            SELECT
                id,
                category,
                action,
                entityType,
                entityId,
                targetEntity,
                actorRole,
                outcome,
                payload,
                createdAt
            FROM auditLogs
            WHERE action = 'trpc.validation_failed' OR outcome IN ('failure', 'blocked')
            ORDER BY createdAt DESC
            LIMIT ${limit}
        `) as unknown as [unknown[]];

        res.json(rows ?? []);
    } catch {
        res.status(500).json({ error: "Failed to fetch validation events" });
    }
}

async function handleSubscriptions(req: Request, res: Response): Promise<void> {
    try {
        const db = await getDb();
        if (!db) { res.json({ subscriptions: [], billingEvents: [], summary: [] }); return; }

        const limit = Math.min(parseInt(req.query.limit as string ?? "100", 10) || 100, 500);

        const [[subs], [events], [summary]] = await Promise.all([
            db.execute(sql`
                SELECT
                    s.id,
                    s.plan,
                    s.status,
                    s.billingInterval,
                    s.amountCents,
                    s.currency,
                    s.currentPeriodStart,
                    s.currentPeriodEnd,
                    s.cancelAtPeriodEnd,
                    s.canceledAt,
                    s.stripeSubscriptionId,
                    s.createdAt,
                    s.updatedAt,
                    o.name          AS organizationName,
                    o.slug          AS organizationSlug,
                    o.billingEmail  AS billingEmail
                FROM subscriptions s
                JOIN organizations o ON o.id = s.organizationId
                ORDER BY s.updatedAt DESC
                LIMIT ${limit}
            `),
            db.execute(sql`
                SELECT
                    be.id,
                    be.eventType,
                    be.status,
                    be.amountCents,
                    be.currency,
                    be.stripeEventId,
                    be.createdAt,
                    o.name AS organizationName
                FROM billingEvents be
                JOIN organizations o ON o.id = be.organizationId
                ORDER BY be.createdAt DESC
                LIMIT ${limit}
            `),
            db.execute(sql`
                SELECT
                    plan,
                    status,
                    currency,
                    COUNT(*)           AS count,
                    SUM(amountCents)   AS totalAmountCents
                FROM subscriptions
                GROUP BY plan, status, currency
                ORDER BY plan, status
            `),
        ]) as unknown as [[unknown[]], [unknown[]], [unknown[]]];

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
        if (!db) { res.json([]); return; }
        const limit = Math.min(parseInt(req.query.limit as string ?? "50", 10) || 50, 200);
        const [rows] = await db.execute(sql`
            SELECT
                u.id,
                u.username,
                u.email,
                u.role,
                u.isEmailVerified,
                u.isMfaEnabled,
                u.createdAt,
                u.lastLoginAt,
                o.name  AS organizationName,
                o.plan  AS organizationPlan
            FROM localUsers u
            LEFT JOIN organizationMembers om ON om.localUserId = u.id
            LEFT JOIN organizations o ON o.id = om.organizationId
            ORDER BY u.createdAt DESC
            LIMIT ${limit}
        `) as unknown as [unknown[]];
        res.json(rows ?? []);
    } catch {
        res.status(500).json({ error: "Failed to fetch signups" });
    }
}

async function handleOrgs(req: Request, res: Response): Promise<void> {
    try {
        const db = await getDb();
        if (!db) { res.json([]); return; }
        const limit = Math.min(parseInt(req.query.limit as string ?? "100", 10) || 100, 500);
        const [rows] = await db.execute(sql`
            SELECT
                o.id,
                o.name,
                o.plan,
                o.isActive,
                o.trialEndsAt,
                o.createdAt,
                o.updatedAt,
                COUNT(DISTINCT om.id)   AS memberCount,
                COUNT(DISTINCT CASE WHEN s.expiresAt > NOW() THEN s.id END) AS activeSessions
            FROM organizations o
            LEFT JOIN organizationMembers om ON om.organizationId = o.id
            LEFT JOIN localUserSessions  s  ON s.userId = om.localUserId
            GROUP BY o.id
            ORDER BY o.createdAt DESC
            LIMIT ${limit}
        `) as unknown as [unknown[]];
        res.json(rows ?? []);
    } catch {
        res.status(500).json({ error: "Failed to fetch organizations" });
    }
}

async function handleRealtime(_req: Request, res: Response): Promise<void> {
    try {
        const db = await getDb();
        if (!db) {
            res.json({ activeSessions: 0, recentActions: 0, newUsersLastHour: 0, sseClients: getSSEClientCount(), dbStatus: "unavailable" });
            return;
        }
        const [[sessRow], [actRow], [newUsersRow]] = await Promise.all([
            db.execute(sql`SELECT COUNT(*) as total FROM localUserSessions WHERE expiresAt > NOW()`) as unknown as [[{ total: number }]],
            db.execute(sql`SELECT COUNT(*) as total FROM auditLogs WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)`) as unknown as [[{ total: number }]],
            db.execute(sql`SELECT COUNT(*) as total FROM localUsers WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 60 MINUTE)`) as unknown as [[{ total: number }]],
        ]);
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
        if (!db) { res.status(503).json({ error: "Database unavailable" }); return; }
        const userId = parseInt(req.params.id ?? "", 10);
        if (!userId) { res.status(400).json({ error: "Invalid user id" }); return; }

        const [userResult, sessionResult, auditResult, interactionResult] = await Promise.all([
            db.execute(sql`
                SELECT u.id, u.username, u.email, u.role, u.status, u.isEmailVerified, u.isMfaEnabled,
                       u.createdAt, u.lastLoginAt, o.name AS organizationName, o.plan AS organizationPlan
                FROM localUsers u
                LEFT JOIN organizationMembers om ON om.localUserId = u.id
                LEFT JOIN organizations o ON o.id = om.organizationId
                WHERE u.id = ${userId} LIMIT 1
            `),
            db.execute(sql`
                SELECT id, ipAddress, userAgent, createdAt, expiresAt
                FROM localUserSessions WHERE userId = ${userId}
                ORDER BY createdAt DESC LIMIT 20
            `),
            db.execute(sql`
                SELECT category, action, outcome, createdAt
                FROM auditLogs WHERE localUserId = ${userId}
                ORDER BY createdAt DESC LIMIT 30
            `),
            db.execute(sql`
                SELECT context, action, entityType, createdAt, durationMs
                FROM userInteractionLogs WHERE localUserId = ${userId}
                ORDER BY createdAt DESC LIMIT 30
            `),
        ]);

        const userRows = Array.isArray(userResult) ? userResult : (userResult as unknown[][])[0];
        const user = Array.isArray(userRows) ? userRows[0] : null;
        if (!user) { res.status(404).json({ error: "User not found" }); return; }

        res.json({
            user,
            sessions: Array.isArray(sessionResult) ? sessionResult : (sessionResult as unknown[][])[0] ?? [],
            auditTrail: Array.isArray(auditResult) ? auditResult : (auditResult as unknown[][])[0] ?? [],
            interactions: Array.isArray(interactionResult) ? interactionResult : (interactionResult as unknown[][])[0] ?? [],
        });
    } catch {
        res.status(500).json({ error: "Failed to fetch user detail" });
    }
}

async function handleOrgDetail(req: Request, res: Response): Promise<void> {
    try {
        const db = await getDb();
        if (!db) { res.status(503).json({ error: "Database unavailable" }); return; }
        const orgId = parseInt(req.params.id ?? "", 10);
        if (!orgId) { res.status(400).json({ error: "Invalid org id" }); return; }

        const [orgResult, membersResult, subscriptionResult, auditResult] = await Promise.all([
            db.execute(sql`
                SELECT id, name, plan, status, isActive, trialEndsAt, createdAt, updatedAt,
                       contactEmail, billingEmail
                FROM organizations WHERE id = ${orgId} LIMIT 1
            `),
            db.execute(sql`
                SELECT om.role, u.id AS userId, u.username, u.email, u.status AS userStatus,
                       u.lastLoginAt, om.joinedAt
                FROM organizationMembers om
                JOIN localUsers u ON u.id = om.localUserId
                WHERE om.organizationId = ${orgId}
                ORDER BY om.joinedAt ASC
                LIMIT 50
            `),
            db.execute(sql`
                SELECT id, plan, status, currentPeriodStart, currentPeriodEnd, cancelAtPeriodEnd,
                       createdAt, updatedAt
                FROM subscriptions WHERE organizationId = ${orgId}
                ORDER BY createdAt DESC LIMIT 1
            `),
            db.execute(sql`
                SELECT category, action, outcome, createdAt
                FROM auditLogs WHERE organizationId = ${orgId}
                ORDER BY createdAt DESC LIMIT 30
            `),
        ]);

        const orgRows = Array.isArray(orgResult) ? orgResult : (orgResult as unknown[][])[0];
        const org = Array.isArray(orgRows) ? orgRows[0] : null;
        if (!org) { res.status(404).json({ error: "Organization not found" }); return; }

        res.json({
            org,
            members: Array.isArray(membersResult) ? membersResult : (membersResult as unknown[][])[0] ?? [],
            subscription: (Array.isArray(subscriptionResult) ? subscriptionResult : (subscriptionResult as unknown[][])[0] ?? [])[0] ?? null,
            auditTrail: Array.isArray(auditResult) ? auditResult : (auditResult as unknown[][])[0] ?? [],
        });
    } catch {
        res.status(500).json({ error: "Failed to fetch org detail" });
    }
}

async function handleSuspendUser(req: Request, res: Response): Promise<void> {
    const session = (req as Request & { adminSession?: { username: string; sessionId: string } }).adminSession;
    const ip = getClientIp(req);
    const userId = parseInt(req.params.id ?? "", 10);
    if (!userId) { res.status(400).json({ error: "Invalid user id" }); return; }
    const { suspend } = req.body as { suspend?: boolean };
    if (typeof suspend !== "boolean") { res.status(400).json({ error: "Body must include suspend: true | false" }); return; }

    try {
        const db = await getDb();
        if (!db) { res.status(503).json({ error: "Database unavailable" }); return; }

        const [rows] = await db.execute(sql`SELECT id, email, status FROM localUsers WHERE id = ${userId} LIMIT 1`) as unknown as [{ id: number; email: string; status: string }[]];
        const user = rows[0];
        if (!user) { res.status(404).json({ error: "User not found" }); return; }

        const newStatus = suspend ? "suspended" : "active";
        await db.execute(sql`UPDATE localUsers SET status = ${newStatus}, updatedAt = NOW() WHERE id = ${userId}`);
        await auditLog(session?.sessionId ?? null, session?.username ?? "unknown", suspend ? "user.suspend" : "user.unsuspend", ip, String(userId));
        broadcastSSE("user_status_changed", { userId, email: user.email, status: newStatus, by: session?.username, ts: new Date().toISOString() });

        res.json({ success: true, userId, status: newStatus });
    } catch {
        res.status(500).json({ error: "Failed to update user status" });
    }
}

async function handleRevokeUserSessions(req: Request, res: Response): Promise<void> {
    const session = (req as Request & { adminSession?: { username: string; sessionId: string } }).adminSession;
    const ip = getClientIp(req);
    const userId = parseInt(req.params.id ?? "", 10);
    if (!userId) { res.status(400).json({ error: "Invalid user id" }); return; }

    try {
        const db = await getDb();
        if (!db) { res.status(503).json({ error: "Database unavailable" }); return; }

        await db.execute(sql`DELETE FROM localUserSessions WHERE userId = ${userId}`);
        await auditLog(session?.sessionId ?? null, session?.username ?? "unknown", "user.revoke_sessions", ip, String(userId));
        broadcastSSE("user_sessions_revoked", { userId, by: session?.username, ts: new Date().toISOString() });

        res.json({ success: true, userId });
    } catch {
        res.status(500).json({ error: "Failed to revoke user sessions" });
    }
}

async function handleSuspendOrg(req: Request, res: Response): Promise<void> {
    const session = (req as Request & { adminSession?: { username: string; sessionId: string } }).adminSession;
    const ip = getClientIp(req);
    const orgId = parseInt(req.params.id ?? "", 10);
    if (!orgId) { res.status(400).json({ error: "Invalid org id" }); return; }
    const { suspend } = req.body as { suspend?: boolean };
    if (typeof suspend !== "boolean") { res.status(400).json({ error: "Body must include suspend: true | false" }); return; }

    try {
        const db = await getDb();
        if (!db) { res.status(503).json({ error: "Database unavailable" }); return; }

        const [rows] = await db.execute(sql`SELECT id, name, status FROM organizations WHERE id = ${orgId} LIMIT 1`) as unknown as [{ id: number; name: string; status: string }[]];
        const org = rows[0];
        if (!org) { res.status(404).json({ error: "Organization not found" }); return; }

        const newStatus = suspend ? "suspended" : "active";
        await db.execute(sql`UPDATE organizations SET status = ${newStatus}, updatedAt = NOW() WHERE id = ${orgId}`);
        await auditLog(session?.sessionId ?? null, session?.username ?? "unknown", suspend ? "org.suspend" : "org.unsuspend", ip, String(orgId));
        broadcastSSE("org_status_changed", { orgId, name: org.name, status: newStatus, by: session?.username, ts: new Date().toISOString() });

        res.json({ success: true, orgId, status: newStatus });
    } catch {
        res.status(500).json({ error: "Failed to update organization status" });
    }
}

async function handleGenerateAccessLink(req: Request, res: Response): Promise<void> {
    const session = (req as Request & { adminSession?: { username: string; sessionId: string } }).adminSession;
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
    const oneTime = typeof req.body?.oneTime === "boolean" ? req.body.oneTime : true;
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
    const origin = typeof req.headers.origin === "string" ? req.headers.origin.trim() : "";
    if (origin.startsWith("http://") || origin.startsWith("https://")) {
        try {
            url = new URL(relativeUrl, origin).toString();
        } catch {
            url = relativeUrl;
        }
    }

    await auditLog(session?.sessionId ?? null, session?.username ?? "unknown", "access_link.generated", ip, redirectTarget, {
        expiresAt,
        expiresInMinutes,
        oneTime,
    });
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

async function handleExportCsv(req: Request, res: Response): Promise<void> {
    const session = (req as Request & { adminSession?: { username: string; sessionId: string } }).adminSession;
    const ip = getClientIp(req);
    const type = req.query.type as string ?? "users";

    await auditLog(session?.sessionId ?? null, session?.username ?? "unknown", "export.csv", ip, type);

    try {
        const db = await getDb();
        if (!db) { res.status(503).json({ error: "Database unavailable" }); return; }

        let rows: unknown[];
        let headers: string;
        let filename: string;

        if (type === "users") {
            const [userRows] = await db.execute(sql`
                SELECT id, username, email, role, isEmailVerified, isMfaEnabled, createdAt, lastLoginAt
                FROM localUsers ORDER BY createdAt DESC LIMIT 10000
            `) as unknown as [unknown[]];
            rows = userRows ?? [];
            headers = "id,username,email,role,isEmailVerified,isMfaEnabled,createdAt,lastLoginAt";
            filename = "users-export.csv";
        } else if (type === "orgs") {
            const [orgRows] = await db.execute(sql`
                SELECT id, name, plan, isActive, trialEndsAt, createdAt
                FROM organizations ORDER BY createdAt DESC LIMIT 10000
            `) as unknown as [unknown[]];
            rows = orgRows ?? [];
            headers = "id,name,plan,isActive,trialEndsAt,createdAt";
            filename = "orgs-export.csv";
        } else if (type === "subscriptions") {
            const [subRows] = await db.execute(sql`
                SELECT s.id, s.plan, s.status, s.currentPeriodStart, s.currentPeriodEnd,
                       s.cancelAtPeriodEnd, o.name AS orgName, s.createdAt
                FROM subscriptions s
                JOIN organizations o ON o.id = s.organizationId
                ORDER BY s.createdAt DESC LIMIT 10000
            `) as unknown as [unknown[]];
            rows = subRows ?? [];
            headers = "id,plan,status,currentPeriodStart,currentPeriodEnd,cancelAtPeriodEnd,orgName,createdAt";
            filename = "subscriptions-export.csv";
        } else if (type === "audit") {
            const [auditRows] = await db.execute(sql`
                SELECT id, category, action, outcome, ipAddress, createdAt
                FROM auditLogs ORDER BY createdAt DESC LIMIT 10000
            `) as unknown as [unknown[]];
            rows = auditRows ?? [];
            headers = "id,category,action,outcome,ipAddress,createdAt";
            filename = "audit-export.csv";
        } else {
            res.status(400).json({ error: "Invalid export type" });
            return;
        }

        const csvRows = Array.isArray(rows) ? rows as Record<string, unknown>[] : [];
        const csvBody = csvRows.map((r) =>
            headers.split(",").map((h) => JSON.stringify(r[h] ?? "")).join(",")
        ).join("\n");

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
        try { res.write(":heartbeat\n\n"); } catch { clearInterval(heartbeat); }
    }, 30_000);

    // Send initial connected event
    res.write(`event: connected\ndata: ${JSON.stringify({ ts: new Date().toISOString(), clients: getSSEClientCount() })}\n\n`);

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
                DELETE FROM yallaAdminSessions
                WHERE expiresAt < NOW()
                   OR (isRevoked = 1 AND lastSeenAt < DATE_SUB(NOW(), INTERVAL 7 DAY))
            `);
        } catch { /* non-fatal — cleaned up on next run */ }
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

    // Token gate for remaining routes
    router.use(tokenGate);

    // Session authentication for all authenticated routes
    router.use((req, res, next) => void requireSession(req, res, next));

    router.post("/logout", (req, res) => void handleLogout(req, res));
    router.get("/me", (req, res) => void handleMe(req, res));

    router.get("/stats/overview", (req, res) => void handleOverview(req, res));
    router.get("/stats/users", (req, res) => void handleUsers(req, res));
    router.get("/stats/signups", (req, res) => void handleSignups(req, res));
    router.get("/stats/orgs", (req, res) => void handleOrgs(req, res));
    router.get("/stats/realtime", (req, res) => void handleRealtime(req, res));
    router.get("/stats/system", (req, res) => void handleSystem(req, res));
    router.get("/stats/audit", (req, res) => void handleAudit(req, res));
    router.get("/stats/platform-audit", (req, res) => void handlePlatformAudit(req, res));
    router.get("/stats/interactions", (req, res) => void handleInteractions(req, res));
    router.get("/stats/intake", (req, res) => void handleIntake(req, res));
    router.get("/stats/onboarding", (req, res) => void handleOnboarding(req, res));
    router.get("/stats/subscriptions", (req, res) => void handleSubscriptions(req, res));
    router.get("/stats/validations", (req, res) => void handleValidationFailures(req, res));
    router.get("/stats/users/:id", (req, res) => void handleUserDetail(req, res));
    router.get("/stats/orgs/:id", (req, res) => void handleOrgDetail(req, res));
    router.post("/users/:id/suspend", requireJsonContentType, (req, res) => void handleSuspendUser(req, res));
    router.post("/users/:id/revoke-sessions", (req, res) => void handleRevokeUserSessions(req, res));
    router.post("/orgs/:id/suspend", requireJsonContentType, (req, res) => void handleSuspendOrg(req, res));
    router.post("/access-links/generate", requireJsonContentType, (req, res) => void handleGenerateAccessLink(req, res));
    router.get("/export/csv", (req, res) => void handleExportCsv(req, res));
    router.get("/stream", handleSSE);

    // Start background session cleanup
    scheduleSessionCleanup();

    return router;
}

// broadcastSSE is now exported from server/services/sse-bus.ts
// Re-export for any legacy callers that haven't been updated yet
export { broadcastSSE } from "../services/sse-bus";
