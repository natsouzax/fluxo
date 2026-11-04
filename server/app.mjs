import { createServer } from 'node:http';
import { FREE_MODEL } from './provider.mjs';

const loopback = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);
const allowedHosts = new Set(['127.0.0.1', 'localhost', '10.0.2.2']);

export function validatePayload(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) ||
      Object.keys(value).some((key) => !['message', 'history', 'context'].includes(key))) throw new Error('Invalid request');
  const { message, history = [], context = {} } = value;
  if (typeof message !== 'string' || !message.trim() || message.length > 4000 ||
      !Array.isArray(history) || history.length > 6 || history.some((turn) =>
        !turn || !['user', 'assistant'].includes(turn.role) || typeof turn.content !== 'string' || turn.content.length > 1000) ||
      !context || typeof context !== 'object' || Array.isArray(context) || JSON.stringify(context).length > 8000) {
    throw new Error('Invalid request');
  }
  return { message: message.trim(), history: history.map(({ role, content }) => ({ role, content })), context };
}

export function createDevServer({ generate, configured = false, now = Date.now }) {
  let minute = { at: now(), count: 0 };
  let day = { at: now(), count: 0 };
  let inFlight = false;
  const server = createServer(async (request, response) => {
    const send = (status, value) => {
      if (response.destroyed) return;
      response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'Connection': 'close', 'X-Content-Type-Options': 'nosniff' });
      response.end(JSON.stringify(value));
    };
    let host;
    try { host = new URL(`http://${request.headers.host}`).hostname; } catch { host = ''; }
    // Native development client only. Block browser origins and DNS rebinding.
    if (!loopback.has(request.socket.remoteAddress) || !allowedHosts.has(host) || request.headers.origin ||
        request.headers['sec-fetch-site'] === 'cross-site') return send(403, { error: 'Cliente de desenvolvimento não permitido.' });
    if (request.url === '/health' && request.method === 'GET') return send(200, { mode: 'development-only', configured, model: FREE_MODEL });
    if (request.url !== '/assistant' || request.method !== 'POST') return send(404, { error: 'Rota indisponível.' });
    if (!configured) return send(503, { error: 'Backend sem chave configurada.' });
    if (!/^application\/json(?:;|$)/i.test(request.headers['content-type'] ?? '')) return send(415, { error: 'Envie JSON.' });
    if (Number(request.headers['content-length']) > 24_000) return send(413, { error: 'Mensagem grande demais.' });
    if (now() - minute.at >= 60_000) minute = { at: now(), count: 0 };
    if (now() - day.at >= 86_400_000) day = { at: now(), count: 0 };
    if (inFlight || minute.count >= 3 || day.count >= 30) return send(429, { error: 'Limite local de teste atingido. Use o modo local.' });
    const controller = new AbortController();
    const cancel = () => { if (!response.writableEnded) controller.abort(); };
    response.on('close', cancel);
    try {
      let size = 0;
      const chunks = [];
      for await (const chunk of request) {
        size += chunk.length;
        if (size > 24_000) { send(413, { error: 'Mensagem grande demais.' }); return; }
        chunks.push(chunk);
      }
      let payload;
      try { payload = validatePayload(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
      catch { return send(400, { error: 'Mensagem ou contexto inválido.' }); }
      // Recheck after reading: another request may have finished parsing meanwhile.
      if (inFlight || minute.count >= 3 || day.count >= 30) return send(429, { error: 'Limite local de teste atingido.' });
      minute.count++;
      day.count++;
      inFlight = true;
      try {
        const result = await generate(payload, controller.signal);
        send(200, { content: result.content, model: result.model, source: 'openrouter' });
      } finally { inFlight = false; }
    } catch {
      // Do not log/return provider errors, requests, context or credentials.
      send(503, { error: 'IA gratuita indisponível. Continue pelo modo local.' });
    } finally { response.off('close', cancel); }
  });
  server.requestTimeout = 10_000;
  server.headersTimeout = 5000;
  return server;
}
