#!/usr/bin/env node
/**
 * console-sweep.mjs — runtime error sweep across key authenticated pages.
 *
 * Logs in with E2E_EMAIL/E2E_PASSWORD, visits each page, and fails if any
 * console error or uncaught page error occurs. Complements unit and a11y tests
 * by catching runtime exceptions.
 *
 *   E2E_EMAIL=… E2E_PASSWORD=… pnpm smoke:console
 *   LIVE_BASE_URL=https://app.yalla-hack.ae pnpm smoke:console
 */

import { chromium } from "@playwright/test";

const base = (process.env.LIVE_BASE_URL || "https://app.yalla-hack.ae").replace(
  /\/+$/,
  ""
);
const email = process.env.E2E_EMAIL;
const password = process.env.E2E_PASSWORD;

if (!email || !password) {
  console.error(
    "smoke:console requires E2E_EMAIL and E2E_PASSWORD (a dedicated test account)."
  );
  process.exit(2);
}

const pages = [
  "/dashboard",
  "/pro-intelligence",
  "/global-registry",
  "/vendor-assessment",
  "/vendor-data-flow",
  "/client-workspace",
  "/entities",
  "/regulatory-changes",
  "/compliance-calendar",
  "/billing",
  "/account-settings",
  "/operations",
];

const browser = await chromium.launch();
const context = await browser.newContext();
const page = await context.newPage();

await page.goto(`${base}/login`, { waitUntil: "domcontentloaded" });
await page.getByPlaceholder(/email/i).fill(email);
await page.getByPlaceholder(/password/i).fill(password);
await page.getByRole("button", { name: /sign in/i }).click();
await page.waitForTimeout(15000);

let failures = 0;
for (const path of pages) {
  const errors = [];
  const onConsole = msg => {
    if (msg.type() === "error") errors.push(`console: ${msg.text()}`);
  };
  const onPageError = err => errors.push(`pageerror: ${err.message}`);
  page.on("console", onConsole);
  page.on("pageerror", onPageError);
  try {
    const res = await page.goto(`${base}${path}`, {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });
    await page.waitForTimeout(3500);
    const status = res ? res.status() : "?";
    const bad = errors.length > 0 || status !== 200;
    if (bad) failures++;
    console.log(`${bad ? "ERR" : "OK "} ${path} (HTTP ${status})`);
    for (const e of errors.slice(0, 5)) console.log(`    ${e}`);
  } catch (err) {
    failures++;
    console.log(`ERR ${path} navigation: ${err.message}`);
  } finally {
    page.off("console", onConsole);
    page.off("pageerror", onPageError);
  }
}

await browser.close();
console.log(
  `\n${failures === 0 ? "PASS" : "FAIL"} — ${pages.length - failures}/${pages.length} pages clean (${base})`
);
process.exit(failures === 0 ? 0 : 1);
