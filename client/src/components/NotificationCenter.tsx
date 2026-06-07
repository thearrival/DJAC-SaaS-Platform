/**
 * NotificationCenter — in-app alert bell for the DashboardLayout topbar.
 *
 * Data sources (all client-side, no new server routes needed):
 *  • trpc.deadlines.list  — upcoming (<30d) and overdue deadlines
 *  • trpc.ai.listAssessmentJobs — recent completed / failed jobs
 *  • trpc.system.readiness — degraded services
 *
 * Read state is persisted in localStorage.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, AlertTriangle, CheckCircle2, Clock, XCircle, ServerCrash, ChevronRight } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocale } from "@/contexts/useLocale";
import { formatDate } from "@/lib/intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { sounds } from "@/lib/sounds";

// ── Types ─────────────────────────────────────────────────────────────────────

type NotifCategory = "deadline" | "job" | "system";
type NotifUrgency = "critical" | "warning" | "info" | "success";

interface AppNotification {
    id: string;
    category: NotifCategory;
    urgency: NotifUrgency;
    title: string;
    body: string;
    timestamp: string;
    actionLabel?: string;
    actionHref?: string;
}

// ── localStorage helpers ───────────────────────────────────────────────────────

const STORAGE_KEY = "djac:notif:read:v1";

function getReadSet(): Set<string> {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
    } catch {
        return new Set();
    }
}

function saveReadSet(ids: Set<string>): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
    } catch {
        // Silently ignore storage errors
    }
}

// ── urgency → visual config ────────────────────────────────────────────────────

const URGENCY_CONFIG: Record<
    NotifUrgency,
    { icon: React.FC<{ className?: string }>; dot: string; label: string; rowBg: string }
> = {
    critical: {
        icon: XCircle,
        dot: "bg-red-500",
        label: "Critical",
        rowBg: "bg-red-500/5 dark:bg-red-500/10",
    },
    warning: {
        icon: AlertTriangle,
        dot: "bg-amber-400",
        label: "Warning",
        rowBg: "bg-amber-400/5 dark:bg-amber-400/10",
    },
    info: {
        icon: Clock,
        dot: "bg-sky-400",
        label: "Info",
        rowBg: "",
    },
    success: {
        icon: CheckCircle2,
        dot: "bg-emerald-500",
        label: "Done",
        rowBg: "bg-emerald-500/5 dark:bg-emerald-500/10",
    },
};

// ── Tiny URGENCY sort order ────────────────────────────────────────────────────

const URGENCY_ORDER: Record<NotifUrgency, number> = {
    critical: 0,
    warning: 1,
    info: 2,
    success: 3,
};

// ── Main component ─────────────────────────────────────────────────────────────

export function NotificationCenter() {
    const { t, locale } = useLocale();
    const [open, setOpen] = useState(false);
    const [readIds, setReadIds] = useState<Set<string>>(getReadSet);

    // ── Data queries ─────────────────────────────────────────────
    const upcomingQuery = trpc.deadlines.list.useQuery(
        { status: "upcoming", limit: 20 },
        { staleTime: 60_000, refetchInterval: 300_000 }
    );
    const overdueQuery = trpc.deadlines.list.useQuery(
        { status: "overdue", limit: 10 },
        { staleTime: 60_000, refetchInterval: 300_000 }
    );
    const jobsQuery = trpc.ai.listAssessmentJobs.useQuery(
        { limit: 10 },
        { staleTime: 30_000, refetchInterval: 60_000 }
    );
    const readinessQuery = trpc.system.readiness.useQuery(undefined, {
        staleTime: 10_000,
        refetchInterval: 30_000,
    });

    // ── Build notification list ───────────────────────────────────
    const notifications = useMemo<AppNotification[]>(() => {
        const notifs: AppNotification[] = [];
        const now = Date.now();

        // Overdue deadlines → critical
        for (const dl of overdueQuery.data ?? []) {
            notifs.push({
                id: `dl-overdue-${dl.id}`,
                category: "deadline",
                urgency: "critical",
                title: `${t("notif.deadlineOverdue", "Overdue")}: ${dl.title}`,
                body: dl.frameworkCode,
                timestamp: String(dl.deadlineDate),
                actionLabel: t("notif.viewCalendar", "View"),
                actionHref: "/compliance-calendar",
            });
        }

        // Upcoming deadlines
        for (const dl of upcomingQuery.data ?? []) {
            const daysLeft = Math.ceil(
                (new Date(dl.deadlineDate as unknown as string).getTime() - now) / 86_400_000
            );
            if (daysLeft > 30) continue;
            notifs.push({
                id: `dl-upcoming-${dl.id}-${String(dl.deadlineDate)}`,
                category: "deadline",
                urgency: daysLeft <= 7 ? "warning" : "info",
                title:
                    daysLeft <= 7
                        ? `${t("notif.deadlineSoon", "Due in")} ${daysLeft} ${t("notif.days", "day(s)")}${daysLeft > 0 ? ":" : ""} ${dl.title}`
                        : `${t("notif.deadlineMonth", "Due")} ${formatDate(dl.deadlineDate as unknown as string, locale)}: ${dl.title}`,
                body: dl.frameworkCode,
                timestamp: String(dl.deadlineDate),
                actionLabel: t("notif.viewCalendar", "View"),
                actionHref: "/compliance-calendar",
            });
        }

        // Completed / failed AI jobs (last 10, any time)
        for (const job of jobsQuery.data ?? []) {
            if (job.status === "completed") {
                notifs.push({
                    id: `job-done-${job.id}`,
                    category: "job",
                    urgency: "success",
                    title: t("notif.jobCompleted", "Assessment completed"),
                    body: `#${job.id.slice(0, 8)}`,
                    timestamp: job.updatedAt,
                    actionLabel: t("notif.viewVendors", "View"),
                    actionHref: "/vendor-risk",
                });
            } else if (job.status === "failed") {
                notifs.push({
                    id: `job-failed-${job.id}`,
                    category: "job",
                    urgency: "critical",
                    title: t("notif.jobFailed", "Assessment failed"),
                    body: `#${job.id.slice(0, 8)}`,
                    timestamp: job.updatedAt,
                    actionLabel: t("notif.viewOps", "Operations"),
                    actionHref: "/operations",
                });
            }
        }

        // System degraded services
        const services = readinessQuery.data?.services as
            | Record<string, { ready: boolean; details: string }>
            | undefined;
        if (services) {
            for (const [svc, info] of Object.entries(services)) {
                if (!info.ready) {
                    notifs.push({
                        id: `sys-${svc}`,
                        category: "system",
                        urgency: "warning",
                        title: `${t("notif.serviceDown", "Service degraded")}: ${svc}`,
                        body: info.details.slice(0, 80),
                        timestamp: readinessQuery.data?.timestamp ?? new Date().toISOString(),
                        actionLabel: t("notif.viewOps", "Operations"),
                        actionHref: "/operations",
                    });
                }
            }
        }

        return notifs.sort(
            (a, b) =>
                URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency] ||
                new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
    }, [
        overdueQuery.data,
        upcomingQuery.data,
        jobsQuery.data,
        readinessQuery.data,
        locale,
        t,
    ]);

    const unreadCount = notifications.filter(n => !readIds.has(n.id)).length;

    // Play a notification sound when new unread notifications arrive
    const prevUnreadRef = useRef(unreadCount);
    useEffect(() => {
        // Skip on first render (initial load) — only play on increases
        if (prevUnreadRef.current !== undefined && unreadCount > prevUnreadRef.current) {
            sounds.notification();
        }
        prevUnreadRef.current = unreadCount;
    }, [unreadCount]);

    // Auto-mark-read after 3s of the popover being open
    useEffect(() => {
        if (!open || notifications.length === 0) return;
        const timer = setTimeout(() => {
            const allIds = new Set(notifications.map(n => n.id));
            setReadIds(allIds);
            saveReadSet(allIds);
        }, 3000);
        return () => clearTimeout(timer);
    }, [open, notifications]);

    function markRead(id: string) {
        const next = new Set(readIds);
        next.add(id);
        setReadIds(next);
        saveReadSet(next);
    }

    // ── Category group labels ─────────────────────────────────────
    const grouped = useMemo(() => {
        const groups: Record<NotifCategory, AppNotification[]> = {
            deadline: [],
            job: [],
            system: [],
        };
        for (const n of notifications) groups[n.category].push(n);
        return groups;
    }, [notifications]);

    const CATEGORY_LABELS: Record<NotifCategory, string> = {
        deadline: t("notif.catDeadline", "Deadlines"),
        job: t("notif.catJobs", "Assessments"),
        system: t("notif.catSystem", "System"),
    };

    // ── Render ────────────────────────────────────────────────────
    return (
        <Popover open={open} onOpenChange={(val) => { if (val) sounds.open(); setOpen(val); }}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-8 w-8 shrink-0"
                    aria-label={t("notif.bellLabel", "Notifications")}
                >
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                        <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold leading-none text-white">
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>

            <PopoverContent
                align="end"
                sideOffset={8}
                className="w-[min(22rem,90vw)] p-0 shadow-xl"
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b px-4 py-2.5">
                    <span className="text-sm font-semibold text-foreground">
                        {t("notif.title", "Notifications")}
                    </span>
                    {notifications.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                            {notifications.length}
                        </Badge>
                    )}
                </div>

                {/* Body */}
                <div className="max-h-[min(26rem,70vh)] overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                            <Bell className="h-7 w-7 text-muted-foreground/30" />
                            <p className="text-sm text-muted-foreground">
                                {t("notif.empty", "All clear — no alerts")}
                            </p>
                        </div>
                    ) : (
                        (["deadline", "job", "system"] as NotifCategory[]).map(cat => {
                            const items = grouped[cat];
                            if (!items.length) return null;
                            return (
                                <div key={cat}>
                                    <p className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                                        {CATEGORY_LABELS[cat]}
                                    </p>
                                    {items.map(n => {
                                        const cfg = URGENCY_CONFIG[n.urgency];
                                        const Icon = cfg.icon;
                                        const isRead = readIds.has(n.id);
                                        return (
                                            <div
                                                key={n.id}
                                                className={cn(
                                                    "group flex cursor-default items-start gap-3 px-4 py-2.5 transition-colors hover:bg-muted/50",
                                                    cfg.rowBg,
                                                    isRead && "opacity-60"
                                                )}
                                                onClick={() => markRead(n.id)}
                                            >
                                                {/* Dot + icon */}
                                                <div className="relative mt-0.5 shrink-0">
                                                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                                                    {!isRead && (
                                                        <span
                                                            className={cn(
                                                                "absolute -right-1 -top-1 h-2 w-2 rounded-full",
                                                                cfg.dot
                                                            )}
                                                        />
                                                    )}
                                                </div>

                                                {/* Text */}
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-xs font-medium leading-snug text-foreground">
                                                        {n.title}
                                                    </p>
                                                    {n.body && (
                                                        <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                                                            {n.body}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Action link */}
                                                {n.actionHref && (
                                                    <a
                                                        href={n.actionHref}
                                                        className="ml-1 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                                                        onClick={e => e.stopPropagation()}
                                                        aria-label={n.actionLabel}
                                                    >
                                                        <ChevronRight className="h-3.5 w-3.5" />
                                                    </a>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                {notifications.length > 0 && (
                    <div className="border-t px-4 py-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-full text-xs text-muted-foreground"
                            onClick={() => {
                                const allIds = new Set(notifications.map(n => n.id));
                                setReadIds(allIds);
                                saveReadSet(allIds);
                            }}
                        >
                            {t("notif.markAllRead", "Mark all as read")}
                        </Button>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}
