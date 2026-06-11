/**
 * SecurityMaturity.tsx
 *
 * Security maturity self-assessment dashboard.
 * Shows latest scores as a radar-style scorecard, trend over time,
 * and lets users create new assessment snapshots.
 *
 * 10 domains scored 1–5 (Initial → Optimized).
 * Overall score = average of all domains mapped to 0–100%.
 */

import { useState } from "react";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { CheckCircle2, Plus, Shield, Trash2, TrendingUp } from "lucide-react";
import { toast } from "sonner";

// ─── Constants ────────────────────────────────────────────────────────────────

const DOMAINS = [
    { key: "scoreGovernance", label: "Governance & Policy" },
    { key: "scoreAssetManagement", label: "Asset Management" },
    { key: "scoreAccessControl", label: "Access Control" },
    { key: "scoreDataProtection", label: "Data Protection" },
    { key: "scoreNetworkSecurity", label: "Network Security" },
    { key: "scoreVulnerabilityMgmt", label: "Vulnerability Management" },
    { key: "scoreIncidentResponse", label: "Incident Response" },
    { key: "scoreBackupRecovery", label: "Backup & Recovery" },
    { key: "scoreThirdPartyRisk", label: "Third-Party Risk" },
    { key: "scoreSecurityAwareness", label: "Security Awareness" },
] as const;

type DomainKey = typeof DOMAINS[number]["key"];

const MATURITY_CONFIG = {
    initial: { label: "Initial", color: "text-red-400", bg: "bg-red-500", pct: 10 },
    developing: { label: "Developing", color: "text-orange-400", bg: "bg-orange-500", pct: 30 },
    defined: { label: "Defined", color: "text-yellow-400", bg: "bg-yellow-500", pct: 55 },
    managed: { label: "Managed", color: "text-blue-400", bg: "bg-blue-500", pct: 75 },
    optimized: { label: "Optimized", color: "text-green-400", bg: "bg-green-500", pct: 95 },
} as const;

const FRAMEWORKS = ["ISO 27001", "NIST CSF", "CIS Controls", "SOC 2", "SAMA CSF", "NCA ECC", "NESA", "custom"] as const;

const SCORE_LABELS: Record<number, string> = {
    1: "Initial — Ad hoc, no formal process",
    2: "Developing — Some processes exist",
    3: "Defined — Documented & consistent",
    4: "Managed — Measured & controlled",
    5: "Optimized — Continuously improving",
};

function scoreColor(score: number) {
    if (score >= 5) return "bg-green-500";
    if (score >= 4) return "bg-blue-500";
    if (score >= 3) return "bg-yellow-500";
    if (score >= 2) return "bg-orange-500";
    return "bg-red-500";
}

type DefaultScores = Record<DomainKey, number>;
const DEFAULT_SCORES: DefaultScores = {
    scoreGovernance: 3,
    scoreAssetManagement: 3,
    scoreAccessControl: 3,
    scoreDataProtection: 3,
    scoreNetworkSecurity: 3,
    scoreVulnerabilityMgmt: 3,
    scoreIncidentResponse: 3,
    scoreBackupRecovery: 3,
    scoreThirdPartyRisk: 3,
    scoreSecurityAwareness: 3,
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function SecurityMaturity() {
    usePageTitle("Security Maturity");

    const [showCreate, setShowCreate] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [title, setTitle] = useState("");
    const [framework, setFramework] = useState<string>("");
    const [recommendations, setRecommendations] = useState("");
    const [scores, setScores] = useState<DefaultScores>(DEFAULT_SCORES);

    const utils = trpc.useUtils();
    const latestQuery = trpc.securityMaturity.latest.useQuery();
    const historyQuery = trpc.securityMaturity.list.useQuery();
    const latest = latestQuery.data;
    const history = historyQuery.data ?? [];
    const isLoading = historyQuery.isLoading;
    const hasLoadError = latestQuery.isError || historyQuery.isError;

    const createMutation = trpc.securityMaturity.create.useMutation({
        onSuccess: () => {
            toast.success("Assessment saved.");
            utils.securityMaturity.latest.invalidate();
            utils.securityMaturity.list.invalidate();
            setShowCreate(false);
            setTitle("");
            setFramework("");
            setRecommendations("");
            setScores(DEFAULT_SCORES);
        },
        onError: (e) => toast.error(e.message),
    });

    const deleteMutation = trpc.securityMaturity.delete.useMutation({
        onSuccess: () => {
            toast.success("Assessment deleted.");
            utils.securityMaturity.latest.invalidate();
            utils.securityMaturity.list.invalidate();
            setDeleteId(null);
        },
        onError: (e) => toast.error(e.message),
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!title.trim()) { toast.error("Title is required."); return; }
        createMutation.mutate({
            title: title.trim(),
            frameworkRef: framework as typeof FRAMEWORKS[number] || undefined,
            recommendations: recommendations.trim() || undefined,
            ...scores,
        });
    }

    const maturityInfo = latest
        ? MATURITY_CONFIG[latest.maturityLevel as keyof typeof MATURITY_CONFIG]
        : null;

    return (
        <div className="flex flex-col gap-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Security Maturity</h1>
                    <p className="text-sm text-zinc-400 mt-1">
                        Assess your organization's cybersecurity maturity across 10 domains
                    </p>
                </div>
                <Button onClick={() => setShowCreate(true)} className="gap-2">
                    <Plus className="size-4" />
                    New Assessment
                </Button>
            </div>

            {hasLoadError && (
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardContent className="py-6 text-center text-zinc-400">
                        <p>Failed to load security maturity data.</p>
                        <Button variant="outline" size="sm" className="mt-3" onClick={() => { void latestQuery.refetch(); void historyQuery.refetch(); }}>
                            Retry
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Latest snapshot */}
            {latest ? (
                <div className="grid gap-4 lg:grid-cols-3">
                    {/* Overall score card */}
                    <Card className="bg-zinc-900 border-zinc-800 lg:col-span-1">
                        <CardHeader>
                            <CardTitle className="text-white text-base">Overall Maturity</CardTitle>
                            <CardDescription>{latest.title}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="text-center py-4">
                                <div className={`text-6xl font-black ${maturityInfo?.color}`}>
                                    {latest.overallScore}
                                    <span className="text-2xl font-medium text-zinc-500">%</span>
                                </div>
                                <Badge className={`mt-3 text-sm px-3 py-1 ${maturityInfo?.color} bg-transparent border border-current`}>
                                    {maturityInfo?.label}
                                </Badge>
                            </div>
                            {/* Progress bar */}
                            <div className="space-y-1">
                                <div className="flex justify-between text-xs text-zinc-500">
                                    <span>Initial</span><span>Optimized</span>
                                </div>
                                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-700 ${maturityInfo?.bg ?? "bg-zinc-500"}`}
                                        style={{ width: `${latest.overallScore}%` }}
                                    />
                                </div>
                            </div>
                            {latest.frameworkRef && (
                                <p className="text-xs text-zinc-500 text-center">
                                    Framework: <span className="text-zinc-300">{latest.frameworkRef}</span>
                                </p>
                            )}
                            <p className="text-xs text-zinc-600 text-center">
                                Assessed {new Date(latest.createdAt).toLocaleDateString()}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Domain breakdown */}
                    <Card className="bg-zinc-900 border-zinc-800 lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="text-white text-base">Domain Scores</CardTitle>
                            <CardDescription>Score per security domain (1 = Initial, 5 = Optimized)</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {DOMAINS.map(({ key, label }) => {
                                    const score = (latest as Record<string, unknown>)[key] as number ?? 1;
                                    const pct = ((score - 1) / 4) * 100;
                                    return (
                                        <div key={key} className="space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-zinc-300">{label}</span>
                                                <span className="text-sm font-medium text-white">{score}/5</span>
                                            </div>
                                            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-700 ${scoreColor(score)}`}
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recommendations */}
                    {latest.recommendations && (
                        <Card className="bg-zinc-900 border-zinc-800 lg:col-span-3">
                            <CardHeader>
                                <CardTitle className="text-white text-base flex items-center gap-2">
                                    <TrendingUp className="size-4 text-blue-400" />
                                    Recommendations
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-zinc-300 whitespace-pre-line leading-relaxed">
                                    {latest.recommendations}
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            ) : !isLoading && !hasLoadError ? (
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardContent className="py-16 text-center">
                        <Shield className="size-12 mx-auto mb-3 text-zinc-700" />
                        <p className="text-zinc-400">No assessments yet.</p>
                        <p className="text-xs text-zinc-600 mt-1">
                            Create your first security maturity assessment to get started.
                        </p>
                        <Button className="mt-4 gap-2" onClick={() => setShowCreate(true)}>
                            <Plus className="size-4" /> Run Assessment
                        </Button>
                    </CardContent>
                </Card>
            ) : null}

            {/* History */}
            {!hasLoadError && history.length > 1 && (
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-white text-base">Assessment History</CardTitle>
                        <CardDescription>Trend of overall maturity score over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="divide-y divide-zinc-800">
                            {history.map((a) => {
                                const mi = MATURITY_CONFIG[a.maturityLevel as keyof typeof MATURITY_CONFIG];
                                return (
                                    <div key={a.id} className="flex items-center justify-between py-3 group">
                                        <div>
                                            <p className="text-sm font-medium text-white">{a.title}</p>
                                            <p className="text-xs text-zinc-500 mt-0.5">
                                                {new Date(a.createdAt).toLocaleDateString("en-GB", {
                                                    day: "numeric", month: "short", year: "numeric",
                                                })}
                                                {a.frameworkRef && ` · ${a.frameworkRef}`}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Badge className={`${mi?.color} bg-transparent border border-current text-xs`}>
                                                {mi?.label}
                                            </Badge>
                                            <span className={`text-2xl font-bold ${mi?.color}`}>
                                                {a.overallScore}%
                                            </span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="size-7 text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => setDeleteId(a.id)}
                                            >
                                                <Trash2 className="size-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Create Dialog */}
            <Dialog open={showCreate} onOpenChange={(o) => { if (!o) setShowCreate(false); }}>
                <DialogContent className="bg-zinc-900 border-zinc-800 sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-white">New Security Maturity Assessment</DialogTitle>
                        <DialogDescription>
                            Score each domain 1–5. Scores are calculated automatically into an overall maturity level.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label>Assessment Title</Label>
                                <Input
                                    placeholder="e.g. Q2 2026 Self-Assessment"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="bg-zinc-800 border-zinc-700"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Framework Reference <span className="text-zinc-500">(optional)</span></Label>
                                <Select value={framework} onValueChange={setFramework}>
                                    <SelectTrigger className="bg-zinc-800 border-zinc-700">
                                        <SelectValue placeholder="Select framework…" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-800 border-zinc-700">
                                        {FRAMEWORKS.map((f) => (
                                            <SelectItem key={f} value={f}>{f}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Domain scores */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-medium text-white">Domain Scores</h4>
                            <div className="grid gap-3">
                                {DOMAINS.map(({ key, label }) => (
                                    <div key={key} className="flex items-center justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <span className="text-sm text-zinc-300">{label}</span>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            {/* Score buttons 1–5 */}
                                            <div className="flex gap-1">
                                                {[1, 2, 3, 4, 5].map((v) => (
                                                    <button
                                                        key={v}
                                                        type="button"
                                                        onClick={() =>
                                                            setScores((s) => ({ ...s, [key]: v }))
                                                        }
                                                        className={`size-8 rounded text-xs font-bold transition-colors ${scores[key] === v
                                                            ? `${scoreColor(v)} text-white`
                                                            : "bg-zinc-800 text-zinc-500 hover:bg-zinc-700"
                                                            }`}
                                                        title={SCORE_LABELS[v]}
                                                    >
                                                        {v}
                                                    </button>
                                                ))}
                                            </div>
                                            <span className="text-xs text-zinc-500 w-24 truncate hidden sm:block">
                                                {SCORE_LABELS[scores[key]]?.split("—")[0].trim()}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Preview computed score */}
                        <div className="bg-zinc-800 rounded-lg p-3 flex items-center justify-between">
                            <span className="text-sm text-zinc-400">Computed overall score</span>
                            <span className="text-lg font-bold text-white">
                                {Math.round(
                                    ((Object.values(scores).reduce((a, b) => a + b, 0) /
                                        Object.values(scores).length -
                                        1) /
                                        4) *
                                    100,
                                )}%
                            </span>
                        </div>

                        <div className="space-y-1.5">
                            <Label>Recommendations <span className="text-zinc-500">(optional)</span></Label>
                            <Textarea
                                rows={3}
                                placeholder="Key findings, priority improvements, or next steps…"
                                value={recommendations}
                                onChange={(e) => setRecommendations(e.target.value)}
                                className="bg-zinc-800 border-zinc-700 resize-none"
                            />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={createMutation.isPending} className="gap-2">
                                <CheckCircle2 className="size-4" />
                                {createMutation.isPending ? "Saving…" : "Save Assessment"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete confirm */}
            <AlertDialog open={deleteId !== null} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
                <AlertDialogContent className="bg-zinc-900 border-zinc-800">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Assessment</AlertDialogTitle>
                        <AlertDialogDescription>
                            This assessment snapshot will be permanently deleted. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700"
                            onClick={() => deleteId !== null && deleteMutation.mutate({ id: deleteId })}
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
