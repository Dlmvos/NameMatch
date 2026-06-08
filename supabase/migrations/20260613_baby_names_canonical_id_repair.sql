-- ============================================================
-- 20260613_baby_names_canonical_id_repair.sql
--
-- Drift-repair: link baby_names → canonical_names and restore the
-- baby_names_with_meaning view join path.
--
-- Remote schema drift (production):
--   * canonical_names columns: id, normalized_name, display_name, gender,
--     created_at, updated_at — NO normalized_key (local 20260429 used
--     normalized_key instead).
--   * canonical_name_meanings exists; may lack origin column.
--   * baby_names.canonical_name_id missing until this migration runs.
--
-- Canonical key column resolution (no normalized_key added to production):
--   1. Prefer normalized_name when present (production shape).
--   2. Fall back to normalized_key only on older local DBs from 20260429.
--   3. Fresh installs create the production shape (normalized_name).
--
-- Idempotent stages — safe after partial failure:
--   1. normalize_name_key function
--   2. canonical_names table / optional column patches / RLS
--   3. baby_names.canonical_name_id FK column
--   4. Seed canonical_names from baby_names (ON CONFLICT DO NOTHING)
--   5. Trigger to assign canonical_name_id on insert / name update
--   6. Batched backfill of existing baby_names rows
--   7. Index on baby_names.canonical_name_id
--   8. baby_names_with_meaning view rewrite (cnm.origin only if present)
--   9. NOTIFY pgrst reload schema
-- ============================================================

-- ── 1. Extensions + normalize_name_key ──────────────────────────────────────
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

-- ── 2. canonical_names table + RLS ──────────────────────────────────────────
-- Production shape when the table is absent. When canonical_names already
-- exists (remote), CREATE TABLE IF NOT EXISTS is a no-op — existing rows and
-- normalized_name values are preserved.
create table if not exists public.canonical_names (
  id uuid primary key default uuid_generate_v4(),
  normalized_name text not null unique check (btrim(normalized_name) <> ''),
  display_name text not null check (btrim(display_name) <> ''),
  gender text,
  created_at timestamptz not null default now(),
  updated_at timestamptz default now()
);

-- Optional columns on drifted layouts; never drops or renames existing data.
alter table public.canonical_names add column if not exists gender text;
alter table public.canonical_names add column if not exists updated_at timestamptz default now();

-- Intentionally do NOT add normalized_key to production remotes. Local 20260429
-- databases that already have normalized_key continue to use that column via
-- the branching helpers below.

alter table public.canonical_names enable row level security;

drop policy if exists "canonical_names readable" on public.canonical_names;
create policy "canonical_names readable"
  on public.canonical_names for select
  using (true);

-- ── 3. baby_names.canonical_name_id column ──────────────────────────────────
alter table public.baby_names
  add column if not exists canonical_name_id uuid references public.canonical_names(id) on delete set null;

-- ── Helper: resolve canonical_names.id for a normalized key ─────────────────
-- Uses normalized_name on production; falls back to normalized_key on local
-- 20260429-shaped databases. Upserts a row when missing (trigger/backfill safe).
create or replace function public.canonical_names_ensure_id(
  p_normalized text,
  p_display_name text,
  p_gender text default null
)
returns uuid
language plpgsql
as $$
declare
  v_id uuid;
  v_has_normalized_name boolean;
  v_has_normalized_key boolean;
  v_has_gender boolean;
begin
  if p_normalized is null or btrim(p_normalized) = '' then
    return null;
  end if;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'canonical_names'
      and column_name = 'normalized_name'
  ) into v_has_normalized_name;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'canonical_names'
      and column_name = 'normalized_key'
  ) into v_has_normalized_key;

  if v_has_normalized_name then
    select id into v_id
    from public.canonical_names
    where normalized_name = p_normalized;

    if v_id is not null then
      return v_id;
    end if;

    select exists (
      select 1 from information_schema.columns
      where table_schema = 'public'
        and table_name = 'canonical_names'
        and column_name = 'gender'
    ) into v_has_gender;

    if v_has_gender then
      insert into public.canonical_names (normalized_name, display_name, gender)
      values (p_normalized, p_display_name, p_gender)
      on conflict (normalized_name) do update
        set normalized_name = excluded.normalized_name
      returning id into v_id;
    else
      insert into public.canonical_names (normalized_name, display_name)
      values (p_normalized, p_display_name)
      on conflict (normalized_name) do update
        set normalized_name = excluded.normalized_name
      returning id into v_id;
    end if;

    return v_id;
  end if;

  if v_has_normalized_key then
    select id into v_id
    from public.canonical_names
    where normalized_key = p_normalized;

    if v_id is not null then
      return v_id;
    end if;

    insert into public.canonical_names (normalized_key, display_name)
    values (p_normalized, p_display_name)
    on conflict (normalized_key) do update
      set normalized_key = excluded.normalized_key
    returning id into v_id;

    return v_id;
  end if;

  raise exception 'canonical_names has neither normalized_name nor normalized_key';
end;
$$;

-- ── 4. Seed canonical_names from baby_names ─────────────────────────────────
do $seed$
declare
  v_has_normalized_name boolean;
  v_has_normalized_key boolean;
  v_has_gender boolean;
begin
  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'canonical_names'
      and column_name = 'normalized_name'
  ) into v_has_normalized_name;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'canonical_names'
      and column_name = 'normalized_key'
  ) into v_has_normalized_key;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'canonical_names'
      and column_name = 'gender'
  ) into v_has_gender;

  if v_has_normalized_name then
    if v_has_gender then
      execute $sql$
        insert into public.canonical_names (normalized_name, display_name, gender)
        select normalized_name, display_name, gender
        from (
          select
            public.normalize_name_key(name) as normalized_name,
            (array_agg(name order by popularity_rank nulls last, length(name), name))[1] as display_name,
            (array_agg(gender order by popularity_rank nulls last, length(name), name))[1] as gender
          from public.baby_names
          where public.normalize_name_key(name) is not null
          group by public.normalize_name_key(name)
        ) names
        where normalized_name is not null
        on conflict (normalized_name) do nothing
      $sql$;
    else
      execute $sql$
        insert into public.canonical_names (normalized_name, display_name)
        select normalized_name, display_name
        from (
          select
            public.normalize_name_key(name) as normalized_name,
            (array_agg(name order by popularity_rank nulls last, length(name), name))[1] as display_name
          from public.baby_names
          where public.normalize_name_key(name) is not null
          group by public.normalize_name_key(name)
        ) names
        where normalized_name is not null
        on conflict (normalized_name) do nothing
      $sql$;
    end if;
  elsif v_has_normalized_key then
    execute $sql$
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
      on conflict (normalized_key) do nothing
    $sql$;
  else
    raise exception 'canonical_names has neither normalized_name nor normalized_key — cannot seed';
  end if;
end
$seed$;

-- ── 5. Trigger to keep canonical_name_id current on new writes ─────────────
create or replace function public.babynames_assign_canonical_id()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' and new.canonical_name_id is not null then
    return new;
  end if;

  new.canonical_name_id := public.canonical_names_ensure_id(
    public.normalize_name_key(new.name),
    btrim(new.name),
    new.gender
  );

  return new;
end;
$$;

drop trigger if exists trg_baby_names_assign_canonical_id on public.baby_names;
create trigger trg_baby_names_assign_canonical_id
  before insert or update of name on public.baby_names
  for each row
  execute function public.babynames_assign_canonical_id();

-- ── 6. Batched backfill of existing rows ────────────────────────────────────
do $$
declare
  batch_size constant int := 5000;
  rows_updated int;
  loop_guard int := 0;
begin
  loop
    loop_guard := loop_guard + 1;
    exit when loop_guard > 1000;

    with batch as (
      select bn.id
      from public.baby_names bn
      where bn.canonical_name_id is null
      limit batch_size
      for update of bn skip locked
    )
    update public.baby_names bn
    set canonical_name_id = public.canonical_names_ensure_id(
      public.normalize_name_key(bn.name),
      btrim(bn.name),
      bn.gender
    )
    from batch
    where bn.id = batch.id
      and public.normalize_name_key(bn.name) is not null;

    get diagnostics rows_updated = row_count;
    exit when rows_updated = 0;

    perform pg_sleep(0);
  end loop;

  raise notice
    '20260613: backfill complete; % rows in baby_names still have canonical_name_id IS NULL (expected 0 except un-normalizable names)',
    (select count(*) from public.baby_names where canonical_name_id is null);
end
$$;

-- ── 7. Index ────────────────────────────────────────────────────────────────
create index if not exists idx_baby_names_canonical_name_id
  on public.baby_names (canonical_name_id);

-- ── 8. View rewrite ─────────────────────────────────────────────────────────
-- Same shape as 20260612 / 20260429. Never references cnm.origin unless present.
do $migration$
declare
  has_cnm_origin boolean;
begin
  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'canonical_name_meanings'
      and column_name = 'origin'
  ) into has_cnm_origin;

  if has_cnm_origin then
    execute $view$
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
  with
    requested as (
      select coalesce(nullif(btrim(bn.meaning_language), ''), 'en') as lang
    )
  select
    cnm.meaning,
    cnm.origin,
    cnm.meaning_source,
    cnm.meaning_confidence,
    cnm.meaning_verified,
    cnm.meaning_language
  from public.canonical_name_meanings cnm
  cross join requested
  where cnm.canonical_name_id = bn.canonical_name_id
    and (cnm.review_status is null or cnm.review_status <> 'rejected')
    and cnm.gender_scope in (bn.gender, 'any')
    and cnm.meaning_language in (requested.lang, 'en')
  order by
    case when cnm.meaning_language = requested.lang then 0 else 1 end,
    case when cnm.gender_scope = bn.gender then 0 else 1 end,
    coalesce(cnm.source_priority, 5) asc,
    cnm.meaning_verified desc,
    cnm.meaning_confidence desc nulls last,
    cnm.created_at asc
  limit 1
) best_meaning on true
    $view$;
  else
    execute $view$
create or replace view public.baby_names_with_meaning
with (security_invoker = true)
as
select
  bn.id,
  bn.name,
  coalesce(nullif(btrim(bn.meaning), ''), best_meaning.meaning) as meaning,
  nullif(btrim(bn.origin), '') as origin,
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
  with
    requested as (
      select coalesce(nullif(btrim(bn.meaning_language), ''), 'en') as lang
    )
  select
    cnm.meaning,
    cnm.meaning_source,
    cnm.meaning_confidence,
    cnm.meaning_verified,
    cnm.meaning_language
  from public.canonical_name_meanings cnm
  cross join requested
  where cnm.canonical_name_id = bn.canonical_name_id
    and (cnm.review_status is null or cnm.review_status <> 'rejected')
    and cnm.gender_scope in (bn.gender, 'any')
    and cnm.meaning_language in (requested.lang, 'en')
  order by
    case when cnm.meaning_language = requested.lang then 0 else 1 end,
    case when cnm.gender_scope = bn.gender then 0 else 1 end,
    coalesce(cnm.source_priority, 5) asc,
    cnm.meaning_verified desc,
    cnm.meaning_confidence desc nulls last,
    cnm.created_at asc
  limit 1
) best_meaning on true
    $view$;
  end if;
end
$migration$;

-- ── 9. PostgREST schema cache refresh ───────────────────────────────────────
notify pgrst, 'reload schema';
