import { describe, it, expect } from "vitest";

describe("parseCspReport", () => {
  const parseCspReport = (body: unknown): Record<string, unknown> => {
    if (!body || typeof body !== "object") return {};
    const report = (body as Record<string, unknown>)["csp-report"];
    if (!report || typeof report !== "object") return {};
    return report as Record<string, unknown>;
  };

  it("should extract csp-report from valid payload", () => {
    const input = {
      "csp-report": {
        "document-uri": "https://example.com/login",
        "blocked-uri": "https://evil.com/script.js",
        "violated-directive": "script-src",
      },
    };
    const report = parseCspReport(input);
    expect(report["document-uri"]).toBe("https://example.com/login");
    expect(report["blocked-uri"]).toBe("https://evil.com/script.js");
    expect(report["violated-directive"]).toBe("script-src");
  });

  it("should return empty object for null body", () => {
    expect(parseCspReport(null)).toEqual({});
  });

  it("should return empty object for undefined body", () => {
    expect(parseCspReport(undefined)).toEqual({});
  });

  it("should return empty object for non-object body", () => {
    expect(parseCspReport("string")).toEqual({});
    expect(parseCspReport(42)).toEqual({});
    expect(parseCspReport(true)).toEqual({});
  });

  it("should return empty object when csp-report field is missing", () => {
    expect(parseCspReport({ something: "else" })).toEqual({});
  });

  it("should return empty object when csp-report is not an object", () => {
    expect(parseCspReport({ "csp-report": "not-object" })).toEqual({});
    expect(parseCspReport({ "csp-report": 123 })).toEqual({});
  });

  it("should handle empty csp-report object", () => {
    expect(parseCspReport({ "csp-report": {} })).toEqual({});
  });

  it("should handle nested fields inside csp-report", () => {
    const input = {
      "csp-report": {
        "effective-directive": "style-src-elem",
        "original-policy": "default-src 'self'",
        disposition: "enforce",
        "script-sample": "console.log('test')",
        "status-code": 200,
      },
    };
    const report = parseCspReport(input);
    expect(report["effective-directive"]).toBe("style-src-elem");
    expect(report["disposition"]).toBe("enforce");
    expect(report["script-sample"]).toBe("console.log('test')");
  });
});

describe("getClientIp", () => {
  interface MockRequest {
    headers: Record<string, string | string[] | undefined>;
    ip?: string;
    socket: { remoteAddress?: string };
  }

  const getClientIp = (req: MockRequest): string => {
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
    return req.ip || req.socket.remoteAddress || "unknown";
  };

  it("should prefer cf-connecting-ip header", () => {
    const req: MockRequest = {
      headers: {
        "cf-connecting-ip": "203.0.113.50",
        "x-real-ip": "198.51.100.10",
        "x-forwarded-for": "192.0.2.1",
      },
      socket: {},
    };
    expect(getClientIp(req)).toBe("203.0.113.50");
  });

  it("should fall back to x-real-ip when cf-connecting-ip is missing", () => {
    const req: MockRequest = {
      headers: {
        "x-real-ip": "198.51.100.10",
        "x-forwarded-for": "192.0.2.1",
      },
      socket: {},
    };
    expect(getClientIp(req)).toBe("198.51.100.10");
  });

  it("should fall back to x-forwarded-for first value", () => {
    const req: MockRequest = {
      headers: {
        "x-forwarded-for": "192.0.2.1, 198.51.100.10, 203.0.113.50",
      },
      socket: {},
    };
    expect(getClientIp(req)).toBe("192.0.2.1");
  });

  it("should use req.ip when no proxy headers exist", () => {
    const req: MockRequest = {
      headers: {},
      ip: "10.0.0.1",
      socket: {},
    };
    expect(getClientIp(req)).toBe("10.0.0.1");
  });

  it("should use socket.remoteAddress as last resort", () => {
    const req: MockRequest = {
      headers: {},
      socket: { remoteAddress: "127.0.0.1" },
    };
    expect(getClientIp(req)).toBe("127.0.0.1");
  });

  it("should return 'unknown' when no IP can be determined", () => {
    const req: MockRequest = {
      headers: {},
      socket: {},
    };
    expect(getClientIp(req)).toBe("unknown");
  });

  it("should handle array x-forwarded-for headers", () => {
    const req: MockRequest = {
      headers: {
        "x-forwarded-for": ["192.0.2.1", "198.51.100.10"],
      },
      socket: {},
    };
    expect(getClientIp(req)).toBe("192.0.2.1");
  });

  it("should handle empty proxy header values", () => {
    const req: MockRequest = {
      headers: {
        "cf-connecting-ip": "",
        "x-real-ip": "  ",
      },
      ip: "10.0.0.5",
      socket: {},
    };
    expect(getClientIp(req)).toBe("10.0.0.5");
  });
});

describe("shouldBypassApiRateLimit", () => {
  const shouldBypassApiRateLimit = (pathname: string): boolean => {
    const [withoutQuery] = pathname.split(/[?#]/, 1);
    const normalized = withoutQuery.trim().toLowerCase();
    const p = normalized || "/";
    return (
      p === "/api/health" ||
      p === "/api/healthz" ||
      p === "/api/readiness" ||
      p === "/api/readyz" ||
      p === "/health" ||
      p === "/healthz" ||
      p === "/readiness" ||
      p === "/readyz"
    );
  };

  it("should bypass /health", () => {
    expect(shouldBypassApiRateLimit("/health")).toBe(true);
  });

  it("should bypass /api/health", () => {
    expect(shouldBypassApiRateLimit("/api/health")).toBe(true);
  });

  it("should bypass /healthz", () => {
    expect(shouldBypassApiRateLimit("/healthz")).toBe(true);
  });

  it("should bypass /readiness", () => {
    expect(shouldBypassApiRateLimit("/readiness")).toBe(true);
  });

  it("should bypass /readyz", () => {
    expect(shouldBypassApiRateLimit("/readyz")).toBe(true);
  });

  it("should not bypass API routes", () => {
    expect(shouldBypassApiRateLimit("/api/login")).toBe(false);
    expect(shouldBypassApiRateLimit("/api/trpc")).toBe(false);
    expect(shouldBypassApiRateLimit("/api/users")).toBe(false);
  });

  it("should not bypass regular pages", () => {
    expect(shouldBypassApiRateLimit("/dashboard")).toBe(false);
    expect(shouldBypassApiRateLimit("/login")).toBe(false);
    expect(shouldBypassApiRateLimit("/")).toBe(false);
  });

  it("should handle query parameters gracefully", () => {
    expect(shouldBypassApiRateLimit("/health?token=abc")).toBe(true);
    expect(shouldBypassApiRateLimit("/api/health?foo=1&bar=2")).toBe(true);
  });
});

describe("getSecurityHeadersForRequest", () => {
  const buildCsp = (isProduction: boolean): string[] => {
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
      parts.push(
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com"
      );
      parts.push("upgrade-insecure-requests");
    } else {
      parts.push("script-src 'self' 'unsafe-inline' https://js.stripe.com");
      parts.push(
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com"
      );
    }
    return parts;
  };

  const getSecurityHeadersForRequest = ({
    pathname,
    isHttps,
  }: {
    pathname: string;
    isHttps: boolean;
  }): Record<string, string> => {
    const [withoutQuery] = pathname.split(/[?#]/, 1);
    const normalized = withoutQuery.trim().toLowerCase() || "/";
    const isProduction = false;
    const cspParts = buildCsp(isProduction);
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
    const noIndexPaths = ["/api/", "/dashboard", "/login"];
    if (
      noIndexPaths.some(
        prefix => normalized === prefix || normalized.startsWith(prefix)
      )
    ) {
      headers["X-Robots-Tag"] = "noindex, nofollow, noarchive, nosnippet";
    }
    const cachePaths = ["/api/", "/dashboard", "/login"];
    if (cachePaths.some(prefix => normalized.startsWith(prefix))) {
      headers["Cache-Control"] = "no-store, no-cache, must-revalidate, private";
      headers.Pragma = "no-cache";
      headers.Expires = "0";
    }
    if (isHttps) {
      headers["Strict-Transport-Security"] =
        "max-age=63072000; includeSubDomains; preload";
    }
    return headers;
  };

  it("should include X-Content-Type-Options: nosniff", () => {
    const headers = getSecurityHeadersForRequest({
      pathname: "/",
      isHttps: false,
    });
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
  });

  it("should include X-Frame-Options: DENY", () => {
    const headers = getSecurityHeadersForRequest({
      pathname: "/",
      isHttps: false,
    });
    expect(headers["X-Frame-Options"]).toBe("DENY");
  });

  it("should include Referrer-Policy", () => {
    const headers = getSecurityHeadersForRequest({
      pathname: "/",
      isHttps: false,
    });
    expect(headers["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
  });

  it("should include Permissions-Policy with camera, microphone, geolocation restrictions", () => {
    const headers = getSecurityHeadersForRequest({
      pathname: "/",
      isHttps: false,
    });
    expect(headers["Permissions-Policy"]).toContain("camera=()");
    expect(headers["Permissions-Policy"]).toContain("microphone=()");
    expect(headers["Permissions-Policy"]).toContain("geolocation=()");
    expect(headers["Permissions-Policy"]).toContain("usb=()");
    expect(headers["Permissions-Policy"]).toContain("midi=()");
    expect(headers["Permissions-Policy"]).toContain("sync-xhr=()");
    expect(headers["Permissions-Policy"]).toContain("serial=()");
    expect(headers["Permissions-Policy"]).toContain("fullscreen=(self)");
  });

  it("should include Content-Security-Policy header", () => {
    const headers = getSecurityHeadersForRequest({
      pathname: "/",
      isHttps: false,
    });
    expect(headers["Content-Security-Policy"]).toContain("default-src 'self'");
    expect(headers["Content-Security-Policy"]).toContain(
      "frame-ancestors 'none'"
    );
  });

  it("should include Content-Security-Policy-Report-Only header", () => {
    const headers = getSecurityHeadersForRequest({
      pathname: "/",
      isHttps: false,
    });
    expect(headers["Content-Security-Policy-Report-Only"]).toContain(
      "report-uri /api/csp-report?ro=1"
    );
  });

  it("should include X-Robots-Tag for API routes", () => {
    const headers = getSecurityHeadersForRequest({
      pathname: "/api/trpc",
      isHttps: false,
    });
    expect(headers["X-Robots-Tag"]).toBe(
      "noindex, nofollow, noarchive, nosnippet"
    );
  });

  it("should not include X-Robots-Tag for public routes", () => {
    const headers = getSecurityHeadersForRequest({
      pathname: "/",
      isHttps: false,
    });
    expect(headers["X-Robots-Tag"]).toBeUndefined();
  });

  it("should include Cache-Control for API routes", () => {
    const headers = getSecurityHeadersForRequest({
      pathname: "/api/health",
      isHttps: false,
    });
    expect(headers["Cache-Control"]).toContain("no-store");
  });

  it("should include Strict-Transport-Security when HTTPS", () => {
    const headers = getSecurityHeadersForRequest({
      pathname: "/",
      isHttps: true,
    });
    expect(headers["Strict-Transport-Security"]).toContain("max-age=63072000");
  });

  it("should not include Strict-Transport-Security when not HTTPS", () => {
    const headers = getSecurityHeadersForRequest({
      pathname: "/",
      isHttps: false,
    });
    expect(headers["Strict-Transport-Security"]).toBeUndefined();
  });

  it("should include CSP upgrade-insecure-requests in production", () => {
    const cspParts = buildCsp(true);
    expect(cspParts.join("; ")).toContain("upgrade-insecure-requests");
  });

  it("should include CSP strict-dynamic in production", () => {
    const cspParts = buildCsp(true);
    expect(cspParts.join("; ")).toContain("strict-dynamic");
  });

  it("should have frame-ancestors 'none'", () => {
    const cspParts = buildCsp(false);
    expect(cspParts.join("; ")).toContain("frame-ancestors 'none'");
  });
});
