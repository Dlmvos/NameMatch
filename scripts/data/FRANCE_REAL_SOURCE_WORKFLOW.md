# France: INSEE Fichier des prénoms → canonical CSV → JSONL (real intake + staging replacement)

**Downstream:** unchanged — `adaptEuNationalCsvToJsonl.ts` (`--slug eu-fr`) → `importBabyNamesFromJsonl.ts`.

**Origin on import:** `France (national statistics)` (same for synthetic staging JSONL from `adaptEuNationalCsvToJsonl` and real INSEE-backed JSONL).

**Scoped replacement:** `country = 'France'`, `region = 'EU'`, `coalesce(is_premium, false) = false`, `origin = 'France (national statistics)'` — see SQL + report below.

---

## 1. Expected raw file (INSEE)

- **Source:** INSEE *Fichier des prénoms* (national file, e.g. `natYYYY.csv` inside a published zip — exact filename varies by vintage). Mirror on [data.gouv.fr](https://www.data.gouv.fr/) or [insee.fr](https://www.insee.fr/).
- **Location:** `scripts/data/raw/downloads/` (gitignored). Record URL, retrieval date, and file vintage in your PR or internal log.
- **Typical columns:** `sexe`, `preusuel`, `annais`, `nombre` (sometimes `valeur` instead of `nombre`). Separator is often **`;`**. UTF-8 with optional BOM.
- **Volume:** Full national files are **large**. Use `--year-min` / `--year-max` on the mapper and `--top-per-year-sex` on the adapter to cap what you import for staging (e.g. a batch of **9591** valid rows after dry-run).

---

## 2. Canonical CSV → JSONL

Set **`FR_BATCH`** once to the JSONL basename (no extension), matching the file you pass to `--out` in step 2, e.g. `export FR_BATCH=external-eu-fr-insee-real-2020-2023`.

1. Map INSEE CSV → canonical:

```bash
npm run map:baby-names:fr-insee-to-canonical -- \
  --in scripts/data/raw/downloads/<your-nat-file>.csv \
  --out scripts/data/raw/eu-fr-insee.real.canonical.csv \
  --year-min 2020 \
  --year-max 2023
```

2. Build JSONL (set output basename consistently with **`FR_BATCH`** in §4):

```bash
tsx scripts/adaptEuNationalCsvToJsonl.ts \
  --in scripts/data/raw/eu-fr-insee.real.canonical.csv \
  --out scripts/data/batches/external-eu-fr-insee-real-<variant>.v1.jsonl \
  --slug eu-fr \
  --top-per-year-sex 1200
```

3. Dry-run — record **`Y`** valid rows:

```bash
npm run import:baby-names -- --dry-run scripts/data/batches/${FR_BATCH}.v1.jsonl
```

---

## 3. Why upsert alone is unsafe

Imports **upsert on `id`** from deterministic `external_id`. Rows present only in the old synthetic batch **remain** unless deleted. See [`SPAIN_REAL_SOURCE_WORKFLOW.md`](./SPAIN_REAL_SOURCE_WORKFLOW.md) §6 for the mixing guardrail (same pattern as [`GERMANY_REAL_SOURCE_WORKFLOW.md`](./GERMANY_REAL_SOURCE_WORKFLOW.md)).

---

## 4. Staging execution checklist (copy-paste order)

Use **`FR_BATCH`** (set in §2) and **`Y`** from the §2 dry-run throughout.

1. **Confirm staging** — `.env` `EXPO_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` point at **staging**. The report script prints the Supabase host.
2. **Dry-run** — `npm run import:baby-names -- --dry-run scripts/data/batches/${FR_BATCH}.v1.jsonl` — record **`Y`** (`Parsed … → Y valid rows`, e.g. 9591).
3. **Preflight** — `npm run report:baby-names:fr-eu-bulk-stats` — note France EU bulk candidate count **`N_old`** and CASCADE (swipes/matches).
4. **SQL preflight** — In Supabase SQL (staging), run the `SELECT count(*)` in [`scripts/data/sql/france_eu_bulk_delete_for_replacement.sql`](./sql/france_eu_bulk_delete_for_replacement.sql); result must equal **`N_old`**. **`Y`** does **not** need to equal **`N_old`**.
5. **Scoped DELETE** — Uncomment and run the `DELETE` in that file (same `WHERE` as the `SELECT`).
6. **Post-delete zero** — `SELECT count(*)` again → **0**. `npm run report:baby-names:fr-eu-bulk-stats` → **0** candidates.
7. **Import real batch** — `npm run import:baby-names -- scripts/data/batches/${FR_BATCH}.v1.jsonl`
8. **Post-import verify** — Same `SELECT count(*)` → must equal **`Y`**. `npm run report:baby-names:fr-eu-bulk-stats` → must equal **`Y`**. **If counts disagree with `Y`, stop** before layering another bulk import.
9. **Mixing guardrail** — Do not import synthetic `external-eu-fr-insee.v1.jsonl` bulk after the real batch without repeating the DELETE scope first.

---

## 5. Related commands

| Step | Command / file |
|------|----------------|
| INSEE → canonical | `npm run map:baby-names:fr-insee-to-canonical` → `scripts/mapInseeFranceToCanonicalCsv.ts` |
| Report FR bulk scope | `npm run report:baby-names:fr-eu-bulk-stats` → `scripts/reportFranceEuBulkImportStats.ts` |
| Scoped DELETE SQL | [`scripts/data/sql/france_eu_bulk_delete_for_replacement.sql`](./sql/france_eu_bulk_delete_for_replacement.sql) |
| Import contract | [`README.baby-name-import.md`](./README.baby-name-import.md) |
