import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { Dimensions, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { BalanceCard } from '../components/BalanceCard';
import { Card } from '../components/Card';
import { ProgressBar } from '../components/ProgressBar';
import { ScreenContainer } from '../components/ScreenContainer';
import { SectionHeader } from '../components/SectionHeader';
import { TransactionRow } from '../components/TransactionRow';
import { spendingByCategory, totalBalance } from '../data/mockFinance';
import { RootStackParamList } from '../navigation/types';
import { useFinanceStore } from '../store/financeStore';
import { colors, spacing, typography } from '../theme';
import { formatCurrency } from '../utils/format';

const screenWidth = Dimensions.get('window').width;

export function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const accounts = useFinanceStore((s) => s.accounts);
  const transactions = useFinanceStore((s) => s.transactions);
  const budgets = useFinanceStore((s) => s.budgets);

  const balance = totalBalance(accounts);
  const spending = spendingByCategory(transactions).slice(0, 5);

  const pieData = spending.map((s) => ({
    name: s.category,
    population: s.amount,
    color: s.color,
    legendFontColor: colors.textSecondary,
    legendFontSize: 12,
  }));

  return (
    <ScreenContainer padded={false}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Olá 👋</Text>
            <Text style={styles.totalLabel}>Saldo total</Text>
            <Text style={styles.totalValue}>{formatCurrency(balance)}</Text>
          </View>
          <Pressable style={styles.avatarBtn} onPress={() => navigation.navigate('Connections')}>
            <Feather name="user" size={18} color={colors.textPrimary} />
          </Pressable>
        </View>

        <View style={styles.quickActions}>
          <QuickAction
            icon="message-circle"
            label="Perguntar à IA"
            onPress={() => navigation.navigate('Tabs', { screen: 'Chat' })}
          />
          <QuickAction icon="pie-chart" label="Contas" onPress={() => navigation.navigate('Accounts')} />
          <QuickAction icon="link" label="Conectar" onPress={() => navigation.navigate('Connections')} />
        </View>

        <View style={styles.section}>
          <SectionHeader title="Suas contas" action="Ver todas" onPressAction={() => navigation.navigate('Accounts')} />
          <FlatList
            horizontal
            data={accounts}
            keyExtractor={(a) => a.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: spacing.lg }}
            renderItem={({ item }) => <BalanceCard account={item} />}
          />
        </View>

        <View style={[styles.section, styles.paddedSection]}>
          <SectionHeader title="Para onde vai seu dinheiro" />
          <Card>
            {pieData.length > 0 ? (
              <PieChart
                data={pieData}
                width={screenWidth - spacing.lg * 4}
                height={160}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="0"
                chartConfig={{
                  color: () => colors.textPrimary,
                  labelColor: () => colors.textSecondary,
                }}
                hasLegend
              />
            ) : (
              <Text style={styles.empty}>Sem gastos registrados ainda.</Text>
            )}
          </Card>
        </View>

        <View style={[styles.section, styles.paddedSection]}>
          <SectionHeader title="Orçamentos do mês" />
          <Card>
            {budgets.map((b, idx) => (
              <View key={b.id} style={idx > 0 && styles.budgetSpacing}>
                <View style={styles.budgetRow}>
                  <Text style={styles.budgetLabel}>{b.category}</Text>
                  <Text style={styles.budgetValue}>
                    {formatCurrency(b.spent)} / {formatCurrency(b.limit)}
                  </Text>
                </View>
                <ProgressBar
                  progress={b.spent / b.limit}
                  color={b.spent > b.limit ? colors.danger : b.color}
                />
              </View>
            ))}
          </Card>
        </View>

        <View style={[styles.section, styles.paddedSection]}>
          <SectionHeader title="Transações recentes" />
          <Card>
            {transactions.slice(0, 5).map((t) => (
              <TransactionRow key={t.id} transaction={t} />
            ))}
          </Card>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function QuickAction({
  icon,
  label,
  onPress,
}: {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.quickAction} onPress={onPress}>
      <View style={styles.quickIcon}>
        <Feather name={icon} size={18} color={colors.accent} />
      </View>
      <Text style={styles.quickLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: spacing.xxl },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  greeting: { ...typography.body, color: colors.textSecondary },
  totalLabel: { ...typography.caption, color: colors.textMuted, marginTop: spacing.md },
  totalValue: { ...typography.display, color: colors.textPrimary },
  avatarBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
  },
  quickAction: { alignItems: 'center', gap: spacing.xs, flex: 1 },
  quickIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: { ...typography.tiny, color: colors.textSecondary, textAlign: 'center' },
  section: { marginBottom: spacing.xl },
  paddedSection: { paddingHorizontal: spacing.lg },
  budgetRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
  budgetLabel: { ...typography.body, color: colors.textPrimary },
  budgetValue: { ...typography.caption, color: colors.textSecondary },
  budgetSpacing: { marginTop: spacing.lg },
  empty: { ...typography.caption, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.lg },
});
