import { NavigatorScreenParams } from '@react-navigation/native';

export type TabParamList = {
  Home: undefined;
  Chat: undefined;
  Notes: undefined;
  Agenda: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
  NoteEditor: { noteId?: string };
  Connections: undefined;
  Accounts: undefined;
};
