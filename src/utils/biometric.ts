/**
 * Rahnuma Sabre — biometric unlock
 *
 * Thin wrapper over expo-local-authentication. Every failure path returns false
 * instead of throwing (no sensor, nothing enrolled, denied, cancelled), so the
 * caller always falls back to the PIN flow it already had.
 */

import * as LocalAuthentication from 'expo-local-authentication';

export async function canUseBiometric(): Promise<boolean> {
  try {
    const [hasHardware, isEnrolled] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
    ]);
    return hasHardware && isEnrolled;
  } catch {
    return false;
  }
}

export async function authenticate(reason: string): Promise<boolean> {
  try {
    if (!(await canUseBiometric())) return false;
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: reason,
      cancelLabel: 'Use PIN',
      // The OS passcode is not this app's PIN, so never let it stand in for one.
      disableDeviceFallback: true,
    });
    return result.success === true;
  } catch {
    return false;
  }
}
