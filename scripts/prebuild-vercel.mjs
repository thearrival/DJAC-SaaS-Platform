/**
 * Pre-builds the Vercel serverless function entry point using npx esbuild.
 *
 * The source lives at src/vercel-handler.ts (outside api/ so Vercel's
 * TypeScript builder doesn't try to compile it).
 *
 * Uses npx esbuild CLI to bundle into a single self-contained
 * api/[[...path]].mjs file that Vercel deploys as-is.
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const entry = path.resolve(root, "src", "vercel-handler.ts");
const outfile = path.resolve(root, "api", "index.cjs");

console.log("[prebuild] Compiling Vercel handler...");
console.log("[prebuild]   entry:", path.relative(root, entry));
console.log("[prebuild]   outfile:", path.relative(root, outfile));

// Ensure output directory exists
fs.mkdirSync(path.dirname(outfile), { recursive: true });

const cmd = [
  "npx",
  "esbuild",
  "--bundle",
  "--platform=node",
  "--target=node20",
  "--format=cjs",
  "--packages=external",
  "--external:pg-native",
  `"${entry}"`,
  `--outfile="${outfile}"`,
].join(" ");

console.log("[prebuild] Running:", cmd);

try {
  execSync(cmd, { stdio: "inherit", cwd: root });
} catch (err) {
  console.error("[prebuild] esbuild failed. Falling back to direct shell...");
  // Fallback: try without quotes (some shells handle differently)
    const fallbackCmd = `npx esbuild --bundle --platform=node --target=node20 --format=cjs --packages=external --external:pg-native "${entry.replace(/\\/g, '/')}" --outfile="${outfile.replace(/\\/g, '/')}"`;
  try {
    execSync(fallbackCmd, { stdio: "inherit", cwd: root, shell: true });
  } catch (err2) {
    console.error("[prebuild] Fallback also failed.");
    process.exit(1);
  }
}

if (!fs.existsSync(outfile)) {
  console.error("[prebuild] ERROR: Output file not created:", outfile);
  process.exit(1);
}

const stats = fs.statSync(outfile);
console.log(`[prebuild] Done — ${(stats.size / 1024).toFixed(1)} KB`);

// Verify no local imports remain
const content = fs.readFileSync(outfile, "utf8");
const localImports = [...content.matchAll(/from\s+["'](\.\.?\/)/g)];
if (localImports.length > 0) {
  console.warn(`[prebuild] WARNING: ${localImports.length} relative import(s) found:`);
  for (const m of localImports.slice(0, 5)) {
    console.warn("[prebuild]  ", m[0]);
  }
} else {
  console.log("[prebuild] Verified: no local imports — fully bundled.");
}
