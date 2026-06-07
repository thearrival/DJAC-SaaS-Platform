/**
 * CompanyDashboard — Dedicated dashboard for Company Admin and above.
 * Route: /company/dashboard
 *
 * Shows an overview of the organisation's compliance posture, active vendors,
 * upcoming deadlines, and a lightweight member role-management panel.
 */
import { useEffect, useState, useMemo } from "react";
import type React from "react";
import { trpc } from "@/lib/trpc";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useLocale } from "@/contexts/useLocale";
import { useRbac } from "@/hooks/useRbac";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2, RefreshCw, ShieldCheck, Users, Layers, Calendar, ChevronDown, ExternalLink, ArrowRight, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";
import { RoleGuard } from "@/components/RoleGuard";

// ── Priority colour helpers ──────────────────────────────────────────────────
const priorityBadge: Record<string, string> = {
    critical: "bg-destructive/15 text-destructive border-destructive/30",
    high: "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30",
    medium: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/30",
    low: "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30",
};

const statusBadge: Record<string, string> = {
    upcoming: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
    overdue: "bg-destructive/15 text-destructive border-destructive/30",
    completed: "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30",
    waived: "bg-muted/50 text-muted-foreground border-border",
};

// ── Role labels ──────────────────────────────────────────────────────────────
const ROLE_LABELS: Record<string, string> = {
    user: "User",
    admin: "Admin",
    basic_user: "Basic",
    professional_user: "Professional",
    company_admin: "Company Admin",
    platform_admin: "Platform Admin",
    yalla_hack_employee: "Yalla Hack",
    super_admin: "Super Admin",
};

function CompanyDashboardContent() {
    const { t } = useLocale();
    const { isPlatformAdmin } = useRbac();
    const [roleFilter, setRoleFilter] = useState<string>("all");

    // ── Data queries ─────────────────────────────────────────────────────────
    const deadlineSummary = trpc.deadlines.summary.useQuery(undefined, { refetchInterval: 60_000 });
    const deadlines = trpc.deadlines.list.useQuery(
        { status: "upcoming", limit: 8 },
        { refetchInterval: 60_000 }
    );
    const vendorList = trpc.vendor.list.useQuery(undefined, { refetchInterval: 120_000 });
    const usersWithRoles = trpc.role.listUsersWithRoles.useQuery(
        { limit: 100 },
        { enabled: isPlatformAdmin }
    );
    const assignUserRole = trpc.role.assignUserRole.useMutation({
        onSuccess: () => usersWithRoles.refetch(),
        onError: (err) => toast.error(t("companyDash.roleAssignError", "Failed to assign role: ") + err.message),
    });

    useEffect(() => {
        if (deadlineSummary.error) toast.error(t("companyDash.deadlinesLoadError", "Failed to load deadlines."));
    }, [deadlineSummary.error]);
    useEffect(() => {
        if (vendorList.error) toast.error(t("companyDash.vendorsLoadError", "Failed to load vendors."));
    }, [vendorList.error]);
    useEffect(() => {
        if (usersWithRoles.error) toast.error(t("companyDash.usersLoadError", "Failed to load users."));
    }, [usersWithRoles.error]);

    const summary = deadlineSummary.data;
    const allUsers = usersWithRoles.data ?? [];
    const filteredUsers = roleFilter === "all"
        ? allUsers
        : allUsers.filter(u => u.role === roleFilter);

    const healthPct = useMemo(() => {
        const tot = summary?.total ?? 0;
        if (!tot) return { completed: 0, overdue: 0, upcoming: 0 };
        return {
            completed: Math.round(((summary?.completed ?? 0) / tot) * 100),
            overdue: Math.round(((summary?.overdue ?? 0) / tot) * 100),
            upcoming: Math.round(((summary?.upcoming ?? 0) / tot) * 100),
        };
    }, [summary]);

    function fmtDeadline(d: Date | string | null | undefined): string {
        if (!d) return "";
        const date = d instanceof Date ? d : new Date(d);
        const now = new Date();
        const days = Math.round((date.getTime() - now.getTime()) / 86_400_000);
        if (days < 0) return `${Math.abs(days)}d overdue`;
        if (days === 0) return "Today";
        if (days === 1) return "Tomorrow";
        if (days <= 7) return `in ${days}d`;
        if (days <= 30) return `in ${Math.round(days / 7)}w`;
        return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    }

    const isLoading = deadlineSummary.isLoading || deadlines.isLoading || vendorList.isLoading;
    const hasCoreLoadError = deadlineSummary.isError || deadlines.isError || vendorList.isError;

    if (isLoading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="djac-page">
            {/* Page header */}
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        {t("companyDash.title", "Company Dashboard")}
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {t("companyDash.subtitle", "Organisation compliance posture, vendors, and team roles")}
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                        deadlineSummary.refetch();
                        deadlines.refetch();
                        vendorList.refetch();
                        if (isPlatformAdmin) usersWithRoles.refetch();
                    }}
                >
                    <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                    {t("companyDash.refresh", "Refresh")}
                </Button>
            </div>

            {hasCoreLoadError && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-muted-foreground">
                    <div className="flex items-center justify-between gap-3">
                        <p>
                            {deadlineSummary.error?.message
                                ?? deadlines.error?.message
                                ?? vendorList.error?.message
                                ?? t("companyDash.loadError", "Failed to load dashboard data.")}
                        </p>
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => {
                                deadlineSummary.refetch();
                                deadlines.refetch();
                                vendorList.refetch();
                            }}
                        >
                            {t("common.retry", "Retry")}
                        </Button>
                    </div>
                </div>
            )}

            {/* ── KPI stat cards ──────────────────────────────────────────── */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-1.5">
                            <Layers className="h-4 w-4" />
                            {t("companyDash.totalDeadlines", "Total Deadlines")}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">{summary?.total ?? "—"}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400">
                            <Calendar className="h-4 w-4" />
                            {t("companyDash.overdue", "Overdue")}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-destructive">{summary?.overdue ?? "—"}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                            <ShieldCheck className="h-4 w-4" />
                            {t("companyDash.completed", "Completed")}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-green-600 dark:text-green-400">{summary?.completed ?? "—"}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-1.5">
                            <Users className="h-4 w-4" />
                            {t("companyDash.vendors", "Saved Vendors")}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">{vendorList.data?.length ?? "—"}</p>
                    </CardContent>
                </Card>
            </div>

            {/* ── Main two-column layout ───────────────────────────────────── */}
            <div className="grid gap-6 xl:grid-cols-2">
                {/* Upcoming deadlines */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {t("companyDash.upcomingDeadlines", "Upcoming Deadlines")}
                            <Link href="/compliance-calendar" className="ml-auto text-xs font-normal text-primary flex items-center gap-0.5 hover:opacity-75 transition-opacity">
                                {t("companyDash.viewAll", "View all")} <ArrowRight size={12} />
                            </Link>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {deadlines.isError ? (
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">{t("companyDash.deadlinesLoadError", "Failed to load deadlines.")}</p>
                                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { void deadlines.refetch(); }}>
                                    {t("common.retry", "Retry")}
                                </Button>
                            </div>
                        ) : (deadlines.data ?? []).length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                {t("companyDash.noDeadlines", "No upcoming deadlines.")}
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {(deadlines.data ?? []).map(d => (
                                    <div key={d.id} className="flex flex-wrap items-start justify-between gap-2 rounded-md border border-border p-3">
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium">{d.title}</p>
                                            <p className="mt-0.5 text-xs text-muted-foreground">
                                                {d.frameworkCode} · {d.jurisdiction}
                                                {d.deadlineDate && (
                                                    <span className={`ml-2 font-medium ${d.status === "overdue" ? "text-destructive" :
                                                        d.status === "completed" ? "text-green-600 dark:text-green-400" : "text-blue-600 dark:text-blue-400"
                                                        }`}>
                                                        · {fmtDeadline(d.deadlineDate)}
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                        <div className="flex shrink-0 flex-wrap gap-1.5">
                                            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${priorityBadge[d.priority ?? "low"] ?? ""}`}>
                                                {d.priority}
                                            </span>
                                            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${statusBadge[d.status ?? "upcoming"] ?? ""}`}>
                                                {d.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Vendor list */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4" />
                            {t("companyDash.vendorsList", "Registered Vendors")}
                            <Link href="/vendor-assessment" className="ml-auto text-xs font-normal text-primary flex items-center gap-0.5 hover:opacity-75 transition-opacity">
                                {t("companyDash.viewAll", "View all")} <ArrowRight size={12} />
                            </Link>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {vendorList.isError ? (
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">{t("companyDash.vendorsLoadError", "Failed to load vendors.")}</p>
                                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { void vendorList.refetch(); }}>
                                    {t("common.retry", "Retry")}
                                </Button>
                            </div>
                        ) : (vendorList.data ?? []).length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                {t("companyDash.noVendors", "No vendors registered yet.")}
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {(vendorList.data ?? []).slice(0, 8).map(v => (
                                    <div key={v.id} className="flex items-center justify-between gap-2 rounded-md border border-border p-3">
                                        <div className="min-w-0">
                                            <Link href={`/vendor/${v.id}`} className="truncate text-sm font-medium hover:underline flex items-center gap-1">
                                                {v.vendorName}
                                                <ExternalLink size={11} className="shrink-0 text-muted-foreground" />
                                            </Link>
                                            <p className="mt-0.5 text-xs text-muted-foreground">{v.industry ?? "—"}</p>
                                        </div>
                                        {v.riskTier && (
                                            <Badge variant="outline" className="shrink-0 text-xs">
                                                {v.riskTier.replace(/-/g, " ")}
                                            </Badge>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* ── User role management (Platform Admin and above) ─────────── */}
            {isPlatformAdmin && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            {t("companyDash.roleManagement", "User Role Management")}
                        </CardTitle>
                        <CardDescription>
                            {t("companyDash.roleManagementDesc", "Assign or change platform roles for registered users.")}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-4 flex items-center gap-3">
                            <label className="text-sm font-medium">{t("companyDash.filterByRole", "Filter:")}</label>
                            <Select value={roleFilter} onValueChange={setRoleFilter}>
                                <SelectTrigger className="w-48">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t("companyDash.allRoles", "All roles")}</SelectItem>
                                    {Object.entries(ROLE_LABELS).map(([v, l]) => (
                                        <SelectItem key={v} value={v}>{l}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {usersWithRoles.isLoading ? (
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        ) : usersWithRoles.isError ? (
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">{t("companyDash.usersLoadError", "Failed to load users.")}</p>
                                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { void usersWithRoles.refetch(); }}>
                                    {t("common.retry", "Retry")}
                                </Button>
                            </div>
                        ) : filteredUsers.length === 0 ? (
                            <p className="text-sm text-muted-foreground">{t("companyDash.noUsers", "No users found.")}</p>
                        ) : (
                            <div className="overflow-x-auto rounded-md border border-border">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                                        <tr>
                                            <th className="px-4 py-2 text-left font-medium">{t("companyDash.colName", "Name")}</th>
                                            <th className="px-4 py-2 text-left font-medium">{t("companyDash.colEmail", "Email")}</th>
                                            <th className="px-4 py-2 text-left font-medium">{t("companyDash.colCurrentRole", "Current Role")}</th>
                                            <th className="px-4 py-2 text-left font-medium">{t("companyDash.colAssignRole", "Assign Role")}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {filteredUsers.map(u => (
                                            <tr key={u.id} className="hover:bg-muted/30">
                                                <td className="px-4 py-2 font-medium">{u.name ?? "—"}</td>
                                                <td className="px-4 py-2 text-muted-foreground">{u.email ?? "—"}</td>
                                                <td className="px-4 py-2">
                                                    <Badge variant="outline">{ROLE_LABELS[u.role] ?? u.role}</Badge>
                                                </td>
                                                <td className="px-4 py-2">
                                                    <Select
                                                        defaultValue={u.role}
                                                        onValueChange={newRole =>
                                                            assignUserRole.mutate({
                                                                targetUserId: u.id,
                                                                newRole: newRole as Parameters<typeof assignUserRole.mutate>[0]["newRole"],
                                                            })
                                                        }
                                                    >
                                                        <SelectTrigger className="h-7 w-40 text-xs">
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
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

export default function CompanyDashboard() {
    usePageTitle("Company Dashboard");
    return (
        <RoleGuard required="company_admin" fallback="forbidden">
            <CompanyDashboardContent />
        </RoleGuard>
    );
}
