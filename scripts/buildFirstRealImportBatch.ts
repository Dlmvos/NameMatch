/**
 * Builds a deterministic "first larger batch" JSONL file for baby_names import.
 *
 * Source: scripts/premiumBundledLegacy.names.ts (not bundled in app runtime).
 * Output format matches scripts/lib/bulkBabyNameImport.ts BulkImportSourceRow.
 *
 * Usage:
 *   tsx scripts/buildFirstRealImportBatch.ts
 *   tsx scripts/buildFirstRealImportBatch.ts --limit 200 --out scripts/data/batches/first-real-batch.v1.jsonl
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { enrichName } from '../src/services/nameEnrichment';
import { PREMIUM_BUNDLED_LEGACY_NAMES } from './premiumBundledLegacy.names';
import { normalizeAndValidateRow, type BulkImportSourceRow } from './lib/bulkBabyNameImport';

const DEFAULT_LIMIT = 200;
const DEFAULT_OUT = 'scripts/data/batches/first-real-batch.v1.jsonl';
const DATASET_SLUG = 'legacy-premium-v1';

function parseArgs(argv: string[]): { out: string; limit: number } {
  const outIdx = argv.indexOf('--out');
  const limitIdx = argv.indexOf('--limit');
  const out = outIdx >= 0 && argv[outIdx + 1] ? argv[outIdx + 1] : DEFAULT_OUT;
  const limitRaw = limitIdx >= 0 && argv[limitIdx + 1] ? Number(argv[limitIdx + 1]) : DEFAULT_LIMIT;
  const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.floor(limitRaw) : DEFAULT_LIMIT;
  return { out, limit };
}

function toImportRow(raw: (typeof PREMIUM_BUNDLED_LEGACY_NAMES)[number]): BulkImportSourceRow {
  const popularity_rank = enrichName(raw.name).popularity_rank;
  return {
    external_id: `${DATASET_SLUG}:${raw.id}`,
    name: raw.name,
    gender: raw.gender,
    region: raw.region,
    origin: raw.origin ?? null,
    meaning: raw.meaning ?? null,
    country: raw.country ?? null,
    is_worldwide: Boolean(raw.is_worldwide),
    is_premium: true,
    popularity_rank: typeof popularity_rank === 'number' ? popularity_rank : null,
  };
}

function main(): void {
  const { out, limit } = parseArgs(process.argv.slice(2));
  const selected = PREMIUM_BUNDLED_LEGACY_NAMES.slice(0, limit);
  const errors: string[] = [];

  const validRows: BulkImportSourceRow[] = [];
  for (const raw of selected) {
    const row = toImportRow(raw);
    const result = normalizeAndValidateRow(row);
    if (!result.ok) {
      errors.push(`${row.external_id}: ${result.errors.join('; ')}`);
      continue;
    }
    validRows.push(row);
  }

  if (errors.length > 0) {
    throw new Error(`Batch build aborted due to validation errors:\n${errors.join('\n')}`);
  }

  const lines = validRows.map((r) => JSON.stringify(r)).join('\n');
  const absOut = path.isAbsolute(out) ? out : path.join(process.cwd(), out);
  mkdirSync(path.dirname(absOut), { recursive: true });
  writeFileSync(absOut, `${lines}\n`, 'utf8');

  console.log(`Wrote ${validRows.length} rows → ${out}`);
  console.log(`Next: npm run import:baby-names -- --dry-run ${out}`);
}

main();
