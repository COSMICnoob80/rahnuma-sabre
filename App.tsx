import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import PinLockScreen from './src/screens/PinLockScreen';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  const [unlocked, setUnlocked] = useState(false);

  if (!unlocked) {
    return (
      <>
        <StatusBar style="light" />
        <PinLockScreen onUnlock={() => setUnlocked(true)} />
      </>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <AppNavigator />
    </>
  );
}
