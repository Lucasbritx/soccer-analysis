import { NextResponse } from "next/server";
import { generateAIInsight } from "@/lib/ai/insights";
import { calculateProbabilities } from "@/lib/probability/engine";
import { getFixtureById, getFixtureTrends } from "@/lib/providers/apiFootball";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const fixtureId = Number(id);

  if (!Number.isFinite(fixtureId)) {
    return NextResponse.json({ error: "Invalid fixture id." }, { status: 400 });
  }

  try {
    const fixture = await getFixtureById(fixtureId);
    if (!fixture) {
      return NextResponse.json({ error: "Fixture not found." }, { status: 404 });
    }

    const trends = await getFixtureTrends(fixture);
    const probabilities = calculateProbabilities(fixture, trends);
    const insight = await generateAIInsight(fixture, probabilities);

    return NextResponse.json({
      fixture,
      probabilities,
      insight
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to analyze fixture."
      },
      { status: 502 }
    );
  }
}
