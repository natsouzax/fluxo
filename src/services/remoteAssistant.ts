import { eventsForDay } from '../domain/agenda';
import { monthlyBudgets, monthlyExpense } from '../domain/finance';
import { AssistantContext, AssistantReply, AssistantTurn } from './assistantTypes';
import { localAssistant } from './localAssistant';

declare const process: { env: { EXPO_PUBLIC_FLUXO_API_URL?: string } };

export function devBackendURL(raw = process.env.EXPO_PUBLIC_FLUXO_API_URL, development = __DEV__): string | null {
  if (!development || !raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== 'http:' || !['127.0.0.1', 'localhost', '10.0.2.2'].includes(url.hostname) ||
        url.port !== '8787' || url.username || url.password || url.search || url.hash || !['', '/'].includes(url.pathname)) return null;
    return url.origin;
  } catch { return null; }
}

export function remotePayload(message: string, context: AssistantContext, history: AssistantTurn[], now = new Date()) {
  const balances: Record<string, number> = {};
  context.accounts.forEach((account) => {
    const currency = account.currency.slice(0, 8);
    balances[currency] = (balances[currency] ?? 0) + Math.round(account.balance * 100);
  });
  return {
    message: message.slice(0, 4000),
    // Local replies can quote private notes; never forward those excerpts automatically.
    history: history.filter((turn) => turn.role === 'user').slice(-6)
      .map(({ role, content }) => ({ role, content: content.slice(0, 1000) })),
    context: {
      date: now.toISOString(),
      balances: Object.fromEntries(Object.entries(balances).map(([currency, cents]) => [currency, cents / 100])),
      expensesThisMonth: monthlyExpense(context.transactions, now),
      budgets: monthlyBudgets(context.budgets, context.transactions, now).slice(0, 8)
        .map(({ category, limit, spent }) => ({ category: category.slice(0, 80), limit, spent })),
      goals: context.goals.slice(0, 4).map(({ title, target, saved }) => ({ title: title.slice(0, 80), target, saved })),
      noteTitles: context.notes.slice(0, 4).map((note) => note.title.slice(0, 80)),
      eventsToday: eventsForDay(context.events, now).slice(0, 4).map(({ title, start, end }) => ({ title: title.slice(0, 80), start, end })),
    },
  };
}

export async function resolveAssistant(params: {
  message: string; context: AssistantContext; history: AssistantTurn[];
  enabled: boolean; backendURL?: string | null; signal?: AbortSignal;
}): Promise<AssistantReply> {
  const local = localAssistant(params.message, params.context, params.history);
  const url = devBackendURL(params.backendURL ?? undefined);
  if (!params.enabled || !url || local.handled !== false) return { ...local, source: 'local' };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25_000);
  const abort = () => controller.abort();
  params.signal?.addEventListener('abort', abort);
  if (params.signal?.aborted) controller.abort();
  try {
    const response = await fetch(`${url}/assistant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify(remotePayload(params.message, params.context, params.history)),
    });
    if (!response.ok) throw new Error('Assistant unavailable');
    const data = await response.json();
    if (data?.source !== 'openrouter' || typeof data.content !== 'string' || !data.content.trim() || data.content.length > 6000) throw new Error('Invalid response');
    return { content: `IA experimental (OpenRouter)\n\n${data.content.trim()}`, source: 'openrouter' };
  } catch {
    return { ...local, source: 'local', content: `A IA gratuita está indisponível. Continuo no modo local.\n\n${local.content}` };
  } finally {
    clearTimeout(timer);
    params.signal?.removeEventListener('abort', abort);
  }
}
