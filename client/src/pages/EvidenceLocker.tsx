/**
 * EvidenceLocker.tsx — Phase 37: Compliance Evidence Locker
 *
 * Features:
 *   - KPI cards: total items, audit-linked, critical source types, last added
 *   - Filter bar: by source type
 *   - Evidence cards/table with title (external link), source badge, date, delete
 *   - Add Evidence dialog: title, url, sourceType, sourceId, description, tags
 *   - Empty state with CTA
 *   - Full in-memory fallback (no DB required)
 */

import { useState, useMemo } from "react";
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
    Calendar,
    ExternalLink,
    FolderCheck,
    FolderSearch,
    Loader2,
    Plus,
    Trash2,
} from "lucide-react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

type SourceType =
    | "audit_schedule"
    | "policy"
    | "risk"
    | "gap"
    | "remediation"
    | "ctem_asset"
    | "incident"
    | "general";

interface EvidenceItem {
    id: number;
    organizationId: number;
    sourceType: SourceType;
    sourceId: number | null;
    title: string;
    url: string;
    description: string | null;
    addedByUserId: number | null;
    tags: string | null;
    createdAt: Date | string;
    updatedAt: Date | string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
    audit_schedule: "Audit",
    policy: "Policy",
    risk: "Risk",
    gap: "Gap",
    remediation: "Remediation",
    ctem_asset: "CTEM",
    incident: "Incident",
    general: "General",
};

const SOURCE_TYPE_COLOURS: Record<SourceType, string> = {
    audit_schedule: "bg-blue-500/10 text-blue-500 border-blue-500/30",
    policy: "bg-purple-500/10 text-purple-500 border-purple-500/30",
    risk: "bg-red-500/10 text-red-500 border-red-500/30",
    gap: "bg-orange-500/10 text-orange-500 border-orange-500/30",
    remediation: "bg-green-500/10 text-green-500 border-green-500/30",
    ctem_asset: "bg-cyan-500/10 text-cyan-500 border-cyan-500/30",
    incident: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
    general: "bg-slate-500/10 text-slate-400 border-slate-500/30",
};

const ALL_SOURCE_TYPES: SourceType[] = [
    "audit_schedule",
    "policy",
    "risk",
    "gap",
    "remediation",
    "ctem_asset",
    "incident",
    "general",
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiCard({
    icon: Icon,
    label,
    value,
    colour = "text-primary",
}: {
    icon: React.ElementType;
    label: string;
    value: string | number;
    colour?: string;
}) {
    return (
        <Card className="djac-stat-card">
            <CardContent className="flex items-center gap-4 p-5">
                <div
                    className={`rounded-lg p-2.5 ${colour
                        .replace("text-", "bg-")
                        .replace(/(-\d+)$/, "$1/10")}`}
                >
                    <Icon className={`h-5 w-5 ${colour}`} />
                </div>
                <div>
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="text-2xl font-bold">{value}</p>
                </div>
            </CardContent>
        </Card>
    );
}

function SourceBadge({ sourceType }: { sourceType: SourceType }) {
    return (
        <Badge
            variant="outline"
            className={`text-xs font-medium ${SOURCE_TYPE_COLOURS[sourceType]}`}
        >
            {SOURCE_TYPE_LABELS[sourceType]}
        </Badge>
    );
}

function formatDate(d: Date | string | null): string {
    if (!d) return "—";
    const date = typeof d === "string" ? new Date(d) : d;
    return date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function EvidenceLocker() {
    const { t } = useLocale();
    usePageTitle(t("evidence.pageTitle", "Evidence Locker"));

    const [filterSource, setFilterSource] = useState<SourceType | "all">("all");
    const [dialogOpen, setDialogOpen] = useState(false);

    // Form state
    const [form, setForm] = useState({
        title: "",
        url: "",
        sourceType: "general" as SourceType,
        sourceId: "",
        description: "",
        tags: "",
    });
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    // tRPC queries
    const listQuery = trpc.evidence.list.useQuery(
        filterSource !== "all" ? { sourceType: filterSource } : undefined,
        { refetchOnWindowFocus: false }
    );
    const utils = trpc.useUtils();

    const addMutation = trpc.evidence.add.useMutation({
        onSuccess: () => {
            toast.success(t("evidence.saved", "Evidence added successfully"));
            void utils.evidence.list.invalidate();
            setDialogOpen(false);
            resetForm();
        },
        onError: (err) => {
            toast.error(err.message);
        },
        onSettled: () => setSaving(false),
    });

    const removeMutation = trpc.evidence.remove.useMutation({
        onSuccess: () => {
            toast.success(t("evidence.deleted", "Evidence removed"));
            void utils.evidence.list.invalidate();
        },
        onError: (err) => {
            toast.error(err.message);
        },
        onSettled: () => setDeletingId(null),
    });

    function resetForm() {
        setForm({
            title: "",
            url: "",
            sourceType: "general",
            sourceId: "",
            description: "",
            tags: "",
        });
    }

    function handleAdd() {
        if (!form.title.trim() || !form.url.trim()) {
            toast.error("Title and URL are required");
            return;
        }
        setSaving(true);
        addMutation.mutate({
            title: form.title.trim(),
            url: form.url.trim(),
            sourceType: form.sourceType,
            sourceId: form.sourceId ? Number(form.sourceId) : undefined,
            description: form.description.trim() || undefined,
            tags: form.tags.trim() || undefined,
        });
    }

    function handleDelete(id: number) {
        setDeletingId(id);
        removeMutation.mutate(id);
    }

    const items: EvidenceItem[] = useMemo(
        () => (listQuery.data as EvidenceItem[] | undefined) ?? [],
        [listQuery.data]
    );

    // KPI calculations
    const totalItems = items.length;
    const auditLinked = items.filter((e) => e.sourceType === "audit_schedule").length;
    const criticalSources = items.filter((e) =>
        ["risk", "incident", "ctem_asset"].includes(e.sourceType)
    ).length;
    const lastAdded = items.length > 0 ? formatDate(items[0].createdAt) : "—";

    const isLoading = listQuery.isLoading;

    // ─── Render ──────────────────────────────────────────────────────────────

    return (
        <div className="djac-page">
            {/* Page Header */}
            <div className="djac-page-header">
                <div>
                    <h1 className="djac-page-title">
                        <FolderCheck className="inline-block h-7 w-7 mr-2 text-primary align-middle" />
                        {t("evidence.pageTitle", "Compliance Evidence Locker")}
                    </h1>
                    <p className="djac-page-subtitle">
                        {t(
                            "evidence.pageSubtitle",
                            "Attach and track URL-based evidence documents to audits, policies, risks, and more."
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
                    {t("evidence.addEvidence", "Add Evidence")}
                </Button>
            </div>

            {/* KPI Cards */}
            <div className="djac-stat-grid grid-cols-2 lg:grid-cols-4 mb-6">
                <KpiCard
                    icon={FolderCheck}
                    label={t("evidence.total", "Total Evidence Items")}
                    value={totalItems}
                    colour="text-primary"
                />
                <KpiCard
                    icon={Calendar}
                    label={t("evidence.linkedAudits", "Linked to Audits")}
                    value={auditLinked}
                    colour="text-blue-500"
                />
                <KpiCard
                    icon={ExternalLink}
                    label={t("evidence.criticalSources", "Critical Sources")}
                    value={criticalSources}
                    colour="text-red-500"
                />
                <KpiCard
                    icon={Calendar}
                    label={t("evidence.lastAdded", "Last Added")}
                    value={lastAdded}
                    colour="text-green-500"
                />
            </div>

            {/* Filter Bar */}
            <Card className="mb-6">
                <CardContent className="p-4">
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="text-sm font-medium text-muted-foreground">
                            {t("evidence.filterBySource", "Filter by source:")}
                        </span>
                        <div className="flex flex-wrap gap-2">
                            <Button
                                variant={filterSource === "all" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setFilterSource("all")}
                            >
                                {t("evidence.filterAll", "All")}
                            </Button>
                            {ALL_SOURCE_TYPES.map((st) => (
                                <Button
                                    key={st}
                                    variant={filterSource === st ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setFilterSource(st)}
                                >
                                    {SOURCE_TYPE_LABELS[st]}
                                </Button>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Evidence Table */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold">
                        {filterSource === "all"
                            ? t("evidence.pageTitle", "Evidence Locker")
                            : `${SOURCE_TYPE_LABELS[filterSource as SourceType]} Evidence`}
                        {!isLoading && (
                            <span className="ml-2 text-sm font-normal text-muted-foreground">
                                ({totalItems})
                            </span>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {listQuery.isError ? (
                        <div className="djac-empty-state flex flex-col items-center justify-center py-20 gap-4">
                            <FolderSearch className="h-14 w-14 text-muted-foreground/40" />
                            <div className="text-center">
                                <p className="text-lg font-semibold text-muted-foreground">
                                    {t("evidence.loadError", "Failed to load evidence items")}
                                </p>
                                <p className="text-sm text-muted-foreground/70 mt-1">
                                    {t("evidence.loadErrorSub", "Retry to fetch your evidence library again.")}
                                </p>
                            </div>
                            <Button variant="outline" className="gap-2 mt-2" onClick={() => { void listQuery.refetch(); }}>
                                {t("common.retry", "Retry")}
                            </Button>
                        </div>
                    ) : isLoading ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : items.length === 0 ? (
                        /* Empty State */
                        <div className="djac-empty-state flex flex-col items-center justify-center py-20 gap-4">
                            <FolderSearch className="h-14 w-14 text-muted-foreground/40" />
                            <div className="text-center">
                                <p className="text-lg font-semibold text-muted-foreground">
                                    {t("evidence.emptyTitle", "No evidence linked yet")}
                                </p>
                                <p className="text-sm text-muted-foreground/70 mt-1">
                                    {t(
                                        "evidence.emptySub",
                                        "Add URL-based documents, reports, or certificates to track compliance evidence."
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
                                {t("evidence.addEvidence", "Add Evidence")}
                            </Button>
                        </div>
                    ) : (
                        <div className="djac-table-container overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[35%]">
                                            {t("evidence.colTitle", "Title")}
                                        </TableHead>
                                        <TableHead>
                                            {t("evidence.colSource", "Source Type")}
                                        </TableHead>
                                        <TableHead className="w-[20%]">
                                            {t("evidence.colDate", "Added")}
                                        </TableHead>
                                        <TableHead className="w-[5%]">
                                            {t("evidence.colActions", "Actions")}
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {items.map((item) => (
                                        <TableRow key={item.id}>
                                            {/* Title + URL */}
                                            <TableCell>
                                                <div className="space-y-1">
                                                    <a
                                                        href={item.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline text-sm"
                                                    >
                                                        {item.title}
                                                        <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                                                    </a>
                                                    {item.description && (
                                                        <p className="text-xs text-muted-foreground line-clamp-2">
                                                            {item.description}
                                                        </p>
                                                    )}
                                                    {item.tags && (
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            {item.tags
                                                                .split(",")
                                                                .map((tag) => tag.trim())
                                                                .filter(Boolean)
                                                                .map((tag) => (
                                                                    <Badge
                                                                        key={tag}
                                                                        variant="secondary"
                                                                        className="text-[10px] px-1.5 py-0"
                                                                    >
                                                                        {tag}
                                                                    </Badge>
                                                                ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>

                                            {/* Source */}
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    <SourceBadge
                                                        sourceType={item.sourceType}
                                                    />
                                                    {item.sourceId && (
                                                        <span className="text-xs text-muted-foreground">
                                                            ID: {item.sourceId}
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>

                                            {/* Date */}
                                            <TableCell className="text-sm text-muted-foreground">
                                                {formatDate(item.createdAt)}
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
                                                            onClick={() =>
                                                                handleDelete(item.id)
                                                            }
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

            {/* Add Evidence Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            {t("evidence.addEvidence", "Add Evidence")}
                        </DialogTitle>
                        <DialogDescription>
                            {t(
                                "evidence.pageSubtitle",
                                "Attach a URL-based evidence document to a compliance object."
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        {/* Title */}
                        <div className="space-y-1.5">
                            <Label htmlFor="ev-title">
                                {t("evidence.addTitle", "Title")} *
                            </Label>
                            <Input
                                id="ev-title"
                                placeholder="e.g. Q2 Audit Report – PDPL Compliance"
                                value={form.title}
                                onChange={(e) =>
                                    setForm((f) => ({ ...f, title: e.target.value }))
                                }
                            />
                        </div>

                        {/* URL */}
                        <div className="space-y-1.5">
                            <Label htmlFor="ev-url">
                                {t("evidence.addUrl", "Document URL")} *
                            </Label>
                            <Input
                                id="ev-url"
                                type="url"
                                placeholder="https://..."
                                value={form.url}
                                onChange={(e) =>
                                    setForm((f) => ({ ...f, url: e.target.value }))
                                }
                            />
                        </div>

                        {/* Source Type + Source ID */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label>{t("evidence.addSourceType", "Source Type")}</Label>
                                <Select
                                    value={form.sourceType}
                                    onValueChange={(v) =>
                                        setForm((f) => ({
                                            ...f,
                                            sourceType: v as SourceType,
                                        }))
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ALL_SOURCE_TYPES.map((st) => (
                                            <SelectItem key={st} value={st}>
                                                {SOURCE_TYPE_LABELS[st]}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="ev-sid">
                                    {t("evidence.addSourceId", "Source ID")}
                                    <span className="text-muted-foreground ml-1">(optional)</span>
                                </Label>
                                <Input
                                    id="ev-sid"
                                    type="number"
                                    min={1}
                                    placeholder="e.g. 42"
                                    value={form.sourceId}
                                    onChange={(e) =>
                                        setForm((f) => ({ ...f, sourceId: e.target.value }))
                                    }
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-1.5">
                            <Label htmlFor="ev-desc">
                                {t("evidence.addDescription", "Description")}
                                <span className="text-muted-foreground ml-1">(optional)</span>
                            </Label>
                            <Textarea
                                id="ev-desc"
                                placeholder="Short description of the evidence document..."
                                rows={3}
                                value={form.description}
                                onChange={(e) =>
                                    setForm((f) => ({ ...f, description: e.target.value }))
                                }
                            />
                        </div>

                        {/* Tags */}
                        <div className="space-y-1.5">
                            <Label htmlFor="ev-tags">
                                {t("evidence.addTags", "Tags")}
                                <span className="text-muted-foreground ml-1">(optional, comma-separated)</span>
                            </Label>
                            <Input
                                id="ev-tags"
                                placeholder="e.g. pipl, china, q2-2025"
                                value={form.tags}
                                onChange={(e) =>
                                    setForm((f) => ({ ...f, tags: e.target.value }))
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
                        <Button onClick={handleAdd} disabled={saving} className="gap-2">
                            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                            {saving
                                ? t("evidence.saving", "Saving…")
                                : t("evidence.addEvidence", "Add Evidence")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// Needed for JSX element type inference
import type React from "react";
