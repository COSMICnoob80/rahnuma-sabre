/**
 * Shared Card component — replaces the 5+ inline card styles across screens.
 */

import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors } from '../theme/colors';
import { spacing, radius } from '../theme/spacing';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Use a tighter padding for dense lists */
  compact?: boolean;
  /** Surface tint from the design artifacts */
  variant?: 'default' | 'sunken' | 'accent' | 'danger';
}

export function Card({ children, style, compact, variant = 'default' }: CardProps) {
  return (
    <View
      style={[
        styles.card,
        variant === 'sunken' && styles.sunken,
        variant === 'accent' && styles.accent,
        variant === 'danger' && styles.danger,
        compact && styles.compact,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginBottom: spacing.md,
  },
  sunken: {
    backgroundColor: colors.surfaceSunken,
  },
  accent: {
    backgroundColor: colors.accentTint,
    borderColor: colors.accentBorder,
  },
  danger: {
    backgroundColor: colors.dangerSurface,
    borderColor: colors.dangerBorder,
  },
  compact: {
    padding: spacing.lg,
  },
});
