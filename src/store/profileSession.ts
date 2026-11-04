import { useAgendaStore } from './agendaStore';
import { useChatStore } from './chatStore';
import { useDrawerStore } from './drawerStore';
import { useFinanceStore } from './financeStore';
import { useNotesStore } from './notesStore';
import { bindProfile, isCurrentSession } from './profileStorage';
import { useSettingsStore } from './settingsStore';
import { useTasksStore } from './tasksStore';
import { cancelOrganizationReminders } from '../services/organizationNotifications';

const stores = [useAgendaStore, useChatStore, useFinanceStore, useNotesStore, useSettingsStore, useTasksStore];

export function closeProfile(): void {
  bindProfile(null);
  void cancelOrganizationReminders().catch(() => {});
  // Writes are disabled while resetting; saved profiles remain on disk.
  useAgendaStore.setState(useAgendaStore.getInitialState(), true);
  useChatStore.setState(useChatStore.getInitialState(), true);
  useFinanceStore.setState(useFinanceStore.getInitialState(), true);
  useNotesStore.setState(useNotesStore.getInitialState(), true);
  useSettingsStore.setState(useSettingsStore.getInitialState(), true);
  useTasksStore.setState(useTasksStore.getInitialState(), true);
  useDrawerStore.getState().close();
}

export async function openProfile(email: string): Promise<void> {
  closeProfile();
  const token = bindProfile(email);
  await Promise.all(stores.map((store) => store.persist.rehydrate()));
  if (!isCurrentSession(token)) throw new Error('Sessão alterada.');
  if (stores.some((store) => !store.persist.hasHydrated())) {
    closeProfile();
    throw new Error('Não foi possível carregar os dados deste perfil. Tente novamente.');
  }
}
