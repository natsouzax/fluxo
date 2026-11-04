import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { AnimatedPressable } from '../components/AnimatedPressable';
import { Card } from '../components/Card';
import { FadeIn } from '../components/FadeIn';
import { BrandHeader, ScreenHeading } from '../components/BrandHeader';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenContainer } from '../components/ScreenContainer';
import { SectionHeader } from '../components/SectionHeader';
import { StatusPill } from '../components/StatusPill';
import { RootStackParamList } from '../navigation/types';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { devBackendURL } from '../services/remoteAssistant';
import { spacing, typography, useThemeStyles, type AppColors } from '../theme';

export function SettingsScreen() {
  const { colors, styles } = useThemeStyles(createStyles);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const googleConnection = useSettingsStore((s) => s.googleConnection);
  const openFinanceConnection = useSettingsStore((s) => s.openFinanceConnection);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const experimentalAIEnabled = useSettingsStore((s) => s.experimentalAIEnabled);
  const setExperimentalAIEnabled = useSettingsStore((s) => s.setExperimentalAIEnabled);
  const themePreference = useSettingsStore((s) => s.themePreference);
  const setThemePreference = useSettingsStore((s) => s.setThemePreference);
  const backendConfigured = Boolean(devBackendURL());

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        <BrandHeader />
        <ScreenHeading eyebrow="Preferências" title="Do seu jeito." description="Ajuste o FLUXO para acompanhar a sua rotina." />

        <FadeIn delay={40}>
          <View>
            <SectionHeader title="Aparência" />
            <Card>
              <Text style={styles.label}>Tema do FLUXO</Text>
              <Text style={styles.helper}>Escolha como suas telas aparecem. A preferência fica salva no seu perfil.</Text>
              <View style={styles.themeChoices} accessibilityRole="radiogroup" accessibilityLabel="Tema do aplicativo">
                {(['light', 'dark'] as const).map((mode) => {
                  const selected = themePreference === mode;
                  const label = mode === 'light' ? 'Claro' : 'Escuro';
                  return (
                    <AnimatedPressable
                      key={mode}
                      style={[styles.themeChoice, selected && styles.themeChoiceActive]}
                      onPress={() => setThemePreference(mode)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      accessibilityLabel={`Tema ${label}`}
                    >
                      <Feather name={mode === 'light' ? 'sun' : 'moon'} size={16} color={selected ? colors.highlightText : colors.textSecondary} />
                      <Text style={[styles.themeChoiceText, selected && styles.themeChoiceTextActive]}>{label}</Text>
                    </AnimatedPressable>
                  );
                })}
              </View>
            </Card>
          </View>
        </FadeIn>

        <FadeIn>
          <View style={{ marginTop: spacing.xl }}>
            <SectionHeader title="Conexões" />
            <AnimatedPressable accessibilityLabel="Configurar bancos e Google" scaleTo={0.98} onPress={() => navigation.navigate('Connections')}>
              <Card style={styles.row}>
                <View style={styles.rowInfo}>
                  <Feather name="link" size={18} color={colors.textSecondary} />
                  <Text style={styles.rowLabel}>Bancos e Google</Text>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
                  <StatusPill connected={openFinanceConnection.connected} label={openFinanceConnection.connected ? 'Banco conectado' : 'Banco'} />
                  <StatusPill connected={googleConnection.connected} label="Google" />
                </View>
              </Card>
            </AnimatedPressable>
          </View>
        </FadeIn>

        <FadeIn delay={80}>
          <View style={{ marginTop: spacing.xl }}>
            <SectionHeader title="Assistente FLUXO" />
            <Card>
              <Text style={styles.label}>Respostas locais, sem chave de API</Text>
              <Text style={styles.helper}>
                O Fluxo usa regras de texto para consultar saldo, gastos, orçamentos,
                metas, notas e compromissos, além de abrir as abas. Essas consultas ficam no aparelho.
              </Text>
              <Text style={styles.helper}>Experimente “quanto gastei hoje?” ou “quais meus compromissos amanhã?”. Alterações por conversa ainda não estão disponíveis.</Text>
              {backendConfigured && <>
                <Text style={styles.label}>IA gratuita experimental (OpenRouter)</Text>
                <Text style={styles.helper}>
                  Com esta opção ligada, perguntas que as regras locais não entendem serão enviadas
                  ao backend de desenvolvimento, ao OpenRouter e ao provedor gratuito selecionado.
                  O envio inclui a pergunta, até 6 mensagens suas anteriores (até 1.000 caracteres cada),
                  saldos por moeda, gasto do mês, até 8 orçamentos, 4 metas, títulos de 4 notas e
                  títulos/horários de 4 compromissos de hoje. Não lê corpos de notas ou listas de transações
                  para esse contexto. As mensagens que você digita podem conter informações pessoais.
                  Os provedores têm suas próprias políticas de privacidade. A IA pode errar.
                </Text>
                <View style={styles.row}>
                  <Text style={[styles.rowLabel, { flex: 1 }]}>Permitir esse envio e usar IA experimental</Text>
                  <Switch style={{ minWidth: 48, minHeight: 48 }} trackColor={{ true: colors.accent, false: colors.border }} accessibilityLabel="Permitir contexto e IA experimental OpenRouter"
                    value={experimentalAIEnabled} onValueChange={setExperimentalAIEnabled} />
                </View>
              </>}
            </Card>
          </View>
        </FadeIn>

        <FadeIn delay={120}>
          <View style={{ marginTop: spacing.xl }}>
            <SectionHeader title="Conta" />
            <Card>
              <Text style={styles.label}>{user?.name ?? 'Perfil local'}</Text>
              {user ? <Text style={styles.helper}>{user.email}</Text> : null}
              <Text style={styles.aboutText}>Perfil local neste aparelho. A autenticação ainda não está conectada a um servidor.</Text>
              <PrimaryButton label="Ver contas e metas" variant="secondary" onPress={() => navigation.navigate('Accounts')} />
            </Card>
          </View>
        </FadeIn>

        <FadeIn delay={160}>
          <View style={{ marginTop: spacing.xl }}>
            <SectionHeader title="Sobre" />
            <Card>
              <Text style={styles.aboutText}>
                Fluxo reúne finanças, notas e agenda com um assistente local. A integração bancária
                real ainda precisa ser configurada para importar contas e transações.
              </Text>
            </Card>
          </View>
        </FadeIn>

        <FadeIn delay={240}>
          <View style={{ marginTop: spacing.xl }}>
            <PrimaryButton label="Sair" onPress={logout} variant="danger" />
          </View>
        </FadeIn>
      </ScrollView>
    </ScreenContainer>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, minHeight: 48, justifyContent: 'space-between', alignItems: 'center' },
  rowInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rowLabel: { ...typography.bodyStrong, color: colors.textPrimary },
  label: { ...typography.bodyStrong, color: colors.textPrimary, marginBottom: spacing.xs },
  helper: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.md, lineHeight: 18 },
  aboutText: { ...typography.caption, color: colors.textSecondary, lineHeight: 20 },
  themeChoices: { flexWrap: 'wrap', flexDirection: 'row', gap: spacing.sm },
  themeChoice: { flex: 1, minWidth: 110, minHeight: 48, flexDirection: 'row', gap: spacing.sm, justifyContent: 'center', alignItems: 'center', borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bg },
  themeChoiceActive: { backgroundColor: colors.highlight, borderColor: colors.highlight },
  themeChoiceText: { ...typography.bodyStrong, color: colors.textSecondary },
  themeChoiceTextActive: { color: colors.highlightText },
});
