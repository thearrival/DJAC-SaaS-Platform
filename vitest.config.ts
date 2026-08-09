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
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary", "lcov"],
      include: ["server/**/*.ts", "client/src/**/*.{ts,tsx}"],
      exclude: ["**/*.test.*", "**/*.spec.*", "**/node_modules/**"],
    },
  },
});
