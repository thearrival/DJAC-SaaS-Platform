import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { requireModulePermissionIfOrgContext } from "./_core/permission-guard";
import { recordUserInteraction } from "./interaction-logger";
import { getComparisonTable, getObligationsByCountry, listComplianceObligations } from "./compliance-timetable";
import { getLawKnowledgeBySlug, listLawKnowledge, searchLawKnowledge } from "./legal-knowledge";
import { generateComplianceReport } from "./report-generator";
import { emailComplianceReport, generateComplianceReportDocx, generateComplianceReportPdf } from "./report-delivery";
import { createReportShare, getReportShareByToken } from "./report-share-store";

const idSchema = z.number().int().positive();

export const complianceFrameworkRouter = router({
    frameworks: publicProcedure.query(async ({ ctx }) => {
        const { getAllFrameworks } = await import("./compliance-db");
        const data = await getAllFrameworks();
        void recordUserInteraction(ctx, {
            context: "compliance.frameworks",
            action: "frameworks_viewed",
            entityType: "framework",
            outputRef: { count: data.length },
        });
        return data;
    }),

    frameworksByCountry: publicProcedure
        .input(z.string().trim().min(1))
        .query(async ({ ctx, input }) => {
            const { getFrameworksByCountry } = await import("./compliance-db");
            const data = await getFrameworksByCountry(input);
            void recordUserInteraction(ctx, {
                context: "compliance.frameworks",
                action: "frameworks_by_country_viewed",
                entityType: "framework",
                inputSnapshot: { country: input },
                outputRef: { count: data.length },
            });
            return data;
        }),

    controls: publicProcedure.input(idSchema).query(async ({ ctx, input }) => {
        const { getControlsByFramework } = await import("./compliance-db");
        const data = await getControlsByFramework(input);
        void recordUserInteraction(ctx, {
            context: "compliance.controls",
            action: "framework_controls_viewed",
            entityType: "framework",
            entityId: input,
            outputRef: { count: data.length },
        });
        return data;
    }),

    comparison: publicProcedure
        .input(
            z.object({
                framework1Id: idSchema,
                framework2Id: idSchema,
            })
        )
        .query(async ({ ctx, input }) => {
            const { getComplianceComparison } = await import("./compliance-db");
            const data = await getComplianceComparison(input.framework1Id, input.framework2Id);
            void recordUserInteraction(ctx, {
                context: "compliance.comparison",
                action: "framework_comparison_viewed",
                entityType: "framework",
                inputSnapshot: {
                    framework1Id: input.framework1Id,
                    framework2Id: input.framework2Id,
                },
                outputRef: {
                    relationships: data?.relationships?.length ?? null,
                },
            });
            return data;
        }),

    matrix: publicProcedure.query(async ({ ctx }) => {
        const { getComplianceMatrix } = await import("./compliance-db");
        const data = await getComplianceMatrix();
        void recordUserInteraction(ctx, {
            context: "compliance.matrix",
            action: "compliance_matrix_viewed",
            entityType: "framework",
            outputRef: { count: data.length },
        });
        return data;
    }),

    relationships: publicProcedure.input(idSchema).query(async ({ ctx, input }) => {
        const { getFrameworkRelationships } = await import("./compliance-db");
        const data = await getFrameworkRelationships(input);
        void recordUserInteraction(ctx, {
            context: "compliance.relationships",
            action: "framework_relationships_viewed",
            entityType: "framework",
            entityId: input,
            outputRef: { count: data.length },
        });
        return data;
    }),

    laws: publicProcedure.query(() => {
        return listLawKnowledge();
    }),

    lawBySlug: publicProcedure
        .input(z.object({ slug: z.string().trim().min(1).max(120) }))
        .query(({ input }) => {
            return getLawKnowledgeBySlug(input.slug);
        }),

    lawsSearch: publicProcedure
        .input(
            z.object({
                query: z.string().trim().max(200).default(""),
                limit: z.number().int().min(1).max(50).optional(),
            })
        )
        .query(({ input }) => {
            return searchLawKnowledge(input.query, input.limit ?? 20);
        }),

    timetable: publicProcedure.query(() => {
        return listComplianceObligations();
    }),

    timetableByCountry: publicProcedure
        .input(z.enum(["Saudi Arabia", "China"]))
        .query(({ input }) => {
            return getObligationsByCountry(input);
        }),

    comparisonTable: publicProcedure.query(() => {
        return getComparisonTable();
    }),

    // report — requires authentication; anonymous access goes via reportByToken (share links)
    report: protectedProcedure
        .input(
            z.object({
                jurisdiction: z.enum(["Saudi Arabia", "China", "both"]),
                locale: z.enum(["en", "ar", "zh"]).default("en"),
                reportType: z.enum(["full_compliance", "gap_analysis", "vendor_assessment", "risk_assessment", "executive_summary", "regulatory_deadline"]).default("full_compliance").optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            await requireModulePermissionIfOrgContext(ctx, "report_center", "canView");
            const startedAt = Date.now();
            const report = generateComplianceReport({
                jurisdiction: input.jurisdiction,
                locale: input.locale,
                reportType: input.reportType,
            });

            void recordUserInteraction(ctx, {
                context: "compliance.report",
                action: "compliance_report_generated",
                entityType: "compliance_report",
                inputSnapshot: {
                    jurisdiction: input.jurisdiction,
                    locale: input.locale,
                },
                outputRef: {
                    markdownLength: report.markdown.length,
                },
                durationMs: Date.now() - startedAt,
            });

            return report;
        }),

    reportPdf: protectedProcedure
        .input(
            z.object({
                jurisdiction: z.enum(["Saudi Arabia", "China", "both"]),
                locale: z.enum(["en", "ar", "zh"]).default("en"),
                reportType: z.enum(["full_compliance", "gap_analysis", "vendor_assessment", "risk_assessment", "executive_summary", "regulatory_deadline"]).default("full_compliance").optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            await requireModulePermissionIfOrgContext(ctx, "report_center", "canExport");
            const startedAt = Date.now();
            const pdf = await generateComplianceReportPdf({
                jurisdiction: input.jurisdiction,
                locale: input.locale,
                reportType: input.reportType,
            });

            void recordUserInteraction(ctx, {
                context: "compliance.report",
                action: "compliance_report_pdf_generated",
                entityType: "compliance_report",
                inputSnapshot: {
                    jurisdiction: input.jurisdiction,
                    locale: input.locale,
                },
                outputRef: {
                    reportId: pdf.reportId,
                    fileName: pdf.fileName,
                },
                durationMs: Date.now() - startedAt,
            });

            return pdf;
        }),

    reportDocx: protectedProcedure
        .input(
            z.object({
                jurisdiction: z.enum(["Saudi Arabia", "China", "both"]),
                locale: z.enum(["en", "ar", "zh"]).default("en"),
                reportType: z.enum(["full_compliance", "gap_analysis", "vendor_assessment", "risk_assessment", "executive_summary", "regulatory_deadline"]).default("full_compliance").optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            await requireModulePermissionIfOrgContext(ctx, "report_center", "canExport");
            const startedAt = Date.now();
            const docx = await generateComplianceReportDocx({
                jurisdiction: input.jurisdiction,
                locale: input.locale,
                reportType: input.reportType,
            });

            void recordUserInteraction(ctx, {
                context: "compliance.report",
                action: "compliance_report_docx_generated",
                entityType: "compliance_report",
                inputSnapshot: {
                    jurisdiction: input.jurisdiction,
                    locale: input.locale,
                },
                outputRef: {
                    reportId: docx.reportId,
                    fileName: docx.fileName,
                },
                durationMs: Date.now() - startedAt,
            });

            return docx;
        }),

    emailReport: protectedProcedure
        .input(
            z.object({
                jurisdiction: z.enum(["Saudi Arabia", "China", "both"]),
                locale: z.enum(["en", "ar", "zh"]).default("en"),
                reportType: z.enum(["full_compliance", "gap_analysis", "vendor_assessment", "risk_assessment", "executive_summary", "regulatory_deadline"]).default("full_compliance").optional(),
                recipientEmail: z.string().trim().email().max(320),
            })
        )
        .mutation(async ({ ctx, input }) => {
            await requireModulePermissionIfOrgContext(ctx, "report_center", "canExport");
            const startedAt = Date.now();
            const delivery = await emailComplianceReport({
                jurisdiction: input.jurisdiction,
                locale: input.locale,
                reportType: input.reportType,
                recipientEmail: input.recipientEmail,
            });

            void recordUserInteraction(ctx, {
                context: "compliance.report",
                action: "compliance_report_emailed",
                entityType: "compliance_report",
                inputSnapshot: {
                    jurisdiction: input.jurisdiction,
                    locale: input.locale,
                    recipientEmail: input.recipientEmail,
                },
                outputRef: {
                    reportId: delivery.reportId,
                    messageId: delivery.messageId,
                },
                durationMs: Date.now() - startedAt,
            });

            return delivery;
        }),

    createShareLink: protectedProcedure
        .input(
            z.object({
                jurisdiction: z.enum(["Saudi Arabia", "China", "both"]),
                locale: z.enum(["en", "ar", "zh"]).default("en"),
                reportType: z.enum(["full_compliance", "gap_analysis", "vendor_assessment", "risk_assessment", "executive_summary", "regulatory_deadline"]).default("full_compliance"),
                ttlDays: z.number().int().min(1).max(30).default(7),
            })
        )
        .mutation(async ({ ctx, input }) => {
            await requireModulePermissionIfOrgContext(ctx, "report_center", "canExport");
            const share = await createReportShare({
                jurisdiction: input.jurisdiction,
                locale: input.locale,
                reportType: input.reportType,
                createdByUserId: ctx.user?.id ?? null,
                ttlSeconds: input.ttlDays * 86400,
            });
            return { token: share.token, expiresAt: share.expiresAt };
        }),

    reportByToken: publicProcedure
        .input(z.object({ token: z.string().regex(/^[0-9a-f]{48}$/) }))
        .query(async ({ input }) => {
            const share = await getReportShareByToken(input.token);
            if (!share) {
                throw new Error("SHARE_NOT_FOUND");
            }
            const report = generateComplianceReport({
                jurisdiction: share.jurisdiction as "Saudi Arabia" | "China" | "both",
                locale: share.locale,
                reportType: share.reportType as Parameters<typeof generateComplianceReport>[0]["reportType"],
            });
            return {
                ...report,
                shareToken: share.token,
                shareExpiresAt: share.expiresAt,
                shareViewCount: share.viewCount,
                jurisdiction: share.jurisdiction,
                locale: share.locale,
            };
        }),
});
