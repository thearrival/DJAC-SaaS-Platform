import { describe, it, expect } from "vitest";
import { createHash } from "node:crypto";

// ── Internal helpers extracted from server/services/otp.ts ─────────────────────

const OTP_EXPIRY_MINUTES = 5;
const OTP_MAX_ATTEMPTS = 5;
const OTP_LENGTH = 6;

function generateCode(): string {
    const digits = "0123456789";
    let code = "";
    for (let i = 0; i < OTP_LENGTH; i++) {
        code += digits[Math.floor(Math.random() * digits.length)];
    }
    return code;
}

function hashCode(code: string): string {
    return createHash("sha256").update(code).digest("hex");
}

function isPhone(identifier: string): boolean {
    return /^\+?[1-9]\d{6,14}$/.test(identifier.replace(/[\s\-()]/g, ""));
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe("OTP - Code Generation", () => {
  it("should generate a 6-digit numeric code", () => {
    for (let i = 0; i < 100; i++) {
      const code = generateCode();
      expect(code).toMatch(/^\d{6}$/);
    }
  });

  it("should generate varying codes (not constant)", () => {
    const codes = new Set(Array.from({ length: 50 }, () => generateCode()));
    expect(codes.size).toBeGreaterThan(1);
  });
});

describe("OTP - Code Hashing", () => {
  it("should produce a SHA-256 hex hash", () => {
    const hash = hashCode("123456");
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("should produce deterministic hashes for same input", () => {
    expect(hashCode("123456")).toBe(hashCode("123456"));
  });

  it("should produce different hashes for different inputs", () => {
    expect(hashCode("123456")).not.toBe(hashCode("654321"));
  });

  it("should be length 64 (SHA-256 hex)", () => {
    expect(hashCode("000000")).toHaveLength(64);
  });
});

describe("OTP - Phone Detection", () => {
  it("should detect international phone numbers", () => {
    expect(isPhone("+966501234567")).toBe(true);
    expect(isPhone("+8613912345678")).toBe(true);
    expect(isPhone("+12025551234")).toBe(true);
  });

  it("should detect phone numbers with formatting", () => {
    expect(isPhone("+966 50 123 4567")).toBe(true);
    expect(isPhone("+86-139-1234-5678")).toBe(true);
    expect(isPhone("+1 (202) 555-1234")).toBe(true);
  });

  it("should reject email addresses", () => {
    expect(isPhone("user@example.com")).toBe(false);
    expect(isPhone("test@djac.ai")).toBe(false);
  });

  it("should reject very short numbers", () => {
    expect(isPhone("+12345")).toBe(false);
    expect(isPhone("123")).toBe(false);
  });

  it("should reject empty strings", () => {
    expect(isPhone("")).toBe(false);
  });
});

describe("OTP - Constants", () => {
  it("should have reasonable expiry time", () => {
    expect(OTP_EXPIRY_MINUTES).toBeGreaterThanOrEqual(3);
    expect(OTP_EXPIRY_MINUTES).toBeLessThanOrEqual(15);
  });

  it("should have reasonable max attempts", () => {
    expect(OTP_MAX_ATTEMPTS).toBeGreaterThanOrEqual(3);
    expect(OTP_MAX_ATTEMPTS).toBeLessThanOrEqual(10);
  });
});
