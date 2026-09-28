import { describe, it, expect } from "vitest";
import { submitAnswer, getOnboardingState } from "../../onboarding-service";

const actor = {
  userId: 1,
  localUserId: null,
  organizationId: 1,
  sessionId: "sess-1",
  actorType: "user" as const,
  actorId: "1",
};

describe("onboarding answer persistence (no database)", () => {
  it("rejects an unknown question id without touching the database", async () => {
    const result = await submitAnswer(actor, {
      questionId: "not_a_real_question",
      value: "x",
      stepNumber: 1,
    });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Unknown question");
  });

  it("degrades gracefully when the database is unavailable", async () => {
    const result = await submitAnswer(actor, {
      questionId: "primary_objective",
      value: ["vendor_risk"],
      stepNumber: 1,
    });
    // No DB in unit tests → best-effort success, never a throw.
    expect(result.ok).toBe(true);
  });

  it("returns an empty-but-valid state when the database is unavailable", async () => {
    const state = await getOnboardingState({ userId: 1, localUserId: null }, 1);
    expect(state.questionnaireVersion).toBe(1);
    expect(state.answers).toEqual({});
    expect(Array.isArray(state.recommendations)).toBe(true);
  });
});
