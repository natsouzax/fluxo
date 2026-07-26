import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { NoteCard } from '../components/NoteCard';
import { ScreenContainer } from '../components/ScreenContainer';
import { RootStackParamList } from '../navigation/types';
import { useNotesStore } from '../store/notesStore';
import { colors, radius, spacing, typography } from '../theme';

export function NotesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const notes = useNotesStore((s) => s.notes);

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>Notas</Text>
        <Pressable style={styles.addBtn} onPress={() => navigation.navigate('NoteEditor', {})}>
          <Feather name="plus" size={20} color={colors.accentText} />
        </Pressable>
      </View>
      <Text style={styles.subtitle}>
        Anote decisões, rotina e ideias — a IA usa suas notas para te ajudar com mais contexto.
      </Text>
      <FlatList
        data={notes}
        keyExtractor={(n) => n.id}
        contentContainerStyle={{ paddingTop: spacing.lg, paddingBottom: spacing.xxl }}
        renderItem={({ item }) => (
          <NoteCard note={item} onPress={() => navigation.navigate('NoteEditor', { noteId: item.id })} />
        )}
        ListEmptyComponent={<Text style={styles.empty}>Nenhuma nota ainda. Toque em + para criar.</Text>}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  title: { ...typography.h1, color: colors.textPrimary },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.sm },
  empty: { ...typography.caption, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xxl },
});
