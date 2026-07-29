import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';
import { FadeIn } from './FadeIn';

export function StatusPill({ connected, label }: { connected: boolean; label: string }) {
  return (
    <FadeIn key={connected ? 'on' : 'off'} duration={250} distance={0}>
      <View
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

const styles = StyleSheet.create({
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
