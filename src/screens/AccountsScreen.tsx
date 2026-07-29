import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AnimatedAmount } from '../components/AnimatedAmount';
import { Card } from '../components/Card';
import { FadeIn } from '../components/FadeIn';
import { ProgressBar } from '../components/ProgressBar';
import { ScreenContainer } from '../components/ScreenContainer';
import { SectionHeader } from '../components/SectionHeader';
import { RootStackParamList } from '../navigation/types';
import { useFinanceStore } from '../store/financeStore';
import { colors, spacing, typography } from '../theme';
import { formatCurrency } from '../utils/format';

export function AccountsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const accounts = useFinanceStore((s) => s.accounts);
  const goals = useFinanceStore((s) => s.goals);

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
            {({ pressed }) => (
              <Feather name="chevron-left" size={22} color={colors.textPrimary} style={{ opacity: pressed ? 0.5 : 1 }} />
            )}
          </Pressable>
          <Text style={styles.title}>Contas e metas</Text>
          <View style={{ width: 22 }} />
        </View>

        <SectionHeader title="Contas conectadas" action="Conectar" onPressAction={() => navigation.navigate('Connections')} />
        {accounts.map((account, idx) => (
          <FadeIn key={account.id} delay={idx * 60}>
            <Card style={styles.accountCard}>
              <View style={styles.accountRow}>
                <View style={[styles.dot, { backgroundColor: account.color }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.accountName}>{account.nickname}</Text>
                  <Text style={styles.accountInstitution}>{account.institution}</Text>
                </View>
                <AnimatedAmount
                  value={account.balance}
                  format={(n) => formatCurrency(n, account.currency)}
                  style={[styles.accountBalance, account.balance < 0 && styles.negative]}
                />
              </View>
              {account.isMock && (
                <Text style={styles.mockTag}>Dado de exemplo — conecte seu banco em Ajustes</Text>
              )}
            </Card>
          </FadeIn>
        ))}

        <View style={{ marginTop: spacing.xl }}>
          <SectionHeader title="Metas" />
          {goals.map((goal, idx) => {
            const pct = goal.saved / goal.target;
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

const styles = StyleSheet.create({
  scrollContent: { paddingTop: spacing.md, paddingBottom: spacing.xxl },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  title: { ...typography.h1, color: colors.textPrimary },
  accountCard: { marginBottom: spacing.md },
  accountRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  dot: { width: 10, height: 10, borderRadius: 5 },
  accountName: { ...typography.bodyStrong, color: colors.textPrimary },
  accountInstitution: { ...typography.caption, color: colors.textMuted },
  accountBalance: { ...typography.bodyStrong, color: colors.textPrimary },
  negative: { color: colors.danger },
  mockTag: { ...typography.tiny, color: colors.textMuted, marginTop: spacing.sm },
  goalCard: { marginBottom: spacing.md },
  goalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  goalTitle: { ...typography.bodyStrong, color: colors.textPrimary },
  goalPct: { ...typography.bodyStrong, color: colors.wise },
  goalValues: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.sm },
});
