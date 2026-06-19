import { afterAll, describe, expect, it } from "vitest";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runIngest } from "./ingest";
import type { CfbdClient } from "./client";
import type { EndpointDef } from "./endpoints";
import type { CfbdPortalPlayer, RawCacheFile } from "./types";

// A fake client that serves deterministic fixtures offline and counts calls.
// Proves cache behavior without a network call or an API key.
function fakeClient(fixtures: Record<string, unknown[]>): CfbdClient {
  let calls = 0;
  return {
    async get<T>(path: string): Promise<T> {
      calls += 1;
      const key = Object.keys(fixtures).find((k) => path.includes(k));
      return (fixtures[key ?? ""] ?? []) as T;
    },
    callCount: () => calls,
  };
}

const ENDPOINTS: EndpointDef[] = [
  { name: "portal", path: (y) => `/player/portal?year=${y}`, feeds: "x" },
  { name: "talent", path: (y) => `/talent?year=${y}`, feeds: "x" },
];

const FIXTURES: Record<string, unknown[]> = {
  "/player/portal": [
    { season: 2024, firstName: "A", lastName: "B", origin: "Alabama", destination: "Auburn", position: "RB" },
    { season: 2024, firstName: "C", lastName: "D", origin: "Texas", destination: null, position: "WR" }, // null destination — must be preserved
    { season: 2024, firstName: "E", lastName: "F", origin: null, destination: "LSU", position: "QB" }, // null origin
  ],
  "/talent": [{ year: 2024, school: "Alabama", talent: 900 }],
};

const opts = (dir: string, client: CfbdClient, force = false) => ({
  years: [2024],
  cacheDir: dir,
  client,
  force,
  endpoints: ENDPOINTS,
  now: () => "2026-06-18T00:00:00.000Z",
});

const dir = mkdtempSync(join(tmpdir(), "cfbd-ingest-"));
afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe("runIngest", () => {
  it("cold run fetches, caches, and preserves null portal destinations", async () => {
    const client = fakeClient(FIXTURES);
    const s = await runIngest(opts(dir, client));

    // 2 endpoints × 1 year = 2 network calls, 0 cache hits, 2 files written.
    expect(s.totals.apiCalls).toBe(2);
    expect(s.totals.cacheHits).toBe(0);
    expect(s.totals.filesWritten).toBe(2);
    expect(existsSync(join(dir, "portal_2024.json"))).toBe(true);

    // Null destination/origin are counted, not dropped.
    expect(s.portal.total).toBe(3);
    expect(s.portal.nullDestination).toBe(1);
    expect(s.portal.nullOrigin).toBe(1);

    // Provenance + raw nulls land on disk verbatim.
    const cached = JSON.parse(readFileSync(join(dir, "portal_2024.json"), "utf8")) as RawCacheFile<CfbdPortalPlayer>;
    expect(cached._meta.source).toBe("CollegeFootballData");
    expect(cached._meta.is_sample_data).toBe(false);
    expect(cached.data).toHaveLength(3);
    expect(cached.data.find((r) => r.origin === "Texas")?.destination).toBeNull();
  });

  it("warm rerun makes ZERO API calls (cache hit)", async () => {
    const client = fakeClient(FIXTURES); // fresh counter
    const s = await runIngest(opts(dir, client));

    expect(s.totals.apiCalls).toBe(0);
    expect(s.totals.cacheHits).toBe(2);
    expect(s.totals.filesWritten).toBe(0);
    expect(s.portal.total).toBe(3); // data intact from cache
  });

  it("--refresh forces a re-fetch", async () => {
    const client = fakeClient(FIXTURES);
    const s = await runIngest(opts(dir, client, true));

    expect(s.totals.apiCalls).toBe(2);
    expect(s.totals.cacheHits).toBe(0);
  });
});
