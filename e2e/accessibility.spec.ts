import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Accessibility gate for the public entry points.
 *
 * Fails the run on `critical`/`serious` violations (the ones that actually block
 * assistive-technology users). `moderate`/`minor` findings are logged but do not
 * fail, to keep the gate actionable.
 */
const BASE = process.env.E2E_BASE_URL || "https://app.yalla-hack.ae";

const PUBLIC_PAGES = [
  { path: "/login", name: "login" },
  { path: "/signup", name: "signup" },
  { path: "/pricing", name: "pricing" },
  { path: "/privacy", name: "privacy" },
  { path: "/terms", name: "terms" },
];

for (const { path, name } of PUBLIC_PAGES) {
  test(`${name} page has no critical/serious accessibility violations`, async ({
    page,
  }) => {
    await page.goto(`${BASE}${path}`, {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });
    // Let lazy chunks / hydration settle.
    await page.waitForTimeout(2500);

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    const blocking = results.violations.filter(
      v => v.impact === "critical" || v.impact === "serious"
    );

    if (blocking.length) {
      // Surface a compact, readable summary in the test output.
      const summary = blocking
        .map(
          v =>
            `• [${v.impact}] ${v.id}: ${v.help}\n    ${
              v.nodes[0]?.target?.join(" ") ?? ""
            }`
        )
        .join("\n");
      console.log(`A11y violations on ${path}:\n${summary}`);
    }

    expect(
      blocking.map(v => `${v.impact}:${v.id}`),
      `critical/serious a11y violations on ${path}`
    ).toEqual([]);
  });
}

// ── Authenticated pages (opt-in: requires E2E_EMAIL / E2E_PASSWORD) ──────────
const EMAIL = process.env.E2E_EMAIL;
const PASSWORD = process.env.E2E_PASSWORD;

const AUTH_PAGES = [
  "/dashboard",
  "/client-workspace",
  "/global-registry",
  "/account-settings",
  "/gap-tracker",
];

test.describe("authenticated pages", () => {
  test.skip(
    !EMAIL || !PASSWORD,
    "Set E2E_EMAIL and E2E_PASSWORD to run authenticated a11y checks"
  );

  test.beforeEach(async ({ page }) => {
    // Retry the login: the auth endpoint is rate-limited, and parallel workers
    // can trip it.
    let loggedIn = false;
    for (let attempt = 0; attempt < 3 && !loggedIn; attempt++) {
      await page.goto(`${BASE}/login`, {
        waitUntil: "domcontentloaded",
        timeout: 45000,
      });
      await page.waitForTimeout(2000);
      await page.getByPlaceholder(/email/i).fill(EMAIL!);
      await page.getByPlaceholder(/password/i).fill(PASSWORD!);
      await page.getByRole("button", { name: /sign in/i }).click();
      await page.waitForTimeout(5000);
      loggedIn = !page.url().includes("/login");
      if (!loggedIn) await page.waitForTimeout(15000);
    }
  });

  for (const path of AUTH_PAGES) {
    test(`${path} has no critical/serious accessibility violations`, async ({
      page,
    }) => {
      await page.goto(`${BASE}${path}`, {
        waitUntil: "domcontentloaded",
        timeout: 45000,
      });
      await page.waitForTimeout(4000);

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();

      const blocking = results.violations.filter(
        v => v.impact === "critical" || v.impact === "serious"
      );
      if (blocking.length) {
        console.log(
          `A11y violations on ${path}: ${blocking
            .map(v => `${v.impact}:${v.id}`)
            .join(", ")}`
        );
      }
      expect(
        blocking.map(v => `${v.impact}:${v.id}`),
        `critical/serious a11y violations on ${path}`
      ).toEqual([]);
    });
  }
});
