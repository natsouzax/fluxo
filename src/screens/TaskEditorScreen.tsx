import { randomUUID } from 'expo-crypto';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { AnimatedPressable } from '../components/AnimatedPressable';
import { DetailHeader } from '../components/DetailHeader';
import { Choices, DateTimeField, fieldStyles } from '../components/OrganizationFields';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenContainer } from '../components/ScreenContainer';
import { CONTEXTS, PRIORITIES, RECURRENCES, Task, TaskContext, TaskPriority, Recurrence } from '../data/organization';
import { RootStackParamList } from '../navigation/types';
import { requestOrganizationNotifications } from '../services/organizationNotifications';
import { useTasksStore } from '../store/tasksStore';
import { useNotesStore } from '../store/notesStore';
import { flushProfileWrites, isCurrentSession, sessionGeneration } from '../store/profileStorage';
import { spacing, typography, useThemeStyles, type AppColors } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'TaskEditor'>;
export function TaskEditorScreen({ navigation, route }: Props) {
  const { colors, styles } = useThemeStyles(createStyles);
  const existing = useTasksStore((state) => state.tasks.find((task) => task.id === route.params?.taskId));
  const notes = useNotesStore((state) => state.notes);
  const [id] = useState(() => existing?.id ?? randomUUID());
  const [owner] = useState(sessionGeneration);
  const [title, setTitle] = useState(existing?.title ?? route.params?.title ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [context, setContext] = useState<TaskContext>(existing?.context ?? 'personal');
  const [project, setProject] = useState(existing?.project ?? '');
  const [priority, setPriority] = useState<TaskPriority>(existing?.priority ?? 'normal');
  const [dueAt, setDueAt] = useState<string | null>(existing?.dueAt ?? null);
  const [reminderAt, setReminderAt] = useState<string | null>(existing?.reminderAt ?? null);
  const [recurrence, setRecurrence] = useState<Recurrence>(existing?.recurrence ?? 'none');
  const [linkedNoteId, setLinkedNoteId] = useState<string | null>(existing?.linkedNoteId ?? null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const projects = useTasksStore((state) => state.tasks).map((task) => task.project).filter(Boolean);
  const uniqueProjects = [...new Set(projects)];
  async function save() {
    if (busy || !isCurrentSession(owner)) return;
    if (route.params?.taskId && !existing) { setError('Esta tarefa já não existe. Volte para a lista.'); return; }
    if (!title.trim()) { setError('Dê um nome à tarefa.'); return; }
    if (recurrence !== 'none' && !dueAt) { setError('Defina o primeiro prazo para repetir a tarefa.'); return; }
    setBusy(true); setError('');
    try {
      if (reminderAt && reminderAt !== existing?.reminderAt) {
        if (Date.parse(reminderAt) <= Date.now()) throw new Error('Escolha uma hora futura para o lembrete.');
        if (!await requestOrganizationNotifications()) throw new Error('Notificações não autorizadas. Ative-as no aparelho ou desative o lembrete para salvar.');
      }
      if (!isCurrentSession(owner)) return;
      const timestamp = new Date().toISOString();
      const task: Task = { id, title, description, context, project: project.trim(), priority, dueAt, reminderAt, recurrence,
        recurrenceDay: dueAt ? new Date(dueAt).getDate() : undefined, seriesId: existing?.seriesId ?? (recurrence !== 'none' ? id : null),
        completedAt: existing?.completedAt ?? null, nextTaskId: existing?.nextTaskId, linkedNoteId,
        transactionId: existing?.transactionId ?? null, createdAt: existing?.createdAt ?? timestamp, updatedAt: timestamp };
      useTasksStore.getState().upsertTask(task);
      await flushProfileWrites();
      if (isCurrentSession(owner)) navigation.goBack();
    } catch (e) { if (isCurrentSession(owner)) setError(e instanceof Error ? e.message : 'Não foi possível salvar.'); }
    finally { if (isCurrentSession(owner)) setBusy(false); }
  }
  function remove() {
    Alert.alert('Excluir tarefa?', 'Esta ação remove a tarefa do seu perfil.', [
      { text: 'Cancelar', style: 'cancel' },
      ...(existing?.recurrence !== 'none' && existing?.recurrence ? [{ text: 'Esta e próximas', onPress: () => void deleteTask(true) }] : []),
      { text: 'Só esta tarefa', style: 'destructive' as const, onPress: () => void deleteTask(false) },
    ]);
  }
  async function deleteTask(future: boolean) {
    if (!isCurrentSession(owner)) return;
    try { useTasksStore.getState().remove(id, future); await flushProfileWrites(); if (isCurrentSession(owner)) navigation.goBack(); }
    catch { setError('A remoção não foi salva. Tente novamente.'); }
  }
  return <ScreenContainer bottomSafeArea><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
    <DetailHeader title={existing ? 'Editar tarefa' : 'Nova tarefa'} onBack={() => navigation.goBack()} />
    <Text style={styles.label}>O que precisa ser feito?</Text>
    <TextInput accessibilityLabel="Título da tarefa" autoFocus={!existing} value={title} onChangeText={setTitle} maxLength={200}
      placeholder="Uma ação simples e concreta" placeholderTextColor={colors.textMuted} style={styles.input} />
    <TextInput accessibilityLabel="Detalhes da tarefa" value={description} onChangeText={setDescription} maxLength={4000} multiline
      placeholder="Detalhes, links ou passos (opcional)" placeholderTextColor={colors.textMuted} style={[styles.input, { minHeight: 90, textAlignVertical: 'top' }]} />
    <Choices label="Contexto" value={context} onChange={setContext} options={Object.entries(CONTEXTS).map(([value, label]) => ({ value: value as TaskContext, label }))} />
    <Text style={styles.label}>Projeto (opcional)</Text>
    <TextInput accessibilityLabel="Projeto da tarefa" value={project} onChangeText={setProject} maxLength={60} placeholder="Nome do projeto" placeholderTextColor={colors.textMuted} style={styles.input} />
    {uniqueProjects.length ? <View style={styles.choices}>{uniqueProjects.map((name) => <AnimatedPressable key={name} style={styles.chip} onPress={() => setProject(name)}><Text style={styles.chipText}>{name}</Text></AnimatedPressable>)}</View> : null}
    <Choices label="Prioridade" value={priority} onChange={setPriority} options={Object.entries(PRIORITIES).map(([value, label]) => ({ value: value as TaskPriority, label }))} />
    <DateTimeField label="Prazo (opcional)" value={dueAt} onChange={setDueAt} />
    <Choices label="Repetição após concluir" value={recurrence} onChange={setRecurrence} options={Object.entries(RECURRENCES).map(([value, label]) => ({ value: value as Recurrence, label }))} />
    <Text style={styles.muted}>Ao concluir, a próxima ocorrência será criada a partir do prazo. Nada é marcado como feito automaticamente.</Text>
    <View style={styles.switchRow}><Text style={styles.label}>Lembrar-me</Text><Switch accessibilityLabel="Ativar lembrete da tarefa" value={!!reminderAt}
      onValueChange={(on) => setReminderAt(on ? dueAt ?? new Date(Date.now() + 3600000).toISOString() : null)} /></View>
    {reminderAt ? <DateTimeField label="Quando avisar" value={reminderAt} onChange={setReminderAt} /> : null}
    {notes.length ? <Choices label="Nota relacionada" value={linkedNoteId ?? ''} onChange={(value) => setLinkedNoteId(value || null)}
      options={[{ value: '', label: 'Nenhuma' }, ...notes.map((note) => ({ value: note.id, label: note.title }))]} /> : null}
    {linkedNoteId ? <AnimatedPressable style={styles.clear} onPress={() => navigation.navigate('NoteEditor', { noteId: linkedNoteId })}><Text style={styles.chipText}>Abrir nota relacionada ↗</Text></AnimatedPressable> : null}
    {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    <PrimaryButton label={busy ? 'Salvando…' : 'Salvar tarefa'} onPress={() => void save()} disabled={busy} />
    {existing ? <AnimatedPressable onPress={remove} style={styles.clear}><Text style={styles.error}>Excluir tarefa</Text></AnimatedPressable> : null}
  </ScrollView></ScreenContainer>;
}
const createStyles = (colors: AppColors) => StyleSheet.create({
  ...fieldStyles(colors), content: { paddingTop: spacing.md, paddingBottom: spacing.xxl, gap: spacing.sm },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 48 },
  error: { ...typography.caption, color: colors.danger },
});
