/**
 * Company-profile gate logic.
 *
 * "all" requires every account to supply company details before data renders.
 * "new" requires only accounts still in the new-user window (grandfathering).
 */

export type CompanyProfileGateMode = "all" | "new";

export type CompanyProfileOrg = {
  name?: string | null;
  industry?: string | null;
};

/** A profile is complete once it has a name (2+ chars) and an industry. */
export function isCompanyProfileComplete(
  org: CompanyProfileOrg | null | undefined
): boolean {
  if (!org) return true; // unknown/loading — fail open
  const name = (org.name ?? "").trim();
  const industry = (org.industry ?? "").trim();
  return name.length >= 2 && industry.length > 0;
}

export type CompanyProfileGateInput = {
  org: CompanyProfileOrg | null | undefined;
  gateMode: CompanyProfileGateMode;
  shouldOnboard: boolean;
  isAdmin: boolean;
  onCompanyProfilePage: boolean;
  loading: boolean;
  error: boolean;
};

/** Whether the current request should be redirected to the company profile. */
export function shouldRequireCompanyProfile(
  input: CompanyProfileGateInput
): boolean {
  if (input.isAdmin) return false;
  if (input.loading || input.error) return false; // never block on outage/loading
  if (input.onCompanyProfilePage) return false;
  if (!input.org) return false;
  if (isCompanyProfileComplete(input.org)) return false;
  return (
    input.gateMode === "all" ||
    (input.gateMode === "new" && input.shouldOnboard)
  );
}
