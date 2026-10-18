/**
 * verify-live.mjs — post-deploy verification against a running environment.
 *
 * Checks health, readiness (services + integrations), and that key SPA routes
 * are served. Exits non-zero if anything fails, so it can gate a deployment.
 *
 * Usage:
 *   pnpm verify:live
 *   LIVE_BASE_URL=https://app.yalla-hack.ae pnpm verify:live
 *   node scripts/verify-live.mjs --url https://… --commit <sha> --json
 */

const args = process.argv.slice(2);
const argValue = flag => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
};

const baseUrl = (
  argValue("--url") ||
  process.env.LIVE_BASE_URL ||
  "https://app.yalla-hack.ae"
).replace(/\/+$/, "");
const expectedCommit = argValue("--commit");
const json = args.includes("--json");

const results = [];
function record(name, ok, detail = "") {
  results.push({ name, ok, detail });
  if (!json) {
    console.log(`${ok ? "✓" : "✗"} ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

async function getJson(path) {
  const res = await fetch(`${baseUrl}${path}`, {
    signal: AbortSignal.timeout(30_000),
  });
  let body = null;
  try {
    body = await res.json();
  } catch {
    /* non-JSON */
  }
  return { status: res.status, body };
}

async function getStatus(path) {
  const res = await fetch(`${baseUrl}${path}`, {
    signal: AbortSignal.timeout(30_000),
  });
  return res.status;
}

try {
  const health = await getJson("/api/healthz");
  record(
    "healthz",
    health.status === 200 && health.body?.ok === true,
    `HTTP ${health.status}`
  );

  const status = await getJson("/api/status");
  record(
    "status healthy",
    status.status === 200 && status.body?.ok === true,
    status.body?.status ?? `HTTP ${status.status}`
  );
  record(
    "database connected",
    status.body?.dbConnected === true,
    status.body?.dbConnected ? "dbConnected" : "NOT connected"
  );
  if (expectedCommit) {
    const live = status.body?.commit ?? "";
    record(
      "commit matches",
      live.startsWith(expectedCommit) || expectedCommit.startsWith(live),
      `live=${live.slice(0, 12)} expected=${expectedCommit.slice(0, 12)}`
    );
  }

  const ready = await getJson("/api/readyz");
  const isReady = ready.body?.ok === true || ready.body?.status === "ready";
  record("readyz", ready.status === 200 && isReady, ready.body?.status);
  for (const [name, svc] of Object.entries(ready.body?.services ?? {})) {
    record(`service · ${name}`, svc?.ready !== false, svc?.details ?? "");
  }
  for (const [name, integ] of Object.entries(ready.body?.integrations ?? {})) {
    record(
      `integration · ${name}`,
      integ?.configured !== false,
      integ?.details ?? ""
    );
  }

  for (const path of ["/", "/pricing", "/docs", "/login", "/signup"]) {
    const code = await getStatus(path);
    record(`page · ${path}`, code === 200, `HTTP ${code}`);
  }
} catch (err) {
  record("reachable", false, String(err));
}

const failed = results.filter(r => !r.ok);
if (json) {
  console.log(
    JSON.stringify({ baseUrl, ok: failed.length === 0, results }, null, 2)
  );
} else {
  console.log(
    `\n${failed.length === 0 ? "PASS" : "FAIL"} — ${results.length - failed.length}/${results.length} checks passed (${baseUrl})`
  );
}

process.exit(failed.length === 0 ? 0 : 1);
