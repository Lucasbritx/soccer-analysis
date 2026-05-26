import { Fixture, TeamTrend } from "@/lib/types";

export const mockFixtures: Fixture[] = [
  {
    id: 10001,
    league: { id: 39, name: "Premier League", country: "England", season: 2025 },
    kickoff: new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString(),
    venue: "Emirates Stadium",
    status: "scheduled",
    home: { id: 42, name: "Arsenal" },
    away: { id: 40, name: "Liverpool" }
  },
  {
    id: 10002,
    league: { id: 140, name: "La Liga", country: "Spain", season: 2025 },
    kickoff: new Date(Date.now() + 58 * 60 * 60 * 1000).toISOString(),
    venue: "Santiago Bernabeu",
    status: "scheduled",
    home: { id: 541, name: "Real Madrid" },
    away: { id: 529, name: "Barcelona" }
  },
  {
    id: 10003,
    league: { id: 71, name: "Brasileirao Serie A", country: "Brazil", season: 2025 },
    kickoff: new Date(Date.now() + 84 * 60 * 60 * 1000).toISOString(),
    venue: "Maracana",
    status: "scheduled",
    home: { id: 127, name: "Flamengo" },
    away: { id: 121, name: "Palmeiras" }
  }
];

export function mockTrends(fixture: Fixture): { home: TeamTrend; away: TeamTrend } {
  const seed = fixture.id % 7;

  return {
    home: {
      teamId: fixture.home.id,
      formScore: 62 + seed,
      goalsForAvg: 1.7 + seed * 0.04,
      goalsAgainstAvg: 0.95 + seed * 0.03,
      cornersForAvg: 5.4 + seed * 0.12,
      cornersAgainstAvg: 4.2,
      yellowCardsAvg: 2.1,
      redCardsAvg: 0.08,
      cleanSheetRate: 34,
      bttsRate: 52
    },
    away: {
      teamId: fixture.away.id,
      formScore: 56 - seed,
      goalsForAvg: 1.35 + seed * 0.03,
      goalsAgainstAvg: 1.22 + seed * 0.04,
      cornersForAvg: 4.8,
      cornersAgainstAvg: 4.9 + seed * 0.1,
      yellowCardsAvg: 2.5,
      redCardsAvg: 0.11,
      cleanSheetRate: 28,
      bttsRate: 57
    }
  };
}
