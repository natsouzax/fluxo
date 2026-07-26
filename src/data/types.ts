export type AccountKind = 'checking' | 'savings' | 'credit_card' | 'investment';

export interface Account {
  id: string;
  institution: string;
  kind: AccountKind;
  nickname: string;
  balance: number;
  currency: string;
  color: string;
  lastSyncedAt: string | null;
  isMock: boolean;
}

export type TransactionDirection = 'in' | 'out';

export interface Transaction {
  id: string;
  accountId: string;
  description: string;
  merchant: string;
  category: string;
  amount: number; // always positive; direction says the sign
  direction: TransactionDirection;
  date: string; // ISO date
}

export interface Budget {
  id: string;
  category: string;
  limit: number;
  spent: number;
  color: string;
}

export interface Goal {
  id: string;
  title: string;
  target: number;
  saved: number;
  deadline: string | null;
}

export interface Note {
  id: string;
  title: string;
  body: string;
  tags: string[];
  linkedGoalId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AgendaEvent {
  id: string;
  title: string;
  start: string; // ISO datetime
  end: string;
  source: 'local' | 'google';
  financeRelated?: boolean;
  notes?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}
