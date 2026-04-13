// ============================================================
// NameMatch – Country list with region mapping
//
// `name` must match the `country` field used in names.ts so
// country-specific filtering works correctly.
// `region` maps to the Region union type for pool selection.
// `adjacentRegions` drives the 15% discovery pool.
// ============================================================

import type { Region } from '../types';

export interface CountryOption {
  name: string;          // must match BabyName.country in names.ts
  flag: string;          // emoji flag
  region: Region;        // primary region bucket
  adjacentRegions: Region[];
}

export const COUNTRY_OPTIONS: CountryOption[] = [
  // ── Europe ──────────────────────────────────────────────
  { name: 'Netherlands',   flag: '🇳🇱', region: 'EU', adjacentRegions: ['US', 'WORLDWIDE'] },
  { name: 'Germany',       flag: '🇩🇪', region: 'EU', adjacentRegions: ['US', 'WORLDWIDE'] },
  { name: 'France',        flag: '🇫🇷', region: 'EU', adjacentRegions: ['US', 'WORLDWIDE'] },
  { name: 'United Kingdom',flag: '🇬🇧', region: 'EU', adjacentRegions: ['US', 'WORLDWIDE'] },
  { name: 'Italy',         flag: '🇮🇹', region: 'EU', adjacentRegions: ['US', 'WORLDWIDE'] },
  { name: 'Spain',         flag: '🇪🇸', region: 'EU', adjacentRegions: ['LATIN_AMERICA', 'WORLDWIDE'] },
  { name: 'Poland',        flag: '🇵🇱', region: 'EU', adjacentRegions: ['US', 'WORLDWIDE'] },
  { name: 'Sweden',        flag: '🇸🇪', region: 'EU', adjacentRegions: ['US', 'WORLDWIDE'] },
  { name: 'Norway',        flag: '🇳🇴', region: 'EU', adjacentRegions: ['US', 'WORLDWIDE'] },
  { name: 'Denmark',       flag: '🇩🇰', region: 'EU', adjacentRegions: ['US', 'WORLDWIDE'] },
  { name: 'Belgium',       flag: '🇧🇪', region: 'EU', adjacentRegions: ['US', 'WORLDWIDE'] },
  { name: 'Portugal',      flag: '🇵🇹', region: 'EU', adjacentRegions: ['LATIN_AMERICA', 'WORLDWIDE'] },
  { name: 'Finland',       flag: '🇫🇮', region: 'EU', adjacentRegions: ['US', 'WORLDWIDE'] },
  { name: 'Austria',       flag: '🇦🇹', region: 'EU', adjacentRegions: ['US', 'WORLDWIDE'] },
  { name: 'Switzerland',   flag: '🇨🇭', region: 'EU', adjacentRegions: ['US', 'WORLDWIDE'] },
  { name: 'Ireland',       flag: '🇮🇪', region: 'EU', adjacentRegions: ['US', 'WORLDWIDE'] },
  { name: 'Czech Republic',flag: '🇨🇿', region: 'EU', adjacentRegions: ['US', 'WORLDWIDE'] },
  { name: 'Hungary',       flag: '🇭🇺', region: 'EU', adjacentRegions: ['US', 'WORLDWIDE'] },
  { name: 'Romania',       flag: '🇷🇴', region: 'EU', adjacentRegions: ['US', 'WORLDWIDE'] },
  { name: 'Greece',        flag: '🇬🇷', region: 'EU', adjacentRegions: ['MENA', 'WORLDWIDE'] },
  { name: 'Russia',        flag: '🇷🇺', region: 'EU', adjacentRegions: ['ASIA', 'WORLDWIDE'] },
  { name: 'Scotland',      flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', region: 'EU', adjacentRegions: ['US', 'WORLDWIDE'] },

  // ── Americas ────────────────────────────────────────────
  { name: 'USA',           flag: '🇺🇸', region: 'US', adjacentRegions: ['EU', 'LATIN_AMERICA', 'WORLDWIDE'] },
  { name: 'Canada',        flag: '🇨🇦', region: 'US', adjacentRegions: ['EU', 'LATIN_AMERICA', 'WORLDWIDE'] },
  { name: 'Australia',     flag: '🇦🇺', region: 'US', adjacentRegions: ['EU', 'ASIA', 'WORLDWIDE'] },
  { name: 'New Zealand',   flag: '🇳🇿', region: 'US', adjacentRegions: ['EU', 'ASIA', 'WORLDWIDE'] },

  // ── Asia ────────────────────────────────────────────────
  { name: 'China',         flag: '🇨🇳', region: 'ASIA', adjacentRegions: ['MENA', 'WORLDWIDE'] },
  { name: 'Japan',         flag: '🇯🇵', region: 'ASIA', adjacentRegions: ['MENA', 'WORLDWIDE'] },
  { name: 'India',         flag: '🇮🇳', region: 'ASIA', adjacentRegions: ['MENA', 'WORLDWIDE'] },
  { name: 'South Korea',   flag: '🇰🇷', region: 'ASIA', adjacentRegions: ['MENA', 'WORLDWIDE'] },
  { name: 'Indonesia',     flag: '🇮🇩', region: 'ASIA', adjacentRegions: ['MENA', 'WORLDWIDE'] },
  { name: 'Philippines',   flag: '🇵🇭', region: 'ASIA', adjacentRegions: ['MENA', 'WORLDWIDE'] },
  { name: 'Vietnam',       flag: '🇻🇳', region: 'ASIA', adjacentRegions: ['MENA', 'WORLDWIDE'] },
  { name: 'Thailand',      flag: '🇹🇭', region: 'ASIA', adjacentRegions: ['MENA', 'WORLDWIDE'] },
  { name: 'Malaysia',      flag: '🇲🇾', region: 'ASIA', adjacentRegions: ['MENA', 'WORLDWIDE'] },
  { name: 'Singapore',     flag: '🇸🇬', region: 'ASIA', adjacentRegions: ['MENA', 'WORLDWIDE'] },
  { name: 'Pakistan',      flag: '🇵🇰', region: 'ASIA', adjacentRegions: ['MENA', 'ARABIA', 'WORLDWIDE'] },
  { name: 'Bangladesh',    flag: '🇧🇩', region: 'ASIA', adjacentRegions: ['MENA', 'WORLDWIDE'] },

  // ── MENA ────────────────────────────────────────────────
  { name: 'Turkey',        flag: '🇹🇷', region: 'MENA', adjacentRegions: ['ARABIA', 'EU', 'WORLDWIDE'] },
  { name: 'Iran',          flag: '🇮🇷', region: 'MENA', adjacentRegions: ['ARABIA', 'ASIA', 'WORLDWIDE'] },
  { name: 'Egypt',         flag: '🇪🇬', region: 'MENA', adjacentRegions: ['ARABIA', 'EU', 'WORLDWIDE'] },
  { name: 'Morocco',       flag: '🇲🇦', region: 'MENA', adjacentRegions: ['ARABIA', 'EU', 'WORLDWIDE'] },
  { name: 'Algeria',       flag: '🇩🇿', region: 'MENA', adjacentRegions: ['ARABIA', 'EU', 'WORLDWIDE'] },
  { name: 'Tunisia',       flag: '🇹🇳', region: 'MENA', adjacentRegions: ['ARABIA', 'EU', 'WORLDWIDE'] },
  { name: 'Israel',        flag: '🇮🇱', region: 'MENA', adjacentRegions: ['ARABIA', 'EU', 'WORLDWIDE'] },
  { name: 'Jordan',        flag: '🇯🇴', region: 'MENA', adjacentRegions: ['ARABIA', 'EU', 'WORLDWIDE'] },
  { name: 'Lebanon',       flag: '🇱🇧', region: 'MENA', adjacentRegions: ['ARABIA', 'EU', 'WORLDWIDE'] },

  // ── Arabia ──────────────────────────────────────────────
  { name: 'Saudi Arabia',  flag: '🇸🇦', region: 'ARABIA', adjacentRegions: ['MENA', 'WORLDWIDE'] },
  { name: 'UAE',           flag: '🇦🇪', region: 'ARABIA', adjacentRegions: ['MENA', 'WORLDWIDE'] },
  { name: 'Kuwait',        flag: '🇰🇼', region: 'ARABIA', adjacentRegions: ['MENA', 'WORLDWIDE'] },
  { name: 'Qatar',         flag: '🇶🇦', region: 'ARABIA', adjacentRegions: ['MENA', 'WORLDWIDE'] },
  { name: 'Bahrain',       flag: '🇧🇭', region: 'ARABIA', adjacentRegions: ['MENA', 'WORLDWIDE'] },
  { name: 'Oman',          flag: '🇴🇲', region: 'ARABIA', adjacentRegions: ['MENA', 'WORLDWIDE'] },

  // ── Latin America ────────────────────────────────────────
  { name: 'Brazil',        flag: '🇧🇷', region: 'LATIN_AMERICA', adjacentRegions: ['US', 'EU', 'WORLDWIDE'] },
  { name: 'Mexico',        flag: '🇲🇽', region: 'LATIN_AMERICA', adjacentRegions: ['US', 'EU', 'WORLDWIDE'] },
  { name: 'Argentina',     flag: '🇦🇷', region: 'LATIN_AMERICA', adjacentRegions: ['US', 'EU', 'WORLDWIDE'] },
  { name: 'Colombia',      flag: '🇨🇴', region: 'LATIN_AMERICA', adjacentRegions: ['US', 'EU', 'WORLDWIDE'] },
  { name: 'Peru',          flag: '🇵🇪', region: 'LATIN_AMERICA', adjacentRegions: ['US', 'EU', 'WORLDWIDE'] },
  { name: 'Chile',         flag: '🇨🇱', region: 'LATIN_AMERICA', adjacentRegions: ['US', 'EU', 'WORLDWIDE'] },
  { name: 'Venezuela',     flag: '🇻🇪', region: 'LATIN_AMERICA', adjacentRegions: ['US', 'EU', 'WORLDWIDE'] },

  // ── Other / International ────────────────────────────────
  { name: 'South Africa',  flag: '🇿🇦', region: 'WORLDWIDE', adjacentRegions: ['EU', 'MENA'] },
  { name: 'Nigeria',       flag: '🇳🇬', region: 'WORLDWIDE', adjacentRegions: ['MENA', 'ARABIA'] },
  { name: 'Kenya',         flag: '🇰🇪', region: 'WORLDWIDE', adjacentRegions: ['MENA', 'ARABIA'] },
];

/** Look up a CountryOption by display name */
export function findCountry(name: string): CountryOption | undefined {
  return COUNTRY_OPTIONS.find((c) => c.name === name);
}

/** Get all countries for a given region */
export function countriesForRegion(region: Region): CountryOption[] {
  return COUNTRY_OPTIONS.filter((c) => c.region === region);
}
