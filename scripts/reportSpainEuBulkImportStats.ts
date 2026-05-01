/**
 * Read-only report: Spain EU rows produced by the bulk JSONL pipeline (national-statistics origin).
 * Use before DELETE + real INE import — see `scripts/data/SPAIN_REAL_SOURCE_WORKFLOW.md` §6.
 *
 * Requires: EXPO_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 *
 * Usage:
 *   npm run report:baby-names:es-eu-bulk-stats
 */
import 'dotenv/config';

import { createClient } from '@supabase/supabase-js';

const ORIGIN_BULK_SPAIN = 'Spain (national statistics)';

async function main(): Promise<void> {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error('Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  try {
    console.log(`Supabase host (confirm staging): ${new URL(url).hostname}`);
  } catch {
    /* ignore malformed URL in log */
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const pageSize = 1000;
  const ids: string[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data: rows, error } = await supabase
      .from('baby_names')
      .select('id')
      .eq('country', 'Spain')
      .eq('region', 'EU')
      // Match `spain_eu_bulk_delete_for_replacement.sql`: coalesce(is_premium, false) = false
      .or('is_premium.is.null,is_premium.eq.false')
      .eq('origin', ORIGIN_BULK_SPAIN)
      .order('id', { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) {
      console.error('Query failed:', error.message);
      process.exit(1);
    }
    if (!rows?.length) break;
    for (const r of rows) ids.push(r.id as string);
    if (rows.length < pageSize) break;
  }
  const n = ids.length;
  console.log(`Spain EU bulk-import candidate rows (origin = "${ORIGIN_BULK_SPAIN}"): ${n}`);

  if (n === 0) {
    console.log('No matching rows. Nothing to delete for synthetic/real swap (or DB already clean).');
    return;
  }

  const chunk = 400;
  let swipes = 0;
  let matches = 0;
  for (let i = 0; i < ids.length; i += chunk) {
    const slice = ids.slice(i, i + chunk);
    const { count: s } = await supabase
      .from('swipes')
      .select('id', { count: 'exact', head: true })
      .in('name_id', slice);
    swipes += s ?? 0;
    const { count: m } = await supabase
      .from('matches')
      .select('id', { count: 'exact', head: true })
      .in('name_id', slice);
    matches += m ?? 0;
  }

  console.log(`Swipes referencing those name_ids (exact sum over id chunks): ${swipes}`);
  console.log(`Matches referencing those name_ids (exact sum over id chunks): ${matches}`);
  console.log(
    'If you DELETE these baby_names rows, FK ON DELETE CASCADE will remove related swipes/matches. Plan a maintenance window on prod.',
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
