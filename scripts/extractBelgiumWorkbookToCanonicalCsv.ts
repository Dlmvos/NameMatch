/**
 * Statbel-style Belgium newborn workbook (.xlsx) → canonical CSV
 * (`year,name,sex,count,country`) for `adaptEuNationalCsvToJsonl.ts`.
 *
 * Expected sheets (exact names): **F_PROV2017** … **F_PROV2024** and **M_PROV2017** … **M_PROV2024**.
 * Each sheet lists first names in rows with **one numeric column per province** (11 provinces);
 * counts are **summed across all province columns** (excluding a Total/Totaal column if present).
 *
 * Usage:
 *   tsx scripts/extractBelgiumWorkbookToCanonicalCsv.ts \
 *     --in "scripts/data/raw/downloads/Belgium newborn names Statbel.xlsx" \
 *     --out scripts/data/raw/eu-be-statbel.canonical.csv
 *   npm run extract:baby-names:be-statbel-xlsx -- --in ... --out ...
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import * as XLSX from 'xlsx';

type Cli = {
  inputPath: string;
  outputPath: string;
  country: string;
  yearMin: number | null;
  yearMax: number | null;
};

type Sex = 'M' | 'F';

export type BelgiumProvSheetMeta = { sheetName: string; sex: Sex; year: number };

export type BelgiumCanonicalRow = {
  year: number;
  name: string;
  sex: Sex;
  count: number;
  country: string;
};

const SHEET_RE = /^([FM])_PROV(20\d{2})$/i;

const NAME_HEADER_CANDIDATES = [
  'voornaam',
  'prénom',
  'prenom',
  'prenoms',
  'prénoms',
  'name',
  'naam',
  'firstname',
  'first name',
];

const TOTAL_HEADER_RE =
  /^(totaal|total|somme|sum|ensemble|belgi[eë]|belgium|totaal belgi[eë]|total belgium)$/i;

function parseArgs(argv: string[]): Cli {
  const inIdx = argv.indexOf('--in');
  const outIdx = argv.indexOf('--out');
  if (inIdx < 0 || !argv[inIdx + 1]) throw new Error('Missing --in <path.xlsx>');
  if (outIdx < 0 || !argv[outIdx + 1]) throw new Error('Missing --out <path.csv>');
  const countryIdx = argv.indexOf('--country');
  const country =
    countryIdx >= 0 && argv[countryIdx + 1] ? String(argv[countryIdx + 1]).trim() : 'Belgium';
  const yearMinIdx = argv.indexOf('--year-min');
  const yearMaxIdx = argv.indexOf('--year-max');
  const yearMin =
    yearMinIdx >= 0 && argv[yearMinIdx + 1] ? parseYearBound(argv[yearMinIdx + 1], '--year-min') : null;
  const yearMax =
    yearMaxIdx >= 0 && argv[yearMaxIdx + 1] ? parseYearBound(argv[yearMaxIdx + 1], '--year-max') : null;
  return { inputPath: argv[inIdx + 1], outputPath: argv[outIdx + 1], country, yearMin, yearMax };
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

/** Parse integer counts; supports Belgian/EU thousands separators. */
function parseCountCell(raw: string): number {
  const t = String(raw ?? '').trim();
  if (!t) return 0;
  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(t)) {
    const n = Number(t.replace(/\./g, '').replace(',', '.'));
    return Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
  }
  if (/^\d{1,3}(\.\d{3})+$/.test(t)) {
    const n = Number(t.replace(/\./g, ''));
    return Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
  }
  if (/^\d+,\d+$/.test(t)) {
    const n = Number(t.replace(',', '.'));
    return Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
  }
  const n = Number(t);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
}

export function parseBelgiumProvSheetName(sheetName: string): BelgiumProvSheetMeta | null {
  const m = sheetName.trim().match(SHEET_RE);
  if (!m) return null;
  const sexLetter = m[1].toUpperCase();
  const sex: Sex = sexLetter === 'F' ? 'F' : 'M';
  const year = Number(m[2]);
  if (!Number.isInteger(year)) return null;
  return { sheetName, sex, year };
}

function isTotalHeader(label: string): boolean {
  const n = normHeader(label);
  if (!n) return false;
  return TOTAL_HEADER_RE.test(n);
}

function detectHeaderRow(rows: string[][]): { headerRowIdx: number; nameIdx: number; countColIdxs: number[] } {
  for (let r = 0; r < Math.min(25, rows.length); r++) {
    const row = rows[r] ?? [];
    const nameIdx = findColumnIndex(row, NAME_HEADER_CANDIDATES);
    if (nameIdx < 0) continue;

    const countColIdxs: number[] = [];
    for (let c = 0; c < row.length; c++) {
      if (c === nameIdx) continue;
      const header = cellToString(row[c]);
      if (!header) continue;
      if (isTotalHeader(header)) continue;
      countColIdxs.push(c);
    }

    if (countColIdxs.length >= 3) {
      return { headerRowIdx: r, nameIdx, countColIdxs };
    }
  }

  throw new Error(
    'Could not find header row with a name column (Voornaam / Prénom / Name) and at least 3 province count columns.',
  );
}

function extractRowsFromProvSheet(
  rows: string[][],
  meta: BelgiumProvSheetMeta,
  country: string,
): BelgiumCanonicalRow[] {
  const { headerRowIdx, nameIdx, countColIdxs } = detectHeaderRow(rows);
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

    let sum = 0;
    for (const c of countColIdxs) {
      sum += parseCountCell(cellToString(row[c] ?? ''));
    }
    if (sum <= 0) continue;

    const key = name.toLowerCase();
    if (!casing.has(key)) casing.set(key, name);
    byName.set(key, (byName.get(key) ?? 0) + sum);
  }

  return [...byName.entries()].map(([key, count]) => ({
    year: meta.year,
    name: casing.get(key) ?? key,
    sex: meta.sex,
    count,
    country,
  }));
}

export function extractBelgiumWorkbookToRecords(opts: {
  absInputPath: string;
  country?: string;
  yearMin?: number | null;
  yearMax?: number | null;
}): BelgiumCanonicalRow[] {
  const country = opts.country ?? 'Belgium';
  const buf = readFileSync(opts.absInputPath);
  const workbook = XLSX.read(buf, { type: 'buffer' });

  const metas = workbook.SheetNames.map(parseBelgiumProvSheetName).filter(
    (m): m is BelgiumProvSheetMeta => m !== null,
  );

  if (metas.length === 0) {
    throw new Error(
      `No F_PROVYYYY / M_PROVYYYY sheets found. Sheets present: ${workbook.SheetNames.join(', ')}`,
    );
  }

  const filtered = metas.filter((m) => {
    if (opts.yearMin != null && m.year < opts.yearMin) return false;
    if (opts.yearMax != null && m.year > opts.yearMax) return false;
    return true;
  });

  if (filtered.length === 0) {
    throw new Error('No sheets matched --year-min / --year-max filters.');
  }

  const all: BelgiumCanonicalRow[] = [];
  for (const meta of filtered.sort((a, b) => a.year - b.year || a.sex.localeCompare(b.sex))) {
    const ws = workbook.Sheets[meta.sheetName];
    if (!ws) continue;
    const rows: string[][] = XLSX.utils.sheet_to_json(ws, {
      header: 1,
      defval: '',
      raw: false,
    }) as string[][];
    const parsed = extractRowsFromProvSheet(rows, meta, country);
    console.log(
      `[be-statbel] Sheet "${meta.sheetName}" (${meta.sex}, ${meta.year}): ${parsed.length} names`,
    );
    all.push(...parsed);
  }

  if (all.length === 0) {
    throw new Error('No data rows extracted from any F_PROV / M_PROV sheet.');
  }

  return all;
}

function escapeCsv(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function rowsToCanonicalCsv(rows: BelgiumCanonicalRow[]): string {
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

  const records = extractBelgiumWorkbookToRecords({
    absInputPath: absIn,
    country: cli.country,
    yearMin: cli.yearMin,
    yearMax: cli.yearMax,
  });

  mkdirSync(path.dirname(absOut), { recursive: true });
  writeFileSync(absOut, rowsToCanonicalCsv(records), 'utf8');

  const years = [...new Set(records.map((r) => r.year))].sort((a, b) => a - b);
  console.log(
    `[be-statbel] Wrote ${records.length} canonical rows (years ${years[0]}–${years[years.length - 1]}) → ${cli.outputPath}`,
  );
  console.log(
    'Next: tsx scripts/adaptEuNationalCsvToJsonl.ts --in <this file> --out scripts/data/batches/external-eu-be-statbel.v1.jsonl --slug eu-be-statbel --top-per-year-sex 1200',
  );
}

main();
