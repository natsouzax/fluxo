import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnimatedPressable } from '../../components/AnimatedPressable';
import { BrandLockup } from '../../components/BrandMark';
import { FadeIn } from '../../components/FadeIn';
import { AuthStackParamList } from '../../navigation/types';
import { radius, spacing, typography, useThemeStyles, type AppColors } from '../../theme';

export function WelcomeScreen() {
  const { colors, styles } = useThemeStyles(createStyles);
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <FadeIn delay={80} distance={20} style={styles.content}>
        <BrandLockup size={88} />
        <Text style={styles.tagline}>
          Finanças, notas e rotina em um só lugar — com o Fluxo, seu assistente pessoal.
        </Text>
      </FadeIn>

      <FadeIn delay={220} style={styles.actions}>
        <AnimatedPressable style={styles.primaryBtn} onPress={() => navigation.navigate('SignUp')}>
          <Text style={styles.primaryBtnText}>Criar conta</Text>
        </AnimatedPressable>
        <AnimatedPressable style={styles.loginBtn} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginText}>Já tenho conta — Entrar</Text>
        </AnimatedPressable>
      </FadeIn>
    </SafeAreaView>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  content: { alignItems: 'center', marginTop: spacing.xxl * 2 },
  tagline: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    lineHeight: 21,
  },
  actions: { gap: spacing.md },
  primaryBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { ...typography.bodyStrong, color: colors.accentText },
  loginBtn: { alignItems: 'center', paddingVertical: spacing.md, minHeight: 48 },
  loginText: { ...typography.bodyStrong, color: colors.textPrimary },
});
