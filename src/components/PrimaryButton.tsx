import React, { useRef } from 'react';
import { ActivityIndicator, Animated, Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';

interface Props {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
}

export function PrimaryButton({ label, onPress, variant = 'primary', loading, disabled, icon }: Props) {
  const isPrimary = variant === 'primary';
  const isDanger = variant === 'danger';
  const scale = useRef(new Animated.Value(1)).current;

  function pressIn() {
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 40, bounciness: 6 }).start();
  }
  function pressOut() {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 8 }).start();
  }

  return (
    <Pressable
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      disabled={disabled || loading}
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

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
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
