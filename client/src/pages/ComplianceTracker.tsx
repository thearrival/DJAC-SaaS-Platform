import { useEffect, useMemo, useState } from "react";
import type React from "react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useLocale } from "@/contexts/useLocale";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    AlertCircle,
    Clock,
    CalendarDays,
    Download,
    Search,
    ShieldCheck,
    Globe2,
    ArrowLeftRight,
    LoaderCircle,
    Timer,
} from "lucide-react";

type RiskLevel = "critical" | "high" | "medium" | "low";
type Frequency =
    | "immediate"
    | "within_2h"
    | "within_24h"
    | "within_48h"
    | "within_72h"
    | "monthly"
    | "quarterly"
    | "semi_annual"
    | "annual"
    | "ongoing";

// ── CSV helpers ──────────────────────────────────────────────────────────────

function rowsToCsv(rows: Record<string, unknown>[]): string {
    if (!rows.length) return "";
    const keys = Object.keys(rows[0]);
    const escape = (v: unknown) => {
        if (v === null || v === undefined) return "";
        const s = String(v).replace(/"/g, '""');
        return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s}"` : s;
    };
    return [keys.join(","), ...rows.map(r => keys.map(k => escape(r[k])).join(","))].join("\n");
}

function downloadCsv(filename: string, content: string) {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
}

// ── Risk filter pill config ───────────────────────────────────────────────────

const RISK_LEVELS = ["all", "critical", "high", "medium", "low"] as const;
type RiskFilterLevel = typeof RISK_LEVELS[number];

const RISK_PILL_CLASS: Record<RiskFilterLevel, string> = {
    all: "bg-muted text-muted-foreground border-border",
    critical: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 border-red-400",
    high: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300 border-orange-400",
    medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300 border-yellow-400",
    low: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300 border-green-400",
};

const RISK_COLORS: Record<RiskLevel, string> = {
    critical: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border-red-300",
    high: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 border-orange-300",
    medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300 border-yellow-300",
    low: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300 border-green-300",
};

const FREQ_LABELS: Record<Frequency, string> = {
    immediate: "Immediate",
    within_2h: "Within 2 Hours",
    within_24h: "Within 24 Hours",
    within_48h: "Within 48 Hours",
    within_72h: "Within 72 Hours",
    monthly: "Monthly",
    quarterly: "Quarterly",
    semi_annual: "Semi-Annual",
    annual: "Annual",
    ongoing: "Ongoing",
};

const FREQ_ICONS: Partial<Record<Frequency, React.ReactNode>> = {
    immediate: <AlertCircle className="h-3.5 w-3.5" />,
    within_2h: <Timer className="h-3.5 w-3.5" />,
    within_24h: <Timer className="h-3.5 w-3.5" />,
    within_48h: <Timer className="h-3.5 w-3.5" />,
    within_72h: <Timer className="h-3.5 w-3.5" />,
    quarterly: <Clock className="h-3.5 w-3.5" />,
    semi_annual: <Clock className="h-3.5 w-3.5" />,
    annual: <CalendarDays className="h-3.5 w-3.5" />,
    ongoing: <ShieldCheck className="h-3.5 w-3.5" />,
};

function RiskBadge({ level }: { level: string }) {
    const { t } = useLocale();
    const color = RISK_COLORS[level as RiskLevel] ?? "bg-muted text-muted-foreground";
    return (
        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${color}`}>
            {t(`common.risk.${level}`, level.charAt(0).toUpperCase() + level.slice(1))}
        </span>
    );
}

function FrequencyBadge({ frequency }: { frequency: string }) {
    const { t } = useLocale();
    const fallback = FREQ_LABELS[frequency as Frequency] ?? frequency;
    const label = t(`enhanced.freq.${frequency}`, fallback);
    const icon = FREQ_ICONS[frequency as Frequency];
    return (
        <span className="inline-flex items-center gap-1.5 rounded bg-muted px-2 py-1 text-xs text-muted-foreground font-medium">
            {icon}
            {label}
        </span>
    );
}

function ObligationCard({ obligation }: { obligation: { id: string; framework: string; requirement: string; frequency: string; riskLevel: string; deadline?: string; authority: string; description: string; references: string[] } }) {
    const [expanded, setExpanded] = useState(false);
    const { t } = useLocale();

    return (
        <div className="rounded-lg border bg-card p-4 space-y-3 hover:shadow-md transition-shadow">
            <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground leading-snug">{obligation.requirement}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        <span className="font-medium text-foreground/70">{obligation.framework}</span>
                        {" · "}
                        {obligation.authority}
                        {obligation.deadline && (
                            <span className="ml-2 font-semibold text-primary">📅 {obligation.deadline}</span>
                        )}
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <RiskBadge level={obligation.riskLevel} />
                    <FrequencyBadge frequency={obligation.frequency} />
                </div>
            </div>

            {expanded && (
                <div className="space-y-2 border-t pt-3">
                    <p className="text-sm text-muted-foreground leading-relaxed">{obligation.description}</p>
                    {obligation.references.length > 0 && (
                        <div>
                            <p className="text-xs font-medium uppercase text-muted-foreground mb-1">{t("tracker.references", "References")}</p>
                            <ul className="list-disc pl-4 space-y-0.5">
                                {obligation.references.map((ref) => (
                                    <li key={ref} className="text-xs text-muted-foreground">{ref}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            <button
                onClick={() => setExpanded(e => !e)}
                className="text-xs text-primary hover:underline"
            >
                {expanded ? t("tracker.hideDetails", "Hide details") : t("tracker.showDetails", "Show details")}
            </button>
        </div>
    );
}

function CountryTab({ country }: { country: "Saudi Arabia" | "China" }) {
    const { t } = useLocale();
    const [search, setSearch] = useState("");
    const [riskFilter, setRiskFilter] = useState<RiskFilterLevel>("all");

    const { data, isLoading, error: countryError, refetch: refetchCountry } = trpc.compliance.timetableByCountry.useQuery(country, {
        refetchOnWindowFocus: false,
    });
    useEffect(() => {
        if (countryError) toast.error(t("tracker.loadError", "Failed to load compliance obligations."));
    }, [countryError]);

    const filteredData = useMemo(() => {
        if (!data) return [];
        let d = data;
        if (riskFilter !== "all") d = d.filter(o => o.riskLevel === riskFilter);
        if (search.trim()) {
            const q = search.trim().toLowerCase();
            d = d.filter(o =>
                o.requirement.toLowerCase().includes(q) ||
                o.framework.toLowerCase().includes(q) ||
                o.authority.toLowerCase().includes(q) ||
                (o.description ?? "").toLowerCase().includes(q)
            );
        }
        return d;
    }, [data, search, riskFilter]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
                <LoaderCircle className="h-5 w-5 animate-spin" />
                <span>{t("tracker.loadingObligations", "Loading compliance obligations...")}</span>
            </div>
        );
    }

    if (countryError && !data) {
        return (
            <Card className="border-destructive/30">
                <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
                    <AlertCircle className="h-8 w-8 text-destructive" />
                    <div>
                        <p className="text-sm font-medium text-foreground">
                            {t("tracker.loadError", "Failed to load compliance obligations.")}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            {t("tracker.retryHint", "Retry to refresh the obligations list.")}
                        </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => { void refetchCountry(); }}>
                        {t("common.retry", "Retry")}
                    </Button>
                </CardContent>
            </Card>
        );
    }

    if (!data || data.length === 0) {
        return <p className="py-8 text-center text-muted-foreground">{t("tracker.noObligations", "No obligations found.")}</p>;
    }

    const critical = filteredData.filter(o => o.riskLevel === "critical");
    const others = filteredData.filter(o => o.riskLevel !== "critical");

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                        placeholder={t("tracker.searchPlaceholder", "Search obligations...")}
                        className="h-8 w-52 pl-8 text-xs"
                    />
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                    {RISK_LEVELS.map(r => (
                        <button
                            key={r}
                            onClick={() => setRiskFilter(r)}
                            className={[
                                "h-7 rounded-full border px-3 text-xs font-medium transition-all",
                                riskFilter === r
                                    ? RISK_PILL_CLASS[r]
                                    : "border-transparent text-muted-foreground hover:bg-muted",
                            ].join(" ")}
                        >
                            {r === "all" ? t("common.all", "All") : r.charAt(0).toUpperCase() + r.slice(1)}
                        </button>
                    ))}
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    className="ml-auto h-8"
                    disabled={filteredData.length === 0}
                    onClick={() => {
                        const rows = filteredData.map(o => ({
                            id: o.id,
                            framework: o.framework,
                            requirement: o.requirement,
                            riskLevel: o.riskLevel,
                            frequency: o.frequency,
                            deadline: o.deadline ?? "",
                            authority: o.authority,
                            description: o.description ?? "",
                        }));
                        downloadCsv(
                            `compliance-${country.toLowerCase().replace(/ /g, "-")}-${new Date().toISOString().slice(0, 10)}.csv`,
                            rowsToCsv(rows as Record<string, unknown>[])
                        );
                    }}
                >
                    <Download className="mr-1.5 h-3.5 w-3.5" />
                    {t("tracker.exportCsv", "Export CSV")}
                </Button>
            </div>

            {filteredData.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">
                    {(search || riskFilter !== "all")
                        ? t("tracker.noFilterMatch", "No obligations match your filter.")
                        : t("tracker.noObligations", "No obligations found.")}
                </p>
            ) : (
                <div className="space-y-6">
                    {critical.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 text-red-500" />
                                <h3 className="font-semibold text-foreground">{t("tracker.criticalObligations", "Critical Obligations")}</h3>
                                <Badge variant="destructive" className="text-xs">{critical.length}</Badge>
                            </div>
                            {critical.map(o => <ObligationCard key={o.id} obligation={o} />)}
                        </div>
                    )}
                    {others.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4 text-primary" />
                                <h3 className="font-semibold text-foreground">{t("tracker.otherObligations", "Other Obligations")}</h3>
                                <Badge variant="secondary" className="text-xs">{others.length}</Badge>
                            </div>
                            {others.map(o => <ObligationCard key={o.id} obligation={o} />)}
                        </div>
                    )}
                </div>
            )}
            <p className="text-xs text-muted-foreground text-right">
                {(search || riskFilter !== "all")
                    ? `${filteredData.length} / ${data.length} obligations`
                    : `${data.length} obligation${data.length === 1 ? "" : "s"}`}
            </p>
        </div>
    );
}

function ComparisonTab() {
    const { t } = useLocale();
    const [search, setSearch] = useState("");
    const { data, isLoading, error: comparisonError, refetch: refetchComparison } = trpc.compliance.comparisonTable.useQuery(undefined, {
        refetchOnWindowFocus: false,
    });
    useEffect(() => {
        if (comparisonError) toast.error(t("tracker.comparisonLoadError", "Failed to load comparison data."));
    }, [comparisonError]);

    const filteredRows = useMemo(() => {
        if (!data) return [];
        if (!search.trim()) return data;
        const q = search.trim().toLowerCase();
        return data.filter(r =>
            r.topic.toLowerCase().includes(q) ||
            (r.saudiArabia ?? "").toLowerCase().includes(q) ||
            (r.china ?? "").toLowerCase().includes(q) ||
            (r.notes ?? "").toLowerCase().includes(q)
        );
    }, [data, search]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
                <LoaderCircle className="h-5 w-5 animate-spin" />
                <span>{t("tracker.loadingComparison", "Loading comparison data...")}</span>
            </div>
        );
    }

    if (comparisonError && !data) {
        return (
            <Card className="border-destructive/30">
                <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
                    <AlertCircle className="h-8 w-8 text-destructive" />
                    <div>
                        <p className="text-sm font-medium text-foreground">
                            {t("tracker.comparisonLoadError", "Failed to load comparison data.")}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            {t("tracker.retryHint", "Retry to refresh the comparison table.")}
                        </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => { void refetchComparison(); }}>
                        {t("common.retry", "Retry")}
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <p className="flex-1 text-sm text-muted-foreground">
                    {t("tracker.comparisonSideBySide", "Side-by-side comparison of cybersecurity regulatory requirements in Saudi Arabia and China.")}
                </p>
                <div className="relative">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                        placeholder={t("tracker.comparisonSearchPlaceholder", "Search topics...")}
                        className="h-8 w-44 pl-8 text-xs"
                    />
                </div>
            </div>
            <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b bg-muted/50">
                            <th className="px-4 py-3 text-left font-semibold text-foreground w-1/5">{t("tracker.topicHeader", "Topic")}</th>
                            <th className="px-4 py-3 text-left font-semibold text-green-700 dark:text-green-400 w-[30%]">
                                🇸🇦 {t("home.saudi", "Saudi Arabia")}
                            </th>
                            <th className="px-4 py-3 text-left font-semibold text-red-700 dark:text-red-400 w-[30%]">
                                🇨🇳 {t("home.china", "China")}
                            </th>
                            <th className="px-4 py-3 text-left font-semibold text-muted-foreground w-1/5">{t("tracker.notesHeader", "Notes")}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredRows.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-4 py-8 text-center text-sm text-muted-foreground">
                                    {search
                                        ? t("tracker.noComparisonMatch", "No topics match your search.")
                                        : t("tracker.noComparisonData", "No comparison data available.")}
                                </td>
                            </tr>
                        ) : (
                            filteredRows.map((row) => (
                                <tr key={row.topic} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                                    <td className="px-4 py-3 font-medium text-foreground align-top">{row.topic}</td>
                                    <td className="px-4 py-3 text-foreground/80 align-top">{row.saudiArabia}</td>
                                    <td className="px-4 py-3 text-foreground/80 align-top">{row.china}</td>
                                    <td className="px-4 py-3 text-muted-foreground text-xs align-top italic">{row.notes}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            {data && data.length > 0 && (
                <p className="text-xs text-muted-foreground text-right">
                    {search ? `${filteredRows.length} / ${data.length} topics` : `${data.length} topics`}
                </p>
            )}
        </div>
    );
}

function SummaryCards() {
    const { t } = useLocale();
    const { data: allObligations, error: summaryError, refetch: refetchSummary } = trpc.compliance.timetable.useQuery(undefined, {
        refetchOnWindowFocus: false,
    });
    useEffect(() => {
        if (summaryError) toast.error(t("tracker.summaryLoadError", "Failed to load obligations summary."));
    }, [summaryError]);

    const saCount = allObligations?.filter(o => o.country === "Saudi Arabia").length ?? 0;
    const cnCount = allObligations?.filter(o => o.country === "China").length ?? 0;
    const criticalCount = allObligations?.filter(o => o.riskLevel === "critical").length ?? 0;
    const timeBasedCount = allObligations?.filter(o =>
        ["immediate", "within_2h", "within_24h", "within_48h", "within_72h"].includes(o.frequency)
    ).length ?? 0;

    const mostUrgent = allObligations
        ?.filter(o => o.riskLevel === "critical")
        .slice(0, 1)[0] ?? allObligations?.filter(o => o.riskLevel === "high").slice(0, 1)[0];

    if (summaryError && !allObligations) {
        return (
            <Card className="mb-4 border-destructive/30">
                <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
                    <AlertCircle className="h-8 w-8 text-destructive" />
                    <div>
                        <p className="text-sm font-medium text-foreground">
                            {t("tracker.summaryLoadError", "Failed to load obligations summary.")}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            {t("tracker.retryHint", "Retry to refresh the summary cards.")}
                        </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => { void refetchSummary(); }}>
                        {t("common.retry", "Retry")}
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            {mostUrgent && (
                <div className="mb-4 rounded-xl border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30 px-4 py-3 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-red-800 dark:text-red-300">Priority Obligation — {mostUrgent.framework}</p>
                        <p className="text-xs text-red-700 dark:text-red-400 mt-0.5 truncate">{mostUrgent.requirement}</p>
                    </div>
                    <span className="flex-shrink-0 rounded-full bg-red-100 dark:bg-red-900/50 border border-red-300 dark:border-red-700 px-2.5 py-0.5 text-xs font-semibold text-red-800 dark:text-red-300">{mostUrgent.riskLevel}</span>
                </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <Card>
                    <CardContent className="pt-5">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-green-100 dark:bg-green-950 p-2">
                                <ShieldCheck className="h-5 w-5 text-green-700 dark:text-green-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">{saCount}</p>
                                <p className="text-xs text-muted-foreground">{t("tracker.saObligations", "Saudi Obligations")}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-5">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-red-100 dark:bg-red-950 p-2">
                                <Globe2 className="h-5 w-5 text-red-700 dark:text-red-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">{cnCount}</p>
                                <p className="text-xs text-muted-foreground">{t("tracker.cnObligations", "China Obligations")}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-5">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-red-100 dark:bg-red-950 p-2">
                                <AlertCircle className="h-5 w-5 text-red-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">{criticalCount}</p>
                                <p className="text-xs text-muted-foreground">{t("tracker.criticalRiskItems", "Critical Risk Items")}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-5">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-orange-100 dark:bg-orange-950 p-2">
                                <Timer className="h-5 w-5 text-orange-700 dark:text-orange-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">{timeBasedCount}</p>
                                <p className="text-xs text-muted-foreground">{t("tracker.timeCriticalReports", "Time-Critical Reports")}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>);
}

export default function ComplianceTracker() {
    usePageTitle("Compliance Tracker");
    const { t } = useLocale();

    return (
        <div className="djac-page">
            <div>
                <h1 className="text-3xl font-bold mb-2" style={{ background: "linear-gradient(135deg,#01FF7F,#9359EC)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                    {t("tracker.title", "Compliance Obligation Tracker")}
                </h1>
                <p style={{ color: "var(--djac-muted)" }}>
                    {t(
                        "tracker.subtitle",
                        "Never miss a deadline. Track every obligation across Saudi and China frameworks — ranked by urgency."
                    )}
                </p>
            </div>

            <SummaryCards />

            <Tabs defaultValue="saudi" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="saudi" className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4" />
                        {t("tracker.tabSaudi", "🇸🇦 Saudi Arabia")}
                    </TabsTrigger>
                    <TabsTrigger value="china" className="flex items-center gap-2">
                        <Globe2 className="h-4 w-4" />
                        {t("tracker.tabChina", "🇨🇳 China")}
                    </TabsTrigger>
                    <TabsTrigger value="comparison" className="flex items-center gap-2">
                        <ArrowLeftRight className="h-4 w-4" />
                        {t("tracker.tabComparison", "Side-by-Side")}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="saudi">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5 text-green-600" />
                                {t("tracker.saudiTitle", "Saudi Arabia — Compliance Obligations")}
                            </CardTitle>
                            <CardDescription>
                                {t(
                                    "tracker.saudiDesc",
                                    "NCA (ECC, CCC, CSCC, OTCC) and SDAIA (PDPL) regulatory obligations with deadlines and risk levels."
                                )}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <CountryTab country="Saudi Arabia" />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="china">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Globe2 className="h-5 w-5 text-red-600" />
                                {t("tracker.chinaTitle", "China — Compliance Obligations")}
                            </CardTitle>
                            <CardDescription>
                                {t(
                                    "tracker.chinaDesc",
                                    "CAC (CSL, PIPL), MPS (MLPS 2.0), MIIT, and State Council regulatory obligations including the 2026 CSL amendments."
                                )}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <CountryTab country="China" />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="comparison">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ArrowLeftRight className="h-5 w-5 text-primary" />
                                {t("tracker.comparisonTitle", "Saudi Arabia vs. China — Regulatory Comparison")}
                            </CardTitle>
                            <CardDescription>
                                {t(
                                    "tracker.comparisonDesc",
                                    "Structured comparison of key regulatory topics to help organizations understand similarities and differences for cross-border compliance planning."
                                )}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ComparisonTab />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
