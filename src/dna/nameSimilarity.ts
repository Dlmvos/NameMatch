import { buildNameDNA, type NameDNA } from './nameDNA';

export type ComparableName = {
  id: string;
  name: string;
  origin?: string | null;
  gender?: string | null;
  style_tags?: string[] | null;
  popularity_score?: number | null;
};

function overlapScore(a: string[], b: string[]): number {
  if (!a.length || !b.length) return 0;
  const setB = new Set(b);
  const overlap = a.filter((item) => setB.has(item)).length;
  return overlap / Math.max(a.length, b.length);
}

function compareDNA(a: NameDNA, b: NameDNA): number {
  let score = 0;

  if (a.firstLetter === b.firstLetter) score += 0.08;
  if (a.lastLetter === b.lastLetter) score += 0.1;
  if (a.firstTwo === b.firstTwo) score += 0.1;
  if (a.lastTwo === b.lastTwo) score += 0.18;
  if (a.syllableCount === b.syllableCount) score += 0.16;
  if (Math.abs(a.length - b.length) <= 1) score += 0.12;
  if (a.hasSoftEnding === b.hasSoftEnding) score += 0.08;
  if (a.hasVowelEnding === b.hasVowelEnding) score += 0.08;
  if (a.vowelPattern === b.vowelPattern) score += 0.06;
  if (a.consonantPattern === b.consonantPattern) score += 0.04;

  score += overlapScore(a.dnaTags, b.dnaTags) * 0.2;

  return Math.min(score, 1);
}

export function scoreNameSimilarity(a: ComparableName, b: ComparableName): number {
  const dnaA = buildNameDNA(a.name);
  const dnaB = buildNameDNA(b.name);

  let score = compareDNA(dnaA, dnaB);

  if (a.origin && b.origin && a.origin === b.origin) score += 0.12;
  if (a.gender && b.gender && a.gender === b.gender) score += 0.08;

  const styleA = a.style_tags ?? [];
  const styleB = b.style_tags ?? [];
  score += overlapScore(styleA, styleB) * 0.18;

  if (
    typeof a.popularity_score === 'number' &&
    typeof b.popularity_score === 'number'
  ) {
    const diff = Math.abs(a.popularity_score - b.popularity_score);
    if (diff <= 50) score += 0.08;
    else if (diff <= 150) score += 0.04;
  }

  return Math.min(score, 1);
}

export function rankSimilarNames(seed: ComparableName, pool: ComparableName[]): ComparableName[] {
  return [...pool]
    .map((candidate) => ({
      candidate,
      similarity: seed.id === candidate.id ? -1 : scoreNameSimilarity(seed, candidate),
    }))
    .filter((item) => item.similarity >= 0)
    .sort((a, b) => b.similarity - a.similarity)
    .map((item) => item.candidate);
}
