/**
 * CSP inline-script hash guard.
 *
 * The edge CSP (vercel.json) and the server CSP (security.ts) both allow our
 * pre-paint inline scripts by SHA-256 hash. When index.html changes, those
 * hashes silently go stale and the scripts are blocked — which caused a theme
 * and text-direction flash on every page. This test recomputes the hashes from
 * index.html and fails if the policies drift.
 */
import { describe, it, expect } from "vitest";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "../../..");

function hashesFromIndexHtml(): string[] {
  const html = fs.readFileSync(path.join(ROOT, "client/index.html"), "utf8");
  const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g;
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    if (!m[1].trim()) continue;
    out.push(
      `sha256-${crypto.createHash("sha256").update(m[1], "utf8").digest("base64")}`
    );
  }
  return out;
}

function hashesInFile(rel: string): string[] {
  const content = fs.readFileSync(path.join(ROOT, rel), "utf8");
  return content.match(/sha256-[A-Za-z0-9+/=]+/g) ?? [];
}

describe("CSP inline script hashes", () => {
  const expected = hashesFromIndexHtml();

  it("index.html has inline scripts to protect", () => {
    expect(expected.length).toBeGreaterThan(0);
  });

  for (const rel of ["vercel.json", "server/_core/security.ts"]) {
    it(`${rel} lists exactly the current inline-script hashes`, () => {
      const actual = new Set(hashesInFile(rel));
      const missing = expected.filter(h => !actual.has(h));
      expect(missing).toEqual([]);
      // No stale hashes either (they would only ever be dead policy entries).
      const stale = [...actual].filter(h => !expected.includes(h));
      expect(stale).toEqual([]);
    });
  }
});
