# Japan — real-source workflow

End-to-end pipeline for importing Japanese baby names into `baby_names` with `country = 'Japan'`, `region = 'ASIA'`.

## TL;DR — run this

```bash
npm run build:baby-names:asia-jp-meijiyasuda-v1
npm run import:baby-names -- scripts/data/batches/external-asia-jp-meijiyasuda.v1.jsonl --dry-run
npm run import:baby-names -- scripts/data/batches/external-asia-jp-meijiyasuda.v1.jsonl
```

Expected result on Supabase: ~3,275 rows tagged `country = 'Japan'`, `region = 'ASIA'`, after dedup by deterministic `external_id` slug `asia-jp-meijiyasuda:japan:<year>:<sex>:<name-slug>`.

After last extraction (2026-06-10):
- **533 unique boy kanji**, **499 unique girl kanji** — 1,032 total unique names
- Year range 1912–2025, with strong recency weighting via `popularity_rank` derived from yearly source rank

## Source coverage gap — what was checked and why we landed where we did

Japan was harder than the EU countries: there is **no government baby-name registry** with the depth that INSEE (France), CBS (Netherlands), or Destatis (Germany) publish. This section lists every source examined and its tier.

### Sources used in the v1 import

| Source                                  | Tier                                  | What it gives us                                                   | Caveats                                                                                                                                                          |
|-----------------------------------------|---------------------------------------|--------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Meiji Yasuda Life Insurance** — 生まれ年別名前ベスト10 | Industry survey (private insurer)     | Yearly Top 10 kanji rankings 1912–2025, ~150 unique boys + ~220 unique girls | NOT a government registry. Meiji Yasuda survey covers their policy-holder base. Widely cited by NHK, Nikkei, mainichi.jp as the de-facto industry source. https://www.meijiyasuda.co.jp/enjoy/ranking/year_men/ |
| **Behind the Name** — Japanese names listing | Curated linguistic reference          | ~280 romaji entries × 1–6 kanji variants each → ~991 supplementary kanji rows | Curated by Mike Campbell since 1996. Academic-quality etymology but no popularity data. Used for breadth, not for ranking. https://www.behindthename.com/names/usage/japanese |

### Sources checked and *not* used (with reasoning)

| Source                                  | Tier                          | Why rejected                                                                                              |
|-----------------------------------------|-------------------------------|-----------------------------------------------------------------------------------------------------------|
| **MHLW** (厚生労働省 / Ministry of Health, Labour & Welfare) | Official government statistics agency | Does NOT publish baby-name rankings as part of its vital-statistics output (人口動態統計). Confirmed: name data is captured at registration but not aggregated/published. |
| **e-Stat** (Japan Statistics Bureau)    | Official government statistics portal | No name dataset in the published catalogue. Same limitation as MHLW.                                       |
| **Wikipedia EN** — `List_of_most_popular_given_names` | Tertiary aggregator           | Only top-10 per year per country. Already covered by Meiji Yasuda. The Japan section *cites* Meiji Yasuda + Benesse — circular source. |
| **Wikipedia JA** — 日本人の名前一覧            | Tertiary aggregator           | URL returned empty on fetch. Even if accessible, it's a categorised list without popularity weighting.   |
| **Benesse / Tamahiyo たまひよ baby-name survey** | Industry survey (publisher)   | Annual survey published only as PDFs in Japanese; not easily scraped. Mostly overlaps with Meiji Yasuda for top-10. Worth re-evaluating if we need a 2026+ refresh. |
| **GitHub open-data repos**              | Community-scraped              | Spot-checked a handful — all were stale Meiji Yasuda re-scrapes from 2019-2021 with no broader coverage. |
| **Aggregator sites** (赤ちゃん本舗, baby-calendar.jp, mamari.jp) | Commercial blog / aggregator   | Lower trust tier than BTN; rankings vary by visitor demographics, not births. Not used to keep provenance clean. |

### Why this hybrid is the right launch shape

- Meiji Yasuda gives **ranked, recency-weighted** popularity (top-10 per year × 113 years), which the `popularity_rank` column meaningfully reflects.
- BTN gives **breadth of kanji-form coverage** (multiple legal kanji writings of the same reading — e.g. Akira = 昭/明/亮/晶, all distinct DB rows). BTN entries land at `year=2025`, `count=1` so they sort behind Meiji Yasuda within the 2025 bucket and don't pollute the historical popularity_rank ordering.
- Total: 1,032 unique kanji names across both sexes, ~5x more than Meiji Yasuda alone (303), comfortably above the 200/sex launch threshold.

### Known limitations / things to revisit

- BTN's source page reports 537 total entries. Our fetch was truncated to 276 entries (pages 1 & 2 captured partially). When the launch settles, a complete re-scrape would add ~260 more BTN romaji entries → estimated +400-600 additional unique kanji forms.
- `name` column stores kanji form only. Hiragana reading is dropped in v1 (Japanese users will recognise kanji; non-Japanese users have the romaji bundled names plus the kanji glyph as a culturally authentic prompt). A future enhancement: surface hiragana via `name_meaning_translations` for the `ja` locale, plus romaji for English locales.
- Meaning column is empty for all rows. The existing meaning-enrichment pipeline (`scripts/enrichmentFromDictionary.ts`, `scripts/enrichmentFromOpenAI.ts`) should be run against Japan rows in a follow-up pass.
- No Benesse / Tamahiyo data yet — adding this would diversify the recency signal (Meiji Yasuda's policy-holder base skews slightly upper-middle-class).

## Pipeline detail

### Stage 1 — Extract: source files → canonical CSV

`scripts/extractJapanMeijiyasudaToCanonicalCsv.ts` reads three fixtures:
- `scripts/data/raw/downloads/Names Japan meijiyasuda boy.md`
- `scripts/data/raw/downloads/Names Japan meijiyasuda girl.md`
- `scripts/data/raw/downloads/Names Japan behindthename.tsv`

…and emits `scripts/data/raw/asia-jp-meijiyasuda.canonical.csv` with columns `year,name,sex,count,country`.

Run via: `npm run extract:baby-names:asia-jp-meijiyasuda`

Key parsing details:
- Meiji Yasuda year cells use Japanese era markers like `明45・大1年（1912）〔子〕`. The four-digit Gregorian year inside full-width `（ ）` is the source of truth.
- Cells with multiple kanji separated by whitespace = ties at the same rank.
- `-` cells = rank occupied by a tie above (skipped).
- BTN gender code: `m` → M, `f` → F, `mf` (unisex) emits both M and F rows.
- Dedup key in the extractor: `(year, name, sex)` — Meiji Yasuda data is appended first so it wins on overlap, preserving its rank-derived count.

### Stage 2 — Adapt: canonical CSV → JSONL batch

The existing EU adapter `scripts/adaptEuNationalCsvToJsonl.ts` handles canonical CSV → JSONL conversion. For Japan we pass `--output-region ASIA` and `--slug asia-jp-meijiyasuda`.

Run via: `npm run adapt:baby-names:asia-jp-meijiyasuda`

Output: `scripts/data/batches/external-asia-jp-meijiyasuda.v1.jsonl`

Each JSONL line has:
- `external_id`: `asia-jp-meijiyasuda:japan:<year>:<sex>:<name-slug>` (idempotent — re-running the import won't duplicate rows)
- `name`: primary kanji form
- `gender`: `boy` / `girl`
- `region`: `ASIA`
- `country`: `Japan`
- `origin`: `null` (linguistic origin set by enrichment pipeline, not at import)
- `meaning`: `null` (filled by enrichment pipeline)
- `popularity_rank`: 1..N within `(year, sex)` group

### Stage 3 — Import: JSONL → Supabase

```bash
# Dry-run first to validate row shape against the schema:
npm run import:baby-names -- scripts/data/batches/external-asia-jp-meijiyasuda.v1.jsonl --dry-run

# Live import:
npm run import:baby-names -- scripts/data/batches/external-asia-jp-meijiyasuda.v1.jsonl
```

### Stage 4 — Verify in Supabase

```sql
-- Row count check (expect ~3,275)
SELECT count(*) AS total
FROM baby_names
WHERE country = 'Japan';

-- Unique names by gender (expect ~533 boys, ~499 girls)
SELECT
  gender,
  count(DISTINCT name) AS unique_names,
  count(*)              AS total_rows
FROM baby_names
WHERE country = 'Japan'
GROUP BY gender;

-- Sample top-10 by popularity_rank for sanity check
SELECT name, gender, popularity_rank, region
FROM baby_names
WHERE country = 'Japan' AND popularity_rank <= 10
ORDER BY gender, popularity_rank
LIMIT 30;
```

### Stage 5 — Meaning enrichment follow-up (separate workstream)

Japan rows ship with `meaning IS NULL`. To enrich:

```bash
npm run find:meaning-enrichment-gaps -- --country Japan
npm run enrich:meaning-dictionary -- --country Japan
npm run enrich:apply -- --country Japan
```

(or feed to OpenAI enrichment for the unmatched tail).
