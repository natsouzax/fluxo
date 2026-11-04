import { AgendaEvent, Transaction } from '../data/types';
import { eventDate, eventsForDay } from '../domain/agenda';
import { monthlyBudgets, monthTransactions } from '../domain/finance';
import { formatCurrency } from '../utils/format';
import { assistantNavigation } from './assistantNavigation';
import { AssistantContext, AssistantReply, AssistantTurn } from './assistantTypes';

function normalize(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

const financeQuery = /gast|despes|saldo|orcamento|quanto tenho|dinheiro|quanto paguei/;
const agendaQuery = /agenda|rotina|compromisso|horario|meu dia/;
const help = 'Posso consultar seus dados e abrir as abas. Experimente “quanto gastei hoje?”, “qual meu saldo?”, “meus compromissos amanhã”, “minhas metas” ou “buscar notas sobre viagem”. Ainda não gravo alterações por conversa.';

function dayFor(query: string, now: Date): Date {
  const offset = /\bamanha\b/.test(query) ? 1 : /\bontem\b/.test(query) ? -1 : 0;
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
}

function agendaSummary(events: AgendaEvent[], query: string, now: Date): string {
  if (/semana|mes|\d{1,2}\/\d{1,2}/.test(query)) {
    return 'Por enquanto consulto os compromissos de hoje, amanhã ou ontem. Qual desses dias você quer ver?';
  }
  const day = dayFor(query, now);
  const label = /amanha/.test(query) ? 'amanhã' : /ontem/.test(query) ? 'ontem' : 'hoje';
  const eventsOnDay = eventsForDay(events, day);
  if (!eventsOnDay.length) return `Não há compromissos registrados para ${label} nos dados disponíveis.`;
  const items = eventsOnDay.slice(0, 4).map((event) => {
    const time = /^\d{4}-\d{2}-\d{2}$/.test(event.start) ? 'dia todo'
      : eventDate(event.start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return `• ${time} — ${event.title}`;
  });
  return `${eventsOnDay.length} compromisso(s) registrado(s) para ${label}:\n${items.join('\n')}${eventsOnDay.length > 4 ? '\nVeja os demais na aba Rotina.' : ''}`;
}

function expenseSummary(context: AssistantContext, query: string, now: Date): string {
  if (/semana|ano|desde|entre|\d{1,2}\/\d{1,2}/.test(query)) {
    return 'Consigo consultar gastos de hoje, ontem, deste mês ou do mês passado. Qual período você quer?';
  }
  let transactions: Transaction[];
  let period: string;
  if (/\b(hoje|ontem|amanha)\b/.test(query)) {
    const day = dayFor(query, now);
    transactions = context.transactions.filter((transaction) => {
      const date = new Date(transaction.date);
      return date.getFullYear() === day.getFullYear() && date.getMonth() === day.getMonth() && date.getDate() === day.getDate();
    });
    period = /ontem/.test(query) ? 'ontem' : /amanha/.test(query) ? 'para amanhã' : 'hoje';
  } else {
    const previous = /mes (passado|anterior)/.test(query);
    transactions = monthTransactions(context.transactions, previous ? new Date(now.getFullYear(), now.getMonth() - 1, 1) : now);
    period = previous ? 'no mês passado' : 'neste mês';
  }
  const categories = [...new Set(context.transactions.map((transaction) => transaction.category))];
  const selected = categories.filter((category) => query.includes(normalize(category)));
  if (selected.length > 1) return 'Você citou mais de uma categoria. Qual delas quer consultar primeiro?';
  const requestedCategory = selected[0];
  if (!requestedCategory && /\b(com|categoria)\s+/.test(query)) {
    return `Não reconheci a categoria. Nos registros disponíveis tenho: ${categories.join(', ') || 'nenhuma categoria'}. Qual você quer consultar?`;
  }
  const expenses = transactions.filter((transaction) => transaction.direction === 'out' &&
    (!requestedCategory || transaction.category === requestedCategory));
  const cents = expenses.reduce((sum, transaction) => sum + Math.round(transaction.amount * 100), 0);
  const totals = new Map<string, number>();
  expenses.forEach((transaction) => totals.set(transaction.category,
    (totals.get(transaction.category) ?? 0) + Math.round(transaction.amount * 100)));
  const largest = [...totals].sort((a, b) => b[1] - a[1])[0];
  return `As saídas registradas ${period}${requestedCategory ? ` em ${requestedCategory}` : ''} somam ${formatCurrency(cents / 100)} (${expenses.length} lançamento(s)).` +
    (largest && !requestedCategory ? ` A maior categoria foi ${largest[0]}, com ${formatCurrency(largest[1] / 100)}.` : '');
}

/** Deterministic, read-only assistant. No network, credentials, model or hidden writes. */
export function localAssistant(input: string, context: AssistantContext, history: AssistantTurn[] = [], now = new Date()): AssistantReply {
  let query = normalize(input);
  if (!query) return { content: 'Como posso ajudar com suas finanças, notas ou rotina?' };
  if (/\b(nao quero|nao abra|nao mostre|nao abrir)\b/.test(query)) return { content: 'Tudo bem. O que você quer consultar ou abrir?' };
  if (/^(?:fluxo[, ]+)?(?:(?:quero|preciso|gostaria de|pode|poderia|vamos)(?: que voce)?\s+)?(?:registre|registrar|anote|anotar|adicione|adicionar|crie|criar|marque|agende|salve|salvar|lance|exclua|apague|altere)\b/.test(query)) {
    return { content: 'Ainda não gravo alterações por conversa. Para escrever uma nota, abra Notas e toque em adicionar. Posso abrir Finanças ou Rotina para consulta; nenhum registro foi alterado.' };
  }
  if (/^(e )?(hoje|ontem|amanha|neste mes|no mes passado)\??$/.test(query)) {
    const previous = [...history].reverse().find((turn) => turn.role === 'user' &&
      (financeQuery.test(normalize(turn.content)) || agendaQuery.test(normalize(turn.content))));
    if (!previous) return { content: 'Você quer consultar gastos ou compromissos nesse período?' };
    const original = normalize(previous.content).replace(/mes passado|mes anterior|neste mes|este mes|hoje|ontem|amanha/g, '');
    query = `${original} ${query}`;
  }
  if (/^(oi|ola|bom dia|boa tarde|boa noite|e ai)[!.? ]*$/.test(query)) {
    return { content: `Olá${context.userName ? `, ${context.userName.split(' ')[0]}` : ''}! Sou o Fluxo. Posso consultar seus registros e te levar à aba que precisar. Como posso ajudar hoje?` };
  }
  if (/resumo|como esta meu dia|como esta minha vida/.test(query)) {
    return { content: `${expenseSummary(context, 'gastos neste mes', now)}\n\n${agendaSummary(context.events, 'hoje', now)}\n\nVocê tem ${context.notes.length} nota(s). O que quer explorar primeiro?` };
  }
  // Search is a data query; it should not be swallowed by a generic “show notes” route.
  const noteSearch = /(?:sobre|contendo|com a tag|tag)\s+(.+?)[?.!]*$/.exec(query);
  if (/\b(nota|notas|anotacao|anotacoes)\b/.test(query) && noteSearch) {
    const term = noteSearch[1].replace(/["“”]/g, '').replace(/[?.!]+$/, '').trim();
    const matches = context.notes.filter((note) => normalize(`${note.title} ${note.body} ${note.tags.join(' ')}`).includes(term));
    return { content: matches.length
      ? `Encontrei ${matches.length} nota(s) sobre “${term}”:\n${matches.slice(0, 3).map((note) => `• ${note.title}: ${note.body.slice(0, 120)}`).join('\n')}`
      : `Não encontrei notas sobre “${term}” nos registros disponíveis.` };
  }
  const route = assistantNavigation(input);
  if (route) return { content: route.reply, destination: route.destination };
  if (financeQuery.test(query) && agendaQuery.test(query)) return { content: 'Você quer consultar finanças ou compromissos primeiro? Também posso mostrar um resumo do dia. Ainda não calculo relações entre horários e gastos.' };
  if (/quanto posso gastar|posso (comprar|gastar)|posso viajar/.test(query)) return { content: 'Ainda não faço projeções de quanto você pode gastar. Posso consultar o saldo atual, as saídas registradas ou os limites de orçamento. Qual desses dados você quer ver?' };
  if (/saldo|quanto tenho|quanto dinheiro/.test(query)) {
    if (/ontem|amanha|passado|anterior|semana|ano/.test(query)) return { content: 'Tenho os saldos atuais das contas. Ainda não reconstruo saldos históricos nem projeto saldos futuros.' };
    const totals = new Map<string, number>();
    context.accounts.forEach((account) => totals.set(account.currency, (totals.get(account.currency) ?? 0) + Math.round(account.balance * 100)));
    if (!totals.size) return { content: 'Você ainda não tem contas cadastradas. Quando houver dados financeiros no seu perfil, posso consultar o saldo por aqui.' };
    return { content: `Saldo somado das contas: ${[...totals].map(([currency, cents]) => formatCurrency(cents / 100, currency)).join('; ')}.` };
  }
  if (/orcamento|limite|cortar|economizar/.test(query)) {
    const budgets = monthlyBudgets(context.budgets, context.transactions, now).filter((budget) => budget.limit > 0)
      .sort((a, b) => b.spent / b.limit - a.spent / a.limit);
    if (!budgets.length) return { content: 'Não há orçamentos com limite positivo registrados. Posso mostrar os gastos deste mês.' };
    const budget = budgets[0];
    const difference = budget.limit - budget.spent;
    return { content: `${budget.category} tem o maior uso proporcional do orçamento: ${Math.round(budget.spent / budget.limit * 100)}% (${formatCurrency(budget.spent)} de ${formatCurrency(budget.limit)}). ${difference >= 0 ? `Restam ${formatCurrency(difference)} nesse limite.` : `O limite foi excedido em ${formatCurrency(-difference)}.`}` };
  }
  if (/gast|despes|saidas|quanto paguei/.test(query)) return { content: expenseSummary(context, query, now) };
  if (/meta|reserva|objetivo/.test(query)) {
    const goals = /reserva/.test(query) ? context.goals.filter((goal) => /reserva/.test(normalize(goal.title))) : context.goals;
    return { content: goals.length ? `Metas registradas:\n${goals.slice(0, 3).map((goal) =>
      `• ${goal.title}: ${formatCurrency(goal.saved)} de ${formatCurrency(goal.target)}; faltam ${formatCurrency(Math.max(0, goal.target - goal.saved))}.`).join('\n')}`
      : 'Não encontrei metas correspondentes nos registros disponíveis.' };
  }
  if (agendaQuery.test(query) || /o que tenho (hoje|amanha|ontem)/.test(query)) return { content: agendaSummary(context.events, query, now) };
  if (/\b(nota|notas|anotacao|anotacoes)\b/.test(query)) return { content: context.notes.length
    ? `Você tem ${context.notes.length} nota(s). Algumas delas:\n${context.notes.slice(0, 3).map((note) => `• ${note.title}`).join('\n')}\nPosso buscar por assunto: “notas sobre viagem”.`
    : 'Você ainda não tem notas registradas. Pode criar uma na aba Notas.' };
  return { content: help, handled: false };
}
