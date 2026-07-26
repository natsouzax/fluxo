// Palette inspired by the Revolut and Wise UI kits: near-black surfaces,
// a single confident accent, and calm greys for secondary text.
export const colors = {
  bg: '#0B0D10',
  bgElevated: '#15181D',
  card: '#1B1F26',
  cardAlt: '#20242C',
  border: '#2A2F38',

  textPrimary: '#F5F7FA',
  textSecondary: '#9AA3AF',
  textMuted: '#5F6773',

  accent: '#B4FF39', // Revolut-style lime
  accentSoft: '#26301A',
  accentText: '#0B0D10',

  wise: '#9FE870', // Wise green, used for money-in / success states
  wiseSoft: '#1B2A17',

  danger: '#FF6B6B',
  dangerSoft: '#2E1A1B',
  warning: '#FFC24B',
  warningSoft: '#2E2717',

  info: '#5FA8FF',
  infoSoft: '#182634',

  gradientStart: '#B4FF39',
  gradientEnd: '#5FE0C0',

  categoryPalette: [
    '#B4FF39',
    '#5FA8FF',
    '#FF9F6B',
    '#C792FF',
    '#5FE0C0',
    '#FF6BA8',
    '#FFC24B',
  ],
};

export type AppColors = typeof colors;
