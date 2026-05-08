export const SUPPORTED_LANGUAGE_OPTIONS = [
  { code: 'en', label: 'English' },
  { code: 'nl', label: 'Dutch' },
  { code: 'de', label: 'German' },
  { code: 'fr', label: 'French' },
  { code: 'es', label: 'Spanish' },
  { code: 'it', label: 'Italian' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'zh', label: 'Chinese' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ko', label: 'Korean' },
  { code: 'ar', label: 'Arabic' },
] as const;

export type SupportedLanguageCode = (typeof SUPPORTED_LANGUAGE_OPTIONS)[number]['code'];

/**
 * Order for rolling out `name_meaning_translations` coverage (batch/import tooling).
 * Full UI support remains {@link SUPPORTED_LANGUAGE_OPTIONS}; zh, ja, ko, ar follow after this wave.
 */
export const NAME_MEANING_TRANSLATION_LAUNCH_PRIORITY = [
  'en',
  'es',
  'pt',
  'nl',
  'de',
  'fr',
  'it',
] as const satisfies readonly SupportedLanguageCode[];

export type NameMeaningTranslationLaunchLanguageCode =
  (typeof NAME_MEANING_TRANSLATION_LAUNCH_PRIORITY)[number];

function normalizeLanguageCode(language: string | undefined | null): string | null {
  if (!language) return null;
  const trimmed = language.trim();
  if (!trimmed) return null;
  return trimmed.split(/[-_]/)[0]?.toLowerCase() ?? null;
}

/**
 * App UI language: explicit preference wins; Auto (null) uses device locale; fallback `en`.
 * Country/residence preferences do not affect this — they only influence name content/filtering elsewhere.
 */
export function getEffectiveLanguage(
  languagePreference: string | null | undefined,
  deviceLanguage: string | undefined,
): string {
  const normalizedPreference = normalizeLanguageCode(languagePreference);
  if (normalizedPreference) return normalizedPreference;

  const normalizedDevice = normalizeLanguageCode(deviceLanguage);
  if (normalizedDevice) return normalizedDevice;

  return 'en';
}
