import { describe, it, expect } from "vitest";
import {
  listLawKnowledge,
  getLawKnowledgeBySlug,
  searchLawKnowledge,
} from "../../legal-knowledge";

describe("Legal Knowledge", () => {
  it("should return non-empty list of law entries", () => {
    const entries = listLawKnowledge();
    expect(entries.length).toBeGreaterThan(5);
  });

  it("should return valid data structure", () => {
    const entries = listLawKnowledge();
    expect(entries.length).toBeGreaterThan(5);
    expect(Array.isArray(entries)).toBe(true);
  });

  it("should find entry by slug", () => {
    const entries = listLawKnowledge();
    if (entries.length > 0) {
      const first = entries[0];
      const found = getLawKnowledgeBySlug(first.slug);
      expect(found).toBeTruthy();
      expect(found!.slug).toBe(first.slug);
    }
  });

  it("should return null for non-existent slug", () => {
    expect(getLawKnowledgeBySlug("nonexistent-law-slug-xyz")).toBeNull();
  });

  it("should search law knowledge with reasonable results", () => {
    const results = searchLawKnowledge("protection", 10);
    expect(results.length).toBeGreaterThan(0);
  });

  it("should return empty array for nonsense query", () => {
    const results = searchLawKnowledge("xyznonexistentterm99999", 5);
    expect(results.length).toBe(0);
  });

  it("search should respect limit", () => {
    const results = searchLawKnowledge("data", 2);
    expect(results.length).toBeLessThanOrEqual(2);
  });
});
