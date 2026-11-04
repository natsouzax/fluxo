import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet } from 'react-native';
import { useDrawerStore } from '../store/drawerStore';
import { AppColors, useThemeStyles } from '../theme';
import { AnimatedPressable } from './AnimatedPressable';

export function MenuButton({ variant = 'dark' }: { variant?: 'dark' | 'light' }) {
  const { colors, styles } = useThemeStyles(createStyles);
  const open = useDrawerStore((s) => s.open);
  const isLight = variant === 'light';

  return (
    <AnimatedPressable
      style={[styles.btn, isLight && styles.btnLight]}
      onPress={open}
      accessibilityLabel="Abrir menu"
      hitSlop={8}
    >
      <Feather name="menu" size={20} color={isLight ? '#FFFFFF' : colors.textPrimary} />
    </AnimatedPressable>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  btn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnLight: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
});
