/**
 * RegulatoryPulseMatrix
 * ──────────────────────────────────────────────────────────────────────────────
 * Three-panel compliance intelligence widget:
 *   1. Regulatory Pulse feed — recent CAC/SDAIA/NCA enforcement actions
 *   2. Risk Trend line chart — penalty exposure over 12-month simulation
 *   3. PIPL Penalty Calculator — 5% annual revenue jump on personal-data scope
 *
 * Recharts is cast to FC to satisfy TS strict under React 19.
 */
import { useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "@/lib/recharts-compat";
import { useTheme } from "@/contexts/useTheme";
import { useLocale } from "@/contexts/useLocale";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    AlertTriangle, CheckCircle2, Scale, Calculator,
    TrendingUp, Building2, ShieldAlert, Bell,
} from "lucide-react";

// ── Enforcement action feed ───────────────────────────────────────────────────
interface EnforcementAction {
    id: string;
    regulator: string;
    jurisdiction: string;
    title: string;
    type: "penalty" | "guidance" | "investigation" | "suspension";
    severity: "low" | "medium" | "high" | "critical";
    date: string;
    penalty?: string;
    article?: string;
}

const ENFORCEMENT_FEED: EnforcementAction[] = [
    {
        id: "cac-2025-07",
        regulator: "CAC",
        jurisdiction: "cn",
        title: "Cross-Border Data Transfer Penalty — Tech Sector",
        type: "penalty",
        severity: "critical",
        date: "2025-07",
        penalty: "¥ 8.0M",
        article: "PIPL Art. 38–40",
    },
    {
        id: "sdaia-2025-06",
        regulator: "SDAIA",
        jurisdiction: "sa",
        title: "Personal Data Processing Guidance Update",
        type: "guidance",
        severity: "medium",
        date: "2025-06",
        article: "PDPL Art. 12–15",
    },
    {
        id: "nca-2025-05",
        regulator: "NCA",
        jurisdiction: "sa",
        title: "Critical Infrastructure Data Residency Audit",
        type: "investigation",
        severity: "high",
        date: "2025-05",
        article: "ECC Controls 2.0",
    },
    {
        id: "cac-2025-04",
        regulator: "CAC",
        jurisdiction: "cn",
        title: "Security Assessment — Foreign-Invested Cloud",
        type: "penalty",
        severity: "high",
        date: "2025-04",
        penalty: "¥ 3.5M",
        article: "DSL Art. 31",
    },
    {
        id: "sdaia-2025-03",
        regulator: "SDAIA",
        jurisdiction: "sa",
        title: "Cross-Border Transfer Consent Requirements",
        type: "guidance",
        severity: "medium",
        date: "2025-03",
        article: "PDPL Art. 29",
    },
    {
        id: "cac-2025-02",
        regulator: "CAC",
        jurisdiction: "cn",
        title: "Generative AI Compliance Order",
        type: "penalty",
        severity: "critical",
        date: "2025-02",
        penalty: "¥ 14.5M",
        article: "Gen AI Reg. Art. 4",
    },
];

// ── Risk trend simulation ─────────────────────────────────────────────────────
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function buildRiskTrend(hasPersonalData: boolean, revenue: number) {
    const piplMax = Math.round(revenue * 0.05);
    const pdplMax = Math.round(revenue * 0.03);

    return MONTHS.map((month, i) => {
        // Simulate gradual risk exposure growth + seasonal audit spikes
        const seasonalFactor = [1, 1.05, 1.1, 1.3, 1.25, 1.2, 1.15, 1.1, 1.4, 1.35, 1.3, 1.5][i];
        const pipl = hasPersonalData
            ? Math.round(piplMax * (0.2 + i * 0.07) * seasonalFactor)
            : Math.round((piplMax * 0.3) * (0.15 + i * 0.04) * seasonalFactor);
        const pdpl = Math.round(pdplMax * (0.15 + i * 0.06) * seasonalFactor);
        const combined = pipl + pdpl;
        return { month, pipl, pdpl, combined, limit: piplMax + pdplMax };
    });
}

// ── Helper badges ─────────────────────────────────────────────────────────────
function SeverityBadge({ level, isDark }: { level: string; isDark: boolean }) {
    const map: Record<string, [string, string]> = {
        critical: [isDark ? "#FF1744" : "#dc2626", isDark ? "rgba(255,23,68,0.12)" : "rgba(220,38,38,0.08)"],
        high: [isDark ? "#FF6B2B" : "#ea580c", isDark ? "rgba(255,107,43,0.12)" : "rgba(234,88,12,0.08)"],
        medium: [isDark ? "#FFD600" : "#d97706", isDark ? "rgba(255,214,0,0.12)" : "rgba(217,119,6,0.08)"],
        low: [isDark ? "#01FF7F" : "#16a34a", isDark ? "rgba(1,255,127,0.12)" : "rgba(22,163,74,0.08)"],
    };
    const [c, bg] = map[level] ?? map.medium;
    return (
        <span style={{ fontSize: 9, fontWeight: 700, color: c, background: bg, border: `1px solid ${c}40`, borderRadius: 3, padding: "1px 5px", textTransform: "uppercase" }}>
            {level}
        </span>
    );
}

function TypeIcon({ type }: { type: EnforcementAction["type"] }) {
    switch (type) {
        case "penalty": return <Scale className="h-3.5 w-3.5" />;
        case "guidance": return <CheckCircle2 className="h-3.5 w-3.5" />;
        case "investigation": return <ShieldAlert className="h-3.5 w-3.5" />;
        case "suspension": return <AlertTriangle className="h-3.5 w-3.5" />;
    }
}

// ── Main component ────────────────────────────────────────────────────────────
export function RegulatoryPulseMatrix() {
    const { theme } = useTheme();
    const { t } = useLocale();
    const isDark = theme === "dark";

    const [hasPersonalData, setHasPersonalData] = useState(false);
    const [revenueInput, setRevenueInput] = useState("50000000");
    const [filterJurisdiction, setFilterJurisdiction] = useState<"all" | "cn" | "sa">("all");

    const revenue = useMemo(() => {
        const v = parseFloat(revenueInput.replace(/[^0-9.]/g, ""));
        return isNaN(v) || v <= 0 ? 50_000_000 : v;
    }, [revenueInput]);

    const trendData = useMemo(
        () => buildRiskTrend(hasPersonalData, revenue),
        [hasPersonalData, revenue],
    );

    const piplMaxPenalty = Math.round(revenue * (hasPersonalData ? 0.05 : 0.03));
    const pdplMaxPenalty = Math.round(revenue * 0.03);

    const C = useMemo(() => ({
        cyan: isDark ? "#00F7FF" : "#0284c7",
        green: isDark ? "#01FF7F" : "#16a34a",
        red: isDark ? "#FF1744" : "#dc2626",
        orange: isDark ? "#FF6B2B" : "#ea580c",
        yellow: isDark ? "#FFD600" : "#d97706",
        purple: isDark ? "#9359EC" : "#7c3aed",
    }), [isDark]);

    const TOOLTIP_STYLE = useMemo<React.CSSProperties>(() => ({
        background: isDark ? "#0D1B6E" : "#f8faff",
        border: `1px solid ${C.cyan}40`,
        borderRadius: 8,
        color: "var(--djac-text)",
        fontSize: 11,
    }), [isDark, C.cyan]);

    const filteredFeed = ENFORCEMENT_FEED.filter(
        a => filterJurisdiction === "all" || a.jurisdiction === filterJurisdiction,
    );

    // matrix data for gap counts
    const matrixQuery = trpc.compliance.matrix.useQuery(undefined, { staleTime: 60_000 });
    const gapCount = useMemo(() => {
        const m = matrixQuery.data;
        if (!m) return null;
        // matrix is Array<{ source, target, maxSeverity, relationship }>
        return (m as Array<{ maxSeverity?: string }>).filter(row => row.maxSeverity === "critical" || row.maxSeverity === "high").length;
    }, [matrixQuery.data]);

    const formatCurrency = (n: number, currency: "sar" | "cny") => {
        const symbol = currency === "sar" ? "SAR " : "¥ ";
        return symbol + new Intl.NumberFormat("en").format(n);
    };

    return (
        <div style={{ background: "var(--djac-card)", border: "1px solid var(--djac-border)", borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: "column", height: "100%" }}>

            {/* Header */}
            <div style={{ padding: "14px 18px 10px", borderBottom: "1px solid var(--djac-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                    <p style={{ color: "var(--djac-muted)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 3 }}>
                        {t("regPulse.sectionLabel", "Conflict & Harmonization")}
                    </p>
                    <h3 style={{ color: "var(--djac-text)", fontSize: 14, fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
                        <Bell className="h-4 w-4" style={{ color: C.cyan }} />
                        {t("regPulse.title", "Regulatory Pulse Matrix")}
                    </h3>
                </div>
                {gapCount != null && (
                    <Badge variant="outline" style={{ fontSize: 10, height: 20, borderColor: `${C.orange}50`, color: C.orange }}>
                        <AlertTriangle className="h-2.5 w-2.5 mr-1" />
                        {gapCount} gaps
                    </Badge>
                )}
            </div>

            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 0 }}>

                {/* ── Section 1: Enforcement feed ─────────────────────────────────────── */}
                <div style={{ padding: "12px 18px", borderBottom: "1px solid var(--djac-border)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                        <span style={{ color: "var(--djac-muted)", fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                            {t("regPulse.enforcementActions", "Enforcement Actions")}
                        </span>
                        <div style={{ display: "flex", gap: 4 }}>
                            {(["all", "cn", "sa"] as const).map(j => (
                                <button
                                    key={j}
                                    type="button"
                                    onClick={() => setFilterJurisdiction(j)}
                                    style={{
                                        fontSize: 9, fontWeight: 700, padding: "1px 7px", borderRadius: 4, border: "1px solid var(--djac-border)",
                                        cursor: "pointer",
                                        background: filterJurisdiction === j ? C.cyan : "transparent",
                                        color: filterJurisdiction === j ? (isDark ? "#000" : "#fff") : "var(--djac-muted)",
                                        transition: "all 0.2s",
                                    }}
                                >
                                    {j === "all" ? "All" : j === "cn" ? "🇨🇳 China" : "🇸🇦 Saudi Arabia"}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 200, overflowY: "auto" }}>
                        {filteredFeed.map(action => {
                            const typeColorMap: Record<string, string> = {
                                penalty: C.red,
                                guidance: C.green,
                                investigation: C.orange,
                                suspension: C.yellow,
                            };
                            const typeColor = typeColorMap[action.type] ?? C.cyan;

                            return (
                                <div
                                    key={action.id}
                                    style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "7px 10px", background: "var(--djac-bg)", borderRadius: 7, border: "1px solid var(--djac-border)", borderLeft: `3px solid ${typeColor}` }}
                                >
                                    <div style={{ color: typeColor, marginTop: 1, flexShrink: 0 }}>
                                        <TypeIcon type={action.type} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
                                            <span style={{ color: typeColor, fontSize: 10, fontWeight: 700 }}>{action.regulator}</span>
                                            <span style={{ color: "var(--djac-muted)", fontSize: 9 }}>·</span>
                                            <SeverityBadge level={action.severity} isDark={isDark} />
                                            <span style={{ color: "var(--djac-muted)", fontSize: 9, marginLeft: "auto" }}>{action.date}</span>
                                        </div>
                                        <p style={{ color: "var(--djac-text)", fontSize: 11, margin: "2px 0 0", lineHeight: 1.3 }}>
                                            {action.title}
                                        </p>
                                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                                            {action.article && (
                                                <span style={{ color: "var(--djac-muted)", fontSize: 9.5 }}>{action.article}</span>
                                            )}
                                            {action.penalty && (
                                                <span style={{ color: C.red, fontSize: 9.5, fontWeight: 700 }}>Penalty: {action.penalty}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── Section 2: Risk trend chart ─────────────────────────────────────── */}
                <div style={{ padding: "12px 18px", borderBottom: "1px solid var(--djac-border)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                        <span style={{ color: "var(--djac-muted)", fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                            <TrendingUp className="h-3 w-3 inline mr-1.5" style={{ verticalAlign: "middle", color: C.orange }} />
                            {t("regPulse.riskTrend", "Penalty Exposure Trend (12-month)")}
                        </span>
                        {hasPersonalData && (
                            <Badge style={{ fontSize: 9, height: 18, background: `${C.orange}20`, color: C.orange, border: `1px solid ${C.orange}50` }}>
                                ⚡ PIPL 5% cap active
                            </Badge>
                        )}
                    </div>
                    <ResponsiveContainer width="100%" height={160}>
                        <LineChart data={trendData} margin={{ top: 5, right: 10, bottom: 5, left: 5 }}>
                            <CartesianGrid stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)"} strokeDasharray="3 4" />
                            <XAxis dataKey="month" tick={{ fill: "var(--djac-muted)", fontSize: 9 }} axisLine={false} tickLine={false} />
                            <YAxis
                                tick={{ fill: "var(--djac-muted)", fontSize: 9 }}
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={(v: number) => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1_000 ? `${(v / 1_000).toFixed(0)}K` : String(v)}
                            />
                            <Tooltip
                                contentStyle={TOOLTIP_STYLE}
                                formatter={(value: number, name: string) => [
                                    new Intl.NumberFormat("en").format(value),
                                    name === "pipl" ? "PIPL Exposure" : name === "pdpl" ? "PDPL Exposure" : "Combined",
                                ]}
                            />
                            <ReferenceLine y={piplMaxPenalty + pdplMaxPenalty} stroke={C.red} strokeDasharray="4 4" label={{ value: "Max", fill: C.red, fontSize: 9 }} />
                            <Line type="monotone" dataKey="pdpl" stroke={C.yellow} strokeWidth={1.8} dot={false} />
                            <Line type="monotone" dataKey="pipl" stroke={C.orange} strokeWidth={1.8} dot={false} />
                            <Line type="monotone" dataKey="combined" stroke={C.red} strokeWidth={2} dot={false} strokeDasharray="4 3" />
                        </LineChart>
                    </ResponsiveContainer>
                    <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
                        {[["pdpl", C.yellow, "PDPL Exposure"], ["pipl", C.orange, "PIPL Exposure"], ["combined", C.red, "Combined"]].map(([k, c, l]) => (
                            <div key={k as string} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                <div style={{ width: 16, height: 2, background: c as string, borderRadius: 1 }} />
                                <span style={{ color: "var(--djac-muted)", fontSize: 9.5 }}>{l as string}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Section 3: Penalty calculator ──────────────────────────────────── */}
                <div style={{ padding: "12px 18px" }}>
                    <span style={{ color: "var(--djac-muted)", fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", display: "flex", alignItems: "center", gap: 5, marginBottom: 10 }}>
                        <Calculator className="h-3 w-3" style={{ color: C.purple }} />
                        {t("regPulse.calculator", "PIPL Penalty Calculator")}
                    </span>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <div>
                            <Label style={{ fontSize: 10, color: "var(--djac-muted)", marginBottom: 4, display: "block" }}>
                                {t("regPulse.annualRevenue", "Estimated Annual Revenue (SAR / CNY)")}
                            </Label>
                            <Input
                                type="text"
                                value={revenueInput}
                                onChange={e => setRevenueInput(e.target.value)}
                                placeholder="50000000"
                                style={{ height: 30, fontSize: 12, fontFamily: "monospace" }}
                            />
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <Switch
                                id="personalDataSwitch"
                                checked={hasPersonalData}
                                onCheckedChange={setHasPersonalData}
                            />
                            <Label
                                htmlFor="personalDataSwitch"
                                style={{ fontSize: 11, color: hasPersonalData ? C.orange : "var(--djac-muted)", cursor: "pointer", fontWeight: hasPersonalData ? 700 : 400 }}
                            >
                                {hasPersonalData
                                    ? t("regPulse.personalDataOn", "⚡ Personal Data Component: ACTIVE (PIPL 5% cap)")
                                    : t("regPulse.personalDataOff", "Personal Data Component: Off (PIPL 3% cap)")
                                }
                            </Label>
                        </div>

                        {/* Penalty result card */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                            {[
                                { label: "PIPL Max Penalty", value: formatCurrency(piplMaxPenalty, "cny"), color: C.orange, article: hasPersonalData ? "Art. 66 (5%)" : "Art. 66 (3%)", flag: "🇨🇳" },
                                { label: "PDPL Max Penalty", value: formatCurrency(pdplMaxPenalty, "sar"), color: C.yellow, article: "Art. 23–24 (3%)", flag: "🇸🇦" },
                            ].map(({ label, value, color, article, flag }) => (
                                <div
                                    key={label}
                                    style={{ padding: "10px 12px", background: `${color}10`, border: `1px solid ${color}40`, borderRadius: 8 }}
                                >
                                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
                                        <Building2 className="h-3 w-3" style={{ color, flexShrink: 0 }} />
                                        <span style={{ color, fontSize: 9.5, fontWeight: 700 }}>{flag} {label}</span>
                                    </div>
                                    <p style={{ color, fontSize: 16, fontWeight: 800, margin: "2px 0 3px", fontFamily: "monospace" }}>{value}</p>
                                    <p style={{ color: "var(--djac-muted)", fontSize: 9, margin: 0 }}>{article}</p>
                                </div>
                            ))}
                        </div>
                        <div style={{ padding: "8px 12px", background: isDark ? "rgba(147,89,236,0.1)" : "rgba(124,58,237,0.07)", border: `1px solid ${C.purple}40`, borderRadius: 8 }}>
                            <p style={{ margin: 0, fontSize: 11, color: "var(--djac-text)" }}>
                                <strong style={{ color: C.purple }}>Combined maximum exposure:</strong>{" "}
                                <span style={{ fontFamily: "monospace", fontWeight: 700 }}>
                                    {formatCurrency(piplMaxPenalty + pdplMaxPenalty, "sar")}
                                </span>
                                {hasPersonalData && (
                                    <span style={{ color: C.orange, fontWeight: 700 }}>
                                        {" "}(+{formatCurrency(Math.round(revenue * 0.02), "sar")} PIPL personal-data increment)
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
