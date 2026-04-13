import type { NameRecord, PreferenceProfile } from '../services/supabase';

export type CompatibilitySignal = {
  score: number;
  label: 'high' | 'strong' | 'good' | 'neutral';
  text: string;
  cue: string;
};

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function sample<T>(items: T[], count: number): T[] {
  return shuffle(items).slice(0, Math.max(0, count));
}

function traitOverlap(tags: string[] | null | undefined, preferred: string[] | undefined): number {
  if (!tags?.length || !preferred?.length) return 0;
  return tags.filter((tag) => preferred.includes(tag)).length;
}

function scoreAgainstProfile(name: NameRecord, profile?: PreferenceProfile): number {
  if (!profile) return 0.1;

  let score = 0.1;

  if (profile.preferredGenders.length && name.gender && profile.preferredGenders.includes(name.gender)) {
    score += 0.2;
  }

  if (profile.preferredOrigins.length && name.origin && profile.preferredOrigins.includes(name.origin)) {
    score += 0.25;
  }

  const styleHits = traitOverlap(name.style_tags, profile.preferredStyles);
  score += Math.min(0.3, styleHits * 0.1);

  if (profile.matchedNameIds.includes(name.id)) {
    score += 0.25;
  }

  if (profile.likedNameIds.includes(name.id)) {
    score += 0.1;
  }

  if (typeof name.popularity_score === 'number') {
    score += 0.05;
  }

  return Math.min(score, 1);
}

function buildTasteCue(userProfile?: PreferenceProfile, partnerProfile?: PreferenceProfile): string {
  const sharedOrigins = (userProfile?.preferredOrigins ?? []).filter((origin) =>
    (partnerProfile?.preferredOrigins ?? []).includes(origin),
  );

  if (sharedOrigins.length > 0) {
    return `Shared preference: ${sharedOrigins[0]} names`;
  }

  const sharedStyles = (userProfile?.preferredStyles ?? []).filter((style) =>
    (partnerProfile?.preferredStyles ?? []).includes(style),
  );

  if (sharedStyles.length > 0) {
    return `You both lean toward ${sharedStyles[0]} names`;
  }

  if ((userProfile?.preferredStyles?.length ?? 0) > 0) {
    return `Based on your recent likes`;
  }

  return `Learning your shared taste`;
}

export function scoreNameForCouple(name: NameRecord, userProfile?: PreferenceProfile, partnerProfile?: PreferenceProfile): number {
  const userScore = scoreAgainstProfile(name, userProfile);
  const partnerScore = scoreAgainstProfile(name, partnerProfile);

  const overlapBoost =
    userProfile?.preferredOrigins?.length &&
    partnerProfile?.preferredOrigins?.length &&
    name.origin &&
    userProfile.preferredOrigins.includes(name.origin) &&
    partnerProfile.preferredOrigins.includes(name.origin)
      ? 0.18
      : 0;

  const styleOverlapBoost =
    traitOverlap(name.style_tags, userProfile?.preferredStyles) > 0 &&
    traitOverlap(name.style_tags, partnerProfile?.preferredStyles) > 0
      ? 0.18
      : 0;

  return Math.min(1, userScore * 0.5 + partnerScore * 0.5 + overlapBoost + styleOverlapBoost);
}

export function getCompatibilitySignal(name: NameRecord | null | undefined, userProfile?: PreferenceProfile, partnerProfile?: PreferenceProfile): CompatibilitySignal {
  const cue = buildTasteCue(userProfile, partnerProfile);

  if (!name) {
    return {
      score: 0,
      label: 'neutral',
      text: 'Discovering your style',
      cue,
    };
  }

  const score = scoreNameForCouple(name, userProfile, partnerProfile);

  if (score >= 0.78) {
    return {
      score,
      label: 'high',
      text: 'High compatibility',
      cue,
    };
  }

  if (score >= 0.62) {
    return {
      score,
      label: 'strong',
      text: 'Strong match potential',
      cue,
    };
  }

  if (score >= 0.46) {
    return {
      score,
      label: 'good',
      text: 'Good fit for both',
      cue,
    };
  }

  return {
    score,
    label: 'neutral',
    text: 'Fresh discovery',
    cue,
  };
}

export function generateSwipeDeck(args: {
  names: NameRecord[];
  userProfile?: PreferenceProfile;
  partnerProfile?: PreferenceProfile;
  excludeIds?: string[];
  deckSize?: number;
}): NameRecord[] {
  const {
    names,
    userProfile,
    partnerProfile,
    excludeIds = [],
    deckSize = 24,
  } = args;

  const excluded = new Set(excludeIds);

  const available = names.filter((name) => !excluded.has(name.id));

  const scored = available.map((name) => {
    const combinedScore = scoreNameForCouple(name, userProfile, partnerProfile);
    return { name, combinedScore };
  });

  const highProbability = scored.filter((item) => item.combinedScore >= 0.72).map((item) => item.name);
  const mediumProbability = scored.filter((item) => item.combinedScore >= 0.45 && item.combinedScore < 0.72).map((item) => item.name);
  const wildcard = scored.filter((item) => item.combinedScore < 0.45).map((item) => item.name);
  const adaptivePool = scored.sort((a, b) => b.combinedScore - a.combinedScore).map((item) => item.name);

  const highCount = Math.max(4, Math.round(deckSize * 0.28));
  const mediumCount = Math.max(8, Math.round(deckSize * 0.36));
  const wildcardCount = Math.max(3, Math.round(deckSize * 0.12));
  const adaptiveCount = Math.max(4, deckSize - highCount - mediumCount - wildcardCount);

  const ordered = [
    ...sample(highProbability, highCount),
    ...sample(mediumProbability, mediumCount),
    ...sample(wildcard, wildcardCount),
    ...sample(adaptivePool, adaptiveCount),
  ];

  return shuffle(ordered).slice(0, deckSize);
}
