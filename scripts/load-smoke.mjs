import { performance } from "node:perf_hooks";

const baseUrl = process.env.LOAD_BASE_URL || process.env.SMOKE_BASE_URL || "http://localhost:3000";
const targetPath = process.env.LOAD_PATH || "/api/healthz";
const requestCount = Number.parseInt(process.env.LOAD_REQUESTS || "200", 10);
const concurrency = Number.parseInt(process.env.LOAD_CONCURRENCY || "25", 10);
const maxP95Ms = Number.parseInt(process.env.LOAD_MAX_P95_MS || "1500", 10);

const log = (...args) => console.log("[load-smoke]", ...args);

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

function percentile(values, ratio) {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * ratio) - 1));
    return sorted[index];
}

async function fetchWithTiming(url) {
    const started = performance.now();

    try {
        const response = await fetch(url, {
            headers: {
                accept: "application/json",
            },
        });
        const body = await response.text();
        return {
            ok: response.ok,
            status: response.status,
            durationMs: performance.now() - started,
            error: response.ok ? "" : body.slice(0, 200),
        };
    } catch (error) {
        return {
            ok: false,
            status: 0,
            durationMs: performance.now() - started,
            error: error instanceof Error ? error.message : String(error),
        };
    }
}

async function run() {
    const url = `${baseUrl}${targetPath}`;
    log(`Base URL: ${baseUrl}`);
    log(`Target path: ${targetPath}`);
    log(`Requests: ${requestCount}`);
    log(`Concurrency: ${concurrency}`);

    const readyCheck = await fetchWithTiming(`${baseUrl}/api/readyz`);
    assert(
        readyCheck.status !== 0,
        `Unable to reach ${baseUrl}. Start the app server before running the load smoke check.`
    );
    log(`readyz status=${readyCheck.status} duration=${readyCheck.durationMs.toFixed(1)}ms`);

    let nextIndex = 0;
    const results = [];

    async function worker() {
        while (true) {
            const current = nextIndex;
            nextIndex += 1;
            if (current >= requestCount) {
                return;
            }

            const result = await fetchWithTiming(url);
            results.push(result);
        }
    }

    const workers = Array.from({ length: Math.max(1, concurrency) }, () => worker());
    await Promise.all(workers);

    const durations = results.map(result => result.durationMs);
    const successCount = results.filter(result => result.ok).length;
    const failureCount = results.length - successCount;
    const averageMs = durations.reduce((sum, value) => sum + value, 0) / Math.max(1, durations.length);
    const p50Ms = percentile(durations, 0.5);
    const p95Ms = percentile(durations, 0.95);
    const slowestMs = Math.max(...durations, 0);

    const failures = results.filter(result => !result.ok).slice(0, 5);
    if (failures.length > 0) {
        log("Sample failures:", failures);
    }

    log(`Success: ${successCount}/${results.length}`);
    log(`Failures: ${failureCount}`);
    log(`Average: ${averageMs.toFixed(1)}ms`);
    log(`p50: ${p50Ms.toFixed(1)}ms`);
    log(`p95: ${p95Ms.toFixed(1)}ms`);
    log(`Slowest: ${slowestMs.toFixed(1)}ms`);

    assert(failureCount === 0, `Load smoke failed with ${failureCount} unsuccessful responses.`);
    assert(
        p95Ms <= maxP95Ms,
        `Load smoke exceeded latency budget: p95=${p95Ms.toFixed(1)}ms > ${maxP95Ms}ms.`
    );

    log("Load smoke passed");
}

run().catch((error) => {
    console.error("[load-smoke] FAILED:", error);
    process.exit(1);
});
