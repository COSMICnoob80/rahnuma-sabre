import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Platform } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import {
  getHoldings,
  getSetting,
  getTotalIncomeByMonth,
  getExpenseTotalByMonth,
} from '../database/db';
import { Holding } from '../types';
import { computeBriefing, BriefingInput } from '../utils/briefing';
import { enforceNoDirective } from '../services/personaService';
import { formatPKR } from '../utils/calculators';
import { colors } from '../theme/colors';
import { spacing, radius } from '../theme/spacing';
import { typography } from '../theme/typography';
import { Card, Button, Chip, LoadingState } from '../components';
import { fonts } from '../utils/fonts';

type BriefingOutput = ReturnType<typeof computeBriefing>;

const DEFAULT_PLANNED_SIP_PKR = 12_000;
const PLANNED_SIP_SETTING_KEY = 'monthly_sip';
const DEFAULT_ALERT_TEXT = 'KSE-100 · direction not predicted';
const CONTRACT_TEXT =
  'Information only · Not investment advice · Rahnuma will never tell you to buy or sell';
const MONO_FONT = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });

function monthKeyFor(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function previousMonthKey(date: Date): string {
  return monthKeyFor(new Date(date.getFullYear(), date.getMonth() - 1, 1));
}

// SQLite's datetime('now') has no timezone, so a bare timestamp is UTC.
function toIsoUtc(timestamp: string): string {
  const normalized = timestamp.includes('T') ? timestamp : `${timestamp.replace(' ', 'T')}Z`;
  const ms = Date.parse(normalized);
  return Number.isNaN(ms) ? timestamp : new Date(ms).toISOString();
}

function holdingValue(holding: Holding): number {
  return (holding.current_price ?? holding.avg_buy_price) * holding.quantity;
}

// The briefing tracks one recurring position: the ETF when the user holds one,
// otherwise the largest position on device.
function referenceHolding(holdings: Holding[]): Holding | null {
  if (holdings.length === 0) return null;
  const etf = holdings.find((h) => h.ticker.toUpperCase().includes('ETF'));
  if (etf) return etf;
  return holdings.reduce((largest, h) => (holdingValue(h) > holdingValue(largest) ? h : largest));
}

export default function BriefingScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [briefing, setBriefing] = useState<BriefingOutput | null>(null);
  const [reference, setReference] = useState<Holding | null>(null);
  const [plannedSipPKR, setPlannedSipPKR] = useState(DEFAULT_PLANNED_SIP_PKR);
  const [hasSavedSip, setHasSavedSip] = useState(false);
  const [lastBuildMonth, setLastBuildMonth] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const routeAlertText: string | undefined = route.params?.alertText;
  const alertCopy = enforceNoDirective(routeAlertText ?? DEFAULT_ALERT_TEXT).text;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const now = new Date();
      const month = monthKeyFor(now);
      const income = await getTotalIncomeByMonth(month);
      const expenses = await getExpenseTotalByMonth(month);
      const spareCapacityPKR = Math.max(income - expenses, 0);

      const holdings = await getHoldings();
      const ref = referenceHolding(holdings);

      const rawSip = await getSetting(PLANNED_SIP_SETTING_KEY);
      const parsedSip = rawSip ? parseFloat(rawSip) : NaN;
      const savedSip = Number.isFinite(parsedSip) && parsedSip > 0;
      const planned = savedSip ? parsedSip : DEFAULT_PLANNED_SIP_PKR;

      const quote: BriefingInput['quote'] =
        ref && ref.current_price !== null && ref.last_fetched
          ? {
              pricePKR: ref.current_price,
              fetchedAtIsoUtc: toIsoUtc(ref.last_fetched),
              source: 'PSX quote (Yahoo .KAR)',
            }
          : null;

      // No per-purchase ledger exists on device yet, so the only units we can
      // state are the recorded acquisition for the reference holding.
      const unitsHistory: BriefingInput['unitsHistory'] = ref?.purchase_date
        ? [{ monthKey: ref.purchase_date.slice(0, 7), units: ref.quantity }]
        : [];

      setBriefing(
        computeBriefing({ plannedSipPKR: planned, spareCapacityPKR, quote, unitsHistory })
      );
      setReference(ref);
      setPlannedSipPKR(planned);
      setHasSavedSip(savedSip);
      setLastBuildMonth(unitsHistory.length > 0 ? unitsHistory[unitsHistory.length - 1].monthKey : null);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const isLastMonth = lastBuildMonth === previousMonthKey(new Date());
  const lastBuildLabel = isLastMonth ? 'Last month' : `Last build · ${lastBuildMonth}`;
  const freshnessLabel =
    briefing?.freshnessLabel ?? (reference ? 'No timestamped quote' : 'No quote on device');
  const unitsToday = briefing?.unitsToday ?? null;
  const unitsLastMonth = briefing?.unitsLastMonth ?? null;
  const streakMonths = briefing?.streakMonths ?? 0;

  return (
    <View style={styles.screen}>
      {loading ? (
        <View style={styles.centered}>
          <LoadingState label="Assembling your briefing..." />
        </View>
      ) : briefing === null ? (
        <View style={styles.centered}>
          <Text style={styles.unavailable}>
            Briefing unavailable. Your portfolio and budget still work offline.
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          {/* 1. Alert bar — the only red-tinted surface on the screen. */}
          <View style={styles.alertBar}>
            <Text style={styles.alertText}>{alertCopy}</Text>
            <View style={styles.quoteRow}>
              <View style={styles.quoteBlock}>
                <Text style={styles.quoteTicker}>
                  {reference ? reference.ticker.toUpperCase() : 'NO QUOTE ON DEVICE'}
                </Text>
                <Text style={styles.quotePrice}>
                  {briefing.pricePKR === null ? '—' : formatPKR(briefing.pricePKR)}
                </Text>
              </View>
              <Chip label={freshnessLabel} />
            </View>
          </View>

          {/* 2. Plan, restated — facts from the user's own ledger. */}
          <Card>
            <Text style={typography.sectionTitle}>Your plan, restated</Text>
            <View style={styles.statRow}>
              <Text style={typography.caption}>SIP due this month</Text>
              <Text style={styles.statValue}>{formatPKR(plannedSipPKR)}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={typography.caption}>Spare capacity</Text>
              <Text style={styles.statValue}>{formatPKR(briefing.affordablePKR)}</Text>
            </View>
            {!hasSavedSip && (
              <Text style={styles.hint}>Default amount · edit in Budget</Text>
            )}
            <View style={styles.statusRow}>
              {briefing.planIntact ? (
                <>
                  <Text style={[styles.check, { color: colors.success }]}>✓</Text>
                  <Text style={[typography.bodyStrong, { color: colors.success }]}>
                    Plan is intact. Affordable.
                  </Text>
                </>
              ) : (
                <Text style={[typography.bodyStrong, { color: colors.warning }]}>
                  Short of the plan amount this month.
                </Text>
              )}
            </View>
          </Card>

          {/* 3. Mechanics, not prediction. */}
          <Card>
            <Text style={typography.sectionTitle}>
              What a fixed amount does in a falling market
            </Text>
            {unitsLastMonth !== null && (
              <View style={styles.mechRow}>
                <Text style={typography.caption}>{lastBuildLabel}</Text>
                <Text style={styles.mono}>{unitsLastMonth.toFixed(2)} units</Text>
              </View>
            )}
            <View style={styles.mechRow}>
              <Text style={typography.caption}>Today at quote</Text>
              <Text style={styles.mono}>
                {unitsToday === null ? '—' : `${unitsToday.toFixed(2)} units`}
              </Text>
            </View>
            <Text style={styles.caption}>
              Same rupees, more units — by definition. No forecast stated.
            </Text>
          </Card>

          {/* 4. Streak — evidence of what the user already does. */}
          <Card>
            <Text style={typography.sectionTitle}>Your streak</Text>
            {streakMonths > 0 && (
              <View style={styles.dotsRow}>
                {Array.from({ length: Math.min(streakMonths, 12) }).map((_, index) => (
                  <View key={index} style={styles.dot} />
                ))}
              </View>
            )}
            <Text style={styles.caption}>{streakMonths} monthly builds · no skips</Text>
          </Card>
        </ScrollView>
      )}

      {/* 5. Pinned contract bar — permanent, outside the scroll view. */}
      <View style={styles.contractBar}>
        <Text style={styles.contractText}>{CONTRACT_TEXT}</Text>
        <Button
          label="Close briefing"
          onPress={() => navigation.goBack()}
          variant="secondary"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  centered: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.xl },
  unavailable: { ...typography.caption, textAlign: 'center' },

  alertBar: {
    backgroundColor: colors.danger,
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginBottom: spacing.md,
  },
  alertText: { color: colors.white, fontSize: 17, fontFamily: fonts.bold, lineHeight: 23 },
  quoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  quoteBlock: { flex: 1, marginRight: spacing.sm },
  quoteTicker: {
    color: colors.white,
    fontSize: 12,
    fontFamily: fonts.bold,
    letterSpacing: 1,
  },
  quotePrice: { color: colors.white, fontSize: 26, fontFamily: fonts.bold, marginTop: 2 },

  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: spacing.md,
  },
  statValue: { color: colors.textPrimary, fontSize: 18, fontFamily: fonts.bold },
  hint: { ...typography.small, marginTop: spacing.sm },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.lg },
  check: { fontSize: 15, fontFamily: fonts.bold, marginRight: spacing.sm },

  mechRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  mono: { fontFamily: MONO_FONT, fontSize: 15, color: colors.textPrimary },
  caption: { ...typography.small, marginTop: spacing.md, lineHeight: 16 },

  dotsRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.md },
  dot: {
    width: 10,
    height: 10,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },

  contractBar: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  contractText: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    marginBottom: spacing.md,
    fontFamily: fonts.regular,
  },
});
