import { isOriginFilterWorldwide } from '../types';

type TranslateFn = (key: string, vars?: Record<string, string | number>) => string;

export const toI18nKey = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

export const translateCountryName = (
  t: TranslateFn,
  countryName: string | null | undefined,
  emptyFallback = '',
): string => {
  if (!countryName) return emptyFallback;
  const key = `country.${toI18nKey(countryName)}`;
  const translated = t(key);
  return translated === key ? countryName : translated;
};

/** Origin-filter chip label (real countries + synthetic worldwide bucket). */
export const translateOriginFilterCountry = (
  t: TranslateFn,
  country: string,
): string => {
  if (isOriginFilterWorldwide(country)) {
    return t('filter.origin.worldwideBucket');
  }
  return translateCountryName(t, country);
};
