import { Feather } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '../components/Card';
import { EventRow } from '../components/EventRow';
import { ScreenContainer } from '../components/ScreenContainer';
import { hasGoogleClientId } from '../services/googleAuth';
import { useAgendaStore } from '../store/agendaStore';
import { useSettingsStore } from '../store/settingsStore';
import { colors, radius, spacing, typography } from '../theme';

export function AgendaScreen() {
  const events = useAgendaStore((s) => s.events);
  const googleConnection = useSettingsStore((s) => s.googleConnection);

  const sorted = useMemo(
    () => [...events].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()),
    [events]
  );

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>Rotina</Text>
        <Text style={styles.date}>
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
        </Text>
      </View>

      {!googleConnection.connected && (
        <Card style={styles.banner}>
          <Feather name="calendar" size={18} color={colors.info} />
          <Text style={styles.bannerText}>
            {hasGoogleClientId()
              ? 'Conecte sua conta Google em Ajustes para ver sua agenda real aqui.'
              : 'Integração com Google Calendar em breve — hoje a agenda usa eventos locais e lembretes financeiros.'}
          </Text>
        </Card>
      )}

      <FlatList
        data={sorted}
        keyExtractor={(e) => e.id}
        contentContainerStyle={{ paddingTop: spacing.lg, paddingBottom: spacing.xxl }}
        renderItem={({ item }) => <EventRow event={item} />}
        ListEmptyComponent={<Text style={styles.empty}>Nada por aqui hoje.</Text>}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: spacing.md },
  title: { ...typography.h1, color: colors.textPrimary },
  date: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs, textTransform: 'capitalize' },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.lg,
    borderRadius: radius.md,
  },
  bannerText: { ...typography.caption, color: colors.textSecondary, flex: 1, lineHeight: 18 },
  empty: { ...typography.caption, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xxl },
});
