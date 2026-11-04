import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { StateStorage } from 'zustand/middleware';

let profile: string | null = null;
let generation = 0;
const writes = new Map<string, Promise<void>>();
const failures = new Map<string, unknown>();

export function profileId(email: string): string {
  // SecureStore accepts only alphanumeric characters, dots, dashes and underscores.
  return Array.from(email.trim().toLowerCase())
    .map((character) => character.codePointAt(0)!.toString(16).padStart(6, '0'))
    .join('');
}

export function bindProfile(email: string | null): number {
  profile = email ? profileId(email) : null;
  return ++generation;
}

export function sessionGeneration(): number {
  return generation;
}

export function isCurrentSession(token: number): boolean {
  return profile !== null && token === generation;
}

export function profileStorageKey(name: string, email: string): string {
  return `fluxo.v2.${profileId(email)}.${name}`;
}

function scopedStorage(base: StateStorage): StateStorage {
  return {
    getItem: async (name) => {
      if (!profile) return null;
      const token = generation;
      const key = `fluxo.v2.${profile}.${name}`;
      await writes.get(key);
      const value = await base.getItem(key);
      // A late hydration must never merge another profile into the active stores.
      if (!isCurrentSession(token)) throw new Error('Sessão alterada.');
      return value;
    },
    setItem: (name, value) => {
      if (!profile) return Promise.resolve();
      const key = `fluxo.v2.${profile}.${name}`;
      // Capture the owner now; a queued write must not follow the next login.
      const pending = (writes.get(key) ?? Promise.resolve()).then(async () => {
        try {
          await base.setItem(key, value);
          failures.delete(key);
        } catch (error) {
          failures.set(key, error);
        }
      });
      writes.set(key, pending);
      return pending;
    },
    removeItem: async (name) => {
      if (!profile) return;
      const key = `fluxo.v2.${profile}.${name}`;
      await writes.get(key);
      await base.removeItem(key);
    },
  };
}

export async function flushProfileWrites(): Promise<void> {
  if (!profile) return;
  const prefix = `fluxo.v2.${profile}.`;
  const pending = [...writes.entries()].filter(([key]) => key.startsWith(prefix));
  await Promise.all(pending.map(([, promise]) => promise));
  if ([...failures.keys()].some((key) => key.startsWith(prefix))) {
    throw new Error('Não foi possível salvar no aparelho. Tente novamente.');
  }
}

export const profileStorage = scopedStorage(AsyncStorage);
export const secureProfileStorage = scopedStorage({
  getItem: (name) => SecureStore.getItemAsync(name),
  setItem: (name, value) => SecureStore.setItemAsync(name, value),
  removeItem: (name) => SecureStore.deleteItemAsync(name),
});
