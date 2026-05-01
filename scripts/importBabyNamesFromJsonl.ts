/**
 * CLI: import normalized baby names from JSON Lines into `public.baby_names`.
 *
 * Usage:
 *   npm run import:baby-names -- scripts/data/import.example.jsonl
 *   npm run import:baby-names -- --dry-run scripts/data/import.example.jsonl
 *
 * Requires: EXPO_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (.env)
 *
 * Input: one JSON object per line (see scripts/data/import.example.jsonl).
 * Idempotent: upsert on `id` derived from `external_id` (see scripts/lib/bulkBabyNameImport.ts).
 */
import 'dotenv/config';

import { readFileSync } from 'node:fs';
import path from 'node:path';

import { createClient } from '@supabase/supabase-js';

import {
  normalizeAndValidateRow,
  parseJsonlLine,
  type BulkImportSourceRow,
  type NormalizedBabyNameInsert,
} from './lib/bulkBabyNameImport';

const BATCH_SIZE = 500;

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const dryRun = argv.includes('--dry-run');
  const files = argv.filter((a) => a !== '--dry-run');
  const filePath = files[0];
  if (!filePath) {
    console.error('Usage: tsx scripts/importBabyNamesFromJsonl.ts [--dry-run] <path/to/file.jsonl>');
    process.exit(1);
  }

  const resolved = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
  const raw = readFileSync(resolved, 'utf8');
  const lines = raw.split(/\r?\n/);

  const valid: NormalizedBabyNameInsert[] = [];
  let skipped = 0;
  let droppedFieldMentions = 0;

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    let parsed: BulkImportSourceRow | null;
    try {
      parsed = parseJsonlLine(lines[i], lineNum);
    } catch (e) {
      console.error(e instanceof Error ? e.message : e);
      process.exit(1);
    }
    if (!parsed) continue;

    const result = normalizeAndValidateRow(parsed);
    if (!result.ok) {
      console.error(`Line ${lineNum}: ${result.errors.join('; ')}`);
      skipped += 1;
      continue;
    }
    if (result.droppedFields.length > 0) droppedFieldMentions += 1;
    valid.push(result.row);
  }

  console.log(
    `Parsed ${lines.filter((l) => l.trim() && !l.trim().startsWith('#')).length} non-empty lines → ${valid.length} valid rows (${skipped} invalid).`,
  );
  if (droppedFieldMentions > 0) {
    console.log(
      `Note: ${droppedFieldMentions} rows had trend fields omitted (no DB column yet).`,
    );
  }

  if (dryRun) {
    console.log('Dry run: no database writes.');
    if (valid[0]) console.log('Sample row:', JSON.stringify(valid[0], null, 2));
    return;
  }

  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error('Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  for (let i = 0; i < valid.length; i += BATCH_SIZE) {
    const batch = valid.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from('baby_names').upsert(batch, { onConflict: 'id' });
    if (error) {
      console.error('Upsert failed:', error.message, error);
      process.exit(1);
    }
  }
  console.log(`Upserted ${valid.length} rows into baby_names.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
