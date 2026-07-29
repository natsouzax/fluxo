import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface AuthUser {
  name: string;
  email: string;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

// Pre-saved test account — there's no backend/DB yet, so this is the one
// account guaranteed to exist. The login screen comes pre-filled with it.
export const TEST_ACCOUNT = {
  name: 'Usuário Teste',
  email: 'teste@fluxo.app',
  password: 'fluxo123',
};

// Mock auth: there's no backend yet, so any well-formed email/password
// combo succeeds locally. Swap this for a real API call when one exists.
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: async (email) => {
        await new Promise((r) => setTimeout(r, 500));
        const name = email.trim().toLowerCase() === TEST_ACCOUNT.email ? TEST_ACCOUNT.name : email.split('@')[0];
        set({ user: { name, email }, isAuthenticated: true });
      },
      signUp: async (name, email) => {
        await new Promise((r) => setTimeout(r, 500));
        set({ user: { name, email }, isAuthenticated: true });
      },
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: 'fluxo-auth',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
