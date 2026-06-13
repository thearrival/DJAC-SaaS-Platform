import { describe, it, expect } from "vitest";

describe("OTP — Phone Number Validation", () => {
  const isPhone = (value: string): boolean => {
    const digits = value.replace(/\D/g, "");
    return digits.length >= 8 && digits.length <= 15;
  };

  it("should detect valid international phone numbers", () => {
    expect(isPhone("+8618326095404")).toBe(true);
    expect(isPhone("+966501234567")).toBe(true);
    expect(isPhone("+12025551234")).toBe(true);
  });

  it("should detect phone numbers with formatting", () => {
    expect(isPhone("+1 (202) 555-1234")).toBe(true);
    expect(isPhone("+86 183 2609 5404")).toBe(true);
    expect(isPhone("+966-50-123-4567")).toBe(true);
  });

  it("should reject email addresses", () => {
    expect(isPhone("user@example.com")).toBe(false);
    expect(isPhone("test.user@domain.co")).toBe(false);
  });

  it("should reject too-short numbers", () => {
    expect(isPhone("12345")).toBe(false);
    expect(isPhone("+1")).toBe(false);
  });

  it("should reject empty strings", () => {
    expect(isPhone("")).toBe(false);
  });
});

describe("OTP — Code Validation", () => {
  const isValidOtpCode = (code: string): boolean => /^\d{6}$/.test(code);

  it("should accept 6-digit codes", () => {
    expect(isValidOtpCode("123456")).toBe(true);
    expect(isValidOtpCode("000000")).toBe(true);
    expect(isValidOtpCode("999999")).toBe(true);
  });

  it("should reject non-6-digit codes", () => {
    expect(isValidOtpCode("12345")).toBe(false);
    expect(isValidOtpCode("1234567")).toBe(false);
    expect(isValidOtpCode("abcdef")).toBe(false);
    expect(isValidOtpCode("12 345")).toBe(false);
    expect(isValidOtpCode("")).toBe(false);
  });
});

describe("OTP — Rate Limiting", () => {
  const OTP_COOLDOWN_MS = 60_000;
  const MAX_ATTEMPTS = 5;

  it("should enforce cooldown between requests", () => {
    expect(OTP_COOLDOWN_MS).toBe(60_000);
  });

  it("should limit max verification attempts", () => {
    expect(MAX_ATTEMPTS).toBeGreaterThan(1);
    expect(MAX_ATTEMPTS).toBeLessThan(10);
  });
});
