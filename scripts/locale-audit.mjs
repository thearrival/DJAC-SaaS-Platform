import fs from "node:fs";

const source = fs.readFileSync("client/src/contexts/LocaleContext.tsx", "utf8");
const keyMap = {
    en: new Set(),
    ar: new Set(),
    zh: new Set(),
};

let currentLocale = null;
for (const line of source.split(/\r?\n/)) {
    const localeMatch = line.match(/^\s{4}(en|ar|zh):\s\{$/);
    if (localeMatch) {
        currentLocale = localeMatch[1];
        continue;
    }

    if (currentLocale && /^\s{4}\},\s*$/.test(line)) {
        currentLocale = null;
        continue;
    }
f
    if (!currentLocale) {
        continue;
    }

    const keyMatch = line.match(/^\s{8}"([^"]+)"\s*:/);
    if (keyMatch) {
        keyMap[currentLocale].add(keyMatch[1]);
    }
}

const usedKeys = new Set();
const usedRegex = /\bt\(\s*"([^"]+)"/g;

function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const full = `${dir}/${entry.name}`;
        if (entry.isDirectory()) {
            walk(full);
            continue;
        }
        if (!entry.isFile()) {
            continue;
        }
        if (!full.endsWith(".ts") && !full.endsWith(".tsx")) {
            continue;
        }

        const content = fs.readFileSync(full, "utf8");
        let match = usedRegex.exec(content);
        while (match) {
            usedKeys.add(match[1]);
            match = usedRegex.exec(content);
        }
        usedRegex.lastIndex = 0;
    }
}

walk("client/src");

for (const locale of ["en", "ar", "zh"]) {
    const missing = [...usedKeys].filter((key) => !keyMap[locale].has(key)).sort();
    console.log(`Missing in ${locale}: ${missing.length}`);
    for (const key of missing) {
        console.log(key);
    }
    console.log("");
}

console.log(`Total used keys: ${usedKeys.size}`);
