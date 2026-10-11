/**
 * Shared Card component — replaces the 5+ inline card styles across screens.
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../theme/colors';
import { spacing, radius } from '../theme/spacing';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  /** Use a tighter padding for dense lists */
  compact?: boolean;
}

export function Card({ children, style, compact }: CardProps) {
  return (
    <View style={[styles.card, compact && styles.compact, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginBottom: spacing.md,
  },
  compact: {
    padding: spacing.lg,
  },
});
