import { describe, it, expect } from "vitest";
import {
  computeExposureScore,
  computeExploitabilityScore,
  computeBusinessImpactScore,
  tierFromScore,
  computeRiskScore,
} from "../../ctem-scoring";

describe("CTEM — computeExposureScore", () => {
  const asset = { isInternetFacing: true, criticalityScore: 8 };
  const criticalVuln = { severity: "critical" as const, isPatched: false };
  const patchedVuln = { severity: "high" as const, isPatched: true };

  it("returns higher score for internet-facing assets", () => {
    const internet = computeExposureScore(
      { isInternetFacing: true, criticalityScore: 5 },
      []
    );
    const internal = computeExposureScore(
      { isInternetFacing: false, criticalityScore: 5 },
      []
    );
    expect(internet).toBeGreaterThan(internal);
  });

  it("returns higher score when unpatched vulns exist", () => {
    const withVuln = computeExposureScore(asset, [criticalVuln]);
    const without = computeExposureScore(asset, []);
    expect(withVuln).toBeGreaterThan(without);
  });

  it("ignores patched vulnerabilities", () => {
    const onlyPatched = computeExposureScore(asset, [patchedVuln]);
    const none = computeExposureScore(asset, []);
    expect(onlyPatched).toBe(none);
  });

  it("returns a score between 0 and 100", () => {
    const score = computeExposureScore(asset, [criticalVuln]);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});

describe("CTEM — computeExploitabilityScore", () => {
  it("returns 0 when no vulns and no simulations", () => {
    const score = computeExploitabilityScore([], []);
    expect(score).toBe(0);
  });

  it("returns higher score when exploits are available", () => {
    const vulnsWith = [{ exploitAvailable: true, isPatched: false }];
    const vulnsWithout = [{ exploitAvailable: false, isPatched: false }];
    const withExploit = computeExploitabilityScore(vulnsWith, []);
    const without = computeExploitabilityScore(vulnsWithout, []);
    expect(withExploit).toBeGreaterThan(without);
  });

  it("factors in simulation success probability", () => {
    const highProb = computeExploitabilityScore([], [{ successProbability: 90 }]);
    const lowProb = computeExploitabilityScore([], [{ successProbability: 10 }]);
    expect(highProb).toBeGreaterThan(lowProb);
  });

  it("returns a score between 0 and 100", () => {
    const score = computeExploitabilityScore(
      [{ exploitAvailable: true, isPatched: false }],
      [{ successProbability: 100 }]
    );
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});

describe("CTEM — computeBusinessImpactScore", () => {
  it("returns higher score for sensitive data", () => {
    const sensitive = computeBusinessImpactScore({
      handlesPersonalData: true,
      handlesCriticalData: true,
      criticalityScore: 5,
    });
    const none = computeBusinessImpactScore({
      handlesPersonalData: false,
      handlesCriticalData: false,
      criticalityScore: 5,
    });
    expect(sensitive).toBeGreaterThan(none);
  });

  it("returns score between 0 and 100", () => {
    const score = computeBusinessImpactScore({
      handlesPersonalData: true,
      handlesCriticalData: true,
      criticalityScore: 10,
    });
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});

describe("CTEM — tierFromScore", () => {
  it("returns critical for scores >= 80", () => {
    expect(tierFromScore(80)).toBe("critical");
    expect(tierFromScore(95)).toBe("critical");
  });

  it("returns high for scores 60-79", () => {
    expect(tierFromScore(60)).toBe("high");
    expect(tierFromScore(79)).toBe("high");
  });

  it("returns medium for scores 40-59", () => {
    expect(tierFromScore(40)).toBe("medium");
    expect(tierFromScore(59)).toBe("medium");
  });

  it("returns low for scores 20-39", () => {
    expect(tierFromScore(20)).toBe("low");
    expect(tierFromScore(39)).toBe("low");
  });

  it("returns low for scores < 40", () => {
    expect(tierFromScore(0)).toBe("low");
    expect(tierFromScore(39)).toBe("low");
  });
});

describe("CTEM — computeRiskScore", () => {
  const asset = {
    id: 1,
    isInternetFacing: true,
    criticalityScore: 7,
    handlesPersonalData: true,
    handlesCriticalData: false,
  };
  const vulns = [{ severity: "high" as const, isPatched: false, exploitAvailable: true }];
  const simulations = [{ successProbability: 60 }];

  it("returns a structured risk score object", () => {
    const result = computeRiskScore(asset, vulns, simulations);
    expect(result.exposureScore).toBeGreaterThan(0);
    expect(result.exploitabilityScore).toBeGreaterThan(0);
    expect(result.businessImpactScore).toBeGreaterThan(0);
    expect(result.finalPriorityScore).toBeGreaterThan(0);
    expect(result.priorityTier).toBeDefined();
    expect(["critical", "high", "medium", "low"]).toContain(
      result.priorityTier
    );
  });

  it("finalPriorityScore is a weighted combination", () => {
    const result = computeRiskScore(asset, vulns, simulations);
    expect(result.finalPriorityScore).toBeGreaterThan(0);
    expect(result.finalPriorityScore).toBeLessThanOrEqual(100);
  });
});
