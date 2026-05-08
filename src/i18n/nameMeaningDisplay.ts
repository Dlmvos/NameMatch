import type { AppLanguage, BabyName } from '../types';

// ── Placeholder patterns that must never reach the UI ──
const PLACEHOLDER_PATTERNS = [
  /national statistics/i,
  /^unknown$/i,
  /^n\/?a$/i,
  /^-+$/,
  /^\.+$/,
  /^\s*$/,
];

function isPlaceholder(text: string | null | undefined): boolean {
  if (!text) return true;
  const trimmed = text.trim();
  if (trimmed.length === 0) return true;
  return PLACEHOLDER_PATTERNS.some((p) => p.test(trimmed));
}

/** Bundled / premium `meaningTranslations` entry for the active locale (exact then base language). */
export function pickBundledMeaningTranslation(
  name: BabyName,
  language: AppLanguage | string,
): string | undefined {
  const exactLanguage = String(language ?? '').trim();
  const normalizedLanguage = exactLanguage.split(/[-_]/)[0]?.toLowerCase() ?? '';
  const translatedExact = name.meaningTranslations?.[exactLanguage as AppLanguage]?.trim();
  const translatedNormalized = name.meaningTranslations?.[normalizedLanguage as AppLanguage]?.trim();
  for (const candidate of [translatedExact, translatedNormalized]) {
    if (candidate && !isPlaceholder(candidate)) return candidate;
  }
  return undefined;
}

/**
 * Merge `name_meaning_translations` (catalog) and bundled maps into optional display fields.
 * Canonical English/catalog line stays on `name.meaning`.
 */
export function resolveBabyNameMeaningFields(
  name: BabyName,
  catalogTranslation: string | undefined,
  language: AppLanguage | string,
): BabyName {
  const normalizedLanguage = String(language ?? '').trim().split(/[-_]/)[0]?.toLowerCase() ?? '';
  const cat =
    catalogTranslation?.trim() && !isPlaceholder(catalogTranslation)
      ? catalogTranslation.trim()
      : undefined;
  const bundled = pickBundledMeaningTranslation(name, language);
  const localizedMeaning = cat ?? bundled;
  const canonical = name.meaning?.trim() ?? '';
  const meaningIsFallback =
    normalizedLanguage !== 'en' && !localizedMeaning && !!canonical && !isPlaceholder(canonical);
  const meaningLanguage = (localizedMeaning ? normalizedLanguage : 'en') as AppLanguage;
  return {
    ...name,
    localizedMeaning,
    meaningLanguage,
    meaningIsFallback,
  };
}

// NOTE:
// - runtime.ts remains for UI labels (e.g. "Meaning")
// - per-name meaning: optional `localizedMeaning` (catalog + bundled), then canonical `meaning`
// - placeholder/broken strings like "Spain national statistics" are filtered out
export function getLocalizedNameMeaning(name: BabyName, language: AppLanguage | string): string {
  const lm = name.localizedMeaning?.trim();
  if (lm && !isPlaceholder(lm)) return lm;
  const bundled = pickBundledMeaningTranslation(name, language);
  if (bundled) return bundled;
  const canonical = name.meaning?.trim();
  if (canonical && !isPlaceholder(canonical)) return canonical;
  return '';
}

/** Name detail: show when UI is not English but only canonical English `meaning` is available. */
export function shouldShowEnglishMeaningBadge(
  name: BabyName,
  language: AppLanguage | string,
): boolean {
  const normalizedLanguage = String(language ?? '').trim().split(/[-_]/)[0]?.toLowerCase() ?? '';
  if (normalizedLanguage === 'en') return false;
  if (name.meaningIsFallback === true) return true;
  if (name.meaningIsFallback === false) return false;
  const lm = name.localizedMeaning?.trim();
  if (lm && !isPlaceholder(lm)) return false;
  if (pickBundledMeaningTranslation(name, language)) return false;
  const canon = name.meaning?.trim();
  return !!canon && !isPlaceholder(canon);
}

/**
 * Clean origin strings for display — strip data-source tags like "(national statistics)".
 * Shared utility so every screen uses the same cleanup.
 */
export function cleanOriginForDisplay(origin: string | null | undefined): string {
  if (!origin) return '';
  return origin
    .replace(/\s*\(national statistics\)\s*/gi, '')
    .replace(/\s*\(census\)\s*/gi, '')
    .replace(/\s*\(registry\)\s*/gi, '')
    .trim();
}
