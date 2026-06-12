#!/usr/bin/env node
/**
 * purgePlaceholderMeanings.ts
 *
 * Deletes "non-answer" / placeholder meanings that slipped past the OpenAI
 * enrichment quality filter — rows whose entire text is a non-answer
 * ("Unknown; possibly a variant of another name", "Arabic name", "Of Irish
 * origin") rather than an actual etymology.
 *
 * Detection is delegated to placeholderMeaningReason() in
 * ./lib/meaningEnrichmentJsonl so this purge stays in lock-step with the
 * generator filter (enrichmentFromOpenAI.ts). A name only "loses" a row here
 * if the row carried no real meaning to begin with.
 *
 * Safety
 * ──────
 *  - DRY-RUN BY DEFAULT. Pass --apply to actually delete.
 *  - Every matched row is written to a dated backup JSONL BEFORE deletion, so
 *    a purge is fully recoverable (re-apply via enrich:apply).
 *  - Only touches LLM-tier rows: meaning_source ILIKE 'openai:%' (excluding
 *    ':translation') and source_priority >= 5 — curated (1) and Wikidata (3)
 *    are never matched.
 *  - DELETE (not mark-rejected): a 'rejected' row is immutable in the apply
 *    RPC and would block a later manual/curated meaning for that name.
 *
 * Env (load first: `set -a; source .env.scripts; set +a`)
 *   EXPO_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Usage
 *   tsx scripts/purgePlaceholderMeanings.ts                 # dry-run, en
 *   tsx scripts/purgePlaceholderMeanings.ts --apply         # execute
 *   tsx scripts/purgePlaceholderMeanings.ts --language en --apply
 */
import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { placeholderMeaningReason } from './lib/meaningEnrichmentJsonl';

type Cli = {
  language: string;
  apply: boolean;
  backupPath: string;
};

function lastArg(argv: string[], flag: string): string | undefined {
  for (let i = argv.length - 1; i >= 0; i--) {
    if (argv[i] === flag) return argv[i + 1];
  }
  return undefined;
}

function parseArgs(argv: string[]): Cli {
  const language = (lastArg(argv, '--language') ?? 'en').trim().toLowerCase();
  const apply = argv.includes('--apply');
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const backupPath =
    lastArg(argv, '--backup-out') ??
    path.join(
      'scripts/data/meaning-enrichment',
      `purged-placeholders-${language}-${stamp}.jsonl`,
    );
  return { language, apply, backupPath };
}

type CnmRow = {
  id: string;
  canonical_name_id: string;
  meaning: string;
  gender_scope: string;
  meaning_language: string;
  meaning_source: string;
  meaning_confidence: number | null;
  source_priority: number | null;
  review_status: string;
  context: Record<string, unknown> | null;
};

const SELECT_COLS =
  'id,canonical_name_id,meaning,gender_scope,meaning_language,meaning_source,' +
  'meaning_confidence,source_priority,review_status,context';

async function fetchLlmRows(
  db: SupabaseClient,
  language: string,
): Promise<CnmRow[]> {
  const pageSize = 1000;
  let from = 0;
  const all: CnmRow[] = [];
  for (;;) {
    const { data, error } = await db
      .from('canonical_name_meanings')
      .select(SELECT_COLS)
      .eq('meaning_language', language)
      .ilike('meaning_source', 'openai:%')
      .gte('source_priority', 5)
      .order('id', { ascending: true })
      .range(from, from + pageSize - 1);
    if (error) throw new Error(`fetch failed @${from}: ${error.message}`);
    const rows = (data ?? []) as CnmRow[];
    all.push(...rows);
    if (rows.length < pageSize) break;
    from += pageSize;
  }
  return all;
}

async function main(): Promise<void> {
  const cli = parseArgs(process.argv.slice(2));
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      'Missing EXPO_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY. ' +
        'Load with: set -a; source .env.scripts; set +a',
    );
  }

  const db = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log(
    `[purge] language=${cli.language} mode=${cli.apply ? 'APPLY' : 'dry-run'}`,
  );

  const rows = await fetchLlmRows(db, cli.language);
  console.log(`[purge] scanned ${rows.length} LLM-tier ${cli.language} rows`);

  // Translations are derived from the English source_meaning; handle EN first.
  const candidates = rows.filter(
    (r) => !r.meaning_source.endsWith(':translation'),
  );

  const matched: Array<{ row: CnmRow; reason: string }> = [];
  for (const row of candidates) {
    // Never touch human-locked rows.
    if (row.review_status === 'approved' || row.review_status === 'rejected') {
      continue;
    }
    const reason = placeholderMeaningReason(row.meaning);
    if (reason) matched.push({ row, reason });
  }

  // Breakdown by reason
  const byReason = new Map<string, number>();
  for (const m of matched) byReason.set(m.reason, (byReason.get(m.reason) ?? 0) + 1);

  console.log(`\n[purge] ${matched.length} placeholder rows matched:`);
  for (const [reason, n] of [...byReason.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(n).padStart(5)}  ${reason}`);
  }

  console.log(`\n[purge] sample (up to 20):`);
  for (const { row, reason } of matched.slice(0, 20)) {
    const name = (row.context?.['display_name'] as string) ?? '?';
    console.log(
      `  [${reason.slice(0, 28).padEnd(28)}] ${name.padEnd(16)} → ${row.meaning}`,
    );
  }

  if (matched.length === 0) {
    console.log('\n[purge] nothing to do.');
    return;
  }

  // Always write the backup (recovery + audit), even in dry-run.
  mkdirSync(path.dirname(cli.backupPath), { recursive: true });
  writeFileSync(cli.backupPath, '');
  for (const { row, reason } of matched) {
    appendFileSync(
      cli.backupPath,
      JSON.stringify({ purge_reason: reason, ...row }) + '\n',
    );
  }
  console.log(`\n[purge] backup written → ${cli.backupPath}`);

  if (!cli.apply) {
    console.log('[purge] DRY-RUN: no rows deleted. Re-run with --apply to delete.');
    return;
  }

  // Delete in id batches.
  const ids = matched.map((m) => m.row.id);
  const batchSize = 200;
  let deleted = 0;
  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);
    const { error } = await db
      .from('canonical_name_meanings')
      .delete()
      .in('id', batch);
    if (error) throw new Error(`delete batch @${i} failed: ${error.message}`);
    deleted += batch.length;
    console.log(`[purge] deleted ${deleted}/${ids.length}`);
  }
  console.log(`\n[purge] DONE. ${deleted} rows deleted. Backup: ${cli.backupPath}`);
}

void main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
