import { describe, it, expect } from "vitest";
import {
  backupFileName,
  selectStaleBackups,
  isSameDatabase,
  BACKUP_KEEP,
  BACKUP_TABLES,
} from "../../_core/backup";

describe("backup retention", () => {
  it("names files so they sort chronologically", () => {
    const a = backupFileName("2026-10-01T03:00:00.000Z");
    const b = backupFileName("2026-10-02T03:00:00.000Z");
    expect(a).toBe("djac-2026-10-01T030000000Z.json");
    expect([b, a].sort()).toEqual([a, b]); // lexical sort == chronological
  });

  it("keeps the newest N and returns the rest, oldest first", () => {
    const names = [
      "djac-20261005T030000000Z.json",
      "djac-20261001T030000000Z.json",
      "djac-20261004T030000000Z.json",
      "djac-20261003T030000000Z.json",
      "djac-20261002T030000000Z.json",
    ];
    const stale = selectStaleBackups(names, 3);
    expect(stale).toEqual([
      "djac-20261001T030000000Z.json",
      "djac-20261002T030000000Z.json",
    ]);
  });

  it("returns nothing when under the retention window", () => {
    expect(selectStaleBackups(["a.json", "b.json"], 14)).toEqual([]);
  });

  it("handles an empty list and a zero keep", () => {
    expect(selectStaleBackups([], 5)).toEqual([]);
    expect(selectStaleBackups(["a.json", "b.json"], 0).length).toBe(2);
  });

  it("has a sensible default retention and a non-empty table set", () => {
    expect(BACKUP_KEEP).toBeGreaterThanOrEqual(7);
    expect(BACKUP_TABLES).toContain("organizations");
    expect(BACKUP_TABLES).toContain("onboarding_responses");
  });
});

describe("restore-drill production guard", () => {
  const prod =
    "postgresql://postgres:pw@db.gcsoeumdjrejfxuovfcw.supabase.co:5432/postgres";

  it("detects the same database across differing query strings", () => {
    expect(isSameDatabase(prod, prod + "?sslmode=require")).toBe(true);
  });

  it("treats a different host or database as distinct", () => {
    expect(
      isSameDatabase(
        prod,
        "postgresql://postgres:pw@db.gcsoeumdjrejfxuovfcw.supabase.co:5432/scratch"
      )
    ).toBe(false);
    expect(
      isSameDatabase(
        prod,
        "postgresql://postgres:pw@scratch.example.com:5432/postgres"
      )
    ).toBe(false);
  });

  it("is false when either side is missing or unparseable", () => {
    expect(isSameDatabase(undefined, prod)).toBe(false);
    expect(isSameDatabase(prod, undefined)).toBe(false);
    expect(isSameDatabase("not-a-url", prod)).toBe(false);
  });
});
