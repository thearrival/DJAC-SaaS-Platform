/**
 * Evidence Router � refactored to use evidence-store.ts
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { activeOrgProcedure, router } from "./_core/trpc";
import { requireModulePermission } from "./_core/permission-guard";
import { recordAuditEvent } from "./audit-logger";
import {
    listEvidence,
    addEvidence,
    getEvidenceForRemoval,
    removeEvidence,
    SOURCE_TYPES,
} from "./evidence-store";

const SOURCE_TYPE_LABELS: Record<string, string> = {
    audit_schedule: "Audit Schedule",
    policy: "Policy",
    risk: "Risk Register",
    gap: "Assessment Gap",
    remediation: "Remediation Task",
    ctem_asset: "CTEM Asset",
    incident: "Compliance Incident",
    general: "General",
};

export const evidenceRouter = router({
    list: activeOrgProcedure
        .input(z.object({
            sourceType: z.string().optional(),
            sourceId: z.number().int().positive().optional(),
        }).optional())
        .query(async ({ ctx, input }) => {
            await requireModulePermission(ctx, "evidence_repository", "canView");
            return listEvidence(
                ctx.organizationId as number,
                input?.sourceType as (typeof SOURCE_TYPES)[number] | undefined,
                input?.sourceId,
            );
        }),

    add: activeOrgProcedure
        .input(z.object({
            title: z.string().trim().min(1).max(255),
            url: z.string().url().max(2000),
            sourceType: z.enum(SOURCE_TYPES),
            sourceId: z.number().int().positive().optional(),
            description: z.string().trim().max(2000).optional(),
            tags: z.string().trim().max(500).optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            await requireModulePermission(ctx, "evidence_repository", "canCreate");
            const orgId = ctx.organizationId as number;
            const localUserId = (ctx.user as { localUserId?: number })?.localUserId ?? null;
            const result = await addEvidence(orgId, input, localUserId);
            void recordAuditEvent(ctx, {
                category: "data_write",
                action: "evidence.add",
                entityType: "complianceEvidence",
                entityId: result.id,
                targetEntity: input.title,
                outcome: "success",
                payload: { sourceType: input.sourceType, sourceId: input.sourceId },
            });
            return result;
        }),

    remove: activeOrgProcedure
        .input(z.number().int().positive())
        .mutation(async ({ ctx, input: evidenceId }) => {
            await requireModulePermission(ctx, "evidence_repository", "canDelete");
            const orgId = ctx.organizationId as number;
            const ev = await getEvidenceForRemoval(orgId, evidenceId);
            if (!ev) throw new TRPCError({ code: "NOT_FOUND" });
            await removeEvidence(orgId, evidenceId);
            void recordAuditEvent(ctx, {
                category: "data_write",
                action: "evidence.remove",
                entityType: "complianceEvidence",
                entityId: evidenceId,
                outcome: "success",
            });
            return { success: true };
        }),

    listSourceTypes: activeOrgProcedure.query(async ({ ctx }) => {
        await requireModulePermission(ctx, "evidence_repository", "canView");
        return SOURCE_TYPES.map(t => ({ value: t, label: SOURCE_TYPE_LABELS[t] ?? t }));
    }),
});
