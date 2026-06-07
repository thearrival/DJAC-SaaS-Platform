/**
 * Risk Register Router — Phase 30
 *
 * CRUD for the organisation's formal risk register.  Each entry captures a
 * named risk scored on a 5×5 likelihood × impact matrix, with treatment
 * decision tracking and optional linkage to a vendor or gap finding.
 *
 * Procedures:
 *   riskRegister.list    – get all risks for the current org (newest first)
 *   riskRegister.create  – add a new risk entry
 *   riskRegister.patch   – partial update of any editable fields
 *   riskRegister.remove  – delete a risk entry
 *
 * Risk score formula: likelihood (1-5) × impact (1-5)
 *   1-4   = Low | 5-9 = Medium | 10-14 = High | 15-25 = Critical
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { activeOrgProcedure, router } from "./_core/trpc";
import { recordAuditEvent } from "./audit-logger";
import { requireModulePermission } from "./_core/permission-guard";
import { listRisks, createRisk, patchRisk, removeRisk } from "./risk-register-store";

// ─── Shared enums ─────────────────────────────────────────────────────────────

const categoryEnum = z.enum(["operational", "legal", "technical", "financial", "reputational"]);
const treatmentEnum = z.enum(["accept", "mitigate", "transfer", "avoid"]);
const statusEnum = z.enum(["open", "in_treatment", "closed", "accepted"]);

// ─── Input schemas ────────────────────────────────────────────────────────────

const createSchema = z.object({
    title: z.string().trim().min(2, "Title must be at least 2 characters").max(255),
    description: z.string().trim().max(2000).optional(),
    category: categoryEnum.default("operational"),
    likelihood: z.number().int().min(1).max(5).default(3),
    impact: z.number().int().min(1).max(5).default(3),
    treatment: treatmentEnum.default("mitigate"),
    status: statusEnum.default("open"),
    ownerId: z.number().int().positive().optional(),
    vendorId: z.number().int().positive().optional(),
    gapCode: z.string().trim().max(64).optional(),
    controlReference: z.string().trim().max(128).optional(),
    reviewDate: z.string().optional(),   // ISO-8601
    notes: z.string().trim().max(2000).optional(),
});

const patchSchema = createSchema.partial().extend({
    id: z.number().int().positive(),
    reviewDate: z.string().nullable().optional(),
    ownerId: z.number().int().positive().nullable().optional(),
    vendorId: z.number().int().positive().nullable().optional(),
});

// ─── Router ───────────────────────────────────────────────────────────────────

export const riskRegisterRouter = router({
    /**
     * List all risk entries for the current organisation, newest first.
     */
    list: activeOrgProcedure.query(async ({ ctx }) => {
        await requireModulePermission(ctx, "risk_register", "canView");
        return listRisks(ctx.organizationId as number);
    }),

    /**
     * Create a new risk entry.
     */
    create: activeOrgProcedure.input(createSchema).mutation(async ({ ctx, input }) => {
        await requireModulePermission(ctx, "risk_register", "canCreate");
        const orgId = ctx.organizationId as number;
        const risk = await createRisk(orgId, input);
        void recordAuditEvent(ctx, {
            category: "data_write",
            action: "risk_entry_created",
            entityType: "riskRegister",
            entityId: risk.id,
            payload: { title: input.title, category: input.category, likelihood: input.likelihood, impact: input.impact },
        });
        return risk;
    }),

    /**
     * Partial update of any editable fields.
     */
    patch: activeOrgProcedure.input(patchSchema).mutation(async ({ ctx, input }) => {
        await requireModulePermission(ctx, "risk_register", "canEdit");
        const orgId = ctx.organizationId as number;
        const { id, reviewDate: reviewDateStr, ...rest } = input;
        const reviewDate = reviewDateStr === null
            ? null
            : reviewDateStr
                ? new Date(reviewDateStr)
                : undefined;
        const result = await patchRisk(orgId, id, rest, reviewDate);
        if (!result) throw new TRPCError({ code: "NOT_FOUND", message: "Risk not found" });
        void recordAuditEvent(ctx, {
            category: "data_write",
            action: "risk_entry_updated",
            entityType: "riskRegister",
            entityId: id,
            payload: { fields: Object.keys(rest) },
        });
        return result;
    }),

    /**
     * Delete a risk entry (org-scoped ownership check).
     */
    remove: activeOrgProcedure
        .input(z.number().int().positive())
        .mutation(async ({ ctx, input: id }) => {
            await requireModulePermission(ctx, "risk_register", "canDelete");
            const orgId = ctx.organizationId as number;
            const deleted = await removeRisk(orgId, id);
            if (!deleted) throw new TRPCError({ code: "NOT_FOUND", message: "Risk not found" });
            void recordAuditEvent(ctx, {
                category: "data_write",
                action: "risk_entry_deleted",
                entityType: "riskRegister",
                entityId: id,
                payload: {},
            });
            return { deleted: id };
        }),
});
