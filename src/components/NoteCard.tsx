import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { Note } from '../data/types';
import { radius, spacing, typography, useThemeStyles, type AppColors } from '../theme';
import { AnimatedPressable } from './AnimatedPressable';

export function NoteCard({ note, onPress }: { note: Note; onPress: () => void }) {
  const { colors, styles } = useThemeStyles(createStyles);
  return (
    <AnimatedPressable onPress={onPress} accessibilityLabel={`Editar nota ${note.title || 'Sem título'}`} scaleTo={0.97} style={styles.card}>
      <Text style={styles.title} numberOfLines={1}>
        {note.title || 'Sem título'}
      </Text>
      <Text style={styles.body} numberOfLines={1}>
        {note.body}
      </Text>
    </AnimatedPressable>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  card: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    minHeight: 64,
    borderWidth: 0,
    borderColor: colors.border,
  },
  title: { ...typography.bodyStrong, color: colors.textPrimary, marginBottom: spacing.xs },
  body: { ...typography.caption, color: colors.textSecondary, lineHeight: 18 },
});
