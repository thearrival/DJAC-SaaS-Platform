/**
 * SuperAdminDashboard — Exclusive dashboard for Super Admin role.
 * Route: /superadmin/dashboard
 *
 * Tabs:
 *  1. Audit Trail    — full audit log with category/outcome filters
 *  2. SaaS Metrics   — conversion stats, plan breakdown
 *  3. Role Management — assign / revoke platform roles
 *  4. System Health  — environment flags + job queue at a glance
 */
import { useEffect, useMemo, useState } from "react";
import type React from "react";
import { trpc } from "@/lib/trpc";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useLocale } from "@/contexts/useLocale";
import { toast } from "sonner";
import { formatDate, formatDateTime } from "@/lib/intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Activity,
    ChevronDown,
    CheckCircle2,
    Download,
    Loader2,
    MinusCircle,
    RefreshCw,
    Search,
    Shield,
    TrendingUp,
    Users,
    XCircle,
} from "lucide-react";
import { RoleGuard } from "@/components/RoleGuard";

// ─── CSV helpers ──────────────────────────────────────────────────────────────

function rowsToCsv(rows: Record<string, unknown>[]): string {
    if (!rows.length) return "";
    const keys = Object.keys(rows[0]);
    const escape = (v: unknown) => {
        if (v === null || v === undefined) return "";
        const s = String(v).replace(/"/g, '""');
        return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s}"` : s;
    };
    return [keys.join(","), ...rows.map(r => keys.map(k => escape(r[k])).join(","))].join("\n");
}

function downloadCsv(filename: string, content: string) {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
}

// ── Category / outcome badges ────────────────────────────────────────────────
const CATEGORY_BADGE: Record<string, string> = {
    auth: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
    data_write: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
    data_read: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30",
    role_change: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
    system: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30",
    billing: "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30",
};

const ROLE_LABELS: Record<string, string> = {
    user: "User",
    admin: "Admin (legacy)",
    basic_user: "Basic",
    professional_user: "Professional",
    company_admin: "Company Admin",
    platform_admin: "Platform Admin",
    yalla_hack_employee: "Yalla Hack",
    super_admin: "Super Admin",
};

type AuditCategory = "auth" | "data_write" | "data_read" | "role_change" | "system" | "billing";
type AuditOutcome = "success" | "failure" | "blocked";

function OutcomeIcon({ outcome }: { outcome: string }) {
    if (outcome === "success") return <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />;
    if (outcome === "failure") return <XCircle className="h-3.5 w-3.5 text-destructive" />;
    return <MinusCircle className="h-3.5 w-3.5 text-muted-foreground" />;
}

// ── Tab: Audit Trail ─────────────────────────────────────────────────────────
function AuditTrailTab() {
    const { t, locale } = useLocale();
    const [category, setCategory] = useState<string>("all");
    const [outcome, setOutcome] = useState<string>("all");

    const auditQuery = trpc.role.auditLogs.useQuery(
        {
            limit: 200,
            offset: 0,
            category: category !== "all" ? (category as AuditCategory) : undefined,
            outcome: outcome !== "all" ? (outcome as AuditOutcome) : undefined,
        },
        { refetchInterval: 30_000 }
    );

    const logs = auditQuery.data ?? [];
    useEffect(() => {
        if (auditQuery.error) toast.error(t("superAdmin.auditLoadError", "Failed to load audit logs."));
    }, [auditQuery.error]);

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
                <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="h-8 w-40 text-xs">
                        <SelectValue placeholder={t("superAdmin.audit.category", "Category")} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t("superAdmin.audit.allCategories", "All categories")}</SelectItem>
                        {["auth", "data_write", "data_read", "role_change", "system", "billing"].map(c => (
                            <SelectItem key={c} value={c} className="text-xs capitalize">{c.replace("_", " ")}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={outcome} onValueChange={setOutcome}>
                    <SelectTrigger className="h-8 w-36 text-xs">
                        <SelectValue placeholder={t("superAdmin.audit.outcome", "Outcome")} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t("superAdmin.audit.allOutcomes", "All outcomes")}</SelectItem>
                        <SelectItem value="success">{t("superAdmin.audit.success", "Success")}</SelectItem>
                        <SelectItem value="failure">{t("superAdmin.audit.failure", "Failure")}</SelectItem>
                        <SelectItem value="blocked">{t("superAdmin.audit.blocked", "Blocked")}</SelectItem>
                    </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={() => auditQuery.refetch()}>
                    <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                    {t("superAdmin.refresh", "Refresh")}
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    disabled={logs.length === 0}
                    onClick={() => {
                        const rows = logs.map(l => ({
                            id: l.id,
                            timestamp: formatDateTime(l.createdAt, "en"),
                            category: l.category,
                            action: l.action,
                            target: l.targetEntity ?? l.entityType ?? "",
                            actorRole: l.actorRole ?? "",
                            outcome: l.outcome,
                        }));
                        downloadCsv(`audit-trail-${new Date().toISOString().slice(0, 10)}.csv`, rowsToCsv(rows as Record<string, unknown>[]));
                    }}
                >
                    <Download className="mr-1.5 h-3.5 w-3.5" />
                    {t("superAdmin.audit.exportCsv", "Export CSV")}
                </Button>
                <span className="text-xs text-muted-foreground">
                    {auditQuery.isFetching && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    {!auditQuery.isFetching && `${logs.length} events`}
                </span>
            </div>

            {/* Log table */}
            <div className="overflow-x-auto rounded-md border border-border">
                <table className="w-full text-xs">
                    <thead className="bg-muted/50 text-muted-foreground">
                        <tr>
                            <th className="px-3 py-2 text-left font-medium w-[140px]">{t("superAdmin.audit.colTimestamp", "Timestamp")}</th>
                            <th className="px-3 py-2 text-left font-medium">{t("superAdmin.audit.colCategory", "Category")}</th>
                            <th className="px-3 py-2 text-left font-medium">{t("superAdmin.audit.colAction", "Action")}</th>
                            <th className="px-3 py-2 text-left font-medium">{t("superAdmin.audit.colTarget", "Target")}</th>
                            <th className="px-3 py-2 text-left font-medium">{t("superAdmin.audit.colRole", "Actor Role")}</th>
                            <th className="px-3 py-2 text-center font-medium w-[70px]">{t("superAdmin.audit.colOutcome", "Outcome")}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {auditQuery.isError ? (
                            <tr>
                                <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">
                                    <p>{auditQuery.error?.message ?? t("superAdmin.auditLoadError", "Failed to load audit logs.")}</p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="mt-3 h-7 text-xs"
                                        onClick={() => {
                                            void auditQuery.refetch();
                                        }}
                                    >
                                        {t("common.retry", "Retry")}
                                    </Button>
                                </td>
                            </tr>
                        ) : auditQuery.isLoading ? (
                            <tr>
                                <td colSpan={6} className="px-3 py-6 text-center">
                                    <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                                </td>
                            </tr>
                        ) : logs.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">
                                    {t("superAdmin.audit.noEvents", "No audit events found.")}
                                </td>
                            </tr>
                        ) : (
                            logs.map(log => (
                                <tr key={log.id} className="hover:bg-muted/30">
                                    <td className="px-3 py-2 text-muted-foreground">
                                        {formatDateTime(log.createdAt, locale)}
                                    </td>
                                    <td className="px-3 py-2">
                                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${CATEGORY_BADGE[log.category] ?? ""}`}>
                                            {log.category.replace("_", " ")}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2 font-mono">{log.action}</td>
                                    <td className="px-3 py-2 text-muted-foreground max-w-[200px] truncate">
                                        {log.targetEntity ?? log.entityType ?? "—"}
                                    </td>
                                    <td className="px-3 py-2">
                                        <Badge variant="outline" className="text-[10px]">
                                            {ROLE_LABELS[log.actorRole ?? ""] ?? log.actorRole ?? "—"}
                                        </Badge>
                                    </td>
                                    <td className="px-3 py-2 text-center">
                                        <div className="flex justify-center">
                                            <OutcomeIcon outcome={log.outcome} />
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ── Tab: SaaS Metrics ────────────────────────────────────────────────────────
function SaaSMetricsTab() {
    const { t } = useLocale();
    const statsQuery = trpc.admin.conversionStats.useQuery(undefined, { refetchInterval: 60_000 });
    const stats = statsQuery.data;
    useEffect(() => {
        if (statsQuery.error) toast.error(t("superAdmin.metricsLoadError", "Failed to load SaaS metrics."));
    }, [statsQuery.error]);

    return (
        <div className="space-y-6">
            {statsQuery.isError ? (
                <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">{statsQuery.error?.message ?? t("superAdmin.metricsLoadError", "Failed to load SaaS metrics.")}</p>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => {
                            void statsQuery.refetch();
                        }}
                    >
                        {t("common.retry", "Retry")}
                    </Button>
                </div>
            ) : statsQuery.isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : !stats ? (
                <p className="text-sm text-muted-foreground">{t("superAdmin.metrics.noData", "No metrics available.")}</p>
            ) : (
                <>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardDescription>{t("superAdmin.metrics.totalOrgs", "Total Organisations")}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-bold">{stats.total}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardDescription className="text-blue-600 dark:text-blue-400">
                                    {t("superAdmin.metrics.activeTrials", "Active Trials")}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.trialOrgs}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardDescription className="text-green-600 dark:text-green-400">
                                    {t("superAdmin.metrics.paidOrgs", "Paid Subscribers")}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.paidOrgs}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardDescription>{t("admin.conversionRate", "Conversion Rate")}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-bold">{stats.conversionRate}%</p>
                            </CardContent>
                        </Card>
                    </div>

                    {stats.planBreakdown.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>{t("superAdmin.metrics.planBreakdown", "Plan Breakdown")}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {stats.planBreakdown.map(({ plan, count }) => {
                                        const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                                        return (
                                            <div key={plan}>
                                                <div className="flex items-center justify-between text-sm mb-1">
                                                    <span className="capitalize">{plan.replace(/_/g, " ")}</span>
                                                    <span className="text-muted-foreground text-xs">{count} ({pct}%)</span>
                                                </div>
                                                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full bg-primary transition-all"
                                                        style={{ width: `${pct}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </>
            )}
        </div>
    );
}

// ── Tab: Role Management ─────────────────────────────────────────────────────
function RoleManagementTab() {
    const { t, locale } = useLocale();
    const usersQuery = trpc.role.listUsersWithRoles.useQuery({ limit: 200, offset: 0 }, { refetchInterval: 60_000 });
    const assignRole = trpc.role.assignUserRole.useMutation({
        onSuccess: () => usersQuery.refetch(),
        onError: (err) => toast.error(t("superAdmin.roleAssignError", "Failed to assign role.") + " " + err.message),
    });

    const users = usersQuery.data ?? [];
    const [userSearch, setUserSearch] = useState("");

    const filteredUsers = useMemo(() => {
        const q = userSearch.trim().toLowerCase();
        if (!q) return users;
        return users.filter(u =>
            (u.name ?? "").toLowerCase().includes(q) ||
            (u.email ?? "").toLowerCase().includes(q)
        );
    }, [users, userSearch]);

    useEffect(() => {
        if (usersQuery.error) toast.error(t("superAdmin.usersLoadError", "Failed to load users."));
    }, [usersQuery.error]);

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
                <p className="flex-1 text-sm text-muted-foreground">
                    {t("superAdmin.roles.description", "Assign platform-level roles to users. Changes are logged in the audit trail.")}
                </p>
                <div className="relative">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={userSearch}
                        onChange={e => setUserSearch(e.target.value)}
                        placeholder={t("superAdmin.roles.searchPlaceholder", "Search users…")}
                        className="h-8 w-44 pl-8 text-xs"
                    />
                </div>
                <Button variant="outline" size="sm" onClick={() => usersQuery.refetch()}>
                    <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                    {t("superAdmin.refresh", "Refresh")}
                </Button>
            </div>

            <div className="overflow-x-auto rounded-md border border-border">
                <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                        <tr>
                            <th className="px-4 py-2 text-left font-medium">{t("companyDash.colName", "Name")}</th>
                            <th className="px-4 py-2 text-left font-medium">{t("companyDash.colEmail", "Email")}</th>
                            <th className="px-4 py-2 text-left font-medium">{t("superAdmin.roles.lastSeen", "Last Signed In")}</th>
                            <th className="px-4 py-2 text-left font-medium">{t("companyDash.colCurrentRole", "Current Role")}</th>
                            <th className="px-4 py-2 text-left font-medium">{t("companyDash.colAssignRole", "Assign Role")}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {usersQuery.isError ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-6 text-center text-sm text-muted-foreground">
                                    <p>{usersQuery.error?.message ?? t("superAdmin.usersLoadError", "Failed to load users.")}</p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="mt-3 h-7 text-xs"
                                        onClick={() => {
                                            void usersQuery.refetch();
                                        }}
                                    >
                                        {t("common.retry", "Retry")}
                                    </Button>
                                </td>
                            </tr>
                        ) : usersQuery.isLoading ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-6 text-center">
                                    <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                                </td>
                            </tr>
                        ) : filteredUsers.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-6 text-center text-sm text-muted-foreground">
                                    {userSearch
                                        ? t("superAdmin.roles.noMatch", "No users match your search.")
                                        : t("companyDash.noUsers", "No users found.")}
                                </td>
                            </tr>
                        ) : (
                            filteredUsers.map(u => (
                                <tr key={u.id} className="hover:bg-muted/30">
                                    <td className="px-4 py-2 font-medium">{u.name ?? "—"}</td>
                                    <td className="px-4 py-2 text-muted-foreground">{u.email ?? "—"}</td>
                                    <td className="px-4 py-2 text-xs text-muted-foreground">
                                        {formatDate(u.lastSignedIn, locale)}
                                    </td>
                                    <td className="px-4 py-2">
                                        <Badge variant="outline">{ROLE_LABELS[u.role] ?? u.role}</Badge>
                                    </td>
                                    <td className="px-4 py-2">
                                        <Select
                                            defaultValue={u.role}
                                            onValueChange={newRole =>
                                                assignRole.mutate({
                                                    targetUserId: u.id,
                                                    newRole: newRole as Parameters<typeof assignRole.mutate>[0]["newRole"],
                                                })
                                            }
                                        >
                                            <SelectTrigger className="h-7 w-44 text-xs">
                                                <SelectValue />
                                                <ChevronDown className="ml-auto h-3 w-3 opacity-50" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Object.entries(ROLE_LABELS).map(([v, l]) => (
                                                    <SelectItem key={v} value={v} className="text-xs">{l}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            {!usersQuery.isLoading && users.length > 0 && (
                <p className="text-xs text-muted-foreground text-right">
                    {userSearch
                        ? `${filteredUsers.length} / ${users.length} users match`
                        : `${users.length} user${users.length === 1 ? "" : "s"} total`}
                </p>
            )}
        </div>
    );
}

// ── Tab: System Health ───────────────────────────────────────────────────────
function SystemHealthTab() {
    const { t } = useLocale();
    const readinessQuery = trpc.system.readiness.useQuery(undefined, { refetchInterval: 30_000 });

    const services = readinessQuery.data?.services ?? {};
    const overall = readinessQuery.data?.ok;
    useEffect(() => {
        if (readinessQuery.error) toast.error(t("superAdmin.healthLoadError", "Failed to load system health."));
    }, [readinessQuery.error]);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <p className="text-sm font-medium">{t("superAdmin.health.overallStatus", "Overall Status:")}</p>
                <Badge variant={overall === true ? "default" : "destructive"} className="capitalize">
                    {overall === true ? "ok" : overall === false ? "degraded" : "unknown"}
                </Badge>
                <Button variant="outline" size="sm" onClick={() => readinessQuery.refetch()}>
                    <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                    {t("superAdmin.refresh", "Refresh")}
                </Button>
            </div>

            {readinessQuery.isError && (
                <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4">
                    <p className="text-sm text-muted-foreground">{readinessQuery.error?.message ?? t("superAdmin.healthLoadError", "Failed to load system health.")}</p>
                    <Button
                        variant="outline"
                        size="sm"
                        className="mt-3 h-7 text-xs"
                        onClick={() => {
                            void readinessQuery.refetch();
                        }}
                    >
                        {t("common.retry", "Retry")}
                    </Button>
                </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(services).map(([key, svc]) => {
                    const s = svc as { ready?: boolean; details?: string; enabled?: boolean };
                    const isOk = s.ready !== false;
                    return (
                        <div key={key} className="flex items-center justify-between rounded-lg border border-border p-4">
                            <div>
                                <p className="text-sm font-medium capitalize">{key.replace(/_/g, " ")}</p>
                                <p className="mt-0.5 text-xs text-muted-foreground">{s.details ?? (isOk ? "Operational" : "Degraded")}</p>
                            </div>
                            {isOk
                                ? <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
                                : <XCircle className="h-5 w-5 shrink-0 text-destructive" />
                            }
                        </div>
                    );
                })}
                {Object.keys(services).length === 0 && (
                    <div className="col-span-full rounded-lg border border-border p-6 text-center text-sm text-muted-foreground">
                        {readinessQuery.isLoading
                            ? <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                            : t("superAdmin.health.noChecks", "No health checks reported.")}
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Main page ────────────────────────────────────────────────────────────────
function SuperAdminDashboardContent() {
    const { t } = useLocale();

    return (
        <div className="djac-page">
            {/* Header */}
            <div>
                <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
                    <Shield className="h-6 w-6 text-destructive" />
                    {t("superAdmin.title", "Super Admin Dashboard")}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    {t("superAdmin.subtitle", "Full platform visibility: audit trails, SaaS metrics, role management, and system health.")}
                </p>
            </div>

            <Tabs defaultValue="audit">
                <TabsList className="overflow-x-auto">
                    <TabsTrigger value="audit" className="flex items-center gap-1.5">
                        <Activity className="h-3.5 w-3.5" />
                        {t("superAdmin.tabAudit", "Audit Trail")}
                    </TabsTrigger>
                    <TabsTrigger value="metrics" className="flex items-center gap-1.5">
                        <TrendingUp className="h-3.5 w-3.5" />
                        {t("superAdmin.tabMetrics", "SaaS Metrics")}
                    </TabsTrigger>
                    <TabsTrigger value="roles" className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" />
                        {t("superAdmin.tabRoles", "Role Management")}
                    </TabsTrigger>
                    <TabsTrigger value="health" className="flex items-center gap-1.5">
                        <Shield className="h-3.5 w-3.5" />
                        {t("superAdmin.tabHealth", "System Health")}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="audit" className="mt-6">
                    <AuditTrailTab />
                </TabsContent>
                <TabsContent value="metrics" className="mt-6">
                    <SaaSMetricsTab />
                </TabsContent>
                <TabsContent value="roles" className="mt-6">
                    <RoleManagementTab />
                </TabsContent>
                <TabsContent value="health" className="mt-6">
                    <SystemHealthTab />
                </TabsContent>
            </Tabs>
        </div>
    );
}

export default function SuperAdminDashboard() {
    usePageTitle("Super Admin");
    return (
        <RoleGuard required="super_admin" fallback="forbidden">
            <SuperAdminDashboardContent />
        </RoleGuard>
    );
}
