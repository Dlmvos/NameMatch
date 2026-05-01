/**
 * INE Spain Excel workbook → canonical CSV (`year,name,sex,count,country`) for `adaptEuNationalCsvToJsonl.ts`.
 *
 * Product note (see `scripts/data/SPAIN_REAL_SOURCE_WORKFLOW.md`): INE tables are **trusted and authentic**
 * for **top-name** coverage and validation; they are **not** claimed here as a full public long-tail name universe.
 *
 * Default: aggregate all autonomous-community sheets (NI\u00d1OS/NI\u00d1AS layout), skip cover ("A\u00f1o YYYY")
 * and national TOTAL (avoids double-counting with regional sums).
 *
 * Single-sheet: pass `--sheet <name>` (e.g. TOTAL) for legacy one-sheet extraction without cross-sheet aggregation.
 *
 * Usage:
 *   tsx scripts/extractIneSpainWorkbookToCanonicalCsv.ts --in path/to/file.xlsx --out scripts/data/raw/eu-es-ine.real.canonical.csv --year 2023
 *   tsx scripts/extractIneSpainWorkbookToCanonicalCsv.ts ... --sheet TOTAL
 *   npm run extract:baby-names:es-ine-xlsx -- --in ... --out ... --year 2023
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import * as XLSX from 'xlsx';

type Cli = {
  inputPath: string;
  outputPath: string;
  country: string;
  year: number | null;
  /** `null` = aggregate regional sheets; non-null = extract only that sheet. */
  sheetExplicit: string | null;
};

type IneSex = 'M' | 'F';

type IneRecord = { name: string; sex: IneSex; count: number };

/** Exported for `extractSpainHybridSourcesToCanonicalCsv.ts` (INE top layer + curated tail). */
export type SpainIneWorkbookRecord = IneRecord;

/**
 * Read an INE Spain `.xlsx` and return deduped name/sex rows with official counts (no CSV write).
 * Same branching as CLI: optional single `--sheet`, else regional aggregation.
 */
export function extractIneSpainWorkbookToRecords(opts: {
  absInputPath: string;
  country: string;
  year: number | null;
  sheetExplicit: string | null;
}): { year: number; records: SpainIneWorkbookRecord[] } {
  const buf = readFileSync(opts.absInputPath);
  const workbook = XLSX.read(buf, { type: 'buffer' });
  const year = inferYear(workbook.SheetNames, opts.year);

  if (opts.sheetExplicit !== null) {
    const sheetName = resolveWorksheetName(workbook, opts.sheetExplicit);
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) {
      throw new Error(
        `Missing worksheet object for sheet "${sheetName}". Available sheets: ${workbook.SheetNames.join(', ')}`,
      );
    }
    const rows: string[][] = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: '',
      raw: false,
    }) as string[][];

    const { records, skipped, headRow, iN, iM, layout } = collectIneRecordsFromSheet(rows);
    if (records.length === 0) {
      const preview = rows
        .slice(0, Math.min(8, rows.length))
        .map((row, i) => {
          const cells = (row ?? []).map((c) => cellToString(c)).join(' | ');
          const short = cells.length > 140 ? `${cells.slice(0, 140)}\u2026` : cells;
          return `  [row ${i}] ${short}`;
        })
        .join('\n');
      throw new Error(
        `No data rows extracted from sheet "${sheetName}" (year ${year}) — expected INE NI\u00d1OS/NI\u00d1AS side-by-side layout.\n` +
          `Detected header at row index ${headRow} (0-based), NI\u00d1OS col ${iN}, NI\u00d1AS col ${iM}.\n` +
          `Inferred columns (0-based): boy name ${layout.bName}, boy count ${layout.bCount}, girl name ${layout.gName}, girl count ${layout.gCount}.\n` +
          `First rows (preview):\n${preview}\n` +
          `Available sheets: ${workbook.SheetNames.join(', ')}`,
      );
    }
    if (skipped > 0) {
      console.warn(`[ine-es-xlsx] sheet "${sheetName}": skipped ${skipped} summary/total/empty lines`);
    }
    return { year, records };
  }

  const regionalSheets = listRegionalSheetsForAggregation(workbook.SheetNames);
  if (regionalSheets.length === 0) {
    throw new Error(
      'No regional sheets to aggregate (after skipping cover and TOTAL). ' +
        `Sheets: ${workbook.SheetNames.join(', ')}`,
    );
  }

  const allRecords: IneRecord[] = [];
  const usedSheets: string[] = [];
  let totalSkipped = 0;

  for (const sheetName of regionalSheets) {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) continue;
    const rows: string[][] = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: '',
      raw: false,
    }) as string[][];
    try {
      const { records, skipped } = collectIneRecordsFromSheet(rows);
      totalSkipped += skipped;
      if (records.length === 0) {
        console.warn(`[ine-es-xlsx] Skipping sheet "${sheetName}": no data rows parsed (layout?).`);
        continue;
      }
      usedSheets.push(sheetName);
      allRecords.push(...records);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn(`[ine-es-xlsx] Skipping sheet "${sheetName}": ${msg}`);
    }
  }

  if (usedSheets.length === 0) {
    throw new Error(
      'No regional sheets produced any data rows. Check NI\u00d1OS/NI\u00d1AS layout or use --sheet for a single sheet.',
    );
  }

  const rawM = allRecords.filter((r) => r.sex === 'M').length;
  const rawF = allRecords.filter((r) => r.sex === 'F').length;
  const aggregated = aggregateRecordsByNameSex(allRecords);
  const uniqM = aggregated.filter((r) => r.sex === 'M').length;
  const uniqF = aggregated.filter((r) => r.sex === 'F').length;

  console.log(
    `[ine-es-xlsx] Regional aggregation year ${year}: sheets used (${usedSheets.length}): ${usedSheets.join(', ')}`,
  );
  console.log(
    `[ine-es-xlsx] Raw name rows before aggregation: M=${rawM}, F=${rawF}; unique after aggregation: M=${uniqM}, F=${uniqF}`,
  );
  if (totalSkipped > 0) {
    console.log(`[ine-es-xlsx] Skipped rows (totals/subheaders/empty) summed across sheets: ${totalSkipped}`);
  }

  return { year, records: aggregated };
}

function parseArgs(argv: string[]): Cli {
  const inIdx = argv.indexOf('--in');
  const outIdx = argv.indexOf('--out');
  if (inIdx < 0 || !argv[inIdx + 1]) throw new Error('Missing --in <path.xlsx>');
  if (outIdx < 0 || !argv[outIdx + 1]) throw new Error('Missing --out <path.csv>');
  const yearIdx = argv.indexOf('--year');
  let year: number | null = null;
  if (yearIdx >= 0 && argv[yearIdx + 1]) {
    const n = Number(argv[yearIdx + 1]);
    if (Number.isInteger(n) && n >= 1800 && n <= 2100) year = n;
  }
  const sheetIdx = argv.indexOf('--sheet');
  let sheetExplicit: string | null = null;
  if (sheetIdx >= 0) {
    const next = argv[sheetIdx + 1];
    if (next && !String(next).startsWith('--')) {
      sheetExplicit = String(next).trim();
    }
  }
  const countryIdx = argv.indexOf('--country');
  const country =
    countryIdx >= 0 && argv[countryIdx + 1] ? String(argv[countryIdx + 1]).trim() : 'Spain';
  return { inputPath: argv[inIdx + 1], outputPath: argv[outIdx + 1], country, year, sheetExplicit };
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

/** Match INE-style counts (thousands separators, decimals). */
function parseNumberField(raw: string): number {
  const t = String(raw ?? '').trim();
  if (!t) return NaN;
  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(t)) {
    return Number(t.replace(/\./g, '').replace(',', '.'));
  }
  if (/^\d+,\d+$/.test(t)) {
    return Number(t.replace(',', '.'));
  }
  if (/^\d{1,3}(\.\d{3})+$/.test(t)) {
    return Number(t.replace(/\./g, ''));
  }
  return Number(t);
}

function isNumericToken(t: string): boolean {
  return Number.isFinite(parseNumberField(t)) && parseNumberField(t) > 0;
}

function isTotalishName(s: string): boolean {
  const a = stripAccents(s).toLowerCase().trim();
  return a === 'total' || a.startsWith('total ') || a === 't';
}

function normSheetName(n: string): string {
  return stripAccents(n).trim().toLowerCase();
}

/** Cover/title sheets like "A\u00f1o 2023" (not data). */
function isWorkbookCoverSheet(sheetName: string): boolean {
  const s = normSheetName(sheetName);
  return /^a[nñ]o\s+(19|20)\d{2}$/.test(s);
}

/** Sheets to aggregate: all workbook sheets except cover and national TOTAL. */
function listRegionalSheetsForAggregation(sheetNames: string[]): string[] {
  return sheetNames.filter((n) => {
    const s = normSheetName(n);
    if (s === 'total') return false;
    if (isWorkbookCoverSheet(n)) return false;
    return true;
  });
}

/** Default national sheet: exact name TOTAL only (single-sheet / --sheet default target). */
function pickDefaultTotalSheet(workbook: XLSX.WorkBook): string {
  for (const n of workbook.SheetNames) {
    if (normSheetName(n) === 'total') return n;
  }
  throw new Error(
    'No --sheet argument: need a sheet named exactly "TOTAL" for national NI\u00d1OS/NI\u00d1AS data, or pass --sheet <name>. ' +
      `Available sheets: ${workbook.SheetNames.join(', ')}`,
  );
}

/** User-provided --sheet: exact (normalized) match, then substring fallback for regional names. */
function findSheetByExplicitTarget(workbook: XLSX.WorkBook, target: string): string {
  const want = normSheetName(target);
  if (!want) {
    throw new Error(
      `Empty --sheet value. Available sheets: ${workbook.SheetNames.join(', ')}`,
    );
  }
  for (const n of workbook.SheetNames) {
    if (normSheetName(n) === want) return n;
  }
  for (const n of workbook.SheetNames) {
    const nn = normSheetName(n);
    if (nn.includes(want) || want.includes(nn)) return n;
  }
  throw new Error(
    `Sheet "${target}" not found. Available sheets: ${workbook.SheetNames.join(', ')}`,
  );
}

function resolveWorksheetName(workbook: XLSX.WorkBook, sheetExplicit: string | null): string {
  if (sheetExplicit !== null) return findSheetByExplicitTarget(workbook, sheetExplicit);
  return pickDefaultTotalSheet(workbook);
}

function inferYear(sheetNames: string[], explicit: number | null): number {
  if (explicit !== null) return explicit;
  for (const n of sheetNames) {
    const m = n.match(/a[nñ]o\s*(\d{4})/i) ?? n.match(/\b(20\d{2})\b/);
    if (m) {
      const y = parseInt(m[1], 10);
      if (y >= 1990 && y <= 2100) return y;
    }
  }
  throw new Error(
    'Could not infer year. Pass --year YYYY or use a workbook with a sheet like "A\u00f1o 2023".',
  );
}

/** Minimum span NI\u00d1OS..NI\u00d1AS so the boy block fits at least name + count (2 columns). */
const MIN_COL_GAP_NINOS_NINAS = 2;

function tryMatchNinosNinasColumns(row: string[]): { iN: number; iM: number } | null {
  let iN = -1;
  let iM = -1;
  for (let c = 0; c < row.length; c++) {
    const t = stripAccents(cellToString(row[c])).toLowerCase();
    if (/\bninos\b/.test(t) && iN < 0) iN = c;
    if (/\bninas\b/.test(t) && iM < 0) iM = c;
  }
  if (iN < 0 || iM < 0 || iN >= iM || iM - iN < MIN_COL_GAP_NINOS_NINAS) return null;
  return { iN, iM };
}

function nextNonBlankRowIndex(rows: string[][], start: number): number {
  for (let j = start; j < rows.length; j++) {
    if ((rows[j] ?? []).some((c) => String(c ?? '').trim() !== '')) return j;
  }
  return -1;
}

/**
 * Like parseNameCountBlock but allows TOTAL as the name (parseNameCountBlock rejects it for data rows).
 * Used only to validate the national totals row after the NI\u00d1OS/NI\u00d1AS header.
 */
function parseBlockNationalTotalLookahead(cells: string[]): { name: string; count: number } | null {
  const parts = cells.map((c) => cellToString(c)).filter((c) => c !== '');
  if (parts.length < 2) return null;
  const last = parts[parts.length - 1];
  const count = Math.round(parseNumberField(last));
  if (!Number.isFinite(count) || count <= 0) return null;
  const name = parts.length === 2 ? parts[0] : parts[parts.length - 2];
  return { name, count };
}

type IneNameCountColLayout = { bName: number; bCount: number; gName: number; gCount: number };

/** National totals: two adjacent TOTAL + large count pairs (NI\u00d1OS/NI\u00d1AS may align with name or count column). */
function rowLooksLikeNationalTotalsRow(row: string[], iN: number, iM: number): boolean {
  const big = (n: number) => Number.isFinite(n) && n >= 1_000;
  const pairOk = (nameCol: number, countCol: number) => {
    const b = parseBlockNationalTotalLookahead([row[nameCol], row[countCol]]);
    return !!(b && isTotalishName(b.name) && big(b.count));
  };
  const tryLayout = (bName: number, bCount: number, gName: number, gCount: number): boolean => {
    const len = row.length;
    if (bName < 0 || gName < 0 || bCount >= len || gCount >= len) return false;
    return pairOk(bName, bCount) && pairOk(gName, gCount);
  };
  if (iN >= 1 && tryLayout(iN - 1, iN, iM - 1, iM)) return true;
  if (tryLayout(iN, iN + 1, iM, iM + 1)) return true;
  return tryLayout(iN + 1, iN + 2, iM + 1, iM + 2);
}

/** Adjacent columns that parse as non-total name + count. */
function findNonTotalAdjacentPairs(row: string[]): number[] {
  const idx: number[] = [];
  for (let c = 0; c < row.length - 1; c++) {
    const p = parseNameCountBlock([row[c], row[c + 1]]);
    if (p && !isTotalishName(p.name)) idx.push(c);
  }
  return idx;
}

/**
 * Prefer inferring from the first data row(s): leftmost and rightmost name,count pairs (side-by-side blocks).
 * Fallback: NI\u00d1OS/NI\u00d1AS on count columns (iN-1,iN) / (iM-1,iM), else (iN,iN+1) / (iM,iM+1).
 */
function inferNameCountColLayout(rows: string[][], startRow: number, iN: number, iM: number): IneNameCountColLayout {
  const maxScan = Math.min(rows.length, startRow + 10);
  for (let r = startRow; r < maxScan; r++) {
    const row = rows[r] ?? [];
    if (!(row ?? []).some((c) => String(c ?? '').trim() !== '')) continue;
    const pairs = findNonTotalAdjacentPairs(row);
    if (pairs.length >= 2) {
      const lo = pairs[0];
      const hi = pairs[pairs.length - 1];
      if (lo < hi) return { bName: lo, bCount: lo + 1, gName: hi, gCount: hi + 1 };
    }
  }
  if (iN >= 1 && iM >= 1) {
    return { bName: iN - 1, bCount: iN, gName: iM - 1, gCount: iM };
  }
  return { bName: iN, bCount: iN + 1, gName: iM, gCount: iM + 1 };
}

function parseBoyGirlFromLayout(
  row: string[],
  layout: IneNameCountColLayout,
): { boy: { name: string; count: number } | null; girl: { name: string; count: number } | null } {
  const { bName, bCount, gName, gCount } = layout;
  return {
    boy: parseNameCountBlock([row[bName], row[bCount]]),
    girl: parseNameCountBlock([row[gName], row[gCount]]),
  };
}

/**
 * Prefer the NI\u00d1OS/NI\u00d1AS row followed by a TOTAL/TOTAL totals row (skips title rows that mention ni\u00f1os/ni\u00f1as).
 * If none validate, fall back to the last qualifying row in the scan window.
 */
function findBestNinosNinasHeaderRow(rows: string[][]): { rowIndex: number; iN: number; iM: number } {
  const maxR = Math.min(rows.length, 55);
  const candidates: { rowIndex: number; iN: number; iM: number }[] = [];
  for (let r = 0; r < maxR; r++) {
    const m = tryMatchNinosNinasColumns(rows[r] ?? []);
    if (m) candidates.push({ rowIndex: r, ...m });
  }
  if (candidates.length === 0) {
    throw new Error(
      'No row found with NI\u00d1OS and NI\u00d1AS labels and room for name/count columns between them (check sheet layout).',
    );
  }
  const validated: typeof candidates = [];
  for (const c of candidates) {
    const nxt = nextNonBlankRowIndex(rows, c.rowIndex + 1);
    if (nxt >= 0 && rowLooksLikeNationalTotalsRow(rows[nxt], c.iN, c.iM)) {
      validated.push(c);
    }
  }
  const pick =
    validated.length > 0 ? validated[validated.length - 1] : candidates[candidates.length - 1];
  return pick;
}

function isSubheaderRow(row: string[], iN: number, iM: number): boolean {
  const slice = row.slice(iN, iM + 1).map(cellToString).join(' ');
  const s = stripAccents(slice).toLowerCase();
  return s.includes('nombre') || s.includes('frec') || s.includes('orden');
}

function isAggregateOrTotalRow(
  row: string[],
  iN: number,
  iM: number,
  boy: { name: string; count: number } | null,
  girl: { name: string; count: number } | null,
): boolean {
  if (boy && isTotalishName(boy.name)) return true;
  if (girl && isTotalishName(girl.name)) return true;
  const line = row.map(cellToString).join(' ').toLowerCase();
  if (line.includes('total') && !boy && !girl) return true;
  return false;
}

function parseNameCountBlock(cells: string[]): { name: string; count: number } | null {
  const parts = cells.map((c) => cellToString(c)).filter((c) => c !== '');
  if (parts.length < 2) return null;
  const last = parts[parts.length - 1];
  const count = Math.round(parseNumberField(last));
  if (!Number.isFinite(count) || count <= 0) return null;
  if (parts.length === 2) {
    if (isTotalishName(parts[0])) return null;
    return { name: parts[0], count };
  }
  const first = parts[0];
  if (isNumericToken(first) && parts.length >= 3) {
    if (isTotalishName(parts[1])) return null;
    return { name: parts[1], count };
  }
  const name = parts[parts.length - 2];
  if (isTotalishName(name)) return null;
  return { name, count };
}

function normalizeAggKey(name: string): string {
  return stripAccents(name).toLowerCase().trim();
}

function aggKey(sex: IneSex, name: string): string {
  return `${sex}\0${normalizeAggKey(name)}`;
}

/** Sum counts per normalized name + sex; keep first-seen display spelling. */
function aggregateRecordsByNameSex(records: IneRecord[]): IneRecord[] {
  const map = new Map<string, IneRecord>();
  for (const r of records) {
    const k = aggKey(r.sex, r.name);
    const ex = map.get(k);
    if (!ex) map.set(k, { name: r.name, sex: r.sex, count: r.count });
    else ex.count += r.count;
  }
  const out = [...map.values()];
  out.sort((a, b) => {
    if (a.sex !== b.sex) return a.sex.localeCompare(b.sex);
    return normalizeAggKey(a.name).localeCompare(normalizeAggKey(b.name));
  });
  return out;
}

function collectIneRecordsFromSheet(rows: string[][]): {
  records: IneRecord[];
  skipped: number;
  headRow: number;
  iN: number;
  iM: number;
  layout: IneNameCountColLayout;
} {
  const { rowIndex: headRow, iN, iM } = findBestNinosNinasHeaderRow(rows);

  let r = headRow + 1;
  while (r < rows.length && !(rows[r] ?? []).some((c) => String(c ?? '').trim() !== '')) {
    r += 1;
  }
  if (r < rows.length && isSubheaderRow(rows[r], iN, iM)) {
    r += 1;
    while (r < rows.length && !(rows[r] ?? []).some((c) => String(c ?? '').trim() !== '')) {
      r += 1;
    }
  }
  if (r < rows.length && rowLooksLikeNationalTotalsRow(rows[r] ?? [], iN, iM)) {
    r += 1;
    while (r < rows.length && !(rows[r] ?? []).some((c) => String(c ?? '').trim() !== '')) {
      r += 1;
    }
  }

  const layout = inferNameCountColLayout(rows, r, iN, iM);

  const records: IneRecord[] = [];
  let skipped = 0;
  let failStreak = 0;
  for (; r < rows.length; r++) {
    const row = rows[r] ?? [];
    if (!row.some((c) => String(c ?? '').trim() !== '')) {
      failStreak += 1;
      if (failStreak > 12) break;
      continue;
    }
    failStreak = 0;
    if (r === headRow) continue;

    const { boy, girl } = parseBoyGirlFromLayout(row, layout);
    if (isAggregateOrTotalRow(row, iN, iM, boy, girl)) {
      skipped += 1;
      continue;
    }
    if (boy) records.push({ name: boy.name, sex: 'M', count: boy.count });
    else skipped += 1;
    if (girl) records.push({ name: girl.name, sex: 'F', count: girl.count });
    else skipped += 1;
    if (!boy && !girl) skipped += 1;
  }

  return { records, skipped, headRow, iN, iM, layout };
}

function recordsToCanonicalLines(records: IneRecord[], year: number, country: string): string[] {
  const header = 'year,name,sex,count,country';
  const out = [header];
  for (const rec of records) {
    out.push(`${year},${escapeCsv(rec.name)},${rec.sex},${rec.count},${escapeCsv(country)}`);
  }
  return out;
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

  const { year, records } = extractIneSpainWorkbookToRecords({
    absInputPath: absIn,
    country: cli.country,
    year: cli.year,
    sheetExplicit: cli.sheetExplicit,
  });

  const lines = recordsToCanonicalLines(records, year, cli.country);

  mkdirSync(path.dirname(absOut), { recursive: true });
  writeFileSync(absOut, `${lines.join('\n')}\n`, 'utf8');

  if (cli.sheetExplicit !== null) {
    console.log(
      `Wrote ${lines.length - 1} canonical data rows (plus header) from single sheet (target "${cli.sheetExplicit}"; year ${year}) -> ${cli.outputPath}`,
    );
  } else {
    console.log(
      `Wrote ${lines.length - 1} canonical data rows (plus header) -> ${cli.outputPath} (national TOTAL and cover sheet excluded from aggregation; year ${year})`,
    );
  }
  console.log(
    'Next: tsx scripts/adaptEuNationalCsvToJsonl.ts --in <this file> --out scripts/data/batches/external-eu-es-ine-real-<y>.v1.jsonl --slug eu-es --top-per-year-sex 1200',
  );
}

/** Avoid running CLI when this module is imported (e.g. Spain hybrid extractor). */
const isIneSpainCliEntry =
  (process.argv[1]?.includes('extractIneSpainWorkbookToCanonicalCsv') ?? false);
if (isIneSpainCliEntry) {
  main();
}
