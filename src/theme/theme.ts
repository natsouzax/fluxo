import { colors } from './colors';

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  xxl: 36,
  pill: 999,
};

export const typography = {
  editorial: { fontFamily: 'Manrope-SemiBold', fontSize: 32, lineHeight: 38, letterSpacing: -1.1 },
  display: { fontFamily: 'Manrope-SemiBold', fontSize: 40, lineHeight: 48, letterSpacing: -0.8 },
  h1: { fontFamily: 'Manrope-Bold', fontSize: 24, lineHeight: 30, letterSpacing: -0.3 },
  h2: { fontFamily: 'Manrope-SemiBold', fontSize: 18, lineHeight: 24 },
  body: { fontFamily: 'Manrope-Regular', fontSize: 15, lineHeight: 22 },
  bodyStrong: { fontFamily: 'Manrope-SemiBold', fontSize: 15, lineHeight: 22 },
  caption: { fontFamily: 'Manrope-Regular', fontSize: 13, lineHeight: 18 },
  tiny: { fontFamily: 'Manrope-Medium', fontSize: 11, lineHeight: 16 },
};

export const theme = { colors, spacing, radius, typography };
export type Theme = typeof theme;
