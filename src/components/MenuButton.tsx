import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet } from 'react-native';
import { useDrawerStore } from '../store/drawerStore';
import { colors } from '../theme';
import { AnimatedPressable } from './AnimatedPressable';

export function MenuButton({ variant = 'dark' }: { variant?: 'dark' | 'light' }) {
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

const styles = StyleSheet.create({
  btn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnLight: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
});
