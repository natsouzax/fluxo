import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { FadeIn } from '../../components/FadeIn';
import { PrimaryButton } from '../../components/PrimaryButton';
import { DetailHeader } from '../../components/DetailHeader';
import { ScreenContainer } from '../../components/ScreenContainer';
import { AuthStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/authStore';
import { radius, spacing, typography, useThemeStyles, type AppColors } from '../../theme';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function SignUpScreen() {
  const { colors, styles } = useThemeStyles(createStyles);
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const signUp = useAuthStore((s) => s.signUp);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignUp() {
    if (!name.trim()) {
      setError('Digite seu nome.');
      return;
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      setError('Digite um e-mail válido.');
      return;
    }
    if (password.length < 6) {
      setError('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await signUp(name.trim(), email.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível criar o perfil.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenContainer bottomSafeArea>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
          <DetailHeader onBack={() => navigation.goBack()} />

          <FadeIn>
            <Text style={styles.title}>Criar conta</Text>
            <Text style={styles.subtitle}>Leva menos de um minuto.</Text>
          </FadeIn>

          <FadeIn delay={80} style={styles.form}>
            <Text style={styles.label}>Nome</Text>
            <TextInput
              accessibilityLabel="Nome"
              value={name}
              onChangeText={setName}
              placeholder="Seu nome"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />

            <Text style={styles.label}>E-mail</Text>
            <TextInput
              accessibilityLabel="E-mail"
              value={email}
              onChangeText={setEmail}
              placeholder="voce@email.com"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
            />

            <Text style={styles.label}>Senha</Text>
            <TextInput
              accessibilityLabel="Senha"
              value={password}
              onChangeText={setPassword}
              placeholder="Mínimo de 6 caracteres"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              secureTextEntry
              autoCapitalize="none"
            />

            <Text style={styles.label}>Confirmar senha</Text>
            <TextInput
              accessibilityLabel="Confirmar senha"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="••••••••"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              secureTextEntry
              autoCapitalize="none"
            />

            {error && <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text>}

            <View style={{ marginTop: spacing.lg }}>
              <PrimaryButton label="Criar conta" onPress={handleSignUp} loading={loading} />
            </View>
          </FadeIn>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Já tem conta?</Text>
            <Pressable onPress={() => navigation.navigate('Login')} hitSlop={8} style={{ minHeight: 48, justifyContent: 'center' }} accessibilityRole="button">
              <Text style={styles.footerLink}> Entrar</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  scroll: { flexGrow: 1, paddingBottom: spacing.xxl },
  title: { ...typography.display, fontSize: 28, lineHeight: 34, color: colors.textPrimary },
  subtitle: { ...typography.body, color: colors.textSecondary, marginTop: spacing.sm },
  form: { marginTop: spacing.xl },
  label: { ...typography.bodyStrong, color: colors.textPrimary, marginBottom: spacing.xs, marginTop: spacing.md },
  input: {
    backgroundColor: colors.card,
    minHeight: 52,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    ...typography.body,
  },
  error: { ...typography.caption, color: colors.danger, marginTop: spacing.sm },
  footer: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', marginTop: spacing.xl },
  footerText: { ...typography.body, color: colors.textSecondary },
  footerLink: { ...typography.bodyStrong, color: colors.accent },
});
