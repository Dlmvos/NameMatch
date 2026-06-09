# NameMatch / BabySwipe — Claude working notes

React Native + Expo + Supabase couples baby-name swiping app. Pre-launch.

## Loading credentials before terminal scripts

Two env files live in the repo root, both gitignored:

- `.env` — Expo build env. Contains `EXPO_PUBLIC_*` keys that get bundled
  into the JS payload at app build time. Anon key + URL only; nothing
  secret.
- `.env.scripts` — terminal-script env. Contains `SUPABASE_SERVICE_ROLE_KEY`
  (bypasses RLS — must never ship to clients) and `SUPABASE_ACCESS_TOKEN`
  (management-API personal access token — full project access).

**Always load `.env.scripts` before running any terminal script that
touches Supabase**, including:

- `npx supabase db push` / `db pull` / `db diff`
- `npx supabase projects list` / `link`
- Any `tsx scripts/...` that hits Supabase (enrichment pipeline, sync
  scripts, applier, dictionary builder, etc.)

Load pattern:

```bash
set -a; source .env.scripts; set +a
```

`set -a` auto-exports every assignment that follows; `set +a` turns that
back off after sourcing. Without `set -a`, `source` reads the file but the
values stay shell-local and the child `npx`/`tsx` processes won't see them.

The Supabase CLI will pick up `SUPABASE_ACCESS_TOKEN` automatically once
sourced — no extra `--token` flag needed.

## Linked Supabase project

- Project: `ivydlnahcnembpjnmntm` (daan@vos.net's Project, West EU / Ireland)
- Linked state stored in `supabase/.temp/`. Do NOT delete that directory.
- For `db push` operations, the CLI will prompt for the DB password the
  first time. After that it caches in the macOS keychain. If running
  inside a fresh sandbox, pass `--password "$SUPABASE_DB_PASSWORD"` and
  add that var to `.env.scripts` only when actually needed (avoid
  storing it long-term if possible).

## Migration tracking

Migrations live in `supabase/migrations/` named `YYYYMMDDXX_*.sql`. They
are idempotent — guarded with `IF NOT EXISTS`, `DO $$ ... $$` blocks that
check `information_schema`, and `CREATE OR REPLACE` where applicable.
This is intentional because production has schema drift from older
hand-applied migrations; the guards keep re-runs safe.

`supabase/migrations_applied_manually/` contains rollback scripts that
must be applied by hand in the SQL editor — NEVER through `db push`.

## Working directory convention

Everything under `~/Desktop/NameMatch/NameMatch` (note the double folder).
Repo root has `package.json`, `app.json`, `supabase/`. The outer
`~/Desktop/NameMatch` is just the GitHub clone wrapper.
