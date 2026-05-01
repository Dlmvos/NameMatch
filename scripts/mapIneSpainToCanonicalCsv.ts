/**
 * Map Spain INE-style open-data CSV → canonical EU national CSV for `adaptEuNationalCsvToJsonl.ts`.
 *
 * INE exports vary by table (delimiter `;` vs `,`, Spanish headers, BOM). This script uses
 * header aliases and normalizes sex labels to M/F. See `scripts/data/SPAIN_REAL_SOURCE_WORKFLOW.md`.
 *
 * Usage:
 *   tsx scripts/mapIneSpainToCanonicalCsv.ts --in scripts/data/raw/downloads/mi_archivo_ine.csv --out scripts/data/raw/eu-es-ine.real.canonical.csv
 *   tsx scripts/mapIneSpainToCanonicalCsv.ts --in scripts/data/raw/ine-es-shaped.example.csv --out /tmp/es-canonical.csv
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

type Delim = ',' | ';';

function stripBom(s: string): string {
  return s.charCodeAt(0) === 0xfeff ? s.slice(1) : s;
}

function normalizeHeader(h: string): string {
  return stripBom(h)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

/** Spanish / INE-style numeric strings (e.g. 1.234 or 1.234,5). */
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

function parseCsvLine(line: string, delim: Delim): string[] {
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
    if (ch === delim && !inQuotes) {
      out.push(current);
      current = '';
      continue;
    }
    current += ch;
  }
  out.push(current);
  return out.map((v) => v.trim());
}

function detectDelimiter(headerLine: string): Delim {
  const semi = (headerLine.match(/;/g) ?? []).length;
  const comma = (headerLine.match(/,/g) ?? []).length;
  return semi >= comma ? ';' : ',';
}

/** INE (and similar) often emit title/metadata lines before the real table header. */
const HEADER_SCAN_MAX_LINES = 50;

const YEAR_ALIASES = new Set(['year', 'ano', 'año', 'periodo']);
const NAME_ALIASES = new Set(['name', 'nombre', 'primer nombre']);
const SEX_ALIASES = new Set(['sex', 'sexo']);
const COUNT_ALIASES = new Set(['count', 'total', 'frecuencia', 'valor', 'numero', 'numer']);

function classifyHeader(cell: string): 'year' | 'name' | 'sex' | 'count' | null {
  const n = normalizeHeader(cell);
  if (YEAR_ALIASES.has(n)) return 'year';
  if (NAME_ALIASES.has(n)) return 'name';
  if (SEX_ALIASES.has(n)) return 'sex';
  if (COUNT_ALIASES.has(n)) return 'count';
  return null;
}

type ResolvedHeader = {
  delim: Delim;
  yearIdx: number;
  nameIdx: number;
  sexIdx: number;
  countIdx: number;
};

const ROLE_KEYS = ['year', 'name', 'sex', 'count'] as const;

function missingColumnLabels(
  roles: ReturnType<typeof classifyHeader>[],
): typeof ROLE_KEYS[number][] {
  const have = new Set(
    roles.filter((r): r is (typeof ROLE_KEYS)[number] => r !== null),
  );
  return [...ROLE_KEYS].filter((k) => !have.has(k));
}

function findDataHeader(lines: string[], maxScan: number): { ok: true; h: ResolvedHeader; lineIndex: number } | { ok: false; detail: string } {
  const n = Math.min(maxScan, lines.length);
  let bestMissing: typeof ROLE_KEYS[number][] = [...ROLE_KEYS];
  let bestLineForError = lines[0] ?? '';
  const preview = lines
    .slice(0, Math.min(8, lines.length))
    .map((l, i) => `  [${i + 1}] ${l.length > 120 ? `${l.slice(0, 120)}…` : l}`);

  for (let i = 0; i < n; i++) {
    const line = lines[i];
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const delim = detectDelimiter(line);
    const headerCells = parseCsvLine(line, delim);
    const roles = headerCells.map(classifyHeader);
    const yearIdx = roles.indexOf('year');
    const nameIdx = roles.indexOf('name');
    const sexIdx = roles.indexOf('sex');
    const countIdx = roles.indexOf('count');
    const miss = missingColumnLabels(roles);
    if (miss.length < bestMissing.length) {
      bestMissing = miss;
      bestLineForError = headerCells.join(delim);
    }
    if (yearIdx < 0 || nameIdx < 0 || sexIdx < 0 || countIdx < 0) continue;
    return { ok: true, lineIndex: i, h: { delim, yearIdx, nameIdx, sexIdx, countIdx } };
  }

  return {
    ok: false,
    detail:
      `No data header in the first ${n} non-empty line(s) with columns year, nombre/name, sexo/sex, total/frecuencia/count.\n` +
      `Preview (start of file):\n${preview.join('\n')}\n` +
      `Still missing: ${bestMissing.join(', ')}. ` +
      `Closest header-like row (after scan): ${bestLineForError}\n` +
      'See SPAIN_REAL_SOURCE_WORKFLOW.md — extend alias sets in this script if your INE file uses other titles.',
  };
}

function mapSexToMF(raw: string): 'M' | 'F' | null {
  const t = normalizeHeader(raw).replace(/_/g, ' ');
  if (!t || t === 'ambos' || t.includes('ambos sexos') || t === 'total') return null;
  if (
    ['m', 'male', 'boy', 'h', 'hombre', 'hombres', 'varon', 'masculino', '1', 'v'].includes(t) ||
    t.startsWith('hombr')
  ) {
    return 'M';
  }
  if (
    ['f', 'female', 'girl', 'mujer', 'mujeres', 'femenino', '2'].includes(t) ||
    t.startsWith('mujer')
  ) {
    return 'F';
  }
  return null;
}

type Cli = {
  inputPath: string;
  outputPath: string;
  country: string;
  yearMin: number | null;
  yearMax: number | null;
};

function parseArgs(argv: string[]): Cli {
  const inIdx = argv.indexOf('--in');
  const outIdx = argv.indexOf('--out');
  if (inIdx < 0 || !argv[inIdx + 1]) throw new Error('Missing --in <path>');
  if (outIdx < 0 || !argv[outIdx + 1]) throw new Error('Missing --out <path>');
  const countryIdx = argv.indexOf('--country');
  const country =
    countryIdx >= 0 && argv[countryIdx + 1] ? String(argv[countryIdx + 1]).trim() : 'Spain';
  let yearMin: number | null = null;
  let yearMax: number | null = null;
  const ymin = argv.indexOf('--year-min');
  if (ymin >= 0 && argv[ymin + 1]) {
    const n = Number(argv[ymin + 1]);
    if (Number.isInteger(n)) yearMin = n;
  }
  const ymax = argv.indexOf('--year-max');
  if (ymax >= 0 && argv[ymax + 1]) {
    const n = Number(argv[ymax + 1]);
    if (Number.isInteger(n)) yearMax = n;
  }
  return {
    inputPath: argv[inIdx + 1],
    outputPath: argv[outIdx + 1],
    country,
    yearMin,
    yearMax,
  };
}

type InRow = { year: number; name: string; sex: 'M' | 'F'; count: number };

function main(): void {
  const cli = parseArgs(process.argv.slice(2));
  const absIn = path.isAbsolute(cli.inputPath)
    ? cli.inputPath
    : path.join(process.cwd(), cli.inputPath);
  const absOut = path.isAbsolute(cli.outputPath)
    ? cli.outputPath
    : path.join(process.cwd(), cli.outputPath);

  const raw = stripBom(readFileSync(absIn, 'utf8'));
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) throw new Error('Input CSV must have a header and at least one data row');

  const found = findDataHeader(lines, HEADER_SCAN_MAX_LINES);
  if (!found.ok) {
    throw new Error(found.detail);
  }
  const { delim, yearIdx, nameIdx, sexIdx, countIdx } = found.h;
  const headerLineIndex = found.lineIndex;

  const outRows: InRow[] = [];
  let skipped = 0;
  for (let i = headerLineIndex + 1; i < lines.length; i++) {
    if (lines[i].startsWith('#')) continue;
    const cols = parseCsvLine(lines[i], delim);
    const year = Math.round(parseNumberField(cols[yearIdx] ?? ''));
    const name = String(cols[nameIdx] ?? '').trim();
    const sex = mapSexToMF(String(cols[sexIdx] ?? ''));
    const count = Math.round(parseNumberField(cols[countIdx] ?? ''));
    if (!Number.isFinite(year) || year < 1800 || year > 2100) {
      skipped += 1;
      continue;
    }
    if (cli.yearMin !== null && year < cli.yearMin) continue;
    if (cli.yearMax !== null && year > cli.yearMax) continue;
    if (!name) {
      skipped += 1;
      continue;
    }
    if (sex === null) {
      skipped += 1;
      continue;
    }
    if (!Number.isFinite(count) || count <= 0) {
      skipped += 1;
      continue;
    }
    outRows.push({ year, name, sex, count });
  }

  const header = 'year,name,sex,count,country';
  const body = outRows
    .map((r) => `${r.year},${escapeCsv(r.name)},${r.sex},${r.count},${escapeCsv(cli.country)}`)
    .join('\n');
  mkdirSync(path.dirname(absOut), { recursive: true });
  writeFileSync(absOut, `${header}\n${body}\n`, 'utf8');
  console.log(
    `Wrote ${outRows.length} canonical rows -> ${cli.outputPath}` +
      (skipped > 0 ? ` (skipped ${skipped} non-parseable or aggregate rows)` : ''),
  );
  console.log(
    'Next: tsx scripts/adaptEuNationalCsvToJsonl.ts --in <this file> --out scripts/data/batches/external-eu-es-ine-real-<year>.v1.jsonl --slug eu-es --top-per-year-sex 1200',
  );
}

function escapeCsv(name: string): string {
  if (/[",\n]/.test(name)) return `"${name.replace(/"/g, '""')}"`;
  return name;
}

main();
