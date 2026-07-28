export type Locale = "en" | "ar" | "zh";

export type ExtendedLocale = Locale | "fr" | "es" | "de" | "ja" | "ko" | "pt";

export type LocaleContextValue = {
  locale: ExtendedLocale;
  setLocale: (locale: ExtendedLocale) => void;
  direction: "ltr" | "rtl";
  t: (key: string, fallback: string) => string;
};

export const STORAGE_KEY = "djac-locale";
