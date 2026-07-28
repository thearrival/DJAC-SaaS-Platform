import { describe, it, expect } from "vitest";

describe("DB Retry Backoff", () => {
  const DB_RETRY_BACKOFF_MIN_MS = 1_000;
  const DB_RETRY_BACKOFF_MAX_MS = 60_000;

  const getBackoffDelay = (consecutiveFailures: number): number => {
    const base =
      DB_RETRY_BACKOFF_MIN_MS * Math.pow(2, Math.min(consecutiveFailures, 8));
    const capped = Math.min(base, DB_RETRY_BACKOFF_MAX_MS);
    const jitter = Math.random() * 0.3 * capped;
    return Math.floor(capped + jitter);
  };

  it("should start at ~1000ms for first failure", () => {
    for (let i = 0; i < 100; i++) {
      const delay = getBackoffDelay(0);
      expect(delay).toBeGreaterThanOrEqual(1000);
      expect(delay).toBeLessThanOrEqual(1300);
    }
  });

  it("should double on each subsequent failure up to 8 failures", () => {
    const delays: number[] = [];
    for (let i = 0; i < 100; i++) {
      const d0 = getBackoffDelay(0);
      const d1 = getBackoffDelay(1);
      expect(d1).toBeGreaterThanOrEqual(d0);
      const d2 = getBackoffDelay(2);
      expect(d2).toBeGreaterThanOrEqual(d1);
      const d3 = getBackoffDelay(3);
      expect(d3).toBeGreaterThanOrEqual(d2);
      delays.push(d0, d1, d2, d3);
    }
    const avgFirst =
      delays.filter((_, i) => i % 4 === 0).reduce((a, b) => a + b, 0) / 100;
    const avgSecond =
      delays.filter((_, i) => i % 4 === 1).reduce((a, b) => a + b, 0) / 100;
    const avgThird =
      delays.filter((_, i) => i % 4 === 2).reduce((a, b) => a + b, 0) / 100;
    const avgFourth =
      delays.filter((_, i) => i % 4 === 3).reduce((a, b) => a + b, 0) / 100;
    expect(avgSecond / avgFirst).toBeGreaterThanOrEqual(1.5);
    expect(avgThird / avgSecond).toBeGreaterThanOrEqual(1.5);
    expect(avgFourth / avgThird).toBeGreaterThanOrEqual(1.5);
  });

  it("should cap at 60s", () => {
    for (let i = 0; i < 100; i++) {
      const delay = getBackoffDelay(100);
      expect(delay).toBeLessThanOrEqual(DB_RETRY_BACKOFF_MAX_MS * 1.3);
    }
  });

  it("should never be less than min", () => {
    for (let i = 0; i < 100; i++) {
      const delay = getBackoffDelay(0);
      expect(delay).toBeGreaterThanOrEqual(DB_RETRY_BACKOFF_MIN_MS);
    }
  });

  it("should have jitter varying the result", () => {
    const results = new Set<number>();
    for (let i = 0; i < 50; i++) {
      results.add(getBackoffDelay(0));
    }
    expect(results.size).toBeGreaterThan(1);
  });

  it("should plateau around same order of magnitude after 8 failures", () => {
    const delays8 = Array.from({ length: 20 }, () => getBackoffDelay(8));
    const delays9 = Array.from({ length: 20 }, () => getBackoffDelay(9));
    const avg8 = delays8.reduce((a, b) => a + b, 0) / delays8.length;
    const avg9 = delays9.reduce((a, b) => a + b, 0) / delays9.length;
    const ratio = Math.max(avg8, avg9) / Math.min(avg8, avg9);
    expect(ratio).toBeLessThanOrEqual(2);
  });
});
