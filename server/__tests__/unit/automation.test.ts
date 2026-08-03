import { describe, it, expect, vi } from "vitest";

vi.mock("../../db", () => ({
  getDb: vi.fn().mockResolvedValue(null),
}));

describe("Automation Module", () => {
  it("should export scheduleOnboardingSequence", async () => {
    const mod = await import("../../automation");
    expect(typeof mod.scheduleOnboardingSequence).toBe("function");
  });

  it("should export cancelOnboardingSequence", async () => {
    const mod = await import("../../automation");
    expect(typeof mod.cancelOnboardingSequence).toBe("function");
  });

  it("should export scheduleReEngagement", async () => {
    const mod = await import("../../automation");
    expect(typeof mod.scheduleReEngagement).toBe("function");
  });

  it("should export scheduleTrialReminders", async () => {
    const mod = await import("../../automation");
    expect(typeof mod.scheduleTrialReminders).toBe("function");
  });

  it("should export runDailyAutomationCheck", async () => {
    const mod = await import("../../automation");
    expect(typeof mod.runDailyAutomationCheck).toBe("function");
  });

  it("runDailyAutomationCheck should complete without error", async () => {
    const { runDailyAutomationCheck } = await import("../../automation");
    await expect(runDailyAutomationCheck()).resolves.toBeUndefined();
  });
});
