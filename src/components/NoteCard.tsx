import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Note } from '../data/types';
import { colors, radius, spacing, typography } from '../theme';

export function NoteCard({ note, onPress }: { note: Note; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
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
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  pressed: { opacity: 0.8 },
  title: { ...typography.bodyStrong, color: colors.textPrimary, marginBottom: spacing.xs },
  body: { ...typography.caption, color: colors.textSecondary, lineHeight: 18 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.sm },
  tag: { backgroundColor: colors.accentSoft, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  tagText: { ...typography.tiny, color: colors.accent },
});
