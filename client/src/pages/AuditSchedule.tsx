/**
 * AuditSchedule.tsx — Phase 33
 *
 * Compliance Audit Schedule — plan, track, and close internal, external,
 * regulatory, and certification audits with recurrence support.
 *
 * Features:
 *   • 4 audit types: internal / external / regulatory / certification
 *   • 4 statuses: planned / in_progress / completed / cancelled
 *   • Recurrence: none / monthly / quarterly / biannual / annual
 *   • Overdue detection (planned + scheduledDate < today)
 *   • "Complete" inline action with findings capture
 *   • Next occurrence auto-displayed for recurring audits
 *   • Stat cards: Total / Upcoming / Overdue / Completed
 *   • Filter by type, status; search
 *   • Create / Edit / Delete
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
import { Textarea } from "@/components/ui/textarea";
import {
    AlertTriangle,
    CalendarCheck2,
    CheckCircle2,
    ClipboardCheck,
    Clock,
    Download,
    Pencil,
    Plus,
    RefreshCw,
    Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { sounds } from "@/lib/sounds";

// ─── Constants ────────────────────────────────────────────────────────────────

const AUDIT_TYPES = ["internal", "external", "regulatory", "certification"] as const;
const STATUSES = ["planned", "in_progress", "completed", "cancelled"] as const;
const RECURRENCES = ["none", "monthly", "quarterly", "biannual", "annual"] as const;
const FRAMEWORKS = ["PIPL", "CSL", "DSL", "PDPL", "NCA ECC", "NCA CSCC", "ISO27001", "GDPR"] as const;

type AuditType = typeof AUDIT_TYPES[number];
type AuditStatus = typeof STATUSES[number];
type Recurrence = typeof RECURRENCES[number];

// ─── Colour helpers ───────────────────────────────────────────────────────────

const TYPE_COLORS: Record<AuditType, string> = {
    internal: "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300",
    external: "bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300",
    regulatory: "bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300",
    certification: "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300",
};

const STATUS_COLORS: Record<AuditStatus, string> = {
    planned: "bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300",
    in_progress: "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300",
    completed: "bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300",
    cancelled: "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400",
};

const TYPE_BORDERS: Record<AuditType, string> = {
    internal: "border-l-blue-400",
    external: "border-l-purple-400",
    regulatory: "border-l-orange-400",
    certification: "border-l-emerald-400",
};

// ─── Utility ──────────────────────────────────────────────────────────────────

function parseScope(v: string | null | undefined): string[] {
    if (!v) return [];
    try { return JSON.parse(v) as string[]; } catch { return []; }
}

function formatDate(d: Date | string | null | undefined): string {
    if (!d) return "—";
    const dt = d instanceof Date ? d : new Date(String(d));
    return dt.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

function isOverdue(audit: { status: AuditStatus; scheduledDate: Date | string | null }): boolean {
    if (audit.status !== "planned") return false;
    if (!audit.scheduledDate) return false;
    return new Date(audit.scheduledDate as string) < new Date();
}

// ─── Blank form ───────────────────────────────────────────────────────────────

const BLANK = {
    title: "",
    description: "",
    auditType: "internal" as AuditType,
    scope: [] as string[],
    status: "planned" as AuditStatus,
    scheduledDate: "",
    recurrence: "none" as Recurrence,
    findings: "",
    notes: "",
};

// ─── CSV helpers ──────────────────────────────────────────────────────────────

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

// ─── Main component ───────────────────────────────────────────────────────────

export default function AuditSchedule() {
    const { t } = useLocale();
    usePageTitle(t("audit.pageTitle", "Audit Schedule"));

    const [search, setSearch] = useState("");
    const [filterType, setFilterType] = useState("all");
    const [filterStatus, setFilterStatus] = useState("all");
    const [showCreate, setShowCreate] = useState(false);
    const [editing, setEditing] = useState<typeof BLANK & { id?: number } | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
    const [completeTarget, setCompleteTarget] = useState<{ id: number; findings: string } | null>(null);
    const [form, setForm] = useState(BLANK);

    const { data: audits = [], isLoading, isError, refetch } = trpc.auditSchedule.list.useQuery();
    const utils = trpc.useUtils();

    const createMut = trpc.auditSchedule.create.useMutation({
        onSuccess: () => { utils.auditSchedule.list.invalidate(); setShowCreate(false); setForm(BLANK); toast.success(t("audit.created", "Audit scheduled")); sounds.success(); },
    });
    const patchMut = trpc.auditSchedule.patch.useMutation({
        onSuccess: () => { utils.auditSchedule.list.invalidate(); setEditing(null); toast.success(t("audit.updated", "Audit updated")); },
    });
    const completeMut = trpc.auditSchedule.complete.useMutation({
        onSuccess: (data: { nextOccurrence: string | null }) => {
            utils.auditSchedule.list.invalidate();
            setCompleteTarget(null);
            const next = data.nextOccurrence ? ` ${t("audit.nextOn", "Next:")} ${formatDate(data.nextOccurrence)}` : "";
            toast.success(t("audit.completed", "Audit completed") + next);
        },
    });
    const removeMut = trpc.auditSchedule.remove.useMutation({
        onSuccess: () => { utils.auditSchedule.list.invalidate(); setDeleteTarget(null); toast.success(t("audit.deleted", "Audit deleted")); },
    });

    // ── Derived stats ────────────────────────────────────────────────────────
    const stats = useMemo(() => {
        const now = new Date();
        return {
            total: audits.length,
            upcoming: audits.filter((a: any) => a.status === "planned" && new Date(a.scheduledDate as string) >= now).length,
            overdue: audits.filter((a: any) => isOverdue(a as any)).length,
            completed: audits.filter((a: any) => a.status === "completed").length,
        };
    }, [audits]);

    // ── Filtered list ────────────────────────────────────────────────────────
    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return audits.filter((a: any) => {
            if (filterType !== "all" && a.auditType !== filterType) return false;
            if (filterStatus !== "all" && a.status !== filterStatus) return false;
            if (q && !a.title.toLowerCase().includes(q) && !(a.description ?? "").toLowerCase().includes(q)) return false;
            return true;
        });
    }, [audits, search, filterType, filterStatus]);

    // ── Form helpers ─────────────────────────────────────────────────────────
    function openCreate() { setForm(BLANK); setShowCreate(true); }
    function openEdit(a: typeof audits[number]) {
        setEditing({
            id: a.id,
            title: a.title,
            description: a.description ?? "",
            auditType: (a.auditType ?? "internal") as AuditType,
            scope: parseScope(a.scope),
            status: (a.status ?? "planned") as AuditStatus,
            scheduledDate: a.scheduledDate ? (a.scheduledDate instanceof Date ? a.scheduledDate : new Date(a.scheduledDate as unknown as string)).toISOString().slice(0, 10) : "",
            recurrence: (a.recurrence ?? "none") as Recurrence,
            findings: a.findings ?? "",
            notes: a.notes ?? "",
        });
    }

    function handleScopeToggle(fw: string, isEdit: boolean) {
        if (isEdit && editing) {
            const s = editing.scope.includes(fw) ? editing.scope.filter(x => x !== fw) : [...editing.scope, fw];
            setEditing({ ...editing, scope: s });
        } else {
            const s = form.scope.includes(fw) ? form.scope.filter(x => x !== fw) : [...form.scope, fw];
            setForm({ ...form, scope: s });
        }
    }

    function submitCreate() {
        if (!form.title.trim() || !form.scheduledDate) return;
        createMut.mutate({ ...form, scope: form.scope.length ? form.scope : undefined });
    }
    function submitEdit() {
        if (!editing?.title.trim() || !editing.scheduledDate) return;
        patchMut.mutate({ id: editing.id!, ...editing, scope: editing.scope.length ? editing.scope : undefined });
    }

    const isOpenDialog = showCreate || editing !== null;
    const activeForm = editing ?? form;
    const setActiveForm = (vals: Partial<typeof BLANK>) => editing ? setEditing({ ...editing, ...vals }) : setForm({ ...form, ...vals });

    return (
        <div className="djac-page">
            {/* Header */}
            <div className="djac-page-header">
                <div>
                    <h1 className="text-2xl font-bold">{t("audit.title", "Audit Schedule")}</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">{t("audit.subtitle", "Plan, track, and close compliance audits across all frameworks")}</p>
                </div>
                <Button onClick={openCreate} size="sm" className="gap-1.5">
                    <Plus className="w-4 h-4" />
                    {t("audit.scheduleAudit", "Schedule Audit")}
                </Button>
            </div>

            {/* Stat cards */}
            <div className="flex gap-3 flex-wrap">
                <StatCard label={t("audit.statTotal", "Total")} value={stats.total} icon={ClipboardCheck} color="bg-blue-100 dark:bg-blue-950 text-blue-600" />
                <StatCard label={t("audit.statUpcoming", "Upcoming")} value={stats.upcoming} icon={CalendarCheck2} color="bg-sky-100 dark:bg-sky-950 text-sky-600" />
                <StatCard label={t("audit.statOverdue", "Overdue")} value={stats.overdue} icon={AlertTriangle} color="bg-red-100 dark:bg-red-950 text-red-600" />
                <StatCard label={t("audit.statCompleted", "Completed")} value={stats.completed} icon={CheckCircle2} color="bg-green-100 dark:bg-green-950 text-green-600" />
            </div>

            {/* Filters */}
            <div className="flex gap-2 flex-wrap">
                <Input
                    placeholder={t("audit.searchPlaceholder", "Search audits…")}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="max-w-xs"
                />
                <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-40">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t("audit.filterAllTypes", "All types")}</SelectItem>
                        {AUDIT_TYPES.map(t2 => (
                            <SelectItem key={t2} value={t2}>{t(`audit.type.${t2}`, t2)}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-40">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t("audit.filterAllStatuses", "All statuses")}</SelectItem>
                        {STATUSES.map(s => (
                            <SelectItem key={s} value={s}>{t(`audit.status.${s}`, s)}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Button
                    variant="outline"
                    size="sm"
                    className="h-10 gap-1.5"
                    disabled={filtered.length === 0}
                    onClick={() => {
                        const rows = filtered.map((a: any) => ({
                            title: a.title,
                            auditType: a.auditType ?? "",
                            status: a.status ?? "",
                            scheduledDate: formatDate(a.scheduledDate),
                            recurrence: a.recurrence ?? "none",
                            findings: a.findings ?? "",
                            notes: a.notes ?? "",
                        }));
                        downloadCsv(
                            `audit-schedule-${new Date().toISOString().slice(0, 10)}.csv`,
                            rowsToCsv(rows as Record<string, unknown>[])
                        );
                    }}
                >
                    <Download className="w-3.5 h-3.5" />
                    {t("audit.exportCsv", "Export CSV")}
                </Button>
            </div>

            {/* List */}
            {isError ? (
                <Card>
                    <CardContent className="py-8 text-center">
                        <p className="text-sm text-muted-foreground">{t("audit.error", "Failed to load audits.")}</p>
                        <Button variant="outline" size="sm" className="mt-3 gap-1.5" onClick={() => { void refetch(); }}>
                            <RefreshCw className="w-3.5 h-3.5" />
                            {t("audit.retry", "Retry")}
                        </Button>
                    </CardContent>
                </Card>
            ) : isLoading ? (
                <p className="text-sm text-muted-foreground py-8 text-center">{t("audit.loading", "Loading audits…")}</p>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16 space-y-2">
                    <ClipboardCheck className="w-10 h-10 mx-auto text-muted-foreground opacity-40" />
                    <p className="text-sm text-muted-foreground">{t("audit.emptyTitle", "No audits scheduled")}</p>
                    <p className="text-xs text-muted-foreground">{t("audit.emptyDesc", "Use 'Schedule Audit' to plan your next compliance audit.")}</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map((a: any) => {
                        const overdue = isOverdue(a as any);
                        const scope = parseScope(a.scope);
                        const typeBorder = TYPE_BORDERS[(a.auditType ?? "internal") as AuditType];
                        return (
                            <Card key={a.id} className={`border-l-4 ${typeBorder}`}>
                                <CardContent className="pt-4 pb-4 px-5">
                                    <div className="flex items-start justify-between gap-3 flex-wrap">
                                        <div className="flex-1 min-w-0 space-y-1.5">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-semibold text-sm truncate">{a.title}</span>
                                                <Badge className={`text-xs px-2 ${TYPE_COLORS[(a.auditType ?? "internal") as AuditType]}`}>
                                                    {t(`audit.type.${a.auditType}`, a.auditType ?? "")}
                                                </Badge>
                                                <Badge className={`text-xs px-2 ${STATUS_COLORS[(a.status ?? "planned") as AuditStatus]}`}>
                                                    {t(`audit.status.${a.status}`, a.status ?? "")}
                                                </Badge>
                                                {a.recurrence && a.recurrence !== "none" && (
                                                    <Badge variant="outline" className="text-xs gap-1">
                                                        <RefreshCw className="w-2.5 h-2.5" />
                                                        {t(`audit.recurrence.${a.recurrence}`, a.recurrence)}
                                                    </Badge>
                                                )}
                                                {overdue && (
                                                    <Badge className="text-xs gap-1 bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300">
                                                        <AlertTriangle className="w-3 h-3" />
                                                        {t("audit.overdue", "Overdue")}
                                                    </Badge>
                                                )}
                                            </div>
                                            {a.description && <p className="text-xs text-muted-foreground line-clamp-2">{a.description}</p>}
                                            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                                                <span className={`flex items-center gap-1 ${overdue ? "text-red-600 dark:text-red-400 font-medium" : ""}`}>
                                                    <Clock className="w-3 h-3" />
                                                    {t("audit.scheduledFor", "Scheduled:")} {formatDate(a.scheduledDate)}
                                                </span>
                                                {a.completedDate && (
                                                    <span className="flex items-center gap-1 text-green-600">
                                                        <CheckCircle2 className="w-3 h-3" />
                                                        {t("audit.completedOn", "Completed:")} {formatDate(a.completedDate)}
                                                    </span>
                                                )}
                                                {a.nextOccurrence && (
                                                    <span className="flex items-center gap-1">
                                                        <RefreshCw className="w-3 h-3" />
                                                        {t("audit.nextOn", "Next:")} {formatDate(a.nextOccurrence)}
                                                    </span>
                                                )}
                                            </div>
                                            {scope.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {scope.map(fw => (
                                                        <span key={fw} className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{fw}</span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            {(a.status === "planned" || a.status === "in_progress") && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-7 text-xs gap-1 text-green-600 hover:text-green-700 border-green-200 dark:border-green-800"
                                                    onClick={() => setCompleteTarget({ id: a.id, findings: a.findings ?? "" })}
                                                >
                                                    <CheckCircle2 className="w-3 h-3" />
                                                    {t("audit.complete", "Complete")}
                                                </Button>
                                            )}
                                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEdit(a as any)}>
                                                <Pencil className="w-3.5 h-3.5" />
                                            </Button>
                                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(a.id)}>
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Create / Edit Dialog */}
            <Dialog open={isOpenDialog} onOpenChange={v => { if (!v) { setShowCreate(false); setEditing(null); } }}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editing ? t("audit.editTitle", "Edit Audit") : t("audit.newTitle", "Schedule Audit")}</DialogTitle>
                        <DialogDescription>{t("audit.formDesc", "Fill in the details for this compliance audit.")}</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="space-y-1">
                            <Label>{t("audit.fieldTitle", "Title")} *</Label>
                            <Input value={activeForm.title} onChange={e => setActiveForm({ title: e.target.value })} placeholder={t("audit.titlePlaceholder", "e.g. Annual PIPL Compliance Audit")} />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label>{t("audit.fieldType", "Type")}</Label>
                                <Select value={activeForm.auditType} onValueChange={v => setActiveForm({ auditType: v as AuditType })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {AUDIT_TYPES.map(t2 => <SelectItem key={t2} value={t2}>{t(`audit.type.${t2}`, t2)}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <Label>{t("audit.fieldStatus", "Status")}</Label>
                                <Select value={activeForm.status} onValueChange={v => setActiveForm({ status: v as AuditStatus })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {STATUSES.map(s => <SelectItem key={s} value={s}>{t(`audit.status.${s}`, s)}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label>{t("audit.fieldScheduledDate", "Scheduled Date")} *</Label>
                                <Input type="date" value={activeForm.scheduledDate} onChange={e => setActiveForm({ scheduledDate: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                                <Label>{t("audit.fieldRecurrence", "Recurrence")}</Label>
                                <Select value={activeForm.recurrence} onValueChange={v => setActiveForm({ recurrence: v as Recurrence })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {RECURRENCES.map(r => <SelectItem key={r} value={r}>{t(`audit.recurrence.${r}`, r)}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>{t("audit.fieldScope", "Scope (Frameworks)")}</Label>
                            <div className="grid grid-cols-2 gap-1.5">
                                {FRAMEWORKS.map(fw => (
                                    <label key={fw} className="flex items-center gap-2 cursor-pointer">
                                        <Checkbox
                                            checked={activeForm.scope.includes(fw)}
                                            onCheckedChange={() => handleScopeToggle(fw, !!editing)}
                                        />
                                        <span className="text-sm">{fw}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Label>{t("audit.fieldDescription", "Description")}</Label>
                            <Textarea rows={2} value={activeForm.description} onChange={e => setActiveForm({ description: e.target.value })} placeholder={t("audit.descPlaceholder", "Audit objectives and scope details…")} />
                        </div>

                        <div className="space-y-1">
                            <Label>{t("audit.fieldFindings", "Findings / Notes")}</Label>
                            <Textarea rows={2} value={activeForm.findings} onChange={e => setActiveForm({ findings: e.target.value })} placeholder={t("audit.findingsPlaceholder", "Key findings, observations, recommendations…")} />
                        </div>

                        <div className="space-y-1">
                            <Label>{t("audit.fieldNotes", "Internal Notes")}</Label>
                            <Textarea rows={2} value={activeForm.notes} onChange={e => setActiveForm({ notes: e.target.value })} placeholder={t("audit.notesPlaceholder", "Additional context, links…")} />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setShowCreate(false); setEditing(null); }}>
                            {t("audit.cancel", "Cancel")}
                        </Button>
                        <Button
                            onClick={editing ? submitEdit : submitCreate}
                            disabled={createMut.isPending || patchMut.isPending}
                        >
                            {editing ? t("audit.save", "Save") : t("audit.create", "Schedule")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Complete Dialog */}
            <Dialog open={!!completeTarget} onOpenChange={v => { if (!v) setCompleteTarget(null); }}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{t("audit.completeTitle", "Complete Audit")}</DialogTitle>
                        <DialogDescription>{t("audit.completeDesc", "Record your findings and mark this audit as completed.")}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 py-2">
                        <Label>{t("audit.fieldFindings", "Findings")}</Label>
                        <Textarea
                            rows={4}
                            value={completeTarget?.findings ?? ""}
                            onChange={e => setCompleteTarget(c => c ? { ...c, findings: e.target.value } : c)}
                            placeholder={t("audit.findingsPlaceholder", "Key findings, observations, recommendations…")}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCompleteTarget(null)}>{t("audit.cancel", "Cancel")}</Button>
                        <Button
                            className="gap-1.5"
                            onClick={() => completeTarget && completeMut.mutate({ id: completeTarget.id, findings: completeTarget.findings })}
                            disabled={completeMut.isPending}
                        >
                            <CheckCircle2 className="w-4 h-4" />
                            {t("audit.confirmComplete", "Mark Completed")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirm */}
            <AlertDialog open={deleteTarget !== null} onOpenChange={v => { if (!v) setDeleteTarget(null); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("audit.deleteTitle", "Delete Audit?")}</AlertDialogTitle>
                        <AlertDialogDescription>{t("audit.deleteDesc", "This will permanently remove the scheduled audit.")}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t("audit.cancel", "Cancel")}</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive hover:bg-destructive/90"
                            onClick={() => deleteTarget !== null && removeMut.mutate({ id: deleteTarget })}
                        >
                            {t("audit.confirmDelete", "Delete")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
