/**
 * AssessmentHistory.tsx — Phase 24
 *
 * Shows the AI-powered vendor assessment job history for the current user.
 * Data comes from `ai.listAssessmentJobs` (in-process queue persisted to
 * disk) combined with `vendor.list` for resolving vendor names.
 *
 * Features:
 *  - Stat tiles: total / completed / failed / in-progress
 *  - Filter bar: All | Completed | Failed | Running/Queued
 *  - Job cards with status badge, vendor name, scores, gap count, duration
 *  - Expandable event timeline per job
 *  - Clear history button (with confirm dialog)
 *  - EN / AR / ZH locale support
 */

import { useEffect, useMemo, useState } from "react";
import type React from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { useLocale } from "@/contexts/useLocale";
import { usePageTitle } from "@/hooks/usePageTitle";
import {
    AlertCircle,
    AlertTriangle,
    Bot,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    CircleDashed,
    ClipboardList,
    Clock,
    ExternalLink,
    FileSearch,
    Loader2,
    ShieldAlert,
    ShieldCheck,
    ShieldX,
    Trash2,
} from "lucide-react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

type JobStatus = "queued" | "running" | "completed" | "failed";

interface JobGap {
    code: string;
    severity: "critical" | "high" | "medium" | "low";
    title: string;
}

interface JobAssessment {
    overallScore: number;
    jurisdictionScores: { china: number; saudiArabia: number };
    status: "compliant" | "partial" | "non_compliant";
    riskLevel: "low" | "medium" | "high" | "critical";
    gaps: JobGap[];
}

interface JobEvent {
    stage: string;
    message: string;
    timestamp: string;
}

interface JobPersistence {
    savedAssessments: number;
    savedGaps: number;
    skipped: boolean;
}

interface AiJob {
    id: string;
    status: JobStatus;
    stage: string;
    createdAt: string;
    updatedAt: string;
    events: JobEvent[];
    error?: string;
    result?: {
        inputSummary: { vendorId: number; source: string };
        assessment?: JobAssessment;
        validator?: { passed: boolean; attempts: number };
    };
    persistence?: JobPersistence;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
    JobStatus,
    { label: string; color: string; bg: string; border: string; icon: React.FC<{ size?: number }> }
> = {
    completed: {
        label: "Completed",
        color: "#22c55e",
        bg: "rgba(34,197,94,0.10)",
        border: "rgba(34,197,94,0.30)",
        icon: ({ size = 13 }) => <CheckCircle2 size={size} style={{ color: "#22c55e" }} />,
    },
    failed: {
        label: "Failed",
        color: "#ef4444",
        bg: "rgba(239,68,68,0.10)",
        border: "rgba(239,68,68,0.30)",
        icon: ({ size = 13 }) => <AlertCircle size={size} style={{ color: "#ef4444" }} />,
    },
    running: {
        label: "Running",
        color: "#3b82f6",
        bg: "rgba(59,130,246,0.10)",
        border: "rgba(59,130,246,0.30)",
        icon: ({ size = 13 }) => <Loader2 size={size} style={{ color: "#3b82f6", animation: "spin 1s linear infinite" }} />,
    },
    queued: {
        label: "Queued",
        color: "#94a3b8",
        bg: "rgba(148,163,184,0.10)",
        border: "rgba(148,163,184,0.25)",
        icon: ({ size = 13 }) => <CircleDashed size={size} style={{ color: "#94a3b8" }} />,
    },
};

const RISK_COLOR: Record<string, string> = {
    low: "#22c55e",
    medium: "#eab308",
    high: "#f97316",
    critical: "#ef4444",
};

const SEV_ICON: Record<string, React.FC<{ size?: number }>> = {
    critical: ({ size = 11 }) => <ShieldX size={size} style={{ color: "#ef4444" }} />,
    high: ({ size = 11 }) => <ShieldAlert size={size} style={{ color: "#f97316" }} />,
    medium: ({ size = 11 }) => <AlertTriangle size={size} style={{ color: "#eab308" }} />,
    low: ({ size = 11 }) => <ShieldCheck size={size} style={{ color: "#22c55e" }} />,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(startIso: string, endIso: string): string {
    const ms = new Date(endIso).getTime() - new Date(startIso).getTime();
    if (ms < 0) return "–";
    if (ms < 1000) return `${ms}ms`;
    const secs = Math.floor(ms / 1000);
    if (secs < 60) return `${secs}s`;
    const mins = Math.floor(secs / 60);
    return `${mins}m ${secs % 60}s`;
}

function formatTs(iso: string): string {
    try {
        return new Intl.DateTimeFormat("en-GB", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }).format(new Date(iso));
    } catch {
        return iso;
    }
}

function shortId(id: string): string {
    return id.slice(0, 8).toUpperCase();
}

function sourceBadge(source: string) {
    return source === "document_upload" ? (
        <span style={{ fontSize: 10, color: "#a78bfa", background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.25)", padding: "1px 6px", borderRadius: 4 }}>
            Document
        </span>
    ) : (
        <span style={{ fontSize: 10, color: "#60a5fa", background: "rgba(96,165,250,0.12)", border: "1px solid rgba(96,165,250,0.25)", padding: "1px 6px", borderRadius: 4 }}>
            Vendor Profile
        </span>
    );
}

// ─── Event Timeline ───────────────────────────────────────────────────────────

function EventTimeline({ events, error }: { events: JobEvent[]; error?: string }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {events.map((ev, i) => (
                <div
                    key={`ev-${i}`}
                    style={{ display: "flex", gap: 10, paddingBottom: 10, position: "relative" }}
                >
                    {/* Vertical connector */}
                    {i < events.length - 1 && (
                        <div
                            style={{
                                position: "absolute",
                                left: 6,
                                top: 14,
                                bottom: 0,
                                width: 1,
                                background: "var(--djac-border, rgba(148,163,184,0.15))",
                            }}
                        />
                    )}
                    <div
                        style={{
                            width: 13,
                            height: 13,
                            borderRadius: "50%",
                            background: "rgba(99,102,241,0.35)",
                            border: "1px solid rgba(99,102,241,0.5)",
                            flexShrink: 0,
                            marginTop: 2,
                        }}
                    />
                    <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                            <span
                                style={{
                                    fontSize: 10,
                                    fontWeight: 600,
                                    padding: "0 5px",
                                    borderRadius: 3,
                                    background: "rgba(99,102,241,0.15)",
                                    color: "#818cf8",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.05em",
                                }}
                            >
                                {ev.stage}
                            </span>
                            <span style={{ fontSize: 10, color: "#64748b" }}>{formatTs(ev.timestamp)}</span>
                        </div>
                        <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--djac-muted-foreground, #94a3b8)", lineHeight: 1.5 }}>
                            {ev.message}
                        </p>
                    </div>
                </div>
            ))}
            {error && (
                <div
                    style={{
                        marginTop: 6,
                        padding: "8px 12px",
                        borderRadius: 6,
                        background: "rgba(239,68,68,0.08)",
                        border: "1px solid rgba(239,68,68,0.25)",
                        fontSize: 12,
                        color: "#fca5a5",
                    }}
                >
                    {error}
                </div>
            )}
        </div>
    );
}

// ─── Score Mini ────────────────────────────────────────────────────────────────

function ScoreMini({ label, score }: { label: string; score: number }) {
    const color = score >= 85 ? "#22c55e" : score >= 65 ? "#eab308" : "#ef4444";
    return (
        <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color, lineHeight: 1 }}>{score}</div>
            <div style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
        </div>
    );
}

// ─── Job Card ─────────────────────────────────────────────────────────────────

function JobCard({
    job,
    vendorName,
    vendorId,
    scoreLabels,
}: {
    job: AiJob;
    vendorName: string;
    vendorId?: number;
    scoreLabels: {
        overall: string;
        china: string;
        saudiArabia: string;
    };
}) {
    const [expanded, setExpanded] = useState(false);
    const cfg = STATUS_CONFIG[job.status];
    const StatusIcon = cfg.icon;
    const assessment = job.result?.assessment;
    const inputSummary = job.result?.inputSummary;

    const _criticalCount = assessment?.gaps.filter(g => g.severity === "critical").length ?? 0;
    const _highCount = assessment?.gaps.filter(g => g.severity === "high").length ?? 0;

    return (
        <Card
            style={{
                background: "var(--djac-card, rgba(15,23,42,0.8))",
                border: `1px solid var(--djac-border, rgba(148,163,184,0.12))`,
                borderRadius: 10,
                overflow: "hidden",
            }}
        >
            <CardHeader style={{ padding: "14px 18px 10px" }}>
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    {/* Status bubble */}
                    <div
                        style={{
                            width: 34,
                            height: 34,
                            borderRadius: 8,
                            background: cfg.bg,
                            border: `1px solid ${cfg.border}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                        }}
                    >
                        <StatusIcon size={16} />
                    </div>

                    {/* Main info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                            {vendorId ? (
                                <Link
                                    href={`/vendor/${vendorId}`}
                                    style={{
                                        fontSize: 13,
                                        fontWeight: 600,
                                        color: "var(--djac-foreground, #f1f5f9)",
                                        textDecoration: "none",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 4,
                                    }}
                                    className="hover:underline"
                                >
                                    {vendorName}
                                    <ExternalLink size={11} style={{ opacity: 0.5 }} />
                                </Link>
                            ) : (
                                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--djac-foreground, #f1f5f9)" }}>
                                    {vendorName}
                                </span>
                            )}
                            <span
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 3,
                                    fontSize: 11,
                                    fontWeight: 500,
                                    color: cfg.color,
                                    background: cfg.bg,
                                    border: `1px solid ${cfg.border}`,
                                    padding: "1px 7px",
                                    borderRadius: 999,
                                }}
                            >
                                <StatusIcon size={10} />
                                {cfg.label}
                            </span>
                            {inputSummary && sourceBadge(inputSummary.source)}
                        </div>
                        <div style={{ display: "flex", gap: 12, marginTop: 4, flexWrap: "wrap", alignItems: "center" }}>
                            <span style={{ fontSize: 11, color: "#64748b" }}>
                                Job #{shortId(job.id)}
                            </span>
                            <span style={{ fontSize: 11, color: "#64748b", display: "flex", alignItems: "center", gap: 3 }}>
                                <Clock size={10} />
                                {formatTs(job.createdAt)}
                            </span>
                            {job.status !== "queued" && job.status !== "running" && (
                                <span style={{ fontSize: 11, color: "#64748b" }}>
                                    Duration: {formatDuration(job.createdAt, job.updatedAt)}
                                </span>
                            )}
                            {assessment && (
                                <span
                                    style={{
                                        fontSize: 11,
                                        fontWeight: 600,
                                        color: RISK_COLOR[assessment.riskLevel] ?? "#94a3b8",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.06em",
                                    }}
                                >
                                    {assessment.riskLevel} risk
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Score pills */}
                    {assessment && (
                        <div
                            style={{
                                display: "flex",
                                gap: 14,
                                padding: "6px 12px",
                                borderRadius: 8,
                                background: "var(--djac-muted, rgba(148,163,184,0.06))",
                                border: "1px solid var(--djac-border, rgba(148,163,184,0.10))",
                                flexShrink: 0,
                            }}
                        >
                            <ScoreMini label={scoreLabels.overall} score={assessment.overallScore} />
                            <ScoreMini label={scoreLabels.china} score={assessment.jurisdictionScores.china} />
                            <ScoreMini label={scoreLabels.saudiArabia} score={assessment.jurisdictionScores.saudiArabia} />
                        </div>
                    )}
                </div>
            </CardHeader>

            <CardContent style={{ padding: "0 18px 14px" }}>
                {/* Gap summary row */}
                {assessment && assessment.gaps.length > 0 && (
                    <div style={{ display: "flex", gap: 12, marginBottom: 10, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 12, color: "#94a3b8" }}>
                            {assessment.gaps.length} gap{assessment.gaps.length !== 1 ? "s" : ""}:
                        </span>
                        {(["critical", "high", "medium", "low"] as const).map(sev => {
                            const count = assessment.gaps.filter(g => g.severity === sev).length;
                            if (count === 0) return null;
                            const SevIcon = SEV_ICON[sev];
                            return (
                                <span key={sev} style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 12 }}>
                                    <SevIcon size={11} />
                                    <span style={{ color: RISK_COLOR[sev], fontWeight: 600 }}>{count}</span>
                                    <span style={{ color: "#64748b", textTransform: "capitalize" }}>{sev}</span>
                                </span>
                            );
                        })}
                        {job.persistence && !job.persistence.skipped && (
                            <span style={{ fontSize: 11, color: "#22c55e", marginLeft: "auto" }}>
                                âœ“ Persisted ({job.persistence.savedAssessments} assessments, {job.persistence.savedGaps} gaps)
                            </span>
                        )}
                        {job.persistence?.skipped && (
                            <span style={{ fontSize: 11, color: "#64748b", marginLeft: "auto" }}>
                                Not persisted
                            </span>
                        )}
                    </div>
                )}

                {/* Expand/collapse event timeline */}
                {(job.events.length > 0 || job.error) && (
                    <Collapsible open={expanded} onOpenChange={setExpanded}>
                        <CollapsibleTrigger asChild>
                            <button
                                type="button"
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 5,
                                    padding: "3px 0",
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    color: "#64748b",
                                    fontSize: 11,
                                    fontWeight: 500,
                                }}
                            >
                                {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                {expanded ? "Hide" : "Show"} pipeline events ({job.events.length})
                            </button>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                            <div
                                style={{
                                    marginTop: 8,
                                    padding: "12px 14px",
                                    borderRadius: 8,
                                    background: "var(--djac-muted, rgba(148,163,184,0.04))",
                                    border: "1px solid var(--djac-border, rgba(148,163,184,0.10))",
                                    maxHeight: 320,
                                    overflowY: "auto",
                                }}
                            >
                                <EventTimeline events={job.events} error={job.error} />
                            </div>
                        </CollapsibleContent>
                    </Collapsible>
                )}
            </CardContent>
        </Card>
    );
}

// ─── Stat Tile ────────────────────────────────────────────────────────────────

function StatTile({
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
                flex: "1 1 130px",
                padding: "14px 18px",
                borderRadius: 10,
                background: "var(--djac-card, rgba(15,23,42,0.8))",
                border: "1px solid var(--djac-border, rgba(148,163,184,0.12))",
                display: "flex",
                flexDirection: "column",
                gap: 5,
            }}
        >
            <Icon size={16} style={{ color }} />
            <div style={{ fontSize: 26, fontWeight: 700, color, lineHeight: 1 }}>{count}</div>
            <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
        </div>
    );
}

// ─── Filter tabs ──────────────────────────────────────────────────────────────

type FilterTab = "all" | JobStatus;

const FILTER_TABS: { key: FilterTab; label: string }[] = [
    { key: "all", label: "All" },
    { key: "completed", label: "Completed" },
    { key: "failed", label: "Failed" },
    { key: "running", label: "Running" },
    { key: "queued", label: "Queued" },
];

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AssessmentHistory() {
    const { t } = useLocale();
    usePageTitle(t("assessmentHistory.title", "Assessment History"));

    const scoreLabels = useMemo(() => ({
        overall: t("assessmentHistory.scoreOverall", "Overall"),
        china: t("assessmentHistory.scoreChina", "China"),
        saudiArabia: t("assessmentHistory.scoreKSA", "Saudi Arabia"),
    }), [t]);

    const [filter, setFilter] = useState<FilterTab>("all");
    const [confirmClear, setConfirmClear] = useState(false);

    const { data: jobs, isLoading, error, refetch } = trpc.ai.listAssessmentJobs.useQuery(
        { limit: 100 },
        { staleTime: 30_000 }
    );

    const { data: vendorList } = trpc.vendor.list.useQuery(undefined, {
        staleTime: 120_000,
    });

    const clearMutation = trpc.ai.clearHistory.useMutation({
        onSuccess: () => {
            toast.success(t("assessmentHistory.cleared", "Assessment history cleared."));
            void refetch();
        },
        onError: (err) => {
            toast.error(t("assessmentHistory.clearError", "Failed to clear history") + ": " + err.message);
        },
    });

    useEffect(() => {
        if (error) {
            toast.error(t("assessmentHistory.loadError", "Failed to load assessment history") + ": " + error.message);
        }
    }, [error]);

    // Vendor id → name lookup
    const vendorNameById = useMemo(() => {
        const m = new Map<number, string>();
        for (const v of vendorList ?? []) {
            m.set(v.id, v.vendorName);
        }
        return m;
    }, [vendorList]);

    const typedJobs = (jobs ?? []) as AiJob[];

    const stats = useMemo(
        () => ({
            total: typedJobs.length,
            completed: typedJobs.filter(j => j.status === "completed").length,
            failed: typedJobs.filter(j => j.status === "failed").length,
            active: typedJobs.filter(j => j.status === "running" || j.status === "queued").length,
        }),
        [typedJobs]
    );

    const filtered = useMemo(
        () => (filter === "all" ? typedJobs : typedJobs.filter(j => j.status === filter)),
        [typedJobs, filter]
    );

    return (
        <div className="djac-page">
            {/* ── Header ─────────────────────────────────────────── */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div
                    style={{
                        width: 42,
                        height: 42,
                        borderRadius: 10,
                        background: "rgba(99,102,241,0.12)",
                        border: "1px solid rgba(99,102,241,0.25)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                    }}
                >
                    <Bot size={20} style={{ color: "#818cf8" }} />
                </div>
                <div style={{ flex: 1 }}>
                    <h1 style={{ margin: 0, fontSize: 21, fontWeight: 700, color: "var(--djac-foreground, #f1f5f9)" }}>
                        {t("assessmentHistory.title", "AI Assessment History")}
                    </h1>
                    <p style={{ margin: "3px 0 0", fontSize: 13, color: "#64748b", maxWidth: 620 }}>
                        {t(
                            "assessmentHistory.subtitle",
                            "Full pipeline log of all AI-powered vendor compliance assessments run from this account."
                        )}
                    </p>
                </div>
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void refetch()}
                        disabled={isLoading}
                        style={{ fontSize: 12, height: 32 }}
                    >
                        {isLoading ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> : <FileSearch size={12} />}
                        &nbsp;{t("assessmentHistory.refresh", "Refresh")}
                    </Button>
                    {stats.total > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setConfirmClear(true)}
                            style={{ fontSize: 12, height: 32, color: "#ef4444" }}
                        >
                            <Trash2 size={12} />
                            &nbsp;{t("assessmentHistory.clearBtn", "Clear History")}
                        </Button>
                    )}
                </div>
            </div>

            {/* ── Stats ──────────────────────────────────────────── */}
            {!isLoading && !error && (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <StatTile
                        label={t("assessmentHistory.statTotal", "Total Jobs")}
                        count={stats.total}
                        color="#818cf8"
                        icon={({ size, style }) => <ClipboardList size={size} style={style} />}
                    />
                    <StatTile
                        label={t("assessmentHistory.statCompleted", "Completed")}
                        count={stats.completed}
                        color="#22c55e"
                        icon={({ size, style }) => <CheckCircle2 size={size} style={style} />}
                    />
                    <StatTile
                        label={t("assessmentHistory.statFailed", "Failed")}
                        count={stats.failed}
                        color="#ef4444"
                        icon={({ size, style }) => <AlertCircle size={size} style={style} />}
                    />
                    <StatTile
                        label={t("assessmentHistory.statActive", "In Progress")}
                        count={stats.active}
                        color="#3b82f6"
                        icon={({ size, style }) => <Loader2 size={size} style={style} />}
                    />
                </div>
            )}

            {/* ── Filter Bar ─────────────────────────────────────── */}
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {FILTER_TABS.map(tab => (
                    <button
                        key={tab.key}
                        type="button"
                        onClick={() => setFilter(tab.key)}
                        style={{
                            padding: "4px 14px",
                            borderRadius: 999,
                            fontSize: 12,
                            fontWeight: 500,
                            border: filter === tab.key
                                ? "1px solid #818cf8"
                                : "1px solid var(--djac-border, rgba(148,163,184,0.15))",
                            background: filter === tab.key
                                ? "rgba(129,140,248,0.15)"
                                : "transparent",
                            color: filter === tab.key ? "#818cf8" : "#94a3b8",
                            cursor: "pointer",
                            transition: "all 0.15s",
                        }}
                    >
                        {tab.label}
                        {tab.key !== "all" && (
                            <span style={{ marginLeft: 5, opacity: 0.7 }}>
                                (
                                {tab.key === "completed" ? stats.completed
                                    : tab.key === "failed" ? stats.failed
                                        : stats.active}
                                )
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* ── Content ────────────────────────────────────────── */}
            {isLoading && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 60, color: "#64748b", fontSize: 14, justifyContent: "center" }}>
                    <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
                    {t("assessmentHistory.loading", "Loading assessment history…")}
                </div>
            )}

            {error && (
                <div style={{ padding: 20, borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#fca5a5", fontSize: 13 }}>
                    <p style={{ margin: 0 }}>{error.message}</p>
                    <Button
                        variant="outline"
                        size="sm"
                        className="mt-3 h-7 text-xs"
                        onClick={() => { void refetch(); }}
                    >
                        {t("common.retry", "Retry")}
                    </Button>
                </div>
            )}

            {!isLoading && !error && filtered.length === 0 && (
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 14,
                        padding: "80px 0",
                        color: "#64748b",
                    }}
                >
                    <Bot size={40} style={{ opacity: 0.25 }} />
                    <div style={{ textAlign: "center" }}>
                        <p style={{ margin: "0 0 5px", fontSize: 15, fontWeight: 600, color: "var(--djac-foreground, #f1f5f9)" }}>
                            {filter === "all"
                                ? t("assessmentHistory.noJobsTitle", "No assessment jobs yet")
                                : t("assessmentHistory.noJobsFilterTitle", `No ${filter} jobs`)}
                        </p>
                        <p style={{ margin: 0, fontSize: 13, maxWidth: 380, textAlign: "center" }}>
                            {filter === "all"
                                ? t("assessmentHistory.noJobsDesc", "Run a vendor assessment from the Vendor Risk Dashboard to populate this history.")
                                : t("assessmentHistory.noJobsFilterDesc", "Try a different status filter.")}
                        </p>
                    </div>
                </div>
            )}

            {!isLoading && !error && filtered.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {filtered.map(job => {
                        const vendorId = job.result?.inputSummary?.vendorId;
                        const vendorName = vendorId
                            ? (vendorNameById.get(vendorId) ?? `Vendor #${vendorId}`)
                            : t("assessmentHistory.unknownVendor", "Unknown Vendor");
                        return (
                            <JobCard key={`job-${job.id}`} job={job} vendorName={vendorName} vendorId={vendorId} scoreLabels={scoreLabels} />
                        );
                    })}
                </div>
            )}

            {/* ── Confirm Clear Dialog ────────────────────────────── */}
            <Dialog open={confirmClear} onOpenChange={setConfirmClear}>
                <DialogContent style={{ maxWidth: 420 }}>
                    <DialogHeader>
                        <DialogTitle>{t("assessmentHistory.clearConfirmTitle", "Clear Assessment History?")}</DialogTitle>
                        <DialogDescription>
                            {t(
                                "assessmentHistory.clearConfirmDesc",
                                "This will permanently remove all assessment job records from this account. Vendor and compliance data already saved to the database will not be affected."
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <Separator />
                    <DialogFooter>
                        <Button variant="outline" size="sm" onClick={() => setConfirmClear(false)}>
                            {t("assessmentHistory.cancel", "Cancel")}
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            disabled={clearMutation.isPending}
                            onClick={() => {
                                clearMutation.mutate();
                                setConfirmClear(false);
                            }}
                        >
                            {clearMutation.isPending ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> : <Trash2 size={12} />}
                            &nbsp;{t("assessmentHistory.clearConfirm", "Yes, Clear History")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
