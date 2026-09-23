import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert
} from 'react-native';
import { hasPin, setPin, verifyPin, lockoutRemainingMs, attemptsLeft } from '../utils/pinLock';

export default function PinLockScreen({ onUnlock }: { onUnlock: () => void }) {
  const [mode, setMode] = useState<'create' | 'enter'>('enter');
  const [pin, setPinVal] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    (async () => {
      const exists = await hasPin();
      if (!exists) setMode('create');
    })();
  }, []);

  const handleEnter = async () => {
    if (pin.length !== 4) {
      setMessage('Enter a 4-digit PIN');
      return;
    }

    const result = await verifyPin(pin);
    if (result === 'ok' || result === 'no_pin') {
      onUnlock();
      return;
    }

    setPinVal('');
    if (result === 'locked') {
      const remaining = Math.ceil((await lockoutRemainingMs()) / 1000);
      setMessage(`Too many attempts. Try again in ${remaining}s.`);
      return;
    }

    const left = await attemptsLeft();
    setMessage(left > 0 ? `Wrong PIN. ${left} attempt${left === 1 ? '' : 's'} left.` : 'Wrong PIN.');
  };

  const handleCreate = async () => {
    if (pin.length !== 4) {
      setMessage('Enter a 4-digit PIN');
      return;
    }
    if (pin !== confirmPin) {
      setMessage('PINs do not match');
      return;
    }
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
            onChangeText={(v) => { setPinVal(v); setMessage(''); }}
          />
          {!!message && <Text style={styles.message}>{message}</Text>}
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
            onChangeText={(v) => { setPinVal(v); setMessage(''); }}
            placeholder="Enter PIN"
            placeholderTextColor="#64748b"
          />
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={4}
            value={confirmPin}
            onChangeText={(v) => { setConfirmPin(v); setMessage(''); }}
            placeholder="Confirm PIN"
            placeholderTextColor="#64748b"
          />
          {!!message && <Text style={styles.message}>{message}</Text>}
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
  message: { color: '#f59e0b', fontSize: 14, marginBottom: 16, textAlign: 'center' },
  button: {
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 12,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
