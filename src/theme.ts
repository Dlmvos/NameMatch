// ============================================================
// NameMatch – Design System
// Warm, playful, soft pastel palette
// ============================================================

export const COLORS = {
  // Core palette
  background: '#FFF9F5',       // Warm cream
  surface: 'colors.neutral.white',          // Card white
  primary: '#FF6B9D',          // Soft rose pink (like/heart)
  primaryLight: '#FFD6E7',     // Pale pink
  secondary: '#A8E6CF',        // Mint green (match)
  secondaryDark: '#5CB896',
  accent: '#FFD93D',           // Sunny yellow
  accentLight: '#FFF5CC',

  // Swipe indicators
  like: '#4CAF50',             // Green for right swipe
  likeLight: '#E8F5E9',
  skip: '#FF5252',             // Red for left swipe
  skipLight: '#FFEBEE',

  // Text
  text: '#2D2D2D',
  textSecondary: '#6B6B6B',
  textMuted: '#ABABAB',
  textOnPrimary: 'colors.neutral.white',

  // Borders & dividers
  border: '#F0E8EE',
  divider: '#F5EDF5',

  // Gender accents
  boy: '#89CFF0',              // Baby blue
  boyLight: '#E8F4FD',
  girl: '#FFB7C5',             // Cherry blossom pink
  girlLight: '#FFF0F3',
  neutral: '#C5B4E3',          // Lavender
  neutralLight: '#F3EFFE',

  // Gradients (start/end pairs used with LinearGradient)
  gradientPink: ['#FF6B9D', '#FF8FB1'] as [string, string],
  gradientMint: ['#A8E6CF', '#5CB896'] as [string, string],
  gradientSunset: ['#FFD93D', '#FF6B9D'] as [string, string],
  gradientPurple: ['#C5B4E3', '#9B8FD1'] as [string, string],
};

export const FONTS = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
  sizes: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    huge: 42,
  },
};

export const RADIUS = {
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  full: 9999,
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const SHADOWS = {
  card: {
    shadowColor: '#9B6B8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  button: {
    shadowColor: '#FF6B9D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
};

export { colors } from './theme/colors';
