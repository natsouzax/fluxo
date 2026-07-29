import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { colors } from '../theme';

interface Props {
  progress: number; // 0..1
  color?: string;
  trackColor?: string;
  height?: number;
}

export function ProgressBar({ progress, color = colors.accent, trackColor = colors.border, height = 8 }: Props) {
  // Math.min/max propagate NaN, which a zero-limit budget (spent / 0) produces
  // and which renders the fill with no width at all.
  const clamped = Number.isFinite(progress) ? Math.max(0, Math.min(1, progress)) : 0;
  const widthAnim = useRef(new Animated.Value(0)).current;
  const colorAnim = useRef(new Animated.Value(1)).current;
  const prevColor = useRef(color);
  const [colorRange, setColorRange] = useState<[string, string]>([color, color]);

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: clamped,
      duration: 700,
      useNativeDriver: false,
    }).start();
  }, [clamped, widthAnim]);

  useEffect(() => {
    if (prevColor.current !== color) {
      setColorRange([prevColor.current, color]);
      colorAnim.setValue(0);
      Animated.timing(colorAnim, { toValue: 1, duration: 400, useNativeDriver: false }).start(() => {
        prevColor.current = color;
      });
    }
  }, [color, colorAnim]);

  const animatedColor = colorAnim.interpolate({ inputRange: [0, 1], outputRange: colorRange });

  return (
    <View style={[styles.track, { backgroundColor: trackColor, height, borderRadius: height / 2 }]}>
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

const styles = StyleSheet.create({
  track: { width: '100%', overflow: 'hidden' },
  fill: { height: '100%' },
});
