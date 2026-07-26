import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import { createJSONStorage, persist, StateStorage } from 'zustand/middleware';

// Settings can hold API keys, so this is persisted via SecureStore
// (Android Keystore-backed) instead of plain AsyncStorage.
const secureStorage: StateStorage = {
  getItem: async (name) => (await SecureStore.getItemAsync(name)) ?? null,
  setItem: async (name, value) => SecureStore.setItemAsync(name, value),
  removeItem: async (name) => SecureStore.deleteItemAsync(name),
};

interface ConnectionStatus {
  connected: boolean;
  connectedAt: string | null;
  providerLabel: string | null;
}

const disconnected: ConnectionStatus = { connected: false, connectedAt: null, providerLabel: null };

interface SettingsState {
  anthropicApiKey: string | null;
  googleConnection: ConnectionStatus;
  openFinanceConnection: ConnectionStatus;
  themePreference: 'dark' | 'light';
  setAnthropicApiKey: (key: string | null) => void;
  setGoogleConnection: (status: ConnectionStatus) => void;
  setOpenFinanceConnection: (status: ConnectionStatus) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      anthropicApiKey: null,
      googleConnection: disconnected,
      openFinanceConnection: disconnected,
      themePreference: 'dark',
      setAnthropicApiKey: (key) => set({ anthropicApiKey: key }),
      setGoogleConnection: (status) => set({ googleConnection: status }),
      setOpenFinanceConnection: (status) => set({ openFinanceConnection: status }),
    }),
    {
      name: 'fluxo-settings-secure',
      storage: createJSONStorage(() => secureStorage),
    }
  )
);
