/**
 * Fee transparency screen — the brutal-simple grid.
 *
 * Identity, cost, source: one row each, no brochure and no verdict. The pro
 * rows exist because their prices are public, not because this app prefers
 * them; the footer is the never-advice law line.
 */

import React from 'react';
import { View, Text, ScrollView, StyleSheet, Platform } from 'react-native';
import {
  COST_HEADER,
  COST_SUBHEAD,
  COST_FOOTER,
  FEE_ROWS,
} from '../data/feeGrid';
import { colors } from '../theme/colors';
import { spacing, radius } from '../theme/spacing';
import { typography } from '../theme/typography';
import { Card } from '../components';
import { fonts } from '../utils/fonts';

const MONO_FONT = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });

export default function CostScreen() {
  return (
    <View style={styles.screen}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.head}>
          <Text style={styles.headTitle}>{COST_HEADER}</Text>
          <View style={styles.dateChip}>
            <Text style={styles.dateText}>DATED 2026-11-04</Text>
          </View>
        </View>
        <Text style={styles.subhead}>{COST_SUBHEAD}</Text>

        {FEE_ROWS.map((row) => (
          <Card
            key={row.id}
            compact
            variant={row.id === 'rahnuma' ? 'accent' : 'default'}
            style={styles.row}
          >
            <View style={styles.rowHead}>
              <Text style={styles.rowLabel}>{row.label}</Text>
              {row.reported ? (
                <View style={styles.reportedTag}>
                  <Text style={styles.reportedText}>REPORTED</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.rowPrice}>{row.price}</Text>
            {row.converted ? <Text style={styles.rowConverted}>{row.converted}</Text> : null}
            <Text style={styles.rowNote}>{row.note}</Text>
            {row.source ? <Text style={styles.rowSource}>{row.source}</Text> : null}
          </Card>
        ))}

        <Text style={styles.footnote}>{COST_FOOTER}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },

  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  headTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontFamily: fonts.bold,
    letterSpacing: 1.8,
  },
  dateChip: {
    backgroundColor: colors.surfaceSunken,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  dateText: {
    color: colors.textMuted,
    fontFamily: MONO_FONT,
    fontSize: 9.5,
    letterSpacing: 0.8,
  },
  subhead: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: fonts.regular,
    marginBottom: spacing.lg,
  },

  row: { paddingVertical: spacing.lg },
  rowHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  rowLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontFamily: fonts.bold,
    letterSpacing: 1,
    textTransform: 'uppercase',
    flex: 1,
    marginRight: spacing.sm,
  },
  reportedTag: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceSunken,
    borderRadius: radius.full,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  reportedText: {
    color: colors.textMuted,
    fontFamily: MONO_FONT,
    fontSize: 9,
    letterSpacing: 0.8,
  },
  rowPrice: {
    color: colors.textPrimary,
    fontSize: 22,
    fontFamily: fonts.bold,
  },
  rowConverted: {
    color: colors.accent,
    fontFamily: MONO_FONT,
    fontSize: 13,
    marginTop: 2,
  },
  rowNote: {
    color: colors.textSecondary,
    fontSize: 12.5,
    lineHeight: 18,
    fontFamily: fonts.regular,
    marginTop: spacing.sm,
  },
  rowSource: {
    color: colors.textMuted,
    fontSize: 10.5,
    lineHeight: 15,
    fontFamily: fonts.regular,
    marginTop: spacing.xs,
  },

  footnote: {
    color: colors.textMuted,
    fontSize: 10.5,
    lineHeight: 16,
    marginTop: spacing.lg,
    textAlign: 'center',
    fontFamily: fonts.regular,
  },
});
