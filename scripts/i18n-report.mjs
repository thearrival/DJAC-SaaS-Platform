#!/usr/bin/env node
/**
 * i18n report — localization coverage + translator handoff.
 *
 * Parses client/src/contexts/LocaleContext.tsx and reports, per locale:
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
const SOURCE = path.resolve(
  process.cwd(),
  "client/src/contexts/LocaleContext.tsx"
);
const OUT_DIR = path.resolve(process.cwd(), "i18n-missing");
const asJson = process.argv.includes("--json");

const src = fs.readFileSync(SOURCE, "utf8");

/** Raw source of a single top-level locale block. */
function block(locale) {
  const marker = `\n  ${locale}: {`;
  const start = src.indexOf(marker);
  if (start === -1) return "";
  const rest = src.slice(start + marker.length);
  const next = rest.match(/\n {2}(en|ar|zh|fr|es|de|ja|ko|pt): \{/);
  return next ? rest.slice(0, next.index) : rest;
}

/** Map of key -> raw quoted value for a locale. */
function entries(locale) {
  const out = new Map();
  for (const m of block(locale).matchAll(
    /^\s*"([^"]+)"\s*:\s*("(?:[^"\\]|\\.)*")/gm
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
    JSON.stringify({ source: SOURCE, report, missingTotal }, null, 2)
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
