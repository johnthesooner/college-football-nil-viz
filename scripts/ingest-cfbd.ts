/**
 * Ingest real data from the College Football Data API (CFBD) into review-copy
 * seed files. SAFE BY DEFAULT: writes `*.cfbd.json` next to the seed files
 * (never overwrites your working data) so you can validate and diff before
 * promoting.
 *
 *   1. Get a free key (1k calls/mo, or 3k with an .edu email):
 *      https://collegefootballdata.com/key
 *   2. export CFBD_API_KEY=...   (or put it in .env.local)
 *   3. npm run ingest:cfbd -- --year-min 2021 --year-max 2024
 *   4. Review/validate, then promote:
 *      for f in schools players season_summary; do
 *        cp data/seed/$f.cfbd.json data/seed/$f.json    # (season_summary.cfbd.json)
 *      done
 *      npm run validate && npm run check:data
 *
 * WHAT CFBD CAN AND CANNOT FILL (verified — see DATA_SOURCES.md):
 *  - schools.json      ✅ name, conference, state, latitude, longitude (/teams/fbs)
 *  - players.json      ✅ name, position, season, from/to school+conference, date
 *                      ⚠️ class_year is NOT in the portal payload — defaulted
 *                         (see --default-class-year) and flagged; resolve via a
 *                         roster join or manual review before treating as real.
 *  - season_summary    ✅ total_transfers (counted); estimated_nil_market_size
 *                         from Opendorse's published estimates (attributed).
 *  - nil_deals.json    ❌ CFBD has no NIL dollar amounts. Curate manually from
 *                         official announcements (`confirmed`) / reporting
 *                         (`reported`); this script does not touch it.
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const API = "https://api.collegefootballdata.com";
const KEY = process.env.CFBD_API_KEY;

type ClassYear = "FR" | "SO" | "JR" | "SR" | "GR";

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const YEAR_MIN = Number(arg("year-min", "2021"));
const YEAR_MAX = Number(arg("year-max", "2024"));
const OUT_DIR = join(process.cwd(), arg("out-dir", "data/seed"));
const SUFFIX = arg("suffix", ".cfbd");
const DEFAULT_CLASS_YEAR = arg("default-class-year", "JR") as ClassYear;
const TODAY = new Date().toISOString().slice(0, 10);

// Opendorse "NIL at 3/4" published market-size estimates (USD). Attributed,
// always rendered with an "estimated" badge. Update from the latest report.
const NIL_MARKET: Record<number, number> = {
  2021: 917_000_000,
  2022: 1_170_000_000,
  2023: 1_280_000_000,
  2024: 1_670_000_000,
};

async function cfbd<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${KEY}`, Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`CFBD ${path} → ${res.status} ${res.statusText} (${await res.text()})`);
  }
  return (await res.json()) as T;
}

function meta(disclaimer: string) {
  return { is_sample_data: false, last_updated: TODAY, disclaimer };
}

function write(name: string, payload: unknown) {
  const path = join(OUT_DIR, `${name}${SUFFIX}.json`);
  writeFileSync(path, JSON.stringify(payload, null, 2) + "\n");
  console.log(`  wrote ${path}`);
}

interface CfbdTeam {
  school: string;
  conference: string | null;
  classification: string | null;
  location?: { city?: string; state?: string; latitude?: number; longitude?: number };
}
interface CfbdTransfer {
  season: number;
  firstName: string;
  lastName: string;
  position: string | null;
  origin: string | null;
  destination: string | null;
  transferDate: string | null;
}

async function main() {
  if (!KEY) {
    console.error(
      "✖ CFBD_API_KEY is not set. Get a free key at https://collegefootballdata.com/key\n" +
        "  then: export CFBD_API_KEY=...  (or add it to .env.local)",
    );
    process.exit(1);
  }

  console.log(`Ingesting CFBD data for ${YEAR_MIN}–${YEAR_MAX} → ${OUT_DIR} (suffix ${SUFFIX})\n`);

  // --- schools (FBS) ------------------------------------------------------
  const teams = await cfbd<CfbdTeam[]>("/teams/fbs");
  const fbs = teams.filter((t) => t.school && t.conference);
  const confBySchool = new Map(fbs.map((t) => [t.school, t.conference as string]));
  const schools = fbs.map((t) => ({
    school_id: t.school.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
    name: t.school,
    conference: t.conference as string,
    state: t.location?.state ?? "",
    latitude: t.location?.latitude ?? 0,
    longitude: t.location?.longitude ?? 0,
  }));
  write("schools", {
    _meta: meta("School metadata from the College Football Data API (/teams/fbs)."),
    data: schools,
  });
  console.log(`  schools: ${schools.length} FBS teams\n`);

  // --- players (transfers) + season volume --------------------------------
  const players: unknown[] = [];
  const seasonVolume = new Map<number, number>();
  let seq = 0;
  let missingClassYear = 0;

  for (let year = YEAR_MIN; year <= YEAR_MAX; year++) {
    const transfers = await cfbd<CfbdTransfer[]>(`/player/portal?year=${year}`);
    seasonVolume.set(year, transfers.length); // league-wide volume = all portal entries

    for (const t of transfers) {
      // Keep only FBS↔FBS moves so conferences resolve and validation passes.
      if (!t.origin || !t.destination) continue;
      if (!confBySchool.has(t.origin) || !confBySchool.has(t.destination)) continue;
      if (t.origin === t.destination) continue;
      seq += 1;
      missingClassYear += 1; // class_year is not in the portal payload
      players.push({
        player_id: `p${String(seq).padStart(5, "0")}`,
        player_name: `${t.firstName} ${t.lastName}`.trim(),
        position: t.position ?? "ATH",
        class_year: DEFAULT_CLASS_YEAR, // ⚠️ placeholder — not from CFBD
        season: t.season,
        from_school: t.origin,
        to_school: t.destination,
        from_conference: confBySchool.get(t.origin),
        to_conference: confBySchool.get(t.destination),
        transfer_date: t.transferDate ? t.transferDate.slice(0, 10) : null,
        source_url: "https://collegefootballdata.com/",
        source_name: "College Football Data",
      });
    }
  }
  write("players", {
    _meta: meta(
      "Transfers from the College Football Data API (/player/portal), FBS↔FBS only. " +
        "class_year is a placeholder — not available from the portal endpoint.",
    ),
    data: players,
  });
  console.log(
    `  players: ${players.length} FBS↔FBS transfers ` +
      `(⚠️ ${missingClassYear} rows have a placeholder class_year — resolve before treating as real)\n`,
  );

  // --- season summary -----------------------------------------------------
  const seasons = [];
  for (let year = YEAR_MIN; year <= YEAR_MAX; year++) {
    seasons.push({
      season: year,
      total_transfers: seasonVolume.get(year) ?? 0,
      total_reported_nil_value: null, // CFBD has no NIL $; fill from curated nil_deals
      estimated_nil_market_size: NIL_MARKET[year] ?? null,
      source_url: "https://collegefootballdata.com/",
      source_name: "College Football Data (transfers); Opendorse NIL at 3/4 (market size)",
      notes:
        "Transfer volume from CFBD portal entries. NIL market size is Opendorse's published estimate — attributed, illustrative, never audited.",
    });
  }
  write("season_summary", {
    _meta: meta("Season transfer volume from CFBD; NIL market size from Opendorse estimates."),
    data: seasons,
  });
  console.log(`  season_summary: ${seasons.length} seasons\n`);

  console.log("Done. Review the *.cfbd.json files, then:");
  console.log("  • resolve class_year (roster join or manual) before promoting players");
  console.log("  • curate nil_deals.json manually from official announcements / reporting");
  console.log("  • cp the reviewed files over data/seed/*.json, then `npm run validate`");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
