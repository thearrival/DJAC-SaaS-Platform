/**
 * Threat Intel Router � refactored to use threat-intel-store.ts
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { activeOrgProcedure, protectedProcedure, router } from "./_core/trpc";
import { requireModulePermission, requireModulePermissionIfOrgContext } from "./_core/permission-guard";
import { recordAuditEvent } from "./audit-logger";
import { hasMinRole } from "../shared/const";
import {
    getThreatFeed,
    getThreatItem,
    adminCreateThreatItem,
    adminUpdateThreatItem,
    adminRemoveThreatItem,
    CATEGORIES,
    SEVERITIES,
    TLP_LEVELS,
} from "./threat-intel-store";

const categoryEnum = z.enum(CATEGORIES);
const severityEnum = z.enum(SEVERITIES);
const tlpEnum = z.enum(TLP_LEVELS);

const createSchema = z.object({
    title: z.string().trim().min(3).max(255),
    summary: z.string().trim().min(10).max(10000),
    category: categoryEnum,
    severity: severityEnum,
    tlp: tlpEnum,
    organizationId: z.number().int().positive().nullable().optional(),
    threatActor: z.string().trim().max(255).optional(),
    affectedSectors: z.string().trim().max(1000).optional(),
    indicators: z.string().trim().max(5000).optional(),
    referenceUrl: z.string().url().optional().or(z.literal("")),
    cveId: z.string().trim().max(50).optional(),
    cvssScore: z.string().trim().max(10).optional(),
    publishedAt: z.string().optional(),
});

const updateSchema = createSchema.partial().extend({
    isActive: z.number().int().min(0).max(1).optional(),
});

export const threatIntelRouter = router({
    feed: activeOrgProcedure
        .input(z.object({
            severity: severityEnum.optional(),
            category: categoryEnum.optional(),
            limit: z.number().int().min(1).max(100).default(50),
        }))
        .query(async ({ ctx, input }) => {
            await requireModulePermission(ctx, "pro_intelligence", "canView");
            return getThreatFeed(ctx.organizationId as number, {
                severity: input.severity,
                category: input.category,
                limit: input.limit,
            });
        }),

    get: activeOrgProcedure
        .input(z.object({ id: z.number().int().positive() }))
        .query(async ({ ctx, input }) => {
            await requireModulePermission(ctx, "pro_intelligence", "canView");
            const item = await getThreatItem(ctx.organizationId as number, input.id);
            if (!item) throw new TRPCError({ code: "NOT_FOUND" });
            return item;
        }),

    adminCreate: protectedProcedure.input(createSchema).mutation(async ({ ctx, input }) => {
        if (!hasMinRole(ctx.user?.role, "admin")) throw new TRPCError({ code: "FORBIDDEN" });
        await requireModulePermissionIfOrgContext(ctx, "pro_intelligence", "canCreate");
        const localUserId = (ctx.user as { localUserId?: number })?.localUserId ?? null;
        const item = await adminCreateThreatItem(input, localUserId);
        void recordAuditEvent(ctx, {
            category: "data_write",
            action: "threatIntel.adminCreate",
            entityType: "threatIntelItems",
            entityId: item.id,
            targetEntity: input.title,
            outcome: "success",
        });
        return item;
    }),

    adminUpdate: protectedProcedure
        .input(z.object({ id: z.number().int().positive() }).merge(updateSchema))
        .mutation(async ({ ctx, input }) => {
            if (!hasMinRole(ctx.user?.role, "admin")) throw new TRPCError({ code: "FORBIDDEN" });
            await requireModulePermissionIfOrgContext(ctx, "pro_intelligence", "canEdit");
            const { id, ...data } = input;
            const updateValues: Record<string, unknown> = { ...data, updatedAt: new Date() };
            const updated = await adminUpdateThreatItem(id, updateValues);
            if (!updated) throw new TRPCError({ code: "NOT_FOUND" });
            void recordAuditEvent(ctx, {
                category: "data_write",
                action: "threatIntel.adminUpdate",
                entityType: "threatIntelItems",
                entityId: id,
                outcome: "success",
                payload: data,
            });
            return updated;
        }),

    adminRemove: protectedProcedure
        .input(z.object({ id: z.number().int().positive() }))
        .mutation(async ({ ctx, input }) => {
            if (!hasMinRole(ctx.user?.role, "admin")) throw new TRPCError({ code: "FORBIDDEN" });
            await requireModulePermissionIfOrgContext(ctx, "pro_intelligence", "canDelete");
            const found = await adminRemoveThreatItem(input.id);
            if (!found) throw new TRPCError({ code: "NOT_FOUND" });
            void recordAuditEvent(ctx, {
                category: "data_write",
                action: "threatIntel.adminRemove",
                entityType: "threatIntelItems",
                entityId: input.id,
                outcome: "success",
            });
            return { success: true };
        }),
});
