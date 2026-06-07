import { useEffect, useState, type MouseEvent } from "react";
import type React from "react";
import { toast } from "sonner";
import { Link } from "wouter";
import {
    AlertTriangle,
    Bell,
    CalendarCheck2,
    CheckCheck,
    ChevronRight,
    Clock,
    ShieldAlert,
    Zap,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocale } from "@/contexts/useLocale";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Button } from "@/components/ui/button";

// ─── Types ────────────────────────────────────────────────────────────────────

type NotificationType = "trial" | "deadline" | "assessment" | "system";
type NotificationSeverity = "critical" | "high" | "medium" | "low" | "info";

interface Notification {
    id: string;
    type: NotificationType;
    severity: NotificationSeverity;
    title: string;
    body: string;
    linkTo?: string;
    linkLabel?: string;
    timestamp: Date;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const READ_KEY = "djac_notif_read_ids";

function getReadIds(): Set<string> {
    try {
        const parsed: unknown = JSON.parse(localStorage.getItem(READ_KEY) ?? "[]");
        if (Array.isArray(parsed) && parsed.every(x => typeof x === "string")) {
            return new Set(parsed as string[]);
        }
        return new Set();
    } catch {
        return new Set();
    }
}

function saveReadIds(ids: Set<string>) {
    localStorage.setItem(READ_KEY, JSON.stringify([...ids]));
}

const SEVERITY_COLOR: Record<NotificationSeverity, string> = {
    critical: "var(--djac-red)",
    high: "var(--djac-orange)",
    medium: "var(--djac-yellow)",
    low: "var(--djac-green)",
    info: "var(--muted-foreground)",
};

const SEVERITY_BG: Record<NotificationSeverity, string> = {
    critical: "rgba(255, 23, 68, 0.08)",
    high: "rgba(255, 107, 43, 0.07)",
    medium: "rgba(255, 214, 0, 0.07)",
    low: "rgba(1, 255, 127, 0.06)",
    info: "rgba(255,255,255,0.03)",
};

const SEVERITY_BORDER: Record<NotificationSeverity, string> = {
    critical: "rgba(255, 23, 68, 0.25)",
    high: "rgba(255, 107, 43, 0.22)",
    medium: "rgba(255, 214, 0, 0.20)",
    low: "rgba(1, 255, 127, 0.18)",
    info: "rgba(255,255,255,0.08)",
};

function TypeIcon({ type, severity }: { type: NotificationType; severity: NotificationSeverity }) {
    const color = SEVERITY_COLOR[severity];
    const cls = "h-5 w-5 shrink-0";
    if (type === "trial") return <Clock className={cls} style={{ color }} aria-hidden="true" />;
    if (type === "deadline") return <CalendarCheck2 className={cls} style={{ color }} aria-hidden="true" />;
    if (type === "assessment") return <ShieldAlert className={cls} style={{ color }} aria-hidden="true" />;
    return <Zap className={cls} style={{ color }} aria-hidden="true" />;
}

function priorityToSeverity(p: string): NotificationSeverity {
    if (p === "critical") return "critical";
    if (p === "high") return "high";
    if (p === "medium") return "medium";
    return "low";
}

function daysUntil(d: Date | string | null | undefined): number {
    if (!d) return 9999;
    const diff = new Date(d).getTime() - Date.now();
    return Math.ceil(diff / 86_400_000);
}

function timeAgo(d: Date): string {
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function Notifications() {
    usePageTitle("Notifications");
    const { t } = useLocale();
    const [readIds, setReadIds] = useState<Set<string>>(getReadIds);

    // Queries
    const billingQuery = trpc.billing.getSubscriptionStatus.useQuery(undefined, {
        retry: false,
        refetchOnWindowFocus: false,
    });
    const deadlinesQuery = trpc.deadlines.list.useQuery(
        { status: "upcoming", limit: 50 },
        { retry: false, refetchOnWindowFocus: false },
    );

    const hasLoadError = billingQuery.isError || deadlinesQuery.isError;
    const isLoading = billingQuery.isLoading || deadlinesQuery.isLoading;

    useEffect(() => {
        if (billingQuery.error) toast.error(t("notifications.billingLoadError", "Failed to load subscription status."));
    }, [billingQuery.error]);

    useEffect(() => {
        if (deadlinesQuery.error) toast.error(t("notifications.deadlinesLoadError", "Failed to load deadline notifications."));
    }, [deadlinesQuery.error]);

    // Build notification objects
    const notifications: Notification[] = [];

    // — Trial notifications
    const billing = billingQuery.data;
    if (billing?.plan === "free_trial") {
        const days = billing.trialDaysRemaining ?? 0;
        if (days <= 0) {
            notifications.push({
                id: "trial-expired",
                type: "trial",
                severity: "critical",
                title: t("trial.bannerExpired", "Your free trial has expired."),
                body: t("trial.bannerUpgrade", "Upgrade now to retain full access."),
                linkTo: "/pricing",
                linkLabel: t("trial.bannerCta", "Upgrade Now"),
                timestamp: new Date(billing.trialEndsAt ?? Date.now()),
            });
        } else if (days <= 3) {
            notifications.push({
                id: "trial-urgent",
                type: "trial",
                severity: "high",
                title: days === 1
                    ? t("trial.bannerOneDay", "1 day remaining in your free trial.")
                    : t("trial.bannerDaysLeft", "{days} days remaining in your free trial.").replace("{days}", String(days)),
                body: t("trial.bannerUpgrade", "Upgrade now to retain full access."),
                linkTo: "/pricing",
                linkLabel: t("trial.bannerCta", "Upgrade Now"),
                timestamp: new Date(),
            });
        } else if (days <= 7) {
            notifications.push({
                id: "trial-reminder",
                type: "trial",
                severity: "medium",
                title: t("trial.bannerDaysLeft", "{days} days remaining in your free trial.").replace("{days}", String(days)),
                body: t("trial.bannerUpgrade", "Upgrade now to retain full access."),
                linkTo: "/pricing",
                linkLabel: t("trial.bannerCta", "Upgrade Now"),
                timestamp: new Date(),
            });
        }
    }

    // — Deadline notifications (next 30 days)
    const deadlines = (deadlinesQuery.data ?? []) as Array<{
        id: number;
        title: string;
        frameworkCode: string | null;
        deadlineDate: string | Date | null;
        priority: string;
        status: string;
    }>;
    deadlines.forEach((dl) => {
        const days = daysUntil(dl.deadlineDate);
        if (days > 30) return;
        const severity = priorityToSeverity(dl.priority);
        notifications.push({
            id: `deadline-${dl.id}`,
            type: "deadline",
            severity,
            title: `${dl.frameworkCode ? `[${dl.frameworkCode}] ` : ""}${dl.title}`,
            body: days <= 0
                ? "This deadline is overdue."
                : days === 1
                    ? "Due tomorrow."
                    : `Due in ${days} days.`,
            linkTo: "/compliance-calendar",
            linkLabel: "View Calendar",
            timestamp: dl.deadlineDate ? new Date(dl.deadlineDate) : new Date(),
        });
    });

    // Sort: unread first, then by severity, then by date
    const severityOrder: Record<NotificationSeverity, number> = {
        critical: 4, high: 3, medium: 2, low: 1, info: 0,
    };
    notifications.sort((a, b) => {
        const aRead = readIds.has(a.id) ? 1 : 0;
        const bRead = readIds.has(b.id) ? 1 : 0;
        if (aRead !== bRead) return aRead - bRead;
        return (severityOrder[b.severity] ?? 0) - (severityOrder[a.severity] ?? 0);
    });

    const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length;

    function markRead(id: string) {
        setReadIds((prev) => {
            const next = new Set(prev);
            next.add(id);
            saveReadIds(next);
            return next;
        });
    }

    function markAllRead() {
        const all = new Set(notifications.map((n) => n.id));
        saveReadIds(all);
        setReadIds(all);
    }

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <div className="djac-page">

            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Bell className="h-5 w-5 text-primary" aria-hidden="true" />
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            {t("notifications.title", "Notifications")}
                        </h1>
                        {unreadCount > 0 && (
                            <span
                                className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold text-white"
                                style={{ background: "var(--djac-red)" }}
                            >
                                {unreadCount}
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                        {t(
                            "notifications.subtitle",
                            "In-app alerts for trial status, compliance deadlines, and vendor assessment results",
                        )}
                    </p>
                </div>
                {unreadCount > 0 && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={markAllRead}
                        className="flex items-center gap-1.5 shrink-0"
                    >
                        <CheckCheck className="h-4 w-4" />
                        {t("notifications.markAllRead", "Mark all read")}
                    </Button>
                )}
            </div>

            {hasLoadError && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3">
                    <p className="text-sm font-medium text-foreground">
                        {t("notifications.loadError", "Some notifications failed to load.")}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                        {t("notifications.retryHint", "Retry to refresh billing and deadline alerts.")}
                    </p>
                    <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => {
                            void billingQuery.refetch();
                            void deadlinesQuery.refetch();
                        }}
                    >
                        {t("common.retry", "Retry")}
                    </Button>
                </div>
            )}

            {/* List */}
            {hasLoadError && notifications.length === 0 && !isLoading ? (
                <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-12 text-center">
                    <AlertTriangle className="mx-auto mb-3 h-6 w-6 text-destructive" />
                    <p className="font-semibold text-foreground">{t("notifications.loadError", "Some notifications failed to load.")}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {t("notifications.retryHint", "Retry to refresh billing and deadline alerts.")}
                    </p>
                </div>
            ) : notifications.length === 0 && !isLoading ? (
                <div className="rounded-2xl border border-border/50 bg-card p-12 text-center">
                    <div
                        className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full"
                        style={{ background: "rgba(1, 255, 127, 0.08)" }}
                    >
                        <CheckCheck className="h-6 w-6" style={{ color: "var(--djac-green)" }} />
                    </div>
                    <p className="font-semibold text-foreground">{t("notifications.empty", "You're all caught up!")}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                        {t("notifications.emptyDesc", "No new notifications at this time.")}
                    </p>
                </div>
            ) : isLoading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="rounded-xl border border-border/50 bg-card p-4 animate-pulse">
                            <div className="flex gap-3">
                                <div className="h-5 w-5 rounded-full bg-muted" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-3.5 w-2/3 rounded bg-muted" />
                                    <div className="h-3 w-1/2 rounded bg-muted" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="space-y-2.5">
                    {notifications.map((notif) => {
                        const isRead = readIds.has(notif.id);
                        return (
                            <div
                                key={notif.id}
                                className="group rounded-xl border p-4 transition-all duration-150 cursor-default"
                                style={{
                                    background: isRead ? "rgba(255,255,255,0.01)" : SEVERITY_BG[notif.severity],
                                    borderColor: isRead ? "rgba(255,255,255,0.07)" : SEVERITY_BORDER[notif.severity],
                                    opacity: isRead ? 0.6 : 1,
                                }}
                                onClick={() => markRead(notif.id)}
                                role="article"
                                aria-label={notif.title}
                            >
                                <div className="flex items-start gap-3">
                                    <TypeIcon type={notif.type} severity={isRead ? "info" : notif.severity} />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className={`text-sm font-semibold leading-snug ${isRead ? "text-muted-foreground" : "text-foreground"}`}>
                                                {notif.title}
                                                {!isRead && (
                                                    <span
                                                        className="ml-2 inline-block h-2 w-2 rounded-full align-middle"
                                                        style={{ background: SEVERITY_COLOR[notif.severity] }}
                                                        aria-label="Unread"
                                                    />
                                                )}
                                            </p>
                                            <span className="text-[10px] text-muted-foreground shrink-0 mt-0.5">
                                                {timeAgo(notif.timestamp)}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-0.5">{notif.body}</p>
                                        {notif.linkTo && (
                                            <Link
                                                href={notif.linkTo}
                                                className="mt-2 inline-flex items-center gap-1 text-xs font-medium transition-opacity hover:opacity-80"
                                                style={{ color: SEVERITY_COLOR[isRead ? "info" : notif.severity] }}
                                                onClick={(e: MouseEvent) => e.stopPropagation()}
                                            >
                                                {notif.linkLabel}
                                                <ChevronRight className="h-3 w-3" />
                                            </Link>
                                        )}
                                    </div>
                                    {!isRead && (
                                        <button
                                            className="hidden group-hover:flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors shrink-0"
                                            aria-label="Mark as read"
                                            onClick={(e) => { e.stopPropagation(); markRead(notif.id); }}
                                        >
                                            <CheckCheck className="h-3.5 w-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Filter hint */}
            {notifications.length > 0 && (
                <p className="text-xs text-muted-foreground text-center">
                    {t("notifications.typeDeadline", "Compliance Deadline")} · {t("notifications.typeTrialExpiring", "Trial Expiring")} · {t("notifications.typeSystem", "System")}
                    {" — "}<span className="text-primary">Click a notification to mark it read</span>
                </p>
            )}
        </div>
    );
}
