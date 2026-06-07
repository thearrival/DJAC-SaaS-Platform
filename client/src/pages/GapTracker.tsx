/**
 * GapTracker.tsx
 *
 * Vendor Compliance Gap Tracker — Phase 23
 * Shows aggregated compliance gaps across all registered org vendors,
 * powered by the rule-based dual-jurisdiction assessment engine.
 *
 * Features:
 *  - Stats header (total / critical / high / medium / low gap counts)
 *  - Filter bar (severity, jurisdiction)
 *  - Vendor cards with expandable gap remediation details
 *  - Empty state when no vendors are registered
 *  - EN / AR / ZH locale support
 */

import { useEffect, useMemo, useState } from "react";
import type React from "react";
import { Link, useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { useLocale } from "@/contexts/useLocale";
import { usePageTitle } from "@/hooks/usePageTitle";
import {
    AlertTriangle,
    Building2,
    ChevronDown,
    ChevronUp,
    ClipboardList,
    ExternalLink,
    Filter,
    Globe2,
    ShieldAlert,
    ShieldCheck,
    ShieldX,
    Wrench,
} from "lucide-react";
import { toast } from "sonner";

// ─── Types (mirrored from server/supplier-assessment.ts) ──────────────────────

type AssessmentSeverity = "critical" | "high" | "medium" | "low";
type GapJurisdiction = "china" | "saudi" | "cross_border";

interface SupplierGap {
    code: string;
    jurisdiction: GapJurisdiction;
    frameworks: string[];
    severity: AssessmentSeverity;
    title: string;
    description: string;
    mitigation: string;
    penaltyContext: string;
}

interface SupplierAssessmentResult {
    overallScore: number;
    jurisdictionScores: { china: number; saudiArabia: number };
    status: "compliant" | "partial" | "non_compliant";
    riskLevel: "low" | "medium" | "high" | "critical";
    gaps: SupplierGap[];
    recommendations: string[];
}

interface VendorSummary {
    id: number;
    vendorName: string;
    riskTier: string | null;
    criticalityLevel: string | null;
    headquartersLocation: string | null;
}

interface GapEntry {
    vendor: VendorSummary;
    assessment: SupplierAssessmentResult;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const SEVERITY_ORDER: AssessmentSeverity[] = ["critical", "high", "medium", "low"];

const SEVERITY_CONFIG: Record<
    AssessmentSeverity,
    { color: string; bg: string; border: string; icon: React.FC<{ size?: number }> }
> = {
    critical: {
        color: "#ef4444",
        bg: "rgba(239,68,68,0.10)",
        border: "rgba(239,68,68,0.30)",
        icon: ({ size = 14 }) => <ShieldX size={size} style={{ color: "#ef4444" }} />,
    },
    high: {
        color: "#f97316",
        bg: "rgba(249,115,22,0.10)",
        border: "rgba(249,115,22,0.30)",
        icon: ({ size = 14 }) => <ShieldAlert size={size} style={{ color: "#f97316" }} />,
    },
    medium: {
        color: "#eab308",
        bg: "rgba(234,179,8,0.10)",
        border: "rgba(234,179,8,0.30)",
        icon: ({ size = 14 }) => <AlertTriangle size={size} style={{ color: "#eab308" }} />,
    },
    low: {
        color: "#22c55e",
        bg: "rgba(34,197,94,0.10)",
        border: "rgba(34,197,94,0.30)",
        icon: ({ size = 14 }) => <ShieldCheck size={size} style={{ color: "#22c55e" }} />,
    },
};

const JURISDICTION_LABEL: Record<GapJurisdiction, string> = {
    china: "China",
    saudi: "Saudi Arabia",
    cross_border: "Cross-Border",
};

const JURISDICTION_COLOR: Record<GapJurisdiction, string> = {
    china: "#3b82f6",
    saudi: "#10b981",
    cross_border: "#8b5cf6",
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function SeverityBadge({ severity }: { severity: AssessmentSeverity }) {
    const cfg = SEVERITY_CONFIG[severity];
    const Ico = cfg.icon;
    return (
        <span
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "2px 8px",
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                background: cfg.bg,
                border: `1px solid ${cfg.border}`,
                color: cfg.color,
            }}
        >
            <Ico size={11} />
            {severity}
        </span>
    );
}

function JurisdictionTag({ jurisdiction }: { jurisdiction: GapJurisdiction }) {
    return (
        <span
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "2px 8px",
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 500,
                background: `${JURISDICTION_COLOR[jurisdiction]}18`,
                border: `1px solid ${JURISDICTION_COLOR[jurisdiction]}44`,
                color: JURISDICTION_COLOR[jurisdiction],
            }}
        >
            <Globe2 size={10} />
            {JURISDICTION_LABEL[jurisdiction]}
        </span>
    );
}

function FrameworkTag({ code }: { code: string }) {
    return (
        <span
            style={{
                display: "inline-flex",
                padding: "1px 6px",
                borderRadius: 4,
                fontSize: 10,
                fontWeight: 600,
                background: "var(--djac-muted, rgba(148,163,184,0.12))",
                color: "var(--djac-muted-foreground, #94a3b8)",
                border: "1px solid var(--djac-border, rgba(148,163,184,0.15))",
            }}
        >
            {code}
        </span>
    );
}

function ScorePill({
    label,
    score,
}: {
    label: string;
    score: number;
}) {
    const color = score >= 85 ? "#22c55e" : score >= 65 ? "#eab308" : "#ef4444";
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
            }}
        >
            <span
                style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color,
                    lineHeight: 1,
                }}
            >
                {score}
            </span>
            <span style={{ fontSize: 10, color: "var(--djac-muted-foreground, #94a3b8)" }}>
                {label}
            </span>
        </div>
    );
}

function GapItem({ gap, idx, vendorId }: { gap: SupplierGap; idx: number; vendorId: number }) {
    const [open, setOpen] = useState(false);
    const [, navigate] = useLocation();

    return (
        <Collapsible open={open} onOpenChange={setOpen}>
            <CollapsibleTrigger asChild>
                <button
                    type="button"
                    style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "10px 14px",
                        borderRadius: 8,
                        border: `1px solid ${SEVERITY_CONFIG[gap.severity].border}`,
                        background: open
                            ? SEVERITY_CONFIG[gap.severity].bg
                            : "transparent",
                        cursor: "pointer",
                        textAlign: "start",
                        transition: "background 0.15s",
                    }}
                >
                    <SeverityBadge severity={gap.severity} />
                    <span
                        style={{
                            flex: 1,
                            fontSize: 13,
                            fontWeight: 500,
                            color: "var(--djac-foreground, #f1f5f9)",
                        }}
                    >
                        [{gap.code}] {gap.title}
                    </span>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            flexShrink: 0,
                        }}
                    >
                        <JurisdictionTag jurisdiction={gap.jurisdiction} />
                        <div style={{ display: "flex", gap: 3 }}>
                            {gap.frameworks.map(fw => (
                                <FrameworkTag key={fw} code={fw} />
                            ))}
                        </div>
                        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </div>
                </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
                <div
                    style={{
                        margin: "6px 0 4px",
                        padding: "12px 16px",
                        borderRadius: 8,
                        background: "var(--djac-muted, rgba(148,163,184,0.06))",
                        border: "1px solid var(--djac-border, rgba(148,163,184,0.12))",
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                    }}
                >
                    <div>
                        <p
                            style={{
                                margin: 0,
                                fontSize: 12,
                                fontWeight: 600,
                                color: "var(--djac-muted-foreground, #94a3b8)",
                                textTransform: "uppercase",
                                letterSpacing: "0.06em",
                            }}
                        >
                            Finding
                        </p>
                        <p
                            style={{
                                margin: "4px 0 0",
                                fontSize: 13,
                                color: "var(--djac-foreground, #f1f5f9)",
                                lineHeight: 1.6,
                            }}
                        >
                            {gap.description}
                        </p>
                    </div>
                    <Separator style={{ opacity: 0.2 }} />
                    <div>
                        <p
                            style={{
                                margin: 0,
                                fontSize: 12,
                                fontWeight: 600,
                                color: "#22c55e",
                                textTransform: "uppercase",
                                letterSpacing: "0.06em",
                                display: "flex",
                                alignItems: "center",
                                gap: 5,
                            }}
                        >
                            <Wrench size={11} />
                            Remediation
                        </p>
                        <p
                            style={{
                                margin: "4px 0 0",
                                fontSize: 13,
                                color: "var(--djac-foreground, #f1f5f9)",
                                lineHeight: 1.6,
                            }}
                        >
                            {gap.mitigation}
                        </p>
                    </div>
                    {gap.penaltyContext && (
                        <>
                            <Separator style={{ opacity: 0.2 }} />
                            <div
                                style={{
                                    padding: "8px 12px",
                                    borderRadius: 6,
                                    background: "rgba(239,68,68,0.07)",
                                    border: "1px solid rgba(239,68,68,0.20)",
                                }}
                            >
                                <p
                                    style={{
                                        margin: 0,
                                        fontSize: 12,
                                        color: "#fca5a5",
                                        lineHeight: 1.5,
                                    }}
                                >
                                    ⚠️ {gap.penaltyContext}
                                </p>
                            </div>
                        </>
                    )}
                    <Separator style={{ opacity: 0.2 }} />
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <button
                            type="button"
                            onClick={() => {
                                const qs = new URLSearchParams({
                                    gapCode: gap.code,
                                    title: gap.title,
                                    severity: gap.severity,
                                    vendorId: String(vendorId),
                                }).toString();
                                navigate(`/remediation-planner?${qs}`);
                            }}
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 5,
                                padding: "5px 12px",
                                borderRadius: 6,
                                background: "rgba(129,140,248,0.10)",
                                border: "1px solid rgba(129,140,248,0.25)",
                                color: "#818cf8",
                                fontSize: 11,
                                fontWeight: 600,
                                cursor: "pointer",
                            }}
                        >
                            <Wrench size={11} />
                            Create Remediation Task
                        </button>
                    </div>
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
}

function VendorCard({ entry }: { entry: GapEntry }) {
    const { vendor, assessment } = entry;
    const [expanded, setExpanded] = useState(true);

    const statusColor =
        assessment.status === "compliant"
            ? "#22c55e"
            : assessment.status === "partial"
                ? "#eab308"
                : "#ef4444";

    return (
        <Card
            style={{
                background: "var(--djac-card, rgba(15,23,42,0.8))",
                border: "1px solid var(--djac-border, rgba(148,163,184,0.12))",
                borderRadius: 12,
            }}
        >
            <CardHeader style={{ paddingBottom: 12 }}>
                <div
                    style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 12,
                    }}
                >
                    <div
                        style={{
                            width: 38,
                            height: 38,
                            borderRadius: 8,
                            background: "rgba(99,102,241,0.15)",
                            border: "1px solid rgba(99,102,241,0.30)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                        }}
                    >
                        <Building2 size={18} style={{ color: "#818cf8" }} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <CardTitle
                            style={{
                                fontSize: 15,
                                fontWeight: 600,
                                color: "var(--djac-foreground, #f1f5f9)",
                            }}
                        >
                            <Link
                                href={`/vendor/${vendor.id}`}
                                style={{
                                    color: "inherit",
                                    textDecoration: "none",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 5,
                                }}
                                className="hover:underline"
                            >
                                {vendor.vendorName}
                                <ExternalLink size={12} style={{ opacity: 0.5 }} />
                            </Link>
                        </CardTitle>
                        <div
                            style={{
                                display: "flex",
                                gap: 6,
                                marginTop: 4,
                                flexWrap: "wrap",
                                alignItems: "center",
                            }}
                        >
                            {vendor.riskTier && (
                                <Badge variant="outline" style={{ fontSize: 10 }}>
                                    Risk: {vendor.riskTier}
                                </Badge>
                            )}
                            {vendor.criticalityLevel && (
                                <Badge variant="outline" style={{ fontSize: 10 }}>
                                    {vendor.criticalityLevel}
                                </Badge>
                            )}
                            {vendor.headquartersLocation && (
                                <Badge variant="outline" style={{ fontSize: 10 }}>
                                    HQ: {vendor.headquartersLocation}
                                </Badge>
                            )}
                            <span
                                style={{
                                    fontSize: 11,
                                    fontWeight: 600,
                                    color: statusColor,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.06em",
                                    marginLeft: "auto",
                                }}
                            >
                                {assessment.status.replace("_", " ")}
                            </span>
                        </div>
                    </div>
                    {/* Score pills */}
                    <div
                        style={{
                            display: "flex",
                            gap: 16,
                            flexShrink: 0,
                            padding: "4px 12px",
                            borderRadius: 8,
                            background: "var(--djac-muted, rgba(148,163,184,0.06))",
                            border: "1px solid var(--djac-border, rgba(148,163,184,0.10))",
                        }}
                    >
                        <ScorePill label="Overall" score={assessment.overallScore} />
                        <ScorePill label="China" score={assessment.jurisdictionScores.china} />
                        <ScorePill label="Saudi Arabia" score={assessment.jurisdictionScores.saudiArabia} />
                    </div>
                </div>
            </CardHeader>

            <CardContent style={{ paddingTop: 0 }}>
                {assessment.gaps.length === 0 ? (
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "12px 0",
                            color: "#22c55e",
                            fontSize: 13,
                        }}
                    >
                        <ShieldCheck size={16} />
                        No compliance gaps detected — vendor is within acceptable thresholds.
                    </div>
                ) : (
                    <Collapsible open={expanded} onOpenChange={setExpanded}>
                        <CollapsibleTrigger asChild>
                            <button
                                type="button"
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                    padding: "4px 0 12px",
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    color: "var(--djac-muted-foreground, #94a3b8)",
                                    fontSize: 12,
                                    fontWeight: 500,
                                }}
                            >
                                {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                                {assessment.gaps.length} gap{assessment.gaps.length !== 1 ? "s" : ""} identified
                            </button>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                {SEVERITY_ORDER.map(sev =>
                                    assessment.gaps
                                        .filter(g => g.severity === sev)
                                        .map((gap, idx) => (
                                            <GapItem key={gap.code} gap={gap} idx={idx} vendorId={entry.vendor.id} />
                                        ))
                                )}
                            </div>
                            {assessment.recommendations.length > 0 && (
                                <div
                                    style={{
                                        marginTop: 14,
                                        padding: "12px 16px",
                                        borderRadius: 8,
                                        background: "rgba(99,102,241,0.06)",
                                        border: "1px solid rgba(99,102,241,0.20)",
                                    }}
                                >
                                    <p
                                        style={{
                                            margin: "0 0 8px",
                                            fontSize: 11,
                                            fontWeight: 700,
                                            textTransform: "uppercase",
                                            letterSpacing: "0.06em",
                                            color: "#818cf8",
                                        }}
                                    >
                                        Top Recommendations
                                    </p>
                                    <ul
                                        style={{
                                            margin: 0,
                                            paddingLeft: 18,
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: 4,
                                        }}
                                    >
                                        {assessment.recommendations.slice(0, 3).map((rec, i) => (
                                            <li
                                                key={`rec-${i}`}
                                                style={{
                                                    fontSize: 12,
                                                    color: "var(--djac-foreground, #f1f5f9)",
                                                    lineHeight: 1.5,
                                                }}
                                            >
                                                {rec}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </CollapsibleContent>
                    </Collapsible>
                )}
            </CardContent>
        </Card>
    );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
    label,
    count,
    color,
    icon: Icon,
}: {
    label: string;
    count: number;
    color: string;
    icon: React.FC<{ size?: number; style?: React.CSSProperties }>;
}) {
    return (
        <div
            style={{
                flex: "1 1 140px",
                padding: "16px 20px",
                borderRadius: 12,
                background: "var(--djac-card, rgba(15,23,42,0.8))",
                border: "1px solid var(--djac-border, rgba(148,163,184,0.12))",
                display: "flex",
                flexDirection: "column",
                gap: 6,
            }}
        >
            <Icon size={18} style={{ color }} />
            <div
                style={{
                    fontSize: 28,
                    fontWeight: 700,
                    color,
                    lineHeight: 1,
                }}
            >
                {count}
            </div>
            <div
                style={{
                    fontSize: 11,
                    color: "var(--djac-muted-foreground, #94a3b8)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                }}
            >
                {label}
            </div>
        </div>
    );
}

// ─── Filter controls ──────────────────────────────────────────────────────────

type SeverityFilter = "all" | AssessmentSeverity;
type JurisdictionFilter = "all" | GapJurisdiction;

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function GapTracker() {
    const { t } = useLocale();
    usePageTitle(t("gapTracker.title", "Vendor Gap Tracker"));

    const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all");
    const [jurisFilter, setJurisFilter] = useState<JurisdictionFilter>("all");

    const { data, isLoading, error, refetch } = trpc.vendor.gapSummary.useQuery(undefined, {
        staleTime: 120_000,
    });

    useEffect(() => {
        if (error) {
            toast.error(t("gapTracker.loadError", "Failed to load gap analysis") + ": " + error.message);
        }
    }, [error]);

    // Flatten all gaps with vendor info for aggregate stats
    const allGaps = useMemo(() => {
        if (!data) return [];
        return data.flatMap(entry =>
            entry.assessment.gaps.map(gap => ({ ...gap, vendorId: entry.vendor.id }))
        );
    }, [data]);

    const stats = useMemo(
        () => ({
            total: allGaps.length,
            critical: allGaps.filter(g => g.severity === "critical").length,
            high: allGaps.filter(g => g.severity === "high").length,
            medium: allGaps.filter(g => g.severity === "medium").length,
            low: allGaps.filter(g => g.severity === "low").length,
        }),
        [allGaps]
    );

    // Apply filters to vendor entries
    const filteredEntries = useMemo(() => {
        if (!data) return [];
        return data
            .map(entry => ({
                ...entry,
                assessment: {
                    ...entry.assessment,
                    gaps: entry.assessment.gaps.filter(
                        gap =>
                            (severityFilter === "all" || gap.severity === severityFilter) &&
                            (jurisFilter === "all" || gap.jurisdiction === jurisFilter)
                    ),
                },
            }))
            .filter(entry => entry.assessment.gaps.length > 0 || (severityFilter === "all" && jurisFilter === "all"));
    }, [data, severityFilter, jurisFilter]);

    const isRTL = false; // locale direction handled by DashboardLayout

    return (
        <div className="djac-page">
            {/* ── Page Header ──────────────────────────────────────── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <ClipboardList size={22} style={{ color: "#818cf8" }} />
                    <h1
                        style={{
                            margin: 0,
                            fontSize: 22,
                            fontWeight: 700,
                            color: "var(--djac-foreground, #f1f5f9)",
                        }}
                    >
                        {t("gapTracker.title", "Vendor Compliance Gap Tracker")}
                    </h1>
                </div>
                <p
                    style={{
                        margin: 0,
                        fontSize: 13,
                        color: "var(--djac-muted-foreground, #94a3b8)",
                        maxWidth: 680,
                    }}
                >
                    {t(
                        "gapTracker.subtitle",
                        "Rule-based dual-jurisdiction compliance gap analysis across all registered vendors. Identifies PIPL, CSL, DSL, PDPL and NCA gaps with remediation guidance."
                    )}
                </p>
            </div>

            {/* ── Stats Row ────────────────────────────────────────── */}
            {!isLoading && !error && (
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <StatCard
                        label={t("gapTracker.statTotal", "Total Gaps")}
                        count={stats.total}
                        color="#818cf8"
                        icon={({ size, style }) => <ClipboardList size={size} style={style} />}
                    />
                    <StatCard
                        label={t("gapTracker.statCritical", "Critical")}
                        count={stats.critical}
                        color="#ef4444"
                        icon={({ size, style }) => <ShieldX size={size} style={style} />}
                    />
                    <StatCard
                        label={t("gapTracker.statHigh", "High")}
                        count={stats.high}
                        color="#f97316"
                        icon={({ size, style }) => <ShieldAlert size={size} style={style} />}
                    />
                    <StatCard
                        label={t("gapTracker.statMedium", "Medium")}
                        count={stats.medium}
                        color="#eab308"
                        icon={({ size, style }) => <AlertTriangle size={size} style={style} />}
                    />
                    <StatCard
                        label={t("gapTracker.statLow", "Low")}
                        count={stats.low}
                        color="#22c55e"
                        icon={({ size, style }) => <ShieldCheck size={size} style={style} />}
                    />
                </div>
            )}

            {/* ── Filter Bar ───────────────────────────────────────── */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    flexWrap: "wrap",
                    padding: "12px 16px",
                    borderRadius: 10,
                    background: "var(--djac-card, rgba(15,23,42,0.8))",
                    border: "1px solid var(--djac-border, rgba(148,163,184,0.12))",
                }}
            >
                <Filter size={14} style={{ color: "#94a3b8", flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: "#94a3b8", flexShrink: 0 }}>
                    {t("gapTracker.filterBy", "Filter by:")}
                </span>

                {/* Severity filter */}
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {(["all", "critical", "high", "medium", "low"] as SeverityFilter[]).map(sev => (
                        <button
                            key={sev}
                            type="button"
                            onClick={() => setSeverityFilter(sev)}
                            style={{
                                padding: "3px 10px",
                                borderRadius: 999,
                                fontSize: 11,
                                fontWeight: 500,
                                border:
                                    severityFilter === sev
                                        ? "1px solid #818cf8"
                                        : "1px solid var(--djac-border, rgba(148,163,184,0.15))",
                                background:
                                    severityFilter === sev
                                        ? "rgba(129,140,248,0.15)"
                                        : "transparent",
                                color:
                                    severityFilter === sev
                                        ? "#818cf8"
                                        : "var(--djac-muted-foreground, #94a3b8)",
                                cursor: "pointer",
                                transition: "all 0.15s",
                                textTransform: "capitalize",
                            }}
                        >
                            {sev === "all" ? t("gapTracker.filterAll", "All Severity") : sev}
                        </button>
                    ))}
                </div>

                <div
                    style={{
                        width: 1,
                        height: 18,
                        background: "var(--djac-border, rgba(148,163,184,0.20))",
                        margin: "0 4px",
                    }}
                />

                {/* Jurisdiction filter */}
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {(["all", "china", "saudi", "cross_border"] as JurisdictionFilter[]).map(jur => (
                        <button
                            key={jur}
                            type="button"
                            onClick={() => setJurisFilter(jur)}
                            style={{
                                padding: "3px 10px",
                                borderRadius: 999,
                                fontSize: 11,
                                fontWeight: 500,
                                border:
                                    jurisFilter === jur
                                        ? "1px solid #818cf8"
                                        : "1px solid var(--djac-border, rgba(148,163,184,0.15))",
                                background:
                                    jurisFilter === jur
                                        ? "rgba(129,140,248,0.15)"
                                        : "transparent",
                                color:
                                    jurisFilter === jur
                                        ? "#818cf8"
                                        : "var(--djac-muted-foreground, #94a3b8)",
                                cursor: "pointer",
                                transition: "all 0.15s",
                                textTransform: "capitalize",
                            }}
                        >
                            {jur === "all"
                                ? t("gapTracker.filterAllJuris", "All Jurisdiction")
                                : JURISDICTION_LABEL[jur]}
                        </button>
                    ))}
                </div>

                {(severityFilter !== "all" || jurisFilter !== "all") && (
                    <Button
                        variant="ghost"
                        size="sm"
                        style={{ marginLeft: "auto", fontSize: 11, height: 26 }}
                        onClick={() => {
                            setSeverityFilter("all");
                            setJurisFilter("all");
                        }}
                    >
                        {t("gapTracker.clearFilters", "Clear filters")}
                    </Button>
                )}
            </div>

            {/* ── Content ──────────────────────────────────────────── */}
            {isLoading && (
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 80,
                        color: "#94a3b8",
                        fontSize: 14,
                        gap: 10,
                    }}
                >
                    <ClipboardList size={20} style={{ opacity: 0.5 }} />
                    {t("gapTracker.loading", "Running gap analysis across all vendors…")}
                </div>
            )}

            {error && (
                <div
                    style={{
                        padding: "24px",
                        borderRadius: 12,
                        background: "rgba(239,68,68,0.08)",
                        border: "1px solid rgba(239,68,68,0.25)",
                        color: "#fca5a5",
                        fontSize: 14,
                    }}
                >
                    <p style={{ margin: 0 }}>
                        {t("gapTracker.errorTitle", "Gap analysis unavailable")} — {error.message}
                    </p>
                    <Button
                        variant="outline"
                        size="sm"
                        className="mt-3"
                        onClick={() => { void refetch(); }}
                    >
                        {t("common.retry", "Retry")}
                    </Button>
                </div>
            )}

            {!isLoading && !error && data && data.length === 0 && (
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 14,
                        padding: "80px 0",
                        color: "#94a3b8",
                    }}
                >
                    <Building2 size={40} style={{ opacity: 0.3 }} />
                    <div
                        style={{
                            textAlign: "center",
                        }}
                    >
                        <p
                            style={{
                                margin: "0 0 6px",
                                fontSize: 16,
                                fontWeight: 600,
                                color: "var(--djac-foreground, #f1f5f9)",
                            }}
                        >
                            {t("gapTracker.emptyTitle", "No vendors registered yet")}
                        </p>
                        <p style={{ margin: 0, fontSize: 13, maxWidth: 380, textAlign: "center" }}>
                            {t(
                                "gapTracker.emptyDesc",
                                "Register your first vendor in Vendor Assessment to begin gap tracking."
                            )}
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => (window.location.href = "/vendor-risk")}
                    >
                        {t("gapTracker.goToVendors", "Go to Vendor Risk Dashboard")}
                    </Button>
                </div>
            )}

            {!isLoading && !error && filteredEntries.length > 0 && (
                <>
                    {(severityFilter !== "all" || jurisFilter !== "all") && (
                        <p style={{ margin: 0, fontSize: 12, color: "#94a3b8" }}>
                            {t("gapTracker.showingFiltered", "Showing vendors with matching gaps")} (
                            {filteredEntries.length} / {data?.length ?? 0})
                        </p>
                    )}
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        {filteredEntries.map(entry => (
                            <VendorCard key={`vendor-${entry.vendor.id}`} entry={entry as GapEntry} />
                        ))}
                    </div>
                </>
            )}

            {!isLoading && !error && data && data.length > 0 && filteredEntries.length === 0 && (
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 10,
                        padding: 60,
                        color: "#94a3b8",
                        fontSize: 13,
                    }}
                >
                    <ShieldCheck size={18} style={{ color: "#22c55e" }} />
                    {t(
                        "gapTracker.noGapsForFilter",
                        "No gaps match the active filters — all vendors are within threshold for this selection."
                    )}
                </div>
            )}
        </div>
    );
}
