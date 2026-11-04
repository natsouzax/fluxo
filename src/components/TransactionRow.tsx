import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Transaction } from '../data/types';
import { radius, spacing, typography, useThemeStyles, type AppColors } from '../theme';
import { formatCurrency } from '../utils/format';

const categoryIcon: Record<string, React.ComponentProps<typeof Feather>['name']> = {
  'Alimentação': 'coffee',
  'Transporte': 'navigation',
  'Moradia': 'home',
  'Lazer': 'film',
  'Saúde': 'heart',
  'Assinaturas': 'repeat',
  'Compras': 'shopping-bag',
  'Salário': 'briefcase',
};

export function TransactionRow({ transaction, compact = false }: { transaction: Transaction; compact?: boolean }) {
  const { colors, styles } = useThemeStyles(createStyles);
  const isIn = transaction.direction === 'in';
  const isTransfer = transaction.direction === 'transfer';
  // Date-only records are calendar dates; parsing them as UTC can move them to yesterday.
  const date = /^\d{4}-\d{2}-\d{2}$/.test(transaction.date)
    ? new Date(`${transaction.date}T12:00:00`) : new Date(transaction.date);
  return (
    <View style={[styles.row, compact && styles.compactRow]}>
      <View style={[styles.iconWrap, compact && styles.compactIcon]}>
        <Feather name={categoryIcon[transaction.category] ?? 'circle'} size={16} color={colors.textSecondary} />
      </View>
      <View style={styles.info}>
        <Text style={styles.description} numberOfLines={1}>
          {transaction.description}
        </Text>
        <Text style={styles.category}>{isTransfer ? 'Transferência entre contas' : transaction.category} · {date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</Text>
      </View>
      <Text style={[styles.amount, isTransfer ? styles.amountTransfer : isIn ? styles.amountIn : styles.amountOut]}>
        {isTransfer ? '↔' : isIn ? '+' : '-'} {formatCurrency(transaction.amount)}
      </Text>
    </View>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  compactRow: { paddingVertical: spacing.md },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.financeSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactIcon: { width: 36, height: 36, borderRadius: 12 },
  info: { flex: 1, minWidth: 100 },
  description: { ...typography.bodyStrong, color: colors.textPrimary },
  category: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  amount: { ...typography.bodyStrong, fontVariant: ['tabular-nums'] },
  amountIn: { color: colors.wise },
  amountOut: { color: colors.textPrimary },
  amountTransfer: { color: colors.textSecondary },
});
