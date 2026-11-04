import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { randomUUID } from 'expo-crypto';
import React, { useState } from 'react';
import { Linking, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { AnimatedPressable } from '../components/AnimatedPressable';
import { Choices, DateTimeField, fieldStyles } from '../components/OrganizationFields';
import { DetailHeader } from '../components/DetailHeader';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenContainer } from '../components/ScreenContainer';
import { CONTEXTS, RECURRENCES, Recurrence, TaskContext } from '../data/organization';
import { eventsForDay } from '../domain/agenda';
import { dayKey } from '../domain/tasks';
import { RootStackParamList } from '../navigation/types';
import { useAgendaStore } from '../store/agendaStore';
import { flushProfileWrites, isCurrentSession, sessionGeneration } from '../store/profileStorage';
import { requestOrganizationNotifications } from '../services/organizationNotifications';
import { spacing, typography, useThemeStyles, type AppColors } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'EventEditor'>;
export function EventEditorScreen({ navigation, route }: Props) {
  const { colors, styles } = useThemeStyles(createStyles);
  const events = useAgendaStore((state) => state.events);
  const original = events.find((event) => event.id === route.params?.eventId);
  const occurrence = route.params?.occurrenceDate;
  const initial = (original && occurrence ? eventsForDay([original], new Date(`${occurrence}T12:00:00`)).find((event) => event.occurrenceDate === occurrence) : original) ?? original;
  const external = original && original.source !== 'local';
  const repeating = !!original?.recurrence && original.recurrence !== 'none' && !!occurrence;
  const [id] = useState(() => original && !repeating ? original.id : randomUUID());
  const [owner] = useState(sessionGeneration);
  const [title, setTitle] = useState(initial?.title ?? '');
  const [start, setStart] = useState<string | null>(() => initial?.start && !/^\d{4}-\d{2}-\d{2}$/.test(initial.start) ? initial.start :
    new Date(`${initial?.start ?? route.params?.date ?? dayKey(new Date())}T09:00:00`).toISOString());
  const [end, setEnd] = useState<string | null>(initial?.end && !/^\d{4}-\d{2}-\d{2}$/.test(initial.end) ? initial.end : new Date(Date.parse(start!) + 3600000).toISOString());
  const [location, setLocation] = useState(initial?.location ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [category, setCategory] = useState<TaskContext>(initial?.category ?? 'personal');
  const [recurrence, setRecurrence] = useState<Recurrence>(original?.recurrence ?? 'none');
  const [reminder, setReminder] = useState(String(initial?.reminderMinutes ?? 'none'));
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [scopeAction, setScopeAction] = useState<'save' | 'delete' | null>(null);
  async function apply(scope: 'one' | 'future', deleting = false) {
    if (!isCurrentSession(owner) || busy || external) return;
    setScopeAction(null); setBusy(true); setError('');
    try {
      if (route.params?.eventId && !original) throw new Error('O compromisso já não existe.');
      if (deleting) useAgendaStore.getState().deleteLocalEvent(original!.id, occurrence, scope);
      else {
        if (!title.trim() || !start || !end || !Number.isFinite(Date.parse(start)) || !Number.isFinite(Date.parse(end)) || Date.parse(end) <= Date.parse(start)) throw new Error('Informe título, início e fim válidos.');
        const reminderMinutes = reminder === 'none' ? null : Number(reminder);
        if (reminderMinutes != null && reminderMinutes !== original?.reminderMinutes && !await requestOrganizationNotifications()) throw new Error('Notificações não autorizadas. Ative-as no aparelho ou escolha sem lembrete.');
        if (!isCurrentSession(owner)) return;
        useAgendaStore.getState().saveLocalEvent({ id, title: title.trim(), start, end, source: 'local', location: location.trim(), notes: notes.trim(), category,
          recurrence, reminderMinutes, financeRelated: category === 'shopping' }, original?.id, occurrence, scope);
      }
      await flushProfileWrites(); if (isCurrentSession(owner)) navigation.goBack();
    } catch (e) { if (isCurrentSession(owner)) setError(e instanceof Error ? e.message : 'Não foi possível salvar.'); }
    finally { if (isCurrentSession(owner)) setBusy(false); }
  }
  return <ScreenContainer bottomSafeArea><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
    <DetailHeader title={external ? 'Detalhes do compromisso' : original ? 'Editar compromisso' : 'Novo compromisso'} onBack={() => navigation.goBack()} />
    {external ? <>
      <Text style={styles.heading}>{initial?.title}</Text><Text style={styles.muted}>{initial?.start ? new Date(initial.start).toLocaleString('pt-PT') : ''} — {initial?.end ? new Date(initial.end).toLocaleString('pt-PT') : ''}</Text>
      {location ? <Text style={styles.muted}>{location}</Text> : null}{notes ? <Text style={styles.muted}>{notes}</Text> : null}
      <Text style={styles.muted}>Importado do {original.source === 'google' ? 'Google Calendar' : 'calendário do aparelho'}. Faça alterações no calendário de origem.</Text>
      {original.url?.startsWith('https://www.google.com/calendar/') ? <PrimaryButton label="Abrir no Google Calendar" onPress={() => void Linking.openURL(original.url!)} /> : null}
    </> : <>
      <Text style={styles.label}>Título</Text><TextInput accessibilityLabel="Título do compromisso" value={title} onChangeText={setTitle} maxLength={200} placeholder="Nome do compromisso" placeholderTextColor={colors.textMuted} style={styles.input} />
      <DateTimeField label="Início" value={start} onChange={setStart} /><DateTimeField label="Fim" value={end} onChange={setEnd} />
      <Choices label="Contexto" value={category} onChange={setCategory} options={Object.entries(CONTEXTS).map(([value, label]) => ({ value: value as TaskContext, label }))} />
      <Text style={styles.label}>Local (opcional)</Text><TextInput accessibilityLabel="Local do compromisso" style={styles.input} value={location} onChangeText={setLocation} maxLength={200} placeholderTextColor={colors.textMuted} placeholder="Local ou link da reunião" />
      <Text style={styles.label}>Notas (opcional)</Text><TextInput accessibilityLabel="Notas do compromisso" style={[styles.input, { minHeight: 90 }]} value={notes} onChangeText={setNotes} maxLength={4000} multiline />
      <Choices label="Repetição" value={recurrence} onChange={setRecurrence} options={Object.entries(RECURRENCES).map(([value, label]) => ({ value: value as Recurrence, label }))} />
      <Choices label="Lembrete" value={reminder} onChange={setReminder} options={[{ value: 'none', label: 'Sem lembrete' }, { value: '0', label: 'Na hora' }, { value: '10', label: '10 min antes' }, { value: '30', label: '30 min antes' }, { value: '60', label: '1 hora antes' }]} />
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      <PrimaryButton label={busy ? 'Salvando…' : 'Salvar compromisso'} disabled={busy} onPress={() => repeating ? setScopeAction('save') : void apply('future')} />
      {original ? <AnimatedPressable style={styles.clear} onPress={() => setScopeAction('delete')}><Text style={styles.error}>Excluir compromisso</Text></AnimatedPressable> : null}
    </>}
  </ScrollView><Modal visible={!!scopeAction} transparent animationType="fade" onRequestClose={() => setScopeAction(null)}>
    <View style={styles.modalBackdrop}><Pressable style={StyleSheet.absoluteFill} onPress={() => setScopeAction(null)} accessibilityLabel="Cancelar alteração" />
      <View accessibilityViewIsModal style={styles.modal}><Text style={styles.heading}>{scopeAction === 'delete' ? 'Excluir compromisso?' : 'Onde aplicar a mudança?'}</Text>
        <Text style={styles.muted}>{repeating ? 'Esta data faz parte de uma série. As ocorrências passadas serão preservadas.' : 'O compromisso será removido do seu perfil.'}</Text>
        {repeating ? <><PrimaryButton label="Só nesta data" onPress={() => void apply('one', scopeAction === 'delete')} /><PrimaryButton label="Nesta e nas próximas" variant="secondary" onPress={() => void apply('future', scopeAction === 'delete')} /></> : <PrimaryButton label="Excluir" onPress={() => void apply('future', true)} />}
        <AnimatedPressable style={styles.clear} onPress={() => setScopeAction(null)}><Text style={styles.chipText}>Cancelar</Text></AnimatedPressable>
      </View>
    </View></Modal></ScreenContainer>;
}
const createStyles = (colors: AppColors) => StyleSheet.create({
  ...fieldStyles(colors), content: { gap: spacing.sm, paddingVertical: spacing.lg }, heading: { ...typography.h2, color: colors.textPrimary }, error: { ...typography.caption, color: colors.danger },
  modalBackdrop: { flex: 1, justifyContent: 'center', padding: spacing.lg, backgroundColor: 'rgba(0,0,0,0.45)' }, modal: { backgroundColor: colors.card, padding: spacing.lg, borderRadius: 20, gap: spacing.md },
});
