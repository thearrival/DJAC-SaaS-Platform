/**
 * RemediationPlanner.tsx — Phase 29
 *
 * Kanban-style board for tracking compliance gap remediation tasks.
 * Tasks can be created manually or pre-filled from GapTracker via URL params.
 *
 * Features:
 *  - 4-column Kanban: Open | In Progress | Resolved | Accepted Risk
 *  - Stats header with counts per status + severity breakdown
 *  - Create / Edit task dialog (links to vendor and gap code)
 *  - Move task between columns via status buttons
 *  - Delete task with confirmation
 *  - URL pre-fill: ?gapCode=...&title=...&severity=...&vendorId=...
 *  - EN / AR / ZH locale support
 */

import { useMemo, useState } from "react";
import type React from "react";
import { useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { useLocale } from "@/contexts/useLocale";
import { usePageTitle } from "@/hooks/usePageTitle";
import { toast } from "sonner";
import { sounds } from "@/lib/sounds";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    AlertTriangle,
    CheckCircle2,
    ChevronRight,
    Loader2,
    Plus,
    ShieldAlert,
    ShieldCheck,
    ShieldX,
    Trash2,
    User,
    Wrench,
    XCircle,
} from "lucide-react";
import { formatDateTime } from "@/lib/intl";

// ─── Types ────────────────────────────────────────────────────────────────────

type TaskStatus = "open" | "in_progress" | "resolved" | "accepted_risk";
type TaskSeverity = "critical" | "high" | "medium" | "low";

interface RemediationTask {
    id: number;
    organizationId: number;
    vendorId: number | null;
    gapCode: string | null;
    title: string;
    description: string | null;
    severity: TaskSeverity;
    status: TaskStatus;
    assignedToUserId: number | null;
    dueDate: Date | string | null;
    notes: string | null;
    createdAt: Date | string;
    updatedAt: Date | string;
}

interface OrgMember {
    id: number;
    name: string;
    role: string;
}

interface VendorItem {
    id: number;
    vendorName: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const KANBAN_COLUMNS: { status: TaskStatus; color: string; bg: string; border: string }[] = [
    { status: "open", color: "#94a3b8", bg: "rgba(148,163,184,0.08)", border: "rgba(148,163,184,0.20)" },
    { status: "in_progress", color: "#3b82f6", bg: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.25)" },
    { status: "resolved", color: "#22c55e", bg: "rgba(34,197,94,0.08)", border: "rgba(34,197,94,0.25)" },
    { status: "accepted_risk", color: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.25)" },
];

const SEVERITY_COLOR: Record<TaskSeverity, string> = {
    critical: "#ef4444",
    high: "#f97316",
    medium: "#eab308",
    low: "#22c55e",
};

const SEVERITY_BG: Record<TaskSeverity, string> = {
    critical: "rgba(239,68,68,0.10)",
    high: "rgba(249,115,22,0.10)",
    medium: "rgba(234,179,8,0.10)",
    low: "rgba(34,197,94,0.10)",
};

const STATUS_NEXT: Record<TaskStatus, TaskStatus | null> = {
    open: "in_progress",
    in_progress: "resolved",
    resolved: null,
    accepted_risk: null,
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function SeverityIcon({ severity, size = 14 }: { severity: TaskSeverity; size?: number }) {
    const col = SEVERITY_COLOR[severity];
    if (severity === "critical") return <ShieldX size={size} style={{ color: col }} />;
    if (severity === "high") return <ShieldAlert size={size} style={{ color: col }} />;
    if (severity === "medium") return <AlertTriangle size={size} style={{ color: col }} />;
    return <ShieldCheck size={size} style={{ color: col }} />;
}

function SeverityBadge({ severity }: { severity: TaskSeverity }) {
    return (
        <span style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "2px 7px",
            borderRadius: 999,
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            background: SEVERITY_BG[severity],
            color: SEVERITY_COLOR[severity],
            border: `1px solid ${SEVERITY_COLOR[severity]}33`,
        }}>
            <SeverityIcon severity={severity} size={10} />
            {severity}
        </span>
    );
}

function TaskCard({
    task,
    vendorMap,
    memberMap,
    onMoveNext,
    onEdit,
    onDelete,
    t,
}: {
    task: RemediationTask;
    vendorMap: Map<number, string>;
    memberMap: Map<number, string>;
    onMoveNext: (task: RemediationTask) => void;
    onEdit: (task: RemediationTask) => void;
    onDelete: (task: RemediationTask) => void;
    t: (key: string, fallback: string) => string;
}) {
    const nextStatus = STATUS_NEXT[task.status];
    const vendorName = task.vendorId != null ? vendorMap.get(task.vendorId) : undefined;
    const assigneeName = task.assignedToUserId != null ? memberMap.get(task.assignedToUserId) : undefined;
    const dueDate = task.dueDate ? new Date(task.dueDate) : null;
    const isOverdue = dueDate && dueDate < new Date() && task.status !== "resolved" && task.status !== "accepted_risk";
    const col = SEVERITY_COLOR[task.severity];

    return (
        <div style={{
            borderRadius: 10,
            border: "1px solid var(--djac-border, rgba(148,163,184,0.15))",
            background: "var(--djac-card, rgba(15,23,42,0.85))",
            padding: "12px 14px",
            borderLeft: `3px solid ${col}`,
            display: "flex",
            flexDirection: "column",
            gap: 8,
        }}>
            {/* Header row */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                <div style={{ flex: 1 }}>
                    {task.gapCode && (
                        <span style={{
                            display: "inline-block",
                            fontSize: 10,
                            fontWeight: 700,
                            padding: "1px 6px",
                            borderRadius: 4,
                            background: "rgba(129,140,248,0.15)",
                            color: "#818cf8",
                            border: "1px solid rgba(129,140,248,0.25)",
                            marginBottom: 4,
                        }}>
                            {task.gapCode}
                        </span>
                    )}
                    <p style={{
                        margin: 0,
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--djac-foreground, #f1f5f9)",
                        lineHeight: 1.4,
                    }}>
                        {task.title}
                    </p>
                </div>
                <div style={{ display: "flex", gap: 4, flexShrink: 0, marginTop: 1 }}>
                    <button
                        type="button"
                        onClick={() => onEdit(task)}
                        style={{
                            padding: "3px 7px",
                            borderRadius: 6,
                            background: "transparent",
                            border: "1px solid var(--djac-border, rgba(148,163,184,0.15))",
                            cursor: "pointer",
                            fontSize: 11,
                            color: "#94a3b8",
                        }}
                    >
                        {t("remediation.edit", "Edit")}
                    </button>
                    <button
                        type="button"
                        onClick={() => onDelete(task)}
                        style={{
                            padding: "3px 6px",
                            borderRadius: 6,
                            background: "transparent",
                            border: "1px solid rgba(239,68,68,0.20)",
                            cursor: "pointer",
                            color: "#f87171",
                        }}
                    >
                        <Trash2 size={11} />
                    </button>
                </div>
            </div>

            {/* Meta tags */}
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center" }}>
                <SeverityBadge severity={task.severity} />
                {vendorName && (
                    <Badge variant="outline" style={{ fontSize: 10, padding: "1px 6px" }}>
                        {vendorName}
                    </Badge>
                )}
            </div>

            {/* Assignee + due date */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <User size={11} style={{ color: "#94a3b8" }} />
                    <span style={{ fontSize: 11, color: "#94a3b8" }}>
                        {assigneeName ?? t("remediation.unassigned", "Unassigned")}
                    </span>
                </div>
                {dueDate && (
                    <span style={{
                        fontSize: 10,
                        fontWeight: 500,
                        color: isOverdue ? "#f87171" : "#94a3b8",
                    }}>
                        {isOverdue ? `⚠ ${t("remediation.overdue", "Overdue")} ` : ""}
                        {formatDateTime(dueDate)}
                    </span>
                )}
            </div>

            {/* Move forward button */}
            {nextStatus && (
                <button
                    type="button"
                    onClick={() => onMoveNext(task)}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 4,
                        padding: "5px 0",
                        borderRadius: 6,
                        border: "1px solid var(--djac-border, rgba(148,163,184,0.15))",
                        background: "transparent",
                        cursor: "pointer",
                        fontSize: 11,
                        color: "#94a3b8",
                        width: "100%",
                        transition: "all 0.15s",
                    }}
                >
                    <ChevronRight size={12} />
                    {t(`remediation.moveTo.${nextStatus}`, nextStatus.replace("_", " "))}
                </button>
            )}
        </div>
    );
}

// ─── Task Form ────────────────────────────────────────────────────────────────

interface TaskFormValues {
    title: string;
    description: string;
    severity: TaskSeverity;
    status: TaskStatus;
    gapCode: string;
    vendorId: string;   // string for select, "" = none
    assignedToUserId: string;   // string for select, "" = none
    dueDate: string;
    notes: string;
}

const DEFAULT_FORM: TaskFormValues = {
    title: "",
    description: "",
    severity: "medium",
    status: "open",
    gapCode: "",
    vendorId: "",
    assignedToUserId: "",
    dueDate: "",
    notes: "",
};

function TaskFormDialog({
    open,
    onClose,
    initial,
    vendors,
    members,
    onSave,
    isLoading,
    editMode,
    t,
}: {
    open: boolean;
    onClose: () => void;
    initial: TaskFormValues;
    vendors: VendorItem[];
    members: OrgMember[];
    onSave: (values: TaskFormValues) => void;
    isLoading: boolean;
    editMode: boolean;
    t: (key: string, fallback: string) => string;
}) {
    const [form, setForm] = useState<TaskFormValues>(initial);

    // Sync when dialog opens with new initial values
    const prevOpen = usePrevious(open);
    if (open && !prevOpen) {
        // reset on open
    }
    // Use a key on Dialog to reset state instead:
    const set = (field: keyof TaskFormValues) => (value: string) =>
        setForm(f => ({ ...f, [field]: value }));

    // Synchronize form when initial changes (e.g., pre-fill from URL)
    const [localForm, setLocalForm] = useState<TaskFormValues>(initial);
    // Simple controlled form:
    const f = localForm;
    const setF = (field: keyof TaskFormValues, value: string) =>
        setLocalForm(prev => ({ ...prev, [field]: value }));

    return (
        <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
            <DialogContent style={{ maxWidth: 560 }}>
                <DialogHeader>
                    <DialogTitle>{editMode ? t("remediation.editTitle", "Edit Task") : t("remediation.createTitle", "Create Remediation Task")}</DialogTitle>
                    <DialogDescription>
                        {t("remediation.formDesc", "Track a compliance gap remediation effort with assignee, due date, and severity.")}
                    </DialogDescription>
                </DialogHeader>

                <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "4px 0" }}>
                    {/* Title */}
                    <div>
                        <Label htmlFor="rm-title">{t("remediation.labelTitle", "Title")} *</Label>
                        <Input
                            id="rm-title"
                            value={f.title}
                            onChange={e => setF("title", e.target.value)}
                            placeholder={t("remediation.titlePlaceholder", "e.g. Implement Data Breach Notification Procedure")}
                            maxLength={255}
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <Label htmlFor="rm-desc">{t("remediation.labelDescription", "Description")}</Label>
                        <Textarea
                            id="rm-desc"
                            value={f.description}
                            onChange={e => setF("description", e.target.value)}
                            placeholder={t("remediation.descPlaceholder", "Optional background on the gap and what needs to change.")}
                            rows={2}
                            maxLength={2000}
                        />
                    </div>

                    {/* Severity + Status row */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div>
                            <Label>{t("remediation.labelSeverity", "Severity")}</Label>
                            <Select value={f.severity} onValueChange={v => setF("severity", v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {(["critical", "high", "medium", "low"] as TaskSeverity[]).map(s => (
                                        <SelectItem key={s} value={s} style={{ color: SEVERITY_COLOR[s] }}>
                                            {s.charAt(0).toUpperCase() + s.slice(1)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>{t("remediation.labelStatus", "Status")}</Label>
                            <Select value={f.status} onValueChange={v => setF("status", v as TaskStatus)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="open">{t("remediation.statusOpen", "Open")}</SelectItem>
                                    <SelectItem value="in_progress">{t("remediation.statusInProgress", "In Progress")}</SelectItem>
                                    <SelectItem value="resolved">{t("remediation.statusResolved", "Resolved")}</SelectItem>
                                    <SelectItem value="accepted_risk">{t("remediation.statusAcceptedRisk", "Accepted Risk")}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Gap Code + Vendor row */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div>
                            <Label htmlFor="rm-gapcode">{t("remediation.labelGapCode", "Gap Code")}</Label>
                            <Input
                                id="rm-gapcode"
                                value={f.gapCode}
                                onChange={e => setF("gapCode", e.target.value)}
                                placeholder="e.g. PIPL-DPO-001"
                                maxLength={64}
                            />
                        </div>
                        <div>
                            <Label>{t("remediation.labelVendor", "Vendor")}</Label>
                            <Select value={f.vendorId || "__none"} onValueChange={v => setF("vendorId", v === "__none" ? "" : v)}>
                                <SelectTrigger><SelectValue placeholder={t("remediation.selectVendor", "Select vendor…")} /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__none">{t("remediation.noVendor", "None")}</SelectItem>
                                    {vendors.map(v => (
                                        <SelectItem key={v.id} value={String(v.id)}>{v.vendorName}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Assignee + Due Date row */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div>
                            <Label>{t("remediation.labelAssignee", "Assignee")}</Label>
                            <Select value={f.assignedToUserId || "__none"} onValueChange={v => setF("assignedToUserId", v === "__none" ? "" : v)}>
                                <SelectTrigger><SelectValue placeholder={t("remediation.selectAssignee", "Assign to…")} /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__none">{t("remediation.unassigned", "Unassigned")}</SelectItem>
                                    {members.map(m => (
                                        <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="rm-due">{t("remediation.labelDueDate", "Due Date")}</Label>
                            <Input
                                id="rm-due"
                                type="date"
                                value={f.dueDate}
                                onChange={e => setF("dueDate", e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <Label htmlFor="rm-notes">{t("remediation.labelNotes", "Notes")}</Label>
                        <Textarea
                            id="rm-notes"
                            value={f.notes}
                            onChange={e => setF("notes", e.target.value)}
                            placeholder={t("remediation.notesPlaceholder", "Additional context, links, or evidence…")}
                            rows={2}
                            maxLength={2000}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isLoading}>
                        {t("remediation.cancel", "Cancel")}
                    </Button>
                    <Button
                        onClick={() => onSave(localForm)}
                        disabled={isLoading || !f.title.trim()}
                    >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : null}
                        {t("remediation.save", "Save Task")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// Tiny helper hook to track previous value
function usePrevious<T>(value: T): T | undefined {
    const ref = { current: undefined as T | undefined };
    const prev = ref.current;
    ref.current = value;
    return prev;
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, count, color, icon: Icon }: {
    label: string; count: number; color: string;
    icon: React.FC<{ size?: number; style?: React.CSSProperties }>;
}) {
    return (
        <div style={{
            flex: "1 1 120px",
            padding: "14px 18px",
            borderRadius: 10,
            background: "var(--djac-card, rgba(15,23,42,0.8))",
            border: "1px solid var(--djac-border, rgba(148,163,184,0.12))",
            display: "flex",
            flexDirection: "column",
            gap: 6,
        }}>
            <Icon size={16} style={{ color }} />
            <div style={{ fontSize: 26, fontWeight: 700, color, lineHeight: 1 }}>{count}</div>
            <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RemediationPlanner() {
    const { t } = useLocale();
    usePageTitle(t("remediation.title", "Remediation Planner"));

    // Parse URL pre-fill params (from GapTracker → Create Task)
    const search = useSearch();
    const params = new URLSearchParams(search);
    const prefillGapCode = params.get("gapCode") ?? "";
    const prefillTitle = params.get("title") ?? "";
    const prefillSeverity = (params.get("severity") as TaskSeverity) || "medium";
    const prefillVendorId = params.get("vendorId") ?? "";

    // ── State ──
    const [createOpen, setCreateOpen] = useState(false);
    const [editTask, setEditTask] = useState<RemediationTask | null>(null);
    const [deleteTask, setDeleteTask] = useState<RemediationTask | null>(null);

    // Initialise form for create/edit
    const getCreateInitial = (): TaskFormValues => ({
        ...DEFAULT_FORM,
        gapCode: prefillGapCode,
        title: prefillTitle,
        severity: prefillSeverity,
        vendorId: prefillVendorId,
    });

    const getEditInitial = (task: RemediationTask): TaskFormValues => ({
        title: task.title,
        description: task.description ?? "",
        severity: task.severity,
        status: task.status,
        gapCode: task.gapCode ?? "",
        vendorId: task.vendorId != null ? String(task.vendorId) : "",
        assignedToUserId: task.assignedToUserId != null ? String(task.assignedToUserId) : "",
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : "",
        notes: task.notes ?? "",
    });

    // ── Queries ──
    const utils = trpc.useUtils();
    const { data: tasks = [], isLoading, isError, refetch } = trpc.remediation.list.useQuery(undefined, { staleTime: 30_000 });
    const vendorsQuery = trpc.vendor.list.useQuery(undefined, { retry: false, refetchOnWindowFocus: false });
    const membersQuery = trpc.orgMembers.list.useQuery(undefined, { retry: false, refetchOnWindowFocus: false });
    const vendors = vendorsQuery.data ?? [];
    const members = membersQuery.data ?? [];
    const hasSupportLoadError = vendorsQuery.isError || membersQuery.isError;
    const supportLoadErrorMessage = vendorsQuery.error?.message ?? membersQuery.error?.message;

    const createMutation = trpc.remediation.create.useMutation({
        onSuccess: () => {
            toast.success(t("remediation.createSuccess", "Remediation task created"));
            sounds.success();
            void utils.remediation.list.invalidate();
            setCreateOpen(false);
        },
        onError: (err) => {
            toast.error(err.message);
            sounds.error();
        },
    });

    const patchMutation = trpc.remediation.patch.useMutation({
        onSuccess: () => {
            toast.success(t("remediation.updateSuccess", "Task updated"));
            sounds.success();
            void utils.remediation.list.invalidate();
            setEditTask(null);
        },
        onError: (err) => {
            toast.error(err.message);
            sounds.error();
        },
    });

    const updateStatusMutation = trpc.remediation.updateStatus.useMutation({
        onSuccess: () => { void utils.remediation.list.invalidate(); },
    });

    const removeMutation = trpc.remediation.remove.useMutation({
        onSuccess: () => {
            toast.success(t("remediation.deleteSuccess", "Task deleted"));
            sounds.click();
            void utils.remediation.list.invalidate();
            setDeleteTask(null);
        },
        onError: (err) => {
            toast.error(t("remediation.deleteError", "Failed to delete task") + ": " + err.message);
            sounds.error();
        },
    });

    // ── Lookup maps ──
    const vendorMap = useMemo(() => {
        const m = new Map<number, string>();
        (vendors as VendorItem[]).forEach(v => m.set(v.id, v.vendorName));
        return m;
    }, [vendors]);

    const memberMap = useMemo(() => {
        const m = new Map<number, string>();
        (members as OrgMember[]).forEach(mem => m.set(mem.id, mem.name));
        return m;
    }, [members]);

    // ── Stats ──
    const stats = useMemo(() => ({
        total: tasks.length,
        open: tasks.filter(t => t.status === "open").length,
        in_progress: tasks.filter(t => t.status === "in_progress").length,
        resolved: tasks.filter(t => t.status === "resolved").length,
        accepted_risk: tasks.filter(t => t.status === "accepted_risk").length,
    }), [tasks]);

    // ── Handlers ──
    function handleCreate(values: TaskFormValues) {
        createMutation.mutate({
            title: values.title.trim(),
            description: values.description.trim() || undefined,
            severity: values.severity as TaskSeverity,
            status: values.status as TaskStatus,
            gapCode: values.gapCode.trim() || undefined,
            vendorId: values.vendorId ? Number(values.vendorId) : undefined,
            assignedToUserId: values.assignedToUserId ? Number(values.assignedToUserId) : undefined,
            dueDate: values.dueDate || undefined,
            notes: values.notes.trim() || undefined,
        });
    }

    function handleEdit(values: TaskFormValues) {
        if (!editTask) return;
        patchMutation.mutate({
            id: editTask.id,
            title: values.title.trim(),
            description: values.description.trim() || undefined,
            severity: values.severity as TaskSeverity,
            status: values.status as TaskStatus,
            assignedToUserId: values.assignedToUserId ? Number(values.assignedToUserId) : null,
            dueDate: values.dueDate || null,
            notes: values.notes.trim() || undefined,
        });
    }

    function handleMoveNext(task: RemediationTask) {
        const next = STATUS_NEXT[task.status];
        if (!next) return;
        sounds.click();
        updateStatusMutation.mutate({ id: task.id, status: next });
    }

    const statusLabels: Record<TaskStatus, string> = {
        open: t("remediation.colOpen", "Open"),
        in_progress: t("remediation.colInProgress", "In Progress"),
        resolved: t("remediation.colResolved", "Resolved"),
        accepted_risk: t("remediation.colAcceptedRisk", "Accepted Risk"),
    };

    const statusIcons: Record<TaskStatus, React.ReactNode> = {
        open: <XCircle size={14} />,
        in_progress: <Loader2 size={14} />,
        resolved: <CheckCircle2 size={14} />,
        accepted_risk: <ShieldAlert size={14} />,
    };

    return (
        <div className="djac-page">
            {/* ── Page Header ── */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Wrench size={22} style={{ color: "#818cf8" }} />
                        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "var(--djac-foreground, #f1f5f9)" }}>
                            {t("remediation.title", "Remediation Planner")}
                        </h1>
                    </div>
                    <p style={{ margin: "4px 0 0", fontSize: 13, color: "#94a3b8", maxWidth: 640 }}>
                        {t("remediation.subtitle", "Convert compliance gap findings into actionable tasks. Assign, track, and close remediation efforts across your vendor portfolio.")}
                    </p>
                </div>
                <Button
                    onClick={() => { sounds.open(); setCreateOpen(true); }}
                    className="gap-2"
                >
                    <Plus className="h-4 w-4" />
                    {t("remediation.newTask", "New Task")}
                </Button>
            </div>

            {hasSupportLoadError && (
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    flexWrap: "wrap",
                    padding: "12px 14px",
                    borderRadius: 10,
                    border: "1px solid rgba(248,113,113,0.35)",
                    background: "rgba(248,113,113,0.08)",
                }}>
                    <div>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--djac-foreground, #f1f5f9)" }}>
                            {t("remediation.supportLoadError", "Some assignment data failed to load.")}
                        </p>
                        <p style={{ margin: "3px 0 0", fontSize: 12, color: "#94a3b8" }}>
                            {supportLoadErrorMessage ?? t("remediation.supportLoadErrorHint", "Retry to reload vendors and team members.")}
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            void vendorsQuery.refetch();
                            void membersQuery.refetch();
                        }}
                    >
                        {t("common.retry", "Retry")}
                    </Button>
                </div>
            )}

            {/* ── Stats Row ── */}
            {!isLoading && !isError && (
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <StatCard label={t("remediation.totalTasks", "Total")} count={stats.total} color="#818cf8"
                        icon={({ size, style }) => <Wrench size={size} style={style} />} />
                    <StatCard label={t("remediation.colOpen", "Open")} count={stats.open} color="#94a3b8"
                        icon={({ size, style }) => <XCircle size={size} style={style} />} />
                    <StatCard label={t("remediation.colInProgress", "In Progress")} count={stats.in_progress} color="#3b82f6"
                        icon={({ size, style }) => <Loader2 size={size} style={style} />} />
                    <StatCard label={t("remediation.colResolved", "Resolved")} count={stats.resolved} color="#22c55e"
                        icon={({ size, style }) => <CheckCircle2 size={size} style={style} />} />
                    <StatCard label={t("remediation.colAcceptedRisk", "Accepted Risk")} count={stats.accepted_risk} color="#f59e0b"
                        icon={({ size, style }) => <ShieldAlert size={size} style={style} />} />
                </div>
            )}

            {/* ── Loading ── */}
            {isError && (
                <div style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 14,
                    padding: 80,
                    color: "#94a3b8",
                }}>
                    <Wrench size={32} style={{ color: "#334155", opacity: 0.6 }} />
                    <p style={{ margin: 0, fontSize: 14 }}>
                        {t("remediation.loadError", "Failed to load remediation tasks.")}
                    </p>
                    <Button variant="outline" size="sm" onClick={() => { void refetch(); }}>
                        {t("common.retry", "Retry")}
                    </Button>
                </div>
            )}

            {isLoading && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 80, gap: 10, color: "#94a3b8" }}>
                    <Loader2 size={18} className="animate-spin" />
                    {t("remediation.loading", "Loading remediation tasks…")}
                </div>
            )}

            {/* ── Empty state ── */}
            {!isLoading && !isError && tasks.length === 0 && (
                <div style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 14,
                    padding: 80,
                    borderRadius: 12,
                    border: "1px dashed var(--djac-border, rgba(148,163,184,0.20))",
                    background: "var(--djac-card, rgba(15,23,42,0.4))",
                    textAlign: "center",
                }}>
                    <Wrench size={32} style={{ color: "#334155", opacity: 0.6 }} />
                    <div>
                        <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "var(--djac-foreground, #f1f5f9)" }}>
                            {t("remediation.emptyTitle", "No remediation tasks yet")}
                        </p>
                        <p style={{ margin: "6px 0 0", fontSize: 13, color: "#94a3b8" }}>
                            {t("remediation.emptyDesc", "Create tasks from gap findings in the Gap Tracker, or add one manually.")}
                        </p>
                    </div>
                    <Button onClick={() => { sounds.open(); setCreateOpen(true); }} className="gap-2">
                        <Plus className="h-4 w-4" />
                        {t("remediation.newTask", "New Task")}
                    </Button>
                </div>
            )}

            {/* ── Kanban Board ── */}
            {!isLoading && !isError && tasks.length > 0 && (
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: 16,
                    alignItems: "start",
                }}>
                    {KANBAN_COLUMNS.map(col => {
                        const colTasks = (tasks as RemediationTask[]).filter(t => t.status === col.status);
                        return (
                            <div key={col.status} style={{
                                borderRadius: 12,
                                border: `1px solid ${col.border}`,
                                background: col.bg,
                                padding: "16px 14px",
                                display: "flex",
                                flexDirection: "column",
                                gap: 10,
                                minHeight: 200,
                            }}>
                                {/* Column header */}
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 7, color: col.color }}>
                                        {statusIcons[col.status]}
                                        <span style={{ fontSize: 13, fontWeight: 700 }}>
                                            {statusLabels[col.status]}
                                        </span>
                                    </div>
                                    <span style={{
                                        fontSize: 11,
                                        fontWeight: 700,
                                        padding: "2px 8px",
                                        borderRadius: 999,
                                        background: `${col.color}22`,
                                        color: col.color,
                                    }}>
                                        {colTasks.length}
                                    </span>
                                </div>

                                {/* Task cards */}
                                {colTasks.length === 0 && (
                                    <div style={{
                                        padding: "20px 0",
                                        textAlign: "center",
                                        color: "#475569",
                                        fontSize: 12,
                                    }}>
                                        {t("remediation.noTasks", "No tasks")}
                                    </div>
                                )}
                                {colTasks.map(task => (
                                    <TaskCard
                                        key={task.id}
                                        task={task}
                                        vendorMap={vendorMap}
                                        memberMap={memberMap}
                                        onMoveNext={handleMoveNext}
                                        onEdit={task => { sounds.open(); setEditTask(task); }}
                                        onDelete={task => { sounds.open(); setDeleteTask(task); }}
                                        t={t}
                                    />
                                ))}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Create Task Dialog ── */}
            {createOpen && (
                <TaskFormDialog
                    key="create"
                    open={createOpen}
                    onClose={() => { sounds.close(); setCreateOpen(false); }}
                    initial={getCreateInitial()}
                    vendors={vendors as VendorItem[]}
                    members={members as OrgMember[]}
                    onSave={handleCreate}
                    isLoading={createMutation.isPending}
                    editMode={false}
                    t={t}
                />
            )}

            {/* ── Edit Task Dialog ── */}
            {editTask && (
                <TaskFormDialog
                    key={`edit-${editTask.id}`}
                    open={!!editTask}
                    onClose={() => { sounds.close(); setEditTask(null); }}
                    initial={getEditInitial(editTask)}
                    vendors={vendors as VendorItem[]}
                    members={members as OrgMember[]}
                    onSave={handleEdit}
                    isLoading={patchMutation.isPending}
                    editMode={true}
                    t={t}
                />
            )}

            {/* ── Delete Confirm ── */}
            <AlertDialog open={!!deleteTask} onOpenChange={v => { if (!v) setDeleteTask(null); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("remediation.deleteConfirm", "Delete this task?")}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t("remediation.deleteDesc", "This action cannot be undone.")}
                            {deleteTask && <> &ldquo;<strong>{deleteTask.title}</strong>&rdquo;</>}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => { sounds.close(); setDeleteTask(null); }}>
                            {t("remediation.cancel", "Cancel")}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteTask && removeMutation.mutate(deleteTask.id)}
                            disabled={removeMutation.isPending}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {removeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin me-1" /> : null}
                            {t("remediation.confirmDelete", "Delete Task")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
