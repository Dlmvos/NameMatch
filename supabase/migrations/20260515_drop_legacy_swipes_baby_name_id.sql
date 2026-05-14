alter table public.swipes
drop constraint if exists swipes_baby_name_id_fkey;

alter table public.swipes
drop column if exists baby_name_id;
