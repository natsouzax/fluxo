import { Feather } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { RootStackParamList } from '../navigation/types';
import { useNotesStore } from '../store/notesStore';
import { colors, spacing, typography } from '../theme';

export function NoteEditorScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'NoteEditor'>>();
  const notes = useNotesStore((s) => s.notes);
  const upsertNote = useNotesStore((s) => s.upsertNote);
  const deleteNote = useNotesStore((s) => s.deleteNote);

  const existing = notes.find((n) => n.id === route.params?.noteId);
  const [title, setTitle] = useState(existing?.title ?? '');
  const [body, setBody] = useState(existing?.body ?? '');
  const [tagsInput, setTagsInput] = useState(existing?.tags.join(', ') ?? '');

  // The editor auto-saves on exit. Android's hardware back button and the swipe
  // gesture never reach an onPress handler, so saving has to happen on unmount
  // or the note is silently lost. Refs keep the latest draft visible to the
  // cleanup closure, which only runs once.
  const draft = useRef({ title, body, tagsInput });
  draft.current = { title, body, tagsInput };
  const discarded = useRef(false);

  const save = useCallback(() => {
    const current = draft.current;
    if (!current.title.trim() && !current.body.trim()) return;

    const now = new Date().toISOString();
    upsertNote({
      id: existing?.id ?? `note-${Date.now()}`,
      title: current.title.trim() || 'Sem título',
      body: current.body,
      tags: current.tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      linkedGoalId: existing?.linkedGoalId ?? null,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    });
  }, [existing, upsertNote]);

  const saveRef = useRef(save);
  saveRef.current = save;

  useEffect(
    () => () => {
      if (!discarded.current) saveRef.current();
    },
    []
  );

  function handleDelete() {
    if (!existing) return;
    Alert.alert('Excluir nota', 'Tem certeza que deseja excluir esta nota?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => {
          // Stop the unmount handler from re-creating the note we just deleted.
          discarded.current = true;
          deleteNote(existing.id);
          navigation.goBack();
        },
      },
    ]);
  }

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Salvar e voltar"
        >
          {({ pressed }) => (
            <Feather name="chevron-left" size={22} color={colors.textPrimary} style={{ opacity: pressed ? 0.5 : 1 }} />
          )}
        </Pressable>
        <Text style={styles.headerTitle}>{existing ? 'Editar nota' : 'Nova nota'}</Text>
        {existing ? (
          <Pressable onPress={handleDelete} hitSlop={12} accessibilityRole="button" accessibilityLabel="Excluir nota">
            {({ pressed }) => (
              <Feather name="trash-2" size={20} color={colors.danger} style={{ opacity: pressed ? 0.5 : 1 }} />
            )}
          </Pressable>
        ) : (
          <View style={{ width: 20 }} />
        )}
      </View>

      <ScrollView keyboardShouldPersistTaps="handled">
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Título"
          placeholderTextColor={colors.textMuted}
          style={styles.titleInput}
        />
        <TextInput
          value={tagsInput}
          onChangeText={setTagsInput}
          placeholder="tags separadas por vírgula"
          placeholderTextColor={colors.textMuted}
          style={styles.tagsInput}
        />
        <TextInput
          value={body}
          onChangeText={setBody}
          placeholder="Escreva aqui..."
          placeholderTextColor={colors.textMuted}
          style={styles.bodyInput}
          multiline
          textAlignVertical="top"
        />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  headerTitle: { ...typography.h2, color: colors.textPrimary },
  titleInput: { ...typography.h1, color: colors.textPrimary, paddingVertical: spacing.sm },
  tagsInput: { ...typography.caption, color: colors.textSecondary, paddingBottom: spacing.md },
  bodyInput: { ...typography.body, color: colors.textPrimary, minHeight: 300, lineHeight: 22 },
});
