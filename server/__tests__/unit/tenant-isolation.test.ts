/**
 * Tenant isolation tests.
 *
 * In the test environment DATABASE_URL is unset, so `getDb()` returns null and
 * every store uses its in-memory fallback. These tests exercise that same
 * scoping contract the DB path uses: every read and write is filtered by
 * `organizationId`, so one tenant can never read or mutate another tenant's
 * records — including by guessing/using a foreign record id.
 *
 * This is the automated evidence for the multi-tenant security boundary
 * (Production Gate 3 — Tenant Isolation).
 */

import { describe, it, expect } from "vitest";
import { createApiKey, listApiKeys, revokeApiKey } from "../../api-keys-store";
import { createAsset, listAssets, getAsset } from "../../asset-inventory-store";
import { createRisk, listRisks } from "../../risk-register-store";
import { createAudit, listAudits } from "../../audit-schedule-store";

describe("tenant isolation — API keys", () => {
  it("createApiKey / listApiKeys scope keys to their own organization", async () => {
    const ORG_A = 1001;
    const ORG_B = 1002;

    const a = await createApiKey(ORG_A, null, "A key", '["vendor:read"]', null);
    const b = await createApiKey(ORG_B, null, "B key", '["vendor:read"]', null);

    const aIds = (await listApiKeys(ORG_A)).map(k => k.id);
    const bIds = (await listApiKeys(ORG_B)).map(k => k.id);

    expect(aIds).toContain(a.id);
    expect(aIds).not.toContain(b.id);
    expect(bIds).toContain(b.id);
    expect(bIds).not.toContain(a.id);
  });

  it("listApiKeys never exposes the key hash", async () => {
    const ORG = 1003;
    await createApiKey(ORG, null, "hash test", '["vendor:read"]', null);
    for (const k of await listApiKeys(ORG)) {
      expect(k as Record<string, unknown>).not.toHaveProperty("keyHash");
    }
  });

  it("revokeApiKey cannot revoke another organization's key", async () => {
    const ORG_A = 1004;
    const ORG_B = 1005;
    const a = await createApiKey(
      ORG_A,
      null,
      "A key 2",
      '["vendor:read"]',
      null
    );

    // Org B tries to revoke Org A's key by id — must be rejected.
    expect(await revokeApiKey(ORG_B, a.id)).toBe(false);
    // The key must still be active for Org A.
    expect((await listApiKeys(ORG_A)).map(k => k.id)).toContain(a.id);

    // Org A can revoke its own key.
    expect(await revokeApiKey(ORG_A, a.id)).toBe(true);
    expect((await listApiKeys(ORG_A)).map(k => k.id)).not.toContain(a.id);
  });
});

describe("tenant isolation — asset inventory", () => {
  const baseInput = {
    assetType: "server" as const,
    criticality: "high" as const,
    exposure: "internet_facing" as const,
    status: "active" as const,
  };

  it("createAsset / listAssets scope assets to their own organization", async () => {
    const ORG_A = 1006;
    const ORG_B = 1007;

    const a = await createAsset(ORG_A, { ...baseInput, name: "A asset" }, null);
    const b = await createAsset(ORG_B, { ...baseInput, name: "B asset" }, null);

    const aIds = (await listAssets(ORG_A)).map(x => x.id);
    const bIds = (await listAssets(ORG_B)).map(x => x.id);

    expect(aIds).toContain(a.id);
    expect(aIds).not.toContain(b.id);
    expect(bIds).toContain(b.id);
    expect(bIds).not.toContain(a.id);
  });

  it("getAsset returns null for an asset owned by another organization", async () => {
    const ORG_A = 1008;
    const ORG_B = 1009;
    const b = await createAsset(
      ORG_B,
      { ...baseInput, name: "B asset 2" },
      null
    );

    // Cross-tenant read by id must fail closed.
    expect(await getAsset(ORG_A, b.id)).toBeNull();
    // The owning tenant can still read it.
    expect((await getAsset(ORG_B, b.id))?.id).toBe(b.id);
  });
});

describe("tenant isolation — risk register", () => {
  const baseRisk = {
    category: "operational" as const,
    likelihood: 3,
    impact: 4,
    treatment: "mitigate" as const,
    status: "open" as const,
  };

  it("createRisk / listRisks scope risks to their own organization", async () => {
    const ORG_A = 2001;
    const ORG_B = 2002;
    const a = await createRisk(ORG_A, { ...baseRisk, title: "A risk" });
    const b = await createRisk(ORG_B, { ...baseRisk, title: "B risk" });

    const aIds = (await listRisks(ORG_A)).map(r => r.id);
    const bIds = (await listRisks(ORG_B)).map(r => r.id);

    expect(aIds).toContain(a.id);
    expect(aIds).not.toContain(b.id);
    expect(bIds).toContain(b.id);
    expect(bIds).not.toContain(a.id);
  });
});

describe("tenant isolation — audit schedule", () => {
  const baseAudit = {
    auditType: "internal" as const,
    status: "planned" as const,
    scheduledDate: new Date().toISOString(),
    recurrence: "none" as const,
  };

  it("createAudit / listAudits scope audits to their own organization", async () => {
    const ORG_A = 2003;
    const ORG_B = 2004;
    const a = await createAudit(ORG_A, { ...baseAudit, title: "A audit" });
    const b = await createAudit(ORG_B, { ...baseAudit, title: "B audit" });

    const aIds = (await listAudits(ORG_A)).map(x => x.id);
    const bIds = (await listAudits(ORG_B)).map(x => x.id);

    expect(aIds).toContain(a.id);
    expect(aIds).not.toContain(b.id);
    expect(bIds).toContain(b.id);
    expect(bIds).not.toContain(a.id);
  });
});
