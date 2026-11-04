import { Account, Transaction } from '../types';
import { spendingByCategory, totalBalance } from '../financeMetrics';

function account(id: string, balance: number): Account {
  return {
    id,
    institution: 'Banco',
    kind: 'checking',
    nickname: id,
    balance,
    currency: 'BRL',
    color: '#000',
    lastSyncedAt: null,
  };
}

function transaction(id: string, category: string, amount: number, direction: 'in' | 'out'): Transaction {
  return {
    id,
    accountId: 'acc',
    description: id,
    merchant: id,
    category,
    amount,
    direction,
    date: new Date().toISOString(),
  };
}

describe('totalBalance', () => {
  it('sums balances including negative credit card ones', () => {
    expect(totalBalance([account('a', 100), account('b', -30)])).toBe(70);
  });

  it('returns 0 with no accounts', () => {
    expect(totalBalance([])).toBe(0);
  });
});

describe('spendingByCategory', () => {
  it('only counts outgoing transactions', () => {
    const result = spendingByCategory([
      transaction('t1', 'Alimentação', 50, 'out'),
      transaction('t2', 'Salário', 5000, 'in'),
    ]);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ category: 'Alimentação', amount: 50 });
  });

  it('groups by category and sorts by amount descending', () => {
    const result = spendingByCategory([
      transaction('t1', 'Transporte', 20, 'out'),
      transaction('t2', 'Alimentação', 50, 'out'),
      transaction('t3', 'Alimentação', 30, 'out'),
    ]);

    expect(result.map((s) => [s.category, s.amount])).toEqual([
      ['Alimentação', 80],
      ['Transporte', 20],
    ]);
  });

  it('assigns a colour to every slice so the pie chart can render', () => {
    const result = spendingByCategory([transaction('t1', 'Categoria Desconhecida', 10, 'out')]);
    expect(result[0].color).toEqual(expect.any(String));
    expect(result[0].color).not.toBe('');
  });

  it('returns an empty list with no transactions', () => {
    expect(spendingByCategory([])).toEqual([]);
  });
});

