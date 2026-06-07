import { z } from "zod";
import {
    createAccessRequest,
    createConsultationRequest,
} from "./control-center-store";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { requireModulePermissionIfOrgContext } from "./_core/permission-guard";
import { recordUserInteraction } from "./interaction-logger";
import { broadcastSSE } from "./services/sse-bus";

const accessRequestSchema = z.object({
    fullName: z.string().trim().min(2, "Full name must be at least 2 characters").max(255),
    email: z.string().trim().email().max(320),
    organizationName: z.string().trim().min(2, "Organization name must be at least 2 characters").max(255),
    organizationType: z.string().trim().max(120).optional(),
    useCase: z.string().trim().max(2000).optional(),
    preferredLocale: z.enum(["en", "ar", "zh"]).optional(),
});

const consultationRequestSchema = z.object({
    contactName: z.string().trim().min(2, "Contact name must be at least 2 characters").max(255),
    contactEmail: z.string().trim().email().max(320),
    organizationName: z.string().trim().min(2, "Organization name must be at least 2 characters").max(255),
    topic: z.string().trim().min(3).max(255),
    jurisdictions: z.array(z.string().trim().min(1).max(120)).min(1).max(6),
    summary: z.string().trim().min(20).max(4000),
    vendorName: z.string().trim().max(255).optional(),
    techStackSummary: z.string().trim().max(4000).optional(),
});

export const portalRouter = router({
    submitAccessRequest: publicProcedure
        .input(accessRequestSchema)
        .mutation(async ({ ctx, input }) => {
            const startedAt = Date.now();
            const request = await createAccessRequest(input);

            void recordUserInteraction(ctx, {
                context: "portal.access",
                action: "portal_access_request_submitted",
                entityType: "access_request",
                inputSnapshot: {
                    email: input.email,
                    organizationName: input.organizationName,
                    preferredLocale: input.preferredLocale ?? null,
                },
                outputRef: {
                    requestId: request.id,
                    status: request.status,
                },
                durationMs: Date.now() - startedAt,
            });

            broadcastSSE("intake_created", {
                kind: "access_request",
                id: request.id,
                status: request.status,
                organizationName: input.organizationName,
                ts: new Date().toISOString(),
            });

            return request;
        }),

    submitConsultationRequest: publicProcedure
        .input(consultationRequestSchema)
        .mutation(async ({ ctx, input }) => {
            const startedAt = Date.now();
            const request = await createConsultationRequest(input);

            void recordUserInteraction(ctx, {
                context: "portal.consultation",
                action: "portal_consultation_request_submitted",
                entityType: "consultation_request",
                inputSnapshot: {
                    contactEmail: input.contactEmail,
                    organizationName: input.organizationName,
                    jurisdictions: input.jurisdictions,
                },
                outputRef: {
                    requestId: request.id,
                    status: request.status,
                },
                durationMs: Date.now() - startedAt,
            });

            broadcastSSE("intake_created", {
                kind: "consultation_request",
                id: request.id,
                status: request.status,
                organizationName: input.organizationName,
                topic: input.topic,
                ts: new Date().toISOString(),
            });

            return request;
        }),

    submitAuthenticatedConsultation: protectedProcedure
        .input(consultationRequestSchema)
        .mutation(async ({ ctx, input }) => {
            await requireModulePermissionIfOrgContext(ctx, "service_requests", "canCreate");
            const startedAt = Date.now();
            const request = await createConsultationRequest({
                ...input,
                userId: ctx.user.id,
            });

            void recordUserInteraction(ctx, {
                context: "portal.consultation",
                action: "portal_consultation_request_submitted_authenticated",
                entityType: "consultation_request",
                inputSnapshot: {
                    contactEmail: input.contactEmail,
                    organizationName: input.organizationName,
                    jurisdictions: input.jurisdictions,
                    userId: ctx.user.id,
                },
                outputRef: {
                    requestId: request.id,
                    status: request.status,
                },
                durationMs: Date.now() - startedAt,
            });

            broadcastSSE("intake_created", {
                kind: "consultation_request",
                id: request.id,
                status: request.status,
                organizationName: input.organizationName,
                topic: input.topic,
                ts: new Date().toISOString(),
            });

            return request;
        }),
});
