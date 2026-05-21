-- Ensure authenticated clients can SELECT baby_names rows needed for Liked Names:
-- (1) non-premium user-authored customs
-- (2) any name_id the user has swiped on within a room they belong to
-- Complements "selective read by entitlement" without weakening premium catalog for unrelated ids.

begin;

drop policy if exists "baby_names readable custom or swiped in member rooms" on public.baby_names;

create policy "baby_names readable custom or swiped in member rooms"
  on public.baby_names
  for select
  to authenticated
  using (
    (
      coalesce(origin, '') = 'Custom'
      and not coalesce(is_premium, false)
    )
    or exists (
      select 1
      from public.swipes s
      inner join public.rooms r on r.id = s.room_id
      where s.name_id = baby_names.id
        and (r.user1_id = auth.uid() or r.user2_id = auth.uid())
    )
  );

commit;
