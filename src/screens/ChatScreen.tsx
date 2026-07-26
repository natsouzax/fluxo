import { Feather } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ChatBubble } from '../components/ChatBubble';
import { ScreenContainer } from '../components/ScreenContainer';
import { askFluxoAI, offlineFallbackReply } from '../services/aiService';
import { useChatStore } from '../store/chatStore';
import { useFinanceStore } from '../store/financeStore';
import { useNotesStore } from '../store/notesStore';
import { useSettingsStore } from '../store/settingsStore';
import { colors, radius, spacing, typography } from '../theme';

const suggestions = [
  'Quanto posso gastar até o fim do mês?',
  'Como está minha reserva de emergência?',
  'Onde posso cortar gastos?',
];

export function ChatScreen() {
  const [input, setInput] = useState('');
  const listRef = useRef<FlatList>(null);
  const messages = useChatStore((s) => s.messages);
  const isSending = useChatStore((s) => s.isSending);
  const addMessage = useChatStore((s) => s.addMessage);
  const setSending = useChatStore((s) => s.setSending);

  const apiKey = useSettingsStore((s) => s.anthropicApiKey);
  const accounts = useFinanceStore((s) => s.accounts);
  const transactions = useFinanceStore((s) => s.transactions);
  const budgets = useFinanceStore((s) => s.budgets);
  const goals = useFinanceStore((s) => s.goals);
  const notes = useNotesStore((s) => s.notes);

  async function handleSend(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;

    const userMessage = {
      id: `u-${Date.now()}`,
      role: 'user' as const,
      content: trimmed,
      createdAt: new Date().toISOString(),
    };
    addMessage(userMessage);
    setInput('');
    setSending(true);

    try {
      let reply: string;
      if (apiKey) {
        reply = await askFluxoAI({
          apiKey,
          history: [...messages, userMessage].map((m) => ({ role: m.role, content: m.content })),
          snapshot: { accounts, transactions, budgets, goals, notes },
        });
      } else {
        await new Promise((r) => setTimeout(r, 400));
        reply = offlineFallbackReply(trimmed, { accounts, transactions, budgets, goals, notes });
      }
      addMessage({
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: reply,
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      addMessage({
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: `Não consegui falar com a IA agora. ${err instanceof Error ? err.message : ''}`.trim(),
        createdAt: new Date().toISOString(),
      });
    } finally {
      setSending(false);
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    }
  }

  return (
    <ScreenContainer padded={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Copiloto financeiro</Text>
        {!apiKey && <Text style={styles.subtitle}>Modo offline · configure sua chave em Ajustes</Text>}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => <ChatBubble message={item} />}
          contentContainerStyle={styles.list}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        />

        {messages.length <= 1 && (
          <View style={styles.suggestions}>
            {suggestions.map((s) => (
              <Pressable key={s} style={styles.suggestionChip} onPress={() => handleSend(s)}>
                <Text style={styles.suggestionText}>{s}</Text>
              </Pressable>
            ))}
          </View>
        )}

        <View style={styles.inputBar}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Pergunte sobre suas finanças..."
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            multiline
          />
          <Pressable
            style={[styles.sendBtn, (!input.trim() || isSending) && styles.sendBtnDisabled]}
            onPress={() => handleSend(input)}
            disabled={!input.trim() || isSending}
          >
            <Feather name="arrow-up" size={18} color={colors.accentText} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.md },
  title: { ...typography.h1, color: colors.textPrimary },
  subtitle: { ...typography.caption, color: colors.warning, marginTop: spacing.xs },
  list: { paddingTop: spacing.md, paddingBottom: spacing.md },
  suggestions: { paddingHorizontal: spacing.lg, gap: spacing.sm, marginBottom: spacing.md },
  suggestionChip: {
    backgroundColor: colors.cardAlt,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  suggestionText: { ...typography.caption, color: colors.textSecondary },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    backgroundColor: colors.cardAlt,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    maxHeight: 120,
    ...typography.body,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
});
