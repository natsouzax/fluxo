import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { ChatScreen } from '../ChatScreen';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';
import { useFinanceStore } from '../../store/financeStore';
import { useAgendaStore } from '../../store/agendaStore';
import { useSettingsStore } from '../../store/settingsStore';
import * as remoteService from '../../services/remoteAssistant';

const { act, create } = require('react-test-renderer');
const mockNavigate = jest.fn();
const mockScrollToEnd = jest.fn();
let mockLatestListProps: any;
let mockReducedMotion = false;
let mountedScreen: any;
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('expo-secure-store', () => ({ getItemAsync: async () => null, setItemAsync: async () => {}, deleteItemAsync: async () => {} }));
jest.mock('@expo/vector-icons', () => ({ Feather: 'Icon' }));
jest.mock('react-native-safe-area-context', () => ({
  ...jest.requireActual('react-native-safe-area-context'),
  useSafeAreaInsets: () => ({ top: 24, bottom: 16, left: 0, right: 0 }),
}));
jest.mock('@react-navigation/native', () => ({ useNavigation: () => ({ navigate: mockNavigate }) }));
jest.mock('../../components/TypingIndicator', () => ({ TypingIndicator: () => null }));
jest.mock('../../hooks/useReducedMotion', () => ({ useReducedMotion: () => mockReducedMotion }));
// Native virtualization depends on device layout; render list content synchronously here.
jest.mock('react-native', () => {
  const native = jest.requireActual('react-native');
  const React = require('react');
  const List = React.forwardRef((props: any, ref: any) => {
    mockLatestListProps = props;
    React.useImperativeHandle(ref, () => ({ scrollToEnd: mockScrollToEnd }));
    return React.createElement(native.View, null, props.ListHeaderComponent,
      props.data.map((item: any, index: number) => React.createElement(React.Fragment, { key: item.id }, props.renderItem({ item, index }))),
      props.ListFooterComponent);
  });
  Object.defineProperty(native, 'FlatList', { configurable: true, get: () => List });
  return native;
});

const originalFetch = globalThis.fetch;
beforeEach(async () => {
  useAuthStore.getState().logout();
  await AsyncStorage.clear();
  await useAuthStore.getState().login('chat@fluxo.app', 'secret1');
  mockNavigate.mockClear();
  mockScrollToEnd.mockClear();
  mockReducedMotion = false;
  globalThis.fetch = jest.fn();
});
afterEach(async () => {
  if (mountedScreen) await act(async () => { mountedScreen.unmount(); mountedScreen = null; });
  globalThis.fetch = originalFetch;
  jest.restoreAllMocks();
});

it('greets with current profile data and routes an explicit request from the chat', async () => {
  let screen: any;
  await act(async () => { screen = create(<ChatScreen />); mountedScreen = screen; });
  const rendered = JSON.stringify(screen.toJSON());
  expect(rendered).toContain('Seu dinheiro, suas ideias e sua rotina em um só lugar.');
  expect(rendered).toContain('chat');
  expect(rendered).toContain('registros disponíveis no perfil');
  expect(rendered).toContain('Segue o FLUXO.');
  expect(rendered).not.toContain('Saldo disponível');
  await act(async () => {
    screen.root.findByProps({ accessibilityLabel: 'Mensagem para o Fluxo' }).props.onChangeText('Quero organizar minha rotina');
  });
  await act(async () => { await screen.root.findByProps({ accessibilityLabel: 'Enviar mensagem' }).props.onPress(); });
  expect(mockNavigate).toHaveBeenCalledWith('Agenda');
  expect(globalThis.fetch).not.toHaveBeenCalled();
  expect(useChatStore.getState().isSending).toBe(false);
  await act(async () => { screen.unmount(); });
});

it('grounds the empty-day greeting and disclosure in the current stores', async () => {
  useAgendaStore.setState({ events: [] });
  useFinanceStore.setState({ accounts: [] });
  await act(async () => { mountedScreen = create(<ChatScreen />); });
  const rendered = JSON.stringify(mountedScreen.toJSON());
  expect(rendered).toContain('Nenhum compromisso registrado hoje.');
  expect(rendered).not.toContain('R$ 42.902,27');
  expect(rendered).not.toContain('contas de exemplo');
  expect(rendered).not.toContain('Saldo disponível');
  expect(globalThis.fetch).not.toHaveBeenCalled();
});

it('keeps all three accessible suggestions in a horizontal row and sends their actual prompts', async () => {
  await act(async () => { mountedScreen = create(<ChatScreen />); });
  const row = mountedScreen.root.findByProps({ accessibilityLabel: 'Sugestões de conversa' });
  expect(row.props.horizontal).toBe(true);
  expect(row.props.keyboardShouldPersistTaps).toBe('handled');
  for (const [label, prompt] of [
    ['Consultar saldo', 'Qual e meu saldo?'],
    ['Ver agenda', 'O que tenho hoje?'],
    ['Buscar notas', 'Buscar minhas notas'],
  ]) {
    const button = row.findByProps({ accessibilityLabel: label });
    const style = StyleSheet.flatten(button.props.style);
    expect(style.minHeight).toBeGreaterThanOrEqual(48);
    expect(style.minWidth).toBeGreaterThanOrEqual(48);
    await act(async () => { await button.props.onPress(); });
    expect(useChatStore.getState().messages.filter((message) => message.role === 'user').at(-1)?.content).toBe(prompt);
    expect(useChatStore.getState().isSending).toBe(false);
  }
  expect(globalThis.fetch).not.toHaveBeenCalled();
});

it.each(['android', 'ios'] as const)('avoids the %s keyboard with a safe-area offset', async (platform) => {
  const previous = Platform.OS;
  Object.defineProperty(Platform, 'OS', { configurable: true, value: platform });
  try {
    await act(async () => { mountedScreen = create(<ChatScreen />); });
    const avoiding = mountedScreen.root.findByType(KeyboardAvoidingView);
    expect(avoiding.props.behavior).toBe(platform === 'android' ? 'height' : 'padding');
    expect(avoiding.props.keyboardVerticalOffset).toBe(24);
  } finally {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: previous });
  }
});

it('keeps the real name and today count in the shorter greeting', async () => {
  const at = (dayOffset: number, hour: number) => {
    const date = new Date();
    date.setDate(date.getDate() + dayOffset);
    date.setHours(hour, 0, 0, 0);
    return date.toISOString();
  };
  useAgendaStore.setState({ events: [
    { id: 'one', title: 'Primeiro', start: at(0, 9), end: at(0, 10), source: 'local' },
    { id: 'two', title: 'Segundo', start: at(0, 11), end: at(0, 12), source: 'local' },
    { id: 'tomorrow', title: 'Amanhã', start: at(1, 9), end: at(1, 10), source: 'local' },
  ] });
  await act(async () => { mountedScreen = create(<ChatScreen />); });
  const rendered = JSON.stringify(mountedScreen.toJSON());
  expect(rendered).toContain('chat');
  expect(rendered).toContain('Hoje há 2 compromissos registrados.');
  expect(rendered).toContain('Modo local · sem IA generativa');
  expect(rendered).toContain('registros disponíveis no perfil');
});

it('answers locally without asking for credentials or using the network', async () => {
  let screen: any;
  await act(async () => { screen = create(<ChatScreen />); mountedScreen = screen; });
  await act(async () => {
    screen.root.findByProps({ accessibilityLabel: 'Mensagem para o Fluxo' }).props.onChangeText('Quanto gastei?');
  });
  await act(async () => { await screen.root.findByProps({ accessibilityLabel: 'Enviar mensagem' }).props.onPress(); });
  expect(globalThis.fetch).not.toHaveBeenCalled();
  expect(mockNavigate).not.toHaveBeenCalled();
  expect(useChatStore.getState().messages.at(-1)?.content).toContain('saídas registradas');
  expect(JSON.stringify(screen.toJSON())).toContain('sem IA generativa');
  await act(async () => { screen.unmount(); });
});

it('never claims to have recorded a transaction and leaves records unchanged', async () => {
  const before = useFinanceStore.getState().transactions;
  let screen: any;
  await act(async () => { screen = create(<ChatScreen />); mountedScreen = screen; });
  await act(async () => { screen.root.findByProps({ accessibilityLabel: 'Mensagem para o Fluxo' }).props.onChangeText('Registre 35 de almoço'); });
  await act(async () => { await screen.root.findByProps({ accessibilityLabel: 'Enviar mensagem' }).props.onPress(); });
  expect(useChatStore.getState().messages.at(-1)?.content).toContain('nenhum registro foi alterado');
  expect(useChatStore.getState().isSending).toBe(false);
  expect(useFinanceStore.getState().transactions).toEqual(before);
  expect(globalThis.fetch).not.toHaveBeenCalled();
});

it.each([false, true])('keeps the reader position when content arrives with reduced motion %s', async (reduced) => {
  mockReducedMotion = reduced;
  await act(async () => { mountedScreen = create(<ChatScreen />); });
  await act(async () => {
    mockLatestListProps.onScroll({ nativeEvent: {
      contentOffset: { y: 0 }, layoutMeasurement: { height: 300 }, contentSize: { height: 1000 },
    } });
    mockLatestListProps.onContentSizeChange();
  });
  expect(mockScrollToEnd).not.toHaveBeenCalled();
  await act(async () => {
    mockLatestListProps.onScroll({ nativeEvent: {
      contentOffset: { y: 650 }, layoutMeasurement: { height: 300 }, contentSize: { height: 1000 },
    } });
    mockLatestListProps.onContentSizeChange();
  });
  expect(mockScrollToEnd).toHaveBeenCalledWith({ animated: !reduced });
});

it('discards a late experimental response when the profile changes', async () => {
  jest.spyOn(remoteService, 'devBackendURL').mockReturnValue('http://127.0.0.1:8787');
  useSettingsStore.getState().setExperimentalAIEnabled(true);
  let finish: (value: unknown) => void = () => {};
  globalThis.fetch = jest.fn().mockImplementation(() => new Promise((resolve) => { finish = resolve; }));
  let pending: Promise<void>;
  let screen: any;
  await act(async () => { screen = create(<ChatScreen />); mountedScreen = screen; });
  await act(async () => { screen.root.findByProps({ accessibilityLabel: 'Mensagem para o Fluxo' }).props.onChangeText('Como posso me organizar melhor?'); });
  await act(async () => { pending = screen.root.findByProps({ accessibilityLabel: 'Enviar mensagem' }).props.onPress(); });
  expect(useChatStore.getState().isSending).toBe(true);
  await act(async () => {
    screen.unmount();
    useAuthStore.getState().logout();
    await useAuthStore.getState().login('other-experiment@fluxo.app', 'secret1');
    finish({ ok: true, json: async () => ({ content: 'Private reply', source: 'openrouter' }) });
    await pending!;
  });
  expect(useChatStore.getState().messages).toEqual([]);
  expect(useChatStore.getState().isSending).toBe(false);
});
