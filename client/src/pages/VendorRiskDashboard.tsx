/**
 * VendorRiskDashboard.tsx
 *
 * Purpose: Read-only risk overview of all registered vendor profiles.
 * Shows KPI cards (tier counts), sortable risk table, jurisdiction chips,
 * and a CTA to register new vendors via ClientWorkspace.
 */

import { useState } from "react";
import type React from "react";
import { Link } from "wouter";
import { formatDate } from "@/lib/intl";
import { toast } from "sonner";
import {
    AlertTriangle,
    ArrowUpDown,
    Bot,
    Building2,
    CheckCircle,
    Download,
    ExternalLink,
    Loader2,
    Plus,
    ShieldAlert,
    ShieldCheck,
    Trash2,
    XCircle,
} from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { sounds } from "@/lib/sounds";
import { trpc } from "@/lib/trpc";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useLocale } from "@/contexts/useLocale";
import { Button } from "@/components/ui/button";
import {
    vendorRiskTierOptions,
    vendorCriticalityLevelOptions,
    type VendorRiskTier,
} from "@shared/vendorProfile";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const RISK_ORDER: Record<string, number> = {
    "tier-1-critical": 4,
    "tier-2-high": 3,
    "tier-3-moderate": 2,
    "tier-4-low": 1,
};

const RISK_COLOR: Record<string, { bg: string; border: string; text: string }> = {
    "tier-1-critical": { bg: "rgba(255,23,68,0.10)", border: "rgba(255,23,68,0.30)", text: "#ff4d6a" },
    "tier-2-high": { bg: "rgba(255,107,43,0.10)", border: "rgba(255,107,43,0.28)", text: "#ff7a38" },
    "tier-3-moderate": { bg: "rgba(255,214,0,0.10)", border: "rgba(255,214,0,0.28)", text: "#e5c000" },
    "tier-4-low": { bg: "rgba(1,255,127,0.08)", border: "rgba(1,255,127,0.22)", text: "#00d46a" },
};

const CRIT_COLOR: Record<string, { bg: string; text: string }> = {
    "mission-critical": { bg: "rgba(255,23,68,0.08)", text: "#ff4d6a" },
    "high": { bg: "rgba(255,107,43,0.08)", text: "#ff7a38" },
    "moderate": { bg: "rgba(255,214,0,0.08)", text: "#e5c000" },
    "low": { bg: "rgba(1,255,127,0.07)", text: "#00d46a" },
};

function getRiskLabel(value: string, locale: string): string {
    const opt = vendorRiskTierOptions.find((o) => o.value === value);
    if (!opt) return value;
    return opt.labels[locale as "en" | "zh" | "ar"] ?? opt.labels.en;
}

function getCritLabel(value: string, locale: string): string {
    const opt = vendorCriticalityLevelOptions.find((o) => o.value === value);
    if (!opt) return value;
    return opt.labels[locale as "en" | "zh" | "ar"] ?? opt.labels.en;
}

function parseChips(val: string | null | undefined): string[] {
    if (!val) return [];
    return val.split(",").map((s) => s.trim()).filter(Boolean);
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
    tier,
    count,
    locale,
}: {
    tier: VendorRiskTier;
    count: number;
    locale: string;
}) {
    const colors = RISK_COLOR[tier] ?? RISK_COLOR["tier-4-low"];
    const label = getRiskLabel(tier, locale);
    return (
        <div
            style={{
                padding: "20px 24px",
                borderRadius: 14,
                border: `1px solid ${colors.border}`,
                background: colors.bg,
                display: "flex",
                flexDirection: "column",
                gap: 8,
                flex: "1 1 180px",
                minWidth: 140,
            }}
        >
            <span style={{ fontSize: 28, fontWeight: 800, color: colors.text, lineHeight: 1 }}>
                {count}
            </span>
            <span style={{ fontSize: 12, color: "var(--djac-muted)", lineHeight: 1.3 }}>
                {label}
            </span>
        </div>
    );
}

// ─── Risk Badge ───────────────────────────────────────────────────────────────

function RiskBadge({ tier, locale }: { tier: string | null; locale: string }) {
    if (!tier) {
        return (
            <span style={{ fontSize: 11, color: "var(--djac-muted)", fontStyle: "italic" }}>
                —
            </span>
        );
    }
    const colors = RISK_COLOR[tier] ?? { bg: "var(--djac-card-hi)", border: "var(--djac-border)", text: "var(--djac-muted)" };
    return (
        <span
            style={{
                display: "inline-block",
                padding: "2px 9px",
                borderRadius: 99,
                fontSize: 11,
                fontWeight: 600,
                background: colors.bg,
                border: `1px solid ${colors.border}`,
                color: colors.text,
                whiteSpace: "nowrap",
            }}
        >
            {getRiskLabel(tier, locale)}
        </span>
    );
}

// ─── Chips ────────────────────────────────────────────────────────────────────

function Chips({ values }: { values: string[] }) {
    if (values.length === 0) return <span style={{ fontSize: 11, color: "var(--djac-muted)", fontStyle: "italic" }}>—</span>;
    const shown = values.slice(0, 3);
    const rest = values.length - shown.length;
    return (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {shown.map((v) => (
                <span
                    key={v}
                    style={{
                        padding: "1px 7px",
                        borderRadius: 99,
                        fontSize: 10,
                        fontWeight: 500,
                        background: "rgba(99,102,241,0.12)",
                        border: "1px solid rgba(99,102,241,0.25)",
                        color: "#a5b4fc",
                        whiteSpace: "nowrap",
                    }}
                >
                    {v}
                </span>
            ))}
            {rest > 0 && (
                <span style={{ fontSize: 10, color: "var(--djac-muted)" }}>+{rest}</span>
            )}
        </div>
    );
}

// ─── Sort State ───────────────────────────────────────────────────────────────

type SortKey = "name" | "risk" | "criticality" | "service" | "date";
type SortDir = "asc" | "desc";

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function VendorRiskDashboard() {
    usePageTitle("Vendor Risk");
    const { t, locale } = useLocale();
    const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({
        key: "risk",
        dir: "desc",
    });
    const [filter, setFilter] = useState<VendorRiskTier | "">("");
    const [jurisFilter, setJurisFilter] = useState<"China" | "Saudi Arabia" | "">("");
    const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
    const [batchOpen, setBatchOpen] = useState(false);
    const [batchSelected, setBatchSelected] = useState<Set<number>>(new Set());
    const [batchRunning, setBatchRunning] = useState(false);
    const [batchResult, setBatchResult] = useState<{
        queued: { vendorId: number; jobId: string }[];
        errors: { vendorId: number; error: string }[];
    } | null>(null);

    const trpcUtils = trpc.useUtils();

    const bulkAssessMutation = trpc.vendor.bulkAssess.useMutation({
        onSuccess: (data) => {
            setBatchRunning(false);
            setBatchResult(data);
            if (data.errors.length === 0) {
                sounds.success();
                toast.success(
                    t("vendorRisk.batchQueued", "Assessments queued") +
                    ` (${data.queued.length})`
                );
            } else {
                sounds.error();
                toast.warning(
                    t("vendorRisk.batchQueued", "Assessments queued") +
                    ` (${data.queued.length}), ` +
                    t("vendorRisk.batchErrorCount", "errors") +
                    `: ${data.errors.length}`
                );
            }
            void trpcUtils.ai.listAssessmentJobs.invalidate().catch(() => undefined);
        },
        onError: (err) => {
            setBatchRunning(false);
            sounds.error();
            toast.error(t("vendorRisk.batchErrorCount", "Batch assessment failed") + ": " + err.message);
        },
    });

    const deleteMutation = trpc.vendor.delete.useMutation({
        onSuccess: () => {
            toast.success(t("vendorDetail.deleteSuccess", "Vendor deleted."));
            void trpcUtils.vendor.list.invalidate();
            void trpcUtils.vendor.gapSummary.invalidate();
            setDeleteTarget(null);
        },
        onError: (err) => {
            toast.error(t("vendorDetail.deleteError", "Failed to delete vendor.") + ": " + err.message);
        },
    });

    const vendorsQuery = trpc.vendor.list.useQuery(undefined, {
        retry: false,
        refetchOnWindowFocus: false,
        staleTime: 60_000,
    });

    const vendors = vendorsQuery.data ?? [];

    // KPI counts
    const tierCounts = {
        "tier-1-critical": vendors.filter((v) => v.riskTier === "tier-1-critical").length,
        "tier-2-high": vendors.filter((v) => v.riskTier === "tier-2-high").length,
        "tier-3-moderate": vendors.filter((v) => v.riskTier === "tier-3-moderate").length,
        "tier-4-low": vendors.filter((v) => v.riskTier === "tier-4-low").length,
    };

    // Filter + sort
    const displayed = [...vendors]
        .filter((v) => (filter ? v.riskTier === filter : true))
        .filter((v) => {
            if (!jurisFilter) return true;
            const j = v.regulatoryJurisdictions ?? "";
            return j.split(",").map((s) => s.trim()).some((jv) => jv === jurisFilter || jv === "Both");
        })
        .sort((a, b) => {
            let cmp = 0;
            if (sort.key === "risk") {
                cmp = (RISK_ORDER[b.riskTier ?? ""] ?? 0) - (RISK_ORDER[a.riskTier ?? ""] ?? 0);
            } else if (sort.key === "name") {
                cmp = (a.vendorName ?? "").localeCompare(b.vendorName ?? "");
            } else if (sort.key === "criticality") {
                const cLevels: Record<string, number> = { "mission-critical": 4, high: 3, moderate: 2, low: 1 };
                cmp = (cLevels[b.criticalityLevel ?? ""] ?? 0) - (cLevels[a.criticalityLevel ?? ""] ?? 0);
            } else if (sort.key === "service") {
                cmp = (a.serviceType ?? "").localeCompare(b.serviceType ?? "");
            } else if (sort.key === "date") {
                cmp = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            }
            return sort.dir === "asc" ? -cmp : cmp;
        });

    function toggleSort(key: SortKey) {
        setSort((prev) =>
            prev.key === key
                ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
                : { key, dir: "desc" },
        );
    }

    // ── CSV Export ────────────────────────────────────────────────────────────
    function handleExportCSV() {
        sounds.click();
        const COMMA = (v: string | null | undefined) =>
            (v ?? "").replace(/"/g, '""');
        const cell = (v: string | null | undefined) => `"${COMMA(v)}"`;
        const header = [
            "Vendor Name",
            "Industry",
            "Risk Tier",
            "Criticality",
            "Service Type",
            "Service Scope",
            "Hosting Environment",
            "Contact Name",
            "Contact Email",
            "Headquarters",
            "Operating Countries",
            "Data Locations",
            "Regulatory Jurisdictions",
            "Certifications",
            "Cloud Providers",
            "Third-Party Dependencies",
            "Fourth-Party Dependencies",
            "Registered Date",
        ].join(",");
        const rows = vendors.map((v) =>
            [
                cell(v.vendorName),
                cell(v.industry),
                cell(v.riskTier),
                cell(v.criticalityLevel),
                cell(v.serviceType),
                cell(v.serviceScope),
                cell(v.hostingEnvironment),
                cell(v.primaryContactName),
                cell(v.primaryContactEmail),
                cell(v.headquartersLocation),
                cell(v.operatingCountries),
                cell(v.dataLocations),
                cell(v.regulatoryJurisdictions),
                cell(v.certifications),
                cell(v.cloudProvider),
                cell(v.thirdPartyDependencies),
                cell(v.fourthPartyDependencies),
                cell(v.createdAt ? new Date(v.createdAt).toISOString().slice(0, 10) : ""),
            ].join(",")
        );
        const csv = [header, ...rows].join("\r\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `vendor-risk-export-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        sounds.success();
    }

    // ── Batch Assess ──────────────────────────────────────────────────────────
    function openBatchDialog() {
        // Pre-select all vendors by default
        setBatchSelected(new Set(vendors.map((v) => v.id)));
        setBatchResult(null);
        setBatchRunning(false);
        setBatchOpen(true);
        sounds.open();
    }

    function toggleBatchVendor(id: number) {
        setBatchSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }

    function handleBatchAssess() {
        const ids = Array.from(batchSelected);
        if (ids.length === 0) return;
        setBatchRunning(true);
        setBatchResult(null);
        sounds.click();
        bulkAssessMutation.mutate({ vendorIds: ids });
    }

    function SortBtn({ col }: { col: SortKey }) {
        const active = sort.key === col;
        return (
            <button
                onClick={() => toggleSort(col)}
                aria-label={`Sort by ${col}`}
                style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "0 0 0 4px",
                    display: "inline-flex",
                    alignItems: "center",
                    color: active ? "#a855f7" : "var(--djac-muted)",
                }}
            >
                <ArrowUpDown size={12} />
            </button>
        );
    }

    const isLoading = vendorsQuery.isLoading;
    const isEmpty = !isLoading && !vendorsQuery.isError && vendors.length === 0;

    return (
        <div className="djac-page">
            {/* Header */}
            <div
                style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    marginBottom: 28,
                    gap: 16,
                    flexWrap: "wrap",
                }}
            >
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4, display: "flex", alignItems: "center", gap: 10 }}>
                        <ShieldAlert size={22} style={{ color: "#a855f7" }} />
                        {t("vendorRisk.title", "Vendor Risk Dashboard")}
                    </h1>
                    <p style={{ fontSize: 14, color: "var(--djac-muted)" }}>
                        {t("vendorRisk.subtitle", "Aggregated risk posture across all registered third-party vendors.")}
                    </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    {vendors.length > 0 && (
                        <>
                            <button
                                onClick={handleExportCSV}
                                disabled={isLoading}
                                title={t("vendorRisk.exportCsv", "Export CSV")}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                    padding: "9px 16px",
                                    borderRadius: 8,
                                    background: "rgba(6,182,212,0.1)",
                                    border: "1px solid rgba(6,182,212,0.3)",
                                    color: "#22d3ee",
                                    fontSize: 13,
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    opacity: isLoading ? 0.5 : 1,
                                }}
                            >
                                <Download size={14} />
                                {t("vendorRisk.exportCsv", "Export CSV")}
                            </button>
                            <button
                                onClick={openBatchDialog}
                                disabled={isLoading}
                                title={t("vendorRisk.assessAll", "Assess All")}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                    padding: "9px 16px",
                                    borderRadius: 8,
                                    background: "rgba(168,85,247,0.12)",
                                    border: "1px solid rgba(168,85,247,0.30)",
                                    color: "#c084fc",
                                    fontSize: 13,
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    opacity: isLoading ? 0.5 : 1,
                                }}
                            >
                                <Bot size={14} />
                                {t("vendorRisk.assessAll", "Assess All")}
                            </button>
                        </>
                    )}
                    <Link href="/client-workspace">
                        <button
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                padding: "9px 16px",
                                borderRadius: 8,
                                background: "linear-gradient(135deg,rgba(168,85,247,0.2),rgba(99,102,241,0.2))",
                                border: "1px solid rgba(168,85,247,0.35)",
                                color: "#c084fc",
                                fontSize: 13,
                                fontWeight: 600,
                                cursor: "pointer",
                            }}
                        >
                            <Plus size={14} />
                            {t("vendorRisk.addVendor", "Register Vendor")}
                        </button>
                    </Link>
                </div>
            </div>

            {/* KPI Cards */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginBottom: 28 }}>
                {(["tier-1-critical", "tier-2-high", "tier-3-moderate", "tier-4-low"] as VendorRiskTier[]).map(
                    (tier) => (
                        <KpiCard key={tier} tier={tier} count={tierCounts[tier]} locale={locale} />
                    ),
                )}
                <div
                    style={{
                        padding: "20px 24px",
                        borderRadius: 14,
                        border: "1px solid var(--djac-border)",
                        background: "var(--djac-card)",
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                        flex: "1 1 180px",
                        minWidth: 140,
                    }}
                >
                    <span style={{ fontSize: 28, fontWeight: 800, color: "var(--djac-text)", lineHeight: 1 }}>
                        {isLoading ? "—" : vendors.length}
                    </span>
                    <span style={{ fontSize: 12, color: "var(--djac-muted)" }}>
                        {t("vendorRisk.totalVendors", "Total Vendors")}
                    </span>
                </div>
            </div>

            {/* Filter bar */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        flexWrap: "wrap",
                    }}
                >
                    <span style={{ fontSize: 12, color: "var(--djac-muted)", minWidth: 68 }}>
                        {t("vendorRisk.filterBy", "Filter:")}
                    </span>
                    <button
                        onClick={() => setFilter("")}
                        style={{
                            padding: "4px 12px",
                            borderRadius: 99,
                            fontSize: 12,
                            fontWeight: filter === "" ? 700 : 400,
                            background: filter === "" ? "rgba(168,85,247,0.18)" : "var(--djac-card)",
                            border: `1px solid ${filter === "" ? "rgba(168,85,247,0.4)" : "var(--djac-border)"}`,
                            color: filter === "" ? "#c084fc" : "var(--djac-muted)",
                            cursor: "pointer",
                        }}
                    >
                        {t("vendorRisk.filterAll", "All")}
                    </button>
                    {(["tier-1-critical", "tier-2-high", "tier-3-moderate", "tier-4-low"] as VendorRiskTier[]).map(
                        (tier) => {
                            const active = filter === tier;
                            const colors = RISK_COLOR[tier];
                            return (
                                <button
                                    key={tier}
                                    onClick={() => setFilter(tier)}
                                    style={{
                                        padding: "4px 12px",
                                        borderRadius: 99,
                                        fontSize: 12,
                                        fontWeight: active ? 700 : 400,
                                        background: active ? colors.bg : "var(--djac-card)",
                                        border: `1px solid ${active ? colors.border : "var(--djac-border)"}`,
                                        color: active ? colors.text : "var(--djac-muted)",
                                        cursor: "pointer",
                                    }}
                                >
                                    {getRiskLabel(tier, locale)}
                                </button>
                            );
                        },
                    )}
                </div>

                {/* Jurisdiction filter row */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 12, color: "var(--djac-muted)", minWidth: 90 }}>
                        {t("vendorRisk.filterJuris", "Jurisdiction:")}
                    </span>
                    {(["", "China", "Saudi Arabia"] as const).map((j) => {
                        const active = jurisFilter === j;
                        const label = j === "" ? t("vendorRisk.filterAll", "All") : j;
                        return (
                            <button
                                key={j || "all-j"}
                                onClick={() => setJurisFilter(j)}
                                style={{
                                    padding: "4px 12px",
                                    borderRadius: 99,
                                    fontSize: 12,
                                    fontWeight: active ? 700 : 400,
                                    background: active ? "rgba(6,182,212,0.15)" : "var(--djac-card)",
                                    border: `1px solid ${active ? "rgba(6,182,212,0.4)" : "var(--djac-border)"}`,
                                    color: active ? "#22d3ee" : "var(--djac-muted)",
                                    cursor: "pointer",
                                }}
                            >
                                {label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Table */}
            <div
                style={{
                    background: "var(--djac-card)",
                    border: "1px solid var(--djac-border)",
                    borderRadius: 14,
                    overflow: "hidden",
                }}
            >
                {isLoading ? (
                    <div>
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div
                                key={i}
                                className="animate-pulse"
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 12,
                                    padding: "14px 20px",
                                    borderBottom: "1px solid var(--djac-border)",
                                }}
                            >
                                <div
                                    style={{
                                        width: 30,
                                        height: 30,
                                        borderRadius: 8,
                                        background: "var(--djac-border)",
                                        flexShrink: 0,
                                    }}
                                />
                                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                                    <div style={{ height: 11, width: "40%", borderRadius: 4, background: "var(--djac-border)" }} />
                                    <div style={{ height: 9, width: "24%", borderRadius: 4, background: "var(--djac-border)" }} />
                                </div>
                                <div style={{ width: 72, height: 20, borderRadius: 99, background: "var(--djac-border)" }} />
                                <div style={{ width: 48, height: 18, borderRadius: 4, background: "var(--djac-border)" }} />
                            </div>
                        ))}
                    </div>
                ) : isEmpty ? (
                    <div style={{ padding: 64, textAlign: "center" }}>
                        <Building2
                            size={40}
                            style={{ color: "rgba(168,85,247,0.3)", marginBottom: 16 }}
                        />
                        <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>
                            {t("vendorRisk.emptyTitle", "No vendors registered yet")}
                        </p>
                        <p style={{ fontSize: 13, color: "var(--djac-muted)", marginBottom: 24 }}>
                            {t(
                                "vendorRisk.emptyDesc",
                                "Register your first third-party vendor to begin building your risk inventory.",
                            )}
                        </p>
                        <Link href="/client-workspace">
                            <button
                                style={{
                                    padding: "10px 20px",
                                    borderRadius: 8,
                                    background: "linear-gradient(135deg,#a855f7,#6366f1)",
                                    border: "none",
                                    color: "#fff",
                                    fontSize: 13,
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 6,
                                }}
                            >
                                <Plus size={14} />
                                {t("vendorRisk.addVendor", "Register Vendor")}
                            </button>
                        </Link>
                    </div>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                            <thead>
                                <tr
                                    style={{
                                        borderBottom: "1px solid var(--djac-border)",
                                        background: "var(--djac-card-hi)",
                                    }}
                                >
                                    {[
                                        { key: "name" as SortKey, label: t("vendorRisk.colName", "Vendor") },
                                        { key: "service" as SortKey, label: t("vendorRisk.colService", "Service") },
                                        { key: "risk" as SortKey, label: t("vendorRisk.colRisk", "Risk Tier") },
                                        { key: "criticality" as SortKey, label: t("vendorRisk.colCriticality", "Criticality") },
                                        null,
                                        { key: "date" as SortKey, label: t("vendorRisk.colAdded", "Added") },
                                        null,
                                    ].map((col, i) => {
                                        if (col === null) {
                                            const headers = [
                                                t("vendorRisk.colJurisdiction", "Jurisdictions"),
                                                t("vendorRisk.colActions", ""),
                                            ];
                                            const hIdx = i === 4 ? 0 : 1;
                                            return (
                                                <th
                                                    key={i}
                                                    style={{
                                                        padding: "12px 16px",
                                                        textAlign: "start",
                                                        fontWeight: 500,
                                                        fontSize: 11,
                                                        color: "var(--djac-muted)",
                                                        letterSpacing: "0.04em",
                                                        textTransform: "uppercase",
                                                    }}
                                                >
                                                    {headers[hIdx]}
                                                </th>
                                            );
                                        }
                                        return (
                                            <th
                                                key={col.key}
                                                style={{
                                                    padding: "12px 16px",
                                                    textAlign: "start",
                                                    fontWeight: 500,
                                                    fontSize: 11,
                                                    color: "var(--djac-muted)",
                                                    letterSpacing: "0.04em",
                                                    textTransform: "uppercase",
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                {col.label}
                                                <SortBtn col={col.key} />
                                            </th>
                                        );
                                    })}
                                </tr>
                            </thead>
                            <tbody>
                                {displayed.map((vendor, idx) => {
                                    const jurisdictions = parseChips(vendor.regulatoryJurisdictions);
                                    const critColors = CRIT_COLOR[vendor.criticalityLevel ?? ""] ?? {
                                        bg: "var(--djac-card-hi)",
                                        text: "var(--djac-muted)",
                                    };
                                    return (
                                        <tr
                                            key={vendor.id}
                                            className="djac-row-hover"
                                            style={{
                                                borderBottom:
                                                    idx < displayed.length - 1
                                                        ? "1px solid var(--djac-border)"
                                                        : "none",
                                            }}
                                        >
                                            {/* Name */}
                                            <td style={{ padding: "12px 16px", fontWeight: 600 }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                    <div
                                                        style={{
                                                            width: 30,
                                                            height: 30,
                                                            borderRadius: 8,
                                                            background: "rgba(168,85,247,0.15)",
                                                            border: "1px solid rgba(168,85,247,0.25)",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            fontSize: 12,
                                                            fontWeight: 700,
                                                            color: "#c084fc",
                                                            flexShrink: 0,
                                                        }}
                                                    >
                                                        {(vendor.vendorName ?? "?").charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div style={{ maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                            {vendor.vendorName}
                                                        </div>
                                                        {vendor.headquartersLocation && (
                                                            <div style={{ fontSize: 11, color: "var(--djac-muted)", marginTop: 1 }}>
                                                                {vendor.headquartersLocation}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Service */}
                                            <td style={{ padding: "12px 16px", color: "var(--djac-muted)" }}>
                                                {vendor.serviceType ?? (
                                                    <span style={{ fontStyle: "italic", opacity: 0.4 }}>—</span>
                                                )}
                                            </td>

                                            {/* Risk Tier */}
                                            <td style={{ padding: "12px 16px" }}>
                                                <RiskBadge tier={vendor.riskTier} locale={locale} />
                                            </td>

                                            {/* Criticality */}
                                            <td style={{ padding: "12px 16px" }}>
                                                {vendor.criticalityLevel ? (
                                                    <span
                                                        style={{
                                                            display: "inline-block",
                                                            padding: "2px 9px",
                                                            borderRadius: 99,
                                                            fontSize: 11,
                                                            fontWeight: 600,
                                                            background: critColors.bg,
                                                            color: critColors.text,
                                                            whiteSpace: "nowrap",
                                                        }}
                                                    >
                                                        {getCritLabel(vendor.criticalityLevel, locale)}
                                                    </span>
                                                ) : (
                                                    <span style={{ fontSize: 11, opacity: 0.3, fontStyle: "italic" }}>—</span>
                                                )}
                                            </td>

                                            {/* Jurisdictions */}
                                            <td style={{ padding: "12px 16px" }}>
                                                <Chips values={jurisdictions} />
                                            </td>

                                            {/* Date */}
                                            <td
                                                style={{
                                                    padding: "12px 16px",
                                                    fontSize: 11,
                                                    color: "var(--djac-muted)",
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                {formatDate(vendor.createdAt, locale)}
                                            </td>

                                            {/* Actions */}
                                            <td style={{ padding: "12px 16px" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                                    <Link href={`/vendor/${vendor.id}`}>
                                                        <button
                                                            title={t("vendorRisk.viewDetails", "View Detail")}
                                                            style={{
                                                                background: "none",
                                                                border: "none",
                                                                cursor: "pointer",
                                                                color: "rgba(168,85,247,0.6)",
                                                                padding: 4,
                                                                borderRadius: 6,
                                                                display: "inline-flex",
                                                                alignItems: "center",
                                                            }}
                                                        >
                                                            <ExternalLink size={14} />
                                                        </button>
                                                    </Link>
                                                    <button
                                                        title={t("vendorDetail.deleteVendor", "Delete")}
                                                        onClick={() => setDeleteTarget({ id: vendor.id, name: vendor.vendorName })}
                                                        style={{
                                                            background: "none",
                                                            border: "none",
                                                            cursor: "pointer",
                                                            color: "rgba(248,113,113,0.6)",
                                                            padding: 4,
                                                            borderRadius: 6,
                                                            display: "inline-flex",
                                                            alignItems: "center",
                                                        }}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Footer hint */}
            {!isEmpty && !isLoading && (
                <p style={{ marginTop: 12, fontSize: 11, color: "var(--djac-muted)", opacity: 0.75, textAlign: "end" }}>
                    {displayed.length} {t("vendorRisk.rowsOf", "of")} {vendors.length}{" "}
                    {t("vendorRisk.vendors", "vendors")}
                </p>
            )}

            {vendorsQuery.isError && (
                <div
                    role="alert"
                    style={{
                        marginTop: 16,
                        padding: "12px 16px",
                        borderRadius: 10,
                        background: "rgba(248,113,113,0.08)",
                        border: "1px solid rgba(248,113,113,0.2)",
                        fontSize: 13,
                        color: "#f87171",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 8,
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <AlertTriangle size={15} />
                        {vendorsQuery.error?.message ?? t("vendorRisk.error", "Failed to load vendors.")}
                    </div>
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { void vendorsQuery.refetch(); }}>
                        {t("common.retry", "Retry")}
                    </Button>
                </div>
            )}

            {/* ── Delete Confirm Dialog ──────────────────────────────── */}
            <AlertDialog open={!!deleteTarget} onOpenChange={open => { if (!open) setDeleteTarget(null); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("vendorDetail.deleteTitle", "Delete Vendor?")}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t("vendorDetail.deleteDesc", "This will permanently remove the vendor and all assessment data. This cannot be undone.")}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t("common.cancel", "Cancel")}</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => deleteTarget && deleteMutation.mutate({ vendorId: deleteTarget.id })}
                            disabled={deleteMutation.isPending}
                        >
                            {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            {t("vendorDetail.deleteConfirm", "Yes, Delete")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* ── Batch Assess Dialog ───────────────────────────────── */}
            <Dialog
                open={batchOpen}
                onOpenChange={(open) => {
                    if (!open) { sounds.close(); setBatchOpen(false); }
                }}
            >
                <DialogContent style={{ maxWidth: 520 }}>
                    <DialogHeader>
                        <DialogTitle style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <Bot size={18} style={{ color: "#a855f7" }} />
                            {t("vendorRisk.batchTitle", "Batch AI Assessment")}
                        </DialogTitle>
                    </DialogHeader>

                    <p style={{ fontSize: 13, color: "var(--djac-muted)", margin: "4px 0 12px" }}>
                        {t(
                            "vendorRisk.batchDesc",
                            "Select vendors to queue for AI compliance assessment. Each assessment runs in the background."
                        )}
                    </p>

                    {/* Vendor checklist */}
                    <div
                        style={{
                            maxHeight: 280,
                            overflowY: "auto",
                            display: "flex",
                            flexDirection: "column",
                            gap: 4,
                            border: "1px solid var(--djac-border)",
                            borderRadius: 10,
                            padding: "8px 0",
                        }}
                    >
                        {/* Select / Deselect all */}
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                padding: "4px 14px 8px",
                                borderBottom: "1px solid var(--djac-border)",
                                marginBottom: 4,
                            }}
                        >
                            <button
                                onClick={() => setBatchSelected(new Set(vendors.map((v) => v.id)))}
                                style={{ fontSize: 12, color: "#a855f7", background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 600 }}
                            >
                                {t("vendorRisk.selectAll", "Select All")}
                            </button>
                            <span style={{ fontSize: 12, color: "var(--djac-muted)" }}>·</span>
                            <button
                                onClick={() => setBatchSelected(new Set())}
                                style={{ fontSize: 12, color: "var(--djac-muted)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                            >
                                {t("vendorRisk.deselectAll", "Deselect All")}
                            </button>
                            <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--djac-muted)" }}>
                                {batchSelected.size}/{vendors.length} {t("vendorRisk.vendors", "vendors")}
                            </span>
                        </div>
                        {vendors.map((v) => {
                            const checked = batchSelected.has(v.id);
                            const rColors = RISK_COLOR[v.riskTier ?? ""] ?? RISK_COLOR["tier-4-low"];
                            return (
                                <label
                                    key={v.id}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 10,
                                        padding: "6px 14px",
                                        cursor: "pointer",
                                        borderRadius: 6,
                                        background: checked ? "rgba(168,85,247,0.06)" : "transparent",
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => toggleBatchVendor(v.id)}
                                        style={{ accentColor: "#a855f7", width: 14, height: 14, flexShrink: 0 }}
                                    />
                                    <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>
                                        {v.vendorName}
                                    </span>
                                    <span
                                        style={{
                                            fontSize: 10,
                                            fontWeight: 600,
                                            padding: "1px 7px",
                                            borderRadius: 99,
                                            background: rColors.bg,
                                            border: `1px solid ${rColors.border}`,
                                            color: rColors.text,
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {getRiskLabel(v.riskTier ?? "", locale)}
                                    </span>
                                </label>
                            );
                        })}
                    </div>

                    {/* Result panel (shown after mutation completes) */}
                    {batchResult && (
                        <div
                            style={{
                                marginTop: 12,
                                padding: "10px 14px",
                                borderRadius: 10,
                                background: batchResult.errors.length > 0
                                    ? "rgba(251,191,36,0.08)"
                                    : "rgba(1,255,127,0.07)",
                                border: `1px solid ${batchResult.errors.length > 0 ? "rgba(251,191,36,0.25)" : "rgba(1,255,127,0.20)"}`,
                                fontSize: 13,
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 600, marginBottom: 4 }}>
                                <CheckCircle size={14} style={{ color: "#4ade80" }} />
                                {batchResult.queued.length} {t("vendorRisk.batchQueued", "assessments queued")}
                                {batchResult.errors.length > 0 && (
                                    <>
                                        <span> · </span>
                                        <XCircle size={14} style={{ color: "#f87171" }} />
                                        {batchResult.errors.length} {t("vendorRisk.batchErrorCount", "errors")}
                                    </>
                                )}
                            </div>
                            {batchResult.errors.map((e) => {
                                const name = vendors.find((v) => v.id === e.vendorId)?.vendorName ?? `#${e.vendorId}`;
                                return (
                                    <div key={e.vendorId} style={{ fontSize: 12, color: "#f87171", marginTop: 2 }}>
                                        {name}: {e.error}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <DialogFooter style={{ marginTop: 16 }}>
                        <button
                            onClick={() => { sounds.close(); setBatchOpen(false); }}
                            style={{
                                padding: "8px 16px",
                                borderRadius: 8,
                                background: "var(--djac-card)",
                                border: "1px solid var(--djac-border)",
                                color: "var(--djac-muted)",
                                fontSize: 13,
                                fontWeight: 600,
                                cursor: "pointer",
                            }}
                        >
                            {t("common.cancel", "Cancel")}
                        </button>
                        <button
                            onClick={handleBatchAssess}
                            disabled={batchRunning || batchSelected.size === 0}
                            style={{
                                padding: "8px 20px",
                                borderRadius: 8,
                                background: "linear-gradient(135deg,#a855f7,#6366f1)",
                                border: "none",
                                color: "#fff",
                                fontSize: 13,
                                fontWeight: 700,
                                cursor: batchRunning || batchSelected.size === 0 ? "not-allowed" : "pointer",
                                opacity: batchRunning || batchSelected.size === 0 ? 0.6 : 1,
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                            }}
                        >
                            {batchRunning
                                ? <><Loader2 size={14} className="animate-spin" /> {t("vendorRisk.batchRunning", "Queueing…")}</>
                                : <><Bot size={14} /> {t("vendorRisk.batchConfirm", "Queue Assessments")}</>
                            }
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
