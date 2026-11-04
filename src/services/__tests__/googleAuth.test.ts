import { fetchCalendarEvents, toAgendaEvents } from '../googleAuth';

jest.mock('expo-web-browser', () => ({ maybeCompleteAuthSession: jest.fn() }));

it('loads every page and excludes cancelled or incomplete Google events', async () => {
  const request = jest.fn()
    .mockResolvedValueOnce({ ok: true, json: async () => ({
      items: [
        { id: 'one', summary: 'Reunião', start: { dateTime: '2026-10-20T10:00:00Z' }, end: { dateTime: '2026-10-20T11:00:00Z' } },
        { id: 'gone', status: 'cancelled', start: { date: '2026-10-20' }, end: { date: '2026-10-21' } },
      ], nextPageToken: 'page-two',
    }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({
      items: [{ id: 'two', summary: 'Férias', start: { date: '2026-10-21' }, end: { date: '2026-10-23' } }],
    }) });
  const previous = globalThis.fetch;
  globalThis.fetch = request as typeof fetch;
  try {
    const items = await fetchCalendarEvents('token', new Date('2026-10-01T00:00:00Z'), new Date('2026-11-01T00:00:00Z'));
    expect(items.map((item) => item.id)).toEqual(['one', 'two']);
    expect(request.mock.calls[1][0]).toContain('pageToken=page-two');
    expect(toAgendaEvents(items).map((item) => item.id)).toEqual(['google:one', 'google:two']);
    expect(toAgendaEvents(items)[1].start).toBe('2026-10-21');
  } finally {
    globalThis.fetch = previous;
  }
});
