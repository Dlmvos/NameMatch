-- When the room creator (user1) deletes their account, the room row cascades
-- (rooms.user1_id → profiles ON DELETE CASCADE). The partner's profile.room_id
-- would otherwise keep a stale UUID. Clear it before auth delete.
-- (Rooms where the deleter is only user2 survive with SET NULL on user2_id — do not
-- null the creator's room_id in that case.)

begin;

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

  -- Clear partner room_id for rooms this user owns as creator (those rooms are
  -- about to cascade-delete with their profile).
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

revoke execute on function public.delete_own_account() from public;
revoke execute on function public.delete_own_account() from anon;
grant execute on function public.delete_own_account() to authenticated;

commit;
