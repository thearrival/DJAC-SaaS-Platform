#!/usr/bin/env node
/**
 * generate-owner-credentials.mjs
 *
 * Generates a cryptographically secure username + bcrypt password hash for the
 * Yalla-Hack owner portal.  Run this ONCE, copy the env vars to your VPS /
 * GitHub Secrets, then delete or ignore the terminal output.
 *
 * Usage:
 *   node djac-live/scripts/generate-owner-credentials.mjs
 *
 * Requirements: Node 18+ (uses built-in crypto; bcryptjs must be installed)
 *   cd djac-live && node scripts/generate-owner-credentials.mjs
 */

import { randomBytes } from "node:crypto";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const bcrypt = require("bcryptjs");

// ── Generate credentials ──────────────────────────────────────────────────────

// Username: "owner_" + 6 random hex chars  →  e.g. owner_a3f9c1
const username = `owner_${randomBytes(6).toString("hex")}`;

// Password: 48 random bytes → 64-char URL-safe base64 string (no +/= chars)
const rawPassword = randomBytes(48).toString("base64url");

// bcrypt with cost 12 — strong but still fast enough for interactive login
const passwordHash = await bcrypt.hash(rawPassword, 12);

// ── Print ─────────────────────────────────────────────────────────────────────

const line = "─".repeat(60);

console.log("\n" + line);
console.log("  YALLA-HACK OWNER PORTAL — CREDENTIALS (show ONCE)");
console.log(line);
console.log(`\n  Username  : ${username}`);
console.log(`  Password  : ${rawPassword}`);
console.log("\n" + line);
console.log("  Copy these env vars to your VPS / GitHub Secrets:");
console.log(line);
console.log(`\n  YALLA_ADMIN_USERNAME=${username}`);
console.log(`  YALLA_ADMIN_PASSWORD=${passwordHash}`);
console.log(`\n  Also generate and set these if not done yet:`);
console.log(`  YALLA_ADMIN_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")`);
console.log(`  YALLA_ADMIN_JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")`);
console.log("\n" + line);
console.log("  ⚠  This output will NOT be shown again.");
console.log("     Store the raw password in a password manager NOW.");
console.log(line + "\n");
