-- ============================================================
-- Post-migration sanity checks
-- ============================================================
-- Run as `postgres` (Supabase SQL editor) AFTER applying all
-- migrations. Each section emits a small result set with a
-- `status` column ('PASS' / 'FAIL' / 'CHECK') so the operator
-- can scan the output for any non-PASS row.
--
-- Read-only: no mutations, no transaction wrapping needed.
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- 1. RLS state on every table the client touches
--    Expected: rls_enabled = t AND rls_forced = t
-- ────────────────────────────────────────────────────────────
with expected(tbl) as (
  values
    ('profiles'),
    ('rooms'),
    ('swipes'),
    ('matches'),
    ('purchases'),
    ('baby_names'),
    ('name_meaning_translations'),
    ('premium_meaning_translations'),
    ('canonical_names'),
    ('canonical_name_meanings')
)
select
  '1_rls'                                     as section,
  e.tbl                                       as table_name,
  c.relrowsecurity                            as rls_enabled,
  c.relforcerowsecurity                       as rls_forced,
  case
    when c.oid is null                              then 'FAIL — table missing'
    when c.relrowsecurity and c.relforcerowsecurity then 'PASS'
    when not c.relrowsecurity                       then 'FAIL — RLS not enabled'
    else                                                 'FAIL — RLS not forced'
  end                                         as status
from expected e
left join pg_class      c on c.relname = e.tbl
left join pg_namespace  n on n.oid = c.relnamespace and n.nspname = 'public'
order by e.tbl;


-- ────────────────────────────────────────────────────────────
-- 2. RPC signatures, return types, SECURITY DEFINER, search_path
--    Expected canonical signatures:
--      grant_room_premium(p_room_id uuid, p_premium_packs text[]) → public.rooms
--      check_and_create_match(p_room_id uuid, p_name_id text, p_user_id uuid) → boolean
--          (NB: post-20260506 a (uuid, uuid, uuid) overload may also exist — flagged.)
--      consume_free_swipe(p_amount integer) → integer
--      maybe_refill_daily_free_swipes() → integer
--      delete_own_account() → void
--      handle_new_user() → trigger
-- ────────────────────────────────────────────────────────────
with expected(name, args, returns) as (
  values
    ('grant_room_premium',           'p_room_id uuid, p_premium_packs text[]', 'rooms'),
    ('check_and_create_match',       'p_room_id uuid, p_name_id text, p_user_id uuid', 'boolean'),
    ('consume_free_swipe',           'p_amount integer', 'integer'),
    ('maybe_refill_daily_free_swipes','',                'integer'),
    ('delete_own_account',           '',                  'void'),
    ('handle_new_user',              '',                  'trigger')
), actual as (
  select
    p.proname                                          as name,
    pg_get_function_identity_arguments(p.oid)          as args,
    pg_get_function_result(p.oid)                      as returns,
    p.prosecdef                                        as security_definer,
    coalesce(
      (select cfg from unnest(p.proconfig) cfg where cfg like 'search_path=%'),
      '<unset>'
    )                                                  as search_path_cfg
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname in (
      'grant_room_premium','check_and_create_match','consume_free_swipe',
      'maybe_refill_daily_free_swipes','delete_own_account','handle_new_user',
      'rooms_guard_premium_packs','generate_room_code'
    )
)
select
  '2_rpc'                                              as section,
  a.name,
  a.args                                               as actual_args,
  a.returns                                            as actual_returns,
  a.security_definer,
  a.search_path_cfg,
  case
    when e.name is null then 'CHECK — extra/unknown function (overload?)'
    when a.args = e.args and a.returns like '%' || e.returns
      then 'PASS'
    else 'FAIL — signature drift; expected (' || e.args || ') -> ' || e.returns
  end                                                  as status
from actual a
full outer join expected e using (name)
order by a.name nulls last, a.args;


-- ────────────────────────────────────────────────────────────
-- 2b. EXECUTE grants on the privileged RPCs
--     Expected:
--       grant_room_premium  → authenticated only
--       check_and_create_match, consume_free_swipe, delete_own_account,
--       maybe_refill_daily_free_swipes → authenticated only
--       handle_new_user → no role (trigger-only)
-- ────────────────────────────────────────────────────────────
with funcs(qualname) as (
  values
    ('public.grant_room_premium(uuid, text[])'),
    ('public.check_and_create_match(uuid, text, uuid)'),
    ('public.check_and_create_match(uuid, uuid, uuid)'),
    ('public.consume_free_swipe(integer)'),
    ('public.maybe_refill_daily_free_swipes()'),
    ('public.delete_own_account()'),
    ('public.handle_new_user()')
), roles(rolname) as (
  values ('anon'), ('authenticated'), ('service_role'), ('public')
)
select
  '2b_grants'                                          as section,
  f.qualname,
  r.rolname,
  case
    when not exists (
      select 1 from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname || '.' || p.proname || '(' ||
            pg_get_function_identity_arguments(p.oid) || ')' = f.qualname
    ) then null
    else has_function_privilege(r.rolname, f.qualname, 'execute')
  end                                                  as can_execute
from funcs f
cross join roles r
order by f.qualname, r.rolname;


-- ────────────────────────────────────────────────────────────
-- 3. premium_packs triggers wired up
--    Expected:
--      rooms_guard_premium_packs_insert: BEFORE INSERT  on public.rooms
--      rooms_guard_premium_packs       : BEFORE UPDATE OF premium_packs on public.rooms
--      Both call public.rooms_guard_premium_packs() and are ENABLED.
-- ────────────────────────────────────────────────────────────
with expected(tgname, tgdef_like) as (
  values
    ('rooms_guard_premium_packs_insert',
     'CREATE TRIGGER rooms_guard_premium_packs_insert BEFORE INSERT ON public.rooms%'),
    ('rooms_guard_premium_packs',
     'CREATE TRIGGER rooms_guard_premium_packs BEFORE UPDATE OF premium_packs ON public.rooms%')
)
select
  '3_triggers'                                         as section,
  e.tgname,
  pg_get_triggerdef(t.oid)                             as definition,
  t.tgenabled,
  case
    when t.oid is null                                  then 'FAIL — trigger missing'
    when t.tgenabled <> 'O'                             then 'FAIL — trigger disabled'
    when pg_get_triggerdef(t.oid) ilike e.tgdef_like    then 'PASS'
    else 'FAIL — definition drift'
  end                                                  as status
from expected e
left join pg_trigger t on t.tgname = e.tgname and not t.tgisinternal
left join pg_class   c on c.oid = t.tgrelid and c.relname = 'rooms'
order by e.tgname;

-- 3b. Trigger function present?
select
  '3b_trigger_fn'                                      as section,
  case when exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'rooms_guard_premium_packs'
  ) then 'PASS' else 'FAIL — public.rooms_guard_premium_packs() missing'
  end                                                  as status;

-- 3c. End-to-end behavioural probe — must raise 42501.
--     Wrap in a savepoint so a successful raise rolls back cleanly.
do $$
declare
  v_room_id uuid;
  v_caught  boolean := false;
begin
  -- pick any existing room id; skip if table empty
  select id into v_room_id from public.rooms limit 1;
  if v_room_id is null then
    raise notice 'SKIP — no rooms present';
    return;
  end if;

  -- impersonate the authenticated role for this transaction only
  set local role authenticated;
  begin
    update public.rooms
       set premium_packs = array['__probe__']
     where id = v_room_id;
  exception
    when insufficient_privilege then
      v_caught := true;
  end;
  reset role;

  if v_caught then
    raise notice 'PASS — direct authenticated UPDATE blocked by trigger (42501)';
  else
    raise warning 'FAIL — direct authenticated UPDATE was NOT blocked';
  end if;
end$$;


-- ────────────────────────────────────────────────────────────
-- 4. profiles.purchased_packs write protection
--    No DB-level guard exists today (only the TS updateProfile
--    guardrail). This check surfaces the current state so the
--    operator can decide whether to add a column-level revoke
--    or a trigger.
-- ────────────────────────────────────────────────────────────
select
  '4_purchased_packs'                                  as section,
  -- column-level UPDATE privilege for authenticated
  has_column_privilege('authenticated', 'public.profiles', 'purchased_packs', 'UPDATE')
                                                       as authenticated_can_update_column,
  -- trigger-based guard?
  exists (
    select 1
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    where c.relname = 'profiles'
      and not t.tgisinternal
      and pg_get_triggerdef(t.oid) ilike '%purchased_packs%'
  )                                                    as guarded_by_trigger,
  case
    when exists (
      select 1
      from pg_trigger t
      join pg_class c on c.oid = t.tgrelid
      where c.relname = 'profiles'
        and not t.tgisinternal
        and pg_get_triggerdef(t.oid) ilike '%purchased_packs%'
    )
      then 'PASS — DB-level guard present'
    when not has_column_privilege('authenticated','public.profiles','purchased_packs','UPDATE')
      then 'PASS — column-level UPDATE revoked from authenticated'
    else 'FAIL — purchased_packs is writable by authenticated clients (no DB-level guard)'
  end                                                  as status;

-- 4b. Behavioural probe — try to write purchased_packs as authenticated.
--     Uses a non-existent uid so no real row is touched; the goal is to
--     confirm whether RLS / privileges admit the statement at all.
do $$
declare
  v_caught   boolean := false;
  v_rejected boolean := false;
begin
  set local role authenticated;
  begin
    -- intentionally targets a row we don't own; expectation is RLS denies
    -- the row, not a privilege error. If purchased_packs ever gets a guard
    -- (column revoke / trigger), this branch will raise insufficient_privilege.
    update public.profiles
       set purchased_packs = array['__probe__']
     where id = '00000000-0000-0000-0000-000000000000';
    v_rejected := false;
  exception
    when insufficient_privilege then v_caught := true;
    when others                 then v_rejected := true;
  end;
  reset role;

  if v_caught then
    raise notice 'PASS — UPDATE on purchased_packs raised insufficient_privilege';
  elsif v_rejected then
    raise notice 'CHECK — UPDATE rejected by another error (inspect manually)';
  else
    raise warning 'INFO — UPDATE statement admitted; relying on RLS row-match for safety';
  end if;
end$$;


-- ────────────────────────────────────────────────────────────
-- 5. Translation table & data presence row counts
--    Useful as a sanity probe after migrations + content imports.
-- ────────────────────────────────────────────────────────────
select '5_counts' as section, 'name_meaning_translations'    as table_name, count(*) as rows from public.name_meaning_translations
union all
select '5_counts',             'premium_meaning_translations',                 count(*) from public.premium_meaning_translations
union all
select '5_counts',             'canonical_name_meanings',                      count(*) from public.canonical_name_meanings
union all
select '5_counts',             'canonical_names',                              count(*) from public.canonical_names
union all
select '5_counts',             'baby_names',                                   count(*) from public.baby_names
order by table_name;

-- 5b. Coverage spot-check — name_meaning_translations broken down by language.
select
  '5b_translations_by_lang' as section,
  meaning_language          as language,
  count(*)                  as rows
from public.name_meaning_translations
group by meaning_language
order by rows desc;
