import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Transaction } from '../data/types';
import { colors, spacing, typography } from '../theme';
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

export function TransactionRow({ transaction }: { transaction: Transaction }) {
  const isIn = transaction.direction === 'in';
  return (
    <View style={styles.row}>
      <View style={styles.iconWrap}>
        <Feather name={categoryIcon[transaction.category] ?? 'circle'} size={16} color={colors.textSecondary} />
      </View>
      <View style={styles.info}>
        <Text style={styles.description} numberOfLines={1}>
          {transaction.description}
        </Text>
        <Text style={styles.category}>{transaction.category}</Text>
      </View>
      <Text style={[styles.amount, isIn ? styles.amountIn : styles.amountOut]}>
        {isIn ? '+' : '-'} {formatCurrency(transaction.amount)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  info: { flex: 1 },
  description: { ...typography.bodyStrong, color: colors.textPrimary },
  category: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  amount: { ...typography.bodyStrong },
  amountIn: { color: colors.wise },
  amountOut: { color: colors.textPrimary },
});
