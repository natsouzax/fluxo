import { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
};

export type TabParamList = {
  Home: undefined;
  Chat: undefined;
  Notes: undefined;
  Agenda: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList> | undefined;
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
  NoteEditor: { noteId?: string };
  Connections: undefined;
  Accounts: undefined;
  AccountEditor: undefined;
  TransactionEditor: { direction?: 'out' | 'in' | 'transfer'; taskId?: string; description?: string } | undefined;
  BudgetEditor: undefined;
  Bills: undefined;
  BillEditor: undefined;
  TaskEditor: { taskId?: string; title?: string } | undefined;
  EventEditor: { eventId?: string; date?: string; occurrenceDate?: string };
};
