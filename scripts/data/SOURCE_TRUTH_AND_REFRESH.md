# Source truth, refresh, and production readiness (public `baby_names`)

This document is the **operational contract** for non-premium bulk data: what is **synthetic**, what is **real**, how to **refresh**, and when a market is **safe for production**. It complements the adapter inventory in [`MARKET_COVERAGE_ROADMAP.md`](./MARKET_COVERAGE_ROADMAP.md) and the CLI steps in [`README.baby-name-import.md`](./README.baby-name-import.md).

**Product direction:** Do not tune deck weighting to compensate for synthetic national lists. Replace markets with **country-native authoritative (or licensed) sources** and repeatable refreshes.

---

## Definitions

| Term | Meaning |
|------|---------|
| **Synthetic staging** | Rows generated or curated in-repo (e.g. embedded seed lists) to exercise adapters, imports, and deck caps. **Not** a claim about real-world popularity or naming culture. |
| **Illustrative sample** | Small committed CSV/JSONL shaped like a national file (often hand-sized). Useful for CI and docs; still **not** national statistics unless labeled otherwise. |
| **Real national extract** | Data downloaded from an official (or clearly licensed) provider, mapped to the canonical CSV → `adaptEuNationalCsvToJsonl` / `adaptSsaUsCsvToJsonl` → JSONL path. Provenance should be recorded (URL, file name, year, license). |
| **Refreshability** | How often the real source updates and whether the team can rebuild JSONL **deterministically** from a pinned raw file (same `external_id` rules, documented caps). |
| **Production-ready (market)** | See checklist below; **not** implied by “import dry-run OK” or “staging batch exists”. |

---

## Source-of-truth matrix (market → lineage → refresh → readiness)

Status for **dataset class**: `synthetic` | `illustrative` | `real`**Prod readiness**: `no` (do not ship as national truth) | `staging` (OK for integration/stress) | `candidate` (real data, pending sign-off) | `yes` (signed off for prod supplement).

| App language / market | Country (`baby_names.country`) | Dataset class (current default path) | Target real source (direction) | Adapter (today) | Refresh workflow (real path) | Prod readiness |
|------------------------|--------------------------------|--------------------------------------|--------------------------------|-------------------|------------------------------|----------------|
| **en** — US | United States | **Real** when built from SSA `yob*.txt`; illustrative for committed samples | SSA national names files | `adaptSsaUsCsvToJsonl` | Download `names.zip` → extract year → `adaptSsaUsCsvToJsonl` or `buildSsaYobStagingBatch.ts` → dry-run import → record year + cap in this table | `yes` when using official extract; `no` for tiny samples only |
| **nl** | Netherlands | **Synthetic** (`emitEuNationalStagingRawCsv.ts` → `eu-nl-cbs.v1.csv`) | CBS (Centraal Bureau voor de Statistiek) baby name statistics; **curated workbook** path in [`NETHERLANDS_REAL_SOURCE_WORKFLOW.md`](./NETHERLANDS_REAL_SOURCE_WORKFLOW.md) | `adaptEuNationalCsvToJsonl` (`--slug eu-nl`) | Obtain open data export → map to `year,name,sex,count,country` → store raw under `scripts/data/raw/downloads/` → adapt → document release id; **staging swap:** report + scoped SQL in that runbook | `no` until real extract |
| **de** | Germany | **Synthetic** (`emitEuNationalStagingRawCsv.ts` → `eu-de-destatis.v1.csv`; committed staging JSONL `external-eu-de-destatis.v1.jsonl`) | **Destatis** (Statistisches Bundesamt) or another pinned open/licensed German national naming statistic; **exact Genesis table / export format TBD** when sourced; **or** ranked top-name workbook → `extractGermanyWorkbookToCanonicalCsv.ts` | `adaptEuNationalCsvToJsonl` (`--slug eu-de`) | Workbook: `npm run extract:baby-names:de-workbook-xlsx` → canonical CSV → adapt; **Destatis tables:** hand map or future small mapper once format is fixed; **staging swap (no mixing synthetic + new bulk):** dry-run **`Y`** → report/SQL preflight → scoped DELETE → import → post-verify counts = **`Y`** — [`GERMANY_REAL_SOURCE_WORKFLOW.md`](./GERMANY_REAL_SOURCE_WORKFLOW.md) | `no` until real extract + matrix update |
| **fr** | France | **Synthetic** (`emitEuNationalStagingRawCsv.ts` → `eu-fr-insee.v1.csv`; committed `external-eu-fr-insee.v1.jsonl`) | INSEE **Fichier des prénoms** (national; year, name, sex, count) | `adaptEuNationalCsvToJsonl` (`--slug eu-fr`) | Pin `nat*.csv` under `scripts/data/raw/downloads/` → `npm run map:baby-names:fr-insee-to-canonical` → canonical CSV → adapt → dry-run **`Y`** → report/SQL preflight → scoped DELETE → import → post-verify = **`Y`** — [`FRANCE_REAL_SOURCE_WORKFLOW.md`](./FRANCE_REAL_SOURCE_WORKFLOW.md) | `no` until real extract + sign-off |
| **es** | Spain | **Synthetic** (default `build:baby-names:eu-es-ine-v1`) | **Hybrid required:** INE official tables/workbook as authentic **top layer** + curated long-tail source (with provenance) + rank-preserving synthetic tail counts as needed; **not** MNP coded microdata for names | `mapIneSpainToCanonicalCsv.ts` / `extractIneSpainWorkbookToCanonicalCsv.ts` + curated canonical input → `adaptEuNationalCsvToJsonl` (`--slug eu-es`) | **Runbook:** [`SPAIN_REAL_SOURCE_WORKFLOW.md`](./SPAIN_REAL_SOURCE_WORKFLOW.md) — build INE top-layer canonical + curated tail canonical, emit JSONL, dry-run/import via scoped swap | `no` until a Spain **hybrid** batch is imported and reviewed for depth quality |
| **it** | Italy | **Synthetic** (`emitEuNationalStagingRawCsv.ts` → `eu-it-istat.v1.csv`; committed `external-eu-it-istat.v1.jsonl`) | **ISTAT** (or regional civil-registry aggregates if legal/product chooses) | `adaptEuNationalCsvToJsonl` (`--slug eu-it`) | Pin extract under `scripts/data/raw/downloads/` → canonical `year,name,sex,count,country` (`Italy`) → adapt → dry-run **`Y`** → report/SQL preflight → scoped DELETE → import → post-verify = **`Y`** — [`ITALY_REAL_SOURCE_WORKFLOW.md`](./ITALY_REAL_SOURCE_WORKFLOW.md); **no ISTAT-specific mapper in repo until format is pinned** | `no` until real extract + sign-off |
| **pt** | Portugal | **Synthetic** (`emitEuNationalStagingRawCsv.ts` → `eu-pt-ine.v1.csv`; committed `external-eu-pt-ine.v1.jsonl`) | Statistics Portugal (INE PT) **or** hybrid **Top 150 + IRN allowed-names PDF** → `extractPortugalHybridSourcesToCanonicalCsv.ts` | `adaptEuNationalCsvToJsonl` (`--slug eu-pt`) | Hybrid: `npm run extract:baby-names:pt-hybrid-sources` → adapt → dry-run **`Y`** → report/SQL preflight → scoped DELETE → import → post-verify = **`Y`** — [`PORTUGAL_REAL_SOURCE_WORKFLOW.md`](./PORTUGAL_REAL_SOURCE_WORKFLOW.md); INE PT tabular: hand map when pinned | `no` until real extract + sign-off |
| **pt** (market) | Brazil | **No dedicated bulk JSONL path yet** (bundled `LATIN_AMERICA` seeds only; not national statistics) | **IBGE** (or other pinned official naming statistic) — **export shape TBD** | `adaptEuNationalCsvToJsonl` with **`--output-region LATIN_AMERICA`** + slug such as `latin-br-ibge` (same canonical CSV header; **not** `eu-pt`) | Pin raw under `scripts/data/raw/downloads/` → canonical `year,name,sex,count,country` (`Brazil`) → adapt → dry-run **`Y`** → report/SQL preflight → scoped DELETE → import → post-verify = **`Y`** — [`BRAZIL_REAL_SOURCE_WORKFLOW.md`](./BRAZIL_REAL_SOURCE_WORKFLOW.md) | `no` until IBGE-shaped extract + sign-off; expect **partial** ranked coverage unless source proves full-volume |

**Note:** Slugs like `eu-es-ine` describe the **intended** agency shape, not a guarantee that the committed `*.v1.csv` is an INE download. Treat default `build:baby-names:eu-*-v1` outputs as **synthetic staging** until this matrix marks `real`.

---

## Repeatable refresh process (real national datasets)

Use this for any market once a **real** raw file exists.

1. **Pin provenance** — Save the vendor file under `scripts/data/raw/downloads/` (gitignored). Record in a PR or internal log: URL, retrieval date, file name, statistical year, license/terms.
2. **Normalize to canonical CSV** — Header: `year,name,sex,count,country`. Map `sex` to `M`/`F` as today’s adapters expect. Do not commit multi-megabyte raw files unless policy changes; keep them local/CI artifact.
3. **Build JSONL** — `tsx scripts/adaptEuNationalCsvToJsonl.ts --in … --out scripts/data/batches/external-eu-{cc}-{source}-{year-or-variant}.v1.jsonl --slug eu-{cc}` (or SSA equivalent).
4. **Validate** — `npm run import:baby-names -- --dry-run <batch.jsonl>`; review drop warnings from quality gates.
5. **Import** — Staging DB first; smoke-test deck; then promote per release process.
6. **Update this matrix** — Set **Dataset class** to `real`, fill **Refresh workflow** with concrete commands/paths, and set **Prod readiness** to `candidate` → `yes` after sign-off.

---

## Production readiness checklist (per market)

A market is **production-ready** for the public DB supplement only if **all** apply:

- [ ] **Real extract** — At least one import batch is built from **real national** (or licensed) source, not from `euNationalStagingSeeds` / illustrative-only CSVs.
- [ ] **Provenance documented** — Source, year, and refresh cadence recorded (this file or linked runbook).
- [ ] **Stable keys** — `external_id` scheme documented and stable across refreshes for idempotent upserts (or a deliberate migration plan exists).
- [ ] **Quality pass** — Spot-check native speakers / in-market reviewers; importer quality logs reviewed for unexpected mass drops.
- [ ] **Refresh owner** — Named responsible party and calendar (e.g. annual after agency publication).
- [ ] **Legal/product** — Use of the statistic complies with agency terms and app product policy.

Until then, treat the market as **staging-only** regardless of import success.

---

## Related implementation files

- Spain real-source runbook (includes synthetic→real **delete scope** + reports): `scripts/data/SPAIN_REAL_SOURCE_WORKFLOW.md`
- Netherlands workbook / bulk swap runbook: `scripts/data/NETHERLANDS_REAL_SOURCE_WORKFLOW.md`
- Germany Destatis-shaped real path + bulk swap runbook: `scripts/data/GERMANY_REAL_SOURCE_WORKFLOW.md`
- Germany scoped DELETE SQL: `scripts/data/sql/germany_eu_bulk_delete_for_replacement.sql`
- Germany pre-delete report: `npm run report:baby-names:de-eu-bulk-stats` → `scripts/reportGermanyEuBulkImportStats.ts`
- Germany ranked workbook → canonical CSV: `scripts/extractGermanyWorkbookToCanonicalCsv.ts` (`npm run extract:baby-names:de-workbook-xlsx`)
- INE workbook → canonical CSV (regional aggregate or single sheet): `scripts/extractIneSpainWorkbookToCanonicalCsv.ts`
- Spain hybrid (INE top + general workbook tail): `scripts/extractSpainHybridSourcesToCanonicalCsv.ts` (`npm run extract:baby-names:es-hybrid-sources`)
- INE-shaped CSV → canonical: `scripts/mapIneSpainToCanonicalCsv.ts`
- INSEE national prénoms CSV → canonical: `scripts/mapInseeFranceToCanonicalCsv.ts` (`npm run map:baby-names:fr-insee-to-canonical`); runbook: `scripts/data/FRANCE_REAL_SOURCE_WORKFLOW.md`
- France pre-delete report: `npm run report:baby-names:fr-eu-bulk-stats` → `scripts/reportFranceEuBulkImportStats.ts`
- France scoped DELETE SQL: `scripts/data/sql/france_eu_bulk_delete_for_replacement.sql`
- Italy real-source + staging swap runbook: `scripts/data/ITALY_REAL_SOURCE_WORKFLOW.md`
- Italy pre-delete report: `npm run report:baby-names:it-eu-bulk-stats` → `scripts/reportItalyEuBulkImportStats.ts`
- Italy scoped DELETE SQL: `scripts/data/sql/italy_eu_bulk_delete_for_replacement.sql`
- Italy Wikipedia + ISTAT Top 200 workbook → canonical CSV: `scripts/extractItalyWorkbookToCanonicalCsv.ts` (`npm run extract:baby-names:it-workbook-xlsx`)
- Portugal Top 150 + IRN allowed-names PDF → canonical CSV: `scripts/extractPortugalHybridSourcesToCanonicalCsv.ts` (`npm run extract:baby-names:pt-hybrid-sources`; requires `pdf-parse`)
- Portugal staging swap runbook: `scripts/data/PORTUGAL_REAL_SOURCE_WORKFLOW.md`
- Portugal pre-delete report: `npm run report:baby-names:pt-eu-bulk-stats` → `scripts/reportPortugalEuBulkImportStats.ts`
- Portugal scoped DELETE SQL: `scripts/data/sql/portugal_eu_bulk_delete_for_replacement.sql`
- Brazil (LATAM, separate from Portugal): `scripts/data/BRAZIL_REAL_SOURCE_WORKFLOW.md` (`adaptEuNationalCsvToJsonl.ts` with `--output-region LATIN_AMERICA`)
- Brazil pre-delete report: `npm run report:baby-names:br-latam-bulk-stats` → `scripts/reportBrazilLatamBulkImportStats.ts`
- Brazil scoped DELETE SQL: `scripts/data/sql/brazil_latam_bulk_delete_for_replacement.sql`
- MNP TSV guardrail (coded microdata without literal names fails): `scripts/extractSpainMnpBirthNames.ts`
- Synthetic EU raw emitter: `scripts/emitEuNationalStagingRawCsv.ts` + `scripts/embed/euNationalStagingSeeds.ts`
- EU adapter: `scripts/adaptEuNationalCsvToJsonl.ts`
- US adapter: `scripts/adaptSsaUsCsvToJsonl.ts`
- Importer: `scripts/importBabyNamesFromJsonl.ts`
- Validation/quality: `scripts/lib/bulkBabyNameImport.ts`
