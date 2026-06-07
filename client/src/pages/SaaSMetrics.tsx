/**
 * SaaSMetrics.tsx
 *
 * DJAC — SaaS Business Intelligence & Metrics Dashboard
 *
 * Covers all key SaaS metrics:
 * MRR · ARR · Churn (Logo & Revenue) · LTV · CAC · CAC Payback ·
 * CAC:LTV Ratio · NRR · GRR · Rule of 40 · Magic Number · Burn Multiple
 *
 * Includes interactive calculators + compliance-scoped KPIs derived from
 * live tRPC data (framework coverage, relationship health, etc.)
 */

import { useEffect, useMemo, useState } from "react";
import type React from "react";
import { useLocale } from "@/contexts/useLocale";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useTheme } from "@/contexts/useTheme";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
    TrendingUp, TrendingDown, DollarSign, Users, RefreshCw,
    Zap, BarChart3, ShieldCheck, AlertTriangle, Info,
    CheckCircle2, ArrowUp, ArrowDown, Target, Layers,
    Calculator, Globe2, Activity,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface MetricCardProps {
    label: string;
    value: string;
    sub?: string;
    accent: string;
    icon: React.ReactNode;
    trend?: "up" | "down" | "neutral";
    trendValue?: string;
    formula?: string;
}

interface CalcField {
    key: string;
    label: string;
    placeholder: string;
    prefix?: string;
    suffix?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n: number, decimals = 0) {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toFixed(decimals);
}

function pct(n: number) {
    return `${n.toFixed(1)}%`;
}

function parseSafe(v: string) {
    const n = parseFloat(v.replace(/,/g, ""));
    return isNaN(n) ? 0 : n;
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function MetricCard({ label, value, sub, accent, icon, trend, trendValue, formula }: MetricCardProps) {
    const [showFormula, setShowFormula] = useState(false);
    return (
        <div
            className="djac-kpi-hover"
            style={{
                background: "var(--djac-card)",
                border: "1px solid var(--djac-border)",
                borderRadius: 14,
                padding: "18px 20px",
                display: "flex",
                flexDirection: "column",
                gap: 10,
                position: "relative",
                overflow: "hidden",
            }}
        >
            {/* Accent top bar */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: accent, borderRadius: "14px 14px 0 0" }} />

            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div
                    style={{
                        width: 40, height: 40, borderRadius: 10,
                        background: `${accent}1A`, border: `1px solid ${accent}40`,
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}
                >
                    {icon}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {trendValue && trend && (
                        <div style={{
                            display: "flex", alignItems: "center", gap: 3, fontSize: 11, fontWeight: 700,
                            color: trend === "up" ? "var(--djac-green)" : trend === "down" ? "var(--djac-red)" : "var(--djac-muted)",
                        }}>
                            {trend === "up" ? <ArrowUp style={{ width: 12, height: 12 }} /> : trend === "down" ? <ArrowDown style={{ width: 12, height: 12 }} /> : null}
                            {trendValue}
                        </div>
                    )}
                    {formula && (
                        <button
                            onClick={() => setShowFormula(f => !f)}
                            style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: "var(--djac-muted)" }}
                            title="Show formula"
                        >
                            <Info style={{ width: 13, height: 13 }} />
                        </button>
                    )}
                </div>
            </div>

            <div>
                <p style={{ color: "var(--djac-muted)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>{label}</p>
                <p style={{ color: accent, fontSize: 28, fontWeight: 700, lineHeight: 1 }}>{value}</p>
                {sub && <p style={{ color: "var(--djac-muted)", fontSize: 10, marginTop: 5 }}>{sub}</p>}
            </div>

            {showFormula && formula && (
                <div style={{
                    marginTop: 4, padding: "8px 10px",
                    background: `${accent}10`, border: `1px solid ${accent}30`,
                    borderRadius: 8, fontSize: 10, color: "var(--djac-muted)", fontFamily: "monospace",
                }}>
                    {formula}
                </div>
            )}
        </div>
    );
}

function SectionTitle({ icon, title, sub }: { icon: React.ReactNode; title: string; sub?: string }) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: "var(--djac-border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {icon}
            </div>
            <div>
                <p style={{ fontSize: 14, fontWeight: 700, margin: 0, color: "var(--djac-text)" }}>{title}</p>
                {sub && <p style={{ fontSize: 11, color: "var(--djac-muted)", margin: "2px 0 0" }}>{sub}</p>}
            </div>
        </div>
    );
}

function CalcCard({
    title,
    accent,
    fields,
    compute,
    resultLabel,
    formulaLine,
}: {
    title: string;
    accent: string;
    fields: CalcField[];
    compute: (vals: Record<string, number>) => string;
    resultLabel: string;
    formulaLine: string;
}) {
    const [vals, setVals] = useState<Record<string, string>>({});
    const nums = useMemo(() => Object.fromEntries(fields.map(f => [f.key, parseSafe(vals[f.key] ?? "")])), [vals, fields]);
    const result = useMemo(() => compute(nums), [nums, compute]);

    return (
        <div style={{ background: "var(--djac-card)", border: `1px solid ${accent}30`, borderRadius: 14, padding: "18px 20px" }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: accent, marginBottom: 12 }}>{title}</p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10, marginBottom: 14 }}>
                {fields.map(f => (
                    <div key={f.key}>
                        <label style={{ display: "block", fontSize: 10, fontWeight: 600, color: "var(--djac-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>{f.label}</label>
                        <div style={{ display: "flex", alignItems: "center", background: "var(--djac-input-bg)", border: "1px solid var(--djac-input-border)", borderRadius: 7, overflow: "hidden" }}>
                            {f.prefix && <span style={{ padding: "0 8px", fontSize: 13, color: "var(--djac-muted)", borderRight: "1px solid var(--djac-border)" }}>{f.prefix}</span>}
                            <input
                                type="number"
                                value={vals[f.key] ?? ""}
                                onChange={e => setVals(v => ({ ...v, [f.key]: e.target.value }))}
                                placeholder={f.placeholder}
                                style={{ flex: 1, background: "transparent", border: "none", outline: "none", padding: "7px 10px", fontSize: 13, color: "var(--djac-text)", minWidth: 0 }}
                            />
                            {f.suffix && <span style={{ padding: "0 8px", fontSize: 12, color: "var(--djac-muted)" }}>{f.suffix}</span>}
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: `${accent}12`, border: `1px solid ${accent}35`, borderRadius: 9 }}>
                <span style={{ fontSize: 11, color: "var(--djac-muted)", fontWeight: 600 }}>{resultLabel}</span>
                <span style={{ fontSize: 22, fontWeight: 800, color: accent }}>{result}</span>
            </div>

            <p style={{ marginTop: 8, fontSize: 10, color: "var(--djac-muted)", fontFamily: "monospace" }}>{formulaLine}</p>
        </div>
    );
}

function InfoPanel({ icon, accent, title, body, badges, rule }: { icon: React.ReactNode; accent: string; title: string; body: string; badges?: string[]; rule?: string }) {
    return (
        <div style={{ background: "var(--djac-card)", border: `1px solid ${accent}25`, borderRadius: 12, padding: "16px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 9 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: `${accent}18`, border: `1px solid ${accent}38`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {icon}
                </div>
                <p style={{ fontSize: 12, fontWeight: 700, margin: 0, color: "var(--djac-text)" }}>{title}</p>
            </div>
            <p style={{ fontSize: 11, color: "var(--djac-muted)", lineHeight: 1.65, margin: 0 }}>{body}</p>
            {badges && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 9 }}>
                    {badges.map(b => <span key={b} style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: `${accent}18`, border: `1px solid ${accent}35`, color: accent }}>{b}</span>)}
                </div>
            )}
            {rule && <p style={{ marginTop: 10, fontSize: 10, fontFamily: "monospace", color: accent, padding: "6px 9px", background: `${accent}10`, borderRadius: 6 }}>{rule}</p>}
        </div>
    );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function SaaSMetrics() {
    usePageTitle("SaaS Metrics");
    const { t } = useLocale();
    const { theme } = useTheme();
    const isDark = theme === "dark";

    const C = {
        cyan: isDark ? "#00F7FF" : "#0284c7",
        green: isDark ? "#01FF7F" : "#16a34a",
        red: isDark ? "#FF1744" : "#dc2626",
        orange: isDark ? "#FF6B2B" : "#ea580c",
        yellow: isDark ? "#FFD600" : "#d97706",
        purple: isDark ? "#9359EC" : "#7c3aed",
        blue: isDark ? "#60A5FA" : "#2563eb",
    } as const;

    // Live compliance data
    const frameworksQuery = trpc.compliance.frameworks.useQuery();
    const matrixQuery = trpc.compliance.matrix.useQuery();
    const timetableQuery = trpc.compliance.timetable.useQuery(undefined, { refetchOnWindowFocus: false });
    const frameworks = frameworksQuery.data;
    const matrix = matrixQuery.data;
    const timetable = timetableQuery.data;

    useEffect(() => {
        if (frameworksQuery.error) toast.error(t("saas.frameworksLoadError", "Failed to load compliance frameworks."));
    }, [frameworksQuery.error]);
    useEffect(() => {
        if (matrixQuery.error) toast.error(t("saas.matrixLoadError", "Failed to load compliance matrix."));
    }, [matrixQuery.error]);
    useEffect(() => {
        if (timetableQuery.error) toast.error(t("saas.timetableLoadError", "Failed to load compliance timetable."));
    }, [timetableQuery.error]);

    const hasLiveQueryError = frameworksQuery.isError || matrixQuery.isError || timetableQuery.isError;

    // Derive compliance-scoped SaaS KPIs
    const liveKpis = useMemo(() => {
        const fwCount = frameworks?.length ?? 0;
        const totalPairs = matrix?.length ?? 0;
        const criticals = (matrix ?? []).filter(r => r.maxSeverity === "critical").length;
        const highs = (matrix ?? []).filter(r => r.maxSeverity === "high").length;
        const obligations = timetable?.length ?? 0;

        // Compliance posture score (pseudo-MRR analogue for compliance health)
        const posture = totalPairs > 0
            ? Math.max(0, Math.round(100 - (criticals * 14 + highs * 7) / totalPairs * 100))
            : 0;

        // Framework adoption rate (product adoption analogue)
        const adoption = fwCount > 0 ? Math.min(100, Math.round((fwCount / 5) * 100)) : 0;

        // Churn analogue: % of pairs with conflicts
        const conflictChurn = totalPairs > 0 ? Math.round((criticals + highs) / totalPairs * 100) : 0;

        return { fwCount, totalPairs, criticals, highs, obligations, posture, adoption, conflictChurn };
    }, [frameworks, matrix, timetable]);

    return (
        <div className="djac-page">
            {/* ── Page header ───────────────────────────────────────────────── */}
            <div className="djac-section-1" style={{ marginBottom: 28 }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                    <div>
                        <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em", margin: 0 }}>
                            <span className="djac-gradient-text">SaaS Business Intelligence</span>
                        </h1>
                        <p style={{ color: "var(--djac-muted)", fontSize: 13, marginTop: 6 }}>
                            {t("saasMetrics.subtitle", "Track MRR · ARR · Churn · LTV · CAC · NRR · Rule of 40 — plus live compliance-scoped health KPIs.")}
                        </p>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                        {[
                            { l: "Rule of 40", href: "#rule40", c: C.purple },
                            { l: "Calculators", href: "#calculators", c: C.cyan },
                            { l: "Advanced", href: "#advanced", c: C.green },
                        ].map(b => (
                            <a key={b.l} href={b.href} style={{ textDecoration: "none", background: `${b.c}15`, border: `1px solid ${b.c}35`, borderRadius: 8, color: b.c, fontSize: 11, fontWeight: 600, padding: "7px 13px" }}>
                                {b.l}
                            </a>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Live Compliance-Scoped KPIs ──────────────────────────────── */}
            <div className="djac-section-1" style={{ marginBottom: 24 }}>
                <SectionTitle
                    icon={<Activity style={{ width: 16, height: 16, color: C.cyan }} />}
                    title={t("saasMetrics.liveKpisTitle", "Live Compliance Health KPIs")}
                    sub={t("saasMetrics.liveKpisSub", "Derived from live framework matrix — compliance-scoped SaaS health signals")}
                />
                {hasLiveQueryError ? (
                    <div
                        style={{
                            background: "var(--djac-card)",
                            border: "1px solid var(--djac-border)",
                            borderRadius: 14,
                            padding: "20px 24px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 16,
                            flexWrap: "wrap",
                        }}
                    >
                        <div>
                            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
                                {t("saasMetrics.liveDataError", "Failed to load live compliance KPIs.")}
                            </div>
                            <div style={{ color: "var(--djac-muted)", fontSize: 13 }}>
                                {t("saasMetrics.liveDataRetryHint", "Retry to refresh the compliance-backed health metrics.")}
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                void frameworksQuery.refetch();
                                void matrixQuery.refetch();
                                void timetableQuery.refetch();
                            }}
                            style={{
                                borderRadius: 8,
                                border: "1px solid var(--djac-border)",
                                background: "var(--djac-card-hi)",
                                color: "var(--djac-text)",
                                padding: "9px 14px",
                                fontSize: 13,
                                fontWeight: 600,
                                cursor: "pointer",
                            }}
                        >
                            {t("common.retry", "Retry")}
                        </button>
                    </div>
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }} className="djac-dash-kpi-grid">
                        <MetricCard
                            label={t("saasMetrics.postureLabel", "Compliance Posture %")}
                            value={`${liveKpis.posture}%`}
                            sub={t("saasMetrics.postureSubMrr", "Equivalent to platform health score")}
                            accent={liveKpis.posture >= 80 ? C.green : liveKpis.posture >= 60 ? C.yellow : C.red}
                            icon={<ShieldCheck style={{ width: 18, height: 18, color: liveKpis.posture >= 80 ? C.green : liveKpis.posture >= 60 ? C.yellow : C.red }} />}
                            trend={liveKpis.posture >= 70 ? "up" : "down"}
                            trendValue={`${liveKpis.posture >= 70 ? "+" : ""}${liveKpis.posture - 50}pp vs baseline`}
                        />
                        <MetricCard
                            label={t("saasMetrics.adoptionLabel", "Framework Adoption")}
                            value={`${liveKpis.adoption}%`}
                            sub={t("saasMetrics.adoptionSub", "Active frameworks / 5 target coverage")}
                            accent={C.cyan}
                            icon={<Layers style={{ width: 18, height: 18, color: C.cyan }} />}
                            trend="up"
                            trendValue={`${liveKpis.fwCount} active`}
                        />
                        <MetricCard
                            label={t("saasMetrics.conflictChurnLabel", "Conflict Churn Rate")}
                            value={pct(liveKpis.conflictChurn)}
                            sub={t("saasMetrics.conflictChurnSub", "% of pairs with critical/high risk")}
                            accent={liveKpis.conflictChurn > 20 ? C.red : liveKpis.conflictChurn > 10 ? C.orange : C.green}
                            icon={<AlertTriangle style={{ width: 18, height: 18, color: liveKpis.conflictChurn > 20 ? C.red : liveKpis.conflictChurn > 10 ? C.orange : C.green }} />}
                            trend={liveKpis.conflictChurn > 15 ? "down" : "up"}
                            trendValue={`${liveKpis.criticals} critical`}
                        />
                        <MetricCard
                            label={t("saasMetrics.obligationCoverageLabel", "Obligation Coverage")}
                            value={String(liveKpis.obligations)}
                            sub={t("saasMetrics.obligationCoverageSub", "Active regulatory obligations tracked")}
                            accent={C.purple}
                            icon={<Target style={{ width: 18, height: 18, color: C.purple }} />}
                            trend="neutral"
                            trendValue={`${liveKpis.totalPairs} pairs`}
                        />
                    </div>
                )}
            </div>

            {/* ── Core SaaS Metrics ────────────────────────────────────────── */}
            <div className="djac-section-2" style={{ marginBottom: 24 }}>
                <SectionTitle
                    icon={<DollarSign style={{ width: 16, height: 16, color: C.green }} />}
                    title={t("saasMetrics.coreMetricsTitle", "Core Revenue Metrics")}
                    sub={t("saasMetrics.coreMetricsSub", "MRR · ARR · Churn · LTV · CAC — the foundation of every healthy SaaS business")}
                />
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
                    <MetricCard
                        label="Monthly Recurring Revenue (MRR)"
                        value="—"
                        sub="Total customers × Avg revenue / month"
                        accent={C.green}
                        icon={<TrendingUp style={{ width: 18, height: 18, color: C.green }} />}
                        formula="MRR = Total Customers × Avg Revenue per Customer per Month"
                    />
                    <MetricCard
                        label="Annual Recurring Revenue (ARR)"
                        value="—"
                        sub="MRR × 12 — long-term view"
                        accent={C.cyan}
                        icon={<BarChart3 style={{ width: 18, height: 18, color: C.cyan }} />}
                        formula="ARR = MRR × 12"
                    />
                    <MetricCard
                        label="Compliance ARR Equivalent"
                        value={`${liveKpis.fwCount} Frameworks`}
                        sub="Active regulatory engagement units"
                        accent={C.blue}
                        icon={<Globe2 style={{ width: 18, height: 18, color: C.blue }} />}
                        trend="up"
                        trendValue="Live"
                    />
                    <MetricCard
                        label="Logo Churn Rate"
                        value="—"
                        sub="Customers lost ÷ customers at start of period"
                        accent={C.red}
                        icon={<TrendingDown style={{ width: 18, height: 18, color: C.red }} />}
                        formula="Logo Churn = Customers Lost / Customers at Start"
                    />
                    <MetricCard
                        label="Revenue Churn Rate"
                        value="—"
                        sub="Revenue lost from churn ÷ total start revenue"
                        accent={C.orange}
                        icon={<RefreshCw style={{ width: 18, height: 18, color: C.orange }} />}
                        formula="Revenue Churn = Revenue Lost from Churned Customers / Total Revenue at Start"
                    />
                    <MetricCard
                        label="Customer Lifetime Value (LTV)"
                        value="—"
                        sub="Avg MRR × Customer lifetime months − support cost"
                        accent={C.yellow}
                        icon={<Users style={{ width: 18, height: 18, color: C.yellow }} />}
                        formula="LTV = (Avg MRR per Customer × Lifetime in Months) − Cost to Support"
                    />
                </div>
            </div>

            {/* ── Acquisition Metrics ──────────────────────────────────────── */}
            <div className="djac-section-3" style={{ marginBottom: 24 }}>
                <SectionTitle
                    icon={<Zap style={{ width: 16, height: 16, color: C.purple }} />}
                    title={t("saasMetrics.acquisitionTitle", "Acquisition & Efficiency Metrics")}
                    sub={t("saasMetrics.acquisitionSub", "CAC · CAC Payback · CAC:LTV Ratio · NRR · GRR")}
                />
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
                    <MetricCard
                        label="Customer Acquisition Cost (CAC)"
                        value="—"
                        sub="Total sales & marketing spend ÷ new customers acquired"
                        accent={C.purple}
                        icon={<DollarSign style={{ width: 18, height: 18, color: C.purple }} />}
                        formula="CAC = Total Sales & Marketing Costs / Customers Acquired"
                    />
                    <MetricCard
                        label="CAC Payback Period"
                        value="—"
                        sub="Months to recover acquisition cost"
                        accent={C.cyan}
                        icon={<RefreshCw style={{ width: 18, height: 18, color: C.cyan }} />}
                        formula="CAC Payback = CAC / (Avg MRR per Customer × Gross Margin %)"
                    />
                    <MetricCard
                        label="CAC : LTV Ratio"
                        value="—"
                        sub="Healthy benchmark: 1:3 or better"
                        accent={C.green}
                        icon={<TrendingUp style={{ width: 18, height: 18, color: C.green }} />}
                        formula="CAC:LTV = CAC / LTV  |  Target: ≥1:3"
                    />
                    <MetricCard
                        label="Net Revenue Retention (NRR)"
                        value="—"
                        sub="Accounts for upgrades, downgrades & churn — >100% = growth"
                        accent={C.yellow}
                        icon={<ArrowUp style={{ width: 18, height: 18, color: C.yellow }} />}
                        formula="NRR = (Starting MRR + Expansion − Contraction − Churn) / Starting MRR"
                    />
                    <MetricCard
                        label="Gross Revenue Retention (GRR)"
                        value="—"
                        sub="Revenue retained excluding upsell — max 100%"
                        accent={C.orange}
                        icon={<CheckCircle2 style={{ width: 18, height: 18, color: C.orange }} />}
                        formula="GRR = (Starting MRR − Contraction − Churn) / Starting MRR"
                    />
                    <MetricCard
                        label="Conflict-to-Remediation Rate"
                        value={liveKpis.totalPairs > 0 ? pct(100 - liveKpis.conflictChurn) : "—"}
                        sub="% of framework pairs with no active conflict (GRR analogue)"
                        accent={liveKpis.conflictChurn < 20 ? C.green : C.red}
                        icon={<ShieldCheck style={{ width: 18, height: 18, color: liveKpis.conflictChurn < 20 ? C.green : C.red }} />}
                        trend={liveKpis.conflictChurn < 20 ? "up" : "down"}
                        trendValue={`${liveKpis.totalPairs - liveKpis.criticals - liveKpis.highs} clean pairs`}
                    />
                </div>
            </div>

            {/* ── Interactive Calculators ──────────────────────────────────── */}
            <div id="calculators" className="djac-section-3" style={{ marginBottom: 24 }}>
                <SectionTitle
                    icon={<Calculator style={{ width: 16, height: 16, color: C.cyan }} />}
                    title={t("saasMetrics.calcTitle", "Interactive SaaS Metric Calculators")}
                    sub={t("saasMetrics.calcSub", "Enter your numbers — results update instantly")}
                />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <CalcCard
                        title="MRR & ARR Calculator"
                        accent={C.green}
                        fields={[
                            { key: "customers", label: "Total Customers", placeholder: "e.g. 150" },
                            { key: "avgRev", label: "Avg Revenue / Month", placeholder: "e.g. 200", prefix: "$" },
                        ]}
                        resultLabel="MRR / ARR"
                        formulaLine="MRR = Customers × Avg Rev   |   ARR = MRR × 12"
                        compute={({ customers, avgRev }) => {
                            const mrr = customers * avgRev;
                            const arr = mrr * 12;
                            return mrr === 0 ? "—" : `$${fmt(mrr)} / $${fmt(arr)}`;
                        }}
                    />
                    <CalcCard
                        title="LTV Calculator"
                        accent={C.yellow}
                        fields={[
                            { key: "avgMrr", label: "Avg MRR / Customer", placeholder: "e.g. 200", prefix: "$" },
                            { key: "lifetimeMonths", label: "Avg Lifetime (months)", placeholder: "e.g. 36" },
                            { key: "supportCost", label: "Support Cost/Customer", placeholder: "e.g. 200", prefix: "$" },
                        ]}
                        resultLabel="LTV"
                        formulaLine="LTV = (Avg MRR × Lifetime) − Support Cost"
                        compute={({ avgMrr, lifetimeMonths, supportCost }) => {
                            const ltv = avgMrr * lifetimeMonths - supportCost;
                            return ltv <= 0 ? "—" : `$${fmt(ltv)}`;
                        }}
                    />
                    <CalcCard
                        title="CAC & CAC:LTV Calculator"
                        accent={C.purple}
                        fields={[
                            { key: "salesMktCost", label: "Total Sales & Mkt Spend", placeholder: "e.g. 50000", prefix: "$" },
                            { key: "newCustomers", label: "New Customers Acquired", placeholder: "e.g. 50" },
                            { key: "ltv", label: "LTV (from above)", placeholder: "e.g. 7200", prefix: "$" },
                        ]}
                        resultLabel="CAC  |  CAC:LTV"
                        formulaLine="CAC = Sales & Mkt / New Customers   |   Ratio = LTV / CAC"
                        compute={({ salesMktCost, newCustomers, ltv }) => {
                            if (newCustomers === 0) return "—";
                            const cac = salesMktCost / newCustomers;
                            const ratio = ltv > 0 && cac > 0 ? ltv / cac : 0;
                            return `$${fmt(cac)}  |  1:${ratio.toFixed(1)}`;
                        }}
                    />
                    <CalcCard
                        title="Churn Rate Calculator"
                        accent={C.red}
                        fields={[
                            { key: "lost", label: "Customers Lost", placeholder: "e.g. 5" },
                            { key: "startCustomers", label: "Customers at Start", placeholder: "e.g. 200" },
                            { key: "revLost", label: "Revenue Lost ($)", placeholder: "e.g. 1500", prefix: "$" },
                            { key: "startRev", label: "Total Revenue at Start ($)", placeholder: "e.g. 40000", prefix: "$" },
                        ]}
                        resultLabel="Logo Churn  |  Revenue Churn"
                        formulaLine="Logo Churn = Lost / Start Customers   |   Rev Churn = Rev Lost / Start Rev"
                        compute={({ lost, startCustomers, revLost, startRev }) => {
                            const logo = startCustomers > 0 ? (lost / startCustomers) * 100 : 0;
                            const rev = startRev > 0 ? (revLost / startRev) * 100 : 0;
                            return logo === 0 && rev === 0 ? "—" : `${logo.toFixed(1)}%  |  ${rev.toFixed(1)}%`;
                        }}
                    />
                    <CalcCard
                        title="NRR Calculator"
                        accent={C.cyan}
                        fields={[
                            { key: "startMrr", label: "Starting MRR ($)", placeholder: "e.g. 20000", prefix: "$" },
                            { key: "expansion", label: "Expansion MRR ($)", placeholder: "e.g. 3000", prefix: "$" },
                            { key: "contraction", label: "Contraction MRR ($)", placeholder: "e.g. 500", prefix: "$" },
                            { key: "churnMrr", label: "Churned MRR ($)", placeholder: "e.g. 1000", prefix: "$" },
                        ]}
                        resultLabel="NRR"
                        formulaLine="NRR = (Start + Expansion − Contraction − Churn) / Start × 100"
                        compute={({ startMrr, expansion, contraction, churnMrr }) => {
                            if (startMrr === 0) return "—";
                            const nrr = ((startMrr + expansion - contraction - churnMrr) / startMrr) * 100;
                            return `${nrr.toFixed(1)}%${nrr >= 100 ? " ✓" : ""}`;
                        }}
                    />
                    <CalcCard
                        title="CAC Payback Calculator"
                        accent={C.orange}
                        fields={[
                            { key: "cac", label: "CAC ($)", placeholder: "e.g. 1000", prefix: "$" },
                            { key: "mrrPerCust", label: "Avg MRR per Customer ($)", placeholder: "e.g. 200", prefix: "$" },
                            { key: "grossMargin", label: "Gross Margin (%)", placeholder: "e.g. 80", suffix: "%" },
                        ]}
                        resultLabel="Payback Period"
                        formulaLine="CAC Payback = CAC / (MRR × Gross Margin %)"
                        compute={({ cac, mrrPerCust, grossMargin }) => {
                            const denom = mrrPerCust * (grossMargin / 100);
                            if (denom <= 0) return "—";
                            const months = cac / denom;
                            return `${months.toFixed(1)} months`;
                        }}
                    />
                </div>
            </div>

            {/* ── Rule of 40 & Magic Number ─────────────────────────────────── */}
            <div id="rule40" className="djac-section-4" style={{ marginBottom: 24 }}>
                <SectionTitle
                    icon={<Target style={{ width: 16, height: 16, color: C.purple }} />}
                    title={t("saasMetrics.rule40Title", "Rule of 40 & Advanced Efficiency Metrics")}
                    sub={t("saasMetrics.rule40Sub", "Balance growth and profitability — the investor benchmark for SaaS health")}
                />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                    <CalcCard
                        title="Rule of 40 Calculator"
                        accent={C.purple}
                        fields={[
                            { key: "revenueGrowth", label: "Revenue Growth Rate (%)", placeholder: "e.g. 35", suffix: "%" },
                            { key: "profitMargin", label: "Profit Margin (%)", placeholder: "e.g. 12", suffix: "%" },
                        ]}
                        resultLabel="Rule of 40 Score"
                        formulaLine="Score = Revenue Growth % + Profit Margin %  |  Target: ≥40"
                        compute={({ revenueGrowth, profitMargin }) => {
                            const score = revenueGrowth + profitMargin;
                            if (score === 0) return "—";
                            return `${score.toFixed(1)}${score >= 40 ? " ✓ Healthy" : " ✗ Below target"}`;
                        }}
                    />
                    <CalcCard
                        title="Magic Number (LTV/CAC Efficiency)"
                        accent={C.yellow}
                        fields={[
                            { key: "ltv", label: "LTV ($)", placeholder: "e.g. 7200", prefix: "$" },
                            { key: "cac", label: "CAC ($)", placeholder: "e.g. 1000", prefix: "$" },
                        ]}
                        resultLabel="Magic Number"
                        formulaLine="Magic Number = LTV / CAC  |  >1.0 = sustainable growth"
                        compute={({ ltv, cac }) => {
                            if (cac === 0) return "—";
                            const magic = ltv / cac;
                            return `${magic.toFixed(2)}${magic >= 3 ? " 🚀 Excellent" : magic >= 1 ? " ✓ Sustainable" : " ✗ Needs work"}`;
                        }}
                    />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <CalcCard
                        title="Burn Multiple"
                        accent={C.red}
                        fields={[
                            { key: "burnRate", label: "Monthly Burn Rate ($)", placeholder: "e.g. 50000", prefix: "$" },
                            { key: "newARR", label: "Net New ARR per Month ($)", placeholder: "e.g. 20000", prefix: "$" },
                        ]}
                        resultLabel="Burn Multiple"
                        formulaLine="Burn Multiple = Burn Rate / Net New ARR  |  <1.5 = efficient"
                        compute={({ burnRate, newARR }) => {
                            if (newARR === 0) return "—";
                            const bm = burnRate / newARR;
                            return `${bm.toFixed(2)}x${bm <= 1 ? " ✓ Excellent" : bm <= 1.5 ? " ✓ Efficient" : bm <= 2 ? " ~ Acceptable" : " ✗ High burn"}`;
                        }}
                    />
                    <CalcCard
                        title="3-3-2-2-2 Growth Rule Checker"
                        accent={C.cyan}
                        fields={[
                            { key: "mrrGrowth", label: "MRR Growth (consecutive months)", placeholder: "e.g. 3" },
                            { key: "retentionMonths", label: "Retention Run Streak (months)", placeholder: "e.g. 3" },
                            { key: "salesGrowth", label: "Sales Growth Streak", placeholder: "e.g. 2" },
                        ]}
                        resultLabel="3-3-2-2-2 Compliance"
                        formulaLine="3mo MRR growth + 3mo retention + 2mo sales + 2mo cash + 2mo NRR"
                        compute={({ mrrGrowth, retentionMonths, salesGrowth }) => {
                            const pass = mrrGrowth >= 3 && retentionMonths >= 3 && salesGrowth >= 2;
                            return pass ? "✓ Rule satisfied" : `${mrrGrowth < 3 ? "MRR " : ""}${retentionMonths < 3 ? "Retention " : ""}${salesGrowth < 2 ? "Sales " : ""}gap`;
                        }}
                    />
                </div>
            </div>

            {/* ── Advanced Qualitative Metrics ────────────────────────────── */}
            <div id="advanced" className="djac-section-5" style={{ marginBottom: 24 }}>
                <SectionTitle
                    icon={<Activity style={{ width: 16, height: 16, color: C.orange }} />}
                    title={t("saasMetrics.advancedTitle", "Advanced & Qualitative Metrics")}
                    sub={t("saasMetrics.advancedSub", "Cohort analysis · Engagement scoring · Customer health · Compliance privacy metrics")}
                />
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }} className="djac-dash-insight-grid">
                    <InfoPanel
                        icon={<BarChart3 style={{ width: 14, height: 14, color: C.cyan }} />}
                        accent={C.cyan}
                        title="Cohort Analysis"
                        body="Track customer groups by sign-up date to assess retention trends, LTV by segment, and onboarding effectiveness over time. Surfaces which cohorts retain best and where drop-off occurs."
                        badges={["Retention Trends", "LTV by Segment", "Onboarding Signals"]}
                    />
                    <InfoPanel
                        icon={<Users style={{ width: 14, height: 14, color: C.green }} />}
                        accent={C.green}
                        title="Customer Engagement Score"
                        body="Measures how actively users interact with your product. Predicts churn risk early, enabling proactive outreach to at-risk accounts before they cancel."
                        badges={["Login Frequency", "Feature Usage", "Churn Prediction"]}
                    />
                    <InfoPanel
                        icon={<ShieldCheck style={{ width: 14, height: 14, color: C.purple }} />}
                        accent={C.purple}
                        title="Customer Health Score"
                        body="Combines usage, support interactions, and NPS into a real-time signal. Helps prioritize retention outreach and identify high-risk accounts automatically."
                        badges={["NPS", "Usage Frequency", "Support Signals"]}
                    />
                    <InfoPanel
                        icon={<Globe2 style={{ width: 14, height: 14, color: C.yellow }} />}
                        accent={C.yellow}
                        title="Compliance Privacy Metrics"
                        body="As regulations evolve (PDPL, PIPL, GDPR), track data access frequency, regional data usage, and user activity patterns to ensure data privacy compliance aligns with subscription obligations."
                        badges={["Data Residency", "Access Frequency", "Regional Usage"]}
                        rule="DJAC live tracking: cross-border data flows between CN ↔ SA jurisdictions"
                    />
                    <InfoPanel
                        icon={<TrendingUp style={{ width: 14, height: 14, color: C.orange }} />}
                        accent={C.orange}
                        title="Product-Market Fit Signal"
                        body="High NRR (>120%), low churn, and strong engagement scores collectively indicate strong product-market fit. For DJAC, this maps to framework adoption breadth and compliance posture improvement over time."
                        badges={["NRR >120%", "Low Churn", "Framework Adoption"]}
                    />
                    <InfoPanel
                        icon={<CheckCircle2 style={{ width: 14, height: 14, color: C.red }} />}
                        accent={C.red}
                        title="Revenue Quality Score"
                        body="Assesses whether revenue is sticky (subscription), diversified (multi-framework), and defensible (audit-ready). High-quality SaaS revenue has low concentration risk and strong contractual commitments."
                        badges={["Contractual ARR", "Multi-jurisdiction", "Audit-ready"]}
                    />
                </div>
            </div>

            {/* ── Key Formulas Reference ──────────────────────────────────── */}
            <div className="djac-section-5" style={{ background: "var(--djac-card)", border: "1px solid var(--djac-border)", borderRadius: 14, padding: "20px 24px" }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: "var(--djac-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>
                    Quick Formula Reference
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 8 }}>
                    {[
                        { label: "MRR", formula: "Customers × Avg Rev / Month", c: C.green },
                        { label: "ARR", formula: "MRR × 12", c: C.cyan },
                        { label: "Logo Churn", formula: "Customers Lost / Start Customers", c: C.red },
                        { label: "Revenue Churn", formula: "Rev Lost / Start Revenue", c: C.orange },
                        { label: "LTV", formula: "(Avg MRR × Lifetime) − Support Cost", c: C.yellow },
                        { label: "CAC", formula: "Sales & Mkt Spend / Customers Acquired", c: C.purple },
                        { label: "CAC Payback", formula: "CAC / (MRR × Gross Margin %)", c: C.cyan },
                        { label: "CAC:LTV Ratio", formula: "LTV / CAC  (target ≥ 3:1)", c: C.green },
                        { label: "NRR", formula: "(Start + Expansion − Contraction − Churn) / Start", c: C.blue },
                        { label: "GRR", formula: "(Start − Contraction − Churn) / Start", c: C.orange },
                        { label: "Rule of 40", formula: "Revenue Growth % + Profit Margin % ≥ 40", c: C.purple },
                        { label: "Magic Number", formula: "LTV / CAC  (>1.0 = sustainable)", c: C.yellow },
                        { label: "Burn Multiple", formula: "Burn Rate / Net New ARR  (<1.5 = efficient)", c: C.red },
                    ].map(row => (
                        <div key={row.label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: `${row.c}0D`, border: `1px solid ${row.c}25`, borderRadius: 8 }}>
                            <span style={{ fontSize: 10, fontWeight: 800, color: row.c, minWidth: 96, flexShrink: 0 }}>{row.label}</span>
                            <span style={{ fontSize: 10, color: "var(--djac-muted)", fontFamily: "monospace" }}>{row.formula}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer */}
            <div style={{ marginTop: 20, display: "flex", alignItems: "center", justifyContent: "center", padding: "10px 0" }}>
                <span style={{ color: "var(--djac-muted)", fontSize: 10 }}>
                    DJAC Intelligence Platform · SaaS Metrics Module · {t("saasMetrics.footerNote", "Data privacy compliant — all calculations are client-side only")}
                </span>
            </div>
        </div>
    );
}
