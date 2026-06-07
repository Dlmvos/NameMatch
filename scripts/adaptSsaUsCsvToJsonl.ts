/**
 * Adapter: US SSA-style CSV (or national `yob*.txt` lines) -> baby_names importer JSONL.
 *
 * CSV with header:
 *   year,name,sex,count
 *
 * SSA national file (`yobYYYY.txt`, no header, comma-separated):
 *   Name,Letter,count
 *   Use: --ssa-yob --year YYYY --in path/to/yob2023.txt
 *
 * Optional caps (deterministic):
 *   --year-min / --year-max   filter years (CSV mode; yob rows share --year)
 *   --top-per-year-sex N      keep top N rows per (year, sex) by count, then name
 *
 * Output rows match BulkImportSourceRow in scripts/lib/bulkBabyNameImport.ts.
 *
 * Usage:
 *   tsx scripts/adaptSsaUsCsvToJsonl.ts --in scripts/data/raw/us-ssa-sample.csv --out ...
 *   tsx scripts/adaptSsaUsCsvToJsonl.ts --ssa-yob --year 2023 --in ./yob2023.txt --top-per-year-sex 800 --out ...
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { normalizeAndValidateRow, type BulkImportSourceRow } from './lib/bulkBabyNameImport';

type SsaCsvRow = {
  year: number;
  name: string;
  sex: 'M' | 'F';
  count: number;
};

const DEFAULT_IN = 'scripts/data/raw/us-ssa-sample.csv';
const DEFAULT_OUT = 'scripts/data/batches/external-us-ssa-sample.v1.jsonl';
const DATASET_SLUG = 'ssa-us';

type AdaptCli = {
  inputPath: string;
  outputPath: string;
  ssaYob: boolean;
  /** Required when --ssa-yob */
  yobYear: number | null;
  yearMin: number | null;
  yearMax: number | null;
  topPerYearSex: number | null;
};

function parseYearArg(argv: string[], flag: string): number | null {
  const i = argv.indexOf(flag);
  if (i < 0 || !argv[i + 1]) return null;
  const n = Number(argv[i + 1]);
  return Number.isInteger(n) ? n : null;
}

function parseArgs(argv: string[]): AdaptCli {
  const inIdx = argv.indexOf('--in');
  const outIdx = argv.indexOf('--out');
  const inputPath = inIdx >= 0 && argv[inIdx + 1] ? argv[inIdx + 1] : DEFAULT_IN;
  const outputPath = outIdx >= 0 && argv[outIdx + 1] ? argv[outIdx + 1] : DEFAULT_OUT;
  const ssaYob = argv.includes('--ssa-yob');
  const yobYear = parseYearArg(argv, '--year');
  const yearMin = parseYearArg(argv, '--year-min');
  const yearMax = parseYearArg(argv, '--year-max');
  const topIdx = argv.indexOf('--top-per-year-sex');
  let topPerYearSex: number | null = null;
  if (topIdx >= 0 && argv[topIdx + 1]) {
    const n = Number(argv[topIdx + 1]);
    if (Number.isFinite(n) && n > 0) topPerYearSex = Math.floor(n);
  }
  return { inputPath, outputPath, ssaYob, yobYear, yearMin, yearMax, topPerYearSex };
}

function parseCsvLine(line: string): string[] {
  // Minimal CSV parser (supports quoted fields and escaped quotes).
  const out: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === ',' && !inQuotes) {
      out.push(current);
      current = '';
      continue;
    }
    current += ch;
  }
  out.push(current);
  return out.map((v) => v.trim());
}

function parseSsaYobLines(lines: string[], fileYear: number, startLine: number): SsaCsvRow[] {
  const parsed: SsaCsvRow[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const cols = parseCsvLine(line);
    if (cols.length < 3) throw new Error(`Expected name,sex,count at line ${startLine + i}`);
    const name = String(cols[0] ?? '').trim();
    const sexRaw = String(cols[1] ?? '').trim().toUpperCase();
    const count = Number(cols[2]);
    if (!name) throw new Error(`Missing name at line ${startLine + i}`);
    if (sexRaw !== 'M' && sexRaw !== 'F') {
      throw new Error(`Invalid sex at line ${startLine + i}; expected M or F`);
    }
    if (!Number.isFinite(count) || count <= 0) {
      throw new Error(`Invalid count at line ${startLine + i}`);
    }
    parsed.push({ year: fileYear, name, sex: sexRaw, count });
  }
  return parsed;
}

function parseInputCsv(raw: string, opts: { ssaYob: boolean; yobYear: number | null }): SsaCsvRow[] {
  const lines = raw.split(/\r?\n/).map((l) => l.trimEnd());
  if (opts.ssaYob) {
    if (opts.yobYear === null || !Number.isInteger(opts.yobYear) || opts.yobYear < 1800 || opts.yobYear > 2100) {
      throw new Error('--ssa-yob requires a valid integer --year YYYY');
    }
    const body = lines.map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
    return parseSsaYobLines(body, opts.yobYear, 1);
  }

  const nonEmpty = lines.map((l) => l.trim()).filter(Boolean);
  if (nonEmpty.length === 0) return [];
  const header = parseCsvLine(nonEmpty[0]).map((h) => h.toLowerCase());
  const yearIdx = header.indexOf('year');
  const nameIdx = header.indexOf('name');
  const sexIdx = header.indexOf('sex');
  const countIdx = header.indexOf('count');
  if ([yearIdx, nameIdx, sexIdx, countIdx].some((i) => i < 0)) {
    throw new Error('CSV must include header columns: year,name,sex,count (or use --ssa-yob --year YYYY)');
  }

  const parsed: SsaCsvRow[] = [];
  for (let i = 1; i < nonEmpty.length; i++) {
    if (nonEmpty[i].startsWith('#')) continue;
    const cols = parseCsvLine(nonEmpty[i]);
    const year = Number(cols[yearIdx]);
    const name = String(cols[nameIdx] ?? '').trim();
    const sexRaw = String(cols[sexIdx] ?? '').trim().toUpperCase();
    const count = Number(cols[countIdx]);
    if (!Number.isInteger(year) || year < 1800 || year > 2100) {
      throw new Error(`Invalid year at line ${i + 1}`);
    }
    if (!name) throw new Error(`Missing name at line ${i + 1}`);
    if (sexRaw !== 'M' && sexRaw !== 'F') {
      throw new Error(`Invalid sex at line ${i + 1}; expected M or F`);
    }
    if (!Number.isFinite(count) || count <= 0) {
      throw new Error(`Invalid count at line ${i + 1}`);
    }
    parsed.push({ year, name, sex: sexRaw, count });
  }
  return parsed;
}

function filterByYearRange(rows: SsaCsvRow[], yearMin: number | null, yearMax: number | null): SsaCsvRow[] {
  return rows.filter((r) => {
    if (yearMin !== null && r.year < yearMin) return false;
    if (yearMax !== null && r.year > yearMax) return false;
    return true;
  });
}

function applyTopPerYearSex(rows: SsaCsvRow[], top: number | null): SsaCsvRow[] {
  if (top === null) return rows;
  const byYearSex = new Map<string, SsaCsvRow[]>();
  for (const row of rows) {
    const key = `${row.year}|${row.sex}`;
    const list = byYearSex.get(key) ?? [];
    list.push(row);
    byYearSex.set(key, list);
  }
  const out: SsaCsvRow[] = [];
  for (const list of byYearSex.values()) {
    list.sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.name.localeCompare(b.name);
    });
    out.push(...list.slice(0, top));
  }
  return out;
}

function assignPopularityRanks(rows: SsaCsvRow[]): Map<string, number> {
  // rank key: `${year}|${sex}|${name}`
  const byYearSex = new Map<string, SsaCsvRow[]>();
  for (const row of rows) {
    const key = `${row.year}|${row.sex}`;
    const list = byYearSex.get(key) ?? [];
    list.push(row);
    byYearSex.set(key, list);
  }

  const ranks = new Map<string, number>();
  for (const [key, list] of byYearSex.entries()) {
    list.sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.name.localeCompare(b.name);
    });
    for (let i = 0; i < list.length; i++) {
      const row = list[i];
      ranks.set(`${key}|${row.name}`, i + 1);
    }
  }
  return ranks;
}

function buildImportRows(rows: SsaCsvRow[]): BulkImportSourceRow[] {
  const ranks = assignPopularityRanks(rows);
  return rows.map((r) => {
    const popularity_rank = ranks.get(`${r.year}|${r.sex}|${r.name}`) ?? null;
    const gender = r.sex === 'M' ? 'boy' : 'girl';
    const normalizedNameSlug = r.name.toLowerCase().replace(/\s+/g, '-');
    // Dataset provenance lives in `meaning_source` — NOT `origin`. "US SSA"
    // tells us the source of the row, not the linguistic origin of the name
    // (an SSA row for "Sofia" doesn't make it American-origin). Leave
    // `origin` null here; meaning enrichment can fill in true etymology
    // later for rows where it's actually known.
    return {
      external_id: `${DATASET_SLUG}:${r.year}:${r.sex}:${normalizedNameSlug}`,
      name: r.name,
      gender,
      region: 'US',
      origin: null,
      meaning: null,
      meaning_source: 'US SSA (Social Security Administration)',
      country: 'USA',
      is_worldwide: false,
      is_premium: false,
      popularity_rank,
    };
  });
}

function main(): void {
  const cli = parseArgs(process.argv.slice(2));
  const { inputPath, outputPath, ssaYob, yobYear, yearMin, yearMax, topPerYearSex } = cli;
  const absIn = path.isAbsolute(inputPath) ? inputPath : path.join(process.cwd(), inputPath);
  const absOut = path.isAbsolute(outputPath) ? outputPath : path.join(process.cwd(), outputPath);

  const raw = readFileSync(absIn, 'utf8');
  let parsedRows = parseInputCsv(raw, { ssaYob, yobYear });
  parsedRows = filterByYearRange(parsedRows, yearMin, yearMax);
  parsedRows = applyTopPerYearSex(parsedRows, topPerYearSex);
  const outputRows = buildImportRows(parsedRows);

  const validRows: BulkImportSourceRow[] = [];
  const dropped: string[] = [];
  for (const row of outputRows) {
    const result = normalizeAndValidateRow(row);
    if (!result.ok) {
      dropped.push(`${row.external_id}: ${result.errors.join('; ')}`);
    } else {
      validRows.push(row);
    }
  }
  if (dropped.length > 0) {
    const sample = dropped.slice(0, 30).join('\n');
    console.warn(
      `[adapt] Dropped ${dropped.length}/${outputRows.length} rows. Sample:\n${sample}${dropped.length > 30 ? '\n…' : ''}`,
    );
  }
  if (validRows.length === 0) {
    throw new Error('Adapter produced zero valid rows after validation/quality checks');
  }

  mkdirSync(path.dirname(absOut), { recursive: true });
  writeFileSync(absOut, `${validRows.map((r) => JSON.stringify(r)).join('\n')}\n`, 'utf8');
  console.log(`Adapted ${validRows.length} rows (dropped ${dropped.length}) -> ${outputPath}`);
  console.log(`Next: npm run import:baby-names -- --dry-run ${outputPath}`);
}

main();
