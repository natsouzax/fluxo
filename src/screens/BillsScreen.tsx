import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card } from '../components/Card';
import { DetailHeader } from '../components/DetailHeader';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenContainer } from '../components/ScreenContainer';
import { SectionHeader } from '../components/SectionHeader';
import { RootStackParamList } from '../navigation/types';
import { useFinanceStore } from '../store/financeStore';
import { spacing, typography, useThemeStyles, type AppColors } from '../theme';
import { formatCurrency } from '../utils/format';

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function dueLabel(dueDate: string, today: string): string {
  const difference = Math.round((new Date(`${dueDate}T12:00:00`).getTime() - new Date(`${today}T12:00:00`).getTime()) / 86_400_000);
  if (difference < 0) return `Atrasada há ${Math.abs(difference)} dia(s)`;
  if (difference === 0) return 'Vence hoje';
  if (difference <= 7) return `Vence em ${difference} dia(s)`;
  return `Vence em ${new Date(`${dueDate}T12:00:00`).toLocaleDateString('pt-BR')}`;
}

export function BillsScreen() {
  const { styles } = useThemeStyles(createStyles);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const bills = useFinanceStore((state) => state.bills);
  const payBill = useFinanceStore((state) => state.payBill);
  const today = dateKey(new Date());
  const openBills = bills.filter((bill) => !bill.paid).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const paidBills = bills.filter((bill) => bill.paid);

  function markPaid(id: string) {
    try { payBill(id); }
    catch (error) { Alert.alert('Não foi possível registrar o pagamento', error instanceof Error ? error.message : 'Tente novamente.'); }
  }

  return <ScreenContainer bottomSafeArea>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <DetailHeader title="Contas a pagar" onBack={() => navigation.goBack()} />
      <Text style={styles.intro}>Acompanhe vencimentos e registre pagamentos na conta escolhida.</Text>
      <PrimaryButton label="Adicionar vencimento" onPress={() => navigation.navigate('BillEditor')} />
      <SectionHeader title="Em aberto" />
      {openBills.length ? openBills.map((bill) => <Card key={bill.id} style={styles.card}>
        <View style={styles.row}>
          <View style={styles.billInfo}>
            <Text style={styles.title}>{bill.title}</Text>
            <Text style={styles.meta}>{bill.category} · {dueLabel(bill.dueDate, today)}{bill.recurrence === 'monthly' ? ' · Mensal' : ''}</Text>
          </View>
          <Text style={styles.amount}>{formatCurrency(bill.amount)}</Text>
        </View>
        <PrimaryButton label="Marcar como paga" variant="secondary" onPress={() => markPaid(bill.id)} />
      </Card>) : <Card><Text style={styles.empty}>Não há vencimentos em aberto.</Text></Card>}
      {paidBills.length ? <>
        <SectionHeader title="Pagas" />
        {paidBills.map((bill) => <Card key={bill.id} style={styles.card}>
          <View style={styles.row}>
            <View style={styles.billInfo}>
              <Text style={styles.title}>{bill.title}</Text>
              <Text style={styles.meta}>{bill.category} · Paga</Text>
            </View>
            <Text style={styles.amount}>{formatCurrency(bill.amount)}</Text>
          </View>
        </Card>)}
      </> : null}
    </ScrollView>
  </ScreenContainer>;
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  content: { paddingTop: spacing.md, paddingBottom: spacing.xxl, gap: spacing.sm },
  intro: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.md },
  card: { marginBottom: spacing.sm, gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  billInfo: { flex: 1 },
  title: { ...typography.bodyStrong, color: colors.textPrimary },
  meta: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
  amount: { ...typography.bodyStrong, color: colors.textPrimary },
  empty: { ...typography.body, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.md },
});
