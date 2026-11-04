import * as Crypto from 'expo-crypto';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import { DetailHeader } from '../components/DetailHeader';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenContainer } from '../components/ScreenContainer';
import { RootStackParamList } from '../navigation/types';
import { useFinanceStore } from '../store/financeStore';
import { spacing, typography, useThemeStyles, type AppColors } from '../theme';
import { parseMoney } from '../utils/format';

type Props = NativeStackScreenProps<RootStackParamList, 'BudgetEditor'>;
export function BudgetEditorScreen({ navigation }: Props) {
  const { colors, styles } = useThemeStyles(createStyles);
  const addBudget = useFinanceStore((state) => state.addBudget);
  const [category, setCategory] = useState('');
  const [limit, setLimit] = useState('');

  function save() {
    const value = parseMoney(limit);
    if (!category.trim() || value === null || value <= 0) {
      Alert.alert('Confira os campos', 'Informe a categoria e um limite mensal maior que zero.');
      return;
    }
    try {
      addBudget({ id: Crypto.randomUUID(), category: category.trim(), limit: value, spent: 0, color: colors.accent });
      navigation.goBack();
    } catch (error) {
      Alert.alert('Não foi possível salvar', error instanceof Error ? error.message : 'Tente novamente.');
    }
  }

  return <ScreenContainer bottomSafeArea>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
      <DetailHeader title="Orçamento mensal" onBack={() => navigation.goBack()} />
      <Text style={styles.intro}>Escolha uma categoria e defina quanto pretende gastar neste mês. O progresso acompanha as despesas lançadas.</Text>
      <Text style={styles.label}>Categoria</Text>
      <TextInput value={category} onChangeText={setCategory} placeholder="Nome da categoria" placeholderTextColor={colors.textMuted} style={styles.input} maxLength={40} />
      <Text style={styles.label}>Limite mensal (R$)</Text>
      <TextInput value={limit} onChangeText={setLimit} placeholder="Informe o limite" placeholderTextColor={colors.textMuted} keyboardType="decimal-pad" style={styles.input} />
      <PrimaryButton label="Salvar orçamento" onPress={save} />
    </ScrollView>
  </ScreenContainer>;
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  content: { paddingTop: spacing.md, paddingBottom: spacing.xxl, gap: spacing.sm },
  intro: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.md },
  label: { ...typography.caption, color: colors.textPrimary, marginTop: spacing.sm },
  input: { minHeight: 52, borderWidth: 1, borderColor: colors.border, borderRadius: 14, paddingHorizontal: spacing.md, color: colors.textPrimary, backgroundColor: colors.card, ...typography.body },
});
