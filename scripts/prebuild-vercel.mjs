#!/usr/bin/env node

/**
 * Pre-builds the Vercel serverless function entry point.
 *
 * The source lives at src/vercel-handler.ts (outside api/ so Vercel's
 * TypeScript builder doesn't try to compile it, which causes
 * FUNCTION_INVOCATION_FAILED due to import resolution issues).
 *
 * This script uses esbuild to bundle the handler AND all its local
 * imports into a single self-contained api/[[...path]].mjs file that
 * Vercel deploys as-is (no further compilation needed).
 */

import * as esbuild from "esbuild";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

async function main() {
  const entry = path.resolve(root, "src", "vercel-handler.ts");
  const outdir = path.resolve(root, "api");

  console.log("[prebuild] Compiling Vercel handler...");
  console.log("[prebuild]   entry:", path.relative(root, entry));
  console.log("[prebuild]   outdir:", path.relative(root, outdir));

  // Ensure the api/ directory exists.
  fs.mkdirSync(outdir, { recursive: true });

  await esbuild.build({
    entryPoints: [entry],
    outfile: path.resolve(outdir, "[[...path]].mjs"),
    bundle: true,
    platform: "node",
    target: "node20",
    format: "esm",
    // Keep npm packages external — Vercel provides them at runtime.
    packages: "external",
    // pg-native is an optional native addon.
    external: ["pg-native"],
    // Resolve tsconfig path aliases.
    tsconfig: path.resolve(root, "tsconfig.json"),
    sourcemap: false,
    minify: false,
  });

  const stats = fs.statSync(path.resolve(outdir, "[[...path]].mjs"));
  console.log(`[prebuild] Done — ${(stats.size / 1024).toFixed(1)} KB`);

  // Verify the output has NO local imports (all should be bundled).
  const content = fs.readFileSync(path.resolve(outdir, "[[...path]].mjs"), "utf8");
  const localImports = [...content.matchAll(/from\s+["'](\.\.?\/)/g)];
  if (localImports.length > 0) {
    console.warn(`[prebuild] WARNING: ${localImports.length} relative import(s) found — may not be bundled!`);
    for (const m of localImports.slice(0, 5)) {
      console.warn("[prebuild]   ", m[0]);
    }
  } else {
    console.log("[prebuild] Verified: no local imports — fully bundled.");
  }
}

main().catch((err) => {
  console.error("[prebuild] FAILED:", err);
  process.exit(1);
});
