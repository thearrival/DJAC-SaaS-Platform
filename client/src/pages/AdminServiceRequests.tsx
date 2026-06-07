/**
 * AdminServiceRequests — Platform admin view of all service/engagement requests.
 * Route: /admin/service-requests
 *
 * Features:
 *   - Filter by status, priority, service type
 *   - Full pipeline view: submitted → under_review → scoping → approved → in_progress → completed
 *   - Assign to employee, add internal notes, send client response
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
    Briefcase,
    CheckCircle2,
    Clock,
    Filter,
    Loader2,
    RefreshCw,
    Search,
    XCircle,
} from "lucide-react";
import { RoleGuard } from "@/components/RoleGuard";

// ─── Types ────────────────────────────────────────────────────────────────────

type ServiceRequest = {
    id: number;
    organizationId: number;
    requestedByUserId: number | null;
    serviceType: string;
    title: string;
    description: string;
    scopeDetails: string | null;
    budgetRange: string | null;
    priority: string;
    status: string;
    assignedToUserId: number | null;
    internalNotes: string | null;
    clientResponse: string | null;
    respondedAt: Date | string | null;
    completedAt: Date | string | null;
    createdAt: Date | string;
    updatedAt: Date | string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
    "all",
    "submitted",
    "under_review",
    "scoping",
    "approved",
    "in_progress",
    "completed",
    "cancelled",
    "on_hold",
] as const;

const PIPELINE_NEXT: Record<string, string> = {
    submitted: "under_review",
    under_review: "scoping",
    scoping: "approved",
    approved: "in_progress",
    in_progress: "completed",
};

const STATUS_COLORS: Record<string, string> = {
    draft: "bg-slate-500/15 text-slate-400 border-slate-500/30",
    submitted: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    under_review: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
    scoping: "bg-violet-500/15 text-violet-400 border-violet-500/30",
    approved: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    in_progress: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    completed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    cancelled: "bg-rose-500/15 text-rose-400 border-rose-500/30",
    on_hold: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
};

const PRIORITY_COLORS: Record<string, string> = {
    low: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    medium: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    high: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    critical: "bg-rose-500/10 text-rose-400 border-rose-500/20",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(d: Date | string | null) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

function formatServiceType(s: string) {
    return s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

function StatusBadge({ status }: { status: string }) {
    const cls = STATUS_COLORS[status] ?? "bg-slate-500/15 text-slate-400 border-slate-500/30";
    return (
        <Badge variant="outline" className={cls}>
            {status.replace(/_/g, " ")}
        </Badge>
    );
}

function PriorityBadge({ priority }: { priority: string }) {
    const cls = PRIORITY_COLORS[priority] ?? "";
    return (
        <Badge variant="outline" className={cls}>
            {priority}
        </Badge>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AdminServiceRequests() {
    usePageTitle("Admin · Service Requests");

    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState<ServiceRequest | null>(null);
    const [editNotes, setEditNotes] = useState("");
    const [editResponse, setEditResponse] = useState("");
    const [editStatus, setEditStatus] = useState("");
    const [editPriority, setEditPriority] = useState("");

    const { data: requests = [], isLoading, isError, refetch } = trpc.serviceRequests.adminList.useQuery(
        undefined,
        { refetchInterval: 60_000 },
    );

    const updateMutation = trpc.serviceRequests.adminUpdate.useMutation({
        onSuccess: () => {
            toast.success("Request updated");
            setSelected(null);
            refetch();
        },
        onError: (err) => {
            toast.error(err.message);
        },
    });

    // ── Stats ────────────────────────────────────────────────────────────────

    const stats = {
        total: requests.length,
        open: requests.filter((r) => !["completed", "cancelled"].includes(r.status)).length,
        inProgress: requests.filter((r) => r.status === "in_progress").length,
        completed: requests.filter((r) => r.status === "completed").length,
    };

    // ── Filtered list ────────────────────────────────────────────────────────

    const filtered = requests.filter((r) => {
        if (statusFilter !== "all" && r.status !== statusFilter) return false;
        if (search) {
            const q = search.toLowerCase();
            return (
                r.title.toLowerCase().includes(q) ||
                r.serviceType.toLowerCase().includes(q) ||
                String(r.organizationId).includes(q)
            );
        }
        return true;
    });

    // ── Open dialog ──────────────────────────────────────────────────────────

    function openDialog(req: ServiceRequest) {
        setSelected(req);
        setEditNotes(req.internalNotes ?? "");
        setEditResponse(req.clientResponse ?? "");
        setEditStatus(req.status);
        setEditPriority(req.priority);
    }

    function handleSave() {
        if (!selected) return;
        updateMutation.mutate({
            id: selected.id,
            status: editStatus,
            priority: editPriority as "low" | "medium" | "high" | "critical",
            internalNotes: editNotes || null,
            clientResponse: editResponse || null,
        } as Parameters<typeof updateMutation.mutate>[0]);
    }

    function handleAdvancePipeline(req: ServiceRequest) {
        const next = PIPELINE_NEXT[req.status];
        if (!next) return;
        updateMutation.mutate({ id: req.id, status: next as Parameters<typeof updateMutation.mutate>[0]["status"] });
    }

    // ── Render ───────────────────────────────────────────────────────────────

    return (
        <RoleGuard required="platform_admin">
            <div className="container mx-auto max-w-7xl space-y-6 py-6 px-4">

                {/* ── Header ── */}
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                            <Briefcase className="h-6 w-6 text-orange-500" />
                            Service Requests
                        </h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Manage engagement requests across all client organizations
                        </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                </div>

                {/* ── Stat cards ── */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                        { label: "Total", value: stats.total, icon: Briefcase, color: "text-slate-400" },
                        { label: "Open", value: stats.open, icon: Clock, color: "text-blue-400" },
                        { label: "In Progress", value: stats.inProgress, icon: RefreshCw, color: "text-orange-400" },
                        { label: "Completed", value: stats.completed, icon: CheckCircle2, color: "text-emerald-400" },
                    ].map(({ label, value, icon: Icon, color }) => (
                        <Card key={label} className="border-border/60">
                            <CardContent className="pt-4 pb-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-muted-foreground">{label}</p>
                                    <Icon className={`h-4 w-4 ${color}`} />
                                </div>
                                <p className="text-2xl font-bold mt-1">{value}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* ── Filters ── */}
                <Card className="border-border/60">
                    <CardContent className="pt-4 pb-4">
                        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                                <Input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search by title, type, or org ID…"
                                    className="pl-9"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <Filter className="h-4 w-4 text-muted-foreground" />
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="w-44">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {STATUS_OPTIONS.map((s) => (
                                            <SelectItem key={s} value={s}>
                                                {s === "all" ? "All Statuses" : s.replace(/_/g, " ")}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* ── Table ── */}
                <Card className="border-border/60">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">
                            {filtered.length} request{filtered.length !== 1 ? "s" : ""}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {isError ? (
                            <div className="text-center py-16 text-muted-foreground">
                                <Briefcase className="h-10 w-10 mx-auto mb-3 opacity-30" />
                                <p className="text-sm">Failed to load service requests.</p>
                                <Button variant="outline" size="sm" onClick={() => { void refetch(); }} className="mt-3">
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Retry
                                </Button>
                            </div>
                        ) : isLoading ? (
                            <div className="flex items-center justify-center py-16">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="text-center py-16 text-muted-foreground">
                                <Briefcase className="h-10 w-10 mx-auto mb-3 opacity-30" />
                                <p className="text-sm">No requests match the current filters.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-12">#</TableHead>
                                            <TableHead>Title</TableHead>
                                            <TableHead>Service Type</TableHead>
                                            <TableHead>Priority</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Org</TableHead>
                                            <TableHead>Submitted</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filtered.map((req) => (
                                            <TableRow
                                                key={req.id}
                                                className="cursor-pointer hover:bg-muted/40"
                                                onClick={() => openDialog(req)}
                                            >
                                                <TableCell className="text-muted-foreground text-xs">
                                                    {req.id}
                                                </TableCell>
                                                <TableCell className="font-medium max-w-xs truncate">
                                                    {req.title}
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {formatServiceType(req.serviceType)}
                                                </TableCell>
                                                <TableCell>
                                                    <PriorityBadge priority={req.priority} />
                                                </TableCell>
                                                <TableCell>
                                                    <StatusBadge status={req.status} />
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    Org {req.organizationId}
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {formatDate(req.createdAt)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {PIPELINE_NEXT[req.status] && (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="text-xs text-orange-400 hover:text-orange-300"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleAdvancePipeline(req);
                                                            }}
                                                        >
                                                            → {PIPELINE_NEXT[req.status]?.replace(/_/g, " ")}
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* ── Edit dialog ── */}
                <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Briefcase className="h-5 w-5 text-orange-500" />
                                Request #{selected?.id} — {selected?.title}
                            </DialogTitle>
                        </DialogHeader>

                        {selected && (
                            <div className="space-y-5">
                                {/* Read-only details */}
                                <div className="grid grid-cols-2 gap-3 text-sm bg-muted/30 rounded-lg p-4">
                                    <div>
                                        <span className="text-muted-foreground">Service Type</span>
                                        <p className="font-medium mt-0.5">{formatServiceType(selected.serviceType)}</p>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Organization</span>
                                        <p className="font-medium mt-0.5">ID {selected.organizationId}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <span className="text-muted-foreground">Description</span>
                                        <p className="mt-0.5 leading-relaxed">{selected.description}</p>
                                    </div>
                                    {selected.scopeDetails && (
                                        <div className="col-span-2">
                                            <span className="text-muted-foreground">Scope</span>
                                            <p className="mt-0.5">{selected.scopeDetails}</p>
                                        </div>
                                    )}
                                    {selected.budgetRange && (
                                        <div>
                                            <span className="text-muted-foreground">Budget</span>
                                            <p className="mt-0.5">{selected.budgetRange}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Editable fields */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label>Status</Label>
                                        <Select value={editStatus} onValueChange={setEditStatus}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {STATUS_OPTIONS.filter((s) => s !== "all").map((s) => (
                                                    <SelectItem key={s} value={s}>
                                                        {s.replace(/_/g, " ")}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label>Priority</Label>
                                        <Select value={editPriority} onValueChange={setEditPriority}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {["low", "medium", "high", "critical"].map((p) => (
                                                    <SelectItem key={p} value={p}>{p}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label>Internal Notes <span className="text-muted-foreground text-xs">(not visible to client)</span></Label>
                                    <Textarea
                                        value={editNotes}
                                        onChange={(e) => setEditNotes(e.target.value)}
                                        rows={3}
                                        placeholder="Add internal team notes…"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label>Client Response <span className="text-muted-foreground text-xs">(visible to client)</span></Label>
                                    <Textarea
                                        value={editResponse}
                                        onChange={(e) => setEditResponse(e.target.value)}
                                        rows={4}
                                        placeholder="Send a message / update to the client…"
                                    />
                                </div>
                            </div>
                        )}

                        <DialogFooter className="gap-2">
                            <Button variant="outline" onClick={() => setSelected(null)}>
                                <XCircle className="h-4 w-4 mr-2" />
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={updateMutation.isPending}
                                className="bg-orange-500 hover:bg-orange-600 text-white"
                            >
                                {updateMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                )}
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </RoleGuard>
    );
}
