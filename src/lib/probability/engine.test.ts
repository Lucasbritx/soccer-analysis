import { describe, expect, it } from "vitest";
import { mockFixtures, mockTrends } from "@/lib/mock/fixtures";
import { calculateProbabilities, normalizePercentages } from "@/lib/probability/engine";

describe("normalizePercentages", () => {
  it("returns values that sum to 100", () => {
    const normalized = normalizePercentages([42, 28, 30]);
    expect(normalized.reduce((sum, value) => sum + value, 0)).toBe(100);
  });

  it("handles zero totals safely", () => {
    const normalized = normalizePercentages([0, 0, 0]);
    expect(normalized.every((value) => Number.isFinite(value))).toBe(true);
    expect(normalized.reduce((sum, value) => sum + value, 0)).toBeGreaterThanOrEqual(99);
  });
});

describe("calculateProbabilities", () => {
  it("creates core markets with valid percentages and confidence labels", () => {
    const fixture = mockFixtures[0];
    const bundle = calculateProbabilities(fixture, mockTrends(fixture));

    expect(bundle.markets).toHaveLength(8);
    expect(bundle.markets.every((market) => market.percent >= 1 && market.percent <= 98)).toBe(true);
    expect(bundle.markets.every((market) => ["high", "medium", "low"].includes(market.confidence))).toBe(true);
  });

  it("keeps markets visible when provider statistics are missing", () => {
    const fixture = mockFixtures[0];
    const bundle = calculateProbabilities(fixture, {
      home: { teamId: fixture.home.id },
      away: { teamId: fixture.away.id }
    });

    expect(bundle.markets).toHaveLength(8);
    expect(bundle.warnings).toContain("Some probabilities use league baselines because one or more provider stats were missing.");
    expect(bundle.markets.some((market) => market.missingInputs.length > 0)).toBe(true);
    expect(bundle.markets.some((market) => market.confidence === "low")).toBe(true);
  });
});
