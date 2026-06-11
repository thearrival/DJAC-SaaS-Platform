import { useEffect, useMemo, useState } from "react";
import type React from "react";
import { trpc } from "@/lib/trpc";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useLocale } from "@/contexts/useLocale";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    Building2,
    Users,
    UserCheck,
    UserX,
    Mail,
    Briefcase,
    CalendarDays,
    Crown,
    Download,
    Search,
    ShieldCheck,
    ClipboardList,
    BarChart2,
    Loader2,
    RefreshCw,
    UserPlus,
    Trash2,
} from "lucide-react";

// ─── Role configuration ───────────────────────────────────────────────────────

type OrgRole = "owner" | "admin" | "compliance_officer" | "analyst";
type EditableRole = "admin" | "compliance_officer" | "analyst";

const ROLE_CONFIG: Record<OrgRole, {
    label: string;
    icon: React.ElementType;
    badgeClass: string;
    description: string;
}> = {
    owner: {
        label: "Owner",
        icon: Crown,
        badgeClass: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-700",
        description: "Full control including billing",
    },
    admin: {
        label: "Admin",
        icon: ShieldCheck,
        badgeClass: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-700",
        description: "Manage team and all features",
    },
    compliance_officer: {
        label: "Compliance Officer",
        icon: ClipboardList,
        badgeClass: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300 border-violet-200 dark:border-violet-700",
        description: "Read/write compliance tools",
    },
    analyst: {
        label: "Analyst",
        icon: BarChart2,
        badgeClass: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700",
        description: "Read-only + run assessments",
    },
};

const PLAN_LABELS: Record<string, string> = {
    free_trial: "Free Trial",
    starter: "Starter",
    professional: "Professional",
    enterprise: "Enterprise",
};

const PLAN_BADGE_CLASS: Record<string, string> = {
    free_trial: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    starter: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
    professional: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
    enterprise: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
    return name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map(w => w[0].toUpperCase())
        .join("");
}

const AVATAR_COLORS: Record<OrgRole, string> = {
    owner: "bg-gradient-to-br from-amber-400 to-orange-500",
    admin: "bg-gradient-to-br from-blue-500 to-indigo-600",
    compliance_officer: "bg-gradient-to-br from-violet-500 to-purple-600",
    analyst: "bg-gradient-to-br from-emerald-500 to-teal-600",
};

function formatDate(date: Date | string | null | undefined): string {
    if (!date) return "—";
    return new Date(date).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

// ── CSV helpers ──────────────────────────────────────────────────────────────

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

// ─── Member row type (inferred from tRPC) ────────────────────────────────────

type Member = {
    id: number;
    role: OrgRole;
    status: "active" | "invited" | "suspended";
    inviteEmail: string | null;
    joinedAt: Date | string;
    name: string;
    email: string;
    jobTitle: string | null;
    isCurrentUser: boolean;
};

// ─── MemberCard ───────────────────────────────────────────────────────────────

function MemberCard({
    member,
    canManage,
    onRoleChange,
    onRemove,
    roleChangePending,
    removePending,
}: {
    member: Member;
    canManage: boolean;
    onRoleChange: (memberId: number, newRole: EditableRole) => void;
    onRemove: (memberId: number, name: string) => void;
    roleChangePending: boolean;
    removePending: boolean;
}) {
    const { t } = useLocale();
    const roleCfg = ROLE_CONFIG[member.role] ?? ROLE_CONFIG.analyst;
    const RoleIcon = roleCfg.icon;
    const isOwner = member.role === "owner";
    const canEdit = canManage && !isOwner && !member.isCurrentUser;

    return (
        <div
            className={[
                "relative rounded-xl border p-5 transition-all duration-200",
                "bg-card hover:shadow-md hover:shadow-black/5 dark:hover:shadow-black/20",
                member.isCurrentUser
                    ? "ring-2 ring-primary/40 border-primary/30"
                    : "border-border",
            ].join(" ")}
        >
            {/* Current user highlight */}
            {member.isCurrentUser && (
                <span className="absolute top-3 right-3 text-xs font-medium text-primary bg-primary/10 border border-primary/20 rounded-full px-2 py-0.5">
                    {t("team.you", "You")}
                </span>
            )}

            <div className="flex items-start gap-4">
                {/* Avatar */}
                <div
                    className={[
                        "w-12 h-12 rounded-full flex items-center justify-center text-white",
                        "text-sm font-bold shrink-0 shadow-sm",
                        AVATAR_COLORS[member.role] ?? "bg-gradient-to-br from-slate-400 to-slate-600",
                    ].join(" ")}
                >
                    {getInitials(member.name)}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-foreground truncate">{member.name}</span>

                        {/* Status badge for invited members */}
                        {member.status === "invited" && (
                            <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800">
                                {t("team.statusInvited", "Invited")}
                            </Badge>
                        )}
                        {member.status === "suspended" && (
                            <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
                                {t("team.statusSuspended", "Suspended")}
                            </Badge>
                        )}
                    </div>

                    {/* Email */}
                    <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
                        <Mail size={12} className="shrink-0" />
                        <span className="truncate">{member.email}</span>
                    </div>

                    {/* Job title */}
                    {member.jobTitle && (
                        <div className="flex items-center gap-1.5 mt-0.5 text-sm text-muted-foreground">
                            <Briefcase size={12} className="shrink-0" />
                            <span className="truncate">{member.jobTitle}</span>
                        </div>
                    )}

                    {/* Role + join date row */}
                    <div className="flex items-center gap-3 mt-3 flex-wrap">
                        {/* Role badge or select */}
                        {canEdit ? (
                            <Select
                                defaultValue={member.role}
                                onValueChange={v => onRoleChange(member.id, v as EditableRole)}
                                disabled={roleChangePending}
                            >
                                <SelectTrigger className={[
                                    "h-7 text-xs gap-1.5 px-2.5 rounded-full border font-medium w-auto min-w-[140px]",
                                    roleCfg.badgeClass,
                                ].join(" ")}>
                                    <RoleIcon size={12} />
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin">
                                        <span className="flex items-center gap-2">
                                            <ShieldCheck size={13} />
                                            {t("team.roleAdmin", "Admin")}
                                        </span>
                                    </SelectItem>
                                    <SelectItem value="compliance_officer">
                                        <span className="flex items-center gap-2">
                                            <ClipboardList size={13} />
                                            {t("team.roleComplianceOfficer", "Compliance Officer")}
                                        </span>
                                    </SelectItem>
                                    <SelectItem value="analyst">
                                        <span className="flex items-center gap-2">
                                            <BarChart2 size={13} />
                                            {t("team.roleAnalyst", "Analyst")}
                                        </span>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        ) : (
                            <Badge
                                variant="outline"
                                className={["text-xs flex items-center gap-1 font-medium rounded-full px-2.5", roleCfg.badgeClass].join(" ")}
                            >
                                <RoleIcon size={11} />
                                {t(`team.role_${member.role}`, roleCfg.label)}
                            </Badge>
                        )}

                        {/* Join date */}
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <CalendarDays size={11} />
                            <span>{formatDate(member.joinedAt)}</span>
                        </div>
                    </div>
                </div>

                {/* Remove action */}
                {canEdit && (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                                disabled={removePending}
                            >
                                {removePending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>{t("team.removeTitle", "Remove Member")}</AlertDialogTitle>
                                <AlertDialogDescription>
                                    {t("team.removeDesc", `Are you sure you want to remove ${member.name} from the organization? They will lose access immediately.`)}
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>{t("common.cancel", "Cancel")}</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={() => onRemove(member.id, member.name)}
                                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                                >
                                    {t("team.removeConfirm", "Remove")}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TeamMembers() {
    const { t } = useLocale();
    usePageTitle("Team Members");

    const orgQuery = trpc.orgMembers.myOrg.useQuery(undefined, {
        refetchOnWindowFocus: false,
        retry: 1,
    });

    const listQuery = trpc.orgMembers.list.useQuery(undefined, {
        refetchOnWindowFocus: false,
        retry: 1,
    });

    useEffect(() => {
        if (orgQuery.error) toast.error(t("team.loadOrgError", "Failed to load organization."));
    }, [orgQuery.error]);

    useEffect(() => {
        if (listQuery.error) toast.error(t("team.loadMembersError", "Failed to load team members."));
    }, [listQuery.error]);

    const updateRoleMut = trpc.orgMembers.updateRole.useMutation({
        onSuccess: () => {
            toast.success(t("team.roleUpdated", "Member role updated successfully."));
            void listQuery.refetch();
        },
        onError: err => toast.error(err.message),
    });

    const removeMut = trpc.orgMembers.remove.useMutation({
        onSuccess: (_memberId) => {
            toast.success(t("team.memberRemoved", "Member removed from the organization."));
            void listQuery.refetch();
        },
        onError: err => toast.error(err.message),
    });

    const inviteMut = trpc.orgMembers.invite.useMutation({
        onSuccess: () => {
            toast.success(t("team.inviteSuccess", "Invitation sent! They'll receive an email with instructions."));
            setInviteOpen(false);
            setInviteEmail("");
            setInviteRole("analyst");
            void listQuery.refetch();
        },
        onError: err => toast.error(err.message),
    });

    // Track which member ID is being acted upon
    const [pendingRoleId, setPendingRoleId] = useState<number | null>(null);
    const [pendingRemoveId, setPendingRemoveId] = useState<number | null>(null);
    const [inviteOpen, setInviteOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState<EditableRole>("analyst");

    function handleRoleChange(memberId: number, newRole: EditableRole) {
        setPendingRoleId(memberId);
        updateRoleMut.mutate(
            { memberId, newRole },
            { onSettled: () => setPendingRoleId(null) },
        );
    }

    function handleRemove(memberId: number, _name: string) {
        setPendingRemoveId(memberId);
        removeMut.mutate(memberId, { onSettled: () => setPendingRemoveId(null) });
    }

    const org = orgQuery.data;
    const members = listQuery.data ?? [];
    const hasCoreLoadError = orgQuery.isError || listQuery.isError;
    const coreLoadErrorMessage = orgQuery.error?.message ?? listQuery.error?.message;
    const currentRole = org?.currentUserRole ?? null;
    const canManage = currentRole === "owner" || currentRole === "admin";

    const activeCount = members.filter(m => m.status === "active").length;
    const invitedCount = members.filter(m => m.status === "invited").length;
    const seatUsage = org ? Math.min(activeCount, org.maxSeats) : activeCount;
    const maxSeats = org?.maxSeats ?? 5;
    const seatPct = maxSeats > 0 ? Math.min(100, Math.round((seatUsage / maxSeats) * 100)) : 0;

    const [memberSearch, setMemberSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");

    const filteredMembers = useMemo(() => {
        let d = members;
        if (roleFilter !== "all") d = d.filter(m => m.role === roleFilter);
        if (statusFilter !== "all") d = d.filter(m => m.status === statusFilter);
        if (memberSearch.trim()) {
            const q = memberSearch.trim().toLowerCase();
            d = d.filter(m =>
                m.name.toLowerCase().includes(q) ||
                (m.email ?? "").toLowerCase().includes(q) ||
                (m.jobTitle ?? "").toLowerCase().includes(q)
            );
        }
        return d;
    }, [members, roleFilter, statusFilter, memberSearch]);

    const isLoading = orgQuery.isLoading || listQuery.isLoading;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="djac-page">

            {/* ── Page header ─────────────────────────────────────────── */}
            <div className="djac-page-header">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-primary/10 text-primary">
                            <Users size={22} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                {t("team.pageTitle", "Team Members")}
                            </h1>
                            {org && (
                                <p className="text-sm text-muted-foreground mt-0.5">
                                    {org.name}
                                    {org.industry ? ` · ${org.industry}` : ""}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                    {/* Plan badge */}
                    {org && (
                        <span className={[
                            "text-xs font-semibold px-3 py-1 rounded-full border",
                            PLAN_BADGE_CLASS[org.plan] ?? PLAN_BADGE_CLASS.free_trial,
                        ].join(" ")}>
                            {PLAN_LABELS[org.plan] ?? org.plan}
                        </span>
                    )}

                    {/* Invite button */}
                    {canManage && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => setInviteOpen(true)}
                            disabled={seatUsage >= maxSeats}
                            title={seatUsage >= maxSeats ? t("team.seatLimitReached", "Seat limit reached") : undefined}
                        >
                            <UserPlus size={15} />
                            {t("team.inviteMember", "Invite Member")}
                        </Button>
                    )}

                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9"
                        onClick={() => { void orgQuery.refetch(); void listQuery.refetch(); }}
                        title="Refresh"
                    >
                        <RefreshCw size={15} className={listQuery.isFetching ? "animate-spin" : ""} />
                    </Button>
                </div>
            </div>

            {hasCoreLoadError && (
                <Card className="border-destructive/40 bg-destructive/5">
                    <CardContent className="flex flex-col gap-3 py-4 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
                        <p className="text-sm text-muted-foreground">
                            {coreLoadErrorMessage ?? t("team.loadError", "Failed to load team data. Please try again.")}
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => {
                                void orgQuery.refetch();
                                void listQuery.refetch();
                            }}
                        >
                            {t("common.retry", "Retry")}
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* ── Invite Member dialog ─────────────────────────────────── */}
            <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{t("team.inviteDialogTitle", "Invite a Team Member")}</DialogTitle>
                        <DialogDescription>
                            {t("team.inviteDialogDesc", "Send an email invitation to join your organization.")}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label htmlFor="invite-email">{t("team.inviteEmailLabel", "Email Address")}</Label>
                            <Input
                                id="invite-email"
                                type="email"
                                placeholder={t("team.inviteEmailPlaceholder", "colleague@example.com")}
                                value={inviteEmail}
                                onChange={e => setInviteEmail(e.target.value)}
                                disabled={inviteMut.isPending}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>{t("team.inviteRoleLabel", "Role")}</Label>
                            <Select
                                value={inviteRole}
                                onValueChange={v => setInviteRole(v as EditableRole)}
                                disabled={inviteMut.isPending}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin">
                                        <span className="flex items-center gap-2">
                                            <ShieldCheck size={13} />
                                            {t("team.roleAdmin", "Admin")}
                                        </span>
                                    </SelectItem>
                                    <SelectItem value="compliance_officer">
                                        <span className="flex items-center gap-2">
                                            <ClipboardList size={13} />
                                            {t("team.roleComplianceOfficer", "Compliance Officer")}
                                        </span>
                                    </SelectItem>
                                    <SelectItem value="analyst">
                                        <span className="flex items-center gap-2">
                                            <BarChart2 size={13} />
                                            {t("team.roleAnalyst", "Analyst")}
                                        </span>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setInviteOpen(false)} disabled={inviteMut.isPending}>
                            {t("common.cancel", "Cancel")}
                        </Button>
                        <Button
                            onClick={() => {
                                if (!inviteEmail.trim()) return;
                                inviteMut.mutate({ email: inviteEmail.trim(), role: inviteRole });
                            }}
                            disabled={!inviteEmail.trim() || inviteMut.isPending}
                        >
                            {inviteMut.isPending ? (
                                <><Loader2 size={14} className="animate-spin mr-2" />{t("team.inviteSending", "Sending...")}</>
                            ) : (
                                t("team.inviteSend", "Send Invitation")
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Organisation & seat KPI cards ────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {/* Total seats */}
                <Card className="border-border bg-card">
                    <CardContent className="pt-5 pb-4 px-5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <Users size={16} className="text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">{members.length}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{t("team.kpiTotal", "Total Members")}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Active */}
                <Card className="border-border bg-card">
                    <CardContent className="pt-5 pb-4 px-5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-emerald-500/10">
                                <UserCheck size={16} className="text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">{activeCount}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{t("team.kpiActive", "Active")}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Invited */}
                <Card className="border-border bg-card">
                    <CardContent className="pt-5 pb-4 px-5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-yellow-500/10">
                                <Mail size={16} className="text-yellow-600 dark:text-yellow-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">{invitedCount}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{t("team.kpiInvited", "Invited")}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Seat usage */}
                <Card className="border-border bg-card">
                    <CardContent className="pt-5 pb-4 px-5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-500/10">
                                <Building2 size={16} className="text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex-1">
                                <p className="text-2xl font-bold text-foreground">{seatUsage}<span className="text-base text-muted-foreground font-normal">/{maxSeats}</span></p>
                                <p className="text-xs text-muted-foreground mt-0.5">{t("team.kpiSeats", "Seats Used")}</p>
                                <div className="mt-1.5 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                                    <div
                                        className={["h-full rounded-full transition-all", seatPct >= 100 ? "bg-destructive" : seatPct >= 80 ? "bg-amber-500" : "bg-primary"].join(" ")}
                                        style={{ width: `${seatPct}%` }}
                                    />
                                </div>
                                {seatUsage >= maxSeats && (
                                    <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-0.5">
                                        {t("team.seatLimitReached", "Seat limit reached")}
                                    </p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ── Current user role notice ─────────────────────────────── */}
            {currentRole && (
                <div className="flex items-center gap-2.5 text-sm text-muted-foreground rounded-lg border border-border bg-muted/40 px-4 py-3">
                    <span>{t("team.yourRoleLabel", "Your role in this organization:")}</span>
                    <Badge
                        variant="outline"
                        className={[
                            "text-xs flex items-center gap-1 font-medium rounded-full px-2.5",
                            ROLE_CONFIG[currentRole as OrgRole]?.badgeClass ?? "",
                        ].join(" ")}
                    >
                        {(() => {
                            const cfg = ROLE_CONFIG[currentRole as OrgRole];
                            if (!cfg) return currentRole;
                            const Icon = cfg.icon;
                            return (<><Icon size={11} />{cfg.label}</>);
                        })()}
                    </Badge>
                    {canManage && (
                        <span className="ml-auto text-xs text-primary font-medium">
                            {t("team.canManageHint", "You can manage team members.")}
                        </span>
                    )}
                </div>
            )}

            {/* ── Role legend ──────────────────────────────────────────── */}
            <Card className="border-border bg-card/60">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-foreground/80">
                        {t("team.roleLegendTitle", "Role Permissions")}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {(Object.entries(ROLE_CONFIG) as [OrgRole, typeof ROLE_CONFIG[OrgRole]][]).map(([key, cfg]) => {
                            const Icon = cfg.icon;
                            return (
                                <div key={key} className="flex items-start gap-2.5 p-3 rounded-lg bg-muted/50 border border-border/50">
                                    <div className={["p-1.5 rounded-md border", cfg.badgeClass].join(" ")}>
                                        <Icon size={13} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-foreground">{cfg.label}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{cfg.description}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* ── Member list ──────────────────────────────────────────── */}
            <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold text-foreground">
                        {t("team.memberListTitle", "Organization Members")}
                        <span className="ml-2 text-sm font-normal text-muted-foreground">({members.length})</span>
                    </h2>
                    <div className="ml-auto flex flex-wrap items-center gap-2">
                        {/* Search */}
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={memberSearch}
                                onChange={e => setMemberSearch(e.target.value)}
                                placeholder={t("team.searchPlaceholder", "Search members...")}
                                className="h-8 w-44 pl-8 text-xs"
                            />
                        </div>
                        {/* Role filter pills */}
                        <div className="flex items-center gap-1">
                            {(["all", "owner", "admin", "compliance_officer", "analyst"] as const).map(r => (
                                <button
                                    key={r}
                                    onClick={() => setRoleFilter(r)}
                                    className={[
                                        "h-7 rounded-full border px-2.5 text-xs font-medium transition-all",
                                        roleFilter === r
                                            ? "bg-primary text-primary-foreground border-primary"
                                            : "border-transparent text-muted-foreground hover:bg-muted",
                                    ].join(" ")}
                                >
                                    {r === "all" ? t("common.all", "All") : ROLE_CONFIG[r as OrgRole]?.label ?? r}
                                </button>
                            ))}
                        </div>
                        {/* Status filter pills */}
                        <div className="flex items-center gap-1">
                            {(["all", "active", "invited", "suspended"] as const).map(s => (
                                <button
                                    key={s}
                                    onClick={() => setStatusFilter(s)}
                                    className={[
                                        "h-7 rounded-full border px-2.5 text-xs font-medium capitalize transition-all",
                                        statusFilter === s
                                            ? "bg-primary text-primary-foreground border-primary"
                                            : "border-transparent text-muted-foreground hover:bg-muted",
                                    ].join(" ")}
                                >
                                    {s === "all" ? t("common.all", "All") : s}
                                </button>
                            ))}
                        </div>
                        {/* CSV export */}
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8"
                            disabled={filteredMembers.length === 0}
                            onClick={() => {
                                const rows = filteredMembers.map(m => ({
                                    name: m.name,
                                    email: m.email ?? "",
                                    role: m.role,
                                    status: m.status,
                                    jobTitle: m.jobTitle ?? "",
                                    joinedAt: formatDate(m.joinedAt),
                                }));
                                downloadCsv(
                                    `team-members-${new Date().toISOString().slice(0, 10)}.csv`,
                                    rowsToCsv(rows as Record<string, unknown>[])
                                );
                            }}
                        >
                            <Download size={13} className="mr-1.5" />
                            {t("team.exportCsv", "Export CSV")}
                        </Button>
                    </div>
                </div>

                {listQuery.isError ? (
                    <Card className="border-destructive/30 bg-destructive/5">
                        <CardContent className="flex items-center gap-3 py-6 text-destructive">
                            <UserX size={20} />
                            <p className="text-sm">{t("team.loadError", "Failed to load team members. Please try again.")}</p>
                        </CardContent>
                    </Card>
                ) : filteredMembers.length === 0 ? (
                    <Card className="border-dashed border-border">
                        <CardContent className="flex flex-col items-center justify-center py-10 text-center gap-3">
                            <p className="text-sm text-muted-foreground">
                                {memberSearch || roleFilter !== "all" || statusFilter !== "all"
                                    ? t("team.noFilterMatch", "No members match your filter.")
                                    : t("team.emptyTitle", "No members yet")}
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredMembers.map(member => (
                                <MemberCard
                                    key={member.id}
                                    member={member as Member}
                                    canManage={canManage}
                                    onRoleChange={handleRoleChange}
                                    onRemove={handleRemove}
                                    roleChangePending={pendingRoleId === member.id}
                                    removePending={pendingRemoveId === member.id}
                                />
                            ))}
                        </div>
                        <p className="text-xs text-muted-foreground text-right">
                            {(memberSearch || roleFilter !== "all" || statusFilter !== "all")
                                ? `${filteredMembers.length} / ${members.length} members`
                                : `${members.length} member${members.length === 1 ? "" : "s"} total`}
                        </p>
                    </>
                )}
            </div>

            {/* ── Org info footer ──────────────────────────────────────── */}
            {org && (
                <Card className="border-border bg-muted/30">
                    <CardContent className="py-4 px-5">
                        <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                                <Building2 size={13} />
                                <strong className="text-foreground/70">{t("team.orgSlug", "Slug")}:</strong>
                                <code className="text-xs font-mono bg-muted border border-border px-1.5 py-0.5 rounded">{org.slug}</code>
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Mail size={13} />
                                <strong className="text-foreground/70">{t("team.billingEmail", "Billing Email")}:</strong>
                                {org.billingEmail}
                            </span>
                            {org.primaryJurisdiction && (
                                <span className="flex items-center gap-1.5">
                                    <ClipboardList size={13} />
                                    <strong className="text-foreground/70">{t("team.jurisdiction", "Primary Jurisdiction")}:</strong>
                                    {org.primaryJurisdiction}
                                </span>
                            )}
                            {org.trialEndsAt && (
                                <span className="flex items-center gap-1.5">
                                    <CalendarDays size={13} />
                                    <strong className="text-foreground/70">{t("team.trialEnds", "Trial Ends")}:</strong>
                                    {formatDate(org.trialEndsAt)}
                                </span>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
