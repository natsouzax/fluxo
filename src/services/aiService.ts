import { Account, Budget, Goal, Note, Transaction } from '../data/types';
import { formatCurrency } from '../utils/format';

const CLAUDE_ENDPOINT = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL = 'claude-sonnet-5';

export interface FinanceSnapshot {
  accounts: Account[];
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
  notes: Note[];
}

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

export async function askFluxoAI(params: {
  apiKey: string;
  history: { role: 'user' | 'assistant'; content: string }[];
  snapshot: FinanceSnapshot;
}): Promise<string> {
  const { apiKey, history, snapshot } = params;

  const response = await fetch(CLAUDE_ENDPOINT, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 700,
      system: buildSystemPrompt(snapshot),
      messages: history.map((m) => ({ role: m.role, content: m.content })),
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Claude API error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  const textBlock = data?.content?.find((block: { type: string }) => block.type === 'text');
  return textBlock?.text ?? 'Não consegui gerar uma resposta agora, tente novamente.';
}

// Used when no API key is configured yet, so the chat screen still feels alive.
export function offlineFallbackReply(userMessage: string, snapshot: FinanceSnapshot): string {
  const totalBalance = snapshot.accounts.reduce((sum, a) => sum + a.balance, 0);
  const topBudget = [...snapshot.budgets].sort((a, b) => b.spent / b.limit - a.spent / a.limit)[0];

  if (/saldo|quanto tenho/i.test(userMessage)) {
    return `Seu saldo somado entre as contas é ${formatCurrency(totalBalance)}. Configure sua chave da API da Anthropic em Ajustes para respostas mais completas.`;
  }
  if (/gast|orçamento|budget/i.test(userMessage) && topBudget) {
    const pct = Math.round((topBudget.spent / topBudget.limit) * 100);
    return `Sua categoria mais próxima do limite é "${topBudget.category}", já em ${pct}% do orçamento (${formatCurrency(topBudget.spent)} de ${formatCurrency(topBudget.limit)}).`;
  }
  return 'Estou em modo offline (sem chave de IA configurada). Vá em Ajustes → IA para conectar sua chave da Anthropic e eu passo a analisar seus dados de verdade.';
}
