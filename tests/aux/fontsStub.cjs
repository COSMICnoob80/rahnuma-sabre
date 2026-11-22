// Stub for @expo-google-fonts/inter used by the screen render harness.
// The screen only reads the exported font-name tokens; loading is skipped.

const Inter_400Regular = { fontFamily: 'Inter_400Regular' };
const Inter_700Bold = { fontFamily: 'Inter_700Bold' };

function useFonts() {
  return [true, null];
}

module.exports = { Inter_400Regular, Inter_700Bold, useFonts };
