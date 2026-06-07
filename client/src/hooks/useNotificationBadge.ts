import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocalAuth } from "@/hooks/useLocalAuth";

const READ_KEY = "djac_notif_read_ids";

function getReadIds(): Set<string> {
    try {
        return new Set(JSON.parse(localStorage.getItem(READ_KEY) ?? "[]") as string[]);
    } catch {
        return new Set();
    }
}

function daysUntil(d: Date | string | null | undefined): number {
    if (!d) return 9999;
    return Math.ceil((new Date(d).getTime() - Date.now()) / 86_400_000);
}

/**
 * Returns the count of unread notifications for the sidebar badge.
 * Mirrors the logic in Notifications.tsx without requiring that page to be mounted.
 */
export function useNotificationBadge(): number {
    const { user } = useAuth();
    const { localUser } = useLocalAuth();
    const isLoggedIn = !!user || !!localUser;

    const billingQuery = trpc.billing.getSubscriptionStatus.useQuery(undefined, {
        enabled: isLoggedIn,
        retry: false,
        refetchOnWindowFocus: false,
        staleTime: 60_000,
    });

    const deadlinesQuery = trpc.deadlines.list.useQuery(
        { status: "upcoming", limit: 50 },
        {
            enabled: isLoggedIn,
            retry: false,
            refetchOnWindowFocus: false,
            staleTime: 60_000,
        },
    );

    const ids: string[] = [];

    const billing = billingQuery.data;
    if (billing?.plan === "free_trial") {
        const days = billing.trialDaysRemaining ?? 0;
        if (days <= 0) ids.push("trial-expired");
        else if (days <= 3) ids.push("trial-urgent");
        else if (days <= 7) ids.push("trial-reminder");
    }

    const deadlines = (deadlinesQuery.data ?? []) as Array<{
        id: number;
        deadlineDate: string | Date | null;
    }>;
    deadlines.forEach((dl) => {
        if (daysUntil(dl.deadlineDate) <= 30) ids.push(`deadline-${dl.id}`);
    });

    const readIds = getReadIds();
    return ids.filter((id) => !readIds.has(id)).length;
}
