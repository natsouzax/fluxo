import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { spacing, useThemeStyles, type AppColors } from '../theme';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  padded?: boolean;
  bottomSafeArea?: boolean;
}

export function ScreenContainer({ children, style, padded = true, bottomSafeArea = false }: Props) {
  const { colors, styles } = useThemeStyles(createStyles);
  return (
    <SafeAreaView style={styles.safeArea} edges={bottomSafeArea ? ['top', 'left', 'right', 'bottom'] : ['top', 'left', 'right']}>
      <View style={[styles.container, padded && styles.padded, style]}>{children}</View>
    </SafeAreaView>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, backgroundColor: colors.bg },
  padded: { paddingHorizontal: spacing.lg },
});
