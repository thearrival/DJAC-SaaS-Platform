/**
 * Policy Router � refactored to use policy-store.ts
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { activeOrgProcedure, router } from "./_core/trpc";
import { requireModulePermission } from "./_core/permission-guard";
import { recordAuditEvent } from "./audit-logger";
import {
    listPolicies,
    createPolicy,
    patchPolicy,
    getPolicyStatus,
    applyPolicyStatusTransition,
    deletePolicy,
} from "./policy-store";

const STATUS_TRANSITIONS: Record<string, string[]> = {
    draft: ["under_review", "retired"],
    under_review: ["approved", "draft", "retired"],
    approved: ["active", "under_review", "retired"],
    active: ["under_review", "retired"],
    retired: [],
};

const policyTypeEnum = z.enum(["policy", "standard", "procedure", "guideline"]);
const statusEnum = z.enum(["draft", "under_review", "approved", "active", "retired"]);

const createSchema = z.object({
    policyCode: z.string().trim().max(50).optional(),
    title: z.string().trim().min(1).max(255),
    description: z.string().trim().max(5000).optional(),
    policyType: policyTypeEnum,
    frameworks: z.array(z.string()),
    controlReferences: z.array(z.string()),
    status: statusEnum,
    ownerId: z.number().int().positive().optional(),
    reviewCycleMonths: z.number().int().min(1).max(120),
    nextReviewAt: z.string().optional(),
    version: z.string().trim().max(20),
    documentUrl: z.string().url().optional().or(z.literal("")),
    notes: z.string().trim().max(5000).optional(),
});

export const policyRouter = router({
    list: activeOrgProcedure.query(async ({ ctx }) => {
        await requireModulePermission(ctx, "policy_manager", "canView");
        return listPolicies(ctx.organizationId as number);
    }),

    create: activeOrgProcedure.input(createSchema).mutation(async ({ ctx, input }) => {
        await requireModulePermission(ctx, "policy_manager", "canCreate");
        const orgId = ctx.organizationId as number;
        const result = await createPolicy(orgId, input);
        void recordAuditEvent(ctx, {
            category: "data_write",
            action: "policy.create",
            entityType: "compliancePolicies",
            entityId: result.id,
            targetEntity: input.title,
            outcome: "success",
        });
        return result;
    }),

    patch: activeOrgProcedure
        .input(z.object({ id: z.number().int().positive() }).merge(createSchema.partial()))
        .mutation(async ({ ctx, input }) => {
            await requireModulePermission(ctx, "policy_manager", "canEdit");
            const { id, ...data } = input;
            const orgId = ctx.organizationId as number;
            const result = await patchPolicy(orgId, id, data);
            if (!result) throw new TRPCError({ code: "NOT_FOUND" });
            void recordAuditEvent(ctx, {
                category: "data_write",
                action: "policy.patch",
                entityType: "compliancePolicies",
                entityId: id,
                outcome: "success",
            });
            return result;
        }),

    updateStatus: activeOrgProcedure
        .input(z.object({ id: z.number().int().positive(), status: statusEnum }))
        .mutation(async ({ ctx, input }) => {
            await requireModulePermission(ctx, "policy_manager", "canEdit");
            const orgId = ctx.organizationId as number;
            const currentStatus = await getPolicyStatus(orgId, input.id);
            if (currentStatus === null) throw new TRPCError({ code: "NOT_FOUND" });
            const allowed = STATUS_TRANSITIONS[currentStatus] ?? [];
            if (!allowed.includes(input.status)) {
                throw new TRPCError({ code: "BAD_REQUEST", message: `Cannot transition from '${currentStatus}' to '${input.status}'` });
            }
            const result = await applyPolicyStatusTransition(orgId, input.id, input.status);
            if (!result) throw new TRPCError({ code: "NOT_FOUND" });
            void recordAuditEvent(ctx, {
                category: "data_write",
                action: "policy.updateStatus",
                entityType: "compliancePolicies",
                entityId: input.id,
                outcome: "success",
                payload: { from: currentStatus, to: input.status },
            });
            return result;
        }),

    remove: activeOrgProcedure
        .input(z.number().int().positive())
        .mutation(async ({ ctx, input: id }) => {
            await requireModulePermission(ctx, "policy_manager", "canDelete");
            const orgId = ctx.organizationId as number;
            const found = await deletePolicy(orgId, id);
            if (!found) throw new TRPCError({ code: "NOT_FOUND" });
            void recordAuditEvent(ctx, {
                category: "data_write",
                action: "policy.remove",
                entityType: "compliancePolicies",
                entityId: id,
                outcome: "success",
            });
            return { success: true };
        }),
});
