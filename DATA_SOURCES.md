# Data Sources & Ingestion Plan

This document is the plan for replacing the illustrative sample data with real,
provenance-tracked data. It lists the exact fields each seed file needs,
recommended sources, the confidence rules each record must obey, and — just as
importantly — **what cannot be verified**.

> The shipped dataset is illustrative sample data (`_meta.is_sample_data: true`
> in every file). Nothing below has been ingested yet; this is the blueprint.

---

## Guiding principles

1. **Provenance travels with every record.** A figure without a source is, at
   best, `estimated`. Confirmed figures must link to a primary source.
2. **Never fabricate a NIL dollar value.** If an amount isn't disclosed, set
   `reported_amount: null` and `amount_type: "unknown"` — never `$0`, never a
   guess dressed up as precise.
3. **Respect source terms.** Do not scrape a site whose terms prohibit it, and
   do not republish licensed data. Prefer official APIs, exports, and
   sources that explicitly permit reuse. Document the terms for each source you
   actually use (see *Source concerns* below).
4. **Confidence is conservative.** When in doubt, downgrade
   (`confirmed → reported → estimated → unknown`).

---

## Required fields per file

All four files use the envelope `{ "_meta": {...}, "data": [ ... ] }`. The
`_meta` block is required on every file:

```json
"_meta": {
  "is_sample_data": false,
  "last_updated": "2025-01-15",
  "disclaimer": "…"
}
```

### `data/seed/players.json` — one row per transfer

| Field | Type | Required | Notes |
|---|---|---|---|
| `player_id` | string | ✅ | Stable unique id. |
| `player_name` | string | ✅ | Real name only if the source is public. |
| `position` | `Position` enum | ✅ | QB·RB·WR·TE·OL·DL·LB·CB·S·K·P·ATH. |
| `class_year` | `ClassYear` enum | ✅ | FR·SO·JR·SR·GR at time of transfer. |
| `season` | number | ✅ | Season year (e.g. 2024). |
| `from_school` / `to_school` | string | ✅ | Must match a `schools.json` name. |
| `from_conference` / `to_conference` | string | ✅ | Must match that school's conference. |
| `transfer_date` | string \| null | — | ISO `YYYY-MM-DD`, or null if unknown. |
| `source_url` | string \| null | — | Valid http(s) URL when present. |
| `source_name` | string \| null | — | Required if `source_url` is set. |

### `data/seed/nil_deals.json` — one row per reported NIL deal

| Field | Type | Required | Notes |
|---|---|---|---|
| `deal_id` | string | ✅ | Stable unique id. |
| `player_id` | string | ✅ | Must reference a `players.json` row. |
| `season` | number | ✅ | NIL era only (≥ 2021); must match the player's season. |
| `school` | string | ✅ | Must equal the player's `to_school`. |
| `reported_amount` | number \| null | — | USD. `null` when undisclosed (never `$0`). |
| `amount_type` | `AmountType` enum | ✅ | exact·range·estimated·unknown. `unknown` ⇔ null amount. |
| `confidence_level` | `ConfidenceLevel` enum | ✅ | confirmed·reported·estimated·unknown. |
| `source_url` | string \| null | — | **Required (valid http/https) when `confirmed`.** |
| `source_name` | string \| null | — | Required whenever `source_url` is set; required for `confirmed`/`reported`. |
| `notes` | string | ✅ | Non-empty. Must explain the data limitation. |

### `data/seed/season_summary.json` — one row per year

| Field | Type | Required | Notes |
|---|---|---|---|
| `season` | number | ✅ | One row per year, ideally 2005–present. |
| `total_transfers` | number | ✅ | League-wide volume for the year. |
| `total_reported_nil_value` | number \| null | — | Sum of reported deals; `null` before 2021. |
| `estimated_nil_market_size` | number \| null | — | Market estimate; `null` before 2021. Always rendered with an *Estimated* badge. |
| `source_url` / `source_name` | string \| null | — | Provenance when available. |
| `notes` | string | ✅ | Context and caveats. |

### `data/seed/schools.json` — one row per school

| Field | Type | Required | Notes |
|---|---|---|---|
| `school_id` | string | ✅ | Stable unique id. |
| `name` | string | ✅ | Display name; referenced by `players.json`. |
| `conference` | string | ✅ | Representative conference (see realignment caveat). |
| `state` | string | ✅ | Two-letter code. |
| `latitude` / `longitude` | number | ✅ | Campus coordinates (valid lat/long ranges). |

---

## Recommended sources

> **Researched & verified 2026-06-16.** The evaluation below was produced by a
> deep-research pass (fan-out web search → fetch primary sources → adversarial
> 3-vote verification). 25 claims were checked against primary sources (live API
> specs, pricing pages, and Terms of Service); 25 confirmed, 0 refuted. Each row
> notes whether it was independently verified or remains a documented gap.
> **ToS and pricing change** — re-check the cited pages before any real ingest.

### Master comparison

| Source | Fills | Access | Cost | Redistribution / ToS | Best tier | Verified |
|---|---|---|---|---|---|---|
| **CollegeFootballData (CFBD)** | players, schools, season `total_transfers` | REST API (key) + GraphQL | Free 1k calls/mo · **.edu 3k/mo** · paid $1–$30/mo | **Ingest+analyze OK; reselling/redistributing API data needs written permission.** No scraping/rate-limit evasion/disposable emails. | reported→confirmed (factual records) | ✅ primary |
| **Opendorse "NIL at 3" report** | season `estimated_nil_market_size` | PDF download | Free | Vendor report; cite + attribute, don't imply it's audited | estimated | ✅ primary |
| **On3** (NIL valuations, portal) | — (reference only) | Site (no public API) | Paid content | **OFF-LIMITS to ingest/redistribute.** ToS bans scraping/crawling/mining incl. AI/ML; personal non-commercial license only | estimated (manual cite) | ✅ primary |
| **247Sports** (CBSi/Paramount) | — (reference only) | Site (no public API) | — | **OFF-LIMITS.** Non-commercial use only; no distribute/modify/republish without written permission; no scraping | reported (manual cite) | ✅ primary |
| **Sports-Reference / CFB** | — (reference only) | Site, **no API, no bulk export** | Custom data req. $5k min | **OFF-LIMITS as a feed.** ToS bars building tools from scraped data; hard rate limits (20/min; 10/min FBref) that "jail" sessions | reported (manual cite) | ✅ primary |
| Official school/brand/collective announcements | nil_deals (the only `confirmed` path) | Web pages / PR | Free | Public; cite the announcement URL | **confirmed** | — (general) |
| ESPN / The Athletic reporting | players, nil_deals | Articles | Free/paid | Cite article URLs; "per sources" ⇒ `reported`, never `confirmed` | reported | — (general) |
| Rivals | — (reference only) | Site | — | Treat as off-limits by analogy (major-media owner); verify before use | reported (manual cite) | ⚠️ inferred |
| Wikipedia / Wikidata / DBpedia | schools (conference, coords) | API / dumps | Free | CC BY-SA (attribution + share-alike); generally safe for facts | estimated→reported | ⚠️ not verified here |
| GitHub geocoded-stadium / cfb datasets | schools (coords) | CSV in repos | Free | License varies per repo — **check each repo's LICENSE** | reported | ⚠️ not verified here |
| NCAA transfer-portal volume reports | season `total_transfers` | Reports/press | Free | Public aggregates; cite | reported→confirmed | ⚠️ not verified here |
| Commercial APIs (Sportradar, Genius, Stats Perform, SportsDataIO) | players, possibly pre-2021 | Licensed API | Paid (enterprise) | Licensed — redistribution governed by contract | reported | ⚠️ not verified here |

### Source detail (verified)

**CollegeFootballData / CFBD** — *the one ingestible backbone.*
- Fills **players.json**: `GET /player/portal` returns `PlayerTransfer` records
  (`season`, `firstName`, `lastName`, `position`, `origin`, `destination`,
  `transferDate`, `eligibility`) → maps to `player_name`, `position`, `season`,
  `from_school`, `to_school`, `transfer_date`. ⚠️ `from_conference` /
  `to_conference` / `source_url` / `source_name` are **not** in the payload —
  derive conference via `/teams`, set the source fields to the CFBD endpoint
  during ingest. Portal coverage realistically **begins ~2021**, so pre-2021
  player rows cannot come from CFBD alone.
- Fills **schools.json**: `/venues` (latitude, longitude, city, state) +
  `/teams/fbs` (school, conference, classification, city, state) → `name`,
  `conference`, `state`, coordinates.
- Fills **season_summary `total_transfers`**: derivable by counting portal rows
  per season.
- **Access/cost:** free, email-verified, non-transferable key. Free 1,000
  calls/mo; **academic `.edu` tier 3,000/mo**; paid Patreon $1/5k → $30/500k
  ($5/30k marketed as most popular). GraphQL needs **Tier 3 ($10/mo)** — but the
  **free REST tier is sufficient** for this project. Wrappers: `cfbfastR` (R),
  plus Python/JS clients; key via `CFBD_API_KEY` env var.
- **License:** ingesting and analyzing is fine; **reselling/redistributing the
  raw API data needs explicit CFBD permission**. Attribution optional but
  encouraged. (MIT on the wrapper *code* covers code, not data.)
- Cite: <https://collegefootballdata.com/> · `/api-tiers` · `/key` · `/terms`

**Opendorse "NIL at 3" (July 2024)** — *the citable market-size source for
`estimated_nil_market_size`.* Projects the total NIL market at **$917M (2021-22)
→ ~$1.67B (2024-25) → ~$2.55B projected (2025-26)**. These are **vendor
projections** from Opendorse's proprietary transaction data — attribute them and
label `estimated`, never present as audited.
Cite: <https://biz.opendorse.com/wp-content/uploads/2024/07/NIL-AT-3-The-Annual-Opendorse-Report-1.pdf>

**On3 / 247Sports / Sports-Reference — OFF-LIMITS to ingest or republish.**
Each prohibits scraping and redistribution of its content/valuations (On3 and
247Sports also bar AI/ML use; Sports-Reference has no API/bulk export and
rate-limits aggressively). NIL **valuations from these are model estimates** —
use them only as **manually-cited `estimated`-tier references**, never as an
auto-ingested feed, and never republish their numbers verbatim.
Cite: <https://www.on3.com/page/terms-of-service/> ·
<https://legal.paramount.com/us/en/cbsi/247sports-terms-of-use> ·
<https://www.sports-reference.com/data_use.html>

### Recommended ingestion plan (ranked)

1. **`players.json` (2021→present)** — CFBD `/player/portal`. Join conference via
   `/teams`; set `source_url`/`source_name` to the CFBD endpoint. This is the
   single highest-leverage step.
2. **`schools.json`** — CFBD `/teams/fbs` + `/venues` for conference, state, and
   coordinates. Cross-check coordinates against a CC-licensed source
   (Wikidata / a geocoded-stadium CSV) and keep whichever you can attribute.
3. **`season_summary.total_transfers`** — count CFBD portal rows per season (or
   cite an NCAA volume report); flip the file to real once populated.
4. **`season_summary.estimated_nil_market_size`** — Opendorse "NIL at 3"
   figures, attributed and badged `estimated`.
5. **`nil_deals.json`** — the hard one. Populate **only** from:
   - official school/brand/collective **announcements** → `confirmed` (+ source URL);
   - reputable **reporting** (ESPN/The Athletic, "per sources") → `reported`;
   - On3/247Sports **valuations**, manually entered and cited → `estimated`
     (never auto-ingested, never republished verbatim).
   Everything undisclosed stays `unknown` with `reported_amount: null`.
6. **Pre-2021 transfers** — out of reach from CFBD/free sources; either accept a
   2021→present scope or evaluate a licensed commercial API (unverified pricing).

**Bottom line:** CFBD + Opendorse get you a credible, mostly-real dataset for
three of four files. NIL *dollar* figures stay deliberately thin and clearly
labeled — that's the honest outcome, not a gap to paper over.

---

## Confidence rules (enforced by `npm run validate`)

| Tier | Badge | Requirement |
|---|---|---|
| `confirmed` | green | A primary source with a documented figure. **Must** have a valid `source_url` *and* `source_name`, and a non-null `reported_amount`. |
| `reported` | blue | Cited by reputable reporting but not independently confirmed. **Must** cite at least one of `source_url` / `source_name`. |
| `estimated` | amber | Modeled/inferred (e.g. a valuation). May be unsourced, but **must not** use `amount_type: "exact"`. |
| `unknown` | gray | A deal is known to exist but no credible amount is available → `reported_amount: null`, `amount_type: "unknown"`. |

Additional invariants the validator enforces: every `NILDeal` has non-empty
`notes`; `reported_amount` is never negative; `amount_type: "unknown" ⇔
reported_amount === null`; any `source_url` is a valid http(s) URL with a label;
NIL deals are NIL-era (≥ 2021) and reference a real player/school; ≤ 5
`confirmed` deals.

---

## What cannot be verified (be honest about this)

- **Most player-level NIL dollar amounts.** The large majority of deals are
  private; their exact value is unknowable. These should be `estimated` or
  `unknown`, never `confirmed`.
- **Deal structure.** Cash vs. in-kind, collective vs. brand, guaranteed vs.
  incentive-based — rarely disclosed beyond a single headline number.
- **The full transfer population.** Public trackers miss walk-ons and some
  lower-division moves; any sample is a slice, not a census.
- **Conference membership over time.** Realignment means a school's conference
  changes by year; the current model pins one representative conference.
- **Causation.** Why a player transferred (money, playing time, coaching) is not
  captured and generally not reliably knowable.

---

## Verification gaps & open questions

The 2026-06-16 research verified the CFBD, Opendorse, On3, 247Sports, and
Sports-Reference findings against primary sources. The following were **not**
verified and need a follow-up pass before relying on them:

- **Opendorse marketplace API/feed terms** — only the public "NIL at 3" report
  was verified, not any licensed player-level data feed.
- **Wikipedia / Wikidata / DBpedia** licenses (CC BY-SA share-alike obligations)
  and exact coverage for school coordinates/conference.
- **Kaggle / public GitHub CFB datasets** — licenses vary per repo; check each.
- **Commercial APIs** (Sportradar, Genius Sports, Stats Perform, SportsDataIO) —
  actual FBS transfer/NIL coverage, pricing, and redistribution terms. These may
  be the only licensed route to redistributable transfer data **pre-2021**.
- **State NIL disclosure laws / school or collective public registries** — could
  in principle supply `confirmed`/`reported` deal amounts rather than estimates.

Time-sensitivity: CFBD pricing is delivered via Patreon and "subject to change";
On3 (Apr 2026), 247Sports/CBSi, and Sports-Reference all carry recent
AI/ML-scraping clauses, indicating active tightening — **re-verify ToS and
pricing before any ingestion decision.**

---

## Source concerns / terms (fill in per source actually used)

Before ingesting from any source, record here:

- **Source name & URL:**
- **License / Terms of Service summary:** (does it permit reuse/redistribution?)
- **Scraping allowed?** (robots.txt, ToS) — if not, use an official API/export.
- **Attribution required?** (how to credit)
- **Rate limits / API key handling:** (keys go in env vars, never committed)

> If a source's terms are unclear or restrictive, do not ingest it. Prefer
> official APIs and explicitly reusable data.
