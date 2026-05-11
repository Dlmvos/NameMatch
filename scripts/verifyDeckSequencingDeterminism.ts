/**
 * Determinism check for deck sequencing (room-seeded).
 * Run: npx esbuild scripts/verifyDeckSequencingDeterminism.ts --bundle --platform=node --packages=external --outfile=/tmp/vds.js && node /tmp/vds.js
 */
import { sequenceSwipeDeck } from '../src/lib/deckSequencing';
import { CORE_BUNDLED_NAMES } from '../src/data/names';
import type { Region } from '../src/types';

const roomId = 'verify-seq-room';
const subset = CORE_BUNDLED_NAMES.filter((n) => n.region === 'EU').slice(0, 80);

const ctx = {
  roomId,
  countryPreference: 'Netherlands',
  region: 'EU' as Region,
  sessionSwipeDepth: 3,
  learningProfile: null,
  recentLiked: [] as typeof subset,
};

const a = sequenceSwipeDeck(subset, ctx).map((n) => n.id);
const b = sequenceSwipeDeck(subset, ctx).map((n) => n.id);
if (JSON.stringify(a) !== JSON.stringify(b)) {
  console.error('FAIL: sequencing not deterministic');
  process.exit(1);
}
console.log('OK: deck sequencing deterministic');
