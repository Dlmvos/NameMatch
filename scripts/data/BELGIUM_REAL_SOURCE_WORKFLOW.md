# Belgium: Statbel newborn names by province → canonical CSV → JSONL (real intake)

**Downstream:** unchanged — `adaptEuNationalCsvToJsonl.ts` (`--slug eu-be-statbel`) → `importBabyNamesFromJsonl.ts`.

**Provenance on import:** `origin = null`, `meaning_source = 'Belgium national statistics (eu-be-statbel)'` (see `adaptEuNationalCsvToJsonl.ts`).

**Scoped replacement:** `country = 'Belgium'`, `region = 'EU'`, `coalesce(is_premium, false) = false`, `meaning_source = 'Belgium national statistics (eu-be-statbel)'` — see SQL + report below.

---

## 1. Expected raw file (Statbel)

- **Source:** Statbel open data — first names of **newborns**, aggregated to **province** level in a curated workbook with sheets **`F_PROV2017` … `F_PROV2024`** and **`M_PROV2017` … `M_PROV2024`** (11 province columns per sheet; counts summed nationally in the extractor).
- **Location:** `scripts/data/raw/downloads/` (gitignored). Record URL, retrieval date, and file vintage in your PR or internal log.
- **Privacy rule:** Statbel only publishes names with **≥ 5 occurrences** per slice.

---

## 2. Canonical CSV → JSONL

1. Extract workbook → canonical CSV:

```bash
npm run extract:baby-names:be-statbel-xlsx -- \
  --in "scripts/data/raw/downloads/Belgium newborn names Statbel.xlsx" \
  --out scripts/data/raw/eu-be-statbel.canonical.csv
```

Optional year window:

```bash
npm run extract:baby-names:be-statbel-xlsx -- \
  --in "…/Belgium newborn names Statbel.xlsx" \
  --out scripts/data/raw/eu-be-statbel-2017-2024.canonical.csv \
  --year-min 2017 --year-max 2024
```

2. Validate country labels:

```bash
npm run validate:import-country-labels -- scripts/data/raw/eu-be-statbel.canonical.csv
```

3. Build JSONL:

```bash
tsx scripts/adaptEuNationalCsvToJsonl.ts \
  --in scripts/data/raw/eu-be-statbel.canonical.csv \
  --out scripts/data/batches/external-eu-be-statbel.v1.jsonl \
  --slug eu-be-statbel \
  --top-per-year-sex 1200
```

Or use the sample shortcut:

```bash
npm run adapt:baby-names:eu-be-statbel-sample
```

4. Dry-run — record **`Y`** valid rows:

```bash
npm run import:baby-names -- --dry-run scripts/data/batches/external-eu-be-statbel.v1.jsonl
```

---

## 3. Why upsert alone is unsafe

Imports **upsert on `id`** from deterministic `external_id`. Rows from an older Belgium batch with the same `meaning_source` scope but different ids **remain** unless deleted. See Spain runbook reasoning in [`SPAIN_REAL_SOURCE_WORKFLOW.md`](./SPAIN_REAL_SOURCE_WORKFLOW.md#6-clean-db-swap-for-ine-backed-rows-do-not-mix-synthetic-and-ine-origin-bulk-in-the-same-environment).

---

## 4. Staging execution checklist (copy-paste order)

1. **Confirm staging** — `.env` `EXPO_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` point at **staging**. The report script prints the Supabase host.
2. **Dry-run** — `npm run import:baby-names -- --dry-run scripts/data/batches/external-eu-be-statbel.v1.jsonl` — record **`Y`** valid rows.
3. **Preflight** — `npm run report:baby-names:be-eu-bulk-stats` — note `baby_names` count and CASCADE (swipes/matches).
4. **SQL preflight** — In Supabase SQL (staging), run the `SELECT count(*)` in [`scripts/data/sql/belgium_eu_bulk_delete_for_replacement.sql`](./sql/belgium_eu_bulk_delete_for_replacement.sql); it must match the report’s `baby_names` count.
5. **Scoped DELETE** — Uncomment and run the `DELETE` in that file (same `WHERE` as the `SELECT`).
6. **Re-verify empty** — `SELECT count(*)` again → **0** for that predicate.
7. **Import real batch** — `npm run import:baby-names -- scripts/data/batches/external-eu-be-statbel.v1.jsonl`
8. **Post-verify** — Same `SELECT count(*)` → must equal **`Y`**. Run `npm run report:baby-names:be-eu-bulk-stats` — same number.

---

## 5. Related commands

| Step | Command |
|------|---------|
| Extract Statbel workbook | `npm run extract:baby-names:be-statbel-xlsx` |
| Adapt sample CSV | `npm run adapt:baby-names:eu-be-statbel-sample` |
| Country label validation | `npm run validate:import-country-labels -- <file.csv\|file.jsonl>` |
| Report BE bulk scope | `npm run report:baby-names:be-eu-bulk-stats` |
| Scoped DELETE SQL | [`scripts/data/sql/belgium_eu_bulk_delete_for_replacement.sql`](./sql/belgium_eu_bulk_delete_for_replacement.sql) |

**Parallel pattern:** [`NETHERLANDS_REAL_SOURCE_WORKFLOW.md`](./NETHERLANDS_REAL_SOURCE_WORKFLOW.md) · **France:** [`FRANCE_REAL_SOURCE_WORKFLOW.md`](./FRANCE_REAL_SOURCE_WORKFLOW.md)
