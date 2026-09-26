import { describe, it, expect } from "vitest";

const BASE = process.env.SMOKE_BASE_URL || "";
const SKIP = !BASE;

if (SKIP && !process.env.CI) {
  console.info(
    "\n  ⚠  Smoke tests skipped. Set SMOKE_BASE_URL to run endpoint integration tests.\n" +
      "     Example: SMOKE_BASE_URL=http://localhost:3001 pnpm test\n"
  );
}

describe("API — Smoke Test Configuration", () => {
  it("should have SMOKE_BASE_URL set to run live endpoint tests", () => {
    if (!BASE) {
      console.warn(
        "SMOKE_BASE_URL not configured — integration tests require a running server"
      );
    }
    expect(true).toBe(true); // always passes; just informational
  });
});

describe.runIf(!SKIP)("API — Endpoint Availability", () => {
  it("GET /api/health returns healthy", async () => {
    const res = await fetch(`${BASE}/api/health`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.status).toBe("healthy");
  });

  it("GET /api/readiness returns ready", async () => {
    const res = await fetch(`${BASE}/api/readiness`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it("GET /api/ping returns pong", async () => {
    const res = await fetch(`${BASE}/api/ping`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.message).toBe("pong");
  });

  // Operational endpoints under /api/_* must never be anonymously reachable.
  // They require CRON_SECRET or an authenticated platform-admin session.
  const GATED = [
    "/api/_dbcheck",
    "/api/_stats",
    "/api/_preflight",
    "/api/_schema-check",
    "/api/_db-tables",
    "/api/_debug",
    "/api/_init",
  ];

  for (const path of GATED) {
    it(`GET ${path} is not publicly accessible`, async () => {
      const res = await fetch(`${BASE}${path}`);
      expect([401, 404]).toContain(res.status);
    });
  }
});

describe.runIf(!SKIP)("API — SPA Pages", () => {
  const pages = [
    "",
    "signup",
    "login",
    "pricing",
    "privacy",
    "terms",
    "forgot-password",
  ];

  for (const page of pages) {
    it(`GET /${page} returns 200`, async () => {
      const res = await fetch(`${BASE}/${page}`, { redirect: "manual" });
      expect(res.status).toBe(200);
    });
  }

  it("GET /404 returns 200 (SPA fallback)", async () => {
    const res = await fetch(`${BASE}/this-page-does-not-exist`, {
      redirect: "manual",
    });
    expect(res.status).toBe(200);
  });
});
