/**
 * Read-only gap finder for the canonical meaning-enrichment queue.
 *
 * Lists canonical names that still need a meaning for a given
 * (meaning_language, gender_scope) slot, ranked for worker intake.
 *
 * Does NOT call LLMs or write to Supabase.
 *
 * Production schema:
 *   * canonical_names.normalized_name (identity key; not normalized_key)
 *   * baby_names.canonical_name_id (FK into canonical_names)
 *   * canonical_name_meanings (coverage check)
 *   * canonical_name_meaning_attempts (negative cache / cooldown)
 *
 * Usage:
 *   tsx scripts/enrichmentGapFinder.ts \
 *     --language en \
 *     --gender-scope any \
 *     --retry-cutoff 30d \
 *     --limit 5000 \
 *     --min-row-count 5 \
 *     --out scripts/data/meaning-enrichment/gaps-en-any.jsonl
 *
 * Requires: EXPO_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 */
import 'dotenv/config';

import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/** CLI gender_scope values — matches CNM / CNMA check constraints. */
export type GenderScope = 'any' | 'boy' | 'girl' | 'neutral';

export type MeaningAttemptOutcome = 'success' | 'miss' | 'error' | 'skipped';

export type EnrichmentGapFinderCli = {
  language: string;
  genderScope: GenderScope;
  /** Block attempts with attempted_at within this window when retry_after is null. */
  retryCutoffMs: number;
  limit: number;
  minRowCount: number;
  out: string;
};

/** One deterministic JSONL output row. Field order is fixed for diff stability. */
export type EnrichmentGapQueueRow = {
  canonical_name_id: string;
  normalized_name: string;
  display_name: string;
  canonical_gender: string | null;
  row_count: number;
  inverse_rank_weight: number;
  touches_premium: boolean;
};

type CanonicalNameRow = {
  id: string;
  normalized_name: string;
  display_name: string;
  gender: string | null;
};

type CanonicalMeaningRow = {
  canonical_name_id: string;
  meaning: string;
  meaning_language: string;
  gender_scope: string;
  review_status: string | null;
};

type MeaningAttemptRow = {
  canonical_name_id: string;
  meaning_language: string;
  gender_scope: string;
  outcome: MeaningAttemptOutcome;
  attempted_at: string;
  retry_after: string | null;
};

type BabyNameLinkRow = {
  canonical_name_id: string;
  is_premium: boolean | null;
  popularity_rank: number | null;
};

type BabyNameAggregate = {
  row_count: number;
  inverse_rank_weight: number;
  touches_premium: boolean;
};

const PAGE_SIZE = 1000;
const DEFAULT_OUT = 'scripts/data/meaning-enrichment/gaps.jsonl';
const DEFAULT_LIMIT = 5000;
const DEFAULT_MIN_ROW_COUNT = 1;
const DEFAULT_RETRY_CUTOFF = '30d';
const RANK_FALLBACK = 1000;

const GENDER_SCOPES = new Set<GenderScope>(['any', 'boy', 'girl', 'neutral']);

function parseDurationMs(raw: string): number {
  const m = raw.trim().match(/^(\d+(?:\.\d+)?)(ms|s|m|h|d)$/i);
  if (!m) {
    throw new Error(`Invalid duration "${raw}" — use e.g. 30d, 12h, 90m`);
  }
  const n = Number(m[1]);
  const unit = m[2].toLowerCase();
  const multipliers: Record<string, number> = {
    ms: 1,
    s: 1000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };
  return Math.floor(n * multipliers[unit]!);
}

function parseArgs(argv: string[]): EnrichmentGapFinderCli {
  const langIdx = argv.indexOf('--language');
  const scopeIdx = argv.indexOf('--gender-scope');
  const cutoffIdx = argv.indexOf('--retry-cutoff');
  const limitIdx = argv.indexOf('--limit');
  const minIdx = argv.indexOf('--min-row-count');
  const outIdx = argv.indexOf('--out');

  if (langIdx < 0 || !argv[langIdx + 1]) {
    throw new Error('Missing --language <code> (e.g. en)');
  }
  if (scopeIdx < 0 || !argv[scopeIdx + 1]) {
    throw new Error('Missing --gender-scope <any|boy|girl|neutral>');
  }

  const genderScope = argv[scopeIdx + 1].trim() as GenderScope;
  if (!GENDER_SCOPES.has(genderScope)) {
    throw new Error(`Invalid --gender-scope "${argv[scopeIdx + 1]}"`);
  }

  const limitRaw = limitIdx >= 0 && argv[limitIdx + 1] ? Number(argv[limitIdx + 1]) : DEFAULT_LIMIT;
  const minRaw = minIdx >= 0 && argv[minIdx + 1] ? Number(argv[minIdx + 1]) : DEFAULT_MIN_ROW_COUNT;

  return {
    language: argv[langIdx + 1].trim().toLowerCase(),
    genderScope,
    retryCutoffMs: parseDurationMs(
      cutoffIdx >= 0 && argv[cutoffIdx + 1] ? argv[cutoffIdx + 1] : DEFAULT_RETRY_CUTOFF,
    ),
    limit: Number.isFinite(limitRaw) && limitRaw > 0 ? Math.floor(limitRaw) : DEFAULT_LIMIT,
    minRowCount: Number.isFinite(minRaw) && minRaw > 0 ? Math.floor(minRaw) : DEFAULT_MIN_ROW_COUNT,
    out: outIdx >= 0 && argv[outIdx + 1] ? argv[outIdx + 1] : DEFAULT_OUT,
  };
}

/** CNM gender_scope values that satisfy the requested enrichment slot. */
function coveringGenderScopes(requested: GenderScope): GenderScope[] {
  if (requested === 'any') return ['any'];
  return ['any', requested];
}

function isNonEmptyMeaning(meaning: string | null | undefined): boolean {
  return typeof meaning === 'string' && meaning.trim().length > 0;
}

function rankWeight(rank: number | null | undefined): number {
  const r = typeof rank === 'number' && Number.isFinite(rank) ? rank : RANK_FALLBACK;
  return 1 / Math.max(Math.floor(r), 1);
}

async function paginate<T>(
  fetchPage: (from: number, pageSize: number) => Promise<T[]>,
): Promise<T[]> {
  const all: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const page = await fetchPage(from, PAGE_SIZE);
    all.push(...page);
    if (page.length < PAGE_SIZE) break;
  }
  return all;
}

async function assertBabyNamesCanonicalLink(supabase: SupabaseClient): Promise<void> {
  const { error } = await supabase.from('baby_names').select('canonical_name_id').limit(1);
  if (error?.message?.includes('canonical_name_id')) {
    throw new Error(
      'baby_names.canonical_name_id is missing — run 20260613_baby_names_canonical_id_repair.sql first',
    );
  }
  if (error) throw new Error(`baby_names probe failed: ${error.message}`);
}

async function fetchCanonicalNames(supabase: SupabaseClient): Promise<CanonicalNameRow[]> {
  return paginate(async (from, pageSize) => {
    const { data, error } = await supabase
      .from('canonical_names')
      .select('id, normalized_name, display_name, gender')
      .order('normalized_name', { ascending: true })
      .range(from, from + pageSize - 1);
    if (error) {
      if (error.message.includes('normalized_name')) {
        throw new Error(
          'canonical_names.normalized_name missing — production schema drift; expected normalized_name not normalized_key',
        );
      }
      throw new Error(`canonical_names fetch failed: ${error.message}`);
    }
    return (data ?? []) as CanonicalNameRow[];
  });
}

async function fetchCoveredCanonicalIds(
  supabase: SupabaseClient,
  language: string,
  genderScopes: GenderScope[],
): Promise<Set<string>> {
  const covered = new Set<string>();
  const scopeSet = new Set<string>(genderScopes);

  await paginate(async (from, pageSize) => {
    const { data, error } = await supabase
      .from('canonical_name_meanings')
      .select('canonical_name_id, meaning, meaning_language, gender_scope, review_status')
      .eq('meaning_language', language)
      .order('canonical_name_id', { ascending: true })
      .range(from, from + pageSize - 1);
    if (error) throw new Error(`canonical_name_meanings fetch failed: ${error.message}`);

    const rows = (data ?? []) as CanonicalMeaningRow[];
    for (const row of rows) {
      if (!scopeSet.has(row.gender_scope as GenderScope)) continue;
      if (row.review_status === 'rejected') continue;
      if (!isNonEmptyMeaning(row.meaning)) continue;
      covered.add(row.canonical_name_id);
    }
    return rows;
  });

  return covered;
}

/**
 * An attempt blocks re-enqueue when the slot is satisfied or still in cooldown.
 * Matches semantics documented in 20260614_meaning_enrichment_attempts.sql.
 */
function attemptBlocksSlot(
  attempt: MeaningAttemptRow,
  language: string,
  genderScope: GenderScope,
  nowMs: number,
  retryCutoffMs: number,
): boolean {
  if (attempt.meaning_language !== language) return false;
  if (attempt.gender_scope !== genderScope) return false;

  switch (attempt.outcome) {
    case 'success':
      return true;
    case 'miss':
      if (attempt.retry_after === null) return true;
      return new Date(attempt.retry_after).getTime() > nowMs;
    case 'error':
    case 'skipped':
      if (attempt.retry_after !== null) {
        return new Date(attempt.retry_after).getTime() > nowMs;
      }
      return nowMs - new Date(attempt.attempted_at).getTime() < retryCutoffMs;
    default:
      return false;
  }
}

async function fetchBlockedCanonicalIds(
  supabase: SupabaseClient,
  language: string,
  genderScope: GenderScope,
  retryCutoffMs: number,
): Promise<Set<string>> {
  const blocked = new Set<string>();
  const nowMs = Date.now();

  try {
    await paginate(async (from, pageSize) => {
      const { data, error } = await supabase
        .from('canonical_name_meaning_attempts')
        .select('canonical_name_id, meaning_language, gender_scope, outcome, attempted_at, retry_after')
        .eq('meaning_language', language)
        .eq('gender_scope', genderScope)
        .order('canonical_name_id', { ascending: true })
        .range(from, from + pageSize - 1);
      if (error) throw error;

      const rows = (data ?? []) as MeaningAttemptRow[];
      for (const row of rows) {
        if (attemptBlocksSlot(row, language, genderScope, nowMs, retryCutoffMs)) {
          blocked.add(row.canonical_name_id);
        }
      }
      return rows;
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('canonical_name_meaning_attempts')) {
      console.warn(
        '[enrichmentGapFinder] canonical_name_meaning_attempts not found — skipping cooldown filter',
      );
      return blocked;
    }
    throw err;
  }

  return blocked;
}

async function aggregateBabyNameStats(
  supabase: SupabaseClient,
): Promise<Map<string, BabyNameAggregate>> {
  const stats = new Map<string, BabyNameAggregate>();

  await paginate(async (from, pageSize) => {
    const { data, error } = await supabase
      .from('baby_names')
      .select('canonical_name_id, is_premium, popularity_rank')
      .not('canonical_name_id', 'is', null)
      .order('id', { ascending: true })
      .range(from, from + pageSize - 1);
    if (error) throw new Error(`baby_names aggregate fetch failed: ${error.message}`);

    const rows = (data ?? []) as BabyNameLinkRow[];
    for (const row of rows) {
      const id = row.canonical_name_id;
      const prev = stats.get(id) ?? {
        row_count: 0,
        inverse_rank_weight: 0,
        touches_premium: false,
      };
      prev.row_count += 1;
      prev.inverse_rank_weight += rankWeight(row.popularity_rank);
      if (row.is_premium === true) prev.touches_premium = true;
      stats.set(id, prev);
    }
    return rows;
  });

  return stats;
}

function compareQueueRows(a: EnrichmentGapQueueRow, b: EnrichmentGapQueueRow): number {
  // 1. Premium-linked names first — highest product impact.
  if (a.touches_premium !== b.touches_premium) {
    return a.touches_premium ? -1 : 1;
  }
  // 2. Popularity impact (sum of 1/rank across linked baby_names rows).
  if (b.inverse_rank_weight !== a.inverse_rank_weight) {
    return b.inverse_rank_weight - a.inverse_rank_weight;
  }
  // 3. Breadth — more deck rows benefit from filling this gap.
  if (b.row_count !== a.row_count) {
    return b.row_count - a.row_count;
  }
  // 4. Stable tie-break for deterministic JSONL.
  return a.normalized_name.localeCompare(b.normalized_name);
}

function serializeGapRow(row: EnrichmentGapQueueRow): string {
  return JSON.stringify({
    canonical_name_id: row.canonical_name_id,
    normalized_name: row.normalized_name,
    display_name: row.display_name,
    canonical_gender: row.canonical_gender,
    row_count: row.row_count,
    inverse_rank_weight: Number(row.inverse_rank_weight.toFixed(6)),
    touches_premium: row.touches_premium,
  });
}

async function main(): Promise<void> {
  const cli = parseArgs(process.argv.slice(2));

  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error('Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  try {
    console.log(`Supabase host (read-only): ${new URL(url).hostname}`);
  } catch {
    /* ignore */
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  await assertBabyNamesCanonicalLink(supabase);

  console.log(
    `[enrichmentGapFinder] language=${cli.language} gender_scope=${cli.genderScope} retry_cutoff=${cli.retryCutoffMs}ms min_row_count=${cli.minRowCount} limit=${cli.limit}`,
  );

  const [canonicalNames, coveredIds, blockedIds, babyStats] = await Promise.all([
    fetchCanonicalNames(supabase),
    fetchCoveredCanonicalIds(supabase, cli.language, coveringGenderScopes(cli.genderScope)),
    fetchBlockedCanonicalIds(supabase, cli.language, cli.genderScope, cli.retryCutoffMs),
    aggregateBabyNameStats(supabase),
  ]);

  const gaps: EnrichmentGapQueueRow[] = [];

  for (const cn of canonicalNames) {
    // Exclude names already covered by CNM for this language + gender scope.
    if (coveredIds.has(cn.id)) continue;
    // Exclude names with a blocking attempt (negative cache / cooldown).
    if (blockedIds.has(cn.id)) continue;

    const agg = babyStats.get(cn.id);
    if (!agg || agg.row_count < cli.minRowCount) continue;

    gaps.push({
      canonical_name_id: cn.id,
      normalized_name: cn.normalized_name,
      display_name: cn.display_name,
      canonical_gender: cn.gender,
      row_count: agg.row_count,
      inverse_rank_weight: agg.inverse_rank_weight,
      touches_premium: agg.touches_premium,
    });
  }

  gaps.sort(compareQueueRows);
  const selected = gaps.slice(0, cli.limit);

  const absOut = path.isAbsolute(cli.out) ? cli.out : path.join(process.cwd(), cli.out);
  mkdirSync(path.dirname(absOut), { recursive: true });
  writeFileSync(
    absOut,
    selected.length > 0 ? `${selected.map(serializeGapRow).join('\n')}\n` : '',
    'utf8',
  );

  console.log(
    `[enrichmentGapFinder] canonical_names=${canonicalNames.length} covered=${coveredIds.size} blocked=${blockedIds.size} gaps=${gaps.length} written=${selected.length} → ${cli.out}`,
  );
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
