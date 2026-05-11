import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { getHoldings, getTotalIncome, getExpenseTotalByMonth, getSetting } from '../database/db';
import { Holding } from '../types';
import { calculateFIRE, formatPKR } from '../utils/calculators';

export default function DashboardScreen() {
  const navigation = useNavigation<any>();
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [monthlyExpenses, setMonthlyExpenses] = useState(0);
  const [fireTarget, setFireTarget] = useState(0);
  const [savings, setSavings] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [cash, setCash] = useState(0);
  const [property, setProperty] = useState(0);

  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const load = useCallback(async () => {
    const h = await getHoldings();
    setHoldings(h);
    const inc = await getTotalIncome();
    setTotalIncome(inc);
    const exp = await getExpenseTotalByMonth(month);
    setMonthlyExpenses(exp);
    const ft = await getSetting('fire_target');
    setFireTarget(ft ? parseFloat(ft) : 0);
    const c = await getSetting('cash');
    setCash(c ? parseFloat(c) : 0);
    const p = await getSetting('property');
    setProperty(p ? parseFloat(p) : 0);
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
  const netWorth = portfolioValue + cash + property;
  const savingsRate = totalIncome > 0 ? ((totalIncome - monthlyExpenses) / totalIncome) * 100 : 0;
  const currentSavings = totalIncome - monthlyExpenses;

  const fire = calculateFIRE(monthlyExpenses || 1, savings, Math.max(currentSavings, 0), 10);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
    >
      <Text style={styles.date}>{now.toLocaleDateString('en-PK', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>

      {/* Net Worth */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Net Worth</Text>
        <Text style={styles.mainValue}>{formatPKR(netWorth)}</Text>
        <View style={styles.row}>
          <Text style={styles.subItem}>Stocks: {formatPKR(portfolioValue)}</Text>
          <Text style={styles.subItem}>Cash: {formatPKR(cash)}</Text>
        </View>
        {property > 0 && <Text style={styles.subItem}>Property: {formatPKR(property)}</Text>}
      </View>

      {/* Savings Rate */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Savings Rate This Month</Text>
        <Text style={[styles.mainValue, { color: savingsRate >= 20 ? '#22c55e' : '#f59e0b' }]}>
          {savingsRate.toFixed(1)}%
        </Text>
        <Text style={styles.subItem}>
          Income: {formatPKR(totalIncome)} | Spent: {formatPKR(monthlyExpenses)}
        </Text>
      </View>

      {/* Portfolio Gain/Loss */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Portfolio Gain/Loss</Text>
        <Text style={[styles.mainValue, { color: portfolioGain >= 0 ? '#22c55e' : '#ef4444' }]}>
          {portfolioGain >= 0 ? '+' : ''}{formatPKR(portfolioGain)}
        </Text>
        <Text style={[styles.pctText, { color: portfolioGain >= 0 ? '#22c55e' : '#ef4444' }]}>
          {portfolioGainPct >= 0 ? '+' : ''}{portfolioGainPct.toFixed(2)}%
        </Text>
      </View>

      {/* FIRE Progress */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>FIRE Progress</Text>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${Math.min(fire.progressPct, 100)}%` }]} />
        </View>
        <Text style={styles.subItem}>
          {formatPKR(savings)} / {formatPKR(fire.targetCorpus)}
        </Text>
        <Text style={styles.subItem}>
          {fire.yearsToFire > 0 ? `${fire.yearsToFire} years to FIRE` : fire.yearsToFire === 0 ? '🎉 FIRE Achieved!' : 'Cannot reach FIRE at current rate'}
        </Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Links</Text>
        <TouchableOpacity style={styles.quickBtn} onPress={() => navigation.navigate('Portfolio')}>
          <Text style={styles.quickBtnText}>📊 Portfolio</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickBtn} onPress={() => navigation.navigate('Budget')}>
          <Text style={styles.quickBtnText}>💰 Budget</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickBtn} onPress={() => navigation.navigate('Calculators')}>
          <Text style={styles.quickBtnText}>🧮 Calculators</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a1628', padding: 16 },
  date: { color: '#64748b', fontSize: 14, marginBottom: 16, marginTop: 8 },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  cardTitle: { color: '#94a3b8', fontSize: 13, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  mainValue: { color: '#e2e8f0', fontSize: 32, fontWeight: '700' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  subItem: { color: '#94a3b8', fontSize: 13, marginTop: 4 },
  pctText: { fontSize: 16, fontWeight: '600', marginTop: 4 },
  progressBarBg: {
    backgroundColor: '#334155',
    borderRadius: 8,
    height: 10,
    marginVertical: 10,
    overflow: 'hidden',
  },
  progressBarFill: {
    backgroundColor: '#3b82f6',
    height: '100%',
    borderRadius: 8,
  },
  sectionTitle: { color: '#94a3b8', fontSize: 16, fontWeight: '600', marginBottom: 12 },
  quickActions: { marginTop: 8, marginBottom: 24 },
  quickBtn: {
    backgroundColor: '#1e293b',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  quickBtnText: { color: '#e2e8f0', fontSize: 15, fontWeight: '500' },
});
