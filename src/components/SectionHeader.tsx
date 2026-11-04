import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { spacing, typography, useThemeStyles, type AppColors } from '../theme';

interface Props {
  title: string;
  action?: string;
  onPressAction?: () => void;
}

export function SectionHeader({ title, action, onPressAction }: Props) {
  const { colors, styles } = useThemeStyles(createStyles);
  return (
    <View style={styles.row}>
      <Text accessibilityRole="header" style={styles.title}>{title}</Text>
      {action ? (
        <Pressable onPress={onPressAction} hitSlop={8} accessibilityRole="button" style={styles.actionTarget}>
          <Text style={styles.action}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  actionTarget: { minHeight: 48, minWidth: 48, justifyContent: 'center', alignItems: 'flex-end' },
  title: { flexShrink: 1, ...typography.bodyStrong, color: colors.textPrimary },
  action: { ...typography.caption, color: colors.accent, fontFamily: 'Manrope-SemiBold' },
});
