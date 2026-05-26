import { getLeagueSeason, MAIN_LEAGUE_IDS } from "@/lib/leagues";
import { mockFixtures, mockTrends } from "@/lib/mock/fixtures";
import { Fixture, FixtureQuery, FixtureStatus, TeamTrend } from "@/lib/types";

const API_BASE = "https://v3.football.api-sports.io";

type ApiFootballFixture = {
  fixture: {
    id: number;
    date: string;
    status?: { short?: string };
    venue?: { name?: string };
  };
  league: {
    id: number;
    name: string;
    country: string;
    logo?: string;
    season: number;
  };
  teams: {
    home: { id: number; name: string; logo?: string };
    away: { id: number; name: string; logo?: string };
  };
};

type ApiFootballResponse<T> = {
  response?: T[];
  errors?: unknown;
};

type FixturesStatisticsResponse = {
  team: { id: number };
  statistics: Array<{ type: string; value: number | string | null }>;
};

type FixturesResponse = ApiFootballResponse<ApiFootballFixture>;
type StatisticsResponse = ApiFootballResponse<FixturesStatisticsResponse>;

function hasApiKey() {
  return Boolean(process.env.API_FOOTBALL_KEY);
}

async function apiFootballFetch<T>(path: string, params: Record<string, string | number>) {
  if (!hasApiKey()) {
    throw new Error("API_FOOTBALL_KEY is not configured.");
  }

  const url = new URL(`${API_BASE}${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value));
  }

  const response = await fetch(url, {
    headers: {
      "x-apisports-key": process.env.API_FOOTBALL_KEY ?? ""
    },
    next: { revalidate: 15 * 60 }
  });

  if (!response.ok) {
    throw new Error(`API-Football request failed with ${response.status}.`);
  }

  return (await response.json()) as T;
}

function mapStatus(short?: string): FixtureStatus {
  if (!short || short === "NS") return "scheduled";
  if (["1H", "2H", "HT", "ET", "BT", "P"].includes(short)) return "live";
  if (["FT", "AET", "PEN"].includes(short)) return "finished";
  if (["PST", "CANC", "ABD"].includes(short)) return "postponed";
  return "unknown";
}

function mapFixture(item: ApiFootballFixture): Fixture {
  return {
    id: item.fixture.id,
    kickoff: item.fixture.date,
    venue: item.fixture.venue?.name,
    status: mapStatus(item.fixture.status?.short),
    league: {
      id: item.league.id,
      name: item.league.name,
      country: item.league.country,
      logo: item.league.logo,
      season: item.league.season
    },
    home: {
      id: item.teams.home.id,
      name: item.teams.home.name,
      logo: item.teams.home.logo
    },
    away: {
      id: item.teams.away.id,
      name: item.teams.away.name,
      logo: item.teams.away.logo
    }
  };
}

export async function getWeeklyFixtures(query: FixtureQuery): Promise<Fixture[]> {
  if (!hasApiKey()) {
    return mockFixtures;
  }

  const leagueIds = query.leagueIds?.length ? query.leagueIds : MAIN_LEAGUE_IDS;
  const fixtureGroups = await Promise.all(
    leagueIds.map(async (league) => {
      const data = await apiFootballFetch<FixturesResponse>("/fixtures", {
        league,
        season: getLeagueSeason(league),
        from: query.from,
        to: query.to,
        timezone: "America/Sao_Paulo"
      });

      return data.response?.map(mapFixture) ?? [];
    })
  );

  return fixtureGroups.flat().sort((a, b) => a.kickoff.localeCompare(b.kickoff));
}

export async function getFixtureById(id: number): Promise<Fixture | undefined> {
  if (!hasApiKey()) {
    return mockFixtures.find((fixture) => fixture.id === id);
  }

  const data = await apiFootballFetch<FixturesResponse>("/fixtures", { id });
  return data.response?.[0] ? mapFixture(data.response[0]) : undefined;
}

function statValue(stats: FixturesStatisticsResponse | undefined, label: string) {
  const raw = stats?.statistics.find((stat) => stat.type === label)?.value;
  if (raw === null || raw === undefined) return undefined;
  if (typeof raw === "number") return raw;
  const parsed = Number(raw.replace("%", ""));
  return Number.isFinite(parsed) ? parsed : undefined;
}

export async function getFixtureTrends(fixture: Fixture): Promise<{ home: TeamTrend; away: TeamTrend }> {
  if (!hasApiKey()) {
    return mockTrends(fixture);
  }

  try {
    const data = await apiFootballFetch<StatisticsResponse>("/fixtures/statistics", {
      fixture: fixture.id
    });

    const homeStats = data.response?.find((item) => item.team.id === fixture.home.id);
    const awayStats = data.response?.find((item) => item.team.id === fixture.away.id);

    return {
      home: {
        teamId: fixture.home.id,
        goalsForAvg: undefined,
        goalsAgainstAvg: undefined,
        cornersForAvg: statValue(homeStats, "Corner Kicks"),
        cornersAgainstAvg: statValue(awayStats, "Corner Kicks"),
        yellowCardsAvg: statValue(homeStats, "Yellow Cards"),
        redCardsAvg: statValue(homeStats, "Red Cards"),
        bttsRate: undefined
      },
      away: {
        teamId: fixture.away.id,
        goalsForAvg: undefined,
        goalsAgainstAvg: undefined,
        cornersForAvg: statValue(awayStats, "Corner Kicks"),
        cornersAgainstAvg: statValue(homeStats, "Corner Kicks"),
        yellowCardsAvg: statValue(awayStats, "Yellow Cards"),
        redCardsAvg: statValue(awayStats, "Red Cards"),
        bttsRate: undefined
      }
    };
  } catch {
    return mockTrends(fixture);
  }
}
