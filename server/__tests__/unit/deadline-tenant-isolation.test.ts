import { describe, it, expect, vi } from "vitest";

// Force the store's in-memory fallback so the test is deterministic and never
// touches a real database. This exercises the same scoping logic the SQL path
// uses (the bug fixed in completeDeadline was a null-org wildcard).
vi.mock("../../db", () => ({ getDb: async () => null }));

import { createDeadline, completeDeadline } from "../../deadline-store";

describe("deadline tenant isolation", () => {
  it("cannot complete a deadline belonging to another organization", async () => {
    const orgA = 900001;
    const orgB = 900002;

    const a = await createDeadline({
      organizationId: orgA,
      frameworkCode: "PIPL",
      title: "Org A deadline",
      deadlineDate: new Date(Date.now() + 86_400_000),
      jurisdiction: "China",
    });
    const b = await createDeadline({
      organizationId: orgB,
      frameworkCode: "PIPL",
      title: "Org B deadline",
      deadlineDate: new Date(Date.now() + 86_400_000),
      jurisdiction: "China",
    });

    // Cross-tenant completion must be a no-op.
    const cross = await completeDeadline(b.id, orgA);
    expect(cross).toBeNull();

    // The owner can complete their own deadline.
    const own = await completeDeadline(a.id, orgA);
    expect(own?.id).toBe(a.id);
    expect(own?.status).toBe("completed");

    // The other tenant still cannot touch it afterwards.
    const stillDenied = await completeDeadline(a.id, orgB);
    expect(stillDenied).toBeNull();
  });
});
