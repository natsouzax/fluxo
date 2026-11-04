import * as Calendar from 'expo-calendar';
import { AgendaEvent } from '../data/types';

export interface DeviceCalendarOption {
  id: string;
  title: string;
  account: string;
}

export async function listDeviceCalendars(): Promise<DeviceCalendarOption[]> {
  const permission = await Calendar.requestCalendarPermissions();
  if (permission.status !== 'granted') throw new Error('Permissão de calendário negada no aparelho.');
  const calendars = await Calendar.getCalendars(Calendar.EntityTypes.EVENT);
  return calendars.map((calendar) => ({
    id: calendar.id,
    title: calendar.title,
    account: calendar.ownerAccount || calendar.source?.name || 'No aparelho',
  }));
}

function dateValue(value: string | Date, allDay: boolean): string {
  const date = value instanceof Date ? value : new Date(value);
  return allDay ? date.toISOString().slice(0, 10) : date.toISOString();
}

export async function fetchDeviceEvents(ids: string[], from: Date, until: Date): Promise<AgendaEvent[]> {
  if (!ids.length) return [];
  const permission = await Calendar.getCalendarPermissions();
  if (permission.status !== 'granted') throw new Error('Ative a permissão de calendário nas configurações do aparelho.');
  const events = await Calendar.listEvents(ids, from, until);
  return events.map((event) => ({
    id: `device:${event.calendarId}:${event.instanceId || event.id}`,
    title: event.title?.trim() || 'Evento sem título',
    start: dateValue(event.startDate, event.allDay),
    end: dateValue(event.endDate, event.allDay),
    source: 'device' as const,
    notes: event.notes || undefined,
    location: event.location || undefined,
  }));
}
