# CRITICAL_REVIEW.md
**Repo:** `college-football-nil-viz` (local: `~/nil-portal`)
**Reviewer stance:** brutally honest senior product engineer / data-viz critic / sports-data researcher / portfolio reviewer
**Date:** 2026-06-16
**Verified by running:** `tsc --noEmit` (0 errors), `eslint` (0 warnings), `vitest` (55/55 pass), `next build` (succeeds, 6 static routes). Read every page, chart, the data layer, the generator, and the validator.

---

## 1. Executive verdict

This is a genuinely well-built, unusually *honest* front-end — strict TypeScript, a pure and thoroughly-tested data layer, a hand-rolled bipartite Sankey, real loading/empty/error boundaries, and a confidence-labeling system that is more intellectually honest than most commercial NIL products. The engineering would not embarrass you in front of a frontend hiring manager. **But the brutal truth is that it is a beautiful, rigorous shell wrapped around data that the repo invented, and every "insight" it appears to surface is an assumption fed back to the user.** The top-destination-conference stat, the NIL-by-conference bars, and the entire Sankey are downstream of one hardcoded `CONFERENCE_PULL` table in `scripts/generate-seed.ts` — so a skeptical researcher concludes there is no finding here, only a faithfully-rendered prior. Worse, the project's marquee virtue (honesty) has a self-inflicted hole: the NIL "Top reported deals" table shows fabricated dollar amounts behind a green **Confirmed** badge and a real-looking source link to `on3.com/nil/`, while the row-level `notes` that admit the figure is a placeholder are hidden on that page — which is precisely the "estimate laundered as fact" pattern the app claims to oppose. For a *frontend/product engineer* portfolio this is a 7.5/10; for a *data/analytics* portfolio it's closer to a 5 because it demonstrates no real analysis of real data. Blended, it sits at **6.5/10 today**, and is realistically a **8.5/10 after fixes** (presentation-honesty fixes get most of the way; a real CollegeFootballData transfer ingest would take it to ~9).

**Score today: 6.5 / 10. Achievable after fixes: 8.5 / 10.**

---

## 2. Top 10 criticisms

### #1 — The headline "findings" are circular: they echo a hardcoded assumption
- **Severity:** High
- **Evidence:** `scripts/generate-seed.ts:110-117` defines `CONFERENCE_PULL` (SEC 5, Big Ten 4.5, …, AAC 1). Destinations are drawn weighted by that table (`:226-228`). Then `app/page.tsx:65` shows **"Top destination conference"** via `getTopDestinationConference()`, the `/nil` page renders **"Reported NIL by conference"** (`app/nil/page.tsx:121-129`), and `/flow` renders the Sankey — all of which simply re-expose that prior. The generator comment is candid: weights exist "so the Sankey looks realistic."
- **Why it matters:** A data hiring manager's first question is "what did you find?" The honest answer here is "nothing — I asserted SEC is a magnet and the chart agrees." That's a tautology dressed as analysis. It's the single biggest thing separating this from a credible data project.
- **How to fix:** (a) Label every generated "finding" as a sample artifact at the point of display (not just on /methodology). (b) Better: ingest *real* transfer destinations from the CollegeFootballData API (already scoped in `DATA_SOURCES.md`) so the conference pull is *measured*, not assumed. Keep NIL dollars synthetic/labeled.
- **Effort:** Labeling: 1–2h. Real transfer ingest: 1–2 days.

### #2 — "Confirmed" NIL deals pair a green badge + real source link with a fabricated amount
- **Severity:** High (this is the project's own thesis turned against it)
- **Evidence:** `generate-seed.ts:282-325` assigns the 5 `confirmed` rows a `source_url` pointing at **generic org homepages** (`https://www.on3.com/nil/`, `https://opendorse.com/`, `https://www.espn.com/college-football/`) and a *random* `reported_amount` (`roundTo(randInt(75_000, 1_200_000), 5_000)`). The `/nil` "Top reported deals" table (`app/nil/page.tsx:69-92`) renders that amount in bold accent, a `ConfidenceBadge level="confirmed"` (green), and a `SourceLink` — but **not** the `notes` field that admits the number is a placeholder. The validator (`lib/data/validate.ts:241-254`) only checks a confirmed deal *has* a URL, not that the URL documents the figure.
- **Why it matters:** A green "Confirmed" + a clickable On3 link + a precise dollar amount is exactly the trust signal the app exists to fight. On the one page where money is the focus, the honesty caveat is page-level (subtitle/banner), not row-level. A fan reading the table will believe these are real confirmed deals.
- **How to fix:** Surface each deal's `notes` inline in the NIL table (reuse the existing `components/ui/Tooltip.tsx`); change the confirmed-tier sample sources to clearly read as examples (e.g. `source_name: "Example: On3 (org homepage)"`), or drop the confirmed tier from sample data entirely. Add a one-line "even 'confirmed' figures here are illustrative" note above the table.
- **Effort:** 1–2h (presentation). Done in this pass (see §"Improvements").

### #3 — "20 years" / "rewired college football" oversells a 3-season phenomenon
- **Severity:** Medium
- **Evidence:** Hero chip "20 years of college football player movement" and H1 "How NIL and the transfer portal rewired college football" (`app/page.tsx:74-78`). But NIL data exists only for **2021–2024 (3 seasons)** and the portal for **2018–2024 (6 seasons)** — `season_summary.json` rows 2005–2020 carry `null` NIL and a smooth invented transfer ramp. 13 of 20 "years" predate both phenomena.
- **Why it matters:** The framing implies two decades of NIL/portal signal; there are three years of (synthetic) NIL. A researcher notices immediately and discounts everything else.
- **How to fix:** Reframe to "two decades of *transfer volume* context, with the 3-year NIL era highlighted." Keep the long axis but stop implying NIL spans it.
- **Effort:** 30 min copy.

### #4 — The smooth 2005–2017 transfer ramp has zero provenance and looks real
- **Severity:** Medium
- **Evidence:** `season_summary.json` 2005→2017 is a perfectly monotonic 520→1500 climb; `source_url`/`source_name` are `null` on **every** row. `generate-seed.ts:131-152` hardcodes it. Pre-portal FBS transfer counts are poorly documented in reality, so this curve is invention rendered as a confident line on `/` and `/timeline`.
- **Why it matters:** A clean monotonic line reads as "measured data" to anyone who doesn't open the JSON. "Shaped to public reporting" (caption) is doing a lot of unearned work for years where little public reporting exists.
- **How to fix:** Either cite a real source for transfer volume (CFBD has transfer data from ~2018; pre-2018 should be labeled "no reliable league-wide count") or visibly grey/dash the pre-2018 segment as "illustrative, low-confidence."
- **Effort:** 2–4h.

### #5 — Validation proves internal consistency, not truth — and could be mistaken for rigor
- **Severity:** Medium
- **Evidence:** `validate.ts:71-78` `transferBand()` checks `total_transfers` against bands that are the *same numbers the generator emits* — a closed loop. The Pearson≥0.7 check (`:204-217`) verifies the sample tracks the invented volume table. The README/methodology tout "enforced in code," which is true but easy to read as "the data is accurate."
- **Why it matters:** It's excellent schema/consistency engineering, but a reviewer skimming could over-credit it as data verification. The gap (e.g. #2: "confirmed" satisfied by a homepage) lives exactly where the prose implies strength.
- **How to fix:** Add a sentence in methodology/README: "Validation guarantees the data is *internally consistent and honestly labeled*, not that figures are real." (Largely already implied; make it explicit.)
- **Effort:** 20 min.

### #6 — Dual-axis timeline invites a false-correlation read
- **Severity:** Medium
- **Evidence:** `FilterableTimelineChart` (`components/charts/LineChart.tsx:146-233`) plots league volume (left axis, 0–11k) and filtered sample count (right axis, 0–~30) on independent scales. Because `sample_count` is generated to correlate with `total_transfers` (enforced Pearson≥0.7), the two lines rise together by construction — the classic dual-axis "see, they move together!" trap.
- **Why it matters:** Dual-axis charts are a well-known misread magnet; here the apparent co-movement is an artifact of how the sample was built. The page labels it well (`app/timeline/page.tsx:128`), but casual users don't read captions.
- **How to fix:** Consider showing the sample as a % of the league line on one axis, or small-multiples. At minimum keep the explicit "fixed context / reacts to filters" labels (already present).
- **Effort:** 2–4h (optional redesign).

### #7 — `total_reported_nil_value` is computed, documented, but never displayed (dead field)
- **Severity:** Low–Medium
- **Evidence:** Defined in `lib/types.ts:53`, computed in `generate-seed.ts:368-378` (a non-monotonic sum: 2021=$1.41M, 2022=$695K, 2023=$4.785M, 2024=$1.32M), null-checked in `validate.ts:159`, and listed in the methodology **data dictionary** (`app/methodology/page.tsx:68`) — but `grep` shows it is rendered nowhere in `app/`/`components/`.
- **Why it matters:** The dictionary advertises a field the product doesn't use; if it *were* shown next to `estimated_nil_market_size` (hundreds of millions) the 6-figure sample-sum would badly mislead. Dead, slightly dangerous surface area.
- **How to fix:** Either render it honestly (clearly "sum across the 44-deal sample, not a market figure") or drop it from the schema and dictionary.
- **Effort:** 30 min.

### #8 — Player-detail / NIL rows are mouse-only (keyboard a11y gap)
- **Severity:** Medium (a11y)
- **Evidence:** `app/players/page.tsx:141-144` puts `onClick` on a `<tr>` with `cursor-pointer` but no `tabIndex`, `role`, `aria-expanded`, or `onKeyDown`. Keyboard and screen-reader users can't expand rows. (By contrast `ConfidenceBadge` a11y is good — icon + label + `sr-only`.)
- **Why it matters:** A portfolio that markets "honest/careful" loses credibility if the primary table interaction is inaccessible. It's the kind of thing a senior reviewer checks in 10 seconds with Tab.
- **How to fix:** Make the disclosure cell a real `<button>` (or add `role="button"`, `tabIndex=0`, `aria-expanded`, Enter/Space handler).
- **Effort:** 30–60 min. Done in this pass.

### #9 — Internal inconsistency: On3/247 are "estimated-tier only" in docs but used as confirmed/reported sources
- **Severity:** Low–Medium
- **Evidence:** `DATA_SOURCES.md`/README state On3 & 247Sports are "off-limits to scrape or republish … usable only as manually-cited `estimated`-tier references." Yet `generate-seed.ts:282-291` lists On3/247Sports as the `source_name`/`source_url` for `confirmed` and `reported` sample rows.
- **Why it matters:** It's a small contradiction, but contradictions undercut a project whose entire pitch is rigor about sourcing.
- **How to fix:** Use only official/neutral example sources for the confirmed tier, or relabel the rule.
- **Effort:** 30 min.

### #10 — Polish gaps that read as "prototype, not product"
- **Severity:** Low (cumulative)
- **Evidence:** Mobile nav is a horizontal-scroll strip, not a real menu (`components/layout/Nav.tsx:29-33`); the `worstConfidence` badge call builds throwaway `NILAggregate` objects just to reuse the helper (`app/nil/page.tsx:51`); no deployed live URL in the README despite a Vercel section; no per-season conference realignment (Texas/Oklahoma still Big 12, Oregon/Washington still Pac-12 in `generate-seed.ts:86-98` — factually stale for 2024).
- **Why it matters:** Individually trivial; together they keep it on the "impressive student project" side of the line rather than "shipped product."
- **How to fix:** Live Vercel link in README; small `worstConfidence(levels: ConfidenceLevel[])` refactor; note realignment explicitly (already in Limitations).
- **Effort:** 1–3h total.

---

## 3. Misleading risk register

| # | Risk | Where | Severity | Mitigation present? | Residual |
|---|------|-------|----------|---------------------|----------|
| R1 | Green **Confirmed** badge + real source link + fabricated $ reads as a real confirmed deal | `app/nil/page.tsx:69-92`, `generate-seed.ts:312-325` | **High** | Page subtitle + footer banner only; row `notes` hidden here | High until notes shown at row level (fixed this pass) |
| R2 | "Findings" (top conference, NIL-by-conference, Sankey shape) are the `CONFERENCE_PULL` prior echoed back | `generate-seed.ts:110-117`; `/`, `/nil`, `/flow` | **High** | "sample dataset" captions | Medium with explicit "assumption, not measurement" labels |
| R3 | "20 years" implies 20 years of NIL signal | `app/page.tsx:74` | Medium | Pre-2021 NIL fields null in data | Low after copy fix |
| R4 | Smooth, unsourced 2005–2017 transfer ramp looks measured | `season_summary.json` (all `source_url:null`) | Medium | "illustrative" caption | Medium |
| R5 | Validation mistaken for data verification | `validate.ts:71-78` | Medium | Methodology explains sample nature | Low after one explicit sentence |
| R6 | Dual-axis co-movement implies correlation that's built-in | `LineChart.tsx:146-233` | Medium | Axis labels + footnote | Medium |
| R7 | `total_reported_nil_value` (6-figure sample sum) could be misread next to market size if ever shown | `generate-seed.ts:368-378` | Low | Currently unrendered | Low |
| R8 | Stale conference membership presented as current | `generate-seed.ts:86-98` | Low | Listed in Limitations | Low |
| **Causation** | App implies NIL/portal *caused* movement changes | site-wide narrative | Low | **Explicitly disclaimed** at `app/methodology/page.tsx:203` ("this app shows movement and reported money, not why") | Low — handled well |

Credit where due: the **causation** trap is handled better than most — `/methodology` names it directly. The dollar-figure honesty is excellent *in design* and only fails at the NIL-table row level (R1).

---

## 4. Visualization teardown

**Home mini line chart (`TransferLineChart`, `LineChart.tsx:59-116`)** — Appropriate chart type (volume over time). Clean Recharts config, k-formatted axis, Portal/NIL reference lines with labels. *Issue:* it's the smooth invented ramp (#4); the teaser implies measured history.

**Filterable timeline (`FilterableTimelineChart`, `LineChart.tsx:146-233`)** — Good annotations (reference lines, dual legend relabeled to human strings). *Issue:* dual-axis misread risk (#6); filtered series rises with the fixed line by construction. *Recommend:* offer a "% of league volume" single-axis mode, or small multiples by conference.

**Sankey (`SankeyChart.tsx`)** — Genuinely good engineering: bipartite source/target to satisfy d3-sankey's DAG constraint, custom SVG, hover highlighting, `role="img"`, empty state, node value labels. *Issues:* (a) every conference appears twice (left+right), which is non-intuitive for fans — a **chord diagram** or an origin→destination **matrix heatmap** communicates bidirectional conference flow more naturally; (b) the pattern is the `CONFERENCE_PULL` prior (#2/R2); (c) per-season n is tiny (~20–30 moves), so bands over-dramatize. *Recommend:* keep Sankey for school-to-school, add a matrix view for conference-to-conference; annotate that destination popularity is an assumption.

**NIL bar charts (`NILBarChart`/`FlowBalanceChart`, used in `app/nil/page.tsx:99-138`)** — The **per-chart "worst confidence" badge** (`app/nil/page.tsx:22-28`) is a standout honest touch; "unknowns never counted as $0" is exactly right. *Issues:* bars sum 0–3 fabricated deals per category (tiny n); "Reported NIL by conference" is circular (R2). The "Inbound vs outbound by conference" bar is the most legitimate viz on the page (real sample counts, clearly "not dollars").

**Top-reported-deals table (`app/nil/page.tsx:47-97`)** — The single riskiest viz (R1): money + green badge + source link, no row-level caveat. *Fix applied:* notes tooltip + honest sub-copy.

**Player explorer table (`app/players/page.tsx`)** — Solid: pagination, expandable detail that *does* show `notes` and the data note. *Issue:* keyboard inaccessible expansion (#8, fixed).

---

## 5. Engineering teardown

**Overall structure** — Clean App-Router layout; `app/` routes with `error.tsx`/`loading.tsx`/`not-found.tsx` boundaries; `components/{ui,charts,filters,layout}`; `lib/{types,utils,constants,data}`; `data/seed/`; `scripts/`. This is textbook and easy to navigate. 4.1k LOC, well-proportioned.

**Type system** — Strict TS, `tsc --noEmit` clean. JSON imported then cast `as unknown as SeedFile<T>` with validators as the real proof (`validate.ts:36-43`) — a defensible pattern, honestly commented.

**Data layer (`lib/data/*`)** — Pure, side-effect-free, unit-tested (separate `*.test.ts` per module). This is the project's backbone and it's good. Charts consume view-models, not raw JSON (claim holds).

**Validation (`validate.ts`)** — Comprehensive: meta blocks, enums, ranges, referential integrity, http(s) URL shape, `unknown ⇔ null` amount rule, ≤5 confirmed, Pearson distribution check. Wired to `predev`/`prebuild` **and** a Vitest test. *Caveat (#5):* proves consistency, not truth; `transferBand` is a closed loop with the generator.

**Generator (`generate-seed.ts`)** — Deterministic mulberry32 PRNG (reproducible), well-commented assumptions. *This is also where the honesty risks originate* (#1, #2, #9). Minor: collision re-roll uses uniform `pick` instead of weighted (`:230-233`) — cosmetic.

**Charts** — `AutoSizer` (ResizeObserver) instead of Recharts `ResponsiveContainer` is a smart, documented choice. Custom Sankey is the most impressive component.

**State/perf** — Local `useState` + `useMemo`; everything prerenders static (build output confirms 6 `○ (Static)` routes). No over-engineering. `colorFor` does an `indexOf` per link (trivial n).

**Tests** — 55 unit tests across 6 files, all green. Good for the data layer. *Gap:* no component/interaction tests (e.g., filter→chart, row expansion, a11y) — understandable but worth noting.

**Security/privacy** — No secrets, no env required, static output; `.env.example` documents none needed. Player names synthetic. Clean. External links use `rel="noopener noreferrer"` (`SourceLink.tsx`). No issues.

**Dead code / smells** — `total_reported_nil_value` unused (#7); `SCHOOL_BY_NAME` referenced via `void` to satisfy strict build (`generate-seed.ts:422`); `worstConfidence` throwaway-object call (#10). All minor.

**Build reliability** — `next build` clean in ~2.4s; `prebuild` validate gate is a nice fail-loud touch. `AGENTS.md` warns this is a bleeding-edge Next 16 / React 19 setup — fine, but pin-sensitive.

---

## 6. Portfolio teardown — first 60 seconds

- **A frontend/product-engineer HM (≈8/10):** "Clean repo, real boundaries, tests pass, custom Sankey, thoughtful confidence component. This person can ship a polished Next.js app." Strong positive.
- **A data-analyst / analytics-engineer HM (≈5/10):** "Where's the analysis? The data is generated, the conference finding is an assumption, the 'confirmed' deals are placeholders. I see software skill, not data skill." This is the audience the topic *invites* and the one it underserves.
- **A product-analyst HM (≈6/10):** "Great instinct on trustworthiness-as-a-feature and the methodology page is excellent — but the product currently has no real question it answers from real data."
- **First-impression risks:** the confident "20 years / rewired" hero + big bold numbers can read as "fake data presented as real" *before* the reader reaches the (excellent) methodology page — the disclaimer needs to be on the first screen, not just the footer/`/nil`.
- **Differentiation:** the honesty/confidence framing *is* genuinely differentiated and is the thing to lead with. The risk is that a skimmer sees "another NIL dashboard" and bounces before discovering it.

**Net:** above-average portfolio piece, currently let down by (a) synthetic data with no real finding and (b) a first-impression that doesn't foreground its own best idea.

---

## 7. Prioritized improvement roadmap

**1-day fixes (accuracy & honesty — highest leverage)**
- Surface row-level `notes` in the `/nil` top-deals table; add "even 'confirmed' here is illustrative" sub-copy (R1). ✅ done
- Put a sample-data disclaimer on the **landing** page's first screen (R3/R1). ✅ done
- Reword circular StatCards + flow footnote to label assumptions as assumptions (R2). ✅ done
- Make player-row expansion keyboard accessible (#8). ✅ done
- Add the one-sentence "validation ≠ verification" clarifier (#5). ✅ done (README)
- Reframe "20 years" copy (#3). ✅ done (landing)

**3-day fixes**
- Replace confirmed-tier sample sources with neutral "example" labels, or remove the confirmed tier from sample data (#2/#9).
- Grey/dash the pre-2018 transfer line as low-confidence; cite a source for 2018+ (#4).
- Add an origin→destination **matrix/heatmap** alternative to the conference Sankey (#viz).
- Component/interaction tests (filter→chart, row expand, empty states).

**1-week fixes**
- **Ingest real transfer + school data from CollegeFootballData API** (already scoped in `DATA_SOURCES.md`) so flows/top-conference are *measured*; keep NIL dollars as labeled estimates. This is the single change that converts it from "viz demo" to "data project."
- Geographic flow map using the existing `latitude`/`longitude`.
- Per-season conference membership (handle realignment).

**Portfolio-polish fixes**
- Deploy to Vercel and put the **live URL** at the top of the README.
- Lead the README and the app hero with the confidence/honesty thesis (the differentiator), not "20 years."
- A 20-second Loom/GIF that opens on the methodology idea.
- A short "What I'd do with real data + what this proves about how I work" note (turns the synthetic-data weakness into a deliberate design story).

---

## 8. Concrete implementation tickets

### TICKET-1 — Show row-level confidence notes in the NIL deals table
**Problem:** `/nil` "Top reported deals" shows fabricated amounts behind a Confirmed badge + source link with no row-level caveat; the explanatory `notes` are hidden here (R1, #2).
**Acceptance criteria:**
- Each row exposes its `notes` (tooltip or info icon) without leaving the page.
- Table sub-copy states that *all* figures — including "confirmed" — are illustrative in sample mode.
- No regression to lint/types/tests/build.
**Files:** `app/nil/page.tsx`, (reuse) `components/ui/Tooltip.tsx`.

### TICKET-2 — Landing-page honesty: first-screen disclaimer + de-circularized stats
**Problem:** The first screen shows confident big numbers and "20 years … rewired"; the sample-data disclaimer is only in the footer/`/nil`; "Top destination conference" is a circular artifact (R2/R3).
**Acceptance criteria:**
- A visible sample-data note appears above the fold on `/`.
- Hero copy no longer implies 20 years of NIL signal.
- Circular StatCards explicitly read as sample/assumption-driven.
**Files:** `app/page.tsx`, (reuse) `components/ui/DataDisclaimer.tsx`.

### TICKET-3 — Keyboard-accessible table row expansion
**Problem:** `app/players/page.tsx` expands rows via `onClick` on `<tr>` with no keyboard/ARIA support (#8).
**Acceptance criteria:**
- Rows expand via Enter/Space; `aria-expanded` reflects state; focusable; visible focus ring.
- Screen reader announces expand/collapse.
**Files:** `app/players/page.tsx`.

### TICKET-4 — Label generated patterns as assumptions on flow + nil
**Problem:** Sankey/by-conference patterns are the `CONFERENCE_PULL` prior but presented as discovered (R2).
**Acceptance criteria:**
- `/flow` and `/nil` footnotes state destination popularity is a built-in sample assumption, not measured league data.
**Files:** `app/flow/page.tsx`, `app/nil/page.tsx`.

### TICKET-5 — README honesty + validation clarifier + live link
**Problem:** README could be mistaken for "real data," and `total_reported_nil_value` is a dead documented field (#5, #7).
**Acceptance criteria:**
- README has a short "What this does and doesn't demonstrate" section and a "validation guarantees consistency, not accuracy" line.
- Live Vercel URL once deployed.
**Files:** `README.md`, (optional) `app/methodology/page.tsx`.

### TICKET-6 — Real transfer ingest (the big one)
**Problem:** No real data → no real finding (#1).
**Acceptance criteria:**
- `scripts/ingest-cfbd.ts` populates `players.json`/`schools.json` from CollegeFootballData for ≥2018; `is_sample_data:false` for those files; NIL stays labeled estimate; `npm run validate` passes on real data.
**Files:** `scripts/ingest-cfbd.ts`, `data/seed/*`, `DATA_SOURCES.md`.

---

*Improvements implemented in this pass are marked ✅ above; see the session summary for exact diffs and re-run results.*
