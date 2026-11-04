import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { closeProfile, openProfile } from './profileSession';

interface AuthUser { name: string; email: string }
interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isReady: boolean;
  initializationError: string | null;
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

let revision = 0;
let initialization: Promise<void> | null = null;

// Local demonstration profiles, not server authentication. Email is not a security boundary.
export const useAuthStore = create<AuthState>()(persist((set, get) => {
  async function enter(user: AuthUser) {
    const attempt = ++revision;
    // Keep the login form mounted so hydration errors can be shown by its caller.
    set({ isAuthenticated: false, initializationError: null });
    try {
      await openProfile(user.email);
      if (attempt !== revision) return;
      set({ user, isAuthenticated: true, isReady: true });
    } catch (error) {
      if (attempt !== revision) return;
      closeProfile();
      set({ user: null, isAuthenticated: false, isReady: true });
      throw error;
    }
  }
  return {
    user: null, isAuthenticated: false, isReady: false, initializationError: null,
    initialize: () => {
      if (get().isReady) return Promise.resolve();
      if (initialization) return initialization;
      initialization = (async () => {
        await useAuthStore.persist.rehydrate();
        const { user, isAuthenticated } = get();
        if (!useAuthStore.persist.hasHydrated()) throw new Error('Não foi possível carregar a sessão.');
        if (user && isAuthenticated) await enter({ ...user, email: user.email.trim().toLowerCase() });
        else set({ isReady: true });
      })().catch(() => {
        closeProfile();
        set({ user: null, isAuthenticated: false, isReady: true,
          initializationError: 'Não foi possível carregar a sessão. Entre novamente.' });
      }).finally(() => { initialization = null; });
      return initialization;
    },
    login: async (email, password) => {
      const normalized = email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) || password.length < 6) {
        throw new Error('Confira o e-mail e a senha (mínimo de 6 caracteres).');
      }
      await enter({ name: normalized.split('@')[0], email: normalized });
    },
    signUp: async (name, email, password) => {
      if (!name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || password.length < 6) {
        throw new Error('Confira nome, e-mail e senha.');
      }
      await enter({ name: name.trim(), email: email.trim().toLowerCase() });
    },
    logout: () => {
      ++revision;
      closeProfile();
      set({ user: null, isAuthenticated: false, isReady: true });
    },
  };
}, {
  name: 'fluxo-auth',
  storage: createJSONStorage(() => AsyncStorage),
  skipHydration: true,
  partialize: ({ user, isAuthenticated }) => ({ user, isAuthenticated }),
}));
