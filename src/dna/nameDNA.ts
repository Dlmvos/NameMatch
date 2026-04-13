export type NameDNA = {
  normalized: string;
  firstLetter: string;
  lastLetter: string;
  firstTwo: string;
  lastTwo: string;
  length: number;
  syllableCount: number;
  vowelPattern: string;
  consonantPattern: string;
  hasSoftEnding: boolean;
  hasVowelEnding: boolean;
  dnaTags: string[];
};

const VOWELS = new Set(['a', 'e', 'i', 'o', 'u', 'y']);

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');
}

function estimateSyllables(name: string): number {
  const cleaned = normalize(name);
  if (!cleaned) return 1;

  const groups = cleaned.match(/[aeiouy]+/g);
  const count = groups?.length ?? 1;
  return Math.max(1, count);
}

function buildPattern(name: string, takeVowels: boolean): string {
  const cleaned = normalize(name);
  return cleaned
    .split('')
    .map((char) => {
      const isVowel = VOWELS.has(char);
      if (takeVowels && isVowel) return char;
      if (!takeVowels && !isVowel) return char;
      return '';
    })
    .join('');
}

export function buildNameDNA(name: string): NameDNA {
  const normalized = normalize(name);

  const firstLetter = normalized[0] ?? '';
  const lastLetter = normalized[normalized.length - 1] ?? '';
  const firstTwo = normalized.slice(0, 2);
  const lastTwo = normalized.slice(-2);
  const length = normalized.length;
  const syllableCount = estimateSyllables(normalized);
  const vowelPattern = buildPattern(normalized, true);
  const consonantPattern = buildPattern(normalized, false);

  const hasVowelEnding = !!lastLetter && VOWELS.has(lastLetter);
  const hasSoftEnding = ['a', 'e', 'i', 'o', 'n', 'l'].includes(lastLetter);

  const dnaTags: string[] = [];

  if (length <= 4) dnaTags.push('short');
  if (length >= 5 && length <= 7) dnaTags.push('medium');
  if (length >= 8) dnaTags.push('long');

  if (syllableCount === 1) dnaTags.push('one_syllable');
  if (syllableCount === 2) dnaTags.push('two_syllable');
  if (syllableCount >= 3) dnaTags.push('multi_syllable');

  if (hasVowelEnding) dnaTags.push('vowel_ending');
  if (hasSoftEnding) dnaTags.push('soft_ending');

  if (firstLetter) dnaTags.push(`starts_${firstLetter}`);
  if (lastLetter) dnaTags.push(`ends_${lastLetter}`);
  if (lastTwo) dnaTags.push(`ending_${lastTwo}`);

  return {
    normalized,
    firstLetter,
    lastLetter,
    firstTwo,
    lastTwo,
    length,
    syllableCount,
    vowelPattern,
    consonantPattern,
    hasSoftEnding,
    hasVowelEnding,
    dnaTags,
  };
}
