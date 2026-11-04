import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AgendaScreen } from '../AgendaScreen';
import { NotesScreen } from '../NotesScreen';
import { SettingsScreen } from '../SettingsScreen';
import { HomeScreen } from '../HomeScreen';
import { NoteCard } from '../../components/NoteCard';
import { EventRow } from '../../components/EventRow';
import { useAgendaStore } from '../../store/agendaStore';
import { useAuthStore } from '../../store/authStore';
import { useNotesStore } from '../../store/notesStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useFinanceStore } from '../../store/financeStore';
import { flushProfileWrites } from '../../store/profileStorage';

const { act, create } = require('react-test-renderer');
const mockNavigate = jest.fn();
const mockNow = new Date(2026, 9, 20, 12);
let screen: any;
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('expo-secure-store', () => {
  const records = new Map<string, string>();
  return {
    getItemAsync: async (key: string) => records.get(key) ?? null,
    setItemAsync: async (key: string, value: string) => { records.set(key, value); },
    deleteItemAsync: async (key: string) => { records.delete(key); },
  };
});
jest.mock('@expo/vector-icons', () => ({ Feather: 'Icon' }));
jest.mock('react-native-chart-kit', () => ({ PieChart: 'Chart' }));
jest.mock('@react-navigation/native', () => ({ useNavigation: () => ({ navigate: mockNavigate }) }));
jest.mock('../../hooks/useNow', () => ({ useNow: () => mockNow }));
jest.mock('../../hooks/useReducedMotion', () => ({ useReducedMotion: () => true }));
jest.mock('../../services/googleAuth', () => ({ hasGoogleClientId: () => false }));
jest.mock('../../services/remoteAssistant', () => ({ devBackendURL: () => undefined }));
jest.mock('react-native', () => {
  const native = jest.requireActual('react-native');
  const React = require('react');
  const List = (props: any) => React.createElement(native.View, null, props.ListHeaderComponent,
    props.data.length ? props.data.map((item: any) => React.createElement(React.Fragment, { key: item.id }, props.renderItem({ item }))) : props.ListEmptyComponent,
    props.ListFooterComponent);
  Object.defineProperty(native, 'FlatList', { configurable: true, get: () => List });
  return native;
});

beforeEach(async () => {
  useAuthStore.getState().logout();
  await AsyncStorage.clear();
  await useAuthStore.getState().login('mockups@fluxo.app', 'secret1');
  mockNavigate.mockClear();
});
afterEach(async () => {
  if (screen) await act(async () => { screen.unmount(); screen = null; });
});

it('searches actual title/body/tags, combines a topic, and opens the matching note or a new editor', async () => {
  const note = (id: string, title: string, body: string, tags: string[], updatedAt: string) => ({ id, title, body, tags, updatedAt, createdAt: updatedAt });
  useNotesStore.setState({ notes: [
    note('one', 'Viagem', 'Reservar hotel', ['Pessoal'], '2026-10-18'),
    note('two', 'Mesa', 'Decisão sobre a sala', ['Casa'], '2026-10-20'),
    note('three', 'Luz', 'Rever orçamento', ['Casa'], '2026-10-19'),
  ] });
  await act(async () => { screen = create(<NotesScreen />); });
  const titles = () => screen.root.findAllByType(NoteCard).map((card: any) => card.props.note.title);
  expect(titles()).toEqual(['Mesa', 'Luz', 'Viagem']);
  await act(async () => screen.root.findByProps({ accessibilityLabel: 'Buscar notas' }).props.onChangeText('DECISAO'));
  expect(titles()).toEqual(['Mesa']);
  await act(async () => screen.root.findByProps({ accessibilityLabel: 'Filtrar assunto Pessoal' }).props.onPress());
  expect(titles()).toEqual([]);
  expect(JSON.stringify(screen.toJSON())).toContain('Nenhuma nota para esta busca.');
  await act(async () => {
    screen.root.findByProps({ accessibilityLabel: 'Buscar notas' }).props.onChangeText('');
    screen.root.findByProps({ accessibilityLabel: 'Filtrar assunto Casa' }).props.onPress();
  });
  expect(titles()).toEqual(['Mesa', 'Luz']);
  await act(async () => screen.root.findAllByType(NoteCard)[0].props.onPress());
  expect(mockNavigate).toHaveBeenLastCalledWith('NoteEditor', { noteId: 'two' });
  await act(async () => screen.root.findByProps({ accessibilityLabel: 'Criar nova nota' }).props.onPress());
  expect(mockNavigate).toHaveBeenLastCalledWith('NoteEditor', {});
  await act(async () => {
    screen.root.findByProps({ accessibilityLabel: 'Mostrar todas as notas' }).props.onPress();
    screen.root.findByProps({ accessibilityLabel: 'Buscar notas' }).props.onChangeText('pessoal');
  });
  expect(titles()).toEqual(['Viagem']);
});

it('shows honest empty notes and still allows creation', async () => {
  useNotesStore.setState({ notes: [] });
  await act(async () => { screen = create(<NotesScreen />); });
  expect(screen.root.findAllByType(NoteCard)).toHaveLength(0);
  expect(screen.root.findAllByProps({ accessibilityLabel: 'Buscar notas' })).toHaveLength(0);
  expect(JSON.stringify(screen.toJSON())).toContain('Crie sua primeira nota.');
  await act(async () => screen.root.findByProps({ accessibilityLabel: 'Criar nova nota' }).props.onPress());
  expect(mockNavigate).toHaveBeenCalledWith('NoteEditor', {});
});

it('filters real events by selected day, crosses a month by week, and returns to today', async () => {
  const event = (id: string, start: string) => ({ id, title: id, start,
    end: start === '2026-09-30' ? '2026-10-01' : start, source: 'local' as const });
  useAgendaStore.setState({ events: [event('Hoje real', '2026-10-20T09:00:00'), event('Amanhã real', '2026-10-21T10:00:00'), event('Setembro real', '2026-09-30')] });
  await act(async () => { screen = create(<AgendaScreen />); });
  const titles = () => screen.root.findAllByType(EventRow).map((row: any) => row.props.event.title);
  const dayLabel = (date: Date) => date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  expect(titles()).toEqual(['Hoje real']);
  await act(async () => screen.root.findByProps({ accessibilityLabel: dayLabel(new Date(2026, 9, 21)) }).props.onPress());
  expect(titles()).toEqual(['Amanhã real']);
  for (let i = 0; i < 3; i++) await act(async () => screen.root.findByProps({ accessibilityLabel: 'Semana anterior' }).props.onPress());
  expect(titles()).toEqual(['Setembro real']);
  await act(async () => screen.root.findByProps({ accessibilityLabel: 'Próxima semana' }).props.onPress());
  expect(titles()).toEqual([]);
  expect(JSON.stringify(screen.toJSON())).toContain('Nenhum compromisso registrado para');
  await act(async () => screen.root.findByProps({ accessibilityLabel: 'Voltar para hoje' }).props.onPress());
  expect(titles()).toEqual(['Hoje real']);
});

it('applies and persists the explicit theme through the visible appearance controls', async () => {
  await act(async () => { screen = create(<SettingsScreen />); });
  expect(JSON.stringify(screen.toJSON())).toContain('Do seu jeito.');
  await act(async () => {
    screen.root.findByProps({ accessibilityLabel: 'Tema Escuro' }).props.onPress();
    await flushProfileWrites();
  });
  expect(useSettingsStore.getState().themePreference).toBe('dark');
  expect(JSON.stringify(screen.toJSON())).toContain('#101610');
  await act(async () => { screen.unmount(); screen = null; });
  useAuthStore.getState().logout();
  await useAuthStore.getState().login('mockups@fluxo.app', 'secret1');
  expect(useSettingsStore.getState().themePreference).toBe('dark');
  await act(async () => { screen = create(<SettingsScreen />); });
  await act(async () => screen.root.findByProps({ accessibilityLabel: 'Tema Claro' }).props.onPress());
  expect(JSON.stringify(screen.toJSON())).toContain('#F6F5EF');
  await act(async () => screen.root.findByProps({ accessibilityLabel: 'Configurar bancos e Google' }).props.onPress());
  expect(mockNavigate).toHaveBeenCalledWith('Connections');
});

it('keeps finance totals and monthly budget grounded in the current records', async () => {
  useFinanceStore.setState({
    accounts: [{ id: 'a', institution: 'Exemplo', nickname: 'Conta', balance: 925, currency: 'BRL', kind: 'checking', color: '#163D36', isMock: true, lastSyncedAt: null }],
    transactions: [
      { id: 'in', accountId: 'a', description: 'Entrada real', merchant: '', category: 'Salário', amount: 1000, direction: 'in', date: '2026-10-02T12:00:00' },
      { id: 'out', accountId: 'a', description: 'Compra real', merchant: '', category: 'Casa', amount: 75, direction: 'out', date: '2026-10-03T12:00:00' },
      { id: 'previous', accountId: 'a', description: 'Mês anterior', merchant: '', category: 'Casa', amount: 200, direction: 'out', date: '2026-09-03T12:00:00' },
    ],
    budgets: [{ id: 'budget', category: 'Casa', limit: 300, spent: 999, color: '#163D36' }],
  });
  useSettingsStore.getState().setThemePreference('dark');
  await act(async () => { screen = create(<HomeScreen />); });
  const rendered = JSON.stringify(screen.toJSON());
  // Currency grouping may use a non-breaking space; normalize rendered strings.
  const text = rendered.replace(/\u00a0/g, ' ');
  expect(text).toContain('R$ 925,00');
  expect(text).toContain('R$ 1.000,00');
  expect(text).toContain('R$ 75,00');
  const visibleText = (node: any): string => typeof node === 'string' ? node
    : Array.isArray(node) ? node.map(visibleText).join('') : visibleText(node?.children ?? []);
  expect(visibleText(screen.toJSON())).toContain('25% usado');
  expect(text).not.toContain('999,00');
  expect(text).toContain('Últimos registros');
  expect(text).toContain('#202F25');
});
