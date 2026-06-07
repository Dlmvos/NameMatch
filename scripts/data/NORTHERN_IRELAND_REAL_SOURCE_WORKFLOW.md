# Northern Ireland: Northern Ireland Statistics and Research Agency (NISRA) bulk list → recency-weighted workbook → canonical CSV → JSONL (real intake)

**Downstream:** unchanged — `adaptEuNationalCsvToJsonl.ts` (`--slug eu-ni-nisra`) → `importBabyNamesFromJsonl.ts`.

**Provenance on import:** `origin = null`, `meaning_source = 'Northern Ireland national statistics (eu-ni-nisra)'` (see `adaptEuNationalCsvToJsonl.ts`).

**Scoped replacement:** `country = 'Northern Ireland'`, `region = 'EU'`, `coalesce(is_premium, false) = false`, `meaning_source = 'Northern Ireland national statistics (eu-ni-nisra)'` — see SQL + report below.

> **Why this is a separate ingest from the rest of the UK.** Northern Ireland is published by **Northern Ireland Statistics and Research Agency (NISRA)** as a standalone national dataset. Scotland (NRS) and Northern Ireland (NISRA) are each ingested via their own parallel adapters (`SCOTLAND_REAL_SOURCE_WORKFLOW.md`, `NORTHERN_IRELAND_REAL_SOURCE_WORKFLOW.md`) so each can carry its own `country` label, its own popularity ranking, and its own swipe-deck cohort. There is no combined "United Kingdom" deck — that was Option A and was rejected in favour of native country-level provenance.

---

## 1. Expected raw file

- **Source:** Northern Ireland Statistics and Research Agency (NISRA) publishes per-year baby-name counts for **Northern Ireland**, 1997 to 2025. Counts marked `-` when ≤ 2.
  - Source URL: `https://www.nisra.gov.uk/publications/baby-names-2025`
- **Curation step (offline):** the raw file is recency-weighted **before** the adapter runs. The merge:
  1. Normalises the source into long form `(year, gender, name, count)` (Title-case names, M/F gender axis, drops redacted rows).
  2. Applies an exponential **recency weight**: `weight = 0.5 ** ((2025 − year) / 5)` (5-year half-life, anchored at 2025) — identical to the Australia + sibling UK pipelines.
  3. Aggregates to one row per `(name, gender)`: sums `weighted_count`, preserves `raw_count`, captures `earliest_year` / `latest_year`.
  4. Ranks within each gender by `weighted_count` desc.

- **Workbook layout:** four sheets in `Names Northern-Ireland recent weight.xlsx`:
  - `Boys Top 1000`, `Girls Top 1000` — quick-look slices, not read by the adapter.
  - `Boys All`, `Girls All` — **the adapter reads these**. Columns:

    `rank, name, weighted_count, raw_count, earliest_year, latest_year`

- **Location:** `scripts/data/raw/downloads/Names Northern-Ireland recent weight.xlsx` (gitignored). Record source URL, retrieval date, and weighting parameters in your PR or internal log.

- **Privacy rule:** the source already truncates very-low-frequency names. Nothing further to redact in the adapter.

---

## 2. Canonical CSV → JSONL

1. Extract workbook → canonical CSV:

```bash
npm run extract:baby-names:ni-nisra-xlsx -- \
  --in "scripts/data/raw/downloads/Names Northern-Ireland recent weight.xlsx" \
  --out scripts/data/raw/eu-ni-nisra.canonical.csv
```

Optional flags:

```bash
npm run extract:baby-names:ni-nisra-xlsx -- \
  --in "…/Names Northern-Ireland recent weight.xlsx" \
  --out scripts/data/raw/eu-ni-nisra.canonical.csv \
  --emit-year 2025 \
  --min-weighted-count 1
```

- `--emit-year` (default **2025**): single year stamped on every row (workbook already collapses years into a recency-weighted score per name).
- `--min-weighted-count` (default **1**): drops near-zero rows.

2. Validate country labels:

```bash
npm run validate:import-country-labels -- scripts/data/raw/eu-ni-nisra.canonical.csv
```

3. Build JSONL:

```bash
tsx scripts/adaptEuNationalCsvToJsonl.ts \
  --in scripts/data/raw/eu-ni-nisra.canonical.csv \
  --out scripts/data/batches/external-eu-ni-nisra.v1.jsonl \
  --slug eu-ni-nisra \
  --top-per-year-sex 1200
```

Or use the sample shortcut:

```bash
npm run adapt:baby-names:eu-ni-nisra-sample
```

4. Dry-run — record **`Y`** valid rows:

```bash
npm run import:baby-names -- --dry-run scripts/data/batches/external-eu-ni-nisra.v1.jsonl
```

> **Recorded dry-run (2026-05-27):** E&W **2400**, Scotland **2400**, NI **2257** rows; exact country labels verified; dry-run import OK; no DB writes — see [`AGENT_NOTES.md`](./AGENT_NOTES.md#uk-home-nations--local-dry-run-2026-05-27).

---

## 3. Why upsert alone is unsafe

Same reasoning as Belgium / Australia / sibling UK runbooks — see [`BELGIUM_REAL_SOURCE_WORKFLOW.md`](./BELGIUM_REAL_SOURCE_WORKFLOW.md#3-why-upsert-alone-is-unsafe).

---

## 4. Staging execution checklist

1. **Confirm staging** — `.env` `EXPO_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` point at **staging**. The report script prints the Supabase host.
2. **Dry-run** — `npm run import:baby-names -- --dry-run scripts/data/batches/external-eu-ni-nisra.v1.jsonl` — record **`Y`** valid rows.
3. **Preflight** — `npm run report:baby-names:ni-eu-bulk-stats` — note `baby_names` count and CASCADE (swipes/matches).
4. **SQL preflight** — In Supabase SQL (staging), run the `SELECT count(*)` in [`scripts/data/sql/northern_ireland_eu_bulk_delete_for_replacement.sql`](./sql/northern_ireland_eu_bulk_delete_for_replacement.sql); it must match the report's `baby_names` count.
5. **Scoped DELETE** — Uncomment and run the `DELETE` in that file.
6. **Re-verify empty** — `SELECT count(*)` again → **0** for that predicate.
7. **Import real batch** — `npm run import:baby-names -- scripts/data/batches/external-eu-ni-nisra.v1.jsonl`
8. **Post-verify** — Same `SELECT count(*)` → must equal **`Y`**. Run the report — same number.

---

## 5. Related commands

| Step | Command |
|------|---------|
| Extract workbook | `npm run extract:baby-names:ni-nisra-xlsx` |
| Adapt sample CSV | `npm run adapt:baby-names:eu-ni-nisra-sample` |
| Country label validation | `npm run validate:import-country-labels -- <file.csv\|file.jsonl>` |
| Report bulk scope | `npm run report:baby-names:ni-eu-bulk-stats` |
| Scoped DELETE SQL | [`scripts/data/sql/northern_ireland_eu_bulk_delete_for_replacement.sql`](./sql/northern_ireland_eu_bulk_delete_for_replacement.sql) |

**Sibling UK home nations:** [`ENGLAND_WALES_REAL_SOURCE_WORKFLOW.md`](./ENGLAND_WALES_REAL_SOURCE_WORKFLOW.md) · [`SCOTLAND_REAL_SOURCE_WORKFLOW.md`](./SCOTLAND_REAL_SOURCE_WORKFLOW.md) · [`NORTHERN_IRELAND_REAL_SOURCE_WORKFLOW.md`](./NORTHERN_IRELAND_REAL_SOURCE_WORKFLOW.md) · **Parallel weighted pattern:** [`AUSTRALIA_REAL_SOURCE_WORKFLOW.md`](./AUSTRALIA_REAL_SOURCE_WORKFLOW.md).
