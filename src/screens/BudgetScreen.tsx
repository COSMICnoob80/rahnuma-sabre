import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert, RefreshControl, TouchableOpacity
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  getIncome, addIncome, deleteIncome, getTotalIncome, getTotalIncomeByMonth,
  getExpenses, addExpense, deleteExpense, getExpenseTotalByMonth,
  getExpenseByCategory, getSetting, setSetting
} from '../database/db';
import { Income, Expense } from '../types';
import { formatPKR, todayLocal } from '../utils/calculators';
import { colors } from '../theme/colors';
import { spacing, radius } from '../theme/spacing';
import { typography } from '../theme/typography';
import { Card, Button, Input, Chip, EmptyState, LoadingState } from '../components';
import { fonts } from '../utils/fonts';

const CATEGORIES = ['rent', 'food', 'transport', 'medical', 'misc', 'utilities', 'entertainment', 'education'];

export default function BudgetScreen() {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [monthlyExpenses, setMonthlyExpenses] = useState(0);
  const [categoryTotals, setCategoryTotals] = useState<{ category: string; total: number }[]>([]);
  const [monthlyBudget, setMonthlyBudget] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form state
  const [incomeSource, setIncomeSource] = useState('');
  const [incomeAmount, setIncomeAmount] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState(CATEGORIES[0]);
  const [budgetInput, setBudgetInput] = useState('');

  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const load = useCallback(async () => {
    setIncomes(await getIncome());
    setExpenses(await getExpenses());
    setTotalIncome(await getTotalIncome());
    setMonthlyIncome(await getTotalIncomeByMonth(month));
    setMonthlyExpenses(await getExpenseTotalByMonth(month));
    setCategoryTotals(await getExpenseByCategory(month));
    const b = await getSetting('monthly_budget');
    const bv = b ? parseFloat(b) : 0;
    setMonthlyBudget(bv);
    setBudgetInput(bv.toString());
    setLoading(false);
  }, [month]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleAddIncome = async () => {
    if (!incomeSource || !incomeAmount) { Alert.alert('Fill all fields'); return; }
    const a = parseFloat(incomeAmount);
    if (isNaN(a) || a <= 0) { Alert.alert('Invalid amount'); return; }
    await addIncome({ source: incomeSource, amount: a });
    setIncomeSource('');
    setIncomeAmount('');
    await load();
  };

  const handleAddExpense = async () => {
    if (!expenseAmount) { Alert.alert('Enter amount'); return; }
    const a = parseFloat(expenseAmount);
    if (isNaN(a) || a <= 0) { Alert.alert('Invalid amount'); return; }
    await addExpense({ amount: a, category: expenseCategory, date: todayLocal() });
    setExpenseAmount('');
    await load();
  };

  const handleSetBudget = async () => {
    const b = parseFloat(budgetInput);
    if (isNaN(b) || b <= 0) { Alert.alert('Invalid budget'); return; }
    await setSetting('monthly_budget', b.toString());
    setMonthlyBudget(b);
    Alert.alert('Budget set!');
  };

  const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0;
  const remainingBudget = monthlyBudget > 0 ? monthlyBudget - monthlyExpenses : 0;

  if (loading) {
    return (
      <View style={styles.container}>
        <LoadingState label="Loading budget..." />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor={colors.accent} />}
    >
      {/* Summary */}
      <Card style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={typography.small}>This Month</Text>
            <Text style={[styles.summaryValue, { color: colors.success }]}>{formatPKR(monthlyIncome)}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={typography.small}>Spent</Text>
            <Text style={[styles.summaryValue, { color: colors.danger }]}>{formatPKR(monthlyExpenses)}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={typography.small}>Savings</Text>
            <Text style={[styles.summaryValue, { color: colors.accent }]}>{formatPKR(monthlyIncome - monthlyExpenses)}</Text>
          </View>
        </View>
        <Text style={typography.small}>All-time Income: {formatPKR(totalIncome)}</Text>
        <Text style={[typography.bodyStrong, { textAlign: 'center', color: savingsRate >= 20 ? colors.success : colors.warning }]}>
          Savings Rate: {savingsRate.toFixed(1)}%
        </Text>
        {monthlyBudget > 0 && (
          <Text style={[typography.caption, { textAlign: 'center', color: remainingBudget >= 0 ? colors.success : colors.danger }]}>
            Budget Remaining: {formatPKR(remainingBudget)} / {formatPKR(monthlyBudget)}
          </Text>
        )}
      </Card>

      {/* Set Budget */}
      <Card>
        <Text style={typography.sectionTitle}>Monthly Budget</Text>
        <View style={styles.row}>
          <Input
            style={{ flex: 1, marginRight: spacing.sm }}
            placeholder="Budget amount"
            value={budgetInput}
            onChangeText={setBudgetInput}
            keyboardType="decimal-pad"
          />
          <Button label="Set" onPress={handleSetBudget} />
        </View>
      </Card>

      {/* Add Income */}
      <Card>
        <Text style={typography.sectionTitle}>Add Income Source</Text>
        <Input placeholder="Source (e.g. Salary)" value={incomeSource} onChangeText={setIncomeSource} />
        <Input placeholder="Amount (PKR)" value={incomeAmount} onChangeText={setIncomeAmount} keyboardType="decimal-pad" />
        <Button label="Add Income" onPress={handleAddIncome} />

        {incomes.length > 0 && (
          <>
            <Text style={[typography.captionStrong, { color: colors.textMuted, marginTop: spacing.lg, marginBottom: spacing.sm, textTransform: 'uppercase' }]}>Income Sources</Text>
            {incomes.map(inc => (
              <TouchableOpacity key={inc.id} style={styles.listItem} onLongPress={() => {
                Alert.alert('Delete', `Delete ${inc.source}?`, [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: async () => { await deleteIncome(inc.id!); await load(); } },
                ]);
              }}>
                <Text style={typography.body}>{inc.source}</Text>
                <Text style={typography.bodyStrong}>{formatPKR(inc.amount)}</Text>
              </TouchableOpacity>
            ))}
          </>
        )}
      </Card>

      {/* Add Expense */}
      <Card>
        <Text style={typography.sectionTitle}>Add Expense</Text>
        <Input placeholder="Amount (PKR)" value={expenseAmount} onChangeText={setExpenseAmount} keyboardType="decimal-pad" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {CATEGORIES.map(cat => (
            <Chip
              key={cat}
              label={cat.charAt(0).toUpperCase() + cat.slice(1)}
              selected={expenseCategory === cat}
              onPress={() => setExpenseCategory(cat)}
            />
          ))}
        </ScrollView>
        <Button label="Add Expense" onPress={handleAddExpense} />
      </Card>

      {/* Category Breakdown */}
      {categoryTotals.length > 0 && (
        <Card>
          <Text style={typography.sectionTitle}>Spending by Category</Text>
          {categoryTotals.map(ct => {
            const pct = monthlyExpenses > 0 ? (ct.total / monthlyExpenses) * 100 : 0;
            return (
              <View key={ct.category} style={styles.catRow}>
                <Text style={typography.caption}>{ct.category}</Text>
                <View style={styles.catBarBg}>
                  <View style={[styles.catBarFill, { width: `${pct}%` }]} />
                </View>
                <Text style={typography.captionStrong}>{formatPKR(ct.total)}</Text>
              </View>
            );
          })}
        </Card>
      )}

      {/* Recent Expenses */}
      <Card>
        <Text style={typography.sectionTitle}>Recent Expenses</Text>
        {expenses.length === 0 && (
          <EmptyState message="No expenses yet" hint="Add your first expense above." />
        )}
        {expenses.slice(0, 10).map(exp => (
          <TouchableOpacity key={exp.id} style={styles.listItem} onLongPress={() => {
            Alert.alert('Delete expense?', '', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: async () => { await deleteExpense(exp.id!); await load(); } },
            ]);
          }}>
            <View>
              <Text style={typography.body}>{exp.category} — {exp.date}</Text>
            </View>
            <Text style={typography.bodyStrong}>{formatPKR(exp.amount)}</Text>
          </TouchableOpacity>
        ))}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  summaryCard: { marginTop: spacing.sm },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryItem: { alignItems: 'center' },
  summaryValue: { fontSize: 20, fontFamily: fonts.bold, marginTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center' },
  listItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  categoryScroll: { marginBottom: spacing.sm },
  catRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  catBarBg: {
    flex: 1, backgroundColor: colors.border, borderRadius: 4, height: 8,
    marginHorizontal: spacing.sm, overflow: 'hidden',
  },
  catBarFill: { backgroundColor: colors.accent, height: '100%', borderRadius: 4 },
});
