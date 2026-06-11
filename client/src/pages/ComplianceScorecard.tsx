/**
 * Compliance Scorecard  —  /compliance-scorecard
 *
 * Executive-level org compliance health dashboard.
 *
 * Sections:
 *  1. KPI tiles — overall score gauge, vendor counts, risk count, framework coverage
 *  2. Risk distribution donut + status distribution + framework bar chart
 *  3. Recent assessments table
 *  4. Gap severity breakdown + recent compliance reports
 */
import type React from "react";
import { useState } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as TooltipRC, Legend, ResponsiveContainer } from "@/lib/recharts-compat";
import { trpc } from "@/lib/trpc";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useLocale } from "@/contexts/useLocale";
import { useTheme } from "@/contexts/useTheme";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    BarChart2,
    Shield,
    TrendingUp,
    AlertTriangle,
    CheckCircle2,
    RefreshCw,
    Loader2,
    FileText,
    Target,
    Users,
    AlertCircle,
} from "lucide-react";

// ─── Score gauge SVG ─────────────────────────────────────────────────────────
function ScoreGauge({ value, color }: { value: number | null; color: string }) {
    const r = 60, cx = 80, cy = 80;
    const START = (-210 * Math.PI) / 180;
    const SPAN = (240 * Math.PI) / 180;
    const pct = value != null ? Math.min(1, value / 100) : 0;
    const END = START + SPAN * pct;
    function pt(a: number) {
        return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
    }
    const s = pt(START);
    const e = pt(END);
    const bg1 = pt(START);
    const bg2 = pt(START + SPAN);
    const largeArc = SPAN > Math.PI ? 1 : 0;
    const fillArc = SPAN * pct > Math.PI ? 1 : 0;
    return (
        <svg width={160} height={120} viewBox="0 0 160 160" aria-label={`Score: ${value ?? "N/A"}`}>
            {/* track */}
            <path
                d={`M${bg1.x},${bg1.y} A${r},${r} 0 ${largeArc},1 ${bg2.x},${bg2.y}`}
                fill="none"
                stroke="var(--djac-surface)"
                strokeWidth={12}
                strokeLinecap="round"
            />
            {/* fill */}
            {value != null && value > 0 && (
                <path
                    d={`M${s.x},${s.y} A${r},${r} 0 ${fillArc},1 ${e.x},${e.y}`}
                    fill="none"
                    stroke={color}
                    strokeWidth={12}
                    strokeLinecap="round"
                />
            )}
            {/* label */}
            <text
                x={cx}
                y={cy + 8}
                textAnchor="middle"
                fontSize={28}
                fontWeight={700}
                fill={color}
            >
                {value != null ? value : "—"}
            </text>
            <text
                x={cx}
                y={cy + 28}
                textAnchor="middle"
                fontSize={11}
                fill="var(--djac-muted)"
            >
                / 100
            </text>
        </svg>
    );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function scoreColor(score: number | null): string {
    if (score == null) return "var(--djac-muted)";
    if (score >= 80) return "var(--djac-green)";
    if (score >= 60) return "var(--djac-yellow)";
    if (score >= 40) return "var(--djac-orange)";
    return "var(--djac-red)";
}

function riskBadge(level: string | null) {
    const styles: Record<string, string> = {
        low: "background:var(--djac-green-muted);color:var(--djac-green)",
        medium: "background:var(--djac-yellow-muted);color:var(--djac-yellow)",
        high: "background:var(--djac-orange-muted);color:var(--djac-orange)",
        critical: "background:var(--djac-red-muted);color:var(--djac-red)",
    };
    const style = styles[level ?? ""] ?? "background:var(--djac-surface);color:var(--djac-muted)";
    return (
        <span
            style={{
                ...(Object.fromEntries(
                    style.split(";").map((e) => e.split(":").map((s) => s.trim())),
                ) as React.CSSProperties),
                padding: "2px 8px",
                borderRadius: 9999,
                fontSize: 11,
                fontWeight: 600,
                textTransform: "capitalize",
            }}
        >
            {level ?? "—"}
        </span>
    );
}

function fmtDate(iso: string): string {
    try {
        return new Date(iso).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    } catch {
        return iso;
    }
}

const RISK_COLORS: Record<string, string> = {
    low: "#22c55e",
    medium: "#eab308",
    high: "#f97316",
    critical: "#ef4444",
};

const STATUS_COLORS: Record<string, string> = {
    compliant: "#22c55e",
    partial: "#eab308",
    non_compliant: "#ef4444",
};

// ─── KPI Tile ────────────────────────────────────────────────────────────────
function KpiTile({
    icon,
    label,
    value,
    sub,
    color,
}: {
    icon: React.ReactNode;
    label: string;
    value: React.ReactNode;
    sub?: string;
    color?: string;
}) {
    return (
        <Card style={{ flex: 1, minWidth: 140 }}>
            <CardContent style={{ padding: "16px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span style={{ color: color ?? "var(--djac-accent)" }}>{icon}</span>
                    <span style={{ fontSize: 12, color: "var(--djac-muted)", fontWeight: 500 }}>
                        {label}
                    </span>
                </div>
                <div
                    style={{
                        fontSize: 28,
                        fontWeight: 700,
                        color: color ?? "var(--djac-fg)",
                        lineHeight: 1.1,
                    }}
                >
                    {value}
                </div>
                {sub && (
                    <div style={{ fontSize: 11, color: "var(--djac-muted)", marginTop: 4 }}>
                        {sub}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function ComplianceScorecard() {
    const { t } = useLocale();
    const { theme } = useTheme();
    const [refetchToken, setRefetchToken] = useState(0);

    usePageTitle(t("scorecard.title", "Compliance Scorecard"));

    const { data, isLoading, isError, refetch } = trpc.scorecard.orgScorecard.useQuery(
        undefined,
        { refetchInterval: 60_000 },
    );

    const isDark = theme === "dark";
    const gridColor = isDark ? "#334155" : "#e2e8f0";
    const tickColor = isDark ? "#94a3b8" : "#64748b";

    // Risk distribution chart data
    const riskPieData = data
        ? Object.entries(data.riskDistribution)
            .filter(([, v]) => v > 0)
            .map(([k, v]) => ({ name: k, value: v }))
        : [];

    // Status distribution data
    const statusPieData = data
        ? Object.entries(data.statusDistribution)
            .filter(([, v]) => v > 0)
            .map(([k, v]) => ({
                name: k.replace("_", " "),
                value: v,
                key: k,
            }))
        : [];

    // Framework bar data
    const fwBarData = data?.frameworks ?? [];

    // Gap severity
    const gapData = data
        ? Object.entries(data.gapsBySeverity).map(([k, v]) => ({
            name: k,
            gaps: v,
            fill: RISK_COLORS[k] ?? "#94a3b8",
        }))
        : [];

    const totalGaps = data ? Object.values(data.gapsBySeverity).reduce((a, b) => a + b, 0) : 0;
    const highCritical = data
        ? data.riskDistribution.high + data.riskDistribution.critical
        : 0;

    return (
        <div className="djac-page">
            {/* ── Header ── */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 24,
                    gap: 12,
                    flexWrap: "wrap",
                }}
            >
                <div>
                    <h1
                        style={{
                            fontSize: 22,
                            fontWeight: 700,
                            color: "var(--djac-fg)",
                            margin: 0,
                        }}
                    >
                        {t("scorecard.title", "Compliance Scorecard")}
                    </h1>
                    <p style={{ fontSize: 13, color: "var(--djac-muted)", margin: "4px 0 0" }}>
                        {t("scorecard.subtitle", "Organization-wide compliance health overview")}
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                        void refetch();
                        setRefetchToken((n) => n + 1);
                    }}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <Loader2 style={{ width: 14, height: 14, marginRight: 6 }} className="animate-spin" />
                    ) : (
                        <RefreshCw style={{ width: 14, height: 14, marginRight: 6 }} />
                    )}
                    {t("scorecard.refresh", "Refresh")}
                </Button>
            </div>

            {/* ── Error state ── */}
            {isError && (
                <Card style={{ marginBottom: 20, borderColor: "var(--djac-red)" }}>
                    <CardContent style={{ padding: "16px 20px", display: "flex", gap: 10, alignItems: "center" }}>
                        <AlertCircle style={{ color: "var(--djac-red)", width: 16, height: 16 }} />
                        <span style={{ fontSize: 13, color: "var(--djac-red)" }}>
                            {t("scorecard.loadError", "Failed to load scorecard data.")}
                        </span>
                    </CardContent>
                </Card>
            )}

            {/* ── KPI Tiles ── */}
            <div
                style={{
                    display: "flex",
                    gap: 16,
                    marginBottom: 24,
                    flexWrap: "wrap",
                    alignItems: "stretch",
                }}
            >
                {/* Overall Score Gauge */}
                <Card style={{ flex: "0 0 auto" }}>
                    <CardHeader style={{ padding: "14px 20px 0" }}>
                        <CardTitle style={{ fontSize: 13, color: "var(--djac-muted)", fontWeight: 500 }}>
                            {t("scorecard.overallScore", "Overall Score")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent style={{ padding: "0 20px 12px", display: "flex", justifyContent: "center" }}>
                        {isLoading ? (
                            <div style={{ width: 160, height: 120, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <Loader2 className="animate-spin" style={{ width: 28, height: 28, color: "var(--djac-muted)" }} />
                            </div>
                        ) : (
                            <ScoreGauge value={data?.overallScore ?? null} color={scoreColor(data?.overallScore ?? null)} />
                        )}
                    </CardContent>
                </Card>

                <KpiTile
                    icon={<Users style={{ width: 16, height: 16 }} />}
                    label={t("scorecard.totalVendors", "Total Vendors")}
                    value={isLoading ? "…" : (data?.totalVendors ?? 0)}
                    sub={t("scorecard.registeredInOrg", "registered in org")}
                />
                <KpiTile
                    icon={<Target style={{ width: 16, height: 16 }} />}
                    label={t("scorecard.assessedVendors", "Assessed")}
                    value={isLoading ? "…" : (data?.assessedVendors ?? 0)}
                    sub={
                        data
                            ? `${data.totalVendors > 0 ? Math.round((data.assessedVendors / data.totalVendors) * 100) : 0}% ${t("scorecard.coverage", "coverage")}`
                            : ""
                    }
                    color="var(--djac-cyan)"
                />
                <KpiTile
                    icon={<AlertTriangle style={{ width: 16, height: 16 }} />}
                    label={t("scorecard.highRisk", "High / Critical")}
                    value={isLoading ? "…" : highCritical}
                    sub={t("scorecard.vendorsAtRisk", "vendors at risk")}
                    color={highCritical > 0 ? "var(--djac-red)" : "var(--djac-green)"}
                />
                <KpiTile
                    icon={<BarChart2 style={{ width: 16, height: 16 }} />}
                    label={t("scorecard.frameworksCovered", "Frameworks")}
                    value={isLoading ? "…" : (data?.frameworks.length ?? 0)}
                    sub={t("scorecard.activeFrameworks", "active frameworks")}
                    color="var(--djac-purple)"
                />
                <KpiTile
                    icon={<Shield style={{ width: 16, height: 16 }} />}
                    label={t("scorecard.totalGaps", "Open Gaps")}
                    value={isLoading ? "…" : totalGaps}
                    sub={t("scorecard.acrossAllVendors", "across all vendors")}
                    color={totalGaps > 5 ? "var(--djac-orange)" : "var(--djac-muted)"}
                />
            </div>

            {/* ── Charts Row ── */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                    gap: 16,
                    marginBottom: 24,
                }}
            >
                {/* Risk Distribution Donut */}
                <Card>
                    <CardHeader style={{ padding: "16px 20px 8px" }}>
                        <CardTitle style={{ fontSize: 14, fontWeight: 600 }}>
                            {t("scorecard.riskDistribution", "Risk Distribution")}
                        </CardTitle>
                        <CardDescription style={{ fontSize: 12 }}>
                            {t("scorecard.latestPerVendor", "Latest assessment per vendor · framework")}
                        </CardDescription>
                    </CardHeader>
                    <CardContent style={{ padding: "0 20px 16px" }}>
                        {isLoading ? (
                            <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <Loader2 className="animate-spin" style={{ width: 24, height: 24, color: "var(--djac-muted)" }} />
                            </div>
                        ) : riskPieData.length === 0 ? (
                            <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--djac-muted)", fontSize: 13 }}>
                                {t("scorecard.noData", "No assessment data")}
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                    <Pie
                                        data={riskPieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={48}
                                        outerRadius={72}
                                        paddingAngle={3}
                                        dataKey="value"
                                        nameKey="name"
                                        label={({ name, percent }: { name: string; percent: number }) =>
                                            `${name} ${(percent * 100).toFixed(0)}%`
                                        }
                                        labelLine={false}
                                    >
                                        {riskPieData.map((entry) => (
                                            <Cell
                                                key={entry.name}
                                                fill={RISK_COLORS[entry.name] ?? "#94a3b8"}
                                            />
                                        ))}
                                    </Pie>
                                    <TooltipRC
                                        contentStyle={{
                                            background: "var(--djac-card)",
                                            border: "1px solid var(--djac-border)",
                                            borderRadius: 8,
                                            fontSize: 12,
                                        }}
                                    />
                                    <Legend
                                        iconType="circle"
                                        iconSize={8}
                                        wrapperStyle={{ fontSize: 12, color: tickColor }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                {/* Compliance Status Donut */}
                <Card>
                    <CardHeader style={{ padding: "16px 20px 8px" }}>
                        <CardTitle style={{ fontSize: 14, fontWeight: 600 }}>
                            {t("scorecard.complianceStatus", "Compliance Status")}
                        </CardTitle>
                        <CardDescription style={{ fontSize: 12 }}>
                            {t("scorecard.verdictBreakdown", "Compliant · Partial · Non-compliant")}
                        </CardDescription>
                    </CardHeader>
                    <CardContent style={{ padding: "0 20px 16px" }}>
                        {isLoading ? (
                            <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <Loader2 className="animate-spin" style={{ width: 24, height: 24, color: "var(--djac-muted)" }} />
                            </div>
                        ) : statusPieData.length === 0 ? (
                            <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--djac-muted)", fontSize: 13 }}>
                                {t("scorecard.noData", "No assessment data")}
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                    <Pie
                                        data={statusPieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={48}
                                        outerRadius={72}
                                        paddingAngle={3}
                                        dataKey="value"
                                        nameKey="name"
                                        label={({ percent }: { name: string; percent: number }) =>
                                            `${(percent * 100).toFixed(0)}%`
                                        }
                                        labelLine={false}
                                    >
                                        {statusPieData.map((entry) => (
                                            <Cell
                                                key={entry.key}
                                                fill={STATUS_COLORS[entry.key] ?? "#94a3b8"}
                                            />
                                        ))}
                                    </Pie>
                                    <TooltipRC
                                        contentStyle={{
                                            background: "var(--djac-card)",
                                            border: "1px solid var(--djac-border)",
                                            borderRadius: 8,
                                            fontSize: 12,
                                        }}
                                    />
                                    <Legend
                                        iconType="circle"
                                        iconSize={8}
                                        wrapperStyle={{ fontSize: 12, color: tickColor }}
                                        formatter={(value: string) =>
                                            value.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())
                                        }
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                {/* Framework Avg Scores Bar */}
                <Card>
                    <CardHeader style={{ padding: "16px 20px 8px" }}>
                        <CardTitle style={{ fontSize: 14, fontWeight: 600 }}>
                            {t("scorecard.frameworkScores", "Framework Avg Scores")}
                        </CardTitle>
                        <CardDescription style={{ fontSize: 12 }}>
                            {t("scorecard.avgScorePerFramework", "Average compliance score per framework")}
                        </CardDescription>
                    </CardHeader>
                    <CardContent style={{ padding: "0 20px 16px" }}>
                        {isLoading ? (
                            <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <Loader2 className="animate-spin" style={{ width: 24, height: 24, color: "var(--djac-muted)" }} />
                            </div>
                        ) : fwBarData.length === 0 ? (
                            <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--djac-muted)", fontSize: 13 }}>
                                {t("scorecard.noFrameworks", "No framework assessments yet")}
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart
                                    data={fwBarData}
                                    margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
                                >
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke={gridColor}
                                        vertical={false}
                                    />
                                    <XAxis
                                        dataKey="code"
                                        tick={{ fill: tickColor, fontSize: 11 }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        domain={[0, 100]}
                                        tick={{ fill: tickColor, fontSize: 11 }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <TooltipRC
                                        contentStyle={{
                                            background: "var(--djac-card)",
                                            border: "1px solid var(--djac-border)",
                                            borderRadius: 8,
                                            fontSize: 12,
                                        }}
                                        formatter={(v: number) => [`${v}`, "Avg Score"]}
                                    />
                                    <Bar
                                        dataKey="avgScore"
                                        radius={[4, 4, 0, 0]}
                                        maxBarSize={48}
                                    >
                                        {fwBarData.map((entry) => (
                                            <Cell
                                                key={entry.code}
                                                fill={scoreColor(entry.avgScore)}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* ── Bottom Row: Recent Assessments + Gap severity + Reports ── */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)",
                    gap: 16,
                    marginBottom: 24,
                    alignItems: "start",
                }}
            >
                {/* Recent Assessments Table */}
                <Card>
                    <CardHeader style={{ padding: "16px 20px 8px" }}>
                        <CardTitle style={{ fontSize: 14, fontWeight: 600 }}>
                            {t("scorecard.recentAssessments", "Recent Assessments")}
                        </CardTitle>
                        <CardDescription style={{ fontSize: 12 }}>
                            {t("scorecard.last5Assessments", "Last 5 vendor assessments")}
                        </CardDescription>
                    </CardHeader>
                    <CardContent style={{ padding: 0 }}>
                        {isLoading ? (
                            <div style={{ padding: "32px", display: "flex", justifyContent: "center" }}>
                                <Loader2 className="animate-spin" style={{ width: 20, height: 20, color: "var(--djac-muted)" }} />
                            </div>
                        ) : !data?.recentAssessments.length ? (
                            <div style={{ padding: "32px", textAlign: "center", color: "var(--djac-muted)", fontSize: 13 }}>
                                {t("scorecard.noAssessments", "No assessments recorded yet.")}
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead style={{ fontSize: 11, paddingLeft: 20 }}>
                                            {t("scorecard.colVendor", "Vendor")}
                                        </TableHead>
                                        <TableHead style={{ fontSize: 11 }}>
                                            {t("scorecard.colFramework", "Framework")}
                                        </TableHead>
                                        <TableHead style={{ fontSize: 11 }}>
                                            {t("scorecard.colScore", "Score")}
                                        </TableHead>
                                        <TableHead style={{ fontSize: 11 }}>
                                            {t("scorecard.colRisk", "Risk")}
                                        </TableHead>
                                        <TableHead style={{ fontSize: 11, paddingRight: 20 }}>
                                            {t("scorecard.colDate", "Date")}
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.recentAssessments.map((a) => (
                                        <TableRow key={a.id}>
                                            <TableCell
                                                style={{
                                                    fontSize: 13,
                                                    fontWeight: 500,
                                                    paddingLeft: 20,
                                                    maxWidth: 180,
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                {a.vendorName}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" style={{ fontSize: 11 }}>
                                                    {a.frameworkCode}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <span
                                                    style={{
                                                        fontSize: 14,
                                                        fontWeight: 700,
                                                        color: scoreColor(a.score),
                                                    }}
                                                >
                                                    {a.score ?? "—"}
                                                </span>
                                            </TableCell>
                                            <TableCell>{riskBadge(a.riskLevel)}</TableCell>
                                            <TableCell
                                                style={{
                                                    fontSize: 12,
                                                    color: "var(--djac-muted)",
                                                    paddingRight: 20,
                                                }}
                                            >
                                                {fmtDate(a.assessmentDate)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

                {/* Right column: Gap severity + Reports */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {/* Gap Severity */}
                    <Card>
                        <CardHeader style={{ padding: "16px 20px 8px" }}>
                            <CardTitle style={{ fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                                <AlertTriangle style={{ width: 14, height: 14, color: "var(--djac-orange)" }} />
                                {t("scorecard.gapSeverity", "Gap Severity")}
                            </CardTitle>
                        </CardHeader>
                        <CardContent style={{ padding: "0 20px 16px" }}>
                            {isLoading ? (
                                <div style={{ height: 120, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <Loader2 className="animate-spin" style={{ width: 20, height: 20, color: "var(--djac-muted)" }} />
                                </div>
                            ) : totalGaps === 0 ? (
                                <div style={{ textAlign: "center", padding: "20px 0", color: "var(--djac-green)", fontSize: 13 }}>
                                    <CheckCircle2 style={{ width: 24, height: 24, margin: "0 auto 6px" }} />
                                    {t("scorecard.noGaps", "No open gaps")}
                                </div>
                            ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 4 }}>
                                    {gapData.map((g) => (
                                        <div key={g.name}>
                                            <div
                                                style={{
                                                    display: "flex",
                                                    justifyContent: "space-between",
                                                    fontSize: 12,
                                                    marginBottom: 3,
                                                    textTransform: "capitalize",
                                                }}
                                            >
                                                <span style={{ color: g.fill, fontWeight: 600 }}>
                                                    {g.name}
                                                </span>
                                                <span style={{ color: "var(--djac-muted)" }}>
                                                    {g.gaps}
                                                </span>
                                            </div>
                                            <div
                                                style={{
                                                    background: "var(--djac-surface)",
                                                    borderRadius: 4,
                                                    height: 6,
                                                    overflow: "hidden",
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        width: `${Math.round((g.gaps / totalGaps) * 100)}%`,
                                                        background: g.fill,
                                                        height: "100%",
                                                        borderRadius: 4,
                                                        transition: "width 0.4s",
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recent Reports */}
                    <Card>
                        <CardHeader style={{ padding: "16px 20px 8px" }}>
                            <CardTitle style={{ fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                                <FileText style={{ width: 14, height: 14, color: "var(--djac-accent)" }} />
                                {t("scorecard.recentReports", "Recent Reports")}
                            </CardTitle>
                        </CardHeader>
                        <CardContent style={{ padding: "0 20px 16px" }}>
                            {isLoading ? (
                                <div style={{ height: 80, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <Loader2 className="animate-spin" style={{ width: 20, height: 20, color: "var(--djac-muted)" }} />
                                </div>
                            ) : !data?.recentReports.length ? (
                                <div style={{ fontSize: 12, color: "var(--djac-muted)", padding: "8px 0" }}>
                                    {t("scorecard.noReports", "No compliance reports generated yet.")}
                                </div>
                            ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 4 }}>
                                    {data.recentReports.map((r) => (
                                        <div
                                            key={r.id}
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                                gap: 8,
                                            }}
                                        >
                                            <div style={{ minWidth: 0 }}>
                                                <div
                                                    style={{
                                                        fontSize: 12,
                                                        fontWeight: 500,
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis",
                                                        whiteSpace: "nowrap",
                                                        color: "var(--djac-fg)",
                                                    }}
                                                >
                                                    {r.title}
                                                </div>
                                                <div style={{ fontSize: 11, color: "var(--djac-muted)" }}>
                                                    {fmtDate(r.createdAt)}
                                                </div>
                                            </div>
                                            {r.overallScore != null && (
                                                <span
                                                    style={{
                                                        fontSize: 12,
                                                        fontWeight: 700,
                                                        color: scoreColor(r.overallScore),
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    {r.overallScore}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* ── Framework Detail Table ── */}
            {data && data.frameworks.length > 0 && (
                <Card>
                    <CardHeader style={{ padding: "16px 20px 8px" }}>
                        <CardTitle style={{ fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                            <TrendingUp style={{ width: 14, height: 14, color: "var(--djac-accent)" }} />
                            {t("scorecard.frameworkBreakdown", "Framework Breakdown")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent style={{ padding: 0 }}>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead style={{ fontSize: 11, paddingLeft: 20 }}>
                                        {t("scorecard.colCode", "Code")}
                                    </TableHead>
                                    <TableHead style={{ fontSize: 11 }}>
                                        {t("scorecard.colName", "Framework")}
                                    </TableHead>
                                    <TableHead style={{ fontSize: 11 }}>
                                        {t("scorecard.colAssessments", "Assessments")}
                                    </TableHead>
                                    <TableHead style={{ fontSize: 11 }}>
                                        {t("scorecard.colAvgScore", "Avg Score")}
                                    </TableHead>
                                    <TableHead style={{ fontSize: 11, paddingRight: 20 }}>
                                        {t("scorecard.colHealth", "Health")}
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.frameworks.map((fw) => (
                                    <TableRow key={fw.code}>
                                        <TableCell style={{ paddingLeft: 20 }}>
                                            <Badge variant="outline" style={{ fontSize: 11 }}>
                                                {fw.code}
                                            </Badge>
                                        </TableCell>
                                        <TableCell style={{ fontSize: 13 }}>{fw.name}</TableCell>
                                        <TableCell style={{ fontSize: 13, color: "var(--djac-muted)" }}>
                                            {fw.count}
                                        </TableCell>
                                        <TableCell>
                                            <span
                                                style={{
                                                    fontSize: 14,
                                                    fontWeight: 700,
                                                    color: scoreColor(fw.avgScore),
                                                }}
                                            >
                                                {fw.avgScore}
                                            </span>
                                        </TableCell>
                                        <TableCell style={{ paddingRight: 20 }}>
                                            <div
                                                style={{
                                                    background: "var(--djac-surface)",
                                                    borderRadius: 4,
                                                    height: 6,
                                                    width: 120,
                                                    overflow: "hidden",
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        width: `${fw.avgScore}%`,
                                                        background: scoreColor(fw.avgScore),
                                                        height: "100%",
                                                        borderRadius: 4,
                                                    }}
                                                />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {/* Invisible dep to avoid stale closure on refetchToken */}
            <span style={{ display: "none" }}>{refetchToken}</span>
        </div>
    );
}
