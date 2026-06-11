import { describe, it, expect } from "vitest";
import { parseJwtUserId, getSessionTokenFromRequest, LOCAL_AUTH_COOKIE } from "../../services/local-jwt";

describe("Local JWT - parseJwtUserId", () => {
  it("should return a number when given a number", () => {
    expect(parseJwtUserId(42)).toBe(42);
    expect(parseJwtUserId(0)).toBe(0);
  });

  it("should parse a numeric string to number", () => {
    expect(parseJwtUserId("42")).toBe(42);
    expect(parseJwtUserId("0")).toBe(0);
    expect(parseJwtUserId("999")).toBe(999);
  });

  it("should return null for non-numeric values", () => {
    expect(parseJwtUserId(null)).toBe(null);
    expect(parseJwtUserId(undefined)).toBe(null);
    expect(parseJwtUserId("abc")).toBe(null);
    expect(parseJwtUserId("")).toBe(null);
    expect(parseJwtUserId({})).toBe(null);
    expect(parseJwtUserId(Infinity)).toBe(null);
    expect(parseJwtUserId(NaN)).toBe(null);
  });
});

describe("Local JWT - getSessionTokenFromRequest", () => {
  it("should extract token from parsed cookies", () => {
    const req = { cookies: { [LOCAL_AUTH_COOKIE]: "my-session-token" } };
    expect(getSessionTokenFromRequest(req)).toBe("my-session-token");
  });

  it("should fall back to parsing raw Cookie header", () => {
    const req = {
      cookies: {},
      headers: { cookie: `${LOCAL_AUTH_COOKIE}=fallback-token; other=value` },
    };
    expect(getSessionTokenFromRequest(req)).toBe("fallback-token");
  });

  it("should prefer parsed cookies over raw header", () => {
    const req = {
      cookies: { [LOCAL_AUTH_COOKIE]: "from-parser" },
      headers: { cookie: `${LOCAL_AUTH_COOKIE}=from-header` },
    };
    expect(getSessionTokenFromRequest(req)).toBe("from-parser");
  });

  it("should return null when no cookie is present", () => {
    expect(getSessionTokenFromRequest({ cookies: {} })).toBe(null);
    expect(getSessionTokenFromRequest({ headers: {} })).toBe(null);
    expect(getSessionTokenFromRequest({})).toBe(null);
  });

  it("should return null when cookie header is empty string", () => {
    const req = { cookies: {}, headers: { cookie: "" } };
    expect(getSessionTokenFromRequest(req)).toBe(null);
  });

  it("should return null when cookie header is not a string", () => {
    const req = { cookies: {}, headers: { cookie: 123 } };
    expect(getSessionTokenFromRequest(req)).toBe(null);
  });
});
