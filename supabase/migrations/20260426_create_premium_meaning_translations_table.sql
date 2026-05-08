-- Baseline premium_meaning_translations before 20260427_room_premium_entitlement.sql applies policies.

create table if not exists public.premium_meaning_translations (
  name_content_id text not null,
  locale text not null,
  meaning text not null,
  primary key (name_content_id, locale)
);

alter table public.premium_meaning_translations enable row level security;
alter table public.premium_meaning_translations force row level security;
