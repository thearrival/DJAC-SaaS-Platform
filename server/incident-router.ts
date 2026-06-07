/**
 * Incident Router � refactored to use incident-store.ts
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { activeOrgProcedure, router } from "./_core/trpc";
import { requireModulePermission } from "./_core/permission-guard";
import { recordAuditEvent } from "./audit-logger";
import {
    listIncidents,
    createIncident,
    patchIncident,
    getIncidentStatus,
    applyIncidentStatusTransition,
    markIncidentNotified,
    deleteIncident,
} from "./incident-store";

const STATUS_TRANSITIONS: Record<string, string[]> = {
    open: ["under_investigation", "contained", "closed"],
    under_investigation: ["contained", "resolved", "closed"],
    contained: ["resolved", "under_investigation", "closed"],
    resolved: ["closed", "under_investigation"],
    closed: [],
};

const incidentTypeEnum = z.enum(["data_breach", "unauthorized_access", "policy_violation", "system_outage", "third_party_breach", "other"]);
const severityEnum = z.enum(["critical", "high", "medium", "low"]);
const statusEnum = z.enum(["open", "under_investigation", "contained", "resolved", "closed"]);

const createSchema = z.object({
    incidentCode: z.string().trim().max(50).optional(),
    title: z.string().trim().min(1).max(255),
    description: z.string().trim().max(5000).optional(),
    incidentType: incidentTypeEnum,
    severity: severityEnum,
    status: statusEnum,
    affectedFrameworks: z.array(z.string()),
    affectedVendorId: z.number().int().positive().optional(),
    affectedDataTypes: z.array(z.string()),
    affectedDataSubjects: z.number().int().min(0).optional(),
    occurredAt: z.string().optional(),
    detectedAt: z.string().optional(),
    regulatoryNotificationRequired: z.boolean(),
    notificationDeadlineHours: z.number().int().min(1).max(720),
    rootCause: z.string().trim().max(5000).optional(),
    lessonsLearned: z.string().trim().max(5000).optional(),
    notes: z.string().trim().max(5000).optional(),
});

export const incidentRouter = router({
    list: activeOrgProcedure.query(async ({ ctx }) => {
        await requireModulePermission(ctx, "incident_register", "canView");
        return listIncidents(ctx.organizationId as number);
    }),

    create: activeOrgProcedure.input(createSchema).mutation(async ({ ctx, input }) => {
        await requireModulePermission(ctx, "incident_register", "canCreate");
        const orgId = ctx.organizationId as number;
        const result = await createIncident(orgId, input);
        void recordAuditEvent(ctx, {
            category: "data_write",
            action: "incident.create",
            entityType: "complianceIncidents",
            entityId: result.id,
            targetEntity: input.title,
            outcome: "success",
        });
        return result;
    }),

    patch: activeOrgProcedure
        .input(z.object({ id: z.number().int().positive() }).merge(createSchema.partial()))
        .mutation(async ({ ctx, input }) => {
            await requireModulePermission(ctx, "incident_register", "canEdit");
            const { id, ...data } = input;
            const orgId = ctx.organizationId as number;
            const result = await patchIncident(orgId, id, data);
            if (!result) throw new TRPCError({ code: "NOT_FOUND" });
            void recordAuditEvent(ctx, {
                category: "data_write",
                action: "incident.patch",
                entityType: "complianceIncidents",
                entityId: id,
                outcome: "success",
            });
            return result;
        }),

    updateStatus: activeOrgProcedure
        .input(z.object({ id: z.number().int().positive(), status: statusEnum }))
        .mutation(async ({ ctx, input }) => {
            await requireModulePermission(ctx, "incident_register", "canEdit");
            const orgId = ctx.organizationId as number;
            const currentStatus = await getIncidentStatus(orgId, input.id);
            if (currentStatus === null) throw new TRPCError({ code: "NOT_FOUND" });
            const allowed = STATUS_TRANSITIONS[currentStatus] ?? [];
            if (!allowed.includes(input.status)) {
                throw new TRPCError({ code: "BAD_REQUEST", message: `Cannot transition from '${currentStatus}' to '${input.status}'` });
            }
            const result = await applyIncidentStatusTransition(orgId, input.id, input.status);
            if (!result) throw new TRPCError({ code: "NOT_FOUND" });
            void recordAuditEvent(ctx, {
                category: "data_write",
                action: "incident.updateStatus",
                entityType: "complianceIncidents",
                entityId: input.id,
                outcome: "success",
                payload: { from: currentStatus, to: input.status },
            });
            return result;
        }),

    markNotified: activeOrgProcedure
        .input(z.number().int().positive())
        .mutation(async ({ ctx, input: id }) => {
            await requireModulePermission(ctx, "incident_register", "canEdit");
            const orgId = ctx.organizationId as number;
            const result = await markIncidentNotified(orgId, id);
            if (!result) throw new TRPCError({ code: "NOT_FOUND" });
            void recordAuditEvent(ctx, {
                category: "data_write",
                action: "incident.markNotified",
                entityType: "complianceIncidents",
                entityId: id,
                outcome: "success",
            });
            return result;
        }),

    remove: activeOrgProcedure
        .input(z.number().int().positive())
        .mutation(async ({ ctx, input: id }) => {
            await requireModulePermission(ctx, "incident_register", "canDelete");
            const orgId = ctx.organizationId as number;
            const found = await deleteIncident(orgId, id);
            if (!found) throw new TRPCError({ code: "NOT_FOUND" });
            void recordAuditEvent(ctx, {
                category: "data_write",
                action: "incident.remove",
                entityType: "complianceIncidents",
                entityId: id,
                outcome: "success",
            });
            return { success: true };
        }),
});
