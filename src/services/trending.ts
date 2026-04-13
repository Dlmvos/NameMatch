// ============================================================
// NameMatch – Trending Names Service
// Mock data representing current trends. In production, this
// would be fetched from a Supabase view or edge function.
// ============================================================

import { TrendingName } from '../types';

// Top rising names globally (mock data — updated periodically)
export const TRENDING_NAMES: TrendingName[] = [
  { nameId: 'worldwide-luna',     name: 'Luna',     trend: 'rising',  rank: 1,  previousRank: 3  },
  { nameId: 'worldwide-leo',      name: 'Leo',      trend: 'rising',  rank: 2,  previousRank: 5  },
  { nameId: 'worldwide-isla',     name: 'Isla',     trend: 'rising',  rank: 3,  previousRank: 7  },
  { nameId: 'us-aurora',          name: 'Aurora',   trend: 'rising',  rank: 4,  previousRank: 9  },
  { nameId: 'us-asher',           name: 'Asher',    trend: 'rising',  rank: 5,  previousRank: 8  },
  { nameId: 'latam-mateo',        name: 'Mateo',    trend: 'rising',  rank: 6,  previousRank: 11 },
  { nameId: 'worldwide-elias',    name: 'Elias',    trend: 'rising',  rank: 7,  previousRank: 12 },
  { nameId: 'worldwide-zara',     name: 'Zara',     trend: 'rising',  rank: 8,  previousRank: 14 },
  { nameId: 'eu-finn',            name: 'Finn',     trend: 'rising',  rank: 9,  previousRank: 16 },
  { nameId: 'latam-valentina',    name: 'Valentina',trend: 'rising',  rank: 10, previousRank: 18 },
];

export const CLASSIC_NAMES: TrendingName[] = [
  { nameId: 'worldwide-noah',     name: 'Noah',     trend: 'classic', rank: 1,  previousRank: 1  },
  { nameId: 'worldwide-emma',     name: 'Emma',     trend: 'classic', rank: 2,  previousRank: 2  },
  { nameId: 'us-liam',            name: 'Liam',     trend: 'classic', rank: 3,  previousRank: 3  },
  { nameId: 'us-olivia',          name: 'Olivia',   trend: 'classic', rank: 4,  previousRank: 4  },
  { nameId: 'us-charlotte',       name: 'Charlotte',trend: 'classic', rank: 5,  previousRank: 5  },
];

export function getTrendingForRegion(region: string): TrendingName[] {
  // In production: filter by region from API
  return TRENDING_NAMES;
}

export function getRankChange(name: TrendingName): string {
  const diff = name.previousRank - name.rank;
  if (diff > 0) return `↑${diff}`;
  if (diff < 0) return `↓${Math.abs(diff)}`;
  return '—';
}

export function getRankChangeColor(name: TrendingName): string {
  const diff = name.previousRank - name.rank;
  if (diff > 0) return '#1A8A5A';
  if (diff < 0) return '#C0392B';
  return '#888888';
}
