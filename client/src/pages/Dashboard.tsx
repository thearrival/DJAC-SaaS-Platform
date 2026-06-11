import { useEffect, useMemo } from "react";
import type React from "react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useLocale } from "@/contexts/useLocale";
import { useTheme } from "@/contexts/useTheme";
import { DataFlowVisualization } from "@/components/DataFlowVisualization";
import { FrameworkRelationshipOrb } from "@/components/FrameworkRelationshipOrb";
import { LiveThreatFeed } from "@/components/LiveThreatFeed";
import { VendorRiskGauge } from "@/components/VendorRiskGauge";
import { ComplianceMatrix } from "@/components/ComplianceMatrix";
import { ComplianceHealthScore } from "@/components/ComplianceHealthScore";
import { trpc } from "@/lib/trpc";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from "@/lib/recharts-compat";
import {
  AlertTriangle, ShieldAlert, Globe2, CheckCircle2,
  Activity, ArrowRight, Zap, GitBranch, AlertCircle,
  Shield, Clock,
  Wrench, BookOpen, ClipboardCheck,
} from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

// Design tokens (Yalla-Hack design spec dark theme)
// Accent colors are theme-aware — defined inside Dashboard via useTheme().

// Sub-components

function GaugeArc({ value, color, label }: { value: number; color: string; label: string }) {
  const r = 68, cx = 100, cy = 96;
  const S = (-210 * Math.PI) / 180;
  const SPAN = (240 * Math.PI) / 180;
  const F = S + SPAN * Math.min(1, value / 100);
  function pt(a: number) { return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) }; }
  function arc(from: number, to: number, stroke: string) {
    const s = pt(from), e = pt(to);
    return <path d={`M${s.x} ${s.y} A${r} ${r} 0 ${to - from > Math.PI ? 1 : 0} 1 ${e.x} ${e.y}`} fill="none" stroke={stroke} strokeWidth="11" strokeLinecap="round" />;
  }
  return (
    <svg viewBox="0 0 200 155" style={{ width: "100%" }}>
      {arc(S, S + SPAN, "var(--djac-border)")}
      {arc(S, F, color)}
      <text x={cx} y={cy + 10} textAnchor="middle" fill="var(--djac-text)" fontSize="26" fontWeight="700">{value}%</text>
      <text x={cx} y={cx + 30} textAnchor="middle" fill="var(--djac-muted)" fontSize="10">{label}</text>
    </svg>
  );
}

function ProgressBar({ value, color = "var(--djac-cyan)" }: { value: number; color?: string }) {
  return (
    <div style={{ background: "var(--djac-border)", borderRadius: 999, height: 5, overflow: "hidden" }}>
      <div style={{ width: `${Math.min(100, value)}%`, background: color, height: "100%", borderRadius: 999, transition: "width 1.2s ease" }} />
    </div>
  );
}

function KpiCard({ label, value, sub, accent, icon }: { label: string; value: string | number; sub?: string; accent: string; icon: React.ReactNode }) {
  return (
    <div className="djac-kpi-hover" style={{ background: "var(--djac-card)", border: "1px solid var(--djac-border)", borderRadius: 14, padding: "18px 20px", display: "flex", alignItems: "center", gap: 15 }}>
      <div style={{ width: 44, height: 44, borderRadius: 11, background: `${accent}1A`, border: `1px solid ${accent}40`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <p style={{ color: "var(--djac-muted)", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>{label}</p>
        <p style={{ color: "var(--djac-text)", fontSize: 26, fontWeight: 700, lineHeight: 1 }}>{value}</p>
        {sub && <p style={{ color: "var(--djac-muted)", fontSize: 10, marginTop: 4 }}>{sub}</p>}
      </div>
    </div>
  );
}

function Tag({ text, bg, border, color }: { text: string; bg: string; border: string; color: string }) {
  return <span style={{ background: bg, border: `1px solid ${border}`, color, fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 99 }}>{text}</span>;
}

// TOOLTIP_STYLE is defined inside Dashboard (theme-aware).

// Main page
export default function Dashboard() {
  usePageTitle("Dashboard");
  const { t } = useLocale();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [, navigate] = useLocation();

  // Theme-aware design tokens — accent colors switch between neon (dark) and professional (light)
  const C = useMemo(() => ({
    bg: "var(--djac-bg)",
    bgDeep: "var(--djac-bg-deep)",
    card: "var(--djac-card)",
    cardHover: "var(--djac-card-hi)",
    border: "var(--djac-border)",
    borderHi: "var(--djac-border-hi)",
    text: "var(--djac-text)",
    muted: "var(--djac-muted)",
    cyan: isDark ? "#00F7FF" : "#0284c7",
    green: isDark ? "#01FF7F" : "#16a34a",
    red: isDark ? "#FF1744" : "#dc2626",
    orange: isDark ? "#FF6B2B" : "#ea580c",
    yellow: isDark ? "#FFD600" : "#d97706",
    purple: isDark ? "#9359EC" : "#7c3aed",
  }), [isDark]);

  const SEV: Record<string, string> = {
    critical: C.red,
    high: C.orange,
    medium: C.cyan,
    low: C.green,
  };

  const TOOLTIP_STYLE = {
    background: isDark ? "#0D1B6E" : "var(--djac-bg-deep)",
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    color: C.text,
    fontSize: 12,
  };

  const frameworksQuery = trpc.compliance.frameworks.useQuery();
  const matrixQuery = trpc.compliance.matrix.useQuery();
  const timetableQuery = trpc.compliance.timetable.useQuery(undefined, { refetchOnWindowFocus: false });
  const moduleSummaryQuery = trpc.complianceReport.summary.useQuery(undefined, {
    refetchOnWindowFocus: false,
    retry: false,
  });
  const moduleSummary = moduleSummaryQuery.data;

  const frameworks = frameworksQuery.data;
  const matrix = matrixQuery.data;
  const timetable = timetableQuery.data;
  const fwLoading = frameworksQuery.isLoading;
  const frameworksError = frameworksQuery.error;
  const matrixError = matrixQuery.error;
  const timetableError = timetableQuery.error;
  const hasLiveQueryError = frameworksQuery.isError || matrixQuery.isError || timetableQuery.isError;

  useEffect(() => {
    if (frameworksError) toast.error(t("dashboard.frameworksLoadError", "Failed to load compliance frameworks."));
  }, [frameworksError]);
  useEffect(() => {
    if (matrixError) toast.error(t("dashboard.matrixLoadError", "Failed to load compliance matrix."));
  }, [matrixError]);
  useEffect(() => {
    if (timetableError) toast.error(t("dashboard.timetableLoadError", "Failed to load compliance timetable."));
  }, [timetableError]);

  // Derived KPIs
  const kpis = useMemo(() => {
    const m = matrix ?? [];
    const counts = { critical: 0, high: 0, medium: 0, low: 0, total: m.length };
    for (const row of m) {
      if (row.maxSeverity === "critical") counts.critical++;
      else if (row.maxSeverity === "high") counts.high++;
      else if (row.maxSeverity === "medium") counts.medium++;
      else counts.low++;
    }
    return counts;
  }, [matrix]);

  // Severity bar chart data
  const severityBars = useMemo(() => [
    { name: t("common.severity.critical", "Critical"), count: kpis.critical, color: C.red },
    { name: t("common.severity.high", "High"), count: kpis.high, color: C.orange },
    { name: t("common.severity.medium", "Medium"), count: kpis.medium, color: C.cyan },
    { name: t("common.severity.low", "Low"), count: kpis.low, color: C.green },
  ], [kpis, C, t]);

  // Activity area-chart (deterministic from real matrix totals)
  const activityData = useMemo(() => {
    const total = Math.max(kpis.total, 1);
    const fw = Math.max(frameworks?.length ?? 5, 1);
    const weights = [0.20, 0.15, 0.10, 0.12, 0.40, 0.75, 0.90, 1.00, 0.85, 0.70, 0.55, 0.35, 0.30];
    return ["00:00", "02:00", "04:00", "06:00", "08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00", "Now"].map((h, i) => ({
      time: h,
      conflicts: Math.round(weights[i] * total * 0.65),
      assessments: Math.round(weights[i] * fw * 0.8),
    }));
  }, [kpis.total, frameworks?.length]);

  // Per-framework derived compliance scores
  const fwScores = useMemo(() => {
    const scores: Record<string, number> = {};
    for (const fw of frameworks ?? []) {
      let s = 100;
      for (const row of matrix ?? []) {
        const involved = row.source === fw.code || row.target === fw.code;
        if (!involved) continue;
        if (row.relationships.includes("conflict")) s -= 14;
        if (row.relationships.includes("gap")) s -= 8;
        if (row.relationships.includes("overlap") || row.relationships.includes("coordination")) s += 4;
      }
      scores[fw.code] = Math.max(30, Math.min(100, Math.round(s)));
    }
    return scores;
  }, [frameworks, matrix]);

  const avgPosture = useMemo(() => {
    const vals = Object.values(fwScores);
    return vals.length ? Math.round(vals.reduce((a, b) => a + b) / vals.length) : 0;
  }, [fwScores]);

  // Compliance modules health (Phase 36)
  const moduleHealth = useMemo(() => {
    const s = moduleSummary;
    if (!s) return null;
    return [
      { key: "risks", label: t("dashboard.moduleRisks", "Open Risks"), count: s.risks.open, accent: s.risks.open > 0 ? C.red : C.green, icon: ShieldAlert, path: "/risk-register", sub: `${s.risks.critical} critical` },
      { key: "remed", label: t("dashboard.moduleRemediation", "Tasks Open"), count: s.remediation.open, accent: s.remediation.open > 0 ? C.orange : C.green, icon: Wrench, path: "/remediation-planner", sub: `${s.remediation.resolved} resolved` },
      { key: "policies", label: t("dashboard.modulePolicies", "Active Policies"), count: s.policies.active, accent: C.cyan, icon: BookOpen, path: "/policy-manager", sub: `${s.policies.draft} draft` },
      { key: "incidents", label: t("dashboard.moduleIncidents", "Incidents Open"), count: s.incidents.open, accent: s.incidents.open > 0 ? C.red : C.green, icon: AlertCircle, path: "/incident-register", sub: `${s.incidents.critical} critical` },
      { key: "audits", label: t("dashboard.moduleAudits", "Upcoming Audits"), count: s.auditSchedule.upcoming, accent: s.auditSchedule.overdue > 0 ? C.orange : C.cyan, icon: ClipboardCheck, path: "/audit-schedule", sub: `${s.auditSchedule.overdue} overdue` },
    ];
  }, [moduleSummary, C, t]);

  // Activity feed from timetable
  const feedItems = useMemo(() => {
    const rank: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
    return [...(timetable ?? [])]
      .sort((a, b) => (rank[b.riskLevel] ?? 0) - (rank[a.riskLevel] ?? 0))
      .slice(0, 9);
  }, [timetable]);

  // Matrix: conflict count per framework for the framework card
  function conflictsFor(code: string) {
    return (matrix ?? []).filter(
      r => (r.source === code || r.target === code) && r.relationships.includes("conflict")
    ).length;
  }

  // Render
  return (
    <div className="djac-page">
      <div className="djac-dash-root" style={{ color: C.text }}>

        {/* Header */}
        <div className="djac-section-1" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 14, marginBottom: 26 }}>
          <div>
            <h1 style={{ fontSize: 27, fontWeight: 700, letterSpacing: "-0.02em", margin: 0 }}>
              {t("dashboard.titlePrefix", "DJAC")}&nbsp;<span style={{ color: C.cyan }}>{t("dashboard.titleAccent", "TOOL")}</span>
            </h1>
            <p style={{ color: C.muted, fontSize: 13, margin: "6px 0 0" }}>
              {t("dashboard.subtitle", "Monitor and detect compliance drift across China-Saudi cross-border operations")}
            </p>
          </div>
          <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
            {[
              { label: t("dashboard.headerActionFrameworkAnalysis", "Framework Analysis"), path: "/analysis", accent: C.cyan },
              { label: t("dashboard.headerActionRunAssessment", "Run Assessment"), path: "/market-entry", accent: C.purple },
              { label: t("dashboard.headerActionComplianceTracker", "Compliance Tracker"), path: "/compliance-tracker", accent: C.green },
              { label: t("dashboard.headerActionLawLibrary", "Law Library"), path: "/laws", accent: C.yellow },
            ].map(btn => (
              <button
                key={btn.path}
                onClick={() => navigate(btn.path)}
                aria-label={btn.label}
                title={btn.label}
                style={{ background: `${btn.accent}18`, border: `1px solid ${btn.accent}40`, borderRadius: 9, color: btn.accent, fontSize: 11, fontWeight: 600, padding: "7px 13px", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}
              >
                <ArrowRight style={{ width: 11, height: 11 }} />{btn.label}
              </button>
            ))}
          </div>
        </div>

        {hasLiveQueryError && (
          <div
            className="djac-section-1b"
            style={{
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              padding: "12px 14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              marginBottom: 16,
              flexWrap: "wrap",
            }}
          >
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>
                {t("dashboard.loadError", "Some live dashboard data failed to load.")}
              </p>
              <p style={{ margin: "2px 0 0", color: C.muted, fontSize: 11 }}>
                {t("dashboard.retryHint", "Retry to refresh frameworks, matrix, and obligations feed.")}
              </p>
            </div>
            <button
              onClick={() => {
                void frameworksQuery.refetch();
                void matrixQuery.refetch();
                void timetableQuery.refetch();
              }}
              style={{
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                background: "var(--djac-card-hi)",
                color: C.text,
                padding: "7px 12px",
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {t("common.retry", "Retry")}
            </button>
          </div>
        )}

        {/* KPI Row */}
        <div className="djac-dash-kpi-grid djac-section-2" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: moduleHealth ? 14 : 20 }}>
          <KpiCard label={t("dashboard.kpiCritical", "Critical Conflicts")} value={kpis.critical} accent={C.red} sub={t("dashboard.kpiCriticalSub", "of {count} framework pairs").replace("{count}", String(kpis.total))} icon={<AlertTriangle style={{ width: 20, height: 20, color: C.red }} />} />
          <KpiCard label={t("dashboard.kpiHighRisk", "High-Risk Pairs")} value={kpis.high} accent={C.orange} sub={t("dashboard.kpiHighRiskSub", "Require dual-jurisdiction pipeline")} icon={<ShieldAlert style={{ width: 20, height: 20, color: C.orange }} />} />
          <KpiCard label={t("dashboard.kpiFrameworks", "Frameworks Active")} value={frameworks?.length ?? 0} accent={C.cyan} sub={t("dashboard.kpiFrameworksSub", "CSL · DSL · PIPL · PDPL · NCA")} icon={<Globe2 style={{ width: 20, height: 20, color: C.cyan }} />} />
          <KpiCard label={t("dashboard.kpiPosture", "Compliance Posture")} value={`${avgPosture}%`} accent={C.green} sub={t("dashboard.kpiPostureSub", "Derived from relationship graph")} icon={<CheckCircle2 style={{ width: 20, height: 20, color: C.green }} />} />
        </div>

        {/* Compliance Modules Health Strip — Phase 36 */}
        {moduleSummaryQuery.isError && (
          <div
            style={{
              background: C.card,
              border: `1px solid ${C.red}66`,
              borderRadius: 12,
              padding: "12px 14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              marginBottom: 14,
              flexWrap: "wrap",
            }}
          >
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>
                {moduleSummaryQuery.error?.message ?? t("dashboard.moduleSummaryLoadError", "Failed to load module health summary.")}
              </p>
              <p style={{ margin: "2px 0 0", color: C.muted, fontSize: 11 }}>
                {t("dashboard.moduleSummaryRetryHint", "Retry to refresh risk, remediation, policy, incident, and audit counters.")}
              </p>
            </div>
            <button
              onClick={() => {
                void moduleSummaryQuery.refetch();
              }}
              style={{
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                background: "var(--djac-card-hi)",
                color: C.text,
                padding: "7px 12px",
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {t("common.retry", "Retry")}
            </button>
          </div>
        )}

        {moduleHealth && (
          <div className="djac-dash-modules-strip djac-section-2b" style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10, marginBottom: 20 }}>
            {moduleHealth.map(m => {
              const Icon = m.icon;
              const hasAlert = m.count > 0;
              return (
                <div
                  key={m.key}
                  onClick={() => navigate(m.path)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      navigate(m.path);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`${m.label}: ${m.count}`}
                  title={`${m.label}: ${m.count}`}
                  style={{
                    background: C.card,
                    border: `1px solid ${hasAlert ? m.accent + "55" : C.border}`,
                    borderRadius: 10,
                    padding: "11px 14px",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    gap: 5,
                    transition: "border-color 0.2s",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Icon style={{ width: 13, height: 13, color: m.accent, flexShrink: 0 }} />
                    <span style={{ color: m.accent, fontSize: 9, fontWeight: 700, background: m.accent + "1A", borderRadius: 99, padding: "2px 7px" }}>
                      {m.sub}
                    </span>
                  </div>
                  <p style={{ fontSize: 24, fontWeight: 700, margin: 0, color: hasAlert ? m.accent : C.text, lineHeight: 1 }}>{m.count}</p>
                  <p style={{ fontSize: 9, color: C.muted, margin: 0, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{m.label}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* Charts Row */}
        <div className="djac-dash-chart-grid djac-section-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
          {/* Area chart */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 22px" }}>
            <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 3px" }}>{t("dashboard.conflictActivityTitle", "Conflict Detection Activity")}</p>
            <p style={{ color: C.muted, fontSize: 10, margin: "0 0 16px" }}>{t("dashboard.conflictActivityDesc", "Framework relationship pair index · {count} active pairs · derived from live matrix").replace("{count}", String(kpis.total))}</p>
            <ResponsiveContainer width="100%" height={170}>
              <AreaChart data={activityData} margin={{ top: 0, right: 4, left: -26, bottom: 0 }}>
                <defs>
                  <linearGradient id="gConflict" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.cyan} stopOpacity={0.35} /><stop offset="100%" stopColor={C.cyan} stopOpacity={0} /></linearGradient>
                  <linearGradient id="gAssess" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.purple} stopOpacity={0.30} /><stop offset="100%" stopColor={C.purple} stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid stroke="var(--djac-border)" strokeDasharray="3 3" />
                <XAxis dataKey="time" stroke={C.muted} tick={{ fill: C.muted, fontSize: 9 }} tickLine={false} axisLine={false} interval={2} />
                <YAxis stroke={C.muted} tick={{ fill: C.muted, fontSize: 9 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: C.muted, fontSize: 10 }} cursor={{ stroke: C.border }} />
                <Area type="monotone" dataKey="conflicts" name={t("dashboard.chartSeriesConflicts", "Conflicts")} stroke={C.cyan} strokeWidth={2} fill="url(#gConflict)" dot={false} />
                <Area type="monotone" dataKey="assessments" name={t("dashboard.chartSeriesAssessments", "Assessments")} stroke={C.purple} strokeWidth={2} fill="url(#gAssess)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Bar chart */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 22px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>{t("dashboard.severityDistributionTitle", "Relationship Severity Distribution")}</p>
              <Tag text={t("dashboard.totalPairs", "{count} total").replace("{count}", String(kpis.total))} bg={`${C.orange}1A`} border={`${C.orange}40`} color={C.orange} />
            </div>
            <p style={{ color: C.muted, fontSize: 10, margin: "3px 0 16px" }}>{t("dashboard.severityDistributionDesc", "Inter-jurisdiction control conflicts by severity level")}</p>
            <ResponsiveContainer width="100%" height={170}>
              <BarChart data={severityBars} margin={{ top: 0, right: 4, left: -26, bottom: 0 }}>
                <CartesianGrid stroke="var(--djac-border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke={C.muted} tick={{ fill: C.muted, fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis stroke={C.muted} tick={{ fill: C.muted, fontSize: 9 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: C.muted, fontSize: 10 }} cursor={{ fill: "var(--djac-card)" }} />
                <Bar dataKey="count" name={t("dashboard.pairsLabel", "Pairs")} radius={[5, 5, 0, 0]}>
                  {severityBars.map((e) => <Cell key={e.name} fill={e.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bottom Row: Framework cards + Side panel */}
        <div className="djac-dash-main-grid djac-section-4" style={{ display: "grid", gridTemplateColumns: "1fr 290px", gap: 14 }}>

          {/* Framework compliance cards */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 22px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>{t("dashboard.frameworksSectionTitle", "Compliance Frameworks")}</p>
                <p style={{ color: C.muted, fontSize: 10, marginTop: 3 }}>
                  <span style={{ color: C.cyan, fontWeight: 700 }}>{frameworks?.length ?? 0} active</span>
                  &nbsp;· {t("dashboard.frameworksSectionDesc", "CSL / DSL / PIPL (China) + PDPL / NCA (Saudi Arabia)")}
                </p>
              </div>
              <button
                onClick={() => navigate("/analysis")}
                aria-label={t("dashboard.viewAll", "View all")}
                title={t("dashboard.viewAll", "View all")}
                style={{ background: "transparent", border: "none", color: C.muted, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}
              >
                {t("dashboard.viewAll", "View all")} <ArrowRight style={{ width: 12, height: 12 }} />
              </button>
            </div>

            {fwLoading ? (
              <div style={{ color: C.muted, textAlign: "center", padding: "32px 0", fontSize: 13 }}>{t("dashboard.loadingFrameworks", "Loading frameworks...")}</div>
            ) : (
              <div className="djac-dash-fw-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 11 }}>
                {(frameworks ?? []).map(fw => {
                  const score = fwScores[fw.code] ?? 70;
                  const scoreCol = score >= 80 ? C.green : score >= 60 ? C.yellow : C.red;
                  const isCn = fw.country === "China";
                  const cfCount = conflictsFor(fw.code);
                  const totalRel = (matrix ?? []).filter(r => r.source === fw.code || r.target === fw.code).length;
                  return (
                    <div
                      key={fw.id}
                      onClick={() => navigate("/analysis")}
                      onKeyDown={e => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          navigate("/analysis");
                        }
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = C.borderHi; e.currentTarget.style.background = C.cardHover; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = "var(--djac-card)"; }}
                      role="button"
                      tabIndex={0}
                      aria-label={t("dashboard.openFrameworkAnalysis", "Open {code} framework analysis").replace("{code}", fw.code)}
                      title={t("dashboard.openFrameworkAnalysis", "Open {code} framework analysis").replace("{code}", fw.code)}
                      className="djac-kpi-hover"
                      style={{ background: "var(--djac-card)", border: `1px solid ${C.border}`, borderRadius: 11, padding: "13px 15px", cursor: "pointer", transition: "all 0.18s" }}
                    >
                      {/* Header row */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                        <p style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{fw.code}</p>
                        {cfCount > 0 && <Tag text={`! ${cfCount}`} bg={`${C.orange}1A`} border={`${C.orange}44`} color={C.orange} />}
                      </div>
                      {/* Name */}
                      <p style={{ color: C.muted, fontSize: 9.5, margin: "0 0 10px", lineHeight: 1.45, height: 26, overflow: "hidden" }}>
                        {fw.name.length > 42 ? fw.name.slice(0, 40) + "…" : fw.name}
                      </p>
                      {/* Progress bar */}
                      <ProgressBar value={score} color={scoreCol} />
                      {/* Footer */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
                        <Tag
                          text={`${isCn ? "🇨🇳" : "🇸🇦"} ${isCn ? t("dashboard.countryChina", "China") : t("dashboard.countrySaudiArabia", "Saudi Arabia")}`}
                          bg={isCn ? `${C.red}1E` : `${C.green}14`}
                          border={isCn ? `${C.red}47` : `${C.green}38`}
                          color={isCn ? C.red : C.green}
                        />
                        <div style={{ textAlign: "right" }}>
                          <span style={{ color: scoreCol, fontSize: 13, fontWeight: 700 }}>{score}%</span>
                          <p style={{ color: C.muted, fontSize: 8.5, margin: 0 }}>{t("dashboard.totalRelPairs", "{count} pairs").replace("{count}", String(totalRel))}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right panel */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Gauge */}
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px 18px" }}>
              <p style={{ color: C.cyan, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{t("dashboard.systemHealth", "System Health")}</p>
              <GaugeArc
                value={avgPosture}
                color={avgPosture >= 80 ? C.green : avgPosture >= 60 ? C.yellow : C.red}
                label={t("dashboard.kpiPosture", "Compliance Posture")}
              />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 2, marginTop: 8, textAlign: "center" }}>
                {[
                  { v: kpis.critical, c: C.red, l: t("dashboard.gaugeCriticalShort", "Crit.") },
                  { v: kpis.high, c: C.orange, l: t("common.severity.high", "High") },
                  { v: kpis.low, c: C.green, l: t("common.severity.low", "Low") },
                ].map(({ v, c, l }) => (
                  <div key={l}>
                    <p style={{ color: c, fontSize: 17, fontWeight: 700, margin: 0 }}>{v}</p>
                    <p style={{ color: C.muted, fontSize: 9, margin: 0 }}>{l}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Obligation feed */}
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "14px 16px", flex: 1, overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 13 }}>
                <Activity style={{ width: 13, height: 13, color: C.cyan }} />
                <p style={{ fontSize: 12, fontWeight: 600, margin: 0 }}>{t("dashboard.regulatoryObligations", "Regulatory Obligations")}</p>
                <Tag text={String(timetable?.length ?? 0)} bg={`${C.cyan}18`} border={`${C.cyan}35`} color={C.cyan} />
              </div>
              <div className="djac-scroll" style={{ display: "flex", flexDirection: "column", gap: 9, maxHeight: 230, overflowY: "auto" }}>
                {feedItems.map((item, i) => {
                  const col = SEV[item.riskLevel] ?? C.muted;
                  return (
                    <div key={`${item.framework}-${item.requirement}-${i}`} style={{ display: "flex", alignItems: "flex-start", gap: 9 }}>
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: col, flexShrink: 0, marginTop: 4 }} />
                      <div style={{ minWidth: 0 }}>
                        <p style={{ color: C.text, fontSize: 10.5, fontWeight: 600, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {item.requirement}
                        </p>
                        <p style={{ color: C.muted, fontSize: 9, margin: "2px 0 0" }}>
                          {item.framework} · {item.country} · <span style={{ color: col }}>{item.riskLevel}</span>
                        </p>
                      </div>
                    </div>
                  );
                })}
                {timetableQuery.isError ? (
                  <div style={{ textAlign: "center", padding: "12px 0" }}>
                    <p style={{ color: C.muted, fontSize: 11, margin: "0 0 8px" }}>
                      {t("dashboard.timetableLoadError", "Failed to load compliance timetable.")}
                    </p>
                    <button
                      onClick={() => { void timetableQuery.refetch(); }}
                      style={{
                        borderRadius: 8,
                        border: `1px solid ${C.border}`,
                        background: "var(--djac-card-hi)",
                        color: C.text,
                        padding: "6px 10px",
                        fontSize: 10,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      {t("common.retry", "Retry")}
                    </button>
                  </div>
                ) : feedItems.length === 0 ? (
                  <p style={{ color: C.muted, fontSize: 11, textAlign: "center", padding: "16px 0" }}>{t("dashboard.loadingObligations", "Loading obligations...")}</p>
                ) : null}
              </div>
            </div>

            {/* Quick actions */}
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "14px 16px" }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>{t("dashboard.quickActions", "Quick Actions")}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {[
                  { label: t("dashboard.quickActionFrameworkAnalysis", "Deep Framework Analysis"), icon: <Globe2 style={{ width: 12, height: 12 }} />, path: "/analysis", color: C.cyan },
                  { label: t("dashboard.quickActionVendorAssessment", "Vendor Assessment"), icon: <Shield style={{ width: 12, height: 12 }} />, path: "/market-entry", color: C.purple },
                  { label: t("dashboard.quickActionObligationTimetable", "Obligation Timetable"), icon: <Clock style={{ width: 12, height: 12 }} />, path: "/compliance-tracker", color: C.green },
                  { label: t("dashboard.quickActionRiskRegister", "Risk Register"), icon: <ShieldAlert style={{ width: 12, height: 12 }} />, path: "/risk-register", color: C.red },
                  { label: t("dashboard.quickActionPolicyManager", "Policy Manager"), icon: <BookOpen style={{ width: 12, height: 12 }} />, path: "/policy-manager", color: C.yellow },
                  { label: t("dashboard.quickActionAuditSchedule", "Audit Schedule"), icon: <ClipboardCheck style={{ width: 12, height: 12 }} />, path: "/audit-schedule", color: C.cyan },
                ].map(a => (
                  <button
                    key={a.path}
                    onClick={() => navigate(a.path)}
                    aria-label={a.label}
                    title={a.label}
                    style={{ background: `${a.color}12`, border: `1px solid ${a.color}30`, borderRadius: 8, color: a.color, fontSize: 11, fontWeight: 600, padding: "8px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, textAlign: "left" }}
                  >
                    {a.icon}{a.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Live Risk Pulse Banner */}
        {kpis.critical > 0 && (
          <div style={{ marginTop: 20, background: `${C.red}12`, border: `1px solid ${C.red}40`, borderRadius: 12, padding: "12px 18px", display: "flex", alignItems: "center", gap: 12 }}>
            <span className="djac-pulse-dot" style={{ display: "inline-flex", width: 18, height: 18, alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <AlertTriangle style={{ width: 18, height: 18, color: C.red }} />
            </span>
            <div style={{ flex: 1 }}>
              <span style={{ color: C.red, fontWeight: 700, fontSize: 12 }}>
                {t("dashboard.criticalConflictDetected", "{count} Critical Conflict{plural} Detected").replace("{count}", String(kpis.critical)).replace("{plural}", kpis.critical !== 1 ? "s" : "")} -
              </span>{" "}
              <span style={{ color: C.muted, fontSize: 12 }}>
                {t("dashboard.criticalConflictDesc", "These cross-jurisdiction framework pairs require immediate dual-pipeline remediation.")}
              </span>
            </div>
            <button
              onClick={() => navigate("/analysis")}
              aria-label={t("dashboard.reviewNow", "Review Now")}
              title={t("dashboard.reviewNow", "Review Now")}
              style={{ background: `${C.red}22`, border: `1px solid ${C.red}50`, borderRadius: 7, color: C.red, fontSize: 11, fontWeight: 700, padding: "5px 12px", cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", gap: 5 }}
            >
              {t("dashboard.reviewNow", "Review Now")} <ArrowRight style={{ width: 10, height: 10 }} />
            </button>
          </div>
        )}

        {/* Cross-Jurisdiction Insight Cards */}
        <div className="djac-dash-insight-grid djac-section-5" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginTop: 16 }}>
          {[
            {
              icon: <AlertTriangle style={{ width: 16, height: 16, color: C.red }} />,
              accent: C.red,
              action: { label: t("dashboard.insightLocalizationAction", "View Conflicts"), path: "/analysis" },
              title: t("dashboard.insightLocalizationTitle", "Data Localization Conflict"),
              body: t("dashboard.insightLocalizationBody", "Both China (CSL/PIPL) and Saudi Arabia (PDPL) mandate strict in-jurisdiction data residency. Simultaneous cross-border operations require dual independent data pipelines — a shared pipeline violates one or both regimes."),
            },
            {
              icon: <Zap style={{ width: 16, height: 16, color: C.yellow }} />,
              accent: C.yellow,
              action: { label: t("dashboard.insightConsentAction", "View Frameworks"), path: "/analysis" },
              title: t("dashboard.insightConsentTitle", "Consent Harmonization"),
              body: t("dashboard.insightConsentBody", "PIPL requires explicit, purpose-specific, granular consent. PDPL aligns closely. A single unified consent layer satisfying both frameworks is feasible — reducing implementation cost by ~40%."),
            },
            {
              icon: <GitBranch style={{ width: 16, height: 16, color: C.purple }} />,
              accent: C.purple,
              action: { label: t("dashboard.insightEnforcementAction", "Obligation Timetable"), path: "/compliance-tracker" },
              title: t("dashboard.insightEnforcementTitle", "Enforcement Authority Split"),
              body: t("dashboard.insightEnforcementBody", "China centralizes under CAC; Saudi Arabia splits between SDAIA (data privacy) and NCA (cybersecurity). Compliance programs must maintain separate notification chains and audit trails for each regulator."),
            },
          ].map((card, i) => (
            <div key={i} className="djac-insight-card" style={{ background: C.card, border: `1px solid ${card.accent}30`, borderRadius: 14, padding: "16px 18px", display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 9 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: `${card.accent}1A`, border: `1px solid ${card.accent}40`, display: "flex", alignItems: "center", justifyContent: "center" }}>{card.icon}</div>
                <p style={{ fontSize: 12, fontWeight: 700, margin: 0, color: C.text }}>{card.title}</p>
              </div>
              <p style={{ color: C.muted, fontSize: 11, lineHeight: 1.65, margin: "0 0 12px", flex: 1 }}>{card.body}</p>
              <button
                onClick={() => navigate(card.action.path)}
                aria-label={card.action.label}
                title={card.action.label}
                style={{ alignSelf: "flex-start", background: `${card.accent}15`, border: `1px solid ${card.accent}35`, borderRadius: 7, color: card.accent, fontSize: 10, fontWeight: 700, padding: "5px 11px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
              >
                {card.action.label} <ArrowRight style={{ width: 9, height: 9 }} />
              </button>
            </div>
          ))}
        </div>

        {/* Intelligence Command Center */}
        <div style={{ marginTop: 20 }}>
          {/* Section header */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${C.cyan}40, transparent)` }} />
            <span style={{ color: C.cyan, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", whiteSpace: "nowrap" }}>
              {t("dashboard.intelligenceCommandCenter", "Intelligence Command Center")}
            </span>
            <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, ${C.cyan}40)` }} />
          </div>

          {/* Row 1: Data Flow + Framework Orb */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            <DataFlowVisualization />
            <FrameworkRelationshipOrb />
          </div>

          {/* Row 2: Live Threat Feed + Vendor Risk Gauge */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            <LiveThreatFeed />
            <VendorRiskGauge />
          </div>

          {/* Row 3: Compliance Matrix + Health Score */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14 }}>
            <ComplianceMatrix />
            <ComplianceHealthScore score={avgPosture} />
          </div>
        </div>

        {/* Platform Footer */}
        <div className="djac-dash-footer" style={{ marginTop: 20, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.green, boxShadow: `0 0 6px ${C.green}90` }} />
            <span style={{ color: C.muted, fontSize: 10, fontWeight: 600 }}>
              {t("dashboard.platformFooter", "DJAC Intelligence Platform - {frameworks} Frameworks - {pairs} Relationship Pairs - Live")
                .replace("{frameworks}", String(frameworks?.length ?? 0))
                .replace("{pairs}", String(kpis.total))}
            </span>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {[
              { l: t("dashboard.footerReports", "Reports"), p: "/report-center", c: C.cyan },
              { l: t("dashboard.footerLawLibrary", "Law Library"), p: "/laws", c: C.yellow },
            ].map(f => (
              <button
                key={f.p}
                onClick={() => navigate(f.p)}
                aria-label={f.l}
                title={f.l}
                style={{ background: "transparent", border: "none", color: f.c, fontSize: 10, fontWeight: 600, cursor: "pointer", padding: "2px 6px" }}
              >
                {f.l}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
