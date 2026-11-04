import { colors } from '../theme/colors';
import { Account, Transaction } from './types';

export function totalBalance(accounts: Account[]): number {
  return accounts.reduce((sum, account) => sum + Math.round(account.balance * 100), 0) / 100;
}

export function spendingByCategory(transactions: Transaction[]) {
  const map = new Map<string, number>();
  transactions
    .filter((transaction) => transaction.direction === 'out')
    .forEach((transaction) => map.set(transaction.category, (map.get(transaction.category) ?? 0) + Math.round(transaction.amount * 100)));
  return Array.from(map.entries())
    .map(([category, cents], index) => ({ category, amount: cents / 100, color: colors.categoryPalette[index % colors.categoryPalette.length] }))
    .sort((a, b) => b.amount - a.amount);
}
