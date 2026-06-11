/**
 * AIOrchestrationFeed
 * ──────────────────────────────────────────────────────────────────────────────
 * Glass-box view of the DJAC AI compliance pipeline. Polls the latest assessment
 * jobs and renders a live stage-progress timeline with event logs and scoring.
 *
 * Uses: trpc.ai.listAssessmentJobs (polling) — no WS subscription required for
 * the "latest job" view, keeping the UI simple and reconnection-safe.
 */
import { useMemo, useEffect, useRef } from "react";
import { useTheme } from "@/contexts/useTheme";
import { useLocale } from "@/contexts/useLocale";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import {
    Bot, CheckCircle2, Clock, AlertTriangle, Loader2,
    Shield, FileSearch2, Brain, Scale, Sparkles,
    ClipboardCheck, Archive, Cpu, Zap,
    Activity, WifiOff,
} from "lucide-react";

// ── Stage metadata ────────────────────────────────────────────────────────────
type StageKey =
    | "queued" | "gatekeeper" | "intake" | "extractor" | "rag_context"
    | "judge" | "synthesizer" | "validator" | "reporter" | "persistence"
    | "completed" | "failed";

interface StageMeta {
    label: string;
    icon: React.FC<{ className?: string; style?: React.CSSProperties }>;
    description: string;
}

const STAGE_META: Record<StageKey, StageMeta> = {
    queued: { label: "Queue", icon: Clock, description: "Waiting for worker slot" },
    gatekeeper: { label: "Gatekeeper", icon: Shield, description: "Security & PII pre-check" },
    intake: { label: "Intake Clerk", icon: FileSearch2, description: "Document parsing & normalization" },
    extractor: { label: "Extractor", icon: Cpu, description: "Entity & clause extraction" },
    rag_context: { label: "RAG Context", icon: Brain, description: "Retrieve regulatory embeddings" },
    judge: { label: "Judge", icon: Scale, description: "Compliance gap analysis" },
    synthesizer: { label: "Synthesizer", icon: Sparkles, description: "Narrative generation" },
    validator: { label: "Validator", icon: ClipboardCheck, description: "Schema & scoring validation" },
    reporter: { label: "Reporter", icon: FileSearch2, description: "PDF / JSON report emission" },
    persistence: { label: "Persist", icon: Archive, description: "Audit ledger write" },
    completed: { label: "Complete", icon: CheckCircle2, description: "Assessment finalised" },
    failed: { label: "Failed", icon: AlertTriangle, description: "Pipeline error" },
};

const STAGE_ORDER: StageKey[] = [
    "queued", "gatekeeper", "intake", "extractor", "rag_context",
    "judge", "synthesizer", "validator", "reporter", "persistence", "completed",
];

function stageIndex(stage: string): number {
    const i = STAGE_ORDER.indexOf(stage as StageKey);
    return i === -1 ? 0 : i;
}

// ── Mini gauge ────────────────────────────────────────────────────────────────
function MiniGauge({ value, color, label }: { value: number; color: string; label: string }) {
    const r = 18;
    const circ = 2 * Math.PI * r;
    const arc = circ * (value / 100);
    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <svg width={48} height={48} viewBox="0 0 48 48">
                <circle cx={24} cy={24} r={r} fill="none" stroke="currentColor" strokeWidth={3} opacity={0.15} />
                <circle
                    cx={24} cy={24} r={r}
                    fill="none"
                    stroke={color}
                    strokeWidth={3}
                    strokeDasharray={`${arc} ${circ - arc}`}
                    strokeDashoffset={circ * 0.25}
                    strokeLinecap="round"
                    style={{ transition: "stroke-dasharray 0.6s ease" }}
                />
                <text x={24} y={28} textAnchor="middle" fontSize="10" fontWeight="700" fill={color}>{value}</text>
            </svg>
            <span style={{ color: "var(--djac-muted)", fontSize: 9, fontWeight: 600, textAlign: "center", maxWidth: 52 }}>{label}</span>
        </div>
    );
}

// ── Risk badge ────────────────────────────────────────────────────────────────
function RiskBadge({ level, isDark }: { level: string; isDark: boolean }) {
    const colorMap: Record<string, [string, string]> = {
        low: [isDark ? "#01FF7F" : "#16a34a", isDark ? "rgba(1,255,127,0.12)" : "rgba(22,163,74,0.1)"],
        medium: [isDark ? "#FFD600" : "#d97706", isDark ? "rgba(255,214,0,0.12)" : "rgba(217,119,6,0.1)"],
        high: [isDark ? "#FF6B2B" : "#ea580c", isDark ? "rgba(255,107,43,0.12)" : "rgba(234,88,12,0.1)"],
        critical: [isDark ? "#FF1744" : "#dc2626", isDark ? "rgba(255,23,68,0.12)" : "rgba(220,38,38,0.1)"],
    };
    const [color, bg] = colorMap[level] ?? colorMap.medium;
    return (
        <span style={{ fontSize: 10, fontWeight: 700, color, background: bg, border: `1px solid ${color}50`, borderRadius: 4, padding: "1px 6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {level}
        </span>
    );
}

// ── Main component ────────────────────────────────────────────────────────────
export function AIOrchestrationFeed() {
    const { theme } = useTheme();
    const { t, locale } = useLocale();
    const isDark = theme === "dark";
    const eventLogRef = useRef<HTMLDivElement>(null);

    const jobsQuery = trpc.ai.listAssessmentJobs.useQuery(
        { limit: 5 },
        { refetchInterval: 3000, staleTime: 0 },
    );

    const jobs = jobsQuery.data ?? [];
    const latestJob = jobs[0] ?? null;
    const currentStageIndex = latestJob ? stageIndex(latestJob.stage) : -1;

    // Auto-scroll event log
    useEffect(() => {
        const el = eventLogRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [latestJob?.events?.length]);

    const C = useMemo(() => ({
        cyan: isDark ? "#00F7FF" : "#0284c7",
        green: isDark ? "#01FF7F" : "#16a34a",
        red: isDark ? "#FF1744" : "#dc2626",
        orange: isDark ? "#FF6B2B" : "#ea580c",
        yellow: isDark ? "#FFD600" : "#d97706",
        purple: isDark ? "#9359EC" : "#7c3aed",
    }), [isDark]);

    // ── Stage node color
    function stageNodeColor(idx: number): string {
        if (!latestJob) return "var(--djac-border)";
        if (latestJob.status === "failed" && idx === currentStageIndex) return C.red;
        if (idx < currentStageIndex) return C.green;
        if (idx === currentStageIndex) {
            return latestJob.status === "completed" ? C.green : C.cyan;
        }
        return "var(--djac-border)";
    }

    function stageNodeStatus(idx: number): "done" | "active" | "pending" | "error" {
        if (!latestJob) return "pending";
        if (latestJob.status === "failed" && idx === currentStageIndex) return "error";
        if (idx < currentStageIndex) return "done";
        if (idx === currentStageIndex) return latestJob.status === "completed" ? "done" : "active";
        return "pending";
    }

    const assessment = latestJob?.result?.assessment;
    const events = latestJob?.events ?? [];

    return (
        <div style={{ background: "var(--djac-card)", border: "1px solid var(--djac-border)", borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: "column", height: "100%" }}>

            {/* Header */}
            <div style={{ padding: "14px 18px 10px", borderBottom: "1px solid var(--djac-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                    <p style={{ color: "var(--djac-muted)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 3 }}>
                        {t("orchFeed.sectionLabel", "Real-Time AI Orchestration")}
                    </p>
                    <h3 style={{ color: "var(--djac-text)", fontSize: 14, fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
                        <Bot className="h-4 w-4" style={{ color: C.cyan }} />
                        {t("orchFeed.title", "Pipeline Glass Box")}
                    </h3>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {jobsQuery.isFetching && <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: C.cyan }} />}
                    {jobsQuery.isError && <WifiOff className="h-3.5 w-3.5" style={{ color: C.red }} />}
                    <Badge variant="outline" style={{ fontSize: 10, height: 20, gap: 4, borderColor: `${C.cyan}50`, color: C.cyan }}>
                        <Activity className="h-2.5 w-2.5" />
                        {jobs.length} {t("orchFeed.jobs", "jobs")}
                    </Badge>
                </div>
            </div>

            {/* Pipeline stages — horizontal scroll */}
            <div style={{ padding: "14px 18px 0" }}>
                <div style={{ overflowX: "auto", paddingBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 0, minWidth: "max-content" }}>
                        {STAGE_ORDER.map((stage, idx) => {
                            const meta = STAGE_META[stage];
                            const color = stageNodeColor(idx);
                            const nodeStatus = stageNodeStatus(idx);
                            const Icon = meta.icon;

                            return (
                                <div key={stage} style={{ display: "flex", alignItems: "center" }}>
                                    {/* Stage node */}
                                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, width: 56 }}>
                                        <div
                                            style={{
                                                width: 32, height: 32, borderRadius: "50%",
                                                background: nodeStatus === "done" ? `${color}20` : nodeStatus === "active" ? `${color}25` : "var(--djac-bg)",
                                                border: `2px solid ${color}`,
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                position: "relative",
                                                boxShadow: nodeStatus === "active" ? `0 0 8px ${color}60` : "none",
                                                transition: "all 0.4s ease",
                                            }}
                                            title={meta.description}
                                        >
                                            {nodeStatus === "active" && (
                                                <div style={{ position: "absolute", inset: -5, borderRadius: "50%", border: `2px solid ${color}`, opacity: 0, animation: "djac-stage-ping 1.5s ease-in-out infinite" }} />
                                            )}
                                            {nodeStatus === "active" && latestJob?.status !== "completed"
                                                ? <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color }} />
                                                : nodeStatus === "error"
                                                    ? <AlertTriangle className="h-3.5 w-3.5" style={{ color }} />
                                                    : <Icon className="h-3.5 w-3.5" style={{ color }} />
                                            }
                                        </div>
                                        <span style={{ fontSize: 7.5, fontWeight: 600, color: nodeStatus === "pending" ? "var(--djac-muted)" : color, textAlign: "center", lineHeight: 1.2, maxWidth: 52 }}>
                                            {meta.label}
                                        </span>
                                    </div>
                                    {/* Connector */}
                                    {idx < STAGE_ORDER.length - 1 && (
                                        <div style={{ width: 22, height: 2, background: stageNodeColor(idx) === "var(--djac-border)" ? "var(--djac-border)" : `${stageNodeColor(idx)}50`, flexShrink: 0, marginBottom: 20 }} />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Score gauges (when assessment data available) */}
            {assessment && (
                <div style={{ padding: "12px 18px 0", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                    <MiniGauge value={assessment.overallScore} color={C.cyan} label={t("assessmentHistory.scoreOverall", "Overall")} />
                    <MiniGauge value={assessment.jurisdictionScores?.china ?? 0} color={isDark ? "#FF6B2B" : "#ea580c"} label={`${t("assessmentHistory.scoreChina", "China")} (PIPL)`} />
                    <MiniGauge value={assessment.jurisdictionScores?.saudiArabia ?? 0} color={isDark ? "#FFD600" : "#d97706"} label={`${t("assessmentHistory.scoreKSA", "Saudi Arabia")} (PDPL)`} />
                    <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                            <span style={{ color: "var(--djac-muted)", fontSize: 10, fontWeight: 600 }}>Risk Level:</span>
                            <RiskBadge level={assessment.riskLevel} isDark={isDark} />
                        </div>
                        {assessment.gaps && assessment.gaps.length > 0 && (
                            <p style={{ color: "var(--djac-muted)", fontSize: 10, margin: 0 }}>
                                {assessment.gaps.length} compliance gap{assessment.gaps.length !== 1 ? "s" : ""} detected
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Job list — recent runs */}
            <div style={{ padding: "10px 18px 0" }}>
                <p style={{ color: "var(--djac-muted)", fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
                    {t("orchFeed.recentJobs", "Recent Runs")}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {jobs.length === 0
                        ? <p style={{ color: "var(--djac-muted)", fontSize: 11, padding: "8px 0" }}>{t("orchFeed.noJobs", "No assessment jobs yet.")}</p>
                        : jobs.slice(0, 4).map(job => {
                            const stIdx = stageIndex(job.stage);
                            const progress = Math.round((stIdx / (STAGE_ORDER.length - 1)) * 100);
                            const statusColor = job.status === "completed" ? C.green : job.status === "failed" ? C.red : C.cyan;

                            return (
                                <div key={job.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: "var(--djac-bg)", borderRadius: 8, border: "1px solid var(--djac-border)" }}>
                                    {job.status === "running"
                                        ? <Loader2 className="h-3 w-3 animate-spin flex-shrink-0" style={{ color: statusColor }} />
                                        : job.status === "failed"
                                            ? <AlertTriangle className="h-3 w-3 flex-shrink-0" style={{ color: statusColor }} />
                                            : <CheckCircle2 className="h-3 w-3 flex-shrink-0" style={{ color: statusColor }} />
                                    }
                                    <span style={{ color: "var(--djac-muted)", fontSize: 9, fontFamily: "monospace", letterSpacing: "0.05em" }}>
                                        {job.id.slice(-8)}
                                    </span>
                                    <span style={{ fontSize: 9.5, fontWeight: 600, color: statusColor, flexShrink: 0 }}>
                                        {STAGE_META[job.stage as StageKey]?.label ?? job.stage}
                                    </span>
                                    <div style={{ flex: 1, height: 3, background: "var(--djac-border)", borderRadius: 2, overflow: "hidden" }}>
                                        <div style={{ width: `${progress}%`, height: "100%", background: statusColor, transition: "width 0.5s ease", borderRadius: 2 }} />
                                    </div>
                                    <span style={{ color: "var(--djac-muted)", fontSize: 9, flexShrink: 0 }}>{progress}%</span>
                                </div>
                            );
                        })
                    }
                </div>
            </div>

            {/* Event log */}
            <div style={{ flex: 1, padding: "10px 18px 14px", minHeight: 0, display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <p style={{ color: "var(--djac-muted)", fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>
                        <Zap className="h-2.5 w-2.5 inline mr-1" style={{ color: C.cyan, verticalAlign: "middle" }} />
                        {t("orchFeed.schemaLog", "Schema Enforcement Log")}
                    </p>
                    <span style={{ color: "var(--djac-muted)", fontSize: 9 }}>{events.length} events</span>
                </div>
                <div
                    ref={eventLogRef}
                    style={{ flex: 1, overflowY: "auto", maxHeight: 140, display: "flex", flexDirection: "column", gap: 2 }}
                >
                    {events.length === 0
                        ? (
                            <p style={{ color: "var(--djac-muted)", fontSize: 11, padding: "4px 0" }}>
                                {latestJob ? t("orchFeed.waitingEvents", "Waiting for pipeline events…") : t("orchFeed.noEvents", "No events recorded.")}
                            </p>
                        )
                        : events.map((ev, i) => {
                            const meta = STAGE_META[ev.stage as StageKey];
                            const tagColor = ev.stage === "failed" ? C.red : ev.stage === "completed" ? C.green : C.cyan;
                            return (
                                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 6, fontSize: 10, lineHeight: 1.4 }}>
                                    <span style={{ color: "var(--djac-muted)", fontSize: 9, fontFamily: "monospace", flexShrink: 0, paddingTop: 1 }}>
                                        {new Date(ev.timestamp).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                                    </span>
                                    <span style={{ color: tagColor, fontSize: 9, fontWeight: 700, flexShrink: 0, paddingTop: 1 }}>
                                        {meta?.label ?? ev.stage}
                                    </span>
                                    <span style={{ color: "var(--djac-text)" }}>{ev.message}</span>
                                </div>
                            );
                        })
                    }
                </div>
            </div>

            {/* CSS for stage ping animation */}
            <style>{`
        @keyframes djac-stage-ping {
          0%   { opacity: 0.7; transform: scale(0.95); }
          50%  { opacity: 0.2; transform: scale(1.2); }
          100% { opacity: 0.7; transform: scale(0.95); }
        }
      `}</style>
        </div>
    );
}
