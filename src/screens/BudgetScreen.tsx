import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, RefreshControl
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  getIncome, addIncome, deleteIncome, getTotalIncome, getTotalIncomeByMonth,
  getExpenses, addExpense, deleteExpense, getExpenseTotalByMonth,
  getExpenseByCategory, getSetting, setSetting
} from '../database/db';
import { Income, Expense } from '../types';
import { formatPKR, todayLocal } from '../utils/calculators';

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

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor="#3b82f6" />}
    >
      {/* Summary */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>This Month</Text>
            <Text style={[styles.summaryValue, { color: '#22c55e' }]}>{formatPKR(monthlyIncome)}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Spent</Text>
            <Text style={[styles.summaryValue, { color: '#ef4444' }]}>{formatPKR(monthlyExpenses)}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Savings</Text>
            <Text style={[styles.summaryValue, { color: '#3b82f6' }]}>{formatPKR(monthlyIncome - monthlyExpenses)}</Text>
          </View>
        </View>
        <Text style={styles.totalIncomeText}>All-time Income: {formatPKR(totalIncome)}</Text>
        <Text style={[styles.savingsRate, { color: savingsRate >= 20 ? '#22c55e' : '#f59e0b' }]}>
          Savings Rate: {savingsRate.toFixed(1)}%
        </Text>
        {monthlyBudget > 0 && (
          <Text style={[styles.remainingText, { color: remainingBudget >= 0 ? '#22c55e' : '#ef4444' }]}>
            Budget Remaining: {formatPKR(remainingBudget)} / {formatPKR(monthlyBudget)}
          </Text>
        )}
      </View>

      {/* Set Budget */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Monthly Budget</Text>
        <View style={styles.row}>
          <TextInput
            style={[styles.input, { flex: 1, marginRight: 8 }]}
            placeholder="Budget amount"
            placeholderTextColor="#64748b"
            value={budgetInput}
            onChangeText={setBudgetInput}
            keyboardType="decimal-pad"
          />
          <TouchableOpacity style={styles.smallBtn} onPress={handleSetBudget}>
            <Text style={styles.smallBtnText}>Set</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Add Income */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Add Income Source</Text>
        <TextInput style={styles.input} placeholder="Source (e.g. Salary)" placeholderTextColor="#64748b" value={incomeSource} onChangeText={setIncomeSource} />
        <TextInput style={styles.input} placeholder="Amount (PKR)" placeholderTextColor="#64748b" value={incomeAmount} onChangeText={setIncomeAmount} keyboardType="decimal-pad" />
        <TouchableOpacity style={styles.submitBtn} onPress={handleAddIncome}>
          <Text style={styles.submitBtnText}>Add Income</Text>
        </TouchableOpacity>

        {incomes.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Income Sources</Text>
            {incomes.map(inc => (
              <TouchableOpacity key={inc.id} style={styles.listItem} onLongPress={() => {
                Alert.alert('Delete', `Delete ${inc.source}?`, [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: async () => { await deleteIncome(inc.id!); await load(); } },
                ]);
              }}>
                <Text style={styles.listItemLabel}>{inc.source}</Text>
                <Text style={styles.listItemValue}>{formatPKR(inc.amount)}</Text>
              </TouchableOpacity>
            ))}
          </>
        )}
      </View>

      {/* Add Expense */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Add Expense</Text>
        <TextInput style={styles.input} placeholder="Amount (PKR)" placeholderTextColor="#64748b" value={expenseAmount} onChangeText={setExpenseAmount} keyboardType="decimal-pad" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryChip, expenseCategory === cat && styles.categoryChipActive]}
              onPress={() => setExpenseCategory(cat)}
            >
              <Text style={[styles.categoryChipText, expenseCategory === cat && styles.categoryChipTextActive]}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TouchableOpacity style={styles.submitBtn} onPress={handleAddExpense}>
          <Text style={styles.submitBtnText}>Add Expense</Text>
        </TouchableOpacity>
      </View>

      {/* Category Breakdown */}
      {categoryTotals.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Spending by Category</Text>
          {categoryTotals.map(ct => {
            const pct = monthlyExpenses > 0 ? (ct.total / monthlyExpenses) * 100 : 0;
            return (
              <View key={ct.category} style={styles.catRow}>
                <Text style={styles.catName}>{ct.category}</Text>
                <View style={styles.catBarBg}>
                  <View style={[styles.catBarFill, { width: `${pct}%` }]} />
                </View>
                <Text style={styles.catAmount}>{formatPKR(ct.total)}</Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Recent Expenses */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recent Expenses</Text>
        {expenses.slice(0, 10).map(exp => (
          <TouchableOpacity key={exp.id} style={styles.listItem} onLongPress={() => {
            Alert.alert('Delete expense?', '', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: async () => { await deleteExpense(exp.id!); await load(); } },
            ]);
          }}>
            <View>
              <Text style={styles.listItemLabel}>{exp.category} — {exp.date}</Text>
            </View>
            <Text style={styles.listItemValue}>{formatPKR(exp.amount)}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a1628', padding: 16 },
  summaryCard: { backgroundColor: '#1e293b', borderRadius: 16, padding: 20, marginBottom: 12, marginTop: 8 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryItem: { alignItems: 'center' },
  summaryLabel: { color: '#64748b', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 },
  summaryValue: { fontSize: 20, fontWeight: '700', marginTop: 4 },
  savingsRate: { textAlign: 'center', fontSize: 16, fontWeight: '600', marginTop: 12 },
  totalIncomeText: { color: '#64748b', fontSize: 12, textAlign: 'center', marginTop: 8 },
  remainingText: { textAlign: 'center', fontSize: 14, marginTop: 4 },
  card: { backgroundColor: '#1e293b', borderRadius: 16, padding: 20, marginBottom: 12 },
  cardTitle: { color: '#94a3b8', fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center' },
  input: { backgroundColor: '#334155', color: '#e2e8f0', borderRadius: 10, padding: 12, fontSize: 15, marginBottom: 8 },
  smallBtn: { backgroundColor: '#3b82f6', padding: 12, borderRadius: 10 },
  smallBtnText: { color: '#fff', fontWeight: '600' },
  submitBtn: { backgroundColor: '#3b82f6', padding: 12, borderRadius: 10, alignItems: 'center', marginTop: 4 },
  submitBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  sectionTitle: { color: '#64748b', fontSize: 12, fontWeight: '600', marginTop: 16, marginBottom: 8, textTransform: 'uppercase' },
  listItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#334155',
  },
  listItemLabel: { color: '#cbd5e1', fontSize: 14 },
  listItemValue: { color: '#e2e8f0', fontSize: 14, fontWeight: '600' },
  categoryScroll: { marginBottom: 8 },
  categoryChip: {
    backgroundColor: '#334155', paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, marginRight: 8,
  },
  categoryChipActive: { backgroundColor: '#3b82f6' },
  categoryChipText: { color: '#94a3b8', fontSize: 13 },
  categoryChipTextActive: { color: '#fff', fontWeight: '600' },
  catRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  catName: { color: '#94a3b8', fontSize: 13, width: 80 },
  catBarBg: {
    flex: 1, backgroundColor: '#334155', borderRadius: 4, height: 8,
    marginHorizontal: 8, overflow: 'hidden',
  },
  catBarFill: { backgroundColor: '#3b82f6', height: '100%', borderRadius: 4 },
  catAmount: { color: '#e2e8f0', fontSize: 13, fontWeight: '600', width: 80, textAlign: 'right' },
});
