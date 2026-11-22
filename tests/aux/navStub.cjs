// Stub for @react-navigation/native used by the screen render harness.
// The real module needs a NavigationContainer; screens only need the two hooks.

function useNavigation() {
  return { navigate() {}, goBack() {}, setOptions() {} };
}

function useFocusEffect(effect) {
  const React = require('react');
  React.useEffect(effect, [effect]);
}

function useIsFocused() {
  return true;
}

module.exports = { useNavigation, useFocusEffect, useIsFocused };
