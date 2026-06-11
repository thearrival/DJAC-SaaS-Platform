import { describe, it, expect } from "vitest";
import {
  hasMinRole,
  hasMinOrgRole,
  ROLE_LEVEL,
  ORG_ROLE_LEVEL,
  PLATFORM_ROLES,
  ORG_ROLES,
  MODULE_SLUGS,
  ACCOUNT_INTENTS,
  ONBOARDING_STAGES,
  DEFAULT_ORG_ROLE_PERMISSIONS,
} from "../../../shared/const";

describe("shared/const - Platform Roles", () => {
  it("should define roles in ascending privilege order", () => {
    expect(ROLE_LEVEL.basic_user).toBeLessThan(ROLE_LEVEL.professional_user);
    expect(ROLE_LEVEL.professional_user).toBeLessThan(ROLE_LEVEL.company_admin);
    expect(ROLE_LEVEL.company_admin).toBeLessThan(ROLE_LEVEL.platform_admin);
    expect(ROLE_LEVEL.platform_admin).toBeLessThan(ROLE_LEVEL.super_admin);
  });

  it("should include legacy aliases at correct levels", () => {
    expect(ROLE_LEVEL.user).toBe(ROLE_LEVEL.basic_user);
    expect(ROLE_LEVEL.admin).toBe(ROLE_LEVEL.platform_admin);
  });

  it("hasMinRole should enforce minimum privilege levels", () => {
    expect(hasMinRole("super_admin", "basic_user")).toBe(true);
    expect(hasMinRole("super_admin", "super_admin")).toBe(true);
    expect(hasMinRole("basic_user", "super_admin")).toBe(false);
    expect(hasMinRole("platform_admin", "company_admin")).toBe(true);
    expect(hasMinRole("company_admin", "platform_admin")).toBe(false);
  });

  it("hasMinRole should handle null/undefined actor roles gracefully", () => {
    expect(hasMinRole(null, "basic_user")).toBe(false);
    expect(hasMinRole(undefined, "basic_user")).toBe(false);
    expect(hasMinRole("", "basic_user")).toBe(false);
  });

  it("should include all expected platform roles", () => {
    expect(PLATFORM_ROLES).toContain("basic_user");
    expect(PLATFORM_ROLES).toContain("professional_user");
    expect(PLATFORM_ROLES).toContain("company_admin");
    expect(PLATFORM_ROLES).toContain("platform_admin");
    expect(PLATFORM_ROLES).toContain("yalla_hack_employee");
    expect(PLATFORM_ROLES).toContain("super_admin");
  });
});

describe("shared/const - Organisation Roles", () => {
  it("should define org roles in ascending privilege order", () => {
    expect(ORG_ROLE_LEVEL.analyst).toBeLessThan(ORG_ROLE_LEVEL.compliance_officer);
    expect(ORG_ROLE_LEVEL.compliance_officer).toBeLessThan(ORG_ROLE_LEVEL.admin);
    expect(ORG_ROLE_LEVEL.admin).toBeLessThan(ORG_ROLE_LEVEL.owner);
  });

  it("hasMinOrgRole should enforce minimum privilege levels", () => {
    expect(hasMinOrgRole("owner", "analyst")).toBe(true);
    expect(hasMinOrgRole("owner", "owner")).toBe(true);
    expect(hasMinOrgRole("analyst", "admin")).toBe(false);
    expect(hasMinOrgRole("admin", "owner")).toBe(false);
    expect(hasMinOrgRole("compliance_officer", "analyst")).toBe(true);
  });

  it("hasMinOrgRole should handle null/undefined actor roles gracefully", () => {
    expect(hasMinOrgRole(null, "analyst")).toBe(false);
    expect(hasMinOrgRole(undefined, "analyst")).toBe(false);
  });

  it("should include all expected org roles", () => {
    expect(ORG_ROLES).toContain("analyst");
    expect(ORG_ROLES).toContain("compliance_officer");
    expect(ORG_ROLES).toContain("admin");
    expect(ORG_ROLES).toContain("owner");
  });
});

describe("shared/const - Module Slugs", () => {
  it("should define all expected compliance modules", () => {
    expect(MODULE_SLUGS).toContain("asset_inventory");
    expect(MODULE_SLUGS).toContain("vendor_assessment");
    expect(MODULE_SLUGS).toContain("gap_tracker");
    expect(MODULE_SLUGS).toContain("remediation_planner");
    expect(MODULE_SLUGS).toContain("risk_register");
    expect(MODULE_SLUGS).toContain("policy_manager");
    expect(MODULE_SLUGS).toContain("incident_register");
    expect(MODULE_SLUGS).toContain("audit_schedule");
    expect(MODULE_SLUGS).toContain("billing");
    expect(MODULE_SLUGS).toContain("admin_control_center");
    expect(MODULE_SLUGS).toContain("saas_metrics");
  });

  it("should have no duplicate slugs", () => {
    const unique = new Set(MODULE_SLUGS);
    expect(unique.size).toBe(MODULE_SLUGS.length);
  });
});

describe("shared/const - Account Intents & Onboarding", () => {
  it("should define all expected account intents", () => {
    expect(ACCOUNT_INTENTS).toContain("compliance_professional");
    expect(ACCOUNT_INTENTS).toContain("legal_advisor");
    expect(ACCOUNT_INTENTS).toContain("enterprise_admin");
    expect(ACCOUNT_INTENTS).toContain("consultant");
    expect(ACCOUNT_INTENTS).toContain("vendor");
    expect(ACCOUNT_INTENTS).toContain("government");
    expect(ACCOUNT_INTENTS).toContain("researcher");
  });

  it("should define all expected onboarding stages", () => {
    expect(ONBOARDING_STAGES).toContain("not_started");
    expect(ONBOARDING_STAGES).toContain("account_type_selected");
    expect(ONBOARDING_STAGES).toContain("org_created");
    expect(ONBOARDING_STAGES).toContain("org_joined");
    expect(ONBOARDING_STAGES).toContain("jurisdiction_set");
    expect(ONBOARDING_STAGES).toContain("completed");
  });
});

describe("shared/const - RBAC Permission Matrix", () => {
  it("should define permissions for all org roles", () => {
    const roles = Object.keys(DEFAULT_ORG_ROLE_PERMISSIONS);
    expect(roles).toEqual(expect.arrayContaining(["analyst", "compliance_officer", "admin", "owner"]));
  });

  it("analyst should have VIEW_ONLY on most modules", () => {
    const analystPerms = DEFAULT_ORG_ROLE_PERMISSIONS.analyst;
    expect(analystPerms.asset_inventory).toEqual({ canView: true, canCreate: false, canEdit: false, canDelete: false, canExport: false, canInvite: false });
    expect(analystPerms.vendor_assessment).toEqual({ canView: true, canCreate: false, canEdit: false, canDelete: false, canExport: false, canInvite: false });
    expect(analystPerms.gap_tracker).toEqual({ canView: true, canCreate: false, canEdit: false, canDelete: false, canExport: false, canInvite: false });
  });

  it("analyst should have STANDARD access on service_requests", () => {
    expect(DEFAULT_ORG_ROLE_PERMISSIONS.analyst.service_requests).toEqual({ canView: true, canCreate: true, canEdit: true, canDelete: false, canExport: true, canInvite: false });
  });

  it("compliance_officer should have STANDARD access on most modules", () => {
    const coPerms = DEFAULT_ORG_ROLE_PERMISSIONS.compliance_officer;
    expect(coPerms.asset_inventory).toEqual({ canView: true, canCreate: true, canEdit: true, canDelete: false, canExport: true, canInvite: false });
    expect(coPerms.remediation_planner).toEqual({ canView: true, canCreate: true, canEdit: true, canDelete: false, canExport: true, canInvite: false });
  });

  it("compliance_officer should have VIEW_ONLY on law_library and framework_analysis", () => {
    expect(DEFAULT_ORG_ROLE_PERMISSIONS.compliance_officer.law_library).toEqual({ canView: true, canCreate: false, canEdit: false, canDelete: false, canExport: false, canInvite: false });
    expect(DEFAULT_ORG_ROLE_PERMISSIONS.compliance_officer.framework_analysis).toEqual({ canView: true, canCreate: false, canEdit: false, canDelete: false, canExport: false, canInvite: false });
  });

  it("admin should have FULL access on most modules", () => {
    const adminPerms = DEFAULT_ORG_ROLE_PERMISSIONS.admin;
    expect(adminPerms.asset_inventory).toEqual({ canView: true, canCreate: true, canEdit: true, canDelete: true, canExport: true, canInvite: true });
    expect(adminPerms.vendor_assessment).toEqual({ canView: true, canCreate: true, canEdit: true, canDelete: true, canExport: true, canInvite: true });
    expect(adminPerms.gap_tracker).toEqual({ canView: true, canCreate: true, canEdit: true, canDelete: true, canExport: true, canInvite: true });
  });

  it("admin should have restricted access on sensitive modules", () => {
    const adminPerms = DEFAULT_ORG_ROLE_PERMISSIONS.admin;
    expect(adminPerms.api_keys).toEqual({ canView: true, canCreate: true, canEdit: true, canDelete: false, canExport: true, canInvite: false });
    expect(adminPerms.team_members).toEqual({ canView: true, canCreate: true, canEdit: true, canDelete: false, canExport: true, canInvite: false });
    expect(adminPerms.org_settings).toEqual({ canView: true, canCreate: true, canEdit: true, canDelete: false, canExport: true, canInvite: false });
    expect(adminPerms.audit_log).toEqual({ canView: true, canCreate: false, canEdit: false, canDelete: false, canExport: false, canInvite: false });
    expect(adminPerms.billing).toEqual({ canView: true, canCreate: false, canEdit: false, canDelete: false, canExport: false, canInvite: false });
  });

  it("owner should have FULL access on ALL modules including sensitive ones", () => {
    const ownerPerms = DEFAULT_ORG_ROLE_PERMISSIONS.owner;
    expect(ownerPerms.api_keys).toEqual({ canView: true, canCreate: true, canEdit: true, canDelete: true, canExport: true, canInvite: true });
    expect(ownerPerms.team_members).toEqual({ canView: true, canCreate: true, canEdit: true, canDelete: true, canExport: true, canInvite: true });
    expect(ownerPerms.org_settings).toEqual({ canView: true, canCreate: true, canEdit: true, canDelete: true, canExport: true, canInvite: true });
    expect(ownerPerms.audit_log).toEqual({ canView: true, canCreate: true, canEdit: true, canDelete: true, canExport: true, canInvite: true });
    expect(ownerPerms.billing).toEqual({ canView: true, canCreate: true, canEdit: true, canDelete: true, canExport: true, canInvite: true });
    expect(ownerPerms.law_library).toEqual({ canView: true, canCreate: true, canEdit: true, canDelete: true, canExport: true, canInvite: true });
    expect(ownerPerms.framework_analysis).toEqual({ canView: true, canCreate: true, canEdit: true, canDelete: true, canExport: true, canInvite: true });
  });
});
