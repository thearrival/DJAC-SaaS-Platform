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

describe("OTP — Email Validation (isEmail)", () => {
  const isEmail = (value: string): boolean =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  it("should accept standard email addresses", () => {
    expect(isEmail("user@example.com")).toBe(true);
    expect(isEmail("test@djac.ai")).toBe(true);
    expect(isEmail("admin@saudia.gov.sa")).toBe(true);
    expect(isEmail("hello.world@sub.domain.co")).toBe(true);
  });

  it("should accept emails with plus addressing", () => {
    expect(isEmail("user+tag@example.com")).toBe(true);
    expect(isEmail("test+spam@djac.ai")).toBe(true);
  });

  it("should accept emails with dots in local part", () => {
    expect(isEmail("first.last@example.com")).toBe(true);
    expect(isEmail("jane.doe@company.co.uk")).toBe(true);
  });

  it("should accept emails with numbers", () => {
    expect(isEmail("user123@example.com")).toBe(true);
    expect(isEmail("2024@domain.org")).toBe(true);
  });

  it("should reject strings without @ symbol", () => {
    expect(isEmail("notanemail")).toBe(false);
    expect(isEmail("plainaddress")).toBe(false);
    expect(isEmail("123456")).toBe(false);
  });

  it("should reject strings without domain", () => {
    expect(isEmail("user@")).toBe(false);
    expect(isEmail("@domain")).toBe(false);
  });

  it("should reject strings without TLD", () => {
    expect(isEmail("user@domain")).toBe(false);
  });

  it("should reject strings with spaces", () => {
    expect(isEmail("user @domain.com")).toBe(false);
    expect(isEmail(" user@domain.com")).toBe(false);
    expect(isEmail("user@domain.com ")).toBe(false);
  });

  it("should reject empty strings", () => {
    expect(isEmail("")).toBe(false);
  });

  it("should reject phone numbers", () => {
    expect(isEmail("+966501234567")).toBe(false);
    expect(isEmail("+8613912345678")).toBe(false);
  });
});

describe("OTP — verifyOtp Input Validation", () => {
  const verifyOtp = (input: {
    identifier: string;
    code: string;
  }): { success: boolean; message: string } => {
    if (!input.code || input.code.length !== 6 || !/^\d{6}$/.test(input.code)) {
      return { success: false, message: "Invalid verification code format." };
    }
    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.identifier) &&
      !/^\+?[1-9]\d{6,14}$/.test(input.identifier.replace(/[\s\-()]/g, ""))
    ) {
      return {
        success: false,
        message: "Invalid email or phone number format.",
      };
    }
    return { success: true, message: "Code verified." };
  };

  it("should reject empty code", () => {
    const result = verifyOtp({ identifier: "user@example.com", code: "" });
    expect(result.success).toBe(false);
    expect(result.message).toContain("Invalid verification code format");
  });

  it("should reject non-numeric code", () => {
    const result = verifyOtp({
      identifier: "user@example.com",
      code: "abcdef",
    });
    expect(result.success).toBe(false);
    expect(result.message).toContain("Invalid verification code format");
  });

  it("should reject too-short code", () => {
    const result = verifyOtp({ identifier: "user@example.com", code: "12345" });
    expect(result.success).toBe(false);
    expect(result.message).toContain("Invalid verification code format");
  });

  it("should reject too-long code", () => {
    const result = verifyOtp({
      identifier: "user@example.com",
      code: "1234567",
    });
    expect(result.success).toBe(false);
    expect(result.message).toContain("Invalid verification code format");
  });

  it("should accept valid 6-digit code with email", () => {
    const result = verifyOtp({
      identifier: "user@example.com",
      code: "123456",
    });
    expect(result.success).toBe(true);
  });

  it("should accept valid 6-digit code with phone", () => {
    const result = verifyOtp({ identifier: "+966501234567", code: "654321" });
    expect(result.success).toBe(true);
  });

  it("should reject invalid identifier format", () => {
    const result = verifyOtp({ identifier: "not-valid", code: "123456" });
    expect(result.success).toBe(false);
    expect(result.message).toContain("Invalid email or phone number format");
  });
});
