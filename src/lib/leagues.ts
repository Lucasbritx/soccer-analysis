export const CURRENT_SEASON = 2025;

export const MAIN_LEAGUES = [
  { id: 1, code: "PL", sportsDbId: 4328, name: "Premier League", country: "England", season: CURRENT_SEASON },
  { id: 2, code: "PD", sportsDbId: 4335, name: "La Liga", country: "Spain", season: CURRENT_SEASON },
  { id: 3, code: "SA", sportsDbId: 4332, name: "Serie A", country: "Italy", season: CURRENT_SEASON },
  { id: 4, code: "BL1", sportsDbId: 4331, name: "Bundesliga", country: "Germany", season: CURRENT_SEASON },
  { id: 5, code: "FL1", sportsDbId: 4334, name: "Ligue 1", country: "France", season: CURRENT_SEASON },
  { id: 6, code: "CL", sportsDbId: 4480, name: "Champions League", country: "Europe", season: CURRENT_SEASON },
  { id: 7, code: "EL", sportsDbId: 4481, name: "Europa League", country: "Europe", season: CURRENT_SEASON },
  { id: 8, code: "BSA", sportsDbId: 4351, name: "Brasileirao Serie A", country: "Brazil", season: CURRENT_SEASON }
] as const;

export const MAIN_LEAGUE_IDS = MAIN_LEAGUES.map((league) => league.id);

export type MainLeague = (typeof MAIN_LEAGUES)[number];

export function getLeagueById(leagueId: number): MainLeague | undefined {
  return MAIN_LEAGUES.find((league) => league.id === leagueId);
}
