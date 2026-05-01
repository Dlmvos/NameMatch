# Italy: ISTAT (or licensed) national extract → canonical CSV → JSONL (real intake + staging replacement)

This mirrors **France** / **Germany** / **Netherlands**: bulk rows from `adaptEuNationalCsvToJsonl` share **`origin = Italy (national statistics)`**; swapping synthetic for real requires a **scoped DELETE** before import so upserts do not leave orphan synthetic rows.

**Importer contract:** unchanged — `BulkImportSourceRow` JSONL via `scripts/importBabyNamesFromJsonl.ts`.

**Origin / scope (from `adaptEuNationalCsvToJsonl.ts`):** for canonical CSV with `country = Italy`:

| Field | Value |
|--------|--------|
| `country` | `Italy` |
| `region` | `EU` |
| `is_premium` | `false` (bulk path) |
| `origin` | exactly `Italy (national statistics)` |

---

## Synthetic vs real (lineage)

| Path | What it is | Artifacts |
|------|------------|------------|
| **Synthetic staging (today)** | Embedded seeds via `emitEuNationalStagingRawCsv.ts` — **not** ISTAT figures | Raw: `scripts/data/raw/eu-it-istat.v1.csv`; JSONL: `scripts/data/batches/external-eu-it-istat.v1.jsonl` (`npm run build:baby-names:eu-it-istat-v1`) |
| **Target real source** | **ISTAT** (Istituto Nazionale di Statistica) or another **country-native** open/licensed Italian naming statistic; **or** regional civil-registry aggregates if product/legal chooses that path; **or** curated **Wikipedia + ISTAT Top 200** workbook → `extractItalyWorkbookToCanonicalCsv.ts` | Raw / workbook under `scripts/data/raw/downloads/` (gitignored). Tabular ISTAT: hand map or future `mapIstatItalyToCanonicalCsv.ts` when columns are fixed. **Workbook:** `npm run extract:baby-names:it-workbook-xlsx` → canonical CSV → adapt (see §1b). |

**Volume:** National ISTAT extracts can be **large**. Expect a **top-N per year + sex** slice via `--top-per-year-sex` on the adapter for staging/deck caps unless product requires full long-tail. Document whether the chosen extract is **full-frequency** or **published top lists** when you pin the file.

**Production-ready:** [`SOURCE_TRUTH_AND_REFRESH.md`](./SOURCE_TRUTH_AND_REFRESH.md) checklist (real extract, provenance, stable `external_id`, quality, refresh owner, legal/product). **`import` dry-run OK ≠ prod-ready.**

---

## 1. Intake: raw file → canonical CSV → JSONL

### Expected canonical CSV (required header)

Same as all EU paths in [`README.baby-name-import.md`](./README.baby-name-import.md):

- `year,name,sex,count,country` with `sex` ∈ `M`/`F` and **`country = Italy`**.

### 1b. Curated workbook (Wikipedia long-tail + ISTAT Top 200 anchor)

Example: `scripts/data/raw/downloads/Names Italy wikipedia + top 200 ISTAT.xlsx` — sheets **`Italian wikipedia names A-L`**, **`Italian wikipedia names M-Z`** (Maschile / Femminile), and **`Popular 2024 Names ISTAT`** (alternating rank / name rows; boys left, girls right). **ISTAT names outrank** Wikipedia-only names via **synthetic descending counts** (not real frequencies); **dedupe** by normalized name + sex with **ISTAT winning** over Wikipedia.

```bash
npm run extract:baby-names:it-workbook-xlsx -- \
  --in "scripts/data/raw/downloads/Names Italy wikipedia + top 200 ISTAT.xlsx" \
  --out scripts/data/raw/eu-it-workbook-2024.canonical.csv \
  --year 2024
```

Then adapt (raise `--top-per-year-sex` to cover full merged row count from dry-run):

```bash
tsx scripts/adaptEuNationalCsvToJsonl.ts \
  --in scripts/data/raw/eu-it-workbook-2024.canonical.csv \
  --out scripts/data/batches/external-eu-it-workbook-2024.v1.jsonl \
  --slug eu-it \
  --top-per-year-sex 8000
```

### Expected raw location (operator)

1. Download the pinned **ISTAT** (or substitute) extract into **`scripts/data/raw/downloads/`**. Record URL, retrieval date, table name, reference year(s), and license/terms.
2. **Map** to canonical CSV (spreadsheet, one-off script, or future `mapIstatItalyToCanonicalCsv.ts` when headers are stable).
3. Build JSONL:

```bash
tsx scripts/adaptEuNationalCsvToJsonl.ts \
  --in scripts/data/raw/eu-it-istat.real.canonical.csv \
  --out scripts/data/batches/external-eu-it-istat-real-<variant>.v1.jsonl \
  --slug eu-it \
  --top-per-year-sex 1200
```

4. Dry-run: `npm run import:baby-names -- --dry-run scripts/data/batches/<IT_BATCH>.v1.jsonl` — record **`Y`** valid rows.

---

## 2. Why upsert alone is unsafe

Same as Spain / France / Germany: imports **upsert on `id`**. Rows only present in the old synthetic batch **remain** unless deleted. See [`SPAIN_REAL_SOURCE_WORKFLOW.md`](./SPAIN_REAL_SOURCE_WORKFLOW.md) §6.

---

## 3. Staging execution checklist (copy-paste order)

Set **`IT_BATCH`** to your JSONL basename (no `.jsonl`), matching `--out` from §1. Use **`Y`** from the dry-run throughout.

1. **Confirm staging** — `.env` `EXPO_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` point at **staging**. The report script prints the Supabase host.
2. **Dry-run** — `npm run import:baby-names -- --dry-run scripts/data/batches/${IT_BATCH}.v1.jsonl` — record **`Y`**.
3. **Preflight** — `npm run report:baby-names:it-eu-bulk-stats` — note **`N_old`** and CASCADE.
4. **SQL preflight** — [`scripts/data/sql/italy_eu_bulk_delete_for_replacement.sql`](./sql/italy_eu_bulk_delete_for_replacement.sql) — `SELECT count(*)` must equal **`N_old`**. **`Y`** need not equal **`N_old`**.
5. **Scoped DELETE** — Uncomment and run the `DELETE` (same `WHERE` as `SELECT`).
6. **Post-delete zero** — `SELECT count(*)` → **0**; `npm run report:baby-names:it-eu-bulk-stats` → **0**.
7. **Import** — `npm run import:baby-names -- scripts/data/batches/${IT_BATCH}.v1.jsonl`
8. **Post-import verify** — `SELECT count(*)` and report → both **`Y`**.
9. **Mixing guardrail** — Do not import synthetic `external-eu-it-istat.v1.jsonl` bulk after the real batch without repeating the DELETE scope first.

---

## 4. Related commands

| Step | Command / file |
|------|----------------|
| Workbook → canonical | `npm run extract:baby-names:it-workbook-xlsx` → `scripts/extractItalyWorkbookToCanonicalCsv.ts` |
| Report IT bulk scope | `npm run report:baby-names:it-eu-bulk-stats` → `scripts/reportItalyEuBulkImportStats.ts` |
| Scoped DELETE SQL | [`scripts/data/sql/italy_eu_bulk_delete_for_replacement.sql`](./sql/italy_eu_bulk_delete_for_replacement.sql) |
| EU adapter | `scripts/adaptEuNationalCsvToJsonl.ts` (`--slug eu-it`) |

**Parallel patterns:** [`FRANCE_REAL_SOURCE_WORKFLOW.md`](./FRANCE_REAL_SOURCE_WORKFLOW.md) · [`GERMANY_REAL_SOURCE_WORKFLOW.md`](./GERMANY_REAL_SOURCE_WORKFLOW.md)

---

## 5. First operational step (no code)

**Either** pin the exact **ISTAT** tabular dataset (URL, format, columns) before adding `mapIstatItalyToCanonicalCsv.ts`, **or** maintain the **curated workbook** under `scripts/data/raw/downloads/` and record provenance (Wikipedia list source + ISTAT Top 200 reference year) in your PR or internal log — then run `extract:baby-names:it-workbook-xlsx` and the EU adapter as in §1b.
