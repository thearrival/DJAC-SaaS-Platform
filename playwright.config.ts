import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for DJAC end-to-end tests.
 *
 * Runs against a deployed environment (E2E_BASE_URL) or localhost. Playwright is
 * installed on demand via `node scripts/install-playwright.mjs` in the e2e
 * workflow — it is intentionally NOT a project devDependency.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:3001",
    trace: "on-first-retry",
    ignoreHTTPSErrors: true,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    {
      name: "mobile-chromium",
      use: { ...devices["Pixel 5"] },
    },
  ],
});
