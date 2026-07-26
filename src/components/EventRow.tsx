import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AgendaEvent } from '../data/types';
import { colors, spacing, typography } from '../theme';

export function EventRow({ event }: { event: AgendaEvent }) {
  const start = new Date(event.start);
  const time = start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return (
    <View style={styles.row}>
      <View style={styles.timeCol}>
        <Text style={styles.time}>{time}</Text>
        {event.source === 'google' && <Feather name="calendar" size={12} color={colors.info} />}
      </View>
      <View style={[styles.bar, { backgroundColor: event.financeRelated ? colors.accent : colors.info }]} />
      <View style={styles.info}>
        <Text style={styles.title}>{event.title}</Text>
        {event.notes ? <Text style={styles.notes}>{event.notes}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.md },
  timeCol: { width: 56, alignItems: 'flex-start', gap: 4 },
  time: { ...typography.caption, color: colors.textSecondary },
  bar: { width: 3, borderRadius: 2, alignSelf: 'stretch', marginRight: spacing.md, marginLeft: spacing.sm },
  info: { flex: 1 },
  title: { ...typography.bodyStrong, color: colors.textPrimary },
  notes: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
});
