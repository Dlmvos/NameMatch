/**
 * Spain hybrid sources → canonical CSV (`year,name,sex,count,country`)
 * for `adaptEuNationalCsvToJsonl.ts` / `importBabyNamesFromJsonl.ts` (unchanged downstream).
 *
 * **Inputs:**
 * - **INE workbook** (official top layer): same `.xlsx` as `extractIneSpainWorkbookToCanonicalCsv.ts`.
 *   Prefer `--ine-sheet TOTAL` when the workbook has a national TOTAL sheet (typical for hybrid depth).
 * - **General Spain workbook** (`Names Spain - general.xlsx`): first sheet (or `--general-sheet`);
 *   row 0 headers **Male** / **Female**; from row 1, column A = boy names, column B = girl names (sheet order).
 *
 * **Merge / dedupe:** Key = normalized `name|sex` (NFC, trim, lowercase). **INE wins** on duplicates
 * (official spelling + counts kept; general tail rows for that key are dropped).
 *
 * **Counts:**
 * - INE rows keep **official** integer counts from the workbook.
 * - General tail rows get **rank-preserving synthetic** counts: strictly below the minimum INE count for that sex,
 *   descending in sheet order. **These are not real frequencies.**
 * - If no INE rows exist for a sex, tail uses a high synthetic band (`TAIL_ONLY_SEX_BASE` downward).
 * - If the minimum INE count for a sex is `1`, tail counts use fractional values `< 1` so ordering stays strictly below INE.
 *
 * Usage:
 *   npm run extract:baby-names:es-hybrid-sources -- \
 *     --ine-xlsx "scripts/data/raw/downloads/Names Spain 2022 -2024.xlsx" \
 *     --general-xlsx "scripts/data/raw/downloads/Names Spain - general.xlsx" \
 *     --out scripts/data/raw/eu-es-hybrid-2023.canonical.csv \
 *     --year 2023 \
 *     --ine-sheet TOTAL
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import * as XLSX from 'xlsx';

import { extractIneSpainWorkbookToRecords } from './extractIneSpainWorkbookToCanonicalCsv';

type Cli = {
  ineXlsx: string;
  generalXlsx: string;
  outputPath: string;
  year: number;
  country: string;
  ineSheet: string | null;
  generalSheet: string | null;
};

type Sex = 'M' | 'F';

/** When a sex has no INE rows, tail-only names use this descending integer band. */
const TAIL_ONLY_SEX_BASE = 500_000;

function parseArgs(argv: string[]): Cli {
  const ix = argv.indexOf('--ine-xlsx');
  const gx = argv.indexOf('--general-xlsx');
  const outIdx = argv.indexOf('--out');
  const yearIdx = argv.indexOf('--year');
  if (ix < 0 || !argv[ix + 1]) throw new Error('Missing --ine-xlsx <path.xlsx>');
  if (gx < 0 || !argv[gx + 1]) throw new Error('Missing --general-xlsx <path.xlsx>');
  if (outIdx < 0 || !argv[outIdx + 1]) throw new Error('Missing --out <path.csv>');
  if (yearIdx < 0 || !argv[yearIdx + 1]) throw new Error('Missing --year YYYY');
  const y = Number(argv[yearIdx + 1]);
  if (!Number.isInteger(y) || y < 1990 || y > 2100) {
    throw new Error('--year must be a plausible year (1990–2100)');
  }
  const countryIdx = argv.indexOf('--country');
  const country =
    countryIdx >= 0 && argv[countryIdx + 1] ? String(argv[countryIdx + 1]).trim() : 'Spain';

  let ineSheet: string | null = null;
  const isIdx = argv.indexOf('--ine-sheet');
  if (isIdx >= 0) {
    const next = argv[isIdx + 1];
    if (next && !String(next).startsWith('--')) ineSheet = String(next).trim();
  }

  let generalSheet: string | null = null;
  const gsIdx = argv.indexOf('--general-sheet');
  if (gsIdx >= 0) {
    const next = argv[gsIdx + 1];
    if (next && !String(next).startsWith('--')) generalSheet = String(next).trim();
  }

  return {
    ineXlsx: argv[ix + 1],
    generalXlsx: argv[gx + 1],
    outputPath: argv[outIdx + 1],
    year: y,
    country,
    ineSheet,
    generalSheet,
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

function dedupeKey(name: string, sex: Sex): string {
  return `${normNameKey(name)}|${sex}`;
}

function escapeCsv(name: string): string {
  if (/[",\n]/.test(name)) return `"${name.replace(/"/g, '""')}"`;
  return name;
}

/**
 * `Names Spain - general.xlsx`: row 0 = Male | Female; data from row 1; col 0 = M, col 1 = F.
 */
function parseGeneralSpainSheet(rows: string[][]): { name: string; sex: Sex }[] {
  if (rows.length < 2) return [];
  const h0 = normHeader(cellToString(rows[0]?.[0] ?? ''));
  const h1 = normHeader(cellToString(rows[0]?.[1] ?? ''));
  const headerOk =
    (h0.includes('male') || h0 === 'm') && (h1.includes('female') || h1 === 'f');
  const startRow = headerOk ? 1 : 0;
  const out: { name: string; sex: Sex }[] = [];
  for (let r = startRow; r < rows.length; r++) {
    const row = rows[r] ?? [];
    const boyRaw = cellToString(row[0]).normalize('NFC').replace(/\s+/g, ' ').trim();
    const girlRaw = cellToString(row[1]).normalize('NFC').replace(/\s+/g, ' ').trim();
    if (boyRaw) {
      const h = normHeader(boyRaw);
      if (h !== 'male' && h !== 'boy' && h !== 'hombre') out.push({ name: boyRaw, sex: 'M' });
    }
    if (girlRaw) {
      const h = normHeader(girlRaw);
      if (h !== 'female' && h !== 'girl' && h !== 'mujer') out.push({ name: girlRaw, sex: 'F' });
    }
  }
  return out;
}

function minIneCountBySex(records: { sex: Sex; count: number }[]): { M: number | null; F: number | null } {
  let minM: number | null = null;
  let minF: number | null = null;
  for (const r of records) {
    if (r.sex === 'M') minM = minM === null ? r.count : Math.min(minM, r.count);
    else minF = minF === null ? r.count : Math.min(minF, r.count);
  }
  return { M: minM, F: minF };
}

/** Synthetic tail counts for one sex, preserving sheet order; all strictly weaker than INE for that sex. */
function tailCountsForSex(n: number, minIne: number | null): number[] {
  const out: number[] = [];
  if (n <= 0) return out;

  if (minIne === null) {
    for (let i = 0; i < n; i++) {
      out.push(Math.max(1, TAIL_ONLY_SEX_BASE - i));
    }
    return out;
  }

  if (minIne > 1) {
    let c = minIne - 1;
    for (let i = 0; i < n; i++) {
      out.push(Math.max(1, c));
      c -= 1;
    }
    return out;
  }

  // minIne === 1: use fractional counts < 1 so every tail row ranks below official INE floor.
  for (let i = 0; i < n; i++) {
    out.push(1 - (i + 1) * 1e-6);
  }
  return out;
}

function pickGeneralSheetName(names: string[], explicit: string | null): string {
  if (explicit) {
    const want = explicit.trim();
    const exact = names.find((n) => n === want);
    if (exact) return exact;
    const loose = names.find((n) => normHeader(n) === normHeader(want));
    if (loose) return loose;
    throw new Error(`General sheet "${explicit}" not found. Available: ${names.join(', ')}`);
  }
  if (names.length === 0) throw new Error('General workbook has no sheets');
  return names[0];
}

function main(): void {
  const cli = parseArgs(process.argv.slice(2));
  const absIne = path.isAbsolute(cli.ineXlsx) ? cli.ineXlsx : path.join(process.cwd(), cli.ineXlsx);
  const absGen = path.isAbsolute(cli.generalXlsx)
    ? cli.generalXlsx
    : path.join(process.cwd(), cli.generalXlsx);
  const absOut = path.isAbsolute(cli.outputPath)
    ? cli.outputPath
    : path.join(process.cwd(), cli.outputPath);

  const { records: ineRecordsRaw } = extractIneSpainWorkbookToRecords({
    absInputPath: absIne,
    country: cli.country,
    year: cli.year,
    sheetExplicit: cli.ineSheet,
  });

  const ineKeys = new Set<string>();
  const ineOrdered: { name: string; sex: Sex; count: number }[] = [];
  for (const r of ineRecordsRaw) {
    const k = dedupeKey(r.name, r.sex);
    if (ineKeys.has(k)) continue;
    ineKeys.add(k);
    ineOrdered.push({ name: r.name, sex: r.sex, count: r.count });
  }

  const genBuf = readFileSync(absGen);
  const genWb = XLSX.read(genBuf, { type: 'buffer' });
  const genSheetName = pickGeneralSheetName(genWb.SheetNames, cli.generalSheet);
  const genWs = genWb.Sheets[genSheetName];
  if (!genWs) throw new Error(`Missing general worksheet "${genSheetName}"`);
  const genRows: string[][] = XLSX.utils.sheet_to_json(genWs, {
    header: 1,
    defval: '',
    raw: false,
  }) as string[][];

  const genParsed = parseGeneralSpainSheet(genRows);
  const tailM: { name: string; sex: Sex }[] = [];
  const tailF: { name: string; sex: Sex }[] = [];
  const genSeen = new Set<string>();
  let skippedIneOverlap = 0;
  let skippedInternalDup = 0;
  for (const e of genParsed) {
    const k = dedupeKey(e.name, e.sex);
    if (ineKeys.has(k)) {
      skippedIneOverlap += 1;
      continue;
    }
    if (genSeen.has(k)) {
      skippedInternalDup += 1;
      continue;
    }
    genSeen.add(k);
    if (e.sex === 'M') tailM.push(e);
    else tailF.push(e);
  }

  const { M: minM, F: minF } = minIneCountBySex(ineOrdered);
  const countsM = tailCountsForSex(tailM.length, minM);
  const countsF = tailCountsForSex(tailF.length, minF);

  const outLines: string[] = ['year,name,sex,count,country'];
  for (const r of ineOrdered) {
    outLines.push(`${cli.year},${escapeCsv(r.name)},${r.sex},${r.count},${escapeCsv(cli.country)}`);
  }
  for (let i = 0; i < tailM.length; i++) {
    const e = tailM[i];
    outLines.push(`${cli.year},${escapeCsv(e.name)},M,${countsM[i]},${escapeCsv(cli.country)}`);
  }
  for (let i = 0; i < tailF.length; i++) {
    const e = tailF[i];
    outLines.push(`${cli.year},${escapeCsv(e.name)},F,${countsF[i]},${escapeCsv(cli.country)}`);
  }

  mkdirSync(path.dirname(absOut), { recursive: true });
  writeFileSync(absOut, `${outLines.join('\n')}\n`, 'utf8');

  console.log(
    `[es-hybrid] INE unique: ${ineOrdered.length} (INE mode: ${cli.ineSheet ?? 'regional aggregate'}); ` +
      `general tail: M=${tailM.length}, F=${tailF.length}; skipped (also in INE): ${skippedIneOverlap}; skipped (duplicate in general): ${skippedInternalDup}`,
  );
  console.log(`Wrote ${outLines.length - 1} canonical rows → ${cli.outputPath}`);
  console.log(
    'Tail counts are rank-preserving synthetic (not INE frequencies). INE rows keep official counts.',
  );
  console.log(
    'Next: tsx scripts/adaptEuNationalCsvToJsonl.ts --in <this file> --out scripts/data/batches/external-eu-es-hybrid-<y>.v1.jsonl --slug eu-es --top-per-year-sex 20000',
  );
}

main();
