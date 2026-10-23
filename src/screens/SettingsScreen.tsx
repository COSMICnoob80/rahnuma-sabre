import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getSetting, setSetting } from '../database/db';
import { PROVIDERS, ProviderId } from '../services/providers';
import {
  getProviderKey, setProviderKey, getProviderModel, setProviderModel,
} from '../utils/secureStorage';
import { hasPin, setPin, removePin } from '../utils/pinLock';
import { exportAllData } from '../services/dataService';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { Card, Button, Input, Chip } from '../components';

type KeysState = Record<string, { input: string; saved: boolean }>;
type ModelsState = Record<string, string>;

export default function SettingsScreen() {
  const [cashAmount, setCashAmount] = useState('');
  const [propertyAmount, setPropertyAmount] = useState('');
  const [fireTargetAmount, setFireTargetAmount] = useState('');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [pin, setPinVal] = useState('');
  const [pinExists, setPinExists] = useState(false);
  const [keys, setKeys] = useState<KeysState>({});
  const [models, setModels] = useState<ModelsState>({});

  const load = useCallback(async () => {
    const c = await getSetting('cash');
    if (c) setCashAmount(c);
    const p = await getSetting('property');
    if (p) setPropertyAmount(p);
    const f = await getSetting('fire_target');
    if (f) setFireTargetAmount(f);
    const b = await getSetting('monthly_budget');
    if (b) setBudgetAmount(b);
    setPinExists(await hasPin());

    const nextKeys: KeysState = {};
    const nextModels: ModelsState = {};
    for (const provider of PROVIDERS) {
      const key = await getProviderKey(provider.id);
      nextKeys[provider.id] = { input: key ?? '', saved: !!key };
      nextModels[provider.id] = await getProviderModel(provider.id);
    }
    setKeys(nextKeys);
    setModels(nextModels);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const saveSetting = async (key: string, val: string, label: string) => {
    const n = parseFloat(val);
    if (isNaN(n) || n < 0) { Alert.alert(`Invalid ${label}`); return; }
    await setSetting(key, val);
    Alert.alert(`${label} saved!`);
  };

  const handlePinSetup = async () => {
    if (pin.length !== 4) { Alert.alert('Enter a 4-digit PIN'); return; }
    await setPin(pin);
    setPinExists(true);
    setPinVal('');
    Alert.alert('PIN set!');
  };

  const handleRemovePin = async () => {
    await removePin();
    setPinExists(false);
    Alert.alert('PIN removed');
  };

  const handleSaveKey = async (id: ProviderId) => {
    const value = keys[id]?.input?.trim() ?? '';
    if (!value) { Alert.alert('Enter an API key'); return; }
    await setProviderKey(id, value);
    setKeys((prev) => ({ ...prev, [id]: { input: value, saved: true } }));
    Alert.alert('API key saved securely');
  };

  const handleClearKey = async (id: ProviderId) => {
    await setProviderKey(id, '');
    setKeys((prev) => ({ ...prev, [id]: { input: '', saved: false } }));
  };

  const handleSelectModel = async (id: ProviderId, model: string) => {
    setModels((prev) => ({ ...prev, [id]: model }));
    await setProviderModel(id, model);
  };

  const saveButton = (label: string, onPress: () => void, danger = false) => (
    <Button
      label={label}
      onPress={onPress}
      variant={danger ? 'danger' : 'secondary'}
      size="sm"
      style={styles.rowButton}
    />
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card compact>
        <Text style={styles.sectionTitle}>AI Providers</Text>
        <Text style={styles.hint}>
          Add at least one key. The advisor tries them in order and falls back automatically, so a free-tier key is enough to run at zero cost.
        </Text>

        {PROVIDERS.map((provider) => (
          <View key={provider.id} style={styles.providerBlock}>
            <Text style={styles.label}>{provider.label}</Text>
            <Text style={styles.hint}>
              {provider.signupNote} — {keys[provider.id]?.saved ? 'key saved securely' : 'no key set'}
            </Text>
            <View style={styles.row}>
              <View style={styles.rowField}>
                <Input
                  style={styles.rowInput}
                  placeholder="Paste API key"
                  value={keys[provider.id]?.input ?? ''}
                  onChangeText={(text) =>
                    setKeys((prev) => ({
                      ...prev,
                      [provider.id]: { input: text, saved: prev[provider.id]?.saved ?? false },
                    }))
                  }
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>
              {saveButton('Save', () => handleSaveKey(provider.id))}
            </View>
            {keys[provider.id]?.saved && saveButton('Remove Key', () => handleClearKey(provider.id), true)}

            <View style={styles.modelRow}>
              {provider.models.map((m) => (
                <Chip
                  key={m.value}
                  label={m.label}
                  selected={models[provider.id] === m.value}
                  onPress={() => handleSelectModel(provider.id, m.value)}
                  style={styles.modelChip}
                />
              ))}
            </View>
          </View>
        ))}
      </Card>

      <Card compact>
        <Text style={styles.sectionTitle}>Financial Settings</Text>

        <Text style={styles.label}>Cash Balance (PKR)</Text>
        <View style={styles.row}>
          <View style={styles.rowField}>
            <Input
              style={styles.rowInput}
              placeholder="0"
              value={cashAmount}
              onChangeText={setCashAmount}
              keyboardType="decimal-pad"
            />
          </View>
          {saveButton('Save', () => saveSetting('cash', cashAmount, 'Cash'))}
        </View>

        <Text style={styles.label}>Property Value (PKR)</Text>
        <View style={styles.row}>
          <View style={styles.rowField}>
            <Input
              style={styles.rowInput}
              placeholder="0"
              value={propertyAmount}
              onChangeText={setPropertyAmount}
              keyboardType="decimal-pad"
            />
          </View>
          {saveButton('Save', () => saveSetting('property', propertyAmount, 'Property'))}
        </View>

        <Text style={styles.label}>FIRE Target (PKR)</Text>
        <Text style={styles.hint}>Leave empty to auto-calculate (monthly expenses × 300 at a 4% withdrawal rate)</Text>
        <View style={styles.row}>
          <View style={styles.rowField}>
            <Input
              style={styles.rowInput}
              placeholder="Auto-calculated"
              value={fireTargetAmount}
              onChangeText={setFireTargetAmount}
              keyboardType="decimal-pad"
            />
          </View>
          {saveButton('Save', () => saveSetting('fire_target', fireTargetAmount, 'FIRE Target'))}
        </View>

        <Text style={styles.label}>Monthly Budget (PKR)</Text>
        <View style={styles.row}>
          <View style={styles.rowField}>
            <Input
              style={styles.rowInput}
              placeholder="Set monthly budget"
              value={budgetAmount}
              onChangeText={setBudgetAmount}
              keyboardType="decimal-pad"
            />
          </View>
          {saveButton('Save', () => saveSetting('monthly_budget', budgetAmount, 'Budget'))}
        </View>
      </Card>

      <Card compact>
        <Text style={styles.sectionTitle}>App Lock</Text>
        {pinExists ? (
          <>
            <Text style={styles.hint}>PIN lock is active. Five wrong attempts trigger a 30-second lockout.</Text>
            <Input
              placeholder="New 4-digit PIN"
              value={pin}
              onChangeText={setPinVal}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={4}
            />
            <Button label="Change PIN" onPress={handlePinSetup} variant="secondary" style={styles.stackButton} />
            <Button label="Remove PIN" onPress={handleRemovePin} variant="danger" style={styles.stackButton} />
          </>
        ) : (
          <>
            <Text style={styles.hint}>Set a 4-digit PIN to lock the app</Text>
            <Input
              placeholder="Set 4-digit PIN"
              value={pin}
              onChangeText={setPinVal}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={4}
            />
            <Button label="Set PIN" onPress={handlePinSetup} style={styles.stackButton} />
          </>
        )}
      </Card>

      <Card compact>
        <Text style={styles.sectionTitle}>Data</Text>
        <Button label="Export All Data (JSON)" onPress={exportAllData} variant="secondary" />
      </Card>

      <Card compact>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.aboutText}>Rahnuma SABRE v1.0.0</Text>
        <Text style={styles.aboutText}>Package: com.rahnuma.sabre</Text>
        <Text style={styles.aboutText}>Offline-first financial advisor for Pakistan</Text>
        <Text style={styles.disclaimer}>
          Information only, not investment advice. Consult a SECP-registered advisor for decisions.
        </Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl + spacing.sm },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.1,
    marginBottom: spacing.md,
  },
  providerBlock: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    marginTop: spacing.md,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: spacing.xs,
    marginTop: spacing.xs,
  },
  hint: {
    color: colors.textSecondary,
    fontSize: 12,
    marginBottom: spacing.sm,
    lineHeight: 16,
  },
  row: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: spacing.sm },
  rowField: { flex: 1, marginRight: spacing.sm },
  rowInput: { marginBottom: 0 },
  rowButton: { marginBottom: 0 },
  modelRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.sm },
  modelChip: { marginBottom: spacing.sm },
  stackButton: { marginTop: spacing.sm },
  aboutText: { color: colors.textSecondary, fontSize: 13, marginBottom: spacing.xs },
  disclaimer: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 15,
    marginTop: spacing.md,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
