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
