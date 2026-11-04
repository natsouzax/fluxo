import { Account, Bill, Budget, Transaction } from '../data/types';

export function nextMonthlyDueDate(dateOnly: string): string {
  const [year, month, day] = dateOnly.split('-').map(Number);
  const nextMonth = new Date(year, month - 1, 1, 12);
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  const lastDay = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0, 12).getDate();
  nextMonth.setDate(Math.min(day, lastDay));
  return `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}-${String(nextMonth.getDate()).padStart(2, '0')}`;
}

export function validateBill(bill: Bill, accountIds: Set<string>): boolean {
  const cents = Math.round(bill.amount * 100);
  const parsedDate = new Date(`${bill.dueDate}T12:00:00`);
  const [year, month, day] = bill.dueDate.split('-').map(Number);
  return Boolean(bill.id.trim() && bill.title.trim() && bill.category.trim() && accountIds.has(bill.accountId) &&
    Number.isSafeInteger(cents) && cents > 0 && Math.abs(bill.amount * 100 - cents) < 0.000001 &&
    /^\d{4}-\d{2}-\d{2}$/.test(bill.dueDate) && Number.isFinite(parsedDate.getTime()) &&
    parsedDate.getFullYear() === year && parsedDate.getMonth() === month - 1 && parsedDate.getDate() === day &&
    ['none', 'monthly'].includes(bill.recurrence));
}

export function monthTransactions(transactions: Transaction[], now = new Date()): Transaction[] {
  return transactions.filter((transaction) => {
    const date = new Date(transaction.date);
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  });
}

export function monthlyBudgets(budgets: Budget[], transactions: Transaction[], now = new Date()): Budget[] {
  const spending = new Map<string, number>();
  for (const transaction of monthTransactions(transactions, now)) {
    if (transaction.direction === 'out') {
      const category = transaction.category.toLocaleLowerCase();
      spending.set(category, (spending.get(category) ?? 0) + Math.round(transaction.amount * 100));
    }
  }
  return budgets.map((budget) => ({ ...budget, spent: (spending.get(budget.category.toLocaleLowerCase()) ?? 0) / 100 }));
}

export function monthlyExpense(transactions: Transaction[], now = new Date()): number {
  return monthTransactions(transactions, now)
    .filter((transaction) => transaction.direction === 'out')
    .reduce((sum, transaction) => sum + Math.round(transaction.amount * 100), 0) / 100;
}

export function appendTransaction(accounts: Account[], transactions: Transaction[], transaction: Transaction) {
  if (transactions.some((existing) => existing.id === transaction.id)) return { accounts, transactions };
  const account = accounts.find((item) => item.id === transaction.accountId);
  const destination = transaction.direction === 'transfer'
    ? accounts.find((item) => item.id === transaction.destinationAccountId) : undefined;
  const cents = Math.round(transaction.amount * 100);
  if (!account || !transaction.id.trim() || !transaction.category.trim() ||
      !Number.isSafeInteger(cents) || cents <= 0 ||
      Math.abs(transaction.amount * 100 - cents) > 0.000001 ||
      !Number.isFinite(new Date(transaction.date).getTime()) ||
      !['in', 'out', 'transfer'].includes(transaction.direction) ||
      (transaction.direction === 'transfer' && (!destination || destination.id === account.id))) {
    throw new Error('Transação inválida: confira conta, valor, categoria e data.');
  }
  const delta = transaction.direction === 'out' || transaction.direction === 'transfer' ? -cents : cents;
  return {
    accounts: accounts.map((item) => {
      if (item.id === account.id) return { ...item, balance: (Math.round(item.balance * 100) + delta) / 100 };
      if (destination && item.id === destination.id) return { ...item, balance: (Math.round(item.balance * 100) + cents) / 100 };
      return item;
    }),
    transactions: [transaction, ...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
  };
}
