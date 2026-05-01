# Netherlands: curated workbook → canonical CSV → JSONL import (staging replacement)

This mirrors the **Spain** replacement pattern (`SPAIN_REAL_SOURCE_WORKFLOW.md` §6–7): bulk rows from `adaptEuNationalCsvToJsonl` share a fixed **`origin`** string; swapping synthetic for real requires a **scoped DELETE** before import so old rows are not orphaned by upsert-on-`id`.

**Importer contract:** unchanged — `BulkImportSourceRow` JSONL via `scripts/importBabyNamesFromJsonl.ts`.

**Origin / scope (from `adaptEuNationalCsvToJsonl.ts`):** `${country} (national statistics)` → for Netherlands canonical CSV with `country = Netherlands`:

| Field | Value |
|--------|--------|
| `country` | `Netherlands` |
| `region` | `EU` |
| `is_premium` | `false` (bulk path) |
| `origin` | exactly `Netherlands (national statistics)` |

---

## 1. Build real batch (workbook → JSONL)

1. Extract canonical CSV: `npm run extract:baby-names:nl-workbook-xlsx -- --in "…/Names 2024 Netherlands.xlsx" --out scripts/data/raw/eu-nl-workbook-2024.canonical.csv --year 2024`
2. Adapt: `tsx scripts/adaptEuNationalCsvToJsonl.ts --in scripts/data/raw/eu-nl-workbook-2024.canonical.csv --out scripts/data/batches/external-eu-nl-workbook-2024.v1.jsonl --slug eu-nl --top-per-year-sex 1200`
3. Dry-run: `npm run import:baby-names -- --dry-run scripts/data/batches/external-eu-nl-workbook-2024.v1.jsonl` — note **`Y`** from `Parsed … → Y valid rows`.

More detail: [`README.baby-name-import.md`](./README.baby-name-import.md) (Netherlands curated workbook section).

---

## 2. Why upsert alone is unsafe

Same as Spain: imports **upsert on `id`** from deterministic `external_id`. Rows present only in the old synthetic batch **remain** unless deleted. See Spain runbook reasoning in [`SPAIN_REAL_SOURCE_WORKFLOW.md`](./SPAIN_REAL_SOURCE_WORKFLOW.md#6-clean-db-swap-for-ine-backed-rows-do-not-mix-synthetic-and-ine-origin-bulk-in-the-same-environment).

---

## 3. Staging execution checklist (copy-paste order)

1. **Confirm staging** — `.env` `EXPO_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` point at **staging**. The report script prints the Supabase host.
2. **Dry-run** — `npm run import:baby-names -- --dry-run scripts/data/batches/external-eu-nl-workbook-2024.v1.jsonl` — record **`Y`** valid rows.
3. **Preflight** — `npm run report:baby-names:nl-eu-bulk-stats` — note `baby_names` count and CASCADE (swipes/matches).
4. **SQL preflight** — In Supabase SQL (staging), run the `SELECT count(*)` in [`scripts/data/sql/netherlands_eu_bulk_delete_for_replacement.sql`](./sql/netherlands_eu_bulk_delete_for_replacement.sql); it must match the report’s `baby_names` count.
5. **Scoped DELETE** — Uncomment and run the `DELETE` in that file (same `WHERE` as the `SELECT`).
6. **Re-verify empty** — `SELECT count(*)` again → **0** for that predicate.
7. **Import real batch** — `npm run import:baby-names -- scripts/data/batches/external-eu-nl-workbook-2024.v1.jsonl`
8. **Post-verify** — Same `SELECT count(*)` → must equal **`Y`**. Run `npm run report:baby-names:nl-eu-bulk-stats` — same number.
9. **Mixing guardrail** — Do not import synthetic `external-eu-nl-cbs.v1.jsonl` bulk into the same environment without repeating the DELETE scope first.

---

## 4. Related commands

| Step | Command |
|------|---------|
| Report NL bulk scope | `npm run report:baby-names:nl-eu-bulk-stats` |
| Scoped DELETE SQL | [`scripts/data/sql/netherlands_eu_bulk_delete_for_replacement.sql`](./sql/netherlands_eu_bulk_delete_for_replacement.sql) |

**Parallel pattern (Germany):** [`GERMANY_REAL_SOURCE_WORKFLOW.md`](./GERMANY_REAL_SOURCE_WORKFLOW.md) · **France (INSEE):** [`FRANCE_REAL_SOURCE_WORKFLOW.md`](./FRANCE_REAL_SOURCE_WORKFLOW.md) · **Italy (ISTAT):** [`ITALY_REAL_SOURCE_WORKFLOW.md`](./ITALY_REAL_SOURCE_WORKFLOW.md) · **Portugal (hybrid):** [`PORTUGAL_REAL_SOURCE_WORKFLOW.md`](./PORTUGAL_REAL_SOURCE_WORKFLOW.md) · **Brazil (IBGE / LATAM, not PT):** [`BRAZIL_REAL_SOURCE_WORKFLOW.md`](./BRAZIL_REAL_SOURCE_WORKFLOW.md)
