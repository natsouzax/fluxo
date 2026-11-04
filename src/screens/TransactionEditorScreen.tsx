import * as Crypto from 'expo-crypto';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { AnimatedPressable } from '../components/AnimatedPressable';
import { DetailHeader } from '../components/DetailHeader';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenContainer } from '../components/ScreenContainer';
import { RootStackParamList } from '../navigation/types';
import { TransactionDirection } from '../data/types';
import { useFinanceStore } from '../store/financeStore';
import { spacing, typography, useThemeStyles, type AppColors } from '../theme';
import { parseMoney } from '../utils/format';

type Props = NativeStackScreenProps<RootStackParamList, 'TransactionEditor'>;
export function TransactionEditorScreen({ navigation, route }: Props) {
  const { colors, styles } = useThemeStyles(createStyles);
  const accounts = useFinanceStore((state) => state.accounts);
  const addTransaction = useFinanceStore((state) => state.addTransaction);
  const [direction, setDirection] = useState<TransactionDirection>(route.params?.direction ?? 'out');
  const [description, setDescription] = useState(route.params?.description ?? '');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '');
  const [destinationAccountId, setDestinationAccountId] = useState(accounts[1]?.id ?? '');

  useEffect(() => {
    if (!accountId && accounts[0]) setAccountId(accounts[0].id);
  }, [accounts, accountId]);

  useEffect(() => {
    if ((!destinationAccountId || destinationAccountId === accountId) && accounts.length > 1) {
      setDestinationAccountId(accounts.find((account) => account.id !== accountId)?.id ?? '');
    }
  }, [accounts, accountId, destinationAccountId]);

  function save() {
    const numericAmount = parseMoney(amount);
    if (!accounts.length) {
      Alert.alert('Adicione uma conta primeiro', 'Crie uma conta para vincular esta movimentação.');
      return;
    }
    if (!description.trim() || (direction !== 'transfer' && !category.trim()) || numericAmount === null ||
        numericAmount <= 0 || !accountId ||
        (direction === 'transfer' && (!destinationAccountId || destinationAccountId === accountId))) {
      Alert.alert('Confira os campos', 'Informe descrição, categoria, valor e conta.');
      return;
    }
    try {
      addTransaction({ id: Crypto.randomUUID(), accountId, ...(direction === 'transfer' ? { destinationAccountId } : {}), description: description.trim(), merchant: '', category: direction === 'transfer' ? 'Transfer' : category.trim(),
        amount: Math.round(numericAmount * 100) / 100, direction, date: new Date().toISOString() });
      navigation.goBack();
    } catch (error) {
      Alert.alert('Não foi possível salvar', error instanceof Error ? error.message : 'Tente novamente.');
    }
  }

  return <ScreenContainer bottomSafeArea>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
      <DetailHeader title="Nova movimentação" onBack={() => navigation.goBack()} />
      <Text style={styles.intro}>Registre uma entrada ou despesa e ela será somada ao saldo da conta escolhida.</Text>
      <View style={styles.chips}>
        {([{ value: 'out', label: 'Despesa' }, { value: 'in', label: 'Receita' }, ...(accounts.length > 1 ? [{ value: 'transfer' as const, label: 'Transfer\u00eancia' }] : [])] as const).map((item) => <AnimatedPressable key={item.value} onPress={() => setDirection(item.value)} style={[styles.chip, direction === item.value && styles.chipSelected]}>
          <Text style={[styles.chipText, direction === item.value && styles.chipTextSelected]}>{item.label}</Text>
        </AnimatedPressable>)}
      </View>
      <Text style={styles.label}>Descrição</Text>
      <TextInput value={description} onChangeText={setDescription} placeholder="Descrição da movimentação" placeholderTextColor={colors.textMuted} style={styles.input} maxLength={100} />
      {direction !== 'transfer' ? <>
        <Text style={styles.label}>Categoria</Text>
        <View style={styles.chips}>{(direction === 'out'
          ? ['Alimenta\u00e7\u00e3o', 'Moradia', 'Transporte', 'Sa\u00fade', 'Lazer', 'Contas']
          : ['Sal\u00e1rio', 'Freelance', 'Investimentos', 'Reembolso', 'Outros']).map((item) => <AnimatedPressable key={item} onPress={() => setCategory(item)} style={[styles.chip, category === item && styles.chipSelected]}>
            <Text style={[styles.chipText, category === item && styles.chipTextSelected]}>{item}</Text>
          </AnimatedPressable>)}</View>
        <TextInput value={category} onChangeText={setCategory} placeholder="Outra categoria" placeholderTextColor={colors.textMuted} style={styles.input} maxLength={40} />
      </> : null}
      <Text style={styles.label}>Valor (R$)</Text>
      <TextInput value={amount} onChangeText={setAmount} placeholder="Informe o valor" placeholderTextColor={colors.textMuted} keyboardType="decimal-pad" style={styles.input} />
      <Text style={styles.label}>Conta</Text>
      {accounts.length ? <View style={styles.chips}>{accounts.map((account) => <AnimatedPressable key={account.id} onPress={() => setAccountId(account.id)} style={[styles.chip, accountId === account.id && styles.chipSelected]}>
        <Text style={[styles.chipText, accountId === account.id && styles.chipTextSelected]}>{account.nickname}</Text>
      </AnimatedPressable>)}</View> : <>
        <Text style={styles.intro}>Crie uma conta para vincular esta movimentação.</Text>
        <PrimaryButton label="Criar conta" onPress={() => navigation.navigate('AccountEditor')} variant="secondary" />
      </>}
      {direction === 'transfer' ? <>
        <Text style={styles.label}>Para</Text>
        <View style={styles.chips}>{accounts.filter((account) => account.id !== accountId).map((account) => <AnimatedPressable key={account.id} onPress={() => setDestinationAccountId(account.id)} style={[styles.chip, destinationAccountId === account.id && styles.chipSelected]}>
          <Text style={[styles.chipText, destinationAccountId === account.id && styles.chipTextSelected]}>{account.nickname}</Text>
        </AnimatedPressable>)}</View>
      </> : null}
      <PrimaryButton label={direction === 'out' ? 'Salvar despesa' : direction === 'in' ? 'Salvar receita' : 'Salvar transfer\u00eancia'} onPress={save} />
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
