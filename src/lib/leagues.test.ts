import { describe, expect, it } from "vitest";
import { MAIN_LEAGUES, MAIN_LEAGUE_IDS, getLeagueById } from "@/lib/leagues";

describe("leagues", () => {
  it("includes FIFA World Cup in main leagues", () => {
    const worldCup = MAIN_LEAGUES.find((league) => league.code === "WC");

    expect(worldCup).toBeDefined();
    expect(worldCup?.name).toBe("FIFA World Cup");
    expect(MAIN_LEAGUE_IDS).toContain(worldCup?.id);
  });

  it("can resolve FIFA World Cup by id", () => {
    const worldCup = MAIN_LEAGUES.find((league) => league.code === "WC");

    expect(worldCup).toBeDefined();
    expect(getLeagueById(worldCup!.id)?.code).toBe("WC");
  });
});
