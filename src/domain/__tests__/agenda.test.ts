import { AgendaEvent } from '../../data/types';
import { eventDate, eventsForDay } from '../agenda';

const day = new Date(2026, 9, 20, 12);
const at = (date: number, hour: number) => new Date(2026, 9, date, hour).toISOString();
const event = (id: string, start: string, end: string): AgendaEvent => ({ id, start, end, title: id, source: 'local' });

it('shows today and overlapping events, excluding yesterday and tomorrow', () => {
  const result = eventsForDay([
    event('tomorrow', at(21, 9), at(21, 10)), event('today', at(20, 9), at(20, 10)),
    event('yesterday', at(19, 9), at(19, 10)), event('overnight', at(19, 23), at(20, 1)),
  ], day);
  expect(result.map((item) => item.id)).toEqual(['overnight', 'today']);
});

it('treats Google all-day dates as local days with an exclusive end', () => {
  const allDay = event('all-day', '2026-10-20', '2026-10-21');
  expect(eventDate(allDay.start).getHours()).toBe(0);
  expect(eventsForDay([allDay], day)).toHaveLength(1);
  expect(eventsForDay([allDay], new Date(2026, 9, 21, 12))).toHaveLength(0);
});

it('excludes invalid and reversed intervals', () => {
  expect(eventsForDay([event('invalid', 'bad', 'bad'), event('backwards', at(20, 12), at(20, 9))], day)).toEqual([]);
});
