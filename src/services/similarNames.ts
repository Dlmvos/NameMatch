// ============================================================
// NameMatch – Similar Names Service
// Heuristic similarity: shared origin, shared starting letter,
// similar length, or pre-defined similar_names enrichment data.
// ============================================================

import { BabyName, GenderPreference } from '../types';
import { enrichName } from './nameEnrichment';

export function getSimilarNames(
  target: BabyName,
  pool: BabyName[],
  limit = 4
): BabyName[] {
  // 1. Check enrichment data first (curated)
  const enrichment = enrichName(target.name);
  if (enrichment.similar_names && enrichment.similar_names.length > 0) {
    const curatedMatches = pool
      .filter((n) =>
        n.id !== target.id &&
        enrichment.similar_names!.some(
          (sn) => sn.toLowerCase() === n.name.toLowerCase()
        )
      )
      .slice(0, limit);
    if (curatedMatches.length >= 2) return curatedMatches;
  }

  // 2. Heuristic scoring
  const scored = pool
    .filter((n) => n.id !== target.id && n.gender === target.gender)
    .map((n) => ({ name: n, score: similarity(target, n) }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((s) => s.name);
}

function similarity(a: BabyName, b: BabyName): number {
  let score = 0;

  // Same origin (partial match)
  const aOriginWords = a.origin.toLowerCase().split(/[\s/,]+/);
  const bOriginWords = b.origin.toLowerCase().split(/[\s/,]+/);
  const sharedOrigin = aOriginWords.some((w) => w.length > 2 && bOriginWords.includes(w));
  if (sharedOrigin) score += 3;

  // Same starting letter
  if (a.name[0]?.toLowerCase() === b.name[0]?.toLowerCase()) score += 2;

  // Similar length (within 2 characters)
  if (Math.abs(a.name.length - b.name.length) <= 2) score += 1;

  // Same ending (last 2 chars)
  if (
    a.name.length >= 3 &&
    b.name.length >= 3 &&
    a.name.slice(-2).toLowerCase() === b.name.slice(-2).toLowerCase()
  ) {
    score += 2;
  }

  // Same region
  if (a.region === b.region) score += 1;

  return score;
}
