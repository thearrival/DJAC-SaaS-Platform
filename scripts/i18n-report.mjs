#!/usr/bin/env node
/**
 * i18n report — localization coverage + translator handoff.
 *
 * Reads the per-locale catalogs in client/src/locales/<locale>.ts (the single
 * source of truth since the catalogs were split out of LocaleContext) and
 * reports, per locale:
 *   • how many keys are translated,
 *   • coverage vs. English,
 *   • the exact list of missing keys (with the English source string),
 *     exported to i18n-missing/<locale>.json for a professional translator.
 *
 * It does NOT machine-translate anything. Usage:
 *   node scripts/i18n-report.mjs
 *   node scripts/i18n-report.mjs --json
 */

import fs from "node:fs";
import path from "node:path";

const LOCALES = ["en", "ar", "zh", "fr", "es", "de", "ja", "ko", "pt"];
const LOCALES_DIR = path.resolve(process.cwd(), "client/src/locales");
const OUT_DIR = path.resolve(process.cwd(), "i18n-missing");
const asJson = process.argv.includes("--json");

/** Map of key -> raw quoted value for a locale. Handles multi-line values. */
function entries(locale) {
  const file = path.join(LOCALES_DIR, `${locale}.ts`);
  if (!fs.existsSync(file)) return new Map();
  const src = fs.readFileSync(file, "utf8");
  const out = new Map();
  // `\s*` spans newlines, so prettier-wrapped ("key":\n  "value") entries match.
  for (const m of src.matchAll(
    /"((?:[^"\\]|\\.)+)"\s*:\s*("(?:[^"\\]|\\.)*")/g
  )) {
    out.set(m[1], m[2]);
  }
  return out;
}

const en = entries("en");
const report = [];
let missingTotal = 0;

for (const locale of LOCALES) {
  const map = entries(locale);
  const missing = [...en.keys()].filter(k => !map.has(k));
  missingTotal += locale === "en" ? 0 : missing.length;
  report.push({
    locale,
    translated: map.size,
    total: en.size,
    coveragePct: ((map.size / en.size) * 100).toFixed(1),
    missing: missing.length,
  });
  if (locale !== "en" && missing.length > 0) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
    const out = Object.fromEntries(missing.map(k => [k, en.get(k)]));
    fs.writeFileSync(
      path.join(OUT_DIR, `${locale}.json`),
      JSON.stringify(out, null, 2) + "\n",
      "utf8"
    );
  }
}

if (asJson) {
  console.log(
    JSON.stringify({ source: LOCALES_DIR, report, missingTotal }, null, 2)
  );
} else {
  console.log("=== DJAC i18n coverage ===\n");
  console.log("locale | translated | total | coverage");
  console.log("-------|-----------|-------|---------");
  for (const r of report) {
    console.log(
      `  ${r.locale.padEnd(4)} | ${String(r.translated).padStart(10)} | ${String(
        r.total
      ).padStart(5)} | ${r.coveragePct.padStart(6)}%`
    );
  }
  console.log(`\nTotal untranslated keys across locales: ${missingTotal}`);
  if (missingTotal > 0) {
    console.log(`Missing-key files written to: ${OUT_DIR}`);
  }
}
