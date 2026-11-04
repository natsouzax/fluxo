import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { Account, Bill, Budget, Goal, Transaction } from '../data/types';
import { appendTransaction, monthlyBudgets, nextMonthlyDueDate, validateBill } from '../domain/finance';
import { profileStorage } from './profileStorage';

interface FinanceState {
  accounts: Account[];
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
  bills: Bill[];
  addTransaction: (t: Transaction) => void;
  addAccount: (account: Account) => void;
  addBudget: (budget: Budget) => void;
  addBill: (bill: Bill) => void;
  payBill: (billId: string) => void;
  addToGoal: (goalId: string, amount: number) => void;
  replaceAccounts: (accounts: Account[]) => void;
  replaceSnapshot: (accounts: Account[], transactions: Transaction[]) => void;
}

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set) => ({
      accounts: [],
      transactions: [],
      budgets: [],
      goals: [],
      bills: [],
      addTransaction: (t) =>
        set((state) => {
          const next = appendTransaction(state.accounts, state.transactions, t);
          return { ...next, budgets: monthlyBudgets(state.budgets, next.transactions) };
        }),
      addAccount: (account) => set((state) => {
        if (!account.id.trim() || !account.nickname.trim() || !account.institution.trim() ||
            !Number.isFinite(account.balance) || state.accounts.some((item) => item.id === account.id)) {
          throw new Error('Confira os dados da conta.');
        }
        return { accounts: [...state.accounts, account] };
      }),
      addBudget: (budget) => set((state) => {
        const category = budget.category.trim();
        const cents = Math.round(budget.limit * 100);
        if (!budget.id.trim() || !category || !Number.isSafeInteger(cents) || cents <= 0 || !Number.isFinite(budget.limit)) {
          throw new Error('Informe uma categoria e um limite mensal positivo.');
        }
        const existing = state.budgets.find((item) => item.category.toLocaleLowerCase() === category.toLocaleLowerCase());
        const next = existing
          ? state.budgets.map((item) => item.id === existing.id ? { ...item, limit: cents / 100, category } : item)
          : [...state.budgets, { ...budget, category, limit: cents / 100, spent: 0 }];
        return { budgets: next };
      }),
      addBill: (bill) => set((state) => {
        const accountIds = new Set(state.accounts.filter((account) => account.kind !== 'credit_card').map((account) => account.id));
        if (!validateBill(bill, accountIds)) throw new Error('Confira vencimento, valor, categoria e conta de pagamento.');
        if (state.bills.some((item) => item.id === bill.id)) throw new Error('Esta conta já existe.');
        return { bills: [...state.bills, { ...bill, title: bill.title.trim(), category: bill.category.trim(), amount: Math.round(bill.amount * 100) / 100 }]
          .sort((a, b) => a.dueDate.localeCompare(b.dueDate)) };
      }),
      payBill: (billId) => set((state) => {
        const bill = state.bills.find((item) => item.id === billId);
        if (!bill || bill.paid) throw new Error('Esta conta já foi paga ou não existe.');
        const transaction: Transaction = { id: `bill-${bill.id}-${bill.dueDate}`, accountId: bill.accountId,
          description: bill.title, merchant: '', category: bill.category, amount: bill.amount,
          direction: 'out', date: new Date().toISOString() };
        const next = appendTransaction(state.accounts, state.transactions, transaction);
        const bills = state.bills.map((item) => item.id !== bill.id ? item : item.recurrence === 'monthly'
          ? { ...item, dueDate: nextMonthlyDueDate(item.dueDate), paid: false }
          : { ...item, paid: true });
        return { ...next, bills, budgets: monthlyBudgets(state.budgets, next.transactions) };
      }),
      addToGoal: (goalId, amount) => {
        if (!Number.isFinite(amount) || amount <= 0) throw new Error('Informe um valor positivo.');
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === goalId ? { ...g, saved: g.saved + amount } : g
          ),
        }));
      },
      replaceAccounts: (accounts) => set({ accounts }),
      replaceSnapshot: (accounts, transactions) => set((state) => ({
        accounts, transactions, budgets: monthlyBudgets(state.budgets, transactions),
      })),
    }),
    {
      name: 'fluxo-finance',
      storage: createJSONStorage(() => profileStorage),
      skipHydration: true,
      version: 1,
      migrate: (persisted) => {
        const state = persisted as Partial<Pick<FinanceState, 'accounts' | 'transactions' | 'budgets' | 'goals' | 'bills'>>;
        const demoAccountIds = new Set(['acc-nubank-cc', 'acc-inter-poup', 'acc-nubank-cartao', 'acc-xp-invest']);
        const accounts = (state.accounts ?? []).filter((account) => !account.isMock && !demoAccountIds.has(account.id));
        const accountIds = new Set(accounts.map((account) => account.id));
        const demoTransactionIds = new Set(['t1', 't2', 't3', 't4', 't5', 't6', 't7', 't8', 't9', 't10']);
        return {
          accounts,
          transactions: (state.transactions ?? []).filter((transaction) =>
            accountIds.has(transaction.accountId) && !demoTransactionIds.has(transaction.id)),
          budgets: (state.budgets ?? []).filter((budget) => !['b1', 'b2', 'b3', 'b4'].includes(budget.id)),
          goals: (state.goals ?? []).filter((goal) => !['g1', 'g2'].includes(goal.id)),
          bills: state.bills ?? [],
        };
      },
      partialize: ({ accounts, transactions, budgets, goals, bills }) => ({ accounts, transactions, budgets, goals, bills }),
    }
  )
);
