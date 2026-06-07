import { useEffect, useMemo, useState } from "react";
import type React from "react";
import { useLocale } from "@/contexts/useLocale";
import { formatDateTime } from "@/lib/intl";
import { usePageTitle } from "@/hooks/usePageTitle";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, LoaderCircle, RefreshCw, ServerCrash, Trash2 } from "lucide-react";
import { toast as sonnerToast } from "sonner";

type JobStatus = "queued" | "running" | "completed" | "failed";

function formatStage(stage: string) {
    return stage
        .replace(/_/g, " ")
        .replace(/\b\w/g, char => char.toUpperCase());
}

function formatTime(value?: string, fallback = "N/A", locale?: string) {
    return formatDateTime(value, locale, fallback);
}

function shortJobId(id: string) {
    return id.length > 8 ? id.slice(0, 8) : id;
}

function getStatusBadgeClass(status: JobStatus) {
    switch (status) {
        case "completed":
            return "bg-green-100 dark:bg-green-950/50 text-green-800 dark:text-green-300";
        case "failed":
            return "bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-300";
        case "running":
            return "bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300";
        default:
            return "bg-muted text-muted-foreground";
    }
}

function formatStorageType(
    value: "file" | "redis" | "memory_only",
    t: (key: string, fallback: string) => string
) {
    switch (value) {
        case "file":
            return t("ops.storageTypeFile", "File-backed");
        case "redis":
            return t("ops.storageTypeRedis", "Redis-backed");
        default:
            return t("ops.storageTypeMemoryOnly", "Memory only");
    }
}

function getErrorMessage(error: unknown) {
    if (error && typeof error === "object" && "message" in error) {
        return String((error as { message?: unknown }).message || "");
    }

    return "";
}

export default function OperationsStatus() {
    usePageTitle("Operations Status");
    const { t, locale } = useLocale();

    const readinessQuery = trpc.system.readiness.useQuery(undefined, {
        refetchInterval: 10000,
    });
    const historyQuery = trpc.ai.historyDiagnostics.useQuery(undefined, {
        refetchInterval: 10000,
    });
    const streamConfigQuery = trpc.ai.streamConfig.useQuery(undefined, {
        staleTime: Number.POSITIVE_INFINITY,
    });
    const jobsQuery = trpc.ai.listAssessmentJobs.useQuery(
        { limit: 25 },
        {
            refetchInterval: 3000,
        }
    );
    const clearHistoryMutation = trpc.ai.clearHistory.useMutation();

    useEffect(() => {
        if (readinessQuery.error) sonnerToast.error(t("ops.readinessLoadError", "Failed to load readiness status."));
    }, [readinessQuery.error]);
    useEffect(() => {
        if (historyQuery.error) sonnerToast.error(t("ops.historyLoadError", "Failed to load diagnostics history."));
    }, [historyQuery.error]);
    useEffect(() => {
        if (streamConfigQuery.error) sonnerToast.error(t("ops.streamConfigLoadError", "Failed to load stream configuration."));
    }, [streamConfigQuery.error]);
    useEffect(() => {
        if (jobsQuery.error) sonnerToast.error(t("ops.jobsLoadError", "Failed to load assessment jobs."));
    }, [jobsQuery.error]);

    const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);

    const readiness = readinessQuery.data;
    const history = historyQuery.data;
    const jobs = jobsQuery.data ?? [];
    const hasCoreLoadError = readinessQuery.isError || historyQuery.isError || streamConfigQuery.isError || jobsQuery.isError;
    const coreLoadErrorMessage = readinessQuery.error?.message
        ?? historyQuery.error?.message
        ?? streamConfigQuery.error?.message
        ?? jobsQuery.error?.message;

    const jobSummary = useMemo(
        () =>
            jobs.reduce(
                (summary, job) => {
                    summary[job.status] += 1;
                    return summary;
                },
                {
                    queued: 0,
                    running: 0,
                    completed: 0,
                    failed: 0,
                } as Record<JobStatus, number>
            ),
        [jobs]
    );

    const handleRefresh = () => {
        void readinessQuery.refetch();
        void historyQuery.refetch();
        void jobsQuery.refetch();
        void streamConfigQuery.refetch();
    };

    const requestClearHistory = () => {
        if (!history?.supportsClear) {
            sonnerToast.info(t("ops.clearUnavailable", "Clear history is unavailable in the current queue mode."));
            return;
        }

        setIsClearDialogOpen(true);
    };

    const handleClearHistory = async () => {
        try {
            const result = await clearHistoryMutation.mutateAsync();
            setIsClearDialogOpen(false);
            sonnerToast.success(t("ops.historyCleared", "History cleared"), {
                description: result.details,
            });
            void historyQuery.refetch();
            void jobsQuery.refetch();
        } catch (error) {
            sonnerToast.error(t("ops.historyClearFailed", "Failed to clear history"), {
                description: getErrorMessage(error) || t("common.unknownError", "Unknown error"),
            });
        }
    };

    const translateStatus = (status: JobStatus) => {
        return t(`common.status.${status}`, status);
    };

    const translateStage = (stage: string) => {
        return t(`common.stage.${stage}`, formatStage(stage));
    };

    return (
        <div className="djac-page">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">
                        {t("ops.title", "Operations Status")}
                    </h1>
                    <p className="text-slate-600">
                        {t(
                            "ops.subtitle",
                            "Track runtime readiness, AI pipeline transport, and recent assessment jobs."
                        )}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {readiness?.ok ? (
                        <Badge className="bg-green-100 dark:bg-green-950/50 text-green-800 dark:text-green-300">
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                            {t("ops.systemHealthy", "System Healthy")}
                        </Badge>
                    ) : (
                        <Badge className="bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-300">
                            <ServerCrash className="h-3.5 w-3.5 mr-1" />
                            {t("ops.degraded", "Degraded")}
                        </Badge>
                    )}
                    <Button variant="outline" size="sm" onClick={handleRefresh}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        {t("ops.refresh", "Refresh")}
                    </Button>
                </div>
            </div>

            {hasCoreLoadError && (
                <Card className="mb-6 border-destructive/40 bg-destructive/5">
                    <CardContent className="flex flex-col gap-3 py-4 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
                        <p className="text-sm text-muted-foreground">
                            {coreLoadErrorMessage ?? t("ops.loadError", "Failed to load one or more operations datasets.")}
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={handleRefresh}
                        >
                            {t("common.retry", "Retry")}
                        </Button>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-700">
                            {t("ops.queueMode", "Queue Mode")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-slate-900 capitalize">
                            {streamConfigQuery.data?.queueMode ?? t("ops.notAvailable", "N/A")}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                            {t("ops.queueModeDesc", "Selected by environment configuration")}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-700">
                            {t("ops.websocketPath", "WebSocket Path")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-lg font-semibold text-slate-900 break-all">
                            {streamConfigQuery.data?.websocketPath ?? t("ops.notAvailable", "N/A")}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                            {t("ops.streamTransport", "Live updates transport endpoint")}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-700">
                            {t("ops.runningJobs", "Running Jobs")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-slate-900">{jobSummary.running}</p>
                        <p className="text-xs text-slate-500 mt-1">
                            {t("ops.activePipelines", "Active orchestration pipelines")}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-700">
                            {t("ops.failedJobs", "Failed Jobs")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-slate-900">{jobSummary.failed}</p>
                        <p className="text-xs text-slate-500 mt-1">
                            {t("ops.inRecentWindow", "In recent assessment window")}
                        </p>
                    </CardContent>
                </Card>

            </div>

            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>{t("ops.readinessChecks", "Readiness Checks")}</CardTitle>
                    <CardDescription>
                        {t(
                            "ops.readinessDesc",
                            "Database, Redis, and orchestrator readiness are refreshed every 10 seconds."
                        )}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {readinessQuery.isError ? (
                        <div className="space-y-3">
                            <p className="text-sm text-red-700 dark:text-red-400">
                                {readinessQuery.error?.message ?? t("ops.readinessLoadError", "Failed to load readiness status.")}
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => {
                                    void readinessQuery.refetch();
                                }}
                            >
                                {t("common.retry", "Retry")}
                            </Button>
                        </div>
                    ) : readinessQuery.isLoading ? (
                        <div className="flex items-center gap-2 text-slate-600">
                            <LoaderCircle className="h-4 w-4 animate-spin" />
                            <span>{t("ops.loadingReadiness", "Loading readiness...")}</span>
                        </div>
                    ) : readiness ? (
                        <div className="space-y-3 text-sm">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                                <div className="rounded-md border bg-slate-50 p-3">
                                    <p className="font-medium text-slate-900">
                                        {t("ops.database", "Database")}
                                    </p>
                                    <Badge className={readiness.services.database.ready ? "bg-green-100 dark:bg-green-950/50 text-green-800 dark:text-green-300 mt-2" : "bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-300 mt-2"}>
                                        {readiness.services.database.ready ? t("ops.ready", "Ready") : t("ops.notReady", "Not Ready")}
                                    </Badge>
                                    <p className="text-slate-600 mt-2">{readiness.services.database.details}</p>
                                </div>

                                <div className="rounded-md border bg-slate-50 p-3">
                                    <p className="font-medium text-slate-900">
                                        {t("ops.redis", "Redis")}
                                    </p>
                                    <Badge className={readiness.services.redis.ready ? "bg-green-100 dark:bg-green-950/50 text-green-800 dark:text-green-300 mt-2" : "bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-300 mt-2"}>
                                        {readiness.services.redis.ready ? t("ops.ready", "Ready") : t("ops.notReady", "Not Ready")}
                                    </Badge>
                                    <p className="text-slate-600 mt-2">{readiness.services.redis.details}</p>
                                </div>

                                <div className="rounded-md border bg-slate-50 p-3">
                                    <p className="font-medium text-slate-900">
                                        {t("ops.orchestrator", "AI Orchestrator")}
                                    </p>
                                    <Badge className={readiness.services.aiOrchestrator.ready ? "bg-green-100 dark:bg-green-950/50 text-green-800 dark:text-green-300 mt-2" : "bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-300 mt-2"}>
                                        {readiness.services.aiOrchestrator.ready ? t("ops.ready", "Ready") : t("ops.notReady", "Not Ready")}
                                    </Badge>
                                    <p className="text-slate-600 mt-2">{readiness.services.aiOrchestrator.details}</p>
                                    <p className="text-slate-600 mt-1">
                                        {t("ops.agentSwarm", "Agent Swarm Configured")}: {readiness.services.aiOrchestrator.agentSwarmConfigured ? t("ops.yes", "Yes") : t("ops.no", "No")}
                                    </p>
                                    <p className="text-slate-600 mt-1">
                                        {t("ops.wsPathLabel", "WebSocket")}: {readiness.services.aiOrchestrator.websocketPath}
                                    </p>
                                </div>
                            </div>
                            <p className="text-xs text-slate-500">
                                {t("ops.lastUpdated", "Last updated")}: {formatTime(readiness.timestamp, t("ops.notAvailable", "N/A"), locale)}
                            </p>
                        </div>
                    ) : (
                        <p className="text-sm text-red-700 dark:text-red-400">{t("ops.readinessUnavailable", "Readiness data unavailable.")}</p>
                    )}
                </CardContent>
            </Card>

            <Card className="mb-6">
                <CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                        <CardTitle>{t("ops.historyStorage", "History Storage")}</CardTitle>
                        <CardDescription>
                            {t(
                                "ops.historyDesc",
                                "Inspect durable job history storage and clear persisted snapshots for your account."
                            )}
                        </CardDescription>
                    </div>
                    <div className="flex flex-col items-start gap-2 md:items-end">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={requestClearHistory}
                            disabled={!history?.supportsClear || clearHistoryMutation.isPending}
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {clearHistoryMutation.isPending
                                ? t("ops.clearingHistory", "Clearing...")
                                : t("ops.clearHistory", "Clear Persisted History")}
                        </Button>
                        <p className="text-xs text-muted-foreground" role="status" aria-live="polite">
                            {clearHistoryMutation.isPending
                                ? t("ops.clearInProgressHint", "Clearing persisted history. Active jobs continue running.")
                                : t("ops.clearHint", "Only saved history is removed. Running jobs are not interrupted.")}
                        </p>
                    </div>
                </CardHeader>
                <CardContent>
                    {historyQuery.isError ? (
                        <div className="space-y-3">
                            <p className="text-sm text-red-700 dark:text-red-400">
                                {historyQuery.error?.message ?? t("ops.historyLoadError", "Failed to load diagnostics history.")}
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => {
                                    void historyQuery.refetch();
                                }}
                            >
                                {t("common.retry", "Retry")}
                            </Button>
                        </div>
                    ) : historyQuery.isLoading ? (
                        <div className="flex items-center gap-2 text-slate-600">
                            <LoaderCircle className="h-4 w-4 animate-spin" />
                            <span>{t("ops.historyLoading", "Loading history diagnostics...")}</span>
                        </div>
                    ) : history ? (
                        <div className="space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 text-sm">
                                <div className="rounded-md border bg-slate-50 p-3">
                                    <p className="font-medium text-slate-900">
                                        {t("ops.storageType", "Storage Type")}
                                    </p>
                                    <p className="text-slate-600 mt-2">
                                        {formatStorageType(history.storageType, t)}
                                    </p>
                                </div>
                                <div className="rounded-md border bg-slate-50 p-3">
                                    <p className="font-medium text-slate-900">
                                        {t("ops.storageStatus", "Storage Status")}
                                    </p>
                                    <Badge className={history.storageEnabled ? "bg-green-100 dark:bg-green-950/50 text-green-800 dark:text-green-300 mt-2" : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 mt-2"}>
                                        {history.storageEnabled ? t("ops.enabled", "Enabled") : t("ops.disabled", "Disabled")}
                                    </Badge>
                                </div>
                                <div className="rounded-md border bg-slate-50 p-3">
                                    <p className="font-medium text-slate-900">
                                        {t("ops.historyEntries", "History Entries")}
                                    </p>
                                    <p className="text-2xl font-bold text-slate-900 mt-2">
                                        {history.historyEntryCount}
                                    </p>
                                </div>
                                <div className="rounded-md border bg-slate-50 p-3">
                                    <p className="font-medium text-slate-900">
                                        {t("ops.activeJobsLabel", "Active Jobs")}
                                    </p>
                                    <p className="text-2xl font-bold text-slate-900 mt-2">
                                        {history.activeJobCount}
                                    </p>
                                </div>
                                <div className="rounded-md border bg-slate-50 p-3">
                                    <p className="font-medium text-slate-900">
                                        {t("ops.queuedJobsLabel", "Queued Jobs")}
                                    </p>
                                    <p className="text-2xl font-bold text-slate-900 mt-2">
                                        {history.queuedJobCount}
                                    </p>
                                </div>
                                <div className="rounded-md border bg-slate-50 p-3">
                                    <p className="font-medium text-slate-900">
                                        {t("ops.historyRetention", "Retention Limit")}
                                    </p>
                                    <p className="text-2xl font-bold text-slate-900 mt-2">
                                        {history.historyRetentionLimit ?? t("ops.notAvailable", "N/A")}
                                    </p>
                                </div>
                                <div className="rounded-md border bg-slate-50 p-3">
                                    <p className="font-medium text-slate-900">
                                        {t("ops.lastWrite", "Last Write")}
                                    </p>
                                    <p className="text-slate-600 mt-2">
                                        {formatTime(history.lastUpdatedAt, t("ops.notAvailable", "N/A"), locale)}
                                    </p>
                                </div>
                            </div>

                            <div className="rounded-md border bg-slate-50 p-3 text-sm text-slate-700">
                                <p>
                                    <span className="font-medium text-slate-900">
                                        {t("ops.storagePath", "Storage Path")}:
                                    </span>{" "}
                                    {history.storagePath ?? t("ops.notAvailable", "N/A")}
                                </p>
                                <p className="mt-2">{history.details}</p>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-red-700 dark:text-red-400">
                            {t("ops.readinessUnavailable", "Readiness data unavailable.")}
                        </p>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>{t("ops.recentJobs", "Recent Assessment Jobs")}</CardTitle>
                    <CardDescription>
                        {t(
                            "ops.recentJobsDesc",
                            "The latest assessment jobs for your account, refreshed every 3 seconds."
                        )}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {jobsQuery.isError ? (
                        <div className="space-y-3">
                            <p className="text-sm text-red-700 dark:text-red-400">
                                {jobsQuery.error?.message ?? t("ops.jobsLoadError", "Failed to load assessment jobs.")}
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => {
                                    void jobsQuery.refetch();
                                }}
                            >
                                {t("common.retry", "Retry")}
                            </Button>
                        </div>
                    ) : jobsQuery.isLoading ? (
                        <div className="flex items-center gap-2 text-slate-600">
                            <LoaderCircle className="h-4 w-4 animate-spin" />
                            <span>{t("ops.loadingJobs", "Loading jobs...")}</span>
                        </div>
                    ) : jobs.length === 0 ? (
                        <p className="text-sm text-slate-600">
                            {t("ops.noJobs", "No assessment jobs yet.")}
                        </p>
                    ) : (
                        <div className="overflow-x-auto rounded-md border">
                            <table className="min-w-full text-sm">
                                <thead className="bg-slate-50 text-left text-slate-700">
                                    <tr>
                                        <th className="px-3 py-2 font-medium">{t("ops.job", "Job")}</th>
                                        <th className="px-3 py-2 font-medium">{t("ops.status", "Status")}</th>
                                        <th className="px-3 py-2 font-medium">{t("ops.stage", "Stage")}</th>
                                        <th className="px-3 py-2 font-medium">{t("ops.source", "Source")}</th>
                                        <th className="px-3 py-2 font-medium">{t("ops.vendor", "Vendor")}</th>
                                        <th className="px-3 py-2 font-medium">{t("ops.updated", "Updated")}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {jobs.map(job => (
                                        <tr key={job.id} className="border-t">
                                            <td className="px-3 py-2 font-mono text-xs text-slate-700">{shortJobId(job.id)}</td>
                                            <td className="px-3 py-2">
                                                <Badge className={getStatusBadgeClass(job.status)}>{translateStatus(job.status)}</Badge>
                                            </td>
                                            <td className="px-3 py-2 text-slate-700">{translateStage(job.stage)}</td>
                                            <td className="px-3 py-2 text-slate-700">
                                                {job.result?.inputSummary.source ?? t("ops.notAvailable", "N/A")}
                                            </td>
                                            <td className="px-3 py-2 text-slate-700">
                                                {job.result?.inputSummary.vendorId ?? t("ops.notAvailable", "N/A")}
                                            </td>
                                            <td className="px-3 py-2 text-slate-700">{formatTime(job.updatedAt, t("ops.notAvailable", "N/A"), locale)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <AlertDialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("ops.clearConfirmTitle", "Clear persisted history?")}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t(
                                "ops.clearConfirm",
                                "Clear persisted history for your account? Active jobs will continue running."
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t("ops.cancel", "Cancel")}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleClearHistory}>
                            {clearHistoryMutation.isPending
                                ? t("ops.clearingHistory", "Clearing...")
                                : t("ops.confirmClear", "Clear History")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
