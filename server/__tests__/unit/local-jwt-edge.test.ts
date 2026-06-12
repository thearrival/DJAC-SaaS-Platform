import { describe, it, expect } from "vitest";
import {
  parseJwtUserId,
  getSessionTokenFromRequest,
  LOCAL_AUTH_COOKIE,
} from "../../services/local-jwt";

describe("local-jwt — parseJwtUserId edge cases", () => {
  it("should parse numeric string sub", () => {
    expect(parseJwtUserId("42")).toBe(42);
    expect(parseJwtUserId("0")).toBe(0);
  });

  it("should parse numeric sub", () => {
    expect(parseJwtUserId(99)).toBe(99);
  });

  it("should return null for invalid types", () => {
    expect(parseJwtUserId(null)).toBeNull();
    expect(parseJwtUserId(undefined)).toBeNull();
    expect(parseJwtUserId(true)).toBeNull();
    expect(parseJwtUserId({})).toBeNull();
    expect(parseJwtUserId([])).toBeNull();
    expect(parseJwtUserId(NaN)).toBeNull();
    expect(parseJwtUserId(Infinity)).toBeNull();
  });

  it("should return null for non-numeric strings", () => {
    expect(parseJwtUserId("abc")).toBeNull();
    expect(parseJwtUserId("")).toBeNull();
    expect(parseJwtUserId("   ")).toBeNull();
    expect(parseJwtUserId("abc")).toBeNull();
  });
});

describe("local-jwt — getSessionTokenFromRequest edge cases", () => {
  it("should return null when no cookies or headers", () => {
    expect(getSessionTokenFromRequest({})).toBeNull();
    expect(getSessionTokenFromRequest({ cookies: {} })).toBeNull();
    expect(getSessionTokenFromRequest({ headers: {} })).toBeNull();
  });

  it("should extract token from parsed cookies", () => {
    const token = "eyJhbGciOiJIUzI1NiJ9.test";
    expect(
      getSessionTokenFromRequest({
        cookies: { [LOCAL_AUTH_COOKIE]: token },
      })
    ).toBe(token);
  });

  it("should extract token from raw cookie header", () => {
    const token = "eyJhbGciOiJIUzI1NiJ9.test";
    expect(
      getSessionTokenFromRequest({
        headers: { cookie: `${LOCAL_AUTH_COOKIE}=${token}` },
      })
    ).toBe(token);
  });

  it("should handle multiple cookies in header", () => {
    const token = "eyJhbGciOiJIUzI1NiJ9.test";
    expect(
      getSessionTokenFromRequest({
        headers: { cookie: `other=val; ${LOCAL_AUTH_COOKIE}=${token}; another=x` },
      })
    ).toBe(token);
  });

  it("should prefer parsed cookies over raw header", () => {
    expect(
      getSessionTokenFromRequest({
        cookies: { [LOCAL_AUTH_COOKIE]: "parsed-token" },
        headers: { cookie: `${LOCAL_AUTH_COOKIE}=header-token` },
      })
    ).toBe("parsed-token");
  });

  it("should return null when cookie header has wrong type", () => {
    expect(
      getSessionTokenFromRequest({
        headers: { cookie: null },
      })
    ).toBeNull();
    expect(
      getSessionTokenFromRequest({
        headers: { cookie: 123 },
      })
    ).toBeNull();
  });
});
