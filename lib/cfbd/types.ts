// Raw response shapes from the CollegeFootballData (CFBD) API v2.
//
// Fields are intentionally permissive (nullable). CFBD frequently omits values
// — most importantly, a transfer-portal row often has a null `destination`
// (a portal ENTRY without a landing school). TICKET-6 preserves these verbatim
// in the raw cache; it never invents completed transfers. Transformation into
// the app's canonical model is TICKET-7.

/** `/player/portal?year=` — a transfer-portal entry (NOT necessarily a completed move). */
export interface CfbdPortalPlayer {
  season: number | null;
  firstName: string | null;
  lastName: string | null;
  position: string | null;
  origin: string | null; // origin school
  destination: string | null; // landing school — OFTEN NULL (entry without a landing)
  transferDate: string | null;
  rating: number | null;
  stars: number | null;
  eligibility: string | null;
}

/** `/recruiting/players?year=` — a high-school/JUCO recruit ranking. */
export interface CfbdRecruit {
  year: number | null;
  name: string | null;
  position: string | null;
  stars: number | null;
  rating: number | null;
  ranking: number | null;
  committedTo: string | null;
}

/** `/recruiting/teams?year=` — a team recruiting-class ranking. */
export interface CfbdRecruitingTeam {
  year: number | null;
  rank: number | null;
  team: string | null;
  points: number | null;
}

/** `/talent?year=` — the 247-derived team talent composite. */
export interface CfbdTalent {
  year: number | null;
  school: string | null;
  talent: number | null;
}

/** `/ratings/sp?year=` — SP+ team rating. */
export interface CfbdSpRating {
  year: number | null;
  team: string | null;
  rating: number | null;
  offense?: { rating?: number | null } | null;
  defense?: { rating?: number | null } | null;
}

/** `/teams/fbs?year=` — FBS team metadata (conference can change by season → realignment). */
export interface CfbdFbsTeam {
  school: string | null;
  conference: string | null;
  abbreviation?: string | null;
  classification?: string | null;
  location?: { state?: string | null; latitude?: number | null; longitude?: number | null } | null;
}

/** `/draft/picks?year=` — an NFL draft pick. */
export interface CfbdDraftPick {
  year: number | null;
  name: string | null;
  position: string | null;
  round: number | null;
  pick: number | null;
  nflTeam: string | null;
  college: string | null;
}

/** `/stats/player/season?year=` — a season stat line for one player/category. */
export interface CfbdPlayerSeasonStat {
  season: number | null;
  player: string | null;
  team: string | null;
  category: string | null;
  statType: string | null;
  stat: number | null;
}

// ---------------------------------------------------------------------------
// Raw cache envelope. Every cached pull carries a `_meta` block so provenance
// travels with the data and it is unmistakably real (is_sample_data: false).
// ---------------------------------------------------------------------------

export interface RawCacheMeta {
  source: "CollegeFootballData";
  endpoint: string;
  year: number;
  pulled_at: string; // ISO timestamp
  is_sample_data: false;
  row_count: number;
}

export interface RawCacheFile<T = unknown> {
  _meta: RawCacheMeta;
  data: T[];
}

// ---------------------------------------------------------------------------
// Ingestion summary (returned by runIngest, printed by the CLI, asserted in tests).
// ---------------------------------------------------------------------------

export interface EndpointSummary {
  name: string;
  rows: number;
  apiCalls: number;
  cacheHits: number;
}

export interface IngestSummary {
  years: number[];
  endpoints: string[];
  perEndpoint: EndpointSummary[];
  totals: {
    apiCalls: number;
    cacheHits: number;
    cacheMisses: number;
    rowsTotal: number;
    filesWritten: number;
  };
  /** Portal-specific data-quality counts (null destinations are preserved, not dropped). */
  portal: { total: number; nullDestination: number; nullOrigin: number };
  skipped: string[];
}
