-- ============================================================
-- Migration: name_meaning_translations
-- Date: 2026-05-09
--
-- Localized meanings for baby_names rows (canonical English remains on baby_names.meaning).
-- language_code CHECK matches app UI locales; rollout priority: en, es, pt, nl, de, fr, it then zh, ja, ko, ar.
-- Client: authenticated SELECT only. Writes via service_role / admin (no client policies).
-- ============================================================

begin;

create table public.name_meaning_translations (
  id uuid primary key default gen_random_uuid(),
  name_id text not null references public.baby_names(id) on delete cascade,
  language_code text not null
    check (language_code in ('en', 'nl', 'de', 'fr', 'es', 'it', 'pt', 'zh', 'ja', 'ko', 'ar')),
  meaning text not null,
  source text,
  confidence numeric,
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (name_id, language_code)
);

create index idx_name_meaning_translations_language_code
  on public.name_meaning_translations (language_code);

alter table public.name_meaning_translations enable row level security;
alter table public.name_meaning_translations force row level security;

drop policy if exists "Authenticated users can read name_meaning_translations"
  on public.name_meaning_translations;

create policy "Authenticated users can read name_meaning_translations"
  on public.name_meaning_translations for select
  using (auth.uid() is not null);

commit;
