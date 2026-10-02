#!/usr/bin/env node
/**
 * Smoke-test cleanup.
 *
 * `pnpm smoke:runtime` validates the live customer flows by creating real
 * records (registration → access request → consultation → report). Historically
 * it had no teardown, so those `smoke*@example.com` records accumulated in the
 * target database (20 users were found in production during the readiness
 * audit). This script removes that residue.
 *
 * Requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (service role). Point it at
 * the same project the smoke run targeted. Safe to run repeatedly.
 *
 * Usage: node scripts/smoke-cleanup.mjs
 */

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error(
    "[smoke-cleanup] SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required."
  );
  process.exit(1);
}

const headers = { apikey: key, Authorization: `Bearer ${key}` };
const filter = "like.smoke*@example.com";

async function remove(table, query) {
  const res = await fetch(`${url}/rest/v1/${table}?${query}`, {
    method: "DELETE",
    headers,
  });
  console.log(`  ${table} (${query}) -> ${res.status}`);
  return res.status;
}

console.log("[smoke-cleanup] removing smoke-test residue…");
// Order matters only for readability; the rows are independent (userId is null).
await remove("accessRequests", `email=${filter}`);
await remove("consultationRequests", `contactEmail=${filter}`);
await remove("localUsers", `email=${filter}`);
console.log("[smoke-cleanup] done.");
