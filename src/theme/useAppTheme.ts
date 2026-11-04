import { useMemo } from 'react';
import { useSettingsStore } from '../store/settingsStore';
import { darkColors, lightColors, AppColors } from './colors';

export function useAppThemeColors(): AppColors {
  const preference = useSettingsStore((state) => state.themePreference);
  return preference === 'dark' ? darkColors : lightColors;
}

export function useThemeStyles<T extends Record<string, object>>(
  createStyles: (colors: AppColors) => T
): { colors: AppColors; styles: T } {
  const colors = useAppThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors, createStyles]);
  return { colors, styles };
}
