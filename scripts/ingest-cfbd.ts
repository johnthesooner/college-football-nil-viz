/**
 * TICKET-6 — Real CollegeFootballData (CFBD) ingestion (raw cache layer).
 *
 * Pulls real CFBD v2 data for a span of seasons and caches the RAW responses to
 * data/raw/<endpoint>_<year>.json. This ticket is ingestion ONLY:
 *   • it does NOT transform into the app's canonical model (that is TICKET-7), and
 *   • it does NOT touch data/seed/ — so the app keeps building keyless off the
 *     labeled sample data until the real marts land.
 *
 *   1. Get a free key (1k calls/mo): https://collegefootballdata.com/key
 *   2. Put it in .env (gitignored):  CFBD_API_KEY=...
 *   3. npm run ingest:cfbd                  # cold run: fetch + cache 2018–2025
 *      npm run ingest:cfbd                  # warm run: 0 API calls (uses cache)
 *      npm run ingest:cfbd -- --refresh     # force re-fetch
 *      npm run ingest:cfbd -- --years=2021-2024
 *
 * CFBD portal rows frequently have a null `destination` (a portal ENTRY without
 * a landing school). We preserve those verbatim and never invent completed
 * transfers — see the null-destination count in the summary.
 */
import { join } from "node:path";
import { loadEnv } from "../lib/cfbd/loadEnv";
import { createClient } from "../lib/cfbd/client";
import { runIngest } from "../lib/cfbd/ingest";
import type { IngestSummary } from "../lib/cfbd/types";

loadEnv();

const FREE_TIER_BUDGET = 1000;

function flagValue(name: string): string | undefined {
  const eq = process.argv.find((a) => a.startsWith(`--${name}=`));
  if (eq) return eq.slice(name.length + 3);
  const i = process.argv.indexOf(`--${name}`);
  const next = process.argv[i + 1];
  if (i >= 0 && next && !next.startsWith("--")) return next;
  return undefined;
}

function hasFlag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

function resolveYears(): number[] {
  let min = Number(flagValue("year-min") ?? 2018);
  let max = Number(flagValue("year-max") ?? 2025);
  const range = flagValue("years");
  if (range && /^\d{4}-\d{4}$/.test(range)) {
    const [a, b] = range.split("-").map(Number);
    min = a;
    max = b;
  }
  const years: number[] = [];
  for (let y = min; y <= max; y++) years.push(y);
  return years;
}

function printSummary(s: IngestSummary, force: boolean): void {
  const first = s.years[0];
  const last = s.years[s.years.length - 1];
  console.log("\n────────── CFBD ingest summary ──────────");
  console.log(`seasons       : ${first}–${last} (${s.years.length})`);
  console.log(`endpoints     : ${s.endpoints.length} (${s.endpoints.join(", ")})`);
  console.log(`API calls     : ${s.totals.apiCalls}${force ? "  [--refresh]" : ""}`);
  console.log(`cache         : ${s.totals.cacheHits} hits, ${s.totals.cacheMisses} misses, ${s.totals.filesWritten} files written`);
  console.log(`records (rows): ${s.totals.rowsTotal}`);
  console.log(
    `portal        : ${s.portal.total} entries — ${s.portal.nullDestination} null destination (entries w/o a landing), ` +
      `${s.portal.nullOrigin} null origin  [PRESERVED, not dropped]`,
  );
  console.log("per endpoint  :");
  for (const e of s.perEndpoint) {
    console.log(`   ${e.name.padEnd(20)} rows=${String(e.rows).padStart(7)}  calls=${e.apiCalls}  cacheHits=${e.cacheHits}`);
  }
  for (const sk of s.skipped) console.log(`skipped       : ${sk}`);
  console.log(`budget        : ${s.totals.apiCalls}/${FREE_TIER_BUDGET} free-tier calls used this run`);
  console.log("─────────────────────────────────────────\n");
}

async function main(): Promise<void> {
  const key = process.env.CFBD_API_KEY;
  if (!key) {
    console.error(
      "✖ CFBD_API_KEY is not set.\n" +
        "  Get a free key at https://collegefootballdata.com/key, then add it to .env (gitignored):\n" +
        "    CFBD_API_KEY=your_key_here",
    );
    process.exit(1);
  }

  const years = resolveYears();
  const force = hasFlag("refresh");
  const cacheDir = join(process.cwd(), flagValue("out-dir") ?? "data/raw");

  console.log(
    `CFBD ingest → ${cacheDir}  seasons ${years[0]}–${years[years.length - 1]}${force ? "  [--refresh]" : ""}`,
  );

  const client = createClient({ apiKey: key });
  const summary = await runIngest({ years, cacheDir, client, force, log: (m) => console.log(m) });
  printSummary(summary, force);
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
