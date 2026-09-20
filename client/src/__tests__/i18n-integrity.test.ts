/**
 * i18n integrity guard.
 *
 * Locks in the localization contract so a locale block or a critical piece of
 * UI chrome can never silently disappear:
 *   • All nine first-class locales must be defined.
 *   • Every locale must define the locale-switcher + theme labels (chrome that
 *     is always visible regardless of the page).
 *   • No duplicate top-level locale blocks.
 *
 * Full page-content translation for fr/es/de/ja/ko/pt is tracked separately
 * (they currently cover chrome + navigation and fall back to English for the
 * rest) — this test guards the baseline, not the full corpus.
 */

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const LOCALES = ["en", "ar", "zh", "fr", "es", "de", "ja", "ko", "pt"] as const;

// Chrome keys that must exist in every locale (locale switcher + theme toggle).
const REQUIRED_CHROME_KEYS = [
  "locale.label",
  "locale.english",
  "locale.arabic",
  "locale.chinese",
  "theme.toggle",
  "theme.light",
  "theme.dark",
];

const src = fs.readFileSync(
  path.resolve(process.cwd(), "client/src/contexts/LocaleContext.tsx"),
  "utf8"
);

/** Extract the raw source of a single top-level locale block. */
function localeBlock(locale: string): string {
  const marker = `\n  ${locale}: {`;
  const start = src.indexOf(marker);
  if (start === -1) return "";
  const rest = src.slice(start + marker.length);
  const nextMatch = rest.match(/\n  (en|ar|zh|fr|es|de|ja|ko|pt): \{/);
  return nextMatch ? rest.slice(0, nextMatch.index) : rest;
}

describe("i18n integrity", () => {
  it("defines all nine first-class locales exactly once", () => {
    for (const locale of LOCALES) {
      const occurrences = src.split(`\n  ${locale}: {`).length - 1;
      expect(occurrences, `locale "${locale}" block count`).toBe(1);
    }
  });

  it("every locale defines the locale-switcher + theme chrome keys", () => {
    for (const locale of LOCALES) {
      const block = localeBlock(locale);
      expect(block.length, `locale "${locale}" has content`).toBeGreaterThan(0);
      for (const key of REQUIRED_CHROME_KEYS) {
        expect(
          block.includes(`"${key}"`),
          `locale "${locale}" is missing "${key}"`
        ).toBe(true);
      }
    }
  });
});
