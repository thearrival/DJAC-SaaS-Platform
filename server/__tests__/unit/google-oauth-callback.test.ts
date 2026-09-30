import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the callback's collaborators so the route can be exercised in isolation.
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
const exchangeCodeForSession = vi.fn(async () => ({
  data: {
    user: {
      id: "supa-1",
      email: "ada@example.com",
      user_metadata: { full_name: "Ada Lovelace" },
    },
  },
  error: null,
}));
let supabaseConfigured = true;

vi.mock("../../db", () => ({
  upsertUser: (...a: unknown[]) => upsertUser(...a),
  getUserByOpenId: (...a: unknown[]) => getUserByOpenId(...a),
}));
vi.mock("../../services/supabase", () => ({
  getSupabaseClient: () =>
    supabaseConfigured ? { auth: { exchangeCodeForSession } } : null,
}));
vi.mock("../../_core/sdk", () => ({
  sdk: {
    createSessionToken: (...a: unknown[]) => createSessionToken(...a),
  },
}));
vi.mock("../../services/sse-bus", () => ({ broadcastSSE: vi.fn() }));
vi.mock("../../audit-logger", () => ({
  recordSystemAuditEvent: (...a: unknown[]) => recordSystemAuditEvent(...a),
}));
vi.mock("../../_core/rateLimiter", () => ({
  checkRateLimit: (...a: unknown[]) => checkRateLimit(...a),
}));

import { registerGoogleOAuthRoutes } from "../../_core/google-oauth";

type Handler = (req: any, res: any) => Promise<void>;

function buildApp() {
  const routes = new Map<string, Handler>();
  const app = {
    get: (path: string, handler: Handler) => routes.set(path, handler),
  };
  registerGoogleOAuthRoutes(app as never);
  return routes.get("/api/auth/google/callback")!;
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

const fakeReq = (query: Record<string, unknown> = {}) =>
  ({
    query,
    headers: {},
    ip: "1.2.3.4",
    protocol: "https",
    get: () => "https",
  }) as never;

describe("Google OAuth callback route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    supabaseConfigured = true;
    checkRateLimit.mockResolvedValue({ allowed: true, resetAt: 0 });
    exchangeCodeForSession.mockResolvedValue({
      data: {
        user: {
          id: "supa-1",
          email: "ada@example.com",
          user_metadata: { full_name: "Ada Lovelace" },
        },
      },
      error: null,
    });
  });

  it("redirects with an error when no code is present", async () => {
    const handler = buildApp();
    const res = fakeRes();
    await handler(fakeReq(), res);
    expect(res.redirect).toHaveBeenCalledWith(
      302,
      "/login?error=google_no_code"
    );
    expect(exchangeCodeForSession).not.toHaveBeenCalled();
  });

  it("redirects with an error when Supabase is not configured", async () => {
    supabaseConfigured = false;
    const handler = buildApp();
    const res = fakeRes();
    await handler(fakeReq({ code: "abc" }), res);
    expect(res.redirect).toHaveBeenCalledWith(
      302,
      "/login?error=google_not_configured"
    );
  });

  it("redirects with an error when the code exchange fails", async () => {
    exchangeCodeForSession.mockResolvedValue({
      data: { user: null },
      error: { message: "bad code", status: 400 },
    } as never);
    const handler = buildApp();
    const res = fakeRes();
    await handler(fakeReq({ code: "bad" }), res);
    expect(res.redirect).toHaveBeenCalledWith(
      302,
      "/login?error=google_exchange_failed"
    );
    expect(upsertUser).not.toHaveBeenCalled();
  });

  it("throttles before contacting the provider", async () => {
    checkRateLimit.mockResolvedValue({ allowed: false, resetAt: 0 });
    const handler = buildApp();
    const res = fakeRes();
    await handler(fakeReq({ code: "abc" }), res);
    expect(res.redirect).toHaveBeenCalledWith(
      302,
      "/login?error=google_rate_limited"
    );
    expect(exchangeCodeForSession).not.toHaveBeenCalled();
  });

  it("on success creates the user, sets a session cookie and redirects into the app", async () => {
    const handler = buildApp();
    const res = fakeRes();
    await handler(fakeReq({ code: "good", redirectTo: "/dashboard" }), res);

    expect(upsertUser).toHaveBeenCalledTimes(1);
    expect(upsertUser.mock.calls[0][0]).toMatchObject({
      openId: "google:supa-1",
      email: "ada@example.com",
      loginMethod: "google",
    });
    expect(res.cookie).toHaveBeenCalledTimes(1);
    expect(res.redirect).toHaveBeenCalledWith(302, "/dashboard");
    // The session must be signed by the SDK so resolveOAuthUser can verify it.
    expect(createSessionToken).toHaveBeenCalledWith(
      "google:supa-1",
      expect.objectContaining({ name: expect.any(String) })
    );
    expect(recordSystemAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ action: "user.login", outcome: "success" })
    );
  });

  it("sanitises an off-site redirect target on success", async () => {
    const handler = buildApp();
    const res = fakeRes();
    await handler(
      fakeReq({ code: "good", redirectTo: "//evil.example.com" }),
      res
    );
    expect(res.redirect).toHaveBeenCalledWith(302, "/dashboard");
  });
});
