-- Room-based Premium entitlement.
-- If either room member owns/restores Premium, the room records that entitlement
-- so both members can access Premium names and bypass swipe limits.

alter table public.rooms
  add column if not exists premium_packs text[] not null default '{}';

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
