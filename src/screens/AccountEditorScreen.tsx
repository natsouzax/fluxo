import * as Crypto from 'expo-crypto';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { AnimatedPressable } from '../components/AnimatedPressable';
import { DetailHeader } from '../components/DetailHeader';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenContainer } from '../components/ScreenContainer';
import { AccountKind } from '../data/types';
import { RootStackParamList } from '../navigation/types';
import { useFinanceStore } from '../store/financeStore';
import { spacing, typography, useThemeStyles, type AppColors } from '../theme';
import { parseMoney } from '../utils/format';

type Props = NativeStackScreenProps<RootStackParamList, 'AccountEditor'>;
const kinds: { value: AccountKind; label: string }[] = [
  { value: 'checking', label: 'Corrente' }, { value: 'savings', label: 'Poupança' },
  { value: 'credit_card', label: 'Cartão' }, { value: 'investment', label: 'Investimento' },
];

export function AccountEditorScreen({ navigation }: Props) {
  const { colors, styles } = useThemeStyles(createStyles);
  const addAccount = useFinanceStore((state) => state.addAccount);
  const [nickname, setNickname] = useState('');
  const [institution, setInstitution] = useState('');
  const [balance, setBalance] = useState('');
  const [billingDueDay, setBillingDueDay] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [kind, setKind] = useState<AccountKind>('checking');

  function save() {
    const numericBalance = parseMoney(balance);
    if (!nickname.trim() || !institution.trim() || numericBalance === null) {
      Alert.alert('Confira os campos', 'Informe o nome da conta, a instituição e o saldo inicial.');
      return;
    }
    const dueDay = Number(billingDueDay);
    const limit = creditLimit.trim() ? parseMoney(creditLimit) ?? NaN : undefined;
    if (kind === 'credit_card' && (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 28 ||
        (limit !== undefined && (!Number.isFinite(limit) || limit <= 0)))) {
      Alert.alert('Confira os dados do cartão', 'Informe um dia de vencimento entre 1 e 28. O limite é opcional.');
      return;
    }
    try {
      addAccount({ id: Crypto.randomUUID(), nickname: nickname.trim(), institution: institution.trim(),
        balance: Math.round((kind === 'credit_card' ? -Math.abs(numericBalance) : numericBalance) * 100) / 100,
        currency: 'BRL', kind, color: colors.accent, lastSyncedAt: null,
        ...(kind === 'credit_card' ? { billingDueDay: dueDay, ...(limit ? { creditLimit: limit } : {}) } : {}) });
      navigation.goBack();
    } catch (error) {
      Alert.alert('Não foi possível salvar', error instanceof Error ? error.message : 'Tente novamente.');
    }
  }

  return <ScreenContainer bottomSafeArea>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
      <DetailHeader title="Adicionar conta" onBack={() => navigation.goBack()} />
      <Text style={styles.intro}>Comece com o saldo atual. Você pode registrar movimentações manualmente depois.</Text>
      <Text style={styles.label}>Nome da conta</Text>
      <TextInput value={nickname} onChangeText={setNickname} placeholder="Nome da conta" placeholderTextColor={colors.textMuted} style={styles.input} maxLength={50} />
      <Text style={styles.label}>Banco ou instituição</Text>
      <TextInput value={institution} onChangeText={setInstitution} placeholder="Banco ou instituição" placeholderTextColor={colors.textMuted} style={styles.input} maxLength={60} />
      <Text style={styles.label}>Tipo de conta</Text>
      <View style={styles.chips}>{kinds.map((item) => <AnimatedPressable key={item.value} onPress={() => setKind(item.value)} style={[styles.chip, kind === item.value && styles.chipSelected]}>
        <Text style={[styles.chipText, kind === item.value && styles.chipTextSelected]}>{item.label}</Text>
      </AnimatedPressable>)}</View>
      <Text style={styles.label}>{kind === 'credit_card' ? 'Fatura atual em aberto (R$)' : 'Saldo inicial (R$)'}</Text>
      <TextInput value={balance} onChangeText={setBalance} placeholder={kind === 'credit_card' ? 'Informe o valor em aberto' : 'Informe o saldo'} placeholderTextColor={colors.textMuted} keyboardType="decimal-pad" style={styles.input} />
      {kind === 'credit_card' ? <>
        <Text style={styles.label}>Dia de vencimento</Text>
        <TextInput value={billingDueDay} onChangeText={setBillingDueDay} placeholder="Dia do mês (1 a 28)" placeholderTextColor={colors.textMuted} keyboardType="number-pad" style={styles.input} maxLength={2} />
        <Text style={styles.label}>Limite do cartão (opcional)</Text>
        <TextInput value={creditLimit} onChangeText={setCreditLimit} placeholder="Informe o limite" placeholderTextColor={colors.textMuted} keyboardType="decimal-pad" style={styles.input} />
      </> : null}
      <PrimaryButton label="Salvar conta" onPress={save} />
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
