import { and, desc, eq } from "drizzle-orm";
import { assessmentGaps, complianceControls, frameworks, vendorAssessments } from "../../drizzle/schema";
import { getDb } from "../db";
import type { AiAssessmentReport } from "./schemas";

type PersistResult = {
    savedAssessments: number;
    savedGaps: number;
    skipped: boolean;
};

export async function persistAssessmentReport(
    report: AiAssessmentReport,
    shouldPersist: boolean
): Promise<PersistResult> {
    if (!shouldPersist) {
        return {
            savedAssessments: 0,
            savedGaps: 0,
            skipped: true,
        };
    }

    if (report.assessment.vendorId <= 0) {
        return {
            savedAssessments: 0,
            savedGaps: 0,
            skipped: true,
        };
    }

    const db = await getDb();
    if (!db) {
        return {
            savedAssessments: 0,
            savedGaps: 0,
            skipped: true,
        };
    }

    const frameworkRows = await db.select().from(frameworks);
    const frameworkIdByCode = new Map(
        frameworkRows.map(row => [row.code.toUpperCase(), row.id] as const)
    );

    const assessmentIdByFramework = new Map<string, number>();
    const insertedFrameworks = new Set<string>();
    let savedAssessments = 0;

    for (const row of report.dbPayload.vendorAssessments) {
        const frameworkCode = row.frameworkCode.toUpperCase();
        const frameworkId = frameworkIdByCode.get(frameworkCode);
        if (!frameworkId) continue;

        const findingsJson = JSON.stringify(row.findings);
        const recommendationsJson = JSON.stringify(row.recommendations);

        const latestExisting = await db
            .select()
            .from(vendorAssessments)
            .where(
                and(
                    eq(vendorAssessments.vendorId, report.assessment.vendorId),
                    eq(vendorAssessments.frameworkId, frameworkId)
                )
            )
            .orderBy(
                desc(vendorAssessments.assessmentDate),
                desc(vendorAssessments.id)
            )
            .limit(1);

        const existing = latestExisting[0];
        if (
            existing &&
            existing.complianceScore === row.complianceScore &&
            existing.riskLevel === row.riskLevel &&
            existing.status === row.status &&
            (existing.findings ?? "") === findingsJson &&
            (existing.recommendations ?? "") === recommendationsJson
        ) {
            assessmentIdByFramework.set(frameworkCode, existing.id);
            continue;
        }

        const insertResult = await db.insert(vendorAssessments).values({
            vendorId: report.assessment.vendorId,
            frameworkId,
            complianceScore: row.complianceScore,
            riskLevel: row.riskLevel,
            status: row.status,
            findings: findingsJson,
            recommendations: recommendationsJson,
        });

        const assessmentId = Number(insertResult[0]?.insertId ?? 0);
        if (assessmentId > 0) {
            assessmentIdByFramework.set(frameworkCode, assessmentId);
            insertedFrameworks.add(frameworkCode);
        }

        savedAssessments += 1;
    }

    const controlCache = new Map<number, Array<{ id: number; controlCode: string }>>();
    let savedGaps = 0;

    for (const gap of report.dbPayload.assessmentGaps) {
        const frameworkCode = gap.frameworkCode.toUpperCase();
        const frameworkId = frameworkIdByCode.get(frameworkCode);
        const assessmentId = assessmentIdByFramework.get(frameworkCode);

        if (!frameworkId || !assessmentId || !insertedFrameworks.has(frameworkCode)) {
            continue;
        }

        let controls = controlCache.get(frameworkId);
        if (!controls) {
            const rows = await db
                .select({ id: complianceControls.id, controlCode: complianceControls.controlCode })
                .from(complianceControls)
                .where(eq(complianceControls.frameworkId, frameworkId));

            controls = rows;
            controlCache.set(frameworkId, controls);
        }

        if (!controls || controls.length === 0) {
            continue;
        }

        const matchedControl =
            controls.find(
                control =>
                    control.controlCode.toLowerCase() === gap.controlCode.toLowerCase() &&
                    gap.controlCode.trim().length > 0
            ) || controls[0];

        await db.insert(assessmentGaps).values({
            assessmentId,
            controlId: matchedControl.id,
            gapDescription: `${gap.gapCode}: ${gap.gapDescription}`,
            severity: gap.severity,
            remediation: gap.remediation,
            estimatedRemediationCost: null,
        });

        savedGaps += 1;
    }

    return {
        savedAssessments,
        savedGaps,
        skipped: false,
    };
}
