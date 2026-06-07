import { readFileSync, writeFileSync } from "fs";

const f = "client/src/contexts/LocaleContext.tsx";
let t = readFileSync(f, "utf8");

// AR translations for vendorRisk.*
const arKeys = [
    `        "vendorRisk.title": "\u0644\u0648\u062d\u0629 \u0645\u062e\u0627\u0637\u0631 \u0627\u0644\u0645\u0648\u0631\u062f\u064a\u0646",`,
    `        "vendorRisk.subtitle": "\u0627\u0644\u0648\u0636\u0639 \u0627\u0644\u0625\u062c\u0645\u0627\u0644\u064a \u0644\u0644\u0645\u062e\u0627\u0637\u0631 \u0639\u0628\u0631 \u062c\u0645\u064a\u0639 \u0627\u0644\u0645\u0648\u0631\u062f\u064a\u0646 \u0627\u0644\u062e\u0627\u0631\u062c\u064a\u064a\u0646 \u0627\u0644\u0645\u0633\u062c\u0644\u064a\u0646.",`,
    `        "vendorRisk.addVendor": "\u062a\u0633\u062c\u064a\u0644 \u0645\u0648\u0631\u062f",`,
    `        "vendorRisk.totalVendors": "\u0625\u062c\u0645\u0627\u0644\u064a \u0627\u0644\u0645\u0648\u0631\u062f\u064a\u0646",`,
    `        "vendorRisk.filterBy": "\u062a\u0635\u0641\u064a\u0629:",`,
    `        "vendorRisk.filterAll": "\u0627\u0644\u0643\u0644",`,
    `        "vendorRisk.filterJuris": "\u0627\u0644\u0646\u0637\u0627\u0642 \u0627\u0644\u0642\u0627\u0646\u0648\u0646\u064a:",`,
    `        "vendorRisk.loading": "\u062c\u0627\u0631\u064d \u062a\u062d\u0645\u064a\u0644 \u0627\u0644\u0645\u0648\u0631\u062f\u064a\u0646\u2026",`,
    `        "vendorRisk.emptyTitle": "\u0644\u0627 \u064a\u0648\u062c\u062f \u0645\u0648\u0631\u062f\u0648\u0646 \u0645\u0633\u062c\u0644\u0648\u0646 \u0628\u0639\u062f",`,
    `        "vendorRisk.emptyDesc": "\u0633\u062c\u0651\u0644 \u0623\u0648\u0644 \u0645\u0648\u0631\u062f \u062e\u0627\u0631\u062c\u064a \u0644\u0628\u062f\u0621 \u0628\u0646\u0627\u0621 \u0633\u062c\u0644 \u0627\u0644\u0645\u062e\u0627\u0637\u0631.",`,
    `        "vendorRisk.colName": "\u0627\u0644\u0645\u0648\u0631\u062f",`,
    `        "vendorRisk.colService": "\u0646\u0648\u0639 \u0627\u0644\u062e\u062f\u0645\u0629",`,
    `        "vendorRisk.colRisk": "\u062f\u0631\u062c\u0629 \u0627\u0644\u0645\u062e\u0627\u0637\u0631\u0629",`,
    `        "vendorRisk.colCriticality": "\u0627\u0644\u0623\u0647\u0645\u064a\u0629",`,
    `        "vendorRisk.colJurisdiction": "\u0627\u0644\u0646\u0637\u0627\u0642\u0627\u062a \u0627\u0644\u0642\u0627\u0646\u0648\u0646\u064a\u0629",`,
    `        "vendorRisk.colAdded": "\u062a\u0627\u0631\u064a\u062e \u0627\u0644\u0625\u0636\u0627\u0641\u0629",`,
    `        "vendorRisk.colActions": "",`,
].join("\n") + "\n";

// ZH translations for vendorRisk.*
const zhKeys = [
    `        "vendorRisk.title": "\u4f5b\u4f9b\u5546\u98ce\u9669\u4eea\u8868\u677f",`,
    `        "vendorRisk.subtitle": "\u6240\u6709\u5df2\u6ce8\u518c\u7b2c\u4e09\u65b9\u4f5b\u4f9b\u5546\u7684\u6574\u4f53\u98ce\u9669\u6001\u52bf\u3002",`,
    `        "vendorRisk.addVendor": "\u6ce8\u518c\u4f5b\u4f9b\u5546",`,
    `        "vendorRisk.totalVendors": "\u4f5b\u4f9b\u5546\u603b\u6570",`,
    `        "vendorRisk.filterBy": "\u7b5b\u9009\uff1a",`,
    `        "vendorRisk.filterAll": "\u5168\u90e8",`,
    `        "vendorRisk.filterJuris": "\u53f8\u6cd5\u7ba1\u8f96\uff1a",`,
    `        "vendorRisk.loading": "\u6b63\u5728\u52a0\u8f7d\u4f5b\u4f9b\u5546\u2026",`,
    `        "vendorRisk.emptyTitle": "\u6682\u65e0\u5df2\u6ce8\u518c\u4f5b\u4f9b\u5546",`,
    `        "vendorRisk.emptyDesc": "\u6ce8\u518c\u60a8\u7684\u7b2c\u4e00\u4e2a\u7b2c\u4e09\u65b9\u4f5b\u4f9b\u5546\uff0c\u5f00\u59cb\u5efa\u7acb\u98ce\u9669\u6e05\u5355\u3002",`,
    `        "vendorRisk.colName": "\u4f5b\u4f9b\u5546",`,
    `        "vendorRisk.colService": "\u670d\u52a1",`,
    `        "vendorRisk.colRisk": "\u98ce\u9669\u7b49\u7ea7",`,
    `        "vendorRisk.colCriticality": "\u91cd\u8981\u6027",`,
    `        "vendorRisk.colJurisdiction": "\u53f8\u6cd5\u7ba1\u8f96\u533a",`,
    `        "vendorRisk.colAdded": "\u6dfb\u52a0\u65f6\u95f4",`,
    `        "vendorRisk.colActions": "",`,
].join("\n") + "\n";

// Detect line endings
const crlf = t.includes('\r\n');
const NL = crlf ? '\r\n' : '\n';

// Find first key after `ar: {` and insert before it
const arAnchor = 'ar: {' + NL + '        "locale.label"';
const zhAnchor = 'zh: {' + NL + '        "locale.label"';

if (!t.includes(arAnchor)) throw new Error("AR anchor not found");
if (!t.includes(zhAnchor)) throw new Error("ZH anchor not found");

t = t.replace(arAnchor, 'ar: {' + NL + arKeys.replace(/\n/g, NL) + '        "locale.label"');
t = t.replace(zhAnchor, 'zh: {' + NL + zhKeys.replace(/\n/g, NL) + '        "locale.label"');

writeFileSync(f, t, "utf8");
console.log("done — vendorRisk AR/ZH keys inserted");
