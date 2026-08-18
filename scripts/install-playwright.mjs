import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const repoRoot = fileURLToPath(new URL("../", import.meta.url));
const pnpmInstall = execSync("pnpm add -D playwright", { cwd: repoRoot });
console.log("playwright installed:", pnpmInstall.toString().slice(-200));
