/**
 * IncidentRegister.tsx — Phase 32
 *
 * Compliance Incident Register — record, investigate, and close data breaches,
 * policy violations, system outages, and third-party incidents.
 *
 * Features:
 *   • 5-stage lifecycle: open → under_investigation → contained → resolved → closed
 *   • 4 severity levels: critical / high / medium / low
 *   • 6 incident types with type badge
 *   • Regulatory notification countdown (PIPL / GDPR 72 h default) — red alert
 *     when notification is required, not yet sent, and deadline is approaching
 *   • Affected framework tags, data type chips, data-subject count
 *   • Filter by severity, status, type; full-text search
 *   • Stat cards: Total / Open / Critical / Overdue Notification
 *   • Create / Edit dialog with 16 fields
 *   • "Mark as Notified" one-click action
 *   • Delete with confirmation
 */

import { useState, useMemo } from "react";
import type React from "react";
import { trpc } from "@/lib/trpc";
import { useLocale } from "@/contexts/useLocale";
import { usePageTitle } from "@/hooks/usePageTitle";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { QueryErrorPanel } from "@/components/ui/query-error-panel";
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
import { Textarea } from "@/components/ui/textarea";
import {
    AlertTriangle,
    Bell,
    BellOff,
    CheckCircle2,
    Pencil,
    Plus,
    ShieldAlert,
    Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { sounds } from "@/lib/sounds";

// ─── Constants ────────────────────────────────────────────────────────────────

const INCIDENT_TYPES = ["data_breach", "unauthorized_access", "policy_violation", "system_outage", "third_party_breach", "other"] as const;
const SEVERITIES = ["critical", "high", "medium", "low"] as const;
const STATUSES = ["open", "under_investigation", "contained", "resolved", "closed"] as const;
const FRAMEWORKS = ["PIPL", "CSL", "DSL", "PDPL", "NCA ECC", "NCA CSCC", "ISO27001", "GDPR"] as const;
const DATA_TYPES = ["Personal names", "Email addresses", "Phone numbers", "Financial data", "Health data", "Biometric data", "Location data", "Government IDs"] as const;

type IncidentType = typeof INCIDENT_TYPES[number];
type Severity = typeof SEVERITIES[number];
type IncidentStatus = typeof STATUSES[number];

const STATUS_TRANSITIONS: Record<IncidentStatus, IncidentStatus[]> = {
    open: ["under_investigation", "contained", "closed"],
    under_investigation: ["contained", "resolved", "closed"],
    contained: ["resolved", "under_investigation", "closed"],
    resolved: ["closed", "under_investigation"],
    closed: [],
};

// ─── Colour helpers ──────────────────────────────────────────────────────────

const SEVERITY_COLORS: Record<Severity, { border: string; bg: string; text: string }> = {
    critical: { border: "border-l-red-500", bg: "bg-red-100 dark:bg-red-950", text: "text-red-700 dark:text-red-300" },
    high: { border: "border-l-orange-500", bg: "bg-orange-100 dark:bg-orange-950", text: "text-orange-700 dark:text-orange-300" },
    medium: { border: "border-l-yellow-500", bg: "bg-yellow-100 dark:bg-yellow-950", text: "text-yellow-700 dark:text-yellow-300" },
    low: { border: "border-l-green-500", bg: "bg-green-100 dark:bg-green-950", text: "text-green-700 dark:text-green-300" },
};

const STATUS_COLORS: Record<IncidentStatus, string> = {
    open: "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300",
    under_investigation: "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300",
    contained: "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300",
    resolved: "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300",
    closed: "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400",
};

// ─── Utility ─────────────────────────────────────────────────────────────────

function parseJsonArray(v: string | null | undefined): string[] {
    if (!v) return [];
    try { return JSON.parse(v) as string[]; }
    catch { return []; }
}

function formatDate(d: Date | string | null | undefined): string {
    if (!d) return "—";
    const date = new Date(d);
    return isNaN(date.getTime()) ? "—" : date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

/** Hours elapsed since a given date (negative = future) */
function hoursElapsed(from: Date | string | null | undefined): number | null {
    if (!from) return null;
    const d = new Date(from);
    return isNaN(d.getTime()) ? null : (Date.now() - d.getTime()) / 3_600_000;
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({ label, value, alert }: { label: string; value: number | string; alert?: boolean }) {
    return (
        <Card className="flex-1 min-w-[110px]">
            <CardContent className="pt-4 pb-3 px-4">
                <p className="text-xs text-muted-foreground truncate">{label}</p>
                <p className={`text-2xl font-bold mt-1 ${alert ? "text-red-600 dark:text-red-400" : ""}`}>{value}</p>
            </CardContent>
        </Card>
    );
}

// ─── Shared badge helpers ─────────────────────────────────────────────────────

function SeverityBadge({ severity, label }: { severity: Severity; label: string }) {
    const col = SEVERITY_COLORS[severity];
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${col.bg} ${col.text}`}>
            <AlertTriangle size={11} />
            {label}
        </span>
    );
}

function StatusBadge({ status, label }: { status: IncidentStatus; label: string }) {
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[status]}`}>
            {label}
        </span>
    );
}

// ─── tRPC row type ────────────────────────────────────────────────────────────

type IncidentRow = {
    id: number;
    organizationId: number;
    incidentCode: string | null;
    title: string;
    description: string | null;
    incidentType: IncidentType;
    severity: Severity;
    status: IncidentStatus;
    affectedFrameworks: string | null;
    affectedVendorId: number | null;
    affectedDataTypes: string | null;
    affectedDataSubjects: number | null;
    reportedById: number | null;
    occurredAt: Date | string | null;
    detectedAt: Date | string | null;
    containedAt: Date | string | null;
    resolvedAt: Date | string | null;
    regulatoryNotificationRequired: boolean;
    regulatoryNotificationSentAt: Date | string | null;
    notificationDeadlineHours: number;
    rootCause: string | null;
    lessonsLearned: string | null;
    notes: string | null;
    createdAt: Date | string;
    updatedAt: Date | string;
};

// ─── Form state ───────────────────────────────────────────────────────────────

type FormState = {
    incidentCode: string;
    title: string;
    description: string;
    incidentType: IncidentType;
    severity: Severity;
    status: IncidentStatus;
    affectedFrameworks: string[];
    affectedDataTypes: string[];
    affectedDataSubjects: string;
    occurredAt: string;
    detectedAt: string;
    regulatoryNotificationRequired: boolean;
    notificationDeadlineHours: string;
    rootCause: string;
    lessonsLearned: string;
    notes: string;
};

const DEFAULT_FORM: FormState = {
    incidentCode: "",
    title: "",
    description: "",
    incidentType: "other",
    severity: "medium",
    status: "open",
    affectedFrameworks: [],
    affectedDataTypes: [],
    affectedDataSubjects: "",
    occurredAt: "",
    detectedAt: "",
    regulatoryNotificationRequired: false,
    notificationDeadlineHours: "72",
    rootCause: "",
    lessonsLearned: "",
    notes: "",
};

// ─── IncidentRegister ─────────────────────────────────────────────────────────

export default function IncidentRegister() {
    const { t } = useLocale();
    usePageTitle(t("incident.pageTitle", "Incident Register"));

    // ── tRPC ──────────────────────────────────────────────────────────────────
    const utils = trpc.useUtils();
    const listQ = trpc.incidentRegister.list.useQuery(undefined, { staleTime: 30_000 });

    const createM = trpc.incidentRegister.create.useMutation({
        onSuccess: () => {
            utils.incidentRegister.list.invalidate().catch(() => undefined);
            toast.success(t("incident.created", "Incident recorded"));
            sounds.success();
            setDialogOpen(false);
        },
        onError: (err) => toast.error(err.message),
    });
    const patchM = trpc.incidentRegister.patch.useMutation({
        onSuccess: () => {
            utils.incidentRegister.list.invalidate().catch(() => undefined);
            toast.success(t("incident.updated", "Incident updated"));
            sounds.success();
            setDialogOpen(false);
        },
        onError: (err) => toast.error(err.message),
    });
    const updateStatusM = trpc.incidentRegister.updateStatus.useMutation({
        onSuccess: () => {
            utils.incidentRegister.list.invalidate().catch(() => undefined);
            toast.success(t("incident.updated", "Incident updated"));
            sounds.success();
        },
        onError: (err) => toast.error(err.message),
    });
    const markNotifiedM = trpc.incidentRegister.markNotified.useMutation({
        onSuccess: () => {
            utils.incidentRegister.list.invalidate().catch(() => undefined);
            toast.success(t("incident.notificationSent", "Regulatory notification marked as sent"));
            sounds.success();
        },
        onError: (err) => toast.error(err.message),
    });
    const removeM = trpc.incidentRegister.remove.useMutation({
        onSuccess: () => {
            utils.incidentRegister.list.invalidate().catch(() => undefined);
            toast.success(t("incident.deleted", "Incident deleted"));
            sounds.success();
            setDeleteTarget(null);
        },
        onError: (err) => toast.error(err.message),
    });

    // ── UI State ──────────────────────────────────────────────────────────────
    const [search, setSearch] = useState("");
    const [filterSev, setFilterSev] = useState<Severity | "all">("all");
    const [filterStatus, setFilterStatus] = useState<IncidentStatus | "all">("all");
    const [filterType, setFilterType] = useState<IncidentType | "all">("all");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<IncidentRow | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<IncidentRow | null>(null);
    const [form, setForm] = useState<FormState>(DEFAULT_FORM);

    const incidents: IncidentRow[] = (listQ.data as unknown as IncidentRow[]) ?? [];

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return incidents.filter(i => {
            if (filterSev !== "all" && i.severity !== filterSev) return false;
            if (filterStatus !== "all" && i.status !== filterStatus) return false;
            if (filterType !== "all" && i.incidentType !== filterType) return false;
            if (q) {
                const text = [i.title, i.incidentCode, i.description, i.rootCause, i.notes].join(" ").toLowerCase();
                if (!text.includes(q)) return false;
            }
            return true;
        });
    }, [incidents, search, filterSev, filterStatus, filterType]);

    const stats = useMemo(() => {
        const overdueNotification = incidents.filter(i => {
            if (!i.regulatoryNotificationRequired) return false;
            if (i.regulatoryNotificationSentAt) return false;
            const elapsed = hoursElapsed(i.occurredAt ?? i.detectedAt);
            return elapsed !== null && elapsed > i.notificationDeadlineHours;
        }).length;
        return {
            total: incidents.length,
            open: incidents.filter(i => i.status === "open" || i.status === "under_investigation").length,
            critical: incidents.filter(i => i.severity === "critical").length,
            overdueNotification,
        };
    }, [incidents]);

    // ── Helpers ───────────────────────────────────────────────────────────────

    function toggleArr(field: "affectedFrameworks" | "affectedDataTypes", val: string) {
        setForm(f => ({
            ...f,
            [field]: f[field].includes(val) ? f[field].filter(x => x !== val) : [...f[field], val],
        }));
    }

    function openNew() {
        setEditTarget(null);
        setForm(DEFAULT_FORM);
        setDialogOpen(true);
    }

    function openEdit(i: IncidentRow) {
        setEditTarget(i);
        setForm({
            incidentCode: i.incidentCode ?? "",
            title: i.title,
            description: i.description ?? "",
            incidentType: i.incidentType,
            severity: i.severity,
            status: i.status,
            affectedFrameworks: parseJsonArray(i.affectedFrameworks),
            affectedDataTypes: parseJsonArray(i.affectedDataTypes),
            affectedDataSubjects: i.affectedDataSubjects?.toString() ?? "",
            occurredAt: i.occurredAt ? new Date(i.occurredAt).toISOString().slice(0, 16) : "",
            detectedAt: i.detectedAt ? new Date(i.detectedAt).toISOString().slice(0, 16) : "",
            regulatoryNotificationRequired: i.regulatoryNotificationRequired,
            notificationDeadlineHours: i.notificationDeadlineHours.toString(),
            rootCause: i.rootCause ?? "",
            lessonsLearned: i.lessonsLearned ?? "",
            notes: i.notes ?? "",
        });
        setDialogOpen(true);
    }

    function handleSubmit() {
        const payload = {
            incidentCode: form.incidentCode || undefined,
            title: form.title,
            description: form.description || undefined,
            incidentType: form.incidentType,
            severity: form.severity,
            status: form.status,
            affectedFrameworks: form.affectedFrameworks,
            affectedDataTypes: form.affectedDataTypes,
            affectedDataSubjects: form.affectedDataSubjects ? parseInt(form.affectedDataSubjects, 10) : undefined,
            occurredAt: form.occurredAt ? new Date(form.occurredAt).toISOString() : undefined,
            detectedAt: form.detectedAt ? new Date(form.detectedAt).toISOString() : undefined,
            regulatoryNotificationRequired: form.regulatoryNotificationRequired,
            notificationDeadlineHours: parseInt(form.notificationDeadlineHours, 10) || 72,
            rootCause: form.rootCause || undefined,
            lessonsLearned: form.lessonsLearned || undefined,
            notes: form.notes || undefined,
        };
        if (editTarget) {
            patchM.mutate({ id: editTarget.id, ...payload });
        } else {
            createM.mutate(payload);
        }
    }

    const isSaving = createM.isPending || patchM.isPending;

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="djac-page">
            {/* Header */}
            <div className="djac-page-header">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-destructive/10">
                        <ShieldAlert className="h-6 w-6 text-destructive" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">{t("incident.title", "Incident Register")}</h1>
                        <p className="text-sm text-muted-foreground">{t("incident.subtitle", "Track, investigate, and close compliance incidents and data breaches")}</p>
                    </div>
                </div>
                <Button onClick={openNew} className="shrink-0">
                    <Plus className="h-4 w-4 mr-1" />
                    {t("incident.reportIncident", "Report Incident")}
                </Button>
            </div>

            {/* Stat cards */}
            <div className="flex flex-wrap gap-3">
                <StatCard label={t("incident.statTotal", "Total")} value={stats.total} />
                <StatCard label={t("incident.statOpen", "Active")} value={stats.open} />
                <StatCard label={t("incident.statCritical", "Critical")} value={stats.critical} alert={stats.critical > 0} />
                <StatCard label={t("incident.statOverdueNotif", "Overdue Notification")} value={stats.overdueNotification} alert={stats.overdueNotification > 0} />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
                <Input
                    placeholder={t("incident.searchPlaceholder", "Search incidents…")}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="h-9 w-52"
                />
                <Select value={filterSev} onValueChange={v => setFilterSev(v as Severity | "all")}>
                    <SelectTrigger className="h-9 w-40">
                        <SelectValue placeholder={t("incident.filterSeverity", "All severities")} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t("incident.filterAllSeverities", "All severities")}</SelectItem>
                        {SEVERITIES.map(s => <SelectItem key={s} value={s}>{t(`incident.severity.${s}`, s)}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={v => setFilterStatus(v as IncidentStatus | "all")}>
                    <SelectTrigger className="h-9 w-44">
                        <SelectValue placeholder={t("incident.filterStatus", "All statuses")} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t("incident.filterAllStatuses", "All statuses")}</SelectItem>
                        {STATUSES.map(s => <SelectItem key={s} value={s}>{t(`incident.status.${s}`, s)}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select value={filterType} onValueChange={v => setFilterType(v as IncidentType | "all")}>
                    <SelectTrigger className="h-9 w-48">
                        <SelectValue placeholder={t("incident.filterType", "All types")} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t("incident.filterAllTypes", "All types")}</SelectItem>
                        {INCIDENT_TYPES.map(tp => <SelectItem key={tp} value={tp}>{t(`incident.type.${tp}`, tp)}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>

            {/* Incident list */}
            {listQ.isLoading ? (
                <div className="text-center py-16 text-muted-foreground">{t("incident.loading", "Loading incidents…")}</div>
            ) : listQ.isError ? (
                <Card>
                    <CardContent className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
                        <ShieldAlert className="h-10 w-10 text-destructive/80" />
                        <p className="font-semibold text-foreground">{t("incident.loadError", "Failed to load incidents")}</p>
                        <QueryErrorPanel
                            message={listQ.error?.message ?? t("incident.loadErrorHint", "Retry to refresh incident records.")}
                            onRetry={() => {
                                void listQ.refetch();
                            }}
                            retryLabel={t("common.retry", "Retry")}
                            centered
                            className="w-full max-w-xl border-destructive/30 p-3"
                        />
                    </CardContent>
                </Card>
            ) : filtered.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
                        <ShieldAlert className="h-10 w-10 opacity-30" />
                        <p className="font-semibold">{t("incident.emptyTitle", "No incidents recorded")}</p>
                        <p className="text-sm">{t("incident.emptyDesc", "Use the 'Report Incident' button to log a new compliance incident.")}</p>
                        <Button variant="outline" size="sm" onClick={openNew}>
                            <Plus className="h-3.5 w-3.5 mr-1" />
                            {t("incident.reportIncident", "Report Incident")}
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="flex flex-col gap-3">
                    {filtered.map(inc => (
                        <IncidentCard
                            key={inc.id}
                            incident={inc}
                            onEdit={openEdit}
                            onDelete={setDeleteTarget}
                            onStatusChange={(id, status) => updateStatusM.mutate({ id, status })}
                            onMarkNotified={(id) => markNotifiedM.mutate(id)}
                            t={t}
                        />
                    ))}
                </div>
            )}

            {/* Create / Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={v => { if (!isSaving) setDialogOpen(v); }}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <ShieldAlert className="h-5 w-5 text-destructive" />
                            {editTarget ? t("incident.editTitle", "Edit Incident") : t("incident.newTitle", "Report Incident")}
                        </DialogTitle>
                        <DialogDescription>{t("incident.formDesc", "Record the details of this compliance incident.")}</DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
                        {/* Title */}
                        <div className="sm:col-span-2 space-y-1.5">
                            <Label>{t("incident.fieldTitle", "Title")} *</Label>
                            <Input
                                value={form.title}
                                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                placeholder="e.g. Unauthorised access to customer database"
                            />
                        </div>

                        {/* Incident Code */}
                        <div className="space-y-1.5">
                            <Label>{t("incident.fieldCode", "Incident Code")}</Label>
                            <Input
                                value={form.incidentCode}
                                onChange={e => setForm(f => ({ ...f, incidentCode: e.target.value }))}
                                placeholder="INC-2026-001"
                            />
                        </div>

                        {/* Incident Type */}
                        <div className="space-y-1.5">
                            <Label>{t("incident.fieldType", "Type")}</Label>
                            <Select value={form.incidentType} onValueChange={v => setForm(f => ({ ...f, incidentType: v as IncidentType }))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {INCIDENT_TYPES.map(tp => <SelectItem key={tp} value={tp}>{t(`incident.type.${tp}`, tp)}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Severity */}
                        <div className="space-y-1.5">
                            <Label>{t("incident.fieldSeverity", "Severity")}</Label>
                            <Select value={form.severity} onValueChange={v => setForm(f => ({ ...f, severity: v as Severity }))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {SEVERITIES.map(s => <SelectItem key={s} value={s}>{t(`incident.severity.${s}`, s)}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Status */}
                        <div className="space-y-1.5">
                            <Label>{t("incident.fieldStatus", "Status")}</Label>
                            <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as IncidentStatus }))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {STATUSES.map(s => <SelectItem key={s} value={s}>{t(`incident.status.${s}`, s)}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Occurred At */}
                        <div className="space-y-1.5">
                            <Label>{t("incident.fieldOccurredAt", "Date Occurred")}</Label>
                            <Input type="datetime-local" value={form.occurredAt} onChange={e => setForm(f => ({ ...f, occurredAt: e.target.value }))} />
                        </div>

                        {/* Detected At */}
                        <div className="space-y-1.5">
                            <Label>{t("incident.fieldDetectedAt", "Date Detected")}</Label>
                            <Input type="datetime-local" value={form.detectedAt} onChange={e => setForm(f => ({ ...f, detectedAt: e.target.value }))} />
                        </div>

                        {/* Affected Data Subjects */}
                        <div className="space-y-1.5">
                            <Label>{t("incident.fieldDataSubjects", "Affected Data Subjects")}</Label>
                            <Input
                                type="number"
                                min="0"
                                value={form.affectedDataSubjects}
                                onChange={e => setForm(f => ({ ...f, affectedDataSubjects: e.target.value }))}
                                placeholder="0"
                            />
                        </div>

                        {/* Regulatory notification */}
                        <div className="space-y-1.5">
                            <Label>{t("incident.fieldNotifDeadline", "Notification Deadline (hours)")}</Label>
                            <Select value={form.notificationDeadlineHours} onValueChange={v => setForm(f => ({ ...f, notificationDeadlineHours: v }))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {[24, 48, 72, 96, 168].map(h => <SelectItem key={h} value={h.toString()}>{h}h</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Regulatory notification toggle */}
                        <div className="sm:col-span-2 flex items-center gap-2 pt-1">
                            <Checkbox
                                id="regNotif"
                                checked={form.regulatoryNotificationRequired}
                                onCheckedChange={v => setForm(f => ({ ...f, regulatoryNotificationRequired: !!v }))}
                            />
                            <label htmlFor="regNotif" className="text-sm cursor-pointer">
                                {t("incident.fieldRegulatoryNotif", "Regulatory notification required (PIPL / GDPR / PDPL)")}
                            </label>
                        </div>

                        {/* Affected Frameworks */}
                        <div className="sm:col-span-2 space-y-1.5">
                            <Label>{t("incident.fieldFrameworks", "Affected Frameworks")}</Label>
                            <div className="flex flex-wrap gap-3 pt-1">
                                {FRAMEWORKS.map(fw => (
                                    <label key={fw} className="flex items-center gap-1.5 text-sm cursor-pointer">
                                        <Checkbox
                                            checked={form.affectedFrameworks.includes(fw)}
                                            onCheckedChange={() => toggleArr("affectedFrameworks", fw)}
                                        />
                                        {fw}
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Affected Data Types */}
                        <div className="sm:col-span-2 space-y-1.5">
                            <Label>{t("incident.fieldDataTypes", "Affected Data Types")}</Label>
                            <div className="flex flex-wrap gap-3 pt-1">
                                {DATA_TYPES.map(dt => (
                                    <label key={dt} className="flex items-center gap-1.5 text-sm cursor-pointer">
                                        <Checkbox
                                            checked={form.affectedDataTypes.includes(dt)}
                                            onCheckedChange={() => toggleArr("affectedDataTypes", dt)}
                                        />
                                        {dt}
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Description */}
                        <div className="sm:col-span-2 space-y-1.5">
                            <Label>{t("incident.fieldDescription", "Description")}</Label>
                            <Textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder={t("incident.descPlaceholder", "What happened? Initial scope, systems affected…")} />
                        </div>

                        {/* Root Cause */}
                        <div className="sm:col-span-2 space-y-1.5">
                            <Label>{t("incident.fieldRootCause", "Root Cause")}</Label>
                            <Textarea rows={2} value={form.rootCause} onChange={e => setForm(f => ({ ...f, rootCause: e.target.value }))} placeholder={t("incident.rootCausePlaceholder", "Underlying cause of the incident…")} />
                        </div>

                        {/* Lessons Learned */}
                        <div className="sm:col-span-2 space-y-1.5">
                            <Label>{t("incident.fieldLessons", "Lessons Learned")}</Label>
                            <Textarea rows={2} value={form.lessonsLearned} onChange={e => setForm(f => ({ ...f, lessonsLearned: e.target.value }))} placeholder={t("incident.lessonsPlaceholder", "What was learned? Corrective actions taken…")} />
                        </div>

                        {/* Notes */}
                        <div className="sm:col-span-2 space-y-1.5">
                            <Label>{t("incident.fieldNotes", "Notes")}</Label>
                            <Textarea rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder={t("incident.notesPlaceholder", "Additional context, links, references…")} />
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSaving}>
                            {t("common.cancel", "Cancel")}
                        </Button>
                        <Button onClick={handleSubmit} disabled={isSaving || !form.title.trim()}>
                            {isSaving
                                ? t("common.saving", "Saving…")
                                : editTarget
                                    ? t("common.saveChanges", "Save Changes")
                                    : t("incident.reportIncident", "Report Incident")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete confirm */}
            <AlertDialog open={!!deleteTarget} onOpenChange={v => { if (!v) setDeleteTarget(null); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("incident.deleteTitle", "Delete incident?")}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t("incident.deleteDesc", "This will permanently delete")} &ldquo;{deleteTarget?.title}&rdquo;.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t("common.cancel", "Cancel")}</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => deleteTarget && removeM.mutate(deleteTarget.id)}
                        >
                            {removeM.isPending ? t("common.deleting", "Deleting…") : t("common.delete", "Delete")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

// ─── IncidentCard ─────────────────────────────────────────────────────────────

function IncidentCard({
    incident: i,
    onEdit,
    onDelete,
    onStatusChange,
    onMarkNotified,
    t,
}: {
    incident: IncidentRow;
    onEdit: (i: IncidentRow) => void;
    onDelete: (i: IncidentRow) => void;
    onStatusChange: (id: number, status: IncidentStatus) => void;
    onMarkNotified: (id: number) => void;
    t: (key: string, fallback: string) => string;
}) {
    const frameworks = parseJsonArray(i.affectedFrameworks);
    const dataTypes = parseJsonArray(i.affectedDataTypes);
    const col = SEVERITY_COLORS[i.severity];
    const allowed = STATUS_TRANSITIONS[i.status];

    // Regulatory notification alert logic
    const notifRequired = i.regulatoryNotificationRequired && !i.regulatoryNotificationSentAt;
    const elapsed = hoursElapsed(i.occurredAt ?? i.detectedAt);
    const deadlineHours = i.notificationDeadlineHours ?? 72;
    const notifOverdue = notifRequired && elapsed !== null && elapsed > deadlineHours;
    const notifWarning = notifRequired && elapsed !== null && elapsed > deadlineHours * 0.75;
    const hoursLeft = elapsed !== null ? Math.max(0, deadlineHours - elapsed) : null;

    return (
        <Card className={`border-l-4 ${col.border}`}>
            <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    {/* Left */}
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <SeverityBadge severity={i.severity} label={t(`incident.severity.${i.severity}`, i.severity)} />
                            <StatusBadge status={i.status} label={t(`incident.status.${i.status}`, i.status)} />
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground`}>
                                {t(`incident.type.${i.incidentType}`, i.incidentType)}
                            </span>
                            {i.incidentCode && (
                                <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                    {i.incidentCode}
                                </span>
                            )}
                        </div>

                        <h3 className="font-semibold text-sm leading-snug truncate">{i.title}</h3>

                        {i.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{i.description}</p>
                        )}

                        {/* Regulatory notification alert */}
                        {notifRequired && (
                            <div className={`flex items-center gap-1.5 mt-2 px-2 py-1 rounded text-xs font-medium ${notifOverdue ? "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300" : notifWarning ? "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300" : "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300"}`}>
                                <Bell className="h-3.5 w-3.5 shrink-0" />
                                {notifOverdue
                                    ? t("incident.notifOverdue", "Regulatory notification OVERDUE")
                                    : hoursLeft !== null
                                        ? `${t("incident.notifDeadline", "Notification required")} — ${Math.ceil(hoursLeft)}h ${t("incident.remaining", "remaining")}`
                                        : t("incident.notifRequired", "Regulatory notification required")}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-1.5 ml-auto text-xs"
                                    onClick={() => onMarkNotified(i.id)}
                                >
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    {t("incident.markNotified", "Mark sent")}
                                </Button>
                            </div>
                        )}
                        {i.regulatoryNotificationSentAt && (
                            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                                <BellOff className="h-3.5 w-3.5" />
                                {t("incident.notifiedAt", "Regulatory notification sent")} {formatDate(i.regulatoryNotificationSentAt)}
                            </div>
                        )}

                        {/* Affected frameworks */}
                        {frameworks.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                                {frameworks.map(fw => (
                                    <span key={fw} className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">{fw}</span>
                                ))}
                            </div>
                        )}

                        {/* Data types */}
                        {dataTypes.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                                {dataTypes.map(dt => (
                                    <span key={dt} className="text-xs bg-muted border text-muted-foreground px-1.5 py-0.5 rounded">{dt}</span>
                                ))}
                            </div>
                        )}

                        {/* Timeline & data subjects */}
                        <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                            {i.occurredAt && (
                                <span>{t("incident.occurred", "Occurred")}: {formatDate(i.occurredAt)}</span>
                            )}
                            {i.affectedDataSubjects != null && (
                                <span>{t("incident.dataSubjects", "Data subjects")}: {i.affectedDataSubjects.toLocaleString()}</span>
                            )}
                        </div>
                    </div>

                    {/* Right: actions */}
                    <div className="flex flex-col gap-1.5 shrink-0">
                        {/* Lifecycle transitions */}
                        {allowed.length > 0 && (
                            <div className="flex flex-wrap gap-1 justify-end">
                                {allowed.map(next => (
                                    <Button
                                        key={next}
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-xs"
                                        onClick={() => onStatusChange(i.id, next)}
                                    >
                                        → {t(`incident.status.${next}`, next)}
                                    </Button>
                                ))}
                            </div>
                        )}
                        <div className="flex gap-1 justify-end">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(i)}>
                                <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                onClick={() => onDelete(i)}
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
