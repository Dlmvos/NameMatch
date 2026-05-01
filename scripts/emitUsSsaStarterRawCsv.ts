/**
 * Writes curated SSA-style CSV from `scripts/embed/usSsaStarterSeed.ts`.
 * Keeps a controlled raw slice in-repo without committing national dumps.
 *
 *   tsx scripts/emitUsSsaStarterRawCsv.ts
 *   tsx scripts/emitUsSsaStarterRawCsv.ts --out scripts/data/raw/us-ssa-starter-v1.csv
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { US_SSA_STARTER_SEED_ROWS } from './embed/usSsaStarterSeed';

const DEFAULT_OUT = 'scripts/data/raw/us-ssa-starter-v1.csv';

function parseArgs(argv: string[]): { out: string } {
  const outIdx = argv.indexOf('--out');
  const out = outIdx >= 0 && argv[outIdx + 1] ? argv[outIdx + 1] : DEFAULT_OUT;
  return { out };
}

function main(): void {
  const { out } = parseArgs(process.argv.slice(2));
  const absOut = path.isAbsolute(out) ? out : path.join(process.cwd(), out);
  const header = 'year,name,sex,count';
  const body = US_SSA_STARTER_SEED_ROWS.map((r) => `${r.year},${r.name},${r.sex},${r.count}`).join('\n');
  mkdirSync(path.dirname(absOut), { recursive: true });
  writeFileSync(absOut, `${header}\n${body}\n`, 'utf8');
  console.log(`Wrote ${US_SSA_STARTER_SEED_ROWS.length} data rows -> ${out}`);
}

main();
