import { describe, it, expect, vi, beforeEach } from "vitest";
import { getOnboardingIntelligence } from "../../onboarding-service";

/**
 * The owner-console onboarding funnel used to aggregate from
 * "onboarding_progress", which is keyed on users.id ONLY. Every local
 * (email/password) user — the platform's primary auth path — has no row there,
 * so the funnel reported near-zero totals while real users were onboarded.
 * "newUsers" had the mirror-image bug: it counted localUsers only and ignored
 * OAuth signups.
 *
 * These tests capture the SQL actually issued so neither regression can return.
 * The mock lives in its own file on purpose: stubbing the database here would
 * change the behaviour asserted by onboarding-service.test.ts.
 */
const executed: string[] = [];

vi.mock("../../db", () => ({
  getDb: async () => ({
    execute: async (query: unknown) => {
      let text: string;
      try {
        text = String(query);
        if (!text || text === "[object Object]") {
          text = JSON.stringify(
            (query as { queryChunks?: unknown })?.queryChunks ?? query
          );
        }
      } catch {
        text = JSON.stringify(
          (query as { queryChunks?: unknown })?.queryChunks ?? query
        );
      }
      executed.push(text);
      return { rows: [] };
    },
  }),
}));

// The captured payload is drizzle's queryChunks JSON, so quoted identifiers are
// escaped ("users" -> \"users\"). Unescape to assert on real SQL text.
const allSql = () => executed.join("\n").replace(/\\"/g, '"');

describe("owner-console onboarding aggregates", () => {
  beforeEach(() => {
    executed.length = 0;
  });

  it("derives the funnel from dual-identity events, not the OAuth-only progress table", async () => {
    await getOnboardingIntelligence(30);
    const sql = allSql();

    expect(executed.length).toBeGreaterThan(0);
    expect(sql).toContain("onboarding_events");
    expect(sql).not.toContain("onboarding_progress");
    expect(sql).toContain("user_id");
    expect(sql).toContain("local_user_id");
  });

  it("counts new signups across both local and OAuth identities", async () => {
    await getOnboardingIntelligence(30);
    const sql = allSql();
    expect(sql).toContain("localUsers");
    expect(sql).toContain('"users"');
  });

  it("degrades to a valid empty aggregate shape instead of throwing", async () => {
    const result = await getOnboardingIntelligence(30);
    expect(result.totals).toEqual({});
    expect(result.byObjective).toEqual([]);
    expect(result.byIndustry).toEqual([]);
    expect(result.byModule).toEqual([]);
  });

  it("clamps the reporting window instead of trusting the caller", async () => {
    await getOnboardingIntelligence(9999);
    const sql = allSql();
    // days is clamped to <= 365 before it is interpolated into the interval.
    expect(sql).not.toContain("9999");
  });
});
