/**
 * Asset Inventory Router � refactored to use asset-inventory-store.ts
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { activeOrgProcedure, router } from "./_core/trpc";
import { recordAuditEvent } from "./audit-logger";
import { requireModulePermission } from "./_core/permission-guard";
import {
    listAssets,
    getAsset,
    createAsset,
    getAssetForPatch,
    patchAssetRow,
    deleteAsset,
    getAllOrgAssets,
    ASSET_TYPES,
    CRITICALITY_LEVELS,
    EXPOSURE_LEVELS,
    ASSET_STATUSES,
    calcRiskScore,
} from "./asset-inventory-store";

const assetTypeEnum = z.enum(ASSET_TYPES);
const criticalityEnum = z.enum(CRITICALITY_LEVELS);
const exposureEnum = z.enum(EXPOSURE_LEVELS);
const statusEnum = z.enum(ASSET_STATUSES);

const createSchema = z.object({
    name: z.string().trim().min(1).max(255),
    assetType: assetTypeEnum,
    criticality: criticalityEnum,
    exposure: exposureEnum,
    status: statusEnum,
    identifier: z.string().trim().max(255).optional(),
    owner: z.string().trim().max(255).optional(),
    location: z.string().trim().max(255).optional(),
    platform: z.string().trim().max(255).optional(),
    version: z.string().trim().max(100).optional(),
    tags: z.string().trim().max(500).optional(),
    notes: z.string().trim().max(2000).optional(),
});

const patchSchema = createSchema.partial().extend({
    openVulnCount: z.number().int().min(0).optional(),
});

export const assetInventoryRouter = router({
    list: activeOrgProcedure.query(async ({ ctx }) => {
        await requireModulePermission(ctx, "asset_inventory", "canView");
        return listAssets(ctx.organizationId as number);
    }),

    get: activeOrgProcedure
        .input(z.object({ id: z.number().int().positive() }))
        .query(async ({ ctx, input }) => {
            await requireModulePermission(ctx, "asset_inventory", "canView");
            const asset = await getAsset(ctx.organizationId as number, input.id);
            if (!asset) throw new TRPCError({ code: "NOT_FOUND" });
            return asset;
        }),

    create: activeOrgProcedure.input(createSchema).mutation(async ({ ctx, input }) => {
        await requireModulePermission(ctx, "asset_inventory", "canCreate");
        const orgId = ctx.organizationId as number;
        const localUserId = (ctx.user as { localUserId?: number })?.localUserId ?? null;
        const result = await createAsset(orgId, input, localUserId);
        void recordAuditEvent(ctx, {
            category: "data_write",
            action: "asset.create",
            entityType: "assetInventory",
            entityId: result.id,
            targetEntity: input.name,
            outcome: "success",
        });
        return result;
    }),

    patch: activeOrgProcedure
        .input(z.object({ id: z.number().int().positive() }).merge(patchSchema))
        .mutation(async ({ ctx, input }) => {
            await requireModulePermission(ctx, "asset_inventory", "canEdit");
            const { id, ...data } = input;
            const orgId = ctx.organizationId as number;
            const existing = await getAssetForPatch(orgId, id);
            if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

            const updateValues: Record<string, unknown> = { ...data, updatedAt: new Date() };
            if ("criticality" in data || "exposure" in data || "openVulnCount" in data) {
                const crit = (data.criticality ?? existing.criticality) as string;
                const exp = (data.exposure ?? existing.exposure) as string;
                const vulns = data.openVulnCount !== undefined ? data.openVulnCount : (existing.openVulnCount ?? 0);
                updateValues.riskScore = calcRiskScore(crit, exp, vulns);
            }

            const updated = await patchAssetRow(orgId, id, updateValues);
            void recordAuditEvent(ctx, {
                category: "data_write",
                action: "asset.patch",
                entityType: "assetInventory",
                entityId: id,
                outcome: "success",
            });
            return updated;
        }),

    remove: activeOrgProcedure
        .input(z.object({ id: z.number().int().positive() }))
        .mutation(async ({ ctx, input }) => {
            await requireModulePermission(ctx, "asset_inventory", "canDelete");
            const orgId = ctx.organizationId as number;
            const result = await deleteAsset(orgId, input.id);
            if (!result.found) throw new TRPCError({ code: "NOT_FOUND" });
            void recordAuditEvent(ctx, {
                category: "data_write",
                action: "asset.remove",
                entityType: "assetInventory",
                entityId: input.id,
                targetEntity: result.name ?? undefined,
                outcome: "success",
            });
            return { success: true };
        }),

    summary: activeOrgProcedure.query(async ({ ctx }) => {
        await requireModulePermission(ctx, "asset_inventory", "canView");
        const assets = await getAllOrgAssets(ctx.organizationId as number);
        let totalVulns = 0;
        let criticalAssets = 0;
        let internetFacingCount = 0;
        let totalRisk = 0;

        for (const a of assets) {
            totalVulns += a.openVulnCount ?? 0;
            totalRisk += a.riskScore ?? 0;
            if (a.criticality === "critical") criticalAssets++;
            if (a.exposure === "internet_facing") internetFacingCount++;
        }

        const avgRisk = assets.length > 0 ? Math.round(totalRisk / assets.length) : 0;

        return {
            total: assets.length,
            criticalCount: criticalAssets,
            criticalAssets,
            internetFacingCount,
            avgRisk,
            totalOpenVulnerabilities: totalVulns,
        };
    }),
});
