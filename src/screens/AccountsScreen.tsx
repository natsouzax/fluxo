import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { AnimatedAmount } from '../components/AnimatedAmount';
import { Card } from '../components/Card';
import { FadeIn } from '../components/FadeIn';
import { ProgressBar } from '../components/ProgressBar';
import { DetailHeader } from '../components/DetailHeader';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenContainer } from '../components/ScreenContainer';
import { SectionHeader } from '../components/SectionHeader';
import { RootStackParamList } from '../navigation/types';
import { useFinanceStore } from '../store/financeStore';
import { spacing, typography, useThemeStyles, type AppColors } from '../theme';
import { formatCurrency, safeRatio } from '../utils/format';

export function AccountsScreen() {
  const { colors, styles } = useThemeStyles(createStyles);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const accounts = useFinanceStore((s) => s.accounts);
  const goals = useFinanceStore((s) => s.goals);

  return (
    <ScreenContainer bottomSafeArea>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      <DetailHeader title="Contas e metas" onBack={() => navigation.goBack()} />

        <SectionHeader title="Suas contas" action="+ Adicionar" onPressAction={() => navigation.navigate('AccountEditor')} />
        {accounts.length === 0 ? <Card style={styles.accountCard}>
          <Text style={styles.accountName}>Suas contas começam aqui</Text>
          <Text style={styles.accountInstitution}>Cadastre uma conta manualmente ou conecte uma fonte de dados.</Text>
          <PrimaryButton label="Adicionar conta" onPress={() => navigation.navigate('AccountEditor')} />
        </Card> : accounts.map((account, idx) => (
          <FadeIn key={account.id} delay={idx * 60}>
            <Card style={styles.accountCard}>
              <View style={styles.accountRow}>
                <View style={[styles.dot, { backgroundColor: account.color }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.accountName}>{account.nickname}</Text>
                  <Text style={styles.accountInstitution}>{account.institution}</Text>
                  {account.kind === 'credit_card' ? <Text style={styles.accountInstitution}>
                    Fatura em aberto: {formatCurrency(Math.abs(Math.min(0, account.balance)))}
                    {account.billingDueDay ? ` · vence dia ${account.billingDueDay}` : ''}
                    {account.creditLimit ? ` · limite ${formatCurrency(account.creditLimit)}` : ''}
                  </Text> : null}
                </View>
                <AnimatedAmount
                  value={account.balance}
                  format={(n) => formatCurrency(n, account.currency)}
                  style={[styles.accountBalance, account.balance < 0 && styles.negative]}
                />
              </View>
            </Card>
          </FadeIn>
        ))}

        <View style={{ marginTop: spacing.xl }}>
          <SectionHeader title="Metas" />
          {goals.length === 0 ? <Text style={styles.accountInstitution}>Suas metas aparecerão aqui quando você criar a primeira.</Text> : goals.map((goal, idx) => {
            const pct = safeRatio(goal.saved, goal.target);
            return (
              <FadeIn key={goal.id} delay={idx * 60}>
                <Card style={styles.goalCard}>
                  <View style={styles.goalRow}>
                    <Text style={styles.goalTitle}>{goal.title}</Text>
                    <AnimatedAmount value={pct * 100} format={(n) => `${Math.round(n)}%`} style={styles.goalPct} />
                  </View>
                  <ProgressBar progress={pct} color={colors.wise} />
                  <Text style={styles.goalValues}>
                    <AnimatedAmount value={goal.saved} format={(n) => formatCurrency(n)} /> de {formatCurrency(goal.target)}
                    {goal.deadline ? ` · até ${new Date(goal.deadline).toLocaleDateString('pt-BR')}` : ''}
                  </Text>
                </Card>
              </FadeIn>
            );
          })}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  scrollContent: { paddingTop: spacing.md, paddingBottom: spacing.xxl },
  accountCard: { marginBottom: spacing.md },
  accountRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  dot: { width: 10, height: 10, borderRadius: 5 },
  accountName: { ...typography.bodyStrong, color: colors.textPrimary },
  accountInstitution: { ...typography.caption, color: colors.textMuted },
  accountBalance: { ...typography.bodyStrong, color: colors.textPrimary },
  negative: { color: colors.danger },
  goalCard: { marginBottom: spacing.md },
  goalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  goalTitle: { ...typography.bodyStrong, color: colors.textPrimary },
  goalPct: { ...typography.bodyStrong, color: colors.wise },
  goalValues: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.sm },
});
