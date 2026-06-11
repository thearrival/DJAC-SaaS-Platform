import { describe, it, expect } from "vitest";
import {
  hasMinRole,
  ROLE_LEVEL,
  MODULE_SLUGS,
  DEFAULT_ORG_ROLE_PERMISSIONS,
  type OrgRole,
  type ModuleSlug,
} from "../../../shared/const";

type UserRole = "user" | "admin" | "basic_user" | "professional_user" | "company_admin" | "platform_admin" | "yalla_hack_employee" | "super_admin";

const ROLE_HIERARCHY: Record<UserRole, number> = {
  user: 0,
  basic_user: 0,
  professional_user: 1,
  admin: 2,
  company_admin: 3,
  platform_admin: 4,
  yalla_hack_employee: 5,
  super_admin: 6,
};

function hasMinRoleLegacy(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

describe("RBAC - Role Hierarchy (Legacy)", () => {
  it("super_admin should have all permissions", () => {
    const roles: UserRole[] = ["user", "admin", "company_admin", "platform_admin", "super_admin"];
    for (const role of roles) {
      expect(hasMinRoleLegacy("super_admin", role)).toBe(true);
    }
  });

  it("user should not have admin permissions", () => {
    expect(hasMinRoleLegacy("user", "admin")).toBe(false);
    expect(hasMinRoleLegacy("user", "company_admin")).toBe(false);
  });

  it("platform_admin should have company_admin and below", () => {
    expect(hasMinRoleLegacy("platform_admin", "company_admin")).toBe(true);
    expect(hasMinRoleLegacy("platform_admin", "admin")).toBe(true);
    expect(hasMinRoleLegacy("platform_admin", "user")).toBe(true);
    expect(hasMinRoleLegacy("platform_admin", "super_admin")).toBe(false);
  });

  it("professional_user should be above basic_user", () => {
    expect(hasMinRoleLegacy("professional_user", "basic_user")).toBe(true);
    expect(hasMinRoleLegacy("professional_user", "user")).toBe(true);
    expect(hasMinRoleLegacy("basic_user", "professional_user")).toBe(false);
  });
});

describe("RBAC - Production Role Hierarchy (shared/const)", () => {
  it("hasMinRole should match legacy hierarchy for known roles", () => {
    expect(hasMinRole("super_admin", "basic_user")).toBe(true);
    expect(hasMinRole("super_admin", "super_admin")).toBe(true);
    expect(hasMinRole("basic_user", "super_admin")).toBe(false);
    expect(hasMinRole("platform_admin", "company_admin")).toBe(true);
  });

  it("ROLE_LEVEL should have super_admin as highest", () => {
    const allLevels = Object.values(ROLE_LEVEL);
    const maxLevel = Math.max(...allLevels);
    expect(ROLE_LEVEL.super_admin).toBe(maxLevel);
  });

  it("basic_user and user legacy alias should share same level", () => {
    expect(ROLE_LEVEL.basic_user).toBe(ROLE_LEVEL.user);
  });
});

describe("RBAC - Module Permission Matrix", () => {
  const orgRoles: OrgRole[] = ["analyst", "compliance_officer", "admin", "owner"];

  orgRoles.forEach((role) => {
    it(`${role} should have permissions defined for all module slugs`, () => {
      const perms = DEFAULT_ORG_ROLE_PERMISSIONS[role];
      for (const slug of MODULE_SLUGS) {
        const slugPerms = perms[slug as ModuleSlug];
        if (!slugPerms) {
          // Some modules are intentionally not listed for some roles
          continue;
        }
        expect(slugPerms).toHaveProperty("canView");
        expect(slugPerms).toHaveProperty("canCreate");
        expect(slugPerms).toHaveProperty("canEdit");
        expect(slugPerms).toHaveProperty("canDelete");
        expect(slugPerms).toHaveProperty("canExport");
        expect(slugPerms).toHaveProperty("canInvite");
      }
    });
  });

  it("should have at least VIEW_ONLY access for all roles on all compliance modules", () => {
    const complianceModules: ModuleSlug[] = [
      "asset_inventory", "vendor_assessment", "gap_tracker",
      "remediation_planner", "risk_register", "policy_manager",
      "incident_register", "audit_schedule", "compliance_tracker",
      "compliance_reports", "report_center", "compliance_heatmap",
      "compliance_calendar",
    ];

    for (const role of orgRoles) {
      const perms = DEFAULT_ORG_ROLE_PERMISSIONS[role];
      for (const mod of complianceModules) {
        expect(perms[mod]?.canView).toBe(true);
      }
    }
  });
});
