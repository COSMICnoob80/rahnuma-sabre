import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, RefreshControl
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getHoldings, addHolding, deleteHolding } from '../database/db';
import { Holding, HoldingWithGain } from '../types';
import { formatPKR } from '../utils/calculators';

const SECTOR_MAP: Record<string, string> = {
  LUCK: 'Cement', OGDC: 'OGMC', HBL: 'Bank', MEBL: 'Bank', UBL: 'Bank',
  PPL: 'OGMC', POL: 'OGMC', ENGRO: 'Fertilizer', FFC: 'Fertilizer',
  SYS: 'Tech', TRG: 'Tech', NESTLE: 'Food', KOHC: 'Chemical',
  INDU: 'Auto', PSMC: 'Auto', HUBC: 'Power', KAPCO: 'Power',
  MCB: 'Bank', BAFL: 'Bank', AKBL: 'Bank', FATIMA: 'Fertilizer',
  MARI: 'OGMC', SEARL: 'Pharma', COLG: 'Pharma', HASCOL: 'OGMC',
  PSO: 'OGMC', SHEL: 'OGMC', EFERT: 'Fertilizer',
};

function getSector(ticker: string): string {
  return SECTOR_MAP[ticker.toUpperCase()] || 'Other';
}

export default function PortfolioScreen() {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [ticker, setTicker] = useState('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(async () => {
    setHoldings(await getHoldings());
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleAdd = async () => {
    if (!ticker || !quantity || !price) {
      Alert.alert('Please fill all fields');
      return;
    }
    const q = parseFloat(quantity);
    const p = parseFloat(price);
    if (isNaN(q) || isNaN(p) || q <= 0 || p <= 0) {
      Alert.alert('Invalid values');
      return;
    }
    await addHolding({ ticker: ticker.toUpperCase(), quantity: q, avg_buy_price: p, current_price: null, last_fetched: null });
    setTicker('');
    setQuantity('');
    setPrice('');
    setShowAdd(false);
    await load();
  };

  const handleDelete = (id: number) => {
    Alert.alert('Delete holding', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteHolding(id); await load(); } },
    ]);
  };

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const totalValue = holdings.reduce((s, h) => s + (h.current_price ?? h.avg_buy_price) * h.quantity, 0);
  const totalCost = holdings.reduce((s, h) => s + h.avg_buy_price * h.quantity, 0);
  const totalGain = totalValue - totalCost;
  const totalGainPct = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

  // Pie data by sector
  const sectorData: Record<string, number> = {};
  holdings.forEach(h => {
    const sec = getSector(h.ticker);
    sectorData[sec] = (sectorData[sec] || 0) + (h.current_price ?? h.avg_buy_price) * h.quantity;
  });
  const sectorColors = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1'];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
    >
      {/* Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Portfolio Value</Text>
        <Text style={styles.summaryValue}>{formatPKR(totalValue)}</Text>
        <Text style={[styles.gainText, { color: totalGain >= 0 ? '#22c55e' : '#ef4444' }]}>
          {totalGain >= 0 ? '+' : ''}{formatPKR(totalGain)} ({totalGainPct.toFixed(2)}%)
        </Text>
      </View>

      {/* Pie Chart (simple sector bars) */}
      {holdings.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Allocation by Sector</Text>
          {Object.entries(sectorData).map(([sector, val], i) => {
            const pct = (val / totalValue) * 100;
            return (
              <View key={sector} style={styles.sectorRow}>
                <View style={[styles.sectorDot, { backgroundColor: sectorColors[i % sectorColors.length] }]} />
                <Text style={styles.sectorName}>{sector}</Text>
                <View style={styles.sectorBarBg}>
                  <View style={[styles.sectorBarFill, { width: `${pct}%`, backgroundColor: sectorColors[i % sectorColors.length] }]} />
                </View>
                <Text style={styles.sectorPct}>{pct.toFixed(1)}%</Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Holdings List */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Holdings</Text>
          <TouchableOpacity onPress={() => setShowAdd(!showAdd)}>
            <Text style={styles.addBtn}>{showAdd ? 'Cancel' : '+ Add'}</Text>
          </TouchableOpacity>
        </View>

        {showAdd && (
          <View style={styles.addForm}>
            <TextInput style={styles.input} placeholder="Ticker" placeholderTextColor="#64748b" value={ticker} onChangeText={setTicker} autoCapitalize="characters" />
            <TextInput style={styles.input} placeholder="Quantity" placeholderTextColor="#64748b" value={quantity} onChangeText={setQuantity} keyboardType="decimal-pad" />
            <TextInput style={styles.input} placeholder="Avg Buy Price (PKR)" placeholderTextColor="#64748b" value={price} onChangeText={setPrice} keyboardType="decimal-pad" />
            <TouchableOpacity style={styles.submitBtn} onPress={handleAdd}>
              <Text style={styles.submitBtnText}>Add Holding</Text>
            </TouchableOpacity>
          </View>
        )}

        {holdings.length === 0 && (
          <Text style={styles.emptyText}>No holdings yet. Add your first stock!</Text>
        )}

        {holdings.map(h => {
          const currentPrice = h.current_price ?? h.avg_buy_price;
          const currentValue = currentPrice * h.quantity;
          const costBasis = h.avg_buy_price * h.quantity;
          const gain = currentValue - costBasis;
          const gainPct = costBasis > 0 ? (gain / costBasis) * 100 : 0;
          return (
            <TouchableOpacity key={h.id} style={styles.holdingItem} onLongPress={() => h.id && handleDelete(h.id)}>
              <View style={styles.holdingLeft}>
                <Text style={styles.ticker}>{h.ticker}</Text>
                <Text style={styles.holdingDetail}>{h.quantity} shares @ Rs. {h.avg_buy_price.toFixed(0)}</Text>
              </View>
              <View style={styles.holdingRight}>
                <Text style={styles.holdingValue}>{formatPKR(currentValue)}</Text>
                <Text style={[styles.holdingGain, { color: gain >= 0 ? '#22c55e' : '#ef4444' }]}>
                  {gain >= 0 ? '+' : ''}{formatPKR(gain)} ({gainPct.toFixed(1)}%)
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a1628', padding: 16 },
  summaryCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  summaryLabel: { color: '#94a3b8', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 },
  summaryValue: { color: '#e2e8f0', fontSize: 36, fontWeight: '700', marginVertical: 4 },
  gainText: { fontSize: 16, fontWeight: '600' },
  card: { backgroundColor: '#1e293b', borderRadius: 16, padding: 20, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTitle: { color: '#94a3b8', fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  addBtn: { color: '#3b82f6', fontSize: 15, fontWeight: '600' },
  addForm: { marginBottom: 16 },
  input: {
    backgroundColor: '#334155',
    color: '#e2e8f0',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    fontSize: 15,
  },
  submitBtn: { backgroundColor: '#3b82f6', padding: 12, borderRadius: 10, alignItems: 'center' },
  submitBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  emptyText: { color: '#64748b', textAlign: 'center', paddingVertical: 24 },
  holdingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  holdingLeft: {},
  ticker: { color: '#e2e8f0', fontSize: 16, fontWeight: '600' },
  holdingDetail: { color: '#64748b', fontSize: 12, marginTop: 2 },
  holdingRight: { alignItems: 'flex-end' },
  holdingValue: { color: '#e2e8f0', fontSize: 15, fontWeight: '600' },
  holdingGain: { fontSize: 13, fontWeight: '500', marginTop: 2 },
  sectorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  sectorDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  sectorName: { color: '#94a3b8', fontSize: 13, width: 70 },
  sectorBarBg: {
    flex: 1,
    backgroundColor: '#334155',
    borderRadius: 4,
    height: 8,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  sectorBarFill: { height: '100%', borderRadius: 4 },
  sectorPct: { color: '#94a3b8', fontSize: 12, width: 40, textAlign: 'right' },
});
