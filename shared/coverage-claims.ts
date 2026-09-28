/**
 * Coverage claims — the single source of truth for the numbers DJAC publishes.
 *
 * Why this module exists
 * ----------------------
 * The platform states its coverage in marketing copy, the docs portal, the
 * product tour, the signup page, an OG image, an onboarding recommendation, and
 * 9 sets of localized strings. Those numbers were hardcoded independently, so
 * they drifted apart and away from the data: the copy claimed "28
 * jurisdictions" and "46 frameworks across 28 jurisdictions" while the registry
 * actually contains 30 jurisdictions (and 34 strings, because four of them are
 * supranational groupings rather than countries) and 107 framework packs.
 *
 * One fact, defined once
 * ----------------------
 * A *jurisdiction* is a country or territory with its own legal authority.
 * Supranational bodies and cross-border groupings (EU, African Union,
 * North America, "Global") are coverage *scopes*, not jurisdictions, and are
 * counted separately. Server counts come from the framework packs; the values
 * here are pinned to match and are enforced by
 * `server/__tests__/unit/coverage-claims.test.ts`, which recomputes them from
 * the data. If the corpus changes, CI fails here rather than the product
 * quietly publishing a wrong number.
 *
 * For localized copy, use the `{{jurisdictions}}` / `{{frameworkPacks}}`
 * placeholders — LocaleContext substitutes them at render time, so all 9
 * locales stay in lockstep with the data and can never disagree with each
 * other again.
 */

export const COVERAGE = {
  /** Countries/territories with at least one framework pack. */
  jurisdictions: 30,
  /** Cross-border/supranational scopes, reported separately. */
  supranationalScopes: 4,
  /** Framework packs with curated, profile-aware detail. */
  frameworkPacks: 107,
  /** Frameworks with control-level detail (assessment engine coverage). */
  controlFrameworks: 46,
} as const;

/**
 * Placeholders for localized copy.
 *
 * Substituted by LocaleContext's `t()` so a single interpolation keeps every
 * locale consistent with COVERAGE.
 */
export const COVERAGE_TOKENS: Record<string, string> = {
  jurisdictions: String(COVERAGE.jurisdictions),
  supranationalScopes: String(COVERAGE.supranationalScopes),
  frameworkPacks: String(COVERAGE.frameworkPacks),
  controlFrameworks: String(COVERAGE.controlFrameworks),
};

/** Replace `{{token}}` placeholders with the current derived values. */
export function interpolateCoverage(text: string): string {
  return text.replace(/\{\{(\w+)\}\}/g, (match, token: string) => {
    const value = COVERAGE_TOKENS[token];
    return value === undefined ? match : value;
  });
}

/** "30 jurisdictions" — the canonical short form. */
export function jurisdictionsClaim(): string {
  return `${COVERAGE.jurisdictions} jurisdictions`;
}

/** "107 framework packs across 30 jurisdictions". */
export function frameworkCoverageClaim(): string {
  return `${COVERAGE.frameworkPacks} framework packs across ${jurisdictionsClaim()}`;
}
