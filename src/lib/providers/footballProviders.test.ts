import { describe, expect, it } from "vitest";
import { getFixtureById, getFixtureTrends, getWeeklyFixtures } from "@/lib/providers/footballProviders";

describe("world cup fixtures", () => {
  it("serves world cup fixtures without external providers", async () => {
    const result = await getWeeklyFixtures({
      from: "2026-06-08",
      to: "2026-06-14",
      competition: "world-cup"
    });

    expect(result.provider).toBe("world-cup");
    expect(result.fixtures).toHaveLength(4);
    expect(result.fixtures[0]?.league.name).toBe("FIFA World Cup");
  });

  it("returns world cup trends for the bundled tournament fixtures", async () => {
    const fixture = await getFixtureById(20001);
    expect(fixture?.league.name).toBe("FIFA World Cup");

    const trends = await getFixtureTrends(fixture!);
    expect(trends.home.formScore).toBeGreaterThan(0);
    expect(trends.away.bttsRate).toBeGreaterThan(0);
  });
});
