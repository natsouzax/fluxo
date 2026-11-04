import { createDevServer } from './app.mjs';
import { createGenerator } from './provider.mjs';

const key = process.env.OPENROUTER_API_KEY?.trim();
const server = createDevServer({
  configured: Boolean(key),
  generate: key ? createGenerator({ apiKey: key }) : async () => { throw new Error('Not configured'); },
});
// Intentionally fixed to loopback. No HOST override or production deployment mode.
server.listen(8787, '127.0.0.1', () => {
  console.log(`Fluxo: backend somente local em http://127.0.0.1:8787 (${key ? 'chave configurada' : 'sem chave'}).`);
});
