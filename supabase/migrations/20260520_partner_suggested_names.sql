-- Partner-suggested custom names: deterministic identity for deck surfacing
-- (+ realtime INSERT on swipes for co-present clients).
--
-- Context: inherited meaning/origin paths could store catalog origins ('Hebrew', …).
-- Queries that filter origin = 'Custom' then skipped partner-inserted rows.

begin;

alter table public.baby_names
  add column if not exists suggested_by_user_id uuid references public.profiles(id) on delete set null;

create index if not exists idx_baby_names_suggested_by_user_id
  on public.baby_names(suggested_by_user_id)
  where suggested_by_user_id is not null;

-- Backfill: partner right-swipe rows pointing at legacy non-Custom origins (inherited meanings).
update public.baby_names bn
set suggested_by_user_id = s.user_id
from public.swipes s
inner join public.rooms r on r.id = s.room_id
where s.direction = 'right'
  and s.name_id::text = bn.id::text
  and coalesce(bn.is_premium, false) = false
  and bn.suggested_by_user_id is null
  and lower(btrim(coalesce(bn.origin, ''))) <> 'custom'
  and (s.user_id = r.user1_id or s.user_id = r.user2_id);

-- Idempotent-ish: replayable migrations shouldn't fail when swipes already published.
DO $$
BEGIN
  alter publication supabase_realtime add table public.swipes;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- Replace create_custom_name: always canonical Custom origin + proposer FK.
drop function if exists public.create_custom_name(text, text, uuid, text, text);
drop function if exists public.create_custom_name(
  text, text, uuid, text, text, text, text, text, numeric, boolean, text
);

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
    meaning_language,
    suggested_by_user_id
  )
  values (
    v_trim,
    coalesce(nullif(btrim(v_meaning), ''), ''),
    'Custom',
    p_gender,
    v_country,
    p_region,
    false,
    false,
    nullif(btrim(coalesce(p_meaning_source, '')), ''),
    p_meaning_confidence,
    coalesce(p_meaning_verified, false),
    nullif(btrim(coalesce(p_meaning_language, '')), ''),
    v_uid
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
