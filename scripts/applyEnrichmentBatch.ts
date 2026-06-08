/**
 * Apply meaning-enrichment JSONL → Supabase.
 *
 * Reads CNM-shaped enrichment rows (the output of `enrichmentFromDictionary`
 * or `enrichmentFromLLM`) and calls the `apply_canonical_meaning_enrichment`
 * RPC for each row. The RPC performs an atomic monotonic UPSERT into
 * `canonical_name_meanings` and writes a matching audit row to
 * `canonical_name_meaning_attempts` (see 20260615 migration for semantics).
 *
 * Validation: every line is run through `validateCnmEnrichmentRow`; rejects
 * go to a sibling `.rejects.jsonl` so the operator can diff bad lines from
 * a re-runnable batch.
 *
 * Idempotency: the RPC's conflict clause is monotonic (confidence rises,
 * verified sticks, priority improves, review_status preserves human
 * decisions). Re-running the same JSONL is a no-op against CNM; the audit
 * table refreshes `attempted_at` and concatenates `context`.
 *
 * Dry-run: `--dry-run` validates every line, prints a summary, and writes
 * the rejects file — but performs no RPC calls. Use this against the
 * dictionary or LLM output before committing.
 *
 * Usage:
 *   tsx scripts/applyEnrichmentBatch.ts \
 *     --in scripts/data/meaning-enrichment/dictionary-en-any.jsonl \
 *     --batch-size 500 \
 *     --concurrency 4
 *
 *   tsx scripts/applyEnrichmentBatch.ts \
 *     --in scripts/data/meaning-enrichment/dictionary-en-any.jsonl,\
 *          scripts/data/meaning-enrichment/llm-en-any.jsonl \
 *     --dry-run
 *
 * Requires: EXPO_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
 */
import 'dotenv/config';

import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import {
  defaultRejectsPath,
  readJsonlRecords,
  serializeMeaningReject,
  validateCnmEnrichmentRow,
  type CnmEnrichmentRow,
  type MeaningJsonlReject,
} from './lib/meaningEnrichmentJsonl';

// ── CLI ─────────────────────────────────────────────────────────────────────

type Cli = {
  inputPaths: string[];
  batchSize: number;
  concurrency: number;
  dryRun: boolean;
  rejectsOut: string | null;
};

const DEFAULT_BATCH_SIZE = 500;
const MAX_BATCH_SIZE = 2_000;
const DEFAULT_CONCURRENCY = 4;
const MAX_CONCURRENCY = 16;

function parseArgs(argv: string[]): Cli {
  const inIdx = argv.indexOf('--in');
  if (inIdx < 0 || !argv[inIdx + 1]) {
    throw new Error(
      'Missing --in <path1.jsonl[,path2.jsonl,...]> (comma-separated, no spaces around commas).',
    );
  }
  const inputPaths = argv[inIdx + 1]
    .split(',')
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
  if (inputPaths.length === 0) {
    throw new Error('--in resolved to zero paths after split.');
  }

  const batchSizeIdx = argv.indexOf('--batch-size');
  const batchSizeRaw =
    batchSizeIdx >= 0 ? Number(argv[batchSizeIdx + 1]) : DEFAULT_BATCH_SIZE;
  if (!Number.isInteger(batchSizeRaw) || batchSizeRaw < 1 || batchSizeRaw > MAX_BATCH_SIZE) {
    throw new Error(`--batch-size must be 1..${MAX_BATCH_SIZE}; got ${argv[batchSizeIdx + 1]}`);
  }

  const concIdx = argv.indexOf('--concurrency');
  const concurrencyRaw =
    concIdx >= 0 ? Number(argv[concIdx + 1]) : DEFAULT_CONCURRENCY;
  if (
    !Number.isInteger(concurrencyRaw) ||
    concurrencyRaw < 1 ||
    concurrencyRaw > MAX_CONCURRENCY
  ) {
    throw new Error(
      `--concurrency must be 1..${MAX_CONCURRENCY}; got ${argv[concIdx + 1]}`,
    );
  }

  const dryRun = argv.includes('--dry-run');

  const rejectsIdx = argv.indexOf('--rejects-out');
  const rejectsOut =
    rejectsIdx >= 0 && argv[rejectsIdx + 1] ? argv[rejectsIdx + 1] : null;

  return {
    inputPaths,
    batchSize: batchSizeRaw,
    concurrency: concurrencyRaw,
    dryRun,
    rejectsOut,
  };
}

// ── Validation pass ─────────────────────────────────────────────────────────

type LoadedFile = {
  path: string;
  rows: CnmEnrichmentRow[];
  rejects: MeaningJsonlReject[];
};

function loadAndValidate(filePath: string): LoadedFile {
  const records = readJsonlRecords(filePath);
  const rows: CnmEnrichmentRow[] = [];
  const rejects: MeaningJsonlReject[] = [];
  for (const { row, line } of records) {
    const result = validateCnmEnrichmentRow(row);
    if (result.ok) {
      rows.push(result.row);
    } else {
      rejects.push({
        line,
        source: filePath,
        errors: result.errors,
        row,
      });
    }
  }
  return { path: filePath, rows, rejects };
}

function writeRejects(
  rejects: MeaningJsonlReject[],
  outPath: string,
): void {
  const dir = path.dirname(outPath);
  if (dir) mkdirSync(dir, { recursive: true });
  const body = rejects.map(serializeMeaningReject).join('\n');
  writeFileSync(outPath, body.length > 0 ? `${body}\n` : '', 'utf8');
}

// ── RPC call shape ──────────────────────────────────────────────────────────

type RpcArgs = {
  p_canonical_name_id: string;
  p_meaning: string;
  p_origin: string | null;
  p_gender_scope: CnmEnrichmentRow['gender_scope'];
  p_meaning_language: string;
  p_meaning_source: string;
  p_meaning_confidence: number;
  p_meaning_verified: boolean;
  p_source_priority: number;
  p_review_status: CnmEnrichmentRow['review_status'];
  p_context: Record<string, unknown>;
  p_attempt_context: Record<string, unknown>;
  p_retry_after: string | null;
};

type RpcResult = {
  outcome: 'success' | 'error';
  detail: 'inserted' | 'updated' | 'canonical_name_not_found' | string;
  cnm_id?: string;
  canonical_name_id?: string;
};

function rowToRpcArgs(row: CnmEnrichmentRow): RpcArgs {
  return {
    p_canonical_name_id: row.canonical_name_id,
    p_meaning: row.meaning,
    p_origin: row.origin ?? null,
    p_gender_scope: row.gender_scope,
    p_meaning_language: row.meaning_language,
    p_meaning_source: row.meaning_source,
    p_meaning_confidence: row.meaning_confidence,
    p_meaning_verified: row.meaning_verified,
    p_source_priority: row.source_priority,
    p_review_status: row.review_status,
    p_context: row.context ?? {},
    p_attempt_context: {},
    p_retry_after: null,
  };
}

// ── Concurrency primitive ───────────────────────────────────────────────────
// Small bounded-parallelism pool. Avoids pulling in p-limit for a script.

async function runWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  const lane = async () => {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      results[i] = await worker(items[i], i);
    }
  };
  const lanes = Array.from({ length: Math.min(concurrency, items.length) }, lane);
  await Promise.all(lanes);
  return results;
}

// ── Apply ───────────────────────────────────────────────────────────────────

type ApplyStats = {
  inserted: number;
  updated: number;
  errored: number;
  errors: Array<{
    canonical_name_id: string;
    meaning_source: string;
    detail: string;
  }>;
};

async function applyRowsViaRpc(
  supabase: SupabaseClient,
  rows: CnmEnrichmentRow[],
  concurrency: number,
): Promise<ApplyStats> {
  const stats: ApplyStats = { inserted: 0, updated: 0, errored: 0, errors: [] };

  await runWithConcurrency(rows, concurrency, async (row) => {
    const args = rowToRpcArgs(row);
    const { data, error } = await supabase.rpc(
      'apply_canonical_meaning_enrichment',
      args as unknown as Record<string, unknown>,
    );
    if (error) {
      stats.errored += 1;
      stats.errors.push({
        canonical_name_id: row.canonical_name_id,
        meaning_source: row.meaning_source,
        detail: error.message,
      });
      return;
    }
    const result = (data ?? {}) as RpcResult;
    if (result.outcome === 'success' && result.detail === 'inserted') {
      stats.inserted += 1;
    } else if (result.outcome === 'success' && result.detail === 'updated') {
      stats.updated += 1;
    } else {
      stats.errored += 1;
      stats.errors.push({
        canonical_name_id: row.canonical_name_id,
        meaning_source: row.meaning_source,
        detail: result.detail ?? 'unknown',
      });
    }
  });

  return stats;
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const cli = parseArgs(process.argv.slice(2));

  let totalRows = 0;
  let totalRejects = 0;
  const allValid: CnmEnrichmentRow[] = [];

  for (const inputPath of cli.inputPaths) {
    const loaded = loadAndValidate(inputPath);
    totalRows += loaded.rows.length;
    totalRejects += loaded.rejects.length;
    allValid.push(...loaded.rows);

    if (loaded.rejects.length > 0) {
      const rejectsPath = cli.rejectsOut ?? defaultRejectsPath(inputPath);
      writeRejects(loaded.rejects, rejectsPath);
      console.warn(
        `[applyEnrichmentBatch] ${inputPath}: ${loaded.rejects.length} reject(s) → ${rejectsPath}`,
      );
    }

    console.log(
      `[applyEnrichmentBatch] ${inputPath}: ${loaded.rows.length} valid / ${loaded.rejects.length} rejected`,
    );
  }

  console.log(
    `[applyEnrichmentBatch] total: ${totalRows} valid, ${totalRejects} rejected across ${cli.inputPaths.length} file(s).`,
  );

  if (cli.dryRun) {
    console.log('[applyEnrichmentBatch] --dry-run: no RPC calls performed.');
    if (allValid[0]) {
      console.log(
        '[applyEnrichmentBatch] sample valid row →',
        JSON.stringify(allValid[0], null, 2),
      );
    }
    return;
  }

  if (allValid.length === 0) {
    console.log('[applyEnrichmentBatch] no valid rows to apply; exiting.');
    return;
  }

  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      'Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.',
    );
  }
  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Process in batches so progress is observable and a failure midway through
  // a 50 000-row file doesn't leave the operator wondering where things
  // stand. Each batch is concurrency-limited internally; batches themselves
  // are sequential so total parallelism never exceeds `--concurrency`.
  const totals: ApplyStats = { inserted: 0, updated: 0, errored: 0, errors: [] };
  for (let i = 0; i < allValid.length; i += cli.batchSize) {
    const batch = allValid.slice(i, i + cli.batchSize);
    const batchStart = Date.now();
    const stats = await applyRowsViaRpc(supabase, batch, cli.concurrency);
    totals.inserted += stats.inserted;
    totals.updated += stats.updated;
    totals.errored += stats.errored;
    totals.errors.push(...stats.errors);

    const elapsedMs = Date.now() - batchStart;
    const progress = Math.min(i + cli.batchSize, allValid.length);
    console.log(
      `[applyEnrichmentBatch] batch ${i / cli.batchSize + 1}: ` +
        `${batch.length} rows in ${elapsedMs}ms — ` +
        `inserted=${stats.inserted} updated=${stats.updated} errored=${stats.errored} ` +
        `(${progress}/${allValid.length})`,
    );
  }

  console.log(
    `[applyEnrichmentBatch] done. inserted=${totals.inserted}, updated=${totals.updated}, errored=${totals.errored}.`,
  );

  if (totals.errored > 0) {
    // Print first 10 errors so the operator can diagnose without scrolling
    // through a wall of stack traces.
    const sample = totals.errors.slice(0, 10);
    console.warn('[applyEnrichmentBatch] first errors:');
    for (const e of sample) {
      console.warn(
        `  cnid=${e.canonical_name_id} source=${e.meaning_source} detail=${e.detail}`,
      );
    }
    if (totals.errors.length > sample.length) {
      console.warn(`  …and ${totals.errors.length - sample.length} more.`);
    }
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
