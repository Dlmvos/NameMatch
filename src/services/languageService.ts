import { COUNTRY_LANGUAGE_MAP } from '../i18n/countryLanguageMap';

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

function normalizeCountryKey(country: string): string {
  if (country === 'USA' || country === 'United States') {
    return 'UnitedStates';
  }
  return country.replace(/\s+/g, '');
}

function normalizeLanguageCode(language: string | undefined | null): string | null {
  if (!language) return null;
  const trimmed = language.trim();
  if (!trimmed) return null;
  return trimmed.split(/[-_]/)[0]?.toLowerCase() ?? null;
}

export function getSuggestedLanguage(
  country: string | undefined,
  deviceLanguage: string | undefined,
): string {
  const mapped = country ? COUNTRY_LANGUAGE_MAP[normalizeCountryKey(country)] : undefined;
  if (mapped) return mapped;

  const normalizedDevice = normalizeLanguageCode(deviceLanguage);
  if (normalizedDevice) return normalizedDevice;

  return 'en';
}

export function getEffectiveLanguage(
  languagePreference: string | null | undefined,
  country: string | undefined,
  deviceLanguage: string | undefined,
): string {
  const normalizedPreference = normalizeLanguageCode(languagePreference);
  if (normalizedPreference) return normalizedPreference;
  return getSuggestedLanguage(country, deviceLanguage);
}
