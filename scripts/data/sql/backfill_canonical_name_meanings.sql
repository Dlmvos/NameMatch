-- Idempotent canonical meaning backfill from the current baby_names cache.
-- Preserves source/confidence/verified metadata and does not change baby_names rows.

begin;

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

commit;
