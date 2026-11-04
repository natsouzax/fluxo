import { Feather } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { randomUUID } from 'expo-crypto';
import React, { useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { DetailHeader } from '../components/DetailHeader';
import { ScreenContainer } from '../components/ScreenContainer';
import { RootStackParamList } from '../navigation/types';
import { useNotesStore } from '../store/notesStore';
import { flushProfileWrites, isCurrentSession, sessionGeneration } from '../store/profileStorage';
import { spacing, typography, useThemeStyles, type AppColors } from '../theme';

export function NoteEditorScreen() {
  const { colors, styles } = useThemeStyles(createStyles);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'NoteEditor'>>();
  const notes = useNotesStore((s) => s.notes);
  const upsertNote = useNotesStore((s) => s.upsertNote);
  const deleteNote = useNotesStore((s) => s.deleteNote);

  const existing = notes.find((n) => n.id === route.params?.noteId);
  const [title, setTitle] = useState(existing?.title ?? '');
  const [body, setBody] = useState(existing?.body ?? '');
  const [tagsInput, setTagsInput] = useState(existing?.tags.join(', ') ?? '');

  const [noteId] = useState(() => existing?.id ?? `note-${randomUUID()}`);
  const savedNote = notes.find((note) => note.id === noteId);
  const [createdAt] = useState(() => existing?.createdAt ?? new Date().toISOString());
  const [owner] = useState(sessionGeneration);
  const [saveStatus, setSaveStatus] = useState(existing ? 'Salvo no aparelho' : 'As alterações são salvas enquanto você escreve.');
  const saveVersion = useRef(0);
  const hasContent = useRef(Boolean(existing));
  // Commit every edit, without waiting for navigation, background or unmount.
  const draft = useRef({ title, body, tagsInput });

  function save() {
    if (!isCurrentSession(owner)) return;
    const current = draft.current;
    if (!hasContent.current && !current.title.trim() && !current.body.trim()) return;
    hasContent.current = true;

    const now = new Date().toISOString();
    upsertNote({
      id: noteId,
      title: current.title.trim() || 'Sem título',
      body: current.body,
      tags: current.tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      linkedGoalId: existing?.linkedGoalId ?? null,
      createdAt,
      updatedAt: now,
    });
    const version = ++saveVersion.current;
    setSaveStatus('Salvando…');
    void flushProfileWrites().then(() => {
      if (isCurrentSession(owner) && version === saveVersion.current) setSaveStatus('Salvo no aparelho');
    }).catch(() => {
      if (isCurrentSession(owner) && version === saveVersion.current) setSaveStatus('Falha ao salvar. Edite novamente para tentar.');
    });
  }

  function updateDraft(field: 'title' | 'body' | 'tagsInput', value: string) {
    draft.current = { ...draft.current, [field]: value };
    if (field === 'title') setTitle(value);
    else if (field === 'body') setBody(value);
    else setTagsInput(value);
    save();
  }

  function handleDelete() {
    if (!hasContent.current || !isCurrentSession(owner)) return;
    Alert.alert('Excluir nota', 'Tem certeza que deseja excluir esta nota?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => {
          if (!isCurrentSession(owner)) return;
          deleteNote(noteId);
          navigation.goBack();
        },
      },
    ]);
  }

  return (
    <ScreenContainer bottomSafeArea>
      <DetailHeader title={savedNote ? 'Editar nota' : 'Nova nota'} onBack={() => navigation.goBack()} backLabel="Salvar e voltar"
        action={savedNote ? <Pressable style={styles.iconButton} onPress={handleDelete} accessibilityRole="button" accessibilityLabel="Excluir nota">
          <Feather name="trash-2" size={20} color={colors.danger} />
        </Pressable> : undefined} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: spacing.xl }}>
          <Text accessibilityLiveRegion="polite" style={{ color: colors.textMuted }}>{saveStatus}</Text>
          <TextInput
            accessibilityLabel="Título da nota"
            value={title}
            onChangeText={(value) => updateDraft('title', value)}
            placeholder="Título"
            placeholderTextColor={colors.textMuted}
            style={styles.titleInput}
          />
          <TextInput
            accessibilityLabel="Tags da nota"
            value={tagsInput}
            onChangeText={(value) => updateDraft('tagsInput', value)}
            placeholder="tags separadas por vírgula"
            placeholderTextColor={colors.textMuted}
            style={styles.tagsInput}
          />
          <TextInput
            accessibilityLabel="Conteúdo da nota"
            value={body}
            onChangeText={(value) => updateDraft('body', value)}
            placeholder="Escreva aqui..."
            placeholderTextColor={colors.textMuted}
            style={styles.bodyInput}
            multiline
            textAlignVertical="top"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  iconButton: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  titleInput: { minHeight: 56, ...typography.editorial, color: colors.textPrimary, paddingVertical: spacing.sm },
  tagsInput: { minHeight: 48, ...typography.caption, color: colors.textSecondary, paddingBottom: spacing.md },
  bodyInput: { backgroundColor: colors.card, borderRadius: 20, padding: spacing.lg, ...typography.body, color: colors.textPrimary, minHeight: 300, lineHeight: 22 },
});
