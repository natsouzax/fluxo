import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { radius, spacing, useThemeStyles, type AppColors } from '../theme';

interface Props extends ViewProps {
  elevated?: boolean;
}

export function Card({ style, elevated, children, ...rest }: Props) {
  const { colors, styles } = useThemeStyles(createStyles);
  return (
    <View style={[styles.card, elevated && styles.elevated, style]} {...rest}>
      {children}
    </View>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  elevated: {
    backgroundColor: colors.cardAlt,
  },
});
