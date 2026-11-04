import React, { useEffect, useState } from 'react';
import { AppState, Text, View } from 'react-native';
import { navigationRef } from '../navigation/navigationRef';
import { useAgendaStore } from '../store/agendaStore';
import { useTasksStore } from '../store/tasksStore';
import { isCurrentSession, sessionGeneration } from '../store/profileStorage';
import { cancelOrganizationReminders, organizationNotificationsAvailable, reconcileOrganizationReminders } from '../services/organizationNotifications';
import { useAppThemeColors } from '../theme';
import { AnimatedPressable } from './AnimatedPressable';

const handled = new Set<string>();
export function OrganizationReminders() {
  const tasks = useTasksStore((state) => state.tasks);
  const events = useAgendaStore((state) => state.events);
  const colors = useAppThemeColors();
  const [tick, setTick] = useState(0);
  const [error, setError] = useState(false);
  useEffect(() => {
    if (!organizationNotificationsAvailable()) return;
    const listener = AppState.addEventListener('change', (state) => { if (state === 'active') setTick((value) => value + 1); });
    return () => { listener.remove(); void cancelOrganizationReminders().catch(() => {}); };
  }, []);
  useEffect(() => {
    let active = true;
    const owner = sessionGeneration();
    const timer = setTimeout(() => { void reconcileOrganizationReminders(tasks, events, owner)
      .then(() => { if (active && isCurrentSession(owner)) setError(false); }).catch(() => { if (active && isCurrentSession(owner)) setError(true); }); }, 350);
    return () => { active = false; clearTimeout(timer); };
  }, [tasks, events, tick]);
  useEffect(() => {
    if (!organizationNotificationsAvailable()) return;
    let active = true;
    let listener: { remove: () => void } | undefined;
    const owner = sessionGeneration();
    void import('expo-notifications').then((n) => {
      if (!active) return;
      function open(response: import('expo-notifications').NotificationResponse | null) {
        if (!response || !active || !isCurrentSession(owner) || !navigationRef.isReady()) return;
        const id = response.notification.request.identifier;
        if (handled.has(id)) return;
        const data = response.notification.request.content.data ?? {};
        if (data.scope !== 'fluxo-organization') return;
        if (typeof data.taskId === 'string' && useTasksStore.getState().tasks.some((task) => task.id === data.taskId)) {
          handled.add(id); navigationRef.navigate('TaskEditor', { taskId: data.taskId });
        } else if (typeof data.eventId === 'string' && useAgendaStore.getState().events.some((event) => event.id === data.eventId)) {
          handled.add(id); navigationRef.navigate('EventEditor', { eventId: data.eventId, occurrenceDate: typeof data.occurrenceDate === 'string' ? data.occurrenceDate || undefined : undefined });
        }
      }
      listener = n.addNotificationResponseReceivedListener(open);
      setTimeout(() => { if (active) open(n.getLastNotificationResponse()); }, 500);
    }).catch(() => { if (active) setError(true); });
    return () => { active = false; listener?.remove(); };
  }, []);
  return error ? <View style={{ backgroundColor: colors.warningSoft, padding: 12 }}><Text style={{ color: colors.textPrimary }}>Não foi possível atualizar os lembretes neste aparelho.</Text>
    <AnimatedPressable onPress={() => setTick((value) => value + 1)} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={{ color: colors.textPrimary }}>Tentar novamente</Text></AnimatedPressable></View> : null;
}
