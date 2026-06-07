# Australia: state RBDM bulk lists → recency-weighted workbook → canonical CSV → JSONL (real intake)

**Downstream:** unchanged — `adaptEuNationalCsvToJsonl.ts` (`--slug au-rbdm-combined --output-region WORLDWIDE`) → `importBabyNamesFromJsonl.ts`.

**Provenance on import:** `origin = null`, `meaning_source = 'Australia national statistics (au-rbdm-combined)'` (see `adaptEuNationalCsvToJsonl.ts`).

**Scoped replacement:** `country = 'Australia'`, `region = 'WORLDWIDE'`, `coalesce(is_premium, false) = false`, `meaning_source = 'Australia national statistics (au-rbdm-combined)'` — see SQL + report below.

> **Region note.** `AppRegion` (in `scripts/lib/bulkBabyNameImport.ts`) has no `OCEANIA` bucket. Australia is filed under **`WORLDWIDE`** for now. If you ever add `OCEANIA`, update the workflow, the report SQL, the scoped DELETE SQL, and the `--output-region` flag below in one PR.

---

## 1. Expected raw file (curated recency-weighted workbook)

- **Source:** Australia has no single national names registry. Births are registered per state by each Registry of Births, Deaths and Marriages (RBDM). The seven published feeds vary wildly in depth:

  | Jurisdiction | Coverage | Counts? | Notes |
  |---|---|---|---|
  | SA (data.sa.gov.au) | 1944–2023 (full corpus 1944–2017, top-100 2018–2023) | yes | The only state that publishes the long tail. |
  | NSW (data.nsw.gov.au) | 1952–2025 top 100 | yes | Long history, top-100 only. |
  | VIC (data.vic.gov.au) | top 100 from 1929 (current intake covers 2024 only) | yes | Top-100 only. |
  | QLD (data.qld.gov.au) | top 100, last ~5 years (2022–2025) | yes | Top-100 only. |
  | TAS (justice.tas.gov.au) | top 10, 2017–2025 | **no — rank only** | Counts Zipf-estimated. |
  | WA (wa.gov.au) | top 10, 2023–2025 (media releases) | **no — rank only** | Counts Zipf-estimated. |
  | NT, ACT | — | — | Not currently ingested. |

- **Curation step (offline):** the raw per-state files are merged into a single recency-weighted workbook **before** the adapter runs. The merge:
  1. Normalises every state's source into long form `(state, year, gender, name, count)` (Title-case names, single gender axis M/F).
  2. For TAS/WA rank-only files, estimates counts via Zipf scaled to each state's top-1 count (`count ≈ c1 / rank^0.7`; TAS `c1 = 40`, WA `c1 = 230`). Flagged `any_estimated = yes` in the output.
  3. Applies an exponential **recency weight**: `weight = 0.5 ** ((2025 − year) / 5)` (5-year half-life, anchored at 2025).
  4. Aggregates to one row per `(name, gender)`: sums `weighted_count`, preserves `raw_count`, lists `states_present`, captures `earliest_year` / `latest_year`.
  5. Ranks within each gender by `weighted_count` desc.

- **Workbook layout:** four sheets in `Names Australia recent weight.xlsx`:
  - `Boys Top 1000`, `Girls Top 1000` — quick-look slices, not read by the adapter.
  - `Boys All`, `Girls All` — **the adapter reads these**. Columns:

    `rank, name, weighted_count, raw_count, states_present, earliest_year, latest_year, any_estimated`

- **Location:** `scripts/data/raw/downloads/Names Australia recent weight.xlsx` (gitignored). Record source URLs, retrieval date, weighting parameters, and Zipf priors in your PR or internal log.

- **Privacy rule:** SA's published full corpus already truncates very-low-frequency names at the source. NSW/VIC/QLD only publish top 100, and TAS/WA only publish top 10. **The long tail therefore comes entirely from SA.** Nothing further to redact in the adapter.

---

## 2. Canonical CSV → JSONL

1. Extract workbook → canonical CSV:

```bash
npm run extract:baby-names:au-rbdm-xlsx -- \
  --in "scripts/data/raw/downloads/Names Australia recent weight.xlsx" \
  --out scripts/data/raw/au-rbdm-combined.canonical.csv
```

Optional flags:

```bash
npm run extract:baby-names:au-rbdm-xlsx -- \
  --in "…/Names Australia recent weight.xlsx" \
  --out scripts/data/raw/au-rbdm-combined.canonical.csv \
  --emit-year 2025 \
  --min-weighted-count 1
```

- `--emit-year` (default **2025**): the single year stamped on every row. Because the workbook already collapses 1944–2025 into one recency-weighted score per name, the canonical CSV carries one row per `(name, sex)` rather than per `(name, year, sex)`. Stamping one year keeps the downstream popularity-rank key (`year|sex|country`) producing a clean national rank.
- `--min-weighted-count` (default **1**): drop rows whose summed weighted count rounds to zero (mostly long-tail SA names from the 1940s–60s with a near-zero contribution).

2. Validate country labels:

```bash
npm run validate:import-country-labels -- scripts/data/raw/au-rbdm-combined.canonical.csv
```

3. Build JSONL:

```bash
tsx scripts/adaptEuNationalCsvToJsonl.ts \
  --in scripts/data/raw/au-rbdm-combined.canonical.csv \
  --out scripts/data/batches/external-au-rbdm-combined.v1.jsonl \
  --slug au-rbdm-combined \
  --output-region WORLDWIDE \
  --top-per-year-sex 1200
```

Or use the sample shortcut:

```bash
npm run adapt:baby-names:au-rbdm-combined-sample
```

4. Dry-run — record **`Y`** valid rows:

```bash
npm run import:baby-names -- --dry-run scripts/data/batches/external-au-rbdm-combined.v1.jsonl
```

---

## 3. Why upsert alone is unsafe

Imports **upsert on `id`** from deterministic `external_id`. Rows from an older Australia batch with the same `meaning_source` scope but different ids **remain** unless deleted. Same reasoning as Belgium / Spain runbooks — see [`BELGIUM_REAL_SOURCE_WORKFLOW.md`](./BELGIUM_REAL_SOURCE_WORKFLOW.md#3-why-upsert-alone-is-unsafe).

---

## 4. Staging execution checklist (copy-paste order)

1. **Confirm staging** — `.env` `EXPO_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` point at **staging**. The report script prints the Supabase host.
2. **Dry-run** — `npm run import:baby-names -- --dry-run scripts/data/batches/external-au-rbdm-combined.v1.jsonl` — record **`Y`** valid rows.
3. **Preflight** — `npm run report:baby-names:au-worldwide-bulk-stats` — note `baby_names` count and CASCADE (swipes/matches).
4. **SQL preflight** — In Supabase SQL (staging), run the `SELECT count(*)` in [`scripts/data/sql/australia_worldwide_bulk_delete_for_replacement.sql`](./sql/australia_worldwide_bulk_delete_for_replacement.sql); it must match the report's `baby_names` count.
5. **Scoped DELETE** — Uncomment and run the `DELETE` in that file (same `WHERE` as the `SELECT`).
6. **Re-verify empty** — `SELECT count(*)` again → **0** for that predicate.
7. **Import real batch** — `npm run import:baby-names -- scripts/data/batches/external-au-rbdm-combined.v1.jsonl`
8. **Post-verify** — Same `SELECT count(*)` → must equal **`Y`**. Run `npm run report:baby-names:au-worldwide-bulk-stats` — same number.

---

## 5. Related commands

| Step | Command |
|------|---------|
| Extract AU recency-weighted workbook | `npm run extract:baby-names:au-rbdm-xlsx` |
| Adapt sample CSV | `npm run adapt:baby-names:au-rbdm-combined-sample` |
| Country label validation | `npm run validate:import-country-labels -- <file.csv\|file.jsonl>` |
| Report AU bulk scope | `npm run report:baby-names:au-worldwide-bulk-stats` |
| Scoped DELETE SQL | [`scripts/data/sql/australia_worldwide_bulk_delete_for_replacement.sql`](./sql/australia_worldwide_bulk_delete_for_replacement.sql) |

**Parallel patterns:** [`BELGIUM_REAL_SOURCE_WORKFLOW.md`](./BELGIUM_REAL_SOURCE_WORKFLOW.md) (per-year preserved) · [`BRAZIL_REAL_SOURCE_WORKFLOW.md`](./BRAZIL_REAL_SOURCE_WORKFLOW.md) (non-EU `--output-region`).

---

## 6. Differences from the EU national pattern (read once)

The Belgium / France / Italy / NL / DE / ES adapters keep one row per `(name, year, sex, country)` and let the downstream rank names **per year per gender**. Australia is different on purpose:

- **No national registry.** The seven jurisdiction feeds publish different depths over different year windows; a per-year-per-sex view would be honest only for SA and would understate every other state.
- **Counts are not directly comparable across feeds.** TAS and WA give ranks, not counts; SA's pre-2018 files include the long tail, post-2017 files are top-100 only; QLD only has the last few years.
- **Recency weighting happens offline, not in the adapter.** The exponential half-life + Zipf imputation are an editorial step on the **inputs**, not a pipeline rule, so reproducibility lives in the merge script that builds the workbook (out of scope for this folder).
- **One canonical year per name.** `--emit-year` stamps every output row with the same year (default 2025). The downstream pipeline then computes one national rank per gender, which matches how this dataset is used in the swipe deck.

If a future Australia ingest uses a per-state feed with native per-year counts (e.g. SA full-corpus 1944–2023 only), that adapter should look more like the Belgium one and live in a separate script (`extractSouthAustraliaWorkbookToCanonicalCsv.ts`) with its own slug.
