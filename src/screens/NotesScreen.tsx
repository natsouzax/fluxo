import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { AnimatedPressable } from '../components/AnimatedPressable';
import { BrandHeader, ScreenHeading } from '../components/BrandHeader';
import { NoteCard } from '../components/NoteCard';
import { ScreenContainer } from '../components/ScreenContainer';
import { RootStackParamList } from '../navigation/types';
import { useNotesStore } from '../store/notesStore';
import { radius, spacing, typography, useThemeStyles, type AppColors } from '../theme';

const normalize = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');

export function NotesScreen() {
  const { colors, styles } = useThemeStyles(createStyles);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const notes = useNotesStore((s) => s.notes);
  const [query, setQuery] = useState('');
  const [topic, setTopic] = useState<string | null>(null);
  const topics = [...new Set(notes.flatMap((note) => note.tags))];
  const activeTopic = topic && topics.includes(topic) ? topic : null;
  const filtered = notes.filter((note) => (!activeTopic || note.tags.includes(activeTopic)) && normalize(`${note.title} ${note.body} ${note.tags.join(' ')}`).includes(normalize(query.trim())))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return (
    <ScreenContainer>
      <FlatList data={filtered} keyExtractor={(note) => note.id} keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}
        ListHeaderComponent={<>
          <BrandHeader />
          <ScreenHeading eyebrow={`Suas ideias · ${notes.length} ${notes.length === 1 ? 'nota' : 'notas'}`}
            title="Tudo que importa, anotado." description="Suas ideias, sempre à mão." />
          {notes.length > 0 ? <>
            <View style={styles.search}>
              <Feather name="search" size={18} color={colors.textMuted} />
              <TextInput accessibilityLabel="Buscar notas" placeholder="Buscar nas suas notas" placeholderTextColor={colors.textMuted}
                value={query} onChangeText={setQuery} style={styles.searchInput} />
            </View>

          </> : null}
          <View style={styles.sectionRow}>
            <Text accessibilityRole="header" style={styles.section}>{query || activeTopic ? 'Resultados' : 'Recentes'}</Text>
            <Text style={styles.count}>{filtered.length} {filtered.length === 1 ? 'nota' : 'notas'}</Text>
          </View>
        </>}
        renderItem={({ item }) => <NoteCard note={item} onPress={() => navigation.navigate('NoteEditor', { noteId: item.id })} />}
        ListFooterComponent={<>
            {topics.length > 0 ? <>
              <Text style={styles.section}>Por assunto</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.topics}>
                {[null, ...topics].map((tag) => <AnimatedPressable key={tag === null ? 'all' : `tag:${tag}`} accessibilityLabel={tag === null ? 'Mostrar todas as notas' : `Filtrar assunto ${tag}`} accessibilityState={{ selected: activeTopic === tag }}
                  style={[styles.topic, activeTopic === tag && styles.topicSelected]} onPress={() => setTopic(tag)}>
                  <Text style={styles.topicText}>{tag ? `${tag} · ${notes.filter((note) => note.tags.includes(tag)).length}` : 'Todas'}</Text>
                </AnimatedPressable>)}
              </ScrollView>
            </> : null}
        </>}
        ListEmptyComponent={<Text style={styles.empty}>{notes.length ? 'Nenhuma nota para esta busca.' : 'Suas ideias começam aqui. Crie sua primeira nota.'}</Text>}
      />
      <AnimatedPressable style={styles.addBtn} onPress={() => navigation.navigate('NoteEditor', {})} accessibilityLabel="Criar nova nota">
        <Feather name="plus" size={20} color={colors.textPrimary} /><Text style={styles.addText}>Nova nota</Text>
      </AnimatedPressable>
    </ScreenContainer>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  list: { paddingBottom: spacing.lg },
  search: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md },
  searchInput: { ...typography.body, flex: 1, minHeight: 48, paddingVertical: spacing.md, color: colors.textPrimary },
  section: { ...typography.bodyStrong, color: colors.textPrimary, marginVertical: spacing.md },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  count: { ...typography.caption, color: colors.textSecondary },
  topics: { gap: spacing.sm },
  topic: { minHeight: 48, justifyContent: 'center', borderRadius: radius.pill, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.border },
  topicSelected: { backgroundColor: colors.accentSoft },
  topicText: { ...typography.caption, color: colors.textPrimary },
  addBtn: { alignSelf: 'center', minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, marginVertical: spacing.md, borderRadius: radius.pill, backgroundColor: colors.accentSoft },
  addText: { ...typography.bodyStrong, color: colors.textPrimary },
  empty: { ...typography.body, color: colors.textSecondary, paddingVertical: spacing.xl },
});
