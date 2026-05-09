import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getSetting, setSetting, hasPin, setPin } from '../database/db';
import { formatPKR } from '../utils/calculators';

export default function SettingsScreen() {
  const [cashAmount, setCashAmount] = useState('');
  const [propertyAmount, setPropertyAmount] = useState('');
  const [fireTargetAmount, setFireTargetAmount] = useState('');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [pin, setPinVal] = useState('');
  const [pinExists, setPinExists] = useState(false);

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
    await setSetting('pin_hash', '');
    setPinExists(false);
    Alert.alert('PIN removed');
  };

  return (
    <ScrollView style={styles.container}>
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
          <TouchableOpacity style={styles.saveBtn} onPress={() => saveSetting('cash', cashAmount, 'Cash')}>
            <Text style={styles.saveBtnText}>Save</Text>
          </TouchableOpacity>
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
          <TouchableOpacity style={styles.saveBtn} onPress={() => saveSetting('property', propertyAmount, 'Property')}>
            <Text style={styles.saveBtnText}>Save</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>FIRE Target (PKR)</Text>
        <Text style={styles.hint}>Leave empty to use default (monthly expenses × 300)</Text>
        <View style={styles.row}>
          <TextInput
            style={[styles.input, { flex: 1, marginRight: 8 }]}
            placeholder="Auto-calculated"
            placeholderTextColor="#64748b"
            value={fireTargetAmount}
            onChangeText={setFireTargetAmount}
            keyboardType="decimal-pad"
          />
          <TouchableOpacity style={styles.saveBtn} onPress={() => saveSetting('fire_target', fireTargetAmount, 'FIRE Target')}>
            <Text style={styles.saveBtnText}>Save</Text>
          </TouchableOpacity>
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
          <TouchableOpacity style={styles.saveBtn} onPress={() => saveSetting('monthly_budget', budgetAmount, 'Budget')}>
            <Text style={styles.saveBtnText}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Lock</Text>
        {pinExists ? (
          <>
            <Text style={styles.hint}>PIN lock is active</Text>
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
            <TouchableOpacity style={styles.saveBtn} onPress={handlePinSetup}>
              <Text style={styles.saveBtnText}>Change PIN</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: '#ef4444', marginTop: 8 }]} onPress={handleRemovePin}>
              <Text style={styles.saveBtnText}>Remove PIN</Text>
            </TouchableOpacity>
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
            <TouchableOpacity style={styles.saveBtn} onPress={handlePinSetup}>
              <Text style={styles.saveBtnText}>Set PIN</Text>
            </TouchableOpacity>
          </>
        )}
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
  label: { color: '#cbd5e1', fontSize: 14, marginBottom: 4, marginTop: 4 },
  hint: { color: '#64748b', fontSize: 12, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  input: { backgroundColor: '#334155', color: '#e2e8f0', borderRadius: 10, padding: 12, fontSize: 15 },
  saveBtn: { backgroundColor: '#3b82f6', padding: 12, borderRadius: 10, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  aboutText: { color: '#94a3b8', fontSize: 13, marginBottom: 4 },
  disclaimer: { color: '#475569', fontSize: 11, marginTop: 12, textAlign: 'center', fontStyle: 'italic' },
});
