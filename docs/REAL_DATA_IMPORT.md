# Importing Real Data

This app ships with **illustrative sample data**. By design, swapping the JSON
files under `data/seed/` is the only change required to load real data — the UI,
charts, and aggregations read whatever is in those files. This guide walks
through doing that safely.

See [`DATA_SOURCES.md`](../DATA_SOURCES.md) for the field-by-field schema,
recommended sources, and confidence rules.

---

## The four files

```
data/seed/
├── players.json          # one row per transfer
├── nil_deals.json        # one row per reported NIL deal
├── season_summary.json   # one row per year
└── schools.json          # one row per school
```

Every file uses the same envelope:

```json
{
  "_meta": {
    "is_sample_data": true,
    "last_updated": "2025-01-15",
    "disclaimer": "…"
  },
  "data": [ /* records */ ]
}
```

Keep the `_meta` block and the `data` array. The record shapes are documented in
`DATA_SOURCES.md` and typed in [`lib/types.ts`](../lib/types.ts).

---

## Fast path: automated CFBD ingestion

`scripts/ingest-cfbd.ts` pulls real **schools**, **transfers**, and **season
transfer volume** from the [College Football Data API](https://collegefootballdata.com)
(the one free, ingestible source — see `DATA_SOURCES.md`). It writes **review
copies** (`data/seed/*.cfbd.json`), never overwriting your working data.

```bash
# 1. Free key (1k calls/mo, or 3k with an .edu email):
#    https://collegefootballdata.com/key
export CFBD_API_KEY=your_key_here          # or add to .env.local

# 2. Generate review copies for a year range
npm run ingest:cfbd -- --year-min 2021 --year-max 2024

# 3. Validate the review copies (or diff them), then promote
cp data/seed/schools.cfbd.json        data/seed/schools.json
cp data/seed/players.cfbd.json        data/seed/players.json
cp data/seed/season_summary.cfbd.json data/seed/season_summary.json
npm run validate && npm run check:data
```

**What it fills vs. leaves to you:**

| File | CFBD ingestion | Manual follow-up |
|---|---|---|
| `schools.json` | ✅ name, conference, state, coordinates | — |
| `players.json` | ✅ name, position, season, from/to school + conference, date | ⚠️ **`class_year`** is not in the portal feed — defaulted to a placeholder; resolve via a roster join or review before treating as real. Coverage is **~2021+** only. |
| `season_summary.json` | ✅ `total_transfers`, `estimated_nil_market_size` (Opendorse) | `total_reported_nil_value` (derive from curated deals) |
| `nil_deals.json` | ❌ CFBD has no NIL $ | **Curate manually**: official announcements → `confirmed`; reporting → `reported`; valuations → `estimated`. |

The script keeps only FBS↔FBS moves (so conferences resolve and validation
passes), tags every row with a CFBD `source_url`/`source_name`, and sets each
file's `_meta.is_sample_data` to `false`.

---

## Step-by-step (manual)

### 1. Back up the sample data
```bash
cp -r data/seed data/seed.sample.bak
```

### 2. Replace the records
Edit each file's `data` array with real records. Order doesn't matter; the data
layer sorts as needed. Keep these cross-file links intact:

- `players[].from_school` / `players[].to_school` must match a `schools[].name`.
- `players[].from_conference` / `to_conference` must match that school's `conference`.
- `nil_deals[].player_id` must reference a `players[].player_id`.
- `nil_deals[].season` must equal that player's `season`; `nil_deals[].school`
  must equal that player's `to_school`.

### 3. Apply the confidence rules
For every NIL deal (see `DATA_SOURCES.md` for the full table):

- `confirmed` → needs a valid `source_url` **and** `source_name`, and a non-null `reported_amount`.
- `reported` → needs at least one of `source_url` / `source_name`.
- `estimated` → may be unsourced, but **never** `amount_type: "exact"`.
- `unknown` → `reported_amount: null` and `amount_type: "unknown"` (never `$0`).
- Always fill in a non-empty `notes` explaining the limitation.

### 4. Update each file's `_meta`
```jsonc
"_meta": {
  "is_sample_data": false,            // flip to false once data is real
  "last_updated": "2025-01-15",       // ISO date of this import
  "disclaimer": "Real data sourced from … . NIL amounts labeled by confidence."
}
```

### 5. Validate
```bash
npm run validate     # schema, enums, referential integrity, confidence + provenance rules
npm run check:data   # prints SAMPLE vs REAL per file
npm run test         # runs the same integrity checks under Vitest
```
`npm run validate` runs automatically before `dev` and `build` (as `predev` /
`prebuild`), so an invalid dataset blocks both. Fix every reported problem before
continuing — the messages name the offending record and rule.

### 6. Run it
```bash
npm run dev          # http://localhost:3000
npm run build        # production build
```

### 7. (Optional) Gate a production deploy on real data
```bash
npm run check:data -- --require-real   # exits non-zero if any file is still sample
```
Wire this into CI for a "production data" environment to refuse shipping while
the dataset is still illustrative.

---

## What the validator checks

`scripts/validate-seed.ts` (and the matching Vitest test) enforce:

- **Counts:** ≥ 250 players, ≥ 40 NIL deals, ≥ 20 seasons, ≥ 25 schools / ≥ 6 conferences.
- **Enums:** valid `position`, `class_year`, `amount_type`, `confidence_level`.
- **Referential integrity:** player↔school↔conference and deal↔player links.
- **Distribution:** per-season sample counts track `total_transfers` (Pearson ≥ 0.7).
- **Confidence & provenance:** the rules in step 3, plus valid http(s) `source_url`s,
  `unknown ⇔ null amount`, non-negative amounts, ≤ 5 `confirmed` deals, and
  non-empty `notes`.

If your real dataset has a different shape (e.g. far more rows, or a different
era range), adjust the thresholds in `lib/data/validate.ts` and update the
matching tests — they're intentionally in one place.

---

## Tips

- **Volume distribution:** the validator expects the *sample's* per-season counts
  to correlate with `total_transfers`. With a real census you may want to relax
  or remove that check (it exists to keep the illustrative sample honest).
- **School coordinates:** the data model carries `latitude`/`longitude` for a
  future map view; the College Football Data API is a good free source.
- **Secrets:** if a source needs an API key, put it in `.env.local` (gitignored)
  and never commit it. The app itself needs no env vars to run.
