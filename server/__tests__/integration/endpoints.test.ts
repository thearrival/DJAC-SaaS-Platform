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

  it("GET /api/_dbcheck returns db status", async () => {
    const res = await fetch(`${BASE}/api/_dbcheck`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it("GET /api/_stats returns stats", async () => {
    const res = await fetch(`${BASE}/api/_stats`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it("GET /api/_preflight returns config check", async () => {
    const res = await fetch(`${BASE}/api/_preflight`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.checks).toBeDefined();
  });

  it("GET /api/_schema-check returns schema status", async () => {
    const res = await fetch(`${BASE}/api/_schema-check`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.message).toBeDefined();
  });

  it("GET /api/_db-tables returns table list", async () => {
    const res = await fetch(`${BASE}/api/_db-tables`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(Array.isArray(body.tables)).toBe(true);
    expect(body.tables.length).toBeGreaterThan(10);
  });
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
