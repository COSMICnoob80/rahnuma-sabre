/**
 * Shared Input component — styled TextInput with consistent theme.
 */

import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, StyleProp, TextStyle, TextInputProps } from 'react-native';
import { colors } from '../theme/colors';
import { spacing, radius } from '../theme/spacing';
import { fonts } from '../utils/fonts';

interface InputProps extends TextInputProps {
  label?: string;
  style?: StyleProp<TextStyle>;
}

export function Input({ label, style, onFocus, onBlur, ...props }: InputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[styles.input, focused && styles.inputFocused, style]}
        placeholderTextColor={colors.textMuted}
        selectionColor={colors.accent}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  label: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: fonts.bold,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: colors.surfaceSunken,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    fontSize: 15,
    fontFamily: fonts.regular,
  },
  inputFocused: {
    borderColor: colors.accent,
  },
});
