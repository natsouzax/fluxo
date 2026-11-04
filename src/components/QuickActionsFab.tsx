import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AnimatedPressable } from './AnimatedPressable';
import { radius, spacing, typography, useThemeStyles, type AppColors } from '../theme';

interface Action {
  label: string;
  icon: React.ComponentProps<typeof Feather>['name'];
  onPress: () => void;
}

interface Props {
  bottomOffset: number;
  onAddExpense: () => void;
  onAddIncome: () => void;
  onAddAccount: () => void;
  onAddBill: () => void;
  onTransfer: () => void;
}

export function QuickActionsFab({ bottomOffset, onAddExpense, onAddIncome, onAddAccount, onAddBill, onTransfer }: Props) {
  const { colors, styles } = useThemeStyles(createStyles);
  const [expanded, setExpanded] = useState(false);
  const actions: Action[] = [
    { label: 'Adicionar despesa', icon: 'arrow-up-right', onPress: onAddExpense },
    { label: 'Adicionar receita', icon: 'arrow-down-left', onPress: onAddIncome },
    { label: 'Adicionar conta', icon: 'credit-card', onPress: onAddAccount },
    { label: 'Conta a pagar', icon: 'calendar', onPress: onAddBill },
    { label: 'Transferir entre contas', icon: 'repeat', onPress: onTransfer },
  ];

  function run(action: () => void) {
    setExpanded(false);
    action();
  }

  return (
    <View pointerEvents="box-none" style={styles.layer}>
      {expanded ? <Pressable style={styles.backdrop} onPress={() => setExpanded(false)} accessibilityRole="button" accessibilityLabel="Fechar ações rápidas" /> : null}
      <View style={[styles.menu, { bottom: bottomOffset }]}>
        {expanded ? actions.map((action) => (
          <AnimatedPressable key={action.label} style={styles.action} onPress={() => run(action.onPress)} accessibilityLabel={action.label}>
            <View style={styles.actionIcon}><Feather name={action.icon} size={18} color={colors.textPrimary} /></View>
            <Text style={styles.actionLabel}>{action.label}</Text>
          </AnimatedPressable>
        )) : null}
        <AnimatedPressable
          style={styles.fab}
          onPress={() => setExpanded((value) => !value)}
          accessibilityLabel={expanded ? 'Fechar ações rápidas' : 'Abrir ações rápidas'}
          accessibilityState={{ expanded }}
        >
          <Feather name={expanded ? 'x' : 'plus'} size={26} color={colors.accentText} />
        </AnimatedPressable>
      </View>
    </View>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  layer: { ...StyleSheet.absoluteFill, zIndex: 20 },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(10, 20, 14, 0.12)' },
  menu: { position: 'absolute', right: spacing.lg, alignItems: 'flex-end', gap: spacing.sm },
  fab: {
    width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.accent, elevation: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 5,
  },
  action: {
    minHeight: 48, flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm,
    paddingVertical: spacing.xs, paddingLeft: spacing.md, paddingRight: spacing.xs,
    borderRadius: radius.pill, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.14, shadowRadius: 4,
  },
  actionIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cardAlt },
  actionLabel: { ...typography.caption, color: colors.textPrimary, paddingRight: spacing.xs },
});
