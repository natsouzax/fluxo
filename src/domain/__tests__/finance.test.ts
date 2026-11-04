import { Account, Budget, Transaction } from '../../data/types';
import { appendTransaction, monthlyBudgets, monthlyExpense, monthTransactions, nextMonthlyDueDate, validateBill } from '../finance';

const now = new Date(2026, 9, 20, 12);
const accounts: Account[] = [
  { id: 'account', institution: 'Banco', kind: 'checking', nickname: 'Conta', balance: 100, currency: 'BRL', color: '#000', lastSyncedAt: null },
  { id: 'credit', institution: 'Banco', kind: 'credit_card', nickname: 'Cartão', balance: -10, currency: 'BRL', color: '#000', lastSyncedAt: null },
];
const budgets: Budget[] = [{ id: 'b', category: 'Alimentação', limit: 100, spent: 99999, color: '#000' }];
const tx = (id: string, amount: number, overrides: Partial<Transaction> = {}): Transaction => ({
  id, accountId: accounts[0].id, description: 'Almoço', merchant: 'Restaurante', category: 'Alimentação',
  amount, direction: 'out', date: new Date(2026, 9, 10, 12).toISOString(), ...overrides,
});

it('reconciles month totals and budgets from transactions, including unbudgeted categories', () => {
  const transactions = [tx('1', 35), tx('2', 50, { category: 'Saúde' }), tx('3', 200, { direction: 'in' }),
    tx('4', 800, { date: new Date(2026, 8, 30, 23, 59).toISOString() })];
  expect(monthTransactions(transactions, now)).toHaveLength(3);
  expect(monthlyExpense(transactions, now)).toBe(85);
  expect(monthlyBudgets(budgets, transactions, now)[0].spent).toBe(35);
  expect(monthlyExpense(transactions, new Date(2026, 10, 1))).toBe(0);
  expect(monthlyBudgets(budgets, transactions, new Date(2026, 10, 1))[0].spent).toBe(0);
});

it('updates the account once and keeps duplicate imports idempotent', () => {
  const original = [{ ...accounts[0], balance: 100 }];
  const first = appendTransaction(original, [], tx('lunch', 35));
  const second = appendTransaction(first.accounts, first.transactions, tx('lunch', 35));
  expect(first.accounts[0].balance).toBe(65);
  expect(second.accounts[0].balance).toBe(65);
  expect(second.transactions).toHaveLength(1);
  expect(original[0].balance).toBe(100);
});

it('applies income and credit-card charges with the correct sign and cent precision', () => {
  const account = { ...accounts[1], balance: -10 };
  const outgoing = appendTransaction([account], [], tx('a', 0.1, { accountId: account.id }));
  const incoming = appendTransaction(outgoing.accounts, outgoing.transactions,
    tx('b', 0.3, { accountId: account.id, direction: 'in' }));
  expect(incoming.accounts[0].balance).toBe(-9.8);
});

it('moves money between accounts without counting a card payment as new income or expense', () => {
  const source = { ...accounts[0], balance: 200 };
  const card = { ...accounts[1], balance: -60 };
  const transfer = tx('card-payment', 20, { accountId: source.id, destinationAccountId: card.id,
    direction: 'transfer', category: 'Transfer' });
  const result = appendTransaction([source, card], [], transfer);
  expect(result.accounts.map((account) => account.balance)).toEqual([180, -40]);
  expect(monthlyExpense(result.transactions, now)).toBe(0);
});

it('matches budget categories without case sensitivity', () => {
  expect(monthlyBudgets([{ ...budgets[0], category: 'ALIMENTAÇÃO' }], [tx('food', 35)], now)[0].spent).toBe(35);
});

it('moves monthly due dates to the same day or the last valid day of the next month', () => {
  expect(nextMonthlyDueDate('2026-01-31')).toBe('2026-02-28');
  expect(nextMonthlyDueDate('2026-02-28')).toBe('2026-03-28');
});

it('rejects impossible calendar dates for bills', () => {
  const bill = { id: 'bill', title: 'Conta', category: 'Casa', amount: 50, dueDate: '2026-02-31',
    accountId: accounts[0].id, recurrence: 'none' as const, paid: false };
  expect(validateBill(bill, new Set([accounts[0].id]))).toBe(false);
});

it.each([0, -10, NaN, Infinity, 0.001])('rejects invalid amounts (%s) without changing the balance', (amount) => {
  expect(() => appendTransaction(accounts, [], tx('bad', amount))).toThrow('Transação inválida');
});

it('rejects unknown accounts and invalid dates', () => {
  expect(() => appendTransaction(accounts, [], tx('bad', 10, { accountId: 'missing' }))).toThrow();
  expect(() => appendTransaction(accounts, [], tx('bad', 10, { date: 'not-a-date' }))).toThrow();
});
