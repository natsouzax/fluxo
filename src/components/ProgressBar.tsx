import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { AppColors, useThemeStyles } from '../theme';

interface Props {
  progress: number; // 0..1
  color?: string;
  trackColor?: string;
  height?: number;
}

export function ProgressBar({ progress, color, trackColor, height = 8 }: Props) {
  const { colors, styles } = useThemeStyles(createStyles);
  const barColor = color ?? colors.accent;
  const barTrackColor = trackColor ?? colors.border;
  // Math.min/max propagate NaN, which a zero-limit budget (spent / 0) produces
  // and which renders the fill with no width at all.
  const clamped = Number.isFinite(progress) ? Math.max(0, Math.min(1, progress)) : 0;
  const widthAnim = useRef(new Animated.Value(0)).current;
  const colorAnim = useRef(new Animated.Value(1)).current;
  const prevColor = useRef(barColor);
  const [colorRange, setColorRange] = useState<[string, string]>([barColor, barColor]);

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: clamped,
      duration: 700,
      useNativeDriver: false,
    }).start();
  }, [clamped, widthAnim]);

  useEffect(() => {
    if (prevColor.current !== barColor) {
      setColorRange([prevColor.current, barColor]);
      colorAnim.setValue(0);
      Animated.timing(colorAnim, { toValue: 1, duration: 400, useNativeDriver: false }).start(() => {
        prevColor.current = barColor;
      });
    }
  }, [barColor, colorAnim]);

  const animatedColor = colorAnim.interpolate({ inputRange: [0, 1], outputRange: colorRange });

  return (
    <View style={[styles.track, { backgroundColor: barTrackColor, height, borderRadius: height / 2 }]}>
      <Animated.View
        style={[
          styles.fill,
          {
            backgroundColor: animatedColor,
            borderRadius: height / 2,
            width: widthAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
          },
        ]}
      />
    </View>
  );
}

const createStyles = (_colors: AppColors) => StyleSheet.create({
  track: { width: '100%', overflow: 'hidden' },
  fill: { height: '100%' },
});
