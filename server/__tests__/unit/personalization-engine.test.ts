import { describe, it, expect } from "vitest";
import {
  QUESTIONNAIRE_VERSION,
  QUESTIONS,
  getQuestionnaire,
  deriveProfile,
  generatePersonalization,
  chooseFirstAction,
  primaryObjectiveKey,
} from "../../services/personalization/engine";

describe("onboarding questionnaire definition", () => {
  it("is versioned and exposes stable machine ids only", () => {
    const q = getQuestionnaire();
    expect(q.version).toBe(QUESTIONNAIRE_VERSION);
    expect(q.questions).toHaveLength(5);
    for (const question of QUESTIONS) {
      expect(question.id).toMatch(/^[a-z_]+$/);
      expect(question.options.length).toBeGreaterThan(0);
      for (const opt of question.options) {
        // Option values are stable identifiers, never translated labels.
        expect(opt.value).toMatch(/^[a-z_]+$/);
        expect(opt.labelKey.startsWith("onboarding.")).toBe(true);
      }
    }
  });
});

describe("deriveProfile", () => {
  it("normalises single and multi answers", () => {
    const profile = deriveProfile({
      primary_objective: ["vendor_risk", "audit_preparation"],
      industry: "healthcare",
      professional_role: "privacy_dpo",
      experience_level: "intermediate",
      immediate_goal: "prepare_audit",
    });
    expect(profile.objectives).toEqual(["vendor_risk", "audit_preparation"]);
    expect(profile.industry).toBe("healthcare");
    expect(profile.role).toBe("privacy_dpo");
    expect(profile.experience).toBe("intermediate");
    expect(profile.immediateGoal).toBe("prepare_audit");
  });

  it("tolerates missing answers", () => {
    const profile = deriveProfile({});
    expect(profile.objectives).toEqual([]);
    expect(profile.industry).toBeNull();
  });
});

describe("generatePersonalization (deterministic + explainable)", () => {
  it("maps the immediate goal to the highest-priority module with a rule id", () => {
    const recs = generatePersonalization({
      objectives: [],
      industry: null,
      role: null,
      experience: null,
      immediateGoal: "prepare_audit",
    });
    const top = recs[0];
    expect(top.moduleId).toBe("audit_prep");
    expect(top.ruleId).toBe("goal.prepare_audit");
  });

  it("gives beginners a guided first step", () => {
    const recs = generatePersonalization({
      objectives: ["vendor_risk"],
      industry: null,
      role: null,
      experience: "new",
      immediateGoal: null,
    });
    const compliance = recs.find(r => r.moduleId === "compliance_assessment");
    expect(compliance?.priority).toBe(100);
    expect(compliance?.ruleId).toBe("experience.starter_guidance");
  });

  it("always returns a baseline recommendation and no duplicates", () => {
    const recs = generatePersonalization({
      objectives: ["vendor_risk"],
      industry: null,
      role: null,
      experience: null,
      immediateGoal: "assess_vendors",
    });
    const ids = recs.map(r => r.moduleId);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain("compliance_assessment");
    // sorted by priority desc
    for (let i = 1; i < recs.length; i++) {
      expect(recs[i - 1].priority).toBeGreaterThanOrEqual(recs[i].priority);
    }
  });

  it("chooseFirstAction returns the top recommendation", () => {
    const profile = {
      objectives: ["privacy_management"],
      industry: null,
      role: null,
      experience: null,
      immediateGoal: "manage_privacy_requests",
    };
    const recs = generatePersonalization(profile);
    expect(chooseFirstAction(profile).moduleId).toBe(recs[0].moduleId);
  });

  it("primaryObjectiveKey falls back safely", () => {
    expect(
      primaryObjectiveKey({
        objectives: [],
        industry: null,
        role: null,
        experience: null,
        immediateGoal: null,
      })
    ).toBe("compliance_management");
  });
});
