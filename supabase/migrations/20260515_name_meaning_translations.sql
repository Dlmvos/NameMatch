-- Public catalog name meanings in multiple locales (production columns).
-- Client: `src/services/premiumMeaningTranslationsRemote.ts` selects name_id, language_code, meaning.
-- Idempotent and production-safe: never drops the table or data.

begin;

create table if not exists public.name_meaning_translations (
  id uuid primary key default uuid_generate_v4(),
  name_id text not null,
  language_code text not null,
  meaning text not null,
  source text,
  confidence numeric,
  verified boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Unique on (name_id, language_code) only when no equivalent unique index exists yet.
do $unique$
begin
  if not exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and tablename = 'name_meaning_translations'
      and indexdef ilike '%unique%'
      and (
        indexdef like '%(name_id, language_code)%'
        or indexdef like '%(language_code, name_id)%'
      )
  ) then
    alter table public.name_meaning_translations
      add constraint name_meaning_translations_name_id_language_code_key unique (name_id, language_code);
  end if;
end
$unique$;

alter table public.name_meaning_translations enable row level security;

drop policy if exists "name_meaning_translations read authenticated" on public.name_meaning_translations;
create policy "name_meaning_translations read authenticated"
  on public.name_meaning_translations for select
  using (auth.uid() is not null);

revoke all on table public.name_meaning_translations from public;
grant select on table public.name_meaning_translations to authenticated;
revoke insert, update, delete on table public.name_meaning_translations from authenticated;

commit;
