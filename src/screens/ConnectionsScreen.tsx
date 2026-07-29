import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card } from '../components/Card';
import { FadeIn } from '../components/FadeIn';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenContainer } from '../components/ScreenContainer';
import { SectionHeader } from '../components/SectionHeader';
import { StatusPill } from '../components/StatusPill';
import { RootStackParamList } from '../navigation/types';
import { fetchUpcomingCalendarEvents, hasGoogleClientId, useGoogleAuthRequest } from '../services/googleAuth';
import { mockProvider } from '../services/openFinance';
import { useAgendaStore } from '../store/agendaStore';
import { useFinanceStore } from '../store/financeStore';
import { useSettingsStore } from '../store/settingsStore';
import { colors, radius, spacing, typography } from '../theme';

export function ConnectionsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [connectingBank, setConnectingBank] = useState(false);
  const [connectingGoogle, setConnectingGoogle] = useState(false);

  const openFinanceConnection = useSettingsStore((s) => s.openFinanceConnection);
  const setOpenFinanceConnection = useSettingsStore((s) => s.setOpenFinanceConnection);
  const googleConnection = useSettingsStore((s) => s.googleConnection);
  const setGoogleConnection = useSettingsStore((s) => s.setGoogleConnection);
  const replaceAccounts = useFinanceStore((s) => s.replaceAccounts);
  const replaceGoogleEvents = useAgendaStore((s) => s.replaceGoogleEvents);

  const [request, response, promptAsync] = useGoogleAuthRequest();

  async function handleConnectBank() {
    setConnectingBank(true);
    try {
      const { accounts } = await mockProvider.connect();
      replaceAccounts(accounts);
      setOpenFinanceConnection({ connected: true, connectedAt: new Date().toISOString(), providerLabel: mockProvider.label });
      Alert.alert('Conectado', 'Contas de exemplo carregadas. Troque pelo Pluggy real quando o backend estiver pronto (ver README).');
    } finally {
      setConnectingBank(false);
    }
  }

  async function handleConnectGoogle() {
    if (!hasGoogleClientId()) {
      Alert.alert(
        'Em breve',
        'Para ativar o login Google, crie um OAuth Client ID no Google Cloud Console e adicione em app.json → expo.extra.googleOAuthClientId (ver README).'
      );
      return;
    }
    setConnectingGoogle(true);
    try {
      const result = await promptAsync();
      if (result.type === 'success' && result.authentication?.accessToken) {
        const token = result.authentication.accessToken;
        setGoogleConnection({ connected: true, connectedAt: new Date().toISOString(), providerLabel: 'Google' });
        const items = await fetchUpcomingCalendarEvents(token);
        replaceGoogleEvents(
          items.map((item: any) => ({
            id: item.id,
            title: item.summary ?? 'Evento sem título',
            start: item.start?.dateTime ?? item.start?.date,
            end: item.end?.dateTime ?? item.end?.date,
            source: 'google' as const,
          }))
        );
      }
    } catch (err) {
      Alert.alert('Erro', err instanceof Error ? err.message : 'Não foi possível conectar ao Google.');
    } finally {
      setConnectingGoogle(false);
    }
  }

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} accessibilityRole="button" accessibilityLabel="Voltar">
          {({ pressed }) => (
            <Feather name="chevron-left" size={22} color={colors.textPrimary} style={{ opacity: pressed ? 0.5 : 1 }} />
          )}
        </Pressable>
        <Text style={styles.title}>Conexões</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <SectionHeader title="Banco (Open Finance)" />
        <FadeIn>
          <Card style={styles.card}>
            <View style={styles.rowBetween}>
              <View style={styles.rowInfo}>
                <Feather name="credit-card" size={18} color={colors.textSecondary} />
                <Text style={styles.rowLabel}>{openFinanceConnection.providerLabel ?? 'Nenhum banco conectado'}</Text>
              </View>
              <StatusPill connected={openFinanceConnection.connected} label={openFinanceConnection.connected ? 'Conectado' : 'Desconectado'} />
            </View>
            <Text style={styles.helper}>
              Hoje conecta contas de exemplo. Integração real via Pluggy/Belvo exige backend próprio
              (client secret não pode ficar no app) — detalhes em README.
            </Text>
            <PrimaryButton
              label={openFinanceConnection.connected ? 'Reconectar' : 'Conectar banco (exemplo)'}
              onPress={handleConnectBank}
              loading={connectingBank}
              variant="secondary"
            />
          </Card>
        </FadeIn>

        <SectionHeader title="Google (Calendar, Gmail, Drive)" />
        <FadeIn delay={80}>
          <Card style={styles.card}>
            <View style={styles.rowBetween}>
              <View style={styles.rowInfo}>
                <Feather name="mail" size={18} color={colors.textSecondary} />
                <Text style={styles.rowLabel}>Conta Google</Text>
              </View>
              <StatusPill connected={googleConnection.connected} label={googleConnection.connected ? 'Conectado' : 'Desconectado'} />
            </View>
            <Text style={styles.helper}>
              Traz sua agenda para a aba Rotina e permite que a IA cruze compromissos com contas a
              pagar. Requer um OAuth Client ID configurado pelo dono do app (ver README).
            </Text>
            <PrimaryButton
              label={hasGoogleClientId() ? 'Conectar com Google' : 'Configurar Client ID (ver README)'}
              onPress={handleConnectGoogle}
              loading={connectingGoogle}
              variant="secondary"
              disabled={!request}
            />
          </Card>
        </FadeIn>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
    marginTop: spacing.md,
  },
  title: { ...typography.h1, color: colors.textPrimary },
  card: { marginBottom: spacing.xl },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  rowInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rowLabel: { ...typography.bodyStrong, color: colors.textPrimary },
  helper: { ...typography.caption, color: colors.textMuted, lineHeight: 18, marginBottom: spacing.lg },
});
