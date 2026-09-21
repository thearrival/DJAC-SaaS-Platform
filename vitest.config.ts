import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  root: path.resolve(import.meta.dirname),
  test: {
    environment: "node",
    include: [
      "server/**/*.test.ts",
      "server/**/*.spec.ts",
      "client/src/**/*.test.ts",
      "client/src/**/*.spec.ts",
    ],
    pool: "forks",
    // Bound worker forks. Vitest 4 defaults to (CPU cores - 1) workers; on a
    // 24-core host that spawns ~23 V8 isolates which collectively exhaust the
    // heap and intermittently fail the pre-commit hook with
    // "FATAL ERROR: ... JavaScript heap out of memory".
    minWorkers: 1,
    maxWorkers: 6,
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary", "lcov"],
      include: ["server/**/*.ts", "client/src/**/*.{ts,tsx}"],
      exclude: ["**/*.test.*", "**/*.spec.*", "**/node_modules/**"],
    },
  },
});
