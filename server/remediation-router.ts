/**
 * Remediation Router â€” Phase 29
 *
 * CRUD for compliance remediation tasks.  Each task can be linked to a vendor
 * gap finding and assigned to an org member.  Tasks flow through a 4-stage
 * Kanban: open â†’ in_progress â†’ resolved | accepted_risk.
 *
 * Procedures:
 *   remediation.list          â€“ get all tasks for the current org
 *   remediation.create        â€“ create a new task
 *   remediation.updateStatus  â€“ move a task to a new Kanban column
 *   remediation.patch         â€“ update editable fields
 *   remediation.remove        â€“ delete a task
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { activeOrgProcedure, router } from "./_core/trpc";
import { recordAuditEvent } from "./audit-logger";
import { listTasks, createTask, updateTaskStatus, patchTask, removeTask } from "./remediation-store";
import { requireModulePermission } from "./_core/permission-guard";

// â”€â”€â”€ Shared enums â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const statusEnum = z.enum(["open", "in_progress", "resolved", "accepted_risk"]);
const severityEnum = z.enum(["critical", "high", "medium", "low"]);

// â”€â”€â”€ Input schemas â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const createSchema = z.object({
    title: z.string().trim().min(2, "Title must be at least 2 characters").max(255),
    description: z.string().trim().max(2000).optional(),
    severity: severityEnum.default("medium"),
    status: statusEnum.default("open"),
    gapCode: z.string().trim().max(64).optional(),
    vendorId: z.number().int().positive().optional(),
    assignedToUserId: z.number().int().positive().optional(),
    dueDate: z.string().optional(),   // ISO-8601 date string
    notes: z.string().trim().max(2000).optional(),
});

const patchSchema = z.object({
    id: z.number().int().positive(),
    title: z.string().trim().min(2, "Title must be at least 2 characters").max(255).optional(),
    description: z.string().trim().max(2000).optional(),
    severity: severityEnum.optional(),
    status: statusEnum.optional(),
    assignedToUserId: z.number().int().positive().nullable().optional(),
    dueDate: z.string().nullable().optional(),
    notes: z.string().trim().max(2000).optional(),
});

// â”€â”€â”€ Router â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const remediationRouter = router({
    /**
     * List all remediation tasks for the current organisation, newest first.
     */
    list: activeOrgProcedure.query(async ({ ctx }) => {
        await requireModulePermission(ctx, "remediation_planner", "canView");
        return listTasks(ctx.organizationId as number);
    }),

    /**
     * Create a new remediation task (optionally pre-filled from a gap finding).
     */
    create: activeOrgProcedure.input(createSchema).mutation(async ({ ctx, input }) => {
        await requireModulePermission(ctx, "remediation_planner", "canCreate");
        const task = await createTask(ctx.organizationId as number, input);
        void recordAuditEvent(ctx, {
            category: "data_write",
            action: "remediation_task_created",
            entityType: "remediationTasks",
            entityId: task.id,
            payload: { title: input.title, severity: input.severity, gapCode: input.gapCode },
        });
        return task;
    }),

    /**
     * Move a task to a different Kanban column (status transition).
     */
    updateStatus: activeOrgProcedure
        .input(z.object({ id: z.number().int().positive(), status: statusEnum }))
        .mutation(async ({ ctx, input }) => {
            await requireModulePermission(ctx, "remediation_planner", "canEdit");
            const result = await updateTaskStatus(ctx.organizationId as number, input.id, input.status);
            if (!result) throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });
            return result;
        }),

    /**
     * Update editable fields of a task.
     */
    patch: activeOrgProcedure.input(patchSchema).mutation(async ({ ctx, input }) => {
        await requireModulePermission(ctx, "remediation_planner", "canEdit");
        const { id, dueDate: dueDateStr, ...rest } = input;
        const dueDate = dueDateStr === null ? null : dueDateStr ? new Date(dueDateStr) : undefined;
        const result = await patchTask(ctx.organizationId as number, id, rest, dueDate);
        if (!result) throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });
        void recordAuditEvent(ctx, {
            category: "data_write",
            action: "remediation_task_updated",
            entityType: "remediationTasks",
            entityId: id,
            payload: { fields: Object.keys(rest) },
        });
        return result;
    }),

    /**
     * Delete a remediation task by id.
     */
    remove: activeOrgProcedure
        .input(z.number().int().positive())
        .mutation(async ({ ctx, input: id }) => {
            await requireModulePermission(ctx, "remediation_planner", "canDelete");
            const deleted = await removeTask(ctx.organizationId as number, id);
            if (!deleted) throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });
            void recordAuditEvent(ctx, {
                category: "data_write",
                action: "remediation_task_deleted",
                entityType: "remediationTasks",
                entityId: id,
                payload: {},
            });
            return { id };
        }),
});
