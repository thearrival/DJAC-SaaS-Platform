/**
 * Stripe billing-event idempotency regression tests.
 *
 * Guards the retry contract: only a fully-applied ("success") event is a
 * duplicate; a "pending" row means a prior attempt failed part-way and the
 * event must be reprocessed so Stripe retries can heal subscription state.
 */

import { describe, it, expect } from "vitest";
import { isDuplicateBillingEvent } from "../../stripe-webhook";

function dbWithRow(
  row: { id: number; status: string } | null
): Parameters<typeof isDuplicateBillingEvent>[0] {
  return {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: async () => (row ? [row] : []),
        }),
      }),
    }),
  } as unknown as Parameters<typeof isDuplicateBillingEvent>[0];
}

describe("stripe billing event idempotency", () => {
  it("treats a fully-applied (success) event as a duplicate", async () => {
    const db = dbWithRow({ id: 1, status: "success" });
    await expect(isDuplicateBillingEvent(db, "evt_1")).resolves.toBe(true);
  });

  it("reprocesses a pending event (prior attempt failed part-way)", async () => {
    const db = dbWithRow({ id: 1, status: "pending" });
    await expect(isDuplicateBillingEvent(db, "evt_1")).resolves.toBe(false);
  });

  it("processes an unseen event", async () => {
    const db = dbWithRow(null);
    await expect(isDuplicateBillingEvent(db, "evt_new")).resolves.toBe(false);
  });
});
