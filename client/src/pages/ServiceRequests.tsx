/**
 * ServiceRequests.tsx
 *
 * Client-facing page for submitting and tracking cybersecurity service
 * engagement requests (pentest, audit, SOC support, consulting, etc.).
 *
 * Features:
 *   • Status-based Kanban-style summary cards
 *   • Request list with status badges and priority indicators
 *   • Submit new request dialog with full scope description
 *   • Cancel own submitted requests
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
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
    CheckCircle2,
    ClipboardList,
    Clock,
    FileSearch,
    Plus,
    Shield,
    XCircle,
} from "lucide-react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

const SERVICE_TYPES = [
    { value: "penetration_test", label: "Penetration Test" },
    { value: "red_team", label: "Red Team Exercise" },
    { value: "security_audit", label: "Security Audit" },
    { value: "soc_support", label: "SOC Support" },
    { value: "incident_response", label: "Incident Response" },
    { value: "consulting", label: "Security Consulting" },
    { value: "phishing_simulation", label: "Phishing Simulation" },
    { value: "cloud_security_review", label: "Cloud Security Review" },
    { value: "vulnerability_assessment", label: "Vulnerability Assessment" },
    { value: "compliance_gap_assessment", label: "Compliance Gap Assessment" },
] as const;

const PRIORITIES = [
    { value: "low", label: "Low", color: "bg-blue-500/10 text-blue-400" },
    { value: "medium", label: "Medium", color: "bg-yellow-500/10 text-yellow-400" },
    { value: "high", label: "High", color: "bg-orange-500/10 text-orange-400" },
    { value: "critical", label: "Critical", color: "bg-red-500/10 text-red-400" },
] as const;

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    draft: { label: "Draft", color: "bg-zinc-500/10 text-zinc-400", icon: <ClipboardList className="size-3" /> },
    submitted: { label: "Submitted", color: "bg-blue-500/10 text-blue-400", icon: <Clock className="size-3" /> },
    under_review: { label: "Under Review", color: "bg-purple-500/10 text-purple-400", icon: <FileSearch className="size-3" /> },
    scoping: { label: "Scoping", color: "bg-indigo-500/10 text-indigo-400", icon: <FileSearch className="size-3" /> },
    approved: { label: "Approved", color: "bg-teal-500/10 text-teal-400", icon: <CheckCircle2 className="size-3" /> },
    in_progress: { label: "In Progress", color: "bg-yellow-500/10 text-yellow-400", icon: <Shield className="size-3" /> },
    completed: { label: "Completed", color: "bg-green-500/10 text-green-400", icon: <CheckCircle2 className="size-3" /> },
    cancelled: { label: "Cancelled", color: "bg-zinc-500/10 text-zinc-500", icon: <XCircle className="size-3" /> },
    on_hold: { label: "On Hold", color: "bg-orange-500/10 text-orange-400", icon: <AlertTriangle className="size-3" /> },
};

import type React from "react";

// ─── Component ────────────────────────────────────────────────────────────────

export default function ServiceRequests() {
    usePageTitle("Service Requests");

    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState({
        serviceType: "penetration_test" as string,
        title: "",
        description: "",
        scopeDetails: "",
        preferredStartDate: "",
        budgetRange: "",
        priority: "medium" as string,
    });

    const utils = trpc.useUtils();
    const { data: requests = [], isLoading, isError, refetch } = trpc.serviceRequests.list.useQuery();

    const createMutation = trpc.serviceRequests.create.useMutation({
        onSuccess: () => {
            toast.success("Service request submitted successfully.");
            utils.serviceRequests.list.invalidate();
            setShowCreate(false);
            setForm({
                serviceType: "penetration_test",
                title: "",
                description: "",
                scopeDetails: "",
                preferredStartDate: "",
                budgetRange: "",
                priority: "medium",
            });
        },
        onError: (err) => toast.error(err.message),
    });

    const cancelMutation = trpc.serviceRequests.cancel.useMutation({
        onSuccess: () => {
            toast.success("Request cancelled.");
            utils.serviceRequests.list.invalidate();
        },
        onError: (err) => toast.error(err.message),
    });

    // ── Stats ────────────────────────────────────────────────────────────
    const activeCount = requests.filter((r) =>
        ["submitted", "under_review", "scoping", "approved", "in_progress"].includes(r.status),
    ).length;
    const completedCount = requests.filter((r) => r.status === "completed").length;
    const pendingReviewCount = requests.filter((r) =>
        ["submitted", "under_review"].includes(r.status),
    ).length;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.title.trim() || !form.description.trim()) {
            toast.error("Title and description are required.");
            return;
        }
        createMutation.mutate({
            serviceType: form.serviceType as Parameters<typeof createMutation.mutate>[0]["serviceType"],
            title: form.title.trim(),
            description: form.description.trim(),
            scopeDetails: form.scopeDetails.trim() || undefined,
            preferredStartDate: form.preferredStartDate || undefined,
            budgetRange: form.budgetRange.trim() || undefined,
            priority: form.priority as Parameters<typeof createMutation.mutate>[0]["priority"],
        });
    };

    const getPriorityStyle = (priority: string) =>
        PRIORITIES.find((p) => p.value === priority)?.color ?? "";

    const getServiceLabel = (type: string) =>
        SERVICE_TYPES.find((s) => s.value === type)?.label ?? type;

    return (
        <div className="flex flex-col gap-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Service Requests</h1>
                    <p className="text-sm text-zinc-400 mt-1">
                        Request cybersecurity services from the Yalla-Hack team
                    </p>
                </div>
                <Button onClick={() => setShowCreate(true)} className="gap-2">
                    <Plus className="size-4" />
                    New Request
                </Button>
            </div>

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard title="Total Requests" value={requests.length} icon={<ClipboardList className="size-5 text-zinc-400" />} />
                <StatCard title="Active" value={activeCount} icon={<Shield className="size-5 text-blue-400" />} accent="text-blue-400" />
                <StatCard title="Pending Review" value={pendingReviewCount} icon={<Clock className="size-5 text-yellow-400" />} accent="text-yellow-400" />
                <StatCard title="Completed" value={completedCount} icon={<CheckCircle2 className="size-5 text-green-400" />} accent="text-green-400" />
            </div>

            {/* Request List */}
            <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                    <CardTitle className="text-white">Your Requests</CardTitle>
                    <CardDescription>
                        Track the status of your cybersecurity service engagements
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isError ? (
                        <div className="text-center py-12 text-zinc-500">
                            <Shield className="size-12 mx-auto mb-3 opacity-30" />
                            <p>Failed to load service requests.</p>
                            <Button variant="outline" size="sm" className="mt-3" onClick={() => { void refetch(); }}>
                                Retry
                            </Button>
                        </div>
                    ) : isLoading ? (
                        <div className="text-center py-12 text-zinc-500">Loading requests…</div>
                    ) : requests.length === 0 ? (
                        <div className="text-center py-12 text-zinc-500">
                            <Shield className="size-12 mx-auto mb-3 opacity-30" />
                            <p>No service requests yet.</p>
                            <p className="text-xs mt-1">Submit a request to get started with a cybersecurity engagement.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-zinc-800">
                            {requests.map((req) => {
                                const sc = STATUS_CONFIG[req.status] ?? STATUS_CONFIG.submitted;
                                const canCancel = ["draft", "submitted"].includes(req.status);
                                return (
                                    <div key={req.id} className="py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-medium text-white truncate">{req.title}</span>
                                                <Badge className={`gap-1 text-xs ${sc.color}`}>
                                                    {sc.icon}{sc.label}
                                                </Badge>
                                                <Badge className={`text-xs ${getPriorityStyle(req.priority)}`}>
                                                    {req.priority}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                                                <span>{getServiceLabel(req.serviceType)}</span>
                                                <span>•</span>
                                                <span>{new Date(req.createdAt).toLocaleDateString()}</span>
                                                {req.clientResponse && (
                                                    <>
                                                        <span>•</span>
                                                        <span className="text-teal-400">Response available</span>
                                                    </>
                                                )}
                                            </div>
                                            {req.clientResponse && (
                                                <p className="mt-2 text-xs text-zinc-300 bg-zinc-800 rounded p-2 border-l-2 border-teal-500">
                                                    {req.clientResponse}
                                                </p>
                                            )}
                                        </div>
                                        {canCancel && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-zinc-500 hover:text-red-400 shrink-0"
                                                disabled={cancelMutation.isPending}
                                                onClick={() => cancelMutation.mutate({ id: req.id })}
                                            >
                                                <XCircle className="size-4 mr-1" />
                                                Cancel
                                            </Button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Create Dialog */}
            <Dialog open={showCreate} onOpenChange={setShowCreate}>
                <DialogContent className="bg-zinc-900 border-zinc-800 sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-white">New Service Request</DialogTitle>
                        <DialogDescription>
                            Describe the cybersecurity service you need. Our team will review and respond within 24–48 hours.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label>Service Type</Label>
                                <Select
                                    value={form.serviceType}
                                    onValueChange={(v) => setForm((f) => ({ ...f, serviceType: v }))}
                                >
                                    <SelectTrigger className="bg-zinc-800 border-zinc-700">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-800 border-zinc-700">
                                        {SERVICE_TYPES.map((s) => (
                                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Priority</Label>
                                <Select
                                    value={form.priority}
                                    onValueChange={(v) => setForm((f) => ({ ...f, priority: v }))}
                                >
                                    <SelectTrigger className="bg-zinc-800 border-zinc-700">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-800 border-zinc-700">
                                        {PRIORITIES.map((p) => (
                                            <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Request Title</Label>
                            <Input
                                placeholder="e.g. External penetration test for production environment"
                                value={form.title}
                                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                                className="bg-zinc-800 border-zinc-700"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Description & Objectives</Label>
                            <Textarea
                                placeholder="Describe what you need, your goals, any compliance requirements, etc."
                                rows={4}
                                value={form.description}
                                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                                className="bg-zinc-800 border-zinc-700 resize-none"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Scope Details <span className="text-zinc-500">(optional)</span></Label>
                            <Textarea
                                placeholder="List systems, IP ranges, domains, or applications in scope."
                                rows={3}
                                value={form.scopeDetails}
                                onChange={(e) => setForm((f) => ({ ...f, scopeDetails: e.target.value }))}
                                className="bg-zinc-800 border-zinc-700 resize-none"
                            />
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label>Preferred Start Date <span className="text-zinc-500">(optional)</span></Label>
                                <Input
                                    type="date"
                                    value={form.preferredStartDate}
                                    onChange={(e) => setForm((f) => ({ ...f, preferredStartDate: e.target.value }))}
                                    className="bg-zinc-800 border-zinc-700"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Budget Range <span className="text-zinc-500">(optional)</span></Label>
                                <Input
                                    placeholder="e.g. $5,000 – $15,000"
                                    value={form.budgetRange}
                                    onChange={(e) => setForm((f) => ({ ...f, budgetRange: e.target.value }))}
                                    className="bg-zinc-800 border-zinc-700"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={createMutation.isPending}>
                                {createMutation.isPending ? "Submitting…" : "Submit Request"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function StatCard({
    title,
    value,
    icon,
    accent = "text-white",
}: {
    title: string;
    value: number;
    icon: React.ReactNode;
    accent?: string;
}) {
    return (
        <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="pt-5 flex items-center justify-between">
                <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wide">{title}</p>
                    <p className={`text-3xl font-bold mt-1 ${accent}`}>{value}</p>
                </div>
                {icon}
            </CardContent>
        </Card>
    );
}
