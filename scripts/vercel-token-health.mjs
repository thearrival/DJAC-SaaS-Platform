#!/usr/bin/env node
/**
 * Vercel Token Health Check
 *
 * Verifies the Vercel token stored in GitHub Secrets is valid.
 * If expired, attempts refresh via the Vercel CLI and updates the secret.
 * Run locally or as a scheduled GitHub Action.
 *
 * Usage:  node scripts/vercel-token-health.mjs
 */

import { execSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import { homedir } from "os";
import path from "path";

const SECRET_NAME = "VERCEL_TOKEN";
const AUTH_PATH = path.join(
  process.env.APPDATA || path.join(homedir(), ".local", "share"),
  "xdg.data",
  "com.vercel.cli",
  "auth.json"
);

function fmtMinutes(ms) {
  return Math.round(ms / 60_000);
}

async function main() {
  console.log("=== Vercel Token Health Check ===\n");

  if (!existsSync(AUTH_PATH)) {
    console.log("[SKIP] No local Vercel auth file — run `vercel login` first.\n");
    return;
  }

  const auth = JSON.parse(readFileSync(AUTH_PATH, "utf-8"));
  const { token, expiresAt, refreshToken } = auth;

  if (!token) {
    console.log("[FAIL] No token in auth.json.\n");
    process.exitCode = 1;
    return;
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const remaining = expiresAt ? fmtMinutes((expiresAt - nowSec) * 1000) : "unknown";

  console.log(`Token:    ${token.substring(0, 12)}...`);
  console.log(`Expires:  ${expiresAt ? new Date(expiresAt * 1000).toISOString() : "unknown"}`);
  console.log(`Remaining:${typeof remaining === "number" ? ` ${remaining} min` : ` ${remaining}`}`);
  console.log(`Refresh:  ${refreshToken ? "present" : "missing"}\n`);

  let valid = false;
  try {
    execSync("vercel whoami", { stdio: "pipe", timeout: 15_000 });
    console.log("[OK]   Token is valid.\n");
    valid = true;
  } catch {
    console.log("[WARN] Token may be expired — attempting refresh...\n");
  }

  if (!valid && refreshToken) {
    try {
      execSync("vercel whoami", { stdio: "pipe", timeout: 15_000 });
      console.log("[OK]   Token auto-refreshed.\n");
      valid = true;
    } catch {
      console.log("[FAIL] Token refresh failed. Generate a new one at:");
      console.log("       https://vercel.com/account/tokens\n");
    }
  }

  if (!valid) {
    console.log("[ACTION] Create a permanent token at https://vercel.com/account/tokens");
    console.log("         Then run: gh secret set VERCEL_TOKEN --repo thearrival/DJAC-SaaS-Platform --body \"<token>\"\n");
    process.exitCode = 1;
    return;
  }

  const refreshed = JSON.parse(readFileSync(AUTH_PATH, "utf-8"));
  const diff = refreshed.token !== token;
  if (diff) {
    console.log("[INFO] Token changed after refresh — updating GitHub secret...\n");
    try {
      execSync(
        `gh secret set ${SECRET_NAME} --repo thearrival/DJAC-SaaS-Platform --body "${refreshed.token}"`,
        { stdio: "pipe", timeout: 15_000 }
      );
      console.log("[OK]   GitHub secret updated.\n");
    } catch (e) {
      console.log("[WARN] Could not update GitHub secret:", e.message);
      console.log("       Run manually: gh secret set VERCEL_TOKEN ...\n");
    }
  }

  console.log("Done.\n");
}

main().catch(err => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
