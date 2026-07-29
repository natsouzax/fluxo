import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AnimatedPressable } from '../../components/AnimatedPressable';
import { FadeIn } from '../../components/FadeIn';
import { AuthStackParamList } from '../../navigation/types';
import { colors, radius, spacing, typography } from '../../theme';

export function WelcomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();

  return (
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <FadeIn delay={80} distance={20} style={styles.content}>
        <Text style={styles.logo}>Fluxo</Text>
        <Text style={styles.tagline}>
          Finanças, notas e rotina em um só lugar — com uma IA que conhece seu contexto.
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
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl * 2,
    paddingBottom: spacing.xxl,
  },
  content: { alignItems: 'center', marginTop: spacing.xxl },
  logo: { ...typography.display, fontSize: 44, color: '#FFFFFF' },
  tagline: {
    ...typography.body,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    lineHeight: 21,
  },
  actions: { gap: spacing.md },
  primaryBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.pill,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryBtnText: { ...typography.bodyStrong, color: colors.accent },
  loginBtn: { alignItems: 'center', paddingVertical: spacing.md },
  loginText: { ...typography.bodyStrong, color: '#FFFFFF' },
});
