import { Confidence, Fixture, MarketProbability, ProbabilityBundle, TeamTrend } from "@/lib/types";

type TrendPair = {
  home: TeamTrend;
  away: TeamTrend;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function roundPercent(value: number) {
  return Math.round(clamp(value, 1, 98));
}

export function normalizePercentages(values: number[]) {
  const total = values.reduce((sum, value) => sum + Math.max(0, value), 0);
  if (total <= 0) {
    return values.map(() => Math.round(100 / values.length));
  }

  const normalized = values.map((value) => (Math.max(0, value) / total) * 100);
  const rounded = normalized.map(Math.round);
  const delta = 100 - rounded.reduce((sum, value) => sum + value, 0);
  rounded[0] += delta;
  return rounded.map((value) => clamp(value, 0, 100));
}

function confidenceFromMissing(missing: string[], available: number): Confidence {
  if (missing.length === 0 && available >= 4) return "high";
  if (missing.length <= 2 && available >= 2) return "medium";
  return "low";
}

function availableInputs(trend: TeamTrend) {
  return Object.entries(trend)
    .filter(([, value]) => value !== undefined)
    .map(([key]) => key);
}

function missingInputs(home: TeamTrend, away: TeamTrend, fields: Array<keyof TeamTrend>) {
  const missing: string[] = [];
  for (const field of fields) {
    if (home[field] === undefined) missing.push(`home.${String(field)}`);
    if (away[field] === undefined) missing.push(`away.${String(field)}`);
  }
  return missing;
}

function market(
  marketName: string,
  selection: string,
  percent: number,
  confidence: Confidence,
  inputsUsed: string[],
  missing: string[]
): MarketProbability {
  return {
    market: marketName,
    selection,
    percent: roundPercent(percent),
    confidence,
    inputsUsed,
    missingInputs: missing
  };
}

export function calculateProbabilities(fixture: Fixture, trends: TrendPair): ProbabilityBundle {
  const homeInputs = availableInputs(trends.home);
  const awayInputs = availableInputs(trends.away);
  const warnings: string[] = [];

  const x1Missing = missingInputs(trends.home, trends.away, [
    "formScore",
    "goalsForAvg",
    "goalsAgainstAvg",
    "cleanSheetRate"
  ]);

  const homeStrength =
    (trends.home.formScore ?? 50) * 0.45 +
    (trends.home.goalsForAvg ?? 1.2) * 18 -
    (trends.home.goalsAgainstAvg ?? 1.2) * 10 +
    (trends.home.cleanSheetRate ?? 25) * 0.2 +
    5;
  const awayStrength =
    (trends.away.formScore ?? 50) * 0.45 +
    (trends.away.goalsForAvg ?? 1.2) * 18 -
    (trends.away.goalsAgainstAvg ?? 1.2) * 10 +
    (trends.away.cleanSheetRate ?? 25) * 0.2;
  const drawBase = 28 - Math.abs(homeStrength - awayStrength) * 0.12;
  const [homeWin, draw, awayWin] = normalizePercentages([homeStrength, drawBase, awayStrength]);
  const x1Confidence = confidenceFromMissing(x1Missing, homeInputs.length + awayInputs.length);

  const expectedHomeGoals = (trends.home.goalsForAvg ?? 1.25) * 0.58 + (trends.away.goalsAgainstAvg ?? 1.2) * 0.42;
  const expectedAwayGoals = (trends.away.goalsForAvg ?? 1.15) * 0.55 + (trends.home.goalsAgainstAvg ?? 1.15) * 0.45;
  const expectedGoals = expectedHomeGoals + expectedAwayGoals;
  const goalsMissing = missingInputs(trends.home, trends.away, ["goalsForAvg", "goalsAgainstAvg", "bttsRate"]);
  const goalsConfidence = confidenceFromMissing(goalsMissing, homeInputs.length + awayInputs.length);
  const over25 = 34 + expectedGoals * 10;
  const btts = ((trends.home.bttsRate ?? 50) + (trends.away.bttsRate ?? 50)) / 2 + (expectedGoals - 2.4) * 8;

  const expectedCorners =
    ((trends.home.cornersForAvg ?? 4.8) +
      (trends.away.cornersForAvg ?? 4.5) +
      (trends.home.cornersAgainstAvg ?? 4.4) +
      (trends.away.cornersAgainstAvg ?? 4.7)) /
    2;
  const cornerMissing = missingInputs(trends.home, trends.away, ["cornersForAvg", "cornersAgainstAvg"]);
  const cornerConfidence = confidenceFromMissing(cornerMissing, homeInputs.length + awayInputs.length);

  const expectedYellows = (trends.home.yellowCardsAvg ?? 2.1) + (trends.away.yellowCardsAvg ?? 2.2);
  const yellowMissing = missingInputs(trends.home, trends.away, ["yellowCardsAvg"]);
  const yellowConfidence = confidenceFromMissing(yellowMissing, homeInputs.length + awayInputs.length);

  const expectedReds = (trends.home.redCardsAvg ?? 0.08) + (trends.away.redCardsAvg ?? 0.08);
  const redMissing = missingInputs(trends.home, trends.away, ["redCardsAvg"]);
  const redConfidence: Confidence = redMissing.length === 0 && expectedReds > 0.22 ? "medium" : "low";

  if (x1Missing.length || goalsMissing.length || cornerMissing.length || yellowMissing.length || redMissing.length) {
    warnings.push("Some probabilities use league baselines because one or more provider stats were missing.");
  }

  const sharedInputs = Array.from(new Set([...homeInputs, ...awayInputs]));

  return {
    fixtureId: fixture.id,
    generatedAt: new Date().toISOString(),
    sourceFreshness: process.env.API_FOOTBALL_KEY ? "API-Football cached up to 15 minutes" : "Demo data, no API key configured",
    trends,
    warnings,
    markets: [
      market("1X2", `${fixture.home.name} win`, homeWin, x1Confidence, sharedInputs, x1Missing),
      market("1X2", "Draw", draw, x1Confidence, sharedInputs, x1Missing),
      market("1X2", `${fixture.away.name} win`, awayWin, x1Confidence, sharedInputs, x1Missing),
      market("Goals", "Over 2.5 goals", over25, goalsConfidence, sharedInputs, goalsMissing),
      market("Goals", "Both teams to score", btts, goalsConfidence, sharedInputs, goalsMissing),
      market("Corners", "Over 8.5 corners", 26 + expectedCorners * 4.5, cornerConfidence, sharedInputs, cornerMissing),
      market("Cards", "Over 3.5 yellow cards", 25 + expectedYellows * 9, yellowConfidence, sharedInputs, yellowMissing),
      market("Cards", "At least one red card", 8 + expectedReds * 35, redConfidence, sharedInputs, redMissing)
    ]
  };
}
