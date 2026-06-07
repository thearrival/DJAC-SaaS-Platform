/**
 * DataSubjectRequests.tsx — Phase 38: DSR Tracker
 *
 * Tracks data subject rights requests under:
 *   - PIPL (China) — 15 working-day deadline
 *   - PDPL (Saudi Arabia) — 30 calendar-day deadline
 *
 * Features:
 *   - KPI cards: Total / Open / Due This Week / Overdue
 *   - Filter bar: status + requestType + jurisdiction
 *   - DSR table with deadline countdown badge (red=overdue, amber=≤7 days, green=ok)
 *   - Status inline update via Select dropdown per row
 *   - Create DSR dialog: all fields + auto-computed due date shown
 *   - Empty state CTA
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
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    AlertTriangle,
    CheckCircle2,
    Clock,
    Loader2,
    Plus,
    Trash2,
    UserCheck,
    Users,
} from "lucide-react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

type RequestType =
    | "access"
    | "rectification"
    | "erasure"
    | "portability"
    | "restriction"
    | "objection"
    | "explanation";

type Jurisdiction = "China" | "Saudi Arabia" | "Other";

type Status =
    | "received"
    | "in_review"
    | "pending_info"
    | "completed"
    | "rejected"
    | "withdrawn";

type Priority = "normal" | "high" | "urgent";

interface DsrItem {
    id: number;
    organizationId: number;
    requestType: RequestType;
    jurisdiction: Jurisdiction;
    requesterName: string;
    requesterEmail: string;
    description: string | null;
    status: Status;
    priority: Priority;
    dueDate: Date | string;
    completedAt: Date | string | null;
    assignedToUserId: number | null;
    notes: string | null;
    createdAt: Date | string;
    updatedAt: Date | string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const REQUEST_TYPE_LABELS: Record<RequestType, string> = {
    access: "Access",
    rectification: "Rectification",
    erasure: "Erasure",
    portability: "Portability",
    restriction: "Restriction",
    objection: "Objection",
    explanation: "Explanation",
};

const STATUS_LABELS: Record<Status, string> = {
    received: "Received",
    in_review: "In Review",
    pending_info: "Pending Info",
    completed: "Completed",
    rejected: "Rejected",
    withdrawn: "Withdrawn",
};

const STATUS_COLOURS: Record<Status, string> = {
    received: "bg-blue-500/10 text-blue-500 border-blue-500/30",
    in_review: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
    pending_info: "bg-orange-500/10 text-orange-500 border-orange-500/30",
    completed: "bg-green-500/10 text-green-500 border-green-500/30",
    rejected: "bg-red-500/10 text-red-500 border-red-500/30",
    withdrawn: "bg-slate-500/10 text-slate-400 border-slate-500/30",
};

const PRIORITY_COLOURS: Record<Priority, string> = {
    normal: "bg-slate-500/10 text-slate-400 border-slate-500/30",
    high: "bg-orange-500/10 text-orange-500 border-orange-500/30",
    urgent: "bg-red-500/10 text-red-500 border-red-500/30",
};

const JURISDICTION_COLOURS: Record<Jurisdiction, string> = {
    China: "bg-red-500/10 text-red-400 border-red-500/30",
    "Saudi Arabia": "bg-green-500/10 text-green-500 border-green-500/30",
    Other: "bg-slate-500/10 text-slate-400 border-slate-500/30",
};

const REQUEST_TYPES: RequestType[] = [
    "access", "rectification", "erasure", "portability", "restriction", "objection", "explanation",
];

const STATUSES: Status[] = [
    "received", "in_review", "pending_info", "completed", "rejected", "withdrawn",
];

const JURISDICTIONS: Jurisdiction[] = ["China", "Saudi Arabia", "Other"];
const PRIORITIES: Priority[] = ["normal", "high", "urgent"];

const OPEN_STATUSES: Status[] = ["received", "in_review", "pending_info"];
const CLOSED_STATUSES: Status[] = ["completed", "rejected", "withdrawn"];

// ─── Due-date helpers ─────────────────────────────────────────────────────────

function toDate(d: Date | string): Date {
    return typeof d === "string" ? new Date(d) : d;
}

function daysUntilDue(dueDate: Date | string): number {
    const due = toDate(dueDate);
    const now = new Date();
    return Math.ceil((due.getTime() - now.getTime()) / 86400000);
}

function dueDateBadge(item: DsrItem) {
    if (CLOSED_STATUSES.includes(item.status)) return null;
    const days = daysUntilDue(item.dueDate);
    if (days < 0) {
        return (
            <Badge variant="outline" className="text-xs bg-red-500/10 text-red-400 border-red-500/30 gap-1">
                <AlertTriangle className="h-3 w-3" />
                {Math.abs(days)}d overdue
            </Badge>
        );
    }
    if (days <= 7) {
        return (
            <Badge variant="outline" className="text-xs bg-orange-500/10 text-orange-400 border-orange-500/30 gap-1">
                <Clock className="h-3 w-3" />
                {days}d left
            </Badge>
        );
    }
    return (
        <Badge variant="outline" className="text-xs bg-green-500/10 text-green-500 border-green-500/30 gap-1">
            <CheckCircle2 className="h-3 w-3" />
            {days}d left
        </Badge>
    );
}

function formatDate(d: Date | string | null): string {
    if (!d) return "—";
    return toDate(d).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

function jurisdictionDeadline(j: Jurisdiction): string {
    if (j === "China") return "15 working days (PIPL)";
    if (j === "Saudi Arabia") return "30 days (PDPL)";
    return "30 days";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiCard({
    icon: Icon,
    label,
    value,
    colour = "text-primary",
    danger,
}: {
    icon: React.ElementType;
    label: string;
    value: string | number;
    colour?: string;
    danger?: boolean;
}) {
    const bg = colour.replace("text-", "bg-").replace(/(-\d+)$/, "$1/10");
    return (
        <Card className={`djac-stat-card${danger && Number(value) > 0 ? " border-red-500/40" : ""}`}>
            <CardContent className="flex items-center gap-4 p-5">
                <div className={`rounded-lg p-2.5 ${bg}`}>
                    <Icon className={`h-5 w-5 ${colour}`} />
                </div>
                <div>
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className={`text-2xl font-bold ${danger && Number(value) > 0 ? "text-red-500" : ""}`}>
                        {value}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DataSubjectRequests() {
    const { t } = useLocale();
    usePageTitle(t("dsr.pageTitle", "DSR Tracker"));

    const [filterStatus, setFilterStatus] = useState<Status | "all">("all");
    const [filterType, setFilterType] = useState<RequestType | "all">("all");
    const [filterJurisdiction, setFilterJurisdiction] = useState<Jurisdiction | "all">("all");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [patchingId, setPatchingId] = useState<number | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);

    // Form state
    const [form, setForm] = useState({
        requestType: "access" as RequestType,
        jurisdiction: "Other" as Jurisdiction,
        requesterName: "",
        requesterEmail: "",
        description: "",
        priority: "normal" as Priority,
        notes: "",
    });

    // tRPC
    const listQuery = trpc.dsr.list.useQuery(
        {
            ...(filterStatus !== "all" ? { status: filterStatus } : {}),
            ...(filterType !== "all" ? { requestType: filterType } : {}),
            ...(filterJurisdiction !== "all" ? { jurisdiction: filterJurisdiction } : {}),
        },
        { refetchOnWindowFocus: false }
    );
    const summaryQuery = trpc.dsr.summary.useQuery(undefined, {
        refetchOnWindowFocus: false,
    });
    const utils = trpc.useUtils();

    const createMutation = trpc.dsr.create.useMutation({
        onSuccess: () => {
            toast.success(t("dsr.created", "DSR request logged successfully"));
            void utils.dsr.list.invalidate();
            void utils.dsr.summary.invalidate();
            setDialogOpen(false);
            resetForm();
        },
        onError: (err) => toast.error(err.message),
        onSettled: () => setSaving(false),
    });

    const patchMutation = trpc.dsr.patch.useMutation({
        onSuccess: () => {
            void utils.dsr.list.invalidate();
            void utils.dsr.summary.invalidate();
        },
        onError: (err) => toast.error(err.message),
        onSettled: () => setPatchingId(null),
    });

    const removeMutation = trpc.dsr.remove.useMutation({
        onSuccess: () => {
            toast.success(t("dsr.deleted", "DSR request removed"));
            void utils.dsr.list.invalidate();
            void utils.dsr.summary.invalidate();
        },
        onError: (err) => toast.error(err.message),
        onSettled: () => setDeletingId(null),
    });

    function resetForm() {
        setForm({
            requestType: "access",
            jurisdiction: "Other",
            requesterName: "",
            requesterEmail: "",
            description: "",
            priority: "normal",
            notes: "",
        });
    }

    function handleCreate() {
        if (!form.requesterName.trim() || !form.requesterEmail.trim()) {
            toast.error("Requester name and email are required");
            return;
        }
        setSaving(true);
        createMutation.mutate({
            requestType: form.requestType,
            jurisdiction: form.jurisdiction,
            requesterName: form.requesterName.trim(),
            requesterEmail: form.requesterEmail.trim(),
            description: form.description.trim() || undefined,
            priority: form.priority,
            notes: form.notes.trim() || undefined,
        });
    }

    function handleStatusChange(id: number, status: Status) {
        setPatchingId(id);
        patchMutation.mutate({
            id,
            status,
            ...(CLOSED_STATUSES.includes(status)
                ? { completedAt: new Date().toISOString() }
                : { completedAt: null }),
        });
    }

    function handleDelete(id: number) {
        setDeletingId(id);
        removeMutation.mutate(id);
    }

    const items: DsrItem[] = useMemo(
        () => (listQuery.data as DsrItem[] | undefined) ?? [],
        [listQuery.data]
    );

    const summary = summaryQuery.data;
    const totalItems = summary?.total ?? items.length;
    const openItems = summary?.open ?? items.filter((d) => OPEN_STATUSES.includes(d.status)).length;
    const overdueItems = summary?.overdue ?? items.filter((d) => {
        if (CLOSED_STATUSES.includes(d.status)) return false;
        return toDate(d.dueDate) < new Date();
    }).length;
    const dueThisWeek = items.filter((d) => {
        if (CLOSED_STATUSES.includes(d.status)) return false;
        const days = daysUntilDue(d.dueDate);
        return days >= 0 && days <= 7;
    }).length;

    const isLoading = listQuery.isLoading;

    // ─── Render ──────────────────────────────────────────────────────────────

    return (
        <div className="djac-page">
            {/* Page Header */}
            <div className="djac-page-header">
                <div>
                    <h1 className="djac-page-title">
                        <UserCheck className="inline-block h-7 w-7 mr-2 text-primary align-middle" />
                        {t("dsr.pageTitle", "Data Subject Request Tracker")}
                    </h1>
                    <p className="djac-page-subtitle">
                        {t(
                            "dsr.pageSubtitle",
                            "Manage PIPL (China) and PDPL (Saudi Arabia) data subject rights requests with deadline tracking."
                        )}
                    </p>
                </div>
                <Button
                    onClick={() => {
                        resetForm();
                        setDialogOpen(true);
                    }}
                    className="gap-2"
                >
                    <Plus className="h-4 w-4" />
                    {t("dsr.logRequest", "Log Request")}
                </Button>
            </div>

            {/* KPI Cards */}
            <div className="djac-stat-grid grid-cols-2 lg:grid-cols-4 mb-6">
                <KpiCard
                    icon={UserCheck}
                    label={t("dsr.total", "Total Requests")}
                    value={totalItems}
                    colour="text-primary"
                />
                <KpiCard
                    icon={Users}
                    label={t("dsr.open", "Open")}
                    value={openItems}
                    colour="text-blue-500"
                />
                <KpiCard
                    icon={Clock}
                    label={t("dsr.dueThisWeek", "Due This Week")}
                    value={dueThisWeek}
                    colour="text-orange-500"
                />
                <KpiCard
                    icon={AlertTriangle}
                    label={t("dsr.overdue", "Overdue")}
                    value={overdueItems}
                    colour="text-red-500"
                    danger
                />
            </div>

            {summaryQuery.isError && (
                <Card className="mb-6">
                    <CardContent className="py-4 flex items-center justify-between gap-3">
                        <p className="text-sm text-muted-foreground">
                            {summaryQuery.error?.message ?? t("dsr.summaryLoadError", "Failed to load DSR summary metrics.")}
                        </p>
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => {
                                void summaryQuery.refetch();
                            }}
                        >
                            {t("common.retry", "Retry")}
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Filter Bar */}
            <Card className="mb-6">
                <CardContent className="p-4">
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="text-sm font-medium text-muted-foreground shrink-0">
                            {t("dsr.filter", "Filter:")}
                        </span>

                        {/* Status filter */}
                        <Select
                            value={filterStatus}
                            onValueChange={(v) => setFilterStatus(v as Status | "all")}
                        >
                            <SelectTrigger className="w-36 h-8 text-xs">
                                <SelectValue placeholder="All Statuses" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                {STATUSES.map((s) => (
                                    <SelectItem key={s} value={s}>
                                        {STATUS_LABELS[s]}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Request type filter */}
                        <Select
                            value={filterType}
                            onValueChange={(v) => setFilterType(v as RequestType | "all")}
                        >
                            <SelectTrigger className="w-36 h-8 text-xs">
                                <SelectValue placeholder="All Types" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                {REQUEST_TYPES.map((rt) => (
                                    <SelectItem key={rt} value={rt}>
                                        {REQUEST_TYPE_LABELS[rt]}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Jurisdiction filter */}
                        <Select
                            value={filterJurisdiction}
                            onValueChange={(v) => setFilterJurisdiction(v as Jurisdiction | "all")}
                        >
                            <SelectTrigger className="w-36 h-8 text-xs">
                                <SelectValue placeholder="All Jurisdictions" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Jurisdictions</SelectItem>
                                {JURISDICTIONS.map((j) => (
                                    <SelectItem key={j} value={j}>
                                        {j}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {(filterStatus !== "all" ||
                            filterType !== "all" ||
                            filterJurisdiction !== "all") && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 text-xs text-muted-foreground"
                                    onClick={() => {
                                        setFilterStatus("all");
                                        setFilterType("all");
                                        setFilterJurisdiction("all");
                                    }}
                                >
                                    Clear filters
                                </Button>
                            )}
                    </div>
                </CardContent>
            </Card>

            {/* DSR Table */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold">
                        {t("dsr.pageTitle", "DSR Requests")}
                        {!isLoading && (
                            <span className="ml-2 text-sm font-normal text-muted-foreground">
                                ({items.length})
                            </span>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {listQuery.isError ? (
                        <div className="djac-empty-state flex flex-col items-center justify-center py-20 gap-4">
                            <UserCheck className="h-14 w-14 text-muted-foreground/40" />
                            <div className="text-center">
                                <p className="text-lg font-semibold text-muted-foreground">
                                    {listQuery.error?.message ?? t("dsr.loadError", "Failed to load DSR requests")}
                                </p>
                                <p className="text-sm text-muted-foreground/70 mt-1">
                                    {t("dsr.loadErrorSub", "Retry to fetch requests again.")}
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                className="gap-2 mt-2"
                                onClick={() => {
                                    void listQuery.refetch();
                                }}
                            >
                                {t("common.retry", "Retry")}
                            </Button>
                        </div>
                    ) : isLoading ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : items.length === 0 ? (
                        <div className="djac-empty-state flex flex-col items-center justify-center py-20 gap-4">
                            <UserCheck className="h-14 w-14 text-muted-foreground/40" />
                            <div className="text-center">
                                <p className="text-lg font-semibold text-muted-foreground">
                                    {t("dsr.emptyTitle", "No DSR requests found")}
                                </p>
                                <p className="text-sm text-muted-foreground/70 mt-1">
                                    {t(
                                        "dsr.emptySub",
                                        "Log incoming data subject requests to track compliance deadlines."
                                    )}
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                className="gap-2 mt-2"
                                onClick={() => {
                                    resetForm();
                                    setDialogOpen(true);
                                }}
                            >
                                <Plus className="h-4 w-4" />
                                {t("dsr.logRequest", "Log Request")}
                            </Button>
                        </div>
                    ) : (
                        <div className="djac-table-container overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[22%]">
                                            {t("dsr.colRequester", "Requester")}
                                        </TableHead>
                                        <TableHead>{t("dsr.colType", "Type")}</TableHead>
                                        <TableHead>{t("dsr.colJurisdiction", "Jurisdiction")}</TableHead>
                                        <TableHead>{t("dsr.colPriority", "Priority")}</TableHead>
                                        <TableHead>{t("dsr.colStatus", "Status")}</TableHead>
                                        <TableHead>{t("dsr.colDue", "Due Date")}</TableHead>
                                        <TableHead className="w-[5%]">{t("dsr.colActions", "Actions")}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {items.map((item) => (
                                        <TableRow key={item.id}>
                                            {/* Requester */}
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium text-sm">
                                                        {item.requesterName}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {item.requesterEmail}
                                                    </p>
                                                    {item.description && (
                                                        <p className="text-xs text-muted-foreground/70 mt-0.5 line-clamp-1">
                                                            {item.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </TableCell>

                                            {/* Type */}
                                            <TableCell>
                                                <Badge variant="outline" className="text-xs">
                                                    {REQUEST_TYPE_LABELS[item.requestType]}
                                                </Badge>
                                            </TableCell>

                                            {/* Jurisdiction */}
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={`text-xs ${JURISDICTION_COLOURS[item.jurisdiction]}`}
                                                >
                                                    {item.jurisdiction}
                                                </Badge>
                                            </TableCell>

                                            {/* Priority */}
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={`text-xs capitalize ${PRIORITY_COLOURS[item.priority]}`}
                                                >
                                                    {item.priority}
                                                </Badge>
                                            </TableCell>

                                            {/* Status — inline select */}
                                            <TableCell>
                                                <Select
                                                    value={item.status}
                                                    onValueChange={(v) =>
                                                        handleStatusChange(item.id, v as Status)
                                                    }
                                                    disabled={patchingId === item.id}
                                                >
                                                    <SelectTrigger
                                                        className={`h-7 w-32 text-xs border ${STATUS_COLOURS[item.status]}`}
                                                    >
                                                        {patchingId === item.id ? (
                                                            <Loader2 className="h-3 w-3 animate-spin" />
                                                        ) : (
                                                            <SelectValue />
                                                        )}
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {STATUSES.map((s) => (
                                                            <SelectItem key={s} value={s}>
                                                                {STATUS_LABELS[s]}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>

                                            {/* Due Date + countdown badge */}
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-sm text-muted-foreground">
                                                        {formatDate(item.dueDate)}
                                                    </span>
                                                    {dueDateBadge(item)}
                                                </div>
                                            </TableCell>

                                            {/* Actions */}
                                            <TableCell>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                            disabled={deletingId === item.id}
                                                            onClick={() => handleDelete(item.id)}
                                                        >
                                                            {deletingId === item.id ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <Trash2 className="h-4 w-4" />
                                                            )}
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Remove</TooltipContent>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Create DSR Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            {t("dsr.logRequest", "Log DSR Request")}
                        </DialogTitle>
                        <DialogDescription>
                            {t(
                                "dsr.dialogDesc",
                                "Record a new data subject request. The response deadline will be calculated automatically."
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        {/* Requester Name */}
                        <div className="space-y-1.5">
                            <Label htmlFor="dsr-name">
                                {t("dsr.requesterName", "Requester Name")} *
                            </Label>
                            <Input
                                id="dsr-name"
                                placeholder="Full name of the data subject"
                                value={form.requesterName}
                                onChange={(e) =>
                                    setForm((f) => ({ ...f, requesterName: e.target.value }))
                                }
                            />
                        </div>

                        {/* Requester Email */}
                        <div className="space-y-1.5">
                            <Label htmlFor="dsr-email">
                                {t("dsr.requesterEmail", "Requester Email")} *
                            </Label>
                            <Input
                                id="dsr-email"
                                type="email"
                                placeholder="subject@example.com"
                                value={form.requesterEmail}
                                onChange={(e) =>
                                    setForm((f) => ({ ...f, requesterEmail: e.target.value }))
                                }
                            />
                        </div>

                        {/* Type + Jurisdiction */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label>{t("dsr.requestType", "Request Type")}</Label>
                                <Select
                                    value={form.requestType}
                                    onValueChange={(v) =>
                                        setForm((f) => ({ ...f, requestType: v as RequestType }))
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {REQUEST_TYPES.map((rt) => (
                                            <SelectItem key={rt} value={rt}>
                                                {REQUEST_TYPE_LABELS[rt]}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label>{t("dsr.jurisdiction", "Jurisdiction")}</Label>
                                <Select
                                    value={form.jurisdiction}
                                    onValueChange={(v) =>
                                        setForm((f) => ({ ...f, jurisdiction: v as Jurisdiction }))
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {JURISDICTIONS.map((j) => (
                                            <SelectItem key={j} value={j}>
                                                {j}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Deadline hint */}
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5 bg-muted/40 rounded px-3 py-2">
                            <Clock className="h-3.5 w-3.5 shrink-0" />
                            Response deadline: <strong>{jurisdictionDeadline(form.jurisdiction)}</strong>
                        </p>

                        {/* Priority */}
                        <div className="space-y-1.5">
                            <Label>{t("dsr.priority", "Priority")}</Label>
                            <Select
                                value={form.priority}
                                onValueChange={(v) =>
                                    setForm((f) => ({ ...f, priority: v as Priority }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {PRIORITIES.map((p) => (
                                        <SelectItem key={p} value={p} className="capitalize">
                                            {p}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Description */}
                        <div className="space-y-1.5">
                            <Label htmlFor="dsr-desc">
                                {t("dsr.description", "Description")}
                                <span className="text-muted-foreground ml-1">(optional)</span>
                            </Label>
                            <Textarea
                                id="dsr-desc"
                                placeholder="What is the requester asking for?"
                                rows={3}
                                value={form.description}
                                onChange={(e) =>
                                    setForm((f) => ({ ...f, description: e.target.value }))
                                }
                            />
                        </div>

                        {/* Notes */}
                        <div className="space-y-1.5">
                            <Label htmlFor="dsr-notes">
                                {t("dsr.notes", "Internal Notes")}
                                <span className="text-muted-foreground ml-1">(optional)</span>
                            </Label>
                            <Textarea
                                id="dsr-notes"
                                placeholder="Internal handling notes..."
                                rows={2}
                                value={form.notes}
                                onChange={(e) =>
                                    setForm((f) => ({ ...f, notes: e.target.value }))
                                }
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDialogOpen(false)}
                            disabled={saving}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleCreate} disabled={saving} className="gap-2">
                            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                            {saving
                                ? t("dsr.saving", "Saving…")
                                : t("dsr.logRequest", "Log Request")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
