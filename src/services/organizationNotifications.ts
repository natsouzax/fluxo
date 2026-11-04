import { Platform } from 'react-native';
import Constants, { AppOwnership } from 'expo-constants';
import { Task } from '../data/organization';
import { AgendaEvent } from '../data/types';
import { eventsForDay } from '../domain/agenda';
import { isCurrentSession } from '../store/profileStorage';

const CHANNEL = 'fluxo-reminders';
let revision = 0;
let queue = Promise.resolve();

// Expo Go's native binary may not contain the notification module version
// required by this SDK. Keep the app usable there; reminders work in a
// matching development build or standalone build.
export function organizationNotificationsAvailable(): boolean {
  return Platform.OS !== 'web' && Constants.appOwnership !== AppOwnership.Expo;
}

export async function requestOrganizationNotifications(): Promise<boolean> {
  if (Platform.OS === 'web') throw new Error('Lembretes do sistema estao disponiveis no app Android ou iOS.');
  if (!organizationNotificationsAvailable()) throw new Error('Para usar lembretes, abra o Fluxo numa development build compatÃ­vel.');
  if (Platform.OS === 'web') throw new Error('Lembretes do sistema estão disponíveis no app Android ou iOS.');
  const notifications = await import('expo-notifications');
  if (Platform.OS === 'android') await notifications.setNotificationChannelAsync(CHANNEL, {
    name: 'Lembretes da rotina', importance: notifications.AndroidImportance.DEFAULT,
  });
  const existing = await notifications.getPermissionsAsync();
  const allowed = (p: typeof existing) => p.granted || p.ios?.status === notifications.IosAuthorizationStatus.PROVISIONAL;
  return allowed(existing) || allowed(await notifications.requestPermissionsAsync());
}

export function reconcileOrganizationReminders(tasks: Task[], events: AgendaEvent[], owner: number): Promise<void> {
  const request = ++revision;
  queue = queue.catch(() => {}).then(async () => {
    if (!organizationNotificationsAvailable() || request !== revision) return;
    const n = await import('expo-notifications');
    const scheduled = await n.getAllScheduledNotificationsAsync();
    await Promise.all(scheduled.filter((item) => item.content.data?.scope === 'fluxo-organization')
      .map((item) => n.cancelScheduledNotificationAsync(item.identifier)));
    if (request !== revision || !isCurrentSession(owner)) return;
    const permission = await n.getPermissionsAsync();
    if (!permission.granted && permission.ios?.status !== n.IosAuthorizationStatus.PROVISIONAL) return;
    n.setNotificationHandler({ handleNotification: async () => ({ shouldPlaySound: true, shouldSetBadge: false, shouldShowBanner: true, shouldShowList: true }) });
    const now = Date.now();
    const upcoming: { id: string; title: string; date: Date; taskId?: string; eventId?: string; occurrenceDate?: string }[] = [];
    tasks.forEach((task) => {
      if (!task.completedAt && task.reminderAt && Date.parse(task.reminderAt) > now) upcoming.push({ id: task.id, title: task.title, date: new Date(task.reminderAt), taskId: task.id });
    });
    const seen = new Set<string>();
    for (let offset = 0; offset < 60; offset++) {
      const day = new Date(); day.setDate(day.getDate() + offset);
      eventsForDay(events, day).forEach((event) => {
        if (event.source !== 'local' || event.reminderMinutes == null || seen.has(event.id)) return;
        seen.add(event.id);
        const date = new Date(Date.parse(event.start) - event.reminderMinutes * 60000);
        if (date.getTime() > now) upcoming.push({ id: event.id, title: event.title, date, eventId: event.seriesId ?? event.id, occurrenceDate: event.occurrenceDate });
      });
    }
    // Keep below the iOS limit; rebuild the rolling window on activity and edits.
    const closest = upcoming.sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 50);
    for (const item of closest) {
      if (request !== revision || !isCurrentSession(owner)) return;
      await n.scheduleNotificationAsync({ identifier: `fluxo.org.${item.id}`, content: {
        title: item.title, body: item.taskId ? 'Seu lembrete de tarefa no Fluxo.' : 'Seu compromisso está chegando.', sound: 'default',
        data: { scope: 'fluxo-organization', taskId: item.taskId ?? '', eventId: item.eventId ?? '', occurrenceDate: item.occurrenceDate ?? '' },
      }, trigger: { type: n.SchedulableTriggerInputTypes.DATE, date: item.date, channelId: CHANNEL } });
    }
  });
  return queue;
}

export function cancelOrganizationReminders() { return reconcileOrganizationReminders([], [], -1); }
