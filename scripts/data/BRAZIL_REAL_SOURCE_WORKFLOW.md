# Brazil: IBGE-shaped intake → JSONL + staging replacement (planned)

**Language vs country:** Brazilian Portuguese is the dominant language in Brazil, but **`baby_names` rows are keyed by country and region**, not by UI language. **Brazil is not Portugal:** do not reuse Portugal (`EU`, `country = Portugal`, slug `eu-pt`, origin `Portugal (national statistics)`) batches, extractors, or scoped-delete SQL for Brazil.

| Dimension | Portugal (reference) | Brazil (this path) |
|-----------|----------------------|---------------------|
| `country` | `Portugal` | `Brazil` |
| `region` | `EU` | `LATIN_AMERICA` |
| Dataset slug (examples) | `eu-pt`, hybrid files | `latin-br-ibge` (or similar; **never** `eu-pt`) |
| National agency | INE PT / IRN hybrid | **IBGE** (Instituto Brasileiro de Geografia e Estatística) or other pinned civil-registry / naming statistic |
| Canonical CSV → JSONL | `adaptEuNationalCsvToJsonl.ts` (default `region: EU`) | Same adapter: **`--output-region LATIN_AMERICA`** + distinct `--slug` |

**Downstream:** unchanged — `importBabyNamesFromJsonl.ts` (same `BulkImportSourceRow` contract).

**Origin on import (from adapter):** `Brazil (national statistics)` when every canonical row has `country = Brazil`.

---

## 1. Expected raw file location (operator)

- **Pin vendor files** under `scripts/data/raw/downloads/` (gitignored; see that folder’s `.gitignore`). Example naming convention (adjust to the real IBGE export name once pinned):
  - `scripts/data/raw/downloads/ibge-nomes-{release-or-year}.csv` (or `.xlsx` if you map off-spreadsheet first).

**There is no committed Brazil government extract in-repo today** — first real intake is always a local/CI artifact until policy changes.

---

## 2. Source strategy (high level)

- **Primary direction:** IBGE public naming / civil-registration statistics (exact portal table, delimiter, and column names **TBD when the first file is pinned**).
- **Volume expectation:** Many national Brazil releases are **ranked or capped** (e.g. top names per year/sex), not a claimed complete long tail of every legal given name. Treat first real batches as **partial-volume, authentic tops** unless proven otherwise — same honesty as Spain INE “top-name depth” in the roadmap.
- **Production-ready:** Follow the checklist in [`SOURCE_TRUTH_AND_REFRESH.md`](./SOURCE_TRUTH_AND_REFRESH.md) (real extract, provenance, stable `external_id`, quality pass, refresh owner, legal/product). Until then: **staging / candidate only**.

---

## 2.1 Hybrid intake extractor (Top 150 + allowed-names PDF)

Portugal-style hybrid extraction is available for Brazil:

```bash
npm run extract:baby-names:br-hybrid-sources -- \
  --top-xlsx "scripts/data/raw/downloads/Names Brasil top 150.xlsx" \
  --pdf scripts/data/raw/downloads/brasil_allowed_names.pdf \
  --out scripts/data/raw/latin-br-hybrid-2024.canonical.csv \
  --year 2024
```

Behavior:

- Top 150 workbook entries are the ranking anchor (higher pseudo-count band).
- PDF entries fill long-tail coverage below Top 150.
- Dedupe is normalized `name|sex`; if a key exists in both, Top 150 wins.
- `count` values are deterministic rank-preserving synthetic values, **not real frequencies**.

---

## 3. Normalize → canonical CSV (same header as EU national path)

Target header (one row per name/year/sex slice):

`year,name,sex,count,country`

- `sex`: `M` / `F`
- `country`: must be **`Brazil`** for every row (matches `src/data/countries.ts` and deck weighting).

**Mapper:** add a small dedicated script (e.g. `mapIbgeBrazilToCanonicalCsv.ts`) **when** the raw IBGE column layout is pinned — not required to document this runbook. Until then, a one-off manual spreadsheet map is acceptable for a pilot batch.

---

## 4. Build JSONL (canonical → importer)

Use the **national CSV adapter** with explicit region (do **not** rely on default `EU`):

```bash
export BR_BATCH=external-latin-br-ibge-staging-YYYY

tsx scripts/adaptEuNationalCsvToJsonl.ts \
  --in scripts/data/raw/latin-br-ibge.canonical.csv \
  --out scripts/data/batches/${BR_BATCH}.v1.jsonl \
  --slug latin-br-ibge \
  --output-region LATIN_AMERICA \
  --top-per-year-sex 2000
```

- **`--slug`:** stable prefix inside `external_id`; keep **distinct from `eu-pt`** and from any EU market.
- **`--output-region LATIN_AMERICA`:** required for correct `baby_names.region` (see `adaptEuNationalCsvToJsonl.ts`).

Dry-run:

```bash
npm run import:baby-names -- --dry-run scripts/data/batches/${BR_BATCH}.v1.jsonl
```

More import contract detail: [`README.baby-name-import.md`](./README.baby-name-import.md).

---

## 5. Staging replacement (no mixing) — executable checklist

**Origin on import:** `Brazil (national statistics)` (from `adaptEuNationalCsvToJsonl.ts` when `country = Brazil`).

**Scoped replacement:** `country = 'Brazil'`, `region = 'LATIN_AMERICA'`, `coalesce(is_premium, false) = false`, `origin = 'Brazil (national statistics)'`.

Set **`BR_BATCH`** to your JSONL basename (no `.jsonl`), e.g. `export BR_BATCH=external-latin-br-hybrid-2024`.
Use **`Y`** from dry-run throughout.

1. **Confirm staging** — `.env` `EXPO_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` point at **staging**. The report script prints the Supabase host.
2. **Dry-run** — `npm run import:baby-names -- --dry-run scripts/data/batches/${BR_BATCH}.v1.jsonl` — record **`Y`** (for current batch: **6481**).
3. **Preflight** — `npm run report:baby-names:br-latam-bulk-stats` — note **`N_old`** and CASCADE (swipes/matches).
4. **SQL preflight** — [`scripts/data/sql/brazil_latam_bulk_delete_for_replacement.sql`](./sql/brazil_latam_bulk_delete_for_replacement.sql) — `SELECT count(*)` must equal **`N_old`**. **`Y`** need not equal **`N_old`**.
5. **Scoped DELETE** — Uncomment and run the `DELETE` (same `WHERE` as `SELECT`).
6. **Post-delete zero** — `SELECT count(*)` → **0**; `npm run report:baby-names:br-latam-bulk-stats` → **0**.
7. **Import** — `npm run import:baby-names -- scripts/data/batches/${BR_BATCH}.v1.jsonl`
8. **Post-import verify** — `SELECT count(*)` and report → both **`Y`**. **If counts ≠ `Y`, stop** before another bulk import.
9. **Mixing guardrail** — Do not import synthetic LATAM/Brazil staging bulk after the hybrid batch without repeating this DELETE scope first. Never import Portugal/EU files as Brazil.

---

## 6. Deck / supplement note

`PremiumContentService` **WORLDWIDE** supplement currently interleaves **US + EU** only. Meaningful **`LATIN_AMERICA`** bulk volume will not surface in WORLDWIDE-balanced decks until that client constant is extended — tracked in [`MARKET_COVERAGE_ROADMAP.md`](./MARKET_COVERAGE_ROADMAP.md). **EU-only** Brazil rows would be **incorrect**; this path always emits `LATIN_AMERICA`.

---

## 7. Related commands / files

| Step | Command / file |
|------|----------------|
| Canonical → JSONL | `tsx scripts/adaptEuNationalCsvToJsonl.ts` with `--output-region LATIN_AMERICA` |
| Report BR bulk scope | `npm run report:baby-names:br-latam-bulk-stats` → `scripts/reportBrazilLatamBulkImportStats.ts` |
| Scoped DELETE SQL | [`scripts/data/sql/brazil_latam_bulk_delete_for_replacement.sql`](./sql/brazil_latam_bulk_delete_for_replacement.sql) |
| Portugal (wrong tool for Brazil) | [`PORTUGAL_REAL_SOURCE_WORKFLOW.md`](./PORTUGAL_REAL_SOURCE_WORKFLOW.md) |
| Source matrix | [`SOURCE_TRUTH_AND_REFRESH.md`](./SOURCE_TRUTH_AND_REFRESH.md) |
| Roadmap | [`MARKET_COVERAGE_ROADMAP.md`](./MARKET_COVERAGE_ROADMAP.md) |

**Parallel patterns:** [`PORTUGAL_REAL_SOURCE_WORKFLOW.md`](./PORTUGAL_REAL_SOURCE_WORKFLOW.md) (hybrid EU) · [`SPAIN_REAL_SOURCE_WORKFLOW.md`](./SPAIN_REAL_SOURCE_WORKFLOW.md) (top-name depth honesty)
