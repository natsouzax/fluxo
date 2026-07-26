import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { AgendaEvent } from '../data/types';

interface AgendaState {
  events: AgendaEvent[];
  addEvent: (event: AgendaEvent) => void;
  removeEvent: (id: string) => void;
  replaceGoogleEvents: (events: AgendaEvent[]) => void;
}

function todayAt(hour: number, minute = 0): string {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

const seedEvents: AgendaEvent[] = [
  {
    id: 'e1',
    title: 'Revisar orçamento do mês',
    start: todayAt(9, 0),
    end: todayAt(9, 30),
    source: 'local',
    financeRelated: true,
  },
  {
    id: 'e2',
    title: 'Vencimento fatura Nubank',
    start: todayAt(23, 0),
    end: todayAt(23, 30),
    source: 'local',
    financeRelated: true,
    notes: 'Fatura de R$ 1.876,40',
  },
];

export const useAgendaStore = create<AgendaState>()(
  persist(
    (set) => ({
      events: seedEvents,
      addEvent: (event) => set((state) => ({ events: [...state.events, event] })),
      removeEvent: (id) => set((state) => ({ events: state.events.filter((e) => e.id !== id) })),
      replaceGoogleEvents: (googleEvents) =>
        set((state) => ({
          events: [...state.events.filter((e) => e.source !== 'google'), ...googleEvents],
        })),
    }),
    {
      name: 'fluxo-agenda',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
