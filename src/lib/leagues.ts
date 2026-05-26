export const CURRENT_SEASON = 2025;

export const MAIN_LEAGUES = [
  { id: 39, name: "Premier League", country: "England", season: CURRENT_SEASON },
  { id: 140, name: "La Liga", country: "Spain", season: CURRENT_SEASON },
  { id: 135, name: "Serie A", country: "Italy", season: CURRENT_SEASON },
  { id: 78, name: "Bundesliga", country: "Germany", season: CURRENT_SEASON },
  { id: 61, name: "Ligue 1", country: "France", season: CURRENT_SEASON },
  { id: 2, name: "Champions League", country: "Europe", season: CURRENT_SEASON },
  { id: 3, name: "Europa League", country: "Europe", season: CURRENT_SEASON },
  { id: 71, name: "Brasileirao Serie A", country: "Brazil", season: CURRENT_SEASON }
] as const;

export const MAIN_LEAGUE_IDS = MAIN_LEAGUES.map((league) => league.id);

export function getLeagueSeason(leagueId: number): number {
  return MAIN_LEAGUES.find((league) => league.id === leagueId)?.season ?? CURRENT_SEASON;
}
