import { useEffect, useMemo, useState } from "react";
import { LocaleContext } from "./localeStore";
import {
  STORAGE_KEY,
  type ExtendedLocale,
  type LocaleContextValue,
} from "./localeTypes";
import { LOCALE_SUPPLEMENT } from "./localeSupplement";
import { ONBOARDING_STRINGS } from "./onboardingStrings";
import { interpolateCoverage } from "../../../shared/coverage-claims";

import enMessages from "../locales/en";
import { preloadedCatalog } from "./localeBoot";

type MessageCatalog = Record<string, string>;

// English is bundled so the app always renders immediately; other catalogs are
// fetched on demand and cached.
const catalogs: Partial<Record<string, MessageCatalog>> = { en: enMessages };

export async function loadLocaleCatalog(
  locale: string
): Promise<MessageCatalog> {
  if (catalogs[locale]) return catalogs[locale]!;
  const mod = await import(`../locales/${locale}.ts`);
  const catalog = ((mod.default ?? mod) as MessageCatalog) ?? {};
  catalogs[locale] = catalog;
  return catalog;
}

function getDefaultLocale(): ExtendedLocale {
  if (typeof window === "undefined") return "en";
  const stored = window.localStorage.getItem(STORAGE_KEY) ?? "";
  const valid = ["en", "ar", "zh", "fr", "es", "de", "ja", "ko", "pt"];
  if (valid.includes(stored)) return stored as ExtendedLocale;
  return "en";
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<ExtendedLocale>(getDefaultLocale);
  const [catalog, setCatalog] = useState<MessageCatalog>(
    () => preloadedCatalog ?? enMessages
  );

  const direction: "ltr" | "rtl" = locale === "ar" ? "rtl" : "ltr";

  // Load the active locale's catalog (English is already bundled).
  useEffect(() => {
    let cancelled = false;
    loadLocaleCatalog(locale)
      .then(c => {
        if (!cancelled) setCatalog(c);
      })
      .catch(() => {
        if (!cancelled) setCatalog(enMessages);
      });
    return () => {
      cancelled = true;
    };
  }, [locale]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, locale);
    const langMap: Record<string, string> = {
      zh: "zh-CN",
      ja: "ja-JP",
      ko: "ko-KR",
    };
    document.documentElement.lang = langMap[locale] || locale;
    document.documentElement.dir = direction;
  }, [locale, direction]);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale: setLocaleState,
      direction,
      // Coverage figures ({{jurisdictions}}, {{frameworkPacks}}, …) are
      // substituted here from shared/coverage-claims so all 9 locales publish
      // the same numbers as the data, instead of hardcoding digits that drift.
      t: (key: string, fallback: string) =>
        interpolateCoverage(
          catalog[key] ||
            ONBOARDING_STRINGS[locale]?.[key] ||
            LOCALE_SUPPLEMENT[locale]?.[key] ||
            fallback
        ),
    }),
    [locale, direction, catalog]
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}
