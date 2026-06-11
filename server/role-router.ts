/**
 * role-router.ts — tRPC router for platform role management.
 *
 * Role assignment is restricted to Platform Admin and Super Admin roles.
 * Every operation emits an auditLog entry of category "role_change".
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, platformAdminProcedure, superAdminProcedure, protectedProcedure } from "./_core/trpc";
import { recordAuditEvent } from "./audit-logger";
import { type PlatformRole, hasMinRole, NOT_PLATFORM_ADMIN_ERR_MSG } from "../shared/const";
import { listUsersWithRoles, assignUserRole, assignLocalUserRole, listAuditLogs } from "./role-store";

const platformRoleSchema = z.enum([
    "user",
    "admin",
    "basic_user",
    "professional_user",
    "company_admin",
    "platform_admin",
    "yalla_hack_employee",
    "super_admin",
]);

export const roleRouter = router({
    /**
     * Get the platform role of the currently-authenticated user.
     * Available to all authenticated users.
     */
    myRole: protectedProcedure.query(({ ctx }) => {
        return {
            role: ctx.user.role,
            organizationRole: ctx.organizationRole ?? null,
        };
    }),

    /**
     * List all users with their roles.
     * Restricted to Platform Admin and above.
     */
    listUsersWithRoles: platformAdminProcedure
        .input(z.object({ limit: z.number().int().min(1).max(500).default(100), offset: z.number().int().min(0).default(0) }))
        .query(async ({ input }) => {
            return listUsersWithRoles(input.limit, input.offset);
        }),

    /**
     * Assign a new platform role to a user (OAuth user).
     * - Platform Admin can assign up to and including company_admin.
     * - Super Admin can assign any role.
     * Cannot self-demote from super_admin.
     */
    assignUserRole: platformAdminProcedure
        .input(
            z.object({
                targetUserId: z.number().int().positive(),
                newRole: platformRoleSchema,
            })
        )
        .mutation(async ({ ctx, input }) => {
            const actorRole = ctx.user.role as PlatformRole;

            // Platform admins cannot elevate to super_admin or yalla_hack_employee
            if (
                !hasMinRole(actorRole, "super_admin") &&
                (input.newRole === "super_admin" || input.newRole === "yalla_hack_employee")
            ) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: NOT_PLATFORM_ADMIN_ERR_MSG,
                });
            }

            // Cannot self-demote
            if (input.targetUserId === ctx.user.id && !hasMinRole(input.newRole, actorRole)) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You cannot demote your own role.",
                });
            }

            const target = await assignUserRole(input.targetUserId, input.newRole as PlatformRole);
            if (!target) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable or user not found" });

            await recordAuditEvent(ctx, {
                category: "role_change",
                action: "user.role.assign",
                entityType: "users",
                entityId: target.id,
                targetEntity: target.email ?? target.name ?? String(target.id),
                outcome: "success",
                payload: { previousRole: target.role, newRole: input.newRole },
            });

            return { success: true, previousRole: target.role, newRole: input.newRole };
        }),

    /**
     * Assign a platform-level role to a localUser (password auth user).
     * Restricted to Platform Admin and above.
     */
    assignLocalUserRole: platformAdminProcedure
        .input(
            z.object({
                targetLocalUserId: z.number().int().positive(),
                newUserType: z.enum([
                    "visitor",
                    "professional",
                    "admin",
                    "basic_user",
                    "professional_user",
                    "company_admin",
                    "platform_admin",
                    "yalla_hack_employee",
                    "super_admin",
                ]),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const actorRole = ctx.user.role as PlatformRole;

            if (
                !hasMinRole(actorRole, "super_admin") &&
                (input.newUserType === "super_admin" || input.newUserType === "yalla_hack_employee")
            ) {
                throw new TRPCError({ code: "FORBIDDEN", message: NOT_PLATFORM_ADMIN_ERR_MSG });
            }

            const target = await assignLocalUserRole(input.targetLocalUserId, input.newUserType);
            if (!target) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable or user not found" });

            await recordAuditEvent(ctx, {
                category: "role_change",
                action: "localUser.role.assign",
                entityType: "localUsers",
                entityId: target.id,
                localUserId: target.id,
                targetEntity: target.email ?? target.name,
                outcome: "success",
                payload: { previousUserType: target.userType, newUserType: input.newUserType },
            });

            return { success: true, previousUserType: target.userType, newUserType: input.newUserType };
        }),

    /**
     * Fetch audit logs — Super Admin only.
     */
    auditLogs: superAdminProcedure
        .input(
            z.object({
                limit: z.number().int().min(1).max(500).default(100),
                offset: z.number().int().min(0).default(0),
                category: z.enum(["auth", "data_write", "data_read", "role_change", "system", "billing"]).optional(),
                outcome: z.enum(["success", "failure", "blocked"]).optional(),
            })
        )
        .query(async ({ input }) => {
            return listAuditLogs(input.limit, input.offset, input.category, input.outcome);
        }),
});
