/**
 * Builds the first larger real external JSONL batch from a local SSA `yobYYYY.txt` (not committed).
 *
 * Prereq: place `yobYYYY.txt` from SSA `names.zip` under `scripts/data/raw/downloads/` (gitignored).
 *
 * Defaults (dev/staging — low thousands, not national dumps):
 *   year 2023, top 1200 per sex → up to 2400 JSONL rows
 *
 * Usage:
 *   npm run build:baby-names:ssa-yob-staging-v1
 *   tsx scripts/buildSsaYobStagingBatch.ts --year 2022 --top 1000 --out scripts/data/batches/custom.jsonl
 */
import { existsSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const DEFAULT_YEAR = 2023;
/** Per sex (M/F); total rows ≤ 2 × this (deterministic slice of real SSA file). */
const DEFAULT_TOP_PER_SEX = 1200;
const MAX_TOP_PER_SEX = 5000;
const DOWNLOADS_DIR = 'scripts/data/raw/downloads';

function parseArgs(argv: string[]): { year: number; top: number; inputPath: string; outputPath: string } {
  let year = DEFAULT_YEAR;
  let top = DEFAULT_TOP_PER_SEX;
  let inputPath = '';
  let outputPath = '';

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--year' && argv[i + 1]) {
      year = Number(argv[++i]);
    } else if (argv[i] === '--top' && argv[i + 1]) {
      top = Number(argv[++i]);
    } else if (argv[i] === '--in' && argv[i + 1]) {
      inputPath = argv[++i];
    } else if (argv[i] === '--out' && argv[i + 1]) {
      outputPath = argv[++i];
    }
  }

  if (!Number.isInteger(year) || year < 1800 || year > 2100) {
    throw new Error(`Invalid --year: ${year}`);
  }
  if (!Number.isFinite(top) || top < 1 || top > MAX_TOP_PER_SEX) {
    throw new Error(`Invalid --top (use 1..${MAX_TOP_PER_SEX}): ${top}`);
  }

  const defaultIn = path.join(process.cwd(), DOWNLOADS_DIR, `yob${year}.txt`);
  const defaultOut = path.join(
    process.cwd(),
    'scripts/data/batches',
    `external-us-ssa-yob-${year}-top${top}.v1.jsonl`,
  );

  return {
    year,
    top: Math.floor(top),
    inputPath: inputPath || defaultIn,
    outputPath: outputPath || defaultOut,
  };
}

function main(): void {
  const { year, top, inputPath, outputPath } = parseArgs(process.argv.slice(2));
  const absIn = path.isAbsolute(inputPath) ? inputPath : path.join(process.cwd(), inputPath);
  if (!existsSync(absIn)) {
    console.error(
      `Missing SSA national file:\n  ${absIn}\n\n` +
        `Download names.zip from https://www.ssa.gov/oact/babynames/names.zip (SSA), extract yob${year}.txt, ` +
        `and copy it to:\n  ${path.join(process.cwd(), DOWNLOADS_DIR, `yob${year}.txt`)}\n`,
    );
    process.exit(1);
  }

  const adaptScript = path.join(process.cwd(), 'scripts/adaptSsaUsCsvToJsonl.ts');
  const relOut = path.isAbsolute(outputPath) ? outputPath : path.join(process.cwd(), outputPath);
  const relIn = absIn;

  const tsx = spawnSync(
    'npx',
    [
      'tsx',
      adaptScript,
      '--ssa-yob',
      '--year',
      String(year),
      '--top-per-year-sex',
      String(top),
      '--in',
      relIn,
      '--out',
      relOut,
    ],
    { stdio: 'inherit', cwd: process.cwd(), shell: process.platform === 'win32' },
  );

  if (tsx.error || tsx.status !== 0) {
    console.error(tsx.error ?? `Adapter exited with code ${tsx.status ?? 'unknown'}`);
    process.exit(tsx.status ?? 1);
  }
}

main();
