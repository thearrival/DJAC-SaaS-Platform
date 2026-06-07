/**
 * One-time script: inserts vendorRisk.* locale keys into LocaleContext.tsx
 * for the Arabic (AR) and Chinese (ZH) blocks.
 * Run from repo root: node scripts/add-vendor-risk-locale.mjs
 */
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filePath = path.join(__dirname, "../client/src/contexts/LocaleContext.tsx");

let content = readFileSync(filePath, "utf-8");
const originalContent = content;

function hasVendorRiskKeysInSection(sectionText) {
  return sectionText.includes('"vendorRisk.title"') && sectionText.includes('"vendorRisk.colAdded"');
}

function getLocaleSection(contentText, localeKey) {
  const start = contentText.indexOf(`\n    ${localeKey}: {`);
  if (start === -1) return "";

  // Locale sections are top-level objects in one large translations map.
  const afterStart = contentText.slice(start + 1);
  const nextLocale = afterStart.search(/\n    [a-z]{2}: \{/);
  if (nextLocale === -1) {
    return afterStart;
  }
  return afterStart.slice(0, nextLocale);
}

// ── AR block ──────────────────────────────────────────────────────────────────
// File stores Arabic as literal \u sequences (ASCII).  We use String.raw so
// that the JS string also contains literal backslash-u sequences.
const arAnchor = String.raw`"layout.menuVendorRisk": "\u0644\u0648\u062d\u0629 \u0645\u062e\u0627\u0637\u0631 \u0627\u0644\u0645\u0648\u0631\u062f\u064a\u0646",`;
const arSection = getLocaleSection(content, "ar");

if (hasVendorRiskKeysInSection(arSection)) {
  console.log("• AR vendorRisk keys already present, skipping");
} else if (content.includes(arAnchor)) {
  const arKeys = [
    String.raw`        "vendorRisk.title": "\u0644\u0648\u062d\u0629 \u0645\u062e\u0627\u0637\u0631 \u0627\u0644\u0645\u0648\u0631\u062f\u064a\u0646",`,
    String.raw`        "vendorRisk.subtitle": "\u0627\u0644\u0648\u0636\u0639 \u0627\u0644\u0625\u062c\u0645\u0627\u0644\u064a \u0644\u0644\u0645\u062e\u0627\u0637\u0631 \u0639\u0628\u0631 \u062c\u0645\u064a\u0639 \u0645\u0648\u0631\u062f\u064a \u0627\u0644\u062c\u0647\u0627\u062a \u0627\u0644\u062e\u0627\u0631\u062c\u064a\u0629 \u0627\u0644\u0645\u0633\u062c\u0644\u064a\u0646.",`,
    String.raw`        "vendorRisk.addVendor": "\u062a\u0633\u062c\u064a\u0644 \u0645\u0648\u0631\u062f",`,
    String.raw`        "vendorRisk.totalVendors": "\u0625\u062c\u0645\u0627\u0644\u064a \u0627\u0644\u0645\u0648\u0631\u062f\u064a\u0646",`,
    String.raw`        "vendorRisk.filterBy": "\u062a\u0635\u0641\u064a\u0629:",`,
    String.raw`        "vendorRisk.filterAll": "\u0627\u0644\u0643\u0644",`,
    String.raw`        "vendorRisk.filterJuris": "\u0627\u0644\u0648\u0644\u0627\u064a\u0629 \u0627\u0644\u0642\u0636\u0627\u0626\u064a\u0629:",`,
    String.raw`        "vendorRisk.loading": "\u062c\u0627\u0631\u064a \u062a\u062d\u0645\u064a\u0644 \u0627\u0644\u0645\u0648\u0631\u062f\u064a\u0646\u2026",`,
    String.raw`        "vendorRisk.emptyTitle": "\u0644\u0627 \u064a\u0648\u062c\u062f \u0645\u0648\u0631\u062f\u0648\u0646 \u0645\u0633\u062c\u0644\u0648\u0646 \u0628\u0639\u062f",`,
    String.raw`        "vendorRisk.emptyDesc": "\u0633\u062c\u0651\u0644 \u0645\u0648\u0631\u062f\u0643 \u0627\u0644\u062e\u0627\u0631\u062c\u064a \u0627\u0644\u0623\u0648\u0644 \u0644\u0628\u062f\u0621 \u0628\u0646\u0627\u0621 \u0633\u062c\u0644 \u0627\u0644\u0645\u062e\u0627\u0637\u0631 \u0644\u062f\u064a\u0643.",`,
    String.raw`        "vendorRisk.colName": "\u0627\u0644\u0645\u0648\u0631\u062f",`,
    String.raw`        "vendorRisk.colService": "\u0627\u0644\u062e\u062f\u0645\u0629",`,
    String.raw`        "vendorRisk.colRisk": "\u0645\u0633\u062a\u0648\u0649 \u0627\u0644\u0645\u062e\u0627\u0637\u0631",`,
    String.raw`        "vendorRisk.colCriticality": "\u062f\u0631\u062c\u0629 \u0627\u0644\u062d\u0631\u062c\u064a\u0629",`,
    String.raw`        "vendorRisk.colJurisdiction": "\u0627\u0644\u0648\u0644\u0627\u064a\u0627\u062a \u0627\u0644\u0642\u0636\u0627\u0626\u064a\u0629",`,
    String.raw`        "vendorRisk.colAdded": "\u062a\u0627\u0631\u064a\u062e \u0627\u0644\u0625\u0636\u0627\u0641\u0629",`,
    `        "vendorRisk.colActions": "",`,
  ].join("\n");
  content = content.replace(arAnchor, arAnchor + "\n" + arKeys);
  console.log("✓ AR vendorRisk keys inserted");
} else {
  console.log("⚠ AR anchor not found – already inserted or file changed?");
}

// ── ZH block ──────────────────────────────────────────────────────────────────
const zhAnchor = String.raw`"layout.menuVendorRisk": "\u4f9b\u5e94\u5546\u98ce\u9669\u4eea\u8868\u76d8",`;
const zhSection = getLocaleSection(content, "zh");

if (hasVendorRiskKeysInSection(zhSection)) {
  console.log("• ZH vendorRisk keys already present, skipping");
} else if (content.includes(zhAnchor)) {
  const zhKeys = [
    String.raw`        "vendorRisk.title": "\u4f9b\u5e94\u5546\u98ce\u9669\u4eea\u8868\u76d8",`,
    String.raw`        "vendorRisk.subtitle": "\u6240\u6709\u5df2\u6ce8\u518c\u7b2c\u4e09\u65b9\u4f9b\u5e94\u5546\u7684\u7efc\u5408\u98ce\u9669\u6001\u52bf\u3002",`,
    String.raw`        "vendorRisk.addVendor": "\u6ce8\u518c\u4f9b\u5e94\u5546",`,
    String.raw`        "vendorRisk.totalVendors": "\u4f9b\u5e94\u5546\u603b\u6570",`,
    String.raw`        "vendorRisk.filterBy": "\u7b5b\u9009:",`,
    String.raw`        "vendorRisk.filterAll": "\u5168\u90e8",`,
    String.raw`        "vendorRisk.filterJuris": "\u7ba1\u8f96\u533a\u57df:",`,
    String.raw`        "vendorRisk.loading": "\u6b63\u5728\u52a0\u8f7d\u4f9b\u5e94\u5546\u2026",`,
    String.raw`        "vendorRisk.emptyTitle": "\u6682\u65e0\u5df2\u6ce8\u518c\u4f9b\u5e94\u5546",`,
    String.raw`        "vendorRisk.emptyDesc": "\u6ce8\u518c\u60a8\u7684\u7b2c\u4e00\u4e2a\u7b2c\u4e09\u65b9\u4f9b\u5e94\u5546\uff0c\u5f00\u59cb\u6784\u5efa\u98ce\u9669\u6e05\u5355\u3002",`,
    String.raw`        "vendorRisk.colName": "\u4f9b\u5e94\u5546",`,
    String.raw`        "vendorRisk.colService": "\u670d\u52a1",`,
    String.raw`        "vendorRisk.colRisk": "\u98ce\u9669\u7b49\u7ea7",`,
    String.raw`        "vendorRisk.colCriticality": "\u4e34\u754c\u6027",`,
    String.raw`        "vendorRisk.colJurisdiction": "\u7ba1\u8f96\u533a\u57df",`,
    String.raw`        "vendorRisk.colAdded": "\u6dfb\u52a0\u65e5\u671f",`,
    `        "vendorRisk.colActions": "",`,
  ].join("\n");
  content = content.replace(zhAnchor, zhAnchor + "\n" + zhKeys);
  console.log("✓ ZH vendorRisk keys inserted");
} else {
  console.log("⚠ ZH anchor not found – already inserted or file changed?");
}

if (content !== originalContent) {
  writeFileSync(filePath, content, "utf-8");
  console.log("✓ LocaleContext.tsx written");
} else {
  console.log("• No changes detected, LocaleContext.tsx not modified");
}
