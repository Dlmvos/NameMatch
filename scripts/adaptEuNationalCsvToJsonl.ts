/**
 * Adapter: EU national baby-name CSV → baby_names importer JSONL.
 *
 * Canonical CSV (header row), one row per name/year/sex slice — map from national open data
 * (e.g. INSEE France, ONS England & Wales) into this shape with a small preprocessing step.
 *
 * Expected columns:
 *   year,name,sex,count,country
 *
 * - `sex`: M or F (mapped to boy / girl)
 * - `country`: free-text country label stored on `baby_names.country` (e.g. France, Germany)
 * - Output `region` defaults to **EU**; pass **`--output-region LATIN_AMERICA`** for Brazil canonical CSVs (same column contract; never conflate with Portugal — see `BRAZIL_REAL_SOURCE_WORKFLOW.md`)
 *
 * Optional (same semantics as SSA adapter):
 *   --year-min, --year-max, --top-per-year-sex N
 *   --slug stable-id   (default: eu-national; used in external_id)
 *
 * Usage:
 *   tsx scripts/adaptEuNationalCsvToJsonl.ts --in scripts/data/raw/eu-fr-sample.csv --out ...
 *   npm run adapt:baby-names:eu-fr-sample
 *   INSEE nat CSV → canonical: `mapInseeFranceToCanonicalCsv.ts` (`FRANCE_REAL_SOURCE_WORKFLOW.md`)
 *   npm run adapt:baby-names:eu-nl-sample   (Netherlands / CBS-shaped canonical CSV)
 *   npm run adapt:baby-names:eu-de-sample   (Germany / Destatis-shaped canonical CSV)
 *   Germany ranked workbook → canonical: `extractGermanyWorkbookToCanonicalCsv.ts` (see `README.baby-name-import.md`)
 *   npm run adapt:baby-names:eu-es-sample   (Spain / INE-shaped canonical CSV)
 *   Spain INE-shaped CSV → canonical: `scripts/mapIneSpainToCanonicalCsv.ts`; workbook: `extractIneSpainWorkbookToCanonicalCsv.ts` (see `scripts/data/SPAIN_REAL_SOURCE_WORKFLOW.md` — INE = trusted **top-name** source, not implied full long-tail)
 *   npm run build:baby-names:eu-national-v1 (NL+DE+ES+FR+IT+PT staging v1 CSV → JSONL batches)
 *   npm run build:baby-names:eu-fr-insee-v1 (France staging v1 only)
 *   npm run build:baby-names:eu-it-istat-v1 (Italy staging v1 only)
 *   Italy real intake + staging swap: `scripts/data/ITALY_REAL_SOURCE_WORKFLOW.md` (canonical CSV → this adapter; report + SQL)
 *   Italy workbook (Wikipedia + ISTAT Top 200): `extractItalyWorkbookToCanonicalCsv.ts` → canonical → this adapter
 *   Belgium Statbel province workbook: `extractBelgiumWorkbookToCanonicalCsv.ts` → canonical → this adapter (`--slug eu-be-statbel`; `BELGIUM_REAL_SOURCE_WORKFLOW.md`)
 *   npm run build:baby-names:eu-pt-ine-v1 (Portugal staging v1 only; INE PT–shaped slug, distinct from ES `eu-es-ine`)
 *   Portugal hybrid (Top 150 + IRN PDF): `extractPortugalHybridSourcesToCanonicalCsv.ts` → canonical → this adapter (`--slug eu-pt`); staging swap: `PORTUGAL_REAL_SOURCE_WORKFLOW.md`
 *   Brazil (IBGE-shaped canonical CSV, **not** EU): this adapter with `--slug latin-br-ibge` and `--output-region LATIN_AMERICA` — `BRAZIL_REAL_SOURCE_WORKFLOW.md`
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import {
  normalizeAndValidateRow,
  type AppRegion,
  type BulkImportSourceRow,
} from './lib/bulkBabyNameImport';

/** Output `region` on each JSONL row. Default `EU` for all existing EU national batches. Use `LATIN_AMERICA` for Brazil (see `BRAZIL_REAL_SOURCE_WORKFLOW.md`). */
const ALLOWED_OUTPUT_REGIONS: AppRegion[] = [
  'EU',
  'US',
  'ARABIA',
  'MENA',
  'ASIA',
  'LATIN_AMERICA',
  'WORLDWIDE',
];

function parseOutputRegion(argv: string[]): AppRegion {
  const i = argv.indexOf('--output-region');
  if (i < 0 || !argv[i + 1]) return 'EU';
  const raw = String(argv[i + 1])
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_');
  if (!(ALLOWED_OUTPUT_REGIONS as string[]).includes(raw)) {
    throw new Error(
      `Invalid --output-region "${argv[i + 1]}"; use one of: ${ALLOWED_OUTPUT_REGIONS.join(', ')}`,
    );
  }
  return raw as AppRegion;
}

type EuCsvRow = {
  year: number;
  name: string;
  sex: 'M' | 'F';
  count: number;
  country: string;
};

const DEFAULT_IN = 'scripts/data/raw/eu-fr-sample.csv';
const DEFAULT_OUT = 'scripts/data/batches/external-eu-fr-sample.v1.jsonl';
const DEFAULT_SLUG = 'eu-fr';

type AdaptCli = {
  inputPath: string;
  outputPath: string;
  slug: string;
  outputRegion: AppRegion;
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
  const slugIdx = argv.indexOf('--slug');
  const inputPath = inIdx >= 0 && argv[inIdx + 1] ? argv[inIdx + 1] : DEFAULT_IN;
  const outputPath = outIdx >= 0 && argv[outIdx + 1] ? argv[outIdx + 1] : DEFAULT_OUT;
  const slug = slugIdx >= 0 && argv[slugIdx + 1] ? String(argv[slugIdx + 1]).trim() : DEFAULT_SLUG;
  const outputRegion = parseOutputRegion(argv);
  const yearMin = parseYearArg(argv, '--year-min');
  const yearMax = parseYearArg(argv, '--year-max');
  const topIdx = argv.indexOf('--top-per-year-sex');
  let topPerYearSex: number | null = null;
  if (topIdx >= 0 && argv[topIdx + 1]) {
    const n = Number(argv[topIdx + 1]);
    if (Number.isFinite(n) && n > 0) topPerYearSex = Math.floor(n);
  }
  return {
    inputPath,
    outputPath,
    slug: slug || DEFAULT_SLUG,
    outputRegion,
    yearMin,
    yearMax,
    topPerYearSex,
  };
}

function parseCsvLine(line: string): string[] {
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

function parseInputCsv(raw: string): EuCsvRow[] {
  const nonEmpty = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (nonEmpty.length === 0) return [];
  const header = parseCsvLine(nonEmpty[0]).map((h) => h.toLowerCase());
  const yearIdx = header.indexOf('year');
  const nameIdx = header.indexOf('name');
  const sexIdx = header.indexOf('sex');
  const countIdx = header.indexOf('count');
  const countryIdx = header.indexOf('country');
  if ([yearIdx, nameIdx, sexIdx, countIdx, countryIdx].some((i) => i < 0)) {
    throw new Error('CSV must include header columns: year,name,sex,count,country');
  }

  const parsed: EuCsvRow[] = [];
  for (let i = 1; i < nonEmpty.length; i++) {
    const line = nonEmpty[i];
    if (line.startsWith('#')) continue;
    const cols = parseCsvLine(line);
    const year = Number(cols[yearIdx]);
    const name = String(cols[nameIdx] ?? '').trim();
    const sexRaw = String(cols[sexIdx] ?? '').trim().toUpperCase();
    const count = Number(cols[countIdx]);
    const country = String(cols[countryIdx] ?? '').trim();
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
    if (!country) throw new Error(`Missing country at line ${i + 1}`);
    parsed.push({ year, name, sex: sexRaw, count, country });
  }
  return parsed;
}

function filterByYearRange(rows: EuCsvRow[], yearMin: number | null, yearMax: number | null): EuCsvRow[] {
  return rows.filter((r) => {
    if (yearMin !== null && r.year < yearMin) return false;
    if (yearMax !== null && r.year > yearMax) return false;
    return true;
  });
}

function applyTopPerYearSex(rows: EuCsvRow[], top: number | null): EuCsvRow[] {
  if (top === null) return rows;
  const byKey = new Map<string, EuCsvRow[]>();
  for (const row of rows) {
    const key = `${row.year}|${row.sex}|${row.country}`;
    const list = byKey.get(key) ?? [];
    list.push(row);
    byKey.set(key, list);
  }
  const out: EuCsvRow[] = [];
  for (const list of byKey.values()) {
    list.sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.name.localeCompare(b.name);
    });
    out.push(...list.slice(0, top));
  }
  return out;
}

function countrySlug(country: string): string {
  return country
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'unknown';
}

function assignPopularityRanks(rows: EuCsvRow[]): Map<string, number> {
  const byKey = new Map<string, EuCsvRow[]>();
  for (const row of rows) {
    const key = `${row.year}|${row.sex}|${row.country}`;
    const list = byKey.get(key) ?? [];
    list.push(row);
    byKey.set(key, list);
  }

  const ranks = new Map<string, number>();
  for (const [key, list] of byKey.entries()) {
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

function buildImportRows(
  rows: EuCsvRow[],
  datasetSlug: string,
  outputRegion: AppRegion,
): BulkImportSourceRow[] {
  const ranks = assignPopularityRanks(rows);
  const cslug = (r: EuCsvRow) => countrySlug(r.country);
  return rows.map((r) => {
    const key = `${r.year}|${r.sex}|${r.country}`;
    const popularity_rank = ranks.get(`${key}|${r.name}`) ?? null;
    const gender = r.sex === 'M' ? 'boy' : 'girl';
    const normalizedNameSlug = r.name.toLowerCase().replace(/\s+/g, '-');
    // Dataset provenance lives in `meaning_source` — NOT `origin`. A name
    // appearing in CBS / INSEE / INE / ISTAT etc. tells us where we *got the
    // row*, not where the name is linguistically *from*. Writing the
    // provenance into `origin` corrupted two things: (a) it surfaced strings
    // like "Netherlands (national statistics)" on the swipe card, and (b) it
    // accidentally matched the Dutch origin filter regex via the word
    // "netherlands", lying about etymology. Leave `origin` null here; the
    // meaning-enrichment pipeline can populate it later for rows where the
    // true linguistic origin is actually known.
    return {
      external_id: `${datasetSlug}:${cslug(r)}:${r.year}:${r.sex}:${normalizedNameSlug}`,
      name: r.name,
      gender,
      region: outputRegion,
      origin: null,
      meaning: null,
      meaning_source: `${r.country} national statistics (${datasetSlug})`,
      country: r.country,
      is_worldwide: false,
      is_premium: false,
      popularity_rank,
    };
  });
}

function main(): void {
  const cli = parseArgs(process.argv.slice(2));
  const { inputPath, outputPath, slug, outputRegion, yearMin, yearMax, topPerYearSex } = cli;
  const absIn = path.isAbsolute(inputPath) ? inputPath : path.join(process.cwd(), inputPath);
  const absOut = path.isAbsolute(outputPath) ? outputPath : path.join(process.cwd(), outputPath);

  const raw = readFileSync(absIn, 'utf8');
  let parsedRows = parseInputCsv(raw);
  parsedRows = filterByYearRange(parsedRows, yearMin, yearMax);
  parsedRows = applyTopPerYearSex(parsedRows, topPerYearSex);
  const outputRows = buildImportRows(parsedRows, slug, outputRegion);

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
