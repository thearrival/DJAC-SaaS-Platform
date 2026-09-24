import { z } from "zod";
import { APP_LOCALES } from "../shared/const";
import {
  createAccessRequest,
  createConsultationRequest,
} from "./control-center-store";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { requireModulePermissionIfOrgContext } from "./_core/permission-guard";
import { recordUserInteraction } from "./interaction-logger";
import { broadcastSSE } from "./services/sse-bus";
import {
  sendSubmissionNotification,
  sendPartnershipNotification,
  sendSponsorshipNotification,
  sendEventApplicationNotification,
  sendGeneralInquiryNotification,
} from "./services/submission-email";

const accessRequestSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(255),
  email: z.string().trim().email().max(320),
  organizationName: z
    .string()
    .trim()
    .min(2, "Organization name must be at least 2 characters")
    .max(255),
  organizationType: z.string().trim().max(120).optional(),
  useCase: z.string().trim().max(2000).optional(),
  preferredLocale: z.enum(APP_LOCALES).optional(),
});

const consultationRequestSchema = z.object({
  contactName: z
    .string()
    .trim()
    .min(2, "Contact name must be at least 2 characters")
    .max(255),
  contactEmail: z.string().trim().email().max(320),
  organizationName: z
    .string()
    .trim()
    .min(2, "Organization name must be at least 2 characters")
    .max(255),
  topic: z.string().trim().min(3).max(255),
  jurisdictions: z.array(z.string().trim().min(1).max(120)).min(1).max(6),
  summary: z.string().trim().min(20).max(4000),
  vendorName: z.string().trim().max(255).optional(),
  techStackSummary: z.string().trim().max(4000).optional(),
});

const partnershipSchema = z.object({
  senderName: z.string().trim().min(2).max(255),
  senderEmail: z.string().trim().email().max(320),
  organizationName: z.string().trim().min(2).max(255),
  partnershipType: z.string().trim().min(2).max(120),
  proposalSummary: z.string().trim().min(10).max(4000),
  expectedBudget: z.string().trim().max(120).optional(),
  timeline: z.string().trim().max(120).optional(),
});

const sponsorshipSchema = z.object({
  senderName: z.string().trim().min(2).max(255),
  senderEmail: z.string().trim().email().max(320),
  organizationName: z.string().trim().min(2).max(255),
  sponsorshipTier: z.string().trim().min(2).max(120),
  sponsorshipAmount: z.string().trim().max(120).optional(),
  benefitsRequired: z.string().trim().max(4000).optional(),
  eventName: z.string().trim().max(255).optional(),
});

const eventApplicationSchema = z.object({
  senderName: z.string().trim().min(2).max(255),
  senderEmail: z.string().trim().email().max(320),
  organizationName: z.string().trim().min(2).max(255),
  eventName: z.string().trim().min(2).max(255),
  eventDate: z.string().trim().max(50).optional(),
  role: z.string().trim().min(2).max(120),
  experience: z.string().trim().max(4000).optional(),
  availability: z.string().trim().max(4000).optional(),
});

const generalInquirySchema = z.object({
  senderName: z.string().trim().min(2).max(255),
  senderEmail: z.string().trim().email().max(320),
  organizationName: z.string().trim().min(2).max(255),
  subject: z.string().trim().min(2).max(255),
  message: z.string().trim().min(10).max(4000),
  priority: z.string().trim().max(50).optional(),
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

      void sendSubmissionNotification({
        type: "access_request",
        senderName: input.fullName,
        senderEmail: input.email,
        organizationName: input.organizationName,
        useCase: input.useCase ?? "",
        preferredLocale: input.preferredLocale ?? "",
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

      void sendSubmissionNotification({
        type: "consultation",
        senderName: input.contactName,
        senderEmail: input.contactEmail,
        organizationName: input.organizationName,
        topic: input.topic,
        jurisdictions: input.jurisdictions,
        summary: input.summary,
        vendorName: input.vendorName ?? "",
        techStackSummary: input.techStackSummary ?? "",
      });

      return request;
    }),

  submitAuthenticatedConsultation: protectedProcedure
    .input(consultationRequestSchema)
    .mutation(async ({ ctx, input }) => {
      await requireModulePermissionIfOrgContext(
        ctx,
        "service_requests",
        "canCreate"
      );
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

      void sendSubmissionNotification({
        type: "consultation",
        senderName: input.contactName,
        senderEmail: input.contactEmail,
        organizationName: input.organizationName,
        topic: input.topic,
        jurisdictions: input.jurisdictions,
        summary: input.summary,
        vendorName: input.vendorName ?? "",
        techStackSummary: input.techStackSummary ?? "",
      });

      return request;
    }),

  submitPartnershipRequest: publicProcedure
    .input(partnershipSchema)
    .mutation(async ({ input }) => {
      const delivered = await sendPartnershipNotification(
        input.senderName,
        input.senderEmail,
        input.organizationName,
        input.partnershipType,
        input.proposalSummary,
        input.expectedBudget,
        input.timeline
      );

      return {
        success: delivered,
        requestId: `partnership_${Date.now()}`,
      } as const;
    }),

  submitSponsorshipRequest: publicProcedure
    .input(sponsorshipSchema)
    .mutation(async ({ input }) => {
      const delivered = await sendSponsorshipNotification(
        input.senderName,
        input.senderEmail,
        input.organizationName,
        input.sponsorshipTier,
        input.sponsorshipAmount,
        input.benefitsRequired,
        input.eventName
      );

      return {
        success: delivered,
        requestId: `sponsorship_${Date.now()}`,
      } as const;
    }),

  submitEventApplication: publicProcedure
    .input(eventApplicationSchema)
    .mutation(async ({ input }) => {
      const delivered = await sendEventApplicationNotification(
        input.senderName,
        input.senderEmail,
        input.organizationName,
        input.eventName,
        input.eventDate ?? "",
        input.role,
        input.experience,
        input.availability
      );

      return {
        success: delivered,
        requestId: `event_${Date.now()}`,
      } as const;
    }),

  submitGeneralInquiry: publicProcedure
    .input(generalInquirySchema)
    .mutation(async ({ input }) => {
      const delivered = await sendGeneralInquiryNotification(
        input.senderName,
        input.senderEmail,
        input.organizationName,
        input.subject,
        input.message,
        input.priority
      );

      return {
        success: delivered,
        requestId: `inquiry_${Date.now()}`,
      } as const;
    }),
});
