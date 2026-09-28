import { test, expect, type Page } from "@playwright/test";

/**
 * End-to-end onboarding journey.
 *
 * Authenticated cases require E2E_EMAIL / E2E_PASSWORD (a dedicated test
 * account). The unauthenticated cases always run and assert the security
 * boundaries of the onboarding API.
 */

const email = process.env.E2E_EMAIL;
const password = process.env.E2E_PASSWORD;

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(email!);
  await page.getByLabel(/password/i).fill(password!);
  await page
    .getByRole("button", { name: /sign in|log in|login/i })
    .first()
    .click();
  await expect(page).not.toHaveURL(/\/login/);
}

test.describe("onboarding security boundaries", () => {
  test("unauthenticated onboarding API is rejected", async ({ request }) => {
    const res = await request.get("/api/trpc/onboarding.getState");
    expect([401, 403]).toContain(res.status());
  });

  test("unauthenticated owner onboarding API is rejected", async ({
    request,
  }) => {
    const res = await request.get("/api/admin-dashboard/onboarding");
    expect([401, 403]).toContain(res.status());
  });

  test("unknown API path returns a JSON 404", async ({ request }) => {
    const res = await request.get("/api/definitely-not-real");
    expect(res.status()).toBe(404);
    expect(res.headers()["content-type"] ?? "").toContain("application/json");
  });
});

test.describe("intelligent onboarding journey", () => {
  test.skip(
    !email || !password,
    "Set E2E_EMAIL and E2E_PASSWORD to run the authenticated journey."
  );

  test("completes onboarding and personalizes the workspace", async ({
    page,
  }) => {
    await login(page);
    await page.goto("/get-started");

    // Answer up to 8 screens by choosing the first option and continuing.
    for (let i = 0; i < 8; i++) {
      if (await page.getByText(/workspace is ready/i).count()) break;
      const option = page.locator("button[aria-pressed]").first();
      if ((await option.count()) === 0) break;
      await option.click();
      const cont = page.getByRole("button", { name: /continue/i });
      if ((await cont.count()) > 0) {
        await cont.click().catch(() => {});
      }
      await page.waitForTimeout(400);
    }

    await expect(
      page.getByText(/workspace is ready|personalized workspace/i).first()
    ).toBeVisible();

    await page.goto("/");
    await expect(
      page.getByText(/personalized workspace|recommended for you/i).first()
    ).toBeVisible();
  });
});
