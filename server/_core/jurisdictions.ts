/**
 * Global jurisdiction constants — single source of truth for the expanded
 * international jurisdiction list across routers, stores, and DB enums.
 */

export const NEW_GLOBAL_JURISDICTIONS = [
  "United Kingdom",
  "Canada",
  "Australia",
  "Japan",
  "South Korea",
  "Singapore",
  "India",
  "South Africa",
  "Mexico",
  "Thailand",
  "Indonesia",
  "Malaysia",
  "Philippines",
  "Vietnam",
  "Nigeria",
  "Kenya",
  "United Arab Emirates",
  "Qatar",
  "Kuwait",
  "Bahrain",
  "Oman",
  "Jordan",
  "Egypt",
] as const;

export const GLOBAL_JURISDICTIONS = [
  "China",
  "Saudi Arabia",
  "EU",
  "US",
  "Brazil",
  "Global",
  "Both",
  "Other",
  ...NEW_GLOBAL_JURISDICTIONS,
] as const;

export const REPORT_JURISDICTIONS = [
  "Saudi Arabia",
  "China",
  "EU",
  "US",
  "Brazil",
  "Global",
  "both",
  ...NEW_GLOBAL_JURISDICTIONS,
] as const;

export const TIMETABLE_JURISDICTIONS = [
  "Saudi Arabia",
  "China",
  "EU",
  "US",
  "Brazil",
  ...NEW_GLOBAL_JURISDICTIONS,
] as const;

/** Jurisdictions valid for regulatory deadlines (DB deadlineJurisdiction enum — no "Other"). */
export const DEADLINE_JURISDICTIONS = [
  "China",
  "Saudi Arabia",
  "EU",
  "US",
  "Brazil",
  "Global",
  "Both",
  ...NEW_GLOBAL_JURISDICTIONS,
] as const;
