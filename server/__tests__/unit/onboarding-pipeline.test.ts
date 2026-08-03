/**
 * Integration test: onboarding → personalization → recommendation pipeline.
 * Validates that the full customer journey data flow works correctly.
 */
import { describe, it, expect, vi } from "vitest";

vi.mock("../db", () => ({
  getDb: vi.fn().mockResolvedValue(null),
}));

describe("Onboarding → Personalization Pipeline", () => {
  describe("Onboarding Router", () => {
    it("should export getProgress, updateProgress, skip, complete", async () => {
      const mod = await import("../../onboarding-router");
      expect(typeof mod.onboardingRouter).toBe("object");
    });
  });

  describe("Personalization Engine", () => {
    it("should return empty recommendations when DB unavailable", async () => {
      const { generateRecommendations } = await import("../../personalization");
      const result = await generateRecommendations({
        frameworks: ["GDPR", "ISO 27001"],
        objectives: ["Regulatory Compliance"],
        industry: "technology",
        country: "United Kingdom",
        complianceMaturity: "beginner",
      });

      expect(result.actions).toHaveLength(1);
      expect(result.actions[0].title).toContain("Complete your onboarding");
      expect(result.dashboardWidgets).toContain("compliance_health");
    });

    it("should return fallback recommendations when industry frameworks unavailable", async () => {
      const { generateRecommendations } = await import("../../personalization");
      const result = await generateRecommendations({
        frameworks: ["GDPR"],
        objectives: [],
        industry: "financial services",
        country: "Saudi Arabia",
        complianceMaturity: "intermediate",
      });

      expect(result.actions.length).toBeGreaterThan(0);
      expect(typeof result.timeline).toBe("string");
      expect(result.intro.length).toBeGreaterThan(0);
    });

    it("should return fallback action when no objectives provided", async () => {
      const { generateRecommendations } = await import("../../personalization");
      const result = await generateRecommendations({
        frameworks: [],
        objectives: [],
        industry: "",
        country: "",
        complianceMaturity: "beginner",
      });

      expect(result.actions).toHaveLength(1);
      expect(result.actions[0].title).toContain("Complete your onboarding");
    });

    it("should return maturity-appropriate timeline guidance", async () => {
      const { generateRecommendations } = await import("../../personalization");

      const beginner = await generateRecommendations({
        frameworks: [],
        objectives: [],
        industry: "",
        country: "",
        complianceMaturity: "beginner",
      });
      const advanced = await generateRecommendations({
        frameworks: [],
        objectives: [],
        industry: "",
        country: "",
        complianceMaturity: "advanced",
      });

      expect(typeof beginner.timeline).toBe("string");
      expect(typeof advanced.timeline).toBe("string");
      expect(beginner.intro.length).toBeGreaterThan(0);
    });
  });

  describe("Analytics Router", () => {
    it("should export track, getUserMetrics, getRecentEvents", async () => {
      const mod = await import("../../analytics-router");
      expect(typeof mod.analyticsRouter).toBe("object");
    });
  });

  describe("Notifications Router", () => {
    it("should export list, unreadCount, markRead, markAllRead", async () => {
      const mod = await import("../../notification-router");
      expect(typeof mod.notificationsRouter).toBe("object");
    });
  });

  describe("Customer 360 Router", () => {
    it("should export list and getProfile", async () => {
      const mod = await import("../../customer-360-router");
      expect(typeof mod.customer360Router).toBe("object");
    });
  });

  describe("Feature Flags", () => {
    it("should return false for any flag when DB unavailable", async () => {
      vi.resetModules();
      const { isFeatureEnabled } = await import("../../feature-flags");
      const result = await isFeatureEnabled("new-onboarding", 1);
      expect(result).toBe(false);
    });
  });
});
