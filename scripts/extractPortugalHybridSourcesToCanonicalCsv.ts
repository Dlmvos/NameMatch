/**
 * Portugal hybrid sources → canonical CSV (`year,name,sex,count,country`)
 * for `adaptEuNationalCsvToJsonl.ts` / `importBabyNamesFromJsonl.ts`.
 *
 * **Inputs:**
 * - **Top 150 workbook** (`Names Portugal top 150.xlsx`): sheet `Top names 5 year trend` — row 0–1 headers;
 *   from row 2, boys **Name** in column **C** (index 2), girls **Name** in column **H** (index 7); ranks in column A / F
 *   when present (`#1`, …). Rows without `#` ranks still contribute names in **sheet order** (continuation of the list).
 * - **Allowed-names PDF** (`portugal_allowed_names.pdf`): text lines containing **`Femininos …  Masculinos …`**
 *   (two or more spaces between the two sides). **Femininos** → `F`, **Masculinos** → `M`.
 *
 * **Merge / dedupe:** Key = normalized `name|sex`. **Top 150 wins** over the PDF when both exist.
 *
 * **Pseudo-counts (documented, not real frequencies):** One descending sequence so `adaptEuNationalCsvToJsonl`
 * keeps **Top 150 strictly above** the PDF tail: `TOP_LAYER_BASE`, `TOP_LAYER_BASE - 1`, …
 *
 * **PDF noise:** Lines matching institutional headers, page markers (`/^\\d+\\/\\d+$/`), and `GÉNERO` / `Instituto` / `Campus` are skipped.
 *
 * Requires devDependency: `pdf-parse` (reads PDF into plain text).
 *
 * Usage:
 *   tsx scripts/extractPortugalHybridSourcesToCanonicalCsv.ts \
 *     --top-xlsx "scripts/data/raw/downloads/Names Portugal top 150.xlsx" \
 *     --pdf scripts/data/raw/downloads/portugal_allowed_names.pdf \
 *     --out scripts/data/raw/eu-pt-hybrid-2024.canonical.csv --year 2024
 *   npm run extract:baby-names:pt-hybrid-sources -- --top-xlsx ... --pdf ... --out ... --year 2024
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import pdfParse from 'pdf-parse';
import * as XLSX from 'xlsx';

type Cli = {
  topXlsx: string;
  pdfPath: string;
  outputPath: string;
  year: number;
  country: string;
};

const TOP_LAYER_BASE = 5_000_000;

const TOP_SHEET_HINT = 'Top names 5 year trend';

function parseArgs(argv: string[]): Cli {
  const tx = argv.indexOf('--top-xlsx');
  const pdfI = argv.indexOf('--pdf');
  const outIdx = argv.indexOf('--out');
  const yearIdx = argv.indexOf('--year');
  if (tx < 0 || !argv[tx + 1]) throw new Error('Missing --top-xlsx <path.xlsx>');
  if (pdfI < 0 || !argv[pdfI + 1]) throw new Error('Missing --pdf <path.pdf>');
  if (outIdx < 0 || !argv[outIdx + 1]) throw new Error('Missing --out <path.csv>');
  if (yearIdx < 0 || !argv[yearIdx + 1]) throw new Error('Missing --year YYYY');
  const y = Number(argv[yearIdx + 1]);
  if (!Number.isInteger(y) || y < 1990 || y > 2100) throw new Error('--year must be a plausible year (1990–2100)');
  const countryIdx = argv.indexOf('--country');
  const country =
    countryIdx >= 0 && argv[countryIdx + 1] ? String(argv[countryIdx + 1]).trim() : 'Portugal';
  return {
    topXlsx: argv[tx + 1],
    pdfPath: argv[pdfI + 1],
    outputPath: argv[outIdx + 1],
    year: y,
    country,
  };
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
  return s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .trim()
    .toLowerCase();
}

function normNameKey(name: string): string {
  return name.normalize('NFC').replace(/\s+/g, ' ').trim().toLowerCase();
}

type Sex = 'M' | 'F';

function dedupeKey(name: string, sex: Sex): string {
  return `${normNameKey(name)}|${sex}`;
}

function findTopSheetName(names: string[]): string {
  const exact = names.find((n) => n === TOP_SHEET_HINT);
  if (exact) return exact;
  const loose = names.find((n) => normHeader(n).includes('top names'));
  if (loose) return loose;
  if (names.length === 1) return names[0];
  throw new Error(`Could not pick sheet for Top 150. Sheets: ${names.join(', ')}`);
}

/** Parse Top 150 sheet: row order, boys col 2, girls col 7. */
function parseTop150Sheet(rows: string[][]): { name: string; sex: Sex }[] {
  const out: { name: string; sex: Sex }[] = [];
  for (let r = 2; r < rows.length; r++) {
    const row = rows[r] ?? [];
    const boyRaw = cellToString(row[2]).normalize('NFC').replace(/\s+/g, ' ').trim();
    const girlRaw = cellToString(row[7]).normalize('NFC').replace(/\s+/g, ' ').trim();
    if (boyRaw) {
      const h = normHeader(boyRaw);
      if (h !== 'name' && h !== 'boy names') out.push({ name: boyRaw, sex: 'M' });
    }
    if (girlRaw) {
      const h = normHeader(girlRaw);
      if (h !== 'name' && h !== 'girl names') out.push({ name: girlRaw, sex: 'F' });
    }
  }
  return out;
}

function isPdfNoiseLine(line: string): boolean {
  const t = line.trim();
  if (!t) return true;
  if (/^\d+\/\d+$/.test(t)) return true;
  if (/^page\s+\d+/i.test(t)) return true;
  if (/instituto|campus de justi|lisboa|edifício|ge\s*nero nome|género nome/i.test(t)) return true;
  if (/^\d+\s*\/\s*\d+\s*$/.test(t)) return true;
  return false;
}

/** Extract paired Femininos / Masculinos names from PDF plain text. */
function parseAllowedNamesPdfText(text: string): { name: string; sex: Sex }[] {
  const out: { name: string; sex: Sex }[] = [];
  const lines = text.split(/\r?\n/);
  const pairRe = /^Femininos\s+(.+?)\s{2,}Masculinos\s+(.+?)\s*$/i;
  for (let rawLine of lines) {
    const line = rawLine.normalize('NFC').trim();
    if (isPdfNoiseLine(line)) continue;
    const m = line.match(pairRe);
    if (!m) continue;
    const fName = m[1].replace(/\s+/g, ' ').trim();
    const mName = m[2].replace(/\s+/g, ' ').trim();
    if (fName.length >= 1 && !/^femininos$/i.test(fName)) {
      out.push({ name: fName, sex: 'F' });
    }
    if (mName.length >= 1 && !/^masculinos$/i.test(mName)) {
      out.push({ name: mName, sex: 'M' });
    }
  }
  return out;
}

function escapeCsv(name: string): string {
  if (/[",\n]/.test(name)) return `"${name.replace(/"/g, '""')}"`;
  return name;
}

async function mainAsync(): Promise<void> {
  const cli = parseArgs(process.argv.slice(2));
  const absTop = path.isAbsolute(cli.topXlsx) ? cli.topXlsx : path.join(process.cwd(), cli.topXlsx);
  const absPdf = path.isAbsolute(cli.pdfPath) ? cli.pdfPath : path.join(process.cwd(), cli.pdfPath);
  const absOut = path.isAbsolute(cli.outputPath)
    ? cli.outputPath
    : path.join(process.cwd(), cli.outputPath);

  const wb = XLSX.read(readFileSync(absTop), { type: 'buffer' });
  const sheetName = findTopSheetName(wb.SheetNames);
  const ws = wb.Sheets[sheetName];
  if (!ws) throw new Error(`Missing sheet "${sheetName}"`);
  const rows: string[][] = XLSX.utils.sheet_to_json(ws, {
    header: 1,
    defval: '',
    raw: false,
  }) as string[][];

  const topParsed = parseTop150Sheet(rows);
  const topOrdered: { name: string; sex: Sex }[] = [];
  const topKeys = new Set<string>();
  for (const e of topParsed) {
    const k = dedupeKey(e.name, e.sex);
    if (topKeys.has(k)) continue;
    topKeys.add(k);
    topOrdered.push(e);
  }

  const pdfBuf = readFileSync(absPdf);
  const pdfData = await pdfParse(pdfBuf);
  const pdfParsed = parseAllowedNamesPdfText(pdfData.text);
  const pdfOnly: { name: string; sex: Sex }[] = [];
  const pdfSeen = new Set<string>();
  for (const e of pdfParsed) {
    const k = dedupeKey(e.name, e.sex);
    if (topKeys.has(k)) continue;
    if (pdfSeen.has(k)) continue;
    pdfSeen.add(k);
    pdfOnly.push(e);
  }

  const outLines: string[] = ['year,name,sex,count,country'];
  let idx = 0;
  for (const e of topOrdered) {
    const count = TOP_LAYER_BASE - idx;
    idx += 1;
    outLines.push(`${cli.year},${escapeCsv(e.name)},${e.sex},${count},${escapeCsv(cli.country)}`);
  }
  for (const e of pdfOnly) {
    const count = TOP_LAYER_BASE - idx;
    idx += 1;
    outLines.push(`${cli.year},${escapeCsv(e.name)},${e.sex},${count},${escapeCsv(cli.country)}`);
  }

  mkdirSync(path.dirname(absOut), { recursive: true });
  writeFileSync(absOut, `${outLines.join('\n')}\n`, 'utf8');
  console.log(
    `[pt-hybrid] Top 150 sheet "${sheetName}": ${topOrdered.length} names (deduped), PDF allowlist-only: ${pdfOnly.length}, total CSV rows: ${outLines.length - 1}`,
  );
  console.log(`Wrote → ${cli.outputPath}`);
  console.log(
    'Pseudo-counts: rank-preserving synthetic (Top 150 block above PDF tail); not real frequencies.',
  );
  console.log(
    'Next: tsx scripts/adaptEuNationalCsvToJsonl.ts --in <this file> --out scripts/data/batches/external-eu-pt-hybrid-2024.v1.jsonl --slug eu-pt --top-per-year-sex 20000',
  );
}

void mainAsync().catch((e) => {
  console.error(e);
  process.exit(1);
});
