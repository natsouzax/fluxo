import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { useDrawerStore } from '../store/drawerStore';
import { AppColors, spacing, typography, useThemeStyles } from '../theme';
import { AnimatedPressable } from './AnimatedPressable';
import { BrandMark } from './BrandMark';

/** The profile opens the existing menu, keeping all account destinations reachable. */
export function BrandHeader() {
  const { styles } = useThemeStyles(createStyles);
  const name = useAuthStore((s) => s.user?.name);
  const open = useDrawerStore((s) => s.open);
  const initials = name?.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toLocaleUpperCase('pt-BR');
  return (
    <View style={styles.header}>
      <View style={styles.brand} accessible accessibilityLabel="FLUXO">
        <BrandMark size={25} />
        <Text style={styles.wordmark}>FLUXO</Text>
      </View>
      <AnimatedPressable style={styles.profile} onPress={open} accessibilityLabel="Abrir perfil e menu">
        <Text style={styles.initials}>{initials || 'EU'}</Text>
      </AnimatedPressable>
    </View>
  );
}

export function ScreenHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  const { styles } = useThemeStyles(createStyles);
  return (
    <View style={styles.heading}>
      <Text style={styles.eyebrow}>{eyebrow.toLocaleUpperCase('pt-BR')}</Text>
      <Text accessibilityRole="header" style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
    </View>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: spacing.sm, marginBottom: spacing.md, minHeight: 56 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  wordmark: { fontFamily: 'Manrope-ExtraBold', fontSize: 24, letterSpacing: 0.6, color: colors.textPrimary },
  profile: { minWidth: 48, minHeight: 48, padding: spacing.sm, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentSoft },
  initials: { ...typography.caption, fontFamily: 'Manrope-Bold', color: colors.textPrimary },
  heading: { gap: spacing.sm, marginBottom: spacing.lg },
  eyebrow: { ...typography.tiny, fontFamily: 'Manrope-Bold', letterSpacing: 1.1, color: colors.textSecondary },
  title: { ...typography.editorial, color: colors.textPrimary },
  description: { ...typography.caption, lineHeight: 20, color: colors.textSecondary },
});
