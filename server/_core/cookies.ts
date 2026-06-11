import type { CookieOptions, Request } from "express";

function isSecureRequest(req: Request) {
  if (req.protocol === "https") return true;

  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;

  const protoList = Array.isArray(forwardedProto)
    ? forwardedProto
    : forwardedProto.split(",");

  return protoList.some(proto => proto.trim().toLowerCase() === "https");
}

export function getSessionCookieOptions(
  req: Request
): Pick<CookieOptions, "domain" | "httpOnly" | "path" | "sameSite" | "secure"> {
  const secure = isSecureRequest(req);
  // SameSite=none is required for cross-site OAuth redirects,
  // but browsers reject SameSite=none without Secure=true.
  // Fall back to "lax" on plain HTTP (local dev) so the cookie is accepted.
  const sameSite: CookieOptions["sameSite"] = secure ? "none" : "lax";

  return {
    httpOnly: true,
    path: "/",
    sameSite,
    secure,
  };
}
