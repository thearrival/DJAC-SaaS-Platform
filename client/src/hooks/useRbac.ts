/**
 * useRbac — React hook providing role-based access control utilities.
 *
 * Combines the OAuth user (useAuth) and local-auth user (useLocalAuth) to
 * surface the active platform role and helper predicates for conditional
 * rendering and route protection.
 */
import { useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocalAuth } from "@/hooks/useLocalAuth";
import { hasMinRole, type PlatformRole } from "@shared/const";

/** The effective platform role for the current session */
export type EffectiveRole = PlatformRole | "anonymous";

export function useRbac() {
    const { user, loading: oauthLoading } = useAuth();
    const { localUser, isLoading: localLoading } = useLocalAuth();

    const role: EffectiveRole = useMemo(() => {
        // OAuth user takes precedence
        if (user?.role) return user.role as PlatformRole;
        // Local user role is stored in userType
        if (localUser?.userType) return localUser.userType as PlatformRole;
        return "anonymous";
    }, [user?.role, localUser?.userType]);

    const isLoading = oauthLoading || localLoading;
    const isAuthenticated = !!user || !!localUser;

    return {
        role,
        isLoading,
        isAuthenticated,

        /** True for super_admin only */
        isSuperAdmin: role === "super_admin",

        /** True for super_admin or yalla_hack_employee */
        isYallaHack: hasMinRole(role, "yalla_hack_employee"),

        /** True for platform_admin and above */
        isPlatformAdmin: hasMinRole(role, "platform_admin"),

        /** True for company_admin and above */
        isCompanyAdmin: hasMinRole(role, "company_admin"),

        /** True for professional_user and above */
        isProfessional: hasMinRole(role, "professional_user"),

        /** True for legacy "admin" role (AdminControlCenter) */
        isLegacyAdmin: role === "admin" || hasMinRole(role, "platform_admin"),

        /** Returns true when the current role meets the minimum privilege */
        can: (required: PlatformRole) => hasMinRole(role, required),
    };
}
