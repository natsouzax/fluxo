import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useMemo } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { AnimatedAmount } from '../components/AnimatedAmount';
import { AnimatedPressable } from '../components/AnimatedPressable';
import { BalanceCard } from '../components/BalanceCard';
import { Card } from '../components/Card';
import { FadeIn } from '../components/FadeIn';
import { BrandHeader, ScreenHeading } from '../components/BrandHeader';
import { ProgressBar } from '../components/ProgressBar';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenContainer } from '../components/ScreenContainer';
import { SectionHeader } from '../components/SectionHeader';
import { TransactionRow } from '../components/TransactionRow';
import { spendingByCategory, totalBalance } from '../data/financeMetrics';
import { monthlyBudgets, monthlyExpense, monthTransactions } from '../domain/finance';
import { useAnimatedPieValues } from '../hooks/useAnimatedPieValues';
import { useNow } from '../hooks/useNow';
import { RootStackParamList } from '../navigation/types';
import { useFinanceStore } from '../store/financeStore';
import { useNotesStore } from '../store/notesStore';
import { radius, spacing, typography, useThemeStyles, type AppColors } from '../theme';
import { formatCurrency, safeRatio } from '../utils/format';

function localDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function billDueLabel(dueDate: string, today: string): string {
  const days = Math.round((new Date(`${dueDate}T12:00:00`).getTime() - new Date(`${today}T12:00:00`).getTime()) / 86_400_000);
  if (days < 0) return `Atrasada há ${Math.abs(days)} dia(s)`;
  if (days === 0) return 'Vence hoje';
  if (days <= 7) return `Vence em ${days} dia(s)`;
  return `Vence em ${new Date(`${dueDate}T12:00:00`).toLocaleDateString('pt-BR')}`;
}

export function HomeScreen() {
  const { colors, styles } = useThemeStyles(createStyles);
  const { width: screenWidth } = useWindowDimensions();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const accounts = useFinanceStore((s) => s.accounts);
  const transactions = useFinanceStore((s) => s.transactions);
  const budgetDefinitions = useFinanceStore((s) => s.budgets);
  const bills = useFinanceStore((s) => s.bills);
  const notes = useNotesStore((s) => s.notes);
  const now = useNow();
  const budgets = monthlyBudgets(budgetDefinitions, transactions, now);
  const todayKey = localDateKey(now);
  const weekKey = localDateKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 12));
  const pendingBills = bills.filter((bill) => !bill.paid).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const billsNeedingAttention = pendingBills.filter((bill) => bill.dueDate <= weekKey).slice(0, 3);

  const balance = totalBalance(accounts);
  const year = now.getFullYear();
  const month = now.getMonth();
  const spending = useMemo(() => spendingByCategory(monthTransactions(transactions, new Date(year, month, 1))), [transactions, year, month]);
  const spentThisMonth = monthlyExpense(transactions, now);
  const budgetLimit = budgets.reduce((sum, b) => sum + b.limit, 0);
  const incomeThisMonth = monthTransactions(transactions, new Date(year, month, 1))
    .filter((transaction) => transaction.direction === 'in')
    .reduce((sum, transaction) => sum + Math.round(transaction.amount * 100), 0) / 100;
  const monthName = now.toLocaleDateString('pt-BR', { month: 'long' });
  const animatedSpending = useAnimatedPieValues(spending, 800);
  const pieData = animatedSpending.map((s, idx) => ({
    name: s.category,
    population: s.amount,
    color: colors.categoryPalette[idx % colors.categoryPalette.length],
    legendFontColor: colors.textSecondary,
    legendFontSize: 12,
  }));

  return (
    <ScreenContainer padded={false} style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.hero}>
          <BrandHeader />
          <ScreenHeading eyebrow={`Seu dinheiro · ${monthName}`} title={'Seu mês,\nmais claro.'} />
          <View style={styles.balanceCard}>
            <View style={styles.balanceTop}>
              <Text style={styles.balanceLabel}>Saldo disponível</Text>
            </View>
            <AnimatedAmount value={balance} format={formatCurrency} duration={1000} style={styles.totalValue} />
            {accounts.length ? <View style={styles.balanceSummary}>
              <View>
                <Text style={styles.balanceMeta}>↓ Entradas</Text>
                <Text style={styles.balanceFigure}>{formatCurrency(incomeThisMonth)}</Text>
              </View>
              <View style={styles.balanceOut}>
                <Text style={styles.balanceMeta}>↑ Saídas</Text>
                <Text style={styles.balanceFigure}>{formatCurrency(spentThisMonth)}</Text>
              </View>
            </View> : <Text style={styles.balanceMeta}>Adicione sua primeira conta para acompanhar seu saldo.</Text>}
          </View>
          {!accounts.length ? <PrimaryButton label="Adicionar primeira conta" onPress={() => navigation.navigate('AccountEditor')} /> : null}
          <View style={styles.budgetPreview}>
            <View style={styles.budgetPreviewTop}>
              <Text style={styles.budgetPreviewTitle}>Orçamento mensal</Text>
              <Text style={styles.budgetPreviewPercent}>{budgetLimit > 0 ? `${Math.round(spentThisMonth / budgetLimit * 100)}% usado` : 'Sem orçamento'}</Text>
            </View>
            <ProgressBar progress={budgetLimit > 0 ? spentThisMonth / budgetLimit : 0} color={spentThisMonth > budgetLimit ? colors.danger : colors.accent} height={7} />
            <Text style={styles.budgetPreviewMeta}>{budgetLimit > 0 ? `${formatCurrency(spentThisMonth)} de ${formatCurrency(budgetLimit)}` : 'Seus limites aparecerão aqui quando cadastrados.'}</Text>
          </View>
        </View>
        <FadeIn delay={80}>
          <View style={[styles.section, styles.paddedSection]}>
            <SectionHeader title="Últimos registros" />
            <Card style={styles.transactionCard}>
              {[...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4).map((transaction) => (
                <TransactionRow key={transaction.id} transaction={transaction} compact />
              ))}
              {transactions.length === 0 ? <Text style={styles.empty}>Nenhum registro financeiro ainda.</Text> : null}
            </Card>
          </View>
        </FadeIn>
        <FadeIn delay={100}>
          <View style={[styles.section, styles.paddedSection]}>
            <SectionHeader title="Contas a pagar" action="Gerir" onPressAction={() => navigation.navigate('Bills')} />
            <Card>
              {pendingBills.length === 0 ? <Text style={styles.empty}>Cadastre vencimentos para acompanhar suas contas.</Text> : <>
                <Text style={styles.billTotal}>{formatCurrency(pendingBills.reduce((sum, bill) => sum + bill.amount, 0))} em aberto</Text>
                {billsNeedingAttention.length ? billsNeedingAttention.map((bill) => <View key={bill.id} style={styles.billRow}>
                  <Text numberOfLines={1} style={styles.billTitle}>{bill.title}</Text>
                  <Text style={[styles.billDue, bill.dueDate < todayKey && styles.billOverdue]}>{billDueLabel(bill.dueDate, todayKey)}</Text>
                </View>) : <Text style={styles.empty}>Nenhuma conta vence nos próximos sete dias.</Text>}
              </>}
            </Card>
          </View>
        </FadeIn>
        {notes[0] && (
          <FadeIn delay={120}>
            <AnimatedPressable
              accessibilityRole="button"
              accessibilityLabel={`Abrir nota ${notes[0].title}`}
              onPress={() => navigation.navigate('NoteEditor', { noteId: notes[0].id })}
              style={[styles.notePreview, styles.paddedSection]}
            >
              <Text style={styles.noteEyebrow}>IDEIA GUARDADA | NOTAS</Text>
              <Text style={styles.noteTitle} numberOfLines={1}>{notes[0].title}</Text>
              <Text style={styles.noteAction}>Ver nota ↗</Text>
            </AnimatedPressable>
          </FadeIn>
        )}
        <FadeIn delay={80}>
          <View style={[styles.section, styles.paddedSection]}>
            <SectionHeader title="Suas contas" action="Ver todas" onPressAction={() => navigation.navigate('Accounts')} />
          </View>
          {accounts.length ? <FlatList
            horizontal
            data={accounts}
            keyExtractor={(a) => a.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: spacing.lg }}
            renderItem={({ item }) => <BalanceCard account={item} />}
            style={styles.accountsList}
          /> : <Text style={[styles.empty, styles.paddedSection]}>Adicione uma conta para começar a acompanhar seu dinheiro.</Text>}
        </FadeIn>

        <FadeIn delay={160}>
          <View style={[styles.section, styles.paddedSection, styles.widgetsRow]}>
            <Card style={styles.widget}>
              <Text style={styles.widgetLabel}>Gasto do mês</Text>
              {transactions.length ? <AnimatedAmount value={spentThisMonth} format={formatCurrency} duration={900} style={styles.widgetValue} /> : <Text style={styles.empty}>Sem movimentações cadastradas.</Text>}
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
            <SectionHeader title="Gastos deste mês por categoria" />
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
          <SectionHeader title="Orçamentos do mês" action={budgets.length ? 'Ajustar' : 'Definir'}
            onPressAction={() => navigation.navigate('BudgetEditor')} />
          <Card>
            {budgets.length === 0 ? <Text style={styles.empty}>Seus orçamentos aparecerão aqui quando cadastrados.</Text> : budgets.map((b, idx) => (
              <View key={b.id} style={idx > 0 && styles.budgetSpacing}>
                <View style={styles.budgetRow}>
                  <Text style={styles.budgetLabel}>{b.category}</Text>
                  <Text style={styles.budgetValue}>
                    <AnimatedAmount value={b.spent} format={formatCurrency} duration={800} /> / {formatCurrency(b.limit)}
                  </Text>
                </View>
                <ProgressBar
                  progress={safeRatio(b.spent, b.limit)}
                  color={b.spent > b.limit ? colors.danger : colors.categoryPalette[idx % colors.categoryPalette.length]}
                />
                {b.spent > b.limit ? <Text style={styles.budgetExceeded}>Limite ultrapassado em {formatCurrency(b.spent - b.limit)}.</Text>
                  : b.spent / b.limit >= 0.8 ? <Text style={styles.budgetNotice}>Atenção: {Math.round(b.spent / b.limit * 100)}% do limite usado.</Text>
                    : null}
              </View>
            ))}
          </Card>
        </View>
        </FadeIn>

      </ScrollView>
    </ScreenContainer>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  screen: { backgroundColor: colors.bg },
  scrollContent: { paddingBottom: spacing.xxl },
  hero: { paddingTop: spacing.xs, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  balanceCard: { backgroundColor: colors.balanceSurface, borderRadius: radius.xl, padding: spacing.lg, gap: spacing.sm, marginBottom: spacing.md },
  balanceTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  balanceLabel: { ...typography.caption, color: colors.balanceInk, opacity: 0.8 },
  totalValue: { fontFamily: 'Manrope-ExtraBold', fontSize: 34, lineHeight: 42, letterSpacing: -0.8, color: colors.balanceInk },
  balanceSummary: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, justifyContent: 'space-between', marginTop: spacing.xs },
  balanceOut: { alignItems: 'flex-end' },
  balanceMeta: { ...typography.caption, color: colors.balanceInk, opacity: 0.75 },
  balanceFigure: { ...typography.bodyStrong, fontVariant: ['tabular-nums'], color: colors.balanceInk, marginTop: 2 },
  budgetPreview: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md, borderWidth: 1, borderColor: colors.border },
  budgetPreviewTop: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'space-between', alignItems: 'center' },
  budgetPreviewTitle: { ...typography.bodyStrong, color: colors.textPrimary },
  budgetPreviewPercent: { ...typography.tiny, color: colors.textSecondary },
  budgetPreviewMeta: { ...typography.tiny, color: colors.textSecondary },
  section: { marginBottom: spacing.sm },
  paddedSection: { paddingHorizontal: spacing.lg },
  transactionCard: { paddingVertical: 0, paddingHorizontal: 0, backgroundColor: colors.bg, borderWidth: 0 },
  notePreview: { marginHorizontal: spacing.lg, backgroundColor: colors.notesSurface, borderRadius: radius.lg, padding: spacing.lg, paddingVertical: spacing.md, marginBottom: spacing.xl },
  noteEyebrow: { ...typography.tiny, color: colors.textMuted, letterSpacing: 0.5 },
  noteTitle: { ...typography.bodyStrong, color: colors.textPrimary, marginTop: spacing.sm },
  noteAction: { ...typography.tiny, color: colors.textSecondary, marginTop: spacing.md },
  accountsList: { marginBottom: spacing.xl },
  widgetsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.xl },
  widget: { flex: 1, minWidth: 150 },
  widgetLabel: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs },
  widgetValue: { ...typography.h1, color: colors.textPrimary, marginBottom: spacing.md },
  dotsRow: { flexDirection: 'row', gap: spacing.xs },
  accountDot: { width: 20, height: 20, borderRadius: 10 },
  budgetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'space-between', marginBottom: spacing.xs },
  budgetLabel: { ...typography.body, color: colors.textPrimary },
  budgetValue: { ...typography.caption, color: colors.textSecondary },
  budgetSpacing: { marginTop: spacing.lg },
  budgetExceeded: { ...typography.caption, color: colors.danger, marginTop: spacing.xs },
  budgetNotice: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  billTotal: { ...typography.h1, color: colors.textPrimary, marginBottom: spacing.sm },
  billRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  billTitle: { ...typography.caption, color: colors.textPrimary, flex: 1 },
  billDue: { ...typography.tiny, color: colors.textSecondary },
  billOverdue: { color: colors.danger },
  empty: { ...typography.caption, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.lg },
});
