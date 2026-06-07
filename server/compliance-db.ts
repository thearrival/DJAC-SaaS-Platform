import { and, eq, or } from "drizzle-orm";
import {
    assessmentGaps,
    complianceControls,
    controlMappings,
    frameworkRelationships,
    frameworks,
    techStackComponents,
    vendorAssessments,
    vendors,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import { getDb } from "./db";

type MvpRelationshipType =
    | "overlap"
    | "conflict"
    | "coordination"
    | "dependency"
    | "gap";

type MvpSeverity = "critical" | "high" | "medium" | "low";

const RELATIONSHIP_ACTIONS: Record<MvpRelationshipType, string> = {
    overlap: "Recommend unified control implementation.",
    conflict: "Flag for separate infrastructure and data pipelines.",
    coordination: "Recommend single implementation aligned to both frameworks.",
    dependency: "Guide implementation order with prerequisite controls first.",
    gap: "Highlight regulatory blind spots and legal validation points.",
};

const DEFAULT_SEVERITY_BY_TYPE: Record<MvpRelationshipType, MvpSeverity> = {
    overlap: "medium",
    conflict: "critical",
    coordination: "low",
    dependency: "high",
    gap: "high",
};

const SEVERITY_RANK: Record<MvpSeverity, number> = {
    low: 1,
    medium: 2,
    high: 3,
    critical: 4,
};

function normalizeRelationshipType(rawType: string): MvpRelationshipType {
    switch (rawType) {
        case "harmonization":
        case "coordination":
            return "coordination";
        case "overlap":
        case "conflict":
        case "dependency":
        case "gap":
            return rawType;
        default:
            return "overlap";
    }
}

function normalizeSeverity(
    rawSeverity: string | null | undefined,
    relationshipType: MvpRelationshipType
): MvpSeverity {
    if (
        rawSeverity === "critical" ||
        rawSeverity === "high" ||
        rawSeverity === "medium" ||
        rawSeverity === "low"
    ) {
        return rawSeverity;
    }

    return DEFAULT_SEVERITY_BY_TYPE[relationshipType];
}

function enrichRelationship<
    T extends {
        relationshipType: string;
        severity: string | null;
    },
>(row: T) {
    const relationshipType = normalizeRelationshipType(row.relationshipType);
    const severity = normalizeSeverity(row.severity, relationshipType);

    return {
        ...row,
        rawRelationshipType: row.relationshipType,
        relationshipType,
        severity,
        actionRecommendation: RELATIONSHIP_ACTIONS[relationshipType],
    };
}

type FrameworkRow = typeof frameworks.$inferSelect;
type ControlRow = typeof complianceControls.$inferSelect;
type RelationshipRow = typeof frameworkRelationships.$inferSelect;

type ReferenceFramework = {
    code: string;
    name: string;
    country: string;
    description: string;
    scope: string;
    enforcementAuthority: string;
    maxPenalty: string;
};

type ReferenceControl = {
    frameworkCode: string;
    controlCode: string;
    controlName: string;
    category: string;
    description: string;
    requirement: string;
    applicability: string;
};

type ReferenceRelationship = {
    sourceFrameworkCode: string;
    targetFrameworkCode: string;
    relationshipType: string;
    description: string;
    severity: string;
    riskLevel: string;
    mitigation: string;
};

type ComplianceFallbackData = {
    frameworks: FrameworkRow[];
    controls: ControlRow[];
    relationships: RelationshipRow[];
};

let fallbackDataCache: ComplianceFallbackData | null = null;
const referenceCache = new Map<string, { value: unknown; expiresAt: number }>();
const inFlightCacheLoads = new Map<string, Promise<unknown>>();
const MAX_REFERENCE_CACHE_ENTRIES = 500;

function getCachedReference<T>(key: string): T | undefined {
    const entry = referenceCache.get(key);
    if (!entry) return undefined;
    if (Date.now() >= entry.expiresAt) {
        referenceCache.delete(key);
        return undefined;
    }
    return entry.value as T;
}

function setCachedReference<T>(key: string, value: T, ttlMs = ENV.complianceCacheTtlMs): T {
    referenceCache.set(key, {
        value,
        expiresAt: Date.now() + ttlMs,
    });

    if (referenceCache.size > MAX_REFERENCE_CACHE_ENTRIES) {
        const now = Date.now();
        for (const [cacheKey, entry] of referenceCache) {
            if (now >= entry.expiresAt) {
                referenceCache.delete(cacheKey);
            }
        }

        while (referenceCache.size > MAX_REFERENCE_CACHE_ENTRIES) {
            const oldestKey = referenceCache.keys().next().value;
            if (!oldestKey) break;
            referenceCache.delete(oldestKey);
        }
    }

    return value;
}

async function withReferenceCache<T>(
    key: string,
    loader: () => Promise<T>,
    ttlMs = ENV.complianceCacheTtlMs
): Promise<T> {
    const cached = getCachedReference<T>(key);
    if (cached !== undefined) {
        return cached;
    }

    const inFlight = inFlightCacheLoads.get(key) as Promise<T> | undefined;
    if (inFlight) {
        return inFlight;
    }

    const promise = loader()
        .then((value) => setCachedReference(key, value, ttlMs))
        .finally(() => {
            inFlightCacheLoads.delete(key);
        });

    inFlightCacheLoads.set(key, promise as Promise<unknown>);
    return promise;
}

async function loadFallbackData(): Promise<ComplianceFallbackData> {
    if (fallbackDataCache) {
        return fallbackDataCache;
    }

    const modulePath = "../scripts/compliance-reference-data.mjs";
    const referenceModule = (await import(modulePath)) as {
        complianceFrameworks: ReferenceFramework[];
        complianceControls: ReferenceControl[];
        complianceRelationships: ReferenceRelationship[];
    };

    const now = new Date();

    const fallbackFrameworks: FrameworkRow[] = referenceModule.complianceFrameworks.map(
        (framework, index) => ({
            id: index + 1,
            code: framework.code,
            name: framework.name,
            country: framework.country,
            description: framework.description,
            scope: framework.scope,
            enforcementAuthority: framework.enforcementAuthority,
            maxPenalty: framework.maxPenalty,
            createdAt: now,
            updatedAt: now,
        })
    );

    const frameworkIdByCode = new Map(
        fallbackFrameworks.map((framework) => [framework.code, framework.id])
    );

    const fallbackControls: ControlRow[] = [];

    referenceModule.complianceControls.forEach((control, index) => {
        const frameworkId = frameworkIdByCode.get(control.frameworkCode);
        if (!frameworkId) {
            return;
        }

        fallbackControls.push({
            id: index + 1,
            frameworkId,
            controlCode: control.controlCode,
            controlName: control.controlName,
            category: control.category ?? null,
            description: control.description ?? null,
            requirement: control.requirement ?? null,
            applicability: control.applicability ?? null,
            createdAt: now,
            updatedAt: now,
        });
    });

    const fallbackRelationships: RelationshipRow[] = [];

    referenceModule.complianceRelationships.forEach((relationship, index) => {
        const sourceFrameworkId = frameworkIdByCode.get(relationship.sourceFrameworkCode);
        const targetFrameworkId = frameworkIdByCode.get(relationship.targetFrameworkCode);

        if (!sourceFrameworkId || !targetFrameworkId) {
            return;
        }

        fallbackRelationships.push({
            id: index + 1,
            sourceFrameworkId,
            targetFrameworkId,
            relationshipType: relationship.relationshipType as RelationshipRow["relationshipType"],
            description: relationship.description ?? null,
            severity: relationship.severity as RelationshipRow["severity"],
            riskLevel: relationship.riskLevel ?? null,
            mitigation: relationship.mitigation ?? null,
            createdAt: now,
            updatedAt: now,
        });
    });

    fallbackDataCache = {
        frameworks: fallbackFrameworks,
        controls: fallbackControls,
        relationships: fallbackRelationships,
    };

    return fallbackDataCache;
}

/**
 * Compliance Framework Queries
 */

export async function getAllFrameworks() {
    return withReferenceCache("frameworks:all", async () => {
        const db = await getDb();
        if (!db) {
            return (await loadFallbackData()).frameworks;
        }

        const rows = await db.select().from(frameworks);
        const relationshipRows = await db
            .select({ id: frameworkRelationships.id })
            .from(frameworkRelationships)
            .limit(1);

        if (rows.length === 0 || relationshipRows.length === 0) {
            return (await loadFallbackData()).frameworks;
        }

        return rows;
    });
}

export async function getFrameworkByCode(code: string) {
    const db = await getDb();
    if (!db) {
        const fallback = await loadFallbackData();
        return fallback.frameworks.find((framework) => framework.code === code) ?? null;
    }

    const result = await db.select().from(frameworks).where(eq(frameworks.code, code)).limit(1);
    if (result.length > 0) {
        return result[0];
    }

    const fallback = await loadFallbackData();
    return fallback.frameworks.find((framework) => framework.code === code) ?? null;
}

export async function getFrameworksByCountry(country: string) {
    return withReferenceCache(`frameworks:country:${country.toLowerCase()}`, async () => {
        const db = await getDb();
        if (!db) {
            const fallback = await loadFallbackData();
            return fallback.frameworks.filter((framework) => framework.country === country);
        }

        const rows = await db.select().from(frameworks).where(eq(frameworks.country, country));
        if (rows.length > 0) {
            return rows;
        }

        const fallback = await loadFallbackData();
        return fallback.frameworks.filter((framework) => framework.country === country);
    });
}

/**
 * Compliance Controls Queries
 */

export async function getControlsByFramework(frameworkId: number) {
    return withReferenceCache(`controls:framework:${frameworkId}`, async () => {
        const db = await getDb();
        if (!db) {
            const fallback = await loadFallbackData();
            return fallback.controls.filter((control) => control.frameworkId === frameworkId);
        }

        const rows = await db
            .select()
            .from(complianceControls)
            .where(eq(complianceControls.frameworkId, frameworkId));

        if (rows.length > 0) {
            return rows;
        }

        const fallback = await loadFallbackData();
        return fallback.controls.filter((control) => control.frameworkId === frameworkId);
    });
}

export async function getControlsByCategory(category: string) {
    const db = await getDb();
    if (!db) return [];
    return db
        .select()
        .from(complianceControls)
        .where(eq(complianceControls.category, category));
}

export async function getControlByCode(controlCode: string) {
    const db = await getDb();
    if (!db) return null;
    const result = await db
        .select()
        .from(complianceControls)
        .where(eq(complianceControls.controlCode, controlCode))
        .limit(1);
    return result.length > 0 ? result[0] : null;
}

/**
 * Framework Relationships Queries
 */

export async function getFrameworkRelationships(sourceFrameworkId: number) {
    return withReferenceCache(`relationships:framework:${sourceFrameworkId}`, async () => {
        const db = await getDb();
        if (!db) {
            const fallback = await loadFallbackData();
            return fallback.relationships
                .filter((row) => row.sourceFrameworkId === sourceFrameworkId)
                .map(enrichRelationship);
        }

        const rows = await db
            .select()
            .from(frameworkRelationships)
            .where(eq(frameworkRelationships.sourceFrameworkId, sourceFrameworkId));

        if (rows.length > 0) {
            return rows.map(enrichRelationship);
        }

        const fallback = await loadFallbackData();
        return fallback.relationships
            .filter((row) => row.sourceFrameworkId === sourceFrameworkId)
            .map(enrichRelationship);
    });
}

export async function getRelationshipsByType(
    relationshipType:
        | "overlap"
        | "conflict"
        | "coordination"
        | "harmonization"
        | "gap"
        | "dependency"
) {
    const db = await getDb();
    if (!db) return [];

    const rows =
        relationshipType === "coordination" || relationshipType === "harmonization"
            ? await db
                .select()
                .from(frameworkRelationships)
                .where(
                    or(
                        eq(frameworkRelationships.relationshipType, "harmonization" as any),
                        eq(frameworkRelationships.relationshipType, "coordination" as any)
                    )
                )
            : await db
                .select()
                .from(frameworkRelationships)
                .where(eq(frameworkRelationships.relationshipType, relationshipType as any));

    return rows.map(enrichRelationship);
}

export async function getConflictingFrameworks(frameworkId: number) {
    const db = await getDb();
    if (!db) return [];

    const rows = await db
        .select()
        .from(frameworkRelationships)
        .where(
            and(
                eq(frameworkRelationships.sourceFrameworkId, frameworkId),
                eq(frameworkRelationships.relationshipType, "conflict" as any)
            )
        );

    return rows.map(enrichRelationship);
}

export async function getOverlappingFrameworks(frameworkId: number) {
    const db = await getDb();
    if (!db) return [];

    const rows = await db
        .select()
        .from(frameworkRelationships)
        .where(
            and(
                eq(frameworkRelationships.sourceFrameworkId, frameworkId),
                eq(frameworkRelationships.relationshipType, "overlap" as any)
            )
        );

    return rows.map(enrichRelationship);
}

/**
 * Control Mappings Queries
 */

export async function getControlMappings(sourceControlId: number) {
    const db = await getDb();
    if (!db) return [];
    return db
        .select()
        .from(controlMappings)
        .where(eq(controlMappings.sourceControlId, sourceControlId));
}

export async function getEquivalentControls(sourceControlId: number) {
    const db = await getDb();
    if (!db) return [];
    return db
        .select()
        .from(controlMappings)
        .where(
            and(
                eq(controlMappings.sourceControlId, sourceControlId),
                eq(controlMappings.mappingType, "equivalent" as any)
            )
        );
}

/**
 * Vendor Queries
 */

export async function getVendorsByUser(userId: number) {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(vendors).where(eq(vendors.userId, userId));
}

export async function getVendorById(vendorId: number) {
    const db = await getDb();
    if (!db) return null;
    const result = await db
        .select()
        .from(vendors)
        .where(eq(vendors.id, vendorId))
        .limit(1);
    return result.length > 0 ? result[0] : null;
}

/**
 * Tech Stack Queries
 */

export async function getTechStackByVendor(vendorId: number) {
    const db = await getDb();
    if (!db) return [];
    return db
        .select()
        .from(techStackComponents)
        .where(eq(techStackComponents.vendorId, vendorId));
}

/**
 * Vendor Assessment Queries
 */

export async function getAssessmentsByVendor(vendorId: number) {
    const db = await getDb();
    if (!db) return [];
    return db
        .select()
        .from(vendorAssessments)
        .where(eq(vendorAssessments.vendorId, vendorId));
}

export async function getAssessmentsByFramework(frameworkId: number) {
    const db = await getDb();
    if (!db) return [];
    return db
        .select()
        .from(vendorAssessments)
        .where(eq(vendorAssessments.frameworkId, frameworkId));
}

export async function getAssessmentById(assessmentId: number) {
    const db = await getDb();
    if (!db) return null;
    const result = await db
        .select()
        .from(vendorAssessments)
        .where(eq(vendorAssessments.id, assessmentId))
        .limit(1);
    return result.length > 0 ? result[0] : null;
}

/**
 * Assessment Gaps Queries
 */

export async function getGapsByAssessment(assessmentId: number) {
    const db = await getDb();
    if (!db) return [];
    return db
        .select()
        .from(assessmentGaps)
        .where(eq(assessmentGaps.assessmentId, assessmentId));
}

export async function getCriticalGaps(assessmentId: number) {
    const db = await getDb();
    if (!db) return [];
    return db
        .select()
        .from(assessmentGaps)
        .where(
            and(
                eq(assessmentGaps.assessmentId, assessmentId),
                eq(assessmentGaps.severity, "critical" as any)
            )
        );
}

/**
 * Comparison Logic Functions
 */

export async function getComplianceComparison(
    framework1Id: number,
    framework2Id: number
) {
    const cacheKey = `comparison:${Math.min(framework1Id, framework2Id)}:${Math.max(framework1Id, framework2Id)}`;

    return withReferenceCache(cacheKey, async () => {
        const db = await getDb();
        let allFrameworkRows: FrameworkRow[] = [];
        let allControlRows: ControlRow[] = [];
        let allRelationshipRows: RelationshipRow[] = [];

        if (db) {
            allFrameworkRows = await db.select().from(frameworks);
            allControlRows = await db.select().from(complianceControls);
            allRelationshipRows = await db.select().from(frameworkRelationships);
        }

        if (!db || allFrameworkRows.length === 0 || allRelationshipRows.length === 0) {
            const fallback = await loadFallbackData();
            allFrameworkRows = fallback.frameworks;
            allControlRows = fallback.controls;
            allRelationshipRows = fallback.relationships;
        }

        const framework1 = allFrameworkRows.find((framework) => framework.id === framework1Id);
        const framework2 = allFrameworkRows.find((framework) => framework.id === framework2Id);

        if (!framework1 || !framework2) return null;

        const controls1 = allControlRows.filter((control) => control.frameworkId === framework1Id);
        const controls2 = allControlRows.filter((control) => control.frameworkId === framework2Id);

        const rawRelationships = allRelationshipRows.filter(
            (row) =>
                (row.sourceFrameworkId === framework1Id && row.targetFrameworkId === framework2Id) ||
                (row.sourceFrameworkId === framework2Id && row.targetFrameworkId === framework1Id)
        );

        const relationships = rawRelationships
            .map((row) => {
                const enriched = enrichRelationship(row);
                const isReverseDirection =
                    row.sourceFrameworkId === framework2Id && row.targetFrameworkId === framework1Id;

                return {
                    ...enriched,
                    sourceDirection: isReverseDirection ? framework2.code : framework1.code,
                    targetDirection: isReverseDirection ? framework1.code : framework2.code,
                };
            })
            .sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity]);

        return {
            framework1,
            framework2,
            controls1,
            controls2,
            relationships,
            relationshipActions: relationships.map((item) => ({
                type: item.relationshipType,
                severity: item.severity,
                actionRecommendation: item.actionRecommendation,
                mitigation: item.mitigation ?? "No mitigation strategy documented.",
            })),
            penaltyRiskSummary: [
                {
                    frameworkCode: framework1.code,
                    maxPenalty: framework1.maxPenalty,
                },
                {
                    frameworkCode: framework2.code,
                    maxPenalty: framework2.maxPenalty,
                },
            ],
        };
    });
}

export async function getComplianceMatrix() {
    return withReferenceCache("matrix:all", async () => {
        const db = await getDb();
        let allFrameworks: FrameworkRow[] = [];
        let allRelationships: RelationshipRow[] = [];

        if (db) {
            allFrameworks = await db.select().from(frameworks);
            allRelationships = await db.select().from(frameworkRelationships);
        }

        if (!db || allFrameworks.length === 0 || allRelationships.length === 0) {
            const fallback = await loadFallbackData();
            allFrameworks = fallback.frameworks;
            allRelationships = fallback.relationships;
        }

        const codeById = new Map<number, string>(
            allFrameworks.map((framework) => [framework.id, framework.code])
        );

        const matrixMap = new Map<
            string,
            {
                source: string;
                target: string;
                relationships: Set<MvpRelationshipType>;
                actions: Set<string>;
                maxSeverity: MvpSeverity;
            }
        >();

        for (const row of allRelationships) {
            const source = codeById.get(row.sourceFrameworkId);
            const target = codeById.get(row.targetFrameworkId);
            if (!source || !target || source === target) continue;

            const normalized = enrichRelationship(row);
            const key = `${source}->${target}`;

            if (!matrixMap.has(key)) {
                matrixMap.set(key, {
                    source,
                    target,
                    relationships: new Set<MvpRelationshipType>(),
                    actions: new Set<string>(),
                    maxSeverity: normalized.severity,
                });
            }

            const entry = matrixMap.get(key)!;
            entry.relationships.add(normalized.relationshipType);
            entry.actions.add(normalized.actionRecommendation);

            if (SEVERITY_RANK[normalized.severity] > SEVERITY_RANK[entry.maxSeverity]) {
                entry.maxSeverity = normalized.severity;
            }
        }

        return Array.from(matrixMap.values()).map((entry) => ({
            source: entry.source,
            target: entry.target,
            relationships: Array.from(entry.relationships),
            actions: Array.from(entry.actions),
            maxSeverity: entry.maxSeverity,
        }));
    });
}
