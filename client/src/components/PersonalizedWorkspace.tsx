import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useLocale } from "@/contexts/useLocale";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Sparkles, X } from "lucide-react";

/** Stable module id → client route + i18n label key (never translated ids). */
const MODULE_META: Record<string, { route: string; labelKey: string }> = {
  compliance_assessment: {
    route: "/compliance-tracker",
    labelKey: "module.compliance_assessment",
  },
  framework_mapping: {
    route: "/global-registry",
    labelKey: "module.framework_mapping",
  },
  risk_register: { route: "/risk-register", labelKey: "module.risk_register" },
  vendor_risk: { route: "/vendor-risk", labelKey: "module.vendor_risk" },
  privacy_dsr: { route: "/dsr-tracker", labelKey: "module.privacy_dsr" },
  audit_prep: { route: "/audit-schedule", labelKey: "module.audit_prep" },
  incident_management: {
    route: "/incident-register",
    labelKey: "module.incident_management",
  },
  remediation: {
    route: "/remediation-planner",
    labelKey: "module.remediation",
  },
  continuous_monitoring: {
    route: "/continuous-compliance",
    labelKey: "module.continuous_monitoring",
  },
  ai_governance: { route: "/ai-agents", labelKey: "module.ai_governance" },
  policies: { route: "/policy-manager", labelKey: "module.policies" },
  evidence: { route: "/evidence-locker", labelKey: "module.evidence" },
};

function humanize(value: string): string {
  return value.replace(/[._]/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Personalized workspace card. Reads the user's PERSISTED recommendations
 * server-side. Fails safe: any error renders nothing and never blocks the
 * dashboard.
 */
export function PersonalizedWorkspace() {
  const { t } = useLocale();
  const [, navigate] = useLocation();
  const [dismissed, setDismissed] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  const query = trpc.onboarding.getRecommendations.useQuery(undefined, {
    staleTime: 300_000,
    retry: false,
  });
  const dismissMutation = trpc.onboarding.dismissRecommendation.useMutation();
  const signalMutation = trpc.onboarding.recordModuleSignal.useMutation();

  if (dismissed || !query.data) return null;
  const { recommendations, firstAction, completedAt } = query.data;

  // Not finished setting up → invite them to finish (non-blocking).
  if (!completedAt) {
    return (
      <Card className="mb-4 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium">
                {t(
                  "onboarding.prompt.title",
                  "Finish setting up your workspace"
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                {t(
                  "onboarding.prompt.body",
                  "Answer a few quick questions and we'll organize DJAC around your priorities."
                )}
              </p>
            </div>
          </div>
          <Button size="sm" onClick={() => navigate("/get-started")}>
            {t("onboarding.prompt.cta", "Get started")}
            <ArrowRight className="ms-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  const top = recommendations.slice(0, 3);
  const first = firstAction ? MODULE_META[firstAction.moduleId] : undefined;

  return (
    <Card className="mb-4 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-primary" />
            {t("workspace.title", "Your personalized workspace")}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-muted-foreground"
            aria-label={t("workspace.dismiss", "Dismiss")}
            onClick={() => setDismissed(true)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        {first && (
          <CardDescription>
            {t("workspace.nextStep", "Your next step")}:{" "}
            <button
              type="button"
              className="font-medium text-primary underline-offset-2 hover:underline"
              onClick={() => navigate(first.route)}
            >
              {t(first.labelKey, humanize(firstAction!.moduleId))}
            </button>
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("workspace.recommended", "Recommended for you")}
        </p>
        <div className="grid gap-2 sm:grid-cols-3">
          {top
            .filter(rec => !dismissedIds.includes(rec.moduleId))
            .map(rec => {
              const meta = MODULE_META[rec.moduleId];
              return (
                <div key={rec.moduleId} className="flex items-stretch gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (meta) navigate(meta.route);
                      signalMutation.mutate({
                        moduleId: rec.moduleId,
                        signal: "module_opened",
                      });
                    }}
                    className="flex-1 rounded-lg border border-border bg-card p-3 text-start transition-colors hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <p className="text-sm font-medium">
                      {t(meta?.labelKey ?? "", humanize(rec.moduleId))}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {t(`why.${rec.ruleId}`, humanize(rec.ruleId))}
                    </p>
                  </button>
                  <button
                    type="button"
                    aria-label={t(
                      "workspace.dismissOne",
                      "Dismiss recommendation"
                    )}
                    onClick={() => {
                      setDismissedIds(prev => [...prev, rec.moduleId]);
                      dismissMutation.mutate({ moduleId: rec.moduleId });
                    }}
                    className="rounded-lg border border-border px-2 text-muted-foreground transition-colors hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
        </div>
        <div className="flex items-center gap-2 pt-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/get-started")}
          >
            {t("workspace.personalize", "Personalize my workspace")}
          </Button>
          <Badge variant="outline" className="text-[10px]">
            {t("workspace.personalized", "Personalized")}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
