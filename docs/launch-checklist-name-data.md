# Name Data Verification & Gap-Closing Checklist

**Purpose:** Verify actual DB row counts, confirm meaning coverage, and close gaps before launch.
**Target:** ~30k total names in Supabase, ~3k with translated meanings across EU languages.

---

## 1. Verify DB Row Counts

Run these queries in the Supabase SQL Editor (service-role or dashboard).

### 1a. Total rows and premium split

```sql
SELECT
  count(*)                                          AS total,
  count(*) FILTER (WHERE NOT is_premium)            AS free_public,
  count(*) FILTER (WHERE is_premium)                AS premium,
  count(*) FILTER (WHERE meaning IS NOT NULL AND meaning <> '') AS has_meaning,
  count(*) FILTER (WHERE meaning IS NULL OR meaning = '')       AS missing_meaning
FROM baby_names;
```

**Expected:** total ~38k (coverage report saw 38,696 rows). If significantly less, batches may not have been imported.

### 1b. Rows per country

```sql
SELECT
  country,
  count(*)                                          AS total,
  count(*) FILTER (WHERE NOT is_premium)            AS free,
  count(*) FILTER (WHERE is_premium)                AS premium,
  count(*) FILTER (WHERE meaning IS NOT NULL AND meaning <> '') AS has_meaning
FROM baby_names
GROUP BY country
ORDER BY total DESC;
```

**Check against expected sources:**

| Country       | Source agency          | Expected rows |
|---------------|----------------------|---------------|
| France        | INSEE 1900-2024      | ~10k+         |
| Netherlands   | CBS + workbook       | ~3k+          |
| Germany       | Destatis + workbook  | ~2k+          |
| Spain         | INE + workbook       | ~3k+          |
| Italy         | ISTAT + Wikipedia    | ~2k+          |
| Portugal      | INE + PDF hybrid     | ~1k+          |
| Brazil        | IBGE + PDF hybrid    | ~1k+          |
| USA           | SSA starter + sample | ~2k+          |

- [ ] Total rows match ~38k expectation
- [ ] Each country above has >500 rows
- [ ] No country that should have data shows 0

### 1c. Rows per region

```sql
SELECT
  region,
  count(*)            AS total,
  count(DISTINCT country) AS countries
FROM baby_names
GROUP BY region
ORDER BY total DESC;
```

- [ ] EU has the bulk (~70%+)
- [ ] US, LATIN_AMERICA each have meaningful representation
- [ ] WORLDWIDE rows exist for fallback pool

### 1d. Countries with zero DB rows (gap detection)

```sql
-- These are the 59 picker countries; find any with no DB names
WITH picker_countries AS (
  SELECT unnest(ARRAY[
    'Netherlands','Germany','France','United Kingdom','Italy','Spain',
    'Poland','Sweden','Norway','Denmark','Belgium','Portugal','Finland',
    'Austria','Switzerland','Ireland','Czech Republic','Hungary','Romania',
    'Greece','Russia','Scotland',
    'USA','Canada','Australia','New Zealand',
    'China','Japan','India','South Korea','Indonesia','Philippines',
    'Vietnam','Thailand','Malaysia','Singapore','Pakistan','Bangladesh',
    'Turkey','Iran','Egypt','Morocco','Algeria','Tunisia','Israel','Jordan','Lebanon',
    'Saudi Arabia','UAE','Kuwait','Qatar','Bahrain','Oman',
    'Brazil','Mexico','Argentina','Colombia','Peru','Chile','Venezuela',
    'South Africa','Nigeria','Kenya'
  ]) AS name
)
SELECT pc.name AS country, count(bn.id) AS db_rows
FROM picker_countries pc
LEFT JOIN baby_names bn ON bn.country = pc.name
GROUP BY pc.name
HAVING count(bn.id) = 0
ORDER BY pc.name;
```

- [ ] Review the zero-row list and decide: import data or rely on region/worldwide fallback?

---

## 2. Meaning Coverage

### 2a. Overall meaning fill rate

```sql
SELECT
  count(*)                                          AS total,
  count(*) FILTER (WHERE meaning IS NOT NULL AND meaning <> '') AS has_meaning,
  ROUND(100.0 * count(*) FILTER (WHERE meaning IS NOT NULL AND meaning <> '') / count(*), 1) AS pct
FROM baby_names
WHERE NOT is_premium;
```

**Target:** At least 25% overall (enrichment pipeline achieved 25.3% on the 38k set).

### 2b. Meaning coverage per EU country

```sql
SELECT
  country,
  count(*) AS total,
  count(*) FILTER (WHERE meaning IS NOT NULL AND meaning <> '') AS has_meaning,
  ROUND(100.0 * count(*) FILTER (WHERE meaning IS NOT NULL AND meaning <> '') / NULLIF(count(*), 0), 1) AS pct
FROM baby_names
WHERE region = 'EU' AND NOT is_premium
GROUP BY country
ORDER BY pct ASC;
```

- [ ] All EU countries with >100 rows have at least 20% meaning coverage
- [ ] France, Netherlands, Germany, Spain, Italy have >=30% (high-priority launch countries)

### 2c. Premium meaning translations

```sql
SELECT
  locale,
  count(*) AS translations
FROM premium_meaning_translations
GROUP BY locale
ORDER BY translations DESC;
```

**Expected locales:** en, nl, de, fr, es, it, pt, zh, ja, ko, ar (11 app languages).

- [ ] All 11 locales have rows
- [ ] EU locales (nl, de, fr, es, it, pt) each have ~300+ translations (target 3k total across EU)

### 2d. Meaning enrichment pipeline status

From the last coverage report (`2026-04-28`):

| Metric | Value |
|--------|-------|
| Dictionary entries | 1,646 |
| Target rows processed | 38,696 |
| Already had meaning | 102 |
| Enriched (new meanings) | 9,762 |
| Ambiguous (skipped) | 464 |
| Unmatched (review queue) | 28,430 |
| Coverage of missing | 25.3% |

- [ ] Re-run enrichment pipeline if dictionary has been expanded since Apr 28
- [ ] Review the unmatched queue (~28k names) — prioritize EU-country names for manual/AI meaning fill

---

## 3. Import Pipeline Status

### 3a. JSONL batch files

The enrichment report referenced 21 JSONL batch files. On-disk check showed all batch files are 0 bytes. Two possible explanations:

1. **Data was imported to Supabase and local files were cleared** (likely if DB has ~38k rows)
2. **Pipeline was never fully run** (would mean DB is empty or thin)

- [ ] Run query 1a above to confirm which scenario applies
- [ ] If DB is populated: no action needed on JSONL files
- [ ] If DB is thin: re-run canonical CSV generation from raw source files, then import

### 3b. Raw source files available on disk

These files exist in `scripts/data/raw/downloads/`:

| File | Size | Status |
|------|------|--------|
| Names France 1900-2024.csv | 13 MB | Available |
| Names Italy wikipedia + top 200 ISTAT.xlsx | 242 KB | Available |
| Names 2024 Netherlands.xlsx | 69 KB | Available |
| Names Germany 2020-2025 top 1400.xlsx | 62 KB | Available |
| Names Spain 2022-2024.xlsx | 44 KB | Available |
| Names Brasil top 150.xlsx | 27 KB | Available |
| Names Portugal top 150.xlsx | 27 KB | Available |
| Names Spain - general.xlsx | 26 KB | Available |
| portugal_allowed_names.pdf | 2.9 MB | Available |
| brasil_allowed_names.pdf | 2.9 MB | Available |

- [ ] Verify all adapters still run cleanly: `npm run import:baby-names -- --dry-run <path.jsonl>`

### 3c. Import pipeline for new countries

For picker countries that have zero DB rows and need data:

1. Find a government/statistical source (births registry)
2. Write extraction script → canonical CSV (`year,name,sex,count,country`)
3. Write JSONL adapter
4. Import: `npm run import:baby-names -- <path.jsonl>`

Priority countries needing data (have bundled names but no dedicated import):

**Block A — non-EU major markets (current focus):**
1. Japan (ASIA) — Meiji Yasuda annual rankings; Wikipedia aggregator
2. Mexico (LATIN_AMERICA) — RENAPO / INEGI; curated lists
3. India (ASIA) — curated multi-language lists; BehindTheName / Wikipedia by language
4. South Korea (ASIA) — 대법원 / Supreme Court of Korea annual rankings

**Block B — English-speaking:**
5. Canada — Statistics Canada / provincial vital stats
6. New Zealand — Dept. of Internal Affairs births registry

**Block C — EU remainder:**
7. Poland, Sweden, Norway, Denmark, Finland, Austria, Switzerland, Czech Republic, Hungary, Romania, Greece, Russia

**Done (sources imported, canonical CSV + workflow doc on disk):**
Germany, France, Italy, Portugal, Netherlands, Brazil, Spain, Belgium, Australia, England & Wales, Scotland, Northern Ireland, Ireland.

---

## 4. Bundled vs DB Alignment

### 4a. Current bundled names (`names.ts`)

515 names across 7 regions, serving as offline fallback. Key gaps:

**17 picker countries with zero bundled names:**
Canada, Australia, New Zealand, Singapore, Pakistan, Bangladesh, Israel, Algeria, Tunisia, Kuwait, Qatar, Bahrain, Oman, Peru, South Africa, Nigeria, Kenya

**3 orphaned bundled countries (not in picker):**
Cuba, Kazakhstan, Mongolia

- [ ] Decide: add bundled names for the 17 missing countries, or accept region-fallback for them
- [ ] Remove or reassign the 3 orphaned country entries

### 4b. Free-tier pool math

CountryWeightingService builds a 120-name deck: 90% country-specific, 8% adjacent, 2% fallback.

If a country has <108 country-specific names (bundled + DB combined), the deck will be padded from adjacent/worldwide pools. This is fine for discovery but means some countries won't feel "local."

```sql
-- Check which countries can fill their 108-name country slot
SELECT
  country,
  count(*) AS available,
  CASE WHEN count(*) >= 108 THEN 'OK' ELSE 'THIN — will pad from region' END AS status
FROM baby_names
WHERE NOT is_premium
GROUP BY country
ORDER BY available ASC;
```

- [ ] High-priority launch countries (NL, DE, FR, ES, IT, PT) each have 108+ free names

---

## 5. Action Items — Priority Order

### P0 — Must verify before launch

1. **Run query 1a** to confirm ~38k rows exist in Supabase
2. **Run query 1b** to confirm EU countries have meaningful pools
3. **Run query 2b** to confirm meaning coverage across EU countries
4. **Run query 2c** to confirm premium meaning translations exist per locale

### P1 — Should fix before launch

5. Re-run meaning enrichment pipeline with any expanded dictionary
6. Triage the 28k unmatched review queue — at minimum, fill EU-country names by AI/manual lookup
7. Ensure NL, DE, FR, ES, IT, PT each have 108+ free names for a full country-first deck
8. Add bundled fallback names for Canada, Australia, NZ (high-traffic English-speaking countries)

### P2 — Nice to have

9. Import data for remaining picker countries (Nordics, Eastern Europe, MENA, Arabia, Africa)
10. Clean up 3 orphaned bundled countries (Cuba, Kazakhstan, Mongolia)
11. Regenerate JSONL batch files on disk for reproducibility

---

## 6. Quick Verification Script

After running the P0 queries, paste results here to track:

```
Total DB rows:           _____ (expect ~38k)
Free/public rows:        _____
Premium rows:            _____
Rows with meaning:       _____ (expect ~10k)
Rows missing meaning:    _____
EU countries with data:  _____ / 22
Premium translations:    _____ across _____ locales
```

If total DB rows is 0 or very low, escalate immediately — the import pipeline needs to be re-run from the raw source files before any other gap-closing work.
