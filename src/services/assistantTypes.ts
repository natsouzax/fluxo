import { Account, AgendaEvent, Budget, Goal, Note, Transaction } from '../data/types';
import { AssistantNavigation } from './assistantNavigation';

export interface AssistantContext {
  accounts: Account[];
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
  notes: Note[];
  events: AgendaEvent[];
  userName?: string;
}

export interface AssistantTurn { role: 'user' | 'assistant'; content: string }
export interface AssistantReply {
  content: string;
  destination?: AssistantNavigation['destination'];
  handled?: boolean;
  source?: 'local' | 'openrouter';
}
