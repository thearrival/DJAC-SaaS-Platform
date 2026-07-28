import { describe, expect, it } from "vitest";
import {
  GLOBAL_FRAMEWORK_PACKS,
  GLOBAL_INDUSTRY_EDITIONS,
  GLOBAL_AI_AGENTS,
  buildGlobalGraphSeed,
  getGlobalFrameworkPackByCode,
  listGlobalAuthorities,
  listGlobalFrameworkCategories,
  listGlobalFrameworkPacksByCategory,
  listGlobalFrameworkPacksByJurisdiction,
  listGlobalJurisdictions,
  getGlobalRegistrySummary,
  listGlobalFrameworkPacksByRegion,
  searchGlobalRegistry,
} from "../../global-compliance-registry";

describe("Global compliance registry", () => {
  it("should expose a large cross-jurisdiction framework catalog", () => {
    expect(GLOBAL_FRAMEWORK_PACKS.length).toBeGreaterThan(40);
    expect(getGlobalFrameworkPackByCode("GDPR")?.jurisdiction).toBe(
      "European Union"
    );
    expect(getGlobalFrameworkPackByCode("NIST-AI-RMF")?.region).toBe(
      "North America"
    );
    expect(
      listGlobalFrameworkPacksByRegion("Middle East").length
    ).toBeGreaterThan(5);
  });

  it("should expose industry editions and AI agent catalogs", () => {
    expect(GLOBAL_INDUSTRY_EDITIONS.length).toBe(13);
    expect(GLOBAL_AI_AGENTS.length).toBeGreaterThanOrEqual(10);
    expect(
      GLOBAL_INDUSTRY_EDITIONS.some(edition => edition.code === "djac-ai")
    ).toBe(true);
    expect(
      GLOBAL_AI_AGENTS.some(agent => agent.code === "compliance-copilot")
    ).toBe(true);
  });

  it("should build a non-empty graph seed and summary", () => {
    const graph = buildGlobalGraphSeed();
    const summary = getGlobalRegistrySummary();

    expect(graph.nodes.length).toBe(summary.graphNodes);
    expect(graph.edges.length).toBe(summary.graphEdges);
    expect(summary.regions).toBe(7);
    expect(summary.jurisdictions).toBeGreaterThan(20);
    expect(summary.categories).toBeGreaterThan(10);
    expect(summary.authorities).toBeGreaterThan(10);
    expect(summary.frameworks).toBe(GLOBAL_FRAMEWORK_PACKS.length);
    expect(summary.editions).toBe(GLOBAL_INDUSTRY_EDITIONS.length);
    expect(summary.agents).toBe(GLOBAL_AI_AGENTS.length);
  });

  it("should expose jurisdictions, categories, and authorities for faceted navigation", () => {
    const jurisdictions = listGlobalJurisdictions();
    const categories = listGlobalFrameworkCategories();
    const authorities = listGlobalAuthorities();

    expect(jurisdictions).toContain("United States");
    expect(jurisdictions).toContain("European Union");
    expect(categories).toContain("privacy");
    expect(authorities).toContain("NIST");
    expect(
      listGlobalFrameworkPacksByJurisdiction("United States").length
    ).toBeGreaterThan(10);
    expect(
      listGlobalFrameworkPacksByCategory("privacy").length
    ).toBeGreaterThan(5);
  });

  it("should support search across frameworks, editions, and agents", () => {
    const result = searchGlobalRegistry("cloud", 10);

    expect(result.frameworks.length).toBeGreaterThan(0);
    expect(result.editions.length).toBeGreaterThan(0);
    expect(result.agents.length).toBeGreaterThan(0);
  });
});
