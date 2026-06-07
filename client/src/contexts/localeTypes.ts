export type Locale = "en" | "ar" | "zh";

export type LocaleContextValue = {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    direction: "ltr" | "rtl";
    t: (key: string, fallback: string) => string;
};

export const STORAGE_KEY = "djac-locale";
