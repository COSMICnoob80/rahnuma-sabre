import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { hasPin, setPin, verifyPin, lockoutRemainingMs, attemptsLeft } from '../utils/pinLock';
import { colors } from '../theme/colors';
import { spacing, radius } from '../theme/spacing';
import { Card, Button, Input } from '../components';

const MONO_FONT = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });

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
      {Platform.OS === 'web' && (
        <View style={styles.webBanner}>
          <Text style={styles.webBannerText}>
            Web preview mode — data lives in this browser tab's storage only. Not your phone, not production.
          </Text>
        </View>
      )}

      <View style={styles.hero}>
        <Text style={styles.brand}>RAHNUMA</Text>
        <Text style={styles.wordmark}>SABRE</Text>
        <View style={styles.heroRule} />
      </View>

      <Card style={styles.panel}>
        {mode === 'enter' ? (
          <>
            <Text style={styles.label}>Enter PIN</Text>
            <Input
              style={styles.pinInput}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={4}
              value={pin}
              onChangeText={(v) => { setPinVal(v); setMessage(''); }}
            />
            {!!message && <Text style={styles.message}>{message}</Text>}
            <Button label="Unlock" onPress={handleEnter} style={styles.button} />
          </>
        ) : (
          <>
            <Text style={styles.label}>Create 4-digit PIN</Text>
            <Input
              style={styles.pinInput}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={4}
              value={pin}
              onChangeText={(v) => { setPinVal(v); setMessage(''); }}
              placeholder="Enter PIN"
            />
            <Input
              style={styles.pinInput}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={4}
              value={confirmPin}
              onChangeText={(v) => { setConfirmPin(v); setMessage(''); }}
              placeholder="Confirm PIN"
            />
            {!!message && <Text style={styles.message}>{message}</Text>}
            <Button label="Set PIN" onPress={handleCreate} style={styles.button} />
          </>
        )}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  hero: { alignItems: 'center', marginBottom: spacing.xxl + spacing.md },
  webBanner: {
    width: '100%',
    maxWidth: 420,
    borderWidth: 1,
    borderColor: colors.warning,
    backgroundColor: colors.warningTint,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  webBannerText: {
    color: colors.warning,
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
  },
  brand: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 4,
  },
  wordmark: {
    color: colors.textPrimary,
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: 8,
    marginTop: spacing.sm,
  },
  heroRule: {
    width: 32,
    height: 2,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
    marginTop: spacing.md,
  },
  panel: {
    width: '100%',
    marginBottom: 0,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  pinInput: {
    width: '100%',
    fontFamily: MONO_FONT,
    fontSize: 26,
    textAlign: 'center',
    letterSpacing: 12,
    paddingVertical: spacing.md,
  },
  message: {
    color: colors.warning,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  button: { marginTop: spacing.md },
});
