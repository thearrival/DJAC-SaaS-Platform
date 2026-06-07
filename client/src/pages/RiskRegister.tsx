/**
 * RiskRegister.tsx — Phase 30
 *
 * Formal risk register with a 5×5 likelihood × impact heat-map,
 * risk entry list (filter/sort), create/edit dialog, and one-click
 * "Send to Remediation" integration.
 *
 * Risk score = likelihood × impact:
 *   1-4   = Low (green)
 *   5-9   = Medium (yellow/amber)
 *   10-14 = High (orange)
 *   15-25 = Critical (red)
 */

import { useState, useMemo } from "react";
import type React from "react";
import { useLocation, useSearch } from "wouter";
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
    Pencil,
    Plus,
    ShieldOff,
    Trash2,
    Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { sounds } from "@/lib/sounds";

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = ["operational", "legal", "technical", "financial", "reputational"] as const;
const TREATMENTS = ["accept", "mitigate", "transfer", "avoid"] as const;
const RISK_STATUSES = ["open", "in_treatment", "closed", "accepted"] as const;

type RiskCategory = typeof CATEGORIES[number];
type RiskTreatment = typeof TREATMENTS[number];
type RiskStatus = typeof RISK_STATUSES[number];

/** Compute colour tier from likelihood × impact */
function riskColorTier(score: number): "critical" | "high" | "medium" | "low" {
    if (score >= 15) return "critical";
    if (score >= 10) return "high";
    if (score >= 5) return "medium";
    return "low";
}

const TIER_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    critical: { bg: "bg-red-100 dark:bg-red-950", text: "text-red-700 dark:text-red-300", border: "border-red-500" },
    high: { bg: "bg-orange-100 dark:bg-orange-950", text: "text-orange-700 dark:text-orange-300", border: "border-orange-500" },
    medium: { bg: "bg-yellow-100 dark:bg-yellow-950", text: "text-yellow-700 dark:text-yellow-300", border: "border-yellow-500" },
    low: { bg: "bg-green-100 dark:bg-green-950", text: "text-green-700 dark:text-green-300", border: "border-green-500" },
};

/** Cell colour for the 5×5 heat-map */
function cellColor(l: number, imp: number): string {
    const score = l * imp;
    if (score >= 15) return "bg-red-500";
    if (score >= 10) return "bg-orange-400";
    if (score >= 5) return "bg-yellow-400";
    return "bg-green-400";
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
    return (
        <Card className="flex-1 min-w-[120px]">
            <CardContent className="pt-4 pb-3 px-4">
                <p className="text-xs text-muted-foreground truncate">{label}</p>
                <p className="text-2xl font-bold mt-1">{value}</p>
                {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
            </CardContent>
        </Card>
    );
}

// ─── Tier badge ───────────────────────────────────────────────────────────────

function TierBadge({ score }: { score: number }) {
    const tier = riskColorTier(score);
    const col = TIER_COLORS[tier];
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${col.bg} ${col.text}`}>
            <AlertTriangle size={11} />
            {tier.charAt(0).toUpperCase() + tier.slice(1)} ({score})
        </span>
    );
}

// ─── 5×5 Heat Map ─────────────────────────────────────────────────────────────

type RiskRow = { likelihood: number; impact: number };

function HeatMap({ risks }: { risks: RiskRow[] }) {
    const { t } = useLocale();

    // Build a count map keyed by "l,i"
    const counts = useMemo(() => {
        const m: Record<string, number> = {};
        for (const r of risks) {
            const key = `${r.likelihood},${r.impact}`;
            m[key] = (m[key] ?? 0) + 1;
        }
        return m;
    }, [risks]);

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">{t("risk.heatmapTitle", "Risk Heat Map")}</CardTitle>
                <p className="text-xs text-muted-foreground">{t("risk.heatmapDesc", "X = Likelihood (1–5), Y = Impact (1–5)")}</p>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <table className="border-collapse text-xs">
                        <thead>
                            <tr>
                                <th className="w-16 text-right pr-2 pb-1 text-muted-foreground font-normal">
                                    {t("risk.impact", "Impact")} ↑
                                </th>
                                {[1, 2, 3, 4, 5].map(l => (
                                    <th key={l} className="w-12 text-center pb-1 text-muted-foreground font-normal">{l}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {[5, 4, 3, 2, 1].map(imp => (
                                <tr key={imp}>
                                    <td className="text-right pr-2 py-0.5 text-muted-foreground font-medium w-16">{imp}</td>
                                    {[1, 2, 3, 4, 5].map(l => {
                                        const count = counts[`${l},${imp}`] ?? 0;
                                        return (
                                            <td key={l} className="py-0.5 px-0.5">
                                                <div className={`w-10 h-10 rounded flex items-center justify-center font-bold text-white text-sm ${cellColor(l, imp)} opacity-${count > 0 ? "100" : "30"}`}>
                                                    {count > 0 ? count : ""}
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                            <tr>
                                <td />
                                <td colSpan={5} className="text-center pt-1 text-muted-foreground">
                                    {t("risk.likelihood", "Likelihood")} →
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                {/* Legend */}
                <div className="flex flex-wrap gap-2 mt-3">
                    {(["critical", "high", "medium", "low"] as const).map(tier => (
                        <span key={tier} className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${TIER_COLORS[tier].bg} ${TIER_COLORS[tier].text}`}>
                            <span className="w-2 h-2 rounded-full inline-block" style={{
                                background: tier === "critical" ? "#ef4444" : tier === "high" ? "#f97316" : tier === "medium" ? "#eab308" : "#22c55e"
                            }} />
                            {t(`risk.tier.${tier}`, tier.charAt(0).toUpperCase() + tier.slice(1))}
                        </span>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

// ─── Risk card ────────────────────────────────────────────────────────────────

type RiskEntryData = {
    id: number;
    organizationId: number;
    title: string;
    description: string | null;
    category: string;
    likelihood: number;
    impact: number;
    treatment: string;
    status: string;
    ownerId: number | null;
    vendorId: number | null;
    gapCode: string | null;
    controlReference: string | null;
    reviewDate: Date | string | null;
    notes: string | null;
    createdAt: Date | string;
    updatedAt: Date | string;
};

function RiskCard({
    risk,
    vendorNames,
    ownerNames,
    onEdit,
    onDelete,
    onSendRemediation,
}: {
    risk: RiskEntryData;
    vendorNames: Record<number, string>;
    ownerNames: Record<number, string>;
    onEdit: (r: RiskEntryData) => void;
    onDelete: (id: number) => void;
    onSendRemediation: (r: RiskEntryData) => void;
}) {
    const { t } = useLocale();
    const score = risk.likelihood * risk.impact;
    const tier = riskColorTier(score);
    const col = TIER_COLORS[tier];

    const statusColor: Record<string, string> = {
        open: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
        in_treatment: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
        closed: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
        accepted: "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300",
    };

    const treatmentColor: Record<string, string> = {
        accept: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
        mitigate: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
        transfer: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
        avoid: "bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300",
    };

    return (
        <Card className={`border-l-4 ${col.border}`}>
            <CardContent className="pt-4 pb-3 px-4">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                            <TierBadge score={score} />
                            <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[risk.status] ?? ""}`}>
                                {t(`risk.status.${risk.status}`, risk.status)}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${treatmentColor[risk.treatment] ?? ""}`}>
                                {t(`risk.treatment.${risk.treatment}`, risk.treatment)}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                {t(`risk.category.${risk.category}`, risk.category)}
                            </span>
                        </div>
                        <p className="font-semibold text-sm leading-tight truncate">{risk.title}</p>
                        {risk.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{risk.description}</p>
                        )}
                        <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                            {risk.gapCode && (
                                <span className="font-mono bg-muted px-1.5 py-0.5 rounded">{risk.gapCode}</span>
                            )}
                            {risk.controlReference && (
                                <span className="italic">{risk.controlReference}</span>
                            )}
                            {risk.vendorId && vendorNames[risk.vendorId] && (
                                <span>🏢 {vendorNames[risk.vendorId]}</span>
                            )}
                            {risk.ownerId && ownerNames[risk.ownerId] && (
                                <span>👤 {ownerNames[risk.ownerId]}</span>
                            )}
                            {risk.reviewDate && (
                                <span>📅 {new Date(risk.reviewDate).toLocaleDateString()}</span>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            title={t("risk.sendRemediation", "Send to Remediation")}
                            onClick={() => onSendRemediation(risk)}
                        >
                            <Wrench size={13} />
                        </Button>
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            title={t("common.edit", "Edit")}
                            onClick={() => onEdit(risk)}
                        >
                            <Pencil size={13} />
                        </Button>
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            title={t("common.delete", "Delete")}
                            onClick={() => onDelete(risk.id)}
                        >
                            <Trash2 size={13} />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// ─── Risk Form Dialog ─────────────────────────────────────────────────────────

type FormState = {
    title: string;
    description: string;
    category: RiskCategory;
    likelihood: number;
    impact: number;
    treatment: RiskTreatment;
    status: RiskStatus;
    ownerId: string;
    vendorId: string;
    gapCode: string;
    controlReference: string;
    reviewDate: string;
    notes: string;
};

const DEFAULT_FORM: FormState = {
    title: "", description: "", category: "operational",
    likelihood: 3, impact: 3, treatment: "mitigate", status: "open",
    ownerId: "", vendorId: "", gapCode: "", controlReference: "", reviewDate: "", notes: "",
};

function riskToForm(r: RiskEntryData): FormState {
    return {
        title: r.title,
        description: r.description ?? "",
        category: r.category as RiskCategory,
        likelihood: r.likelihood,
        impact: r.impact,
        treatment: r.treatment as RiskTreatment,
        status: r.status as RiskStatus,
        ownerId: r.ownerId ? String(r.ownerId) : "",
        vendorId: r.vendorId ? String(r.vendorId) : "",
        gapCode: r.gapCode ?? "",
        controlReference: r.controlReference ?? "",
        reviewDate: r.reviewDate ? new Date(r.reviewDate).toISOString().substring(0, 10) : "",
        notes: r.notes ?? "",
    };
}

function RiskFormDialog({
    open,
    editingRisk,
    vendors,
    members,
    prefill,
    onClose,
    onSave,
    isSaving,
}: {
    open: boolean;
    editingRisk: RiskEntryData | null;
    vendors: { id: number; vendorName: string }[];
    members: { id: number; name: string | null }[];
    prefill: Partial<FormState>;
    onClose: () => void;
    onSave: (form: FormState) => void;
    isSaving: boolean;
}) {
    const { t } = useLocale();
    const [form, setForm] = useState<FormState>({ ...DEFAULT_FORM, ...prefill });

    // Reset form whenever dialog opens
    const key = open ? (editingRisk?.id ?? "new") : "closed";
    useMemo(() => {
        if (open) setForm(editingRisk ? riskToForm(editingRisk) : { ...DEFAULT_FORM, ...prefill });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key]);

    const set = (field: keyof FormState) => (val: string) =>
        setForm(f => ({ ...f, [field]: val }));

    const score = Number(form.likelihood) * Number(form.impact);
    const tier = riskColorTier(score);
    const col = TIER_COLORS[tier];

    return (
        <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {editingRisk ? t("risk.editTitle", "Edit Risk") : t("risk.newTitle", "New Risk Entry")}
                    </DialogTitle>
                    <DialogDescription>
                        {t("risk.formDesc", "Define the risk, assign likelihood & impact, choose a treatment strategy.")}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-2">
                    {/* Title */}
                    <div className="space-y-1">
                        <Label>{t("risk.fieldTitle", "Title")} *</Label>
                        <Input
                            value={form.title}
                            onChange={e => set("title")(e.target.value)}
                            placeholder={t("risk.titlePlaceholder", "Brief risk statement…")}
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-1">
                        <Label>{t("risk.fieldDescription", "Description")}</Label>
                        <Textarea
                            rows={2}
                            value={form.description}
                            onChange={e => set("description")(e.target.value)}
                            placeholder={t("risk.descPlaceholder", "Context, root cause, potential impact details…")}
                        />
                    </div>

                    {/* Category + Treatment */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label>{t("risk.fieldCategory", "Category")}</Label>
                            <Select value={form.category} onValueChange={set("category")}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {CATEGORIES.map(c => (
                                        <SelectItem key={c} value={c}>{t(`risk.category.${c}`, c)}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label>{t("risk.fieldTreatment", "Treatment")}</Label>
                            <Select value={form.treatment} onValueChange={set("treatment")}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {TREATMENTS.map(tr => (
                                        <SelectItem key={tr} value={tr}>{t(`risk.treatment.${tr}`, tr)}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Likelihood × Impact with live score */}
                    <div className="grid grid-cols-3 gap-3 items-end">
                        <div className="space-y-1">
                            <Label>{t("risk.fieldLikelihood", "Likelihood (1–5)")}</Label>
                            <Select value={String(form.likelihood)} onValueChange={v => setForm(f => ({ ...f, likelihood: Number(v) }))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {[1, 2, 3, 4, 5].map(n => (
                                        <SelectItem key={n} value={String(n)}>
                                            {n} — {t(`risk.likelihood.${n}`, ["Rare", "Unlikely", "Possible", "Likely", "Almost Certain"][n - 1])}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label>{t("risk.fieldImpact", "Impact (1–5)")}</Label>
                            <Select value={String(form.impact)} onValueChange={v => setForm(f => ({ ...f, impact: Number(v) }))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {[1, 2, 3, 4, 5].map(n => (
                                        <SelectItem key={n} value={String(n)}>
                                            {n} — {t(`risk.impact.${n}`, ["Negligible", "Minor", "Moderate", "Major", "Catastrophic"][n - 1])}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className={`rounded-lg px-3 py-2 text-center text-sm font-bold ${col.bg} ${col.text}`}>
                            {t("risk.score", "Score")}: {score} — {t(`risk.tier.${tier}`, tier)}
                        </div>
                    </div>

                    {/* Status */}
                    <div className="space-y-1">
                        <Label>{t("risk.fieldStatus", "Status")}</Label>
                        <Select value={form.status} onValueChange={set("status")}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {RISK_STATUSES.map(s => (
                                    <SelectItem key={s} value={s}>{t(`risk.status.${s}`, s)}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Owner + Vendor */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label>{t("risk.fieldOwner", "Risk Owner")}</Label>
                            <Select value={form.ownerId || "none"} onValueChange={v => set("ownerId")(v === "none" ? "" : v)}>
                                <SelectTrigger><SelectValue placeholder={t("risk.unassigned", "Unassigned")} /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">{t("risk.unassigned", "Unassigned")}</SelectItem>
                                    {members.map(m => (
                                        <SelectItem key={m.id} value={String(m.id)}>{m.name ?? `Member #${m.id}`}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label>{t("risk.fieldVendor", "Related Vendor")}</Label>
                            <Select value={form.vendorId || "none"} onValueChange={v => set("vendorId")(v === "none" ? "" : v)}>
                                <SelectTrigger><SelectValue placeholder={t("risk.noVendor", "None")} /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">{t("risk.noVendor", "None")}</SelectItem>
                                    {vendors.map(v => (
                                        <SelectItem key={v.id} value={String(v.id)}>{v.vendorName}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Gap Code + Control Reference */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label>{t("risk.fieldGapCode", "Gap Code")}</Label>
                            <Input
                                value={form.gapCode}
                                onChange={e => set("gapCode")(e.target.value)}
                                placeholder="PIPL-DPO-001"
                                className="font-mono text-sm"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label>{t("risk.fieldControlRef", "Control Reference")}</Label>
                            <Input
                                value={form.controlReference}
                                onChange={e => set("controlReference")(e.target.value)}
                                placeholder="PIPL Art.28, NCA ECC-2-1-1…"
                            />
                        </div>
                    </div>

                    {/* Review Date */}
                    <div className="space-y-1">
                        <Label>{t("risk.fieldReviewDate", "Next Review Date")}</Label>
                        <Input
                            type="date"
                            value={form.reviewDate}
                            onChange={e => set("reviewDate")(e.target.value)}
                        />
                    </div>

                    {/* Notes */}
                    <div className="space-y-1">
                        <Label>{t("risk.fieldNotes", "Notes")}</Label>
                        <Textarea
                            rows={2}
                            value={form.notes}
                            onChange={e => set("notes")(e.target.value)}
                            placeholder={t("risk.notesPlaceholder", "Additional context, evidence, or links…")}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSaving}>
                        {t("common.cancel", "Cancel")}
                    </Button>
                    <Button onClick={() => onSave(form)} disabled={isSaving || !form.title.trim()}>
                        {isSaving ? t("common.saving", "Saving…") : t("common.save", "Save")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function RiskRegister() {
    const { t } = useLocale();
    usePageTitle(t("risk.pageTitle", "Risk Register"));

    const searchStr = useSearch();
    const [, navigate] = useLocation();

    // Pre-fill from URL (e.g. coming from GapTracker)
    const urlParams = new URLSearchParams(searchStr);
    const prefillRef = useMemo<Partial<FormState>>(() => ({
        gapCode: urlParams.get("gapCode") ?? "",
        title: urlParams.get("title") ?? "",
        vendorId: urlParams.get("vendorId") ? String(urlParams.get("vendorId")) : "",
    }), []); // only on mount

    // ── Data queries ────────────────────────────────────────────────────────
    const utils = trpc.useUtils();
    const risksQuery = trpc.riskRegister.list.useQuery();
    const vendorsQuery = trpc.vendor.list.useQuery();
    const membersQuery = trpc.orgMembers.list.useQuery();

    const risks = (risksQuery.data ?? []) as RiskEntryData[];
    const vendors = (vendorsQuery.data ?? []) as { id: number; vendorName: string }[];
    const members = (membersQuery.data ?? []) as { id: number; name: string | null }[];
    const hasLoadError = risksQuery.isError || vendorsQuery.isError || membersQuery.isError;
    const loadErrorMessage = risksQuery.error?.message ?? vendorsQuery.error?.message ?? membersQuery.error?.message;

    // Lookup maps
    const vendorNames = useMemo(() =>
        Object.fromEntries(vendors.map(v => [v.id, v.vendorName])), [vendors]);
    const ownerNames = useMemo(() =>
        Object.fromEntries(members.map(m => [m.id, m.name ?? `#${m.id}`])), [members]);

    // ── Filter state ────────────────────────────────────────────────────────
    const [filterCategory, setFilterCategory] = useState<string>("all");
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [filterTier, setFilterTier] = useState<string>("all");
    const [search, setSearch] = useState("");

    const filteredRisks = useMemo(() => {
        return risks.filter(r => {
            const score = r.likelihood * r.impact;
            const tier = riskColorTier(score);
            if (filterCategory !== "all" && r.category !== filterCategory) return false;
            if (filterStatus !== "all" && r.status !== filterStatus) return false;
            if (filterTier !== "all" && tier !== filterTier) return false;
            if (search && !r.title.toLowerCase().includes(search.toLowerCase())) return false;
            return true;
        });
    }, [risks, filterCategory, filterStatus, filterTier, search]);

    // ── Stats ───────────────────────────────────────────────────────────────
    const stats = useMemo(() => {
        const total = risks.length;
        const critical = risks.filter(r => r.likelihood * r.impact >= 15).length;
        const high = risks.filter(r => { const s = r.likelihood * r.impact; return s >= 10 && s < 15; }).length;
        const open = risks.filter(r => r.status === "open").length;
        const inTreatment = risks.filter(r => r.status === "in_treatment").length;
        return { total, critical, high, open, inTreatment };
    }, [risks]);

    // ── Mutations ───────────────────────────────────────────────────────────
    const createMutation = trpc.riskRegister.create.useMutation({
        onSuccess: () => { utils.riskRegister.list.invalidate(); toast.success(t("risk.created", "Risk entry created")); sounds.success(); },
        onError: e => { toast.error(e.message); sounds.error(); },
    });
    const patchMutation = trpc.riskRegister.patch.useMutation({
        onSuccess: () => { utils.riskRegister.list.invalidate(); toast.success(t("risk.updated", "Risk entry updated")); sounds.success(); },
        onError: e => { toast.error(e.message); sounds.error(); },
    });
    const removeMutation = trpc.riskRegister.remove.useMutation({
        onSuccess: () => { utils.riskRegister.list.invalidate(); toast.success(t("risk.deleted", "Risk entry deleted")); sounds.success(); },
        onError: e => { toast.error(e.message); sounds.error(); },
    });

    // ── Dialog state ────────────────────────────────────────────────────────
    const [dialogOpen, setDialogOpen] = useState(!!urlParams.get("title"));
    const [editingRisk, setEditingRisk] = useState<RiskEntryData | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

    function openNew() {
        setEditingRisk(null);
        setDialogOpen(true);
        sounds.open();
    }

    function openEdit(r: RiskEntryData) {
        setEditingRisk(r);
        setDialogOpen(true);
        sounds.open();
    }

    function closeDialog() {
        setDialogOpen(false);
        setEditingRisk(null);
        sounds.close();
    }

    function handleSave(form: FormState) {
        const payload = {
            title: form.title.trim(),
            description: form.description.trim() || undefined,
            category: form.category,
            likelihood: Number(form.likelihood),
            impact: Number(form.impact),
            treatment: form.treatment,
            status: form.status,
            ownerId: form.ownerId ? Number(form.ownerId) : undefined,
            vendorId: form.vendorId ? Number(form.vendorId) : undefined,
            gapCode: form.gapCode.trim() || undefined,
            controlReference: form.controlReference.trim() || undefined,
            reviewDate: form.reviewDate ? new Date(form.reviewDate).toISOString() : undefined,
            notes: form.notes.trim() || undefined,
        };

        if (editingRisk) {
            patchMutation.mutate({ id: editingRisk.id, ...payload }, {
                onSuccess: () => closeDialog(),
            });
        } else {
            createMutation.mutate(payload, {
                onSuccess: () => closeDialog(),
            });
        }
    }

    function handleDelete(id: number) {
        setDeleteTarget(id);
        sounds.open();
    }

    function confirmDelete() {
        if (deleteTarget === null) return;
        removeMutation.mutate(deleteTarget, {
            onSuccess: () => { setDeleteTarget(null); sounds.success(); },
        });
    }

    function handleSendRemediation(r: RiskEntryData) {
        const qs = new URLSearchParams({
            ...(r.gapCode ? { gapCode: r.gapCode } : {}),
            title: r.title,
            severity: riskColorTier(r.likelihood * r.impact),
            ...(r.vendorId ? { vendorId: String(r.vendorId) } : {}),
        }).toString();
        sounds.navigate();
        navigate(`/remediation-planner?${qs}`);
    }

    const isSaving = createMutation.isPending || patchMutation.isPending;

    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <div className="djac-page">
            {/* Header */}
            <div className="djac-page-header">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <ShieldOff className="text-orange-500" size={24} />
                        {t("risk.title", "Risk Register")}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        {t("risk.subtitle", "Identify, score, and track organisational risks. Link to vendors, gaps, and remediation tasks.")}
                    </p>
                </div>
                <Button onClick={openNew} className="shrink-0">
                    <Plus size={14} className="mr-1" />
                    {t("risk.addRisk", "Add Risk")}
                </Button>
            </div>

            {hasLoadError && (
                <Card className="border-destructive/40 bg-destructive/5">
                    <CardContent className="flex flex-col gap-3 py-4 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
                        <p className="text-sm text-muted-foreground">
                            {loadErrorMessage ?? t("risk.loadError", "Failed to load risk register data.")}
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => {
                                void risksQuery.refetch();
                                void vendorsQuery.refetch();
                                void membersQuery.refetch();
                            }}
                        >
                            {t("common.retry", "Retry")}
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Stat tiles */}
            <div className="flex flex-wrap gap-3">
                <StatCard label={t("risk.statTotal", "Total Risks")} value={stats.total} />
                <StatCard label={t("risk.statCritical", "Critical")} value={stats.critical} sub="score â‰¥ 15" />
                <StatCard label={t("risk.statHigh", "High")} value={stats.high} sub="score 10–14" />
                <StatCard label={t("risk.statOpen", "Open")} value={stats.open} />
                <StatCard label={t("risk.statInTreatment", "In Treatment")} value={stats.inTreatment} />
            </div>

            {/* Heat map */}
            {risks.length > 0 && <HeatMap risks={risks} />}

            {/* Filter bar */}
            <div className="flex flex-wrap gap-2">
                <Input
                    className="w-48 h-8 text-sm"
                    placeholder={t("risk.search", "Search…")}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="w-36 h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t("risk.allCategories", "All Categories")}</SelectItem>
                        {CATEGORIES.map(c => <SelectItem key={c} value={c}>{t(`risk.category.${c}`, c)}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-36 h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t("risk.allStatuses", "All Statuses")}</SelectItem>
                        {RISK_STATUSES.map(s => <SelectItem key={s} value={s}>{t(`risk.status.${s}`, s)}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select value={filterTier} onValueChange={setFilterTier}>
                    <SelectTrigger className="w-36 h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t("risk.allTiers", "All Tiers")}</SelectItem>
                        {(["critical", "high", "medium", "low"] as const).map(tier => (
                            <SelectItem key={tier} value={tier}>{t(`risk.tier.${tier}`, tier)}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Risk list */}
            {risksQuery.isError ? (
                <div className="text-center py-16 text-muted-foreground">
                    <ShieldOff size={40} className="mx-auto mb-3 opacity-25" />
                    <p className="font-medium">{t("risk.loadError", "Failed to load risk register data.")}</p>
                    <Button
                        variant="outline"
                        size="sm"
                        className="mt-3 h-7 text-xs"
                        onClick={() => {
                            void risksQuery.refetch();
                        }}
                    >
                        {t("common.retry", "Retry")}
                    </Button>
                </div>
            ) : risksQuery.isLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-6">
                    <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                    {t("risk.loading", "Loading risks…")}
                </div>
            ) : filteredRisks.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                    <ShieldOff size={40} className="mx-auto mb-3 opacity-25" />
                    <p className="font-medium">{t("risk.emptyTitle", "No risks found")}</p>
                    <p className="text-sm mt-1">
                        {risks.length === 0
                            ? t("risk.emptyDesc", "Add your first risk entry to start building the risk register.")
                            : t("risk.emptyFilter", "No risks match the current filters.")
                        }
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {filteredRisks.map(r => (
                        <RiskCard
                            key={r.id}
                            risk={r}
                            vendorNames={vendorNames}
                            ownerNames={ownerNames}
                            onEdit={openEdit}
                            onDelete={handleDelete}
                            onSendRemediation={handleSendRemediation}
                        />
                    ))}
                </div>
            )}

            {/* Form dialog */}
            <RiskFormDialog
                key={dialogOpen ? (editingRisk?.id ?? "new") : "closed"}
                open={dialogOpen}
                editingRisk={editingRisk}
                vendors={vendors}
                members={members}
                prefill={prefillRef}
                onClose={closeDialog}
                onSave={handleSave}
                isSaving={isSaving}
            />

            {/* Delete confirm */}
            <AlertDialog open={deleteTarget !== null} onOpenChange={v => { if (!v) setDeleteTarget(null); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("risk.deleteTitle", "Delete Risk Entry?")}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t("risk.deleteDesc", "This will permanently remove the risk entry. This action cannot be undone.")}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDeleteTarget(null)}>
                            {t("common.cancel", "Cancel")}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={confirmDelete}
                            disabled={removeMutation.isPending}
                        >
                            {removeMutation.isPending ? t("common.deleting", "Deleting…") : t("common.delete", "Delete")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
