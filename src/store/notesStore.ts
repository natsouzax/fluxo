import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { Note } from '../data/types';

interface NotesState {
  notes: Note[];
  upsertNote: (note: Note) => void;
  deleteNote: (id: string) => void;
}

const seedNotes: Note[] = [
  {
    id: 'n1',
    title: 'Metas do mês',
    body: 'Reduzir gastos com iFood para no máximo R$ 400.\nSeparar R$ 500 para a reserva de emergência.',
    tags: ['financas', 'metas'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'n2',
    title: 'Ideias para a viagem ao Chile',
    body: 'Pesquisar passagens em janeiro.\nVer se dá pra usar milhas do cartão Nubank.',
    tags: ['viagem'],
    linkedGoalId: 'g2',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const useNotesStore = create<NotesState>()(
  persist(
    (set) => ({
      notes: seedNotes,
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
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
