#!/usr/bin/env node
/**
 * enrichmentFromOpenAI.ts
 *
 * Generate English etymological meanings for the canonical-name gap queue
 * via OpenAI Chat Completions. Output JSONL is compatible with
 * `scripts/applyEnrichmentBatch.ts` and can be applied with the standard
 * `npm run enrich:apply` workflow.
 *
 * Why this exists
 * ───────────────
 * Wikidata's given-name catalog tops out around 50k high-quality entries,
 * mostly Arabic-tradition names. Our catalog has 14k+ uncovered canonical
 * names dominated by Western European languages (Belgian Flemish/Walloon,
 * UK regional, Australian/USA imports). GPT-4o-mini fills that gap at
 * ~$0.50 total for the full sweep with acceptable quality.
 *
 * Cost expectation
 * ────────────────
 * Default --chunk-size=12 sends 12 names per chat completion. For 14k
 * names: ~1.2k API calls × ~700 tokens each = ~840k tokens.
 *   - gpt-4o-mini: $0.15/M input + $0.60/M output ≈ $0.50
 *   - gpt-4o:      $2.50/M input + $10.00/M output ≈ $8.00
 *
 * Resumability
 * ────────────
 * Re-running with --resume reads canonical_name_ids already present in
 * --out and skips them. Use this after a network hiccup or to extend an
 * earlier partial run. Apply step is idempotent regardless.
 *
 * Confidence handling
 * ───────────────────
 * GPT self-rates confidence per name. Rows with confidence < 0.7 get
 * `review_status: 'flagged'` so the curator queue surfaces them; the
 * monotonic UPSERT means a future verified row will overwrite. Rows that
 * fail JSON parse or look like refusals ("I don't know this name") are
 * written to --rejects-out for triage.
 *
 * Usage
 * ─────
 *   npm run enrich:from-openai -- \
 *     --in scripts/data/meaning-enrichment/gaps-en-any.jsonl \
 *     --out scripts/data/meaning-enrichment/openai-en-any.jsonl \
 *     --rejects-out scripts/data/meaning-enrichment/openai-rejects.jsonl \
 *     --concurrency 4 \
 *     --resume
 *
 * Env
 * ───
 *   OPENAI_API_KEY            required
 *   OPENAI_ENRICHMENT_MODEL   optional, defaults to gpt-4o-mini
 */
// Env loading is the caller's responsibility — load via
// `set -a; source .env.scripts; set +a` before invoking. We do NOT
// `import 'dotenv/config'` here: dotenv 17.x's legacy autoload entry
// breaks under Node 24 native `--experimental-strip-types`, and the
// shell-sourced env always wins anyway.

import {
  appendFileSync,
  createReadStream,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { createInterface } from 'node:readline';
import path from 'node:path';

import OpenAI from 'openai';

// ── Types ──────────────────────────────────────────────────────────────────

interface GapRow {
  canonical_name_id: string;
  normalized_name: string;
  display_name: string;
  canonical_gender: string | null;
  row_count: number;
  inverse_rank_weight: number;
  touches_premium: boolean;
}

interface GptOutputRow {
  name: string;
  meaning: string;
  origin?: string;
  confidence?: number;
}

interface CnmEnrichmentRow {
  canonical_name_id: string;
  meaning: string;
  origin: string;
  gender_scope: 'any' | 'boy' | 'girl' | 'neutral';
  meaning_language: 'en';
  meaning_source: string;
  meaning_confidence: number;
  meaning_verified: boolean;
  source_priority: number;
  review_status: 'auto' | 'flagged';
  context: Record<string, unknown>;
}

interface RejectRow {
  canonical_name_id: string;
  display_name: string;
  reason: string;
  raw?: string;
}

// ── CLI parsing — last occurrence wins, so npm script defaults can be ──
//    overridden by user-supplied flags.

interface Cli {
  inPath: string;
  outPath: string;
  rejectsPath: string;
  concurrency: number;
  chunkSize: number;
  resume: boolean;
  model: string;
  limit: number;
  flagBelow: number;
}

function lastArg(argv: string[], flag: string): string | undefined {
  for (let i = argv.length - 1; i >= 0; i--) {
    if (argv[i] === flag) return argv[i + 1];
  }
  return undefined;
}

function parseArgs(argv: string[]): Cli {
  const inPath = lastArg(argv, '--in');
  const outPath = lastArg(argv, '--out');
  const rejectsPath = lastArg(argv, '--rejects-out');
  const concurrency = Number(lastArg(argv, '--concurrency') ?? 4);
  const chunkSize = Number(lastArg(argv, '--chunk-size') ?? 12);
  const limit = Number(lastArg(argv, '--limit') ?? 0);
  const flagBelow = Number(lastArg(argv, '--flag-below') ?? 0.7);
  const model =
    lastArg(argv, '--model') ??
    process.env.OPENAI_ENRICHMENT_MODEL?.trim() ??
    'gpt-4o-mini';

  if (!inPath) throw new Error('Missing --in <gap-queue.jsonl>');
  if (!outPath) throw new Error('Missing --out <openai-en-any.jsonl>');
  if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 16) {
    throw new Error(`--concurrency must be 1..16; got ${concurrency}`);
  }
  if (!Number.isInteger(chunkSize) || chunkSize < 1 || chunkSize > 40) {
    throw new Error(`--chunk-size must be 1..40; got ${chunkSize}`);
  }
  if (!Number.isFinite(flagBelow) || flagBelow < 0 || flagBelow > 1) {
    throw new Error(`--flag-below must be 0..1; got ${flagBelow}`);
  }

  return {
    inPath,
    outPath,
    rejectsPath:
      rejectsPath ?? outPath.replace(/\.jsonl$/, '.rejects.jsonl'),
    concurrency,
    chunkSize,
    resume: argv.includes('--resume'),
    model,
    limit: Number.isFinite(limit) && limit > 0 ? limit : 0,
    flagBelow,
  };
}

// ── Resume support: parse already-emitted canonical_name_ids ──────────────

function readDoneIds(outPath: string): Set<string> {
  if (!existsSync(outPath)) return new Set();
  const done = new Set<string>();
  const raw = readFileSync(outPath, 'utf8');
  for (const line of raw.split('\n')) {
    const t = line.trim();
    if (!t) continue;
    try {
      const row = JSON.parse(t) as { canonical_name_id?: string };
      if (row.canonical_name_id) done.add(row.canonical_name_id);
    } catch {
      // ignore malformed lines from earlier failures
    }
  }
  return done;
}

// ── Gap-queue streaming ────────────────────────────────────────────────────

async function loadGapQueue(inPath: string): Promise<GapRow[]> {
  const out: GapRow[] = [];
  const rl = createInterface({
    input: createReadStream(inPath),
    crlfDelay: Infinity,
  });
  for await (const line of rl) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    try {
      const row = JSON.parse(t) as GapRow;
      if (row.canonical_name_id && row.display_name) {
        out.push(row);
      }
    } catch {
      // skip malformed
    }
  }
  return out;
}

// ── Prompt + GPT call ──────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You provide brief, accurate etymological meanings for given names used in a baby-name app.

For each name in the user's list, return a one-sentence meaning that includes:
- The etymological origin/derivation
- The literal meaning if known
- The cultural/religious significance if highly relevant

If you genuinely don't know a name's meaning, return confidence: 0 and meaning: "unknown".

Rules:
- Each meaning must be 5-160 characters.
- Origin must be a short label like "Hebrew", "Arabic", "Greek", "Old English", "Latin", "Slavic", "Germanic", "Celtic", "Sanskrit", or a more specific tradition.
- Confidence is a number 0..1 representing your certainty.
- Do not add disclaimers, caveats, or "I believe..." prefixes — write the meaning as a fact.
- Do not return the name itself as the meaning ("Maria means Maria" is invalid).

Return ONLY a JSON array. No markdown fences. Each element must be:
{"name":"X","meaning":"Y","origin":"Z","confidence":0.85}`;

async function callGpt(
  client: OpenAI,
  model: string,
  chunk: GapRow[],
): Promise<GptOutputRow[]> {
  const userMessage = `Names:\n${chunk.map((c, i) => `${i + 1}. ${c.display_name}`).join('\n')}\n\nReturn the JSON array now.`;

  const resp = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userMessage },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.2,
  });

  const text = resp.choices[0]?.message?.content ?? '';
  // We asked for json_object; the model wraps the array in an object key.
  // Tolerate either {"results":[...]} or a raw array.
  const parsed = JSON.parse(text);
  if (Array.isArray(parsed)) return parsed as GptOutputRow[];
  for (const k of ['results', 'meanings', 'names', 'data']) {
    if (Array.isArray((parsed as Record<string, unknown>)[k])) {
      return (parsed as Record<string, unknown>)[k] as GptOutputRow[];
    }
  }
  throw new Error(`GPT response did not contain an array: ${text.slice(0, 200)}`);
}

// ── Validation + row construction ──────────────────────────────────────────

function isMeaningInvalid(meaning: string, displayName: string): string | null {
  const m = meaning.trim();
  if (!m) return 'empty meaning';
  if (m.length < 5) return 'meaning too short';
  if (m.length > 220) return 'meaning too long';
  if (m.toLowerCase() === 'unknown') return 'model returned "unknown"';
  if (/^(i (don'?t|do not|cannot|can'?t)|sorry|unfortunately)/i.test(m))
    return 'looks like a refusal';
  if (m.toLowerCase().includes(`means ${displayName.toLowerCase()}`))
    return 'tautological meaning';
  return null;
}

const SOURCE_PRIORITY_OPENAI = 6; // higher number = lower priority than
                                  // curated-core (4) and Wikidata (3)

function buildCnmRow(
  gap: GapRow,
  gpt: GptOutputRow,
  model: string,
  flagBelow: number,
): CnmEnrichmentRow {
  const conf =
    typeof gpt.confidence === 'number' && Number.isFinite(gpt.confidence)
      ? Math.max(0, Math.min(1, gpt.confidence))
      : 0.6;
  const reviewStatus: 'auto' | 'flagged' = conf < flagBelow ? 'flagged' : 'auto';
  const genderScope: CnmEnrichmentRow['gender_scope'] =
    gap.canonical_gender === 'boy' || gap.canonical_gender === 'girl'
      ? gap.canonical_gender
      : 'any';
  return {
    canonical_name_id: gap.canonical_name_id,
    meaning: gpt.meaning.trim(),
    origin: (gpt.origin ?? '').trim(),
    gender_scope: genderScope,
    meaning_language: 'en',
    meaning_source: `openai:${model}`,
    meaning_confidence: conf,
    meaning_verified: false,
    source_priority: SOURCE_PRIORITY_OPENAI,
    review_status: reviewStatus,
    context: {
      enrichment_stage: 'openai',
      pipeline_version: 'openai-en-any-v1',
      normalized_name: gap.normalized_name,
      display_name: gap.display_name,
      gap_row_count: gap.row_count,
      gap_touches_premium: gap.touches_premium,
      gap_inverse_rank_weight: Number(gap.inverse_rank_weight.toFixed(6)),
    },
  };
}

// ── Concurrency-limited fan-out ───────────────────────────────────────────

async function runWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<void> {
  let i = 0;
  async function next(): Promise<void> {
    while (true) {
      const idx = i++;
      if (idx >= items.length) return;
      try {
        await worker(items[idx], idx);
      } catch (err) {
        console.error(`[runWithConcurrency] item ${idx} threw:`, err);
      }
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => next()),
  );
}

// ── Main ──────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  // Print the startup banner BEFORE validating env vars so that even a
  // hard exit (e.g. missing OPENAI_API_KEY) leaves a visible trace in
  // the terminal — previously the throw fired before any console.log,
  // which produced a confusingly silent npm/nohup exit.
  const cli = parseArgs(process.argv.slice(2));
  console.log(
    `[enrichmentFromOpenAI] in=${cli.inPath} out=${cli.outPath} ` +
      `model=${cli.model} chunk=${cli.chunkSize} concurrency=${cli.concurrency}`,
  );

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'Missing OPENAI_API_KEY. Add it to .env.scripts and run ' +
        '`set -a; source .env.scripts; set +a` before invoking.',
    );
  }

  // Prepare output dir
  mkdirSync(path.dirname(cli.outPath), { recursive: true });
  if (!existsSync(cli.outPath)) writeFileSync(cli.outPath, '');
  mkdirSync(path.dirname(cli.rejectsPath), { recursive: true });
  if (!existsSync(cli.rejectsPath)) writeFileSync(cli.rejectsPath, '');

  const gaps = await loadGapQueue(cli.inPath);
  console.log(`[enrichmentFromOpenAI] loaded ${gaps.length} gap rows`);

  let pending = gaps;
  if (cli.resume) {
    const done = readDoneIds(cli.outPath);
    pending = gaps.filter((g) => !done.has(g.canonical_name_id));
    console.log(
      `[enrichmentFromOpenAI] resume — skipping ${done.size} already-done; ${pending.length} remaining`,
    );
  }
  if (cli.limit > 0) {
    pending = pending.slice(0, cli.limit);
    console.log(`[enrichmentFromOpenAI] --limit=${cli.limit} applied`);
  }

  // Sort pending so high-impact rows go first: higher inverse_rank_weight
  // = more popular name = more baby_names rows benefit.
  pending.sort(
    (a, b) =>
      (b.inverse_rank_weight ?? 0) - (a.inverse_rank_weight ?? 0) ||
      b.row_count - a.row_count,
  );

  // Chunk
  const chunks: GapRow[][] = [];
  for (let i = 0; i < pending.length; i += cli.chunkSize) {
    chunks.push(pending.slice(i, i + cli.chunkSize));
  }
  console.log(
    `[enrichmentFromOpenAI] ${chunks.length} chunks of up to ${cli.chunkSize} names`,
  );

  const client = new OpenAI({ apiKey });

  let okRows = 0;
  let rejectedRows = 0;
  let processedChunks = 0;
  const startedAt = Date.now();

  await runWithConcurrency(chunks, cli.concurrency, async (chunk, idx) => {
    let gpt: GptOutputRow[];
    try {
      gpt = await callGpt(client, cli.model, chunk);
    } catch (err) {
      const reason =
        err instanceof Error ? `gpt-call-failed: ${err.message}` : 'gpt-call-failed';
      const lines = chunk
        .map((g) =>
          JSON.stringify({
            canonical_name_id: g.canonical_name_id,
            display_name: g.display_name,
            reason,
          } satisfies RejectRow),
        )
        .join('\n');
      appendFileSync(cli.rejectsPath, lines + '\n');
      rejectedRows += chunk.length;
      processedChunks += 1;
      return;
    }

    // Pair GPT output back to gap rows. GPT preserves order ~99% of the
    // time, but we also do a name-match fallback so a shuffled response
    // doesn't silently misalign meanings.
    const byName = new Map<string, GptOutputRow>();
    for (const r of gpt) {
      if (r && typeof r.name === 'string') byName.set(r.name.toLowerCase(), r);
    }

    const okLines: string[] = [];
    const rejectLines: string[] = [];
    for (let i = 0; i < chunk.length; i++) {
      const gap = chunk[i];
      const candidate =
        byName.get(gap.display_name.toLowerCase()) ?? gpt[i];
      if (!candidate || typeof candidate.meaning !== 'string') {
        rejectLines.push(
          JSON.stringify({
            canonical_name_id: gap.canonical_name_id,
            display_name: gap.display_name,
            reason: 'no-matching-gpt-row',
            raw: candidate ? JSON.stringify(candidate) : undefined,
          } satisfies RejectRow),
        );
        continue;
      }
      const reason = isMeaningInvalid(candidate.meaning, gap.display_name);
      if (reason) {
        rejectLines.push(
          JSON.stringify({
            canonical_name_id: gap.canonical_name_id,
            display_name: gap.display_name,
            reason,
            raw: candidate.meaning,
          } satisfies RejectRow),
        );
        continue;
      }
      const row = buildCnmRow(gap, candidate, cli.model, cli.flagBelow);
      okLines.push(JSON.stringify(row));
    }
    if (okLines.length) appendFileSync(cli.outPath, okLines.join('\n') + '\n');
    if (rejectLines.length)
      appendFileSync(cli.rejectsPath, rejectLines.join('\n') + '\n');
    okRows += okLines.length;
    rejectedRows += rejectLines.length;
    processedChunks += 1;
    if (processedChunks % 10 === 0) {
      const elapsed = (Date.now() - startedAt) / 1000;
      const rate = okRows / Math.max(elapsed, 1);
      console.log(
        `[enrichmentFromOpenAI] chunks=${processedChunks}/${chunks.length} ` +
          `ok=${okRows} rejected=${rejectedRows} rate=${rate.toFixed(1)}/s`,
      );
    }
  });

  const elapsed = (Date.now() - startedAt) / 1000;
  console.log(
    `\n[enrichmentFromOpenAI] done. ${processedChunks} chunks processed in ${elapsed.toFixed(1)}s.`,
  );
  console.log(`  ok rows written:   ${okRows}  → ${cli.outPath}`);
  console.log(`  rejected rows:     ${rejectedRows}  → ${cli.rejectsPath}`);
  console.log(
    `\nNext step:\n  npm run enrich:apply:dry-run -- --in ${cli.outPath}\n  npm run enrich:apply -- --in ${cli.outPath} --batch-size 500 --concurrency 4`,
  );
}

void main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
