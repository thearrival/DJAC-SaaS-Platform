import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { requireModulePermissionIfOrgContext } from "./_core/permission-guard";
import {
    listDeadlines,
    createDeadline,
    completeDeadline,
    getDeadlineSummary,
    listOrgMembersForDeadlines,
} from "./deadline-store";

export const deadlineRouter = router({
    list: protectedProcedure
        .input(
            z.object({
                jurisdiction: z.enum(["China", "Saudi Arabia", "Both"]).optional(),
                status: z.enum(["upcoming", "overdue", "completed", "waived"]).optional(),
                frameworkCode: z.string().optional(),
                limit: z.number().int().min(1).max(500).optional(),
            }).optional()
        )
        .query(async ({ ctx, input }) => {
            await requireModulePermissionIfOrgContext(ctx, "compliance_calendar", "canView");
            return listDeadlines({
                organizationId: ctx.organizationId ?? undefined,
                includeGlobal: true,
                ...input,
            });
        }),

    summary: protectedProcedure.query(async ({ ctx }) => {
        await requireModulePermissionIfOrgContext(ctx, "compliance_calendar", "canView");
        return getDeadlineSummary(ctx.organizationId ?? undefined);
    }),

    create: protectedProcedure
        .input(
            z.object({
                frameworkCode: z.string().trim().min(1).max(50),
                title: z.string().trim().min(3).max(255),
                description: z.string().trim().max(2000).optional(),
                deadlineDate: z.string().datetime(),
                jurisdiction: z.enum(["China", "Saudi Arabia", "Both"]),
                priority: z.enum(["low", "medium", "high", "critical"]).optional(),
                assignedToUserId: z.number().int().positive().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            await requireModulePermissionIfOrgContext(ctx, "compliance_calendar", "canCreate");
            return createDeadline({
                organizationId: ctx.organizationId ?? null,
                frameworkCode: input.frameworkCode,
                title: input.title,
                description: input.description,
                deadlineDate: new Date(input.deadlineDate),
                jurisdiction: input.jurisdiction,
                priority: input.priority,
                assignedToUserId: input.assignedToUserId ?? ctx.user?.id ?? null,
            });
        }),

    complete: protectedProcedure
        .input(z.number().int().positive())
        .mutation(async ({ input, ctx }) => {
            await requireModulePermissionIfOrgContext(ctx, "compliance_calendar", "canEdit");
            return completeDeadline(input, ctx.organizationId);
        }),

    orgMembers: protectedProcedure.query(async ({ ctx }) => {
        await requireModulePermissionIfOrgContext(ctx, "compliance_calendar", "canView");
        return listOrgMembersForDeadlines(ctx.organizationId);
    }),
});
