import { describe, it, expect } from "vitest";

describe("config-schema helpers", () => {
  const intEnv = (
    raw: string | undefined,
    fallback: number,
    min: number,
    max: number
  ): number => {
    if (!raw) return fallback;
    const n = Number.parseInt(raw, 10);
    if (Number.isNaN(n)) return fallback;
    return Math.max(min, Math.min(max, n));
  };

  const boolEnv = (raw: string | undefined, fallback: boolean): boolean => {
    if (raw === undefined || raw === "") return fallback;
    return raw === "true";
  };

  const strEnv = (raw: string | undefined, fallback = ""): string => {
    return (raw ?? fallback).trim() || fallback;
  };

  describe("intEnv", () => {
    it("should return fallback when raw is undefined", () => {
      expect(intEnv(undefined, 10, 1, 100)).toBe(10);
    });

    it("should return fallback when raw is empty string", () => {
      expect(intEnv("", 10, 1, 100)).toBe(10);
    });

    it("should return fallback when raw is not a number", () => {
      expect(intEnv("abc", 10, 1, 100)).toBe(10);
    });

    it("should parse valid integer", () => {
      expect(intEnv("50", 10, 1, 100)).toBe(50);
    });

    it("should clamp to min", () => {
      expect(intEnv("-5", 10, 1, 100)).toBe(1);
    });

    it("should clamp to max", () => {
      expect(intEnv("200", 10, 1, 100)).toBe(100);
    });

    it("should handle zero correctly", () => {
      expect(intEnv("0", 10, 0, 100)).toBe(0);
    });

    it("should handle negative min", () => {
      expect(intEnv("-10", 0, -100, 100)).toBe(-10);
    });
  });

  describe("boolEnv", () => {
    it("should return fallback for undefined", () => {
      expect(boolEnv(undefined, true)).toBe(true);
      expect(boolEnv(undefined, false)).toBe(false);
    });

    it("should return fallback for empty string", () => {
      expect(boolEnv("", true)).toBe(true);
    });

    it("should return true for 'true'", () => {
      expect(boolEnv("true", false)).toBe(true);
    });

    it("should return false for any other value", () => {
      expect(boolEnv("false", true)).toBe(false);
      expect(boolEnv("1", true)).toBe(false);
      expect(boolEnv("yes", true)).toBe(false);
      expect(boolEnv("TRUE", true)).toBe(false);
    });

    it("should treat whitespace string as false (not empty)", () => {
      expect(boolEnv("  ", true)).toBe(false);
    });
  });

  describe("strEnv", () => {
    it("should return fallback for undefined", () => {
      expect(strEnv(undefined, "default")).toBe("default");
    });

    it("should return fallback for empty string", () => {
      expect(strEnv("", "default")).toBe("default");
    });

    it("should return trimmed value", () => {
      expect(strEnv("  hello  ")).toBe("hello");
    });

    it("should return default fallback empty string", () => {
      expect(strEnv(undefined)).toBe("");
    });

    it("should handle whitespace-only string", () => {
      expect(strEnv("   ", "fallback")).toBe("fallback");
    });
  });
});
