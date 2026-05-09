import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image
} from 'react-native';
import { hasPin, setPin, verifyPin } from '../database/db';

export default function PinLockScreen({ onUnlock }: { onUnlock: () => void }) {
  const [mode, setMode] = useState<'create' | 'enter'>('enter');
  const [pin, setPinVal] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  useEffect(() => {
    (async () => {
      const exists = await hasPin();
      if (!exists) setMode('create');
    })();
  }, []);

  const handleEnter = async () => {
    if (pin.length !== 4) { Alert.alert('Enter 4-digit PIN'); return; }
    const ok = await verifyPin(pin);
    if (ok) onUnlock();
    else { Alert.alert('Wrong PIN'); setPinVal(''); }
  };

  const handleCreate = async () => {
    if (pin.length !== 4) { Alert.alert('Enter 4-digit PIN'); return; }
    if (pin !== confirmPin) { Alert.alert('PINs do not match'); return; }
    await setPin(pin);
    onUnlock();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>🔐 Rahnuma</Text>
      <Text style={styles.subtitle}>SABRE</Text>
      {mode === 'enter' ? (
        <>
          <Text style={styles.label}>Enter PIN</Text>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={4}
            value={pin}
            onChangeText={setPinVal}
          />
          <TouchableOpacity style={styles.button} onPress={handleEnter}>
            <Text style={styles.buttonText}>Unlock</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.label}>Create 4-digit PIN</Text>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={4}
            value={pin}
            onChangeText={setPinVal}
            placeholder="Enter PIN"
          />
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={4}
            value={confirmPin}
            onChangeText={setConfirmPin}
            placeholder="Confirm PIN"
          />
          <TouchableOpacity style={styles.button} onPress={handleCreate}>
            <Text style={styles.buttonText}>Set PIN</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a1628',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  logo: { fontSize: 36, fontWeight: '700', color: '#e2e8f0', marginBottom: 4 },
  subtitle: { fontSize: 18, color: '#94a3b8', marginBottom: 48, letterSpacing: 6 },
  label: { fontSize: 16, color: '#94a3b8', marginBottom: 12 },
  input: {
    backgroundColor: '#1e293b',
    color: '#e2e8f0',
    fontSize: 28,
    padding: 16,
    borderRadius: 12,
    width: 180,
    textAlign: 'center',
    letterSpacing: 12,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 12,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
