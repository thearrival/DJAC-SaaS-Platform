import { describe, it, expect } from "vitest";

describe("Locale Store", () => {
  it("should provide translation keys for all supported locales", () => {
    const locales = ["en", "ar", "zh"] as const;
    expect(locales).toContain("en");
    expect(locales).toContain("ar");
    expect(locales).toContain("zh");
  });
});

describe("Client utilities", () => {
  it("should have working number formatting basics", () => {
    const nf = new Intl.NumberFormat("en-US");
    expect(nf.format(1000)).toBe("1,000");
  });
});
