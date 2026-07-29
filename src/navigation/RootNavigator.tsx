import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { View } from 'react-native';
import { SidebarMenu } from '../components/SidebarMenu';
import { AccountsScreen } from '../screens/AccountsScreen';
import { ConnectionsScreen } from '../screens/ConnectionsScreen';
import { NoteEditorScreen } from '../screens/NoteEditorScreen';
import { useAuthStore } from '../store/authStore';
import { colors } from '../theme';
import { AuthNavigator } from './AuthNavigator';
import { navigationRef } from './navigationRef';
import { TabNavigator } from './TabNavigator';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.bg,
    card: colors.bgElevated,
    border: colors.border,
    primary: colors.accent,
    text: colors.textPrimary,
  },
};

export function RootNavigator() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <View style={{ flex: 1 }}>
      <NavigationContainer ref={navigationRef} theme={navTheme}>
        <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
          {!isAuthenticated ? (
            <Stack.Screen name="Auth" component={AuthNavigator} />
          ) : (
            <>
              <Stack.Screen name="Tabs" component={TabNavigator} />
              <Stack.Screen name="Accounts" component={AccountsScreen} />
              <Stack.Screen name="Connections" component={ConnectionsScreen} />
              <Stack.Screen
                name="NoteEditor"
                component={NoteEditorScreen}
                options={{ animation: 'slide_from_bottom' }}
              />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
      {isAuthenticated && <SidebarMenu />}
    </View>
  );
}
