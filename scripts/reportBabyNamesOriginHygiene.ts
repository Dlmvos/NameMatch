/**
 * Read-only report: `baby_names` rows whose `origin` holds import provenance
 * (US SSA, national statistics, census, registry) instead of etymology.
 *
 * Use before running `supabase/migrations/20260607_baby_names_origin_hygiene.sql`
 * or the commented UPDATE in `scripts/data/sql/baby_names_origin_hygiene_report.sql`.
 *
 * Requires: EXPO_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 *
 * Usage:
 *   npm run report:baby-names:origin-hygiene
 */
import 'dotenv/config';

import { createClient } from '@supabase/supabase-js';

import {
  classifySourceLikeOrigin,
  type OriginHygieneBucket,
} from './lib/babyNamesOriginHygiene';

type OriginRow = {
  id: string;
  name: string;
  origin: string | null;
  country: string | null;
  region: string;
  is_premium: boolean | null;
};

const BUCKET_LABEL: Record<OriginHygieneBucket, string> = {
  us_ssa: 'US SSA (exact)',
  national_statistics: 'contains (national statistics)',
  census: 'contains (census)',
  registry: 'contains (registry)',
};

async function main(): Promise<void> {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error('Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  try {
    console.log(`Supabase host (confirm environment): ${new URL(url).hostname}`);
  } catch {
    /* ignore malformed URL in log */
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const pageSize = 1000;
  const rows: OriginRow[] = [];
  const seenIds = new Set<string>();

  const appendPage = (data: OriginRow[] | null) => {
    if (!data) return;
    for (const row of data) {
      if (seenIds.has(row.id)) continue;
      seenIds.add(row.id);
      rows.push(row);
    }
  };

  const fetchExact = async (origin: string) => {
    for (let from = 0; ; from += pageSize) {
      const { data, error } = await supabase
        .from('baby_names')
        .select('id, name, origin, country, region, is_premium')
        .eq('origin', origin)
        .order('id', { ascending: true })
        .range(from, from + pageSize - 1);
      if (error) throw new Error(error.message);
      appendPage(data as OriginRow[]);
      if (!data?.length || data.length < pageSize) break;
    }
  };

  const fetchIlike = async (pattern: string) => {
    for (let from = 0; ; from += pageSize) {
      const { data, error } = await supabase
        .from('baby_names')
        .select('id, name, origin, country, region, is_premium')
        .ilike('origin', pattern)
        .order('id', { ascending: true })
        .range(from, from + pageSize - 1);
      if (error) throw new Error(error.message);
      appendPage(data as OriginRow[]);
      if (!data?.length || data.length < pageSize) break;
    }
  };

  try {
    await fetchExact('US SSA');
    for (const fragment of ['%(national statistics)%', '%(census)%', '%(registry)%']) {
      await fetchIlike(fragment);
    }
  } catch (err) {
    console.error('Query failed:', err instanceof Error ? err.message : err);
    process.exit(1);
  }

  console.log(`Source-like origin rows: ${rows.length}`);
  if (rows.length === 0) {
    console.log('No rows match hygiene predicate. DB origin field looks clean.');
    return;
  }

  const byOrigin = new Map<string, number>();
  const byBucket = new Map<OriginHygieneBucket, number>();
  const byCountryRegion = new Map<string, number>();

  for (const row of rows) {
    const originKey = row.origin ?? '(null)';
    byOrigin.set(originKey, (byOrigin.get(originKey) ?? 0) + 1);

    const bucket = classifySourceLikeOrigin(row.origin);
    if (bucket) {
      byBucket.set(bucket, (byBucket.get(bucket) ?? 0) + 1);
    }

    const geoKey = `${row.country ?? '(null)'} | ${row.region}`;
    byCountryRegion.set(geoKey, (byCountryRegion.get(geoKey) ?? 0) + 1);
  }

  console.log('\nBy pattern bucket:');
  for (const bucket of ['us_ssa', 'national_statistics', 'census', 'registry'] as const) {
    const n = byBucket.get(bucket) ?? 0;
    if (n > 0) console.log(`  ${BUCKET_LABEL[bucket]}: ${n}`);
  }

  console.log('\nBy exact origin (top 20):');
  const originSorted = [...byOrigin.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  for (const [origin, count] of originSorted.slice(0, 20)) {
    console.log(`  ${count}\t${JSON.stringify(origin)}`);
  }
  if (originSorted.length > 20) {
    console.log(`  … ${originSorted.length - 20} more distinct origin value(s)`);
  }

  console.log('\nBy country | region (read-only; cleanup does not modify these):');
  const geoSorted = [...byCountryRegion.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  for (const [geo, count] of geoSorted.slice(0, 15)) {
    console.log(`  ${count}\t${geo}`);
  }
  if (geoSorted.length > 15) {
    console.log(`  … ${geoSorted.length - 15} more country|region bucket(s)`);
  }

  console.log('\nSample rows (max 10):');
  for (const row of rows.slice(0, 10)) {
    console.log(
      `  ${row.id}  ${JSON.stringify(row.name)}  origin=${JSON.stringify(row.origin)}  country=${JSON.stringify(row.country)}  region=${row.region}`,
    );
  }

  console.log(
    '\nCleanup: run preflight queries in scripts/data/sql/baby_names_origin_hygiene_report.sql,',
  );
  console.log(
    'then apply supabase/migrations/20260607_baby_names_origin_hygiene.sql (sets origin = NULL only).',
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
