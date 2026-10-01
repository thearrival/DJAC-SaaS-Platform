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
import { LOCALE_SUPPLEMENT } from "../contexts/localeSupplement";

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

const localesDir = path.resolve(process.cwd(), "client/src/locales");

/** Raw source of a single locale's catalog module. */
function localeBlock(locale: string): string {
  const file = path.join(localesDir, `${locale}.ts`);
  return fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
}

describe("i18n integrity", () => {
  it("defines all nine first-class locales exactly once", () => {
    for (const locale of LOCALES) {
      const content = localeBlock(locale);
      expect(
        content.length,
        `locale "${locale}" module exists and is non-empty`
      ).toBeGreaterThan(0);
      // Exactly one catalog object per locale module.
      const declarations = content.split("const messages").length - 1;
      expect(declarations, `locale "${locale}" catalog count`).toBe(1);
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

describe("i18n chrome supplement", () => {
  const PARTIAL = ["fr", "es", "de", "ja", "ko", "pt"] as const;
  const REQUIRED = [
    "layout.groupGlobal",
    "layout.groupResources",
    "layout.groupCyberOps",
    "layout.signOutTitle",
    "layout.menuAuditLog",
  ];

  it("covers the chrome keys for every partial locale", () => {
    for (const locale of PARTIAL) {
      const pack = LOCALE_SUPPLEMENT[locale];
      expect(pack, `supplement for "${locale}"`).toBeTruthy();
      for (const key of REQUIRED) {
        expect(
          pack?.[key],
          `${locale} supplement missing "${key}"`
        ).toBeTruthy();
      }
    }
  });

  it("provides the group labels that are missing from all locale packs", () => {
    for (const locale of ["en", "ar", "zh"] as const) {
      expect(LOCALE_SUPPLEMENT[locale]?.["layout.groupGlobal"]).toBeTruthy();
      expect(LOCALE_SUPPLEMENT[locale]?.["layout.groupResources"]).toBeTruthy();
    }
  });
});
