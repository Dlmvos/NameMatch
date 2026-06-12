#!/usr/bin/env node
/**
 * moderateNameMeaningSuggestions.ts
 *
 * Terminal moderation for community "Suggest a meaning" submissions
 * (table public.name_meaning_suggestions, migration 20260623).
 *
 * Uses the service-role key (bypasses RLS) and the SECURITY DEFINER review
 * RPC. Approving promotes the meaning into canonical_name_meanings at
 * source_priority 2 / review_status 'approved' via apply_canonical_meaning_enrichment.
 *
 * Env (load first: `set -a; source .env.scripts; set +a`)
 *   EXPO_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Usage
 *   # list pending queue (default)
 *   tsx scripts/moderateNameMeaningSuggestions.ts
 *   tsx scripts/moderateNameMeaningSuggestions.ts --list --limit 50
 *
 *   # approve as submitted
 *   tsx scripts/moderateNameMeaningSuggestions.ts --approve <id>
 *   # approve with an edited meaning / origin
 *   tsx scripts/moderateNameMeaningSuggestions.ts --approve <id> \
 *     --meaning "Arabic — one who helps" --origin Arabic --note "tidied wording"
 *
 *   # reject
 *   tsx scripts/moderateNameMeaningSuggestions.ts --reject <id> --note spam
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

function lastArg(argv: string[], flag: string): string | undefined {
  for (let i = argv.length - 1; i >= 0; i--) {
    if (argv[i] === flag) return argv[i + 1];
  }
  return undefined;
}

type QueueRow = {
  id: string;
  canonical_name_id: string;
  display_name: string;
  gender: string | null;
  suggested_meaning: string;
  suggested_origin: string | null;
  meaning_language: string;
  submitted_by: string | null;
  created_at: string;
};

function db(): SupabaseClient {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      'Missing EXPO_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY. ' +
        'Load with: set -a; source .env.scripts; set +a',
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function listQueue(client: SupabaseClient, limit: number): Promise<void> {
  const { data, error } = await client
    .from('name_meaning_suggestion_queue')
    .select('*')
    .limit(limit);
  if (error) throw new Error(`queue fetch failed: ${error.message}`);
  const rows = (data ?? []) as QueueRow[];
  if (rows.length === 0) {
    console.log('[moderate] queue empty — no pending suggestions.');
    return;
  }
  console.log(`[moderate] ${rows.length} pending suggestion(s):\n`);
  for (const r of rows) {
    console.log(`  id:      ${r.id}`);
    console.log(`  name:    ${r.display_name} (${r.gender ?? '?'})  [${r.meaning_language}]`);
    console.log(`  meaning: ${r.suggested_meaning}`);
    console.log(`  origin:  ${r.suggested_origin ?? '—'}`);
    console.log(`  by:      ${r.submitted_by ?? '—'}   at ${r.created_at}`);
    console.log(
      `  approve: tsx scripts/moderateNameMeaningSuggestions.ts --approve ${r.id}`,
    );
    console.log('  ' + '-'.repeat(60));
  }
}

async function review(
  client: SupabaseClient,
  id: string,
  decision: 'approve' | 'reject',
  meaning?: string,
  origin?: string,
  note?: string,
): Promise<void> {
  const { data, error } = await client.rpc('review_name_meaning_suggestion', {
    p_id: id,
    p_decision: decision,
    p_final_meaning: meaning ?? null,
    p_final_origin: origin ?? null,
    p_note: note ?? null,
  });
  if (error) throw new Error(`review failed: ${error.message}`);
  console.log(`[moderate] ${decision} →`, JSON.stringify(data));
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const client = db();

  const approveId = lastArg(argv, '--approve');
  const rejectId = lastArg(argv, '--reject');
  const meaning = lastArg(argv, '--meaning');
  const origin = lastArg(argv, '--origin');
  const note = lastArg(argv, '--note');

  if (approveId) {
    await review(client, approveId, 'approve', meaning, origin, note);
    return;
  }
  if (rejectId) {
    await review(client, rejectId, 'reject', undefined, undefined, note);
    return;
  }

  const limit = Number(lastArg(argv, '--limit') ?? 50);
  await listQueue(client, Number.isFinite(limit) && limit > 0 ? limit : 50);
}

void main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
