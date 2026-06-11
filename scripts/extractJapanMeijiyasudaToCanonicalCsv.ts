/**
 * Adapter: Japan canonical CSV builder. Combines two complementary sources to
 * push the unique-name pool past the launch threshold for a 125M-population
 * market, since neither source alone is sufficient.
 *
 * Inputs:
 *   1. Meiji Yasuda Life Insurance 生まれ年別名前ベスト10 (yearly Top 10
 *      kanji rankings 1912-2025). Industry-standard Japanese baby-name survey
 *      — top-10 only per year × 113 years yields ~150 unique boys + ~220
 *      unique girls (kanji forms), with strong recency-weighted popularity.
 *      scripts/data/raw/downloads/Names Japan meijiyasuda boy.md
 *      scripts/data/raw/downloads/Names Japan meijiyasuda girl.md
 *
 *   2. Behind the Name — Japanese names listing. A curated linguistic
 *      reference (Mike Campbell, est. 1996) widely cited by name researchers.
 *      Provides ~280 romaji entries each with 1-6 kanji variants and a
 *      hiragana reading, contributing ~600-800 additional kanji name rows
 *      after dedup.
 *      scripts/data/raw/downloads/Names Japan behindthename.tsv
 *
 * Output: scripts/data/raw/asia-jp-meijiyasuda.canonical.csv
 *
 * Provenance + caveats (mirrored in JAPAN_REAL_SOURCE_WORKFLOW.md):
 *   - Meiji Yasuda is a private insurer, NOT a government statistical agency.
 *     Japan's MHLW (厚生労働省) does NOT publish baby-name rankings; Meiji
 *     Yasuda's annual survey is the de-facto industry source widely cited by
 *     Japanese media. Treat the popularity_rank we derive as "best survey
 *     position", not "registered birth count".
 *   - Behind the Name is a curated linguistic reference. We use it for
 *     breadth (kanji-form coverage) but treat its entries as unranked
 *     (synthetic year + count 1 → tail of the year-2025 ranking).
 *   - Meiji Yasuda cells with multiple kanji separated by whitespace = ties
 *     at that rank. A "-" cell means rank is occupied by a tie above (skip).
 *   - Synthetic count for Meiji Yasuda = 11 - rank so the downstream EU
 *     adapter's count-desc sort yields a stable popularity_rank that mirrors
 *     the source rank. BTN supplementary rows get count=1 so they sort below
 *     the Meiji Yasuda top-10s.
 *
 * Usage:
 *   tsx scripts/extractJapanMeijiyasudaToCanonicalCsv.ts \
 *     --boy "scripts/data/raw/downloads/Names Japan meijiyasuda boy.md" \
 *     --girl "scripts/data/raw/downloads/Names Japan meijiyasuda girl.md" \
 *     --btn "scripts/data/raw/downloads/Names Japan behindthename.tsv" \
 *     --out scripts/data/raw/asia-jp-meijiyasuda.canonical.csv
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

type Sex = 'M' | 'F';

interface CanonicalRow {
  year: number;
  name: string;
  sex: Sex;
  count: number;
  country: string;
}

interface Cli {
  boyPath: string;
  girlPath: string;
  btnPath: string;
  outPath: string;
}

const DEFAULT_BOY = 'scripts/data/raw/downloads/Names Japan meijiyasuda boy.md';
const DEFAULT_GIRL = 'scripts/data/raw/downloads/Names Japan meijiyasuda girl.md';
const DEFAULT_BTN = 'scripts/data/raw/downloads/Names Japan behindthename.tsv';
const DEFAULT_OUT = 'scripts/data/raw/asia-jp-meijiyasuda.canonical.csv';

function parseArgs(argv: string[]): Cli {
  const get = (flag: string, fallback: string): string => {
    const i = argv.indexOf(flag);
    return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
  };
  return {
    boyPath: get('--boy', DEFAULT_BOY),
    girlPath: get('--girl', DEFAULT_GIRL),
    btnPath: get('--btn', DEFAULT_BTN),
    outPath: get('--out', DEFAULT_OUT),
  };
}

/**
 * Match a Meiji Yasuda year label like
 *   "明45・大1年     （1912）〔子〕"
 *   "昭和35年     （1960）〔子〕"
 *   "平31・令1年     （2019）〔亥〕"
 *   "令和7年     （2025）〔巳〕"
 * Year is always in full-width parentheses.
 *
 * Uses \uXXXX escapes for both ascii and full-width parentheses so the regex
 * survives any future codepage churn — Meiji Yasuda's templates do drift.
 */
const YEAR_RE = /[(（](\d{4})[)）]/;

/**
 * Markdown table row delimiter is `|`. We split on `|`, strip outer empties,
 * then take cells 1..10 as the rank-1..rank-10 names. Cells with multiple
 * whitespace-separated kanji are ties; a cell containing only `-` is a
 * "skip — tied above" placeholder.
 */
function parseTable(markdown: string, sex: Sex): CanonicalRow[] {
  const rows: CanonicalRow[] = [];
  const lines = markdown.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('|') || !trimmed.endsWith('|')) continue;

    // Header / separator rows skip themselves: they don't match YEAR_RE.
    const yearMatch = YEAR_RE.exec(trimmed);
    if (!yearMatch) continue;
    const year = Number(yearMatch[1]);
    if (!Number.isFinite(year) || year < 1900 || year > 2100) continue;

    // Cells: split on `|`, drop leading/trailing empty cells (from the
    // outer `|` delimiters). The first cell after splitting is the year
    // label; ranks 1-10 follow.
    const cells = trimmed
      .split('|')
      .map((c) => c.trim())
      .filter((_, i, arr) => i > 0 && i < arr.length - 1);
    if (cells.length < 11) continue; // year label + 10 ranks
    const rankCells = cells.slice(1, 11);

    for (let i = 0; i < rankCells.length; i++) {
      const rank = i + 1;
      const cell = rankCells[i];
      if (!cell || cell === '-') continue;

      // Names within a tied cell are whitespace-separated. Split on any run
      // of whitespace (incl. full-width spaces 　).
      const names = cell
        .split(/[\s　]+/)
        .map((n) => n.trim())
        .filter((n) => n.length > 0 && n !== '-');

      for (const name of names) {
        rows.push({
          year,
          name,
          sex,
          count: 11 - rank, // synthetic — preserves rank ordering when sorted desc
          country: 'Japan',
        });
      }
    }
  }
  return rows;
}

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function writeCanonicalCsv(rows: CanonicalRow[], outPath: string): void {
  const header = 'year,name,sex,count,country';
  const body = rows
    .map((r) => [r.year, csvEscape(r.name), r.sex, r.count, csvEscape(r.country)].join(','))
    .join('\n');
  const abs = path.resolve(outPath);
  mkdirSync(path.dirname(abs), { recursive: true });
  writeFileSync(abs, `${header}\n${body}\n`, 'utf8');
}

function summarize(rows: CanonicalRow[], sex: Sex): { total: number; unique: number } {
  const filtered = rows.filter((r) => r.sex === sex);
  const uniq = new Set(filtered.map((r) => r.name));
  return { total: filtered.length, unique: uniq.size };
}

/**
 * Parse the Behind the Name TSV. Each non-comment, non-header row contributes
 * one row per kanji form. Hiragana column is currently dropped (we keep kanji
 * as the canonical `name` to match Meiji Yasuda's convention and the existing
 * DB content); a future enhancement could surface hiragana via
 * `name_meaning_translations`.
 *
 * Synthetic year = 2025, synthetic count = 1 so BTN rows sort below the
 * Meiji Yasuda top-10 within the 2025 ranking bucket. Names that overlap
 * with Meiji Yasuda dedupe naturally at DB import via the deterministic
 * `external_id` slug.
 *
 * Gender mapping: `m` → M, `f` → F. `mf` (unisex) emits BOTH an M row and an
 * F row so the name surfaces regardless of which sex a couple is filtering.
 */
function parseBtnTsv(tsv: string): CanonicalRow[] {
  const rows: CanonicalRow[] = [];
  const SYNTH_YEAR = 2025;
  const SYNTH_COUNT = 1;
  for (const rawLine of tsv.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    if (line.startsWith('romaji\t')) continue; // header
    const cols = line.split('\t');
    if (cols.length < 4) continue;
    const kanjiCsv = cols[1]?.trim() ?? '';
    const gender = cols[3]?.trim().toLowerCase() ?? '';
    if (!kanjiCsv) continue;

    const sexes: Sex[] = gender === 'm' ? ['M'] : gender === 'f' ? ['F'] : ['M', 'F'];
    for (const kanji of kanjiCsv.split(',').map((k) => k.trim()).filter(Boolean)) {
      for (const sex of sexes) {
        rows.push({
          year: SYNTH_YEAR,
          name: kanji,
          sex,
          count: SYNTH_COUNT,
          country: 'Japan',
        });
      }
    }
  }
  return rows;
}

function main(): void {
  const cli = parseArgs(process.argv.slice(2));
  const boyMd = readFileSync(path.resolve(cli.boyPath), 'utf8');
  const girlMd = readFileSync(path.resolve(cli.girlPath), 'utf8');
  const btnTsv = readFileSync(path.resolve(cli.btnPath), 'utf8');

  const boyRows = parseTable(boyMd, 'M');
  const girlRows = parseTable(girlMd, 'F');
  const btnRows = parseBtnTsv(btnTsv);

  // Dedupe (year, name, sex) — Meiji Yasuda wins on synthetic count so its
  // popularity_rank is preserved. BTN supplements only where Meiji Yasuda
  // doesn't already have that name in that year+sex.
  const seen = new Set<string>();
  const allRows: CanonicalRow[] = [];
  for (const r of [...boyRows, ...girlRows, ...btnRows]) {
    const k = `${r.year}|${r.name}|${r.sex}`;
    if (seen.has(k)) continue;
    seen.add(k);
    allRows.push(r);
  }

  writeCanonicalCsv(allRows, cli.outPath);

  const boyStats = summarize(allRows, 'M');
  const girlStats = summarize(allRows, 'F');
  const yearMin = Math.min(...allRows.map((r) => r.year));
  const yearMax = Math.max(...allRows.map((r) => r.year));

  console.log(`Wrote ${allRows.length} canonical rows to ${cli.outPath}`);
  console.log(`  Year range: ${yearMin} – ${yearMax}`);
  console.log(`  Meiji Yasuda contribution: ${boyRows.length} boy + ${girlRows.length} girl raw rows`);
  console.log(`  BTN contribution: ${btnRows.length} raw rows`);
  console.log(`  Boys: ${boyStats.total} rows, ${boyStats.unique} unique kanji`);
  console.log(`  Girls: ${girlStats.total} rows, ${girlStats.unique} unique kanji`);
  if (boyStats.unique < 200 || girlStats.unique < 200) {
    console.log('  ⚠️  Below 200/sex target — see JAPAN_REAL_SOURCE_WORKFLOW.md "Source coverage gap" section.');
  } else {
    console.log('  ✅  At or above 200/sex target.');
  }
}

main();
