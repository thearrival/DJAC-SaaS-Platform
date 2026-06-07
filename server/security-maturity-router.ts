/**
 * Security Maturity Router � refactored to use security-maturity-store.ts
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { activeOrgProcedure, router } from "./_core/trpc";
import { requireModulePermission } from "./_core/permission-guard";
import { recordAuditEvent } from "./audit-logger";
import {
    listAssessments,
    getLatestAssessment,
    getAssessment,
    createAssessmentRow,
    deleteAssessmentRow,
} from "./security-maturity-store";

const domainScore = z.number().int().min(1).max(5);

const createSchema = z.object({
    title: z.string().trim().min(3).max(255),
    frameworkRef: z.enum(["ISO 27001", "NIST CSF", "CIS Controls", "SOC 2", "SAMA CSF", "NCA ECC", "NESA", "custom"]).optional(),
    scoreGovernance: domainScore,
    scoreAssetManagement: domainScore,
    scoreAccessControl: domainScore,
    scoreDataProtection: domainScore,
    scoreNetworkSecurity: domainScore,
    scoreVulnerabilityMgmt: domainScore,
    scoreIncidentResponse: domainScore,
    scoreBackupRecovery: domainScore,
    scoreThirdPartyRisk: domainScore,
    scoreSecurityAwareness: domainScore,
    recommendations: z.string().trim().max(5000).optional(),
});

export const securityMaturityRouter = router({
    list: activeOrgProcedure.query(async ({ ctx }) => {
        await requireModulePermission(ctx, "security_maturity", "canView");
        return listAssessments(ctx.organizationId as number);
    }),

    latest: activeOrgProcedure.query(async ({ ctx }) => {
        await requireModulePermission(ctx, "security_maturity", "canView");
        return getLatestAssessment(ctx.organizationId as number);
    }),

    get: activeOrgProcedure
        .input(z.object({ id: z.number().int().positive() }))
        .query(async ({ ctx, input }) => {
            await requireModulePermission(ctx, "security_maturity", "canView");
            const a = await getAssessment(ctx.organizationId as number, input.id);
            if (!a) throw new TRPCError({ code: "NOT_FOUND" });
            return a;
        }),

    create: activeOrgProcedure.input(createSchema).mutation(async ({ ctx, input }) => {
        await requireModulePermission(ctx, "security_maturity", "canCreate");
        const orgId = ctx.organizationId as number;
        const localUserId = (ctx.user as { localUserId?: number })?.localUserId ?? null;
        const result = await createAssessmentRow(orgId, input, localUserId);
        await recordAuditEvent(ctx, {
            category: "data_write",
            action: "security_maturity.create",
            entityType: "securityMaturityAssessments",
            entityId: result.id,
            targetEntity: input.title,
            outcome: "success",
            payload: { overallScore: result.overallScore, maturityLevel: result.maturityLevel },
        });
        return result;
    }),

    delete: activeOrgProcedure
        .input(z.object({ id: z.number().int().positive() }))
        .mutation(async ({ ctx, input }) => {
            await requireModulePermission(ctx, "security_maturity", "canDelete");
            const found = await deleteAssessmentRow(ctx.organizationId as number, input.id);
            if (!found) throw new TRPCError({ code: "NOT_FOUND" });
            await recordAuditEvent(ctx, {
                category: "data_write",
                action: "security_maturity.delete",
                entityType: "securityMaturityAssessments",
                entityId: input.id,
                outcome: "success",
            });
            return { success: true };
        }),
});
