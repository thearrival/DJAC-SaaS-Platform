import { describe, it, expect } from "vitest";

interface MockRequest {
  protocol: string;
  headers: Record<string, string | string[] | undefined>;
}

const isSecureRequest = (req: MockRequest): boolean => {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto)
    ? forwardedProto
    : forwardedProto.split(",");
  return protoList.some(proto => proto.trim().toLowerCase() === "https");
};

const getSessionCookieOptions = (req: MockRequest) => {
  const secure = isSecureRequest(req);
  const sameSite = secure ? ("none" as const) : ("lax" as const);
  return { httpOnly: true, path: "/", sameSite, secure };
};

describe("isSecureRequest", () => {
  it("should return true for https protocol", () => {
    expect(isSecureRequest({ protocol: "https", headers: {} })).toBe(true);
  });

  it("should return false for http protocol without proxy header", () => {
    expect(isSecureRequest({ protocol: "http", headers: {} })).toBe(false);
  });

  it("should check x-forwarded-proto when protocol is http", () => {
    expect(
      isSecureRequest({
        protocol: "http",
        headers: { "x-forwarded-proto": "https" },
      })
    ).toBe(true);
  });

  it("should handle comma-separated x-forwarded-proto", () => {
    expect(
      isSecureRequest({
        protocol: "http",
        headers: { "x-forwarded-proto": "http, https" },
      })
    ).toBe(true);
  });

  it("should handle array x-forwarded-proto headers", () => {
    expect(
      isSecureRequest({
        protocol: "http",
        headers: { "x-forwarded-proto": ["http", "https"] },
      })
    ).toBe(true);
  });

  it("should return false when x-forwarded-proto has no https", () => {
    expect(
      isSecureRequest({
        protocol: "http",
        headers: { "x-forwarded-proto": "http" },
      })
    ).toBe(false);
  });

  it("should handle empty x-forwarded-proto", () => {
    expect(
      isSecureRequest({
        protocol: "http",
        headers: { "x-forwarded-proto": "" },
      })
    ).toBe(false);
  });
});

describe("getSessionCookieOptions", () => {
  it("should return secure=none for https", () => {
    const opts = getSessionCookieOptions({ protocol: "https", headers: {} });
    expect(opts.secure).toBe(true);
    expect(opts.sameSite).toBe("none");
  });

  it("should return secure=lax for http", () => {
    const opts = getSessionCookieOptions({ protocol: "http", headers: {} });
    expect(opts.secure).toBe(false);
    expect(opts.sameSite).toBe("lax");
  });

  it("should return secure=none when x-forwarded-proto is https", () => {
    const opts = getSessionCookieOptions({
      protocol: "http",
      headers: { "x-forwarded-proto": "https" },
    });
    expect(opts.secure).toBe(true);
    expect(opts.sameSite).toBe("none");
  });

  it("should always include httpOnly=true", () => {
    const opts = getSessionCookieOptions({ protocol: "https", headers: {} });
    expect(opts.httpOnly).toBe(true);
  });

  it("should always include path=/", () => {
    const opts = getSessionCookieOptions({ protocol: "https", headers: {} });
    expect(opts.path).toBe("/");
  });
});
