/**
 * Jurisdiction scoping helpers (pure).
 *
 * The dashboard narrows frameworks and the conflict matrix to the jurisdiction
 * a user selects, so no one is shown every market at once. Kept pure and
 * separate from the component so the behaviour is unit-tested.
 */

export type ScopableFramework = { code: string; country?: string | null };
export type ScopableMatrixRow = { source: string; target: string };

export const ALL_JURISDICTIONS = "all";

/** Distinct, sorted country names present in the framework list. */
export function jurisdictionOptionsFor(
  frameworks: readonly ScopableFramework[]
): string[] {
  const set = new Set<string>();
  for (const f of frameworks) if (f.country) set.add(f.country);
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

/** Frameworks for the selected jurisdiction (or all when the filter is "all"). */
export function filterByJurisdiction<T extends ScopableFramework>(
  frameworks: readonly T[],
  filter: string
): T[] {
  if (filter === ALL_JURISDICTIONS) return [...frameworks];
  return frameworks.filter(f => f.country === filter);
}

/** Matrix rows that touch at least one of the given framework codes. */
export function filterMatrixByCodes<R extends ScopableMatrixRow>(
  rows: readonly R[],
  codes: ReadonlySet<string>
): R[] {
  return rows.filter(r => codes.has(r.source) || codes.has(r.target));
}
