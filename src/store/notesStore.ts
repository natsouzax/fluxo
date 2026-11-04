import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { Note } from '../data/types';
import { profileStorage } from './profileStorage';

interface NotesState {
  notes: Note[];
  upsertNote: (note: Note) => void;
  deleteNote: (id: string) => void;
}

export const useNotesStore = create<NotesState>()(
  persist(
    (set) => ({
      notes: [],
      upsertNote: (note) =>
        set((state) => {
          const exists = state.notes.some((n) => n.id === note.id);
          return {
            notes: exists
              ? state.notes.map((n) => (n.id === note.id ? note : n))
              : [note, ...state.notes],
          };
        }),
      deleteNote: (id) => set((state) => ({ notes: state.notes.filter((n) => n.id !== id) })),
    }),
    {
      name: 'fluxo-notes',
      storage: createJSONStorage(() => profileStorage),
      skipHydration: true,
      version: 1,
      migrate: (persisted) => ({
        notes: ((persisted as { notes?: Note[] } | undefined)?.notes ?? [])
          .filter((note) => !['n1', 'n2'].includes(note.id)),
      }),
      partialize: ({ notes }) => ({ notes }),
    }
  )
);
