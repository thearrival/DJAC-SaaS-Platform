/**
 * RBAC Helper Module
 *
 * Provides server-side utilities for resolving effective permissions,
 * checking onboarding status, and guarding module access.
 *
 * Resolution order for permissions:
 *   1. Explicit `rolePermissions` row for (userId | localUserId, orgId, module) — highest priority
 *   2. DEFAULT_ORG_ROLE_PERMISSIONS[orgRole][module] — fallback
 *   3. Full DENY — when no match found
 */

import { eq, and, or, isNull } from "drizzle-orm";
import { rolePermissions, userOnboarding } from "../drizzle/schema";
import { getDb } from "./db";
import {
    DEFAULT_ORG_ROLE_PERMISSIONS,
    type ModuleSlug,
    type OrgRole,
    type OnboardingStage,
    type PermissionFlags,
} from "../shared/const";
import type { TrpcContext } from "./_core/context";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EffectivePermissions extends PermissionFlags {
    /** True if this came from an explicit DB override rather than the default matrix */
    isOverride: boolean;
}

const FULL_DENY: EffectivePermissions = {
    canView: false,
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canExport: false,
    canInvite: false,
    isOverride: false,
};

// ─── Permission Resolution ────────────────────────────────────────────────────

/**
 * Resolves the effective permissions for a user in a given org and module.
 *
 * @param userId      Platform (OAuth) user ID, or null for local-auth-only users
 * @param localUserId Local auth user ID, or null for OAuth-only users
 * @param orgId       The organisation the action is being performed in
 * @param orgRole     The user's role within that organisation
 * @param module      The module slug to check permissions for
 */
export async function getEffectivePermissions(
    userId: number | null,
    localUserId: number | null,
    orgId: number,
    orgRole: string | null | undefined,
    module: ModuleSlug,
): Promise<EffectivePermissions> {
    const db = await getDb();

    // 1. Check for an explicit per-user override in the DB
    if (db && (userId || localUserId)) {
        const userConditions = [];
        if (userId) userConditions.push(eq(rolePermissions.userId, userId));
        if (localUserId) userConditions.push(eq(rolePermissions.localUserId, localUserId));

        const [override] = await db
            .select()
            .from(rolePermissions)
            .where(
                and(
                    eq(rolePermissions.organizationId, orgId),
                    eq(rolePermissions.module, module),
                    or(...userConditions),
                ),
            )
            .limit(1);

        if (override) {
            return {
                canView: override.canView === 1,
                canCreate: override.canCreate === 1,
                canEdit: override.canEdit === 1,
                canDelete: override.canDelete === 1,
                canExport: override.canExport === 1,
                canInvite: override.canInvite === 1,
                isOverride: true,
            };
        }
    }

    // 2. Fall back to default matrix for the org role
    if (orgRole && orgRole in DEFAULT_ORG_ROLE_PERMISSIONS) {
        const defaults = DEFAULT_ORG_ROLE_PERMISSIONS[orgRole as OrgRole];
        const moduleDefaults = defaults[module];
        if (moduleDefaults) {
            return { ...moduleDefaults, isOverride: false };
        }
    }

    // 3. Full DENY — unknown role or unlisted module
    return FULL_DENY;
}

/**
 * Convenience wrapper that reads userId/localUserId/orgId/orgRole from a tRPC context.
 */
export async function getEffectivePermissionsFromCtx(
    ctx: TrpcContext,
    module: ModuleSlug,
): Promise<EffectivePermissions> {
    const userId = ctx.user?.id ?? null;
    const localUserId = (ctx.user as { localUserId?: number } | null)?.localUserId ?? null;
    const orgId = ctx.organizationId;
    const orgRole = ctx.organizationRole;

    if (!orgId) return FULL_DENY;

    return getEffectivePermissions(userId, localUserId, orgId, orgRole, module);
}

// ─── Module Access Guard ──────────────────────────────────────────────────────

/**
 * Returns true when the caller can view (access) the given module.
 * Use this for quick "can open this page?" checks inside procedures.
 */
export async function canAccessModule(
    ctx: TrpcContext,
    module: ModuleSlug,
): Promise<boolean> {
    const perms = await getEffectivePermissionsFromCtx(ctx, module);
    return perms.canView;
}

// ─── Onboarding Status ────────────────────────────────────────────────────────

/**
 * Retrieves the current onboarding stage for a user.
 * Returns `"completed"` for legacy users without a `userOnboarding` row
 * (so as not to block existing accounts when the feature is first deployed).
 */
export async function checkOnboardingStatus(
    userId: number | null,
    localUserId: number | null,
): Promise<OnboardingStage> {
    const db = await getDb();
    if (!db || (!userId && !localUserId)) return "completed";

    const userConditions = [];
    if (userId) userConditions.push(eq(userOnboarding.userId, userId));
    if (localUserId) userConditions.push(eq(userOnboarding.localUserId, localUserId));

    const [row] = await db
        .select({ stage: userOnboarding.stage })
        .from(userOnboarding)
        .where(or(...userConditions))
        .limit(1);

    return (row?.stage ?? "completed") as OnboardingStage;
}

/**
 * Returns true when the user has a completed onboarding record (or no record at all).
 */
export async function isOnboardingComplete(
    userId: number | null,
    localUserId: number | null,
): Promise<boolean> {
    const stage = await checkOnboardingStatus(userId, localUserId);
    return stage === "completed";
}
