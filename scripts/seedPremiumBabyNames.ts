/**
 * Idempotent seed: upserts legacy bundled premium names into `public.baby_names` with `is_premium = true`.
 *
 * Run locally/CI with service role (bypasses RLS). Never ship the service role key in the app.
 *
 * ID mapping (legacy → database):
 * - Legacy `BabyName.id` values are zero-padded decimal strings from `scripts/premiumBundledLegacy.names.ts`
 *   (e.g. `00000351`). They are NOT valid UUIDs and cannot be stored in `baby_names.id` (uuid).
 * - Stable UUIDs: see `legacyPremiumIdToUuid` in `scripts/premiumLegacyUuid.ts`.
 * - Changing the namespace UUID or v5 name string format after production seed will produce
 *   different UUIDs → duplicate logical names with new ids. Do not change once deployed.
 *
 * Rollback (destructive): delete rows by the same deterministic ids, e.g. after computing ids in a REPL
 * or re-running this script in dry-run log mode (not implemented — use SQL `where id = any(...)` from logs).
 */
import 'dotenv/config';

import { createClient } from '@supabase/supabase-js';

import { PREMIUM_BUNDLED_LEGACY_NAMES } from './premiumBundledLegacy.names';
import { legacyPremiumIdToUuid } from './premiumLegacyUuid';

const BATCH_SIZE = 200;

async function main(): Promise<void> {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.error(
      'Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (see .env.example).',
    );
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const rows = PREMIUM_BUNDLED_LEGACY_NAMES.map((n) => ({
    id: legacyPremiumIdToUuid(n.id),
    name: n.name,
    meaning: n.meaning,
    origin: n.origin,
    gender: n.gender,
    country: n.country ?? null,
    region: n.region,
    is_worldwide: n.is_worldwide,
    is_premium: true as const,
  }));

  console.log(`Upserting ${rows.length} premium baby_names (onConflict: id)...`);

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from('baby_names').upsert(batch, { onConflict: 'id' });
    if (error) {
      console.error('Upsert failed:', error.message, error);
      process.exit(1);
    }
  }

  console.log('Done.');
}

main();
