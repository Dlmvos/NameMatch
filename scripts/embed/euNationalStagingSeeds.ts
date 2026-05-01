/**
 * Curated EU national-style rows for offline batch builds (no full government extracts in git).
 * Name pools: country-flavored prefixes in `euNationalStagingPools.json`, uniqueness tail-filled
 * from the developer machine dictionary when that JSON was generated (see repo history).
 * Counts are synthetic but monotonic within each (year, sex) so adapter ranks behave like ordering.
 * For production-scale extracts, preprocess official CSV to canonical columns and run
 * `adaptEuNationalCsvToJsonl.ts` (see `scripts/data/MARKET_COVERAGE_ROADMAP.md`).
 */
import pools from './euNationalStagingPools.json';

export type EuNationalSeedRow = {
  year: number;
  name: string;
  sex: 'M' | 'F';
  count: number;
  country: string;
};

type PoolsFile = {
  nl: { boys: string[]; girls: string[] };
  de: { boys: string[]; girls: string[] };
  es: { boys: string[]; girls: string[] };
  fr: { boys: string[]; girls: string[] };
  it: { boys: string[]; girls: string[] };
  pt: { boys: string[]; girls: string[] };
};

const POOLS = pools as PoolsFile;

const YEARS = [2019, 2020, 2021, 2022, 2023] as const;
/** 5 years × 2 sexes × 100 = 1000 rows per market. */
const TAKE = 100;
const BOY_OFFSETS = [0, 20, 40, 60, 80] as const;
const GIRL_OFFSETS = [0, 20, 40, 60, 80] as const;
const COUNT_STARTS = [6800, 7000, 7200, 7400, 7600] as const;
const COUNT_STEP = 11;

function rowsForCountry(
  country: string,
  boys: string[],
  girls: string[],
): EuNationalSeedRow[] {
  const need = BOY_OFFSETS[BOY_OFFSETS.length - 1] + TAKE;
  if (boys.length < need || girls.length < need) {
    throw new Error(`${country}: name pools must have at least ${need} entries`);
  }
  const rows: EuNationalSeedRow[] = [];
  for (let i = 0; i < YEARS.length; i++) {
    const year = YEARS[i];
    const bo = BOY_OFFSETS[i];
    const go = GIRL_OFFSETS[i];
    const start = COUNT_STARTS[i];
    let c = start;
    for (const name of boys.slice(bo, bo + TAKE)) {
      rows.push({ year, name, sex: 'M', count: c, country });
      c -= COUNT_STEP;
    }
    c = start;
    for (const name of girls.slice(go, go + TAKE)) {
      rows.push({ year, name, sex: 'F', count: c, country });
      c -= COUNT_STEP;
    }
  }
  return rows;
}

export const EU_NL_CBS_V1_ROWS = rowsForCountry(
  'Netherlands',
  POOLS.nl.boys,
  POOLS.nl.girls,
);

export const EU_DE_DESTATIS_V1_ROWS = rowsForCountry('Germany', POOLS.de.boys, POOLS.de.girls);

export const EU_ES_INE_V1_ROWS = rowsForCountry('Spain', POOLS.es.boys, POOLS.es.girls);

export const EU_FR_INSEE_V1_ROWS = rowsForCountry('France', POOLS.fr.boys, POOLS.fr.girls);

export const EU_IT_ISTAT_V1_ROWS = rowsForCountry('Italy', POOLS.it.boys, POOLS.it.girls);

export const EU_PT_INE_V1_ROWS = rowsForCountry('Portugal', POOLS.pt.boys, POOLS.pt.girls);
