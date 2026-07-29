import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { FadeIn } from '../../components/FadeIn';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ScreenContainer } from '../../components/ScreenContainer';
import { AuthStackParamList } from '../../navigation/types';
import { TEST_ACCOUNT, useAuthStore } from '../../store/authStore';
import { colors, radius, spacing, typography } from '../../theme';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState(TEST_ACCOUNT.email);
  const [password, setPassword] = useState(TEST_ACCOUNT.password);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!EMAIL_REGEX.test(email.trim())) {
      setError('Digite um e-mail válido.');
      return;
    }
    if (password.length < 6) {
      setError('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await login(email.trim(), password);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenContainer>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.back} accessibilityRole="button" accessibilityLabel="Voltar">
            {({ pressed }) => (
              <Feather name="chevron-left" size={22} color={colors.textPrimary} style={{ opacity: pressed ? 0.5 : 1 }} />
            )}
          </Pressable>

          <FadeIn>
            <Text style={styles.title}>Bem-vindo de volta</Text>
            <Text style={styles.subtitle}>Entre para continuar cuidando das suas finanças.</Text>
            <Text style={styles.testHint}>Campos já preenchidos com a conta de teste — só tocar em Entrar.</Text>
          </FadeIn>

          <FadeIn delay={80} style={styles.form}>
            <Text style={styles.label}>E-mail</Text>
            <TextInput
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
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              secureTextEntry
              autoCapitalize="none"
            />

            {error && <Text style={styles.error}>{error}</Text>}

            <Pressable onPress={() => navigation.navigate('ForgotPassword')} hitSlop={8} style={styles.forgot}>
              <Text style={styles.forgotText}>Esqueci minha senha</Text>
            </Pressable>

            <View style={{ marginTop: spacing.lg }}>
              <PrimaryButton label="Entrar" onPress={handleLogin} loading={loading} />
            </View>
          </FadeIn>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Não tem conta?</Text>
            <Pressable onPress={() => navigation.navigate('SignUp')} hitSlop={8}>
              <Text style={styles.footerLink}> Criar conta</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  back: { marginTop: spacing.md, marginBottom: spacing.lg, alignSelf: 'flex-start' },
  title: { ...typography.display, fontSize: 28, color: colors.textPrimary },
  subtitle: { ...typography.body, color: colors.textSecondary, marginTop: spacing.sm },
  testHint: { ...typography.caption, color: colors.accent, marginTop: spacing.sm },
  form: { marginTop: spacing.xl },
  label: { ...typography.bodyStrong, color: colors.textPrimary, marginBottom: spacing.xs, marginTop: spacing.md },
  input: {
    backgroundColor: colors.cardAlt,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    ...typography.body,
  },
  error: { ...typography.caption, color: colors.danger, marginTop: spacing.sm },
  forgot: { alignSelf: 'flex-end', marginTop: spacing.md },
  forgotText: { ...typography.caption, color: colors.accent, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xl },
  footerText: { ...typography.body, color: colors.textSecondary },
  footerLink: { ...typography.bodyStrong, color: colors.accent },
});
