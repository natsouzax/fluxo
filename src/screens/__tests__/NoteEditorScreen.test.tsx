import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { NoteEditorScreen } from '../NoteEditorScreen';
import { useAuthStore } from '../../store/authStore';
import { useNotesStore } from '../../store/notesStore';
import { flushProfileWrites, profileStorageKey } from '../../store/profileStorage';

const { act, create } = require('react-test-renderer');
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('expo-secure-store', () => ({ getItemAsync: async () => null, setItemAsync: async () => {}, deleteItemAsync: async () => {} }));
jest.mock('expo-crypto', () => ({ randomUUID: () => 'stable-draft' }));
jest.mock('@expo/vector-icons', () => ({ Feather: 'Icon' }));
jest.mock('@react-navigation/native', () => ({ useNavigation: () => ({ goBack: jest.fn() }), useRoute: () => ({ params: {} }) }));

beforeEach(async () => {
  useAuthStore.getState().logout();
  await AsyncStorage.clear();
  await useAuthStore.getState().login('editor@fluxo.app', 'secret1');
});

it('persists each edit while the editor is still open, using one stable note ID', async () => {
  let screen: any;
  await act(async () => { screen = create(<NoteEditorScreen />); });
  await act(async () => {
    screen.root.findByProps({ accessibilityLabel: 'Título da nota' }).props.onChangeText('Rascunho');
    screen.root.findByProps({ accessibilityLabel: 'Conteúdo da nota' }).props.onChangeText('Texto ainda aberto');
    screen.root.findByProps({ accessibilityLabel: 'Tags da nota' }).props.onChangeText('rotina, pessoal');
    await flushProfileWrites();
  });
  const persisted = JSON.parse((await AsyncStorage.getItem(profileStorageKey('fluxo-notes', 'editor@fluxo.app')))!);
  expect(persisted.state.notes.filter((note: { id: string }) => note.id === 'note-stable-draft')).toEqual([
    expect.objectContaining({ title: 'Rascunho', body: 'Texto ainda aberto', tags: ['rotina', 'pessoal'] }),
  ]);
  // Simulate a killed screen: persistence already exists before unmount/Back.
  await act(async () => { screen.unmount(); });
  useAuthStore.getState().logout();
  await useAuthStore.getState().login('editor@fluxo.app', 'secret1');
  expect(useNotesStore.getState().notes.find((note) => note.id === 'note-stable-draft')?.body).toBe('Texto ainda aberto');
});

it('does not resurrect a deleted auto-saved note when the editor closes', async () => {
  let screen: any;
  const alert = jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, buttons) => {
    buttons?.find((button) => button.style === 'destructive')?.onPress?.();
  });
  await act(async () => { screen = create(<NoteEditorScreen />); });
  await act(async () => {
    screen.root.findByProps({ accessibilityLabel: 'Título da nota' }).props.onChangeText('Apagar');
    await flushProfileWrites();
  });
  await act(async () => {
    screen.root.findByProps({ accessibilityLabel: 'Excluir nota' }).props.onPress();
    screen.unmount();
    await flushProfileWrites();
  });
  expect(useNotesStore.getState().notes.some((note) => note.id === 'note-stable-draft')).toBe(false);
  alert.mockRestore();
});

it('shows a persistence error instead of claiming an unsaved edit is saved', async () => {
  let screen: any;
  await act(async () => { screen = create(<NoteEditorScreen />); });
  jest.mocked(AsyncStorage.setItem).mockRejectedValueOnce(new Error('disk full'));
  await act(async () => {
    screen.root.findByProps({ accessibilityLabel: 'Conteúdo da nota' }).props.onChangeText('Unsaved draft');
    await flushProfileWrites().catch(() => {});
  });
  expect(JSON.stringify(screen.toJSON())).toContain('Falha ao salvar');
  await act(async () => {
    screen.root.findByProps({ accessibilityLabel: 'Conteúdo da nota' }).props.onChangeText('Retry draft');
    await flushProfileWrites();
  });
  expect(JSON.stringify(screen.toJSON())).toContain('Salvo no aparelho');
  await act(async () => { screen.unmount(); });
});
