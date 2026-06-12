/**
 * FeatureGate — wraps premium features and shows an upgrade prompt instead of
 * a backend 403 when the user's current plan does not meet the requirement.
 *
 * Usage:
 *   <FeatureGate plan="professional" feature="Vendor Risk Dashboard">
 *     <VendorRiskDashboard />
 *   </FeatureGate>
 *
 * Plans in ascending order: free_trial → starter → professional → enterprise
 */
import { useLocation } from "wouter";
import { Lock, Sparkles, ArrowRight } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocale } from "@/contexts/useLocale";
import { useLocalAuth } from "@/hooks/useLocalAuth";
import { useAuth } from "@/_core/hooks/useAuth";

export type RequiredPlan = "starter" | "professional" | "enterprise";

const PLAN_LEVEL: Record<string, number> = {
    free_trial: 0,
    starter: 1,
    professional: 2,
    enterprise: 3,
};

const PLAN_LABEL: Record<RequiredPlan, string> = {
    starter: "Starter",
    professional: "Professional",
    enterprise: "Enterprise",
};

interface FeatureGateProps {
    /** Minimum plan required to access this feature */
    plan: RequiredPlan;
    /** Human-readable feature name shown in the upgrade prompt */
    feature: string;
    children: React.ReactNode;
}

export function FeatureGate({ plan, feature, children }: FeatureGateProps) {
    const { t } = useLocale();
    const [, navigate] = useLocation();

    // Obtain the current org plan from the billing tRPC route
    const { data: trialStatus, isLoading, isError } = trpc.billing.getSubscriptionStatus.useQuery(undefined, {
        retry: false,
        staleTime: 60_000,
    });

    // Determine whether either auth mechanism is loaded
    const { user } = useAuth();
    const { localUser } = useLocalAuth();
    const isAuthenticated = !!user || !!localUser;

    // While not authenticated, render children (auth guard handles redirect separately)
    if (!isAuthenticated) {
        return <>{children}</>;
    }

    // While loading plan info, render children optimistically
    if (isLoading) {
        return <>{children}</>;
    }

    // If query failed, render children (billing errors shouldn't lock out features)
    if (isError) {
        return <>{children}</>;
    }

    const currentPlan: string = trialStatus?.plan ?? "free_trial";
    const currentLevel = PLAN_LEVEL[currentPlan] ?? 0;
    const requiredLevel = PLAN_LEVEL[plan] ?? 1;

    // Access granted
    if (currentLevel >= requiredLevel) {
        return <>{children}</>;
    }

    // Access denied — show upgrade prompt
    const requiredLabel = PLAN_LABEL[plan];

    return (
        <div className="flex flex-col items-center justify-center min-h-[420px] p-8 text-center">
            <div className="max-w-md w-full rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm p-8 shadow-lg">
                {/* Icon */}
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
                    <Lock className="h-7 w-7 text-primary" />
                </div>

                {/* Headline */}
                <h2 className="text-xl font-semibold tracking-tight mb-2">
                    {t("featureGate.title", "{feature} is a Premium Feature").replace("{feature}", feature)}
                </h2>

                {/* Sub-copy */}
                <p className="text-sm text-muted-foreground mb-1">
                    {t(
                        "featureGate.body",
                        "Your current plan doesn't include {feature}. Upgrade to {plan} or above to unlock it."
                    )
                        .replace("{feature}", feature)
                        .replace("{plan}", requiredLabel)}
                </p>

                {/* Plan badge */}
                <div className="mt-4 mb-6 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary ring-1 ring-primary/20">
                    <Sparkles className="h-3 w-3" />
                    {t("featureGate.requiresPlan", "Requires {plan} plan").replace("{plan}", requiredLabel)}
                </div>

                {/* CTA */}
                <button
                    type="button"
                    onClick={() => navigate("/pricing")}
                    className="flex items-center gap-2 mx-auto rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                    {t("featureGate.cta", "View Plans & Upgrade")}
                    <ArrowRight className="h-4 w-4" />
                </button>

                {/* Current plan note */}
                <p className="mt-4 text-xs text-muted-foreground/70">
                    {t("featureGate.currentPlan", "Current plan: {plan}").replace("{plan}", currentPlan.replace("_", " "))}
                </p>
            </div>
        </div>
    );
}
