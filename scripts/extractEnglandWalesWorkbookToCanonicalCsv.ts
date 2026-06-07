/**
 * England and Wales recency-weighted workbook (.xlsx) → canonical CSV
 * (`year,name,sex,count,country`) for `adaptEuNationalCsvToJsonl.ts`.
 *
 * England and Wales is published as a single national feed; this workbook is
 * the curated merge of ONS England & Wales 1996–2024 baby-name file with exponential recency weighting (5-year half-life anchored at 2025) — see
 * `scripts/data/ENGLAND_WALES_REAL_SOURCE_WORKFLOW.md`.
 *
 * Expected sheets (exact names): **`Boys All`** and **`Girls All`**.
 * Each sheet has columns:
 *   rank, name, weighted_count, raw_count, earliest_year, latest_year
 *
 * The adapter:
 *   • Emits **one canonical row per `(name, sex)`** (not per year), stamped
 *     with `--emit-year` (default 2025).
 *   • Uses `weighted_count` (rounded to a positive integer) as `count`.
 *   • Drops names whose rounded weighted count falls below `--min-weighted-count`
 *     (default 1).
 *
 * Usage:
 *   tsx scripts/extractEnglandWalesWorkbookToCanonicalCsv.ts \
 *     --in "scripts/data/raw/downloads/Names England-Wales recent weight.xlsx" \
 *     --out scripts/data/raw/eu-ew-ons.canonical.csv
 *   npm run extract:baby-names:ew-ons-xlsx -- --in ... --out ...
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import * as XLSX from 'xlsx';

type Cli = {
  inputPath: string;
  outputPath: string;
  country: string;
  emitYear: number;
  minWeightedCount: number;
};

type Sex = 'M' | 'F';

export type EnglandWalesSheetMeta = { sheetName: string; sex: Sex };

export type EnglandWalesCanonicalRow = {
  year: number;
  name: string;
  sex: Sex;
  count: number;
  country: string;
};

const SHEET_TARGETS: EnglandWalesSheetMeta[] = [
  { sheetName: 'Boys All', sex: 'M' },
  { sheetName: 'Girls All', sex: 'F' },
];

const NAME_HEADER_CANDIDATES = ['name', 'given name', 'first name'];
const COUNT_HEADER_CANDIDATES = [
  'weighted_count',
  'weighted count',
  'weightedcount',
  'count',
];

function parseArgs(argv: string[]): Cli {
  const inIdx = argv.indexOf('--in');
  const outIdx = argv.indexOf('--out');
  if (inIdx < 0 || !argv[inIdx + 1]) throw new Error('Missing --in <path.xlsx>');
  if (outIdx < 0 || !argv[outIdx + 1]) throw new Error('Missing --out <path.csv>');

  const countryIdx = argv.indexOf('--country');
  const country =
    countryIdx >= 0 && argv[countryIdx + 1]
      ? String(argv[countryIdx + 1]).trim()
      : 'England and Wales';

  const emitYearIdx = argv.indexOf('--emit-year');
  const emitYear =
    emitYearIdx >= 0 && argv[emitYearIdx + 1]
      ? parseYearBound(argv[emitYearIdx + 1], '--emit-year')
      : 2025;

  const minIdx = argv.indexOf('--min-weighted-count');
  let minWeightedCount = 1;
  if (minIdx >= 0 && argv[minIdx + 1]) {
    const n = Number(argv[minIdx + 1]);
    if (!Number.isFinite(n) || n < 0) {
      throw new Error('--min-weighted-count must be a non-negative number');
    }
    minWeightedCount = n;
  }

  return {
    inputPath: argv[inIdx + 1],
    outputPath: argv[outIdx + 1],
    country,
    emitYear,
    minWeightedCount,
  };
}

function parseYearBound(raw: string, flag: string): number {
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1990 || n > 2100) {
    throw new Error(`${flag} must be a plausible year (1990–2100)`);
  }
  return n;
}

function stripAccents(s: string): string {
  return s.normalize('NFD').replace(/\p{M}/gu, '');
}

function cellToString(c: unknown): string {
  if (c === null || c === undefined) return '';
  if (typeof c === 'number') {
    if (!Number.isFinite(c)) return '';
    return String(c);
  }
  return String(c).trim();
}

function normHeader(s: string): string {
  return stripAccents(s).trim().toLowerCase();
}

function findColumnIndex(headerRow: string[], candidates: string[]): number {
  const lowered = headerRow.map((c) => normHeader(cellToString(c)));
  for (const cand of candidates) {
    const want = normHeader(cand);
    const i = lowered.indexOf(want);
    if (i >= 0) return i;
  }
  for (let i = 0; i < lowered.length; i++) {
    for (const cand of candidates) {
      if (lowered[i].includes(normHeader(cand))) return i;
    }
  }
  return -1;
}

function parseCountCell(raw: string): number {
  const t = String(raw ?? '').trim();
  if (!t) return 0;
  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(t)) {
    const n = Number(t.replace(/\./g, '').replace(',', '.'));
    return Number.isFinite(n) && n > 0 ? n : 0;
  }
  if (/^\d+,\d+$/.test(t)) {
    const n = Number(t.replace(',', '.'));
    return Number.isFinite(n) && n > 0 ? n : 0;
  }
  const n = Number(t);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function findSheetCaseInsensitive(workbook: XLSX.WorkBook, target: string): string | null {
  const want = target.toLowerCase().replace(/\s+/g, ' ').trim();
  for (const name of workbook.SheetNames) {
    if (name.toLowerCase().replace(/\s+/g, ' ').trim() === want) return name;
  }
  return null;
}

function detectHeaderRow(
  rows: string[][],
): { headerRowIdx: number; nameIdx: number; countIdx: number } {
  for (let r = 0; r < Math.min(15, rows.length); r++) {
    const row = rows[r] ?? [];
    const nameIdx = findColumnIndex(row, NAME_HEADER_CANDIDATES);
    if (nameIdx < 0) continue;
    const countIdx = findColumnIndex(row, COUNT_HEADER_CANDIDATES);
    if (countIdx < 0) continue;
    return { headerRowIdx: r, nameIdx, countIdx };
  }
  throw new Error(
    "Could not find header row with a 'name' column and a 'weighted_count' / 'count' column.",
  );
}

function extractRowsFromSheet(
  rows: string[][],
  meta: EnglandWalesSheetMeta,
  country: string,
  emitYear: number,
  minWeightedCount: number,
): EnglandWalesCanonicalRow[] {
  const { headerRowIdx, nameIdx, countIdx } = detectHeaderRow(rows);
  const byName = new Map<string, number>();
  const casing = new Map<string, string>();

  for (let r = headerRowIdx + 1; r < rows.length; r++) {
    const row = rows[r] ?? [];
    const nameRaw = cellToString(row[nameIdx]);
    const name = nameRaw.normalize('NFC').replace(/\s+/g, ' ').trim();
    if (!name) continue;
    const hNorm = normHeader(name);
    if (NAME_HEADER_CANDIDATES.some((c) => hNorm === normHeader(c))) continue;
    if (/^total|^totaal|^somme|^subtotal/i.test(name)) continue;

    const count = parseCountCell(cellToString(row[countIdx] ?? ''));
    if (count < minWeightedCount) continue;
    const rounded = Math.round(count);
    if (rounded <= 0) continue;

    const key = name.toLowerCase();
    if (!casing.has(key)) casing.set(key, name);
    const prev = byName.get(key) ?? 0;
    byName.set(key, Math.max(prev, rounded));
  }

  return [...byName.entries()].map(([key, count]) => ({
    year: emitYear,
    name: casing.get(key) ?? key,
    sex: meta.sex,
    count,
    country,
  }));
}

export function extractEnglandWalesWorkbookToRecords(opts: {
  absInputPath: string;
  country?: string;
  emitYear?: number;
  minWeightedCount?: number;
}): EnglandWalesCanonicalRow[] {
  const country = opts.country ?? 'England and Wales';
  const emitYear = opts.emitYear ?? 2025;
  const minWeightedCount = opts.minWeightedCount ?? 1;

  const buf = readFileSync(opts.absInputPath);
  const workbook = XLSX.read(buf, { type: 'buffer' });

  const all: EnglandWalesCanonicalRow[] = [];
  const missing: string[] = [];

  for (const meta of SHEET_TARGETS) {
    const resolved = findSheetCaseInsensitive(workbook, meta.sheetName);
    if (!resolved) {
      missing.push(meta.sheetName);
      continue;
    }
    const ws = workbook.Sheets[resolved];
    const rows: string[][] = XLSX.utils.sheet_to_json(ws, {
      header: 1,
      defval: '',
      raw: false,
    }) as string[][];
    const parsed = extractRowsFromSheet(rows, meta, country, emitYear, minWeightedCount);
    console.log(
      `[ew-ons] Sheet "${resolved}" (${meta.sex}, emit-year ${emitYear}): ${parsed.length} names`,
    );
    all.push(...parsed);
  }

  if (missing.length > 0) {
    throw new Error(
      `Required sheets missing: ${missing.join(', ')}. Sheets present: ${workbook.SheetNames.join(', ')}`,
    );
  }
  if (all.length === 0) {
    throw new Error('No data rows extracted from "Boys All" / "Girls All".');
  }
  return all;
}

function escapeCsv(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function rowsToCanonicalCsv(rows: EnglandWalesCanonicalRow[]): string {
  const sorted = [...rows].sort(
    (a, b) =>
      a.year - b.year ||
      a.sex.localeCompare(b.sex) ||
      b.count - a.count ||
      a.name.localeCompare(b.name),
  );
  const lines = ['year,name,sex,count,country'];
  for (const r of sorted) {
    lines.push(`${r.year},${escapeCsv(r.name)},${r.sex},${r.count},${escapeCsv(r.country)}`);
  }
  return `${lines.join('\n')}\n`;
}

function main(): void {
  const cli = parseArgs(process.argv.slice(2));
  const absIn = path.isAbsolute(cli.inputPath)
    ? cli.inputPath
    : path.join(process.cwd(), cli.inputPath);
  const absOut = path.isAbsolute(cli.outputPath)
    ? cli.outputPath
    : path.join(process.cwd(), cli.outputPath);

  const records = extractEnglandWalesWorkbookToRecords({
    absInputPath: absIn,
    country: cli.country,
    emitYear: cli.emitYear,
    minWeightedCount: cli.minWeightedCount,
  });

  mkdirSync(path.dirname(absOut), { recursive: true });
  writeFileSync(absOut, rowsToCanonicalCsv(records), 'utf8');

  const boys = records.filter((r) => r.sex === 'M').length;
  const girls = records.filter((r) => r.sex === 'F').length;
  console.log(
    `[ew-ons] Wrote ${records.length} canonical rows (boys ${boys}, girls ${girls}, emit-year ${cli.emitYear}) → ${cli.outputPath}`,
  );
  console.log(
    'Next: tsx scripts/adaptEuNationalCsvToJsonl.ts --in <this file> --out scripts/data/batches/external-eu-ew-ons.v1.jsonl --slug eu-ew-ons --top-per-year-sex 1200',
  );
}

main();
