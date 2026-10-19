#!/usr/bin/env node
/**
 * secret-scan.mjs — dependency-free secret scanner for tracked files.
 *
 * Scans `git ls-files` for high-signal credential patterns and exits 1 on a
 * finding. Placeholders, docs, examples and test fixtures are allowlisted.
 *
 *   pnpm secret:scan
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ALLOW_FILES = [
  /^\.env(\..*)?\.example$/,
  /^docs\//,
  /^i18n-missing\//,
  /^server\/__tests__\//,
  /^scripts\/secret-scan\.mjs$/,
];

const ALLOW_VALUES = /REPLACE_WITH|_xxx\b|example|placeholder|dummy/i;

const PATTERNS = [
  { name: "Stripe live secret", re: /sk_live_[0-9A-Za-z]{20,}/ },
  { name: "Stripe webhook secret", re: /whsec_[0-9A-Za-z]{20,}/ },
  { name: "Google OAuth secret", re: /GOCSPX-[0-9A-Za-z_-]{20,}/ },
  { name: "Supabase access token", re: /sbp_[0-9A-Za-z]{30,}/ },
  {
    name: "AI provider key",
    re: /\bsk-[A-Za-z0-9]{32,}\b/,
  },
  { name: "AWS access key id", re: /\bAKIA[0-9A-Z]{16}\b/ },
  {
    name: "Private key block",
    re: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  },
  {
    name: "Service role key assignment",
    re: /SUPABASE_SERVICE_ROLE_KEY\s*=\s*eyJ[A-Za-z0-9._-]{20,}/,
  },
];

const files = execFileSync("git", ["ls-files", "-z"], {
  encoding: "utf8",
  maxBuffer: 64 * 1024 * 1024,
})
  .split("\0")
  .filter(Boolean);

const findings = [];
for (const file of files) {
  if (ALLOW_FILES.some(re => re.test(file))) continue;
  let stat;
  try {
    stat = fs.statSync(file);
  } catch {
    continue;
  }
  if (!stat.isFile() || stat.size > 2 * 1024 * 1024) continue;
  let content;
  try {
    content = fs.readFileSync(file, "utf8");
  } catch {
    continue;
  }
  if (content.includes("\0")) continue; // binary
  const lines = content.split(/\r?\n/);
  lines.forEach((line, idx) => {
    if (ALLOW_VALUES.test(line)) return;
    for (const { name, re } of PATTERNS) {
      if (re.test(line)) {
        findings.push(`${file}:${idx + 1}  ${name}`);
      }
    }
  });
}

if (findings.length === 0) {
  console.log(`secret-scan: clean (${files.length} tracked files scanned).`);
  process.exit(0);
}

console.error(`secret-scan: ${findings.length} potential secret(s) found:`);
for (const f of findings) console.error(`  ${f}`);
console.error(
  "\nRemove the value, rotate the credential, and use env vars / placeholders."
);
process.exit(1);
