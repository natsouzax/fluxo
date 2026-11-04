import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { ChatMessage } from '../data/types';
import { profileStorage } from './profileStorage';

interface ChatState {
  messages: ChatMessage[];
  isSending: boolean;
  addMessage: (message: ChatMessage) => void;
  setSending: (sending: boolean) => void;
  clear: () => void;
}

function withoutLegacySampleReplies(messages: ChatMessage[] = []): ChatMessage[] {
  return messages.filter((message) => message.id !== 'welcome' &&
    !(message.role === 'assistant' && /contas? de exemplo|saldo somado das contas/i.test(message.content)));
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      messages: [],
      isSending: false,
      addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
      setSending: (sending) => set({ isSending: sending }),
      clear: () => set({ messages: [], isSending: false }),
    }),
    {
      name: 'fluxo-chat',
      storage: createJSONStorage(() => profileStorage),
      skipHydration: true,
      version: 1,
      migrate: (persisted) => ({
        messages: withoutLegacySampleReplies((persisted as { messages?: ChatMessage[] } | undefined)?.messages),
      }),
      partialize: ({ messages }) => ({ messages }),
      merge: (persisted, current) => ({
        ...current,
        // Also sanitize same-version records in memory before they are next saved.
        messages: withoutLegacySampleReplies((persisted as { messages?: ChatMessage[] } | undefined)?.messages),
        isSending: false,
      }),
    }
  )
);
