import * as Crypto from 'expo-crypto';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { AnimatedPressable } from '../components/AnimatedPressable';
import { DetailHeader } from '../components/DetailHeader';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenContainer } from '../components/ScreenContainer';
import { RootStackParamList } from '../navigation/types';
import { useFinanceStore } from '../store/financeStore';
import { spacing, typography, useThemeStyles, type AppColors } from '../theme';
import { parseMoney } from '../utils/format';

type Props = NativeStackScreenProps<RootStackParamList, 'BillEditor'>;
function dateKey(value: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  if (!match) return null;
  const [, day, month, year] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day), 12);
  if (date.getDate() !== Number(day) || date.getMonth() !== Number(month) - 1 || date.getFullYear() !== Number(year)) return null;
  return `${year}-${month}-${day}`;
}

export function BillEditorScreen({ navigation }: Props) {
  const { colors, styles } = useThemeStyles(createStyles);
  const allAccounts = useFinanceStore((state) => state.accounts);
  const accounts = useMemo(() => allAccounts.filter((account) => account.kind !== 'credit_card'), [allAccounts]);
  const addBill = useFinanceStore((state) => state.addBill);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '');
  const [recurrence, setRecurrence] = useState<'none' | 'monthly'>('none');

  useEffect(() => {
    if (!accountId && accounts[0]) setAccountId(accounts[0].id);
  }, [accountId, accounts]);

  function save() {
    const value = parseMoney(amount);
    const dueDateKey = dateKey(dueDate);
    if (!title.trim() || !category.trim() || !dueDateKey || value === null || value <= 0 || !accountId) {
      Alert.alert('Confira os campos', 'Informe descrição, categoria, valor, vencimento válido e conta de pagamento.');
      return;
    }
    try {
      addBill({ id: Crypto.randomUUID(), title: title.trim(), category: category.trim(), amount: value,
        dueDate: dueDateKey, accountId, recurrence, paid: false });
      navigation.goBack();
    } catch (error) {
      Alert.alert('Não foi possível salvar', error instanceof Error ? error.message : 'Tente novamente.');
    }
  }

  return <ScreenContainer bottomSafeArea>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
      <DetailHeader title="Conta a pagar" onBack={() => navigation.goBack()} />
      <Text style={styles.intro}>Guarde vencimentos e marque cada conta como paga. Contas mensais avançam para o próximo mês.</Text>
      <Text style={styles.label}>Descrição</Text>
      <TextInput value={title} onChangeText={setTitle} placeholder="Descrição da conta" placeholderTextColor={colors.textMuted} style={styles.input} maxLength={80} />
      <Text style={styles.label}>Categoria</Text>
      <TextInput value={category} onChangeText={setCategory} placeholder="Categoria" placeholderTextColor={colors.textMuted} style={styles.input} maxLength={40} />
      <Text style={styles.label}>Valor (R$)</Text>
      <TextInput value={amount} onChangeText={setAmount} placeholder="Informe o valor" placeholderTextColor={colors.textMuted} keyboardType="decimal-pad" style={styles.input} />
      <Text style={styles.label}>Vencimento (DD/MM/AAAA)</Text>
      <TextInput value={dueDate} onChangeText={setDueDate} placeholder="Dia / mês / ano" placeholderTextColor={colors.textMuted} keyboardType="numbers-and-punctuation" style={styles.input} maxLength={10} />
      <Text style={styles.label}>Repetição</Text>
      <View style={styles.chips}>
        {([{ value: 'none', label: 'Uma vez' }, { value: 'monthly', label: 'Todo mês' }] as const).map((item) => <AnimatedPressable key={item.value} onPress={() => setRecurrence(item.value)} style={[styles.chip, recurrence === item.value && styles.chipSelected]}>
          <Text style={[styles.chipText, recurrence === item.value && styles.chipTextSelected]}>{item.label}</Text>
        </AnimatedPressable>)}
      </View>
      <Text style={styles.label}>Pagar com</Text>
      {accounts.length ? <View style={styles.chips}>{accounts.map((account) => <AnimatedPressable key={account.id} onPress={() => setAccountId(account.id)} style={[styles.chip, accountId === account.id && styles.chipSelected]}>
        <Text style={[styles.chipText, accountId === account.id && styles.chipTextSelected]}>{account.nickname}</Text>
      </AnimatedPressable>)}</View> : <>
        <Text style={styles.intro}>Adicione uma conta corrente ou poupança para registrar pagamentos.</Text>
        <PrimaryButton label="Adicionar conta" variant="secondary" onPress={() => navigation.navigate('AccountEditor')} />
      </>}
      <PrimaryButton label="Salvar vencimento" onPress={save} />
    </ScrollView>
  </ScreenContainer>;
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  content: { paddingTop: spacing.md, paddingBottom: spacing.xxl, gap: spacing.sm },
  intro: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.md },
  label: { ...typography.caption, color: colors.textPrimary, marginTop: spacing.sm },
  input: { minHeight: 52, borderWidth: 1, borderColor: colors.border, borderRadius: 14, paddingHorizontal: spacing.md, color: colors.textPrimary, backgroundColor: colors.card, ...typography.body },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingVertical: 10, paddingHorizontal: 14 },
  chipSelected: { backgroundColor: colors.highlight, borderColor: colors.highlight },
  chipText: { ...typography.caption, color: colors.textSecondary },
  chipTextSelected: { color: colors.highlightText },
});
