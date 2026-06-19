# TICKET-6 Sprint — Real CollegeFootballData Ingestion
### The unlock: replace synthetic seeds with real, measured data

**Drive this in Claude Code, step by step.** This is a spec, not finished code — your session implements it. Companion: [`FLAGSHIP_PLAN.md`](./FLAGSHIP_PLAN.md), [`DATA_SOURCES.md`](../DATA_SOURCES.md).
**Decision locked:** NIL dollars = **build a transparent model** (TICKET-9), never scrape On3/247. So this ingest must also pull the model's inputs (recruiting rating, usage, production, draft).

---

## 0. Definition of done (the acceptance gate)
- [ ] `CFBD_API_KEY` in gitignored `.env`; `.env.example` documents it; **key never committed**.
- [ ] `npm run ingest:cfbd` runs idempotently, pulls real CFBD data for **2018–2025**, and **caches raw JSON to `data/raw/`** (gitignored).
- [ ] Re-running without `--refresh` uses the cache and makes **zero** API calls.
- [ ] The script logs, per endpoint: call count, row count, and any null-rate warnings (esp. portal `destination`).
- [ ] Total cold-run API calls stay **under the free-tier 1,000/mo budget** (see §2).
- [ ] `tsc --noEmit` clean; no secret in git (`git ls-files | grep -i env` shows only `.env.example`).
- [ ] CFBD attribution noted in README/footer (carry to TICKET-14).

> Scope guard: TICKET-6 produces **raw cached pulls + typed clients only**. Transforming into the canonical model / marts is **TICKET-7**. Don't let the session scope-creep into modeling — stop at clean raw data + types.

---

## 1. Prerequisites
1. Create a free CFBD account → get an API key at **https://collegefootballdata.com/key**.
2. CFBD API **v2** base URL: `https://api.collegefootballdata.com`. **v2 requires** the key as a Bearer token: `Authorization: Bearer <KEY>`.
3. Add to `.env` (create if absent): `CFBD_API_KEY=...`  → confirm `.env` is gitignored.
4. **Verify exact v2 paths** against the live Swagger at `https://api.collegefootballdata.com` before coding — v2 renamed a few v1 routes. Two valid client options:
   - **Option A (recommended for the portfolio story): a thin typed fetch wrapper** you write — shows you can consume a keyed API, handle rate limits, retry, and budget calls.
   - **Option B (faster): the official generated TS client** (`npm i cfbd`) — correct v2 paths/types out of the box; less to show off. Pick A unless you're time-boxed.

---

## 2. Call-budget plan (free tier = 1,000 calls/mo)

| Endpoint (v2 — verify on Swagger) | Params | Calls (2018–25) | Feeds |
|---|---|---|---|
| `/player/portal` | `year` | 8 | transfers (D1/D2) |
| `/recruiting/players` | `year` | 8 | recruiting_ratings (D3) + **NIL model** |
| `/recruiting/teams` | `year` | 8 | team recruiting rank |
| `/talent` | `year` | 8 | team talent composite (D4/D5) |
| `/ratings/sp` | `year` | 8 | performance (D4) |
| `/teams/fbs` | `year` | 8 | **per-season conference → realignment** |
| `/draft/picks` | `year` | 8 | draft_outcomes + **NIL model** (D9) |
| `/stats/player/season` | `year` (+ category) | 8–24 | usage/production → **NIL model** |
| **Subtotal (no rosters)** | | **~64–80** | well under 1,000 ✅ |
| `/roster` | `team` × `year` | ~130 × 8 = **1,040** ❌ | **DEFER** — blows the budget alone |

**Decision:** **skip `/roster` in TICKET-6.** Do entity resolution in TICKET-7 off recruiting + portal names first. If you later need rosters, pull them on the **$5 tier (30k calls)** — not the free tier. Log this trade-off in the script output (no silent caps).

---

## 3. File plan
```
.env                      # CFBD_API_KEY (gitignored)         [edit]
.env.example              # document CFBD_API_KEY=             [edit]
.gitignore                # add data/raw/ and confirm .env     [edit]
lib/cfbd/client.ts        # typed Bearer fetch wrapper          [new]
lib/cfbd/types.ts         # CFBD response interfaces            [new]
lib/cfbd/endpoints.ts     # endpoint fns (getPortal(year)…)     [new]
scripts/ingest-cfbd.ts    # orchestrator (build out the stub)   [edit]
data/raw/*.json           # cached raw pulls (gitignored)       [generated]
```

---

## 4. Data contracts (write these types first — they anchor everything)
Define in `lib/cfbd/types.ts`. Minimum viable shapes (verify field names on Swagger; CFBD fields are mostly snake_case):

```ts
// Transfer portal — note: destination is FREQUENTLY null (entry without a landing)
export interface CfbdPortalPlayer {
  season: number;
  firstName: string | null;
  lastName: string | null;
  position: string | null;
  origin: string | null;        // origin school
  destination: string | null;   // landing school — OFTEN NULL
  transferDate: string | null;  // ISO
  rating: number | null;        // recruit-style rating
  stars: number | null;
  eligibility: string | null;
}

export interface CfbdRecruit {
  year: number; name: string; position: string | null;
  stars: number | null; rating: number | null; ranking: number | null;
  committedTo: string | null;
}

export interface CfbdTalent { year: number; school: string; talent: number; }
export interface CfbdSpRating { year: number; team: string; rating: number; offense?: number; defense?: number; }
export interface CfbdFbsTeam { school: string; conference: string | null; abbreviation?: string; }
export interface CfbdDraftPick { year: number; name: string; position: string | null; round: number; pick: number; nflTeam: string; college: string; }
export interface CfbdPlayerSeasonStat { season: number; player: string; team: string; category: string; statType: string; stat: number; }
```

---

## 5. Client spec (`lib/cfbd/client.ts`)
A thin, typed wrapper. Behavior contract:
- Reads `process.env.CFBD_API_KEY`; **throws a clear error if missing** ("set CFBD_API_KEY in .env").
- `cfbdFetch<T>(path: string, params: Record<string,string|number>): Promise<T>`:
  - builds `https://api.collegefootballdata.com{path}?{querystring}`,
  - sets `Authorization: Bearer ${key}` + `Accept: application/json`,
  - **retry with backoff** on 429/5xx (e.g., 3 tries, 1s→2s→4s, honor `Retry-After`),
  - increments a module-level **call counter** (for budget logging),
  - throws on non-2xx with status + body snippet.
- Export a `getCallCount()` for the orchestrator to log.

`lib/cfbd/endpoints.ts` wraps each route as a typed function: `getPortal(year) => Promise<CfbdPortalPlayer[]>`, `getRecruits(year)`, `getTalent(year)`, `getSpRatings(year)`, `getFbsTeams(year)`, `getDraftPicks(year)`, `getPlayerSeasonStats(year, category?)`.

---

## 6. Orchestrator spec (`scripts/ingest-cfbd.ts`)
- `const YEARS = range(2018, 2025)` (inclusive).
- For each endpoint × year: **check cache first** (`data/raw/<endpoint>_<year>.json`). If present and no `--refresh` flag → load from disk (0 API calls). Else fetch, write to cache.
- After each endpoint group, **log**: rows pulled, calls made, and **data-quality warnings** — at minimum the portal `destination` null-rate (`X% of portal rows have no landing school — these are entries, not completed transfers`).
- At the end, log **total API calls** vs the free-tier budget, and explicitly note **"rosters skipped to stay within free tier."**
- Idempotent: a second run with warm cache makes 0 calls and reproduces identical files.
- `--refresh` (or `--refresh=portal`) forces re-fetch.
- `--years=2021-2024` optional override for quick tests (keep cold runs small while developing).

---

## 7. Hygiene
- `.gitignore`: add `data/raw/` (regenerable, possibly large) and confirm `.env` is ignored. (TICKET-7 commits the small `data/marts/` so the app still builds keyless — preserving the repo's nice "runs with zero keys" property.)
- `.env.example`: add `CFBD_API_KEY=` with a comment linking to the key page.
- **Never** log the key. **Never** commit `.env`.

---

## 8. How to drive this in Claude Code
1. `cd ~/nil-portal && claude`
2. **Plan mode first** (Shift+Tab): paste this prompt —
   > Read `docs/TICKET-6-SPRINT.md` and `scripts/ingest-cfbd.ts`. This repo is bleeding-edge Next 16 (see `AGENTS.md`) but this is a tsx script, not Next code. Propose a plan to implement TICKET-6 exactly to the spec: typed CFBD v2 client (Bearer auth, retry/backoff, call counter), response types, endpoint wrappers, and an idempotent caching orchestrator for years 2018–2025. Verify the exact v2 endpoint paths against the CFBD Swagger before coding. Do NOT transform into the canonical model — that's TICKET-7. Stop at clean cached raw data + types.
3. Review/approve the plan. Add your CFBD key to `.env` when prompted.
4. Let it implement. **Give it the verification target:** `npm run ingest:cfbd` succeeds, caches to `data/raw/`, logs counts + the portal null-rate, and a warm re-run makes 0 calls.
5. Have it run `tsc --noEmit` and confirm `git status` shows no `.env`.
6. Commit + push: `git add -A && git commit -m "TICKET-6: real CFBD ingestion pipeline" && git push`.

---

## 9. Acceptance checklist (paste into the session as the gate)
- [ ] `npm run ingest:cfbd` cold-run pulls 2018–2025, **<1,000 API calls**, caches to `data/raw/`.
- [ ] Warm re-run = **0 API calls**, identical output.
- [ ] Logs row counts + **portal destination null-rate** + "rosters skipped (budget)".
- [ ] `lib/cfbd/{client,types,endpoints}.ts` typed; `tsc --noEmit` clean.
- [ ] `.env` gitignored; `.env.example` updated; `git ls-files | grep -i env` → only `.env.example`.
- [ ] Retry/backoff handles a simulated 429.
- [ ] Raw files have a `_meta` with `source: "CollegeFootballData"`, `pulled_at`, `is_sample_data: false`.

---

## 10. Guardrails
- **Key security:** never print/commit `CFBD_API_KEY`. (Your zsh runs `#` as args — Claude won't put inline comments in paste commands.)
- **Attribution:** CFBD is free-to-use with attribution requested — add "Data: CollegeFootballData.com" to the footer/README in TICKET-14.
- **Budget honesty:** if you ever add rosters or blow past free-tier, `log()` it — no silent truncation.
- **Don't scope-creep:** raw pulls + types only. Canonical model, entity resolution, and the measured finding are TICKET-7/8.

## 11. Handoff → TICKET-7
Once raw `data/raw/*.json` exists and is clean, TICKET-7 builds the canonical, entity-resolved marts (`data/marts/`), adds `school_seasons` for realignment, flags `landed:false` on null-destination transfers, and emits the typed tables the analytics (TICKET-8) and the NIL model (TICKET-9) consume.
