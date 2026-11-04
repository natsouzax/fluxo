import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGenerator, FREE_MODEL } from './provider.mjs';

test('SDK sends only the free router, zero price ceilings and free-provider failover', async () => {
  let body;
  let authorization;
  const generate = createGenerator({ apiKey: 'unit-test-only', fetch: async (_url, options) => {
    body = JSON.parse(options.body);
    authorization = new Headers(options.headers).get('authorization');
    return Response.json({ id: 'test', model: 'test/model:free', created: 123,
      choices: [{ index: 0, message: { role: 'assistant', content: 'Resposta de teste.' }, finish_reason: 'stop' }],
      usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 } });
  } });
  const result = await generate({ message: 'Olá', history: [], context: { demonstrationData: true } });
  assert.equal(body.model, FREE_MODEL);
  assert.deepEqual(body.provider.max_price, { prompt: 0, completion: 0, request: 0 });
  assert.equal(body.provider.allow_fallbacks, true);
  assert.equal(body.provider.data_collection, 'deny');
  assert.equal(body.max_tokens, 400);
  assert.equal(body.models, undefined);
  assert.equal(body.tools, undefined);
  assert.equal(authorization, 'Bearer unit-test-only');
  assert.equal(result.content, 'Resposta de teste.');
  assert.equal(result.model, 'test/model:free');
});

test('provider failure does not trigger an SDK retry', async () => {
  let calls = 0;
  const generate = createGenerator({ apiKey: 'unit-test-only', fetch: async () => {
    calls++;
    return Response.json({ error: { message: 'unavailable' } }, { status: 503 });
  } });
  await assert.rejects(generate({ message: 'Olá', history: [], context: {} }));
  assert.equal(calls, 1);
});
