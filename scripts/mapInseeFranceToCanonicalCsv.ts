/**
 * Map INSEE **Fichier des prénoms** (national open-data CSV) → canonical EU CSV for `adaptEuNationalCsvToJsonl.ts`.
 *
 * Expected raw layout (INSEE `nat*.csv` style; delimiter `;` or `,`, optional UTF-8 BOM):
 * - **sexe** — `1` = masculin → `M`, `2` = féminin → `F` (also accepts common text aliases)
 * - **preusuel** — first given name (skip aggregate rows whose label starts with `_`, e.g. `_PRENOMS_RARES`)
 * - **annais** — birth year (integer; skip non-numeric rows such as pooled codes)
 * - **nombre** or **valeur** — count / rounded frequency
 *
 * Pin the exact file you downloaded (URL and vintage change on data.gouv.fr / insee.fr) under
 * `scripts/data/raw/downloads/` (gitignored). Do not commit multi-megabyte national extracts.
 *
 * Usage:
 *   tsx scripts/mapInseeFranceToCanonicalCsv.ts --in scripts/data/raw/downloads/nat2022.csv --out scripts/data/raw/eu-fr-insee.real.canonical.csv
 *   tsx scripts/mapInseeFranceToCanonicalCsv.ts --in …/nat2022.csv --out …/eu-fr-insee.real.canonical.csv --year-min 2020 --year-max 2023
 *   npm run map:baby-names:fr-insee-to-canonical -- --in … --out …
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

type Delim = ',' | ';';

function stripBom(s: string): string {
  return s.charCodeAt(0) === 0xfeff ? s.slice(1) : s;
}

function normalizeHeader(s: string): string {
  return stripBom(s)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

/** French / INSEE-style numeric strings (e.g. 1 234 or 1.234,5). */
function parseNumberField(raw: string): number {
  const t = String(raw ?? '')
    .trim()
    .replace(/\s/g, '');
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

const HEADER_SCAN_MAX_LINES = 50;

function classifyHeader(cell: string): 'year' | 'name' | 'sex' | 'count' | null {
  const n = normalizeHeader(cell);
  if (n === 'annais' || n === 'annee' || n === 'annees' || n === 'year') return 'year';
  if (n === 'preusuel' || n === 'prenom' || n === 'prenoms' || n === 'name') return 'name';
  if (n === 'sexe' || n === 'sex') return 'sex';
  if (n === 'nombre' || n === 'valeur' || n === 'count' || n === 'effectif' || n === 'nb') return 'count';
  return null;
}

const ROLE_KEYS = ['year', 'name', 'sex', 'count'] as const;

function missingColumnLabels(
  roles: ReturnType<typeof classifyHeader>[],
): (typeof ROLE_KEYS)[number][] {
  const have = new Set(roles.filter((r): r is (typeof ROLE_KEYS)[number] => r !== null));
  return [...ROLE_KEYS].filter((k) => !have.has(k));
}

function findDataHeader(
  lines: string[],
  maxScan: number,
): { ok: true; h: ResolvedHeader; lineIndex: number } | { ok: false; detail: string } {
  const n = Math.min(maxScan, lines.length);
  let bestMissing: (typeof ROLE_KEYS)[number][] = [...ROLE_KEYS];
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
      `No data header in the first ${n} line(s) with INSEE-style columns (annais, preusuel, sexe, nombre/valeur).\n` +
      `Preview:\n${preview.join('\n')}\n` +
      `Still missing: ${bestMissing.join(', ')}. Closest header row: ${bestLineForError}\n` +
      'Extend `classifyHeader` in this script if your extract uses other titles.',
  };
}

type ResolvedHeader = {
  delim: Delim;
  yearIdx: number;
  nameIdx: number;
  sexIdx: number;
  countIdx: number;
};

/** INSEE: 1 = garçon, 2 = fille (documentation INSEE). */
function mapInseeSexToMF(raw: string): 'M' | 'F' | null {
  const t = normalizeHeader(raw).replace(/_/g, ' ').trim();
  if (!t || t === '9' || t === '0') return null;
  if (['1', 'm', 'male', 'boy', 'h', 'homme', 'masculin', 'garcon', 'garçon'].includes(t)) return 'M';
  if (['2', 'f', 'female', 'girl', 'femme', 'feminin', 'féminin', 'fille'].includes(t)) return 'F';
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
    countryIdx >= 0 && argv[countryIdx + 1] ? String(argv[countryIdx + 1]).trim() : 'France';
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

type OutRow = { year: number; name: string; sex: 'M' | 'F'; count: number };

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

  const raw = stripBom(readFileSync(absIn, 'utf8'));
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) throw new Error('Input CSV must have a header and at least one data row');

  const found = findDataHeader(lines, HEADER_SCAN_MAX_LINES);
  if (!found.ok) {
    throw new Error(found.detail);
  }
  const { delim, yearIdx, nameIdx, sexIdx, countIdx } = found.h;
  const headerLineIndex = found.lineIndex;

  const outRows: OutRow[] = [];
  let skipped = 0;
  for (let i = headerLineIndex + 1; i < lines.length; i++) {
    if (lines[i].startsWith('#')) continue;
    const cols = parseCsvLine(lines[i], delim);
    const year = Math.round(parseNumberField(cols[yearIdx] ?? ''));
    const nameRaw = String(cols[nameIdx] ?? '').trim();
    const name = nameRaw.normalize('NFC').replace(/\s+/g, ' ').trim();
    const sex = mapInseeSexToMF(String(cols[sexIdx] ?? ''));
    const count = Math.round(parseNumberField(cols[countIdx] ?? ''));
    if (!Number.isFinite(year) || year < 1800 || year > 2100) {
      skipped += 1;
      continue;
    }
    if (cli.yearMin !== null && year < cli.yearMin) continue;
    if (cli.yearMax !== null && year > cli.yearMax) continue;
    if (!name || name.startsWith('_')) {
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
      (skipped > 0 ? ` (skipped ${skipped} aggregate / non-parseable rows)` : ''),
  );
  console.log(
    'Next: tsx scripts/adaptEuNationalCsvToJsonl.ts --in <this file> --out scripts/data/batches/external-eu-fr-insee-real-<year>.v1.jsonl --slug eu-fr --top-per-year-sex 1200',
  );
}

main();
