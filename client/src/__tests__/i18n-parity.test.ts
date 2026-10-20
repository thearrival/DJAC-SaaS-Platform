import { describe, it, expect } from "vitest";
import en from "../locales/en";
import ar from "../locales/ar";
import zh from "../locales/zh";
import fr from "../locales/fr";
import es from "../locales/es";
import de from "../locales/de";
import ja from "../locales/ja";
import ko from "../locales/ko";
import pt from "../locales/pt";
import { LOCALE_EXTRAS } from "../contexts/localeExtras";
import { LOCALE_EXTRAS_2 } from "../contexts/localeExtras2";
import { LOCALE_NAV } from "../contexts/localeNav";

type Catalog = Record<string, string>;

const catalogs: Record<string, Catalog> = {
  en,
  ar,
  zh,
  fr,
  es,
  de,
  ja,
  ko,
  pt,
};

const extras: Record<string, Catalog>[] = [
  LOCALE_EXTRAS as Record<string, Catalog>,
  LOCALE_EXTRAS_2 as Record<string, Catalog>,
  LOCALE_NAV as Record<string, Catalog>,
];

function keysFor(locale: string): Set<string> {
  const keys = new Set(Object.keys(catalogs[locale] ?? {}));
  for (const group of extras) {
    for (const key of Object.keys(group[locale] ?? {})) keys.add(key);
  }
  return keys;
}

describe("i18n parity", () => {
  it("every locale covers all English keys (catalogs + extras)", () => {
    const enKeys = keysFor("en");
    for (const locale of Object.keys(catalogs)) {
      const keys = keysFor(locale);
      const missing = [...enKeys].filter(k => !keys.has(k));
      expect(
        missing,
        `${locale} is missing ${missing.length} key(s): ${missing
          .slice(0, 10)
          .join(", ")}`
      ).toEqual([]);
    }
  });
});
