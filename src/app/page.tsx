"use client";

import { AlertTriangle, BarChart3, CalendarDays, RefreshCw, Satellite, ShieldCheck, Sparkles } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { formatKickoff, getWeekWindow } from "@/lib/date";
import { MAIN_LEAGUES } from "@/lib/leagues";
import { Fixture, FixtureAnalysis } from "@/lib/types";

type FixturesResponse = {
  fixtures: Fixture[];
  meta?: {
    from: string;
    to: string;
    usingMockData: boolean;
  };
  error?: string;
};

function confidenceClass(confidence: string) {
  return `confidence confidence-${confidence}`;
}

export default function Home() {
  const week = useMemo(() => getWeekWindow(), []);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [selectedLeague, setSelectedLeague] = useState("all");
  const [selectedFixture, setSelectedFixture] = useState<Fixture | null>(null);
  const [analysis, setAnalysis] = useState<FixtureAnalysis | null>(null);
  const [loadingFixtures, setLoadingFixtures] = useState(true);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [error, setError] = useState("");
  const [usingMockData, setUsingMockData] = useState(false);

  const loadFixtures = useCallback(async () => {
    setLoadingFixtures(true);
    setError("");
    const params = new URLSearchParams({ from: week.from, to: week.to });
    if (selectedLeague !== "all") params.append("league", selectedLeague);

    try {
      const response = await fetch(`/api/fixtures?${params.toString()}`);
      const data = (await response.json()) as FixturesResponse;
      if (!response.ok) throw new Error(data.error ?? "Unable to load fixtures.");
      setFixtures(data.fixtures);
      setUsingMockData(Boolean(data.meta?.usingMockData));
      setSelectedFixture(data.fixtures[0] ?? null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load fixtures.");
    } finally {
      setLoadingFixtures(false);
    }
  }, [selectedLeague, week.from, week.to]);

  const loadAnalysis = useCallback(async (fixture: Fixture) => {
    setAnalysis(null);
    setLoadingAnalysis(true);

    try {
      const response = await fetch(`/api/fixtures/${fixture.id}/analysis`);
      const data = (await response.json()) as FixtureAnalysis & { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Unable to analyze fixture.");
      setAnalysis(data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to analyze fixture.");
    } finally {
      setLoadingAnalysis(false);
    }
  }, []);

  useEffect(() => {
    void loadFixtures();
  }, [loadFixtures]);

  useEffect(() => {
    if (selectedFixture) {
      void loadAnalysis(selectedFixture);
    }
  }, [loadAnalysis, selectedFixture]);

  return (
    <main className="app-shell">
      <section className="topbar">
        <div>
          <p className="eyebrow">Weekly soccer probability desk</p>
          <h1>Games Probability</h1>
        </div>
        <div className="guardrail">
          <ShieldCheck size={18} />
          <span>Research only. No guaranteed outcomes.</span>
        </div>
      </section>

      <section className="controls">
        <div className="date-chip">
          <CalendarDays size={18} />
          <span>
            {week.from} to {week.to}
          </span>
        </div>
        <label className="league-filter">
          <span>League</span>
          <select value={selectedLeague} onChange={(event) => setSelectedLeague(event.target.value)}>
            <option value="all">All main leagues</option>
            {MAIN_LEAGUES.map((league) => (
              <option key={league.id} value={league.id}>
                {league.name}
              </option>
            ))}
          </select>
        </label>
        <button className="icon-button" type="button" onClick={loadFixtures} aria-label="Refresh fixtures">
          <RefreshCw size={18} />
        </button>
      </section>

      {usingMockData ? (
        <div className="notice">
          <AlertTriangle size={18} />
          Add <code>API_FOOTBALL_KEY</code> to use live fixtures. Demo data is showing now.
        </div>
      ) : null}

      {!usingMockData ? (
        <div className="notice success">
          <Satellite size={18} />
          Live API-Football data is enabled. Provider plan limits may still affect available seasons, leagues, and stats.
        </div>
      ) : null}

      {error ? (
        <div className="notice error">
          <AlertTriangle size={18} />
          {error}
        </div>
      ) : null}

      <section className="workspace">
        <aside className="fixture-list" aria-label="Fixtures">
          <div className="panel-heading">
            <BarChart3 size={18} />
            <h2>This week</h2>
          </div>

          {loadingFixtures ? <div className="state">Loading fixtures...</div> : null}
          {!loadingFixtures && fixtures.length === 0 ? <div className="state">No fixtures found for this filter.</div> : null}

          <div className="fixture-items">
            {fixtures.map((fixture) => (
              <button
                className={`fixture-row ${selectedFixture?.id === fixture.id ? "active" : ""}`}
                key={fixture.id}
                type="button"
                onClick={() => setSelectedFixture(fixture)}
              >
                <span className="league-name">{fixture.league.name}</span>
                <strong>
                  {fixture.home.name} <span>vs</span> {fixture.away.name}
                </strong>
                <small>{formatKickoff(fixture.kickoff)}</small>
              </button>
            ))}
          </div>
        </aside>

        <section className="analysis-panel" aria-label="Fixture analysis">
          {!selectedFixture ? <div className="state">Select a fixture to inspect probabilities.</div> : null}

          {selectedFixture ? (
            <div className="match-header">
              <div>
                <p className="eyebrow">{selectedFixture.league.name}</p>
                <h2>
                  {selectedFixture.home.name} <span>vs</span> {selectedFixture.away.name}
                </h2>
                <p>{formatKickoff(selectedFixture.kickoff)}</p>
              </div>
              <span className="status-pill">{selectedFixture.status}</span>
            </div>
          ) : null}

          {loadingAnalysis ? <div className="state">Calculating probabilities and generating AI notes...</div> : null}

          {analysis && !loadingAnalysis ? (
            <>
              <div className="insight-band">
                <Sparkles size={20} />
                <div>
                  <span>{analysis.insight.provider === "codex" ? "Codex SDK insight" : "Fallback insight"}</span>
                  <p>{analysis.insight.summary}</p>
                </div>
              </div>

              <div className="markets-grid">
                {analysis.probabilities.markets.map((item) => (
                  <article className="market-card" key={`${item.market}-${item.selection}`}>
                    <div>
                      <span className="market-name">{item.market}</span>
                      <h3>{item.selection}</h3>
                    </div>
                    <strong>{item.percent}%</strong>
                    <span className={confidenceClass(item.confidence)}>{item.confidence}</span>
                    {item.missingInputs.length ? <small>Missing: {item.missingInputs.slice(0, 2).join(", ")}</small> : null}
                  </article>
                ))}
              </div>

              <div className="detail-columns">
                <div>
                  <h3>Key signals</h3>
                  <ul>
                    {analysis.insight.keySignals.map((signal) => (
                      <li key={signal}>{signal}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3>Risk flags</h3>
                  <ul>
                    {analysis.insight.riskFlags.map((flag) => (
                      <li key={flag}>{flag}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3>Value notes</h3>
                  <ul>
                    {analysis.insight.valueNotes.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <p className="freshness">{analysis.probabilities.sourceFreshness}</p>
            </>
          ) : null}
        </section>
      </section>
    </main>
  );
}
