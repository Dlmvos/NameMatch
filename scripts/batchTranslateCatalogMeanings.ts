/**
 * Offline batch translator for `public.name_meaning_translations` (import CSV only — no DB writes).
 *
 * ## Purpose
 * Reads canonical name rows (English/catalog `meaning`), calls OpenAI once per language per batch,
 * and appends rows suitable for later upsert on `(name_id, language_code)`.
 *
 * ## Input CSV (header required)
 *   language_code,id,name,meaning,popularity_rank
 * - `language_code`: locale of the **source** `meaning` (usually `en`). Targets equal to this are skipped.
 * - `id`: production `baby_names.id` (**text**, often a UUID string).
 * - `meaning`: factual source line to translate; empty rows are skipped.
 * - `popularity_rank`: optional number; lower = more common. Used to sort work order (common names first).
 *
 * ## Output CSV (header written automatically)
 *   name_id,language_code,meaning,source,confidence,verified
 * - `source` is always `gpt-batch-v1`
 * - `confidence` always `0.85`
 * - `verified` always `false` (import as boolean false)
 *
 * ## Environment (never commit secrets)
 * - `OPENAI_API_KEY` — required unless `--dry-run`
 * - `OPENAI_MODEL` — optional, default `gpt-4o-mini`
 *
 * ## Usage
 * ```bash
 * npm run batch:translate-name-meanings -- \
 *   --input ./scripts/data/name-meanings-source.csv \
 *   --output ./scripts/data/name_meaning_translations.import.csv \
 *   --languages es,pt,nl,de,fr,it \
 *   --batch-size 22 \
 *   --limit 500
 * ```
 *
 * ```bash
 * # Plan only (no API calls, no API key)
 * npm run batch:translate-name-meanings -- --input ./in.csv --output ./out.csv --dry-run
 * ```
 *
 * ## Robustness (model omits ids)
 * Each chunk is requested once; if any ids are missing from the JSON response, the same chunk is
 * retried **once**. Still missing rows are **bisected** (smaller sub-chunks) until singles.
 * Only a **single-row** chunk that still fails after several attempts stops the run (so resume stays consistent).
 *
 * ## Resume
 * If `--output` already exists, existing `(name_id, language_code)` pairs are skipped so you can re-run
 * after failures without paying twice for completed rows.
 *
 * ## Import later (Supabase / Postgres)
 * - Table defaults fill `id`, `created_at`, `updated_at` if omitted.
 * - Prefer SQL `COPY` or Dashboard import mapping columns:
 *     `(name_id, language_code, meaning, source, confidence, verified)`
 * - Upsert in a follow-up migration with `ON CONFLICT (name_id, language_code) DO UPDATE`.
 *
 * ## Limits / risks
 * - LLMs can mistranslate rare senses or punctuation-heavy glosses — review samples per locale.
 * - Cost scales with `(rows × target languages) / batchSize` chat completions; model/env controls spend.
 */
import 'dotenv/config';

import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const SOURCE_TAG = 'gpt-batch-v1';
const CONFIDENCE_DEFAULT = 0.85;
const DEFAULT_BATCH_SIZE = 22;
const ALLOWED_TARGETS = new Set(['en', 'nl', 'de', 'fr', 'es', 'it', 'pt', 'zh', 'ja', 'ko', 'ar']);

const LANG_NAMES: Record<string, string> = {
  en: 'English',
  nl: 'Dutch',
  de: 'German',
  fr: 'French',
  es: 'Spanish',
  it: 'Italian',
  pt: 'Portuguese',
  zh: 'Chinese',
  ja: 'Japanese',
  ko: 'Korean',
  ar: 'Arabic',
};

type InputRow = {
  sourceLang: string;
  id: string;
  name: string;
  meaning: string;
  popularity_rank: number | null;
};

type CliOptions = {
  input: string;
  output: string;
  languages: string[];
  limit: number | null;
  batchSize: number;
  dryRun: boolean;
};

function parseArgs(argv: string[]): CliOptions {
  let input = '';
  let output = '';
  let languages: string[] = ['es', 'pt', 'nl', 'de', 'fr', 'it'];
  let limit: number | null = null;
  let batchSize = DEFAULT_BATCH_SIZE;
  let dryRun = false;

  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') {
      console.log(`batchTranslateCatalogMeanings.ts

Required:
  --input <path>     Source CSV (language_code,id,name,meaning,popularity_rank)
  --output <path>    Append import CSV (name_id,language_code,...)

Optional:
  --languages es,pt,nl,de,fr,it   Target ISO codes (comma-separated, no spaces recommended)
  --limit <n>                     Max source rows after dedupe/sort (default: all)
  --batch-size <n>               Names per initial chunk (default: ${DEFAULT_BATCH_SIZE}; try 10 or 5 if omit-heavy)
  --dry-run                       No OpenAI calls; print planned work only

Env:
  OPENAI_API_KEY   (omit for dry-run)
  OPENAI_MODEL     default gpt-4o-mini`);
      process.exit(0);
    }
    const next = () => {
      const v = argv[++i];
      if (!v || v.startsWith('-')) {
        console.error(`Missing value after ${a}`);
        process.exit(1);
      }
      return v;
    };
    if (a === '--input') input = path.resolve(process.cwd(), next());
    else if (a === '--output') output = path.resolve(process.cwd(), next());
    else if (a === '--languages') {
      languages = next()
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
    } else if (a === '--limit') limit = Math.max(0, parseInt(next(), 10));
    else if (a === '--batch-size') {
      const n = parseInt(next(), 10);
      if (!Number.isFinite(n) || n < 1 || n > 120) {
        console.error('--batch-size must be between 1 and 120');
        process.exit(1);
      }
      batchSize = n;
    } else if (a === '--dry-run') dryRun = true;
    else {
      console.error(`Unknown arg: ${a}`);
      process.exit(1);
    }
  }

  if (!input || !output) {
    console.error('Require --input and --output');
    process.exit(1);
  }

  for (const lang of languages) {
    if (!ALLOWED_TARGETS.has(lang)) {
      console.error(`Unsupported language code: ${lang} (must be one of ${[...ALLOWED_TARGETS].join(', ')})`);
      process.exit(1);
    }
  }

  if (limit !== null && Number.isNaN(limit)) {
    console.error('--limit must be a number');
    process.exit(1);
  }

  return { input, output, languages, limit, batchSize, dryRun };
}

function stripBom(s: string): string {
  return s.charCodeAt(0) === 0xfeff ? s.slice(1) : s;
}

/** Minimal RFC4180-style CSV line parser (single line). */
function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      out.push(cur);
      cur = '';
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out;
}

function csvEscapeCell(value: string): string {
  const s = String(value ?? '');
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function rankKey(rank: number | null): number {
  return rank == null ? Number.POSITIVE_INFINITY : rank;
}

function loadExistingOutputKeys(outputPath: string): Set<string> {
  const keys = new Set<string>();
  if (!existsSync(outputPath)) return keys;
  const raw = stripBom(readFileSync(outputPath, 'utf8'));
  const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length <= 1) return keys;
  const header = parseCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  const idxName = header.indexOf('name_id');
  const idxLang = header.indexOf('language_code');
  if (idxName < 0 || idxLang < 0) {
    console.warn('[resume] Output CSV missing name_id/language_code header — ignoring resume.');
    return keys;
  }
  for (let li = 1; li < lines.length; li++) {
    const cols = parseCsvLine(lines[li]);
    const nameId = cols[idxName]?.trim();
    const lang = cols[idxLang]?.trim().toLowerCase();
    if (nameId && lang) keys.add(`${nameId}|${lang}`);
  }
  return keys;
}

function ensureOutputHeader(outputPath: string): void {
  if (!existsSync(outputPath)) {
    const header = 'name_id,language_code,meaning,source,confidence,verified\n';
    appendFileSync(outputPath, header, 'utf8');
  }
}

function appendOutputRow(
  outputPath: string,
  row: { name_id: string; language_code: string; meaning: string },
): void {
  const line = [
    csvEscapeCell(row.name_id),
    csvEscapeCell(row.language_code),
    csvEscapeCell(row.meaning),
    csvEscapeCell(SOURCE_TAG),
    String(CONFIDENCE_DEFAULT),
    'false',
  ].join(',');
  appendFileSync(outputPath, `${line}\n`, 'utf8');
}

function parseInputCsv(filePath: string): InputRow[] {
  const raw = stripBom(readFileSync(filePath, 'utf8'));
  const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    console.error('Input CSV has no data rows.');
    process.exit(1);
  }
  const header = parseCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  const need = ['language_code', 'id', 'name', 'meaning', 'popularity_rank'];
  const idx: Record<string, number> = {};
  for (const k of need) {
    idx[k] = header.indexOf(k);
    if (idx[k] < 0) {
      console.error(`Input CSV missing column: ${k}`);
      process.exit(1);
    }
  }

  const byId = new Map<string, InputRow>();
  for (let li = 1; li < lines.length; li++) {
    const cols = parseCsvLine(lines[li]);
    const sourceLang = (cols[idx.language_code] ?? '').trim().toLowerCase();
    const id = (cols[idx.id] ?? '').trim();
    const name = (cols[idx.name] ?? '').trim();
    const meaning = (cols[idx.meaning] ?? '').trim();
    const prRaw = (cols[idx.popularity_rank] ?? '').trim();
    const popularity_rank = prRaw === '' ? null : Number(prRaw);

    if (!id || !meaning) continue;

    const row: InputRow = {
      sourceLang: sourceLang || 'en',
      id,
      name,
      meaning,
      popularity_rank: popularity_rank != null && Number.isFinite(popularity_rank) ? popularity_rank : null,
    };

    const prev = byId.get(id);
    if (!prev || rankKey(row.popularity_rank) < rankKey(prev.popularity_rank)) {
      byId.set(id, row);
    }
  }

  const list = [...byId.values()].sort((a, b) => rankKey(a.popularity_rank) - rankKey(b.popularity_rank));
  return list;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

type TranslationJson = { translations?: { id?: string; meaning?: string }[] };

function logOmittedRows(targetLang: string, context: string, omitted: InputRow[]): void {
  console.warn(`[omit] ${context} lang=${targetLang}: ${omitted.length} id(s) missing from model JSON:`);
  for (const r of omitted) {
    console.warn(`       id=${r.id}  name="${r.name}"`);
  }
}

/** One HTTP round-trip; returns partial map (may omit ids). Retries only on transport/HTTP/parse errors. */
async function fetchTranslationsPartialMap(targetLang: string, batch: InputRow[]): Promise<Map<string, string>> {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set');
  }

  const langName = LANG_NAMES[targetLang] ?? targetLang;
  const items = batch.map((r) => ({ id: r.id, name: r.name, meaning: r.meaning }));

  const system = `You translate baby-name dictionary "meaning" glosses for a mobile app.

Rules:
- Preserve factual content; do not embellish, moralize, or add cultural commentary.
- Keep each translation concise and natural in ${langName}.
- Do not invent etymology or facts not present in the source meaning.
- Translate semantic content only; omit the given name from the translation unless grammar requires it.
- Respond with JSON only: {"translations":[{"id":"<exact id>","meaning":"<translated meaning>"}]}
- Include every input id exactly once. Never modify ids.`;

  const user = JSON.stringify({ target_locale: targetLang, items });

  const body = {
    model,
    temperature: 0.2,
    response_format: { type: 'json_object' as const },
    messages: [
      { role: 'system' as const, content: system },
      { role: 'user' as const, content: user },
    ],
  };

  let lastErr: unknown;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const t = await res.text();
        throw new Error(`OpenAI HTTP ${res.status}: ${t.slice(0, 500)}`);
      }

      const json = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const content = json.choices?.[0]?.message?.content;
      if (!content) throw new Error('Empty OpenAI response');

      let parsed: TranslationJson;
      try {
        parsed = JSON.parse(content) as TranslationJson;
      } catch {
        throw new Error('OpenAI returned non-JSON');
      }

      const arr = parsed.translations;
      if (!Array.isArray(arr)) throw new Error('Missing translations array');

      const out = new Map<string, string>();
      for (const row of arr) {
        const id = row.id?.trim();
        const m = row.meaning?.trim();
        if (id && m) out.set(id, m);
      }
      return out;
    } catch (e) {
      lastErr = e;
      await sleep(350 * attempt);
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

function mergeMaps(into: Map<string, string>, from: Map<string, string>): void {
  for (const [k, v] of from) into.set(k, v);
}

function omittedRows(chunk: InputRow[], map: Map<string, string>): InputRow[] {
  return chunk.filter((r) => !map.has(r.id));
}

/**
 * Returns translations for every row in `chunk`. Retries once on omission, then bisects remaining rows.
 * Aborts the process only if a **single-row** chunk still fails after `singleRowAttempts` tries.
 */
async function translateChunkRobust(
  targetLang: string,
  chunk: InputRow[],
  contextLabel: string,
): Promise<Map<string, string>> {
  if (chunk.length === 0) return new Map();

  const combined = new Map<string, string>();

  if (chunk.length === 1) {
    const row = chunk[0];
    const singleRowAttempts = 6;
    for (let attempt = 1; attempt <= singleRowAttempts; attempt++) {
      const m = await fetchTranslationsPartialMap(targetLang, chunk);
      mergeMaps(combined, m);
      if (combined.has(row.id)) return combined;
      console.warn(
        `[omit] single-row retry ${attempt}/${singleRowAttempts} lang=${targetLang} id=${row.id} name="${row.name}"`,
      );
      await sleep(400 * attempt);
    }
    console.error(
      `[fatal] Cannot obtain translation for single-row chunk lang=${targetLang} id=${row.id} name="${row.name}"`,
    );
    process.exit(1);
  }

  let m = await fetchTranslationsPartialMap(targetLang, chunk);
  mergeMaps(combined, m);
  let omitted = omittedRows(chunk, combined);

  if (omitted.length > 0) {
    logOmittedRows(targetLang, `${contextLabel} (after 1st request)`, omitted);
    const mRetry = await fetchTranslationsPartialMap(targetLang, chunk);
    mergeMaps(combined, mRetry);
    omitted = omittedRows(chunk, combined);
  }

  if (omitted.length > 0) {
    logOmittedRows(targetLang, `${contextLabel} (after 2nd request — splitting)`, omitted);
    const mid = Math.ceil(omitted.length / 2);
    const left = omitted.slice(0, mid);
    const right = omitted.slice(mid);
    mergeMaps(combined, await translateChunkRobust(targetLang, left, `${contextLabel}.L`));
    mergeMaps(combined, await translateChunkRobust(targetLang, right, `${contextLabel}.R`));
  }

  const still = omittedRows(chunk, combined);
  if (still.length > 0) {
    logOmittedRows(targetLang, `${contextLabel} (unexpected gap)`, still);
    process.exit(1);
  }

  return combined;
}

async function main(): Promise<void> {
  const opts = parseArgs(process.argv);

  if (!opts.dryRun && !process.env.OPENAI_API_KEY) {
    console.error('Set OPENAI_API_KEY or pass --dry-run');
    process.exit(1);
  }

  const rows = parseInputCsv(opts.input);
  const capped = opts.limit != null ? rows.slice(0, opts.limit) : rows;
  console.log(`Loaded ${rows.length} unique source ids (${capped.length} after --limit).`);
  console.log(`Batch size (initial chunk): ${opts.batchSize}`);

  ensureOutputHeader(opts.output);
  const done = loadExistingOutputKeys(opts.output);
  console.log(`Resume: ${done.size} (name_id,language_code) pairs already in output.`);

  let plannedNewTranslations = 0;

  for (const lang of opts.languages) {
    const skippedResume = capped.filter((r) => done.has(`${r.id}|${lang}`)).length;
    const skippedSameLang = capped.filter((r) => lang === r.sourceLang).length;
    const todo = capped.filter((r) => !done.has(`${r.id}|${lang}`) && lang !== r.sourceLang);
    plannedNewTranslations += todo.length;
    console.log(
      `Language ${lang}: translate ${todo.length} | skip already output ${skippedResume} | skip same-as-source ${skippedSameLang}`,
    );

    const batches: InputRow[][] = [];
    for (let i = 0; i < todo.length; i += opts.batchSize) {
      batches.push(todo.slice(i, i + opts.batchSize));
    }

    for (let bi = 0; bi < batches.length; bi++) {
      const batch = batches[bi];
      if (batch.length === 0) continue;

      if (opts.dryRun) {
        console.log(`  [dry-run] ${lang} batch ${bi + 1}/${batches.length} (${batch.length} names)`);
        continue;
      }

      console.log(`  OpenAI ${lang} batch ${bi + 1}/${batches.length} (${batch.length} names)...`);
      const translated = await translateChunkRobust(lang, batch, `batch ${bi + 1}/${batches.length}`);
      for (const r of batch) {
        const m = translated.get(r.id);
        if (!m) {
          console.error(`Internal error: missing translation after robust merge id=${r.id}`);
          process.exit(1);
        }
        appendOutputRow(opts.output, { name_id: r.id, language_code: lang, meaning: m });
        done.add(`${r.id}|${lang}`);
      }
      await sleep(450);
    }
  }

  if (opts.dryRun) {
    console.log(`\nDry run complete. Planned new translation cells (sum over languages): ${plannedNewTranslations}`);
  } else {
    console.log('\nDone. Append import CSV at:', opts.output);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
