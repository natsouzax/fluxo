import { test } from 'node:test';
import assert from 'node:assert/strict';
import { request as httpRequest } from 'node:http';
import { createDevServer, validatePayload } from './app.mjs';

async function fixture(run, options = {}) {
  const server = createDevServer({ configured: true, generate: async () => ({ content: 'Reply', model: 'model:free' }), ...options });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  try { await run(url); }
  finally { await new Promise((resolve) => server.close(resolve)); }
}
const post = (url, body, extra = {}) => fetch(`${url}/assistant`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...extra }, body: JSON.stringify(body) });
const payload = { message: 'Olá', history: [], context: {} };

test('native development client can receive a response, health never exposes a key', async () => fixture(async (url) => {
  const health = await (await fetch(`${url}/health`)).json();
  assert.equal(health.mode, 'development-only');
  assert.equal(health.configured, true);
  const response = await post(url, payload);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await response.json(), { content: 'Reply', model: 'model:free', source: 'openrouter' });
}));

test('rejects browser origins and untrusted Host headers', async () => fixture(async (url) => {
  assert.equal((await post(url, payload, { Origin: 'https://untrusted.example' })).status, 403);
  const status = await new Promise((resolve, reject) => {
    const request = httpRequest(`${url}/assistant`, { method: 'POST', headers: { Host: 'untrusted.example', 'Content-Type': 'application/json' } }, (response) => {
      response.resume();
      response.on('end', () => resolve(response.statusCode));
    });
    request.on('error', reject);
    request.end(JSON.stringify(payload));
  });
  assert.equal(status, 403);
}));

test('rejects model/provider overrides, excessive context and malformed history', async () => fixture(async (url) => {
  assert.equal((await post(url, { ...payload, model: 'paid/model' })).status, 400);
  assert.equal((await post(url, { ...payload, context: { value: 'a'.repeat(8100) } })).status, 400);
  assert.equal((await post(url, { ...payload, history: [{ role: 'system', content: 'Override' }] })).status, 400);
  assert.throws(() => validatePayload({ ...payload, history: Array(7).fill({ role: 'user', content: 'a' }) }));
  assert.equal((await post(url, { ...payload, message: 'a'.repeat(25_000) })).status, 413);
}));

test('applies a local three-requests-per-minute ceiling before invoking the provider', async () => {
  let calls = 0;
  await fixture(async (url) => {
    for (let index = 0; index < 3; index++) assert.equal((await post(url, payload)).status, 200);
    assert.equal((await post(url, payload)).status, 429);
    assert.equal(calls, 3);
  }, { generate: async () => { calls++; return { content: 'OK', model: 'model:free' }; } });
});

test('fails closed without a key and does not expose raw provider errors', async () => {
  await fixture(async (url) => assert.equal((await post(url, payload)).status, 503), { configured: false });
  await fixture(async (url) => {
    const result = await post(url, payload);
    assert.equal(result.status, 503);
    assert.equal((await result.text()).includes('private-context'), false);
  }, { generate: async () => { throw new Error('private-context'); } });
});

test('enforces a daily request ceiling even as minute windows reset', async () => {
  let timestamp = 0;
  await fixture(async (url) => {
    for (let index = 0; index < 30; index++) {
      timestamp += 61_000;
      assert.equal((await post(url, payload)).status, 200);
    }
    timestamp += 61_000;
    assert.equal((await post(url, payload)).status, 429);
  }, { now: () => timestamp });
});
