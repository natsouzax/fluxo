import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { randomUUID } from 'expo-crypto';
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { CONTEXTS, PRIORITIES, RECURRENCES, Task, TaskView } from '../data/organization';
import { dayKey, selectTasks } from '../domain/tasks';
import { useNow } from '../hooks/useNow';
import { RootStackParamList } from '../navigation/types';
import { useTasksStore } from '../store/tasksStore';
import { flushProfileWrites, isCurrentSession, sessionGeneration } from '../store/profileStorage';
import { radius, spacing, typography, useThemeStyles, type AppColors } from '../theme';
import { AnimatedPressable } from './AnimatedPressable';
import { Choices } from './OrganizationFields';

const VIEWS: { value: TaskView; label: string }[] = [
  { value: 'today', label: 'Hoje' }, { value: 'upcoming', label: 'Próximas' }, { value: 'inbox', label: 'Sem prazo' }, { value: 'all', label: 'Todas' }, { value: 'completed', label: 'Concluídas' },
];
export function TasksPanel() {
  const { colors, styles } = useThemeStyles(createStyles);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const tasks = useTasksStore((state) => state.tasks);
  const now = useNow();
  const [owner] = useState(sessionGeneration);
  const [capture, setCapture] = useState('');
  const [query, setQuery] = useState('');
  const [view, setView] = useState<TaskView>('all');
  const [context, setContext] = useState('all');
  const [project, setProject] = useState('');
  const [error, setError] = useState('');
  const [limit, setLimit] = useState(40);
  const projects = [...new Set(tasks.map((task) => task.project).filter(Boolean))];
  const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const filtered = selectTasks(tasks, view, now).filter((task) => (context === 'all' || task.context === context) &&
    (!project || task.project === project) && normalize(`${task.title} ${task.description} ${task.project}`).includes(normalize(query)));
  const today = selectTasks(tasks, 'today', now).length;
  async function quickAdd() {
    if (!capture.trim() || !isCurrentSession(owner)) return;
    const timestamp = new Date().toISOString();
    try {
      useTasksStore.getState().upsertTask({ id: randomUUID(), title: capture.trim(), description: '', context: context === 'all' ? 'personal' : context as Task['context'],
        project, priority: 'normal', dueAt: null, reminderAt: null, recurrence: 'none', seriesId: null,
        completedAt: null, linkedNoteId: null, transactionId: null, createdAt: timestamp, updatedAt: timestamp });
      setCapture(''); setView('inbox'); setQuery(''); setError('');
      await flushProfileWrites();
    } catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível salvar.'); }
  }
  async function toggle(task: Task) {
    if (!isCurrentSession(owner)) return;
    try {
      if (task.completedAt) useTasksStore.getState().reopen(task.id);
      else useTasksStore.getState().complete(task.id, randomUUID());
      await flushProfileWrites(); setError('');
    } catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível salvar.'); }
  }
  return <View style={styles.root}>
    <View style={styles.summary}><View style={{ flex: 1 }}><Text style={styles.summaryTitle}>Um passo de cada vez.</Text>
      <Text style={styles.muted}>{today ? `${today} ${today === 1 ? 'tarefa para hoje ou em atraso' : 'tarefas para hoje ou em atraso'}` : 'Capture uma ideia e escolha quando cuidar dela.'}</Text></View>
      <AnimatedPressable accessibilityLabel="Criar tarefa com detalhes" style={styles.detailButton} onPress={() => navigation.navigate('TaskEditor', {})}><Feather name="plus" size={22} color={colors.accentText} /></AnimatedPressable>
    </View>
    <View style={styles.capture}><TextInput accessibilityLabel="Entrada rápida de tarefa" value={capture} onChangeText={setCapture} onSubmitEditing={() => void quickAdd()}
      returnKeyType="done" maxLength={200} placeholder="O que precisa ser feito?" placeholderTextColor={colors.textMuted} style={styles.captureInput} />
      <AnimatedPressable accessibilityLabel="Adicionar tarefa rapidamente" disabled={!capture.trim()} onPress={() => void quickAdd()} style={styles.captureAdd}><Feather name="arrow-up" size={21} color={capture.trim() ? colors.accent : colors.textMuted} /></AnimatedPressable>
    </View>
    <Choices label="Mostrar" value={view} onChange={(value) => { setView(value); setLimit(40); }} options={VIEWS} />
    <Choices label="Contexto" value={context} onChange={setContext} options={[{ value: 'all', label: 'Todos' }, ...Object.entries(CONTEXTS).map(([value, label]) => ({ value, label }))]} />
    {projects.length ? <Choices label="Projeto" value={project} onChange={setProject} options={[{ value: '', label: 'Todos' }, ...projects.map((value) => ({ value, label: value }))]} /> : null}
    {tasks.length ? <TextInput accessibilityLabel="Buscar tarefas" value={query} onChangeText={setQuery} placeholder="Buscar tarefas ou projetos" placeholderTextColor={colors.textMuted} style={styles.search} /> : null}
    {error ? <Text accessibilityRole="alert" style={{ color: colors.danger }}>{error}</Text> : null}
    <Text style={styles.count}>{filtered.length} {filtered.length === 1 ? 'tarefa' : 'tarefas'}</Text>
    {filtered.slice(0, limit).map((task) => {
      const overdue = !task.completedAt && task.dueAt && dayKey(new Date(task.dueAt)) < dayKey(now);
      return <View key={task.id} style={styles.task}>
        <AnimatedPressable accessibilityRole="checkbox" accessibilityState={{ checked: !!task.completedAt }} accessibilityLabel={`${task.completedAt ? 'Reabrir' : 'Concluir'} ${task.title}`}
          style={styles.checkTarget} onPress={() => void toggle(task)}><View style={[styles.check, task.completedAt ? { backgroundColor: colors.accent, borderColor: colors.accent } : task.priority === 'high' ? { borderColor: colors.danger } : null]}>
          {task.completedAt ? <Feather name="check" size={16} color={colors.accentText} /> : null}</View></AnimatedPressable>
        <View style={{ flex: 1 }}><AnimatedPressable onPress={() => navigation.navigate('TaskEditor', { taskId: task.id })} accessibilityLabel={`Editar ${task.title}`}>
          <Text style={[styles.title, task.completedAt && styles.done]}>{task.title}</Text>
          <Text style={styles.meta}>{CONTEXTS[task.context]}{task.project ? ` · ${task.project}` : ''} · {PRIORITIES[task.priority]}</Text>
          {task.dueAt ? <Text style={[styles.meta, overdue ? { color: colors.danger } : null]}>{overdue ? 'Em atraso · ' : ''}{new Date(task.dueAt).toLocaleString('pt-PT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</Text> : null}
          {task.recurrence !== 'none' || task.reminderAt ? <Text style={styles.meta}>{task.recurrence !== 'none' ? `↻ ${RECURRENCES[task.recurrence]}` : ''}{task.reminderAt ? ' · Lembrete' : ''}</Text> : null}
        </AnimatedPressable>
          {task.context === 'shopping' && task.completedAt ? <AnimatedPressable style={styles.expense} onPress={() => navigation.navigate('TransactionEditor', { direction: 'out', taskId: task.id, description: task.title })}
            disabled={!!task.transactionId}><Text style={styles.meta}>{task.transactionId ? 'Gasto registrado' : 'Adicionar gasto (opcional) ↗'}</Text></AnimatedPressable> : null}
        </View>
      </View>;
    })}
    {!filtered.length ? <View style={styles.empty}><Feather name="check-circle" size={30} color={colors.textMuted} /><Text style={styles.muted}>{tasks.length ? 'Nada neste filtro. Experimente outro contexto ou período.' : 'Sua lista começa vazia. Escreva acima para capturar a primeira tarefa.'}</Text></View> : null}
    {filtered.length > limit ? <AnimatedPressable style={styles.expense} onPress={() => setLimit((value) => value + 40)}><Text style={styles.muted}>Mostrar mais tarefas</Text></AnimatedPressable> : null}
  </View>;
}
const createStyles = (colors: AppColors) => StyleSheet.create({
  root: { gap: spacing.sm, paddingBottom: spacing.lg },
  summary: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  summaryTitle: { ...typography.h2, color: colors.textPrimary, marginBottom: spacing.xs },
  muted: { ...typography.caption, color: colors.textSecondary, lineHeight: 20 },
  detailButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 24, backgroundColor: colors.accent },
  capture: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, borderRadius: radius.md },
  captureInput: { ...typography.body, color: colors.textPrimary, flex: 1, minHeight: 56, paddingHorizontal: spacing.md },
  captureAdd: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  search: { ...typography.body, minHeight: 48, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, color: colors.textPrimary },
  count: { ...typography.caption, color: colors.textMuted, marginTop: spacing.sm },
  task: { flexDirection: 'row', gap: spacing.xs, borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: spacing.md },
  checkTarget: { width: 44, minHeight: 44, alignItems: 'center', paddingTop: 2 },
  check: { width: 24, height: 24, borderWidth: 2, borderColor: colors.textMuted, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  title: { ...typography.bodyStrong, color: colors.textPrimary }, done: { textDecorationLine: 'line-through', color: colors.textMuted },
  meta: { ...typography.caption, color: colors.textSecondary, marginTop: 5 },
  expense: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
  empty: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xl },
});
