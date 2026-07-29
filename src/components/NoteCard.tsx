import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Note } from '../data/types';
import { colors, radius, spacing, typography } from '../theme';
import { AnimatedPressable } from './AnimatedPressable';

export function NoteCard({ note, onPress }: { note: Note; onPress: () => void }) {
  return (
    <AnimatedPressable onPress={onPress} scaleTo={0.97} style={styles.card}>
      <Text style={styles.title} numberOfLines={1}>
        {note.title || 'Sem título'}
      </Text>
      <Text style={styles.body} numberOfLines={3}>
        {note.body}
      </Text>
      {note.tags.length > 0 && (
        <View style={styles.tags}>
          {note.tags.map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
        </View>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: '#101418',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  title: { ...typography.bodyStrong, color: colors.textPrimary, marginBottom: spacing.xs },
  body: { ...typography.caption, color: colors.textSecondary, lineHeight: 18 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.sm },
  tag: { backgroundColor: colors.accentSoft, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  tagText: { ...typography.tiny, color: colors.accent },
});
