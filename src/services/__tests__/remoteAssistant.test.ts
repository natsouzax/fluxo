import { devBackendURL, remotePayload, resolveAssistant } from '../remoteAssistant';
import { AssistantContext } from '../assistantTypes';

const context: AssistantContext = { accounts: [], transactions: [], budgets: [], goals: [], events: [],
  userName: 'Private user', notes: [{ id: 'n', title: 'Title', body: 'private-note-body', tags: [], createdAt: '', updatedAt: '' }] };
const originalFetch = globalThis.fetch;
const url = 'http://127.0.0.1:8787';
beforeEach(() => { globalThis.fetch = jest.fn(); });
afterEach(() => { globalThis.fetch = originalFetch; jest.useRealTimers(); });

it('only accepts the intended loopback/emulator backend in development', () => {
  expect(devBackendURL(url, true)).toBe(url);
  expect(devBackendURL('http://10.0.2.2:8787', true)).toBe('http://10.0.2.2:8787');
  expect(devBackendURL(url, false)).toBeNull();
  expect(devBackendURL('https://external.example', true)).toBeNull();
  expect(devBackendURL('http://127.0.0.1:9999', true)).toBeNull();
});

it('keeps recognized queries and disabled experimentation offline', async () => {
  expect((await resolveAssistant({ message: 'Olá', context, history: [], enabled: true, backendURL: url })).source).toBe('local');
  expect((await resolveAssistant({ message: 'Como posso me organizar melhor?', context, history: [], enabled: false, backendURL: url })).source).toBe('local');
  expect(globalThis.fetch).not.toHaveBeenCalled();
});

it('minimizes context and omits note bodies and profile name fields', () => {
  const payload = remotePayload('Help', context, Array.from({ length: 10 }, () => ({ role: 'user' as const, content: 'a'.repeat(1200) })));
  expect(payload.history).toHaveLength(6);
  expect(payload.history[0].content).toHaveLength(1000);
  expect(payload.context.noteTitles).toEqual(['Title']);
  expect(JSON.stringify(payload)).not.toContain('private-note-body');
  expect(JSON.stringify(payload)).not.toContain('Private user');
  const withLocalReply = remotePayload('Help', context, [{ role: 'assistant', content: 'private-note-excerpt' }]);
  expect(JSON.stringify(withLocalReply)).not.toContain('private-note-excerpt');
});

it('uses only the backend and treats model output as text, never as navigation/actions', async () => {
  globalThis.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ content: 'Suggestion', source: 'openrouter', destination: 'Settings' }) });
  const reply = await resolveAssistant({ message: 'Como posso me organizar melhor?', context, history: [], enabled: true, backendURL: url });
  expect(jest.mocked(globalThis.fetch).mock.calls[0][0]).toBe(`${url}/assistant`);
  const request = jest.mocked(globalThis.fetch).mock.calls[0][1]!;
  expect(request.headers).toEqual({ 'Content-Type': 'application/json' });
  expect(reply.source).toBe('openrouter');
  expect(reply.destination).toBeUndefined();
});

it('falls back without reading raw errors and does not retry on rate limit', async () => {
  const readBody = jest.fn();
  globalThis.fetch = jest.fn().mockResolvedValue({ ok: false, status: 429, text: readBody });
  const result = await resolveAssistant({ message: 'Como posso me organizar melhor?', context, history: [], enabled: true, backendURL: url });
  expect(result.source).toBe('local');
  expect(result.content).toContain('indisponível');
  expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  expect(readBody).not.toHaveBeenCalled();
});

it('keeps the timeout active during response-body loading', async () => {
  jest.useFakeTimers();
  globalThis.fetch = jest.fn().mockImplementation(async (_url, options) => ({ ok: true,
    json: () => new Promise((_resolve, reject) => options.signal.addEventListener('abort', () => reject(new Error('aborted')))),
  }));
  const pending = resolveAssistant({ message: 'Como posso me organizar melhor?', context, history: [], enabled: true, backendURL: url });
  await jest.advanceTimersByTimeAsync(25_000);
  expect((await pending).source).toBe('local');
});
