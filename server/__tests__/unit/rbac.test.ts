import { describe, it, expect } from "vitest";

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

function hasMinRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

describe("RBAC - Role Hierarchy", () => {
  it("super_admin should have all permissions", () => {
    const roles: UserRole[] = ["user", "admin", "company_admin", "platform_admin", "super_admin"];
    for (const role of roles) {
      expect(hasMinRole("super_admin", role)).toBe(true);
    }
  });

  it("user should not have admin permissions", () => {
    expect(hasMinRole("user", "admin")).toBe(false);
    expect(hasMinRole("user", "company_admin")).toBe(false);
  });

  it("platform_admin should have company_admin and below", () => {
    expect(hasMinRole("platform_admin", "company_admin")).toBe(true);
    expect(hasMinRole("platform_admin", "admin")).toBe(true);
    expect(hasMinRole("platform_admin", "user")).toBe(true);
    expect(hasMinRole("platform_admin", "super_admin")).toBe(false);
  });

  it("professional_user should be above basic_user", () => {
    expect(hasMinRole("professional_user", "basic_user")).toBe(true);
    expect(hasMinRole("professional_user", "user")).toBe(true);
    expect(hasMinRole("basic_user", "professional_user")).toBe(false);
  });
});
