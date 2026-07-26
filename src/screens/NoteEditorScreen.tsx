import { Feather } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
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

  function handleSave() {
    if (!title.trim() && !body.trim()) {
      navigation.goBack();
      return;
    }
    const now = new Date().toISOString();
    upsertNote({
      id: existing?.id ?? `note-${Date.now()}`,
      title: title.trim() || 'Sem título',
      body,
      tags: tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      linkedGoalId: existing?.linkedGoalId ?? null,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    });
    navigation.goBack();
  }

  function handleDelete() {
    if (!existing) return;
    Alert.alert('Excluir nota', 'Tem certeza que deseja excluir esta nota?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => { deleteNote(existing.id); navigation.goBack(); } },
    ]);
  }

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Pressable onPress={handleSave} hitSlop={12}>
          <Feather name="chevron-left" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>{existing ? 'Editar nota' : 'Nova nota'}</Text>
        {existing ? (
          <Pressable onPress={handleDelete} hitSlop={12}>
            <Feather name="trash-2" size={20} color={colors.danger} />
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
