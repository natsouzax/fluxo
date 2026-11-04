import { Feather } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AnimatedPressable } from '../components/AnimatedPressable';
import { BrandHeader, ScreenHeading } from '../components/BrandHeader';
import { CalendarTimeline } from '../components/CalendarTimeline';
import { Card } from '../components/Card';
import { ScreenContainer } from '../components/ScreenContainer';
import { fetchCalendarEvents, hasGoogleClientId, toAgendaEvents } from '../services/googleAuth';
import { fetchDeviceEvents } from '../services/deviceCalendar';
import { eventsForDay } from '../domain/agenda';
import { useNow } from '../hooks/useNow';
import { useAgendaStore } from '../store/agendaStore';
import { useSettingsStore } from '../store/settingsStore';
import { isCurrentSession, sessionGeneration } from '../store/profileStorage';
import { radius, spacing, typography, useThemeStyles, type AppColors } from '../theme';

function shiftDay(date: Date, offset: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + offset);
  return result;
}

function weekMondayOffset(date: Date) {
  return -((date.getDay() + 6) % 7);
}

export function AgendaScreen() {
  const { colors, styles } = useThemeStyles(createStyles);
  const events = useAgendaStore((s) => s.events);
  const googleConnection = useSettingsStore((s) => s.googleConnection);
  const googleAccessToken = useSettingsStore((s) => s.googleAccessToken);
  const googleTokenExpiresAt = useSettingsStore((s) => s.googleTokenExpiresAt);
  const setGoogleToken = useSettingsStore((s) => s.setGoogleToken);
  const replaceGoogleEvents = useAgendaStore((s) => s.replaceGoogleEvents);
  const replaceDeviceEvents = useAgendaStore((s) => s.replaceDeviceEvents);
  const deviceCalendarIds = useSettingsStore((s) => s.deviceCalendarIds);
  const now = useNow();
  const [offset, setOffset] = useState(0);
  const [weekly, setWeekly] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [deviceSyncing, setDeviceSyncing] = useState(false);
  const [deviceError, setDeviceError] = useState<string | null>(null);
  const loadedRange = useRef<{ from: number; until: number } | null>(null);
  const requestNumber = useRef(0);
  const deviceLoadedRange = useRef<{ from: number; until: number; ids: string } | null>(null);
  const deviceRequestNumber = useRef(0);
  const selected = shiftDay(now, offset);
  const mondayOffset = weekMondayOffset(selected);
  const weekStart = shiftDay(selected, mondayOffset);
  const weekEnd = shiftDay(weekStart, 6);
  const visibleEvents = weekly
    ? events.filter((event) => Array.from({ length: 7 }, (_, index) => eventsForDay([event], shiftDay(weekStart, index)).length > 0).some(Boolean))
    : eventsForDay(events, selected);
  const tokenValid = !!googleAccessToken && !!googleTokenExpiresAt && new Date(googleTokenExpiresAt).getTime() > Date.now() + 60_000;

  async function syncGoogle(force = false) {
    if (!googleAccessToken || !tokenValid) return;
    const day = shiftDay(new Date(), offset);
    const from = shiftDay(day, -30);
    from.setHours(0, 0, 0, 0);
    const until = shiftDay(day, 91);
    until.setHours(0, 0, 0, 0);
    const range = loadedRange.current;
    if (!force && range && range.from <= day.getTime() && range.until >= day.getTime()) return;
    const owner = sessionGeneration();
    const requestId = ++requestNumber.current;
    setSyncing(true);
    setSyncError(null);
    try {
      const items = await fetchCalendarEvents(googleAccessToken, from, until);
      if (!isCurrentSession(owner) || requestId !== requestNumber.current) return;
      replaceGoogleEvents(toAgendaEvents(items));
      loadedRange.current = { from: from.getTime(), until: until.getTime() };
    } catch (error) {
      if (!isCurrentSession(owner) || requestId !== requestNumber.current) return;
      if (error instanceof Error && error.message.includes('expirou')) setGoogleToken(null);
      setSyncError(error instanceof Error ? error.message : 'Não foi possível atualizar a agenda.');
    } finally {
      if (isCurrentSession(owner) && requestId === requestNumber.current) setSyncing(false);
    }
  }

  async function syncDevice(force = false) {
    if (!deviceCalendarIds.length) return;
    const day = shiftDay(new Date(), offset);
    const from = shiftDay(day, -30);
    from.setHours(0, 0, 0, 0);
    const until = shiftDay(day, 91);
    until.setHours(0, 0, 0, 0);
    const range = deviceLoadedRange.current;
    const ids = [...deviceCalendarIds].sort().join(',');
    if (!force && range && range.ids === ids && range.from <= day.getTime() && range.until >= day.getTime()) return;
    const owner = sessionGeneration();
    const requestId = ++deviceRequestNumber.current;
    setDeviceSyncing(true);
    setDeviceError(null);
    try {
      const items = await fetchDeviceEvents(deviceCalendarIds, from, until);
      if (!isCurrentSession(owner) || requestId !== deviceRequestNumber.current) return;
      replaceDeviceEvents(items);
      deviceLoadedRange.current = { from: from.getTime(), until: until.getTime(), ids };
    } catch (error) {
      if (isCurrentSession(owner) && requestId === deviceRequestNumber.current) setDeviceError(error instanceof Error ? error.message : 'Não foi possível atualizar os calendários.');
    } finally {
      if (isCurrentSession(owner) && requestId === deviceRequestNumber.current) setDeviceSyncing(false);
    }
  }

  useEffect(() => {
    if (googleConnection.connected && tokenValid) void syncGoogle();
    // A new selected day or credential may require a different calendar window.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offset, googleAccessToken, googleTokenExpiresAt, googleConnection.connected]);

  useEffect(() => {
    if (deviceCalendarIds.length) void syncDevice();
    else {
      ++deviceRequestNumber.current;
      deviceLoadedRange.current = null;
      replaceDeviceEvents([]);
    }
    // Selected calendars and day determine the window to load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offset, deviceCalendarIds]);

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        <BrandHeader />
        <ScreenHeading eyebrow={weekly ? `${weekStart.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} – ${weekEnd.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}` : selected.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short' })}
          title="Sua rotina, no seu ritmo." description="Veja a semana por horário e acompanhe seus compromissos de perto." />
        <Card style={styles.calendar}>
          <View style={styles.calendarTop}>
            <Text style={styles.month}>{selected.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toLocaleUpperCase('pt-BR')}</Text>
            {offset !== 0 ? <AnimatedPressable style={styles.today} onPress={() => setOffset(0)} accessibilityLabel="Voltar para hoje"><Text style={styles.count}>Hoje</Text></AnimatedPressable> : null}
            <View style={styles.viewToggle}>
              {(['Dia', 'Semana'] as const).map((view) => {
                const active = weekly === (view === 'Semana');
                return <Pressable key={view} accessibilityRole="button" accessibilityState={{ selected: active }} onPress={() => setWeekly(view === 'Semana')} style={[styles.viewOption, active && styles.viewOptionSelected]}>
                  <Text style={[styles.viewOptionText, active && styles.viewOptionTextSelected]}>{view}</Text>
                </Pressable>;
              })}
            </View>
            <AnimatedPressable style={styles.arrow} accessibilityLabel={weekly ? 'Semana anterior' : 'Dia anterior'} onPress={() => setOffset((day) => day - (weekly ? 7 : 1))}><Feather name="chevron-left" size={20} color={colors.textPrimary} /></AnimatedPressable>
            <AnimatedPressable style={styles.arrow} accessibilityLabel={weekly ? 'Próxima semana' : 'Próximo dia'} onPress={() => setOffset((day) => day + (weekly ? 7 : 1))}><Feather name="chevron-right" size={20} color={colors.textPrimary} /></AnimatedPressable>
          </View>
        </Card>
        <View style={styles.sectionRow}>
          <Text accessibilityRole="header" style={styles.section}>{weekly ? 'Semana' : offset === 0 ? 'Hoje' : selected.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</Text>
          <Text style={styles.count}>{visibleEvents.length} {visibleEvents.length === 1 ? 'evento' : 'eventos'}</Text>
        </View>
        {googleConnection.connected ? <View style={styles.syncRow}>
          <Text style={styles.syncText}>{syncing ? 'Atualizando Google Calendar…' : 'Google Calendar'}</Text>
          {syncing ? <ActivityIndicator size="small" color={colors.textSecondary} /> : null}
          <AnimatedPressable accessibilityLabel="Atualizar Google Calendar" disabled={syncing || !tokenValid} onPress={() => void syncGoogle(true)} style={styles.syncButton}><Feather name="refresh-cw" size={17} color={colors.textPrimary} /></AnimatedPressable>
        </View> : null}
        {googleConnection.connected && !tokenValid ? <Text style={styles.warning}>Sessão Google expirada. Reconecte em Ajustes para atualizar os eventos.</Text> : null}
        {syncError ? <Text style={styles.warning}>{syncError}</Text> : null}
        {deviceCalendarIds.length ? <View style={styles.syncRow}>
          <Text style={styles.syncText}>{deviceSyncing ? 'Atualizando calendários do aparelho…' : 'Calendários do aparelho'}</Text>
          {deviceSyncing ? <ActivityIndicator size="small" color={colors.textSecondary} /> : null}
          <AnimatedPressable accessibilityLabel="Atualizar calendários do aparelho" disabled={deviceSyncing} onPress={() => void syncDevice(true)} style={styles.syncButton}><Feather name="refresh-cw" size={17} color={colors.textPrimary} /></AnimatedPressable>
        </View> : null}
        {deviceError ? <Text style={styles.warning}>{deviceError}</Text> : null}
        <CalendarTimeline events={events} selected={selected} now={now} weekly={weekly} onEventPress={(event) => {
          const href = event.source === 'google' && event.url?.startsWith('https://www.google.com/calendar/') ? event.url : undefined;
          if (href) void Linking.openURL(href);
        }} />
        {!googleConnection.connected && !deviceCalendarIds.length ? <View style={styles.banner}>
          <Feather name="calendar" size={18} color={colors.textSecondary} />
          <Text style={styles.bannerText}>{hasGoogleClientId()
            ? 'Escolha seus calendários em Ajustes para ver os compromissos aqui.'
            : 'Escolha em Ajustes os calendários já sincronizados no aparelho, incluindo os do Google.'}</Text>
        </View> : null}
      </ScrollView>
    </ScreenContainer>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  list: { paddingBottom: spacing.xxl },
  calendar: { padding: spacing.sm, borderRadius: radius.lg },
  calendarTop: { flexDirection: 'row', alignItems: 'center' },
  month: { ...typography.tiny, color: colors.textSecondary, flex: 1, paddingLeft: spacing.sm },
  arrow: { minWidth: 40, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  viewToggle: { flexDirection: 'row', backgroundColor: colors.cardAlt, borderRadius: radius.sm, padding: 2 },
  viewOption: { paddingHorizontal: spacing.sm, minHeight: 36, justifyContent: 'center', borderRadius: radius.sm },
  viewOptionSelected: { backgroundColor: colors.accent },
  viewOptionText: { ...typography.tiny, color: colors.textSecondary },
  viewOptionTextSelected: { color: colors.accentText, fontWeight: '700' },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.md },
  syncRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  syncText: { ...typography.caption, color: colors.textSecondary, flex: 1 },
  syncButton: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  warning: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.md },
  section: { ...typography.bodyStrong, color: colors.textPrimary, flex: 1, paddingVertical: spacing.lg },
  count: { ...typography.caption, color: colors.textSecondary },
  today: { minHeight: 44, minWidth: 40, justifyContent: 'center', alignItems: 'center' },
  banner: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg, padding: spacing.md, backgroundColor: colors.routineSurface, borderRadius: radius.md },
  bannerText: { ...typography.caption, color: colors.textSecondary, flex: 1, lineHeight: 20 },
});
