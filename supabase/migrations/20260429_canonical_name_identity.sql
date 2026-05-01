-- Canonical name identity layer.
-- Keeps public.baby_names as the app-facing country/rank row table while
-- deduplicating source-tracked meanings by normalized name.

create extension if not exists unaccent with schema extensions;

create or replace function public.normalize_name_key(input text)
returns text
language sql
stable
as $$
  select nullif(
    regexp_replace(
      regexp_replace(
        lower(extensions.unaccent(btrim(coalesce(input, '')))),
        '[’'']',
        '',
        'g'
      ),
      '\s+',
      ' ',
      'g'
    ),
    ''
  );
$$;

create table if not exists public.canonical_names (
  id uuid primary key default uuid_generate_v4(),
  normalized_key text not null unique check (btrim(normalized_key) <> ''),
  display_name text not null check (btrim(display_name) <> ''),
  created_at timestamptz not null default now()
);

create table if not exists public.canonical_name_meanings (
  id uuid primary key default uuid_generate_v4(),
  canonical_name_id uuid not null references public.canonical_names(id) on delete cascade,
  meaning text not null check (btrim(meaning) <> ''),
  origin text,
  gender_scope text not null default 'any' check (gender_scope in ('any', 'boy', 'girl', 'neutral')),
  meaning_language text not null default 'en',
  meaning_source text not null,
  meaning_confidence numeric,
  meaning_verified boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.baby_names
  add column if not exists canonical_name_id uuid references public.canonical_names(id) on delete set null;

create index if not exists idx_baby_names_canonical_name_id
  on public.baby_names(canonical_name_id);

create index if not exists idx_canonical_name_meanings_lookup
  on public.canonical_name_meanings(canonical_name_id, meaning_language, gender_scope, meaning_verified, meaning_confidence);

create unique index if not exists idx_canonical_name_meanings_source_unique
  on public.canonical_name_meanings(canonical_name_id, meaning_language, gender_scope, meaning, meaning_source);

alter table public.canonical_names enable row level security;
alter table public.canonical_name_meanings enable row level security;

drop policy if exists "canonical_names readable" on public.canonical_names;
create policy "canonical_names readable"
  on public.canonical_names for select
  using (true);

drop policy if exists "canonical_name_meanings readable" on public.canonical_name_meanings;
create policy "canonical_name_meanings readable"
  on public.canonical_name_meanings for select
  using (true);

insert into public.canonical_names (normalized_key, display_name)
select normalized_key, display_name
from (
  select
    public.normalize_name_key(name) as normalized_key,
    (array_agg(name order by popularity_rank nulls last, length(name), name))[1] as display_name
  from public.baby_names
  where public.normalize_name_key(name) is not null
  group by public.normalize_name_key(name)
) names
where normalized_key is not null
on conflict (normalized_key) do nothing;

update public.baby_names bn
set canonical_name_id = cn.id
from public.canonical_names cn
where bn.canonical_name_id is null
  and cn.normalized_key = public.normalize_name_key(bn.name);

insert into public.canonical_name_meanings (
  canonical_name_id,
  meaning,
  origin,
  gender_scope,
  meaning_language,
  meaning_source,
  meaning_confidence,
  meaning_verified
)
select distinct on (
  bn.canonical_name_id,
  coalesce(nullif(btrim(bn.meaning_language), ''), 'en'),
  bn.gender,
  btrim(bn.meaning),
  coalesce(nullif(btrim(bn.meaning_source), ''), 'baby_names:existing_cache')
)
  bn.canonical_name_id,
  btrim(bn.meaning) as meaning,
  nullif(btrim(bn.origin), '') as origin,
  bn.gender as gender_scope,
  coalesce(nullif(btrim(bn.meaning_language), ''), 'en') as meaning_language,
  coalesce(nullif(btrim(bn.meaning_source), ''), 'baby_names:existing_cache') as meaning_source,
  coalesce(bn.meaning_confidence, case when bn.meaning_verified then 0.95 else 0.6 end) as meaning_confidence,
  coalesce(bn.meaning_verified, false) as meaning_verified
from public.baby_names bn
where bn.canonical_name_id is not null
  and bn.meaning is not null
  and btrim(bn.meaning) <> ''
order by
  bn.canonical_name_id,
  coalesce(nullif(btrim(bn.meaning_language), ''), 'en'),
  bn.gender,
  btrim(bn.meaning),
  coalesce(nullif(btrim(bn.meaning_source), ''), 'baby_names:existing_cache'),
  coalesce(bn.meaning_verified, false) desc,
  bn.meaning_confidence desc nulls last
on conflict (canonical_name_id, meaning_language, gender_scope, meaning, meaning_source)
do update set
  origin = coalesce(excluded.origin, public.canonical_name_meanings.origin),
  meaning_confidence = greatest(
    coalesce(public.canonical_name_meanings.meaning_confidence, 0),
    coalesce(excluded.meaning_confidence, 0)
  ),
  meaning_verified = public.canonical_name_meanings.meaning_verified or excluded.meaning_verified;

create or replace view public.baby_names_with_meaning
with (security_invoker = true)
as
select
  bn.id,
  bn.name,
  coalesce(nullif(btrim(bn.meaning), ''), best_meaning.meaning) as meaning,
  coalesce(nullif(btrim(bn.origin), ''), best_meaning.origin) as origin,
  bn.gender,
  bn.country,
  bn.region,
  bn.is_worldwide,
  bn.created_at,
  bn.is_premium,
  bn.popularity_rank,
  bn.canonical_name_id,
  coalesce(nullif(btrim(bn.meaning_source), ''), best_meaning.meaning_source) as meaning_source,
  coalesce(bn.meaning_confidence, best_meaning.meaning_confidence) as meaning_confidence,
  coalesce(bn.meaning_verified, best_meaning.meaning_verified, false) as meaning_verified,
  coalesce(nullif(btrim(bn.meaning_language), ''), best_meaning.meaning_language) as meaning_language
from public.baby_names bn
left join lateral (
  select
    cnm.meaning,
    cnm.origin,
    cnm.meaning_source,
    cnm.meaning_confidence,
    cnm.meaning_verified,
    cnm.meaning_language
  from public.canonical_name_meanings cnm
  where cnm.canonical_name_id = bn.canonical_name_id
    and cnm.meaning_language = coalesce(nullif(btrim(bn.meaning_language), ''), 'en')
    and cnm.gender_scope in (bn.gender, 'any')
  order by
    case when cnm.gender_scope = bn.gender then 0 else 1 end,
    cnm.meaning_verified desc,
    cnm.meaning_confidence desc nulls last,
    cnm.created_at asc
  limit 1
) best_meaning on true;
