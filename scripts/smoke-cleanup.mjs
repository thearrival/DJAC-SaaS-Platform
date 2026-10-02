#!/usr/bin/env node
/**
 * Smoke-test cleanup.
 *
 * `pnpm smoke:runtime` validates the live customer flows by creating real
 * records (registration → organization → access request → consultation →
 * report). Historically it had no teardown, so those `smoke*@example.com`
 * records accumulated in the target database.
 *
 * An earlier version of this script deleted only the `localUsers` rows, which
 * left orphaned `organizations` (and their members / onboarding rows) behind
 * (`org-56-smoke-runtime-organization` survived in production). This version
 * removes the whole graph.
 *
 * Requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (service role). Point it at
 * the same project the smoke run targeted. Safe to run repeatedly.
 *
 * Usage:
 *   node scripts/smoke-cleanup.mjs            # deletes residue
 *   node scripts/smoke-cleanup.mjs --dry-run  # prints what would be deleted
 */

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error(
    "[smoke-cleanup] SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required."
  );
  process.exit(1);
}

const DRY = process.argv.includes("--dry-run");
const base = url.replace(/\/$/, "") + "/rest/v1";
const headers = { apikey: key, Authorization: `Bearer ${key}` };
const FILTER = "like.smoke*@example.com";

async function select(path) {
  const res = await fetch(`${base}/${path}`, { headers });
  if (!res.ok) {
    console.warn(`  ! select ${path} -> ${res.status} (${await res.text()})`);
    return [];
  }
  return res.json();
}

async function remove(table, query) {
  if (DRY) {
    const rows = await select(`${table}?select=id&${query}`);
    console.log(`  [dry] ${table} (${query}) -> ${rows.length} row(s)`);
    return;
  }
  const res = await fetch(`${base}/${table}?${query}`, {
    method: "DELETE",
    headers,
  });
  console.log(`  ${table} (${query}) -> ${res.status}`);
}

const ids = rows => rows.map(r => r.id);
const inList = list => `in.(${list.join(",")})`;

console.log(
  `[smoke-cleanup] removing smoke-test residue${DRY ? " (dry run)" : ""}…`
);

const localUsers = await select(`localUsers?select=id&email=${FILTER}`);
const users = await select(`users?select=id&email=${FILTER}`);
const orgs = await select(`organizations?select=id&billingEmail=${FILTER}`);
const localIds = ids(localUsers);
const userIds = ids(users);
const orgIds = ids(orgs);

const orgFilter = orgIds.length ? `organization_id=${inList(orgIds)}` : null;
const memberFilter = orgIds.length ? `organizationId=${inList(orgIds)}` : null;

// Dependents first (child rows), then the parent organizations/users.
for (const [table, column] of [
  ["organizationMembers", memberFilter],
  ["organization_profiles_custom", orgFilter],
]) {
  if (column) await remove(table, column);
}

for (const table of [
  "onboarding_responses",
  "onboarding_events",
  "onboarding_profile_history",
  "personalization_recommendations",
]) {
  const parts = [];
  if (orgIds.length) parts.push(`organization_id.in.(${orgIds.join(",")})`);
  if (localIds.length) parts.push(`local_user_id.in.(${localIds.join(",")})`);
  if (userIds.length) parts.push(`user_id.in.(${userIds.join(",")})`);
  if (parts.length) await remove(table, `or=(${parts.join(",")})`);
}

{
  const parts = [];
  if (orgIds.length) parts.push(`organizationId.in.(${orgIds.join(",")})`);
  if (localIds.length) parts.push(`localUserId.in.(${localIds.join(",")})`);
  if (userIds.length) parts.push(`userId.in.(${userIds.join(",")})`);
  if (parts.length)
    await remove("userInteractionLogs", `or=(${parts.join(",")})`);
}

await remove("accessRequests", `email=${FILTER}`);
await remove("consultationRequests", `contactEmail=${FILTER}`);
if (orgIds.length) await remove("organizations", `id=${inList(orgIds)}`);
if (localIds.length) await remove("localUsers", `id=${inList(localIds)}`);
if (userIds.length) await remove("users", `id=${inList(userIds)}`);

console.log(`[smoke-cleanup] done${DRY ? " (no changes made)" : ""}.`);
