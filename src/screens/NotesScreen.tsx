import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { AnimatedPressable } from '../components/AnimatedPressable';
import { FadeIn } from '../components/FadeIn';
import { MenuButton } from '../components/MenuButton';
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
        <View style={styles.headerLeft}>
          <MenuButton />
          <Text style={styles.title}>Notas</Text>
        </View>
        <AnimatedPressable style={styles.addBtn} onPress={() => navigation.navigate('NoteEditor', {})}>
          <Feather name="plus" size={20} color={colors.accentText} />
        </AnimatedPressable>
      </View>
      <Text style={styles.subtitle}>
        Anote decisões, rotina e ideias — a IA usa suas notas para te ajudar com mais contexto.
      </Text>
      <FlatList
        data={notes}
        keyExtractor={(n) => n.id}
        contentContainerStyle={{ paddingTop: spacing.lg, paddingBottom: spacing.xxl }}
        renderItem={({ item, index }) => (
          <FadeIn delay={index * 60}>
            <NoteCard note={item} onPress={() => navigation.navigate('NoteEditor', { noteId: item.id })} />
          </FadeIn>
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
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
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
