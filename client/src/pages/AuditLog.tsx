/**
 * Audit Log Viewer  —  /audit-log  (admin-only)
 *
 * Reads assessment-events.log via admin.auditLog tRPC procedure.
 * Features:
 *  - Auto-refresh (30s)
 *  - Filter by action type and user ID
 *  - Expandable payload viewer
 *  - Badge colour per action category (auth/vendor/org/billing/data)
 */
import { useState, useMemo } from "react";
import type React from "react";
import { trpc } from "@/lib/trpc";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useLocale } from "@/contexts/useLocale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Activity,
    AlertTriangle,
    ChevronDown,
    ChevronRight,
    Download,
    Loader2,
    RefreshCw,
    Shield,
} from "lucide-react";

// ─── Action category badge mapping ───────────────────────────────────────────

type BadgeVariant = "default" | "outline" | "secondary" | "destructive";

const ACTION_BADGE: Record<string, { label: string; cls: string }> = {
    // Auth
    user_login: { label: "Auth", cls: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300 border-sky-300" },
    user_logout: { label: "Auth", cls: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300 border-sky-300" },
    user_registered: { label: "Auth", cls: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300 border-sky-300" },
    password_reset_requested: { label: "Auth", cls: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-300" },
    password_reset_completed: { label: "Auth", cls: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-300" },
    password_changed: { label: "Auth", cls: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-300" },
    "2fa_enabled": { label: "2FA", cls: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-300" },
    "2fa_disabled": { label: "2FA", cls: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-300" },
    // Vendor
    vendor_created: { label: "Vendor", cls: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300 border-violet-300" },
    vendor_updated: { label: "Vendor", cls: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300 border-violet-300" },
    vendor_deleted: { label: "Vendor", cls: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-300" },
    vendor_assessed: { label: "Assess", cls: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 border-indigo-300" },
    assessment_report_exported: { label: "Export", cls: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-300" },
    bulk_assessment_started: { label: "Assess", cls: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 border-indigo-300" },
    // Org
    org_created: { label: "Org", cls: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-300" },
    org_settings_updated: { label: "Org", cls: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-300" },
    user_role_changed: { label: "RBAC", cls: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border-orange-300" },
    user_invited: { label: "Invite", cls: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300 border-cyan-300" },
    user_removed: { label: "RBAC", cls: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-300" },
    // Billing
    subscription_created: { label: "Billing", cls: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-300" },
    subscription_updated: { label: "Billing", cls: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-300" },
    subscription_cancelled: { label: "Billing", cls: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-300" },
    trial_started: { label: "Billing", cls: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300 border-teal-300" },
    // Data
    report_downloaded: { label: "Data", cls: "bg-slate-100 text-slate-800 dark:bg-slate-800/30 dark:text-slate-300 border-slate-300" },
    compliance_data_exported: { label: "Data", cls: "bg-slate-100 text-slate-800 dark:bg-slate-800/30 dark:text-slate-300 border-slate-300" },
    // API Key
    api_key_created: { label: "API Key", cls: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300 border-cyan-300" },
    api_key_revoked: { label: "API Key", cls: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-300" },
    // ── Dot-notation aliases (post audit-log migration) ───────────────────────
    "user.login": { label: "Auth", cls: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300 border-sky-300" },
    "user.logout": { label: "Auth", cls: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300 border-sky-300" },
    "user.register": { label: "Auth", cls: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300 border-sky-300" },
    "user.role.change": { label: "RBAC", cls: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border-orange-300" },
    "user.remove": { label: "RBAC", cls: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-300" },
    "user.invite": { label: "Invite", cls: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300 border-cyan-300" },
    "password.change": { label: "Auth", cls: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-300" },
    "password.reset.request": { label: "Auth", cls: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-300" },
    "password.reset.complete": { label: "Auth", cls: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-300" },
    "2fa.enable": { label: "2FA", cls: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-300" },
    "2fa.disable": { label: "2FA", cls: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-300" },
    "vendor.create": { label: "Vendor", cls: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300 border-violet-300" },
    "vendor.assess": { label: "Assess", cls: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 border-indigo-300" },
    "report.export.assessment": { label: "Export", cls: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-300" },
    "api_key.create": { label: "API Key", cls: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300 border-cyan-300" },
    "api_key.revoke": { label: "API Key", cls: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-300" },
};

const ACTION_OPTIONS = [
    "user_login", "user_logout", "user_registered", "password_reset_requested",
    "password_reset_completed", "password_changed", "2fa_enabled", "2fa_disabled",
    "vendor_created", "vendor_updated", "vendor_deleted", "vendor_assessed",
    "assessment_report_exported", "bulk_assessment_started",
    "org_created", "org_settings_updated", "user_role_changed", "user_invited", "user_removed",
    "subscription_created", "subscription_updated", "subscription_cancelled", "trial_started",
    "report_downloaded", "compliance_data_exported",
    "api_key_created", "api_key_revoked",
    // dot-notation (post-migration)
    "user.login", "user.logout", "user.register",
    "user.role.change", "user.remove", "user.invite",
    "password.change", "password.reset.request", "password.reset.complete",
    "2fa.enable", "2fa.disable",
    "vendor.create", "vendor.assess",
    "report.export.assessment",
    "api_key.create", "api_key.revoke",
] as const;

function fmtDate(iso: string): string {
    try {
        const d = new Date(iso);
        return d.toLocaleString(undefined, {
            year: "numeric", month: "short", day: "numeric",
            hour: "2-digit", minute: "2-digit", second: "2-digit",
        });
    } catch {
        return iso;
    }
}

// ─── Category constants + CSV helpers ────────────────────────────────────────────────

const CATEGORY_OPTIONS = [...new Set(Object.values(ACTION_BADGE).map(v => v.label))].sort();

function auditToCsv(rows: Array<{ eventId: string; timestamp: string; userId: number | null; action: string; targetId?: string | number | null; payload: Record<string, unknown> }>): string {
    if (!rows.length) return "";
    const header = "eventId,timestamp,userId,category,action,targetId,payload";
    const body = rows.map(r => [
        r.eventId,
        r.timestamp,
        r.userId ?? "",
        ACTION_BADGE[r.action]?.label ?? "Other",
        r.action,
        r.targetId ?? "",
        `"${JSON.stringify(r.payload).replace(/"/g, '""')}"`,
    ].join(","));
    return [header, ...body].join("\n");
}

function downloadCsv(filename: string, content: string) {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
}

// ─── Payload expandable row ───────────────────────────────────────────────────

function PayloadCell({ payload }: { payload: Record<string, unknown> }) {
    const [open, setOpen] = useState(false);
    const keys = Object.keys(payload);
    if (keys.length === 0) return <span className="text-muted-foreground text-xs">—</span>;
    return (
        <div>
            <button
                type="button"
                className="flex items-center gap-1 text-xs text-primary hover:underline"
                onClick={() => setOpen(v => !v)}
            >
                {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                {open ? "Hide" : `Show ${keys.length} field${keys.length > 1 ? "s" : ""}`}
            </button>
            {open && (
                <pre className="mt-2 text-xs bg-muted/60 border border-border rounded-md p-3 overflow-x-auto max-w-sm whitespace-pre-wrap break-all">
                    {JSON.stringify(payload, null, 2)}
                </pre>
            )}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AuditLog() {
    const { t } = useLocale();
    usePageTitle("Audit Log");

    const [filterAction, setFilterAction] = useState<string>("");
    const [filterUserIdRaw, setFilterUserIdRaw] = useState<string>("");
    const [limitRaw, setLimitRaw] = useState<string>("100");
    const [filterCategory, setFilterCategory] = useState<string>("");

    const limit = Math.min(Math.max(parseInt(limitRaw || "100", 10) || 100, 1), 500);
    const userId = parseInt(filterUserIdRaw, 10) || undefined;

    const query = trpc.admin.auditLog.useQuery(
        {
            limit,
            action: filterAction || undefined,
            userId,
        },
        {
            refetchInterval: 30_000,
            refetchOnWindowFocus: false,
        }
    );

    const events = query.data ?? [];

    const filteredEvents = useMemo(() => {
        if (!filterCategory) return events;
        return events.filter(ev => (ACTION_BADGE[ev.action]?.label ?? "Other") === filterCategory);
    }, [events, filterCategory]);

    const categoryCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        for (const ev of events) {
            const cat = ACTION_BADGE[ev.action]?.label ?? "Other";
            counts[cat] = (counts[cat] ?? 0) + 1;
        }
        return counts;
    }, [events]);

    return (
        <div className="djac-page">

            {/* ── Header ──────────────────────────────────────────────── */}
            <div className="djac-page-header">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary">
                        <Activity size={22} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            {t("auditLog.title", "Audit Log")}
                        </h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            {t("auditLog.subtitle", "Immutable record of platform security and data events.")}
                        </p>
                    </div>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 shrink-0"
                    onClick={() => void query.refetch()}
                    disabled={query.isFetching}
                >
                    <RefreshCw size={14} className={query.isFetching ? "animate-spin" : ""} />
                    {t("auditLog.refresh", "Refresh")}
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 shrink-0"
                    disabled={filteredEvents.length === 0}
                    onClick={() => downloadCsv(`audit-log-${new Date().toISOString().slice(0, 10)}.csv`, auditToCsv(filteredEvents))}
                >
                    <Download size={14} />
                    {t("auditLog.exportCsv", "Export CSV")}
                </Button>
            </div>

            {/* ── Filters ─────────────────────────────────────────────── */}
            <Card className="border-border bg-card/60">
                <CardContent className="pt-5 pb-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* Action filter */}
                        <div className="space-y-1.5">
                            <Label className="text-xs">{t("auditLog.filterAction", "Action")}</Label>
                            <Select value={filterAction} onValueChange={setFilterAction}>
                                <SelectTrigger className="h-8 text-xs">
                                    <SelectValue placeholder={t("auditLog.allActions", "All actions")} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">{t("auditLog.allActions", "All actions")}</SelectItem>
                                    {ACTION_OPTIONS.map(a => (
                                        <SelectItem key={a} value={a} className="text-xs">
                                            {a}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* User ID filter */}
                        <div className="space-y-1.5">
                            <Label className="text-xs">{t("auditLog.filterUserId", "User ID")}</Label>
                            <Input
                                type="number"
                                className="h-8 text-xs"
                                placeholder={t("auditLog.filterUserIdPlaceholder", "e.g. 42")}
                                value={filterUserIdRaw}
                                onChange={e => setFilterUserIdRaw(e.target.value)}
                            />
                        </div>

                        {/* Limit */}
                        <div className="space-y-1.5">
                            <Label className="text-xs">{t("auditLog.filterLimit", "Max rows")}</Label>
                            <Input
                                type="number"
                                className="h-8 text-xs"
                                min={1}
                                max={500}
                                value={limitRaw}
                                onChange={e => setLimitRaw(e.target.value)}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Category pills */}
            {events.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    <button
                        onClick={() => setFilterCategory("")}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${filterCategory === "" ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-foreground/40"
                            }`}
                    >
                        All ({events.length})
                    </button>
                    {CATEGORY_OPTIONS.filter(cat => categoryCounts[cat]).map(cat => (
                        <button
                            key={cat}
                            onClick={() => setFilterCategory(prev => prev === cat ? "" : cat)}
                            className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${filterCategory === cat ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-foreground/40"
                                }`}
                        >
                            {cat} ({categoryCounts[cat] ?? 0})
                        </button>
                    ))}
                </div>
            )}

            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                {query.isLoading ? (
                    <Loader2 size={14} className="animate-spin" />
                ) : (
                    <>
                        <Shield size={14} className="text-primary" />
                        <span>
                            {filteredEvents.length === 0
                                ? (events.length > 0
                                    ? t("auditLog.noFilterMatch", "No events match the selected category.")
                                    : t("auditLog.noEvents", "No audit events recorded yet."))
                                : `${filteredEvents.length}${filterCategory ? ` / ${events.length}` : ""} event${filteredEvents.length !== 1 ? "s" : ""}${filterCategory ? ` in "${filterCategory}"` : " (newest first)"}`}
                        </span>
                        {query.dataUpdatedAt > 0 && (
                            <span className="ml-auto text-xs">
                                {t("auditLog.lastRefreshed", "Last refreshed:")} {new Date(query.dataUpdatedAt).toLocaleTimeString()}
                            </span>
                        )}
                    </>
                )}
            </div>

            {/* ── Error state ─────────────────────────────────────────── */}
            {query.error && (
                <Card className="border-destructive/50 bg-destructive/5">
                    <CardContent className="pt-5 pb-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <AlertTriangle size={16} className="text-destructive shrink-0" />
                            <p className="text-sm text-destructive">{query.error.message}</p>
                        </div>
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => {
                                void query.refetch();
                            }}
                        >
                            {t("common.retry", "Retry")}
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* ── Table ───────────────────────────────────────────────── */}
            {!query.isLoading && filteredEvents.length > 0 && (
                <Card className="border-border bg-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/40 hover:bg-muted/40">
                                    <TableHead className="text-xs w-48">{t("auditLog.colTimestamp", "Timestamp")}</TableHead>
                                    <TableHead className="text-xs w-20">{t("auditLog.colUserId", "User")}</TableHead>
                                    <TableHead className="text-xs w-24">{t("auditLog.colCategory", "Category")}</TableHead>
                                    <TableHead className="text-xs">{t("auditLog.colAction", "Action")}</TableHead>
                                    <TableHead className="text-xs w-20">{t("auditLog.colTargetId", "Target")}</TableHead>
                                    <TableHead className="text-xs">{t("auditLog.colPayload", "Payload")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredEvents.map(ev => {
                                    const badge = ACTION_BADGE[ev.action];
                                    return (
                                        <TableRow key={ev.eventId} className="hover:bg-muted/20">
                                            <TableCell className="text-xs text-muted-foreground font-mono whitespace-nowrap">
                                                {fmtDate(ev.timestamp)}
                                            </TableCell>
                                            <TableCell className="text-xs font-mono text-foreground">
                                                #{ev.userId}
                                            </TableCell>
                                            <TableCell>
                                                {badge ? (
                                                    <Badge
                                                        variant="outline"
                                                        className={`text-[10px] px-2 py-0.5 font-semibold rounded-full ${badge.cls}`}
                                                    >
                                                        {badge.label}
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-[10px] px-2 py-0.5 rounded-full">
                                                        Other
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-xs font-mono text-foreground">
                                                {ev.action}
                                            </TableCell>
                                            <TableCell className="text-xs font-mono text-muted-foreground">
                                                {ev.targetId || "—"}
                                            </TableCell>
                                            <TableCell>
                                                <PayloadCell payload={ev.payload} />
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </Card>
            )}

            {/* ── Empty state ─────────────────────────────────────────── */}
            {!query.isLoading && !query.error && events.length === 0 && (
                <Card className="border-border bg-card/60">
                    <CardContent className="pt-12 pb-12 flex flex-col items-center gap-3 text-center">
                        <div className="p-3 rounded-2xl bg-muted">
                            <Activity size={28} className="text-muted-foreground" />
                        </div>
                        <p className="font-semibold text-foreground">{t("auditLog.emptyTitle", "No audit events yet")}</p>
                        <p className="text-sm text-muted-foreground max-w-sm">
                            {t("auditLog.emptyDesc", "Audit events are written when users perform vendor assessments, export reports, change roles, manage invites, and other security-relevant actions.")}
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
