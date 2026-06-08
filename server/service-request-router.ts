/**
 * Service Request Router � refactored to use service-request-store.ts
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { activeOrgProcedure, protectedProcedure, router } from "./_core/trpc";
import { requireModulePermission, requireModulePermissionIfOrgContext } from "./_core/permission-guard";
import { recordAuditEvent } from "./audit-logger";
import { hasMinRole } from "../shared/const";
import { logEvent } from "./_core/logger";
import { sendEmail } from "./email";
import { ENV } from "./_core/env";
import { recordUserInteraction } from "./interaction-logger";
import { broadcastSSE } from "./services/sse-bus";
import {
    listRequests,
    getRequest,
    createRequest,
    cancelRequest,
    adminListRequests,
    adminUpdateRequest,
    SERVICE_TYPES,
    REQUEST_STATUSES,
    PRIORITY_LEVELS,
} from "./service-request-store";

const serviceTypeEnum = z.enum(SERVICE_TYPES);
const statusEnum = z.enum(REQUEST_STATUSES);
const priorityEnum = z.enum(PRIORITY_LEVELS);

const createSchema = z.object({
    serviceType: serviceTypeEnum,
    title: z.string().trim().min(3).max(255),
    description: z.string().trim().min(10).max(5000),
    scopeDetails: z.string().trim().max(3000).optional(),
    preferredStartDate: z.string().optional(),
    budgetRange: z.string().trim().max(100).optional(),
    priority: priorityEnum,
});

const adminUpdateSchema = z.object({
    status: statusEnum.optional(),
    assignedToUserId: z.number().int().positive().nullable().optional(),
    internalNotes: z.string().trim().max(5000).nullable().optional(),
    clientResponse: z.string().trim().max(5000).nullable().optional(),
    priority: priorityEnum.optional(),
});

export const serviceRequestRouter = router({
    list: activeOrgProcedure.query(async ({ ctx }) => {
        await requireModulePermission(ctx, "service_requests", "canView");
        return listRequests(ctx.organizationId as number);
    }),

    get: activeOrgProcedure
        .input(z.object({ id: z.number().int().positive() }))
        .query(async ({ ctx, input }) => {
            await requireModulePermission(ctx, "service_requests", "canView");
            const req = await getRequest(ctx.organizationId as number, input.id);
            if (!req) throw new TRPCError({ code: "NOT_FOUND" });
            return req;
        }),

    create: activeOrgProcedure.input(createSchema).mutation(async ({ ctx, input }) => {
        await requireModulePermission(ctx, "service_requests", "canCreate");
        const orgId = ctx.organizationId as number;
        const localUserId = (ctx.user as { localUserId?: number })?.localUserId ?? null;
        const { row, insertId } = await createRequest(orgId, input, localUserId);

        void recordAuditEvent(ctx, {
            category: "data_write",
            action: "serviceRequest.create",
            entityType: "serviceRequests",
            entityId: insertId,
            targetEntity: input.title,
            outcome: "success",
            payload: { serviceType: input.serviceType, priority: input.priority },
        });

        if (ENV.smtpHost) {
            const body = `A new service request has been submitted by organization ${orgId}.\n\nService Type: ${input.serviceType}\nPriority: ${input.priority}\n\nDescription:\n${input.description}`;
            sendEmail({
                to: ENV.smtpFrom ?? "admin@yalla-hack.net",
                subject: `[DJAC] New Service Request: ${input.title}`,
                html: `<pre>${body}</pre>`,
                text: body,
            }).catch((err: unknown) => logEvent("system", "service-request-create-notify-fail", { err }, "warn"));
        }

        broadcastSSE("service_request_created", { id: insertId, orgId, serviceType: input.serviceType, priority: input.priority });

        void recordUserInteraction(ctx, { context: "service_request", action: "service_request_submitted", entityId: insertId, inputSnapshot: { serviceType: input.serviceType } });

        return row;
    }),

    cancel: activeOrgProcedure
        .input(z.object({ id: z.number().int().positive() }))
        .mutation(async ({ ctx, input }) => {
            await requireModulePermission(ctx, "service_requests", "canEdit");
            const orgId = ctx.organizationId as number;
            const result = await cancelRequest(orgId, input.id);
            if (result === "not_found") throw new TRPCError({ code: "NOT_FOUND" });
            if (result === "not_cancellable") throw new TRPCError({ code: "BAD_REQUEST", message: "Request cannot be cancelled in its current state" });

            void recordAuditEvent(ctx, {
                category: "data_write",
                action: "serviceRequest.cancel",
                entityType: "serviceRequests",
                entityId: input.id,
                outcome: "success",
            });
            return { success: true };
        }),

    adminList: protectedProcedure.query(async ({ ctx }) => {
        if (!hasMinRole(ctx.user?.role, "admin")) throw new TRPCError({ code: "FORBIDDEN" });
        await requireModulePermissionIfOrgContext(ctx, "service_requests", "canView");
        return adminListRequests();
    }),

    adminUpdate: protectedProcedure
        .input(z.object({ id: z.number().int().positive() }).merge(adminUpdateSchema))
        .mutation(async ({ ctx, input }) => {
            if (!hasMinRole(ctx.user?.role, "admin")) throw new TRPCError({ code: "FORBIDDEN" });
            await requireModulePermissionIfOrgContext(ctx, "service_requests", "canEdit");
            const { id, ...data } = input;
            const updateValues: Record<string, unknown> = { ...data, updatedAt: new Date() };
            if (data.status === "completed") updateValues.completedAt = new Date();
            if (data.clientResponse !== undefined) updateValues.respondedAt = new Date();

            const updated = await adminUpdateRequest(id, updateValues);
            if (!updated) throw new TRPCError({ code: "NOT_FOUND" });

            if (data.clientResponse && updated.organizationId != null) {
                broadcastSSE("service_request_updated", { id, status: updated.status, orgId: updated.organizationId });
            }

            void recordAuditEvent(ctx, {
                category: "data_write",
                action: "serviceRequest.adminUpdate",
                entityType: "serviceRequests",
                entityId: id,
                outcome: "success",
                payload: data,
            });
            return updated;
        }),
});
