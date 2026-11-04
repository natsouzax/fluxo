import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AnimatedPressable } from '../components/AnimatedPressable';
import { Card } from '../components/Card';
import { FadeIn } from '../components/FadeIn';
import { PrimaryButton } from '../components/PrimaryButton';
import { DetailHeader } from '../components/DetailHeader';
import { ScreenContainer } from '../components/ScreenContainer';
import { SectionHeader } from '../components/SectionHeader';
import { StatusPill } from '../components/StatusPill';
import { RootStackParamList } from '../navigation/types';
import { fetchCalendarEvents, hasGoogleClientId, toAgendaEvents, useGoogleAuthRequest } from '../services/googleAuth';
import { DeviceCalendarOption, listDeviceCalendars } from '../services/deviceCalendar';
import { getOpenFinanceAvailability } from '../services/openFinance';
import { useAgendaStore } from '../store/agendaStore';
import { useSettingsStore } from '../store/settingsStore';
import { isCurrentSession, sessionGeneration } from '../store/profileStorage';
import { radius, spacing, typography, useThemeStyles, type AppColors } from '../theme';

export function ConnectionsScreen() {
  const { colors, styles } = useThemeStyles(createStyles);
  const openFinanceAvailability = getOpenFinanceAvailability();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [connectingGoogle, setConnectingGoogle] = useState(false);
  const [loadingCalendars, setLoadingCalendars] = useState(false);
  const [deviceCalendars, setDeviceCalendars] = useState<DeviceCalendarOption[]>([]);

  const googleConnection = useSettingsStore((s) => s.googleConnection);
  const setGoogleConnection = useSettingsStore((s) => s.setGoogleConnection);
  const setGoogleToken = useSettingsStore((s) => s.setGoogleToken);
  const deviceCalendarIds = useSettingsStore((s) => s.deviceCalendarIds);
  const setDeviceCalendarIds = useSettingsStore((s) => s.setDeviceCalendarIds);
  const replaceGoogleEvents = useAgendaStore((s) => s.replaceGoogleEvents);
  const replaceDeviceEvents = useAgendaStore((s) => s.replaceDeviceEvents);

  const [request, , promptAsync] = useGoogleAuthRequest();

  async function handleConnectGoogle() {
    const owner = sessionGeneration();
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
      if (!isCurrentSession(owner)) return;
      if (result.type === 'success' && result.authentication?.accessToken) {
        const token = result.authentication.accessToken;
        const from = new Date();
        from.setDate(from.getDate() - 30);
        from.setHours(0, 0, 0, 0);
        const until = new Date();
        until.setDate(until.getDate() + 91);
        until.setHours(0, 0, 0, 0);
        const items = await fetchCalendarEvents(token, from, until);
        if (!isCurrentSession(owner)) return;
        replaceGoogleEvents(toAgendaEvents(items));
        const expiresIn = result.authentication.expiresIn ?? 3600;
        setGoogleToken(token, new Date(Date.now() + expiresIn * 1000).toISOString());
        setGoogleConnection({ connected: true, connectedAt: new Date().toISOString(), providerLabel: 'Google' });
      }
    } catch (err) {
      Alert.alert('Erro', err instanceof Error ? err.message : 'Não foi possível conectar ao Google.');
    } finally {
      setConnectingGoogle(false);
    }
  }

  function handleDisconnectGoogle() {
    setGoogleToken(null);
    replaceGoogleEvents([]);
    setGoogleConnection({ connected: false, connectedAt: null, providerLabel: null });
  }

  async function handleListCalendars() {
    setLoadingCalendars(true);
    try {
      setDeviceCalendars(await listDeviceCalendars());
    } catch (error) {
      Alert.alert('Calendário', error instanceof Error ? error.message : 'Não foi possível listar os calendários.');
    } finally {
      setLoadingCalendars(false);
    }
  }

  function toggleCalendar(id: string) {
    const next = deviceCalendarIds.includes(id) ? deviceCalendarIds.filter((value) => value !== id) : [...deviceCalendarIds, id];
    setDeviceCalendarIds(next);
    replaceDeviceEvents([]);
  }

  return (
    <ScreenContainer bottomSafeArea>
      <DetailHeader title="Conexões" onBack={() => navigation.goBack()} />

      <ScrollView showsVerticalScrollIndicator={false}>
        <SectionHeader title="Open Finance" />
        <FadeIn>
          <Card style={styles.card}>
            <View style={styles.rowBetween}>
              <View style={styles.rowInfo}>
                <Feather name="credit-card" size={18} color={colors.textSecondary} />
                <Text style={styles.rowLabel}>{openFinanceAvailability.configured ? 'Disponível' : 'Indisponível'}</Text>
              </View>
              <StatusPill connected={false} label="Não configurado" />
            </View>
            <Text style={styles.helper}>
              {openFinanceAvailability.message}
            </Text>
            <PrimaryButton label="Open Finance indisponível" onPress={() => undefined} variant="secondary" disabled />
          </Card>
        </FadeIn>

        <SectionHeader title="Google Calendar" />
        <FadeIn delay={80}>
          <Card style={styles.card}>
            <Text style={styles.rowLabel}>Calendários do aparelho</Text>
            <Text style={styles.helper}>Escolha os calendários que já estão sincronizados no telefone, incluindo os do Google. O Fluxo só lê os eventos selecionados.</Text>
            <PrimaryButton label={deviceCalendars.length ? 'Recarregar calendários' : 'Escolher calendários'} onPress={handleListCalendars} loading={loadingCalendars} variant="secondary" />
            {deviceCalendars.map((calendar) => {
              const selected = deviceCalendarIds.includes(calendar.id);
              return <AnimatedPressable key={calendar.id} style={styles.calendarOption} accessibilityRole="checkbox" accessibilityState={{ checked: selected }} onPress={() => toggleCalendar(calendar.id)}>
                <Feather name={selected ? 'check-square' : 'square'} size={20} color={colors.textPrimary} />
                <View style={styles.calendarText}><Text style={styles.rowLabel}>{calendar.title}</Text><Text style={styles.helper}>{calendar.account}</Text></View>
              </AnimatedPressable>;
            })}
            {deviceCalendarIds.length ? <Text style={styles.helper}>{deviceCalendarIds.length} calendário(s) selecionado(s). Os eventos aparecerão na aba Rotina.</Text> : null}
          </Card>
        </FadeIn>
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
              Conexão direta à API do Google ainda depende de OAuth configurado e validado pelo dono do app.
              Para usar agora, escolha acima um calendário Google já sincronizado no aparelho.
            </Text>
            <PrimaryButton
              label={hasGoogleClientId() ? (googleConnection.connected ? 'Reconectar Google' : 'Conectar com Google') : 'Configurar Client ID (ver README)'}
              onPress={handleConnectGoogle}
              loading={connectingGoogle}
              variant="secondary"
              disabled={!request}
            />
            {googleConnection.connected ? <PrimaryButton label="Desconectar Google" onPress={handleDisconnectGoogle} variant="secondary" /> : null}
          </Card>
        </FadeIn>
      </ScrollView>
    </ScreenContainer>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  card: { marginBottom: spacing.xl },
  rowBetween: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  rowInfo: { flexShrink: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rowLabel: { flexShrink: 1, ...typography.bodyStrong, color: colors.textPrimary },
  helper: { ...typography.caption, color: colors.textMuted, lineHeight: 18, marginBottom: spacing.lg },
  calendarOption: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 54, paddingVertical: spacing.sm },
  calendarText: { flex: 1 },
});
