import type { NameRecord, PreferenceProfile } from '../services/supabase';

export type NameDNA = {
  lengthBucket: 'short' | 'medium' | 'long';
  syllableBucket: 'short' | 'medium' | 'long';
  startsWithVowel: boolean;
  endsWithVowel: boolean;
  ending: string;
  vowelRatioBucket: 'low' | 'medium' | 'high';
  styleTags: string[];
  origin?: string | null;
  gender?: string | null;
};

function normalize(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function countVowels(name: string): number {
  const m = normalize(name).match(/[aeiouy]/g);
  return m ? m.length : 0;
}

function estimateSyllables(name: string): number {
  const cleaned = normalize(name).replace(/[^a-z]/g, '');
  if (!cleaned) return 1;
  const groups = cleaned.match(/[aeiouy]+/g);
  return Math.max(1, groups ? groups.length : 1);
}

function bucketLength(name: string): 'short' | 'medium' | 'long' {
  const len = normalize(name).replace(/[^a-z]/g, '').length;
  if (len <= 4) return 'short';
  if (len <= 7) return 'medium';
  return 'long';
}

function bucketSyllables(count: number): 'short' | 'medium' | 'long' {
  if (count <= 1) return 'short';
  if (count <= 2) return 'medium';
  return 'long';
}

function bucketVowelRatio(name: string): 'low' | 'medium' | 'high' {
  const cleaned = normalize(name).replace(/[^a-z]/g, '');
  if (!cleaned.length) return 'medium';
  const ratio = countVowels(cleaned) / cleaned.length;
  if (ratio < 0.35) return 'low';
  if (ratio < 0.55) return 'medium';
  return 'high';
}

function getEnding(name: string): string {
  const cleaned = normalize(name).replace(/[^a-z]/g, '');
  if (cleaned.length >= 2) return cleaned.slice(-2);
  return cleaned;
}

export function getNameDNA(name: NameRecord): NameDNA {
  const normalized = normalize(name.name);
  const syllables = estimateSyllables(normalized);

  return {
    lengthBucket: bucketLength(normalized),
    syllableBucket: bucketSyllables(syllables),
    startsWithVowel: /^[aeiou]/.test(normalized),
    endsWithVowel: /[aeiouy]$/.test(normalized),
    ending: getEnding(normalized),
    vowelRatioBucket: bucketVowelRatio(normalized),
    styleTags: name.style_tags ?? [],
    origin: name.origin ?? null,
    gender: name.gender ?? null,
  };
}

function inc(counter: Record<string, number>, key: string | null | undefined, weight = 1): void {
  if (!key) return;
  counter[key] = (counter[key] ?? 0) + weight;
}

function top(counter: Record<string, number>, limit: number): string[] {
  return Object.entries(counter)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key]) => key);
}

export type DNASignature = {
  preferredLengths: string[];
  preferredSyllables: string[];
  preferredEndings: string[];
  preferredVowelRatios: string[];
  prefersEndsWithVowel: boolean;
  prefersStartsWithVowel: boolean;
};

export function buildDNASignature(names: NameRecord[]): DNASignature {
  const lengths: Record<string, number> = {};
  const syllables: Record<string, number> = {};
  const endings: Record<string, number> = {};
  const vowelRatios: Record<string, number> = {};
  let startsWithVowelVotes = 0;
  let endsWithVowelVotes = 0;

  for (const name of names) {
    const dna = getNameDNA(name);
    inc(lengths, dna.lengthBucket);
    inc(syllables, dna.syllableBucket);
    inc(endings, dna.ending);
    inc(vowelRatios, dna.vowelRatioBucket);

    if (dna.startsWithVowel) startsWithVowelVotes += 1;
    if (dna.endsWithVowel) endsWithVowelVotes += 1;
  }

  const total = Math.max(1, names.length);

  return {
    preferredLengths: top(lengths, 2),
    preferredSyllables: top(syllables, 2),
    preferredEndings: top(endings, 3),
    preferredVowelRatios: top(vowelRatios, 2),
    prefersStartsWithVowel: startsWithVowelVotes / total >= 0.5,
    prefersEndsWithVowel: endsWithVowelVotes / total >= 0.5,
  };
}

export function scoreCandidateDNA(
  candidate: NameRecord,
  signature: DNASignature | null | undefined,
): number {
  if (!signature) return 0;

  const dna = getNameDNA(candidate);
  let score = 0;

  if (signature.preferredLengths.includes(dna.lengthBucket)) score += 0.16;
  if (signature.preferredSyllables.includes(dna.syllableBucket)) score += 0.14;
  if (signature.preferredEndings.includes(dna.ending)) score += 0.22;
  if (signature.preferredVowelRatios.includes(dna.vowelRatioBucket)) score += 0.12;
  if (signature.prefersEndsWithVowel === dna.endsWithVowel) score += 0.12;
  if (signature.prefersStartsWithVowel === dna.startsWithVowel) score += 0.08;

  return Math.min(score, 1);
}

export function scorePreferenceSignal(
  candidate: NameRecord,
  profile?: PreferenceProfile,
): number {
  if (!profile) return 0;

  let score = 0;

  if (profile.preferredGenders.length && candidate.gender && profile.preferredGenders.includes(candidate.gender)) {
    score += 0.18;
  }

  if (profile.preferredOrigins.length && candidate.origin && profile.preferredOrigins.includes(candidate.origin)) {
    score += 0.22;
  }

  const tagHits = (candidate.style_tags ?? []).filter((tag) => profile.preferredStyles.includes(tag)).length;
  score += Math.min(0.22, tagHits * 0.08);

  if (profile.matchedNameIds.includes(candidate.id)) score += 0.18;
  if (profile.likedNameIds.includes(candidate.id)) score += 0.08;

  return Math.min(score, 1);
}

export function getCompatibilityLabel(score: number): 'High match potential' | 'Strong match potential' | 'Good fit' | 'Discovery pick' {
  if (score >= 0.78) return 'High match potential';
  if (score >= 0.62) return 'Strong match potential';
  if (score >= 0.45) return 'Good fit';
  return 'Discovery pick';
}
