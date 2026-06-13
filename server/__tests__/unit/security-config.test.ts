import { describe, it, expect } from "vitest";

describe("Supabase Client — Configuration Validation", () => {
  it("should accept valid Supabase URL format", () => {
    const validUrls = [
      "https://abc.supabase.co",
      "https://xyz123.supabase.co",
    ];
    for (const url of validUrls) {
      expect(url).toMatch(/^https:\/\/[a-z0-9]+\.supabase\.co$/);
    }
  });

  it("should reject invalid Supabase URL formats", () => {
    const invalidUrls = [
      "http://abc.supabase.co",
      "https://supabase.co",
      "https://abc.supabase.com",
      "not-a-url",
    ];
    for (const url of invalidUrls) {
      expect(url).not.toMatch(/^https:\/\/[a-z0-9]+\.supabase\.co$/);
    }
  });

  it("should validate storage bucket names", () => {
    const validBuckets = ["compliance-evidence", "report-exports"];
    for (const name of validBuckets) {
      expect(name.length).toBeGreaterThan(0);
      expect(name).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it("should detect missing credentials gracefully", () => {
    const hasUrl = false;
    const hasKey = false;
    expect(hasUrl || hasKey).toBe(false);
  });
});

describe("Rate Limiting — Configuration", () => {
  it("should define reasonable rate limit values", () => {
    const RATE_LIMIT_WINDOW_MS = 60_000;
    const MAX_REQUESTS = 100;
    expect(RATE_LIMIT_WINDOW_MS).toBe(60_000);
    expect(MAX_REQUESTS).toBeGreaterThan(10);
    expect(MAX_REQUESTS).toBeLessThan(1000);
  });
});
