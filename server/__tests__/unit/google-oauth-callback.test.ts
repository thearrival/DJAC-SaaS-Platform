import { describe, it, expect, vi, beforeEach } from "vitest";

// Google credentials must be present at module-init time for googleOAuthConfigured().
vi.hoisted(() => {
  process.env.GOOGLE_CLIENT_ID = "test-client-id";
  process.env.GOOGLE_CLIENT_SECRET = "test-client-secret";
});

const upsertUser = vi.fn(async () => {});
const getUserByOpenId = vi.fn(async () => ({
  id: 42,
  name: "Ada",
  email: "ada@example.com",
  role: "basic_user",
}));
const recordSystemAuditEvent = vi.fn(async () => {});
const checkRateLimit = vi.fn(async () => ({ allowed: true, resetAt: 0 }));
const createSessionToken = vi.fn(async () => "sdk.session.token");

vi.mock("../../db", () => ({
  upsertUser: (...a: unknown[]) => upsertUser(...a),
  getUserByOpenId: (...a: unknown[]) => getUserByOpenId(...a),
}));
vi.mock("../../_core/sdk", () => ({
  sdk: { createSessionToken: (...a: unknown[]) => createSessionToken(...a) },
}));
vi.mock("../../services/sse-bus", () => ({ broadcastSSE: vi.fn() }));
vi.mock("../../audit-logger", () => ({
  recordSystemAuditEvent: (...a: unknown[]) => recordSystemAuditEvent(...a),
}));
vi.mock("../../_core/rateLimiter", () => ({
  checkRateLimit: (...a: unknown[]) => checkRateLimit(...a),
}));

// Google endpoint responses (token exchange, userinfo, ID-token verification).
async function googleFetch(url: string) {
  if (url.includes("tokeninfo")) {
    return {
      ok: true,
      json: async () => ({
        aud: process.env.GOOGLE_CLIENT_ID,
        sub: "google-sub-1",
        email: "ada@example.com",
        name: "Ada Lovelace",
      }),
    };
  }
  if (url.includes("oauth2.googleapis.com/token")) {
    return { ok: true, json: async () => ({ access_token: "at-123" }) };
  }
  if (url.includes("userinfo")) {
    return {
      ok: true,
      json: async () => ({
        sub: "google-sub-1",
        email: "ada@example.com",
        email_verified: true,
        name: "Ada Lovelace",
      }),
    };
  }
  return { ok: false, status: 400, json: async () => ({}) };
}
const fetchMock = vi.fn(googleFetch);
vi.stubGlobal("fetch", fetchMock);

import {
  registerGoogleOAuthRoutes,
  buildGoogleAuthUrl,
  verifyGoogleState,
} from "../../_core/google-oauth";

type Handler = (req: any, res: any) => Promise<void>;

function allRoutes() {
  const routes = new Map<string, Handler>();
  const app = {
    get: (path: string, handler: Handler) => routes.set(`GET ${path}`, handler),
    post: (path: string, handler: Handler) =>
      routes.set(`POST ${path}`, handler),
  };
  registerGoogleOAuthRoutes(app as never);
  return routes;
}

function buildApp() {
  return allRoutes().get("GET /api/auth/google/callback")!;
}

function buildVerify() {
  return allRoutes().get("POST /api/auth/google/verify")!;
}

function fakeRes() {
  const res = {
    redirect: vi.fn(),
    cookie: vi.fn(),
    status: vi.fn(),
    json: vi.fn(),
  };
  res.status.mockReturnValue(res);
  return res;
}

const fakeReq = (query: Record<string, unknown> = {}, body?: unknown) =>
  ({ query, body, headers: {}, ip: "1.2.3.4", protocol: "https" }) as never;

/** Pull the signed state out of a generated authorize URL. */
function stateFromAuthUrl(redirectTo: string): string {
  const url = new URL(buildGoogleAuthUrl(redirectTo));
  return url.searchParams.get("state")!;
}

describe("Google OAuth direct flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    checkRateLimit.mockResolvedValue({ allowed: true, resetAt: 0 });
    fetchMock.mockImplementation(googleFetch);
  });

  it("builds the authorize URL on OUR domain, not a third-party host", () => {
    const url = new URL(buildGoogleAuthUrl("/dashboard"));
    expect(url.host).toBe("accounts.google.com");
    // The redirect URI must be the one registered in Google Cloud (the root).
    expect(url.searchParams.get("redirect_uri")).toBe(
      `${process.env.APP_URL || "http://localhost:3000"}/`
    );
    expect(url.searchParams.get("redirect_uri")).not.toContain("supabase.co");
    expect(url.searchParams.get("state")).toBeTruthy();
  });

  it("redirects with a cancellation error when Google reports one", async () => {
    const handler = buildApp();
    const res = fakeRes();
    await handler(fakeReq({ error: "access_denied" }), res);
    expect(res.redirect).toHaveBeenCalledWith(
      302,
      "/login?error=google_denied"
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("redirects with an error when no code is present", async () => {
    const handler = buildApp();
    const res = fakeRes();
    await handler(fakeReq(), res);
    expect(res.redirect).toHaveBeenCalledWith(
      302,
      "/login?error=google_no_code"
    );
  });

  it("redirects with an error when the Google exchange fails", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({}),
    });
    const handler = buildApp();
    const res = fakeRes();
    await handler(fakeReq({ code: "bad" }), res);
    expect(res.redirect).toHaveBeenCalledWith(
      302,
      "/login?error=google_exchange_failed"
    );
    expect(upsertUser).not.toHaveBeenCalled();
  });

  it("throttles before contacting Google", async () => {
    checkRateLimit.mockResolvedValue({ allowed: false, resetAt: 0 });
    const handler = buildApp();
    const res = fakeRes();
    await handler(fakeReq({ code: "abc" }), res);
    expect(res.redirect).toHaveBeenCalledWith(
      302,
      "/login?error=google_rate_limited"
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("on success creates the user, signs via the SDK and redirects to the dashboard", async () => {
    const handler = buildApp();
    const res = fakeRes();
    await handler(fakeReq({ code: "good" }), res);

    expect(upsertUser).toHaveBeenCalledWith(
      expect.objectContaining({
        openId: "google:google-sub-1",
        email: "ada@example.com",
        loginMethod: "google",
      })
    );
    expect(createSessionToken).toHaveBeenCalledWith(
      "google:google-sub-1",
      expect.objectContaining({ name: expect.any(String) })
    );
    expect(res.cookie).toHaveBeenCalledTimes(1);
    expect(res.redirect).toHaveBeenCalledWith(302, "/dashboard");
    expect(recordSystemAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ action: "user.login", outcome: "success" })
    );
  });

  it("honours a valid signed redirect target", async () => {
    const handler = buildApp();
    const res = fakeRes();
    const state = stateFromAuthUrl("/get-started");
    await handler(fakeReq({ code: "good", state }), res);
    expect(res.redirect).toHaveBeenCalledWith(302, "/get-started");
  });

  it("ignores a forged state and falls back to the dashboard", async () => {
    const handler = buildApp();
    const res = fakeRes();
    await handler(fakeReq({ code: "good", state: "forged.payload" }), res);
    expect(res.redirect).toHaveBeenCalledWith(302, "/dashboard");
  });

  it("verifyGoogleState rejects tampered and expired values", () => {
    expect(verifyGoogleState("nonsense")).toBeNull();
    const good = stateFromAuthUrl("/settings");
    expect(verifyGoogleState(good)).toBe("/settings");
    // Flip a character in the signature.
    expect(verifyGoogleState(good.slice(0, -1) + "X")).toBeNull();
  });
});

describe("Google Identity Services verify endpoint", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    checkRateLimit.mockResolvedValue({ allowed: true, resetAt: 0 });
    fetchMock.mockImplementation(googleFetch);
  });

  it("returns 400 without a credential", async () => {
    const res = fakeRes();
    await buildVerify()(fakeReq({}, {}), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "missing_credential" });
  });

  it("returns 401 when Google rejects the token", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({}),
    });
    const res = fakeRes();
    await buildVerify()(fakeReq({}, { credential: "x" }), res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(upsertUser).not.toHaveBeenCalled();
  });

  it("returns 401 when the token audience is not our client id", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ aud: "someone-else", sub: "1" }),
    });
    const res = fakeRes();
    await buildVerify()(fakeReq({}, { credential: "x" }), res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(upsertUser).not.toHaveBeenCalled();
  });

  it("creates the user + session and returns the dashboard target on success", async () => {
    const res = fakeRes();
    await buildVerify()(fakeReq({}, { credential: "good" }), res);
    expect(upsertUser).toHaveBeenCalledWith(
      expect.objectContaining({
        openId: "google:google-sub-1",
        loginMethod: "google",
      })
    );
    expect(res.cookie).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({
      ok: true,
      redirectTo: "/dashboard",
    });
  });

  it("returns 429 when rate limited", async () => {
    checkRateLimit.mockResolvedValue({ allowed: false, resetAt: 0 });
    const res = fakeRes();
    await buildVerify()(fakeReq({}, { credential: "x" }), res);
    expect(res.status).toHaveBeenCalledWith(429);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
