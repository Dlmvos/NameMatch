/**
 * Idempotent seed: upserts rows into `public.premium_meaning_translations`.
 *
 * Data source: `scripts/premiumMeaningTranslations.seed.json` (not imported by the app — seed/migration only).
 * Scope: only legacy ids present in `PREMIUM_BUNDLED_LEGACY_NAMES` — does not re-seed core ids.
 *
 * ID mapping:
 * - JSON keys are legacy zero-padded strings (e.g. `00000351`).
 * - `name_content_id` in DB is the deterministic UUID from `legacyPremiumIdToUuid(legacyId)`
 *   (same as `baby_names.id` from `seedPremiumBabyNames.ts`).
 *
 * Run with service role. Table uses column `meaning` (not "translated_meaning").
 *
 * Requires: `npm run seed:premium-baby-names` (or equivalent) already applied so ids match deck rows.
 */
import 'dotenv/config';

import { readFileSync } from 'node:fs';
import path from 'node:path';

import { createClient } from '@supabase/supabase-js';

import { PREMIUM_BUNDLED_LEGACY_NAMES } from './premiumBundledLegacy.names';
import { legacyPremiumIdToUuid } from './premiumLegacyUuid';

type ExternalMeaningMap = Record<string, Partial<Record<string, string>>>;

const BATCH_SIZE = 500;

function loadBundledMeaningJson(): ExternalMeaningMap {
  const jsonPath = path.join(process.cwd(), 'scripts/premiumMeaningTranslations.seed.json');
  return JSON.parse(readFileSync(jsonPath, 'utf8')) as ExternalMeaningMap;
}

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

  const bundled = loadBundledMeaningJson();
  const rows: { name_content_id: string; locale: string; meaning: string }[] = [];

  let missingLegacyKeys = 0;
  for (const n of PREMIUM_BUNDLED_LEGACY_NAMES) {
    const perLocale = bundled[n.id];
    if (!perLocale) {
      missingLegacyKeys += 1;
      continue;
    }
    const uuid = legacyPremiumIdToUuid(n.id);
    for (const [locale, raw] of Object.entries(perLocale)) {
      const meaning = String(raw ?? '').trim();
      if (!locale?.trim() || !meaning) continue;
      rows.push({
        name_content_id: uuid,
        locale: locale.trim(),
        meaning,
      });
    }
  }

  if (missingLegacyKeys > 0) {
    console.warn(
      `Warning: ${missingLegacyKeys} premium legacy ids had no entry in premiumMeaningTranslations.seed.json.`,
    );
  }

  console.log(`Upserting ${rows.length} premium_meaning_translations (onConflict: name_content_id,locale)...`);

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
      .from('premium_meaning_translations')
      .upsert(batch, { onConflict: 'name_content_id,locale' });
    if (error) {
      console.error('Upsert failed:', error.message, error);
      process.exit(1);
    }
  }

  console.log('Done.');
}

main();
