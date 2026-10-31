import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getHoldings, addHolding, deleteHolding } from '../database/db';
import { Holding } from '../types';
import { formatPKR } from '../utils/calculators';
import { refreshAllPrices, priceFreshness } from '../services/psxService';
import { findSymbol, searchSymbols } from '../services/psxSymbols';
import type { PsxSymbol } from '../services/psxSymbols';
import { colors } from '../theme/colors';
import { spacing, radius } from '../theme/spacing';
import { typography } from '../theme/typography';
import { Card, Button, Input, EmptyState, LoadingState } from '../components';
import { fonts } from '../utils/fonts';

function getSector(ticker: string): string {
  return findSymbol(ticker)?.sector ?? 'Other';
}

export default function PortfolioScreen() {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [ticker, setTicker] = useState('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [tickerOpen, setTickerOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setHoldings(await getHoldings());
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const matches = tickerOpen ? searchSymbols(ticker, 6) : [];

  const handleTickerChange = (value: string) => {
    setTicker(value);
    setTickerOpen(value.trim().length > 0);
    setErrors((prev) => ({ ...prev, ticker: '' }));
  };

  const selectSymbol = (row: PsxSymbol) => {
    setTicker(row.symbol);
    setTickerOpen(false);
    setErrors((prev) => ({ ...prev, ticker: '' }));
  };

  const clearError = (field: string) => {
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleAdd = async () => {
    const q = parseFloat(quantity);
    const p = parseFloat(price);
    const known = findSymbol(ticker);
    const next: Record<string, string> = {};

    if (!ticker.trim()) {
      next.ticker = 'Pick a ticker from the list.';
    } else if (!known) {
      next.ticker = 'Unknown ticker — pick from the list.';
    }
    if (!quantity.trim() || isNaN(q) || q <= 0) {
      next.quantity = 'Enter a quantity greater than 0.';
    }
    if (!price.trim() || isNaN(p) || p <= 0) {
      next.price = 'Enter a buy price greater than 0.';
    }
    if (purchaseDate && Number.isNaN(Date.parse(purchaseDate))) {
      next.purchaseDate = 'Use YYYY-MM-DD, or leave the date blank.';
    }

    setErrors(next);
    if (Object.keys(next).length > 0 || !known) return;

    await addHolding({
      ticker: known.symbol,
      quantity: q,
      avg_buy_price: p,
      current_price: null,
      last_fetched: null,
      purchase_date: purchaseDate || null,
    });
    setTicker('');
    setQuantity('');
    setPrice('');
    setPurchaseDate('');
    setTickerOpen(false);
    setErrors({});
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

  const handleRefreshPrices = async () => {
    setRefreshing(true);
    const result = await refreshAllPrices();
    await load();
    setRefreshing(false);
    const staleNote = result.stale > 0 ? ` ${result.stale} kept their last known price and are marked stale.` : '';
    Alert.alert('Prices Updated', `${result.success} updated, ${result.failed} failed.${staleNote}`);
  };

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
  const sectorColors = [colors.accent, colors.success, colors.warning, colors.danger, '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1'];

  if (loading) {
    return (
      <View style={styles.container}>
        <LoadingState label="Loading portfolio..." />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
    >
      {/* Summary */}
      <Card style={styles.summaryCard}>
        <Text style={typography.sectionTitle}>Portfolio Value</Text>
        <Text style={typography.display}>{formatPKR(totalValue)}</Text>
        <Text style={[typography.bodyStrong, { color: totalGain >= 0 ? colors.success : colors.danger }]}>
          {totalGain >= 0 ? '+' : ''}{formatPKR(totalGain)} ({totalGainPct.toFixed(2)}%)
        </Text>
        <Button label="Refresh Prices" onPress={handleRefreshPrices} style={styles.refreshBtn} />
      </Card>

      {/* Pie Chart (simple sector bars) */}
      {holdings.length > 0 && (
        <Card>
          <Text style={typography.sectionTitle}>Allocation by Sector</Text>
          {Object.entries(sectorData).map(([sector, val], i) => {
            const pct = (val / totalValue) * 100;
            return (
              <View key={sector} style={styles.sectorRow}>
                <View style={[styles.sectorDot, { backgroundColor: sectorColors[i % sectorColors.length] }]} />
                <Text style={typography.caption}>{sector}</Text>
                <View style={styles.sectorBarBg}>
                  <View style={[styles.sectorBarFill, { width: `${pct}%`, backgroundColor: sectorColors[i % sectorColors.length] }]} />
                </View>
                <Text style={typography.caption}>{pct.toFixed(1)}%</Text>
              </View>
            );
          })}
        </Card>
      )}

      {/* Holdings List */}
      <Card>
        <View style={styles.cardHeader}>
          <Text style={typography.sectionTitle}>Holdings</Text>
          <TouchableOpacity onPress={() => { setShowAdd(!showAdd); setTickerOpen(false); setErrors({}); }}>
            <Text style={styles.addBtn}>{showAdd ? 'Cancel' : '+ Add'}</Text>
          </TouchableOpacity>
        </View>

        {showAdd && (
          <View style={styles.addForm}>
            <Input
              placeholder="Ticker"
              value={ticker}
              onChangeText={handleTickerChange}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            {tickerOpen && matches.length > 0 && (
              <View style={styles.suggestionList}>
                {matches.map((row) => (
                  <TouchableOpacity
                    key={row.symbol}
                    style={styles.suggestionRow}
                    onPress={() => selectSymbol(row)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.suggestionLabel} numberOfLines={1}>
                      {row.symbol} — {row.name}
                    </Text>
                    <View style={styles.sectorChip}>
                      <Text style={styles.sectorChipText}>{row.sector}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            {!!errors.ticker && <Text style={styles.errorText}>{errors.ticker}</Text>}
            <Input
              placeholder="Quantity"
              value={quantity}
              onChangeText={(value) => { setQuantity(value); clearError('quantity'); }}
              keyboardType="decimal-pad"
            />
            {!!errors.quantity && <Text style={styles.errorText}>{errors.quantity}</Text>}
            <Input
              placeholder="Avg Buy Price (PKR)"
              value={price}
              onChangeText={(value) => { setPrice(value); clearError('price'); }}
              keyboardType="decimal-pad"
            />
            {!!errors.price && <Text style={styles.errorText}>{errors.price}</Text>}
            <Input
              placeholder="Purchase date (YYYY-MM-DD, optional)"
              value={purchaseDate}
              onChangeText={(value) => { setPurchaseDate(value); clearError('purchaseDate'); }}
              autoCapitalize="none"
            />
            {!!errors.purchaseDate && <Text style={styles.errorText}>{errors.purchaseDate}</Text>}
            <Text style={typography.small}>The purchase date decides your capital gains tax rate.</Text>
            <Button label="Add Holding" onPress={handleAdd} />
          </View>
        )}
        {holdings.length === 0 && (
          <EmptyState message="No holdings yet" hint="Add your first stock to get started." />
        )}
        {holdings.map(h => {
          const currentPrice = h.current_price ?? h.avg_buy_price;
          const currentValue = currentPrice * h.quantity;
          const costBasis = h.avg_buy_price * h.quantity;
          const gain = currentValue - costBasis;
          const gainPct = costBasis > 0 ? (gain / costBasis) * 100 : 0;
          const freshness = priceFreshness(h.last_fetched);
          return (
            <TouchableOpacity key={h.id} style={styles.holdingItem} onLongPress={() => h.id && handleDelete(h.id)}>
              <View style={styles.holdingLeft}>
                <Text style={typography.bodyStrong}>{h.ticker}</Text>
                <Text style={typography.small}>{h.quantity} shares @ Rs. {h.avg_buy_price.toFixed(0)}</Text>
                <Text style={[styles.freshnessLabel, freshness.stale && styles.freshnessStale]}>
                  {freshness.label}
                  {!h.current_price ? ' · showing buy price' : ''}
                </Text>
              </View>
              <View style={styles.holdingRight}>
                <Text style={typography.bodyStrong}>{formatPKR(currentValue)}</Text>
                <Text style={[typography.captionStrong, { color: gain >= 0 ? colors.success : colors.danger }]}>
                  {gain >= 0 ? '+' : ''}{formatPKR(gain)} ({gainPct.toFixed(1)}%)
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  summaryCard: {
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  refreshBtn: {
    marginTop: spacing.md,
    alignSelf: 'stretch',
  },
  addBtn: { color: colors.accent, fontSize: 15, fontFamily: fonts.bold },
  addForm: { marginBottom: spacing.lg },
  suggestionList: {
    backgroundColor: colors.surfaceSunken,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    marginTop: -spacing.sm,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  suggestionLabel: { flex: 1, color: colors.textPrimary, fontSize: 13, fontFamily: fonts.regular, marginRight: spacing.sm },
  sectorChip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  sectorChipText: { color: colors.textSecondary, fontSize: 10, fontFamily: fonts.bold },
  errorText: { color: colors.danger, fontSize: 12, fontFamily: fonts.regular, marginTop: -spacing.xs, marginBottom: spacing.sm },
  freshnessLabel: { color: colors.success, fontSize: 10, marginTop: 3, fontFamily: fonts.regular },
  freshnessStale: { color: colors.warning },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  holdingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  holdingLeft: {},
  holdingRight: { alignItems: 'flex-end' },
  sectorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  sectorDot: { width: 10, height: 10, borderRadius: 5, marginRight: spacing.sm },
  sectorBarBg: {
    flex: 1,
    backgroundColor: colors.border,
    borderRadius: 4,
    height: 8,
    marginHorizontal: spacing.sm,
    overflow: 'hidden',
  },
  sectorBarFill: { height: '100%', borderRadius: 4 },
});
