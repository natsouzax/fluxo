import * as Calendar from 'expo-calendar';
import { fetchDeviceEvents } from '../deviceCalendar';

jest.mock('expo-calendar', () => ({
  getCalendarPermissions: jest.fn(),
  listEvents: jest.fn(),
}));

it('maps a device all-day event to local calendar dates', async () => {
  (Calendar.getCalendarPermissions as jest.Mock).mockResolvedValue({ status: 'granted' });
  (Calendar.listEvents as jest.Mock).mockResolvedValue([{
    id: 'event-1', calendarId: 'calendar-1', title: 'Viagem', allDay: true,
    startDate: new Date('2026-10-20T00:00:00Z'), endDate: new Date('2026-10-22T00:00:00Z'),
    notes: 'Levar documentos', location: 'Lisboa',
  }]);
  const events = await fetchDeviceEvents(['calendar-1'], new Date('2026-10-01'), new Date('2026-11-01'));
  expect(events).toEqual([expect.objectContaining({
    id: 'device:calendar-1:event-1', source: 'device', start: '2026-10-20', end: '2026-10-22',
    title: 'Viagem', location: 'Lisboa',
  })]);
});
