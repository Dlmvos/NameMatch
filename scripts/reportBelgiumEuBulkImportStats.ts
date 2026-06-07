/**
 * Read-only report: Belgium EU rows from the Statbel bulk JSONL pipeline.
 * Matches `meaning_source = 'Belgium national statistics (eu-be-statbel)'` (origin is null on import).
 *
 * Requires: EXPO_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 *
 * Usage:
 *   npm run report:baby-names:be-eu-bulk-stats
 */
import 'dotenv/config';

import { createClient } from '@supabase/supabase-js';

export const MEANING_SOURCE_BULK_BE = 'Belgium national statistics (eu-be-statbel)';

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
      .eq('country', 'Belgium')
      .eq('region', 'EU')
      .or('is_premium.is.null,is_premium.eq.false')
      .eq('meaning_source', MEANING_SOURCE_BULK_BE)
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
  console.log(
    `Belgium EU bulk-import candidate rows (meaning_source = "${MEANING_SOURCE_BULK_BE}"): ${n}`,
  );

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
