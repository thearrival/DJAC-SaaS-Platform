const fs = require("fs");
const content = fs.readFileSync(
  "D:\\Github\\DJAC-SaaS\\client\\src\\contexts\\LocaleContext.tsx",
  "utf8"
);

// Find all locale blocks
const localeBlocks = {};
const matches = content.match(/([a-z]{2}):\s*\{([^}]+)\}/g) || [];

for (const match of matches) {
  const regex = /([a-z]{2}):\s*\{([^}]+)\}/;
  const m = match.match(regex);
  if (m) {
    const localeCode = m[1];
    const blockContent = m[2];
    // Extract keys from this block
    const keys = blockContent.match(/"([^"]+)":/g) || [];
    localeBlocks[localeCode] = new Set(
      keys.map(k => k.replace('"', "").replace('"', ""))
    );
  }
}

// Get English keys as reference
const enKeys = localeBlocks["en"] || new Set();
console.log("English keys count:", enKeys.size);

// Check each locale for missing keys
const locales = ["en", "ar", "zh", "fr", "es", "de", "ja", "ko", "pt"];
for (const locale of locales) {
  const keys = localeBlocks[locale] || new Set();
  const missing = [...enKeys].filter(k => !keys.has(k));
  const extra = [...keys].filter(k => !enKeys.has(k));
  console.log(
    `${locale}: ${keys.size} keys, missing: ${missing.length}, extra: ${extra.length}`
  );
  if (missing.length > 0) {
    console.log(`  Missing keys (first 5): ${missing.slice(0, 5).join(", ")}`);
  }
  if (extra.length > 0) {
    console.log(`  Extra keys (first 5): ${extra.slice(0, 5).join(", ")}`);
  }
}

// Print all keys that exist in English but are missing in any other locale
console.log("\nAll missing translations:");
for (const key of enKeys) {
  let missingIn = [];
  for (const locale of locales) {
    const keys = localeBlocks[locale] || new Set();
    if (!keys.has(key)) {
      missingIn.push(locale);
    }
  }
  if (missingIn.length > 0 && missingIn.length < 9) {
    console.log(`  ${key}: missing in ${missingIn.join(", ")}`);
  }
}
