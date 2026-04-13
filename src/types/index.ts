import type { NavigatorScreenParams } from '@react-navigation/native';
import { colors } from '../theme';
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

export type PackageType = 'country' | 'regional' | 'worldwide';

// ──────────────────────────────────────────────────────────
// Baby Name
// ──────────────────────────────────────────────────────────
export interface BabyName {
  id: string;
  name: string;
  meaning: string;
  origin: string;
  gender: Gender;
  country?: string;
  region: Region;
  is_worldwide: boolean;
  created_at?: string;
  // Enrichment (optional — populated by nameEnrichment service)
  popularity_rank?: number;
  trend?: 'rising' | 'stable' | 'classic';
  pronunciation?: string;
  similar_names?: string[];
}

// ──────────────────────────────────────────────────────────
// Name Filters
// ──────────────────────────────────────────────────────────
export type NameLength = 'short' | 'medium' | 'long';
export type NameTrend = 'rising' | 'stable' | 'classic';

export interface NameFilters {
  lengths: NameLength[];           // short ≤4, medium 5-7, long ≥8
  startingLetter: string;          // '' = any
  trends: NameTrend[];             // [] = any
  originsContain: string;          // '' = any — partial match on origin field
}

export const DEFAULT_FILTERS: NameFilters = {
  lengths: [],
  startingLetter: '',
  trends: [],
  originsContain: '',
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

export interface AINameRequest {
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
  room_id: string | null;
  free_swipes_remaining: number;
  purchased_packs: string[];
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
  type: PackageType;
  price: number; // in dollars
  priceCents: number;
  nameCount: number;
  emoji: string;
  gradient: [string, string];
}

// ──────────────────────────────────────────────────────────
// Navigation param types
// ──────────────────────────────────────────────────────────
export type RootStackParamList = {
  Welcome: undefined;
  Auth: { mode: 'login' | 'signup' };
  Preferences: undefined;
  Region: undefined;
  Country: undefined;
  PartnerConnect: undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  Paywall: undefined;
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
    type: 'worldwide',
    price: 4.99,
    priceCents: 499,
    nameCount: 500,
    emoji: '🌍',
    gradient: [colors.swipe.secondary, colors.shortlist.primary],
  },
  {
    key: 'EU',
    label: 'Europe Pack',
    description: 'French, German, Italian, Scandinavian & British names',
    type: 'regional',
    price: 2.99,
    priceCents: 299,
    nameCount: 200,
    emoji: '🇪🇺',
    gradient: [colors.match.secondary, colors.onboarding.secondary],
  },
  {
    key: 'US',
    label: 'USA Pack',
    description: 'Classic & trending American names',
    type: 'regional',
    price: 2.99,
    priceCents: 299,
    nameCount: 200,
    emoji: '🇺🇸',
    gradient: [colors.shortlist.secondary, colors.match.accent],
  },
  {
    key: 'ARABIA',
    label: 'Arabia Pack',
    description: 'Beautiful traditional Arabic & Islamic names',
    type: 'regional',
    price: 2.99,
    priceCents: 299,
    nameCount: 200,
    emoji: '🌙',
    gradient: [colors.swipe.like, colors.match.accent],
  },
  {
    key: 'MENA',
    label: 'MENA Pack',
    description: 'Names from across the Middle East & North Africa',
    type: 'regional',
    price: 2.99,
    priceCents: 299,
    nameCount: 200,
    emoji: '☀️',
    gradient: [colors.match.secondary, colors.match.primary],
  },
  {
    key: 'ASIA',
    label: 'Asia Pack',
    description: 'Eastern gems from China, Japan, Korea, India & beyond',
    type: 'regional',
    price: 2.99,
    priceCents: 299,
    nameCount: 200,
    emoji: '🌸',
    gradient: [colors.swipe.secondary, colors.onboarding.accent],
  },
  {
    key: 'LATIN_AMERICA',
    label: 'Latin America Pack',
    description: 'Vibrant Spanish & Portuguese names full of soul',
    type: 'regional',
    price: 2.99,
    priceCents: 299,
    nameCount: 200,
    emoji: '🌺',
    gradient: [colors.match.primary, colors.onboarding.secondary],
  },
];
