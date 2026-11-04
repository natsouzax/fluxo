import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { AgendaEvent } from '../data/types';
import { eventDate } from '../domain/agenda';
import { radius, spacing, typography, useThemeStyles, type AppColors } from '../theme';

export function EventRow({ event }: { event: AgendaEvent }) {
  const { colors, styles } = useThemeStyles(createStyles);
  const start = eventDate(event.start);
  const time = /^\d{4}-\d{2}-\d{2}$/.test(event.start) ? 'Dia todo'
    : start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const googleUrl = event.source === 'google' && event.url?.startsWith('https://www.google.com/calendar/') ? event.url : undefined;
  return (
    <Pressable style={styles.row} disabled={!googleUrl} onPress={() => googleUrl && Linking.openURL(googleUrl)} accessibilityRole={googleUrl ? 'link' : undefined} accessibilityLabel={googleUrl ? `Abrir ${event.title} no Google Calendar` : undefined}>
      <View style={styles.timeCol}>
        <Text style={styles.time}>{time}</Text>
        {event.source !== 'local' && <Feather name="calendar" size={12} color={colors.info} />}
      </View>
      <View style={[styles.bar, { backgroundColor: event.financeRelated ? colors.categoryPalette[1] : colors.highlight }]} />
      <View style={styles.info}>
        <Text style={styles.title}>{event.title}</Text>
        {event.notes ? <Text style={styles.notes}>{event.notes}</Text> : null}
        {event.location ? <Text style={styles.notes}>{event.location}</Text> : null}
      </View>
      {googleUrl ? <Feather name="external-link" size={15} color={colors.textSecondary} /> : null}
    </Pressable>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.md, padding: spacing.md, paddingLeft: spacing.sm, backgroundColor: colors.card, borderRadius: radius.md },
  timeCol: { minWidth: 56, maxWidth: '30%', alignItems: 'flex-start', gap: 4 },
  time: { ...typography.caption, color: colors.textSecondary },
  bar: { width: 3, borderRadius: 2, alignSelf: 'stretch', marginRight: spacing.md, marginLeft: spacing.sm },
  info: { flex: 1 },
  title: { ...typography.bodyStrong, color: colors.textPrimary },
  notes: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
});
