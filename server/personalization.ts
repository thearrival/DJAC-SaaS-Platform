/**
 * Personalization Engine — generates tailored recommendations
 * based on onboarding responses (frameworks, objectives, org profile).
 *
 * Integrates with the existing framework library, vendor assessment
 * engine, and AI reporting pipeline to deliver contextual suggestions.
 */
import { getDb } from "./db";
import { frameworks as complianceFrameworks } from "../drizzle/schema";
import { inArray } from "drizzle-orm";

interface OnboardingProfile {
  frameworks: string[];
  objectives: string[];
  industry: string;
  country: string;
  complianceMaturity: "beginner" | "intermediate" | "advanced";
}

interface Recommendations {
  frameworks: FrameworkRecommendation[];
  actions: ActionRecommendation[];
  dashboardWidgets: string[];
  timeline: string;
  intro: string;
}

interface FrameworkRecommendation {
  code: string;
  reason: string;
  priority: "must-have" | "should-have" | "nice-to-have";
}

interface ActionRecommendation {
  title: string;
  description: string;
  category: "assessment" | "deadline" | "report" | "vendor" | "risk";
  urgency: "immediate" | "this-week" | "this-month";
}

const INDUSTRY_FRAMEWORKS: Record<string, string[]> = {
  "financial services": ["PDPL", "PCI DSS", "ISO 27001", "GDPR"],
  healthcare: ["HIPAA", "GDPR", "ISO 27701", "NIST CSF"],
  technology: ["SOC 2", "ISO 27001", "NIST CSF", "CCPA"],
  government: ["NIST CSF", "ISO 27001", "NCA ECC", "CSL"],
  energy: ["NCA ECC", "ISO 27001", "NIST CSF"],
  manufacturing: ["ISO 27001", "GDPR", "CCPA"],
  retail: ["PCI DSS", "GDPR", "CCPA"],
  "professional services": ["GDPR", "ISO 27001", "SOC 2"],
};

const OBJECTIVE_ACTIONS: Record<string, ActionRecommendation[]> = {
  "Regulatory Compliance": [
    {
      title: "Complete jurisdiction-specific framework mapping",
      description:
        "Map your selected frameworks to regulatory obligations in your primary jurisdictions.",
      category: "assessment",
      urgency: "immediate",
    },
  ],
  "Vendor Risk Management": [
    {
      title: "Assess your top 3 vendors",
      description:
        "Run AI-powered compliance assessments on your most critical third-party vendors.",
      category: "vendor",
      urgency: "this-week",
    },
  ],
  "Audit Readiness": [
    {
      title: "Set up audit schedule",
      description:
        "Create recurring audit events aligned to your frameworks and regulatory calendar.",
      category: "deadline",
      urgency: "this-week",
    },
  ],
  "AI-Powered Reports": [
    {
      title: "Generate your first compliance report",
      description:
        "Use AI to produce a cross-jurisdiction compliance report with gap analysis.",
      category: "report",
      urgency: "this-week",
    },
  ],
  "Risk Assessment": [
    {
      title: "Create initial risk register entries",
      description:
        "Log top organisational risks and auto-map them to your compliance frameworks.",
      category: "risk",
      urgency: "immediate",
    },
  ],
  "Continuous Monitoring": [
    {
      title: "Configure CTEM monitoring scope",
      description:
        "Set up continuous threat exposure monitoring for your critical assets.",
      category: "assessment",
      urgency: "this-month",
    },
  ],
};

export async function generateRecommendations(
  profile: OnboardingProfile
): Promise<Recommendations> {
  const db = await getDb();
  if (!db) return emptyRecommendations();

  const allFrameworks = await db
    .select()
    .from(complianceFrameworks)
    .where(inArray(complianceFrameworks.code, profile.frameworks));

  const industryRecs = (INDUSTRY_FRAMEWORKS[profile.industry] || []).filter(
    f => !profile.frameworks.includes(f)
  );

  const frameworkRecs: FrameworkRecommendation[] = [
    ...industryRecs.map(code => ({
      code,
      reason: `Commonly required for ${profile.industry} organisations`,
      priority: "should-have" as const,
    })),
  ];

  const actionRecs: ActionRecommendation[] = [];
  for (const obj of profile.objectives) {
    const actions = OBJECTIVE_ACTIONS[obj] || [];
    for (const action of actions) {
      if (!actionRecs.some(a => a.title === action.title)) {
        actionRecs.push(action);
      }
    }
  }

  if (actionRecs.length === 0) {
    actionRecs.push({
      title: "Explore the Compliance Framework Library",
      description:
        "Browse 46 frameworks across 29 jurisdictions to understand your obligations.",
      category: "assessment",
      urgency: "this-week",
    });
  }

  const widgets = ["compliance_health", "upcoming_deadlines"];
  if (profile.objectives.includes("Vendor Risk Management"))
    widgets.push("vendor_risk");
  if (profile.objectives.includes("Risk Assessment"))
    widgets.push("risk_register");
  if (profile.objectives.includes("AI-Powered Reports"))
    widgets.push("recent_reports");
  if (profile.objectives.includes("Continuous Monitoring"))
    widgets.push("ctem_overview");

  const maturityTimeline: Record<string, string> = {
    beginner:
      "We recommend a phased approach: complete setup this week, run your first assessment in week 2, and establish a recurring compliance cadence by month's end.",
    intermediate:
      "Focus on closing gaps and automating recurring tasks this month. Leverage AI reports for executive stakeholders.",
    advanced:
      "Optimize your compliance posture with advanced CTEM monitoring, cross-jurisdiction analysis, and custom report automation.",
  };

  return {
    frameworks: frameworkRecs,
    actions: actionRecs,
    dashboardWidgets: widgets,
    timeline:
      maturityTimeline[profile.complianceMaturity] || maturityTimeline.beginner,
    intro: `Based on your profile (${profile.industry}, ${profile.country}), we've tailored DJAC to prioritize ${profile.frameworks.slice(0, 3).join(", ")} compliance. ${allFrameworks.length > 0 ? `Your ${allFrameworks.length} selected framework(s) are ready.` : ""}`,
  };
}

function emptyRecommendations(): Recommendations {
  return {
    frameworks: [],
    actions: [
      {
        title: "Complete your onboarding",
        description:
          "Finish setting up your profile to receive personalised recommendations.",
        category: "assessment",
        urgency: "immediate",
      },
    ],
    dashboardWidgets: ["compliance_health", "upcoming_deadlines"],
    timeline:
      "Complete your onboarding profile to receive a personalised compliance timeline.",
    intro:
      "Welcome to DJAC! Complete your onboarding to unlock personalised recommendations.",
  };
}
