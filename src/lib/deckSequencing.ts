// ============================================================
// Deck sequencing — lightweight pacing & diversification
//
// Why this exists: Pure stableHash ordering sorts cards coherently for partner
// sync, but leaves streaky runs (same letter, region, trend, rarity) that feel
// repetitive and dampen perceived quality.
//
// Why deterministic tie-breaks + room-seeded RNG: Partners should stay aligned
// whenever they share the same candidate pool and swipe history snapshot; any
// randomness uses stableHash(roomId + ':deck-seq') so sessions replay identically.
//
// Why diversity caps: Short streaks read as intentional rhythm; long streaks read
// as a broken or biased deck — soft constraints reduce that without heavy ML.
// ============================================================

import type { BabyName, Region } from '../types';
import type { LearningProfile } from '../services/UserPreferenceLearningService';
import { enrichName, getNameLength } from '../services/nameEnrichment';
import { stableHash } from './stableHash';
import { heuristicSimilarity } from '../services/similarNames';

/** Mulberry32 — same family as CountryWeightingService (cross-client deterministic). */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type ResonanceBucket =
  | 'popular'
  | 'modern'
  | 'soft'
  | 'strong'
  | 'international'
  | 'rare';

export interface DeckSequencingContext {
  roomId: string;
  countryPreference: string | null;
  region: Region;
  /** Total swipes already recorded this session (used to keep early pacing across rebuilds). */
  sessionSwipeDepth: number;
  learningProfile: LearningProfile | null;
  /** Newest likes toward the end — bounded buffer from SwipeDeckContext. */
  recentLiked: BabyName[];
}

function firstLetterKey(name: string): string {
  const ch = name.trim().slice(0, 1);
  return ch ? ch.toLocaleUpperCase() : '?';
}

function trendBucket(n: BabyName): string {
  return (n.trend ?? enrichName(n.name).trend ?? 'unknown') as string;
}

function localeKey(n: BabyName): string {
  const c = (n.country ?? '').trim().toLowerCase();
  if (c) return c;
  const head = n.origin.toLowerCase().split(/[/,]+/)[0]?.trim() ?? '';
  return head.slice(0, 40);
}

function isRareRarity(n: BabyName): boolean {
  const t = n.rarity?.tier ?? 'unknown';
  return t === 'rare' || t === 'very_rare';
}

function matchesSoftShape(nameNorm: string): boolean {
  return /[aeiy]$/i.test(nameNorm) || /(ia|ella|elle|ina|ana|ora|lia|mila|luna)/i.test(nameNorm);
}

function matchesStrongShape(nameNorm: string): boolean {
  return /[bdgkrtxz]$/i.test(nameNorm) || /(max|rex|leo|ax|kai|bram|thijs|mav|rock|wolf)/i.test(nameNorm);
}

export function resonanceBucketOf(n: BabyName): ResonanceBucket {
  const tier = n.rarity?.tier ?? 'unknown';
  if (tier === 'very_rare' || tier === 'rare') return 'rare';
  if (n.is_worldwide || n.region === 'WORLDWIDE') return 'international';
  const rank = n.popularity_rank ?? enrichName(n.name).popularity_rank ?? 999;
  if (rank <= 40 || tier === 'very_common' || tier === 'common') return 'popular';
  const tr = n.trend ?? enrichName(n.name).trend;
  if (tr === 'rising') return 'modern';
  const nm = n.name.trim().toLowerCase();
  if (matchesStrongShape(nm)) return 'strong';
  if (matchesSoftShape(nm)) return 'soft';
  return 'popular';
}

function stableTie(roomId: string, id: string): number {
  return stableHash(`${roomId}:seq-tie:${id}`);
}

function earlyFitScore(n: BabyName, countryPref: string | null, regionPref: Region): number {
  const rank = n.popularity_rank ?? enrichName(n.name).popularity_rank ?? 85;
  let s = ((130 - Math.min(rank, 130)) / 130) * 0.38;
  if (countryPref && n.country === countryPref) s += 0.26;
  else if (n.region === regionPref) s += 0.16;
  const len = getNameLength(n.name);
  s += len === 'short' ? 0.14 : len === 'medium' ? 0.09 : 0.06;
  const e = enrichName(n.name);
  if (e.pronunciation && e.pronunciation.length > 0) s += 0.11;
  else if (/^[a-zA-ZÀ-ÖØ-öø-ÿ\-']+$/.test(n.name.replace(/\s+/g, ''))) s += 0.06;
  return s;
}

function adaptiveBoost(n: BabyName, profile: LearningProfile | null, recentLiked: BabyName[]): number {
  let s = 0;
  if (recentLiked.length > 0) {
    let mx = 0;
    for (const liked of recentLiked) {
      mx = Math.max(mx, heuristicSimilarity(n, liked));
    }
    s += Math.min(mx, 10) * 0.011;
  }
  if (profile) {
    const originKey = (n.origin ?? '').toLowerCase();
    const parts = originKey.split(/[/,]+/).map((p) => p.trim()).filter(Boolean);
    let aff = 0.5;
    for (const p of parts) {
      aff = Math.max(aff, profile.originAffinity[p] ?? profile.originAffinity[originKey] ?? 0.5);
    }
    s += (aff - 0.5) * 0.09;

    const tr = (n.trend ?? enrichName(n.name).trend) as keyof typeof profile.trendAffinity | undefined;
    if (tr && tr in profile.trendAffinity) {
      s += (profile.trendAffinity[tr] - 0.5) * 0.07;
    }
  }
  return s;
}

function violatesStreak(candidate: BabyName, tail: BabyName[]): boolean {
  if (tail.length < 2) return false;

  const letter = firstLetterKey(candidate.name);
  const loc = localeKey(candidate);
  const trend = trendBucket(candidate);
  const resonance = resonanceBucketOf(candidate);
  const rare = isRareRarity(candidate);

  const l1 = firstLetterKey(tail[tail.length - 1].name);
  const l2 = firstLetterKey(tail[tail.length - 2].name);
  const letterViol = l1 === letter && l2 === letter;

  const k1 = localeKey(tail[tail.length - 1]);
  const k2 = localeKey(tail[tail.length - 2]);
  const locViol = !!loc && loc === k1 && loc === k2;

  const t1 = trendBucket(tail[tail.length - 1]);
  const t2 = trendBucket(tail[tail.length - 2]);
  const trendViol = trend === t1 && trend === t2;

  const r1 = resonanceBucketOf(tail[tail.length - 1]);
  const r2 = resonanceBucketOf(tail[tail.length - 2]);
  const resonanceViol = resonance === r1 && resonance === r2;

  const rareViol =
    rare && isRareRarity(tail[tail.length - 1]) && isRareRarity(tail[tail.length - 2]);

  return letterViol || locViol || trendViol || resonanceViol || rareViol;
}

function pickNext(
  remaining: BabyName[],
  tail: BabyName[],
  roomId: string,
  rng: () => number,
  ctx: DeckSequencingContext,
  position: number,
): BabyName {
  const feasible = remaining.filter((n) => !violatesStreak(n, tail));
  const pool = feasible.length > 0 ? feasible : remaining;

  const orderedPool = [...pool].sort(
    (a, b) => stableHash(`${roomId}:${a.id}`) - stableHash(`${roomId}:${b.id}`),
  );

  let best: BabyName | null = null;
  let bestScore = -Infinity;
  let bestTie = Infinity;
  let bestHash = Infinity;

  const globalEarly = ctx.sessionSwipeDepth + position < 20;

  for (const n of orderedPool) {
    const breaksRule = violatesStreak(n, tail);
    const penalty = breaksRule && feasible.length === 0 ? -4 : 0;

    const early = globalEarly ? earlyFitScore(n, ctx.countryPreference, ctx.region) * 0.55 : 0;
    const adapt = adaptiveBoost(n, ctx.learningProfile, ctx.recentLiked) * 0.35;

    const noise = rng() * 1e-6;
    const score = penalty + early + adapt + noise;
    const tie = stableTie(roomId, n.id);
    const hash = stableHash(`${roomId}:${n.id}`);
    if (
      best === null ||
      score > bestScore ||
      (score === bestScore && tie < bestTie) ||
      (score === bestScore && tie === bestTie && hash < bestHash)
    ) {
      best = n;
      bestScore = score;
      bestTie = tie;
      bestHash = hash;
    }
  }

  return best!;
}

/**
 * Re-order a deck that already respects shared-room priority / hash grouping.
 * Pure function: deterministic for identical inputs + ctx.
 */
export function sequenceSwipeDeck(names: BabyName[], ctx: DeckSequencingContext): BabyName[] {
  if (names.length <= 2) return names.slice();

  const seed = stableHash(`${ctx.roomId || '__no_room__'}:deck-seq`);
  const rng = mulberry32(seed);

  const remaining = names.slice();
  const out: BabyName[] = [];

  while (remaining.length > 0) {
    const next = pickNext(remaining, out.slice(-2), ctx.roomId || '__no_room__', rng, ctx, out.length);
    const idx = remaining.findIndex((n) => n.id === next.id);
    if (idx >= 0) remaining.splice(idx, 1);
    out.push(next);
  }

  return out;
}
