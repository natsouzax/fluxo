import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { ChatMessage } from '../data/types';

interface ChatState {
  messages: ChatMessage[];
  isSending: boolean;
  addMessage: (message: ChatMessage) => void;
  setSending: (sending: boolean) => void;
  clear: () => void;
}

const welcomeMessage: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    'Oi! Eu sou a IA da Fluxo. Posso analisar seus gastos, sugerir cortes, planejar metas e responder dúvidas sobre suas finanças. Configure sua chave da API em Ajustes para conversarmos de verdade — até lá, respondo com uma prévia offline.',
  createdAt: new Date().toISOString(),
};

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      messages: [welcomeMessage],
      isSending: false,
      addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
      setSending: (sending) => set({ isSending: sending }),
      clear: () => set({ messages: [welcomeMessage] }),
    }),
    {
      name: 'fluxo-chat',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
