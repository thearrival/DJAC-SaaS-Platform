/**
 * AssetInventory.tsx
 *
 * IT/OT/Cloud asset register with calculated risk scores.
 *
 * Features:
 *   • Risk overview cards (total, critical, internet-facing, avg risk score)
 *   • Risk heatmap bar (distribution by risk score tier)
 *   • Sortable, filterable asset table
 *   • Add / Edit asset dialog
 *   • Delete with confirmation
 */

import { useState, useMemo } from "react";
import type React from "react";
import { trpc } from "@/lib/trpc";
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
    CardDescription,
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
    Globe,
    Layers,
    Pencil,
    Plus,
    Server,
    ShieldAlert,
    Trash2,
} from "lucide-react";
import { toast } from "sonner";

// ─── Constants ────────────────────────────────────────────────────────────────

const ASSET_TYPES = [
    { value: "server", label: "Server" },
    { value: "workstation", label: "Workstation" },
    { value: "network_device", label: "Network Device" },
    { value: "cloud_service", label: "Cloud Service" },
    { value: "saas_application", label: "SaaS Application" },
    { value: "database", label: "Database" },
    { value: "api_endpoint", label: "API Endpoint" },
    { value: "iot_device", label: "IoT Device" },
    { value: "mobile_device", label: "Mobile Device" },
    { value: "industrial_ot", label: "Industrial OT" },
    { value: "web_application", label: "Web Application" },
    { value: "source_code_repo", label: "Source Code Repo" },
    { value: "third_party_service", label: "Third-Party Service" },
] as const;

const CRITICALITY_LEVELS = [
    { value: "low", label: "Low", color: "bg-blue-500/10 text-blue-400" },
    { value: "medium", label: "Medium", color: "bg-yellow-500/10 text-yellow-400" },
    { value: "high", label: "High", color: "bg-orange-500/10 text-orange-400" },
    { value: "critical", label: "Critical", color: "bg-red-500/10 text-red-400" },
] as const;

const EXPOSURE_LEVELS = [
    { value: "internal", label: "Internal" },
    { value: "vpn_only", label: "VPN Only" },
    { value: "partner_only", label: "Partner Only" },
    { value: "internet_facing", label: "Internet Facing" },
] as const;

const ASSET_STATUSES = [
    { value: "active", label: "Active" },
    { value: "decommissioned", label: "Decommissioned" },
    { value: "under_review", label: "Under Review" },
    { value: "unknown", label: "Unknown" },
] as const;

function riskColor(score: number) {
    if (score >= 75) return "text-red-400";
    if (score >= 50) return "text-orange-400";
    if (score >= 25) return "text-yellow-400";
    return "text-green-400";
}

function riskBadgeClass(score: number) {
    if (score >= 75) return "bg-red-500/10 text-red-400";
    if (score >= 50) return "bg-orange-500/10 text-orange-400";
    if (score >= 25) return "bg-yellow-500/10 text-yellow-400";
    return "bg-green-500/10 text-green-400";
}

const EMPTY_FORM = {
    name: "", assetType: "server" as string, identifier: "", owner: "",
    location: "", criticality: "medium" as string, exposure: "internal" as string,
    status: "active" as string, platform: "", version: "", tags: "", notes: "",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function AssetInventory() {
    usePageTitle("Asset Inventory");

    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [filter, setFilter] = useState("");
    const [form, setForm] = useState(EMPTY_FORM);

    const utils = trpc.useUtils();
    const { data: assets = [], isLoading, isError, refetch } = trpc.assetInventory.list.useQuery();
    const summaryQuery = trpc.assetInventory.summary.useQuery();
    const summary = summaryQuery.data;

    const createMutation = trpc.assetInventory.create.useMutation({
        onSuccess: () => { toast.success("Asset added."); utils.assetInventory.list.invalidate(); utils.assetInventory.summary.invalidate(); closeForm(); },
        onError: (e) => toast.error(e.message),
    });

    const patchMutation = trpc.assetInventory.patch.useMutation({
        onSuccess: () => { toast.success("Asset updated."); utils.assetInventory.list.invalidate(); utils.assetInventory.summary.invalidate(); closeForm(); },
        onError: (e) => toast.error(e.message),
    });

    const removeMutation = trpc.assetInventory.remove.useMutation({
        onSuccess: () => { toast.success("Asset removed."); utils.assetInventory.list.invalidate(); utils.assetInventory.summary.invalidate(); setDeleteId(null); },
        onError: (e) => toast.error(e.message),
    });

    function openCreate() { setEditingId(null); setForm(EMPTY_FORM); setShowForm(true); }

    function openEdit(asset: typeof assets[0]) {
        setEditingId(asset.id);
        setForm({
            name: asset.name,
            assetType: asset.assetType,
            identifier: asset.identifier ?? "",
            owner: asset.owner ?? "",
            location: asset.location ?? "",
            criticality: asset.criticality,
            exposure: asset.exposure,
            status: asset.status,
            platform: asset.platform ?? "",
            version: asset.version ?? "",
            tags: asset.tags ?? "",
            notes: asset.notes ?? "",
        });
        setShowForm(true);
    }

    function closeForm() { setShowForm(false); setEditingId(null); }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        type F = Parameters<typeof createMutation.mutate>[0];
        const payload: F = {
            name: form.name.trim(),
            assetType: form.assetType as F["assetType"],
            criticality: form.criticality as F["criticality"],
            exposure: form.exposure as F["exposure"],
            status: form.status as F["status"],
            identifier: form.identifier.trim() || undefined,
            owner: form.owner.trim() || undefined,
            location: form.location.trim() || undefined,
            platform: form.platform.trim() || undefined,
            version: form.version.trim() || undefined,
            tags: form.tags.trim() || undefined,
            notes: form.notes.trim() || undefined,
        };
        if (editingId !== null) {
            patchMutation.mutate({ id: editingId, ...payload });
        } else {
            createMutation.mutate(payload);
        }
    }

    const filtered = useMemo(() => {
        const q = filter.toLowerCase();
        if (!q) return assets;
        return assets.filter(
            (a) =>
                a.name.toLowerCase().includes(q) ||
                a.assetType.toLowerCase().includes(q) ||
                (a.owner ?? "").toLowerCase().includes(q) ||
                (a.identifier ?? "").toLowerCase().includes(q),
        );
    }, [assets, filter]);

    const getCriticalityStyle = (c: string) =>
        CRITICALITY_LEVELS.find((l) => l.value === c)?.color ?? "";

    const getAssetLabel = (t: string) =>
        ASSET_TYPES.find((a) => a.value === t)?.label ?? t;

    const deleteTarget = deleteId !== null ? assets.find((a) => a.id === deleteId) : null;

    return (
        <div className="flex flex-col gap-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Asset Inventory</h1>
                    <p className="text-sm text-zinc-400 mt-1">
                        Manage your organization's IT/OT/Cloud asset register
                    </p>
                </div>
                <Button onClick={openCreate} className="gap-2">
                    <Plus className="size-4" />
                    Add Asset
                </Button>
            </div>

            {/* Summary Cards */}
            {summaryQuery.isError && (
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardContent className="py-4 flex items-center justify-between gap-3">
                        <p className="text-sm text-zinc-400">{summaryQuery.error?.message ?? "Failed to load asset summary."}</p>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => {
                                void summaryQuery.refetch();
                            }}
                        >
                            Retry
                        </Button>
                    </CardContent>
                </Card>
            )}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard title="Total Assets" value={summaryQuery.isLoading || summaryQuery.isError ? 0 : (summary?.total ?? 0)} icon={<Layers className="size-5 text-zinc-400" />} accent={summaryQuery.isLoading || summaryQuery.isError ? "text-zinc-500" : "text-white"} />
                <StatCard title="Critical Assets" value={summaryQuery.isLoading || summaryQuery.isError ? 0 : (summary?.criticalCount ?? 0)} icon={<AlertTriangle className="size-5 text-red-400" />} accent={summaryQuery.isLoading || summaryQuery.isError ? "text-zinc-500" : "text-red-400"} />
                <StatCard title="Internet Facing" value={summaryQuery.isLoading || summaryQuery.isError ? 0 : (summary?.internetFacingCount ?? 0)} icon={<Globe className="size-5 text-orange-400" />} accent={summaryQuery.isLoading || summaryQuery.isError ? "text-zinc-500" : "text-orange-400"} />
                <StatCard title="Avg Risk Score" value={summaryQuery.isLoading || summaryQuery.isError ? 0 : (summary?.avgRisk ?? 0)} icon={<ShieldAlert className="size-5 text-yellow-400" />} accent={summaryQuery.isLoading || summaryQuery.isError ? "text-zinc-500" : riskColor(summary?.avgRisk ?? 0)} suffix="/100" />
            </div>
            {summaryQuery.isLoading && (
                <p className="text-xs text-zinc-500">Loading summary metrics...</p>
            )}

            {/* Asset Table */}
            <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div>
                            <CardTitle className="text-white">Assets</CardTitle>
                            <CardDescription>{filtered.length} of {assets.length} assets</CardDescription>
                        </div>
                        <Input
                            placeholder="Filter by name, type, or owner…"
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="bg-zinc-800 border-zinc-700 w-64"
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    {isError ? (
                        <div className="text-center py-12 text-zinc-500">
                            <ShieldAlert className="size-12 mx-auto mb-3 opacity-30" />
                            <p>Failed to load assets.</p>
                            <Button variant="outline" size="sm" className="mt-3" onClick={() => { void refetch(); }}>
                                Retry
                            </Button>
                        </div>
                    ) : isLoading ? (
                        <div className="text-center py-12 text-zinc-500">Loading assets…</div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-12 text-zinc-500">
                            <Server className="size-12 mx-auto mb-3 opacity-30" />
                            <p>{assets.length === 0 ? "No assets registered yet." : "No assets match your filter."}</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-xs text-zinc-500 uppercase border-b border-zinc-800">
                                        <th className="text-left py-2 pr-4 font-medium">Asset</th>
                                        <th className="text-left py-2 pr-4 font-medium">Type</th>
                                        <th className="text-left py-2 pr-4 font-medium">Owner</th>
                                        <th className="text-left py-2 pr-4 font-medium">Criticality</th>
                                        <th className="text-left py-2 pr-4 font-medium">Exposure</th>
                                        <th className="text-right py-2 pr-4 font-medium">Risk</th>
                                        <th className="text-right py-2 font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800/50">
                                    {filtered.map((asset) => (
                                        <tr key={asset.id} className="group hover:bg-zinc-800/30 transition-colors">
                                            <td className="py-3 pr-4">
                                                <div className="font-medium text-white">{asset.name}</div>
                                                {asset.identifier && (
                                                    <div className="text-xs text-zinc-500 font-mono truncate max-w-[180px]">{asset.identifier}</div>
                                                )}
                                            </td>
                                            <td className="py-3 pr-4 text-zinc-400">{getAssetLabel(asset.assetType)}</td>
                                            <td className="py-3 pr-4 text-zinc-400">{asset.owner ?? "—"}</td>
                                            <td className="py-3 pr-4">
                                                <Badge className={`text-xs ${getCriticalityStyle(asset.criticality)}`}>
                                                    {asset.criticality}
                                                </Badge>
                                            </td>
                                            <td className="py-3 pr-4 text-zinc-400 capitalize">
                                                {asset.exposure.replace(/_/g, " ")}
                                            </td>
                                            <td className="py-3 pr-4 text-right">
                                                <Badge className={`text-xs ${riskBadgeClass(asset.riskScore)}`}>
                                                    {asset.riskScore}
                                                </Badge>
                                            </td>
                                            <td className="py-3 text-right">
                                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button
                                                        variant="ghost" size="icon" className="size-7"
                                                        onClick={() => openEdit(asset)}
                                                    >
                                                        <Pencil className="size-3.5" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost" size="icon"
                                                        className="size-7 text-red-400 hover:text-red-300"
                                                        onClick={() => setDeleteId(asset.id)}
                                                    >
                                                        <Trash2 className="size-3.5" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Create/Edit Dialog */}
            <Dialog open={showForm} onOpenChange={(o) => { if (!o) closeForm(); }}>
                <DialogContent className="bg-zinc-900 border-zinc-800 sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-white">{editingId ? "Edit Asset" : "Register Asset"}</DialogTitle>
                        <DialogDescription>
                            {editingId ? "Update asset details and risk attributes." : "Add a new asset to your inventory."}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label>Asset Name</Label>
                                <Input
                                    placeholder="e.g. Production API Server"
                                    value={form.name}
                                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                                    className="bg-zinc-800 border-zinc-700"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Asset Type</Label>
                                <Select value={form.assetType} onValueChange={(v) => setForm((f) => ({ ...f, assetType: v }))}>
                                    <SelectTrigger className="bg-zinc-800 border-zinc-700"><SelectValue /></SelectTrigger>
                                    <SelectContent className="bg-zinc-800 border-zinc-700">
                                        {ASSET_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Identifier <span className="text-zinc-500">(IP, hostname, URL)</span></Label>
                            <Input
                                placeholder="e.g. 10.0.1.5 or api.example.com"
                                value={form.identifier}
                                onChange={(e) => setForm((f) => ({ ...f, identifier: e.target.value }))}
                                className="bg-zinc-800 border-zinc-700"
                            />
                        </div>
                        <div className="grid sm:grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                                <Label>Criticality</Label>
                                <Select value={form.criticality} onValueChange={(v) => setForm((f) => ({ ...f, criticality: v }))}>
                                    <SelectTrigger className="bg-zinc-800 border-zinc-700"><SelectValue /></SelectTrigger>
                                    <SelectContent className="bg-zinc-800 border-zinc-700">
                                        {CRITICALITY_LEVELS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Exposure</Label>
                                <Select value={form.exposure} onValueChange={(v) => setForm((f) => ({ ...f, exposure: v }))}>
                                    <SelectTrigger className="bg-zinc-800 border-zinc-700"><SelectValue /></SelectTrigger>
                                    <SelectContent className="bg-zinc-800 border-zinc-700">
                                        {EXPOSURE_LEVELS.map((e) => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Status</Label>
                                <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                                    <SelectTrigger className="bg-zinc-800 border-zinc-700"><SelectValue /></SelectTrigger>
                                    <SelectContent className="bg-zinc-800 border-zinc-700">
                                        {ASSET_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid sm:grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                                <Label>Owner / Team</Label>
                                <Input value={form.owner} onChange={(e) => setForm((f) => ({ ...f, owner: e.target.value }))} className="bg-zinc-800 border-zinc-700" placeholder="e.g. DevOps" />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Platform / OS</Label>
                                <Input value={form.platform} onChange={(e) => setForm((f) => ({ ...f, platform: e.target.value }))} className="bg-zinc-800 border-zinc-700" placeholder="e.g. Ubuntu 22.04" />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Version</Label>
                                <Input value={form.version} onChange={(e) => setForm((f) => ({ ...f, version: e.target.value }))} className="bg-zinc-800 border-zinc-700" placeholder="e.g. 1.4.2" />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Notes</Label>
                            <Textarea
                                rows={2}
                                value={form.notes}
                                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                                className="bg-zinc-800 border-zinc-700 resize-none"
                                placeholder="Any additional context, risk notes, or dependencies."
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={closeForm}>Cancel</Button>
                            <Button type="submit" disabled={createMutation.isPending || patchMutation.isPending}>
                                {editingId ? "Save Changes" : "Add Asset"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirm */}
            <AlertDialog open={deleteId !== null} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
                <AlertDialogContent className="bg-zinc-900 border-zinc-800">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove Asset</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to remove <strong>{deleteTarget?.name}</strong> from the inventory? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700"
                            onClick={() => deleteId !== null && removeMutation.mutate({ id: deleteId })}
                        >
                            Remove
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

function StatCard({
    title, value, icon, accent = "text-white", suffix = "",
}: {
    title: string; value: number; icon: React.ReactNode; accent?: string; suffix?: string;
}) {
    return (
        <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="pt-5 flex items-center justify-between">
                <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wide">{title}</p>
                    <p className={`text-3xl font-bold mt-1 ${accent}`}>{value}{suffix}</p>
                </div>
                {icon}
            </CardContent>
        </Card>
    );
}
