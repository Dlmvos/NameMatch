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

/**
 * Maps UI/device locale tags to the app's base ISO 639-1 code (matches `name_meaning_translations.language_code`,
 * bundled maps, and `SUPPORTED_LANGUAGE_OPTIONS`).
 *
 * Examples: `pt-BR`, `pt_PT`, `pt-PT` → `pt`; `es-MX`, `es-AR`, `es-CO`, `es-CL`, `es-419` → `es`; `zh-CN` → `zh`.
 *
 * Pass explicit UI or device locale only — never derive from country/residence preferences.
 */
export function normalizeLanguageTagToBase(language: string | undefined | null): string {
  if (language == null) return '';
  const trimmed = language.trim();
  if (!trimmed) return '';
  return trimmed.split(/[-_]/)[0]?.toLowerCase() ?? '';
}

function normalizeLanguageCode(language: string | undefined | null): string | null {
  const base = normalizeLanguageTagToBase(language);
  return base || null;
}

/**
 * App UI language: explicit preference wins; Auto (null) uses device locale; fallback `en`.
 * Country/residence preferences do not affect this — they only influence name content/filtering elsewhere.
 *
 * Pass `deviceLocaleTag` as the raw system locale when possible (for example `pt-BR`); it is normalized to a base code here.
 */
export function getEffectiveLanguage(
  languagePreference: string | null | undefined,
  deviceLocaleTag: string | undefined,
): string {
  const normalizedPreference = normalizeLanguageCode(languagePreference);
  if (normalizedPreference) return normalizedPreference;

  const normalizedDevice = normalizeLanguageCode(deviceLocaleTag);
  if (normalizedDevice) return normalizedDevice;

  return 'en';
}
