-- ============================================================
-- Daily free-swipe refill (UTC calendar boundaries).
-- Atomically bumps free_swipes_remaining for non-premium users
-- once per UTC day (cap 100; +20 per qualifying day).
-- Premium bypass matches profile packs or room premium_packs.
-- consume_free_swipe calls refill first in the same transaction.
-- SAFE TO RE-RUN: additive column + replace functions / grants.
-- ============================================================

begin;

alter table public.profiles
  add column if not exists free_swipes_last_refill_utc_date date;

-- Legacy rows: first successful maybe_refill after deploy triggers +grant
-- once the UTC calendar rolls past this synthetic "previous day".
update public.profiles
set free_swipes_last_refill_utc_date = (
  (timezone('utc', now()))::date - 1
)
where free_swipes_last_refill_utc_date is null;

create or replace function public.maybe_refill_daily_free_swipes()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_today date := (timezone('utc', now()))::date;
  v_remaining integer;
  v_room_id uuid;
  v_packs text[];
  v_last_ref date;
  v_has_premium boolean := false;
  v_daily_grant integer := 20;
  v_bank_cap integer := 100;
  v_next integer;
begin
  if v_uid is null then
    return null;
  end if;

  select
    p.free_swipes_remaining,
    p.room_id,
    p.purchased_packs,
    p.free_swipes_last_refill_utc_date
    into v_remaining, v_room_id, v_packs, v_last_ref
  from public.profiles p
  where p.id = v_uid
  for update;

  if not found then
    return null;
  end if;

  v_has_premium := cardinality(coalesce(v_packs, '{}'::text[])) > 0;

  if not v_has_premium and v_room_id is not null then
    select cardinality(coalesce(r.premium_packs, '{}'::text[])) > 0
      into v_has_premium
    from public.rooms r
    where r.id = v_room_id;
  end if;

  if v_has_premium then
    return v_remaining;
  end if;

  if v_last_ref is not distinct from v_today then
    return v_remaining;
  end if;

  v_next := least(v_bank_cap, greatest(0, coalesce(v_remaining, 0)) + v_daily_grant);

  update public.profiles
  set free_swipes_remaining = v_next,
      free_swipes_last_refill_utc_date = v_today,
      updated_at = now()
  where id = v_uid;

  return v_next;
end;
$$;

create or replace function public.consume_free_swipe(p_amount integer default 1)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_remaining integer;
  v_amount integer := greatest(1, coalesce(p_amount, 1));
begin
  if auth.uid() is null then
    return null;
  end if;

  perform public.maybe_refill_daily_free_swipes();

  update public.profiles
  set free_swipes_remaining = greatest(0, free_swipes_remaining - v_amount),
      updated_at = now()
  where id = auth.uid()
    and free_swipes_remaining > 0
  returning free_swipes_remaining into v_remaining;

  return v_remaining;
end;
$$;

revoke all on function public.maybe_refill_daily_free_swipes() from public;
revoke all on function public.maybe_refill_daily_free_swipes() from anon;
grant execute on function public.maybe_refill_daily_free_swipes() to authenticated;

revoke all on function public.consume_free_swipe(integer) from public;
revoke all on function public.consume_free_swipe(integer) from anon;
grant execute on function public.consume_free_swipe(integer) to authenticated;

commit;
