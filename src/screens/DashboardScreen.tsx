import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { getHoldings, getTotalIncomeByMonth, getExpenseTotalByMonth, getSetting, getAssets } from '../database/db';
import { Holding } from '../types';
import type { AssetRecord } from '../database/db';
import { calculateFIRE, formatPKR } from '../utils/calculators';
import { colors } from '../theme/colors';
import { spacing, radius } from '../theme/spacing';
import { typography } from '../theme/typography';
import { Card, Button, LoadingState } from '../components';
import { fonts } from '../utils/fonts';

export default function DashboardScreen() {
  const navigation = useNavigation<any>();
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [monthlyExpenses, setMonthlyExpenses] = useState(0);
  const [fireTarget, setFireTarget] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cash, setCash] = useState(0);
  const [property, setProperty] = useState(0);
  const [assets, setAssets] = useState<AssetRecord[]>([]);

  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const load = useCallback(async () => {
    const h = await getHoldings();
    setHoldings(h);
    // Income and expenses must cover the same month, or the savings rate and
    // the FIRE contribution are both wrong.
    const inc = await getTotalIncomeByMonth(month);
    setTotalIncome(inc);
    const exp = await getExpenseTotalByMonth(month);
    setMonthlyExpenses(exp);
    const ft = await getSetting('fire_target');
    setFireTarget(ft ? parseFloat(ft) : 0);
    const c = await getSetting('cash');
    setCash(c ? parseFloat(c) : 0);
    const p = await getSetting('property');
    setProperty(p ? parseFloat(p) : 0);
    // Imported non-cash rows (gold, property, funds) live in their own table;
    // without this read the import confirmation was true of no screen.
    const a = await getAssets();
    setAssets(a);
    setLoading(false);
  }, [month]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const portfolioValue = holdings.reduce((sum, h) => sum + (h.current_price ?? h.avg_buy_price) * h.quantity, 0);
  const portfolioCost = holdings.reduce((sum, h) => sum + h.avg_buy_price * h.quantity, 0);
  const portfolioGain = portfolioValue - portfolioCost;
  const portfolioGainPct = portfolioCost > 0 ? (portfolioGain / portfolioCost) * 100 : 0;
  const importedAssetsValue = assets.reduce((sum, a) => sum + (a.amount_pkr || 0), 0);
  const netWorth = portfolioValue + cash + property + importedAssetsValue;
  const savingsRate = totalIncome > 0 ? ((totalIncome - monthlyExpenses) / totalIncome) * 100 : 0;
  const currentSavings = totalIncome - monthlyExpenses;

  // Corpus counts everything the user actually owns, so FIRE progress reflects
  // real net worth instead of a value that was never populated.
  const currentCorpus = netWorth;
  // No expense data means no target: passing a placeholder here used to produce
  // a Rs 300 "FIRE Achieved!" verdict for a brand-new user.
  const fire = calculateFIRE(monthlyExpenses, currentCorpus, Math.max(currentSavings, 0), 10);
  const effectiveFireTarget = fireTarget > 0 ? fireTarget : fire.targetCorpus;
  // A target exists two ways: an explicit save in Settings, or auto-calculated
  // from monthly expenses. Honouring only the second hid a number the user
  // entered themselves, so either source is enough to show real math.
  const hasFireMath = fire.hasExpenseData || fireTarget > 0;
  const fireProgressPct = hasFireMath && effectiveFireTarget > 0
    ? Math.min((currentCorpus / effectiveFireTarget) * 100, 100)
    : 0;

  if (loading) {
    return (
      <View style={styles.container}>
        <LoadingState label="Loading dashboard..." />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
    >
      <Text style={styles.date}>{now.toLocaleDateString('en-PK', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>

      <View style={styles.entryRow}>
        <Button
          label="Morning briefing"
          onPress={() => navigation.navigate('Briefing')}
          variant="secondary"
          style={styles.entryBtn}
        />
        <Button
          label="Market outlook"
          onPress={() => navigation.navigate('Outlook')}
          variant="secondary"
          style={[styles.entryBtn, styles.entryBtnSpaced]}
        />
      </View>

      {/* Net Worth */}
      <Card>
        <Text style={typography.sectionTitle}>Net Worth</Text>
        <Text style={typography.headline}>{formatPKR(netWorth)}</Text>
        <View style={styles.row}>
          <Text style={typography.caption}>Stocks: {formatPKR(portfolioValue)}</Text>
          <Text style={typography.caption}>Cash: {formatPKR(cash)}</Text>
        </View>
        {property > 0 && <Text style={typography.caption}>Property: {formatPKR(property)}</Text>}
        {importedAssetsValue > 0 && (
          <Text style={typography.caption}>Other assets: {formatPKR(importedAssetsValue)}</Text>
        )}
      </Card>

      {/* Savings Rate */}
      <Card>
        <Text style={typography.sectionTitle}>Savings Rate This Month</Text>
        <Text style={[typography.headline, { color: savingsRate >= 20 ? colors.success : colors.warning }]}>
          {savingsRate.toFixed(1)}%
        </Text>
        <Text style={typography.caption}>
          This month: {formatPKR(totalIncome)} income, {formatPKR(monthlyExpenses)} spent
        </Text>
      </Card>

      {/* Portfolio Gain/Loss */}
      <Card>
        <Text style={typography.sectionTitle}>Portfolio Gain/Loss</Text>
        <Text style={[typography.headline, { color: portfolioGain >= 0 ? colors.success : colors.danger }]}>
          {portfolioGain >= 0 ? '+' : ''}{formatPKR(portfolioGain)}
        </Text>
        <Text style={[typography.bodyStrong, { color: portfolioGain >= 0 ? colors.success : colors.danger }]}>
          {portfolioGainPct >= 0 ? '+' : ''}{portfolioGainPct.toFixed(2)}%
        </Text>
      </Card>

      {/* FIRE Progress */}
      <Card>
        <Text style={typography.sectionTitle}>FIRE Progress</Text>
        {hasFireMath ? (
          <>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${fireProgressPct}%` }]} />
            </View>
            <Text style={typography.caption}>
              {formatPKR(currentCorpus)} / {formatPKR(effectiveFireTarget)}
            </Text>
            <Text style={typography.caption}>
              {fireProgressPct.toFixed(1)}% of target
            </Text>
            <Text style={typography.caption}>
              {!fire.hasExpenseData
                ? 'Add your monthly expenses to project years to FIRE'
                : fire.yearsToFire > 0
                  ? `${fire.yearsToFire} years to FIRE`
                  : fire.yearsToFire === 0
                    ? 'FIRE Achieved!'
                    : 'Cannot reach FIRE at current rate'}
            </Text>
          </>
        ) : (
          <Text style={typography.caption}>
            Add your monthly expenses in Settings to see your FIRE math
          </Text>
        )}
      </Card>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <Text style={[typography.bodyStrong, { color: colors.textSecondary, marginBottom: spacing.md }]}>Quick Links</Text>
        <Button label="Portfolio" onPress={() => navigation.navigate('Portfolio')} variant="secondary" style={styles.quickBtn} />
        <Button label="Budget" onPress={() => navigation.navigate('Budget')} variant="secondary" style={styles.quickBtn} />
        <Button label="Calculators" onPress={() => navigation.navigate('Calculators')} variant="secondary" style={styles.quickBtn} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  date: { color: colors.textMuted, fontSize: 14, marginBottom: spacing.lg, marginTop: spacing.sm, fontFamily: fonts.regular },
  entryRow: { flexDirection: 'row', marginBottom: spacing.lg },
  entryBtn: { flex: 1, paddingHorizontal: spacing.md },
  entryBtnSpaced: { marginLeft: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  progressBarBg: {
    backgroundColor: colors.border,
    borderRadius: radius.sm,
    height: 10,
    marginVertical: spacing.md,
    overflow: 'hidden',
  },
  progressBarFill: {
    backgroundColor: colors.accent,
    height: '100%',
    borderRadius: radius.sm,
  },
  quickActions: { marginTop: spacing.sm, marginBottom: spacing.xxl },
  quickBtn: {
    marginBottom: spacing.sm,
  },
});
