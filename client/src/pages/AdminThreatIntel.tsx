/**
 * AdminThreatIntel — Platform admin threat intelligence publisher.
 * Route: /admin/threat-intel
 *
 * Features:
 *   - View all active & archived bulletins
 *   - Create new global or org-scoped bulletins
 *   - Edit / archive existing items
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { usePageTitle } from "@/hooks/usePageTitle";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    CheckCircle2,
    Loader2,
    Plus,
    RefreshCw,
    ShieldAlert,
    Trash2,
    Edit,
    EyeOff,
} from "lucide-react";
import { RoleGuard } from "@/components/RoleGuard";

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
    "malware", "ransomware", "phishing", "apt", "zero_day", "ddos",
    "supply_chain", "data_breach", "vulnerability", "social_engineering",
    "insider_threat", "other",
] as const;

const SEVERITIES = ["info", "low", "medium", "high", "critical"] as const;
const TLP_LEVELS = ["white", "green", "amber", "red"] as const;

const SEVERITY_COLORS: Record<string, string> = {
    info: "bg-slate-500/15 text-slate-400 border-slate-500/30",
    low: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    medium: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    high: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    critical: "bg-rose-500/15 text-rose-400 border-rose-500/30",
};

const TLP_COLORS: Record<string, string> = {
    white: "bg-slate-500/10 text-slate-300 border-slate-500/20",
    green: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    red: "bg-rose-500/10 text-rose-400 border-rose-500/20",
};

// ─── Empty form ───────────────────────────────────────────────────────────────

const emptyForm = {
    title: "",
    summary: "",
    category: "vulnerability" as typeof CATEGORIES[number],
    severity: "medium" as typeof SEVERITIES[number],
    tlp: "white" as typeof TLP_LEVELS[number],
    threatActor: "",
    affectedSectors: "",
    indicators: "",
    referenceUrl: "",
    cveId: "",
    cvssScore: "",
    organizationId: null as number | null,
};

type ItemForm = typeof emptyForm;
type ThreatIntelItem = {
    id: number;
    organizationId: number | null;
    title: string;
    summary: string;
    threatActor: string | null;
    category: typeof CATEGORIES[number];
    severity: typeof SEVERITIES[number];
    tlp: typeof TLP_LEVELS[number];
    affectedSectors: string | null;
    indicators: string | null;
    referenceUrl: string | null;
    cveId: string | null;
    cvssScore: string | null;
    isActive: number | boolean;
    publishedAt: Date | string;
    createdAt: Date | string;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(d: Date | string | null) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

function SeverityBadge({ severity }: { severity: string }) {
    return <Badge variant="outline" className={SEVERITY_COLORS[severity] ?? ""}>{severity}</Badge>;
}

function TLPBadge({ tlp }: { tlp: string }) {
    return <Badge variant="outline" className={TLP_COLORS[tlp] ?? ""}>TLP:{tlp.toUpperCase()}</Badge>;
}

// ─── Form Fields ──────────────────────────────────────────────────────────────

function ItemFormFields({ form, onChange }: { form: ItemForm; onChange: (f: Partial<ItemForm>) => void }) {
    return (
        <div className="space-y-4">
            <div className="space-y-1.5">
                <Label>Title *</Label>
                <Input value={form.title} onChange={(e) => onChange({ title: e.target.value })} placeholder="e.g. Critical RCE in Apache HTTPD…" />
            </div>

            <div className="space-y-1.5">
                <Label>Summary *</Label>
                <Textarea value={form.summary} onChange={(e) => onChange({ summary: e.target.value })} rows={4} placeholder="Describe the threat in detail…" />
            </div>

            <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                    <Label>Category *</Label>
                    <Select value={form.category} onValueChange={(v) => onChange({ category: v as ItemForm["category"] })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c.replace(/_/g, " ")}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1.5">
                    <Label>Severity *</Label>
                    <Select value={form.severity} onValueChange={(v) => onChange({ severity: v as ItemForm["severity"] })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {SEVERITIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1.5">
                    <Label>TLP *</Label>
                    <Select value={form.tlp} onValueChange={(v) => onChange({ tlp: v as ItemForm["tlp"] })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {TLP_LEVELS.map((t) => <SelectItem key={t} value={t}>TLP:{t.toUpperCase()}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <Label>Threat Actor</Label>
                    <Input value={form.threatActor} onChange={(e) => onChange({ threatActor: e.target.value })} placeholder="e.g. APT29, Lazarus Group" />
                </div>
                <div className="space-y-1.5">
                    <Label>CVE ID</Label>
                    <Input value={form.cveId} onChange={(e) => onChange({ cveId: e.target.value })} placeholder="CVE-2024-XXXXX" />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <Label>CVSS Score</Label>
                    <Input value={form.cvssScore} onChange={(e) => onChange({ cvssScore: e.target.value })} placeholder="9.8" />
                </div>
                <div className="space-y-1.5">
                    <Label>Affected Sectors</Label>
                    <Input value={form.affectedSectors} onChange={(e) => onChange({ affectedSectors: e.target.value })} placeholder="finance, healthcare, …" />
                </div>
            </div>

            <div className="space-y-1.5">
                <Label>Indicators of Compromise</Label>
                <Textarea value={form.indicators} onChange={(e) => onChange({ indicators: e.target.value })} rows={3} placeholder="One indicator per line: IP, hash, domain, file name…" />
            </div>

            <div className="space-y-1.5">
                <Label>Reference URL</Label>
                <Input value={form.referenceUrl} onChange={(e) => onChange({ referenceUrl: e.target.value })} placeholder="https://nvd.nist.gov/vuln/detail/…" />
            </div>

            <div className="space-y-1.5">
                <Label>Scope</Label>
                <p className="text-xs text-muted-foreground">Leave Organization ID empty to publish a global bulletin visible to all orgs.</p>
                <Input
                    type="number"
                    value={form.organizationId ?? ""}
                    onChange={(e) => onChange({ organizationId: e.target.value ? parseInt(e.target.value) : null })}
                    placeholder="Global (leave empty)"
                />
            </div>
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AdminThreatIntel() {
    usePageTitle("Admin · Threat Intelligence");

    const [showDialog, setShowDialog] = useState(false);
    const [editItem, setEditItem] = useState<ThreatIntelItem | null>(null);
    const [form, setForm] = useState<ItemForm>({ ...emptyForm });

    const _ctx = trpc.useUtils();

    // Use feed with no filters to get all items from the current org context
    const { data: feedItems = [], isLoading, isError, refetch } = trpc.threatIntel.feed.useQuery(
        { limit: 200 },
        { refetchInterval: 120_000 },
    );

    const createMutation = trpc.threatIntel.adminCreate.useMutation({
        onSuccess: () => {
            toast.success("Bulletin published");
            setShowDialog(false);
            setForm({ ...emptyForm });
            refetch();
        },
        onError: (err) => toast.error(err.message),
    });

    const updateMutation = trpc.threatIntel.adminUpdate.useMutation({
        onSuccess: () => {
            toast.success("Bulletin updated");
            setEditItem(null);
            refetch();
        },
        onError: (err) => toast.error(err.message),
    });

    const removeMutation = trpc.threatIntel.adminRemove.useMutation({
        onSuccess: () => {
            toast.success("Bulletin archived");
            refetch();
        },
        onError: (err) => toast.error(err.message),
    });

    function openCreate() {
        setForm({ ...emptyForm });
        setEditItem(null);
        setShowDialog(true);
    }

    function openEdit(item: ThreatIntelItem) {
        setEditItem(item);
        setForm({
            title: item.title,
            summary: item.summary,
            category: item.category,
            severity: item.severity,
            tlp: item.tlp,
            threatActor: item.threatActor ?? "",
            affectedSectors: item.affectedSectors ?? "",
            indicators: item.indicators ?? "",
            referenceUrl: item.referenceUrl ?? "",
            cveId: item.cveId ?? "",
            cvssScore: item.cvssScore ?? "",
            organizationId: item.organizationId,
        });
        setShowDialog(true);
    }

    function handleSubmit() {
        const payload = {
            ...form,
            threatActor: form.threatActor || undefined,
            affectedSectors: form.affectedSectors || undefined,
            indicators: form.indicators || undefined,
            referenceUrl: form.referenceUrl || undefined,
            cveId: form.cveId || undefined,
            cvssScore: form.cvssScore || undefined,
            organizationId: form.organizationId ?? undefined,
        };

        if (editItem) {
            updateMutation.mutate({ id: editItem.id, ...payload });
        } else {
            createMutation.mutate(payload);
        }
    }

    const isPending = createMutation.isPending || updateMutation.isPending;

    return (
        <RoleGuard required="platform_admin">
            <div className="container mx-auto max-w-7xl space-y-6 py-6 px-4">

                {/* ── Header ── */}
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                            <ShieldAlert className="h-6 w-6 text-orange-500" />
                            Threat Intelligence Publisher
                        </h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Publish and manage threat bulletins visible to client organizations
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
                            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                            Refresh
                        </Button>
                        <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white" onClick={openCreate}>
                            <Plus className="h-4 w-4 mr-2" />
                            Publish Bulletin
                        </Button>
                    </div>
                </div>

                {/* ── Bulletins table ── */}
                <Card className="border-border/60">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">
                            {feedItems.length} bulletin{feedItems.length !== 1 ? "s" : ""}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {isError ? (
                            <div className="text-center py-16 text-muted-foreground">
                                <ShieldAlert className="h-10 w-10 mx-auto mb-3 opacity-30" />
                                <p className="text-sm">Failed to load threat bulletins.</p>
                                <Button variant="outline" size="sm" onClick={() => { void refetch(); }} className="mt-3">
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Retry
                                </Button>
                            </div>
                        ) : isLoading ? (
                            <div className="flex items-center justify-center py-16">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : feedItems.length === 0 ? (
                            <div className="text-center py-16 text-muted-foreground">
                                <ShieldAlert className="h-10 w-10 mx-auto mb-3 opacity-30" />
                                <p className="text-sm">No bulletins published yet.</p>
                                <Button variant="link" size="sm" onClick={openCreate} className="mt-2">
                                    Publish the first one →
                                </Button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-12">#</TableHead>
                                            <TableHead>Title</TableHead>
                                            <TableHead>Category</TableHead>
                                            <TableHead>Severity</TableHead>
                                            <TableHead>TLP</TableHead>
                                            <TableHead>Scope</TableHead>
                                            <TableHead>Published</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {(feedItems as unknown as ThreatIntelItem[]).map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell className="text-muted-foreground text-xs">{item.id}</TableCell>
                                                <TableCell className="font-medium max-w-xs truncate">
                                                    {item.title}
                                                    {item.cveId && (
                                                        <span className="ml-2 text-xs text-cyan-400 font-mono">{item.cveId}</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground capitalize">
                                                    {item.category.replace(/_/g, " ")}
                                                </TableCell>
                                                <TableCell>
                                                    <SeverityBadge severity={item.severity} />
                                                </TableCell>
                                                <TableCell>
                                                    <TLPBadge tlp={item.tlp} />
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {item.organizationId ? `Org ${item.organizationId}` : "Global"}
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {fmt(item.publishedAt)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-7 w-7"
                                                            title="Edit"
                                                            onClick={() => openEdit(item)}
                                                        >
                                                            <Edit className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-7 w-7 text-rose-400 hover:text-rose-300"
                                                            title={item.isActive ? "Archive" : "Already archived"}
                                                            disabled={!item.isActive || removeMutation.isPending}
                                                            onClick={() => removeMutation.mutate({ id: item.id })}
                                                        >
                                                            {item.isActive ? (
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            ) : (
                                                                <EyeOff className="h-3.5 w-3.5" />
                                                            )}
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* ── Create / Edit dialog ── */}
                <Dialog open={showDialog} onOpenChange={(o) => { if (!o) { setShowDialog(false); setEditItem(null); } }}>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <ShieldAlert className="h-5 w-5 text-orange-500" />
                                {editItem ? `Edit Bulletin #${editItem.id}` : "Publish New Bulletin"}
                            </DialogTitle>
                        </DialogHeader>

                        <ItemFormFields form={form} onChange={(p) => setForm((f) => ({ ...f, ...p }))} />

                        <DialogFooter className="gap-2 pt-2">
                            <Button variant="outline" onClick={() => { setShowDialog(false); setEditItem(null); }}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={isPending || !form.title || !form.summary}
                                className="bg-orange-500 hover:bg-orange-600 text-white"
                            >
                                {isPending ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                )}
                                {editItem ? "Save Changes" : "Publish"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </RoleGuard>
    );
}
