/**
 * RoleGuard — Renders children only when the current user meets the minimum
 * required role. Optionally redirects or renders a fallback.
 *
 * Usage:
 *   <RoleGuard required="company_admin">
 *     <CompanyDashboard />
 *   </RoleGuard>
 *
 *   <RoleGuard required="super_admin" fallback={<AccessDenied />}>
 *     <AuditTrail />
 *   </RoleGuard>
 */
import React from "react";
import { Redirect } from "wouter";
import { useRbac } from "@/hooks/useRbac";
import type { PlatformRole } from "@shared/const";
import { Loader2, ShieldX } from "lucide-react";
import { useLocale } from "@/contexts/useLocale";

type RoleGuardProps = {
    /** Minimum role required — uses the platform privilege hierarchy */
    required: PlatformRole;
    children: React.ReactNode;
    /**
     * What to render when access is denied.
     * - `"redirect"` (default): redirects to /dashboard
     * - `"forbidden"`: renders a styled 403 card in-place
     * - A React node: rendered as-is
     */
    fallback?: "redirect" | "forbidden" | React.ReactNode;
};

function ForbiddenCard() {
    const { t } = useLocale();
    return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
            <ShieldX className="h-16 w-16 text-destructive" strokeWidth={1.5} />
            <h2 className="text-2xl font-semibold">
                {t("rbac.accessDeniedTitle", "Access Denied")}
            </h2>
            <p className="max-w-sm text-muted-foreground">
                {t(
                    "rbac.accessDeniedMessage",
                    "You do not have the required permissions to view this page. Contact your administrator if you believe this is a mistake."
                )}
            </p>
        </div>
    );
}

export function RoleGuard({ required, children, fallback = "redirect" }: RoleGuardProps) {
    const { can, isLoading } = useRbac();

    if (isLoading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!can(required)) {
        if (fallback === "redirect") return <Redirect to="/dashboard" />;
        if (fallback === "forbidden") return <ForbiddenCard />;
        return <>{fallback}</>;
    }

    return <>{children}</>;
}
