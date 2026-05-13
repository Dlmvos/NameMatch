/**
 * Translate bundled meaning jobs via OpenAI Chat Completions.
 *
 * Env:
 *   OPENAI_API_KEY (required)
 *   OPENAI_TRANSLATION_MODEL (optional, default gpt-4o-mini)
 *
 * Input:  data/bundled_meaning_translation_jobs.jsonl (or first CLI arg)
 * Output: data/bundled_meaning_translations.generated.csv
 *         data/bundled_meaning_translations.failed.csv
 */
import 'dotenv/config';

import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import OpenAI from 'openai';

import {
  BUNDLE_MEANING_LOCALES,
  validateGeneratedMeaning,
} from './lib/bundledMeaningTranslationPipeline';

type Job = { id: string; name: string; en_meaning: string; locale: string };

type GptRow = { id: string; locale: string; meaning: string };

const DEFAULT_JOBS = path.join(process.cwd(), 'data', 'bundled_meaning_translation_jobs.jsonl');
const OUT_CSV = path.join(process.cwd(), 'data', 'bundled_meaning_translations.generated.csv');
const FAIL_CSV = path.join(process.cwd(), 'data', 'bundled_meaning_translations.failed.csv');

const CHUNK_SIZE = 12;
const MODEL = process.env.OPENAI_TRANSLATION_MODEL?.trim() || 'gpt-4o-mini';

const SYSTEM = `You translate short baby-name meaning phrases for a mobile app UI.
Rules:
- Translate only the meaning text (the gloss), never the person's name.
- Keep text short and natural in the target language.
- Preserve semicolon-separated concepts (use the same separator style).
- Do not add explanations, labels, or quotes around the output.
- Do not append language tags like [nl] or [de].
- Do not embed bracket tags like [es] in the text.
- Do not return English unchanged except for unavoidable proper nouns (rare).
- Target languages: nl Dutch, de German, fr French, es Spanish, it Italian, pt Portuguese, zh Simplified Chinese, ja Japanese, ko Korean, ar Modern Standard Arabic.
Return ONLY a JSON array. No markdown fences. Each element must be: {"id":"...","locale":"...","meaning":"..."}`;

function loadJobs(filePath: string): Job[] {
  const raw = readFileSync(filePath, 'utf8');
  const jobs: Job[] = [];
  for (const line of raw.split('\n')) {
    const t = line.trim();
    if (!t) continue;
    try {
      jobs.push(JSON.parse(t) as Job);
    } catch {
      console.warn('Skip bad JSONL line:', t.slice(0, 120));
    }
  }
  return jobs;
}

function stripJsonFence(text: string): string {
  const m = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return m ? m[1].trim() : text.trim();
}

function parseGptJsonArray(text: string): GptRow[] {
  const cleaned = stripJsonFence(text);
  const data = JSON.parse(cleaned) as unknown;
  if (!Array.isArray(data)) throw new Error('Response is not a JSON array');
  return data.map((row) => {
    const r = row as Record<string, unknown>;
    return {
      id: String(r.id ?? ''),
      locale: String(r.locale ?? ''),
      meaning: String(r.meaning ?? ''),
    };
  });
}

function csvMeaningRow(id: string, locale: string, meaning: string): string {
  const escaped = meaning.replace(/"/g, '""');
  return `${id},${locale},"${escaped}"\n`;
}

function writeHeaders(): void {
  mkdirSync(path.dirname(OUT_CSV), { recursive: true });
  writeFileSync(OUT_CSV, 'id,locale,meaning\n', 'utf8');
  writeFileSync(FAIL_CSV, 'id,locale,en_meaning,reason,attempt\n', 'utf8');
}

function appendFail(job: Job, reason: string, attempt: number): void {
  const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
  appendFileSync(
    FAIL_CSV,
    `${job.id},${job.locale},${esc(job.en_meaning)},${esc(reason)},${attempt}\n`,
    'utf8',
  );
}

function jobKey(job: Pick<Job, 'id' | 'locale'>): string {
  return `${job.id}\0${job.locale}`;
}

function validateRow(
  row: GptRow,
  jobByKey: Map<string, Job>,
): { ok: true; job: Job } | { ok: false; reason: string } {
  const job = jobByKey.get(jobKey(row));
  if (!job) return { ok: false, reason: 'unknown_id_locale' };
  if (!(BUNDLE_MEANING_LOCALES as readonly string[]).includes(row.locale)) {
    return { ok: false, reason: 'bad_locale' };
  }
  const v = validateGeneratedMeaning(row.meaning, row.locale, job.en_meaning);
  if (!v.ok) return { ok: false, reason: v.reason };
  return { ok: true, job };
}

async function chatOnce(openai: OpenAI, user: string): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: MODEL,
    temperature: 0.25,
    messages: [
      { role: 'system', content: SYSTEM },
      { role: 'user', content: user },
    ],
  });
  return completion.choices[0]?.message?.content ?? '';
}

async function translateChunk(openai: OpenAI, chunk: Job[]): Promise<GptRow[]> {
  const payload = chunk.map((j) => ({
    id: j.id,
    name: j.name,
    locale: j.locale,
    en_meaning: j.en_meaning,
  }));
  const user = `Translate each item's en_meaning into the target locale. Return a JSON array of objects with keys id, locale, meaning only.\n${JSON.stringify(payload)}`;
  const text = await chatOnce(openai, user);
  return parseGptJsonArray(text);
}

async function translateSingleRetry(openai: OpenAI, job: Job): Promise<GptRow | null> {
  const user = `Translate this one meaning gloss only (not the name). Return ONLY one JSON object, no array.
id: ${job.id}
locale: ${job.locale}
name (context only, do not translate): ${job.name}
en_meaning: ${JSON.stringify(job.en_meaning)}
Output shape: {"id":"${job.id}","locale":"${job.locale}","meaning":"..."}`;
  const text = await chatOnce(openai, user);
  let row: GptRow;
  try {
    const cleaned = stripJsonFence(text);
    const one = JSON.parse(cleaned) as Record<string, unknown>;
    row = {
      id: String(one.id ?? ''),
      locale: String(one.locale ?? ''),
      meaning: String(one.meaning ?? ''),
    };
  } catch {
    return null;
  }
  return row;
}

function parseGeneratedCsvLine(line: string): { id: string; locale: string; meaning: string } | null {
  const t = line.trim();
  if (!t || t === 'id,locale,meaning') return null;
  const firstComma = t.indexOf(',');
  if (firstComma < 0) return null;
  const id = t.slice(0, firstComma);
  const rest = t.slice(firstComma + 1);
  const secondComma = rest.indexOf(',');
  if (secondComma < 0) return null;
  const locale = rest.slice(0, secondComma);
  let field = rest.slice(secondComma + 1).trim();
  if (!field.startsWith('"')) return null;
  field = field.slice(1);
  let meaning = '';
  for (let i = 0; i < field.length; i++) {
    const ch = field[i];
    if (ch === '"' && field[i + 1] === '"') {
      meaning += '"';
      i++;
      continue;
    }
    if (ch === '"') break;
    meaning += ch;
  }
  return { id, locale, meaning };
}

async function main(): Promise<void> {
  const jobsPath = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_JOBS;
  if (!process.env.OPENAI_API_KEY?.trim()) {
    console.error('Missing OPENAI_API_KEY');
    process.exit(1);
  }

  const jobs = loadJobs(jobsPath);
  if (jobs.length === 0) {
    console.log('No jobs to translate.');
    writeHeaders();
    return;
  }

  const jobByKey = new Map<string, Job>();
  for (const j of jobs) jobByKey.set(jobKey(j), j);

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  writeHeaders();

  console.log(`Model: ${MODEL}, jobs: ${jobs.length}, chunk: ${CHUNK_SIZE}`);

  for (let i = 0; i < jobs.length; i += CHUNK_SIZE) {
    const chunk = jobs.slice(i, i + CHUNK_SIZE);
    let rows: GptRow[] = [];
    try {
      rows = await translateChunk(openai, chunk);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      for (const j of chunk) appendFail(j, `chunk_error:${msg}`, 1);
      console.warn(`Chunk ${i} failed:`, msg);
      continue;
    }

    const okKeys = new Set<string>();
    for (const row of rows) {
      const v = validateRow(row, jobByKey);
      if (!v.ok) continue;
      appendFileSync(OUT_CSV, csvMeaningRow(row.id, row.locale, row.meaning), 'utf8');
      okKeys.add(jobKey(row));
    }

    for (const j of chunk) {
      if (okKeys.has(jobKey(j))) continue;
      let row2: GptRow | null = null;
      try {
        row2 = await translateSingleRetry(openai, j);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        appendFail(j, `retry_error:${msg}`, 2);
        continue;
      }
      const v2 = row2 ? validateRow(row2, jobByKey) : { ok: false as const, reason: 'empty' };
      if (v2.ok) {
        appendFileSync(OUT_CSV, csvMeaningRow(row2!.id, row2!.locale, row2!.meaning), 'utf8');
      } else {
        appendFail(j, v2.reason, 2);
      }
    }

    console.log(`Progress ${Math.min(i + CHUNK_SIZE, jobs.length)}/${jobs.length}`);
  }

  console.log(`Done. Output: ${OUT_CSV}`);
  console.log(`Failures: ${FAIL_CSV}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});