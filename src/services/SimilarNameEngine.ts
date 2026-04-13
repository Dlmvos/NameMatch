// ============================================================
// NameMatch – SimilarNameEngine
//
// Hybrid similarity engine combining:
//   1. Curated data  — enrichName().similar_names (exact matches)
//   2. DNA signals   — existing dna/nameSimilarity.ts (14 features)
//   3. Phonetic key  — Soundex grouping (same code = high similarity)
//   4. Origin        — shared cultural origin bonus
//   5. Popularity    — names in the same rank neighborhood
//
// Returns ranked similar names with a similarity score (0-1).
// Used by SwipeCard "You might also like" and NameRecommendationService.
// ============================================================

import { enrichName } from './nameEnrichment';
import { soundex } from './nameTypes';
import { scoreNameSimilarity, type ComparableName } from '../dna/nameSimilarity';
import type { NormalizedNameRecord } from './nameTypes';

export interface SimilarNameResult {
  record: NormalizedNameRecord;
  score: number;           // 0.0 – 1.0
  signals: string[];       // human-readable reasons: ['same origin', 'similar sound', ...]
}

const MAX_CANDIDATES = 200; // scan at most this many from pool to limit CPU
const MIN_SCORE = 0.25;     // discard very dissimilar names

/** Convert NormalizedNameRecord to ComparableName for scoreNameSimilarity */
function toComparable(r: NormalizedNameRecord): ComparableName {
  return {
    id: r.id,
    name: r.displayName || r.name,
    origin: r.origin,
    gender: r.gender,
    style_tags: r.style_tags,
    popularity_score: r.popularityScore ?? r.popularity_score,
  };
}

export class SimilarNameEngine {
  // ──────────────────────────────────────────────────────────
  // findSimilar
  // ──────────────────────────────────────────────────────────

  /**
   * Find `limit` names from `pool` most similar to `target`.
   * Excludes `target` itself from results.
   */
  findSimilar(
    target: NormalizedNameRecord,
    pool: NormalizedNameRecord[],
    limit = 4,
  ): SimilarNameResult[] {
    const targetName = target.displayName || target.name;
    const enriched = enrichName(targetName);

    // 1. Curated hits — always include, highest confidence
    const curatedNames = new Set<string>(
      (enriched.similar_names ?? []).map((n) => n.toLowerCase()),
    );

    // 2. Pre-compute target comparable form once
    const targetComparable = toComparable(target);
    const targetPhonetic = target.phoneticKey ?? soundex(target.normalizedName || targetName.toLowerCase());

    // Filter + score candidates
    const candidates = pool
      .filter((r) => (r.displayName || r.name).toLowerCase() !== targetName.toLowerCase())
      .slice(0, MAX_CANDIDATES);

    const scored: SimilarNameResult[] = candidates.map((candidate) => {
      return this._scoreCandidate(
        target,
        candidate,
        curatedNames,
        targetComparable,
        targetPhonetic,
      );
    });

    // Sort descending, filter low scores, return top N
    return scored
      .filter((r) => r.score >= MIN_SCORE || curatedNames.has((r.record.displayName || r.record.name).toLowerCase()))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  // ──────────────────────────────────────────────────────────
  // findSimilarById
  // ──────────────────────────────────────────────────────────

  /**
   * Convenience: find similar names given only the target ID.
   */
  findSimilarById(
    targetId: string,
    pool: NormalizedNameRecord[],
    limit = 4,
  ): SimilarNameResult[] {
    const target = pool.find((r) => r.id === targetId);
    if (!target) return [];
    return this.findSimilar(target, pool, limit);
  }

  // ──────────────────────────────────────────────────────────
  // Private
  // ──────────────────────────────────────────────────────────

  private _scoreCandidate(
    target: NormalizedNameRecord,
    candidate: NormalizedNameRecord,
    curatedNames: Set<string>,
    targetComparable: ComparableName,
    targetPhonetic: string,
  ): SimilarNameResult {
    const candidateName = candidate.displayName || candidate.name;
    const signals: string[] = [];
    let score = 0;

    // ── Signal 1: Curated match (+0.5) ───────────────────────
    if (curatedNames.has(candidateName.toLowerCase())) {
      score += 0.50;
      signals.push('curated match');
    }

    // ── Signal 2: Phonetic key match (+0.30) ─────────────────
    const candidatePhonetic = candidate.phoneticKey ?? soundex(candidate.normalizedName || candidateName.toLowerCase());
    if (targetPhonetic === candidatePhonetic && targetPhonetic !== '0000') {
      score += 0.30;
      signals.push('similar sound');
    }

    // ── Signal 3: DNA similarity via scoreNameSimilarity (0-0.25) ─
    try {
      const candidateComparable = toComparable(candidate);
      // scoreNameSimilarity returns 0-1 from DNA + origin + gender + style overlap
      const dnaScore = scoreNameSimilarity(targetComparable, candidateComparable);
      const normalised = Math.min(dnaScore * 0.25, 0.25);
      if (normalised > 0.05) {
        score += normalised;
        signals.push('similar structure');
      }
    } catch {
      // scoreNameSimilarity can throw for edge cases — ignore
    }

    // ── Signal 4: Same origin / culture (+0.15) ──────────────
    if (
      target.origin &&
      candidate.origin &&
      target.origin.toLowerCase() === candidate.origin.toLowerCase()
    ) {
      score += 0.15;
      signals.push('same origin');
    }

    // ── Signal 5: Same gender (+0.05) ────────────────────────
    if (target.gender === candidate.gender || candidate.gender === 'neutral') {
      score += 0.05;
    }

    // ── Signal 6: Popularity neighbourhood (±30 ranks) (+0.05)
    if (target.popularityRank && candidate.popularityRank) {
      const diff = Math.abs(target.popularityRank - candidate.popularityRank);
      if (diff <= 30) {
        score += 0.05;
        signals.push('similar popularity');
      }
    }

    // ── Signal 7: Shared style tags (+0.05 per shared tag, max 0.10)
    const targetTags = new Set(target.style_tags ?? []);
    const sharedTags = (candidate.style_tags ?? []).filter((t) => targetTags.has(t));
    if (sharedTags.length > 0) {
      score += Math.min(sharedTags.length * 0.05, 0.10);
      signals.push('similar style');
    }

    return {
      record: candidate,
      score: Math.min(score, 1.0),
      signals,
    };
  }
}

/** Singleton */
export const similarNameEngine = new SimilarNameEngine();
