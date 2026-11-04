import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { AgendaEvent } from '../data/types';
import { profileStorage } from './profileStorage';

interface AgendaState {
  events: AgendaEvent[];
  addEvent: (event: AgendaEvent) => void;
  removeEvent: (id: string) => void;
  replaceGoogleEvents: (events: AgendaEvent[]) => void;
  replaceDeviceEvents: (events: AgendaEvent[]) => void;
  saveLocalEvent: (event: AgendaEvent, originalId?: string, occurrenceDate?: string, scope?: 'one' | 'future') => void;
  deleteLocalEvent: (id: string, occurrenceDate?: string, scope?: 'one' | 'future') => void;
}

export const useAgendaStore = create<AgendaState>()(
  persist(
    (set) => ({
      events: [],
      addEvent: (event) => set((state) => ({ events: [...state.events, event] })),
      removeEvent: (id) => set((state) => ({ events: state.events.filter((e) => e.id !== id) })),
      saveLocalEvent: (event, originalId, occurrenceDate, scope = 'future') => {
        if (!event.title.trim() || event.source !== 'local' || !Number.isFinite(Date.parse(event.start)) || Date.parse(event.end) <= Date.parse(event.start)) {
          throw new Error('Confira título, início e fim do compromisso.');
        }
        set((state) => {
          const original = state.events.find((item) => item.id === originalId);
          if (!original || !original.recurrence || original.recurrence === 'none' || !occurrenceDate) {
            return { events: [...state.events.filter((item) => item.id !== (originalId ?? event.id)), event] };
          }
          if (original.source !== 'local') throw new Error('Edite este evento no calendário de origem.');
          if (scope === 'one') return { events: [...state.events.map((item) => item.id === originalId
            ? { ...item, excludedDates: [...(item.excludedDates ?? []), occurrenceDate] } : item),
            { ...event, recurrence: 'none', excludedDates: [], recurrenceUntil: null }] };
          const previous = new Date(`${occurrenceDate}T12:00:00`); previous.setDate(previous.getDate() - 1);
          const endKey = `${previous.getFullYear()}-${String(previous.getMonth() + 1).padStart(2, '0')}-${String(previous.getDate()).padStart(2, '0')}`;
          return { events: [...state.events.map((item) => item.id === originalId ? { ...item, recurrenceUntil: endKey } : item),
            { ...event, excludedDates: [], recurrenceUntil: original.recurrenceUntil ?? null }] };
        });
      },
      deleteLocalEvent: (id, occurrenceDate, scope = 'future') => set((state) => {
        const original = state.events.find((item) => item.id === id);
        if (!original || original.source !== 'local') return state;
        if (!occurrenceDate || !original.recurrence || original.recurrence === 'none') return { events: state.events.filter((item) => item.id !== id) };
        if (scope === 'one') return { events: state.events.map((item) => item.id === id
          ? { ...item, excludedDates: [...(item.excludedDates ?? []), occurrenceDate] } : item) };
        const previous = new Date(`${occurrenceDate}T12:00:00`); previous.setDate(previous.getDate() - 1);
        const endKey = `${previous.getFullYear()}-${String(previous.getMonth() + 1).padStart(2, '0')}-${String(previous.getDate()).padStart(2, '0')}`;
        return { events: state.events.map((item) => item.id === id ? { ...item, recurrenceUntil: endKey } : item) };
      }),
      replaceGoogleEvents: (googleEvents) =>
        set((state) => ({
          events: [...state.events.filter((e) => e.source !== 'google'), ...googleEvents],
        })),
      replaceDeviceEvents: (deviceEvents) =>
        set((state) => ({
          events: [...state.events.filter((e) => e.source !== 'device'), ...deviceEvents],
        })),
    }),
    {
      name: 'fluxo-agenda',
      storage: createJSONStorage(() => profileStorage),
      skipHydration: true,
      version: 1,
      migrate: (persisted) => ({
        events: ((persisted as { events?: AgendaEvent[] } | undefined)?.events ?? [])
          .filter((event) => !['e1', 'e2'].includes(event.id)),
      }),
      partialize: ({ events }) => ({ events }),
    }
  )
);
