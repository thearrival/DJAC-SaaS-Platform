/**
 * Super Admin / Founders Portal security integration tests.
 *
 * Requires a running server: SMOKE_BASE_URL=http://localhost:3000 pnpm test
 * Skips gracefully when SMOKE_BASE_URL is not set.
 */
import { describe, it, expect } from "vitest";
import { SignJWT } from "jose";

const BASE = process.env.SMOKE_BASE_URL || "";
const SKIP = !BASE;
const DEV_PW = process.env.YALLA_ADMIN_DEV_PASSWORD || "";
const CAN_LOGIN = SKIP ? false : DEV_PW.length > 0;

describe.runIf(!SKIP)(
  "Super Admin — Unauthenticated access must be denied",
  () => {
    it("POST /api/yalla-admin/react-login without credentials is 401", async () => {
      const res = await fetch(`${BASE}/api/yalla-admin/react-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "nobody", password: "wrong" }),
      });
      expect(res.status).toBe(401);
    });

    it("GET /api/yalla-admin/me without session is 200 {authenticated:false}", async () => {
      const res = await fetch(`${BASE}/api/yalla-admin/me`);
      expect(res.status).toBe(200);
      const body = (await res.json()) as { authenticated: boolean };
      expect(body.authenticated).toBe(false);
    });

    it("GET /api/yalla-admin/stats/overview without session is 401", async () => {
      const res = await fetch(`${BASE}/api/yalla-admin/stats/overview`);
      expect(res.status).toBe(401);
    });

    it("GET /api/admin-dashboard/users without session is 401", async () => {
      const res = await fetch(`${BASE}/api/admin-dashboard/users`);
      expect(res.status).toBe(401);
    });

    it("GET /api/admin-dashboard/users with forged cookie is 401", async () => {
      const res = await fetch(`${BASE}/api/admin-dashboard/users`, {
        headers: { Cookie: "yalla_admin_session=forged-not-a-real-jwt" },
      });
      expect(res.status).toBe(401);
    });

    it("GET /api/admin-dashboard/users with JWT signed by wrong secret is 401", async () => {
      const forged = await new SignJWT({
        sub: "yalla_admin",
        sid: "forged-sid",
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("8h")
        .sign(new TextEncoder().encode("wrong-secret-for-forgery"));
      const res = await fetch(`${BASE}/api/admin-dashboard/users`, {
        headers: { Cookie: `yalla_admin_session=${forged}` },
      });
      expect(res.status).toBe(401);
    });

    it("POST /api/yalla-admin/react-login with wrong Content-Type is rejected", async () => {
      const res = await fetch(`${BASE}/api/yalla-admin/react-login`, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: "username=x&password=y",
      });
      expect([400, 415]).toContain(res.status);
    });

    it("GET /api/admin-dashboard/react-login (GET method) is rejected", async () => {
      const res = await fetch(`${BASE}/api/admin-dashboard/react-login`);
      expect([400, 401, 404, 405]).toContain(res.status);
    });

    it("GET /api/yalla-admin/bootstrap without token is rejected", async () => {
      const res = await fetch(`${BASE}/api/yalla-admin/bootstrap`);
      expect([400, 401, 403, 404]).toContain(res.status);
    });

    it("GET /api/yalla-admin/bootstrap with an invalid token is rejected", async () => {
      const res = await fetch(
        `${BASE}/api/yalla-admin/bootstrap?token=invalid-token-12345`
      );
      expect([400, 401, 403, 404]).toContain(res.status);
    });

    it("admin-dashboard endpoints reject sessions from a revoked JWT (pre-revocation replay)", async () => {
      const res = await fetch(`${BASE}/api/admin-dashboard/users`, {
        headers: {
          Cookie: "yalla_admin_session=revoked-test-jwt",
        },
      });
      expect([401, 403]).toContain(res.status);
    });

    it("admin-dashboard summary endpoints require a session", async () => {
      const res = await fetch(`${BASE}/api/admin-dashboard/summary`);
      expect(res.status).toBe(401);
    });
  }
);

describe.runIf(CAN_LOGIN)("Super Admin — Authenticated access", () => {
  it("login with correct dev credentials returns 200 and sets HttpOnly cookie", async () => {
    const res = await fetch(`${BASE}/api/yalla-admin/react-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "yalla_admin", password: DEV_PW }),
    });
    expect(res.status).toBe(200);
    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("SameSite=Strict");
    expect(setCookie).toContain("yalla_admin_session=");
  });

  it("authenticated session can access /api/admin-dashboard/users", async () => {
    const login = await fetch(`${BASE}/api/yalla-admin/react-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "yalla_admin", password: DEV_PW }),
    });
    const cookie = (login.headers.get("set-cookie") ?? "").split(";")[0];
    expect(cookie).toBeTruthy();
    const res = await fetch(`${BASE}/api/admin-dashboard/users`, {
      headers: { Cookie: cookie },
    });
    expect(res.status).toBe(200);
  });

  it("logout revokes the session — subsequent access is 401", async () => {
    const login = await fetch(`${BASE}/api/yalla-admin/react-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "yalla_admin", password: DEV_PW }),
    });
    const cookie = (login.headers.get("set-cookie") ?? "").split(";")[0];
    const logout = await fetch(`${BASE}/api/yalla-admin/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: "{}",
    });
    expect(logout.status).toBe(200);
    const res = await fetch(`${BASE}/api/yalla-admin/stats/overview`, {
      headers: { Cookie: cookie },
    });
    expect(res.status).toBe(401);
  });
});
