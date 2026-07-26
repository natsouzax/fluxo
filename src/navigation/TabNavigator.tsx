import { Feather } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { AgendaScreen } from '../screens/AgendaScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { NotesScreen } from '../screens/NotesScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { colors } from '../theme';
import { TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();

const icons: Record<keyof TabParamList, React.ComponentProps<typeof Feather>['name']> = {
  Home: 'home',
  Chat: 'message-circle',
  Notes: 'file-text',
  Agenda: 'calendar',
  Settings: 'settings',
};

const labels: Record<keyof TabParamList, string> = {
  Home: 'Início',
  Chat: 'IA',
  Notes: 'Notas',
  Agenda: 'Rotina',
  Settings: 'Ajustes',
};

export function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.bgElevated,
          borderTopColor: colors.border,
          height: 64,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarLabel: labels[route.name as keyof TabParamList],
        tabBarIcon: ({ color, size }) => (
          <Feather name={icons[route.name as keyof TabParamList]} color={color} size={size ?? 20} />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Chat" component={ChatScreen} />
      <Tab.Screen name="Notes" component={NotesScreen} />
      <Tab.Screen name="Agenda" component={AgendaScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
