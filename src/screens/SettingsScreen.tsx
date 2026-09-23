import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getSetting, setSetting } from '../database/db';
import { formatPKR } from '../utils/calculators';
import { PROVIDERS, ProviderId } from '../services/providers';
import {
  getProviderKey, setProviderKey, getProviderModel, setProviderModel,
} from '../utils/secureStorage';
import { hasPin, setPin, removePin } from '../utils/pinLock';
import { exportAllData } from '../services/dataService';

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
    <TouchableOpacity style={[styles.saveBtn, danger && styles.dangerBtn]} onPress={onPress}>
      <Text style={styles.saveBtnText}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
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
              <TextInput
                style={[styles.input, { flex: 1, marginRight: 8 }]}
                placeholder="Paste API key"
                placeholderTextColor="#64748b"
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
              {saveButton('Save', () => handleSaveKey(provider.id))}
            </View>
            {keys[provider.id]?.saved && saveButton('Remove Key', () => handleClearKey(provider.id), true)}

            {provider.models.map((m) => (
              <TouchableOpacity
                key={m.value}
                style={[styles.modelOption, models[provider.id] === m.value && styles.modelOptionActive]}
                onPress={() => handleSelectModel(provider.id, m.value)}
              >
                <Text
                  style={[
                    styles.modelOptionText,
                    models[provider.id] === m.value && styles.modelOptionTextActive,
                  ]}
                >
                  {m.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Financial Settings</Text>

        <Text style={styles.label}>Cash Balance (PKR)</Text>
        <View style={styles.row}>
          <TextInput
            style={[styles.input, { flex: 1, marginRight: 8 }]}
            placeholder="0"
            placeholderTextColor="#64748b"
            value={cashAmount}
            onChangeText={setCashAmount}
            keyboardType="decimal-pad"
          />
          {saveButton('Save', () => saveSetting('cash', cashAmount, 'Cash'))}
        </View>

        <Text style={styles.label}>Property Value (PKR)</Text>
        <View style={styles.row}>
          <TextInput
            style={[styles.input, { flex: 1, marginRight: 8 }]}
            placeholder="0"
            placeholderTextColor="#64748b"
            value={propertyAmount}
            onChangeText={setPropertyAmount}
            keyboardType="decimal-pad"
          />
          {saveButton('Save', () => saveSetting('property', propertyAmount, 'Property'))}
        </View>

        <Text style={styles.label}>FIRE Target (PKR)</Text>
        <Text style={styles.hint}>Leave empty to auto-calculate (monthly expenses × 300 at a 4% withdrawal rate)</Text>
        <View style={styles.row}>
          <TextInput
            style={[styles.input, { flex: 1, marginRight: 8 }]}
            placeholder="Auto-calculated"
            placeholderTextColor="#64748b"
            value={fireTargetAmount}
            onChangeText={setFireTargetAmount}
            keyboardType="decimal-pad"
          />
          {saveButton('Save', () => saveSetting('fire_target', fireTargetAmount, 'FIRE Target'))}
        </View>

        <Text style={styles.label}>Monthly Budget (PKR)</Text>
        <View style={styles.row}>
          <TextInput
            style={[styles.input, { flex: 1, marginRight: 8 }]}
            placeholder="Set monthly budget"
            placeholderTextColor="#64748b"
            value={budgetAmount}
            onChangeText={setBudgetAmount}
            keyboardType="decimal-pad"
          />
          {saveButton('Save', () => saveSetting('monthly_budget', budgetAmount, 'Budget'))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Lock</Text>
        {pinExists ? (
          <>
            <Text style={styles.hint}>PIN lock is active. Five wrong attempts trigger a 30-second lockout.</Text>
            <TextInput
              style={styles.input}
              placeholder="New 4-digit PIN"
              placeholderTextColor="#64748b"
              value={pin}
              onChangeText={setPinVal}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={4}
            />
            <View style={{ height: 8 }} />
            {saveButton('Change PIN', handlePinSetup)}
            <View style={{ height: 8 }} />
            {saveButton('Remove PIN', handleRemovePin, true)}
          </>
        ) : (
          <>
            <Text style={styles.hint}>Set a 4-digit PIN to lock the app</Text>
            <TextInput
              style={styles.input}
              placeholder="Set 4-digit PIN"
              placeholderTextColor="#64748b"
              value={pin}
              onChangeText={setPinVal}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={4}
            />
            <View style={{ height: 8 }} />
            {saveButton('Set PIN', handlePinSetup)}
          </>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data</Text>
        <TouchableOpacity style={styles.saveBtn} onPress={exportAllData}>
          <Text style={styles.saveBtnText}>Export All Data (JSON)</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.aboutText}>Rahnuma SABRE v1.0.0</Text>
        <Text style={styles.aboutText}>Package: com.rahnuma.sabre</Text>
        <Text style={styles.aboutText}>Offline-first financial advisor for Pakistan</Text>
        <Text style={styles.disclaimer}>
          Information only, not investment advice. Consult a SECP-registered advisor for decisions.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a1628', padding: 16 },
  section: { backgroundColor: '#1e293b', borderRadius: 16, padding: 20, marginBottom: 12 },
  sectionTitle: { color: '#94a3b8', fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  providerBlock: { borderTopWidth: 1, borderTopColor: '#334155', paddingTop: 12, marginTop: 12 },
  label: { color: '#cbd5e1', fontSize: 14, marginBottom: 4, marginTop: 4 },
  hint: { color: '#64748b', fontSize: 12, marginBottom: 8, lineHeight: 16 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  input: { backgroundColor: '#334155', color: '#e2e8f0', borderRadius: 10, padding: 12, fontSize: 15 },
  saveBtn: { backgroundColor: '#3b82f6', padding: 12, borderRadius: 10, alignItems: 'center' },
  dangerBtn: { backgroundColor: '#ef4444', marginTop: 8 },
  saveBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  modelOption: { backgroundColor: '#334155', padding: 12, borderRadius: 10, marginBottom: 6 },
  modelOptionActive: { backgroundColor: '#3b82f6' },
  modelOptionText: { color: '#94a3b8', fontSize: 14 },
  modelOptionTextActive: { color: '#fff', fontWeight: '600' },
  aboutText: { color: '#94a3b8', fontSize: 13, marginBottom: 4 },
  disclaimer: { color: '#475569', fontSize: 11, marginTop: 12, textAlign: 'center', fontStyle: 'italic' },
});
