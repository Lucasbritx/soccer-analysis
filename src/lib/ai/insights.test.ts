import { describe, expect, it } from "vitest";
import { fallbackInsight, parseAIInsight } from "@/lib/ai/insights";
import { mockFixtures, mockTrends } from "@/lib/mock/fixtures";
import { calculateProbabilities } from "@/lib/probability/engine";

describe("parseAIInsight", () => {
  it("parses valid structured AI output", () => {
    const parsed = parseAIInsight(
      JSON.stringify({
        summary: "Balanced match with goal signals.",
        keySignals: ["Home form is strong"],
        riskFlags: ["Lineups can change"],
        valueNotes: ["Compare against implied odds"]
      })
    );

    expect(parsed?.summary).toBe("Balanced match with goal signals.");
    expect(parsed?.keySignals).toEqual(["Home form is strong"]);
  });

  it("returns undefined for malformed output", () => {
    expect(parseAIInsight("not json")).toBeUndefined();
    expect(parseAIInsight(JSON.stringify({ summary: "Missing arrays" }))).toBeUndefined();
  });
});

describe("fallbackInsight", () => {
  it("returns a usable responsible betting explanation", () => {
    const fixture = mockFixtures[0];
    const probabilities = calculateProbabilities(fixture, mockTrends(fixture));
    const insight = fallbackInsight(fixture, probabilities);

    expect(insight.provider).toBe("fallback");
    expect(insight.summary).toContain(fixture.home.name);
    expect(insight.riskFlags.length).toBeGreaterThan(0);
    expect(insight.valueNotes.join(" ")).toContain("implied probabilities");
  });
});
