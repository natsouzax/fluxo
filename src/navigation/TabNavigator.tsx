import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp, createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { QuickActionsFab } from '../components/QuickActionsFab';
import { AgendaScreen } from '../screens/AgendaScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { NotesScreen } from '../screens/NotesScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { typography, useAppThemeColors } from '../theme';
import { TabParamList } from './types';
import { RootStackParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();
const icons: Record<keyof TabParamList, React.ComponentProps<typeof Feather>['name']> = {
  Home: 'trending-up', Chat: 'message-circle', Notes: 'file-text', Agenda: 'calendar', Settings: 'settings',
};
const labels: Record<keyof TabParamList, string> = {
  Home: 'Finanças', Chat: 'Fluxo', Notes: 'Notas', Agenda: 'Rotina', Settings: 'Ajustes',
};

function HomeWithQuickActions() {
  const tabNavigation = useNavigation<BottomTabNavigationProp<TabParamList>>();
  const navigation = tabNavigation.getParent<NativeStackNavigationProp<RootStackParamList>>();
  return (
    <View style={{ flex: 1 }}>
      <HomeScreen />
      <QuickActionsFab
        bottomOffset={16}
        onAddExpense={() => navigation?.navigate('TransactionEditor', { direction: 'out' })}
        onAddIncome={() => navigation?.navigate('TransactionEditor', { direction: 'in' })}
        onAddAccount={() => navigation?.navigate('AccountEditor')}
        onAddBill={() => navigation?.navigate('BillEditor')}
        onTransfer={() => navigation?.navigate('TransactionEditor', { direction: 'transfer' })}
      />
    </View>
  );
}

export function TabNavigator() {
  const colors = useAppThemeColors();
  const insets = useSafeAreaInsets();
  const { fontScale } = useWindowDimensions();
  return (
    <Tab.Navigator initialRouteName="Chat" screenOptions={({ route }) => ({
      headerShown: false,
      tabBarHideOnKeyboard: true,
      tabBarLabel: labels[route.name],
      tabBarAccessibilityLabel: labels[route.name],
      tabBarActiveTintColor: colors.textPrimary,
      tabBarInactiveTintColor: colors.textMuted,
      tabBarLabelStyle: { ...typography.tiny, fontSize: 11, marginTop: 4 },
      tabBarItemStyle: { minHeight: 48, paddingVertical: 4 },
      tabBarStyle: { backgroundColor: colors.bgElevated, borderTopColor: colors.border,
        height: 68 + insets.bottom + Math.max(0, fontScale - 1) * 28, paddingTop: 4, paddingBottom: Math.max(insets.bottom, 8) },
      tabBarIcon: ({ focused }) => <View style={{ width: 36, height: 28, borderRadius: 10,
        alignItems: 'center', justifyContent: 'center', backgroundColor: focused ? colors.highlight : 'transparent' }}>
        <Feather name={icons[route.name]} size={19} color={focused ? colors.highlightText : colors.textMuted} />
      </View>,
    })}>
      <Tab.Screen name="Chat" component={ChatScreen} />
      <Tab.Screen name="Home" component={HomeWithQuickActions} />
      <Tab.Screen name="Notes" component={NotesScreen} />
      <Tab.Screen name="Agenda" component={AgendaScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
