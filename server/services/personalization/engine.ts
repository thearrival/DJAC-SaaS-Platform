/**
 * Personalization engine — DETERMINISTIC and pure.
 *
 * This module contains the onboarding questionnaire definition (stable machine
 * identifiers only — never translated labels) and the rule engine that derives
 * a user profile and recommendations from stored answers.
 *
 * IMPORTANT: this logic NEVER influences authorization/RBAC/tenancy. It only
 * decides what to surface first. See server/onboarding-service.ts for the
 * persistence layer.
 */

export const QUESTIONNAIRE_VERSION = 1;

export type QuestionOption = { value: string; labelKey: string };

export type Question = {
  /** Stable machine id, never localized. */
  id: string;
  version: number;
  step: number;
  /** i18n key resolved by the client. */
  labelKey: string;
  helpKey?: string;
  multi: boolean;
  required: boolean;
  options: QuestionOption[];
};

export const QUESTIONS: Question[] = [
  {
    id: "primary_objective",
    version: 1,
    step: 1,
    labelKey: "onboarding.q.objective.label",
    helpKey: "onboarding.q.objective.help",
    multi: true,
    required: true,
    options: [
      {
        value: "compliance_management",
        labelKey: "onboarding.opt.objective.compliance",
      },
      {
        value: "privacy_management",
        labelKey: "onboarding.opt.objective.privacy",
      },
      {
        value: "regulatory_readiness",
        labelKey: "onboarding.opt.objective.regulatory",
      },
      { value: "risk_management", labelKey: "onboarding.opt.objective.risk" },
      {
        value: "vendor_risk",
        labelKey: "onboarding.opt.objective.vendor_risk",
      },
      {
        value: "audit_preparation",
        labelKey: "onboarding.opt.objective.audit",
      },
      {
        value: "security_compliance",
        labelKey: "onboarding.opt.objective.security",
      },
      {
        value: "incident_management",
        labelKey: "onboarding.opt.objective.incident",
      },
      {
        value: "data_subject_requests",
        labelKey: "onboarding.opt.objective.dsr",
      },
      {
        value: "continuous_monitoring",
        labelKey: "onboarding.opt.objective.monitoring",
      },
      { value: "ai_governance", labelKey: "onboarding.opt.objective.ai" },
      { value: "other", labelKey: "onboarding.opt.objective.other" },
    ],
  },
  {
    id: "industry",
    version: 1,
    step: 2,
    labelKey: "onboarding.q.industry.label",
    multi: false,
    required: false,
    options: [
      { value: "technology", labelKey: "onboarding.opt.industry.technology" },
      {
        value: "financial_services",
        labelKey: "onboarding.opt.industry.finance",
      },
      { value: "healthcare", labelKey: "onboarding.opt.industry.healthcare" },
      { value: "government", labelKey: "onboarding.opt.industry.government" },
      { value: "energy", labelKey: "onboarding.opt.industry.energy" },
      {
        value: "telecommunications",
        labelKey: "onboarding.opt.industry.telecom",
      },
      {
        value: "manufacturing",
        labelKey: "onboarding.opt.industry.manufacturing",
      },
      { value: "ecommerce", labelKey: "onboarding.opt.industry.ecommerce" },
      {
        value: "professional_services",
        labelKey: "onboarding.opt.industry.services",
      },
      { value: "education", labelKey: "onboarding.opt.industry.education" },
      { value: "other", labelKey: "onboarding.opt.industry.other" },
    ],
  },
  {
    id: "professional_role",
    version: 1,
    step: 3,
    labelKey: "onboarding.q.role.label",
    multi: false,
    required: false,
    options: [
      { value: "founder_executive", labelKey: "onboarding.opt.role.founder" },
      { value: "compliance", labelKey: "onboarding.opt.role.compliance" },
      { value: "legal", labelKey: "onboarding.opt.role.legal" },
      { value: "risk", labelKey: "onboarding.opt.role.risk" },
      { value: "security", labelKey: "onboarding.opt.role.security" },
      { value: "it", labelKey: "onboarding.opt.role.it" },
      { value: "privacy_dpo", labelKey: "onboarding.opt.role.privacy" },
      { value: "audit", labelKey: "onboarding.opt.role.audit" },
      { value: "operations", labelKey: "onboarding.opt.role.operations" },
      { value: "consultant", labelKey: "onboarding.opt.role.consultant" },
      { value: "other", labelKey: "onboarding.opt.role.other" },
    ],
  },
  {
    id: "experience_level",
    version: 1,
    step: 4,
    labelKey: "onboarding.q.experience.label",
    multi: false,
    required: false,
    options: [
      { value: "new", labelKey: "onboarding.opt.exp.new" },
      { value: "basic", labelKey: "onboarding.opt.exp.basic" },
      { value: "intermediate", labelKey: "onboarding.opt.exp.intermediate" },
      { value: "advanced", labelKey: "onboarding.opt.exp.advanced" },
      { value: "expert", labelKey: "onboarding.opt.exp.expert" },
    ],
  },
  {
    id: "immediate_goal",
    version: 1,
    step: 5,
    labelKey: "onboarding.q.goal.label",
    multi: false,
    required: false,
    options: [
      { value: "understand_posture", labelKey: "onboarding.opt.goal.posture" },
      { value: "prepare_audit", labelKey: "onboarding.opt.goal.audit" },
      {
        value: "understand_regulations",
        labelKey: "onboarding.opt.goal.regulations",
      },
      { value: "assess_vendors", labelKey: "onboarding.opt.goal.vendors" },
      { value: "build_risk_register", labelKey: "onboarding.opt.goal.risk" },
      {
        value: "manage_privacy_requests",
        labelKey: "onboarding.opt.goal.privacy",
      },
      { value: "prepare_framework", labelKey: "onboarding.opt.goal.framework" },
      { value: "monitor_exposure", labelKey: "onboarding.opt.goal.monitoring" },
      { value: "build_program", labelKey: "onboarding.opt.goal.program" },
    ],
  },
];

export const QUESTION_IDS = QUESTIONS.map(q => q.id);

export function getQuestionnaire() {
  return { version: QUESTIONNAIRE_VERSION, questions: QUESTIONS };
}

export type DerivedProfile = {
  objectives: string[];
  industry: string | null;
  role: string | null;
  experience: string | null;
  immediateGoal: string | null;
};

/** Normalise a stored answer value into a string[] of stable values. */
function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === "string");
  }
  return typeof value === "string" && value.length > 0 ? [value] : [];
}

export function deriveProfile(
  answers: Record<string, unknown>
): DerivedProfile {
  return {
    objectives: asStringArray(answers.primary_objective),
    industry: asStringArray(answers.industry)[0] ?? null,
    role: asStringArray(answers.professional_role)[0] ?? null,
    experience: asStringArray(answers.experience_level)[0] ?? null,
    immediateGoal: asStringArray(answers.immediate_goal)[0] ?? null,
  };
}

export type Recommendation = {
  moduleId: string;
  priority: number;
  reason: string;
  ruleId: string;
};

/** Stable module ids (the client maps them to routes + i18n labels). */
export const MODULE_IDS = [
  "compliance_assessment",
  "framework_mapping",
  "risk_register",
  "vendor_risk",
  "privacy_dsr",
  "audit_prep",
  "incident_management",
  "remediation",
  "continuous_monitoring",
  "ai_governance",
  "policies",
  "evidence",
] as const;

const OBJECTIVE_MODULE: Record<string, string> = {
  compliance_management: "compliance_assessment",
  privacy_management: "privacy_dsr",
  regulatory_readiness: "framework_mapping",
  risk_management: "risk_register",
  vendor_risk: "vendor_risk",
  audit_preparation: "audit_prep",
  security_compliance: "compliance_assessment",
  incident_management: "incident_management",
  data_subject_requests: "privacy_dsr",
  continuous_monitoring: "continuous_monitoring",
  ai_governance: "ai_governance",
};

const GOAL_MODULE: Record<string, string> = {
  understand_posture: "compliance_assessment",
  prepare_audit: "audit_prep",
  understand_regulations: "framework_mapping",
  assess_vendors: "vendor_risk",
  build_risk_register: "risk_register",
  manage_privacy_requests: "privacy_dsr",
  prepare_framework: "framework_mapping",
  monitor_exposure: "continuous_monitoring",
  build_program: "policies",
};

/**
 * Deterministic recommendations. Each carries the exact rule that produced it
 * so the UI/owner console can explain "why".
 */
export function generatePersonalization(
  profile: DerivedProfile
): Recommendation[] {
  const byModule = new Map<string, Recommendation>();
  const put = (moduleId: string, priority: number, ruleId: string) => {
    const existing = byModule.get(moduleId);
    if (!existing || existing.priority < priority) {
      byModule.set(moduleId, { moduleId, priority, reason: ruleId, ruleId });
    }
  };

  for (const objective of profile.objectives) {
    const moduleId = OBJECTIVE_MODULE[objective];
    if (moduleId) put(moduleId, 80, `objective.${objective}`);
  }
  if (profile.immediateGoal) {
    const moduleId = GOAL_MODULE[profile.immediateGoal];
    if (moduleId) put(moduleId, 95, `goal.${profile.immediateGoal}`);
  }
  if (profile.experience === "new" || profile.experience === "basic") {
    put("compliance_assessment", 100, "experience.starter_guidance");
  }
  if (
    profile.industry === "healthcare" ||
    profile.industry === "financial_services"
  ) {
    put("framework_mapping", 70, `industry.${profile.industry}`);
  }
  if (profile.role === "audit") put("audit_prep", 85, "role.audit");
  if (profile.role === "privacy_dpo")
    put("privacy_dsr", 85, "role.privacy_dpo");
  if (profile.role === "security")
    put("incident_management", 75, "role.security");

  // Baseline: never leave the user without a sensible starting point.
  put("compliance_assessment", 40, "baseline");

  return [...byModule.values()].sort((a, b) => b.priority - a.priority);
}

export type FirstAction = { moduleId: string; ruleId: string };

/** The single dominant next step. */
export function chooseFirstAction(profile: DerivedProfile): FirstAction {
  const [top] = generatePersonalization(profile);
  return { moduleId: top.moduleId, ruleId: top.ruleId };
}

/** A dashboard intro line keyed by objective (client localizes). */
export function primaryObjectiveKey(profile: DerivedProfile): string {
  return profile.objectives[0] ?? "compliance_management";
}
