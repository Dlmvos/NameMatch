/**
 * Validate `country` labels in baby-name import JSONL or canonical CSV files.
 *
 * Usage:
 *   npm run validate:import-country-labels -- scripts/data/import.example.jsonl
 *   npm run validate:import-country-labels -- scripts/data/raw/eu-fr-sample.csv
 *   tsx scripts/validateImportCountryLabels.ts --format csv path/to/file.csv
 *
 * Fails (exit 1) on unknown labels, whitespace padding, localized names, or aliases
 * such as NL / US / United States instead of canonical COUNTRY_OPTIONS.name values.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { parseJsonlLine, type BulkImportSourceRow } from './lib/bulkBabyNameImport';
import {
  CANONICAL_COUNTRY_NAMES,
  formatCountryLabelIssue,
  validateCountryLabels,
  type CountryLabelRowRef,
} from './lib/countryLabelValidation';

type InputFormat = 'jsonl' | 'csv' | 'auto';

function parseFormatArg(argv: string[]): InputFormat {
  const i = argv.indexOf('--format');
  if (i < 0 || !argv[i + 1]) return 'auto';
  const raw = argv[i + 1].trim().toLowerCase();
  if (raw === 'jsonl' || raw === 'csv' || raw === 'auto') return raw;
  throw new Error(`Invalid --format "${argv[i + 1]}" (use jsonl, csv, or auto)`);
}

function detectFormat(filePath: string, explicit: InputFormat): 'jsonl' | 'csv' {
  if (explicit !== 'auto') return explicit;
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.csv') return 'csv';
  if (ext === '.jsonl' || ext === '.json') return 'jsonl';
  throw new Error(`Cannot infer format for "${filePath}" — pass --format jsonl or csv`);
}

/** CSV parser that preserves raw cell text (no trim). */
function parseCsvLineRaw(line: string): string[] {
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
  return out;
}

function extractFromJsonl(content: string, filePath: string): CountryLabelRowRef[] {
  const lines = content.split(/\r?\n/);
  const rows: CountryLabelRowRef[] = [];

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    let parsed: BulkImportSourceRow | null;
    try {
      parsed = parseJsonlLine(lines[i], lineNum);
    } catch (err) {
      throw new Error(
        `${filePath}:${lineNum}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
    if (!parsed) continue;
    if (!Object.prototype.hasOwnProperty.call(parsed, 'country')) continue;
    rows.push({ line: lineNum, field: 'country', raw: parsed.country });
  }

  return rows;
}

function extractFromCsv(content: string, filePath: string): CountryLabelRowRef[] {
  const physicalLines = content.split(/\r?\n/);
  const nonEmpty = physicalLines
    .map((line, index) => ({ line: index + 1, text: line }))
    .filter(({ text }) => text.trim().length > 0 && !text.trim().startsWith('#'));

  if (nonEmpty.length === 0) return [];

  const headerCells = parseCsvLineRaw(nonEmpty[0].text);
  const header = headerCells.map((h) => h.trim().toLowerCase());
  const countryIdx = header.indexOf('country');
  if (countryIdx < 0) {
    throw new Error(`${filePath}: CSV header must include a "country" column`);
  }

  const rows: CountryLabelRowRef[] = [];
  for (let i = 1; i < nonEmpty.length; i++) {
    const { line, text } = nonEmpty[i];
    const cells = parseCsvLineRaw(text);
    if (cells.every((c) => c.trim() === '')) continue;
    rows.push({
      line,
      field: 'country',
      raw: cells[countryIdx] ?? '',
    });
  }
  return rows;
}

function main(): void {
  const argv = process.argv.slice(2);
  const formatArg = parseFormatArg(argv);
  const files = argv.filter((a, idx, all) => {
    if (a === '--format') return false;
    if (idx > 0 && all[idx - 1] === '--format') return false;
    return true;
  });

  if (files.length === 0) {
    console.error(
      'Usage: tsx scripts/validateImportCountryLabels.ts [--format jsonl|csv|auto] <file...>',
    );
    process.exit(1);
  }

  console.log(`Canonical countries (${CANONICAL_COUNTRY_NAMES.size}): COUNTRY_OPTIONS.name`);

  let totalRows = 0;
  let totalIssues = 0;

  for (const file of files) {
    const resolved = path.isAbsolute(file) ? file : path.join(process.cwd(), file);
    const format = detectFormat(resolved, formatArg);
    const content = readFileSync(resolved, 'utf8');
    const refs =
      format === 'jsonl' ? extractFromJsonl(content, resolved) : extractFromCsv(content, resolved);
    const issues = validateCountryLabels(refs);

    totalRows += refs.length;
    totalIssues += issues.length;

    const withCountry = refs.filter((r) => r.raw !== null && r.raw !== undefined && String(r.raw).trim() !== '').length;
    console.log(
      `\n${resolved} (${format}): ${refs.length} row(s) with country field, ${withCountry} non-empty`,
    );

    if (issues.length === 0) {
      console.log('  OK — all country labels are canonical');
      continue;
    }

    console.error(`  ${issues.length} issue(s):`);
    for (const issue of issues) {
      console.error(`  - ${formatCountryLabelIssue(issue)}`);
    }
  }

  console.log(`\nChecked ${totalRows} country field(s) across ${files.length} file(s).`);
  if (totalIssues > 0) {
    console.error(`Failed: ${totalIssues} invalid country label(s).`);
    process.exit(1);
  }
  console.log('All country labels valid.');
}

main();
