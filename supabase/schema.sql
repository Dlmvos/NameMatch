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
  room_id uuid,
  free_swipes_remaining integer not null default 100,
  purchased_packs text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS
alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

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
  code text not null unique,
  user1_id uuid not null references public.profiles(id) on delete cascade,
  user2_id uuid references public.profiles(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- RLS
alter table public.rooms enable row level security;

create policy "Room members can view their room"
  on public.rooms for select
  using (auth.uid() = user1_id or auth.uid() = user2_id);

create policy "Authenticated users can create rooms"
  on public.rooms for insert
  with check (auth.uid() = user1_id);

create policy "Room owner or joiner can update room"
  on public.rooms for update
  using (auth.uid() = user1_id or auth.uid() = user2_id);

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

-- Names are publicly readable
alter table public.baby_names enable row level security;
create policy "Anyone can read baby names"
  on public.baby_names for select using (true);

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
-- FUNCTION: Check & create match after a right-swipe
-- Called from the app after recording a swipe
-- ============================================================
create or replace function public.check_and_create_match(
  p_room_id uuid,
  p_name_id uuid,
  p_user_id uuid
)
returns boolean as $$
declare
  v_room public.rooms;
  v_other_user_id uuid;
  v_other_swiped_right boolean;
begin
  -- Get the room
  select * into v_room from public.rooms where id = p_room_id;

  -- Find the other user
  if v_room.user1_id = p_user_id then
    v_other_user_id := v_room.user2_id;
  else
    v_other_user_id := v_room.user1_id;
  end if;

  if v_other_user_id is null then
    return false; -- Partner hasn't joined yet
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
$$ language plpgsql security definer;

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
create index idx_baby_names_region on public.baby_names(region);
create index idx_baby_names_gender on public.baby_names(gender);
create index idx_rooms_code on public.rooms(code);
