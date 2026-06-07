import { useEffect, useMemo, useState } from "react";
import type React from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocalAuth } from "@/hooks/useLocalAuth";
import { useAiAssessmentJobs } from "@/hooks/useAiAssessmentJobs";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useLocale } from "@/contexts/useLocale";
import { useTheme } from "@/contexts/useTheme";
import { formatDateTime } from "@/lib/intl";
import { AIAssessmentJobProgress } from "@/components/AIAssessmentJobProgress";
import { ComplianceRegionMap } from "@/components/ComplianceRegionMap";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QueryErrorPanel } from "@/components/ui/query-error-panel";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast as sonnerToast } from "sonner";
import {
    BellRing,
    BriefcaseBusiness,
    ChartBar,
    CircleAlert,
    Cpu,
    FileSearch,
    Globe2,
    LayoutGrid,
    Network,
    RefreshCw,
    ShieldAlert,
    Users,
    UserPlus,
} from "lucide-react";

type ConsultationMutationStatus = "in_review" | "responded" | "closed";
type ConsultationPriority = "low" | "medium" | "high";
type UserRole = "user" | "admin";
type UserStatus = "active" | "invited" | "suspended";

type AccessDraftMap = Record<number, { role: UserRole; status: UserStatus }>;

const riskColors: Record<string, string> = {
    critical: "#dc2626",
    high: "#ea580c",
    medium: "#ca8a04",
    low: "#16a34a",
};

type FrameworkNode = {
    code: string;
    label: string;
    x: number;
    y: number;
    cluster: "china" | "saudi" | "cross-border";
};

type FrameworkEdge = {
    source: string;
    target: string;
    relationship: string;
};

const frameworkNodes: FrameworkNode[] = [
    { code: "PIPL", label: "PIPL", x: 120, y: 90, cluster: "china" },
    { code: "CSL", label: "CSL", x: 90, y: 200, cluster: "china" },
    { code: "DSL", label: "DSL", x: 170, y: 260, cluster: "china" },
    { code: "MLPS", label: "MLPS 2.0", x: 240, y: 170, cluster: "china" },
    { code: "PDPL", label: "PDPL", x: 420, y: 90, cluster: "saudi" },
    { code: "NCA-ECC", label: "NCA ECC", x: 460, y: 200, cluster: "saudi" },
    { code: "NCA-CCC", label: "NCA CCC", x: 380, y: 260, cluster: "saudi" },
];

function frameworkClusterColor(cluster: FrameworkNode["cluster"]) {
    if (cluster === "china") {
        return "#1d4ed8";
    }

    if (cluster === "saudi") {
        return "#0f766e";
    }

    return "#7c3aed";
}

function normalizeFrameworkCode(code: string | null | undefined) {
    return (code ?? "").toUpperCase().replace(/\s+/g, "-");
}

// formatDateTime is imported from @/lib/intl above

function statusBadgeVariant(status: string) {
    if (status === "critical" || status === "high" || status === "suspended") {
        return "destructive" as const;
    }

    if (status === "in_review" || status === "medium" || status === "invited") {
        return "secondary" as const;
    }

    return "outline" as const;
}

// ─── Local Users Panel ─────────────────────────────────────────────────────────
function LocalUsersPanel() {
    const { t, locale } = useLocale();
    const listQuery = trpc.localAuth.adminList.useQuery(undefined, { retry: false });
    const statusMut = trpc.localAuth.adminSetStatus.useMutation({
        onSuccess: () => listQuery.refetch(),
    });

    const rows = listQuery.data ?? [];

    const statusColor: Record<string, string> = {
        active: "bg-green-500/15 text-green-600 border-green-500/30",
        pending: "bg-yellow-500/15 text-yellow-600 border-yellow-500/30",
        suspended: "bg-red-500/15 text-red-600 border-red-500/30",
    };
    const typeColor: Record<string, string> = {
        visitor: "bg-sky-500/10 text-sky-500 border-sky-500/25",
        professional: "bg-purple-500/10 text-purple-500 border-purple-500/25",
        admin: "bg-orange-500/10 text-orange-500 border-orange-500/25",
    };

    if (listQuery.isError) {
        return (
            <Card>
                <CardContent className="py-8">
                    <QueryErrorPanel
                        message={listQuery.error?.message ?? t("admin.localUsersLoadError", "Failed to load local users.")}
                        onRetry={() => {
                            void listQuery.refetch();
                        }}
                        retryLabel={t("common.retry", "Retry")}
                        messageClassName="text-sm text-destructive"
                        buttonClassName="mt-2"
                    />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t("admin.localUsersTitle", "Local Registered Users")}</CardTitle>
                <CardDescription>
                    {t("admin.localUsersDesc", "Users who registered directly via email and password (Visitor or Professional accounts).")}
                </CardDescription>
            </CardHeader>
            <CardContent>
                {listQuery.isLoading ? (
                    <p role="status" aria-live="polite" className="text-sm text-muted-foreground">{t("admin.loading", "Loading...")}</p>
                ) : rows.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t("admin.localUsersEmpty", "No local registrations yet.")}</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border text-xs text-muted-foreground">
                                    <th className="pb-2 text-left font-medium">{t("admin.localUsersColNameEmail", "Name / Email")}</th>
                                    <th className="pb-2 text-left font-medium">{t("admin.localUsersColType", "Type")}</th>
                                    <th className="pb-2 text-left font-medium">{t("admin.localUsersColCompanyRole", "Company / Role")}</th>
                                    <th className="pb-2 text-left font-medium">{t("admin.localUsersColStatus", "Status")}</th>
                                    <th className="pb-2 text-left font-medium">{t("admin.localUsersColJoined", "Joined")}</th>
                                    <th className="pb-2 text-left font-medium">{t("admin.localUsersColActions", "Actions")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {rows.map(u => (
                                    <tr key={u.id} className="py-2">
                                        <td className="py-2 pr-4">
                                            <p className="font-medium">{u.name}</p>
                                            <p className="text-xs text-muted-foreground">{u.email}</p>
                                        </td>
                                        <td className="py-2 pr-4">
                                            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${typeColor[u.userType] ?? ""}`}>
                                                {u.userType}
                                            </span>
                                        </td>
                                        <td className="py-2 pr-4">
                                            <p className="text-xs">{u.companyName ?? "—"}</p>
                                            <p className="text-xs text-muted-foreground">{u.jobTitle ?? ""}</p>
                                        </td>
                                        <td className="py-2 pr-4">
                                            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${statusColor[u.status] ?? ""}`}>
                                                {u.status}
                                            </span>
                                        </td>
                                        <td className="py-2 pr-4 text-xs text-muted-foreground">
                                            {formatDateTime(u.createdAt, locale)}
                                        </td>
                                        <td className="py-2">
                                            <div className="flex gap-1">
                                                {u.status !== "active" && (
                                                    <Button size="sm" variant="outline"
                                                        disabled={statusMut.isPending}
                                                        onClick={() => statusMut.mutate({ userId: u.id, status: "active" })}>
                                                        {t("admin.actionActivate", "Activate")}
                                                    </Button>
                                                )}
                                                {u.status !== "suspended" && (
                                                    <Button size="sm" variant="destructive"
                                                        disabled={statusMut.isPending}
                                                        onClick={() => statusMut.mutate({ userId: u.id, status: "suspended" })}>
                                                        {t("admin.actionSuspend", "Suspend")}
                                                    </Button>
                                                )}
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
    );
}

function EmptyPanel({ title, message }: { title: string; message: string }) {
    return (
        <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">{title}</p>
            <p className="text-sm text-muted-foreground">{message}</p>
        </div>
    );
}

export default function AdminControlCenter() {
    usePageTitle("Admin Control Center");
    const { t } = useLocale();
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const { user } = useAuth();
    const { localUser } = useLocalAuth();
    const isAdmin = user?.role === "admin" || localUser?.userType === "admin";

    const matrixQuery = trpc.compliance.matrix.useQuery(undefined, { staleTime: 60_000 });

    // Derive graph edges from live compliance matrix (falls back to canonical edges pre-load)
    const frameworkEdges: FrameworkEdge[] = useMemo(() => {
        const matrix = matrixQuery.data ?? [];
        if (matrix.length === 0) {
            return [
                { source: "PIPL", target: "PDPL", relationship: "privacy" },
                { source: "CSL", target: "NCA-ECC", relationship: "cybersecurity" },
                { source: "DSL", target: "NCA-CCC", relationship: "data governance" },
                { source: "MLPS", target: "NCA-ECC", relationship: "control baseline" },
                { source: "PIPL", target: "DSL", relationship: "china alignment" },
                { source: "PDPL", target: "NCA-CCC", relationship: "saudi alignment" },
            ];
        }
        const knownCodes = new Set(frameworkNodes.map(n => n.code));
        const seen = new Map<string, string>();
        for (const row of matrix) {
            const src = normalizeFrameworkCode(row.source);
            const tgt = normalizeFrameworkCode(row.target);
            if (!knownCodes.has(src) || !knownCodes.has(tgt)) continue;
            const key = [src, tgt].sort().join("->");
            const rel = (row.relationships ?? []).join("/") || (row.maxSeverity ?? "related");
            if (!seen.has(key)) seen.set(key, rel);
        }
        return Array.from(seen.entries()).map(([key, rel]) => {
            const [s, t] = key.split("->");
            return { source: s, target: t, relationship: rel };
        });
    }, [matrixQuery.data]);

    const overviewQuery = trpc.admin.overview.useQuery(undefined, {
        refetchInterval: 10000,
    });
    const usersQuery = trpc.admin.users.useQuery({ limit: 120 }, { refetchInterval: 15000 });
    const accessRequestsQuery = trpc.admin.accessRequests.useQuery({ limit: 80 }, { refetchInterval: 15000 });
    const consultationsQuery = trpc.admin.consultations.useQuery({ limit: 80 }, { refetchInterval: 12000 });
    const notificationsQuery = trpc.admin.notifications.useQuery({ limit: 80 }, { refetchInterval: 8000 });
    const assessmentsQuery = trpc.admin.assessments.useQuery({ limit: 80 }, { refetchInterval: 15000 });
    const vendorsQuery = trpc.admin.vendors.useQuery({ limit: 100 }, { refetchInterval: 20000 });
    const activityQuery = trpc.admin.activity.useQuery({ limit: 100 }, { refetchInterval: 12000 });
    const conversionStatsQuery = trpc.admin.conversionStats.useQuery(undefined, { refetchInterval: 30000 });
    const [retentionDays, setRetentionDays] = useState(90);
    const [deleteUserId, setDeleteUserId] = useState("");
    const [deleteOrganizationId, setDeleteOrganizationId] = useState("");
    const privacyStatsQuery = trpc.admin.interactionPrivacyStats.useQuery(
        { retentionDays },
        { refetchInterval: 30000 }
    );

    const [responseDrafts, setResponseDrafts] = useState<Record<number, string>>({});
    const [consultationStatusDrafts, setConsultationStatusDrafts] = useState<
        Record<number, ConsultationMutationStatus>
    >({});
    const [consultationPriorityDrafts, setConsultationPriorityDrafts] = useState<
        Record<number, ConsultationPriority>
    >({});
    const [userAccessDrafts, setUserAccessDrafts] = useState<AccessDraftMap>({});
    const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

    const markNotificationMutation = trpc.admin.markNotificationRead.useMutation({
        onSuccess: async () => {
            await notificationsQuery.refetch();
            await overviewQuery.refetch();
        },
    });

    const respondConsultationMutation = trpc.admin.respondConsultation.useMutation({
        onSuccess: async () => {
            sonnerToast.success(t("admin.toastConsultationUpdated", "Consultation updated"));
            await consultationsQuery.refetch();
            await overviewQuery.refetch();
            setResponseDrafts({});
        },
    });

    const updateUserAccessMutation = trpc.admin.updateUserAccess.useMutation({
        onSuccess: async () => {
            sonnerToast.success(t("admin.toastUserUpdated", "User access updated"));
            await usersQuery.refetch();
            await overviewQuery.refetch();
        },
    });

    const updateAccessRequestStatusMutation = trpc.admin.updateAccessRequestStatus.useMutation({
        onSuccess: async () => {
            sonnerToast.success(t("admin.toastAccessRequestUpdated", "Access request updated"));
            await accessRequestsQuery.refetch();
            await overviewQuery.refetch();
        },
        onError: () => {
            sonnerToast.error(t("admin.toastAccessRequestUpdateError", "Failed to update access request."));
        },
    });

    const retentionMutation = trpc.admin.enforceInteractionRetention.useMutation({
        onSuccess: async result => {
            if (result.dryRun) {
                sonnerToast.success(
                    t(
                        "admin.retentionDryRunDone",
                        `Dry run complete. ${result.logsOlderThanRetention} logs would be deleted.`
                    )
                );
            } else {
                sonnerToast.success(
                    t(
                        "admin.retentionPurgeDone",
                        `Retention purge completed. ${result.deletedLogs} logs deleted.`
                    )
                );
            }

            await Promise.all([privacyStatsQuery.refetch(), overviewQuery.refetch()]);
        },
        onError: () => {
            sonnerToast.error(t("admin.retentionRunError", "Failed to run retention operation."));
        },
    });

    const deleteInteractionMutation = trpc.admin.deleteInteractionData.useMutation({
        onSuccess: async result => {
            sonnerToast.success(
                t("admin.interactionDeleteDone", `Deleted ${result.deletedLogs} interaction logs.`)
            );
            setDeleteUserId("");
            setDeleteOrganizationId("");
            await Promise.all([privacyStatsQuery.refetch(), overviewQuery.refetch()]);
        },
        onError: () => {
            sonnerToast.error(t("admin.interactionDeleteError", "Failed to delete interaction logs."));
        },
    });

    const { snapshots, connectionState } = useAiAssessmentJobs();

    const sortedSnapshots = useMemo(() => {
        return Object.values(snapshots)
            .sort((a, b) => {
                const left = new Date(a.updatedAt ?? a.createdAt ?? 0).getTime();
                const right = new Date(b.updatedAt ?? b.createdAt ?? 0).getTime();
                return right - left;
            })
            .slice(0, 10);
    }, [snapshots]);

    useEffect(() => {
        if (selectedJobId) {
            return;
        }

        if (sortedSnapshots.length > 0) {
            setSelectedJobId(sortedSnapshots[0].id);
        }
    }, [selectedJobId, sortedSnapshots]);

    const selectedSnapshot = selectedJobId ? snapshots[selectedJobId] : null;

    const totals = overviewQuery.data?.totals;

    const refreshAll = async () => {
        await Promise.all([
            overviewQuery.refetch(),
            usersQuery.refetch(),
            accessRequestsQuery.refetch(),
            consultationsQuery.refetch(),
            notificationsQuery.refetch(),
            assessmentsQuery.refetch(),
            vendorsQuery.refetch(),
            activityQuery.refetch(),
            privacyStatsQuery.refetch(),
        ]);
    };

    const handleDryRunRetention = async () => {
        await retentionMutation.mutateAsync({ retentionDays, dryRun: true });
    };

    const handleApplyRetention = async () => {
        await retentionMutation.mutateAsync({ retentionDays, dryRun: false });
    };

    const handleDeleteInteractionData = async () => {
        const userId = deleteUserId.trim().length > 0 ? Number(deleteUserId) : undefined;
        const organizationId = deleteOrganizationId.trim().length > 0 ? Number(deleteOrganizationId) : undefined;

        if (!userId && !organizationId) {
            sonnerToast.error(t("admin.interactionDeleteTargetRequired", "Provide a user ID or organization ID."));
            return;
        }

        if ((userId && Number.isNaN(userId)) || (organizationId && Number.isNaN(organizationId))) {
            sonnerToast.error(t("admin.interactionDeleteTargetInvalid", "Deletion target IDs must be valid numbers."));
            return;
        }

        await deleteInteractionMutation.mutateAsync({ userId, organizationId });
    };

    const handleRespondConsultation = async (consultationId: number) => {
        const response = (responseDrafts[consultationId] ?? "").trim();
        const status = consultationStatusDrafts[consultationId] ?? "responded";
        const priority = consultationPriorityDrafts[consultationId] ?? "medium";

        if (response.length < 10) {
            sonnerToast.error(t("admin.errorAdminResponseMinLength", "Admin response must be at least 10 characters."));
            return;
        }

        await respondConsultationMutation.mutateAsync({
            consultationId,
            status,
            priority,
            adminResponse: response,
        });
    };

    const handleUpdateUser = async (targetUserId: number, role: UserRole, status: UserStatus) => {
        await updateUserAccessMutation.mutateAsync({
            userId: targetUserId,
            role,
            status,
        });
    };

    const notificationHighlights = overviewQuery.data?.notificationHighlights ?? [];
    const recentAssessments = overviewQuery.data?.recentAssessments ?? [];
    const recentConsultations = overviewQuery.data?.recentConsultations ?? [];
    const activitySeries = overviewQuery.data?.activitySeries ?? [];
    const isPrivacyActionPending = retentionMutation.isPending || deleteInteractionMutation.isPending;
    const isAdminDataLoading =
        overviewQuery.isLoading ||
        usersQuery.isLoading ||
        accessRequestsQuery.isLoading ||
        consultationsQuery.isLoading ||
        notificationsQuery.isLoading ||
        assessmentsQuery.isLoading ||
        vendorsQuery.isLoading ||
        activityQuery.isLoading ||
        privacyStatsQuery.isLoading ||
        matrixQuery.isLoading;
    // Error aggregation for core dashboard queries
    const hasCoreLoadError = overviewQuery.isError || usersQuery.isError || accessRequestsQuery.isError || consultationsQuery.isError || notificationsQuery.isError || assessmentsQuery.isError || vendorsQuery.isError || activityQuery.isError || privacyStatsQuery.isError || matrixQuery.isError;
    const coreLoadErrorMsg = overviewQuery.error?.message || usersQuery.error?.message || accessRequestsQuery.error?.message || consultationsQuery.error?.message || notificationsQuery.error?.message || assessmentsQuery.error?.message || vendorsQuery.error?.message || activityQuery.error?.message || privacyStatsQuery.error?.message || matrixQuery.error?.message;
    const maxActivityValue = Math.max(...activitySeries.map(row => row.value), 1);
    const activityPointDenominator = Math.max(activitySeries.length - 1, 1);
    const activityPolylinePoints = activitySeries
        .map((row, index) => {
            const x = (index / activityPointDenominator) * 100;
            const y = 100 - (row.value / maxActivityValue) * 100;
            return `${x},${y}`;
        })
        .join(" ");

    const regionCoverage = overviewQuery.data?.regionCoverage ?? [];
    const usageHeatmap = overviewQuery.data?.usageHeatmap;
    const heatmapCellLookup = useMemo(() => {
        const map = new Map<string, number>();
        for (const cell of usageHeatmap?.cells ?? []) {
            map.set(`${cell.context}::${cell.action}`, cell.value);
        }
        return map;
    }, [usageHeatmap?.cells]);
    const maxMatrixPressure = Math.max(
        ...regionCoverage.map(row => row.assessments + row.criticalGaps * 2),
        1
    );

    const frameworkLoadByCode = useMemo(() => {
        const counts = new Map<string, number>();

        for (const row of assessmentsQuery.data ?? []) {
            const normalizedCode = normalizeFrameworkCode(row.frameworkCode);
            const canonicalCode =
                normalizedCode.includes("PIPL")
                    ? "PIPL"
                    : normalizedCode.includes("CSL")
                        ? "CSL"
                        : normalizedCode.includes("DSL")
                            ? "DSL"
                            : normalizedCode.includes("MLPS")
                                ? "MLPS"
                                : normalizedCode.includes("PDPL")
                                    ? "PDPL"
                                    : normalizedCode.includes("NCA") && normalizedCode.includes("ECC")
                                        ? "NCA-ECC"
                                        : normalizedCode.includes("NCA") && normalizedCode.includes("CCC")
                                            ? "NCA-CCC"
                                            : null;

            if (!canonicalCode) {
                continue;
            }

            counts.set(canonicalCode, (counts.get(canonicalCode) ?? 0) + 1);
        }

        return counts;
    }, [assessmentsQuery.data]);

    const maxFrameworkLoad = Math.max(...Array.from(frameworkLoadByCode.values()), 1);

    if (!user && !localUser) {
        return (
            <div className="mx-auto max-w-3xl">
                <Card>
                    <CardHeader>
                        <CardTitle>{t("admin.signInTitle", "Admin Control Center")}</CardTitle>
                        <CardDescription>{t("admin.signInDesc", "Sign in with an admin account to access platform operations.")}</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="mx-auto max-w-3xl">
                <Card className="border-destructive/40">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-destructive">
                            <CircleAlert className="h-5 w-5" /> {t("admin.accessRestrictedTitle", "Access Restricted")}
                        </CardTitle>
                        <CardDescription>
                            {t("admin.accessRestrictedDesc", "The administrative control center is available only to users with the admin role.")}
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    return (
        <div className="djac-page">
            {hasCoreLoadError && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-muted-foreground mb-6">
                    <div className="flex items-center justify-between gap-3">
                        <p>
                            {coreLoadErrorMsg || t("admin.coreLoadError", "Failed to load admin dashboard data.")}
                        </p>
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => {
                                overviewQuery.refetch();
                                usersQuery.refetch();
                                accessRequestsQuery.refetch();
                                consultationsQuery.refetch();
                                notificationsQuery.refetch();
                                assessmentsQuery.refetch();
                                vendorsQuery.refetch();
                                activityQuery.refetch();
                                privacyStatsQuery.refetch();
                                matrixQuery.refetch();
                            }}
                        >
                            {t("common.retry", "Retry")}
                        </Button>
                    </div>
                </div>
            )}
            <div className="sr-only" role="status" aria-live="polite">
                {isPrivacyActionPending
                    ? t("admin.privacyActionRunning", "Privacy operation in progress.")
                    : isAdminDataLoading
                        ? t("admin.loadingData", "Loading admin data.")
                        : ""}
            </div>
            <div className="rounded-2xl border border-border p-6 shadow-xl" style={{ background: isDark ? "linear-gradient(90deg, #0f172a, #1e293b, #0f172a)" : "linear-gradient(90deg, #1e3a5f, #1d4ed8, #1e3a5f)", color: "#fff" }}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-300">{t("admin.heroBadge", "Admin Control Center")}</p>
                        <h1 className="mt-2 text-3xl font-semibold">{t("admin.heroTitle", "Enterprise Governance Console")}</h1>
                        <p className="mt-2 max-w-2xl text-sm text-slate-200">
                            {t("admin.heroDesc", "Oversee client onboarding, consultation workflows, vendor risk posture, and real-time AI pipeline telemetry.")}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="rounded-full bg-white/20 px-3 py-1 text-white">
                            {t("admin.streamLabel", "AI Stream")}: {connectionState}
                        </Badge>
                        <Button
                            variant="secondary"
                            size="sm"
                            className="bg-white/20 text-white hover:bg-white/30"
                            onClick={refreshAll}
                            aria-busy={isAdminDataLoading}
                        >
                            <RefreshCw className="mr-1 h-3.5 w-3.5" /> {t("admin.refresh", "Refresh")}
                        </Button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
                <Card className="col-span-1">
                    <CardContent className="p-4">
                        <p className="text-xs text-muted-foreground">{t("admin.clients", "Clients")}</p>
                        <p className="text-2xl font-semibold">{totals?.registeredClients ?? 0}</p>
                    </CardContent>
                </Card>
                <Card className="col-span-1">
                    <CardContent className="p-4">
                        <p className="text-xs text-muted-foreground">{t("admin.admins", "Admins")}</p>
                        <p className="text-2xl font-semibold">{totals?.adminUsers ?? 0}</p>
                    </CardContent>
                </Card>
                <Card className="col-span-1">
                    <CardContent className="p-4">
                        <p className="text-xs text-muted-foreground">{t("admin.accessRequests", "Access Requests")}</p>
                        <p className="text-2xl font-semibold">{totals?.openAccessRequests ?? 0}</p>
                    </CardContent>
                </Card>
                <Card className="col-span-1">
                    <CardContent className="p-4">
                        <p className="text-xs text-muted-foreground">{t("admin.consultations", "Consultations")}</p>
                        <p className="text-2xl font-semibold">{totals?.openConsultations ?? 0}</p>
                    </CardContent>
                </Card>
                <Card className="col-span-1">
                    <CardContent className="p-4">
                        <p className="text-xs text-muted-foreground">{t("admin.vendors", "Vendors")}</p>
                        <p className="text-2xl font-semibold">{totals?.vendors ?? 0}</p>
                    </CardContent>
                </Card>
                <Card className="col-span-1">
                    <CardContent className="p-4">
                        <p className="text-xs text-muted-foreground">{t("admin.assessments", "Assessments")}</p>
                        <p className="text-2xl font-semibold">{totals?.assessments ?? 0}</p>
                    </CardContent>
                </Card>
                <Card className="col-span-1">
                    <CardContent className="p-4">
                        <p className="text-xs text-muted-foreground">{t("admin.criticalGaps", "Critical Gaps")}</p>
                        <p className="text-2xl font-semibold text-destructive">{totals?.criticalGaps ?? 0}</p>
                    </CardContent>
                </Card>
                <Card className="col-span-1">
                    <CardContent className="p-4">
                        <p className="text-xs text-muted-foreground">{t("admin.unreadAlerts", "Unread Alerts")}</p>
                        <p className="text-2xl font-semibold">{totals?.unreadNotifications ?? 0}</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <ShieldAlert className="h-5 w-5 text-rose-600" /> {t("admin.privacyTitle", "Interaction Privacy Controls")}
                    </CardTitle>
                    <CardDescription>
                        {t(
                            "admin.privacyDesc",
                            "Run GDPR-style retention and right-to-delete operations for interaction telemetry."
                        )}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div className="rounded-lg border border-border p-3">
                            <p className="text-xs text-muted-foreground">{t("admin.privacyTotalLogs", "Total Logs")}</p>
                            <p className="text-2xl font-semibold">{privacyStatsQuery.data?.totalLogs ?? 0}</p>
                        </div>
                        <div className="rounded-lg border border-border p-3">
                            <p className="text-xs text-muted-foreground">{t("admin.privacyOldLogs", "Older Than Retention")}</p>
                            <p className="text-2xl font-semibold text-amber-600">{privacyStatsQuery.data?.logsOlderThanRetention ?? 0}</p>
                        </div>
                        <div className="rounded-lg border border-border p-3">
                            <p className="text-xs text-muted-foreground">{t("admin.privacyCutoff", "Cutoff Date")}</p>
                            <p className="text-sm font-medium">{formatDateTime(privacyStatsQuery.data?.cutoffIso ?? null)}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        <div className="space-y-3 rounded-lg border border-border p-3">
                            <Label htmlFor="retentionDays">{t("admin.retentionDays", "Retention Days")}</Label>
                            <Input
                                id="retentionDays"
                                type="number"
                                min={7}
                                max={365}
                                value={retentionDays}
                                onChange={event => setRetentionDays(Math.max(7, Math.min(365, Number(event.target.value) || 90)))}
                            />
                            <p className="text-xs text-muted-foreground">
                                {t("admin.retentionHint", "Run Dry Run first to preview how many logs will be removed.")}
                            </p>
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    variant="outline"
                                    onClick={handleDryRunRetention}
                                    disabled={retentionMutation.isPending}
                                >
                                    {t("admin.runDryRun", "Run Dry Run")}
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={handleApplyRetention}
                                    disabled={retentionMutation.isPending}
                                >
                                    {t("admin.applyRetention", "Apply Retention")}
                                </Button>
                            </div>
                            {retentionMutation.isPending ? (
                                <p role="status" aria-live="polite" className="text-xs text-muted-foreground">
                                    {t("admin.privacyActionRunning", "Privacy operation in progress.")}
                                </p>
                            ) : null}
                        </div>

                        <div className="space-y-3 rounded-lg border border-border p-3">
                            <Label>{t("admin.rightToDelete", "Right to Delete")}</Label>
                            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                                <Input
                                    type="number"
                                    placeholder={t("admin.userIdPlaceholder", "User ID")}
                                    value={deleteUserId}
                                    onChange={event => setDeleteUserId(event.target.value)}
                                    onKeyDown={event => {
                                        if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
                                            event.preventDefault();
                                            void handleDeleteInteractionData();
                                        }
                                    }}
                                />
                                <Input
                                    type="number"
                                    placeholder={t("admin.organizationIdPlaceholder", "Organization ID")}
                                    value={deleteOrganizationId}
                                    onChange={event => setDeleteOrganizationId(event.target.value)}
                                    onKeyDown={event => {
                                        if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
                                            event.preventDefault();
                                            void handleDeleteInteractionData();
                                        }
                                    }}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {t("admin.deleteShortcutHint", "Provide a User ID or Organization ID, then press Ctrl+Enter to delete.")}
                            </p>
                            <Button
                                variant="destructive"
                                onClick={handleDeleteInteractionData}
                                disabled={deleteInteractionMutation.isPending}
                            >
                                {t("admin.deleteInteractionData", "Delete Interaction Data")}
                            </Button>
                            {deleteInteractionMutation.isPending ? (
                                <p role="status" aria-live="polite" className="text-xs text-muted-foreground">
                                    {t("admin.privacyActionRunning", "Privacy operation in progress.")}
                                </p>
                            ) : null}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.3fr_1fr]">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <ChartBar className="h-5 w-5 text-blue-600" /> {t("admin.metricsTitle", "Compliance Metrics")}
                        </CardTitle>
                        <CardDescription>{t("admin.metricsDesc", "Daily platform activity, risk distribution, and top recent assessments.")}</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        <div className="rounded-lg border border-border p-3">
                            <p className="mb-2 text-sm font-medium">{t("admin.activity7Day", "7-Day Activity")}</p>
                            {activitySeries.length === 0 ? (
                                <EmptyPanel
                                    title={t("admin.emptyPanelTitle", "Nothing to show yet")}
                                    message={t("admin.noActivityPoints", "No activity points yet.")}
                                />
                            ) : (
                                <div className="space-y-3">
                                    <div className="h-44 rounded-md bg-muted/40 p-2">
                                        <svg viewBox="0 0 100 100" className="h-full w-full">
                                            <polyline
                                                fill="none"
                                                stroke="#2563eb"
                                                strokeWidth="2"
                                                points={activityPolylinePoints}
                                            />
                                        </svg>
                                    </div>
                                    <div className="grid grid-cols-7 gap-1 text-[10px] text-muted-foreground">
                                        {activitySeries.map(point => (
                                            <span key={point.day} className="truncate text-center">{point.day}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="rounded-lg border border-border p-3">
                            <p className="mb-2 text-sm font-medium">{t("admin.riskDistribution", "Risk Distribution")}</p>
                            <div className="space-y-2">
                                {(overviewQuery.data?.riskDistribution ?? []).map(row => (
                                    <div key={row.label} className="space-y-1">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-medium">{row.label}</span>
                                            <span className="text-muted-foreground">{row.value}</span>
                                        </div>
                                        <div className="h-2 rounded-full bg-muted">
                                            <div
                                                className="h-2 rounded-full"
                                                style={{
                                                    width: `${Math.min(100, row.value * 10)}%`,
                                                    backgroundColor: riskColors[row.label] ?? "#2563eb",
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-lg border border-border p-3 lg:col-span-2">
                            <p className="mb-2 text-sm font-medium">{t("admin.recentAssessmentScores", "Recent Assessment Scores")}</p>
                            {recentAssessments.length === 0 ? (
                                <EmptyPanel
                                    title={t("admin.emptyPanelTitle", "Nothing to show yet")}
                                    message={t("admin.noAssessmentsRecorded", "No assessments recorded yet.")}
                                />
                            ) : (
                                <div className="space-y-2">
                                    {recentAssessments.map(row => (
                                        <div key={row.id} className="space-y-1">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="font-medium">{row.vendorName}</span>
                                                <span className="text-muted-foreground">{row.complianceScore ?? 0}%</span>
                                            </div>
                                            <div className="h-2 rounded-full bg-muted">
                                                <div
                                                    className="h-2 rounded-full"
                                                    style={{
                                                        width: `${Math.max(0, Math.min(100, row.complianceScore ?? 0))}%`,
                                                        backgroundColor: riskColors[row.riskLevel ?? "medium"] ?? "#2563eb",
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="rounded-lg border border-border p-3 lg:col-span-2">
                            <div className="mb-2 flex items-center justify-between gap-2">
                                <p className="text-sm font-medium">{t("admin.usageHeatmap", "Feature Usage Heatmap")}</p>
                                <Badge variant="outline">
                                    {t("admin.usageWindow", "Last 14 days")}
                                </Badge>
                            </div>

                            {!usageHeatmap || usageHeatmap.totalEvents === 0 ? (
                                <EmptyPanel
                                    title={t("admin.emptyPanelTitle", "Nothing to show yet")}
                                    message={t("admin.usageHeatmapEmpty", "No interaction telemetry captured yet.")}
                                />
                            ) : (
                                <div className="space-y-3">
                                    <div className="overflow-x-auto">
                                        <table className="w-full border-separate border-spacing-1 text-xs">
                                            <thead>
                                                <tr>
                                                    <th className="min-w-[140px] px-2 py-1 text-left font-medium text-muted-foreground">
                                                        {t("admin.usageContext", "Context")}
                                                    </th>
                                                    {usageHeatmap.actions.map(action => (
                                                        <th key={action} className="px-2 py-1 text-center font-medium text-muted-foreground">
                                                            {action}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {usageHeatmap.contexts.map(context => (
                                                    <tr key={context}>
                                                        <td className="rounded-md bg-muted/40 px-2 py-1 font-medium">
                                                            {context}
                                                        </td>
                                                        {usageHeatmap.actions.map(action => {
                                                            const value = heatmapCellLookup.get(`${context}::${action}`) ?? 0;
                                                            const ratio = usageHeatmap.maxCellValue > 0 ? value / usageHeatmap.maxCellValue : 0;
                                                            const alpha = 0.08 + ratio * 0.82;

                                                            return (
                                                                <td
                                                                    key={`${context}-${action}`}
                                                                    className="rounded-md px-2 py-1 text-center tabular-nums"
                                                                    style={{
                                                                        backgroundColor: `rgba(37,99,235,${alpha})`,
                                                                        color: ratio > 0.55 ? "var(--djac-text)" : "var(--djac-bg)",
                                                                    }}
                                                                >
                                                                    {value}
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    <p className="text-xs text-muted-foreground">
                                        {t("admin.usageTotalEvents", "Total events in window")}: {usageHeatmap.totalEvents}
                                    </p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <ComplianceRegionMap
                    regionCoverage={overviewQuery.data?.regionCoverage ?? []}
                    corridorFlows={overviewQuery.data?.corridorFlows ?? []}
                />
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <LayoutGrid className="h-5 w-5 text-indigo-600" /> {t("admin.matrixTitle", "Cross-Jurisdiction Comparison Matrix")}
                        </CardTitle>
                        <CardDescription>
                            {t("admin.matrixDesc", "Operational load matrix for China and Saudi corridors across vendor presence, assessments, and critical gaps.")}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {regionCoverage.length === 0 ? (
                            <p className="text-sm text-muted-foreground">{t("admin.matrixNoData", "No region coverage metrics available yet.")}</p>
                        ) : (
                            regionCoverage.map(row => {
                                const pressureIndex = row.assessments + row.criticalGaps * 2;
                                const pressureWidth = (pressureIndex / maxMatrixPressure) * 100;
                                return (
                                    <div key={row.region} className="rounded-lg border border-border p-3">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-sm font-semibold">{row.region}</p>
                                            <Badge variant="outline">{t("admin.matrixPressure", "Pressure")}: {pressureIndex}</Badge>
                                        </div>

                                        <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                                            <div className="rounded-md bg-muted/50 p-2 text-center">
                                                <p className="text-muted-foreground">{t("admin.vendors", "Vendors")}</p>
                                                <p className="text-sm font-semibold">{row.vendors}</p>
                                            </div>
                                            <div className="rounded-md bg-muted/50 p-2 text-center">
                                                <p className="text-muted-foreground">{t("admin.assessments", "Assessments")}</p>
                                                <p className="text-sm font-semibold">{row.assessments}</p>
                                            </div>
                                            <div className="rounded-md bg-muted/50 p-2 text-center">
                                                <p className="text-muted-foreground">{t("admin.criticalGaps", "Critical Gaps")}</p>
                                                <p className="text-sm font-semibold text-destructive">{row.criticalGaps}</p>
                                            </div>
                                        </div>

                                        <div className="mt-3">
                                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                <span>{t("admin.riskPressureIndex", "Risk Pressure Index")}</span>
                                                <span>{pressureIndex}</span>
                                            </div>
                                            <div className="mt-1 h-2 rounded-full bg-muted">
                                                <div
                                                    className="h-2 rounded-full bg-gradient-to-r from-amber-500 to-red-600"
                                                    style={{ width: `${Math.max(0, Math.min(100, pressureWidth))}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Network className="h-5 w-5 text-emerald-600" /> {t("admin.frameworkDiagramTitle", "Framework Relationship Diagram")}
                        </CardTitle>
                        <CardDescription>
                            {t("admin.frameworkDiagramDesc", "Canonical framework interdependencies with node size weighted by recent assessment volume.")}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="rounded-lg border border-border bg-white/90 p-3 dark:bg-slate-950/50">
                            <svg viewBox="0 0 560 340" className="h-[300px] w-full">
                                <defs>
                                    <marker id="frameworkArrow" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
                                        <path d="M0,0 L10,5 L0,10 Z" fill="#64748b" />
                                    </marker>
                                </defs>

                                {frameworkEdges.map(edge => {
                                    const source = frameworkNodes.find(node => node.code === edge.source);
                                    const target = frameworkNodes.find(node => node.code === edge.target);
                                    if (!source || !target) {
                                        return null;
                                    }

                                    const midpointX = (source.x + target.x) / 2;
                                    const midpointY = (source.y + target.y) / 2 - 16;

                                    return (
                                        <g key={`${edge.source}-${edge.target}`}>
                                            <path
                                                d={`M ${source.x} ${source.y} Q ${midpointX} ${midpointY} ${target.x} ${target.y}`}
                                                fill="none"
                                                stroke="#64748b"
                                                strokeOpacity="0.6"
                                                strokeWidth="1.5"
                                                markerEnd="url(#frameworkArrow)"
                                            />
                                            <text
                                                x={midpointX}
                                                y={midpointY - 4}
                                                textAnchor="middle"
                                                className="fill-slate-600 text-[9px]"
                                            >
                                                {edge.relationship}
                                            </text>
                                        </g>
                                    );
                                })}

                                {frameworkNodes.map(node => {
                                    const load = frameworkLoadByCode.get(node.code) ?? 0;
                                    const radius = 16 + (load / maxFrameworkLoad) * 12;

                                    return (
                                        <g key={node.code}>
                                            <circle
                                                cx={node.x}
                                                cy={node.y}
                                                r={radius}
                                                fill={frameworkClusterColor(node.cluster)}
                                                fillOpacity="0.82"
                                                stroke="var(--djac-bg)"
                                                strokeWidth="1.5"
                                            />
                                            <text
                                                x={node.x}
                                                y={node.y + 3}
                                                textAnchor="middle"
                                                className="fill-white text-[10px] font-semibold"
                                            >
                                                {node.label}
                                            </text>
                                            <text
                                                x={node.x}
                                                y={node.y + radius + 12}
                                                textAnchor="middle"
                                                className="fill-slate-700 text-[9px]"
                                            >
                                                {t("admin.loadLabel", "load")}: {load}
                                            </text>
                                        </g>
                                    );
                                })}
                            </svg>
                        </div>

                        <div className="flex flex-wrap gap-2 text-xs">
                            <Badge variant="outline">{t("admin.frameworkLegendChina", "Blue: China frameworks")}</Badge>
                            <Badge variant="outline">{t("admin.frameworkLegendSaudi", "Teal: Saudi frameworks")}</Badge>
                            <Badge variant="outline">{t("admin.frameworkLegendNode", "Node radius: assessment load")}</Badge>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Cpu className="h-5 w-5 text-emerald-600" /> {t("admin.aiFeedTitle", "Real-Time AI Pipeline Feed")}
                        </CardTitle>
                        <CardDescription>{t("admin.aiFeedDesc", "Observe running job stages and inspect detailed progress events.")}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {selectedSnapshot ? <AIAssessmentJobProgress snapshot={selectedSnapshot} /> : null}
                        <div className="max-h-[280px] space-y-2 overflow-auto rounded-lg border border-border p-3">
                            {sortedSnapshots.length === 0 ? (
                                <EmptyPanel
                                    title={t("admin.emptyPanelTitle", "Nothing to show yet")}
                                    message={t("admin.aiFeedNoSnapshots", "No active job snapshots received yet.")}
                                />
                            ) : (
                                sortedSnapshots.map(snapshot => (
                                    <button
                                        key={snapshot.id}
                                        onClick={() => setSelectedJobId(snapshot.id)}
                                        className={`w-full rounded-md border p-2 text-left transition ${selectedJobId === snapshot.id
                                            ? "border-primary bg-primary/5"
                                            : "border-border hover:bg-muted/40"
                                            }`}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-xs font-medium">{snapshot.id.slice(0, 8)} · {snapshot.stage}</p>
                                            <Badge variant={statusBadgeVariant(snapshot.status)}>{snapshot.status}</Badge>
                                        </div>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            {t("admin.updated", "Updated")}: {formatDateTime(snapshot.updatedAt ?? snapshot.createdAt)}
                                        </p>
                                    </button>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <BellRing className="h-5 w-5 text-amber-600" /> {t("admin.notificationsTitle", "Notification Highlights")}
                        </CardTitle>
                        <CardDescription>{t("admin.notificationsDesc", "Fast triage for unread events and operational updates.")}</CardDescription>
                    </CardHeader>
                    <CardContent className="max-h-[420px] space-y-2 overflow-auto">
                        {notificationHighlights.length === 0 ? (
                            <EmptyPanel
                                title={t("admin.emptyPanelTitle", "Nothing to show yet")}
                                message={t("admin.noNotifications", "No notifications available.")}
                            />
                        ) : (
                            notificationHighlights.map(notification => (
                                <div key={notification.id} className="rounded-lg border border-border p-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <p className="text-sm font-semibold">{notification.title}</p>
                                            <p className="text-xs text-muted-foreground">{notification.category} · {formatDateTime(notification.createdAt)}</p>
                                        </div>
                                        <Badge variant={notification.isRead ? "outline" : "default"}>
                                            {notification.isRead ? t("admin.read", "Read") : t("admin.unread", "Unread")}
                                        </Badge>
                                    </div>
                                    {notification.content ? <p className="mt-2 text-sm text-muted-foreground">{notification.content}</p> : null}
                                    {!notification.isRead ? (
                                        <Button
                                            className="mt-2"
                                            size="sm"
                                            variant="outline"
                                            onClick={() => markNotificationMutation.mutate({ notificationId: notification.id })}
                                        >
                                            {t("admin.markAsRead", "Mark as read")}
                                        </Button>
                                    ) : null}
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="consultations" className="space-y-3">
                <TabsList className="w-full justify-start overflow-x-auto">
                    <TabsTrigger value="consultations"><BriefcaseBusiness className="h-4 w-4" />{t("admin.tabConsultations", "Consultations")}</TabsTrigger>
                    <TabsTrigger value="users"><Users className="h-4 w-4" />{t("admin.tabUsers", "Users")}</TabsTrigger>
                    <TabsTrigger value="access"><FileSearch className="h-4 w-4" />{t("admin.tabAccess", "Access Requests")}</TabsTrigger>
                    <TabsTrigger value="assessments"><ShieldAlert className="h-4 w-4" />{t("admin.tabAssessments", "Assessments")}</TabsTrigger>
                    <TabsTrigger value="vendors"><Globe2 className="h-4 w-4" />{t("admin.tabVendors", "Vendors")}</TabsTrigger>
                    <TabsTrigger value="localusers"><UserPlus className="h-4 w-4" />{t("admin.tabLocalUsers", "Local Users")}</TabsTrigger>
                    <TabsTrigger value="conversion"><ChartBar className="h-4 w-4" />{t("admin.tabConversion", "Conversion Analytics")}</TabsTrigger>
                </TabsList>

                <TabsContent value="consultations">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t("admin.consultationQueueTitle", "Consultation Workflow Queue")}</CardTitle>
                            <CardDescription>{t("admin.consultationQueueDesc", "Respond to complex requests and update workflow status.")}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {consultationsQuery.isError ? (
                                <QueryErrorPanel
                                    message={consultationsQuery.error?.message ?? t("admin.consultationsLoadError", "Failed to load consultations.")}
                                    onRetry={() => {
                                        void consultationsQuery.refetch();
                                    }}
                                    retryLabel={t("common.retry", "Retry")}
                                    messageClassName="text-sm text-destructive"
                                    buttonClassName="mt-2"
                                />
                            ) : (consultationsQuery.data ?? []).length === 0 ? (
                                <EmptyPanel
                                    title={t("admin.emptyPanelTitle", "Nothing to show yet")}
                                    message={t("admin.noConsultations", "No consultation records.")}
                                />
                            ) : (
                                (consultationsQuery.data ?? []).map(item => {
                                    const statusValue = consultationStatusDrafts[item.id] ?? (item.status === "new" ? "in_review" : (item.status as ConsultationMutationStatus));
                                    const priorityValue = consultationPriorityDrafts[item.id] ?? (item.priority as ConsultationPriority);
                                    const responseValue = responseDrafts[item.id] ?? item.adminResponse ?? "";

                                    return (
                                        <div key={item.id} className="rounded-lg border border-border p-4">
                                            <div className="flex flex-wrap items-start justify-between gap-2">
                                                <div>
                                                    <p className="text-sm font-semibold">{item.topic}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {item.organizationName} · {item.contactName} · {formatDateTime(item.createdAt)}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant={statusBadgeVariant(item.status)}>{item.status}</Badge>
                                                    <Badge variant="outline">{item.priority}</Badge>
                                                </div>
                                            </div>

                                            <p className="mt-2 text-sm text-muted-foreground">{item.summary}</p>

                                            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                                                <div>
                                                    <Label>{t("admin.status", "Status")}</Label>
                                                    <Select
                                                        value={statusValue}
                                                        onValueChange={value =>
                                                            setConsultationStatusDrafts(prev => ({
                                                                ...prev,
                                                                [item.id]: value as ConsultationMutationStatus,
                                                            }))
                                                        }
                                                    >
                                                        <SelectTrigger className="mt-1 h-9 w-full">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="in_review">{t("admin.statusInReview", "In review")}</SelectItem>
                                                            <SelectItem value="responded">{t("admin.statusResponded", "Responded")}</SelectItem>
                                                            <SelectItem value="closed">{t("admin.statusClosed", "Closed")}</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div>
                                                    <Label>{t("admin.priority", "Priority")}</Label>
                                                    <Select
                                                        value={priorityValue}
                                                        onValueChange={value =>
                                                            setConsultationPriorityDrafts(prev => ({
                                                                ...prev,
                                                                [item.id]: value as ConsultationPriority,
                                                            }))
                                                        }
                                                    >
                                                        <SelectTrigger className="mt-1 h-9 w-full">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="low">{t("admin.priorityLow", "Low")}</SelectItem>
                                                            <SelectItem value="medium">{t("admin.priorityMedium", "Medium")}</SelectItem>
                                                            <SelectItem value="high">{t("admin.priorityHigh", "High")}</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div>
                                                    <Label>{t("admin.jurisdictions", "Jurisdictions")}</Label>
                                                    <div className="mt-2 flex flex-wrap gap-1">
                                                        {item.jurisdictions.map(region => (
                                                            <Badge key={region} variant="secondary">{region}</Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-3">
                                                <Label>{t("admin.adminResponse", "Admin Response")}</Label>
                                                <Textarea
                                                    rows={3}
                                                    className="mt-1"
                                                    value={responseValue}
                                                    onChange={event =>
                                                        setResponseDrafts(prev => ({
                                                            ...prev,
                                                            [item.id]: event.target.value,
                                                        }))
                                                    }
                                                    onKeyDown={event => {
                                                        if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
                                                            event.preventDefault();
                                                            void handleRespondConsultation(item.id);
                                                        }
                                                    }}
                                                    aria-describedby={`admin-response-hint-${item.id}`}
                                                />
                                                <p id={`admin-response-hint-${item.id}`} className="mt-1 text-xs text-muted-foreground">
                                                    {t("admin.consultationShortcutHint", "Press Ctrl+Enter to save this response.")}
                                                </p>
                                            </div>

                                            <Button
                                                className="mt-3"
                                                onClick={() => handleRespondConsultation(item.id)}
                                                disabled={respondConsultationMutation.isPending}
                                            >
                                                {t("admin.saveResponse", "Save Response")}
                                            </Button>
                                            {respondConsultationMutation.isPending ? (
                                                <p role="status" aria-live="polite" className="mt-2 text-xs text-muted-foreground">
                                                    {t("admin.responseSaving", "Saving response...")}
                                                </p>
                                            ) : null}
                                        </div>
                                    );
                                })
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="users">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t("admin.usersTitle", "User Access Governance")}</CardTitle>
                            <CardDescription>{t("admin.usersDesc", "Review role assignments and client lifecycle status.")}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {usersQuery.isError ? (
                                <QueryErrorPanel
                                    message={usersQuery.error?.message ?? t("admin.usersLoadError", "Failed to load users.")}
                                    onRetry={() => {
                                        void usersQuery.refetch();
                                    }}
                                    retryLabel={t("common.retry", "Retry")}
                                    messageClassName="text-sm text-destructive"
                                    buttonClassName="mt-2"
                                />
                            ) : (usersQuery.data ?? []).length === 0 ? (
                                <EmptyPanel
                                    title={t("admin.emptyPanelTitle", "Nothing to show yet")}
                                    message={t("admin.noUsers", "No users found.")}
                                />
                            ) : (
                                (usersQuery.data ?? []).map(account => {
                                    const accessDraft = userAccessDrafts[account.id] ?? {
                                        role: account.role as UserRole,
                                        status: account.status as UserStatus,
                                    };

                                    return (
                                        <div key={account.id} className="rounded-lg border border-border p-3">
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <div>
                                                    <p className="text-sm font-semibold">{account.name ?? t("admin.unknownUser", "Unknown User")}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {account.email} · {t("admin.lastActivity", "Last activity")} {formatDateTime(account.lastActivityAt)}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant={statusBadgeVariant(account.role)}>{account.role}</Badge>
                                                    <Badge variant={statusBadgeVariant(account.status)}>{account.status}</Badge>
                                                </div>
                                            </div>

                                            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                                                <div>
                                                    <Label>{t("admin.role", "Role")}</Label>
                                                    <Select
                                                        value={accessDraft.role}
                                                        onValueChange={value =>
                                                            setUserAccessDrafts(prev => ({
                                                                ...prev,
                                                                [account.id]: {
                                                                    ...accessDraft,
                                                                    role: value as UserRole,
                                                                },
                                                            }))
                                                        }
                                                    >
                                                        <SelectTrigger className="mt-1 h-9 w-full">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="user">{t("admin.roleUser", "User")}</SelectItem>
                                                            <SelectItem value="admin">{t("admin.roleAdmin", "Admin")}</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div>
                                                    <Label>{t("admin.status", "Status")}</Label>
                                                    <Select
                                                        value={accessDraft.status}
                                                        onValueChange={value =>
                                                            setUserAccessDrafts(prev => ({
                                                                ...prev,
                                                                [account.id]: {
                                                                    ...accessDraft,
                                                                    status: value as UserStatus,
                                                                },
                                                            }))
                                                        }
                                                    >
                                                        <SelectTrigger className="mt-1 h-9 w-full">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="active">{t("admin.statusActive", "Active")}</SelectItem>
                                                            <SelectItem value="invited">{t("admin.statusInvited", "Invited")}</SelectItem>
                                                            <SelectItem value="suspended">{t("admin.statusSuspended", "Suspended")}</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="flex items-end">
                                                    <Button
                                                        className="w-full"
                                                        onClick={() => handleUpdateUser(account.id, accessDraft.role, accessDraft.status)}
                                                        disabled={updateUserAccessMutation.isPending}
                                                    >
                                                        {t("admin.applyAccessUpdate", "Apply Access Update")}
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="access">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t("admin.accessQueueTitle", "Access Request Queue")}</CardTitle>
                            <CardDescription>{t("admin.accessQueueDesc", "Monitor inbound registrations from prospective clients.")}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {accessRequestsQuery.isError ? (
                                <QueryErrorPanel
                                    message={accessRequestsQuery.error?.message ?? t("admin.accessRequestsLoadError", "Failed to load access requests.")}
                                    onRetry={() => {
                                        void accessRequestsQuery.refetch();
                                    }}
                                    retryLabel={t("common.retry", "Retry")}
                                    messageClassName="text-sm text-destructive"
                                    buttonClassName="mt-2"
                                />
                            ) : (accessRequestsQuery.data ?? []).length === 0 ? (
                                <EmptyPanel
                                    title={t("admin.emptyPanelTitle", "Nothing to show yet")}
                                    message={t("admin.noAccessRequests", "No access requests found.")}
                                />
                            ) : (
                                (accessRequestsQuery.data ?? []).map(request => (
                                    <div key={request.id} className="rounded-lg border border-border p-3">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <div>
                                                <p className="text-sm font-semibold">{request.organizationName}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {request.fullName} · {request.email} · {formatDateTime(request.createdAt)}
                                                </p>
                                            </div>
                                            <Badge variant={statusBadgeVariant(request.status)}>{request.status}</Badge>
                                        </div>
                                        {request.useCase ? <p className="mt-2 text-sm text-muted-foreground">{request.useCase}</p> : null}
                                        {request.status !== "archived" && (
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {request.status === "new" && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        disabled={updateAccessRequestStatusMutation.isPending}
                                                        onClick={() => updateAccessRequestStatusMutation.mutate({ accessRequestId: request.id, status: "reviewing" })}
                                                    >
                                                        {t("admin.markReviewing", "Mark Reviewing")}
                                                    </Button>
                                                )}
                                                {(request.status === "new" || request.status === "reviewing") && (
                                                    <Button
                                                        size="sm"
                                                        variant="default"
                                                        disabled={updateAccessRequestStatusMutation.isPending}
                                                        onClick={() => updateAccessRequestStatusMutation.mutate({ accessRequestId: request.id, status: "approved" })}
                                                    >
                                                        {t("admin.approve", "Approve")}
                                                    </Button>
                                                )}
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    disabled={updateAccessRequestStatusMutation.isPending}
                                                    onClick={() => updateAccessRequestStatusMutation.mutate({ accessRequestId: request.id, status: "archived" })}
                                                >
                                                    {t("admin.archive", "Archive")}
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="assessments">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t("admin.assessmentRegistryTitle", "Assessment Registry")}</CardTitle>
                            <CardDescription>{t("admin.assessmentRegistryDesc", "Persisted cross-border compliance assessments and gap severity.")}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {assessmentsQuery.isError ? (
                                <QueryErrorPanel
                                    message={assessmentsQuery.error?.message ?? t("admin.assessmentsLoadError", "Failed to load assessments.")}
                                    onRetry={() => {
                                        void assessmentsQuery.refetch();
                                    }}
                                    retryLabel={t("common.retry", "Retry")}
                                    messageClassName="text-sm text-destructive"
                                    buttonClassName="mt-2"
                                />
                            ) : (assessmentsQuery.data ?? []).length === 0 ? (
                                <EmptyPanel
                                    title={t("admin.emptyPanelTitle", "Nothing to show yet")}
                                    message={t("admin.noPersistedAssessments", "No persisted assessments yet.")}
                                />
                            ) : (
                                (assessmentsQuery.data ?? []).map(assessment => (
                                    <div key={assessment.id} className="rounded-lg border border-border p-3">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <div>
                                                <p className="text-sm font-semibold">{assessment.vendorName}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {assessment.frameworkCode} · {assessment.frameworkName} · {formatDateTime(assessment.assessmentDate)}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant={statusBadgeVariant(assessment.riskLevel ?? "medium")}>{assessment.riskLevel ?? "-"}</Badge>
                                                <Badge variant="outline">{t("admin.criticalGapsShort", "Critical gaps")}: {assessment.criticalGapCount}</Badge>
                                                <Badge variant="secondary">{t("admin.score", "Score")}: {assessment.complianceScore ?? "-"}</Badge>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="vendors">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t("admin.vendorPortfolioTitle", "Vendor Portfolio Overview")}</CardTitle>
                            <CardDescription>{t("admin.vendorPortfolioDesc", "Organization ownership, region footprint, and technology profile depth.")}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {vendorsQuery.isError ? (
                                <QueryErrorPanel
                                    message={vendorsQuery.error?.message ?? t("admin.vendorsLoadError", "Failed to load vendors.")}
                                    onRetry={() => {
                                        void vendorsQuery.refetch();
                                    }}
                                    retryLabel={t("common.retry", "Retry")}
                                    messageClassName="text-sm text-destructive"
                                    buttonClassName="mt-2"
                                />
                            ) : (vendorsQuery.data ?? []).length === 0 ? (
                                <EmptyPanel
                                    title={t("admin.emptyPanelTitle", "Nothing to show yet")}
                                    message={t("admin.noVendors", "No vendors found.")}
                                />
                            ) : (
                                (vendorsQuery.data ?? []).map(vendor => (
                                    <div key={vendor.id} className="rounded-lg border border-border p-3">
                                        <div className="flex flex-wrap items-start justify-between gap-2">
                                            <div>
                                                <p className="text-sm font-semibold">{vendor.vendorName}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {t("admin.owner", "Owner")}: {vendor.ownerName} · {vendor.ownerOrganization}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant={statusBadgeVariant(vendor.riskTier)}>{vendor.riskTier}</Badge>
                                                <Badge variant="outline">{t("admin.techComponents", "Tech components")}: {vendor.techStackCount}</Badge>
                                            </div>
                                        </div>
                                        <div className="mt-2 flex flex-wrap gap-1">
                                            {vendor.operatingCountries.map(country => (
                                                <Badge key={`${vendor.id}-ops-${country}`} variant="secondary">{t("admin.opsPrefix", "Ops")}: {country}</Badge>
                                            ))}
                                            {vendor.dataLocations.map(country => (
                                                <Badge key={`${vendor.id}-data-${country}`} variant="outline">{t("admin.dataPrefix", "Data")}: {country}</Badge>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="localusers">
                    <LocalUsersPanel />
                </TabsContent>

                <TabsContent value="conversion">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t("admin.conversionTitle", "Conversion Analytics")}</CardTitle>
                            <CardDescription>{t("admin.conversionDesc", "Overview of trial-to-paid conversion across all organizations.")}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {conversionStatsQuery.isLoading ? (
                                <div className="py-8 text-center text-sm text-muted-foreground">{t("common.loading", "Loading...")}</div>
                            ) : conversionStatsQuery.error ? (
                                <div className="py-8 text-center text-sm">
                                    <p className="text-destructive">{conversionStatsQuery.error.message ?? t("common.errorLoading", "Failed to load data.")}</p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="mt-2"
                                        onClick={() => {
                                            void conversionStatsQuery.refetch();
                                        }}
                                    >
                                        {t("common.retry", "Retry")}
                                    </Button>
                                </div>
                            ) : (() => {
                                const stats = conversionStatsQuery.data;
                                if (!stats) return null;
                                return (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                                            <div className="rounded-lg border border-border p-4 text-center">
                                                <p className="text-2xl font-bold text-primary">{stats.trialOrgs}</p>
                                                <p className="mt-1 text-xs text-muted-foreground">{t("admin.conversionTrialOrgs", "Active Trials")}</p>
                                            </div>
                                            <div className="rounded-lg border border-border p-4 text-center">
                                                <p className="text-2xl font-bold text-destructive">{stats.expiredOrgs}</p>
                                                <p className="mt-1 text-xs text-muted-foreground">{t("admin.conversionExpiredOrgs", "Expired Trials")}</p>
                                            </div>
                                            <div className="rounded-lg border border-border p-4 text-center">
                                                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.paidOrgs}</p>
                                                <p className="mt-1 text-xs text-muted-foreground">{t("admin.conversionPaidOrgs", "Paid Subscribers")}</p>
                                            </div>
                                            <div className="rounded-lg border border-border p-4 text-center">
                                                <p className="text-2xl font-bold">{stats.conversionRate}%</p>
                                                <p className="mt-1 text-xs text-muted-foreground">{t("admin.conversionRate", "Conversion Rate")}</p>
                                            </div>
                                        </div>
                                        {stats.planBreakdown.length > 0 && (
                                            <div>
                                                <p className="mb-2 text-sm font-medium">{t("admin.conversionTitle", "Plan Breakdown")}</p>
                                                <div className="space-y-2">
                                                    {stats.planBreakdown.map(({ plan, count }) => (
                                                        <div key={plan} className="flex items-center justify-between rounded border border-border px-3 py-2 text-sm">
                                                            <span className="capitalize">{plan.replace(/_/g, " ")}</span>
                                                            <Badge variant="secondary">{count}</Badge>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>{t("admin.activityFeedTitle", "Recent Activity Feed")}</CardTitle>
                        <CardDescription>{t("admin.activityFeedDesc", "Audit-level interaction stream across admin, client, and system actors.")}</CardDescription>
                    </CardHeader>
                    <CardContent className="max-h-[320px] space-y-2 overflow-auto">
                        {activityQuery.isError ? (
                            <QueryErrorPanel
                                message={activityQuery.error?.message ?? t("admin.activityLoadError", "Failed to load activity feed.")}
                                onRetry={() => {
                                    void activityQuery.refetch();
                                }}
                                retryLabel={t("common.retry", "Retry")}
                                messageClassName="text-sm text-destructive"
                                buttonClassName="mt-2"
                            />
                        ) : (activityQuery.data ?? []).length === 0 ? (
                            <EmptyPanel
                                title={t("admin.emptyPanelTitle", "Nothing to show yet")}
                                message={t("admin.noActivityEvents", "No activity events available.")}
                            />
                        ) : (
                            (activityQuery.data ?? []).map(row => (
                                <div key={row.id} className="rounded-lg border border-border p-3">
                                    <div className="flex flex-wrap items-start justify-between gap-2">
                                        <div>
                                            <p className="text-sm font-medium">{row.actorName} · {row.action}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {row.actorType} · {row.entityType}{row.entityId ? ` #${row.entityId}` : ""}
                                            </p>
                                        </div>
                                        <span className="text-xs text-muted-foreground">{formatDateTime(row.createdAt)}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>{t("admin.consultationSnapshotTitle", "Recent Consultation Snapshot")}</CardTitle>
                        <CardDescription>{t("admin.consultationSnapshotDesc", "Latest client requests with assigned response ownership.")}</CardDescription>
                    </CardHeader>
                    <CardContent className="max-h-[320px] space-y-2 overflow-auto">
                        {recentConsultations.length === 0 ? (
                            <EmptyPanel
                                title={t("admin.emptyPanelTitle", "Nothing to show yet")}
                                message={t("admin.noConsultationActivity", "No consultation activity.")}
                            />
                        ) : (
                            recentConsultations.map(item => (
                                <div key={item.id} className="rounded-lg border border-border p-3">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <p className="text-sm font-medium">{item.topic}</p>
                                        <Badge variant={statusBadgeVariant(item.status)}>{item.status}</Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {item.organizationName} · {formatDateTime(item.updatedAt)}
                                    </p>
                                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{item.summary}</p>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
