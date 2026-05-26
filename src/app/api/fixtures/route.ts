import { NextResponse } from "next/server";
import { getWeekWindow } from "@/lib/date";
import { MAIN_LEAGUE_IDS } from "@/lib/leagues";
import { getWeeklyFixtures } from "@/lib/providers/apiFootball";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const week = getWeekWindow();
  const from = url.searchParams.get("from") ?? week.from;
  const to = url.searchParams.get("to") ?? week.to;
  const leagues = url.searchParams
    .getAll("league")
    .map(Number)
    .filter(Number.isFinite);

  try {
    const fixtures = await getWeeklyFixtures({
      from,
      to,
      leagueIds: leagues.length ? leagues : MAIN_LEAGUE_IDS
    });

    return NextResponse.json({
      fixtures,
      meta: {
        from,
        to,
        usingMockData: !process.env.API_FOOTBALL_KEY
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
