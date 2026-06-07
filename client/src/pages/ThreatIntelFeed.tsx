/**
 * ThreatIntelFeed.tsx
 *
 * Threat intelligence feed showing curated security bulletins.
 * Supports filtering by severity and category.
 * Detail panel expands inline to show full summary, IoCs, and references.
 */

import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
    AlertOctagon,
    AlertTriangle,
    Bug,
    ChevronDown,
    ChevronRight,
    ExternalLink,
    Eye,
    Info,
    RadioTower,
    Search,
    ShieldAlert,
    Skull,
    Zap,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const SEVERITY_CONFIG = {
    info: { label: "Info", color: "bg-blue-500/10 text-blue-400", icon: <Info className="size-3" /> },
    low: { label: "Low", color: "bg-green-500/10 text-green-400", icon: <Activity className="size-3" /> },
    medium: { label: "Medium", color: "bg-yellow-500/10 text-yellow-400", icon: <AlertTriangle className="size-3" /> },
    high: { label: "High", color: "bg-orange-500/10 text-orange-400", icon: <AlertOctagon className="size-3" /> },
    critical: { label: "Critical", color: "bg-red-500/10 text-red-400", icon: <Skull className="size-3" /> },
} as const;

const TLP_CONFIG = {
    white: { label: "TLP:WHITE", color: "bg-zinc-500/10 text-zinc-300" },
    green: { label: "TLP:GREEN", color: "bg-green-600/20 text-green-400" },
    amber: { label: "TLP:AMBER", color: "bg-amber-500/20 text-amber-400" },
    red: { label: "TLP:RED", color: "bg-red-600/20 text-red-400" },
} as const;

const CATEGORY_CONFIG: Record<string, { label: string; icon: React.ReactNode }> = {
    malware: { label: "Malware", icon: <Bug className="size-3" /> },
    ransomware: { label: "Ransomware", icon: <Skull className="size-3" /> },
    phishing: { label: "Phishing", icon: <RadioTower className="size-3" /> },
    apt: { label: "APT", icon: <Eye className="size-3" /> },
    zero_day: { label: "Zero Day", icon: <Zap className="size-3" /> },
    ddos: { label: "DDoS", icon: <Activity className="size-3" /> },
    supply_chain: { label: "Supply Chain", icon: <AlertOctagon className="size-3" /> },
    data_breach: { label: "Data Breach", icon: <ShieldAlert className="size-3" /> },
    vulnerability: { label: "Vulnerability", icon: <Bug className="size-3" /> },
    social_engineering: { label: "Social Engineering", icon: <RadioTower className="size-3" /> },
    insider_threat: { label: "Insider Threat", icon: <Eye className="size-3" /> },
    other: { label: "Other", icon: <Info className="size-3" /> },
};

const SEVERITIES = ["info", "low", "medium", "high", "critical"] as const;
const CATEGORIES = [
    "malware", "ransomware", "phishing", "apt", "zero_day", "ddos",
    "supply_chain", "data_breach", "vulnerability", "social_engineering",
    "insider_threat", "other",
] as const;

import type React from "react";

// ─── Component ────────────────────────────────────────────────────────────────

export default function ThreatIntelFeed() {
    usePageTitle("Threat Intelligence Feed");

    const [searchQuery, setSearchQuery] = useState("");
    const [severityFilter, setSeverityFilter] = useState<string>("all");
    const [categoryFilter, setCategoryFilter] = useState<string>("all");
    const [expandedId, setExpandedId] = useState<number | null>(null);

    const { data: items = [], isLoading, isError, refetch } = trpc.threatIntel.feed.useQuery({
        limit: 100,
    });

    const filtered = useMemo(() => {
        return items.filter((item) => {
            if (severityFilter !== "all" && item.severity !== severityFilter) return false;
            if (categoryFilter !== "all" && item.category !== categoryFilter) return false;
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                return (
                    item.title.toLowerCase().includes(q) ||
                    item.summary.toLowerCase().includes(q) ||
                    (item.threatActor ?? "").toLowerCase().includes(q) ||
                    (item.cveId ?? "").toLowerCase().includes(q)
                );
            }
            return true;
        });
    }, [items, severityFilter, categoryFilter, searchQuery]);

    // Stats
    const criticalCount = items.filter((i) => i.severity === "critical").length;
    const highCount = items.filter((i) => i.severity === "high").length;

    return (
        <div className="flex flex-col gap-6 p-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white">Threat Intelligence Feed</h1>
                <p className="text-sm text-zinc-400 mt-1">
                    Curated security bulletins from the Yalla-Hack intelligence team
                </p>
            </div>

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-3">
                <StatCard
                    label="Total Bulletins"
                    value={items.length}
                    icon={<ShieldAlert className="size-5 text-zinc-400" />}
                />
                <StatCard
                    label="Critical"
                    value={criticalCount}
                    icon={<Skull className="size-5 text-red-400" />}
                    accent="text-red-400"
                />
                <StatCard
                    label="High Severity"
                    value={highCount}
                    icon={<AlertOctagon className="size-5 text-orange-400" />}
                    accent="text-orange-400"
                />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
                <div className="relative flex-1 min-w-48">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
                    <Input
                        placeholder="Search bulletins, CVEs, threat actors…"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 bg-zinc-800 border-zinc-700"
                    />
                </div>
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                    <SelectTrigger className="w-40 bg-zinc-800 border-zinc-700">
                        <SelectValue placeholder="All severities" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                        <SelectItem value="all">All Severities</SelectItem>
                        {SEVERITIES.map((s) => (
                            <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-44 bg-zinc-800 border-zinc-700">
                        <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                        <SelectItem value="all">All Categories</SelectItem>
                        {CATEGORIES.map((c) => (
                            <SelectItem key={c} value={c}>
                                {CATEGORY_CONFIG[c]?.label ?? c}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {(severityFilter !== "all" || categoryFilter !== "all" || searchQuery) && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-zinc-400"
                        onClick={() => { setSeverityFilter("all"); setCategoryFilter("all"); setSearchQuery(""); }}
                    >
                        Clear filters
                    </Button>
                )}
                <span className="text-xs text-zinc-500 ml-auto">
                    {filtered.length} of {items.length} bulletins
                </span>
            </div>

            {/* Feed */}
            {isError ? (
                <Alert variant="destructive" className="border-red-900/60 bg-zinc-950/70 text-red-200">
                    <ShieldAlert className="size-4" />
                    <AlertTitle>Threat feed unavailable</AlertTitle>
                    <AlertDescription>
                        <p>Failed to load threat intelligence bulletins.</p>
                        <Button variant="outline" size="sm" className="mt-2 border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800" onClick={() => refetch()}>
                            Retry
                        </Button>
                    </AlertDescription>
                </Alert>
            ) : isLoading ? (
                <div className="text-center py-16 text-zinc-500">Loading threat intelligence…</div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16 text-zinc-500">
                    <ShieldAlert className="size-12 mx-auto mb-3 opacity-30" />
                    <p>No bulletins match your filters.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {filtered.map((item) => {
                        const sc = SEVERITY_CONFIG[item.severity as keyof typeof SEVERITY_CONFIG];
                        const tc = TLP_CONFIG[item.tlp as keyof typeof TLP_CONFIG];
                        const cc = CATEGORY_CONFIG[item.category];
                        const isExpanded = expandedId === item.id;

                        return (
                            <Card
                                key={item.id}
                                className={`bg-zinc-900 border-zinc-800 cursor-pointer transition-colors hover:border-zinc-600 ${isExpanded ? "border-zinc-600" : ""}`}
                            >
                                <CardHeader
                                    className="pb-3 cursor-pointer"
                                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap mb-2">
                                                <Badge className={`gap-1 text-xs ${sc.color}`}>
                                                    {sc.icon}{sc.label}
                                                </Badge>
                                                <Badge className={`gap-1 text-xs bg-zinc-800 text-zinc-400`}>
                                                    {cc?.icon}{cc?.label ?? item.category}
                                                </Badge>
                                                <Badge className={`text-xs ${tc.color}`}>{tc.label}</Badge>
                                                {item.cveId && (
                                                    <Badge className="text-xs bg-purple-500/10 text-purple-400 font-mono">
                                                        {item.cveId}
                                                        {item.cvssScore && ` · CVSS ${item.cvssScore}`}
                                                    </Badge>
                                                )}
                                            </div>
                                            <CardTitle className="text-white text-base leading-snug">{item.title}</CardTitle>
                                            {item.threatActor && (
                                                <p className="text-xs text-zinc-500 mt-1">
                                                    Threat Actor: <span className="text-zinc-300">{item.threatActor}</span>
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0">
                                            <span className="text-xs text-zinc-600 hidden sm:block">
                                                {new Date(item.publishedAt).toLocaleDateString("en-GB", {
                                                    day: "numeric", month: "short", year: "numeric",
                                                })}
                                            </span>
                                            {isExpanded
                                                ? <ChevronDown className="size-4 text-zinc-500" />
                                                : <ChevronRight className="size-4 text-zinc-500" />
                                            }
                                        </div>
                                    </div>
                                </CardHeader>

                                {isExpanded && (
                                    <CardContent className="pt-0 border-t border-zinc-800">
                                        <div className="space-y-4 pt-4">
                                            {/* Summary */}
                                            <div>
                                                <h4 className="text-xs text-zinc-500 uppercase tracking-wide mb-2">Summary</h4>
                                                <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line">
                                                    {item.summary}
                                                </p>
                                            </div>

                                            {/* Affected Sectors */}
                                            {item.affectedSectors && (
                                                <div>
                                                    <h4 className="text-xs text-zinc-500 uppercase tracking-wide mb-2">Affected Sectors</h4>
                                                    <div className="flex flex-wrap gap-1">
                                                        {item.affectedSectors.split(",").map((s) => (
                                                            <Badge key={s} className="text-xs bg-zinc-800 text-zinc-400 capitalize">
                                                                {s.trim()}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* IoCs */}
                                            {item.indicators && (
                                                <div>
                                                    <h4 className="text-xs text-zinc-500 uppercase tracking-wide mb-2">
                                                        Indicators of Compromise (IoCs)
                                                    </h4>
                                                    <div className="bg-zinc-950 rounded-md p-3 border border-zinc-800">
                                                        {item.indicators.split(",").map((ioc, i) => (
                                                            <div key={i} className="text-xs font-mono text-emerald-400 leading-relaxed">
                                                                {ioc.trim()}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Reference */}
                                            {item.referenceUrl && (
                                                <div>
                                                    <a
                                                        href={item.referenceUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <ExternalLink className="size-3.5" />
                                                        View Advisory / CVE Reference
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                )}
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function StatCard({
    label, value, icon, accent = "text-white",
}: {
    label: string; value: number; icon: React.ReactNode; accent?: string;
}) {
    return (
        <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="pt-5 flex items-center justify-between">
                <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wide">{label}</p>
                    <p className={`text-3xl font-bold mt-1 ${accent}`}>{value}</p>
                </div>
                {icon}
            </CardContent>
        </Card>
    );
}
