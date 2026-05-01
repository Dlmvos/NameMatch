/**
 * Manually curated Netherlands name workbook (.xlsx) → canonical CSV (`year,name,sex,count,country`)
 * for `adaptEuNationalCsvToJsonl.ts` / `importBabyNamesFromJsonl.ts`.
 *
 * Expected sheets (case/spacing flexible): **Jongensnamen YYYY** (boys → `M`), **Meisjesnamen YYYY** (girls → `F`).
 * Expected header row includes **Naam** (name) and optionally **Aantal** (count).
 *
 * Count fallback (documented): if **Aantal** is missing for the whole sheet or empty on a row, counts are
 * `SYNTHETIC_COUNT_BASE - rowIndex` (first data row = highest), so `adaptEuNationalCsvToJsonl` sort/rank
 * order still follows workbook order (row 1 = most popular in the sheet).
 *
 * Usage:
 *   tsx scripts/extractNetherlandsWorkbookToCanonicalCsv.ts \
 *     --in "scripts/data/raw/downloads/Names 2024 Netherlands.xlsx" \
 *     --out scripts/data/raw/eu-nl-workbook-2024.canonical.csv --year 2024
 *   npm run extract:baby-names:nl-workbook-xlsx -- --in ... --out ... --year 2024
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import * as XLSX from 'xlsx';

type Cli = {
  inputPath: string;
  outputPath: string;
  year: number;
  country: string;
};

/** When `Aantal` is absent or per-row empty: descending pseudo-count (first data row = largest). */
const SYNTHETIC_COUNT_BASE = 1_000_000;

function parseArgs(argv: string[]): Cli {
  const inIdx = argv.indexOf('--in');
  const outIdx = argv.indexOf('--out');
  const yearIdx = argv.indexOf('--year');
  if (inIdx < 0 || !argv[inIdx + 1]) throw new Error('Missing --in <path.xlsx>');
  if (outIdx < 0 || !argv[outIdx + 1]) throw new Error('Missing --out <path.csv>');
  if (yearIdx < 0 || !argv[yearIdx + 1]) throw new Error('Missing --year YYYY');
  const y = Number(argv[yearIdx + 1]);
  if (!Number.isInteger(y) || y < 1990 || y > 2100) throw new Error('--year must be a plausible year (1990–2100)');
  const countryIdx = argv.indexOf('--country');
  const country =
    countryIdx >= 0 && argv[countryIdx + 1] ? String(argv[countryIdx + 1]).trim() : 'Netherlands';
  return { inputPath: argv[inIdx + 1], outputPath: argv[outIdx + 1], year: y, country };
}

function stripAccents(s: string): string {
  return s.normalize('NFD').replace(/\p{M}/gu, '');
}

function cellToString(c: unknown): string {
  if (c === null || c === undefined) return '';
  if (typeof c === 'number') {
    if (Number.isInteger(c) && c > 100_000) return String(c);
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

/** Parse integer counts; supports Dutch thousands with `.` (e.g. 1.234). */
function parseCountCell(raw: string): number | null {
  const t = String(raw ?? '').trim();
  if (!t) return null;
  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(t)) {
    const n = Number(t.replace(/\./g, '').replace(',', '.'));
    return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
  }
  if (/^\d{1,3}(\.\d{3})+$/.test(t)) {
    const n = Number(t.replace(/\./g, ''));
    return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
  }
  if (/^\d+,\d+$/.test(t)) {
    const n = Number(t.replace(',', '.'));
    return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
  }
  const n = Number(t);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
}

function sheetNameToSex(sheetName: string): 'M' | 'F' | null {
  const n = stripAccents(sheetName).toLowerCase();
  if (n.includes('jongens')) return 'M';
  if (n.includes('meisjes')) return 'F';
  return null;
}

type ParsedRow = { name: string; count: number };

function extractRowsFromSheet(rows: string[][], sheetLabel: string): { parsed: ParsedRow[]; usedSynthetic: boolean } {
  let headerRowIdx = -1;
  let nameIdx = -1;
  let countIdx = -1;
  for (let r = 0; r < Math.min(30, rows.length); r++) {
    const row = rows[r] ?? [];
    const ni = findColumnIndex(row, ['naam', 'name', 'voornaam']);
    if (ni < 0) continue;
    const ci = findColumnIndex(row, ['aantal', 'count', 'frequency', 'freq', 'frequentie']);
    headerRowIdx = r;
    nameIdx = ni;
    countIdx = ci;
    break;
  }
  if (headerRowIdx < 0 || nameIdx < 0) {
    throw new Error(
      `Sheet "${sheetLabel}": could not find a header row with column "Naam" (or name/voornaam).`,
    );
  }
  const hasAantalColumn = countIdx >= 0;
  const parsed: ParsedRow[] = [];
  let usedSynthetic = !hasAantalColumn;
  let dataIdx = 0;

  for (let r = headerRowIdx + 1; r < rows.length; r++) {
    const row = rows[r] ?? [];
    const nameRaw = cellToString(row[nameIdx]);
    const name = nameRaw.normalize('NFC').replace(/\s+/g, ' ').trim();
    if (!name) continue;
    const hNorm = normHeader(name);
    if (hNorm === 'naam' || hNorm === 'name') continue;

    let count: number | null = null;
    if (hasAantalColumn && countIdx < row.length) {
      count = parseCountCell(cellToString(row[countIdx]));
    }
    if (count === null || count <= 0) {
      usedSynthetic = true;
      count = SYNTHETIC_COUNT_BASE - dataIdx;
    }
    dataIdx += 1;
    parsed.push({ name, count });
  }

  const merged = new Map<string, number>();
  for (const p of parsed) {
    merged.set(p.name, (merged.get(p.name) ?? 0) + p.count);
  }
  const out: ParsedRow[] = [...merged.entries()].map(([name, count]) => ({ name, count }));
  out.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  return { parsed: out, usedSynthetic };
}

function escapeCsv(name: string): string {
  if (/[",\n]/.test(name)) return `"${name.replace(/"/g, '""')}"`;
  return name;
}

function main(): void {
  const cli = parseArgs(process.argv.slice(2));
  const absIn = path.isAbsolute(cli.inputPath)
    ? cli.inputPath
    : path.join(process.cwd(), cli.inputPath);
  const absOut = path.isAbsolute(cli.outputPath)
    ? cli.outputPath
    : path.join(process.cwd(), cli.outputPath);

  const buf = readFileSync(absIn);
  const workbook = XLSX.read(buf, { type: 'buffer' });

  const outLines: string[] = ['year,name,sex,count,country'];
  let syntheticNote = false;

  for (const sheetName of workbook.SheetNames) {
    const sex = sheetNameToSex(sheetName);
    if (!sex) {
      console.warn(`[nl-workbook] Skipping sheet "${sheetName}" (not Jongensnamen / Meisjesnamen).`);
      continue;
    }
    const ws = workbook.Sheets[sheetName];
    if (!ws) continue;
    const rows: string[][] = XLSX.utils.sheet_to_json(ws, {
      header: 1,
      defval: '',
      raw: false,
    }) as string[][];
    const { parsed, usedSynthetic } = extractRowsFromSheet(rows, sheetName);
    if (usedSynthetic) syntheticNote = true;
    for (const p of parsed) {
      outLines.push(
        `${cli.year},${escapeCsv(p.name)},${sex},${p.count},${escapeCsv(cli.country)}`,
      );
    }
    console.log(`[nl-workbook] Sheet "${sheetName}" (${sex}): ${parsed.length} names`);
  }

  if (outLines.length < 2) {
    throw new Error(
      'No data rows extracted. Expected sheets "Jongensnamen …" and "Meisjesnamen …" with a Naam column.',
    );
  }

  mkdirSync(path.dirname(absOut), { recursive: true });
  writeFileSync(absOut, `${outLines.join('\n')}\n`, 'utf8');
  console.log(
    `Wrote ${outLines.length - 1} canonical rows → ${cli.outputPath}` +
      (syntheticNote
        ? ' (some rows used synthetic descending counts; see script header).'
        : ''),
  );
  console.log(
    'Next: tsx scripts/adaptEuNationalCsvToJsonl.ts --in <this file> --out scripts/data/batches/external-eu-nl-workbook-2024.v1.jsonl --slug eu-nl --top-per-year-sex 1200',
  );
}

main();
