/**
 * Read-only coverage report: `public.name_meaning_translations` vs `baby_names.meaning`
 * (canonical English/non-empty catalog line).
 *
 * Requires: EXPO_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (see other scripts).
 *
 * Usage:
 *   npm run report:name-meanings:coverage
 *   npm run report:name-meanings:coverage -- --csv ./reports/missing.csv
 */
import 'dotenv/config';

import { createWriteStream } from 'node:fs';
import path from 'node:path';

import { createClient } from '@supabase/supabase-js';

/** Align with `NAME_MEANING_TRANSLATION_LAUNCH_PRIORITY` in src/services/languageService.ts */
const LAUNCH_LANGUAGE_CODES = ['en', 'es', 'pt', 'nl', 'de', 'fr', 'it'] as const;
const SECONDARY_LANGUAGE_CODES = ['zh', 'ja', 'ko', 'ar'] as const;
const ALL_LANGUAGE_CODES = [...LAUNCH_LANGUAGE_CODES, ...SECONDARY_LANGUAGE_CODES] as const;

type LangCode = (typeof ALL_LANGUAGE_CODES)[number];

type CanonicalRow = {
  id: string;
  name: string;
  popularity_rank: number | null;
};

const PAGE = 1000;

function hasCanonicalMeaning(meaning: string | null | undefined): boolean {
  return Boolean(meaning && meaning.trim().length > 0);
}

function csvEscape(value: string): string {
  const s = String(value ?? '');
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function parseArgs(argv: string[]): { csvOut?: string } {
  const out: { csvOut?: string } = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') {
      console.log(`Usage: tsx scripts/reportCatalogMeaningTranslationCoverage.ts [--csv <path>]`);
      process.exit(0);
    }
    if (a === '--csv') {
      const p = argv[i + 1];
      if (!p || p.startsWith('-')) {
        console.error('--csv requires a file path');
        process.exit(1);
      }
      out.csvOut = path.resolve(process.cwd(), p);
      i++;
    }
  }
  return out;
}

function rankSortKey(rank: number | null): number {
  return rank == null ? 9e9 : rank;
}

async function main(): Promise<void> {
  const { csvOut } = parseArgs(process.argv);

  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error('Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  try {
    console.log(`Supabase host: ${new URL(url).hostname}`);
  } catch {
    /* ignore */
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const canonicalRows: CanonicalRow[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data: rows, error } = await supabase
      .from('baby_names')
      .select('id,name,meaning,popularity_rank')
      .not('meaning', 'is', null)
      .order('id', { ascending: true })
      .range(from, from + PAGE - 1);

    if (error) {
      console.error('baby_names fetch failed:', error.message);
      process.exit(1);
    }
    if (!rows?.length) break;
    for (const r of rows as { id: string; name: string; meaning: string | null; popularity_rank: number | null }[]) {
      if (!hasCanonicalMeaning(r.meaning)) continue;
      canonicalRows.push({
        id: r.id,
        name: r.name,
        popularity_rank: r.popularity_rank,
      });
    }
    if (rows.length < PAGE) break;
  }

  const canonicalIds = new Set(canonicalRows.map((r) => r.id));
  const totalCanonical = canonicalIds.size;

  const translatedByLang = new Map<LangCode, Set<string>>();
  for (const code of ALL_LANGUAGE_CODES) translatedByLang.set(code, new Set());

  for (let from = 0; ; from += PAGE) {
    const { data: rows, error } = await supabase
      .from('name_meaning_translations')
      .select('name_id,language_code,meaning')
      .in('language_code', [...ALL_LANGUAGE_CODES])
      .not('meaning', 'is', null)
      .order('name_id', { ascending: true })
      .range(from, from + PAGE - 1);

    if (error) {
      console.error('name_meaning_translations fetch failed:', error.message);
      process.exit(1);
    }
    if (!rows?.length) break;
    for (const r of rows as { name_id: string; language_code: string; meaning: string | null }[]) {
      if (!r.meaning?.trim()) continue;
      const lang = r.language_code as LangCode;
      const bucket = translatedByLang.get(lang);
      if (bucket && canonicalIds.has(r.name_id)) bucket.add(r.name_id);
    }
    if (rows.length < PAGE) break;
  }

  console.log('');
  console.log('Localized catalog meaning coverage (name_meaning_translations ∩ canonical baby_names)');
  console.log(`Canonical baby_names (non-empty meaning): ${totalCanonical}`);
  console.log('');

  const printBlock = (title: string, codes: readonly LangCode[]) => {
    console.log(title);
    for (const lang of codes) {
      const translated = translatedByLang.get(lang)?.size ?? 0;
      const pct = totalCanonical > 0 ? (100 * translated) / totalCanonical : 0;
      const missing = totalCanonical - translated;
      console.log(
        `  ${lang.padEnd(4)}  translated ${translated} / ${totalCanonical}  (${pct.toFixed(1)}%)  missing ${missing}`,
      );
    }
    console.log('');
  };

  printBlock('Launch languages:', LAUNCH_LANGUAGE_CODES);
  printBlock('Secondary languages:', SECONDARY_LANGUAGE_CODES);

  const TOP = 12;
  const printTopMissing = (lang: LangCode) => {
    const have = translatedByLang.get(lang) ?? new Set();
    const missingRows = canonicalRows.filter((r) => !have.has(r.id));
    missingRows.sort((a, b) => rankSortKey(a.popularity_rank) - rankSortKey(b.popularity_rank));
    const slice = missingRows.slice(0, TOP);
    if (slice.length === 0) {
      console.log(`Top missing (${lang}): none`);
      return;
    }
    console.log(`Top missing (${lang}) by popularity_rank (lower = more common; nulls last), showing ${slice.length}:`);
    for (const r of slice) {
      const rk = r.popularity_rank == null ? 'null' : String(r.popularity_rank);
      console.log(`  rank ${rk.padStart(6)}  ${r.name}  (${r.id})`);
    }
  };

  for (const lang of LAUNCH_LANGUAGE_CODES) {
    console.log('');
    printTopMissing(lang);
  }
  for (const lang of SECONDARY_LANGUAGE_CODES) {
    console.log('');
    printTopMissing(lang);
  }

  if (csvOut) {
    const ws = createWriteStream(csvOut, { encoding: 'utf8' });
    ws.write('language_code,name_id,name,popularity_rank\n');
    for (const lang of ALL_LANGUAGE_CODES) {
      const have = translatedByLang.get(lang) ?? new Set();
      const missingRows = canonicalRows.filter((r) => !have.has(r.id));
      for (const r of missingRows) {
        const rk = r.popularity_rank == null ? '' : String(r.popularity_rank);
        ws.write(`${lang},${r.id},${csvEscape(r.name)},${rk}\n`);
      }
    }
    ws.end();
    await new Promise<void>((resolve, reject) => {
      ws.on('finish', resolve);
      ws.on('error', reject);
    });
    console.log('');
    console.log(`Wrote missing-name CSV: ${csvOut}`);
  }

  console.log('');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
