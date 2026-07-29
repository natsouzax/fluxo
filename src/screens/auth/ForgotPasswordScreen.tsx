import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { FadeIn } from '../../components/FadeIn';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ScreenContainer } from '../../components/ScreenContainer';
import { AuthStackParamList } from '../../navigation/types';
import { colors, radius, spacing, typography } from '../../theme';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ForgotPasswordScreen() {
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
    <ScreenContainer>
      <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.back}>
        {({ pressed }) => (
          <Feather name="chevron-left" size={22} color={colors.textPrimary} style={{ opacity: pressed ? 0.5 : 1 }} />
        )}
      </Pressable>

      <FadeIn>
        <Text style={styles.title}>Recuperar senha</Text>
        <Text style={styles.subtitle}>
          {sent
            ? 'Se esse e-mail estiver cadastrado, enviamos um link de recuperação. Confira sua caixa de entrada.'
            : 'Digite seu e-mail e enviaremos um link para redefinir sua senha.'}
        </Text>
      </FadeIn>

      {!sent ? (
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
          {error && <Text style={styles.error}>{error}</Text>}
          <View style={{ marginTop: spacing.lg }}>
            <PrimaryButton label="Enviar link" onPress={handleSend} />
          </View>
        </FadeIn>
      ) : (
        <View style={styles.form}>
          <PrimaryButton label="Voltar para o login" onPress={() => navigation.navigate('Login')} variant="secondary" />
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  back: { marginTop: spacing.md, marginBottom: spacing.lg, alignSelf: 'flex-start' },
  title: { ...typography.display, fontSize: 28, color: colors.textPrimary },
  subtitle: { ...typography.body, color: colors.textSecondary, marginTop: spacing.sm, lineHeight: 20 },
  form: { marginTop: spacing.xl },
  label: { ...typography.bodyStrong, color: colors.textPrimary, marginBottom: spacing.xs },
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
});
