import { useEffect, useState } from "react";
import type React from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocalAuth } from "@/hooks/useLocalAuth";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useLocale } from "@/contexts/useLocale";
import {
    CreditCard, Clock, AlertTriangle, XCircle,
    Building2, ExternalLink, RefreshCw, Crown, Shield, Zap,
    ArrowUpRight, Receipt, Calendar,
} from "lucide-react";
import { Link } from "wouter";
import { formatDate } from "@/lib/intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Translate = (key: string, fallback: string) => string;

// ─── Plan metadata ─────────────────────────────────────────────────────────

const PLAN_META = {
    free_trial: { color: "#22d3ee", icon: Clock, bg: "rgba(34,211,238,0.1)", border: "rgba(34,211,238,0.25)" },
    starter: { color: "#22d3ee", icon: Zap, bg: "rgba(34,211,238,0.1)", border: "rgba(34,211,238,0.25)" },
    professional: { color: "#a855f7", icon: Shield, bg: "rgba(168,85,247,0.12)", border: "rgba(168,85,247,0.35)" },
    enterprise: { color: "#f59e0b", icon: Building2, bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.25)" },
};

const STATUS_META: Record<string, { color: string }> = {
    active: { color: "#4ade80" },
    trialing: { color: "#22d3ee" },
    past_due: { color: "#f59e0b" },
    canceled: { color: "#f87171" },
    incomplete: { color: "#94a3b8" },
    paused: { color: "#94a3b8" },
};

function getPlanLabel(plan: string | null | undefined, t: Translate): string {
    switch (plan) {
        case "starter":
            return t("billing.planStarter", "Starter");
        case "professional":
            return t("billing.planProfessional", "Professional");
        case "enterprise":
            return t("billing.planEnterprise", "Enterprise");
        case "free_trial":
        default:
            return t("billing.planFreeTrial", "Free Trial");
    }
}

function getStatusLabel(status: string | null | undefined, t: Translate): string {
    switch (status) {
        case "active":
            return t("billing.statusActive", "Active");
        case "trialing":
            return t("billing.statusTrial", "Trial");
        case "past_due":
            return t("billing.statusPastDue", "Past Due");
        case "canceled":
            return t("billing.statusCancelled", "Cancelled");
        case "incomplete":
            return t("billing.statusIncomplete", "Incomplete");
        case "paused":
            return t("billing.statusPaused", "Paused");
        default:
            return status ?? t("billing.statusUnknown", "Unknown");
    }
}

function localeTag(locale: string): string {
    if (locale === "ar") return "ar-SA";
    if (locale === "zh") return "zh-CN";
    return "en-US";
}

function formatCents(cents: number | null | undefined, locale: string, currency = "USD"): string {
    if (cents == null) return "—";
    return new Intl.NumberFormat(localeTag(locale), { style: "currency", currency }).format(cents / 100);
}



// ─── Org Setup Modal ─────────────────────────────────────────────────────────

function OrgSetupForm({ onSuccess }: { onSuccess: () => void }) {
    const { t } = useLocale();
    const [form, setForm] = useState({ name: "", billingEmail: "", industry: "", primaryJurisdiction: "Both" as const });
    const createOrg = trpc.billing.createOrganization.useMutation({ onSuccess });
    const canSubmit = !!form.name && !!form.billingEmail && !createOrg.isPending;

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!canSubmit) {
            return;
        }

        createOrg.mutate({
            name: form.name,
            billingEmail: form.billingEmail,
            primaryJurisdiction: form.primaryJurisdiction,
        });
    };

    return (
        <form
            onSubmit={handleSubmit}
            style={{
                padding: 32,
                borderRadius: 16,
                border: "1px solid rgba(168,85,247,0.3)",
                background: "rgba(168,85,247,0.06)",
                maxWidth: 540,
                margin: "0 auto",
            }}
        >
            <Crown size={28} style={{ color: "#c084fc", marginBottom: 16 }} />
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{t("billing.setupTitle", "Set Up Your Organization")}</h2>
            <p style={{ fontSize: 13, color: "var(--djac-muted)", marginBottom: 24, lineHeight: 1.5 }}>
                {t("billing.setupSubtitle", "Create your organization to start your 7-day free trial. No credit card required.")}
            </p>
            <p style={{ fontSize: 12, color: "var(--djac-muted)", marginBottom: 16 }}>
                {t("billing.requiredHint", "Organization Name and Billing Email are required.")}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                    <label style={{ fontSize: 12, color: "var(--djac-muted)", marginBottom: 6, display: "block" }}>
                        {t("billing.orgName", "Organization Name")} *
                    </label>
                    <input
                        value={form.name}
                        onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                        placeholder={t("billing.orgNamePlaceholder", "Acme Corporation")}
                        aria-label={t("billing.orgName", "Organization Name")}
                        style={{
                            width: "100%",
                            padding: "10px 14px",
                            borderRadius: 8,
                            background: "var(--djac-input-bg)",
                            border: "1px solid var(--djac-input-border)",
                            color: "var(--djac-text)",
                            fontSize: 14,
                            outline: "none",
                            boxSizing: "border-box",
                        }}
                    />
                </div>
                <div>
                    <label style={{ fontSize: 12, color: "var(--djac-muted)", marginBottom: 6, display: "block" }}>
                        {t("billing.billingEmail", "Billing Email")} *
                    </label>
                    <input
                        type="email"
                        value={form.billingEmail}
                        onChange={(e) => setForm((p) => ({ ...p, billingEmail: e.target.value }))}
                        placeholder={t("billing.billingEmailPlaceholder", "billing@example.com")}
                        aria-label={t("billing.billingEmail", "Billing Email")}
                        style={{
                            width: "100%",
                            padding: "10px 14px",
                            borderRadius: 8,
                            background: "var(--djac-input-bg)",
                            border: "1px solid var(--djac-input-border)",
                            color: "var(--djac-text)",
                            fontSize: 14,
                            outline: "none",
                            boxSizing: "border-box",
                        }}
                    />
                </div>
                <div>
                    <label style={{ fontSize: 12, color: "var(--djac-muted)", marginBottom: 6, display: "block" }}>
                        {t("billing.primaryJurisdiction", "Primary Jurisdiction")}
                    </label>
                    <Select
                        value={form.primaryJurisdiction}
                        onValueChange={(value) => setForm((p) => ({ ...p, primaryJurisdiction: value as typeof form.primaryJurisdiction }))}
                    >
                        <SelectTrigger
                            aria-label={t("billing.primaryJurisdiction", "Primary Jurisdiction")}
                            className="w-full"
                            style={{
                                width: "100%",
                                background: "var(--djac-input-bg)",
                                borderColor: "var(--djac-input-border)",
                                color: "var(--djac-text)",
                                fontSize: 14,
                            }}
                        >
                            <SelectValue placeholder={t("billing.primaryJurisdiction", "Primary Jurisdiction")} />
                        </SelectTrigger>
                        <SelectContent
                            style={{
                                background: "var(--djac-card)",
                                borderColor: "var(--djac-input-border)",
                                color: "var(--djac-text)",
                            }}
                        >
                            <SelectItem value="Both">{t("billing.jurisdictionBoth", "Both (China + Saudi Arabia)")}</SelectItem>
                            <SelectItem value="China">{t("billing.jurisdictionChina", "China Only")}</SelectItem>
                            <SelectItem value="Saudi Arabia">{t("billing.jurisdictionSaudi", "Saudi Arabia Only")}</SelectItem>
                            <SelectItem value="Other">{t("billing.jurisdictionOther", "Other")}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <button
                    type="submit"
                    disabled={!canSubmit}
                    style={{
                        padding: "13px",
                        borderRadius: 10,
                        background: "linear-gradient(135deg,#a855f7,#6366f1)",
                        color: "#fff",
                        fontSize: 14,
                        fontWeight: 700,
                        border: "none",
                        cursor: "pointer",
                        opacity: canSubmit ? 1 : 0.6,
                        marginTop: 8,
                    }}
                >
                    {createOrg.isPending
                        ? t("billing.creating", "Creating...")
                        : t("billing.startTrial", "Start 7-Day Free Trial ->")}
                </button>
                {createOrg.isPending ? (
                    <div role="status" aria-live="polite" style={{ fontSize: 12, color: "var(--djac-muted)" }}>
                        {t("billing.setupSubmittingHint", "Creating your organization and starting the trial...")}
                    </div>
                ) : null}

                {createOrg.error && (
                    <div role="alert" style={{ fontSize: 13, color: "#f87171", padding: "8px 12px", background: "rgba(248,113,113,0.1)", borderRadius: 6 }}>
                        {createOrg.error.message}
                    </div>
                )}
            </div>
        </form>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BillingAccount() {
    usePageTitle("Billing & Account");
    const { isAuthenticated } = useAuth();
    const { localUser } = useLocalAuth();
    const isLoggedIn = isAuthenticated || !!localUser;
    const { t, locale } = useLocale();

    const statusQuery = trpc.billing.getSubscriptionStatus.useQuery(undefined, { enabled: isLoggedIn });
    const portalMutation = trpc.billing.createPortalSession.useMutation({
        onSuccess: (data) => { if (data.portalUrl) window.location.href = data.portalUrl; },
        onError: (err) => toast.error(err.message),
    });

    const status = statusQuery.data;
    const orgId = status?.organizationId;
    const historyQuery = trpc.billing.getBillingHistory.useQuery(
        { organizationId: orgId ?? 0 },
        { enabled: !!orgId },
    );

    useEffect(() => {
        if (statusQuery.error) toast.error(t("billing.loadError", "Failed to load subscription status."));
    }, [statusQuery.error]);
    useEffect(() => {
        if (historyQuery.error) toast.error(t("billing.historyLoadError", "Failed to load billing history."));
    }, [historyQuery.error]);

    const planMeta = PLAN_META[status?.plan ?? "free_trial"];
    const PlanIcon = planMeta.icon;
    const subStatus = STATUS_META[status?.subscriptionStatus ?? "trialing"];
    const planLabel = getPlanLabel(status?.plan, t);
    const subStatusLabel = getStatusLabel(status?.subscriptionStatus, t);
    const isTrialActive = status?.plan === "free_trial" && (status?.trialDaysRemaining ?? 0) > 0;
    const trialDays = status?.trialDaysRemaining ?? 0;
    const isBillingBusy = statusQuery.isLoading || historyQuery.isLoading || portalMutation.isPending;

    if (!isLoggedIn) {
        return (
            <div style={{ padding: 48, textAlign: "center" }}>
                <p style={{ color: "var(--djac-muted)", marginBottom: 16 }}>{t("billing.signInPrompt", "Please sign in to view billing.")}</p>
                <Link href="/signup">
                    <button style={{ padding: "10px 24px", borderRadius: 8, background: "rgba(168,85,247,0.2)", color: "#c084fc", border: "1px solid rgba(168,85,247,0.4)", cursor: "pointer" }}>
                        {t("billing.signIn", "Sign In")}
                    </button>
                </Link>
            </div>
        );
    }

    // Show org setup if no organization exists yet
    if (statusQuery.isSuccess && !status?.organizationId) {
        return (
            <div style={{ padding: "48px 24px" }}>
                <OrgSetupForm onSuccess={() => statusQuery.refetch()} />
            </div>
        );
    }

    if (statusQuery.isError && !statusQuery.data) {
        return (
            <div className="djac-page">
                <div
                    style={{
                        padding: 24,
                        borderRadius: 14,
                        border: "1px solid var(--djac-border)",
                        background: "var(--djac-card)",
                        textAlign: "center",
                    }}
                >
                    <p style={{ fontSize: 15, fontWeight: 600, margin: "0 0 8px" }}>
                        {t("billing.loadError", "Failed to load subscription status.")}
                    </p>
                    <p style={{ fontSize: 13, color: "var(--djac-muted)", margin: "0 0 16px" }}>
                        {t("billing.retryHint", "Retry to refresh your billing and subscription details.")}
                    </p>
                    <Button variant="outline" size="sm" onClick={() => { void statusQuery.refetch(); }}>
                        {t("common.retry", "Retry")}
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="djac-page">
            <div aria-live="polite" role="status" style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0, 0, 0, 0)", whiteSpace: "nowrap", border: 0 }}>
                {isBillingBusy
                    ? t("billing.loadingStatus", "Billing information is loading.")
                    : statusQuery.isSuccess
                        ? t("billing.readyStatus", "Billing information is ready.")
                        : ""}
            </div>
            {/* ── Header ── */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>{t("billing.title", "Billing & Subscription")}</h1>
                    <p style={{ fontSize: 14, color: "var(--djac-muted)" }}>
                        {t("billing.subtitle", "Manage your plan, payment method, and billing history.")}
                    </p>
                </div>
                <Link href="/pricing">
                    <button
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "9px 18px",
                            borderRadius: 8,
                            background: "rgba(168,85,247,0.12)",
                            border: "1px solid rgba(168,85,247,0.3)",
                            color: "#c084fc",
                            fontSize: 13,
                            cursor: "pointer",
                        }}
                    >
                        <Crown size={14} />
                        {t("billing.viewPlans", "View Plans")}
                    </button>
                </Link>
            </div>

            {/* ── Plan Status Card ── */}
            <div
                style={{
                    padding: 24,
                    borderRadius: 14,
                    border: `1px solid ${planMeta.border}`,
                    background: planMeta.bg,
                    marginBottom: 24,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    gap: 20,
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div
                        style={{
                            width: 52,
                            height: 52,
                            borderRadius: 14,
                            background: `${planMeta.color}22`,
                            border: `1px solid ${planMeta.color}44`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: planMeta.color,
                        }}
                    >
                        <PlanIcon size={24} />
                    </div>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                            <span style={{ fontSize: 20, fontWeight: 700 }}>{planLabel}</span>
                            {status?.subscriptionStatus && (
                                <span
                                    style={{
                                        fontSize: 11,
                                        padding: "2px 8px",
                                        borderRadius: 6,
                                        background: `${subStatus.color}20`,
                                        color: subStatus.color,
                                        border: `1px solid ${subStatus.color}30`,
                                        fontWeight: 600,
                                    }}
                                >
                                    {subStatusLabel}
                                </span>
                            )}
                        </div>
                        {isTrialActive ? (
                            <div style={{ fontSize: 13, color: planMeta.color }}>
                                <Clock size={12} style={{ display: "inline", marginRight: 4 }} />
                                {t("billing.trialDaysRemaining", "{days} day(s) remaining in trial").replace("{days}", String(trialDays))}
                                {status?.trialEndsAt && ` · ${t("billing.expiresOn", "Expires")} ${formatDate(status.trialEndsAt, locale)}`}
                            </div>
                        ) : status?.currentPeriodEnd ? (
                            <div style={{ fontSize: 13, color: "var(--djac-muted)" }}>
                                <Calendar size={12} style={{ display: "inline", marginRight: 4 }} />
                                {t("billing.renews", "Renews")} {formatDate(status.currentPeriodEnd, locale)}
                                {status.billingInterval && ` · ${status.billingInterval}`}
                            </div>
                        ) : null}
                        {status?.organizationName && (
                            <div style={{ fontSize: 12, color: "var(--djac-muted)", marginTop: 4 }}>
                                <Building2 size={11} style={{ display: "inline", marginRight: 4 }} />
                                {status.organizationName}
                            </div>
                        )}
                    </div>
                </div>

                {/* Action buttons */}
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {isTrialActive && (
                        <Link href="/pricing">
                            <button
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                    padding: "10px 18px",
                                    borderRadius: 8,
                                    background: "linear-gradient(135deg,#a855f7,#6366f1)",
                                    color: "#fff",
                                    fontSize: 13,
                                    fontWeight: 700,
                                    border: "none",
                                    cursor: "pointer",
                                }}
                            >
                                <ArrowUpRight size={13} />
                                {t("billing.upgradeNow", "Upgrade Now")}
                            </button>
                        </Link>
                    )}
                    {orgId && (status?.plan !== "free_trial") && (
                        <button
                            onClick={() => portalMutation.mutate({ organizationId: orgId })}
                            disabled={portalMutation.isPending}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                padding: "10px 18px",
                                borderRadius: 8,
                                background: "var(--djac-card-hi)",
                                border: "1px solid var(--djac-border)",
                                color: "var(--djac-muted)",
                                fontSize: 13,
                                cursor: "pointer",
                                opacity: portalMutation.isPending ? 0.6 : 1,
                            }}
                        >
                            <ExternalLink size={13} />
                            {portalMutation.isPending ? t("billing.opening", "Opening...") : t("billing.manageBilling", "Manage Billing")}
                        </button>
                    )}
                </div>
            </div>

            {/* ── Trial Warning ── */}
            {isTrialActive && trialDays <= 3 && (
                <div
                    style={{
                        padding: "12px 18px",
                        borderRadius: 10,
                        background: "rgba(245,158,11,0.1)",
                        border: "1px solid rgba(245,158,11,0.3)",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        fontSize: 13,
                        marginBottom: 24,
                    }}
                >
                    <AlertTriangle size={16} style={{ color: "#f59e0b", flexShrink: 0 }} />
                    <div>
                        <strong style={{ color: "#f59e0b" }}>{t("billing.trialExpiringSoon", "Trial expiring soon")}</strong>
                        <span style={{ color: "var(--djac-muted)" }}>
                            {" "}- {t("billing.trialEndsIn", "Your free trial ends in {days} day(s).").replace("{days}", String(trialDays))}{" "}
                            <Link href="/pricing" style={{ color: "#c084fc", textDecoration: "none" }}>
                                {t("billing.upgradeToKeep", "Upgrade to keep access ->")}
                            </Link>
                        </span>
                    </div>
                </div>
            )}

            {/* ── Trial Expired ── */}
            {status?.plan === "free_trial" && !isTrialActive && (
                <div
                    style={{
                        padding: "12px 18px",
                        borderRadius: 10,
                        background: "rgba(248,113,113,0.1)",
                        border: "1px solid rgba(248,113,113,0.3)",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        fontSize: 13,
                        marginBottom: 24,
                    }}
                >
                    <XCircle size={16} style={{ color: "#f87171", flexShrink: 0 }} />
                    <div>
                        <strong style={{ color: "#f87171" }}>{t("billing.trialExpired", "Trial expired")}</strong>
                        <span style={{ color: "var(--djac-muted)" }}>
                            {" "}- {t("billing.subscribeToRegain", "Subscribe to regain full access.")}{" "}
                            <Link href="/pricing" style={{ color: "#c084fc", textDecoration: "none" }}>
                                {t("billing.viewPlansCta", "View plans ->")}
                            </Link>
                        </span>
                    </div>
                </div>
            )}

            {/* ── Billing History ── */}
            {orgId && (
                <div
                    style={{
                        padding: 24,
                        borderRadius: 14,
                        border: "1px solid var(--djac-border)",
                        background: "var(--djac-card)",
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                        <Receipt size={18} style={{ color: "var(--djac-muted)" }} />
                        <h2 style={{ fontSize: 16, fontWeight: 600 }}>{t("billing.historyTitle", "Billing History")}</h2>
                        <button
                            onClick={() => historyQuery.refetch()}
                            aria-label={t("billing.refreshHistory", "Refresh billing history")}
                            style={{ marginLeft: "auto", background: "none", border: "none", color: "var(--djac-muted)", cursor: "pointer" }}
                        >
                            <RefreshCw size={14} />
                        </button>
                    </div>

                    {historyQuery.isError ? (
                        <div style={{ color: "var(--djac-muted)", fontSize: 13, textAlign: "center", padding: 24 }}>
                            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--djac-text)", marginBottom: 8 }}>
                                {t("billing.historyLoadError", "Failed to load billing history.")}
                            </div>
                            <Button variant="outline" size="sm" onClick={() => { void historyQuery.refetch(); }}>
                                {t("common.retry", "Retry")}
                            </Button>
                        </div>
                    ) : historyQuery.isLoading ? (
                        <div role="status" aria-live="polite" style={{ color: "var(--djac-muted)", fontSize: 13, textAlign: "center", padding: 24 }}>
                            {t("billing.loadingHistory", "Loading billing history...")}
                        </div>
                    ) : historyQuery.data?.length === 0 || !historyQuery.data ? (
                        <div style={{ color: "var(--djac-muted)", fontSize: 13, textAlign: "center", padding: 24 }}>
                            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--djac-text)", marginBottom: 6 }}>
                                {t("billing.emptyTitle", "No billing events yet")}
                            </div>
                            {t("billing.noEvents", "No billing events yet. Events will appear here once you subscribe.")}
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                            {historyQuery.data.map((event) => {
                                const s = STATUS_META[event.status] ?? { color: "#94a3b8" };
                                const eventStatusLabel = getStatusLabel(event.status, t);
                                return (
                                    <div
                                        key={event.id}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            padding: "12px 14px",
                                            borderRadius: 8,
                                            background: "var(--djac-card)",
                                            gap: 12,
                                            flexWrap: "wrap",
                                        }}
                                    >
                                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                            <CreditCard size={14} style={{ color: "var(--djac-muted)", flexShrink: 0 }} />
                                            <div>
                                                <div style={{ fontSize: 13, fontWeight: 500 }}>{event.description ?? event.eventType}</div>
                                                <div style={{ fontSize: 11, color: "var(--djac-muted)" }}>{formatDate(event.createdAt, locale)}</div>
                                            </div>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                            <span style={{ fontSize: 13, fontWeight: 600, color: s.color }}>
                                                {event.amountCents != null ? formatCents(event.amountCents, locale, event.currency ?? "USD") : "—"}
                                            </span>
                                            <span
                                                style={{
                                                    fontSize: 11,
                                                    padding: "2px 8px",
                                                    borderRadius: 6,
                                                    background: `${s.color}18`,
                                                    color: s.color,
                                                    border: `1px solid ${s.color}28`,
                                                }}
                                            >
                                                {eventStatusLabel}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ── Support Footer ── */}
            <div
                style={{
                    marginTop: 32,
                    padding: "16px 20px",
                    borderRadius: 10,
                    background: "var(--djac-card)",
                    border: "1px solid var(--djac-border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 12,
                    fontSize: 13,
                    color: "var(--djac-muted)",
                }}
            >
                <span>{t("billing.supportPrompt", "Questions about billing? Contact us at")} {" "}
                    <a href="mailto:support@yalla-hack.net" style={{ color: "#c084fc", textDecoration: "none" }}>
                        support@yalla-hack.net
                    </a>
                </span>
                <div style={{ display: "flex", gap: 16 }}>
                    <Link href="/pricing" style={{ color: "var(--djac-muted)", textDecoration: "none" }}>{t("billing.viewPlans", "View Plans")}</Link>
                    <a href="https://stripe.com/legal" target="_blank" rel="noopener noreferrer" style={{ color: "var(--djac-muted)", textDecoration: "none" }}>
                        {t("billing.stripeTerms", "Stripe Terms")} <ExternalLink size={10} style={{ display: "inline" }} />
                    </a>
                </div>
            </div>
        </div>
    );
}
