/**
 * Curated Italy workbook (.xlsx) → canonical CSV (`year,name,sex,count,country`)
 * for `adaptEuNationalCsvToJsonl.ts` / `importBabyNamesFromJsonl.ts`.
 *
 * **Sheets (exact titles):**
 * - `Italian wikipedia names A-L` / `Italian wikipedia names M-Z` — headers **Maschile** / **Femminile** (long-tail).
 * - `Popular 2024 Names ISTAT` — row 0 section labels; row 1 `Rank`, `Name`, … for boys (left) and girls (right);
 *   from row 2 onward **alternating** rank rows (`1.`, … in column A / boys and column F / girls) and name rows
 *   (name in column B boys, column G girls). ISTAT ties share one rank row; multiple name rows may follow.
 *
 * **Merge / dedupe:** Normalized key = `name.toLowerCase()|sex`. **ISTAT wins** over Wikipedia when both exist.
 *
 * **Pseudo-counts (documented, not real frequencies):** All emitted rows use synthetic counts so
 * `adaptEuNationalCsvToJsonl` sorts by `count` and keeps **ISTAT strictly above** the Wikipedia tail:
 * - ISTAT names (in sheet order): `ISTAT_COUNT_BASE`, `ISTAT_COUNT_BASE - 1`, …
 * - Wikipedia-only names (A-L then M-Z sheet order): continue descending below the last ISTAT count.
 *
 * Usage:
 *   tsx scripts/extractItalyWorkbookToCanonicalCsv.ts \
 *     --in "scripts/data/raw/downloads/Names Italy wikipedia + top 200 ISTAT.xlsx" \
 *     --out scripts/data/raw/eu-it-workbook-2024.canonical.csv --year 2024
 *   npm run extract:baby-names:it-workbook-xlsx -- --in ... --out ... --year 2024
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

/** First ISTAT pseudo-count; Wikipedia tail continues strictly below the last ISTAT count. */
const ISTAT_COUNT_BASE = 5_000_000;

const WIKI_SHEETS = ['Italian wikipedia names A-L', 'Italian wikipedia names M-Z'] as const;
const ISTAT_SHEET = 'Popular 2024 Names ISTAT';

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
    countryIdx >= 0 && argv[countryIdx + 1] ? String(argv[countryIdx + 1]).trim() : 'Italy';
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

function normNameKey(name: string): string {
  return name.normalize('NFC').replace(/\s+/g, ' ').trim().toLowerCase();
}

/** Rank cell like `1.` or `200.` */
function parseRankCell(raw: unknown): number | null {
  const t = cellToString(raw).replace(/\s/g, '');
  const m = t.match(/^(\d+)\.?$/);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

type Sex = 'M' | 'F';

function parseIstatSheet(rows: string[][]): { name: string; sex: Sex }[] {
  const out: { name: string; sex: Sex }[] = [];
  let boyRank: number | null = null;
  let girlRank: number | null = null;

  for (let r = 2; r < rows.length; r++) {
    const row = rows[r] ?? [];
    const br = parseRankCell(row[0]);
    const gr = parseRankCell(row[5]);
    if (br !== null) boyRank = br;
    if (gr !== null) girlRank = gr;

    const boyNameRaw = cellToString(row[1]).normalize('NFC').replace(/\s+/g, ' ').trim();
    const girlNameRaw = cellToString(row[6]).normalize('NFC').replace(/\s+/g, ' ').trim();

    if (boyNameRaw) {
      const h = normHeader(boyNameRaw);
      if (h !== 'name' && boyRank !== null) {
        out.push({ name: boyNameRaw, sex: 'M' });
      }
    }
    if (girlNameRaw) {
      const h = normHeader(girlNameRaw);
      if (h !== 'name' && girlRank !== null) {
        out.push({ name: girlNameRaw, sex: 'F' });
      }
    }
  }
  return out;
}

function parseWikiSheet(rows: string[][]): { name: string; sex: Sex }[] {
  const out: { name: string; sex: Sex }[] = [];
  if (rows.length < 2) return out;
  const header = rows[0] ?? [];
  const mi = header.findIndex((c) => normHeader(cellToString(c)) === 'maschile');
  const fi = header.findIndex((c) => normHeader(cellToString(c)) === 'femminile');
  if (mi < 0 || fi < 0) {
    throw new Error('Wiki sheet: expected headers Maschile and Femminile.');
  }
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r] ?? [];
    const mRaw = cellToString(row[mi]).normalize('NFC').replace(/\s+/g, ' ').trim();
    const fRaw = cellToString(row[fi]).normalize('NFC').replace(/\s+/g, ' ').trim();
    if (mRaw && normHeader(mRaw) !== 'maschile') out.push({ name: mRaw, sex: 'M' });
    if (fRaw && normHeader(fRaw) !== 'femminile') out.push({ name: fRaw, sex: 'F' });
  }
  return out;
}

function dedupeKey(name: string, sex: Sex): string {
  return `${normNameKey(name)}|${sex}`;
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

  const istatWs = workbook.Sheets[ISTAT_SHEET];
  if (!istatWs) {
    throw new Error(`Missing sheet "${ISTAT_SHEET}". Found: ${workbook.SheetNames.join(', ')}`);
  }
  const istatRows: string[][] = XLSX.utils.sheet_to_json(istatWs, {
    header: 1,
    defval: '',
    raw: false,
  }) as string[][];
  const istatParsed = parseIstatSheet(istatRows);
  const istatOrdered: { name: string; sex: Sex }[] = [];
  const istatKeys = new Set<string>();
  for (const e of istatParsed) {
    const k = dedupeKey(e.name, e.sex);
    if (istatKeys.has(k)) continue;
    istatKeys.add(k);
    istatOrdered.push(e);
  }

  const wikiOrdered: { name: string; sex: Sex }[] = [];
  for (const sheetName of WIKI_SHEETS) {
    const ws = workbook.Sheets[sheetName];
    if (!ws) {
      console.warn(`[it-workbook] Missing sheet "${sheetName}", skipping.`);
      continue;
    }
    const wikiRows: string[][] = XLSX.utils.sheet_to_json(ws, {
      header: 1,
      defval: '',
      raw: false,
    }) as string[][];
    const parsed = parseWikiSheet(wikiRows);
    wikiOrdered.push(...parsed);
    console.log(`[it-workbook] Sheet "${sheetName}": ${parsed.length} raw name cells`);
  }

  const wikiOnly: { name: string; sex: Sex }[] = [];
  const wikiSeen = new Set<string>();
  for (const w of wikiOrdered) {
    const k = dedupeKey(w.name, w.sex);
    if (istatKeys.has(k)) continue;
    if (wikiSeen.has(k)) continue;
    wikiSeen.add(k);
    wikiOnly.push(w);
  }

  const outLines: string[] = ['year,name,sex,count,country'];
  let idx = 0;
  for (const e of istatOrdered) {
    const count = ISTAT_COUNT_BASE - idx;
    idx += 1;
    outLines.push(`${cli.year},${escapeCsv(e.name)},${e.sex},${count},${escapeCsv(cli.country)}`);
  }
  const afterIstat = idx;
  for (const e of wikiOnly) {
    const count = ISTAT_COUNT_BASE - idx;
    idx += 1;
    outLines.push(`${cli.year},${escapeCsv(e.name)},${e.sex},${count},${escapeCsv(cli.country)}`);
  }

  mkdirSync(path.dirname(absOut), { recursive: true });
  writeFileSync(absOut, `${outLines.join('\n')}\n`, 'utf8');
  console.log(
    `[it-workbook] ISTAT names: ${istatOrdered.length}, Wikipedia-only (after ISTAT wins dedupe): ${wikiOnly.length}, total CSV rows: ${outLines.length - 1}`,
  );
  console.log(`Wrote → ${cli.outputPath}`);
  console.log(
    'Pseudo-counts: rank-preserving synthetic (ISTAT block above Wikipedia tail); not real frequencies.',
  );
  console.log(
    'Next: tsx scripts/adaptEuNationalCsvToJsonl.ts --in <this file> --out scripts/data/batches/external-eu-it-workbook-2024.v1.jsonl --slug eu-it --top-per-year-sex 8000',
  );
}

main();
