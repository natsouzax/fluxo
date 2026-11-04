import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { AppColors, useThemeStyles } from '../theme';

interface Props {
  size?: number;
  markColor?: string;
  textColor?: string;
}

export function BrandMark({ size = 28, markColor }: Props) {
  const { colors } = useThemeStyles(createStyles);
  return (
    <Svg width={size} height={size * 0.86} viewBox="0 0 96 82" accessible={false}>
      <Path d="M16 72 39.5 30.5C43.2 23.8 46.7 19 49 19s5.9 4.8 9.6 11.5L82 72"
        fill="none" stroke={markColor ?? colors.accent} strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Rounded arch/V mark based on the existing app icon, paired with the Fluxo wordmark. */
export function BrandLockup({ size = 72, markColor, textColor }: Props) {
  const { colors, styles } = useThemeStyles(createStyles);
  return (
    <View style={styles.container} accessibilityRole="image" accessibilityLabel="Fluxo">
      <Svg width={size} height={size * 0.86} viewBox="0 0 96 82">
        <Path
          d="M16 72 39.5 30.5C43.2 23.8 46.7 19 49 19s5.9 4.8 9.6 11.5L82 72"
          fill="none"
          stroke={markColor ?? colors.accent}
          strokeWidth={14}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
      <Text style={[styles.wordmark, { color: textColor ?? colors.textPrimary, fontSize: Math.round(size * 0.3) }]}>FLUXO</Text>
    </View>
  );
}

const createStyles = (_colors: AppColors) => StyleSheet.create({
  container: { alignItems: 'center', gap: 1 },
  wordmark: { fontFamily: 'Manrope-ExtraBold', letterSpacing: 0.25 },
});
