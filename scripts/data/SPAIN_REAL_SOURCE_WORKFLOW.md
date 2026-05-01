# Spain: INE-aligned sources → canonical CSV → JSONL import

**Source strategy (current repo truth):**

- **Official INE newborn-name workbook / CSV path** (`extractIneSpainWorkbookToCanonicalCsv.ts`, `mapIneSpainToCanonicalCsv.ts`): **trusted, authentic INE-backed data** suitable for a **top-layer anchor** (top names, allowlists, validation). It is **not** a confirmed **full long-tail** public extract for the whole name universe.
- **Spain MNP-style birth microdata** (e.g. files under `scripts/data/raw/downloads/` such as “Names Spain … full set”): in the **coded / anonymized** form commonly distributed, it **does not contain literal given names** and is **not directly usable** for name extraction (`extractSpainMnpBirthNames.ts` fails fast when names are code-only). Do not treat MNP as Spain’s broad real name source unless you obtain a **different** extract that includes **name text** and clear license terms.

This workflow keeps Spain grounded in **official INE authenticity** while acknowledging production deck depth needs a **hybrid** path. INE-backed imports are the **top layer**; a curated long-tail source is required to avoid shallow supplements.

**Rule:** Prefer improving **source truth** over retuning deck weighting to compensate for synthetic Spain lists.

---

## 1. Assumptions about the Spain (INE) extract

- **Provider:** [INE (Instituto Nacional de Estadística)](https://www.ine.es/) — typically *Nombres y apellidos* / birth or padron–based name frequency tables, depending on which statistical product you license for product use.
- **Formats:** INE often publishes **CSV** (frequently **`;`-delimited**) or **Excel**. Files may include a **UTF-8 BOM** and **Spanish** column titles (`Nombre`, `Sexo`, `Año`, `Total`, `Frecuencia`, etc.). Some exports add **title or blank lines before the header row**; `mapIneSpainToCanonicalCsv.ts` scans the first 50 non-empty lines for a recognizable header.
- **Semantics:** Rows are **first name + sex + reference year + count** (or equivalent). Tables that only expose **aggregates** (“ambos sexos”, rates per thousand without counts) are **not** usable until reshaped into one row per name/sex/year with a positive integer count.
- **Legal / product:** Confirm reuse terms for the **exact** table you download; this repo does not substitute for legal review.

If your download uses different header labels, extend the alias lists in `scripts/mapIneSpainToCanonicalCsv.ts` in a small follow-up PR (still minimal).

---

## 2. Where to put files

| Artifact | Location |
|----------|----------|
| **Raw INE download** (do not commit large vendor files by default) | `scripts/data/raw/downloads/` (gitignored) |
| **Canonical CSV** (adapter input) | e.g. `scripts/data/raw/eu-es-ine.real.canonical.csv` (local / CI; optional commit if small policy allows) |
| **JSONL batch** (importer input) | e.g. `scripts/data/batches/external-eu-es-ine-real-2023.v1.jsonl` |

Naming: follow [`MARKET_COVERAGE_ROADMAP.md`](./MARKET_COVERAGE_ROADMAP.md) (`external-eu-es-ine-{source-or-year}-…`).

---

## 3. Workflow (synthetic staging vs INE-backed batches)

### A. Obtain the INE file (workbook or CSV-shaped export)

1. Download the chosen INE table (CSV or export Excel → CSV).
2. Save as e.g. `scripts/data/raw/downloads/ine-nombres-<table-id>-<year>.csv`.
3. Record provenance (URL, date, table id, statistical year) in your PR or internal log; update [`SOURCE_TRUTH_AND_REFRESH.md`](./SOURCE_TRUTH_AND_REFRESH.md) when the market is promoted to **real**.

### B. Map to canonical EU CSV

Canonical header required by `adaptEuNationalCsvToJsonl.ts`:

`year,name,sex,count,country` (`sex`: `M` / `F`; `country`: use `Spain` to match existing app rows.)

```bash
tsx scripts/mapIneSpainToCanonicalCsv.ts \
  --in scripts/data/raw/downloads/ine-nombres-<your-file>.csv \
  --out scripts/data/raw/eu-es-ine.real.canonical.csv \
  --country Spain \
  --year-min 2022 \
  --year-max 2023
```

Optional filters `--year-min` / `--year-max` slice the extract before the adapter.

### B2. Depth correction: Spain is hybrid (recommended)

Recent execution confirms INE-only depth is too shallow for deck coverage:

- TOTAL-style INE batch: ~200 JSONL rows (`external-eu-es-ine-real-2023.v1.jsonl`)
- Regional comunidad aggregation run: ~110 canonical rows (dry-run valid, but depth worsened)

Operational conclusion: **do not treat regional aggregation as the practical depth fix**.  
Spain should follow a **hybrid** intake model:

1. **Official top layer** from INE workbook/CSV (authentic national anchor)
2. **Curated long-tail layer** (licensed/editorial/allowlist source with documented provenance)
3. **Rank-preserving synthetic tail counts** where needed so adapter/import shape remains stable

Use the same importer contract (`year,name,sex,count,country` → `adaptEuNationalCsvToJsonl.ts` → JSONL). Keep INE-only batches for top-layer validation, not as a sole production-depth replacement.

### B3. Hybrid extractor (INE workbook + general Spain workbook)

Shipped script: `extractSpainHybridSourcesToCanonicalCsv.ts` (`npm run extract:baby-names:es-hybrid-sources`).

- **INE** (`--ine-xlsx`): official top layer; pass `--ine-sheet TOTAL` when the file has a national TOTAL sheet (recommended).
- **General** (`--general-xlsx`): curated long-tail workbook (e.g. `Names Spain - general.xlsx` under `scripts/data/raw/downloads/`) — row 0 **Male** / **Female**, names from row 1 in columns A/B.
- **Dedupe:** normalized name + sex; INE wins. Tail rows get **rank-preserving synthetic counts** below the INE floor for that sex (documented in the script header; not real INE frequencies).

```bash
npm run extract:baby-names:es-hybrid-sources -- \
  --ine-xlsx "scripts/data/raw/downloads/Names Spain 2022 -2024.xlsx" \
  --general-xlsx "scripts/data/raw/downloads/Names Spain - general.xlsx" \
  --out scripts/data/raw/eu-es-hybrid-2023.canonical.csv \
  --year 2023 \
  --ine-sheet TOTAL
```

Then adapt/import unchanged: `adaptEuNationalCsvToJsonl.ts` → JSONL → `import:baby-names` (same `--slug eu-es` and scoped delete rules as other Spain bulk rows).

**Smoke shape** (committed illustrative file, not real INE data):

```bash
tsx scripts/mapIneSpainToCanonicalCsv.ts \
  --in scripts/data/raw/ine-es-shaped.example.csv \
  --out /tmp/eu-es-ine.example.canonical.csv
```

### C. Build JSONL (same adapter as synthetic path)

```bash
tsx scripts/adaptEuNationalCsvToJsonl.ts \
  --in scripts/data/raw/eu-es-ine.real.canonical.csv \
  --out scripts/data/batches/external-eu-es-ine-real-2023.v1.jsonl \
  --slug eu-es \
  --top-per-year-sex 1200
```

Use `--slug eu-es` so `external_id` namespace stays consistent with existing Spain bulk imports unless you intentionally version the slug for a breaking migration.

### D. Validate and import

```bash
npm run import:baby-names -- --dry-run scripts/data/batches/external-eu-es-ine-real-2023.v1.jsonl
```

**If the staging DB already contains synthetic Spain bulk rows** (typical after `build:baby-names:eu-es-ine-v1` or earlier imports): **do not** run the live import yet — follow **§6** (scoped `DELETE`, then import). Only use the line below when the DB has **no** such rows (greenfield) or **after** the delete:

```bash
npm run import:baby-names -- scripts/data/batches/external-eu-es-ine-real-2023.v1.jsonl
```

Run against **staging** DB first; complete the [production readiness checklist](SOURCE_TRUTH_AND_REFRESH.md#production-readiness-checklist-per-market) before prod.

### E. Stop relying on synthetic Spain for prod

- **Do not** run `build:baby-names:eu-es-ine-v1` for production supplements once real batches are approved (that npm script regenerates **synthetic** seeds).
- Keep the synthetic path only for **adapter / importer regression tests** if needed.

---

## 4. Related commands

| Step | Command |
|------|---------|
| Map INE-shaped → canonical | `npm run map:baby-names:es-ine-to-canonical -- --in … --out …` |
| INE `.xlsx` → canonical (default: sum all comunidad sheets; skips cover `Año YYYY` and `TOTAL`; `--sheet TOTAL` = national sheet only) | `npm run extract:baby-names:es-ine-xlsx -- --in … --out … --year YYYY` |
| MNP tab-separated birth microdata → canonical (needs **literal** name text in file; many public MNP drops are code-only) | `npm run extract:baby-names:es-mnp-tsv -- --in … --out … --year YYYY` |
| Canonical → JSONL | `tsx scripts/adaptEuNationalCsvToJsonl.ts --in … --out … --slug eu-es` |
| Import | `npm run import:baby-names -- [--dry-run] <batch.jsonl>` |
| Pre-delete impact (Spain bulk scope) | `npm run report:baby-names:es-eu-bulk-stats` |
| Netherlands bulk swap (same pattern, different country/origin) | [`NETHERLANDS_REAL_SOURCE_WORKFLOW.md`](./NETHERLANDS_REAL_SOURCE_WORKFLOW.md) |
| SQL runbook | [`scripts/data/sql/spain_eu_bulk_delete_for_replacement.sql`](./sql/spain_eu_bulk_delete_for_replacement.sql) |
| **Staging cutover (ordered)** | [§7 Staging execution checklist](#7-staging-execution-checklist-copy-paste-order) |

---

## 5. Troubleshooting

- **`Could not map required columns from header`:** Open the raw file, inspect the header row, and add aliases in `mapIneSpainToCanonicalCsv.ts` or preprocess once into the canonical header manually.
- **Many skipped rows:** Often **sex** = total / both sexes; filter those in the source or add handling in the mapper.
- **Dropped rows at adapt time:** Importer quality rules in `scripts/lib/bulkBabyNameImport.ts`; review `[adapt] Dropped` warnings.

---

## 6. Clean DB swap for INE-backed rows (do not mix synthetic and INE-origin bulk in the same environment)

### Why upsert alone is unsafe

- Imports **upsert on `id`** (`scripts/importBabyNamesFromJsonl.ts`). The `id` is a deterministic UUID from `external_id` (`eu-es:spain:<year>:<M|F>:<name-slug>`).
- Rows that exist **only** in the old synthetic batch (different year/name mix) keep their old `id`s and **stay in `baby_names`** unless removed. You end up with **synthetic orphans** alongside real INE-backed rows in the same deck.

`baby_names` has **no** `external_id` or batch column; you cannot list “synthetic” from SQL alone except via fields the adapter sets.

### Scope: which rows are “Spain bulk import”?

Target **only** rows created by `adaptEuNationalCsvToJsonl` for Spain:

| Field | Value |
|--------|--------|
| `country` | `Spain` |
| `region` | `EU` |
| `is_premium` | `false` |
| `origin` | exactly `Spain (national statistics)` |

This matches the adapter’s `origin` string and **does not** remove small manual seeds that use other origins (e.g. `Spanish` in `seed.sql`).

### Safe replacement criteria (check before DELETE)

1. **Staging / dev:** OK to delete the scope above and re-import in one go when validating INE data.
2. **Production-like:** Run `npm run report:baby-names:es-eu-bulk-stats` and accept **CASCADE**: deleting these `baby_names` rows **removes** related `swipes` and `matches` (`on delete cascade` in schema). Schedule a **maintenance window** if those counts are non-zero.
3. **INE-backed JSONL ready:** Dry-run passed; provenance recorded; you understand **coverage is top-name / INE-table depth**, not implied full long-tail; you will import **only** the new batch immediately after delete (no partial gap longer than agreed).

### Operational order (recommended)

1. Build real JSONL (§3 A–C) and **dry-run** import (§3 D first command only).
2. `npm run report:baby-names:es-eu-bulk-stats` → note `baby_names` / swipes / matches impact.
3. In SQL editor, run preflight `SELECT count(*)` from [`scripts/data/sql/spain_eu_bulk_delete_for_replacement.sql`](./sql/spain_eu_bulk_delete_for_replacement.sql).
4. **DELETE** the scoped rows (uncomment the `DELETE` in that file, or equivalent).
5. `npm run import:baby-names -- <external-eu-es-ine-real-….jsonl>`.
6. **Post-replacement:** run the same `SELECT count(*)` as step 3 — it must equal the **valid** row count from `import:baby-names --dry-run` (see §7). Run `npm run report:baby-names:es-eu-bulk-stats` — same count; swipes/matches only change if CASCADE removed rows during DELETE.

### Mixing guardrail

- After cutover, **do not** import `external-eu-es-ine.v1.jsonl` (synthetic staging) into the same environment unless you repeat the DELETE scope first.

---

## 7. Staging execution checklist (copy-paste order)

Use this for **staging** when swapping synthetic Spain bulk rows for an **INE-backed** batch (top-name / table-depth coverage). Long-tail gaps vs synthetic staging may remain until a **separate** broad real source exists.

1. **Confirm target project** — In `.env`, `EXPO_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` must be the **staging** Supabase project (not production). The report script prints `Supabase host (confirm staging): …` so you can double-check before DELETE.
2. **Build artifacts** — §3 A–C: INE (or test) CSV → `mapIneSpainToCanonicalCsv` → `adaptEuNationalCsvToJsonl` → `external-eu-es-ine-real-<year>.v1.jsonl`.
3. **Dry-run import** — `npm run import:baby-names -- --dry-run scripts/data/batches/external-eu-es-ine-real-2023.v1.jsonl` (or your real batch path; validates rows locally; no DB writes). Note **`Y` valid rows** from the `Parsed … → Y valid rows` line for step 9.
4. **Preflight** — `npm run report:baby-names:es-eu-bulk-stats` — record Spain bulk row count and swipe/match impact (staging CASCADE is often acceptable).
5. **SQL preflight** — In Supabase SQL (staging), run the `SELECT count(*)` in [`scripts/data/sql/spain_eu_bulk_delete_for_replacement.sql`](./sql/spain_eu_bulk_delete_for_replacement.sql); it must match the report’s `baby_names` count.
6. **Scoped DELETE** — Uncomment and run the `DELETE` in that same SQL file (or paste the predicate); **only** rows with `origin = 'Spain (national statistics)'` are removed.
7. **Re-verify empty** — `SELECT count(*)` again → expect **0** for that predicate.
8. **Import real batch** — `npm run import:baby-names -- scripts/data/batches/external-eu-es-ine-real-2023.v1.jsonl` (adjust filename if your extract year/path differs).
9. **Post-verify** — `SELECT count(*)` with the same predicate → must equal **`Y` from the dry-run line** (`Parsed … → Y valid rows`), not raw `wc -l` (invalid lines are skipped). Run `npm run report:baby-names:es-eu-bulk-stats` — same number.
10. **Mixing check** — Do not import `external-eu-es-ine.v1.jsonl` on top of this without repeating §6.
