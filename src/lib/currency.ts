import { toI18nKey } from '../i18n/display';

const CURRENCY_BY_COUNTRY: Record<string, string> = {
  // ── Europe (EUR zone) ──
  spain: 'EUR',
  germany: 'EUR',
  france: 'EUR',
  italy: 'EUR',
  netherlands: 'EUR',
  portugal: 'EUR',
  belgium: 'EUR',
  austria: 'EUR',
  ireland: 'EUR',
  finland: 'EUR',
  greece: 'EUR',
  // ── Europe (own currency) ──
  switzerland: 'CHF',
  united_kingdom: 'GBP',
  scotland: 'GBP',
  turkey: 'TRY',
  poland: 'PLN',
  czech_republic: 'CZK',
  sweden: 'SEK',
  norway: 'NOK',
  denmark: 'DKK',
  romania: 'RON',
  hungary: 'HUF',
  russia: 'RUB',
  // ── Americas ──
  united_states: 'USD',
  usa: 'USD',
  canada: 'CAD',
  mexico: 'MXN',
  brazil: 'BRL',
  argentina: 'ARS',
  colombia: 'COP',
  peru: 'PEN',
  chile: 'CLP',
  venezuela: 'VES',
  // ── Asia-Pacific ──
  australia: 'AUD',
  new_zealand: 'NZD',
  japan: 'JPY',
  south_korea: 'KRW',
  china: 'CNY',
  india: 'INR',
  indonesia: 'IDR',
  philippines: 'PHP',
  vietnam: 'VND',
  thailand: 'THB',
  malaysia: 'MYR',
  singapore: 'SGD',
  pakistan: 'PKR',
  bangladesh: 'BDT',
  // ── MENA ──
  iran: 'IRR',
  egypt: 'EGP',
  morocco: 'MAD',
  algeria: 'DZD',
  tunisia: 'TND',
  israel: 'ILS',
  jordan: 'JOD',
  lebanon: 'LBP',
  // ── Arabia ──
  saudi_arabia: 'SAR',
  uae: 'AED',
  united_arab_emirates: 'AED',
  kuwait: 'KWD',
  qatar: 'QAR',
  bahrain: 'BHD',
  oman: 'OMR',
  // ── Africa ──
  south_africa: 'ZAR',
  nigeria: 'NGN',
  kenya: 'KES',
};

export const resolveCurrencyCode = (
  residenceCountry: string | null | undefined,
  regionPreference: string | null | undefined,
): string => {
  const countryKey = residenceCountry ? toI18nKey(residenceCountry) : '';
  if (countryKey && CURRENCY_BY_COUNTRY[countryKey]) {
    return CURRENCY_BY_COUNTRY[countryKey];
  }

  if (regionPreference === 'EU') return 'EUR';
  if (regionPreference === 'US') return 'USD';
  if (regionPreference === 'ASIA') return 'JPY';
  return 'USD';
};

/**
 * UI display precision for each currency.
 *
 * This controls how many decimals Intl.NumberFormat renders in the shop,
 * pack modals, and any other customer-facing price label.
 *
 * Payment-processor minor-unit rules (e.g. Stripe's zero-decimal list)
 * may differ and should be handled separately at purchase time.
 */

/** Currencies conventionally displayed without decimals. */
const ZERO_DECIMAL_CURRENCIES = new Set([
  'JPY', // ¥100
  'KRW', // ₩2,990
  'VND', // 69,000 ₫
  'CLP', // CL$2,990
  'IRR', // ﷼50,000  (Iran — sub-units not used in practice)
  'IDR', // Rp45,000  (Indonesia — sen not used in practice)
]);

/** Currencies that use 3 decimal places (dinar/rial family). */
const THREE_DECIMAL_CURRENCIES = new Set([
  'BHD', // Bahraini dinar  — 1.290 BHD
  'KWD', // Kuwaiti dinar   — 0.850 KWD
  'OMR', // Omani rial      — 1.080 OMR
  'JOD', // Jordanian dinar — 1.990 JOD
  'TND', // Tunisian dinar  — 8.990 TND
]);

export interface CurrencyFractionDigits {
  minimumFractionDigits: number;
  maximumFractionDigits: number;
}

export const getCurrencyFractionDigits = (currency: string): CurrencyFractionDigits => {
  if (ZERO_DECIMAL_CURRENCIES.has(currency)) {
    return { minimumFractionDigits: 0, maximumFractionDigits: 0 };
  }
  if (THREE_DECIMAL_CURRENCIES.has(currency)) {
    return { minimumFractionDigits: 3, maximumFractionDigits: 3 };
  }
  return { minimumFractionDigits: 2, maximumFractionDigits: 2 };
};

/** Format a price for UI display with the correct currency symbol and decimals. */
export function formatLocalizedPrice(
  amount: number,
  currency: string,
  locale: string,
): string {
  const fractionDigits = getCurrencyFractionDigits(currency);
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    ...fractionDigits,
  }).format(amount);
}
