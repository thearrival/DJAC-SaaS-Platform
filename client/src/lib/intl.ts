/**
 * Shared Intl helpers — locale-aware date / number formatting.
 * Avoids bare toLocaleString() calls and keeps formatting consistent.
 */

/** Maps DJAC app locales to BCP 47 locale tags. */
export function localeTag(locale: string): string {
    if (locale === "ar") return "ar-SA";
    if (locale === "zh") return "zh-CN";
    return "en-US";
}

const DATE_FMT: Intl.DateTimeFormatOptions = { dateStyle: "medium" };
const DATETIME_FMT: Intl.DateTimeFormatOptions = { dateStyle: "medium", timeStyle: "short" };

/**
 * Format a date-only string or Date value using the user's UI locale.
 * Falls back to "—" for nullish / invalid inputs.
 */
export function formatDate(
    value: Date | string | null | undefined,
    locale: string | undefined = undefined,
): string {
    if (!value) return "—";
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return typeof value === "string" ? value : "—";
    return new Intl.DateTimeFormat(locale ? localeTag(locale) : undefined, DATE_FMT).format(d);
}

/**
 * Format a datetime string or Date value using the user's UI locale.
 * Falls back to "—" for nullish / invalid inputs, and to the raw string for unparseable ones.
 */
export function formatDateTime(
    value: Date | string | null | undefined,
    locale: string | undefined = undefined,
    fallback = "—",
): string {
    if (!value) return fallback;
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return typeof value === "string" ? value : fallback;
    return new Intl.DateTimeFormat(locale ? localeTag(locale) : undefined, DATETIME_FMT).format(d);
}
