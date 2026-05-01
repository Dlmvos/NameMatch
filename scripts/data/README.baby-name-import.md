# Baby Name JSONL Import Batches

This folder defines the repeatable path for importing larger `baby_names` datasets.

**Market / language coverage plan:** see [`MARKET_COVERAGE_ROADMAP.md`](./MARKET_COVERAGE_ROADMAP.md) (adapter roadmap, batch naming, ingestion checklist).

**Synthetic vs real data and production readiness:** see [`SOURCE_TRUTH_AND_REFRESH.md`](./SOURCE_TRUTH_AND_REFRESH.md). Committed EU `*.v1.csv` files produced by `emitEuNationalStagingRawCsv.ts` are **synthetic staging** (embedded seeds), not national agency extracts—replace with **real** downloads per that doc before treating a market as production-authentic.

## Accepted source format (one JSON object per line)

Required fields:
- `external_id` (string, stable business key per source row)
- `name` (string)
- `gender` (string; aliases normalized by importer)
- `region` (string; aliases normalized by importer)

Optional fields:
- `origin` (string or null)
- `meaning` (string or null)
- `country` (string or null)
- `is_worldwide` (boolean, default `false`)
- `is_premium` (boolean, default `false`)
- `popularity_rank` (integer `1..1000000` or `null`)
- `trend` (accepted, currently dropped because DB has no column yet)

Validation/normalization is centralized in:
- `scripts/lib/bulkBabyNameImport.ts`

## First larger batch (safe starter)

Generate a deterministic starter batch from curated legacy seed names:

```bash
npm run build:baby-names:first-batch
```

Default output:
- `scripts/data/batches/first-real-batch.v1.jsonl`

You can override output and size:

```bash
tsx scripts/buildFirstRealImportBatch.ts --limit 200 --out scripts/data/batches/first-real-batch.v1.jsonl
```

## First external-source adapter (US SSA-style CSV)

Raw sample source file:
- `scripts/data/raw/us-ssa-sample.csv`

Adapter script:
- `scripts/adaptSsaUsCsvToJsonl.ts`

Expected CSV columns:
- `year,name,sex,count`

Build normalized JSONL:

```bash
npm run adapt:baby-names:ssa-sample
```

Default output:
- `scripts/data/batches/external-us-ssa-sample.v1.jsonl`

Override input/output:

```bash
tsx scripts/adaptSsaUsCsvToJsonl.ts \
  --in scripts/data/raw/us-ssa-sample.csv \
  --out scripts/data/batches/external-us-ssa-sample.v1.jsonl
```

### First meaningful external starter batch (~600 rows)

Target: **three SSA years (2021–2023) × 100 names per sex** (~600 `baby_names` rows), committed as normalized JSONL, without checking in national `yob*.txt` dumps.

1) Regenerate curated raw CSV + JSONL (deterministic; uses `scripts/embed/usSsaStarterSeed.ts`):

```bash
npm run build:baby-names:ssa-starter-v1
```

Artifacts:
- `scripts/data/raw/us-ssa-starter-v1.csv` (header `year,name,sex,count`)
- `scripts/data/batches/external-us-ssa-starter.v1.jsonl`

2) Dry-run / import that batch like any other JSONL (same CLI as below).

### Official SSA national files (local only; not committed)

Download `names.zip` from the SSA baby names site, extract `yobYYYY.txt` into `scripts/data/raw/downloads/` (that folder is ignored by git).

Each line: `Name,Letter,count` (no header, no year column). Smoke-test fixture (3 lines): `scripts/data/raw/yob2023.tiny.fixture.txt`.

### First larger real external batch (dev / staging, low thousands)

**Target:** one national SSA year from real `yobYYYY.txt`, **top 1200 names per sex** (M + F) → **up to 2400** normalized rows — enough to stress the capped public deck supplement (~400–500) and imports, without committing raw SSA dumps.

**Convention:** `scripts/data/batches/external-us-ssa-yob-{YEAR}-top{N}.v1.jsonl` (generated locally; git may ignore or commit JSONL per team policy).

1. Download SSA [`names.zip`](https://www.ssa.gov/oact/babynames/names.zip), extract `yob2023.txt` (or another year), copy to:
   - `scripts/data/raw/downloads/yob2023.txt` (gitignored directory)
2. Build JSONL:

```bash
npm run build:baby-names:ssa-yob-staging-v1
```

Same as:

```bash
tsx scripts/buildSsaYobStagingBatch.ts
# optional: --year 2022 --top 1000 --in path/to/yob2022.txt --out path/to/custom.jsonl
```

3. Validate:

```bash
npm run import:baby-names -- --dry-run scripts/data/batches/external-us-ssa-yob-2023-top1200.v1.jsonl
```

**Adapter-only equivalent** (no prereq check):

```bash
tsx scripts/adaptSsaUsCsvToJsonl.ts \
  --ssa-yob --year 2023 \
  --in scripts/data/raw/downloads/yob2023.txt \
  --top-per-year-sex 1200 \
  --out scripts/data/batches/external-us-ssa-yob-2023-top1200.v1.jsonl
```

Smoke-test input (3 lines, not a real batch): `scripts/data/raw/yob2023.tiny.fixture.txt`

## Second external adapter (EU national CSV — non-US)

**Why:** The public deck supplement filters by profile region (e.g. `EU` or `WORLDWIDE`). US-only imports do not surface for **EU** users; this path emits **`region: EU`** rows by default with a **`country`** label so staging can validate multi-region supplements. For **Brazil** (`LATIN_AMERICA`), pass **`--output-region LATIN_AMERICA`** — see [`BRAZIL_REAL_SOURCE_WORKFLOW.md`](./BRAZIL_REAL_SOURCE_WORKFLOW.md) (do not reuse Portugal `eu-pt` batches).

**Canonical CSV columns** (header row):

- `year,name,sex,count,country`
- `sex`: `M` / `F` → `boy` / `girl`
- `country`: stored on `baby_names.country` (e.g. `France`, `Germany`)

National open data (INSEE, ONS, Destatis, etc.) usually needs a one-off column map into this shape — keep large vendor files in `scripts/data/raw/downloads/` (gitignored) and commit only small samples if desired.

Adapter:

- `scripts/adaptEuNationalCsvToJsonl.ts`

Committed sample source + normalized output:

- `scripts/data/raw/eu-fr-sample.csv` (illustrative counts; not official INSEE figures)
- `scripts/data/batches/external-eu-fr-sample.v1.jsonl` (regenerate with the command below)

Build / refresh JSONL:

```bash
npm run adapt:baby-names:eu-fr-sample
```

Override paths / dataset slug:

```bash
tsx scripts/adaptEuNationalCsvToJsonl.ts \
  --in scripts/data/raw/eu-fr-sample.csv \
  --out scripts/data/batches/external-eu-fr-sample.v1.jsonl \
  --slug eu-fr
```

Same optional caps as the SSA CSV path: `--year-min`, `--year-max`, `--top-per-year-sex N` (slice is per **year + sex + country**). Optional **`--output-region`** (default `EU`): use `LATIN_AMERICA` for Brazil canonical files.

### France (INSEE real national CSV — intake)

INSEE publishes the **Fichier des prénoms** (national given names, nationwide, with counts by sex and birth year). Official files are large — keep downloads under `scripts/data/raw/downloads/` (gitignored).

**Expected raw columns** (typical `nat*.csv`; delimiter `;` or `,`):

- `sexe` — `1` = garçon → `M`, `2` = fille → `F`
- `preusuel` — first name (aggregate labels such as `_PRENOMS_RARES` are skipped)
- `annais` — birth year
- `nombre` or `valeur` — count (INSEE may round to multiples of 5 in some releases)

Mapper (canonical `year,name,sex,count,country` with `country = France`):

```bash
npm run map:baby-names:fr-insee-to-canonical -- \
  --in scripts/data/raw/downloads/nat2022.csv \
  --out scripts/data/raw/eu-fr-insee.real.canonical.csv \
  --year-min 2020 \
  --year-max 2023
```

Illustrative **shape-only** smoke file (not official INSEE data): `scripts/data/raw/insee-fr-shaped.example.csv`.

Then adapt (unchanged EU pipeline):

```bash
tsx scripts/adaptEuNationalCsvToJsonl.ts \
  --in scripts/data/raw/eu-fr-insee.real.canonical.csv \
  --out scripts/data/batches/external-eu-fr-insee-real-2020-2023.v1.jsonl \
  --slug eu-fr \
  --top-per-year-sex 1200
```

Operational notes, **staging scoped DELETE + report** (synthetic → real INSEE, no mixing): [`FRANCE_REAL_SOURCE_WORKFLOW.md`](./FRANCE_REAL_SOURCE_WORKFLOW.md).

### Netherlands (NL / CBS-shaped sample)

Same canonical CSV and `adaptEuNationalCsvToJsonl.ts`. **Market:** ISO NL; sample uses `country` = `Netherlands` (full label on `baby_names.country`; switch to `NL` if your DB convention is ISO-only). Counts are illustrative, not official CBS figures.

- Raw: `scripts/data/raw/eu-nl-cbs-sample.csv`
- JSONL (roadmap name `external-eu-nl-{source}.v1.jsonl`): `scripts/data/batches/external-eu-nl-cbs-sample.v1.jsonl`

```bash
npm run adapt:baby-names:eu-nl-sample
```

Equivalent:

```bash
tsx scripts/adaptEuNationalCsvToJsonl.ts \
  --in scripts/data/raw/eu-nl-cbs-sample.csv \
  --out scripts/data/batches/external-eu-nl-cbs-sample.v1.jsonl \
  --slug eu-nl
```

### Netherlands curated workbook (manual `.xlsx`)

For a **manually curated** workbook (e.g. `scripts/data/raw/downloads/Names 2024 Netherlands.xlsx`) with sheets **Jongensnamen YYYY** / **Meisjesnamen YYYY** and columns **Naam** + **Aantal**:

```bash
npm run extract:baby-names:nl-workbook-xlsx -- \
  --in "scripts/data/raw/downloads/Names 2024 Netherlands.xlsx" \
  --out scripts/data/raw/eu-nl-workbook-2024.canonical.csv \
  --year 2024
```

Then adapt (same EU pipeline):

```bash
tsx scripts/adaptEuNationalCsvToJsonl.ts \
  --in scripts/data/raw/eu-nl-workbook-2024.canonical.csv \
  --out scripts/data/batches/external-eu-nl-workbook-2024.v1.jsonl \
  --slug eu-nl \
  --top-per-year-sex 1200
```

If **Aantal** is missing, the extractor applies a **documented** descending pseudo-count so ordering still maps to popularity in `adaptEuNationalCsvToJsonl.ts`.

**Replacing synthetic NL bulk in staging with this batch** (scoped DELETE, no mixing): [`NETHERLANDS_REAL_SOURCE_WORKFLOW.md`](./NETHERLANDS_REAL_SOURCE_WORKFLOW.md).

### Germany (DE / Destatis-shaped sample)

Same canonical CSV and `adaptEuNationalCsvToJsonl.ts`. **Market:** ISO DE; sample uses `country` = `Germany`. Counts are illustrative, not official Destatis figures.

- Raw: `scripts/data/raw/eu-de-destatis-sample.csv`
- JSONL: `scripts/data/batches/external-eu-de-destatis-sample.v1.jsonl`

```bash
npm run adapt:baby-names:eu-de-sample
```

Equivalent:

```bash
tsx scripts/adaptEuNationalCsvToJsonl.ts \
  --in scripts/data/raw/eu-de-destatis-sample.csv \
  --out scripts/data/batches/external-eu-de-destatis-sample.v1.jsonl \
  --slug eu-de
```

### Germany (DE / ranked top-name workbook `.xlsx`)

Two sheets (titles contain **`boy`** / **`girl`**), columns **Ranking** + **Name**, optional count column. **Year** is chosen via CLI (single reference year on every row). If counts are missing, the extractor applies **documented rank-preserving pseudo-counts** (not real frequencies).

```bash
npm run extract:baby-names:de-workbook-xlsx -- \
  --in "scripts/data/raw/downloads/Names Germany 2020 -2025 top 1400.xlsx" \
  --out scripts/data/raw/eu-de-workbook-2024.canonical.csv \
  --year 2024
```

Then adapt (same EU pipeline; match `--top-per-year-sex` to list depth):

```bash
tsx scripts/adaptEuNationalCsvToJsonl.ts \
  --in scripts/data/raw/eu-de-workbook-2024.canonical.csv \
  --out scripts/data/batches/external-eu-de-workbook-2024.v1.jsonl \
  --slug eu-de \
  --top-per-year-sex 1400
```

**Staging replacement** after import: [`GERMANY_REAL_SOURCE_WORKFLOW.md`](./GERMANY_REAL_SOURCE_WORKFLOW.md).

### Germany (DE — real national extract / staging replacement)

**Synthetic vs real:** Default committed `eu-de-destatis*.csv` / `external-eu-de-destatis.v1.jsonl` paths are **synthetic staging** from `emitEuNationalStagingRawCsv.ts`, not Destatis agency figures.

**Target real source:** **Destatis** (or another pinned German national statistic), or a **ranked top-name workbook** via `extractGermanyWorkbookToCanonicalCsv.ts`. Raw vendor files belong in **`scripts/data/raw/downloads/`** (gitignored). **Tabular Destatis** files still need a pinned column map (hand step or future `mapDestatisGermanyToCanonicalCsv.ts`) before `adaptEuNationalCsvToJsonl`.

**Volume:** Expect a **top-N per year + sex** slice for deck/import stress unless product requires full long-tail; document actual coverage when the source file is pinned.

**Clean swap (do not mix synthetic + real bulk in the same environment without DELETE):** full checklist, scoped SQL, and pre-delete report in [`GERMANY_REAL_SOURCE_WORKFLOW.md`](./GERMANY_REAL_SOURCE_WORKFLOW.md).

### Spain (ES / INE-shaped sample)

Same canonical CSV and `adaptEuNationalCsvToJsonl.ts`. **Market:** ISO ES; sample uses `country` = `Spain`. Counts are illustrative, not official INE figures. **Production:** swap in a real INE (or licensed) extract via `scripts/data/raw/downloads/` and update [`SOURCE_TRUTH_AND_REFRESH.md`](./SOURCE_TRUTH_AND_REFRESH.md)—do not tune the deck to “fix” synthetic lists.

- Raw: `scripts/data/raw/eu-es-ine-sample.csv`
- JSONL: `scripts/data/batches/external-eu-es-ine-sample.v1.jsonl`

```bash
npm run adapt:baby-names:eu-es-sample
```

Equivalent:

```bash
tsx scripts/adaptEuNationalCsvToJsonl.ts \
  --in scripts/data/raw/eu-es-ine-sample.csv \
  --out scripts/data/batches/external-eu-es-ine-sample.v1.jsonl \
  --slug eu-es
```

### Spain (INE **real** national extract — replacement path)

Full runbook: [`SPAIN_REAL_SOURCE_WORKFLOW.md`](./SPAIN_REAL_SOURCE_WORKFLOW.md).

1. Save the INE download under `scripts/data/raw/downloads/` (gitignored).
2. Map to canonical EU CSV: `npm run map:baby-names:es-ine-to-canonical -- --in <ine-file.csv> --out scripts/data/raw/eu-es-ine.real.canonical.csv --country Spain`
3. Build JSONL with the same EU adapter: `tsx scripts/adaptEuNationalCsvToJsonl.ts --in scripts/data/raw/eu-es-ine.real.canonical.csv --out scripts/data/batches/external-eu-es-ine-real-<year>.v1.jsonl --slug eu-es --top-per-year-sex 1200`
4. `npm run import:baby-names -- --dry-run …` then import staging.

**Avoid mixing synthetic + real Spain in one DB:** before loading real INE JSONL in an environment that already has bulk Spain rows, follow [§6 in `SPAIN_REAL_SOURCE_WORKFLOW.md`](./SPAIN_REAL_SOURCE_WORKFLOW.md#6-clean-replacement-do-not-mix-synthetic-and-real-spain-in-the-same-environment) (scoped `DELETE`, then import).

Illustrative INE-shaped smoke file (not official data): `scripts/data/raw/ine-es-shaped.example.csv`.

### Italy (IT / ISTAT-shaped staging v1)

Same canonical CSV and `adaptEuNationalCsvToJsonl.ts`. **Market:** ISO IT; staging uses `country` = `Italy`. Counts are illustrative curated staging, not official ISTAT extracts.

- Raw: `scripts/data/raw/eu-it-istat.v1.csv`
- JSONL: `scripts/data/batches/external-eu-it-istat.v1.jsonl`

```bash
npm run build:baby-names:eu-it-istat-v1
```

Equivalent:

```bash
tsx scripts/emitEuNationalStagingRawCsv.ts --market it
tsx scripts/adaptEuNationalCsvToJsonl.ts \
  --in scripts/data/raw/eu-it-istat.v1.csv \
  --out scripts/data/batches/external-eu-it-istat.v1.jsonl \
  --slug eu-it
```

### Italy (IT — ISTAT real national extract / staging replacement)

**Synthetic vs real:** Default `eu-it-istat.v1.csv` / `external-eu-it-istat.v1.jsonl` are **synthetic staging** from embedded seeds, not ISTAT agency figures.

**Target real source:** **ISTAT** (or another pinned open/licensed Italian national naming statistic). Raw files belong in **`scripts/data/raw/downloads/`** (gitignored). Map to canonical `year,name,sex,count,country` with **`country = Italy`** (hand step or add `mapIstatItalyToCanonicalCsv.ts` once the extract’s columns are stable), then:

```bash
tsx scripts/adaptEuNationalCsvToJsonl.ts \
  --in scripts/data/raw/eu-it-istat.real.canonical.csv \
  --out scripts/data/batches/external-eu-it-istat-real-<variant>.v1.jsonl \
  --slug eu-it \
  --top-per-year-sex 1200
```

**Staging swap (no mixing synthetic + real bulk):** [`ITALY_REAL_SOURCE_WORKFLOW.md`](./ITALY_REAL_SOURCE_WORKFLOW.md) (`report:baby-names:it-eu-bulk-stats`, scoped SQL).

### Italy (IT — Wikipedia + ISTAT Top 200 workbook `.xlsx`)

Sheets **`Italian wikipedia names A-L`** / **`Italian wikipedia names M-Z`** (Maschile / Femminile) plus **`Popular 2024 Names ISTAT`** (alternating rank/name rows). **ISTAT layer outranks** Wikipedia tail via documented **pseudo-counts**; **ISTAT wins** on name+sex dedupe. See script header in `extractItalyWorkbookToCanonicalCsv.ts`.

```bash
npm run extract:baby-names:it-workbook-xlsx -- \
  --in "scripts/data/raw/downloads/Names Italy wikipedia + top 200 ISTAT.xlsx" \
  --out scripts/data/raw/eu-it-workbook-2024.canonical.csv \
  --year 2024
```

Then adapt (use `--top-per-year-sex` ≥ merged row count from dry-run, often **8000**):

```bash
tsx scripts/adaptEuNationalCsvToJsonl.ts \
  --in scripts/data/raw/eu-it-workbook-2024.canonical.csv \
  --out scripts/data/batches/external-eu-it-workbook-2024.v1.jsonl \
  --slug eu-it \
  --top-per-year-sex 8000
```

**Staging swap:** [`ITALY_REAL_SOURCE_WORKFLOW.md`](./ITALY_REAL_SOURCE_WORKFLOW.md).

`npm run emit:baby-names:eu-national-v1` writes every configured EU staging raw CSV (NL, DE, ES, FR, IT, PT); `npm run build:baby-names:eu-national-v1` rebuilds **all** matching JSONLs.

### Portugal (PT / Statistics Portugal–INE staging v1)

Same canonical CSV and `adaptEuNationalCsvToJsonl.ts`. **Market:** ISO PT; staging uses `country` = `Portugal`. Source slug `ine` here is **Portugal’s INE** (Instituto Nacional de Estatística), distinct from Spain’s `eu-es-ine` batch.

- Raw: `scripts/data/raw/eu-pt-ine.v1.csv`
- JSONL: `scripts/data/batches/external-eu-pt-ine.v1.jsonl`

```bash
npm run build:baby-names:eu-pt-ine-v1
```

Equivalent:

```bash
tsx scripts/emitEuNationalStagingRawCsv.ts --market pt
tsx scripts/adaptEuNationalCsvToJsonl.ts \
  --in scripts/data/raw/eu-pt-ine.v1.csv \
  --out scripts/data/batches/external-eu-pt-ine.v1.jsonl \
  --slug eu-pt
```

### Portugal (PT — Top 150 workbook + IRN allowed-names PDF hybrid)

**Top 150** (`Names Portugal top 150.xlsx`, sheet `Top names 5 year trend`) supplies the **ranked anchor**; **IRN PDF** (`portugal_allowed_names.pdf`) supplies the **long-tail allowlist** (lines `Femininos <name>  Masculinos <name>`). **Top 150 wins** on name+sex dedupe. Counts are **pseudo** (ordering only). Requires devDependency **`pdf-parse`**.

```bash
npm run extract:baby-names:pt-hybrid-sources -- \
  --top-xlsx "scripts/data/raw/downloads/Names Portugal top 150.xlsx" \
  --pdf scripts/data/raw/downloads/portugal_allowed_names.pdf \
  --out scripts/data/raw/eu-pt-hybrid-2024.canonical.csv \
  --year 2024
```

Then adapt (raise `--top-per-year-sex` per dry-run row count, often **20000**):

```bash
tsx scripts/adaptEuNationalCsvToJsonl.ts \
  --in scripts/data/raw/eu-pt-hybrid-2024.canonical.csv \
  --out scripts/data/batches/external-eu-pt-hybrid-2024.v1.jsonl \
  --slug eu-pt \
  --top-per-year-sex 20000
```

**Staging swap (synthetic → hybrid, no mixing):** [`PORTUGAL_REAL_SOURCE_WORKFLOW.md`](./PORTUGAL_REAL_SOURCE_WORKFLOW.md) (`report:baby-names:pt-eu-bulk-stats`, scoped SQL).

### Brazil (BR — IBGE-shaped canonical CSV, `LATIN_AMERICA`)

**Separate from Portugal:** same canonical header (`year,name,sex,count,country`) but every row must have **`country = Brazil`**, JSONL **`region = LATIN_AMERICA`**, and a **non-`eu-pt` slug** (e.g. `latin-br-ibge`). Portuguese UI language does **not** imply EU region or Portugal rows.

Pin IBGE (or other official) raw files under `scripts/data/raw/downloads/`, map to canonical CSV, then:

```bash
tsx scripts/adaptEuNationalCsvToJsonl.ts \
  --in scripts/data/raw/latin-br-ibge.canonical.csv \
  --out scripts/data/batches/external-latin-br-ibge-staging.v1.jsonl \
  --slug latin-br-ibge \
  --output-region LATIN_AMERICA \
  --top-per-year-sex 2000
```

Operational path, volume expectations, and future scoped delete: [`BRAZIL_REAL_SOURCE_WORKFLOW.md`](./BRAZIL_REAL_SOURCE_WORKFLOW.md).

Optional year filters (CSV with `year` column only):

```bash
tsx scripts/adaptSsaUsCsvToJsonl.ts \
  --in scripts/data/raw/us-ssa-starter-v1.csv \
  --year-min 2022 --year-max 2023 \
  --top-per-year-sex 50 \
  --out scripts/data/batches/external-us-ssa-trimmed.v1.jsonl
```

## Import workflow (repeatable)

1) Generate or stage JSONL batch in `scripts/data/batches/`
2) Dry-run:

```bash
npm run import:baby-names -- --dry-run scripts/data/batches/first-real-batch.v1.jsonl
npm run import:baby-names -- --dry-run scripts/data/batches/external-us-ssa-starter.v1.jsonl
npm run import:baby-names -- --dry-run scripts/data/batches/external-eu-fr-sample.v1.jsonl
npm run import:baby-names -- --dry-run scripts/data/batches/external-eu-nl-cbs-sample.v1.jsonl
npm run import:baby-names -- --dry-run scripts/data/batches/external-eu-de-destatis-sample.v1.jsonl
npm run import:baby-names -- --dry-run scripts/data/batches/external-eu-es-ine-sample.v1.jsonl
```

3) Import:

```bash
npm run import:baby-names -- scripts/data/batches/first-real-batch.v1.jsonl
npm run import:baby-names -- scripts/data/batches/external-us-ssa-starter.v1.jsonl
npm run import:baby-names -- scripts/data/batches/external-eu-fr-sample.v1.jsonl
npm run import:baby-names -- scripts/data/batches/external-eu-nl-cbs-sample.v1.jsonl
npm run import:baby-names -- scripts/data/batches/external-eu-de-destatis-sample.v1.jsonl
npm run import:baby-names -- scripts/data/batches/external-eu-es-ine-sample.v1.jsonl
```

## Notes for scaling toward 30k+

- Keep raw supplier files outside the app runtime code path.
- Convert to JSONL in a deterministic preprocessing step.
- Keep `external_id` stable across reruns for idempotent upserts.
- Import in batches via existing CLI (`BATCH_SIZE = 500`).
