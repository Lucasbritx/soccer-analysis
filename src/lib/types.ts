export type Confidence = "high" | "medium" | "low";

export type TeamSide = {
  id: number;
  name: string;
  logo?: string;
};

export type LeagueInfo = {
  id: number;
  name: string;
  country: string;
  logo?: string;
  season: number;
};

export type FixtureStatus = "scheduled" | "live" | "finished" | "postponed" | "unknown";

export type Fixture = {
  id: number;
  league: LeagueInfo;
  kickoff: string;
  venue?: string;
  status: FixtureStatus;
  home: TeamSide;
  away: TeamSide;
};

export type TeamTrend = {
  teamId: number;
  formScore?: number;
  goalsForAvg?: number;
  goalsAgainstAvg?: number;
  cornersForAvg?: number;
  cornersAgainstAvg?: number;
  yellowCardsAvg?: number;
  redCardsAvg?: number;
  cleanSheetRate?: number;
  bttsRate?: number;
};

export type MarketProbability = {
  market: string;
  selection: string;
  percent: number;
  confidence: Confidence;
  inputsUsed: string[];
  missingInputs: string[];
};

export type ProbabilityBundle = {
  fixtureId: number;
  generatedAt: string;
  sourceFreshness: string;
  markets: MarketProbability[];
  trends: {
    home: TeamTrend;
    away: TeamTrend;
  };
  warnings: string[];
};

export type AIInsight = {
  summary: string;
  keySignals: string[];
  riskFlags: string[];
  valueNotes: string[];
  generatedAt: string;
  provider: "codex" | "fallback";
};

export type FixtureAnalysis = {
  fixture: Fixture;
  probabilities: ProbabilityBundle;
  insight: AIInsight;
};

export type FixtureQuery = {
  from: string;
  to: string;
  leagueIds?: number[];
};
