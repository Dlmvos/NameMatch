/**
 * Writes canonical EU national CSVs for `adaptEuNationalCsvToJsonl.ts`.
 *
 *   tsx scripts/emitEuNationalStagingRawCsv.ts
 *   tsx scripts/emitEuNationalStagingRawCsv.ts --market nl
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import {
  EU_DE_DESTATIS_V1_ROWS,
  EU_ES_INE_V1_ROWS,
  EU_FR_INSEE_V1_ROWS,
  EU_IT_ISTAT_V1_ROWS,
  EU_NL_CBS_V1_ROWS,
  EU_PT_INE_V1_ROWS,
  type EuNationalSeedRow,
} from './embed/euNationalStagingSeeds';

const MARKETS = {
  nl: { rows: EU_NL_CBS_V1_ROWS, out: 'scripts/data/raw/eu-nl-cbs.v1.csv' },
  de: { rows: EU_DE_DESTATIS_V1_ROWS, out: 'scripts/data/raw/eu-de-destatis.v1.csv' },
  es: { rows: EU_ES_INE_V1_ROWS, out: 'scripts/data/raw/eu-es-ine.v1.csv' },
  fr: { rows: EU_FR_INSEE_V1_ROWS, out: 'scripts/data/raw/eu-fr-insee.v1.csv' },
  it: { rows: EU_IT_ISTAT_V1_ROWS, out: 'scripts/data/raw/eu-it-istat.v1.csv' },
  pt: { rows: EU_PT_INE_V1_ROWS, out: 'scripts/data/raw/eu-pt-ine.v1.csv' },
} as const;

type MarketKey = keyof typeof MARKETS;

function parseArgs(argv: string[]): { market: MarketKey | 'all' } {
  const mIdx = argv.indexOf('--market');
  if (mIdx >= 0 && argv[mIdx + 1]) {
    const raw = String(argv[mIdx + 1]).trim().toLowerCase();
    if (raw === 'all') return { market: 'all' };
    if (
      raw === 'nl' ||
      raw === 'de' ||
      raw === 'es' ||
      raw === 'fr' ||
      raw === 'it' ||
      raw === 'pt'
    )
      return { market: raw };
    throw new Error(`Unknown --market ${raw} (use nl, de, es, fr, it, pt, all)`);
  }
  return { market: 'all' };
}

function writeCsv(relPath: string, rows: EuNationalSeedRow[]): void {
  const header = 'year,name,sex,count,country';
  const body = rows.map((r) => `${r.year},${r.name},${r.sex},${r.count},${r.country}`)
    .join('\n');
  const absOut = path.isAbsolute(relPath) ? relPath : path.join(process.cwd(), relPath);
  mkdirSync(path.dirname(absOut), { recursive: true });
  writeFileSync(absOut, `${header}\n${body}\n`, 'utf8');
  console.log(`Wrote ${rows.length} rows -> ${relPath}`);
}

function main(): void {
  const { market } = parseArgs(process.argv.slice(2));
  const keys: MarketKey[] =
    market === 'all' ? (['nl', 'de', 'es', 'fr', 'it', 'pt'] as const) : ([market] as MarketKey[]);
  for (const k of keys) {
    const { rows, out } = MARKETS[k];
    writeCsv(out, rows);
  }
}

main();
