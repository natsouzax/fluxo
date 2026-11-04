export type TaskContext = 'personal' | 'work' | 'study' | 'shopping' | 'project';
export type TaskPriority = 'low' | 'normal' | 'high';
export type Recurrence = 'none' | 'daily' | 'weekly' | 'monthly';

export const CONTEXTS: Record<TaskContext, string> = {
  personal: 'Pessoal', work: 'Trabalho', study: 'Estudos', shopping: 'Compras', project: 'Projeto',
};
export const PRIORITIES: Record<TaskPriority, string> = { high: 'Alta', normal: 'Normal', low: 'Baixa' };
export const RECURRENCES: Record<Recurrence, string> = { none: 'Não repetir', daily: 'Diária', weekly: 'Semanal', monthly: 'Mensal' };

export interface Task {
  id: string;
  title: string;
  description: string;
  context: TaskContext;
  project: string;
  priority: TaskPriority;
  dueAt: string | null;
  reminderAt: string | null;
  recurrence: Recurrence;
  /** Original day anchors monthly repetitions (31 Jan → 28 Feb → 31 Mar). */
  recurrenceDay?: number;
  seriesId: string | null;
  nextTaskId?: string;
  completedAt: string | null;
  linkedNoteId: string | null;
  transactionId: string | null;
  createdAt: string;
  updatedAt: string;
}

export type TaskView = 'today' | 'upcoming' | 'inbox' | 'all' | 'completed';
