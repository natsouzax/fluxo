import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { radius, spacing, typography, useThemeStyles, type AppColors } from '../theme';
import { FadeIn } from './FadeIn';

export function StatusPill({ connected, label }: { connected: boolean; label: string }) {
  const { colors, styles } = useThemeStyles(createStyles);
  return (
    <FadeIn key={connected ? 'on' : 'off'} duration={250} distance={0}>
      <View
        accessible
        accessibilityLabel={`${label}: ${connected ? 'conectado' : 'desconectado'}`}
        style={[
          styles.pill,
          { backgroundColor: connected ? colors.wiseSoft : colors.cardAlt },
        ]}
      >
        <View style={[styles.dot, { backgroundColor: connected ? colors.wise : colors.textMuted }]} />
        <Text style={[styles.text, { color: connected ? colors.wise : colors.textSecondary }]}>{label}</Text>
      </View>
    </FadeIn>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { ...typography.tiny },
});
