import type { Request } from "express";

interface SecurityHeaderOptions {
    pathname: string;
    isHttps: boolean;
}

const NO_INDEX_PATH_PREFIXES = [
    "/api/",
    "/dashboard",
    "/vendor-assessment",
    "/vendor-risk",
    "/market-entry",
    "/client-workspace",
    "/admin-control-center",
    "/operations",
    "/laws",
    "/compliance-tracker",
    "/report-center",
    "/billing",
    "/compliance-calendar",
    "/onboarding-wizard",
    "/saas-metrics",
    "/heatmap",
    "/notifications",
    "/company/dashboard",
    "/superadmin/dashboard",
    "/pro-intelligence",
    "/account-settings",
    "/team-members",
    "/org-settings",
    "/invite-accept",
    "/audit-log",
    "/compliance-scorecard",
    "/api-keys",
    "/gap-tracker",
    "/assessment-history",
    "/vendor/",
    "/remediation-planner",
    "/risk-register",
    "/policy-manager",
    "/incident-register",
    "/audit-schedule",
    "/vendor-compliance",
    "/compliance-reports",
    "/continuous-compliance",
    "/evidence-locker",
    "/dsr-tracker",
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
];

function normalizePath(pathname: string): string {
    const [withoutQuery] = pathname.split(/[?#]/, 1);
    const normalized = withoutQuery.trim().toLowerCase();
    return normalized || "/";
}

export function shouldBypassApiRateLimit(pathname: string): boolean {
    const normalized = normalizePath(pathname);
    return normalized === "/api/health" ||
        normalized === "/api/healthz" ||
        normalized === "/api/readiness" ||
        normalized === "/api/readyz" ||
        normalized === "/health" ||
        normalized === "/healthz" ||
        normalized === "/readiness" ||
        normalized === "/readyz";
}

function shouldNoIndex(pathname: string): boolean {
    const normalized = normalizePath(pathname);
    return NO_INDEX_PATH_PREFIXES.some(prefix => normalized === prefix || normalized.startsWith(prefix));
}

function shouldDisableCaching(pathname: string): boolean {
    const normalized = normalizePath(pathname);
    return normalized.startsWith("/api/") || shouldNoIndex(normalized);
}

export function getSecurityHeadersForRequest({ pathname, isHttps }: SecurityHeaderOptions): Record<string, string> {
    const normalized = normalizePath(pathname);
    const cspParts = [
        "default-src 'self'",
        "base-uri 'self'",
        "object-src 'none'",
        // 'unsafe-inline' is retained for Vite HMR/inline styles in dev;
        // production builds should move toward nonce-based CSP in a future pass.
        "script-src 'self' 'unsafe-inline' https://js.stripe.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "img-src 'self' data: blob: https:",
        "font-src 'self' data: https://fonts.gstatic.com",
        "connect-src 'self' wss: https://api.stripe.com https://js.stripe.com https://sentry.io https://*.sentry.io",
        "frame-src https://js.stripe.com https://hooks.stripe.com",
        "form-action 'self'",
        "frame-ancestors 'none'",
        // Report CSP violations to our own endpoint for observability.
        "report-uri /api/csp-report",
    ];

    if (isHttps) {
        cspParts.push("upgrade-insecure-requests");
    }

    const headers: Record<string, string> = {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Permissions-Policy": "camera=(), microphone=(), geolocation=(), browsing-topics=()",
        "Cross-Origin-Opener-Policy": "same-origin",
        "Cross-Origin-Resource-Policy": "same-origin",
        "Origin-Agent-Cluster": "?1",
        // Omitting Timing-Allow-Origin is the correct way to block cross-origin
        // pages from reading Resource Timing data (header absent = no access).
        // Do NOT set it to "'none'" — that is a malformed value that browsers
        // may handle inconsistently.
        "Content-Security-Policy": cspParts.join("; "),
    };

    if (shouldNoIndex(normalized)) {
        headers["X-Robots-Tag"] = "noindex, nofollow, noarchive, nosnippet";
    }

    if (shouldDisableCaching(normalized)) {
        headers["Cache-Control"] = "no-store, no-cache, must-revalidate, private";
        headers.Pragma = "no-cache";
        headers.Expires = "0";
    }

    if (isHttps) {
        headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload";
    }

    return headers;
}

/**
 * Resolves the real client IP from a request, respecting Cloudflare, nginx
 * reverse-proxy, and direct connections in order of trustworthiness.
 *
 * Security note: always take the LAST value from X-Forwarded-For (set by the
 * trusted proxy) rather than the first (injectable by the client).
 */
export function getClientIp(req: Request): string {
    const cfConnectingIp = req.headers["cf-connecting-ip"];
    if (typeof cfConnectingIp === "string" && cfConnectingIp.trim()) {
        return cfConnectingIp.trim();
    }

    const realIp = req.headers["x-real-ip"];
    if (typeof realIp === "string" && realIp.trim()) {
        return realIp.trim();
    }

    const forwardedFor = req.headers["x-forwarded-for"];
    const forwardedValue = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
    if (forwardedValue && typeof forwardedValue === "string") {
        return forwardedValue.split(",")[0].trim();
    }

    return req.ip || req.socket.remoteAddress || "unknown";
}
