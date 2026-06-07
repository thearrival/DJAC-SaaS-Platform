import { z } from "zod";
import {
    deleteInteractionLogsBySubject,
    enforceInteractionRetention,
    getInteractionPrivacyStats,
    getAdminOverview,
    getAdminInteractionHeatmap,
    listAccessRequests,
    listActivityFeed,
    listAdminNotifications,
    listAdminVendorSummaries,
    listAssessmentSummaries,
    listConsultationSummaries,
    markAdminNotificationRead,
    respondToConsultationRequest,
    updateAccessRequestStatus,
    updateUserAccess,
    recordActivity,
} from "./control-center-store";
import { listUsersForAdmin } from "./db";
import { adminProcedure, router } from "./_core/trpc";
import { getConversionStats } from "./admin-store";
import fs from "fs";
import path from "path";

const limitSchema = z.object({
    limit: z.number().int().min(1).max(200).optional(),
});

export const adminRouter = router({
    overview: adminProcedure.query(() => {
        return getAdminOverview();
    }),

    interactionHeatmap: adminProcedure
        .input(
            z
                .object({
                    windowDays: z.number().int().min(1).max(90).optional(),
                    limit: z.number().int().min(100).max(5000).optional(),
                })
                .optional()
        )
        .query(({ input }) => {
            return getAdminInteractionHeatmap(input?.windowDays ?? 14, input?.limit ?? 2000);
        }),

    interactionPrivacyStats: adminProcedure
        .input(
            z
                .object({
                    retentionDays: z.number().int().min(7).max(365).optional(),
                })
                .optional()
        )
        .query(({ input }) => {
            return getInteractionPrivacyStats(input?.retentionDays ?? 90);
        }),

    enforceInteractionRetention: adminProcedure
        .input(
            z.object({
                retentionDays: z.number().int().min(7).max(365).default(90),
                dryRun: z.boolean().default(true),
            })
        )
        .mutation(({ ctx, input }) => {
            return enforceInteractionRetention(input.retentionDays, input.dryRun, ctx.user.id);
        }),

    deleteInteractionData: adminProcedure
        .input(
            z.object({
                userId: z.number().int().positive().optional(),
                organizationId: z.number().int().positive().optional(),
            }).refine(value => Boolean(value.userId || value.organizationId), {
                message: "Provide userId or organizationId for deletion.",
            })
        )
        .mutation(({ ctx, input }) => {
            return deleteInteractionLogsBySubject({
                userId: input.userId,
                organizationId: input.organizationId,
                actorUserId: ctx.user.id,
            });
        }),

    users: adminProcedure.input(limitSchema.optional()).query(({ input }) => {
        return listUsersForAdmin(input?.limit ?? 100);
    }),

    accessRequests: adminProcedure.input(limitSchema.optional()).query(({ input }) => {
        return listAccessRequests(input?.limit ?? 100);
    }),

    consultations: adminProcedure.input(limitSchema.optional()).query(({ input }) => {
        return listConsultationSummaries(input?.limit ?? 100);
    }),

    notifications: adminProcedure.input(limitSchema.optional()).query(({ input }) => {
        return listAdminNotifications(input?.limit ?? 50);
    }),

    vendors: adminProcedure.input(limitSchema.optional()).query(({ input }) => {
        return listAdminVendorSummaries(input?.limit ?? 100);
    }),

    assessments: adminProcedure.input(limitSchema.optional()).query(({ input }) => {
        return listAssessmentSummaries(input?.limit ?? 100);
    }),

    activity: adminProcedure.input(limitSchema.optional()).query(({ input }) => {
        return listActivityFeed(input?.limit ?? 100);
    }),

    markNotificationRead: adminProcedure
        .input(z.object({ notificationId: z.number().int().positive() }))
        .mutation(({ input }) => {
            return markAdminNotificationRead(input.notificationId);
        }),

    updateAccessRequestStatus: adminProcedure
        .input(
            z.object({
                accessRequestId: z.number().int().positive(),
                status: z.enum(["new", "reviewing", "approved", "archived"]),
            })
        )
        .mutation(({ ctx, input }) => {
            return updateAccessRequestStatus({
                accessRequestId: input.accessRequestId,
                status: input.status,
                adminUserId: ctx.user.id,
            });
        }),

    respondConsultation: adminProcedure
        .input(
            z.object({
                consultationId: z.number().int().positive(),
                status: z.enum(["in_review", "responded", "closed"]),
                priority: z.enum(["low", "medium", "high"]).optional(),
                adminResponse: z.string().trim().min(10).max(5000),
            })
        )
        .mutation(({ ctx, input }) => {
            return respondToConsultationRequest({
                consultationId: input.consultationId,
                status: input.status,
                priority: input.priority,
                adminResponse: input.adminResponse,
                adminUserId: ctx.user.id,
            });
        }),

    updateUserAccess: adminProcedure
        .input(
            z.object({
                userId: z.number().int().positive(),
                role: z.enum(["user", "admin"]).optional(),
                status: z.enum(["active", "invited", "suspended"]).optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const updated = await updateUserAccess(input);

            if (updated) {
                await recordActivity({
                    userId: ctx.user.id,
                    actorType: "admin",
                    action: "user_access_updated",
                    entityType: "user",
                    entityId: updated.id,
                    metadata: {
                        role: updated.role,
                        status: updated.status,
                    },
                });
            }

            return updated;
        }),

    /**
     * Read the audit event log file (admin-only).
     * Returns the latest `limit` NDJSON entries parsed into objects,
     * newest-first. Gracefully returns [] if the file doesn't exist yet.
     */
    auditLog: adminProcedure
        .input(
            z.object({
                limit: z.number().int().min(1).max(500).default(100),
                action: z.string().optional(),
                userId: z.number().int().positive().optional(),
            }).optional()
        )
        .query(async ({ input }) => {
            const limit = input?.limit ?? 100;
            const filterAction = input?.action;
            const filterUserId = input?.userId;

            const auditFile = path.resolve(
                import.meta.dirname,
                "../..",
                "audit",
                "assessment-events.log",
            );

            try {
                const raw = await fs.promises.readFile(auditFile, "utf8");
                const lines = raw.split("\n").filter(l => l.trim().length > 0);

                const events: Array<{
                    eventId: string;
                    timestamp: string;
                    userId: number;
                    action: string;
                    targetId: number;
                    payloadHash: string;
                    payload: Record<string, unknown>;
                }> = [];

                for (const line of lines) {
                    try {
                        events.push(JSON.parse(line));
                    } catch {
                        // skip malformed lines
                    }
                }

                // Filter
                let filtered = events;
                if (filterAction) {
                    filtered = filtered.filter(e => e.action === filterAction);
                }
                if (filterUserId) {
                    filtered = filtered.filter(e => e.userId === filterUserId);
                }

                // Newest-first, capped at limit
                return filtered.reverse().slice(0, limit);
            } catch (err: unknown) {
                // File not found or unreadable — return empty
                if ((err as NodeJS.ErrnoException).code === "ENOENT") {
                    return [];
                }
                console.error("[admin.auditLog] Unreadable audit file");
                return [];
            }
        }),

    conversionStats: adminProcedure.query(() => getConversionStats()),
});
