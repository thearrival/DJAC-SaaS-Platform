/**
 * VendorComplianceProfiles.tsx — Phase 34
 *
 * Vendor 360° Compliance Profiles — per-vendor composite health scores
 * aggregated across assessments, gap findings, risk register, remediation
 * tasks, and compliance incidents.
 *
 * Features:
 *   • Composite score 0–100 with colour gauge
 *   • Risk level badge: critical / high / medium / low
 *   • Module breakdown: assessment count, open gaps, open risks,
 *     open remediations, open incidents
 *   • Filter by risk level; search by vendor name / country
 *   • Stat cards: Total / Critical / High Risk / Low Risk
 *   • Click vendor card → profile drawer with module detail
 */

import { useState, useMemo } from "react";
import type React from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useLocale } from "@/contexts/useLocale";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Activity,
    AlertTriangle,
    ArrowUpRight,
    BarChart2,
    Building2,
    ChevronRight,
    ShieldAlert,
    ShieldCheck,
    ShieldOff,
    Users,
    Wrench,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type RiskLevel = "critical" | "high" | "medium" | "low";

type VendorRow = {
    id: number;
    vendorName: string;
    headquartersLocation: string | null;
    riskTier: string | null;
    assessmentCount: number;
    avgAssessmentScore: number | null;
    openGaps: number;
    criticalGaps: number;
    openRisks: number;
    criticalRisks: number;
    openRemediations: number;
    openIncidents: number;
    criticalIncidents: number;
    compositeScore: number;
    riskLevel: RiskLevel;
};

// ─── Colour helpers ───────────────────────────────────────────────────────────

const RISK_COLORS: Record<RiskLevel, { bg: string; text: string; border: string; gauge: string; arc: string }> = {
    critical: { bg: "bg-red-100 dark:bg-red-950", text: "text-red-700 dark:text-red-300", border: "border-l-red-500", gauge: "bg-red-500", arc: "#ef4444" },
    high: { bg: "bg-orange-100 dark:bg-orange-950", text: "text-orange-700 dark:text-orange-300", border: "border-l-orange-500", gauge: "bg-orange-500", arc: "#f97316" },
    medium: { bg: "bg-yellow-100 dark:bg-yellow-950", text: "text-yellow-700 dark:text-yellow-300", border: "border-l-yellow-500", gauge: "bg-yellow-500", arc: "#eab308" },
    low: { bg: "bg-green-100 dark:bg-green-950", text: "text-green-700 dark:text-green-300", border: "border-l-green-500", gauge: "bg-green-500", arc: "#22c55e" },
};

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: React.ElementType; color: string }) {
    return (
        <Card className="flex-1 min-w-[130px]">
            <CardContent className="pt-5 pb-4 px-4 flex items-center gap-3">
                <div className={`rounded-lg p-2 ${color}`}>
                    <Icon className="w-4 h-4" />
                </div>
                <div>
                    <p className="text-xl font-bold leading-none">{value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                </div>
            </CardContent>
        </Card>
    );
}

// ─── Score Gauge (SVG arc) ────────────────────────────────────────────────────

function ScoreGauge({ score, level }: { score: number; level: RiskLevel }) {
    const c = RISK_COLORS[level];
    // Semi-circle: radius 26, centre (32, 32), path M6,32 A26,26 0 0 1 58,32
    const r = 26;
    const pathLen = Math.PI * r; // â‰ˆ 81.68
    const filled = (Math.max(0, Math.min(100, score)) / 100) * pathLen;
    return (
        <div className="flex flex-col items-center min-w-[64px]" aria-label={`Score ${score}/100`}>
            <div className="relative">
                <svg width="64" height="36" viewBox="0 0 64 36" fill="none" aria-hidden>
                    {/* track */}
                    <path d="M 6 32 A 26 26 0 0 1 58 32" stroke="hsl(var(--border))" strokeWidth="6" strokeLinecap="round" fill="none" />
                    {/* value arc */}
                    <path d="M 6 32 A 26 26 0 0 1 58 32" stroke={c.arc} strokeWidth="6" strokeLinecap="round" strokeDasharray={`${filled} ${pathLen}`} fill="none" />
                </svg>
                <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 text-base font-bold leading-none ${c.text}`}>{score}</span>
            </div>
            <span className="text-[10px] text-muted-foreground -mt-0.5">/100</span>
        </div>
    );
}

// ─── Module Pill ──────────────────────────────────────────────────────────────

function ModulePill({ label, value, warn }: { label: string; value: number; warn?: boolean }) {
    return (
        <span className={`text-xs px-2 py-0.5 rounded flex items-center gap-1 ${warn && value > 0 ? "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300" : "bg-muted text-muted-foreground"}`}>
            {label}: <b>{value}</b>
        </span>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function VendorComplianceProfiles() {
    const { t } = useLocale();
    usePageTitle(t("vcp.pageTitle", "Vendor Compliance Profiles"));

    const [search, setSearch] = useState("");
    const [filterLevel, setFilterLevel] = useState("all");
    const [sortBy, setSortBy] = useState<"score-desc" | "score-asc" | "name">("score-desc");
    const [profileVendorId, setProfileVendorId] = useState<number | null>(null);

    const { data: vendors = [], isLoading, isError: vendorsError, refetch: refetchVendors } = trpc.vendorCompliance.list.useQuery();
    const { data: profile, isLoading: profileLoading, isError: profileError, refetch: refetchProfile } = trpc.vendorCompliance.profile.useQuery(
        { vendorId: profileVendorId! },
        { enabled: profileVendorId !== null }
    );

    // ── Stats ────────────────────────────────────────────────────────────────
    const stats = useMemo(() => ({
        total: vendors.length,
        critical: vendors.filter(v => v.riskLevel === "critical").length,
        high: vendors.filter(v => v.riskLevel === "high").length,
        low: vendors.filter(v => v.riskLevel === "low").length,
    }), [vendors]);

    // ── Filtered + sorted ────────────────────────────────────────────────
    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        const list = vendors.filter(v => {
            if (filterLevel !== "all" && v.riskLevel !== filterLevel) return false;
            if (q && !v.vendorName.toLowerCase().includes(q) && !(v.headquartersLocation ?? "").toLowerCase().includes(q)) return false;
            return true;
        });
        if (sortBy === "score-asc") list.sort((a, b) => a.compositeScore - b.compositeScore);
        else if (sortBy === "score-desc") list.sort((a, b) => b.compositeScore - a.compositeScore);
        else list.sort((a, b) => a.vendorName.localeCompare(b.vendorName));
        return list;
    }, [vendors, search, filterLevel, sortBy]);

    const profileData = profileVendorId !== null ? profile : null;

    return (
        <div className="djac-page">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold">{t("vcp.title", "Vendor Compliance Profiles")}</h1>
                <p className="text-sm text-muted-foreground mt-0.5">{t("vcp.subtitle", "360° compliance health for each vendor across all modules")}</p>
            </div>

            {/* Stats */}
            <div className="flex gap-3 flex-wrap">
                <StatCard label={t("vcp.statTotal", "Total Vendors")} value={stats.total} icon={Building2} color="bg-blue-100 dark:bg-blue-950 text-blue-600" />
                <StatCard label={t("vcp.statCritical", "Critical Risk")} value={stats.critical} icon={AlertTriangle} color="bg-red-100 dark:bg-red-950 text-red-600" />
                <StatCard label={t("vcp.statHigh", "High Risk")} value={stats.high} icon={ShieldAlert} color="bg-orange-100 dark:bg-orange-950 text-orange-600" />
                <StatCard label={t("vcp.statLow", "Low Risk")} value={stats.low} icon={ShieldCheck} color="bg-green-100 dark:bg-green-950 text-green-600" />
            </div>

            {/* Filters */}
            <div className="flex gap-2 flex-wrap">
                <Input
                    placeholder={t("vcp.searchPlaceholder", "Search vendors…")}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="max-w-xs"
                />
                <Select value={filterLevel} onValueChange={setFilterLevel}>
                    <SelectTrigger className="w-40">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t("vcp.filterAllLevels", "All risk levels")}</SelectItem>
                        {(["critical", "high", "medium", "low"] as RiskLevel[]).map(l => (
                            <SelectItem key={l} value={l}>{t(`vcp.riskLevel.${l}`, l)}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={v => setSortBy(v as typeof sortBy)}>
                    <SelectTrigger className="w-44">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="score-desc">{t("vcp.sortScoreDesc", "Score: high → low")}</SelectItem>
                        <SelectItem value="score-asc">{t("vcp.sortScoreAsc", "Score: low → high")}</SelectItem>
                        <SelectItem value="name">{t("vcp.sortName", "Name A → Z")}</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Vendor List */}
            {vendorsError ? (
                <Card>
                    <CardContent className="py-8 text-center">
                        <p className="text-sm text-muted-foreground">{t("vendorRisk.error", "Failed to load vendors.")}</p>
                        <Button variant="outline" size="sm" className="mt-3" onClick={() => { void refetchVendors(); }}>
                            {t("common.retry", "Retry")}
                        </Button>
                    </CardContent>
                </Card>
            ) : isLoading ? (
                <p className="text-sm text-muted-foreground py-8 text-center">{t("vcp.loading", "Loading vendor data…")}</p>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16 space-y-2">
                    <Users className="w-10 h-10 mx-auto text-muted-foreground opacity-40" />
                    <p className="text-sm text-muted-foreground">{t("vcp.emptyTitle", "No vendors found")}</p>
                    <p className="text-xs text-muted-foreground">{t("vcp.emptyDesc", "Add vendors via the Vendor Assessment page.")}</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map(v => {
                        const c = RISK_COLORS[v.riskLevel];
                        return (
                            <Card key={v.id} className={`border-l-4 ${c.border} cursor-pointer hover:shadow-md transition-shadow`} onClick={() => setProfileVendorId(v.id)}>
                                <CardContent className="pt-4 pb-4 px-5">
                                    <div className="flex items-center gap-4 flex-wrap">
                                        {/* Score gauge */}
                                        <ScoreGauge score={v.compositeScore} level={v.riskLevel} />

                                        {/* Info */}
                                        <div className="flex-1 min-w-0 space-y-1.5">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-semibold text-sm truncate">{v.vendorName}</span>
                                                <Badge className={`text-xs px-2 ${c.bg} ${c.text}`}>
                                                    {t(`vcp.riskLevel.${v.riskLevel}`, v.riskLevel)}
                                                </Badge>
                                                {v.riskTier && <Badge variant="outline" className="text-xs">{v.riskTier}</Badge>}
                                                {v.headquartersLocation && <span className="text-xs text-muted-foreground">{v.headquartersLocation}</span>}
                                            </div>
                                            <div className="flex flex-wrap gap-1.5">
                                                <ModulePill label={t("vcp.assess", "Assessments")} value={v.assessmentCount} />
                                                <ModulePill label={t("vcp.gaps", "Open Gaps")} value={v.openGaps} warn />
                                                <ModulePill label={t("vcp.risks", "Open Risks")} value={v.openRisks} warn />
                                                <ModulePill label={t("vcp.remed", "Remediations")} value={v.openRemediations} warn />
                                                <ModulePill label={t("vcp.incidents", "Incidents")} value={v.openIncidents} warn />
                                            </div>
                                        </div>

                                        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Profile Dialog */}
            <Dialog open={profileVendorId !== null} onOpenChange={v => { if (!v) setProfileVendorId(null); }}>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{profileData?.vendor?.vendorName ?? t("vcp.profile", "Vendor Profile")}</DialogTitle>
                        <DialogDescription>
                            {t("vcp.profileDesc", "Full compliance breakdown across all modules")}
                        </DialogDescription>
                    </DialogHeader>

                    {profileError ? (
                        <div className="py-6 text-center">
                            <p className="text-sm text-muted-foreground">{t("vendorDetail.loadError", "Failed to load vendor details")}</p>
                            <Button variant="outline" size="sm" className="mt-3" onClick={() => { void refetchProfile(); }}>
                                {t("common.retry", "Retry")}
                            </Button>
                        </div>
                    ) : profileLoading ? (
                        <p className="text-sm text-muted-foreground py-6 text-center">{t("vcp.loading", "Loading…")}</p>
                    ) : !profileData ? (
                        <p className="text-sm text-muted-foreground py-6 text-center">{t("vcp.noProfile", "No data available")}</p>
                    ) : (
                        <div className="space-y-4 py-2">
                            {/* Summary row */}
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { label: t("vcp.assess", "Assessments"), value: profileData.assessments.length, icon: BarChart2, href: `/vendor-assessment?vendorId=${profileVendorId}` },
                                    { label: t("vcp.gaps", "Gap Findings"), value: profileData.gaps.length, icon: ShieldOff, href: `/gap-tracker?vendorId=${profileVendorId}` },
                                    { label: t("vcp.risks", "Risk Entries"), value: profileData.risks.length, icon: AlertTriangle, href: `/risk-register?vendorId=${profileVendorId}` },
                                    { label: t("vcp.remed", "Remediations"), value: profileData.remediationTasks.length, icon: Wrench, href: `/remediation-planner?vendorId=${profileVendorId}` },
                                    { label: t("vcp.incidents", "Incidents"), value: profileData.incidents.length, icon: ShieldAlert, href: `/incident-register?vendorId=${profileVendorId}` },
                                ].map(({ label, value, icon: Icon, href }) => (
                                    <Link key={label} href={href} className="flex items-center gap-2 rounded-lg border p-3 hover:bg-muted/50 transition-colors group">
                                        <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-lg font-bold leading-none">{value}</p>
                                            <p className="text-xs text-muted-foreground">{label}</p>
                                        </div>
                                        <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                                    </Link>
                                ))}
                            </div>

                            {/* Gaps table */}
                            {profileData.gaps.length > 0 && (
                                <section>
                                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-1">
                                        <ShieldOff className="w-4 h-4" />
                                        {t("vcp.gaps", "Gap Findings")}
                                        <Link href={`/gap-tracker?vendorId=${profileVendorId}`} className="ml-auto text-xs text-primary flex items-center gap-0.5 hover:opacity-75 transition-opacity">
                                            {t("vcp.viewAll", "View all")} <ArrowUpRight className="w-3 h-3" />
                                        </Link>
                                    </h3>
                                    <div className="space-y-1 max-h-40 overflow-y-auto">
                                        {profileData.gaps.slice(0, 20).map((g: any) => (
                                            <div key={g.id} className="flex items-center gap-2 text-xs py-1 border-b border-border/50">
                                                <Badge className={`text-xs px-1.5 ${g.severity === "critical" ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300" : g.severity === "high" ? "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300" : "bg-muted text-muted-foreground"}`}>{g.severity}</Badge>
                                                <span className="truncate flex-1">{g.title}</span>
                                                <span className="text-muted-foreground shrink-0">{g.frameworkCode}</span>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Incidents */}
                            {profileData.incidents.length > 0 && (
                                <section>
                                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-1">
                                        <ShieldAlert className="w-4 h-4" />
                                        {t("vcp.incidents", "Incidents")}
                                        <Link href={`/incident-register?vendorId=${profileVendorId}`} className="ml-auto text-xs text-primary flex items-center gap-0.5 hover:opacity-75 transition-opacity">
                                            {t("vcp.viewAll", "View all")} <ArrowUpRight className="w-3 h-3" />
                                        </Link>
                                    </h3>
                                    <div className="space-y-1 max-h-32 overflow-y-auto">
                                        {profileData.incidents.slice(0, 10).map((i: any) => (
                                            <div key={i.id} className="flex items-center gap-2 text-xs py-1 border-b border-border/50">
                                                <Badge className={`text-xs px-1.5 ${i.severity === "critical" ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300" : "bg-muted text-muted-foreground"}`}>{i.severity}</Badge>
                                                <span className="truncate flex-1">{i.title}</span>
                                                <span className="text-muted-foreground shrink-0">{i.status}</span>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Risks */}
                            {profileData.risks.length > 0 && (
                                <section>
                                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-1">
                                        <AlertTriangle className="w-4 h-4" />
                                        {t("vcp.risks", "Risk Entries")}
                                        <Link href={`/risk-register?vendorId=${profileVendorId}`} className="ml-auto text-xs text-primary flex items-center gap-0.5 hover:opacity-75 transition-opacity">
                                            {t("vcp.viewAll", "View all")} <ArrowUpRight className="w-3 h-3" />
                                        </Link>
                                    </h3>
                                    <div className="space-y-1 max-h-32 overflow-y-auto">
                                        {profileData.risks.slice(0, 10).map((r: any) => (
                                            <div key={r.id} className="flex items-center gap-2 text-xs py-1 border-b border-border/50">
                                                <Badge className="text-xs px-1.5 bg-muted text-muted-foreground">
                                                    {t("vcp.score", "Score")} {(r.likelihood ?? 1) * (r.impact ?? 1)}
                                                </Badge>
                                                <span className="truncate flex-1">{r.title}</span>
                                                <span className="text-muted-foreground shrink-0">{r.status}</span>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
