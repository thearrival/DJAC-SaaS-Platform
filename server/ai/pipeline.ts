import { and, eq } from "drizzle-orm";
import type { Vendor } from "../../drizzle/schema";
import { complianceControls, frameworks } from "../../drizzle/schema";
import { getDb } from "../db";
import {
    runDualJurisdictionAssessment,
    type SupplierAssessmentResult,
    type SupplierGap,
} from "../supplier-assessment";
import { ENV } from "../_core/env";
import {
    aiAssessmentReportSchema,
    type AiAssessmentReport,
    type AiJobStage,
    type ExtractedFact,
    type RagControl,
    type SupplierGapPayload,
} from "./schemas";
export type PipelineEngine = "native";

type PipelineInput = {
    source: "vendor_profile" | "document_upload";
    vendor: Vendor;
    rawDocumentText?: string;
    engine?: PipelineEngine;
};

type StageReporter = (stage: AiJobStage, message: string) => void;

type IntakeResult = {
    documentType: string;
    tags: string[];
    normalizedText: string;
};

type ValidatorResult = {
    passed: boolean;
    notes: string[];
};

const WEAK_ENCRYPTION_CODE = "CRYPTO-WEAK-001";
const DEFAULT_KNOWN_FRAMEWORKS = ["PIPL", "CSL", "DSL", "MLPS 2.0", "PDPL", "NCA"];
const CHINA_FRAMEWORKS = ["PIPL", "CSL", "DSL", "MLPS 2.0"];
const SAUDI_FRAMEWORKS = ["PDPL", "NCA"];

const INJECTION_PATTERNS: RegExp[] = [
    /ignore\s+all\s+previous\s+instructions/i,
    /system\s+prompt/i,
    /jailbreak/i,
    /<script[\s>]/i,
    /rm\s+-rf\s+\//i,
    /drop\s+table/i,
    /shutdown\s+-h/i,
];

const CONTROL_BUCKET_KEYWORDS: Record<string, string[]> = {
    "Data Processing & Encryption": ["encrypt", "encryption", "aes", "rsa", "key"],
    "Data Localization": ["china", "saudi", "riyadh", "beijing", "shanghai", "localization"],
    "Access Control": ["access", "identity", "iam", "mfa", "privilege"],
    "Incident Response": ["incident", "breach", "response", "monitor"],
    "Transfer & Consent": ["consent", "transfer", "cross-border", "cross border", "subject"],
    Governance: ["audit", "policy", "governance", "compliance", "legal"],
};

function clampScore(value: number): number {
    return Math.max(0, Math.min(100, Math.round(value)));
}

function scoreToStatus(
    score: number
): "compliant" | "partial" | "non_compliant" {
    if (score >= 85) return "compliant";
    if (score >= 65) return "partial";
    return "non_compliant";
}

function inferRiskLevel(
    assessment: SupplierAssessmentResult
): "low" | "medium" | "high" | "critical" {
    const criticalCount = assessment.gaps.filter(g => g.severity === "critical").length;
    const highCount = assessment.gaps.filter(g => g.severity === "high").length;

    if (criticalCount > 0) return "critical";
    if (assessment.overallScore < 60 || highCount >= 2) return "high";
    if (assessment.overallScore < 80 || highCount > 0) return "medium";
    return "low";
}

function toTokens(value: string): string[] {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, " ")
        .split(/\s+/)
        .map(token => token.trim())
        .filter(token => token.length >= 3);
}

function mapControlBuckets(text: string): string[] {
    const normalized = text.toLowerCase();
    const buckets: string[] = [];

    for (const [bucket, keywords] of Object.entries(CONTROL_BUCKET_KEYWORDS)) {
        if (keywords.some(keyword => normalized.includes(keyword))) {
            buckets.push(bucket);
        }
    }

    return Array.from(new Set(buckets));
}

function addFact(facts: ExtractedFact[], key: string, value: string, evidence = "") {
    const normalized = value.trim();
    if (!normalized) return;

    facts.push({
        key,
        value: normalized,
        evidence: evidence.trim(),
        mappedControlBuckets: mapControlBuckets(`${key} ${normalized} ${evidence}`),
    });
}

async function callAgentSwarm<T>(
    stagePath: string,
    payload: unknown
): Promise<T | null> {
    const baseUrl = ENV.agentSwarmBaseUrl;
    if (!baseUrl) return null;

    const endpoint = `${baseUrl.replace(/\/$/, "")}/${stagePath.replace(/^\//, "")}`;
    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), 15_000);

    try {
        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify(payload),
            signal: abortController.signal,
        });

        if (!response.ok) {
            return null;
        }

        return (await response.json()) as T;
    } catch {
        return null;
    } finally {
        clearTimeout(timeout);
    }
}

function runSecurityGatekeeper(payload: string) {
    const threats = INJECTION_PATTERNS.filter(pattern => pattern.test(payload));
    if (threats.length > 0) {
        throw new Error(
            "Security Gatekeeper blocked potentially malicious assessment payload."
        );
    }
}

function runIntake(vendor: Vendor, rawDocumentText: string): IntakeResult {
    const combinedText = [
        vendor.vendorName,
        vendor.vendorDescription || "",
        vendor.industry || "",
        vendor.businessRegistrationNumber || "",
        vendor.headquartersLocation || "",
        vendor.primaryContactName || "",
        vendor.primaryContactEmail || "",
        vendor.primaryContactRole || "",
        vendor.primaryContactPhone || "",
        vendor.serviceType || "",
        vendor.serviceScope || "",
        vendor.hostingEnvironment || "",
        vendor.operatingCountries || "",
        vendor.cloudProvider || "",
        vendor.dataLocations || "",
        vendor.regulatoryJurisdictions || "",
        vendor.certifications || "",
        vendor.dataProcessingActivities || "",
        vendor.criticalityLevel || "",
        vendor.riskTier || "",
        vendor.thirdPartyDependencies || "",
        vendor.fourthPartyDependencies || "",
        rawDocumentText || "",
    ]
        .filter(Boolean)
        .join("\n")
        .trim();

    const lower = combinedText.toLowerCase();
    const documentType =
        lower.includes("policy") || lower.includes("procedure")
            ? "policy_document"
            : lower.includes("questionnaire")
                ? "questionnaire"
                : rawDocumentText.trim().length > 0
                    ? "uploaded_text"
                    : "vendor_profile";

    const tags = Array.from(
        new Set(
            [
                vendor.industry,
                vendor.businessRegistrationNumber,
                vendor.serviceType,
                vendor.hostingEnvironment,
                vendor.cloudProvider,
                vendor.operatingCountries,
                vendor.dataLocations,
                vendor.regulatoryJurisdictions,
                vendor.dataProcessingActivities,
                vendor.criticalityLevel,
                vendor.riskTier,
                documentType,
            ]
                .filter(Boolean)
                .flatMap(value =>
                    String(value)
                        .split(/[;,|]/)
                        .map(v => v.trim().toLowerCase())
                        .filter(Boolean)
                )
        )
    ).slice(0, 20);

    return {
        documentType,
        tags,
        normalizedText: combinedText,
    };
}

function runExtractor(vendor: Vendor, intake: IntakeResult): ExtractedFact[] {
    const facts: ExtractedFact[] = [];

    addFact(facts, "vendor_name", vendor.vendorName);
    addFact(facts, "industry", vendor.industry || "");
    addFact(facts, "business_registration_number", vendor.businessRegistrationNumber || "");
    addFact(facts, "headquarters_location", vendor.headquartersLocation || "");
    addFact(facts, "primary_contact_name", vendor.primaryContactName || "");
    addFact(facts, "primary_contact_email", vendor.primaryContactEmail || "");
    addFact(facts, "primary_contact_role", vendor.primaryContactRole || "");
    addFact(facts, "primary_contact_phone", vendor.primaryContactPhone || "");
    addFact(facts, "service_type", vendor.serviceType || "");
    addFact(facts, "service_scope", vendor.serviceScope || "");
    addFact(facts, "hosting_environment", vendor.hostingEnvironment || "");
    addFact(facts, "cloud_provider", vendor.cloudProvider || "");
    addFact(facts, "operating_countries", vendor.operatingCountries || "");
    addFact(facts, "data_locations", vendor.dataLocations || "");
    addFact(facts, "regulatory_jurisdictions", vendor.regulatoryJurisdictions || "");
    addFact(facts, "certifications", vendor.certifications || "");
    addFact(facts, "data_processing_activities", vendor.dataProcessingActivities || "");
    addFact(facts, "criticality_level", vendor.criticalityLevel || "");
    addFact(facts, "risk_tier", vendor.riskTier || "");
    addFact(facts, "third_party_dependencies", vendor.thirdPartyDependencies || "");
    addFact(facts, "fourth_party_dependencies", vendor.fourthPartyDependencies || "");

    const encryptionRegex = /(rsa|aes)[\s-]?(\d{3,4})/gi;
    let match: RegExpExecArray | null;
    while ((match = encryptionRegex.exec(intake.normalizedText))) {
        addFact(
            facts,
            "encryption_claim",
            `${match[1].toUpperCase()} ${match[2]}`,
            `Found in submission text: ${match[0]}`
        );
    }

    addFact(
        facts,
        "intake_document_type",
        intake.documentType,
        "Classified by Intake & Tagging Clerk"
    );

    return facts.slice(0, 200);
}

async function buildRagContext(facts: ExtractedFact[]): Promise<RagControl[]> {
    const db = await getDb();
    if (!db) return [];

    const frameworkRows = await db.select().from(frameworks);
    const controls = await db.select().from(complianceControls);

    const frameworkCodeById = new Map(
        frameworkRows.map(row => [row.id, row.code] as const)
    );
    const tokenSet = new Set(
        facts.flatMap(fact => toTokens(`${fact.key} ${fact.value} ${fact.evidence}`))
    );

    const scored = controls
        .map(control => {
            const haystack = `${control.controlCode} ${control.controlName || ""} ${control.category || ""
                } ${control.requirement || ""} ${control.description || ""}`.toLowerCase();

            if (tokenSet.size === 0) {
                return {
                    row: control,
                    score: 0,
                };
            }

            let hits = 0;
            tokenSet.forEach(token => {
                if (haystack.includes(token)) hits += 1;
            });

            return {
                row: control,
                score: hits / tokenSet.size,
            };
        })
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, ENV.aiRagTopK);

    return scored.map(item => ({
        controlId: item.row.id,
        frameworkCode: frameworkCodeById.get(item.row.frameworkId) || "UNKNOWN",
        controlCode: item.row.controlCode,
        category: item.row.category,
        controlName: item.row.controlName,
        requirement: item.row.requirement,
        relevanceScore: Number(item.score.toFixed(4)),
    }));
}

function findWeakEncryptionFact(facts: ExtractedFact[]): ExtractedFact | null {
    for (const fact of facts) {
        if (fact.key !== "encryption_claim") continue;
        const match = fact.value.match(/(RSA|AES)\s*(\d{3,4})/i);
        if (!match) continue;

        const algorithm = match[1].toUpperCase();
        const bits = Number(match[2]);

        if ((algorithm === "RSA" && bits < 2048) || (algorithm === "AES" && bits < 128)) {
            return fact;
        }
    }

    return null;
}

function ensureWeakEncryptionGap(
    assessment: SupplierAssessmentResult,
    weakFact: ExtractedFact
) {
    if (assessment.gaps.some(gap => gap.code === WEAK_ENCRYPTION_CODE)) {
        return;
    }

    const newGap: SupplierGap = {
        code: WEAK_ENCRYPTION_CODE,
        jurisdiction: "cross_border",
        frameworks: ["PIPL", "PDPL", "NCA"],
        severity: "critical",
        title: "Weak encryption claim detected",
        description: `Extracted evidence indicates weak encryption posture (${weakFact.value}).`,
        mitigation:
            "Upgrade cryptographic controls to modern baseline (RSA 2048+ or AES-128+), rotate keys, and re-validate data protection controls.",
        penaltyContext:
            "Weak encryption can materially increase enforcement risk under PIPL, PDPL, and NCA security control expectations.",
    };

    assessment.gaps = [newGap, ...assessment.gaps];
    assessment.jurisdictionScores.china = clampScore(
        assessment.jurisdictionScores.china - 10
    );
    assessment.jurisdictionScores.saudiArabia = clampScore(
        assessment.jurisdictionScores.saudiArabia - 10
    );
    assessment.overallScore = clampScore(
        (assessment.jurisdictionScores.china + assessment.jurisdictionScores.saudiArabia) / 2
    );
    assessment.status = scoreToStatus(assessment.overallScore);
    assessment.riskLevel = inferRiskLevel(assessment);
}

function runJudge(vendor: Vendor, facts: ExtractedFact[]): SupplierAssessmentResult {
    const assessment = runDualJurisdictionAssessment(vendor);
    const weakFact = findWeakEncryptionFact(facts);

    if (weakFact) {
        ensureWeakEncryptionGap(assessment, weakFact);
    }

    const recommendationSet = new Set(assessment.recommendations);
    if (weakFact) {
        recommendationSet.add(
            "Execute emergency cryptography remediation and document validated key-management controls before production onboarding."
        );
    }

    assessment.recommendations = Array.from(recommendationSet);
    return assessment;
}

function severityRank(severity: SupplierGapPayload["severity"]): number {
    if (severity === "critical") return 4;
    if (severity === "high") return 3;
    if (severity === "medium") return 2;
    return 1;
}

function runSynthesizer(assessment: SupplierAssessmentResult): string[] {
    const plan = [...assessment.gaps]
        .sort((a, b) => severityRank(b.severity) - severityRank(a.severity))
        .slice(0, 10)
        .map(
            gap =>
                `[${gap.severity.toUpperCase()}] ${gap.title}: ${gap.mitigation} (Frameworks: ${gap.frameworks.join(", ")})`
        );

    plan.push(
        "Build a jurisdiction-specific evidence register for CAC, SDAIA, and NCA review cycles.",
        "Introduce quarterly control re-validation against framework updates and supplier architecture changes.",
        "Require legal sign-off for all critical and high findings prior to vendor onboarding approval."
    );

    return Array.from(new Set(plan));
}

function mergeExtractedFacts(
    baselineFacts: ExtractedFact[],
    additionalFacts: ExtractedFact[]
): ExtractedFact[] {
    const merged: ExtractedFact[] = [];
    const seen = new Set<string>();

    for (const fact of [...baselineFacts, ...additionalFacts]) {
        const key = `${fact.key.toLowerCase()}::${fact.value.toLowerCase()}`;
        if (seen.has(key)) {
            continue;
        }
        seen.add(key);
        merged.push(fact);

        if (merged.length >= 200) {
            break;
        }
    }

    return merged;
}

function mergeRecommendations(existing: string[], additional: string[]): string[] {
    const merged = Array.from(new Set([...additional, ...existing]));
    return merged.slice(0, 120);
}

function runValidator(
    assessment: SupplierAssessmentResult,
    remediationPlan: string[],
    ragControls: RagControl[]
): ValidatorResult {
    const knownFrameworks = new Set(
        [...DEFAULT_KNOWN_FRAMEWORKS, ...ragControls.map(control => control.frameworkCode)].map(
            code => code.toUpperCase()
        )
    );

    const notes: string[] = [];
    for (const gap of assessment.gaps) {
        for (const code of gap.frameworks) {
            if (!knownFrameworks.has(code.toUpperCase())) {
                notes.push(
                    `Unknown framework code in gap ${gap.code}: ${code}.`
                );
            }
        }
    }

    if (remediationPlan.length === 0) {
        notes.push("Remediation plan is empty.");
    }

    if (assessment.gaps.length > 0 && remediationPlan.length < 2) {
        notes.push("Remediation plan is too short for identified gap volume.");
    }

    return {
        passed: notes.length === 0,
        notes,
    };
}

function buildDbPayload(
    assessment: SupplierAssessmentResult,
    remediationPlan: string[],
    ragControls: RagControl[]
) {
    const frameworkAssessmentRows = [
        ...CHINA_FRAMEWORKS.map(code => ({
            frameworkCode: code,
            complianceScore: assessment.jurisdictionScores.china,
            riskLevel: assessment.riskLevel,
            status: assessment.status,
            findings: assessment.gaps
                .filter(gap => gap.frameworks.includes(code))
                .map(gap => `${gap.code}: ${gap.title}`),
            recommendations: remediationPlan,
        })),
        ...SAUDI_FRAMEWORKS.map(code => ({
            frameworkCode: code,
            complianceScore: assessment.jurisdictionScores.saudiArabia,
            riskLevel: assessment.riskLevel,
            status: assessment.status,
            findings: assessment.gaps
                .filter(gap => gap.frameworks.includes(code))
                .map(gap => `${gap.code}: ${gap.title}`),
            recommendations: remediationPlan,
        })),
    ];

    const firstControlByFramework = new Map<string, string>();
    for (const control of ragControls) {
        if (!firstControlByFramework.has(control.frameworkCode)) {
            firstControlByFramework.set(control.frameworkCode, control.controlCode);
        }
    }

    const gapRows = assessment.gaps.flatMap(gap =>
        gap.frameworks.map(frameworkCode => ({
            frameworkCode,
            controlCode: firstControlByFramework.get(frameworkCode) || "",
            gapCode: gap.code,
            gapDescription: gap.description,
            severity: gap.severity,
            remediation: gap.mitigation,
        }))
    );

    return {
        vendorAssessments: frameworkAssessmentRows,
        assessmentGaps: gapRows,
    };
}

export async function executeAssessmentPipeline(
    input: PipelineInput,
    reportStage: StageReporter
): Promise<AiAssessmentReport> {
    const rawDocumentText = input.rawDocumentText?.trim() || "";
    const requestedEngine = input.engine ?? ENV.aiAssessmentEngineDefault;

    reportStage("gatekeeper", "Security Gatekeeper scanning payload.");
    runSecurityGatekeeper(rawDocumentText);

    reportStage("intake", "Intake Clerk classifying submission.");
    const intake = runIntake(input.vendor, rawDocumentText);

    reportStage("extractor", "Extraction agent mapping facts to controls.");
    const externalFacts = await callAgentSwarm<ExtractedFact[]>(
        "frontline/extractor",
        {
            vendor: input.vendor,
            intake,
            rawDocumentText,
        }
    );
    let extractedFacts = externalFacts && externalFacts.length > 0
        ? externalFacts.slice(0, 200)
        : runExtractor(input.vendor, intake);

    reportStage("rag_context", "RAG context assembler retrieving controls.");
    const ragControls = await buildRagContext(extractedFacts);

    reportStage("judge", "Compliance reviewer evaluating mapped facts.");
    const externalAssessment = await callAgentSwarm<SupplierAssessmentResult>(
        "backend/judge",
        {
            vendor: input.vendor,
            extractedFacts,
            ragControls,
        }
    );
    let assessment = externalAssessment || runJudge(input.vendor, extractedFacts);

    reportStage("synthesizer", "Strategic synthesizer drafting remediation plan.");
    let remediationPlan =
        (await callAgentSwarm<string[]>("backend/synthesizer", {
            assessment,
            ragControls,
        })) || runSynthesizer(assessment);

    let validatorNotes: string[] = [];
    let validatorPassed = false;
    let attempts = 0;
    const maxAttempts = Math.max(1, ENV.aiValidatorMaxRetries + 1);

    while (!validatorPassed && attempts < maxAttempts) {
        attempts += 1;
        reportStage("validator", `Validator pass ${attempts} running.`);

        const externalValidation = await callAgentSwarm<ValidatorResult>(
            "backend/validator",
            {
                assessment,
                remediationPlan,
                ragControls,
            }
        );

        const validation =
            externalValidation || runValidator(assessment, remediationPlan, ragControls);
        validatorPassed = validation.passed;
        validatorNotes = validation.notes;

        if (!validatorPassed && attempts < maxAttempts) {
            remediationPlan = runSynthesizer(assessment);
        }
    }

    if (!validatorPassed) {
        throw new Error(
            `Validator rejected report payload after ${attempts} attempt(s): ${validatorNotes.join(
                " "
            )}`
        );
    }

    reportStage("reporter", "Reporter formatting strict JSON output.");
    const reportPayload = {
        version: "1.0" as const,
        generatedAt: new Date().toISOString(),
        inputSummary: {
            vendorId: input.vendor.id,
            source: input.source,
            documentType: intake.documentType,
            tags: intake.tags,
        },
        extractedFacts,
        ragControls,
        assessment,
        remediationPlan,
        validator: {
            passed: validatorPassed,
            attempts,
            notes: validatorNotes,
        },
        dbPayload: buildDbPayload(assessment, remediationPlan, ragControls),
    };

    return aiAssessmentReportSchema.parse(reportPayload);
}
