import { AgendaEvent } from '../data/types';
import { eventDate } from './agenda';

export function layoutCalendarDay(events: AgendaEvent[], day: Date) {
  const from = new Date(day.getFullYear(), day.getMonth(), day.getDate());
  const until = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1);
  const timed = events.filter((event) => !/^\d{4}-\d{2}-\d{2}$/.test(event.start)).flatMap((event) => {
    const start = eventDate(event.start); const end = eventDate(event.end);
    const startMinute = start <= from ? 0 : start.getHours() * 60 + start.getMinutes();
    const endMinute = end >= until ? 1440 : end.getHours() * 60 + end.getMinutes();
    return endMinute > startMinute ? [{ event, startMinute, endMinute }] : [];
  }).sort((a, b) => a.startMinute - b.startMinute || b.endMinute - a.endMinute);
  const clusters: (typeof timed)[] = [];
  timed.forEach((item) => {
    const cluster = clusters[clusters.length - 1];
    if (cluster && item.startMinute < Math.max(...cluster.map((entry) => entry.endMinute))) cluster.push(item);
    else clusters.push([item]);
  });
  return clusters.flatMap((cluster) => {
    const lanes: number[] = [];
    return cluster.map((item) => {
      let lane = lanes.findIndex((end) => end <= item.startMinute);
      if (lane < 0) lane = lanes.length;
      lanes[lane] = item.endMinute;
      return { ...item, lane };
    }).map((item) => ({ ...item, laneCount: lanes.length }));
  });
}
