/**
 * ctem-router.ts — tRPC procedures for the Continuous Compliance & CTEM module.
 *
 * Procedures:
 *   ctem.listAssets             – get all assets for the current org
 *   ctem.createAsset            – register a new asset
 *   ctem.updateAsset            – patch an existing asset
 *   ctem.deleteAsset            – remove an asset
 *   ctem.listVulnerabilities    – get vulns (with optional assetId filter)
 *   ctem.createVulnerability    – add a vulnerability to an asset
 *   ctem.patchVulnerability     – update isPatched / notes
 *   ctem.listRiskScores         – get computed risk scores (with asset info)
 *   ctem.getRiskSummary         – org-level CTEM summary for dashboard widgets
 *   ctem.triggerRun             – trigger a manual continuous compliance scan
 *   ctem.listRuns               – run history
 *   ctem.getFrameworkExposure   – per-framework exposure summary
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { activeOrgProcedure, router } from "./_core/trpc";
import { requireModulePermission } from "./_core/permission-guard";
import { executeContinuousComplianceRun } from "./ctem-scoring";
import {
    listCtemAssets,
    createCtemAsset,
    getCtemAssetOrgId,
    updateCtemAsset,
    deleteCtemAsset,
    listCtemVulnerabilities,
    getCtemVulnAssetOwner,
    createCtemVulnerability,
    patchCtemVulnerability,
    listCtemRiskScores,
    getCtemRiskSummary,
    listCtemRuns,
    getCtemFrameworkExposure,
    listVendorsForCtemAssets,
} from "./ctem-store";

const assetTypeEnum = z.enum([
    "web_application", "api_endpoint", "database", "cloud_service",
    "network_device", "iot_device", "data_pipeline", "identity_provider",
    "storage_bucket", "other",
]);
const regionEnum = z.enum(["China", "Saudi Arabia", "Cross-border", "Other"]);
const severityEnum = z.enum(["critical", "high", "medium", "low", "informational"]);

const assetInputSchema = z.object({
    vendorId: z.number().int().positive().optional().nullable(),
    assetName: z.string().trim().min(1).max(255),
    assetType: assetTypeEnum.default("other"),
    ipDomain: z.string().trim().max(255).optional().nullable(),
    region: regionEnum.default("Other"),
    isInternetFacing: z.boolean().default(false),
    handlesPersonalData: z.boolean().default(false),
    handlesCriticalData: z.boolean().default(false),
    criticalityScore: z.number().int().min(1).max(10).default(5),
    status: z.enum(["active", "inactive", "decommissioned"]).default("active"),
    notes: z.string().trim().max(2000).optional().nullable(),
});

const vulnInputSchema = z.object({
    assetId: z.number().int().positive(),
    cveId: z.string().trim().max(64).optional().nullable(),
    title: z.string().trim().min(1).max(255),
    description: z.string().trim().max(3000).optional().nullable(),
    severity: severityEnum.default("medium"),
    cvssScore: z.number().int().min(0).max(100).default(0),
    exploitAvailable: z.boolean().default(false),
    isConfirmed: z.boolean().default(false),
    notes: z.string().trim().max(2000).optional().nullable(),
});

export const ctemRouter = router({

    listAssets: activeOrgProcedure
        .input(z.object({
            region: regionEnum.optional(),
            vendorId: z.number().int().positive().optional(),
            status: z.enum(["active", "inactive", "decommissioned"]).optional(),
        }).optional())
        .query(async ({ ctx, input }) => {
            await requireModulePermission(ctx, "compliance_tracker", "canView");
            return listCtemAssets(ctx.organizationId ?? -1, input);
        }),

    createAsset: activeOrgProcedure
        .input(assetInputSchema)
        .mutation(async ({ ctx, input }) => {
            await requireModulePermission(ctx, "compliance_tracker", "canCreate");
            try {
                return await createCtemAsset(ctx.organizationId ?? -1, input);
            } catch {
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
            }
        }),

    updateAsset: activeOrgProcedure
        .input(assetInputSchema.partial().extend({ id: z.number().int().positive() }))
        .mutation(async ({ ctx, input }) => {
            await requireModulePermission(ctx, "compliance_tracker", "canEdit");
            const orgId = ctx.organizationId ?? -1;
            const { id, ...patch } = input;
            const ownerOrgId = await getCtemAssetOrgId(id);
            if (ownerOrgId === null || ownerOrgId !== orgId)
                throw new TRPCError({ code: "NOT_FOUND", message: "Asset not found" });
            try {
                return await updateCtemAsset(id, patch);
            } catch {
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
            }
        }),

    deleteAsset: activeOrgProcedure
        .input(z.object({ id: z.number().int().positive() }))
        .mutation(async ({ ctx, input }) => {
            await requireModulePermission(ctx, "compliance_tracker", "canDelete");
            const orgId = ctx.organizationId ?? -1;
            const ownerOrgId = await getCtemAssetOrgId(input.id);
            if (ownerOrgId === null || ownerOrgId !== orgId)
                throw new TRPCError({ code: "NOT_FOUND", message: "Asset not found" });
            await deleteCtemAsset(input.id);
            return { ok: true };
        }),

    listVulnerabilities: activeOrgProcedure
        .input(z.object({
            assetId: z.number().int().positive().optional(),
            exploitableOnly: z.boolean().optional(),
            severity: severityEnum.optional(),
            includeMappings: z.boolean().optional(),
        }).optional())
        .query(async ({ ctx, input }) => {
            await requireModulePermission(ctx, "compliance_tracker", "canView");
            const orgId = ctx.organizationId ?? -1;
            if (input?.assetId) {
                const ownerOrgId = await getCtemAssetOrgId(input.assetId);
                if (ownerOrgId === null || ownerOrgId !== orgId)
                    throw new TRPCError({ code: "NOT_FOUND", message: "Asset not found" });
            }
            return listCtemVulnerabilities(orgId, input);
        }),

    createVulnerability: activeOrgProcedure
        .input(vulnInputSchema)
        .mutation(async ({ ctx, input }) => {
            await requireModulePermission(ctx, "compliance_tracker", "canCreate");
            const orgId = ctx.organizationId ?? -1;
            const assetOrgId = await getCtemAssetOrgId(input.assetId);
            if (assetOrgId === null || assetOrgId !== orgId)
                throw new TRPCError({ code: "NOT_FOUND", message: "Asset not found" });
            try {
                return await createCtemVulnerability(input);
            } catch {
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
            }
        }),

    patchVulnerability: activeOrgProcedure
        .input(z.object({
            id: z.number().int().positive(),
            isPatched: z.boolean().optional(),
            isConfirmed: z.boolean().optional(),
            exploitAvailable: z.boolean().optional(),
            severity: severityEnum.optional(),
            notes: z.string().trim().max(2000).optional().nullable(),
        }))
        .mutation(async ({ ctx, input }) => {
            await requireModulePermission(ctx, "compliance_tracker", "canEdit");
            const orgId = ctx.organizationId ?? -1;
            const { id, ...patch } = input;
            const vuln = await getCtemVulnAssetOwner(id);
            if (!vuln) throw new TRPCError({ code: "NOT_FOUND", message: "Vulnerability not found" });
            const assetOrgId = await getCtemAssetOrgId(vuln.assetId);
            if (assetOrgId === null || assetOrgId !== orgId)
                throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
            try {
                return await patchCtemVulnerability(id, patch);
            } catch {
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
            }
        }),

    listRiskScores: activeOrgProcedure
        .input(z.object({
            tier: z.enum(["critical", "high", "medium", "low"]).optional(),
            region: regionEnum.optional(),
            vendorId: z.number().int().positive().optional(),
        }).optional())
        .query(async ({ ctx, input }) => {
            await requireModulePermission(ctx, "compliance_tracker", "canView");
            return listCtemRiskScores(ctx.organizationId ?? -1, input);
        }),

    getRiskSummary: activeOrgProcedure.query(async ({ ctx }) => {
        await requireModulePermission(ctx, "compliance_tracker", "canView");
        return getCtemRiskSummary(ctx.organizationId ?? -1);
    }),

    listRuns: activeOrgProcedure
        .input(z.object({ limit: z.number().int().min(1).max(100).default(20) }).optional())
        .query(async ({ ctx, input }) => {
            await requireModulePermission(ctx, "compliance_tracker", "canView");
            return listCtemRuns(ctx.organizationId ?? -1, input?.limit);
        }),

    triggerRun: activeOrgProcedure
        .input(z.object({ vendorId: z.number().int().positive().optional() }).optional())
        .mutation(async ({ ctx, input }) => {
            await requireModulePermission(ctx, "compliance_tracker", "canEdit");
            return executeContinuousComplianceRun({
                organizationId: ctx.organizationId ?? -1,
                vendorId: input?.vendorId,
                triggeredBy: "manual",
            });
        }),

    getFrameworkExposure: activeOrgProcedure.query(async ({ ctx }) => {
        await requireModulePermission(ctx, "compliance_tracker", "canView");
        return getCtemFrameworkExposure(ctx.organizationId ?? -1);
    }),

    listVendorsForAssets: activeOrgProcedure.query(async ({ ctx }) => {
        await requireModulePermission(ctx, "compliance_tracker", "canView");
        return listVendorsForCtemAssets(ctx.organizationId ?? -1);
    }),
});
