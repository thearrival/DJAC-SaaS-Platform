import { describe, it, expect } from "vitest";

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

function shouldBypassApiRateLimit(pathname: string): boolean {
  const normalized = normalizePath(pathname);
  return (
    normalized === "/api/health" ||
    normalized === "/api/healthz" ||
    normalized === "/api/readiness" ||
    normalized === "/api/readyz" ||
    normalized === "/health" ||
    normalized === "/healthz" ||
    normalized === "/readiness" ||
    normalized === "/readyz"
  );
}

function shouldNoIndex(pathname: string): boolean {
  const normalized = normalizePath(pathname);
  return NO_INDEX_PATH_PREFIXES.some(
    prefix => normalized === prefix || normalized.startsWith(prefix)
  );
}

function shouldDisableCaching(pathname: string): boolean {
  const normalized = normalizePath(pathname);
  return normalized.startsWith("/api/") || shouldNoIndex(normalized);
}

function buildCsp(isProduction: boolean): string[] {
  const parts = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' wss: https://api.stripe.com https://js.stripe.com https://sentry.io https://*.sentry.io https://*.supabase.co wss://*.supabase.co",
    "frame-src https://js.stripe.com https://hooks.stripe.com",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "report-uri /api/csp-report",
  ];

  if (isProduction) {
    parts.push("script-src 'self' https://js.stripe.com 'strict-dynamic'");
    parts.push("style-src 'self' 'unsafe-inline' https://fonts.googleapis.com");
    parts.push("upgrade-insecure-requests");
  } else {
    parts.push("script-src 'self' 'unsafe-inline' https://js.stripe.com");
    parts.push("style-src 'self' 'unsafe-inline' https://fonts.googleapis.com");
  }

  return parts;
}

function getSecurityHeadersForRequest(options: {
  pathname: string;
  isHttps: boolean;
  isProduction: boolean;
}): Record<string, string> {
  const normalized = normalizePath(options.pathname);
  const cspParts = buildCsp(options.isProduction);
  const roCspParts = buildCsp(false).map(p =>
    p.startsWith("report-uri") ? "report-uri /api/csp-report?ro=1" : p
  );

  const headers: Record<string, string> = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy":
      "camera=(), microphone=(), geolocation=(), browsing-topics=(), usb=(), midi=(), sync-xhr=(), magnetometer=(), gyroscope=(), serial=(), fullscreen=(self)",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-origin",
    "Origin-Agent-Cluster": "?1",
    "Content-Security-Policy": cspParts.join("; "),
    "Content-Security-Policy-Report-Only": roCspParts.join("; "),
  };

  if (shouldNoIndex(normalized)) {
    headers["X-Robots-Tag"] = "noindex, nofollow, noarchive, nosnippet";
  }

  if (shouldDisableCaching(normalized)) {
    headers["Cache-Control"] = "no-store, no-cache, must-revalidate, private";
    headers.Pragma = "no-cache";
    headers.Expires = "0";
  }

  if (options.isHttps) {
    headers["Strict-Transport-Security"] =
      "max-age=63072000; includeSubDomains; preload";
  }

  return headers;
}

function getClientIp(req: {
  headers: Record<string, string | string[] | undefined>;
  ip?: string;
  socket?: { remoteAddress?: string };
}): string {
  const cfConnectingIp = req.headers["cf-connecting-ip"];
  if (typeof cfConnectingIp === "string" && cfConnectingIp.trim()) {
    return cfConnectingIp.trim();
  }

  const realIp = req.headers["x-real-ip"];
  if (typeof realIp === "string" && realIp.trim()) {
    return realIp.trim();
  }

  const forwardedFor = req.headers["x-forwarded-for"];
  const forwardedValue = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : forwardedFor;
  if (forwardedValue && typeof forwardedValue === "string") {
    return forwardedValue.split(",")[0].trim();
  }

  return req.ip || req.socket?.remoteAddress || "unknown";
}

function parseCspReport(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== "object") return {};
  const report = (body as Record<string, unknown>)["csp-report"];
  if (!report || typeof report !== "object") return {};
  return report as Record<string, unknown>;
}

// ── normalizePath ─────────────────────────────────────────────────────────

describe("normalizePath", () => {
  it("should strip query string", () => {
    expect(normalizePath("/api/health?token=abc")).toBe("/api/health");
  });

  it("should strip fragment", () => {
    expect(normalizePath("/dashboard#section")).toBe("/dashboard");
  });

  it("should lowercase the path", () => {
    expect(normalizePath("/API/Health")).toBe("/api/health");
  });

  it("should return / for empty string", () => {
    expect(normalizePath("")).toBe("/");
  });

  it("should handle whitespace-only path", () => {
    expect(normalizePath("   ")).toBe("/");
  });

  it("should handle path with both query and fragment", () => {
    expect(normalizePath("/api/data?page=1#top")).toBe("/api/data");
  });

  it("should preserve path prefix", () => {
    expect(normalizePath("/api/")).toBe("/api/");
  });

  it("should handle root path", () => {
    expect(normalizePath("/")).toBe("/");
  });
});

// ── shouldBypassApiRateLimit ──────────────────────────────────────────────

describe("shouldBypassApiRateLimit", () => {
  it("should bypass /api/health", () => {
    expect(shouldBypassApiRateLimit("/api/health")).toBe(true);
  });

  it("should bypass /api/healthz", () => {
    expect(shouldBypassApiRateLimit("/api/healthz")).toBe(true);
  });

  it("should bypass /api/readiness", () => {
    expect(shouldBypassApiRateLimit("/api/readiness")).toBe(true);
  });

  it("should bypass /api/readyz", () => {
    expect(shouldBypassApiRateLimit("/api/readyz")).toBe(true);
  });

  it("should bypass /health", () => {
    expect(shouldBypassApiRateLimit("/health")).toBe(true);
  });

  it("should bypass /readiness", () => {
    expect(shouldBypassApiRateLimit("/readiness")).toBe(true);
  });

  it("should bypass /readyz", () => {
    expect(shouldBypassApiRateLimit("/readyz")).toBe(true);
  });

  it("should bypass healthz with query string", () => {
    expect(shouldBypassApiRateLimit("/api/health?from=lb")).toBe(true);
  });

  it("should bypass case-insensitively", () => {
    expect(shouldBypassApiRateLimit("/API/Health")).toBe(true);
  });

  it("should not bypass /api/health/check", () => {
    expect(shouldBypassApiRateLimit("/api/health/check")).toBe(false);
  });

  it("should not bypass other API routes", () => {
    expect(shouldBypassApiRateLimit("/api/users")).toBe(false);
  });

  it("should not bypass regular pages", () => {
    expect(shouldBypassApiRateLimit("/dashboard")).toBe(false);
  });

  it("should not bypass login", () => {
    expect(shouldBypassApiRateLimit("/login")).toBe(false);
  });
});

// ── shouldNoIndex ─────────────────────────────────────────────────────────

describe("shouldNoIndex", () => {
  it("should return true for /api/ routes", () => {
    expect(shouldNoIndex("/api/users")).toBe(true);
  });

  it("should return true for /dashboard", () => {
    expect(shouldNoIndex("/dashboard")).toBe(true);
  });

  it("should return true for /login", () => {
    expect(shouldNoIndex("/login")).toBe(true);
  });

  it("should return true for /signup", () => {
    expect(shouldNoIndex("/signup")).toBe(true);
  });

  it("should return true for /vendor/ prefix routes", () => {
    expect(shouldNoIndex("/vendor/123")).toBe(true);
  });

  it("should return true for /billing", () => {
    expect(shouldNoIndex("/billing")).toBe(true);
  });

  it("should return true for /remediation-planner", () => {
    expect(shouldNoIndex("/remediation-planner")).toBe(true);
  });

  it("should return false for public pages", () => {
    expect(shouldNoIndex("/")).toBe(false);
    expect(shouldNoIndex("/about")).toBe(false);
    expect(shouldNoIndex("/pricing")).toBe(false);
    expect(shouldNoIndex("/privacy")).toBe(false);
    expect(shouldNoIndex("/terms")).toBe(false);
    expect(shouldNoIndex("/contact")).toBe(false);
  });

  it("should handle query strings on private paths", () => {
    expect(shouldNoIndex("/dashboard?tab=overview")).toBe(true);
  });

  it("should handle case-insensitively", () => {
    expect(shouldNoIndex("/DASHBOARD")).toBe(true);
  });

  it("should not match partial prefixes incorrectly", () => {
    const prefixes = shouldNoIndex("/api-test");
    expect(prefixes).toBe(false);
  });
});

// ── shouldDisableCaching ──────────────────────────────────────────────────

describe("shouldDisableCaching", () => {
  it("should disable caching for /api/ routes", () => {
    expect(shouldDisableCaching("/api/users")).toBe(true);
  });

  it("should disable caching for no-index pages", () => {
    expect(shouldDisableCaching("/dashboard")).toBe(true);
    expect(shouldDisableCaching("/login")).toBe(true);
  });

  it("should not disable caching for public pages", () => {
    expect(shouldDisableCaching("/")).toBe(false);
    expect(shouldDisableCaching("/pricing")).toBe(false);
    expect(shouldDisableCaching("/privacy")).toBe(false);
  });

  it("should disable caching for /api/ sub-paths", () => {
    expect(shouldDisableCaching("/api/health")).toBe(true);
    expect(shouldDisableCaching("/api/v1/users")).toBe(true);
  });

  it("should handle query strings on API routes", () => {
    expect(shouldDisableCaching("/api/data?page=1")).toBe(true);
  });
});

// ── buildCsp ──────────────────────────────────────────────────────────────

describe("buildCsp", () => {
  it("should include base directives in both modes", () => {
    const dev = buildCsp(false);
    const prod = buildCsp(true);
    expect(dev).toContain("default-src 'self'");
    expect(prod).toContain("default-src 'self'");
    expect(dev).toContain("base-uri 'self'");
    expect(prod).toContain("frame-ancestors 'none'");
  });

  it("should include upgrade-insecure-requests only in production", () => {
    const prod = buildCsp(true);
    const dev = buildCsp(false);
    expect(prod).toContain("upgrade-insecure-requests");
    expect(dev).not.toContain("upgrade-insecure-requests");
  });

  it("should include strict-dynamic only in production", () => {
    const prod = buildCsp(true);
    const dev = buildCsp(false);
    const prodScript = prod.find(p => p.startsWith("script-src"));
    const devScript = dev.find(p => p.startsWith("script-src"));
    expect(prodScript).toContain("'strict-dynamic'");
    expect(devScript).not.toContain("'strict-dynamic'");
  });

  it("should include unsafe-inline script in development", () => {
    const dev = buildCsp(false);
    const devScript = dev.find(p => p.startsWith("script-src"));
    expect(devScript).toContain("'unsafe-inline'");
  });

  it("should include report-uri directive", () => {
    const parts = buildCsp(false);
    expect(parts).toContain("report-uri /api/csp-report");
  });

  it("should have exactly 12 directives in development", () => {
    expect(buildCsp(false)).toHaveLength(12);
  });

  it("should have exactly 13 directives in production", () => {
    expect(buildCsp(true)).toHaveLength(13);
  });

  it("should include connect-src with sentry and supabase", () => {
    const parts = buildCsp(false);
    const connectSrc = parts.find(p => p.startsWith("connect-src"));
    expect(connectSrc).toContain("https://sentry.io");
    expect(connectSrc).toContain("https://*.supabase.co");
    expect(connectSrc).toContain("wss:");
  });

  it("should include frame-src for Stripe", () => {
    const parts = buildCsp(false);
    const frameSrc = parts.find(p => p.startsWith("frame-src"));
    expect(frameSrc).toContain("https://js.stripe.com");
    expect(frameSrc).toContain("https://hooks.stripe.com");
  });
});

// ── getSecurityHeadersForRequest ──────────────────────────────────────────

describe("getSecurityHeadersForRequest", () => {
  it("should include base security headers for any request", () => {
    const headers = getSecurityHeadersForRequest({
      pathname: "/pricing",
      isHttps: false,
      isProduction: false,
    });
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(headers["X-Frame-Options"]).toBe("DENY");
    expect(headers["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["Cross-Origin-Opener-Policy"]).toBe("same-origin");
    expect(headers["Origin-Agent-Cluster"]).toBe("?1");
  });

  it("should include CSP headers", () => {
    const headers = getSecurityHeadersForRequest({
      pathname: "/pricing",
      isHttps: false,
      isProduction: false,
    });
    expect(headers["Content-Security-Policy"]).toBeDefined();
    expect(headers["Content-Security-Policy-Report-Only"]).toBeDefined();
  });

  it("should include HSTS on HTTPS requests", () => {
    const headers = getSecurityHeadersForRequest({
      pathname: "/",
      isHttps: true,
      isProduction: false,
    });
    expect(headers["Strict-Transport-Security"]).toBe(
      "max-age=63072000; includeSubDomains; preload"
    );
  });

  it("should not include HSTS on HTTP requests", () => {
    const headers = getSecurityHeadersForRequest({
      pathname: "/",
      isHttps: false,
      isProduction: false,
    });
    expect(headers["Strict-Transport-Security"]).toBeUndefined();
  });

  it("should include X-Robots-Tag for no-index paths", () => {
    const headers = getSecurityHeadersForRequest({
      pathname: "/dashboard",
      isHttps: false,
      isProduction: false,
    });
    expect(headers["X-Robots-Tag"]).toBe(
      "noindex, nofollow, noarchive, nosnippet"
    );
  });

  it("should not include X-Robots-Tag for public paths", () => {
    const headers = getSecurityHeadersForRequest({
      pathname: "/pricing",
      isHttps: false,
      isProduction: false,
    });
    expect(headers["X-Robots-Tag"]).toBeUndefined();
  });

  it("should include cache-control headers for API paths", () => {
    const headers = getSecurityHeadersForRequest({
      pathname: "/api/users",
      isHttps: false,
      isProduction: false,
    });
    expect(headers["Cache-Control"]).toBe(
      "no-store, no-cache, must-revalidate, private"
    );
    expect(headers.Pragma).toBe("no-cache");
    expect(headers.Expires).toBe("0");
  });

  it("should not include cache-control headers for public pages", () => {
    const headers = getSecurityHeadersForRequest({
      pathname: "/pricing",
      isHttps: false,
      isProduction: false,
    });
    expect(headers["Cache-Control"]).toBeUndefined();
    expect(headers.Pragma).toBeUndefined();
    expect(headers.Expires).toBeUndefined();
  });

  it("should produce production CSP when isProduction is true", () => {
    const headers = getSecurityHeadersForRequest({
      pathname: "/",
      isHttps: true,
      isProduction: true,
    });
    expect(headers["Content-Security-Policy"]).toContain(
      "upgrade-insecure-requests"
    );
    expect(headers["Content-Security-Policy"]).toContain("'strict-dynamic'");
  });

  it("should produce development CSP when isProduction is false", () => {
    const headers = getSecurityHeadersForRequest({
      pathname: "/",
      isHttps: false,
      isProduction: false,
    });
    expect(headers["Content-Security-Policy"]).not.toContain(
      "upgrade-insecure-requests"
    );
  });

  it("should include Report-Only CSP with ro=1 parameter", () => {
    const headers = getSecurityHeadersForRequest({
      pathname: "/",
      isHttps: false,
      isProduction: false,
    });
    expect(headers["Content-Security-Policy-Report-Only"]).toContain(
      "report-uri /api/csp-report?ro=1"
    );
  });

  it("should handle root path", () => {
    const headers = getSecurityHeadersForRequest({
      pathname: "/",
      isHttps: false,
      isProduction: false,
    });
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
  });
});

// ── getClientIp ───────────────────────────────────────────────────────────

describe("getClientIp", () => {
  it("should prefer cf-connecting-ip", () => {
    const ip = getClientIp({
      headers: {
        "cf-connecting-ip": "1.2.3.4",
        "x-real-ip": "5.6.7.8",
        "x-forwarded-for": "9.10.11.12",
      },
    });
    expect(ip).toBe("1.2.3.4");
  });

  it("should fall back to x-real-ip", () => {
    const ip = getClientIp({
      headers: {
        "x-real-ip": "5.6.7.8",
        "x-forwarded-for": "9.10.11.12",
      },
    });
    expect(ip).toBe("5.6.7.8");
  });

  it("should fall back to x-forwarded-for", () => {
    const ip = getClientIp({
      headers: {
        "x-forwarded-for": "9.10.11.12",
      },
    });
    expect(ip).toBe("9.10.11.12");
  });

  it("should take first IP from comma-separated x-forwarded-for", () => {
    const ip = getClientIp({
      headers: {
        "x-forwarded-for": "1.2.3.4, 5.6.7.8",
      },
    });
    expect(ip).toBe("1.2.3.4");
  });

  it("should take first element from array x-forwarded-for", () => {
    const ip = getClientIp({
      headers: {
        "x-forwarded-for": ["1.2.3.4", "5.6.7.8"],
      },
    });
    expect(ip).toBe("1.2.3.4");
  });

  it("should fall back to req.ip", () => {
    const ip = getClientIp({
      headers: {},
      ip: "192.168.1.1",
    });
    expect(ip).toBe("192.168.1.1");
  });

  it("should fall back to socket.remoteAddress", () => {
    const ip = getClientIp({
      headers: {},
      socket: { remoteAddress: "10.0.0.1" },
    });
    expect(ip).toBe("10.0.0.1");
  });

  it("should return unknown when no IP is found", () => {
    const ip = getClientIp({
      headers: {},
    });
    expect(ip).toBe("unknown");
  });

  it("should handle empty cf-connecting-ip", () => {
    const ip = getClientIp({
      headers: {
        "cf-connecting-ip": "",
        "x-real-ip": "5.6.7.8",
      },
    });
    expect(ip).toBe("5.6.7.8");
  });

  it("should handle whitespace-only cf-connecting-ip", () => {
    const ip = getClientIp({
      headers: {
        "cf-connecting-ip": "   ",
        "x-real-ip": "5.6.7.8",
      },
    });
    expect(ip).toBe("5.6.7.8");
  });

  it("should handle array cf-connecting-ip as non-matching", () => {
    const ip = getClientIp({
      headers: {
        "cf-connecting-ip": ["1.2.3.4"],
        "x-real-ip": "5.6.7.8",
      },
    });
    expect(ip).toBe("5.6.7.8");
  });
});

// ── parseCspReport (additional edge cases) ────────────────────────────────

describe("parseCspReport edge cases", () => {
  it("should return empty object for string body", () => {
    expect(parseCspReport("not-an-object")).toEqual({});
  });

  it("should return empty object for array body", () => {
    expect(parseCspReport(["a", "b"])).toEqual({});
  });

  it("should return empty object when csp-report is not an object", () => {
    expect(parseCspReport({ "csp-report": "string" })).toEqual({});
  });

  it("should return empty object when csp-report is null", () => {
    expect(parseCspReport({ "csp-report": null })).toEqual({});
  });

  it("should extract deeply nested properties", () => {
    const report = parseCspReport({
      "csp-report": {
        "document-uri": "https://example.com/",
        "blocked-uri": "https://evil.com/",
        "violated-directive": "script-src-elem",
        "effective-directive": "script-src-elem",
        "original-policy": "default-src 'self'",
        disposition: "report",
      },
    });
    expect(report["document-uri"]).toBe("https://example.com/");
    expect(report["violated-directive"]).toBe("script-src-elem");
    expect(report.disposition).toBe("report");
  });
});
