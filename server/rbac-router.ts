/**
 * rbac-router.ts — tRPC router for client-side permission queries.
 *
 * Exposes endpoints that the frontend uses to determine which UI elements
 * to show/hide based on the current user's effective module permissions.
 *
 * These are informational — the actual enforcement happens server-side in
 * each domain router via requireModule() or manual permission checks.
 */
import { z } from "zod";
import { router, orgProcedure, protectedProcedure } from "./_core/trpc";
import { getEffectivePermissions, isOnboardingComplete } from "./rbac";
import { MODULE_SLUGS, type ModuleSlug } from "../shared/const";
import type { TrpcContext } from "./_core/context";

const moduleSlugsSchema = z.enum([...MODULE_SLUGS] as [ModuleSlug, ...ModuleSlug[]]);

/**
 * Extracts the localUserId from the tRPC context user object.
 * Local-auth sessions attach localUserId to the user context object.
 */
function getLocalUserId(user: TrpcContext["user"]): number | null {
    if (!user) return null;
    const id = (user as Record<string, unknown>)["localUserId"];
    return typeof id === "number" ? id : null;
}

export const rbacRouter = router({
    /**
     * Get effective permissions for the current user in a specific module.
     * Returns the canView/canCreate/canEdit/canDelete/canExport/canInvite flags.
     */
    getModulePermissions: orgProcedure
        .input(z.object({ module: moduleSlugsSchema }))
        .query(async ({ ctx, input }) => {
            const userId = typeof ctx.user.id === "number" ? ctx.user.id : null;
            const localUserId = getLocalUserId(ctx.user);

            const perms = await getEffectivePermissions(
                userId,
                localUserId,
                ctx.organizationId,
                ctx.organizationRole ?? null,
                input.module,
            );

            return {
                module: input.module,
                canView: perms.canView,
                canCreate: perms.canCreate,
                canEdit: perms.canEdit,
                canDelete: perms.canDelete,
                canExport: perms.canExport,
                canInvite: perms.canInvite,
                isOverride: perms.isOverride,
            };
        }),

    /**
     * Get effective permissions for all modules at once.
     * Useful for building permission maps on initial load.
     */
    getAllModulePermissions: orgProcedure
        .query(async ({ ctx }) => {
            const userId = typeof ctx.user.id === "number" ? ctx.user.id : null;
            const localUserId = getLocalUserId(ctx.user);

            const results = await Promise.all(
                MODULE_SLUGS.map(async (module) => {
                    const perms = await getEffectivePermissions(
                        userId,
                        localUserId,
                        ctx.organizationId,
                        ctx.organizationRole ?? null,
                        module,
                    );
                    return [module, perms] as const;
                }),
            );

            return Object.fromEntries(results) as Record<ModuleSlug, {
                canView: boolean;
                canCreate: boolean;
                canEdit: boolean;
                canDelete: boolean;
                canExport: boolean;
                canInvite: boolean;
                isOverride: boolean;
            }>;
        }),

    /**
     * Get the current user's platform role and org role.
     * Lightweight alternative to role.myRole when you only need role info.
     */
    myRoles: protectedProcedure.query(({ ctx }) => {
        return {
            platformRole: ctx.user.role ?? "basic_user",
            orgRole: ctx.organizationRole ?? null,
            organizationId: ctx.organizationId ?? null,
        };
    }),

    /** Check whether the current user has completed onboarding. */
    onboardingStatus: protectedProcedure.query(async ({ ctx }) => {
        const userId = typeof ctx.user.id === "number" ? ctx.user.id : null;
        const localUserId = getLocalUserId(ctx.user);

        const complete = await isOnboardingComplete(userId, localUserId);
        return { complete };
    }),
});
