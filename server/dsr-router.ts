/**
 * DSR Router � refactored to use dsr-store.ts
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { activeOrgProcedure, router } from "./_core/trpc";
import { requireModulePermission } from "./_core/permission-guard";
import { recordAuditEvent } from "./audit-logger";
import {
    listDsrs,
    createDsr,
    patchDsr,
    removeDsr,
    getDsrSummary,
    REQUEST_TYPES,
    JURISDICTIONS,
    STATUSES,
    PRIORITIES,
} from "./dsr-store";

const requestTypeEnum = z.enum(REQUEST_TYPES);
const jurisdictionEnum = z.enum(JURISDICTIONS);
const statusEnum = z.enum(STATUSES);
const priorityEnum = z.enum(PRIORITIES);

const createSchema = z.object({
    requestType: requestTypeEnum,
    jurisdiction: jurisdictionEnum,
    requesterName: z.string().trim().min(1).max(255),
    requesterEmail: z.string().email().max(255),
    description: z.string().trim().max(5000).optional(),
    priority: priorityEnum,
    assignedToUserId: z.number().int().positive().optional(),
    notes: z.string().trim().max(5000).optional(),
});

const patchSchema = z.object({
    status: statusEnum.optional(),
    priority: priorityEnum.optional(),
    assignedToUserId: z.number().int().positive().nullable().optional(),
    notes: z.string().trim().max(5000).optional(),
    completedAt: z.string().nullable().optional(),
});

export const dsrRouter = router({
    list: activeOrgProcedure
        .input(z.object({
            status: statusEnum.optional(),
            requestType: requestTypeEnum.optional(),
            jurisdiction: jurisdictionEnum.optional(),
        }).optional())
        .query(async ({ ctx, input }) => {
            await requireModulePermission(ctx, "dsr_management", "canView");
            return listDsrs(ctx.organizationId as number, input ?? {});
        }),

    create: activeOrgProcedure.input(createSchema).mutation(async ({ ctx, input }) => {
        await requireModulePermission(ctx, "dsr_management", "canCreate");
        const orgId = ctx.organizationId as number;
        const result = await createDsr(orgId, input, input.assignedToUserId ?? null);
        void recordAuditEvent(ctx, {
            category: "data_write",
            action: "dsr.create",
            entityType: "dsrRequests",
            entityId: result.id,
            targetEntity: input.requesterEmail,
            outcome: "success",
            payload: { requestType: input.requestType, jurisdiction: input.jurisdiction },
        });
        return result;
    }),

    patch: activeOrgProcedure
        .input(z.object({ id: z.number().int().positive() }).merge(patchSchema))
        .mutation(async ({ ctx, input }) => {
            await requireModulePermission(ctx, "dsr_management", "canEdit");
            const { id, ...data } = input;
            const orgId = ctx.organizationId as number;
            const updateValues: Record<string, unknown> = { ...data, updatedAt: new Date() };
            if (data.completedAt !== undefined) {
                updateValues.completedAt = data.completedAt ? new Date(data.completedAt) : null;
            }
            const success = await patchDsr(orgId, id, updateValues);
            if (!success) throw new TRPCError({ code: "NOT_FOUND" });
            void recordAuditEvent(ctx, {
                category: "data_write",
                action: "dsr.patch",
                entityType: "dsrRequests",
                entityId: id,
                outcome: "success",
            });
            return { success: true };
        }),

    remove: activeOrgProcedure
        .input(z.number().int().positive())
        .mutation(async ({ ctx, input: id }) => {
            await requireModulePermission(ctx, "dsr_management", "canDelete");
            const orgId = ctx.organizationId as number;
            const success = await removeDsr(orgId, id);
            if (!success) throw new TRPCError({ code: "NOT_FOUND" });
            void recordAuditEvent(ctx, {
                category: "data_write",
                action: "dsr.remove",
                entityType: "dsrRequests",
                entityId: id,
                outcome: "success",
            });
            return { success: true };
        }),

    summary: activeOrgProcedure.query(async ({ ctx }) => {
        await requireModulePermission(ctx, "dsr_management", "canView");
        return getDsrSummary(ctx.organizationId as number);
    }),
});
