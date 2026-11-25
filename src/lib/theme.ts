import type { ViewStyle } from 'react-native';

import type { Category } from './types';

/** Midnight-and-gold palette. Keep tone names stable: screens refer to them directly. */
export const C = {
  bg: '#F7F5F0',
  card: '#FFFFFF',
  ink: '#14161F',
  sub: '#6F6C66',
  faint: '#A8A49B',
  line: '#ECE7DC',
  /** Midnight navy: primary actions, selected states, headings on cards. */
  brand: '#1B1F33',
  brandDark: '#0F1222',
  brandSoft: '#E6E7EE',
  brandTint: '#F1F1F5',
  /** Gold accent: ratings, highlights, badges. Pair with `ink` text, never white. */
  gold: '#C9A24B',
  goldDark: '#8E6C22',
  goldSoft: '#F3EAD3',
  green: '#2F7A57',
  greenSoft: '#E1EFE7',
  red: '#C0392B',
  redSoft: '#F9E5E2',
  amber: '#9A6510',
  amberSoft: '#F7EDD8',
};

/**
 * Poppins faces, loaded in the root layout. Use these instead of fontWeight: on Android a
 * custom family ignores fontWeight, so each weight is its own family.
 */
export const F = {
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semibold: 'Poppins_600SemiBold',
};

export const R = { sm: 10, md: 16, lg: 22, xl: 28, pill: 999 };
export const S = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

/** Soft, warm drop shadows (boxShadow works on native and web). */
export const shadow = {
  sm: { boxShadow: '0px 2px 8px rgba(20, 22, 40, 0.06)' } as ViewStyle,
  md: { boxShadow: '0px 8px 24px rgba(20, 22, 40, 0.07)' } as ViewStyle,
  brand: { boxShadow: '0px 8px 20px rgba(27, 31, 51, 0.28)' } as ViewStyle,
};

/** Per-category art direction used for covers, category bubbles and tags. */
export const CAT: Record<
  Category,
  {
    label: string;
    plural: string;
    icon: 'business' | 'cube' | 'flower' | 'sparkles';
    bg: string;
    deep: string;
    fg: string;
    /** Unsplash photo id for the category bubble. */
    photo: string;
  }
> = {
  venue: { label: 'Venue', plural: 'Venues', icon: 'business', bg: '#F1E8D4', deep: '#E4D3AC', fg: '#8E6C22', photo: 'photo-1519167758481-83f550bb49b3' },
  rental: { label: 'Rental', plural: 'Rentals', icon: 'cube', bg: '#E4E6EF', deep: '#CDD1E2', fg: '#3B4270', photo: 'photo-1707333514312-39cf7658479c' },
  decor: { label: 'Decor', plural: 'Decor', icon: 'flower', bg: '#F3E4DA', deep: '#E8CDBB', fg: '#9C5534', photo: 'photo-1746044159204-1c0dc41802ea' },
  planner: { label: 'Planner', plural: 'Planners', icon: 'sparkles', bg: '#E0EDE6', deep: '#C3DCCF', fg: '#2F6B4F', photo: 'photo-1768055105012-4c53791b2877' },
};
