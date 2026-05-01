/**
 * Spain MNP-style birth microdata (tab-separated) → canonical CSV for `adaptEuNationalCsvToJsonl.ts`.
 *
 * Expected: one row per birth; columns include given name (text) and sex.
 * Default columns (INE-style headers): name `NACVN` or `V24HN`, sex `SEXO`.
 *
 * Note: Common public MNP birth microdata drops are **coded / anonymized** (no literal given names) and are
 * **not** Spain’s broad real name source in that form. The script samples rows and errors if names look numeric-only;
 * use INE name tables / workbook extract, or a licensed extract with **name text**.
 *
 * Usage:
 *   tsx scripts/extractSpainMnpBirthNames.ts --in "scripts/data/raw/downloads/Names Spain 2024 full set" \
 *     --out scripts/data/raw/eu-es-mnp-2024.canonical.csv --year 2024
 *
 * Optional: `--name-col NOMBRE` `--sex-col SEXO` (exact header match after trim).
 */
import { createInterface } from 'node:readline';
import { createReadStream } from 'node:fs';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

type Cli = {
  inputPath: string;
  outputPath: string;
  year: number;
  country: string;
  nameCol: string | null;
  sexCol: string | null;
};

function parseArgs(argv: string[]): Cli {
  const inIdx = argv.indexOf('--in');
  const outIdx = argv.indexOf('--out');
  const yearIdx = argv.indexOf('--year');
  if (inIdx < 0 || !argv[inIdx + 1]) throw new Error('Missing --in <path.tsv>');
  if (outIdx < 0 || !argv[outIdx + 1]) throw new Error('Missing --out <path.csv>');
  if (yearIdx < 0 || !argv[yearIdx + 1]) throw new Error('Missing --year YYYY');
  const y = Number(argv[yearIdx + 1]);
  if (!Number.isInteger(y) || y < 1990 || y > 2100) throw new Error('--year must be a plausible year (1990–2100)');
  const countryIdx = argv.indexOf('--country');
  const country =
    countryIdx >= 0 && argv[countryIdx + 1] ? String(argv[countryIdx + 1]).trim() : 'Spain';
  const nc = argv.indexOf('--name-col');
  const nameCol = nc >= 0 && argv[nc + 1] && !String(argv[nc + 1]).startsWith('--')
    ? String(argv[nc + 1]).trim()
    : null;
  const sc = argv.indexOf('--sex-col');
  const sexCol = sc >= 0 && argv[sc + 1] && !String(argv[sc + 1]).startsWith('--')
    ? String(argv[sc + 1]).trim()
    : null;
  return { inputPath: argv[inIdx + 1], outputPath: argv[outIdx + 1], year: y, country, nameCol, sexCol };
}

function stripAccents(s: string): string {
  return s.normalize('NFD').replace(/\p{M}/gu, '');
}

/** Parse one TSV row respecting quoted fields (header row); unquoted numeric rows also work. */
function parseTsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let i = 0;
  while (i < line.length) {
    const c = line[i];
    if (c === '"') {
      i++;
      while (i < line.length) {
        if (line[i] === '"') {
          if (line[i + 1] === '"') {
            cur += '"';
            i += 2;
            continue;
          }
          i++;
          break;
        }
        cur += line[i];
        i++;
      }
      continue;
    }
    if (c === '\t') {
      out.push(cur.trim());
      cur = '';
      i++;
      continue;
    }
    cur += c;
    i++;
  }
  out.push(cur.trim());
  return out;
}

function stripBom(s: string): string {
  return s.charCodeAt(0) === 0xfeff ? s.slice(1) : s;
}

const DEFAULT_NAME_HEADERS = ['NACVN', 'V24HN', 'NOMBRE', 'NOMNAC', 'NOMBREN', 'NOMBRE_NACIDO', 'NAME', 'FIRST_NAME'];

function resolveHeaderIndex(header: string[], want: string): number {
  const t = want.trim();
  const up = t.toUpperCase();
  for (let i = 0; i < header.length; i++) {
    const h = header[i].replace(/^"|"$/g, '').trim();
    if (h === t || h.toUpperCase() === up) return i;
  }
  return -1;
}

function pickNameColumn(header: string[], explicit: string | null): number {
  if (explicit) {
    const i = resolveHeaderIndex(header, explicit);
    if (i < 0) throw new Error(`--name-col "${explicit}" not found in header. Columns: ${header.slice(0, 20).join(', ')}…`);
    return i;
  }
  for (const cand of DEFAULT_NAME_HEADERS) {
    const i = resolveHeaderIndex(header, cand);
    if (i >= 0) return i;
  }
  throw new Error(
    `Could not find a name column (tried ${DEFAULT_NAME_HEADERS.join(', ')}). Pass --name-col <HEADER>.`,
  );
}

function pickSexColumn(header: string[], explicit: string | null): number {
  if (explicit) {
    const i = resolveHeaderIndex(header, explicit);
    if (i < 0) throw new Error(`--sex-col "${explicit}" not found in header.`);
    return i;
  }
  for (const cand of ['SEXO', 'SEX', 'GENDER']) {
    const i = resolveHeaderIndex(header, cand);
    if (i >= 0) return i;
  }
  throw new Error('Could not find sex column (tried SEXO, SEX, GENDER). Pass --sex-col <HEADER>.');
}

/**
 * Spain MNP / INE-style sex codes:
 * -1 / H / V / Hombre / Varón → M
 * - 6 / 2 / M (Mujer) / F / Mujer → F
 */
function mapMicroSex(raw: string): 'M' | 'F' | null {
  const u = stripAccents(String(raw ?? '').trim()).toUpperCase();
  if (!u) return null;
  if (
    u === 'MASCULINO' ||
    u === 'HOMBRE' ||
    u === 'VARON' ||
    u === 'MALE' ||
    u === 'V' ||
    u === 'H' ||
    u === '1'
  ) {
    return 'M';
  }
  if (u === 'FEMENINO' || u === 'MUJER' || u === 'FEMALE' || u === 'F' || u === '2' || u === '6') {
    return 'F';
  }
  if (u === 'M') return 'F';
  return null;
}

function normalizeNameText(raw: string): string {
  let s = String(raw ?? '').trim().replace(/^"|"$/g, '');
  s = s.normalize('NFC').replace(/\s+/g, ' ').trim();
  return s;
}

function aggKey(sex: 'M' | 'F', nameNorm: string): string {
  return `${sex}\0${nameNorm}`;
}

function nameLooksLikeTextualGivenName(s: string): boolean {
  if (s.length < 2) return false;
  if (/^\d+$/.test(s)) return false;
  return /\p{L}/u.test(s);
}

function normalizeForGroupKey(display: string): string {
  return stripAccents(display).toLowerCase().trim();
}

function escapeCsv(name: string): string {
  if (/[",\n]/.test(name)) return `"${name.replace(/"/g, '""')}"`;
  return name;
}

const SAMPLE_VALIDATE = 15_000;
const MIN_TEXT_NAME_RATE = 0.001;

async function main(): Promise<void> {
  const cli = parseArgs(process.argv.slice(2));
  const absIn = path.isAbsolute(cli.inputPath)
    ? cli.inputPath
    : path.join(process.cwd(), cli.inputPath);
  const absOut = path.isAbsolute(cli.outputPath)
    ? cli.outputPath
    : path.join(process.cwd(), cli.outputPath);

  const rl = createInterface({
    input: createReadStream(absIn, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });

  let lineNo = 0;
  let header: string[] | null = null;
  let nameIdx = -1;
  let sexIdx = -1;

  const counts = new Map<string, { display: string; sex: 'M' | 'F'; count: number }>();
  let rowsRead = 0;
  let rowsSkippedSex = 0;
  let sampleRows = 0;
  let sampleTextNames = 0;
  let validationDone = false;

  for await (const rawLine of rl) {
    lineNo++;
    const line = stripBom(rawLine);
    if (!line.trim()) continue;

    if (!header) {
      header = parseTsvLine(line);
      nameIdx = pickNameColumn(header, cli.nameCol);
      sexIdx = pickSexColumn(header, cli.sexCol);
      continue;
    }

    const row = parseTsvLine(line);
    if (row.length < Math.max(nameIdx, sexIdx) + 1) {
      rowsSkippedSex++;
      continue;
    }

    const nameRaw = normalizeNameText(row[nameIdx] ?? '');
    const sexRaw = row[sexIdx] ?? '';
    const sex = mapMicroSex(sexRaw);
    if (!sex || !nameRaw) {
      rowsSkippedSex++;
      continue;
    }

    if (!validationDone) {
      sampleRows++;
      if (nameLooksLikeTextualGivenName(nameRaw)) sampleTextNames++;
      if (sampleRows >= SAMPLE_VALIDATE) {
        validationDone = true;
        const rate = sampleTextNames / sampleRows;
        if (rate < MIN_TEXT_NAME_RATE) {
          throw new Error(
            `[extractSpainMnpBirthNames] Name column "${header[nameIdx]}" looks numeric/code-only in the first ${sampleRows} rows ` +
              `(text-like name rate ${(rate * 100).toFixed(3)}%). Public MNP microdata often omits literal given names.\n` +
              `Use an extract that includes name text, or INE name-frequency tables / scripts/extractIneSpainWorkbookToCanonicalCsv.ts.\n` +
              `If your file uses a different header, pass --name-col / --sex-col.`,
          );
        }
      }
    }

    rowsRead++;
    const nk = normalizeForGroupKey(nameRaw);
    if (!nk) {
      rowsSkippedSex++;
      continue;
    }
    const k = aggKey(sex, nk);
    const ex = counts.get(k);
    if (!ex) counts.set(k, { display: nameRaw, sex, count: 1 });
    else {
      ex.count += 1;
    }
  }

  if (!header) throw new Error('Empty file or no header row.');

  if (!validationDone && sampleRows > 0) {
    const rate = sampleTextNames / sampleRows;
    if (rate < MIN_TEXT_NAME_RATE) {
      throw new Error(
        `[extractSpainMnpBirthNames] Name column "${header[nameIdx]}" looks numeric/code-only (text-like rate ${(rate * 100).toFixed(3)}% over ${sampleRows} rows).`,
      );
    }
  }

  const headerCsv = 'year,name,sex,count,country';
  const lines: string[] = [headerCsv];
  const sorted = [...counts.entries()].sort((a, b) => {
    const A = a[1];
    const B = b[1];
    if (A.sex !== B.sex) return A.sex.localeCompare(B.sex);
    return normalizeForGroupKey(A.display).localeCompare(normalizeForGroupKey(B.display));
  });
  for (const [, v] of sorted) {
    lines.push(`${cli.year},${escapeCsv(v.display)},${v.sex},${v.count},${escapeCsv(cli.country)}`);
  }

  mkdirSync(path.dirname(absOut), { recursive: true });
  writeFileSync(absOut, `${lines.join('\n')}\n`, 'utf8');

  const m = [...counts.values()].filter((x) => x.sex === 'M').length;
  const f = [...counts.values()].filter((x) => x.sex === 'F').length;
  console.log(
    `[es-mnp] rows used: ${rowsRead}; skipped (empty/unknown sex/short name): ${rowsSkippedSex}; unique names: M=${m}, F=${f}; wrote ${lines.length - 1} CSV rows → ${cli.outputPath}`,
  );
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
