/**
 * Audit Schedule Router � Phase 33
 *
 * CRUD + lifecycle for scheduled compliance audits (internal, external,
 * regulatory, certification). Supports recurrence so completing an audit
 * auto-computes the next scheduled occurrence date.
 *
 * Procedures:
 *   auditSchedule.list     � list all audits ordered by scheduledDate ASC
 *   auditSchedule.create   � schedule a new audit
 *   auditSchedule.patch    � partial update of any editable field
 *   auditSchedule.complete � mark completed + persist findings + set nextOccurrence
 *   auditSchedule.remove   � delete
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { activeOrgProcedure, router } from "./_core/trpc";
import { recordAuditEvent } from "./audit-logger";
import { requireModulePermission } from "./_core/permission-guard";
import {
    listAudits,
    createAudit,
    patchAudit,
    completeAudit,
    removeAudit,
} from "./audit-schedule-store";

// --- Shared enums -------------------------------------------------------------

const auditTypeEnum = z.enum(["internal", "external", "regulatory", "certification"]);
const statusEnum = z.enum(["planned", "in_progress", "completed", "cancelled"]);
const recurrenceEnum = z.enum(["none", "monthly", "quarterly", "biannual", "annual"]);

// --- Input schemas ------------------------------------------------------------

const createSchema = z.object({
    title: z.string().trim().min(2, "Title must be at least 2 characters").max(255),
    description: z.string().trim().max(2000).optional(),
    auditType: auditTypeEnum.default("internal"),
    scope: z.array(z.string().trim().max(64)).max(20).optional(),
    status: statusEnum.default("planned"),
    scheduledDate: z.string().min(1),
    assignedToId: z.number().int().positive().optional(),
    vendorId: z.number().int().positive().optional(),
    findings: z.string().trim().max(4000).optional(),
    recurrence: recurrenceEnum.default("none"),
    notes: z.string().trim().max(2000).optional(),
});

const patchSchema = createSchema.partial().extend({
    id: z.number().int().positive(),
});

// --- Router ------------------------------------------------------------------

export const auditScheduleRouter = router({
    list: activeOrgProcedure.query(async ({ ctx }) => {
        await requireModulePermission(ctx, "audit_schedule", "canView");
        return listAudits(ctx.organizationId as number);
    }),

    create: activeOrgProcedure.input(createSchema).mutation(async ({ ctx, input }) => {
        await requireModulePermission(ctx, "audit_schedule", "canCreate");
        const orgId = ctx.organizationId as number;
        const result = await createAudit(orgId, input);
        void recordAuditEvent(ctx, {
            category: "data_write",
            action: "audit_schedule_created",
            entityType: "auditSchedules",
            entityId: result.id,
            payload: { title: input.title, orgId },
        });
        return result;
    }),

    patch: activeOrgProcedure.input(patchSchema).mutation(async ({ ctx, input }) => {
        await requireModulePermission(ctx, "audit_schedule", "canEdit");
        const { id, scope: scopeArr, scheduledDate: sdStr, ...rest } = input;
        const orgId = ctx.organizationId as number;
        const updates: Record<string, unknown> = { ...rest };
        if (scopeArr !== undefined) updates.scope = JSON.stringify(scopeArr);
        if (sdStr !== undefined) updates.scheduledDate = new Date(sdStr);
        await patchAudit(orgId, id, updates);
        void recordAuditEvent(ctx, {
            category: "data_write",
            action: "audit_schedule_updated",
            entityType: "auditSchedules",
            entityId: id,
            payload: { fields: Object.keys(updates) },
        });
        return { success: true };
    }),

    complete: activeOrgProcedure
        .input(z.object({
            id: z.number().int().positive(),
            findings: z.string().trim().max(4000).optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            await requireModulePermission(ctx, "audit_schedule", "canEdit");
            const orgId = ctx.organizationId as number;
            const result = await completeAudit(orgId, input.id, input.findings);
            if (!result.found) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Audit not found" });
            }
            void recordAuditEvent(ctx, {
                category: "data_write",
                action: "audit_schedule_completed",
                entityType: "auditSchedules",
                entityId: input.id,
                payload: { nextOccurrence: result.nextOccurrence },
            });
            return { nextOccurrence: result.nextOccurrence };
        }),

    remove: activeOrgProcedure
        .input(z.object({ id: z.number().int().positive() }))
        .mutation(async ({ ctx, input }) => {
            await requireModulePermission(ctx, "audit_schedule", "canDelete");
            const orgId = ctx.organizationId as number;
            await removeAudit(orgId, input.id);
            void recordAuditEvent(ctx, {
                category: "data_write",
                action: "audit_schedule_deleted",
                entityType: "auditSchedules",
                entityId: input.id,
                payload: { orgId },
            });
            return { success: true };
        }),
});
