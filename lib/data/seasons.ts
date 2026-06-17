// Season-summary data access. Pure functions over the static seed JSON.
import type { SeasonSummary, SeedFile, TransferYearPoint } from "@/lib/types";
import seasonsJson from "@/data/seed/season_summary.json";

const file = seasonsJson as unknown as SeedFile<SeasonSummary>;

/** Annotated league events, keyed by season. */
export const SEASON_EVENTS: Record<number, string> = {
  2018: "Transfer portal launches",
  2021: "NIL rules take effect",
};

/** All season summaries, sorted ascending by year. */
export function getSeasonSummaries(): SeasonSummary[] {
  return [...file.data].sort((a, b) => a.season - b.season);
}

export function getSeasonSummary(season: number): SeasonSummary | undefined {
  return file.data.find((s) => s.season === season);
}

/** [earliest, latest] season present in the data. */
export function getSeasonRange(): [number, number] {
  const years = file.data.map((s) => s.season);
  return [Math.min(...years), Math.max(...years)];
}

export function getLatestSeason(): number {
  return getSeasonRange()[1];
}

/** All seasons (years) ascending. */
export function getSeasonYears(): number[] {
  return getSeasonSummaries().map((s) => s.season);
}

/** Timeline points for the line chart, with event annotations attached. */
export function getTransferTimeline(): TransferYearPoint[] {
  return getSeasonSummaries().map((s) => ({
    season: s.season,
    total_transfers: s.total_transfers,
    event: SEASON_EVENTS[s.season] ?? null,
  }));
}

/**
 * Latest available estimated NIL market size (NIL era only). Returns null if no
 * estimate exists — callers must render it with an "estimated" confidence badge
 * and never present it as confirmed.
 */
export function getLatestEstimatedMarketSize(): { season: number; value: number } | null {
  const withEstimate = getSeasonSummaries().filter((s) => s.estimated_nil_market_size !== null);
  if (withEstimate.length === 0) return null;
  const latest = withEstimate[withEstimate.length - 1];
  return { season: latest.season, value: latest.estimated_nil_market_size as number };
}

export function getSeasonsMeta() {
  return file._meta;
}
