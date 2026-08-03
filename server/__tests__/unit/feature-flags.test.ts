import { describe, it, expect, vi } from "vitest";

vi.mock("../../db", () => ({
  getDb: vi.fn().mockResolvedValue(null),
}));

describe("Feature Flags Module", () => {
  it("isFeatureEnabled should return false when flag does not exist", async () => {
    const { isFeatureEnabled } = await import("../../feature-flags");
    const result = await isFeatureEnabled("nonexistent-flag");
    expect(result).toBe(false);
  });

  it("refreshFeatureFlags should export as function", async () => {
    const { refreshFeatureFlags } = await import("../../feature-flags");
    expect(typeof refreshFeatureFlags).toBe("function");
  });
});
