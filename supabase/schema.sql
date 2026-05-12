-- ============================================================
-- NameMatch – Supabase Schema
-- Run this in the Supabase SQL editor to set up your database
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  display_name text,
  gender_preference text not null default 'both'
    check (gender_preference in ('boy', 'girl', 'both')),
  region_preference text not null default 'WORLDWIDE'
    check (region_preference in ('EU', 'US', 'ARABIA', 'MENA', 'ASIA', 'LATIN_AMERICA', 'WORLDWIDE')),
  -- Preference inputs used by the mobile app (pricing language/currency + name deck selection).
  -- Kept nullable for backward compatibility; RLS update policy already gates entitlement mutation only.
  country_preference text,
  residence_country text,
  language_preference text,
  room_id uuid,
  free_swipes_remaining integer not null default 100,
  -- UTC calendar date of last daily free-swipe grant; server-owned (RPC).
  free_swipes_last_refill_utc_date date,
  purchased_packs text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS
alter table public.profiles enable row level security;
alter table public.profiles force row level security;

create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    -- Entitlement fields must not be arbitrarily rewritten by clients.
    AND purchased_packs = (
      select p.purchased_packs from public.profiles p where p.id = id
    )
    -- Daily refill stamp is server-owned (RPC sets it); block client tampering.
    AND free_swipes_last_refill_utc_date IS NOT DISTINCT FROM (
      select p.free_swipes_last_refill_utc_date from public.profiles p where p.id = id
    )
    -- Only allow free_swipes_remaining to decrease (never increase).
    AND free_swipes_remaining >= 0
    AND free_swipes_remaining <= (
      select p.free_swipes_remaining from public.profiles p where p.id = id
    )
  );

create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- Trigger to auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'display_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- ROOMS
-- ============================================================
create table public.rooms (
  id uuid primary key default uuid_generate_v4(),
  code text not null unique
    check (code ~ '^[A-HJ-NP-Z2-9]{6}$'),
  user1_id uuid not null references public.profiles(id) on delete cascade,
  user2_id uuid references public.profiles(id) on delete set null,
  premium_packs text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- RLS
alter table public.rooms enable row level security;
alter table public.rooms force row level security;

create policy "Room members can view their room"
  on public.rooms for select
  using (auth.uid() = user1_id or auth.uid() = user2_id);

create policy "Authenticated users can create rooms"
  on public.rooms for insert
  with check (auth.uid() = user1_id);

-- Members can update while they remain members.
drop policy if exists "Room owner or joiner can update room" on public.rooms;
create policy "Room members can update room"
  on public.rooms for update
  using (auth.uid() = user1_id or auth.uid() = user2_id)
  with check (auth.uid() = user1_id or auth.uid() = user2_id);

-- Joiner can claim empty user2 slot, but must not change other fields.
create policy "Joiner can claim empty user2 slot"
  on public.rooms for update
  using (
    user2_id is null
    AND auth.uid() <> user1_id
  )
  with check (
    user2_id = auth.uid()
    AND user1_id = (select r.user1_id from public.rooms r where r.id = id)
    AND code = (select r.code from public.rooms r where r.id = id)
    AND is_active = (select r.is_active from public.rooms r where r.id = id)
  );

-- premium_packs: direct client writes blocked; use grant_room_premium RPC or service_role.
create or replace function public.rooms_guard_premium_packs()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_role text := coalesce(current_setting('request.jwt.claim.role', true), '');
begin
  if v_role = 'service_role' then
    return new;
  end if;
  if coalesce(current_setting('app.internal_grant_room_premium', true), '') = '1' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.premium_packs is distinct from '{}'::text[] then
      raise exception 'rooms.premium_packs: direct insert is not allowed (use default empty array)';
    end if;
    return new;
  end if;

  if new.premium_packs is not distinct from old.premium_packs then
    return new;
  end if;

  raise exception 'rooms.premium_packs: direct update is not allowed (use grant_room_premium RPC)';
end;
$$;

revoke all on function public.rooms_guard_premium_packs() from public;
revoke all on function public.rooms_guard_premium_packs() from anon, authenticated;

drop trigger if exists rooms_guard_premium_packs on public.rooms;
create trigger rooms_guard_premium_packs
  before insert or update of premium_packs on public.rooms
  for each row
  execute function public.rooms_guard_premium_packs();

create or replace function public.grant_room_premium(
  p_room_id uuid,
  p_premium_packs text[]
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_existing text[];
  v_merged text[];
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (
    select 1
    from public.rooms r
    where r.id = p_room_id
      and (r.user1_id = v_uid or r.user2_id = v_uid)
  ) then
    raise exception 'room not found or caller is not a member';
  end if;

  select r.premium_packs
    into v_existing
  from public.rooms r
  where r.id = p_room_id
  for update;

  v_merged := coalesce(
    array(
      select distinct unnest(coalesce(v_existing, '{}'::text[]) || coalesce(p_premium_packs, '{}'::text[]))
    ),
    '{}'::text[]
  );

  if v_merged is not distinct from v_existing then
    return;
  end if;

  perform set_config('app.internal_grant_room_premium', '1', true);

  update public.rooms
  set premium_packs = v_merged
  where id = p_room_id;
end;
$$;

revoke execute on function public.grant_room_premium(uuid, text[]) from public;
revoke execute on function public.grant_room_premium(uuid, text[]) from anon;
grant execute on function public.grant_room_premium(uuid, text[]) to authenticated;

-- Function to generate a unique 6-char room code
create or replace function generate_room_code()
returns text as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code text := '';
  i integer;
begin
  for i in 1..6 loop
    code := code || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  end loop;
  return code;
end;
$$ language plpgsql;

-- ============================================================
-- BABY NAMES
-- ============================================================
create table public.baby_names (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  meaning text,
  origin text,
  gender text not null check (gender in ('boy', 'girl', 'neutral')),
  country text,
  region text not null
    check (region in ('EU', 'US', 'ARABIA', 'MENA', 'ASIA', 'LATIN_AMERICA', 'WORLDWIDE')),
  is_worldwide boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.baby_names enable row level security;
-- SELECT policy is defined after `is_premium` exists (see staged migration section below).

-- ============================================================
-- SWIPES
-- ============================================================
create table public.swipes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  room_id uuid not null references public.rooms(id) on delete cascade,
  name_id uuid not null references public.baby_names(id) on delete cascade,
  direction text not null check (direction in ('left', 'right')),
  created_at timestamptz not null default now(),
  unique(user_id, room_id, name_id)
);

-- RLS
alter table public.swipes enable row level security;
alter table public.swipes force row level security;

create policy "Users can view swipes in their room"
  on public.swipes for select
  using (
    exists (
      select 1 from public.rooms r
      where r.id = room_id
        and (r.user1_id = auth.uid() or r.user2_id = auth.uid())
    )
  );

create policy "Users can insert their own swipes"
  on public.swipes for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own swipes"
  on public.swipes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- MATCHES
-- ============================================================
create table public.matches (
  id uuid primary key default uuid_generate_v4(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  name_id uuid not null references public.baby_names(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(room_id, name_id)
);

-- RLS
alter table public.matches enable row level security;
alter table public.matches force row level security;

create policy "Room members can view their matches"
  on public.matches for select
  using (
    exists (
      select 1 from public.rooms r
      where r.id = room_id
        and (r.user1_id = auth.uid() or r.user2_id = auth.uid())
    )
  );

create policy "Room members can insert matches"
  on public.matches for insert
  with check (
    exists (
      select 1 from public.rooms r
      where r.id = room_id
        and (r.user1_id = auth.uid() or r.user2_id = auth.uid())
    )
  );

-- ============================================================
-- PURCHASES
-- ============================================================
create table public.purchases (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  package_type text not null
    check (package_type in ('country', 'regional', 'worldwide')),
  package_key text not null,  -- e.g. 'EU', 'US', 'WORLDWIDE', 'FRANCE'
  stripe_payment_intent_id text,
  stripe_customer_id text,
  amount_cents integer,
  currency text default 'usd',
  status text not null default 'pending'
    check (status in ('pending', 'succeeded', 'failed')),
  created_at timestamptz not null default now()
);

-- RLS
alter table public.purchases enable row level security;

create policy "Users can view own purchases"
  on public.purchases for select using (auth.uid() = user_id);

create policy "Users can insert own purchases"
  on public.purchases for insert with check (auth.uid() = user_id);

-- ============================================================
-- RPCs: Daily free-swipe refill (UTC) + consume (refill-first, atomic per call)
-- ============================================================
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

create or replace function public.consume_free_swipe(
  p_amount integer default 1
)
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

-- ============================================================
-- FUNCTION: Check & create match after a right-swipe
-- Called from the app after recording a swipe
-- ============================================================
create or replace function public.check_and_create_match(
  p_room_id uuid,
  p_name_id text,
  p_user_id uuid
)
returns boolean as $$
declare
  v_room public.rooms;
  v_user_id uuid;
  v_other_user_id uuid;
  v_user_swiped_right boolean;
  v_other_swiped_right boolean;
begin
  -- Get the room
  select * into v_room from public.rooms where id = p_room_id;

  if v_room.id is null then
    return false;
  end if;

  -- Never trust the client-supplied p_user_id; derive identity from auth.uid().
  v_user_id := auth.uid();
  if v_user_id is null then
    return false;
  end if;

  -- Find the other user
  if v_room.user1_id = v_user_id then
    v_other_user_id := v_room.user2_id;
  elsif v_room.user2_id = v_user_id then
    v_other_user_id := v_room.user1_id;
  else
    return false; -- Invoker isn't a member of this room
  end if;

  if v_other_user_id is null then
    return false; -- Partner hasn't joined yet
  end if;

  -- Hardening: only allow match creation if the caller already swiped right
  -- for this room/name. This reduces reliance on client orchestration/timing.
  select exists(
    select 1 from public.swipes
    where user_id = v_user_id
      and room_id = p_room_id
      and name_id = p_name_id
      and direction = 'right'
  ) into v_user_swiped_right;

  if not v_user_swiped_right then
    return false;
  end if;

  -- Check if the other user also swiped right on this name
  select exists(
    select 1 from public.swipes
    where user_id = v_other_user_id
      and room_id = p_room_id
      and name_id = p_name_id
      and direction = 'right'
  ) into v_other_swiped_right;

  if v_other_swiped_right then
    -- Create match (ignore if already exists)
    insert into public.matches (room_id, name_id)
    values (p_room_id, p_name_id)
    on conflict (room_id, name_id) do nothing;
    return true;
  end if;

  return false;
end;
$$ language plpgsql security definer set search_path = '';

-- ============================================================
-- REALTIME: Enable real-time for matches and rooms
-- ============================================================
alter publication supabase_realtime add table public.matches;
alter publication supabase_realtime add table public.rooms;

-- ============================================================
-- INDEXES for performance
-- ============================================================
create index idx_swipes_room_name on public.swipes(room_id, name_id);
create index idx_swipes_user_room on public.swipes(user_id, room_id);
create index idx_matches_room on public.matches(room_id);
create index if not exists idx_matches_name_id on public.matches(name_id);
create index idx_baby_names_region on public.baby_names(region);
create index idx_baby_names_gender on public.baby_names(gender);
create index idx_rooms_code on public.rooms(code);

-- ============================================================
-- Staged migration: premium content (schema prep — not yet app-wired)
-- ============================================================
-- Marks rows that should not be readable without entitlement once RLS tightens.
alter table public.baby_names
  add column if not exists is_premium boolean not null default false;

-- Optional per-dataset popularity ordering (JSONL bulk import).
alter table public.baby_names
  add column if not exists popularity_rank integer;

-- Custom names are user-authored public names. Clients may only insert non-premium
-- rows marked `origin = 'Custom'`; catalog/premium imports still use service-role scripts.
drop policy if exists "Authenticated users can insert custom baby names" on public.baby_names;
create policy "Authenticated users can insert custom baby names"
  on public.baby_names for insert
  with check (
    auth.uid() is not null
    and origin = 'Custom'
    and not coalesce(is_premium, false)
    and not coalesce(is_worldwide, false)
  );

-- Premium rows: readable only when the caller is authenticated and has at least one pack
-- on their profile (`purchased_packs` non-empty). Non-premium rows stay world-readable.
-- Note: local dev "unlocks" that are not mirrored into `profiles.purchased_packs` will not
-- pass this check; the app falls back to bundled premium (existing client behavior).
drop policy if exists "Anyone can read baby names" on public.baby_names;
drop policy if exists "baby_names selective read by entitlement" on public.baby_names;

create policy "baby_names selective read by entitlement"
  on public.baby_names for select
  using (
    not coalesce(is_premium, false)
    or (
      auth.uid() is not null
      and (
      exists (
        select 1 from public.profiles p
        where p.id = auth.uid()
        and cardinality(coalesce(p.purchased_packs, '{}'::text[])) > 0
      )
      or exists (
        select 1 from public.rooms r
        where (r.user1_id = auth.uid() or r.user2_id = auth.uid())
        and cardinality(coalesce(r.premium_packs, '{}'::text[])) > 0
      )
      )
    )
  );

-- Narrow exception: premium catalog remains gated above, but room members may read a premium
-- name row when it is already referenced by a match in their room (partner may lack packs).
drop policy if exists "baby_names read for matched names in user rooms" on public.baby_names;

create policy "baby_names read for matched names in user rooms"
  on public.baby_names for select
  using (
    auth.uid() is not null
    and coalesce(is_premium, false)
    and exists (
      select 1
      from public.matches m
      inner join public.rooms r on r.id = m.room_id
      where m.name_id = baby_names.id
        and (r.user1_id = auth.uid() or r.user2_id = auth.uid())
    )
  );

create index if not exists idx_baby_names_is_premium_true
  on public.baby_names (is_premium)
  where is_premium = true;

-- Localized premium meanings only (fetch by locale; keyed by stable content id).
-- Align `name_content_id` with client `BabyName.id` until UUIDs are unified server-side.
create table if not exists public.premium_meaning_translations (
  name_content_id text not null,
  locale text not null,
  meaning text not null,
  primary key (name_content_id, locale)
);

alter table public.premium_meaning_translations enable row level security;

-- Same entitlement bar as premium `baby_names`: authenticated user with at least one purchased pack.
drop policy if exists "premium_meaning_translations read by entitlement" on public.premium_meaning_translations;
create policy "premium_meaning_translations read by entitlement"
  on public.premium_meaning_translations for select
  using (
    auth.uid() is not null
    and (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
      and cardinality(coalesce(p.purchased_packs, '{}'::text[])) > 0
    )
    or exists (
      select 1 from public.rooms r
      where (r.user1_id = auth.uid() or r.user2_id = auth.uid())
      and cardinality(coalesce(r.premium_packs, '{}'::text[])) > 0
    )
    )
  );

-- Localized public-catalog meanings (same row shape as premium_meaning_translations;
-- name_content_id aligns with public.baby_names.id).
create table if not exists public.name_meaning_translations (
  name_content_id uuid not null references public.baby_names(id) on delete cascade,
  locale text not null,
  meaning text not null,
  primary key (name_content_id, locale)
);

alter table public.name_meaning_translations enable row level security;

drop policy if exists "name_meaning_translations read authenticated" on public.name_meaning_translations;
create policy "name_meaning_translations read authenticated"
  on public.name_meaning_translations for select
  using (auth.uid() is not null);

revoke all on table public.name_meaning_translations from public;
grant select on table public.name_meaning_translations to authenticated;
revoke insert, update, delete on table public.name_meaning_translations from authenticated;

-- ============================================================
-- Canonical name identity layer
-- ============================================================
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

-- ============================================================
-- RPC: delete_own_account (SECURITY DEFINER)
-- Permanently deletes the calling user's account and all
-- associated data. Cascade rules handle most cleanup, but we
-- explicitly delete matches in rooms where the user is the
-- joiner (user2_id) because those rooms survive via SET NULL.
-- We also null the partner's profile.room_id when this user is
-- room creator (user1), because that room row cascades away.
-- ============================================================
create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  update public.profiles p
  set
    room_id = null,
    updated_at = now()
  where p.id <> v_uid
    and p.room_id in (
      select r.id
      from public.rooms r
      where r.user1_id = v_uid
    );

  -- 1. Delete matches in rooms where user is partner (user2).
  --    The room itself won't cascade-delete (SET NULL), so its
  --    matches would survive. Clean them up first.
  delete from public.matches m
  using public.rooms r
  where m.room_id = r.id
    and r.user2_id = v_uid;

  -- 2. Delete auth.users row. FK cascades handle the rest:
  --    auth.users → profiles → swipes, purchases, rooms (user1) → matches
  delete from auth.users where id = v_uid;
end;
$$;
