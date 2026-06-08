-- ============================================================
-- 20260616_canonical_meaning_unique_index_repair.sql
--
-- Repairs the UPSERT conflict target required by
-- public.apply_canonical_meaning_enrichment (20260615):
--
--   unique (canonical_name_id, meaning_language, gender_scope,
--           meaning, meaning_source)
--
-- Remote production may have canonical_name_meanings without
-- idx_canonical_name_meanings_source_unique when:
--   * 20260429 partially failed, or
--   * duplicate rows blocked index creation.
--
-- This migration is idempotent and safe to re-run:
--   1. Skip if canonical_name_meanings is absent.
--   2. Report duplicate groups (NOTICE).
--   3. Merge monotonic fields into the deterministic keeper row.
--   4. Delete excess duplicate rows.
--   5. CREATE UNIQUE INDEX IF NOT EXISTS.
--
-- Keeper selection + merge rules mirror apply_canonical_meaning_enrichment:
--   meaning_confidence → GREATEST
--   meaning_verified   → OR
--   source_priority    → LEAST (when column present)
--   context            → keeper || dup keys (when column present)
-- ============================================================

do $cnm_unique_index_repair$
declare
  has_cnm           boolean;
  has_cnm_priority  boolean;
  has_cnm_review    boolean;
  has_cnm_context   boolean;
  has_unique_index  boolean;
  dup_group_count   bigint;
  dup_excess_rows   bigint;
begin
  select exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'canonical_name_meanings'
  ) into has_cnm;

  if not has_cnm then
    raise notice '20260616: skipping — public.canonical_name_meanings missing';
    return;
  end if;

  select exists (
    select 1 from pg_indexes
    where schemaname = 'public'
      and tablename = 'canonical_name_meanings'
      and indexname = 'idx_canonical_name_meanings_source_unique'
  ) into has_unique_index;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'canonical_name_meanings'
      and column_name = 'source_priority'
  ) into has_cnm_priority;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'canonical_name_meanings'
      and column_name = 'review_status'
  ) into has_cnm_review;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'canonical_name_meanings'
      and column_name = 'context'
  ) into has_cnm_context;

  select count(*) into dup_group_count
  from (
    select 1
    from public.canonical_name_meanings
    group by canonical_name_id, meaning_language, gender_scope, meaning, meaning_source
    having count(*) > 1
  ) dup_groups;

  select coalesce(sum(cnt - 1), 0) into dup_excess_rows
  from (
    select count(*) as cnt
    from public.canonical_name_meanings
    group by canonical_name_id, meaning_language, gender_scope, meaning, meaning_source
    having count(*) > 1
  ) dup_counts;

  if has_unique_index and dup_group_count = 0 then
    raise notice '20260616: idx_canonical_name_meanings_source_unique already present — no duplicates — nothing to do';
    return;
  end if;

  if dup_group_count > 0 then
    raise notice
      '20260616: canonical_name_meanings duplicate groups=% excess_rows=% — merging into keeper then deleting',
      dup_group_count, dup_excess_rows;

    if has_cnm_priority and has_cnm_review and has_cnm_context then
      execute $dedupe$
        with ranked as (
          select
            id,
            row_number() over (
              partition by canonical_name_id, meaning_language, gender_scope, meaning, meaning_source
              order by
                meaning_verified desc,
                coalesce(meaning_confidence, 0) desc,
                coalesce(source_priority, 9) asc,
                case review_status
                  when 'approved' then 0
                  when 'auto' then 1
                  when 'flagged' then 2
                  else 3
                end,
                created_at asc,
                id asc
            ) as rn
          from public.canonical_name_meanings
        ),
        keepers as (
          select id as keeper_id
          from ranked
          where rn = 1
        ),
        agg as (
          select
            k.keeper_id,
            max(coalesce(c.meaning_confidence, 0)) as max_confidence,
            bool_or(c.meaning_verified) as any_verified,
            min(coalesce(c.source_priority, 9)) as min_priority
          from keepers k
          join public.canonical_name_meanings keeper on keeper.id = k.keeper_id
          join public.canonical_name_meanings c
            on c.canonical_name_id = keeper.canonical_name_id
           and c.meaning_language = keeper.meaning_language
           and c.gender_scope = keeper.gender_scope
           and c.meaning = keeper.meaning
           and c.meaning_source = keeper.meaning_source
          group by k.keeper_id
        )
        update public.canonical_name_meanings c
        set
          meaning_confidence = greatest(coalesce(c.meaning_confidence, 0), a.max_confidence),
          meaning_verified = c.meaning_verified or a.any_verified,
          source_priority = least(coalesce(c.source_priority, 9), a.min_priority),
          context = coalesce(c.context, '{}'::jsonb) || coalesce((
            select coalesce(jsonb_object_agg(e.key, e.value), '{}'::jsonb)
            from public.canonical_name_meanings keeper
            join public.canonical_name_meanings dup
              on dup.canonical_name_id = keeper.canonical_name_id
             and dup.meaning_language = keeper.meaning_language
             and dup.gender_scope = keeper.gender_scope
             and dup.meaning = keeper.meaning
             and dup.meaning_source = keeper.meaning_source
            cross join lateral jsonb_each(coalesce(dup.context, '{}'::jsonb)) as e(key, value)
            where keeper.id = c.id
              and dup.id <> c.id
          ), '{}'::jsonb)
        from agg a
        where c.id = a.keeper_id;

        with ranked as (
          select
            id,
            row_number() over (
              partition by canonical_name_id, meaning_language, gender_scope, meaning, meaning_source
              order by
                meaning_verified desc,
                coalesce(meaning_confidence, 0) desc,
                coalesce(source_priority, 9) asc,
                case review_status
                  when 'approved' then 0
                  when 'auto' then 1
                  when 'flagged' then 2
                  else 3
                end,
                created_at asc,
                id asc
            ) as rn
          from public.canonical_name_meanings
        )
        delete from public.canonical_name_meanings c
        using ranked r
        where c.id = r.id
          and r.rn > 1;
      $dedupe$;
    else
      execute $dedupe$
        with ranked as (
          select
            id,
            row_number() over (
              partition by canonical_name_id, meaning_language, gender_scope, meaning, meaning_source
              order by
                meaning_verified desc,
                coalesce(meaning_confidence, 0) desc,
                created_at asc,
                id asc
            ) as rn
          from public.canonical_name_meanings
        ),
        keepers as (
          select id as keeper_id
          from ranked
          where rn = 1
        ),
        agg as (
          select
            k.keeper_id,
            max(coalesce(c.meaning_confidence, 0)) as max_confidence,
            bool_or(c.meaning_verified) as any_verified
          from keepers k
          join public.canonical_name_meanings keeper on keeper.id = k.keeper_id
          join public.canonical_name_meanings c
            on c.canonical_name_id = keeper.canonical_name_id
           and c.meaning_language = keeper.meaning_language
           and c.gender_scope = keeper.gender_scope
           and c.meaning = keeper.meaning
           and c.meaning_source = keeper.meaning_source
          group by k.keeper_id
        )
        update public.canonical_name_meanings c
        set
          meaning_confidence = greatest(coalesce(c.meaning_confidence, 0), a.max_confidence),
          meaning_verified = c.meaning_verified or a.any_verified
        from agg a
        where c.id = a.keeper_id;

        with ranked as (
          select
            id,
            row_number() over (
              partition by canonical_name_id, meaning_language, gender_scope, meaning, meaning_source
              order by
                meaning_verified desc,
                coalesce(meaning_confidence, 0) desc,
                created_at asc,
                id asc
            ) as rn
          from public.canonical_name_meanings
        )
        delete from public.canonical_name_meanings c
        using ranked r
        where c.id = r.id
          and r.rn > 1;
      $dedupe$;
    end if;

    select count(*) into dup_group_count
    from (
      select 1
      from public.canonical_name_meanings
      group by canonical_name_id, meaning_language, gender_scope, meaning, meaning_source
      having count(*) > 1
    ) remaining;

    if dup_group_count > 0 then
      raise exception
        '20260616: % duplicate group(s) remain after dedupe — aborting index creation',
        dup_group_count;
    end if;
  end if;

  create unique index if not exists idx_canonical_name_meanings_source_unique
    on public.canonical_name_meanings (
      canonical_name_id,
      meaning_language,
      gender_scope,
      meaning,
      meaning_source
    );

  comment on index public.idx_canonical_name_meanings_source_unique is
    'UPSERT conflict target for apply_canonical_meaning_enrichment — one row per (canonical, language, scope, meaning text, source).';

  raise notice '20260616: idx_canonical_name_meanings_source_unique ensured';
end
$cnm_unique_index_repair$;

notify pgrst, 'reload schema';
