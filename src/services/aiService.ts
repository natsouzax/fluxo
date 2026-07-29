import { Account, Budget, Goal, Note, Transaction } from '../data/types';
import { formatCurrency } from '../utils/format';

const CLAUDE_ENDPOINT = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL = 'claude-sonnet-5';
const REQUEST_TIMEOUT_MS = 45_000;

export interface FinanceSnapshot {
  accounts: Account[];
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
  notes: Note[];
}

export type ChatTurn = { role: 'user' | 'assistant'; content: string };

function buildSystemPrompt(snapshot: FinanceSnapshot): string {
  const totalBalance = snapshot.accounts.reduce((sum, a) => sum + a.balance, 0);
  const accountLines = snapshot.accounts
    .map((a) => `- ${a.nickname} (${a.institution}): ${formatCurrency(a.balance, a.currency)}`)
    .join('\n');
  const recentTx = snapshot.transactions
    .slice(0, 15)
    .map((t) => `- ${t.date.slice(0, 10)} | ${t.description} | ${t.category} | ${t.direction === 'out' ? '-' : '+'}${formatCurrency(t.amount)}`)
    .join('\n');
  const budgetLines = snapshot.budgets
    .map((b) => `- ${b.category}: ${formatCurrency(b.spent)} de ${formatCurrency(b.limit)}`)
    .join('\n');
  const goalLines = snapshot.goals
    .map((g) => `- ${g.title}: ${formatCurrency(g.saved)} de ${formatCurrency(g.target)}${g.deadline ? ` (meta: ${g.deadline.slice(0, 10)})` : ''}`)
    .join('\n');
  const noteLines = snapshot.notes
    .slice(0, 10)
    .map((n) => `- ${n.title}: ${n.body.slice(0, 140)}`)
    .join('\n');

  return `Você é a assistente financeira do app Fluxo, parecida com o Pierre e o Copilot de finanças da Revolut/Wise.
Responda em português do Brasil, de forma direta, prática e sem enrolação. Use os dados abaixo para
personalizar a resposta. Nunca invente saldos ou transações que não estão listados. Quando o usuário
pedir uma decisão, dê uma recomendação clara e explique o porquê em 1-2 frases.

Saldo total: ${formatCurrency(totalBalance)}

Contas:
${accountLines || '- nenhuma conta conectada'}

Transações recentes:
${recentTx || '- nenhuma transação registrada'}

Orçamentos do mês:
${budgetLines || '- nenhum orçamento definido'}

Metas:
${goalLines || '- nenhuma meta criada'}

Notas do usuário (rotina/decisões):
${noteLines || '- nenhuma nota criada'}`;
}

/**
 * The Messages API requires the first message to be `user`. Our chat starts with
 * a canned assistant greeting, and offline replies also land as assistant turns,
 * so the raw store history would be rejected with HTTP 400. Drop everything
 * before the first user turn and merge consecutive same-role turns.
 */
export function toApiHistory(history: ChatTurn[]): ChatTurn[] {
  const firstUser = history.findIndex((m) => m.role === 'user' && m.content.trim());
  if (firstUser === -1) return [];

  return history.slice(firstUser).reduce<ChatTurn[]>((acc, message) => {
    const content = message.content.trim();
    if (!content) return acc;

    const previous = acc[acc.length - 1];
    if (previous?.role === message.role) {
      previous.content = `${previous.content}\n\n${content}`;
      return acc;
    }
    acc.push({ role: message.role, content });
    return acc;
  }, []);
}

/** Anthropic error bodies can echo request content, so they never reach the UI. */
function friendlyApiError(status: number): string {
  if (status === 401 || status === 403) {
    return 'Sua chave da IA foi recusada. Confira em Ajustes → IA se ela ainda é válida.';
  }
  if (status === 429) {
    return 'Você atingiu o limite de uso da API por agora. Tente de novo em alguns minutos.';
  }
  if (status >= 500) {
    return 'A IA está indisponível no momento. Tente de novo em instantes.';
  }
  return 'Não consegui falar com a IA agora. Tente reformular a pergunta.';
}

export async function askFluxoAI(params: {
  apiKey: string;
  history: ChatTurn[];
  snapshot: FinanceSnapshot;
}): Promise<string> {
  const { apiKey, history, snapshot } = params;

  const messages = toApiHistory(history);
  if (messages.length === 0) {
    return 'Manda sua pergunta que eu analiso seus dados.';
  }

  // Without this the request can hang indefinitely on a flaky mobile connection
  // and the chat stays stuck in the "enviando" state.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(CLAUDE_ENDPOINT, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 700,
        system: buildSystemPrompt(snapshot),
        messages,
      }),
    });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('A IA demorou demais para responder. Tente de novo.');
    }
    throw new Error('Sem conexão com a IA. Verifique sua internet e tente de novo.');
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    // Log the raw body for debugging, but surface only a safe message.
    console.warn(`Claude API error ${response.status}:`, await response.text().catch(() => ''));
    throw new Error(friendlyApiError(response.status));
  }

  const data = await response.json();
  if (data?.stop_reason === 'refusal') {
    return 'Não consigo responder isso. Que tal perguntar algo sobre seus gastos, orçamentos ou metas?';
  }

  const textBlock = data?.content?.find((block: { type: string }) => block.type === 'text');
  return textBlock?.text?.trim() || 'Não consegui gerar uma resposta agora, tente novamente.';
}

// Used when no API key is configured yet, so the chat screen still feels alive.
export function offlineFallbackReply(userMessage: string, snapshot: FinanceSnapshot): string {
  const totalBalance = snapshot.accounts.reduce((sum, a) => sum + a.balance, 0);
  const topBudget = [...snapshot.budgets]
    .filter((b) => b.limit > 0)
    .sort((a, b) => b.spent / b.limit - a.spent / a.limit)[0];

  if (/saldo|quanto tenho/i.test(userMessage)) {
    return `Seu saldo somado entre as contas é ${formatCurrency(totalBalance)}. Configure sua chave da API da Anthropic em Ajustes para respostas mais completas.`;
  }
  if (/gast|orçamento|budget/i.test(userMessage) && topBudget) {
    const pct = Math.round((topBudget.spent / topBudget.limit) * 100);
    return `Sua categoria mais próxima do limite é "${topBudget.category}", já em ${pct}% do orçamento (${formatCurrency(topBudget.spent)} de ${formatCurrency(topBudget.limit)}).`;
  }
  return 'Estou em modo offline (sem chave de IA configurada). Vá em Ajustes → IA para conectar sua chave da Anthropic e eu passo a analisar seus dados de verdade.';
}
