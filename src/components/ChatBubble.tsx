import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ChatMessage } from '../data/types';
import { colors, radius, spacing, typography } from '../theme';

export function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  return (
    <View style={[styles.row, isUser && styles.rowUser]}>
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
        <Text style={[styles.text, isUser && styles.textUser]}>{message.content}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', marginBottom: spacing.md, paddingHorizontal: spacing.lg },
  rowUser: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '82%', padding: spacing.md, borderRadius: radius.lg },
  bubbleAssistant: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: 4,
  },
  bubbleUser: { backgroundColor: colors.accent, borderBottomRightRadius: 4 },
  text: { ...typography.body, color: colors.textPrimary, lineHeight: 21 },
  textUser: { color: colors.accentText },
});
