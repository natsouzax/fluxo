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
  /** Credit card statement due day in the month, from 1 to 28. */
  billingDueDay?: number;
  creditLimit?: number;
  /** Legacy flag used only to remove example accounts from older local profiles. */
  isMock?: boolean;
}

export type TransactionDirection = 'in' | 'out' | 'transfer';

export interface Transaction {
  id: string;
  accountId: string;
  /** Destination account for internal transfers. */
  destinationAccountId?: string;
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
  spent: number; // Derived monthly view; never treat a persisted value as the source of spending.
  color: string;
}

export interface Bill {
  id: string;
  title: string;
  amount: number;
  dueDate: string; // Local calendar date in YYYY-MM-DD format.
  category: string;
  accountId: string;
  recurrence: 'none' | 'monthly';
  paid: boolean;
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
  source: 'local' | 'google' | 'device';
  financeRelated?: boolean;
  notes?: string;
  location?: string;
  url?: string;
  category?: 'personal' | 'work' | 'study' | 'shopping' | 'project';
  recurrence?: 'none' | 'daily' | 'weekly' | 'monthly';
  recurrenceUntil?: string | null;
  excludedDates?: string[];
  reminderMinutes?: number | null;
  /** Projection fields: identify a single occurrence without duplicating the series. */
  seriesId?: string;
  occurrenceDate?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}
