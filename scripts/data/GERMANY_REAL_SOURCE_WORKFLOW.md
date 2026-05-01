# Germany: real Destatis (or licensed) extract → canonical CSV → JSONL import (staging replacement)

This mirrors the **Netherlands** replacement pattern ([`NETHERLANDS_REAL_SOURCE_WORKFLOW.md`](./NETHERLANDS_REAL_SOURCE_WORKFLOW.md)) and the **Spain** clean-swap reasoning: bulk rows from `adaptEuNationalCsvToJsonl` share a fixed **`origin`** string; swapping synthetic for real requires a **scoped DELETE** before import so old rows are not orphaned by upsert-on-`id`.

**Importer contract:** unchanged — `BulkImportSourceRow` JSONL via `scripts/importBabyNamesFromJsonl.ts`.

**Origin / scope (from `adaptEuNationalCsvToJsonl.ts`):** `${country} (national statistics)` → for Germany canonical CSV with `country = Germany`:

| Field | Value |
|--------|--------|
| `country` | `Germany` |
| `region` | `EU` |
| `is_premium` | `false` (bulk path) |
| `origin` | exactly `Germany (national statistics)` |

---

## Synthetic vs real (lineage)

| Path | What it is | Artifacts |
|------|----------------|-----------|
| **Synthetic staging (today)** | Embedded seeds via `emitEuNationalStagingRawCsv.ts` — **not** Destatis figures | Raw: `scripts/data/raw/eu-de-destatis.v1.csv`; JSONL: `scripts/data/batches/external-eu-de-destatis.v1.jsonl`; small sample: `eu-de-destatis-sample.csv` → `external-eu-de-destatis-sample.v1.jsonl` |
| **Target real source** | **Destatis** (Statistisches Bundesamt) or another **country-native** open/licensed German naming statistic; **or** a **ranked top-name workbook** (rank + name; counts optional) | Raw under `scripts/data/raw/downloads/` (gitignored). **Ranked workbook → canonical:** `scripts/extractGermanyWorkbookToCanonicalCsv.ts` (`npm run extract:baby-names:de-workbook-xlsx`). **Destatis-shaped tables:** map to canonical CSV (dedicated mapper TBD) or hand-edit once format is pinned. |

**Volume expectation:** Public deck supplement is **capped** (~400–500 rows per fetch). Imports can be **thousands** of rows. Like US/NL staging practice, expect a **top-N per year + sex** slice (e.g. `--top-per-year-sex 1200`) unless product requires full long-tail. Whether the chosen Destatis product is **full-frequency tables** or **published top lists** is **TBD when the source file is pinned** — document it in [`SOURCE_TRUTH_AND_REFRESH.md`](./SOURCE_TRUTH_AND_REFRESH.md) after the first real batch.

**Production-ready:** Follow the checklist in [`SOURCE_TRUTH_AND_REFRESH.md`](./SOURCE_TRUTH_AND_REFRESH.md) (real extract, provenance, stable `external_id`, quality pass, refresh owner, legal/product). **`import` dry-run OK ≠ prod-ready.**

---

## 1. Intake: raw file → canonical CSV → JSONL

### Expected canonical CSV (required header)

Same as all EU national paths in [`README.baby-name-import.md`](./README.baby-name-import.md):

- `year,name,sex,count,country`
- `sex`: `M` / `F`
- `country`: **`Germany`** (must match app / DB `baby_names.country` weighting)

### Ranked workbook (top-name list; optional counts)

Example file: `scripts/data/raw/downloads/Names Germany 2020 -2025 top 1400.xlsx` — **two sheets** whose names include **`boy`** and **`girl`** (e.g. boys / girls top lists), columns **Ranking** + **Name** (and optionally counts). **Pseudo-counts:** when counts are absent, the extractor emits **deterministic descending counts** so `adaptEuNationalCsvToJsonl` preserves workbook order — **not real frequencies** (see script header).

```bash
npm run extract:baby-names:de-workbook-xlsx -- \
  --in "scripts/data/raw/downloads/Names Germany 2020 -2025 top 1400.xlsx" \
  --out scripts/data/raw/eu-de-workbook-2024.canonical.csv \
  --year 2024
```

Then continue at **Build JSONL** below with `--in` pointing at that CSV and `--top-per-year-sex` matching list depth (e.g. `1400`).

### Expected raw location (operator) — Destatis / tabular extracts

1. Download or export the pinned Destatis (or alternate) file into **`scripts/data/raw/downloads/`** (gitignored). Record URL, retrieval date, table id / file name, reference year, and license in the PR or internal log.
2. **Normalize** to the canonical header above. Until a dedicated mapper exists, use a **one-off spreadsheet/CSV edit** or a **small future script** (e.g. `mapDestatisGermanyToCanonicalCsv.ts`) once the **exact** column layout is stable — do not guess column names in this runbook.
3. Save working canonical CSV beside other EU raw mirrors if useful, e.g. `scripts/data/raw/eu-de-destatis.real.<year>.canonical.csv` (optional; avoid committing large files).
4. Build JSONL:

```bash
tsx scripts/adaptEuNationalCsvToJsonl.ts \
  --in scripts/data/raw/eu-de-destatis.real.<year>.canonical.csv \
  --out scripts/data/batches/external-eu-de-destatis-real-<year>.v1.jsonl \
  --slug eu-de \
  --top-per-year-sex 1200
```

5. Dry-run (replace path with your batch file):

```bash
npm run import:baby-names -- --dry-run scripts/data/batches/<DE_BATCH>.v1.jsonl
```

Note **`Y`** from `Parsed … → Y valid rows` (this must match post-import `SELECT count(*)` below).

**Example batch paths**

| Source | Typical `<DE_BATCH>.v1.jsonl` under `scripts/data/batches/` |
|--------|----------------------------------------------------------------|
| Ranked workbook → adapt | `external-eu-de-workbook-2024` (see [`README.baby-name-import.md`](./README.baby-name-import.md)) |
| Destatis-shaped canonical → adapt | `external-eu-de-destatis-real-<year>` |

Workbook and Destatis paths both emit `origin = Germany (national statistics)` via `adaptEuNationalCsvToJsonl.ts` — the scoped **DELETE** / **report** predicates are identical.

---

## 2. Why upsert alone is unsafe

Same as Netherlands / Spain: imports **upsert on `id`** from deterministic `external_id`. Rows present only in the old synthetic batch **remain** unless deleted. See [`SPAIN_REAL_SOURCE_WORKFLOW.md`](./SPAIN_REAL_SOURCE_WORKFLOW.md) §6 for the mixing guardrail.

---

## 3. Staging execution checklist (copy-paste order)

Set **`DE_BATCH`** to your JSONL basename (no `.jsonl`), e.g. `external-eu-de-workbook-2024` or `external-eu-de-destatis-real-2024`. Same **`Y`** as in §1 dry-run throughout.

1. **Confirm staging** — `.env` `EXPO_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` point at **staging**. The report script prints the Supabase host.
2. **Dry-run** — `npm run import:baby-names -- --dry-run scripts/data/batches/${DE_BATCH}.v1.jsonl` — record **`Y`** valid rows (`Parsed … → Y valid rows`).
3. **Preflight** — `npm run report:baby-names:de-eu-bulk-stats` — note Germany EU bulk candidate count **`N_old`** and CASCADE (swipes/matches). Expect **`N_old`** to match the next step.
4. **SQL preflight** — In Supabase SQL (staging), run the `SELECT count(*)` in [`scripts/data/sql/germany_eu_bulk_delete_for_replacement.sql`](./sql/germany_eu_bulk_delete_for_replacement.sql); result must equal **`N_old`** from step 3 (rows about to be removed). **`Y`** is the new batch size from step 2 — it does **not** need to equal **`N_old`**.
5. **Scoped DELETE** — Uncomment and run the `DELETE` in that file (same `WHERE` as the `SELECT`).
6. **Post-delete zero** — Run the same `SELECT count(*)` again → **0** for that predicate. Run `npm run report:baby-names:de-eu-bulk-stats` → **0** candidates.
7. **Import real batch** — `npm run import:baby-names -- scripts/data/batches/${DE_BATCH}.v1.jsonl`
8. **Post-import verify** — Run the same `SELECT count(*)` from the SQL file → must equal **`Y`**. Run `npm run report:baby-names:de-eu-bulk-stats` → must also equal **`Y`** (all imported bulk rows share the same `origin` predicate). **If `Y` ≠ SQL count or report count, stop** — do not layer another bulk import until resolved.
9. **Mixing guardrail** — Do not import synthetic `external-eu-de-destatis.v1.jsonl` bulk into the same environment after the real batch without repeating the DELETE scope first. Do not import a **second** real JSONL into the same scope without deciding whether to DELETE again (would remove the first real import’s rows).

---

## 4. Related commands

| Step | Command |
|------|---------|
| Report DE bulk scope | `npm run report:baby-names:de-eu-bulk-stats` |
| Scoped DELETE SQL | [`scripts/data/sql/germany_eu_bulk_delete_for_replacement.sql`](./sql/germany_eu_bulk_delete_for_replacement.sql) |
| Synthetic rebuild (dev only) | `tsx scripts/emitEuNationalStagingRawCsv.ts --market de` then adapt to `external-eu-de-destatis.v1.jsonl` (see [`README.baby-name-import.md`](./README.baby-name-import.md)) |

---

## 5. First operational step (no code)

**Pin the exact Destatis (or substitute) dataset** the product will use (Genesis product code or download URL + file format), save one copy under `scripts/data/raw/downloads/`, and document column meanings. Only then add a tiny column-mapper script or a one-off canonical CSV — the EU adapter already covers JSONL generation.
