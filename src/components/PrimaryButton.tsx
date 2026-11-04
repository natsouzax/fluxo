import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, Easing, Pressable, StyleSheet, Text } from 'react-native';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { radius, spacing, typography, useThemeStyles, type AppColors } from '../theme';

interface Props {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
}

export function PrimaryButton({ label, onPress, variant = 'primary', loading, disabled, icon }: Props) {
  const { colors, styles } = useThemeStyles(createStyles);
  const isPrimary = variant === 'primary';
  const isDanger = variant === 'danger';
  const scale = useRef(new Animated.Value(1)).current;
  const reducedMotion = useReducedMotion();
  useEffect(() => { if (reducedMotion) scale.setValue(1); }, [reducedMotion, scale]);

  function pressIn() {
    if (!reducedMotion) Animated.timing(scale, { toValue: 0.96, duration: 120, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  }
  function pressOut() {
    if (!reducedMotion) Animated.timing(scale, { toValue: 1, duration: 120, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  }

  return (
    <Pressable
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: Boolean(disabled || loading), busy: Boolean(loading) }}
    >
      <Animated.View
        style={[
          styles.base,
          isPrimary && styles.primary,
          variant === 'secondary' && styles.secondary,
          isDanger && styles.danger,
          (disabled || loading) && styles.disabled,
          { transform: [{ scale }] },
        ]}
      >
        {loading ? (
          <ActivityIndicator color={isPrimary ? colors.accentText : colors.textPrimary} />
        ) : (
          <>
            {icon}
            <Text
              style={[
                styles.label,
                isPrimary && styles.primaryLabel,
                isDanger && styles.dangerLabel,
              ]}
            >
              {label}
            </Text>
          </>
        )}
      </Animated.View>
    </Pressable>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 48,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
  },
  primary: { backgroundColor: colors.accent },
  secondary: { backgroundColor: colors.cardAlt, borderWidth: 1, borderColor: colors.border },
  danger: { backgroundColor: colors.dangerSoft, borderWidth: 1, borderColor: colors.danger },
  disabled: { opacity: 0.5 },
  label: { ...typography.bodyStrong, color: colors.textPrimary },
  primaryLabel: { color: colors.accentText },
  dangerLabel: { color: colors.danger },
});
