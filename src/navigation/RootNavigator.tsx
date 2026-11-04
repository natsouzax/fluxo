import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useReducedMotion } from '../hooks/useReducedMotion';
import React, { useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { SidebarMenu } from '../components/SidebarMenu';
import { AccountsScreen } from '../screens/AccountsScreen';
import { AccountEditorScreen } from '../screens/AccountEditorScreen';
import { TransactionEditorScreen } from '../screens/TransactionEditorScreen';
import { BudgetEditorScreen } from '../screens/BudgetEditorScreen';
import { BillsScreen } from '../screens/BillsScreen';
import { BillEditorScreen } from '../screens/BillEditorScreen';
import { TaskEditorScreen } from '../screens/TaskEditorScreen';
import { ConnectionsScreen } from '../screens/ConnectionsScreen';
import { NoteEditorScreen } from '../screens/NoteEditorScreen';
import { EventEditorScreen } from '../screens/EventEditorScreen';
import { OrganizationReminders } from '../components/OrganizationReminders';
import { useAuthStore } from '../store/authStore';
import { useAppThemeColors } from '../theme';
import { AuthNavigator } from './AuthNavigator';
import { navigationRef } from './navigationRef';
import { TabNavigator } from './TabNavigator';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const reducedMotion = useReducedMotion();
  const colors = useAppThemeColors();
  const navTheme = {
    ...DefaultTheme,
    dark: colors.bg === '#101610',
    colors: {
      ...DefaultTheme.colors,
      background: colors.bg,
      card: colors.bgElevated,
      border: colors.border,
      primary: colors.accent,
      text: colors.textPrimary,
    },
  };
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isReady = useAuthStore((s) => s.isReady);
  const initialize = useAuthStore((s) => s.initialize);
  useEffect(() => { void initialize(); }, [initialize]);

  if (!isReady) {
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
      <ActivityIndicator color={colors.accent} />
      <Text style={{ color: colors.textPrimary, marginTop: 12 }}>Preparando seu Fluxo…</Text>
    </View>;
  }

  return (
    <View style={{ flex: 1 }}>
      <NavigationContainer ref={navigationRef} theme={navTheme}>
        <Stack.Navigator screenOptions={{ headerShown: false, animation: reducedMotion ? 'none' : 'slide_from_right' }}>
          {!isAuthenticated ? (
            <Stack.Screen name="Auth" component={AuthNavigator} />
          ) : (
            <>
              <Stack.Screen name="Tabs" component={TabNavigator} />
              <Stack.Screen name="Accounts" component={AccountsScreen} />
              <Stack.Screen name="AccountEditor" component={AccountEditorScreen} options={{ animation: reducedMotion ? 'none' : 'slide_from_bottom' }} />
              <Stack.Screen name="TransactionEditor" component={TransactionEditorScreen} options={{ animation: reducedMotion ? 'none' : 'slide_from_bottom' }} />
              <Stack.Screen name="BudgetEditor" component={BudgetEditorScreen} options={{ animation: reducedMotion ? 'none' : 'slide_from_bottom' }} />
              <Stack.Screen name="Bills" component={BillsScreen} />
              <Stack.Screen name="BillEditor" component={BillEditorScreen} options={{ animation: reducedMotion ? 'none' : 'slide_from_bottom' }} />
              <Stack.Screen name="TaskEditor" component={TaskEditorScreen} options={{ animation: reducedMotion ? 'none' : 'slide_from_bottom' }} />
              <Stack.Screen name="Connections" component={ConnectionsScreen} />
              <Stack.Screen name="EventEditor" component={EventEditorScreen} />
              <Stack.Screen
                name="NoteEditor"
                component={NoteEditorScreen}
                options={{ animation: reducedMotion ? 'none' : 'slide_from_bottom' }}
              />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
      {isAuthenticated && <SidebarMenu />}
      {isAuthenticated && <OrganizationReminders />}
    </View>
  );
}
