import { useState } from "react";
import type React from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocalAuth } from "@/hooks/useLocalAuth";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useLocale } from "@/contexts/useLocale";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { APP_LOGO } from "@/const";
import {
    Check, Zap, Shield, Building2, Crown, Clock, Star,
    ArrowRight, ChevronDown, Globe, BarChart3, FileText,
    Users, Lock, HeadphonesIcon,
} from "lucide-react";
import { Link } from "wouter";

// ─── Types ────────────────────────────────────────────────────────────────────

type BillingInterval = "monthly" | "quarterly" | "biannual" | "annual";
type PlanKey = "starter" | "professional" | "enterprise";

interface PlanConfig {
    key: PlanKey;
    name: string;
    tagline: string;
    icon: React.ReactNode;
    color: string;
    borderColor: string;
    bgColor: string;
    popular?: boolean;
    prices: Record<BillingInterval, { label: string; savings?: string }>;
    features: string[];
    limits: {
        users: string;
        vendors: string;
        reports: string;
        frameworks: string;
        support: string;
    };
}

const PLANS: PlanConfig[] = [
    {
        key: "starter",
        name: "Starter",
        tagline: "Perfect for startups and early-stage compliance.",
        icon: <Zap size={22} />,
        color: "#22d3ee",
        borderColor: "border-cyan-500/40",
        bgColor: "from-cyan-500/10 to-transparent",
        prices: {
            monthly: { label: "$29" },
            quarterly: { label: "$79", savings: "Save 9%" },
            biannual: { label: "$149", savings: "Save 14%" },
            annual: { label: "$249", savings: "Save 29%" },
        },
        features: [
            "5 compliance frameworks (PIPL, CSL, DSL, PDPL, NCA)",
            "Up to 5 vendor assessments / month",
            "AI-powered gap analysis",
            "Basic compliance dashboards",
            "5 AI compliance reports / month",
            "Framework comparison engine",
            "7-day free trial included",
            "Email support",
        ],
        limits: { users: "3 seats", vendors: "10 vendors", reports: "5/month", frameworks: "All 5", support: "Email" },
    },
    {
        key: "professional",
        name: "Professional",
        tagline: "For growing compliance teams and enterprises.",
        icon: <Shield size={22} />,
        color: "#a855f7",
        borderColor: "border-purple-500/60",
        bgColor: "from-purple-500/15 to-transparent",
        popular: true,
        prices: {
            monthly: { label: "$79" },
            quarterly: { label: "$199", savings: "Save 16%" },
            biannual: { label: "$379", savings: "Save 20%" },
            annual: { label: "$699", savings: "Save 26%" },
        },
        features: [
            "Everything in Starter",
            "Unlimited vendor assessments",
            "Advanced AI risk scoring & heatmaps",
            "Unlimited AI compliance reports",
            "PDF export with executive summaries",
            "Compliance deadline calendar & alerts",
            "Multi-jurisdiction cross-analysis",
            "Audit trail & interaction logs",
            "Priority email + chat support",
            "Team collaboration (up to 10 seats)",
        ],
        limits: { users: "10 seats", vendors: "Unlimited", reports: "Unlimited", frameworks: "All 5", support: "Priority" },
    },
    {
        key: "enterprise",
        name: "Enterprise",
        tagline: "Custom deployment for large organizations.",
        icon: <Building2 size={22} />,
        color: "#f59e0b",
        borderColor: "border-amber-500/40",
        bgColor: "from-amber-500/10 to-transparent",
        prices: {
            monthly: { label: "From $199" },
            quarterly: { label: "Custom" },
            biannual: { label: "Custom" },
            annual: { label: "From $2,000", savings: "Save 16%" },
        },
        features: [
            "Everything in Professional",
            "Unlimited seats",
            "Custom compliance frameworks",
            "Dedicated AI model fine-tuning",
            "SSO / SAML integration",
            "On-premises deployment option",
            "Custom SLA & uptime guarantees",
            "Dedicated compliance consultant",
            "White-label reporting",
            "API access & webhook integrations",
            "Custom contract & invoicing",
        ],
        limits: { users: "Unlimited", vendors: "Unlimited", reports: "Unlimited", frameworks: "Custom", support: "Dedicated" },
    },
];

const FAQ = [
    {
        q: "Is there a free trial?",
        a: "Yes — every new organization gets a 7-day full-access trial with no credit card required. You'll get automated reminders on day 3 and day 6 before expiry.",
    },
    {
        q: "Can I switch plans later?",
        a: "Absolutely. You can upgrade or downgrade at any time via your billing portal. Proration is handled automatically by Stripe.",
    },
    {
        q: "What payment methods do you accept?",
        a: "We accept all major credit/debit cards (Visa, Mastercard, Amex) through Stripe's secure checkout. Enterprise customers can arrange bank transfers or invoicing.",
    },
    {
        q: "Which compliance frameworks are covered?",
        a: "DJAC covers China's PIPL, CSL, DSL and Saudi Arabia's PDPL and NCA frameworks. Enterprise customers can request additional framework integrations.",
    },
    {
        q: "Is our data secure?",
        a: "All data is encrypted in transit (TLS 1.3) and at rest (AES-256). We maintain full audit logs and are architected for GDPR and PDPL compliance.",
    },
    {
        q: "Can I cancel at any time?",
        a: "Yes. Cancel any time through the billing portal. Your subscription will remain active until the end of the paid period.",
    },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function Pricing() {
    usePageTitle("Pricing");
    const [interval, setInterval] = useState<BillingInterval>("annual");
    const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
    const [, navigate] = useLocation();
    const { isAuthenticated } = useAuth();
    const { localUser } = useLocalAuth();
    const isLoggedIn = isAuthenticated || !!localUser;
    const { t } = useLocale();

    const intervalLabels: Record<BillingInterval, string> = {
        monthly: t("pricing.intervalMonthly", "Monthly"),
        quarterly: t("pricing.intervalQuarterly", "Quarterly"),
        biannual: t("pricing.intervalBiannual", "6 Months"),
        annual: t("pricing.intervalAnnual", "Annual"),
    };

    const subscriptionStatus = trpc.billing.getSubscriptionStatus.useQuery(undefined, {
        enabled: isLoggedIn,
    });

    const createCheckout = trpc.billing.createCheckoutSession.useMutation({
        onSuccess: (data) => {
            if (data.checkoutUrl) {
                window.location.href = data.checkoutUrl;
            }
        },
    });

    const handleSelectPlan = (plan: PlanKey) => {
        if (plan === "enterprise") {
            window.location.href = "mailto:sales@yalla-hack.com?subject=DJAC Enterprise Inquiry";
            return;
        }

        if (!isLoggedIn) {
            navigate("/signup?next=/pricing");
            return;
        }

        const orgId = subscriptionStatus.data?.organizationId;
        if (!orgId) {
            // No org yet → redirect to onboarding
            navigate("/billing?setup=1");
            return;
        }

        createCheckout.mutate({ plan, interval, organizationId: orgId });
    };

    const currentPlan = subscriptionStatus.data?.plan;
    const trialDays = subscriptionStatus.data?.trialDaysRemaining ?? 0;
    const billingStatusError = isLoggedIn && subscriptionStatus.isError;

    return (
        <div
            className="min-h-screen"
            style={{
                background: "var(--djac-bg, #0a0a0f)",
                color: "var(--djac-text, #e2e8f0)",
                fontFamily: "'Inter', sans-serif",
            }}
        >
            {/* ── Nav ── */}
            <header
                style={{
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                    backdropFilter: "blur(12px)",
                    position: "sticky",
                    top: 0,
                    zIndex: 50,
                    background: "var(--djac-nav-bg)",
                }}
            >
                <div
                    style={{
                        maxWidth: 1200,
                        margin: "0 auto",
                        padding: "0 24px",
                        height: 60,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                    }}
                >
                    <Link href="/">
                        <img src={APP_LOGO} alt="DJAC" style={{ height: 32, width: "auto", maxWidth: 80, objectFit: "contain" }} />
                    </Link>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                        <ThemeToggle />
                        <LocaleSwitcher />
                        {isLoggedIn ? (
                            <Link href="/dashboard">
                                <button
                                    style={{
                                        padding: "7px 18px",
                                        borderRadius: 8,
                                        background: "rgba(168,85,247,0.15)",
                                        border: "1px solid rgba(168,85,247,0.4)",
                                        color: "#c084fc",
                                        fontSize: 13,
                                        cursor: "pointer",
                                    }}
                                >
                                    {t("pricing.dashboard", "Dashboard ->")}
                                </button>
                            </Link>
                        ) : (
                            <Link href="/signup">
                                <button
                                    style={{
                                        padding: "7px 18px",
                                        borderRadius: 8,
                                        background: "linear-gradient(135deg,#a855f7,#6366f1)",
                                        color: "#fff",
                                        fontSize: 13,
                                        cursor: "pointer",
                                        border: "none",
                                    }}
                                >
                                    {t("pricing.startFreeTrial", "Start Free Trial")}
                                </button>
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            <main style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>

                {billingStatusError && (
                    <div
                        style={{
                            margin: "24px 0 0",
                            padding: "12px 16px",
                            borderRadius: 10,
                            background: "rgba(239,68,68,0.08)",
                            border: "1px solid rgba(239,68,68,0.28)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 12,
                            flexWrap: "wrap",
                        }}
                    >
                        <span style={{ color: "#fca5a5", fontSize: 14 }}>
                            {t("billing.loadError", "Failed to load subscription status.")}
                        </span>
                        <button
                            type="button"
                            onClick={() => { void subscriptionStatus.refetch(); }}
                            style={{
                                padding: "7px 14px",
                                borderRadius: 8,
                                border: "1px solid rgba(248,250,252,0.16)",
                                background: "rgba(15,23,42,0.75)",
                                color: "#f8fafc",
                                fontSize: 13,
                                cursor: "pointer",
                            }}
                        >
                            {t("common.retry", "Retry")}
                        </button>
                    </div>
                )}

                {/* ── Trial Banner ── */}
                {isLoggedIn && currentPlan === "free_trial" && trialDays > 0 && (
                    <div
                        style={{
                            margin: "24px 0 0",
                            padding: "10px 20px",
                            borderRadius: 10,
                            background: "linear-gradient(90deg,rgba(34,211,238,0.12),rgba(168,85,247,0.12))",
                            border: "1px solid rgba(168,85,247,0.3)",
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            fontSize: 14,
                        }}
                    >
                        <Clock size={16} style={{ color: "#a855f7" }} />
                        <span style={{ color: "#c4b5fd" }}>
                            <strong>{t("pricing.trialDays", "{days} days").replace("{days}", String(trialDays))}</strong> {t("pricing.trialRemaining", "remaining in your free trial.")}{" "}
                            {t("pricing.upgradeKeepAccess", "Upgrade now to keep full access.")}
                        </span>
                    </div>
                )}

                {/* ── Hero ── */}
                <div style={{ textAlign: "center", padding: "72px 0 48px" }}>
                    <div
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "4px 14px",
                            borderRadius: 20,
                            background: "rgba(168,85,247,0.12)",
                            border: "1px solid rgba(168,85,247,0.35)",
                            fontSize: 12,
                            color: "#c084fc",
                            marginBottom: 20,
                        }}
                    >
                        <Star size={12} />
                        {t("pricing.badgeTrial", "7-day free trial · No credit card required")}
                    </div>

                    <h1
                        style={{
                            fontSize: "clamp(2rem, 5vw, 3.5rem)",
                            fontWeight: 800,
                            lineHeight: 1.1,
                            marginBottom: 16,
                            background: "linear-gradient(135deg, var(--djac-text) 30%, #a855f7)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                        }}
                    >
                        {t("pricing.heroTitle", "Simple, Transparent Pricing")}
                    </h1>
                    <p style={{ fontSize: 18, color: "var(--djac-muted)", maxWidth: 540, margin: "0 auto 40px" }}>
                        {t("pricing.heroSubtitle", "Enterprise-grade compliance intelligence for China & Saudi Arabia. Affordable for startups, scalable for enterprises.")}
                    </p>

                    {/* Interval Toggle */}
                    <div
                        style={{
                            display: "inline-flex",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: 12,
                            overflow: "hidden",
                            background: "var(--djac-card)",
                        }}
                    >
                        {(Object.keys(intervalLabels) as BillingInterval[]).map((iv) => (
                            <button
                                key={iv}
                                onClick={() => setInterval(iv)}
                                style={{
                                    padding: "10px 20px",
                                    border: "none",
                                    background: interval === iv ? "rgba(168,85,247,0.25)" : "transparent",
                                    color: interval === iv ? "#c084fc" : "var(--djac-muted)",
                                    fontSize: 13,
                                    fontWeight: interval === iv ? 600 : 400,
                                    cursor: "pointer",
                                    transition: "all 0.15s",
                                    position: "relative",
                                }}
                            >
                                {intervalLabels[iv]}
                                {iv === "annual" && (
                                    <span
                                        style={{
                                            position: "absolute",
                                            top: -8,
                                            right: 2,
                                            fontSize: 9,
                                            padding: "1px 5px",
                                            borderRadius: 6,
                                            background: "linear-gradient(90deg,#a855f7,#6366f1)",
                                            color: "#fff",
                                            fontWeight: 700,
                                        }}
                                    >
                                        {t("pricing.best", "BEST")}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Pricing Cards ── */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                        gap: 24,
                        marginBottom: 80,
                    }}
                >
                    {PLANS.map((plan) => {
                        const priceInfo = plan.prices[interval];
                        const isCurrentPlan = currentPlan === plan.key;
                        const isPending = createCheckout.isPending && createCheckout.variables?.plan === plan.key;

                        return (
                            <div
                                key={plan.key}
                                style={{
                                    borderRadius: 16,
                                    border: `1px solid ${plan.popular ? "rgba(168,85,247,0.5)" : "var(--djac-border)"}`,
                                    background: `linear-gradient(160deg, ${plan.popular ? "rgba(168,85,247,0.08)" : "var(--djac-card)"}, transparent)`,
                                    padding: 28,
                                    position: "relative",
                                    display: "flex",
                                    flexDirection: "column",
                                    transition: "transform 0.2s, box-shadow 0.2s",
                                }}
                            >
                                {plan.popular && (
                                    <div
                                        style={{
                                            position: "absolute",
                                            top: -12,
                                            left: "50%",
                                            transform: "translateX(-50%)",
                                            padding: "4px 16px",
                                            borderRadius: 20,
                                            background: "linear-gradient(90deg,#a855f7,#6366f1)",
                                            fontSize: 11,
                                            fontWeight: 700,
                                            color: "#fff",
                                            letterSpacing: "0.05em",
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {t("pricing.mostPopular", "MOST POPULAR")}
                                    </div>
                                )}

                                {/* Plan header */}
                                <div style={{ marginBottom: 20 }}>
                                    <div
                                        style={{
                                            width: 44,
                                            height: 44,
                                            borderRadius: 12,
                                            background: `${plan.color}22`,
                                            border: `1px solid ${plan.color}44`,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            color: plan.color,
                                            marginBottom: 14,
                                        }}
                                    >
                                        {plan.icon}
                                    </div>
                                    <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{t(`pricing.plan.${plan.key}.name`, plan.name)}</h3>
                                    <p style={{ fontSize: 13, color: "var(--djac-text)", lineHeight: 1.4 }}>
                                        {t(`pricing.plan.${plan.key}.tagline`, plan.tagline)}
                                    </p>
                                </div>

                                {/* Price */}
                                <div style={{ marginBottom: 24 }}>
                                    <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                                        <span style={{ fontSize: 42, fontWeight: 800, color: plan.color }}>
                                            {t(`pricing.plan.${plan.key}.price.${interval}`, priceInfo.label)}
                                        </span>
                                        {plan.key !== "enterprise" && (
                                            <span style={{ fontSize: 14, color: "var(--djac-muted)" }}>
                                                /{interval === "monthly" ? t("pricing.perMonth", "mo") : interval === "quarterly" ? t("pricing.perQuarter", "qtr") : interval === "biannual" ? t("pricing.perHalfYear", "6mo") : t("pricing.perYear", "yr")}
                                            </span>
                                        )}
                                    </div>
                                    {priceInfo.savings && (
                                        <div
                                            style={{
                                                marginTop: 4,
                                                fontSize: 12,
                                                color: "#4ade80",
                                                fontWeight: 600,
                                            }}
                                        >
                                            {t(`pricing.plan.${plan.key}.savings.${interval}`, priceInfo.savings)}
                                        </div>
                                    )}
                                </div>

                                {/* Limits badges */}
                                <div
                                    style={{
                                        display: "flex",
                                        flexWrap: "wrap",
                                        gap: 6,
                                        marginBottom: 20,
                                        padding: "10px 12px",
                                        borderRadius: 8,
                                        background: "var(--djac-card)",
                                        border: "1px solid rgba(255,255,255,0.06)",
                                    }}
                                >
                                    {Object.entries(plan.limits).map(([k, v]) => (
                                        <span
                                            key={k}
                                            style={{
                                                fontSize: 11,
                                                padding: "2px 8px",
                                                borderRadius: 6,
                                                background: `${plan.color}18`,
                                                color: plan.color,
                                                border: `1px solid ${plan.color}30`,
                                            }}
                                        >
                                            {t(`pricing.plan.${plan.key}.limit.${k}`, v)}
                                        </span>
                                    ))}
                                </div>

                                {/* Features */}
                                <ul style={{ listStyle: "none", padding: 0, margin: 0, flex: 1, marginBottom: 24 }}>
                                    {plan.features.map((f, idx) => (
                                        <li
                                            key={`${plan.key}-${idx}`}
                                            style={{
                                                display: "flex",
                                                alignItems: "flex-start",
                                                gap: 10,
                                                fontSize: 13,
                                                color: "var(--djac-muted)",
                                                marginBottom: 8,
                                                lineHeight: 1.4,
                                            }}
                                        >
                                            <Check size={14} style={{ color: plan.color, marginTop: 2, flexShrink: 0 }} />
                                            {t(`pricing.plan.${plan.key}.feature.${idx + 1}`, f)}
                                        </li>
                                    ))}
                                </ul>

                                {/* CTA */}
                                {isCurrentPlan ? (
                                    <div
                                        style={{
                                            padding: "12px",
                                            borderRadius: 10,
                                            textAlign: "center",
                                            background: "rgba(74,222,128,0.1)",
                                            border: "1px solid rgba(74,222,128,0.3)",
                                            color: "#4ade80",
                                            fontSize: 13,
                                            fontWeight: 600,
                                        }}
                                    >
                                        {t("pricing.currentPlan", "Current Plan")}
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => handleSelectPlan(plan.key)}
                                        disabled={isPending}
                                        style={{
                                            width: "100%",
                                            padding: "13px",
                                            borderRadius: 10,
                                            border: "none",
                                            background: plan.popular
                                                ? "linear-gradient(135deg,#a855f7,#6366f1)"
                                                : `linear-gradient(135deg,${plan.color}44,${plan.color}22)`,
                                            color: plan.popular ? "#fff" : plan.color,
                                            fontSize: 14,
                                            fontWeight: 700,
                                            cursor: isPending ? "not-allowed" : "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            gap: 8,
                                            opacity: isPending ? 0.7 : 1,
                                            transition: "opacity 0.15s",
                                        }}
                                    >
                                        {isPending ? (
                                            t("pricing.redirecting", "Redirecting to checkout...")
                                        ) : plan.key === "enterprise" ? (
                                            <>{t("pricing.contactSales", "Contact Sales")} <ArrowRight size={14} /></>
                                        ) : (
                                            <>{t("pricing.startFreeTrial", "Start Free Trial")} <ArrowRight size={14} /></>
                                        )}
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* ── Feature Comparison Strip ── */}
                <div
                    style={{
                        marginBottom: 80,
                        padding: 32,
                        borderRadius: 16,
                        border: "1px solid rgba(255,255,255,0.06)",
                        background: "var(--djac-card)",
                    }}
                >
                    <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 28, textAlign: "center" }}>
                        {t("pricing.whyTitle", "Why DJAC?")}
                    </h2>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 24 }}>
                        {[
                            { icon: <Globe size={20} />, title: "Dual Jurisdiction", desc: "China + Saudi Arabia frameworks in one platform" },
                            { icon: <BarChart3 size={20} />, title: "AI Risk Analysis", desc: "Real-time scoring & gap identification" },
                            { icon: <FileText size={20} />, title: "PDF Reports", desc: "Executive-ready compliance reports, instantly" },
                            { icon: <Users size={20} />, title: "Team Collaboration", desc: "RBAC roles for your entire compliance team" },
                            { icon: <Lock size={20} />, title: "Enterprise Security", desc: "Encrypted at rest & in transit, full audit logs" },
                            { icon: <HeadphonesIcon size={20} />, title: "Expert Support", desc: "Email, chat & dedicated compliance consultant" },
                        ].map((item, idx) => (
                            <div
                                key={idx}
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    textAlign: "center",
                                    gap: 10,
                                }}
                            >
                                <div
                                    style={{
                                        width: 44,
                                        height: 44,
                                        borderRadius: 12,
                                        background: "rgba(168,85,247,0.12)",
                                        border: "1px solid rgba(168,85,247,0.25)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: "#c084fc",
                                    }}
                                >
                                    {item.icon}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{t(`pricing.why.${idx + 1}.title`, item.title)}</div>
                                    <div style={{ fontSize: 12, color: "var(--djac-text)", lineHeight: 1.4 }}>{t(`pricing.why.${idx + 1}.desc`, item.desc)}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── FAQ ── */}
                <div style={{ marginBottom: 80 }}>
                    <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 28, textAlign: "center" }}>
                        {t("pricing.faqTitle", "Frequently Asked Questions")}
                    </h2>
                    <div style={{ maxWidth: 720, margin: "0 auto" }}>
                        {FAQ.map((item, i) => (
                            <div
                                key={i}
                                style={{
                                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                                    overflow: "hidden",
                                }}
                            >
                                <button
                                    onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                                    style={{
                                        width: "100%",
                                        padding: "18px 0",
                                        background: "none",
                                        border: "none",
                                        color: "inherit",
                                        textAlign: "left",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        cursor: "pointer",
                                        fontSize: 15,
                                        fontWeight: 500,
                                    }}
                                >
                                    {t(`pricing.faq.${i + 1}.q`, item.q)}
                                    <ChevronDown
                                        size={16}
                                        style={{
                                            color: "var(--djac-muted)",
                                            transform: expandedFaq === i ? "rotate(180deg)" : "none",
                                            transition: "transform 0.2s",
                                            flexShrink: 0,
                                        }}
                                    />
                                </button>
                                {expandedFaq === i && (
                                    <div
                                        style={{
                                            padding: "0 0 18px",
                                            fontSize: 14,
                                            color: "var(--djac-text)",
                                            lineHeight: 1.6,
                                        }}
                                    >
                                        {t(`pricing.faq.${i + 1}.a`, item.a)}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── CTA Strip ── */}
                <div
                    style={{
                        marginBottom: 80,
                        padding: "48px 32px",
                        borderRadius: 20,
                        background: "linear-gradient(135deg,rgba(168,85,247,0.15),rgba(99,102,241,0.15))",
                        border: "1px solid rgba(168,85,247,0.25)",
                        textAlign: "center",
                    }}
                >
                    <Crown size={32} style={{ color: "#c084fc", marginBottom: 16, display: "block", margin: "0 auto 16px" }} />
                    <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 12 }}>
                        {t("pricing.ctaTitle", "Start Your 7-Day Free Trial Today")}
                    </h2>
                    <p style={{ color: "var(--djac-muted)", marginBottom: 28, maxWidth: 480, margin: "0 auto 28px" }}>
                        {t("pricing.ctaSubtitle", "No credit card required. Full access to all features. Cancel anytime. Join compliance teams across China and Saudi Arabia.")}
                    </p>
                    <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                        <Link href="/signup">
                            <button
                                style={{
                                    padding: "13px 28px",
                                    borderRadius: 10,
                                    background: "linear-gradient(135deg,#a855f7,#6366f1)",
                                    color: "#fff",
                                    fontSize: 15,
                                    fontWeight: 700,
                                    border: "none",
                                    cursor: "pointer",
                                }}
                            >
                                {t("pricing.startFreeTrialCta", "Start Free Trial ->")}
                            </button>
                        </Link>
                        <a href="mailto:sales@yalla-hack.com?subject=DJAC Demo Request" style={{ textDecoration: "none" }}>
                            <button
                                type="button"
                                style={{
                                    padding: "13px 28px",
                                    borderRadius: 10,
                                    background: "var(--djac-card)",
                                    color: "var(--djac-muted)",
                                    fontSize: 15,
                                    fontWeight: 600,
                                    border: "1px solid rgba(255,255,255,0.12)",
                                    cursor: "pointer",
                                }}
                            >
                                {t("pricing.requestDemo", "Request a Demo")}
                            </button>
                        </a>
                    </div>
                </div>

            </main>

            {/* ── Footer ── */}
            <footer
                style={{
                    borderTop: "1px solid rgba(255,255,255,0.06)",
                    padding: "24px",
                    textAlign: "center",
                    fontSize: 13,
                    color: "var(--djac-muted)",
                }}
            >
                © {new Date().getFullYear()} DJAC - {t("pricing.footerTagline", "Dual-Jurisdiction Assurance & Compliance.")}
                {" "}{t("pricing.footerPowered", "Powered by Yalla-Hack.")} &nbsp;
                <a href="mailto:support@yalla-hack.net" style={{ color: "rgba(168,85,247,0.6)" }}>
                    support@yalla-hack.net
                </a>
            </footer>
        </div>
    );
}

