-- Room members must be able to read mutual matches after bundled name_id migration RLS tightened.
alter table public.matches enable row level security;
alter table public.matches force row level security;

drop policy if exists "Room members can view their matches" on public.matches;

create policy "Room members can view their matches"
  on public.matches
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.rooms r
      where r.id = matches.room_id
        and (r.user1_id = auth.uid() or r.user2_id = auth.uid())
    )
  );

revoke all on table public.matches from public;
grant select on table public.matches to authenticated;
revoke insert, update, delete, truncate, references, trigger on table public.matches from authenticated;

-- Align `liked` with `direction` for My Likes / partner queries (`direction = 'right'` OR `liked`).
alter table public.swipes
  add column if not exists liked boolean;

update public.swipes
set liked = (direction = 'right')
where liked is distinct from (direction = 'right');
