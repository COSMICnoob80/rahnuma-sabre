/**
 * Shared Chip component — selectable pill for category filters, tags, etc.
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors } from '../theme/colors';
import { spacing, radius } from '../theme/spacing';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  tone?: 'neutral' | 'danger';
  style?: StyleProp<ViewStyle>;
}

export function Chip({ label, selected, onPress, tone = 'neutral', style }: ChipProps) {
  const isDanger = tone === 'danger' && !selected;

  return (
    <TouchableOpacity
      style={[styles.chip, isDanger && styles.chipDanger, selected && styles.chipActive, style]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <Text
        style={[
          styles.text,
          isDanger && styles.textDanger,
          selected && styles.textActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    backgroundColor: colors.surfaceSunken,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    marginRight: spacing.sm,
  },
  chipDanger: {
    backgroundColor: colors.dangerSurface,
    borderColor: colors.dangerBorder,
  },
  chipActive: {
    backgroundColor: colors.accentTint,
    borderColor: colors.accentBorder,
  },
  text: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  textDanger: {
    color: colors.dangerInk,
  },
  textActive: {
    color: colors.accent,
    fontWeight: '600',
  },
});
