# Market coverage roadmap (name database ↔ app languages)

This document aligns **non-premium `baby_names` expansion** with **languages shipped in** `src/i18n/runtime.ts` (`TRANSLATIONS` keys). It is the single place to track **source → adapter → batch → import** status per market.

**Synthetic vs real / refresh / production:** authoritative matrix and checklists live in [`SOURCE_TRUTH_AND_REFRESH.md`](./SOURCE_TRUTH_AND_REFRESH.md). This roadmap tracks **tooling and artifacts**; that file tracks **data lineage and prod readiness**.

**Supported app languages (locales):** `en`, `nl`, `de`, `fr`, `es`, `it`, `pt`, `zh`, `ja`, `ko`, `ar`

**Operational rules**

- Update **Source / Adapter / Batch / Import** columns as work lands; keep statuses honest (`—` = not started).
- Do **not** commit large raw government extracts; use `scripts/data/raw/downloads/` (gitignored) for vendor files.
- **JSONL contract** is always `BulkImportSourceRow` → `scripts/importBabyNamesFromJsonl.ts` (see `README.baby-name-import.md`).
- Default **`build:baby-names:eu-*-v1`** paths emit **synthetic staging** CSVs via `scripts/emitEuNationalStagingRawCsv.ts` unless you replace inputs with **real** national extracts (document in `SOURCE_TRUTH_AND_REFRESH.md`).

---

## Batch file naming convention

Use a predictable pattern so batches sort and grep cleanly:

```text
scripts/data/batches/external-{app-region}-{country-slug}-{source-slug}-{variant}.v1.jsonl
```

Examples:

- `external-us-ssa-yob-2023-top1200.v1.jsonl`
- `external-eu-fr-insee-sample.v1.jsonl`
- `external-eu-de-destatis-staging.v1.jsonl` (future)

- **`app-region`:** lowercase `us`, `eu`, `asia`, `arabia`, `mena`, `latin_america` (match mental model of `AppRegion` / schema; use underscores only if needed for clarity).
- **`country-slug`:** lowercase ISO-style or short English slug (`fr`, `nl`, `jp`, `cn`, `sa`, …).
- **`source-slug`:** short dataset id (`ssa`, `insee`, `ons`, `destatis`, …).
- **`variant`:** `sample`, `staging`, `top500`, `y2023`, etc.

Raw CSV mirrors can live beside batches as:

```text
scripts/data/raw/{country-slug}-{source-slug}-sample.csv
```

---

## Coverage matrix (language → market → pipeline status)

Status tokens: **—** not started · **Named** source identified · **Shipped** adapter exists · **Sample** committed JSONL · **Staging** large batch workflow · **Imported** loaded in dev/staging DB.

**Lineage (default committed path)** — `synthetic` = embedded seeds / staging emitter, not national statistics. **Prod OK?** — from [`SOURCE_TRUTH_AND_REFRESH.md`](./SOURCE_TRUTH_AND_REFRESH.md) checklist; `no` means do not treat as authentic market deck.

| Language | Target country / market | `region` | Source status | Adapter status | Batch status | Import status | Lineage (default path) | Prod OK? |
|----------|-------------------------|----------|---------------|----------------|--------------|---------------|------------------------|----------|
| **en** | US; UK (later) | `US`; `EU` | US: Named (SSA). UK: — | US: Shipped (`adaptSsaUsCsvToJsonl`). UK: — | US: Sample + staging builder. UK: — | US: Repeatable. UK: — | Mixed: SSA **real** when built from `yob*.txt`; committed samples illustrative | US: **yes** with real SSA extract; **no** for samples only |
| **nl** | Netherlands (+ BE optional) | `EU` | Named (CBS-style → canonical CSV) | Shipped (`adaptEuNationalCsvToJsonl`, `--slug eu-nl`) | Sample + **staging:** `external-eu-nl-cbs.v1.jsonl` (~1k rows; `npm run build:baby-names:eu-national-v1`) | Dry-run OK; staging import ready | **Synthetic** (emitter seeds) until CBS file mapped | **no** |
| **de** | Germany; Austria | `EU` | Named (Destatis-style → canonical CSV) | Shipped (`adaptEuNationalCsvToJsonl`, `--slug eu-de`) | Sample + **staging:** `external-eu-de-destatis.v1.jsonl` (~1k rows); **real replacement path:** [`GERMANY_REAL_SOURCE_WORKFLOW.md`](./GERMANY_REAL_SOURCE_WORKFLOW.md) | Dry-run OK; staging import ready | **Synthetic** default build until real Destatis-shaped batch imported | **no** |
| **fr** | France | `EU` | Named (INSEE-style → canonical CSV) | Shipped (`adaptEuNationalCsvToJsonl`, `--slug eu-fr`) | Sample + **staging:** `external-eu-fr-insee.v1.jsonl` (~1k rows; `npm run build:baby-names:eu-fr-insee-v1`); **real INSEE intake + scoped delete:** [`FRANCE_REAL_SOURCE_WORKFLOW.md`](./FRANCE_REAL_SOURCE_WORKFLOW.md) (`map:baby-names:fr-insee-to-canonical`, `report:baby-names:fr-eu-bulk-stats`, `france_eu_bulk_delete_for_replacement.sql`) | Dry-run OK; staging import ready | **Synthetic** default build until real INSEE-backed batch imported | **no** |
| **es** | Spain; Latam (later) | `EU`; `LATIN_AMERICA` | Named (**hybrid**): INE top-layer authenticity + curated long-tail source; **MNP microdata** in common coded drops **not** a name source | Shipped: `adaptEuNationalCsvToJsonl` + **INE intake** `mapIneSpainToCanonicalCsv` / `extractIneSpainWorkbookToCanonicalCsv` ([`SPAIN_REAL_SOURCE_WORKFLOW.md`](./SPAIN_REAL_SOURCE_WORKFLOW.md)); curated tail uses same canonical adapter path | Sample + **staging:** `external-eu-es-ine.v1.jsonl` (~1k rows); INE-only local batches are shallow (`external-eu-es-ine-real-*.v1.jsonl`); target is **hybrid** Spain batch | Dry-run OK; staging import ready | **Synthetic** default build; Spain production path is **hybrid** (official top + curated tail), not INE-only | **no** until hybrid Spain batch + quality sign-off |
| **it** | Italy | `EU` | Named (ISTAT-style → canonical CSV) | Shipped (`adaptEuNationalCsvToJsonl`, `--slug eu-it`) | **Staging:** `external-eu-it-istat.v1.jsonl` (~1k rows; `npm run build:baby-names:eu-it-istat-v1`); **real ISTAT intake + scoped delete:** [`ITALY_REAL_SOURCE_WORKFLOW.md`](./ITALY_REAL_SOURCE_WORKFLOW.md) (`report:baby-names:it-eu-bulk-stats`, `italy_eu_bulk_delete_for_replacement.sql`) | Dry-run OK; staging import ready | **Synthetic** default build until real ISTAT-backed batch imported | **no** |
| **pt** | Portugal | `EU` | Named (Statistics Portugal / INE → canonical CSV) | Shipped (`adaptEuNationalCsvToJsonl`, `--slug eu-pt`) | **Staging:** `external-eu-pt-ine.v1.jsonl` (~1k rows; `npm run build:baby-names:eu-pt-ine-v1`); **hybrid Top 150 + IRN PDF + scoped delete:** [`PORTUGAL_REAL_SOURCE_WORKFLOW.md`](./PORTUGAL_REAL_SOURCE_WORKFLOW.md) (`extract:baby-names:pt-hybrid-sources`, `report:baby-names:pt-eu-bulk-stats`, `portugal_eu_bulk_delete_for_replacement.sql`) | Dry-run OK; staging import ready (EU PT) | **Synthetic** default build until real/hybrid batch imported | **no** |
| **pt** | Brazil | `LATIN_AMERICA` | Named (**IBGE** naming / civil-registration statistics — **table TBD**) | Shipped canonical path: `adaptEuNationalCsvToJsonl` + **`--output-region LATIN_AMERICA`** + distinct `--slug` (e.g. `latin-br-ibge`) — [`BRAZIL_REAL_SOURCE_WORKFLOW.md`](./BRAZIL_REAL_SOURCE_WORKFLOW.md) | Hybrid path staged: canonical + JSONL dry-run; replacement guardrail assets: `report:baby-names:br-latam-bulk-stats`, `brazil_latam_bulk_delete_for_replacement.sql` | Dry-run OK; staging replacement path ready (LATAM BR) | **None** in bulk DB path until first IBGE-backed import; **separate from Portugal** (`country` / `region` / slug) | **no** |
| **zh** | China | `ASIA` | — | Planned (new script; `region: ASIA`) | — | — | — | — |
| **ja** | Japan | `ASIA` | — | Planned | — | — | — | — |
| **ko** | South Korea | `ASIA` | — | Planned | — | — | — | — |
| **ar** | GCC / broader Arabic (phased) | `ARABIA` / `MENA` | — | Planned (pick `ARABIA` vs `MENA` per row) | — | — | — | — |

**Legend**

- **—** = not started / no artifact yet.
- **Dry-run OK** = `npm run import:baby-names -- --dry-run <file.jsonl>` passes for a committed sample.
- **Import status** = whether a batch is realistically loadable in dev/staging (`is_premium = false`).

---

## Live deck supplement note (WORLDWIDE)

`WORLDWIDE` profile supplement currently balances **US + EU + LATIN_AMERICA** slices in code (`WORLDWIDE_PUBLIC_SUPPLEMENT_REGIONS` in `PremiumContentService`). When **ASIA** or **ARABIA** bulk rows exist in meaningful volume, extend that constant (or equivalent) so the WORLDWIDE mix stays balanced—document the change in this file when you do.

---

## Ingestion checklist (quick copy for PRs)

Use `[ ]` / `[x]` in PR descriptions or team docs.

- [ ] **US** — national staging batch imported to staging DB
- [ ] **EU: France** — sample path (`adapt:baby-names:eu-fr-sample`); **staging v1** `external-eu-fr-insee.v1.jsonl` (`build:baby-names:eu-fr-insee-v1`); **INSEE real batch + scoped delete (no mixing):** [`FRANCE_REAL_SOURCE_WORKFLOW.md`](./FRANCE_REAL_SOURCE_WORKFLOW.md) (`map:baby-names:fr-insee-to-canonical`, `report:baby-names:fr-eu-bulk-stats`, SQL in `scripts/data/sql/`)
- [ ] **EU: NL** — sample path shipped (`adapt:baby-names:eu-nl-sample`); **staging v1** `external-eu-nl-cbs.v1.jsonl` (`build:baby-names:eu-national-v1`); **workbook → real batch** + scoped delete: [`NETHERLANDS_REAL_SOURCE_WORKFLOW.md`](./NETHERLANDS_REAL_SOURCE_WORKFLOW.md)
- [ ] **EU: DE** — sample path shipped (`adapt:baby-names:eu-de-sample`); **staging v1** `external-eu-de-destatis.v1.jsonl`; **ranked workbook or Destatis real batch + scoped delete (no mixing):** [`GERMANY_REAL_SOURCE_WORKFLOW.md`](./GERMANY_REAL_SOURCE_WORKFLOW.md) (`report:baby-names:de-eu-bulk-stats`, `germany_eu_bulk_delete_for_replacement.sql`)
- [ ] **EU: ES** — sample path shipped (`adapt:baby-names:eu-es-sample`); **staging v1** `external-eu-es-ine.v1.jsonl`; **hybrid Spain intake** — runbook [`SPAIN_REAL_SOURCE_WORKFLOW.md`](./SPAIN_REAL_SOURCE_WORKFLOW.md) (INE top-layer authenticity + curated long-tail; MNP coded microdata not valid for names)
- [ ] **EU: IT** — **staging v1** `external-eu-it-istat.v1.jsonl` (`build:baby-names:eu-it-istat-v1`); **ISTAT real batch + scoped delete (no mixing):** [`ITALY_REAL_SOURCE_WORKFLOW.md`](./ITALY_REAL_SOURCE_WORKFLOW.md) (`report:baby-names:it-eu-bulk-stats`, SQL in `scripts/data/sql/`)
- [ ] **EU: PT** — **staging v1** `external-eu-pt-ine.v1.jsonl` (`build:baby-names:eu-pt-ine-v1`); **hybrid batch + scoped delete (no mixing):** [`PORTUGAL_REAL_SOURCE_WORKFLOW.md`](./PORTUGAL_REAL_SOURCE_WORKFLOW.md) (`extract:baby-names:pt-hybrid-sources`, `report:baby-names:pt-eu-bulk-stats`, SQL in `scripts/data/sql/`)
- [ ] **LATAM: BR (pt market)** — IBGE/hybrid canonical CSV → JSONL (`adaptEuNationalCsvToJsonl` + `--output-region LATIN_AMERICA`); **not Portugal:** [`BRAZIL_REAL_SOURCE_WORKFLOW.md`](./BRAZIL_REAL_SOURCE_WORKFLOW.md); staging swap assets: `report:baby-names:br-latam-bulk-stats` + `scripts/data/sql/brazil_latam_bulk_delete_for_replacement.sql`
- [ ] **ASIA: JA / ZH / KO** — adapter pattern chosen; `region: ASIA` validated in importer
- [ ] **AR** — adapter pattern; `region: ARABIA` or `MENA` aligned with product
- [ ] **WORLDWIDE** — supplement balancing updated when a new region has bulk data

---

## Related files

- Source lineage, refresh, prod readiness: `scripts/data/SOURCE_TRUTH_AND_REFRESH.md`
- Spain INE real-source runbook: `scripts/data/SPAIN_REAL_SOURCE_WORKFLOW.md`
- Import contract & workflows: `scripts/data/README.baby-name-import.md`
- US adapter: `scripts/adaptSsaUsCsvToJsonl.ts`
- EU national CSV adapter: `scripts/adaptEuNationalCsvToJsonl.ts`
- Netherlands curated workbook → canonical CSV: `scripts/extractNetherlandsWorkbookToCanonicalCsv.ts`
- Netherlands staging replacement (report + SQL): `scripts/data/NETHERLANDS_REAL_SOURCE_WORKFLOW.md`
- Germany real-source replacement (report + SQL): `scripts/data/GERMANY_REAL_SOURCE_WORKFLOW.md`
- Germany ranked workbook → canonical CSV: `scripts/extractGermanyWorkbookToCanonicalCsv.ts`
- France INSEE nat CSV → canonical CSV: `scripts/mapInseeFranceToCanonicalCsv.ts` — `scripts/data/FRANCE_REAL_SOURCE_WORKFLOW.md` (report + SQL for staging swap)
- Italy ISTAT-shaped real path + staging swap: `scripts/data/ITALY_REAL_SOURCE_WORKFLOW.md` (`reportItalyEuBulkImportStats.ts`, `italy_eu_bulk_delete_for_replacement.sql`, `extractItalyWorkbookToCanonicalCsv.ts`)
- Portugal hybrid + staging swap: `scripts/data/PORTUGAL_REAL_SOURCE_WORKFLOW.md` (`extractPortugalHybridSourcesToCanonicalCsv.ts`, `reportPortugalEuBulkImportStats.ts`, `portugal_eu_bulk_delete_for_replacement.sql`; `pdf-parse` devDependency)
- Brazil hybrid intake + staging swap (LATAM, not EU / not PT slug): `scripts/data/BRAZIL_REAL_SOURCE_WORKFLOW.md` (`extractBrazilHybridSourcesToCanonicalCsv.ts`, `reportBrazilLatamBulkImportStats.ts`, `brazil_latam_bulk_delete_for_replacement.sql`, `adaptEuNationalCsvToJsonl.ts` with `--output-region LATIN_AMERICA`)
- Importer CLI: `scripts/importBabyNamesFromJsonl.ts`
- Typecheck tooling: `npm run typecheck:scripts` (`tsconfig.scripts.json`)
