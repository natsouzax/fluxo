import { Feather } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { navigationRef } from '../navigation/navigationRef';
import { useAuthStore } from '../store/authStore';
import { useDrawerStore } from '../store/drawerStore';
import { colors, radius, spacing, typography } from '../theme';

const PANEL_WIDTH = Math.min(300, Dimensions.get('window').width * 0.82);

type MenuItem = {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  action: () => void;
};

export function SidebarMenu() {
  const isOpen = useDrawerStore((s) => s.isOpen);
  const close = useDrawerStore((s) => s.close);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: isOpen ? 1 : 0,
      duration: 260,
      useNativeDriver: false,
    }).start();
  }, [isOpen, progress]);

  function go(action: () => void) {
    close();
    setTimeout(() => {
      if (navigationRef.isReady()) action();
    }, 200);
  }

  const items: MenuItem[] = [
    { icon: 'home', label: 'Início', action: () => navigationRef.navigate('Tabs', { screen: 'Home' }) },
    { icon: 'message-circle', label: 'Copiloto IA', action: () => navigationRef.navigate('Tabs', { screen: 'Chat' }) },
    { icon: 'credit-card', label: 'Contas e metas', action: () => navigationRef.navigate('Accounts') },
    { icon: 'file-text', label: 'Notas', action: () => navigationRef.navigate('Tabs', { screen: 'Notes' }) },
    { icon: 'calendar', label: 'Rotina', action: () => navigationRef.navigate('Tabs', { screen: 'Agenda' }) },
    { icon: 'link', label: 'Conexões', action: () => navigationRef.navigate('Connections') },
    { icon: 'settings', label: 'Ajustes', action: () => navigationRef.navigate('Tabs', { screen: 'Settings' }) },
  ];

  return (
    <View style={styles.overlay} pointerEvents={isOpen ? 'auto' : 'none'}>
      <Animated.View style={[styles.backdrop, { opacity: progress }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} />
      </Animated.View>

      <Animated.View
        style={[
          styles.panel,
          {
            transform: [
              { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [-PANEL_WIDTH, 0] }) },
            ],
          },
        ]}
      >
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom', 'left']}>
          <View style={styles.header}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{(user?.name ?? 'F').charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.userName} numberOfLines={1}>
                {user?.name ?? 'Usuário'}
              </Text>
              <Text style={styles.userEmail} numberOfLines={1}>
                {user?.email ?? ''}
              </Text>
            </View>
          </View>

          <View style={styles.items}>
            {items.map((item) => (
              <Pressable key={item.label} style={styles.item} onPress={() => go(item.action)}>
                {({ pressed }) => (
                  <>
                    <Feather
                      name={item.icon}
                      size={19}
                      color={colors.textSecondary}
                      style={{ opacity: pressed ? 0.6 : 1 }}
                    />
                    <Text style={[styles.itemLabel, { opacity: pressed ? 0.6 : 1 }]}>{item.label}</Text>
                  </>
                )}
              </Pressable>
            ))}
          </View>

          <Pressable style={styles.logoutItem} onPress={() => go(logout)}>
            {({ pressed }) => (
              <>
                <Feather name="log-out" size={19} color={colors.danger} style={{ opacity: pressed ? 0.6 : 1 }} />
                <Text style={[styles.logoutLabel, { opacity: pressed ? 0.6 : 1 }]}>Sair</Text>
              </>
            )}
          </Pressable>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100 },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(10,12,16,0.5)' },
  panel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: PANEL_WIDTH,
    backgroundColor: colors.card,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { ...typography.h2, color: colors.accent },
  userName: { ...typography.bodyStrong, color: colors.textPrimary },
  userEmail: { ...typography.caption, color: colors.textMuted },
  items: { paddingTop: spacing.md, paddingHorizontal: spacing.sm },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },
  itemLabel: { ...typography.body, color: colors.textPrimary },
  logoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginTop: 'auto',
    marginBottom: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  logoutLabel: { ...typography.bodyStrong, color: colors.danger },
});
