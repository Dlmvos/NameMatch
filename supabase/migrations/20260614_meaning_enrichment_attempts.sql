-- ============================================================
-- 20260614_meaning_enrichment_attempts.sql
--
-- Attempt ledger + negative cache for the canonical meaning-enrichment
-- pipeline. One row per (canonical_name, language, gender_scope, source).
--
-- Purpose:
--   * Record every enrichment probe against an external source (Wikidata,
--     dictionary API, LLM batch job, etc.) without mutating
--     canonical_name_meanings or baby_names.
--   * Negative cache: when a source definitively has no entry (outcome
--     'miss'), store the attempt so workers skip re-querying until
--     retry_after (if set) or indefinitely (retry_after NULL on 'miss').
--   * Transient failures (outcome 'error') set retry_after to a future
--     timestamp — gap-check workers only re-attempt once retry_after <= now().
--   * Success (outcome 'success') marks the slot as satisfied; the worker
--     should have written the CNM row separately. This table does not
--     duplicate CNM payloads.
--
-- Production schema alignment:
--   * FK targets public.canonical_names(id). Production canonical identity
--     uses canonical_names.normalized_name (NOT normalized_key). This
--     migration does not reference normalized_key and does not alter
--     canonical_names, canonical_name_meanings, or baby_names.
--
-- Retry semantics (application-level; enforced via retry_after + outcome):
--   success  — CNM row expected; no further attempts for this slot unless
--              manually cleared.
--   miss     — Authoritative empty result. Negative cache. retry_after NULL
--              = permanent skip; non-NULL = re-probe after that instant.
--   error    — Transient failure (HTTP 429, timeout). retry_after SHOULD be
--              set to now() + backoff; worker retries when expired.
--   skipped  — Pipeline chose not to run (budget, manual hold, pre-check).
--              retry_after optional; NULL = skip until row deleted/updated.
--
-- Idempotent: safe to re-run after partial failure.
-- ============================================================

-- ── 1. Table ────────────────────────────────────────────────────────────────
create table if not exists public.canonical_name_meaning_attempts (
  id uuid primary key default uuid_generate_v4(),
  canonical_name_id uuid not null references public.canonical_names(id) on delete cascade,
  meaning_language text not null,
  gender_scope text not null,
  source text not null,
  outcome text not null,
  attempted_at timestamptz not null default now(),
  retry_after timestamptz,
  context jsonb not null default '{}'::jsonb
);

-- Backfill defaults if a partial run created nullable columns (defensive).
update public.canonical_name_meaning_attempts
set context = '{}'::jsonb
where context is null;

update public.canonical_name_meaning_attempts
set attempted_at = now()
where attempted_at is null;

-- Tighten NOT NULL on context / attempted_at when still nullable.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'canonical_name_meaning_attempts'
      and column_name = 'context'
      and is_nullable = 'YES'
  ) then
    alter table public.canonical_name_meaning_attempts
      alter column context set not null,
      alter column context set default '{}'::jsonb;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'canonical_name_meaning_attempts'
      and column_name = 'attempted_at'
      and is_nullable = 'YES'
  ) then
    alter table public.canonical_name_meaning_attempts
      alter column attempted_at set not null,
      alter column attempted_at set default now();
  end if;
end
$$;

-- ── 2. CHECK constraints (guarded) ──────────────────────────────────────────
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'canonical_name_meaning_attempts_gender_scope_check'
  ) then
    alter table public.canonical_name_meaning_attempts
      add constraint canonical_name_meaning_attempts_gender_scope_check
      check (gender_scope in ('any', 'boy', 'girl', 'neutral'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'canonical_name_meaning_attempts_outcome_check'
  ) then
    alter table public.canonical_name_meaning_attempts
      add constraint canonical_name_meaning_attempts_outcome_check
      check (outcome in ('success', 'miss', 'error', 'skipped'));
  end if;
end
$$;

-- ── 3. Unique constraint (one attempt record per enrichment slot) ───────────
create unique index if not exists idx_canonical_name_meaning_attempts_slot_unique
  on public.canonical_name_meaning_attempts (
    canonical_name_id,
    meaning_language,
    gender_scope,
    source
  );

-- ── 4. Gap-check index ──────────────────────────────────────────────────────
-- Partial index for worker gap scans: find blocking attempts whose negative
-- cache / backoff has expired (retry_after IS NULL OR retry_after <= now()).
-- Non-success outcomes only — 'success' rows are satisfied slots.
create index if not exists idx_canonical_name_meaning_attempts_gap_check
  on public.canonical_name_meaning_attempts (
    retry_after asc nulls first,
    attempted_at desc
  )
  where outcome in ('miss', 'error', 'skipped');

-- ── 5. RLS + read policy ────────────────────────────────────────────────────
alter table public.canonical_name_meaning_attempts enable row level security;

drop policy if exists "cnma readable" on public.canonical_name_meaning_attempts;
create policy "cnma readable"
  on public.canonical_name_meaning_attempts for select
  using (true);

comment on table public.canonical_name_meaning_attempts is
  'Per-source enrichment attempt ledger and negative cache. One row per (canonical_name_id, meaning_language, gender_scope, source). Does not store meanings — see canonical_name_meanings.';

comment on column public.canonical_name_meaning_attempts.outcome is
  'success | miss (negative cache) | error (transient, use retry_after) | skipped (pipeline hold).';

comment on column public.canonical_name_meaning_attempts.retry_after is
  'Earliest time a worker may re-attempt this slot. NULL on miss = permanent negative cache; NULL on error = worker-defined.';

comment on column public.canonical_name_meaning_attempts.context is
  'Audit metadata: HTTP status, model id, prompt version, raw error, source URL. Default {}.';
