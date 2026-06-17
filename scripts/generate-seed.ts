/**
 * Deterministic seed-data generator.
 *
 * Run with `npm run generate:seed`. Emits the four JSON files under
 * `data/seed/`. A fixed PRNG seed makes output reproducible, so regenerating
 * never silently changes the dataset. The emitted JSON is the committed source
 * of truth — this script is a developer convenience, not a runtime dependency.
 *
 * Honesty note: every record is illustrative SAMPLE data. Player names are
 * fictional (see ASSUMPTION below), and NIL dollar figures are placeholders for
 * layout only — never real reported amounts. All of this is labeled in each
 * file's `_meta.disclaimer`, on every dollar value via <ConfidenceBadge>, and
 * on the /methodology page.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import type {
  Player,
  NILDeal,
  SeasonSummary,
  School,
  Position,
  ClassYear,
  ConfidenceLevel,
  AmountType,
  SeedFile,
} from "../lib/types";

// --- deterministic PRNG (mulberry32) ---------------------------------------
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20242005);

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(rand() * items.length)];
}
function weightedPick<T>(items: readonly { value: T; weight: number }[]): T {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let r = rand() * total;
  for (const it of items) {
    r -= it.weight;
    if (r <= 0) return it.value;
  }
  return items[items.length - 1].value;
}
function randInt(min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min;
}
/** Round to the nearest `step`. */
function roundTo(value: number, step: number): number {
  return Math.round(value / step) * step;
}

// ---------------------------------------------------------------------------
// SCHOOLS — 25 schools across 6 conferences.
//
// ASSUMPTION: Sample data uses each school's representative/historical
// conference (e.g. Texas/Oklahoma in Big 12, Oregon/Washington in Pac-12). The
// data model does not track conference realignment over time; swapping in real
// data with per-season conference membership is left to a future iteration.
// ---------------------------------------------------------------------------
const SCHOOLS: School[] = [
  // SEC
  { school_id: "alabama", name: "Alabama", conference: "SEC", state: "AL", latitude: 33.2098, longitude: -87.5692 },
  { school_id: "georgia", name: "Georgia", conference: "SEC", state: "GA", latitude: 33.948, longitude: -83.3773 },
  { school_id: "lsu", name: "LSU", conference: "SEC", state: "LA", latitude: 30.4133, longitude: -91.18 },
  { school_id: "florida", name: "Florida", conference: "SEC", state: "FL", latitude: 29.65, longitude: -82.349 },
  { school_id: "tennessee", name: "Tennessee", conference: "SEC", state: "TN", latitude: 35.955, longitude: -83.9295 },
  { school_id: "texas-am", name: "Texas A&M", conference: "SEC", state: "TX", latitude: 30.61, longitude: -96.34 },
  { school_id: "auburn", name: "Auburn", conference: "SEC", state: "AL", latitude: 32.602, longitude: -85.49 },
  // Big Ten
  { school_id: "ohio-state", name: "Ohio State", conference: "Big Ten", state: "OH", latitude: 40.0017, longitude: -83.0197 },
  { school_id: "michigan", name: "Michigan", conference: "Big Ten", state: "MI", latitude: 42.2659, longitude: -83.7487 },
  { school_id: "penn-state", name: "Penn State", conference: "Big Ten", state: "PA", latitude: 40.798, longitude: -77.86 },
  { school_id: "wisconsin", name: "Wisconsin", conference: "Big Ten", state: "WI", latitude: 43.07, longitude: -89.412 },
  { school_id: "nebraska", name: "Nebraska", conference: "Big Ten", state: "NE", latitude: 40.82, longitude: -96.7058 },
  // Big 12
  { school_id: "texas", name: "Texas", conference: "Big 12", state: "TX", latitude: 30.284, longitude: -97.732 },
  { school_id: "oklahoma", name: "Oklahoma", conference: "Big 12", state: "OK", latitude: 35.2058, longitude: -97.4423 },
  { school_id: "baylor", name: "Baylor", conference: "Big 12", state: "TX", latitude: 31.5489, longitude: -97.1131 },
  { school_id: "kansas-state", name: "Kansas State", conference: "Big 12", state: "KS", latitude: 39.1974, longitude: -96.5847 },
  // ACC
  { school_id: "clemson", name: "Clemson", conference: "ACC", state: "SC", latitude: 34.678, longitude: -82.837 },
  { school_id: "florida-state", name: "Florida State", conference: "ACC", state: "FL", latitude: 30.4419, longitude: -84.2985 },
  { school_id: "miami", name: "Miami", conference: "ACC", state: "FL", latitude: 25.7215, longitude: -80.279 },
  { school_id: "north-carolina", name: "North Carolina", conference: "ACC", state: "NC", latitude: 35.9049, longitude: -79.0469 },
  // Pac-12
  { school_id: "oregon", name: "Oregon", conference: "Pac-12", state: "OR", latitude: 44.058, longitude: -123.068 },
  { school_id: "washington", name: "Washington", conference: "Pac-12", state: "WA", latitude: 47.65, longitude: -122.303 },
  { school_id: "stanford", name: "Stanford", conference: "Pac-12", state: "CA", latitude: 37.434, longitude: -122.161 },
  // AAC
  { school_id: "cincinnati", name: "Cincinnati", conference: "AAC", state: "OH", latitude: 39.131, longitude: -84.516 },
  { school_id: "memphis", name: "Memphis", conference: "AAC", state: "TN", latitude: 35.119, longitude: -89.937 },
];

const SCHOOL_BY_NAME = new Map(SCHOOLS.map((s) => [s.name, s]));

// Relative "destination pull" by conference — Power conferences attract more
// inbound transfers; AAC is a net exporter. Used only to shape the sample
// flows so the Sankey looks realistic; documented as an assumption.
// ASSUMPTION: conference desirability weights are illustrative, not measured.
const CONFERENCE_PULL: Record<string, number> = {
  SEC: 5,
  "Big Ten": 4.5,
  "Big 12": 3,
  ACC: 3,
  "Pac-12": 2.5,
  AAC: 1,
};

// ---------------------------------------------------------------------------
// SEASONS — total_transfers follows the prescribed volume shape, and
// sampleCount is the number of player rows we materialize for that year. The
// sample count tracks the volume shape (more rows in high-mobility years) so
// the dataset's per-year distribution matches the table, while keeping the
// total at a manageable ~268 rows.
// ---------------------------------------------------------------------------
interface SeasonConfig {
  season: number;
  total_transfers: number;
  sampleCount: number;
}
const SEASON_CONFIG: SeasonConfig[] = [
  { season: 2005, total_transfers: 520, sampleCount: 6 },
  { season: 2006, total_transfers: 580, sampleCount: 6 },
  { season: 2007, total_transfers: 640, sampleCount: 7 },
  { season: 2008, total_transfers: 710, sampleCount: 7 },
  { season: 2009, total_transfers: 780, sampleCount: 8 },
  { season: 2010, total_transfers: 860, sampleCount: 8 },
  { season: 2011, total_transfers: 950, sampleCount: 9 },
  { season: 2012, total_transfers: 1050, sampleCount: 9 },
  { season: 2013, total_transfers: 1150, sampleCount: 10 },
  { season: 2014, total_transfers: 1250, sampleCount: 10 },
  { season: 2015, total_transfers: 1350, sampleCount: 11 },
  { season: 2016, total_transfers: 1450, sampleCount: 11 },
  { season: 2017, total_transfers: 1500, sampleCount: 12 },
  { season: 2018, total_transfers: 2000, sampleCount: 14 }, // portal launches
  { season: 2019, total_transfers: 2600, sampleCount: 16 },
  { season: 2020, total_transfers: 3400, sampleCount: 18 },
  { season: 2021, total_transfers: 5000, sampleCount: 22 }, // NIL rules begin
  { season: 2022, total_transfers: 8200, sampleCount: 26 },
  { season: 2023, total_transfers: 9800, sampleCount: 28 },
  { season: 2024, total_transfers: 11000, sampleCount: 30 },
];

// Illustrative estimated NIL market size (full college sports), NIL era only.
// ASSUMPTION: these aggregate figures are illustrative sample values, not
// sourced reporting. They are always rendered with an "estimated" badge.
const ESTIMATED_NIL_MARKET: Record<number, number> = {
  2021: 917_000_000,
  2022: 1_170_000_000,
  2023: 1_280_000_000,
  2024: 1_500_000_000,
};

// --- name pools -------------------------------------------------------------
// ASSUMPTION: Player names are fictional, generated from common name pools.
// They are NOT real athletes. Any resemblance is coincidental; the dataset is
// labeled sample data throughout.
const FIRST_NAMES = [
  "Marcus", "Jalen", "Tyler", "Cameron", "Devin", "Isaiah", "Xavier", "Mason",
  "Elijah", "Carter", "Bryce", "Trey", "Dorian", "Malik", "Caleb", "Jordan",
  "Damon", "Quinn", "Rashad", "Brandon", "Keenan", "Darius", "Amari", "Tristan",
  "Nico", "Cole", "Jaylen", "Demarcus", "Kade", "Silas", "Roman", "Khalil",
  "Beau", "Zion", "Donovan", "Hudson", "Maddox", "Tre", "Javon", "Asher",
];
const LAST_NAMES = [
  "Williams", "Johnson", "Carter", "Brooks", "Mitchell", "Robinson", "Hayes",
  "Coleman", "Bennett", "Sanders", "Foster", "Reed", "Bryant", "Spencer",
  "Diggs", "Vance", "Holloway", "Crawford", "Dawson", "Maddox", "Ellison",
  "Pratt", "Whitfield", "Calhoun", "Becton", "Garrett", "Hampton", "Ruffin",
  "Okafor", "Sullivan", "Mercer", "Boone", "Pierce", "Locke", "Frazier",
  "Ackerman", "Delgado", "Yates", "Nwosu", "Cordova",
];

const POSITION_WEIGHTS: { value: Position; weight: number }[] = [
  { value: "WR", weight: 16 },
  { value: "QB", weight: 11 },
  { value: "RB", weight: 12 },
  { value: "CB", weight: 11 },
  { value: "S", weight: 9 },
  { value: "LB", weight: 9 },
  { value: "OL", weight: 8 },
  { value: "DL", weight: 8 },
  { value: "TE", weight: 6 },
  { value: "ATH", weight: 4 },
  { value: "K", weight: 3 },
  { value: "P", weight: 3 },
];

function classYearWeights(season: number): { value: ClassYear; weight: number }[] {
  // Grad transfers became far more common in the portal/NIL era.
  const gradWeight = season >= 2018 ? 14 : 5;
  return [
    { value: "FR", weight: 6 },
    { value: "SO", weight: 24 },
    { value: "JR", weight: 26 },
    { value: "SR", weight: 18 },
    { value: "GR", weight: gradWeight },
  ];
}

// --- player generation ------------------------------------------------------
const players: Player[] = [];
let playerSeq = 0;

for (const cfg of SEASON_CONFIG) {
  for (let i = 0; i < cfg.sampleCount; i++) {
    playerSeq += 1;
    const id = `p${String(playerSeq).padStart(4, "0")}`;

    // Pick origin (slightly inverse to pull — weaker programs export more)
    // and destination (weighted by conference pull). Re-roll to avoid same
    // school on both ends.
    const fromSchool = weightedPick(
      SCHOOLS.map((s) => ({ value: s, weight: 7 - (CONFERENCE_PULL[s.conference] ?? 3) + 1 })),
    );
    let toSchool = weightedPick(
      SCHOOLS.map((s) => ({ value: s, weight: CONFERENCE_PULL[s.conference] ?? 3 })),
    );
    let guard = 0;
    while (toSchool.name === fromSchool.name && guard < 10) {
      toSchool = pick(SCHOOLS);
      guard++;
    }

    const position = weightedPick(POSITION_WEIGHTS);
    const class_year = weightedPick(classYearWeights(cfg.season));

    // Portal-era transfers carry a transfer_date; pre-portal years often don't.
    let transfer_date: string | null = null;
    if (cfg.season >= 2018) {
      // Window opens in December of the season year through April following.
      const inDec = rand() < 0.55;
      if (inDec) {
        transfer_date = `${cfg.season}-12-${String(randInt(4, 28)).padStart(2, "0")}`;
      } else {
        const m = pick(["01", "02", "03", "04"]);
        transfer_date = `${cfg.season + 1}-${m}-${String(randInt(1, 28)).padStart(2, "0")}`;
      }
    } else if (rand() < 0.4) {
      const m = pick(["05", "06", "07", "08"]);
      transfer_date = `${cfg.season}-${m}-${String(randInt(1, 28)).padStart(2, "0")}`;
    }

    players.push({
      player_id: id,
      player_name: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
      position,
      class_year,
      season: cfg.season,
      from_school: fromSchool.name,
      to_school: toSchool.name,
      from_conference: fromSchool.conference,
      to_conference: toSchool.conference,
      transfer_date,
      // Honest: we have no real source for fictional movement, so null.
      source_url: null,
      source_name: null,
    });
  }
}

// --- NIL deal generation ----------------------------------------------------
// NIL deals only exist in the NIL era (2021+). Mostly estimated/reported, with
// exactly 5 "confirmed" examples that each carry a real source URL (to a public
// NIL-data organization's landing page) so the confirmed-tier UI can be
// demonstrated. The dollar figures are illustrative placeholders, stated as
// such in each deal's notes.
const nilEraPlayers = players.filter((p) => p.season >= 2021);

// Real, stable public landing pages for NIL-tracking organizations. Used only
// for the 5 confirmed-tier sample rows so <SourceLink> has a genuine target.
const CONFIRMED_SOURCES: { name: string; url: string }[] = [
  { name: "On3 NIL", url: "https://www.on3.com/nil/" },
  { name: "Opendorse", url: "https://opendorse.com/" },
  { name: "ESPN", url: "https://www.espn.com/college-football/" },
];
const REPORTED_SOURCES: { name: string; url: string }[] = [
  { name: "On3 NIL", url: "https://www.on3.com/nil/" },
  { name: "247Sports", url: "https://247sports.com/" },
  { name: "Athletic reporting (aggregated)", url: "https://www.nytimes.com/athletic/college-football/" },
];

const nilDeals: NILDeal[] = [];
const NIL_DEAL_COUNT = 44;
const CONFIRMED_COUNT = 5;
const REPORTED_COUNT = 16;

// Shuffle nil-era players deterministically, then take a slice for deals.
const shuffled = [...nilEraPlayers].sort(() => rand() - 0.5);

for (let i = 0; i < NIL_DEAL_COUNT; i++) {
  const player = shuffled[i % shuffled.length];
  const deal_id = `d${String(i + 1).padStart(3, "0")}`;

  let confidence_level: ConfidenceLevel;
  let amount_type: AmountType;
  let reported_amount: number | null;
  let source_name: string | null;
  let source_url: string | null;
  let notes: string;

  if (i < CONFIRMED_COUNT) {
    // ASSUMPTION: the 5 "confirmed" sample deals point source_url at a real NIL-
    // data org's public landing page so the confirmed-tier UI (badge + source
    // link) can be demonstrated; the dollar figure is still illustrative and
    // said so in notes. No real person's amount is fabricated — names are synthetic.
    // Confirmed-tier demonstration row. Real source link; illustrative amount.
    confidence_level = "confirmed";
    amount_type = "exact";
    reported_amount = roundTo(randInt(75_000, 1_200_000), 5_000);
    const src = CONFIRMED_SOURCES[i % CONFIRMED_SOURCES.length];
    source_name = src.name;
    source_url = src.url;
    notes =
      "Illustrative confirmed-tier example in a SAMPLE dataset. The source link points to a real NIL-data organization, but the dollar figure is a placeholder for layout, not a real reported amount. See /methodology.";
  } else if (i < CONFIRMED_COUNT + REPORTED_COUNT) {
    confidence_level = "reported";
    amount_type = rand() < 0.5 ? "range" : "estimated";
    reported_amount = roundTo(randInt(25_000, 800_000), 5_000);
    const src = pick(REPORTED_SOURCES);
    source_name = src.name;
    source_url = src.url;
    notes =
      "Reported-tier sample value. In real data this would reflect a media-reported figure that has not been independently confirmed. Figure here is illustrative only.";
  } else {
    confidence_level = "estimated";
    const unknown = rand() < 0.22;
    if (unknown) {
      amount_type = "unknown";
      reported_amount = null;
      notes =
        "Estimated-tier sample row with no disclosed amount. Demonstrates how the app handles unknown NIL values without inventing a number.";
    } else {
      amount_type = "estimated";
      reported_amount = roundTo(randInt(5_000, 300_000), 1_000);
      notes =
        "Estimated-tier sample value, modeled from market context rather than a reported figure. Never treat as confirmed. Illustrative only.";
    }
    source_name = null;
    source_url = null;
  }

  nilDeals.push({
    deal_id,
    player_id: player.player_id,
    season: player.season,
    school: player.to_school,
    reported_amount,
    amount_type,
    confidence_level,
    source_url,
    source_name,
    notes,
  });
}

// --- season summaries -------------------------------------------------------
const seasonSummaries: SeasonSummary[] = SEASON_CONFIG.map((cfg) => {
  const isNilEra = cfg.season >= 2021;
  const reportedThisYear = nilDeals.filter(
    (d) =>
      d.season === cfg.season &&
      d.reported_amount !== null &&
      (d.confidence_level === "confirmed" || d.confidence_level === "reported"),
  );
  const total_reported_nil_value = isNilEra
    ? reportedThisYear.reduce((s, d) => s + (d.reported_amount ?? 0), 0)
    : null;

  return {
    season: cfg.season,
    total_transfers: cfg.total_transfers,
    total_reported_nil_value,
    estimated_nil_market_size: ESTIMATED_NIL_MARKET[cfg.season] ?? null,
    source_url: null,
    source_name: null,
    notes: isNilEra
      ? "Transfer count is an illustrative sample shaped to public reporting on portal volume. NIL figures are estimated/illustrative, not sourced; always shown with an estimated badge."
      : "Illustrative sample transfer volume. NIL compensation was not permitted under NCAA rules before July 1, 2021, so NIL fields are null.",
  };
});

// --- write files ------------------------------------------------------------
const LAST_UPDATED = "2024-12-31";
const DISCLAIMER =
  "This is illustrative sample data. Player-level NIL values are not confirmed. See /methodology for details.";

function wrap<T>(data: T[]): SeedFile<T> {
  return {
    _meta: { is_sample_data: true, last_updated: LAST_UPDATED, disclaimer: DISCLAIMER },
    data,
  };
}

const outDir = join(process.cwd(), "data", "seed");
mkdirSync(outDir, { recursive: true });

writeFileSync(join(outDir, "schools.json"), JSON.stringify(wrap(SCHOOLS), null, 2) + "\n");
writeFileSync(join(outDir, "season_summary.json"), JSON.stringify(wrap(seasonSummaries), null, 2) + "\n");
writeFileSync(join(outDir, "players.json"), JSON.stringify(wrap(players), null, 2) + "\n");
writeFileSync(join(outDir, "nil_deals.json"), JSON.stringify(wrap(nilDeals), null, 2) + "\n");

// Sanity log for the developer running the generator.
const confirmedCount = nilDeals.filter((d) => d.confidence_level === "confirmed").length;
console.log(`schools:         ${SCHOOLS.length}`);
console.log(`seasons:         ${seasonSummaries.length}`);
console.log(`players:         ${players.length}`);
console.log(`nil_deals:       ${nilDeals.length} (confirmed: ${confirmedCount})`);
console.log(`Used name pools — all player names are fictional sample data.`);
// Reference the unused helper so strict builds don't flag it; SCHOOL_BY_NAME is
// exported intent for future per-season conference lookups.
void SCHOOL_BY_NAME;
