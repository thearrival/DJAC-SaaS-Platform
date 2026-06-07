/**
 * PermissionGate — Declarative fine-grained permission guard component.
 *
 * Renders `children` only when the current user has the required permission flag
 * for the given module. Falls back to `null`, a custom element, or a 403 card.
 *
 * This is different from `RoleGuard` (which checks platform role hierarchy) and
 * `FeatureGate` (which checks subscription plan). PermissionGate checks the
 * per-module, per-organisation permission matrix stored in `rolePermissions`.
 *
 * Usage:
 *   // Hide a "Delete" button from analysts:
 *   <PermissionGate module="risk_register" require="canDelete">
 *     <Button variant="destructive">Delete</Button>
 *   </PermissionGate>
 *
 *   // Show a forbidden card instead:
 *   <PermissionGate module="admin_control_center" require="canView" fallback="forbidden">
 *     <AdminPage />
 *   </PermissionGate>
 *
 *   // Custom fallback:
 *   <PermissionGate module="billing" require="canEdit" fallback={<ReadOnlyBadge />}>
 *     <EditBillingForm />
 *   </PermissionGate>
 */
import React from "react";
import { Loader2, ShieldX } from "lucide-react";
import { usePermission } from "@/hooks/usePermission";
import { useLocale } from "@/contexts/useLocale";
import type { ModuleSlug, PermissionFlags } from "@shared/const";

/** The permission flag to check on PermissionFlags */
export type PermissionAction = keyof PermissionFlags;

type PermissionGateProps = {
    /** Module to check permissions for */
    module: ModuleSlug;
    /** Which permission flag to evaluate */
    require: PermissionAction;
    children: React.ReactNode;
    /**
     * What to render when access is denied or loading:
     * - `"hide"` (default): renders nothing (null)
     * - `"forbidden"`: renders a styled 403 card
     * - A React node: rendered as-is when access is denied
     */
    fallback?: "hide" | "forbidden" | React.ReactNode;
    /**
     * If true (default), children are shown optimistically while the
     * permission query is loading. Set to false for security-critical gates.
     */
    optimistic?: boolean;
};

function ForbiddenInline() {
    const { t } = useLocale();
    return (
        <div className="flex flex-col items-center justify-center min-h-[200px] gap-3 text-center p-6 rounded-xl border border-destructive/20 bg-destructive/5">
            <ShieldX className="h-10 w-10 text-destructive/70" strokeWidth={1.5} />
            <p className="text-sm font-medium text-destructive">
                {t("rbac.permissionDenied", "You don't have permission to perform this action.")}
            </p>
        </div>
    );
}

export function PermissionGate({
    module,
    require: action,
    children,
    fallback = "hide",
    optimistic = true,
}: PermissionGateProps) {
    const perm = usePermission(module, optimistic);

    // While loading: show spinner only for non-optimistic mode
    if (perm.isLoading && !optimistic) {
        return (
            <div className="flex items-center justify-center p-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
        );
    }

    // Access granted (or optimistically loading)
    if (perm[action]) {
        return <>{children}</>;
    }

    // Access denied
    if (fallback === "hide") return null;
    if (fallback === "forbidden") return <ForbiddenInline />;
    return <>{fallback}</>;
}
