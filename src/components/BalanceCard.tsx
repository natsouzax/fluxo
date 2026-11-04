import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AnimatedAmount } from './AnimatedAmount';
import { Account } from '../data/types';
import { radius, spacing, typography, useThemeStyles, type AppColors } from '../theme';
import { formatCurrency } from '../utils/format';

const kindLabel: Record<Account['kind'], string> = {
  checking: 'Conta corrente',
  savings: 'Poupança',
  credit_card: 'Cartão de crédito',
  investment: 'Investimentos',
};

const kindIcon: Record<Account['kind'], React.ComponentProps<typeof Feather>['name']> = {
  checking: 'credit-card',
  savings: 'trending-up',
  credit_card: 'credit-card',
  investment: 'bar-chart-2',
};

export function BalanceCard({ account }: { account: Account }) {
  const { colors, styles } = useThemeStyles(createStyles);
  const isNegative = account.balance < 0;
  return (
    <View style={[styles.card, { borderColor: account.color + '55' }]}>
      <View style={styles.header}>
        <View style={[styles.iconWrap, { backgroundColor: account.color + '33' }]}>
          <Feather name={kindIcon[account.kind]} size={16} color={account.color} />
        </View>
        <Text style={styles.institution} numberOfLines={1}>
          {account.institution}
        </Text>
      </View>
      <Text style={styles.nickname}>{account.nickname}</Text>
      <AnimatedAmount
        value={account.balance}
        format={(n) => formatCurrency(n, account.currency)}
        style={[styles.balance, isNegative && styles.negative]}
      />
      <Text style={styles.kind}>{kindLabel[account.kind]}</Text>
    </View>
  );
}

const CARD_WIDTH = 220;

const createStyles = (colors: AppColors) => StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    marginRight: spacing.md,
    justifyContent: 'space-between',
    minHeight: 140,
    shadowColor: '#101418',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  iconWrap: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  institution: { ...typography.caption, color: colors.textSecondary, flexShrink: 1 },
  nickname: { ...typography.body, color: colors.textPrimary, marginBottom: spacing.xs },
  balance: { ...typography.h1, color: colors.textPrimary },
  negative: { color: colors.danger },
  kind: { ...typography.tiny, color: colors.textMuted, marginTop: spacing.sm },
});
