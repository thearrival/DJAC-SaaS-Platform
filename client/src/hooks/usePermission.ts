/**
 * usePermission — React hook for fine-grained module permission checks.
 *
 * Fetches the current user's effective permissions for a given module
 * from the server (via tRPC) and exposes typed boolean flags.
 *
 * Usage:
 *   const { canView, canCreate, canEdit, isLoading } = usePermission("risk_register");
 *
 *   // Optimistically allow while loading (use with RoleGuard for hard blocks):
 *   if (!canCreate) return <UpgradeCta />;
 */
import { useMemo } from "react";
import { trpc } from "@/lib/trpc";
import type { ModuleSlug, PermissionFlags } from "@shared/const";

const DENY_FLAGS: PermissionFlags = {
    canView: false,
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canExport: false,
    canInvite: false,
};

const ALLOW_FLAGS: PermissionFlags = {
    canView: true,
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canExport: true,
    canInvite: true,
};

export interface UsePermissionResult extends PermissionFlags {
    /** True while the permission query is in-flight */
    isLoading: boolean;
    /** True if the query completed but returned no data (unauthenticated / error) */
    isError: boolean;
}

/**
 * Fetches and caches effective permissions for a given module slug.
 *
 * @param module  The module to check (e.g. "risk_register", "billing").
 * @param optimistic  If true (default), resolves to ALLOW while loading instead of DENY.
 *                    Set to false for security-sensitive gates that must wait for server confirmation.
 */
export function usePermission(
    module: ModuleSlug,
    optimistic = true,
): UsePermissionResult {
    const { data, isLoading, isError } = trpc.rbac.getModulePermissions.useQuery(
        { module },
        {
            retry: false,
            staleTime: 60_000,   // cache for 1 minute
            gcTime: 5 * 60_000,  // keep in memory for 5 minutes
        },
    );

    return useMemo<UsePermissionResult>(() => {
        if (isLoading) {
            return { ...( optimistic ? ALLOW_FLAGS : DENY_FLAGS), isLoading: true, isError: false };
        }
        if (isError || !data) {
            return { ...DENY_FLAGS, isLoading: false, isError: true };
        }
        return {
            canView: data.canView ?? false,
            canCreate: data.canCreate ?? false,
            canEdit: data.canEdit ?? false,
            canDelete: data.canDelete ?? false,
            canExport: data.canExport ?? false,
            canInvite: data.canInvite ?? false,
            isLoading: false,
            isError: false,
        };
    }, [data, isLoading, isError, optimistic]);
}
