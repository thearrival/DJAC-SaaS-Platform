import { describe, it, expect } from "vitest";
import {
  isCompanyProfileComplete,
  shouldRequireCompanyProfile,
  type CompanyProfileGateMode,
} from "../lib/companyProfile";

const base = {
  org: { name: "Acme Ltd", industry: null as string | null },
  gateMode: "all" as CompanyProfileGateMode,
  shouldOnboard: false,
  isAdmin: false,
  onCompanyProfilePage: false,
  loading: false,
  error: false,
};

describe("company-profile gate", () => {
  it("does not gate a complete profile", () => {
    expect(
      shouldRequireCompanyProfile({
        ...base,
        org: { name: "Acme Ltd", industry: "Technology" },
      })
    ).toBe(false);
  });

  it("gates an incomplete profile in 'all' mode", () => {
    expect(shouldRequireCompanyProfile(base)).toBe(true);
  });

  it("in 'new' mode only gates onboarding accounts (grandfathering)", () => {
    expect(
      shouldRequireCompanyProfile({
        ...base,
        gateMode: "new",
        shouldOnboard: true,
      })
    ).toBe(true);
    expect(
      shouldRequireCompanyProfile({
        ...base,
        gateMode: "new",
        shouldOnboard: false,
      })
    ).toBe(false);
  });

  it("fails open for admins, the profile page, and loading/error states", () => {
    expect(shouldRequireCompanyProfile({ ...base, isAdmin: true })).toBe(false);
    expect(
      shouldRequireCompanyProfile({ ...base, onCompanyProfilePage: true })
    ).toBe(false);
    expect(shouldRequireCompanyProfile({ ...base, loading: true })).toBe(false);
    expect(shouldRequireCompanyProfile({ ...base, error: true })).toBe(false);
  });

  it("fails open when the org is unknown", () => {
    expect(shouldRequireCompanyProfile({ ...base, org: null })).toBe(false);
  });

  it("validates name and industry with trimming", () => {
    expect(isCompanyProfileComplete({ name: "A", industry: "Tech" })).toBe(
      false
    );
    expect(
      isCompanyProfileComplete({ name: "  Acme  ", industry: "   " })
    ).toBe(false);
    expect(
      isCompanyProfileComplete({ name: "  Acme  ", industry: "  Tech " })
    ).toBe(true);
    expect(isCompanyProfileComplete(null)).toBe(true);
  });
});
