import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ChatMessage } from '../data/types';
import { radius, spacing, typography, useThemeStyles, type AppColors } from '../theme';
import { FadeIn } from './FadeIn';

export function ChatBubble({ message }: { message: ChatMessage }) {
  const { colors, styles } = useThemeStyles(createStyles);
  const isUser = message.role === 'user';
  return (
    <FadeIn duration={280} distance={10}>
      <View style={[styles.row, isUser && styles.rowUser]}>
        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
          <Text style={[styles.text, isUser && styles.textUser]}>{message.content}</Text>
        </View>
      </View>
    </FadeIn>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  row: { flexDirection: 'row', marginBottom: spacing.md, paddingHorizontal: spacing.lg },
  rowUser: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '90%', padding: spacing.md, borderRadius: radius.lg },
  bubbleAssistant: {
    backgroundColor: colors.accentSoft,
    borderBottomLeftRadius: 4,
  },
  bubbleUser: { backgroundColor: colors.balanceSurface, borderBottomRightRadius: 4 },
  text: { ...typography.body, color: colors.textPrimary, lineHeight: 21 },
  textUser: { color: colors.balanceInk },
});
