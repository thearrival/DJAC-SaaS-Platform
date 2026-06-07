import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { ENV } from "../_core/env";
import { activeOrgProcedure, protectedProcedure, router } from "../_core/trpc";
import { requireModulePermission, requireModulePermissionIfOrgContext } from "../_core/permission-guard";
import { recordUserInteraction } from "../interaction-logger";
import { getVendorProfileById } from "../vendor-store";
import {
    clearAssessmentHistory,
    enqueueAssessmentJob,
    getAssessmentHistoryDiagnostics,
    getAssessmentJob,
    listAssessmentJobsForUser,
    waitForAssessmentJob,
} from "./orchestrator";

const submitAssessmentSchema = z.object({
    vendorId: z.number().int().positive(),
    rawDocumentText: z.string().max(100_000).optional().default(""),
    engine: z.enum(["native"]).optional(),
    waitForCompletion: z.boolean().optional().default(false),
    timeoutMs: z.number().int().min(1000).max(300000).optional(),
    persistResult: z.boolean().optional().default(true),
});

export const aiRouter = router({
    streamConfig: protectedProcedure.query(() => {
        return {
            websocketPath: ENV.aiWebsocketPath,
            queueMode: ENV.aiQueueMode,
            assessmentEngineDefault: ENV.aiAssessmentEngineDefault,
        } as const;
    }),

    submitAssessment: activeOrgProcedure
        .input(submitAssessmentSchema)
        .mutation(async ({ ctx, input }) => {
            await requireModulePermission(ctx, "vendor_assessment", "canCreate");
            const startedAt = Date.now();
            if (!ENV.aiOrchestratorEnabled) {
                throw new TRPCError({
                    code: "PRECONDITION_FAILED",
                    message: "AI orchestrator is disabled by configuration.",
                });
            }

            const vendor = await getVendorProfileById(input.vendorId, ctx.user.id, ctx.organizationId);
            if (!vendor) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Vendor not found.",
                });
            }

            const queued = await enqueueAssessmentJob({
                userId: ctx.user.id,
                source: input.rawDocumentText.trim().length > 0 ? "document_upload" : "vendor_profile",
                engine: input.engine ?? ENV.aiAssessmentEngineDefault,
                vendor,
                rawDocumentText: input.rawDocumentText,
                persistResult: input.persistResult,
            });

            void recordUserInteraction(ctx, {
                context: "ai.assessment",
                action: "assessment_submitted",
                entityType: "vendor",
                entityId: vendor.id,
                inputSnapshot: {
                    vendorId: vendor.id,
                    engine: input.engine ?? ENV.aiAssessmentEngineDefault,
                    waitForCompletion: input.waitForCompletion,
                    persistResult: input.persistResult,
                    source: input.rawDocumentText.trim().length > 0 ? "document_upload" : "vendor_profile",
                },
                outputRef: { jobId: queued.id, status: queued.status },
                durationMs: Date.now() - startedAt,
            });

            if (!input.waitForCompletion) {
                return {
                    jobId: queued.id,
                    status: queued.status,
                    stage: queued.stage,
                    queuedAt: queued.createdAt,
                } as const;
            }

            const timeoutMs = input.timeoutMs ?? ENV.aiJobTimeoutMs;
            const completed = await waitForAssessmentJob(queued.id, timeoutMs);

            if (!completed) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Queued job could not be loaded.",
                });
            }

            void recordUserInteraction(ctx, {
                context: "ai.assessment",
                action: completed.status === "completed" ? "assessment_completed" : "assessment_finished",
                entityType: "vendor",
                entityId: vendor.id,
                inputSnapshot: { vendorId: vendor.id, jobId: completed.id },
                outputRef: {
                    status: completed.status,
                    stage: completed.stage,
                    gapCount: completed.result?.assessment?.gaps?.length ?? null,
                },
                durationMs: Date.now() - startedAt,
            });

            return {
                jobId: completed.id,
                status: completed.status,
                stage: completed.stage,
                report: completed.result,
                error: completed.error,
                events: completed.events,
                persistence: completed.persistence,
            } as const;
        }),

    getAssessmentJob: protectedProcedure
        .input(z.object({ jobId: z.string().trim().min(1) }))
        .query(async ({ ctx, input }) => {
            await requireModulePermissionIfOrgContext(ctx, "vendor_assessment", "canView");
            const snapshot = await getAssessmentJob(input.jobId);
            if (!snapshot || snapshot.userId !== ctx.user.id) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Assessment job not found.",
                });
            }

            return snapshot;
        }),

    listAssessmentJobs: protectedProcedure
        .input(
            z
                .object({
                    limit: z.number().int().min(1).max(100).optional(),
                })
                .optional()
        )
        .query(async ({ ctx, input }) => {
            await requireModulePermissionIfOrgContext(ctx, "vendor_assessment", "canView");
            const limit = input?.limit ?? 20;
            return listAssessmentJobsForUser(ctx.user.id, limit);
        }),

    historyDiagnostics: protectedProcedure.query(async ({ ctx }) => {
        await requireModulePermissionIfOrgContext(ctx, "vendor_assessment", "canView");
        return getAssessmentHistoryDiagnostics(ctx.user.id);
    }),

    clearHistory: protectedProcedure.mutation(async ({ ctx }) => {
        await requireModulePermissionIfOrgContext(ctx, "vendor_assessment", "canDelete");
        return clearAssessmentHistory(ctx.user.id);
    }),

    latestCompletedAssessment: protectedProcedure
        .input(z.object({ vendorId: z.number().int().positive() }))
        .query(async ({ ctx, input }) => {
            await requireModulePermissionIfOrgContext(ctx, "vendor_assessment", "canView");
            const jobs = await listAssessmentJobsForUser(ctx.user.id, 100);
            const hit = jobs.find(
                job =>
                    job.status === "completed" &&
                    job.result?.inputSummary.vendorId === input.vendorId
            );

            if (!hit) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "No completed assessment report found for this vendor.",
                });
            }

            return {
                jobId: hit.id,
                report: hit.result,
                persisted: hit.persistence,
            } as const;
        }),

});
