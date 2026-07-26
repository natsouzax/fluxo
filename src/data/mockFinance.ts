import { colors } from '../theme/colors';
import { Account, Budget, Goal, Transaction } from './types';

// Seed data so the app is fully usable before any real bank is connected.
// Everything here is flagged isMock: true and gets replaced once a provider
// (see src/services/openFinance.ts) returns real accounts.

export const mockAccounts: Account[] = [
  {
    id: 'acc-nubank-cc',
    institution: 'Nubank',
    kind: 'checking',
    nickname: 'Conta Nubank',
    balance: 4238.56,
    currency: 'BRL',
    color: '#8A05BE',
    lastSyncedAt: null,
    isMock: true,
  },
  {
    id: 'acc-inter-poup',
    institution: 'Banco Inter',
    kind: 'savings',
    nickname: 'Poupança Inter',
    balance: 12890.11,
    currency: 'BRL',
    color: '#FF7A00',
    lastSyncedAt: null,
    isMock: true,
  },
  {
    id: 'acc-nubank-cartao',
    institution: 'Nubank',
    kind: 'credit_card',
    nickname: 'Cartão Nubank',
    balance: -1876.4,
    currency: 'BRL',
    color: '#8A05BE',
    lastSyncedAt: null,
    isMock: true,
  },
  {
    id: 'acc-xp-invest',
    institution: 'XP Investimentos',
    kind: 'investment',
    nickname: 'Carteira XP',
    balance: 27650.0,
    currency: 'BRL',
    color: '#1C1C3B',
    lastSyncedAt: null,
    isMock: true,
  },
];

const categories = [
  'Alimentação',
  'Transporte',
  'Moradia',
  'Lazer',
  'Saúde',
  'Assinaturas',
  'Compras',
  'Salário',
];

function categoryColor(category: string): string {
  const idx = categories.indexOf(category) % colors.categoryPalette.length;
  return colors.categoryPalette[Math.max(idx, 0)];
}

export const mockTransactions: Transaction[] = [
  { id: 't1', accountId: 'acc-nubank-cc', description: 'iFood', merchant: 'iFood', category: 'Alimentação', amount: 58.9, direction: 'out', date: daysAgo(0) },
  { id: 't2', accountId: 'acc-nubank-cartao', description: 'Uber', merchant: 'Uber', category: 'Transporte', amount: 23.4, direction: 'out', date: daysAgo(0) },
  { id: 't3', accountId: 'acc-nubank-cc', description: 'Salário', merchant: 'Empresa XYZ', category: 'Salário', amount: 6800, direction: 'in', date: daysAgo(1) },
  { id: 't4', accountId: 'acc-nubank-cartao', description: 'Netflix', merchant: 'Netflix', category: 'Assinaturas', amount: 44.9, direction: 'out', date: daysAgo(1) },
  { id: 't5', accountId: 'acc-nubank-cc', description: 'Aluguel', merchant: 'Imobiliária Lar', category: 'Moradia', amount: 1800, direction: 'out', date: daysAgo(2) },
  { id: 't6', accountId: 'acc-nubank-cartao', description: 'Farmácia', merchant: 'Droga Raia', category: 'Saúde', amount: 76.2, direction: 'out', date: daysAgo(3) },
  { id: 't7', accountId: 'acc-nubank-cc', description: 'Cinema', merchant: 'Cinemark', category: 'Lazer', amount: 68, direction: 'out', date: daysAgo(4) },
  { id: 't8', accountId: 'acc-nubank-cartao', description: 'Mercado', merchant: 'Pão de Açúcar', category: 'Alimentação', amount: 312.75, direction: 'out', date: daysAgo(5) },
  { id: 't9', accountId: 'acc-inter-poup', description: 'Rendimento CDB', merchant: 'Banco Inter', category: 'Salário', amount: 84.32, direction: 'in', date: daysAgo(6) },
  { id: 't10', accountId: 'acc-nubank-cartao', description: 'Amazon', merchant: 'Amazon', category: 'Compras', amount: 189.9, direction: 'out', date: daysAgo(7) },
];

export const mockBudgets: Budget[] = [
  { id: 'b1', category: 'Alimentação', limit: 900, spent: 611.65, color: categoryColor('Alimentação') },
  { id: 'b2', category: 'Transporte', limit: 300, spent: 145.0, color: categoryColor('Transporte') },
  { id: 'b3', category: 'Lazer', limit: 400, spent: 268.0, color: categoryColor('Lazer') },
  { id: 'b4', category: 'Assinaturas', limit: 150, spent: 44.9, color: categoryColor('Assinaturas') },
];

export const mockGoals: Goal[] = [
  { id: 'g1', title: 'Reserva de emergência', target: 20000, saved: 12890.11, deadline: '2026-12-31' },
  { id: 'g2', title: 'Viagem para o Chile', target: 8000, saved: 2100, deadline: '2027-01-15' },
];

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

export function totalBalance(accounts: Account[]): number {
  return accounts.reduce((sum, a) => sum + a.balance, 0);
}

export function spendingByCategory(transactions: Transaction[]) {
  const map = new Map<string, number>();
  transactions
    .filter((t) => t.direction === 'out')
    .forEach((t) => map.set(t.category, (map.get(t.category) ?? 0) + t.amount));
  return Array.from(map.entries())
    .map(([category, amount]) => ({ category, amount, color: categoryColor(category) }))
    .sort((a, b) => b.amount - a.amount);
}
