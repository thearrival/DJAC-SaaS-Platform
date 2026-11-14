/**
 * Shared Intl helpers — locale-aware date / number formatting.
 * Avoids bare toLocaleString() calls and keeps formatting consistent.
 */

/** BCP 47 tag per supported app locale. */
const TAGS: Record<string, string> = {
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

/** Maps DJAC app locales to BCP 47 locale tags. */
export function localeTag(locale: string): string {
  return TAGS[locale] ?? "en-US";
}

const DATE_FMT: Intl.DateTimeFormatOptions = { dateStyle: "medium" };
const DATETIME_FMT: Intl.DateTimeFormatOptions = {
  dateStyle: "medium",
  timeStyle: "short",
};

/**
 * Format a date-only string or Date value using the user's UI locale.
 * Falls back to "—" for nullish / invalid inputs.
 */
export function formatDate(
  value: Date | string | null | undefined,
  locale: string | undefined = undefined
): string {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return typeof value === "string" ? value : "—";
  return new Intl.DateTimeFormat(
    locale ? localeTag(locale) : undefined,
    DATE_FMT
  ).format(d);
}

/**
 * Format a datetime string or Date value using the user's UI locale.
 * Falls back to "—" for nullish / invalid inputs, and to the raw string for unparseable ones.
 */
export function formatDateTime(
  value: Date | string | null | undefined,
  locale: string | undefined = undefined,
  fallback = "—"
): string {
  if (!value) return fallback;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime()))
    return typeof value === "string" ? value : fallback;
  return new Intl.DateTimeFormat(
    locale ? localeTag(locale) : undefined,
    DATETIME_FMT
  ).format(d);
}

/**
 * Reads the user's selected UI locale from localStorage and returns its BCP 47
 * tag. Falls back to "en-US" when no locale is stored or localStorage is
 * unavailable. Useful inside module-level helper functions that don't receive
 * the locale as a parameter.
 */
export function storedLocaleTag(): string {
  if (typeof window === "undefined") return "en-US";
  try {
    const stored = window.localStorage.getItem("djac-locale") ?? "";
    return TAGS[stored] ?? "en-US";
  } catch {
    return "en-US";
  }
}

/** Reads the app locale code (en/ar/zh/...) from localStorage. */
export function storedLocale(): string {
  if (typeof window === "undefined") return "en";
  try {
    const stored = window.localStorage.getItem("djac-locale") ?? "";
    return TAGS[stored] ? stored : "en";
  } catch {
    return "en";
  }
}

/** Format a time using the user's UI locale. */
export function formatTime(
  value: Date | string | number | null | undefined,
  locale: string | undefined = undefined,
  options: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit" }
): string {
  if (value == null) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return typeof value === "string" ? value : "—";
  return new Intl.DateTimeFormat(
    locale ? localeTag(locale) : undefined,
    options
  ).format(d);
}

/** Format a number using the user's UI locale. */
export function formatNumber(
  value: number | null | undefined,
  locale: string | undefined = undefined,
  options?: Intl.NumberFormatOptions
): string {
  if (value == null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat(
    locale ? localeTag(locale) : undefined,
    options
  ).format(value);
}

/** Format a currency amount using the user's UI locale. */
export function formatCurrency(
  value: number | null | undefined,
  currency = "USD",
  locale: string | undefined = undefined,
  options?: Intl.NumberFormatOptions
): string {
  if (value == null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat(locale ? localeTag(locale) : undefined, {
    style: "currency",
    currency,
    ...options,
  }).format(value);
}
