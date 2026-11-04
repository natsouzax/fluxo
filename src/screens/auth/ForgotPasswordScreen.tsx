import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { FadeIn } from '../../components/FadeIn';
import { PrimaryButton } from '../../components/PrimaryButton';
import { DetailHeader } from '../../components/DetailHeader';
import { ScreenContainer } from '../../components/ScreenContainer';
import { AuthStackParamList } from '../../navigation/types';
import { radius, spacing, typography, useThemeStyles, type AppColors } from '../../theme';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ForgotPasswordScreen() {
  const { colors, styles } = useThemeStyles(createStyles);
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  function handleSend() {
    if (!EMAIL_REGEX.test(email.trim())) {
      setError('Digite um e-mail válido.');
      return;
    }
    setError(null);
    setSent(true);
  }

  return (
    <ScreenContainer bottomSafeArea>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
          <DetailHeader onBack={() => navigation.goBack()} />

      <FadeIn>
        <Text style={styles.title}>Recuperar senha</Text>
        <Text style={styles.subtitle}>
          {sent
            ? 'A recuperação por e-mail ainda não está disponível nesta versão local. Nenhuma mensagem foi enviada.'
            : 'Digite seu e-mail para conferir as opções de recuperação disponíveis nesta versão.'}
        </Text>
      </FadeIn>

      {!sent ? (
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
          {error && <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text>}
          <View style={{ marginTop: spacing.lg }}>
            <PrimaryButton label="Ver opções" onPress={handleSend} />
          </View>
        </FadeIn>
      ) : (
        <View style={styles.form}>
          <PrimaryButton label="Voltar para o login" onPress={() => navigation.navigate('Login')} variant="secondary" />
        </View>
      )}
      </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  scroll: { flexGrow: 1, paddingBottom: spacing.xl },
  title: { ...typography.display, fontSize: 28, lineHeight: 34, color: colors.textPrimary },
  subtitle: { ...typography.body, color: colors.textSecondary, marginTop: spacing.sm, lineHeight: 20 },
  form: { marginTop: spacing.xl },
  label: { ...typography.bodyStrong, color: colors.textPrimary, marginBottom: spacing.xs },
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
});
