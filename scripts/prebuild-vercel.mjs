#!/usr/bin/env node

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const entry = path.resolve(root, "src", "vercel-handler.ts");
const outfile = path.resolve(root, "api", "index.cjs");

console.log("[prebuild] Compiling Vercel handler...");
fs.mkdirSync(path.dirname(outfile), { recursive: true });

const cmd = [
  "npx", "esbuild",
  "--bundle", "--platform=node", "--target=node20",
  "--format=cjs", "--packages=external", "--external:pg-native",
  `"${entry}"`, `--outfile="${outfile}"`,
].join(" ");

try {
  execSync(cmd, { stdio: "inherit", cwd: root });
} catch {
  const fb = `npx esbuild --bundle --platform=node --target=node20 --format=cjs --packages=external --external:pg-native "${entry.replace(/\\/g, '/')}" --outfile="${outfile.replace(/\\/g, '/')}"`;
  execSync(fb, { stdio: "inherit", cwd: root, shell: true });
}

const stats = fs.statSync(outfile);
console.log(`[prebuild] Done — ${(stats.size / 1024).toFixed(1)} KB`);
