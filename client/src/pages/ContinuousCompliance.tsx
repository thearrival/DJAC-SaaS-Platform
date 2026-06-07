/**
 * ContinuousCompliance.tsx — CTEM (Continuous Threat Exposure Management) Dashboard
 *
 * Features:
 *   - KPI cards: total assets, exploitable vulns, avg risk score, frameworks impacted
 *   - Tier distribution pills (critical / high / medium / low counts)
 *   - Exposure Trend line chart (avg priority score over last N scans)
 *   - Per-framework stacked bar (NCA / PDPL / PIPL / CSL / DSL impact)
 *   - Assets at Risk filterable table with score breakdown tooltip
 *   - Top Exploitable Vulnerabilities with "Mark as Patched" action
 *   - Compliance Drift card + Scan History
 *   - Add Asset registration dialog
 *   - Add Vulnerability dialog
 *   - Full in-memory fallback (no DB required)
 */

import { useState, useMemo } from "react";
import type React from "react";
import { trpc } from "@/lib/trpc";
import { useLocale } from "@/contexts/useLocale";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RCTooltip,
    Legend,
    ResponsiveContainer,
} from "@/lib/recharts-compat";
import {
    Activity,
    AlertTriangle,
    Bug,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    Globe,
    Loader2,
    Plus,
    RefreshCw,
    Shield,
    ShieldAlert,
    ShieldCheck,
    Wifi,
    XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { sounds } from "@/lib/sounds";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tier = "critical" | "high" | "medium" | "low";

// ─── Constants ────────────────────────────────────────────────────────────────

const TIER_COLOURS: Record<Tier, string> = {
    critical: "#ef4444",
    high: "#f97316",
    medium: "#eab308",
    low: "#22c55e",
};

const TIER_BG: Record<Tier, string> = {
    critical: "bg-red-500/10 text-red-500 border-red-500/30",
    high: "bg-orange-500/10 text-orange-500 border-orange-500/30",
    medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
    low: "bg-green-500/10 text-green-500 border-green-500/30",
};

const ASSET_TYPES = [
    "web_application", "api_endpoint", "database", "cloud_service",
    "network_device", "iot_device", "data_pipeline", "identity_provider",
    "storage_bucket", "other",
] as const;

const REGIONS = ["China", "Saudi Arabia", "Cross-border", "Other"] as const;
type Region = typeof REGIONS[number];

const SEVERITY_LEVELS = ["critical", "high", "medium", "low", "informational"] as const;

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiCard({
    icon: Icon,
    label,
    value,
    sub,
    colour,
}: {
    icon: React.FC<{ size?: number; className?: string }>;
    label: string;
    value: string | number;
    sub?: string;
    colour?: string;
}) {
    return (
        <Card className="relative overflow-hidden">
            <CardContent className="p-5">
                <div className="flex items-center gap-3">
                    <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                        style={{
                            backgroundColor: colour ? `${colour}20` : "hsl(var(--muted))",
                            color: colour ?? "hsl(var(--muted-foreground))",
                        }}
                    >
                        <Icon size={20} className="shrink-0" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-xs text-muted-foreground">{label}</p>
                        <p className="text-2xl font-bold tabular-nums">{value}</p>
                        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function TierBadge({ tier }: { tier: string }) {
    const t = (tier as Tier) in TIER_BG ? (tier as Tier) : "low";
    return (
        <Badge variant="outline" className={`font-semibold uppercase text-[10px] ${TIER_BG[t]}`}>
            {tier}
        </Badge>
    );
}

function ScoreBar({ value, max = 100 }: { value: number; max?: number }) {
    const pct = Math.min(100, Math.round((value / max) * 100));
    const tier: Tier = pct >= 80 ? "critical" : pct >= 60 ? "high" : pct >= 40 ? "medium" : "low";
    return (
        <div className="flex items-center gap-2">
            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, backgroundColor: TIER_COLOURS[tier] }}
                />
            </div>
            <span className="tabular-nums text-xs text-muted-foreground">{value}</span>
        </div>
    );
}

function formatRunTime(dt: Date | string | null | undefined): string {
    if (!dt) return "—";
    const d = typeof dt === "string" ? new Date(dt) : dt;
    return d.toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" });
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ContinuousCompliance() {
    const { t } = useLocale();
    usePageTitle(t("ctem.pageTitle", "Continuous Compliance & CTEM"));

    // Filters
    const [regionFilter, setRegionFilter] = useState<Region | "all">("all");
    const [tierFilter, setTierFilter] = useState<Tier | "all">("all");
    const [exploitableOnly, setExploitableOnly] = useState(false);
    const [scanning, setScanning] = useState(false);

    // ── Dialog state ──────────────────────────────────────────────────────────
    const [addAssetOpen, setAddAssetOpen] = useState(false);
    const [addVulnOpen, setAddVulnOpen] = useState(false);
    const [assetForm, setAssetForm] = useState({
        assetName: "", assetType: "other" as string, region: "Other" as string,
        isInternetFacing: false, handlesPersonalData: false, handlesCriticalData: false,
        criticalityScore: 5, status: "active" as string, ipDomain: "", notes: "", vendorId: "",
    });
    const [vulnForm, setVulnForm] = useState({
        assetId: "", cveId: "", title: "", severity: "medium" as string,
        cvssScore: "50", exploitAvailable: false, isConfirmed: false, notes: "",
    });

    // ── tRPC queries ──────────────────────────────────────────────────────────
    const summaryQ = trpc.ctem.getRiskSummary.useQuery(undefined, { staleTime: 30_000 });
    const runsQ = trpc.ctem.listRuns.useQuery({ limit: 10 }, { staleTime: 10_000 });
    const assetsQ = trpc.ctem.listAssets.useQuery(
        regionFilter !== "all" ? { region: regionFilter } : undefined,
        { staleTime: 30_000 }
    );
    const riskScoresQ = trpc.ctem.listRiskScores.useQuery(
        {
            ...(regionFilter !== "all" && { region: regionFilter }),
            ...(tierFilter !== "all" && { tier: tierFilter }),
        },
        { staleTime: 30_000 }
    );
    const vulnsQ = trpc.ctem.listVulnerabilities.useQuery(
        { exploitableOnly, ...(exploitableOnly && { includeMappings: true }) },
        { staleTime: 30_000 }
    );
    const fwExposureQ = trpc.ctem.getFrameworkExposure.useQuery(undefined, { staleTime: 60_000 });
    const vendorsQ = trpc.ctem.listVendorsForAssets.useQuery(undefined, { staleTime: 120_000 });

    const utils = trpc.useUtils();

    // ── Mutations ─────────────────────────────────────────────────────────────
    const triggerRun = trpc.ctem.triggerRun.useMutation({
        onMutate: () => {
            setScanning(true);
            sounds.click();
        },
        onSuccess: (data) => {
            sounds.success();
            toast.success(
                `${t("ctem.runScan", "Scan complete")} — ${data.assetsScanned} assets, ${data.vulnsFound} vulns`,
                {
                    description: data.alertRaised
                        ? "\u26A0\uFE0F Alert raised — critical exposure detected"
                        : "No critical alerts",
                }
            );
            void utils.ctem.invalidate();
        },
        onError: (err) => toast.error(err.message),
        onSettled: () => setScanning(false),
    });

    const createAsset = trpc.ctem.createAsset.useMutation({
        onSuccess: () => {
            sounds.success();
            toast.success(t("ctem.registerAsset", "Asset registered"));
            setAddAssetOpen(false);
            setAssetForm({ assetName: "", assetType: "other", region: "Other", isInternetFacing: false, handlesPersonalData: false, handlesCriticalData: false, criticalityScore: 5, status: "active", ipDomain: "", notes: "", vendorId: "" });
            void utils.ctem.invalidate();
        },
        onError: (err) => toast.error(err.message),
    });

    const createVuln = trpc.ctem.createVulnerability.useMutation({
        onSuccess: () => {
            sounds.success();
            toast.success(t("ctem.logVuln", "Vulnerability logged"));
            setAddVulnOpen(false);
            setVulnForm({ assetId: "", cveId: "", title: "", severity: "medium", cvssScore: "50", exploitAvailable: false, isConfirmed: false, notes: "" });
            void utils.ctem.invalidate();
        },
        onError: (err) => toast.error(err.message),
    });

    const patchVuln = trpc.ctem.patchVulnerability.useMutation({
        onSuccess: () => {
            sounds.success();
            toast.success(t("ctem.markPatched", "Marked as patched"));
            void utils.ctem.invalidate();
        },
        onError: (err) => toast.error(err.message),
    });

    // ── Computed ──────────────────────────────────────────────────────────────
    const summary = summaryQ.data;

    // Trend from run history
    const exposureTrendData = useMemo(() => {
        if (!runsQ.data) return [];
        return [...runsQ.data]
            .reverse()
            .map((r, i) => ({
                name: `#${i + 1}`,
                score: r.avgPriorityScore ?? 0,
                alert: r.alertRaised ? "!" : undefined,
            }));
    }, [runsQ.data]);

    // Framework bar data
    const fwData = useMemo(() => {
        if (!fwExposureQ.data) return [];
        return fwExposureQ.data.map((fw: any) => ({
            name: fw.frameworkCode,
            Critical: fw.critical ?? 0,
            High: (fw.high ?? 0),
            Medium: (fw.medium ?? 0),
            Low: (fw.low ?? 0),
        }));
    }, [fwExposureQ.data]);

    // Score map for asset rows
    const scoresByAssetId = useMemo(() => {
        if (!riskScoresQ.data) return new Map<number, any>();
        return new Map(riskScoresQ.data.map((s: any) => [s.assetId ?? s.asset?.id, s]));
    }, [riskScoresQ.data]);

    // Top 10 exploitable vulns
    const topExploitable = useMemo(() => {
        if (!vulnsQ.data) return [];
        return [...vulnsQ.data]
            .filter((v: any) => v.exploitAvailable && !v.isPatched)
            .sort((a: any, b: any) => b.cvssScore - a.cvssScore)
            .slice(0, 10);
    }, [vulnsQ.data]);

    const isLoading = summaryQ.isLoading;
    const summaryUnavailable = summaryQ.isError;
    const firstLoadError =
        summaryQ.error ??
        runsQ.error ??
        assetsQ.error ??
        riskScoresQ.error ??
        vulnsQ.error ??
        fwExposureQ.error ??
        vendorsQ.error;
    const lastRun = summary?.lastRun;
    const drift = lastRun && (lastRun as any).scoreDelta != null ? (lastRun as any).scoreDelta : 0;

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="djac-page">

            {/* ── Header ────────────────────────────────────────────────────── */}
            <div className="djac-page-header">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        {t("ctem.pageTitle", "Continuous Compliance & CTEM")}
                    </h1>
                    <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                        {t(
                            "ctem.pageSubtitle",
                            "Real-time threat exposure monitoring aligned with CSL, DSL, PIPL, PDPL and NCA frameworks"
                        )}
                    </p>
                    {/* Tier distribution pills */}
                    {summary && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                            {(["critical", "high", "medium", "low"] as Tier[]).map((tier) => {
                                const counts: Record<Tier, number> = {
                                    critical: summary.criticalAssets ?? 0,
                                    high: summary.highAssets ?? 0,
                                    medium: summary.mediumAssets ?? 0,
                                    low: summary.lowAssets ?? 0,
                                };
                                const count = counts[tier];
                                const col = TIER_COLOURS[tier];
                                return (
                                    <button
                                        key={tier}
                                        onClick={() => setTierFilter(tierFilter === tier ? "all" : tier)}
                                        className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition-opacity ${tierFilter !== "all" && tierFilter !== tier ? "opacity-40" : ""
                                            }`}
                                        style={{ borderColor: col, color: col, backgroundColor: `${col}18` }}
                                    >
                                        {count} {tier}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
                <Button
                    onClick={() => triggerRun.mutate({})}
                    disabled={scanning}
                    className="mt-3 shrink-0 sm:mt-0"
                >
                    {scanning ? (
                        <><Loader2 size={15} className="animate-spin" /> {t("ctem.scanning", "Scanning…")}</>
                    ) : (
                        <><RefreshCw size={15} /> {t("ctem.runScan", "Run Scan")}</>
                    )}
                </Button>
            </div>

            {/* ── KPI Cards ─────────────────────────────────────────────────── */}
            <div className="djac-stat-grid">
                <KpiCard
                    icon={Shield as any}
                    label={t("ctem.assets", "Assets")}
                    value={isLoading ? "…" : summaryUnavailable ? "—" : summary?.totalAssets ?? 0}
                    sub={summaryUnavailable ? t("ctem.summaryUnavailable", "Summary unavailable") : `${summary?.criticalAssets ?? 0} critical`}
                    colour={TIER_COLOURS.critical}
                />
                <KpiCard
                    icon={Bug as any}
                    label={t("ctem.vulnerabilities", "Vulnerabilities")}
                    value={isLoading ? "…" : summaryUnavailable ? "—" : summary?.totalVulns ?? 0}
                    sub={summaryUnavailable ? t("ctem.summaryUnavailable", "Summary unavailable") : `${summary?.exploitableVulns ?? 0} ${t("ctem.exploitable", "exploitable")}`}
                    colour={TIER_COLOURS.high}
                />
                <KpiCard
                    icon={Activity as any}
                    label={t("ctem.avgRiskScore", "Avg Risk Score")}
                    value={isLoading ? "…" : summaryUnavailable ? "—" : summary?.avgPriorityScore ?? "—"}
                    sub={
                        summaryUnavailable
                            ? t("ctem.summaryUnavailable", "Summary unavailable")
                            : drift > 0 ? `↑ ${drift} pts since last run`
                                : drift < 0 ? `↓ ${Math.abs(drift)} pts since last run`
                                    : "No change since last run"
                    }
                    colour={summary?.avgPriorityScore && summary.avgPriorityScore >= 60 ? TIER_COLOURS.high : TIER_COLOURS.medium}
                />
                <KpiCard
                    icon={Globe as any}
                    label={t("ctem.frameworksImpacted", "Frameworks Impacted")}
                    value={isLoading ? "…" : summaryUnavailable ? "—" : summary?.frameworkExposure?.length ?? 0}
                    sub="CSL · DSL · PIPL · PDPL · NCA"
                    colour={TIER_COLOURS.medium}
                />
            </div>

            {/* ── Charts Row ────────────────────────────────────────────────── */}
            <div className="djac-chart-grid">

                {/* Exposure Trend */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Activity size={16} />
                            {t("ctem.exposureTrend", "Exposure Trend")}
                        </CardTitle>
                        <CardDescription className="text-xs">
                            Average priority score across the last {exposureTrendData.length} scans
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                        {exposureTrendData.length === 0 ? (
                            <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
                                {t("ctem.noScanRuns", "No scan runs yet — click Run Scan to begin")}
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={180}>
                                <LineChart data={exposureTrendData} margin={{ top: 4, right: 16, bottom: 0, left: -20 }}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                                    <RCTooltip
                                        contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="score"
                                        stroke="#6366f1"
                                        strokeWidth={2}
                                        dot={{ r: 3 }}
                                        activeDot={{ r: 5 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                {/* Framework Exposure Bar */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <ShieldCheck size={16} />
                            {t("ctem.frameworksImpacted", "Framework Exposure")}
                        </CardTitle>
                        <CardDescription className="text-xs">Vulnerabilities mapped per regulatory framework</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                        {fwData.length === 0 ? (
                            <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
                                No framework mappings yet
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={180}>
                                <BarChart data={fwData} margin={{ top: 4, right: 16, bottom: 0, left: -20 }}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                                    <RCTooltip
                                        contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                                    />
                                    <Legend wrapperStyle={{ fontSize: 11 }} />
                                    <Bar dataKey="Critical" stackId="a" fill={TIER_COLOURS.critical} />
                                    <Bar dataKey="High" stackId="a" fill={TIER_COLOURS.high} />
                                    <Bar dataKey="Medium" stackId="a" fill={TIER_COLOURS.medium} />
                                    <Bar dataKey="Low" stackId="a" fill={TIER_COLOURS.low} radius={[3, 3, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* ── Filters ──────────────────────────────────────────────────── */}
            {firstLoadError && (
                <div className="djac-callout djac-callout--error">
                    <XCircle size={16} className="mt-0.5 shrink-0" />
                    <div className="flex w-full items-start justify-between gap-3">
                        <span>{firstLoadError.message}</span>
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-7 shrink-0 text-xs"
                            onClick={() => {
                                void summaryQ.refetch();
                                void runsQ.refetch();
                                void assetsQ.refetch();
                                void riskScoresQ.refetch();
                                void vulnsQ.refetch();
                                void fwExposureQ.refetch();
                                void vendorsQ.refetch();
                            }}
                        >
                            {t("common.retry", "Retry")}
                        </Button>
                    </div>
                </div>
            )}
            <div className="djac-filter-bar">
                <Select
                    value={regionFilter}
                    onValueChange={(v) => setRegionFilter(v as Region | "all")}
                >
                    <SelectTrigger className="h-8 w-40 text-xs">
                        <SelectValue placeholder={t("ctem.filterRegion", "Region")} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Regions</SelectItem>
                        {REGIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                </Select>

                <Select
                    value={tierFilter}
                    onValueChange={(v) => setTierFilter(v as Tier | "all")}
                >
                    <SelectTrigger className="h-8 w-36 text-xs">
                        <SelectValue placeholder={t("ctem.filterSeverity", "Severity")} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Tiers</SelectItem>
                        <SelectItem value="critical">{t("ctem.tierCritical", "Critical")}</SelectItem>
                        <SelectItem value="high">{t("ctem.tierHigh", "High")}</SelectItem>
                        <SelectItem value="medium">{t("ctem.tierMedium", "Medium")}</SelectItem>
                        <SelectItem value="low">{t("ctem.tierLow", "Low")}</SelectItem>
                    </SelectContent>
                </Select>

                <Button
                    variant={exploitableOnly ? "default" : "outline"}
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => setExploitableOnly(!exploitableOnly)}
                >
                    <Bug size={13} className="mr-1" />
                    {t("ctem.filterExploitableOnly", "Exploitable only")}
                </Button>

                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => {
                        setRegionFilter("all");
                        setTierFilter("all");
                        setExploitableOnly(false);
                    }}
                >
                    Clear
                </Button>
            </div>

            {/* ── Assets at Risk Table ──────────────────────────────────────── */}
            <Card>
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <ShieldAlert size={16} />
                            {t("ctem.assetsTable", "Assets at Risk")}
                        </CardTitle>
                        <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => setAddAssetOpen(true)}>
                            <Plus size={13} />
                            {t("ctem.addAsset", "Add Asset")}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {assetsQ.isLoading ? (
                        <div className="flex h-32 items-center justify-center">
                            <Loader2 size={20} className="animate-spin text-muted-foreground" />
                        </div>
                    ) : assetsQ.error ? (
                        <div className="flex flex-col items-center gap-2 py-12">
                            <XCircle size={24} className="text-destructive" />
                            <p className="text-sm text-muted-foreground">{t("ctem.assetsLoadError", "Failed to load assets.")}</p>
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { void assetsQ.refetch(); }}>
                                {t("common.retry", "Retry")}
                            </Button>
                        </div>
                    ) : !assetsQ.data || assetsQ.data.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 py-16">
                            <ShieldCheck size={32} className="text-muted-foreground/40" />
                            <p className="text-sm font-medium">{t("ctem.noAssets", "No assets registered")}</p>
                            <p className="max-w-xs text-center text-xs text-muted-foreground">
                                {t("ctem.noAssetsSub", "Add assets via the Vendor Assessment workflow to begin continuous monitoring")}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-xs">Asset</TableHead>
                                        <TableHead className="text-xs">Type</TableHead>
                                        <TableHead className="text-xs">Region</TableHead>
                                        <TableHead className="text-xs">Tier</TableHead>
                                        <TableHead className="text-xs">Risk Score</TableHead>
                                        <TableHead className="text-xs">Internet</TableHead>
                                        <TableHead className="text-xs">PII</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {assetsQ.data.map((asset: any) => {
                                        const score = scoresByAssetId.get(asset.id);
                                        return (
                                            <TableRow key={asset.id}>
                                                <TableCell className="max-w-[180px] truncate py-2 text-xs font-medium">
                                                    {asset.assetName}
                                                </TableCell>
                                                <TableCell className="py-2 text-xs text-muted-foreground">
                                                    {asset.assetType?.replace(/_/g, " ")}
                                                </TableCell>
                                                <TableCell className="py-2 text-xs">{asset.region}</TableCell>
                                                <TableCell className="py-2">
                                                    {score ? <TierBadge tier={score.priorityTier} /> : <span className="text-xs text-muted-foreground">—</span>}
                                                </TableCell>
                                                <TableCell className="py-2">
                                                    {score ? <ScoreBar value={score.finalPriorityScore} /> : "—"}
                                                </TableCell>
                                                <TableCell className="py-2 text-center">
                                                    {asset.isInternetFacing ? (
                                                        <Tooltip>
                                                            <TooltipTrigger>
                                                                <Wifi size={14} className="text-orange-500" />
                                                            </TooltipTrigger>
                                                            <TooltipContent>Internet-facing</TooltipContent>
                                                        </Tooltip>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground/40">—</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="py-2 text-center">
                                                    {asset.handlesPersonalData ? (
                                                        <Tooltip>
                                                            <TooltipTrigger>
                                                                <AlertTriangle size={14} className="text-yellow-500" />
                                                            </TooltipTrigger>
                                                            <TooltipContent>Handles Personal Data</TooltipContent>
                                                        </Tooltip>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground/40">—</span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ── Top Exploitable Vulnerabilities ──────────────────────────── */}
            <Card>
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Bug size={16} />
                            {t("ctem.topExploitable", "Top Exploitable Vulnerabilities")}
                        </CardTitle>
                        <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => setAddVulnOpen(true)}>
                            <Plus size={13} />
                            {t("ctem.addVuln", "Log Vulnerability")}
                        </Button>
                    </div>
                    <CardDescription className="text-xs">
                        Unpatched vulnerabilities with known exploit code — sorted by CVSS score
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {vulnsQ.isLoading ? (
                        <div className="flex h-24 items-center justify-center">
                            <Loader2 size={18} className="animate-spin text-muted-foreground" />
                        </div>
                    ) : vulnsQ.error ? (
                        <div className="flex flex-col items-center gap-2 py-10">
                            <XCircle size={22} className="text-destructive" />
                            <p className="text-sm text-muted-foreground">{t("ctem.vulnsLoadError", "Failed to load vulnerabilities.")}</p>
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { void vulnsQ.refetch(); }}>
                                {t("common.retry", "Retry")}
                            </Button>
                        </div>
                    ) : topExploitable.length === 0 ? (
                        <div className="flex flex-col items-center gap-1 py-10">
                            <CheckCircle2 size={24} className="text-green-500/60" />
                            <p className="text-sm text-muted-foreground">No exploitable vulnerabilities detected</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-xs">CVE / Title</TableHead>
                                        <TableHead className="text-xs">Severity</TableHead>
                                        <TableHead className="text-xs">CVSS</TableHead>
                                        <TableHead className="text-xs">Exploit</TableHead>
                                        <TableHead className="text-xs">Discovered</TableHead>
                                        <TableHead className="text-xs">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {topExploitable.map((v: any) => (
                                        <TableRow key={v.id}>
                                            <TableCell className="py-2 text-xs">
                                                <div className="flex flex-col gap-0.5">
                                                    {v.cveId && (
                                                        <span className="font-mono text-[11px] text-muted-foreground">{v.cveId}</span>
                                                    )}
                                                    <span className="max-w-[260px] truncate font-medium">{v.title}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-2">
                                                <TierBadge tier={v.severity === "critical" ? "critical" : v.severity === "high" ? "high" : v.severity === "medium" ? "medium" : "low"} />
                                            </TableCell>
                                            <TableCell className="py-2 tabular-nums text-xs">
                                                {(v.cvssScore / 10).toFixed(1)}
                                            </TableCell>
                                            <TableCell className="py-2">
                                                <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/30 text-[10px]">
                                                    {t("ctem.exploitAvailable", "Exploit Available")}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="py-2 text-xs text-muted-foreground">
                                                {formatRunTime(v.discoveredAt)}
                                            </TableCell>
                                            <TableCell className="py-2">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-6 gap-1 text-[11px]"
                                                    disabled={patchVuln.isPending}
                                                    onClick={() => patchVuln.mutate({ id: v.id, isPatched: true })}
                                                >
                                                    {patchVuln.isPending ? (
                                                        <Loader2 size={11} className="animate-spin" />
                                                    ) : (
                                                        <CheckCircle2 size={11} className="text-green-500" />
                                                    )}
                                                    {t("ctem.markPatched", "Patch")}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ── Compliance Drift Card + Run History ──────────────────────── */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

                {/* Drift card */}
                <Card className="lg:col-span-1">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-base">
                            {drift > 0
                                ? <ChevronUp size={16} className="text-red-500" />
                                : drift < 0
                                    ? <ChevronDown size={16} className="text-green-500" />
                                    : <Activity size={16} className="text-muted-foreground" />
                            }
                            {t("ctem.driftCard", "Compliance Drift")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="flex flex-col gap-3">
                            <div className="flex items-baseline gap-2">
                                <span
                                    className={`text-4xl font-bold tabular-nums ${drift > 0 ? "text-red-500" : drift < 0 ? "text-green-500" : "text-muted-foreground"}`}
                                >
                                    {drift > 0 ? `+${drift}` : drift}
                                </span>
                                <span className="text-sm text-muted-foreground">pts</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {drift > 0
                                    ? t("ctem.driftUp", "Risk Increased") + " — review critical assets"
                                    : drift < 0
                                        ? t("ctem.driftDown", "Risk Improved") + " — good progress"
                                        : t("ctem.driftNeutral", "No Change") + " — stable baseline"
                                }
                            </p>
                            {lastRun && (
                                <div className="rounded-md border p-3 text-xs space-y-1.5">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Last scan</span>
                                        <span>{formatRunTime((lastRun as any).startedAt)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Status</span>
                                        <Badge variant="outline" className="text-[10px]">{(lastRun as any).runStatus}</Badge>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Assets scanned</span>
                                        <span>{(lastRun as any).assetsScanned ?? "—"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Vulns found</span>
                                        <span>{(lastRun as any).vulnsFound ?? "—"}</span>
                                    </div>
                                    {(lastRun as any).alertRaised ? (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Alert</span>
                                            <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/30 text-[10px]">Raised</Badge>
                                        </div>
                                    ) : null}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Run History */}
                <Card className="lg:col-span-2">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Activity size={16} />
                            {t("ctem.runHistory", "Scan History")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {runsQ.isLoading ? (
                            <div className="flex h-24 items-center justify-center">
                                <Loader2 size={18} className="animate-spin text-muted-foreground" />
                            </div>
                        ) : runsQ.error ? (
                            <div className="flex flex-col items-center gap-2 py-10">
                                <XCircle size={22} className="text-destructive" />
                                <p className="text-sm text-muted-foreground">{t("ctem.runsLoadError", "Failed to load scan history.")}</p>
                                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { void runsQ.refetch(); }}>
                                    {t("common.retry", "Retry")}
                                </Button>
                            </div>
                        ) : !runsQ.data || runsQ.data.length === 0 ? (
                            <div className="flex flex-col items-center gap-1 py-10">
                                <p className="text-sm text-muted-foreground">No scans run yet. Click "Run Scan" to start.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="text-xs">Started</TableHead>
                                            <TableHead className="text-xs">Status</TableHead>
                                            <TableHead className="text-xs">Triggered by</TableHead>
                                            <TableHead className="text-xs">Assets</TableHead>
                                            <TableHead className="text-xs">Vulns</TableHead>
                                            <TableHead className="text-xs">Avg Score</TableHead>
                                            <TableHead className="text-xs">Drift</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {runsQ.data.map((run: any) => (
                                            <TableRow key={run.id}>
                                                <TableCell className="py-2 text-xs">{formatRunTime(run.startedAt)}</TableCell>
                                                <TableCell className="py-2">
                                                    <Badge variant="outline" className={`text-[10px] ${run.runStatus === "completed" ? "bg-green-500/10 text-green-500 border-green-500/30" : run.runStatus === "failed" ? "bg-red-500/10 text-red-500 border-red-500/30" : ""}`}>
                                                        {run.runStatus}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="py-2 text-xs capitalize text-muted-foreground">{run.triggeredBy}</TableCell>
                                                <TableCell className="py-2 tabular-nums text-xs">{run.assetsScanned ?? "—"}</TableCell>
                                                <TableCell className="py-2 tabular-nums text-xs">{run.vulnsFound ?? "—"}</TableCell>
                                                <TableCell className="py-2 tabular-nums text-xs">{run.avgPriorityScore != null ? Math.round(run.avgPriorityScore) : "—"}</TableCell>
                                                <TableCell className="py-2 tabular-nums text-xs">
                                                    {run.scoreDelta != null ? (
                                                        <span className={run.scoreDelta > 0 ? "text-red-500" : run.scoreDelta < 0 ? "text-green-500" : "text-muted-foreground"}>
                                                            {run.scoreDelta > 0 ? `+${run.scoreDelta}` : run.scoreDelta}
                                                        </span>
                                                    ) : "—"}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* ── Insight Quote ─────────────────────────────────────────────── */}
            <blockquote className="rounded-lg border border-dashed p-4 text-xs italic text-muted-foreground">
                "{t("ctem.shiftLeft", "Continuous compliance means monitoring live exposure — not waiting for the annual audit.")}"
            </blockquote>

            {/* ── Add Asset Dialog ──────────────────────────────────────────── */}
            <Dialog open={addAssetOpen} onOpenChange={setAddAssetOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{t("ctem.addAsset", "Register Asset")}</DialogTitle>
                        <DialogDescription>
                            {t("ctem.addAssetDesc", "Register an IT asset for continuous threat exposure monitoring")}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="col-span-2 space-y-1">
                                <Label htmlFor="assetName">{t("ctem.assetName", "Asset Name")}</Label>
                                <Input
                                    id="assetName"
                                    value={assetForm.assetName}
                                    onChange={(e) => setAssetForm({ ...assetForm, assetName: e.target.value })}
                                    placeholder="e.g. Customer API Gateway"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label>{t("ctem.assetType", "Asset Type")}</Label>
                                <Select value={assetForm.assetType} onValueChange={(v) => setAssetForm({ ...assetForm, assetType: v })}>
                                    <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {ASSET_TYPES.map((at) => (
                                            <SelectItem key={at} value={at}>{at.replace(/_/g, " ")}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <Label>{t("ctem.filterRegion", "Region")}</Label>
                                <Select value={assetForm.region} onValueChange={(v) => setAssetForm({ ...assetForm, region: v })}>
                                    <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {REGIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="ipDomain">{t("ctem.ipDomain", "IP / Domain")}</Label>
                                <Input
                                    id="ipDomain"
                                    value={assetForm.ipDomain}
                                    onChange={(e) => setAssetForm({ ...assetForm, ipDomain: e.target.value })}
                                    placeholder="e.g. 10.0.0.1 or api.company.com"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label>{t("ctem.assetStatus", "Status")}</Label>
                                <Select value={assetForm.status} onValueChange={(v) => setAssetForm({ ...assetForm, status: v })}>
                                    <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                        <SelectItem value="decommissioned">Decommissioned</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="col-span-2 space-y-2">
                                <Label>{t("ctem.criticalityScore", "Criticality Score")} ({assetForm.criticalityScore}/10)</Label>
                                <input
                                    type="range" min={1} max={10} step={1}
                                    value={assetForm.criticalityScore}
                                    onChange={(e) => setAssetForm({ ...assetForm, criticalityScore: Number(e.target.value) })}
                                    className="w-full accent-primary"
                                />
                            </div>
                            {vendorsQ.data && vendorsQ.data.length > 0 && (
                                <div className="col-span-2 space-y-1">
                                    <Label>Vendor (optional)</Label>
                                    <Select value={assetForm.vendorId} onValueChange={(v) => setAssetForm({ ...assetForm, vendorId: v })}>
                                        <SelectTrigger className="text-xs"><SelectValue placeholder="None" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">None</SelectItem>
                                            {vendorsQ.data.map((v: any) => (
                                                <SelectItem key={v.id} value={String(v.id)}>{v.vendorName}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>
                        <Separator />
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-3">
                                <Checkbox
                                    id="internetFacing"
                                    checked={assetForm.isInternetFacing}
                                    onCheckedChange={(v) => setAssetForm({ ...assetForm, isInternetFacing: !!v })}
                                />
                                <Label htmlFor="internetFacing">{t("ctem.internetFacing", "Internet-facing")}</Label>
                            </div>
                            <div className="flex items-center gap-3">
                                <Checkbox
                                    id="personalData"
                                    checked={assetForm.handlesPersonalData}
                                    onCheckedChange={(v) => setAssetForm({ ...assetForm, handlesPersonalData: !!v })}
                                />
                                <Label htmlFor="personalData">{t("ctem.personalData", "Handles Personal Data")}</Label>
                            </div>
                            <div className="flex items-center gap-3">
                                <Checkbox
                                    id="criticalData"
                                    checked={assetForm.handlesCriticalData}
                                    onCheckedChange={(v) => setAssetForm({ ...assetForm, handlesCriticalData: !!v })}
                                />
                                <Label htmlFor="criticalData">{t("ctem.criticalData", "Handles Critical Data")}</Label>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="assetNotes">Notes</Label>
                            <Textarea
                                id="assetNotes"
                                rows={2}
                                value={assetForm.notes}
                                onChange={(e) => setAssetForm({ ...assetForm, notes: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAddAssetOpen(false)}>Cancel</Button>
                        <Button
                            disabled={!assetForm.assetName.trim() || createAsset.isPending}
                            onClick={() =>
                                createAsset.mutate({
                                    assetName: assetForm.assetName.trim(),
                                    assetType: assetForm.assetType as any,
                                    region: assetForm.region as any,
                                    ipDomain: assetForm.ipDomain || undefined,
                                    isInternetFacing: assetForm.isInternetFacing,
                                    handlesPersonalData: assetForm.handlesPersonalData,
                                    handlesCriticalData: assetForm.handlesCriticalData,
                                    criticalityScore: assetForm.criticalityScore,
                                    status: assetForm.status as any,
                                    notes: assetForm.notes || undefined,
                                    vendorId: assetForm.vendorId ? Number(assetForm.vendorId) : null,
                                })
                            }
                        >
                            {createAsset.isPending ? (
                                <><Loader2 size={13} className="animate-spin" /> {t("ctem.registering", "Registering…")}</>
                            ) : (
                                t("ctem.registerAsset", "Register Asset")
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Add Vulnerability Dialog ──────────────────────────────────── */}
            <Dialog open={addVulnOpen} onOpenChange={setAddVulnOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{t("ctem.addVuln", "Log Vulnerability")}</DialogTitle>
                        <DialogDescription>
                            {t("ctem.addVulnDesc", "Record a vulnerability against a monitored asset")}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        <div className="space-y-1">
                            <Label>{t("ctem.assetsTable", "Asset")}</Label>
                            <Select value={vulnForm.assetId} onValueChange={(v) => setVulnForm({ ...vulnForm, assetId: v })}>
                                <SelectTrigger className="text-xs"><SelectValue placeholder="Select asset…" /></SelectTrigger>
                                <SelectContent>
                                    {(assetsQ.data ?? []).map((a: any) => (
                                        <SelectItem key={a.id} value={String(a.id)}>{a.assetName}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label htmlFor="cveId">{t("ctem.cveId", "CVE ID")}</Label>
                                <Input
                                    id="cveId"
                                    value={vulnForm.cveId}
                                    onChange={(e) => setVulnForm({ ...vulnForm, cveId: e.target.value })}
                                    placeholder="CVE-2024-XXXXX"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label>{t("ctem.filterSeverity", "Severity")}</Label>
                                <Select value={vulnForm.severity} onValueChange={(v) => setVulnForm({ ...vulnForm, severity: v })}>
                                    <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {SEVERITY_LEVELS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="vulnTitle">{t("ctem.vulnTitle", "Title / Description")}</Label>
                            <Input
                                id="vulnTitle"
                                value={vulnForm.title}
                                onChange={(e) => setVulnForm({ ...vulnForm, title: e.target.value })}
                                placeholder="e.g. SQL Injection in login endpoint"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label>{t("ctem.cvssScore", "CVSS Score (0–100)")} — {(Number(vulnForm.cvssScore) / 10).toFixed(1)}/10</Label>
                            <input
                                type="range" min={0} max={100} step={1}
                                value={vulnForm.cvssScore}
                                onChange={(e) => setVulnForm({ ...vulnForm, cvssScore: e.target.value })}
                                className="w-full accent-primary"
                            />
                        </div>
                        <Separator />
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-3">
                                <Checkbox
                                    id="exploitAvail"
                                    checked={vulnForm.exploitAvailable}
                                    onCheckedChange={(v) => setVulnForm({ ...vulnForm, exploitAvailable: !!v })}
                                />
                                <Label htmlFor="exploitAvail">{t("ctem.exploitAvailableLabel", "Exploit Available")}</Label>
                            </div>
                            <div className="flex items-center gap-3">
                                <Checkbox
                                    id="isConfirmed"
                                    checked={vulnForm.isConfirmed}
                                    onCheckedChange={(v) => setVulnForm({ ...vulnForm, isConfirmed: !!v })}
                                />
                                <Label htmlFor="isConfirmed">{t("ctem.confirmed", "Confirmed")}</Label>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="vulnNotes">Notes</Label>
                            <Textarea
                                id="vulnNotes"
                                rows={2}
                                value={vulnForm.notes}
                                onChange={(e) => setVulnForm({ ...vulnForm, notes: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAddVulnOpen(false)}>Cancel</Button>
                        <Button
                            disabled={!vulnForm.assetId || !vulnForm.title.trim() || createVuln.isPending}
                            onClick={() =>
                                createVuln.mutate({
                                    assetId: Number(vulnForm.assetId),
                                    cveId: vulnForm.cveId || null,
                                    title: vulnForm.title.trim(),
                                    severity: vulnForm.severity as any,
                                    cvssScore: Number(vulnForm.cvssScore),
                                    exploitAvailable: vulnForm.exploitAvailable,
                                    isConfirmed: vulnForm.isConfirmed,
                                    notes: vulnForm.notes || undefined,
                                })
                            }
                        >
                            {createVuln.isPending ? (
                                <><Loader2 size={13} className="animate-spin" /> {t("ctem.logging", "Logging…")}</>
                            ) : (
                                t("ctem.logVuln", "Log Vulnerability")
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
