import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView
} from 'react-native';
import {
  calculateCGT, calculateSIP, calculateDHAROI,
  calculateDevaluation, calculateFIRE, formatPKR
} from '../utils/calculators';

function CalculatorCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

export default function CalculatorsScreen() {
  // CGT
  const [cgtBuy, setCgtBuy] = useState('');
  const [cgtSell, setCgtSell] = useState('');
  const [cgtQty, setCgtQty] = useState('');
  const [cgtDays, setCgtDays] = useState('');
  const [cgtResult, setCgtResult] = useState<{ gain: number; tax: number; netGain: number } | null>(null);

  // SIP
  const [sipAmount, setSipAmount] = useState('');
  const [sipReturn, setSipReturn] = useState('12');
  const [sipYears, setSipYears] = useState('10');
  const [sipResult, setSipResult] = useState<{ invested: number; returns: number; totalValue: number; yearlyData: any[] } | null>(null);

  // DHA
  const [dhaBuy, setDhaBuy] = useState('');
  const [dhaValue, setDhaValue] = useState('');
  const [dhaYears, setDhaYears] = useState('');
  const [dhaResult, setDhaResult] = useState<{ totalReturn: number; annualizedReturn: number; gain: number } | null>(null);

  // Devaluation
  const [devAmount, setDevAmount] = useState('');
  const [devPct, setDevPct] = useState('20');
  const [devResult, setDevResult] = useState<{ newValue: number; loss: number; usdEquivalent: number; impliedUsdRate: number } | null>(null);

  // FIRE
  const [fireExpenses, setFireExpenses] = useState('');
  const [fireSavings, setFireSavings] = useState('');
  const [fireMonthly, setFireMonthly] = useState('');
  const [fireReturn, setFireReturn] = useState('10');
  const [fireResult, setFireResult] = useState<{ targetCorpus: number; yearsToFire: number; progressPct: number } | null>(null);

  return (
    <ScrollView style={styles.container}>
      {/* CGT Calculator */}
      <CalculatorCard title="CGT Calculator (PSX Pakistan)">
        <TextInput style={styles.input} placeholder="Buy Price (per share)" placeholderTextColor="#64748b" value={cgtBuy} onChangeText={setCgtBuy} keyboardType="decimal-pad" />
        <TextInput style={styles.input} placeholder="Sell Price (per share)" placeholderTextColor="#64748b" value={cgtSell} onChangeText={setCgtSell} keyboardType="decimal-pad" />
        <TextInput style={styles.input} placeholder="Quantity" placeholderTextColor="#64748b" value={cgtQty} onChangeText={setCgtQty} keyboardType="decimal-pad" />
        <TextInput style={styles.input} placeholder="Holding Days" placeholderTextColor="#64748b" value={cgtDays} onChangeText={setCgtDays} keyboardType="number-pad" />
        <TouchableOpacity style={styles.calcBtn} onPress={() => {
          const b = parseFloat(cgtBuy), s = parseFloat(cgtSell), q = parseFloat(cgtQty), d = parseFloat(cgtDays);
          if (b && s && q && d) setCgtResult(calculateCGT(b, s, q, d));
        }}>
          <Text style={styles.calcBtnText}>Calculate CGT</Text>
        </TouchableOpacity>
        {cgtResult && (
          <View style={styles.resultBox}>
            <Text style={styles.resultText}>Gain: {formatPKR(cgtResult.gain)}</Text>
            <Text style={styles.resultText}>CGT: {formatPKR(cgtResult.tax)}</Text>
            <Text style={[styles.resultText, { color: '#22c55e', fontWeight: '700' }]}>
              Net Gain: {formatPKR(cgtResult.netGain)}
            </Text>
          </View>
        )}
      </CalculatorCard>

      {/* SIP Projection */}
      <CalculatorCard title="SIP Projection">
        <TextInput style={styles.input} placeholder="Monthly Investment (PKR)" placeholderTextColor="#64748b" value={sipAmount} onChangeText={setSipAmount} keyboardType="decimal-pad" />
        <TextInput style={styles.input} placeholder="Expected Annual Return (%)" placeholderTextColor="#64748b" value={sipReturn} onChangeText={setSipReturn} keyboardType="decimal-pad" />
        <TextInput style={styles.input} placeholder="Years" placeholderTextColor="#64748b" value={sipYears} onChangeText={setSipYears} keyboardType="number-pad" />
        <TouchableOpacity style={styles.calcBtn} onPress={() => {
          const a = parseFloat(sipAmount), r = parseFloat(sipReturn), y = parseFloat(sipYears);
          if (a && r && y) setSipResult(calculateSIP(a, r, y));
        }}>
          <Text style={styles.calcBtnText}>Project SIP</Text>
        </TouchableOpacity>
        {sipResult && (
          <View style={styles.resultBox}>
            <Text style={styles.resultText}>Total Invested: {formatPKR(sipResult.invested)}</Text>
            <Text style={styles.resultText}>Expected Returns: {formatPKR(sipResult.returns)}</Text>
            <Text style={[styles.resultText, { color: '#22c55e', fontWeight: '700' }]}>
              Total Value: {formatPKR(sipResult.totalValue)}
            </Text>
            {sipResult.yearlyData.filter((_, i) => i % 5 === 0 || i === sipResult.yearlyData.length - 1).map((d: any) => (
              <Text key={d.year} style={styles.resultSub}>Year {d.year}: Invested {formatPKR(d.invested)} → {formatPKR(d.value)}</Text>
            ))}
          </View>
        )}
      </CalculatorCard>

      {/* DHA Plot ROI */}
      <CalculatorCard title="DHA Plot ROI">
        <TextInput style={styles.input} placeholder="Buy Price (PKR)" placeholderTextColor="#64748b" value={dhaBuy} onChangeText={setDhaBuy} keyboardType="decimal-pad" />
        <TextInput style={styles.input} placeholder="Current Value (PKR)" placeholderTextColor="#64748b" value={dhaValue} onChangeText={setDhaValue} keyboardType="decimal-pad" />
        <TextInput style={styles.input} placeholder="Years Held" placeholderTextColor="#64748b" value={dhaYears} onChangeText={setDhaYears} keyboardType="decimal-pad" />
        <TouchableOpacity style={styles.calcBtn} onPress={() => {
          const b = parseFloat(dhaBuy), v = parseFloat(dhaValue), y = parseFloat(dhaYears);
          if (b && v && y) setDhaResult(calculateDHAROI(b, v, y));
        }}>
          <Text style={styles.calcBtnText}>Calculate ROI</Text>
        </TouchableOpacity>
        {dhaResult && (
          <View style={styles.resultBox}>
            <Text style={styles.resultText}>Total Return: {dhaResult.totalReturn.toFixed(2)}%</Text>
            <Text style={styles.resultText}>Annualized IRR: {dhaResult.annualizedReturn.toFixed(2)}%</Text>
            <Text style={[styles.resultText, { color: '#22c55e', fontWeight: '700' }]}>
              Gain: {formatPKR(dhaResult.gain)}
            </Text>
          </View>
        )}
      </CalculatorCard>

      {/* PKR Devaluation */}
      <CalculatorCard title="PKR Devaluation Scenario">
        <TextInput style={styles.input} placeholder="Current PKR Portfolio Value" placeholderTextColor="#64748b" value={devAmount} onChangeText={setDevAmount} keyboardType="decimal-pad" />
        <TextInput style={styles.input} placeholder="Devaluation % (e.g. 20)" placeholderTextColor="#64748b" value={devPct} onChangeText={setDevPct} keyboardType="decimal-pad" />
        <TouchableOpacity style={styles.calcBtn} onPress={() => {
          const a = parseFloat(devAmount), p = parseFloat(devPct);
          if (a && p) setDevResult(calculateDevaluation(a, p));
        }}>
          <Text style={styles.calcBtnText}>Simulate</Text>
        </TouchableOpacity>
        {devResult && (
          <View style={styles.resultBox}>
            <Text style={styles.resultText}>Current USD Value: ${devResult.usdEquivalent.toFixed(2)}</Text>
            <Text style={styles.resultText}>New PKR Value: {formatPKR(devResult.newValue)}</Text>
            <Text style={[styles.resultText, { color: '#ef4444', fontWeight: '700' }]}>
              Loss: {formatPKR(devResult.loss)}
            </Text>
            <Text style={styles.resultText}>Implied USD/PKR: Rs. {devResult.impliedUsdRate.toFixed(2)}</Text>
          </View>
        )}
      </CalculatorCard>

      {/* FIRE Calculator */}
      <CalculatorCard title="FIRE Calculator">
        <TextInput style={styles.input} placeholder="Monthly Expenses (PKR)" placeholderTextColor="#64748b" value={fireExpenses} onChangeText={setFireExpenses} keyboardType="decimal-pad" />
        <TextInput style={styles.input} placeholder="Current Savings (PKR)" placeholderTextColor="#64748b" value={fireSavings} onChangeText={setFireSavings} keyboardType="decimal-pad" />
        <TextInput style={styles.input} placeholder="Monthly Savings (PKR)" placeholderTextColor="#64748b" value={fireMonthly} onChangeText={setFireMonthly} keyboardType="decimal-pad" />
        <TextInput style={styles.input} placeholder="Expected Return %" placeholderTextColor="#64748b" value={fireReturn} onChangeText={setFireReturn} keyboardType="decimal-pad" />
        <TouchableOpacity style={styles.calcBtn} onPress={() => {
          const e = parseFloat(fireExpenses), s = parseFloat(fireSavings), m = parseFloat(fireMonthly), r = parseFloat(fireReturn);
          if (e && m >= 0 && s >= 0 && r) setFireResult(calculateFIRE(e, s || 0, m || 0, r));
        }}>
          <Text style={styles.calcBtnText}>Calculate FIRE</Text>
        </TouchableOpacity>
        {fireResult && (
          <View style={styles.resultBox}>
            <Text style={styles.resultText}>FIRE Target: {formatPKR(fireResult.targetCorpus)}</Text>
            <Text style={styles.resultText}>Progress: {fireResult.progressPct.toFixed(1)}%</Text>
            <Text style={[styles.resultText, { color: '#3b82f6', fontWeight: '700' }]}>
              {fireResult.yearsToFire === 0
                ? '🎉 You have reached FIRE!'
                : fireResult.yearsToFire > 0
                  ? `${fireResult.yearsToFire} years to FIRE`
                  : 'Cannot reach FIRE at current rate'}
            </Text>
          </View>
        )}
      </CalculatorCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a1628', padding: 16 },
  card: { backgroundColor: '#1e293b', borderRadius: 16, padding: 20, marginBottom: 12, marginTop: 4 },
  cardTitle: { color: '#94a3b8', fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  input: { backgroundColor: '#334155', color: '#e2e8f0', borderRadius: 10, padding: 12, fontSize: 15, marginBottom: 8 },
  calcBtn: { backgroundColor: '#3b82f6', padding: 12, borderRadius: 10, alignItems: 'center', marginTop: 4 },
  calcBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  resultBox: { backgroundColor: '#0f172a', borderRadius: 10, padding: 14, marginTop: 12 },
  resultText: { color: '#cbd5e1', fontSize: 14, marginBottom: 4 },
  resultSub: { color: '#64748b', fontSize: 12, marginTop: 2 },
});
