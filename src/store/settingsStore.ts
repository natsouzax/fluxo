import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { secureProfileStorage } from './profileStorage';

interface ConnectionStatus {
  connected: boolean;
  connectedAt: string | null;
  providerLabel: string | null;
}

const disconnected: ConnectionStatus = { connected: false, connectedAt: null, providerLabel: null };

interface SettingsState {
  experimentalAIEnabled: boolean;
  setExperimentalAIEnabled: (enabled: boolean) => void;
  googleConnection: ConnectionStatus;
  googleAccessToken: string | null;
  googleTokenExpiresAt: string | null;
  setGoogleToken: (token: string | null, expiresAt?: string | null) => void;
  deviceCalendarIds: string[];
  setDeviceCalendarIds: (ids: string[]) => void;
  openFinanceConnection: ConnectionStatus;
  themePreference: 'dark' | 'light';
  setThemePreference: (preference: 'dark' | 'light') => void;
  setGoogleConnection: (status: ConnectionStatus) => void;
  setOpenFinanceConnection: (status: ConnectionStatus) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      experimentalAIEnabled: false,
      setExperimentalAIEnabled: (enabled) => set({ experimentalAIEnabled: enabled }),
      googleConnection: disconnected,
      googleAccessToken: null,
      googleTokenExpiresAt: null,
      setGoogleToken: (googleAccessToken, googleTokenExpiresAt = null) => set({ googleAccessToken, googleTokenExpiresAt }),
      deviceCalendarIds: [],
      setDeviceCalendarIds: (deviceCalendarIds) => set({ deviceCalendarIds }),
      openFinanceConnection: disconnected,
      themePreference: 'light',
      setThemePreference: (themePreference) => set({ themePreference }),
      setGoogleConnection: (status) => set({ googleConnection: status }),
      setOpenFinanceConnection: (status) => set({ openFinanceConnection: status }),
    }),
    {
      name: 'fluxo-settings-secure',
      storage: createJSONStorage(() => secureProfileStorage),
      skipHydration: true,
      version: 2,
      // Existing BYOK credentials are discarded and the profile record is rewritten without them.
      migrate: (value) => settingsData(value),
      merge: (value, current) => ({ ...current, ...settingsData(value) }),
      partialize: ({ experimentalAIEnabled, googleConnection, googleAccessToken, googleTokenExpiresAt, deviceCalendarIds, openFinanceConnection, themePreference }) =>
        ({ experimentalAIEnabled, googleConnection, googleAccessToken, googleTokenExpiresAt, deviceCalendarIds, openFinanceConnection, themePreference }),
    }
  )
);

function settingsData(value: unknown) {
  const data = (value ?? {}) as Partial<SettingsState>;
  return {
    experimentalAIEnabled: data.experimentalAIEnabled === true,
    googleConnection: data.googleConnection ?? disconnected,
    googleAccessToken: data.googleAccessToken ?? null,
    googleTokenExpiresAt: data.googleTokenExpiresAt ?? null,
    deviceCalendarIds: Array.isArray(data.deviceCalendarIds) ? data.deviceCalendarIds : [],
    openFinanceConnection: data.openFinanceConnection?.providerLabel === 'Contas de exemplo'
      ? disconnected
      : data.openFinanceConnection ?? disconnected,
    themePreference: data.themePreference === 'dark' ? 'dark' as const : 'light' as const,
  };
}
