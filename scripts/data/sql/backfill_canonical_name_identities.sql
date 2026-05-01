-- Idempotent canonical identity backfill.
-- Run after 20260429_canonical_name_identity.sql and after future baby_names imports.

begin;

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

commit;
