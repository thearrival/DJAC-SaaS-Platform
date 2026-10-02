/**
 * SEO exposure guard (mandate §37).
 *
 * The SPA serves one `index.html` that declares `index, follow` for every
 * route. Authenticated app routes must not be indexed, so the shell overrides
 * the robots meta per path. This test pins the public/private classification
 * and checks it stays consistent with `client/public/robots.txt`.
 */

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  isPublicPath,
  robotsDirectiveForPath,
  ROBOTS_INDEX,
  ROBOTS_NOINDEX,
} from "@/lib/seoPolicy";

describe("seoPolicy", () => {
  it("treats marketing/docs/auth routes as public", () => {
    for (const p of [
      "/",
      "/pricing",
      "/login",
      "/signup",
      "/forgot-password",
      "/verify-email",
      "/reset-password",
      "/privacy",
      "/terms",
      "/docs",
      "/docs/getting-started/welcome",
      "/demo",
      "/hero",
    ]) {
      expect(isPublicPath(p), `${p} should be public`).toBe(true);
    }
  });

  it("treats authenticated app routes as private", () => {
    for (const p of [
      "/dashboard",
      "/dashboard-enhanced",
      "/global-registry",
      "/admin-control-center",
      "/admin/health",
      "/yalla-hack-owners-console/dashboard",
      "/yalla-admin/login",
      "/client-workspace",
      "/billing",
      "/api-keys",
      "/compliance-tracker",
      "/cross-border-data-flow",
    ]) {
      expect(isPublicPath(p), `${p} should be private`).toBe(false);
    }
  });

  it("honours prefix boundaries (/hero public, /home private)", () => {
    expect(isPublicPath("/hero")).toBe(true);
    expect(isPublicPath("/home")).toBe(false);
    expect(isPublicPath("/docs")).toBe(true);
    expect(isPublicPath("/docsomething")).toBe(false);
  });

  it("normalizes trailing slashes, query and hash", () => {
    expect(isPublicPath("/pricing/")).toBe(true);
    expect(isPublicPath("/dashboard/")).toBe(false);
    expect(isPublicPath("/dashboard?tab=1")).toBe(false);
    expect(isPublicPath("/login#form")).toBe(true);
  });

  it("returns the matching robots directive", () => {
    expect(robotsDirectiveForPath("/")).toBe(ROBOTS_INDEX);
    expect(robotsDirectiveForPath("/docs/x")).toBe(ROBOTS_INDEX);
    expect(robotsDirectiveForPath("/dashboard")).toBe(ROBOTS_NOINDEX);
    expect(robotsDirectiveForPath("/admin/health")).toBe(ROBOTS_NOINDEX);
  });

  it("stays consistent with client/public/robots.txt", () => {
    const robots = fs.readFileSync(
      path.resolve(process.cwd(), "client/public/robots.txt"),
      "utf8"
    );
    const lines = robots
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(Boolean);
    const allows = lines
      .filter(l => l.startsWith("Allow:"))
      .map(l => l.slice("Allow:".length).trim());
    const disallows = lines
      .filter(l => l.startsWith("Disallow:"))
      .map(l => l.slice("Disallow:".length).trim());

    for (const a of allows) {
      expect(
        isPublicPath(a),
        `robots.txt allows ${a} but policy is private`
      ).toBe(true);
    }
    for (const d of disallows) {
      if (d.startsWith("/api")) continue;
      const sample = d.endsWith("/") ? d.slice(0, -1) : d;
      expect(
        isPublicPath(sample),
        `robots.txt disallows ${d} but policy is public`
      ).toBe(false);
    }
  });
});
