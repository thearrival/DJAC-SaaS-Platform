export const APP_LOCALES = [
  "en",
  "ar",
  "zh",
  "fr",
  "es",
  "de",
  "ja",
  "ko",
  "pt",
] as const;

export type AppLocale = (typeof APP_LOCALES)[number];

/** All supported platform locales. */
export type Locale = AppLocale;

/** Legacy content-complete packs (kept for components with per-locale data). */

export type ExtendedLocale = AppLocale;

/** BCP 47 tags for Intl formatting per supported locale. */
export const LOCALE_TAGS: Record<AppLocale, string> = {
  en: "en-US",
  ar: "ar-SA",
  zh: "zh-CN",
  fr: "fr-FR",
  es: "es-ES",
  de: "de-DE",
  ja: "ja-JP",
  ko: "ko-KR",
  pt: "pt-BR",
};

/** Human-readable labels (native names) for each supported locale. */
export const LOCALE_LABELS: Record<AppLocale, string> = {
  en: "English",
  ar: "العربية",
  zh: "中文",
  fr: "Français",
  es: "Español",
  de: "Deutsch",
  ja: "日本語",
  ko: "한국어",
  pt: "Português",
};

export function isAppLocale(value: unknown): value is AppLocale {
  return (
    typeof value === "string" &&
    (APP_LOCALES as readonly string[]).includes(value)
  );
}

export type LocaleContextValue = {
  locale: ExtendedLocale;
  setLocale: (locale: ExtendedLocale) => void;
  direction: "ltr" | "rtl";
  t: (key: string, fallback: string) => string;
};

export const STORAGE_KEY = "djac-locale";
