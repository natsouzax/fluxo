// Palette pulled from the Revolut FREE UI Kit (Figma, community) blended with
// Wise's clean, high-contrast style: light surfaces, confident blue accent,
// and a bright teal-green for money-in / success states.
export const colors = {
  bg: '#F5F6F8',
  bgElevated: '#FFFFFF',
  card: '#FFFFFF',
  cardAlt: '#F0F2F5',
  border: '#E5E8EC',

  textPrimary: '#191C1F',
  textSecondary: '#75808A',
  textMuted: '#A6AEB6',

  accent: '#0666EB', // Revolut blue
  accentSoft: '#E6F0FD',
  accentText: '#FFFFFF',

  wise: '#00BE90', // Wise green, used for money-in / success states
  wiseSoft: '#E1F8F0',

  danger: '#EF4444',
  dangerSoft: '#FDEAEA',
  warning: '#EC7E00',
  warningSoft: '#FDF0DF',

  info: '#0B84FF',
  infoSoft: '#E6F0FD',

  gradientStart: '#6D4AEF',
  gradientMid: '#3D5CF5',
  gradientEnd: '#0666EB',

  categoryPalette: [
    '#0666EB',
    '#4F56F1',
    '#EC7E00',
    '#E950A4',
    '#00BE90',
    '#F5A623',
    '#75808A',
  ],
};

export type AppColors = typeof colors;
