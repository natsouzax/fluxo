import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AnimatedPressable } from '../components/AnimatedPressable';
import { ChatBubble } from '../components/ChatBubble';
import { BrandHeader, ScreenHeading } from '../components/BrandHeader';
import { ScreenContainer } from '../components/ScreenContainer';
import { TypingIndicator } from '../components/TypingIndicator';
import { devBackendURL, resolveAssistant } from '../services/remoteAssistant';
import { eventsForDay } from '../domain/agenda';
import { useAuthStore } from '../store/authStore';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNow } from '../hooks/useNow';
import { TabParamList } from '../navigation/types';
import { useAgendaStore } from '../store/agendaStore';
import { useChatStore } from '../store/chatStore';
import { useFinanceStore } from '../store/financeStore';
import { useNotesStore } from '../store/notesStore';
import { useSettingsStore } from '../store/settingsStore';
import { isCurrentSession, sessionGeneration } from '../store/profileStorage';
import { radius, spacing, typography, useThemeStyles, type AppColors } from '../theme';

const suggestions = [
  { label: 'Consultar saldo', prompt: 'Qual e meu saldo?' },
  { label: 'Ver agenda', prompt: 'O que tenho hoje?' },
  { label: 'Buscar notas', prompt: 'Buscar minhas notas' },
];

// Date.now() alone collides when a reply lands in the same millisecond as the
// message that triggered it, which duplicates FlatList keys.
let messageCounter = 0;
function newMessageId(prefix: string): string {
  messageCounter += 1;
  return `${prefix}-${Date.now()}-${messageCounter}`;
}

export function ChatScreen() {
  const { colors, styles } = useThemeStyles(createStyles);
  const navigation = useNavigation<BottomTabNavigationProp<TabParamList>>();
  const now = useNow();
  const name = useAuthStore((s) => s.user?.name);
  const reducedMotion = useReducedMotion();
  const insets = useSafeAreaInsets();
  const events = useAgendaStore((s) => s.events);
  const [input, setInput] = useState('');
  const listRef = useRef<FlatList>(null);
  const messages = useChatStore((s) => s.messages);
  const isNearBottom = useRef(true);
  const isSending = useChatStore((s) => s.isSending);
  const addMessage = useChatStore((s) => s.addMessage);
  const setSending = useChatStore((s) => s.setSending);
  const enabled = useSettingsStore((s) => s.experimentalAIEnabled);
  const backendURL = devBackendURL();
  const remoteEnabled = enabled && Boolean(backendURL);
  const activeRequest = useRef<AbortController | null>(null);
  useEffect(() => () => { activeRequest.current?.abort(); }, [remoteEnabled]);
  const accounts = useFinanceStore((s) => s.accounts);
  const transactions = useFinanceStore((s) => s.transactions);
  const budgets = useFinanceStore((s) => s.budgets);
  const goals = useFinanceStore((s) => s.goals);
  const notes = useNotesStore((s) => s.notes);
  const today = eventsForDay(events, now);

  async function handleSend(text: string) {
    const trimmed = text.trim();
    if (!trimmed || useChatStore.getState().isSending) return;
    const owner = sessionGeneration();
    if (!isCurrentSession(owner)) return;

    const userMessage = {
      id: newMessageId('u'),
      role: 'user' as const,
      content: trimmed,
      createdAt: new Date().toISOString(),
    };
    addMessage(userMessage);
    setInput('');
    setSending(true);
    // Sending explicitly returns to the latest message, even from older history.
    isNearBottom.current = true;
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: !reducedMotion }));

    const snapshot = { accounts, transactions, budgets, goals, notes, events };
    const controller = new AbortController();
    activeRequest.current = controller;
    try {
      const reply = await resolveAssistant({ message: trimmed, context: snapshot,
        history: messages.slice(-20).map(({ role, content }) => ({ role, content })),
        enabled: remoteEnabled, backendURL, signal: controller.signal });
      if (!isCurrentSession(owner)) return;
      addMessage({ id: newMessageId('a'), role: 'assistant', content: reply.content, createdAt: new Date().toISOString() });
      if (reply.destination) navigation.navigate(reply.destination);
    } catch {
      if (isCurrentSession(owner)) addMessage({ id: newMessageId('a'), role: 'assistant', content: 'Não consegui consultar os registros. Tente perguntar de outra forma.', createdAt: new Date().toISOString() });
    } finally {
      activeRequest.current = null;
      if (isCurrentSession(owner)) setSending(false);
    }
  }

  return (
    <ScreenContainer padded={false}>
      <View style={styles.header}>
        <BrandHeader />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={insets.top}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => <ChatBubble message={item} />}
          contentContainerStyle={styles.list}
          onScroll={(event: NativeSyntheticEvent<NativeScrollEvent>) => {
            const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
            isNearBottom.current = contentOffset.y + layoutMeasurement.height >= contentSize.height - 72;
          }}
          scrollEventThrottle={100}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          ListHeaderComponent={
            <View style={styles.welcome}>
              <ScreenHeading eyebrow={`Seu dia · ${now.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short' })}`}
                title="Segue o FLUXO." description="Seu dinheiro, suas ideias e sua rotina em um só lugar." />
              <View style={styles.assistantPrompt}>
                <Text style={styles.welcomeText}>Oi{name ? `, ${name.split(' ')[0]}` : ''}. {today.length === 0 ? 'Nenhum compromisso registrado hoje.' : `Hoje há ${today.length} compromisso${today.length === 1 ? '' : 's'} registrado${today.length === 1 ? '' : 's'}.`} Por onde começamos?</Text>
              </View>
              <ScrollView horizontal style={styles.shortcuts} contentContainerStyle={styles.shortcutContent}
                showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" accessibilityLabel="Sugestões de conversa">
                {suggestions.map(({ label, prompt }) => (
                  <AnimatedPressable key={label} style={styles.suggestionChip} accessibilityRole="button" accessibilityLabel={label}
                    accessibilityState={{ disabled: isSending }}
                    disabled={isSending} onPress={() => handleSend(prompt)}>
                    <Text style={styles.suggestionText}>{label}</Text>
                  </AnimatedPressable>
                ))}
              </ScrollView>
              <Text style={styles.modeNote}>Seu assistente consulta os registros disponíveis no perfil. {remoteEnabled ? 'IA experimental · ambiente de desenvolvimento' : 'Modo local · sem IA generativa'}</Text>
            </View>
          }
          onContentSizeChange={() => {
            // Leave older history in place when new content arrives while it is being read.
            if (isNearBottom.current) listRef.current?.scrollToEnd({ animated: !reducedMotion });
          }}
          ListFooterComponent={isSending ? <TypingIndicator /> : null}
        />


        <View style={styles.inputBar}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Pergunte ao FLUXO"
            accessibilityLabel="Mensagem para o Fluxo"
            maxLength={4000}
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            multiline
          />
          <AnimatedPressable
            style={[styles.sendBtn, (!input.trim() || isSending) && styles.sendBtnDisabled]}
            onPress={() => handleSend(input)}
            disabled={!input.trim() || isSending}
            accessibilityLabel="Enviar mensagem"
            accessibilityState={{ disabled: !input.trim() || isSending }}
          >
            <Feather name="arrow-up" size={18} color={colors.sendInk} />
          </AnimatedPressable>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  welcome: { paddingHorizontal: spacing.lg, paddingTop: spacing.xs, paddingBottom: spacing.sm, gap: spacing.xs },
  welcomeText: { ...typography.body, color: colors.textPrimary, lineHeight: 23 },
  modeNote: { ...typography.tiny, color: colors.textMuted, marginTop: spacing.sm },
  assistantPrompt: { backgroundColor: colors.financeSurface, borderRadius: radius.md, padding: spacing.md, borderBottomLeftRadius: 4 },
  shortcuts: { flexGrow: 0 },
  shortcutContent: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs },
  header: { paddingHorizontal: spacing.lg, paddingTop: 0, paddingBottom: 0 },
  list: { paddingTop: spacing.xs, paddingBottom: spacing.md },
  suggestionChip: { flexShrink: 0, backgroundColor: colors.bg, borderRadius: radius.pill, minHeight: 48, minWidth: 48, justifyContent: 'center', paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.border },
  suggestionText: { ...typography.caption, color: colors.textSecondary },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, marginHorizontal: spacing.lg, marginVertical: spacing.md, padding: spacing.sm, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  input: { flex: 1, paddingHorizontal: spacing.sm, paddingVertical: spacing.md, minHeight: 48, color: colors.textPrimary, maxHeight: 120, ...typography.body },
  sendBtn: { width: 48, height: 48, borderRadius: 14, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { opacity: 0.45 },
});
