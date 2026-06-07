import { z } from "zod";

export const aiJobStatusSchema = z.enum([
    "queued",
    "running",
    "completed",
    "failed",
]);

export const aiJobStageSchema = z.enum([
    "queued",
    "gatekeeper",
    "intake",
    "extractor",
    "rag_context",
    "judge",
    "synthesizer",
    "validator",
    "reporter",
    "persistence",
    "completed",
    "failed",
]);

export const assessmentSeveritySchema = z.enum([
    "critical",
    "high",
    "medium",
    "low",
]);

export const supplierGapSchema = z.object({
    code: z.string().trim().min(1).max(120),
    jurisdiction: z.enum(["china", "saudi", "cross_border"]),
    frameworks: z.array(z.string().trim().min(1).max(32)).min(1).max(8),
    severity: assessmentSeveritySchema,
    title: z.string().trim().min(1).max(240),
    description: z.string().trim().min(1).max(3000),
    mitigation: z.string().trim().min(1).max(3000),
    penaltyContext: z.string().trim().max(2000),
});

export const supplierAssessmentSchema = z.object({
    vendorId: z.number().int(),
    generatedAt: z.string().datetime({ offset: true }),
    overallScore: z.number().int().min(0).max(100),
    jurisdictionScores: z.object({
        china: z.number().int().min(0).max(100),
        saudiArabia: z.number().int().min(0).max(100),
    }),
    status: z.enum(["compliant", "partial", "non_compliant"]),
    riskLevel: z.enum(["low", "medium", "high", "critical"]),
    gaps: z.array(supplierGapSchema),
    recommendations: z.array(z.string().trim().min(1).max(3000)).max(120),
});

export const extractedFactSchema = z.object({
    key: z.string().trim().min(1).max(120),
    value: z.string().trim().min(1).max(4000),
    evidence: z.string().trim().max(4000).optional().default(""),
    mappedControlBuckets: z
        .array(z.string().trim().min(1).max(120))
        .max(12)
        .default([]),
});

export const ragControlSchema = z.object({
    controlId: z.number().int().positive(),
    frameworkCode: z.string().trim().min(1).max(32),
    controlCode: z.string().trim().min(1).max(120),
    category: z.string().trim().max(120).optional().nullable(),
    controlName: z.string().trim().max(512).optional().nullable(),
    requirement: z.string().trim().max(4000).optional().nullable(),
    relevanceScore: z.number().min(0).max(1),
});

export const dbAssessmentPayloadSchema = z.object({
    frameworkCode: z.string().trim().min(1).max(32),
    complianceScore: z.number().int().min(0).max(100),
    riskLevel: z.enum(["low", "medium", "high", "critical"]),
    status: z.enum(["compliant", "partial", "non_compliant"]),
    findings: z.array(z.string().trim().min(1).max(1200)).max(120),
    recommendations: z.array(z.string().trim().min(1).max(3000)).max(120),
});

export const dbGapPayloadSchema = z.object({
    frameworkCode: z.string().trim().min(1).max(32),
    controlCode: z.string().trim().max(120).optional().default(""),
    gapCode: z.string().trim().min(1).max(120),
    gapDescription: z.string().trim().min(1).max(3000),
    severity: assessmentSeveritySchema,
    remediation: z.string().trim().min(1).max(3000),
});

export const aiAssessmentReportSchema = z.object({
    version: z.literal("1.0"),
    generatedAt: z.string().datetime({ offset: true }),
    inputSummary: z.object({
        vendorId: z.number().int(),
        source: z.enum(["vendor_profile", "document_upload"]),
        documentType: z.string().trim().max(120),
        tags: z.array(z.string().trim().min(1).max(60)).max(20),
    }),
    extractedFacts: z.array(extractedFactSchema).max(200),
    ragControls: z.array(ragControlSchema).max(200),
    assessment: supplierAssessmentSchema,
    remediationPlan: z.array(z.string().trim().min(1).max(3000)).max(120),
    validator: z.object({
        passed: z.boolean(),
        attempts: z.number().int().min(1).max(10),
        notes: z.array(z.string().trim().min(1).max(1200)).max(60),
    }),
    dbPayload: z.object({
        vendorAssessments: z.array(dbAssessmentPayloadSchema).max(20),
        assessmentGaps: z.array(dbGapPayloadSchema).max(400),
    }),
});

export const aiJobEventSchema = z.object({
    stage: aiJobStageSchema,
    message: z.string().trim().min(1).max(500),
    timestamp: z.string().datetime({ offset: true }),
});

export const aiJobSnapshotSchema = z.object({
    id: z.string().trim().min(1),
    userId: z.number().int(),
    status: aiJobStatusSchema,
    stage: aiJobStageSchema,
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
    events: z.array(aiJobEventSchema).max(500),
    error: z.string().trim().max(3000).optional(),
    result: aiAssessmentReportSchema.optional(),
    persistence: z
        .object({
            savedAssessments: z.number().int().min(0),
            savedGaps: z.number().int().min(0),
            skipped: z.boolean(),
        })
        .optional(),
});

export type AiJobStatus = z.infer<typeof aiJobStatusSchema>;
export type AiJobStage = z.infer<typeof aiJobStageSchema>;
export type SupplierGapPayload = z.infer<typeof supplierGapSchema>;
export type SupplierAssessmentPayload = z.infer<typeof supplierAssessmentSchema>;
export type ExtractedFact = z.infer<typeof extractedFactSchema>;
export type RagControl = z.infer<typeof ragControlSchema>;
export type AiAssessmentReport = z.infer<typeof aiAssessmentReportSchema>;
export type AiJobEvent = z.infer<typeof aiJobEventSchema>;
export type AiJobSnapshot = z.infer<typeof aiJobSnapshotSchema>;