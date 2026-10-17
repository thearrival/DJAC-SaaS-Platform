import { describe, it, expect } from "vitest";
import {
  assertApiAccess,
  assertSeatCapacity,
  assertVendorCapacity,
} from "../../services/entitlements";

/**
 * In the test environment DATABASE_URL is unset, so getDb() returns null and
 * getOrgEntitlements falls back to trial (Starter) limits. That is exactly the
 * tier we assert against here.
 */
describe("entitlements — trial uses Starter limits", () => {
  it("allows vendors below the cap and blocks at the cap", async () => {
    await expect(assertVendorCapacity(1, 9)).resolves.toBeUndefined();
    await expect(assertVendorCapacity(1, 10)).rejects.toThrow(
      /up to 10 vendors/i
    );
  });

  it("blocks API access on the Starter/trial tier", async () => {
    await expect(assertApiAccess(1)).rejects.toThrow(
      /Professional and Enterprise/i
    );
  });

  it("allows seats below the cap and blocks at the cap", async () => {
    await expect(assertSeatCapacity(1, 2)).resolves.toBeUndefined();
    await expect(assertSeatCapacity(1, 3)).rejects.toThrow(/3 seats/i);
  });
});
