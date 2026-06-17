import type { NavigatorScreenParams } from '@react-navigation/native';
import { colors } from '../theme';
import type { SupportedLanguageCode } from '../services/languageService';
// ============================================================
// NameMatch – Core TypeScript Types
// ============================================================

export type Gender = 'boy' | 'girl' | 'neutral';
export type GenderPreference = 'boy' | 'girl' | 'both';
export type Region =
  | 'EU'
  | 'US'
  | 'ARABIA'
  | 'MENA'
  | 'ASIA'
  | 'LATIN_AMERICA'
  | 'WORLDWIDE';

export type SwipeDirection = 'left' | 'right';
export type AppLanguage = SupportedLanguageCode;

export type PackageType = 'country' | 'regional' | 'worldwide';

/** Discrete bucket from `NameRarity.score` (0 = most common … 100 = rarest). */
export type RarityTier = 'unknown' | 'very_common' | 'common' | 'uncommon' | 'rare' | 'very_rare';

/** Derived from `popularity_rank` via `rarityFromPopularityRank` in `src/lib/rarityFromPopularityRank.ts`. */
export interface NameRarity {
  score: number | null;
  tier: RarityTier;
}

// ──────────────────────────────────────────────────────────
// Baby Name
// ──────────────────────────────────────────────────────────
export interface BabyName {
  id: string;
  name: string;
  meaning: string;
  // Content translations for per-name meaning text (not runtime UI-label translations).
  meaningTranslations?: Partial<Record<AppLanguage, string>>;
  origin: string;
  gender: Gender;
  country?: string;
  region: Region;
  is_worldwide: boolean;
  created_at?: string;
  /**
   * Shared identity across (name × country) variants. Multiple `baby_names`
   * rows ("Sara" in France, "Sara" in Belgium, "Sofía" in Spain, "Sofia" in
   * Italy) point to the same canonical_name_id. Used for:
   *  - Cross-country swipe exclusion (swipe Sara-FR → also exclude Sara-BE)
   *  - Deck dedup (don't show Sofia-IT and Sofía-ES in the same session)
   * Optional because bundled core names from `src/data/names.ts` predate
   * the canonical-id system; remote `baby_names` rows always carry it.
   */
  canonical_name_id?: string;
  // Enrichment (optional — populated by nameEnrichment service)
  /** Lower = more common when sourced from datasets; use `rarityFromPopularityRank` for a stable rarity view. */
  popularity_rank?: number;
  /** Optional cached rarity; callers may set with `rarityFromPopularityRank(popularity_rank)`. */
  rarity?: NameRarity;
  trend?: 'rising' | 'stable' | 'classic';
  pronunciation?: string;
  similar_names?: string[];
  /** Where this name originated: catalog (default) or user-created. */
  source?: 'catalog' | 'custom';
}

// ──────────────────────────────────────────────────────────
// Name Filters
// ──────────────────────────────────────────────────────────
export type NameLength = 'short' | 'medium' | 'long';
export type NameTrend = 'rising' | 'stable' | 'classic';

/** Premium quick-picks for feel / rarity (OR within selection). */
export type NameVibeTag = 'unique' | 'international' | 'soft' | 'strong';

/** Synthetic origin-filter chip id for names with no country or `is_worldwide`. */
export const ORIGIN_FILTER_WORLDWIDE = '__origin_worldwide__';

export function isOriginFilterWorldwide(country: string): boolean {
  return country === ORIGIN_FILTER_WORLDWIDE;
}

/** Names eligible for the International / Worldwide origin bucket. */
export function isWorldwideOriginName(name: Pick<BabyName, 'country' | 'is_worldwide'>): boolean {
  return name.is_worldwide === true || !(name.country ?? '').trim();
}

export function matchesOriginCountry(name: BabyName, country: string): boolean {
  if (isOriginFilterWorldwide(country)) {
    return isWorldwideOriginName(name);
  }
  if (isWorldwideOriginName(name)) {
    return false;
  }
  return (name.country ?? '').trim() === country.trim();
}

/** Country/culture chip in the origin filter (canonical `BabyName.country` value). */
export type OriginCountryChip = {
  country: string;
  count: number;
  flag?: string;
};

export interface NameFilters {
  lengths: NameLength[]; // short ≤4, medium 5-7, long ≥8
  startingLetter: string; // '' = any
  trends: NameTrend[]; // [] = any
  /** [] = any — OR match on `BabyName.country` or {@link ORIGIN_FILTER_WORLDWIDE}. */
  origins: string[];
  /** [] = any — OR match: name passes if any selected tag matches. */
  vibes: NameVibeTag[];
}

export const DEFAULT_FILTERS: NameFilters = {
  lengths: [],
  startingLetter: '',
  trends: [],
  origins: [],
  vibes: [],
};

// ──────────────────────────────────────────────────────────
// Trending / Enrichment
// ──────────────────────────────────────────────────────────
export interface TrendingName {
  nameId: string;
  name: string;
  trend: NameTrend;
  rank: number;
  previousRank: number;
}

export interface SuggestedName {
  name: string;
  meaning: string;
  origin: string;
  reason: string;
}

export interface NameSuggestionRequest {
  style?: string;
  origin?: string;
  meaning?: string;
  lengthPreference?: NameLength;
  gender: GenderPreference;
}

// ──────────────────────────────────────────────────────────
// Match Notes
// ──────────────────────────────────────────────────────────
export interface MatchNote {
  matchId: string;
  note: string;
  updatedAt: string;
}

// ──────────────────────────────────────────────────────────
// Profile (extends Supabase auth user)
// ──────────────────────────────────────────────────────────
export interface Profile {
  id: string;
  display_name: string | null;
  gender_preference: GenderPreference;
  region_preference: Region;
  // User-selected country + language inputs (primarily persisted in Supabase).
  country_preference: string | null;
  residence_country: string | null;
  language_preference: string | null;
  room_id: string | null;
  free_swipes_remaining: number;
  /** UTC calendar date (`YYYY-MM-DD`) of last daily free-swipe grant; server-owned. */
  free_swipes_last_refill_utc_date?: string | null;
  purchased_packs: string[];
  /**
   * Server-set after partner pairing: number of NEW matches created by
   * carrying forward each side's pre-pairing solo-room swipes. Non-null
   * triggers the CarryForwardModal on app open (0 is valid — friendly
   * "no matches yet from your past likes" message). Client clears via
   * RoomService.dismissCarryForwardNotice() which sets it to null.
   */
  pending_carry_forward_count: number | null;
  created_at: string;
  updated_at: string;
}

// ──────────────────────────────────────────────────────────
// Room
// ──────────────────────────────────────────────────────────
export interface Room {
  id: string;
  code: string;
  user1_id: string;
  user2_id: string | null;
  premium_packs: string[];
  is_active: boolean;
  created_at: string;
}

// ──────────────────────────────────────────────────────────
// Swipe
// ──────────────────────────────────────────────────────────
export interface Swipe {
  id: string;
  user_id: string;
  room_id: string;
  name_id: string;
  direction: SwipeDirection;
  created_at: string;
}

// ──────────────────────────────────────────────────────────
// Match
// ──────────────────────────────────────────────────────────
export interface Match {
  id: string;
  room_id: string;
  name_id: string;
  created_at: string;
  // Joined data
  baby_names?: BabyName;
}

// ──────────────────────────────────────────────────────────
// Purchase
// ──────────────────────────────────────────────────────────
export interface Purchase {
  id: string;
  user_id: string;
  package_type: PackageType;
  package_key: string;
  stripe_payment_intent_id: string | null;
  amount_cents: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed';
  created_at: string;
}

// ──────────────────────────────────────────────────────────
// Shop Pack definitions
// ──────────────────────────────────────────────────────────
export interface NamePack {
  key: string;
  label: string;
  description: string;
  titleKey?: string;
  labelKey?: string;
  descriptionKey?: string;
  type: PackageType;
  price: number; // in dollars
  priceCents: number;
  nameCount: number;
  emoji: string;
  gradient: [string, string];
}

export const PREMIUM_COUPLE_PACK_KEY = 'PREMIUM_COUPLE';

// ──────────────────────────────────────────────────────────
// Navigation param types
// ──────────────────────────────────────────────────────────
export type RootStackParamList = {
  Welcome: undefined;
  Auth: { mode: 'login' | 'signup' };
  Preferences: undefined;
  Region: undefined;
  Country: { source?: 'onboarding' | 'settings' | 'settingsResidence' } | undefined;
  PartnerConnect: undefined;
  RoomManagement: undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  /** Optional `source` for accurate paywall_impression attribution (auto-open vs manual). */
  Paywall:
    | {
        source?: 'onboarding' | 'post_match' | 'filter_chip' | 'free_swipes_exhausted';
        /** Optional UX hint when opening from a locked filter chip (not persisted). */
        contextLabel?: string;
      }
    | undefined;
  DevAnalytics: undefined;
  /** Reached via the password-recovery deep link
   * (`babinom://reset-password#access_token=...&refresh_token=...`).
   * The session is installed by useDeepLinkAuth before this screen
   * mounts; the screen calls supabase.auth.updateUser({ password }). */
  ResetPassword: undefined;
};

export type MainTabParamList = {
  Swipe: undefined;
  Matches: undefined;
  Shop: undefined;
  Settings: undefined;
};

// ──────────────────────────────────────────────────────────
// Region metadata
// ──────────────────────────────────────────────────────────
export interface RegionOption {
  key: Region;
  label: string;
  emoji: string;
  description: string;
}

export const REGION_OPTIONS: RegionOption[] = [
  {
    key: 'WORLDWIDE',
    label: 'Worldwide',
    emoji: '🌍',
    description: 'Names from all around the globe',
  },
  {
    key: 'EU',
    label: 'Europe',
    emoji: '🇪🇺',
    description: 'French, German, Italian, Scandinavian & more',
  },
  {
    key: 'US',
    label: 'United States',
    emoji: '🇺🇸',
    description: 'Classic & modern American names',
  },
  {
    key: 'ARABIA',
    label: 'Arabia',
    emoji: '🌙',
    description: 'Traditional Arabic & Islamic names',
  },
  {
    key: 'MENA',
    label: 'MENA',
    emoji: '☀️',
    description: 'Middle East & North Africa',
  },
  {
    key: 'ASIA',
    label: 'Asia',
    emoji: '🌸',
    description: 'Chinese, Japanese, Korean, Indian & more',
  },
  {
    key: 'LATIN_AMERICA',
    label: 'Latin America',
    emoji: '🌺',
    description: 'Spanish & Portuguese names with heart',
  },
];

export const NAME_PACKS: NamePack[] = [
  {
    key: 'WORLDWIDE',
    label: 'Worldwide Pack',
    description: 'Unlock 500+ names from every corner of the world',
    titleKey: 'pack.worldwide.label',
    labelKey: 'pack.worldwide.label',
    descriptionKey: 'pack.worldwide.description',
    type: 'worldwide',
    price: 12.99,
    priceCents: 1299,
    nameCount: 500,
    emoji: '🌍',
    gradient: [colors.swipe.secondary, colors.shortlist.primary],
  },
  {
    key: 'EU',
    label: 'Europe Pack',
    description: 'French, German, Italian, Scandinavian & British names',
    titleKey: 'pack.eu.label',
    labelKey: 'pack.eu.label',
    descriptionKey: 'pack.eu.description',
    type: 'regional',
    price: 5.99,
    priceCents: 599,
    nameCount: 200,
    emoji: '🇪🇺',
    gradient: [colors.match.secondary, colors.onboarding.secondary],
  },
  {
    key: 'US',
    label: 'USA Pack',
    description: 'Classic & trending American names',
    titleKey: 'pack.usa.label',
    labelKey: 'pack.usa.label',
    descriptionKey: 'pack.usa.description',
    type: 'regional',
    price: 5.99,
    priceCents: 599,
    nameCount: 200,
    emoji: '🇺🇸',
    gradient: [colors.shortlist.secondary, colors.match.accent],
  },
  {
    key: 'ARABIA',
    label: 'Arabia Pack',
    description: 'Beautiful traditional Arabic & Islamic names',
    titleKey: 'pack.arabia.label',
    labelKey: 'pack.arabia.label',
    descriptionKey: 'pack.arabia.description',
    type: 'regional',
    price: 5.99,
    priceCents: 599,
    nameCount: 200,
    emoji: '🌙',
    gradient: [colors.swipe.like, colors.match.accent],
  },
  {
    key: 'MENA',
    label: 'MENA Pack',
    description: 'Names from across the Middle East & North Africa',
    titleKey: 'pack.mena.label',
    labelKey: 'pack.mena.label',
    descriptionKey: 'pack.mena.description',
    type: 'regional',
    price: 5.99,
    priceCents: 599,
    nameCount: 200,
    emoji: '☀️',
    gradient: [colors.match.secondary, colors.match.primary],
  },
  {
    key: 'ASIA',
    label: 'Asia Pack',
    description: 'Eastern gems from China, Japan, Korea, India & beyond',
    titleKey: 'pack.asia.label',
    labelKey: 'pack.asia.label',
    descriptionKey: 'pack.asia.description',
    type: 'regional',
    price: 5.99,
    priceCents: 599,
    nameCount: 200,
    emoji: '🌸',
    gradient: [colors.swipe.secondary, colors.onboarding.accent],
  },
  {
    key: 'LATIN_AMERICA',
    label: 'Latin America Pack',
    description: 'Vibrant Spanish & Portuguese names full of soul',
    titleKey: 'pack.latinAmerica.label',
    labelKey: 'pack.latinAmerica.label',
    descriptionKey: 'pack.latinAmerica.description',
    type: 'regional',
    price: 5.99,
    priceCents: 599,
    nameCount: 200,
    emoji: '🌺',
    gradient: [colors.match.primary, colors.onboarding.secondary],
  },
];
