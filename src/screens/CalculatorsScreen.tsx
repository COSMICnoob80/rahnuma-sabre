import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView
} from 'react-native';
import {
  calculateCGT, calculateSIP, calculateAssetROI,
  calculateDevaluation, calculateFIRE, formatPKR,
  CgtResult, CgtTranche,
} from '../utils/calculators';

function CalculatorCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

const TRANCHE_OPTIONS: { label: string; tranche: CgtTranche; sampleDate: string }[] = [
  { label: 'On/after Jul 2024', tranche: 'flat_post_2024', sampleDate: '2025-01-01' },
  { label: 'Jul 2022 – Jun 2024', tranche: 'progressive_2022_2024', sampleDate: '2023-01-01' },
  { label: 'Jul 2013 – Jun 2022', tranche: 'legacy_2013_2022', sampleDate: '2018-01-01' },
  { label: 'Before Jul 2013', tranche: 'exempt_pre_2013', sampleDate: '2010-01-01' },
];

export default function CalculatorsScreen() {
  // CGT
  const [cgtBuy, setCgtBuy] = useState('');
  const [cgtSell, setCgtSell] = useState('');
  const [cgtQty, setCgtQty] = useState('');
  const [cgtDays, setCgtDays] = useState('');
  const [cgtDate, setCgtDate] = useState('2025-01-01');
  const [cgtTranche, setCgtTranche] = useState<CgtTranche>('flat_post_2024');
  const [cgtResult, setCgtResult] = useState<CgtResult | null>(null);

  // SIP
  const [sipAmount, setSipAmount] = useState('');
  const [sipReturn, setSipReturn] = useState('12');
  const [sipYears, setSipYears] = useState('10');
  const [sipResult, setSipResult] = useState<{ invested: number; returns: number; totalValue: number; yearlyData: any[] } | null>(null);

  // Asset ROI
  const [assetBuy, setAssetBuy] = useState('');
  const [assetValue, setAssetValue] = useState('');
  const [assetYears, setAssetYears] = useState('');
  const [assetResult, setAssetResult] = useState<{ totalReturn: number; annualizedReturn: number; gain: number } | null>(null);

  // Devaluation
  const [devAmount, setDevAmount] = useState('');
  const [devPct, setDevPct] = useState('20');
  const [devRate, setDevRate] = useState('280');
  const [devResult, setDevResult] = useState<{ newValue: number; loss: number; usdEquivalent: number; impliedUsdRate: number } | null>(null);

  // FIRE
  const [fireExpenses, setFireExpenses] = useState('');
  const [fireSavings, setFireSavings] = useState('');
  const [fireMonthly, setFireMonthly] = useState('');
  const [fireReturn, setFireReturn] = useState('10');
  const [fireInflation, setFireInflation] = useState('8');
  const [fireSwr, setFireSwr] = useState('4');
  const [fireResult, setFireResult] = useState<{ targetCorpus: number; yearsToFire: number; progressPct: number; realReturn: number } | null>(null);

  const selectTranche = (option: typeof TRANCHE_OPTIONS[number]) => {
    setCgtTranche(option.tranche);
    setCgtDate(option.sampleDate);
  };

  return (
    <ScrollView style={styles.container}>
      <CalculatorCard title="CGT Calculator (PSX Pakistan)">
        <Text style={styles.hint}>
          Capital gains tax depends on when you bought, not just how long you held. Pick the acquisition window, or type the exact date.
        </Text>
        <View style={styles.trancheRow}>
          {TRANCHE_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.tranche}
              style={[styles.trancheChip, cgtTranche === option.tranche && styles.trancheChipActive]}
              onPress={() => selectTranche(option)}
            >
              <Text style={[styles.trancheChipText, cgtTranche === option.tranche && styles.trancheChipTextActive]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput style={styles.input} placeholder="Buy Price (per share)" placeholderTextColor="#64748b" value={cgtBuy} onChangeText={setCgtBuy} keyboardType="decimal-pad" />
        <TextInput style={styles.input} placeholder="Sell Price (per share)" placeholderTextColor="#64748b" value={cgtSell} onChangeText={setCgtSell} keyboardType="decimal-pad" />
        <TextInput style={styles.input} placeholder="Quantity" placeholderTextColor="#64748b" value={cgtQty} onChangeText={setCgtQty} keyboardType="decimal-pad" />
        <TextInput style={styles.input} placeholder="Holding Days" placeholderTextColor="#64748b" value={cgtDays} onChangeText={setCgtDays} keyboardType="number-pad" />
        <TextInput
          style={styles.input}
          placeholder="Acquisition date (YYYY-MM-DD)"
          placeholderTextColor="#64748b"
          value={cgtDate}
          onChangeText={(value) => {
            setCgtDate(value);
            setCgtResult(null);
          }}
          autoCapitalize="none"
        />
        <TouchableOpacity style={styles.calcBtn} onPress={() => {
          const b = parseFloat(cgtBuy), s = parseFloat(cgtSell), q = parseFloat(cgtQty), d = parseFloat(cgtDays);
          if (!b || !s || !q || !d) return;
          setCgtResult(calculateCGT(b, s, q, d, cgtDate));
        }}>
          <Text style={styles.calcBtnText}>Calculate CGT</Text>
        </TouchableOpacity>
        {cgtResult && (
          <View style={styles.resultBox}>
            <Text style={styles.resultText}>Gain: {formatPKR(cgtResult.gain)}</Text>
            <Text style={styles.resultText}>Applicable rate: {(cgtResult.rate * 100).toFixed(2)}%</Text>
            <Text style={styles.resultText}>CGT: {formatPKR(cgtResult.tax)}</Text>
            <Text style={[styles.resultText, { color: '#22c55e', fontWeight: '700' }]}>
              Net Gain: {formatPKR(cgtResult.netGain)}
            </Text>
            <Text style={styles.resultSub}>{cgtResult.note}</Text>
          </View>
        )}
      </CalculatorCard>

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

      <CalculatorCard title="Asset ROI Calculator">
        <TextInput style={styles.input} placeholder="Purchase Price (PKR)" placeholderTextColor="#64748b" value={assetBuy} onChangeText={setAssetBuy} keyboardType="decimal-pad" />
        <TextInput style={styles.input} placeholder="Current/Future Value (PKR)" placeholderTextColor="#64748b" value={assetValue} onChangeText={setAssetValue} keyboardType="decimal-pad" />
        <TextInput style={styles.input} placeholder="Years Held" placeholderTextColor="#64748b" value={assetYears} onChangeText={setAssetYears} keyboardType="decimal-pad" />
        <TouchableOpacity style={styles.calcBtn} onPress={() => {
          const b = parseFloat(assetBuy), v = parseFloat(assetValue), y = parseFloat(assetYears);
          if (b && v && y) setAssetResult(calculateAssetROI(b, v, y));
        }}>
          <Text style={styles.calcBtnText}>Calculate ROI</Text>
        </TouchableOpacity>
        {assetResult && (
          <View style={styles.resultBox}>
            <Text style={styles.resultSub}>Works for property, gold, any appreciating asset</Text>
            <Text style={styles.resultText}>Total Return: {assetResult.totalReturn.toFixed(2)}%</Text>
            <Text style={styles.resultText}>Annualized IRR: {assetResult.annualizedReturn.toFixed(2)}%</Text>
            <Text style={[styles.resultText, { color: '#22c55e', fontWeight: '700' }]}>
              Gain: {formatPKR(assetResult.gain)}
            </Text>
          </View>
        )}
      </CalculatorCard>

      <CalculatorCard title="PKR Devaluation Scenario">
        <TextInput style={styles.input} placeholder="Current PKR Portfolio Value" placeholderTextColor="#64748b" value={devAmount} onChangeText={setDevAmount} keyboardType="decimal-pad" />
        <TextInput style={styles.input} placeholder="Devaluation % (e.g. 20)" placeholderTextColor="#64748b" value={devPct} onChangeText={setDevPct} keyboardType="decimal-pad" />
        <TextInput style={styles.input} placeholder="Current USD/PKR rate" placeholderTextColor="#64748b" value={devRate} onChangeText={setDevRate} keyboardType="decimal-pad" />
        <TouchableOpacity style={styles.calcBtn} onPress={() => {
          const a = parseFloat(devAmount), p = parseFloat(devPct), r = parseFloat(devRate);
          if (a && p && r) setDevResult(calculateDevaluation(a, p, r));
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

      <CalculatorCard title="FIRE Calculator">
        <TextInput style={styles.input} placeholder="Monthly Expenses (PKR)" placeholderTextColor="#64748b" value={fireExpenses} onChangeText={setFireExpenses} keyboardType="decimal-pad" />
        <TextInput style={styles.input} placeholder="Current Corpus (PKR)" placeholderTextColor="#64748b" value={fireSavings} onChangeText={setFireSavings} keyboardType="decimal-pad" />
        <TextInput style={styles.input} placeholder="Monthly Savings (PKR)" placeholderTextColor="#64748b" value={fireMonthly} onChangeText={setFireMonthly} keyboardType="decimal-pad" />
        <TextInput style={styles.input} placeholder="Expected Return %" placeholderTextColor="#64748b" value={fireReturn} onChangeText={setFireReturn} keyboardType="decimal-pad" />
        <TextInput style={styles.input} placeholder="Inflation %" placeholderTextColor="#64748b" value={fireInflation} onChangeText={setFireInflation} keyboardType="decimal-pad" />
        <TextInput style={styles.input} placeholder="Withdrawal Rate % (default 4)" placeholderTextColor="#64748b" value={fireSwr} onChangeText={setFireSwr} keyboardType="decimal-pad" />
        <TouchableOpacity style={styles.calcBtn} onPress={() => {
          const e = parseFloat(fireExpenses), s = parseFloat(fireSavings), m = parseFloat(fireMonthly);
          const r = parseFloat(fireReturn), i = parseFloat(fireInflation) || 0, w = parseFloat(fireSwr) || 4;
          if (!e || isNaN(s) || isNaN(m) || !r) return;
          setFireResult(calculateFIRE(e, s || 0, m || 0, r, i, w));
        }}>
          <Text style={styles.calcBtnText}>Calculate FIRE</Text>
        </TouchableOpacity>
        {fireResult && (
          <View style={styles.resultBox}>
            <Text style={styles.resultText}>FIRE Target: {formatPKR(fireResult.targetCorpus)}</Text>
            <Text style={styles.resultText}>Real return after inflation: {fireResult.realReturn.toFixed(2)}%</Text>
            <Text style={styles.resultText}>Progress: {fireResult.progressPct.toFixed(1)}%</Text>
            <Text style={[styles.resultText, { color: '#3b82f6', fontWeight: '700' }]}>
              {fireResult.yearsToFire === 0
                ? 'You have reached FIRE!'
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
  hint: { color: '#64748b', fontSize: 12, marginBottom: 10, lineHeight: 16 },
  trancheRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  trancheChip: {
    backgroundColor: '#334155',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#475569',
  },
  trancheChipActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  trancheChipText: { color: '#94a3b8', fontSize: 11, fontWeight: '600' },
  trancheChipTextActive: { color: '#fff' },
  input: { backgroundColor: '#334155', color: '#e2e8f0', borderRadius: 10, padding: 12, fontSize: 15, marginBottom: 8 },
  calcBtn: { backgroundColor: '#3b82f6', padding: 12, borderRadius: 10, alignItems: 'center', marginTop: 4 },
  calcBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  resultBox: { backgroundColor: '#0f172a', borderRadius: 10, padding: 14, marginTop: 12 },
  resultText: { color: '#cbd5e1', fontSize: 14, marginBottom: 4 },
  resultSub: { color: '#64748b', fontSize: 12, marginTop: 2, lineHeight: 16 },
});
