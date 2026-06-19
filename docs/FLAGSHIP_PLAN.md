# NIL Portal → Flagship Product Plan
### Turning `college-football-nil-viz` from honest prototype into a real-data analytics product

**Prepared:** 2026-06-18 · **Reviewer stance:** Principal PM + Staff Data Engineer + Senior Full-Stack Eng + Technical Recruiter, deciding whether this survives a senior-level interview.
**Companion docs:** [`CRITICAL_REVIEW.md`](../CRITICAL_REVIEW.md) (the brutal engineering teardown — still accurate), [`DATA_SOURCES.md`](../DATA_SOURCES.md), [`docs/REAL_DATA_IMPORT.md`](./REAL_DATA_IMPORT.md).

---

## 0. The one decision that governs everything

> **Today this repo is a strong *frontend* portfolio piece (~7.5/10) and a weak *data/analytics* piece (~5/10). You are targeting Senior Data Analyst / Analytics Engineer / Product Analyst / Data Scientist / Analytics Manager roles. So the project is currently built for the audience you are NOT interviewing with.**

Every recommendation below serves one pivot: **from "beautifully honest shell around data the repo invented" → "real-data product that answers measurable questions, with a transparent model you built."** The honesty/confidence framing is your genuine differentiator — **keep it**, but wrap it around *real* CollegeFootballData, not a `CONFERENCE_PULL` prior fed back to the user.

The legal research forces — and rewards — the second key move: **you cannot legally scrape On3/247 NIL dollar valuations** (their ToS explicitly prohibits scraping and republishing). That sounds like a wall. It's actually the gift: instead of laundering someone else's numbers, you **build and document your own transparent NIL valuation model** from legally-clean CFBD inputs (recruiting rating, portal rating, usage, production, draft outcomes). That is *exactly* the artifact a Data Scientist / Analytics Engineer is hired to produce — and almost no public NIL project has one.

---

# DELIVERABLE A — Brutally Honest Repo Audit (Phase 1)

**Headline:** Excellent software engineering, near-zero real analysis. The existing `CRITICAL_REVIEW.md` already nailed the engineering teardown and scored it **6.5/10 today, 8.5 after presentation fixes (most already done), ~9 with a real CFBD ingest.** I concur and extend it below for the analytics-hiring lens.

| Area | Current state | Risks | Missing capabilities | Priority | Recommended fix |
|---|---|---|---|---|---|
| **Architecture** | Clean Next 16 App Router; `app/` routes w/ error/loading/not-found boundaries; `components/{ui,charts,filters,layout}`; pure `lib/data/*`; `scripts/` (generate-seed, validate, ingest-cfbd stub). 4,974 LOC, well-proportioned. | Bleeding-edge Next 16/React 19 is pin-sensitive (`AGENTS.md` warns). No real data/ETL layer — `ingest-cfbd.ts` is a stub. | A genuine ingestion → canonical-model → analytics pipeline. Separation of "raw pull" vs "modeled marts." | **P1** | Build the ETL layer (TICKET-6/7); keep the clean component arch as the delivery tier. |
| **Code quality** | Strict TS, `tsc` clean, ESLint 0 warnings, deterministic seed PRNG, well-commented. Genuinely good. | The best-engineered file (`generate-seed.ts`) is also the source of the honesty problem. | Component/interaction tests; typed CFBD client wrappers. | **P3** | Keep standards; add the data-pipeline code at the same bar. |
| **UI/UX** | Polished: 6 pages, custom Sankey, filters, confidence badges, skeletons. | Mobile nav is a scroll-strip, not a real menu; some circular StatCards. | Real "data freshness / last updated" surface; a guided first-run. | **P2** | Real mobile menu; data-freshness badge; lead with the thesis. |
| **Data model** | 4 seed JSONs (`players`, `schools`, `nil_deals`, `season_summary`), each with `_meta.is_sample_data:true`. Schools carry lat/long + conference. | `is_sample_data:true` everywhere = the whole product is synthetic. No player identity across sources; conference is static (realignment ignored). | Canonical model: entity-resolved players, per-season conference, transfers as events, recruiting ratings, performance metrics, modeled NIL. | **P1** | Adopt the canonical schema in Deliverable C. |
| **Visualizations** | Custom bipartite Sankey (impressive), dual-axis timeline, NIL bars, paginated player table. Good craft. | Sankey conference-twice is unintuitive; dual-axis invites false-correlation read; tiny per-season n over-dramatizes bands. | Conference flow **matrix/chord**; **geographic** flow map (lat/long already present); winners/losers leaderboard; recruiting-vs-performance scatter. | **P2** | Add matrix + map + scatter on real data (TICKET-11). |
| **Analytics methodology** | `/methodology` page is genuinely excellent — names the causation trap, documents the data dictionary, confidence tiers. | **The findings are circular** (echo the `CONFERENCE_PULL` prior). Validation proves *consistency, not truth*. No statistics, no hypothesis, no measured result. | A real question answered from real data; a documented metric (net talent flow); a transparent model; basic stats (correlation, distributions, significance). | **P0** | This is the gap that matters most. Measure real flows; build the NIL model; state findings (Deliverable D). |
| **Documentation** | Strong: README case study, DATA_SOURCES, REAL_DATA_IMPORT, MARKET_ANALYSIS, LAUNCH, and a candid CRITICAL_REVIEW. Above most portfolios. | README still readable as "real data" by a skimmer; no live URL. | A crisp "what question, what data, what I found" up top; live demo link. | **P2** | Rewrite README around the real findings + live link (TICKET-14). |
| **Testing** | 55 unit tests across the pure data layer, all green; validate gate on predev/prebuild. | No component/interaction/a11y tests; validation is a closed loop with the generator. | Pipeline tests (schema, null-handling, entity resolution); a few component tests; data-quality assertions on real pulls. | **P2** | Add pipeline + data-quality tests (TICKET-7/8). |
| **Performance** | All routes static-prerender; AutoSizer over ResponsiveContainer (smart). Fast. | Real data (thousands of portal rows × seasons) may outgrow static JSON in the client. | Server-side aggregation / precomputed marts; pagination/virtualization for large tables. | **P3** | Precompute marts at build; ship slim view-models. |
| **Accessibility** | ConfidenceBadge a11y is good; player-row keyboard expansion fixed this pass. | Residual: mobile nav, focus management on filters. | Full keyboard pass; axe CI check. | **P3** | Add an axe test; finish nav a11y. |
| **Recruiter appeal** | First 60s: frontend HM ≈8/10; **data/analytics HM ≈5/10**; product-analyst HM ≈6/10. | For your target roles, the current first impression ("another NIL dashboard, synthetic") risks a bounce before the methodology shines. | A measured finding above the fold; a model; a live link. | **P0** | Reframe for the analytics audience (Deliverable F). |
| **Portfolio value** | Above-average; differentiated honesty framing; let down by no real finding + no live URL. | Stays an "impressive student project" without the real-data pivot. | Real data + transparent model + live deploy = jumps to top-decile. | **P0** | Execute TICKET-6→14. |
| **Legal/data integrity** | Honest labeling system is best-in-class *in design*; `.env.example` clean, no secrets. | The one self-inflicted hole (Confirmed badge + On3 link + fabricated $) is being fixed; **scraping On3/247 NIL would be a real ToS violation** if you "go real" naively. | A documented, ToS-safe NIL approach (model, not scrape). | **P1** | Model NIL transparently; never republish On3/247 valuations (Deliverable C §NIL). |

**Bottom line for an EM:** *"Can this person ship a polished app? Obviously yes. Can they do data work? Not demonstrated — yet. Fix that one thing and it's a showcase."*

---

# DELIVERABLE B — End-State Product Vision (Phase 2)

**Positioning:** *"The honest, real-data atlas of college-football talent flow — measured portal movement, recruiting-to-transfer pathways, and a transparent, open NIL valuation model."* The differentiator is **rigor + transparency**, not prettiness.

### What makes it best-in-class (and who it impresses)
- **Recruiters:** a *live*, polished, fast app + a one-line measurable finding ("SEC was the #1 net talent importer 2021–24, +N rated points") + a clean GitHub.
- **Hiring managers (analytics):** a real ETL pipeline, a canonical data model, a documented metric, and a finding with a caveat — i.e., evidence you do the *job*.
- **Sports analysts:** measured net-talent flows, recruiting→portal pathways, and conference-realignment impact they can't easily get elsewhere for free.
- **Data engineers:** idempotent ingestion from a keyed API, entity resolution across recruiting/portal/roster, precomputed marts, scheduled refresh, tests.
- **Product leaders:** a clear question for a clear user, honest confidence labeling as a *product principle*, and a roadmap.

### Scope ladder (must / should / nice)

| Tier | Theme | Must-have | Should-have | Nice-to-have |
|---|---|---|---|---|
| **MVP** (real-data v0) | "It's real now" | Real CFBD ingest of transfer portal + recruiting + talent + SP+ for 2018–2025; canonical model; **one measured headline finding**; live Vercel URL; honesty labels intact | Net-talent-flow metric per school/conference; recruiting→portal join | Geographic flow map |
| **V1** (the analyst product) | "It answers questions" | Transparent **NIL estimate model** (documented, labeled); conference flow **matrix**; portal winners/losers leaderboard; recruiting-vs-SP+ scatter; data-freshness UI | Statistical rigor (correlations w/ CIs, distribution views); methodology rewrite; pipeline tests | Player search across real rosters |
| **V2** (the data product) | "It compounds" | Scheduled refresh (cron/Action) + snapshotting; precomputed marts; a public read **API or downloadable dataset**; per-season realignment | Draft-outcome analysis; talent-retention metric; team pages | Saved views / shareable deep links |
| **Stretch** | "It predicts" | A documented **predictive model** (e.g., projected landing-tier for a portal entrant, or transfer-likelihood) with honest eval metrics | Model card + backtest; A/B of model versions | Conversational "ask the data" layer over the marts |

**Cut-line discipline:** MVP must ship before anything in V1. The fastest path to "showable" is MVP, not V2 polish.

---

# DELIVERABLE C — Data Architecture (Phase 3)

### C.1 Source evaluation (from the sourcing research, June 2026)

| Source | Coverage | Reliability | Cost | Update freq | Legal | Difficulty | Verdict |
|---|---|---|---|---|---|---|---|
| **CollegeFootballData API v2** | Portal (`/player/portal`, ~2018+), recruiting (back to 2000), team talent composite, SP+/ELO/FPI/SRS, rosters, usage, season stats, draft | High (community standard) | Free tier 1,000 calls/mo; $5 tier 30k; recruiting/portal/ratings are **in the free tier** | Continuous (live data gated to paid; static analytics not) | Free-to-use, **attribution requested**; now requires an **API key (Bearer)** | **1/5** | **PRIMARY — build 90%+ on this** |
| CFBD CSV exporter | Same data, manual filter→CSV | High | Free | Manual | Same | 1/5 | Use for offline seeding/dev |
| NCAA Transfer Portal (official) | All entries | High | — | 2-day SLA | **Compliance-only; NO public API** | N/A | Cannot use — CFBD is the proxy |
| 247 / On3 / Rivals recruiting | Composite rankings | High | — | Continuous | **Scraping prohibited (ToS)** | 5/5 | **Avoid** — get composite via CFBD |
| ESPN hidden APIs | Logos, scores, light enrich | Med | Free | Continuous | Undocumented, unsupported, not licensed for redistribution | 2/5 | Optional, non-critical, degrade-gracefully |
| Sports-Reference | Deep historical stats | High | — | — | **Automated access prohibited; 10–20 req/min; 3rd-party licensed** | — | **Do not scrape** |
| **On3 NIL Valuation / NIL 100** | Algorithmic *projection* of annual NIL value (not actual $) | Med (it's an estimate itself) | — | Continuous | **ToS prohibits scrape/republish/commercial use; no API** | 5/5 | **Do not republish.** Model your own instead |
| Opendorse | Real deal data | High | Paid B2B partnership | — | No public/portfolio feed | — | Not accessible |
| Wikipedia transfer lists | Partial, curated | Med | Free | Manual | CC BY-SA (attribution + share-alike) | 3/5 | Optional cross-check only |
| Kaggle CFB portal/recruiting sets | Snapshot | Med | Free | Stale | Check dataset license | 2/5 | Offline prototype only; pull CFBD live for the product |

**Recommended sourcing stack:** (1) **CFBD API** = backbone; (2) **CFBD CSV exporter** = offline seed/dev; (3) **ESPN hidden API** = optional cosmetic enrichment, never load-bearing. **Avoid all scraping of On3/247/Rivals/Sports-Reference.**

### C.2 The NIL-dollar decision (the integrity crux — read twice)
There is **no legitimately redistributable NIL-dollar dataset.** On3's own numbers are *projections*, and their ToS forbids republishing. Therefore:
1. **Do not scrape or republish On3/247 NIL valuations.** (Brand/legal risk on the exact artifact you show employers.)
2. **Build your own transparent NIL estimate model** from CFBD-legal inputs, label every output **"modeled estimate — not an actual contract value,"** and show the methodology. *This is the strongest analyst-portfolio version of the project.*
3. **Never present any NIL figure as verified.** Keep the existing confidence-tier system; "confirmed" tier should be empty unless you have a genuinely public, citable, deal-specific source.

### C.3 Canonical data model
Normalize CFBD pulls into these tables (typed in `lib/types.ts`; persisted as precomputed JSON marts or SQLite):

```
conferences        (conference_id, name, tier)
seasons            (season, fbs_team_count, portal_window_open, notes)
schools            (school_id, name, state, lat, lng)
school_seasons     (school_id, season, conference_id)         -- handles REALIGNMENT
players            (player_id, name, position, height, weight) -- entity-resolved identity
recruiting_ratings (player_id, recruit_year, stars, rating, ranking, committed_school_id, source='247composite via CFBD')
player_seasons     (player_id, season, school_id, usage, production_metrics...)
transfers          (transfer_id, player_id, season, origin_school_id, destination_school_id NULL, transfer_date, rating, stars, eligibility, landed BOOL)
performance_metrics(school_id, season, sp_plus, elo, fpi, srs, wins, losses)
nil_estimates      (player_id, season, modeled_value, model_version, inputs_json, confidence='estimated')
draft_outcomes     (player_id, draft_year, round, pick, nfl_team, was_transfer BOOL)
```
**Key modeling realities to engineer for:** `transfers.destination_school_id` is **frequently NULL** in CFBD (portal *entry* without a landing) → add a `landed` flag and handle null destinations everywhere (don't assume every portal row is a completed move). **Entity resolution** across recruiting↔portal↔roster (name+position+year fuzzy match) is the genuinely hard, genuinely impressive part — document it. **Per-season conference** via `school_seasons` so 2024 SEC includes Texas/Oklahoma and 2024 Big Ten includes Oregon/Washington.

---

# DELIVERABLE D — Analytics Roadmap (Phase 4): the high-value stories

Ranked by (wow × defensibility-on-real-data). Each is *measurable* from CFBD — no inventions.

| # | Story | Headline metric(s) | Chart(s) | Required data | Methodology |
|---|---|---|---|---|---|
| **D1** | **Net talent flow — portal winners & losers** | Σ portal `rating` inflow − outflow per school/conference per season | Diverging bar leaderboard; conference **matrix/chord** | transfers + ratings | Aggregate rated portal entries by origin/destination; handle null destinations (exclude from "landed" sums, report separately); rank net |
| **D2** | **The portal explosion** | Total portal entries by season 2018→2025; rated vs unrated | Line w/ real counts (replace the invented ramp) | transfers | Count by season; annotate rule changes (one-time transfer 2021) — correlation, not causation |
| **D3** | **Recruiting → portal pathway** | P(transfer within N yrs) by recruiting star tier | Cohort/funnel + survival-style curve | recruiting_ratings ⋈ transfers | Join recruits to later portal entries; rate by star bucket; report with CIs |
| **D4** | **Does recruiting buy wins?** | Correlation: 247 talent composite vs SP+ | Scatter + fitted line + r | recruiting/talent ⋈ performance | Pearson/Spearman with CI; residual call-outs (over/under-performers) |
| **D5** | **Conference realignment talent impact** | Talent gained/lost by SEC/B1G/Big12/ACC pre vs post realignment | Before/after bars; map | school_seasons ⋈ talent ⋈ transfers | Compare net talent under correct per-season membership |
| **D6** | **Transparent NIL valuation model** | Modeled NIL value (labeled estimate) | Leaderboard + model-input breakdown | recruiting + usage + production + draft | Documented weighted model + **model card**; clearly "estimate"; sensitivity table |
| **D7** | **Talent concentration / hoarding** | Gini or top-10-share of incoming portal talent | Lorenz curve / share chart | transfers + ratings | Compute concentration index by season; trend |
| **D8** | **Geographic flow** | Inter-state/region player movement | Flow map (lat/long already in schools) | transfers + schools | Great-circle arcs weighted by count/rating |
| **D9** | **Draft payoff of transfers** | Draft rate: transfers vs non-transfers, by star tier | Grouped bars | transfers ⋈ draft ⋈ recruiting | Rates with CIs; honest small-n flags |

**Lead with D1 + D2** for the MVP headline (most measurable, most "finding"-shaped). **D6 is your data-science signature.** D3/D4 show statistical literacy.

---

# DELIVERABLE E — Implementation Roadmap (Phase 5)

Continues the existing ticket numbering (TICKET-1→5 done; TICKET-6 was scoped). Effort in ideal focused days. **No code yet — this is the plan.**

### TICKET-6 — Real CFBD ingestion pipeline ⭐ (the unlock)
- **Objective:** Replace synthetic seeds with real CFBD data for 2018–2025: portal, recruiting, talent, SP+/ELO, rosters.
- **Effort:** 1.5–2 d · **Deps:** CFBD API key (free tier); `.env` (`CFBD_API_KEY`)
- **Files:** `scripts/ingest-cfbd.ts` (build out the stub), `lib/cfbd/client.ts` (typed Bearer client), `data/raw/*.json` (cache), `.env.example`
- **Acceptance:** idempotent `npm run ingest:cfbd` pulls + caches raw JSON; rate-limit aware; **no key committed**; raw row counts logged; runs on free tier within call budget.

### TICKET-7 — Canonical model + entity resolution
- **Objective:** Transform raw pulls into the Deliverable-C canonical tables; resolve player identity across recruiting/portal/roster; normalize schools/conferences with per-season membership.
- **Effort:** 2 d · **Deps:** TICKET-6
- **Files:** `lib/types.ts`, `scripts/build-marts.ts`, `data/marts/*.json`, `lib/data/*`
- **Acceptance:** typed marts emitted; `school_seasons` reflects 2024 realignment; null-destination transfers flagged `landed:false`; entity-resolution match rate logged; `is_sample_data:false` on real marts; pipeline tests for schema + null handling.

### TICKET-8 — Net-talent-flow analytics module (D1/D2)
- **Objective:** Measured inflow/outflow/net per school & conference per season; portal-volume series.
- **Effort:** 1–1.5 d · **Deps:** TICKET-7
- **Files:** `lib/analytics/talentFlow.ts` (+ tests), `lib/data/seasons.ts`
- **Acceptance:** functions return measured nets; unit tests on known fixtures; null destinations excluded from landed sums and reported separately; one headline number surfaced.

### TICKET-9 — Transparent NIL valuation model (D6)
- **Objective:** Documented, reproducible NIL *estimate* from CFBD-legal inputs; emit `nil_estimates` + a **model card**.
- **Effort:** 1.5–2 d · **Deps:** TICKET-7
- **Files:** `lib/model/nil.ts` (+ tests), `data/marts/nil_estimates.json`, `app/methodology/page.tsx` (rewrite), `docs/NIL_MODEL.md`
- **Acceptance:** every output labeled "modeled estimate"; inputs + weights documented; sensitivity table; no On3/247 values ingested; methodology page explains the model in plain English.

### TICKET-10 — Pathway + performance analytics (D3/D4)
- **Objective:** Recruiting→portal pathway rates by star tier; recruiting-vs-SP+ correlation with CIs.
- **Effort:** 1.5 d · **Deps:** TICKET-7
- **Files:** `lib/analytics/pathways.ts`, `lib/analytics/performance.ts` (+ tests)
- **Acceptance:** rates + correlations computed with confidence intervals; small-n flags; tested on fixtures.

### TICKET-11 — Visualization upgrades on real data
- **Objective:** Conference **flow matrix/chord**; **geographic** flow map; winners/losers leaderboard; recruiting-vs-SP+ scatter. Replace circular charts.
- **Effort:** 2–3 d · **Deps:** TICKET-8/10
- **Files:** `components/charts/{MatrixChart,FlowMap,Leaderboard,Scatter}.tsx`, `app/{flow,nil,players,timeline}/page.tsx`
- **Acceptance:** each viz reads measured marts; matrix/map render real flows; a11y (`role`, keyboard); no dead `total_reported_nil_value`.

### TICKET-12 — Refresh automation + freshness + perf
- **Objective:** Scheduled ingest (GitHub Action/cron) with snapshot dates; precomputed marts at build; "data last updated" UI; pagination/virtualization for big tables.
- **Effort:** 1.5 d · **Deps:** TICKET-6/7
- **Files:** `.github/workflows/refresh.yml`, `scripts/*`, `components/ui/DataFreshness.tsx`
- **Acceptance:** Action pulls + rebuilds on schedule (key as repo secret, `workflow` scope already granted); freshness badge shows snapshot date; large tables virtualized.

### TICKET-13 — Deploy to Vercel + production polish
- **Objective:** Live URL; OG/social images; Lighthouse pass; real mobile menu.
- **Effort:** 0.5–1 d · **Deps:** MVP analytics
- **Files:** `app/layout.tsx` (metadata/OG), `components/layout/Nav.tsx`, Vercel project
- **Acceptance:** public URL live; Lighthouse ≥90 perf/a11y/SEO; OG card renders; README top line is the live link.

### TICKET-14 — README + case study + screenshots + demo
- **Objective:** Recruiter-facing rewrite around the *real finding*; refreshed screenshots; 20–30s demo GIF; methodology link.
- **Effort:** 0.5–1 d · **Deps:** TICKET-11/13
- **Files:** `README.md`, `docs/CASE_STUDY.md`, `docs/screenshots/*`
- **Acceptance:** README leads with finding + live link + stack + "what this proves"; demo GIF opens on the methodology/model idea.

### TICKET-15 (Stretch) — Predictive model + public dataset/API
- **Objective:** A documented predictive model (transfer-likelihood or projected landing-tier) with honest eval; expose a read-only API or downloadable dataset.
- **Effort:** 2–3 d · **Deps:** V1 done
- **Acceptance:** model card with train/test split + metrics + baseline; `/api/*` or dataset download; clearly labeled.

**Critical path to "showable":** TICKET-6 → 7 → 8 → 13 → 14 (≈6–7 focused days = a live, real-data product with a measured finding). TICKET-9/10/11 elevate it to the analyst-grade V1. Everything else is V2+.

---

# DELIVERABLE F — Portfolio Strategy (Phase 6)

**Target roles:** Senior Data Analyst · Analytics Engineer · Product Analyst · Data Scientist · Analytics Manager. Optimize the *first 60 seconds* for that audience.

### README structure (rewrite)
1. **Live demo link** (top line) + a 1-sentence measured finding.
2. **The question & the user** ("Who's winning the transfer-portal era, and can we value players honestly?").
3. **Architecture diagram** (CFBD → ingest → canonical model → marts → app).
4. **What I found** (2–3 real results with the caveat).
5. **The NIL model** (transparent, labeled estimate) — your signature.
6. **Stack + how to run** + data attribution (CFBD).
7. **"What this demonstrates"** (data eng, modeling, analytics, viz, product) + **honest limitations**.

### Screenshots needed
Net-talent leaderboard (the finding) · conference flow matrix · geographic flow map · recruiting-vs-SP+ scatter · the NIL model methodology/model-card page · data-freshness badge. (Replace any synthetic-era shots.)

### Demo flow (for a live walkthrough or GIF)
Land on finding → filter a conference → flow matrix → open a school's net talent → open the NIL model page (explain inputs/weights/labels) → end on the methodology/honesty thesis.

### Case-study structure (`docs/CASE_STUDY.md`)
Problem → data sourcing & legal constraints (incl. *why* you modeled NIL instead of scraping) → pipeline & entity resolution → the metric → findings → model card → limitations → what I'd do next. *This document alone is interview gold.*

### Deployment strategy
Vercel (zero-config), data refreshed by a scheduled GitHub Action committing new marts (key in repo secrets). Static-prerender the marts for speed. Add a public dataset download for credibility.

### Resume bullets (parameterized — pick per role)
- *Analytics Engineer:* "Built an idempotent ELT pipeline ingesting [N] seasons of CollegeFootballData (transfer portal, recruiting, SP+) into a canonical, entity-resolved data model, with scheduled refresh and schema/data-quality tests."
- *Data Scientist:* "Designed a transparent NIL valuation model from recruiting, usage, production, and draft signals; published a model card with sensitivity analysis and explicit estimate-labeling."
- *Senior Data Analyst:* "Quantified college-football talent flow — measuring net portal inflow/outflow by school and conference across [N] seasons — and surfaced findings with confidence intervals and honest caveats."
- *Product Analyst:* "Shipped a live analytics product with confidence-labeling as a core UX principle; defined the question, user, and metric, and iterated from a synthetic prototype to a real-data v1."
- *Analytics Manager:* "Scoped and sequenced a 9-ticket roadmap from prototype to deployed product, prioritizing the highest-leverage real-data unlock and cutting scope to ship."

### Interview talking points
- **Turn the synthetic→real pivot into a strength:** "I shipped an honest prototype first, *labeled every figure's confidence*, then did a brutal self-review (it's in the repo) and rebuilt it on real data. That's how I de-risk." Pointing to your own `CRITICAL_REVIEW.md` is a power move — it shows senior judgment.
- **NIL model = data-science depth:** explain why you *couldn't* use On3 (ToS) and *built* a transparent model instead — sourcing ethics + modeling in one story.
- **Entity resolution** is your "hardest technical problem" anecdote.
- **Net-talent-flow metric** is your "I defined a metric from scratch" anecdote.
- **Honest limitations:** null destinations, small per-season n, estimate-labeling — naming these *builds* trust.

---

# DELIVERABLE G — Top 10 Highest-ROI Next Actions

Ranked by career leverage per hour. The first four convert it from "viz demo" to "real data product."

| # | Action | Why (leverage) | Effort | Ticket |
|---|---|---|---|---|
| **1** | **Get a CFBD API key + ingest real portal/recruiting/talent/SP+ (2018–2025)** | Kills the #1 weakness (synthetic data); unlocks every real finding | 1.5–2 d | T6 |
| **2** | **Build canonical model + entity resolution + per-season conferences** | The actual data-engineering proof + correct realignment | 2 d | T7 |
| **3** | **Compute the net-talent-flow metric → one measured headline finding** | Gives you the "what did you find?" answer recruiters demand | 1–1.5 d | T8 |
| **4** | **Deploy to Vercel + live URL at top of README** | A link beats a repo; removes the "just localhost" tell | 0.5 d | T13 |
| **5** | **Build the transparent NIL model + model card** | Your data-science signature; turns the NIL legal wall into a showcase | 1.5–2 d | T9 |
| **6** | **Rewrite README + case study around the real finding** | First-60-seconds impression for the analytics audience | 0.5–1 d | T14 |
| **7** | **Recruiting→portal pathway + recruiting-vs-SP+ (with CIs)** | Demonstrates statistical literacy, not just SQL | 1.5 d | T10 |
| **8** | **Replace circular charts with matrix + geo map + scatter on real data** | Removes the "echoes its own prior" criticism; better viz story | 2–3 d | T11 |
| **9** | **Scheduled refresh Action + data-freshness UI** | Signals "production data product," not a one-off | 1.5 d | T12 |
| **10** | **Add pipeline + data-quality tests** | Proves engineering maturity to a data-eng interviewer | 1 d | T7/8 |

**If you only do 1–4 (≈5–6 focused days):** you have a live, real-data analytics product with a measured finding and a clean repo — already a top-decile portfolio piece for your target roles. **Add 5–6** and it's interview-anchor material.

---

## Final EM verdict
*"As-is, I'd compliment the engineering and pass on it for a data role — there's no analysis. After TICKET-6→8 + deploy, I'd want to talk to this person: real pipeline, a defined metric, a measured finding, honest labeling. Add the NIL model and the case study, and it's the strongest single project in most analytics candidates' portfolios."*

**Do this in order. Ship MVP before V1. The unlock is real data — start with the API key.**
