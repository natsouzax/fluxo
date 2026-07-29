import { Feather } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { AgendaScreen } from '../screens/AgendaScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { NotesScreen } from '../screens/NotesScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { colors, typography } from '../theme';
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

function TabIcon({
  name,
  label,
  focused,
}: {
  name: React.ComponentProps<typeof Feather>['name'];
  label: string;
  focused: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const indicatorWidth = useRef(new Animated.Value(focused ? 28 : 0)).current;

  useEffect(() => {
    if (focused) {
      scale.setValue(0.85);
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 12 }).start();
    }
    Animated.timing(indicatorWidth, {
      toValue: focused ? 28 : 0,
      duration: 220,
      useNativeDriver: false,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focused]);

  return (
    <View style={styles.tabItem}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Feather name={name} size={20} color={focused ? colors.accent : colors.textMuted} />
      </Animated.View>
      <Text style={[styles.tabLabel, { color: focused ? colors.accent : colors.textMuted }]}>{label}</Text>
      <Animated.View style={[styles.indicator, { width: indicatorWidth }]} />
    </View>
  );
}

export function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: colors.bgElevated,
          borderTopColor: colors.border,
          height: 72,
          paddingTop: 10,
        },
        tabBarIcon: ({ focused }) => (
          <TabIcon
            name={icons[route.name as keyof TabParamList]}
            label={labels[route.name as keyof TabParamList]}
            focused={focused}
          />
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

const styles = StyleSheet.create({
  tabItem: { alignItems: 'center', gap: 4, width: 64 },
  tabLabel: { ...typography.tiny, fontWeight: '600' },
  indicator: { height: 2, borderRadius: 1, marginTop: 6, backgroundColor: colors.accent },
});
