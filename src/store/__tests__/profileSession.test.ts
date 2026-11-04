import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '../authStore';
import { useNotesStore } from '../notesStore';
import { useChatStore } from '../chatStore';
import { useSettingsStore } from '../settingsStore';
import { useFinanceStore } from '../financeStore';
import { useAgendaStore } from '../agendaStore';
import { flushProfileWrites, isCurrentSession, profileStorageKey, sessionGeneration } from '../profileStorage';
import { closeProfile } from '../profileSession';

jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('expo-secure-store', () => {
  const disk = new Map<string, string>();
  return { getItemAsync: jest.fn(async (key: string) => disk.get(key) ?? null),
    setItemAsync: jest.fn(async (key: string, value: string) => { disk.set(key, value); }),
    deleteItemAsync: jest.fn(async (key: string) => { disk.delete(key); }) };
});

beforeEach(async () => {
  await flushProfileWrites();
  useAuthStore.getState().logout();
  await AsyncStorage.clear();
});

it('isolates all domains and settings, clears memory on logout, and restores the original profile', async () => {
  await useAuthStore.getState().login('  A@fluxo.app ', 'secret1');
  const token = sessionGeneration();
  useNotesStore.getState().upsertNote({ id: 'private-a', title: 'Private A', body: 'secret', tags: [], createdAt: '', updatedAt: '' });
  useChatStore.getState().addMessage({ id: 'private-chat-a', role: 'user', content: 'Private chat', createdAt: '' });
  useSettingsStore.getState().setOpenFinanceConnection({ connected: true, connectedAt: '', providerLabel: 'A only' });
  useAgendaStore.getState().addEvent({ id: 'private-event-a', title: 'Private appointment', start: '', end: '', source: 'local' });
  const account = { id: 'user-account-a', institution: 'Banco', kind: 'checking' as const, nickname: 'Conta própria',
    balance: 100, currency: 'BRL', color: '#000', lastSyncedAt: null };
  useFinanceStore.setState({ accounts: [account] });
  useFinanceStore.getState().addTransaction({ id: 'private-tx-a', accountId: account.id, description: 'Private purchase',
    merchant: '', category: 'Saúde', amount: 10, direction: 'out', date: new Date().toISOString() });
  await flushProfileWrites();
  useAuthStore.getState().logout();
  expect(isCurrentSession(token)).toBe(false);
  expect(useSettingsStore.getState().openFinanceConnection.connected).toBe(false);
  expect(useNotesStore.getState().notes.some((note) => note.id === 'private-a')).toBe(false);

  await useAuthStore.getState().login('b@fluxo.app', 'secret2');
  expect(useNotesStore.getState().notes.some((note) => note.id === 'private-a')).toBe(false);
  expect(useChatStore.getState().messages).toEqual([]);
  expect(useAgendaStore.getState().events.some((event) => event.id === 'private-event-a')).toBe(false);
  expect(useFinanceStore.getState().transactions.some((tx) => tx.id === 'private-tx-a')).toBe(false);
  expect(useSettingsStore.getState().openFinanceConnection.connected).toBe(false);

  await useAuthStore.getState().login('a@fluxo.app', 'secret1');
  expect(useNotesStore.getState().notes.find((note) => note.id === 'private-a')?.body).toBe('secret');
  expect(useChatStore.getState().messages[0].id).toBe('private-chat-a');
  expect(useSettingsStore.getState().openFinanceConnection.providerLabel).toBe('A only');
  expect(useFinanceStore.getState().accounts[0].balance).toBe(account.balance - 10);
});

it('never rehydrates an in-flight sending flag after restarting', async () => {
  const email = 'interrupted@fluxo.app';
  await AsyncStorage.setItem(profileStorageKey('fluxo-chat', email), JSON.stringify({ version: 0, state: {
    messages: [{ id: 'pending', role: 'user', content: 'Hello', createdAt: '' }], isSending: true,
  } }));
  await useAuthStore.getState().login(email, 'secret1');
  expect(useChatStore.getState().isSending).toBe(false);
  useChatStore.getState().setSending(true);
  await flushProfileWrites();
  const persisted = JSON.parse((await AsyncStorage.getItem(profileStorageKey('fluxo-chat', email)))!);
  expect(persisted.state.isSending).toBeUndefined();
  useAuthStore.getState().logout();
  await useAuthStore.getState().login(email, 'secret1');
  expect(useChatStore.getState().isSending).toBe(false);
  expect(useChatStore.getState().messages[0].content).toBe('Hello');
});

it('removes saved assistant replies that exposed the old sample balances', async () => {
  const email = 'legacy-chat@fluxo.app';
  await AsyncStorage.setItem(profileStorageKey('fluxo-chat', email), JSON.stringify({ version: 0, state: {
    messages: [
      { id: 'question', role: 'user', content: 'Qual meu saldo?', createdAt: '' },
      { id: 'sample-reply', role: 'assistant', content: 'Saldo somado das contas de exemplo: R$ 42.902,27.', createdAt: '' },
      { id: 'personal-reply', role: 'assistant', content: 'Anotei sua preferência de horário.', createdAt: '' },
    ],
  } }));
  await useAuthStore.getState().login(email, 'secret1');
  expect(useChatStore.getState().messages.map(({ id }) => id)).toEqual(['question', 'personal-reply']);
  await flushProfileWrites();
  const savedChat = await AsyncStorage.getItem(profileStorageKey('fluxo-chat', email));
  expect(savedChat).not.toContain('42.902,27');
});

it('lets a profile add its own account and records income or expense against that balance', async () => {
  await useAuthStore.getState().login('manual-finance@fluxo.app', 'secret1');
  useFinanceStore.getState().addAccount({ id: 'own-account', nickname: 'Minha conta', institution: 'Meu banco',
    kind: 'checking', balance: 500, currency: 'BRL', color: '#163D36', lastSyncedAt: null });
  useFinanceStore.getState().addTransaction({ id: 'own-income', accountId: 'own-account', description: 'Pagamento',
    merchant: '', category: 'Salário', amount: 1000, direction: 'in', date: new Date().toISOString() });
  useFinanceStore.getState().addTransaction({ id: 'own-expense', accountId: 'own-account', description: 'Mercado',
    merchant: '', category: 'Alimentação', amount: 80, direction: 'out', date: new Date().toISOString() });
  expect(useFinanceStore.getState().accounts[0].balance).toBe(1420);
  expect(useFinanceStore.getState().transactions.map(({ id }) => id)).toEqual(['own-expense', 'own-income']);
});

it('creates or updates a monthly category budget without duplicating its category', async () => {
  await useAuthStore.getState().login('own-budget@fluxo.app', 'secret1');
  useFinanceStore.getState().addBudget({ id: 'budget-food', category: 'Mercado', limit: 500, spent: 0, color: '#000' });
  useFinanceStore.getState().addBudget({ id: 'budget-new', category: 'mercado', limit: 650, spent: 0, color: '#fff' });
  expect(useFinanceStore.getState().budgets).toHaveLength(1);
  expect(useFinanceStore.getState().budgets[0].limit).toBe(650);
});

it('pays a recurring bill from its selected account and schedules its next month', async () => {
  await useAuthStore.getState().login('own-bills@fluxo.app', 'secret1');
  useFinanceStore.getState().addAccount({ id: 'bill-account', nickname: 'Conta corrente', institution: 'Banco',
    kind: 'checking', balance: 500, currency: 'BRL', color: '#163D36', lastSyncedAt: null });
  useFinanceStore.getState().addBill({ id: 'rent', title: 'Aluguel', amount: 100, dueDate: '2026-01-31',
    category: 'Moradia', accountId: 'bill-account', recurrence: 'monthly', paid: false });
  useFinanceStore.getState().payBill('rent');
  expect(useFinanceStore.getState().accounts[0].balance).toBe(400);
  expect(useFinanceStore.getState().transactions[0].description).toBe('Aluguel');
  expect(useFinanceStore.getState().bills[0]).toMatchObject({ dueDate: '2026-02-28', paid: false });
});

it('preserves unowned legacy data without automatically exposing it to a new profile', async () => {
  const legacy = JSON.stringify({ state: { notes: [{ id: 'unowned', body: 'private legacy' }] }, version: 0 });
  await AsyncStorage.setItem('fluxo-notes', legacy);
  await useAuthStore.getState().login('new-profile@fluxo.app', 'secret1');
  expect(useNotesStore.getState().notes.some((note) => note.id === 'unowned')).toBe(false);
  expect(await AsyncStorage.getItem('fluxo-notes')).toBe(legacy);
});

it('does not authenticate when a profile cannot be hydrated', async () => {
  jest.mocked(SecureStore.getItemAsync).mockRejectedValueOnce(new Error('storage unavailable'));
  await expect(useAuthStore.getState().login('broken@fluxo.app', 'secret1')).rejects.toThrow('carregar');
  expect(useAuthStore.getState().isAuthenticated).toBe(false);
  expect(useSettingsStore.getState().openFinanceConnection.connected).toBe(false);
});

it('migrates profile settings without retaining a former personal API key or consent', async () => {
  const email = 'legacy-settings@fluxo.app';
  const key = profileStorageKey('fluxo-settings-secure', email);
  await SecureStore.setItemAsync(key, JSON.stringify({ version: 0, state: {
    anthropicApiKey: 'old-test-key', aiContextConsent: true, themePreference: 'light',
    googleConnection: { connected: true, connectedAt: '', providerLabel: 'Google' },
  } }));
  await useAuthStore.getState().login(email, 'secret1');
  await flushProfileWrites();
  expect(useSettingsStore.getState()).not.toHaveProperty('anthropicApiKey');
  expect(useSettingsStore.getState()).not.toHaveProperty('aiContextConsent');
  expect(useSettingsStore.getState().googleConnection.connected).toBe(true);
  expect(useSettingsStore.getState().themePreference).toBe('light');
  const record = JSON.parse((await SecureStore.getItemAsync(key))!);
  expect(record.state).not.toHaveProperty('anthropicApiKey');
  expect(record.state).not.toHaveProperty('aiContextConsent');
});

it('restores the saved session only after the profile data is loaded', async () => {
  await useAuthStore.getState().login('startup@fluxo.app', 'secret1');
  useNotesStore.getState().upsertNote({ id: 'startup-note', title: 'Saved', body: 'Restored', tags: [], createdAt: '', updatedAt: '' });
  await flushProfileWrites();
  const auth = await AsyncStorage.getItem('fluxo-auth');
  closeProfile();
  useAuthStore.setState({ user: null, isAuthenticated: false, isReady: false });
  await AsyncStorage.setItem('fluxo-auth', auth!);
  const initializing = useAuthStore.getState().initialize();
  expect(useAuthStore.getState().isReady).toBe(false);
  await initializing;
  expect(useAuthStore.getState().isReady).toBe(true);
  expect(useAuthStore.getState().isAuthenticated).toBe(true);
  expect(useNotesStore.getState().notes.find((note) => note.id === 'startup-note')?.body).toBe('Restored');
});

it('ignores a late hydration from a superseded login', async () => {
  const originalRead = jest.mocked(AsyncStorage.getItem).getMockImplementation()!;
  let release: (value: string | null) => void = () => {};
  const delayedKey = profileStorageKey('fluxo-notes', 'slow@fluxo.app');
  const read = jest.spyOn(AsyncStorage, 'getItem').mockImplementation((key) => key === delayedKey
    ? new Promise((resolve) => { release = resolve; }) : originalRead(key));
  const slow = useAuthStore.getState().login('slow@fluxo.app', 'secret1');
  // Allow all reads to start before switching profile.
  await new Promise((resolve) => setTimeout(resolve, 0));
  await useAuthStore.getState().login('fast@fluxo.app', 'secret1');
  release(JSON.stringify({ version: 0, state: { notes: [{ id: 'leak', body: 'Slow private data' }] } }));
  await slow;
  expect(useAuthStore.getState().user?.email).toBe('fast@fluxo.app');
  expect(useNotesStore.getState().notes.some((note) => note.id === 'leak')).toBe(false);
  read.mockImplementation(originalRead);
});

it('keeps queued edits owned by A when B logs in before the disk write finishes', async () => {
  await useAuthStore.getState().login('queued-a@fluxo.app', 'secret1');
  const originalWrite = jest.mocked(AsyncStorage.setItem).getMockImplementation()!;
  const keyA = profileStorageKey('fluxo-notes', 'queued-a@fluxo.app');
  let release: () => void = () => {};
  const gate = new Promise<void>((resolve) => { release = resolve; });
  const write = jest.spyOn(AsyncStorage, 'setItem').mockImplementation(async (key, value) => {
    if (key === keyA) await gate;
    return originalWrite(key, value);
  });
  const note = { id: 'queued-a-note', title: 'First', body: 'First', tags: [], createdAt: '', updatedAt: '' };
  useNotesStore.getState().upsertNote(note);
  useNotesStore.getState().upsertNote({ ...note, body: 'Latest edit' });
  useAuthStore.getState().logout();
  await useAuthStore.getState().login('queued-b@fluxo.app', 'secret1');
  expect(useNotesStore.getState().notes.some((item) => item.id === note.id)).toBe(false);
  release();
  await useAuthStore.getState().login('queued-a@fluxo.app', 'secret1');
  expect(useNotesStore.getState().notes.find((item) => item.id === note.id)?.body).toBe('Latest edit');
  write.mockImplementation(originalWrite);
});
