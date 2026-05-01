# Portugal: hybrid intake → JSONL + staging replacement (no mixing)

**Not Brazil:** Portuguese language in the app also serves Brazil, but **Brazil** uses `country = Brazil`, `region = LATIN_AMERICA`, and a **separate** slug/runbook — [`BRAZIL_REAL_SOURCE_WORKFLOW.md`](./BRAZIL_REAL_SOURCE_WORKFLOW.md). Never import Portugal batches as a stand-in for Brazilian naming data.

**Downstream:** unchanged — `adaptEuNationalCsvToJsonl.ts` (`--slug eu-pt`) → `importBabyNamesFromJsonl.ts`.

**Origin on import:** `Portugal (national statistics)` (same for synthetic staging JSONL from `adaptEuNationalCsvToJsonl` and hybrid / real-backed JSONL).

**Scoped replacement:** `country = 'Portugal'`, `region = 'EU'`, `coalesce(is_premium, false) = false`, `origin = 'Portugal (national statistics)'` — see SQL + report below.

**Hybrid context:** Top 150 workbook = ranking anchor; IRN allowed-names PDF = long-tail; **pseudo-counts** preserve ordering only, not real frequencies.

---

## 1. Build hybrid canonical CSV → JSONL

Set **`PT_BATCH`** to your JSONL basename (no `.jsonl`), e.g. `export PT_BATCH=external-eu-pt-hybrid-2024`.

1. Extract hybrid canonical CSV:

```bash
npm run extract:baby-names:pt-hybrid-sources -- \
  --top-xlsx "scripts/data/raw/downloads/Names Portugal top 150.xlsx" \
  --pdf scripts/data/raw/downloads/portugal_allowed_names.pdf \
  --out scripts/data/raw/eu-pt-hybrid-2024.canonical.csv \
  --year 2024
```

2. Build JSONL (match **`PT_BATCH`** to `--out`):

```bash
tsx scripts/adaptEuNationalCsvToJsonl.ts \
  --in scripts/data/raw/eu-pt-hybrid-2024.canonical.csv \
  --out scripts/data/batches/${PT_BATCH}.v1.jsonl \
  --slug eu-pt \
  --top-per-year-sex 20000
```

3. Dry-run — record **`Y`** valid rows (e.g. **6474** after importer quality gates):

```bash
npm run import:baby-names -- --dry-run scripts/data/batches/${PT_BATCH}.v1.jsonl
```

More detail: [`README.baby-name-import.md`](./README.baby-name-import.md) (Portugal hybrid section).

---

## 2. Why upsert alone is unsafe

Imports **upsert on `id`**. Old synthetic-only rows **remain** unless deleted. See [`SPAIN_REAL_SOURCE_WORKFLOW.md`](./SPAIN_REAL_SOURCE_WORKFLOW.md) §6 and [`FRANCE_REAL_SOURCE_WORKFLOW.md`](./FRANCE_REAL_SOURCE_WORKFLOW.md).

---

## 3. Staging execution checklist (copy-paste order)

Use **`PT_BATCH`** and **`Y`** from §1 throughout.

1. **Confirm staging** — `.env` `EXPO_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` point at **staging**. The report script prints the Supabase host.
2. **Dry-run** — `npm run import:baby-names -- --dry-run scripts/data/batches/${PT_BATCH}.v1.jsonl` — record **`Y`**.
3. **Preflight** — `npm run report:baby-names:pt-eu-bulk-stats` — note **`N_old`** and CASCADE (swipes/matches).
4. **SQL preflight** — [`scripts/data/sql/portugal_eu_bulk_delete_for_replacement.sql`](./sql/portugal_eu_bulk_delete_for_replacement.sql) — `SELECT count(*)` must equal **`N_old`**. **`Y`** need not equal **`N_old`**.
5. **Scoped DELETE** — Uncomment and run the `DELETE` (same `WHERE` as `SELECT`).
6. **Post-delete zero** — `SELECT count(*)` → **0**; `npm run report:baby-names:pt-eu-bulk-stats` → **0**.
7. **Import** — `npm run import:baby-names -- scripts/data/batches/${PT_BATCH}.v1.jsonl`
8. **Post-import verify** — `SELECT count(*)` and report → both **`Y`**. **If counts ≠ `Y`, stop** before another bulk import.
9. **Mixing guardrail** — Do not import synthetic `external-eu-pt-ine.v1.jsonl` bulk after the hybrid batch without repeating the DELETE scope first.

---

## 4. Related commands

| Step | Command / file |
|------|----------------|
| Hybrid → canonical | `npm run extract:baby-names:pt-hybrid-sources` → `scripts/extractPortugalHybridSourcesToCanonicalCsv.ts` |
| Report PT bulk scope | `npm run report:baby-names:pt-eu-bulk-stats` → `scripts/reportPortugalEuBulkImportStats.ts` |
| Scoped DELETE SQL | [`scripts/data/sql/portugal_eu_bulk_delete_for_replacement.sql`](./sql/portugal_eu_bulk_delete_for_replacement.sql) |
| Import contract | [`README.baby-name-import.md`](./README.baby-name-import.md) |

**Parallel patterns:** [`FRANCE_REAL_SOURCE_WORKFLOW.md`](./FRANCE_REAL_SOURCE_WORKFLOW.md) · [`ITALY_REAL_SOURCE_WORKFLOW.md`](./ITALY_REAL_SOURCE_WORKFLOW.md)
