import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Card } from '../components/Card';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenContainer } from '../components/ScreenContainer';
import { SectionHeader } from '../components/SectionHeader';
import { StatusPill } from '../components/StatusPill';
import { RootStackParamList } from '../navigation/types';
import { useSettingsStore } from '../store/settingsStore';
import { colors, radius, spacing, typography } from '../theme';

export function SettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const apiKey = useSettingsStore((s) => s.anthropicApiKey);
  const setApiKey = useSettingsStore((s) => s.setAnthropicApiKey);
  const googleConnection = useSettingsStore((s) => s.googleConnection);
  const openFinanceConnection = useSettingsStore((s) => s.openFinanceConnection);
  const [keyDraft, setKeyDraft] = useState(apiKey ?? '');

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        <Text style={styles.title}>Ajustes</Text>

        <View style={{ marginTop: spacing.xl }}>
          <SectionHeader title="Conexões" />
          <Pressable onPress={() => navigation.navigate('Connections')}>
            <Card style={styles.row}>
              <View style={styles.rowInfo}>
                <Feather name="link" size={18} color={colors.textSecondary} />
                <Text style={styles.rowLabel}>Bancos e Google</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: spacing.xs }}>
                <StatusPill connected={openFinanceConnection.connected} label="Banco" />
                <StatusPill connected={googleConnection.connected} label="Google" />
              </View>
            </Card>
          </Pressable>
        </View>

        <View style={{ marginTop: spacing.xl }}>
          <SectionHeader title="IA" />
          <Card>
            <Text style={styles.label}>Chave da API Anthropic (Claude)</Text>
            <Text style={styles.helper}>
              Necessária para o Copiloto responder de verdade. Crie a sua em
              console.anthropic.com — a chave fica só no seu aparelho (Android Keystore).
            </Text>
            <TextInput
              value={keyDraft}
              onChangeText={setKeyDraft}
              placeholder="sk-ant-..."
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
              <View style={{ flex: 1 }}>
                <PrimaryButton
                  label="Salvar chave"
                  onPress={() => {
                    setApiKey(keyDraft.trim() || null);
                    Alert.alert('Salvo', 'Chave da API atualizada.');
                  }}
                />
              </View>
              {apiKey && (
                <Pressable
                  style={styles.linkBtn}
                  onPress={() => Linking.openURL('https://console.anthropic.com/settings/keys')}
                >
                  <Text style={styles.linkText}>Gerenciar</Text>
                </Pressable>
              )}
            </View>
          </Card>
        </View>

        <View style={{ marginTop: spacing.xl }}>
          <SectionHeader title="Sobre" />
          <Card>
            <Text style={styles.aboutText}>
              Fluxo é um MVP: finanças, notas e agenda em um só app, com uma IA que entende seu
              contexto financeiro. Contas e transações são dados de exemplo até você conectar seu banco.
            </Text>
          </Card>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.h1, color: colors.textPrimary, marginTop: spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rowLabel: { ...typography.bodyStrong, color: colors.textPrimary },
  label: { ...typography.bodyStrong, color: colors.textPrimary, marginBottom: spacing.xs },
  helper: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.md, lineHeight: 18 },
  input: {
    backgroundColor: colors.cardAlt,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  linkBtn: { justifyContent: 'center', paddingHorizontal: spacing.md },
  linkText: { ...typography.caption, color: colors.accent },
  aboutText: { ...typography.caption, color: colors.textSecondary, lineHeight: 20 },
});
