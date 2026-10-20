#!/usr/bin/env node
/**
 * bundle-budget.mjs — fail if any production chunk exceeds its budget.
 *
 * Guards against accidental bundle bloat after `pnpm build`. Lazy chunks
 * (three.js, charts, locales) are allowed to be larger than the entry bundle.
 *
 *   pnpm build && pnpm bundle:check
 */

import fs from "node:fs";
import path from "node:path";

const dir = path.resolve(process.cwd(), "dist/public/assets");
const MAX_CHUNK = 650 * 1024;
const MAX_ENTRY = 350 * 1024;

if (!fs.existsSync(dir)) {
  console.error("bundle-budget: no build output — run `pnpm build` first.");
  process.exit(1);
}

const chunks = fs
  .readdirSync(dir)
  .filter(f => f.endsWith(".js"))
  .map(f => ({ f, size: fs.statSync(path.join(dir, f)).size }))
  .sort((a, b) => b.size - a.size);

const failures = [];
for (const { f, size } of chunks) {
  if (size > MAX_CHUNK) {
    failures.push(
      `${f} is ${(size / 1024).toFixed(1)}KB (> ${MAX_CHUNK / 1024}KB)`
    );
  }
}

const entry = chunks.find(c => /^index-.*\.js$/.test(c.f));
if (entry && entry.size > MAX_ENTRY) {
  failures.push(
    `entry ${entry.f} is ${(entry.size / 1024).toFixed(1)}KB (> ${MAX_ENTRY / 1024}KB)`
  );
}

console.log("Largest chunks:");
for (const { f, size } of chunks.slice(0, 8)) {
  console.log(`  ${f}  ${(size / 1024).toFixed(1)}KB`);
}

if (failures.length > 0) {
  console.error("\nbundle-budget: FAILED");
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

console.log(
  `\nbundle-budget: OK (${chunks.length} chunks, largest ${(chunks[0].size / 1024).toFixed(1)}KB)`
);
