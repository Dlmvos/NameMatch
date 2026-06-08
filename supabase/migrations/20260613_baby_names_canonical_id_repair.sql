-- ============================================================
-- 20260613_baby_names_canonical_id_repair.sql
--
-- Drift-repair: bring production back in line with the canonical-identity
-- layer originally landed in 20260429_canonical_name_identity.sql.
--
-- Observed state on production:
--   * public.canonical_name_meanings exists (may have rows).
--   * public.canonical_names may or may not exist; if it exists it may be
--     under-populated (CNM rows were curated independently).
--   * public.baby_names.canonical_name_id is MISSING — new baby_names rows
--     have no link to canonical identity, breaking the lateral join in
--     baby_names_with_meaning. This is the gap 20260612 detected and skipped.
--   * 37 000+ rows in baby_names.
--
-- This migration is split into nine idempotent stages. Each stage guards
-- against partial prior application via `IF NOT EXISTS`, `ON CONFLICT`, or an
-- `information_schema` probe. Re-running on a fully-converged DB is a no-op.
--
-- Ordering rationale (important — the order is what makes the migration safe
-- under concurrent writes):
--
--   1. Extensions + normalize_name_key function — pure-function, needed by
--      everything else. CREATE OR REPLACE so it's safe even if already there.
--   2. canonical_names table + RLS read policy — created if absent. Existing
--      rows untouched.
--   3. ADD COLUMN canonical_name_id on baby_names (with FK to canonical_names).
--      Adding a nullable FK column is metadata-only — no table rewrite, no
--      lock window beyond a brief ACCESS EXCLUSIVE on the catalog row.
--   4. Seed canonical_names from DISTINCT normalize_name_key(baby_names.name).
--      ON CONFLICT DO NOTHING so existing canonical_names rows are preserved.
--      This must happen BEFORE the trigger goes live so new INSERTs during
--      the migration find their canonical row.
--   5. Install the BEFORE INSERT / BEFORE UPDATE-OF-name trigger so any
--      concurrent writes during the backfill auto-populate canonical_name_id.
--      The trigger function is defensive: if a canonical row is somehow
--      missing for a brand-new name, it creates one in-place.
--   6. Batched backfill of existing baby_names.canonical_name_id rows —
--      5 000 rows per loop, exit when no nulls remain. Keeps lock windows
--      short on 37k+ tables and means the migration is restartable if it
--      gets killed midway.
--   7. Index idx_baby_names_canonical_name_id (built once, after backfill,
--      so the index isn't being rewritten during the bulk UPDATE).
--   8. View rewrite — same shape and behavior as the conditional in
--      20260612_meaning_enrichment_priority.sql (English fallback,
--      source_priority ordering, review_status filter). We re-emit it here
--      so this migration is self-sufficient even if 20260612 was applied
--      with the view rewrite skipped because canonical_name_id was missing.
--   9. NOTIFY pgrst — refresh the PostgREST schema cache so the view's
--      changed lateral lookup is visible to the API immediately.
--
-- Out of scope (intentionally — keeps the diff tight):
--   * Backfilling canonical_name_meanings from baby_names.meaning. Production
--     already has curated CNM rows; the original 20260429 backfill is not
--     replayed because it would risk re-introducing now-stale meanings or
--     conflicting source_priority defaults.
--   * Touching the source_priority / review_status / context columns or the
--     index added in 20260612 — that migration already handles them
--     idempotently. Re-run 20260612 AFTER this one if it was previously
--     skipped at the view-rewrite step.
-- ============================================================

-- ── 1. Extensions + normalize_name_key ──────────────────────────────────────
-- The function may already exist (from 20260429); CREATE OR REPLACE makes
-- the redefinition a no-op when its body is unchanged.
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
create table if not exists public.canonical_names (
  id uuid primary key default uuid_generate_v4(),
  normalized_key text not null unique check (btrim(normalized_key) <> ''),
  display_name text not null check (btrim(display_name) <> ''),
  created_at timestamptz not null default now()
);

alter table public.canonical_names enable row level security;

drop policy if exists "canonical_names readable" on public.canonical_names;
create policy "canonical_names readable"
  on public.canonical_names for select
  using (true);

-- ── 3. baby_names.canonical_name_id column ──────────────────────────────────
-- Added nullable with FK + ON DELETE SET NULL — adding a nullable FK column
-- to an existing table is metadata-only in Postgres (no rewrite, no full
-- table scan), so this is safe on 37k+ rows. The backfill happens in §6.
alter table public.baby_names
  add column if not exists canonical_name_id uuid references public.canonical_names(id) on delete set null;

-- ── 4. Seed canonical_names from baby_names ─────────────────────────────────
-- Insert distinct normalized keys with a deterministic display_name (most
-- popular casing wins; ties broken by shortest then alphabetic). Must run
-- BEFORE the trigger is installed so concurrent INSERTs during this seed
-- don't observe a partial table. Idempotent via ON CONFLICT DO NOTHING.
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

-- ── 5. Trigger to keep canonical_name_id current on new writes ──────────────
-- Fires BEFORE INSERT (always) and BEFORE UPDATE OF name (only when the
-- linguistic identity could change). On update, we DO NOT re-assign if the
-- caller explicitly provided a non-NULL canonical_name_id — that lets one-off
-- repair scripts override the trigger when they know better.
--
-- The function is defensive against a name whose canonical row doesn't
-- exist yet (e.g. a freshly-imported variant that wasn't in §4's seed):
-- it inserts the missing canonical_names row in the same statement, so the
-- trigger never causes an INSERT to fail.
create or replace function public.babynames_assign_canonical_id()
returns trigger
language plpgsql
as $$
declare
  v_key text;
  v_id  uuid;
begin
  -- Skip assignment if the caller already set a canonical_name_id explicitly.
  -- Lets backfill/repair scripts pass an id without the trigger clobbering it.
  if tg_op = 'INSERT' and new.canonical_name_id is not null then
    return new;
  end if;

  v_key := public.normalize_name_key(new.name);

  if v_key is null then
    new.canonical_name_id := null;
    return new;
  end if;

  select id into v_id
  from public.canonical_names
  where normalized_key = v_key;

  if v_id is null then
    insert into public.canonical_names (normalized_key, display_name)
    values (v_key, btrim(new.name))
    on conflict (normalized_key) do update
      set normalized_key = excluded.normalized_key  -- no-op; returns id
    returning id into v_id;
  end if;

  new.canonical_name_id := v_id;
  return new;
end;
$$;

drop trigger if exists trg_baby_names_assign_canonical_id on public.baby_names;
create trigger trg_baby_names_assign_canonical_id
  before insert or update of name on public.baby_names
  for each row
  execute function public.babynames_assign_canonical_id();

-- ── 6. Batched backfill of existing rows ────────────────────────────────────
-- 5 000 rows per batch — each batch holds ROW EXCLUSIVE briefly, releases,
-- and lets concurrent INSERT/UPDATE work happen between batches. Restartable:
-- a killed migration just resumes from the next NULL set on re-run.
do $$
declare
  batch_size constant int := 5000;
  rows_updated int;
  loop_guard int := 0;
begin
  loop
    loop_guard := loop_guard + 1;
    -- Hard cap on iterations so a runaway loop (e.g. a name that never
    -- resolves) can't pin the migration indefinitely. 5000 * 1000 = 5M rows,
    -- ~135x the current table size — more than enough headroom.
    exit when loop_guard > 1000;

    with batch as (
      select bn.id
      from public.baby_names bn
      where bn.canonical_name_id is null
      limit batch_size
      for update of bn skip locked
    )
    update public.baby_names bn
    set canonical_name_id = cn.id
    from batch
    join public.canonical_names cn
      on cn.normalized_key = public.normalize_name_key(
           (select name from public.baby_names where id = batch.id)
         )
    where bn.id = batch.id;

    get diagnostics rows_updated = row_count;
    exit when rows_updated = 0;

    -- Yield to any waiters between batches; effectively gives concurrent
    -- transactions a chance to acquire row locks on the just-updated set.
    perform pg_sleep(0);
  end loop;

  -- Report final state for migration log readers.
  raise notice
    '20260613: backfill complete; % rows in baby_names still have canonical_name_id IS NULL (expected 0 for names normalize_name_key cannot key, e.g. all-whitespace)',
    (select count(*) from public.baby_names where canonical_name_id is null);
end
$$;

-- ── 7. Index ────────────────────────────────────────────────────────────────
-- Built after the bulk UPDATE so the index isn't being rewritten during the
-- backfill. CONCURRENTLY would be nicer but cannot run inside a transaction
-- block (and migrations are wrapped in BEGIN/COMMIT by the Supabase CLI);
-- 37k rows builds in well under a second.
create index if not exists idx_baby_names_canonical_name_id
  on public.baby_names (canonical_name_id);

-- ── 8. View rewrite ─────────────────────────────────────────────────────────
-- Now that canonical_name_id is guaranteed present, install the same view
-- 20260612 would have installed had it not been skipped. The branching on
-- canonical_name_meanings.origin mirrors 20260612 so the conditional remains
-- the single source of truth for that detail. Identical SELECT-list to
-- 20260429 so PostgREST schema + app types are unchanged.
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
-- Tells Supabase's PostgREST instance to reload its schema introspection so
-- the rewritten view + new column on baby_names show up immediately. NOTIFY
-- is fire-and-forget; a missing listener is silently ignored.
notify pgrst, 'reload schema';
