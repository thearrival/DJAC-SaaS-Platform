import { TRPCError } from "@trpc/server";
import { hasMinRole } from "@shared/const";
import {
    serializeVendorMultiValue,
    vendorCloudProviderValues,
    vendorComplianceStandardValues,
    vendorCountryValues,
    vendorCriticalityLevelValues,
    vendorDataProcessingActivityValues,
    vendorDependencyLevelValues,
    vendorHostingEnvironmentValues,
    vendorIndustryValues,
    vendorJurisdictionValues,
    vendorRiskTierValues,
    vendorServiceTypeValues,
} from "@shared/vendorProfile";
import type { Vendor } from "../drizzle/schema";
import { z } from "zod";
import { activeOrgProcedure, orgProcedure, router } from "./_core/trpc";
import { requireModulePermission } from "./_core/permission-guard";
import { recordAuditEvent } from "./audit-logger";
import { recordUserInteraction } from "./interaction-logger";
import { createAdminNotification, recordActivity } from "./control-center-store";
import {
    createVendorProfile,
    getVendorProfileById,
    listVendorProfiles,
    listTechStackComponentsByVendorId,
    patchVendorBasicFields,
    deleteVendorProfile,
} from "./vendor-store";
import { runAssessmentSync, enqueueAssessmentJob } from "./ai/orchestrator";
import { buildAssessmentCsv } from "./supplier-assessment";

const idSchema = z.number().int().positive();

const vendorTechStackComponentSchema = z.object({
    componentName: z.string().trim().min(2, "Component name must be at least 2 characters").max(255),
    componentType: z.string().trim().min(2, "Component type must be at least 2 characters").max(120),
    technology: z.string().trim().min(1).max(255),
    description: z.string().trim().max(1000).optional().default(""),
    dataHandling: z.string().trim().max(1000).optional().default(""),
});

const vendorInputSchema = z.object({
    vendorName: z.string().trim().min(2, "Vendor name must be at least 2 characters").max(255),
    vendorDescription: z.string().trim().min(20).max(2000),
    industry: z.enum(vendorIndustryValues),
    businessRegistrationNumber: z.string().trim().min(3).max(120),
    headquartersLocation: z.enum(vendorCountryValues),
    primaryContactName: z.string().trim().min(2, "Contact name must be at least 2 characters").max(255),
    primaryContactEmail: z.string().trim().email().max(320),
    primaryContactRole: z.string().trim().min(2, "Contact role must be at least 2 characters").max(120),
    primaryContactPhone: z.string().trim().max(64).optional().default(""),
    serviceType: z.enum(vendorServiceTypeValues),
    serviceScope: z.string().trim().min(10).max(2000),
    hostingEnvironment: z.enum(vendorHostingEnvironmentValues),
    cloudProviders: z.array(z.enum(vendorCloudProviderValues)).max(6).default([]),
    operatingCountries: z.array(z.enum(vendorCountryValues)).min(1).max(10),
    dataLocations: z.array(z.enum(vendorCountryValues)).min(1).max(10),
    regulatoryJurisdictions: z.array(z.enum(vendorJurisdictionValues)).min(1).max(6),
    certifications: z.array(z.enum(vendorComplianceStandardValues)).max(10).default([]),
    dataProcessingActivities: z.array(z.enum(vendorDataProcessingActivityValues)).min(1).max(10),
    criticalityLevel: z.enum(vendorCriticalityLevelValues),
    riskTier: z.enum(vendorRiskTierValues),
    thirdPartyDependencies: z.enum(vendorDependencyLevelValues),
    fourthPartyDependencies: z.enum(vendorDependencyLevelValues),
    techStackComponents: z.array(vendorTechStackComponentSchema).max(20).default([]),
}).superRefine((input, ctx) => {
    if (
        ["single-public-cloud", "multi-cloud", "hybrid"].includes(input.hostingEnvironment) &&
        input.cloudProviders.length === 0
    ) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "At least one cloud provider is required for public-cloud or hybrid hosting.",
            path: ["cloudProviders"],
        });
    }
});

export const vendorRouter = router({
    list: orgProcedure.query(async ({ ctx }) => {
        await requireModulePermission(ctx, "vendor_assessment", "canView");
        return listVendorProfiles(ctx.user.id, ctx.organizationId);
    }),

    create: orgProcedure
        .input(vendorInputSchema)
        .mutation(async ({ ctx, input }) => {
            await requireModulePermission(ctx, "vendor_assessment", "canCreate");
            const startedAt = Date.now();
            const vendor = await createVendorProfile(ctx.user.id, input, ctx.organizationId);

            void recordAuditEvent(ctx, {
                category: "data_write",
                action: "vendor.create",
                entityType: "vendors",
                entityId: vendor.id,
                payload: {
                    vendorName: vendor.vendorName,
                    serviceType: vendor.serviceType,
                    criticalityLevel: vendor.criticalityLevel,
                    riskTier: vendor.riskTier,
                    cloudProviders: vendor.cloudProvider,
                    dataLocations: vendor.dataLocations,
                    certifications: vendor.certifications,
                },
            });

            void recordActivity({
                userId: ctx.user.id,
                actorType: hasMinRole(ctx.user.role, "admin") ? "admin" : "client",
                action: "vendor_profile_created",
                entityType: "vendor",
                entityId: vendor.id,
                metadata: {
                    vendorName: vendor.vendorName,
                    riskTier: vendor.riskTier,
                    techStackCount: input.techStackComponents.length,
                },
            }).catch(error => {
                console.warn("[Activity] Failed to record vendor_profile_created", error);
            });

            void recordUserInteraction(ctx, {
                context: "vendor.profile",
                action: "vendor_created",
                entityType: "vendor",
                entityId: vendor.id,
                inputSnapshot: {
                    vendorName: vendor.vendorName,
                    serviceType: vendor.serviceType,
                    riskTier: vendor.riskTier,
                },
                outputRef: { success: true },
                durationMs: Date.now() - startedAt,
            });

            return { success: true, vendor } as const;
        }),

    patch: orgProcedure
        .input(
            z.object({
                vendorId: idSchema,
                vendorName: z.string().trim().min(2, "Vendor name must be at least 2 characters").max(255),
                vendorDescription: z.string().trim().min(20).max(2000),
                criticalityLevel: z.enum(vendorCriticalityLevelValues),
                riskTier: z.enum(vendorRiskTierValues),
                primaryContactName: z.string().trim().min(2, "Contact name must be at least 2 characters").max(255),
                primaryContactEmail: z.string().trim().email().max(320),
                primaryContactRole: z.string().trim().min(2, "Contact role must be at least 2 characters").max(120),
                primaryContactPhone: z.string().trim().max(64).optional().default(""),
            })
        )
        .mutation(async ({ ctx, input }) => {
            await requireModulePermission(ctx, "vendor_assessment", "canEdit");
            const { vendorId, ...patch } = input;
            const existing = await getVendorProfileById(vendorId, ctx.user.id, ctx.organizationId);
            if (!existing) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Vendor not found." });
            }
            const vendor = await patchVendorBasicFields(vendorId, ctx.user.id, patch, ctx.organizationId);
            void recordAuditEvent(ctx, {
                category: "data_write",
                action: "vendor_updated",
                entityType: "vendors",
                entityId: vendor.id,
                payload: { vendorName: vendor.vendorName, riskTier: vendor.riskTier },
            });
            return { success: true, vendor } as const;
        }),

    delete: orgProcedure
        .input(z.object({ vendorId: idSchema }))
        .mutation(async ({ ctx, input }) => {
            await requireModulePermission(ctx, "vendor_assessment", "canDelete");
            const existing = await getVendorProfileById(input.vendorId, ctx.user.id, ctx.organizationId);
            if (!existing) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Vendor not found." });
            }
            await deleteVendorProfile(input.vendorId, ctx.user.id, ctx.organizationId);
            void recordAuditEvent(ctx, {
                category: "data_write",
                action: "vendor_deleted",
                entityType: "vendors",
                entityId: input.vendorId,
                payload: { vendorName: existing.vendorName },
            });
            return { success: true } as const;
        }),

    assess: activeOrgProcedure
        .input(
            z.object({
                vendorId: idSchema,
            })
        )
        .mutation(async ({ ctx, input }) => {
            await requireModulePermission(ctx, "vendor_assessment", "canCreate");
            const startedAt = Date.now();
            const vendor = await getVendorProfileById(input.vendorId, ctx.user.id, ctx.organizationId);
            if (!vendor) {
                throw new Error("Vendor not found");
            }

            const orchestration = await runAssessmentSync({
                userId: ctx.user.id,
                source: "vendor_profile",
                vendor,
                persistResult: true,
            });
            const assessment = orchestration.report.assessment;

            void recordAuditEvent(ctx, {
                category: "data_write",
                action: "vendor.assess",
                entityType: "vendors",
                entityId: vendor.id,
                payload: {
                    jobId: orchestration.job.id,
                    overallScore: assessment.overallScore,
                    riskLevel: assessment.riskLevel,
                    gapCount: assessment.gaps.length,
                },
            });

            void recordActivity({
                userId: ctx.user.id,
                actorType: hasMinRole(ctx.user.role, "admin") ? "admin" : "client",
                action: "assessment_completed",
                entityType: "vendor_assessment",
                entityId: vendor.id,
                metadata: {
                    vendorName: vendor.vendorName,
                    overallScore: assessment.overallScore,
                    riskLevel: assessment.riskLevel,
                    gapCount: assessment.gaps.length,
                },
            }).catch(error => {
                console.warn("[Activity] Failed to record assessment_completed", error);
            });

            void createAdminNotification({
                category: "assessment",
                title: `Assessment completed for ${vendor.vendorName}`,
                content: `Risk level ${assessment.riskLevel} with ${assessment.gaps.length} mapped gaps.`,
                entityType: "vendor_assessment",
                entityId: vendor.id,
            }).catch(error => {
                console.warn("[Notification] Failed to create assessment notification", error);
            });

            void recordUserInteraction(ctx, {
                context: "vendor.assessment",
                action: "vendor_assessment_completed",
                entityType: "vendor",
                entityId: vendor.id,
                inputSnapshot: { vendorId: vendor.id },
                outputRef: {
                    overallScore: assessment.overallScore,
                    riskLevel: assessment.riskLevel,
                    gapCount: assessment.gaps.length,
                },
                durationMs: Date.now() - startedAt,
            });

            return assessment;
        }),

    assessDraft: activeOrgProcedure
        .input(vendorInputSchema)
        .mutation(async ({ ctx, input }) => {
            await requireModulePermission(ctx, "vendor_assessment", "canCreate");
            const draftVendor: Vendor = {
                id: 0,
                userId: ctx.user.id,
                organizationId: null,
                vendorName: input.vendorName,
                vendorDescription: input.vendorDescription,
                industry: input.industry,
                businessRegistrationNumber: input.businessRegistrationNumber,
                headquartersLocation: input.headquartersLocation,
                primaryContactName: input.primaryContactName,
                primaryContactEmail: input.primaryContactEmail,
                primaryContactRole: input.primaryContactRole,
                primaryContactPhone: input.primaryContactPhone || null,
                serviceType: input.serviceType,
                serviceScope: input.serviceScope,
                hostingEnvironment: input.hostingEnvironment,
                operatingCountries: serializeVendorMultiValue(input.operatingCountries),
                cloudProvider: serializeVendorMultiValue(input.cloudProviders),
                dataLocations: serializeVendorMultiValue(input.dataLocations),
                regulatoryJurisdictions: serializeVendorMultiValue(input.regulatoryJurisdictions),
                certifications: serializeVendorMultiValue(input.certifications),
                dataProcessingActivities: serializeVendorMultiValue(input.dataProcessingActivities),
                criticalityLevel: input.criticalityLevel,
                riskTier: input.riskTier,
                thirdPartyDependencies: input.thirdPartyDependencies,
                fourthPartyDependencies: input.fourthPartyDependencies,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            const orchestration = await runAssessmentSync({
                userId: ctx.user.id,
                source: "vendor_profile",
                vendor: draftVendor,
                persistResult: false,
            });

            return orchestration.report.assessment;
        }),

    report: activeOrgProcedure
        .input(
            z.object({
                vendorId: idSchema,
                format: z.enum(["csv", "json"]).default("csv"),
            })
        )
        .mutation(async ({ ctx, input }) => {
            await requireModulePermission(ctx, "vendor_assessment", "canExport");
            const startedAt = Date.now();
            const vendor = await getVendorProfileById(input.vendorId, ctx.user.id, ctx.organizationId);
            if (!vendor) {
                throw new Error("Vendor not found");
            }

            const orchestration = await runAssessmentSync({
                userId: ctx.user.id,
                source: "vendor_profile",
                vendor,
                persistResult: true,
            });
            const assessment = orchestration.report.assessment;

            const baseName = `vendor_${vendor.id}_assessment_${Date.now()}`;
            const content =
                input.format === "json"
                    ? JSON.stringify(
                        {
                            vendor,
                            assessment,
                            report: orchestration.report,
                            jobId: orchestration.job.id,
                        },
                        null,
                        2
                    )
                    : buildAssessmentCsv(vendor, assessment);
            const fileName = `${baseName}.${input.format}`;

            void recordAuditEvent(ctx, {
                category: "data_read",
                action: "report.export.assessment",
                entityType: "vendors",
                entityId: vendor.id,
                payload: {
                    jobId: orchestration.job.id,
                    format: input.format,
                    overallScore: assessment.overallScore,
                },
            });

            void recordActivity({
                userId: ctx.user.id,
                actorType: hasMinRole(ctx.user.role, "admin") ? "admin" : "client",
                action: "assessment_report_exported",
                entityType: "vendor_assessment",
                entityId: vendor.id,
                metadata: {
                    vendorName: vendor.vendorName,
                    format: input.format,
                    overallScore: assessment.overallScore,
                },
            }).catch(error => {
                console.warn("[Activity] Failed to record assessment_report_exported", error);
            });

            void recordUserInteraction(ctx, {
                context: "vendor.report",
                action: "assessment_report_exported",
                entityType: "vendor",
                entityId: vendor.id,
                inputSnapshot: { vendorId: vendor.id, format: input.format },
                outputRef: { fileName, overallScore: assessment.overallScore },
                durationMs: Date.now() - startedAt,
            });

            return {
                fileName,
                format: input.format,
                content,
                assessment,
            };
        }),

    gapSummary: orgProcedure.query(async ({ ctx }) => {
        await requireModulePermission(ctx, "vendor_assessment", "canView");
        const { runDualJurisdictionAssessment } = await import("./supplier-assessment");
        const vendors = await listVendorProfiles(ctx.user.id, ctx.organizationId);
        return vendors.map(v => ({
            vendor: {
                id: v.id,
                vendorName: v.vendorName,
                riskTier: v.riskTier,
                criticalityLevel: v.criticalityLevel,
                headquartersLocation: v.headquartersLocation,
            },
            assessment: runDualJurisdictionAssessment(v),
        }));
    }),

    bulkAssess: activeOrgProcedure
        .input(
            z.object({
                vendorIds: z.array(idSchema).min(1).max(50),
            })
        )
        .mutation(async ({ ctx, input }) => {
            await requireModulePermission(ctx, "vendor_assessment", "canCreate");
            const queued: { vendorId: number; jobId: string }[] = [];
            const errors: { vendorId: number; error: string }[] = [];
            for (const vendorId of input.vendorIds) {
                try {
                    const vendor = await getVendorProfileById(vendorId, ctx.user.id, ctx.organizationId);
                    if (!vendor) {
                        errors.push({ vendorId, error: "Vendor not found" });
                        continue;
                    }
                    const job = await enqueueAssessmentJob({
                        userId: ctx.user.id,
                        source: "vendor_profile",
                        vendor,
                        rawDocumentText: "",
                        persistResult: true,
                    });
                    queued.push({ vendorId, jobId: job.id });
                } catch (err) {
                    errors.push({
                        vendorId,
                        error: err instanceof Error ? err.message : "Unknown error",
                    });
                }
            }

            void recordAuditEvent(ctx, {
                category: "data_write",
                action: "vendor.bulkAssess",
                entityType: "vendor_assessment",
                payload: {
                    vendorIds: input.vendorIds,
                    queuedCount: queued.length,
                    errorCount: errors.length,
                },
            });

            return { queued, errors };
        }),

    getDetail: orgProcedure
        .input(z.number().int().positive())
        .query(async ({ ctx, input }) => {
            await requireModulePermission(ctx, "vendor_assessment", "canView");
            const { runDualJurisdictionAssessment } = await import("./supplier-assessment");
            const vendor = await getVendorProfileById(input, ctx.user.id, ctx.organizationId);
            if (!vendor) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Vendor not found." });
            }
            const techStack = await listTechStackComponentsByVendorId(vendor.id);
            const assessment = runDualJurisdictionAssessment(vendor);
            return { vendor, techStack, assessment };
        }),
});
