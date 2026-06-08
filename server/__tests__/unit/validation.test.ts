import { describe, it, expect } from "vitest";
import { z } from "zod";

const ComplianceFrameworkSchema = z.object({
  code: z.string().min(2).max(50),
  name: z.string().min(1),
  country: z.string().min(2),
  description: z.string().optional(),
  scope: z.string().optional(),
});

const UserRegistrationSchema = z.object({
  email: z.string().email().max(320),
  password: z.string().min(8).max(72),
  name: z.string().min(2).max(255).optional(),
  preferredLocale: z.enum(["en", "ar", "zh"]).default("en"),
});

describe("Validation - Compliance Framework", () => {
  it("should validate a correct framework", () => {
    const result = ComplianceFrameworkSchema.safeParse({
      code: "PDPA",
      name: "Personal Data Protection Act",
      country: "Saudi Arabia",
    });
    expect(result.success).toBe(true);
  });

  it("should reject a framework with short code", () => {
    const result = ComplianceFrameworkSchema.safeParse({
      code: "P",
      name: "Test",
      country: "SA",
    });
    expect(result.success).toBe(false);
  });
});

describe("Validation - User Registration", () => {
  it("should accept valid registration", () => {
    const result = UserRegistrationSchema.safeParse({
      email: "user@example.com",
      password: "StrongPass1!",
      name: "John Doe",
    });
    expect(result.success).toBe(true);
  });

  it("should reject weak passwords", () => {
    const result = UserRegistrationSchema.safeParse({
      email: "test@example.com",
      password: "123",
    });
    expect(result.success).toBe(false);
  });

  it("should reject invalid emails", () => {
    const result = UserRegistrationSchema.safeParse({
      email: "not-email",
      password: "StrongPass1!",
    });
    expect(result.success).toBe(false);
  });
});
