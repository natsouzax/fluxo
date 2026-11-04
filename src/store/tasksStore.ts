import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { Task } from '../data/organization';
import { completeTask, validateTask } from '../domain/tasks';
import { profileStorage } from './profileStorage';

interface TasksState {
  tasks: Task[];
  upsertTask: (task: Task) => void;
  complete: (id: string, nextId: string) => void;
  reopen: (id: string) => void;
  remove: (id: string, future?: boolean) => void;
  linkTransaction: (taskId: string, transactionId: string) => void;
}

export const useTasksStore = create<TasksState>()(persist((set) => ({
  tasks: [],
  upsertTask: (task) => {
    validateTask(task);
    set((state) => ({ tasks: state.tasks.some((item) => item.id === task.id)
      ? state.tasks.map((item) => item.id === task.id ? { ...task, title: task.title.trim() } : item)
      : [{ ...task, title: task.title.trim() }, ...state.tasks] }));
  },
  complete: (id, nextId) => set((state) => ({ tasks: completeTask(state.tasks, id, nextId) })),
  reopen: (id) => set((state) => {
    const task = state.tasks.find((item) => item.id === id);
    if (!task?.completedAt) return state;
    // Reopening a repeated item must not create two pending occurrences.
    if (task.nextTaskId && state.tasks.some((item) => item.id === task.nextTaskId && item.completedAt)) {
      throw new Error('Esta série já avançou. Crie uma nova tarefa para refazer esta ocorrência.');
    }
    return { tasks: state.tasks.filter((item) => item.id !== task.nextTaskId)
      .map((item) => item.id === id ? { ...item, completedAt: null, nextTaskId: undefined, updatedAt: new Date().toISOString() } : item) };
  }),
  remove: (id, future = false) => set((state) => {
    const task = state.tasks.find((item) => item.id === id);
    const series = task?.seriesId ?? task?.id;
    return { tasks: state.tasks.filter((item) => item.id !== id &&
      !(future && !item.completedAt && (item.seriesId ?? item.id) === series)) };
  }),
  linkTransaction: (taskId, transactionId) => set((state) => ({ tasks: state.tasks.map((task) =>
    task.id === taskId ? { ...task, transactionId, updatedAt: new Date().toISOString() } : task) })),
}), { name: 'fluxo-tasks', storage: createJSONStorage(() => profileStorage), skipHydration: true,
  version: 1, partialize: ({ tasks }) => ({ tasks }) }));
