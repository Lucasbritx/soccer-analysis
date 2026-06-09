import { NextResponse } from "next/server";
import { getWeekWindow } from "@/lib/date";
import { MAIN_LEAGUE_IDS } from "@/lib/leagues";
import { getWeeklyFixtures } from "@/lib/providers/footballProviders";
import { FixtureCompetition } from "@/lib/types";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const week = getWeekWindow();
  const from = url.searchParams.get("from") ?? week.from;
  const to = url.searchParams.get("to") ?? week.to;
  const competitionParam = url.searchParams.get("competition");
  const competition: FixtureCompetition | undefined = competitionParam === "world-cup" ? "world-cup" : undefined;
  const leagues = url.searchParams
    .getAll("league")
    .map(Number)
    .filter(Number.isFinite);

  try {
    const result = await getWeeklyFixtures({
      from,
      to,
      competition: competition ?? undefined,
      leagueIds: leagues.length ? leagues : MAIN_LEAGUE_IDS
    });

    return NextResponse.json({
      fixtures: result.fixtures,
      meta: {
        from,
        to,
        competition: competition ?? "league",
        provider: result.provider,
        usingMockData: result.provider === "mock",
        warning: result.warning
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        fixtures: [],
        error: error instanceof Error ? error.message : "Unable to load fixtures."
      },
      { status: 502 }
    );
  }
}
