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
