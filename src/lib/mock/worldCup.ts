import { Fixture, TeamTrend } from "@/lib/types";

const WORLD_CUP_LEAGUE = {
  id: 900,
  name: "FIFA World Cup",
  country: "International",
  season: 2026
};

export const worldCupFixtures: Fixture[] = [
  {
    id: 20001,
    league: WORLD_CUP_LEAGUE,
    kickoff: "2026-06-10T20:00:00.000Z",
    venue: "MetLife Stadium",
    status: "scheduled",
    home: { id: 2501, name: "France" },
    away: { id: 2502, name: "Brazil" }
  },
  {
    id: 20002,
    league: WORLD_CUP_LEAGUE,
    kickoff: "2026-06-11T01:00:00.000Z",
    venue: "AT&T Stadium",
    status: "scheduled",
    home: { id: 2503, name: "Argentina" },
    away: { id: 2504, name: "Germany" }
  },
  {
    id: 20003,
    league: WORLD_CUP_LEAGUE,
    kickoff: "2026-06-12T20:00:00.000Z",
    venue: "SoFi Stadium",
    status: "scheduled",
    home: { id: 2505, name: "England" },
    away: { id: 2506, name: "Spain" }
  },
  {
    id: 20004,
    league: WORLD_CUP_LEAGUE,
    kickoff: "2026-06-13T01:00:00.000Z",
    venue: "Hard Rock Stadium",
    status: "scheduled",
    home: { id: 2507, name: "Portugal" },
    away: { id: 2508, name: "Netherlands" }
  }
];

export function worldCupTrends(fixture: Fixture): { home: TeamTrend; away: TeamTrend } {
  const seed = fixture.id % 5;

  return {
    home: {
      teamId: fixture.home.id,
      formScore: 68 + seed,
      goalsForAvg: 1.85 + seed * 0.05,
      goalsAgainstAvg: 0.88 + seed * 0.04,
      cornersForAvg: 5.7 + seed * 0.1,
      cornersAgainstAvg: 4.0 + seed * 0.08,
      yellowCardsAvg: 1.9 + seed * 0.06,
      redCardsAvg: 0.05 + seed * 0.01,
      cleanSheetRate: 38 + seed,
      bttsRate: 49 + seed
    },
    away: {
      teamId: fixture.away.id,
      formScore: 65 - seed,
      goalsForAvg: 1.62 + seed * 0.04,
      goalsAgainstAvg: 1.04 + seed * 0.03,
      cornersForAvg: 5.1 + seed * 0.08,
      cornersAgainstAvg: 4.4 + seed * 0.06,
      yellowCardsAvg: 2.2 + seed * 0.05,
      redCardsAvg: 0.07 + seed * 0.01,
      cleanSheetRate: 31 + seed,
      bttsRate: 53 + seed
    }
  };
}
