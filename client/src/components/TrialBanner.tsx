import { useState } from "react";
import { Link } from "wouter";
import { AlertTriangle, Clock, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocale } from "@/contexts/useLocale";
import { useRbac } from "@/hooks/useRbac";

const DISMISS_KEY = "djac_trial_banner_dismissed";

export default function TrialBanner() {
    const { t } = useLocale();
    const { isSuperAdmin, isPlatformAdmin } = useRbac();
    const [dismissed, setDismissed] = useState(
        () => !!sessionStorage.getItem(DISMISS_KEY)
    );

    const { data } = trpc.billing.getSubscriptionStatus.useQuery(undefined, {
        retry: false,
        refetchOnWindowFocus: false,
    });

    // Super admins and platform admins are never subject to trial restrictions
    if (isSuperAdmin || isPlatformAdmin) return null;
    if (dismissed) return null;
    if (!data) return null;
    if (data.plan !== "free_trial") return null;

    const days = data.trialDaysRemaining ?? 0;
    if (days > 7) return null;

    const handleDismiss = () => {
        sessionStorage.setItem(DISMISS_KEY, "1");
        setDismissed(true);
    };

    const isExpired = days <= 0;
    const isUrgent = days >= 1 && days <= 3;

    const accentColor = isExpired
        ? "var(--djac-red)"
        : isUrgent
            ? "var(--djac-orange)"
            : "var(--djac-yellow)";

    const bgAlpha = isExpired ? "0.10" : "0.07";
    const bg = isExpired
        ? `rgba(255, 23, 68, ${bgAlpha})`
        : isUrgent
            ? `rgba(255, 107, 43, ${bgAlpha})`
            : `rgba(255, 214, 0, ${bgAlpha})`;
    const borderColor = isExpired
        ? "rgba(255, 23, 68, 0.30)"
        : isUrgent
            ? "rgba(255, 107, 43, 0.30)"
            : "rgba(255, 214, 0, 0.25)";

    const messageText = isExpired
        ? t("trial.bannerExpired", "Your free trial has expired.")
        : days === 1
            ? t("trial.bannerOneDay", "1 day remaining in your free trial.")
            : t("trial.bannerDaysLeft", "{days} days remaining in your free trial.").replace(
                "{days}",
                String(days)
            );

    return (
        <div
            className="mb-4 flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm"
            style={{ background: bg, borderColor }}
            role="alert"
            aria-live="polite"
        >
            <div className="flex items-center gap-2.5 min-w-0">
                {isExpired ? (
                    <AlertTriangle
                        className="h-4 w-4 shrink-0"
                        style={{ color: accentColor }}
                        aria-hidden="true"
                    />
                ) : (
                    <Clock
                        className="h-4 w-4 shrink-0"
                        style={{ color: accentColor }}
                        aria-hidden="true"
                    />
                )}
                <span className="font-semibold text-foreground truncate">{messageText}</span>
                <span className="hidden md:inline text-muted-foreground shrink-0">
                    {t("trial.bannerUpgrade", "Upgrade now to retain full access.")}
                </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
                <Link
                    href="/pricing"
                    className="rounded-lg px-3 py-1.5 text-xs font-bold transition-opacity hover:opacity-80 text-black"
                    style={{ background: accentColor }}
                >
                    {t("trial.bannerCta", "Upgrade Now")}
                </Link>
                <button
                    onClick={handleDismiss}
                    className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                    aria-label={t("trial.bannerDismiss", "Dismiss trial banner")}
                >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
            </div>
        </div>
    );
}
