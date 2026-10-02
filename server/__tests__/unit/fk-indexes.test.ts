import { describe, it, expect } from "vitest";
import { FK_INDEXES, buildCreateIndexSql } from "../../_core/fk-indexes";

describe("foreign-key index bootstrap", () => {
  it("has a non-empty curated index set", () => {
    expect(FK_INDEXES.length).toBeGreaterThan(10);
  });

  it("uses unique index names", () => {
    const names = FK_INDEXES.map(i => i.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("every entry has a table and at least one column", () => {
    for (const idx of FK_INDEXES) {
      expect(idx.table.length, idx.name).toBeGreaterThan(0);
      expect(idx.columns.length, idx.name).toBeGreaterThan(0);
    }
  });

  it("creates indexes idempotently (IF NOT EXISTS)", () => {
    const built = JSON.stringify(buildCreateIndexSql(FK_INDEXES[0]));
    expect(built).toContain("IF NOT EXISTS");
    expect(built).toContain("CREATE INDEX");
  });

  it("quotes identifiers so mixed-case table/column names are safe", () => {
    const idx = FK_INDEXES.find(
      i => i.name === "userOnboarding_localUserId_idx"
    );
    expect(idx).toBeTruthy();
    const built = JSON.stringify(buildCreateIndexSql(idx!));
    expect(built).toContain("userOnboarding");
    expect(built).toContain("localUserId");
  });
});
