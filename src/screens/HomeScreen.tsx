import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo } from 'react';
import { Dimensions, FlatList, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { AnimatedAmount } from '../components/AnimatedAmount';
import { AnimatedPressable } from '../components/AnimatedPressable';
import { BalanceCard } from '../components/BalanceCard';
import { Card } from '../components/Card';
import { FadeIn } from '../components/FadeIn';
import { MenuButton } from '../components/MenuButton';
import { ProgressBar } from '../components/ProgressBar';
import { ScreenContainer } from '../components/ScreenContainer';
import { SectionHeader } from '../components/SectionHeader';
import { TransactionRow } from '../components/TransactionRow';
import { spendingByCategory, totalBalance } from '../data/mockFinance';
import { useAnimatedPieValues } from '../hooks/useAnimatedPieValues';
import { RootStackParamList } from '../navigation/types';
import { useFinanceStore } from '../store/financeStore';
import { colors, radius, spacing, typography } from '../theme';
import { formatCurrency } from '../utils/format';

const screenWidth = Dimensions.get('window').width;

export function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const accounts = useFinanceStore((s) => s.accounts);
  const transactions = useFinanceStore((s) => s.transactions);
  const budgets = useFinanceStore((s) => s.budgets);

  const balance = totalBalance(accounts);
  const spending = useMemo(() => spendingByCategory(transactions).slice(0, 5), [transactions]);
  const spentThisMonth = budgets.reduce((sum, b) => sum + b.spent, 0);
  const budgetLimit = budgets.reduce((sum, b) => sum + b.limit, 0);

  const animatedSpending = useAnimatedPieValues(spending, 800);
  const pieData = animatedSpending.map((s) => ({
    name: s.category,
    population: s.amount,
    color: s.color,
    legendFontColor: colors.textSecondary,
    legendFontSize: 12,
  }));

  return (
    <ScreenContainer padded={false} style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroTop}>
            <View style={styles.heroTopLeft}>
              <MenuButton variant="light" />
              <Text style={styles.greeting}>Olá 👋</Text>
            </View>
            <AnimatedPressable
              style={styles.avatarBtn}
              onPress={() => navigation.navigate('Connections')}
              accessibilityLabel="Conexões e conta"
            >
              <Feather name="user" size={18} color="#FFFFFF" />
            </AnimatedPressable>
          </View>

          <View style={styles.heroBalance}>
            <Text style={styles.totalLabel}>Saldo total</Text>
            <AnimatedAmount value={balance} format={formatCurrency} duration={1000} style={styles.totalValue} />
            <AnimatedPressable style={styles.accountsPill} onPress={() => navigation.navigate('Accounts')}>
              <Text style={styles.accountsPillText}>Contas</Text>
            </AnimatedPressable>
          </View>

          <View style={styles.quickActions}>
            <QuickAction
              icon="message-circle"
              label="Perguntar à IA"
              onPress={() => navigation.navigate('Tabs', { screen: 'Chat' })}
            />
            <QuickAction icon="pie-chart" label="Contas" onPress={() => navigation.navigate('Accounts')} />
            <QuickAction icon="link" label="Conectar" onPress={() => navigation.navigate('Connections')} />
            <QuickAction icon="more-horizontal" label="Mais" onPress={() => navigation.navigate('Tabs', { screen: 'Settings' })} />
          </View>
        </LinearGradient>

        <FadeIn delay={80}>
          <View style={[styles.section, styles.paddedSection]}>
            <SectionHeader title="Suas contas" action="Ver todas" onPressAction={() => navigation.navigate('Accounts')} />
          </View>
          <FlatList
            horizontal
            data={accounts}
            keyExtractor={(a) => a.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: spacing.lg }}
            renderItem={({ item }) => <BalanceCard account={item} />}
            style={styles.accountsList}
          />
        </FadeIn>

        <FadeIn delay={160}>
          <View style={[styles.section, styles.paddedSection, styles.widgetsRow]}>
            <Card style={styles.widget}>
              <Text style={styles.widgetLabel}>Gasto do mês</Text>
              <AnimatedAmount value={spentThisMonth} format={formatCurrency} duration={900} style={styles.widgetValue} />
              <ProgressBar
                progress={budgetLimit > 0 ? spentThisMonth / budgetLimit : 0}
                color={spentThisMonth > budgetLimit ? colors.danger : colors.accent}
                height={6}
              />
            </Card>
            <Card style={styles.widget}>
              <Text style={styles.widgetLabel}>Patrimônio</Text>
              <AnimatedAmount value={balance} format={formatCurrency} duration={1000} style={styles.widgetValue} />
              <View style={styles.dotsRow}>
                {accounts.map((a, idx) => (
                  <FadeIn key={a.id} delay={200 + idx * 80} distance={0}>
                    <View style={[styles.accountDot, { backgroundColor: a.color }]} />
                  </FadeIn>
                ))}
              </View>
            </Card>
          </View>
        </FadeIn>

        <FadeIn delay={240}>
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
        </FadeIn>

        <FadeIn delay={320}>
        <View style={[styles.section, styles.paddedSection]}>
          <SectionHeader title="Orçamentos do mês" />
          <Card>
            {budgets.map((b, idx) => (
              <View key={b.id} style={idx > 0 && styles.budgetSpacing}>
                <View style={styles.budgetRow}>
                  <Text style={styles.budgetLabel}>{b.category}</Text>
                  <Text style={styles.budgetValue}>
                    <AnimatedAmount value={b.spent} format={formatCurrency} duration={800} /> / {formatCurrency(b.limit)}
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
        </FadeIn>

        <FadeIn delay={400}>
          <View style={[styles.section, styles.paddedSection]}>
            <SectionHeader title="Transações recentes" />
            <Card>
              {transactions.slice(0, 5).map((t) => (
                <TransactionRow key={t.id} transaction={t} />
              ))}
            </Card>
          </View>
        </FadeIn>
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
    <AnimatedPressable style={styles.quickAction} onPress={onPress}>
      <View style={styles.quickIcon}>
        <Feather name={icon} size={18} color="#FFFFFF" />
      </View>
      <Text style={styles.quickLabel}>{label}</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.bg },
  scrollContent: { paddingBottom: spacing.xxl },
  hero: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: radius.xxl,
    borderBottomRightRadius: radius.xxl,
    marginBottom: spacing.xl,
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroTopLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  greeting: { ...typography.body, color: '#FFFFFF', opacity: 0.9 },
  avatarBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBalance: { alignItems: 'center', marginTop: spacing.xl },
  totalLabel: { ...typography.bodyStrong, color: 'rgba(255,255,255,0.85)' },
  totalValue: { ...typography.display, color: '#FFFFFF', marginTop: spacing.xs },
  accountsPill: {
    marginTop: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  accountsPillText: { ...typography.bodyStrong, color: '#FFFFFF' },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
  },
  quickAction: { alignItems: 'center', gap: spacing.xs, flex: 1 },
  quickIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: { ...typography.tiny, color: 'rgba(255,255,255,0.9)', textAlign: 'center' },
  section: { marginBottom: spacing.md },
  paddedSection: { paddingHorizontal: spacing.lg },
  accountsList: { marginBottom: spacing.xl },
  widgetsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
  widget: { flex: 1 },
  widgetLabel: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs },
  widgetValue: { ...typography.h1, color: colors.textPrimary, marginBottom: spacing.md },
  dotsRow: { flexDirection: 'row', gap: spacing.xs },
  accountDot: { width: 20, height: 20, borderRadius: 10 },
  budgetRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
  budgetLabel: { ...typography.body, color: colors.textPrimary },
  budgetValue: { ...typography.caption, color: colors.textSecondary },
  budgetSpacing: { marginTop: spacing.lg },
  empty: { ...typography.caption, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.lg },
});
