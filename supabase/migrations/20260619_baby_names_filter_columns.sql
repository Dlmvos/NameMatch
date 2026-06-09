-- ============================================================
-- 20260619_baby_names_filter_columns.sql
--
-- Adds `name_length_bucket` (generated) and `trend` (curated) columns to
-- baby_names so the FilterSheet country-chip counts can intersect with the
-- user's other active filters at the DB layer.
--
-- Why this exists
-- ───────────────
-- `getOriginCountryChips` previously returned per-country totals from the
-- `baby_names_country_counts` view. Those counts didn't react when the user
-- toggled length / trend / starts-with — picking "long names" left Belgium's
-- chip at 12 275 instead of dropping to "long Belgian names only".
--
-- Length is JS-trivial (`char_length(name)` bucketed). Trend is a static
-- lookup table (`ENRICHMENT_MAP` in src/services/nameEnrichment.ts) — not
-- an algorithm — so it's expressible as a column with a one-time backfill
-- from the JS map.
--
-- Columns added
-- ─────────────
-- * `name_length_bucket text` — STORED GENERATED. Computed in PostgreSQL
--   from `char_length(name)` with the same buckets as `getNameLength` in
--   JS (≤4 → short, ≤7 → medium, >7 → long). Cannot drift from the JS
--   function because the function is a single CASE — to change the rule
--   you'd edit both sides in one migration.
-- * `trend text` — nullable, CHECK in ('rising','stable','classic'). NULL
--   for un-curated names (mirrors the JS `enrichName().trend = undefined`
--   for names not in ENRICHMENT_MAP).
--
-- Trend backfill
-- ──────────────
-- 215 (name, trend) rows extracted from ENRICHMENT_MAP and embedded as a
-- VALUES list below. Match is case-insensitive via the normalize_name_key
-- function so 'maria', 'María', 'MARIA' all backfill consistently.
--
-- Future ENRICHMENT_MAP edits: run `npm run sync:name-trends-to-db` which
-- diffs JS vs DB and emits a small follow-up SQL patch.
--
-- Indexes added
-- ─────────────
-- Composite on `(country, gender, is_premium, trend, name_length_bucket)`
-- so the `country_counts_with_filters` RPC (next migration) gets a single
-- index scan instead of a seq-scan of 54k rows per filter combination.
--
-- Idempotency
-- ───────────
-- `ADD COLUMN IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, and the trend
-- backfill is `UPDATE ... WHERE trend IS NULL` so re-runs don't overwrite
-- manually-set values.
-- ============================================================

-- ── 1. Generated length-bucket column ──────────────────────────────────────
-- PostgreSQL requires the function in a GENERATED expression to be IMMUTABLE.
-- char_length is, so wrapping the bucketing in a CASE is safe.
alter table public.baby_names
  add column if not exists name_length_bucket text
  generated always as (
    case
      when char_length(coalesce(name, '')) <= 4 then 'short'
      when char_length(coalesce(name, '')) <= 7 then 'medium'
      else 'long'
    end
  ) stored;

-- ── 2. Trend column + check ────────────────────────────────────────────────
alter table public.baby_names
  add column if not exists trend text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'baby_names_trend_check'
  ) then
    alter table public.baby_names
      add constraint baby_names_trend_check
      check (trend is null or trend in ('rising', 'stable', 'classic'));
  end if;
end
$$;

-- ── 3. Composite index ─────────────────────────────────────────────────────
-- Partial index — only rows with a non-null country participate in the chip
-- counts. The column order matches the RPC's WHERE-clause selectivity
-- (country narrows the most, then gender, then the optional filters).
create index if not exists idx_baby_names_filter_chip_counts
  on public.baby_names (country, gender, is_premium, trend, name_length_bucket)
  where country is not null and btrim(country) <> '';

-- ── 4. Trend backfill from ENRICHMENT_MAP ──────────────────────────────────
-- Build a (normalized_name, trend) match table on the fly, then UPDATE.
-- Only fills rows where trend is currently NULL so re-runs and manual
-- curator edits are preserved.
with curated(name, trend) as (
  values
  ($bn$Aria$bn$, 'rising'),
  ($bn$Leo$bn$, 'rising'),
  ($bn$Mia$bn$, 'stable'),
  ($bn$Luca$bn$, 'rising'),
  ($bn$Emma$bn$, 'classic'),
  ($bn$Noah$bn$, 'classic'),
  ($bn$Sofia$bn$, 'stable'),
  ($bn$Oliver$bn$, 'rising'),
  ($bn$Luna$bn$, 'rising'),
  ($bn$Elias$bn$, 'rising'),
  ($bn$Isla$bn$, 'rising'),
  ($bn$Ethan$bn$, 'stable'),
  ($bn$Zara$bn$, 'rising'),
  ($bn$Julian$bn$, 'stable'),
  ($bn$Nora$bn$, 'rising'),
  ($bn$Amélie$bn$, 'classic'),
  ($bn$Antoine$bn$, 'classic'),
  ($bn$Lorenzo$bn$, 'stable'),
  ($bn$Chiara$bn$, 'stable'),
  ($bn$Björn$bn$, 'classic'),
  ($bn$Astrid$bn$, 'rising'),
  ($bn$Alejandro$bn$, 'stable'),
  ($bn$Lucía$bn$, 'rising'),
  ($bn$Finn$bn$, 'rising'),
  ($bn$Aoife$bn$, 'classic'),
  ($bn$Liam$bn$, 'classic'),
  ($bn$Olivia$bn$, 'classic'),
  ($bn$Mason$bn$, 'stable'),
  ($bn$Charlotte$bn$, 'classic'),
  ($bn$Aiden$bn$, 'stable'),
  ($bn$Harper$bn$, 'rising'),
  ($bn$Maverick$bn$, 'rising'),
  ($bn$Aurora$bn$, 'rising'),
  ($bn$Asher$bn$, 'rising'),
  ($bn$Hazel$bn$, 'rising'),
  ($bn$Mohammed$bn$, 'classic'),
  ($bn$Fatima$bn$, 'classic'),
  ($bn$Ahmed$bn$, 'classic'),
  ($bn$Aisha$bn$, 'stable'),
  ($bn$Omar$bn$, 'stable'),
  ($bn$Noor$bn$, 'rising'),
  ($bn$Yasmin$bn$, 'stable'),
  ($bn$Hassan$bn$, 'classic'),
  ($bn$Layla$bn$, 'rising'),
  ($bn$Ibrahim$bn$, 'classic'),
  ($bn$Kai$bn$, 'rising'),
  ($bn$Sakura$bn$, 'rising'),
  ($bn$Kenji$bn$, 'classic'),
  ($bn$Arjun$bn$, 'rising'),
  ($bn$Priya$bn$, 'stable'),
  ($bn$Mei$bn$, 'stable'),
  ($bn$Santiago$bn$, 'rising'),
  ($bn$Valentina$bn$, 'rising'),
  ($bn$Sebastián$bn$, 'stable'),
  ($bn$Isabella$bn$, 'classic'),
  ($bn$Mateo$bn$, 'rising'),
  ($bn$Camila$bn$, 'rising'),
  ($bn$Diego$bn$, 'stable'),
  ($bn$Leonardo$bn$, 'rising'),
  ($bn$Cyrus$bn$, 'rising'),
  ($bn$Shireen$bn$, 'classic'),
  ($bn$Emir$bn$, 'rising'),
  ($bn$Elif$bn$, 'classic'),
  ($bn$Tarek$bn$, 'stable'),
  ($bn$Nada$bn$, 'stable'),
  ($bn$Amir$bn$, 'rising'),
  ($bn$Jana$bn$, 'rising'),
  ($bn$Thijs$bn$, 'stable'),
  ($bn$Fleur$bn$, 'classic'),
  ($bn$Sanne$bn$, 'classic'),
  ($bn$Daan$bn$, 'classic'),
  ($bn$Bram$bn$, 'classic'),
  ($bn$Jasmijn$bn$, 'stable'),
  ($bn$Lotte$bn$, 'classic'),
  ($bn$Milan$bn$, 'rising'),
  ($bn$Noud$bn$, 'rising'),
  ($bn$Femke$bn$, 'classic'),
  ($bn$Sem$bn$, 'classic'),
  ($bn$Evi$bn$, 'rising'),
  ($bn$Max$bn$, 'stable'),
  ($bn$Eva$bn$, 'classic'),
  ($bn$Samuel$bn$, 'classic'),
  ($bn$Iris$bn$, 'rising'),
  ($bn$Daniel$bn$, 'classic'),
  ($bn$Camille$bn$, 'classic'),
  ($bn$Mathis$bn$, 'stable'),
  ($bn$Léonie$bn$, 'rising'),
  ($bn$Florian$bn$, 'classic'),
  ($bn$Luisa$bn$, 'stable'),
  ($bn$Klaus$bn$, 'classic'),
  ($bn$Greta$bn$, 'rising'),
  ($bn$Sigrid$bn$, 'classic'),
  ($bn$Sven$bn$, 'classic'),
  ($bn$Marco$bn$, 'stable'),
  ($bn$Pablo$bn$, 'classic'),
  ($bn$Elijah$bn$, 'classic'),
  ($bn$Amelia$bn$, 'classic'),
  ($bn$James$bn$, 'classic'),
  ($bn$Evelyn$bn$, 'stable'),
  ($bn$Logan$bn$, 'stable'),
  ($bn$Abigail$bn$, 'classic'),
  ($bn$Wyatt$bn$, 'stable'),
  ($bn$Scarlett$bn$, 'rising'),
  ($bn$Jackson$bn$, 'stable'),
  ($bn$Grace$bn$, 'classic'),
  ($bn$Carter$bn$, 'stable'),
  ($bn$Chloe$bn$, 'classic'),
  ($bn$Owen$bn$, 'stable'),
  ($bn$Penelope$bn$, 'rising'),
  ($bn$Khalid$bn$, 'classic'),
  ($bn$Mariam$bn$, 'classic'),
  ($bn$Yusuf$bn$, 'classic'),
  ($bn$Salma$bn$, 'stable'),
  ($bn$Darius$bn$, 'classic'),
  ($bn$Parisa$bn$, 'stable'),
  ($bn$Reza$bn$, 'classic'),
  ($bn$Nasrin$bn$, 'classic'),
  ($bn$Xerxes$bn$, 'classic'),
  ($bn$Azadeh$bn$, 'classic'),
  ($bn$Karim$bn$, 'stable'),
  ($bn$Zineb$bn$, 'classic'),
  ($bn$Yuki$bn$, 'stable'),
  ($bn$Haruto$bn$, 'classic'),
  ($bn$Aoi$bn$, 'rising'),
  ($bn$Ren$bn$, 'rising'),
  ($bn$Hana$bn$, 'classic'),
  ($bn$Wei$bn$, 'stable'),
  ($bn$Sofía$bn$, 'classic'),
  ($bn$Valeria$bn$, 'rising'),
  ($bn$Émile$bn$, 'classic'),
  ($bn$Manon$bn$, 'stable'),
  ($bn$Arthur$bn$, 'classic'),
  ($bn$Poppy$bn$, 'rising'),
  ($bn$Álvaro$bn$, 'stable'),
  ($bn$Marina$bn$, 'stable'),
  ($bn$Jan$bn$, 'classic'),
  ($bn$Maja$bn$, 'stable'),
  ($bn$Alva$bn$, 'rising'),
  ($bn$Nils$bn$, 'classic'),
  ($bn$Leif$bn$, 'classic'),
  ($bn$Inga$bn$, 'classic'),
  ($bn$Emil$bn$, 'classic'),
  ($bn$Freja$bn$, 'rising'),
  ($bn$Jules$bn$, 'stable'),
  ($bn$Tiago$bn$, 'rising'),
  ($bn$Inês$bn$, 'classic'),
  ($bn$Aino$bn$, 'rising'),
  ($bn$Eero$bn$, 'classic'),
  ($bn$Felix$bn$, 'stable'),
  ($bn$Leni$bn$, 'rising'),
  ($bn$Nico$bn$, 'rising'),
  ($bn$Mila$bn$, 'rising'),
  ($bn$Seán$bn$, 'classic'),
  ($bn$Niamh$bn$, 'classic'),
  ($bn$Jakub$bn$, 'classic'),
  ($bn$Tereza$bn$, 'stable'),
  ($bn$Máté$bn$, 'classic'),
  ($bn$Eszter$bn$, 'classic'),
  ($bn$Mihai$bn$, 'classic'),
  ($bn$Ana$bn$, 'classic'),
  ($bn$Yannis$bn$, 'classic'),
  ($bn$Eleni$bn$, 'classic'),
  ($bn$Aleksei$bn$, 'classic'),
  ($bn$Anastasia$bn$, 'classic'),
  ($bn$Hamish$bn$, 'classic'),
  ($bn$Lachlan$bn$, 'stable'),
  ($bn$Matilda$bn$, 'rising'),
  ($bn$Theo$bn$, 'rising'),
  ($bn$Maeve$bn$, 'rising'),
  ($bn$Arlo$bn$, 'rising'),
  ($bn$Kiri$bn$, 'stable'),
  ($bn$Jiho$bn$, 'stable'),
  ($bn$Sujin$bn$, 'stable'),
  ($bn$Ayu$bn$, 'classic'),
  ($bn$Raka$bn$, 'stable'),
  ($bn$Enzo$bn$, 'rising'),
  ($bn$Anh$bn$, 'stable'),
  ($bn$Khanh$bn$, 'stable'),
  ($bn$Anan$bn$, 'stable'),
  ($bn$Lalita$bn$, 'classic'),
  ($bn$Aiman$bn$, 'stable'),
  ($bn$Nurul$bn$, 'classic'),
  ($bn$Hamza$bn$, 'classic'),
  ($bn$Ayesha$bn$, 'classic'),
  ($bn$Rafi$bn$, 'stable'),
  ($bn$Nusrat$bn$, 'classic'),
  ($bn$Youssef$bn$, 'classic'),
  ($bn$Lina$bn$, 'rising'),
  ($bn$Sami$bn$, 'classic'),
  ($bn$Meriem$bn$, 'classic'),
  ($bn$Noam$bn$, 'rising'),
  ($bn$Yael$bn$, 'classic'),
  ($bn$Rami$bn$, 'stable'),
  ($bn$Dana$bn$, 'stable'),
  ($bn$Zayed$bn$, 'classic'),
  ($bn$Maha$bn$, 'classic'),
  ($bn$Fahad$bn$, 'classic'),
  ($bn$Reem$bn$, 'rising'),
  ($bn$Tamim$bn$, 'classic'),
  ($bn$Noora$bn$, 'classic'),
  ($bn$Salman$bn$, 'classic'),
  ($bn$Lulwa$bn$, 'classic'),
  ($bn$Said$bn$, 'classic'),
  ($bn$Mazoon$bn$, 'rising'),
  ($bn$Inti$bn$, 'classic'),
  ($bn$Nayra$bn$, 'rising'),
  ($bn$Benjamín$bn$, 'classic'),
  ($bn$Josefa$bn$, 'classic'),
  ($bn$Miguel$bn$, 'classic'),
  ($bn$Ayo$bn$, 'rising'),
  ($bn$Amara$bn$, 'rising'),
  ($bn$Kiptoo$bn$, 'classic'),
  ($bn$Wanjiru$bn$, 'classic'),
  ($bn$Thabo$bn$, 'classic'),
  ($bn$Naledi$bn$, 'rising')

),
normalized as (
  select public.normalize_name_key(name) as norm, trend from curated
)
update public.baby_names bn
set trend = n.trend
from normalized n
where bn.trend is null
  and public.normalize_name_key(bn.name) = n.norm;

notify pgrst, 'reload schema';
