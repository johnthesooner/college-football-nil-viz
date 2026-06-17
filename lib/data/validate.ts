// Seed-data integrity validation.
//
// Pure functions — no React, no I/O beyond the static JSON imports. Shared by
// `scripts/validate-seed.ts` (run as predev/prebuild) and the Vitest test in
// `validate.test.ts`, so the same rules guard local dev, the build, and CI.

import type {
  Player,
  NILDeal,
  SeasonSummary,
  School,
  SeedFile,
  SeedMeta,
  Position,
  ClassYear,
  ConfidenceLevel,
  AmountType,
} from "@/lib/types";
import { pearson } from "@/lib/utils";

import playersJson from "@/data/seed/players.json";
import nilJson from "@/data/seed/nil_deals.json";
import seasonsJson from "@/data/seed/season_summary.json";
import schoolsJson from "@/data/seed/schools.json";

export interface SeedBundle {
  players: SeedFile<Player>;
  nilDeals: SeedFile<NILDeal>;
  seasons: SeedFile<SeasonSummary>;
  schools: SeedFile<School>;
}

// JSON imports come in with structurally-inferred types; cast through unknown
// to our domain types (no `any`). The validators below are what actually prove
// the shapes are correct.
export function loadSeed(): SeedBundle {
  return {
    players: playersJson as unknown as SeedFile<Player>,
    nilDeals: nilJson as unknown as SeedFile<NILDeal>,
    seasons: seasonsJson as unknown as SeedFile<SeasonSummary>,
    schools: schoolsJson as unknown as SeedFile<School>,
  };
}

const POSITIONS: readonly Position[] = [
  "QB", "RB", "WR", "TE", "OL", "DL", "LB", "CB", "S", "K", "P", "ATH",
];
const CLASS_YEARS: readonly ClassYear[] = ["FR", "SO", "JR", "SR", "GR"];
const CONFIDENCE_LEVELS: readonly ConfidenceLevel[] = [
  "confirmed", "reported", "estimated", "unknown",
];
const AMOUNT_TYPES: readonly AmountType[] = ["exact", "range", "estimated", "unknown"];

const REQUIRED_CONFERENCES = ["SEC", "Big Ten", "Big 12", "ACC", "Pac-12", "AAC"];

const FIRST_SEASON = 2005;
const LAST_SEASON = 2024;
const NIL_START_SEASON = 2021;

/** True if `value` is a syntactically valid http(s) URL. */
function isValidHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/** Allowed total_transfers band per season, from the prescribed volume table. */
function transferBand(season: number): [number, number] {
  if (season >= 2005 && season <= 2017) return [500, 1500];
  if (season === 2018) return [1800, 2200];
  if (season >= 2019 && season <= 2020) return [2500, 3500];
  if (season === 2021) return [4500, 5500];
  if (season >= 2022 && season <= 2024) return [8000, 11000];
  return [0, Number.MAX_SAFE_INTEGER];
}

function checkMeta(label: string, meta: SeedMeta | undefined, errors: string[]): void {
  if (!meta) {
    errors.push(`${label}: missing _meta block`);
    return;
  }
  if (typeof meta.is_sample_data !== "boolean") {
    errors.push(`${label}: _meta.is_sample_data must be a boolean`);
  }
  if (!meta.last_updated) errors.push(`${label}: _meta.last_updated is empty`);
  if (!meta.disclaimer || meta.disclaimer.trim().length === 0) {
    errors.push(`${label}: _meta.disclaimer is empty`);
  }
}

/**
 * Collect every integrity problem in the seed bundle. Returns an array of
 * human-readable error strings (empty === valid). Kept pure so tests can feed
 * it crafted bad data.
 */
export function collectSeedErrors(bundle: SeedBundle): string[] {
  const errors: string[] = [];
  const { players, nilDeals, seasons, schools } = bundle;

  // --- _meta blocks --------------------------------------------------------
  checkMeta("players.json", players?._meta, errors);
  checkMeta("nil_deals.json", nilDeals?._meta, errors);
  checkMeta("season_summary.json", seasons?._meta, errors);
  checkMeta("schools.json", schools?._meta, errors);

  const playerRows = players?.data ?? [];
  const dealRows = nilDeals?.data ?? [];
  const seasonRows = seasons?.data ?? [];
  const schoolRows = schools?.data ?? [];

  // --- schools -------------------------------------------------------------
  if (schoolRows.length < 25) {
    errors.push(`schools: need >= 25, found ${schoolRows.length}`);
  }
  const schoolNames = new Set(schoolRows.map((s) => s.name));
  const schoolConfByName = new Map(schoolRows.map((s) => [s.name, s.conference]));
  const conferences = new Set(schoolRows.map((s) => s.conference));
  for (const required of REQUIRED_CONFERENCES) {
    if (!conferences.has(required)) {
      errors.push(`schools: missing required conference "${required}"`);
    }
  }
  if (conferences.size < 6) {
    errors.push(`schools: need >= 6 conferences, found ${conferences.size}`);
  }
  const seenSchoolIds = new Set<string>();
  for (const s of schoolRows) {
    if (seenSchoolIds.has(s.school_id)) errors.push(`schools: duplicate school_id "${s.school_id}"`);
    seenSchoolIds.add(s.school_id);
    if (s.latitude < -90 || s.latitude > 90) errors.push(`schools: ${s.name} latitude out of range`);
    if (s.longitude < -180 || s.longitude > 180) errors.push(`schools: ${s.name} longitude out of range`);
  }

  // --- seasons -------------------------------------------------------------
  if (seasonRows.length < 20) {
    errors.push(`season_summary: need >= 20 rows, found ${seasonRows.length}`);
  }
  const seasonByYear = new Map<number, SeasonSummary>();
  for (const s of seasonRows) {
    if (seasonByYear.has(s.season)) errors.push(`season_summary: duplicate season ${s.season}`);
    seasonByYear.set(s.season, s);
  }
  for (let yr = FIRST_SEASON; yr <= LAST_SEASON; yr++) {
    const row = seasonByYear.get(yr);
    if (!row) {
      errors.push(`season_summary: missing season ${yr}`);
      continue;
    }
    const [lo, hi] = transferBand(yr);
    if (row.total_transfers < lo || row.total_transfers > hi) {
      errors.push(
        `season_summary: ${yr} total_transfers ${row.total_transfers} outside expected band [${lo}, ${hi}]`,
      );
    }
    if (yr < NIL_START_SEASON) {
      if (row.total_reported_nil_value !== null) {
        errors.push(`season_summary: ${yr} pre-NIL year must have null total_reported_nil_value`);
      }
      if (row.estimated_nil_market_size !== null) {
        errors.push(`season_summary: ${yr} pre-NIL year must have null estimated_nil_market_size`);
      }
    }
    if (!row.notes || row.notes.trim().length === 0) {
      errors.push(`season_summary: ${yr} has empty notes`);
    }
    if (row.source_url !== null && !isValidHttpUrl(row.source_url)) {
      errors.push(`season_summary: ${yr} source_url is not a valid http(s) URL: "${row.source_url}"`);
    }
  }

  // --- players -------------------------------------------------------------
  if (playerRows.length < 250) {
    errors.push(`players: need >= 250 rows, found ${playerRows.length}`);
  }
  const playerById = new Map<string, Player>();
  const perSeasonCount = new Map<number, number>();
  for (const p of playerRows) {
    if (playerById.has(p.player_id)) errors.push(`players: duplicate player_id "${p.player_id}"`);
    playerById.set(p.player_id, p);
    perSeasonCount.set(p.season, (perSeasonCount.get(p.season) ?? 0) + 1);

    if (!POSITIONS.includes(p.position)) errors.push(`players: ${p.player_id} invalid position "${p.position}"`);
    if (!CLASS_YEARS.includes(p.class_year)) errors.push(`players: ${p.player_id} invalid class_year "${p.class_year}"`);
    if (p.season < FIRST_SEASON || p.season > LAST_SEASON) {
      errors.push(`players: ${p.player_id} season ${p.season} out of range`);
    }
    if (p.from_school === p.to_school) errors.push(`players: ${p.player_id} from_school === to_school`);
    if (!schoolNames.has(p.from_school)) errors.push(`players: ${p.player_id} unknown from_school "${p.from_school}"`);
    if (!schoolNames.has(p.to_school)) errors.push(`players: ${p.player_id} unknown to_school "${p.to_school}"`);
    if (schoolConfByName.get(p.from_school) && schoolConfByName.get(p.from_school) !== p.from_conference) {
      errors.push(`players: ${p.player_id} from_conference mismatch for ${p.from_school}`);
    }
    if (schoolConfByName.get(p.to_school) && schoolConfByName.get(p.to_school) !== p.to_conference) {
      errors.push(`players: ${p.player_id} to_conference mismatch for ${p.to_school}`);
    }
    if (p.source_url !== null && !isValidHttpUrl(p.source_url)) {
      errors.push(`players: ${p.player_id} source_url is not a valid http(s) URL: "${p.source_url}"`);
    }
  }

  // --- distribution matches the volume table -------------------------------
  // The per-season sample-row count should track total_transfers (rising sharply
  // in the portal/NIL era). We require a strong positive Pearson correlation.
  const orderedSeasons = [...seasonByYear.values()].sort((a, b) => a.season - b.season);
  if (orderedSeasons.length >= 2) {
    const xs = orderedSeasons.map((s) => s.total_transfers);
    const ys = orderedSeasons.map((s) => perSeasonCount.get(s.season) ?? 0);
    const r = pearson(xs, ys);
    if (r < 0.7) {
      errors.push(
        `players: per-season distribution does not track the volume table (Pearson r=${r.toFixed(3)}, need >= 0.7)`,
      );
    }
  }

  // --- NIL deals -----------------------------------------------------------
  if (dealRows.length < 40) {
    errors.push(`nil_deals: need >= 40 rows, found ${dealRows.length}`);
  }
  let confirmedCount = 0;
  const seenDealIds = new Set<string>();
  for (const d of dealRows) {
    if (seenDealIds.has(d.deal_id)) errors.push(`nil_deals: duplicate deal_id "${d.deal_id}"`);
    seenDealIds.add(d.deal_id);

    // RULE 2: every deal must have a non-empty notes field.
    if (!d.notes || d.notes.trim().length === 0) {
      errors.push(`nil_deals: ${d.deal_id} has empty notes (required)`);
    }
    if (!CONFIDENCE_LEVELS.includes(d.confidence_level)) {
      errors.push(`nil_deals: ${d.deal_id} invalid confidence_level "${d.confidence_level}"`);
    }
    if (!AMOUNT_TYPES.includes(d.amount_type)) {
      errors.push(`nil_deals: ${d.deal_id} invalid amount_type "${d.amount_type}"`);
    }

    // RULE 1 / KEY RULE: confirmed deals must carry a source_url AND a label.
    if (d.confidence_level === "confirmed") {
      confirmedCount += 1;
      if (!d.source_url) {
        errors.push(
          `nil_deals: ${d.deal_id} is confirmed but has no source_url — confirmed data must be sourced`,
        );
      }
      if (!d.source_name || d.source_name.trim().length === 0) {
        errors.push(`nil_deals: ${d.deal_id} is confirmed but has no source_name (a source needs a label)`);
      }
      if (d.reported_amount === null) {
        errors.push(`nil_deals: ${d.deal_id} is confirmed but has no reported_amount`);
      }
    }

    // PROVENANCE: a reported deal must cite at least one of url/name.
    if (d.confidence_level === "reported" && !d.source_url && !d.source_name) {
      errors.push(`nil_deals: ${d.deal_id} is reported but cites no source_url or source_name`);
    }

    // SOURCE SHAPE: any source_url must be a valid http(s) URL, and a URL
    // without a label can't render a usable <SourceLink>.
    if (d.source_url !== null) {
      if (!isValidHttpUrl(d.source_url)) {
        errors.push(`nil_deals: ${d.deal_id} source_url is not a valid http(s) URL: "${d.source_url}"`);
      }
      if (!d.source_name || d.source_name.trim().length === 0) {
        errors.push(`nil_deals: ${d.deal_id} has a source_url but an empty source_name`);
      }
    }

    // NIL AMOUNT DISPLAY RULE: an estimated/unknown-confidence deal must not be
    // dressed up with an "exact" amount type (that would read as precise).
    if (
      (d.confidence_level === "estimated" || d.confidence_level === "unknown") &&
      d.amount_type === "exact"
    ) {
      errors.push(
        `nil_deals: ${d.deal_id} is ${d.confidence_level} confidence but amount_type "exact" (would imply precision)`,
      );
    }

    // amount_type/reported_amount consistency: unknown <=> null amount.
    if (d.amount_type === "unknown" && d.reported_amount !== null) {
      errors.push(`nil_deals: ${d.deal_id} amount_type "unknown" but has a reported_amount`);
    }
    if (d.reported_amount === null && d.amount_type !== "unknown") {
      errors.push(`nil_deals: ${d.deal_id} has null reported_amount but amount_type is "${d.amount_type}"`);
    }
    if (d.reported_amount !== null && d.reported_amount < 0) {
      errors.push(`nil_deals: ${d.deal_id} negative reported_amount`);
    }

    // Referential integrity to players + NIL era.
    const player = playerById.get(d.player_id);
    if (!player) {
      errors.push(`nil_deals: ${d.deal_id} references unknown player_id "${d.player_id}"`);
    } else {
      if (player.season !== d.season) {
        errors.push(`nil_deals: ${d.deal_id} season ${d.season} != player season ${player.season}`);
      }
      if (player.to_school !== d.school) {
        errors.push(`nil_deals: ${d.deal_id} school "${d.school}" != player to_school "${player.to_school}"`);
      }
    }
    if (d.season < NIL_START_SEASON) {
      errors.push(`nil_deals: ${d.deal_id} season ${d.season} predates the NIL era (>= ${NIL_START_SEASON})`);
    }
  }
  if (confirmedCount > 5) {
    errors.push(`nil_deals: at most 5 confirmed deals allowed, found ${confirmedCount}`);
  }

  return errors;
}

/** Throw a single descriptive error if the bundle has any integrity problems. */
export function validateSeed(bundle: SeedBundle): void {
  const errors = collectSeedErrors(bundle);
  if (errors.length > 0) {
    throw new Error(
      `Seed data validation failed with ${errors.length} problem(s):\n` +
        errors.map((e) => `  • ${e}`).join("\n"),
    );
  }
}

/** Convenience: validate the real, committed seed files. */
export function validateRealSeed(): void {
  validateSeed(loadSeed());
}
