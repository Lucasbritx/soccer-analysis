import { getLeagueById, MAIN_LEAGUES } from "@/lib/leagues";
import { mockFixtures, mockTrends } from "@/lib/mock/fixtures";
import { Fixture, FixtureListResult, FixtureQuery, FixtureStatus, TeamTrend } from "@/lib/types";

const FOOTBALL_DATA_BASE = "https://api.football-data.org/v4";
const SPORTS_DB_BASE = "https://www.thesportsdb.com/api/v1/json";
const SPORTS_DB_KEY = process.env.THESPORTSDB_API_KEY || "123";

type FootballDataMatch = {
  id: number;
  utcDate: string;
  status: string;
  competition: {
    code?: string;
    name: string;
    area?: { name?: string };
    emblem?: string;
  };
  homeTeam: {
    id: number;
    name: string;
    crest?: string;
  };
  awayTeam: {
    id: number;
    name: string;
    crest?: string;
  };
};

type FootballDataMatchesResponse = {
  matches?: FootballDataMatch[];
  id?: number;
  utcDate?: string;
  status?: string;
  competition?: FootballDataMatch["competition"];
  homeTeam?: FootballDataMatch["homeTeam"];
  awayTeam?: FootballDataMatch["awayTeam"];
  message?: string;
  errorCode?: number;
};

type SportsDbEvent = {
  idEvent: string;
  strTimestamp?: string;
  dateEvent?: string;
  strTime?: string;
  strStatus?: string;
  strLeague?: string;
  strCountry?: string;
  strHomeTeam?: string;
  strAwayTeam?: string;
  idHomeTeam?: string;
  idAwayTeam?: string;
  strVenue?: string;
};

type SportsDbResponse = {
  events?: SportsDbEvent[] | null;
  event?: SportsDbEvent[] | null;
};

function hasFootballDataKey() {
  return Boolean(process.env.FOOTBALL_DATA_API_KEY);
}

function mapFootballDataStatus(status: string): FixtureStatus {
  if (["SCHEDULED", "TIMED"].includes(status)) return "scheduled";
  if (["IN_PLAY", "PAUSED"].includes(status)) return "live";
  if (status === "FINISHED") return "finished";
  if (["POSTPONED", "SUSPENDED", "CANCELLED"].includes(status)) return "postponed";
  return "unknown";
}

function mapSportsDbStatus(status?: string): FixtureStatus {
  if (!status || status === "Not Started") return "scheduled";
  if (status === "Match Finished") return "finished";
  if (status === "Postponed") return "postponed";
  return "unknown";
}

function findLeagueByFootballDataCode(code: string) {
  return MAIN_LEAGUES.find((league) => league.code === code);
}

function findLeagueBySportsDbId(id: number) {
  return MAIN_LEAGUES.find((league) => league.sportsDbId === id);
}

async function footballDataFetch(path: string, params: Record<string, string | number>) {
  if (!hasFootballDataKey()) {
    throw new Error("FOOTBALL_DATA_API_KEY is not configured.");
  }

  const url = new URL(`${FOOTBALL_DATA_BASE}${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value));
  }

  const response = await fetch(url, {
    headers: {
      "X-Auth-Token": process.env.FOOTBALL_DATA_API_KEY ?? ""
    },
    next: { revalidate: 15 * 60 }
  });
  const payload = (await response.json()) as FootballDataMatchesResponse;

  if (!response.ok) {
    throw new Error(payload.message || `football-data.org request failed with ${response.status}.`);
  }

  return payload;
}

async function sportsDbFetch<T>(path: string, params: Record<string, string | number>) {
  const url = new URL(`${SPORTS_DB_BASE}/${SPORTS_DB_KEY}/${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value));
  }

  const response = await fetch(url, {
    next: { revalidate: 15 * 60 }
  });

  if (!response.ok) {
    throw new Error(`TheSportsDB request failed with ${response.status}.`);
  }

  return (await response.json()) as T;
}

function mapFootballDataFixture(match: FootballDataMatch, leagueId: number): Fixture {
  const league = getLeagueById(leagueId);

  return {
    id: match.id,
    kickoff: match.utcDate,
    status: mapFootballDataStatus(match.status),
    league: {
      id: leagueId,
      name: league?.name ?? match.competition.name,
      country: league?.country ?? match.competition.area?.name ?? "Unknown",
      logo: match.competition.emblem,
      season: league?.season ?? new Date(match.utcDate).getUTCFullYear()
    },
    home: {
      id: match.homeTeam.id,
      name: match.homeTeam.name,
      logo: match.homeTeam.crest
    },
    away: {
      id: match.awayTeam.id,
      name: match.awayTeam.name,
      logo: match.awayTeam.crest
    }
  };
}

function sportsDbKickoff(event: SportsDbEvent) {
  if (event.strTimestamp) return event.strTimestamp;
  if (event.dateEvent) {
    return `${event.dateEvent}T${event.strTime?.replace(" ", "") || "12:00:00"}Z`;
  }
  return new Date().toISOString();
}

function mapSportsDbFixture(event: SportsDbEvent, sportsDbLeagueId: number): Fixture {
  const league = findLeagueBySportsDbId(sportsDbLeagueId);
  const kickoff = sportsDbKickoff(event);

  return {
    id: Number(event.idEvent),
    kickoff,
    venue: event.strVenue,
    status: mapSportsDbStatus(event.strStatus),
    league: {
      id: league?.id ?? sportsDbLeagueId,
      name: league?.name ?? event.strLeague ?? "Unknown league",
      country: league?.country ?? event.strCountry ?? "Unknown",
      season: league?.season ?? new Date(kickoff).getUTCFullYear()
    },
    home: {
      id: Number(event.idHomeTeam) || Number(`${event.idEvent}1`),
      name: event.strHomeTeam ?? "Home team"
    },
    away: {
      id: Number(event.idAwayTeam) || Number(`${event.idEvent}2`),
      name: event.strAwayTeam ?? "Away team"
    }
  };
}

async function getFootballDataFixtures(query: FixtureQuery): Promise<Fixture[]> {
  const leagueIds = query.leagueIds?.length ? query.leagueIds : MAIN_LEAGUES.map((league) => league.id);
  const fixtures = await Promise.all(
    leagueIds.map(async (leagueId) => {
      const league = getLeagueById(leagueId);
      if (!league) return [];

      const data = await footballDataFetch(`/competitions/${league.code}/matches`, {
        dateFrom: query.from,
        dateTo: query.to
      });

      return data.matches?.map((match) => mapFootballDataFixture(match, league.id)) ?? [];
    })
  );

  return fixtures.flat().sort((a, b) => a.kickoff.localeCompare(b.kickoff));
}

async function getSportsDbFixtures(query: FixtureQuery): Promise<Fixture[]> {
  const leagues = query.leagueIds?.length
    ? query.leagueIds.map(getLeagueById).filter((league) => league !== undefined)
    : MAIN_LEAGUES;

  const fixtures = await Promise.all(
    leagues.map(async (league) => {
      const data = await sportsDbFetch<SportsDbResponse>("eventsnextleague.php", { id: league.sportsDbId });
      return (data.events ?? [])
        .map((event) => mapSportsDbFixture(event, league.sportsDbId))
        .filter((fixture) => fixture.kickoff.slice(0, 10) >= query.from && fixture.kickoff.slice(0, 10) <= query.to);
    })
  );

  return fixtures.flat().sort((a, b) => a.kickoff.localeCompare(b.kickoff));
}

export async function getWeeklyFixtures(query: FixtureQuery): Promise<FixtureListResult> {
  if (hasFootballDataKey()) {
    try {
      const fixtures = await getFootballDataFixtures(query);
      return { fixtures, provider: "football-data" };
    } catch (error) {
      const fixtures = await getSportsDbFixtures(query);
      if (!fixtures.length) {
        return {
          fixtures: mockFixtures,
          provider: "mock",
          warning: error instanceof Error ? error.message : "football-data.org failed; showing demo fixtures."
        };
      }

      return {
        fixtures,
        provider: "thesportsdb",
        warning: error instanceof Error ? error.message : "football-data.org failed; using fallback data."
      };
    }
  }

  try {
    const fixtures = await getSportsDbFixtures(query);
    return fixtures.length
      ? { fixtures, provider: "thesportsdb" }
      : { fixtures: mockFixtures, provider: "mock", warning: "TheSportsDB returned no fixtures; showing demo fixtures." };
  } catch {
    return { fixtures: mockFixtures, provider: "mock", warning: "TheSportsDB fallback failed; showing demo fixtures." };
  }
}

export async function getFixtureById(id: number): Promise<Fixture | undefined> {
  if (hasFootballDataKey()) {
  try {
    const data = await footballDataFetch(`/matches/${id}`, {});
    const match = data.matches?.[0] ?? (data.id ? (data as FootballDataMatch) : undefined);
    if (match?.homeTeam && match.awayTeam && match.competition) {
      const league = match.competition.code ? findLeagueByFootballDataCode(match.competition.code) : undefined;
      return mapFootballDataFixture(match, league?.id ?? MAIN_LEAGUES[0].id);
    }
  } catch {
      // Continue to TheSportsDB and mock fallbacks.
    }
  }

  try {
    const data = await sportsDbFetch<SportsDbResponse>("lookupevent.php", { id });
    const event = data.events?.[0] ?? data.event?.[0];
    if (event) {
      const league = MAIN_LEAGUES.find((item) => item.name === event.strLeague) ?? MAIN_LEAGUES[0];
      return mapSportsDbFixture(event, league.sportsDbId);
    }
  } catch {
    // Continue to demo fixtures.
  }

  return mockFixtures.find((fixture) => fixture.id === id);
}

export async function getFixtureTrends(fixture: Fixture): Promise<{ home: TeamTrend; away: TeamTrend }> {
  return mockTrends(fixture);
}
