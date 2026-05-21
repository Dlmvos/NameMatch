-- Inherited meaning/metadata for user-authored Custom rows (bundled lookup is client-side;
-- DB lookup respects RLS via SECURITY INVOKER).

begin;

-- Case/whitespace-normalized template row for a display name (prefers catalog over Custom-origin).
create or replace function public.peek_baby_name_meaning_template(p_name text)
returns table (
  meaning text,
  origin text,
  meaning_source text,
  meaning_confidence numeric,
  meaning_verified boolean,
  meaning_language text
)
language sql
security invoker
set search_path = ''
as $$
  select
    bn.meaning,
    bn.origin,
    bn.meaning_source,
    bn.meaning_confidence,
    bn.meaning_verified,
    bn.meaning_language
  from public.baby_names bn
  where lower(btrim(bn.name)) = lower(btrim(coalesce(p_name, '')))
    and lower(btrim(coalesce(p_name, ''))) <> ''
  order by
    case when lower(btrim(coalesce(bn.origin, ''))) = 'custom' then 1 else 0 end,
    bn.popularity_rank nulls last
  limit 1;
$$;

revoke all on function public.peek_baby_name_meaning_template(text) from public;
revoke all on function public.peek_baby_name_meaning_template(text) from anon;
grant execute on function public.peek_baby_name_meaning_template(text) to authenticated;

-- Replace 5-arg create_custom_name with optional inherited meaning columns (defaults unchanged).
drop function if exists public.create_custom_name(text, text, uuid, text, text);

create or replace function public.create_custom_name(
  p_name text,
  p_gender text,
  p_room_id uuid,
  p_region text,
  p_country text,
  p_meaning text default '',
  p_origin text default 'Custom',
  p_meaning_source text default null,
  p_meaning_confidence numeric default null,
  p_meaning_verified boolean default false,
  p_meaning_language text default null
)
returns public.baby_names
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_room public.rooms;
  v_trim text := btrim(coalesce(p_name, ''));
  v_country text := nullif(btrim(coalesce(p_country, '')), '');
  v_meaning text := left(coalesce(p_meaning, ''), 4000);
  v_origin text;
  v_row public.baby_names;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if length(v_trim) = 0 or length(v_trim) > 120 then
    raise exception 'Invalid name';
  end if;

  if p_gender not in ('boy', 'girl', 'neutral') then
    raise exception 'Invalid gender';
  end if;

  if p_region not in ('EU', 'US', 'ARABIA', 'MENA', 'ASIA', 'LATIN_AMERICA', 'WORLDWIDE') then
    raise exception 'Invalid region';
  end if;

  if lower(btrim(coalesce(p_origin, 'Custom'))) = 'custom' then
    v_origin := 'Custom';
  else
    v_origin := left(btrim(coalesce(p_origin, 'Custom')), 500);
    if length(v_origin) = 0 then
      v_origin := 'Custom';
    end if;
  end if;

  select * into v_room from public.rooms where id = p_room_id;

  if v_room.id is null then
    raise exception 'Room not found';
  end if;

  if v_room.user1_id is distinct from v_uid and v_room.user2_id is distinct from v_uid then
    raise exception 'Not a room member';
  end if;

  insert into public.baby_names (
    name,
    meaning,
    origin,
    gender,
    country,
    region,
    is_worldwide,
    is_premium,
    meaning_source,
    meaning_confidence,
    meaning_verified,
    meaning_language
  )
  values (
    v_trim,
    coalesce(nullif(btrim(v_meaning), ''), ''),
    v_origin,
    p_gender,
    v_country,
    p_region,
    false,
    false,
    nullif(btrim(coalesce(p_meaning_source, '')), ''),
    p_meaning_confidence,
    coalesce(p_meaning_verified, false),
    nullif(btrim(coalesce(p_meaning_language, '')), '')
  )
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.create_custom_name(
  text, text, uuid, text, text, text, text, text, numeric, boolean, text
) from public;
revoke all on function public.create_custom_name(
  text, text, uuid, text, text, text, text, text, numeric, boolean, text
) from anon;
grant execute on function public.create_custom_name(
  text, text, uuid, text, text, text, text, text, numeric, boolean, text
) to authenticated;

commit;
