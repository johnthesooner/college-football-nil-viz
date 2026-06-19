// TICKET-6 ingestion core — pure orchestration over an injected client + cache
// directory, so it is unit-testable offline. The CLI wrapper lives in
// scripts/ingest-cfbd.ts.
//
// Contract:
//  - For each (endpoint, year): use the on-disk cache if present (0 API calls),
//    else fetch and write data/raw/<endpoint>_<year>.json.
//  - `--refresh` (force=true) re-fetches everything.
//  - Portal null `destination`/`origin` are PRESERVED and counted, never dropped.
//  - Returns a summary the CLI prints and the tests assert.
//
// NOTE: this module uses node:fs and is consumed only by scripts/tests — never
// import it into an `app/` component (it must not reach the client bundle).

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { CfbdClient } from "./client";
import { ENDPOINTS, SKIPPED } from "./endpoints";
import type { EndpointDef } from "./endpoints";
import type { CfbdPortalPlayer, EndpointSummary, IngestSummary, RawCacheFile } from "./types";

export interface IngestOptions {
  years: number[];
  cacheDir: string;
  client: CfbdClient;
  /** force re-fetch even when a cache file exists (`--refresh`) */
  force?: boolean;
  /** overridable for tests; defaults to the full ENDPOINTS registry */
  endpoints?: EndpointDef[];
  /** progress logger (defaults to no-op) */
  log?: (msg: string) => void;
  /** injectable clock for deterministic tests */
  now?: () => string;
}

function isNullish(v: unknown): boolean {
  return v === null || v === undefined || v === "";
}

export async function runIngest(opts: IngestOptions): Promise<IngestSummary> {
  const { years, cacheDir, client, force = false } = opts;
  const endpoints = opts.endpoints ?? ENDPOINTS;
  const log = opts.log ?? (() => {});
  const now = opts.now ?? (() => new Date().toISOString());

  mkdirSync(cacheDir, { recursive: true });

  const perEndpoint: EndpointSummary[] = [];
  let cacheHits = 0;
  let cacheMisses = 0;
  let rowsTotal = 0;
  let filesWritten = 0;
  let portalTotal = 0;
  let portalNullDest = 0;
  let portalNullOrigin = 0;
  const callsBefore = client.callCount();

  for (const ep of endpoints) {
    let rows = 0;
    let hits = 0;
    const callsAtStart = client.callCount();

    for (const year of years) {
      const file = join(cacheDir, `${ep.name}_${year}.json`);
      let data: unknown[];

      if (!force && existsSync(file)) {
        const cached = JSON.parse(readFileSync(file, "utf8")) as RawCacheFile;
        data = Array.isArray(cached.data) ? cached.data : [];
        hits += 1;
        cacheHits += 1;
        log(`  cache  ${ep.name} ${year}  (${data.length} rows)`);
      } else {
        const fetched = await client.get<unknown>(ep.path(year));
        data = Array.isArray(fetched) ? fetched : []; // CFBD returns arrays for these endpoints
        const payload: RawCacheFile = {
          _meta: {
            source: "CollegeFootballData",
            endpoint: ep.name,
            year,
            pulled_at: now(),
            is_sample_data: false,
            row_count: data.length,
          },
          data,
        };
        writeFileSync(file, JSON.stringify(payload, null, 2) + "\n");
        cacheMisses += 1;
        filesWritten += 1;
        log(`  fetch  ${ep.name} ${year}  (${data.length} rows) → ${file}`);
      }

      rows += data.length;
      rowsTotal += data.length;

      if (ep.name === "portal") {
        for (const r of data as CfbdPortalPlayer[]) {
          portalTotal += 1;
          if (isNullish(r?.destination)) portalNullDest += 1;
          if (isNullish(r?.origin)) portalNullOrigin += 1;
        }
      }
    }

    perEndpoint.push({
      name: ep.name,
      rows,
      apiCalls: client.callCount() - callsAtStart,
      cacheHits: hits,
    });
  }

  return {
    years,
    endpoints: endpoints.map((e) => e.name),
    perEndpoint,
    totals: {
      apiCalls: client.callCount() - callsBefore,
      cacheHits,
      cacheMisses,
      rowsTotal,
      filesWritten,
    },
    portal: { total: portalTotal, nullDestination: portalNullDest, nullOrigin: portalNullOrigin },
    skipped: SKIPPED,
  };
}
