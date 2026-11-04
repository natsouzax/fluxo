import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppColors, spacing, typography, useThemeStyles } from '../theme';
import { AnimatedPressable } from './AnimatedPressable';
import { BrandMark } from './BrandMark';

export function DetailHeader({ title, onBack, backLabel = 'Voltar', action }: {
  title?: string; onBack: () => void; backLabel?: string; action?: React.ReactNode;
}) {
  const { colors, styles } = useThemeStyles(createStyles);
  return <View style={styles.container}>
    <View style={styles.row}>
      <AnimatedPressable onPress={onBack} accessibilityLabel={backLabel} style={styles.action}>
        <Feather name="chevron-left" size={22} color={colors.textPrimary} />
      </AnimatedPressable>
      <View style={styles.brand} accessible accessibilityLabel="FLUXO">
        <BrandMark size={23} /><Text style={styles.wordmark}>FLUXO</Text>
      </View>
      {action ?? <View style={styles.action} />}
    </View>
    {title ? <Text accessibilityRole="header" style={styles.title}>{title}</Text> : null}
  </View>;
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  container: { marginTop: spacing.sm, marginBottom: spacing.xl },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  action: { minWidth: 48, minHeight: 48, justifyContent: 'center', alignItems: 'center' },
  brand: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  wordmark: { fontFamily: 'Manrope-ExtraBold', fontSize: 20, letterSpacing: 0.5, color: colors.textPrimary },
  title: { ...typography.h1, color: colors.textPrimary },
});
