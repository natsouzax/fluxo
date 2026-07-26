import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { mockAccounts, mockBudgets, mockGoals, mockTransactions } from '../data/mockFinance';
import { Account, Budget, Goal, Transaction } from '../data/types';

interface FinanceState {
  accounts: Account[];
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
  addTransaction: (t: Transaction) => void;
  addToGoal: (goalId: string, amount: number) => void;
  replaceAccounts: (accounts: Account[]) => void;
}

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set) => ({
      accounts: mockAccounts,
      transactions: mockTransactions,
      budgets: mockBudgets,
      goals: mockGoals,
      addTransaction: (t) =>
        set((state) => ({
          transactions: [t, ...state.transactions],
          budgets: state.budgets.map((b) =>
            b.category === t.category && t.direction === 'out'
              ? { ...b, spent: b.spent + t.amount }
              : b
          ),
        })),
      addToGoal: (goalId, amount) =>
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === goalId ? { ...g, saved: g.saved + amount } : g
          ),
        })),
      replaceAccounts: (accounts) => set({ accounts }),
    }),
    {
      name: 'fluxo-finance',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
