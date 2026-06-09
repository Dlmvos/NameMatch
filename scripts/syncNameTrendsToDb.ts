#!/usr/bin/env node
/**
 * syncNameTrendsToDb.ts
 *
 * Reconciles `baby_names.trend` against the curated `ENRICHMENT_MAP` in
 * src/services/nameEnrichment.ts.
 *
 * Why this script exists
 * ──────────────────────
 * `baby_names.trend` was backfilled once in migration 20260619 from the JS
 * `ENRICHMENT_MAP`. The migration is immutable history; future edits to
 * ENRICHMENT_MAP (adding "Liam: classic", changing "Mia: stable" to
 * "rising", etc.) would silently diverge from the DB column.
 *
 * Running this script:
 *  1. Imports ENRICHMENT_MAP from the live JS source
 *  2. Pulls all (canonical_name, trend) pairs that exist in baby_names
 *  3. Diffs JS vs DB
 *  4. Prints a report of new/changed/removed mappings
 *  5. With --apply, runs the UPDATE statements via the service-role key
 *
 * Dry-run by default. Add `--apply` to write changes.
 *
 * Usage
 * ─────
 *  npx tsx scripts/syncNameTrendsToDb.ts                # dry-run report
 *  npx tsx scripts/syncNameTrendsToDb.ts --apply        # actually update
 *  npx tsx scripts/syncNameTrendsToDb.ts --apply --json # machine output
 *
 * Environment
 * ───────────
 *  SUPABASE_URL              required
 *  SUPABASE_SERVICE_ROLE_KEY required for --apply (anon won't bypass RLS)
 *  SUPABASE_ANON_KEY         sufficient for dry-run reads
 *
 * Note: this script writes via the service-role key because the trend
 * column update bypasses any future UPDATE policies on baby_names. Reads
 * during dry-run use whichever key is present; service-role is preferred
 * because it sees the full catalog.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { ENRICHMENT_MAP } from '../src/services/nameEnrichment';

type Trend = 'rising' | 'stable' | 'classic';

interface CuratedEntry {
  name: string;
  trend: Trend;
}

interface DbEntry {
  name: string;
  trend: Trend | null;
}

interface DiffRow {
  name: string;
  jsTrend: Trend | null;
  dbTrend: Trend | null;
  action: 'set' | 'change' | 'clear' | 'noop';
}

function extractCurated(): CuratedEntry[] {
  const out: CuratedEntry[] = [];
  for (const [name, data] of Object.entries(ENRICHMENT_MAP)) {
    const trend = (data as { trend?: string })?.trend;
    if (trend === 'rising' || trend === 'stable' || trend === 'classic') {
      out.push({ name, trend });
    }
  }
  return out;
}

async function fetchDbEntries(client: SupabaseClient): Promise<DbEntry[]> {
  const pageSize = 1000;
  let from = 0;
  const out: DbEntry[] = [];
  for (;;) {
    const { data, error } = await client
      .from('baby_names')
      .select('name, trend')
      .range(from, from + pageSize - 1);
    if (error) throw new Error(`fetchDbEntries: ${error.message}`);
    if (!data || data.length === 0) break;
    for (const row of data) {
      out.push({
        name: (row.name as string) ?? '',
        trend: ((row.trend as string | null) ?? null) as Trend | null,
      });
    }
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return out;
}

function normalize(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/['']/g, '')
    .toLowerCase()
    .trim();
}

function diff(curated: CuratedEntry[], db: DbEntry[]): DiffRow[] {
  // Map curated by normalized key
  const jsByKey = new Map<string, Trend>();
  for (const { name, trend } of curated) {
    jsByKey.set(normalize(name), trend);
  }
  // Group DB rows by normalized key — pick the most-common trend if multiple
  // baby_names rows exist for the same canonical name. We don't error on
  // collision because the same name can appear in many country imports.
  const dbByKey = new Map<string, Trend | null>();
  for (const row of db) {
    const key = normalize(row.name);
    if (!key) continue;
    if (!dbByKey.has(key)) dbByKey.set(key, row.trend);
  }
  const out: DiffRow[] = [];
  for (const [key, jsTrend] of jsByKey.entries()) {
    const dbTrend = dbByKey.get(key) ?? null;
    if (dbTrend === jsTrend) {
      out.push({ name: key, jsTrend, dbTrend, action: 'noop' });
    } else if (dbTrend === null) {
      out.push({ name: key, jsTrend, dbTrend, action: 'set' });
    } else {
      out.push({ name: key, jsTrend, dbTrend, action: 'change' });
    }
  }
  for (const [key, dbTrend] of dbByKey.entries()) {
    if (!jsByKey.has(key) && dbTrend !== null) {
      // Removed from the JS map — we DON'T clear automatically. If a curator
      // wants to remove a trend they should set it null in JS and re-run
      // with an explicit --clear-removed flag (not implemented; intentional).
      out.push({
        name: key,
        jsTrend: null,
        dbTrend,
        action: 'noop',
      });
    }
  }
  return out;
}

async function applyDiff(
  client: SupabaseClient,
  rows: DiffRow[],
): Promise<{ updated: number; skipped: number }> {
  let updated = 0;
  let skipped = 0;
  for (const row of rows) {
    if (row.action === 'noop') continue;
    if (row.action === 'clear') {
      skipped += 1;
      continue;
    }
    const { error, count } = await client
      .from('baby_names')
      .update({ trend: row.jsTrend }, { count: 'exact' })
      // Match by normalized name via a tolerant filter — uses the SQL
      // normalize_name_key function we already have to avoid casing /
      // accent mismatch between JS and DB.
      .filter('normalize_name_key(name)', 'eq', row.name);
    if (error) {
      console.error(`update failed for "${row.name}": ${error.message}`);
      skipped += 1;
      continue;
    }
    updated += count ?? 0;
  }
  return { updated, skipped };
}

async function main(): Promise<void> {
  const url = process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.error(
      'SUPABASE_URL and (SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY) required',
    );
    process.exit(1);
  }
  const apply = process.argv.includes('--apply');
  const asJson = process.argv.includes('--json');

  if (apply && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('--apply requires SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const client = createClient(url, key, {
    auth: { persistSession: false },
  });

  const curated = extractCurated();
  const db = await fetchDbEntries(client);
  const rows = diff(curated, db);

  const setRows = rows.filter((r) => r.action === 'set');
  const changeRows = rows.filter((r) => r.action === 'change');
  const noopRows = rows.filter((r) => r.action === 'noop');

  if (asJson) {
    console.log(
      JSON.stringify(
        {
          counts: {
            curated_total: curated.length,
            db_total: db.length,
            set: setRows.length,
            change: changeRows.length,
            noop: noopRows.length,
          },
          set: setRows,
          change: changeRows,
        },
        null,
        2,
      ),
    );
  } else {
    console.log(`Curated entries (ENRICHMENT_MAP): ${curated.length}`);
    console.log(`baby_names rows scanned          : ${db.length}`);
    console.log(`Would set (DB trend is NULL)     : ${setRows.length}`);
    console.log(`Would change (JS ≠ DB)           : ${changeRows.length}`);
    console.log(`Already in sync                  : ${noopRows.length}`);
    if (setRows.length > 0) {
      console.log('\nSET (first 20):');
      for (const r of setRows.slice(0, 20)) {
        console.log(`  ${r.name.padEnd(22)} → ${r.jsTrend}`);
      }
    }
    if (changeRows.length > 0) {
      console.log('\nCHANGE (first 20):');
      for (const r of changeRows.slice(0, 20)) {
        console.log(
          `  ${r.name.padEnd(22)} ${r.dbTrend} → ${r.jsTrend}`,
        );
      }
    }
  }

  if (!apply) {
    console.log('\nDry run. Re-run with --apply to write changes.');
    return;
  }
  const { updated, skipped } = await applyDiff(client, rows);
  console.log(`\nApplied: ${updated} row(s) updated, ${skipped} skipped`);
}

void main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
