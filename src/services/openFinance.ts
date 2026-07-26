import { Account, Transaction } from '../data/types';
import { mockAccounts, mockTransactions } from '../data/mockFinance';

// Abstraction over a real Open Finance Brasil aggregator (Pluggy, Belvo or
// Quanto are the usual choices for BR fintechs — Pluggy has the friendliest
// SDK + Connect widget for a first integration). None of them can be wired
// for real without:
//   1. A business account with the aggregator (they KYC the company, not
//      just the developer).
//   2. A backend endpoint that creates a `connect_token` server-side,
//      because the aggregator's client secret must never ship in the app.
//
// So this file defines the shape a real provider must satisfy, and ships a
// mock implementation so every screen above it (Home, Accounts, Chat) can be
// built and tested today. Swap `mockProvider` for `pluggyProvider` in
// `src/services/openFinanceConfig.ts` once the backend piece above exists.

export interface OpenFinanceProvider {
  id: string;
  label: string;
  isConfigured: boolean;
  connect: () => Promise<{ accounts: Account[]; transactions: Transaction[] }>;
}

export const mockProvider: OpenFinanceProvider = {
  id: 'mock',
  label: 'Contas de exemplo',
  isConfigured: true,
  connect: async () => {
    await new Promise((resolve) => setTimeout(resolve, 900));
    return { accounts: mockAccounts, transactions: mockTransactions };
  },
};

// Placeholder for a real integration. Requires:
// - EXPO_PUBLIC_PLUGGY_CONNECT_URL pointing at your backend's endpoint that
//   returns a Pluggy Connect Token (never call Pluggy's API directly from
//   the app — the client secret can't live on-device).
// - The `react-native-pluggy-connect` webview widget wired into a screen.
export const pluggyProvider: OpenFinanceProvider = {
  id: 'pluggy',
  label: 'Bancos via Open Finance (Pluggy)',
  isConfigured: false,
  connect: async () => {
    throw new Error(
      'Pluggy ainda não configurado. Crie um backend que gere o connect_token e implemente o widget de conexão (ver README).'
    );
  },
};

export const availableProviders: OpenFinanceProvider[] = [mockProvider, pluggyProvider];
