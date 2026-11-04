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

export function LoginScreen() {
  const { colors, styles } = useThemeStyles(createStyles);
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível entrar.');
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
            <Text style={styles.title}>Bem-vindo de volta</Text>
            <Text style={styles.subtitle}>Entre para continuar cuidando das suas finanças.</Text>
            <Text style={styles.testHint}>Entre com os dados da sua conta.</Text>
          </FadeIn>

          <FadeIn delay={80} style={styles.form}>
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
              placeholder="••••••••"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              secureTextEntry
              autoCapitalize="none"
            />

            {error && <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text>}

            <Pressable onPress={() => navigation.navigate('ForgotPassword')} hitSlop={8} style={styles.forgot}>
              <Text style={styles.forgotText}>Esqueci minha senha</Text>
            </Pressable>

            <View style={{ marginTop: spacing.lg }}>
              <PrimaryButton label="Entrar" onPress={handleLogin} loading={loading} />
            </View>
          </FadeIn>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Não tem conta?</Text>
            <Pressable onPress={() => navigation.navigate('SignUp')} hitSlop={8} style={{ minHeight: 48, justifyContent: 'center' }} accessibilityRole="button">
              <Text style={styles.footerLink}> Criar conta</Text>
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
  testHint: { ...typography.caption, color: colors.accent, marginTop: spacing.sm },
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
  forgot: { alignSelf: 'flex-end', minHeight: 48, justifyContent: 'center', marginTop: spacing.md },
  forgotText: { ...typography.caption, color: colors.accent, fontFamily: 'Manrope-SemiBold' },
  footer: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', marginTop: spacing.xl },
  footerText: { ...typography.body, color: colors.textSecondary },
  footerLink: { ...typography.bodyStrong, color: colors.accent },
});
