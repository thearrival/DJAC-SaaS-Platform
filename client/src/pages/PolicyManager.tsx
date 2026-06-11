/**
 * PolicyManager.tsx — Phase 31
 *
 * Internal policy document registry — create, track, and review the
 * organisation's compliance policies, standards, procedures, and guidelines.
 *
 * Features:
 *   • 5-stage lifecycle: draft → under_review → approved → active → retired
 *   • Policy type classification: policy / standard / procedure / guideline
 *   • Framework & control-reference mapping (PIPL, CSL, PDPL, NCA ECC …)
 *   • Owner assignment, review cycle (3 / 6 / 12 / 24 months), overdue alerts
 *   • Filter by type, status, framework; full-text search
 *   • Stat cards: Total / Active / Draft / Under Review / Overdue
 *   • Create / Edit dialog with 12+ fields
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
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
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
import { Checkbox } from "@/components/ui/checkbox";
import {
    BookOpen,
    CalendarClock,
    ExternalLink,
    FileCheck,
    FilePen,
    Pencil,
    Plus,
    RefreshCw,
    Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { sounds } from "@/lib/sounds";

// ─── Constants ────────────────────────────────────────────────────────────────

const POLICY_TYPES = ["policy", "standard", "procedure", "guideline"] as const;
const POLICY_STATUSES = ["draft", "under_review", "approved", "active", "retired"] as const;
const FRAMEWORKS = ["PIPL", "CSL", "DSL", "PDPL", "NCA ECC", "NCA CSCC", "ISO27001", "GDPR"] as const;

type PolicyType = typeof POLICY_TYPES[number];
type PolicyStatus = typeof POLICY_STATUSES[number];

// Status → colour mapping
const STATUS_COLORS: Record<PolicyStatus, string> = {
    draft: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300",
    under_review: "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300",
    approved: "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300",
    active: "bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300",
    retired: "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400",
};

// Policy type → colour
const TYPE_COLORS: Record<PolicyType, string> = {
    policy: "bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300",
    standard: "bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300",
    procedure: "bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300",
    guideline: "bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300",
};

// Valid lifecycle transitions
const STATUS_TRANSITIONS: Record<PolicyStatus, PolicyStatus[]> = {
    draft: ["under_review", "retired"],
    under_review: ["approved", "draft", "retired"],
    approved: ["active", "under_review", "retired"],
    active: ["under_review", "retired"],
    retired: [],
};

// ─── Helper utilities ─────────────────────────────────────────────────────────

function isOverdue(nextReviewAt: Date | string | null | undefined): boolean {
    if (!nextReviewAt) return false;
    return new Date(nextReviewAt) < new Date();
}

function parseJsonArray(v: string | null | undefined): string[] {
    if (!v) return [];
    try { return JSON.parse(v) as string[]; }
    catch { return []; }
}

function formatDate(d: Date | string | null | undefined): string {
    if (!d) return "—";
    const date = new Date(d);
    if (isNaN(date.getTime())) return "—";
    return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

// ─── Stat card ────────────────────────────────────────────────────────────────

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

// ─── Policy type / status badges ─────────────────────────────────────────────

function TypeBadge({ type, label }: { type: PolicyType; label: string }) {
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${TYPE_COLORS[type]}`}>
            {label}
        </span>
    );
}

function StatusBadge({ status, label }: { status: PolicyStatus; label: string }) {
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[status]}`}>
            {label}
        </span>
    );
}

// ─── Main type (returned by tRPC list) ───────────────────────────────────────

type PolicyRow = {
    id: number;
    organizationId: number;
    policyCode: string | null;
    title: string;
    description: string | null;
    policyType: PolicyType;
    frameworks: string | null;
    controlReferences: string | null;
    status: PolicyStatus;
    ownerId: number | null;
    reviewCycleMonths: number;
    lastApprovedAt: Date | string | null;
    nextReviewAt: Date | string | null;
    version: string;
    documentUrl: string | null;
    notes: string | null;
    createdAt: Date | string;
    updatedAt: Date | string;
};

// ─── Form state ───────────────────────────────────────────────────────────────

type FormState = {
    policyCode: string;
    title: string;
    description: string;
    policyType: PolicyType;
    frameworks: string[];
    controlReferences: string;  // comma-separated input
    status: PolicyStatus;
    ownerId: string;
    reviewCycleMonths: string;
    nextReviewAt: string;
    version: string;
    documentUrl: string;
    notes: string;
};

const DEFAULT_FORM: FormState = {
    policyCode: "",
    title: "",
    description: "",
    policyType: "policy",
    frameworks: [],
    controlReferences: "",
    status: "draft",
    ownerId: "",
    reviewCycleMonths: "12",
    nextReviewAt: "",
    version: "1.0",
    documentUrl: "",
    notes: "",
};

// ─── PolicyManager ────────────────────────────────────────────────────────────

export default function PolicyManager() {
    const { t } = useLocale();
    usePageTitle(t("policy.pageTitle", "Policy Manager"));

    // ── tRPC ──────────────────────────────────────────────────────────────────
    const utils = trpc.useUtils();
    const listQ = trpc.policyManager.list.useQuery(undefined, { staleTime: 30_000 });

    const createM = trpc.policyManager.create.useMutation({
        onSuccess: () => {
            utils.policyManager.list.invalidate().catch(() => undefined);
            toast.success(t("policy.created", "Policy created"));
            sounds.success();
            setDialogOpen(false);
        },
        onError: (err) => toast.error(err.message),
    });
    const patchM = trpc.policyManager.patch.useMutation({
        onSuccess: () => {
            utils.policyManager.list.invalidate().catch(() => undefined);
            toast.success(t("policy.updated", "Policy updated"));
            sounds.success();
            setDialogOpen(false);
        },
        onError: (err) => toast.error(err.message),
    });
    const updateStatusM = trpc.policyManager.updateStatus.useMutation({
        onSuccess: () => {
            utils.policyManager.list.invalidate().catch(() => undefined);
            toast.success(t("policy.updated", "Policy updated"));
            sounds.success();
        },
        onError: (err) => toast.error(err.message),
    });
    const removeM = trpc.policyManager.remove.useMutation({
        onSuccess: () => {
            utils.policyManager.list.invalidate().catch(() => undefined);
            toast.success(t("policy.deleted", "Policy deleted"));
            sounds.success();
            setDeleteTarget(null);
        },
        onError: (err) => toast.error(err.message),
    });

    // ── State ─────────────────────────────────────────────────────────────────
    const [search, setSearch] = useState("");
    const [filterType, setFilterType] = useState<PolicyType | "all">("all");
    const [filterStatus, setFilterStatus] = useState<PolicyStatus | "all">("all");
    const [filterFW, setFilterFW] = useState<string>("all");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<PolicyRow | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<PolicyRow | null>(null);
    const [form, setForm] = useState<FormState>(DEFAULT_FORM);

    // ── Helpers ───────────────────────────────────────────────────────────────
    const policies: PolicyRow[] = (listQ.data as unknown as PolicyRow[]) ?? [];

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return policies.filter(p => {
            if (filterType !== "all" && p.policyType !== filterType) return false;
            if (filterStatus !== "all" && p.status !== filterStatus) return false;
            if (filterFW !== "all") {
                const fws = parseJsonArray(p.frameworks);
                if (!fws.includes(filterFW)) return false;
            }
            if (q) {
                const fields = [p.title, p.policyCode, p.description, p.notes].join(" ").toLowerCase();
                if (!fields.includes(q)) return false;
            }
            return true;
        });
    }, [policies, search, filterType, filterStatus, filterFW]);

    const stats = useMemo(() => ({
        total: policies.length,
        active: policies.filter(p => p.status === "active").length,
        draft: policies.filter(p => p.status === "draft").length,
        underReview: policies.filter(p => p.status === "under_review").length,
        overdue: policies.filter(p => isOverdue(p.nextReviewAt) && p.status !== "retired").length,
    }), [policies]);

    // Open "new" dialog
    function openNew() {
        setEditTarget(null);
        setForm(DEFAULT_FORM);
        setDialogOpen(true);
    }

    // Open "edit" dialog
    function openEdit(p: PolicyRow) {
        setEditTarget(p);
        setForm({
            policyCode: p.policyCode ?? "",
            title: p.title,
            description: p.description ?? "",
            policyType: p.policyType,
            frameworks: parseJsonArray(p.frameworks),
            controlReferences: parseJsonArray(p.controlReferences).join(", "),
            status: p.status,
            ownerId: p.ownerId?.toString() ?? "",
            reviewCycleMonths: p.reviewCycleMonths.toString(),
            nextReviewAt: p.nextReviewAt
                ? new Date(p.nextReviewAt).toISOString().split("T")[0]
                : "",
            version: p.version,
            documentUrl: p.documentUrl ?? "",
            notes: p.notes ?? "",
        });
        setDialogOpen(true);
    }

    function toggleFramework(fw: string) {
        setForm(f => ({
            ...f,
            frameworks: f.frameworks.includes(fw)
                ? f.frameworks.filter(x => x !== fw)
                : [...f.frameworks, fw],
        }));
    }

    function handleSubmit() {
        const controlReferencesArr = form.controlReferences
            .split(",")
            .map(s => s.trim())
            .filter(Boolean);

        const payload = {
            policyCode: form.policyCode || undefined,
            title: form.title,
            description: form.description || undefined,
            policyType: form.policyType,
            frameworks: form.frameworks,
            controlReferences: controlReferencesArr,
            status: form.status,
            ownerId: form.ownerId ? parseInt(form.ownerId, 10) : undefined,
            reviewCycleMonths: parseInt(form.reviewCycleMonths, 10) || 12,
            nextReviewAt: form.nextReviewAt
                ? new Date(form.nextReviewAt).toISOString()
                : undefined,
            version: form.version || "1.0",
            documentUrl: form.documentUrl || undefined,
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
                    <div className="p-2 rounded-lg bg-primary/10">
                        <BookOpen className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">{t("policy.title", "Policy Manager")}</h1>
                        <p className="text-sm text-muted-foreground">{t("policy.subtitle", "Manage your organisation's compliance policy library")}</p>
                    </div>
                </div>
                <Button onClick={openNew} className="shrink-0">
                    <Plus className="h-4 w-4 mr-1" />
                    {t("policy.addPolicy", "Add Policy")}
                </Button>
            </div>

            {/* Stat cards */}
            <div className="flex flex-wrap gap-3">
                <StatCard label={t("policy.statTotal", "Total")} value={stats.total} />
                <StatCard label={t("policy.statActive", "Active")} value={stats.active} />
                <StatCard label={t("policy.statDraft", "Draft")} value={stats.draft} />
                <StatCard label={t("policy.statUnderReview", "Under Review")} value={stats.underReview} />
                <StatCard label={t("policy.statOverdue", "Overdue Review")} value={stats.overdue} alert={stats.overdue > 0} />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
                <Input
                    placeholder={t("policy.searchPlaceholder", "Search policies…")}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="h-9 w-52"
                />
                <Select value={filterType} onValueChange={v => setFilterType(v as PolicyType | "all")}>
                    <SelectTrigger className="h-9 w-40">
                        <SelectValue placeholder={t("policy.filterType", "All types")} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t("policy.filterAllTypes", "All types")}</SelectItem>
                        {POLICY_TYPES.map(pt => (
                            <SelectItem key={pt} value={pt}>{t(`policy.type.${pt}`, pt)}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={v => setFilterStatus(v as PolicyStatus | "all")}>
                    <SelectTrigger className="h-9 w-44">
                        <SelectValue placeholder={t("policy.filterStatus", "All statuses")} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t("policy.filterAllStatuses", "All statuses")}</SelectItem>
                        {POLICY_STATUSES.map(s => (
                            <SelectItem key={s} value={s}>{t(`policy.status.${s}`, s)}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={filterFW} onValueChange={setFilterFW}>
                    <SelectTrigger className="h-9 w-44">
                        <SelectValue placeholder={t("policy.filterFramework", "All frameworks")} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t("policy.filterAllFrameworks", "All frameworks")}</SelectItem>
                        {FRAMEWORKS.map(fw => <SelectItem key={fw} value={fw}>{fw}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>

            {/* Policy list */}
            {listQ.isError ? (
                <Card>
                    <CardContent className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
                        <FilePen className="h-10 w-10 opacity-30" />
                        <p className="font-semibold">{listQ.error?.message ?? t("policy.loadError", "Failed to load policies.")}</p>
                        <Button variant="outline" size="sm" onClick={() => { void listQ.refetch(); }}>
                            <RefreshCw className="h-3.5 w-3.5 mr-1" />
                            {t("common.retry", "Retry")}
                        </Button>
                    </CardContent>
                </Card>
            ) : listQ.isLoading ? (
                <div className="text-center py-16 text-muted-foreground">{t("policy.loading", "Loading policies…")}</div>
            ) : filtered.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
                        <FilePen className="h-10 w-10 opacity-30" />
                        <p className="font-semibold">{t("policy.emptyTitle", "No policies yet")}</p>
                        <p className="text-sm text-center">{t("policy.emptyDesc", "Create your first compliance policy to get started.")}</p>
                        <Button variant="outline" size="sm" onClick={openNew}>
                            <Plus className="h-3.5 w-3.5 mr-1" />
                            {t("policy.addPolicy", "Add Policy")}
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="flex flex-col gap-3">
                    {filtered.map(p => (
                        <PolicyCard
                            key={p.id}
                            policy={p}
                            onEdit={openEdit}
                            onDelete={setDeleteTarget}
                            onStatusChange={(id, status) => updateStatusM.mutate({ id, status })}
                            t={t}
                        />
                    ))}
                </div>
            )}

            {/* Create / Edit dialog */}
            <Dialog open={dialogOpen} onOpenChange={v => { if (!isSaving) setDialogOpen(v); }}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-primary" />
                            {editTarget
                                ? t("policy.editTitle", "Edit Policy")
                                : t("policy.newTitle", "New Policy")}
                        </DialogTitle>
                        <DialogDescription>{t("policy.formDesc", "Fill in the details for this policy entry.")}</DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
                        {/* Title (full width) */}
                        <div className="sm:col-span-2 space-y-1.5">
                            <Label>{t("policy.fieldTitle", "Title")} *</Label>
                            <Input
                                value={form.title}
                                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                placeholder="e.g. Data Retention Policy"
                            />
                        </div>

                        {/* Policy Code */}
                        <div className="space-y-1.5">
                            <Label>{t("policy.fieldCode", "Policy Code")}</Label>
                            <Input
                                value={form.policyCode}
                                onChange={e => setForm(f => ({ ...f, policyCode: e.target.value }))}
                                placeholder="POL-PIPL-001"
                            />
                        </div>

                        {/* Version */}
                        <div className="space-y-1.5">
                            <Label>{t("policy.fieldVersion", "Version")}</Label>
                            <Input
                                value={form.version}
                                onChange={e => setForm(f => ({ ...f, version: e.target.value }))}
                                placeholder="1.0"
                            />
                        </div>

                        {/* Policy Type */}
                        <div className="space-y-1.5">
                            <Label>{t("policy.fieldType", "Type")}</Label>
                            <Select
                                value={form.policyType}
                                onValueChange={v => setForm(f => ({ ...f, policyType: v as PolicyType }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {POLICY_TYPES.map(pt => (
                                        <SelectItem key={pt} value={pt}>{t(`policy.type.${pt}`, pt)}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Status */}
                        <div className="space-y-1.5">
                            <Label>{t("policy.fieldStatus", "Status")}</Label>
                            <Select
                                value={form.status}
                                onValueChange={v => setForm(f => ({ ...f, status: v as PolicyStatus }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {POLICY_STATUSES.map(s => (
                                        <SelectItem key={s} value={s}>{t(`policy.status.${s}`, s)}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Review Cycle */}
                        <div className="space-y-1.5">
                            <Label>{t("policy.fieldReviewCycle", "Review Cycle")}</Label>
                            <Select
                                value={form.reviewCycleMonths}
                                onValueChange={v => setForm(f => ({ ...f, reviewCycleMonths: v }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {[3, 6, 12, 24].map(m => (
                                        <SelectItem key={m} value={m.toString()}>{m} {t("policy.months", "months")}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Next Review Date */}
                        <div className="space-y-1.5">
                            <Label>{t("policy.fieldNextReview", "Next Review Date")}</Label>
                            <Input
                                type="date"
                                value={form.nextReviewAt}
                                onChange={e => setForm(f => ({ ...f, nextReviewAt: e.target.value }))}
                            />
                        </div>

                        {/* Frameworks (full width) */}
                        <div className="sm:col-span-2 space-y-1.5">
                            <Label>{t("policy.fieldFrameworks", "Frameworks")}</Label>
                            <div className="flex flex-wrap gap-3 pt-1">
                                {FRAMEWORKS.map(fw => (
                                    <label key={fw} className="flex items-center gap-1.5 text-sm cursor-pointer">
                                        <Checkbox
                                            checked={form.frameworks.includes(fw)}
                                            onCheckedChange={() => toggleFramework(fw)}
                                        />
                                        {fw}
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Control References (full width) */}
                        <div className="sm:col-span-2 space-y-1.5">
                            <Label>{t("policy.fieldControls", "Control References")}</Label>
                            <Input
                                value={form.controlReferences}
                                onChange={e => setForm(f => ({ ...f, controlReferences: e.target.value }))}
                                placeholder="PIPL Art.28, NCA ECC-2-1-1, ISO27001 A.8.1"
                            />
                            <p className="text-xs text-muted-foreground">{t("policy.controlsHint", "Comma-separated control IDs")}</p>
                        </div>

                        {/* Document URL (full width) */}
                        <div className="sm:col-span-2 space-y-1.5">
                            <Label>{t("policy.fieldDocUrl", "Document URL")}</Label>
                            <Input
                                type="url"
                                value={form.documentUrl}
                                onChange={e => setForm(f => ({ ...f, documentUrl: e.target.value }))}
                                placeholder="https://sharepoint.example.com/…"
                            />
                        </div>

                        {/* Description (full width) */}
                        <div className="sm:col-span-2 space-y-1.5">
                            <Label>{t("policy.fieldDescription", "Description")}</Label>
                            <Textarea
                                value={form.description}
                                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                rows={3}
                                placeholder={t("policy.descPlaceholder", "Scope, purpose, and key requirements of this policy…")}
                            />
                        </div>

                        {/* Notes (full width) */}
                        <div className="sm:col-span-2 space-y-1.5">
                            <Label>{t("policy.fieldNotes", "Notes")}</Label>
                            <Textarea
                                value={form.notes}
                                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                                rows={2}
                                placeholder={t("policy.notesPlaceholder", "Implementation notes, exceptions, or review history…")}
                            />
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
                                    : t("policy.addPolicy", "Add Policy")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete confirm */}
            <AlertDialog open={!!deleteTarget} onOpenChange={v => { if (!v) setDeleteTarget(null); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("policy.deleteTitle", "Delete policy?")}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t("policy.deleteDesc", "This will permanently delete")} &ldquo;{deleteTarget?.title}&rdquo;.
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

// ─── PolicyCard ────────────────────────────────────────────────────────────────

function PolicyCard({
    policy,
    onEdit,
    onDelete,
    onStatusChange,
    t,
}: {
    policy: PolicyRow;
    onEdit: (p: PolicyRow) => void;
    onDelete: (p: PolicyRow) => void;
    onStatusChange: (id: number, status: PolicyStatus) => void;
    t: (key: string, fallback: string) => string;
}) {
    const frameworks = parseJsonArray(policy.frameworks);
    const controlRefs = parseJsonArray(policy.controlReferences);
    const overdue = isOverdue(policy.nextReviewAt) && policy.status !== "retired";
    const allowedTransitions = STATUS_TRANSITIONS[policy.status];

    return (
        <Card className={`border-l-4 ${overdue ? "border-l-red-500" : "border-l-primary/30"}`}>
            <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    {/* Left: title + metadata */}
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <TypeBadge
                                type={policy.policyType}
                                label={t(`policy.type.${policy.policyType}`, policy.policyType)}
                            />
                            <StatusBadge
                                status={policy.status}
                                label={t(`policy.status.${policy.status}`, policy.status)}
                            />
                            {policy.policyCode && (
                                <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                    {policy.policyCode}
                                </span>
                            )}
                            <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                v{policy.version}
                            </span>
                        </div>

                        <h3 className="font-semibold text-sm leading-snug truncate">{policy.title}</h3>

                        {policy.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{policy.description}</p>
                        )}

                        {/* Framework tags */}
                        {frameworks.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                                {frameworks.map(fw => (
                                    <span key={fw} className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">
                                        {fw}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Control refs */}
                        {controlRefs.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                                {controlRefs.map(ref => (
                                    <span key={ref} className="text-xs bg-muted text-muted-foreground border px-1.5 py-0.5 rounded font-mono">
                                        {ref}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Review date */}
                        <div className="flex items-center gap-1.5 mt-2">
                            <CalendarClock className={`h-3.5 w-3.5 ${overdue ? "text-red-500" : "text-muted-foreground"}`} />
                            <span className={`text-xs ${overdue ? "text-red-500 font-semibold" : "text-muted-foreground"}`}>
                                {policy.nextReviewAt
                                    ? `${t("policy.nextReview", "Next review")}: ${formatDate(policy.nextReviewAt)}${overdue ? ` (${t("policy.overdueReview", "OVERDUE")})` : ""}`
                                    : t("policy.noReviewDate", "No review date set")}
                            </span>
                        </div>
                    </div>

                    {/* Right: actions */}
                    <div className="flex flex-col gap-1.5 shrink-0">
                        {/* Lifecycle transitions */}
                        {allowedTransitions.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                                {allowedTransitions.map(next => (
                                    <Button
                                        key={next}
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-xs"
                                        onClick={() => onStatusChange(policy.id, next)}
                                    >
                                        <FileCheck className="h-3 w-3 mr-1" />
                                        → {t(`policy.status.${next}`, next)}
                                    </Button>
                                ))}
                            </div>
                        )}

                        <div className="flex gap-1 justify-end">
                            {/* Document link */}
                            {policy.documentUrl && (
                                <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                                    <a href={policy.documentUrl} target="_blank" rel="noreferrer">
                                        <ExternalLink className="h-3.5 w-3.5" />
                                    </a>
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => onEdit(policy)}
                            >
                                <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                onClick={() => onDelete(policy)}
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
