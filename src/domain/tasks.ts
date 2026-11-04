import { Task, TaskView, CONTEXTS, PRIORITIES, RECURRENCES } from '../data/organization';

export function dayKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function advanceOccurrence(date: Date, recurrence: Task['recurrence'], anchorDay = date.getDate()): Date {
  const next = new Date(date);
  if (recurrence === 'monthly') {
    next.setDate(1);
    next.setMonth(next.getMonth() + 1);
    const last = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
    next.setDate(Math.min(anchorDay, last));
  } else next.setDate(next.getDate() + (recurrence === 'weekly' ? 7 : 1));
  return next;
}

export function validateTask(task: Task): void {
  if (!task.id || !task.title.trim() || task.title.length > 200 || !CONTEXTS[task.context] || !PRIORITIES[task.priority] || !RECURRENCES[task.recurrence]) {
    throw new Error('Confira o título, contexto e prioridade da tarefa.');
  }
  if ((task.dueAt && !Number.isFinite(Date.parse(task.dueAt))) || (task.reminderAt && !Number.isFinite(Date.parse(task.reminderAt)))) throw new Error('Informe uma data válida.');
  if (task.recurrence !== 'none' && !task.dueAt) throw new Error('Defina o primeiro prazo para repetir a tarefa.');
}

export function completeTask(tasks: Task[], id: string, nextId: string, now = new Date()): Task[] {
  const task = tasks.find((item) => item.id === id);
  if (!task || task.completedAt) return tasks;
  const timestamp = now.toISOString();
  const done = { ...task, completedAt: timestamp, updatedAt: timestamp };
  if (task.recurrence === 'none' || !task.dueAt) return tasks.map((item) => item.id === id ? done : item);
  const original = new Date(task.dueAt);
  const due = advanceOccurrence(original, task.recurrence, task.recurrenceDay);
  const reminder = task.reminderAt
    ? new Date(due.getTime() - (original.getTime() - Date.parse(task.reminderAt))).toISOString() : null;
  const next: Task = { ...task, id: nextId, seriesId: task.seriesId ?? task.id,
    dueAt: due.toISOString(), reminderAt: reminder, completedAt: null, nextTaskId: undefined,
    transactionId: null, createdAt: timestamp, updatedAt: timestamp };
  return [next, ...tasks.map((item) => item.id === id ? { ...done, nextTaskId: nextId } : item)];
}

export function selectTasks(tasks: Task[], view: TaskView, now = new Date()): Task[] {
  const today = dayKey(now);
  const rank = { high: 0, normal: 1, low: 2 };
  return tasks.filter((task) => {
    if (view === 'completed') return !!task.completedAt;
    if (task.completedAt) return false;
    const due = task.dueAt ? dayKey(new Date(task.dueAt)) : null;
    if (view === 'today') return !!due && due <= today;
    if (view === 'upcoming') return !!due && due > today;
    if (view === 'inbox') return !due;
    return true;
  }).sort((a, b) => {
    if (view === 'completed') return (b.completedAt ?? '').localeCompare(a.completedAt ?? '');
    const overdueA = a.dueAt && dayKey(new Date(a.dueAt)) < today ? 0 : 1;
    const overdueB = b.dueAt && dayKey(new Date(b.dueAt)) < today ? 0 : 1;
    return overdueA - overdueB || rank[a.priority] - rank[b.priority] ||
      (a.dueAt ?? 'z').localeCompare(b.dueAt ?? 'z') || b.createdAt.localeCompare(a.createdAt);
  });
}
