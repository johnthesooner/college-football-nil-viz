// The CFBD endpoints TICKET-6 pulls — one call per (endpoint, year).
//
// Roster is deliberately excluded: ~130 FBS teams × 8 seasons ≈ 1,040 calls,
// which exceeds the free tier (1,000/mo) on its own. Entity resolution in
// TICKET-7 can work off recruiting + portal names first; add rosters on the
// $5 tier (30k calls) later if needed.

export interface EndpointDef {
  /** cache-file prefix and summary key */
  name: string;
  /** path builder for a given season */
  path: (year: number) => string;
  /** which later analytics/model this feeds (documentation only) */
  feeds: string;
}

export const ENDPOINTS: EndpointDef[] = [
  { name: "portal", path: (y) => `/player/portal?year=${y}`, feeds: "transfers (net talent flow, portal volume)" },
  { name: "recruiting_players", path: (y) => `/recruiting/players?year=${y}`, feeds: "recruiting ratings + NIL model" },
  { name: "recruiting_teams", path: (y) => `/recruiting/teams?year=${y}`, feeds: "team recruiting rank" },
  { name: "talent", path: (y) => `/talent?year=${y}`, feeds: "team talent composite" },
  { name: "ratings_sp", path: (y) => `/ratings/sp?year=${y}`, feeds: "team performance (recruiting↔SP+)" },
  { name: "teams_fbs", path: (y) => `/teams/fbs?year=${y}`, feeds: "per-season conference / realignment" },
  { name: "draft_picks", path: (y) => `/draft/picks?year=${y}`, feeds: "draft outcomes + NIL model" },
  { name: "player_season_stats", path: (y) => `/stats/player/season?year=${y}`, feeds: "usage/production → NIL model" },
];

export const SKIPPED: string[] = [
  "roster (per-team × year ≈ 1,040 calls — exceeds the 1,000/mo free tier; defer to the $5 tier in a later ticket)",
];
