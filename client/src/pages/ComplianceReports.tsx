/**
 * ComplianceReports.tsx — Phase 35
 *
 * Compliance Reports & Export — org-wide snapshot across all compliance modules
 * plus module-level tabular data with CSV download.
 *
 * Features:
 *   • Summary panel: 7 module cards (Vendors, Gaps, Risks, Remediation,
 *     Policies, Incidents, Audit Schedule) each with key metrics
 *   • Module table: select any module, render paginated rows
 *   • CSV download: client-side CSV generation from loaded row data
 *   • Report timestamp + refresh
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    AlertTriangle,
    ArrowRight,
    BarChart2,
    BookOpen,
    Building2,
    CalendarCheck2,
    ClipboardCheck,
    Download,
    RefreshCw,
    Search,
    ShieldAlert,
    ShieldOff,
    Wrench,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

// ─── Module nav routes ───────────────────────────────────────────────────────────

const MODULE_HREF: Record<string, string> = {
    vendors: "/vendor-assessment",
    gaps: "/gap-tracker",
    risks: "/risk-register",
    remediation: "/remediation-planner",
    policies: "/policy-manager",
    incidents: "/incident-register",
    audit_schedule: "/audit-schedule",
};

// ─── Types ────────────────────────────────────────────────────────────────────

type ModuleKey = "gaps" | "risks" | "remediation" | "policies" | "incidents" | "audit_schedule";

// ─── CSV helper ───────────────────────────────────────────────────────────────

function rowsToCsv(rows: Record<string, unknown>[]): string {
    if (!rows.length) return "";
    const keys = Object.keys(rows[0]);
    const header = keys.join(",");
    const body = rows.map(row =>
        keys.map(k => {
            const v = row[k];
            if (v === null || v === undefined) return "";
            const s = String(v).replace(/"/g, '""');
            return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s}"` : s;
        }).join(",")
    );
    return [header, ...body].join("\n");
}

function downloadCsv(filename: string, content: string) {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

// ─── Summary module card ──────────────────────────────────────────────────────

function SummaryCard({
    icon: Icon,
    label,
    total,
    items,
    color,
    href,
    onClick,
}: {
    icon: React.ElementType;
    label: string;
    total: number;
    items: { label: string; value: number; warn?: boolean }[];
    color: string;
    href?: string;
    onClick?: () => void;
}) {
    return (
        <Card
            className={onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""}
            onClick={onClick}
        >
            <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <div className={`rounded p-1.5 ${color}`}>
                        <Icon className="w-3.5 h-3.5" />
                    </div>
                    {label}
                    <Badge variant="outline" className="ml-auto text-xs">{total}</Badge>
                    {href && (
                        <Link
                            href={href}
                            className="text-muted-foreground hover:text-primary transition-colors ml-0.5"
                            onClick={(e: React.MouseEvent) => e.stopPropagation()}
                        >
                            <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-1">
                {items.map(item => (
                    <div key={item.label} className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{item.label}</span>
                        <span className={`font-semibold ${item.warn && item.value > 0 ? "text-red-600 dark:text-red-400" : ""}`}>{item.value}</span>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ComplianceReports() {
    const { t } = useLocale();
    usePageTitle(t("reports.pageTitle", "Compliance Reports"));

    const [selectedModule, setSelectedModule] = useState<ModuleKey>("gaps");
    const [rowSearch, setRowSearch] = useState("");

    const {
        data: summary,
        isLoading: summaryLoading,
        isError: summaryError,
        refetch: refetchSummary,
    } = trpc.complianceReport.summary.useQuery();
    const {
        data: moduleRows = [],
        isLoading: rowsLoading,
        isError: rowsError,
        refetch: refetchRows,
    } = trpc.complianceReport.moduleData.useQuery({ module: selectedModule });

    function handleDownload() {
        if (!moduleRows.length) {
            toast.info(t("reports.noData", "No data to export"));
            return;
        }
        const csv = rowsToCsv(moduleRows as Record<string, unknown>[]);
        const filename = `compliance-${selectedModule}-${new Date().toISOString().slice(0, 10)}.csv`;
        downloadCsv(filename, csv);
        toast.success(t("reports.downloaded", "CSV downloaded"));
    }

    const moduleOptions: { value: ModuleKey; label: string; icon: React.ElementType }[] = [
        { value: "gaps", label: t("reports.module.gaps", "Gap Findings"), icon: ShieldOff },
        { value: "risks", label: t("reports.module.risks", "Risk Register"), icon: AlertTriangle },
        { value: "remediation", label: t("reports.module.remediation", "Remediation"), icon: Wrench },
        { value: "policies", label: t("reports.module.policies", "Policies"), icon: BookOpen },
        { value: "incidents", label: t("reports.module.incidents", "Incidents"), icon: ShieldAlert },
        { value: "audit_schedule", label: t("reports.module.audit_schedule", "Audit Schedule"), icon: ClipboardCheck },
    ];

    // Column headers for each module
    const columnKeys: Record<ModuleKey, string[]> = {
        gaps: ["id", "vendorId", "framework", "control", "title", "severity", "status", "createdAt"],
        risks: ["id", "organizationId", "title", "category", "likelihood", "impact", "score", "treatment", "status", "reviewDate", "createdAt"],
        remediation: ["id", "vendorId", "title", "severity", "status", "assignedToUserId", "dueDate", "createdAt"],
        policies: ["id", "policyCode", "title", "policyType", "status", "version", "reviewCycleMonths", "nextReviewAt", "createdAt"],
        incidents: ["id", "incidentCode", "title", "incidentType", "severity", "status", "occurredAt", "detectedAt", "regulatoryNotificationRequired", "createdAt"],
        audit_schedule: ["id", "title", "auditType", "status", "scheduledDate", "completedDate", "recurrence", "nextOccurrence", "createdAt"],
    };

    const displayRows = useMemo(() => {
        const cols = columnKeys[selectedModule];
        const raw = (moduleRows as Record<string, unknown>[]).map(row =>
            Object.fromEntries(cols.filter(k => k in row).map(k => [k, row[k]]))
        );
        if (!rowSearch.trim()) return raw;
        const q = rowSearch.toLowerCase();
        return raw.filter(row =>
            Object.values(row).some(v => v !== null && v !== undefined && String(v).toLowerCase().includes(q))
        );
    }, [moduleRows, selectedModule, rowSearch]);

    return (
        <div className="djac-page">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-2xl font-bold">{t("reports.title", "Compliance Reports")}</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        {t("reports.subtitle", "Org-wide compliance snapshot and module-level data export")}
                        {summary?.generatedAt && (
                            <span className="ml-2 opacity-60">
                                · {t("reports.asOf", "as of")} {new Date(summary.generatedAt).toLocaleString()}
                            </span>
                        )}
                    </p>
                </div>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => refetchSummary()} disabled={summaryLoading}>
                    <RefreshCw className={`w-4 h-4 ${summaryLoading ? "animate-spin" : ""}`} />
                    {t("reports.refresh", "Refresh")}
                </Button>
            </div>

            {/* Summary grid */}
            {summaryError ? (
                <Card>
                    <CardContent className="py-6 text-center">
                        <p className="text-sm text-muted-foreground">{t("reports.summaryError", "Failed to load the compliance report summary.")}</p>
                        <Button variant="outline" size="sm" className="mt-3 gap-1.5" onClick={() => { void refetchSummary(); }}>
                            <RefreshCw className="w-4 h-4" />
                            {t("reports.retry", "Retry")}
                        </Button>
                    </CardContent>
                </Card>
            ) : summaryLoading ? (
                <p className="text-sm text-muted-foreground py-4 text-center">{t("reports.loading", "Generating report…")}</p>
            ) : summary && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    <SummaryCard
                        icon={Building2} label={t("reports.module.vendors", "Vendors")}
                        total={summary.vendors.total} color="bg-blue-100 dark:bg-blue-950 text-blue-600"
                        items={[{ label: t("reports.total", "Total"), value: summary.vendors.total }]}
                        href={MODULE_HREF.vendors}
                    />
                    <SummaryCard
                        icon={ShieldOff} label={t("reports.module.gaps", "Gap Findings")}
                        total={summary.gaps.total} color="bg-orange-100 dark:bg-orange-950 text-orange-600"
                        items={[
                            { label: t("reports.critical", "Critical"), value: summary.gaps.critical, warn: true },
                            { label: t("reports.high", "High"), value: summary.gaps.high, warn: true },
                        ]}
                        href={MODULE_HREF.gaps}
                        onClick={() => setSelectedModule("gaps")}
                    />
                    <SummaryCard
                        icon={AlertTriangle} label={t("reports.module.risks", "Risk Register")}
                        total={summary.risks.total} color="bg-red-100 dark:bg-red-950 text-red-600"
                        items={[
                            { label: t("reports.open", "Open"), value: summary.risks.open, warn: true },
                            { label: t("reports.critical", "Critical"), value: summary.risks.critical, warn: true },
                        ]}
                        href={MODULE_HREF.risks}
                        onClick={() => setSelectedModule("risks")}
                    />
                    <SummaryCard
                        icon={Wrench} label={t("reports.module.remediation", "Remediation")}
                        total={summary.remediation.total} color="bg-yellow-100 dark:bg-yellow-950 text-yellow-600"
                        items={[
                            { label: t("reports.open", "Open"), value: summary.remediation.open, warn: true },
                            { label: t("reports.resolved", "Resolved"), value: summary.remediation.resolved },
                        ]}
                        href={MODULE_HREF.remediation}
                        onClick={() => setSelectedModule("remediation")}
                    />
                    <SummaryCard
                        icon={BookOpen} label={t("reports.module.policies", "Policies")}
                        total={summary.policies.total} color="bg-purple-100 dark:bg-purple-950 text-purple-600"
                        items={[
                            { label: t("reports.active", "Active"), value: summary.policies.active },
                            { label: t("reports.draft", "Draft"), value: summary.policies.draft },
                        ]}
                        href={MODULE_HREF.policies}
                        onClick={() => setSelectedModule("policies")}
                    />
                    <SummaryCard
                        icon={ShieldAlert} label={t("reports.module.incidents", "Incidents")}
                        total={summary.incidents.total} color="bg-rose-100 dark:bg-rose-950 text-rose-600"
                        items={[
                            { label: t("reports.open", "Open"), value: summary.incidents.open, warn: true },
                            { label: t("reports.critical", "Critical"), value: summary.incidents.critical, warn: true },
                        ]}
                        href={MODULE_HREF.incidents}
                        onClick={() => setSelectedModule("incidents")}
                    />
                    <SummaryCard
                        icon={ClipboardCheck} label={t("reports.module.audit_schedule", "Audit Schedule")}
                        total={summary.auditSchedule.total} color="bg-teal-100 dark:bg-teal-950 text-teal-600"
                        items={[
                            { label: t("reports.upcoming", "Upcoming"), value: summary.auditSchedule.upcoming },
                            { label: t("reports.overdue", "Overdue"), value: summary.auditSchedule.overdue, warn: true },
                            { label: t("reports.completed", "Completed"), value: summary.auditSchedule.completed },
                        ]}
                        href={MODULE_HREF.audit_schedule}
                        onClick={() => setSelectedModule("audit_schedule")}
                    />
                </div>
            )}

            {/* Module data table */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                        <CardTitle className="text-base">{t("reports.moduleData", "Module Data Export")}</CardTitle>
                        <div className="flex items-center gap-2 flex-wrap">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                                <Input
                                    value={rowSearch}
                                    onChange={e => setRowSearch(e.target.value)}
                                    placeholder={t("reports.searchRows", "Search rows…")}
                                    className="h-8 pl-8 text-xs w-44"
                                />
                            </div>
                            <Select value={selectedModule} onValueChange={v => setSelectedModule(v as ModuleKey)}>
                                <SelectTrigger className="w-48">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {moduleOptions.map(opt => (
                                        <SelectItem key={opt.value} value={opt.value}>
                                            <span className="flex items-center gap-2">
                                                <opt.icon className="w-3.5 h-3.5 shrink-0" />
                                                {opt.label}
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button size="sm" className="gap-1.5" onClick={handleDownload} disabled={rowsLoading || moduleRows.length === 0}>
                                <Download className="w-4 h-4" />
                                {t("reports.exportCsv", "Export CSV")}
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="px-0 pb-0">
                    {rowsError ? (
                        <div className="py-8 text-center">
                            <p className="text-sm text-muted-foreground">{t("reports.rowsError", "Failed to load module data.")}</p>
                            <Button variant="outline" size="sm" className="mt-3 gap-1.5" onClick={() => { void refetchRows(); }}>
                                <RefreshCw className="w-4 h-4" />
                                {t("reports.retry", "Retry")}
                            </Button>
                        </div>
                    ) : rowsLoading ? (
                        <p className="text-sm text-muted-foreground py-8 text-center">{t("reports.loading", "Loading data…")}</p>
                    ) : displayRows.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-8 text-center">
                            {rowSearch ? t("reports.noSearchMatch", "No rows match your search.") : t("reports.noData", "No data for this module")}
                        </p>
                    ) : (
                        <div className="overflow-x-auto max-h-96">
                            <table className="w-full text-xs">
                                <thead className="bg-muted/50 sticky top-0">
                                    <tr>
                                        {Object.keys(displayRows[0]).map(col => (
                                            <th key={col} className="text-left font-semibold px-4 py-2 whitespace-nowrap text-muted-foreground">{col}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {displayRows.slice(0, 200).map((row, i) => (
                                        <tr key={i} className="hover:bg-muted/30 transition-colors">
                                            {Object.values(row).map((val, j) => (
                                                <td key={j} className="px-4 py-1.5 whitespace-nowrap max-w-[200px] truncate">
                                                    {val === null || val === undefined ? <span className="text-muted-foreground/50">—</span> : String(val)}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {displayRows.length > 200 ? (
                                <p className="text-xs text-muted-foreground text-center py-3">
                                    {t("reports.truncated", "Showing first 200 rows. Download CSV for full data.")}
                                </p>
                            ) : (
                                <p className="text-xs text-muted-foreground text-center py-2">
                                    {rowSearch
                                        ? `${displayRows.length} / ${moduleRows.length} ${t("reports.rowsMatch", "rows match")}`
                                        : `${displayRows.length} ${t("reports.rowsTotal", "rows")}`}
                                </p>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
