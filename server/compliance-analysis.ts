import { eq, and } from "drizzle-orm";
import { getDb } from "./db";
import { frameworks, frameworkRelationships, complianceControls } from "../drizzle/schema";

export async function getControlCategoryHeatmap() {
  const db = await getDb();

  // ── Static fallback so the page works even without a DB ──────────────────
  const staticFallback = [
    { frameworkId: 1, frameworkCode: "PDPL", frameworkName: "Saudi PDPL", category: "Consent & Transparency", count: 5 },
    { frameworkId: 1, frameworkCode: "PDPL", frameworkName: "Saudi PDPL", category: "Data Subject Rights", count: 4 },
    { frameworkId: 1, frameworkCode: "PDPL", frameworkName: "Saudi PDPL", category: "Data Security", count: 3 },
    { frameworkId: 1, frameworkCode: "PDPL", frameworkName: "Saudi PDPL", category: "Data Transfer", count: 2 },
    { frameworkId: 1, frameworkCode: "PDPL", frameworkName: "Saudi PDPL", category: "Governance", count: 3 },
    { frameworkId: 2, frameworkCode: "PIPL", frameworkName: "China PIPL", category: "Consent & Transparency", count: 6 },
    { frameworkId: 2, frameworkCode: "PIPL", frameworkName: "China PIPL", category: "Data Subject Rights", count: 5 },
    { frameworkId: 2, frameworkCode: "PIPL", frameworkName: "China PIPL", category: "Data Security", count: 4 },
    { frameworkId: 2, frameworkCode: "PIPL", frameworkName: "China PIPL", category: "Data Transfer", count: 3 },
    { frameworkId: 2, frameworkCode: "PIPL", frameworkName: "China PIPL", category: "Governance", count: 2 },
    { frameworkId: 3, frameworkCode: "NCA-ECC", frameworkName: "NCA ECC", category: "Data Security", count: 7 },
    { frameworkId: 3, frameworkCode: "NCA-ECC", frameworkName: "NCA ECC", category: "Risk Management", count: 5 },
    { frameworkId: 3, frameworkCode: "NCA-ECC", frameworkName: "NCA ECC", category: "Network Security", count: 6 },
    { frameworkId: 3, frameworkCode: "NCA-ECC", frameworkName: "NCA ECC", category: "Access Control", count: 4 },
    { frameworkId: 3, frameworkCode: "NCA-ECC", frameworkName: "NCA ECC", category: "Governance", count: 3 },
    { frameworkId: 4, frameworkCode: "CSL", frameworkName: "China CSL", category: "Data Security", count: 5 },
    { frameworkId: 4, frameworkCode: "CSL", frameworkName: "China CSL", category: "Network Security", count: 4 },
    { frameworkId: 4, frameworkCode: "CSL", frameworkName: "China CSL", category: "Risk Management", count: 3 },
    { frameworkId: 4, frameworkCode: "CSL", frameworkName: "China CSL", category: "Incident Response", count: 4 },
    { frameworkId: 4, frameworkCode: "CSL", frameworkName: "China CSL", category: "Governance", count: 2 },
  ];

  if (!db) return staticFallback;

  try {
    const allFrameworks = await db.select().from(frameworks);
    const allControls = await db.select().from(complianceControls);

    if (!allControls.length) return staticFallback;

    // Aggregate (frameworkId × category) → count
    const countMap = new Map<string, number>();
    for (const ctrl of allControls) {
      const cat = ctrl.category ?? "Uncategorized";
      const key = `${ctrl.frameworkId}::${cat}`;
      countMap.set(key, (countMap.get(key) ?? 0) + 1);
    }

    const fwMap = new Map(allFrameworks.map((f) => [f.id, f]));
    const rows: { frameworkId: number; frameworkCode: string; frameworkName: string; category: string; count: number }[] = [];

    countMap.forEach((count, key) => {
      const [fwIdStr, category] = key.split("::");
      const fw = fwMap.get(Number(fwIdStr));
      if (!fw) return;
      rows.push({ frameworkId: fw.id, frameworkCode: fw.code, frameworkName: fw.name, category, count });
    });

    return rows.sort((a, b) => a.frameworkCode.localeCompare(b.frameworkCode) || a.category.localeCompare(b.category));
  } catch {
    return staticFallback;
  }
}

const RELATIONSHIP_ACTIONS = {
  overlap: "Recommend unified control implementation.",
  conflict: "Flag for separate infrastructure and data pipelines.",
  coordination: "Recommend single implementation aligned to both frameworks.",
  dependency: "Guide implementation order with prerequisite controls first.",
  gap: "Highlight regulatory blind spots and legal validation points.",
} as const;

function normalizeRelationshipType(type: string): keyof typeof RELATIONSHIP_ACTIONS {
  if (type === "harmonization") return "coordination";
  if (type === "coordination") return "coordination";
  if (type === "overlap") return "overlap";
  if (type === "conflict") return "conflict";
  if (type === "dependency") return "dependency";
  if (type === "gap") return "gap";
  return "overlap";
}

export async function getAdvancedComparison(framework1Id: number, framework2Id: number) {
  const db = await getDb();
  if (!db) return null;

  const fw1 = await db.select().from(frameworks).where(eq(frameworks.id, framework1Id)).limit(1);
  const fw2 = await db.select().from(frameworks).where(eq(frameworks.id, framework2Id)).limit(1);

  if (!fw1.length || !fw2.length) return null;

  const controls1 = await db.select().from(complianceControls).where(eq(complianceControls.frameworkId, framework1Id));
  const controls2 = await db.select().from(complianceControls).where(eq(complianceControls.frameworkId, framework2Id));

  const relationshipsRaw = await db
    .select()
    .from(frameworkRelationships)
    .where(
      and(
        eq(frameworkRelationships.sourceFrameworkId, framework1Id),
        eq(frameworkRelationships.targetFrameworkId, framework2Id)
      )
    );

  const relationships = relationshipsRaw.map((row) => {
    const relationshipType = normalizeRelationshipType(row.relationshipType);
    return {
      ...row,
      rawRelationshipType: row.relationshipType,
      relationshipType,
      actionRecommendation: RELATIONSHIP_ACTIONS[relationshipType],
    };
  });

  const overlappingControls = controls1.filter((c1) =>
    controls2.some((c2) => c1.category === c2.category)
  );

  return {
    framework1: fw1[0],
    framework2: fw2[0],
    controls1: controls1.length,
    controls2: controls2.length,
    overlappingControls: overlappingControls.length,
    relationships: relationships,
    complianceScore: calculateComplianceScore(relationships),
    riskLevel: calculateRiskLevel(relationships),
    insights: generateInsights(fw1[0], fw2[0], relationships),
    penaltyRiskSummary: [
      { frameworkCode: fw1[0].code, maxPenalty: fw1[0].maxPenalty },
      { frameworkCode: fw2[0].code, maxPenalty: fw2[0].maxPenalty },
    ],
  };
}

export async function getVulnerabilityAnalysis(framework1Id: number, framework2Id: number) {
  const db = await getDb();
  if (!db) return null;

  const relationships = await db
    .select()
    .from(frameworkRelationships)
    .where(
      and(
        eq(frameworkRelationships.sourceFrameworkId, framework1Id),
        eq(frameworkRelationships.targetFrameworkId, framework2Id)
      )
    );

  const vulnerabilities = relationships.map((rel) => ({
    type: rel.relationshipType,
    severity: rel.severity,
    mitigation: rel.mitigation,
    description: rel.description,
  }));

  return {
    totalVulnerabilities: vulnerabilities.length,
    criticalCount: vulnerabilities.filter((v) => v.severity === "critical").length,
    highCount: vulnerabilities.filter((v) => v.severity === "high").length,
    mediumCount: vulnerabilities.filter((v) => v.severity === "medium").length,
    lowCount: vulnerabilities.filter((v) => v.severity === "low").length,
    vulnerabilities: vulnerabilities,
    overallRisk: calculateOverallRisk(vulnerabilities),
  };
}

export async function getRelationshipHeatmap() {
  const db = await getDb();
  if (!db) return null;

  const allFrameworks = await db.select().from(frameworks);
  const allRelationships = await db.select().from(frameworkRelationships);

  const heatmapData = allFrameworks.map((fw1) =>
    allFrameworks.map((fw2) => {
      if (fw1.id === fw2.id) return { source: fw1.code, target: fw2.code, value: 0, type: "self" };

      const rel = allRelationships.find(
        (r) => r.sourceFrameworkId === fw1.id && r.targetFrameworkId === fw2.id
      );

      if (!rel) return { source: fw1.code, target: fw2.code, value: 0, type: "none" };

      const value =
        rel.severity === "critical"
          ? 5
          : rel.severity === "high"
            ? 4
            : rel.severity === "medium"
              ? 3
              : rel.severity === "low"
                ? 2
                : 1;

      return {
        source: fw1.code,
        target: fw2.code,
        value: value,
        type: rel.relationshipType,
        severity: rel.severity,
      };
    })
  );

  return heatmapData.flat();
}

function calculateComplianceScore(relationships: any[]): number {
  if (!relationships.length) return 100;

  const totalScore = relationships.reduce((score, rel) => {
    if (rel.relationshipType === "overlap") return score + 25;
    if (rel.relationshipType === "coordination") return score + 20;
    if (rel.relationshipType === "dependency") return score + 15;
    if (rel.relationshipType === "conflict") return score - 30;
    if (rel.relationshipType === "gap") return score - 25;
    return score;
  }, 100);

  return Math.max(0, Math.min(100, totalScore));
}

function calculateRiskLevel(relationships: any[]): string {
  const criticalCount = relationships.filter((r) => r.severity === "critical").length;
  const highCount = relationships.filter((r) => r.severity === "high").length;

  if (criticalCount > 0) return "critical";
  if (criticalCount === 0 && highCount > 2) return "high";
  if (highCount > 0) return "medium";
  return "low";
}

function calculateOverallRisk(vulnerabilities: any[]): string {
  const criticalCount = vulnerabilities.filter((v) => v.severity === "critical").length;
  const highCount = vulnerabilities.filter((v) => v.severity === "high").length;

  if (criticalCount > 1) return "CRITICAL - Immediate action required";
  if (criticalCount === 1 || highCount > 2) return "HIGH - Urgent attention needed";
  if (highCount > 0) return "MEDIUM - Plan remediation";
  return "LOW - Monitor and maintain";
}

function generateInsights(fw1: any, fw2: any, relationships: any[]): string[] {
  const insights: string[] = [];

  const conflicts = relationships.filter((r) => r.relationshipType === "conflict");
  const overlaps = relationships.filter((r) => r.relationshipType === "overlap");
  const gaps = relationships.filter((r) => r.relationshipType === "gap");
  const coordinations = relationships.filter((r) => r.relationshipType === "coordination");

  if (conflicts.length > 0) {
    insights.push(
      `⚠️ CRITICAL: ${conflicts.length} conflicting requirement(s) between ${fw1.code} and ${fw2.code}. Separate infrastructure may be required.`
    );
  }

  if (overlaps.length > 2) {
    insights.push(
      `✓ OPPORTUNITY: ${overlaps.length} overlapping requirements can be harmonized with unified controls.`
    );
  }

  if (gaps.length > 0) {
    insights.push(
      `⚠️ GAP: ${gaps.length} gap(s) identified. Mutual recognition between authorities is not guaranteed.`
    );
  }

  if (fw1.country !== fw2.country) {
    insights.push(
      `🌍 CROSS-BORDER: Operating in both ${fw1.country} and ${fw2.country} requires dual compliance infrastructure.`
    );
  }

  if (coordinations.length > 0) {
    insights.push(`✓ COORDINATED: ${coordinations.length} coordination opportunity(ies) identified for aligned implementation.`);
  }

  if (conflicts.length === 0 && overlaps.length > 0) {
    insights.push(`✓ COMPATIBLE: Frameworks are largely compatible with proper controls implementation.`);
  }

  return insights;
}
