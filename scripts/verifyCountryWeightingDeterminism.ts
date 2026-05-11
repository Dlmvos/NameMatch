/**
 * Quick check: same roomId + inputs ⇒ identical pools between runs (seeded shuffle).
 *
 * Run: npx tsx scripts/verifyCountryWeightingDeterminism.ts
 */
import { countryWeightingService } from '../src/services/CountryWeightingService';
import { CORE_BUNDLED_NAMES } from '../src/data/names';
import type { Region } from '../src/types';

const roomId = 'verify-determinism-room';
const region: Region = 'EU';

const ids = (names: { id: string }[]) => names.map((n) => n.id);

const freeA = countryWeightingService.getFreeTierCountryFirstPool(
  CORE_BUNDLED_NAMES,
  region,
  'Netherlands',
  'both',
  roomId,
);
const freeB = countryWeightingService.getFreeTierCountryFirstPool(
  CORE_BUNDLED_NAMES,
  region,
  'Netherlands',
  'both',
  roomId,
);
if (JSON.stringify(ids(freeA)) !== JSON.stringify(ids(freeB))) {
  console.error('FAIL: getFreeTierCountryFirstPool returned different id order');
  process.exit(1);
}

const wA = countryWeightingService.getWeightedPool(
  CORE_BUNDLED_NAMES,
  region,
  'Netherlands',
  'both',
  0,
  [],
  roomId,
);
const wB = countryWeightingService.getWeightedPool(
  CORE_BUNDLED_NAMES,
  region,
  'Netherlands',
  'both',
  0,
  [],
  roomId,
);
if (JSON.stringify(ids(wA)) !== JSON.stringify(ids(wB))) {
  console.error('FAIL: getWeightedPool returned different id order');
  process.exit(1);
}

console.log('OK: CountryWeightingService pools match for duplicate calls (roomId=%s)', roomId);
