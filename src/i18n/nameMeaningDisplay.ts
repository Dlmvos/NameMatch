import type { AppLanguage, BabyName } from '../types';

// ── Placeholder patterns that must never reach the UI ──
const PLACEHOLDER_PATTERNS = [
  /national statistics/i,
  /^unknown$/i,
  /^n\/?a$/i,
  /^-+$/,
  /^\.+$/,
  /^\s*$/,
  /\s\[(?:en|es|de|fr|nl|it|pt|zh|ja|ko|ar)\]\s*$/i,
];

/** True when a per-locale meaning string should be replaced by DB or other canonical sources. */
export function isMeaningTranslationPlaceholder(text: string | null | undefined): boolean {
  if (!text) return true;
  const trimmed = text.trim();
  if (trimmed.length === 0) return true;
  return PLACEHOLDER_PATTERNS.some((p) => p.test(trimmed));
}

function isPlaceholder(text: string | null | undefined): boolean {
  return isMeaningTranslationPlaceholder(text);
}

// NOTE:
// - runtime.ts remains for UI labels (e.g., "Meaning")
// - per-name meaning content comes from meaningTranslations data
// - canonical fallback is always name.meaning
// - placeholder/broken strings like "Spain national statistics" are filtered out
export function getLocalizedNameMeaning(name: BabyName, language: AppLanguage | string): string {
  const exactLanguage = String(language ?? '').trim();
  const normalizedLanguage = exactLanguage.split(/[-_]/)[0]?.toLowerCase() ?? '';
  const translatedExact = name.meaningTranslations?.[exactLanguage as AppLanguage]?.trim();
  const translatedNormalized = name.meaningTranslations?.[normalizedLanguage as AppLanguage]?.trim();

  // Priority: exact locale > normalized locale > canonical meaning > empty
  const candidates = [translatedExact, translatedNormalized, name.meaning?.trim()];
  for (const candidate of candidates) {
    if (candidate && !isPlaceholder(candidate)) return candidate;
  }
  return '';
}

/**
 * Data-source fragments stored in `baby_names.origin` — never show as cultural origin.
 * Handles parenthesized tags and bare suffixes (e.g. "Spain national statistics").
 */
const ORIGIN_SOURCE_STRIP_PATTERNS: RegExp[] = [
  /\s*\(national statistics\)\s*/gi,
  /\s*\(census\)\s*/gi,
  /\s*\(registry\)\s*/gi,
  /\s+national statistics\s*/gi,
  /\s+census\s*/gi,
  /\s+registry\s*/gi,
];

/** Entire origin string is only a catalog source label — hide in UI. */
const ORIGIN_SOURCE_ONLY_PATTERNS: RegExp[] = [
  /^US\s*SSA$/i,
  /^SSA$/i,
  /^national statistics$/i,
  /^census$/i,
  /^registry$/i,
  /^unknown$/i,
  /^n\/?a$/i,
  /^custom$/i,
];

/**
 * Clean origin strings for display — strip data-source tags like "(national statistics)".
 * Shared utility so every screen uses the same cleanup.
 */
export function cleanOriginForDisplay(origin: string | null | undefined): string {
  if (!origin) return '';
  let cleaned = origin.trim();
  for (const pattern of ORIGIN_SOURCE_STRIP_PATTERNS) {
    cleaned = cleaned.replace(pattern, ' ').trim();
  }
  cleaned = cleaned.replace(/\s{2,}/g, ' ').trim();
  if (!cleaned || ORIGIN_SOURCE_ONLY_PATTERNS.some((p) => p.test(cleaned))) {
    return '';
  }
  return cleaned;
}

/** True for user-authored names (custom origin); used to render the fallback meaning UX. */
export function isCustomName(name: BabyName): boolean {
  return name.source === 'custom' || name.origin === 'Custom';
}
