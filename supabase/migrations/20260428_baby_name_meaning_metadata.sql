-- Optional metadata for script-generated baby-name meaning enrichment.
-- The enrichment script only emits updates for rows whose meaning is empty.

alter table public.baby_names
  add column if not exists meaning_source text,
  add column if not exists meaning_confidence numeric,
  add column if not exists meaning_verified boolean not null default false,
  add column if not exists meaning_language text;

create index if not exists idx_baby_names_missing_meaning_priority
  on public.baby_names (country, popularity_rank)
  where meaning is null or btrim(meaning) = '';
