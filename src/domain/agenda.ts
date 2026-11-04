import { AgendaEvent } from '../data/types';
import { dayKey } from './tasks';

export function eventDate(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : new Date(value);
}

export function eventsForDay(events: AgendaEvent[], day = new Date()): AgendaEvent[] {
  const from = new Date(day.getFullYear(), day.getMonth(), day.getDate());
  const until = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1);
  const expanded = events.flatMap((event): AgendaEvent[] => {
    if (event.source !== 'local' || !event.recurrence || event.recurrence === 'none') return [event];
    const start = eventDate(event.start);
    const end = eventDate(event.end);
    if (!Number.isFinite(start.getTime()) || end <= start) return [];
    const span = Math.ceil((Date.UTC(end.getFullYear(), end.getMonth(), end.getDate()) -
      Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())) / 86400000);
    const occurrences: AgendaEvent[] = [];
    // Look behind the selected day to include occurrences spanning midnight.
    for (let back = 0; back <= Math.min(span, 366); back++) {
      const anchor = new Date(from.getFullYear(), from.getMonth(), from.getDate() - back);
      const key = dayKey(anchor);
      if (key < dayKey(start) || (event.recurrenceUntil && key > event.recurrenceUntil) || event.excludedDates?.includes(key)) continue;
      const lastDay = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0).getDate();
      if (event.recurrence === 'weekly' && anchor.getDay() !== start.getDay()) continue;
      if (event.recurrence === 'monthly' && anchor.getDate() !== Math.min(start.getDate(), lastDay)) continue;
      const instanceStart = new Date(anchor); instanceStart.setHours(start.getHours(), start.getMinutes(), start.getSeconds(), 0);
      const instanceEnd = new Date(anchor); instanceEnd.setDate(instanceEnd.getDate() + span);
      instanceEnd.setHours(end.getHours(), end.getMinutes(), end.getSeconds(), 0);
      const allDay = /^\d{4}-\d{2}-\d{2}$/.test(event.start);
      occurrences.push({ ...event, id: `${event.id}@${key}`, seriesId: event.id, occurrenceDate: key,
        start: allDay ? dayKey(instanceStart) : instanceStart.toISOString(), end: allDay ? dayKey(instanceEnd) : instanceEnd.toISOString() });
    }
    return occurrences;
  });
  return expanded.filter((event) => {
    const start = eventDate(event.start);
    const end = eventDate(event.end);
    // Google all-day end dates are exclusive; overlapping multi-day events belong here too.
    return start < until && end > from && end >= start;
  }).sort((a, b) => eventDate(a.start).getTime() - eventDate(b.start).getTime());
}
