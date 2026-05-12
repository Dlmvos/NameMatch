-- Public catalog name meanings in multiple locales (columns match
-- src/services/premiumMeaningTranslationsRemote.ts: name_content_id, locale, meaning).

begin;

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

commit;
