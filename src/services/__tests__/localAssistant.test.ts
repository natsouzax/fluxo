import { localAssistant } from '../localAssistant';
import { AssistantContext } from '../assistantTypes';
import { Transaction } from '../../data/types';

const now = new Date(2026, 9, 20, 12);
const at = (day: number, month = 9, hour = 12) => new Date(2026, month, day, hour).toISOString();
const transaction = (id: string, amount: number, date: string, category = 'Alimentação', direction: 'in' | 'out' = 'out'): Transaction => ({
  id, amount, date, category, direction, accountId: 'a', description: id, merchant: id,
});
const context: AssistantContext = {
  userName: 'Natan Souza',
  accounts: [{ id: 'a', nickname: 'Conta', institution: 'Banco', kind: 'checking', balance: 1000,
    currency: 'BRL', color: '#000', lastSyncedAt: null, isMock: true }],
  transactions: [transaction('today', 35, at(20)), transaction('yesterday', 20, at(19)),
    transaction('health', 10, at(20), 'Saúde'), transaction('income', 500, at(20), 'Salário', 'in'),
    transaction('last-month', 80, at(15, 8))],
  budgets: [{ id: 'b', category: 'Alimentação', spent: 999, limit: 100, color: '#000' }],
  goals: [{ id: 'g', title: 'Reserva de emergência', saved: 250, target: 1000, deadline: null }],
  notes: [{ id: 'n', title: 'Planejar viagem', body: 'Passagem para o Chile', tags: ['férias'], createdAt: '', updatedAt: '' }],
  events: [{ id: 'today', title: 'Dentista', start: at(20, 9, 9), end: at(20, 9, 10), source: 'local' },
    { id: 'tomorrow', title: 'Treino', start: at(21, 9, 9), end: at(21, 9, 10), source: 'local' }],
};
const reply = (message: string, data = context) => localAssistant(message, data, [], now).content.replace(/\s/g, ' ');

it('greets personally without a key or invitation to configure a provider', () => {
  expect(reply('Olá!')).toContain('Natan');
  expect(reply('Olá!')).not.toMatch(/API|Anthropic|chave/);
});

it.each([
  ['Quanto gastei hoje?', '45,00'], ['E meus gastos ontem?', '20,00'],
  ['Quanto gastei neste mês?', '65,00'], ['Quanto gastei mês passado?', '80,00'],
  ['Quanto gastei hoje com alimentação?', '35,00'],
])('calculates the requested period/category: %s', (message, expected) => {
  expect(reply(message)).toContain(expected);
});

it('does not silently turn unsupported periods into monthly totals', () => {
  expect(reply('Quanto gastei esta semana?')).toContain('Qual período');
});

it('does not silently count all expenses when a requested category is unknown', () => {
  expect(reply('Quanto gastei com brinquedos?')).toContain('Não reconheci a categoria');
});

it('does not fabricate historical balances or spending forecasts', () => {
  expect(reply('Qual era meu saldo ontem?')).toContain('saldos históricos');
  expect(reply('Quanto posso gastar até o fim do mês?')).toContain('Ainda não faço projeções');
});

it('uses the prior user question for a short follow-up, without carrying its old period', () => {
  const response = localAssistant('e ontem?', context, [{ role: 'user', content: 'quanto gastei hoje?' },
    { role: 'assistant', content: 'An irrelevant 99999' }], now);
  expect(response.content).toContain('20,00');
  expect(response.content).not.toContain('45,00');
  expect(response.content).not.toContain('99999');
});

it('asks for a topic when a follow-up has no context', () => {
  expect(reply('e amanhã?')).toContain('gastos ou compromissos');
});

it('reports available balances and keeps currencies separate', () => {
  expect(reply('Qual meu saldo?')).toContain('1.000,00');
  expect(reply('Qual meu saldo?')).not.toContain('de exemplo');
  const multi = reply('Qual meu saldo?', { ...context, accounts: [...context.accounts, { ...context.accounts[0], id: 'usd', currency: 'USD', balance: 10 }] });
  expect(multi).toContain('1.000,00');
  expect(multi).toContain('10,00');
  expect(multi).not.toContain('1.010,00');
});

it('derives budget usage from transactions rather than a stale spent value', () => {
  expect(reply('Como está meu orçamento?')).toContain('55%');
  expect(reply('Como está meu orçamento?')).toContain('45,00');
  expect(reply('meu limite', { ...context, budgets: [{ ...context.budgets[0], limit: 0 }] })).not.toMatch(/NaN|Infinity/);
});

it('shows today and tomorrow appointments without inventing availability', () => {
  expect(reply('Quais meus compromissos hoje?')).toContain('Dentista');
  expect(reply('Quais meus compromissos hoje?')).not.toContain('Treino');
  expect(reply('Minha agenda amanhã')).toContain('Treino');
  expect(reply('Minha rotina ontem')).toContain('Não há compromissos registrados');
});

it('maintains the agenda topic for a follow-up day', () => {
  const result = localAssistant('e amanhã?', context, [{ role: 'user', content: 'minha agenda hoje' }], now);
  expect(result.content).toContain('Treino');
  expect(result.content).not.toContain('Dentista');
});

it('searches note titles, bodies and tags without generating nonexistent notes', () => {
  expect(reply('Buscar notas sobre Chile')).toContain('Planejar viagem');
  expect(reply('Notas com a tag férias')).toContain('Planejar viagem');
  expect(reply('Notas sobre carro')).toContain('Não encontrei');
});

it('treats action words inside a note search as search data, not a command', () => {
  const data = { ...context, notes: [{ ...context.notes[0], title: 'Como criar uma rotina' }] };
  expect(reply('Buscar notas sobre criar', data)).toContain('Como criar uma rotina');
  expect(reply('Quero que você registre uma despesa')).toContain('nenhum registro foi alterado');
});

it('calculates the remaining goal amount', () => {
  expect(reply('Como está minha reserva?')).toContain('750,00');
});

it('offers the available features instead of asking for a key', () => {
  expect(reply('Você escreve poesia?')).toContain('Posso consultar');
  expect(reply('Você escreve poesia?')).not.toMatch(/Anthropic|chave|API/);
});

it.each(['Registre 35 de almoço', 'Crie uma nota', 'Agende meu dentista', 'Apague meus gastos'])('never writes or claims a write: %s', (input) => {
  const before = JSON.stringify(context);
  expect(reply(input)).toContain('nenhum registro foi alterado');
  expect(JSON.stringify(context)).toBe(before);
});

it('routes explicit navigation and keeps negated or mixed requests in the conversation', () => {
  expect(localAssistant('Abrir rotina', context).destination).toBe('Agenda');
  expect(localAssistant('Não abra rotina', context).destination).toBeUndefined();
  expect(localAssistant('Abrir finanças e agenda', context).destination).toBeUndefined();
});

it('gives a current summary grounded in the available records', () => {
  const result = reply('Faça um resumo do meu dia');
  expect(result).toContain('65,00');
  expect(result).toContain('Dentista');
  expect(result).toContain('1 nota');
});
