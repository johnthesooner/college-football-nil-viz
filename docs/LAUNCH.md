# Launch & Distribution Playbook

Ready-to-post copy for sharing the app, ranked by fit (per
[`MARKET_ANALYSIS.md`](MARKET_ANALYSIS.md)). Repo:
<https://github.com/johnthesooner/college-football-nil-viz> — replace `LIVE_URL`
once the Vercel demo is deployed.

> **Honesty guardrail — read first.** The app currently runs on **illustrative
> sample data**. That's fine for engineering/design/portfolio channels (Show HN,
> dev.to, LinkedIn), but **r/dataisbeautiful and r/CFB audiences expect real
> data** and will (rightly) push back on sample data presented as analysis. So:
> **swap in real CFBD data (`docs/REAL_DATA_IMPORT.md`) before posting to those
> two**, or label the post unmistakably as a *concept/demo*. Never let the
> "sample data" caveat get lost — it's the whole credibility premise.

---

## Channel ranking (by fit)

| # | Channel | Best for | Post when |
|---|---|---|---|
| 1 | **r/dataisbeautiful** + **r/CFB** | virality, topical reach | **after real-data swap** |
| 2 | **Show HN / Hacker News** | dev + portfolio audience | now (engineering angle) |
| 3 | **X/Twitter** (CFB analytics) | niche reach, clips | now / after |
| 4 | **LinkedIn** | recruiter visibility | now (case study) |
| 5 | **dev.to / blog** | SEO, technical credibility | now |

**Lead visual for every post:** the **Sankey flow map** (`docs/screenshots/flow.png`)
or the **demo GIF** (`docs/screenshots/demo.gif`) — it's the most novel,
screenshot-friendly artifact. The timeline dual-axis chart is the #2 visual.

---

## 1. r/dataisbeautiful  *(post after real-data swap; tag [OC])*

**Title:**
> [OC] 20 years of college football transfer-portal movement — and how NIL changed it — with every dollar figure labeled by how much you can trust it

**Required OC tool comment** (r/dataisbeautiful rule — reply to your own post):
> Tool: Next.js + React, Recharts, and d3-sankey for the flow map. Data: College
> Football Data API (transfers, schools) + Opendorse's public NIL market-size
> estimates. Every NIL dollar value carries a confidence badge
> (confirmed/reported/estimated/unknown) because most NIL figures are estimates,
> not confirmed earnings. Source + methodology: https://github.com/johnthesooner/college-football-nil-viz

**Notes:** OC = your own work on real/clearly-sourced data. Do **not** post the
sample-data version here. Post mid-morning ET on a weekday; reply to early
comments fast.

## 1b. r/CFB  *(post after real-data swap)*

**Title:**
> I built a free, interactive map of 20 years of transfer-portal player movement (conference + school flows, NIL money view) — feedback welcome

**Body:**
> Free and open, no paywall. The angle: every NIL dollar figure is labeled by
> confidence (confirmed/reported/estimated/unknown) instead of being presented
> as fact — because On3/247 valuations are *projections*, not confirmed deals.
> Built on the College Football Data API. Live: LIVE_URL · Code: https://github.com/johnthesooner/college-football-nil-viz.
> What would make this more useful to you?

**Notes:** r/CFB dislikes self-promo that isn't genuinely useful — lead with the
free tool and ask for feedback. Read the subreddit's self-promotion rules first.

---

## 2. Show HN  *(can post now — frame as engineering/design)*

**Title:**
> Show HN: NIL & transfer-portal viz where every number is labeled by confidence

**Body (first comment):**
> I kept seeing NIL "valuations" presented as hard numbers when they're really
> estimates — On3's own docs say their valuation "does not track the value of
> deals an athlete has completed." So I built the opposite: an interactive viz of
> 20 years of college-football transfer movement where every dollar figure
> carries a confidence badge (confirmed/reported/estimated/unknown) and
> undisclosed amounts show "not disclosed," never $0.
>
> Tech: Next.js 16 / React 19, Recharts, d3-sankey (layout math only, rendered as
> React SVG; bidirectional conference flows mapped to a bipartite graph so the
> Sankey stays a DAG). Pure, tested data layer; validation enforces the
> confidence rules in code (a "confirmed" deal must have a source URL).
>
> **It currently runs on illustrative sample data** (clearly labeled throughout);
> the four JSON seed files swap for real data with no code changes — the data
> sourcing/licensing writeup is in the repo. Live: LIVE_URL · Code: https://github.com/johnthesooner/college-football-nil-viz.
> Feedback on the confidence model especially welcome.

**Notes:** HN rewards honesty about limitations — leading with "sample data" is a
feature here. Post Tue–Thu ~8–10am ET. Engage every comment.

---

## 3. X / Twitter

**Thread (1/4):**
> Most NIL "valuations" you see are estimates dressed up as facts. So I built the
> opposite — 20 years of college football transfer-portal movement where every
> dollar is labeled by how much you can trust it. 🧵 LIVE_URL

> (2/4) The flow map: who's leaving and arriving, conference→conference or
> school→school, by season. [attach flow.png / demo.gif]

> (3/4) Every NIL figure gets a confidence badge —
> confirmed/reported/estimated/unknown. Undisclosed = "not disclosed", never $0.
> Because On3/247's own docs call their valuations projections, not confirmed
> earnings. [attach nil.png]

> (4/4) Free, open, no paywall. Built with Next.js + d3-sankey on the College
> Football Data API. Code + methodology: https://github.com/johnthesooner/college-football-nil-viz. Currently on labeled sample
> data; real-data swap is one step. RTs appreciated 🙏

**Notes:** Tag CFB-analytics accounts; the flow-map clip is the hook.

---

## 4. LinkedIn  *(case-study framing for recruiters)*

> I built a data-visualization app on a hard problem: **how do you present data
> you can't fully trust, honestly?**
>
> NIL (name/image/likeness) dollar figures in college sports are mostly
> estimates — even the market leaders' valuations are *projections*, not
> confirmed deals. So instead of laundering estimates into facts, I made
> *confidence* a first-class feature: every figure carries a
> confirmed/reported/estimated/unknown badge, and undisclosed amounts show "not
> disclosed," never $0.
>
> Under the hood: Next.js 16 / React 19 / TypeScript (strict), Recharts +
> d3-sankey for the flow maps, a pure tested data layer, and validation that
> enforces the honesty rules in code. I also did a licensing-aware data-sourcing
> analysis (most NIL data is paywalled and can't be redistributed) and a
> competitive/market analysis.
>
> Live demo: LIVE_URL · Code + case study: https://github.com/johnthesooner/college-football-nil-viz
> #dataviz #datavisualization #react #typescript #sportsanalytics

---

## 5. dev.to / blog  *(technical write-up for SEO + credibility)*

**Title ideas:**
- "Rendering a Sankey diagram with d3-sankey + React (and dodging the no-cycles trap)"
- "Designing for honesty: a confidence-badge system for untrustworthy data"
- "Making charts render reliably in React without ResponsiveContainer warnings"

**Outline:** the problem (untrustworthy NIL data) → the confidence model →
the bipartite-Sankey trick → the AutoSizer fix → validating data honesty in code
→ licensing-aware sourcing. Link the live demo and repo throughout.

---

## Pre-launch checklist

- [ ] Live demo deployed and reachable (`LIVE_URL`).
- [ ] Repo public with the case-study README + demo GIF (`https://github.com/johnthesooner/college-football-nil-viz`).
- [ ] (For r/dataisbeautiful & r/CFB) real CFBD data swapped in, or post clearly
      labeled as a concept/demo.
- [ ] Sample-data disclaimer still visible in-app (it is — footer + NIL banner).
- [ ] Skim each subreddit's self-promotion rules before posting.
- [ ] Be available to reply for the first 2–3 hours after posting.
