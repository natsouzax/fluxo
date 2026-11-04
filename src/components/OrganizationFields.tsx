import DateTimePicker from '@react-native-community/datetimepicker';
import { Feather } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { AnimatedPressable } from './AnimatedPressable';
import { radius, spacing, typography, useThemeStyles, type AppColors } from '../theme';

export function Choices<T extends string>({ label, value, options, onChange }: {
  label: string; value: T; options: { value: T; label: string }[]; onChange: (value: T) => void;
}) {
  const { styles } = useThemeStyles(fieldStyles);
  return <View style={styles.group}><Text style={styles.label}>{label}</Text><View style={styles.choices}>
    {options.map((option) => <AnimatedPressable key={option.value} onPress={() => onChange(option.value)}
      accessibilityLabel={`${label}: ${option.label}`} accessibilityState={{ selected: value === option.value }}
      style={[styles.chip, value === option.value && styles.active]}>
      <Text style={[styles.chipText, value === option.value && styles.activeText]}>{option.label}</Text>
    </AnimatedPressable>)}
  </View></View>;
}

const formatInput = (value: string | null) => value ? (() => {
  const d = new Date(value);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
})() : '';

export function DateTimeField({ label, value, onChange }: { label: string; value: string | null; onChange: (value: string | null) => void }) {
  const { colors, styles } = useThemeStyles(fieldStyles);
  const [mode, setMode] = useState<'date' | 'time' | null>(null);
  const [input, setInput] = useState(formatInput(value));
  const [error, setError] = useState('');
  useEffect(() => { setInput(formatInput(value)); }, [value]);
  const chosen = value ? new Date(value) : new Date(new Date().setHours(18, 0, 0, 0));
  function parseInput() {
    if (!input.trim()) { setError(''); onChange(null); return; }
    const parts = /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})$/.exec(input);
    if (!parts) { setError('Use DD/MM/AAAA HH:mm.'); return; }
    const [, d, m, y, h, min] = parts;
    const date = new Date(+y, +m - 1, +d, +h, +min);
    if (date.getFullYear() !== +y || date.getMonth() !== +m - 1 || date.getDate() !== +d || +h > 23 || +min > 59) { setError('Confira a data e a hora.'); return; }
    setError(''); onChange(date.toISOString());
  }
  return <View style={styles.group}>
    <Text style={styles.label}>{label}</Text>
    {Platform.OS === 'web' ? <TextInput accessibilityLabel={label} style={styles.input} value={input}
      onChangeText={setInput} onBlur={parseInput} placeholder="DD/MM/AAAA HH:mm" placeholderTextColor={colors.textMuted} /> :
      <View style={styles.choices}>
        <AnimatedPressable style={styles.dateButton} onPress={() => setMode('date')} accessibilityLabel={`Escolher data: ${label}`}>
          <Feather name="calendar" size={17} color={colors.textSecondary} /><Text style={styles.chipText}>{value ? chosen.toLocaleDateString('pt-PT') : 'Definir data'}</Text>
        </AnimatedPressable>
        {value ? <AnimatedPressable style={styles.dateButton} onPress={() => setMode('time')} accessibilityLabel={`Escolher hora: ${label}`}>
          <Feather name="clock" size={17} color={colors.textSecondary} /><Text style={styles.chipText}>{chosen.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}</Text>
        </AnimatedPressable> : null}
      </View>}
    {value ? <AnimatedPressable style={styles.clear} accessibilityLabel={`Remover ${label}`} onPress={() => onChange(null)}><Text style={styles.muted}>Remover data</Text></AnimatedPressable> : null}
    {error ? <Text accessibilityRole="alert" style={{ color: colors.danger }}>{error}</Text> : null}
    {mode && Platform.OS !== 'web' ? <>
      <DateTimePicker value={chosen} mode={mode} is24Hour display={Platform.OS === 'ios' ? 'spinner' : 'default'}
        onChange={(event, date) => { setMode(null); if (event.type === 'set' && date) onChange(date.toISOString()); }} />
      {Platform.OS === 'ios' ? <AnimatedPressable style={styles.clear} onPress={() => setMode(null)}><Text style={styles.chipText}>Fechar seletor</Text></AnimatedPressable> : null}
    </> : null}
  </View>;
}

export const fieldStyles = (colors: AppColors) => StyleSheet.create({
  group: { gap: spacing.sm, marginVertical: spacing.sm },
  label: { ...typography.caption, color: colors.textPrimary, fontWeight: '700' },
  input: { ...typography.body, color: colors.textPrimary, backgroundColor: colors.card, minHeight: 52, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { minHeight: 44, paddingHorizontal: spacing.md, justifyContent: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill },
  chipText: { ...typography.caption, color: colors.textPrimary },
  active: { backgroundColor: colors.accent, borderColor: colors.accent },
  activeText: { color: colors.accentText },
  dateButton: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md },
  clear: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
  muted: { ...typography.caption, color: colors.textSecondary },
});
