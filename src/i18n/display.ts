import { t as runtimeT } from './runtime';

export const toI18nKey = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

/** i18n keys to try for one canonical stored English country label (synonyms). */
function countryLookupKeys(storedLabel: string): string[] {
  const base = toI18nKey(storedLabel);
  const primary = `country.${base}`;
  if (base === 'usa') return [primary, 'country.united_states'];
  if (base === 'united_states') return [primary, 'country.usa'];
  return [primary];
}

/**
 * Localized display label for a stored country name (matches `CountryOption.name` / profile fields).
 * Values stay in English in storage; only the UI string is localized using app UI `language`.
 */
export function getLocalizedCountryName(
  countryCodeOrKey: string | null | undefined,
  language: string,
): string {
  const raw = countryCodeOrKey?.trim();
  if (!raw) return '';
  for (const key of countryLookupKeys(raw)) {
    const translated = runtimeT(key, language);
    if (translated !== key) return translated;
  }
  return raw;
}

/** Convenience when resolving preference labels with an explicit empty UI fallback (e.g. settings rows). */
export function getLocalizedCountryNameOr(
  countryCodeOrKey: string | null | undefined,
  language: string,
  emptyFallback: string,
): string {
  const raw = countryCodeOrKey?.trim();
  if (!raw) return emptyFallback;
  return getLocalizedCountryName(raw, language) || emptyFallback;
}
